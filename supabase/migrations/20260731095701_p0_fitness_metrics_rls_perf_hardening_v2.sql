-- P0 RLS hotfix — Fase C v2: migration corretta (TO authenticated esplicito).
-- Corregge il primo apply (30/07, rollbackato) che ometteva TO authenticated,
-- lasciando le policy scoped a PUBLIC invece di authenticated. Validata
-- localmente (Postgres disposable): 24/24 matrice sicurezza + guardrail
-- scope ruoli, sia contro la baseline sia dopo questa migration, sia dopo
-- il rollback corretto (06_rollback.sql). Nessun aumento di
-- statement_timeout, nessun cambiamento al contratto caregiver/gruppo
-- (vedi commenti completi in docs/build190/p0-rls-hotfix/local-disposable/05_migration_candidate.sql).

create schema if not exists rls_internal;

alter function public.user_shares_metric_with_caller(
  uuid, boolean, boolean, boolean, boolean, boolean
) set schema rls_internal;

drop policy "caregiver select subjects metrics" on public.fitness_metrics;
create policy "caregiver select subjects metrics" on public.fitness_metrics
  for select
  to authenticated
  using (
    user_id in (
      select cl.subject_id
      from public.caregiver_links cl
      join public.privacy_consents pc on pc.user_id = cl.subject_id
      where cl.caregiver_id = (select auth.uid())
        and cl.revoked_at is null
        and (cl.expires_at is null or cl.expires_at > now())
        and 'view_dashboard' = any (cl.permissions)
        and pc.caregiver_share = true
    )
  );

drop policy "metrics_select_via_group" on public.fitness_metrics;
create policy "metrics_select_via_group" on public.fitness_metrics
  for select
  to authenticated
  using (
    user_id in (
      select gm_target.user_id
      from public.group_members gm_target
      join public.group_members gm_caller
        on gm_caller.group_id = gm_target.group_id
        and gm_caller.left_at is null
      where gm_target.left_at is null
        and gm_caller.user_id = (select auth.uid())
    )
    and rls_internal.user_shares_metric_with_caller(
      user_id,
      (steps is not null) or (active_calories_kcal is not null)
        or (distance_meters is not null) or (floors_climbed is not null)
        or (elevation_gained_meters is not null) or (exercise_sessions is not null),
      (sleep_minutes is not null) or (sleep_start_ms is not null),
      (heart_rate_bpm is not null) or (resting_heart_rate_bpm is not null)
        or (hrv_rmssd is not null),
      (weight_kg is not null) or (height_cm is not null) or (bmi is not null)
        or (spo2_percent is not null) or (skin_temperature_c is not null),
      (calories_kcal is not null) or (water_ml is not null)
        or (nutrition_kcal_in is not null)
    )
  );
