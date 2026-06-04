/**
 * POST /api/v1/oauth/suunto/refresh — token refresh server-side.
 *
 * L'app Flutter manda il refresh_token scaduto; noi usiamo
 * SUUNTO_CLIENT_SECRET (env Vercel) per ottenere nuovi token da Suunto
 * e li ritorniamo all'app.
 *
 * Body (JSON):
 *   { refresh_token: string }
 *
 * Risposte:
 *   200 { access_token, refresh_token, expires_at_ms, token_type }
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
  extractIp,
  refreshSuuntoToken,
} from "@/lib/oauth/suunto-backend";

const bodySchema = z.object({
  refresh_token: z.string().min(1),
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
    const token = await refreshSuuntoToken(parsed.data.refresh_token);
    return jsonOk({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at,
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
    console.error("[suunto/refresh] unexpected error:", err);
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
