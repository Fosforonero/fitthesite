#!/usr/bin/env bash
# ============================================================================
# Sprint P0 Apple IAP, FASE 5, CASI 9 e 10: il backfill.
#
# Esercita lo SCRIPT REALE
# (supabase/backfill/20260808_billing_purchase_claims_backfill.sql), non una
# sua riscrittura in forma di test. Un backfill testato attraverso una copia
# della propria logica non e' testato: e' la copia a essere verificata, e la
# copia non e' quella che verra' lanciata sui dati veri.
#
# COSA VERIFICA
#   9.  idempotenza: dry run che non scrive, apply che scrive, secondo apply
#       che non riscrive niente e non sposta niente.
#   10. founder_grant e trial restano fuori dal registro.
#   +   le sicurezze che rendono il backfill utilizzabile su dati reali:
#       il purchase token Google non finisce in chiaro nel registro, un
#       acquisto gia' intestato a un altro utente FERMA tutto, e una fonte
#       commerciale sconosciuta (stripe) FERMA tutto invece di essere saltata.
#
# Gira contro lo stack locale. COMMITTA, quindi pulisce con un trap.
# ============================================================================
set -euo pipefail

CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BACKFILL="$REPO_ROOT/supabase/backfill/20260808_billing_purchase_claims_backfill.sql"

U_G='00000000-0000-4000-8000-00000000b001'   # acquisto google_play
U_A='00000000-0000-4000-8000-00000000b002'   # acquisto apple_iap
U_T='00000000-0000-4000-8000-00000000b003'   # trial, deve restare fuori
U_F='00000000-0000-4000-8000-00000000b004'   # founder_grant, deve restare fuori
U_X='00000000-0000-4000-8000-00000000b005'   # conflitto: proiezione dice lui
U_Y='00000000-0000-4000-8000-00000000b006'   # conflitto: registro dice lui
U_S='00000000-0000-4000-8000-00000000b007'   # stripe, fonte non gestita

GTOKEN='abcdefghij.AO-J1OxRAW_PURCHASE_TOKEN_PLAY_IN_CHIARO'
ATXN='2000000123456789'
CONFLICT_KEY='2000000987654321'

psql_q() { docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "$1"; }
psql_quiet() { docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -q -c "$1" >/dev/null; }

run_backfill() {  # $1 = "dry" | "apply"
  # Due rami espliciti invece di un array di argomenti: sotto `set -u`, in bash
  # 3.2 (quello di serie su macOS) l'espansione di un array VUOTO e' un errore
  # fatale, quindi il ramo "dry" morirebbe prima di lanciare qualsiasi cosa.
  if [ "$1" = "apply" ]; then
    docker exec -e PGPASSWORD=postgres "$CID" \
      psql -U postgres -d postgres -X -v ON_ERROR_STOP=1 -v claims_backfill_apply=1 \
      -f /tmp/bf_under_test.sql
  else
    docker exec -e PGPASSWORD=postgres "$CID" \
      psql -U postgres -d postgres -X -v ON_ERROR_STOP=1 \
      -f /tmp/bf_under_test.sql
  fi
}

fail() { echo "BACKFILL TEST: FAIL - $1"; exit 1; }

if ! docker exec "$CID" true >/dev/null 2>&1; then
  echo "Container '$CID' non raggiungibile. Avviare prima 'supabase start'." >&2
  exit 1
fi

teardown() {
  # Da B' gli stati vanno svuotati PRIMA dei claim: la chiave esterna e'
  # ON DELETE RESTRICT. La prima versione di questo teardown non lo faceva, la
  # DELETE sui claim falliva in silenzio (|| true), le righe diventavano
  # tombstone alla cancellazione degli utenti e il giro SUCCESSIVO della suite
  # ne trovava quattro che non aveva creato. Una suite che passa solo la prima
  # volta e' una suite che non si puo' credere.
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -q \
    -c "alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;" \
    -c "delete from private.billing_purchase_states
         where ownership_key in (encode(sha256(convert_to('${GTOKEN}','UTF8')),'hex'), '${ATXN}', '${CONFLICT_KEY}');" \
    -c "alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;" \
    -c "alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;" \
    -c "delete from private.billing_purchase_claims
         where ownership_key in (encode(sha256(convert_to('${GTOKEN}','UTF8')),'hex'), '${ATXN}', '${CONFLICT_KEY}');" \
    -c "alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;" \
    -c "delete from auth.users where id in ('${U_G}','${U_A}','${U_T}','${U_F}','${U_X}','${U_Y}','${U_S}');" \
    -c "alter table public.b2c_subscriptions drop constraint if exists b2c_subscriptions_billing_source_check;" \
    -c "alter table public.b2c_subscriptions add constraint b2c_subscriptions_billing_source_check
          check (billing_source in ('google_play','apple_iap','stripe','trial','founder_grant'));" >/dev/null 2>&1 || true
}
trap teardown EXIT
teardown   # residui di un giro precedente

