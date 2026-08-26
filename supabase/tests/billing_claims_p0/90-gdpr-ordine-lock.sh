#!/usr/bin/env bash
#
# IL GDPR VERO, NON DUE DELETE SCRITTE A MANO
#
# 86-ordine-lock.sh copre la cancellazione account nelle due forme che passano
# dall'API di Supabase, ma il CASO 4a esegue `delete from public.profiles` e
# `delete from auth.users` come SQL inline. Sono le stesse due istruzioni che
# public.gdpr_process_deletions() esegue, quindi sembrava equivalente. Non lo
# era, per due motivi:
#
#   * inline le due DELETE stanno in una transazione che il test controlla,
#     quindi il test decide anche QUANDO ciascuna parte. La funzione vera no.
#   * inline non c'e' il `exception when others` della funzione, che intercetta
#     anche un deadlock e lo trasforma in un `raise warning`: cioe' la funzione
#     vera puo' fallire SENZA che nessuno se ne accorga.
#
# ── L'INVERSIONE ────────────────────────────────────────────────────────────
#
#   gdpr_process_deletions : delete profiles (cascata -> b2c), poi auth.users
#   claim_store_purchase   : auth.users, poi b2c
#
# cioe' b2c->utente contro utente->b2c. Il trigger BEFORE DELETE su auth.users
# introdotto in 20260812093000 non copre questo caso e non poteva: parte quando
# si cancella auth.users, e a quel punto b2c e' gia' stata presa dallo statement
# precedente.
#
# ── COME SI OTTIENE L'INTERLEAVING, SENZA TOCCARE IL CODICE ─────────────────
#
# Serve che il GDPR arrivi su b2c PRIMA del claim, e che il claim si prenda
# auth.users mentre il GDPR e' fermo. La pausa arriva da una terza sessione che
# tiene la riga di b2c_subscriptions:
#
#   t=0  H  prende la riga b2c e dorme
#   t=1  G  gdpr_process_deletions() -> si ferma su b2c, primo della coda
#   t=2  A  claim -> prende auth.users, si ferma su b2c, secondo della coda
#   t=6  H  molla. G prende b2c, poi chiede auth.users: ce l'ha A.
#           A chiede b2c: ce l'ha G.  -> ciclo
#
# Nessuna delle tre sessioni esegue SQL al posto del codice di produzione: G
# chiama la funzione vera, A chiama la funzione vera, H prende un lock che
# esiste. L'unica cosa artificiale e' la durata della pausa.
#
# ── E SI PROVA CHE LA PROVA FUNZIONA ────────────────────────────────────────
#
# Un test che dice "nessun deadlock" e' credibile solo se sa produrne uno. Il
# CASO M installa la versione PRECEDENTE della funzione — quella senza i due
# lock in testa — e pretende il deadlock. Se non arriva, non e' una buona
# notizia: vuol dire che questo test non e' in grado di vedere il difetto che
# dichiara di sorvegliare, e fallisce.
set -uo pipefail

