#!/usr/bin/env bash
# ============================================================================
# Sprint P0 Apple IAP, FASE 5, CASO 6: due claim CONCORRENTI sulla stessa
# transazione, da due utenti diversi. Deve vincerne esattamente uno.
#
# PERCHE' QUESTO FILE NON E' DENTRO LA SUITE SQL
#
# Gli altri casi girano in una transazione sola chiusa da ROLLBACK. La
# concorrenza non e' simulabile li' dentro: due sessioni devono esistere per
# davvero e vedersi a vicenda, e in Postgres una sessione vede il lavoro
# dell'altra solo dopo il COMMIT. Un "test di concorrenza" scritto in una
# transazione unica proverebbe soltanto che due chiamate sequenziali danno due
# esiti diversi, che e' gia' coperto dal CASO 3 e non dice niente sulle corse.
#
# COME LA CORSA E' RESA DETERMINISTICA, INVECE CHE SPERATA
#
# Far partire due processi insieme e sperare che si sovrappongano rende il test
# instabile e, quel che e' peggio, silenziosamente inutile quando NON si
# sovrappongono: passerebbe comunque. Qui la sovrapposizione e' costruita e poi
# VERIFICATA:
#   1. una sessione BARRIERA prende l'advisory lock sulla chiave esatta che la
#      RPC usera' (stessa espressione hashtext della migration) e lo tiene;
#   2. le due sessioni concorrenti chiamano la RPC e si fermano entrambe su
#      quel lock, cioe' sono entrambe DENTRO la funzione nello stesso istante;
#   3. lo script controlla in pg_locks che i waiter siano davvero due, e se non
#      lo sono FALLISCE invece di proseguire e dichiarare un successo che non
#      ha misurato niente;
#   4. la barriera rilascia, e i due proseguono uno alla volta.
#
# Gira contro lo stack locale (`supabase start`). A differenza delle suite SQL
# questo file COMMITTA, perche' deve: la pulizia e' affidata a un trap che
# scatta anche in caso di errore.
# ============================================================================
set -euo pipefail

CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"
UA='00000000-0000-4000-8000-00000000c001'
UB='00000000-0000-4000-8000-00000000c002'
KEY='6000000000000001'
LOCKEXPR="hashtext('billing-purchase-claim:apple_iap:${KEY}')"
OUT_A=$(mktemp); OUT_B=$(mktemp); OUT_BARRIER=$(mktemp)

psql_q() { docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "$1"; }

if ! docker exec "$CID" true >/dev/null 2>&1; then
  echo "Container '$CID' non raggiungibile. Avviare prima 'supabase start'." >&2
  exit 1
fi

teardown() {
  # Il registro e' append-only per costruzione: il trigger vieta la DELETE
  # anche al proprietario della tabella. Per ripulire un test che ha dovuto
  # committare, il trigger va disattivato per il tempo strettamente necessario
  # e poi RIATTIVATO. Questa e' l'unica ragione legittima per farlo, vale solo
  # sul database locale, e non deve comparire in nessuno script operativo.
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -q \
    -c "alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;" \
    -c "delete from private.billing_purchase_claims where ownership_key = '${KEY}';" \
    -c "alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;" \
    -c "delete from auth.users where id in ('${UA}','${UB}');" >/dev/null 2>&1 || true
  rm -f "$OUT_A" "$OUT_B" "$OUT_BARRIER"
}
trap teardown EXIT

echo '################ CASO 6: due claim concorrenti sulla stessa transazione ################'

# ── Pulizia difensiva di eventuali residui di un giro precedente andato male ──
teardown_quiet() { teardown >/dev/null 2>&1 || true; }
teardown_quiet

psql_q "insert into auth.users (id, email, created_at) values
          ('${UA}','conc-a@test.local', now()),
          ('${UB}','conc-b@test.local', now());" >/dev/null

# ── 1. La barriera prende il lock e lo tiene 8 secondi ───────────────────────
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA \
  -c "begin; select pg_advisory_xact_lock(${LOCKEXPR}); select pg_sleep(8); commit;" \
  > "$OUT_BARRIER" 2>&1 &
PID_BARRIER=$!
sleep 1

