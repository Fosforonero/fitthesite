\set ON_ERROR_STOP on
set role postgres;

-- Sprint P0.10A — BLOCCO 2, scenario "device multipli": la finestra di 14
-- giorni e' letta da devices.first_sync_at del device PASSATO alla
-- chiamata (p_device_id), non da un aggregato per utente. Una volta che il
-- primo device valutato ottiene un esito (granted o terminale), quell'esito
-- e' per l'UTENTE (user_roles/founder_evaluations sono keyed su user_id) —
-- un secondo device dello stesso utente non puo' mai riaprire o
-- retroattivamente cambiare l'esito, indipendentemente dal proprio timing.

do $$
declare
  v_user uuid; v_device_a uuid; v_device_b uuid; v_result_a jsonb; v_result_b jsonb;
begin
  -- Device A sincronizza per primo, dentro la finestra -> granted.
  -- Device B (stesso utente) sincronizza dopo, con un first_sync_at proprio
  -- che sarebbe FUORI dalla finestra se valutato da solo — ma l'utente e'
  -- gia' pro: device B non deve mai essere valutato contro cutoff/finestra.
  v_user := test.mkuser('multidevice-a@example.com', now() - interval '1 day');
  v_device_a := test.mkdevice(v_user, 'fp-md-a', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device_a);

  v_result_a := private.grant_founder_launch_core(v_user, v_device_a);
  if (v_result_a->>'grantCreated')::boolean = true then
    raise notice 'CASO A (primo device, dentro la finestra, granted): PASS - %', v_result_a;
  else
    raise exception 'CASO A: FAIL - %', v_result_a;
  end if;

  v_device_b := test.mkdevice(v_user, 'fp-md-b', now() + interval '30 days');
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device_b);

  v_result_b := private.grant_founder_launch_core(v_user, v_device_b);
  if (v_result_b->>'alreadyHadEligibleGrant')::boolean = true and (v_result_b->>'notEligibleReason') is null then
    raise notice 'CASO B (secondo device, timing proprio fuori finestra, ma utente gia'' pro -> alreadyHadEligibleGrant, mai rivalutato): PASS - %', v_result_b;
  else
    raise exception 'CASO B: FAIL - %', v_result_b;
  end if;

  if (select count(*) from private.founder_seats where user_id = v_user) = 1 then
    raise notice 'CASO C (un solo seat consumato nonostante 2 device): PASS';
  else
    raise exception 'CASO C: FAIL - seats=%', (select count(*) from private.founder_seats where user_id = v_user);
  end if;
end $$;

do $$
declare
  v_user uuid; v_device_a uuid; v_device_b uuid; v_result_a jsonb; v_result_b jsonb;
begin
  -- Simmetrico: device A valutato PER PRIMO fuori finestra -> window_expired
  -- persistito (motivo esatto, P0.10B). Device B (stesso utente), timing
  -- proprio DENTRO la finestra, sincronizza dopo -> l'esito resta
  -- window_expired (l'esito terminale e' per l'utente, mai riaperto da un
  -- device diverso).
  v_user := test.mkuser('multidevice-d@example.com', now() - interval '20 days');
  v_device_a := test.mkdevice(v_user, 'fp-md-d', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device_a);

  v_result_a := private.grant_founder_launch_core(v_user, v_device_a);
  if (v_result_a->>'notEligibleReason') = 'window_expired' then
    raise notice 'CASO D (primo device, fuori finestra, window_expired persistito): PASS - %', v_result_a;
  else
    raise exception 'CASO D: FAIL - %', v_result_a;
  end if;

  v_device_b := test.mkdevice(v_user, 'fp-md-e', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device_b);

  v_result_b := private.grant_founder_launch_core(v_user, v_device_b);
  if (v_result_b->>'notEligibleReason') = 'window_expired' and (v_result_b->>'grantCreated')::boolean = false then
    raise notice 'CASO E (secondo device, timing proprio dentro finestra, ma esito utente gia'' deciso -> resta window_expired, mai riaperto): PASS - %', v_result_b;
  else
    raise exception 'CASO E: FAIL - %', v_result_b;
  end if;

  if not exists (select 1 from private.founder_seats where user_id = v_user) then
    raise notice 'CASO F (nessun seat consumato, coerente con l''esito window_expired originale): PASS';
  else
    raise exception 'CASO F: FAIL - un seat e'' stato consumato per un utente gia'' valutato window_expired';
  end if;
end $$;

select 'MULTIDEVICE_TESTS_OK' as result;
