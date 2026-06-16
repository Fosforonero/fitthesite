/**
 * POST /api/v1/suunto/webhook/activity
 *
 * Suunto chiama questo endpoint quando nuovi dati activity sono disponibili.
 * Risponde sempre 200 (Suunto disabilita le notifiche se non riceve 200).
 *
 * SECURITY GATE (audit P1, 2026-06-16): il webhook è pubblico. Il
 * data-processing (parse + fetch 247 API + upsert Supabase) va messo SOLO
 * dentro `if (v.ok)`: senza firma/secret valido non si scrive nulla.
 * Configurare `SUUNTO_WEBHOOK_SECRET` su Vercel quando si collega Suunto.
 */
import { verifySuuntoWebhook } from "@/lib/api/suunto-webhook";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const v = verifySuuntoWebhook(req, raw);
  if (v.ok) {
    // TODO: parse `raw` + fetch Suunto 247 Data API + upsert Supabase.
    console.log("[suunto/webhook/activity] verified:", raw.slice(0, 200));
  } else {
    console.warn("[suunto/webhook/activity] unverified webhook ignored:", v.reason);
  }
  return new Response(null, { status: 200 });
}
