-- Sequential scenario suite (contract v4: transitionAccepted /
-- transitionRecordedNow / effectiveState). Autocommit, real commits
-- (idempotency/cap tests need real persisted state across calls).
-- test.assert() raises NOTICE 'PASS' or EXCEPTION 'FAIL' — grep both.
-- (psql :'var' substitution does not reach inside DO $$ bodies, so all
-- assertions go through test.assert() as plain top-level statements.)
--
-- Numbering matches the report: 1-10, 13, 14, 16, 17 here; 11 and 15 are
-- concurrency races (04_concurrency.sh / 06_concurrency_same_user.sh); 12
-- is the simulated-failure-rollback test (05_test12_and_restore.sql).

\set ON_ERROR_STOP 0
\pset pager off

create schema if not exists test;

create or replace function test.assert(cond boolean, msg text) returns void
language plpgsql as $$
begin
  if cond then
    raise notice 'PASS: %', msg;
  else
    raise exception 'FAIL: %', msg;
  end if;
end $$;

create or replace function test.mkuser(p_email text) returns uuid
language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users(id, email) values (v_id, p_email);
  insert into public.profiles(id, email) values (v_id, p_email);
  return v_id;
end $$;

create or replace function test.mkdevice(p_user uuid, p_fp text, p_revoked boolean default false) returns uuid
language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into public.devices(id, user_id, device_fingerprint, revoked_at)
  values (v_id, p_user, p_fp, case when p_revoked then now() else null end);
  return v_id;
end $$;

\echo '=== TEST 1: anonymous call rejected ==='
set role anon;
reset request.jwt.claim.sub;
do $$
begin
  begin
    perform public.record_first_sync_transition('nope', 'success', 'android', '1.0');
    raise exception 'FAIL: TEST 1 anon call should have been permission-denied';
  exception when insufficient_privilege then
    raise notice 'PASS: TEST 1 anon rejected (insufficient_privilege)';
  end;
end $$;
reset role;

\echo '=== TEST 2: authenticated call without metrics -> not accepted, retryable ==='
select test.mkuser('user2@example.com') as u2 \gset
select test.mkdevice(:'u2'::uuid, 'fp-2') as d2 \gset
set role authenticated;
set request.jwt.claim.sub = :'u2';
select public.record_first_sync_transition('fp-2', 'success', 'android', '1.0') as result2 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result2'::jsonb->>'transitionAccepted')::boolean is false, 'TEST 2 transitionAccepted=false without evidence (P0.3): ' || :'result2');
select test.assert((:'result2'::jsonb->>'transitionRecordedNow')::boolean is false, 'TEST 2 transitionRecordedNow=false: ' || :'result2');
select test.assert((:'result2'::jsonb->>'notEligibleReason') = 'no_metrics_evidence', 'TEST 2 no_metrics_evidence: ' || :'result2');
select test.assert((select first_sync_state from public.devices where device_fingerprint='fp-2') is null, 'TEST 2 device state stays NULL, not stranded terminal');

\echo '=== TEST 3: cross-user device rejected ==='
select test.mkuser('userA@example.com') as ua \gset
select test.mkuser('userB@example.com') as ub \gset
select test.mkdevice(:'ua'::uuid, 'fp-a') as da \gset
set role authenticated;
set request.jwt.claim.sub = :'ub';
select public.record_first_sync_transition('fp-a', 'success', 'android', '1.0') as result3 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result3'::jsonb->>'transitionAccepted')::boolean is false, 'TEST 3 cross-user device not accepted: ' || :'result3');
select test.assert((:'result3'::jsonb->>'effectiveState') is null, 'TEST 3 effectiveState null (device unresolvable): ' || :'result3');
select test.assert(not (:'result3'::jsonb ? 'grantCreated'), 'TEST 3 grant path must not run: ' || :'result3');
select test.assert(not exists (select 1 from public.devices where device_fingerprint='fp-a' and first_sync_state is not null), 'TEST 3 device fp-a state untouched');

