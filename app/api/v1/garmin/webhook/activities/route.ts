/**
 * POST /api/v1/garmin/webhook/activities
 *
 * SCAFFOLD: Garmin Activity API "ping" per gli allenamenti (30+ tipi, GPS,
 * FIT/TCX/GPX). Risponde sempre 200. Data-processing SOLO dentro `if (v.ok)`.
 * Configurare GARMIN_WEBHOOK_SECRET quando si collega Garmin.
 */
import { verifyGarminWebhook } from "@/lib/api/garmin-webhook";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const v = verifyGarminWebhook(req, raw);
  if (v.ok) {
    // TODO(garmin): parse `raw` + fetch Activity API detail + upsert exercises.
    console.log("[garmin/webhook/activities] verified:", raw.slice(0, 200));
  } else {
    console.warn("[garmin/webhook/activities] unverified webhook ignored:", v.reason);
  }
  return new Response(null, { status: 200 });
}
