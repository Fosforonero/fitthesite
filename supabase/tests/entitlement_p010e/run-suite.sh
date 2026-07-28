#!/usr/bin/env bash
# Sprint P0.10E addendum — verifica get_entitlement_status() (20260728110000)
# e hardening grant_b2c_trial (20260728100000), migration REALI non
# riscritte, su supabase/postgres reale (auth.users/auth.uid() veri).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIR="$REPO_ROOT/supabase/tests/entitlement_p010e"
MIGRATIONS="$REPO_ROOT/supabase/migrations"
IMAGE="public.ecr.aws/supabase/postgres:15.8.1.085"
CID="entitlement-p010e-pg-$$"

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

log "1/3 - schema minimo"
docker cp "$DIR/00-minimal-schema.sql" "$CID":/tmp/apply.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql

log "2/3 - migration reali (hardening + entitlement contract)"
for f in "20260728100000_harden_legacy_b2c_trial_acl.sql" "20260728110000_entitlement_status_contract.sql"; do
  docker cp "$MIGRATIONS/$f" "$CID":/tmp/apply.sql >/dev/null
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql
done

log "3/3 - test funzionali (25 casi)"
docker cp "$DIR/10-functional-tests.sql" "$CID":/tmp/test.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/test.sql

echo ""
echo "=========================================="
echo "Sprint P0.10E addendum: TUTTE LE VERIFICHE OK"
echo "=========================================="