\echo '=== TEST 4: revoked device rejected ==='
select test.mkuser('userC@example.com') as uc \gset
select test.mkdevice(:'uc'::uuid, 'fp-c', true) as dc \gset
set role authenticated;
set request.jwt.claim.sub = :'uc';
select public.record_first_sync_transition('fp-c', 'success', 'android', '1.0') as result4 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result4'::jsonb->>'transitionAccepted')::boolean is false, 'TEST 4 revoked device not accepted: ' || :'result4');

\echo '=== TEST 5: device with a real metric grants once ==='
select test.mkuser('user5@example.com') as u5 \gset
select test.mkdevice(:'u5'::uuid, 'fp-5') as d5 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u5'::uuid, :'d5'::uuid);
set role authenticated;
set request.jwt.claim.sub = :'u5';
select public.record_first_sync_transition('fp-5', 'success', 'android', '1.0') as result5 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result5'::jsonb->>'transitionAccepted')::boolean is true and (:'result5'::jsonb->>'transitionRecordedNow')::boolean is true and (:'result5'::jsonb->>'effectiveState') = 'success', 'TEST 5 transition accepted+recorded now, effectiveState=success: ' || :'result5');
select test.assert((:'result5'::jsonb->>'grantCreated')::boolean is true and (:'result5'::jsonb->>'grantKind') = 'founder-launch', 'TEST 5 grantCreated founder-launch: ' || :'result5');
select test.assert((select count(*) from public.user_roles where user_id = :'u5'::uuid and role='pro') = 1, 'TEST 5 exactly one pro row');

\echo '=== TEST 6: duplicate sync is idempotent, effectiveState still reported ==='
set role authenticated;
set request.jwt.claim.sub = :'u5';
select public.record_first_sync_transition('fp-5', 'success', 'android', '1.0') as result6 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result6'::jsonb->>'transitionRecordedNow')::boolean is false and (:'result6'::jsonb->>'effectiveState') = 'success', 'TEST 6 repeat call: no new write, effectiveState still success: ' || :'result6');
select test.assert((:'result6'::jsonb->>'alreadyHadEligibleGrant')::boolean is true, 'TEST 6 repeat call still reports alreadyHadEligibleGrant: ' || :'result6');
select test.assert((select count(*) from public.user_roles where user_id = :'u5'::uuid and role='pro') = 1, 'TEST 6 still exactly one pro row after duplicate');

\echo '=== TEST 7: existing Founder (founder-launch) unchanged ==='
select test.mkuser('user7@example.com') as u7 \gset
select test.mkdevice(:'u7'::uuid, 'fp-7') as d7 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u7'::uuid, :'d7'::uuid);
insert into public.user_roles(user_id, role, note, granted_at) values (:'u7'::uuid, 'pro', 'founder-launch', '2026-01-01T00:00:00Z');
set role authenticated;
set request.jwt.claim.sub = :'u7';
select public.record_first_sync_transition('fp-7', 'success', 'android', '1.0') as result7 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result7'::jsonb->>'transitionAccepted')::boolean is true and (:'result7'::jsonb->>'effectiveState') = 'success', 'TEST 7 transition still accepted for new device: ' || :'result7');
select test.assert((:'result7'::jsonb->>'grantCreated')::boolean is false and (:'result7'::jsonb->>'alreadyHadEligibleGrant')::boolean is true, 'TEST 7 alreadyHadEligibleGrant, no new grant: ' || :'result7');
select test.assert((select granted_at from public.user_roles where user_id = :'u7'::uuid and role='pro') = '2026-01-01T00:00:00Z'::timestamptz, 'TEST 7 existing grant row untouched');

