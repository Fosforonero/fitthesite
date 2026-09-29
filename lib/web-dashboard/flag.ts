/**
 * Interruttore del PROTOTIPO della dashboard web personale.
 *
 * La dashboard web personale NON e' disponibile: e' decisa e in sviluppo. Questo
 * prototipo serve alla revisione interna (dati sintetici, nessuna metrica reale)
 * e non deve mai essere raggiungibile da un visitatore, ne' indicizzabile, ne'
 * leggibile come annuncio di disponibilita'.
 *
 * Tre condizioni, tutte necessarie:
 *  1. WEB_DASHBOARD_PROTOTYPE=1 nell'ambiente del processo;
 *  2. VERCEL_ENV assente o vuoto: su OGNI ambiente Vercel il cancello resta
 *     chiuso, anteprime comprese (decisioni 28 e 36: il prototipo vive solo in
 *     locale, senza deploy). Un valore qualunque, anche sconosciuto, chiude;
 *  3. NODE_ENV diverso da 'production': un server di produzione fuori da Vercel
 *     (`next start`) resta chiuso.
 * Restano aperti solo lo sviluppo locale e i test. Le due condizioni di chiusura
 * valgono anche se qualcuno imposta per errore la prima su Vercel o in
 * produzione. Senza tutte e tre le rotte rispondono 404, come se non esistessero,
 * e non costruiscono ne' leggono nessun dato: scenari (`state`), spettatore
 * (`as`), `chrome` e l'accesso sintetico vivono SOLO dietro questo cancello.
 */
export function isWebDashboardPrototypeEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.WEB_DASHBOARD_PROTOTYPE !== '1') return false;
  if (env.VERCEL_ENV) return false;
  if (env.NODE_ENV === 'production') return false;
  return true;
}
