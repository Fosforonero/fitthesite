/**
 * POST /api/v1/auth/devices/codes — genera un codice 6 cifre per pairing app.
 *
 * Chiamato dal browser (fitmesh.fit/it/app/devices) quando l'utente clicca
 * "Genera codice". Auth via cookie httpOnly (non Bearer — questo endpoint è
 * web-only, non mobile).
 *
 * Genera 6 cifre random crypto-safe, INSERT in device_pairing_codes con TTL
 * 5 min. ON CONFLICT del codice → riprova (max 5 tentativi prima di 500).
 *
 * Risposte:
 *   200 { code: "123456", expiresAt: "2026-05-16T18:35:00Z" }
 *   401 unauthenticated
 *   500 generation_failed
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

// database.types stale — vedi sync/route.ts
type Sb = SupabaseClient;

/** Genera 6 cifre random uniformi via Web Crypto. */
function generate6Digit(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // 6 cifre uniformi da 000000 a 999999
  return (buf[0] % 1_000_000).toString().padStart(6, "0");
}

export async function POST() {
  // Auth via cookie (web flow)
  const user = await createClient();
  const { data: { user: u } } = await user.auth.getUser();
  if (!u) return jsonError(401, "unauthenticated");

  const admin = createAdminClient() as unknown as Sb;

  // ── Retry su collision codice (improbabile ma possibile) ───────────
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generate6Digit();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await admin
      .from("device_pairing_codes")
      .insert({
        code,
        user_id: u.id,
        expires_at: expiresAt,
      });

    if (!error) {
      return jsonOk({ code, expiresAt });
    }
    // 23505 = unique violation → riprova
    if (error.code !== "23505") {
      return jsonError(500, "code_insert_failed", error.message);
    }
  }

  return jsonError(500, "code_generation_collision");
}
