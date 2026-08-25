/**
 * App Store Server Notifications V2 — verifica e lettura.
 *
 * Lo stesso trust store e la stessa disciplina del percorso sincrono: i root
 * pubblici di Apple, il bundle id verificato, l'ambiente verificato, e la
 * distinzione fra «l'acquisto e' rifiutato» e «non siamo riusciti a
 * verificare», che non e' un dettaglio ma la differenza fra togliere il Pro a
 * chi ha pagato e riprovare fra un minuto.
 *
 * NON decide niente sull'entitlement. Legge la notifica e ne estrae i fatti;
 * chi li applica e' la stessa autorita' della route sincrona.
 */
import {
  Environment,
  SignedDataVerifier,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";

import {
  APPLE_APP_APPLE_ID,
  APPLE_BUNDLE_ID,
  type AppleJwsRejection,
  looksLikeJws,
  outcomeForVerificationError,
  sandboxTransactionsAllowed,
  withDeadline,
} from "./app-store-jws";
import { APPLE_ROOT_CERTIFICATES } from "./apple-root-ca";

/** Gli stessi cinque secondi del percorso sincrono. */
const DEADLINE_MS = 5_000;

let verificatoreProduzione: SignedDataVerifier | null = null;
let verificatoreSandbox: SignedDataVerifier | null = null;

function verificatore(env: Environment): SignedDataVerifier {
  if (env === Environment.PRODUCTION) {
    verificatoreProduzione ??= new SignedDataVerifier(
      APPLE_ROOT_CERTIFICATES,
      true,
      Environment.PRODUCTION,
      APPLE_BUNDLE_ID,
      APPLE_APP_APPLE_ID,
    );
    return verificatoreProduzione;
  }
  verificatoreSandbox ??= new SignedDataVerifier(
    APPLE_ROOT_CERTIFICATES,
    true,
    Environment.SANDBOX,
    APPLE_BUNDLE_ID,
  );
  return verificatoreSandbox;
}

export type NotificaApple = {
  /** Stabile attraverso le riconsegne: e' la chiave dell'idempotenza. */
  notificationUUID: string;
  notificationType: string;
  subtype: string | null;
  environment: "Production" | "Sandbox";
  /** Presente solo nelle notifiche che riguardano una transazione. */
  transaction: JWSTransactionDecodedPayload | null;
  /** L'orologio di APPLE su questa evidenza, non il nostro. */
  signedDateMs: number | null;
};

export type EsitoNotificaApple =
  | { kind: "ok"; notifica: NotificaApple }
  | { kind: "rejected"; reason: AppleJwsRejection }
  | { kind: "retryable" };

/**
 * Verifica un `signedPayload` e ne estrae i fatti.
 *
 * L'ambiente si scopre verificando, non chiedendo: si prova la produzione, e
 * solo se Apple dice che quella evidenza e' di Sandbox si riprova col
 * verificatore Sandbox — e solo se questo ambiente e' autorizzato ad
 * accettarne. Il contrario (fidarsi del campo `environment` del payload prima
 * di verificarlo) significherebbe lasciare che sia il mittente a dichiarare in
 * quale mondo vive.
 */
export async function verificaNotificaApple(
  signedPayload: unknown,
): Promise<EsitoNotificaApple> {
  if (typeof signedPayload !== "string" || !looksLikeJws(signedPayload)) {
    return { kind: "rejected", reason: "jws_malformed" };
  }

  const ambienti: Environment[] = sandboxTransactionsAllowed()
    ? [Environment.PRODUCTION, Environment.SANDBOX]
    : [Environment.PRODUCTION];

  let ultimo: EsitoNotificaApple = { kind: "retryable" };
  for (const env of ambienti) {
    try {
      const decodificata = await withDeadline(
        verificatore(env).verifyAndDecodeNotification(signedPayload),
        DEADLINE_MS,
      );
      return leggiNotifica(decodificata, env);
    } catch (e) {
      const esito = outcomeForVerificationError(e);
      if (esito.kind === "retryable") return { kind: "retryable" };
      if (esito.kind !== "rejected") {
        // `outcomeForVerificationError` dichiara un tipo piu' largo di quello
        // che restituisce: `ok` e `revoked` non possono uscire da un errore.
        // Il ramo esiste perche' il compilatore non puo' saperlo, e nel dubbio
        // si ritenta invece di dedurre un rifiuto che nessuno ha pronunciato.
        return { kind: "retryable" };
      }
      ultimo = { kind: "rejected", reason: esito.reason };
      // Un rifiuto su produzione puo' significare «questa e' Sandbox»: si
      // riprova col prossimo ambiente, se e' ammesso. Se non lo e', il ciclo
      // finisce qui e il rifiuto e' quello giusto.
    }
  }
  return ultimo;
}

function leggiNotifica(
  payload: ResponseBodyV2DecodedPayload,
  env: Environment,
): EsitoNotificaApple {
  const uuid = payload.notificationUUID;
  const tipo = payload.notificationType;
  if (typeof uuid !== "string" || uuid.length === 0 || typeof tipo !== "string") {
    // Firma buona, contenuto inutilizzabile. Senza identificatore di consegna
    // non esiste idempotenza, e senza tipo non si sa cosa applicare.
    return { kind: "rejected", reason: "jws_incomplete" };
  }

  const tx = (payload.data?.signedTransactionInfo ?? null) as unknown;
  const transazione =
    tx && typeof tx === "object"
      ? (tx as JWSTransactionDecodedPayload)
      : null;

  const signedDate =
    typeof payload.signedDate === "number" ? payload.signedDate : null;

  return {
    kind: "ok",
    notifica: {
      notificationUUID: uuid,
      notificationType: tipo,
      subtype: typeof payload.subtype === "string" ? payload.subtype : null,
      environment: env === Environment.PRODUCTION ? "Production" : "Sandbox",
      transaction: transazione,
      signedDateMs: signedDate,
    },
  };
}

/**
 * I tipi di notifica che tolgono un diritto.
 *
 * Elencati e non dedotti: «tutto cio' che non e' un acquisto e' una revoca»
 * sarebbe una regola che il giorno in cui Apple aggiunge un tipo nuovo
 * revocherebbe a qualcuno il diritto per cui ha pagato. Un tipo sconosciuto
 * non fa niente e resta registrato, che e' il comportamento sicuro.
 */
export const NOTIFICHE_DI_REVOCA: ReadonlySet<string> = new Set([
  "REFUND",
  "REVOKE",
  "CONSUMPTION_REQUEST",
]);

/** I tipi che confermano o rinnovano un diritto. */
export const NOTIFICHE_DI_ACQUISTO: ReadonlySet<string> = new Set([
  "SUBSCRIBED",
  "DID_RENEW",
  "OFFER_REDEEMED",
  "REFUND_REVERSED",
]);
