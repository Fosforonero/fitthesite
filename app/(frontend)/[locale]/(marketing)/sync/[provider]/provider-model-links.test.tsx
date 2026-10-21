import { describe, expect, it, vi } from "vitest";

// Sorgente CMS sostituita dai post statici: nessun @payload-config in test, nessuna rete.
vi.mock("@/lib/blog/payload-source", async () => {
  const { BLOG_POSTS: posts } = await import("@/lib/blog/data");
  return {
    getBlogPosts: async () => posts,
    getBlogPostsBySlug: async () => Object.fromEntries(posts.map((p) => [p.slug, p])),
    getBlogPostBySlug: async (slug: string) => posts.find((p) => p.slug === slug) ?? null,
  };
});

import { renderToStaticMarkup } from "react-dom/server";
import ProviderLanding from "./page";
import { PROVIDER_MODELS } from "@/lib/providers/models";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { providerModelLinkHref } from "@/lib/providers/indexability";
import type { Locale } from "@/lib/i18n";

async function render(provider: string, locale: string): Promise<string> {
  return renderToStaticMarkup(await ProviderLanding({ params: Promise.resolve({ locale, provider }) }));
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);
}

function modelSection(html: string): string {
  const m = html.match(/<section[^>]*data-section="provider-models"[\s\S]*?<\/section>/);
  return m ? m[0] : "";
}

describe("SITO-LINKING-01: la pagina provider collega i modelli con normali a[href]", () => {
  it("Garmin IT/EN: ogni modello e' un link HTML nella sezione dedicata, Vivoactive 5 compreso", async () => {
    for (const lc of ["it", "en"] as const) {
      const html = await render("garmin", lc);
      const section = modelSection(html);
      expect(section, `sezione modelli assente in ${lc}`).not.toBe("");
      const links = hrefs(section);
      expect(links).toContain(`/${lc}/sync/garmin/vivoactive-5`);
      expect(links).toHaveLength(PROVIDER_MODELS["garmin"].length);
    }
  });

  it("Colmi: l'unico modello (R02) e' raggiungibile dalla pagina provider", async () => {
    const html = await render("colmi-ring", "en");
    expect(hrefs(modelSection(html))).toEqual(["/en/sync/colmi-ring/r02"]);
  });

  it("i collegamenti coincidono con la regola di pubblicabilita' (nessun link a varianti non indicizzabili)", async () => {
    for (const slug of Object.keys(PROVIDER_MODELS)) {
      const p = PROVIDERS_BY_SLUG[slug];
      for (const lc of ["it", "en", "de", "ja", "sv"] as const) {
        const html = await render(slug, lc);
        const expected = PROVIDER_MODELS[slug]
          .map((m) => providerModelLinkHref(p, m, lc as Locale))
          .filter((h): h is string => h !== null);
        expect(hrefs(modelSection(html)), `${slug}/${lc}`).toEqual(expected);
      }
    }
  });

  it("se la destinazione ricade sull'inglese per un lettore non inglese, il cambio lingua e' dichiarato", async () => {
    const html = await render("garmin", "sv");
    const section = modelSection(html);
    if (section) {
      const anchors = [...section.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
      for (const [, href, label] of anchors) {
        if (href.startsWith("/en/")) expect(label).toContain("(EN)");
      }
    }
  });

  it("nessuna dichiarazione di compatibilita' nella sezione: solo nome del modello e frase di servizio", async () => {
    const section = modelSection(await render("garmin", "en"));
    const text = section.replace(/<[^>]+>/g, " ");
    expect(text).not.toMatch(/compatible|supported|verified|works with|certified/i);
  });

  it("le pagine provider Garmin IT/EN collegano la guida Health Connect non si sincronizza tra gli approfondimenti", async () => {
    for (const lc of ["it", "en"] as const) {
      const links = hrefs(await render("garmin", lc));
      expect(links.some((h) => /^\/(it|en)\/blog\/health-connect-not-syncing$|^\/(it|en)\/blog\/health-connect-non-si-sincronizza/.test(h)), lc).toBe(true);
    }
  });
});
