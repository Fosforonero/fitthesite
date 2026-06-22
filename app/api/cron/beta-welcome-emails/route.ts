import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { betaWelcomeEmail } from "@/lib/email/templates/beta-welcome";
import { founderReviewEmail } from "@/lib/email/templates/founder-review";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sb = SupabaseClient;

// Resend free tier rate limit: 5 req/sec. Throttle a 4 req/sec con sleep
// 250ms tra invii consecutivi. Senza, in burst > 5 destinatari ottenevamo
// 429 rate_limit_exceeded (visto al primo run cron live: 1/17 fallita).
const RESEND_RATE_DELAY_MS = 250;
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function GET(req: Request) {
  // Auth: Vercel cron injects Authorization: Bearer <CRON_SECRET>.
  // Fail-closed: senza secret configurato l'endpoint resta inaccessibile
  // (manda email via Resend + scrive con service_role).
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_misconfigured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Cast as Sb perche' database.types stale non include colonne aggiunte dopo
  // la generazione dei tipi (founder_number, welcome_sent_at, review_email_sent_at).
  const sb = createAdminClient() as unknown as Sb;

  // ── Phase 1: beta welcome emails ──────────────────────────────────────────

  const { data: pendings } = await sb
    .from("beta_signups")
    .select("id, email, founder_number, status, created_at")
    .is("welcome_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(50);

  let welcomeSent = 0;
  let welcomeFailed = 0;
  const welcomeFailures: { email: string; error: string }[] = [];

  for (let i = 0; i < (pendings ?? []).length; i++) {
    const row = pendings![i]!;
    const locale: "it" | "en" = "it";

    const template = betaWelcomeEmail({
      locale,
      founderNumber: row.founder_number,
    });

    const result = await sendEmail({
      to: row.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.ok) {
      await sb
        .from("beta_signups")
        .update({ welcome_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      welcomeSent++;
    } else {
      welcomeFailed++;
      welcomeFailures.push({ email: row.email, error: result.error ?? "unknown" });
    }

    if (i < pendings!.length - 1) await sleep(RESEND_RATE_DELAY_MS);
  }

  // ── Phase 2: founder review emails (piggyback) ────────────────────────────
  // Hobby plan limita a 2 cron/project (già al limite con welcome-emails +
  // indexnow-daily), quindi riusiamo questo slot daily per mandare anche la
  // mail di review ai founder che non l'hanno ancora ricevuta.

  const { data: founders } = await sb
    .from("user_roles")
    .select("user_id, profiles!inner(email)")
    .eq("note", "founder-launch")
    .is("review_email_sent_at", null)
    .limit(30); // batch conservativo: lasciare headroom per le welcome

  let reviewSent = 0;
  let reviewFailed = 0;
  const reviewFailures: { email: string; error: string }[] = [];

  for (let i = 0; i < (founders ?? []).length; i++) {
    const row = founders![i]!;
    const profile = row.profiles as unknown as { email: string };
    const email = profile.email;

    const template = founderReviewEmail();

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.ok) {
      await sb
        .from("user_roles")
        .update({ review_email_sent_at: new Date().toISOString() })
        .eq("user_id", row.user_id)
        .eq("note", "founder-launch");
      reviewSent++;
    } else {
      reviewFailed++;
      reviewFailures.push({ email, error: result.error ?? "unknown" });
    }

    if (i < founders!.length - 1) await sleep(RESEND_RATE_DELAY_MS);
  }

  // ── Piggyback: cleanup rate_limit_buckets vecchi (>1h) ───────────────────
  let rateLimitRowsDeleted: number | null = null;
  try {
    const { data: cleanupResult } = await sb.rpc("rate_limit_cleanup");
    if (typeof cleanupResult === "number") {
      rateLimitRowsDeleted = cleanupResult;
    }
  } catch {
    // Non bloccare la cron per cleanup failure — best-effort.
  }

  return NextResponse.json({
    ok: true,
    welcome: { sent: welcomeSent, failed: welcomeFailed, total: pendings?.length ?? 0 },
    review: { sent: reviewSent, failed: reviewFailed, total: founders?.length ?? 0 },
    rateLimitRowsDeleted,
    ...(welcomeFailed > 0 ? { welcomeFailures } : {}),
    ...(reviewFailed > 0 ? { reviewFailures } : {}),
  });
}
