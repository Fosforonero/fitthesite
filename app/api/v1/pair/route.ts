/**
 * POST /api/v1/pair — pairing app mobile a un account utente via codice 6 cifre.
 *
 * Flow:
 *   1. User logga sul sito fitmesh.fit, clicca "Genera codice" → /api/v1/auth/devices/codes
 *      crea row in device_pairing_codes (TTL 5 min).
 *   2. User apre app, fa login con stessa account, inserisce il codice 6 cifre.
 *   3. App POST qui con { code, device_fingerprint, device_name?, device_brand?,
 *      source_type, app_version?, os_version? }.
 *   4. Backend:
 *      - valida JWT → userId
 *      - lookup code in device_pairing_codes WHERE user_id=userId AND expires>now AND claimed_at IS NULL
 *      - se non trovato/scaduto → 410
 *      - se trovato: INSERT devices (user_id, fingerprint) — ON CONFLICT del fingerprint
 *        attivo → 409 (già paired da un altro device)
 *      - UPDATE device_pairing_codes SET claimed_at=now, claimed_by_fingerprint
 *      - ritorna { deviceId }
 *
 * Risposte:
 *   200 { deviceId } — pairing OK
 *   400 invalid_payload
 *   401 missing/invalid token
 *   409 fingerprint_already_paired (con un altro account o stesso ma attivo)
 *   410 code_expired_or_used
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk, requireUser } from "@/lib/api/auth-helpers";

// database.types stale — vedi commento in sync/route.ts
type Sb = SupabaseClient;

const payloadSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "code must be 6 digits"),
  device_fingerprint: z.string().min(8).max(128),
  device_name: z.string().max(80).nullish(),
  device_brand: z.string().max(40).nullish(),
  source_type: z.enum([
    "health_connect",
    "samsung_health",
    "apple_health",
    "manual",
  ]),
  app_version: z.string().max(20).nullish(),
  os_version: z.string().max(40).nullish(),
});

export async function POST(req: Request) {
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
  const p = parsed.data;

  const admin = createAdminClient() as unknown as Sb;

  // ── 1. Valida codice ────────────────────────────────────────────────
  const { data: codeRow, error: codeErr } = await admin
    .from("device_pairing_codes")
    .select("code, user_id, expires_at, claimed_at")
    .eq("code", p.code)
    .eq("user_id", userId)
    .maybeSingle();

  if (codeErr) return jsonError(500, "code_lookup_failed", codeErr.message);
  if (!codeRow) return jsonError(410, "code_not_found_or_wrong_user");

  const expired = new Date((codeRow as { expires_at: string }).expires_at).getTime() < Date.now();
  const alreadyUsed = !!(codeRow as { claimed_at: string | null }).claimed_at;
  if (expired || alreadyUsed) {
    // incrementa attempts per anti-abuse (best-effort)
    await admin
      .from("device_pairing_codes")
      .update({ attempts: 0 })
      .eq("code", p.code);
    return jsonError(410, expired ? "code_expired" : "code_already_used");
  }

  // ── 2. Crea device row ──────────────────────────────────────────────
  const { data: newDevice, error: insErr } = await admin
    .from("devices")
    .insert({
      user_id: userId,
      device_fingerprint: p.device_fingerprint,
      device_name: p.device_name ?? null,
      device_brand: p.device_brand ?? null,
      source_type: p.source_type,
      app_version: p.app_version ?? null,
      os_version: p.os_version ?? null,
    })
    .select("id")
    .single();

  if (insErr) {
    // unique constraint sul fingerprint attivo
    if (insErr.code === "23505") {
      return jsonError(409, "fingerprint_already_paired");
    }
    return jsonError(500, "device_insert_failed", insErr.message);
  }

  // ── 3. Marca codice come claimed ────────────────────────────────────
  await admin
    .from("device_pairing_codes")
    .update({
      claimed_at: new Date().toISOString(),
      claimed_by_fingerprint: p.device_fingerprint,
    })
    .eq("code", p.code);

  return jsonOk({ deviceId: (newDevice as { id: string } | null)?.id });
}
