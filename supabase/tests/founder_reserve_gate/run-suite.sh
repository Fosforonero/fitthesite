#!/usr/bin/env bash
# Sprint P0.10E-C — verifica la migration REALE, non riscritta qui
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

log "3/6 - test funzionali (22 casi, incl. no-clobber sottoscrizioni commerciali)"
docker cp "$DIR/10-functional-tests.sql" "$CID":/tmp/test.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/test.sql

log "4/6 - test 14 (riesecuzione): riapplica la STESSA migration su un DB gia' migrato, deve essere un no-op senza errori (trovato mancante in review avversariale: la prima versione di questa guardia falliva qui)"
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql
echo "Caso 14 OK: riapplicazione della migration senza errori"

log "5/6 - test 15 (chiamate concorrenti): due sessioni, stesso utente pre-cutoff/in-finestra/allowlisted, DOPO la riapplicazione"
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
echo "LIMITE DICHIARATO: prova solo che il wrapper non deadlocka in concorrenza fra due claim identici — Caso 23 sotto prova la concorrenza claim-vs-scrittura commerciale."
rm -f /tmp/concurrent-a.out /tmp/concurrent-b.out

log "6/6 - test 23 (concorrenza claim vs UPDATE commerciale in corso): il FOR UPDATE del wrapper deve attendere il commit e osservare il valore POST-commit, non uno stale"
RACE_SETUP="select test.mkuser('allowlisted-race@test.local', now() - interval '5 days')::text;"
RACE_USER=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "$RACE_SETUP")
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "insert into public.b2c_subscriptions (user_id, billing_source, state) values ('${RACE_USER}', 'trial', 'active');" >/dev/null

# Sessione A: apre una transazione, aggiorna la riga a 'google_play', la
# tiene aperta 4s (simula una UPDATE commerciale in corso, non ancora
# committed) prima di fare commit. `\! touch ...` e' un meta-comando psql
# lato CLIENT: viene eseguito solo DOPO che il server ha gia' processato la
# UPDATE precedente (quindi il lock di riga e' gia' preso) e PRIMA dello
# sleep — un segnale deterministico di "lock preso", non un timeout
# indovinato. Trovato in review avversariale che un fixed sleep qui era
# fragile sotto jitter di docker exec/avvio Postgres in ambienti piu' lenti
# (riprodotto: un ritardo di avvio di 2.5s sulla sessione A faceva partire
# il claim PRIMA che il lock fosse preso, invalidando l'intero test senza
# errore visibile).
docker exec "$CID" sh -c "rm -f /tmp/race-lock-acquired"
cat > "/tmp/race-update-$$.sql" <<SQLEOF
begin;
update public.b2c_subscriptions set billing_source = 'google_play' where user_id = '${RACE_USER}';
\! touch /tmp/race-lock-acquired
select pg_sleep(4);
commit;
SQLEOF
docker cp "/tmp/race-update-$$.sql" "$CID":/tmp/race-update.sql >/dev/null
rm -f "/tmp/race-update-$$.sql"

(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -f /tmp/race-update.sql >/tmp/race-update.out 2>&1) &
PID_UPDATE=$!

tries=0
until docker exec "$CID" test -f /tmp/race-lock-acquired 2>/dev/null; do
  tries=$((tries + 1))
  if [ "$tries" -gt 100 ]; then
    echo "Caso 23 FALLITO: timeout attendendo che la sessione A prendesse il lock di riga"
    exit 1
  fi
  sleep 0.05
done

# Sessione B: chiama il claim MENTRE la UPDATE e' ancora aperta. Se il FOR
# UPDATE nel wrapper funziona, questa chiamata blocca fino al commit della
# sessione A (misurato sotto) e vede il valore POST-commit, non lo stale
# 'trial' che avrebbe visto con una lettura non bloccante.
RACE_CLAIM_SQL="select set_config('request.jwt.claim.sub', '${RACE_USER}', true); set local role authenticated; select public.claim_founder_grant_if_eligible();"
CLAIM_START=$(date +%s)
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -t -A -c "$RACE_CLAIM_SQL" >/tmp/race-claim.out 2>&1
CLAIM_STATUS=$?
CLAIM_END=$(date +%s)
CLAIM_ELAPSED=$((CLAIM_END - CLAIM_START))

wait "$PID_UPDATE"

if [ "$CLAIM_STATUS" -ne 0 ]; then
  echo "Caso 23 FALLITO: la chiamata claim e' terminata con errore"
  cat /tmp/race-claim.out
  exit 1
fi
if [ "$CLAIM_ELAPSED" -lt 2 ]; then
  echo "Caso 23 FALLITO: il claim non ha atteso il commit della UPDATE concorrente (atteso >= 2s di blocco da FOR UPDATE, misurato ${CLAIM_ELAPSED}s) - il lock potrebbe non funzionare"
  cat /tmp/race-claim.out
  exit 1
fi
if ! grep -q "existing_commercial_entitlement" /tmp/race-claim.out; then
  echo "Caso 23 FALLITO: dopo aver atteso il commit, il claim doveva vedere billing_source='google_play' (post-update) e restituire existing_commercial_entitlement, trovato:"
  cat /tmp/race-claim.out
  exit 1
fi
echo "Caso 23 OK: il claim ha atteso ${CLAIM_ELAPSED}s (FOR UPDATE bloccato sulla UPDATE concorrente in corso) e ha visto il valore POST-commit (google_play), non lo stale (trial) -> existing_commercial_entitlement"
echo "LIMITE DICHIARATO: prova la meta' della race chiusa da FOR UPDATE (UPDATE su riga gia' esistente). NON prova (e non puo', da una sola migration SQL) la meta' opposta: un INSERT commerciale che arriva su una riga ancora inesistente nello stesso istante del claim - vedi il commento BLOCCO 3 nella migration."
rm -f /tmp/race-update.out /tmp/race-claim.out

echo ""
echo "=========================================="
echo "Sprint P0.10E-C: TUTTE LE VERIFICHE OK"
echo "=========================================="
