/**
 * POST /api/v1/beta/signup — registrazione founder Beta (max 100 posti).
 *
 * Endpoint anonimo: usa anon key Supabase + RLS policy "anon can insert signup".
 * Approvazione manuale dall'admin via Supabase dashboard (per ora, UI in v3.2).
 *
 * Body:
 *   { email, google_email?, reason?, referral?, device_brand? }
 *
 * Risposte:
 *   201 { id }
 *   400 invalid_payload
 *   409 already_signed_up (email già in lista)
 *   429 too_many_requests (rate limit IP, basico)
 *   500 server_error
 */
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api/auth-helpers";

const payloadSchema = z.object({
  email: z.string().email().max(120).transform((s) => s.toLowerCase().trim()),
  google_email: z
    .string()
    .email()
    .max(120)
    .transform((s) => s.toLowerCase().trim())
    .nullish(),
  reason: z.string().max(500).nullish(),
  referral: z.enum(["instagram", "linkedin", "friend", "search", "press", "other"]).nullish(),
  device_brand: z.string().max(40).nullish(),
});

function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: Request) {
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return jsonError(500, "supabase_env_misconfigured");

  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ip = clientIp(req);
  const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const { data, error } = await supabase
    .from("beta_signups")
    .insert({
      email: p.email,
      google_email: p.google_email ?? null,
      reason: p.reason ?? null,
      referral: p.referral ?? null,
      device_brand: p.device_brand ?? null,
      signup_ip: ip,
      signup_ua: ua,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return jsonError(409, "already_signed_up");
    return jsonError(500, "insert_failed", error.message);
  }

  return jsonOk({ id: (data as { id: string } | null)?.id }, 201);
}
