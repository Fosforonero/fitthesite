/**
 * Dexcom OAuth backend helpers — usati dalle route /api/v1/oauth/dexcom/*.
 *
 * DEXCOM_CLIENT_SECRET vive SOLO qui (env Vercel), MAI nel binary Flutter.
 * Dexcom usa form-urlencoded + Basic Auth (clientId:clientSecret).
 */

export { checkRateLimit, extractIp } from "./shared";

const DEXCOM_TOKEN_URL = "https://api.dexcom.com/v2/oauth2/token";

function getDexcomEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.DEXCOM_CLIENT_ID;
  const clientSecret = process.env.DEXCOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "DEXCOM_CLIENT_ID e DEXCOM_CLIENT_SECRET devono essere configurati come env Vercel"
    );
  }
  return { clientId, clientSecret };
}

export type DexcomTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type: string;
};

function buildBasicAuth(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export async function exchangeDexcomCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<DexcomTokenResponse> {
  const { clientId, clientSecret } = getDexcomEnv();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (codeVerifier) params.set("code_verifier", codeVerifier);

  const res = await fetch(DEXCOM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: buildBasicAuth(clientId, clientSecret),
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new DexcomApiError(res.status, text);
  }

  const data = (await res.json()) as DexcomTokenResponse;
  if (!data.expires_at && data.expires_in) {
    data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  }
  return data;
}

export async function refreshDexcomToken(
  refreshToken: string
): Promise<DexcomTokenResponse> {
  const { clientId, clientSecret } = getDexcomEnv();

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(DEXCOM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: buildBasicAuth(clientId, clientSecret),
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new DexcomApiError(res.status, text);
  }

  const data = (await res.json()) as DexcomTokenResponse;
  if (!data.expires_at && data.expires_in) {
    data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  }
  return data;
}

export class DexcomApiError extends Error {
  constructor(
    public readonly apiStatus: number,
    public readonly apiBody: string
  ) {
    super(`Dexcom API error ${apiStatus}: ${apiBody}`);
    this.name = "DexcomApiError";
  }
}
