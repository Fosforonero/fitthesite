#!/usr/bin/env bash
#
# Backfill su un database NON VUOTO, con fixture dei tre percorsi reali, e
# chiavi attese confrontate byte per byte.
#
# I test 30-* provano la meccanica (dry run, apply, idempotenza, esclusioni,
# conflitto) su due righe generiche. Questo prova la cosa che la meccanica non
# tocca: che la chiave DERIVATA da ciascun percorso sia esattamente quella
# attesa, cifra per cifra.
#
# Sbagliare la derivazione non produce un errore. Produce righe scritte, un
# backfill "riuscito", e mesi dopo un cliente che ha pagato e a cui il registro
# non riconosce piu' l'acquisto perche' la chiave salvata non e' quella che lo
# store ripresenta.
#
# I tre percorsi hanno derivazioni diverse e non intercambiabili:
#
#   Apple StoreKit 2   originalTransactionId dal JWS verificato, cosi' com'e'
#   Apple StoreKit 1   original_transaction_id da verifyReceipt, cosi' com'e'
#                      (stessa forma: e' lo stesso identificatore Apple, letto
#                      da due API diverse)
#   Google Play        SHA-256 esadecimale del purchase token. Il token in
#                      chiaro non entra mai nel registro.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BACKFILL="$REPO_ROOT/supabase/backfill/20260808_billing_purchase_claims_backfill.sql"
CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"

psql_q() { docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "$1"; }
fail()   { echo "FIXTURE TEST: FAIL - $1"; exit 1; }

docker exec "$CID" true >/dev/null 2>&1 || fail "container '$CID' non raggiungibile"

echo "################ CASO 11: backfill non vuoto, chiavi byte per byte ################"

# ── Identificatori delle fixture ────────────────────────────────────────────
U_SK2='00000000-0000-4000-8000-0000000f0001'
U_SK1='00000000-0000-4000-8000-0000000f0002'
U_GP='00000000-0000-4000-8000-0000000f0003'
U_FOUNDER='00000000-0000-4000-8000-0000000f0004'
U_TRIAL='00000000-0000-4000-8000-0000000f0005'

# Apple: originalTransactionId. StoreKit 2 li emette a 16 cifre che iniziano
# per 2, StoreKit 1 li ha storicamente a 10 cifre che iniziano per 1. La
# derivazione e' la stessa perche' e' lo stesso identificatore, letto da due
# API diverse: e' proprio questo che va provato, non dato per scontato.
K_SK2='2000000900000001'
K_SK1='1000000500000001'

# Google: il purchase token. Nel registro ci va il suo digest, mai lui.
TOKEN_GP='hjklmnop.AO-J1OxK8vN2mQ4rT6uW8yA0bC2dE4fG6hI8jK0lM2nO4pQ6rS8t'

teardown() {
  # Il registro NON si ripulisce con una DELETE, e non e' un difetto: il
  # trigger di immutabilita' la rifiuta perche' cancellare una riga renderebbe
  # quell'acquisto reclamabile da un altro utente. La prima versione di questo
  # teardown ci provava lo stesso e mandava l'errore in /dev/null: le righe
  # restavano, diventavano tombstone alla cancellazione degli utenti, e il
  # test successivo della suite trovava quattro righe che non aveva creato.
  #
  # Per riportare il registro a vuoto si ricrea: rollback + migration. E' una
  # cosa che si puo' fare solo su un database di prova, ed e' proprio la prova
  # che sulla produzione non si potrebbe.
  # -v claims_rollback_force=1 e' necessario: il rollback si RIFIUTA di
  # eliminare una tabella non vuota, perche' farlo renderebbe quegli acquisti
  # di nuovo reclamabili da chiunque. Su un database di prova e' cio' che
  # vogliamo; in produzione quella guardia e' esattamente cio' che deve
  # fermarci, e non va mai forzata senza aver esportato prima.
  #
  # Da B' gli oggetti sono due e l'ordine e' obbligatorio: lo STATO referenzia
  # la PROPRIETA', quindi si annulla stato -> proprieta' e si ricrea
  # proprieta' -> stato. Il rollback della proprieta' si RIFIUTA di girare
  # finche' la tabella degli stati esiste, quindi sbagliare ordine non passa
  # inosservato.
  docker exec -i "$CID" psql -U postgres -q -v ON_ERROR_STOP=1 -v states_rollback_force=1 \
    < "$REPO_ROOT/supabase/rollback/20260810120000_billing_purchase_states_rollback.sql" >/dev/null 2>&1
  docker exec -i "$CID" psql -U postgres -q -v ON_ERROR_STOP=1 -v claims_rollback_force=1 \
    < "$REPO_ROOT/supabase/rollback/20260808211929_billing_purchase_claims_registry_rollback.sql" >/dev/null 2>&1
  docker exec -i "$CID" psql -U postgres -q -v ON_ERROR_STOP=1 \
    < "$REPO_ROOT/supabase/migrations/20260808211929_billing_purchase_claims_registry.sql" >/dev/null 2>&1
  docker exec -i "$CID" psql -U postgres -q -v ON_ERROR_STOP=1 \
    < "$REPO_ROOT/supabase/migrations/20260810120000_billing_purchase_states.sql" >/dev/null 2>&1
  psql_q "delete from public.b2c_subscriptions
          where user_id in ('$U_SK2','$U_SK1','$U_GP','$U_FOUNDER','$U_TRIAL');" >/dev/null 2>&1
  psql_q "delete from auth.users
          where id in ('$U_SK2','$U_SK1','$U_GP','$U_FOUNDER','$U_TRIAL');" >/dev/null 2>&1
}
trap teardown EXIT
teardown

