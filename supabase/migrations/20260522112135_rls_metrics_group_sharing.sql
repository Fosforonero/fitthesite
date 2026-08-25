-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 20260522120006 — RLS cross-user: fitness_metrics via Mesh Groups
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTA ARCHITETTURALE: fitness_metrics usa schema WIDE-ROW (una riga = finestra
-- temporale con colonne separate per ogni metrica). Non esiste una colonna
-- metric_key/metric_type. La policy opera quindi a livello di riga intera.
--
-- Mapping preset → colonne considerate "presenti" per autorizzare la SELECT:
--   activity → steps, active_calories_kcal, distance_meters, floors_climbed,
--               elevation_gained_meters, exercise_sessions
--   base     → activity + sleep_minutes/start/end, heart_rate_bpm,
--               resting_heart_rate_bpm, hrv_rmssd
--   full     → tutte le righe (nessun filtro su colonne)
--   custom   → custom_types mappa a gruppi di colonne (vedi funzione)
--
-- Limitazione consapevole: RLS non può mascherare singole colonne; se il preset
-- è 'activity', il caller vede l'intera riga (inclusi campi NULL). Il filtro
-- garantisce che righe prive di dati activity NON vengano esposte.
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: controlla se il caller ha accesso a una riga fitness_metrics
-- del target utente, basandosi su share_settings del membro nel gruppo.
-- La funzione è STABLE (no side effects), SECURITY DEFINER con search_path fisso.
CREATE OR REPLACE FUNCTION public.user_shares_metric_with_caller(
  p_owner_uid   uuid,
  -- Flags che indicano quali categorie di dati sono presenti nella riga.
  -- Passati dalla policy per evitare di re-leggere la riga dentro la funzione.
  p_has_activity  boolean,  -- steps / active_calories / distance / exercise
  p_has_sleep     boolean,  -- sleep_minutes / sleep_start_ms / sleep_end_ms
  p_has_heart     boolean,  -- heart_rate_bpm / resting_heart_rate_bpm / hrv_rmssd
  p_has_body      boolean,  -- weight_kg, height_cm, bmi, spo2, skin_temp
  p_has_nutrition boolean   -- calories_kcal, water_ml, nutrition_kcal_in
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm_target
    JOIN public.group_members gm_caller
      ON  gm_caller.group_id = gm_target.group_id
      AND gm_caller.left_at  IS NULL
    WHERE gm_target.user_id  = p_owner_uid
      AND gm_target.left_at  IS NULL
      AND gm_caller.user_id  = auth.uid()
      -- Non mostrare al caller se è nella lista hide_from del target
      AND NOT (
        auth.uid()::text = ANY(
          SELECT jsonb_array_elements_text(
            coalesce(gm_target.share_settings -> 'hide_from', '[]'::jsonb)
          )
        )
      )
      -- La riga deve contenere almeno un dato che il preset del target autorizza
      AND (
        CASE gm_target.share_settings ->> 'preset'
          WHEN 'activity' THEN
            p_has_activity
          WHEN 'base' THEN
            p_has_activity OR p_has_sleep OR p_has_heart
          WHEN 'full' THEN
            true
          WHEN 'custom' THEN (
            (p_has_activity  AND 'activity'   = ANY(
              SELECT jsonb_array_elements_text(gm_target.share_settings -> 'custom_types')
            )) OR
            (p_has_sleep     AND 'sleep'      = ANY(
              SELECT jsonb_array_elements_text(gm_target.share_settings -> 'custom_types')
            )) OR
            (p_has_heart     AND 'heart_rate' = ANY(
              SELECT jsonb_array_elements_text(gm_target.share_settings -> 'custom_types')
            )) OR
            (p_has_body      AND 'body'       = ANY(
              SELECT jsonb_array_elements_text(gm_target.share_settings -> 'custom_types')
            )) OR
            (p_has_nutrition AND 'nutrition'  = ANY(
              SELECT jsonb_array_elements_text(gm_target.share_settings -> 'custom_types')
            ))
          )
          ELSE false
        END
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_shares_metric_with_caller(
  uuid, boolean, boolean, boolean, boolean, boolean
) TO authenticated;

-- ─── Policy SELECT cross-user via Mesh Group ────────────────────────────────
-- Aggiunta a quelle esistenti ("users select own metrics",
-- "caregiver select subjects metrics").
-- USING usa OR implicito con le altre policy (tutte FOR SELECT TO authenticated).
CREATE POLICY metrics_select_via_group
  ON public.fitness_metrics
  FOR SELECT
  TO authenticated
  USING (
    public.user_shares_metric_with_caller(
      user_id,
      -- p_has_activity
      (steps IS NOT NULL OR active_calories_kcal IS NOT NULL
       OR distance_meters IS NOT NULL OR floors_climbed IS NOT NULL
       OR elevation_gained_meters IS NOT NULL OR exercise_sessions IS NOT NULL),
      -- p_has_sleep
      (sleep_minutes IS NOT NULL OR sleep_start_ms IS NOT NULL),
      -- p_has_heart
      (heart_rate_bpm IS NOT NULL OR resting_heart_rate_bpm IS NOT NULL
       OR hrv_rmssd IS NOT NULL),
      -- p_has_body
      (weight_kg IS NOT NULL OR height_cm IS NOT NULL OR bmi IS NOT NULL
       OR spo2_percent IS NOT NULL OR skin_temperature_c IS NOT NULL),
      -- p_has_nutrition
      (calories_kcal IS NOT NULL OR water_ml IS NOT NULL
       OR nutrition_kcal_in IS NOT NULL)
    )
  );