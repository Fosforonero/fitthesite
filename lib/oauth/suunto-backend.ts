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

import { formUrlEncode } from "./form-urlencoded";

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
  // Un valore vuoto o di soli spazi conta come configurazione mancante: non e'
  // una credenziale da mandare a Suunto (un server tipo Spring AS, con hasText,
  // risponderebbe 400 invalid_request, indistinguibile dagli altri casi).
  if (!clientId?.trim() || !clientSecret?.trim()) {
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

/**
 * Forma (MAI il valore) di un authorization code, per capire se lo alteriamo
 * fra la callback e lo scambio: lunghezza e presenza di '+', spazi, sequenze
 * percentuali e altri caratteri non alfanumerici. Solo numeri e booleani.
 */
export type SuuntoCodeShape = {
  len: number;
  plus: boolean;
  space: boolean;
  pct: boolean;
  other: number;
};

export function suuntoCodeShape(code: string): SuuntoCodeShape {
  return {
    len: code.length,
    plus: code.includes("+"),
    space: code.includes(" "),
    pct: /%[0-9A-Fa-f]{2}/.test(code),
    other: (code.match(/[^A-Za-z0-9\-_.~+ %]/g) ?? []).length,
  };
}

/** Log strutturato della sola forma del code (nessun valore). */
export function logSuuntoCodeShape(
  route: "callback" | "exchange",
  shape: SuuntoCodeShape,
  extra?: { legacyDiffers: boolean }
): void {
  console.log(
    JSON.stringify({ evt: "suunto_oauth_code", route, ...shape, ...(extra ?? {}) })
  );
}

/**
 * Valore del primo parametro `code` della query, decodificato SOLO con le
 * sequenze percentuali: un '+' letterale resta un '+'. `URLSearchParams.get`
 * lo trasformerebbe in uno spazio (form-encoding), alterando un code che
 * contenga un '+' non codificato. null se assente o malformato (allora si usa
 * il comportamento di prima).
 */
export function suuntoCodeFromQuery(search: string): string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const part of query.split("&")) {
    if (part === "code" || part.startsWith("code=")) {
      const raw = part.includes("=") ? part.slice(part.indexOf("=") + 1) : "";
      try {
        return decodeURIComponent(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
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

/**
 * Header Basic del token endpoint: tre fonti da NON confondere.
 *
 * 1. Cosa richiede la RFC. RFC 6749 §2.3.1 (con l'Appendice B): id e segreto
 *    si codificano con application/x-www-form-urlencoded PRIMA di unirli con
 *    ':' e passarli al Base64; il server li decodifica.
 * 2. Cosa dice la documentazione Suunto. La FAQ e la guida API Zone descrivono
 *    Basic come Base64(client_id:client_secret) e un `curl --user`, con esempi
 *    fatti di soli caratteri che la codifica lascia invariati: non dicono se
 *    Suunto decodifica, ne' cosa succede con caratteri speciali. Non sappiamo
 *    quale delle due forme Suunto si aspetti.
 * 3. Cosa fa il nostro finto server di test (suunto-basic-rfc6749.test.ts):
 *    decodifica come java.net.URLDecoder, sul modello di Spring Authorization
 *    Server. Prova solo che QUESTO codice si comporta bene CONTRO quel modello;
 *    non prova come si comporta Suunto.
 *
 * Ipotesi NON dimostrata: Production risponde 400 invalid_request perche' id o
 * segreto contengono caratteri che un server decodificante legge diversamente
 * (es. un '%' non seguito da due cifre esadecimali). Nessuno ha visto il
 * segreto reale e nessuno lo deve estrarre.
 *
 * Quindi, per non cambiare nulla dove il grezzo funziona: si prova SEMPRE
 * prima il grezzo (comportamento in produzione); solo se la risposta e' 400
 * invalid_request o 401 invalid_client E la forma codificata e' diversa, si
 * ritenta UNA volta con la forma codificata. Se un server si comporta come
 * Spring AS, entrambi gli errori nascono nell'autenticazione del client, prima
 * che il code sia consumato; per Suunto non e' verificato, e nel caso peggiore
 * il ritentativo costa un invalid_grant gia' destinato a fallire. Per id e
 * segreti fatti solo di A-Za-z0-9 e * - . _ le due forme coincidono: nessun
 * ritentativo, header identico a prima.
 */
function basicAuth(clientId: string, clientSecret: string, rfc6749: boolean): string {
  const id = rfc6749 ? formUrlEncode(clientId) : clientId;
  const segreto = rfc6749 ? formUrlEncode(clientSecret) : clientSecret;
  return "Basic " + Buffer.from(`${id}:${segreto}`).toString("base64");
}

/** Il campo `error` del corpo di Suunto, se leggibile. */
function erroreSuunto(body: string): string {
  return safeSuuntoErrorField(body);
}

/**
 * POST al token endpoint (scambio E rinnovo passano entrambi da qui): grezzo,
 * poi al piu' un ritentativo form-urlencoded RFC 6749 §2.3.1 (vedi sopra). Log
 * della sola variante e dell'esito, mai valori.
 */
async function postTokenSuunto(
  route: "exchange" | "refresh",
  params: URLSearchParams
): Promise<Response> {
  const { clientId, clientSecret } = getSuuntoOAuthEnv();
  const invia = (rfc6749: boolean) =>
    fetch(SUUNTO_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: basicAuth(clientId, clientSecret, rfc6749),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

  const grezzo = await invia(false);
  const formeDiverse =
    basicAuth(clientId, clientSecret, false) !==
    basicAuth(clientId, clientSecret, true);
  if (grezzo.ok || !formeDiverse) return grezzo;
  if (grezzo.status !== 400 && grezzo.status !== 401) return grezzo;
  const corpo = await grezzo.text();
  const errore = erroreSuunto(corpo);
  const ritenta =
    (grezzo.status === 400 && errore === "invalid_request") ||
    (grezzo.status === 401 && errore === "invalid_client");
  if (!ritenta) {
    return new Response(corpo, { status: grezzo.status, headers: grezzo.headers });
  }
  const codificato = await invia(true);
  // Solo categorie: variante provata, esito della prima e della seconda
  // richiesta, campo `error` della seconda. Mai id, segreto, code o token.
  console.log(
    JSON.stringify({
      evt: "suunto_oauth_basic",
      route,
      variante: "form_urlencoded_rfc6749",
      primo: `${grezzo.status} ${errore}`,
      esito: codificato.status,
      errore: codificato.ok ? null : erroreSuunto(await codificato.clone().text()),
    })
  );
  return codificato;
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
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: SUUNTO_REDIRECT_URI,
  });

  const res = await postTokenSuunto("exchange", params);

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
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await postTokenSuunto("refresh", params);

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
