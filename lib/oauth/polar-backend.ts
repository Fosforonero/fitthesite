/**
 * Polar OAuth backend helpers — usati dalla route /api/v1/oauth/polar/exchange.
 *
 * POLAR_CLIENT_SECRET vive SOLO qui (env Vercel), MAI nel binary Flutter.
 *
 * Polar AccessLink v3 usa HTTP Basic Auth per il token exchange:
 *   Authorization: Basic Base64(client_id:client_secret)
 *   Content-Type: application/x-www-form-urlencoded
 *
 * Niente refresh: Polar AccessLink non emette refresh_token (access_token ~1 anno).
 * Dopo l'exchange l'utente va registrato su AccessLink (POST /v3/users), altrimenti
 * le API Polar restituiscono errori.
 */

// Rate limit + extractIp sono condivisi tra tutti i provider OAuth.
export { checkRateLimit, extractIp } from "./shared";

const POLAR_TOKEN_URL = "https://polarremote.com/v2/oauth2/token";
const POLAR_USERS_URL = "https://www.polaraccesslink.com/v3/users";
export const POLAR_REDIRECT_URI =
  "https://fitmesh.fit/oauth/polar/callback";

/**
 * Legge env vars obbligatorie. Ritorna `null` se mancano (fail-closed lato route
 * con 503), così l'import non lancia mai e la build passa anche senza env.
 */
export function getPolarEnv(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.POLAR_CLIENT_ID;
  const clientSecret = process.env.POLAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export type PolarTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number; // secondi (tipicamente ~1 anno)
  x_user_id: number;
};

function basicAuth(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

/**
 * Scambia un authorization code per un access_token Polar e registra l'utente
 * su AccessLink (POST /v3/users). Ritorna la response token Polar così com'è.
 */
export async function exchangePolarCode(
  code: string,
  redirectUri: string,
  env: { clientId: string; clientSecret: string }
): Promise<PolarTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(POLAR_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(env.clientId, env.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new PolarApiError(res.status, body);
  }

  const token = (await res.json()) as PolarTokenResponse;

  // Registrazione utente su AccessLink — obbligatoria, senza questa le API
  // Polar non funzionano. 409 Conflict = utente già registrato → successo.
  await registerPolarUser(token.access_token, token.x_user_id);

  return token;
}

/**
 * Registra l'utente su Polar AccessLink. 409 Conflict significa che l'utente
 * è già registrato: lo trattiamo come successo.
 */
async function registerPolarUser(
  accessToken: string,
  memberId: number
): Promise<void> {
  const res = await fetch(POLAR_USERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ "member-id": String(memberId) }),
  });

  if (res.ok || res.status === 409) return;

  const body = await res.text();
  throw new PolarApiError(res.status, body);
}

/** Errore HTTP proveniente da Polar, con status code originale. */
export class PolarApiError extends Error {
  constructor(
    public readonly polarStatus: number,
    public readonly polarBody: string
  ) {
    super(`Polar API error ${polarStatus}: ${polarBody}`);
    this.name = "PolarApiError";
  }
}
