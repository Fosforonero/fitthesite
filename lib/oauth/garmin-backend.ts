/**
 * Garmin Connect OAuth2 backend helpers — usati dalle route /api/v1/oauth/garmin/*.
 *
 * SCAFFOLD (2026-06-18): struttura pronta, NON ancora attiva. Si attiva quando
 * il Garmin Connect Developer Program è approvato e le env sono configurate su
 * Vercel. Finché GARMIN_CLIENT_ID/SECRET non ci sono, le route ritornano
 * server_misconfigured e non fanno nulla.
 *
 * GARMIN_CLIENT_ID e GARMIN_CLIENT_SECRET vivono SOLO qui (env Vercel), MAI nel
 * binary Flutter. Stesso modello di Suunto.
 *
 * Il programma usa OAuth 2.0 (PKCE). Endpoint, scope e parametri esatti vanno
 * confermati dal developer portal DOPO l'approvazione (vedi TODO sotto).
 */

// Rate limit + extractIp condivisi tra tutti i provider OAuth.
export { checkRateLimit, extractIp } from "./shared";

// TODO(garmin): confermare gli endpoint OAuth2 dal portal approvato.
const GARMIN_TOKEN_URL =
  "https://diauth.garmin.com/di-oauth2-service/oauth/token";
export const GARMIN_REDIRECT_URI =
  "https://www.fitmesh.fit/api/v1/oauth/garmin/callback";

function getGarminEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GARMIN_CLIENT_ID;
  const clientSecret = process.env.GARMIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GARMIN_CLIENT_ID e GARMIN_CLIENT_SECRET devono essere configurati come env Vercel"
    );
  }
  return { clientId, clientSecret };
}

export type GarminTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix epoch seconds
  token_type: string;
};

function expiresAtFrom(expiresIn: unknown): number {
  const secs = typeof expiresIn === "number" ? expiresIn : 3600;
  return Math.floor(Date.now() / 1000) + secs;
}

export class GarminApiError extends Error {
  constructor(
    public readonly garminStatus: number,
    public readonly garminBody: string
  ) {
    super(`Garmin API error ${garminStatus}: ${garminBody}`);
    this.name = "GarminApiError";
  }
}

/**
 * Scambia il `code` OAuth2 (authorization_code) per access+refresh token.
 * `codeVerifier` opzionale (PKCE) — l'app lo passa se usa il flow PKCE.
 */
export async function exchangeGarminCode(
  code: string,
  codeVerifier?: string
): Promise<GarminTokenResponse> {
  const { clientId, clientSecret } = getGarminEnv();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: GARMIN_REDIRECT_URI,
  });
  if (codeVerifier) params.set("code_verifier", codeVerifier);

  const res = await fetch(GARMIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new GarminApiError(res.status, await res.text());
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
    expires_at: expiresAtFrom(data.expires_in),
    token_type: data.token_type ?? "Bearer",
  };
}

export async function refreshGarminToken(
  refreshToken: string
): Promise<GarminTokenResponse> {
  const { clientId, clientSecret } = getGarminEnv();

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(GARMIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new GarminApiError(res.status, await res.text());
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: expiresAtFrom(data.expires_in),
    token_type: data.token_type ?? "Bearer",
  };
}
