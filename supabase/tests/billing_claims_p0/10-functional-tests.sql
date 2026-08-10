-- ============================================================================
-- Sprint P0 Apple IAP, FASE 2/3: verifica funzionale del registro di
-- proprieta' e della RPC atomica.
--
-- Gira contro il DATABASE LOCALE gia' migrato (`supabase start`), mai contro
-- produzione. Tutto dentro una transazione che termina con ROLLBACK: al
-- termine il database e' identico a com'era, nessuna riga sopravvive.
--
-- Ogni caso fallito solleva un'eccezione e ferma la suite (ON_ERROR_STOP).
-- ============================================================================

\set ON_ERROR_STOP on
begin;

-- ── Fixture ─────────────────────────────────────────────────────────────
-- I profili sono creati dal trigger on_auth_user_created: non vanno inseriti
-- a mano, sarebbe una violazione di chiave primaria.
insert into auth.users (id, email, created_at) values
  ('00000000-0000-4000-8000-00000000000a', 'claims-a@test.local', now()),
  ('00000000-0000-4000-8000-00000000000b', 'claims-b@test.local', now()),
  ('00000000-0000-4000-8000-00000000000c', 'claims-c@test.local', now()),
  ('00000000-0000-4000-8000-00000000000d', 'claims-d@test.local', now());

-- L'utente C perde il profilo: serve a rompere di proposito la scrittura
-- sulla proiezione (FK b2c_subscriptions.user_id -> profiles.id) e verificare
-- che il claim venga annullato insieme a lei.
delete from public.profiles where id = '00000000-0000-4000-8000-00000000000c';

do $$
declare
  a constant uuid := '00000000-0000-4000-8000-00000000000a';
  b constant uuid := '00000000-0000-4000-8000-00000000000b';
  c constant uuid := '00000000-0000-4000-8000-00000000000c';
  d constant uuid := '00000000-0000-4000-8000-00000000000d';
  k_a  constant text := '2000000111111111';
  k_d  constant text := '2000000444444444';
  k_g  constant text := repeat('a', 64);
  lifetime constant timestamptz := '9999-12-31T23:59:59Z';
  v jsonb;
  v_rows int;
  v_claimed_at timestamptz;
  v_claimed_at_2 timestamptz;
  v_txt text;
  v_txt2 text;
  v_uuid uuid;
  v_ts timestamptz;
  v_bool boolean;
  v_passed int := 0;
