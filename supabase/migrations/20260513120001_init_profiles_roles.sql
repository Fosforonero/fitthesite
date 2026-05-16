-- ─────────────────────────────────────────────────────────
-- Migration 001 — Profiles + Roles + helper functions
-- Vedi docs/architecture/04-database-schema-proposal.md
--      docs/architecture/05-rls-security-model.md
-- ─────────────────────────────────────────────────────────

-- Extensions necessarie (gen_random_uuid, ecc.)
create extension if not exists pgcrypto;

-- ─── profiles: 1:1 con auth.users ──────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  locale text not null default 'it',
  time_zone text not null default 'Europe/Rome',
  privacy_accepted_at timestamptz,
  terms_accepted_at timestamptz,
  not_medical_disclaimer_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'User profile, 1:1 with auth.users. Created automatically by handle_new_user trigger.';

-- Trigger updated_at automatico
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger handle_new_user: quando auth.users INSERT, crea profiles row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── user_roles: separato da profiles per principle of least privilege ───
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'admin', 'caregiver', 'support', 'dev', 'pro')),
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id),
  note text,
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles (role);

comment on table public.user_roles is
  'Role assignments. PK composta permette multi-role per user. Default user has NO row (è il fallback).';

-- ─── Helper functions (SECURITY DEFINER per essere chiamate dalle RLS) ───
create or replace function public.has_role(check_role text)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists(
    select 1 from public.user_roles
    where user_id = auth.uid() and role = check_role
  );
$$;

grant execute on function public.has_role(text) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select public.has_role('admin');
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.is_caregiver()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select public.has_role('caregiver');
$$;

grant execute on function public.is_caregiver() to authenticated;

-- ─── RLS profiles ──────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "users select own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin select all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- ─── RLS user_roles ────────────────────────────────────────
alter table public.user_roles enable row level security;

create policy "users select own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create policy "admin select all roles"
  on public.user_roles for select
  to authenticated
  using (public.is_admin());

create policy "admin manage roles"
  on public.user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
