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

docker cp "$DIR/10-functional-tests.sql" "$CID":/tmp/billing_claims_tests.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/billing_claims_tests.sql
