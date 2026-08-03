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
  FITNESS_DATA_SYNC_COMPLETE_LOCALES,
} from "@/lib/content/static-page-locales";
import { LABS_LOCALES, liveLabsTools, localizedLabsSlug } from "@/lib/labs/registry";
import { SITE_URL as BASE } from "@/lib/product-facts";

/**
 * Sitemap multi-locale con hreflang alternates per ogni URL.
 * Google usa <xhtml:link rel="alternate" hreflang="..."> emessi automaticamente
 * da Next.js a partire dal campo `alternates.languages` qui sotto.
 *
 * `priority`/`changeFrequency` NON sono più emessi: Google dichiara
 * esplicitamente di ignorarli (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#xml),
 * quindi sono solo peso morto nel file. `lastModified` è impostato SOLO dove
 * abbiamo una data reale (blog/landing hanno un campo `updatedAt` tracciato):
 * per le pagine marketing statiche (home, about, ecc.) non esiste una data di
 * ultima modifica affidabile in questo codebase, quindi il campo è OMESSO
 * invece di essere riempito con `new Date()` a ogni build/richiesta — un
 * lastmod che cambia a ogni deploy indipendentemente dal contenuto è un
 * segnale falso per Google, peggio che non fornirlo.
 *
 * Sections:
 *  - Static marketing (home, integrations, beta, ...)
 *  - Provider landings (/sync/[provider]) — 11 × 2 locales
 *  - Blog index (/blog) + articoli (/blog/[slug]) — 1 + 8 × 2 locales
 *  - Landing high-intent (/lp/[slug]) — 4 × 2 locales
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: Array<{
    path: string;
    /** Data reale dell'ultimo aggiornamento contenuto. Omessa = niente lastmod per questa route. */
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
    /**
     * Locale usato per l'hreflang "x-default" di questa route. Default "it"
     * (comportamento storico, invariato per tutto il sito). Labs (P1.1 Fase
     * 1) è l'unica eccezione: pubblico internazionale, x-default -> "en",
     * stessa scelta già fatta in labs/page.tsx e labs/[tool]/page.tsx.
     */
    xDefaultLocale?: Locale;
  }> = [
    { path: "",              indexableLocales: (lc) => HOME_COMPLETE_LOCALES.includes(lc) },
    { path: "/about",        indexableLocales: (lc) => ABOUT_TRANSLATED_LOCALES.includes(lc) },
    { path: "/press",        indexableLocales: (lc) => PRESS_COMPLETE_LOCALES.includes(lc) },
    { path: "/famiglia",     indexableLocales: (lc) => FAMIGLIA_COMPLETE_LOCALES.includes(lc) },
    { path: "/integrations" },
    { path: "/ai" },
    { path: "/roadmap",      indexableLocales: (lc) => ROADMAP_COMPLETE_LOCALES.includes(lc) },
    { path: "/fitness-data-sync", indexableLocales: (lc) => FITNESS_DATA_SYNC_COMPLETE_LOCALES.includes(lc) },
    // /beta RIMOSSA dalla sitemap in P0.10: e' diventata un archivio
    // informativo del programma Founder concluso (noindex, follow) —
    // non e' piu' una pagina che vogliamo indicizzare/scansionare come
    // target di acquisizione. Vedi generateMetadata in beta/page.tsx.
    // FitMesh Labs (sprint P1.0): solo it/en, mai le altre 13 locale —
    // vedi lib/labs/registry.ts (LABS_LOCALES) e locale-redirect.ts. Stessa
    // fonte di verità usata da generateStaticParams delle pagine Labs, così
    // sitemap e route non possono contraddirsi.
    { path: "/labs", indexableLocales: (lc) => LABS_LOCALES.includes(lc), xDefaultLocale: "en" },
    // Sprint P0.11-A: /self-host esiste solo it/en (pagina di stato, non
    // guida self-service) — stesso pattern di /labs sopra, coerente con
    // generateStaticParams della pagina e con il collasso nel middleware.
    { path: "/self-host", indexableLocales: (lc) => lc === "it" || lc === "en", xDefaultLocale: "en" },
    { path: "/blog" },
    { path: "/novita" },
    { path: "/support" },
    { path: "/privacy" },
    { path: "/terms" },
    { path: "/cookies" },
    { path: "/imprint" },
  ];

  // Tool FitMesh Labs — slug localizzato per it/en, mai le altre locale.
  for (const tool of liveLabsTools()) {
    routes.push({
      path: `/labs/${tool.key}`,
      localized: (lc) => `/labs/${localizedLabsSlug(tool, lc as "it" | "en")}`,
      indexableLocales: (lc) => LABS_LOCALES.includes(lc),
      xDefaultLocale: "en",
    });
  }

  // Una landing per provider.
  for (const p of PROVIDERS) {
    routes.push({
      path: `/sync/${p.slug}`,
      indexableLocales: (lc) => isProviderVariantIndexable(p, lc),
    });
  }

  // Model-level device pages.
  for (const [providerSlug, models] of Object.entries(PROVIDER_MODELS)) {
    for (const m of models) {
      routes.push({
        path: `/sync/${providerSlug}/${m.slug}`,
        indexableLocales: (lc) => isProviderModelVariantIndexable(m, lc),
      });
    }
  }

  // Articoli blog — lastModified reale da post.updatedAt (data curata a mano
  // a ogni revisione contenuto, non un timestamp di build).
  for (const p of await getBlogPosts()) {
    routes.push({
      path: `/blog/${p.slug}`,
      localized: (lc) => `/blog/${localizedBlogSlug(p.slug, lc)}`,
      lastModified: new Date(p.updatedAt),
      indexableLocales: (lc) => isBlogVariantIndexable(p, lc),
    });
  }

  // Landing high-intent — lastModified reale da lp.updatedAt.
  for (const lp of LANDING_PAGES) {
    routes.push({
      path: `/lp/${lp.slug}`,
      localized: (lc) => `/lp/${localizedLandingSlug(lp.slug, lc)}`,
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
        ...(r.lastModified && { lastModified: r.lastModified }),
        alternates: {
          languages: Object.fromEntries([
            ...langs.map((l) => [l, `${BASE}/${l}${pathFor(l)}`]),
            ["x-default", `${BASE}/${r.xDefaultLocale ?? "it"}${pathFor(r.xDefaultLocale ?? "it")}`],
          ]),
        },
      });
    }
  }

  // /delete-account (P0.4D): URL unico, non localizzato (niente hreflang
  // alternates, non esistono varianti /it/delete-account, /de/delete-account,
  // ecc — vedi middleware.ts NON_LOCALIZED_PREFIXES).
  entries.push({ url: `${BASE}/delete-account` });

  return entries;
}
