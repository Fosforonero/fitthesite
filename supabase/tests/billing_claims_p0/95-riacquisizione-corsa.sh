#!/usr/bin/env bash
# ============================================================================
# CASO 7 — due account riacquisiscono la STESSA tombstone nello stesso istante.
#
# Deve vincerne uno solo. Non e' una proprieta' che si possa provare in una
# sola sessione: servono due transazioni davvero contemporanee, ciascuna che
# entra nella funzione prima che l'altra abbia committato.
#
# Il meccanismo che le serializza esiste gia' ed e' il lock avvisorio sulla
# chiave (`billing-purchase-claim:<source>:<key>`), preso PRIMA della SELECT.
# La UPDATE porta comunque le condizioni nella WHERE: se un domani quel lock
# sparisse, il perdente scriverebbe zero righe invece di sovrascrivere il
# proprietario appena assegnato — e questo test lo vedrebbe lo stesso.
# ============================================================================
set -uo pipefail
CONT="${SUPABASE_DB_CONTAINER:-pg17-190-reset}"
DB="${SUPABASE_DB_NAME:-ricostruzione}"
TX='5000000000000077'
A='00000000-0000-4000-8000-0000000c0001'
B='00000000-0000-4000-8000-0000000c0002'
V='00000000-0000-4000-8000-0000000c0003'

q() { docker exec -i "$CONT" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -t -A "$@"; }

# ── Preparazione: un acquisto vero, poi il proprietario si cancella ─────────
q -q <<SQL >/dev/null 2>&1 || { echo "KO  preparazione fallita"; exit 1; }
insert into auth.users (id, email, created_at) values
  ('$V','corsa-vecchio@test.local', now() - interval '400 days'),
  ('$A','corsa-a@test.local',       now() - interval '400 days'),
  ('$B','corsa-b@test.local',       now() - interval '400 days');
select public.claim_store_purchase('apple_iap','$TX','$V','fitmesh_pro_lifetime',
  'lifetime','production','active','9999-12-31T23:59:59Z',false,
  now() - interval '2 hours','apple_signed_date','$TX',null);
delete from auth.users where id = '$V';
SQL

stato=$(q -c "select owner_user_id is null and anonymized_at is not null
                from private.billing_purchase_claims
               where billing_source='apple_iap' and ownership_key='$TX';")
if [ "$stato" != "t" ]; then echo "KO  la tombstone non e' stata creata (stato=$stato)"; exit 1; fi

# ── La corsa ────────────────────────────────────────────────────────────────
# Entrambe aprono la transazione, aspettano lo stesso istante di partenza, poi
# chiamano. Senza l'attesa una delle due finirebbe prima che l'altra inizi, e
# il test proverebbe una sequenza invece di una corsa.
corsa() {
  local utente="$1" out="$2"
  q -q <<SQL > "$out" 2>&1
begin;
select pg_sleep(0.4);
select public.claim_store_purchase('apple_iap','$TX','$utente','fitmesh_pro_lifetime',
  'lifetime','production','active','9999-12-31T23:59:59Z',false,
  now(),'apple_signed_date','$TX',null) ->> 'outcome';
commit;
SQL
}
corsa "$A" /tmp/corsa-a.txt &
pa=$!
corsa "$B" /tmp/corsa-b.txt &
pb=$!
wait $pa; wait $pb

ea=$(grep -oE 'reclaimed_after_owner_deletion|owned_by_other_user|already_owned_by_same_user' /tmp/corsa-a.txt | head -1)
eb=$(grep -oE 'reclaimed_after_owner_deletion|owned_by_other_user|already_owned_by_same_user' /tmp/corsa-b.txt | head -1)

vincitori=0
[ "$ea" = "reclaimed_after_owner_deletion" ] && vincitori=$((vincitori+1))
[ "$eb" = "reclaimed_after_owner_deletion" ] && vincitori=$((vincitori+1))

prop=$(q -c "select count(distinct owner_user_id) from private.billing_purchase_claims
              where billing_source='apple_iap' and ownership_key='$TX' and owner_user_id is not null;")
audit=$(q -c "select count(*) from private.billing_riacquisizioni where ownership_key='$TX';")

esito=0
if [ "$vincitori" -ne 1 ]; then
  echo "KO  vincitori=$vincitori (A=$ea B=$eb): deve vincerne esattamente uno"; esito=1
fi
if [ "$prop" != "1" ]; then
  echo "KO  proprietari distinti=$prop: la tombstone deve avere un solo proprietario"; esito=1
fi
if [ "$audit" != "1" ]; then
  echo "KO  righe di audit=$audit: la riacquisizione va registrata una volta sola"; esito=1
fi

# ── Pulizia ─────────────────────────────────────────────────────────────────
q -q -c "delete from auth.users where id in ('$A','$B');" >/dev/null 2>&1

if [ "$esito" -eq 0 ]; then
  echo "ok  7. corsa fra due riacquisizioni: un solo vincitore (A=$ea B=$eb)"
fi
exit $esito
