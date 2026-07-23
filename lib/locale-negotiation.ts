import { locales, type Locale } from "@/lib/i18n";

/**
 * Negoziazione lingua per URL senza prefisso locale (root `/` e deep link
 * senza segmento lingua). Ordine di priorità, dal più al meno affidabile:
 *
 *   1. cookie esplicito `fm_locale` (scelta consapevole dell'utente, messa
 *      da LanguageSwitcher — prevale su tutto il resto);
 *   2. header `Accept-Language`, con parsing dei valori `q` (non solo la
 *      prima lingua della stringa);
 *   3. `x-vercel-ip-country` (Paese IP) come fallback geografico;
 *   4. inglese come fallback neutrale finale.
 *
 * Pura (nessun accesso a NextRequest/next/headers): usata sia da
 * middleware.ts (Edge, via NextRequest) sia da app/(frontend)/page.tsx
 * (Server Component, via next/headers) passando le stesse tre stringhe
 * grezze, per evitare di duplicare il parsing in due punti.
 */

const COOKIE_NAME = "fm_locale";

/** Fallback geografico: usato SOLO quando manca sia il cookie sia un Accept-Language riconoscibile. */
const GEO_LOCALE_MAP: Record<string, Locale> = {
  DE: "de",
  AT: "de",
  IT: "it",
  FR: "fr",
  ES: "es",
  PT: "pt",
  NL: "nl",
  PL: "pl",
  SE: "sv",
  DK: "da",
  NO: "no",
  FI: "fi",
  JP: "ja",
  KR: "ko",
};

function isSupportedLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * 'nb' (bokmål) e 'nn' (nynorsk) non sono locale supportate: l'unica locale
 * editoriale norvegese è 'no' (vedi lib/i18n.ts). Senza questo alias, un
 * Accept-Language "nb-NO"/"nn-NO" su un deep link senza prefisso (es. root
 * '/') veniva scartato da isSupportedLocale e cadeva sul fallback
 * geo/inglese invece di atterrare su '/no'.
 */
const NORWEGIAN_VARIANT_TO_LOCALE: Record<string, Locale> = { nb: "no", nn: "no" };

/**
 * Parsa un header Accept-Language rispettando i valori `q` (RFC 9110 §12.5.4).
 * Esempio: "en-US;q=0.5,de-DE;q=0.9,it;q=0.2" -> "de" (q piu' alto vince, non
 * la prima lingua elencata).
 */
export function parseAcceptLanguageLocale(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const entries = header
    .split(",")
    .map((part) => {
      const [rawLang, ...params] = part.trim().split(";");
      const lang = rawLang.trim().toLowerCase();
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q") {
          const parsed = Number.parseFloat(value);
          if (!Number.isNaN(parsed)) q = parsed;
        }
      }
      return { lang, q };
    })
    .filter((entry) => entry.lang.length > 0 && entry.lang !== "*")
    .sort((a, b) => b.q - a.q);

  for (const { lang } of entries) {
    const base = lang.split("-")[0];
    const normalized = NORWEGIAN_VARIANT_TO_LOCALE[base] ?? base;
    if (isSupportedLocale(normalized)) return normalized;
  }
  return null;
}

export function localeFromCountry(country: string | null | undefined): Locale | null {
  if (!country) return null;
  return GEO_LOCALE_MAP[country.toUpperCase()] ?? null;
}

export function localeFromCookieValue(value: string | null | undefined): Locale | null {
  if (!value) return null;
  return isSupportedLocale(value) ? value : null;
}

export interface NegotiationSignals {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  country?: string | null;
}

/** Risolve la lingua da usare per un redirect da un URL senza prefisso locale. Non ritorna mai null: 'en' è il fallback finale. */
export function resolveNegotiatedLocale({
  cookieLocale,
  acceptLanguage,
  country,
}: NegotiationSignals): Locale {
  const fromCookie = localeFromCookieValue(cookieLocale);
  if (fromCookie) return fromCookie;

  const fromAcceptLanguage = parseAcceptLanguageLocale(acceptLanguage);
  if (fromAcceptLanguage) return fromAcceptLanguage;

  const fromCountry = localeFromCountry(country);
  if (fromCountry) return fromCountry;

  return "en";
}

export const LOCALE_COOKIE_NAME = COOKIE_NAME;
