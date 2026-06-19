/**
 * FitMesh Sync — i18n configuration.
 *
 * Locales gestite: italiano (default, brand language), inglese e spagnolo.
 * Aggiungere un nuovo locale = aggiungere voce qui + dictionary in dictionaries/
 * + content nei page component conditionali.
 */

export const locales = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "it";

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
    coming_soon: string;
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
