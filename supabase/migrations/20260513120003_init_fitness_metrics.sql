-- ─────────────────────────────────────────────────────────
-- Migration 003 — Fitness metrics + workouts (HEALTH DATA, SENSITIVE)
-- Vedi docs/architecture/04 (schema) + 05 (RLS critica).
-- ⚠️ RLS rigida: admin NON ha policy SELECT.
-- ─────────────────────────────────────────────────────────

create table public.fitness_metrics (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  schema_version int not null default 1,
  source text,
  window_start_ms bigint not null,
  window_end_ms bigint not null,
  collected_at_ms bigint not null,
  received_at timestamptz not null default now(),
  -- Metriche aggregate
  steps int,
  heart_rate_bpm numeric(5,2),
  resting_heart_rate_bpm int,
  spo2_percent numeric(5,2),
  calories_kcal numeric(8,2),
  active_calories_kcal numeric(8,2),
  sleep_minutes int,
  sleep_start_ms bigint,
  sleep_end_ms bigint,
  distance_meters numeric(10,2),
  hrv_rmssd int,
  vo2_max numeric(5,2),
  floors_climbed int,
  elevation_gained_meters numeric,
  skin_temperature_c numeric(4,2),
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  bmi numeric(4,2),
  -- Intraday breakdown (JSONB per evitare table esplosa)
  intraday_steps jsonb,
  intraday_hr jsonb,
  intraday_calories jsonb,
  sleep_stages jsonb,
  exercise_sessions jsonb,
  source_device text,
  source_package text
);

create index fitness_metrics_user_collected_idx
  on public.fitness_metrics (user_id, collected_at_ms desc);

create index fitness_metrics_device_collected_idx
  on public.fitness_metrics (device_id, collected_at_ms desc);

comment on table public.fitness_metrics is
  '⚠️ SENSITIVE (Art. 9 GDPR). Admin NON ha policy SELECT. Solo user (RLS) + Edge Function ingest (service_role).';

-- ─── workouts: sessioni di allenamento dedicate ────────────
create table public.workouts (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  start_ms bigint not null,
  end_ms bigint not null,
  type text,
  title text,
  duration_min int,
  distance_meters numeric,
  calories_kcal numeric,
  hr_avg int,
  hr_max int,
  hr_min int,
  pace_sec_per_km int,
  intensity_minutes_moderate int,
  intensity_minutes_vigorous int,
  notes text,
  created_at timestamptz not null default now()
);

create index workouts_user_start_idx
  on public.workouts (user_id, start_ms desc);

-- ─── RLS fitness_metrics ──────────────────────────────────
alter table public.fitness_metrics enable row level security;

create policy "users select own metrics"
  on public.fitness_metrics for select
  to authenticated
  using (user_id = auth.uid());

-- ⚠️ NESSUNA POLICY ADMIN SELECT — admin non vede dati salute raw (vedi doc 05).
-- INSERT/UPDATE/DELETE: solo via Edge Function ingest-sync (service_role).

-- ─── RLS workouts ─────────────────────────────────────────
alter table public.workouts enable row level security;

create policy "users select own workouts"
  on public.workouts for select
  to authenticated
  using (user_id = auth.uid());

create policy "users update own workouts notes"
  on public.workouts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- INSERT solo via service_role.
