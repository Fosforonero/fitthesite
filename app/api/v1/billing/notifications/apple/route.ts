/**
 * App Store Server Notifications V2.
 *
 * PERCHE' ESISTE
 * --------------
 * Fino alla 190 non c'era niente che ricevesse un rimborso deciso da Apple.
 * `private.billing_pending_revocations` e' la macchina che APPLICHEREBBE una
 * revoca, e nessuno gliene consegnava mai una: un lifetime rimborsato restava
 * per sempre il miglior diritto dell'utente.
 *
 * L'ORDINE, CHE E' LA COSA CHE CONTA
 * ----------------------------------
 * verifica firma → apri (durevole) → applica → chiudi → 2xx.
 *
 * Un 2xx dato prima della persistenza e' un fatto che Apple considera
 * consegnato e che noi non abbiamo. E' la forma esatta del difetto che ha gia'
 * fatto perdere un cliente sul percorso sincrono, e qui costerebbe di piu':
 * Apple non riconsegna una notifica che ha gia' ricevuto in carico.
 *
 * AUTENTICAZIONE
 * --------------
 * Non c'e' un header da controllare, e non deve esserci: l'autenticita' e'
 * nella firma del payload, verificata contro i root pubblici di Apple con lo
 * stesso trust store del percorso sincrono. Un endpoint che si fidasse di un
 * segreto condiviso accetterebbe qualunque cosa da chi quel segreto lo ha.
 *
 * COSA QUESTO ENDPOINT NON FA
 * ---------------------------
 * Non concede diritti che non arrivino gia' dal percorso sincrono. Una
 * notifica d'acquisto senza `appAccountToken` non e' attribuibile a nessuno —
 * la notifica non dice di CHI e' l'account — e viene registrata come
 * `ignorata` invece che indovinata. Le revoche invece non hanno bisogno del
 * proprietario: lavorano sulla chiave di proprieta', ed erano il buco vero.
 */
import { NextResponse } from "next/server";

import {
  NOTIFICHE_DI_REVOCA,
  verificaNotificaApple,
} from "@/lib/billing/app-store-notifications";
import { recordStorePurchaseRevocation } from "@/lib/billing/claim-purchase";
import { appleOwnershipKey } from "@/lib/billing/ownership-key";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

type Sb = SupabaseClient;

export const dynamic = "force-dynamic";

/** Nessun corpo: ad Apple interessa solo lo stato. */
function ok(): Response {
  return new NextResponse(null, { status: 200 });
}
/** Apple riprova. Nessun dettaglio esce: non c'e' nessuno da informare. */
function riprova(): Response {
  return new NextResponse(null, { status: 503 });
}
/** Firma non valida: non c'e' niente da registrare e riprovare non aiuta. */
function rifiuta(): Response {
  return new NextResponse(null, { status: 400 });
}

