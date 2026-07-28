\set ON_ERROR_STOP on
-- Connesso come supabase_admin (superuser sull'immagine ufficiale): su
-- questo tag immagine `postgres` non e' membro di `supabase_auth_admin`
-- (vedi run-suite.sh), quindi non potrebbe eseguire `set role
-- supabase_auth_admin` nei blocchi sotto. Un superuser puo' SET ROLE verso
-- qualunque ruolo per definizione — nessun `set role postgres` qui.

-- Sprint P0.10A — cancellazione con il ruolo Auth REALE (supabase_auth_admin,
-- lo stesso ruolo che GoTrue usa per auth.admin.deleteUser()), non solo un
-- flusso applicativo interno. Adattato da Sprint P0.7
-- (tools/founder-p0-reconciliation/20-gdpr-tests.sql), invariato nella logica.

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
  v_seat_before record; v_seat_after record;
  v_taken_before int; v_taken_after int;
begin
  v_user := test.mkuser('gdpr1@example.com', now() - interval '1 day');
  v_device := test.mkdevice(v_user, 'fp-gdpr1', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'grantCreated')::boolean is not true then
    raise exception 'setup GDPR (supabase_auth_admin) fallito: %', v_result;
  end if;

  select * into v_seat_before from private.founder_seats where user_id = v_user;
  select count(*) into v_taken_before from private.founder_seats;

  set role supabase_auth_admin;
  delete from auth.users where id = v_user;
  reset role;

  select * into v_seat_after from private.founder_seats where founder_number = v_seat_before.founder_number;

  if v_seat_after.founder_number is null then
    raise exception 'ASSERT GDPR (supabase_auth_admin): FAIL - la riga founder_seats e'' sparita';
  end if;
  if v_seat_after.user_id is null and v_seat_after.registered_at is null
     and v_seat_after.first_sync_evidence_at is null and v_seat_after.anonymized_at is not null
  then
    raise notice 'ASSERT GDPR via supabase_auth_admin (anonimizzazione completa): PASS';
  else
    raise exception 'ASSERT GDPR (supabase_auth_admin): FAIL - user_id=%, registered_at=%, first_sync=%, anonymized_at=%',
      v_seat_after.user_id, v_seat_after.registered_at, v_seat_after.first_sync_evidence_at, v_seat_after.anonymized_at;
  end if;
  if v_seat_after.founder_number = v_seat_before.founder_number and v_seat_after.source = v_seat_before.source then
    raise notice 'ASSERT GDPR (metadata posto preservati): PASS';
  else
    raise exception 'ASSERT GDPR: FAIL - metadata alterati';
  end if;

  select count(*) into v_taken_after from private.founder_seats;
  if v_taken_after = v_taken_before then
    raise notice 'ASSERT GDPR (conteggio posti non diminuisce): PASS';
  else
    raise exception 'ASSERT GDPR: FAIL - taken_before=%, taken_after=%', v_taken_before, v_taken_after;
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
  v_seat_before record; v_seat_after record;
begin
  -- Stesso test ma via public.gdpr_process_deletions_test() (replica 1:1 del
  -- flusso reale gia' live, migration 20260616090000, fuori scope Founder).
  v_user := test.mkuser('gdpr2@example.com', now() - interval '1 day');
  v_device := test.mkdevice(v_user, 'fp-gdpr2', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if (v_result->>'grantCreated')::boolean is not true then
    raise exception 'setup GDPR (gdpr_process_deletions) fallito: %', v_result;
  end if;

  select * into v_seat_before from private.founder_seats where user_id = v_user;

  perform public.gdpr_process_deletions_test(v_user);

  select * into v_seat_after from private.founder_seats where founder_number = v_seat_before.founder_number;
  if v_seat_after.user_id is null and v_seat_after.anonymized_at is not null then
    raise notice 'ASSERT GDPR via gdpr_process_deletions_test (nessuna eccezione, anonimizzato): PASS';
  else
    raise exception 'ASSERT GDPR (gdpr_process_deletions): FAIL';
  end if;
end $$;

do $$
declare
  v_user uuid; v_device uuid; v_result jsonb;
begin
  -- Utente not_eligible cancellato: founder_evaluations deve sparire
  -- (cascade), nessun posto in gioco, nessuna PII residua.
  v_user := test.mkuser('gdpr3@example.com', now() - interval '20 days');
  v_device := test.mkdevice(v_user, 'fp-gdpr3', now());
  insert into public.fitness_metrics (user_id, device_id) values (v_user, v_device);

  v_result := private.grant_founder_launch_core(v_user, v_device);
  if v_result->>'notEligibleReason' != 'window_expired' then
    raise exception 'setup fallito: %', v_result;
  end if;

  set role supabase_auth_admin;
  delete from auth.users where id = v_user;
  reset role;

  if not exists (select 1 from private.founder_evaluations where user_id = v_user) then
    raise notice 'ASSERT GDPR (founder_evaluations cascade-eliminata per not_eligible, nessuna PII residua): PASS';
  else
    raise exception 'ASSERT GDPR: FAIL - founder_evaluations non eliminata';
  end if;
end $$;

do $$
declare
  v_user uuid;
begin
  -- founder_grants: on delete set null (invariato). La riga storica
  -- (email, founder_number, notes) resta — allowlist curata a mano, non
  -- anonimizzata automaticamente (nessuna scrittura di questo file).
  v_user := test.mkuser('legacyfounder@example.com', now() - interval '400 days');
  insert into public.founder_grants (email, founder_number, applied_user_id, applied_at)
  values ('legacyfounder@example.com', 500, v_user, now());

  set role supabase_auth_admin;
  delete from auth.users where id = v_user;
  reset role;

  if exists (select 1 from public.founder_grants where email = 'legacyfounder@example.com' and applied_user_id is null and founder_number = 500) then
    raise notice 'ASSERT founder_grants legacy (on delete set null, riga/email storica preservata): PASS - comportamento invariato';
  else
    raise exception 'ASSERT founder_grants legacy: FAIL';
  end if;
end $$;

select 'GDPR_TESTS_OK' as result;
