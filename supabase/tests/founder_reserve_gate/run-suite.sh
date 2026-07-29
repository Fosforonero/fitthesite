#!/usr/bin/env bash
# Sprint P0.10E-E — verifica la migration REALE, non riscritta qui
# (20260729161341_founder_reserve_cutoff_gate.sql, rinominata da 20260729120000
# in Sprint P0.10F dopo l'apply reale) su supabase/postgres
# reale. PRE_FIX_MD5 e' invariato da P0.10E-D (il corpo live in produzione
# non e' mai cambiato in questo sprint — solo la sua ricostruzione qui e'
# stata corretta contro la convenzione live reale, vedi la migration per il
# dettaglio completo dei due bug trovati e corretti in P0.10E-E).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIR="$REPO_ROOT/supabase/tests/founder_reserve_gate"
MIGRATIONS="$REPO_ROOT/supabase/migrations"
IMAGE="public.ecr.aws/supabase/postgres:15.8.1.085"
CID="reserve-gate-pg-$$"
PRE_FIX_MD5="5c7649b942f04234c31d3c7961c4c6a0"

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

log "1/10 - schema minimo (stub legacy + stub PRE-migration di _apply_founder_grant + helper di test)"
docker cp "$DIR/00-minimal-schema.sql" "$CID":/tmp/schema.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/schema.sql

log "2/10 - TEST NEGATIVO del guard MD5: applicare la migration con l'hash di PRODUZIONE contro questo stub locale deve ABORTIRE, prima di qualunque modifica"
docker cp "$MIGRATIONS/20260729161341_founder_reserve_cutoff_gate.sql" "$CID":/tmp/migration-real-hash.sql >/dev/null
set +e
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/migration-real-hash.sql >/tmp/negative-guard-$$.out 2>&1
NEGATIVE_STATUS=$?
set -e
if [ "$NEGATIVE_STATUS" -eq 0 ]; then
  echo "TEST NEGATIVO FALLITO: la migration con l'hash di produzione doveva abortire contro questo stub (hash diverso per costruzione), invece e' passata - il guard MD5 potrebbe non funzionare"
  cat /tmp/negative-guard-$$.out
  exit 1
fi
if ! grep -q "ABORT" /tmp/negative-guard-$$.out; then
  echo "TEST NEGATIVO FALLITO: la migration e' fallita ma non col messaggio atteso del guard MD5"
  cat /tmp/negative-guard-$$.out
  exit 1
fi
STILL_IN_PUBLIC=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='claim_founder_grant_if_eligible';")
if [ "$STILL_IN_PUBLIC" -ne 1 ]; then
  echo "TEST NEGATIVO FALLITO: dopo l'abort del guard, claim_founder_grant_if_eligible doveva essere ANCORA in public (nessuna modifica gia' avvenuta), trovato count=$STILL_IN_PUBLIC"
  exit 1
fi
echo "Test negativo OK: il guard MD5 abortisce correttamente su hash mismatch, PRIMA di qualunque modifica al file (claim_founder_grant_if_eligible ancora in public, nessuno spostamento avvenuto)"
rm -f /tmp/negative-guard-$$.out

log "3/10 - calcolo MD5 locale dello stub _apply_founder_grant, sostituzione nella copia di migration per il test (necessariamente diverso dall'hash reale di produzione: testo diverso per costruzione)"
LOCAL_MD5=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select md5(pg_get_functiondef('public._apply_founder_grant(uuid, text)'::regprocedure));")
echo "MD5 locale dello stub pre-migration: $LOCAL_MD5"
sed "s/${PRE_FIX_MD5}/${LOCAL_MD5}/" "$MIGRATIONS/20260729161341_founder_reserve_cutoff_gate.sql" > "/tmp/migration-local-hash-$$.sql"
docker cp "/tmp/migration-local-hash-$$.sql" "$CID":/tmp/apply.sql >/dev/null
rm -f "/tmp/migration-local-hash-$$.sql"

log "4/10 - migration reale (con hash pre-fix sostituito per il test locale, hash post-fix INVARIATO)"
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql

log "5/10 - test funzionali (39 casi, incl. barriera atomica _apply_founder_grant, ri-verifica FASE 5, allowlist/null-check/CONSTRAINT_NAME P0.10E-E)"
docker cp "$DIR/10-functional-tests.sql" "$CID":/tmp/test.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/test.sql

