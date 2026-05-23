import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { betaWelcomeEmail } from "@/lib/email/templates/beta-welcome";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sb = SupabaseClient;

export async function GET(req: Request) {
  // Auth: Vercel cron injects Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Cast as Sb perche' database.types stale non include beta_signups columns
  // (founder_number, welcome_sent_at). Pattern coerente con altri route.
  const sb = createAdminClient() as unknown as Sb;

  // Query pending signups that haven't received a welcome email yet.
  // Rate-limited to 50 per tick so we don't blow up Resend's free tier.
  const { data: pendings, error: qErr } = await sb
    .from("beta_signups")
    .select("id, email, founder_number, status, created_at")
    .is("welcome_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(50);

  if (qErr) {
    return NextResponse.json(
      { error: "query_failed", details: qErr.message },
      { status: 500 },
    );
  }

  if (!pendings || pendings.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0 });
  }

  let sent = 0;
  let failed = 0;
  const failures: { email: string; error: string }[] = [];

  for (const row of pendings) {
    // Default to "it" — primary target market. When a locale field is added
    // to beta_signups, replace this with row.locale.
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
      // Mark as sent — only on success so failed sends are retried next tick.
      await sb
        .from("beta_signups")
        .update({ welcome_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } else {
      failed++;
      failures.push({ email: row.email, error: result.error ?? "unknown" });
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    total: pendings.length,
    ...(failed > 0 ? { failures } : {}),
  });
}
