import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "./data";
import { isBlogVariantIndexable, isPostLocaleComplete } from "./indexability";
import { filterBlogContentForLocale } from "./locale-filter";
import type { BlogPost, BlogQA } from "./types";

/**
 * P1.3M — test di regressione FOCALIZZATO su `health-connect-vs-samsung-health`
 * (il pillar Samsung Health/Health Connect/Google Health), non una whitelist
 * sitewide. La scansione generale delle 97 combinazioni post/locale con la
 * stessa causa (root cause: `secondaryKeywords` senza chiave es/de, o di
 * lunghezza diversa altrove) e' debito tecnico separato, tracciato come
 * P1.3Q con baseline esterna in `docs/seo/blog-locale-near-miss-baseline.json`
 * + guardrail dedicato (`tools/check-blog-locale-near-miss.ts`), non qui:
 * niente whitelist opaca dentro il codice del test, come richiesto.
 */
describe("health-connect-vs-samsung-health: regressione locale P1.3M", () => {
  const post = BLOG_POSTS.find((p) => p.slug === "health-connect-vs-samsung-health");

  it("il post esiste", () => {
    expect(post).toBeDefined();
  });

  it("tutte le 11 traduzioni storiche restano indicizzabili (nessuna variante degradata)", () => {
    for (const lc of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
      expect(isBlogVariantIndexable(post!, lc), `locale ${lc} dovrebbe essere indicizzabile`).toBe(true);
    }
  });

  it("DE ed ES sono diventate indicizzabili dopo il fix secondaryKeywords (prima erano noindex)", () => {
    expect(isPostLocaleComplete(post!, "de")).toBe(true);
    expect(isPostLocaleComplete(post!, "es")).toBe(true);
  });

  it("nessuna locale restituisce corpo/FAQ inglese involontario: ogni sezione/FAQ visibile per una locale ha un valore per quella locale, non un fallback silenzioso su `en`/`it`", () => {
    for (const lc of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
      const visibleBody = filterBlogContentForLocale(post!.body, lc);
      for (const section of visibleBody) {
        const textNode = "text" in section ? section.text : "body" in section ? section.body : null;
        if (!textNode) continue;
        expect(
          (textNode as Record<string, string | undefined>)[lc],
          `${lc}: una sezione visibile non ha un proprio testo in questa locale (fallback silenzioso)`,
        ).toBeDefined();
      }
      const visibleFaq = filterBlogContentForLocale(post!.faq ?? [], lc);
      for (const f of visibleFaq) {
        expect((f.q as Record<string, string | undefined>)[lc]).toBeDefined();
        expect((f.a as Record<string, string | undefined>)[lc]).toBeDefined();
      }
    }
  });
});

describe("fitmesh-sync-disponibile-google-play: assenza markdown nelle FAQ (P1.25-A)", () => {
  const rawPost = BLOG_POSTS.find((p) => p.slug === "fitmesh-sync-disponibile-google-play");

  it("nessuna FAQ (domanda o risposta) contiene sintassi markdown di link [testo](url) in nessuna delle 13 lingue indicizzabili", async () => {
    expect(rawPost).toBeDefined();
    const nordicOverlay = (await import("./nordic-overlay.json")).default;
    const { applyNordicOverlay } = await import("./nordic-overlay");
    const post = JSON.parse(JSON.stringify(rawPost!)) as BlogPost;
    applyNordicOverlay(post, nordicOverlay as any);

    const indexableLocales = [
      "it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da",
    ] as const;

    const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/;

    for (const lc of indexableLocales) {
      const visibleFaq = filterBlogContentForLocale(post.faq ?? [], lc);
      expect(visibleFaq.length, `locale ${lc} deve avere almeno una FAQ`).toBeGreaterThan(0);

      for (const faqItem of visibleFaq) {
        const q = (faqItem.q as Record<string, string | undefined>)[lc] ?? "";
        const a = (faqItem.a as Record<string, string | undefined>)[lc] ?? "";

        expect(q, `[${lc}] FAQ domanda non deve contenere markdown link: "${q}"`).not.toMatch(markdownLinkPattern);
        expect(a, `[${lc}] FAQ risposta non deve contenere markdown link: "${a}"`).not.toMatch(markdownLinkPattern);
      }
    }
  });
});

