/**
 * Hotfix P0.10R — riconoscimento dei "segnali di recovery" in un URL.
 *
 * Un utente puo' arrivare sul sito con i resti di un vecchio flusso di
 * recupero password nell'indirizzo: un link datato di Supabase, un errore
 * gia' scaduto, un token che non useremo mai (il nostro flusso e' a codice
 * OTP esplicito, non a link auto-verificante).
 *
 * Regola non negoziabile di questo modulo: riconosce la PRESENZA dei
 * parametri, mai il loro VALORE. Nessuna funzione qui dentro restituisce,
 * logga o propaga il contenuto di un token/hash/descrizione d'errore —
 * altrimenti finirebbe in un log di Vercel, in un evento analytics o nel
 * referer verso terze parti. La UI mostra una frase fissa e tradotta, mai
 * il dato grezzo.
 *
 * Puro e senza dipendenze dal DOM: testabile senza browser, riusabile sia
 * nel middleware (Edge) sia in un Client Component.
 */

/** Parametri che indicano "questo URL viene da un flusso di recupero". */
const RECOVERY_PARAM_KEYS = [
  'token',
  'token_hash',
  'code',
  'error_code',
  'error_description',
  'type',
] as const;

/**
 * Solo `type=recovery` conta come segnale: `type` da solo e' troppo generico
 * (comparirebbe su qualunque URL con un parametro omonimo, es. una landing
 * con `?type=ring`).
 */
function hasRecoveryType(params: URLSearchParams): boolean {
  return params.get('type') === 'recovery';
}

/**
 * True se l'URL porta segnali di un flusso di recupero password.
 *
 * `search` e `hash` sono accettati come stringhe grezze (con o senza il
 * `?`/`#` iniziale) perche' Supabase storicamente ha usato ENTRAMBI: i link
 * vecchi mettono i dati nel fragment (`#error_code=otp_expired&...`), quelli
 * piu' recenti in query string. Il fragment non arriva mai al server, quindi
 * il middleware potra' passare solo `search`: e' corretto e previsto.
 */
export function hasRecoverySignal(search: string, hash = ''): boolean {
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

  if (hasRecoveryType(searchParams) || hasRecoveryType(hashParams)) return true;

  return RECOVERY_PARAM_KEYS.filter((k) => k !== 'type').some(
    (k) => searchParams.has(k) || hashParams.has(k),
  );
}

/**
 * Classifica cosa e' arrivato, senza mai restituire valori.
 *
 * - `stale_link`: c'e' un token/codice di un vecchio link, o un errore
 *   esplicito (scaduto/gia' usato). L'utente va indirizzato a chiedere un
 *   codice nuovo.
 * - `none`: nessun residuo, arrivo pulito.
 */
export type RecoveryArrival = 'stale_link' | 'none';

export function classifyRecoveryArrival(search: string, hash = ''): RecoveryArrival {
  return hasRecoverySignal(search, hash) ? 'stale_link' : 'none';
}

/**
 * Rimuove dall'indirizzo SOLO i parametri di recovery, preservando tutto il
 * resto (es. `utm_source`), e azzera sempre il fragment.
 *
 * Restituisce il nuovo `path?query` da passare a `history.replaceState`.
 * Non tocca la history stack (nessun nuovo entry, nessun reload): serve a
 * togliere token e messaggi d'errore dalla barra indirizzi appena sono stati
 * interpretati, cosi' non restano in bookmark, screenshot, cronologia o
 * header `Referer` verso terze parti.
 */
export function stripRecoveryParams(pathname: string, search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  for (const key of RECOVERY_PARAM_KEYS) params.delete(key);
  const rest = params.toString();
  return rest ? `${pathname}?${rest}` : pathname;
}