# Le righe seminate qui rappresentano lo stato PRIMA che il registro
# esistesse: righe commerciali in proiezione senza nessuna proprieta'
# registrata. Sono esattamente cio' che il backfill deve coprire.
#
# Da 20260810140000 la guardia sulla proiezione, in modalita' compatibility,
# iscriverebbe la proprieta' al volo appena si scrive una riga commerciale — ed
# e' cio' che deve fare in produzione. Ma qui vanificherebbe il test: il
# backfill troverebbe tutto gia' coperto e non avrebbe niente da fare. Il seed
# entra quindi dalla stessa porta della proiezione, che e' l'unico modo onesto
# di ricreare una riga scritta quando quella porta non c'era.
seed_legacy() { psql_quiet "begin; select set_config('billing.projection','on',true); $1 commit;"; }

docker cp "$BACKFILL" "$CID":/tmp/bf_under_test.sql >/dev/null

echo '################ CASI 9 e 10: backfill ################'

# ── Fixture ─────────────────────────────────────────────────────────────────
# Qui c'era un workaround che allargava a mano il CHECK di b2c_subscriptions
# per poter rappresentare una riga founder_grant, perche' le migration del
# repository non ricostruivano il vincolo reale. Il teardown poi lo
# RIPRISTINAVA nella forma sbagliata, e da li' il test successivo della suite
# trovava uno schema che non ammetteva founder_grant e falliva.
#
# Il workaround e' stato rimosso: 20260810090000_schema_drift_realign.sql
# ricostruisce il vincolo vero, quindi la riga founder e' rappresentabile senza
# toccare niente. Il teardown ripristina ora la forma allineata.

psql_quiet "insert into auth.users (id, email, created_at) values
  ('${U_G}','bf-google@test.local', now()), ('${U_A}','bf-apple@test.local', now()),
  ('${U_T}','bf-trial@test.local', now()),  ('${U_F}','bf-founder@test.local', now());"

seed_legacy "insert into public.b2c_subscriptions
   (user_id, billing_source, external_product_id, external_subscription_id, external_order_id, active_until, auto_renewing, state)
 values
   ('${U_G}','google_play','fitmesh_pro_sub','${GTOKEN}','GPA.1111-2222-3333-44444', now() + interval '30 days', true, 'active'),
   ('${U_A}','apple_iap','fitmesh_pro_lifetime','${ATXN}','2000000123456790','9999-12-31T23:59:59Z', false, 'active'),
   ('${U_T}','trial','fitmesh_trial','trial-${U_T}', null, now() + interval '7 days', false, 'active'),
   ('${U_F}','founder_grant','fitmesh_founder','founder-${U_F}', null, '9999-12-31T23:59:59Z', false, 'active');"

# ── CASO 9a. DRY RUN: non deve scrivere niente ──────────────────────────────
run_backfill dry > /tmp/bf_dry.out 2>&1 || fail "il dry run e' uscito con errore (vedi /tmp/bf_dry.out)"
AFTER_DRY=$(psql_q "select count(*) from private.billing_purchase_claims;")
[ "$AFTER_DRY" = "0" ] || fail "il DRY RUN ha scritto ${AFTER_DRY} righe: doveva fare rollback"
grep -q 'DRY RUN' /tmp/bf_dry.out || fail "il dry run non ha dichiarato di essere un dry run"
echo "CASO 9a: PASS (dry run, 0 righe scritte)"

# ── CASO 9b. APPLY: scrive esattamente i due acquisti store ─────────────────
run_backfill apply > /tmp/bf_apply1.out 2>&1 || fail "l'apply e' fallito (vedi /tmp/bf_apply1.out)"
TOT=$(psql_q "select count(*) from private.billing_purchase_claims;")
[ "$TOT" = "2" ] || fail "attesi 2 claim dopo l'apply, trovati ${TOT}"

GKEY=$(psql_q "select encode(sha256(convert_to('${GTOKEN}','UTF8')),'hex');")
OWNER_G=$(psql_q "select owner_user_id from private.billing_purchase_claims where billing_source='google_play' and ownership_key='${GKEY}';")
OWNER_A=$(psql_q "select owner_user_id from private.billing_purchase_claims where billing_source='apple_iap' and ownership_key='${ATXN}';")
[ "$OWNER_G" = "$U_G" ] || fail "claim google intestato a ${OWNER_G} invece che a ${U_G}"
[ "$OWNER_A" = "$U_A" ] || fail "claim apple intestato a ${OWNER_A} invece che a ${U_A}"
echo "CASO 9b: PASS (apply, 2 claim, proprietari corretti)"

