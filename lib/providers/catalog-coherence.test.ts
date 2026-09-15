import { describe, expect, it } from "vitest";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import {
  SUPPORTED_PROVIDERS_ANDROID,
  SUPPORTED_PROVIDERS_IOS,
} from "@/lib/product-facts";
import { isProviderVariantIndexable } from "@/lib/providers/indexability";
import { LANDING_PAGES } from "@/lib/landing/data";
import { ABOUT_COPY } from "@/lib/content/about-copy";
import type { Locale } from "@/lib/i18n";

const PROVIDER_LOCALES: Locale[] = [
  "it",
  "en",
  "es",
  "de",
  "pt",
  "fr",
  "pl",
  "tr",
  "nl",
  "ja",
  "ko",
];

describe("P0.22-C Catalog & Integration Matrix Coherence Guardrails", () => {
  describe("Oura Ring Catalog & Bridge Guardrails", () => {
    const oura = PROVIDERS_BY_SLUG["oura"];

    it("has status 'live-bridge', platforms ['android', 'ios'], and syncMechanism 'system-bridge'", () => {
      expect(oura).toBeDefined();
      expect(oura.status).toBe("live-bridge");
      expect(oura.platforms).toContain("android");
      expect(oura.platforms).toContain("ios");
      expect(oura.syncMechanism).toBe("system-bridge");
    });

    it("has accurate dataTypes reflecting system bridge (no autonomous distance or SpO2)", () => {
      const isDataTypeSupported = (key: string) =>
        oura.dataTypes.find((d) => d.key === key)?.supported;

      expect(isDataTypeSupported("steps")).toBe(true);
      expect(isDataTypeSupported("distance")).toBe(false);
      expect(isDataTypeSupported("workouts")).toBe(true);
      expect(isDataTypeSupported("spo2")).toBe(false);
      expect(isDataTypeSupported("sleep")).toBe(true);
      expect(isDataTypeSupported("hr")).toBe(true);
    });

    it("does not promise direct API as live, ETA, or proprietary metrics (Readiness/temperature) via bridge", () => {
      const allText = JSON.stringify({
        tagline: oura.tagline,
        longDesc: oura.longDesc,
        techNote: oura.techNote,
        faqs: oura.faqs,
      });

      expect(allText).not.toMatch(/Q3 2026|T3 2026|Q4 2026/);
      expect(allText).not.toMatch(/Readiness Score.*disponibile oggi/i);
    });

    it("has authentic, non-English-copy-paste FAQ translations for FR and KO", () => {
      for (let i = 0; i < oura.faqs.length; i++) {
        const faq = oura.faqs[i];
        expect(faq.q.fr).not.toBe(faq.q.en);
        expect(faq.a.fr).not.toBe(faq.a.en);
        expect(faq.q.ko).not.toBe(faq.q.en);
        expect(faq.a.ko).not.toBe(faq.a.en);
      }
    });

    it("is indexable across all 11 provider catalog locales", () => {
      for (const lc of PROVIDER_LOCALES) {
        expect(
          isProviderVariantIndexable(oura, lc),
          `oura variant ${lc} should be indexable`,
        ).toBe(true);
      }
    });
  });

  describe("Fitbit Catalog Guardrails", () => {
    const fitbit = PROVIDERS_BY_SLUG["fitbit"];

    it("does not contain viaHC property", () => {
      expect(fitbit).toBeDefined();
      expect((fitbit as unknown as Record<string, unknown>).viaHC).toBeUndefined();
    });

    it("does not promise Q3 2026, 12-month backfill, or speculative OAuth", () => {
      const allText = JSON.stringify({
        tagline: fitbit.tagline,
        longDesc: fitbit.longDesc,
        techNote: fitbit.techNote,
        faqs: fitbit.faqs,
        setupGuide: fitbit.setupGuide,
      });

      expect(allText).not.toMatch(/Q3 2026|T3 2026/);
      expect(allText).not.toMatch(/12 mesi|12-month/);
    });

    it("is indexable across all 11 provider catalog locales", () => {
      for (const lc of PROVIDER_LOCALES) {
        expect(
          isProviderVariantIndexable(fitbit, lc),
          `fitbit variant ${lc} should be indexable`,
        ).toBe(true);
      }
    });
  });

  describe("Garmin Catalog Guardrails", () => {
    const garmin = PROVIDERS_BY_SLUG["garmin"];

    it("does not contain viaHC property", () => {
      expect(garmin).toBeDefined();
      expect((garmin as unknown as Record<string, unknown>).viaHC).toBeUndefined();
    });

    it("does not promise Q3 2026, 12-month backfill, or speculative beta rollout", () => {
      const allText = JSON.stringify({
        tagline: garmin.tagline,
        longDesc: garmin.longDesc,
        techNote: garmin.techNote,
        faqs: garmin.faqs,
        setupGuide: garmin.setupGuide,
      });

      expect(allText).not.toMatch(/Q3 2026|T3 2026/);
      expect(allText).not.toMatch(/12 mesi|12-month/);
    });

    it("has authentic, non-English-copy-paste FAQ translations for Polish (PL)", () => {
      for (let i = 0; i < garmin.faqs.length; i++) {
        const faq = garmin.faqs[i];
        expect(faq.q.pl).not.toBe(faq.q.en);
        expect(faq.a.pl).not.toBe(faq.a.en);
      }
    });

    it("is indexable across all 11 provider catalog locales", () => {
      for (const lc of PROVIDER_LOCALES) {
        expect(
          isProviderVariantIndexable(garmin, lc),
          `garmin variant ${lc} should be indexable`,
        ).toBe(true);
      }
    });
  });

  describe("Product Facts SSOT Consistency", () => {
    it("includes Oura in both Android and iOS supported provider lists", () => {
      expect(SUPPORTED_PROVIDERS_ANDROID).toContain("Oura Ring");
      expect(SUPPORTED_PROVIDERS_IOS).toContain("Oura Ring");
    });

    it("maintains expected platform count totals", () => {
      expect(SUPPORTED_PROVIDERS_ANDROID).toHaveLength(13);
      expect(SUPPORTED_PROVIDERS_IOS).toHaveLength(3);
    });
  });

  describe("Landing Pages & About Copy Coherence", () => {
    it("does not contain Q3 2026 or T3 2026 in oura-ring-sync, fitbit-export-google, or garmin-connect-pc landings", () => {
      const auditedLandings = LANDING_PAGES.filter((l) =>
        ["oura-ring-sync", "fitbit-export-google", "garmin-connect-pc"].includes(l.slug),
      );
      expect(auditedLandings).toHaveLength(3);

      for (const landing of auditedLandings) {
        const json = JSON.stringify(landing);
        expect(json).not.toMatch(/Q3 2026|T3 2026/);
      }
    });

    it("does not contain speculative Q3 2026 OAuth dates in ABOUT_COPY hardware roadmap entries", () => {
      const hwRoadmap = JSON.stringify({
        fitbit: ABOUT_COPY.fitbitHistoricalGps,
        oura: ABOUT_COPY.ouraDirectApi,
        garmin: ABOUT_COPY.garminDirectApi,
      });
      expect(hwRoadmap).not.toMatch(/Q3 2026|T3 2026|Q4 2026/);
    });
  });
});