begin
  -- ── 1. Claim nuovo: outcome claimed, registro scritto, proiezione scritta
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => k_a,
    p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now() - interval '1 hour',
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => k_a,
    p_app_account_token => a
  );
  if v->>'outcome' <> 'claimed' then
    raise exception 'TEST 1: atteso claimed, ottenuto %', v;
  end if;
  select count(*) into v_rows from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = k_a and owner_user_id = a;
  if v_rows <> 1 then raise exception 'TEST 1: registro non scritto (% righe)', v_rows; end if;
  select external_subscription_id, state into v_txt, v_txt2
    from public.b2c_subscriptions where user_id = a;
  if v_txt is distinct from k_a then
    raise exception 'TEST 1: proiezione non scritta (external_subscription_id=%)', v_txt;
  end if;
  select claimed_at into v_claimed_at from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = k_a;
  v_passed := v_passed + 1;

  -- ── 2. Ripresentazione dello stesso utente (restore): idempotente.
  -- Il transactionId e' DIVERSO, come dopo un restore reale: non deve
  -- cambiare niente nel registro, ma la proiezione deve aggiornarsi.
  --
  -- Da B' l'aggiornamento dello stato avviene SOLO se l'evidenza portata e'
  -- piu' recente di quella registrata. Qui lo e' di un'ora, come in un restore
  -- vero; con due `now()` identici il secondo evento verrebbe scartato, ed e'
  -- corretto che sia cosi': a parita' di timestamp non esiste un ordine.
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => k_a,
    p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'grace',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => '2000000999999999',
    p_app_account_token => a
  );
  if v->>'outcome' <> 'already_owned_by_same_user' then
    raise exception 'TEST 2: atteso already_owned_by_same_user, ottenuto %', v;
  end if;
  if (v->>'stateApplied')::boolean is not true then
    raise exception 'TEST 2: evidenza piu recente non applicata (stateApplied=%)', v->>'stateApplied';
  end if;
  select claimed_at, external_transaction_id into v_claimed_at_2, v_txt
    from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = k_a;
  if v_claimed_at_2 <> v_claimed_at then
    raise exception 'TEST 2: claimed_at spostato dalla ripresentazione (% -> %)', v_claimed_at, v_claimed_at_2;
  end if;
  if v_txt <> k_a then
    raise exception 'TEST 2: external_transaction_id sovrascritto dalla ripresentazione (%)', v_txt;
  end if;
  select state, external_order_id into v_txt, v_txt2 from public.b2c_subscriptions where user_id = a;
  if v_txt <> 'grace' then
    raise exception 'TEST 2: proiezione NON aggiornata sul percorso idempotente (state=%)', v_txt;
  end if;
  v_passed := v_passed + 1;

  -- ── 3. Un altro utente reclama la stessa transazione: conflict, zero scritture
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => k_a,
    p_owner_user_id => b,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date'
  );
  if v->>'outcome' <> 'owned_by_other_user' then
    raise exception 'TEST 3: atteso owned_by_other_user, ottenuto %', v;
  end if;
  if (v->>'ownerDeleted')::boolean then
    raise exception 'TEST 3: ownerDeleted deve essere false, il proprietario esiste';
  end if;
  select count(*) into v_rows from public.b2c_subscriptions where user_id = b;
  if v_rows <> 0 then raise exception 'TEST 3: proiezione scritta per il reclamante sbagliato'; end if;
  select owner_user_id into v_uuid from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = k_a;
  if v_uuid <> a then raise exception 'TEST 3: proprietario cambiato (%)' , v_uuid; end if;
  v_passed := v_passed + 1;

  -- ── 4. La proiezione fallisce: il claim appena creato deve sparire.
  -- L'utente C esiste in auth.users ma non ha profilo: la FK della proiezione
  -- salta, e con lei tutta la sottotransazione.
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => '2000000555555555',
    p_owner_user_id => c,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date'
  );
  if v->>'outcome' <> 'persistence_failed' then
    raise exception 'TEST 4: atteso persistence_failed, ottenuto %', v;
  end if;
  select count(*) into v_rows from private.billing_purchase_claims
   where ownership_key = '2000000555555555';
  if v_rows <> 0 then
    raise exception 'TEST 4: il claim NON e'' stato annullato: % righe orfane', v_rows;
  end if;
  v_passed := v_passed + 1;

  -- ── 5. Google: chiave nella forma corretta (SHA-256 hex)
  v := public.claim_store_purchase(
    p_billing_source => 'google_play',
    p_ownership_key => k_g,
    p_owner_user_id => b,
    p_external_product_id => 'fitmesh_pro_sub',
    p_purchase_kind => 'subscription',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => now() + interval '30 days',
    p_auto_renewing => true,
    p_store_event_at => now(),
    p_store_event_source => 'google_backend_fetch',
    p_external_transaction_id => 'GPA.1111-2222-3333-44444'
  );
  if v->>'outcome' <> 'claimed' then
    raise exception 'TEST 5: atteso claimed, ottenuto %', v;
  end if;
  v_passed := v_passed + 1;

  -- ── 6. Google: purchase token grezzo al posto del digest. Deve essere
  -- respinto dal CHECK di forma e non lasciare nulla dietro di se'.
  v := public.claim_store_purchase(
    p_billing_source => 'google_play',
    p_ownership_key => 'abcdefghijklmnopqrstuvwxyz.AO-J1Ox_TOKEN_GREZZO_NON_HASHATO',
    p_owner_user_id => d,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'google_backend_fetch'
  );
  if v->>'outcome' <> 'persistence_failed' then
    raise exception 'TEST 6: un token grezzo deve essere respinto, ottenuto %', v;
  end if;
  if v->>'sqlstate' <> '23514' then
    raise exception 'TEST 6: atteso violazione di CHECK (23514), ottenuto %', v;
  end if;
  v_passed := v_passed + 1;

  -- ── 7. Unicita' dell'id transazione fra chiavi diverse dello stesso store
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => '2000000777777777',
    p_owner_user_id => b,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => k_a
  );
  if v->>'outcome' <> 'persistence_failed'
     or v->>'reason' <> 'projection_or_registry_unique_violation' then
    raise exception 'TEST 7: atteso persistence_failed/unique_violation, ottenuto %', v;
  end if;
  select count(*) into v_rows from private.billing_purchase_claims
   where ownership_key = '2000000777777777';
  if v_rows <> 0 then raise exception 'TEST 7: riga residua dopo il conflitto'; end if;
  v_passed := v_passed + 1;

  -- ── 8. La RPC rifiuta i non-acquisti (trial, founder, grandfather)
  begin
    perform public.claim_store_purchase(
    p_billing_source => 'trial',
    p_ownership_key => 'x',
    p_owner_user_id => a,
    p_external_product_id => 'p',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => case when 'trial' = 'apple_iap' then 'apple_signed_date' else 'google_backend_fetch' end
  );
    raise exception 'TEST 8: billing_source trial doveva essere rifiutato';
  exception
    when sqlstate '22023' then null;
  end;
  v_passed := v_passed + 1;

  -- ── 9. La RPC rifiuta un appAccountToken che contraddice il proprietario
  begin
    perform public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => '2000000888888888',
    p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_app_account_token => b
  );
    raise exception 'TEST 9: appAccountToken discordante doveva essere rifiutato';
  exception
    when sqlstate '22023' then null;
  end;
  v_passed := v_passed + 1;

  -- ── 10. Immutabilita': riassegnazione del proprietario
  begin
    update private.billing_purchase_claims set owner_user_id = b
     where billing_source = 'apple_iap' and ownership_key = k_a;
    raise exception 'TEST 10: la riassegnazione del proprietario doveva essere rifiutata';
  exception
    when sqlstate '42501' then null;
  end;
  v_passed := v_passed + 1;

  -- ── 11. Immutabilita': campi di identita'
  begin
    update private.billing_purchase_claims set ownership_key = 'altro'
     where billing_source = 'apple_iap' and ownership_key = k_a;
    raise exception 'TEST 11: la modifica di ownership_key doveva essere rifiutata';
  exception
    when sqlstate '42501' then null;
  end;
  v_passed := v_passed + 1;

  -- ── 12. Immutabilita': DELETE
  begin
    delete from private.billing_purchase_claims
     where billing_source = 'apple_iap' and ownership_key = k_a;
    raise exception 'TEST 12: la DELETE doveva essere rifiutata';
  exception
    when sqlstate '42501' then null;
  end;
  v_passed := v_passed + 1;

  -- ── 13. Immutabilita': TRUNCATE, con DUE difese indipendenti
  --
  -- 13a. Da solo il registro non e' nemmeno troncabile: private.
  --      billing_purchase_states lo referenzia (sqlstate 0A000, "cannot
  --      truncate a table referenced in a foreign key constraint"). E' una
  --      difesa che arriva prima del trigger, e vale la pena saperlo: se un
  --      domani quella chiave esterna sparisse, resterebbe solo il trigger.
  begin
    truncate private.billing_purchase_claims;
    raise exception 'TEST 13a: la TRUNCATE del solo registro doveva essere rifiutata';
  exception
    when sqlstate '0A000' then null;
    when sqlstate '42501' then null;
  end;

  -- 13b. E troncando ENTRAMBE, cioe' aggirando la chiave esterna, deve
  --      intervenire il trigger. Senza questo secondo caso il test misurerebbe
  --      soltanto la FK e dichiarerebbe verde un trigger mai esercitato.
  begin
    truncate private.billing_purchase_states, private.billing_purchase_claims;
    raise exception 'TEST 13b: la TRUNCATE di entrambe doveva essere rifiutata dal trigger';
  exception
    when sqlstate '42501' then null;
  end;
  v_passed := v_passed + 1;

  -- ── 14. Tombstone: cancellare l'account non libera la transazione
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => k_d,
    p_owner_user_id => d,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => k_d,
    p_app_account_token => d
  );
  if v->>'outcome' <> 'claimed' then raise exception 'TEST 14: setup fallito, %', v; end if;

  delete from auth.users where id = d;

  select owner_user_id, anonymized_at
    into v_uuid, v_ts
    from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = k_d;
  select (app_account_token is null) into v_bool
    from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = k_d;

  if v_uuid is not null then
    raise exception 'TEST 14: owner_user_id non azzerato dopo la cancellazione account';
  end if;
  if v_ts is null then
    raise exception 'TEST 14: anonymized_at non valorizzato: tombstone indistinguibile da riga malformata';
  end if;
  if not v_bool then
    raise exception 'TEST 14: app_account_token non azzerato: resta un legame con la persona';
  end if;

  select count(*) into v_rows from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = k_d;
  if v_rows <> 1 then
    raise exception 'TEST 14: la riga di claim e'' sparita con l''account: la transazione e'' tornata reclamabile';
  end if;
  v_passed := v_passed + 1;

  -- ── 15. La tombstone non e' reclamabile da nessun altro
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => k_d,
    p_owner_user_id => b,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date'
  );
  if v->>'outcome' <> 'owned_by_other_user' then
    raise exception 'TEST 15: una tombstone deve restare occupata, ottenuto %', v;
  end if;
  if not (v->>'ownerDeleted')::boolean then
    raise exception 'TEST 15: ownerDeleted doveva essere true';
  end if;
  v_passed := v_passed + 1;

  -- ── 16. La tombstone non si resuscita a mano
  begin
    update private.billing_purchase_claims set owner_user_id = b
     where billing_source = 'apple_iap' and ownership_key = k_d;
    raise exception 'TEST 16: la resurrezione di una tombstone doveva essere rifiutata';
  exception
    when sqlstate '42501' then null;
  end;
  v_passed := v_passed + 1;

  raise notice 'DO block: % casi superati', v_passed;