export async function POST(req: Request): Promise<Response> {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return rifiuta();
  }

  const signedPayload =
    corpo && typeof corpo === "object"
      ? (corpo as Record<string, unknown>).signedPayload
      : undefined;

  const verificata = await verificaNotificaApple(signedPayload);
  if (verificata.kind === "retryable") {
    console.warn("[Notifiche] apple: verifica non riuscita, si riprova");
    return riprova();
  }
  if (verificata.kind === "rejected") {
    // Solo il codice tipizzato. Il payload non entra nei log: e' firmato da
    // Apple ma contiene una transazione, e un log e' un posto in cui non si
    // sceglie chi guarda.
    console.warn("[Notifiche] apple: rifiutata", { reason: verificata.reason });
    return rifiuta();
  }

  const n = verificata.notifica;
  const admin = createAdminClient() as unknown as Sb;

  // ── 1. Apertura durevole, PRIMA di qualunque effetto ─────────────────────
  let stato: string;
  try {
    const { data, error } = await admin.rpc("apri_notifica_store", {
      p_store: "apple",
      p_notification_id: n.notificationUUID,
      p_notification_type: n.notificationType,
      p_subtype: n.subtype,
    });
    if (error) {
      console.error("[Notifiche] apple: apertura fallita", { code: error.code });
      return riprova();
    }
    stato = String(data);
  } catch {
    return riprova();
  }

  if (stato === "gia_applicata") {
    // Replay di qualcosa di gia' fatto. Non si rifa': si conferma.
    return ok();
  }

  // `in_corso` NON e' `gia_applicata`: e' una riconsegna il cui primo
  // tentativo e' morto a meta'. L'effetto va riprovato, ed e' il motivo per
  // cui le due cose sono distinte nel registro.

  // ── 2. L'effetto ─────────────────────────────────────────────────────────
  const tx = n.transaction;
  const eRevoca = NOTIFICHE_DI_REVOCA.has(n.notificationType);

  if (!eRevoca || !tx) {
    // Registrata e non applicata. Un tipo che non conosciamo NON viene dedotto
    // «quindi e' una revoca»: il giorno in cui Apple ne aggiunge uno nuovo,
    // quella deduzione toglierebbe a qualcuno il diritto per cui ha pagato.
    await chiudi(admin, n.notificationUUID, "ignorata", null, null, n.signedDateMs);
    return ok();
  }

  // `appleOwnershipKey` SOLLEVA invece di restituire un errore, e l'ambiente
  // lo vuole in minuscolo: due dettagli che il compilatore ha trovato al posto
  // mio, e che a runtime sarebbero diventati una notifica di revoca persa.
  let chiave: string;
  try {
    chiave = appleOwnershipKey(
      tx.originalTransactionId,
      n.environment === "Sandbox" ? "sandbox" : "production",
    );
  } catch {
    await chiudi(admin, n.notificationUUID, "rifiutata", null, null, n.signedDateMs);
    return ok();
  }

  const revocaMs =
    typeof tx.revocationDate === "number" ? tx.revocationDate : null;
  const evidenzaMs = n.signedDateMs ?? Date.now();

  const esito = await recordStorePurchaseRevocation(admin, {
    billingSource: "apple_iap",
    ownershipKey: chiave,
    productId: String(tx.productId ?? ""),
    purchaseKind: tx.productId === "fitmesh_pro_sub" ? "subscription" : "lifetime",
    storeEventAt: new Date(evidenzaMs).toISOString(),
    storeEventSource: "apple_signed_date",
    revocationAt: revocaMs === null ? null : new Date(revocaMs).toISOString(),
  });

  // ── 3. Chiusura, e SOLO ORA il 2xx ───────────────────────────────────────
  if (esito.kind === "recorded" || esito.kind === "not_claimed") {
    // `not_claimed` non e' un guasto: quell'acquisto non e' nel registro,
    // quindi non c'e' nessun diritto da togliere. La revoca resta comunque
    // registrata come fatto, e il primo claim su quella chiave se la
    // applichera' addosso.
    const chiusa = await chiudi(
      admin,
      n.notificationUUID,
      esito.kind === "recorded" ? "applicata" : "ignorata",
      "apple_iap",
      chiave,
      evidenzaMs,
    );
    if (!chiusa) {
      // L'effetto e' avvenuto ma non siamo riusciti a dichiararlo. Chiedere
      // ad Apple di riconsegnare e' sicuro: `apri_notifica_store` la
      // riconoscera', e la revoca e' idempotente sulla stessa chiave.
      return riprova();
    }
    return ok();
  }

  console.warn("[Notifiche] apple: revoca non persistita", { kind: esito.kind });
  return riprova();
}

async function chiudi(
  admin: Sb,
  notificationId: string,
  esito: "applicata" | "ignorata" | "rifiutata",
  billingSource: string | null,
  ownershipKey: string | null,
  storeEventMs: number | null,
): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc("chiudi_notifica_store", {
      p_store: "apple",
      p_notification_id: notificationId,
      p_esito: esito,
      p_billing_source: billingSource,
      p_ownership_key: ownershipKey,
      p_store_event_at:
        storeEventMs === null ? null : new Date(storeEventMs).toISOString(),
    });
    if (error) {
      console.error("[Notifiche] apple: chiusura fallita", { code: error.code });
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
}
