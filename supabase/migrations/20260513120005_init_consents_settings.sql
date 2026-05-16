-- ─────────────────────────────────────────────────────────
-- Migration 005 — privacy_consents + user_settings + caregiver_links
-- + trigger anonimizzazione audit su delete profile.
-- Vedi docs/architecture/04 (schema) + 08 (GDPR) + 10 (deletion flow).
-- ─────────────────────────────────────────────────────────

-- ─── privacy_consents (GDPR granular) ──────────────────────
create table public.privacy_consents (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  -- Consensi opt-in (default false)
  marketing_emails boolean not null default false,
  analytics_anonymous boolean not null default false,
  caregiver_share boolean not null default false,
  -- GDPR right to access / erasure
  data_export_requested_at timestamptz,
  data_export_completed_at timestamptz,
  data_deletion_requested_at timestamptz,
  data_deletion_completed_at timestamptz,
  -- Metadata
  updated_at timestamptz not null default now()
);

create trigger trg_consents_updated_at
  before update on public.privacy_consents
  for each row execute function public.set_updated_at();

comment on table public.privacy_consents is
  'Consensi GDPR granulari. Default tutti false (opt-in esplicito).';

-- ─── user_settings (app-level preferences) ─────────────────
create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme_mode text default 'system' check (theme_mode in ('light', 'dark', 'system')),
  sync_interval_minutes int not null default 30 check (sync_interval_minutes >= 15),
  auto_sync_enabled boolean not null default true,
  notification_sync_failed boolean not null default true,
  hr_zones jsonb,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  updated_at timestamptz not null default now()
);

create trigger trg_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ─── caregiver_links (Phase 8) ─────────────────────────────
create table public.caregiver_links (
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  permissions text[] not null default array['view_dashboard']::text[],
  expires_at timestamptz,
  primary key (caregiver_id, subject_id),
  check (caregiver_id <> subject_id)
);

create index caregiver_links_subject_idx
  on public.caregiver_links (subject_id)
  where revoked_at is null;

comment on table public.caregiver_links is
  'Authorization links subject → caregiver. PK composta. Mai subject = caregiver.';

-- ─── RLS privacy_consents ─────────────────────────────────
alter table public.privacy_consents enable row level security;

create policy "users manage own consents"
  on public.privacy_consents for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── RLS user_settings ────────────────────────────────────
alter table public.user_settings enable row level security;

create policy "users manage own settings"
  on public.user_settings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── RLS caregiver_links ──────────────────────────────────
alter table public.caregiver_links enable row level security;

create policy "linked users select link"
  on public.caregiver_links for select
  to authenticated
  using (caregiver_id = auth.uid() or subject_id = auth.uid());

create policy "subject grants caregiver"
  on public.caregiver_links for insert
  to authenticated
  with check (subject_id = auth.uid());

create policy "linked users revoke"
  on public.caregiver_links for update
  to authenticated
  using (caregiver_id = auth.uid() or subject_id = auth.uid())
  with check (caregiver_id = auth.uid() or subject_id = auth.uid());

-- ─── Caregiver: lettura metriche subjects autorizzati ──────
-- Aggiunge policy a fitness_metrics e workouts già creati nella migration 003.
create policy "caregiver select subjects metrics"
  on public.fitness_metrics for select
  to authenticated
  using (
    exists(
      select 1 from public.caregiver_links cl
      join public.privacy_consents pc on pc.user_id = cl.subject_id
      where cl.caregiver_id = auth.uid()
        and cl.subject_id = fitness_metrics.user_id
        and cl.revoked_at is null
        and (cl.expires_at is null or cl.expires_at > now())
        and 'view_dashboard' = any(cl.permissions)
        and pc.caregiver_share = true
    )
  );

-- ─── Trigger anonimizzazione audit on user delete ──────────
-- Quando un user viene cancellato (CASCADE da auth.users), pulisce le PII
-- da audit_logs e admin_events (che NON sono CASCADE). Vedi doc 10.
create or replace function public.anonymize_user_audit_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.audit_logs
  set user_id = null,
      ip = null,
      user_agent = null,
      detail = (detail - 'email' - 'display_name' - 'ip')
  where user_id = old.id;

  update public.admin_events
  set target_user_id = null,
      detail = (detail - 'email' - 'display_name')
  where target_user_id = old.id;

  return old;
end;
$$;

create trigger trg_anonymize_audit_on_user_delete
  before delete on public.profiles
  for each row execute function public.anonymize_user_audit_on_delete();
