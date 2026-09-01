/**
 * Chi puo' presentare una transazione Apple SANDBOX a questo backend.
 *
 * TestFlight e App Review comprano in Sandbox contro il backend di PRODUZIONE.
 * Rifiutare ogni Sandbox — che e' quello che il backend faceva — significa che
 * il revisore di Apple completa l'acquisto e vede un paywall. Con quel
 * comportamento iOS non e' rilasciabile, a prescindere dal resto.
 *
 * Aprire l'ambiente sarebbe peggio del problema: una transazione Sandbox e'
 * gratuita per chiunque abbia un Apple ID di test. L'apertura e' quindi della
 * PERSONA, decisa lato server, in una tabella che il client non legge e non
 * scrive (`private.billing_sandbox_reviewers`, interrogabile solo tramite
 * `public.is_sandbox_reviewer`, concessa al solo service_role).
 *
 * In dubbio si risponde NO. Un errore di rete o una funzione non ancora
 * applicata non sono un permesso: costano un revisore che non riesce a
 * comprare — spiacevole e recuperabile — invece di un Pro a vita regalato.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function isSandboxReviewer(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc("is_sandbox_reviewer", {
      p_user_id: userId,
    });
    if (error) {
      // Solo il codice: il messaggio di Postgres puo' contenere frammenti
      // della query, e questa e' una decisione di sicurezza.
      console.warn(`[Billing] is_sandbox_reviewer errore code=${error.code}`);
      return false;
    }
    return data === true;
  } catch (e) {
    console.warn(
      `[Billing] is_sandbox_reviewer non raggiungibile: ${e instanceof Error ? e.name : "errore"}`,
    );
    return false;
  }
}
