-- ─────────────────────────────────────────────────────────
-- Migration 002 — Devices + Pairing codes
-- Vedi docs/architecture/06-device-pairing-flow.md
-- ─────────────────────────────────────────────────────────

-- ─── devices ──────────────────────────────────────────────
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_fingerprint text not null,
  device_name text,
  device_brand text,
  source_type text not null check (source_type in (
    'health_connect', 'samsung_health', 'apple_health', 'manual'
  )),
  app_version text,
  os_version text,
  paired_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id),
  revoked_reason text
);

create unique index devices_fingerprint_active_uniq
  on public.devices (device_fingerprint)
  where revoked_at is null;

create index devices_user_id_idx on public.devices (user_id);
create index devices_active_idx on public.devices (user_id) where revoked_at is null;

comment on table public.devices is 'Pairing 1 user → N devices. Un device fingerprint ATTIVO è unico.';

-- ─── device_pairing_codes ──────────────────────────────────
create table public.device_pairing_codes (
  code text primary key check (code ~ '^\d{6}$'),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  claimed_at timestamptz,
  claimed_by_fingerprint text,
  attempts int not null default 0
);

create index pairing_codes_user_id_idx on public.device_pairing_codes (user_id);
create index pairing_codes_pending_idx
  on public.device_pairing_codes (user_id)
  where claimed_at is null;

comment on table public.device_pairing_codes is
  'One-shot 6-digit codes per associare device a user. Scadono in 5 min.';

-- ─── RPC atomico per incrementare attempts (anti brute-force) ───
create or replace function public.increment_pairing_attempts(p_code text)
returns int
language sql
security definer
set search_path = public
as $$
  update public.device_pairing_codes
  set attempts = attempts + 1
  where code = p_code
  returning attempts;
$$;

revoke all on function public.increment_pairing_attempts(text) from public, authenticated;
-- Solo service_role può chiamarla (dall'Edge Function pair-device).

-- ─── RLS devices ──────────────────────────────────────────
alter table public.devices enable row level security;

create policy "users select own devices"
  on public.devices for select
  to authenticated
  using (user_id = auth.uid());

-- L'utente può revocare (UPDATE) il proprio device. Solo revoked_at è modificabile.
create policy "users revoke own devices"
  on public.devices for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "admin select all devices"
  on public.devices for select
  to authenticated
  using (public.is_admin());

create policy "admin revoke any device"
  on public.devices for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- INSERT: solo via service_role (Edge Function pair-device).

-- ─── RLS device_pairing_codes ─────────────────────────────
alter table public.device_pairing_codes enable row level security;

create policy "users select own pairing codes"
  on public.device_pairing_codes for select
  to authenticated
  using (user_id = auth.uid());

create policy "users create pairing codes"
  on public.device_pairing_codes for insert
  to authenticated
  with check (user_id = auth.uid());

-- UPDATE (claim): solo Edge Function via service_role.
-- DELETE: solo pg_cron via service_role.
