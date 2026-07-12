/**
 * POST /api/v1/beta/signup — waitlist "avvisami al lancio iOS" (non grant
 * founder: quello è il trigger Supabase handle_new_founder(), primi 1000 account).
 *
 * Endpoint anonimo: usa anon key Supabase + RLS policy "anon can insert signup".
 * Approvazione manuale dall'admin via Supabase dashboard (per ora).
 *
 * Sicurezza (2026 baseline):
 *   - Origin / Referer check (anti-CSRF same-origin)
 *   - Honeypot field `_hp` (deve essere vuoto)
 *   - Timing check `_form_loaded_at` (form compilato in <1.5s = bot)
 *   - Rate limit in-memory per-IP (5 richieste / 10 minuti)
 *   - Zod strict validation (email, length, enum)
 *   - Hash dell'IP prima di salvarlo (privacy: niente IP raw nel DB)
 *
 * Body:
 *   {
 *     email, google_email?, reason?, referral?, device_brand?,
 *     _hp?, _form_loaded_at?
 *   }
 *
 * Risposte:
 *   201 { id }
 *   400 invalid_payload
 *   403 forbidden_origin | bot_detected
 *   409 already_signed_up
 *   429 too_many_requests
 *   500 server_error
 */
import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

// ── Validazione body ────────────────────────────────────────────────────
const payloadSchema = z.object({
  email: z
    .string()
    .email()
    .max(120)
    .transform((s) => s.toLowerCase().trim()),
  google_email: z
    .string()
    .email()
    .max(120)
    .transform((s) => s.toLowerCase().trim())
    .nullish(),
  reason: z.string().max(500).nullish(),
  referral: z
    .enum(["instagram", "linkedin", "friend", "search", "press", "other"])
    .nullish(),
  device_brand: z.string().max(40).nullish(),
  // Anti-bot fields (opzionali per backward-compat, ma se presenti vengono validati)
  _hp: z.string().max(100).optional(),
  _form_loaded_at: z.number().int().optional(),
});

// ── Rate limit in-memory (per-IP) ───────────────────────────────────────
// Production scale: sostituire con Upstash Redis o Vercel KV.
// Per ora /beta ha traffico basso → in-memory è sufficiente.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minuti
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

// ── Helpers ─────────────────────────────────────────────────────────────
function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

/** SHA-256 dell'IP (16 char prefix) per rate-limit senza salvare IP raw. */
function hashIp(ip: string | null): string {
  if (!ip) return "anon";
  return createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? "fitmesh-beta"))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Anti-CSRF same-origin check: l'Origin (o Referer fallback) deve matchare
 * uno dei domini consentiti. In dev (localhost) si rilassa.
 */
function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (!origin) return false;
  const allowed = [
    "https://www.fitmesh.fit",
    "https://fitmesh.fit",
    // Preview Vercel + dev
    "https://fitthesite",
    "http://localhost",
    "http://127.0.0.1",
  ];
  return allowed.some((a) => origin.startsWith(a)) || origin.includes(".vercel.app");
}

export async function POST(req: Request) {
  // ── 1. Origin / CSRF check ──────────────────────────────────────────
  if (!isAllowedOrigin(req)) {
    return jsonError(403, "forbidden_origin");
  }

  // ── 2. Parse + validate ─────────────────────────────────────────────
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

  // ── 3. Anti-bot: honeypot ───────────────────────────────────────────
  if (p._hp && p._hp.length > 0) {
    return jsonError(403, "bot_detected");
  }

  // ── 4. Anti-bot: timing (form compilato in <1.5s = bot) ─────────────
  if (p._form_loaded_at != null) {
    const elapsed = Date.now() - p._form_loaded_at;
    // Tolleranza: troppi pochi = bot, troppi tanti (>24h) = sessione vecchia/sospetta
    if (elapsed < 1500 || elapsed > 24 * 60 * 60 * 1000) {
      return jsonError(403, "bot_detected");
    }
  }

  // ── 5. Rate limit per-IP ────────────────────────────────────────────
  const ipRaw = clientIp(req);
  const ipHash = hashIp(ipRaw);
  if (!checkRateLimit(ipHash)) {
    return jsonError(429, "too_many_requests");
  }

  // ── 6. Insert su Supabase ───────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return jsonError(500, "supabase_env_misconfigured");

  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  // NB: no .select() — anon non ha SELECT policy (l'INSERT è permesso ma il
  // re-read postgrest fallirebbe con "row-level security policy violation".
  // L'id non serve al client; per l'admin lo recupera da Supabase dashboard.
  const { error } = await supabase
    .from("beta_signups")
    .insert({
      email: p.email,
      google_email: p.google_email ?? null,
      reason: p.reason ?? null,
      referral: p.referral ?? null,
      device_brand: p.device_brand ?? null,
      // Salviamo solo l'hash, non l'IP raw (GDPR data minimization)
      signup_ip: ipHash,
      signup_ua: ua,
    });

  if (error) {
    if (error.code === "23505") return jsonError(409, "already_signed_up");
    return jsonError(500, "insert_failed", error.message);
  }

  return jsonOk({ ok: true }, 201);
}
