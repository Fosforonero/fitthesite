-- Schema minimo di supporto per verificare le migration Founder REALI (non
-- riscritte) su supabase/postgres reale (auth.users/auth.uid()/ruoli/owner
-- veri - non uno stub). NON un replay completo delle 45 migration del repo:
-- known-issues.md (gia' documentato dall'agente app) segnala 2 bug
-- pre-esistenti indipendenti che bloccano un replay letterale da zero.
-- Qui si crea solo il supporto minimo (auth.users e' gia' reale, fornito
-- dall'immagine) sopra cui le migration Founder VERE (supabase/migrations/
-- 20260720055513_*, 20260714112434_*, 20260714123833_*, 20260714123911_*,
-- 20260715095915_*, 20260715183049_*, 20260720140000_*) si applicano cosi'
-- come sono nel repo, senza alcuna riscrittura.
set role postgres;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_fingerprint text not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  app_version text,
  os_version text
);

create table public.fitness_metrics (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  received_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  granted_at timestamptz not null default now(),
  granted_by uuid,
  note text,
  expires_at timestamptz,
  primary key (user_id, role)
);

create table public.b2c_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  billing_source text not null
);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.profiles, public.devices, public.fitness_metrics, public.user_roles, public.b2c_subscriptions to authenticated, service_role;
grant select on public.profiles, public.devices, public.fitness_metrics, public.user_roles to anon;

-- Riproduce 1:1 la logica reale di public.gdpr_process_deletions() (migration
-- 20260616090000_gdpr_deletion_execution.sql, gia' live, fuori scope Founder -
-- non riscritta qui, solo replicata per il test): "delete from profiles; delete
-- from auth.users" per utente. Necessaria per il test Sprint P0.7 Fase 3.4
-- "cancellazione tramite gdpr_process_deletions()".
create or replace function public.gdpr_process_deletions_test(uid uuid)
returns void
language plpgsql
security definer
set search_path to pg_catalog, public
as $$
begin
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;