end $$;

-- ── 17-20. ACL, verificate contro il catalogo e non a parole ────────────
do $$
declare
  v_sig constant text :=
    'public.claim_store_purchase(text,text,uuid,text,text,text,text,timestamptz,boolean,timestamptz,text,text,uuid)';
  v_public_execute boolean;
begin
  if has_function_privilege('anon', v_sig, 'execute') then
    raise exception 'TEST 17: anon puo'' eseguire la RPC';
  end if;
  if has_function_privilege('authenticated', v_sig, 'execute') then
    raise exception 'TEST 17: authenticated puo'' eseguire la RPC';
  end if;
  if not has_function_privilege('service_role', v_sig, 'execute') then
    raise exception 'TEST 17: service_role NON puo'' eseguire la RPC';
  end if;

  -- PUBLIC non e' un ruolo interrogabile con has_function_privilege: si
  -- guarda direttamente la ACL, dove il grantee 0 e' PUBLIC.
  select exists (
    select 1
    from pg_proc p, aclexplode(p.proacl) acl
    where p.oid = v_sig::regprocedure
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) into v_public_execute;
  if v_public_execute then
    raise exception 'TEST 18: EXECUTE ancora concesso a PUBLIC';
  end if;

  if has_schema_privilege('anon', 'private', 'usage')
     or has_schema_privilege('authenticated', 'private', 'usage') then
    raise exception 'TEST 19: anon/authenticated hanno USAGE sullo schema private';
  end if;

  if has_table_privilege('anon', 'private.billing_purchase_claims', 'select')
     or has_table_privilege('authenticated', 'private.billing_purchase_claims', 'select')
     or has_table_privilege('service_role', 'private.billing_purchase_claims', 'select')
     or has_table_privilege('service_role', 'private.billing_purchase_claims', 'insert')
     or has_table_privilege('service_role', 'private.billing_purchase_claims', 'update')
     or has_table_privilege('service_role', 'private.billing_purchase_claims', 'delete') then
    raise exception 'TEST 20: il registro e'' scrivibile o leggibile senza passare dalla RPC';
  end if;

  raise notice 'ACL: 4 casi superati';
