/**
 * GET /api/v1/beta/spots — contatore posti Founder occupati (X/1000).
 *
 * Usa admin client per contare i grant note='founder-launch' in user_roles,
 * allineato con FounderBanner (server component). Aggiunge 7 legacy founders
 * della closed beta che non hanno note='founder-launch'.
 *
 * Risposta: { taken: number, total: 1000 }
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

const LEGACY_FOUNDERS = 7;
const TOTAL = 1000;

export const revalidate = 0;

export async function GET() {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("note", "founder-launch");

  if (error || typeof count !== "number") return jsonError(500, "count_failed");

  return jsonOk({ taken: count + LEGACY_FOUNDERS, total: TOTAL });
}
