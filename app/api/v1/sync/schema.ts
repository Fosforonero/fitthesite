/**
 * Contratto payload + mapping riga `fitness_metrics` per POST /api/v1/sync.
 * Estratto da route.ts (Sprint 187B Phase 2) per essere testabile senza
 * Next.js/Supabase: pura validazione Zod + costruzione oggetto insert.
 */
import { z } from "zod";

/** Parsa stringhe JSON in oggetti, passa through se già objects/arrays. */
function _parseJsonString(val: unknown): unknown {
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

// Contratto normalizzato: type (identificativo stabile) e title (titolo
// genuino custom) sono la coppia primaria; name e' accettato come input
// legacy (client pre-fix "Workout Identity Preservation" che mandano solo
// questo) e sourceApp preserva la provenienza. Prima, name/sourceApp non
// erano nello schema: z.object() senza .passthrough() li scartava in
// silenzio, quindi le righe finivano in fitness_metrics.exercise_sessions
// SENZA alcun identificativo di attivita' per i client vecchi.
export const exerciseSessionSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  startMs: z.number().int(),
  endMs: z.number().int(),
  durationMin: z.number().int().optional(),
  distanceMeters: z.number().optional(),
  caloriesKcal: z.number().optional(),
  hrAvg: z.number().int().optional(),
  hrMax: z.number().int().optional(),
  hrMin: z.number().int().optional(),
  paceSecPerKm: z.number().int().optional(),
  steps: z.number().int().optional(),
  sourceApp: z.string().optional(),
});

export const payloadSchema = z.object({
  schemaVersion: z.number().int().default(1),
  source: z.string().nullish(),
  windowStartMillis: z.number().int(),
  windowEndMillis: z.number().int(),
  collectedAtMillis: z.number().int(),
  // Metriche aggregate (tutte opzionali — non sempre tutte popolate)
  steps: z.number().int().nullish(),
  heartRateBpm: z.number().nullish(),
  restingHeartRateBpm: z.number().int().nullish(),
  spo2Percent: z.number().nullish(),
  caloriesKcal: z.number().nullish(),
  activeCaloriesKcal: z.number().nullish(),
  basalMetabolicRateKcal: z.number().nullish(),
  sleepMinutes: z.number().int().nullish(),
  sleepStartMillis: z.number().int().nullish(),
  sleepEndMillis: z.number().int().nullish(),
  distanceMeters: z.number().nullish(),
  // Health Connect emette HRV come float (es. 45.3 ms) ma la colonna DB è
  // integer. Accetto float, arrotondo prima dell'insert. Stesso per floors.
  // hrvRmssd (Health Connect/Oura/Suunto) e hrvSdnn (iOS/HealthKit) sono
  // ALGORITMI DIVERSI, mai la stessa metrica: colonne separate end-to-end,
  // mai derivate l'una dall'altra, mai sommate o mediate insieme qui o a
  // valle (Sprint 187B Phase 2).
  hrvRmssd: z.number().nullish(),
  hrvSdnn: z.number().nullish(),
  stressAvg: z.number().nullish(),
  vo2Max: z.number().nullish(),
  floorsClimbed: z.number().nullish(),
  elevationGainedMeters: z.number().nullish(),
  skinTemperatureC: z.number().nullish(),
  weightKg: z.number().nullish(),
  heightCm: z.number().nullish(),
  bmi: z.number().nullish(),
  respiratoryRate: z.number().nullish(),
  // v3.0.0+86 (Sprint 6: copertura metriche estese).
  // Tutti optional/nullable: utenti senza BPM/Libre/MyFitnessPal vedono nulla
  // in dashboard ma il sync resta valido per le altre metriche.
  bloodPressureSystolic: z.number().nullish(),
  bloodPressureDiastolic: z.number().nullish(),
  glucoseMgDl: z.number().nullish(),
  waterMl: z.number().int().nullish(),
  respiratoryRateBpm: z.number().nullish(),
  nutritionKcalIn: z.number().nullish(),
  // Samsung Health Monitor: esito di rischio apnea, non indice AHI.
  sleepApneaDetected: z.boolean().nullish(),
  // Breakdown intraday (JSONB). L'app Flutter li manda come stringhe JSON
  // (legacy Kotlin format) con suffisso "Json". Accettiamo entrambi via
  // preprocess che parsa string → object.
  // Backward-compat: accettiamo anche i nomi senza suffisso "Json".
  intradayStepsJson: z
    .preprocess(_parseJsonString, z.unknown())
    .nullish(),
  intradayHrJson: z
    .preprocess(_parseJsonString, z.unknown())
    .nullish(),
  intradayCaloriesJson: z
    .preprocess(_parseJsonString, z.unknown())
    .nullish(),
  sleepStagesJson: z
    .preprocess(_parseJsonString, z.unknown())
    .nullish(),
  // Alias senza suffisso (per future versioni app che potrebbero spedire
  // come array nativi invece che string).
  intradaySteps: z.unknown().nullish(),
  intradayHr: z.unknown().nullish(),
  intradayCalories: z.unknown().nullish(),
  sleepStages: z.unknown().nullish(),
  // L'app Flutter serializza exercise_sessions come JSON STRING (legacy
  // dal Kotlin v2.8.x). Preprocess: se arriva come string, parsa; altrimenti
  // passa through. Robusto a entrambi i formati.
  exerciseSessionsJson: z
    .preprocess((val) => {
      if (typeof val !== "string") return val;
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }, z.array(exerciseSessionSchema).nullish())
    .nullish(),
  sourceDevice: z.string().nullish(),
  sourcePackage: z.string().nullish(),
  // v101 — multi-source HR picker
  hrSourceName: z.string().max(120).nullish(),
  hrSourceQuality: z
    .enum(["premium", "standard", "basic", "unknown"])
    .nullish(),
  // Metadata client (opzionale, per UPDATE devices)
  appVersion: z.string().nullish(),
  osVersion: z.string().nullish(),
});

