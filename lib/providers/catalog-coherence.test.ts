import { describe, expect, it } from "vitest";
import { PROVIDERS, PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import {
  SUPPORTED_PROVIDERS_ANDROID,
  SUPPORTED_PROVIDERS_IOS,
} from "@/lib/product-facts";
import { isProviderVariantIndexable } from "@/lib/providers/indexability";
import { LANDING_PAGES } from "@/lib/landing/data";
import { ABOUT_COPY } from "@/lib/content/about-copy";
import {
  PROVIDER_MODELS,
  PLATFORM_FEATURE_LABELS,
  type PlatformFeatureKey,
} from "@/lib/providers/models";
import { providerPlatforms } from "@/lib/providers/platforms";
import type { Locale } from "@/lib/i18n";
import fs from "node:fs";
import path from "node:path";

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

  describe("Huawei Health Catalog & Neutral Guardrails", () => {
    const huawei = PROVIDERS_BY_SLUG["huawei"];

    it("has status 'not-available'", () => {
      expect(huawei).toBeDefined();
      expect(huawei.status).toBe("not-available");
      expect(huawei.status).not.toBe("coming-soon");
      expect(huawei.status).not.toBe("roadmap-q4");
    });

    it("has zero supported data types", () => {
      expect(huawei.dataTypes.every((d) => !d.supported)).toBe(true);
    });

    it("has no setupGuide", () => {
      expect(huawei.setupGuide).toBeUndefined();
    });

    it("does not promise coming-soon, Q4 2026, waitlist, beta, 12-month backfill, polling, or OAuth approval", () => {
      const allText = JSON.stringify({
        tagline: huawei.tagline,
        longDesc: huawei.longDesc,
        techNote: huawei.techNote,
        faqs: huawei.faqs,
      });

      expect(allText).not.toMatch(/Q4 2026|T4 2026|coming-soon|in arrivo|closed beta|beta aperta/i);
      expect(allText).not.toMatch(/12 mesi|12-month|backfill/i);
      expect(allText).not.toMatch(/waitlist|lista d'attesa/i);
      expect(allText).not.toMatch(/polling/i);
      expect(allText).not.toMatch(/AppGallery/i);
    });

    it("is indexable across all 11 provider catalog locales with neutral copy", () => {
      for (const lc of PROVIDER_LOCALES) {
        expect(
          isProviderVariantIndexable(huawei, lc),
          `huawei variant ${lc} should be indexable`,
        ).toBe(true);
      }
    });

    it("is not advertised as out-of-the-box Health Connect in marketing pages", () => {
      const rootDir = process.cwd();
      const pressContent = fs.readFileSync(path.join(rootDir, "app/(frontend)/[locale]/(marketing)/press/page.tsx"), "utf-8");
      const intContent = fs.readFileSync(path.join(rootDir, "app/(frontend)/[locale]/(marketing)/integrations/page.tsx"), "utf-8");
      const famContent = fs.readFileSync(path.join(rootDir, "app/(frontend)/[locale]/(marketing)/famiglia/page.tsx"), "utf-8");
      const roadContent = fs.readFileSync(path.join(rootDir, "app/(frontend)/[locale]/(marketing)/roadmap/page.tsx"), "utf-8");

      expect(pressContent).not.toMatch(/Huawei/i);
      expect(intContent).not.toMatch(/Huawei Health/i);
      expect(famContent).not.toMatch(/Huawei/i);
      expect(roadContent).not.toMatch(/Huawei Health Kit/i);
    });
  });

  describe("Suunto Catalog & Neutral Guardrails", () => {
    const suunto = PROVIDERS_BY_SLUG["suunto"];

    it("has status 'not-available'", () => {
      expect(suunto).toBeDefined();
      expect(suunto.status).toBe("not-available");
      expect(suunto.status).not.toBe("beta");
      expect(suunto.status).not.toBe("coming-soon");
    });

    it("has zero supported data types and workouts is strictly false", () => {
      expect(suunto.dataTypes.every((d) => !d.supported)).toBe(true);
      const workouts = suunto.dataTypes.find((d) => d.key === "workouts");
      expect(workouts?.supported).toBe(false);
    });

    it("has no setupGuide", () => {
      expect(suunto.setupGuide).toBeUndefined();
    });

    it("does not claim false PKCE, webhook, real-time sync, sync on app open, or arbitrary sync times (15-60s)", () => {
      const allText = JSON.stringify({
        tagline: suunto.tagline,
        longDesc: suunto.longDesc,
        techNote: suunto.techNote,
        faqs: suunto.faqs,
      });

      expect(allText).not.toMatch(/PKCE/i);
      expect(allText).not.toMatch(/webhook/i);
      expect(allText).not.toMatch(/real-time|tempo reale/i);
      expect(allText).not.toMatch(/apertura.*app|opening the app/i);
      expect(allText).not.toMatch(/15-60|15\s*secondi|60\s*secondi/i);
    });

    it("does not leak internal token routes, proxy secrets, or unverified public beta claims", () => {
      const allText = JSON.stringify({
        tagline: suunto.tagline,
        longDesc: suunto.longDesc,
        techNote: suunto.techNote,
        faqs: suunto.faqs,
      });

      expect(allText).not.toMatch(/\/api\/v1\/suunto\/token/);
      expect(allText).not.toMatch(/\/api\/v1\/oauth\/suunto\/exchange/);
      expect(allText).not.toMatch(/client_secret|basic auth/i);
    });

    it("is indexable across all 11 provider catalog locales with neutral copy", () => {
      for (const lc of PROVIDER_LOCALES) {
        expect(
          isProviderVariantIndexable(suunto, lc),
          `suunto variant ${lc} should be indexable`,
        ).toBe(true);
      }
    });
  });

  describe("Universal not-available Status Invariants", () => {
    const notAvailableProviders = PROVIDERS.filter((p) => p.status === "not-available");

    it("ensures at least Huawei and Suunto are not-available", () => {
      const slugs = notAvailableProviders.map((p) => p.slug);
      expect(slugs).toContain("huawei");
      expect(slugs).toContain("suunto");
    });

    it("strictly requires ZERO supported data types on all not-available providers", () => {
      for (const p of notAvailableProviders) {
        for (const dt of p.dataTypes) {
          expect(
            dt.supported,
            `Provider ${p.slug} has status 'not-available' but claims data type '${dt.key}' is supported`,
          ).toBe(false);
        }
      }
    });

    it("strictly prohibits setupGuide on all not-available providers", () => {
      for (const p of notAvailableProviders) {
        expect(
          p.setupGuide,
          `Provider ${p.slug} has status 'not-available' and must not have a setupGuide`,
        ).toBeUndefined();
      }
    });

    it("strictly prohibits viaHC on all not-available providers", () => {
      for (const p of notAvailableProviders) {
        expect(
          (p as unknown as Record<string, unknown>).viaHC,
          `Provider ${p.slug} has status 'not-available' and must not define viaHC`,
        ).toBeUndefined();
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

  describe("Oura Models Guardrails (ring-gen3 and ring-4)", () => {
    const ouraModels = PROVIDER_MODELS["oura"] ?? [];
    const gen3 = ouraModels.find((m) => m.slug === "ring-gen3");
    const ring4 = ouraModels.find((m) => m.slug === "ring-4");

    it("defines both ring-gen3 and ring-4 in PROVIDER_MODELS.oura", () => {
      expect(gen3).toBeDefined();
      expect(ring4).toBeDefined();
    });

    it("has distinct platformFeatures for Android and iOS without excluded metrics", () => {
      for (const model of [gen3!, ring4!]) {
        expect(model.platformFeatures).toBeDefined();
        const android = model.platformFeatures?.android ?? [];
        const ios = model.platformFeatures?.ios ?? [];

        // Android supported metrics (Oura Health Connect official docs)
        expect(android).toContain("sleep");
        expect(android).toContain("heart_rate");
        expect(android).toContain("hrv");
        expect(android).toContain("steps");
        expect(android).toContain("active_energy");
        expect(android).toContain("distance");
        expect(android).toContain("workouts");

        // Android prohibited metrics (no SpO2, skin temp, autonomous resting HR, sleep stages)
        expect(android).not.toContain("spo2");
        expect(android).not.toContain("skin_temperature");
        expect(android).not.toContain("resting_heart_rate");
        expect(android).not.toContain("sleep_stages");

        // iOS supported metrics (Oura Apple Health official docs)
        expect(ios).toContain("sleep_stages");
        expect(ios).toContain("heart_rate");
        expect(ios).toContain("respiratory_rate");
        expect(ios).toContain("steps");
        expect(ios).toContain("active_energy");
        expect(ios).toContain("workouts");

        // iOS prohibited metrics (no autonomous distance or resting HR record)
        expect(ios).not.toContain("distance");
        expect(ios).not.toContain("resting_heart_rate");
        expect(ios).not.toContain("spo2");
        expect(ios).not.toContain("skin_temperature");
      }
    });

    it("hcFeatures do not advertise SpO2, skin temperature, resting HR, sleep stages, or RMSSD", () => {
      for (const model of [gen3!, ring4!]) {
        const hc = model.hcFeatures.map((f) => f.toLowerCase());
        expect(hc.some((f) => f.includes("spo2"))).toBe(false);
        expect(hc.some((f) => f.includes("skin") || f.includes("temperat"))).toBe(false);
        expect(hc.some((f) => f.includes("resting"))).toBe(false);
        expect(hc.some((f) => f.includes("stage") || f.includes("fasi"))).toBe(false);
        expect(hc.some((f) => f.includes("rmssd"))).toBe(false);
      }
    });

    it("does not claim SpO2, skin temperature, autonomous resting HR, sleep stages on Android, or complete Readiness export across all 11 locales", () => {
      for (const model of [gen3!, ring4!]) {
        for (const lc of PROVIDER_LOCALES) {
          const desc = model.description[lc] ?? "";
          expect(desc).not.toMatch(/più accurato|most accurate/i);

          for (const faq of model.faq) {
            const a = faq.a[lc] ?? "";
            expect(a).not.toMatch(/readiness.*(tutti|complet|interamente|fully)/i);
          }
        }
      }
    });

    it("separates ring measurement, Oura app display, bridge export, and FitMesh reading across all 11 locales", () => {
      for (const model of [gen3!, ring4!]) {
        for (const lc of PROVIDER_LOCALES) {
          const desc = model.description[lc] ?? "";
          expect(desc.length).toBeGreaterThan(50);
        }
        expect(model.faq.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("has authentic, non-English FAQ translations for all non-English locales for both models", () => {
      const nonEnLocales: Locale[] = ["it", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"];
      for (const model of [gen3!, ring4!]) {
        for (const faq of model.faq) {
          for (const lc of nonEnLocales) {
            expect(faq.q[lc]).toBeDefined();
            expect(faq.a[lc]).toBeDefined();
            expect(faq.q[lc]).not.toBe(faq.q.en);
            expect(faq.a[lc]).not.toBe(faq.a.en);
          }
        }
      }
    });
  });

  describe("Platform Features Dictionary & SSOT Platform Helpers", () => {
    it("PLATFORM_FEATURE_LABELS covers all PlatformFeatureKeys across all 11 catalog locales", () => {
      const requiredKeys: PlatformFeatureKey[] = [
        "sleep",
        "sleep_stages",
        "heart_rate",
        "hrv",
        "respiratory_rate",
        "steps",
        "active_energy",
        "distance",
        "workouts",
      ];

      for (const key of requiredKeys) {
        const entry = PLATFORM_FEATURE_LABELS[key];
        expect(entry, `PLATFORM_FEATURE_LABELS must define ${key}`).toBeDefined();
        for (const lc of PROVIDER_LOCALES) {
          const label = entry[lc];
          expect(label, `Key ${key} must have label in ${lc}`).toBeDefined();
          expect(label.trim().length, `Key ${key} in ${lc} must not be empty`).toBeGreaterThan(0);
        }
      }
    });

    it("providerPlatforms SSOT returns expected platform lists for all providers", () => {
      const oura = PROVIDERS_BY_SLUG["oura"];
      const colmi = PROVIDERS_BY_SLUG["colmi-ring"];
      const apple = PROVIDERS_BY_SLUG["apple-health"];
      const samsung = PROVIDERS_BY_SLUG["galaxy-watch"];
      const garmin = PROVIDERS_BY_SLUG["garmin"];
      const pixel = PROVIDERS_BY_SLUG["pixel-watch"];
      const polar = PROVIDERS_BY_SLUG["polar"];

      expect(providerPlatforms(oura)).toEqual(["android", "ios"]);
      expect(providerPlatforms(colmi)).toEqual(["android", "ios"]);
      expect(providerPlatforms(apple)).toEqual(["ios"]);
      expect(providerPlatforms(samsung)).toEqual(["android"]);
      expect(providerPlatforms(garmin)).toEqual(["android"]);
      expect(providerPlatforms(pixel)).toEqual(["android"]);
      expect(providerPlatforms(polar)).toEqual(["android"]);
      expect(providerPlatforms(undefined)).toEqual(["android"]);
    });
  });

  describe("P0.22-C-E Micro-Gate Editorial & Claim Guardrails", () => {
    it("enforces negative constraints on Hanja, Oura Membership scope, bridge phrasing, latencies, and sensor comparisons", () => {
      // 1. No Hanja in Korean Fitbit copy
      const fitbit = PROVIDERS_BY_SLUG["fitbit"];
      const fitbitFaqStr = JSON.stringify(fitbit.faqs);
      expect(fitbitFaqStr).not.toContain("수面");

      // 2. No unproven latency (15-30) in Fitbit or Garmin technical notes
      const garmin = PROVIDERS_BY_SLUG["garmin"];
      const fitbitNotesStr = JSON.stringify(fitbit.setupGuide?.technicalNotes || {}) + JSON.stringify(fitbit.techNote || {});
      const garminNotesStr = JSON.stringify(garmin.setupGuide?.technicalNotes || {}) + JSON.stringify(garmin.techNote || {});
      expect(fitbitNotesStr).not.toMatch(/15–30|15-30|latenza|latency/i);
      expect(garminNotesStr).not.toMatch(/15–30|15-30|latenza|latency/i);

      // 3. No "all health data" or "full health data" relative to Oura Membership
      const ouraModels = PROVIDER_MODELS["oura"] || [];
      const ouraModelsStr = JSON.stringify(ouraModels);
      expect(ouraModelsStr).not.toMatch(/full health data|all health data|tutti i dati sanitari|todos los datos de salud|alle Gesundheitsdaten|todos os dados de saúde|toutes les données de santé|pełne dane zdrowotne|tüm sağlık verilerini|alle gezondheidsgegevens|完全な健康データ|모든 건강 데이터/);

      // 4. No "reads them locally" or local-only implication in Oura models
      expect(ouraModelsStr).not.toMatch(/reads them locally|legge in locale|lee localmente|lokal liest|lê localmente|lit localement|odczytuje je lokalnie|yerel olarak okur|lokaal uitleest/);

      // 5. No banned Oura Ring 4 sensor comparison to previous generations
      const ring4 = ouraModels.find((m) => m.slug === "ring-4");
      expect(ring4).toBeDefined();
      const ring4DescStr = JSON.stringify(ring4?.description);
      expect(ring4DescStr).not.toMatch(/recessed interior sensors|compared to previous generations|sensori interni a filo|generazione precedente|sensores interiores enrasados|bündig integrierte Innensensoren|sensores internos embutidos|capteurs intérieurs affleurants|wpuszczane czujniki wewnętrzne|gömme iç sensörlere|verzonken sensoren|前世代と比べて|이전 세대 대비/);
    });
  });
});