# Nessun bersaglio predefinito: la guardia impone le due variabili, rifiuta il
# container condiviso, e pretende PG17 piu' la sentinella dell'ambiente isolato.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/bersaglio.sh"
Q() { docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA -c "$1"; }
FAIL_COUNT=0
fail()  { echo "  FAIL - $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
fatal() { echo "GDPR ORDINE LOCK: FATAL - $1"; exit 1; }

docker exec "$CID" true >/dev/null 2>&1 || fatal "container '$CID' non raggiungibile"

U='00000000-0000-4000-8000-00000000c001'
K='6100000000000001'
# La chiave che il claim in corsa prova a reclamare. Deve stare qui sopra e non
# a meta' file: la pulizia la deve conoscere, altrimenti resta nel registro come
# tombstone e il test del backfill — che pretende la tabella VUOTA — fallisce al
# giro dopo per una ragione che non c'entra niente con lui.
K2='6100000000000002'
LIFETIME='9999-12-31T23:59:59Z'
OUT=/tmp/gdpr-ordine
mkdir -p "$OUT"

# La funzione vera processa TUTTE le richieste scadute del database. In un
# database di sviluppo condiviso questo test non deve cancellare gli utenti di
# qualcun altro: se ce ne sono, si ferma invece di indovinare.
ALTRE=$(Q "select count(*) from public.privacy_consents
           where data_deletion_requested_at is not null
             and data_deletion_completed_at is null
             and data_deletion_requested_at < now() - interval '24 hours'
             and user_id <> '${U}';")
[ "$ALTRE" = "0" ] || fatal "ci sono ${ALTRE} cancellazioni GDPR pendenti di altri utenti: questo test le eseguirebbe"

DEF_ORIGINALE=$(Q "select pg_catalog.pg_get_functiondef('public.gdpr_process_deletions()'::regprocedure);")
[ -n "$DEF_ORIGINALE" ] || fatal "gdpr_process_deletions() non trovata"

# La versione PRECEDENTE, copiata da 20260616090000: le due DELETE senza i lock
# in testa. Serve solo al CASO M e viene rimessa a posto subito dopo.
installa_mutante() {
  Q "
create or replace function public.gdpr_process_deletions()
returns integer language plpgsql security definer set search_path = '' as \$fn\$
declare uid uuid; n integer := 0;
begin
  for uid in
    select pc.user_id from public.privacy_consents pc
    where pc.data_deletion_requested_at is not null
      and pc.data_deletion_completed_at is null
      and pc.data_deletion_requested_at < now() - interval '24 hours'
  loop
    begin
      delete from public.profiles where id = uid;
      delete from auth.users where id = uid;
      n := n + 1;
    exception when others then
      raise warning 'gdpr deletion skipped for %: %', uid, sqlerrm;
    end;
  end loop;
  return n;
end; \$fn\$;" >/dev/null || fatal "installazione del mutante non riuscita"
}

ripristina_funzione() {
  printf '%s;\n' "$DEF_ORIGINALE" > "${OUT}/originale.sql"
  docker cp "${OUT}/originale.sql" "$CID":/tmp/gdpr-originale.sql >/dev/null 2>&1
  docker exec -e PGPASSWORD=postgres "$CID" \
    psql -U postgres -d "$DBN" -X -q -f /tmp/gdpr-originale.sql >/dev/null 2>&1
}

teardown() {
  Q "alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
     alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
     delete from private.billing_purchase_states where ownership_key in ('${K}','${K2}');
     delete from private.billing_purchase_claims where ownership_key in ('${K}','${K2}');
     alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
     alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;" >/dev/null 2>&1
  Q "delete from private.billing_pending_revocations where ownership_key in ('${K}','${K2}');" >/dev/null 2>&1
  Q "begin; select set_config('billing.projection','on',true);
     delete from public.b2c_subscriptions where user_id='${U}'; commit;" >/dev/null 2>&1
  Q "delete from public.privacy_consents where user_id='${U}';" >/dev/null 2>&1
  Q "delete from auth.users where id='${U}';" >/dev/null 2>&1
}
# La funzione va rimessa a posto anche se il test viene interrotto: lasciarla
# mutata avvelenerebbe ogni giro successivo, e in silenzio.
trap 'ripristina_funzione; teardown' EXIT INT TERM

bg() { # bg <file-out> <sql> -> PID_BG
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA \
    -v ON_ERROR_STOP=1 -c "$2" > "$1" 2>&1 &
  PID_BG=$!
}

seed() {
  teardown
  Q "insert into auth.users (id, email, created_at)
     values ('${U}','gdpr-ordine@test.local', now());" >/dev/null \
    || fatal "seed utente non riuscito"
  # Un acquisto reclamato: serve a far esistere la riga di b2c_subscriptions,
  # che e' cio' che le due parti si contendono.
  Q "select public.claim_store_purchase(
       'apple_iap','${K}','${U}'::uuid,'fitmesh_pro_lifetime','lifetime',
       'production','active','${LIFETIME}'::timestamptz,false,
       now(),'apple_signed_date','tx-${K}',null);" >/dev/null \
    || fatal "seed acquisto non riuscito"
  N=$(Q "select count(*) from public.b2c_subscriptions where user_id='${U}';")
  [ "$N" = "1" ] || fatal "premessa: la riga b2c doveva esistere (trovate ${N})"
  # La richiesta di cancellazione, scaduta la grace di 24h.
  Q "insert into public.privacy_consents (user_id, data_deletion_requested_at)
     values ('${U}', now() - interval '48 hours')
     on conflict (user_id) do update set
       data_deletion_requested_at = excluded.data_deletion_requested_at,
       data_deletion_completed_at = null;" >/dev/null \
    || fatal "seed richiesta GDPR non riuscito"
}

# Il claim deve usare una chiave DIVERSA da quella gia' reclamata, altrimenti
# esce subito con 'already_owned_by_same_user' senza arrivare a contendersi
# niente.
claim_sql() {
  cat <<SQL
select public.claim_store_purchase(
  'apple_iap', '${K2}', '${U}'::uuid, 'fitmesh_pro_lifetime', 'lifetime',
  'production', 'active', '${LIFETIME}'::timestamptz, false,
  now(), 'apple_signed_date', 'tx-${K2}', null
);
SQL
}

corsa_gdpr() { # corsa_gdpr <nome>  -> 0 se nessun deadlock, 1 se deadlock
  local nome="$1" pid_h pid_g pid_a
  bg "${OUT}/${nome}-H.out" \
    "begin; select 1 from public.b2c_subscriptions where user_id='${U}' for update; select pg_sleep(6); commit;"
  pid_h=$PID_BG
  sleep 1
  bg "${OUT}/${nome}-G.out" "select public.gdpr_process_deletions();"
  pid_g=$PID_BG
  sleep 1
  bg "${OUT}/${nome}-A.out" "$(claim_sql)"
  pid_a=$PID_BG

  wait "$pid_h" >/dev/null 2>&1
  wait "$pid_g" >/dev/null 2>&1
  wait "$pid_a" >/dev/null 2>&1

  # Il deadlock puo' comparire come errore di sessione OPPURE, se la vittima e'
  # il GDPR, come `WARNING: gdpr deletion skipped ... deadlock detected`, che e'
  # il modo in cui questo difetto sarebbe passato inosservato in produzione.
  local morto=""
  for s in H G A; do
    grep -qi 'deadlock detected' "${OUT}/${nome}-${s}.out" && morto="${morto}${s} "
  done
  DEADLOCK_IN="$morto"
  [ -z "$morto" ]
}

echo "########## GDPR: L'ORDINE DEI LOCK DELLA FUNZIONE VERA ##########"

# ── CASO M: il mutante deve morire ─────────────────────────────────────────
echo ""
echo "CASO M — la versione precedente della funzione DEVE andare in deadlock"
seed
installa_mutante
if corsa_gdpr "mutante"; then
  fail "casoM: la versione senza i lock in testa NON ha prodotto deadlock: questo test non e' in grado di vedere il difetto che sorveglia"
else
  echo "  deadlock nelle sessioni: ${DEADLOCK_IN}"
  # La conferma che conta: se la vittima e' il GDPR, la cancellazione NON e'
  # avvenuta e l'unica traccia e' un warning.
  if grep -qi 'gdpr deletion skipped' "${OUT}/mutante-G.out"; then
    echo "  e il GDPR l'ha inghiottito: 'gdpr deletion skipped' — nessun errore verso chi chiama"
  fi
  echo "CASO M: PASS (il difetto e' riproducibile)"
fi
ripristina_funzione

# ── CASO 1: la funzione vera ───────────────────────────────────────────────
echo ""
echo "CASO 1 — gdpr_process_deletions() vera, partendo PRIMA del claim"
seed
if corsa_gdpr "vera"; then
  N_UTENTE=$(Q "select count(*) from auth.users where id='${U}';")
  N_B2C=$(Q "select count(*) from public.b2c_subscriptions where user_id='${U}';")
  SKIP=$(grep -ci 'gdpr deletion skipped' "${OUT}/vera-G.out" || true)
  if [ "$SKIP" != "0" ]; then
    fail "caso1: la cancellazione e' stata saltata (${SKIP} volte) — vedi ${OUT}/vera-G.out"
  elif [ "$N_UTENTE" != "0" ] || [ "$N_B2C" != "0" ]; then
    fail "caso1: la cancellazione GDPR non ha ripulito (utente=${N_UTENTE} b2c=${N_B2C})"
  else
    echo "  nessun deadlock, utente e proiezione cancellati, nessuna riga saltata"
    echo "CASO 1: PASS"
  fi
else
  fail "caso1: DEADLOCK nelle sessioni ${DEADLOCK_IN}"
fi

# ── CASO 2: l'ordine opposto (claim per primo) ─────────────────────────────
#
# Non e' l'ordine che produce l'ABBA, ma va provato lo stesso: una correzione
# che sistemasse un verso rompendo l'altro sarebbe un pareggio, non un fix.
echo ""
echo "CASO 2 — lo stesso incrocio con il claim per primo"
seed
bg "${OUT}/inverso-H.out" \
  "begin; select 1 from public.b2c_subscriptions where user_id='${U}' for update; select pg_sleep(6); commit;"
PID_H=$PID_BG
sleep 1
bg "${OUT}/inverso-A.out" "$(claim_sql)"
PID_A=$PID_BG
sleep 1
bg "${OUT}/inverso-G.out" "select public.gdpr_process_deletions();"
PID_G=$PID_BG
wait "$PID_H" >/dev/null 2>&1
wait "$PID_A" >/dev/null 2>&1
wait "$PID_G" >/dev/null 2>&1
MORTO=""
for s in H A G; do
  grep -qi 'deadlock detected' "${OUT}/inverso-${s}.out" && MORTO="${MORTO}${s} "
done
if [ -n "$MORTO" ]; then
  fail "caso2: DEADLOCK nelle sessioni ${MORTO}"
else
  echo "  nessun deadlock nemmeno nell'ordine opposto"
  echo "CASO 2: PASS"
fi

echo ""
echo "=================================================="
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "GDPR ORDINE LOCK: la funzione vera sta nell'ordine unico"
  echo "=================================================="
  exit 0
fi
echo "GDPR ORDINE LOCK: ${FAIL_COUNT} FALLIMENTI (output in ${OUT}/)"
echo "=================================================="
exit 1
