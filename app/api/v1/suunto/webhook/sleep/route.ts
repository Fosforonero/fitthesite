/**
 * POST /api/v1/suunto/webhook/sleep
 *
 * Suunto chiama questo endpoint quando nuovi dati 247 sleep sono
 * disponibili per un utente connesso.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    console.log("[suunto/webhook/sleep] received:", JSON.stringify(body).slice(0, 200));
  } catch {
    console.log("[suunto/webhook/sleep] received non-JSON payload");
  }
  return new Response(null, { status: 200 });
}
