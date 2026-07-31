import { describe, expect, it } from "vitest";

import {
  CTA_CAMPAIGN,
  CTA_NO_STORE_DESTINATION,
  CTA_PLACEMENTS,
  resolveStoreLink,
  storeButtonsCtaId,
} from "./cta";

describe("CTA_CAMPAIGN — costante condivisa del funnel post-Founder", () => {
  it("vale post_founder_trial", () => {
    expect(CTA_CAMPAIGN).toBe("post_founder_trial");
  });
});

describe("CTA_PLACEMENTS — vocabolario dei placement", () => {
  it("non contiene valori duplicati (un duplicato fonderebbe due segmenti in GA4)", () => {
    const values = Object.values(CTA_PLACEMENTS);
    expect(new Set(values).size).toBe(values.length);
  });

  it("copre le CTA di navigazione (header desktop + menu mobile)", () => {
    expect(CTA_PLACEMENTS.headerPrimary).toBe("header_primary");
    expect(CTA_PLACEMENTS.mobileMenuPrimary).toBe("mobile_menu_primary");
  });
});

describe("storeButtonsCtaId", () => {
  it("deriva l'id dal placement, senza tabelle parallele da tenere allineate", () => {
    expect(storeButtonsCtaId(CTA_PLACEMENTS.homepagePricingTrial)).toBe(
      "store_buttons_homepage_pricing_trial",
    );
  });
});

describe("resolveStoreLink", () => {
  it("riconosce Google Play", () => {
    expect(resolveStoreLink("https://play.google.com/store/apps/details?id=fit.fitmesh")).toEqual({
      platform: "play",
      destination: "Google Play",
    });
  });

  it("riconosce l'App Store", () => {
    expect(resolveStoreLink("https://apps.apple.com/app/id6779751708")).toEqual({
      platform: "appstore",
      destination: "App Store",
    });
  });

  it("restituisce null per le ancore interne (nessuno store_click sull'header)", () => {
    expect(resolveStoreLink("/it#download")).toBeNull();
    expect(resolveStoreLink("")).toBeNull();
  });
});

describe("CTA_NO_STORE_DESTINATION", () => {
  it("e' un valore esplicito, non una stringa vuota o undefined", () => {
    expect(CTA_NO_STORE_DESTINATION).toBe("none");
  });
});
