/**
 * POST /api/v1/beta/waitlist — registrazione waitlist beta.
 *
 * Attivo quando i 100 posti founder (beta_signups) sono pieni. Form più
 * leggero: solo email + locale + referral opzionale.
 *
 * Pattern di sicurezza identico a /api/v1/beta/signup:
 *   - Origin / Referer check (anti-CSRF)
 *   - Honeypot field `_hp`
 *   - Timing check `_form_loaded_at` (form compilato in <1.5s = bot)
 *   - Rate limit in-memory per-IP (5 / 10 minuti)
 *   - Zod strict validation
 *   - SHA-256 hash dell'IP (GDPR: niente IP raw)
 *
 * Risposte:
 *   201 { id }
 *   400 invalid_payload
 *   403 forbidden_origin | bot_detected
 *   409 already_on_waitlist
 *   429 too_many_requests
 *   500 server_error
 */
import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

const payloadSchema = z.object({
  email: z
    .string()
    .email()
    .max(120)
    .transform((s) => s.toLowerCase().trim()),
  locale: z.enum(["it", "en"]).default("it"),
  referral: z
    .enum(["instagram", "linkedin", "friend", "search", "press", "other"])
    .nullish(),
  _hp: z.string().max(100).optional(),
  _form_loaded_at: z.number().int().optional(),
});

// Rate limit in-memory (per-IP). Stesso pattern del signup endpoint.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
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
    "https://fitthesite",
    "http://localhost",
    "http://127.0.0.1",
  ];
  return allowed.some((a) => origin.startsWith(a)) || origin.includes(".vercel.app");
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return jsonError(403, "forbidden_origin");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid_payload", parsed.error.flatten());
  }
  const p = parsed.data;

  if (p._hp && p._hp.length > 0) {
    return jsonError(403, "bot_detected");
  }
  if (p._form_loaded_at != null) {
    const elapsed = Date.now() - p._form_loaded_at;
    if (elapsed < 1500 || elapsed > 24 * 60 * 60 * 1000) {
      return jsonError(403, "bot_detected");
    }
  }

  const ipHash = hashIp(clientIp(req));
  if (!checkRateLimit(ipHash)) {
    return jsonError(429, "too_many_requests");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return jsonError(500, "supabase_env_misconfigured");

  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const { data, error } = await supabase
    .from("beta_waitlist")
    .insert({
      email: p.email,
      locale: p.locale,
      referral: p.referral ?? null,
      signup_ip: ipHash,
      signup_ua: ua,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return jsonError(409, "already_on_waitlist");
    return jsonError(500, "insert_failed", error.message);
  }

  return jsonOk({ id: (data as { id: string } | null)?.id }, 201);
}
