-- Sprint 189-RC2: stop write-amplification on fitness_metrics, make the
-- periodic same-day sync update a canonical row instead of appending a new
-- one every time. Purely additive: no column dropped, no row deleted, no
-- history touched. Historical rows keep local_day_key = NULL forever and are
-- structurally excluded from the new unique index (WHERE local_day_key IS
-- NOT NULL), so nothing here can collide with or reinterpret the existing
-- 57k+ rows already in production.
--
-- Architecture decision (full reasoning in docs/sprints/SPRINT-189-RC2-sync-idempotency.md):
-- chose an idempotent key on the EXISTING table (not a shadow table + dual
-- write + cutover) because every precondition for the smaller option holds:
-- the key is nullable/additive, the unique index is partial and provably
-- cannot collide with history, legacy 185-188 clients keep getting 200 (they
-- simply don't send localDayKey and get a documented best-effort UTC-day
-- fallback computed route-side), and the merge logic below satisfies every
-- field-semantics rule without needing a second source of truth.
--
-- Canonical identity: (user_id, device_id, coalesce(source,''),
-- coalesce(source_device,''), local_day_key). device_id (the pairing/API
-- device, i.e. the phone) is included on purpose: two different phones
-- reporting through the same `source` must stay distinct (Matteo's own test
-- case), it's not a regression vs today (device swaps already start a fresh,
-- unrelated row sequence under the current insert-only model). BOTH `source`
-- and `source_device` are coalesced to '' in the index/conflict expressions:
-- Postgres treats every NULL as distinct from every other NULL in a unique
-- index, and `source` is just as nullable end-to-end as `source_device`
-- (Zod: `.nullish()`; DB column: no NOT NULL) — a real, adversarially-caught
-- gap in an earlier draft of this migration only coalesced source_device,
-- silently defeating dedup for any null-`source` row (2 of ~57.7k production
-- rows already have source IS NULL). Fixed here: both columns get the same
-- treatment. This mirrors the grouping key row_collapse.dart already uses at
-- read time (`source|source_device ?? ''`).
--
-- local_day_key is NOT recomputed here from collected_at_ms/window bounds:
-- Flutter's dayKeyForRow() already correctly handles local timezone, DST,
-- and the sleep-dominant-day special case (a sleep block belongs to the day
-- of wake-up, not collection) — reimplementing that in SQL would be exactly
-- the "duplicazione incontrollata dell'algoritmo Flutter dentro SQL" this
-- sprint was told to avoid, and would silently drift out of parity the next
-- time dayKeyForRow changes. Instead, 189+ clients compute it once (calling
-- the same tested function already used for the local cache) and send it
-- explicitly; the route trusts it as-is. Legacy clients (no such field) get
-- app/schema.ts's utcDayFallbackKey() instead — an intentionally simpler,
-- less precise substitute, never a parallel reimplementation of the real
-- algorithm. schema.ts also bounds collectedAtMillis before this is ever
-- computed, so local_day_key is guaranteed a real 'YYYY-MM-DD' shape, never
-- an out-of-range ISO extended-year string.

alter table public.fitness_metrics
  add column if not exists local_day_key text;

comment on column public.fitness_metrics.local_day_key is
  'YYYY-MM-DD logical day for canonical-row dedup. NULL for every row written '
  'before Sprint 189-RC2 (historical rows are intentionally excluded from '
  'fitness_metrics_canonical_idx below, see migration header). Populated for '
  '189+ clients via Flutter''s dayKeyForRow(); for legacy 185-188 clients via '
  'a route-side UTC-day fallback (utcDayFallbackKey in app/api/v1/sync/schema.ts).';

create unique index if not exists fitness_metrics_canonical_idx
  on public.fitness_metrics (
    user_id, device_id, (coalesce(source, '')), (coalesce(source_device, '')), local_day_key
  )
  where local_day_key is not null;

