import crypto from "node:crypto";

/**
 * Verifica di autenticità dei webhook Suunto (audit P1, 2026-06-16).
 *
 * I 4 webhook (activity/recovery/sleep/workout) sono pubblici. Per evitare che
 * diventino un vettore di iniezione dati quando verrà aggiunto il data-processing,
 * QUALSIASI scrittura DB deve stare dentro `if (verifySuuntoWebhook(...).ok)`.
 *
 * Schema: HMAC-SHA256 del raw body con `SUUNTO_WEBHOOK_SECRET`, confrontato
 * (timing-safe) con l'header firma. In fallback accetta un secret condiviso
 * passato come header o query param (utile se Suunto non firma il body: si
 * registra la callback URL col secret). Confermare l'header esatto quando si
 * collega davvero Suunto.
 *
 * Se il secret non è configurato → `ok:false` (`not_configured`): gli stub
 * rispondono 200 lo stesso (Suunto richiede 200) ma NON processano nulla.
 */
const SIGNATURE_HEADERS = ["x-suunto-signature", "x-signature", "x-webhook-signature"];
const SHARED_HEADERS = ["x-fm-webhook-secret", "x-webhook-secret"];

export type SuuntoVerifyResult = { ok: boolean; reason: string };

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifySuuntoWebhook(req: Request, rawBody: string): SuuntoVerifyResult {
  const secret = process.env.SUUNTO_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "not_configured" };

  // 1) HMAC-SHA256 del body (hex o base64) contro l'header firma.
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

  // 2) Fallback: secret condiviso via header o query (?s=).
  const shared =
    SHARED_HEADERS.map((h) => req.headers.get(h)).find(Boolean) ??
    new URL(req.url).searchParams.get("s");
  if (shared && timingSafeEqualStr(shared, secret)) {
    return { ok: true, reason: "shared_secret" };
  }

  return { ok: false, reason: "no_valid_credential" };
}
