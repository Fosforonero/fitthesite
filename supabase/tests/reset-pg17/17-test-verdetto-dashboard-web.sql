-- ============================================================================
-- 17 — Il verdetto unico della dashboard web (20260924120000)
--
-- COSA PROVA
-- ----------
-- 1. La matrice dei titoli decisa da Matteo il 24/09/2026: accesso con
--    qualunque titolo valido, nessun accesso con la sola prova, con niente,
--    con un abbonamento scaduto, con un acquisto revocato, con un pagamento in
--    attesa. Ogni caso dice il motivo, e i motivi sono distinti.
-- 2. Le trappole gia' pagate sul nucleo: «Lifetime + premio a tempo» (il
--    nucleo lo chiama timed_pro_role, qui devono comparire tutti e due i
--    titoli) e «revisione + Founder» (tutti e due). Un titolo non ne nasconde
--    un altro.
-- 3. Le differenze VOLUTE dal nucleo, misurate sul nucleo stesso: la prova
--    concede nell'app e non qui; un abbonamento 'active' con active_until
--    passato concede nell'app e non qui.
-- 4. L'identita': l'involucro pubblico risponde per l'account della sessione
--    e per nessun altro; `authenticated` non puo' chiamare la funzione privata
--    con un uuid; anon non raggiunge niente; senza `sub` nel JWT e' 42501.
-- 5. CONTROLLO POSITIVO: si toglie `active_until > now` e il caso
--    «abbonamento attivo ma scaduto» deve diventare concesso. Se restasse
--    negato anche cosi', il suo verde non dipenderebbe dalla condizione.
--
-- LIMITI DICHIARATI
-- -----------------
-- Database RICOSTRUITO dalle migration, non la produzione. In produzione oggi
-- non esistono righe 'grace', 'expired' o 'cancelled': quei casi sono solo
-- sintetici. Nessun valore personale: indirizzi *.invalid e uuid inventati.
-- ============================================================================
\set ON_ERROR_STOP on

do $$
declare
  v_passati int := 0;
  c record;
  v jsonb;
  v_titoli text[];
  v_core jsonb;
  v_vecchio constant timestamptz := now() - interval '90 days';
  v_nuovo   constant timestamptz := now() - interval '2 days';
