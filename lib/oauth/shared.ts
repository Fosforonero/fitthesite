/**
 * Utility OAuth condivise tra i backend provider (Strava, Suunto, Polar, Withings).
 *
 * Estratte verbatim da strava-backend.ts / suunto-backend.ts: rate limit
 * in-memory per IP + estrazione IP dalla Request. Nessun cambio di logica.
 *
 * NOTA: il rate limit NON è persistente tra cold starts Vercel (serverless),
 * ma è sufficiente per protezione base. Per protezione forte in produzione
 * usare Upstash Redis + @upstash/ratelimit.
 */

// ─── Rate limit in-memory per IP ────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX = 10; // max 10 richieste/minuto per IP

type RateLimitEntry = { count: number; windowStart: number };
const _rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Controlla il rate limit per l'IP dato.
 * Ritorna `true` se la richiesta è permessa, `false` se va bloccata.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    _rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/** Estrae l'IP dalla Request (Vercel + standard headers). */
export function extractIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
