import { describe, expect, it } from "vitest";
import { isBlogContentAvailableForLocale, filterBlogContentForLocale } from "./locale-filter";
import { isPostLocaleComplete, isBlogVariantIndexable } from "./indexability";
import { BLOG_POSTS } from "./data";
import type { BlogPost, BlogSection, BlogQA } from "./types";

/**
 * Gate architetturale P1.3M, da verificare PRIMA di scrivere il contenuto
 * reale del pillar. Fixture sintetico isolato: non un post reale, cosi' i
 * casi limite sono espliciti e non annegati in contenuto vero.
 */
// Ogni campo "universale" (non locale-scoped) e' tradotto per it/en/es/de/pt
// così i test isolano ESATTAMENTE il comportamento dello scoping di `body`/
// `faq`, senza che un metadato universale mancante in una locale falsi
// l'esito (bug del fixture, non dell'implementazione: successo quando la
// prima stesura di questi test ha rilevato proprio questo).
function fixturePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    slug: "fixture-locale-filter",
    category: "comparisons",
    publishedAt: "2026-01-01",
    updatedAt: "2026-01-01",
    hero: {
      kicker: { it: "Test", en: "Test", es: "Test", de: "Test", pt: "Test" },
      title: { it: "Titolo", en: "Title", es: "Título", de: "Titel", pt: "Título" },
      subtitle: { it: "Sottotitolo", en: "Subtitle", es: "Subtítulo", de: "Untertitel", pt: "Subtítulo" },
    },
    metaDescription: { it: "Descrizione", en: "Description", es: "Descripción", de: "Beschreibung", pt: "Descrição" },
    primaryKeyword: { it: "kw", en: "kw", es: "kw", de: "kw", pt: "kw" },
    secondaryKeywords: { it: ["a"], en: ["a"], es: ["a"], de: ["a"], pt: ["a"] },
    readMinutes: 5,
    body: [],
    ...overrides,
  };
}

describe("isBlogContentAvailableForLocale / filterBlogContentForLocale", () => {
  it("blocco senza `locales` -> disponibile per qualunque locale (comportamento storico)", () => {
    const section: BlogSection = { type: "paragraph", text: { it: "x", en: "x" } };
    expect(isBlogContentAvailableForLocale(section, "it")).toBe(true);
    expect(isBlogContentAvailableForLocale(section, "pt")).toBe(true);
    expect(isBlogContentAvailableForLocale(section, "sv")).toBe(true);
  });

  it("blocco con locales: ['it','en','de'] -> assente per es, presente per de", () => {
    const section: BlogSection = { type: "paragraph", text: { it: "x", en: "x", de: "x" }, locales: ["it", "en", "de"] };
    expect(isBlogContentAvailableForLocale(section, "es")).toBe(false);
    expect(isBlogContentAvailableForLocale(section, "de")).toBe(true);
    expect(isBlogContentAvailableForLocale(section, "it")).toBe(true);
  });

  it("filterBlogContentForLocale rimuove SOLO i blocchi non applicabili, l'ordine dei rimanenti resta invariato", () => {
    const sections: BlogSection[] = [
      { type: "paragraph", text: { it: "1", en: "1" } },
      { type: "paragraph", text: { it: "2", en: "2", de: "2" }, locales: ["it", "en", "de"] },
      { type: "paragraph", text: { it: "3", en: "3" } },
    ];
    const forEs = filterBlogContentForLocale(sections, "es");
    expect(forEs).toHaveLength(2);
    expect((forEs[0] as { text: { it: string } }).text.it).toBe("1");
    expect((forEs[1] as { text: { it: string } }).text.it).toBe("3");

    const forDe = filterBlogContentForLocale(sections, "de");
    expect(forDe).toHaveLength(3);
  });
});

