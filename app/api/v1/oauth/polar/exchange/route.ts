/**
 * POST /api/v1/oauth/polar/exchange — token exchange server-side.
 *
 * L'app Flutter manda il `code` ricevuto dal flow Polar; noi usiamo
 * POLAR_CLIENT_SECRET (env Vercel) per chiamare Polar server-side con HTTP
 * Basic Auth, registriamo l'utente su AccessLink (/v3/users) e ritorniamo
 * la response token Polar all'app.
 *
 * Il secret NON è mai nel binary Flutter — vedi lib/oauth/polar-backend.ts
 *
 * Niente route refresh: Polar AccessLink non emette refresh_token.
 *
 * Body (JSON):
 *   { code: string, redirectUri?: string }
 *
 * Risposte:
 *   200 { access_token, token_type, expires_in, x_user_id }  (passthrough Polar)
 *   400 missing_fields | invalid_body
 *   429 rate_limit_exceeded
 *   502 polar_api_error
 *   503 provider_not_configured
 *   500 server_error
 */
export const dynamic = "force-dynamic";

import { z } from "zod";

import {
  POLAR_REDIRECT_URI,
  PolarApiError,
  checkRateLimit,
  exchangePolarCode,
  extractIp,
  getPolarEnv,
} from "@/lib/oauth/polar-backend";

const bodySchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const ip = extractIp(req);
  if (!checkRateLimit(ip)) {
    return jsonError(429, "rate_limit_exceeded", {
      message: "Troppi tentativi, riprova tra un minuto",
    });
  }

  const env = getPolarEnv();
  if (!env) {
    return jsonError(503, "provider_not_configured", {
      message: "POLAR_CLIENT_ID e POLAR_CLIENT_SECRET non configurati",
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "invalid_body", { message: "JSON non valido" });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "missing_fields", {
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const { code, redirectUri } = parsed.data;

  try {
    const token = await exchangePolarCode(
      code,
      redirectUri ?? POLAR_REDIRECT_URI,
      env
    );
    // Passthrough della response Polar così com'è.
    return jsonOk({
      access_token: token.access_token,
      token_type: token.token_type,
      expires_in: token.expires_in,
      x_user_id: token.x_user_id,
    });
  } catch (err) {
    if (err instanceof PolarApiError) {
      return jsonError(502, "polar_api_error", {
        polarStatus: err.polarStatus,
        polarBody: err.polarBody,
      });
    }
    console.error("[polar/exchange] unexpected error:", err);
    return jsonError(500, "server_error");
  }
}

function jsonError(status: number, code: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({ error: code, ...(details ? { details } : {}) }),
    { status, headers: { "content-type": "application/json" } }
  );
}

function jsonOk(body: object): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
