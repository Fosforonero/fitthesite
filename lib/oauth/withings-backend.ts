/**
 * Withings OAuth backend helpers — usati dalle route /api/v1/oauth/withings/*.
 *
 * WITHINGS_CLIENT_SECRET vive SOLO qui (env Vercel), MAI nel binary Flutter.
 *
 * Withings Health API v2 quirks:
 *   - endpoint unico https://wbsapi.withings.net/v2/oauth2 (POST formurlencoded)
 *   - campo obbligatorio `action=requesttoken` nel body
 *   - risposta wrappata in `{ status: number, body: {...} }`; status 0 = success
 *
 * La response wrappata viene passata al client COSÌ COM'È: il provider Dart
 * (withings_provider.dart) fa già _unwrapToken su `{ status, body }`.
 */

// Rate limit + extractIp sono condivisi tra tutti i provider OAuth.
export { checkRateLimit, extractIp } from "./shared";

const WITHINGS_TOKEN_URL = "https://wbsapi.withings.net/v2/oauth2";
export const WITHINGS_REDIRECT_URI =
  "https://fitmesh.fit/oauth/withings/callback";

/**
 * Legge env vars obbligatorie. Ritorna `null` se mancano (fail-closed lato route
 * con 503), così l'import non lancia mai e la build passa anche senza env.
 */
export function getWithingsEnv():
  | { clientId: string; clientSecret: string }
  | null {
  const clientId = process.env.WITHINGS_CLIENT_ID;
  const clientSecret = process.env.WITHINGS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Response wrappata Withings — status 0 = success. */
export type WithingsTokenResponse = {
  status: number;
  body?: Record<string, unknown>;
  error?: string;
};

export async function exchangeWithingsCode(
  code: string,
  redirectUri: string,
  env: { clientId: string; clientSecret: string }
): Promise<WithingsTokenResponse> {
  const params = new URLSearchParams({
    action: "requesttoken",
    grant_type: "authorization_code",
    client_id: env.clientId,
    client_secret: env.clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  return postWithings(params);
}

export async function refreshWithingsToken(
  refreshToken: string,
  env: { clientId: string; clientSecret: string }
): Promise<WithingsTokenResponse> {
  const params = new URLSearchParams({
    action: "requesttoken",
    grant_type: "refresh_token",
    client_id: env.clientId,
    client_secret: env.clientSecret,
    refresh_token: refreshToken,
  });

  return postWithings(params);
}

async function postWithings(
  params: URLSearchParams
): Promise<WithingsTokenResponse> {
  const res = await fetch(WITHINGS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new WithingsApiError(res.status, body);
  }

  const data = (await res.json()) as WithingsTokenResponse;
  // status != 0 → errore applicativo Withings (HTTP era 200).
  if (data.status !== 0) {
    throw new WithingsApiError(200, JSON.stringify(data));
  }
  return data;
}

/** Errore HTTP proveniente da Withings, con status code originale. */
export class WithingsApiError extends Error {
  constructor(
    public readonly withingsStatus: number,
    public readonly withingsBody: string
  ) {
    super(`Withings API error ${withingsStatus}: ${withingsBody}`);
    this.name = "WithingsApiError";
  }
}
