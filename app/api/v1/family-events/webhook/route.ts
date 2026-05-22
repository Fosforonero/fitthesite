/**
 * POST /api/v1/family-events/webhook — dispatcher FCM per group_events INSERT.
 *
 * Invocato da un Supabase Database Webhook (HTTP POST) quando viene inserita
 * una riga in `public.group_events`. Manda una push notification a tutti i
 * membri attivi del gruppo ECCETTO l'originatore dell'evento.
 *
 * Auth: header `X-Webhook-Secret` con valore uguale a `FAMILY_EVENTS_WEBHOOK_SECRET`.
 * Senza questa verifica chiunque potrebbe triggerare fan-out di push.
 *
 * Payload Supabase Webhook (type INSERT):
 *   { type: "INSERT", table: "group_events", record: GroupEventRow, schema: "public" }
 *
 * Flow:
 *   1. Verifica X-Webhook-Secret
 *   2. Parse + valida il payload Supabase webhook
 *   3. Init Firebase Admin (singleton via getApps())
 *   4. Fetch active group_members EXCLUDING event.user_id
 *      + filter: solo recipients con profiles.notifications_enabled = true
 *   5. Risolvi display_name dell'originatore (actor)
 *   6. Mappa event_type → { title, body } in italiano
 *   7. Fetch fcm_token dai devices di ogni recipient (filtrati)
 *   8. Dispatch FCM v1 API push via firebase-admin messaging.sendEach()
 *   9. Cleanup token morti (InvalidRegistration/NotRegistered)
 *  10. Return summary { sent, failed, cleaned }
 *
 * NOTE: il flag profiles.notifications_enabled controlla SOLO questo
 * endpoint (notifiche visibili Mesh Famiglia). Il sync-trigger cron
 * /api/cron/sync-trigger manda data-only push SEMPRE, indipendente da
 * questo flag — il sync è infrastruttura, non una notifica utente.
 *
 * SERVICE_ROLE: giustificato — webhook server-side gated da FAMILY_EVENTS_WEBHOOK_SECRET.
 * Non è mai esposto al client mobile.
 *
 * FIREBASE: riusa `FIREBASE_SERVICE_ACCOUNT_KEY` (stessa env var del sync-trigger cron).
 * Non creiamo una seconda app Firebase — `initFirebase()` controlla via getApps().
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

// Cast generico per compatibilità con tipi DB non ancora rigenerati.
// Stessa tecnica usata in sync/route.ts e devices/auto-claim/route.ts.
type Sb = SupabaseClient;

export const dynamic = "force-dynamic";

// ─── Tipi ────────────────────────────────────────────────────────────────────

type GroupEventRow = {
  id: string;
  group_id: string;
  user_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type SupabaseWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: GroupEventRow;
  old_record: GroupEventRow | null;
};

type MemberRow = {
  user_id: string;
  display_name: string | null;
};

type DeviceRow = {
  id: string;
  user_id: string;
  fcm_token: string;
};

// ─── Errori FCM che indicano token definitivamente morto ─────────────────────

const DEAD_TOKEN_ERRORS = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);

// ─── Firebase singleton ───────────────────────────────────────────────────────

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
      // Vercel salva le env var con `\n` escaped — normalizziamo.
      privateKey: sa.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

// ─── Mappa event_type → testo notifica (IT) ──────────────────────────────────

type NotificationContent = { title: string; body: string };

function buildNotification(
  eventType: string,
  actor: string,
  payload: Record<string, unknown>,
): NotificationContent {
  switch (eventType) {
    case "welcome":
      return {
        title: `👋 ${actor} si è unito alla famiglia`,
        body: "",
      };
    case "milestone": {
      const metric = typeof payload.metric === "string" ? payload.metric : "";
      const value = payload.value !== undefined ? String(payload.value) : "";
      return {
        title: `🎉 ${actor} ha raggiunto un traguardo`,
        body: metric && value ? `${metric}: ${value}` : "",
      };
    }
    case "achievement": {
      const title = typeof payload.title === "string" ? payload.title : "";
      return {
        title: `🏆 ${actor} — nuovo record`,
        body: title,
      };
    }
    case "streak": {
      const days = payload.days !== undefined ? String(payload.days) : "?";
      return {
        title: `🔥 ${actor} — streak ${days}gg attivi`,
        body: "",
      };
    }
    case "member_left":
      return {
        title: `${actor} ha lasciato il gruppo`,
        body: "",
      };
    case "weekly_digest":
      return {
        title: "📊 Riepilogo famiglia settimanale",
        body: "Apri per vederlo",
      };
    default:
      // Tipi futuri / system: non mandiamo push (skip silenzioso)
      return { title: "", body: "" };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  // ── 1. Verifica webhook secret ───────────────────────────────────────────
  const webhookSecret = process.env.FAMILY_EVENTS_WEBHOOK_SECRET;
  if (webhookSecret) {
    const header = req.headers.get("x-webhook-secret");
    if (header !== webhookSecret) {
      return jsonError(401, "unauthorized_webhook");
    }
  }

  // ── 2. Parse payload ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }

  const wb = body as Partial<SupabaseWebhookPayload>;

  // Accettiamo solo INSERT su group_events
  if (wb.type !== "INSERT" || wb.table !== "group_events") {
    return jsonOk({ ok: true, skipped: true, reason: "not_group_events_insert" });
  }

  const event = wb.record;
  if (!event?.id || !event?.group_id || !event?.event_type) {
    return jsonError(400, "invalid_record");
  }

  // ── 3. Init Firebase ────────────────────────────────────────────────────
  try {
    initFirebase();
  } catch (e) {
    return jsonError(500, "firebase_init_failed", (e as Error).message);
  }

  const sb = createAdminClient() as unknown as Sb;

  // ── 4. Fetch active group members (excludendo il mittente)
  //       + filter: solo chi ha notifications_enabled = true su profiles ──────
  //
  // Recuperiamo user_id dei membri attivi, poi filtriamo via profiles join.
  // Supabase JS non supporta un JOIN diretto su tabelle diverse in un singolo
  // .select() senza foreign key — usiamo due query separate per chiarezza e
  // compatibilità garantita con qualsiasi versione supabase-js.
  let membersQuery = sb
    .from("group_members")
    .select("user_id, display_name")
    .eq("group_id", event.group_id)
    .is("left_at", null);

  // Escludiamo l'originatore solo se user_id è valorizzato
  if (event.user_id) {
    membersQuery = membersQuery.neq("user_id", event.user_id);
  }

  const { data: membersRaw, error: membersErr } = await membersQuery;
  if (membersErr) {
    return jsonError(500, "members_query_failed", membersErr.message);
  }

  const allMembers = (membersRaw ?? []) as MemberRow[];
  if (allMembers.length === 0) {
    return jsonOk({ ok: true, sent: 0, failed: 0, total: 0, cleaned: 0 });
  }

  // Fetch profiles.notifications_enabled per filtrare i recipient
  const allMemberIds = allMembers.map((m) => m.user_id);
  const { data: profilesRaw } = await sb
    .from("profiles")
    .select("id, notifications_enabled")
    .in("id", allMemberIds);

  const notifEnabledSet = new Set<string>(
    ((profilesRaw ?? []) as { id: string; notifications_enabled: boolean }[])
      .filter((p) => p.notifications_enabled !== false)
      .map((p) => p.id),
  );

  // Utenti senza riga in profiles (raro) → default true (non blocchiamo)
  const members = allMembers.filter(
    (m) => !profilesRaw || notifEnabledSet.has(m.user_id),
  );
  if (members.length === 0) {
    return jsonOk({ ok: true, sent: 0, failed: 0, total: 0, cleaned: 0, skippedAllNotifDisabled: allMembers.length > 0 });
  }

  // ── 5. Risolvi display_name dell'actor ───────────────────────────────────
  let actor = "Un membro";
  if (event.user_id) {
    const { data: actorMember } = await sb
      .from("group_members")
      .select("display_name")
      .eq("group_id", event.group_id)
      .eq("user_id", event.user_id)
      .maybeSingle();

    const raw = actorMember as MemberRow | null;
    if (raw?.display_name) {
      actor = raw.display_name;
    }
  }

  // ── 6. Mappa event_type → titolo/body IT ────────────────────────────────
  const notification = buildNotification(
    event.event_type,
    actor,
    event.payload ?? {},
  );

  // Tipo non gestito (es. "system") → skip silenzioso
  if (!notification.title) {
    return jsonOk({ ok: true, skipped: true, reason: "event_type_not_notifiable" });
  }

  // ── 7. Fetch FCM token per ogni recipient ────────────────────────────────
  const recipientUserIds = members.map((m) => m.user_id);

  const { data: devicesRaw, error: devicesErr } = await sb
    .from("devices")
    .select("id, user_id, fcm_token")
    .in("user_id", recipientUserIds)
    .not("fcm_token", "is", null)
    .is("revoked_at", null);

  if (devicesErr) {
    return jsonError(500, "devices_query_failed", devicesErr.message);
  }

  const devices = (devicesRaw ?? []) as DeviceRow[];
  if (devices.length === 0) {
    return jsonOk({ ok: true, sent: 0, failed: 0, total: 0, cleaned: 0 });
  }

  // ── 8. Dispatch FCM push ─────────────────────────────────────────────────
  const deepLink = `fitmesh://famiglia/${event.group_id}`;

  const messages = devices.map((d) => ({
    token: d.fcm_token,
    notification: {
      title: notification.title,
      ...(notification.body ? { body: notification.body } : {}),
    },
    data: {
      group_id: event.group_id,
      event_id: event.id,
      event_type: event.event_type,
      deep_link: deepLink,
    },
    android: {
      priority: "high" as const,
      notification: {
        // Canale Android per notifiche famiglia (da creare in app Flutter)
        channelId: "famiglia",
        clickAction: deepLink,
      },
    },
    apns: {
      payload: {
        aps: {
          // iOS: suono default + badge bump
          sound: "default",
          "content-available": 1 as const,
        },
      },
    },
  }));

  const messaging = getMessaging();
  const fcmResponse = await messaging.sendEach(messages);

  // ── 9. Cleanup token morti ───────────────────────────────────────────────
  const deadDeviceIds: string[] = [];
  fcmResponse.responses.forEach((res, idx) => {
    if (!res.success && res.error && DEAD_TOKEN_ERRORS.has(res.error.code)) {
      deadDeviceIds.push(devices[idx].id);
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
    sent: fcmResponse.successCount,
    failed: fcmResponse.failureCount,
    total: devices.length,
    cleaned,
    eventId: event.id,
    eventType: event.event_type,
    groupId: event.group_id,
    recipientsResolved: allMembers.length,
    recipientsFiltered: members.length,
    devicesFound: devices.length,
  });
}
