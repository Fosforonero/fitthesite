-- ============================================================================
-- B' — MATRICE DELLA PRECEDENZA
--
-- Gli stessi scenari che 48-red-baseline-last-write-wins.sql dimostra rossi
-- contro la funzione del commit 262ade1, piu' quelli che quella funzione non
-- sapeva nemmeno esprimere (revoca, freschezza dell'evidenza, rollback
-- atomico).
--
-- Dove possibile l'asserzione non guarda la riga di proiezione ma chiama
-- public.get_entitlement_status() impersonando l'utente, cioe' esattamente la
-- funzione che risponde all'app. Guardare la tabella proverebbe che abbiamo
-- scritto quello che volevamo scrivere; chiamare il contratto prova che
-- l'utente vede quello che gli spetta, che e' una domanda diversa.
--
-- La transazione si chiude con ROLLBACK: al termine il database e' come prima.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

-- ── Attrezzatura ────────────────────────────────────────────────────────────

create or replace function pg_temp.mk_user(p_label text, p_eta interval default interval '400 days')
returns uuid language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  -- created_at governa il trial interno (14 giorni). Il default e' volutamente
  -- vecchio: quasi tutti gli scenari vogliono misurare gli acquisti, non il
  -- trial, e un trial ancora aperto nasconderebbe la differenza fra "nessun
  -- diritto" e "diritto di prova".
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', p_label || '-' || v::text || '@example.invalid', 'x',
          now(), now() - p_eta, now());
  return v;
end $$;

-- Chiave Google ben formata (64 esadecimali) e unica per etichetta.
create or replace function pg_temp.gkey(p_label text) returns text
language sql immutable as $$
  select encode(sha256(convert_to(p_label, 'UTF8')), 'hex');
$$;

create or replace function pg_temp.claim(
  p_user uuid, p_src text, p_key text, p_sku text, p_kind text,
  p_state text, p_until timestamptz, p_auto boolean default false,
  p_event_at timestamptz default null)
returns jsonb language plpgsql as $$
begin
  return public.claim_store_purchase(
    p_billing_source      => p_src,
    p_ownership_key       => p_key,
    p_owner_user_id       => p_user,
    p_external_product_id => p_sku,
    p_purchase_kind       => p_kind,
    p_environment         => 'production',
    p_state               => p_state,
    p_active_until        => p_until,
    p_auto_renewing       => p_auto,
    p_store_event_at      => coalesce(p_event_at, now()),
    p_store_event_source  => case when p_src = 'apple_iap'
                                  then 'apple_signed_date'
                                  else 'google_backend_fetch' end);
end $$;

-- L'entitlement come lo vede l'app: si assume l'identita' dell'utente e si
-- chiama il contratto vero.
create or replace function pg_temp.kind_of(p_user uuid) returns text
language plpgsql as $$
declare v text;
begin
  perform set_config('request.jwt.claims',
                     json_build_object('sub', p_user::text)::text, true);
  select public.get_entitlement_status() ->> 'entitlementKind' into v;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $$;

create or replace function pg_temp.proj(p_user uuid) returns text
language sql as $$
  select coalesce(
    (select t.external_product_id || '/' || t.state ||
            case when public.is_b2c_lifetime(t) then '/lifetime' else '/timed' end
     from public.b2c_subscriptions t where t.user_id = p_user),
    '<nessuna riga>');
$$;

-- ── La matrice ──────────────────────────────────────────────────────────────

do $$
declare
  v_ok int := 0;
  v_ko int := 0;
  v_a uuid; v_b uuid;
  v_r jsonb;
  v_p1 text; v_p2 text; v_t text;
  v_life constant timestamptz := '9999-12-31T23:59:59Z';
  v_n int;

