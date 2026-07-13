/**
 * FitMesh Sync — i18n configuration.
 *
 * Locales gestite: italiano (default, brand language), inglese e spagnolo.
 * Aggiungere un nuovo locale = aggiungere voce qui + dictionary in dictionaries/
 * + content nei page component conditionali.
 */

export const locales = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "it";

/**
 * Locali aggiunti per ultimi (nordici): UI e marketing sono tradotti, ma i
 * CONTENUTI lunghi (corpi articolo del blog, pagine programmatiche
 * provider/modelli) sono ancora in fallback EN. Finche' non sono tradotti,
 * quelle pagine vanno in `noindex` per questi locali, per non mettere contenuto
 * inglese sotto URL nordici nell'indice. Rimuovere un locale da qui quando i
 * suoi contenuti sono tradotti.
 */
export const UNTRANSLATED_CONTENT_LOCALES = new Set<Locale>([
  "sv",
  "da",
  "no",
  "fi",
]);

export const localeNames: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  de: "Deutsch",
  pt: "Português",
  fr: "Français",
  pl: "Polski",
  tr: "Türkçe",
  nl: "Nederlands",
  ja: "日本語",
  ko: "한국어",
  sv: "Svenska",
  da: "Dansk",
  no: "Norsk",
  fi: "Suomi",
};

export const localeFlags: Record<Locale, string> = {
  it: "🇮🇹",
  en: "🇬🇧",
  es: "🇪🇸",
  de: "🇩🇪",
  pt: "🇧🇷",
  fr: "🇫🇷",
  pl: "🇵🇱",
  tr: "🇹🇷",
  nl: "🇳🇱",
  ja: "🇯🇵",
  ko: "🇰🇷",
  sv: "🇸🇪",
  da: "🇩🇰",
  no: "🇳🇴",
  fi: "🇫🇮",
};

/**
 * OpenGraph locale identifiers (full BCP 47-ish format expected by Facebook).
 * pt → pt_BR: il mercato target lusofono principale è il Brasile.
 */
export const ogLocale: Record<Locale, string> = {
  it: "it_IT",
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
  pt: "pt_BR",
  fr: "fr_FR",
  pl: "pl_PL",
  tr: "tr_TR",
  nl: "nl_NL",
  ja: "ja_JP",
  ko: "ko_KR",
  sv: "sv_SE",
  da: "da_DK",
  no: "nb_NO",
  fi: "fi_FI",
};

/**
 * HTML `<html lang>` attribute value. pt → pt-BR (targeting Brasile).
 */
export const htmlLang: Record<Locale, string> = {
  it: "it",
  en: "en",
  es: "es",
  de: "de",
  pt: "pt-BR",
  fr: "fr",
  pl: "pl",
  tr: "tr",
  nl: "nl",
  ja: "ja",
  ko: "ko",
  sv: "sv",
  da: "da",
  no: "no",
  fi: "fi",
};

/**
 * Build the `alternates.languages` hreflang map for ALL locales + x-default (IT),
 * iterating `locales` so new languages are never forgotten in a page's metadata.
 *
 *   languages: localeAlternates((l) => `${SITE_URL}/${l}/novita`)
 *
 * For pages with localized slugs, pass a function that returns the localized URL.
 */
export function localeAlternates(
  urlForLocale: (locale: Locale) => string,
): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const l of locales) langs[l] = urlForLocale(l);
  langs["x-default"] = urlForLocale(defaultLocale);
  return langs;
}

/**
 * Async dictionary loader. Returns the full translation object for a locale.
 * Falls back to default on unknown locale.
 */
export async function getDictionary(locale: string) {
  const safe: Locale = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : defaultLocale;
  return (await import(`./dictionaries/${safe}.json`)).default;
}

/**
 * Pretty type for the dictionary shape — keep in sync with the JSON files.
 */
export type Dictionary = {
  nav: {
    support: string;
    privacy: string;
    download: string;
  };
  hero: {
    badge: string;
    heading_1: string;
    heading_accent: string;
    description: string;
    cta_secondary: string;
    pricing: string;
  };
  features: {
    kicker: string;
    heading: string;
    items: Array<{ title: string; desc: string }>;
  };
  privacy_block: {
    kicker: string;
    heading: string;
    description: string;
    cta: string;
  };
  final_cta: {
    heading: string;
    description: string;
  };
  footer: {
    tagline: string;
    product: string;
    legal: string;
    rights: string;
    made_with: string;
    fosforonero_label: string;
    links: {
      features: string;
      download: string;
      support: string;
      privacy: string;
      terms: string;
      cookies: string;
    };
  };
  cookie_banner: {
    title: string;
    description: string;
    details_link: string;
    accept: string;
    reject: string;
  };
  legal: {
    last_updated: string;
    privacy_title: string;
    terms_title: string;
    cookies_title: string;
    support_title: string;
    section: string;
  };
};
