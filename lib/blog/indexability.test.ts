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

    // 3. Oura non deve essere categorizzato come non scrivente su HC
    expect(str).not.toContain("oura e huawei no: richiedono oauth");
    expect(str).not.toContain("oura and huawei don't: they require oauth");
  });

  it("colmi-ring-fitmesh descrive la priorità di sorgente e non dichiara Founder attivo", () => {
    const post = BLOG_POSTS.find((p) => p.slug === "colmi-ring-fitmesh");
    expect(post).toBeDefined();
    const str = JSON.stringify(post).toLowerCase();

    // 1. Assenza claim assoluto di fusione ed eliminazione doppi conteggi
    expect(str).not.toContain("elimina i doppi conteggi");
    expect(str).not.toContain("eliminates double counting");
    expect(str).not.toContain("la fusione multi-device: niente doppi conteggi");

    // 2. CTA Founder al passato storico
    expect(str).not.toContain("i primi 1.000 account");
    expect(str).not.toContain("ottengono il pro a vita");
    expect(str).toContain("hanno ottenuto il pro a vita");
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

    // 2. Tabella non deve dichiarare Sì per FitMesh
    expect(str).not.toContain('"supporto fitmesh (pianificato)"');
    expect(str).not.toContain('"fitmesh support (planned)"');
  });

  it("nordic overlay per i 3 post non re-introduce claim non verificati in SV/DA", async () => {
    const nordicOverlay = (await import("./nordic-overlay.json")).default as Record<string, Record<string, any>>;

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
    }
  });
});