# ── Nessuna compensazione: lo schema e' quello vero ─────────────────────────
# Fino al 2026-08-10 qui c'era un ALTER che allineava a mano il vincolo
# b2c_subscriptions_billing_source_check, perche' la ricostruzione locale non
# ammetteva 'founder_grant' e la fixture founder non era nemmeno creabile.
#
# Ora la migration 20260810090000_schema_drift_realign.sql ricostruisce il
# vincolo reale, quindi il test gira sullo schema di produzione e l'esclusione
# dei founder e' provata davvero, non su una forma aggiustata per l'occasione.
if [ "$(psql_q "select position('founder_grant' in pg_get_constraintdef(oid)) from pg_constraint where conname='b2c_subscriptions_billing_source_check';")" = "0" ]; then
  fail "il vincolo billing_source non ammette founder_grant: manca la migration di riallineamento"
fi

# ── Fixture ─────────────────────────────────────────────────────────────────
psql_q "insert into auth.users (id, email, created_at) values
  ('$U_SK2','sk2@fixture.test',now()),
  ('$U_SK1','sk1@fixture.test',now()),
  ('$U_GP','gp@fixture.test',now()),
  ('$U_FOUNDER','founder@fixture.test',now()),
  ('$U_TRIAL','trial@fixture.test',now());" >/dev/null || fail "seed auth.users"

psql_q "insert into public.b2c_subscriptions
  (user_id, billing_source, external_product_id, external_subscription_id,
   external_order_id, active_until, auto_renewing, state)
 values
  ('$U_SK2','apple_iap','fitmesh_pro_lifetime','$K_SK2','1000000111111111',
   now()+interval '3650 days', false,'active'),
  ('$U_SK1','apple_iap','fitmesh_pro_lifetime','$K_SK1','1000000222222222',
   now()+interval '3650 days', false,'active'),
  ('$U_GP','google_play','fitmesh_pro_sub','$TOKEN_GP','GPA.3300-1111-2222-33333',
   now()+interval '180 days', true,'active'),
  -- external_subscription_id e' NOT NULL anche per le fonti che non sono
  -- acquisti store: in produzione le 18 righe founder_grant hanno un valore
  -- corto (15-16 caratteri), non null. La fixture rispecchia quella forma,
  -- altrimenti proverebbe un'esclusione su righe che non potrebbero esistere.
  ('$U_FOUNDER','founder_grant','fitmesh_pro_lifetime','founder-launch-1','',
   now()+interval '3650 days', false,'active'),
  ('$U_TRIAL','trial','fitmesh_pro_lifetime','trial-14-giorni','',
   now()+interval '14 days', false,'active');" >/dev/null || fail "seed b2c_subscriptions"

