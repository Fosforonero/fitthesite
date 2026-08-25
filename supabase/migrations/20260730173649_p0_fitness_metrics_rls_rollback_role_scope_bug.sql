-- ROLLBACK immediato di p0_fitness_metrics_rls_perf_hardening (20260730173213).
-- Motivo: le due policy ricreate sono finite con roles={public} invece di
-- roles={authenticated} (TO authenticated omesso per errore nel CREATE
-- POLICY) — un cambiamento di accesso reale rispetto alla baseline, anche
-- se il qual blocca comunque anon/estranei nei test read-only eseguiti.
-- Per istruzione esplicita: rollback immediato se cambia l'accesso.
-- Ripristina ESATTAMENTE lo stato pre-apply (verificato localmente 24/24
-- PASS dopo questo stesso rollback script sul Postgres disposable).

alter function rls_internal.user_shares_metric_with_caller(
  uuid, boolean, boolean, boolean, boolean, boolean
) set schema public;

drop policy if exists "caregiver select subjects metrics" on public.fitness_metrics;
create policy "caregiver select subjects metrics" on public.fitness_metrics
  for select
  using (
    exists (
      select 1
      from public.caregiver_links cl
      join public.privacy_consents pc on pc.user_id = cl.subject_id
      where cl.caregiver_id = auth.uid()
        and cl.subject_id = fitness_metrics.user_id
        and cl.revoked_at is null
        and (cl.expires_at is null or cl.expires_at > now())
        and 'view_dashboard' = any (cl.permissions)
        and pc.caregiver_share = true
    )
  );

drop policy if exists "metrics_select_via_group" on public.fitness_metrics;
create policy "metrics_select_via_group" on public.fitness_metrics
  for select
  using (
    public.user_shares_metric_with_caller(
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

drop schema if exists rls_internal;
