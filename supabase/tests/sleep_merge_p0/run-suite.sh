#!/usr/bin/env bash
# P0 integrita' dati / sonno duplicato — suite del merge degli stadi.
#
# Gira contro lo stack locale gia' avviato (`supabase start`), non contro un
# container usa e getta: i casi che contano dipendono da oggetti veri e non
# simulabili senza cambiarne il comportamento (auth.users e il suo trigger,
# public.devices con la sua FK, il vincolo di unicita' reale di
# fitness_metrics su cui gira l'ON CONFLICT).
#
# Ogni file apre una transazione e la chiude con ROLLBACK: al termine il
# database locale e' esattamente come prima.
#
# Uso:
#   supabase start
#   supabase/tests/sleep_merge_p0/run-suite.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIR="$REPO_ROOT/supabase/tests/sleep_merge_p0"
CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"

if ! docker exec "$CID" true >/dev/null 2>&1; then
  echo "Container '$CID' non raggiungibile. Avviare prima lo stack locale con 'supabase start'." >&2
  exit 1
fi

run_sql() {
  echo ""
  echo "### $1"
  docker cp "$DIR/$1" "$CID":/tmp/sleep_suite_under_test.sql >/dev/null
  docker exec -e PGPASSWORD=postgres "$CID" \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/sleep_suite_under_test.sql
}

# 30 installa lo script di riparazione dentro la propria transazione e lo
# butta via col ROLLBACK: va copiato nel container prima, perche' `\i` legge
# dal filesystem del server.
docker cp "$REPO_ROOT/supabase/repair/20260811_sleep_stages_dedup.sql" \
  "$CID":/tmp/repair_under_test.sql >/dev/null

run_sql 10-helper-idempotency.sql
run_sql 20-rpc-idempotency.sql
run_sql 30-riparazione.sql
run_sql 40-altre-metriche.sql

echo ""
echo "sleep_merge_p0: tutte verdi."
