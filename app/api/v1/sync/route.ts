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
 *   5. INSERT in workouts per ogni exercise_session (se presente) — best-effort,
 *      NON deduplicato (debito pre-esistente, letto da ExportDataClient.tsx
 *      per l'export GDPR, vedi commento nel codice)
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

  // ── 5. INSERT workouts da exercise_sessions ────────────────────────
  // Sprint 189-RC2 correction: an earlier pass of this sprint removed this
  // write, believing public.workouts was write-only/dead (repo-wide grep
  // across flutter_app/lib and fitthesite/app found no `.from("workouts")`
  // reader). Adversarial review found that premise FALSE:
  // app/(frontend)/[locale]/app/export/ExportDataClient.tsx (the GDPR
  // Article 20 "download my data" page, linked from account settings and
  // promised by the public Privacy Policy in 6 locales) does
  // `supabase.from(table).select("*")` over a TABLES array that includes
  // "workouts" — a real, reachable read the original grep missed because the
  // table name only appears as an array element, never as a literal
  // `.from("workouts")` string. Removing the write would have made every
  // future workout silently absent from that export while the Privacy
  // Policy keeps promising "all of your data". Restored, unchanged from
  // pre-189-RC2 behavior.
  //
  // Still NOT deduplicated (pre-existing issue, not introduced or worsened
  // by this sprint, not fixed by it either): 29,666 rows for 4,249 distinct
  // workouts in production as of this audit, 62.9% pure duplicates. A
  // SELECT-before-INSERT would add a DB round-trip to every sync and still
  // not be atomic under concurrency; a proper idempotent key/upsert for this
  // table is a separate, not-yet-scoped follow-up — flagged in the Sprint
  // 189-RC2 report as known, unaddressed debt, not silently left as if
  // solved.
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

  return jsonOk({
    ok: true,
    metricsId: metricsId as number | null,
    founderGrant,
  });
}
