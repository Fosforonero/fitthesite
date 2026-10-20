import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlogRenderer } from "@/components/blog/BlogRenderer";
import { BLOG_POSTS } from "./data";
import { BLOG_SLUGS } from "./slugs";
import { coverSrc, coverAlt, coverCaption, POST_COVER } from "./covers";
import { isBlogVariantIndexable, REDIRECT_INCOMPLETE_LOCALE_SLUGS, blogLanguages } from "./indexability";
import { blogSeoTitle } from "./types";
import { locales } from "@/lib/i18n";

describe("apple-watch-galaxy-watch-dati-fitmesh (IT/EN smartwatch comparison)", () => {
  const post = BLOG_POSTS.find((p) => p.slug === "apple-watch-galaxy-watch-dati-fitmesh");

  it("is registered in BLOG_POSTS, BLOG_SLUGS, POST_COVER, and REDIRECT_INCOMPLETE_LOCALE_SLUGS", () => {
    expect(post).toBeDefined();
    expect(BLOG_SLUGS["apple-watch-galaxy-watch-dati-fitmesh"]?.en).toBe(
      "apple-watch-galaxy-watch-fitmesh-data",
    );
    expect(POST_COVER["apple-watch-galaxy-watch-dati-fitmesh"]).toBe("watchDataComparison");
    expect(REDIRECT_INCOMPLETE_LOCALE_SLUGS.has("apple-watch-galaxy-watch-dati-fitmesh")).toBe(true);
  });

  it("is indexable only in IT and EN and emits only IT, EN, and x-default in blogLanguages()", () => {
    expect(post).toBeDefined();
    if (!post) return;
    expect(isBlogVariantIndexable(post, "it")).toBe(true);
    expect(isBlogVariantIndexable(post, "en")).toBe(true);
    for (const lc of locales) {
      if (lc === "it" || lc === "en") continue;
      expect(isBlogVariantIndexable(post, lc), lc).toBe(false);
    }
    const langs = blogLanguages(post);
    expect(Object.keys(langs).sort()).toEqual(["en", "it", "x-default"]);
    expect(langs.it).toContain("/it/blog/apple-watch-galaxy-watch-dati-fitmesh");
    expect(langs.en).toContain("/en/blog/apple-watch-galaxy-watch-fitmesh-data");
  });

  it("configures cover metadata, SEO titles within budget, BlogPosting ldType, and no FAQPage", () => {
    expect(post).toBeDefined();
    if (!post) return;
    expect(coverSrc(post)).toBe("/blog/covers/watch-data-comparison-20261017.webp");
    expect(coverAlt(post, "it")).toContain("smartwatch");
    expect(coverAlt(post, "en")).toContain("smartwatch");
    expect(coverCaption(post, "it")).toContain("Apple Watch e Galaxy Watch");
    expect(coverCaption(post, "en")).toContain("Apple Watch and Galaxy Watch");
    expect(blogSeoTitle(post, "it").length).toBeLessThanOrEqual(55);
    expect(blogSeoTitle(post, "en").length).toBeLessThanOrEqual(55);
    expect(post.ldType).toBe("BlogPosting");
    expect(post.faq).toBeUndefined();
  });

  it("preserves all required claim boundaries, 4 internal links, rendered HTML, and zero em dashes", () => {
    expect(post).toBeDefined();
    if (!post) return;
    const raw = JSON.stringify(post);
    expect(raw).not.toContain("\u2014");

    // 11:50 required candidate vs distributed separation in comparison table
    expect(raw).toContain(
      "Comportamento verificato nel candidato; disponibilità nella versione distribuita non verificata in questa analisi.",
    );
    expect(raw).toContain(
      "Behavior verified in the candidate; availability in the distributed version was not verified in this analysis.",
    );

    // Energy Score attributed to Samsung Health Data SDK, distinct from Health Connect and FitMesh
    expect(raw).toContain("Samsung Health Data SDK");

    // Render IT and EN HTML via BlogRenderer
    const htmlIt = renderToStaticMarkup(
      React.createElement(BlogRenderer, { sections: post.body, locale: "it" }),
    );
    const htmlEn = renderToStaticMarkup(
      React.createElement(BlogRenderer, { sections: post.body, locale: "en" }),
    );

    expect(htmlIt).not.toContain("\u2014");
    expect(htmlEn).not.toContain("\u2014");
    expect(htmlIt).toContain('href="/it/blog/hrv-cose-significato-valori"');
    expect(htmlIt).toContain('href="/it/blog/galaxy-watch-ultra2-watch9-health-connect"');
    expect(htmlIt).toContain('href="/it/blog/nuova-apple-health-rende-inutili-altre-app"');
    expect(htmlIt).toContain('href="/it/blog/come-funziona-health-connect"');
    expect(htmlEn).toContain('href="/en/blog/what-is-hrv-meaning-values"');
    expect(htmlEn).toContain('href="/en/blog/galaxy-watch-ultra2-watch9-health-connect"');
    expect(htmlEn).toContain('href="/en/blog/will-new-apple-health-replace-other-apps"');
    expect(htmlEn).toContain('href="/en/blog/how-does-health-connect-work"');
    expect(htmlIt).toContain("<table");
    expect(htmlEn).toContain("<table");
  });
});