begin
  begin
    create temp table wd_casi(
      n text primary key, id uuid not null, email text not null, creato timestamptz not null,
      concesso boolean not null, titoli text[] not null, motivo text);

    insert into wd_casi values
      ('revisione_e_founder', 'da5b0000-0000-4000-8000-000000000001', 'review@fitmesh.fit',        v_vecchio, true,  '{app_review,founder}', null),
      ('founder',             'da5b0000-0000-4000-8000-000000000002', 'wd-02@esempio.invalid',     v_vecchio, true,  '{founder}', null),
      ('grandfather',         'da5b0000-0000-4000-8000-000000000003', 'wd-03@esempio.invalid',     v_vecchio, true,  '{grandfather}', null),
      ('beta_a_vita',         'da5b0000-0000-4000-8000-000000000004', 'wd-04@esempio.invalid',     v_vecchio, true,  '{lifetime_grant}', null),
      ('premio_anello',       'da5b0000-0000-4000-8000-000000000005', 'wd-05@esempio.invalid',     v_vecchio, true,  '{timed_grant}', null),
      ('premio_scaduto',      'da5b0000-0000-4000-8000-000000000006', 'wd-06@esempio.invalid',     v_vecchio, false, '{}', 'no_entitlement'),
      ('lifetime_e_premio',   'da5b0000-0000-4000-8000-000000000007', 'wd-07@esempio.invalid',     v_vecchio, true,  '{lifetime_purchase,timed_grant}', null),
      ('abbonamento_valido',  'da5b0000-0000-4000-8000-000000000008', 'wd-08@esempio.invalid',     v_vecchio, true,  '{subscription}', null),
      ('abbonamento_scaduto', 'da5b0000-0000-4000-8000-000000000009', 'wd-09@esempio.invalid',     v_vecchio, false, '{}', 'subscription_inactive'),
      ('grazia',              'da5b0000-0000-4000-8000-000000000010', 'wd-10@esempio.invalid',     v_vecchio, true,  '{subscription}', null),
      ('disdetto',            'da5b0000-0000-4000-8000-000000000011', 'wd-11@esempio.invalid',     v_vecchio, false, '{}', 'subscription_inactive'),
      ('lifetime_revocato',   'da5b0000-0000-4000-8000-000000000012', 'wd-12@esempio.invalid',     v_vecchio, false, '{}', 'purchase_revoked'),
      ('in_attesa',           'da5b0000-0000-4000-8000-000000000013', 'wd-13@esempio.invalid',     v_vecchio, false, '{}', 'purchase_pending'),
      ('solo_prova',          'da5b0000-0000-4000-8000-000000000014', 'wd-14@esempio.invalid',     v_nuovo,   false, '{}', 'trial_only'),
      ('prova_e_founder',     'da5b0000-0000-4000-8000-000000000015', 'wd-15@esempio.invalid',     v_nuovo,   true,  '{founder}', null),
      ('niente',              'da5b0000-0000-4000-8000-000000000016', 'wd-16@esempio.invalid',     v_vecchio, false, '{}', 'no_entitlement'),
      ('admin',               'da5b0000-0000-4000-8000-000000000017', 'wd-17@esempio.invalid',     v_vecchio, true,  '{admin}', null),
      ('admin_scaduto',       'da5b0000-0000-4000-8000-000000000018', 'wd-18@esempio.invalid',     v_vecchio, false, '{}', 'no_entitlement'),
      ('pagamento_a_mano',    'da5b0000-0000-4000-8000-000000000019', 'wd-19@esempio.invalid',     v_vecchio, true,  '{manual_payment}', null),
      ('pagamento_revocato',  'da5b0000-0000-4000-8000-000000000020', 'wd-20@esempio.invalid',     v_vecchio, false, '{}', 'no_entitlement'),
      ('vecchia_prova_b2c',   'da5b0000-0000-4000-8000-000000000021', 'wd-21@esempio.invalid',     v_vecchio, false, '{}', 'no_entitlement'),
      ('founder_grant_b2c',   'da5b0000-0000-4000-8000-000000000022', 'wd-22@esempio.invalid',     v_vecchio, false, '{}', 'no_entitlement'),
      ('lifetime_in_grazia',  'da5b0000-0000-4000-8000-000000000023', 'wd-23@esempio.invalid',     v_vecchio, true,  '{lifetime_purchase}', null),
      ('scaduto_ma_admin',    'da5b0000-0000-4000-8000-000000000024', 'wd-24@esempio.invalid',     v_vecchio, true,  '{admin}', null),
      -- in prova e con un abbonamento scaduto: il motivo e' l'acquisto, non la prova
      ('prova_e_scaduto',     'da5b0000-0000-4000-8000-000000000025', 'wd-25@esempio.invalid',     v_nuovo,   false, '{}', 'subscription_inactive');

    insert into auth.users (id, email, created_at) select id, email, creato from wd_casi;
    insert into public.profiles (id, email) select id, email from wd_casi on conflict do nothing;

    insert into public.user_roles (user_id, role, expires_at, note) values
      ('da5b0000-0000-4000-8000-000000000001', 'pro', null, 'founder-launch'),
      ('da5b0000-0000-4000-8000-000000000002', 'pro', null, 'founder-launch'),
      ('da5b0000-0000-4000-8000-000000000003', 'pro', null, 'grandfather-prelaunch'),
      ('da5b0000-0000-4000-8000-000000000004', 'pro', null, 'beta tester closed beta, a vita'),
      ('da5b0000-0000-4000-8000-000000000005', 'pro', now() + interval '180 days', 'ring-reward'),
      ('da5b0000-0000-4000-8000-000000000006', 'pro', now() - interval '1 day', 'ring-reward'),
      ('da5b0000-0000-4000-8000-000000000007', 'pro', now() + interval '180 days', 'ring-reward'),
      ('da5b0000-0000-4000-8000-000000000015', 'pro', null, 'founder-launch'),
      ('da5b0000-0000-4000-8000-000000000017', 'admin', null, null),
      ('da5b0000-0000-4000-8000-000000000018', 'admin', now() - interval '1 day', null),
      ('da5b0000-0000-4000-8000-000000000024', 'admin', null, null);

    insert into public.b2c_subscriptions
      (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state) values
      ('da5b0000-0000-4000-8000-000000000007', 'google_play', 'wd.lifetime', 'WD-07', '9999-12-31', false, 'active'),
      ('da5b0000-0000-4000-8000-000000000008', 'google_play', 'wd.sub',      'WD-08', now() + interval '30 days', true, 'active'),
      ('da5b0000-0000-4000-8000-000000000009', 'google_play', 'wd.sub',      'WD-09', now() - interval '1 day', true, 'active'),
      ('da5b0000-0000-4000-8000-000000000010', 'google_play', 'wd.sub',      'WD-10', now() + interval '3 days', true, 'grace'),
      ('da5b0000-0000-4000-8000-000000000011', 'google_play', 'wd.sub',      'WD-11', now() + interval '10 days', false, 'cancelled'),
      ('da5b0000-0000-4000-8000-000000000012', 'apple_iap',   'wd.lifetime', 'WD-12', '9999-12-31', false, 'expired'),
      ('da5b0000-0000-4000-8000-000000000013', 'google_play', 'wd.lifetime', 'WD-13', '9999-12-31', false, 'on_hold'),
      ('da5b0000-0000-4000-8000-000000000021', 'trial',       'wd.trial',    'WD-21', now() + interval '30 days', false, 'active'),
      ('da5b0000-0000-4000-8000-000000000022', 'founder_grant','wd.founder', 'WD-22', '2099-12-31', false, 'active'),
      ('da5b0000-0000-4000-8000-000000000023', 'google_play', 'wd.lifetime', 'WD-23', '9999-12-31', false, 'grace'),
      ('da5b0000-0000-4000-8000-000000000024', 'google_play', 'wd.sub',      'WD-24', now() - interval '5 days', true, 'active'),
      ('da5b0000-0000-4000-8000-000000000025', 'google_play', 'wd.sub',      'WD-25', now() - interval '1 day', true, 'active');

    insert into private.billing_pagamenti_segnalati (user_id, piattaforma, segnalato_da, valido_fino, revocato_at) values
      ('da5b0000-0000-4000-8000-000000000019', 'apple', 'test-17', now() + interval '60 days', null),
      ('da5b0000-0000-4000-8000-000000000020', 'apple', 'test-17', now() + interval '60 days', now() - interval '1 day');

    -- ── 1. la matrice, come postgres sulla funzione privata ─────────────────
    for c in select * from wd_casi order by n loop
      v := private.web_dashboard_verdict(c.id);
      select coalesce(array_agg(x order by x), '{}') into v_titoli
        from jsonb_array_elements_text(v->'titles') x;
      if (v->>'contractVersion')::int is distinct from 1 then
        raise exception '1 FALLISCE  %: contractVersion %', c.n, v->>'contractVersion';
      end if;
      if (v->>'granted')::boolean is distinct from c.concesso then
        raise exception '1 FALLISCE  %: granted atteso %, ottenuto % (%)', c.n, c.concesso, v->>'granted', v;
      end if;
      if v_titoli is distinct from (select coalesce(array_agg(x order by x), '{}') from unnest(c.titoli) x) then
        raise exception '1 FALLISCE  %: titoli attesi %, ottenuti %', c.n, c.titoli, v_titoli;
      end if;
      if (v->>'denialReason') is distinct from c.motivo then
        raise exception '1 FALLISCE  %: motivo atteso %, ottenuto %', c.n, c.motivo, v->>'denialReason';
      end if;
    end loop;
    v_passati := v_passati + 1;
    raise notice '1 PASSA  matrice: % casi, verdetto, titoli e motivo come deciso', (select count(*) from wd_casi);

    -- ── 2. le trappole del primo ramo: il nucleo ne vede uno, qui tutti ─────
    v_core := private.entitlement_core('da5b0000-0000-4000-8000-000000000007');
    if v_core->>'reason' <> 'timed_pro_role' then
      raise exception '2 FALLISCE  il nucleo non chiama piu'' timed_pro_role il Lifetime con premio (%): la premessa di questo caso e'' cambiata', v_core->>'reason';
    end if;
    v_passati := v_passati + 1;
    raise notice '2 PASSA  Lifetime + premio: il nucleo vede solo % , il verdetto web vede lifetime_purchase e timed_grant', v_core->>'reason';

    -- ── 3. le differenze volute, misurate sul nucleo ─────────────────────────
    v_core := private.entitlement_core('da5b0000-0000-4000-8000-000000000014');
    if not (v_core->>'hasFullAccess')::boolean or v_core->>'kind' <> 'trial' then
      raise exception '3 FALLISCE  premessa: il nucleo dovrebbe concedere la prova (%)', v_core;
    end if;
    v_core := private.entitlement_core('da5b0000-0000-4000-8000-000000000009');
    if not (v_core->>'hasFullAccess')::boolean then
      raise exception '3 FALLISCE  premessa: il nucleo dovrebbe concedere l''abbonamento attivo non rivalidato (%)', v_core;
    end if;
    v_passati := v_passati + 1;
    raise notice '3 PASSA  la prova e l''abbonamento scaduto ma ''active'' concedono nell''app e NON nella dashboard web';

    -- ── 4. identita' e privilegi ─────────────────────────────────────────────
    -- 4a. l'involucro risponde per la sessione, e solo per lei
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', 'da5b0000-0000-4000-8000-000000000002', 'role', 'authenticated')::text, true);
    v := public.get_web_dashboard_access();
    execute 'reset role';
    if not (v->>'granted')::boolean then
      raise exception '4a FALLISCE  il Founder, come sessione, non ottiene accesso (%)', v;
    end if;
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', 'da5b0000-0000-4000-8000-000000000016', 'role', 'authenticated')::text, true);
    v := public.get_web_dashboard_access();
    execute 'reset role';
    if (v->>'granted')::boolean or v->>'denialReason' <> 'no_entitlement' then
      raise exception '4a FALLISCE  chi non ha titoli ottiene % mentre esiste un Founder nel database', v;
    end if;
    v_passati := v_passati + 1;
    raise notice '4a PASSA  l''involucro risponde per l''account della sessione e basta';

    -- 4b. authenticated non puo' passare un uuid alla funzione privata
    begin
      execute 'set local role authenticated';
      perform set_config('request.jwt.claims',
        json_build_object('sub', 'da5b0000-0000-4000-8000-000000000016', 'role', 'authenticated')::text, true);
      perform private.web_dashboard_verdict('da5b0000-0000-4000-8000-000000000002');
      execute 'reset role';
      raise exception '4b FALLISCE  authenticated ha chiamato la funzione privata con l''uuid di un altro';
    exception when insufficient_privilege then
      execute 'reset role';
    end;
    v_passati := v_passati + 1;
    raise notice '4b PASSA  authenticated non chiama la funzione privata: nessun modo di chiedere il verdetto di un altro';

    -- 4c. anon non raggiunge l'involucro
    begin
      execute 'set local role anon';
      perform set_config('request.jwt.claims', '', true);
      perform public.get_web_dashboard_access();
      execute 'reset role';
      raise exception '4c FALLISCE  anon ha chiamato get_web_dashboard_access';
    exception when insufficient_privilege then
      execute 'reset role';
    end;
    v_passati := v_passati + 1;
    raise notice '4c PASSA  anon non chiama get_web_dashboard_access';

    -- 4d. authenticated senza sub: 42501, non un verdetto
    begin
      execute 'set local role authenticated';
      perform set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);
      perform public.get_web_dashboard_access();
      execute 'reset role';
      raise exception '4d FALLISCE  senza sub e'' arrivato un verdetto invece di 42501';
    exception when insufficient_privilege then
      execute 'reset role';
    end;
    v_passati := v_passati + 1;
    raise notice '4d PASSA  senza sub nel JWT: 42501 not_authenticated, mai un «negato»';

    raise exception using errcode = 'P0999', message = 'ROLLBACK_INTENZIONALE';
  exception when sqlstate 'P0999' then
    null;
  end;
  raise notice 'verdetto dashboard web: % controlli passati', v_passati;
