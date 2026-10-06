/**
 * `next` arriva dall'esterno (query string): deve restare un percorso INTERNO dello stesso sito.
 *
 * `startsWith('/')` non basta: `//dominio` e `/\dominio` iniziano per `/` ma il parser URL
 * li legge come host (il backslash vale come slash per gli schemi speciali, e i browser
 * tolgono tabulazioni e a capo dall'URL: `/<TAB>/dominio` diventa `//dominio`). Quindi:
 *   1. si accetta solo `/` seguito da un carattere che NON sia `/` ne' `\`;
 *   2. nessun backslash e nessun carattere di controllo in nessuna posizione;
 *   3. si risolve davvero con `new URL` e si confronta l'ORIGINE con quella della richiesta;
 *   4. si rimanda a `pathname + search` gia' normalizzati, mai alla stringa grezza.
 * Qualunque dubbio ricade sulla propria area nel locale della richiesta.
 */
export function safeNextPath(next: string | null, locale: string, requestUrl: string): string {
  const fallback = `/${locale}/app`;
  if (!next || !/^\/(?![\/\\])/.test(next) || /[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  let risolto: URL;
  try {
    risolto = new URL(next, requestUrl);
  } catch {
    return fallback;
  }
  if (risolto.origin !== new URL(requestUrl).origin) return fallback;
  return `${risolto.pathname}${risolto.search}`;
}
