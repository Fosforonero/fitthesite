import { describe, expect, it, vi, afterEach } from "vitest";

import { organizationJsonLdData } from "./OrganizationJsonLd";
import { AUTHOR } from "@/lib/seo/entities";
import {
  PLAY_STORE_URL,
  AVAILABILITY,
  REDDIT_URL,
  INSTAGRAM_URL,
  SITE_URL,
  PRODUCT_NAME,
} from "@/lib/product-facts";
import * as facts from "@/lib/product-facts";

const FACEBOOK = "https://www.facebook.com/fitmeshsync/";
const LINKEDIN = "https://www.linkedin.com/company/fitmesh/";

afterEach(() => {
  vi.doUnmock("@/lib/flags");
  vi.resetModules();
});

describe("Organization sameAs: Facebook e LinkedIn", () => {
  it("le costanti centralizzate in product-facts hanno gli URL esatti", () => {
    expect((facts as Record<string, unknown>).FACEBOOK_URL).toBe(FACEBOOK);
    expect((facts as Record<string, unknown>).LINKEDIN_URL).toBe(LINKEDIN);
  });

  for (const locale of ["it", "en", "de", "ja", "fi"] as const) {
    it(`[${locale}] sameAs contiene i due profili una volta sola e conserva gli altri`, () => {
      const d = organizationJsonLdData(locale);
      const same = d.sameAs as string[];
      expect(same.filter((u) => u === FACEBOOK)).toHaveLength(1);
      expect(same.filter((u) => u === LINKEDIN)).toHaveLength(1);
      expect(new Set(same).size).toBe(same.length);
      for (const u of [PLAY_STORE_URL, AVAILABILITY.ios.storeUrl, "https://www.fosforonero.com", INSTAGRAM_URL, REDDIT_URL]) {
        expect(same).toContain(u);
      }
      // i profili esistenti restano nell'ordine originale, i nuovi in coda
      expect(same).toEqual([
        PLAY_STORE_URL,
        AVAILABILITY.ios.storeUrl,
        "https://www.fosforonero.com",
        INSTAGRAM_URL,
        REDDIT_URL,
        FACEBOOK,
        LINKEDIN,
      ]);
      expect(d["@id"]).toBe(`${SITE_URL}#organization`);
      expect(d.name).toBe(PRODUCT_NAME);
      expect(d.url).toBe(SITE_URL);
    });
  }

  it("identita' dell'Organization invariata e profili sociali fuori da AUTHOR.sameAs", () => {
    // Valori dell'Organization di main (c011056): niente `git show`, il test
    // deve reggere anche in un estratto senza storia.
    const d = organizationJsonLdData("it");
    expect(d["@type"]).toBe("Organization");
    expect(d["@id"]).toBe(`${SITE_URL}#organization`);
    expect(d.name).toBe(PRODUCT_NAME);
    expect(d.alternateName).toEqual(["FitMesh"]);
    expect(d.url).toBe(SITE_URL);
    expect(d.email).toBe("hello@fitmesh.fit");
    expect(d.foundingDate).toBe("2026-04");
    // i due profili sono dell'Organization, non della persona autore
    expect(AUTHOR.sameAs).not.toContain(FACEBOOK);
    expect(AUTHOR.sameAs).not.toContain(LINKEDIN);
  });

  it("col gate Reddit spento sameAs perde solo Reddit", async () => {
    vi.resetModules();
    vi.doMock("@/lib/flags", async (orig) => ({
      ...(await orig<typeof import("@/lib/flags")>()),
      REDDIT_COMMUNITY_LIVE: false,
    }));
    const mod = await import("./OrganizationJsonLd");
    const same = mod.organizationJsonLdData("en").sameAs as string[];
    expect(same).not.toContain(REDDIT_URL);
    expect(same.slice(-2)).toEqual([FACEBOOK, LINKEDIN]);
  });
});
