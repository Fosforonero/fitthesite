#!/usr/bin/env bash
# ============================================================================
# INFRA-2 — il cancello sull'INSIEME PENDING, non solo sulle sei di 3B
#
# PERCHE'
# -------
# Supabase applica tutto cio' che non e' registrato. Al deploy della 190 non
# partono le sei forward-only del blocco 3B: ne partono SEDICI. Le altre dieci
# vengono da filoni precedenti e da cambiamenti fuori banda, e nessuna di loro
# deve arrivare al vivo soltanto perche' non appartiene a 3B.
#
# Questo gate congela l'insieme intero — versione, impronta, origine, effetto
# atteso, classificazione — e diventa rosso se qualcosa cambia prima del deploy.
#
# La baseline non e' un numero scelto: e' la versione massima presente in
# supabase_migrations.schema_migrations in produzione, letta in sola lettura.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
RADICE="$(cd "$QUI/../../.." && pwd)"
MIG="$RADICE/supabase/migrations"
MANIFESTO="$RADICE/supabase/rollback/MANIFESTO-PENDING-190.tsv"
MODO="${1:-}"

[ -f "$MANIFESTO" ] || { echo "ROSSO: manifesto assente: $MANIFESTO"; exit 1; }

BASELINE="$(grep -oE 'BASELINE LIVE CONGELATA: [0-9]+' "$MANIFESTO" | grep -oE '[0-9]+$')"
if [ -z "$BASELINE" ]; then
  echo "ROSSO: il manifesto non dichiara la baseline live. Senza baseline l'insieme pending non e' definito."
  exit 1
fi

