#!/usr/bin/env bash
# ============================================================================
# B' — CONCORRENZA SULL'ENTITLEMENT, con connessioni vere
#
# 40-concurrency.sh copre la corsa fra due UTENTI sulla STESSA chiave, che il
# lock sulla chiave gia' serializzava. Qui si coprono le tre corse che quel
# lock NON serializzava, e che con il ricalcolo del migliore diritto diventano
# pericolose:
#
#   CASO 11  due chiavi DIVERSE dello stesso utente, insieme. Prima non si
#            vedevano fra loro: entrambe leggevano lo stesso stato di partenza
#            e riscrivevano l'unica riga di proiezione in ordine arbitrario.
#   CASO 15  una riga founder_grant che arriva MENTRE un acquisto commerciale
#            e' gia' dentro la funzione. Il lock sull'utente non la protegge,
#            perche' chi scrive il founder quel lock non lo prende: la difesa
#            deve stare nella singola istruzione SQL.
#   CASO 16  deadlock. Due transazioni che reclamano le stesse due chiavi in
#            ordine OPPOSTO. Con i lock presi utente->chiave non puo' esistere
#            un ciclo; con l'ordine inverso ci sarebbe.
#
# Come in 40-concurrency.sh la sovrapposizione non e' sperata ma COSTRUITA con
# una sessione barriera, e VERIFICATA in pg_locks prima di dichiarare qualunque
# esito: un test di concorrenza che non si sovrappone passa sempre e non
# misura niente.
#
# Questo file COMMITTA. La pulizia e' in un trap che scatta anche in errore.
# ============================================================================
set -euo pipefail

# Nessun bersaglio predefinito: la guardia impone le due variabili, rifiuta il
# container condiviso, e pretende PG17 piu' la sentinella dell'ambiente isolato.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/bersaglio.sh"
U1='00000000-0000-4000-8000-00000000d001'
U2='00000000-0000-4000-8000-00000000d002'
U3='00000000-0000-4000-8000-00000000d003'
KL='7000000000000001'                                    # Apple, lifetime
KG=$(printf 'd0d0%060d' 1 | tr ' ' '0')                  # Google, 64 esadecimali
KG2=$(printf 'd0d1%060d' 2 | tr ' ' '0')
# Il caso 16 usa chiavi PROPRIE: riusare quelle del caso 11 le farebbe
# risultare gia' di un altro utente, e le due transazioni non scriverebbero
# niente — il test passerebbe senza aver mai esercitato i lock.
KL3='7000000000000003'
KG3=$(printf 'd0d3%060d' 3 | tr ' ' '0')
OUT1=$(mktemp); OUT2=$(mktemp); OUT3=$(mktemp); OUTB=$(mktemp)

psql_q() { docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA -c "$1"; }

if ! docker exec "$CID" true >/dev/null 2>&1; then
  echo "Container '$CID' non raggiungibile. Avviare prima 'supabase start'." >&2
  exit 1
fi

teardown() {
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -q \
    -c "alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;" \
    -c "delete from private.billing_purchase_states where ownership_key in ('${KL}','${KG}','${KG2}','${KL3}','${KG3}');" \
    -c "alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;" \
    -c "alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;" \
    -c "delete from private.billing_purchase_claims where ownership_key in ('${KL}','${KG}','${KG2}','${KL3}','${KG3}');" \
    -c "alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;" \
    -c "begin; select set_config('billing.projection','on',true); delete from public.b2c_subscriptions where user_id in ('${U1}','${U2}','${U3}'); commit;" \
    -c "delete from auth.users where id in ('${U1}','${U2}','${U3}');" >/dev/null 2>&1 || true
  rm -f "$OUT1" "$OUT2" "$OUT3" "$OUTB"
}
trap teardown EXIT
teardown >/dev/null 2>&1 || true

psql_q "insert into auth.users (id, email, created_at) values
          ('${U1}','conc-e1@test.local', now() - interval '400 days'),
          ('${U2}','conc-e2@test.local', now() - interval '400 days'),
          ('${U3}','conc-e3@test.local', now() - interval '400 days');" >/dev/null

