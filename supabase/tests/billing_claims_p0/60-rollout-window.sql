-- ============================================================================
-- LA FINESTRA DI ROLLOUT, ESERCITATA
--
-- La domanda a cui questo file risponde non e' "la guardia funziona?" ma
-- "esiste un istante, fra l'applicazione della migration e il deploy della
-- route nuova, in cui una transazione commerciale finisce fuori dal registro?".
--
-- Si simula quell'istante esatto: la migration e' applicata, il backend in
-- produzione e' ancora QUELLO VECCHIO, e fa cio' che faceva — un upsert
-- diretto su public.b2c_subscriptions con onConflict user_id. Nessuna
-- chiamata alla RPC, perche' la route che la chiama non e' ancora deployata.
--
-- Tutto in una transazione chiusa da ROLLBACK.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.mk_user(p_label text) returns uuid
language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', p_label || '-' || v::text || '@example.invalid', 'x',
          now(), now() - interval '400 days', now());
  return v;
end $$;

/**
 * L'upsert del backend VECCHIO, riprodotto nella forma esatta di route.ts
 * prima di a379e71: insert ... on conflict (user_id) do update, tutti i campi.
 */
create or replace function pg_temp.upsert_189(
  p_user uuid, p_src text, p_sku text, p_ext text,
  p_until timestamptz, p_state text)
returns void language plpgsql as $$
begin
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    external_order_id, active_until, auto_renewing, state,
    raw_payload, last_notification_at
  ) values (
    p_user, p_src, p_sku, p_ext, null, p_until, false, p_state,
    jsonb_build_object('source', 'sk2_jws'), now()
  )
  on conflict (user_id) do update set
    billing_source = excluded.billing_source,
    external_product_id = excluded.external_product_id,
    external_subscription_id = excluded.external_subscription_id,
    active_until = excluded.active_until,
    state = excluded.state,
    raw_payload = excluded.raw_payload,
    last_notification_at = excluded.last_notification_at;
end $$;

do $$
declare
  v_ok int := 0;
  v_ko int := 0;
  v_a uuid; v_b uuid; v_c uuid;
  v_mode text;
  v_key text;
  v_n int;
  v_life constant timestamptz := '9999-12-31T23:59:59Z';
  v_msg text;
