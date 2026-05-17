/**
 * POST /api/v1/sync — ingest payload salute dall'app mobile.
 *
 * Auth: Bearer JWT (Supabase). Required.
 * Device: header `X-Device-Fingerprint` corrispondente al `device_fingerprint`
 *   registrato in `devices` per questo user. Se non trovato → 404 (forza pair).
 *
 * Flow:
 *   1. requireUser(req) → userId + user-bound supabase client
 *   2. extract fingerprint header → lookup devices(user_id, fingerprint, NOT revoked)
 *   3. validate payload con Zod
 *   4. INSERT in fitness_metrics via user-bound client (RLS policy
 *      "users insert own metrics" enforced — migration 007)
 *   5. INSERT in workouts per ogni exercise_session (se presente)
 *   6. UPDATE devices.last_seen_at + app_version + os_version
 *
 * Risposte:
 *   200 { ok: true, metricsId }
 *   400 invalid_payload
 *   401 missing/invalid token
 *   404 device_not_paired
 *   500 server_error
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { jsonError, jsonOk, requireUser } from "@/lib/api/auth-helpers";

// Cast a SupabaseClient generico (senza Database) perché i types non sono
// ancora rigenerati post-migrations 003-007. Da rimuovere quando avremo
// fatto `npm run supabase:gen-types`.
type Sb = SupabaseClient;

/** Parsa stringhe JSON in oggetti, passa through se già objects/arrays. */
function _parseJsonString(val: unknown): unknown {
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

const exerciseSessionSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
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
});

const payloadSchema = z.object({
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
  hrvRmssd: z.number().nullish(),
  vo2Max: z.number().nullish(),
  floorsClimbed: z.number().nullish(),
  elevationGainedMeters: z.number().nullish(),
  skinTemperatureC: z.number().nullish(),
  weightKg: z.number().nullish(),
  heightCm: z.number().nullish(),
  bmi: z.number().nullish(),
  respiratoryRate: z.number().nullish(),
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
  // Metadata client (opzionale, per UPDATE devices)
  appVersion: z.string().nullish(),
  osVersion: z.string().nullish(),
});

export async function POST(req: Request) {
  // ── 1. Auth ─────────────────────────────────────────────────────────
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;
  const sb = auth.supabase as unknown as Sb;

  // ── 2. Device lookup ────────────────────────────────────────────────
  const fingerprint = req.headers.get("x-device-fingerprint");
  if (!fingerprint) return jsonError(400, "missing_device_fingerprint");

  const { data: device, error: devErr } = await sb
    .from("devices")
    .select("id")
    .eq("user_id", userId)
    .eq("device_fingerprint", fingerprint)
    .is("revoked_at", null)
    .maybeSingle();

  if (devErr) return jsonError(500, "device_lookup_failed", devErr.message);
  if (!device) return jsonError(404, "device_not_paired");

  // ── 3. Validation payload ──────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    // Log dettagli validation per debug futuro (visibile in Vercel logs).
    console.error("[sync] invalid_payload", {
      issues: parsed.error.issues,
      sampleKeys: Object.keys(body as object).slice(0, 30),
    });
    return jsonError(400, "invalid_payload", parsed.error.flatten());
  }
  const p = parsed.data;

  // ── 4. INSERT fitness_metrics ──────────────────────────────────────
  const { data: inserted, error: insErr } = await sb
    .from("fitness_metrics")
    .insert({
      user_id: userId,
      device_id: device.id,
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
    })
    .select("id")
    .single();

  if (insErr) return jsonError(500, "insert_metrics_failed", insErr.message);

  // ── 5. INSERT workouts da exercise_sessions ────────────────────────
  if (p.exerciseSessionsJson && p.exerciseSessionsJson.length > 0) {
    const workoutRows = p.exerciseSessionsJson.map((s) => ({
      user_id: userId,
      device_id: device.id,
      start_ms: s.startMs,
      end_ms: s.endMs,
      type: s.type ?? null,
      title: s.title ?? null,
      duration_min: s.durationMin ?? null,
      distance_meters: s.distanceMeters ?? null,
      calories_kcal: s.caloriesKcal ?? null,
      hr_avg: s.hrAvg ?? null,
      hr_max: s.hrMax ?? null,
      hr_min: s.hrMin ?? null,
      pace_sec_per_km: s.paceSecPerKm ?? null,
    }));
    // best-effort: anche se workouts fail, il sync principale resta valido
    await sb.from("workouts").insert(workoutRows);
  }

  // ── 6. Touch device.last_seen_at + app/os version ──────────────────
  await sb
    .from("devices")
    .update({
      last_seen_at: new Date().toISOString(),
      ...(p.appVersion ? { app_version: p.appVersion } : {}),
      ...(p.osVersion ? { os_version: p.osVersion } : {}),
    })
    .eq("id", (device as { id: string }).id);

  return jsonOk({ ok: true, metricsId: (inserted as { id: number } | null)?.id });
}
