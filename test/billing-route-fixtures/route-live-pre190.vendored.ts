/* ────────────────────────────────────────────────────────────────────────────
 * COPIA DEL ROUTE REALMENTE DISTRIBUITO, subito prima della 190.
 *
 * Repository : github.com/Fosforonero/fitthesite
 * Percorso   : app/api/v1/billing/validate-purchase/route.ts
 * Commit     : f8d54c00c1cbe92ee42d64d9a251e2d11693be0e
 * SHA-256    : 45d705bbcc8b8df9a24a466ad22567036a34cb52b3c8a51c9cab55f78f959e3e
 * Deployment : dpl_GCWKSwUsAoBHbjHzyjL1nT645xSA (produzione, pronto il
 *              2026-08-26T14:31:37Z)
 *
 * «REALMENTE DISTRIBUITO» E' STATO VERIFICATO, NON DEDOTTO. L'alias
 * www.fitmesh.fit e' stato risolto e restituisce quel deployment; il commit
 * e' quello che il deployment dichiara. Non e' stato assunto che origin/main
 * sia la produzione: capita che coincidano, e oggi coincidono, ma e' un fatto
 * misurato e non una regola.
 *
 * COSA CONTIENE IN PIU' DELLA COPIA STORICA: 4e04ea8 (16/08, «chi paga da oggi
 * non si perde piu'»), che scrive la traccia del tentativo PRIMA della
 * validazione. Sono le sole 34 righe di differenza; fra 4e04ea8 e questo
 * commit il file non e' cambiato, e le due impronte sono identiche.
 *
 * A COSA SERVE: e' il backend che un telefono fermo alla v3.9.8+189 incontra
 * OGGI. La suite che la usa BLOCCA il rilascio.
 *
 * SI AGGIORNA quando la produzione cambia, e solo insieme al manifesto: il
 * commit, l'impronta e il deployment si riscrivono in un commit che si vede.
 *
 * COSA NON E' CONGELATO: solo QUESTO file viene dal commit dichiarato. I moduli
 * che importa sono quelli di oggi; nella suite che la usa i tre che contano
 * sono mockati.
 *
 * Rigenerabile con: bash tools/rigenera-fixture-billing.sh
 * L'intestazione qui sopra sta PRIMA della copia e non ne fa parte: l'impronta
 * si calcola da «INIZIO COPIA LETTERALE» in giu'.
 * ──────────────────────────────────────────────────────────────────────────── */
// @ts-nocheck -- e' una copia del route distribuito, non va adattata.
/* INIZIO COPIA LETTERALE */
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
});

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

async function upsertSubscription(admin: Sb, row: SubRow): Promise<string | null> {
  const { error } = await admin
    .from("b2c_subscriptions")
    .upsert(row, { onConflict: "user_id" });
  return error?.message ?? null;
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
  const { product_id, purchase_token, package_name, platform } = parsed.data;
  if (!KNOWN_PRODUCTS.has(product_id)) {
    return jsonError(400, "unknown_product");
  }

  const admin = createAdminClient() as unknown as Sb;
  const isSubscription = product_id === PRODUCT_SUBSCRIPTION;

  // ── La traccia del tentativo, PRIMA di provare a validare ───────────────
  //
  // Da qui in giu' ci sono quattordici punti di ritorno, e almeno cinque
  // possono lasciare l'utente pagato e non servito: lo store che risponde 502,
  // la ricevuta che non contiene l'acquisto, e soprattutto `upsert_failed` —
  // lo store ha confermato e noi non siamo riusciti a scrivere. In nessuno di
  // quei casi restava traccia sul server: solo un log su Vercel, che scade.
  // E' gia' costato un cliente.
  //
  // Si scrive PRIMA della validazione di proposito. Scriverla dopo perderebbe
  // esattamente i casi che deve catturare.
  //
  // QUESTO BLOCCO NON PUO' CAMBIARE L'ESITO DELLA RICHIESTA. L'unico modo in
  // cui puo' fallire e' non lasciando la traccia; non deve mai essere il
  // motivo per cui un pagamento non va a buon fine. Per questo l'errore si
  // registra e si prosegue, invece di propagarlo.
  // La tabella vive in `private`, che non e' esposto all'API: si passa da una
  // funzione in `public` concessa alla sola service_role, cosi' nessun client
  // puo' scrivere tentativi a nome di altri.
  try {
    const { error: tracciaErr } = await admin.rpc("registra_tentativo_acquisto", {
      p_user_id: userId,
      p_piattaforma: platform,
      p_product_id: product_id,
    });
    if (tracciaErr) {
      console.error("[Billing] traccia_tentativo_fallita", { code: tracciaErr.code });
    }
  } catch (e) {
    console.error("[Billing] traccia_tentativo_eccezione", {
      tipo: e instanceof Error ? e.name : "sconosciuto",
    });
  }

  // ── Ramo Apple (iOS) ─────────────────────────────────────────────────
  if (platform === "ios") {
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
        const err = await upsertSubscription(admin, row);
        if (err) return jsonError(500, "upsert_failed", err);
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
        const err = await upsertSubscription(admin, row);
        if (err) return jsonError(500, "upsert_failed", err);
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
      const err = await upsertSubscription(admin, row);
      if (err) return jsonError(500, "upsert_failed", err);
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
