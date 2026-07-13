import { locales } from "@/lib/i18n";

/**
 * Fallback OG per ogni pagina sotto [locale] priva di un opengraph-image.tsx
 * più specifico E la cui pagina non definisce un proprio oggetto
 * `openGraph` in generateMetadata (es. homepage, /support, /cookies).
 *
 * Le pagine marketing che DEFINISCONO un proprio `openGraph` (about, ai,
 * beta, blog index, famiglia, integrations, novita, press, roadmap) NON
 * ereditano questo file — hanno ciascuna un opengraph-image.tsx locale che
 * re-esporta lo stesso componente da lib/og/fallback-image.tsx. Vedi quel
 * file per il perché (comportamento Next.js verificato, non un bug).
 */
export { alt, size, contentType, default } from "@/lib/og/fallback-image";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