\echo '=== TEST 8: existing grandfather/Pro account, no duplicate role ==='
select test.mkuser('user8@example.com') as u8 \gset
select test.mkdevice(:'u8'::uuid, 'fp-8') as d8 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u8'::uuid, :'d8'::uuid);
insert into public.user_roles(user_id, role, note, granted_at) values (:'u8'::uuid, 'pro', 'grandfather-prelaunch', '2026-01-01T00:00:00Z');
set role authenticated;
set request.jwt.claim.sub = :'u8';
select public.record_first_sync_transition('fp-8', 'success', 'android', '1.0') as result8 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result8'::jsonb->>'grantCreated')::boolean is false and (:'result8'::jsonb->>'alreadyHadEligibleGrant')::boolean is true, 'TEST 8 grandfather already-pro recognized: ' || :'result8');
select test.assert((select count(*) from public.user_roles where user_id = :'u8'::uuid) = 1, 'TEST 8 no duplicate role row');

\echo '=== TEST 9: QA/demo/.invalid excluded, but transition itself still accepted ==='
select test.mkuser('qa-build189@fitmesh.fit.invalid') as u9a \gset
select test.mkdevice(:'u9a'::uuid, 'fp-9a') as d9a \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u9a'::uuid, :'d9a'::uuid);
select test.mkuser('appreview.demo@fitmesh.fit') as u9b \gset
select test.mkdevice(:'u9b'::uuid, 'fp-9b') as d9b \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u9b'::uuid, :'d9b'::uuid);
set role authenticated;
set request.jwt.claim.sub = :'u9a';
select public.record_first_sync_transition('fp-9a', 'success', 'android', '1.0') as result9a \gset
reset role;
reset request.jwt.claim.sub;
set role authenticated;
set request.jwt.claim.sub = :'u9b';
select public.record_first_sync_transition('fp-9b', 'success', 'android', '1.0') as result9b \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result9a'::jsonb->>'transitionAccepted')::boolean is true and (:'result9a'::jsonb->>'notEligibleReason') = 'excluded_account', 'TEST 9 .invalid: transition accepted, grant excluded: ' || :'result9a');
select test.assert((:'result9b'::jsonb->>'transitionAccepted')::boolean is true and (:'result9b'::jsonb->>'notEligibleReason') = 'excluded_account', 'TEST 9 appreview demo: transition accepted, grant excluded: ' || :'result9b');

\echo '=== TEST 10: cap reached prevents grant, transition still accepted ==='
delete from public.user_roles where note = 'founder-launch';
insert into public.user_roles(user_id, role, note)
select gen_random_uuid(), 'pro', 'founder-launch' from generate_series(1,1000);
select test.mkuser('user10@example.com') as u10 \gset
select test.mkdevice(:'u10'::uuid, 'fp-10') as d10 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u10'::uuid, :'d10'::uuid);
set role authenticated;
set request.jwt.claim.sub = :'u10';
select public.record_first_sync_transition('fp-10', 'success', 'android', '1.0') as result10 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result10'::jsonb->>'transitionAccepted')::boolean is true and (:'result10'::jsonb->>'capReached')::boolean is true and (:'result10'::jsonb->>'grantCreated')::boolean is false, 'TEST 10 cap reached, no grant, transition still accepted: ' || :'result10');

-- TEST 10 left the cap at exactly 1000; reset so 13/14/16/17 exercise
-- their own logic instead of tripping cap_reached.
delete from public.user_roles where note = 'founder-launch';

\echo '=== TEST 13 (P0.3): success without metrics stays NULL, then metrics arrive, retry succeeds ==='
select test.mkuser('user13@example.com') as u13 \gset
select test.mkdevice(:'u13'::uuid, 'fp-13') as d13 \gset
set role authenticated;
set request.jwt.claim.sub = :'u13';
select public.record_first_sync_transition('fp-13', 'success', 'android', '1.0') as result13a \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result13a'::jsonb->>'transitionAccepted')::boolean is false, 'TEST 13a no evidence yet, not accepted: ' || :'result13a');
select test.assert((select first_sync_state from public.devices where device_fingerprint='fp-13') is null, 'TEST 13a device state still NULL');

insert into public.fitness_metrics(user_id, device_id) values (:'u13'::uuid, :'d13'::uuid);