end $$;

-- ===========================================================================
-- CONTROLLO POSITIVO
--
-- Si toglie `active_until > v_now` dal ramo abbonamenti e si pretende che il
-- caso «abbonamento 'active' con scadenza passata» diventi concesso. La
-- funzione vera viene ripristinata subito dopo, prima di qualunque verdetto,
-- e l'ultima prova e' che sia tornata.
-- ===========================================================================
do $cp$
declare
  def_vera text;
  def_mutata text;
  v_prima jsonb;
  v_dopo jsonb;
  u constant uuid := 'da5b0000-0000-4000-8000-0000000000c9';
begin
  begin
    insert into auth.users (id, email, created_at) values (u, 'wd-cp@esempio.invalid', now() - interval '90 days');
    insert into public.profiles (id, email) values (u, 'wd-cp@esempio.invalid') on conflict do nothing;
    insert into public.b2c_subscriptions
      (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
      values (u, 'google_play', 'wd.sub', 'WD-CP', now() - interval '1 day', true, 'active');

    def_vera := pg_get_functiondef('private.web_dashboard_verdict(uuid)'::regprocedure);
    def_mutata := replace(def_vera, 'and b.active_until > v_now', '');
    if def_mutata = def_vera then
      raise exception 'CONTROLLO POSITIVO ROTTO: la condizione da togliere non c''e'' nel corpo';
    end if;

    v_prima := private.web_dashboard_verdict(u);
    execute def_mutata;
    v_dopo := private.web_dashboard_verdict(u);
    execute def_vera;   -- ripristino PRIMA di qualunque verdetto

    if (v_prima->>'granted')::boolean then
      raise exception 'CONTROLLO POSITIVO ROTTO: la funzione vera concede l''abbonamento scaduto (%)', v_prima;
    end if;
    if not (v_dopo->>'granted')::boolean then
      raise exception 'CONTROLLO POSITIVO ROTTO: senza la condizione sulla scadenza il caso resta negato (%). Il caso non dipende dalla condizione.', v_dopo;
    end if;
    raise notice '5 PASSA  controllo positivo: senza active_until > now l''abbonamento scaduto torna concesso';

    if (private.web_dashboard_verdict(u)->>'granted')::boolean then
      raise exception '5b FALLISCE  la funzione vera non e'' stata ripristinata';
    end if;
    raise notice '5b PASSA  la funzione vera e'' ripristinata';

    raise exception using errcode = 'P0999', message = 'ROLLBACK_INTENZIONALE';
  exception when sqlstate 'P0999' then
    null;
  end;
end
$cp$;
