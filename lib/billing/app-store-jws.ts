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
 * Se questo ambiente accetta anche transazioni Sandbox.
 *
 * Assente o diverso da "true" = SOLO produzione. Il default e' il caso
 * pericoloso, quindi il default e' il piu' restrittivo: una transazione
 * Sandbox e' gratuita per chiunque abbia un Apple ID di test, e accettarla in
 * produzione significherebbe regalare il Pro a vita a chi sa come chiederlo.
 *
 * Non e' il client a scegliere: la decisione vive nell'ambiente del server,
 * dove il client non arriva.
 */
export function sandboxTransactionsAllowed(): boolean {
  if (process.env.APPLE_ALLOW_SANDBOX !== "true") return false;
  // Rete di sicurezza contro l'errore piu' facile da fare: accendere la
  // variabile su un ambiente di prova che pero' punta ancora al database di
  // produzione. In quel caso una transazione Sandbox scriverebbe un
  // entitlement vero su un account vero. Qui il permesso decade da solo:
  // meglio un test di QA che non parte di un Pro regalato in produzione.
  return !pointsAtProductionDatabase();
}

/**
 * Il progetto Supabase di produzione, riconosciuto dal suo riferimento
 * nell'URL. Non e' un segreto (e' l'indirizzo pubblico dell'API) e sta qui
 * apposta: serve a distinguere "sto scrivendo sui dati veri" da "sto scrivendo
 * su una copia", che e' l'unica cosa che conta prima di aprire il ramo Sandbox.
 */
const PRODUCTION_SUPABASE_REF = "xcdyhkuyxukaifhhtadr";

export function pointsAtProductionDatabase(): boolean {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").includes(
    PRODUCTION_SUPABASE_REF,
  );
}

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
  | "jws_revoked"
  /** Transazione Sandbox arrivata a un ambiente che accetta solo produzione. */
  | "jws_sandbox_not_allowed";

export type VerifiedAppleTransaction = {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  /** UUID dell'account FitMesh, quando il client l'ha impostato all'acquisto. */
  appAccountToken: string | null;
  environment: "Production" | "Sandbox";
  purchaseDateMs: number | null;
  /**
   * `signedDate`: quando APPLE ha firmato QUESTA evidenza.
   *
   * Non e' la data d'acquisto e non e' l'ora del nostro server: e' l'orologio
   * di Apple al momento in cui ha emesso questo JWS. Serve a ordinare due
   * fotografie dello stesso acquisto, e quindi a impedire che una vecchia
   * "attivo" arrivata in ritardo cancelli una revoca piu' recente.
   *
   * Obbligatorio: se manca, l'ordine non esiste e non si scrive niente.
   */
  signedDateMs: number;
};