log "6/10 - riesecuzione: riapplica la STESSA migration (hash sostituito) su un DB gia' migrato, deve essere un no-op senza errori — prova ANCHE che il guard MD5 accetti il proprio hash post-fix, non solo quello pre-fix"
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql
echo "Caso 14 OK: riapplicazione della migration senza errori (guard MD5 ha accettato il proprio hash post-fix)"

log "7/10 - test 15 (chiamate concorrenti identiche): due sessioni, stesso utente pre-cutoff/in-finestra/allowlisted, DOPO la riapplicazione"
CONCURRENT_SETUP="select test.mkuser('allowlisted-concurrent@test.local', now() - interval '3 days')::text;"
CONCURRENT_USER=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "$CONCURRENT_SETUP")
CONCURRENT_CALL="select set_config('request.jwt.claim.sub', '${CONCURRENT_USER}', true); set local role authenticated; select public.claim_founder_grant_if_eligible();"
(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "$CONCURRENT_CALL" >/tmp/concurrent-a-$$.out 2>&1) &
PID_A=$!
(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "$CONCURRENT_CALL" >/tmp/concurrent-b-$$.out 2>&1) &
PID_B=$!
# `STATUS=0; wait "$PID" || STATUS=$?`, non `wait "$PID"; STATUS=$?` — sotto
# `set -e` un `wait` che ritorna non-zero abortisce lo script SUBITO, prima
# che l'assegnazione a STATUS sulla stessa riga possa mai eseguire (trovato
# indagando un fallimento silenzioso del Caso 36 dove questo stesso
# pattern nascondeva l'errore reale invece di riportarlo).
STATUS_A=0; wait "$PID_A" || STATUS_A=$?
STATUS_B=0; wait "$PID_B" || STATUS_B=$?
if [ "$STATUS_A" -ne 0 ] || [ "$STATUS_B" -ne 0 ]; then
  echo "Caso 15 FALLITO: una delle due sessioni concorrenti e' terminata con errore"
  cat /tmp/concurrent-a-$$.out /tmp/concurrent-b-$$.out
  exit 1
fi
echo "Caso 15 OK: due chiamate concorrenti sullo stesso utente, entrambe le sessioni terminate senza errore/deadlock"
rm -f /tmp/concurrent-a-$$.out /tmp/concurrent-b-$$.out

log "8/10 - test 23 (concorrenza precheck claim vs UPDATE commerciale in corso): il FOR UPDATE del wrapper deve attendere il commit e osservare il valore POST-commit, non uno stale"
RACE_SETUP="select test.mkuser('allowlisted-race@test.local', now() - interval '5 days')::text;"
RACE_USER=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "$RACE_SETUP")
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "select test.mkcommercial('${RACE_USER}'::uuid, 'trial', 'active');" >/dev/null

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

(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -f /tmp/race-update.sql >/tmp/race-update-$$.out 2>&1) &
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

RACE_CLAIM_SQL="select set_config('request.jwt.claim.sub', '${RACE_USER}', true); set local role authenticated; select public.claim_founder_grant_if_eligible();"
CLAIM_START=$(date +%s)
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -t -A -c "$RACE_CLAIM_SQL" >/tmp/race-claim-$$.out 2>&1
CLAIM_STATUS=$?
CLAIM_END=$(date +%s)
CLAIM_ELAPSED=$((CLAIM_END - CLAIM_START))

UPDATE_STATUS=0; wait "$PID_UPDATE" || UPDATE_STATUS=$?
if [ "$UPDATE_STATUS" -ne 0 ]; then
  echo "Caso 23 FALLITO: la sessione A (UPDATE commerciale) e' terminata con errore"
  cat /tmp/race-update-$$.out
  exit 1
fi

if [ "$CLAIM_STATUS" -ne 0 ]; then
  echo "Caso 23 FALLITO: la chiamata claim e' terminata con errore"
  cat /tmp/race-claim-$$.out
  exit 1
fi
if [ "$CLAIM_ELAPSED" -lt 2 ]; then
  echo "Caso 23 FALLITO: il claim non ha atteso il commit della UPDATE concorrente (atteso >= 2s di blocco da FOR UPDATE, misurato ${CLAIM_ELAPSED}s) - il lock potrebbe non funzionare"
  cat /tmp/race-claim-$$.out
  exit 1
