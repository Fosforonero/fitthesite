/**
 * App Store receipt validation — speculare a google-play.ts.
 *
 * Usa l'endpoint verifyReceipt di Apple con App-Specific Shared Secret
 * (env APPLE_SHARED_SECRET, generato in App Store Connect → App
 * Information → App-Specific Shared Secret).
 *
 * Flusso Apple canonico: si valida SEMPRE prima contro produzione; se la
 * ricevuta è sandbox Apple risponde status 21007 → retry su sandbox.
 * (Così la stessa build funziona in TestFlight/review e in produzione.)
 *
 * Status codes verifyReceipt rilevanti:
 *   0     ok
 *   21007 ricevuta sandbox inviata a produzione → retry sandbox
 *   21008 ricevuta produzione inviata a sandbox (non ci capita col flusso sopra)
 *   21002/21003 ricevuta malformata/non autentica
 *   21010 account non trovato / ricevuta non più valida
 */

import { sandboxTransactionsAllowed } from "./app-store-jws";

const PROD_URL = "https://buy.itunes.apple.com/verifyReceipt";
const SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const FETCH_TIMEOUT_MS = 4000;

export function readAppleSharedSecret(): string | null {
  const v = process.env.APPLE_SHARED_SECRET;
  return v && v.length > 0 ? v : null;
}

/** Singola transazione dentro latest_receipt_info / in_app. */
export type AppleTransaction = {
  product_id: string;
  original_transaction_id: string;
  transaction_id: string;
  purchase_date_ms?: string;
  expires_date_ms?: string;
  cancellation_date_ms?: string;
};

type AppleRenewalInfo = {
  product_id?: string;
  auto_renew_status?: string; // "1" | "0"
  original_transaction_id?: string;
};

type VerifyReceiptResponse = {
  status: number;
  /**
   * Orologio di APPLE al momento in cui ha risposto a questa verifica. E' il
   * timestamp con cui si ordinano due fotografie dello stesso acquisto sul
   * ramo StoreKit 1, ed e' lo stesso orologio di `signedDate` sul ramo JWS —
   * quindi i due sono confrontabili fra loro, cosa che un orologio nostro non
   * garantirebbe.
   */
  request_date_ms?: string;
  latest_receipt_info?: AppleTransaction[];
  pending_renewal_info?: AppleRenewalInfo[];
  receipt?: { in_app?: AppleTransaction[] };
};

/**
 * Una transazione che Apple dichiara ANNULLATA: rimborsata dal supporto, o
 * cancellata per una richiesta di famiglia. `cancellation_date_ms` e' il
 * momento in cui il rimborso e' diventato efficace — l'equivalente StoreKit 1
 * di `revocationDate` — e non e' un orologio di ordinamento: quello resta
 * `request_date_ms` della risposta.
 */
export type AppleTransazioneAnnullata = {
  originalTransactionId: string;
  cancellationDateMs: number;
};

export type AppStoreResult =
  | {
      kind: "ok";
      /** Transazione più recente per il product id richiesto. */
      tx: AppleTransaction;
      autoRenewing: boolean;
      environment: "production" | "sandbox";
      /**
       * `request_date_ms` della risposta. Obbligatorio a valle: senza non si
       * puo' ordinare questa evidenza rispetto a quelle gia' registrate, e in
       * dubbio non si scrive. Null quando Apple non lo manda.
       */
      requestDateMs: number | null;
      /**
       * Le transazioni annullate trovate nella STESSA ricevuta. Anche quando
       * esiste un acquisto vivo, un rimborso precedente resta un fatto che va
       * registrato: e' l'unica notizia che ne abbiamo, e senza Notifications V2
       * nessuno ce la ripetera'.
       */
      annullate: AppleTransazioneAnnullata[];
    }
  | {
      /**
       * Nessun acquisto vivo per questo prodotto, e almeno uno annullato.
       *
       * Fino al 13/08/2026 questo caso non esisteva: il filtro scartava le
       * transazioni con `cancellation_date_ms` insieme a quelle di un altro
       * prodotto, la lista restava vuota e la ricevuta risultava `not_found`,
       * cioe' `purchase_not_in_receipt` — un silenzio, che si ritenta. Un
       * lifetime rimborsato restava percio' il migliore diritto del suo
       * proprietario per sempre: nessuno lo revocava, perche' nessuno lo
       * vedeva.
       */
      kind: "revoked";
      annullate: AppleTransazioneAnnullata[];
      environment: "production" | "sandbox";
      requestDateMs: number | null;
    }
  | { kind: "not_found"; status: number }
  | { kind: "error"; status: number; body: string };

