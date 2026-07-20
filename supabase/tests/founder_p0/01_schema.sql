-- Disposable local fixture: minimal schema replicating prod shape + a
-- faithful stub of Supabase's auth.uid()/role plumbing, so RPC-privilege
-- and auth.uid() ownership checks behave exactly as they would under
-- PostgREST (which sets request.jwt.claim.sub + role per request).

create schema if not exists auth;
create schema if not exists private;

create table auth.users (
  id uuid primary key,
  email text
);

-- Faithful to Supabase's real definition: reads the per-request JWT claim.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id),
  email text
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  device_fingerprint text not null,
  revoked_at timestamptz,
  first_sync_state text,
  first_sync_state_updated_at timestamptz,
  first_sync_at timestamptz,
  first_sync_platform text,
  first_sync_app_version text
);

create table public.fitness_metrics (
  id bigserial primary key,
  user_id uuid not null,
  device_id uuid not null
);

create table public.user_roles (
  user_id uuid not null,
  role text not null,
  granted_at timestamptz not null default now(),
  granted_by uuid,
  note text,
  expires_at timestamptz,
  primary key (user_id, role)
);

grant select, insert, update, delete on public.profiles, public.devices, public.fitness_metrics, public.user_roles to anon, authenticated;

-- extension for gen_random_uuid()
create extension if not exists pgcrypto;
