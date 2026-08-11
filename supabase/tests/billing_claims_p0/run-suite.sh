#!/usr/bin/env bash
# Sprint P0 Apple IAP, FASE 2/3: suite del registro di proprieta' degli
# acquisti (migration 20260808211929_billing_purchase_claims_registry.sql).
#
# A differenza delle altre suite di questo repository, questa NON ricostruisce
# uno schema minimo in un container usa e getta: gira contro lo stack locale
# gia' avviato con `supabase start`. Il motivo e' che i casi che contano di
# piu' dipendono da oggetti veri e non simulabili a mano senza cambiarne il
# comportamento: auth.users con la sua FK e la sua cancellazione (tombstone),
# il trigger on_auth_user_created che crea i profili, i ruoli anon /
# authenticated / service_role per le verifiche ACL.
#
# Il file SQL apre una transazione e la chiude con ROLLBACK: al termine il
# database locale e' esattamente come prima. Nessuna scrittura sopravvive.
#
# Uso:
#   supabase start
#   supabase/tests/billing_claims_p0/run-suite.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIR="$REPO_ROOT/supabase/tests/billing_claims_p0"
CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"

if ! docker exec "$CID" true >/dev/null 2>&1; then
  echo "Container '$CID' non raggiungibile. Avviare prima lo stack locale con 'supabase start'." >&2
  exit 1
fi

# Tutti i file, non solo il primo. Finche' la suite ne eseguiva uno
# solo, gli altri tre esistevano sul disco e non venivano mai eseguiti: una
# suite che copre meno di quanto sembra e' peggio di una che non esiste,
# perche' il suo verde viene creduto.
run_sql() {
  echo ""
  echo "### $1"
  docker cp "$DIR/$1" "$CID":/tmp/suite_under_test.sql >/dev/null
  docker exec -e PGPASSWORD=postgres "$CID" \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/suite_under_test.sql
}

run_sql 10-functional-tests.sql
run_sql 20-ownership-persistence-tests.sql
run_sql 25-payload-sanitization-tests.sql
run_sql 45-advisor-exposure.sql
# B': prima la baseline ROSSA (ricrea in transazione la funzione del commit
# 262ade1 e dimostra che quegli scenari fallivano davvero), poi la matrice
# della precedenza. L'ordine conta: la seconda si legge solo dopo la prima.
run_sql 48-red-baseline-last-write-wins.sql
run_sql 50-entitlement-precedence.sql
# La finestra fra migration e deploy: si simula l'istante esatto in cui la
# migration e' applicata e il backend in produzione e' ancora quello vecchio.
run_sql 60-rollout-window.sql

# Questi due aprono connessioni proprie: la corsa a due connessioni reali non
# si puo' simulare dentro una singola sessione psql.
echo ""
echo "### 30-backfill-tests.sh"
bash "$DIR/30-backfill-tests.sh"

echo ""
echo "### 35-backfill-fixtures.sh"
bash "$DIR/35-backfill-fixtures.sh"

echo ""
echo "### 40-concurrency.sh"
bash "$DIR/40-concurrency.sh"

echo ""
echo "### 55-concurrency-entitlement.sh"
bash "$DIR/55-concurrency-entitlement.sh"
