/**
 * POST /api/v1/oauth/wahoo/refresh — token refresh server-side.
 *
 * Body: { refresh_token: string }
 * Risposte: 200 { access_token, refresh_token, expires_at, token_type }
 *           400 missing_fields | invalid_body
 *           429 rate_limit_exceeded
 *           502 api_error
 *           500 server_error | server_misconfigured
 */
export const dynamic = "force-dynamic";

import { z } from "zod";
import {
  WahooApiError,
  checkRateLimit,
  extractIp,
  refreshWahooToken,
} from "@/lib/oauth/wahoo-backend";

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

  const { refresh_token } = parsed.data;

  try {
    const resp = await refreshWahooToken(refresh_token);
    return jsonOk({
      access_token: resp.access_token,
      refresh_token: resp.refresh_token,
      expires_at: resp.expires_at,
      token_type: resp.token_type,
    });
  } catch (err) {
    if (err instanceof WahooApiError) {
      return jsonError(502, "api_error", {
        apiStatus: err.apiStatus,
        apiBody: err.apiBody,
      });
    }
    if (err instanceof Error && err.message.includes("env Vercel")) {
      return jsonError(500, "server_misconfigured", { message: err.message });
    }
    console.error("[wahoo/refresh] unexpected error:", err);
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
