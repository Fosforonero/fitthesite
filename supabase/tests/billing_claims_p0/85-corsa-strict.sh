#!/usr/bin/env bash
#
# PUNTO 3 DEL CANCELLO — la corsa fra il conteggio e il passaggio a strict.
#
# set_billing_projection_guard_mode() contava le righe commerciali scoperte e,
# se erano zero, cambiava il modo. Fra le due cose non c'era niente: una
# scrittura di compatibilita' gia' iniziata e non ancora committata non veniva
# contata — non e' visibile ad altre transazioni — e un istante dopo si
# ritrovava in un mondo che si dichiarava coperto. La finestra di rollout
# restava aperta e nessuno lo sapeva, che e' il modo peggiore in cui una difesa
# possa fallire: quello silenzioso.
#
# Non si puo' dimostrare in una sola sessione psql. Servono due connessioni
# vere, e serve misurare l'ATTESA: un test che guardasse solo l'esito finale
# passerebbe anche per caso, se le due istruzioni non si sovrapponessero.
#
# La riga scoperta si costruisce con l'unico percorso che la produce davvero:
# una chiave Apple fuori forma. La guardia in compatibility, davanti a una
# chiave che il registro rifiuterebbe, lascia passare la scrittura con un
# warning invece di farla fallire — perche' una scrittura respinta, con la 189
# in giro, significa una transazione chiusa senza diritto. La riga passa e
# resta scoperta: e' il caso che il passaggio a strict deve vedere.
set -uo pipefail

CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"
psql_q() { docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "$1"; }
fail()   { echo "CORSA STRICT: FAIL - $1"; exit 1; }

docker exec "$CID" true >/dev/null 2>&1 || fail "container '$CID' non raggiungibile"

U='00000000-0000-4000-8000-00000000c001'
# 100 caratteri: oltre i 64 ammessi dal vincolo di forma del registro. E' la
# forma che la guardia lascia passare senza iscrivere la proprieta'.
KEY_FUORI_FORMA="$(printf 'A%.0s' $(seq 1 100))"

teardown() {
  psql_q "begin; select set_config('billing.projection','on',true);
          delete from public.b2c_subscriptions where user_id='${U}'; commit;" >/dev/null 2>&1
  psql_q "delete from auth.users where id='${U}';" >/dev/null 2>&1
  psql_q "update private.billing_projection_guard_mode
          set mode='compatibility', note='teardown 85-corsa-strict' where singleton;" >/dev/null 2>&1
}
trap teardown EXIT
teardown

echo "################ PUNTO 3: la corsa fra conteggio e passaggio a strict ################"

psql_q "insert into auth.users (id, email, created_at)
        values ('${U}','corsa@test.local', now());" >/dev/null || fail "seed utente"
psql_q "update private.billing_projection_guard_mode
        set mode='compatibility' where singleton;" >/dev/null

MODO=$(psql_q "select mode from private.billing_projection_guard_mode where singleton;")
[ "$MODO" = "compatibility" ] || fail "premessa: il modo iniziale e' '$MODO'"

# ── La scrittura in volo ────────────────────────────────────────────────────
# Transazione aperta, riga scritta, commit ritardato di 4 secondi. E' l'istante
# esatto in cui il backend vecchio ha gia' scritto e non ha ancora committato.
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "
  begin;
  insert into public.b2c_subscriptions
    (user_id, billing_source, external_product_id, external_subscription_id,
     active_until, auto_renewing, state)
  values ('${U}','apple_iap','fitmesh_pro_lifetime','${KEY_FUORI_FORMA}',
          now() + interval '3650 days', false, 'active');
  select pg_sleep(4);
  commit;" > /tmp/corsa_a.out 2>&1 &
PID_A=$!

sleep 1

# ── Il passaggio a strict, mentre l'altra e' in volo ────────────────────────
INIZIO=$(date +%s)
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA \
  -c "select private.set_billing_projection_guard_mode('strict','corsa');" \
  > /tmp/corsa_b.out 2>&1
ESITO_B=$?
FINE=$(date +%s)
ATTESA=$((FINE - INIZIO))