begin
  -- ── 0. Si parte permissivi. Se non fosse cosi', il deploy della migration
  --       da solo romperebbe il backend in produzione.
  select mode into v_mode from private.billing_projection_guard_mode where singleton;
  if v_mode <> 'compatibility' then
    v_ko := v_ko + 1;
    raise notice '   0. modo iniziale                              KO   e'' "%" invece di compatibility', v_mode;
  else
    v_ok := v_ok + 1;
    raise notice '   0. la migration nasce in compatibility          OK';
  end if;

  -- ── 1. L'ISTANTE: migration applicata, backend ancora vecchio.
  --       La scrittura deve RIUSCIRE (altrimenti la 189 chiude transazioni
  --       pagate) e deve comunque lasciare una proprieta' nel registro.
  v_a := pg_temp.mk_user('roll-apple');
  perform pg_temp.upsert_189(v_a, 'apple_iap', 'fitmesh_pro_lifetime',
                             '2000000000000101', v_life, 'active');

  select count(*) into v_n from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = '2000000000000101'
     and owner_user_id = v_a;
  if v_n = 1 and exists (select 1 from public.b2c_subscriptions where user_id = v_a) then
    v_ok := v_ok + 1;
    raise notice '   1. upsert del backend vecchio (Apple)           OK   scrittura completata, proprieta'' iscritta';
  else
    v_ko := v_ko + 1;
    raise notice '   1. upsert del backend vecchio (Apple)           KO   claim=%', v_n;
  end if;

  -- Google: il backend vecchio scrive il purchase TOKEN in chiaro. La chiave
  -- deve essere il suo digest, cioe' la stessa che ricava il backfill e la
  -- stessa che scrivera' la route nuova.
  v_b := pg_temp.mk_user('roll-google');
  perform pg_temp.upsert_189(v_b, 'google_play', 'fitmesh_pro_sub',
                             'token-play-in-chiaro-abc', now() + interval '30 days', 'active');
  v_key := encode(sha256(convert_to('token-play-in-chiaro-abc', 'UTF8')), 'hex');
  select count(*) into v_n from private.billing_purchase_claims
   where billing_source = 'google_play' and ownership_key = v_key and owner_user_id = v_b;
  if v_n = 1 then
    v_ok := v_ok + 1;
    raise notice '   2. upsert del backend vecchio (Google)          OK   chiave = digest del token, non il token';
  else
    v_ko := v_ko + 1;
    raise notice '   2. upsert del backend vecchio (Google)          KO   claim=%', v_n;
  end if;

  -- E il token in chiaro non deve essere finito nel registro.
  if exists (select 1 from private.billing_purchase_claims
              where ownership_key like '%token-play-in-chiaro%') then
    v_ko := v_ok; -- forza il fallimento
    raise exception 'il purchase token in chiaro e'' entrato nel registro';
  end if;

  -- ── 3. Il difetto HIGH, durante la finestra: un ALTRO utente presenta la
  --       stessa transazione al backend vecchio. Deve essere respinto anche
  --       adesso, cioe' prima che la route nuova esista.
  v_c := pg_temp.mk_user('roll-ladro');
  begin
    perform pg_temp.upsert_189(v_c, 'apple_iap', 'fitmesh_pro_lifetime',
                               '2000000000000101', v_life, 'active');
    v_ko := v_ko + 1;
    raise notice '   3. transazione altrui durante la finestra       KO   accettata';
  exception
    when insufficient_privilege then
      v_ok := v_ok + 1;
      raise notice '   3. transazione altrui durante la finestra       OK   respinta gia'' in compatibility';
  end;

  -- ── 4. Passare a strict con righe scoperte deve essere RIFIUTATO.
  --       Si costruisce la situazione reale: una riga commerciale scritta
  --       PRIMA che il registro esistesse (le quattro google_play in
  --       produzione). Si entra dalla porta del registro per non far
  --       intervenire il trigger, che altrimenti la coprirebbe.
  declare
    v_d uuid := pg_temp.mk_user('roll-legacy');
  begin
    perform set_config('billing.projection', 'on', true);
    insert into public.b2c_subscriptions (
      user_id, billing_source, external_product_id, external_subscription_id,
      active_until, auto_renewing, state)
    values (v_d, 'google_play', 'fitmesh_pro_sub', 'token-legacy-mai-registrato',
            now() + interval '10 days', true, 'active');
    perform set_config('billing.projection', 'off', true);

    begin
      perform private.set_billing_projection_guard_mode('strict', 'tentativo con righe scoperte');
      v_ko := v_ko + 1;
      raise notice '   4. strict con righe scoperte                   KO   accettato';
    exception
      when insufficient_privilege then
        get stacked diagnostics v_msg = message_text;
        v_ok := v_ok + 1;
        raise notice '   4. strict con righe scoperte                   OK   rifiutato';
    end;

    -- ── 5. Coperta la riga (e' cio' che fa il backfill), strict passa.
    insert into private.billing_purchase_claims (
      billing_source, ownership_key, external_product_id, owner_user_id,
      environment, claimed_at
    ) values (
      'google_play',
      encode(sha256(convert_to('token-legacy-mai-registrato', 'UTF8')), 'hex'),
      'fitmesh_pro_sub', v_d, 'production', now()
    );
  end;

  perform private.set_billing_projection_guard_mode('strict', 'test');
  select mode into v_mode from private.billing_projection_guard_mode where singleton;
  if v_mode = 'strict' then
    v_ok := v_ok + 1;
    raise notice '   5. strict dopo il backfill                      OK';
  else
    v_ko := v_ko + 1;
    raise notice '   5. strict dopo il backfill                      KO   modo=%', v_mode;
  end if;

  -- ── 6. In strict il backend vecchio non scrive piu'. E' il momento in cui
  --       la porta si chiude, e va dopo il deploy: prima sarebbe il disastro.
  begin
    perform pg_temp.upsert_189(pg_temp.mk_user('roll-tardivo'), 'apple_iap',
                               'fitmesh_pro_lifetime', '2000000000000199', v_life, 'active');
    v_ko := v_ko + 1;
    raise notice '   6. upsert diretto in strict                     KO   accettato';
  exception
    when insufficient_privilege then
      v_ok := v_ok + 1;
      raise notice '   6. upsert diretto in strict                     OK   respinto';
  end;

  -- ── 7. E la RPC continua a funzionare, in strict.
  declare
    v_e uuid := pg_temp.mk_user('roll-nuovo');
    v_res jsonb;
  begin
    v_res := public.claim_store_purchase(
      p_billing_source => 'apple_iap', p_ownership_key => '2000000000000200',
      p_owner_user_id => v_e, p_external_product_id => 'fitmesh_pro_lifetime',
      p_purchase_kind => 'lifetime', p_environment => 'production',
      p_state => 'active', p_active_until => v_life, p_auto_renewing => false,
      p_store_event_at => now(), p_store_event_source => 'apple_signed_date');
    if v_res->>'outcome' = 'claimed'
       and (v_res->'entitlement'->>'state') = 'active' then
      v_ok := v_ok + 1;
      raise notice '   7. la RPC scrive anche in strict                OK';
    else
      v_ko := v_ko + 1;
      raise notice '   7. la RPC in strict                             KO   %', v_res;
    end if;
  end;

  -- ── 8. E il parametro non resta acceso dopo la proiezione: se restasse,
  --       qualunque scrittura successiva nella stessa transazione passerebbe.
  if coalesce(current_setting('billing.projection', true), 'off') = 'on' then
    v_ko := v_ko + 1;
    raise notice '   8. il permesso resta acceso dopo la proiezione  KO';
  else
    v_ok := v_ok + 1;
    raise notice '   8. il permesso si spegne subito dopo            OK';
  end if;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'finestra di rollout: % casi falliti', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / finestra di rollout: COPERTA'
\echo '=================================================='
