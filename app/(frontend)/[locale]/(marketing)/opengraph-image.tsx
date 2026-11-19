import { locales } from "@/lib/i18n";

/**
 * Homepage: page.tsx definisce un proprio oggetto `openGraph` in
 * generateMetadata, quindi il fallback in [locale]/opengraph-image.tsx non
 * viene ereditato (vedi lib/og/fallback-image.tsx). File colocato per farlo
 * re-iniettare. Aggiunto il 19/11/2026: le home di tutte le locale erano
 * senza og:image e twitter:image.
 */
export { alt, size, contentType, default } from "@/lib/og/fallback-image";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
