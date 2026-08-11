/**
 * POST /api/v1/billing/validate-purchase — validazione server-side degli
 * acquisti in-app.
 *
 * Riceve un token d'acquisto dal client Flutter, lo verifica contro Apple o
 * Google, e SOLO DOPO passa il risultato a `public.claim_store_purchase`.
 *
 * QUESTA ROUTE NON SCRIVE PIU' `public.b2c_subscriptions`.
 *
 * Fino alla 189 lo faceva, con un upsert su `user_id`. Quella tabella ha una
 * riga per utente: il secondo acquisto sostituiva il primo, l'identificativo
 * della transazione precedente smetteva di esistere, e da quel momento un
 * altro account poteva reclamarla. Adesso la proprieta' vive in un registro
 * append-only, lo stato di ogni acquisto in una tabella sua, e
 * `b2c_subscriptions` e' soltanto la PROIEZIONE del migliore diritto
 * posseduto — derivata, mai storia primaria.
 *
 * Conseguenza visibile nel contratto: la risposta descrive l'ENTITLEMENT
 * DELL'UTENTE, non l'acquisto appena presentato. Chi ripresenta un abbonamento
 * scaduto mentre possiede un lifetime riceve "lifetime attivo", che e' la
 * verita' su di lui.
 *
 * Risposte:
 *   200 { state, active_until, source, auto_renewing }
 *   400 invalid_payload | invalid_json | unknown_product | token_format_mismatch
 *       | ios_subscription_not_supported | jws_* | purchase_not_in_receipt
 *       | google_subscription_upgrade_chain_unsupported
 *   401 sessione assente o scaduta
 *   409 purchase_already_linked | purchase_belongs_to_other_account
 *   500 claim_failed | internal            — da ritentare, niente e' stato scritto
 *   502 apple_validation_failed | google_validation_failed
 *   503 apple_unavailable | *_not_configured
 *
 * SLA: risposta entro 5s. Timeout verso gli store 4s.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireUser } from "@/lib/api/auth-helpers";
import {
  readAppleSharedSecret,
  validateAppleReceipt,
} from "@/lib/billing/app-store";
import {
  looksLikeJws,
  verifyAppleJwsTransaction,
} from "@/lib/billing/app-store-jws";
import {
  type ClaimResult,
  type ProjectedEntitlement,
  type PurchaseKind,
  type StoreEventSource,
  type VerifiedPurchaseState,
  claimStorePurchase,
  recordStorePurchaseRevocation,
} from "@/lib/billing/claim-purchase";
import {
  type GoogleProductPurchase,
  type GoogleSubscriptionPurchase,
  readServiceAccount,
  validateProduct,
  validateSubscription,
} from "@/lib/billing/google-play";
import {
  PURCHASE_DISPOSITION_CONTRACT_VERSION,
  dispositionForCode,
} from "@/lib/billing/purchase-disposition";
import {
  OwnershipKeyError,
  appleOwnershipKey,
  googleOwnershipKey,
} from "@/lib/billing/ownership-key";
import { createAdminClient } from "@/lib/supabase/admin";

type Sb = SupabaseClient;

// ── Il contratto tipizzato e versionato ─────────────────────────────────────
//
// I campi che la 189 legge — `error`, `state`, `active_until`, `source`,
// `auto_renewing` — restano dove sono, con gli stessi nomi e gli stessi tipi.
// `contract_version` e `disposition` si AGGIUNGONO: una build che non li
// conosce li ignora, ed e' esattamente cio' che fa la 189, che legge i campi
// per nome senza validare la forma dell'oggetto.
//
// A che serve: fino alla 189 la decisione "questa transazione si chiude?" la
// prendeva il client deducendola dal codice, con una lista che ne dichiarava
// terminali tre di troppo. Il backend e' l'unico che sa perche' ha risposto
// quel codice.

function jsonError(status: number, code: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({
      error: code,
      ...(details ? { details } : {}),
      contract_version: PURCHASE_DISPOSITION_CONTRACT_VERSION,
      disposition: dispositionForCode(code),
    }),
    { status, headers: { "content-type": "application/json" } },
  );
}

function jsonOk(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}


const PRODUCT_LIFETIME = "fitmesh_pro_lifetime";
const PRODUCT_SUBSCRIPTION = "fitmesh_pro_sub";
const LIFETIME_SENTINEL = "9999-12-31T23:59:59Z";
const KNOWN_PRODUCTS = new Set<string>([PRODUCT_LIFETIME, PRODUCT_SUBSCRIPTION]);

const payloadSchema = z.object({
  product_id: z.string().min(1).max(80),
  // Android: purchase token Play (~150 char). iOS: l'intera ricevuta
  // App Store in base64 — può superare i 100KB, da qui il max largo.
  purchase_token: z.string().min(8).max(500_000),
  package_name: z.string().min(3).max(120),
  // Default android per retro-compatibilità coi client v137- già in giro.
  platform: z.enum(["android", "ios"]).default("android"),
  // Su iOS il token ha DUE formati incompatibili:
  //   sk2_jws     StoreKit 2, il JWS della transazione (default del plugin
  //               dalla 0.4.0, quindi tutti i client moderni)
  //   app_receipt StoreKit 1, la ricevuta base64 → ramo verifyReceipt storico
  //
  // OPZIONALE, e non con un default: la 189 già in store non manda questo
  // campo e manda JWS. Un default `app_receipt` l'avrebbe respinta come
  // formato sbagliato, cioè avrebbe impedito proprio al cliente che ha già
  // pagato di recuperare l'acquisto con "Ripristina acquisti". Quando il campo
  // manca si guarda la forma del token (vedi resolveIosTokenFormat).
  token_format: z.enum(["sk2_jws", "app_receipt"]).optional(),
});

/**
 * Campi che il client non deve poter mandare, e che vengono RESPINTI invece
 * che ignorati.
 *
 * Zod di suo scarta le chiavi sconosciute, quindi un `ownership_key` inviato
 * dal client oggi non arriverebbe comunque da nessuna parte. Ma "non viene
 * letto" e "non e' accettato" sono due garanzie diverse: la prima dipende dal
 * fatto che nessuno, mai, aggiunga quel campo allo schema. Respingere in modo
 * esplicito rende l'eventuale tentativo visibile invece che silenzioso, e
 * trasforma una futura svista in un errore immediato.
 *
 * Tutti questi valori li decide il server: la chiave di proprieta' si deriva
 * dai dati verificati, il proprietario dalla sessione, lo stato e la scadenza
 * dallo store, il payload lo costruisce la RPC.
 */
