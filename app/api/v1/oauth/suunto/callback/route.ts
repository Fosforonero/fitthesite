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

import {
  logSuuntoCodeShape,
  suuntoCodeFromQuery,
  suuntoCodeShape,
} from "@/lib/oauth/suunto-backend";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  // Un '+' letterale nel code resta un '+' (searchParams lo leggerebbe come
  // spazio). Se la query e' malformata si ripiega sul comportamento di prima.
  const legacyCode = url.searchParams.get("code");
  const code = suuntoCodeFromQuery(url.search) ?? legacyCode;
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    const deepLink = `fitmeshsync://suunto?error=${encodeURIComponent(error)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
    return Response.redirect(deepLink, 302);
  }

  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  logSuuntoCodeShape("callback", suuntoCodeShape(code), {
    legacyDiffers: legacyCode !== code,
  });

  const params = new URLSearchParams({ code });
  if (state) params.set("state", state);

  const deepLink = `fitmeshsync://suunto?${params.toString()}`;
  return Response.redirect(deepLink, 302);
}
