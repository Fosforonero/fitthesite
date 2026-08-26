#!/usr/bin/env bash
# ============================================================================
# INFRA-2 — apply e rollback nelle DUE modalita', su PG17 ricostruito da zero.
#
# PERCHE' DUE MODALITA'
# ---------------------
# Un file .sql si comporta in modo diverso a seconda di come lo esegue il
# runner. In autocommit ogni istruzione si conferma da sola; dentro una
# transazione esterna il file intero e' una transazione, e un `rollback;` al suo
# interno annulla TUTTO, corpo della migration compreso. Provato in un database
# usa-e-getta: nel secondo caso resta zero, e psql esce comunque 0.
#
# La CLI Supabase non espone il controllo della transazione. Non possiamo
# scegliere la modalita', quindi non possiamo escludere quella cattiva: l'unica
# difesa e' essere corretti in entrambe. Questo runner lo pretende.
#
# COSA VERIFICA, per ogni modalita'
#   1. stato iniziale (catena fino a 20260825120009)
#   2. apply, con le postcondizioni vere delle migration
#   3. rollback, con ritorno all'impronta iniziale
#   4. nessun residuo nelle tabelle append-only
#   5. secondo giro apply/rollback deterministico
#
# L'elenco dei rollback si legge dal MANIFESTO, non e' scritto qui.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
RADICE="$(cd "$QUI/../../.." && pwd)"
MIG="$RADICE/supabase/migrations"
ROLL="$RADICE/supabase/rollback"
MANIFESTO="$ROLL/MANIFESTO-3B.txt"
IMPRONTA="$RADICE/supabase/tests/reset-pg17/impronta-completa.sql"
PREAMBOLO="$RADICE/supabase/tests/reset-pg17/00-preambolo-ruoli-supabase.sql"
CONT="${CONT_NAME:-pg17-190-reset}"

[ -f "$MANIFESTO" ] || { echo "ROSSO: manifesto assente"; exit 1; }
DICH="$(grep -v '^#' "$MANIFESTO" | grep -v '^[[:space:]]*$')"
N_DICH=$(printf '%s\n' "$DICH" | grep -c .)
[ "$N_DICH" -gt 0 ] || { echo "ROSSO: manifesto vuoto: niente da esercitare"; exit 1; }

docker exec "$CONT" psql -U postgres -d postgres -tAc "select 1" >/dev/null 2>&1 \
  || { echo "ROSSO: il container $CONT non risponde"; exit 1; }

docker cp "$IMPRONTA" "$CONT":/tmp/imp18.sql >/dev/null

esito=0

# psql_file <db> <file> <modo>  — cattura l'exit code prima di qualunque filtro
psql_file() {
  local db="$1" f="$2" modo="$3" extra=""
  [ "$modo" = "transazione" ] && extra="--single-transaction"
  docker exec -i "$CONT" psql -U postgres -d "$db" -X -q -v ON_ERROR_STOP=1 $extra < "$f" >/tmp/18-ultimo.log 2>&1
  return $?
}

impronta() {
  docker exec "$CONT" psql -U postgres -d "$1" -X -q -f /tmp/imp18.sql 2>&1
}

