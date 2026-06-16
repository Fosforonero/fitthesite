/**
 * Proxy server-side per le chiamate dati Suunto (audit P2, 2026-06-16).
 *
 * Prima l'app chiamava `cloudapi.suunto.com` direttamente con la
 * `Ocp-Apim-Subscription-Key` compilata nel binario (estraibile). Ora la key
 * vive solo qui (env `SUUNTO_SUBSCRIPTION_KEY`) e l'app passa per questo proxy.
 *
 * Difesa: la route è gated su JWT Supabase (`requireUser`) → solo utenti
 * FitMesh autenticati possono usarla, niente open-relay della nostra key. Il
 * token OAuth Suunto dell'utente arriva in `X-Suunto-Token` e viene inoltrato
 * a Suunto come Bearer. Solo i query param in whitelist vengono propagati.
 */
import { jsonError, requireUser } from "@/lib/api/auth-helpers";

const SUUNTO_TOKEN_HEADER = "x-suunto-token";

export async function proxySuuntoGet(
  req: Request,
  suuntoBaseUrl: string,
  allowedParams: string[],
): Promise<Response> {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const subKey = process.env.SUUNTO_SUBSCRIPTION_KEY;
  if (!subKey) return jsonError(503, "suunto_not_configured");

  const suuntoToken = req.headers.get(SUUNTO_TOKEN_HEADER);
  if (!suuntoToken) return jsonError(400, "missing_suunto_token");

  const inUrl = new URL(req.url);
  const target = new URL(suuntoBaseUrl);
  for (const p of allowedParams) {
    const v = inUrl.searchParams.get(p);
    if (v !== null) target.searchParams.set(p, v);
  }

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: {
        Authorization: `Bearer ${suuntoToken}`,
        "Ocp-Apim-Subscription-Key": subKey,
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    return jsonError(502, "suunto_upstream_unreachable", String(e));
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
