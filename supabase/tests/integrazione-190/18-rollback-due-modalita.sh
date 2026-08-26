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

residui_append_only() {
  docker exec "$CONT" psql -U postgres -d "$1" -X -tA -c "
    select coalesce(string_agg(n.nspname||'.'||c.relname||'='||
      (xpath('/row/cnt/text()', query_to_xml(format('select count(*) as cnt from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text, ', '), '')
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='private' and c.relkind='r' and c.relname like 'billing%';" 2>/dev/null
}

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

    if ! rollback_sei "$DB" "$MODO"; then echo "  ROSSO  giro $GIRO: rollback fallito"; esito=1; break; fi
    C="$(impronta "$DB")"
    if [ "$C" = "$A" ]; then
      echo "  3. giro $GIRO rollback: impronta identica a quella iniziale"
    else
      echo "  ROSSO  giro $GIRO: il rollback NON riporta all'impronta iniziale."
      diff <(printf '%s\n' "$A") <(printf '%s\n' "$C") | head -8 | sed 's/^/         /'
      esito=1; break
    fi

    R="$(residui_append_only "$DB")"
    if [ -n "$R" ]; then
      echo "  ROSSO  giro $GIRO: tabelle billing sopravvissute al rollback: $R"; esito=1; break
    fi
    echo "  4. giro $GIRO: nessun residuo append-only"
  done
  echo "  5. secondo giro completato: apply/rollback deterministico"
  docker exec "$CONT" psql -U postgres -d postgres -q -c "drop database if exists $DB;" >/dev/null 2>&1
done

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: apply/rollback non equivalenti nelle due modalita'."; exit 1; }
echo "VERDE: $N_DICH forward-only, apply e rollback verdi in autocommit e in transazione esterna, due giri per modalita'."
