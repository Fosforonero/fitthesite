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
  "it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi",
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
/**
 * Sprint P0.13: riallineata a 15 locale dopo verifica diretta del contenuto
 * (non solo presenza chiave) di `COPY` in `press/page.tsx` — sv/da/no/fi
 * hanno title/description/body/CTA/JSON-LD reali e distinti, nessun fallback
 * EN mascherato, canonical self-referenziante, `robots` già indicizzava
 * queste 4 locale (isLocaleInCopy(COPY, lc) le trova complete): solo questa
 * lista (usata esclusivamente da sitemap.ts) era rimasta indietro,
 * escludendo dalla sitemap 4 pagine già live e indicizzabili. Nessuna nuova
 * traduzione creata in questo sprint — allineamento della sola SSOT a
 * contenuto già esistente.
 */
export const PRESS_COMPLETE_LOCALES: readonly Locale[] = [
  "it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi",
];

export const FAMIGLIA_COMPLETE_LOCALES: readonly Locale[] = [
  "it", "en", "es", "de", "pt", "fr", "pl", "tr",
];

/**
 * Sprint P0.13 (FASE 3): link interni verso /famiglia, indexability-aware
 * sulla STESSA lista di FAMIGLIA_COMPLETE_LOCALES (quella già usata da
 * sitemap.ts e — via isLocaleInCopy(COPY, lc), suo twin garantito allineato —
 * da famiglia/page.tsx per robots/hreflang). lc-diretto se completo,
 * altrimenti EN (sempre presente in FAMIGLIA_COMPLETE_LOCALES, quindi mai
 * null): trovato da Footer.tsx che linkava `/${locale}/famiglia`
 * incondizionatamente, producendo un anchor indicizzabile→noindex per le 7
 * locale non coperte da COPY (nl/ja/ko/sv/da/no/fi).
 */
export function famigliaLinkHref(locale: Locale): string {
  return FAMIGLIA_COMPLETE_LOCALES.includes(locale)
    ? `/${locale}/famiglia`
    : "/en/famiglia";
}

/**
 * Landing "fitness data sync" (sprint P0.2). Fase 3 ha pubblicato solo EN;
 * Fase 7 (2026-07-12) ha tradotto it/de/es a mano (vedi
 * lib/content/fitness-data-sync-copy.ts) — tutte e 4 le locale supportate
 * da questa route (FDS_LOCALES in .../fitness-data-sync/page.tsx) sono ora
 * indicizzabili.
 */
export const FITNESS_DATA_SYNC_COMPLETE_LOCALES: readonly Locale[] = ["en", "it", "de", "es"];