claim_sql() { # $1=utente $2=fonte $3=chiave $4=sku $5=tipo $6=stato $7=scadenza
  cat <<SQL
select public.claim_store_purchase(
  p_billing_source => '$2', p_ownership_key => '$3',
  p_owner_user_id => '$1'::uuid,
  p_external_product_id => '$4', p_purchase_kind => '$5',
  p_environment => 'production', p_state => '$6',
  p_active_until => $7, p_auto_renewing => false,
  p_store_event_at => now(),
  p_store_event_source => case when '$2' = 'apple_iap' then 'apple_signed_date' else 'google_backend_fetch' end);
SQL
}

USER_LOCK1="pg_advisory_xact_lock(1, hashtext('${U1}'))"

# ══ CASO 11: due chiavi diverse dello stesso utente, insieme ═════════════════
echo '################ CASO 11: due acquisti dello stesso utente in concorrenza ################'

docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA \
  -c "begin; select ${USER_LOCK1}; select pg_sleep(8); commit;" > "$OUTB" 2>&1 &
PIDB=$!
sleep 1

docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA \
  -c "$(claim_sql "$U1" apple_iap "$KL" fitmesh_pro_lifetime lifetime active "'9999-12-31T23:59:59Z'::timestamptz")" > "$OUT1" 2>&1 &
PID1=$!
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA \
  -c "$(claim_sql "$U1" google_play "$KG" fitmesh_pro_sub subscription active "now() + interval '30 days'")" > "$OUT2" 2>&1 &
PID2=$!