const REJECTED_CLIENT_FIELDS = [
  "ownership_key",
  "owner_user_id",
  "user_id",
  "billing_source",
  "purchase_kind",
  "state",
  "active_until",
  "auto_renewing",
  "store_event_at",
  "store_event_source",
  "raw_payload",
  "app_account_token",
  "external_subscription_id",
  "external_order_id",
  "entitlement",
] as const;

export function findRejectedField(body: unknown): string | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return null;
  const keys = new Set(Object.keys(body as Record<string, unknown>));
  for (const f of REJECTED_CLIENT_FIELDS) {
    if (keys.has(f)) return f;
  }
  return null;
}

type IosTokenFormat = "sk2_jws" | "app_receipt";

/**
 * Quale ramo iOS usare per questo token.
 *
 * - formato dichiarato → si rispetta, e il token deve avere la forma giusta.
 *   Un client che dichiara il falso viene respinto, non assecondato.
 * - formato assente (client 189 e precedenti) → decide la forma del token.
 *   La distinzione è netta e non euristica: un JWS è `header.payload.firma` in
 *   base64url, una ricevuta App Store è base64 standard e non contiene punti.
 */
export function resolveIosTokenFormat(
  declared: IosTokenFormat | undefined,
  token: string,
): { format: IosTokenFormat } | { mismatch: true } {
  const hasJwsShape = looksLikeJws(token);
  if (declared === "sk2_jws") {
    return hasJwsShape ? { format: "sk2_jws" } : { mismatch: true };
  }
  if (declared === "app_receipt") {
    return hasJwsShape ? { mismatch: true } : { format: "app_receipt" };
  }
  return { format: hasJwsShape ? "sk2_jws" : "app_receipt" };
}

