#!/bin/bash
# TEST 11: concurrent last-slot calls (DIFFERENT users) cannot exceed 1000.
# TEST 15: concurrent calls for the SAME user (two devices) must never both
#          see capReached — the second must resolve to alreadyHadEligibleGrant
#          via the post-lock recheck (point 4 of the review).
#
# Injects a deliberate pg_sleep AFTER the pre-lock fast-path check but
# BEFORE the advisory lock (only for this test) to force concurrent callers
# to actually overlap in the critical section, instead of hoping
# process-spawn jitter causes a race.
set -e

docker exec -i founder-p0-pg psql -U postgres <<'SQL'
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

  -- TEST-ONLY: force both concurrent callers to be in-flight together
  -- before either reaches the advisory lock.
  perform pg_sleep(0.5);

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
SQL

echo '################ TEST 11: different users racing for the last slot ################'
docker exec founder-p0-pg psql -U postgres -tA -c "delete from public.user_roles where note='founder-launch';" >/dev/null
docker exec founder-p0-pg psql -U postgres -tA -c "insert into public.user_roles(user_id, role, note) select gen_random_uuid(), 'pro', 'founder-launch' from generate_series(1,999);" >/dev/null
docker exec founder-p0-pg psql -U postgres -tA -c "select test.mkuser('user11x@example.com');" > /tmp/u11x.txt
docker exec founder-p0-pg psql -U postgres -tA -c "select test.mkuser('user11y@example.com');" > /tmp/u11y.txt
UX=$(cat /tmp/u11x.txt)
UY=$(cat /tmp/u11y.txt)
DX=$(docker exec founder-p0-pg psql -U postgres -tA -c "select test.mkdevice('${UX}'::uuid, 'fp-11x');")
DY=$(docker exec founder-p0-pg psql -U postgres -tA -c "select test.mkdevice('${UY}'::uuid, 'fp-11y');")
docker exec founder-p0-pg psql -U postgres -tA -c "insert into public.fitness_metrics(user_id, device_id) values ('${UX}'::uuid, '${DX}'::uuid);" >/dev/null
docker exec founder-p0-pg psql -U postgres -tA -c "insert into public.fitness_metrics(user_id, device_id) values ('${UY}'::uuid, '${DY}'::uuid);" >/dev/null

docker exec founder-p0-pg psql -U postgres -tA \
  -c "set role authenticated; set request.jwt.claim.sub = '${UX}'; select public.record_first_sync_transition('fp-11x','success','android','1.0');" \
  > /tmp/race11_x.out 2>&1 &
PID_X=$!
docker exec founder-p0-pg psql -U postgres -tA \
  -c "set role authenticated; set request.jwt.claim.sub = '${UY}'; select public.record_first_sync_transition('fp-11y','success','android','1.0');" \
  > /tmp/race11_y.out 2>&1 &
PID_Y=$!
wait $PID_X
wait $PID_Y
echo "--- result X ---"; cat /tmp/race11_x.out
echo "--- result Y ---"; cat /tmp/race11_y.out
echo "--- final founder-launch count (must be 1000, never 1001) ---"
docker exec founder-p0-pg psql -U postgres -tA -c "select count(distinct user_id) from public.user_roles where note='founder-launch';"

echo '################ TEST 15: SAME user racing on two devices (must never both see capReached) ################'
docker exec founder-p0-pg psql -U postgres -tA -c "delete from public.user_roles where note='founder-launch';" >/dev/null
docker exec founder-p0-pg psql -U postgres -tA -c "insert into public.user_roles(user_id, role, note) select gen_random_uuid(), 'pro', 'founder-launch' from generate_series(1,999);" >/dev/null
docker exec founder-p0-pg psql -U postgres -tA -c "select test.mkuser('user15@example.com');" > /tmp/u15.txt
U15=$(cat /tmp/u15.txt)
D15A=$(docker exec founder-p0-pg psql -U postgres -tA -c "select test.mkdevice('${U15}'::uuid, 'fp-15a');")
D15B=$(docker exec founder-p0-pg psql -U postgres -tA -c "select test.mkdevice('${U15}'::uuid, 'fp-15b');")
docker exec founder-p0-pg psql -U postgres -tA -c "insert into public.fitness_metrics(user_id, device_id) values ('${U15}'::uuid, '${D15A}'::uuid);" >/dev/null
docker exec founder-p0-pg psql -U postgres -tA -c "insert into public.fitness_metrics(user_id, device_id) values ('${U15}'::uuid, '${D15B}'::uuid);" >/dev/null

docker exec founder-p0-pg psql -U postgres -tA \
  -c "set role authenticated; set request.jwt.claim.sub = '${U15}'; select public.record_first_sync_transition('fp-15a','success','android','1.0');" \
  > /tmp/race15_a.out 2>&1 &
PID_A=$!
docker exec founder-p0-pg psql -U postgres -tA \
  -c "set role authenticated; set request.jwt.claim.sub = '${U15}'; select public.record_first_sync_transition('fp-15b','success','android','1.0');" \
  > /tmp/race15_b.out 2>&1 &
PID_B=$!
wait $PID_A
wait $PID_B
echo "--- result A (device 1) ---"; cat /tmp/race15_a.out
echo "--- result B (device 2) ---"; cat /tmp/race15_b.out
echo "--- final pro-role rows for this user (must be exactly 1) ---"
docker exec founder-p0-pg psql -U postgres -tA -c "select count(*) from public.user_roles where user_id='${U15}'::uuid and role='pro';"
