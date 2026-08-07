/**
 * POST /api/v1/billing/validate-purchase — server-side IAP validation.
 *
 * Riceve un purchase token dal client Flutter, lo valida contro Google Play
 * Developer API, e UPSERT la row corrispondente in `public.b2c_subscriptions`.
 *
 * Risposte:
 *   200 { state, active_until, source: 'google_play', auto_renewing }
 *   400 invalid_payload | invalid_json | unknown_product
 *   401 missing/invalid token
 *   502 google_validation_failed     — Google ha risposto 4xx (non 410)
 *   503 google_play_not_configured   — env var mancante (dev/staging)
 *   500 upsert_failed | internal     — DB / unexpected
 *
 * SLA: rispondiamo entro 5s. Timeout fetch verso Google = 4s.
 *
 * Idempotente: stesso purchase_token chiamato N volte → stesso risultato,
 * UPSERT on conflict (user_id) do update. Nessuna INSERT duplicata.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { jsonError, jsonOk, requireUser } from "@/lib/api/auth-helpers";
import {
  readAppleSharedSecret,
  validateAppleReceipt,
} from "@/lib/billing/app-store";
import {
  looksLikeJws,
  verifyAppleJwsTransaction,
} from "@/lib/billing/app-store-jws";
import {
  type GoogleProductPurchase,
  type GoogleSubscriptionPurchase,
  readServiceAccount,
  validateProduct,
  validateSubscription,
} from "@/lib/billing/google-play";
import { createAdminClient } from "@/lib/supabase/admin";

type Sb = SupabaseClient;

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

type SubRow = {
  user_id: string;
  billing_source: "google_play" | "apple_iap";
  external_product_id: string;
  external_subscription_id: string;
  external_order_id: string | null;
  active_until: string;
  auto_renewing: boolean;
  state: "active" | "expired" | "cancelled" | "grace" | "on_hold" | "paused";
  raw_payload: unknown;
  last_notification_at: string | null;
};

function buildSubscriptionRow(args: {
  userId: string;
  productId: string;
  purchaseToken: string;
  data: GoogleSubscriptionPurchase;
}): SubRow {
  const { expiryTimeMillis, autoRenewing, orderId, cancelReason } = args.data;
  const activeUntil = expiryTimeMillis
    ? new Date(Number(expiryTimeMillis)).toISOString()
    : new Date().toISOString();
  const now = Date.now();
  const expired = expiryTimeMillis ? Number(expiryTimeMillis) < now : true;
  const cancelled = cancelReason !== undefined && cancelReason !== null;
  const state: SubRow["state"] = expired
    ? "expired"
    : cancelled
      ? "cancelled"
      : "active";
  return {
    user_id: args.userId,
    billing_source: "google_play",
    external_product_id: args.productId,
    external_subscription_id: args.purchaseToken,
    external_order_id: orderId ?? null,
    active_until: activeUntil,
    auto_renewing: autoRenewing ?? false,
    state,
    raw_payload: args.data,
    last_notification_at: new Date().toISOString(),
  };
}

function buildLifetimeRow(args: {
  userId: string;
  productId: string;
  purchaseToken: string;
  data: GoogleProductPurchase;
}): SubRow {
  const purchased = args.data.purchaseState === 0;
  const cancelled = args.data.purchaseState === 1;
  const state: SubRow["state"] = purchased
    ? "active"
    : cancelled
      ? "cancelled"
      : "active";
  return {
    user_id: args.userId,
    billing_source: "google_play",
    external_product_id: args.productId,
    external_subscription_id: args.purchaseToken,
    external_order_id: args.data.orderId ?? null,
    active_until: LIFETIME_SENTINEL,
    auto_renewing: false,
    state,
    raw_payload: args.data,
    last_notification_at: new Date().toISOString(),
  };
}

function buildExpiredRow(args: {
  userId: string;
  productId: string;
  purchaseToken: string;
}): SubRow {
  return {
    user_id: args.userId,
    billing_source: "google_play",
    external_product_id: args.productId,
    external_subscription_id: args.purchaseToken,
    external_order_id: null,
    active_until: new Date(0).toISOString(),
    auto_renewing: false,
    state: "expired",
    raw_payload: { reason: "google_410" },
    last_notification_at: new Date().toISOString(),
  };
}

/** Violazione di unicità Postgres: la transazione è già di qualcun altro. */
const PG_UNIQUE_VIOLATION = "23505";

