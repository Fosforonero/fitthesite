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
# L'ELENCO VIENE DAL MANIFESTO — DA TUTTE E DUE LE PARTI
# ------------------------------------------------------
# Fino al 01/09/2026 i ROLLBACK si leggevano dal manifesto ma l'APPLY era una
# glob cablata, `2026082513*`. Le due cose sono rimaste d'accordo finche' il
# blocco 3B e' stato solo billing; poi il manifesto ha preso 20260827120000 e
# le tre dashboard, la glob non le ha viste, e questo runner ha cominciato a
# eseguire rollback di migration che non aveva applicato. Erano inerti — per
# fortuna, non per costruzione.
#
# Ora l'insieme e' UNO: si applica in ordine crescente cio' che il manifesto
# dichiara, si annulla in ordine inverso lo stesso insieme, e in fondo si
# pretende che l'insieme ESEGUITO coincida con quello DICHIARATO. Un runner
# che dice di esercitare nove file e ne esercita otto e' rosso.
#
# `--dichiara` stampa l'elenco dei file di rollback che questo runner esercita,
# derivandolo dallo stesso codice, senza toccare il database. Serve agli altri
# gate (17 e 87) per non tenere una propria copia dell'elenco: una copia
# invecchia in silenzio, questa no.
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

# I file di rollback che questo runner esercita, derivati dal manifesto.
dichiarazione() {
  local v mancanti=0
  while read -r v; do [ -n "$v" ] || continue
    if [ ! -f "$ROLL/${v}_rollback.sql" ]; then
      echo "MANCA ${v}_rollback.sql" >&2; mancanti=1; continue
    fi
    printf '%s\n' "${v}_rollback.sql"
  done < <(printf '%s\n' "$DICH" | sort)
  return $mancanti
}

if [ "${1:-}" = "--dichiara" ]; then
  # Una dichiarazione vuota, o che nomina file inesistenti, non e' una
  # dichiarazione: chi la consuma resterebbe verde senza aver misurato niente.
  OUT="$(dichiarazione)" || { echo "ROSSO: il manifesto dichiara rollback che non esistono su disco." >&2; exit 1; }
  [ -n "$OUT" ] || { echo "ROSSO: dichiarazione vuota." >&2; exit 1; }
  printf '%s\n' "$OUT"
  exit 0
fi

# Cio' che viene davvero eseguito, per confrontarlo in fondo con cio' che si
# dichiara. Sono due insiemi diversi finche' non si prova che coincidono.
ESEGUITE_APPLY=""
ESEGUITE_ROLLBACK=""

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

# ── LA BASE DEV'ESSERE UNO STATO CHE ESISTE DAVVERO ────────────────────────
#
# La base e' «tutto cio' che sta sotto il confine 3B». Preso alla lettera
# include anche le sei migration che la 190 ha ESCLUSO e che non saranno mai
# registrate: una di loro, 20260825120006, ridefinisce
# public.get_dashboard_snapshot.
#
# Il risultato, misurato il 01/09/2026: la base partiva dal corpo di 120006 —
# uno stato che non esiste in produzione e non esistera' mai — e il rollback
# di 20260901121909, che rimette correttamente il corpo di 20260818084202,
# veniva dichiarato sbagliato perche' non tornava a quella finzione.
#
# Un rollback si giudica sullo stato REALE che deve ripristinare. Quindi la
# base salta cio' che il manifesto pending dichiara «NON REGISTRATE PER
# SCELTA»: quello che resta e' la produzione alla vigilia del blocco 3B.
#
# L'elenco si legge dal manifesto, non e' scritto qui: una copia a mano
# invecchierebbe, ed e' il difetto che il gate 87 ha appena finito di chiudere.
ESCLUSE_PER_SCELTA="$(grep -m1 '^# NON REGISTRATE PER SCELTA:' "$RADICE/supabase/rollback/MANIFESTO-PENDING-190.tsv" \
                      | sed 's/^# NON REGISTRATE PER SCELTA: *//' | tr ' ' '\n' | sed '/^$/d' | sort)"
if [ -z "$ESCLUSE_PER_SCELTA" ]; then
  echo "ROSSO: il manifesto pending non dichiara le migration escluse."
  echo "       Senza quell'elenco la base conterrebbe stati che in produzione non esistono,"
  echo "       e i rollback verrebbero giudicati contro una finzione."
  exit 1
fi

