\set ON_ERROR_STOP on
set role postgres;

-- Sprint P0.10A — verifica funzionale di 20260728090000 applicata SOPRA la
-- catena reale gia' live (20260720120247 + le storiche). Chiama
-- private.grant_founder_launch_core esattamente come farebbe
-- record_first_sync_transition (stessa firma, stesso contratto risposta).
-- Adattato da Sprint P0.7 (tools/founder-p0-reconciliation/10-functional-tests.sql):
-- rimossi i casi su public._founder_integrity_counts() (Monitor v2, non
-- portato in questo giro — deliberatamente fuori scope P0.10A).

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 1: registrazione + sync entro cutoff/finestra -> granted.
  v_user := test.mkuser('utente1@example.com', now() - interval '1 day');
  v_device := test.mkdevice(v_user, 'fp1', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'grantCreated')::boolean = true then
    raise notice 'CASO 1 (granted): PASS - %', v_result;
  else
    raise exception 'CASO 1: FAIL - %', v_result;
  end if;

  if exists (select 1 from public.user_roles where user_id = v_user and role = 'pro' and note = 'founder-launch' and expires_at is null) then
    raise notice 'CASO 1b (user_roles corretto): PASS';
  else
    raise exception 'CASO 1b: FAIL';
  end if;

  if exists (select 1 from private.founder_seats where user_id = v_user and source = 'verified_sync') then
    raise notice 'CASO 1c (founder_seats scritta): PASS';
  else
    raise exception 'CASO 1c: FAIL';
  end if;

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'alreadyHadEligibleGrant')::boolean = true
     and (select count(*) from private.founder_seats where user_id = v_user) = 1
  then
    raise notice 'CASO 1d (ripetuta: already granted, un solo seat): PASS';
  else
    raise exception 'CASO 1d: FAIL - %', v_result;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 2: off-by-one sul cutoff (2026-07-31T22:00:00Z esatto -> chiuso;
  -- un microsecondo prima -> ancora aperto).
  v_user := test.mkuser('utente2@example.com', '2026-07-31T22:00:00Z'::timestamptz);
  v_device := test.mkdevice(v_user, 'fp2', '2026-07-31T22:00:00Z'::timestamptz);
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if v_result->>'notEligibleReason' = 'program_closed' then
    raise notice 'CASO 2 (cutoff esatto = program_closed): PASS - %', v_result;
  else
    raise exception 'CASO 2: FAIL - %', v_result;
  end if;

  v_user := test.mkuser('utente2b@example.com', '2026-07-31T21:59:59.999999Z'::timestamptz);
  v_device := test.mkdevice(v_user, 'fp2b', '2026-07-31T21:59:59.999999Z'::timestamptz);
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'grantCreated')::boolean = true then
    raise notice 'CASO 2b (un microsecondo prima = granted): PASS - %', v_result;
  else
    raise exception 'CASO 2b: FAIL - %', v_result;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 3: prima sync oltre i 14gg dalla registrazione -> window_expired,
  -- persistito, mai rivalutato anche se richiamato di nuovo.
  v_user := test.mkuser('utente3@example.com', now() - interval '20 days');
  v_device := test.mkdevice(v_user, 'fp3', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if v_result->>'notEligibleReason' = 'window_expired' then
    raise notice 'CASO 3 (oltre 14gg = window_expired): PASS - %', v_result;
  else
    raise exception 'CASO 3: FAIL - %', v_result;
  end if;

  -- P0.10B: outcome deve essere il motivo ESATTO (window_expired), non un
  -- bucket generico 'not_eligible' che poi verrebbe rimappato a caso.
  if (select outcome from private.founder_evaluations where user_id = v_user) = 'window_expired' then
    raise notice 'CASO 3b (persistito in founder_evaluations come window_expired, non un bucket generico): PASS';
  else
    raise exception 'CASO 3b: FAIL - outcome=%', (select outcome from private.founder_evaluations where user_id = v_user);
  end if;

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if v_result->>'notEligibleReason' = 'window_expired' then
    raise notice 'CASO 3c (non rivalutato): PASS';
  else
    raise exception 'CASO 3c: FAIL - %', v_result;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 3d: finestra al limite ESATTO (first_sync_at = created_at + 14gg,
  -- al secondo) -> resta eligible (<=, non <).
  v_user := test.mkuser('utente3d@example.com', '2026-07-01T00:00:00Z'::timestamptz);
  v_device := test.mkdevice(v_user, 'fp3d', '2026-07-15T00:00:00Z'::timestamptz);
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'grantCreated')::boolean = true then
    raise notice 'CASO 3d (limite esatto 14gg = eligible): PASS - %', v_result;
  else
    raise exception 'CASO 3d: FAIL - %', v_result;
  end if;

  -- Caso 3e: un secondo oltre il limite -> window_expired.
  v_user := test.mkuser('utente3e@example.com', '2026-07-01T00:00:00Z'::timestamptz);
  v_device := test.mkdevice(v_user, 'fp3e', '2026-07-15T00:00:01Z'::timestamptz);
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if v_result->>'notEligibleReason' = 'window_expired' then
    raise notice 'CASO 3e (un secondo oltre 14gg = window_expired): PASS - %', v_result;
  else
    raise exception 'CASO 3e: FAIL - %', v_result;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
  v_taken int; v_reserved int;