export type AppleJwsOutcome =
  | { kind: "ok"; tx: VerifiedAppleTransaction }
  /**
   * Apple dichiara la transazione REVOCATA o RIMBORSATA, e il payload e'
   * abbastanza completo da dire QUALE acquisto lo e'.
   *
   * Tenuto separato da `rejected` perche' le due cose da fare sono diverse:
   * verso il client e' un rifiuto terminale come prima, ma verso il registro e'
   * un FATTO da scrivere. Senza scriverlo, un lifetime rimborsato resterebbe
   * per sempre il migliore diritto dell'utente e nessun acquisto successivo
   * potrebbe emergere.
   */
  | { kind: "revoked"; tx: VerifiedAppleTransaction; revokedAtMs: number }
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
  if (e instanceof SandboxNotAllowed) {
    return { kind: "rejected", reason: "jws_sandbox_not_allowed" };
  }
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
  /**
   * Permesso di accettare una transazione SANDBOX per QUESTA chiamata.
   *
   * Non e' una scorciatoia dell'ambiente: e' il permesso di una persona
   * specifica, che il chiamante ha gia' verificato lato server (vedi
   * lib/billing/sandbox-reviewers.ts). Serve perche' TestFlight e App Review
   * comprano in Sandbox contro il backend di produzione, e senza questo il
   * revisore di Apple completa l'acquisto e vede un paywall.
   *
   * Omesso, vale quello che dice l'ambiente — cioe' `false` in produzione.
   * Il payload viene comunque verificato per intero: firma, bundle id,
   * prodotto e tipo. Questo apre una porta, non abbassa un controllo.
   */
  allowSandbox?: boolean;
}): Promise<AppleJwsOutcome> {
  if (!looksLikeJws(args.signedTransaction)) {
    return { kind: "rejected", reason: "jws_malformed" };
  }

  let payload: JWSTransactionDecodedPayload;
  try {
    payload = await withDeadline(
      verifyAndDecodeAcrossEnvironments(args.signedTransaction, args.allowSandbox),
      args.deadlineMs ?? VERIFICATION_DEADLINE_MS,
    );
  } catch (e) {
    return outcomeForVerificationError(e);
  }

  return evaluateDecodedTransaction(
    payload,
    args.expectedProductId,
    args.allowSandbox,
  );
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
  /** Vedi `verifyAppleJwsTransaction`. Omesso, decide l'ambiente. */
  allowSandbox?: boolean,
): AppleJwsOutcome {
  // La libreria gia' rifiuta un bundle id diverso; lo ricontrolliamo perche'
  // questa e' la porta d'ingresso di un entitlement a vita e un controllo in
  // piu' costa una riga.
  // Seconda linea di difesa sull'ambiente. Il verificatore di produzione gia'
  // rifiuta un payload Sandbox, ma questo e' il punto in cui si concede un
  // diritto a vita: se un domani cambiasse il modo in cui si sceglie il
  // verificatore, questo controllo resterebbe in piedi da solo.
  if (
    payload.environment === Environment.SANDBOX &&
    !(allowSandbox ?? sandboxTransactionsAllowed())
  ) {
    return { kind: "rejected", reason: "jws_sandbox_not_allowed" };
  }
  if (payload.bundleId !== APPLE_BUNDLE_ID) {
    return { kind: "rejected", reason: "jws_wrong_app" };
  }
  if (payload.productId !== expectedProductId) {
    return { kind: "rejected", reason: "jws_wrong_product" };
  }
  if (payload.type !== Type.NON_CONSUMABLE) {
    return { kind: "rejected", reason: "jws_wrong_type" };
  }
  const transactionId = payload.transactionId;
  const originalTransactionId = payload.originalTransactionId;

  // `signedDate` e' l'orologio con cui si ordinano due fotografie dello stesso
  // acquisto. Senza, non si puo' dire quale delle due sia la piu' recente, e
  // scrivere lo stesso significherebbe accettare che una "attivo" in ritardo
  // cancelli una revoca. Manca solo per un difetto nostro o di Apple, quindi
  // e' `jws_incomplete`: difetto nostro, transazione NON chiusa, l'acquisto
  // resta recuperabile appena il difetto e' corretto.
  const signedDateMs = payload.signedDate;

  if (payload.revocationDate != null || payload.revocationReason != null) {
    // Revocato. Se il payload porta anche gli identificatori e la data, il
    // fatto si puo' REGISTRARE, e il diritto successivo dell'utente puo'
    // riemergere.
    //
    // Se NON li porta, non e' `jws_revoked`. Sembrava la risposta ovvia — Apple
    // dice revocato, noi diciamo revocato — ed era sbagliata per una ragione
    // che si vede solo guardando cosa fa il client: `jws_revoked` e' terminale,
    // quindi la transazione viene chiusa. Ma qui non abbiamo potuto scrivere
    // NIENTE, perche' non sappiamo nominare l'acquisto: il diritto dell'utente
    // resta quello di prima e non c'e' nessuna occasione futura di
    // accorgercene.
    //
    // Un payload firmato da Apple senza `transactionId`,
    // `originalTransactionId` o `signedDate` e' un difetto — nostro o loro —
    // non un fatto sull'acquisto. Quindi `jws_incomplete`, che il client tratta
    // come problema nostro e non chiude.
    if (!transactionId || !originalTransactionId || signedDateMs == null) {
      return { kind: "rejected", reason: "jws_incomplete" };
    }
    return {
      kind: "revoked",
      revokedAtMs: payload.revocationDate ?? signedDateMs,
      tx: {
        transactionId,
        originalTransactionId,
        productId: payload.productId ?? expectedProductId,
        appAccountToken: payload.appAccountToken ?? null,
        environment:
          payload.environment === Environment.SANDBOX ? "Sandbox" : "Production",
        purchaseDateMs: payload.purchaseDate ?? null,
        signedDateMs,
      },
    };
  }

  if (!transactionId || !originalTransactionId || signedDateMs == null) {
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
      signedDateMs,
    },
  };
}

/** Sollevata quando un token Sandbox arriva a un ambiente solo-produzione. */
class SandboxNotAllowed extends Error {}

/**
 * Produzione prima; Sandbox SOLO se questo ambiente lo consente.
 *
 * La stessa build gira in TestFlight e in produzione, quindi non sappiamo in
 * anticipo da quale delle due arrivi il token. Ma "non lo sappiamo" non
 * significa "accettiamo entrambi": una transazione Sandbox e' gratuita, e in
 * produzione va respinta senza scrivere niente. Il ripiego su Sandbox esiste
 * solo dove `APPLE_ALLOW_SANDBOX` e' esplicitamente acceso, cioe' in QA.
 *
 * Solo `INVALID_ENVIRONMENT` fa scattare il secondo tentativo. Un errore di
 * firma non diventa valido cambiando ambiente, e ritentarlo nasconderebbe il
 * difetto vero.
 */
async function verifyAndDecodeAcrossEnvironments(
  signedTransaction: string,
  allowSandbox?: boolean,
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
      if (!(allowSandbox ?? sandboxTransactionsAllowed())) {
        throw new SandboxNotAllowed();
      }
      return await verifierFor(Environment.SANDBOX).verifyAndDecodeTransaction(
        signedTransaction,
      );
    }
    throw e;
  }
}
