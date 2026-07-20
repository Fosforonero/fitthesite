-- Restore the real (non-sleeping, non-failing) function after 04_concurrency.sh,
-- then run TEST 12: simulated grant failure rolls back the success transition.
\set ON_ERROR_STOP 0
\pset pager off

create or replace function private.grant_founder_launch_core(p_user_id uuid, p_device_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public, private
as $$
declare
  founder_cap constant int := 1000;
  v_email text;
  v_taken int;
  v_rows int;
begin
  if p_user_id is null or p_device_id is null then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'missing_context');
  end if;
  if not exists (select 1 from public.fitness_metrics where user_id = p_user_id and device_id = p_device_id) then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'no_metrics_evidence');
  end if;
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null or v_email ilike '%.invalid' or lower(v_email) = lower('appreview.demo@fitmesh.fit') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'excluded_account');
  end if;
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;
  perform pg_advisory_xact_lock(hashtext('founder-launch-grant'));
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;
  select count(distinct user_id) into v_taken from public.user_roles where note = 'founder-launch';
  if v_taken >= founder_cap then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached');
  end if;
  insert into public.user_roles (user_id, role, expires_at, note)
  values (p_user_id, 'pro', null, 'founder-launch')
  on conflict (user_id, role) do nothing;
  get diagnostics v_rows = row_count;
  return jsonb_build_object('grantCreated', v_rows > 0, 'alreadyHadEligibleGrant', v_rows = 0,
    'grantKind', case when v_rows > 0 then 'founder-launch' else null end,
    'capReached', false, 'notEligibleReason', null);
end;
$$;
revoke all on function private.grant_founder_launch_core(uuid, uuid) from public, anon, authenticated;

\echo '=== TEST 12: simulated grant failure rolls back the success transition ==='
-- TEST 11/15 (concurrency) left the cap at exactly 1000; reset so this
-- test exercises the failure/rollback path on its own, not cap_reached.
delete from public.user_roles where note = 'founder-launch';

select test.mkuser('user12@example.com') as u12 \gset
select test.mkdevice(:'u12'::uuid, 'fp-12') as d12 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u12'::uuid, :'d12'::uuid);

create or replace function private.grant_founder_launch_core(p_user_id uuid, p_device_id uuid)
returns jsonb language plpgsql as $$
begin
  raise exception 'simulated_grant_failure';
end $$;

set role authenticated;
set request.jwt.claim.sub = :'u12';
do $$
begin
  begin
    perform public.record_first_sync_transition('fp-12', 'success', 'android', '1.0');
    raise exception 'FAIL: TEST 12 expected the RPC call to fail (simulated_grant_failure)';
  exception when others then
    if sqlerrm <> 'simulated_grant_failure' then
      raise exception 'FAIL: TEST 12 unexpected error: %', sqlerrm;
    end if;
    raise notice 'PASS: TEST 12 RPC failed as expected (%), transition not committed', sqlerrm;
  end;
end $$;
reset role;
reset request.jwt.claim.sub;

select test.assert(
  not exists (select 1 from public.devices where device_fingerprint='fp-12' and first_sync_state is not null),
  'TEST 12 first_sync_state still NULL after failure, next sync will retry both'
);

-- restore the real function, then retry: should now succeed cleanly.
create or replace function private.grant_founder_launch_core(p_user_id uuid, p_device_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public, private
as $$
declare
  founder_cap constant int := 1000;
  v_email text;
  v_taken int;
  v_rows int;
begin
  if p_user_id is null or p_device_id is null then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'missing_context');
  end if;
  if not exists (select 1 from public.fitness_metrics where user_id = p_user_id and device_id = p_device_id) then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'no_metrics_evidence');
  end if;
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null or v_email ilike '%.invalid' or lower(v_email) = lower('appreview.demo@fitmesh.fit') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'excluded_account');
  end if;
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;
  perform pg_advisory_xact_lock(hashtext('founder-launch-grant'));
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;
  select count(distinct user_id) into v_taken from public.user_roles where note = 'founder-launch';
  if v_taken >= founder_cap then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached');
  end if;
  insert into public.user_roles (user_id, role, expires_at, note)
  values (p_user_id, 'pro', null, 'founder-launch')
  on conflict (user_id, role) do nothing;
  get diagnostics v_rows = row_count;
  return jsonb_build_object('grantCreated', v_rows > 0, 'alreadyHadEligibleGrant', v_rows = 0,
    'grantKind', case when v_rows > 0 then 'founder-launch' else null end,
    'capReached', false, 'notEligibleReason', null);
end;
$$;
revoke all on function private.grant_founder_launch_core(uuid, uuid) from public, anon, authenticated;

set role authenticated;
set request.jwt.claim.sub = :'u12';
select public.record_first_sync_transition('fp-12', 'success', 'android', '1.0') as result12retry \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result12retry'::jsonb->>'grantCreated')::boolean is true, 'TEST 12 retry after fix grants: ' || :'result12retry');

\echo '=== ALL TESTS DONE ==='
