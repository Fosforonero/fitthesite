/**
 * Google Real-time Developer Notifications (RTDN), consegnate via Pub/Sub push.
 *
 * RTDN E' UN SEGNALE, NON UNA VERITA'
 * ----------------------------------
 * La notifica dice «guarda questo acquisto», e nient'altro. Lo stato vero si
 * rilegge dalla Developer API, che e' la sola fonte. Se le due cose non
 * concordano vince la Developer API, e il disaccordo resta registrato invece
 * di sparire: e' esattamente il genere di divergenza che nessuno andrebbe mai
 * a cercare da solo.
 *
 * L'ORDINE
 * --------
 * verifica OIDC → apri (durevole) → rileggi da Google → applica → chiudi → 2xx.
 *
 * Un 2xx prima della persistenza e' un fatto che Pub/Sub considera consegnato e
 * che noi non abbiamo. Qualunque cosa non arrivi fino in fondo risponde in modo
 * che Pub/Sub riconsegni.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { recordStorePurchaseRevocation } from "@/lib/billing/claim-purchase";
import { readServiceAccount, validateProduct } from "@/lib/billing/google-play";
import { googleOwnershipKey } from "@/lib/billing/ownership-key";
import {
  leggiMessaggioPubSub,
  verificaPushPubSub,
} from "@/lib/billing/pubsub-push";
import { createAdminClient } from "@/lib/supabase/admin";

type Sb = SupabaseClient;

export const dynamic = "force-dynamic";

const PACKAGE_NAME = "com.fitmeshsync.app";
const PRODOTTO_LIFETIME = "fitmesh_pro_lifetime";

function ok(): Response {
  return new NextResponse(null, { status: 200 });
}
function riprova(): Response {
  return new NextResponse(null, { status: 503 });
}
function rifiuta(): Response {
  return new NextResponse(null, { status: 400 });
}

export async function POST(req: Request): Promise<Response> {
  const auth = await verificaPushPubSub(req);
  if (auth.kind === "retryable") {
    console.warn("[Notifiche] google: verifica non riuscita", { reason: auth.reason });
    return riprova();
  }
  if (auth.kind === "rejected") {
    console.warn("[Notifiche] google: consegna rifiutata", { reason: auth.reason });
    return rifiuta();
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return rifiuta();
  }

  const messaggio = leggiMessaggioPubSub(corpo);
  if (!messaggio) return rifiuta();

  const admin = createAdminClient() as unknown as Sb;

  // ── 1. Apertura durevole ─────────────────────────────────────────────────
  const tipo = tipoDiNotifica(messaggio.dati);
  let stato: string;
  try {
    const { data, error } = await admin.rpc("apri_notifica_store", {
      p_store: "google",
      p_notification_id: messaggio.messageId,
      p_notification_type: tipo,
      p_subtype: null,
    });
    if (error) {
      console.error("[Notifiche] google: apertura fallita", { code: error.code });
      return riprova();
    }
    stato = String(data);
  } catch {
    return riprova();
  }

  if (stato === "gia_applicata") return ok();

  // ── 2. Solo le revoche hanno bisogno di questo percorso ──────────────────
  //
  // Gli acquisti arrivano gia' dal percorso sincrono, con il proprietario
  // dichiarato dal client autenticato. Una notifica non dice di CHI e'
  // l'account, e indovinarlo sarebbe peggio che non applicarla.
  const voided = messaggio.dati.voidedPurchaseNotification;
  if (!voided || typeof voided !== "object") {
    await chiudi(admin, messaggio.messageId, "ignorata", null, null, null);
    return ok();
  }

  const purchaseToken = (voided as Record<string, unknown>).purchaseToken;
  if (typeof purchaseToken !== "string" || purchaseToken.length === 0) {
    await chiudi(admin, messaggio.messageId, "rifiutata", null, null, null);
    return ok();
  }

  if (!readServiceAccount()) {
    // Senza credenziali non si puo' RILEGGERE, e senza rilettura non si
    // applica niente: la notifica da sola non e' una verita'.
    console.warn("[Notifiche] google: service account assente, si riprova");
    return riprova();
  }

  // ── 3. La rilettura, che e' la fonte vera ────────────────────────────────
  let verifica: Awaited<ReturnType<typeof validateProduct>>;
  try {
    verifica = await validateProduct({
      packageName: PACKAGE_NAME,
      productId: PRODOTTO_LIFETIME,
      purchaseToken,
    });
  } catch {
    return riprova();
  }

  if (verifica.kind !== "ok_product" && verifica.kind !== "ok_subscription") {
    // Google non conferma l'acquisto. Puo' voler dire che il rimborso lo ha
    // gia' cancellato, oppure che non siamo riusciti a leggerlo: sono due cose
    // diverse e non si confondono. Nel dubbio si riconsegna.
    console.warn("[Notifiche] google: rilettura non conferma", { kind: verifica.kind });
    return riprova();
  }

  // `purchaseState` 1 = canceled. Se Google dice che l'acquisto e' ancora
  // valido, la Developer API VINCE sulla notifica, e il disaccordo si
  // registra invece di sparire.
  const stato_acquisto =
    verifica.kind === "ok_product" ? verifica.data.purchaseState : undefined;
  if (stato_acquisto !== 1) {
    console.warn("[Notifiche] google: RTDN dice revocato, la Developer API no", {
      purchase_state: stato_acquisto ?? -1,
    });
    await chiudi(admin, messaggio.messageId, "ignorata", "google_play", null, null);
    return ok();
  }

  let chiave: string;
  try {
    chiave = googleOwnershipKey(verifica, purchaseToken);
  } catch {
    await chiudi(admin, messaggio.messageId, "rifiutata", null, null, null);
    return ok();
  }

  // L'orologio: `eventTimeMillis` e' quello di Google, non il nostro.
  const eventoMs = Number(messaggio.dati.eventTimeMillis ?? Date.now());
  const evidenza = new Date(
    Number.isFinite(eventoMs) ? eventoMs : Date.now(),
  ).toISOString();

  const esito = await recordStorePurchaseRevocation(admin, {
    billingSource: "google_play",
    ownershipKey: chiave,
    productId: PRODOTTO_LIFETIME,
    purchaseKind: "lifetime",
    storeEventAt: evidenza,
    storeEventSource: "google_backend_fetch",
    revocationAt: evidenza,
  });

  if (esito.kind === "recorded" || esito.kind === "not_claimed") {
    const chiusa = await chiudi(
      admin,
      messaggio.messageId,
      esito.kind === "recorded" ? "applicata" : "ignorata",
      "google_play",
      chiave,
      evidenza,
    );
    if (!chiusa) return riprova();
    return ok();
  }

  console.warn("[Notifiche] google: revoca non persistita", { kind: esito.kind });
  return riprova();
}

function tipoDiNotifica(dati: Record<string, unknown>): string {
  if (dati.voidedPurchaseNotification) return "VOIDED_PURCHASE";
  if (dati.subscriptionNotification) return "SUBSCRIPTION";
  if (dati.oneTimeProductNotification) return "ONE_TIME_PRODUCT";
  if (dati.testNotification) return "TEST";
  return "SCONOSCIUTA";
}

async function chiudi(
  admin: Sb,
  notificationId: string,
  esito: "applicata" | "ignorata" | "rifiutata",
  billingSource: string | null,
  ownershipKey: string | null,
  storeEventAt: string | null,
): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc("chiudi_notifica_store", {
      p_store: "google",
      p_notification_id: notificationId,
      p_esito: esito,
      p_billing_source: billingSource,
      p_ownership_key: ownershipKey,
      p_store_event_at: storeEventAt,
    });
    if (error) {
      console.error("[Notifiche] google: chiusura fallita", { code: error.code });
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
}
