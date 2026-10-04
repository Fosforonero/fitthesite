import { describe, expect, it, vi } from "vitest";
import { locales } from "@/lib/i18n";
import { LANDING_PAGES, LANDING_PAGES_BY_SLUG } from "@/lib/landing/data";
import { WITHDRAWN_LANDING_SLUGS, isLandingVariantIndexable, landingLinkHref } from "@/lib/landing/indexability";
import { canonicalFromLandingUrl, localizedLandingSlug } from "@/lib/blog/slug-i18n";
import { BLOG_POSTS } from "@/lib/blog/data";

// Il catalogo del blog in sitemap viene dalla sorgente CMS: qui il test usa i
// post statici, che sono gli stessi dati senza rete.
vi.mock("@/lib/blog/payload-source", async () => {
  const { BLOG_POSTS: posts } = await import("@/lib/blog/data");
  return { getBlogPosts: async () => posts, getBlogPostsBySlug: async () => posts };
});

/**
 * MICRO-GATE K3 (decisione PM del 01/10/2026): tre landing ritirate
 * temporaneamente dall'indice in tutte le lingue. Il noindex da solo non basta:
 * qui si verifica che sitemap, hreflang, robots e link interni siano coerenti,
 * perche' tutti leggono la stessa funzione (isLandingVariantIndexable).
 */

const WITHDRAWN = [...WITHDRAWN_LANDING_SLUGS];

describe("K3: landing ritirate dall'indice", () => {
  it("il set contiene esattamente le tre landing decise e tutte esistono", () => {
    expect([...WITHDRAWN].sort()).toEqual(["apple-health-export", "backup-galaxy-watch", "fitbit-export-google"]);
    for (const s of WITHDRAWN) expect(LANDING_PAGES_BY_SLUG[s], s).toBeDefined();
  });

  it("nessuna lingua e' indicizzabile e nessun link interno le raggiunge", () => {
    for (const s of WITHDRAWN) {
      const lp = LANDING_PAGES_BY_SLUG[s];
      for (const lc of locales) {
        expect(isLandingVariantIndexable(lp, lc), `${s}/${lc} indicizzabile`).toBe(false);
        expect(landingLinkHref(lp, lc), `${s}/${lc} link interno`).toBeNull();
      }
    }
  });

  it("le altre landing non sono toccate: it ed en restano indicizzabili", () => {
    const altre = LANDING_PAGES.filter((lp) => !WITHDRAWN_LANDING_SLUGS.has(lp.slug));
    expect(altre.length).toBe(LANDING_PAGES.length - 3);
    for (const lp of altre) {
      expect(isLandingVariantIndexable(lp, "it"), lp.slug).toBe(true);
      expect(isLandingVariantIndexable(lp, "en"), lp.slug).toBe(true);
    }
  });

  it("sitemap: nessun URL delle tre landing, in nessuna lingua; le altre restano", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    for (const s of WITHDRAWN) {
      for (const lc of locales) {
        const u = `/${lc}/lp/${localizedLandingSlug(s, lc)}`;
        expect(
          urls.some((x) => x.endsWith(u)),
          `sitemap contiene ${u}`,
        ).toBe(false);
      }
    }
    const lpUrls = urls.filter((u) => /\/lp\//.test(u));
    expect(lpUrls.length).toBeGreaterThan(50);
    for (const e of entries.filter((x) => /\/lp\//.test(x.url))) {
      const langs = (e.alternates?.languages ?? {}) as Record<string, string>;
      for (const href of Object.values(langs)) {
        for (const s of WITHDRAWN) {
          for (const lc of locales) {
            expect(href.endsWith(`/${lc}/lp/${localizedLandingSlug(s, lc)}`), `hreflang di ${e.url} verso ${href}`).toBe(false);
          }
        }
      }
    }
  });

  it("pagina: robots noindex e nessun hreflang per ogni lingua delle tre landing", async () => {
    const page = await import("@/app/(frontend)/[locale]/(marketing)/lp/[slug]/page");
    for (const s of WITHDRAWN) {
      for (const lc of locales) {
        const md = await page.generateMetadata({
          params: Promise.resolve({ locale: lc, slug: localizedLandingSlug(s, lc) }),
        });
        expect(md.robots, `${s}/${lc} robots`).toMatchObject({ index: false });
        expect(md.alternates?.languages ?? {}, `${s}/${lc} hreflang`).toEqual({});
      }
    }
  });

  it("nessun contenuto del blog collega le tre landing (nemmeno con un href scritto a mano)", () => {
    const hits: string[] = [];
    const walk = (node: unknown, where: string) => {
      if (typeof node === "string") {
        for (const m of node.matchAll(/\/lp\/([a-z0-9-]+)/g)) {
          const slug = m[1];
          const lc = (node.match(/\/([a-z]{2})\/lp\//)?.[1] ?? "it") as (typeof locales)[number];
          const canonical = canonicalFromLandingUrl(slug, lc) ?? slug;
          if (WITHDRAWN_LANDING_SLUGS.has(canonical)) hits.push(`${where}: ${m[0]}`);
        }
      } else if (Array.isArray(node)) node.forEach((x, i) => walk(x, `${where}[${i}]`));
      else if (node && typeof node === "object")
        for (const [k, v] of Object.entries(node)) walk(v, `${where}.${k}`);
    };
    for (const p of BLOG_POSTS) walk(p, p.slug);
    expect(hits).toEqual([]);
  });
});
