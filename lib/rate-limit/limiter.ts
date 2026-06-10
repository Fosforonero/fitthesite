/**
 * Rate limiter via Supabase Postgres (cybersec P0-001).
 *
 * Edge-runtime-compatible (usato da middleware.ts). Chiama la RPC
 * `rate_limit_check(key, max, window_seconds)` definita nella migration
 * `rate_limit_buckets_and_rpc`. Atomic UPSERT + return current count.
 *
 * Architettura scelta vs alternative:
 * - Upstash Redis: free tier limita a 1 DB/account (Matteo gia' usato per
 *   altro progetto). Avremmo dovuto pagare o creare account secondario.
 * - Postgres Supabase: zero external dep, gia' nel nostro stack, fixed window
 *   1-min sufficiente per nostro scale. Latency ~5ms in piu' di Redis ma
 *   impercettibile per utente.
 *
 * Policy (vedi limitSync / limitSignup):
 * - /api/v1/sync: per user_id (estratto da JWT bearer senza validation,
 *   rate limit non e' security boundary). Fallback a IP. Limite 60/min.
 *   Sync normale fa ~4 req/h, 60/min e' ampio cuscino + blocca abuse-via-curl.
 * - /api/v1/beta/signup: per IP. 10/min. Public endpoint, blocca spam
 *   email registration + protegge Resend quota.
 *
 * Fail-open: se Supabase RPC fallisce (network error, deploy in corso, ecc.),
 * permettiamo la request. Mai bloccare prod per nostro outage. Trade-off
 * accettato: durante outage Supabase, rate limit disabilitato → fallback a
 * Vercel platform protections (DDoS layer baseline).
 *
 * Cleanup: rows vecchie >1h cancellate da rate_limit_cleanup() chiamata
 * dal cron daily beta-welcome-emails (riusiamo lo slot Hobby).
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Estrae l'user_id (sub) dal JWT bearer senza validare la firma.
 * USO SOLO per rate limit keying — la validazione vera arriva dopo nel
 * route handler tramite supabase.auth.getUser(token).
 *
 * Ritorna null se manca header, formato sbagliato, payload non parsabile.
 */
function extractUserIdFromBearer(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Estrae IP client da headers Vercel/edge. */
function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

type LimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
};

const ALLOWED_FAILOPEN: LimitResult = {
  allowed: true,
  limit: 0,
  remaining: 0,
};

/**
 * Chiama RPC rate_limit_check via Supabase con anon key (la RPC e' security
 * definer quindi bypassa RLS). Stateless: nuovo client per ogni request del
 * middleware — la classe di Supabase e' leggera, niente connection pool da
 * mantenere.
 */
async function callRateLimitRpc(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<LimitResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return ALLOWED_FAILOPEN;

  try {
    // Client minimale: niente cookies, niente auth (la RPC e' callable da anon).
    const sb = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll(_cookies: CookieToSet[]) {
          // no-op
        },
      },
    });

    const { data, error } = await sb.rpc("rate_limit_check", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return ALLOWED_FAILOPEN;
    }
    const row = data[0] as { allowed?: boolean; remaining?: number };
    return {
      allowed: row.allowed === true,
      limit: max,
      remaining: typeof row.remaining === "number" ? row.remaining : 0,
    };
  } catch {
    return ALLOWED_FAILOPEN;
  }
}

/** Rate limit per /api/v1/sync. 60 req/min per user_id (fallback IP). */
export async function limitSync(req: Request): Promise<LimitResult> {
  const userId = extractUserIdFromBearer(req);
  const key = userId
    ? `sync:user:${userId}`
    : `sync:ip:${getClientIp(req)}`;
  return callRateLimitRpc(key, 60, 60);
}

/** Rate limit per /api/v1/beta/signup. 10 req/min per IP. */
export async function limitSignup(req: Request): Promise<LimitResult> {
  const key = `signup:ip:${getClientIp(req)}`;
  return callRateLimitRpc(key, 10, 60);
}

/**
 * Rate limit per preview/join inviti famiglia. 20 req/min per IP.
 * Endpoint pubblici (service_role server-side) con namespace codici piccolo
 * (MESH-XXXX): senza limite sono enumerabili via brute-force.
 */
export async function limitInvitePreview(req: Request): Promise<LimitResult> {
  const key = `invite:ip:${getClientIp(req)}`;
  return callRateLimitRpc(key, 20, 60);
}

/** Costruisce response 429 standard con headers RateLimit-*. */
export function buildRateLimitResponse(result: LimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message: "Too many requests. Please retry later.",
      retryAfter: 60,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": "60",
        "x-ratelimit-limit": result.limit.toString(),
        "x-ratelimit-remaining": result.remaining.toString(),
      },
    },
  );
}
