#!/usr/bin/env bash
# Sprint P0.10E-A — verifica claim_founder_grant_if_eligible_gated()
# (20260729120000, REALE, non riscritta) su supabase/postgres reale.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIR="$REPO_ROOT/supabase/tests/founder_reserve_gate"
MIGRATIONS="$REPO_ROOT/supabase/migrations"
IMAGE="public.ecr.aws/supabase/postgres:15.8.1.085"
CID="reserve-gate-pg-$$"

cleanup() { docker rm -f "$CID" >/dev/null 2>&1 || true; }
trap cleanup EXIT

log() { echo "== $* =="; }

docker run -d --name "$CID" -e POSTGRES_PASSWORD=postgres -e POSTGRES_HOST=/var/run/postgresql "$IMAGE" >/dev/null
tries=0
until docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select 1;" >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -gt 60 ]; then echo "timeout avvio $IMAGE"; docker logs "$CID" | tail -30; exit 1; fi
  sleep 1
done
sleep 5

log "1/3 - schema minimo (stub legacy + helper di test)"
docker cp "$DIR/00-minimal-schema.sql" "$CID":/tmp/apply.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql

log "2/3 - migration reale (gate di cutoff)"
docker cp "$MIGRATIONS/20260729120000_founder_reserve_cutoff_gate.sql" "$CID":/tmp/apply.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql

log "3/3 - test funzionali (8 casi)"
docker cp "$DIR/10-functional-tests.sql" "$CID":/tmp/test.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/test.sql

echo ""
echo "=========================================="
echo "Sprint P0.10E-A: TUTTE LE VERIFICHE OK"
echo "=========================================="