export type SyncPayload = z.infer<typeof payloadSchema>;

/**
 * Riga `fitness_metrics` dal payload validato. Pura: nessuna dipendenza da
 * Supabase/Next, quindi testabile in isolamento (vedi schema.test.ts).
 * hrv_rmssd e hrv_sdnn restano SEMPRE colonne indipendenti — non toccarle
 * insieme, non far scrivere all'una il fallback dell'altra.
 */
export function buildFitnessMetricsRow(
  p: SyncPayload,
  ctx: { userId: string; deviceId: string },
) {
  return {
    user_id: ctx.userId,
    device_id: ctx.deviceId,
    schema_version: p.schemaVersion,
    source: p.source ?? null,
    window_start_ms: p.windowStartMillis,
    window_end_ms: p.windowEndMillis,
    collected_at_ms: p.collectedAtMillis,
    steps: p.steps ?? null,
    heart_rate_bpm: p.heartRateBpm ?? null,
    resting_heart_rate_bpm: p.restingHeartRateBpm ?? null,
    spo2_percent: p.spo2Percent ?? null,
    calories_kcal: p.caloriesKcal ?? null,
    active_calories_kcal: p.activeCaloriesKcal ?? null,
    sleep_minutes: p.sleepMinutes ?? null,
    sleep_start_ms: p.sleepStartMillis ?? null,
    sleep_end_ms: p.sleepEndMillis ?? null,
    distance_meters: p.distanceMeters ?? null,
    hrv_rmssd: p.hrvRmssd == null ? null : Math.round(p.hrvRmssd),
    hrv_sdnn: p.hrvSdnn == null ? null : Math.round(p.hrvSdnn),
    stress_avg: p.stressAvg == null ? null : Math.round(p.stressAvg),
    vo2_max: p.vo2Max ?? null,
    floors_climbed:
      p.floorsClimbed == null ? null : Math.round(p.floorsClimbed),
    elevation_gained_meters: p.elevationGainedMeters ?? null,
    skin_temperature_c: p.skinTemperatureC ?? null,
    weight_kg: p.weightKg ?? null,
    height_cm: p.heightCm ?? null,
    bmi: p.bmi ?? null,
    // Preferisci alias *Json (Kotlin format) ma fallback a non-Json.
    intraday_steps: p.intradayStepsJson ?? p.intradaySteps ?? null,
    intraday_hr: p.intradayHrJson ?? p.intradayHr ?? null,
    intraday_calories: p.intradayCaloriesJson ?? p.intradayCalories ?? null,
    sleep_stages: p.sleepStagesJson ?? p.sleepStages ?? null,
    exercise_sessions: p.exerciseSessionsJson ?? null,
    source_device: p.sourceDevice ?? null,
    source_package: p.sourcePackage ?? null,
    hr_source_name: p.hrSourceName ?? null,
    hr_source_quality: p.hrSourceQuality ?? null,
    // v3.0.0+86 — gap closure. Pattern cast come `auto-claim/route.ts`:
    // colonne aggiunte dopo i types generati, cast a Sb mantiene compatibilità.
    blood_pressure_systolic: p.bloodPressureSystolic ?? null,
    blood_pressure_diastolic: p.bloodPressureDiastolic ?? null,
    blood_glucose_mgdl: p.glucoseMgDl ?? null,
    water_ml: p.waterMl ?? null,
    // respiratoryRateBpm preferito sul legacy respiratoryRate (alias).
    respiratory_rate_bpm: p.respiratoryRateBpm ?? p.respiratoryRate ?? null,
    nutrition_kcal_in: p.nutritionKcalIn ?? null,
    sleep_apnea_detected: p.sleepApneaDetected ?? null,
  };
}