set role authenticated;
set request.jwt.claim.sub = :'u13';
select public.record_first_sync_transition('fp-13', 'success', 'android', '1.0') as result13b \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result13b'::jsonb->>'transitionAccepted')::boolean is true and (:'result13b'::jsonb->>'grantCreated')::boolean is true, 'TEST 13b retry after metrics arrive transitions and grants: ' || :'result13b');

\echo '=== TEST 14 (P0.4): NULL platform never blocks transition or grant ==='
select test.mkuser('user14@example.com') as u14 \gset
select test.mkdevice(:'u14'::uuid, 'fp-14') as d14 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u14'::uuid, :'d14'::uuid);
set role authenticated;
set request.jwt.claim.sub = :'u14';
select public.record_first_sync_transition('fp-14', 'success', NULL, NULL) as result14 \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result14'::jsonb->>'transitionAccepted')::boolean is true and (:'result14'::jsonb->>'grantCreated')::boolean is true, 'TEST 14 NULL platform still transitions and grants: ' || :'result14');
select test.assert((select first_sync_platform from public.devices where device_fingerprint='fp-14') is null, 'TEST 14 first_sync_platform stored as NULL, telemetry-only');

\echo '=== TEST 16: p_device_fingerprint length/emptiness guard ==='
select test.mkuser('user16@example.com') as u16 \gset
set role authenticated;
set request.jwt.claim.sub = :'u16';
do $$
begin
  begin
    perform public.record_first_sync_transition(repeat('x', 201), 'success', 'android', '1.0');
    raise exception 'FAIL: TEST 16a expected rejection of a 201-char fingerprint';
  exception when others then
    if sqlerrm like 'record_first_sync_transition: invalid p_device_fingerprint%' then
      raise notice 'PASS: TEST 16a overlong fingerprint rejected';
    else
      raise exception 'FAIL: TEST 16a unexpected error: %', sqlerrm;
    end if;
  end;
  begin
    perform public.record_first_sync_transition('', 'success', 'android', '1.0');
    raise exception 'FAIL: TEST 16b expected rejection of an empty fingerprint';
  exception when others then
    if sqlerrm like 'record_first_sync_transition: invalid p_device_fingerprint%' then
      raise notice 'PASS: TEST 16b empty fingerprint rejected';
    else
      raise exception 'FAIL: TEST 16b unexpected error: %', sqlerrm;
    end if;
  end;
end $$;
reset role;
reset request.jwt.claim.sub;

\echo '=== TEST 17: effectiveState reflects true server state, not the requested one ==='
select test.mkuser('user17@example.com') as u17 \gset
select test.mkdevice(:'u17'::uuid, 'fp-17') as d17 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u17'::uuid, :'d17'::uuid);
set role authenticated;
set request.jwt.claim.sub = :'u17';
select public.record_first_sync_transition('fp-17', 'success', 'android', '1.0') as result17a \gset
-- Un secondo tentativo con uno stato DIVERSO da 'success' su un device gia'
-- terminale: transitionAccepted=true (il device e' valido), ma
-- effectiveState deve restare 'success' (verita' del server), MAI
-- 'read_error' (quello che questa chiamata ha richiesto).
select public.record_first_sync_transition('fp-17', 'read_error', 'android', '1.0') as result17b \gset
reset role;
reset request.jwt.claim.sub;
select test.assert((:'result17b'::jsonb->>'transitionAccepted')::boolean is true and (:'result17b'::jsonb->>'transitionRecordedNow')::boolean is false, 'TEST 17 accepted but not recorded now (already terminal): ' || :'result17b');
select test.assert((:'result17b'::jsonb->>'effectiveState') = 'success', 'TEST 17 effectiveState=success (server truth), never read_error: ' || :'result17b');
select test.assert((select first_sync_state from public.devices where device_fingerprint='fp-17') = 'success', 'TEST 17 stored state never regresses to read_error');

\echo '=== TEST 11 / 15: concurrency races driven from shell wrappers ==='
delete from public.user_roles where note = 'founder-launch';
