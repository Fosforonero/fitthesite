/**
 * Wahoo OAuth backend helpers — usati dalle route /api/v1/oauth/wahoo/*.
 *
 * WAHOO_CLIENT_SECRET vive SOLO qui (env Vercel), MAI nel binary Flutter.
 */

export { checkRateLimit, extractIp } from "./shared";

const WAHOO_TOKEN_URL = "https://api.wahooligan.com/oauth/token";

function getWahooEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.WAHOO_CLIENT_ID;
  const clientSecret = process.env.WAHOO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "WAHOO_CLIENT_ID e WAHOO_CLIENT_SECRET devono essere configurati come env Vercel"
    );
  }
  return { clientId, clientSecret };
}

export type WahooTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type: string;
};

export async function exchangeWahooCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<WahooTokenResponse> {
  const { clientId, clientSecret } = getWahooEnv();

  const body: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  };
  if (codeVerifier) body.code_verifier = codeVerifier;

  const res = await fetch(WAHOO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new WahooApiError(res.status, text);
  }

  const data = (await res.json()) as WahooTokenResponse;
  if (!data.expires_at && data.expires_in) {
    data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  }
  return data;
}

export async function refreshWahooToken(
  refreshToken: string
): Promise<WahooTokenResponse> {
  const { clientId, clientSecret } = getWahooEnv();

  const res = await fetch(WAHOO_TOKEN_URL, {
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
    const text = await res.text();
    throw new WahooApiError(res.status, text);
  }

  const data = (await res.json()) as WahooTokenResponse;
  if (!data.expires_at && data.expires_in) {
    data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  }
  return data;
}

export class WahooApiError extends Error {
  constructor(
    public readonly apiStatus: number,
    public readonly apiBody: string
  ) {
    super(`Wahoo API error ${apiStatus}: ${apiBody}`);
    this.name = "WahooApiError";
  }
}