sleep 3
WAITERS=$(psql_q "select count(distinct a.pid)
                    from pg_stat_activity a
                    join pg_locks l on l.pid = a.pid
                   where l.locktype = 'advisory' and not l.granted
                     and a.query like '%claim_store_purchase%';")
echo "--- sessioni ferme sul lock UTENTE (atteso 2): ${WAITERS} ---"
if [ "$WAITERS" != "2" ]; then
  echo "CASO 11: FAIL - le due chiamate non si sono serializzate sull'utente (waiter=${WAITERS})."
  echo "         Senza il lock sull'utente due acquisti diversi non si vedono: il test non ha misurato nulla."
  exit 1
fi

wait $PIDB; wait $PID1; wait $PID2
echo "--- esito acquisto lifetime ---"; cat "$OUT1"
echo "--- esito acquisto subscription ---"; cat "$OUT2"

CLAIMS=$(psql_q "select count(*) from private.billing_purchase_claims where owner_user_id = '${U1}';")
STATES=$(psql_q "select count(*) from private.billing_purchase_states s
                   join private.billing_purchase_claims c using (billing_source, ownership_key)
                  where c.owner_user_id = '${U1}';")
PROJ=$(psql_q "select external_product_id || '/' || state from public.b2c_subscriptions where user_id = '${U1}';")
if [ "$CLAIMS" != "2" ] || [ "$STATES" != "2" ] || [ "$PROJ" != "fitmesh_pro_lifetime/active" ]; then
  echo "CASO 11: FAIL - claim=${CLAIMS} stati=${STATES} proiezione=${PROJ} (atteso 2, 2, fitmesh_pro_lifetime/active)"
  exit 1
fi
echo "CASO 11: PASS (serializzati sull'utente, due proprieta' registrate, proiezione = il migliore diritto)"

# ══ CASO 15: founder che arriva mentre un acquisto commerciale e' in corso ═══
echo ''
echo '################ CASO 15: founder_grant concorrente a un acquisto commerciale ################'

USER_LOCK2="pg_advisory_xact_lock(1, hashtext('${U2}'))"
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA \
  -c "begin; select ${USER_LOCK2}; select pg_sleep(6); commit;" > "$OUTB" 2>&1 &
PIDB=$!
sleep 1

docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA \
  -c "$(claim_sql "$U2" google_play "$KG2" fitmesh_pro_sub subscription active "now() + interval '30 days'")" > "$OUT3" 2>&1 &
PID3=$!
sleep 2

BLOCKED=$(psql_q "select count(*) from pg_stat_activity a join pg_locks l on l.pid = a.pid
                   where l.locktype='advisory' and not l.granted
                     and a.query like '%claim_store_purchase%';")
if [ "$BLOCKED" -lt 1 ]; then
  echo "CASO 15: FAIL - l'acquisto commerciale non era dentro la funzione: niente corsa da misurare."
  exit 1
fi

# Il founder entra ADESSO, mentre l'altro e' fermo. Nessun lock lo trattiene:
# e' esattamente il percorso reale.
psql_q "insert into public.b2c_subscriptions (user_id, billing_source, external_product_id,
          external_subscription_id, active_until, auto_renewing, state)
        values ('${U2}', 'founder_grant', 'founder', 'founder-${U2}',
                '9999-12-31T23:59:59Z', false, 'active');" >/dev/null

wait $PIDB; wait $PID3
echo "--- esito acquisto commerciale ---"; cat "$OUT3"

SRC=$(psql_q "select billing_source from public.b2c_subscriptions where user_id = '${U2}';")
OWNED=$(psql_q "select count(*) from private.billing_purchase_claims where owner_user_id = '${U2}';")
if [ "$SRC" != "founder_grant" ]; then
  echo "CASO 15: FAIL - la riga founder e' stata sostituita da '${SRC}'"
  exit 1
fi
if [ "$OWNED" != "1" ]; then
  echo "CASO 15: FAIL - la proprieta' dell'acquisto non e' stata registrata (claim=${OWNED})."
  echo "         Proteggere il founder non deve voler dire perdere l'acquisto."
  exit 1
fi
echo "CASO 15: PASS (founder intatto, e la proprieta' dell'acquisto registrata lo stesso)"

# ══ CASO 16: deadlock, con le due chiavi in ordine opposto ═══════════════════
echo ''
echo '################ CASO 16: due transazioni, stesse chiavi, ordine opposto ################'
# Ogni transazione reclama DUE acquisti dello stesso utente, una in ordine
# (lifetime, sub) e l'altra in ordine (sub, lifetime). Se i lock si prendessero
# per chiave prima che per utente, questo e' il ciclo classico e Postgres
# ucciderebbe una delle due con 40P01.
psql_q "begin; select set_config('billing.projection','on',true); delete from public.b2c_subscriptions where user_id = '${U3}'; commit;" >/dev/null

TX_A="begin;
$(claim_sql "$U3" apple_iap "$KL3" fitmesh_pro_lifetime lifetime active "'9999-12-31T23:59:59Z'::timestamptz")
select pg_sleep(1);
$(claim_sql "$U3" google_play "$KG3" fitmesh_pro_sub subscription active "now() + interval '30 days'")
commit;"
TX_B="begin;
$(claim_sql "$U3" google_play "$KG3" fitmesh_pro_sub subscription active "now() + interval '30 days'")
select pg_sleep(1);
$(claim_sql "$U3" apple_iap "$KL3" fitmesh_pro_lifetime lifetime active "'9999-12-31T23:59:59Z'::timestamptz")
commit;"

DEAD=0
for round in 1 2 3 4 5; do
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA -c "$TX_A" > "$OUT1" 2>&1 &
  P1=$!
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA -c "$TX_B" > "$OUT2" 2>&1 &
  P2=$!
  wait $P1 || true
  wait $P2 || true
  if grep -qi "deadlock" "$OUT1" "$OUT2"; then
    DEAD=$((DEAD + 1))
    echo "  giro ${round}: DEADLOCK"
    grep -i deadlock "$OUT1" "$OUT2" | head -2
  fi
done

if [ "$DEAD" != "0" ]; then
  echo "CASO 16: FAIL - ${DEAD} deadlock su 5 giri. L'ordine dei lock non e' quello dichiarato."
  exit 1
fi
FINAL=$(psql_q "select external_product_id || '/' || state from public.b2c_subscriptions where user_id = '${U3}';")
if [ "$FINAL" != "fitmesh_pro_lifetime/active" ]; then
  echo "CASO 16: FAIL - proiezione finale '${FINAL}', atteso fitmesh_pro_lifetime/active"
  exit 1
fi
echo "CASO 16: PASS (5 giri, zero deadlock, proiezione finale coerente)"
