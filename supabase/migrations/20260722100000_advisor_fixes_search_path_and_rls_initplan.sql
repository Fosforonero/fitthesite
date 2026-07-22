-- Sprint 189-RC2 correction: security follow-up, "rieseguire advisor
-- security/performance" per Matteo's re-open message. Fixes ONLY the
-- advisor findings introduced or touched by this sprint's own migrations
-- (20260721180000, 20260722090000, 20260722091000) — the other ~150
-- pre-existing findings across unrelated tables (Family Mesh, gyms,
-- challenges, beta signups, etc.) are NOT this sprint's scope and are left
-- untouched, exactly like the pre-existing public.workouts duplication debt
-- was flagged rather than silently fixed or silently ignored.
--
-- 1. function_search_path_mutable (4 findings): the internal.* helper
--    functions never got an explicit search_path, unlike the two outer RPCs
--    which already had `set search_path = pg_catalog, public`. Every call
--    inside them is already schema-qualified or a pg_catalog builtin, so
--    this was not exploitable in practice — but there is no reason to leave
--    a mutable search_path on a function the linter flags, when the fix is
--    one line each.
-- 2. auth_rls_initplan (2 findings, both on policies this sprint created or
--    rewrote): `auth.uid()` unwrapped gets re-evaluated per row; wrapping as
--    `(select auth.uid())` lets Postgres evaluate it once via an InitPlan.
--    Same fix Supabase's own linter doc recommends. Does not change the
--    security semantics (RLS behavior is identical), only the plan.

alter function internal._merge_exercise_sessions_jsonb(jsonb, jsonb) set search_path = pg_catalog, public;
alter function internal._merge_intraday_hr_jsonb(jsonb, jsonb, boolean) set search_path = pg_catalog, public;
alter function internal._sleep_session_count_jsonb(jsonb) set search_path = pg_catalog, public;
alter function internal._merge_sleep_stages_jsonb(jsonb, jsonb) set search_path = pg_catalog, public;

alter policy "users update own metrics" on public.fitness_metrics
  using (user_id = (select auth.uid()) and local_day_key is not null)
  with check (user_id = (select auth.uid()) and local_day_key is not null);

alter policy "users update own workouts notes" on public.workouts
  using (user_id = (select auth.uid()) and is_canonical is true)
  with check (user_id = (select auth.uid()) and is_canonical is true);
