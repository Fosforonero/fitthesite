/**
 * Il cancello della dashboard web REALE (/[locale]/app/dashboard).
 *
 * Non va confuso con quello del PROTOTIPO (flag.ts nella cartella del prototipo: dati sintetici, solo in
 * locale, chiuso su ogni ambiente Vercel e in ogni build di produzione).
 *
 *  - Fuori dalla produzione (sviluppo, test): basta FITMESH_WEB_DASHBOARD=1, per provarla.
 *  - In una build di PRODUZIONE (NODE_ENV=production o qualunque VERCEL_ENV, quindi anche le
 *    anteprime e un `next start` auto-ospitato) la sola variabile d'ambiente NON accende nulla:
 *    decide lo stato dichiarato nel codice di rilascio, CAPABILITY_STATUS.webDashboard. Passa a
 *    live_verified/live_limited solo con un commit approvato al release gate, e solo dopo la
 *    migration 20260924120000 applicata con un GO di Matteo (condizione 1 della nota di
 *    CAPABILITY_STATUS.webDashboard: gate importato dal codice di rilascio, non riletto da
 *    process.env). Dopo quel gate la pagina si attiva senza toccare l'ambiente.
 *  - In produzione la variabile conserva un solo potere: FITMESH_WEB_DASHBOARD=0 SPEGNE la
 *    pagina (kill switch operativo, senza un nuovo deploy del codice). Mai accenderla.
 *
 * Letto a ogni richiesta, mai a build time: la pagina e' dinamica.
 */
import { isFeatureAvailable } from '@/lib/feature-status';

export function dashboardWebAttiva(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const produzione = env.NODE_ENV === 'production' || Boolean(env.VERCEL_ENV);
  if (produzione) {
    return isFeatureAvailable('webDashboard') && env.FITMESH_WEB_DASHBOARD !== '0';
  }
  return env.FITMESH_WEB_DASHBOARD === '1';
}
