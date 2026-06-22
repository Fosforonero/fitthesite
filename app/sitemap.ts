import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/lib/i18n";
import { PROVIDERS } from "@/lib/providers/data";
import { PROVIDER_MODELS } from "@/lib/providers/models";
import { getBlogPosts } from "@/lib/blog/payload-source";
import { LANDING_PAGES } from "@/lib/landing/data";
import { localizedBlogSlug, localizedLandingSlug } from "@/lib/blog/slug-i18n";

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
  }> = [
    { path: "",              changeFrequency: "monthly", priority: 1.0 },
    { path: "/about",        changeFrequency: "monthly", priority: 0.85 },
    { path: "/press",        changeFrequency: "monthly", priority: 0.7 },
    { path: "/famiglia",     changeFrequency: "monthly", priority: 0.95 },
    { path: "/integrations", changeFrequency: "weekly",  priority: 0.9 },
    { path: "/roadmap",      changeFrequency: "weekly",  priority: 0.6 },
    { path: "/beta",         changeFrequency: "weekly",  priority: 0.95 },
    { path: "/blog",         changeFrequency: "daily",   priority: 0.85 },
    { path: "/novita",       changeFrequency: "weekly",  priority: 0.8 },
    { path: "/support",      changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy",      changeFrequency: "yearly",  priority: 0.5 },
    { path: "/terms",        changeFrequency: "yearly",  priority: 0.5 },
    { path: "/cookies",      changeFrequency: "yearly",  priority: 0.4 },
  ];

  // Una landing per provider — priorità 0.8 (alta: pagine SEO-target)
  for (const p of PROVIDERS) {
    routes.push({
      path: `/sync/${p.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  // Model-level device pages — priorità 0.7, yearly (specs stabili)
  for (const [providerSlug, models] of Object.entries(PROVIDER_MODELS)) {
    for (const m of models) {
      routes.push({
        path: `/sync/${providerSlug}/${m.slug}`,
        changeFrequency: "yearly",
        priority: 0.7,
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
    });
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const r of routes) {
    const pathFor = (lc: Locale) => (r.localized ? r.localized(lc) : r.path);
    for (const lc of locales) {
      entries.push({
        url: `${BASE}/${lc}${pathFor(lc)}`,
        lastModified: r.lastModified ?? now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
        alternates: {
          languages: Object.fromEntries([
            ...locales.map((l) => [l, `${BASE}/${l}${pathFor(l)}`]),
            ["x-default", `${BASE}/it${pathFor("it")}`],
          ]),
        },
      });
    }
  }
  return entries;
}