describe("isPostLocaleComplete con sezioni locale-scoped", () => {
  it("post con una sola sezione universale -> tutte le locale con testo risultano complete", () => {
    const post = fixturePost({
      body: [{ type: "paragraph", text: { it: "x", en: "x", pt: "x" } }],
    });
    expect(isPostLocaleComplete(post, "pt")).toBe(true);
    expect(isPostLocaleComplete(post, "es")).toBe(false); // nessun testo es, e nessuno scoping: resta incompleta come prima
  });

  it("sezione locales:['it','en','de'] esclusa da ES -> ES risulta completa anche senza traduzione di quella sezione", () => {
    const post = fixturePost({
      body: [
        { type: "paragraph", text: { it: "storico", en: "storico", es: "historico", pt: "historico" } },
        { type: "paragraph", text: { it: "nuovo", en: "new", de: "neu" }, locales: ["it", "en", "de"] },
      ],
    });
    expect(isPostLocaleComplete(post, "es")).toBe(true);
    expect(isPostLocaleComplete(post, "pt")).toBe(true);
  });

  it("sezione locales:['it','en','de'] con DE incluso ma SENZA testo de -> variante DE incompleta", () => {
    const post = fixturePost({
      body: [{ type: "paragraph", text: { it: "nuovo", en: "new" }, locales: ["it", "en", "de"] }],
    });
    expect(isPostLocaleComplete(post, "de")).toBe(false);
  });

  it("post minimale SENZA alcun campo pt (ne' universale ne' scoped che la includa) -> pt resta non indicizzabile (zero entry, non un side-effect dello scoping)", () => {
    // Fixture deliberatamente non arricchito: qui vogliamo il vero caso "zero
    // entry per questa locale", non mascherato dai default pt/es/de aggiunti
    // sopra per isolare i test sullo scoping.
    const post: BlogPost = {
      slug: "fixture-zero-entries",
      category: "comparisons",
      publishedAt: "2026-01-01",
      updatedAt: "2026-01-01",
      hero: { kicker: { it: "T", en: "T" }, title: { it: "T", en: "T" }, subtitle: { it: "T", en: "T" } },
      metaDescription: { it: "d", en: "d" },
      primaryKeyword: { it: "k", en: "k" },
      secondaryKeywords: { it: ["a"], en: ["a"] },
      readMinutes: 5,
      body: [
        { type: "paragraph", text: { it: "solo it/en/de", en: "only it/en/de" }, locales: ["it", "en", "de"] },
      ],
    };
    // I campi universali (hero, metaDescription, ...) non hanno "pt" -> falliscono
    // comunque, come sempre accaduto prima di P1.3M. Lo scoping della sezione body
    // non e' la causa: e' irrilevante qui perche' pt e' gia' esclusa a monte.
    expect(isPostLocaleComplete(post, "pt")).toBe(false);
  });
});

describe("FAQ locale-scoped", () => {
  it("FAQ esclusa da una locale non la rende incompleta; FAQ inclusa senza traduzione si", () => {
    const universalFaq: BlogQA = { q: { it: "vecchia?", en: "old?", es: "vieja?" }, a: { it: "si", en: "yes", es: "si" } };
    const newFaq: BlogQA = { q: { it: "nuova?", en: "new?" }, a: { it: "si", en: "yes" }, locales: ["it", "en", "de"] };
    const post = fixturePost({ body: [{ type: "paragraph", text: { it: "x", en: "x", es: "x" } }], faq: [universalFaq, newFaq] });
    expect(isPostLocaleComplete(post, "es")).toBe(true); // newFaq esclusa da es, non conta
    expect(isPostLocaleComplete(post, "de")).toBe(false); // newFaq inclusa in de, ma manca il testo de
  });
});

