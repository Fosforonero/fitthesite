/**
 * Suunto OAuth backend helpers — usati dalle route /api/v1/oauth/suunto/*.
 *
 * SUUNTO_CLIENT_SECRET vive SOLO qui (env Vercel),
 * MAI nel binary Flutter.
 *
 * Suunto usa HTTP Basic Auth per il token exchange (non JSON body come Strava):
 *   Authorization: Basic Base64(client_id:client_secret)
 *   Content-Type: application/x-www-form-urlencoded
 */

// Rate limit + extractIp sono condivisi tra tutti i provider OAuth.
// Re-export per non cambiare gli import delle route esistenti.
export { checkRateLimit, extractIp } from "./shared";

const SUUNTO_TOKEN_URL = "https://cloudapi-oauth.suunto.com/oauth/token";
export const SUUNTO_REDIRECT_URI =
  "https://www.fitmesh.fit/api/v1/oauth/suunto/callback";

/**
 * Per exchange e refresh servono SOLO id e secret (Basic Auth). La
 * SUBSCRIPTION_KEY serve al proxy dati (lib/api/suunto-proxy.ts, che gestisce
 * da solo il suo 503): la sua assenza non deve rompere il collegamento.
 */
function getSuuntoOAuthEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.SUUNTO_CLIENT_ID;
  const clientSecret = process.env.SUUNTO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "SUUNTO_CLIENT_ID e SUUNTO_CLIENT_SECRET devono essere configurati come env Vercel"
    );
  }
  return { clientId, clientSecret };
}

/**
 * Log strutturato per i rami d'errore delle route OAuth Suunto. Scrive SOLO:
 * evento, route, codice FitMesh, stato HTTP di Suunto e il campo `error` del
 * JSON di Suunto se e' un identificatore corto (/^[a-z_]{1,40}$/), altrimenti
 * 'unparsed'. Mai code, token, corpo di Suunto, id/secret o dati utente.
 */
export function logSuuntoOAuthError(
  route: "exchange" | "refresh",
  code: string,
  suunto?: { status: number; body: string }
): void {
  const entry: Record<string, unknown> = {
    evt: "suunto_oauth_error",
    route,
    code,
  };
  if (suunto) {
    entry.suuntoStatus = suunto.status;
    entry.error = safeSuuntoErrorField(suunto.body);
  }
  console.warn(JSON.stringify(entry));
}

function safeSuuntoErrorField(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed?.error === "string" && /^[a-z_]{1,40}$/.test(parsed.error)) {
      return parsed.error;
    }
  } catch {
    // corpo non JSON
  }
  return "unparsed";
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
  const { clientId, clientSecret } = getSuuntoOAuthEnv();

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
  const { clientId, clientSecret } = getSuuntoOAuthEnv();

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
