const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";

export function founderReviewEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Thank you for being a FitMesh founder 🙏";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e4e4e7;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #27272a;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#00c9a7,#0ea5e9);padding:32px 40px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:rgba(0,0,0,0.6);text-transform:uppercase;letter-spacing:1px;">FitMesh Founders</p>
        <h1 style="margin:8px 0 0;font-size:26px;font-weight:700;color:#000;line-height:1.2;">You're one of the first 1,000. Thank you. 🎉</h1>
      </td></tr>

      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#e4e4e7;">
          We heard the feedback loud and clear. There was a bug in our backend where new accounts were being granted <strong style="color:#fff;">1 year of Pro</strong> instead of the intended <strong style="color:#00c9a7;">lifetime access</strong>.
        </p>

        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#e4e4e7;">
          That's now fixed. <strong style="color:#fff;">Your account has already been updated to lifetime — no action needed.</strong> You'll never see an expiry date on your Pro status.
        </p>

        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#e4e4e7;">
          We're building FitMesh to be the best wearable health dashboard on Android, and you joined before anyone else. That genuinely means everything to us.
        </p>

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
        <p style="margin:8px 0 0;font-size:14px;color:#71717a;">— Matteo & the FitMesh team</p>
      </td></tr>

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

  const text = `Thank you for being a FitMesh founder 🙏

We heard the feedback. There was a bug where new accounts were granted 1 year of Pro instead of the intended lifetime access.

That's now fixed. Your account has already been updated to lifetime — no action needed.

We're building FitMesh to be the best wearable health dashboard on Android, and you joined before anyone else.

If you've downloaded the app and have 60 seconds, leaving a review on Google Play would help us enormously:
${PLAY_STORE_URL}

Thank you for being here from the beginning.
— Matteo & the FitMesh team

---
You're receiving this because you're one of the first 1,000 FitMesh founder members.
fitmesh.fit`;

  return { subject, html, text };
}