# ── Chiavi attese, calcolate FUORI dal backfill ─────────────────────────────
# Il digest lo calcola qui il database con la stessa primitiva che usa
# ownership-key.ts (verificato identico byte per byte). Confrontarlo con cio'
# che il backfill scrive prova che le due derivazioni non sono divergute.
K_GP_ATTESA=$(psql_q "select encode(sha256(convert_to('$TOKEN_GP','UTF8')),'hex');")
[ ${#K_GP_ATTESA} -eq 64 ] || fail "la chiave Google attesa non e' un digest a 64 cifre"

# ── Dry run: non deve scrivere niente ───────────────────────────────────────
docker cp "$BACKFILL" "$CID":/tmp/bf_fx.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X \
  -v ON_ERROR_STOP=1 -f /tmp/bf_fx.sql > /tmp/bf_fx_dry.out 2>&1 \
  || fail "dry run uscito con errore (vedi /tmp/bf_fx_dry.out)"

N=$(psql_q "select count(*) from private.billing_purchase_claims
            where owner_user_id in ('$U_SK2','$U_SK1','$U_GP');")
[ "$N" = "0" ] || fail "il dry run ha scritto $N righe"
echo "CASO 11a: PASS (dry run su fixture non vuote, 0 righe scritte)"

# ── Apply ───────────────────────────────────────────────────────────────────
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X \
  -v ON_ERROR_STOP=1 -v claims_backfill_apply=1 -f /tmp/bf_fx.sql > /tmp/bf_fx_apply.out 2>&1 \
  || fail "apply uscito con errore (vedi /tmp/bf_fx_apply.out)"

N=$(psql_q "select count(*) from private.billing_purchase_claims
            where owner_user_id in ('$U_SK2','$U_SK1','$U_GP');")
[ "$N" = "3" ] || fail "attese 3 righe, trovate $N"
echo "CASO 11b: PASS (apply, 3 acquisti store dei tre percorsi)"

# ── Le chiavi, cifra per cifra ──────────────────────────────────────────────
verifica_chiave() {  # $1=utente $2=chiave attesa $3=etichetta
  local vera
  vera=$(psql_q "select ownership_key from private.billing_purchase_claims
                 where owner_user_id = '$1';")
  if [ "$vera" != "$2" ]; then
    fail "$3: chiave '$vera' invece di '$2'"
  fi
  echo "  $3: $2"
}
echo "--- chiavi scritte, confrontate byte per byte ---"
verifica_chiave "$U_SK2" "$K_SK2"       "Apple StoreKit 2 (originalTransactionId)"
verifica_chiave "$U_SK1" "$K_SK1"       "Apple StoreKit 1 (original_transaction_id)"
verifica_chiave "$U_GP"  "$K_GP_ATTESA" "Google Play (SHA-256 del purchase token)"
echo "CASO 11c: PASS (tre derivazioni, tre chiavi esatte)"

# ── Il token in chiaro non e' nel registro ──────────────────────────────────
N=$(psql_q "select count(*) from private.billing_purchase_claims
            where ownership_key like '%${TOKEN_GP}%'
               or coalesce(external_transaction_id,'') like '%${TOKEN_GP}%';")
[ "$N" = "0" ] || fail "il purchase token in chiaro e' finito nel registro"
echo "CASO 11d: PASS (nel registro solo il digest, mai il token)"

# ── Founder e trial: esclusi ────────────────────────────────────────────────
N=$(psql_q "select count(*) from private.billing_purchase_claims
            where owner_user_id in ('$U_FOUNDER','$U_TRIAL');")
[ "$N" = "0" ] || fail "founder/trial hanno prodotto $N claim: non sono acquisti store"
echo "CASO 11e: PASS (founder_grant e trial esclusi)"

# ── Replay: secondo apply identico, niente cambia ───────────────────────────
PRIMA=$(psql_q "select string_agg(ownership_key || '|' || owner_user_id::text || '|' || claimed_at::text, ',' order by ownership_key)
                from private.billing_purchase_claims
                where owner_user_id in ('$U_SK2','$U_SK1','$U_GP');")
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X \
  -v ON_ERROR_STOP=1 -v claims_backfill_apply=1 -f /tmp/bf_fx.sql > /tmp/bf_fx_replay.out 2>&1 \
  || fail "replay uscito con errore (vedi /tmp/bf_fx_replay.out)"
DOPO=$(psql_q "select string_agg(ownership_key || '|' || owner_user_id::text || '|' || claimed_at::text, ',' order by ownership_key)
               from private.billing_purchase_claims
               where owner_user_id in ('$U_SK2','$U_SK1','$U_GP');")
[ "$PRIMA" = "$DOPO" ] || fail "il replay ha cambiato qualcosa"
N=$(psql_q "select count(*) from private.billing_purchase_claims
            where owner_user_id in ('$U_SK2','$U_SK1','$U_GP');")
[ "$N" = "3" ] || fail "dopo il replay ci sono $N righe invece di 3"
echo "CASO 11f: PASS (replay idempotente: chiavi, proprietari e claimed_at invariati)"

# ── Conflitto: la stessa chiave presentata da un altro account ──────────────
# Non deve riassegnare niente, e non deve nemmeno passare inosservato.
psql_q "update public.b2c_subscriptions
        set external_subscription_id = '$K_SK2'
        where user_id = '$U_GP';" >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X \
  -v ON_ERROR_STOP=1 -v claims_backfill_apply=1 -f /tmp/bf_fx.sql > /tmp/bf_fx_conflict.out 2>&1
PROPRIETARIO=$(psql_q "select owner_user_id from private.billing_purchase_claims
                       where ownership_key = '$K_SK2';")
[ "$PROPRIETARIO" = "$U_SK2" ] || fail "il conflitto ha riassegnato la proprieta' a $PROPRIETARIO"
echo "CASO 11g: PASS (conflitto: proprieta' non riassegnata)"

echo ""
echo "=================================================="
echo "backfill su fixture: TUTTE LE VERIFICHE OK"
echo "=================================================="
