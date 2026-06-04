/**
 * POST /api/v1/suunto/webhook/activity
 *
 * Suunto chiama questo endpoint quando nuovi dati 247 activity sono
 * disponibili per un utente connesso. Risponde 200 per evitare che
 * Suunto disabiliti le notifiche.
 *
 * TODO: parsing payload + fetch dati via 247 Data API + upsert Supabase.
 * Richiede tabella provider_tokens per recuperare access_token per utente.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    console.log("[suunto/webhook/activity] received:", JSON.stringify(body).slice(0, 200));
  } catch {
    // body non-JSON: log e ritorna 200 comunque
    console.log("[suunto/webhook/activity] received non-JSON payload");
  }
  return new Response(null, { status: 200 });
}
