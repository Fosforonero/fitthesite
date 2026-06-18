/**
 * Slug localizzati per lingua — helper di lettura + reverse lookup.
 *
 * Modello: lo `slug` canonico di un post/landing (= slug IT) è la chiave. L'IT
 * usa sempre il canonico; en/es/de/pt/fr usano lo slug tradotto in `BLOG_SLUGS`/
 * `LANDING_SLUGS` (fallback al canonico se mancante, es. post solo-CMS).
 *
 * Usato ovunque si costruisca un URL `/{locale}/blog/...` o `/{locale}/lp/...`,
 * e dal routing per risolvere lo slug localizzato → post (con redirect 308 dal
 * vecchio URL slug-IT).
 */
import { locales, type Locale } from "@/lib/i18n";
import { BLOG_SLUGS, LANDING_SLUGS } from "@/lib/blog/slugs";

type NonItLocale = Exclude<Locale, "it">;
type SlugMap = Record<string, Partial<Record<NonItLocale, string>>>;

function localized(map: SlugMap, canonical: string, locale: Locale): string {
  if (locale === "it") return canonical;
  return map[canonical]?.[locale as NonItLocale] ?? canonical;
}

/** Reverse: per ogni locale, slug-localizzato → slug-canonico. */
function buildReverse(map: SlugMap): Record<Locale, Record<string, string>> {
  const out = {} as Record<Locale, Record<string, string>>;
  for (const lc of locales) out[lc] = {};
  for (const canonical of Object.keys(map)) {
    for (const lc of locales) {
      if (lc === "it") continue;
      const s = map[canonical]?.[lc as NonItLocale];
      if (s) out[lc][s] = canonical;
    }
  }
  return out;
}

const blogReverse = buildReverse(BLOG_SLUGS);
const landingReverse = buildReverse(LANDING_SLUGS);

export function localizedBlogSlug(canonical: string, locale: Locale): string {
  return localized(BLOG_SLUGS, canonical, locale);
}
export function localizedLandingSlug(canonical: string, locale: Locale): string {
  return localized(LANDING_SLUGS, canonical, locale);
}

/**
 * Dato lo slug presente nell'URL per un certo locale, ritorna lo slug canonico
 * se quello è la forma localizzata attesa; altrimenti `null` (lo slug non è una
 * forma localizzata nota → potrebbe essere il vecchio URL slug-IT o sconosciuto).
 */
export function canonicalFromBlogUrl(urlSlug: string, locale: Locale): string | null {
  if (locale === "it") return urlSlug;
  return blogReverse[locale]?.[urlSlug] ?? null;
}
export function canonicalFromLandingUrl(urlSlug: string, locale: Locale): string | null {
  if (locale === "it") return urlSlug;
  return landingReverse[locale]?.[urlSlug] ?? null;
}
