import { locales } from "@/lib/i18n";

/**
 * Questa pagina definisce un proprio oggetto `openGraph` in
 * generateMetadata: il fallback in [locale]/opengraph-image.tsx non viene
 * ereditato in quel caso (Next.js resetta target.openGraph ad ogni
 * segmento che dichiara un proprio `openGraph`, anche senza `images` — vedi
 * lib/og/fallback-image.tsx). File colocato per farlo re-iniettare.
 */
export { alt, size, contentType, default } from "@/lib/og/fallback-image";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
