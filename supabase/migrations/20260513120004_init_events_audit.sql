-- ─────────────────────────────────────────────────────────
-- Migration 004 — sync_events + audit_logs + admin_events
-- Vedi docs/architecture/04 (schema) + 05 (RLS) + 08 (privacy).
-- ─────────────────────────────────────────────────────────

-- ─── sync_events: diagnostica tecnica (no health data) ─────
create table public.sync_events (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  event_type text not null check (event_type in (
    'sync_ok', 'sync_failed', 'pairing_init', 'pairing_success', 'pairing_failed',
    'permission_denied', 'no_data', 'auth_failed', 'unpair'
  )),
  error_code text,
  error_message text,
  app_version text,
  os_version text,
  network_type text,
  created_at timestamptz not null default now()
);

create index sync_events_device_created_idx
  on public.sync_events (device_id, created_at desc);
create index sync_events_user_created_idx
  on public.sync_events (user_id, created_at desc);
-- Indice su event_type+created_at. Non possiamo usare partial index con
-- `where created_at > now() - interval '30 days'` perché `now()` non è
-- IMMUTABLE (Postgres rifiuta con errore 42P17). L'indice full-table è
-- accettabile dato che la tabella ha retention 90 giorni.
create index sync_events_type_idx
  on public.sync_events (event_type, created_at desc);

comment on table public.sync_events is
  'Eventi tecnici diagnosticabili. NO health data, NO PII oltre user_id/device_id.';

-- ─── audit_logs: user actions sensibili ────────────────────
create table public.audit_logs (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  detail jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_user_created_idx
  on public.audit_logs (user_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs (action);

comment on table public.audit_logs is
  'User actions sensibili (login, consent change, delete, ecc.). Retention 5 anni.';

-- ─── admin_events: azioni admin (separate da audit_logs) ───
create table public.admin_events (
  id bigserial primary key,
  admin_id uuid not null references public.profiles(id) on delete set null,
  action text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_device_id uuid references public.devices(id) on delete set null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index admin_events_admin_idx on public.admin_events (admin_id, created_at desc);
create index admin_events_target_user_idx on public.admin_events (target_user_id, created_at desc);

comment on table public.admin_events is
  'Azioni admin tracciate per trasparenza. Retention 5 anni.';

-- ─── RLS sync_events ──────────────────────────────────────
alter table public.sync_events enable row level security;

create policy "users select own sync events"
  on public.sync_events for select
  to authenticated
  using (user_id = auth.uid());

create policy "admin select all sync events"
  on public.sync_events for select
  to authenticated
  using (public.is_admin());

-- INSERT: solo via service_role.

-- ─── RLS audit_logs ───────────────────────────────────────
alter table public.audit_logs enable row level security;

create policy "users select own audit"
  on public.audit_logs for select
  to authenticated
  using (user_id = auth.uid());

create policy "admin select all audit"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- INSERT: solo via service_role.

-- ─── RLS admin_events ─────────────────────────────────────
alter table public.admin_events enable row level security;

create policy "admin select admin events"
  on public.admin_events for select
  to authenticated
  using (public.is_admin());

-- L'utente subject vede gli admin events che lo riguardano (trasparenza)
create policy "subject sees admin actions on self"
  on public.admin_events for select
  to authenticated
  using (target_user_id = auth.uid());
