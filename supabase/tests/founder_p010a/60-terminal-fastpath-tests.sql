\set ON_ERROR_STOP on
set role postgres;

-- Sprint P0.10A Blocco 3 — verifica che un utente gia' deciso (pro da
-- qualunque fonte, o esito terminale gia' persistito) salti DAVVERO le
-- query fitness_metrics/auth.users, non solo che il risultato JSON finale
-- sia invariato (gia' provato in 10-functional-tests.sql). Il contratto
-- pubblico non espone il numero di query eseguite: qui si usa una copia
-- "probe" della funzione reale, IDENTICA riga per riga a
-- private.grant_founder_launch_core (20260728090000) tranne due
-- `insert into test.probe_hits` aggiunti immediatamente prima dei due
-- controlli che il riordino BLOCCO 3 intende rendere raggiungibili SOLO
-- quando l'utente non e' ancora deciso.

create schema if not exists test;
create table if not exists test.probe_hits (label text not null, hit_at timestamptz not null default now());

create or replace function private.grant_founder_launch_core_probe(p_user_id uuid, p_device_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public, private
as $$
declare
  founder_cap constant int := 1000;
  founder_cutoff constant timestamptz := '2026-07-31T22:00:00Z'::timestamptz;
  founder_window constant interval := interval '14 days';
  v_rule_version constant text := 'founder_p010a_ledger_v1_probe';
  v_email text;
  v_created_at timestamptz;
  v_first_sync_at timestamptz;
  v_taken int;
  v_reserved_pending int;
  v_founder_number int;
  v_rows int;
  v_outcome text;
begin
  if p_user_id is null or p_device_id is null then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'missing_context');
  end if;

  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;
  select outcome into v_outcome from private.founder_evaluations where user_id = p_user_id;
  if v_outcome is not null then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false, 'grantKind', null,
      'capReached', v_outcome = 'cap_reached',
      'notEligibleReason', case when v_outcome = 'cap_reached' then 'cap_reached' else 'window_expired' end);
  end if;

  -- PROBE: raggiunto solo se l'utente non e' ancora deciso.
  insert into test.probe_hits (label) values ('fitness_metrics_check');
  if not exists (select 1 from public.fitness_metrics where user_id = p_user_id and device_id = p_device_id) then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'no_metrics_evidence');
  end if;

  -- PROBE: raggiunto solo se l'utente non e' ancora deciso.
  insert into test.probe_hits (label) values ('email_check');
  select email, created_at into v_email, v_created_at from auth.users where id = p_user_id;
  if v_email is null or v_email ilike '%.invalid'
    or lower(v_email) = lower('review@fitmesh.fit')
    or lower(v_email) = lower('appreview.demo@fitmesh.fit')
  then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'excluded_account');
  end if;

  if exists (select 1 from private.founder_seats where user_id = p_user_id) then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;

  perform pg_advisory_xact_lock(hashtext('founder-launch-grant'));

  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;

  if v_created_at is null or v_created_at >= founder_cutoff then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'not_eligible', v_created_at, v_rule_version) on conflict (user_id) do nothing;
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'program_closed');
  end if;

  select first_sync_at into v_first_sync_at from public.devices where id = p_device_id;
  if v_first_sync_at is null or v_first_sync_at > v_created_at + founder_window then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'not_eligible', v_created_at, v_rule_version) on conflict (user_id) do nothing;
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'window_expired');
  end if;

  select count(*) into v_taken from private.founder_seats;
  select count(*) into v_reserved_pending from public.founder_grants where applied_user_id is null;
  if v_taken + v_reserved_pending >= founder_cap then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'cap_reached', v_created_at, v_rule_version) on conflict (user_id) do nothing;
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached');
  end if;

  v_founder_number := private._next_founder_number();
  if v_founder_number is null then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'cap_reached', v_created_at, v_rule_version) on conflict (user_id) do nothing;
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached');
  end if;

  insert into private.founder_seats (founder_number, user_id, source, registered_at, first_sync_evidence_at, granted_at, rule_version)
  values (v_founder_number, p_user_id, 'verified_sync', v_created_at, v_first_sync_at, now(), v_rule_version);

  insert into public.user_roles (user_id, role, expires_at, note)
  values (p_user_id, 'pro', null, 'founder-launch') on conflict (user_id, role) do nothing;
  get diagnostics v_rows = row_count;

  return jsonb_build_object('grantCreated', v_rows > 0, 'alreadyHadEligibleGrant', v_rows = 0,
    'grantKind', case when v_rows > 0 then 'founder-launch' else null end,
    'capReached', false, 'notEligibleReason', null);
