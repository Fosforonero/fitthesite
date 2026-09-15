import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { COMPATIBILITY_PATHS, UNVERIFIED_COMBINATIONS_MAP } from "./matrix-data";
import { ESSENTIAL_GLOSSARY, type SupportedMatrixLocale } from "./glossary-data";
import { UI_COPY } from "@/components/compatibility/CompatibilityMatrix";
import { resolveGuideLink, resolveUnverifiedLink } from "./matrix-links";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { locales } from "@/lib/i18n";

const SUPPORTED_LOCALES: readonly SupportedMatrixLocale[] = ["it", "en", "de", "fr"];

describe("Compatibility Matrix Fact Ledger & SSOT Guardrails", () => {
  it("contains exactly 10 separated, non-aggregated paths (including Oura Android and Oura iOS)", () => {
    expect(COMPATIBILITY_PATHS).toHaveLength(10);
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
    expect(iosPaths).toHaveLength(4);     // garmin, fitbit, oura, colmi

    // Confirm Colmi Android and Colmi iOS are separated
    const colmiAndroid = COMPATIBILITY_PATHS.find((p) => p.id === "colmi-android");
    const colmiIos = COMPATIBILITY_PATHS.find((p) => p.id === "colmi-ios");

    expect(colmiAndroid).toBeDefined();
    expect(colmiIos).toBeDefined();
    expect(colmiAndroid?.phoneOs).toBe("android");
    expect(colmiIos?.phoneOs).toBe("ios");

    // Confirm Oura Android and Oura iOS are separated
    const ouraAndroid = COMPATIBILITY_PATHS.find((p) => p.id === "oura-android");
    const ouraIos = COMPATIBILITY_PATHS.find((p) => p.id === "oura-ios");

    expect(ouraAndroid).toBeDefined();
    expect(ouraIos).toBeDefined();
    expect(ouraAndroid?.phoneOs).toBe("android");
    expect(ouraIos?.phoneOs).toBe("ios");
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

  it("correctly marks Garmin iOS, Fitbit iOS, and Oura as conditional, not unsupported", () => {
    const garminIos = COMPATIBILITY_PATHS.find((p) => p.id === "garmin-ios");
    const fitbitIos = COMPATIBILITY_PATHS.find((p) => p.id === "fitbit-ios");
    const ouraAndroid = COMPATIBILITY_PATHS.find((p) => p.id === "oura-android");
    const ouraIos = COMPATIBILITY_PATHS.find((p) => p.id === "oura-ios");

    expect(garminIos?.status).toBe("conditional");
    expect(fitbitIos?.status).toBe("conditional");
    expect(ouraAndroid?.status).toBe("conditional");
    expect(ouraIos?.status).toBe("conditional");
  });

  it("provides informative unverified entries for unmapped combinations instead of generic unsupported", () => {
    expect(UNVERIFIED_COMBINATIONS_MAP["galaxy-watch-ios"]).toBeDefined();
    expect(UNVERIFIED_COMBINATIONS_MAP["pixel-watch-ios"]).toBeDefined();
    // Oura iOS is now fully mapped as a 10th path, so it must not be in unverified combinations
    expect(UNVERIFIED_COMBINATIONS_MAP["oura-ring-ios"]).toBeUndefined();

    for (const [key, item] of Object.entries(UNVERIFIED_COMBINATIONS_MAP)) {
      for (const lc of SUPPORTED_LOCALES) {
        expect(item.title[lc], `Unverified ${key} missing title for ${lc}`).toBeTruthy();
        expect(item.description[lc], `Unverified ${key} missing description for ${lc}`).toBeTruthy();
      }
      expect(PROVIDERS_BY_SLUG[item.providerSlug], `Unverified ${key} providerSlug invalid`).toBeDefined();
    }
  });

  it("contains negative test guardrail preventing Colmi iOS from claiming Apple Health sleep write-back", () => {
    const colmiIos = COMPATIBILITY_PATHS.find((p) => p.id === "colmi-ios");
    expect(colmiIos).toBeDefined();

    // While kHealthKitSleepExportEnabled = false in release 3.10.0+191,
    // NO text in stepD, directionLabel, metricsSummary, limitations, or officialSource claim sleep write-back.
    const forbiddenPhrases = [
      "scrittura sonno",
      "scrittura del sonno",
      "fasi del sonno verso apple health",
      "write-back del sonno",
      "write sleep",
      "sleep write-back",
      "write-back certificato",
      "senza cloud terzi",
      "schlaf an apple health schreiben",
      "schlaf-write-back",
      "zertifiziertes schreiben",
      "ohne drittanbieter-cloud",
      "écriture du sommeil",
      "write-back du sommeil",
      "écriture certifiée",
      "sans cloud tiers",
    ];

    const fieldsToInspect = [
      ...Object.values(colmiIos!.steps.stepD),
      ...Object.values(colmiIos!.directionLabel),
      ...Object.values(colmiIos!.metricsSummary),
      ...Object.values(colmiIos!.limitations),
      ...Object.values(colmiIos!.officialSource.supportedClaim),
    ];

    for (const text of fieldsToInspect) {
      const lower = text.toLowerCase();
      for (const phrase of forbiddenPhrases) {
        expect(
          lower.includes(phrase),
          `Colmi iOS contains forbidden claim "${phrase}" in text: "${text}"`
        ).toBe(false);
      }
    }

    // Must clearly state the real architecture (BLE -> FitMesh -> backend/dashboard FitMesh -> HealthKit bridge)
    expect(colmiIos!.steps.stepD.it).toContain("backend/dashboard FitMesh");
    expect(colmiIos!.steps.stepD.it).toContain("ponte HealthKit");
    expect(colmiIos!.steps.stepD.en).toContain("backend/dashboard FitMesh");
    expect(colmiIos!.steps.stepD.en).toContain("HealthKit bridge");
    expect(colmiIos!.steps.stepD.de).toContain("Backend/Dashboard FitMesh");
    expect(colmiIos!.steps.stepD.de).toContain("HealthKit-Brücke");
    expect(colmiIos!.steps.stepD.fr).toContain("backend/tableau de bord FitMesh");
    expect(colmiIos!.steps.stepD.fr).toContain("pont HealthKit");

    // Must include exact architectural statement referencing Privacy Policy
    expect(colmiIos!.limitations.it).toContain("La lettura dall'anello non richiede l'app o il cloud del produttore Colmi");
    expect(colmiIos!.limitations.it).toContain("segue l'architettura FitMesh descritta nella Privacy Policy");

    // Official source must be Apple documentation / release reference, NOT a FitMesh marketing URL
    expect(colmiIos!.officialSource.url).toBe("https://developer.apple.com/documentation/healthkit");
    expect(colmiIos!.officialSource.url.includes("fitmesh.fit")).toBe(false);
  });

  it("prevents Italian string leakage in foreign locales (EN, DE, FR) within UI_COPY", () => {
    const foreignLocales: SupportedMatrixLocale[] = ["en", "de", "fr"];

    const italianMarkers = [
      "Dispositivo",
      "Evidenza",
      "Percorso",
      "Fonte Ufficiale",
      "Requisiti",
      "Nascondi",
      "Mostra dettaglio",
      "Chiudi scheda",
      "Apri scheda",
      "Reimposta",
      "Tutti i telefoni",
      "Tutte le marche",
      "Sottopercorsi",
    ];

    for (const lc of foreignLocales) {
      const copy = UI_COPY[lc];
      expect(copy, `UI_COPY for ${lc} must exist`).toBeDefined();

      const textValues = [
        copy.badge,
        copy.title,
        copy.subtitle,
        copy.filterOsLabel,
        copy.filterFamilyLabel,
        copy.allOs,
        copy.allFamilies,
        copy.metricsLabel,
        copy.requirementsLabel,
        copy.limitationsLabel,
        copy.officialSourceLabel,
        copy.evidenceLabel,
        copy.verifiedDateLabel,
        copy.subpathsLabel,
        copy.guideLinkLabel,
        copy.noResultsTitle,
        copy.noResultsDesc,
        copy.unverifiedBadge,
        copy.learnMore,
        copy.colDeviceOs,
        copy.colStatus,
        copy.colEvidence,
        copy.colRouteData,
        copy.colOfficialSource,
        copy.subpathRequirements,
        copy.subpathMetrics,
        copy.subpathFallback,
        copy.toggleDetailsOpen,
        copy.toggleDetailsClosed,
        copy.cardToggleOpen,
        copy.cardToggleClosed,
        copy.resetFilters,
        copy.sourceDocumentsLabel,
      ];

      for (const val of textValues) {
        expect(typeof val).toBe("string");
        expect(val.length).toBeGreaterThan(0);
        for (const marker of italianMarkers) {
          expect(
            val.includes(marker),
            `UI_COPY[${lc}] leaked Italian marker "${marker}" in string: "${val}"`
          ).toBe(false);
        }
      }
    }
  });

  it("resolves SSOT localized direct 200 internal links with EN fallback tagging", () => {
    for (const path of COMPATIBILITY_PATHS) {
      for (const lc of SUPPORTED_LOCALES) {
        const link = resolveGuideLink(path, lc);
        expect(link, `Path ${path.id} must resolve a guide link for ${lc}`).toBeDefined();
        expect(link!.href.startsWith("/")).toBe(true);

        expect(link!.isFallbackEn).toBe(false);
      }
    }

    // Garmin iOS points to localized blog guide
    const garminIos = COMPATIBILITY_PATHS.find((p) => p.id === "garmin-ios")!;
    expect(resolveGuideLink(garminIos, "it")!.href).toBe("/it/blog/garmin-samsung-health-sync-guide");
    expect(resolveGuideLink(garminIos, "en")!.href).toBe("/en/blog/sync-garmin-samsung-health-guide");
    expect(resolveGuideLink(garminIos, "de")!.href).toBe("/de/blog/garmin-samsung-health-synchronisieren-anleitung");
    expect(resolveGuideLink(garminIos, "fr")!.href).toBe("/fr/blog/synchroniser-garmin-samsung-health-guide");

    // Unverified combinations resolve direct 200 provider URLs
    for (const [key, item] of Object.entries(UNVERIFIED_COMBINATIONS_MAP)) {
      for (const lc of SUPPORTED_LOCALES) {
        const link = resolveUnverifiedLink(item.providerSlug, lc);
        expect(link, `Unverified ${key} must resolve a link for ${lc}`).toBeDefined();
        expect(link!.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("contains negative guardrail preventing Oura iOS from claiming Apple Health resting HR export without direct evidence", () => {
    const ouraIos = COMPATIBILITY_PATHS.find((p) => p.id === "oura-ios");
    expect(ouraIos).toBeDefined();

    // Guardrail: no positive claim that Oura exports resting heart rate to Apple Health / HealthKit
    const forbiddenPositiveClaims = [
      "esporta la frequenza a riposo",
      "esportazione della frequenza a riposo verso apple",
      "frequenza cardiaca a riposo verso apple",
      "writes resting heart rate to apple",
      "exports resting heart rate to apple",
      "schreibt ruhepuls in apple",
      "exporte la fréquence au repos vers apple",
    ];

    const fieldsToInspect = [
      ...Object.values(ouraIos!.steps.stepC),
      ...Object.values(ouraIos!.steps.stepD),
      ...Object.values(ouraIos!.metricsSummary),
      ...Object.values(ouraIos!.officialSource.supportedClaim),
    ];

    for (const text of fieldsToInspect) {
      const lower = text.toLowerCase();
      for (const phrase of forbiddenPositiveClaims) {
        expect(
          lower.includes(phrase),
          `Oura iOS contains forbidden claim "${phrase}" in text: "${text}"`
        ).toBe(false);
      }
    }

    // Must clearly state that resting HR is NOT listed / exported as a standalone HealthKit record
    expect(ouraIos!.steps.stepC.it).toContain("La documentazione Oura non elenca la frequenza a riposo (RESTING_HEART_RATE) tra i dati esportati");
    expect(ouraIos!.steps.stepD.it).toContain("Non viene dedotto né letto un record RESTING_HEART_RATE da Oura");
    expect(ouraIos!.limitations.it).toContain("frequenza cardiaca a riposo calcolata internamente da Oura non transitano come record autonomi in Apple Health");
    expect(ouraIos!.limitations.en).toContain("resting heart rate calculated internally by Oura do not transfer as standalone records to Apple Health");
    expect(ouraIos!.limitations.de).toContain("intern von Oura berechnete Ruhepuls werden nicht als autonome Datensätze an Apple Health übertragen");
    expect(ouraIos!.limitations.fr).toContain("fréquence au repos calculée en interne par Oura ne sont pas transférés comme enregistrements autonomes dans Apple Santé");

    // Must introduce partial list with standard phrasing
    expect(ouraIos!.metricsSummary.it.startsWith("Tra i dati supportati:")).toBe(true);
    expect(ouraIos!.metricsSummary.en.startsWith("Among supported data:")).toBe(true);
    expect(ouraIos!.metricsSummary.de.startsWith("Unter den unterstützten Daten:")).toBe(true);
    expect(ouraIos!.metricsSummary.fr.startsWith("Parmi les données prises en charge :")).toBe(true);

    // Respiratory rate reconciled in C, D and metricsSummary
    expect(ouraIos!.metricsSummary.it).toContain("frequenza respiratoria");
    expect(ouraIos!.metricsSummary.en).toContain("respiratory rate");
    expect(ouraIos!.metricsSummary.de).toContain("Atemfrequenz");
    expect(ouraIos!.metricsSummary.fr).toContain("fréquence respiratoire");
    expect(ouraIos!.steps.stepD.it).toContain("RESPIRATORY_RATE");
  });

  it("contains guardrail ensuring Oura Android distinctly lists both HR and HRV RMSSD without conflation", () => {
    const ouraAndroid = COMPATIBILITY_PATHS.find((p) => p.id === "oura-android");
    expect(ouraAndroid).toBeDefined();

    // Must include both HR and HRV as distinct metrics across all 4 locales
    expect(ouraAndroid!.metricsSummary.it).toContain("frequenza cardiaca");
    expect(ouraAndroid!.metricsSummary.it).toContain("variabilità della frequenza cardiaca (HRV RMSSD)");

    expect(ouraAndroid!.metricsSummary.en).toContain("heart rate");
    expect(ouraAndroid!.metricsSummary.en).toContain("heart rate variability (HRV RMSSD)");

    expect(ouraAndroid!.metricsSummary.de).toContain("Herzfrequenz");
    expect(ouraAndroid!.metricsSummary.de).toContain("Herzfrequenzvariabilität (HRV RMSSD)");

    expect(ouraAndroid!.metricsSummary.fr).toContain("fréquence cardiaque");
    expect(ouraAndroid!.metricsSummary.fr).toContain("variabilité de la fréquence cardiaque (HRV RMSSD)");

    // In stepD, both HEART_RATE and HEART_RATE_VARIABILITY_RMSSD are explicitly mapped
    expect(ouraAndroid!.steps.stepD.it).toContain("HEART_RATE");
    expect(ouraAndroid!.steps.stepD.it).toContain("HEART_RATE_VARIABILITY_RMSSD");
    expect(ouraAndroid!.steps.stepD.en).toContain("HEART_RATE");
    expect(ouraAndroid!.steps.stepD.en).toContain("HEART_RATE_VARIABILITY_RMSSD");

    // Partial list phrasing
    expect(ouraAndroid!.metricsSummary.it.startsWith("Tra i dati supportati:")).toBe(true);
    expect(ouraAndroid!.metricsSummary.en.startsWith("Among supported data:")).toBe(true);
    expect(ouraAndroid!.metricsSummary.de.startsWith("Unter den unterstützten Daten:")).toBe(true);
    expect(ouraAndroid!.metricsSummary.fr.startsWith("Parmi les données prises en charge :")).toBe(true);
  });

  it("contains guardrail ensuring source titles align with official domains and Colmi iOS references Apple Developer", () => {
    // Colmi iOS must reference Apple Developer HealthKit framework
    const colmiIos = COMPATIBILITY_PATHS.find((p) => p.id === "colmi-ios")!;
    expect(colmiIos.officialSource.url).toBe("https://developer.apple.com/documentation/healthkit");
    expect(colmiIos.officialSource.title.it).toContain("Apple Developer: Documentazione Framework HealthKit");
    expect(colmiIos.officialSource.title.en).toContain("Apple Developer: HealthKit Framework Documentation");
    expect(colmiIos.officialSource.title.de).toContain("Apple Developer: HealthKit-Framework-Dokumentation");
    expect(colmiIos.officialSource.title.fr).toContain("Apple Developer : Documentation du framework HealthKit");

    // Never leak internal variable names in public user-facing strings
    for (const path of COMPATIBILITY_PATHS) {
      const allStrings = [
        ...Object.values(path.steps.stepA),
        ...Object.values(path.steps.stepB),
        ...Object.values(path.steps.stepC),
        ...Object.values(path.steps.stepD),
        ...Object.values(path.requirements),
        ...Object.values(path.limitations),
        ...Object.values(path.metricsSummary),
        ...Object.values(path.officialSource.supportedClaim),
        ...Object.values(path.officialSource.title),
      ];
      for (const str of allStrings) {
        expect(str.includes("kHealthKitSleepExportEnabled")).toBe(false);
      }
    }

    // Domain alignments
    for (const path of COMPATIBILITY_PATHS) {
      const parsedUrl = new URL(path.officialSource.url);
      if (path.providerSlug === "oura") {
        expect(parsedUrl.hostname).toBe("support.ouraring.com");
      } else if (path.providerSlug === "garmin") {
        expect(parsedUrl.hostname).toBe("support.garmin.com");
      } else if (path.providerSlug === "fitbit" || path.id === "pixel-watch-android") {
        expect(parsedUrl.hostname).toBe("support.google.com");
      } else if (path.id === "galaxy-watch-android") {
        expect(parsedUrl.hostname).toBe("www.samsung.com");
      } else if (path.id === "colmi-android") {
        expect(parsedUrl.hostname).toBe("github.com");
      } else if (path.id === "colmi-ios") {
        expect(parsedUrl.hostname).toBe("developer.apple.com");
      }
    }
  });

  it("contains guardrail verifying UI component uses sourceDocumentsLabel without quotation marks on paraphrases", () => {
    // All 4 locales define sourceDocumentsLabel without empty strings
    for (const lc of SUPPORTED_LOCALES) {
      expect(UI_COPY[lc].sourceDocumentsLabel).toBeTruthy();
    }
    expect(UI_COPY.it.sourceDocumentsLabel).toBe("La fonte documenta:");
    expect(UI_COPY.en.sourceDocumentsLabel).toBe("Source documents:");
    expect(UI_COPY.de.sourceDocumentsLabel).toBe("Die Quelle dokumentiert:");
    expect(UI_COPY.fr.sourceDocumentsLabel).toBe("La source documente :");

    // Inspect component source: no quotation marks wrapping supportedClaim
    const componentSource = fs.readFileSync(
      path.join(process.cwd(), "components/compatibility/CompatibilityMatrix.tsx"),
      "utf-8"
    );
    expect(componentSource.includes("&quot;{p.officialSource.supportedClaim")).toBe(false);
    expect(componentSource.includes('"{p.officialSource.supportedClaim')).toBe(false);
    expect(componentSource.includes("copy.sourceDocumentsLabel")).toBe(true);
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
