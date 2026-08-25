-- Sprint 6 (v3.0.0+86): chiusura gap vs Health Sync — nuove metriche da BPM,
-- glucometri, app idratazione, contatori nutrizionali, frequenza respiratoria.
-- Tutte nullable: utenti senza device dedicato non vengono penalizzati.

ALTER TABLE public.fitness_metrics
  ADD COLUMN IF NOT EXISTS blood_pressure_systolic numeric,
  ADD COLUMN IF NOT EXISTS blood_pressure_diastolic numeric,
  ADD COLUMN IF NOT EXISTS blood_glucose_mgdl numeric,
  ADD COLUMN IF NOT EXISTS water_ml integer,
  ADD COLUMN IF NOT EXISTS respiratory_rate_bpm numeric,
  ADD COLUMN IF NOT EXISTS nutrition_kcal_in numeric;

COMMENT ON COLUMN public.fitness_metrics.blood_pressure_systolic IS
  'Pressione sistolica mmHg (media giorno). Da BPM Withings/Omron via Health Connect.';
COMMENT ON COLUMN public.fitness_metrics.blood_pressure_diastolic IS
  'Pressione diastolica mmHg (media giorno). Da BPM Withings/Omron via Health Connect.';
COMMENT ON COLUMN public.fitness_metrics.blood_glucose_mgdl IS
  'Glicemia mg/dL (media giorno). Da Libre LinkUp / Dexcom via Health Connect.';
COMMENT ON COLUMN public.fitness_metrics.water_ml IS
  'Idratazione totale ml (somma giorno). Da app water tracker via Health Connect.';
COMMENT ON COLUMN public.fitness_metrics.respiratory_rate_bpm IS
  'Frequenza respiratoria respiri/min (media giorno). Da Galaxy Watch / Fitbit via HC.';
COMMENT ON COLUMN public.fitness_metrics.nutrition_kcal_in IS
  'Kcal ingerite (somma giorno). Da MyFitnessPal / Yazio via Health Connect (NUTRITION).';