end $$;

-- ── 21. La migration non ha toccato la proiezione ne' introdotto righe ──
do $$
declare
  v_search_path text;
begin
  select coalesce(p.proconfig::text, '') into v_search_path
  from pg_proc p
  where p.oid = 'public.claim_store_purchase(text,text,uuid,text,text,text,text,timestamptz,boolean,timestamptz,text,text,uuid)'::regprocedure;
  if v_search_path not like '%search_path%' then
    raise exception 'TEST 21: la RPC SECURITY DEFINER non ha un search_path fisso';
  end if;
  raise notice 'search_path fisso: 1 caso superato';
end $$;

-- ── 22. Il percorso reale: la RPC chiamata DAL service_role.
-- Tutti i casi sopra girano come postgres, che scriverebbe comunque. Questo
-- e' l'unico che dimostra la tesi della sezione ACL: il backend non ha alcun
-- privilegio diretto sul registro (verificato al caso 20) e ci scrive lo
-- stesso, perche' la RPC e' SECURITY DEFINER. Se un giorno qualcuno togliesse
-- SECURITY DEFINER "tanto siamo service_role", questo caso lo direbbe subito.
set local role service_role;
create temporary table t22_outcome on commit drop as
select public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => '2000000222222222',
    p_owner_user_id => '00000000-0000-4000-8000-00000000000a',
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'sandbox',
    p_state => 'active',
    p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => '2000000222222222'
  ) as v;
reset role;

do $$
declare
  v jsonb;
  v_rows int;
begin
  select t.v into v from t22_outcome t;
  if v->>'outcome' <> 'claimed' then
    raise exception 'TEST 22: service_role non e'' riuscito a reclamare via RPC: %', v;
  end if;
  select count(*) into v_rows from private.billing_purchase_claims
   where ownership_key = '2000000222222222'
     and owner_user_id = '00000000-0000-4000-8000-00000000000a'
     and environment = 'sandbox';
  if v_rows <> 1 then
    raise exception 'TEST 22: il claim del service_role non e'' finito nel registro';
  end if;
  raise notice 'service_role via SECURITY DEFINER: 1 caso superato';
end $$;

rollback;

\echo ''
\echo '=========================================='
\echo 'billing_claims_p0: TUTTE LE VERIFICHE OK'
\echo '=========================================='
