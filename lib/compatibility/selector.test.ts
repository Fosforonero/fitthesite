import { describe, it, expect } from "vitest";
import {
  resolveCompatibilityPath,
  EXPLICIT_COMPATIBILITY_MATRIX,
  SELECTOR_DEVICES,
  SELECTOR_METRICS,
  type SelectorPhoneOs,
} from "./selector-registry";

const OS_LIST: SelectorPhoneOs[] = ["android", "ios"];
const POSITIVE_STATUSES = new Set(["direct_verified", "health_store", "conditional"]);

describe("FitMesh Compatibility Selector Registry", () => {
  it("resolves direct BLE connection for Colmi Ring on steps, heart_rate, sleep, and sleep_stages", () => {
    for (const os of OS_LIST) {
      for (const metric of ["steps", "heart_rate", "sleep", "sleep_stages"] as const) {
        const res = resolveCompatibilityPath(os, "colmi", metric);
        expect(res.status).toBe("direct_verified");
        expect(res.route.healthStore).toBeNull();
        expect(res.cta.href?.it).toBe("/it/blog/colmi-r02-setup");
        expect(res.cta.href?.en).toBe("/en/blog/set-up-colmi-ring");
      }
    }
  });

  it("enforces source priority exclusion for Colmi SpO2 and Fitbit/Apple Watch SpO2", () => {
    const colmiSpo2 = resolveCompatibilityPath("android", "colmi", "spo2");
    expect(colmiSpo2.status).toBe("conditional");
    expect(colmiSpo2.limitations.it).toContain("SpO2, peso e distanza");
    expect(colmiSpo2.limitations.en).toContain("SpO2, weight, or distance");
    expect(colmiSpo2.cta.href).toEqual({ it: "/it#download", en: "/en#download" });

    // Fitbit SpO2 and Apple Watch SpO2 are not claimed as end-to-end verified in matrix-data.ts
    expect(resolveCompatibilityPath("android", "fitbit", "spo2").status).toBe("unverified");
    expect(resolveCompatibilityPath("ios", "apple-watch", "spo2").status).toBe("unverified");
  });

  it("reflects Garmin Body Battery as unsupported with official Garmin Support citation", () => {
    const garminBbAndroid = resolveCompatibilityPath("android", "garmin", "body_battery");
    expect(garminBbAndroid.status).toBe("unsupported");
    expect(garminBbAndroid.evidence.en).toContain("lzpSWu5diM4vgrmUXP4nn5");
    expect(garminBbAndroid.cta.href).toEqual({
      it: "/it/blog/garmin-body-battery-health-connect",
      en: "/en/blog/garmin-body-battery-health-connect",
    });

    const garminBbIos = resolveCompatibilityPath("ios", "garmin", "body_battery");
    expect(garminBbIos.status).toBe("unsupported");
    expect(garminBbIos.evidence.en).toContain("lK5FlFiJvr60uzUSPoh8H6");
  });

  it("reflects Polar as not integrated and Google Fit as not a direct integration with localized guide links", () => {
    const polarRes = resolveCompatibilityPath("android", "polar", "steps");
    expect(polarRes.status).toBe("unsupported");
    expect(polarRes.explanation.it).toContain("non è integrato");
    expect(polarRes.cta.href).toEqual({
      it: "/it/blog/polar-health-connect-sync",
      en: "/en/blog/polar-health-connect-sync",
    });

    const gfitRes = resolveCompatibilityPath("android", "google-fit", "steps");
    expect(gfitRes.status).toBe("unsupported");
    expect(gfitRes.explanation.it).toContain("non è un'integrazione diretta");
    expect(gfitRes.cta.href).toEqual({
      it: "/it/blog/google-health-google-fit",
      en: "/en/blog/google-health-replaces-google-fit",
    });
  });

  it("reflects Samsung synchronization via Health Connect and Energy Score as unsupported via Health Connect without internal build numbers", () => {
    const samsungSteps = resolveCompatibilityPath("android", "samsung", "steps");
    expect(samsungSteps.status).toBe("health_store");
    expect(samsungSteps.explanation.it).toContain("avviene tramite Health Connect");
    expect(samsungSteps.cta.href).toEqual({
      it: "/it/blog/passi-non-si-sincronizzano-galaxy-watch",
      en: "/en/blog/steps-not-syncing-galaxy-watch",
    });

    const samsungEnergy = resolveCompatibilityPath("android", "samsung", "energy_score");
    expect(samsungEnergy.status).toBe("unsupported");
    expect(samsungEnergy.evidence.en).toContain("developer.samsung.com/health/data/guide/features/data-types.html");
  });

  it("reflects workout distance limitation in plain user-facing language without internal codes", () => {
    const garminWorkouts = resolveCompatibilityPath("android", "garmin", "workouts");
    expect(garminWorkouts.status).toBe("conditional");
    expect(garminWorkouts.limitations.it).toContain("in verifica");
    expect(garminWorkouts.limitations.en).toContain("under verification");
    expect(garminWorkouts.cta.href).toEqual({
      it: "/it/blog/garmin-samsung-health-sync-guide",
      en: "/en/blog/sync-garmin-samsung-health-guide",
    });
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

  it("classifies unproven metrics on supported devices as unverified instead of conditional/supported", () => {
    expect(resolveCompatibilityPath("android", "samsung", "hrv").status).toBe("unverified");
    expect(resolveCompatibilityPath("android", "samsung", "spo2").status).toBe("unverified");
    expect(resolveCompatibilityPath("android", "samsung", "temperature").status).toBe("unverified");
    expect(resolveCompatibilityPath("android", "samsung", "vo2_max").status).toBe("unverified");

    expect(resolveCompatibilityPath("android", "garmin", "hrv").status).toBe("unverified");
    expect(resolveCompatibilityPath("android", "garmin", "spo2").status).toBe("unverified");
    expect(resolveCompatibilityPath("ios", "garmin", "sleep_stages").status).toBe("unverified");

    expect(resolveCompatibilityPath("ios", "oura", "hrv").status).toBe("unverified");
    expect(resolveCompatibilityPath("android", "oura", "hrv").status).toBe("conditional");

    expect(resolveCompatibilityPath("ios", "apple-watch", "temperature").status).toBe("unverified");
    expect(resolveCompatibilityPath("android", "whoop", "steps").status).toBe("unverified");
    expect(resolveCompatibilityPath("ios", "withings", "steps").status).toBe("unverified");
  });

  it("verifies all 264 selectable combinations for explicit matrix alignment, concrete evidence, localized links, and zero banned tokens or em dashes", () => {
    let totalChecked = 0;
    const bannedPhrases = [
      "Oura App v5+",
      "matrice test su dispositivi reali",
      "real device testing matrix",
      "verifiche runtime",
      "runtime tests",
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
            // Every explicitly classified result must cite a concrete URL or repository source
            expect(res.evidence.it).toMatch(/https:\/\/|lib\//);
            expect(res.evidence.en).toMatch(/https:\/\/|lib\//);
          }

          // Inactive routes must not claim an active FitMesh Sync step
          if (res.status === "unsupported" || res.status === "unverified") {
            expect(res.route.fitmeshApp.it).not.toBe("FitMesh Sync");
            expect(res.route.fitmeshApp.en).not.toBe("FitMesh Sync");
          }

          // Check localized CTA hrefs
          if (res.cta.type !== "none") {
            expect(res.cta.href).toBeDefined();
            expect(res.cta.href?.it.startsWith("/it")).toBe(true);
            expect(res.cta.href?.en.startsWith("/en")).toBe(true);
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
