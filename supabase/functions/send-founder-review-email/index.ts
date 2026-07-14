import { createClient } from "jsr:@supabase/supabase-js@2";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";

const SUBJECT = "Thank you for being a FitMesh founder 🙏";

function buildHtml(email: string): string {
  const firstName = email.split("@")[0].split(".")[0];
  const name =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e4e4e7;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #27272a;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
      <!-- Header gradient -->
      <tr><td style="background:linear-gradient(135deg,#00c9a7,#0ea5e9);padding:32px 40px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:rgba(0,0,0,0.6);text-transform:uppercase;letter-spacing:1px;">FitMesh Founders</p>
        <h1 style="margin:8px 0 0;font-size:26px;font-weight:700;color:#000;line-height:1.2;">You're one of the first 1,000. Thank you. 🎉</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#a1a1aa;">Hi ${name},</p>

        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#e4e4e7;">
          We heard the feedback loud and clear. There was a bug in our backend where new accounts were being granted <strong style="color:#fff;">1 year of Pro</strong> instead of the intended <strong style="color:#00c9a7;">lifetime access</strong>.
        </p>

        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#e4e4e7;">
          That's now fixed. <strong style="color:#fff;">Your account has already been updated to lifetime — no action needed.</strong> You'll never see an expiry date on your Pro status.
        </p>

        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#e4e4e7;">
          We're building FitMesh to be the best wearable health dashboard on Android, and you joined before anyone else. That genuinely means everything to us.
        </p>

        <!-- CTA box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1e;border:1px solid #27272a;border-radius:12px;margin-bottom:28px;">
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.8px;">One small favour</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#e4e4e7;">If you've downloaded the app and have 60 seconds, leaving a review on Google Play would help us more than you know. It's the single biggest thing that helps other people discover FitMesh.</p>
            <a href="${PLAY_STORE_URL}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#00c9a7,#0ea5e9);color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:50px;">
              ⭐ Leave a Google Play review
            </a>
          </td></tr>
        </table>

        <p style="margin:0;font-size:14px;line-height:1.6;color:#71717a;">Thank you for being here from the beginning.</p>
        <p style="margin:8px 0 0;font-size:14px;color:#71717a;">— Matteo &amp; the FitMesh team</p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 40px;border-top:1px solid #27272a;">
        <p style="margin:0;font-size:12px;color:#52525b;line-height:1.5;">
          You're receiving this because you're one of the first 1,000 FitMesh founder members.<br/>
          <a href="https://fitmesh.fit" style="color:#52525b;">fitmesh.fit</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  // Fail-closed: senza CRON_SECRET configurato l'endpoint resta inaccessibile.
  // Il controllo avviene prima di creare il client Supabase, interrogare
  // user_roles o contattare Resend.
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    console.error("CRON_SECRET is not configured");
    return new Response("Service unavailable", { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY")!;
  const fromEmail =
    Deno.env.get("RESEND_FROM_EMAIL") ?? "FitMesh <team@fitmesh.fit>";

  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Founder senza email di review ancora inviata
  const { data: founders, error } = await supabase
    .from("user_roles")
    .select("user_id, profiles!inner(email)")
    .eq("note", "founder-launch")
    .is("review_email_sent_at", null)
    .limit(50); // batch sicuro per ogni run

  if (error) {
    console.error("DB error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (!founders || founders.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: "No pending founders" }), {
      headers: { "content-type": "application/json" },
    });
  }

  let sent = 0;
  let failedCount = 0;

  for (const row of founders) {
    const profile = row.profiles as { email: string };
    const email = profile.email;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: SUBJECT,
          html: buildHtml(email),
        }),
      });

      if (!res.ok) {
        // Solo dati tecnici aggregati nei log: mai email, user_id o il body
        // grezzo del provider (privacy).
        console.error("Founder review email provider request failed", {
          status: res.status,
        });
        failedCount++;
        continue;
      }

      // Marca come inviata
      await supabase
        .from("user_roles")
        .update({ review_email_sent_at: new Date().toISOString() })
        .eq("user_id", row.user_id)
        .eq("note", "founder-launch");

      sent++;
    } catch (err) {
      // Solo il tipo di errore, mai l'eccezione completa (potrebbe contenere
      // email o altri dati personali).
      console.error("Founder review email send failed", {
        errorType: err instanceof Error ? err.name : "unknown",
      });
      failedCount++;
    }
  }

  // Solo contatori aggregati nella response: mai email o identificatori
  // per-destinatario (privacy).
  return new Response(
    JSON.stringify({ sent, failed: failedCount }),
    { headers: { "content-type": "application/json" } }
  );
});