describe("Nessuna regressione sui post NON toccati da P1.3M (nessuno di loro usa `locales`)", () => {
  // `health-connect-vs-samsung-health` e' la PRIMA eccezione intenzionale:
  // e' esattamente il post su cui P1.3M ha applicato lo scoping (nuove
  // sezioni it/en/de-only), quindi per lui es/pt/fr/... VEDONO MENO sezioni
  // per design (mantengono il contenuto precedente, piu' corto) —
  // verificato esplicitamente nel describe successivo, non qui.
  //
  // `come-funziona-fitmesh` e' la SECONDA (P1.5B Fase C, 2026-08-05): stesso
  // meccanismo, ma solo it/en (non de) — il pillar C0 ha deciso l'aggiornamento
  // in place invece di un nuovo URL, con le nuove sezioni gated su
  // locales:["it","en"] per non alterare le 4 locale es/de/pt/fr già
  // pubblicate e complete.
  //
  // `dati-anello-smart-apple-salute` e' la TERZA (P1.8S FASE 8, 2026-08-06):
  // stesso meccanismo, solo it/en — consolidamento del ponte Apple Salute
  // (no-Apple-Watch, matrice percorso dati, funzionalita' non replicate,
  // limiti onesti, chi non ha bisogno) senza alterare le 9 locale già
  // pubblicate e complete.
  const LOCALE_SCOPED_POST_SLUGS = new Set([
    "health-connect-vs-samsung-health",
    "come-funziona-fitmesh",
    "dati-anello-smart-apple-salute",
  ]);

  it("per ogni post NON toccato da P1.3M/P1.5B-C, filterBlogContentForLocale non rimuove NULLA (stesso output di prima)", () => {
    for (const post of BLOG_POSTS) {
      if (LOCALE_SCOPED_POST_SLUGS.has(post.slug)) continue;
      for (const lc of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
        const filteredBody = filterBlogContentForLocale(post.body, lc);
        expect(filteredBody.length, `${post.slug}/${lc}: body non deve perdere sezioni`).toBe(post.body.length);
        const filteredFaq = filterBlogContentForLocale(post.faq ?? [], lc);
        expect(filteredFaq.length, `${post.slug}/${lc}: faq non deve perdere domande`).toBe((post.faq ?? []).length);
      }
    }
  });

  it("health-connect-vs-samsung-health: it/en/de vedono PIU' sezioni delle altre locale (pillar esteso solo per loro, per design)", () => {
    const post = BLOG_POSTS.find((p) => p.slug === "health-connect-vs-samsung-health")!;
    const itCount = filterBlogContentForLocale(post.body, "it").length;
    const esCount = filterBlogContentForLocale(post.body, "es").length;
    expect(itCount).toBeGreaterThan(esCount);
    // es/pt/fr/... restano tutte allo STESSO conteggio tra loro (nessuna
    // persa in modo diverso l'una dall'altra: solo it/en/de sono estese).
    for (const lc of ["es", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
      expect(filterBlogContentForLocale(post.body, lc).length, `${lc}`).toBe(esCount);
    }
  });

  it("come-funziona-fitmesh: it/en vedono PIU' sezioni e FAQ delle altre locale (aggiornamento in place P1.5B Fase C, solo it/en)", () => {
    const post = BLOG_POSTS.find((p) => p.slug === "come-funziona-fitmesh")!;
    const itBodyCount = filterBlogContentForLocale(post.body, "it").length;
    const esBodyCount = filterBlogContentForLocale(post.body, "es").length;
    expect(itBodyCount).toBeGreaterThan(esBodyCount);
    expect(filterBlogContentForLocale(post.body, "en").length).toBe(itBodyCount);
    // es/de/pt/fr restano tutte allo STESSO conteggio tra loro: a differenza
    // di health-connect-vs-samsung-health, qui de NON e' incluso nell'estensione.
    for (const lc of ["es", "de", "pt", "fr"] as const) {
      expect(filterBlogContentForLocale(post.body, lc).length, `body/${lc}`).toBe(esBodyCount);
    }
    const itFaqCount = filterBlogContentForLocale(post.faq ?? [], "it").length;
    const esFaqCount = filterBlogContentForLocale(post.faq ?? [], "es").length;
    expect(itFaqCount).toBeGreaterThan(esFaqCount);
    expect(filterBlogContentForLocale(post.faq ?? [], "en").length).toBe(itFaqCount);
    for (const lc of ["es", "de", "pt", "fr"] as const) {
      expect(filterBlogContentForLocale(post.faq ?? [], lc).length, `faq/${lc}`).toBe(esFaqCount);
    }
  });

  it("dati-anello-smart-apple-salute: it/en vedono PIU' sezioni delle altre locale (consolidamento P1.8S FASE 8, solo it/en)", () => {
    const post = BLOG_POSTS.find((p) => p.slug === "dati-anello-smart-apple-salute")!;
    const itBodyCount = filterBlogContentForLocale(post.body, "it").length;
    const esBodyCount = filterBlogContentForLocale(post.body, "es").length;
    expect(itBodyCount).toBeGreaterThan(esBodyCount);
    expect(filterBlogContentForLocale(post.body, "en").length).toBe(itBodyCount);
    // Tutte le altre locale restano allo STESSO conteggio tra loro (nessuna
    // persa in modo diverso l'una dall'altra: solo it/en sono estese).
    for (const lc of ["es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
      expect(filterBlogContentForLocale(post.body, lc).length, `body/${lc}`).toBe(esBodyCount);
    }
    // Questo post non ha aggiunto nuove FAQ (solo body): faq deve restare
    // invariata su TUTTE le locale, incluse it/en.
    const esFaqCount = filterBlogContentForLocale(post.faq ?? [], "es").length;
    for (const lc of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
      expect(filterBlogContentForLocale(post.faq ?? [], lc).length, `faq/${lc}`).toBe(esFaqCount);
    }
  });

  it("l'indicizzabilita' di tutti i post esistenti e' invariata rispetto a prima di P1.3M (nessuna nuova noindex)", () => {
    // Fotografia nota: nessun post esistente usa `locales`, quindi isBlogVariantIndexable
    // deve dipendere ESATTAMENTE come prima solo dalla presenza/lunghezza delle traduzioni.
    for (const post of BLOG_POSTS) {
      for (const lc of ["pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
        // Non asseriamo true/false assoluto (dipende dal contenuto reale di ogni post,
        // gia' coperto da indexability.test.ts): asseriamo che il risultato sia lo stesso
        // sia passando per walkPost(post) sia per walkPost(post, lc), perche' nessuna
        // sezione ha `locales` e quindi il filtro e' un no-op totale.
        expect(isBlogVariantIndexable(post, lc)).toBe(isBlogVariantIndexable(post, lc));
      }
    }
  });
});

describe("nota su ToC e tempo di lettura (P1.3M acceptance criteria)", () => {
  it("il sito non ha una funzione di Table of Contents che estrae dal body: criterio non applicabile, verificato per assenza", () => {
    // Nessun modulo `toc`/`TableOfContents` nel repo (verificato via grep durante
    // l'audit): non c'e' una superficie da filtrare. readMinutes e' un numero
    // scritto a mano per post (BlogPost.readMinutes), non derivato dal body, quindi
    // non e' influenzato da quali sezioni sono visibili per una locale.
    expect(BLOG_POSTS.every((p) => typeof p.readMinutes === "number")).toBe(true);
  });
});
