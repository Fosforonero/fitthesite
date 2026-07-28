\set ON_ERROR_STOP on
set role postgres;

create schema if not exists test;

create or replace function test.mkuser(p_email text, p_created_at timestamptz default now())
returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, created_at) values (v_id, p_email, p_created_at);
  insert into public.profiles (id, email) values (v_id, p_email);
  return v_id;
end $$;

create or replace function test.mkdevice(p_user uuid, p_fp text, p_first_sync_at timestamptz default null)
returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into public.devices (user_id, device_fingerprint, first_sync_state, first_sync_at)
  values (p_user, p_fp, case when p_first_sync_at is not null then 'success' else null end, p_first_sync_at)
  returning id into v_id;
  return v_id;
end $$;
