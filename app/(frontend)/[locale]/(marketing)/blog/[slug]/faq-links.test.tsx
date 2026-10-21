import { describe, expect, it, vi } from "vitest";

// Sorgente CMS sostituita dai post statici: nessun @payload-config in test, nessuna rete.
vi.mock("@/lib/blog/payload-source", async () => {
  const { BLOG_POSTS: posts } = await import("@/lib/blog/data");
  return {
    getBlogPosts: async () => posts,
    getBlogPostsBySlug: async () => Object.fromEntries(posts.map((p) => [p.slug, p])),
    getBlogPostBySlug: async (slug: string) => posts.find((p) => p.slug === slug) ?? null,
    getBlogSlugs: async () => posts.map((p) => p.slug),
    getRelatedPosts: async (slugs: string[] | undefined) => posts.filter((p) => (slugs ?? []).includes(p.slug)),
  };
});

import { renderToStaticMarkup } from "react-dom/server";
import BlogArticle from "./page";

async function render(locale: string, slug: string): Promise<string> {
  return renderToStaticMarkup(await BlogArticle({ params: Promise.resolve({ locale, slug }) }));
}

describe("SITO-LINKING-01: le risposte FAQ del blog rendono i collegamenti, non il markdown grezzo", () => {
  it("guida Garmin/Samsung IT/EN: il link nella FAQ e' un a[href] e nessuna sintassi [..](..) resta visibile", async () => {
    for (const [lc, slug] of [["it", "garmin-samsung-health-sync-guide"], ["en", "sync-garmin-samsung-health-guide"]] as const) {
      const html = await render(lc, slug);
      const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
      expect(visible, `${lc}: markdown grezzo visibile`).not.toMatch(/\]\((\/|https?:)/);
      expect(html).toMatch(new RegExp(`<a [^>]*href="/${lc}/blog/(esportare-dati-garmin|export-garmin-data)"`));
    }
  });

  it("guida Health Connect (FAQ con fonti esterne): le fonti sono link con rel noopener noreferrer", async () => {
    const html = await render("en", "health-connect-not-syncing");
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
    expect(visible).not.toMatch(/\]\((\/|https?:)/);
    const faqBlocks = (visible.match(/<details[\s\S]*?<\/details>/g) ?? []).join("");
    const external = [...faqBlocks.matchAll(/<a [^>]*href="https?:\/\/(?!www\.fitmesh\.fit)[^"]+"[^>]*>/g)].map((m) => m[0]);
    expect(external.length).toBeGreaterThan(0);
    for (const a of external) expect(a, a).toMatch(/rel="[^"]*noopener[^"]*noreferrer[^"]*"/);
  });

  it("i dati strutturati FAQ restano testo semplice", async () => {
    const html = await render("en", "sync-garmin-samsung-health-guide");
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((j) => j.includes("FAQPage"));
    expect(ld.length).toBeGreaterThan(0);
    for (const j of ld) expect(j).not.toMatch(/\]\((\/|https?:)/);
  });
});
