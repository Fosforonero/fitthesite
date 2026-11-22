/**
 * Codifica application/x-www-form-urlencoded di UN valore, secondo il
 * serializzatore "urlencoded" dello standard WHATWG URL (lo stesso di
 * URLSearchParams) e di HTML. E' la codifica che RFC 6749 §2.3.1 (con
 * l'Appendice B) prescrive per client_id e client_secret prima di costruire
 * l'header Basic.
 *
 * Regole:
 *   - il testo si converte in byte UTF-8;
 *   - restano invariati SOLO A-Z a-z 0-9 e i quattro caratteri * - . _
 *   - lo spazio (0x20) diventa '+';
 *   - ogni altro byte diventa %XX con cifre esadecimali MAIUSCOLE.
 *
 * Surrogati spaiati (stringhe UTF-16 non valide): TextEncoder li sostituisce con
 * U+FFFD, che diventa %EF%BF%BD. E' lo stesso comportamento di URLSearchParams;
 * nessuna eccezione. Un valore letto da una variabile d'ambiente non puo'
 * contenerne, quindi non cambia nulla per le credenziali reali.
 *
 * NON e' encodeURIComponent: quella lascia ~ ! ' ( ) non codificati e codifica
 * lo spazio come %20.
 */
const LASCIATI = new Uint8Array(256);
for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*-._") {
  LASCIATI[c.charCodeAt(0)] = 1;
}
const HEX = "0123456789ABCDEF";

export function formUrlEncode(valore: string): string {
  let out = "";
  for (const b of new TextEncoder().encode(valore)) {
    if (LASCIATI[b]) out += String.fromCharCode(b);
    else if (b === 0x20) out += "+";
    else out += "%" + HEX[b >> 4] + HEX[b & 0x0f];
  }
  return out;
}
