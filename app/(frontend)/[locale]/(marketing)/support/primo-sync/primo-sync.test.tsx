import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PrimoSyncPage, { generateMetadata, generateStaticParams } from "./page";

function extractJsonLd(html: string): any[] {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return matches.map((m) => JSON.parse(m[1]));
}

describe("PrimoSyncPage (/support/primo-sync)", () => {
  it("genera i parametri statici solo per it ed en e rifiuta le altre locale", async () => {
    const params = generateStaticParams();
    expect(params).toEqual([{ locale: "it" }, { locale: "en" }]);

    await expect(
      PrimoSyncPage({ params: Promise.resolve({ locale: "de" }) })
    ).rejects.toThrow();
    await expect(
      generateMetadata({ params: Promise.resolve({ locale: "fr" }) })
    ).rejects.toThrow();
  });

  it("genera metadati corretti per it ed en con canonical e hreflang", async () => {
    const metaIt = await generateMetadata({ params: Promise.resolve({ locale: "it" }) });
    expect(metaIt.title).toContain("Primo Sync");
    expect(metaIt.alternates?.canonical).toBe("https://www.fitmesh.fit/it/support/primo-sync");
    expect(metaIt.alternates?.languages).toHaveProperty("it");
    expect(metaIt.alternates?.languages).toHaveProperty("en");
    expect(metaIt.alternates?.languages).toHaveProperty("x-default");

    const metaEn = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(metaEn.title).toContain("First Sync");
    expect(metaEn.alternates?.canonical).toBe("https://www.fitmesh.fit/en/support/primo-sync");
  });

  it("rende la pagina italiana con opzioni Android e iPhone e i 4 passaggi", async () => {
    const html = renderToStaticMarkup(
      await PrimoSyncPage({ params: Promise.resolve({ locale: "it" }) })
    );

    expect(html).toContain("Configura il tuo primo sync");
    expect(html).toContain("Connessione Salute");
    expect(html).toContain("Apple Salute");
    expect(html).toContain("I quattro passaggi del primo collegamento");

    // Verifiche percorsi provati e assenza canali non verificati
    expect(html).toContain("Samsung Health");
    expect(html).not.toContain("Garmin Connect");
    expect(html).not.toContain("Google Fit");
    expect(html).not.toContain("Polar Flow");
    expect(html).not.toContain("Suunto");

    // Verifiche privacy, formulazione operativa sync e nessun timing non misurato
    expect(html).toContain("I dati sanitari restano nell&#x27;archivio salute locale del dispositivo");
    expect(html).toContain("Per verificare la sincronizzazione, apri FitMesh e usa il comando di sincronizzazione disponibile");
    expect(html).toContain("Le attività in background dipendono dalla piattaforma");
    expect(html).not.toContain("pochi secondi");
    expect(html).not.toContain("a intervalli regolari");

    // Pulsanti dedicati e link corretti
    expect(html).toContain('href="/it/support/health-connect"');
    expect(html).toContain('href="/it/support"');

    // Nessun em-dash vietato
    expect(html).not.toContain("—");

    // Verifica JSON-LD renderizzato (BreadcrumbList, WebPage, FAQPage)
    const jsonLdList = extractJsonLd(html);
    expect(jsonLdList.length).toBe(3);

    const breadcrumbs = jsonLdList.find((j) => j["@type"] === "BreadcrumbList");
    expect(breadcrumbs).toBeDefined();

    const faqPage = jsonLdList.find((j) => j["@type"] === "FAQPage");
    expect(faqPage).toBeDefined();
    expect(faqPage.inLanguage).toBe("it-IT");
    expect(faqPage.mainEntity.length).toBe(3);

    const timingFaq = faqPage.mainEntity.find((q: any) => q.name.includes("tempo"));
    expect(timingFaq).toBeDefined();
    expect(timingFaq.acceptedAnswer.text).toContain("volume di dati storici");
    expect(timingFaq.acceptedAnswer.text).not.toContain("pochi secondi");
  });

  it("rende la pagina inglese correttamente con JSON-LD coerente", async () => {
    const html = renderToStaticMarkup(
      await PrimoSyncPage({ params: Promise.resolve({ locale: "en" }) })
    );

    expect(html).toContain("Configure your first sync");
    expect(html).toContain("Health Connect");
    expect(html).toContain("Apple Health");
    expect(html).toContain("Four steps to your first connection");
    expect(html).toContain("To check syncing, open FitMesh and use the sync control available in the app");
    expect(html).toContain("Background activity depends on the platform and available configuration");

    expect(html).not.toContain("Polar Flow");
    expect(html).not.toContain("Suunto");
    expect(html).not.toContain("few seconds");
    expect(html).not.toContain("regular intervals");

    expect(html).not.toContain("—");

    const jsonLdList = extractJsonLd(html);
    expect(jsonLdList.length).toBe(3);

    const faqPage = jsonLdList.find((j) => j["@type"] === "FAQPage");
    expect(faqPage).toBeDefined();
    expect(faqPage.inLanguage).toBe("en-US");
  });
});