describe("diversificazione cover P1.26-IMG-A/B: alt text dedicato per le 6 nuove cover (incluso overlay nordico)", () => {
  const targetSlugs = [
    "anello-smart-guida-completa",
    "migliori-anelli-economici",
    "sleep-tracker-comparison-2026",
    "vo2-max-wearable-comparison-2026",
    "anello-vs-smartwatch",
    "piu-smartwatch-insieme-dati-doppi",
  ] as const;

  it("ogni variante indicizzabile dei 6 post (56 complessive con overlay nordico) ha un coverAlt esplicito che non ricade sull'H1 (hero.title)", async () => {
    const { coverAlt } = await import("./covers");
    const { tl } = await import("./types");
    const { locales } = await import("@/lib/i18n");
    const nordicOverlay = (await import("./nordic-overlay.json")).default;
    const { applyNordicOverlay } = await import("./nordic-overlay");

    let totalCheckedVariants = 0;

    for (const slug of targetSlugs) {
      const rawPost = BLOG_POSTS.find((p) => p.slug === slug);
      expect(rawPost, `post ${slug} deve esistere in BLOG_POSTS`).toBeDefined();

      const post = JSON.parse(JSON.stringify(rawPost!)) as BlogPost;
      applyNordicOverlay(post, nordicOverlay as any);

      for (const lc of locales) {
        if (!isBlogVariantIndexable(post, lc)) continue;

        totalCheckedVariants++;
        const explicitAlt = post.coverAlt?.[lc];
        expect(
          explicitAlt,
          `[${slug}][${lc}] coverAlt esplicito mancante per variante indicizzabile`,
        ).toBeDefined();
        expect(
          explicitAlt!.trim().length,
          `[${slug}][${lc}] coverAlt non deve essere vuoto`,
        ).toBeGreaterThan(0);

        const renderedAlt = coverAlt(post, lc);
        const h1 = tl(post.hero.title, lc);

        expect(
          renderedAlt,
          `[${slug}][${lc}] coverAlt (${renderedAlt}) non deve ricadere su H1/hero.title (${h1})`,
        ).not.toBe(h1);
        expect(renderedAlt).toBe(explicitAlt);
      }
    }

    // 4 post con 13 varianti indicizzabili (52) + 2 post con 2 varianti indicizzabili (4) = 56
    expect(totalCheckedVariants).toBe(56);
  });
});

