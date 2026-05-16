/**
 * Helpers per autenticazione Bearer JWT nelle API route mobile-facing.
 *
 * La differenza vs `lib/supabase/server.ts`: quel modulo legge la sessione da
 * cookie httpOnly (browser-based flow). Qui invece l'app Flutter passa il JWT
 * come header `Authorization: Bearer <token>`.
 *
 * Pattern standard:
 *
 *   import { requireUser } from '@/lib/api/auth-helpers';
 *
 *   export async function POST(req: Request) {
 *     const auth = await requireUser(req);
 *     if (auth instanceof Response) return auth; // 401
 *     const { userId, jwt } = auth;
 *     // ... usa userId per scrivere su DB tramite admin client
 *   }
 */
import { createClient } from "@supabase/supabase-js";

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
};

/**
 * Verifica il JWT e ritorna l'user, oppure ritorna direttamente una Response
 * 401 da rispedire al client. Il chiamante deve fare:
 *
 *   const auth = await requireUser(req);
 *   if (auth instanceof Response) return auth;
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

  // Per validare il JWT usiamo getUser(token) — fa una request a Supabase Auth
  // che verifica signature + expiry + revoke list. NON usiamo decodifica locale
  // perché un JWT scaduto/revocato non deve essere accettato.
  const supabase = createClient<Database>(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return jsonError(401, "invalid_or_expired_token");
  }

  return {
    userId: data.user.id,
    jwt: token,
    email: data.user.email ?? null,
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
