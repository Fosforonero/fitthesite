/**
 * POST /api/v1/oauth/suunto/exchange — token exchange server-side.
 *
 * L'app Flutter manda il `code` ricevuto via deep link; noi usiamo
 * SUUNTO_CLIENT_SECRET (env Vercel) per chiamare Suunto server-side
 * con HTTP Basic Auth e ritorniamo access_token + refresh_token all'app.
 *
 * Il secret NON è mai nel binary Flutter.
 *
 * Body (JSON):
 *   { code: string }
 *
 * Risposte:
 *   200 { access_token, refresh_token, expires_at, token_type }
 *   400 missing_fields | invalid_body
 *   429 rate_limit_exceeded
 *   502 suunto_api_error
 *   500 server_error | server_misconfigured
 */
export const dynamic = "force-dynamic";

import { z } from "zod";

import {
  SuuntoApiError,
  checkRateLimit,
  exchangeSuuntoCode,
  extractIp,
} from "@/lib/oauth/suunto-backend";

const bodySchema = z.object({
  code: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  const ip = extractIp(req);
  if (!checkRateLimit(ip)) {
    return jsonError(429, "rate_limit_exceeded", {
      message: "Troppi tentativi, riprova tra un minuto",
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

  try {
    const token = await exchangeSuuntoCode(parsed.data.code);
    return jsonOk({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at,
      // OAuthToken.fromJson legge `expires_at_ms` (ms) o `expires_in` (sec).
      // Passiamo `expires_at_ms` convertendo da epoch seconds.
      expires_at_ms: token.expires_at * 1000,
      token_type: token.token_type,
    });
  } catch (err) {
    if (err instanceof SuuntoApiError) {
      return jsonError(502, "suunto_api_error", {
        suuntoStatus: err.suuntoStatus,
        suuntoBody: err.suuntoBody,
      });
    }
    if (err instanceof Error && err.message.includes("env Vercel")) {
      return jsonError(500, "server_misconfigured", { message: err.message });
    }
    console.error("[suunto/exchange] unexpected error:", err);
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