-- Needed for the UPSERT below: today fitness_metrics has SELECT+INSERT RLS
-- policies but no UPDATE policy at all (write path has always been
-- insert-only). SECURITY INVOKER means this function runs as the calling
-- authenticated user with no elevated privilege — Postgres enforces
-- ownership via this policy exactly as it would for a raw UPDATE statement.
--
-- Scoped to `local_day_key is not null` in BOTH using/with check, matching
-- the unique index's own partial scope: without this, the policy would let
-- any authenticated user issue a raw REST `PATCH /fitness_metrics?id=eq.<own
-- historical row>` and silently rewrite pre-migration rows with arbitrary
-- values, bypassing every merge/richness rule below entirely — a real gap an
-- earlier draft of this migration had (adversarially caught: the unique
-- index was carefully scoped to protect history, this policy wasn't). This
-- scoping makes the policy do the same thing the index already does: it only
-- ever applies to canonical (189-RC2-created-or-touched) rows.
do $do$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'fitness_metrics'
      and policyname = 'users update own metrics'
  ) then
    create policy "users update own metrics"
      on public.fitness_metrics for update
      to authenticated
      using (user_id = auth.uid() and local_day_key is not null)
      with check (user_id = auth.uid() and local_day_key is not null);
  end if;
end;
$do$;

