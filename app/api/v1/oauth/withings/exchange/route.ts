/**
 * POST /api/v1/oauth/withings/exchange — token exchange server-side.
 *
 * L'app Flutter manda il `code` ricevuto dal flow Withings; noi usiamo
 * WITHINGS_CLIENT_SECRET (env Vercel) per chiamare Withings server-side e
 * ritorniamo la response wrappata `{ status, body }` COSÌ COM'È — il provider
 * Dart (withings_provider.dart) fa già _unwrapToken.
 *
 * Il secret NON è mai nel binary Flutter — vedi lib/oauth/withings-backend.ts
 *
 * Body (JSON):
 *   { code: string, redirectUri?: string }
 *
 * Risposte:
 *   200 { status: 0, body: { access_token, refresh_token, expires_in, ... } }
 *   400 missing_fields | invalid_body
 *   429 rate_limit_exceeded
 *   502 withings_api_error
 *   503 provider_not_configured
 *   500 server_error
 */
export const dynamic = "force-dynamic";

import { z } from "zod";

import {
  WITHINGS_REDIRECT_URI,
  WithingsApiError,
  checkRateLimit,
  exchangeWithingsCode,
  extractIp,
  getWithingsEnv,
} from "@/lib/oauth/withings-backend";

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

  const env = getWithingsEnv();
  if (!env) {
    return jsonError(503, "provider_not_configured", {
      message: "WITHINGS_CLIENT_ID e WITHINGS_CLIENT_SECRET non configurati",
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
    const token = await exchangeWithingsCode(
      code,
      redirectUri ?? WITHINGS_REDIRECT_URI,
      env
    );
    // Passthrough wrappato { status, body } — l'app fa _unwrapToken.
    return jsonOk(token);
  } catch (err) {
    if (err instanceof WithingsApiError) {
      return jsonError(502, "withings_api_error", {
        withingsStatus: err.withingsStatus,
        withingsBody: err.withingsBody,
      });
    }
    console.error("[withings/exchange] unexpected error:", err);
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