costruisci_base() {
  local db="$1"
  docker exec "$CONT" psql -U postgres -d postgres -q \
    -c "drop database if exists $db;" -c "create database $db;" >/dev/null 2>&1
  psql_file "$db" "$PREAMBOLO" autocommit || return 1
  local f b v
  for f in "$MIG"/*.sql; do
    b="$(basename "$f" .sql)"; v="${b%%_*}"
    awk -v v="$v" 'BEGIN{exit !(v+0 >= 20260825130000)}' && continue
    psql_file "$db" "$f" autocommit || { echo "    catena: KO su $b"; return 1; }
  done
  return 0
}

applica_sei() {
  local db="$1" modo="$2" f b
  for f in "$MIG"/2026082513*.sql; do
    b="$(basename "$f" .sql)"
    if ! psql_file "$db" "$f" "$modo"; then
      echo "    apply KO: $b (psql $?)"; head -3 /tmp/18-ultimo.log | sed 's/^/       /'
      return 1
    fi
  done
  return 0
}

# I rollback in ordine INVERSO di applicazione, letti dal manifesto.
rollback_sei() {
  local db="$1" modo="$2" v
  while read -r v; do [ -n "$v" ] || continue
    local r="$ROLL/${v}_rollback.sql"
    [ -f "$r" ] || { echo "    rollback assente: $v"; return 1; }
    if ! psql_file "$db" "$r" "$modo"; then
      echo "    rollback KO: $v"; head -3 /tmp/18-ultimo.log | sed 's/^/       /'
      return 1
    fi
  done < <(printf '%s\n' "$DICH" | sort -r)
  return 0
}

# Residui nelle append-only: si confrontano le RIGHE dell'impronta, non i nomi
# delle tabelle.
#
# La prima stesura filtrava `private` per prefisso `billing%` e dichiarava
# sopravvissute due tabelle che esistevano PRIMA delle sei
# (billing_pagamenti_segnalati, billing_tentativi_acquisto). Il confronto
# d'impronta diceva «identica» e il mio filtro diceva «residui»: aveva ragione
# l'impronta. E' la stessa classe di errore contro cui questo file mette in
# guardia, commessa dentro questo file.
righe_impronta() { printf '%s\n' "$1" | grep '^righe '; }

for MODO in autocommit transazione; do
  DB="due_modi_$MODO"
  echo "=================== MODALITA': $MODO ==================="

  if ! costruisci_base "$DB"; then echo "  ROSSO  base non costruita"; esito=1; continue; fi
  A="$(impronta "$DB")"
  echo "  1. stato iniziale: $(printf '%s\n' "$A" | grep -c .) righe d'impronta"

  for GIRO in 1 2; do
    if ! applica_sei "$DB" "$MODO"; then echo "  ROSSO  giro $GIRO: apply fallito"; esito=1; break; fi
    B="$(impronta "$DB")"
    NB=$(printf '%s\n' "$B" | grep -c .)
    NA=$(printf '%s\n' "$A" | grep -c .)
    if [ "$NB" -le "$NA" ]; then
      echo "  ROSSO  giro $GIRO: dopo l'apply l'impronta non e' cresciuta ($NA -> $NB)."
      echo "         Le migration non hanno applicato niente, e psql non se n'e' accorto."
      esito=1; break
    fi
    echo "  2. giro $GIRO apply: $NA -> $NB righe (+$((NB-NA)))"
    [ "$GIRO" -eq 1 ] && printf '%s\n' "$B" > "/tmp/18-dopo-apply-$MODO.txt"

    if ! rollback_sei "$DB" "$MODO"; then echo "  ROSSO  giro $GIRO: rollback fallito"; esito=1; break; fi
    C="$(impronta "$DB")"
    if [ "$C" = "$A" ]; then
      echo "  3. giro $GIRO rollback: impronta identica a quella iniziale"
    else
      echo "  ROSSO  giro $GIRO: il rollback NON riporta all'impronta iniziale."
      diff <(printf '%s\n' "$A") <(printf '%s\n' "$C") | head -8 | sed 's/^/         /'
      esito=1; break
    fi

    if [ "$(righe_impronta "$C")" != "$(righe_impronta "$A")" ]; then
      echo "  ROSSO  giro $GIRO: conteggi delle append-only cambiati dopo il rollback."
      diff <(righe_impronta "$A") <(righe_impronta "$C") | head -6 | sed 's/^/         /'
      esito=1; break
    fi
    echo "  4. giro $GIRO: append-only invariate ($(righe_impronta "$A" | grep -c .) tabelle confrontate riga per riga)"
    [ "$GIRO" -eq 2 ] && echo "  5. secondo giro completato: apply/rollback deterministico"
  done
  docker exec "$CONT" psql -U postgres -d postgres -q -c "drop database if exists $DB;" >/dev/null 2>&1
done

# ── Il confronto FRA le due modalita' ──────────────────────────────────────
#
# Ogni modalita' che torna al proprio punto di partenza non prova che le due
# arrivino allo STESSO schema. Un file con `begin;`/`rollback;` nudi applica il
# proprio corpo in autocommit e lo scarta dentro una transazione esterna, e in
# entrambi i casi psql esce 0 e l'impronta ha lo stesso NUMERO di righe: cambia
# il corpo di una funzione, non il conteggio.
#
# Senza questo confronto il runner sarebbe verde proprio sul difetto per cui e'
# stato scritto.
echo
echo "=================== le due modalita' arrivano allo stesso schema? ==================="
if [ -f /tmp/18-dopo-apply-autocommit.txt ] && [ -f /tmp/18-dopo-apply-transazione.txt ]; then
  if diff -q /tmp/18-dopo-apply-autocommit.txt /tmp/18-dopo-apply-transazione.txt >/dev/null; then
    echo "  ok     impronta post-apply identica nelle due modalita'"
  else
    echo "  ROSSO  le due modalita' NON applicano lo stesso schema:"
    diff /tmp/18-dopo-apply-autocommit.txt /tmp/18-dopo-apply-transazione.txt \
      | grep -E '^[<>]' | head -8 | cut -c1-140 | sed 's/^/         /'
    echo "         Una migration il cui effetto dipende da come il runner la esegue"
    echo "         non e' applicabile in sicurezza: la CLI Supabase non espone il"
    echo "         controllo della transazione, quindi la modalita' non si sceglie."
    esito=1
  fi
else
  echo "  ROSSO  manca l'impronta post-apply di una delle due modalita': niente da confrontare."
  esito=1
fi

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: apply/rollback non equivalenti nelle due modalita'."; exit 1; }
echo "VERDE: $N_DICH forward-only, apply e rollback verdi in autocommit e in transazione esterna, due giri per modalita'."
