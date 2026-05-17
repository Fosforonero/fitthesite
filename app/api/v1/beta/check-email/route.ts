/**
 * GET /api/v1/beta/check-email?email=foo@bar.com[&field=google_email]
 *
 * Verifica live durante la digitazione del form /beta:
 *   - `exists`: true se email già in beta_signups (sia email primary che google_email)
 *   - `disposable`: true se il dominio è in DISPOSABLE_EMAIL_DOMAINS
 *
 * Endpoint anonimo, GET (idempotente). Rate-limit basico per-IP.
 *
 * Risposte:
 *   200 { exists: bool, disposable: bool, valid: bool }
 *   400 { error: "missing_email" | "invalid_email" }
 *   403 { error: "forbidden_origin" }
 *   429 { error: "too_many_requests" }
 *   500 { error: "server_error" }
 */
import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api/auth-helpers";
import { isDisposableEmail } from "@/lib/api/disposable-emails";

// Rate limit più permissivo del signup (utenti digitano tante volte mentre
// compilano il form). 30 lookup/2min per IP.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000;
const ipHits = new Map<string, number[]>();

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const hits = ipHits.get(ipHash) ?? [];
  const recent = hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    ipHits.set(ipHash, recent);
    return false;
  }
  recent.push(now);
  ipHits.set(ipHash, recent);
  return true;
}

function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

function hashIp(ip: string | null): string {
  if (!ip) return "anon";
  return createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? "fitmesh-beta"))
    .digest("hex")
    .slice(0, 16);
}

function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (!origin) return false;
  const allowed = [
    "https://www.fitmesh.fit",
    "https://fitmesh.fit",
    "http://localhost",
    "http://127.0.0.1",
  ];
  return allowed.some((a) => origin.startsWith(a)) || origin.includes(".vercel.app");
}

const emailSchema = z.string().email().max(120);

export async function GET(req: Request) {
  if (!isAllowedOrigin(req)) {
    return jsonError(403, "forbidden_origin");
  }

  const ipHash = hashIp(clientIp(req));
  if (!checkRateLimit(ipHash)) {
    return jsonError(429, "too_many_requests");
  }

  const url = new URL(req.url);
  const emailRaw = url.searchParams.get("email");
  const field = url.searchParams.get("field") ?? "email"; // "email" | "google_email"
  if (!emailRaw) return jsonError(400, "missing_email");

  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) {
    // Email syntattica non valida → 200 con valid:false per UX (no toast errore)
    return jsonOk({ valid: false, exists: false, disposable: false });
  }
  const email = parsed.data.toLowerCase().trim();
  const disposable = isDisposableEmail(email);

  // Se è disposable, non sprecare query DB
  if (disposable) {
    return jsonOk({ valid: true, exists: false, disposable: true });
  }

  // Lookup esistenza. Usa service_role se disponibile (server-only, bypass RLS
  // → permette SELECT su beta_signups senza esporre policy permissive ad anon).
  // Fallback: anon + RLS — se non c'è policy SELECT, ritorna {exists:false}
  // graceful; il signup endpoint cattura comunque i duplicati via UNIQUE.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anon;
  if (!supabaseUrl || !key) return jsonError(500, "supabase_env_misconfigured");

  const supabase = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Cerca su entrambe le colonne (email primary + google_email).
  // L'utente potrebbe digitare la sua email in uno qualunque dei due campi
  // e averla già usata nell'altro — vogliamo segnalare il duplicato.
  const { data, error } = await supabase
    .from("beta_signups")
    .select("id")
    .or(`email.eq.${email},google_email.eq.${email}`)
    .limit(1);

  if (error) {
    console.error("[check-email] supabase error", {
      field,
      error: error.message,
    });
    // Degrade graceful: non bloccare l'UX, il signup gestirà comunque il dup
    return jsonOk({ valid: true, exists: false, disposable: false });
  }

  return jsonOk({
    valid: true,
    exists: (data?.length ?? 0) > 0,
    disposable: false,
  });
}
