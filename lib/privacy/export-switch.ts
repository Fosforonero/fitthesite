/**
 * Interruttore d'EMERGENZA dell'export web: rende temporaneamente INDISPONIBILE la sola pagina
 * `/[locale]/app/export`, senza ripristinare l'export non filtrato (il componente non viene nemmeno
 * montato, quindi non parte nessuna lettura).
 *
 * PREPARATO, NON ATTIVO: di default l'export e' disponibile. Nessun GO all'attivazione.
 *
 * Due leve, dalla piu' veloce alla piu' lenta (dettagli e tempi in docs/export-web-emergenza.md):
 *  1. variabile d'ambiente `FITMESH_EXPORT_UNAVAILABLE` (valori che spengono: 1, true, yes, on, senza distinzione
 *     di maiuscole); su Vercel una variabile cambiata vale solo per un NUOVO deployment, quindi serve un
 *     redeploy dello stesso commit (nessuna PR, nessun merge);
 *  2. costante `FORZATO_DA_CODICE`: un commit che tocca anche il test che la fissa a false e i test di pagina
 *     «disponibile» (PR, CI, merge, deploy): NON e' una riga.
 *
 * PRECONDIZIONE: il codice di questo file deve essere GIA' nel deployment di produzione, altrimenti la variabile
 * non fa nulla; un rollback toglie anche l'interruttore (docs/export-web-emergenza.md).
 *
 * La scelta dei valori e' larga ma NON totale: spengono 1, true, yes, on (maiuscole e spazi ignorati). NON spengono
 * varianti come `y`, `si`, `enabled`, il valore fra virgolette (`"1"`) o `1.0`: dopo averla impostata si verifica
 * SEMPRE che la pagina mostri il messaggio di sospensione (docs/export-web-emergenza.md).
 *
 * Limite dichiarato: spegnere la pagina NON chiude le letture dirette via REST che la RLS gia' permette: e'
 * contenimento di UNA superficie, non una correzione delle policy.
 */
const VALORI_CHE_SPENGONO = new Set(['1', 'true', 'yes', 'on']);

/** Leva 2: mettere `true` in un commit spegne l'export a prescindere dall'ambiente. Oggi `false`. */
export const FORZATO_DA_CODICE = false;

export function isExportTemporarilyUnavailable(
  env: Record<string, string | undefined> = process.env,
  /** Parametro SOLO per i test: la leva da codice come valore, cosi' i test non dipendono dalla costante. */
  forzato: boolean = FORZATO_DA_CODICE,
): boolean {
  if (forzato) return true;
  const v = env.FITMESH_EXPORT_UNAVAILABLE;
  return typeof v === 'string' && VALORI_CHE_SPENGONO.has(v.trim().toLowerCase());
}