fi
if ! grep -q "existing_commercial_entitlement" /tmp/race-claim-$$.out; then
  echo "Caso 23 FALLITO: dopo aver atteso il commit, il claim doveva vedere billing_source='google_play' (post-update) e restituire existing_commercial_entitlement, trovato:"
  cat /tmp/race-claim-$$.out
  exit 1
fi
echo "Caso 23 OK: il claim ha atteso ${CLAIM_ELAPSED}s (FOR UPDATE bloccato sulla UPDATE concorrente in corso) e ha visto il valore POST-commit (google_play), non lo stale (trial) -> existing_commercial_entitlement"
rm -f /tmp/race-update-$$.out /tmp/race-claim-$$.out

# ============================================================================
# FASE 8 — Casi 33/34/35: concorrenza REALE (non simulata) fra
# _apply_founder_grant e un INSERT commerciale concorrente, direttamente
# sulla barriera atomica (bypassando il wrapper), per i 3 billing_source
# commerciali. Sincronizzazione deterministica via marker file (nessuno
# sleep arbitrario come unico coordinamento).
# ============================================================================
run_commercial_race_test() {
  local case_num="$1"
  local case_label="$2"
  local source="$3"
  local email="direct-race-${source}@test.local"
  local user_id

  log "${case_label} - concorrenza _apply_founder_grant vs INSERT ${source} concorrente (commerciale deve vincere)"
  user_id=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select test.mkuser('${email}', now() - interval '5 days')::text;")
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "insert into public.founder_grants (email, founder_number) values ('${email}', $((9100 + case_num)));" >/dev/null

  docker exec "$CID" sh -c "rm -f /tmp/commercial-lock-${source}"
  cat > "/tmp/commercial-race-${source}-$$.sql" <<SQLEOF
begin;
select test.mkcommercial('${user_id}'::uuid, '${source}', 'active');
\! touch /tmp/commercial-lock-${source}
select pg_sleep(3);
commit;
SQLEOF
  docker cp "/tmp/commercial-race-${source}-$$.sql" "$CID":/tmp/commercial-race-${source}.sql >/dev/null
  rm -f "/tmp/commercial-race-${source}-$$.sql"

  (docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -f /tmp/commercial-race-${source}.sql >/tmp/commercial-race-${source}-$$.out 2>&1) &
  local pid_writer=$!

  local tries=0
  until docker exec "$CID" test -f /tmp/commercial-lock-${source} 2>/dev/null; do
    tries=$((tries + 1))
    if [ "$tries" -gt 100 ]; then echo "Caso ${case_num} FALLITO: timeout attendendo il lock del writer ${source}"; exit 1; fi
    sleep 0.05
  done

  local apply_start apply_end apply_elapsed apply_status
  apply_start=$(date +%s)
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -t -A -c "select public._apply_founder_grant('${user_id}'::uuid, '${email}');" >/tmp/apply-result-${source}-$$.out 2>&1
  apply_status=$?
  apply_end=$(date +%s)
  apply_elapsed=$((apply_end - apply_start))

  local writer_status=0
  wait "$pid_writer" || writer_status=$?
  if [ "$writer_status" -ne 0 ]; then
    echo "Caso ${case_num} FALLITO: la sessione writer (${source}) e' terminata con errore"
    cat /tmp/commercial-race-${source}-$$.out
    exit 1
  fi

  if [ "$apply_status" -ne 0 ]; then
    echo "Caso ${case_num} FALLITO: _apply_founder_grant e' terminata con errore"
    cat /tmp/apply-result-${source}-$$.out
    exit 1
  fi
  if [ "$apply_elapsed" -lt 1 ]; then
    echo "Caso ${case_num} FALLITO: _apply_founder_grant non sembra aver atteso il commit del writer ${source} concorrente (misurato ${apply_elapsed}s)"
    cat /tmp/apply-result-${source}-$$.out
    exit 1
  fi
  if ! grep -q "^f$" /tmp/apply-result-${source}-$$.out; then
    echo "Caso ${case_num} FALLITO: _apply_founder_grant doveva ritornare false (il commerciale ${source} ha vinto la race), trovato:"
    cat /tmp/apply-result-${source}-$$.out
    exit 1
  fi

  local applied_user billing_after
  applied_user=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select coalesce(applied_user_id::text, '') from public.founder_grants where email = '${email}';")
  billing_after=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select billing_source from public.b2c_subscriptions where user_id = '${user_id}';")

  if [ -n "$applied_user" ]; then
    echo "Caso ${case_num} FALLITO: founder_grants NON deve essere marcata quando il commerciale vince la race, trovato applied_user_id=${applied_user}"
    exit 1
  fi
  if [ "$billing_after" != "$source" ]; then
    echo "Caso ${case_num} FALLITO: b2c_subscriptions deve restare ${source} (byte-identico), trovato ${billing_after}"
    exit 1
  fi

  echo "Caso ${case_num} OK: race commerciale (${source}) vince — _apply_founder_grant ha atteso ${apply_elapsed}s il commit concorrente, ritornato false, founder_grants intatta, billing_source ancora ${source}"
  rm -f "/tmp/commercial-race-${source}-$$.out" "/tmp/apply-result-${source}-$$.out"
}

