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
 *   4. RPC upsert_fitness_metrics_v189 via user-bound client (SECURITY
 *      INVOKER, RLS "users insert/update own metrics" enforced — Sprint
 *      189-RC2, migration 20260721180000). Canonical row per
 *      user/device/source/day: a repeat sync for the same identity updates
 *      in place instead of appending, see the migration for merge semantics.
 *   4.5. RPC record_first_sync_transition('success', ...) — Founder P0:
 *      grant first-sync-success legato al primo sync realmente riuscito,
 *      mai al signup. Best-effort: un fallimento qui NON fa fallire il
 *      sync (i dati salute sono gia' committati al passo 4). Platform e'
 *      telemetria opzionale (derivata da osVersion, mai un requisito).
 *   5. RPC upsert_workouts_v189 per ogni exercise_session (se presente) —
 *      best-effort, canonical (Sprint 189-RC2 Blocker 2, migration
 *      20260722091000): identity (user, device, start_ms, end_ms, type),
 *      retry/resync in place invece di riga duplicata. Letto da
 *      ExportDataClient.tsx per l'export GDPR.
 *   6. UPDATE devices.last_seen_at + app_version + os_version
 *
 * Risposte:
 *   200 { ok: true, metricsId, founderGrant }
 *   400 invalid_payload
 *   401 missing/invalid token
 *   404 device_not_paired
 *   500 server_error
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { jsonError, jsonOk, requireUser } from "@/lib/api/auth-helpers";

import {
  derivePlatform,
  resolveFounderGrantStatus,
  type FounderGrantStatus,
} from "./founder-grant";
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
    .select("id, os_version")
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

  // ── 4. UPSERT fitness_metrics (Sprint 189-RC2: canonical row per
  // user/device/source/day, no more one-row-per-sync append — see
  // upsert_fitness_metrics_v189 in migration
  // 20260721180000_fitness_metrics_canonical_upsert.sql for the merge
  // semantics). SECURITY INVOKER: runs as this request's authenticated user,
  // enforced by the same RLS policies a raw insert/update would hit.
  const { data: metricsId, error: insErr } = await sb.rpc(
    "upsert_fitness_metrics_v189",
    { p_row: buildFitnessMetricsRow(p, { userId, deviceId: device.id }) },
  );

  if (insErr) return jsonError(500, "insert_metrics_failed", insErr.message);

  // ── 4.5. Founder P0: grant first-sync-success (best-effort) ─────────
  // La route resta valida anche se questa chiamata fallisce: l'ingest dati
  // e' gia' committato al passo 4. Chiamata SEMPRE, indipendentemente da
  // osVersion (P0.4): platform e' solo telemetria, mai un requisito.
  let founderGrant: FounderGrantStatus = "retry_needed";
  const platform =
    derivePlatform(p.osVersion) ??
    derivePlatform((device as { os_version?: string | null }).os_version);
  try {
    const { data: transitionResult, error: transitionErr } = await sb.rpc(
      "record_first_sync_transition",
      {
        p_device_fingerprint: fingerprint,
        p_state: "success",
        p_platform: platform,
        p_app_version: p.appVersion ?? null,
      },
    );
    if (transitionErr) {
      // Nessuna email/dato sanitario nel log: solo deviceId + codice errore.
      console.error("[sync] first_sync_transition_failed", {
        deviceId: device.id,
        code: transitionErr.code,
      });
      founderGrant = resolveFounderGrantStatus(null, true);
    } else {
      founderGrant = resolveFounderGrantStatus(
        transitionResult as Record<string, unknown> | null,
        false,
      );
    }
  } catch {
    console.error("[sync] first_sync_transition_exception", {
      deviceId: device.id,
    });
    founderGrant = resolveFounderGrantStatus(null, true);
  }

  // ── 5. UPSERT workouts da exercise_sessions (Sprint 189-RC2 Blocker 2) ──
  // public.workouts is read by ExportDataClient.tsx (GDPR Art. 20 export),
  // so this write stays (an earlier pass of this sprint removed it on a
  // false "write-only/dead table" premise, reverted after adversarial
  // review). Was a raw INSERT: every re-sync of an already-finished workout
  // (a full-day HealthConnect/HealthKit re-read resending the same session)
  // appended a fresh duplicate row forever — 30,575 rows for 4,345 distinct
  // (user, device, start_ms, end_ms, type) identities as of this audit,
  // ~86% duplicates. Now calls upsert_workouts_v189 (migration
  // 20260722091000_workouts_canonical_upsert.sql): identical retries land on
  // the same row, later syncs enrich title/duration/distance/calories/HR
  // without erasing what a previous sync already populated. Each session
  // upserted independently and best-effort (one failing must not fail the
  // others or the main sync, which already committed at step 4).
  if (p.exerciseSessionsJson && p.exerciseSessionsJson.length > 0) {
    await Promise.all(
      p.exerciseSessionsJson.map((s) =>
        sb
          .rpc("upsert_workouts_v189", {
            p_row: {
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
            },
          })
          .then(({ error }) => {
            if (error) {
              console.error("[sync] upsert_workouts_failed", {
                deviceId: device.id,
                code: error.code,
              });
            }
          }),
      ),
    );
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

  return jsonOk({
    ok: true,
    metricsId: metricsId as number | null,
    founderGrant,
  });
}
