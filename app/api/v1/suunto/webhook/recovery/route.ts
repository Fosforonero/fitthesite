/**
 * POST /api/v1/suunto/webhook/recovery
 *
 * Suunto chiama questo endpoint quando nuovi dati 247 recovery sono
 * disponibili per un utente connesso.
 *
 * ⚠️ SECURITY GATE (audit 2026-06-10): endpoint pubblico SENZA verifica
 * firma/secret. Finché è uno stub log-only è innocuo, ma NON implementare
 * il data-processing senza prima aggiungere autenticazione del webhook
 * (HMAC/secret Suunto) — altrimenti diventa un vettore di iniezione dati.
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
