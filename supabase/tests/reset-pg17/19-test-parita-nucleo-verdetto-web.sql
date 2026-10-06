-- ============================================================================
-- 19 — Parita' fra il nucleo dell'app e il verdetto della dashboard web
--
-- PERCHE' ESISTE
-- --------------
-- Il verdetto web (private.web_dashboard_verdict, migration 20260924120000) e il
-- nucleo (private.entitlement_core) sono DUE funzioni, e devono restare due: il
-- nucleo concede anche la prova e non guarda active_until nel ramo abbonamento, e
-- cambiarlo toccherebbe user_has_active_entitlement, il muro RLS delle scritture
-- usato dall'app. Due funzioni, pero', non possono diventare due verita'
-- commerciali incoerenti. Questo test le mette fianco a fianco su UNA matrice di
-- casi e pretende che OGNI differenza sia dichiarata qui, con il suo motivo:
--
--   DIFFERENZE VOLUTE (le sole ammesse)
--     D1  la prova di 14 giorni concede nell'app e NON sul web (decisione 3 di Matteo)
--     D2  un abbonamento 'active' o 'grace' con active_until passato concede nell'app (il
--         nucleo non guarda la data) e NON sul web (decisione 6: scadenza = fine accesso)
--
-- Se una differenza compare e non e' fra queste, il test e' rosso. Se una differenza
-- dichiarata sparisce, il test e' rosso lo stesso: la dichiarazione sarebbe falsa.
--
-- COSA PROVA ANCORA
--   - revoca e scadenza si vedono alla richiesta SUCCESSIVA, senza cache: concesso, poi
--     DELETE della riga / expires_at nel passato / stato revocato, poi negato, sia sulla
--     funzione privata sia sull'involucro pubblico come sessione `authenticated`;
--   - tester revocato (DELETE o expires_at), tester a tempo scaduto con nota beta,
--     premio valido con abbonamento scaduto, ponte iOS valido e scaduto;
--   - il PONTE iOS e' CARATTERIZZATO, non approvato: la matrice (ponte_ios_valido) e il punto 2f
--     fissano il comportamento ATTUALE (un ponte valido e' un timed_grant, uno scaduto e' negato).
--     Se Matteo decide diversamente (decisione aperta, alternative nel documento del contratto)
--     quei due casi vanno aggiornati. `cancelled` con periodo residuo e Founder registrato solo
--     come riga b2c sono solo STAMPATI (PENDING), non asseriti.
--
-- LIMITI DICHIARATI
--   Database RICOSTRUITO dalle migration, non la produzione: la migration del verdetto e'
--   NON APPLICATA in produzione. Nessun valore personale: indirizzi *.invalid, uuid inventati.
-- ============================================================================
\set ON_ERROR_STOP on

do $$
declare
  c record;
  v_core jsonb;
  v_web jsonb;
  v_titoli text[];
  v_passati int := 0;
  v_diff_trovate text[] := '{}';
  v_diff_dichiarate text[] := '{}';
  v_vecchio constant timestamptz := now() - interval '90 days';
  v_nuovo   constant timestamptz := now() - interval '2 days';
