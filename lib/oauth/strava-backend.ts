/**
 * Strava OAuth backend helpers — usati dalle route /api/v1/oauth/strava/*.
 *
 * STRAVA_CLIENT_SECRET vive SOLO qui (env Vercel), MAI nel binary Flutter.
 * STRAVA_CLIENT_ID è semi-pubblico (nell'auth URL) ma teniamo anche lui
 * lato server per non duplicare configurazione.
 */

const STRAVA_TOKEN_URL = "https://www.strava.com/api/v3/oauth/token";

/** Legge env vars obbligatorie; lancia se mancanti (fail-fast a runtime). */
function getStravaEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET devono essere configurati come env Vercel"
    );
  }
  return { clientId, clientSecret };
}

export type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix epoch seconds
  token_type: string;
  athlete?: Record<string, unknown>;
};

/**
 * Scambia un authorization code per access_token + refresh_token.
 * Chiama Strava server-side — il client_secret non lascia mai il server.
 */
export async function exchangeStravaCode(
  code: string,
  redirectUri: string
): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getStravaEnv();

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new StravaApiError(res.status, body);
  }

  return (await res.json()) as StravaTokenResponse;
}

/**
 * Usa un refresh_token per ottenere un nuovo access_token.
 * Chiama Strava server-side — il client_secret non lascia mai il server.
 */
export async function refreshStravaToken(
  refreshToken: string
): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getStravaEnv();

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new StravaApiError(res.status, body);
  }

  return (await res.json()) as StravaTokenResponse;
}

/** Errore HTTP proveniente da Strava, con status code originale. */
export class StravaApiError extends Error {
  constructor(
    public readonly stravaStatus: number,
    public readonly stravaBody: string
  ) {
    super(`Strava API error ${stravaStatus}: ${stravaBody}`);
    this.name = "StravaApiError";
  }
}

// ─── Rate limit in-memory per IP ────────────────────────────────────────────
// Semplice sliding-window per prevenire abusi. Non persistente tra cold starts
// Vercel (serverless), ma sufficiente per protezione base.
// Per protezione forte in produzione usare Upstash Redis + @upstash/ratelimit.

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
