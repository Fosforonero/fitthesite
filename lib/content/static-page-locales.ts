import type { Locale } from "@/lib/i18n";

/**
 * Locali con contenuto realmente completo per le pagine marketing statiche
 * (home/roadmap/about) che non hanno un modello dati condiviso da cui
 * derivare la lista (a differenza di blog/lp/provider). Fonte di verità unica
 * usata sia dalla pagina stessa (`generateMetadata` → `robots`) sia da
 * `app/sitemap.ts` (`indexableLocales`), così i due non possono contraddirsi.
 *
 * Non può vivere dentro il file della page stessa: Next.js valida che i moduli
 * `page.tsx` esportino solo il set noto (`default`, `generateMetadata`, ...) e
 * fallisce il typecheck su qualunque altro export nominato.
 */
export const HOME_COMPLETE_LOCALES: readonly Locale[] = [
  "it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi",
];

export const ROADMAP_COMPLETE_LOCALES: readonly Locale[] = [
  "it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko",
];

export const ABOUT_TRANSLATED_LOCALES: readonly Locale[] = [
  "it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi",
];

/**
 * Stesso motivo delle costanti sopra, ma per le pagine il cui `COPY` è un
 * oggetto `Record<locale, {...}>` locale al modulo — qui basta la lista delle
 * chiavi, non l'intero oggetto, per non duplicare tutto il contenuto in
 * `sitemap.ts`. Deve restare allineata alle chiavi reali di `COPY` in
 * `press/page.tsx` / `famiglia/page.tsx`.
 */
export const PRESS_COMPLETE_LOCALES: readonly Locale[] = [
  "it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko",
];

export const FAMIGLIA_COMPLETE_LOCALES: readonly Locale[] = [
  "it", "en", "es", "de", "pt", "fr", "pl", "tr",
];
