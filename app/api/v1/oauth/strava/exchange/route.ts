/**
 * POST /api/v1/oauth/strava/exchange — token exchange server-side.
 *
 * L'app Flutter manda il `code` ricevuto dal browser Strava; noi usiamo
 * STRAVA_CLIENT_SECRET (env Vercel) per chiamare Strava server-side e
 * ritornare access_token + refresh_token all'app.
 *
 * Il secret NON è mai nel binary Flutter — vedi lib/oauth/strava-backend.ts
 * Fix audit: secret era estraibile con `strings` su release AAB (v88 e precedenti).
 *
 * Body (JSON):
 *   { code: string, redirect_uri: string, code_verifier?: string }
 *
 * Risposte:
 *   200 { access_token, refresh_token, expires_at, athlete? }
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
  exchangeStravaCode,
  extractIp,
} from "@/lib/oauth/strava-backend";

const bodySchema = z.object({
  code: z.string().min(1),
  redirect_uri: z.string().url(),
  // code_verifier è opzionale (Strava non supporta PKCE ufficialmente,
  // ma lo passiamo se presente per compatibilità futura).
  code_verifier: z.string().optional(),
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

  const { code, redirect_uri } = parsed.data;

  try {
    const stravaResp = await exchangeStravaCode(code, redirect_uri);
    return jsonOk({
      access_token: stravaResp.access_token,
      refresh_token: stravaResp.refresh_token,
      expires_at: stravaResp.expires_at,
      token_type: stravaResp.token_type,
      ...(stravaResp.athlete ? { athlete: stravaResp.athlete } : {}),
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
    console.error("[strava/exchange] unexpected error:", err);
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
