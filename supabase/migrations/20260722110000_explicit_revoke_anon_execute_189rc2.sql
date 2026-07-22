-- Sprint 189-RC2 closure, Matteo's final ask: an explicit, self-contained,
-- auditable REVOKE EXECUTE ... FROM anon on the 189-RC2 write-path functions,
-- rather than relying on the transitive effect of `revoke all ... from
-- public` in the migrations that created them. Functionally equivalent
-- (anon was never granted EXECUTE on any of these; `revoke all from public`
-- already removes the implicit PUBLIC-wide grant every role inherits), but
-- this migration makes the anon-denial a first-class, directly-reviewable
-- statement instead of something a reviewer has to infer.
--
-- No body, merge semantics, index, or data change of any kind — grants only.
--
-- Matteo's list was 5 functions; a 6th of the exact same class
-- (internal._merge_sleep_stages_jsonb, the sleep-lossless-merge helper added
-- in 20260722090000) is included too for consistency — it just wasn't on the
-- list, not a scope expansion: same helper category, same migration set,
-- same reasoning applies.

revoke execute on function public.upsert_fitness_metrics_v189(jsonb) from anon;
revoke execute on function public.upsert_workouts_v189(jsonb) from anon;
revoke execute on function internal._merge_exercise_sessions_jsonb(jsonb, jsonb) from anon;
revoke execute on function internal._merge_intraday_hr_jsonb(jsonb, jsonb, boolean) from anon;
revoke execute on function internal._sleep_session_count_jsonb(jsonb) from anon;
revoke execute on function internal._merge_sleep_stages_jsonb(jsonb, jsonb) from anon;

-- Re-asserted explicitly (already true from the migrations that created each
-- function) so this migration is self-contained and doesn't require
-- cross-referencing prior migrations to confirm `authenticated` still works.
grant execute on function public.upsert_fitness_metrics_v189(jsonb) to authenticated;
grant execute on function public.upsert_workouts_v189(jsonb) to authenticated;
grant execute on function internal._merge_exercise_sessions_jsonb(jsonb, jsonb) to authenticated;
grant execute on function internal._merge_intraday_hr_jsonb(jsonb, jsonb, boolean) to authenticated;
grant execute on function internal._sleep_session_count_jsonb(jsonb) to authenticated;
grant execute on function internal._merge_sleep_stages_jsonb(jsonb, jsonb) to authenticated;