-- ── Exercise sessions: union of old+new session lists, dedup by
-- (start-minute, end-minute, type), richest (most non-null fields) wins the
-- collision. Deliberately the same rule as row_collapse.dart's
-- mergeExerciseSessions() (see test/.../row_collapse_upsert_parity_test.dart
-- for the cross-checked fixture) — ported once, not reinvented, so the two
-- only ever need to change in lockstep, never independently.
--
-- Shape-guards non-array/non-object input defensively: this function is only
-- ever invoked from upsert_fitness_metrics_v189's own UPDATE clause, but that
-- function is SECURITY INVOKER and directly RPC-callable by any authenticated
-- client (bypassing route.ts's Zod validation) — adversarially confirmed a
-- malformed `exercise_sessions` (e.g. a bare object instead of an array)
-- would otherwise silently merge in as a bogus zeroed-out "session" instead
-- of being rejected or ignored.
create or replace function public._merge_exercise_sessions_jsonb(old_sessions jsonb, new_sessions jsonb)
returns jsonb
language sql
immutable
as $$
  with safe_old as (
    select case when jsonb_typeof(old_sessions) = 'array' then old_sessions else '[]'::jsonb end as v
  ),
  safe_new as (
    select case when jsonb_typeof(new_sessions) = 'array' then new_sessions else '[]'::jsonb end as v
  ),
  all_sessions as (
    select
      s.value,
      floor(coalesce((s.value->>'startMs')::bigint, 0) / 60000) as start_min,
      floor(coalesce((s.value->>'endMs')::bigint, 0) / 60000) as end_min,
      lower(trim(coalesce(s.value->>'type', s.value->>'name', ''))) as type_key,
      (
        case when jsonb_typeof(s.value) = 'object'
          then (select count(*) from jsonb_each(s.value) e where e.value is not null and e.value <> 'null'::jsonb)
          else 0
        end
      ) as richness
    from safe_old, safe_new,
      lateral jsonb_array_elements(safe_old.v || safe_new.v) as s(value)
    where jsonb_typeof(s.value) = 'object'
  ),
  ranked as (
    select distinct on (start_min, end_min, type_key)
      value, (start_min::text || '|' || end_min::text || '|' || type_key) as dedup_key,
      coalesce((value->>'startMs')::bigint, 0) as start_ms
    from all_sessions
    order by start_min, end_min, type_key, richness desc
  ),
  agg as (
    select jsonb_agg(value order by start_ms) as merged from ranked
  )
  select case
    when (select count(*) from all_sessions) = 0 then null
    else (select merged from agg)
  end;
$$;

-- ── Intraday HR: union of old+new 5-minute buckets. `prefer_new` decides who
-- wins on overlap — it must reflect actual chronological order (whichever
-- side's collected_at_ms is newer), NOT which argument happened to be
-- "excluded"/incoming: adversarially confirmed that out-of-order commits
-- (e.g. a background sync and a foreground sync racing, ordinary network
-- jitter with no attacker involved — see upsert_fitness_metrics_v189 for how
-- prefer_new is computed) would otherwise let a chronologically OLDER
-- payload silently clobber newer samples just because its UPDATE committed
-- second.
--
-- Shape-guarded the same way as _merge_exercise_sessions_jsonb above.
create or replace function public._merge_intraday_hr_jsonb(old_samples jsonb, new_samples jsonb, prefer_new boolean)
returns jsonb
language sql
immutable
as $$
  with safe_old as (
    select case when jsonb_typeof(old_samples) = 'array' then old_samples else '[]'::jsonb end as v
  ),
  safe_new as (
    select case when jsonb_typeof(new_samples) = 'array' then new_samples else '[]'::jsonb end as v
  ),
  buckets as (
    select
      (floor(coalesce((s.value->>'ts')::bigint, 0) / 300000) * 300000) as bucket,
      (s.value->>'bpm')::int as bpm,
      src.rank
    from (
      values
        ((select v from safe_old), case when prefer_new then 1 else 2 end),
        ((select v from safe_new), case when prefer_new then 2 else 1 end)
    ) as src(arr, rank)
    cross join lateral jsonb_array_elements(src.arr) as s(value)
    where jsonb_typeof(s.value) = 'object'
      and (s.value->>'bpm')::int between 25 and 240
  ),
  best as (
    select distinct on (bucket) bucket, bpm
    from buckets
    order by bucket, rank desc
  )
  select case
    when (select count(*) from best) = 0 then null
    else (select jsonb_agg(jsonb_build_object('ts', bucket, 'bpm', bpm) order by bucket) from best)
  end;
$$;

-- ── Sleep block (sleep_minutes/sleep_start_ms/sleep_end_ms/sleep_stages):
-- treated as ONE atomic unit, replaced wholesale only when the incoming
-- payload is richer (more distinct stage-sessions, tie-broken by minutes) —
-- mirrors row_collapse.dart's "bestSleep" selection, never partially mixes
-- start/end from one snapshot with stages from another (row_collapse's own
-- explicit warning). This is deliberately SIMPLER than row_collapse.dart's
-- full cross-row session union (which additionally merges a disjoint nap
-- and a main night captured in separate syncs into one segmented array): we
-- do not delete history, so if a nap and a night ever land in two different
-- canonical-merge cycles without one dominating the other by richness, the
-- OLDER historical rows are still on disk and the existing client-side
-- collapseRowGroup() (unchanged, still the read path's source of truth)
-- reconstructs the full union at read time regardless of what this function
-- did. This function only needs to be safe (never destructive) and good
-- enough to cut duplicate-row volume — not the final word on sleep fusion.
--
-- Known, monitored limitation (surfaced by adversarial review, not fully
-- closed here): if a nap and a main night land as two SEPARATE syncs for the
-- IDENTICAL canonical identity (same user/device/source/day) rather than as
-- two different identities, the richness-loser is discarded from this row
-- with no other row left to reconstruct it from — this differs from the
-- pre-migration insert-only model, where every sync got its own row. Real
-- Flutter sync paths (Health Connect/HealthKit full-window re-read, ring
-- full-log re-read) always resend a cumulative, monotonically-richer picture
-- on a later same-day sync, so this is not believed to be reachable with the
-- app's current sync architecture — but it is a design constraint worth
-- tracking if that architecture changes (e.g. a future incremental/delta
-- sync mode), not a fully-eliminated risk.
create or replace function public._sleep_session_count_jsonb(stages jsonb)
returns int
language sql
immutable
as $$
  select count(distinct coalesce((s.value->>'sessionIdx')::int, 0))
  from jsonb_array_elements(
    case when jsonb_typeof(stages) = 'array' then stages else '[]'::jsonb end
  ) as s(value)
  where jsonb_typeof(s.value) = 'object';
$$;

create or replace function public.upsert_fitness_metrics_v189(p_row jsonb)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (p_row->>'user_id')::uuid;
  v_device_id uuid := (p_row->>'device_id')::uuid;
  v_local_day_key text := p_row->>'local_day_key';
  v_id bigint;
  v_new_sleep_sessions int;
  v_new_sleep_minutes int;
begin
  -- Ownership checks even though RLS also enforces user_id on the
  -- INSERT/UPDATE below: fail loud and early with a clear error instead of a
  -- confusing RLS rejection deep inside the ON CONFLICT path.
  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'upsert_fitness_metrics_v189: user_id mismatch' using errcode = '42501';
  end if;
  -- Defense-in-depth: this function is directly RPC-callable by any
  -- authenticated client (grant below), not only reachable through
  -- route.ts's own device-fingerprint-scoped lookup. Without this check, a
  -- caller could write their own user_id paired with a device_id belonging
  -- to someone else's device (device rows are cross-referenceable in this
  -- app via legitimate SELECT paths, e.g. Mesh Group sharing), corrupting
  -- the very per-device distinctness the canonical identity relies on —
  -- adversarially confirmed as a real, if scoped-to-the-attacker's-own-row,
  -- gap in an earlier draft.
  if v_device_id is null or not exists (
    select 1 from public.devices d where d.id = v_device_id and d.user_id = v_user_id
  ) then
    raise exception 'upsert_fitness_metrics_v189: device_id does not belong to caller' using errcode = '42501';
  end if;
  if v_local_day_key is null or v_local_day_key = '' then
    raise exception 'upsert_fitness_metrics_v189: local_day_key required' using errcode = '22004';
  end if;

  v_new_sleep_sessions := public._sleep_session_count_jsonb(p_row->'sleep_stages');
  v_new_sleep_minutes := coalesce((p_row->>'sleep_minutes')::int, 0);

  insert into public.fitness_metrics (
    user_id, device_id, schema_version, source, window_start_ms, window_end_ms,
    collected_at_ms, received_at, local_day_key,
    steps, heart_rate_bpm, resting_heart_rate_bpm, spo2_percent, calories_kcal,
    active_calories_kcal, sleep_minutes, sleep_start_ms, sleep_end_ms,
    distance_meters, hrv_rmssd, hrv_sdnn, stress_avg, vo2_max, floors_climbed,
    elevation_gained_meters, skin_temperature_c, weight_kg, height_cm, bmi,
    intraday_steps, intraday_hr, intraday_calories, sleep_stages,
    exercise_sessions, source_device, source_package,
    blood_pressure_systolic, blood_pressure_diastolic, blood_glucose_mgdl,
    water_ml, respiratory_rate_bpm, nutrition_kcal_in, sleep_apnea_detected,
    hr_source_name, hr_source_quality
  ) values (
    v_user_id, v_device_id, coalesce((p_row->>'schema_version')::int, 1),
    p_row->>'source', (p_row->>'window_start_ms')::bigint, (p_row->>'window_end_ms')::bigint,
    (p_row->>'collected_at_ms')::bigint, now(), v_local_day_key,
    (p_row->>'steps')::int, (p_row->>'heart_rate_bpm')::numeric, (p_row->>'resting_heart_rate_bpm')::int,
    (p_row->>'spo2_percent')::numeric, (p_row->>'calories_kcal')::numeric,
    (p_row->>'active_calories_kcal')::numeric, (p_row->>'sleep_minutes')::int,
    (p_row->>'sleep_start_ms')::bigint, (p_row->>'sleep_end_ms')::bigint,
    (p_row->>'distance_meters')::numeric, (p_row->>'hrv_rmssd')::int, (p_row->>'hrv_sdnn')::int,
    (p_row->>'stress_avg')::int, (p_row->>'vo2_max')::numeric, (p_row->>'floors_climbed')::int,
    (p_row->>'elevation_gained_meters')::numeric, (p_row->>'skin_temperature_c')::numeric,
    (p_row->>'weight_kg')::numeric, (p_row->>'height_cm')::numeric, (p_row->>'bmi')::numeric,
    p_row->'intraday_steps', p_row->'intraday_hr', p_row->'intraday_calories', p_row->'sleep_stages',
    p_row->'exercise_sessions', p_row->>'source_device', p_row->>'source_package',
    (p_row->>'blood_pressure_systolic')::numeric, (p_row->>'blood_pressure_diastolic')::numeric,
    (p_row->>'blood_glucose_mgdl')::numeric, (p_row->>'water_ml')::int,
    (p_row->>'respiratory_rate_bpm')::numeric, (p_row->>'nutrition_kcal_in')::numeric,
    (p_row->>'sleep_apnea_detected')::boolean, p_row->>'hr_source_name', p_row->>'hr_source_quality'
  )
  on conflict (user_id, device_id, (coalesce(source, '')), (coalesce(source_device, '')), local_day_key)
  where local_day_key is not null
  do update set
    received_at = now(),
    schema_version = coalesce(excluded.schema_version, fitness_metrics.schema_version),
    window_start_ms = least(fitness_metrics.window_start_ms, excluded.window_start_ms),
    window_end_ms = greatest(fitness_metrics.window_end_ms, excluded.window_end_ms),
    -- collected_at_ms is bookkeeping (how fresh is this row), not a measured
    -- metric: always keep the maximum ever observed, order-independent.
    collected_at_ms = greatest(fitness_metrics.collected_at_ms, excluded.collected_at_ms),
    -- Scalars: a present new value wins (even a legitimate downward
    -- correction, per Sprint 189-RC2 rule 3/4 — no GREATEST/MAX here on
    -- purpose) — BUT ONLY when the incoming payload is chronologically
    -- newer-or-equal (its own collected_at_ms) than what's already stored.
    -- Adversarially confirmed: two overlapping syncs (e.g. a delayed
    -- background sync and a faster foreground sync for the same identity)
    -- can legitimately commit out of chronological order with no attacker
    -- involved; without this guard, whichever commits LAST always wins,
    -- letting stale data silently regress fresher data. An absent/null new
    -- value never clears a valid existing one either way (rule 1/2).
    steps = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.steps, fitness_metrics.steps) else fitness_metrics.steps end,
    heart_rate_bpm = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.heart_rate_bpm, fitness_metrics.heart_rate_bpm) else fitness_metrics.heart_rate_bpm end,
    resting_heart_rate_bpm = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.resting_heart_rate_bpm, fitness_metrics.resting_heart_rate_bpm) else fitness_metrics.resting_heart_rate_bpm end,
    spo2_percent = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.spo2_percent, fitness_metrics.spo2_percent) else fitness_metrics.spo2_percent end,
    calories_kcal = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.calories_kcal, fitness_metrics.calories_kcal) else fitness_metrics.calories_kcal end,
    active_calories_kcal = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.active_calories_kcal, fitness_metrics.active_calories_kcal) else fitness_metrics.active_calories_kcal end,
    distance_meters = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.distance_meters, fitness_metrics.distance_meters) else fitness_metrics.distance_meters end,
    hrv_rmssd = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.hrv_rmssd, fitness_metrics.hrv_rmssd) else fitness_metrics.hrv_rmssd end,
    hrv_sdnn = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.hrv_sdnn, fitness_metrics.hrv_sdnn) else fitness_metrics.hrv_sdnn end,
    stress_avg = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.stress_avg, fitness_metrics.stress_avg) else fitness_metrics.stress_avg end,
    vo2_max = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.vo2_max, fitness_metrics.vo2_max) else fitness_metrics.vo2_max end,
    floors_climbed = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.floors_climbed, fitness_metrics.floors_climbed) else fitness_metrics.floors_climbed end,
    elevation_gained_meters = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.elevation_gained_meters, fitness_metrics.elevation_gained_meters) else fitness_metrics.elevation_gained_meters end,
    skin_temperature_c = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.skin_temperature_c, fitness_metrics.skin_temperature_c) else fitness_metrics.skin_temperature_c end,
    weight_kg = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.weight_kg, fitness_metrics.weight_kg) else fitness_metrics.weight_kg end,
    height_cm = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.height_cm, fitness_metrics.height_cm) else fitness_metrics.height_cm end,
    bmi = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.bmi, fitness_metrics.bmi) else fitness_metrics.bmi end,
    blood_pressure_systolic = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.blood_pressure_systolic, fitness_metrics.blood_pressure_systolic) else fitness_metrics.blood_pressure_systolic end,
    blood_pressure_diastolic = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.blood_pressure_diastolic, fitness_metrics.blood_pressure_diastolic) else fitness_metrics.blood_pressure_diastolic end,
    blood_glucose_mgdl = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.blood_glucose_mgdl, fitness_metrics.blood_glucose_mgdl) else fitness_metrics.blood_glucose_mgdl end,
    water_ml = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.water_ml, fitness_metrics.water_ml) else fitness_metrics.water_ml end,
    respiratory_rate_bpm = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.respiratory_rate_bpm, fitness_metrics.respiratory_rate_bpm) else fitness_metrics.respiratory_rate_bpm end,
    nutrition_kcal_in = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.nutrition_kcal_in, fitness_metrics.nutrition_kcal_in) else fitness_metrics.nutrition_kcal_in end,
    hr_source_name = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.hr_source_name, fitness_metrics.hr_source_name) else fitness_metrics.hr_source_name end,
    hr_source_quality = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.hr_source_quality, fitness_metrics.hr_source_quality) else fitness_metrics.hr_source_quality end,
    -- sleep_apnea_detected: any TRUE wins; else any non-null FALSE; else null
    -- (mirrors row_collapse.dart's mergeDetectedFlag exactly) — deliberately
    -- NOT gated on recency: a positive apnea signal is never something a
    -- later, chronologically-earlier-collected sync should be able to erase.
    sleep_apnea_detected = case
      when excluded.sleep_apnea_detected is true or fitness_metrics.sleep_apnea_detected is true then true
      when excluded.sleep_apnea_detected is not null or fitness_metrics.sleep_apnea_detected is not null then false
      else null
    end,
    -- Base-only fields: row_collapse.dart never re-merges these either
    -- (no fallback-to-other-rows rule exists for them there), so parity is
    -- "prefer new if present, else keep old" — gated on recency like the
    -- scalars above, for the same out-of-order-commit reason.
    intraday_steps = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.intraday_steps, fitness_metrics.intraday_steps) else fitness_metrics.intraday_steps end,
    intraday_calories = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.intraday_calories, fitness_metrics.intraday_calories) else fitness_metrics.intraday_calories end,
    intraday_hr = public._merge_intraday_hr_jsonb(
      fitness_metrics.intraday_hr, excluded.intraday_hr,
      excluded.collected_at_ms >= fitness_metrics.collected_at_ms
    ),
    -- exercise_sessions: union+dedup is safe regardless of arrival order
    -- (each session is self-contained with its own start/end; dedup keys
    -- off session identity, not row-level recency), so this stays
    -- unconditional.
    exercise_sessions = public._merge_exercise_sessions_jsonb(fitness_metrics.exercise_sessions, excluded.exercise_sessions),
    -- Sleep block: replace wholesale only if the incoming payload is richer
    -- (see function comment above for why this doesn't need the full
    -- cross-session union row_collapse.dart does at read time). Richness,
    -- not recency, governs here on purpose — a richer reading is preferable
    -- regardless of which sync happened to collect it more recently.
    sleep_minutes = case
      when v_new_sleep_sessions > public._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
        or (v_new_sleep_sessions = public._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
            and v_new_sleep_minutes > coalesce(fitness_metrics.sleep_minutes, 0))
      then excluded.sleep_minutes else fitness_metrics.sleep_minutes end,
    sleep_start_ms = case
      when v_new_sleep_sessions > public._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
        or (v_new_sleep_sessions = public._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
            and v_new_sleep_minutes > coalesce(fitness_metrics.sleep_minutes, 0))
      then excluded.sleep_start_ms else fitness_metrics.sleep_start_ms end,
    sleep_end_ms = case
      when v_new_sleep_sessions > public._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
        or (v_new_sleep_sessions = public._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
            and v_new_sleep_minutes > coalesce(fitness_metrics.sleep_minutes, 0))
      then excluded.sleep_end_ms else fitness_metrics.sleep_end_ms end,
    sleep_stages = case
      when v_new_sleep_sessions > public._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
        or (v_new_sleep_sessions = public._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
            and v_new_sleep_minutes > coalesce(fitness_metrics.sleep_minutes, 0))
      then excluded.sleep_stages else fitness_metrics.sleep_stages end
  where fitness_metrics.user_id = auth.uid()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_fitness_metrics_v189(jsonb) from public;
revoke all on function public._merge_exercise_sessions_jsonb(jsonb, jsonb) from public;
revoke all on function public._merge_intraday_hr_jsonb(jsonb, jsonb, boolean) from public;
revoke all on function public._sleep_session_count_jsonb(jsonb) from public;
grant execute on function public.upsert_fitness_metrics_v189(jsonb) to authenticated;
-- Helper functions are SECURITY INVOKER (the default) and only ever called
-- from inside upsert_fitness_metrics_v189's own UPDATE clause — but INVOKER
-- means they still run as the CALLING role (authenticated), so they need
-- their own EXECUTE grant too, or the outer call fails with "permission
-- denied for function..." even though a client never calls them directly.
-- Confirmed by the disposable-Postgres test run (Fase 4): this exact gap was
-- caught and is why this line exists. anon still gets nothing on any of them.
grant execute on function public._merge_exercise_sessions_jsonb(jsonb, jsonb) to authenticated;
grant execute on function public._merge_intraday_hr_jsonb(jsonb, jsonb, boolean) to authenticated;
grant execute on function public._sleep_session_count_jsonb(jsonb) to authenticated;
