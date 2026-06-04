/**
 * POST /api/v1/suunto/webhook/recovery
 *
 * Suunto chiama questo endpoint quando nuovi dati 247 recovery sono
 * disponibili per un utente connesso.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    console.log("[suunto/webhook/recovery] received:", JSON.stringify(body).slice(0, 200));
  } catch {
    console.log("[suunto/webhook/recovery] received non-JSON payload");
  }
  return new Response(null, { status: 200 });
}
