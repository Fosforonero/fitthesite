-- Sprint 189-STORE addendum: workouts near-duplicate canonical rows found
-- live in production on 2026-07-22 (Task 5 read-only check, 5 real pairs,
-- all 5 real user accounts, all created today under the already-deployed
-- upsert_workouts_v189 from 20260722091000). No mobile change, no rebuild,
-- no branch/tag move. Backend-only fix.
--
-- Root cause: the exact-tuple identity (user_id, device_id, start_ms,
-- end_ms, normalized type) — explicitly documented as a known, stated
-- limitation in 20260722091000 — cannot recognize the SAME real workout when
-- start_ms/end_ms drifts between two syncs, whether from:
--   (a) two near-simultaneous requests with slightly different device-side
--       rounding of start/end (observed 26ms and 195ms apart in production,
--       ~15-25s start/end drift), or
--   (b) a legitimate duration correction (same start_ms, end_ms grows by
--       minutes as more data streams in — observed 3/5 real pairs).
-- ON CONFLICT never fires because the tuple genuinely differs, so a second
-- is_canonical=true row is inserted instead of the first being enriched.
--
-- Impact, precisely (verified by reading the actual code, not assumed):
--   - Flutter dashboard reads `fitness_metrics.exercise_sessions` (JSONB),
--     never `public.workouts` directly (grep: zero `.from('workouts')` in
--     flutter_app/lib) — the mobile dashboard is NOT affected.
--   - The web portal's GDPR-style personal data export
--     (app/(frontend)/[locale]/app/export/ExportDataClient.tsx) DOES read
--     `public.workouts` directly client-side — an affected user's export
--     would show the same workout twice.
--   - Independent of any UI: extra storage/egress rows, and a broken
--     idempotency/correctness guarantee (Blocker 2 was not fully closed for
--     the start/end-drift case).
--
-- Fix: (1) a same-probable-session test that is NOT "any overlap" — both an
-- absolute start-delta gate AND a containment-ratio gate must pass, with
-- thresholds derived from the 5 real pairs (see below); (2) a
-- pg_advisory_xact_lock scoped to user+device+type+day so two genuinely
-- concurrent requests serialize instead of both missing each other's
-- not-yet-committed insert; (3) ambiguous multi-candidate matches fail
-- closed (no destructive merge, structural non-PII diagnostic logged,
-- falls through to a plain insert); (4) explicit, monotonic field-merge
-- rules (documented per-field below) instead of a blind
-- coalesce(new, old); (5) the original exact-tuple unique index
-- (workouts_canonical_idx) is untouched and stays wired as a second line of
-- defense via ON CONFLICT.
--
-- Thresholds (measured against the 5 real production pairs, 2026-07-22):
--   start_ms delta observed: 0, 0, 16000, 24733, 92937 ms (max ~93s)
--   containment ratio observed (overlap / shorter duration): 0.919, 1.0,
--     1.0, 0.996, 0.998 (min ~91.9%)
-- Chosen: start delta <= 120000ms (2x the observed max, still tight enough
-- that two back-to-back real workouts of the same type never qualify — see
-- test F) AND containment >= 0.90 (below the observed min with margin, but
-- high enough that a merely-adjacent-and-partially-overlapping distinct
-- session cannot qualify). Both gates required (AND), not "any overlap".

