/**
 * Notifica admin quando la Beta raggiunge il limite (100 founder).
 *
 * Idempotente via `system_notifications.key = 'beta_round_1_full'`:
 * `INSERT ... ON CONFLICT DO NOTHING` ritorna riga solo la prima volta.
 *
 * Self-attivante: se manca RESEND_API_KEY, logga e no-op (la migration
 * + il marker DB funzionano comunque, l'utente puo' aggiungere la key
 * a Vercel env in qualsiasi momento e riattivare l'invio per il prossimo
 * "primo raggiungimento" — tipicamente il prossimo round).
 */
import { Resend } from "resend";

import { createAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_KEY = "beta_round_1_full";
const TARGET_SPOTS = 100;
const ADMIN_EMAIL = "mat.pizzi@gmail.com";

type SpotsResult = number | null;

/**
 * Da chiamare DOPO un insert riuscito in beta_signups (signup endpoint).
 * Best-effort: errori non bloccano la response al client.
 */
export async function maybeNotifyBetaFull(): Promise<void> {
  try {
    const admin = createAdminClient();

    // 1. Conta spots correnti
    const { data: takenRaw, error: rpcErr } = await admin.rpc("get_beta_spots_taken");
    if (rpcErr) {
      console.warn("[notify-beta-full] rpc failed:", rpcErr.message);
      return;
    }
    const taken = (takenRaw as SpotsResult) ?? 0;
    if (taken < TARGET_SPOTS) return;

    // 2. Marker idempotente: INSERT ON CONFLICT → solo prima volta passa
    const { data: marker, error: insertErr } = await admin
      .from("system_notifications")
      .insert({
        key: NOTIFICATION_KEY,
        detail: { taken, target: TARGET_SPOTS },
      })
      .select("key")
      .maybeSingle();
    if (insertErr && insertErr.code !== "23505") {
      console.warn("[notify-beta-full] marker insert failed:", insertErr.message);
      return;
    }
    if (!marker) return; // gia' notificato

    // 3. Invia email via Resend (se configurata)
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.info(
        "[notify-beta-full] RESEND_API_KEY missing → marker inserito, email skip. " +
          "Aggiungi RESEND_API_KEY a Vercel env per attivare l'invio (e cancella il " +
          "marker `beta_round_1_full` da system_notifications per re-triggerare).",
      );
      return;
    }
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@fitmesh.fit";
    const resend = new Resend(apiKey);

    const dashboardUrl = "https://www.fitmesh.fit/api/admin/beta/export?format=play_console";
    const subject = "🎯 Beta FitMesh piena — 100 founder raggiunti";
    const text = [
      "I 100 posti founder sono stati raggiunti!",
      "",
      `Spots: ${taken}/${TARGET_SPOTS}`,
      "",
      "Prossimi step consigliati:",
      "1. Scarica la lista email pronta per Play Console:",
      `   ${dashboardUrl}`,
      "2. Vai su Play Console → Test → Closed testing → Tester → Add testers → incolla la lista",
      "3. Approva i pending in Supabase dashboard (cambia status pending → approved)",
      "4. Considera di aprire un nuovo round (cancella marker `beta_round_1_full` per re-triggerare)",
      "",
      "— FitMesh notification system",
    ].join("\n");

    await resend.emails.send({
      from: fromEmail,
      to: ADMIN_EMAIL,
      subject,
      text,
    });

    console.info("[notify-beta-full] email sent to", ADMIN_EMAIL);
  } catch (err) {
    console.warn(
      "[notify-beta-full] unexpected failure:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
