-- Sprint 189-RC2 correction (Matteo's own re-open, "189-RC2 — Closure
-- correction, ancora NO-GO", Blocker 3 + security follow-up): the sleep merge
-- shipped in 20260721180000 replaced the WHOLE sleep block (minutes/start/
-- end/stages) wholesale when the incoming payload was "richer", discarding
-- whichever side lost the richness comparison. That is lossy by construction:
-- a nap synced separately from the main night for the SAME canonical identity
-- could permanently disappear the moment the other one won the richness
-- compare. Matteo rejected this as an unacceptable known limitation and
-- required genuine session-level union, at parity with what
-- row_collapse.dart already does at read time (mergeExerciseSessions'
-- sibling for sleep: group stages by sessionIdx, union across both sides,
-- dedup only on real overlap keeping the richer session, never on "which
-- side is newer/richer overall").
--
-- This migration replaces the sleep_start_ms/sleep_end_ms/sleep_stages merge
-- with exactly that algorithm (internal._merge_sleep_stages_jsonb below).
-- sleep_minutes keeps its previous richness-wins-wholesale rule UNCHANGED —
-- that mirrors row_collapse.dart precisely: bestSleep's four fields are
-- copied verbatim from the single richest row, then ONLY sleep_stages/start/
-- end get overwritten again by the cross-row session union; sleep_minutes is
-- deliberately never recomputed from the unioned stages. Reproducing that
-- exact asymmetry (not "fixing" it into something row_collapse.dart doesn't
-- itself do) is what "parita' con collapseRowGroup" requires.
--
-- Security follow-up (same message): the three merge helpers introduced in
-- 20260721180000 are SECURITY INVOKER functions living in `public` with an
-- EXECUTE grant to `authenticated` — which Supabase's PostgREST exposes as
-- directly POST-able RPC endpoints (/rest/v1/rpc/_merge_exercise_sessions_jsonb
-- etc), not just as internal helpers callable from upsert_fitness_metrics_v189.
-- They have no reason to be a public API surface: nothing outside this
-- migration's own upsert function ever needs to call them directly. Moved to
-- a new `internal` schema instead of narrowing grants further, because grants
-- alone don't stop PostgREST from listing/routing to a public-schema function
-- — schema exposure is controlled by Supabase's "Exposed schemas" project
-- setting (Settings > API), which defaults to just `public`. A function
-- living in `internal` is invisible to PostgREST regardless of what EXECUTE
-- grants it carries, as long as `internal` is never added to that list
-- (Matteo: worth a 10-second confirmation in the dashboard, not something
-- this migration can verify or change from SQL). `authenticated` still needs
-- USAGE on the schema and EXECUTE on the functions, because
-- upsert_fitness_metrics_v189 is SECURITY INVOKER and its nested calls into
-- `internal.*` still run as the calling role, not as a superuser — the
-- protection is "not a public HTTP endpoint", not "authenticated can't
-- execute it at all".

create schema if not exists internal;
revoke all on schema internal from public;
grant usage on schema internal to authenticated;

do $do$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = '_merge_exercise_sessions_jsonb'
  ) then
    alter function public._merge_exercise_sessions_jsonb(jsonb, jsonb) set schema internal;
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = '_merge_intraday_hr_jsonb'
  ) then
    alter function public._merge_intraday_hr_jsonb(jsonb, jsonb, boolean) set schema internal;
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = '_sleep_session_count_jsonb'
  ) then
    alter function public._sleep_session_count_jsonb(jsonb) set schema internal;
  end if;
end;
$do$;

