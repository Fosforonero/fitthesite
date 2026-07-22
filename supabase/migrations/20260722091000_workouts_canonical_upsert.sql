-- Sprint 189-RC2 correction, Blocker 2: public.workouts still gets a brand
-- new row on every sync that includes an exercise session, exactly like
-- fitness_metrics did before 20260721180000 — 30,575 rows for 4,345 distinct
-- (user_id, device_id, start_ms, end_ms, type) identities as of this audit
-- (identity chosen and verified against production data below; genuinely
-- distinct workouts never collide on it because start_ms/end_ms are the
-- workout's own precise timestamps, not a day bucket).
--
-- Same additive pattern as fitness_metrics: a brand new nullable
-- `is_canonical` column, NULL for every one of the 30,575 existing rows,
-- populated only by the new upsert path below. A partial unique index scoped
-- to `is_canonical is true` can therefore never collide with history — it
-- only ever has to stay consistent among rows this migration's own function
-- writes. No historical row is touched, deleted, or reinterpreted.
--
-- Known, stated limitation (not hidden as solved): if the SAME real workout
-- is re-synced with a shifted start_ms/end_ms (e.g. an in-progress workout
-- whose window widens as more data becomes available before being finalized),
-- the exact-match identity Matteo specified won't recognize it as the same
-- workout and a new canonical row is created. This is the "minimo candidato"
-- identity as explicitly specified; a fuzzy/overlap-based identity is a
-- separate, larger design question out of scope here. What this migration
-- does guarantee: an EXACT retry (identical payload, e.g. a network retry or
-- a repeated full-day resync of an already-finished workout — the dominant
-- real-world case) always lands on the same row from now on.
--
-- Pre-existing, unrelated-to-this-sprint gap found during this audit: the
-- "users update own workouts notes" UPDATE policy (already in production
-- before this sprint) has no is_canonical scoping at all — it already lets
-- any authenticated user PATCH any of their own workout rows, historical or
-- not, via raw PostgREST. Tightened below to mirror the same
-- history-is-immutable principle applied to fitness_metrics in
-- 20260721180000, not introduced by this migration but closed by it.

alter table public.workouts
  add column if not exists is_canonical boolean;

comment on column public.workouts.is_canonical is
  'true only for rows written by upsert_workouts_v189 (Sprint 189-RC2+). '
  'NULL for every row written before this migration — kept out of '
  'workouts_canonical_idx on purpose so history can never collide with the '
  'new upsert path.';

create unique index if not exists workouts_canonical_idx
  on public.workouts (
    user_id, device_id, start_ms, end_ms, (coalesce(lower(trim(type)), ''))
  )
  where is_canonical is true;

do $do$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workouts'
      and policyname = 'users update own workouts notes'
  ) then
    drop policy "users update own workouts notes" on public.workouts;
  end if;
  create policy "users update own workouts notes"
    on public.workouts for update
    to authenticated
    using (user_id = auth.uid() and is_canonical is true)
    with check (user_id = auth.uid() and is_canonical is true);
end;
$do$;

-- ── Canonical upsert. Identity match -> enrich in place (title/duration/
-- distance/calories/HR/pace/intensity via COALESCE(new, old): a present new
-- value always wins, including a correction, an absent one never erases a
-- stored one). No identity match -> plain insert, is_canonical = true.
-- Ownership checks mirror upsert_fitness_metrics_v189 exactly (same
-- SECURITY INVOKER + explicit device-ownership reasoning: this function is
-- directly RPC-callable, not only reachable through route.ts's own
-- fingerprint-scoped device lookup).
create or replace function public.upsert_workouts_v189(p_row jsonb)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (p_row->>'user_id')::uuid;
  v_device_id uuid := (p_row->>'device_id')::uuid;
  v_id bigint;
begin
  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'upsert_workouts_v189: user_id mismatch' using errcode = '42501';
  end if;
  if v_device_id is null or not exists (
    select 1 from public.devices d where d.id = v_device_id and d.user_id = v_user_id
  ) then
    raise exception 'upsert_workouts_v189: device_id does not belong to caller' using errcode = '42501';
  end if;
  if (p_row->>'start_ms') is null or (p_row->>'end_ms') is null then
    raise exception 'upsert_workouts_v189: start_ms/end_ms required' using errcode = '22004';
  end if;

  insert into public.workouts (
    user_id, device_id, start_ms, end_ms, type, title, duration_min,
    distance_meters, calories_kcal, hr_avg, hr_max, hr_min, pace_sec_per_km,
    intensity_minutes_moderate, intensity_minutes_vigorous, notes, is_canonical
  ) values (
    v_user_id, v_device_id,
    (p_row->>'start_ms')::bigint, (p_row->>'end_ms')::bigint, p_row->>'type',
    p_row->>'title', (p_row->>'duration_min')::int,
    (p_row->>'distance_meters')::numeric, (p_row->>'calories_kcal')::numeric,
    (p_row->>'hr_avg')::int, (p_row->>'hr_max')::int, (p_row->>'hr_min')::int,
    (p_row->>'pace_sec_per_km')::int,
    (p_row->>'intensity_minutes_moderate')::int, (p_row->>'intensity_minutes_vigorous')::int,
    p_row->>'notes', true
  )
  on conflict (user_id, device_id, start_ms, end_ms, (coalesce(lower(trim(type)), '')))
  where is_canonical is true
  do update set
    title = coalesce(excluded.title, workouts.title),
    duration_min = coalesce(excluded.duration_min, workouts.duration_min),
    distance_meters = coalesce(excluded.distance_meters, workouts.distance_meters),
    calories_kcal = coalesce(excluded.calories_kcal, workouts.calories_kcal),
    hr_avg = coalesce(excluded.hr_avg, workouts.hr_avg),
    hr_max = coalesce(excluded.hr_max, workouts.hr_max),
    hr_min = coalesce(excluded.hr_min, workouts.hr_min),
    pace_sec_per_km = coalesce(excluded.pace_sec_per_km, workouts.pace_sec_per_km),
    intensity_minutes_moderate = coalesce(excluded.intensity_minutes_moderate, workouts.intensity_minutes_moderate),
    intensity_minutes_vigorous = coalesce(excluded.intensity_minutes_vigorous, workouts.intensity_minutes_vigorous),
    notes = coalesce(excluded.notes, workouts.notes)
  where workouts.user_id = auth.uid()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_workouts_v189(jsonb) from public;
grant execute on function public.upsert_workouts_v189(jsonb) to authenticated;
