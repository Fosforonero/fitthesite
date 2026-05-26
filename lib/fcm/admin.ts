/**
 * Firebase Admin SDK — singleton init per Cloud Messaging server-side.
 *
 * Service account JSON e' iniettato via env `FIREBASE_SERVICE_ACCOUNT_JSON_B64`
 * (base64 encoded perche' JSON con newlines del private_key e' fragile
 * in env vars piatti).
 *
 * Lazy init: la prima chiamata a getMessaging() costruisce l'app Firebase
 * e la cache; le successive riusano la stessa istanza.
 *
 * Solo per route server-side (cron sync-trigger, futuri webhook). Mai esposto
 * lato client.
 */
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

const APP_NAME = "fitmesh-fcm-admin";

let cachedApp: App | null = null;
let cachedMessaging: Messaging | null = null;

type ServiceAccountKey = {
  project_id: string;
  client_email: string;
  private_key: string;
};

/**
 * Decodifica + parse del service account dalla env var base64.
 * Throws se mancante o malformato (errore di config esplicito).
 */
function readServiceAccount(): ServiceAccountKey {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
  if (!raw || raw.trim().length === 0) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON_B64 not set (Firebase Admin disabled)",
    );
  }
  let decoded: string;
  try {
    decoded = Buffer.from(raw, "base64").toString("utf-8");
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON_B64 is not valid base64");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON_B64 does not decode to valid JSON");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).project_id !== "string" ||
    typeof (parsed as Record<string, unknown>).client_email !== "string" ||
    typeof (parsed as Record<string, unknown>).private_key !== "string"
  ) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON_B64 missing project_id / client_email / private_key",
    );
  }
  return parsed as ServiceAccountKey;
}

/** Inizializza Firebase Admin (o riusa cache). Throws su config errata. */
function ensureApp(): App {
  if (cachedApp) return cachedApp;

  // Se un'app con lo stesso nome esiste gia' (es. hot reload dev), riusala
  // invece di chiamare initializeApp() che lancerebbe duplicate-app error.
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) {
    cachedApp = existing;
    return existing;
  }

  const sa = readServiceAccount();
  cachedApp = initializeApp(
    {
      credential: cert({
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key,
      }),
    },
    APP_NAME,
  );
  return cachedApp;
}

/** Singleton Messaging client. Lazy init alla prima chiamata. */
export function getFcmMessaging(): Messaging {
  if (cachedMessaging) return cachedMessaging;
  cachedMessaging = getMessaging(ensureApp());
  return cachedMessaging;
}

/** True se Firebase Admin e' configurato (env var presente + JSON valido). */
export function isFcmConfigured(): boolean {
  try {
    readServiceAccount();
    return true;
  } catch {
    return false;
  }
}
