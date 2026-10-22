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
    expect(metaIt.description).toContain("prova gratuita di 14 giorni");
    expect(metaIt.description).toContain("acquisto unico a vita su iPhone e Android");
    expect(metaIt.description!.length).toBeLessThanOrEqual(155);
    expect(metaIt.alternates?.canonical).toBe("https://www.fitmesh.fit/it/pricing");
    expect(metaIt.alternates?.languages).toHaveProperty("it", "https://www.fitmesh.fit/it/pricing");
    expect(metaIt.alternates?.languages).toHaveProperty("en", "https://www.fitmesh.fit/en/pricing");
    expect(metaIt.alternates?.languages).toHaveProperty("x-default", "https://www.fitmesh.fit/it/pricing");

    const metaEn = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(metaEn.title).toContain("Pricing");
    expect(metaEn.description).toContain("14-day free trial");
    expect(metaEn.description).toContain("one-time lifetime purchase on iPhone and Android");
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
    expect(html.replace(/&#x27;/g, "'").replace(/&gt;/g, ">")).toContain("I dati già sincronizzati restano nel tuo account. Anche a prova scaduta, dall'app puoi uscire dall'account o avviarne la cancellazione (Impostazioni > Cancella account, oppure dalla schermata di sblocco). La cancellazione non richiede un acquisto.");
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
    expect(endTrialFaq.acceptedAnswer.text).toContain("I dati già sincronizzati restano nel tuo account. Anche a prova scaduta, dall'app puoi uscire dall'account o avviarne la cancellazione (Impostazioni > Cancella account, oppure dalla schermata di sblocco). La cancellazione non richiede un acquisto.");

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
    expect(html.replace(/&gt;/g, ">")).toContain("Data already synced stays in your account. Even after the trial ends, the app lets you sign out or start deleting your account. Deletion does not require a purchase.");
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
    expect(endTrialFaq.acceptedAnswer.text).toContain("Data already synced stays in your account. Even after the trial ends, the app lets you sign out or start deleting your account. Deletion does not require a purchase.");

    const founderFaq = faqPage.mainEntity.find((q: any) => q.name.includes("Founder"));
    expect(founderFaq).toBeDefined();
    expect(founderFaq.name).toBe("Do accounts with Founder status need to pay?");
    expect(founderFaq.acceptedAnswer.text).toContain("Accounts to which the Founder benefit was actually granted");
  });
  it("nessuna promessa di esportazione dall'app: ne' nel testo visibile ne' nei dati strutturati (191 distribuita: a prova scaduta l'export non e' disponibile)", async () => {
    // Rettifica 21/10/2026, segnalata dalla corsia APP (verifica su pro_screen.dart). La disponibilita'
    // prevista nella 192.1 NON autorizza promesse sulla versione attuale: va riconfermata quando
    // quella versione sara' distribuita. Il test copre l'intero HTML renderizzato, JSON-LD compreso.
    // Rettifica 22/10/2026 (J-3d): «sempre», «gratuita/free» e il doppione FAQ sull'eliminazione sono tolti;
    // restano solo avvio della richiesta e assenza di acquisto necessario per avviarla.
    for (const [lc, box, rimosse] of [
      ["it", "I dati già sincronizzati restano nel tuo account. Anche a prova scaduta, dall'app puoi uscire dall'account o avviarne la cancellazione (Impostazioni > Cancella account, oppure dalla schermata di sblocco). La cancellazione non richiede un acquisto.",
        [/sempre gratuita/i, /sempre accessibile/i, /puoi sempre uscire/i, /eliminazione dell'account/i]],
      ["en", "Data already synced stays in your account. Even after the trial ends, the app lets you sign out or start deleting your account. Deletion does not require a purchase.",
        [/always free/i, /available from the app at any time/i, /can always sign out/i, /account deletion is/i]],
    ] as const) {
      const html = renderToStaticMarkup(await PricingPage({ params: Promise.resolve({ locale: lc }) }));
      const intero = html.replace(/&#x27;/g, "'").replace(/&gt;/g, ">");
      expect(intero, `${lc}: «esport»/«export» nell'intero HTML`).not.toMatch(/esport|export/i);
      expect(intero, `${lc}: «senza acquisto» solo nella formula ammessa (J-3d)`).toMatch(lc === "it" ? /La cancellazione non richiede un acquisto/ : /Deletion does not require a purchase/);
      expect(intero, `${lc}: nessun «sempre»/«always» su uscita o eliminazione`).not.toMatch(/sempre (uscire|gratuit)|always (sign|free)/i);
      for (const r of rimosse) expect(intero, `${lc}: ${r}`).not.toMatch(r);
      const visibile = intero.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      expect(visibile, lc).toContain(box);
      const ld = extractJsonLd(html);
      const faq = ld.find((j) => j["@type"] === "FAQPage").mainEntity.map((q: any) => q.acceptedAnswer.text as string);
      const fine = faq.find((t: string) => t.includes(box))!;
      expect(fine, lc).toBeDefined();
      expect(JSON.stringify(ld), lc).not.toMatch(/esport|export/i);
    }
  });
  it("imposte: frase neutra (nessuna IVA inclusa), nessuna cifra, formule per piattaforma confermate da Matteo il 20/10/2026", async () => {
    for (const [lc, frase, vecchi] of [
      ["it", "Il prezzo finale, con le imposte applicabili, è quello mostrato dallo store.", [/IVA inclusa/i, /App Store o Google Play\./]],
      ["en", "The final price, with any applicable taxes, is the one shown by the store.", [/include VAT/i, /App Store or Google Play\./]],
    ] as const) {
      const html = renderToStaticMarkup(await PricingPage({ params: Promise.resolve({ locale: lc }) }));
      const visibile = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ");
      expect(visibile, lc).toContain(frase);
      for (const re of vecchi) expect(visibile, `${lc} ${re}`).not.toMatch(re);
      // nessuna cifra monetaria e nessuno schema Offer: il prezzo e' solo quello dello store
      expect(visibile, `${lc} cifre`).not.toMatch(/(€\s?\d|\d\s?€|\$\s?\d|\d\s?(USD|EUR))/);
      const ld = JSON.stringify(extractJsonLd(html));
      expect(ld).not.toMatch(/"@type":"(Offer|AggregateOffer)"/);
      expect(ld).not.toMatch(/"price"|priceCurrency|\bVAT\b|\bIVA\b/i);
      // iPhone: solo lifetime; Android: lifetime e abbonamento semestrale
      const faq = extractJsonLd(html).find((j) => j["@type"] === "FAQPage").mainEntity.map((q: any) => q.acceptedAnswer.text as string);
      const iphone = faq.find((t: string) => /iPhone/.test(t) && /(esclusivamente|exclusively)/.test(t))!;
      const android = faq.find((t: string) => /Android/.test(t) && /(semestrale|6-month)/.test(t) && /(Lifetime|lifetime)/.test(t))!;
      expect(iphone, lc).toBeDefined();
      expect(iphone).toMatch(/(Non esiste alcun abbonamento|no recurring subscription)/i);
      expect(android, lc).toBeDefined();
    }
  });
});
