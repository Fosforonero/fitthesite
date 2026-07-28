\set ON_ERROR_STOP on
set role postgres;

-- Sprint P0.10A — gap esplicitamente segnalato nel gate NO-GO di Matteo su
-- 20260720140000 (Sprint P0.7): il test di regressione delle esclusioni
-- email girava SOLO sulla catena senza cutoff/finestra attivi, "mai sulla
-- catena completa" — nessuna prova automatica che l'esclusione sopravviva
-- quando cutoff/finestra sono attivi nella STESSA funzione. In questo
-- branch cutoff/finestra sono SEMPRE attivi (un solo motore, non due
-- catene) — ogni caso qui isola esplicitamente il controllo esclusione dal
-- timing, con created_at/first_sync_at scelti DENTRO la finestra valida (mai
-- lasciati al default "now()" implicito).

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 1: review@fitmesh.fit, created_at/first_sync_at ENTRAMBI dentro la
  -- finestra valida e ben prima del cutoff -> deve restare escluso
  -- comunque, l'esclusione ha priorita' sulla valutazione cutoff/finestra.
  v_user := test.mkuser('review@fitmesh.fit', now() - interval '2 days');
  v_device := test.mkdevice(v_user, 'fp-review-1', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'notEligibleReason') = 'excluded_account' and (v_result->>'grantCreated')::boolean = false then
    raise notice 'CASO 1 (review@fitmesh.fit escluso, timing valido): PASS - %', v_result;
  else
    raise exception 'CASO 1: FAIL - %', v_result;
  end if;

  if not exists (select 1 from public.user_roles where user_id = v_user) then
    raise notice 'CASO 1b (nessun ruolo scritto): PASS';
  else
    raise exception 'CASO 1b: FAIL - ruolo scritto per review@fitmesh.fit';
  end if;

  if not exists (select 1 from private.founder_evaluations where user_id = v_user) then
    raise notice 'CASO 1c (nessun esito terminale persistito per un account escluso — l''esclusione non consuma il ledger): PASS';
  else
    raise exception 'CASO 1c: FAIL - founder_evaluations ha una riga per un account escluso';
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 2: variazione maiuscole/minuscole, timing ancora dentro la finestra.
  v_user := test.mkuser('Review@FitMesh.Fit', now() - interval '1 hour');
  v_device := test.mkdevice(v_user, 'fp-review-2', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'notEligibleReason') = 'excluded_account' then
    raise notice 'CASO 2 (Review@FitMesh.Fit, case-insensitive, timing valido): PASS - %', v_result;
  else
    raise exception 'CASO 2: FAIL - %', v_result;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 3: appreview.demo@fitmesh.fit, timing dentro la finestra -> escluso.
  v_user := test.mkuser('APPREVIEW.DEMO@fitmesh.fit', now() - interval '1 hour');
  v_device := test.mkdevice(v_user, 'fp-demo-1', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'notEligibleReason') = 'excluded_account' then
    raise notice 'CASO 3 (appreview.demo, timing valido): PASS - %', v_result;
  else
    raise exception 'CASO 3: FAIL - %', v_result;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 4: falso positivo — email che CONTIENE "review" come sottostringa,
  -- timing valido -> deve restare eleggibile normalmente (confronto e'
  -- uguaglianza esatta, non ilike/contains).
  v_user := test.mkuser('mario.review@example.com', now() - interval '1 hour');
  v_device := test.mkdevice(v_user, 'fp-normal-1', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'grantCreated')::boolean = true then
    raise notice 'CASO 4 (sottostringa "review", non escluso): PASS - %', v_result;
  else
    raise exception 'CASO 4: FAIL (falso positivo di esclusione) - %', v_result;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 5: review@fitmesh.fit registrato pochi minuti prima del cutoff
  -- esatto, prima sync subito dopo — timing "al limite" ma ancora dentro
  -- cutoff/finestra: l'esclusione deve comunque prevalere (mai un
  -- grant per un secondo motivo diverso da program_closed/window_expired).
  -- Variante di case diversa dai casi 1/2 (email univoca in auth.users):
  -- il confronto di esclusione e' su lower(email), quindi resta equivalente.
  v_user := test.mkuser('REVIEW@fitmesh.FIT', '2026-07-31T21:45:00Z'::timestamptz);
  v_device := test.mkdevice(v_user, 'fp-review-5', '2026-07-31T21:50:00Z'::timestamptz);
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'notEligibleReason') = 'excluded_account' then
    raise notice 'CASO 5 (review@fitmesh.fit vicino al cutoff, ancora dentro la finestra, escluso per email non per timing): PASS - %', v_result;
  else
    raise exception 'CASO 5: FAIL - %', v_result;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Caso 6 (contrasto): un'email NORMALE nello stesso identico scenario
  -- temporale del Caso 5 (registrato prima del cutoff, prima sync entro la
  -- finestra) DEVE ottenere granted — prova che quando l'esclusione non si
  -- applica, cutoff/finestra si comportano correttamente e non "ereditano"
  -- accidentalmente l'esito del caso 5.
  v_user := test.mkuser('normale5@example.com', '2026-07-31T21:45:00Z'::timestamptz);
  v_device := test.mkdevice(v_user, 'fp-normale-5', '2026-07-31T21:50:00Z'::timestamptz);
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'grantCreated')::boolean = true then
    raise notice 'CASO 6 (email normale, stesso timing del Caso 5, granted): PASS - %', v_result;
  else
    raise exception 'CASO 6: FAIL - %', v_result;
  end if;
end $$;

select 'EXCLUSION_COMBINED_WITH_CUTOFF_WINDOW_OK' as result;
