import { describe, expect, it } from "vitest";
import type { BlogPost } from "@/lib/blog/types";
import type { Locale } from "@/lib/i18n";
import { HOMEPAGE_COPY } from "@/lib/content/homepage-copy";
import { ULTRA_GUIDE_SLUG, ultraGuideBlock } from "@/lib/content/ultra-guide-block";

// Post sintetico: il post reale non e' in questo ramo (arriva dalla lane guida).
const post = {
  slug: ULTRA_GUIDE_SLUG,
  hero: {
    title: { it: "Titolo guida", en: "Guide title", de: "Leitfaden-Titel" },
    subtitle: { it: "Sottotitolo guida", en: "Guide subtitle", de: "Leitfaden-Untertitel" },
  },
} as unknown as BlogPost;

const indexableIn = (langs: Locale[]) => (_p: BlogPost, lc: Locale) => langs.includes(lc);
const href = (_p: BlogPost, lc: Locale) => `/${lc}/blog/${ULTRA_GUIDE_SLUG}`;

describe("ultraGuideBlock", () => {
  it("null se il post non e' nel catalogo", () => {
    expect(
      ultraGuideBlock({ postsBySlug: {}, lc: "it", isBlogVariantIndexable: indexableIn(["it"]), blogLinkHref: href }),
    ).toBeNull();
  });

  it("null se la variante nella lingua della pagina non e' indicizzabile (niente rinvio all'inglese)", () => {
    const r = ultraGuideBlock({
      postsBySlug: { [ULTRA_GUIDE_SLUG]: post },
      lc: "fr",
      isBlogVariantIndexable: indexableIn(["it", "en"]),
      // anche se il resolver darebbe un href di ripiego inglese, il blocco non si rende
      blogLinkHref: () => `/en/blog/${ULTRA_GUIDE_SLUG}`,
    });
    expect(r).toBeNull();
  });

  it("null se il resolver non da' un href", () => {
    expect(
      ultraGuideBlock({
        postsBySlug: { [ULTRA_GUIDE_SLUG]: post },
        lc: "it",
        isBlogVariantIndexable: indexableIn(["it"]),
        blogLinkHref: () => null,
      }),
    ).toBeNull();
  });

  it("con post presente e variante indicizzabile: testo dal post, etichette dalle chiavi esistenti", () => {
    const r = ultraGuideBlock({
      postsBySlug: { [ULTRA_GUIDE_SLUG]: post },
      lc: "de",
      isBlogVariantIndexable: indexableIn(["it", "en", "de"]),
      blogLinkHref: href,
    });
    expect(r).toEqual({
      href: `/de/blog/${ULTRA_GUIDE_SLUG}`,
      kicker: HOMEPAGE_COPY.guideLabel.de,
      title: "Leitfaden-Titel",
      text: "Leitfaden-Untertitel",
      readLabel: HOMEPAGE_COPY.readLabel.de,
    });
  });

  it("slug alternativo (override) letto dal catalogo", () => {
    const r = ultraGuideBlock({
      postsBySlug: { altro: post },
      lc: "it",
      isBlogVariantIndexable: indexableIn(["it"]),
      blogLinkHref: href,
      slug: "altro",
    });
    expect(r?.title).toBe("Titolo guida");
  });
});
