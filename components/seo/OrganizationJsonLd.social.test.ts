import { describe, expect, it, vi, afterEach } from "vitest";
import { execFileSync } from "node:child_process";

import { organizationJsonLdData } from "./OrganizationJsonLd";
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

  it("identita' invariata rispetto a main (c011056)", () => {
    const src = execFileSync(
      "git",
      ["--no-optional-locks", "show", "c011056b0c2091b9282b530799fdf96972476695:components/seo/OrganizationJsonLd.tsx"],
      { encoding: "utf8" },
    );
    expect(src).toContain('"@id": `${SITE_URL}#organization`');
    expect(src).toContain("name: PRODUCT_NAME,");
    expect(src).toContain("url: SITE_URL,");
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
