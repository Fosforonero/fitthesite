/**
 * GET /api/v1/oauth/suunto/callback
 *
 * Suunto reindirizza qui dopo che l'utente autorizza. Noi reindirizziamo
 * verso lo schema custom `fitmeshsync://suunto?code=...&state=...` che
 * viene catturato da app_links in Flutter per completare il flow OAuth.
 *
 * Il token exchange (code → access_token) avviene nel backend proxy
 * /api/v1/oauth/suunto/exchange — il client_secret non lascia mai il server.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    const deepLink = `fitmeshsync://suunto?error=${encodeURIComponent(error)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
    return Response.redirect(deepLink, 302);
  }

  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  const params = new URLSearchParams({ code });
  if (state) params.set("state", state);

  const deepLink = `fitmeshsync://suunto?${params.toString()}`;
  return Response.redirect(deepLink, 302);
}
