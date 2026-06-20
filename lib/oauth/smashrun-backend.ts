/**
 * Smashrun OAuth backend helpers — usati dalle route /api/v1/oauth/smashrun/*.
 *
 * SMASHRUN_CLIENT_SECRET vive SOLO qui (env Vercel), MAI nel binary Flutter.
 */

export { checkRateLimit, extractIp } from "./shared";

const SMASHRUN_TOKEN_URL = "https://api.smashrun.com/oauth/token";

function getSmashrunEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.SMASHRUN_CLIENT_ID;
  const clientSecret = process.env.SMASHRUN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "SMASHRUN_CLIENT_ID e SMASHRUN_CLIENT_SECRET devono essere configurati come env Vercel"
    );
  }
  return { clientId, clientSecret };
}

export type SmashrunTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type: string;
};

export async function exchangeSmashrunCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<SmashrunTokenResponse> {
  const { clientId, clientSecret } = getSmashrunEnv();

  const body: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  };
  if (codeVerifier) body.code_verifier = codeVerifier;

  const res = await fetch(SMASHRUN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new SmashrunApiError(res.status, text);
  }

  const data = (await res.json()) as SmashrunTokenResponse;
  // Normalizza expires_at se il provider ritorna solo expires_in
  if (!data.expires_at && data.expires_in) {
    data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  }
  return data;
}

export async function refreshSmashrunToken(
  refreshToken: string
): Promise<SmashrunTokenResponse> {
  const { clientId, clientSecret } = getSmashrunEnv();

  const res = await fetch(SMASHRUN_TOKEN_URL, {
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
    throw new SmashrunApiError(res.status, text);
  }

  const data = (await res.json()) as SmashrunTokenResponse;
  if (!data.expires_at && data.expires_in) {
    data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  }
  return data;
}

export class SmashrunApiError extends Error {
  constructor(
    public readonly apiStatus: number,
    public readonly apiBody: string
  ) {
    super(`Smashrun API error ${apiStatus}: ${apiBody}`);
    this.name = "SmashrunApiError";
  }
}