create or replace function public.upsert_workouts_v189(p_row jsonb)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (p_row->>'user_id')::uuid;
  v_device_id uuid := (p_row->>'device_id')::uuid;
  v_start_ms bigint;
  v_end_ms bigint;
  v_type text := p_row->>'type';
  v_norm_type text := coalesce(lower(trim(v_type)), '');
  v_lock_day text;
  v_lock_key bigint;
  v_candidates bigint[];
  v_candidate_id bigint;
  v_existing_start bigint;
  v_existing_end bigint;
  v_existing_dur bigint;
  v_incoming_dur bigint;
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

  v_start_ms := (p_row->>'start_ms')::bigint;
  v_end_ms := (p_row->>'end_ms')::bigint;
  if v_end_ms <= v_start_ms then
    raise exception 'upsert_workouts_v189: end_ms must be after start_ms' using errcode = '22004';
  end if;

  -- Serialize concurrent upserts for the same probable identity. Scope is a
  -- coordination key only, not a correctness boundary (the match test below
  -- decides same-session, not this bucket). A workout starting within ~120s
  -- of UTC midnight could in theory race across two adjacent day buckets;
  -- accepted as a vanishingly rare edge case, not solved here.
  v_lock_day := to_char(to_timestamp(v_start_ms / 1000.0) at time zone 'UTC', 'YYYY-MM-DD');
  v_lock_key := hashtextextended(v_user_id::text || ':' || v_device_id::text || ':' || v_norm_type || ':' || v_lock_day, 0);
  perform pg_advisory_xact_lock(v_lock_key);

  select array_agg(w.id) into v_candidates
  from public.workouts w
  where w.user_id = v_user_id
    and w.device_id = v_device_id
    and coalesce(lower(trim(w.type)), '') = v_norm_type
    and w.is_canonical is true
    and abs(w.start_ms - v_start_ms) <= 120000
    and least(w.end_ms, v_end_ms) - greatest(w.start_ms, v_start_ms)
        >= 0.90 * least(w.end_ms - w.start_ms, v_end_ms - v_start_ms);

  if v_candidates is not null and array_length(v_candidates, 1) > 1 then
    -- Ambiguous: more than one existing canonical row matches. Fail closed —
    -- no destructive merge. Structural diagnostic only (ids + ms, no PII);
    -- falls through to the plain insert below so the sync still succeeds.
    raise warning 'upsert_workouts_v189: ambiguous merge candidates user=% device=% type=% candidates=% incoming_start=% incoming_end=%',
      v_user_id, v_device_id, v_norm_type, v_candidates, v_start_ms, v_end_ms;
  elsif v_candidates is not null and array_length(v_candidates, 1) = 1 then
    v_candidate_id := v_candidates[1];

    select w.start_ms, w.end_ms into v_existing_start, v_existing_end
    from public.workouts w where w.id = v_candidate_id;
    v_existing_dur := v_existing_end - v_existing_start;
    v_incoming_dur := v_end_ms - v_start_ms;

    -- Exactly one candidate recognized as the same session: enrich in place.
    -- Field rules (explicit, not a blind coalesce):
    --   start_ms/end_ms: union of both windows (least/greatest) -- the
    --     session boundary can only widen as more of it is observed.
    --   duration_min: greatest of existing, incoming, and the duration
    --     implied by the merged window -- never regresses, always consistent
    --     with the widened window.
    --   distance_meters/calories_kcal/intensity minutes: greatest -- these
    --     accumulate over the session and can only be >= a partial reading;
    --     a smaller/absent later value can never erase a larger stored one.
    --     Postgres GREATEST/LEAST ignore NULLs (return NULL only if all
    --     inputs are NULL), so this also enriches from NULL for free.
    --   hr_max: greatest, hr_min: least -- the true session peak/trough can
    --     only be revealed to be more extreme as more samples arrive.
    --   hr_avg/pace_sec_per_km: derived averages can't be safely combined
    --     without sample weights we don't store, so we trust whichever side
    --     covers the WIDER raw window (its own start_ms..end_ms span) since
    --     that average reflects more of the actual session; ties keep the
    --     existing value to avoid pointless churn, falling back to the
    --     incoming value only to fill a gap.
    --   title/notes: enrich only if currently missing/empty -- never let an
    --     automated re-sync silently replace a value already set.
    update public.workouts w set
      start_ms = least(w.start_ms, v_start_ms),
      end_ms = greatest(w.end_ms, v_end_ms),
      duration_min = greatest(
        w.duration_min, (p_row->>'duration_min')::int,
        ((greatest(w.end_ms, v_end_ms) - least(w.start_ms, v_start_ms)) / 60000)::int
      ),
      title = coalesce(nullif(w.title, ''), nullif(p_row->>'title', '')),
      distance_meters = greatest(w.distance_meters, (p_row->>'distance_meters')::numeric),
      calories_kcal = greatest(w.calories_kcal, (p_row->>'calories_kcal')::numeric),
      hr_max = greatest(w.hr_max, (p_row->>'hr_max')::int),
      hr_min = least(w.hr_min, (p_row->>'hr_min')::int),
      hr_avg = case
        when v_incoming_dur > v_existing_dur then coalesce((p_row->>'hr_avg')::int, w.hr_avg)
        else coalesce(w.hr_avg, (p_row->>'hr_avg')::int)
      end,
      pace_sec_per_km = case
        when v_incoming_dur > v_existing_dur then coalesce((p_row->>'pace_sec_per_km')::int, w.pace_sec_per_km)
        else coalesce(w.pace_sec_per_km, (p_row->>'pace_sec_per_km')::int)
      end,
      intensity_minutes_moderate = greatest(w.intensity_minutes_moderate, (p_row->>'intensity_minutes_moderate')::int),
      intensity_minutes_vigorous = greatest(w.intensity_minutes_vigorous, (p_row->>'intensity_minutes_vigorous')::int),
      notes = coalesce(nullif(w.notes, ''), nullif(p_row->>'notes', ''))
    where w.id = v_candidate_id and w.user_id = auth.uid()
    returning w.id into v_id;

    return v_id;
  end if;

  -- No candidate (or ambiguous, handled above by falling through here):
  -- plain insert. workouts_canonical_idx (exact-tuple, untouched by this
  -- migration) stays wired as a second line of defense via ON CONFLICT --
  -- normally unreachable now that the lock+candidate-search above closes the
  -- race, but kept in case of a residual edge case.
  insert into public.workouts (
    user_id, device_id, start_ms, end_ms, type, title, duration_min,
    distance_meters, calories_kcal, hr_avg, hr_max, hr_min, pace_sec_per_km,
    intensity_minutes_moderate, intensity_minutes_vigorous, notes, is_canonical
  ) values (
    v_user_id, v_device_id, v_start_ms, v_end_ms, v_type,
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
    title = coalesce(nullif(workouts.title, ''), nullif(excluded.title, '')),
    duration_min = greatest(workouts.duration_min, excluded.duration_min),
    distance_meters = greatest(workouts.distance_meters, excluded.distance_meters),
    calories_kcal = greatest(workouts.calories_kcal, excluded.calories_kcal),
    hr_max = greatest(workouts.hr_max, excluded.hr_max),
    hr_min = least(workouts.hr_min, excluded.hr_min),
    hr_avg = coalesce(workouts.hr_avg, excluded.hr_avg),
    pace_sec_per_km = coalesce(workouts.pace_sec_per_km, excluded.pace_sec_per_km),
    intensity_minutes_moderate = greatest(workouts.intensity_minutes_moderate, excluded.intensity_minutes_moderate),
    intensity_minutes_vigorous = greatest(workouts.intensity_minutes_vigorous, excluded.intensity_minutes_vigorous),
    notes = coalesce(nullif(workouts.notes, ''), nullif(excluded.notes, ''))
  where workouts.user_id = auth.uid()
  returning id into v_id;

  return v_id;
end;
$$;

-- Grants unchanged (already anon=false/authenticated=true from
-- 20260722091000 + 20260722110000); re-asserted so this migration is
-- self-contained.
revoke all on function public.upsert_workouts_v189(jsonb) from public;
grant execute on function public.upsert_workouts_v189(jsonb) to authenticated;
