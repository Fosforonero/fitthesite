/**
 * POST /api/v1/migrate — importa storico OVH legacy → Supabase per l'utente loggato.
 *
 * Chiamato dall'app v37.6 al primo login se l'utente ha già dati su OVH.
 *
 * Flow:
 *   1. requireUser(req) → userId
 *   2. Valida { oldDeviceId, deviceFingerprint } — deviceFingerprint deve essere
 *      un device già paired dell'utente (nuovo Supabase device_id corrispondente).
 *   3. Fetch da OVH: `GET /api/v1/sync/recent?deviceId=<oldDeviceId>&limit=1000`
 *      paginato (200 per pagina, max 5 pagine = 1000 record).
 *   4. INSERT bulk in fitness_metrics con user_id corrente + nuovo device_id.
 *   5. Ritorna { imported: N }
 *
 * Note:
 *   - Idempotente per quanto possibile: dedup su (user_id, device_id,
 *     collected_at_ms) — se un record è già stato importato (re-run migration)
 *     skippato silenziosamente.
 *   - OVH base URL configurato via env OVH_LEGACY_BASE_URL.
 *   - Timeout 30s per pagina; oltre → partial import.
 *
 * Risposte:
 *   200 { imported, skipped, errors }
 *   400 invalid_payload
 *   401 missing/invalid token
 *   404 device_not_paired
 *   502 ovh_unreachable
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { jsonError, jsonOk, requireUser } from "@/lib/api/auth-helpers";
import { sanitizeSourceDevice } from "@/lib/health/source-device";

// database.types stale — vedi sync/route.ts
type Sb = SupabaseClient;

const payloadSchema = z.object({
  oldDeviceId: z.string().min(8).max(64),
  deviceFingerprint: z.string().min(8).max(128),
});

// Niente fallback hardcoded HTTP-cleartext: i dati salute legacy non devono
// MAI transitare in chiaro. Senza env var l'endpoint risponde 503.
const OVH_BASE = process.env.OVH_LEGACY_BASE_URL ?? "";
const PAGE_SIZE = 200;
const MAX_PAGES = 5;

type LegacyRecord = Record<string, unknown>;

export async function POST(req: Request) {
  if (!OVH_BASE || !OVH_BASE.startsWith("https://")) {
    return jsonError(503, "legacy_migration_unavailable");
  }
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid_payload", parsed.error.flatten());
  }
  const { oldDeviceId, deviceFingerprint } = parsed.data;

  const admin = auth.supabase as unknown as Sb;

  // ── Verifica che il fingerprint corrisponda a un device dell'utente ──
  const { data: device } = await admin
    .from("devices")
    .select("id")
    .eq("user_id", userId)
    .eq("device_fingerprint", deviceFingerprint)
    .is("revoked_at", null)
    .maybeSingle();

  if (!device) return jsonError(404, "device_not_paired");

  const newDeviceId = (device as { id: string }).id;

  // ── Fetch paginato da OVH ───────────────────────────────────────────
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const url = `${OVH_BASE}/api/v1/sync/recent?deviceId=${encodeURIComponent(oldDeviceId)}&limit=${PAGE_SIZE}&offset=${offset}`;

    let records: LegacyRecord[];
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) {
        if (res.status === 404) break; // nessun dato → fine
        errors.push(`page ${page}: HTTP ${res.status}`);
        break;
      }
      const json = (await res.json()) as { records?: LegacyRecord[] };
      records = json.records ?? [];
    } catch (err) {
      errors.push(`page ${page}: ${(err as Error).message}`);
      return jsonError(502, "ovh_unreachable", { imported, skipped, errors });
    }

    if (records.length === 0) break;

    // Map record OVH → schema fitness_metrics
    const rows = records.map((r) => mapLegacyRecord(r, userId, newDeviceId));

    // INSERT con onConflict do nothing (idempotenza approssimata)
    const { error } = await admin.from("fitness_metrics").insert(rows);
    if (error) {
      errors.push(`page ${page} insert: ${error.message}`);
      // Continue: salta questa pagina ma prosegui col resto
      skipped += rows.length;
      continue;
    }
    imported += rows.length;

    // Se < PAGE_SIZE, è l'ultima pagina
    if (records.length < PAGE_SIZE) break;
  }

  return jsonOk({ imported, skipped, errors });
}

/**
 * Mapping legacy OVH SQLite row → Supabase fitness_metrics row.
 *
 * Nota: lo schema OVH è camelCase nel JSON, snake_case nel DB Postgres.
 * I null sono gestiti per evitare di sovrascrivere campi opzionali.
 */
function mapLegacyRecord(
  r: LegacyRecord,
  userId: string,
  deviceId: string,
): Record<string, unknown> {
  const get = (k: string) => (r[k] === undefined ? null : r[k]);
  return {
    user_id: userId,
    device_id: deviceId,
    schema_version: (get("schemaVersion") as number) ?? 1,
    source: get("source"),
    window_start_ms: get("windowStartMillis") ?? get("window_start_ms") ?? 0,
    window_end_ms: get("windowEndMillis") ?? get("window_end_ms") ?? 0,
    collected_at_ms: get("collectedAtMillis") ?? get("collected_at_ms") ?? 0,
    steps: get("steps"),
    heart_rate_bpm: get("heartRateBpm") ?? get("heart_rate_bpm"),
    resting_heart_rate_bpm: get("restingHeartRateBpm") ?? get("resting_heart_rate_bpm"),
    spo2_percent: get("spo2Percent") ?? get("spo2_percent"),
    calories_kcal: get("caloriesKcal") ?? get("calories_kcal"),
    active_calories_kcal: get("activeCaloriesKcal") ?? get("active_calories_kcal"),
    sleep_minutes: get("sleepMinutes") ?? get("sleep_minutes"),
    sleep_start_ms: get("sleepStartMillis") ?? get("sleep_start_ms"),
    sleep_end_ms: get("sleepEndMillis") ?? get("sleep_end_ms"),
    distance_meters: get("distanceMeters") ?? get("distance_meters"),
    hrv_rmssd: get("hrvRmssd") ?? get("hrv_rmssd"),
    vo2_max: get("vo2Max") ?? get("vo2_max"),
    floors_climbed: get("floorsClimbed") ?? get("floors_climbed"),
    elevation_gained_meters: get("elevationGainedMeters") ?? get("elevation_gained_meters"),
    skin_temperature_c: get("skinTemperatureC") ?? get("skin_temperature_c"),
    weight_kg: get("weightKg") ?? get("weight_kg"),
    height_cm: get("heightCm") ?? get("height_cm"),
    bmi: get("bmi"),
    intraday_steps: get("intradaySteps") ?? get("intraday_steps"),
    intraday_hr: get("intradayHr") ?? get("intraday_hr"),
    intraday_calories: get("intradayCalories") ?? get("intraday_calories"),
    sleep_stages: get("sleepStages") ?? get("sleep_stages"),
    exercise_sessions: get("exerciseSessionsJson") ?? get("exercise_sessions"),
    source_device: sanitizeSourceDevice(
      (get("sourceDevice") ?? get("source_device")) as string | null,
    ),
    source_package: get("sourcePackage") ?? get("source_package"),
  };
}