begin
  -- Caso 4: cap con posti riservati. Riempio founder_seats fino a
  -- (1000 - riservati - 1), poi verifico boundary in entrambe le direzioni.
  select count(*) into v_taken from private.founder_seats;
  select count(*) into v_reserved from public.founder_grants where applied_user_id is null;

  insert into private.founder_seats (founder_number, user_id, source, registered_at, granted_at, rule_version)
  select gs, null, 'verified_sync', now(), now(), 'test_fill'
  from generate_series(1, 1000) gs
  where gs not in (select coalesce(founder_number, -1) from private.founder_seats)
    and gs not in (select founder_number from public.founder_grants)
  limit (1000 - v_reserved - v_taken - 1);

  v_user := test.mkuser('utente4a@example.com', now() - interval '1 day');
  v_device := test.mkdevice(v_user, 'fp4a', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'grantCreated')::boolean = true then
    raise notice 'CASO 4 (ultimo posto libero = granted): PASS - %', v_result;
  else
    raise exception 'CASO 4: FAIL - %, taken=%, reserved=%', v_result, v_taken, v_reserved;
  end if;

  v_user := test.mkuser('utente4b@example.com', now() - interval '1 day');
  v_device := test.mkdevice(v_user, 'fp4b', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if v_result->>'notEligibleReason' = 'cap_reached' and (v_result->>'capReached')::boolean = true then
    raise notice 'CASO 4b (cap pieno con riservati, persistito): PASS - %', v_result;
  else
    raise exception 'CASO 4b: FAIL - %', v_result;
  end if;

  -- Ripetuta: mai rivalutato (esito terminale persistito, BLOCCO 3).
  v_result := private.grant_founder_launch_core(v_user, v_device);
  if v_result->>'notEligibleReason' = 'cap_reached' then
    raise notice 'CASO 4b-bis (cap_reached non rivalutato): PASS';
  else
    raise exception 'CASO 4b-bis: FAIL - %', v_result;
  end if;

  if not exists (
    select 1 from private.founder_seats fs
    join public.founder_grants fg on fg.founder_number = fs.founder_number
    where fg.applied_user_id is null
  ) then
    raise notice 'CASO 4c (numeri riservati mai assegnati, anche a cap pieno): PASS';
  else
    raise exception 'CASO 4c: FAIL';
  end if;

  if (select count(*) from private.founder_seats) = 1000 then
    raise notice 'CASO 4d (cap esatto 1000, mai superato): PASS';
  else
    raise exception 'CASO 4d: FAIL - count=%', (select count(*) from private.founder_seats);
  end if;
end $$;

select 'FUNCTIONAL_TESTS_OK' as result;