begin
  begin
    create temp table pm_casi(
      n text primary key, id uuid not null, email text not null, creato timestamptz not null,
      core_full boolean not null, core_kind text not null,
      web_granted boolean not null, web_titoli text[] not null, web_motivo text,
      differenza text);

    insert into pm_casi values
      ('solo_prova',                 'da5b0019-0000-4000-8000-000000000001', 'pm-01@esempio.invalid', v_nuovo,   true,  'trial',        false, '{}',                        'trial_only',            'D1'),
      ('abbonamento_active_scaduto', 'da5b0019-0000-4000-8000-000000000002', 'pm-02@esempio.invalid', v_vecchio, true,  'subscription', false, '{}',                        'subscription_inactive', 'D2'),
      ('abbonamento_valido',         'da5b0019-0000-4000-8000-000000000003', 'pm-03@esempio.invalid', v_vecchio, true,  'subscription', true,  '{subscription}',            null,                    null),
      ('lifetime_acquistato',        'da5b0019-0000-4000-8000-000000000004', 'pm-04@esempio.invalid', v_vecchio, true,  'lifetime',     true,  '{lifetime_purchase}',       null,                    null),
      ('lifetime_in_grazia',         'da5b0019-0000-4000-8000-000000000005', 'pm-05@esempio.invalid', v_vecchio, true,  'subscription', true,  '{lifetime_purchase}',       null,                    null),
      ('founder',                    'da5b0019-0000-4000-8000-000000000006', 'pm-06@esempio.invalid', v_vecchio, true,  'founder',      true,  '{founder}',                 null,                    null),
      ('tester_permanente',          'da5b0019-0000-4000-8000-000000000007', 'pm-07@esempio.invalid', v_vecchio, true,  'lifetime',     true,  '{lifetime_grant}',          null,                    null),
      ('tester_a_tempo_valido',      'da5b0019-0000-4000-8000-000000000008', 'pm-08@esempio.invalid', v_vecchio, true,  'subscription', true,  '{timed_grant}',             null,                    null),
      ('tester_a_tempo_scaduto_beta','da5b0019-0000-4000-8000-000000000009', 'pm-09@esempio.invalid', v_vecchio, false, 'none',         false, '{}',                        'no_entitlement',        null),
      ('premio_anello_valido',       'da5b0019-0000-4000-8000-000000000010', 'pm-10@esempio.invalid', v_vecchio, true,  'subscription', true,  '{timed_grant}',             null,                    null),
      ('ponte_ios_valido',           'da5b0019-0000-4000-8000-000000000011', 'pm-11@esempio.invalid', v_vecchio, true,  'subscription', true,  '{timed_grant}',             null,                    null),
      ('ponte_ios_scaduto',          'da5b0019-0000-4000-8000-000000000012', 'pm-12@esempio.invalid', v_vecchio, false, 'none',         false, '{}',                        'no_entitlement',        null),
      ('abbonamento_scaduto_e_premio','da5b0019-0000-4000-8000-000000000013','pm-13@esempio.invalid', v_vecchio, true,  'subscription', true,  '{timed_grant}',             null,                    null),
      ('admin',                      'da5b0019-0000-4000-8000-000000000014', 'pm-14@esempio.invalid', v_vecchio, true,  'admin',        true,  '{admin}',                   null,                    null),
      ('admin_scaduto',              'da5b0019-0000-4000-8000-000000000015', 'pm-15@esempio.invalid', v_vecchio, false, 'none',         false, '{}',                        'no_entitlement',        null),
      ('pagamento_a_mano',           'da5b0019-0000-4000-8000-000000000016', 'pm-16@esempio.invalid', v_vecchio, true,  'manualPayment',true,  '{manual_payment}',         null,                    null),
      ('pagamento_revocato',         'da5b0019-0000-4000-8000-000000000017', 'pm-17@esempio.invalid', v_vecchio, false, 'none',         false, '{}',                        'no_entitlement',        null),
      ('revisione_store',            'da5b0019-0000-4000-8000-000000000018', 'review@fitmesh.fit',    v_vecchio, true,  'appReview',    true,  '{app_review}',              null,                    null),
      ('acquisto_revocato',          'da5b0019-0000-4000-8000-000000000019', 'pm-19@esempio.invalid', v_vecchio, false, 'none',         false, '{}',                        'purchase_revoked',      null),
      ('abbonamento_in_grazia',      'da5b0019-0000-4000-8000-000000000020', 'pm-20@esempio.invalid', v_vecchio, true,  'subscription', true,  '{subscription}',            null,                    null),
      ('abbonamento_grace_scaduto',  'da5b0019-0000-4000-8000-000000000022', 'pm-22@esempio.invalid', v_vecchio, true,  'subscription', false, '{}',                        'subscription_inactive', 'D2'),
      ('niente',                     'da5b0019-0000-4000-8000-000000000021', 'pm-21@esempio.invalid', v_vecchio, false, 'none',         false, '{}',                        'no_entitlement',        null);

    insert into auth.users (id, email, created_at) select id, email, creato from pm_casi;
    insert into public.profiles (id, email) select id, email from pm_casi on conflict do nothing;

    insert into public.user_roles (user_id, role, expires_at, note) values
      ('da5b0019-0000-4000-8000-000000000006', 'pro',   null,                         'founder-launch'),
      ('da5b0019-0000-4000-8000-000000000007', 'pro',   null,                         'beta tester closed beta, a vita'),
      ('da5b0019-0000-4000-8000-000000000008', 'pro',   now() + interval '30 days',   'beta tester a tempo'),
      ('da5b0019-0000-4000-8000-000000000009', 'pro',   now() - interval '1 day',     'beta tester a tempo'),
      ('da5b0019-0000-4000-8000-000000000010', 'pro',   now() + interval '180 days',  'ring-reward'),
      ('da5b0019-0000-4000-8000-000000000011', 'pro',   now() + interval '180 days',  'cessione-ios-in-attesa-apple-iap'),
      ('da5b0019-0000-4000-8000-000000000012', 'pro',   now() - interval '1 day',     'cessione-ios-in-attesa-apple-iap'),
      ('da5b0019-0000-4000-8000-000000000013', 'pro',   now() + interval '180 days',  'ring-reward'),
      ('da5b0019-0000-4000-8000-000000000014', 'admin', null,                         null),
      ('da5b0019-0000-4000-8000-000000000015', 'admin', now() - interval '1 day',     null);

    insert into public.b2c_subscriptions
      (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state) values
      ('da5b0019-0000-4000-8000-000000000002', 'google_play', 'pm.sub',      'PM-02', now() - interval '1 day',   true,  'active'),
      ('da5b0019-0000-4000-8000-000000000003', 'google_play', 'pm.sub',      'PM-03', now() + interval '30 days', true,  'active'),
      ('da5b0019-0000-4000-8000-000000000004', 'google_play', 'pm.lifetime', 'PM-04', '9999-12-31',               false, 'active'),
      ('da5b0019-0000-4000-8000-000000000005', 'google_play', 'pm.lifetime', 'PM-05', '9999-12-31',               false, 'grace'),
      ('da5b0019-0000-4000-8000-000000000013', 'google_play', 'pm.sub',      'PM-13', now() - interval '1 day',   true,  'active'),
      ('da5b0019-0000-4000-8000-000000000019', 'apple_iap',   'pm.lifetime', 'PM-19', '9999-12-31',               false, 'expired'),
      ('da5b0019-0000-4000-8000-000000000020', 'google_play', 'pm.sub',      'PM-20', now() + interval '3 days',  true,  'grace'),
      ('da5b0019-0000-4000-8000-000000000022', 'google_play', 'pm.sub',      'PM-22', now() - interval '1 day',   true,  'grace');

    insert into private.billing_pagamenti_segnalati (user_id, piattaforma, segnalato_da, valido_fino, revocato_at) values
      ('da5b0019-0000-4000-8000-000000000016', 'apple', 'test-19', now() + interval '60 days', null),
      ('da5b0019-0000-4000-8000-000000000017', 'apple', 'test-19', now() + interval '60 days', now() - interval '1 day');

    -- ── 1. la matrice fianco a fianco: ogni differenza e' dichiarata ─────────
    for c in select * from pm_casi order by n loop
      v_core := private.entitlement_core(c.id);
      v_web  := private.web_dashboard_verdict(c.id);
      if (v_core->>'hasFullAccess')::boolean is distinct from c.core_full or v_core->>'kind' is distinct from c.core_kind then
        raise exception '1 FALLISCE  %: nucleo atteso (full=%, kind=%), ottenuto (full=%, kind=%)',
          c.n, c.core_full, c.core_kind, v_core->>'hasFullAccess', v_core->>'kind';
      end if;
      select coalesce(array_agg(x order by x), '{}') into v_titoli from jsonb_array_elements_text(v_web->'titles') x;
      if (v_web->>'granted')::boolean is distinct from c.web_granted
         or v_titoli is distinct from (select coalesce(array_agg(x order by x), '{}') from unnest(c.web_titoli) x)
         or (v_web->>'denialReason') is distinct from c.web_motivo then
        raise exception '1 FALLISCE  %: verdetto web atteso (granted=%, titoli=%, motivo=%), ottenuto %',
          c.n, c.web_granted, c.web_titoli, c.web_motivo, v_web;
      end if;
      -- l'accesso web e quello del nucleo coincidono SALVO le differenze dichiarate
      if (v_core->>'hasFullAccess')::boolean is distinct from (v_web->>'granted')::boolean then
        v_diff_trovate := v_diff_trovate || c.n;
        if c.differenza is null then
          raise exception '1 FALLISCE  %: differenza NON dichiarata fra nucleo (full=%) e verdetto web (granted=%)',
            c.n, v_core->>'hasFullAccess', v_web->>'granted';
        end if;
      end if;
      if c.differenza is not null then
        v_diff_dichiarate := v_diff_dichiarate || c.n;
      end if;
    end loop;
    if (select array_agg(x order by x) from unnest(v_diff_trovate) x) is distinct from
       (select array_agg(x order by x) from unnest(v_diff_dichiarate) x) then
      raise exception '1 FALLISCE  le differenze trovate % non coincidono con quelle dichiarate %', v_diff_trovate, v_diff_dichiarate;
    end if;
    v_passati := v_passati + 1;
    raise notice '1 PASSA  matrice di % casi: nucleo e verdetto web differiscono SOLO in % (D1 prova, D2 active_until passato in active o grace)',
      (select count(*) from pm_casi), v_diff_trovate;

    -- ── 2. revoca e scadenza si vedono alla richiesta successiva (nessuna cache) ──
    -- 2a. tester permanente: concesso, poi DELETE della riga -> negato
    v_web := private.web_dashboard_verdict('da5b0019-0000-4000-8000-000000000007');
    if not (v_web->>'granted')::boolean then raise exception '2a FALLISCE  premessa: il tester permanente non e'' concesso (%)', v_web; end if;
    delete from public.user_roles where user_id = 'da5b0019-0000-4000-8000-000000000007' and role = 'pro';
    v_web := private.web_dashboard_verdict('da5b0019-0000-4000-8000-000000000007');
    v_core := private.entitlement_core('da5b0019-0000-4000-8000-000000000007');
    if (v_web->>'granted')::boolean or v_web->>'denialReason' <> 'no_entitlement' or (v_core->>'hasFullAccess')::boolean then
      raise exception '2a FALLISCE  tester revocato per DELETE ancora idoneo: web %, nucleo %', v_web, v_core;
    end if;
    v_passati := v_passati + 1;
    raise notice '2a PASSA  tester revocato per DELETE: negato alla richiesta successiva (web e nucleo)';

    -- 2b. tester a tempo valido: concesso, poi expires_at nel passato -> negato
    v_web := private.web_dashboard_verdict('da5b0019-0000-4000-8000-000000000008');
    if not (v_web->>'granted')::boolean then raise exception '2b FALLISCE  premessa: il tester a tempo non e'' concesso (%)', v_web; end if;
    update public.user_roles set expires_at = now() - interval '1 second'
      where user_id = 'da5b0019-0000-4000-8000-000000000008' and role = 'pro';
    v_web := private.web_dashboard_verdict('da5b0019-0000-4000-8000-000000000008');
    if (v_web->>'granted')::boolean or v_web->>'denialReason' <> 'no_entitlement' then
      raise exception '2b FALLISCE  tester revocato per expires_at nel passato ancora idoneo: %', v_web;
    end if;
    v_passati := v_passati + 1;
    raise notice '2b PASSA  tester revocato per expires_at nel passato: negato alla richiesta successiva';

    -- 2c. abbonamento valido: concesso, poi stato 'expired' -> negato con il motivo dell'acquisto
    update public.b2c_subscriptions set state = 'expired' where user_id = 'da5b0019-0000-4000-8000-000000000003';
    v_web := private.web_dashboard_verdict('da5b0019-0000-4000-8000-000000000003');
    if (v_web->>'granted')::boolean or v_web->>'denialReason' <> 'subscription_inactive' then
      raise exception '2c FALLISCE  abbonamento passato a expired ancora idoneo: %', v_web;
    end if;
    v_passati := v_passati + 1;
    raise notice '2c PASSA  abbonamento passato a expired: negato (subscription_inactive)';

    -- 2d. pagamento a mano: concesso, poi revocato_at -> negato
    update private.billing_pagamenti_segnalati set revocato_at = now() where user_id = 'da5b0019-0000-4000-8000-000000000016';
    v_web := private.web_dashboard_verdict('da5b0019-0000-4000-8000-000000000016');
    if (v_web->>'granted')::boolean then raise exception '2d FALLISCE  pagamento revocato ancora idoneo: %', v_web; end if;
    v_passati := v_passati + 1;
    raise notice '2d PASSA  pagamento a mano revocato: negato alla richiesta successiva';

    -- 2e. premio anello: concesso, poi DELETE della riga -> negato
    delete from public.user_roles where user_id = 'da5b0019-0000-4000-8000-000000000010' and role = 'pro';
    v_web := private.web_dashboard_verdict('da5b0019-0000-4000-8000-000000000010');
    if (v_web->>'granted')::boolean then raise exception '2e FALLISCE  premio rimosso ancora idoneo: %', v_web; end if;
    v_passati := v_passati + 1;
    raise notice '2e PASSA  premio anello rimosso: negato alla richiesta successiva';

    -- 2f. ponte iOS: concesso finche' la riga e' valida, negato quando scade o viene tolta
    update public.user_roles set expires_at = now() - interval '1 second'
      where user_id = 'da5b0019-0000-4000-8000-000000000011' and role = 'pro';
    v_web := private.web_dashboard_verdict('da5b0019-0000-4000-8000-000000000011');
    if (v_web->>'granted')::boolean then raise exception '2f FALLISCE  ponte iOS scaduto ancora idoneo: %', v_web; end if;
    v_passati := v_passati + 1;
    raise notice '2f PASSA  ponte iOS scaduto: negato (il ponte non e'' un titolo permanente)';

    -- ── 3. l'involucro pubblico, come sessione, vede la revoca subito ────────────
    -- (il tester permanente del 2a e' gia' stato revocato: la sessione deve vederlo negato)
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', 'da5b0019-0000-4000-8000-000000000007', 'role', 'authenticated')::text, true);
    v_web := public.get_web_dashboard_access();
    execute 'reset role';
    if (v_web->>'granted')::boolean then
      raise exception '3 FALLISCE  la sessione di un tester revocato ottiene ancora l''accesso: %', v_web;
    end if;
    v_passati := v_passati + 1;
    raise notice '3 PASSA  sessione di un tester revocato: nessun accesso (nessuna cache nell''involucro)';

    -- ── 4. DECISIONI APERTE: esito attuale registrato, NON asserito ──────────────
    -- 4a. ponte iOS come titolo web (decisioni 2 e 3 in tensione, vedi referto D04)
    insert into auth.users (id, email, created_at) values ('da5b0019-0000-4000-8000-0000000000a3', 'pm-a3@esempio.invalid', v_vecchio);
    insert into public.profiles (id, email) values ('da5b0019-0000-4000-8000-0000000000a3', 'pm-a3@esempio.invalid') on conflict do nothing;
    insert into public.user_roles (user_id, role, expires_at, note)
      values ('da5b0019-0000-4000-8000-0000000000a3', 'pro', now() + interval '180 days', 'cessione-ios-in-attesa-apple-iap');
    v_core := private.entitlement_core('da5b0019-0000-4000-8000-0000000000a3');
    v_web  := private.web_dashboard_verdict('da5b0019-0000-4000-8000-0000000000a3');
    raise notice '4a CARATTERIZZATO  ponte iOS valido: nucleo full=% kind=%, web granted=% titoli=%. Non approvato: alternative A tenerlo / B titolo ios_bridge separato / C non idoneo al web (decisione aperta, nessuna scelta qui).',
      v_core->>'hasFullAccess', v_core->>'kind', v_web->>'granted', v_web->'titles';
    -- 4b. abbonamento 'cancelled' con periodo pagato residuo
    insert into auth.users (id, email, created_at) values ('da5b0019-0000-4000-8000-0000000000a1', 'pm-a1@esempio.invalid', v_vecchio);
    insert into public.profiles (id, email) values ('da5b0019-0000-4000-8000-0000000000a1', 'pm-a1@esempio.invalid') on conflict do nothing;
    insert into public.b2c_subscriptions
      (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
      values ('da5b0019-0000-4000-8000-0000000000a1', 'google_play', 'pm.sub', 'PM-A1', now() + interval '10 days', false, 'cancelled');
    v_core := private.entitlement_core('da5b0019-0000-4000-8000-0000000000a1');
    v_web  := private.web_dashboard_verdict('da5b0019-0000-4000-8000-0000000000a1');
    raise notice '4b PENDING  cancelled con periodo residuo: nucleo full=% kind=%, web granted=% motivo=%. Alternative: concede fino a active_until / nega (oggi) / dipende dalla proiezione 3B.',
      v_core->>'hasFullAccess', v_core->>'kind', v_web->>'granted', v_web->>'denialReason';
    -- 4c. Founder registrato solo come riga b2c founder_grant (decisione 27)
    insert into auth.users (id, email, created_at) values ('da5b0019-0000-4000-8000-0000000000a2', 'pm-a2@esempio.invalid', v_vecchio);
    insert into public.profiles (id, email) values ('da5b0019-0000-4000-8000-0000000000a2', 'pm-a2@esempio.invalid') on conflict do nothing;
    insert into public.b2c_subscriptions
      (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
      values ('da5b0019-0000-4000-8000-0000000000a2', 'founder_grant', 'pm.founder', 'PM-A2', '2099-12-31', false, 'active');
    v_core := private.entitlement_core('da5b0019-0000-4000-8000-0000000000a2');
    v_web  := private.web_dashboard_verdict('da5b0019-0000-4000-8000-0000000000a2');
    raise notice '4c PENDING  Founder solo riga b2c: nucleo full=% kind=%, web granted=% motivo=%. Decisione 27 aperta.',
      v_core->>'hasFullAccess', v_core->>'kind', v_web->>'granted', v_web->>'denialReason';

    raise exception using errcode = 'P0999', message = 'ROLLBACK_INTENZIONALE';
  exception when sqlstate 'P0999' then
    null;
  end;
  raise notice 'parita'' nucleo/verdetto web: % controlli passati', v_passati;
end $$;
