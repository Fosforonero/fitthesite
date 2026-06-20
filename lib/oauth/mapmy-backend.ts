/**
 * MapMyFitness (Under Armour) OAuth backend helpers.
 * Route: /api/v1/oauth/mapmy/*
 *
 * MAPMY_CLIENT_SECRET vive SOLO qui (env Vercel), MAI nel binary Flutter.
 * UA OAuth accetta sia JSON che form-urlencoded; usiamo form-urlencoded
 * con Basic Auth header (clientId:clientSecret) come da spec UA.
 */

export { checkRateLimit, extractIp } from "./shared";

const MAPMY_TOKEN_URL =
  "https://oauth2.mapmyfitness.com/v7.1/oauth2/access_token";

function getMapMyEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.MAPMY_CLIENT_ID;
  const clientSecret = process.env.MAPMY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "MAPMY_CLIENT_ID e MAPMY_CLIENT_SECRET devono essere configurati come env Vercel"
    );
  }
  return { clientId, clientSecret };
}

export type MapMyTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type: string;
};

function buildBasicAuth(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export async function exchangeMapMyCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<MapMyTokenResponse> {
  const { clientId, clientSecret } = getMapMyEnv();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (codeVerifier) params.set("code_verifier", codeVerifier);

  const res = await fetch(MAPMY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: buildBasicAuth(clientId, clientSecret),
      "Api-Key": clientId,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new MapMyApiError(res.status, text);
  }

  const data = (await res.json()) as MapMyTokenResponse;
  if (!data.expires_at && data.expires_in) {
    data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  }
  return data;
}

export async function refreshMapMyToken(
  refreshToken: string
): Promise<MapMyTokenResponse> {
  const { clientId, clientSecret } = getMapMyEnv();

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(MAPMY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: buildBasicAuth(clientId, clientSecret),
      "Api-Key": clientId,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new MapMyApiError(res.status, text);
  }

  const data = (await res.json()) as MapMyTokenResponse;
  if (!data.expires_at && data.expires_in) {
    data.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  }
  return data;
}

export class MapMyApiError extends Error {
  constructor(
    public readonly apiStatus: number,
    public readonly apiBody: string
  ) {
    super(`MapMyFitness API error ${apiStatus}: ${apiBody}`);
    this.name = "MapMyApiError";
  }
}
