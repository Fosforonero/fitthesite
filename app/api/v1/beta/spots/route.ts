/**
 * GET /api/v1/beta/spots — contatore posti Founder occupati (X/1000).
 *
 * Pubblico, anonimo. Chiama la function SQL `get_beta_spots_taken()` che
 * conta i signup in stato pending|approved|activated.
 *
 * Risposta: { taken: number, total: 1000 }
 */
import { createClient } from "@supabase/supabase-js";

import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

// v104: live (revalidate=0). L'utente vuole vedere il counter scalare
// appena qualcuno si iscrive. Costo Supabase trascurabile (RPC lightweight).
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return jsonError(500, "supabase_env_misconfigured");

  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("get_beta_spots_taken");
  if (error) return jsonError(500, "rpc_failed", error.message);

  return jsonOk({ taken: data ?? 0, total: 1000 });
}
