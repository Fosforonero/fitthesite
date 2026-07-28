\set ON_ERROR_STOP off
set role postgres;

-- Sprint P0.10A — nessun utente puo' autoassegnarsi Founder tramite RPC
-- diretta. private.grant_founder_launch_core / private.founder_seats /
-- private.founder_evaluations devono restare irraggiungibili da
-- anon/authenticated/service_role — l'unico entry point e'
-- record_first_sync_transition. Adattato da Sprint P0.7 (tools/founder-p0-
-- reconciliation/30-acl-tests.sql), rimosso il blocco su
-- public._founder_integrity_counts() (non portato in questo giro).

do $$
declare
  v_user uuid;
  v_device uuid;
begin
  v_user := test.mkuser('aclacl@example.com', now() - interval '1 day');
  v_device := test.mkdevice(v_user, 'fp-acl');

  begin
    set role anon;
    perform private.grant_founder_launch_core(v_user, v_device);
    raise exception 'ASSERT ACL grant_founder_launch_core da anon: FAIL - doveva fallire';
  exception
    when insufficient_privilege then
      raise notice 'ASSERT ACL grant_founder_launch_core da anon: PASS (negato)';
  end;
  reset role;

  begin
    set role authenticated;
    perform private.grant_founder_launch_core(v_user, v_device);
    raise exception 'ASSERT ACL grant_founder_launch_core da authenticated: FAIL - doveva fallire';
  exception
    when insufficient_privilege then
      raise notice 'ASSERT ACL grant_founder_launch_core da authenticated: PASS (negato)';
  end;
  reset role;

  begin
    set role service_role;
    perform private.grant_founder_launch_core(v_user, v_device);
    raise exception 'ASSERT ACL grant_founder_launch_core da service_role: FAIL - doveva fallire';
  exception
    when insufficient_privilege then
      raise notice 'ASSERT ACL grant_founder_launch_core da service_role: PASS (negato, nessun ruolo pubblico puo'' chiamarla)';
  end;
  reset role;

  begin
    set role anon;
    perform 1 from private.founder_seats limit 1;
    raise exception 'ASSERT ACL SELECT diretto founder_seats da anon: FAIL - doveva fallire';
  exception
    when insufficient_privilege then
      raise notice 'ASSERT ACL SELECT diretto founder_seats da anon: PASS (negato)';
  end;
  reset role;

  begin
    set role authenticated;
    perform 1 from private.founder_evaluations limit 1;
    raise exception 'ASSERT ACL SELECT diretto founder_evaluations da authenticated: FAIL - doveva fallire';
  exception
    when insufficient_privilege then
      raise notice 'ASSERT ACL SELECT diretto founder_evaluations da authenticated: PASS (negato)';
  end;
  reset role;
end $$;

-- record_first_sync_transition (l'entry point reale) resta chiamabile da
-- authenticated con auth.uid() valido - invariato da 20260720055513.
do $$
declare
  v_user uuid;
  v_device uuid;
  v_result jsonb;
begin
  v_user := test.mkuser('e2e@example.com', now() - interval '1 day');
  v_device := test.mkdevice(v_user, 'fp-e2e');
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  set role authenticated;
  perform set_config('request.jwt.claim.sub', v_user::text, true);
  v_result := public.record_first_sync_transition('fp-e2e', 'success', 'android', '3.9.9+189');
  reset role;

  if (v_result->>'transitionAccepted')::boolean = true and (v_result->>'grantCreated')::boolean = true then
    raise notice 'ASSERT E2E record_first_sync_transition (authenticated, auth.uid() reale) -> grant_founder_launch_core -> granted: PASS - %', v_result;
  else
    raise exception 'ASSERT E2E: FAIL - %', v_result;
  end if;

  if exists (select 1 from private.founder_seats where user_id = v_user) then
    raise notice 'ASSERT E2E (seat scritto attraverso il percorso pubblico reale): PASS';
  else
    raise exception 'ASSERT E2E: FAIL - nessun seat scritto';
  end if;
end $$;

do $$
begin
  begin
    set role anon;
    perform public.record_first_sync_transition('fp-x', 'success', 'android', null);
    raise exception 'ASSERT ACL record_first_sync_transition da anon: FAIL - doveva fallire';
  exception
    when insufficient_privilege then
      raise notice 'ASSERT ACL record_first_sync_transition da anon: PASS (negato, invariato da 20260714123833)';
  end;
  reset role;
end $$;

select 'ACL_TESTS_OK' as result;
