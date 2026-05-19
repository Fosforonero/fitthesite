import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/lib/i18n";
import { PROVIDERS } from "@/lib/providers/data";
import { listAllSlugs } from "@/lib/blog/loader";

const BASE = "https://www.fitmesh.fit";

/**
 * Sitemap multi-locale con hreflang alternates per ogni URL.
 * Google usa <xhtml:link rel="alternate" hreflang="..."> emessi automaticamente
 * da Next.js a partire dal campo `alternates.languages` qui sotto.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: Array<{ path: string; changeFrequency: "monthly" | "yearly" | "weekly"; priority: number }> = [
    { path: "",                              changeFrequency: "monthly", priority: 1.0 },
    { path: "/about",                        changeFrequency: "monthly", priority: 0.85 },
    { path: "/integrations",                 changeFrequency: "weekly",  priority: 0.9 },
    { path: "/devices",                      changeFrequency: "monthly", priority: 0.8 },
    // Landing SEO long-tail strengths-based (sprint S-3 2026-05-19)
    { path: "/dashboard-galaxy-watch",       changeFrequency: "monthly", priority: 0.85 },
    { path: "/wear-os-dashboard",            changeFrequency: "monthly", priority: 0.85 },
    { path: "/smartwatch-dashboard-privacy", changeFrequency: "monthly", priority: 0.85 },
    { path: "/beta",                         changeFrequency: "weekly",  priority: 0.95 },
    { path: "/field-notes",                  changeFrequency: "weekly",  priority: 0.75 },
    { path: "/support",                      changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy",                      changeFrequency: "yearly",  priority: 0.5 },
    { path: "/terms",                        changeFrequency: "yearly",  priority: 0.5 },
    { path: "/cookies",                      changeFrequency: "yearly",  priority: 0.4 },
  ];

  // Una landing per provider — priorità 0.8 (alta: pagine SEO-target)
  for (const p of PROVIDERS) {
    routes.push({
      path: `/sync/${p.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  // Articoli blog — emessi per locale specifica (no hreflang alternates
  // perche' ogni articolo esiste solo in IT o solo in EN, raramente entrambi).
  const blogSlugs = await listAllSlugs();

  const entries: MetadataRoute.Sitemap = [];

  // Blog posts: una entry per (slug, locale) presente sul filesystem.
  for (const post of blogSlugs) {
    entries.push({
      url: `${BASE}/${post.locale}/field-notes/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  for (const r of routes) {
    for (const lc of locales) {
      entries.push({
        url: `${BASE}/${lc}${r.path}`,
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
        alternates: {
          languages: Object.fromEntries([
            ...locales.map((l) => [l, `${BASE}/${l}${r.path}`]),
            ["x-default", `${BASE}/it${r.path}`],
          ]),
        },
      });
    }
  }
  return entries;
}
