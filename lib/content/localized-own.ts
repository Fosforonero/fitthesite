/**
 * lib/content/localized-own.ts: lettura di un testo localizzato SENZA ripiego.
 *
 * `tl()` (lib/blog/types.ts) ricade su en e poi su it. Per i campi NUOVI della
 * home (S02) quel ripiego e' vietato: dove una lingua non ha ancora il valore
 * approvato il campo e' assente e il blocco che lo usa si ritira, non si
 * mostra in inglese dentro una pagina localizzata (TRANSLATIONS, nessun
 * fallback inglese silenzioso).
 *
 * Ritorna `undefined` se la lingua non ha un valore non vuoto.
 */
import type { Locale } from "@/lib/i18n";
import type { Localized } from "@/lib/blog/types";

export function tlOwn(l: Localized, lc: Locale): string | undefined {
  const v = (l as Record<string, string | undefined>)[lc];
  return typeof v === "string" && v.trim().length > 0 ? v : undefined;
}