describe("P0.27 verità editoriale su pillar e guide ad alta esposizione", () => {
  it("guida-sync-wearable-2026 non contiene claim non verificati", () => {
    const post = BLOG_POSTS.find((p) => p.slug === "guida-sync-wearable-2026");
    expect(post).toBeDefined();
    const str = JSON.stringify(post).toLowerCase();

    // 1. Assenza metrica non verificata "90% dei problemi"
    expect(str).not.toContain("90% dei problemi");
    expect(str).not.toContain("90% of problems");
    expect(str).not.toContain("90 % der probleme");
    expect(str).not.toContain("90% de los problemas");

    // 2. Assenza promessa dashboard web nella guida sync
    expect(str).not.toContain("dashboard web inclusa");
    expect(str).not.toContain("web dashboard included");

    // 3. Assenza pretesa "evita i conflitti di configurazione più comuni"
    expect(str).not.toContain("evita i conflitti di configurazione più comuni");
    expect(str).not.toContain("avoids the most common setup conflicts");

    // 4. Oura non deve essere categorizzato come non scrivente su HC ed esplicita Gen2 vs Gen3/Ring 4
    expect(str).not.toContain("oura e huawei no: richiedono oauth");
    expect(str).not.toContain("oura and huawei don't: they require oauth");
    expect(str).toContain("gen2 senza abbonamento; gen3 e ring 4 con membership attiva");
    expect(str).toContain("oura cloud api v2 (api esterna; non integrata direttamente in fitmesh)");

    // 5. Huawei: nessun percorso ufficiale documentato e nessuna integrazione diretta FitMesh
    expect(str).not.toContain("huawei watch (con hms)");
    expect(str).not.toContain("huawei watch (with hms)");
    expect(str).toContain("nessun percorso ufficiale health connect (bridge terzi da valutare)");
    expect(str).toContain("huawei health kit (non integrato direttamente in fitmesh)");

    // 6. Founder CTA allineata alla regola storica SSOT senza conteggi non verificati
    expect(str).not.toContain("hanno ottenuto il pro a vita");
    expect(str).not.toContain("ottengono il pro a vita");
    expect(str).toContain("l'idoneità founder era riservata a un massimo di 1.000 account registrati entro il 31 luglio 2026 con prima sincronizzazione reale entro 14 giorni dalla registrazione");
    expect(str).toContain("fitmesh sync è disponibile per android e ios");
  });

  it("colmi-ring-fitmesh descrive la priorità di sorgente e non dichiara Founder attivo", () => {
    const post = BLOG_POSTS.find((p) => p.slug === "colmi-ring-fitmesh");
    expect(post).toBeDefined();
    const str = JSON.stringify(post).toLowerCase();

    // 1. Assenza claim assoluto di fusione ed eliminazione doppi conteggi
    expect(str).not.toContain("elimina i doppi conteggi");
    expect(str).not.toContain("eliminates double counting");
    expect(str).not.toContain("la fusione multi-device: niente doppi conteggi");

    // 2. CTA Founder al passato storico SSOT senza claim non verificati e con riconoscimento iOS
    expect(str).not.toContain("i primi 1.000 account");
    expect(str).not.toContain("ottengono il pro a vita");
    expect(str).not.toContain("hanno ottenuto il pro a vita");
    expect(str).toContain("l'idoneità founder era riservata a un massimo di 1.000 account registrati entro il 31 luglio 2026 con prima sincronizzazione reale entro 14 giorni dalla registrazione");
    expect(str).toContain("fitmesh sync è disponibile per android e ios");
  });

  it("huawei-health-health-connect-sincronizzazione non promette supporto nativo FitMesh", () => {
    const post = BLOG_POSTS.find((p) => p.slug === "huawei-health-health-connect-sincronizzazione");
    expect(post).toBeDefined();
    const str = JSON.stringify(post).toLowerCase();

    // 1. Assenza promesse di integrazione nativa o cloud FitMesh
    expect(str).not.toContain("la soluzione fitmesh: integrazione nativa huawei health kit");
    expect(str).not.toContain("the fitmesh solution: native huawei health kit integration");
    expect(str).not.toContain("fitmesh sta portando il supporto nativo");
    expect(str).not.toContain("fitmesh is building a native integration");

    // 2. Assenza spiegazioni causali HMS/GMS e sanzioni USA 2019
    expect(str).not.toContain("sanzioni usa del 2019");
    expect(str).not.toContain("2019 us sanctions");
    expect(str).not.toContain("limite strutturale dell'ecosistema hms");
    expect(str).not.toContain("structural limitation of the hms ecosystem");
    expect(str).not.toContain("hms e gms sono ecosistemi separati");
    expect(str).not.toContain("hms and gms are separate ecosystems");

    // 3. Assenza formule "l'unica soluzione" / "l'unico modo"
    expect(str).not.toContain("l'unica soluzione conosciuta finora");
    expect(str).not.toContain("the only known workaround so far");
    expect(str).not.toContain("l'unico modo per trasferire parzialmente");
    expect(str).not.toContain("the only way to transfer data partially");

    // 4. Tabella: colonna esplicita e "Non supportata direttamente"
    expect(str).not.toContain('"supporto fitmesh (pianificato)"');
    expect(str).not.toContain('"fitmesh support (planned)"');
    expect(str).toContain('"integrazione diretta fitmesh"');
    expect(str).toContain('"direct fitmesh integration"');
    expect(str).toContain('"non supportata direttamente"');
    // 5. Assenza assoluto "non supporta la scrittura diretta" (distinzione percorso ufficiale non documentato vs no direct fitmesh)
    expect(str).not.toContain("non supporta la scrittura diretta");
    expect(str).not.toContain("does not support direct writing");
    expect(str).not.toContain("no admite la escritura directa");
    expect(str).not.toContain("unterstützt kein direktes schreiben");
    expect(str).not.toContain("não suporta a escrita direta");
    expect(str).not.toContain("ne prend pas en charge l'écriture directe");
    expect(str).not.toContain("nie obsługuje bezpośredniego zapisu");

    // 6. Assenza "ledger di compatibilità" / "compatibility ledger" dal copy pubblico
    expect(str).not.toContain("ledger di compatibilità");
    expect(str).not.toContain("compatibility ledger");
    expect(str).not.toContain("registro de compatibilidad");
    expect(str).not.toContain("kompatibilitäts-ledger");
    expect(str).not.toContain("registo de compatibilidade");
    expect(str).not.toContain("registre de compatibilité");
    expect(str).not.toContain("rejestrze zgodności");
    expect(str).not.toContain("uyumluluk kayıtları");
    expect(str).not.toContain("compatibiliteitsregister");
    expect(str).not.toContain("互換性台帳");
    expect(str).not.toContain("호환성 대장");

    // 7. Presenza data di verifica e assenza link generici presentati come prova
    expect(str).toContain("25 settembre 2026");
    expect(str).not.toContain("https://consumer.huawei.com/en/support/");
    expect(str).not.toContain("https://developer.android.com/health-and-fitness/health-connect");

    // 8. Flusso dati CTA: FitMesh legge da Health Connect, non invia genericamente dati a Health Connect
    expect(str).not.toContain("sincronizza i dati dei wearable compatibili con health connect");
    expect(str).not.toContain("syncs data from compatible wearables into health connect");
    expect(str).toContain("leggendo da health connect");
    expect(str).toContain("reading data from health connect");
  });

  it("nordic overlay per i 3 post non re-introduce claim non verificati in SV/DA", async () => {
    const nordicOverlay = (await import("./nordic-overlay.json")).default as Record<string, Record<string, any>>;
    const { applyNordicOverlay } = await import("./nordic-overlay");
    const { locales } = await import("@/lib/i18n");

    for (const slug of ["guida-sync-wearable-2026", "colmi-ring-fitmesh", "huawei-health-health-connect-sincronizzazione"]) {
      const entry = nordicOverlay[slug];
      expect(entry, `Overlay per ${slug} deve esistere`).toBeDefined();
      const str = JSON.stringify(entry).toLowerCase();

      expect(str).not.toContain("90 % av problemen");
      expect(str).not.toContain("90% af problemerne");
      expect(str).not.toContain("ingen dubbelräkning");
      expect(str).not.toContain("ingen dobbelttælling");
      expect(str).not.toContain("lösningen fitmesh: inbyggd integration med huawei health kit");
      expect(str).not.toContain("fitmesh-løsningen: indbygget integration med huawei health kit");
      expect(str).not.toContain("fitmesh håller på att utveckla en inbyggd integration");
      expect(str).not.toContain("fitmesh er i gang med at udvikle en indbygget integration");
      expect(str).not.toContain("fick livstids-pro");
      expect(str).not.toContain("fik livstids-pro");
      expect(str).not.toContain("fikk livstids pro");
      expect(str).not.toContain("saivat elinikäisen pro");
      expect(str).not.toContain("den enda kända lösningen");
      expect(str).not.toContain("den eneste kendte løsning");
      expect(str).not.toContain("amerikanska sanktionerna");
      expect(str).not.toContain("amerikanske sanktioner");
      expect(str).not.toContain("strukturell begränsning i hms");
      expect(str).not.toContain("strukturel begrænsning i hms");
      expect(str).not.toContain("huawei health stöder inte direkt skrivning");
      expect(str).not.toContain("huawei health understøtter ikke direkte skrivning");
      expect(str).not.toContain("huawei health skriver inte direkt");
      expect(str).not.toContain("huawei health skriver ikke direkte");

      // Verifica HTML/FAQPage e structured data su tutte le varianti indicizzabili (incluso overlay)
      const rawPost = BLOG_POSTS.find((p) => p.slug === slug);
      expect(rawPost).toBeDefined();
      const postWithOverlay = JSON.parse(JSON.stringify(rawPost!)) as BlogPost;
      applyNordicOverlay(postWithOverlay, nordicOverlay as any);

      for (const lc of locales) {
        if (!isBlogVariantIndexable(postWithOverlay, lc)) continue;
        const visibleFaq = filterBlogContentForLocale(postWithOverlay.faq ?? [], lc);
        if (visibleFaq.length > 0) {
          const faqPageLd = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: visibleFaq.map((f) => ({
              "@type": "Question",
              name: (f.q as Record<string, string | undefined>)[lc] ?? "",
              acceptedAnswer: {
                "@type": "Answer",
                text: (f.a as Record<string, string | undefined>)[lc] ?? "",
              },
            })),
          };
          expect(faqPageLd.mainEntity.length).toBeGreaterThan(0);
          for (const item of faqPageLd.mainEntity) {
            expect(item.name.trim().length).toBeGreaterThan(0);
            expect(item.acceptedAnswer.text.trim().length).toBeGreaterThan(0);
            const itemStr = (item.name + " " + item.acceptedAnswer.text).toLowerCase();
            expect(itemStr).not.toContain("non supporta la scrittura diretta");
            expect(itemStr).not.toContain("hanno ottenuto il pro a vita");
            expect(itemStr).not.toContain("ottengono il pro a vita");
          }
        }
      }
    }

    const hwEntry = JSON.stringify(nordicOverlay["huawei-health-health-connect-sincronizzazione"]).toLowerCase();
    expect(hwEntry).toContain('"direkt fitmesh-integration"');
    expect(hwEntry).toContain('"direkte fitmesh-integration"');
    expect(hwEntry).toContain('"stöds inte direkt"');
    expect(hwEntry).toContain('"understøttes ikke direkte"');
    expect(hwEntry).not.toContain('"fitmesh stöd (planerat)"');
    expect(hwEntry).not.toContain('"fitmesh support (planlagt)"');
    expect(hwEntry).not.toContain("kompatibilitetsregistret");
    expect(hwEntry).not.toContain("ledger");
    expect(hwEntry).not.toContain("synkroniserar data från kompatibla bärbara enheter till health connect");
    expect(hwEntry).not.toContain("synkroniserer data fra kompatible wearables til health connect");
    expect(hwEntry).toContain("läsa data från health connect");
    expect(hwEntry).toContain("læse data fra health connect");
  });

  describe("P1.29-IMG: cover editoriali e anteprime social per Huawei Health e Galaxy Watch", () => {
    it("verifica alt text (distinzione schermo vs telefono spento) e asset anteprime social 1200x630 per i due articoli della PR", async () => {
      const { coverAlt } = await import("./covers");
      const { tl } = await import("./types");
      const { locales } = await import("@/lib/i18n");
      const fs = await import("node:fs");
      const path = await import("node:path");

      const p129Slugs = [
        "huawei-health-health-connect-sincronizzazione",
        "passi-non-si-sincronizzano-galaxy-watch",
      ] as const;

      for (const slug of p129Slugs) {
        const post = BLOG_POSTS.find((p) => p.slug === slug);
        expect(post, `post ${slug} deve esistere`).toBeDefined();

        for (const lc of locales) {
          if (!isBlogVariantIndexable(post!, lc)) continue;
          const alt = post!.coverAlt?.[lc];
          expect(alt, `[${slug}][${lc}] coverAlt mancante`).toBeDefined();
          expect(alt!.trim().length).toBeGreaterThan(0);
          const rendered = coverAlt(post!, lc);
          expect(rendered).toBe(alt);
          expect(rendered).not.toBe(tl(post!.hero.title, lc));
        }
      }

      // Verifica specifica distinzione schermo spento vs telefono spento in polacco (PL)
      const galaxyPost = BLOG_POSTS.find((p) => p.slug === "passi-non-si-sincronizzano-galaxy-watch")!;
      expect(galaxyPost.coverAlt?.pl).toContain("z wyłączonym ekranem");
      expect(galaxyPost.coverAlt?.pl).not.toContain("wyłączonego smartfona");

      const huaweiPost = BLOG_POSTS.find((p) => p.slug === "huawei-health-health-connect-sincronizzazione")!;
      expect(huaweiPost.coverAlt?.pl).toContain("z wyłączonym ekranem");
      expect(huaweiPost.coverAlt?.pl).not.toContain("wyłączonego smartfona");

      // Verifica esistenza degli asset social dedicati
      const socialDir = path.join(process.cwd(), "public", "blog", "social");
      expect(fs.existsSync(path.join(socialDir, "huawei-health-path.png"))).toBe(true);
      expect(fs.existsSync(path.join(socialDir, "galaxy-watch-steps-troubleshooting.png"))).toBe(true);
    });
  });
});