function kindOf(productId: string): PurchaseKind {
  return productId === PRODUCT_SUBSCRIPTION ? "subscription" : "lifetime";
}

// ── Traduzione dell'esito del claim in risposta HTTP ────────────────────────

/**
 * La risposta descrive l'entitlement dell'utente, non l'acquisto ricevuto.
 *
 * I quattro campi sono quelli che la 189 legge, negli stessi nomi e con gli
 * stessi tipi: quella build e' ancora la piu' diffusa e non deve accorgersi
 * di niente.
 */
function okFromEntitlement(e: ProjectedEntitlement): Response {
  // `verified` significa "il diritto esiste ADESSO", non "la chiamata e'
  // riuscita". Un 200 che proietta un acquisto scaduto non ha concesso niente,
  // e dirgli `verified` autorizzerebbe il client a chiudere una transazione
  // per un diritto che non ha.
  const attivo = e.state === "active" || e.state === "grace";
  return jsonOk({
    state: e.state,
    active_until: e.activeUntil,
    source: e.source,
    auto_renewing: e.autoRenewing,
    contract_version: PURCHASE_DISPOSITION_CONTRACT_VERSION,
    disposition: attivo ? "verified" : "retryable",
  });
}

function responseForClaim(result: ClaimResult): Response {
  switch (result.kind) {
    case "ok":
      if (!result.entitlement) {
        // Il claim e' andato a buon fine ma la proiezione non ha prodotto
        // niente di leggibile. Non e' una prova che il diritto esista, quindi
        // non si risponde successo: si fa ritentare.
        console.warn("[Billing] claim ok senza entitlement proiettato");
        return jsonError(500, "claim_failed", { reason: "no_projection" });
      }
      return okFromEntitlement(result.entitlement);

    case "conflict":
      // `ownerDeleted` distingue "e' di un altro account vivo" da "l'account
      // che lo possedeva e' stato cancellato". Per il client cambia poco — in
      // entrambi i casi non e' suo — ma per il supporto cambia tutto.
      return jsonError(409, "purchase_already_linked", {
        owner_deleted: result.ownerDeleted,
      });

    case "persistence_failed":
      console.warn(`[Billing] claim persistence_failed reason=${result.reason}`);
      return jsonError(500, "claim_failed", { reason: result.reason });

    case "unavailable":
      console.warn(`[Billing] claim unavailable reason=${result.reason}`);
      return jsonError(500, "claim_failed", { reason: "unavailable" });
  }
}

/**
 * Una chiave di proprieta' che non si riesce a derivare NON e' un acquisto
 * invalido: e' un difetto nostro o un formato che non sappiamo leggere. Si
 * risponde con un codice che il client classifica come difetto nostro, cosi'
 * la transazione non viene chiusa e l'acquisto resta recuperabile.
 */
function responseForOwnershipKeyError(e: OwnershipKeyError): Response {
  console.warn(`[Billing] ownership key non derivabile: ${e.code}`);
  switch (e.code) {
    case "google_subscription_upgrade_chain_unsupported":
      return jsonError(400, e.code);
    case "apple_missing_original_transaction_id":
    case "apple_malformed_original_transaction_id":
      return jsonError(400, "jws_incomplete");
    default:
      return jsonError(500, "claim_failed", { reason: e.code });
  }
}

// ── Ramo Apple StoreKit 2 (JWS) ─────────────────────────────────────────────

