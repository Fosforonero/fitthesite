import { describe, it, expect } from "vitest";
import { COMPATIBILITY_PATHS, UNVERIFIED_COMBINATIONS_MAP } from "./matrix-data";
import { ESSENTIAL_GLOSSARY, type SupportedMatrixLocale } from "./glossary-data";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { locales } from "@/lib/i18n";

const SUPPORTED_LOCALES: readonly SupportedMatrixLocale[] = ["it", "en", "de", "fr"];

describe("Compatibility Matrix Fact Ledger & SSOT Guardrails", () => {
  it("contains exactly 9 separated, non-aggregated paths (including Oura Android)", () => {
    expect(COMPATIBILITY_PATHS).toHaveLength(9);
  });

  it("re-uses valid provider slugs from the SSOT (PROVIDERS_BY_SLUG)", () => {
    for (const path of COMPATIBILITY_PATHS) {
      expect(
        PROVIDERS_BY_SLUG[path.providerSlug],
        `Path ${path.id} has invalid providerSlug "${path.providerSlug}"`
      ).toBeDefined();
    }
  });

  it("strictly separates Android and iOS (never combined into a single path)", () => {
    const androidPaths = COMPATIBILITY_PATHS.filter((p) => p.phoneOs === "android");
    const iosPaths = COMPATIBILITY_PATHS.filter((p) => p.phoneOs === "ios");

    expect(androidPaths).toHaveLength(6); // garmin, fitbit, galaxy-watch, pixel-watch, oura, colmi
    expect(iosPaths).toHaveLength(3);     // garmin, fitbit, colmi

    // Confirm Colmi Android and Colmi iOS are separated
    const colmiAndroid = COMPATIBILITY_PATHS.find((p) => p.id === "colmi-android");
    const colmiIos = COMPATIBILITY_PATHS.find((p) => p.id === "colmi-ios");

    expect(colmiAndroid).toBeDefined();
    expect(colmiIos).toBeDefined();
    expect(colmiAndroid?.phoneOs).toBe("android");
    expect(colmiIos?.phoneOs).toBe("ios");

    // Confirm Oura Android is present and Android-only
    const ouraAndroid = COMPATIBILITY_PATHS.find((p) => p.id === "oura-android");
    expect(ouraAndroid).toBeDefined();
    expect(ouraAndroid?.phoneOs).toBe("android");
  });

  it("has complete and symmetric translations across IT, EN, DE, FR for all paths", () => {
    for (const path of COMPATIBILITY_PATHS) {
      for (const lc of SUPPORTED_LOCALES) {
        expect(path.phoneOsLabel[lc], `Path ${path.id} missing phoneOsLabel for ${lc}`).toBeTruthy();
        expect(path.deviceFamilyLabel[lc], `Path ${path.id} missing deviceFamilyLabel for ${lc}`).toBeTruthy();
        expect(path.statusLabel[lc], `Path ${path.id} missing statusLabel for ${lc}`).toBeTruthy();
        expect(path.directionLabel[lc], `Path ${path.id} missing directionLabel for ${lc}`).toBeTruthy();

        // 4 Steps A, B, C, D
        expect(path.steps.stepA[lc], `Path ${path.id} missing stepA for ${lc}`).toBeTruthy();
        expect(path.steps.stepB[lc], `Path ${path.id} missing stepB for ${lc}`).toBeTruthy();
        expect(path.steps.stepC[lc], `Path ${path.id} missing stepC for ${lc}`).toBeTruthy();
        expect(path.steps.stepD[lc], `Path ${path.id} missing stepD for ${lc}`).toBeTruthy();

        expect(path.metricsSummary[lc], `Path ${path.id} missing metricsSummary for ${lc}`).toBeTruthy();
        expect(path.requirements[lc], `Path ${path.id} missing requirements for ${lc}`).toBeTruthy();
        expect(path.limitations[lc], `Path ${path.id} missing limitations for ${lc}`).toBeTruthy();
        expect(path.officialSource.title[lc], `Path ${path.id} missing source title for ${lc}`).toBeTruthy();
        expect(path.officialSource.supportedClaim[lc], `Path ${path.id} missing supportedClaim for ${lc}`).toBeTruthy();
        expect(path.evidence.label[lc], `Path ${path.id} missing evidence label for ${lc}`).toBeTruthy();
        expect(path.evidence.details[lc], `Path ${path.id} missing evidence details for ${lc}`).toBeTruthy();
      }

      // Valid official source URL
      expect(path.officialSource.url.startsWith("https://")).toBe(true);
      // Valid ISO date
      expect(path.officialSource.verifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("distinguishes Samsung Health standard path (Health Connect) and additional path (SDK)", () => {
    const galaxy = COMPATIBILITY_PATHS.find((p) => p.id === "galaxy-watch-android");
    expect(galaxy?.subpaths).toBeDefined();
    expect(galaxy?.subpaths).toHaveLength(2);

    const [standardSubpath, sdkSubpath] = galaxy!.subpaths!;
    expect(standardSubpath.id).toBe("samsung-health-connect");
    expect(sdkSubpath.id).toBe("samsung-health-sdk");

    for (const sub of [standardSubpath, sdkSubpath]) {
      for (const lc of SUPPORTED_LOCALES) {
        expect(sub.title[lc]).toBeTruthy();
        expect(sub.route[lc]).toBeTruthy();
        expect(sub.requirements[lc]).toBeTruthy();
        expect(sub.metricsRead[lc]).toBeTruthy();
        expect(sub.fallback[lc]).toBeTruthy();
        expect(sub.verificationStatus[lc]).toBeTruthy();
        expect(sub.availability[lc]).toBeTruthy();
      }
    }
  });

  it("delineates evidence levels rigorously (never claiming end-to-end verified for composite paths)", () => {
    for (const path of COMPATIBILITY_PATHS) {
      if (path.id === "colmi-android" || path.id === "colmi-ios") {
        expect(path.evidence.level).toBe("device_tested");
      } else {
        expect(path.evidence.level).toBe("vendor_documented");
      }
    }
  });

  it("respects factual directional integrity (no read-only path marked as write)", () => {
    for (const path of COMPATIBILITY_PATHS) {
      if (path.id === "colmi-ios") {
        expect(path.direction).toBe("read-write");
      } else {
        expect(path.direction).toBe("read");
      }
    }
  });

  it("correctly marks Garmin iOS and Fitbit iOS as conditional, not unsupported", () => {
    const garminIos = COMPATIBILITY_PATHS.find((p) => p.id === "garmin-ios");
    const fitbitIos = COMPATIBILITY_PATHS.find((p) => p.id === "fitbit-ios");

    expect(garminIos?.status).toBe("conditional");
    expect(fitbitIos?.status).toBe("conditional");
  });

  it("provides informative unverified entries for unmapped combinations instead of generic unsupported", () => {
    expect(UNVERIFIED_COMBINATIONS_MAP["galaxy-watch-ios"]).toBeDefined();
    expect(UNVERIFIED_COMBINATIONS_MAP["pixel-watch-ios"]).toBeDefined();
    expect(UNVERIFIED_COMBINATIONS_MAP["oura-ring-ios"]).toBeDefined();

    for (const [key, item] of Object.entries(UNVERIFIED_COMBINATIONS_MAP)) {
      for (const lc of SUPPORTED_LOCALES) {
        expect(item.title[lc], `Unverified ${key} missing title for ${lc}`).toBeTruthy();
        expect(item.description[lc], `Unverified ${key} missing description for ${lc}`).toBeTruthy();
      }
      expect(item.helpHref.startsWith("/")).toBe(true);
    }
  });
});

describe("Essential Glossary Data", () => {
  it("contains exactly 7 essential definitions", () => {
    expect(ESSENTIAL_GLOSSARY).toHaveLength(7);
  });

  it("has complete translations across IT, EN, DE, FR for all terms and definitions", () => {
    const expectedIds = [
      "synchronization",
      "export",
      "data-source",
      "measured-vs-derived",
      "health-connect",
      "apple-health-healthkit",
      "read-vs-write",
    ];

    expect(ESSENTIAL_GLOSSARY.map((g) => g.id)).toEqual(expectedIds);

    for (const g of ESSENTIAL_GLOSSARY) {
      for (const lc of SUPPORTED_LOCALES) {
        expect(g.term[lc], `Glossary ${g.id} missing term for ${lc}`).toBeTruthy();
        expect(g.definition[lc], `Glossary ${g.id} missing definition for ${lc}`).toBeTruthy();
      }
    }
  });

  it("confirms 15 total locales with 11 untouched locales outside IT/EN/DE/FR", () => {
    expect(locales).toHaveLength(15);
    const untouched = locales.filter((l) => !SUPPORTED_LOCALES.includes(l as SupportedMatrixLocale));
    expect(untouched).toHaveLength(11);
  });
});
