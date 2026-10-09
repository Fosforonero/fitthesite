import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { CTA_PLACEMENTS, storeButtonsCtaId } from "@/lib/analytics/cta";
import type { BlogSection } from "@/lib/blog/types";
import { BlogRenderer } from "./BlogRenderer";

/**
 * CONVERSION-01: il blocco `fitmesh-editorial-cta` inoltra la proprieta' opzionale `platforms` a StoreButtonsRow.
 * Proprieta' omessa = comportamento precedente (entrambi i badge); `["android"]` = solo Google Play; `["ios"]` = solo App Store.
 * Tracking invariato: stessi data-attribute del modulo, quale che sia l'elenco dei badge.
 */

const PLAY = "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";
const APPLE = "apps.apple.com";

type EditorialCta = Extract<BlogSection, { type: "fitmesh-editorial-cta" }>;

function blocco(extra: Partial<EditorialCta> = {}): BlogSection {
  return {
    type: "fitmesh-editorial-cta",
    contentCluster: "google_health_vs_fit",
    placement: "after_solution",
    title: { it: "Titolo", en: "Title" },
    body: { it: "Corpo", en: "Body" },
    benefits: { it: ["uno", "due"], en: ["one", "two"] },
    ...extra,
  } as BlogSection;
}

function html(extra: Partial<EditorialCta> = {}, locale: "it" | "en" = "it"): string {
  return renderToStaticMarkup(<BlogRenderer sections={[blocco(extra)]} locale={locale} />);
}

describe("fitmesh-editorial-cta: inoltro di platforms a StoreButtonsRow", () => {
  it("proprieta' omessa: comportamento precedente invariato (Google Play e App Store)", () => {
    const out = html();
    expect(out).toContain(PLAY);
    expect(out).toContain(APPLE);
  });

  it("platforms=['android']: solo Google Play, nessun badge App Store", () => {
    const out = html({ platforms: ["android"] });
    expect(out).toContain(PLAY);
    expect(out).not.toContain(APPLE);
    expect(out).not.toContain("App Store");
  });

  it("platforms=['ios']: solo App Store, nessun badge Google Play", () => {
    const out = html({ platforms: ["ios"] });
    expect(out).toContain(APPLE);
    expect(out).not.toContain("play.google.com");
    expect(out).not.toContain("Google Play");
  });

  it("platforms=['android','ios']: entrambi, come se la proprieta' fosse omessa", () => {
    const out = html({ platforms: ["android", "ios"] });
    expect(out).toBe(html());
  });

  it("il tracking del modulo non dipende dall'elenco dei badge (data-attribute identici)", () => {
    const placement = CTA_PLACEMENTS.blogEditorialAfterSolution;
    for (const platforms of [undefined, ["android"] as const, ["ios"] as const]) {
      const out = html(platforms ? { platforms } : {});
      expect(out).toContain(`data-cta-content-cluster="google_health_vs_fit"`);
      expect(out).toContain(`data-cta-placement="${placement}"`);
      expect(out).toContain(`data-cta-id="${storeButtonsCtaId(placement)}"`);
      expect(out).toContain(`data-cta-target-type="store"`);
    }
  });

  it("anche in inglese: Google Play soltanto con platforms=['android']", () => {
    const out = html({ platforms: ["android"] }, "en");
    expect(out).toContain(PLAY);
    expect(out).not.toContain(APPLE);
  });
});