begin

  -- 1 ─ lifetime <-> subscription, nei due ordini ---------------------------
  v_a := pg_temp.mk_user('g1a');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g1a-life'), 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life);
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g1a-sub'),  'fitmesh_pro_sub', 'subscription', 'active', now() + interval '30 days', true);
  v_p1 := pg_temp.proj(v_a);

  v_b := pg_temp.mk_user('g1b');
  perform pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g1b-sub'),  'fitmesh_pro_sub', 'subscription', 'active', now() + interval '30 days', true);
  perform pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g1b-life'), 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life);
  v_p2 := pg_temp.proj(v_b);

  if v_p1 = v_p2 and v_p1 like '%lifetime'
     and pg_temp.kind_of(v_a) = 'lifetime' and pg_temp.kind_of(v_b) = 'lifetime' then
    v_ok := v_ok + 1; raise notice '   1. lifetime <-> subscription, due ordini      OK   (%)', v_p1;
  else
    v_ko := v_ko + 1; raise notice '   1. lifetime <-> subscription, due ordini      KO   A=% B=%', v_p1, v_p2;
  end if;

  -- 2 ─ due subscription, entrambe le permutazioni ---------------------------
  v_a := pg_temp.mk_user('g2a');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g2a-lunga'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '200 days', true);
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g2a-corta'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '10 days', true);
  select t.active_until::date::text into v_p1 from public.b2c_subscriptions t where t.user_id = v_a;

  v_b := pg_temp.mk_user('g2b');
  perform pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g2b-corta'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '10 days', true);
  perform pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g2b-lunga'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '200 days', true);
  select t.active_until::date::text into v_p2 from public.b2c_subscriptions t where t.user_id = v_b;

  if v_p1 = v_p2 and v_p1 = (now() + interval '200 days')::date::text then
    v_ok := v_ok + 1; raise notice '   2. due subscription, vince la scadenza maggiore OK  (%)', v_p1;
  else
    v_ko := v_ko + 1; raise notice '   2. due subscription, permutazioni             KO   A=% B=%', v_p1, v_p2;
  end if;

  -- 3 ─ rinnovo della stessa chiave -----------------------------------------
  v_a := pg_temp.mk_user('g3');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g3'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '10 days', true, now() - interval '2 days');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g3'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '190 days', true, now());
  select count(*) into v_n from private.billing_purchase_claims where owner_user_id = v_a;
  select t.active_until into v_t from public.b2c_subscriptions t where t.user_id = v_a;
  if v_n = 1 and v_t::timestamptz > now() + interval '180 days' then
    v_ok := v_ok + 1; raise notice '   3. rinnovo stessa chiave: una proprieta'', scadenza avanzata OK';
  else
    v_ko := v_ko + 1; raise notice '   3. rinnovo stessa chiave                      KO   claim=% scade=%', v_n, v_t;
  end if;

  -- 4 ─ lifetime REVOCATO con subscription ancora valida ---------------------
  v_a := pg_temp.mk_user('g4');
  perform pg_temp.claim(v_a, 'apple_iap', '2000000000000004', 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life, false, now() - interval '10 days');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g4-sub'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '60 days', true, now() - interval '5 days');
  if pg_temp.kind_of(v_a) <> 'lifetime' then
    v_ko := v_ko + 1; raise notice '   4. premessa fallita: il lifetime non comandava';
  end if;
  v_r := public.record_store_purchase_revocation(
           'apple_iap', '2000000000000004', 'fitmesh_pro_lifetime', 'lifetime',
           now(), 'apple_signed_date');
  v_t := pg_temp.kind_of(v_a);
  if v_r->>'outcome' = 'revoked' and (v_r->>'applied')::boolean and v_t = 'subscription' then
    v_ok := v_ok + 1; raise notice '   4. lifetime revocato -> riemerge la subscription OK';
  else
    v_ko := v_ko + 1; raise notice '   4. lifetime revocato                          KO   esito=% kind=%', v_r->>'outcome', v_t;
  end if;

  -- 5 ─ subscription scaduta con lifetime valido -----------------------------
  v_a := pg_temp.mk_user('g5');
  perform pg_temp.claim(v_a, 'apple_iap', '2000000000000005', 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life);
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g5-sub'), 'fitmesh_pro_sub', 'subscription', 'expired', now() - interval '30 days');
  if pg_temp.kind_of(v_a) = 'lifetime' then
    v_ok := v_ok + 1; raise notice '   5. sub scaduta + lifetime valido              OK';
  else
    v_ko := v_ko + 1; raise notice '   5. sub scaduta + lifetime valido              KO   (%)', pg_temp.proj(v_a);
  end if;

  -- 6 ─ evento 'active' VECCHIO dopo una revoca NUOVA ------------------------
  v_a := pg_temp.mk_user('g6');
  perform pg_temp.claim(v_a, 'apple_iap', '2000000000000006', 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life, false, now() - interval '10 days');
  perform public.record_store_purchase_revocation(
            'apple_iap', '2000000000000006', 'fitmesh_pro_lifetime', 'lifetime',
            now() - interval '1 day', 'apple_signed_date');
  -- Il client ripresenta una fotografia di 5 giorni fa: piu' recente del primo
  -- claim, ma piu' VECCHIA della revoca.
  v_r := pg_temp.claim(v_a, 'apple_iap', '2000000000000006', 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life, false, now() - interval '5 days');
  select s.state into v_t from private.billing_purchase_states s
   where s.billing_source = 'apple_iap' and s.ownership_key = '2000000000000006';
  if v_t = 'revoked' and (v_r->>'stateApplied')::boolean = false
     and pg_temp.kind_of(v_a) <> 'lifetime' then
    v_ok := v_ok + 1; raise notice '   6. active vecchio non resuscita una revoca     OK';
  else
    v_ko := v_ko + 1; raise notice '   6. active vecchio dopo revoca                 KO   stato=% applied=% kind=%',
      v_t, v_r->>'stateApplied', pg_temp.kind_of(v_a);
  end if;

  -- 7 ─ restore in qualunque ordine -> stessa proiezione ---------------------
  v_a := pg_temp.mk_user('g7a');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g7-x'), 'fitmesh_pro_sub', 'subscription', 'expired', now() - interval '90 days');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g7-y'), 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life);
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g7-z'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '5 days', true);
  v_p1 := pg_temp.proj(v_a);

  v_b := pg_temp.mk_user('g7b');
  perform pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g7-z2'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '5 days', true);
  perform pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g7-y2'), 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life);
  perform pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g7-x2'), 'fitmesh_pro_sub', 'subscription', 'expired', now() - interval '90 days');
  v_p2 := pg_temp.proj(v_b);

  if v_p1 = v_p2 and v_p1 like '%lifetime' then
    v_ok := v_ok + 1; raise notice '   7. restore: l''ordine non conta piu''            OK   (%)', v_p1;
  else
    v_ko := v_ko + 1; raise notice '   7. restore, ordine indifferente               KO   A=% B=%', v_p1, v_p2;
  end if;

  -- 8 ─ Apple lifetime + Google subscription ---------------------------------
  v_a := pg_temp.mk_user('g8');
  perform pg_temp.claim(v_a, 'apple_iap', '2000000000000008', 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life);
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g8-sub'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '20 days', true);
  select t.billing_source into v_t from public.b2c_subscriptions t where t.user_id = v_a;
  if pg_temp.kind_of(v_a) = 'lifetime' and v_t = 'apple_iap' then
    v_ok := v_ok + 1; raise notice '   8. Apple lifetime + Google subscription       OK';
  else
    v_ko := v_ko + 1; raise notice '   8. Apple lifetime + Google subscription       KO   (% / %)', v_t, pg_temp.kind_of(v_a);
  end if;

  -- 9 ─ founder + acquisto commerciale ---------------------------------------
  v_a := pg_temp.mk_user('g9');
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state)
  values (v_a, 'founder_grant', 'founder', 'founder-' || v_a::text,
          v_life, false, 'active');
  v_r := pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g9-sub'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '20 days', true);
  select t.billing_source into v_t from public.b2c_subscriptions t where t.user_id = v_a;
  select count(*) into v_n from private.billing_purchase_claims where owner_user_id = v_a;
  if v_t = 'founder_grant' and v_n = 1
     and (v_r->'entitlement'->>'protectedFounderRow')::boolean then
    v_ok := v_ok + 1; raise notice '   9. founder intatto, proprieta'' registrata lo stesso OK';
  else
    v_ko := v_ko + 1; raise notice '   9. founder + acquisto commerciale             KO   riga=% claim=%', v_t, v_n;
  end if;

  -- 10 ─ trial + acquisto valido / acquisto fallito --------------------------
  -- Utente nuovo: trial interno ancora aperto.
  v_a := pg_temp.mk_user('g10a', interval '1 day');
  if pg_temp.kind_of(v_a) <> 'trial' then
    v_ko := v_ko + 1; raise notice '  10. premessa fallita: il trial non risultava attivo';
  end if;
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g10a'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '180 days', true);
  v_p1 := pg_temp.kind_of(v_a);

  v_b := pg_temp.mk_user('g10b', interval '1 day');
  perform pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g10b'), 'fitmesh_pro_sub', 'subscription', 'expired', now() - interval '1 day');
  v_p2 := pg_temp.kind_of(v_b);

  if v_p1 = 'subscription' and v_p2 = 'trial' then
    v_ok := v_ok + 1; raise notice '  10. trial: l''acquisto valido vince, quello fallito non toglie il trial OK';
  else
    v_ko := v_ko + 1; raise notice '  10. trial + acquisto                          KO   valido=% fallito=%', v_p1, v_p2;
  end if;

  -- 12 ─ stessa chiave reclamata da due utenti -------------------------------
  v_a := pg_temp.mk_user('g12a');
  v_b := pg_temp.mk_user('g12b');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g12'), 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life);
  v_r := pg_temp.claim(v_b, 'google_play', pg_temp.gkey('g12'), 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life);
  select count(*) into v_n from public.b2c_subscriptions where user_id = v_b;
  if v_r->>'outcome' = 'owned_by_other_user' and v_n = 0
     and pg_temp.kind_of(v_a) = 'lifetime' and pg_temp.kind_of(v_b) = 'none' then
    v_ok := v_ok + 1; raise notice '  12. stessa chiave, due utenti: il secondo non ottiene niente OK';
  else
    v_ko := v_ko + 1; raise notice '  12. stessa chiave, due utenti                 KO   esito=% righe_b=%', v_r->>'outcome', v_n;
  end if;

  -- 13 ─ errore di persistenza -> rollback atomico ---------------------------
  -- Si costruisce una collisione REALE sul vincolo
  -- unique (billing_source, external_subscription_id) della proiezione: una
  -- riga legacy di un ALTRO utente occupa gia' il valore che la proiezione
  -- vorrebbe scrivere. E' il caso vero di una riga scritta prima che il
  -- registro esistesse.
  v_a := pg_temp.mk_user('g13a');
  v_b := pg_temp.mk_user('g13b');
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state)
  values (v_b, 'google_play', 'fitmesh_pro_sub', pg_temp.gkey('g13'),
          now() + interval '10 days', true, 'active');

  v_r := pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g13'), 'fitmesh_pro_sub', 'subscription', 'active', now() + interval '30 days', true);
  select count(*) into v_n from private.billing_purchase_claims where ownership_key = pg_temp.gkey('g13');
  if v_r->>'outcome' = 'persistence_failed'
     and v_n = 0
     and not exists (select 1 from private.billing_purchase_states where ownership_key = pg_temp.gkey('g13'))
     and not exists (select 1 from public.b2c_subscriptions where user_id = v_a) then
    v_ok := v_ok + 1; raise notice '  13. persistenza fallita: claim e stato annullati insieme OK';
  else
    v_ko := v_ko + 1; raise notice '  13. rollback atomico                          KO   esito=% claim=%', v_r->>'outcome', v_n;
  end if;

  -- 14 ─ tutti gli acquisti inattivi -> nessun Pro ---------------------------
  v_a := pg_temp.mk_user('g14');
  perform pg_temp.claim(v_a, 'google_play', pg_temp.gkey('g14-sub'), 'fitmesh_pro_sub', 'subscription', 'expired', now() - interval '5 days');
  perform pg_temp.claim(v_a, 'apple_iap', '2000000000000014', 'fitmesh_pro_lifetime', 'lifetime', 'active', v_life, false, now() - interval '3 days');
  perform public.record_store_purchase_revocation(
            'apple_iap', '2000000000000014', 'fitmesh_pro_lifetime', 'lifetime',
            now(), 'apple_signed_date');
  v_t := pg_temp.kind_of(v_a);
  if v_t = 'none' then
    v_ok := v_ok + 1; raise notice '  14. tutti gli acquisti inattivi -> nessun Pro  OK';
  else
    v_ko := v_ko + 1; raise notice '  14. tutti inattivi                            KO   kind=% proj=%', v_t, pg_temp.proj(v_a);
  end if;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'matrice della precedenza: % casi falliti', v_ko;
  end if;
end $$;

-- ── Nessun segreto e nessun payload grezzo nella tabella degli stati ────────
do $$
declare v_cols text;
begin
  select string_agg(column_name, ', ' order by ordinal_position) into v_cols
  from information_schema.columns
  where table_schema = 'private' and table_name = 'billing_purchase_states';

  if v_cols <> 'billing_source, ownership_key, external_product_id, purchase_kind, '
             || 'state, active_until, auto_renewing, store_event_at, '
             || 'store_event_source, verified_at' then
    raise exception 'le colonne di billing_purchase_states sono cambiate: %. Ogni colonna nuova va giustificata: questa tabella non deve poter trasportare un token.', v_cols;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'private' and table_name = 'billing_purchase_states'
      and (data_type in ('json', 'jsonb') or column_name ~* 'token|receipt|jws|payload|secret')
  ) then
    raise exception 'billing_purchase_states ha una colonna capace di trasportare un segreto';
  end if;

  raise notice '   forma della tabella: 10 colonne, nessun json, nessun campo capace di portare un token';
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / precedenza B'': TUTTO VERDE'
\echo '=================================================='
