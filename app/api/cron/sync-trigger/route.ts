/**
 * GET /api/cron/sync-trigger — Vercel cron schedulato che manda silent push
 * a tutti i device attivi per triggerare un sync bypassando Doze/Freecess.
 *
 * Schedule: vedi vercel.json — `* /15 * * * *` (ogni 15min).
 *
 * Auth: Vercel cron passa `Authorization: Bearer ${CRON_SECRET}` se la env
 * var è settata su Vercel. Verifichiamo qui per evitare che chiunque
 * triggeri il fan-out di push.
 *
 * Flow:
 *   1. Verify CRON_SECRET (se configurato)
 *   2. Init Firebase Admin SDK (singleton via getApps())
 *   3. Query SERVICE_ROLE: tutti devices con fcm_token NOT NULL, non revoked,
 *      last_seen_at > now() - 7d (no push a device dormienti/disinstallati)
 *   4. messaging.sendEach(messages) batch (max 500 per call)
 *   5. Per ogni failure InvalidRegistration/NotRegistered → null-ifica il token
 *      (cleanup automatico, il device si re-registra al prossimo login)
 *   6. Return { sent, failed, total, cleaned }
 *
 * SERVICE_ROLE è giustificato: cron sistema-wide, NON mobile-facing,
 * gated dal CRON_SECRET. La env var Vercel è Sensitive.
 */
import { createClient } from "@supabase/supabase-js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

export const dynamic = "force-dynamic";

// Errori FCM che indicano un token morto definitivamente (vs errori transitori
// tipo "too many requests" che NON cleanup-iamo).
const DEAD_TOKEN_ERRORS = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);

function initFirebase(): void {
  if (getApps().length > 0) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");
  const sa = JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
  initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      // Se la private_key viene salvata nelle env var Vercel con escape `\n`
      // letterali (anziché newline reali), Firebase Admin si rifiuta. Normalizzo.
      privateKey: sa.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

export async function GET(req: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const header = req.headers.get("authorization");
    if (header !== `Bearer ${cronSecret}`) {
      return jsonError(401, "unauthorized_cron");
    }
  }

  try {
    initFirebase();
  } catch (e) {
    return jsonError(500, "firebase_init_failed", (e as Error).message);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return jsonError(500, "supabase_env_misconfigured");
  }

  const sb = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: devices, error: queryErr } = await sb
    .from("devices")
    .select("id, fcm_token")
    .not("fcm_token", "is", null)
    .is("revoked_at", null)
    .gt("last_seen_at", sevenDaysAgo)
    .order("last_seen_at", { ascending: true })
    .limit(500);

  if (queryErr) return jsonError(500, "device_query_failed", queryErr.message);
  if (!devices || devices.length === 0) {
    return jsonOk({ ok: true, sent: 0, failed: 0, total: 0, cleaned: 0 });
  }

  type DeviceRow = { id: string; fcm_token: string };
  const rows = devices as DeviceRow[];

  const messages = rows.map((d) => ({
    token: d.fcm_token,
    data: {
      action: "sync_now",
      reason: "scheduled",
      deviceId: d.id,
    },
    android: {
      // High priority: Android sveglia l'app anche in Doze (best effort —
      // alcuni OEM tipo Samsung Freecess ignorano comunque, FCM è il
      // canale meno bloccato disponibile).
      priority: "high" as const,
    },
  }));

  const messaging = getMessaging();
  const response = await messaging.sendEach(messages);

  const deadDeviceIds: string[] = [];
  response.responses.forEach((res, idx) => {
    if (!res.success && res.error && DEAD_TOKEN_ERRORS.has(res.error.code)) {
      deadDeviceIds.push(rows[idx].id);
    }
  });

  let cleaned = 0;
  if (deadDeviceIds.length > 0) {
    const { error: cleanErr } = await sb
      .from("devices")
      .update({
        fcm_token: null,
        fcm_token_updated_at: new Date().toISOString(),
      })
      .in("id", deadDeviceIds);
    if (!cleanErr) cleaned = deadDeviceIds.length;
  }

  return jsonOk({
    ok: true,
    sent: response.successCount,
    failed: response.failureCount,
    total: rows.length,
    cleaned,
  });
}
