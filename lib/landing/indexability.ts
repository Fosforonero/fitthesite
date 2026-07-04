/**
 * Fonte di verità UNICA per "questa landing page (lp, locale) è indicizzabile?".
 * Gemella di `lib/blog/indexability.ts`, stesso motivo: una LP con un campo
 * mancante per `lc` cade in fallback en/it ma si auto-canonicalizza come
 * originale → duplicato rilevato da Search Console ("Duplicate without
 * user-selected canonical"). Usata da `lp/[slug]/page.tsx` (robots + hreflang)
 * e `sitemap.ts`.
 */
import type { Locale } from "@/lib/i18n";
import { walkLanding } from "@/lib/landing/es-overlay";
import type { LandingPage } from "@/lib/landing/data";

/** True se OGNI campo traducibile della LP ha un valore per `lc` (nessun fallback en/it). */
export function isLandingLocaleComplete(lp: LandingPage, lc: Locale): boolean {
  const entries = walkLanding(lp);
  if (entries.length === 0) return false;
  for (const e of entries) {
    const node = e.node as Record<string, unknown>;
    const val = node[lc];
    if (val == null) return false;
    if (e.kind === "list") {
      const src = (node.en ?? node.it) as unknown[];
      if (!Array.isArray(val) || val.length !== src.length) return false;
    }
  }
  return true;
}

/** True se la pagina `(lp, locale)` è indicizzabile (NON esce `noindex`). */
export function isLandingVariantIndexable(lp: LandingPage, lc: Locale): boolean {
  if (lc === "it" || lc === "en") return true;
  return isLandingLocaleComplete(lp, lc);
}