# ── Il purchase token NON deve essere finito in chiaro nel registro ─────────
LEAK=$(psql_q "select count(*) from private.billing_purchase_claims
                where ownership_key = '${GTOKEN}' or external_transaction_id = '${GTOKEN}';")
[ "$LEAK" = "0" ] || fail "il purchase token Play e' finito in chiaro nel registro"
# e la chiave deve essere davvero un digest, non il token
SHAPE=$(psql_q "select count(*) from private.billing_purchase_claims
                 where billing_source='google_play' and ownership_key ~ '^[0-9a-f]{64}\$';")
[ "$SHAPE" = "1" ] || fail "la chiave google non ha la forma di uno SHA-256"
echo "TOKEN: PASS (nel registro solo il digest, mai il token)"

# ── CASO 10. founder_grant e trial non entrano ─────────────────────────────
EXCL=$(psql_q "select count(*) from private.billing_purchase_claims
                where owner_user_id in ('${U_T}','${U_F}')
                   or ownership_key like 'trial-%' or ownership_key like 'founder-%';")
[ "$EXCL" = "0" ] || fail "trial/founder_grant sono entrati nel registro (${EXCL} righe)"
echo "CASO 10: PASS (trial e founder_grant esclusi)"

# ── CASO 9c. IDEMPOTENZA: secondo apply, nessuna scrittura, niente si sposta ─
BEFORE_SNAP=$(psql_q "select md5(string_agg(billing_source||ownership_key||coalesce(owner_user_id::text,'-')||claimed_at::text, '|' order by ownership_key)) from private.billing_purchase_claims;")
run_backfill apply > /tmp/bf_apply2.out 2>&1 || fail "il secondo apply e' fallito: il backfill non e' idempotente"
TOT2=$(psql_q "select count(*) from private.billing_purchase_claims;")
AFTER_SNAP=$(psql_q "select md5(string_agg(billing_source||ownership_key||coalesce(owner_user_id::text,'-')||claimed_at::text, '|' order by ownership_key)) from private.billing_purchase_claims;")
[ "$TOT2" = "2" ] || fail "il secondo apply ha portato le righe a ${TOT2}"
[ "$BEFORE_SNAP" = "$AFTER_SNAP" ] || fail "il secondo apply ha modificato righe esistenti (claimed_at o proprietario spostati)"
grep -qE '\| *0$|delta' /tmp/bf_apply2.out || true
echo "CASO 9c: PASS (secondo apply: 2 righe invariate, claimed_at non spostato)"

# ── CONFLITTO: un acquisto gia' intestato a un altro utente ferma tutto ─────
psql_quiet "insert into auth.users (id, email, created_at) values
  ('${U_X}','bf-conflict-proj@test.local', now()), ('${U_Y}','bf-conflict-reg@test.local', now());"
seed_legacy "insert into public.b2c_subscriptions
   (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
 values ('${U_X}','apple_iap','fitmesh_pro_lifetime','${CONFLICT_KEY}','9999-12-31T23:59:59Z', false, 'active');"
# il registro dice che quella transazione e' di un ALTRO utente
psql_quiet "insert into private.billing_purchase_claims
   (billing_source, ownership_key, external_product_id, owner_user_id, environment)
 values ('apple_iap','${CONFLICT_KEY}','fitmesh_pro_lifetime','${U_Y}','production');"

if run_backfill apply > /tmp/bf_conflict.out 2>&1; then
  fail "il backfill NON si e' fermato su un acquisto gia' intestato a un altro utente"
fi
grep -q 'V5' /tmp/bf_conflict.out || fail "il backfill si e' fermato ma non con la validazione V5 attesa"
STILL=$(psql_q "select owner_user_id from private.billing_purchase_claims where ownership_key='${CONFLICT_KEY}';")
[ "$STILL" = "$U_Y" ] || fail "il backfill ha sovrascritto il proprietario in conflitto"
echo "CONFLITTO: PASS (V5 ferma tutto, rumorosamente, senza sovrascrivere)"

# ── FONTE NON GESTITA: stripe deve fermare tutto, non essere saltata ────────
psql_quiet "delete from public.b2c_subscriptions where user_id='${U_X}';
            delete from private.billing_purchase_claims where false;"
psql_quiet "alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
            delete from private.billing_purchase_claims where ownership_key='${CONFLICT_KEY}';
            alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;"
psql_quiet "insert into auth.users (id, email, created_at) values ('${U_S}','bf-stripe@test.local', now());"
seed_legacy "insert into public.b2c_subscriptions
   (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
 values ('${U_S}','stripe','fitmesh_pro_sub','sub_stripe_123', now() + interval '30 days', true, 'active');"

if run_backfill apply > /tmp/bf_stripe.out 2>&1; then
  fail "una fonte commerciale non gestita (stripe) NON ha fermato il backfill"
fi
grep -q 'V1' /tmp/bf_stripe.out || fail "stripe ha fermato il backfill ma non con la validazione V1 attesa"
echo "FONTE NON GESTITA: PASS (stripe ferma il backfill invece di essere saltata in silenzio)"

echo ''
echo '=================================================='
echo 'backfill: TUTTE LE VERIFICHE OK'
echo '=================================================='
