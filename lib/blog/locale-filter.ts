/**
 * P1.3M: disponibilità dichiarativa per-locale di un blocco di contenuto
 * (sezione del body, o FAQ). Unica fonte di verità per "questo blocco è
 * disponibile per questa lingua?", usata da OGNI superficie che legge
 * `post.body`/`post.faq` — rendering, JSON-LD, indice di completezza,
 * overlay nordico — così non possono esistere due interpretazioni diverse
 * di "blocco visibile".
 *
 * Deliberatamente NON basato su timestamp o snapshot: la proprietà
 * `locales` è dichiarativa (l'autore del contenuto la scrive esplicitamente
 * sul blocco), non derivata da quando è stato scritto o modificato.
 *
 * Assente (`undefined`) = applicabile a tutte le locale (comportamento
 * storico, invariato). Presente = applicabile SOLO alle locale elencate:
 * una locale esclusa non vede il blocco e non lo conta ai fini della
 * completezza; una locale inclusa ma priva della traduzione richiesta
 * continua a risultare incompleta (nessuna eccezione sulla traduzione
 * stessa, solo sulla APPLICABILITÀ del blocco).
 */
import type { Locale } from "@/lib/i18n";

export interface LocaleScoped {
  readonly locales?: readonly Locale[];
}

export function isBlogContentAvailableForLocale(item: LocaleScoped, locale: Locale): boolean {
  return item.locales == null || item.locales.includes(locale);
}

export function filterBlogContentForLocale<T extends LocaleScoped>(items: readonly T[], locale: Locale): T[] {
  return items.filter((item) => isBlogContentAvailableForLocale(item, locale));
}