type UpsertOutcome =
  | { ok: true }
  | { ok: false; alreadyLinked: true }
  | { ok: false; alreadyLinked: false; message: string };

/**
 * `onConflict: "user_id"` rende idempotente la RIPRESENTAZIONE: lo stesso
 * utente può mandare la stessa transazione dieci volte e resta una riga sola.
 *
 * Ma la tabella dichiara anche `unique (billing_source,
 * external_subscription_id)` (migration 20260514120004, presenza confermata in
 * produzione il 07/08/2026): se un ALTRO utente prova a reclamare la stessa
 * transazione Apple, l'insert viola quel vincolo. Prima diventava un 500
 * generico indistinguibile da un guasto del database; ora è un 409 esplicito.
 * Il controllo è affidato al vincolo e non a una lettura preventiva perché
 * così non c'è finestra di corsa fra due richieste simultanee.
 *
 * LIMITE NOTO, da tenere presente prima di dire "la transazione è legata per
 * sempre a quell'utente": l'upsert è su `user_id`, cioè una riga per utente. Se
 * l'utente A presenta una nuova transazione, la sua riga viene SOSTITUITA e il
 * vecchio `external_subscription_id` smette di esistere nella tabella — a quel
 * punto il vincolo non lo protegge più e un utente B potrebbe reclamarlo.
 * L'unicità qui garantisce "non contemporaneamente a due utenti", non
 * "appartiene per sempre a uno". Per una proprietà immutabile nel tempo
 * servirebbe un registro separato append-only degli acquisti verificati, che è
 * una modifica di schema e non si fa dentro un hotfix. Vedi
 * `AppFitmesh/docs/sprints/P0-apple-acquisto-non-servito.md`.
 */
async function upsertSubscription(
  admin: Sb,
  row: SubRow,
): Promise<UpsertOutcome> {
  const { error } = await admin
    .from("b2c_subscriptions")
    .upsert(row, { onConflict: "user_id" });
  if (!error) return { ok: true };
  if (error.code === PG_UNIQUE_VIOLATION) {
    return { ok: false, alreadyLinked: true };
  }
  return { ok: false, alreadyLinked: false, message: error.message };
}

/** Risposta da restituire se l'upsert non è andato a buon fine, altrimenti null. */
function upsertFailureResponse(result: UpsertOutcome): Response | null {
  if (result.ok) return null;
  if (result.alreadyLinked) {
    return jsonError(409, "purchase_already_linked");
  }
  return jsonError(500, "upsert_failed", result.message);
}

