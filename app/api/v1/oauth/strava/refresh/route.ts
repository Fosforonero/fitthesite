/**
 * POST /api/v1/oauth/strava/refresh — token refresh server-side.
 *
 * L'app Flutter manda il refresh_token scaduto; noi usiamo
 * STRAVA_CLIENT_SECRET (env Vercel) per ottenere nuovi token da Strava
 * e li ritorniamo all'app.
 *
 * Il secret NON è mai nel binary Flutter — vedi lib/oauth/strava-backend.ts
 *
 * Body (JSON):
 *   { refresh_token: string }
 *
 * Risposte:
 *   200 { access_token, refresh_token, expires_at }
 *   400 missing_fields | invalid_body
 *   429 rate_limit_exceeded
 *   502 strava_api_error (con stravaStatus + stravaBody)
 *   500 server_error
 */
export const dynamic = "force-dynamic";

import { z } from "zod";

import {
  StravaApiError,
  checkRateLimit,
  extractIp,
  refreshStravaToken,
} from "@/lib/oauth/strava-backend";

const bodySchema = z.object({
  refresh_token: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  // Rate limit per IP
  const ip = extractIp(req);
  if (!checkRateLimit(ip)) {
    return jsonError(429, "rate_limit_exceeded", {
      message: "Troppi tentativi, riprova tra un minuto",
    });
  }

  // Parse + validazione body
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
    const stravaResp = await refreshStravaToken(refresh_token);
    return jsonOk({
      access_token: stravaResp.access_token,
      refresh_token: stravaResp.refresh_token,
      expires_at: stravaResp.expires_at,
      token_type: stravaResp.token_type,
    });
  } catch (err) {
    if (err instanceof StravaApiError) {
      return jsonError(502, "strava_api_error", {
        stravaStatus: err.stravaStatus,
        stravaBody: err.stravaBody,
      });
    }
    if (err instanceof Error && err.message.includes("env Vercel")) {
      return jsonError(500, "server_misconfigured", {
        message: err.message,
      });
    }
    console.error("[strava/refresh] unexpected error:", err);
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
