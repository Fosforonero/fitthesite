/**
 * Verifica delle transazioni StoreKit 2 (JWS).
 *
 * Perche' esiste: l'app usa StoreKit 2 (default del plugin
 * `in_app_purchase_storekit` dalla 0.4.0), e li' `serverVerificationData` NON
 * e' una ricevuta base64 ma il JWS della transazione. Inoltrarlo a
 * `verifyReceipt` come faceva `app-store.ts` produce sempre "ricevuta
 * malformata": e' il motivo per cui un acquisto incassato il 5 agosto 2026 non
 * ha mai prodotto una riga in `b2c_subscriptions`. Vedi
 * `AppFitmesh/docs/sprints/P0-apple-acquisto-non-servito.md`.
 *
 * Il ramo `verifyReceipt` resta in `app-store.ts` e serve SOLO i client
 * realmente StoreKit 1 (iOS sotto la 15). I due formati non si mescolano mai:
 * il client dichiara quale sta usando.
 *
 * Nessuna credenziale. La verifica di firma e catena e' offline e le servono
 * solo i certificati root Apple, che sono pubblici. La chiave .p8 servirebbe
 * per CHIAMARE la App Store Server API, cosa che qui non facciamo.
 *
 * REGOLA NON NEGOZIABILE: il JWS non finisce mai in un log, in un messaggio
 * d'errore o nel database. E' il titolo di proprieta' di un acquisto.
 */
import {
  Environment,
  SignedDataVerifier,
  Type,
  VerificationException,
  VerificationStatus,
  type JWSTransactionDecodedPayload,
} from "@apple/app-store-server-library";

import { APPLE_ROOT_CERTIFICATES } from "./apple-root-ca";

export const APPLE_BUNDLE_ID = "com.fitmeshsync.app";
export const APPLE_APP_APPLE_ID = 6779751708;

/**
 * Motivi di rifiuto TERMINALI: ritentare con lo stesso token non cambia
 * l'esito. Sono stringhe stabili perche' il client ci si comporta in modo
 * diverso e la dashboard ci fa i conteggi: non vanno rinominate a cuor
 * leggero.
 */
export type AppleJwsRejection =
  | "jws_malformed"
  | "jws_signature_invalid"
  | "jws_wrong_app"
  | "jws_wrong_product"
  | "jws_wrong_type"
  | "jws_incomplete"
  | "jws_revoked";

export type VerifiedAppleTransaction = {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  /** UUID dell'account FitMesh, quando il client l'ha impostato all'acquisto. */
  appAccountToken: string | null;
  environment: "Production" | "Sandbox";
  purchaseDateMs: number | null;
};

export type AppleJwsOutcome =
  | { kind: "ok"; tx: VerifiedAppleTransaction }
  | { kind: "rejected"; reason: AppleJwsRejection }
  /** Apple o la rete non hanno risposto: NON e' colpa dell'acquisto. */
  | { kind: "retryable" };

/**
 * Forma di un JWS: tre segmenti base64url separati da punti. Il controllo si fa
 * prima di chiamare la libreria per distinguere "questo non e' proprio un JWS"
 * (tipicamente: un client StoreKit 1 che ha dichiarato il formato sbagliato) da
 * "e' un JWS ma la firma non torna". Due difetti diversi, due indagini diverse.
 */
const JWS_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * Budget massimo per l'intera verifica, OCSP compreso.
 *
 * Serve perche' i due limiti non sono compatibili: la libreria Apple aspetta
 * fino a 30 secondi una risposta OCSP (`timeout: 30000` in `checkOCSPStatus`,
 * verificato nel sorgente 3.1.0), mentre la funzione serverless che ci gira
 * dentro non dichiara `maxDuration` e vive quindi col default di piattaforma,
 * che e' molto piu' corto. Senza questo limite, un OCSP lento non produce il
 * nostro 503 strutturato: produce un timeout di piattaforma, cioe' un errore
 * che il client non sa leggere e da cui non impara niente.
 *
 * Cinque secondi sono larghi: le due richieste OCSP partono in parallelo e in
 * condizioni normali rispondono in centinaia di millisecondi. E le chiavi
 * pubbliche gia' verificate restano in cache, quindi il costo si paga solo a
 * freddo.
 */
const VERIFICATION_DEADLINE_MS = 5_000;