run_commercial_race_test 33 "9/10 - test 33" "google_play"
run_commercial_race_test 34 "9/10 - test 34" "apple_iap"
run_commercial_race_test 35 "9/10 - test 35" "stripe"

# ============================================================================
# Caso 36 — race "Founder vince": due chiamate concorrenti a
# _apply_founder_grant per lo STESSO utente nuovo (nessuna riga
# preesistente, nessun commerciale in gioco). Deve risolversi senza
# duplicati/corruzione: esattamente una riga b2c_subscriptions, entrambe le
# chiamate ritornano true (founder_grant e' sempre in whitelist per il
# conflitto). Il flusso commerciale futuro (una sottoscrizione che arriva
# DOPO su un utente gia' Founder) resta fuori scope, non modificato da
# questa migration.
# ============================================================================
log "10/10 - test 36 (race Founder-vince): due chiamate concorrenti a _apply_founder_grant, stesso utente nuovo, nessun commerciale in gioco"
FOUNDER_RACE_EMAIL="direct-race-founder-wins@test.local"
FOUNDER_RACE_USER=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select test.mkuser('${FOUNDER_RACE_EMAIL}', now() - interval '5 days')::text;")
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "insert into public.founder_grants (email, founder_number) values ('${FOUNDER_RACE_EMAIL}', 9200);" >/dev/null

FOUNDER_APPLY_CALL="select public._apply_founder_grant('${FOUNDER_RACE_USER}'::uuid, '${FOUNDER_RACE_EMAIL}');"
(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -t -A -c "$FOUNDER_APPLY_CALL" >/tmp/founder-race-a-$$.out 2>&1) &
PID_FA=$!
(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -t -A -c "$FOUNDER_APPLY_CALL" >/tmp/founder-race-b-$$.out 2>&1) &
PID_FB=$!
STATUS_FA=0; wait "$PID_FA" || STATUS_FA=$?
STATUS_FB=0; wait "$PID_FB" || STATUS_FB=$?

if [ "$STATUS_FA" -ne 0 ] || [ "$STATUS_FB" -ne 0 ]; then
  echo "Caso 36 FALLITO: una delle due chiamate concorrenti e' terminata con errore"
  cat /tmp/founder-race-a-$$.out /tmp/founder-race-b-$$.out
  exit 1
fi
if ! grep -q "^t$" /tmp/founder-race-a-$$.out || ! grep -q "^t$" /tmp/founder-race-b-$$.out; then
  echo "Caso 36 FALLITO: entrambe le chiamate concorrenti dovrebbero ritornare true (nessun commerciale in gioco, founder_grant sempre in whitelist)"
  cat /tmp/founder-race-a-$$.out /tmp/founder-race-b-$$.out
  exit 1
fi
ROWS_COUNT=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select count(*) from public.b2c_subscriptions where user_id = '${FOUNDER_RACE_USER}';")
if [ "$ROWS_COUNT" -ne 1 ]; then
  echo "Caso 36 FALLITO: deve esistere esattamente una riga b2c_subscriptions dopo la race, trovate ${ROWS_COUNT}"
  exit 1
fi
echo "Caso 36 OK: race Founder-vince, entrambe le chiamate concorrenti ritornano true, nessun duplicato (esattamente 1 riga), nessuna corruzione"
rm -f /tmp/founder-race-a-$$.out /tmp/founder-race-b-$$.out

echo ""
echo "=========================================="
echo "Sprint P0.10E-E: TUTTE LE VERIFICHE OK"
echo "=========================================="
