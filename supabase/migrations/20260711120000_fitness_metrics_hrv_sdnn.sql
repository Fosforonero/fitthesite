-- ─────────────────────────────────────────────────────────
-- Migration — HRV metric identity: split SDNN from RMSSD
-- iOS/HealthKit only exposes SDNN; Health Connect, Oura and Suunto expose
-- RMSSD. Both were being written into hrv_rmssd. This adds hrv_sdnn as a
-- sibling column so the two are never conflated again. Historical
-- hrv_rmssd rows written from an iOS source remain ambiguous — NOT
-- reclassified here, see the separate, decoupled, LATER-gated proposal in
-- 20260711120001_fitness_metrics_hrv_historical_correction.sql (do not
-- apply that one until this column exists AND the write path is confirmed
-- live — see its own header for the full prerequisite order).
-- ⚠️ REVIEW ONLY — do not apply until Matteo confirms the Supabase
-- connector points at the real FitMesh project and approves the run.
-- ─────────────────────────────────────────────────────────

alter table public.fitness_metrics
  add column if not exists hrv_sdnn int;

comment on column public.fitness_metrics.hrv_rmssd is
  'RMSSD (ms). Genuine RMSSD only: Health Connect (Android wearables), Oura, Suunto. Never SDNN — see hrv_sdnn.';

comment on column public.fitness_metrics.hrv_sdnn is
  'SDNN (ms). Apple HealthKit exposes only SDNN, never RMSSD. Not directly comparable to hrv_rmssd — different algorithm, do not merge or average with it.';
