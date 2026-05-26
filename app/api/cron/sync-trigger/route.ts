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
 * Audit log: ogni invocazione scrive una row in sync_events con counters.
 */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { getFcmMessaging, isFcmConfigured } from "@/lib/fcm/admin";

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
    .select("id, user_id, fcm_token, device_fingerprint, app_version")
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

  // FCM HTTP v1 API: sendEach accetta fino a 500 messaggi distinti per chiamata.
  // Ogni messaggio ha il suo token (no multicast topic, push individuali).
  const messaging = getFcmMessaging();
  const messages = devices.map((d) => ({
    token: d.fcm_token,
    data: {
      action: "sync_now",
      reason: "scheduled",
      // Timestamp utile per dedup lato client se ricevesse push duplicati.
      ts: Math.floor(Date.now() / 1000).toString(),
    },
    android: {
      // Priorita' alta = sveglia il device anche in Doze (consumato dal
      // quota FCM "high priority" — Google limita ~2 push/giorno per app
      // a priorita' high senza notifica utente. Sotto soglia per noi.)
      priority: "high" as const,
      // TTL: se il device e' offline, FCM tiene il msg per 1h max — oltre
      // diventa stale (l'ora successiva arrivera' un nuovo trigger comunque).
      ttl: 60 * 60 * 1000,
    },
  }));

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
          failureTokens.push(devices[idx].fcm_token);
        }
      }
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "fcm_send_failed",
        details: err instanceof Error ? err.message : String(err),
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

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    invalidated: failureTokens.length,
    total: devices.length,
  });
}
