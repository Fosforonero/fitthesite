import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { locales, getDictionary, type Locale } from "@/lib/i18n";

/**
 * Corsia F (14/10/2026): sezione Social del footer = Reddit (gated),
 * Instagram, Facebook, LinkedIn. Il DOM e' prodotto dal Footer reale.
 */
const FACEBOOK = "https://www.facebook.com/fitmeshsync/";
const LINKEDIN = "https://www.linkedin.com/company/fitmesh/";
const REDDIT = "https://www.reddit.com/r/FitMesh/";
const INSTAGRAM = "https://www.instagram.com/fitmesh_sync/";

async function socialAnchors(locale: Locale) {
  const { default: Footer, SOCIAL_SECTION_TITLE } = await import("./Footer");
  const dict = await getDictionary(locale);
  const html = renderToStaticMarkup(Footer({ dict, locale }));
  const start = html.indexOf(SOCIAL_SECTION_TITLE[locale]);
  expect(start).toBeGreaterThan(-1);
  const ul = html.slice(start).match(/<ul[\s\S]*?<\/ul>/)?.[0] ?? "";
  const anchors = [...ul.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
    attrs: m[1],
    inner: m[2],
    href: m[1].match(/href="([^"]*)"/)?.[1] ?? "",
    text: m[2].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, "").trim(),
  }));
  return { html, ul, anchors, title: SOCIAL_SECTION_TITLE[locale] };
}

afterEach(() => {
  vi.doUnmock("@/lib/flags");
  vi.resetModules();
});

describe("Footer social: Facebook e LinkedIn", () => {
  for (const locale of locales) {
    it(`[${locale}] ordine Reddit, Instagram, Facebook, LinkedIn con attributi corretti`, async () => {
      const { anchors, ul, title } = await socialAnchors(locale);
      expect(title.length).toBeGreaterThan(0);
      expect(anchors.map((a) => a.href)).toEqual([REDDIT, INSTAGRAM, FACEBOOK, LINKEDIN]);
      expect(anchors.map((a) => a.text)).toEqual(["Reddit", "Instagram", "Facebook", "LinkedIn"]);
      expect(new Set(anchors.map((a) => a.href)).size).toBe(anchors.length);
      for (const a of anchors) {
        expect(a.href).not.toContain("/home");
        expect(a.text.length).toBeGreaterThan(0);
        expect(a.attrs).toContain('target="_blank"');
        expect(a.attrs).toContain('rel="noopener noreferrer"');
        expect(a.attrs).toContain("min-h-[44px]");
        expect(a.attrs).toContain("min-w-[44px]");
        expect(a.attrs).toContain("focus-visible:outline");
        expect(a.attrs).not.toMatch(/-m[ytb]-\d/);
        expect(a.inner).toMatch(/<svg[^>]*aria-hidden="true"/);
        expect(a.inner).toMatch(/<svg[^>]*focusable="false"/);
        expect(a.inner).not.toMatch(/<title|aria-label/);
      }
      // nessun nuovo tracking sui due link nuovi; Reddit conserva il proprio
      expect(anchors[0].attrs).toContain("data-cta-placement");
      expect(anchors[1].attrs).not.toContain("data-cta-placement");
      expect(anchors[2].attrs).not.toContain("data-cta-placement");
      expect(anchors[3].attrs).not.toContain("data-cta-placement");
      // nessuna risorsa remota incorporata
      expect(ul).not.toMatch(/<(iframe|script|img|link|embed|object)\b/i);
    });
  }

  it("senza REDDIT_COMMUNITY_LIVE restano Instagram, Facebook, LinkedIn", async () => {
    vi.resetModules();
    vi.doMock("@/lib/flags", async (orig) => ({
      ...(await orig<typeof import("@/lib/flags")>()),
      REDDIT_COMMUNITY_LIVE: false,
    }));
    const { anchors } = await socialAnchors("it");
    expect(anchors.map((a) => a.href)).toEqual([INSTAGRAM, FACEBOOK, LINKEDIN]);
  });
});
