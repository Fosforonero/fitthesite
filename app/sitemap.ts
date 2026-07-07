import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/lib/i18n";
import { PROVIDERS } from "@/lib/providers/data";
import { PROVIDER_MODELS } from "@/lib/providers/models";
import { getBlogPosts } from "@/lib/blog/payload-source";
import { LANDING_PAGES } from "@/lib/landing/data";
import { isLandingVariantIndexable } from "@/lib/landing/indexability";
import { localizedBlogSlug, localizedLandingSlug } from "@/lib/blog/slug-i18n";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import {
  isProviderVariantIndexable,
  isProviderModelVariantIndexable,
} from "@/lib/providers/indexability";
import {
  HOME_COMPLETE_LOCALES,
  ABOUT_TRANSLATED_LOCALES,
  PRESS_COMPLETE_LOCALES,
  FAMIGLIA_COMPLETE_LOCALES,
  ROADMAP_COMPLETE_LOCALES,
} from "@/lib/content/static-page-locales";

const BASE = "https://www.fitmesh.fit";

type ChangeFreq = "monthly" | "yearly" | "weekly" | "daily";

/**
 * Sitemap multi-locale con hreflang alternates per ogni URL.
 * Google usa <xhtml:link rel="alternate" hreflang="..."> emessi automaticamente
 * da Next.js a partire dal campo `alternates.languages` qui sotto.
 *
 * Sections:
 *  - Static marketing (home, integrations, beta, ...)
 *  - Provider landings (/sync/[provider]) — 11 × 2 locales
 *  - Blog index (/blog) + articoli (/blog/[slug]) — 1 + 8 × 2 locales
 *  - Landing high-intent (/lp/[slug]) — 4 × 2 locales
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: Array<{
    path: string;
    changeFrequency: ChangeFreq;
    priority: number;
    lastModified?: Date;
    /** Path localizzato per lingua (blog/lp: slug tradotto). Default: `path`. */
    localized?: (lc: Locale) => string;
    /**
     * Locali indicizzabili per questa route (default: tutti). Esclude dalle
     * URL e dagli hreflang le varianti `noindex` (contenuto non tradotto per
     * quel locale — nordico o altro), così la sitemap non contraddice il
     * robots della pagina.
     */
    indexableLocales?: (lc: Locale) => boolean;
  }> = [
    { path: "",              changeFrequency: "monthly", priority: 1.0,  indexableLocales: (lc) => HOME_COMPLETE_LOCALES.includes(lc) },
    { path: "/about",        changeFrequency: "monthly", priority: 0.85, indexableLocales: (lc) => ABOUT_TRANSLATED_LOCALES.includes(lc) },
    { path: "/press",        changeFrequency: "monthly", priority: 0.7,  indexableLocales: (lc) => PRESS_COMPLETE_LOCALES.includes(lc) },
    { path: "/famiglia",     changeFrequency: "monthly", priority: 0.95, indexableLocales: (lc) => FAMIGLIA_COMPLETE_LOCALES.includes(lc) },
    { path: "/integrations", changeFrequency: "weekly",  priority: 0.9 },
    { path: "/ai",           changeFrequency: "monthly", priority: 0.85 },
    { path: "/roadmap",      changeFrequency: "weekly",  priority: 0.6,  indexableLocales: (lc) => ROADMAP_COMPLETE_LOCALES.includes(lc) },
    { path: "/beta",         changeFrequency: "weekly",  priority: 0.95 },
    { path: "/blog",         changeFrequency: "daily",   priority: 0.85 },
    { path: "/novita",       changeFrequency: "weekly",  priority: 0.8 },
    { path: "/support",      changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy",      changeFrequency: "yearly",  priority: 0.5 },
    { path: "/terms",        changeFrequency: "yearly",  priority: 0.5 },
    { path: "/cookies",      changeFrequency: "yearly",  priority: 0.4 },
    { path: "/imprint",      changeFrequency: "yearly",  priority: 0.4 },
  ];

  // Una landing per provider — priorità 0.8 (alta: pagine SEO-target)
  for (const p of PROVIDERS) {
    routes.push({
      path: `/sync/${p.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
      indexableLocales: (lc) => isProviderVariantIndexable(p, lc),
    });
  }

  // Model-level device pages — priorità 0.7, yearly (specs stabili)
  for (const [providerSlug, models] of Object.entries(PROVIDER_MODELS)) {
    for (const m of models) {
      routes.push({
        path: `/sync/${providerSlug}/${m.slug}`,
        changeFrequency: "yearly",
        priority: 0.7,
        indexableLocales: (lc) => isProviderModelVariantIndexable(m, lc),
      });
    }
  }

  // Articoli blog — priorità 0.7, daily (perché lo stato delle integrazioni e
  // delle policy brand può cambiare e gli articoli vanno rivisitati spesso).
  for (const p of await getBlogPosts()) {
    routes.push({
      path: `/blog/${p.slug}`,
      localized: (lc) => `/blog/${localizedBlogSlug(p.slug, lc)}`,
      changeFrequency: "daily",
      priority: 0.7,
      lastModified: new Date(p.updatedAt),
      indexableLocales: (lc) => isBlogVariantIndexable(p, lc),
    });
  }

  // Landing high-intent — priorità 0.75 (conversion-oriented).
  for (const lp of LANDING_PAGES) {
    routes.push({
      path: `/lp/${lp.slug}`,
      localized: (lc) => `/lp/${localizedLandingSlug(lp.slug, lc)}`,
      changeFrequency: "weekly",
      priority: 0.75,
      lastModified: new Date(lp.updatedAt),
      indexableLocales: (lc) => isLandingVariantIndexable(lp, lc),
    });
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const r of routes) {
    const pathFor = (lc: Locale) => (r.localized ? r.localized(lc) : r.path);
    // Solo i locali indicizzabili: le varianti `noindex` (contenuto nordico non
    // tradotto) non vanno né come URL propria né come hreflang alternate.
    const langs = locales.filter((lc) =>
      r.indexableLocales ? r.indexableLocales(lc) : true,
    );
    for (const lc of langs) {
      entries.push({
        url: `${BASE}/${lc}${pathFor(lc)}`,
        lastModified: r.lastModified ?? now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
        alternates: {
          languages: Object.fromEntries([
            ...langs.map((l) => [l, `${BASE}/${l}${pathFor(l)}`]),
            ["x-default", `${BASE}/it${pathFor("it")}`],
          ]),
        },
      });
    }
  }
  return entries;
}