wait "$PID_A" || true

echo "--- il passaggio a strict ha atteso ${ATTESA}s, esito=${ESITO_B} ---"
sed -n '1,3p' /tmp/corsa_b.out

# 1. Deve essere stato RIFIUTATO: la riga scoperta esiste.
[ "$ESITO_B" -ne 0 ] \
  || fail "strict e' stato concesso mentre una scrittura scoperta era in volo"
grep -q 'passaggio a strict rifiutato' /tmp/corsa_b.out \
  || fail "strict e' fallito, ma non con il rifiuto atteso (vedi /tmp/corsa_b.out)"

# 2. E deve avere ATTESO. Senza il lock, il rifiuto sarebbe arrivato subito e
#    per il motivo sbagliato: avrebbe contato una riga di un giro precedente,
#    non questa. L'attesa e' la prova che la corsa e' chiusa, non che l'esito
#    e' capitato giusto.
[ "$ATTESA" -ge 2 ] \
  || fail "il passaggio a strict non ha atteso la scrittura in volo (${ATTESA}s): la corsa e' ancora aperta"

# 3. Il modo non e' cambiato, e la riga scoperta e' li' a dimostrare perche'.
MODO=$(psql_q "select mode from private.billing_projection_guard_mode where singleton;")
[ "$MODO" = "compatibility" ] || fail "il modo e' diventato '$MODO' nonostante il rifiuto"
N=$(psql_q "select count(*) from public.b2c_subscriptions where user_id='${U}';")
[ "$N" = "1" ] || fail "la scrittura in volo non e' stata committata ($N righe): il test non ha provato niente"
N=$(psql_q "select count(*) from private.billing_purchase_claims
            where ownership_key='${KEY_FUORI_FORMA}';")
[ "$N" = "0" ] || fail "la chiave fuori forma e' finita nel registro"

echo "CASO 12: PASS (il passaggio a strict attende la scrittura in volo, e poi la conta)"

# ── La direzione opposta ────────────────────────────────────────────────────
# Adesso e' il passaggio a strict a essere in volo, e la scrittura commerciale
# ad arrivare in mezzo. L'esito deve essere DETERMINATO — accettata in
# compatibility, respinta in strict — mai "accettata mentre il modo diceva
# strict".
psql_q "begin; select set_config('billing.projection','on',true);
        delete from public.b2c_subscriptions where user_id='${U}'; commit;" >/dev/null

docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "
  begin;
  select private.set_billing_projection_guard_mode('strict','corsa inversa');
  select pg_sleep(4);
  commit;" > /tmp/corsa_c.out 2>&1 &
PID_C=$!

sleep 1

INIZIO=$(date +%s)
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "
  insert into public.b2c_subscriptions
    (user_id, billing_source, external_product_id, external_subscription_id,
     active_until, auto_renewing, state)
  values ('${U}','apple_iap','fitmesh_pro_lifetime','5000000000000001',
          now() + interval '3650 days', false, 'active');" > /tmp/corsa_d.out 2>&1
ESITO_D=$?
FINE=$(date +%s)
ATTESA=$((FINE - INIZIO))

wait "$PID_C" || true

echo "--- la scrittura commerciale ha atteso ${ATTESA}s, esito=${ESITO_D} ---"

[ "$ATTESA" -ge 2 ] \
  || fail "la scrittura commerciale non ha atteso il passaggio a strict (${ATTESA}s)"
[ "$ESITO_D" -ne 0 ] \
  || fail "la scrittura commerciale e' passata dopo che il modo era diventato strict"
grep -q 'fuori dal registro rifiutata' /tmp/corsa_d.out \
  || fail "la scrittura e' fallita, ma non con il rifiuto della guardia (vedi /tmp/corsa_d.out)"

echo "CASO 13: PASS (una scrittura che arriva durante il passaggio attende, e poi obbedisce al modo nuovo)"

echo ""
echo "=================================================="
echo "corsa compatibility -> strict: NESSUNA FINESTRA"
echo "=================================================="
