/**
 * Interruttore del PROTOTIPO della dashboard web personale.
 *
 * La dashboard web personale NON e' disponibile: e' decisa e in sviluppo. Questo
 * prototipo serve alla revisione interna (dati sintetici, nessuna metrica reale)
 * e non deve mai essere raggiungibile da un visitatore, ne' indicizzabile, ne'
 * leggibile come annuncio di disponibilita'.
 *
 * Due chiavi, entrambe necessarie:
 *  1. WEB_DASHBOARD_PROTOTYPE=1 nell'ambiente del processo;
 *  2. l'ambiente NON e' la produzione di Vercel (VERCEL_ENV !== 'production').
 * La seconda vale anche se qualcuno imposta per errore la prima in produzione.
 * Senza entrambe le rotte rispondono 404, come se non esistessero.
 */
export function isWebDashboardPrototypeEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.VERCEL_ENV === 'production') return false;
  return env.WEB_DASHBOARD_PROTOTYPE === '1';
}
