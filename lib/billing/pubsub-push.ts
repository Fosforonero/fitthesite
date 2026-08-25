/**
 * Autenticazione delle consegne push di Google Pub/Sub.
 *
 * Una sottoscrizione push configurata con un service account allega a ogni
 * consegna un token OIDC firmato da Google. Verificarlo e' l'unica cosa che
 * distingue una notifica di Google da una richiesta di chiunque: l'endpoint e'
 * pubblico per forza, e cio' che arriva puo' REVOCARE un diritto.
 *
 * FALLISCE CHIUSO, SEMPRE
 * -----------------------
 * Se le variabili d'ambiente non ci sono, la verifica non passa. Un endpoint
 * che accettasse consegne non verificate «perche' non e' ancora configurato»
 * sarebbe un modo per togliere il Pro a chiunque, a chiunque lo chieda.
 *
 * Nessuna dipendenza nuova: `jose` e' gia' in uso per firmare i JWT verso la
 * Developer API.
 */
import { type JWTPayload, createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");

/** Riusato fra invocazioni: `jose` mette in cache le chiavi e le rinnova. */
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function chiavi(): ReturnType<typeof createRemoteJWKSet> {
  jwks ??= createRemoteJWKSet(GOOGLE_JWKS_URL);
  return jwks;
}

export type EsitoPush =
  | { kind: "ok"; email: string }
  /** Non e' Google, o non e' per noi. Non si riprova: si rifiuta. */
  | { kind: "rejected"; reason: string }
  /** Non siamo riusciti a verificare. Non e' colpa del mittente. */
  | { kind: "retryable"; reason: string };

/**
 * `aud` deve essere l'URL esatto configurato sulla sottoscrizione, e
 * `email` il service account che abbiamo autorizzato. Verificare solo la firma
 * non basterebbe: qualunque token OIDC valido di Google, emesso per chiunque,
 * passerebbe.
 */
export async function verificaPushPubSub(req: Request): Promise<EsitoPush> {
  const audience = process.env.PUBSUB_PUSH_AUDIENCE;
  const serviceAccount = process.env.PUBSUB_PUSH_SERVICE_ACCOUNT;
  if (!audience || !serviceAccount) {
    return {
      kind: "retryable",
      reason: "pubsub_push_non_configurato",
    };
  }

  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer (.+)$/.exec(header);
  if (!m) return { kind: "rejected", reason: "token_assente" };

  let payload: JWTPayload;
  try {
    const verificato = await jwtVerify(m[1]!, chiavi(), {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
    });
    payload = verificato.payload;
  } catch (e) {
    // La distinzione che conta: una firma sbagliata e' un rifiuto, un JWKS
    // irraggiungibile e' un nostro problema di rete. Confonderli
    // significherebbe scartare notifiche vere durante un guasto di rete.
    const nome = e instanceof Error ? e.name : "sconosciuto";
    if (nome === "JWSSignatureVerificationFailed" || nome === "JWTClaimValidationFailed") {
      return { kind: "rejected", reason: nome };
    }
    if (nome === "JWTExpired") return { kind: "rejected", reason: nome };
    return { kind: "retryable", reason: nome };
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  if (payload.email_verified !== true) {
    return { kind: "rejected", reason: "email_non_verificata" };
  }
  if (email !== serviceAccount) {
    // Non si logga quale email e' arrivata: sarebbe un dato di un'identita'
    // altrui in un log. Basta sapere che non e' quella attesa.
    return { kind: "rejected", reason: "service_account_non_autorizzato" };
  }

  return { kind: "ok", email };
}

/** Il corpo di una consegna push, nella sola parte che ci serve. */
export type MessaggioPubSub = {
  messageId: string;
  /** Il payload RTDN, gia' decodificato da base64 e da JSON. */
  dati: Record<string, unknown>;
};

export function leggiMessaggioPubSub(corpo: unknown): MessaggioPubSub | null {
  if (!corpo || typeof corpo !== "object") return null;
  const message = (corpo as Record<string, unknown>).message;
  if (!message || typeof message !== "object") return null;

  const m = message as Record<string, unknown>;
  const messageId = typeof m.messageId === "string" ? m.messageId : "";
  if (messageId.length === 0) {
    // Senza `messageId` non esiste idempotenza, e senza idempotenza una
    // riconsegna diventa un secondo effetto. Meglio rifiutare.
    return null;
  }

  const data = typeof m.data === "string" ? m.data : "";
  if (data.length === 0) return null;

  try {
    const grezzo = Buffer.from(data, "base64").toString("utf8");
    const dati = JSON.parse(grezzo) as unknown;
    if (!dati || typeof dati !== "object") return null;
    return { messageId, dati: dati as Record<string, unknown> };
  } catch {
    return null;
  }
}