# ── 2. I due concorrenti partono e si fermano entrambi su quel lock ──────────
CLAIM_SQL="select public.claim_store_purchase(
  p_billing_source => 'apple_iap',
  p_ownership_key => '${KEY}',
  p_owner_user_id => '%s'::uuid,
  p_external_product_id => 'fitmesh_pro_lifetime',
  p_environment => 'production',
  p_active_until => '9999-12-31T23:59:59Z'::timestamptz,
  p_state => 'active',
  p_auto_renewing => false,
  p_external_transaction_id => '%s',
  p_external_subscription_id => '${KEY}');"

# shellcheck disable=SC2059
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA \
  -c "$(printf "$CLAIM_SQL" "$UA" "tx-a")" > "$OUT_A" 2>&1 &
PID_A=$!
# shellcheck disable=SC2059
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA \
  -c "$(printf "$CLAIM_SQL" "$UB" "tx-b")" > "$OUT_B" 2>&1 &
PID_B=$!

# ── 3. Prova che la sovrapposizione e' reale ─────────────────────────────────
sleep 3
WAITERS=$(psql_q "select count(distinct a.pid)
                    from pg_stat_activity a
                    join pg_locks l on l.pid = a.pid
                   where l.locktype = 'advisory'
                     and not l.granted
                     and a.query like '%claim_store_purchase%';")
echo "--- sessioni ferme sull'advisory lock della chiave (atteso 2): ${WAITERS} ---"
if [ "$WAITERS" != "2" ]; then
  echo "CASO 6: FAIL - la corsa non si e' verificata (waiter=${WAITERS} invece di 2)."
  echo "         Il test non ha misurato nulla: non dichiararlo superato."
  exit 1
fi

wait $PID_BARRIER; wait $PID_A; wait $PID_B

echo "--- esito utente A ---"; cat "$OUT_A"
echo "--- esito utente B ---"; cat "$OUT_B"

# ── 4. Esattamente un vincitore ──────────────────────────────────────────────
WON=$(grep -c '"outcome": "claimed"' "$OUT_A" "$OUT_B" | awk -F: '{s+=$2} END {print s}')
LOST=$(grep -c '"outcome": "owned_by_other_user"' "$OUT_A" "$OUT_B" | awk -F: '{s+=$2} END {print s}')

if [ "$WON" != "1" ] || [ "$LOST" != "1" ]; then
  echo "CASO 6: FAIL - atteso un claimed e un owned_by_other_user, ottenuti claimed=${WON} owned_by_other=${LOST}"
  exit 1
fi

# ── 5. E il registro deve contenere una riga sola, non due ───────────────────
ROWS=$(psql_q "select count(*) from private.billing_purchase_claims where ownership_key = '${KEY}';")
OWNERS=$(psql_q "select count(distinct owner_user_id) from private.billing_purchase_claims where ownership_key = '${KEY}';")
if [ "$ROWS" != "1" ] || [ "$OWNERS" != "1" ]; then
  echo "CASO 6: FAIL - registro con righe=${ROWS} proprietari=${OWNERS}, atteso 1 e 1"
  exit 1
fi

# ── 6. E il perdente non deve aver ottenuto un entitlement ───────────────────
PROJ=$(psql_q "select count(*) from public.b2c_subscriptions where user_id in ('${UA}','${UB}');")
if [ "$PROJ" != "1" ]; then
  echo "CASO 6: FAIL - ${PROJ} righe di proiezione per i due concorrenti, atteso 1 (solo il vincitore)"
  exit 1
fi

# ── 7. Il trigger deve essere tornato attivo dopo la pulizia difensiva ───────
TG=$(psql_q "select tgenabled from pg_trigger
              where tgrelid='private.billing_purchase_claims'::regclass
                and tgname='trg_billing_purchase_claims_immutable';")
if [ "$TG" != "O" ]; then
  echo "CASO 6: FAIL - il trigger di immutabilita' e' rimasto disabilitato (tgenabled=${TG})"
  exit 1
fi

echo "CASO 6: PASS (corsa reale verificata in pg_locks, un solo vincitore, un solo claim, un solo entitlement)"
