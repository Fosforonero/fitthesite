/**
 * POST /api/v1/garmin/webhook/sleeps
 *
 * SCAFFOLD: Garmin Health API "ping" per i sleep summaries (durata + fasi).
 * Risponde sempre 200. Data-processing SOLO dentro `if (v.ok)`. Configurare
 * GARMIN_WEBHOOK_SECRET quando si collega Garmin.
 */
import { verifyGarminWebhook } from "@/lib/api/garmin-webhook";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const v = verifyGarminWebhook(req, raw);
  if (v.ok) {
    // TODO(garmin): parse `raw` + fetch Health API sleep summary + upsert fitness_metrics.
    console.log("[garmin/webhook/sleeps] verified:", raw.slice(0, 200));
  } else {
    console.warn("[garmin/webhook/sleeps] unverified webhook ignored:", v.reason);
  }
  return new Response(null, { status: 200 });
}
