import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage, { generateMetadata, generateStaticParams } from "./page";

function extractJsonLd(html: string): any[] {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return matches.map((m) => JSON.parse(m[1]));
}

describe("PricingPage (/pricing)", () => {
  it("genera i parametri statici solo per it ed en e rifiuta le altre locale", async () => {
    const params = generateStaticParams();
    expect(params).toEqual([{ locale: "it" }, { locale: "en" }]);

    await expect(
      PricingPage({ params: Promise.resolve({ locale: "de" }) })
    ).rejects.toThrow();
    await expect(
      generateMetadata({ params: Promise.resolve({ locale: "fr" }) })
    ).rejects.toThrow();
  });

  it("genera metadati corretti per it ed en con canonical e hreflang", async () => {
    const metaIt = await generateMetadata({ params: Promise.resolve({ locale: "it" }) });
    expect(metaIt.title).toContain("Prezzi");
    expect(metaIt.description).toContain("14 giorni di prova");
    expect(metaIt.description).toContain("acquisto unico");
    expect(metaIt.description!.length).toBeLessThanOrEqual(155);
    expect(metaIt.alternates?.canonical).toBe("https://www.fitmesh.fit/it/pricing");
    expect(metaIt.alternates?.languages).toHaveProperty("it", "https://www.fitmesh.fit/it/pricing");
    expect(metaIt.alternates?.languages).toHaveProperty("en", "https://www.fitmesh.fit/en/pricing");
    expect(metaIt.alternates?.languages).toHaveProperty("x-default", "https://www.fitmesh.fit/it/pricing");

    const metaEn = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(metaEn.title).toContain("Pricing");
    expect(metaEn.description).toContain("14-day free trial");
    expect(metaEn.description).toContain("one-time purchase");
    expect(metaEn.description!.length).toBeLessThanOrEqual(155);
    expect(metaEn.alternates?.canonical).toBe("https://www.fitmesh.fit/en/pricing");
  });

  it("rende la pagina italiana con card Android e iPhone separate e verita' prodotto", async () => {
    const html = renderToStaticMarkup(
      await PricingPage({ params: Promise.resolve({ locale: "it" }) })
    );

    expect(html).toContain("Prezzi di FitMesh");
    expect(html).toContain("L&#x27;app si scarica gratis");
    expect(html).toContain("FitMesh Pro per Android");
    expect(html).toContain("FitMesh Pro per iPhone");

    // Verita' commerciale e prova Pro
    expect(html).toContain("14 giorni di prova Pro inclusi");
    expect(html).toContain("Prezzo indicato da Google Play");
    expect(html).toContain("Prezzo indicato da Apple App Store");
    expect(html).toContain("Solo acquisto unico a vita");
    expect(html).toContain("Disdici quando vuoi da Google Play.");
    expect(html).toContain("I dati già sincronizzati restano nel tuo account: dall&#x27;app puoi esportare le metriche di salute o eliminare l&#x27;account.");
    expect(html).toContain("I dati sanitari risiedono nell&#x27;archivio salute locale del dispositivo");
    expect(html).not.toContain("Nessun limite al numero di dispositivi personali");
    expect(html).not.toContain("dashboard web personali");

    // Collegamenti corretti
    expect(html).toContain('href="/it/support/health-connect"');
    expect(html).toContain('href="/it/support/primo-sync"');

    // Nessun prezzo futuro o data controversa nel markup
    expect(html).not.toContain("5,99");
    expect(html).not.toContain("5.99");
    expect(html).not.toContain("1,49");
    expect(html).not.toContain("2,49");
    expect(html).not.toContain("17 novembre");
    expect(html).not.toContain("17 November");

    // Nessun em-dash vietato
    expect(html).not.toContain("—");

    // Verifica JSON-LD renderizzato (BreadcrumbList, WebPage, FAQPage)
    const jsonLdList = extractJsonLd(html);
    expect(jsonLdList.length).toBe(3);

    const breadcrumbs = jsonLdList.find((j) => j["@type"] === "BreadcrumbList");
    expect(breadcrumbs).toBeDefined();

    const webPage = jsonLdList.find((j) => j["@type"] === "WebPage");
    expect(webPage).toBeDefined();
    expect(webPage.name).toBe("Prezzi di FitMesh");
    expect(webPage.inLanguage).toBe("it-IT");

    const faqPage = jsonLdList.find((j) => j["@type"] === "FAQPage");
    expect(faqPage).toBeDefined();
    expect(faqPage.inLanguage).toBe("it-IT");
    expect(faqPage.mainEntity.length).toBe(6);

    const trialFaq = faqPage.mainEntity.find((q: any) => q.name.includes("provare"));
    expect(trialFaq).toBeDefined();
    expect(trialFaq.acceptedAnswer.text).toContain("14 giorni di prova Pro");
    expect(trialFaq.acceptedAnswer.text).toContain("Nessun addebito durante la prova. La prova riguarda solo l'app.");

    const endTrialFaq = faqPage.mainEntity.find((q: any) => q.name.includes("finiscono"));
    expect(endTrialFaq).toBeDefined();
    expect(endTrialFaq.acceptedAnswer.text).toContain("I dati già sincronizzati restano nel tuo account: dall'app puoi esportare le metriche di salute o eliminare l'account.");

    const founderFaq = faqPage.mainEntity.find((q: any) => q.name.includes("Founder"));
    expect(founderFaq).toBeDefined();
    expect(founderFaq.name).toBe("Chi ha ricevuto lo stato Founder deve pagare?");
    expect(founderFaq.acceptedAnswer.text).toContain("effettivamente assegnato il beneficio Founder");
    expect(founderFaq.acceptedAnswer.text).not.toContain("tutti gli account registrati");
  });

  it("rende la pagina inglese con card Android e iPhone corrette e JSON-LD coerente", async () => {
    const html = renderToStaticMarkup(
      await PricingPage({ params: Promise.resolve({ locale: "en" }) })
    );

    expect(html).toContain("FitMesh pricing");
    expect(html).toContain("The app is free to download");
    expect(html).toContain("FitMesh Pro for Android");
    expect(html).toContain("FitMesh Pro for iPhone");
    expect(html).toContain("14-day Pro trial included");
    expect(html).toContain("Cancel anytime in Google Play.");
    expect(html).toContain("Data already synced stays in your account: from the app you can export your health metrics or delete your account.");
    expect(html).toContain("Health data resides in your device");

    expect(html).not.toContain("5,99");
    expect(html).not.toContain("5.99");
    expect(html).not.toContain("—");

    const jsonLdList = extractJsonLd(html);
    expect(jsonLdList.length).toBe(3);

    const webPage = jsonLdList.find((j) => j["@type"] === "WebPage");
    expect(webPage).toBeDefined();
    expect(webPage.name).toBe("FitMesh pricing");

    const faqPage = jsonLdList.find((j) => j["@type"] === "FAQPage");
    expect(faqPage).toBeDefined();
    expect(faqPage.inLanguage).toBe("en-US");

    const trialFaq = faqPage.mainEntity.find((q: any) => q.name.includes("try"));
    expect(trialFaq).toBeDefined();
    expect(trialFaq.acceptedAnswer.text).toContain("You won't be charged during the trial. The trial covers the app only.");

    const endTrialFaq = faqPage.mainEntity.find((q: any) => q.name.includes("trial ends"));
    expect(endTrialFaq).toBeDefined();
    expect(endTrialFaq.acceptedAnswer.text).toContain("Data already synced stays in your account: from the app you can export your health metrics or delete your account.");

    const founderFaq = faqPage.mainEntity.find((q: any) => q.name.includes("Founder"));
    expect(founderFaq).toBeDefined();
    expect(founderFaq.name).toBe("Do accounts with Founder status need to pay?");
    expect(founderFaq.acceptedAnswer.text).toContain("Accounts to which the Founder benefit was actually granted");
  });
});
