/**
 * Helpers per autenticazione Bearer JWT nelle API route mobile-facing.
 *
 * Il client Flutter passa il JWT come `Authorization: Bearer <token>`.
 * Qui validiamo + creiamo un client Supabase **user-bound** (anon key +
 * Bearer JWT come header globale) che rispetta la RLS dell'utente come se
 * fosse loggato via cookie. Tutti gli INSERT/UPDATE rispettano le policy
 * con `WITH CHECK (user_id = auth.uid())` (vedi migration 007).
 *
 * NIENTE service_role: non lo usiamo MAI nelle route mobile-facing.
 * Bypassa la RLS e introduce un secret in più da gestire. Per scrivere
 * record propri basta il client user-bound.
 */
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/** Estrae il token Bearer dall'header Authorization, o null se mancante/malformato. */
export function extractBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export type AuthOk = {
  userId: string;
  jwt: string;
  email: string | null;
  /**
   * Client Supabase user-bound: anon + Bearer JWT header. Rispetta RLS.
   * Usalo per SELECT/INSERT/UPDATE su tabelle con policy `user_id = auth.uid()`.
   */
  supabase: SupabaseClient;
};

/**
 * Verifica il JWT e ritorna l'user + un client Supabase user-bound, oppure
 * una Response 401. Il chiamante deve fare:
 *
 *   const auth = await requireUser(req);
 *   if (auth instanceof Response) return auth;
 *   const { userId, supabase } = auth;
 *
 * Validazione fatta lato Supabase Auth (signature + expiry + revocation).
 */
export async function requireUser(req: Request): Promise<AuthOk | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonError(401, "missing_bearer_token");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return jsonError(500, "supabase_env_misconfigured");
  }

  // Client user-bound: passa il Bearer JWT come header globale. Tutte le
  // query rispetteranno la RLS dell'utente (auth.uid() ritorna il suo id).
  const supabase = createClient<Database>(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return jsonError(401, "invalid_or_expired_token");
  }

  return {
    userId: data.user.id,
    jwt: token,
    email: data.user.email ?? null,
    supabase,
  };
}

/** Risposta JSON di errore standardizzata. */
export function jsonError(status: number, code: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({ error: code, ...(details ? { details } : {}) }),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}

/** Risposta JSON di successo standardizzata. */
export function jsonOk(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
