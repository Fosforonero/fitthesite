/**
 * Suunto OAuth backend helpers — usati dalle route /api/v1/oauth/suunto/*.
 *
 * SUUNTO_CLIENT_SECRET e SUUNTO_SUBSCRIPTION_KEY vivono SOLO qui (env Vercel),
 * MAI nel binary Flutter.
 *
 * Suunto usa HTTP Basic Auth per il token exchange (non JSON body come Strava):
 *   Authorization: Basic Base64(client_id:client_secret)
 *   Content-Type: application/x-www-form-urlencoded
 */

const SUUNTO_TOKEN_URL = "https://cloudapi-oauth.suunto.com/oauth/token";
export const SUUNTO_REDIRECT_URI =
  "https://www.fitmesh.fit/api/v1/oauth/suunto/callback";

function getSuuntoEnv(): {
  clientId: string;
  clientSecret: string;
  subscriptionKey: string;
} {
  const clientId = process.env.SUUNTO_CLIENT_ID;
  const clientSecret = process.env.SUUNTO_CLIENT_SECRET;
  const subscriptionKey = process.env.SUUNTO_SUBSCRIPTION_KEY;
  if (!clientId || !clientSecret || !subscriptionKey) {
    throw new Error(
      "SUUNTO_CLIENT_ID, SUUNTO_CLIENT_SECRET, SUUNTO_SUBSCRIPTION_KEY devono essere configurati come env Vercel"
    );
  }
  return { clientId, clientSecret, subscriptionKey };
}

export type SuuntoTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix epoch seconds
  token_type: string;
};

function basicAuth(clientId: string, clientSecret: string): string {
  return (
    "Basic " +
    Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  );
}

/**
 * Decodifica il campo `exp` dal payload JWT per ricavare la scadenza.
 * Fallback: 6 ore da ora (tipica durata token Suunto).
 */
function extractExpiresAt(token: string): number {
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf8")
      ) as Record<string, unknown>;
      if (typeof payload.exp === "number") return payload.exp;
    }
  } catch {
    // ignore — usa fallback
  }
  return Math.floor(Date.now() / 1000) + 6 * 3600;
}

export async function exchangeSuuntoCode(
  code: string
): Promise<SuuntoTokenResponse> {
  const { clientId, clientSecret } = getSuuntoEnv();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: SUUNTO_REDIRECT_URI,
  });

  const res = await fetch(SUUNTO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new SuuntoApiError(res.status, body);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
    expires_at: extractExpiresAt(data.access_token),
    token_type: data.token_type ?? "Bearer",
  };
}

export async function refreshSuuntoToken(
  refreshToken: string
): Promise<SuuntoTokenResponse> {
  const { clientId, clientSecret } = getSuuntoEnv();

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(SUUNTO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new SuuntoApiError(res.status, body);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: extractExpiresAt(data.access_token),
    token_type: data.token_type ?? "Bearer",
  };
}

export class SuuntoApiError extends Error {
  constructor(
    public readonly suuntoStatus: number,
    public readonly suuntoBody: string
  ) {
    super(`Suunto API error ${suuntoStatus}: ${suuntoBody}`);
    this.name = "SuuntoApiError";
  }
}

// ─── Rate limit in-memory per IP ────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

type RateLimitEntry = { count: number; windowStart: number };
const _rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimitStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    _rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export function extractIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
