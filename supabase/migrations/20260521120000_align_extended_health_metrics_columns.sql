-- ─────────────────────────────────────────────────────────
-- Allineamento baseline — colonne salute estese di fitness_metrics
--
-- NON e' una feature: e' la storia versionata che recupera uno stato gia'
-- vivo in produzione. Le sei colonne sotto sono scritte da
-- `app/api/v1/sync/route.ts` (lotto "v3.0.0+86 — gap closure") ma non erano
-- create da nessuna delle 55 migration del repository. Senza di esse la
-- catena si ferma su 20260522120006_rls_health_data_group_sharing.sql, la cui
-- policy `metrics_select_via_group` le referenzia:
--
--     ERROR: column "water_ml" does not exist (SQLSTATE 42703)
--
-- Tipi presi dalla verifica read-only sulla produzione (Matteo, 07/08/2026):
-- cinque `numeric` SENZA precisione e scala fissate, `water_ml` `integer`,
-- tutte nullable e senza default. Non sono stati inventati vincoli che la
-- produzione non ha.
--
-- COLLOCAZIONE: la data reale in cui le colonne sono comparse in produzione
-- non e' ricostruibile (sono state applicate fuori dalle migration, e la
-- history di produzione non le registra). Questo file e' quindi collocato nel
-- punto piu' tardo che resta corretto: dopo la creazione di fitness_metrics
-- (20260513120003) e prima del primo consumatore (20260522120006).
--
-- Nessun apply sulla produzione, nessun dato toccato.
-- ─────────────────────────────────────────────────────────

alter table public.fitness_metrics
  add column if not exists blood_pressure_systolic numeric,
  add column if not exists blood_pressure_diastolic numeric,
  add column if not exists blood_glucose_mgdl numeric,
  add column if not exists water_ml integer,
  add column if not exists respiratory_rate_bpm numeric,
  add column if not exists nutrition_kcal_in numeric;
