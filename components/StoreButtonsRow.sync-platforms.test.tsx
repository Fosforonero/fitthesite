import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StoreButtonsRow from "./StoreButtonsRow";
import { CTA_PLACEMENTS } from "@/lib/analytics/cta";

describe("StoreButtonsRow: platform filtering in sync mid-matrix CTA (ADDENDUM 19/10/2026)", () => {
  it("Android-only provider: nasconde il badge App Store senza mostrare Coming Soon o In arrivo", () => {
    const htmlIt = renderToStaticMarkup(
      <StoreButtonsRow
        locale="it"
        platforms={["android"]}
        iosDisabled={true}
        ctaLocation={CTA_PLACEMENTS.syncProviderMidMatrix}
      />
    );
    expect(htmlIt).toContain("play.google.com");
    expect(htmlIt).toContain("Google Play");
    expect(htmlIt).not.toContain("App Store");
    expect(htmlIt).not.toContain("In arrivo");
    expect(htmlIt).not.toContain("Coming Soon");

    const htmlEn = renderToStaticMarkup(
      <StoreButtonsRow
        locale="en"
        platforms={["android"]}
        iosDisabled={true}
        ctaLocation={CTA_PLACEMENTS.syncProviderMidMatrix}
      />
    );
    expect(htmlEn).toContain("play.google.com");
    expect(htmlEn).toContain("Google Play");
    expect(htmlEn).not.toContain("App Store");
    expect(htmlEn).not.toContain("Coming Soon");
  });

  it("provider multi-piattaforma: mostra entrambi gli store", () => {
    const html = renderToStaticMarkup(
      <StoreButtonsRow
        locale="it"
        platforms={["android", "ios"]}
        iosDisabled={false}
        ctaLocation={CTA_PLACEMENTS.syncProviderMidMatrix}
      />
    );
    expect(html).toContain("play.google.com");
    expect(html).toContain("apps.apple.com");
  });
});