async function validateAppleJws(args: {
  admin: Sb;
  userId: string;
  productId: string;
  signedTransaction: string;
}): Promise<Response> {
  const outcome = await verifyAppleJwsTransaction({
    signedTransaction: args.signedTransaction,
    expectedProductId: args.productId,
  });

  if (outcome.kind === "retryable") {
    console.warn("[Billing] apple jws verification temporarily unavailable");
    return jsonError(503, "apple_unavailable");
  }

  if (outcome.kind === "revoked") {
    // Apple dichiara l'acquisto revocato o rimborsato. Verso il client e' un
    // rifiuto terminale, come prima. Ma il fatto va anche REGISTRATO: senza,
    // un lifetime rimborsato resterebbe per sempre il migliore diritto
    // dell'utente e nessun acquisto successivo potrebbe riemergere.
    //
    // La registrazione non assegna proprieta' a nessuno e non dipende da chi
    // sta chiamando: agisce sul proprietario gia' iscritto nel registro.
    try {
      await recordStorePurchaseRevocation(args.admin, {
        billingSource: "apple_iap",
        ownershipKey: appleOwnershipKey(outcome.tx.originalTransactionId),
        productId: args.productId,
        purchaseKind: kindOf(args.productId),
        storeEventAt: new Date(outcome.revokedAtMs).toISOString(),
        storeEventSource: "apple_signed_date",
      });
    } catch (e) {
      // Non cambia la risposta: la revoca resta un rifiuto terminale anche se
      // non siamo riusciti ad annotarla. Ma va vista.
      console.error(
        `[Billing] revoca non registrata: ${e instanceof Error ? e.name : "errore"}`,
      );
    }
    console.warn("[Billing] apple jws rejected reason=jws_revoked");
    return jsonError(400, "jws_revoked");
  }

  if (outcome.kind === "rejected") {
    // Solo il motivo, mai il token.
    console.warn(`[Billing] apple jws rejected reason=${outcome.reason}`);
    return jsonError(400, outcome.reason);
  }

  const tx = outcome.tx;

  // Binding dell'account. Quando l'acquisto porta con sé l'identità FitMesh a
  // cui appartiene, quella identità comanda: un acquisto di A non diventa di B
  // solo perché B lo presenta. Senza questo controllo, due account FitMesh
  // sullo stesso Apple ID (famiglia, telefono riutilizzato) potrebbero
  // rubarsi l'entitlement a vicenda.
  //
  // Le transazioni legacy non hanno il token (il client non lo impostava): lì
  // l'attribuzione la decide un'azione esplicita dell'utente — il tap su
  // "Ripristina acquisti" — e il registro impedisce comunque che la stessa
  // transazione finisca su due account.
  // Confronto senza distinzione di maiuscole: è un UUID, e la forma con cui
  // Apple lo restituisce non è qualcosa su cui vogliamo scommettere.
  if (
    tx.appAccountToken &&
    tx.appAccountToken.toLowerCase() !== args.userId.toLowerCase()
  ) {
    console.warn("[Billing] apple jws appAccountToken does not match caller");
    return jsonError(409, "purchase_belongs_to_other_account");
  }

  let ownershipKey: string;
  try {
    // originalTransactionId: l'UNICO identificatore Apple stabile a restore,
    // reinstallazione, cambio device e rinnovo. Derivato qui dal payload gia'
    // verificato crittograficamente, mai ricevuto dal client.
    ownershipKey = appleOwnershipKey(tx.originalTransactionId);
  } catch (e) {
    if (e instanceof OwnershipKeyError) return responseForOwnershipKeyError(e);
    throw e;
  }

  return responseForClaim(
    await claimStorePurchase(args.admin, {
      billingSource: "apple_iap",
      ownershipKey,
      ownerUserId: args.userId,
      productId: args.productId,
      purchaseKind: kindOf(args.productId),
      environment: tx.environment === "Sandbox" ? "sandbox" : "production",
      // Il verificatore accetta solo NON_CONSUMABLE: qui passa un lifetime, e
      // un non consumabile non scade.
      state: "active",
      activeUntil: LIFETIME_SENTINEL,
      autoRenewing: false,
      storeEventAt: new Date(tx.signedDateMs).toISOString(),
      storeEventSource: "apple_signed_date",
      externalTransactionId: tx.transactionId,
      appAccountToken: tx.appAccountToken,
    }),
  );
}