# L'insieme pending, DERIVATO dal disco con la baseline congelata.
pending() {
  ls -1 "$MIG"/*.sql 2>/dev/null | while read -r f; do
    b="$(basename "$f" .sql)"; v="${b%%_*}"
    awk -v v="$v" -v base="$BASELINE" 'BEGIN{exit !(v+0 > base+0)}' || continue
    printf '%s\t%s\n' "$(shasum -a 256 "$f" | cut -c1-64)" "$b"
  done | sort -k2
}

# Le sonde dell'autocontrollo alterano cio' che il gate vede, non il disco.
#
# I DUE BERSAGLI, e perche' sono cambiati il 31/08/2026
# -----------------------------------------------------
# Fino al 30/08 le due sonde erano cablate su F5 (20260825130400) e F6
# (20260825130500), cioe' esattamente le due migration che la 190 ha poi
# escluso. Il giorno dell'esclusione sarebbe successo questo: `grep -v` non
# avrebbe trovato niente da togliere, `sed` niente da riscrivere, le due sonde
# sarebbero uscite 0 e `--autocontrollo` avrebbe dichiarato «il gate non sa
# fallire» — oppure, peggio, qualcuno avrebbe letto quel rosso come un difetto
# del gate invece che come una sonda spuntata.
#
# Ora puntano a due migration che restano nella 190: F1 (le fondamenta del
# registro) e F4 (l'ordine dei lock). Restano DUE bersagli distinti, come
# prima: una sola migration per entrambe renderebbe le due sonde dipendenti
# dallo stesso file.
#
# E soprattutto: ogni sonda VERIFICA DI AVER MORSO. Una sonda che non altera
# niente non e' una prova riuscita, e' una prova che non e' partita — lo
# stesso difetto che M30 ha appena chiuso nel gate 16. Qui fallisce chiusa.
SONDA_EXTRA=""; SONDA_SALTA=""; SONDA_HASH=""
case "$MODO" in
  --sonda-nuova)    SONDA_EXTRA="0000000000000000000000000000000000000000000000000000000000000000	20260826999999_migration_mai_dichiarata" ;;
  --sonda-mancante) SONDA_SALTA="20260825130000_billing_registro_fondamenta" ;;
  --sonda-modificata) SONDA_HASH="20260825130300_billing_ordine_lock_e_gdpr" ;;
  --autocontrollo)
    echo "== autocontrollo: il gate sa diventare rosso? =="
    fallito=0
    for s in --sonda-nuova --sonda-mancante --sonda-modificata; do
      out="$(bash "$0" "$s" 2>&1)"; c=$?
      if [ "$c" -eq 0 ]; then
        echo "  ROSSO  $s: uscito 0. Il gate non sa fallire."
        printf '%s\n' "$out" | sed 's/^/         | /'; fallito=1
      else
        echo "  ok     $s: esce $c, come deve"
      fi
    done
    echo
    [ "$fallito" -ne 0 ] && { echo "ROSSO: l'autocontrollo e' fallito."; exit 1; }
    echo "VERDE: tutte le sonde rendono rosso il gate."; exit 0 ;;
  "") : ;;
  *) echo "ROSSO: argomento sconosciuto: $MODO"; exit 2 ;;
esac

DISCO="$(pending)"
PRIMA="$DISCO"
[ -n "$SONDA_EXTRA" ] && DISCO="$(printf '%s\n%s\n' "$DISCO" "$SONDA_EXTRA" | sort -k2)"
[ -n "$SONDA_SALTA" ] && DISCO="$(printf '%s\n' "$DISCO" | grep -v "$SONDA_SALTA")"
[ -n "$SONDA_HASH" ]  && DISCO="$(printf '%s\n' "$DISCO" | sed "s|^[0-9a-f]\{64\}\(.*$SONDA_HASH\)|deadbeef00000000000000000000000000000000000000000000000000000000\1|")"

# La sonda ha morso? Se il bersaglio non e' piu' nell'insieme pending —
# perche' e' stato escluso, rinominato o gia' registrato — l'alterazione e'
# inerte e il gate resterebbe verde per la ragione sbagliata. Un
# `--autocontrollo` che legge quel verde direbbe «il gate non sa fallire»
# senza saper dire che il difetto sta nella sonda, non nel gate.
if [ -n "$MODO" ] && [ "$DISCO" = "$PRIMA" ]; then
  echo "ROSSO: la sonda $MODO non ha alterato l'insieme pending."
  echo "       Il bersaglio che nomina non e' (piu') fra le migration pending:"
  echo "       la sonda e' spuntata e non sta provando niente sul gate."
  exit 1
fi

DICH="$(grep -v '^#' "$MANIFESTO" | grep -v '^[[:space:]]*$' | awk -F'\t' 'NF>=5 {print $1"\t"$2}' | sort -k2)"

n_disco=$(printf '%s\n' "$DISCO" | grep -c .)
n_dich=$(printf '%s\n' "$DICH"  | grep -c .)
echo "== insieme pending oltre la baseline live congelata $BASELINE =="
echo "   dichiarate nel manifesto: $n_dich    trovate sul disco: $n_disco"

# Un gate che non misura niente non e' verde.
if [ "$n_disco" -eq 0 ] || [ "$n_dich" -eq 0 ]; then
  echo "ROSSO: insieme vuoto da un lato. Il gate non ha misurato niente."
  exit 1
fi

esito=0
# Impronta cambiata, o migration sparita.
while IFS=$'\t' read -r h v; do [ -n "${v:-}" ] || continue
  riga="$(printf '%s\n' "$DISCO" | awk -F'\t' -v v="$v" '$2==v')"
  if [ -z "$riga" ]; then
    echo "  ROSSO  sparita dal disco: ${v}"
    echo "         Il manifesto la dichiara pending, il deploy non la applicherebbe."
    esito=1; continue
  fi
  hd="$(printf '%s' "$riga" | cut -f1)"
  if [ "$hd" != "$h" ]; then
    echo "  ROSSO  impronta cambiata: ${v}"
    echo "         congelata $h"
    echo "         sul disco $hd"
    echo "         Una migration pending modificata dopo il congelamento non e' piu' quella rivista."
    esito=1
  fi
done <<<"$DICH"

# Migration nuova non dichiarata.
while IFS=$'\t' read -r h v; do [ -n "${v:-}" ] || continue
  printf '%s\n' "$DICH" | awk -F'\t' -v v="$v" '$2==v' | grep -q . || {
    echo "  ROSSO  pending NON dichiarata: ${v}"
    echo "         Supabase la applicherebbe al deploy e nessuno l'ha classificata."
    esito=1; }
done <<<"$DISCO"

echo
echo "== classificazione dichiarata =="
grep -v '^#' "$MANIFESTO" | awk -F'\t' 'NF>=5 {print "  " $4 "  " $2}' | sort | sed 's/  */ /2'

echo
if [ "$esito" -ne 0 ]; then
  echo "ROSSO: l'insieme pending non coincide col manifesto congelato. Il deploy si ferma."
  exit 1
fi
echo "VERDE: $n_dich migration pending, tutte dichiarate e con impronta invariata."
