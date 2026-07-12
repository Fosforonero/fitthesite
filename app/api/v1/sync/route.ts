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

import { jsonError, jsonOk, requireUser } from "@/lib/api/auth-helpers";

import { buildFitnessMetricsRow, payloadSchema } from "./schema";

// Cast a SupabaseClient generico (senza Database) perché i types non sono
// ancora rigenerati post-migrations 003-007. Da rimuovere quando avremo
// fatto `npm run supabase:gen-types`.
type Sb = SupabaseClient;

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
  // Guardia memory-DoS: req.json() carica tutto in RAM prima di Zod. Un
  // payload legittimo (snapshot giornaliera + intraday + workout) sta ben
  // sotto i 500KB; oltre 2MB è patologico → 413 prima del parse.
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 2 * 1024 * 1024) {
    return jsonError(413, "payload_too_large");
  }
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
    .insert(buildFitnessMetricsRow(p, { userId, deviceId: device.id }))
    .select("id")
    .single();

  if (insErr) return jsonError(500, "insert_metrics_failed", insErr.message);

  // ── 5. INSERT workouts da exercise_sessions ────────────────────────
  // Dedup NON fatto qui apposta (sprint 187A): un SELECT-before-INSERT
  // aggiungerebbe una query DB a OGNI sync e non e' comunque atomico sotto
  // concorrenza. Il dedup vero (unique constraint/upsert reviewato) e'
  // rimandato a un follow-up separato — la dashboard app oggi legge
  // fitness_metrics.exercise_sessions, non questa tabella (vedi
  // docs/superpowers/plans/2026-07-11-workout-identity-preservation.md).
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
