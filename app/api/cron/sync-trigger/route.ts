/**
 * POST /api/cron/sync-trigger — FCM push trigger per bg sync.
 *
 * Triggered da GitHub Actions schedule ogni 30 min (Vercel Hobby cron limit
 * = daily only, quindi usiamo external scheduler).
 *
 * Per ogni device attivo (fcm_token presente + last_seen <14gg + non revoked)
 * invia un data-only FCM push. L'app riceve in background handler
 * (_firebaseMessagingBackgroundHandler), schedula WorkManager OneTimeRequest
 * con priorita' elevata, bypass Doze/Standby/Battery Saver.
 *
 * Auth: Bearer CRON_SECRET. Senza header valido → 401.
 *
 * Idempotenza: ogni invocazione triggera un push per ogni device idoneo.
 * Se due invocazioni arrivano in rapida sequenza, il device riceve 2 push
 * → 2 sync. L'app dedup-a su (user_id, day) lato Supabase quindi no double-count.
 *
 * Audit log: NON scrive in sync_events. Quella tabella e' vuota e nessuno la
 * scrive, ne' qui ne' nell'app; la versione precedente di questa riga
 * prometteva il contrario. Le uniche tracce sono i log Vercel e il JSON di
 * risposta, che porta conteggi tipizzati e mai un token.
 */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { getFcmMessaging, isFcmConfigured } from "@/lib/fcm/admin";
import { costruisciPushSync, type ContiTick } from "./payload";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sb = SupabaseClient;

// Cast helper - database.types stale per devices fcm_token columns
type DeviceRow = {
  id: string;
  user_id: string;
  fcm_token: string;
  device_fingerprint: string;
  app_version: string | null;
  // BG1: e' il dato autorevole da cui si decide se il messaggio va costruito
  // per iOS o per Android. Senza, il push iOS nasceva senza blocco APNs.
  os_version: string | null;
};

const MAX_DEVICES_PER_TICK = 500; // FCM sendEach batch limit
const DEVICE_FRESHNESS_DAYS = 14; // skip device dormienti

/** Auth check: header Authorization deve essere `Bearer <CRON_SECRET>`. */
function isAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // No secret configured: blocca tutto. Defensive default.
    return false;
  }
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isFcmConfigured()) {
    return NextResponse.json(
      { error: "fcm_not_configured", hint: "set FIREBASE_SERVICE_ACCOUNT_JSON_B64" },
      { status: 503 },
    );
  }

  const sb = createAdminClient() as unknown as Sb;

  // Soglia freshness: 14 giorni. Device con last_seen piu' vecchio sono
  // considerati dormienti — saltati per non sprecare FCM quota su token
  // probabilmente stale.
  const freshnessCutoff = new Date(
    Date.now() - DEVICE_FRESHNESS_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: rows, error: qErr } = await sb
    .from("devices")
    .select("id, user_id, fcm_token, device_fingerprint, app_version, os_version")
    .not("fcm_token", "is", null)
    .is("revoked_at", null)
    .gte("last_seen_at", freshnessCutoff)
    .limit(MAX_DEVICES_PER_TICK);

  if (qErr) {
    return NextResponse.json(
      { error: "query_failed", details: qErr.message },
      { status: 500 },
    );
  }

  const devices = (rows ?? []) as DeviceRow[];
  if (devices.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0 });
  }

  // FCM HTTP v1 API: sendEach accetta fino a 500 messaggi distinti per
  // chiamata. Ogni messaggio ha il suo token (no multicast topic).
  //
  // BG1: la costruzione vive in `payload.ts`, pura e testata, e decide il
  // ramo dalla piattaforma. Un dispositivo che non sappiamo classificare
  // viene SALTATO e contato — non riceve un push mal formato.
  const messaging = getFcmMessaging();
  const messages = [];
  // Indici allineati a `messages`: senza questa lista parallela, saltare
  // anche un solo dispositivo disallineerebbe `responses[idx]` da
  // `devices[idx]`, e il cleanup dei token morti colpirebbe il device
  // sbagliato.
  const inviatiA: DeviceRow[] = [];
  const conti: ContiTick = {
    inviati: 0,
    falliti: 0,
    saltatiPiattaformaIgnota: 0,
    saltatiTokenAssente: 0,
    totaleCandidati: devices.length,
  };

  for (const d of devices) {
    const esito = costruisciPushSync({
      token: d.fcm_token,
      osVersion: d.os_version,
    });
    if (esito.tipo === "saltato") {
      if (esito.motivo === "piattaforma_ignota") conti.saltatiPiattaformaIgnota++;
      else conti.saltatiTokenAssente++;
      continue;
    }
    messages.push(esito.messaggio);
    inviatiA.push(d);
  }

  if (messages.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0, conti });
  }

  let sent = 0;
  let failed = 0;
  const failureTokens: string[] = [];

  try {
    const result = await messaging.sendEach(messages);
    sent = result.successCount;
    failed = result.failureCount;
    // Raccoglie i token invalidati dal server (UNREGISTERED, INVALID_ARGUMENT)
    // per cleanup successivo.
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          failureTokens.push(inviatiA[idx].fcm_token);
        }
      }
    });
  } catch (err) {
    // Mai il messaggio dell'errore: l'SDK ci mette dentro la richiesta, e la
    // richiesta contiene i token. Solo il nome della classe, che basta a
    // distinguere una rete caduta da una credenziale sbagliata.
    return NextResponse.json(
      {
        error: "fcm_send_failed",
        detailType: err instanceof Error ? err.constructor.name : typeof err,
      },
      { status: 502 },
    );
  }

  // Cleanup token invalidati: il device ha disinstallato l'app o re-registrato
  // un nuovo token. Nullifichiamo lato Supabase per non riprovare la prossima
  // tick (sprechiamo solo 1 tentativo FCM per device morto).
  if (failureTokens.length > 0) {
    await sb
      .from("devices")
      .update({ fcm_token: null, fcm_token_updated_at: new Date().toISOString() })
      .in("fcm_token", failureTokens);
  }

  // Audit trail: Vercel runtime logs registrano il return JSON sotto, e
  // GitHub Actions logga response code + body. Skip insert in sync_events
  // (la table e' user-bound per eventi sync del singolo device, non per cron
  // a livello system).

  conti.inviati = sent;
  conti.falliti = failed;
  return NextResponse.json({
    ok: true,
    sent,
    failed,
    invalidated: failureTokens.length,
    total: devices.length,
    // Conteggi tipizzati: chi e' stato saltato, e perche'. Nessun token,
    // nessun uid, nessuna impronta di dispositivo.
    conti,
  });
}
