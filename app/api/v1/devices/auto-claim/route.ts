/**
 * POST /api/v1/devices/auto-claim — pair invisibile, senza codice 6 cifre.
 *
 * Sostituisce il flusso "genera codice sul sito + digita in app". L'app chiama
 * direttamente con JWT Supabase + device_fingerprint univoco (UUID generato
 * lato app). Idempotente: se il fingerprint è già paired ALLO STESSO user e
 * non revocato, ritorna { deviceId, created: false } anziché 409.
 *
 * Risposte:
 *   200 { deviceId, created }   — created=true: nuovo pair; false: già paired
 *   400 invalid_payload
 *   401 missing/invalid token
 *   409 fingerprint_already_paired_other_user
 */
import { z } from "zod";

import { jsonError, jsonOk, requireUser } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

const payloadSchema = z.object({
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

  const admin = createAdminClient();

  const { data: existingRaw, error: lookupErr } = await admin
    .from("devices")
    .select("id, user_id")
    .eq("device_fingerprint", p.device_fingerprint)
    .is("revoked_at", null)
    .maybeSingle();

  if (lookupErr) {
    return jsonError(500, "device_lookup_failed", lookupErr.message);
  }

  const existing = existingRaw as { id: string; user_id: string } | null;

  if (existing) {
    if (existing.user_id !== userId) {
      return jsonError(409, "fingerprint_already_paired_other_user");
    }
    await admin
      .from("devices")
      .update({
        device_name: p.device_name ?? null,
        device_brand: p.device_brand ?? null,
        app_version: p.app_version ?? null,
        os_version: p.os_version ?? null,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return jsonOk({ deviceId: existing.id, created: false });
  }

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
    if (insErr.code === "23505") {
      return jsonError(409, "fingerprint_already_paired_other_user");
    }
    return jsonError(500, "device_insert_failed", insErr.message);
  }

  const created = newDevice as { id: string } | null;
  return jsonOk({ deviceId: created?.id, created: true });
}
