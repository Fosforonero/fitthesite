/**
 * POST /api/v1/suunto/webhook/workout
 *
 * Suunto chiama questo endpoint quando un nuovo workout è disponibile
 * per un utente connesso.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    console.log("[suunto/webhook/workout] received:", JSON.stringify(body).slice(0, 200));
  } catch {
    console.log("[suunto/webhook/workout] received non-JSON payload");
  }
  return new Response(null, { status: 200 });
}