export class VerificationDeadlineExceeded extends Error {}

export function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new VerificationDeadlineExceeded()), ms);
  });
  return Promise.race([promise, deadline]).finally(() =>
    clearTimeout(timer),
  ) as Promise<T>;
}

export function looksLikeJws(token: string): boolean {
  return JWS_SHAPE.test(token);
}

/**
 * `appAppleId` va passato in produzione e omesso in sandbox, come prescrive il
 * costruttore della libreria. Attenzione a cosa significa davvero: per le
 * TRANSAZIONI non viene confrontato con niente (il payload non lo contiene) —
 * serve solo se un domani verificheremo le notifiche server. Lo passiamo lo
 * stesso per non lasciare l'istanza mal configurata il giorno che servira'.
 *
 * Le istanze si riusano perche' mantengono una cache delle chiavi pubbliche
 * gia' verificate.
 */
let productionVerifier: SignedDataVerifier | null = null;
let sandboxVerifier: SignedDataVerifier | null = null;

function verifierFor(environment: Environment): SignedDataVerifier {
  if (environment === Environment.PRODUCTION) {
    productionVerifier ??= new SignedDataVerifier(
      APPLE_ROOT_CERTIFICATES,
      true,
      Environment.PRODUCTION,
      APPLE_BUNDLE_ID,
      APPLE_APP_APPLE_ID,
    );
    return productionVerifier;
  }
  sandboxVerifier ??= new SignedDataVerifier(
    APPLE_ROOT_CERTIFICATES,
    true,
    Environment.SANDBOX,
    APPLE_BUNDLE_ID,
  );
  return sandboxVerifier;
}

/**
 * Che cosa fare di un errore sollevato durante la verifica.
 *
 * La distinzione che conta non e' "errore si'/no" ma "e' colpa dell'acquisto?".
 * Scadenza, rete e OCSP irraggiungibile non dicono niente sull'acquisto:
 * trattarli come rifiuti toglierebbe il Pro a chi ha pagato, che e' esattamente
 * il difetto che questo P0 sta chiudendo. Sta a parte ed e' esportata perche'
 * questa e' la regola da poter esercitare caso per caso in un test.
 */
export function outcomeForVerificationError(e: unknown): AppleJwsOutcome {
  if (e instanceof VerificationDeadlineExceeded) {
    return { kind: "retryable" };
  }
  if (e instanceof VerificationException) {
    if (e.status === VerificationStatus.RETRYABLE_VERIFICATION_FAILURE) {
      return { kind: "retryable" };
    }
    return { kind: "rejected", reason: rejectionFor(e.status) };
  }
  return { kind: "retryable" };
}

function rejectionFor(status: VerificationStatus): AppleJwsRejection {
  switch (status) {
    case VerificationStatus.INVALID_APP_IDENTIFIER:
    case VerificationStatus.INVALID_ENVIRONMENT:
      // Firma buona, ma la transazione non e' della nostra app (o non e' di
      // nessuno degli ambienti che accettiamo).
      return "jws_wrong_app";
    case VerificationStatus.VERIFICATION_FAILURE:
    case VerificationStatus.INVALID_CHAIN_LENGTH:
    case VerificationStatus.INVALID_CERTIFICATE:
      return "jws_signature_invalid";
    default:
      return "jws_malformed";
  }
}

/**
 * Verifica il JWS e ne estrae la transazione, controllando TUTTO quello che
 * deve tornare prima di concedere qualcosa:
 *
 *  1. firma e catena fino a un root Apple            (libreria)
 *  2. ambiente produzione o sandbox                  (libreria, con fallback)
 *  3. bundle id `com.fitmeshsync.app`                (libreria + ricontrollo)
 *  4. product id uguale a quello richiesto           (qui)
 *  5. tipo non consumabile                           (qui)
 *  6. transaction id e original transaction id       (qui)
 *  7. nessuna revoca o rimborso                      (qui)
 *
 * NON verifica l'Apple app id numerico, e non puo': il payload di una
 * transazione non lo contiene. `verifyAndDecodeTransaction` confronta solo
 * bundle id e ambiente (letto nel sorgente della libreria 3.1.0). L'app id
 * passato al costruttore serve a `verifyAndDecodeNotification`, cioe' alle
 * App Store Server Notifications, che non abbiamo. Chi volesse un controllo
 * numerico deve passare da un AppTransaction firmato: e' un lavoro a parte, e
 * fingere che ci sia gia' sarebbe peggio che non averlo.
 *
 * L'`appAccountToken` viene restituito ma NON confrontato qui: l'attribuzione
 * a un utente e' una decisione del chiamante, che e' l'unico a sapere chi e'
 * autenticato.
 */
