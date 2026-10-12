import { describe, expect, it, vi } from "vitest";

// Il catalogo del blog in sitemap viene dalla sorgente CMS: qui il test usa i
// post statici per evitare import da @payload-config non configurato in test.
vi.mock("@/lib/blog/payload-source", async () => {
  const { BLOG_POSTS: posts } = await import("@/lib/blog/data");
  return {
    getBlogPosts: async () => posts,
    getBlogPostsBySlug: async () => posts,
    getBlogPostBySlug: async (slug: string) => posts.find((p) => p.slug === slug) ?? null,
  };
});

import { renderToStaticMarkup } from "react-dom/server";
// @ts-expect-error jsdom lacks bundled declaration in devDependencies
import { JSDOM } from "jsdom";
import Home from "@/app/(frontend)/[locale]/(marketing)/page";
import IntegrationsHub from "@/app/(frontend)/[locale]/(marketing)/integrations/page";
import ProviderSyncPage, { generateMetadata as generateProviderMetadata } from "@/app/(frontend)/[locale]/(marketing)/sync/[provider]/page";
import ModelPage, { generateMetadata as generateModelMetadata } from "@/app/(frontend)/[locale]/(marketing)/sync/[provider]/[model]/page";

import { PROVIDERS, PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { PROVIDER_MODELS } from "@/lib/providers/models";
import { providerPlatforms } from "@/lib/providers/platforms";
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
import { AVAILABILITY } from "@/lib/product-facts";
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

    it("la griglia e il marquee della homepage renderizzata escludono i provider non visibili", async () => {
      const html = renderToStaticMarkup(await Home({ params: Promise.resolve({ locale: "it" }) }));
      const doc = new JSDOM(html).window.document;
      for (const slug of EXCLUDED_SLUGS) {
        expect(doc.querySelector(`a[href*="/sync/${slug}"]`), `Link a ${slug} non deve essere presente in homepage`).toBeNull();
      }
    });

    it("la pagina /integrations renderizzata filtra i provider con promotionalVisibility !== false", async () => {
      const html = renderToStaticMarkup(await IntegrationsHub({ params: Promise.resolve({ locale: "it" }) }));
      const doc = new JSDOM(html).window.document;
      for (const slug of EXCLUDED_SLUGS) {
        expect(doc.querySelector(`a[href*="/sync/${slug}"]`), `Link a ${slug} non deve essere presente in /integrations`).toBeNull();
      }
    });
    it("Galaxy Watch ha stato live-bridge e piattaforma Android", () => {
      const gw = PROVIDERS_BY_SLUG["galaxy-watch"];
      expect(gw.status).toBe("live-bridge");
      expect(providerPlatforms(gw)).toEqual(["android"]);
    });

    it("Galaxy Watch non presenta un collegamento diretto Samsung Health", () => {
      const gw = PROVIDERS_BY_SLUG["galaxy-watch"];
      const allText = JSON.stringify({
        longDesc: gw.longDesc,
        techNote: gw.techNote,
        faqs: gw.faqs,
      });
      expect(allText).toMatch(/Health Connect/i);
      expect(allText).not.toMatch(/collegamento diretto a Samsung Health/i);
      expect(allText).not.toMatch(/direct connection to Samsung Health/i);
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

    it("le pagine sync dei provider esclusi hanno avviso in testa, nessun badge store, noindex e distinguono i breadcrumb", async () => {
      for (const slug of EXCLUDED_SLUGS) {
        const p = PROVIDERS_BY_SLUG[slug];
        const meta = await generateProviderMetadata({ params: Promise.resolve({ locale: "it", provider: slug }) });
        expect(meta.robots, `${slug} deve avere robots noindex,follow`).toEqual({ index: false, follow: true });

        const html = renderToStaticMarkup(await ProviderSyncPage({ params: Promise.resolve({ locale: "it", provider: slug }) }));
        const doc = new JSDOM(html).window.document;
        const notice = getExcludedBannerNotice(p, "it");
        expect(doc.body.textContent).toContain(notice.directUnavailable);

        // Assenza badge store
        const storeLinks = Array.from(doc.querySelectorAll("a[href*='apple.com'], a[href*='play.google.com']"));
        expect(storeLinks, `Nessun badge store deve essere renderizzato per ${slug}`).toHaveLength(0);

        // Breadcrumb informativo presente nello schema JSON-LD
        const scripts = Array.from(doc.querySelectorAll("script[type='application/ld+json']")).map((s: any) => s.textContent || "");
        const breadcrumbScript = scripts.find((s) => s.includes('"@type":"BreadcrumbList"'));
        expect(breadcrumbScript, `Breadcrumb schema presente per ${slug}`).toBeDefined();
        expect(breadcrumbScript).toContain("/it/integrations");

        // CTA visivo neutro verso /integrations e nessun download promozionale
        const ctaBtn = doc.querySelector("a[href='/it/integrations']");
        expect(ctaBtn, `CTA neutro verso /integrations presente per ${slug}`).not.toBeNull();
        expect(doc.querySelector("a[href*='/download']")).toBeNull();
      }
    });

    it("le pagine sync dei modelli di provider esclusi hanno avviso in testa, nessun badge store, noindex e distinguono i breadcrumb", async () => {
      const sampleModels = [
        { provider: "oura", model: "ring-gen3" },
        { provider: "fitbit", model: "charge-6" },
        { provider: "polar", model: "vantage-v3" },
        { provider: "withings", model: "scanwatch-2" },
      ];
      for (const { provider, model } of sampleModels) {
        const p = PROVIDERS_BY_SLUG[provider];
        const meta = await generateModelMetadata({ params: Promise.resolve({ locale: "it", provider, model }) });
        expect(meta.robots, `${provider}/${model} deve avere robots noindex,follow`).toEqual({ index: false, follow: true });

        const html = renderToStaticMarkup(await ModelPage({ params: Promise.resolve({ locale: "it", provider, model }) }));
        const doc = new JSDOM(html).window.document;
        const notice = getExcludedBannerNotice(p, "it");
        expect(doc.body.textContent).toContain(notice.directUnavailable);

        // Assenza badge store
        const storeLinks = Array.from(doc.querySelectorAll("a[href*='apple.com'], a[href*='play.google.com']"));
        expect(storeLinks, `Nessun badge store deve essere renderizzato per ${provider}/${model}`).toHaveLength(0);

        // Breadcrumb informativo presente nello schema JSON-LD
        const scripts = Array.from(doc.querySelectorAll("script[type='application/ld+json']")).map((s: any) => s.textContent || "");
        const breadcrumbScript = scripts.find((s) => s.includes('"@type":"BreadcrumbList"'));
        expect(breadcrumbScript, `Breadcrumb schema presente per ${provider}/${model}`).toBeDefined();
        expect(breadcrumbScript).toContain(`/it/sync/${provider}`);

        // CTA visivo neutro verso /integrations e nessun download promozionale
        const ctaBtn = doc.querySelector("a[href='/it/integrations']");
        expect(ctaBtn, `CTA neutro verso /integrations presente per ${provider}/${model}`).not.toBeNull();
        expect(doc.querySelector("a[href*='/download']")).toBeNull();
      }
    });

    it("le pagine sync e modello escludono HowTo e FAQPage JSON-LD nel DOM per i provider esclusi", async () => {
      for (const slug of EXCLUDED_SLUGS) {
        const provHtml = renderToStaticMarkup(await ProviderSyncPage({ params: Promise.resolve({ locale: "it", provider: slug }) }));
        const provDoc = new JSDOM(provHtml).window.document;
        const provScripts = Array.from(provDoc.querySelectorAll("script[type='application/ld+json']")).map((s: any) => s.textContent || "");
        for (const scriptText of provScripts) {
          expect(scriptText).not.toContain('"@type":"HowTo"');
          expect(scriptText).not.toContain('"@type":"FAQPage"');
        }
      }

      const sampleModels = [
        { provider: "oura", model: "ring-gen3" },
        { provider: "fitbit", model: "charge-6" },
        { provider: "polar", model: "vantage-v3" },
        { provider: "withings", model: "scanwatch-2" },
      ];
      for (const { provider, model } of sampleModels) {
        const modelHtml = renderToStaticMarkup(await ModelPage({ params: Promise.resolve({ locale: "it", provider, model }) }));
        const modelDoc = new JSDOM(modelHtml).window.document;
        const modelScripts = Array.from(modelDoc.querySelectorAll("script[type='application/ld+json']")).map((s: any) => s.textContent || "");
        for (const scriptText of modelScripts) {
          expect(scriptText).not.toContain('"@type":"HowTo"');
          expect(scriptText).not.toContain('"@type":"FAQPage"');
        }
      }
    });

    it("il pulsante allIntegrations e backToProvider nei modelli e localizzato in tutte le 15 lingue", () => {
      const modelPath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/sync/[provider]/[model]/page.tsx");
      const modelCode = fs.readFileSync(modelPath, "utf-8");
      const allLocales = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"];
      for (const lc of allLocales) {
        expect(modelCode).toMatch(new RegExp(`allIntegrations:\\s*\\{[^}]*\\b${lc}:`));
        expect(modelCode).toMatch(new RegExp(`backToProvider:\\s*\\{[^}]*\\b${lc}:`));
      }
    });

    it("il fallback promozionale dei modelli non reinserisce link ai provider esclusi", () => {
      const modelPath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/sync/[provider]/[model]/page.tsx");
      const modelCode = fs.readFileSync(modelPath, "utf-8");
      expect(modelCode).not.toMatch(/providerLinkHref\(p, lc\)\s*\?\?\s*`\/en\/sync\/\$\{p\.slug\}`/);
      expect(modelCode).toMatch(/const providerHref = providerLinkHref\(p, lc\)/);
    });

    it("i breadcrumb mantengono il percorso del provider anche per provider esclusi", () => {
      const modelPath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/sync/[provider]/[model]/page.tsx");
      const modelCode = fs.readFileSync(modelPath, "utf-8");
      expect(modelCode).toMatch(/\{ name: p\.name, path: `\/\$\{lc\}\/sync\/\$\{p\.slug\}` \}/);
    });
  });

  describe("Punto 3: Pagina /sync/suunto allineata al contratto", () => {
    const suunto = PROVIDERS_BY_SLUG["suunto"];

    it("suunto ha piattaforme ristrette a solo android", () => {
      expect(suunto.platforms).toEqual(["android"]);
    });

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

    it("descrizione, FAQ e technote di Suunto escludono esplicitamente traccia GPS e sync background automatica", () => {
      const itFaq = suunto.faqs[0].a.it;
      const enFaq = suunto.faqs[0].a.en;

      expect(itFaq).toMatch(/su Android/);
      expect(itFaq).toMatch(/allenamenti e metriche giornaliere/);
      expect(itFaq).toMatch(/Non sono incluse tracce GPS/);
      expect(itFaq).toMatch(/non è prevista sincronizzazione automatica in background/);
      expect(itFaq).toMatch(/su richiesta/);

      expect(enFaq).toMatch(/on Android/);
      expect(enFaq).toMatch(/workouts and daily metrics/);
      expect(enFaq).toMatch(/No GPS tracks/);
      expect(enFaq).toMatch(/no automatic background sync/);
      expect(enFaq).toMatch(/on demand/);

      expect(suunto.techNote.en).toMatch(/Suunto login/i);
      expect(suunto.techNote.en).toMatch(/No GPS tracking/i);
      expect(suunto.techNote.en).toMatch(/no automatic background synchronization/i);
      expect(suunto.techNote.en).toMatch(/on user demand/i);
    });

    it("la pagina /sync/suunto renderizzata mostra solo il badge Google Play Android e nessun App Store Apple", async () => {
      const html = renderToStaticMarkup(await ProviderSyncPage({ params: Promise.resolve({ locale: "it", provider: "suunto" }) }));
      const doc = new JSDOM(html).window.document;
      expect(doc.querySelector("a[href*='apps.apple.com']"), "Suunto non deve mostrare il pulsante App Store Apple").toBeNull();
      expect(doc.querySelector("a[href*='play.google.com']"), "Suunto deve mostrare il pulsante Google Play per Android").not.toBeNull();
      expect(doc.body.textContent).toContain("su Android");
      expect(doc.body.textContent).toContain("Non sono incluse tracce GPS");
    });
  });

  describe("Punto 4: llms.txt non promuove provider esclusi e dichiara le funzioni non disponibili", () => {
    const txt = generateLlmsTxt();

    it("non include collegamenti promozionali a fitbit, polar, oura, withings, huawei", () => {
      for (const slug of EXCLUDED_SLUGS) {
        expect(txt).not.toMatch(new RegExp(`\\[.*\\]\\(https?://[^)]+/sync/${slug}\\)`));
      }
    });

    it("non include prezzi numerici non autorizzati o simboli di valuta aggiunti", () => {
      expect(txt).not.toMatch(/€\s*\d/);
      expect(txt).not.toMatch(/€3\.99|€4\.99|€1\.19/);
      expect(txt).not.toMatch(/\b3\.99\b|\b4\.99\b|\b1\.19\b/);
    });

    it("distingue esplicitamente le 5 architetture", () => {
      expect(txt).toMatch(/Health Connect.*Android/i);
      expect(txt).toMatch(/Apple Health.*iOS/i);
      expect(txt).toMatch(/Colmi.*direct Bluetooth/i);
      expect(txt).toMatch(/Suunto via account login.*Android only/i);
      expect(txt).toMatch(/Strava/i);
    });

    it("qualifica Garmin, Fitbit, Polar, Oura, Withings come percorsi indiretti tramite hub", () => {
      expect(txt).toMatch(/read only indirectly via Health Connect/i);
      expect(txt).toMatch(/read only indirectly via Apple Health/i);
      expect(txt).toMatch(/Health Connect \(Galaxy Watch via Samsung Health bridge/i);
      expect(txt).not.toMatch(/direct connection to Samsung Health/i);
    });

    it("riassume correttamente prova 14 giorni senza cifre numeriche", () => {
      expect(txt).toMatch(/14-day trial/i);
      expect(txt).toMatch(/lifetime purchase/i);
      expect(txt).toMatch(/on Android you can also choose the 6-month subscription/i);
      expect(txt).toMatch(/6-month subscription is not available on iPhone/i);
      expect(txt).toMatch(/JSON.*never require a purchase/i);
    });

    it("dichiara non disponibili dashboard web, export FIT (distinto da JSON), Mesh Famiglia e collegamenti diretti", () => {
      expect(txt).toMatch(/FIT format/i);
      expect(txt).toMatch(/JSON/i);
      expect(txt).toMatch(/Family Mesh/i);
      expect(txt).toMatch(/web dashboard/i);
      expect(txt).toMatch(/direct connections? (to|for) (Garmin|Samsung|Polar|Oura)/i);
    });

    it("dichiara il requisito minimo iOS 15.0 nel registro del sito e in llms.txt", () => {
      expect(AVAILABILITY.ios.minOsVersion).toBe("iOS 15.0");
      expect(txt).toMatch(/iOS 15\.0 and up/i);
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

  describe("Punto 6: Prova 14 giorni testo definitivo approvato (Decisione 7A)", () => {
    const itExact = "La prova gratuita dura 14 giorni. Poi, per continuare a sincronizzare, serve l'acquisto a vita; su Android puoi scegliere anche l'abbonamento semestrale. Esportare i dati in formato JSON e richiedere la cancellazione dell'account non richiede un acquisto.";
    const enExact = "The free trial lasts 14 days. After that, syncing requires the lifetime purchase; on Android you can also choose the 6-month subscription. Exporting your data as JSON and requesting account deletion never require a purchase.";

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

    it("non presenta abbonamento semestrale come disponibile su iPhone", () => {
      expect(PRICING_SECTION.subhead.it).toMatch(/su Android puoi scegliere anche l'abbonamento semestrale/);
      expect(PRICING_SECTION.subhead.en).toMatch(/on Android you can also choose the 6-month subscription/);
      expect(PRICING_SECTION.subhead.it).not.toMatch(/su iPhone.*abbonamento semestrale/);
      expect(PRICING_SECTION.subhead.en).not.toMatch(/on iPhone.*6-month subscription/);
    });

    it("la homepage renderizzata nel DOM in IT ed EN mostra il testo esatto della prova e preserva i benefici Founder", async () => {
      const itHtml = renderToStaticMarkup(await Home({ params: Promise.resolve({ locale: "it" }) }));
      const itDoc = new JSDOM(itHtml).window.document;
      expect(itDoc.body.textContent).toContain(itExact);
      expect(itDoc.body.textContent).not.toMatch(/caffè|caffe|pizza/i);

      const enHtml = renderToStaticMarkup(await Home({ params: Promise.resolve({ locale: "en" }) }));
      const enDoc = new JSDOM(enHtml).window.document;
      expect(enDoc.body.textContent).toContain(enExact);
      expect(enDoc.body.textContent).not.toMatch(/coffee|pizza/i);

      // Benefici Founder preservati nell'articolo dedicato
      const founderPath = path.join(process.cwd(), "lib/blog/posts/fitmesh-gratis-prezzo-founder.ts");
      const founderCode = fs.readFileSync(founderPath, "utf-8");
      expect(founderCode).toMatch(/Pro a vita/i);
      expect(founderCode).toMatch(/il beneficio resta tuo per sempre|Chi era già founder mantiene il Pro a vita/i);
    });
  });

  describe("Punto 7: Copy cancellazione account distingue sorgenti dirette e indirette", () => {
    it("distingue sorgenti dirette da sorgenti indirette via Health Connect / Apple Health", () => {
      expect(DELETE_ACCOUNT_COPY.en.externalBody).toMatch(/directly connected sources/i);
      expect(DELETE_ACCOUNT_COPY.en.externalBody).toMatch(/indirect sources/i);
      expect(DELETE_ACCOUNT_COPY.it.externalBody).toMatch(/connessioni dirette/i);
      expect(DELETE_ACCOUNT_COPY.it.externalBody).toMatch(/sorgenti indirette/i);
    });

    it("dichiara le sole lingue realmente disponibili (IT ed EN)", () => {
      const copyKeys = Object.keys(DELETE_ACCOUNT_COPY);
      expect(copyKeys.sort()).toEqual(["en", "it"]);
    });
  });

  describe("Punto 8: Pagina About qualifica Mesh Famiglia e non promette Oura/Fitbit diretti", () => {
    it("about-copy non promette Oura diretta o Fitbit cloud come funzioni disponibili", () => {
      const aboutPath = path.join(process.cwd(), "lib/content/about-copy.ts");
      const aboutCode = fs.readFileSync(aboutPath, "utf-8");
      expect(aboutCode).not.toMatch(/Oura API diretta per metriche proprietarie/);
      expect(aboutCode).not.toMatch(/Fitbit accesso cloud dati storici/);
    });

    it("About renderizza due sezioni distinte: collegamenti diretti e percorsi tramite hub", () => {
      const aboutPath = path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/about/page.tsx");
      const aboutCode = fs.readFileSync(aboutPath, "utf-8");
      expect(aboutCode).toMatch(/ABOUT_COPY\.directConnectionsHeading/);
      expect(aboutCode).toMatch(/ABOUT_COPY\.hubConnectionsHeading/);
      expect(aboutCode).toMatch(/ABOUT_COPY\.wearOsDevice/);
      expect(aboutCode).toMatch(/ABOUT_COPY\.suuntoDevice/);
      expect(aboutCode).toMatch(/ABOUT_COPY\.galaxyWatchHub/);
      expect(aboutCode).toMatch(/ABOUT_COPY\.garminHub/);
    });

    it("ABOUT_COPY copre tutte le 15 lingue servite per le nuove sezioni", () => {
      const allLocales = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"] as const;
      for (const lc of allLocales) {
        expect(ABOUT_COPY.directConnectionsHeading[lc], `directConnectionsHeading missing ${lc}`).toBeDefined();
        expect(ABOUT_COPY.hubConnectionsHeading[lc], `hubConnectionsHeading missing ${lc}`).toBeDefined();
        expect(ABOUT_COPY.suuntoDevice[lc], `suuntoDevice missing ${lc}`).toBeDefined();
        expect(ABOUT_COPY.galaxyWatchHub[lc], `galaxyWatchHub missing ${lc}`).toBeDefined();
      }
    });

    it("Mesh Famiglia e qualificata come in sviluppo senza impegni futuri su minori o consenso", () => {
      expect(ABOUT_COPY.familyBody.it).toMatch(/in sviluppo/i);
      expect(ABOUT_COPY.familyBody.en).toMatch(/in development/i);
      const allFamilyText = JSON.stringify(ABOUT_COPY.familyBody);
      expect(allFamilyText).not.toMatch(/minori|minors|children/i);
      expect(allFamilyText).not.toMatch(/metriche condivise|shared metrics/i);
      expect(allFamilyText).not.toMatch(/consenso genitoriale|parental consent/i);
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

    it("nessun paragrafo del corpo delle varianti nordiche indicizzabili presenta corpo identico a inglese o italiano", () => {
      for (const lc of ["sv", "da", "no", "fi"] as const) {
        for (const p of BLOG_POSTS) {
          if (isBlogVariantIndexable(p, lc)) {
            const paragraphs = p.body.filter((b) => b.type === "paragraph");
            expect(paragraphs.length, `Post ${p.slug} deve avere paragrafi`).toBeGreaterThan(0);
            for (const para of paragraphs) {
              const text = (para.text as any)[lc];
              const textIt = (para.text as any).it;
              const textEn = (para.text as any).en;
              if (text && textIt) {
                expect(text, `${p.slug} in ${lc} non deve coincidere con IT`).not.toBe(textIt);
              }
              if (text && textEn) {
                expect(text, `${p.slug} in ${lc} non deve coincidere con EN`).not.toBe(textEn);
              }
            }
          }
        }
      }
    });
  });
});
