/**
 * POST /api/v1/garmin/webhook/dailies
 *
 * SCAFFOLD: Garmin Health API "ping" per i daily summaries (passi, FC, calorie,
 * distanza, stress, body battery, SpO2). Risponde sempre 200 (Garmin disabilita
 * le notifiche senza 200). Il data-processing (fetch summary URL + upsert
 * Supabase) va SOLO dentro `if (v.ok)`. Configurare GARMIN_WEBHOOK_SECRET quando
 * si collega Garmin.
 */
import { verifyGarminWebhook } from "@/lib/api/garmin-webhook";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const v = verifyGarminWebhook(req, raw);
  if (v.ok) {
    // TODO(garmin): parse `raw` + fetch Health API summary + upsert fitness_metrics.
    console.log("[garmin/webhook/dailies] verified:", raw.slice(0, 200));
  } else {
    console.warn("[garmin/webhook/dailies] unverified webhook ignored:", v.reason);
  }
  return new Response(null, { status: 200 });
}
