#!/usr/bin/env bash
# Sprint P0.10E-B — verifica la migration REALE, non riscritta qui
# (20260729120000_founder_reserve_cutoff_gate.sql) su supabase/postgres
# reale.
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

log "3/5 - test funzionali (13 casi)"
docker cp "$DIR/10-functional-tests.sql" "$CID":/tmp/test.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/test.sql

log "4/5 - test 14 (riesecuzione): riapplica la STESSA migration su un DB gia' migrato, deve essere un no-op senza errori (trovato mancante in review avversariale: la prima versione di questa guardia falliva qui)"
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql
echo "Caso 14 OK: riapplicazione della migration senza errori"

log "5/5 - test 15 (chiamate concorrenti): due sessioni, stesso utente pre-cutoff/in-finestra/allowlisted, DOPO la riapplicazione"
CONCURRENT_SETUP="select test.mkuser('allowlisted-concurrent@test.local', now() - interval '3 days')::text;"
CONCURRENT_USER=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "$CONCURRENT_SETUP")
CONCURRENT_CALL="select set_config('request.jwt.claim.sub', '${CONCURRENT_USER}', true); set local role authenticated; select public.claim_founder_grant_if_eligible();"
(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "$CONCURRENT_CALL" >/tmp/concurrent-a.out 2>&1) &
PID_A=$!
(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "$CONCURRENT_CALL" >/tmp/concurrent-b.out 2>&1) &
PID_B=$!
wait "$PID_A"; STATUS_A=$?
wait "$PID_B"; STATUS_B=$?
if [ "$STATUS_A" -ne 0 ] || [ "$STATUS_B" -ne 0 ]; then
  echo "Caso 15 FALLITO: una delle due sessioni concorrenti e' terminata con errore"
  cat /tmp/concurrent-a.out /tmp/concurrent-b.out
  exit 1
fi
echo "Caso 15 OK: due chiamate concorrenti sullo stesso utente, entrambe le sessioni terminate senza errore/deadlock"
echo "LIMITE DICHIARATO: prova solo che il wrapper (sole letture + confronti in memoria) non deadlocka in concorrenza — non dice nulla sulla concorrenza del vero _apply_founder_grant (ON CONFLICT DO UPDATE, BLOCCO 3), stubbato a no-op e mai raggiunto da questa email nello stub."
rm -f /tmp/concurrent-a.out /tmp/concurrent-b.out

echo ""
echo "=========================================="
echo "Sprint P0.10E-B: TUTTE LE VERIFICHE OK"
echo "=========================================="
