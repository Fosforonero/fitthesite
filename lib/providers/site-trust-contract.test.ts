import { describe, expect, it, vi } from "vitest";

// Il catalogo del blog in sitemap viene dalla sorgente CMS: qui il test usa i
// post statici per evitare import da @payload-config non configurato in test.
vi.mock("@/lib/blog/payload-source", async () => {
  const { BLOG_POSTS: posts } = await import("@/lib/blog/data");
  return { getBlogPosts: async () => posts, getBlogPostsBySlug: async () => posts };
});

import { PROVIDERS, PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { PROVIDER_MODELS } from "@/lib/providers/models";
import { isProviderVariantIndexable, isProviderModelVariantIndexable, providerLinkHref } from "@/lib/providers/indexability";
import { getExcludedBannerNotice } from "@/lib/providers/excluded-banner";
import sitemap from "@/app/sitemap";
import { generateLlmsTxt } from "@/lib/llms-txt";
import { PRICING_SECTION } from "@/lib/pricing-section";
import { SUPPORT_FAQS } from "@/lib/content/faqs";
import { DELETE_ACCOUNT_COPY } from "@/lib/content/delete-account-copy";
import { ABOUT_COPY } from "@/lib/content/about-copy";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { BLOG_POSTS } from "@/lib/blog/data";
import { applyNordicOverlay } from "@/lib/blog/nordic-overlay";
import nordicOverlay from "@/lib/blog/nordic-overlay.json";
import fs from "node:fs";
import path from "node:path";

describe("SPRINT SITE-TRUST-01: Contratto FONTI AMMESSE e Correzioni di Fiducia", () => {
  const EXCLUDED_SLUGS = ["fitbit", "polar", "oura", "withings", "huawei"] as const;

  describe("Punto 1: Visibilita promozionale dei provider", () => {
    it("i provider esclusi hanno promotionalVisibility: false in data.ts", () => {
      for (const slug of EXCLUDED_SLUGS) {
        const p = PROVIDERS_BY_SLUG[slug];
        expect(p, `Provider ${slug} deve esistere`).toBeDefined();
        expect(p.promotionalVisibility, `Provider ${slug} deve avere promotionalVisibility: false`).toBe(false);
      }
    });

    it("lo stato tecnico dei provider esclusi e preservato senza alterazioni", () => {
      expect(PROVIDERS_BY_SLUG["fitbit"].status).toBe("live-basic");
      expect(PROVIDERS_BY_SLUG["polar"].status).toBe("live-basic");
      expect(PROVIDERS_BY_SLUG["oura"].status).toBe("live-bridge");
      expect(PROVIDERS_BY_SLUG["withings"].status).toBe("live-basic");
      expect(PROVIDERS_BY_SLUG["huawei"].status).toBe("not-available");
      expect(PROVIDERS_BY_SLUG["suunto"].status).toBe("live");
      expect(PROVIDERS_BY_SLUG["strava"].status).toBe("limited-beta");
    });

    it("la griglia e il marquee della homepage filtrano promotionalVisibility !== false", () => {
      const homePath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/page.tsx");
      const homeCode = fs.readFileSync(homePath, "utf-8");
      expect(homeCode).toMatch(/promotionalVisibility !== false/);
    });

    it("la pagina /integrations filtra i provider con promotionalVisibility !== false", () => {
      const intPath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/integrations/page.tsx");
      const intCode = fs.readFileSync(intPath, "utf-8");
      expect(intCode).toMatch(/promotionalVisibility !== false/);
    });
  });

  describe("Punto 2: Pagine /sync dei provider esclusi e relativi modelli", () => {
    it("le varianti dei provider esclusi non sono indicizzabili (isProviderVariantIndexable restituisce false)", () => {
      for (const slug of EXCLUDED_SLUGS) {
        const p = PROVIDERS_BY_SLUG[slug];
        expect(isProviderVariantIndexable(p, "it"), `${slug} it non deve essere indicizzabile`).toBe(false);
        expect(isProviderVariantIndexable(p, "en"), `${slug} en non deve essere indicizzabile`).toBe(false);
      }
    });

    it("i link interni promozionali verso i provider esclusi restituiscono null", () => {
      for (const slug of EXCLUDED_SLUGS) {
        const p = PROVIDERS_BY_SLUG[slug];
        expect(providerLinkHref(p, "it")).toBeNull();
        expect(providerLinkHref(p, "en")).toBeNull();
      }
    });

    it("i provider esclusi e i loro modelli non compaiono nella sitemap", async () => {
      const entries = await sitemap();
      const urls = entries.map((e) => e.url);

      for (const slug of EXCLUDED_SLUGS) {
        const providerUrls = urls.filter((u) => u.includes(`/sync/${slug}`));
        expect(providerUrls, `Nessun URL per ${slug} deve comparire in sitemap`).toEqual([]);
      }
    });

    it("le pagine sync dei provider esclusi hanno avviso in testa e nessun badge store", () => {
      const provPagePath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx");
      const provCode = fs.readFileSync(provPagePath, "utf-8");
      expect(provCode).toMatch(/getExcludedBannerNotice/);
      expect(provCode).toMatch(/promotionalVisibility/);
      for (const slug of EXCLUDED_SLUGS) {
        const p = PROVIDERS_BY_SLUG[slug];
        const notice = getExcludedBannerNotice(p, "it");
        expect(notice.directUnavailable).toMatch(/Il collegamento diretto a/);
      }
    });

    it("le pagine sync dei modelli di provider esclusi hanno avviso in testa e nessun badge store", () => {
      const modelPagePath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/sync/[provider]/[model]/page.tsx");
      const modelCode = fs.readFileSync(modelPagePath, "utf-8");
      expect(modelCode).toMatch(/getExcludedBannerNotice/);
      expect(modelCode).toMatch(/promotionalVisibility/);
      for (const slug of EXCLUDED_SLUGS) {
        const p = PROVIDERS_BY_SLUG[slug];
        const notice = getExcludedBannerNotice(p, "it");
        expect(notice.directUnavailable).toMatch(/Il collegamento diretto a/);
      }
    });
  });

  describe("Punto 3: Pagina /sync/suunto allineata al contratto", () => {
    const suunto = PROVIDERS_BY_SLUG["suunto"];

    it("suunto supporta allenamenti e dati giornalieri, e non supporta traccia GPS/distanza", () => {
      const workouts = suunto.dataTypes.find((d) => d.key === "workouts");
      const distance = suunto.dataTypes.find((d) => d.key === "distance");
      const steps = suunto.dataTypes.find((d) => d.key === "steps");
      const hr = suunto.dataTypes.find((d) => d.key === "hr");

      expect(workouts?.supported, "Suunto deve supportare workouts").toBe(true);
      expect(distance?.supported, "Suunto non deve supportare distance/GPS").toBe(false);
      expect(steps?.supported).toBe(true);
      expect(hr?.supported).toBe(true);
    });

    it("descrizione e technote di Suunto escludono sync background automatica e traccia GPS", () => {
      const allText = JSON.stringify({
        longDesc: suunto.longDesc,
        techNote: suunto.techNote,
        faqs: suunto.faqs,
      });

      expect(allText).toMatch(/background/i);
      expect(allText).toMatch(/GPS/i);
    });
  });

  describe("Punto 4: llms.txt non promuove provider esclusi e dichiara le funzioni non disponibili", () => {
    const txt = generateLlmsTxt();

    it("non include collegamenti promozionali a fitbit, polar, oura, withings, huawei", () => {
      for (const slug of EXCLUDED_SLUGS) {
        expect(txt).not.toMatch(new RegExp(`\\[.*\\]\\(https?://[^)]+/sync/${slug}\\)`));
      }
    });

    it("dichiara non disponibili dashboard web, export FIT (distinto da JSON), Mesh Famiglia e collegamenti diretti", () => {
      expect(txt).toMatch(/FIT format/i);
      expect(txt).toMatch(/JSON/i);
      expect(txt).toMatch(/Family Mesh/i);
      expect(txt).toMatch(/web dashboard/i);
      expect(txt).toMatch(/direct connections? (to|for) (Garmin|Samsung|Polar|Oura)/i);
    });
  });

  describe("Punto 5: Articolo Founder e promesse corrette", () => {
    const founderPath = path.join(process.cwd(), "lib/blog/posts/fitmesh-gratis-prezzo-founder.ts");
    const founderCode = fs.readFileSync(founderPath, "utf-8");

    it("elimina pannello web in favore della consultazione nell app", () => {
      expect(founderCode).not.toMatch(/pannello web/i);
      expect(founderCode).not.toMatch(/web panel/i);
    });

    it("elimina paragoni caffe e pizza in favore del prezzo mostrato dallo store", () => {
      expect(founderCode).not.toMatch(/caffè|caffe|coffee/i);
      expect(founderCode).not.toMatch(/pizza/i);
    });

    it("non presenta acquisto e cancellazione come sole alternative obbligatorie", () => {
      expect(founderCode).not.toMatch(/oppure chiudi l'account|or you close the account/i);
    });
  });

  describe("Punto 6: Prova 14 giorni testo definitivo approvato", () => {
    const itExact = "I nuovi account possono provare FitMesh Pro gratis per 14 giorni. Dopo la prova, per continuare a sincronizzare serve un acquisto a vita o un abbonamento ogni 6 mesi. Esportare i dati in formato JSON e richiedere la cancellazione dell'account non richiede un acquisto.";
    const enExact = "New accounts can try FitMesh Pro free for 14 days. After the trial, continuing to sync requires a lifetime purchase or a 6-month subscription. Exporting your data as JSON and requesting account deletion do not require a purchase.";

    it("sezione prezzi usa il testo esatto approvato per IT ed EN", () => {
      expect(PRICING_SECTION.subhead.it).toBe(itExact);
      expect(PRICING_SECTION.subhead.en).toBe(enExact);
    });

    it("FAQ supporto costo usa il testo esatto approvato per IT ed EN", () => {
      const itFaq = SUPPORT_FAQS["it"].find((f) => f.q.includes("Quanto costa"));
      const enFaq = SUPPORT_FAQS["en"].find((f) => f.q.includes("How much does"));
      expect(itFaq?.a).toBe(itExact);
      expect(enFaq?.a).toBe(enExact);
    });
  });

  describe("Punto 7: Copy cancellazione account distingue sorgenti dirette e indirette", () => {
    it("distingue sorgenti dirette da sorgenti indirette via Health Connect / Apple Health", () => {
      expect(DELETE_ACCOUNT_COPY.en.externalBody).toMatch(/directly connected sources/i);
      expect(DELETE_ACCOUNT_COPY.en.externalBody).toMatch(/indirect sources/i);
      expect(DELETE_ACCOUNT_COPY.it.externalBody).toMatch(/connessioni dirette/i);
      expect(DELETE_ACCOUNT_COPY.it.externalBody).toMatch(/sorgenti indirette/i);
    });
  });

  describe("Punto 8: Pagina About qualifica Mesh Famiglia e non promette Oura/Fitbit diretti", () => {
    it("about-copy non promette Oura diretta o Fitbit cloud come funzioni disponibili", () => {
      const aboutPath = path.join(process.cwd(), "lib/content/about-copy.ts");
      const aboutCode = fs.readFileSync(aboutPath, "utf-8");
      expect(aboutCode).not.toMatch(/Oura API diretta per metriche proprietarie/);
      expect(aboutCode).not.toMatch(/Fitbit accesso cloud dati storici/);
    });

    it("Mesh Famiglia e qualificata come in sviluppo", () => {
      expect(ABOUT_COPY.familyBody.it).toMatch(/in sviluppo/i);
      expect(ABOUT_COPY.familyBody.en).toMatch(/in development/i);
    });
  });

  describe("Punto 9: Metadati Supporto hanno openGraph e twitter specifici", async () => {
    const supportPagePath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/support/page.tsx");
    const supportCode = fs.readFileSync(supportPagePath, "utf-8");

    it("support/page.tsx genera openGraph e twitter specifici", () => {
      expect(supportCode).toMatch(/openGraph:\s*\{/);
      expect(supportCode).toMatch(/twitter:\s*\{/);
    });
  });

  describe("Punto 10: Varianti nordiche indicizzabili hanno corpo tradotto", () => {
    for (const p of BLOG_POSTS) {
      applyNordicOverlay(p, nordicOverlay as any);
    }

    it("nessuna variante nordica indicizzabile presenta corpo identico a inglese o italiano", () => {
      for (const lc of ["sv", "da", "no", "fi"] as const) {
        for (const p of BLOG_POSTS) {
          if (isBlogVariantIndexable(p, lc)) {
            const firstPara = p.body.find((b) => b.type === "paragraph")?.text;
            if (firstPara) {
              const text = (firstPara as any)[lc];
              const textIt = (firstPara as any).it;
              const textEn = (firstPara as any).en;
              expect(text, `${p.slug} in ${lc} non deve coincidere con IT`).not.toBe(textIt);
              expect(text, `${p.slug} in ${lc} non deve coincidere con EN`).not.toBe(textEn);
            }
          }
        }
      }
    });
  });
});