end;
$$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb; v_hits_after_1 int; v_hits_after_2 int; v_hits_after_3 int;
begin
  -- Scenario "granted": prima chiamata deve toccare entrambe le probe;
  -- chiamate successive (utente ormai pro) zero probe aggiuntive.
  v_user := test.mkuser('fastpath-granted@example.com', now() - interval '1 day');
  v_device := test.mkdevice(v_user, 'fp-fastpath-granted', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  delete from test.probe_hits;
  v_result := private.grant_founder_launch_core_probe(v_user, v_device);
  select count(*) into v_hits_after_1 from test.probe_hits;
  if (v_result->>'grantCreated')::boolean = true and v_hits_after_1 = 2 then
    raise notice 'CASO GRANTED-1 (prima chiamata: 2 probe, granted): PASS - %', v_result;
  else
    raise exception 'CASO GRANTED-1: FAIL - result=%, hits=%', v_result, v_hits_after_1;
  end if;

  v_result := private.grant_founder_launch_core_probe(v_user, v_device);
  select count(*) into v_hits_after_2 from test.probe_hits;
  v_result := private.grant_founder_launch_core_probe(v_user, v_device);
  select count(*) into v_hits_after_3 from test.probe_hits;

  if v_hits_after_2 = v_hits_after_1 and v_hits_after_3 = v_hits_after_1 then
    raise notice 'CASO GRANTED-2/3 (2 sync successive, ZERO probe aggiuntive — fitness_metrics/email saltati, Blocco 3): PASS - hits=%', v_hits_after_1;
  else
    raise exception 'CASO GRANTED-2/3: FAIL - hits_1=%, hits_2=%, hits_3=%', v_hits_after_1, v_hits_after_2, v_hits_after_3;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb; v_hits_after_1 int; v_hits_after_2 int;
begin
  -- Scenario "esito terminale senza posto" (window_expired): stessa logica.
  v_user := test.mkuser('fastpath-expired@example.com', now() - interval '20 days');
  v_device := test.mkdevice(v_user, 'fp-fastpath-expired', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  delete from test.probe_hits;
  v_result := private.grant_founder_launch_core_probe(v_user, v_device);
  select count(*) into v_hits_after_1 from test.probe_hits;
  if v_result->>'notEligibleReason' = 'window_expired' and v_hits_after_1 = 2 then
    raise notice 'CASO EXPIRED-1 (prima chiamata: 2 probe, window_expired): PASS - %', v_result;
  else
    raise exception 'CASO EXPIRED-1: FAIL - result=%, hits=%', v_result, v_hits_after_1;
  end if;

  v_result := private.grant_founder_launch_core_probe(v_user, v_device);
  select count(*) into v_hits_after_2 from test.probe_hits;
  if v_hits_after_2 = v_hits_after_1 and v_result->>'notEligibleReason' = 'window_expired' then
    raise notice 'CASO EXPIRED-2 (sync successiva, ZERO probe aggiuntive — esito persistito salta fitness_metrics/email, Blocco 3): PASS';
  else
    raise exception 'CASO EXPIRED-2: FAIL - hits_1=%, hits_2=%, result=%', v_hits_after_1, v_hits_after_2, v_result;
  end if;
end $$;

drop function private.grant_founder_launch_core_probe(uuid, uuid);

select 'TERMINAL_FASTPATH_TESTS_OK' as result;
