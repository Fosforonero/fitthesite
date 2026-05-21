/**
 * Google Play Developer API — validazione server-side IAP.
 *
 * Strategia: niente `googleapis` o `google-auth-library` (peso bundle elevato
 * e dipendenza pesante). Firmiamo a mano un JWT RS256 con `jose` (già transitive
 * via firebase-admin, ma dichiarato esplicito in package.json), lo scambiamo
 * per un access_token OAuth2, e chiamiamo gli endpoint REST con `fetch` nativo.
 *
 * Endpoints documentati:
 * - https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get
 * - https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get
 *
 * Timeout chiamate Google API: 4s (la route ha SLA 5s).
 */
import { importPKCS8, SignJWT } from "jose";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_PLAY_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const GOOGLE_API_BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";
const GOOGLE_FETCH_TIMEOUT_MS = 4000;

/** Service account JSON come parsed object (subset dei campi che usiamo). */
type ServiceAccountKey = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

/** Stato globale "service account configurato?" — null = non configurato. */
let cachedKey: ServiceAccountKey | null | undefined;

/** Cache access token in memoria, riutilizzato fino a `expiresAt - 60s`. */
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Legge `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` da env. Ritorna null se non
 * configurato (dev locale o staging senza service account). Ritorna throw
 * solo se è configurato ma malformato (errore di config esplicito).
 */
export function readServiceAccount(): ServiceAccountKey | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw || raw.trim().length === 0) {
    cachedKey = null;
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).client_email !== "string" ||
    typeof (parsed as Record<string, unknown>).private_key !== "string"
  ) {
    throw new Error(
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON missing client_email or private_key",
    );
  }
  const key = parsed as ServiceAccountKey;
  cachedKey = {
    client_email: key.client_email,
    private_key: key.private_key.replace(/\\n/g, "\n"),
    token_uri: key.token_uri ?? GOOGLE_TOKEN_URL,
  };
  return cachedKey;
}

/**
 * Ottiene un access_token OAuth2 valido per Google Play Developer API.
 * Riusa la cache se ancora valido (>60s di vita rimanente).
 * Throws su errore (caller dovrebbe ritornare 502).
 */
async function getAccessToken(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - now > 60) {
    return cachedToken.token;
  }

  const privateKey = await importPKCS8(key.private_key, "RS256");
  const assertion = await new SignJWT({ scope: GOOGLE_PLAY_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(key.client_email)
    .setSubject(key.client_email)
    .setAudience(key.token_uri ?? GOOGLE_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GOOGLE_FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(key.token_uri ?? GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`google_token_exchange_failed ${res.status} ${txt}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("google_token_exchange_no_access_token");
  }
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600),
  };
  return cachedToken.token;
}

/**
 * Risposta Google per subscription purchase (subset dei campi rilevanti).
 * Schema: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions
 */
export type GoogleSubscriptionPurchase = {
  expiryTimeMillis?: string;
  autoRenewing?: boolean;
  paymentState?: number;
  acknowledgementState?: number;
  orderId?: string;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  priceCurrencyCode?: string;
  priceAmountMicros?: string;
};

/**
 * Risposta Google per one-time product purchase (subset).
 * Schema: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products
 */
export type GoogleProductPurchase = {
  purchaseState?: number; // 0 = purchased, 1 = canceled, 2 = pending
  consumptionState?: number;
  acknowledgementState?: number;
  orderId?: string;
  purchaseTimeMillis?: string;
};

export type GooglePlayResult =
  | { kind: "ok_subscription"; data: GoogleSubscriptionPurchase }
  | { kind: "ok_product"; data: GoogleProductPurchase }
  | { kind: "expired"; status: number }
  | { kind: "error"; status: number; body: string };

async function callGooglePlay(
  url: string,
  accessToken: string,
): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GOOGLE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    const body = await res.text();
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Valida un purchase di subscription. `subscriptionId` = product ID Play.
 */
export async function validateSubscription(args: {
  packageName: string;
  subscriptionId: string;
  purchaseToken: string;
}): Promise<GooglePlayResult> {
  const key = readServiceAccount();
  if (!key) throw new Error("service_account_not_configured");

  const token = await getAccessToken(key);
  const url =
    `${GOOGLE_API_BASE}/${encodeURIComponent(args.packageName)}` +
    `/purchases/subscriptions/${encodeURIComponent(args.subscriptionId)}` +
    `/tokens/${encodeURIComponent(args.purchaseToken)}`;
  const r = await callGooglePlay(url, token);
  if (r.status === 200) {
    return { kind: "ok_subscription", data: JSON.parse(r.body) as GoogleSubscriptionPurchase };
  }
  if (r.status === 410) {
    return { kind: "expired", status: 410 };
  }
  return { kind: "error", status: r.status, body: r.body };
}

/**
 * Valida un purchase one-time non-consumable (lifetime).
 */
export async function validateProduct(args: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): Promise<GooglePlayResult> {
  const key = readServiceAccount();
  if (!key) throw new Error("service_account_not_configured");

  const token = await getAccessToken(key);
  const url =
    `${GOOGLE_API_BASE}/${encodeURIComponent(args.packageName)}` +
    `/purchases/products/${encodeURIComponent(args.productId)}` +
    `/tokens/${encodeURIComponent(args.purchaseToken)}`;
  const r = await callGooglePlay(url, token);
  if (r.status === 200) {
    return { kind: "ok_product", data: JSON.parse(r.body) as GoogleProductPurchase };
  }
  if (r.status === 410) {
    return { kind: "expired", status: 410 };
  }
  return { kind: "error", status: r.status, body: r.body };
}

/** Reset cache (per testing). */
export function __resetGooglePlayCacheForTests(): void {
  cachedKey = undefined;
  cachedToken = null;
}
