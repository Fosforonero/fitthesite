import crypto from "node:crypto";

/**
 * Verifica di autenticità dei webhook (ping) Garmin Health/Activity API.
 *
 * SCAFFOLD (2026-06-18): i webhook sono pubblici. QUALSIASI scrittura DB deve
 * stare dentro `if (verifyGarminWebhook(...).ok)`. Finché GARMIN_WEBHOOK_SECRET
 * non è configurato su Vercel → `ok:false` (`not_configured`): gli stub
 * rispondono 200 (Garmin disabilita le notifiche se non riceve 200) ma NON
 * processano nulla.
 *
 * Garmin non firma sempre il body: si registra la callback URL con un secret
 * condiviso (header o query `?s=`). Se in futuro Garmin firma il body, è già
 * gestito l'HMAC-SHA256. Confermare l'header esatto dal portal approvato.
 */
const SIGNATURE_HEADERS = ["x-garmin-signature", "x-signature", "x-webhook-signature"];
const SHARED_HEADERS = ["x-fm-webhook-secret", "x-webhook-secret"];

export type GarminVerifyResult = { ok: boolean; reason: string };

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyGarminWebhook(req: Request, rawBody: string): GarminVerifyResult {
  const secret = process.env.GARMIN_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "not_configured" };

  const sigHeader = SIGNATURE_HEADERS.map((h) => req.headers.get(h)).find(Boolean);
  if (sigHeader) {
    const hex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    const b64 = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
    const provided = sigHeader.replace(/^sha256=/i, "").trim();
    if (timingSafeEqualStr(provided, hex) || timingSafeEqualStr(provided, b64)) {
      return { ok: true, reason: "hmac" };
    }
    return { ok: false, reason: "hmac_mismatch" };
  }

  const shared =
    SHARED_HEADERS.map((h) => req.headers.get(h)).find(Boolean) ??
    new URL(req.url).searchParams.get("s");
  if (shared && timingSafeEqualStr(shared, secret)) {
    return { ok: true, reason: "shared_secret" };
  }

  return { ok: false, reason: "no_valid_credential" };
}