-- ── Sleep session union (the Blocker 3 fix). Mirrors row_collapse.dart's
-- two-step sleep handling exactly:
--   1. `_sleepStageSessions`: group an array's stage entries by their own
--      `sessionIdx` tag (defaulting to 0), dropping any stage missing a valid
--      startMs/endMs (endMs must be > startMs). Each group's bounds are
--      min(startMs)/max(endMs) across its own stages.
--   2. Candidates from BOTH sides (old row's already-stored sleep_stages,
--      new payload's sleep_stages) are pooled, sorted by richness
--      (stage-count desc, then duration desc), and walked greedily: a
--      candidate is kept unless it overlaps a session already kept. This is
--      "richest session wins the overlap", never a stage-level merge within
--      one session — matches `_sessionsOverlap` + the dedup loop exactly.
--   3. The single richest KEPT session (`selected.first`, i.e. before the
--      chronological resort) supplies main_start_ms/main_end_ms — on purpose
--      this can be a different session than the chronologically-first one
--      (e.g. an evening nap richer in stage detail than an under-logged main
--      night would still supply the main fields), exactly matching the
--      client's own `mainSession` selection. Kept sessions are then resorted
--      chronologically and re-tagged sessionIdx 0..n-1 for the final
--      flattened array — the specific integer values are internal
--      bookkeeping only, distinctness and chronological ordering is what
--      read-side code relies on.
-- Shape-guarded the same way as the sibling helpers (jsonb_typeof checks):
-- this is only ever called from upsert_fitness_metrics_v189, but that
-- function is directly RPC-callable and its p_row is attacker-controlled
-- JSON, not something Zod has necessarily validated (the RPC can be hit
-- directly, bypassing route.ts).
create or replace function internal._merge_sleep_stages_jsonb(old_stages jsonb, new_stages jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_grouped jsonb[];
  v_selected jsonb[] := '{}';
  v_main jsonb;
  v_cand jsonb;
  v_kept jsonb;
  v_overlaps boolean;
  v_final_stages jsonb := '[]'::jsonb;
  v_retagged jsonb;
  v_idx int := 0;
begin
  select array_agg(
    jsonb_build_object('stages', stages, 'start_ms', start_ms, 'end_ms', end_ms)
    order by jsonb_array_length(stages) desc, (end_ms - start_ms) desc
  )
  into v_grouped
  from (
    select
      jsonb_agg(s.value order by (s.value->>'startMs')::bigint) as stages,
      min((s.value->>'startMs')::bigint) as start_ms,
      max((s.value->>'endMs')::bigint) as end_ms
    from unnest(array[old_stages, new_stages]) as arr
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(arr) = 'array' then arr else '[]'::jsonb end
    ) as s(value)
    where jsonb_typeof(s.value) = 'object'
      and (s.value->>'startMs') is not null
      and (s.value->>'endMs') is not null
      and (s.value->>'endMs')::bigint > (s.value->>'startMs')::bigint
    group by arr, coalesce((s.value->>'sessionIdx')::int, 0)
  ) sessions;

  if v_grouped is null then
    return null;
  end if;

  foreach v_cand in array v_grouped loop
    v_overlaps := false;
    foreach v_kept in array v_selected loop
      if (v_cand->>'start_ms')::bigint < (v_kept->>'end_ms')::bigint
         and (v_kept->>'start_ms')::bigint < (v_cand->>'end_ms')::bigint then
        v_overlaps := true;
        exit;
      end if;
    end loop;
    if not v_overlaps then
      v_selected := array_append(v_selected, v_cand);
    end if;
  end loop;

  -- Richest overall, before the chronological resort below.
  v_main := v_selected[1];

  select array_agg(v order by (v->>'start_ms')::bigint) into v_selected
  from unnest(v_selected) as v;

  v_idx := 0;
  foreach v_cand in array v_selected loop
    select coalesce(jsonb_agg(stage || jsonb_build_object('sessionIdx', v_idx)), '[]'::jsonb)
    into v_retagged
    from jsonb_array_elements(v_cand->'stages') as stage;
    v_final_stages := v_final_stages || v_retagged;
    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object(
    'stages', v_final_stages,
    'main_start_ms', (v_main->>'start_ms')::bigint,
    'main_end_ms', (v_main->>'end_ms')::bigint
  );
end;
$$;

revoke all on function internal._merge_sleep_stages_jsonb(jsonb, jsonb) from public;
grant execute on function internal._merge_sleep_stages_jsonb(jsonb, jsonb) to authenticated;

-- ── Rewire upsert_fitness_metrics_v189: same signature/grants/RLS scoping as
-- 20260721180000, only the body changes (internal.* calls + the sleep merge
-- below). CREATE OR REPLACE keeps the existing grant to `authenticated`
-- intact (Postgres does not revoke grants on REPLACE, only on DROP).
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
  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'upsert_fitness_metrics_v189: user_id mismatch' using errcode = '42501';
  end if;
  if v_device_id is null or not exists (
    select 1 from public.devices d where d.id = v_device_id and d.user_id = v_user_id
  ) then
    raise exception 'upsert_fitness_metrics_v189: device_id does not belong to caller' using errcode = '42501';
  end if;
  if v_local_day_key is null or v_local_day_key = '' then
    raise exception 'upsert_fitness_metrics_v189: local_day_key required' using errcode = '22004';
  end if;

  v_new_sleep_sessions := internal._sleep_session_count_jsonb(p_row->'sleep_stages');
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
    collected_at_ms = greatest(fitness_metrics.collected_at_ms, excluded.collected_at_ms),
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
    sleep_apnea_detected = case
      when excluded.sleep_apnea_detected is true or fitness_metrics.sleep_apnea_detected is true then true
      when excluded.sleep_apnea_detected is not null or fitness_metrics.sleep_apnea_detected is not null then false
      else null
    end,
    intraday_steps = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.intraday_steps, fitness_metrics.intraday_steps) else fitness_metrics.intraday_steps end,
    intraday_calories = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.intraday_calories, fitness_metrics.intraday_calories) else fitness_metrics.intraday_calories end,
    intraday_hr = internal._merge_intraday_hr_jsonb(
      fitness_metrics.intraday_hr, excluded.intraday_hr,
      excluded.collected_at_ms >= fitness_metrics.collected_at_ms
    ),
    exercise_sessions = internal._merge_exercise_sessions_jsonb(fitness_metrics.exercise_sessions, excluded.exercise_sessions),
    -- sleep_minutes: UNCHANGED richness-wholesale rule (see migration header
    -- for why this one field deliberately does NOT get recomputed from the
    -- unioned sessions below — row_collapse.dart doesn't either).
    sleep_minutes = case
      when v_new_sleep_sessions > internal._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
        or (v_new_sleep_sessions = internal._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
            and v_new_sleep_minutes > coalesce(fitness_metrics.sleep_minutes, 0))
      then excluded.sleep_minutes else fitness_metrics.sleep_minutes end,
    -- sleep_start_ms/sleep_end_ms/sleep_stages: Blocker 3 fix. Genuine
    -- session-level union (internal._merge_sleep_stages_jsonb), not a
    -- richness-gated wholesale replace — a nap and a main night landing in
    -- two different syncs for the same identity now both survive, at parity
    -- with row_collapse.dart's own cross-row session union.
    sleep_start_ms = (internal._merge_sleep_stages_jsonb(fitness_metrics.sleep_stages, excluded.sleep_stages)->>'main_start_ms')::bigint,
    sleep_end_ms = (internal._merge_sleep_stages_jsonb(fitness_metrics.sleep_stages, excluded.sleep_stages)->>'main_end_ms')::bigint,
    sleep_stages = internal._merge_sleep_stages_jsonb(fitness_metrics.sleep_stages, excluded.sleep_stages)->'stages'
  where fitness_metrics.user_id = auth.uid()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_fitness_metrics_v189(jsonb) from public;
grant execute on function public.upsert_fitness_metrics_v189(jsonb) to authenticated;