// ── Ramo Google ─────────────────────────────────────────────────────────────

/** Stato e scadenza di un abbonamento Play, dai soli campi verificati. */
function subscriptionFacts(data: GoogleSubscriptionPurchase): {
  state: VerifiedPurchaseState;
  activeUntil: string;
  autoRenewing: boolean;
} {
  const { expiryTimeMillis, autoRenewing, cancelReason } = data;
  const expiryMs = expiryTimeMillis ? Number(expiryTimeMillis) : null;
  const activeUntil = new Date(expiryMs ?? Date.now()).toISOString();
  const expired = expiryMs === null || expiryMs < Date.now();
  const cancelled = cancelReason !== undefined && cancelReason !== null;
  return {
    // 'cancelled' con accesso ancora valido NON e' una revoca: chi ha disdetto
    // usa cio' che ha pagato fino alla scadenza. La precedenza lo sa, e lo
    // proietta come accesso attivo con auto_renewing=false.
    state: expired ? "expired" : cancelled ? "cancelled" : "active",
    activeUntil,
    autoRenewing: autoRenewing ?? false,
  };
}

/**
 * Stato di un prodotto one-time Play.
 *
 * `purchaseState`: 0 acquistato, 1 annullato, 2 IN ATTESA.
 *
 * Il 2 prima veniva trattato come 'active', cioe' un acquisto il cui pagamento
 * non e' ancora stato incassato concedeva subito un diritto a vita. Adesso
 * diventa 'on_hold': la proprieta' viene comunque registrata — quella
 * transazione e' sua e nessun altro deve poterla reclamare — ma il diritto
 * arriva quando arriva il pagamento, non prima.
 */
function productFacts(data: GoogleProductPurchase): {
  state: VerifiedPurchaseState;
  activeUntil: string;
} {
  switch (data.purchaseState) {
    case 0:
      return { state: "active", activeUntil: LIFETIME_SENTINEL };
    case 1:
      return { state: "cancelled", activeUntil: LIFETIME_SENTINEL };
    default:
      return { state: "on_hold", activeUntil: LIFETIME_SENTINEL };
  }
}

/**
 * L'orologio con cui si ordinano gli stati Google.
 *
 * Play non espone ne' una versione monotona ne' un "last updated" sulla
 * risorsa: non c'e' un timestamp dello store da leggere. Si usa quindi il
 * NOSTRO, preso appena Google ha risposto 200, e lo si dichiara — perche' ogni
 * chiamata e' un re-fetch dello stato corrente, e quindi l'ordine dei nostri
 * fetch e' l'ordine reale degli stati. Confrontarlo con un timestamp Apple
 * sarebbe scorretto, ed e' il vincolo sulla tabella a impedirlo.
 */