/**
 * Esiti del ramo StoreKit 2, mappati su codici stabili.
 *
 * La distinzione che conta per il client non è "errore sì/no" ma "ha senso
 * ritentare?":
 *
 *   400 jws_*                  rifiuto TERMINALE e verificato. Ritentare con
 *                              lo stesso token non cambierà niente.
 *   409 purchase_already_linked la transazione è di un altro account FitMesh.
 *                              Terminale, ma è un caso suo, non un difetto.
 *   503 apple_unavailable      Apple o la rete non hanno risposto. Da
 *                              ritentare: NON è un acquisto invalido.
 *   500 upsert_failed          il database non ha scritto. Da ritentare.
 *
 * Il JWS non compare mai nei log né in `raw_payload`.
 */
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
  // "Ripristina acquisti" — e il vincolo di unicità impedisce comunque che la
  // stessa transazione finisca su due account.
  // Confronto senza distinzione di maiuscole: è un UUID, e la forma con cui
  // Apple lo restituisce non è qualcosa su cui vogliamo scommettere.
  if (
    tx.appAccountToken &&
    tx.appAccountToken.toLowerCase() !== args.userId.toLowerCase()
  ) {
    console.warn("[Billing] apple jws appAccountToken does not match caller");
    return jsonError(409, "purchase_belongs_to_other_account");
  }

  const row: SubRow = {
    user_id: args.userId,
    billing_source: "apple_iap",
    external_product_id: args.productId,
    // originalTransactionId è stabile nel tempo: è la chiave giusta per
    // riconoscere lo stesso acquisto a ogni ripresentazione.
    external_subscription_id: tx.originalTransactionId,
    external_order_id: tx.transactionId,
    // Un non consumabile non scade. Se in futuro passasse di qui un
    // abbonamento, il suo `expiresDate` andrebbe letto dal payload: oggi il
    // tipo è già stato vincolato a NON_CONSUMABLE dal verificatore.
    active_until: LIFETIME_SENTINEL,
    auto_renewing: false,
    state: "active",
    raw_payload: {
      source: "sk2_jws",
      transaction_id: tx.transactionId,
      original_transaction_id: tx.originalTransactionId,
      product_id: tx.productId,
      environment: tx.environment,
      purchase_date_ms: tx.purchaseDateMs,
      app_account_token: tx.appAccountToken,
    },
    last_notification_at: new Date().toISOString(),
  };

  const result = await upsertSubscription(args.admin, row);
  if (!result.ok) {
    if (result.alreadyLinked) {
      console.warn("[Billing] apple jws purchase already linked to another user");
      return jsonError(409, "purchase_already_linked");
    }
    return jsonError(500, "upsert_failed", result.message);
  }

  return jsonOk({
    state: row.state,
    active_until: row.active_until,
    source: "apple_iap",
    auto_renewing: row.auto_renewing,
  });
}

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
    // Solo per client realmente StoreKit 1 (iOS < 15). Invariato.
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
        const expiresMs = tx.expires_date_ms ? Number(tx.expires_date_ms) : null;
        const expired = isSubscription && expiresMs !== null && expiresMs < Date.now();
        const row: SubRow = {
          user_id: userId,
          billing_source: "apple_iap",
          external_product_id: product_id,
          // original_transaction_id è stabile attraverso i rinnovi → chiave
          // idempotente naturale (la ricevuta intera cambia a ogni rinnovo).
          external_subscription_id: tx.original_transaction_id,
          external_order_id: tx.transaction_id ?? null,
          active_until: isSubscription
            ? new Date(expiresMs ?? Date.now()).toISOString()
            : LIFETIME_SENTINEL,
          auto_renewing: isSubscription ? result.autoRenewing : false,
          state: expired ? "expired" : "active",
          // Mai l'intera ricevuta (100KB+): solo la transazione rilevante.
          raw_payload: { tx, environment: result.environment },
          last_notification_at: new Date().toISOString(),
        };
        const failed = upsertFailureResponse(
          await upsertSubscription(admin, row),
        );
        if (failed) return failed;
        return jsonOk({
          state: row.state,
          active_until: row.active_until,
          source: "apple_iap",
          auto_renewing: row.auto_renewing,
        });
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
  // Fallback graceful: env var non settata. Restituiamo 503 con messaggio
  // chiaro così il client può comportarsi di conseguenza (in dev cade su
  // grant in-memory client-side).
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
      if (result.kind === "ok_subscription") {
        const row = buildSubscriptionRow({
          userId,
          productId: product_id,
          purchaseToken: purchase_token,
          data: result.data,
        });
        const failed = upsertFailureResponse(
          await upsertSubscription(admin, row),
        );
        if (failed) return failed;
        return jsonOk({
          state: row.state,
          active_until: row.active_until,
          source: "google_play",
          auto_renewing: row.auto_renewing,
        });
      }
      if (result.kind === "expired") {
        const row = buildExpiredRow({
          userId,
          productId: product_id,
          purchaseToken: purchase_token,
        });
        await upsertSubscription(admin, row);
        return jsonOk({
          state: "expired",
          active_until: row.active_until,
          source: "google_play",
          auto_renewing: false,
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

    // Lifetime product
    const result = await validateProduct({
      packageName: package_name,
      productId: product_id,
      purchaseToken: purchase_token,
    });
    if (result.kind === "ok_product") {
      const row = buildLifetimeRow({
        userId,
        productId: product_id,
        purchaseToken: purchase_token,
        data: result.data,
      });
      const failed = upsertFailureResponse(
        await upsertSubscription(admin, row),
      );
      if (failed) return failed;
      return jsonOk({
        state: row.state,
        active_until: row.active_until,
        source: "google_play",
        auto_renewing: false,
      });
    }
    if (result.kind === "expired") {
      const row = buildExpiredRow({
        userId,
        productId: product_id,
        purchaseToken: purchase_token,
      });
      await upsertSubscription(admin, row);
      return jsonOk({
        state: "expired",
        active_until: row.active_until,
        source: "google_play",
        auto_renewing: false,
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
