import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  resolveCompatibilityPath,
  EXPLICIT_COMPATIBILITY_MATRIX,
  SELECTOR_DEVICES,
  SELECTOR_METRICS,
  SELECTOR_GUIDE_SLUGS,
  type SelectorPhoneOs,
} from "./selector-registry";
import {
  resolveSelectorGuideHref,
  buildSelectorGuideLinkMap,
} from "./selector-links";

const OS_LIST: SelectorPhoneOs[] = ["android", "ios"];
const POSITIVE_STATUSES = new Set(["direct_verified", "health_store", "conditional"]);

describe("FitMesh Compatibility Selector Registry & Server Link Resolver", () => {
  it("keeps selector client modules free of blog corpus imports and resolves guide links on the server", () => {
    const registrySource = fs.readFileSync(
      path.resolve(__dirname, "./selector-registry.ts"),
      "utf-8"
    );
    const componentSource = fs.readFileSync(
      path.resolve(__dirname, "../../components/compatibility/CompatibilitySelector.tsx"),
      "utf-8"
    );
    const matrixComponentSource = fs.readFileSync(
      path.resolve(__dirname, "../../components/compatibility/CompatibilityMatrix.tsx"),
      "utf-8"
    );

    expect(registrySource).not.toContain("@/lib/blog/");
    expect(registrySource).not.toContain("blogLinkHrefSync");
    expect(componentSource).not.toContain("@/lib/blog/");
    expect(componentSource).not.toContain("blogLinkHrefSync");
    expect(matrixComponentSource).not.toContain("@/lib/blog/");
    expect(matrixComponentSource).not.toContain("resolveGuideLink");
    expect(matrixComponentSource).not.toContain("resolveUnverifiedLink");

    const linkMap = buildSelectorGuideLinkMap();
    expect(linkMap["colmi-r02-setup"]).toEqual({
      it: "/it/blog/colmi-r02-setup",
      en: "/en/blog/set-up-colmi-ring",
    });
    expect(linkMap["garmin-samsung-health-sync-guide"]).toEqual({
      it: "/it/blog/garmin-samsung-health-sync-guide",
      en: "/en/blog/sync-garmin-samsung-health-guide",
    });
    expect(linkMap["passi-non-si-sincronizzano-galaxy-watch"]).toEqual({
      it: "/it/blog/passi-non-si-sincronizzano-galaxy-watch",
      en: "/en/blog/steps-not-syncing-galaxy-watch",
    });

    // Preserves distinction between non-indexable/withdrawn (null -> do not recreate link)
    // and unknown CMS-only slug (undefined -> fallback URL)
    expect(resolveSelectorGuideHref("dove-sono-i-tuoi-dati-server-ue", "it")).toBeNull();
    expect(resolveSelectorGuideHref("dove-sono-i-tuoi-dati-server-ue", "en")).toBeNull();
    expect(resolveSelectorGuideHref("smartwatch-per-anziani-guida", "en")).toBeNull();
    expect(resolveSelectorGuideHref("unknown-cms-only-slug-xyz", "en")).toBe(
      "/en/blog/unknown-cms-only-slug-xyz"
    );
  });

  it("resolves direct BLE connection for Colmi Ring without unbacked hardware test attestations or generic repo root URLs", () => {
    for (const os of OS_LIST) {
      for (const metric of ["steps", "heart_rate", "sleep", "sleep_stages"] as const) {
        const res = resolveCompatibilityPath(os, "colmi", metric);
        expect(res.status).toBe("direct_verified");
        expect(res.route.healthStore).toBeNull();
        expect(res.cta.guideSlug).toBe("colmi-r02-setup");
        expect(res.evidence.it).toContain(os === "ios" ? "colmi-ios" : "colmi-android");
        expect(res.evidence.it).toContain("lib/compatibility/matrix-data.ts");
        expect(res.evidence.it).not.toContain("https://github.com/Fosforonero/fitthesite");
        expect(res.evidence.it.toLowerCase()).not.toContain("testato su hardware");
        expect(res.evidence.en.toLowerCase()).not.toContain("tested on colmi");
      }
    }
  });

  it("enforces source priority exclusion for Colmi SpO2 and classifies unproven Fitbit/Apple Watch SpO2 as unverified", () => {
    const colmiSpo2 = resolveCompatibilityPath("android", "colmi", "spo2");
    expect(colmiSpo2.status).toBe("conditional");
    expect(colmiSpo2.limitations.it).toContain("SpO2, peso e distanza");
    expect(colmiSpo2.limitations.en).toContain("SpO2, weight, or distance");
    expect(colmiSpo2.cta.href).toEqual({ it: "/it#download", en: "/en#download" });

    expect(resolveCompatibilityPath("android", "fitbit", "spo2").status).toBe("unverified");
    expect(resolveCompatibilityPath("ios", "apple-watch", "spo2").status).toBe("unverified");
  });

  it("scopes Oura Readiness limitation to the Health Connect / Apple Health route and FitMesh integrations, citing Oura API docs without absolute app-only claims", () => {
    for (const os of OS_LIST) {
      const ouraReadiness = resolveCompatibilityPath(os, "oura", "readiness");
      expect(ouraReadiness.status).toBe("unsupported");
      expect(ouraReadiness.evidence.it).toContain("https://cloud.ouraring.com/docs/authentication");
      expect(ouraReadiness.evidence.en).toContain("https://cloud.ouraring.com/docs/authentication");
      expect(ouraReadiness.explanation.it).toContain("non dispone di un'integrazione cloud diretta con Oura");
      expect(ouraReadiness.explanation.en).toContain("does not provide a direct Oura cloud integration");

      const combinedOura = `${ouraReadiness.explanation.it} ${ouraReadiness.explanation.en} ${ouraReadiness.limitations.it} ${ouraReadiness.limitations.en}`.toLowerCase();
      expect(combinedOura).not.toContain("consultabile esclusivamente nell'app");
      expect(combinedOura).not.toContain("viewable exclusively");
      expect(combinedOura).not.toContain("non viene esportato fuori dall'app");
      expect(combinedOura).not.toContain("not exported outside the oura app");
    }
  });

  it("distinguishes absence of direct integration from indirect health-store routes for Polar and Google Fit", () => {
    const standardMetrics = [
      "steps",
      "heart_rate",
      "sleep",
      "sleep_stages",
      "hrv",
      "spo2",
      "temperature",
      "vo2_max",
      "workouts",
    ] as const;

    for (const os of OS_LIST) {
      for (const metric of standardMetrics) {
        const polarRes = resolveCompatibilityPath(os, "polar", metric);
        expect(polarRes.status).toBe("unverified");
        expect(polarRes.cta.type).toBe("none");
        expect(polarRes.explanation.it).toContain("percorso indiretto non è verificato");

        const gfitRes = resolveCompatibilityPath(os, "google-fit", metric);
        expect(gfitRes.status).toBe("unverified");
        expect(gfitRes.cta.type).toBe("none");
        expect(gfitRes.explanation.it).toContain("non è verificato end-to-end");
      }

      for (const proprietaryMetric of ["body_battery", "energy_score", "readiness"] as const) {
        expect(resolveCompatibilityPath(os, "polar", proprietaryMetric).status).toBe("unsupported");
        expect(resolveCompatibilityPath(os, "google-fit", proprietaryMetric).status).toBe("unsupported");
      }
    }
  });

  it("reflects Garmin Body Battery and Samsung Energy Score as unsupported via Health Connect without internal build numbers", () => {
    const garminBbAndroid = resolveCompatibilityPath("android", "garmin", "body_battery");
    expect(garminBbAndroid.status).toBe("unsupported");
    expect(garminBbAndroid.evidence.en).toContain("lzpSWu5diM4vgrmUXP4nn5");
    expect(garminBbAndroid.cta.guideSlug).toBe("garmin-body-battery-health-connect");

    const samsungSteps = resolveCompatibilityPath("android", "samsung", "steps");
    expect(samsungSteps.status).toBe("health_store");
    expect(samsungSteps.explanation.it).toContain("avviene tramite Health Connect");
    expect(samsungSteps.cta.guideSlug).toBe("passi-non-si-sincronizzano-galaxy-watch");

    const samsungEnergy = resolveCompatibilityPath("android", "samsung", "energy_score");
    expect(samsungEnergy.status).toBe("unsupported");
    expect(samsungEnergy.evidence.en).toContain("developer.samsung.com/health/data/guide/features/data-types.html");
  });

  it("reflects workout distance limitation in plain user-facing language without internal codes", () => {
    const garminWorkouts = resolveCompatibilityPath("android", "garmin", "workouts");
    expect(garminWorkouts.status).toBe("conditional");
    expect(garminWorkouts.limitations.it).toContain("in verifica");
    expect(garminWorkouts.limitations.en).toContain("under verification");
    expect(garminWorkouts.cta.guideSlug).toBe("garmin-samsung-health-sync-guide");
  });

  it("rejects positive fallbacks for cross-vendor proprietary metrics (red-first counterexamples)", () => {
    const awBodyBattery = resolveCompatibilityPath("ios", "apple-watch", "body_battery");
    expect(POSITIVE_STATUSES.has(awBodyBattery.status)).toBe(false);
    expect(awBodyBattery.status).toBe("unsupported");

    const awEnergyScore = resolveCompatibilityPath("ios", "apple-watch", "energy_score");
    expect(POSITIVE_STATUSES.has(awEnergyScore.status)).toBe(false);
    expect(awEnergyScore.status).toBe("unsupported");

    const samsungBodyBattery = resolveCompatibilityPath("android", "samsung", "body_battery");
    expect(POSITIVE_STATUSES.has(samsungBodyBattery.status)).toBe(false);
    expect(samsungBodyBattery.status).toBe("unsupported");

    const samsungReadiness = resolveCompatibilityPath("android", "samsung", "readiness");
    expect(POSITIVE_STATUSES.has(samsungReadiness.status)).toBe(false);
    expect(samsungReadiness.status).toBe("unsupported");
  });

  it("verifies structural coverage of all 264 selectable combinations, guide slug registration, and absence of banned tokens or em dashes", () => {
    let totalChecked = 0;
    const guideSlugSet = new Set(SELECTOR_GUIDE_SLUGS);
    const bannedPhrases = [
      "Oura App v5+",
      "matrice test su dispositivi reali",
      "real device testing matrix",
      "verifiche runtime",
      "runtime tests",
      "testato su hardware",
      "tested on colmi",
      "https://github.com/fosforonero/fitthesite",
      "consultabile esclusivamente nell'app",
      "viewable exclusively",
      "DIST-01",
      "3.10.0+191",
      "build 191",
      "build 192",
      "versione 191",
      "versione 192",
      "release 191",
      "nella 192",
    ];

    for (const os of OS_LIST) {
      for (const dev of SELECTOR_DEVICES) {
        expect(dev.label.it).not.toContain("\u2014");
        expect(dev.label.en).not.toContain("\u2014");

        for (const met of SELECTOR_METRICS) {
          expect(met.label.it).not.toContain("\u2014");
          expect(met.label.en).not.toContain("\u2014");

          const res = resolveCompatibilityPath(os, dev.id, met.id);
          const explicitEntry = EXPLICIT_COMPATIBILITY_MATRIX[os]?.[dev.id]?.[met.id];
          totalChecked++;

          if (!explicitEntry) {
            expect(res.status).toBe("unverified");
            expect(res.cta.type).toBe("none");
          } else {
            expect(res).toBe(explicitEntry);
            expect(res.evidence.it).toMatch(/https:\/\/|lib\//);
            expect(res.evidence.en).toMatch(/https:\/\/|lib\//);
          }

          if (res.status === "unsupported" || res.status === "unverified") {
            expect(res.route.fitmeshApp.it).not.toBe("FitMesh Sync");
            expect(res.route.fitmeshApp.en).not.toBe("FitMesh Sync");
          }

          if (res.cta.type === "guide") {
            expect(res.cta.guideSlug).toBeDefined();
            expect(guideSlugSet.has(res.cta.guideSlug!)).toBe(true);
          } else if (res.cta.type === "store") {
            expect(res.cta.href).toEqual({ it: "/it#download", en: "/en#download" });
          }

          const combinedText = [
            res.statusBadge.it,
            res.statusBadge.en,
            res.explanation.it,
            res.explanation.en,
            res.limitations.it,
            res.limitations.en,
            res.evidence.it,
            res.evidence.en,
            res.cta.label.it,
            res.cta.label.en,
            res.route.device.it,
            res.route.device.en,
            res.route.sourceApp.it,
            res.route.sourceApp.en,
            res.route.fitmeshApp.it,
            res.route.fitmeshApp.en,
            res.route.healthStore?.it ?? "",
            res.route.healthStore?.en ?? "",
          ].join(" ");

          expect(combinedText).not.toContain("\u2014");
          for (const banned of bannedPhrases) {
            expect(combinedText.toLowerCase()).not.toContain(banned.toLowerCase());
          }
        }
      }
    }

    expect(totalChecked).toBe(264);
  });
});