export async function verifyAppleJwsTransaction(args: {
  signedTransaction: string;
  expectedProductId: string;
  deadlineMs?: number;
}): Promise<AppleJwsOutcome> {
  if (!looksLikeJws(args.signedTransaction)) {
    return { kind: "rejected", reason: "jws_malformed" };
  }

  let payload: JWSTransactionDecodedPayload;
  try {
    payload = await withDeadline(
      verifyAndDecodeAcrossEnvironments(args.signedTransaction),
      args.deadlineMs ?? VERIFICATION_DEADLINE_MS,
    );
  } catch (e) {
    return outcomeForVerificationError(e);
  }

  return evaluateDecodedTransaction(payload, args.expectedProductId);
}

/**
 * Controlli 3-8 sul payload gia' verificato crittograficamente. Sta a parte, ed
 * e' puro, perche' e' la tabella di decisione che decide chi ottiene un
 * entitlement a vita: va potuta esercitare caso per caso in un test, senza
 * dover firmare JWS finti.
 *
 * L'ordine dei controlli non e' casuale. Prima l'identita' (app, prodotto,
 * tipo): un token che non e' nostro va respinto per quello che e', non per un
 * dettaglio mancante. Poi la revoca, perche' un acquisto rimborsato e'
 * completo e valido ma non da' diritto a niente. Per ultimo la completezza dei
 * campi, che e' l'unico caso in cui il difetto e' nostro o di Apple.
 */
export function evaluateDecodedTransaction(
  payload: JWSTransactionDecodedPayload,
  expectedProductId: string,
): AppleJwsOutcome {
  // La libreria gia' rifiuta un bundle id diverso; lo ricontrolliamo perche'
  // questa e' la porta d'ingresso di un entitlement a vita e un controllo in
  // piu' costa una riga.
  if (payload.bundleId !== APPLE_BUNDLE_ID) {
    return { kind: "rejected", reason: "jws_wrong_app" };
  }
  if (payload.productId !== expectedProductId) {
    return { kind: "rejected", reason: "jws_wrong_product" };
  }
  if (payload.type !== Type.NON_CONSUMABLE) {
    return { kind: "rejected", reason: "jws_wrong_type" };
  }
  if (payload.revocationDate != null || payload.revocationReason != null) {
    return { kind: "rejected", reason: "jws_revoked" };
  }
  const transactionId = payload.transactionId;
  const originalTransactionId = payload.originalTransactionId;
  if (!transactionId || !originalTransactionId) {
    return { kind: "rejected", reason: "jws_incomplete" };
  }

  return {
    kind: "ok",
    tx: {
      transactionId,
      originalTransactionId,
      productId: payload.productId ?? expectedProductId,
      appAccountToken: payload.appAccountToken ?? null,
      environment:
        payload.environment === Environment.SANDBOX ? "Sandbox" : "Production",
      purchaseDateMs: payload.purchaseDate ?? null,
    },
  };
}

/**
 * Produzione prima, sandbox come ripiego: la stessa build gira in TestFlight e
 * in produzione e non sappiamo in anticipo da quale delle due arrivi il token.
 * E' lo stesso ordine che gia' seguiva il ramo verifyReceipt.
 *
 * Solo `INVALID_ENVIRONMENT` fa scattare il secondo tentativo. Un errore di
 * firma non diventa valido cambiando ambiente, e ritentarlo nasconderebbe il
 * difetto vero.
 */
async function verifyAndDecodeAcrossEnvironments(
  signedTransaction: string,
): Promise<JWSTransactionDecodedPayload> {
  try {
    return await verifierFor(Environment.PRODUCTION).verifyAndDecodeTransaction(
      signedTransaction,
    );
  } catch (e) {
    if (
      e instanceof VerificationException &&
      e.status === VerificationStatus.INVALID_ENVIRONMENT
    ) {
      return await verifierFor(Environment.SANDBOX).verifyAndDecodeTransaction(
        signedTransaction,
      );
    }
    throw e;
  }
}