const GOOGLE_EVENT_SOURCE: StoreEventSource = "google_backend_fetch";

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }

  const rejected = findRejectedField(body);
  if (rejected) {
    console.warn(`[Billing] campo privilegiato rifiutato: ${rejected}`);
    return jsonError(400, "invalid_payload", { rejected_field: rejected });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid_payload", parsed.error.flatten());
  }
  const { product_id, purchase_token, package_name, platform, token_format } =
    parsed.data;
  if (!KNOWN_PRODUCTS.has(product_id)) {
    return jsonError(400, "unknown_product");
  }

  const admin = createAdminClient() as unknown as Sb;
  const isSubscription = product_id === PRODUCT_SUBSCRIPTION;

  // ── Ramo Apple ───────────────────────────────────────────────────────
  if (platform === "ios") {
    const resolved = resolveIosTokenFormat(token_format, purchase_token);
    if ("mismatch" in resolved) {
      // Il client ha dichiarato un formato e ne ha mandato un altro. Inoltrare
      // comunque produrrebbe un errore fuorviante ("ricevuta malformata"), che
      // è esattamente ciò che ha tenuto nascosto questo difetto per due mesi.
      return jsonError(400, "token_format_mismatch");
    }

    // StoreKit 2: nessuna credenziale, solo i root Apple pubblici.
    if (resolved.format === "sk2_jws") {
      if (isSubscription) {
        // Fail-closed dichiarato: il verificatore accetta solo NON_CONSUMABLE.
        // Un abbonamento finirebbe respinto con `jws_wrong_type`, un errore che
        // fa sembrare corrotto l'acquisto invece di dire la verità, cioè che
        // questa validazione non è ancora stata scritta. Vale anche che oggi
        // `fitmesh_pro_sub` è respinto su App Store Connect e non è
        // acquistabile su iOS.
        return jsonError(400, "ios_subscription_not_supported");
      }
      return await validateAppleJws({
        admin,
        userId,
        productId: product_id,
        signedTransaction: purchase_token,
      });
    }

    // ── Ramo legacy (ricevuta base64, verifyReceipt) ───────────────────
    // Solo per client realmente StoreKit 1 (iOS < 15).
    if (!readAppleSharedSecret()) {
      console.warn("[Billing] APPLE_SHARED_SECRET missing — iOS IAP validation disabled");
      return jsonError(503, "app_store_not_configured");
    }
    try {
      const result = await validateAppleReceipt({
        receiptData: purchase_token,
        productId: product_id,
      });
      if (result.kind === "ok") {
        const tx = result.tx;

        // `request_date_ms` e' l'orologio di Apple al momento della risposta,
        // lo stesso di `signedDate` sul ramo JWS. Senza, questa evidenza non e'
        // ordinabile rispetto a quelle gia' registrate: fail-closed, difetto
        // nostro, transazione non chiusa.
        if (result.requestDateMs === null) {
          console.warn("[Billing] verifyReceipt senza request_date_ms: evidenza non ordinabile");
          return jsonError(400, "jws_incomplete");
        }

        let ownershipKey: string;
        try {
          ownershipKey = appleOwnershipKey(tx.original_transaction_id);
        } catch (e) {
          if (e instanceof OwnershipKeyError) return responseForOwnershipKeyError(e);
          throw e;
        }

        const expiresMs = tx.expires_date_ms ? Number(tx.expires_date_ms) : null;
        const expired =
          isSubscription && expiresMs !== null && expiresMs < Date.now();

        return responseForClaim(
          await claimStorePurchase(admin, {
            billingSource: "apple_iap",
            ownershipKey,
            ownerUserId: userId,
            productId: product_id,
            purchaseKind: kindOf(product_id),
            environment: result.environment,
            state: expired ? "expired" : "active",
            activeUntil: isSubscription
              ? new Date(expiresMs ?? Date.now()).toISOString()
              : LIFETIME_SENTINEL,
            autoRenewing: isSubscription ? result.autoRenewing : false,
            storeEventAt: new Date(result.requestDateMs).toISOString(),
            storeEventSource: "apple_request_date",
            externalTransactionId: tx.transaction_id ?? null,
            // StoreKit 1 non porta appAccountToken: l'attribuzione la decide
            // il tap esplicito su "Ripristina acquisti", e il registro
            // impedisce comunque che finisca su due account.
            appAccountToken: null,
          }),
        );
      }
      if (result.kind === "not_found") {
        return jsonError(400, "purchase_not_in_receipt");
      }
      console.warn(
        `[Billing] apple_validation_failed status=${result.status} body=${result.body.slice(0, 200)}`,
      );
      return jsonError(502, "apple_validation_failed", { status: result.status });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[Billing] apple internal error: ${msg}`);
      return jsonError(500, "internal", msg);
    }
  }

  // ── Ramo Google (Android) ────────────────────────────────────────────
  if (!readServiceAccount()) {
    console.warn(
      "[Billing] GOOGLE_PLAY_SERVICE_ACCOUNT_JSON missing — IAP validation disabled",
    );
    return jsonError(503, "google_play_not_configured");
  }

  try {
    if (isSubscription) {
      const result = await validateSubscription({
        packageName: package_name,
        subscriptionId: product_id,
        purchaseToken: purchase_token,
      });
      const fetchedAt = new Date().toISOString();

      if (result.kind === "ok_subscription") {
        let ownershipKey: string;
        try {
          // Il primo parametro non e' decorativo: pretendere il risultato gia'
          // validato rende impossibile calcolare una chiave prima che Google
          // abbia risposto 200.
          ownershipKey = googleOwnershipKey(result, purchase_token);
        } catch (e) {
          if (e instanceof OwnershipKeyError) return responseForOwnershipKeyError(e);
          throw e;
        }
        const facts = subscriptionFacts(result.data);
        return responseForClaim(
          await claimStorePurchase(admin, {
            billingSource: "google_play",
            ownershipKey,
            ownerUserId: userId,
            productId: product_id,
            purchaseKind: "subscription",
            environment: "production",
            state: facts.state,
            activeUntil: facts.activeUntil,
            autoRenewing: facts.autoRenewing,
            storeEventAt: fetchedAt,
            storeEventSource: GOOGLE_EVENT_SOURCE,
            externalTransactionId: result.data.orderId ?? null,
            appAccountToken: null,
          }),
        );
      }
      if (result.kind === "expired") {
        // 410 Gone: Play non riconosce piu' questo token. Non si scrive
        // niente, e per una ragione precisa — la chiave di proprieta' Google si
        // deriva solo da un 200, altrimenti basterebbe un token inventato per
        // iscrivere una proprieta' nel registro, che e' append-only.
        //
        // Non serve nemmeno: la precedenza considera valido un abbonamento
        // solo con `active_until > adesso`, quindi uno scaduto smette di
        // contare da solo, senza che nessuno debba riscriverlo.
        return jsonOk({
          state: "expired",
          active_until: new Date(0).toISOString(),
          source: "google_play",
          auto_renewing: false,
          contract_version: PURCHASE_DISPOSITION_CONTRACT_VERSION,
          disposition: "retryable",
        });
      }
      if (result.kind === "error") {
        console.warn(
          `[Billing] google_validation_failed sub status=${result.status} body=${result.body.slice(0, 200)}`,
        );
        return jsonError(502, "google_validation_failed", { status: result.status });
      }
      return jsonError(500, "unexpected_result_kind");
    }

    // Prodotto one-time (lifetime)
    const result = await validateProduct({
      packageName: package_name,
      productId: product_id,
      purchaseToken: purchase_token,
    });
    const fetchedAt = new Date().toISOString();

    if (result.kind === "ok_product") {
      let ownershipKey: string;
      try {
        ownershipKey = googleOwnershipKey(result, purchase_token);
      } catch (e) {
        if (e instanceof OwnershipKeyError) return responseForOwnershipKeyError(e);
        throw e;
      }
      const facts = productFacts(result.data);
      return responseForClaim(
        await claimStorePurchase(admin, {
          billingSource: "google_play",
          ownershipKey,
          ownerUserId: userId,
          productId: product_id,
          purchaseKind: "lifetime",
          environment: "production",
          state: facts.state,
          activeUntil: facts.activeUntil,
          autoRenewing: false,
          storeEventAt: fetchedAt,
          storeEventSource: GOOGLE_EVENT_SOURCE,
          externalTransactionId: result.data.orderId ?? null,
          appAccountToken: null,
        }),
      );
    }
    if (result.kind === "expired") {
      return jsonOk({
        state: "expired",
        active_until: new Date(0).toISOString(),
        source: "google_play",
        auto_renewing: false,
        contract_version: PURCHASE_DISPOSITION_CONTRACT_VERSION,
        disposition: "retryable",
      });
    }
    if (result.kind === "error") {
      console.warn(
        `[Billing] google_validation_failed product status=${result.status} body=${result.body.slice(0, 200)}`,
      );
      return jsonError(502, "google_validation_failed", { status: result.status });
    }
    return jsonError(500, "unexpected_result_kind");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Billing] internal error: ${msg}`);
    return jsonError(500, "internal", msg);
  }
}