async function postVerify(
  url: string,
  receiptData: string,
  secret: string,
): Promise<{ httpStatus: number; data: VerifyReceiptResponse | null; raw: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "receipt-data": receiptData,
        password: secret,
        "exclude-old-transactions": true,
      }),
      signal: ctrl.signal,
    });
    const raw = await res.text();
    let data: VerifyReceiptResponse | null = null;
    try {
      data = JSON.parse(raw) as VerifyReceiptResponse;
    } catch {
      // raw non-JSON → gestito dal chiamante come errore
    }
    return { httpStatus: res.status, data, raw };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Valida la ricevuta e ritorna la transazione più recente per [productId].
 * Per gli abbonamenti la "più recente" è quella con expires_date_ms massimo
 * (i rinnovi generano transazioni nuove con lo stesso original_transaction_id).
 */
export async function validateAppleReceipt(args: {
  receiptData: string;
  productId: string;
  /**
   * Permesso di accettare una ricevuta SANDBOX per QUESTA chiamata.
   *
   * Stesso significato che sul ramo StoreKit 2: non e' una scorciatoia
   * dell'ambiente, e' il permesso di una persona che il chiamante ha gia'
   * verificato lato server. Serve perche' un revisore su iOS 14 — dove il
   * plugin ricade su StoreKit 1 — comprerebbe comunque in Sandbox, e senza
   * questo si vedrebbe rifiutare l'acquisto esattamente come prima.
   *
   * Omesso, vale quello che dice l'ambiente: `false` in produzione.
   */
  allowSandbox?: boolean;
}): Promise<AppStoreResult> {
  const secret = readAppleSharedSecret();
  if (!secret) {
    return { kind: "error", status: 0, body: "apple_shared_secret_missing" };
  }

  let environment: "production" | "sandbox" = "production";
  let r = await postVerify(PROD_URL, args.receiptData, secret);
  if (r.data?.status === 21007) {
    // Ricevuta Sandbox. Stessa separazione del ramo StoreKit 2: una ricevuta
    // Sandbox e' gratuita per chiunque abbia un Apple ID di test, quindi in
    // produzione va respinta senza scrivere niente. Il ripiego esiste solo
    // dove l'ambiente lo consente esplicitamente.
    if (!(args.allowSandbox ?? sandboxTransactionsAllowed())) {
      return { kind: "error", status: 21007, body: "sandbox_not_allowed" };
    }
    environment = "sandbox";
    r = await postVerify(SANDBOX_URL, args.receiptData, secret);
  }

  if (r.httpStatus !== 200 || !r.data) {
    return { kind: "error", status: r.httpStatus, body: r.raw.slice(0, 300) };
  }
  if (r.data.status !== 0) {
    return { kind: "error", status: r.data.status, body: `verifyReceipt status ${r.data.status}` };
  }

  // Le transazioni vivono in latest_receipt_info (subs e anche IAP recenti);
  // i non-consumable storici possono stare solo in receipt.in_app.
  const delProdotto: AppleTransaction[] = [
    ...(r.data.latest_receipt_info ?? []),
    ...(r.data.receipt?.in_app ?? []),
  ].filter((t) => t.product_id === args.productId);

  // Le due liste si separano, non si scarta piu' niente. Un rimborso e' un
  // fatto DIMOSTRATO da Apple su una transazione identificata: buttarlo via
  // insieme alle transazioni di un altro prodotto era la ragione per cui un
  // acquisto rimborsato non veniva mai revocato.
  const annullate: AppleTransazioneAnnullata[] = [];
  const vive: AppleTransaction[] = [];
  for (const t of delProdotto) {
    const annullataMs = t.cancellation_date_ms ? Number(t.cancellation_date_ms) : null;
    if (annullataMs !== null && Number.isFinite(annullataMs)) {
      if (t.original_transaction_id) {
        annullate.push({
          originalTransactionId: t.original_transaction_id,
          cancellationDateMs: annullataMs,
        });
      }
      continue;
    }
    vive.push(t);
  }

  const requestDateMsGrezzo =
    r.data.request_date_ms != null ? Number(r.data.request_date_ms) : null;
  const requestDateMs = Number.isFinite(requestDateMsGrezzo as number)
    ? requestDateMsGrezzo
    : null;

  if (vive.length === 0) {
    if (annullate.length > 0) {
      return { kind: "revoked", annullate, environment, requestDateMs };
    }
    return { kind: "not_found", status: 0 };
  }

  const all = vive;

  const latest = all.reduce((a, b) => {
    const ea = Number(a.expires_date_ms ?? a.purchase_date_ms ?? 0);
    const eb = Number(b.expires_date_ms ?? b.purchase_date_ms ?? 0);
    return eb > ea ? b : a;
  });

  const renewal = (r.data.pending_renewal_info ?? []).find(
    (p) =>
      p.product_id === args.productId ||
      p.original_transaction_id === latest.original_transaction_id,
  );

  return {
    kind: "ok",
    tx: latest,
    autoRenewing: renewal?.auto_renew_status === "1",
    environment,
    requestDateMs,
    annullate,
  };
}