costruisci_base() {
  local db="$1"
  docker exec "$CONT" psql -U postgres -d postgres -q \
    -c "drop database if exists $db;" -c "create database $db;" >/dev/null 2>&1
  psql_file "$db" "$PREAMBOLO" autocommit || return 1
  local f b v saltate=0
  for f in "$MIG"/*.sql; do
    b="$(basename "$f" .sql)"; v="${b%%_*}"
    awk -v v="$v" 'BEGIN{exit !(v+0 >= 20260825130000)}' && continue
    if grep -qxF "$v" <<<"$ESCLUSE_PER_SCELTA"; then saltate=$((saltate+1)); continue; fi
    psql_file "$db" "$f" autocommit || { echo "    catena: KO su $b"; return 1; }
  done
  [ "$saltate" -eq "$(grep -c . <<<"$ESCLUSE_PER_SCELTA")" ] || {
    echo "    base: attese $(grep -c . <<<"$ESCLUSE_PER_SCELTA") esclusioni, saltate $saltate."
    echo "    L'elenco del manifesto nomina versioni che non stanno sul disco: l'esclusione e' fittizia."
    return 1
  }
  echo "  0. base: la produzione alla vigilia del 3B ($saltate escluse per scelta, saltate)"
  return 0
}

applica_manifesto() {
  local db="$1" modo="$2" v f
  while read -r v; do [ -n "$v" ] || continue
    f="$MIG/${v}.sql"
    [ -f "$f" ] || { echo "    migration assente sul disco: $v"; return 1; }
    if ! psql_file "$db" "$f" "$modo"; then
      echo "    apply KO: $v"; head -3 /tmp/18-ultimo.log | sed 's/^/       /'
      return 1
    fi
    ESEGUITE_APPLY="${ESEGUITE_APPLY}${v}
"
  done < <(printf '%s\n' "$DICH" | sort)
  return 0
}

# I rollback in ordine INVERSO di applicazione, letti dal manifesto.
rollback_manifesto() {
  local db="$1" modo="$2" v
  while read -r v; do [ -n "$v" ] || continue
    local r="$ROLL/${v}_rollback.sql"
    [ -f "$r" ] || { echo "    rollback assente: $v"; return 1; }
    if ! psql_file "$db" "$r" "$modo"; then
      echo "    rollback KO: $v"; head -3 /tmp/18-ultimo.log | sed 's/^/       /'
      return 1
    fi
    ESEGUITE_ROLLBACK="${ESEGUITE_ROLLBACK}${v}_rollback.sql
"
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
    if ! applica_manifesto "$DB" "$MODO"; then echo "  ROSSO  giro $GIRO: apply fallito"; esito=1; break; fi
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

    if ! rollback_manifesto "$DB" "$MODO"; then echo "  ROSSO  giro $GIRO: rollback fallito"; esito=1; break; fi
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


# ── L'INSIEME ESEGUITO E' QUELLO DICHIARATO? ───────────────────────────────
#
# Gli altri gate (17 e 87) si fidano di `--dichiara`. Se questo runner
# dichiarasse nove file e ne esercitasse otto, quei gate resterebbero verdi su
# un rollback che nessuno ha mai eseguito: e' il difetto originale di 87,
# spostato di un livello. Qui si chiude il cerchio confrontando la
# DICHIARAZIONE con cio' che le due funzioni hanno davvero eseguito.
echo
echo "=================== l'insieme eseguito e' quello dichiarato? ==================="
DICHIARATI="$(dichiarazione | sort -u)"
ESEG_R="$(printf '%s' "$ESEGUITE_ROLLBACK" | grep -c . || true)"
ESEG_A="$(printf '%s' "$ESEGUITE_APPLY" | grep -c . || true)"
FATTI="$(printf '%s' "$ESEGUITE_ROLLBACK" | sed '/^$/d' | sort -u)"
if [ "$esito" -eq 0 ] && [ "$FATTI" = "$DICHIARATI" ]; then
  echo "  ok     $(printf '%s\n' "$DICHIARATI" | grep -c .) file dichiarati, gli stessi eseguiti"
  echo "         ($ESEG_A apply e $ESEG_R rollback in tutto: 2 modalita' x 2 giri)"
elif [ "$esito" -eq 0 ]; then
  echo "  ROSSO  la dichiarazione e cio' che e' stato eseguito non coincidono:"
  diff <(printf '%s\n' "$DICHIARATI") <(printf '%s\n' "$FATTI") | sed 's/^/         /'
  esito=1
else
  echo "  (non confrontabile: un giro si e' fermato prima della fine)"
fi

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: apply/rollback non equivalenti nelle due modalita'."; exit 1; }
echo "VERDE: $N_DICH forward-only dal manifesto, apply e rollback verdi in autocommit e in"
echo "       transazione esterna, due giri per modalita', insieme eseguito = insieme dichiarato."
