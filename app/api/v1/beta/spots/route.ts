/**
 * GET /api/v1/beta/spots — contatore posti Beta occupati (X/100).
 *
 * Pubblico, anonimo. Chiama la function SQL `get_beta_spots_taken()` che
 * conta i signup in stato pending|approved|activated.
 *
 * Risposta: { taken: number, total: 100 }
 */
import { createClient } from "@supabase/supabase-js";

import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

export const revalidate = 30; // cache 30s, social proof non deve essere realtime

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return jsonError(500, "supabase_env_misconfigured");

  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.rpc("get_beta_spots_taken");
  if (error) return jsonError(500, "rpc_failed", error.message);

  return jsonOk({ taken: data ?? 0, total: 100 });
}
