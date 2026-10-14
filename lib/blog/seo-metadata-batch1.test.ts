import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { blogSeoTitle, tl } from "@/lib/blog/types";
import { applyNordicOverlay } from "@/lib/blog/nordic-overlay";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";
import {
  CONTENT_LANGS,
  FREQUENCY_OCCURRENCE,
  GA_CTA_LABELS,
  GA_CTA_PATH,
  GA_NEG_PATH,
  PCT_CLAIM,
  SECTION_LABELS_EXTENDED,
  cellLang,
  fitbitCellVerdict,
  fitbitFrequencyProblems,
  garminCellVerdict,
  garminPromiseProblems,
  isFitmeshSyncNegationCell,
  norm,
  nz,
} from "@/lib/blog/claims/text-guards-v3";

// Regex condivise (T3): le frequenze e i tempi coprono tutte le 13 lingue, non solo IT/EN/ES/DE/NL.

const TIME_PROMISE =
  /\b\d+\s*(?:secondi|seconds?|segundos?|Sekunden|seconden|secondes?|sekunder|sekunde|sekund\w*|saniye\w*|sec\b|s\b)|\d+\s*(?:秒|초)/i;
const UNIVERSAL_FREQUENCY =
  /quasi sempre|almost always|casi siempre|fast immer|quase sempre|presque toujours|prawie zawsze|neredeyse her zaman|bijna altijd|ほぼ常に|거의 항상|nästan alltid|næsten altid|nesten alltid|melkein aina/i;
const PERSONAL_COUNT =
  /decine di volte|dozens of times|decenas de veces|dutzende?\s*male|dezenas de vezes|des dizaines de fois|dziesiątki razy|onlarca kez|tientallen keren|何十回|수십 번|dussintals gånger|utallige gange/i;
const FREQUENCY_BULLET =
  /frequente|frequent|habitual|häufig|comum|fréquent|częst|yaygın|veelvoorkomend|vaak|多く|많습니다|흔|vanlig|almindelig/i;
const RESTORE_PROMISE =
  /ripristin|restor|restaur|wieder her|restabelec|rétabli|przywróc|çöz|herstel|復旧|복구|återställ|genopret/i;
const API_TOKEN = /\bAPI\b|OAuth|API-/i;
// Roadmap/rinvio senza data (CS-1 X2): la regex trimestrale non basta, anche «in roadmap» non datato e'
// una promessa di integrazione diretta. Una voce per lingua presente nel post (11 TS + sv/da).
const ROADMAP_PROMISE =
  /roadmap|in arrivo|prossimamente|coming soon|upcoming|planned|próximamente|en camino|demnächst|bald verfügbar|geplant|em breve|em desenvolvimento|bientôt|prochainement|à venir|wkrótce|w planach|yakında|planlanıyor|binnenkort|gepland|近日公開|近日中|まもなく|予定|곧 출시|예정|kommer snart|planerad|på vej|planlagt/i;
// Normalizzazione unica (CS-1 X1): cifre, % e lettere a larghezza piena («９５％») valgono come i caratteri normali.


describe("SPRINT SEO-METADATA-02: Chiusura delle promesse e dei metadati (6 varianti)", () => {
  describe("6 Varianti autorizzate ad avanzare", () => {
    it("1. NL Fitbit: seoTitle diagnostico, title 50-60c, description 140-160c priva di Vaak/30s/95%", () => {
      const post = BLOG_POSTS_BY_SLUG["fitbit-data-not-syncing-android"];
      expect(post).toBeDefined();

      // seoTitle diagnostico per NL (non suggerisce causa unica)
      expect(post.seoTitle?.nl).toBe("Fitbit synchroniseert niet op Android: diagnose");

      const title = blogSeoTitle(post, "nl");
      const fullTitle = `${title} · FitMesh`;
      expect(fullTitle.length).toBeGreaterThanOrEqual(50);
      expect(fullTitle.length).toBeLessThanOrEqual(60);

      // Meta description tra 140 e 160 caratteri, priva di Vaak, 30s, 95%
      const desc = tl(post.metaDescription, "nl");
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(160);
      expect(desc).not.toContain("30 seconden");
      expect(desc).not.toContain("30s");
      expect(desc).not.toContain("95%");
      expect(desc).not.toContain("Vaak");

      // Invarianti H1
      expect(post.hero.title.nl).toBe(
        "Fitbit-gegevens synchroniseren niet op Android: de echte oorzaak (en de oplossing)",
      );
    });

    it("2. NL Galaxy Watch: seoTitle nativo, title 50-60c, description 140-160c", () => {
      const post = BLOG_POSTS_BY_SLUG["passi-non-si-sincronizzano-galaxy-watch"];
      expect(post).toBeDefined();

      expect(post.seoTitle?.nl).toBe("Galaxy Watch: stappen synchroniseren niet");

      const title = blogSeoTitle(post, "nl");
      const fullTitle = `${title} · FitMesh`;
      expect(fullTitle.length).toBeGreaterThanOrEqual(50);
      expect(fullTitle.length).toBeLessThanOrEqual(60);

      const desc = tl(post.metaDescription, "nl");
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(160);
      expect(desc).not.toContain("oplossing voor elk scenario");

      // Invarianti H1
      expect(post.hero.title.nl).toBe(
        "Galaxy Watch: stappen niet gesynchroniseerd, zo los je het op (gids 2026)",
      );
    });

    it("3. FR Garmin: seoTitle nativo, title 50-60c, description 140-160c", () => {
      const post = BLOG_POSTS_BY_SLUG["esportare-dati-garmin"];
      expect(post).toBeDefined();

      expect(post.seoTitle?.fr).toBe("Exporter les données Garmin: GPX, TCX, FIT, CSV");

      const title = blogSeoTitle(post, "fr");
      const fullTitle = `${title} · FitMesh`;
      expect(fullTitle.length).toBeGreaterThanOrEqual(50);
      expect(fullTitle.length).toBeLessThanOrEqual(60);

      const desc = tl(post.metaDescription, "fr");
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(160);

      // Invarianti H1
      expect(post.hero.title.fr).toBe(
        "Exporter les données Garmin: GPX, TCX, FIT et CSV, guide complet",
      );
    });

    it("4. SV Health Connect: seoTitle nativo in TS, title 50-60c, description 140-160c con overlay", () => {
      const rawPost = BLOG_POSTS_BY_SLUG["health-connect-not-syncing"];
      expect(rawPost).toBeDefined();

      // Cloniamo e applichiamo l'overlay nordico effettivo
      const post = JSON.parse(JSON.stringify(rawPost));
      applyNordicOverlay(post, nordicOverlayJson as any);

      // seoTitle definito in TS senza claim 'som fungerar'
      expect(rawPost.seoTitle?.sv).toBe("Health Connect synkroniseras inte: 7 lösningar");

      const title = blogSeoTitle(post, "sv");
      const fullTitle = `${title} · FitMesh`;
      expect(fullTitle.length).toBeGreaterThanOrEqual(50);
      expect(fullTitle.length).toBeLessThanOrEqual(60);
      expect(fullTitle).not.toContain("som fungerar");

      // metaDescription in overlay nordico tra 140 e 160c, priva di claim assoluti
      const desc = tl(post.metaDescription, "sv");
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(160);
      expect(desc).not.toContain("beprövade");

      // Invarianti H1 da overlay
      expect(tl(post.hero.title, "sv")).toBe(
        "Health Connect synkroniseras inte: 7 lösningar som fungerar (2026)",
      );
    });

    it("5. ES Health Connect: seoTitle nativo, title 50-60c, description 140-160c", () => {
      const post = BLOG_POSTS_BY_SLUG["come-funziona-health-connect"];
      expect(post).toBeDefined();

      expect(post.seoTitle?.es).toBe("Cómo funciona Health Connect: guía Android 2026");

      const title = blogSeoTitle(post, "es");
      const fullTitle = `${title} · FitMesh`;
      expect(fullTitle.length).toBeGreaterThanOrEqual(50);
      expect(fullTitle.length).toBeLessThanOrEqual(60);

      const desc = tl(post.metaDescription, "es");
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(160);

      // Invarianti H1
      expect(post.hero.title.es).toBe(
        "Cómo funciona Health Connect: guía completa para Android 2026",
      );
    });

    it("6. DE Google Health: seoTitle nativo, title 50-60c, description 140-160c (avanzato)", () => {
      const post = BLOG_POSTS_BY_SLUG["google-health-google-fit"];
      expect(post).toBeDefined();

      expect(post.seoTitle?.de).toBe("Google Health vs Google Fit: Die Unterschiede");

      const title = blogSeoTitle(post, "de");
      const fullTitle = `${title} · FitMesh`;
      expect(fullTitle.length).toBeGreaterThanOrEqual(50);
      expect(fullTitle.length).toBeLessThanOrEqual(60);

      const desc = tl(post.metaDescription, "de");
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(160);

      // Invarianti H1
      expect(post.hero.title.de).toBe(
        "Google Health vs Google Fit: Unterschiede und wie du migrierst",
      );

      // G3: la variante DE avanza solo con G1/G2 chiusi nel DE stesso (ROSSO su ed7f8cc9)
      expect(post.hero.subtitle.de).not.toMatch(/Samsung Health/);
      const deOnly = JSON.stringify(post.body, (_k, v) =>
        v && typeof v === "object" && !Array.isArray(v) && "en" in v && "de" in v ? v.de : v,
      );
      expect(deOnly).not.toMatch(/Samsung Health( Data)? ?SDK/);
      expect(JSON.stringify(post.tldr!.de)).not.toMatch(/Samsung/);
    });
  });

  describe("Preflight e bonifica promesse nel contenuto", () => {
    it("Fitbit: rimozione percentuali non provate e tempi garantiti in tutte le lingue", () => {
      const post = BLOG_POSTS_BY_SLUG["fitbit-data-not-syncing-android"];
      expect(post).toBeDefined();

      // Verifica hero.subtitle
      for (const [lang, val] of Object.entries(post.hero.subtitle)) {
        expect(norm(val), `hero.subtitle.${lang} contains 95%`).not.toMatch(PCT_CLAIM);
        expect(norm(val), `hero.subtitle.${lang} contains 30s`).not.toMatch(TIME_PROMISE);
      }

      // Verifica metaDescription
      for (const [lang, val] of Object.entries(post.metaDescription)) {
        expect(norm(val), `metaDescription.${lang} contains 95%`).not.toMatch(PCT_CLAIM);
        expect(norm(val), `metaDescription.${lang} contains 30s`).not.toMatch(TIME_PROMISE);
      }

      // Verifica overlay nordico: i campi DEVONO esistere per sv e da (nessun `if` che renda vuota la prova)
      const nordic = (nordicOverlayJson as any)["fitbit-data-not-syncing-android"];
      expect(nordic, "overlay nordico Fitbit presente").toBeDefined();
      for (const field of ["hero.subtitle", "metaDescription"]) {
        for (const l of ["sv", "da"]) {
          const v = nordic[field]?.[l] as string;
          expect(typeof v, `overlay ${field}.${l}`).toBe("string");
          expect(norm(v), `overlay ${field}.${l} 95%`).not.toMatch(PCT_CLAIM);
          expect(norm(v), `overlay ${field}.${l} tempo`).not.toMatch(TIME_PROMISE);
        }
      }
    });

    it("Google Health: nessun claim che attribuisce a FitMesh una connessione diretta a Samsung Health Data SDK", () => {
      const post = BLOG_POSTS_BY_SLUG["google-health-google-fit"];
      expect(post).toBeDefined();

      // Verifica TLDR
      expect(post.tldr).toBeDefined();
      // EN ESCLUSA: /en/blog/google-health-replaces-google-fit e' una URL CTR protetta (pilota
      // 2026-09-14, osservazione 16/10): il suo contenuto resta quello di main c011056b finche'
      // Matteo non decide (D2). BLOCCATA-DA-DECISIONE. Le altre 10 lingue restano coperte.
      for (const [lang, items] of Object.entries(post.tldr!)) {
        if (lang === "en") continue;
        for (const item of items) {
          expect(item, `tldr.${lang} contains Samsung Health Data SDK`).not.toContain("Samsung Health Data SDK");
        }
      }

      // CS-3: le tre frasi fisse che stavano qui («FitMesh si interfaccia con il Samsung Health Data SDK»
      // ecc.) non erano presenti ne' su main ne' sul parent: asserzioni vuote, verdi per costruzione.
      // Sostituite da una guardia generica su TUTTI i campi (TS, hero, tldr, body, faq, flussi) delle
      // lingue non protette: nessuna frase accosta FitMesh e il Samsung Health SDK, in nessun ordine.
      // E' una guardia di non-regressione (sul testo corrente passa, il mutante che la viola e' rosso),
      // non la prova della correzione G1/G2/G5: quella sta nei test «G1/G2/G5» e «ogni campo» sotto.
      const fitmeshSamsungSdk =
        /FitMesh[^.!?\n]{0,80}Samsung[^.!?\n]{0,20}SDK|Samsung[^.!?\n]{0,20}SDK[^.!?\n]{0,80}FitMesh/i;
      const ghCells = collectCells("google-health-google-fit").filter((c) => c.lang !== "en");
      expect(ghCells.length).toBeGreaterThan(400);
      for (const c of ghCells) expect(c.text, c.path).not.toMatch(fitmeshSamsungSdk);
    });

    it("Google Health G1/G2/G5: nessun SDK Samsung come sorgente FitMesh in nessun campo delle 10 lingue non protette", () => {
      const post = BLOG_POSTS_BY_SLUG["google-health-google-fit"];
      expect(post).toBeDefined();
      const sdk = /Samsung Health( Data)? ?SDK|SDK de Samsung|SDK Samsung|Samsung Health-SDK|SDK from Samsung/i;
      const seen: string[] = [];
      const walk = (o: unknown, path: string[]): void => {
        if (typeof o === "string") {
          // ROSSO su ed7f8cc9fc92c0d1136949f8ab7e7838dc6dc9ea (83cb361 + F1/F2/F4): 10 hit in
          // body[13].flows[3].steps (G1), piu' i parziali in hero.subtitle (G2).
          const lang = [...path].reverse().find((k) => /^[a-z]{2}$/.test(k));
          if (lang && lang !== "en") expect(o, path.join(".")).not.toMatch(sdk);
          seen.push(path.join("."));
          return;
        }
        if (Array.isArray(o)) o.forEach((x, i) => walk(x, [...path, String(i)]));
        else if (o && typeof o === "object") {
          for (const [k, v] of Object.entries(o)) walk(v, [...path, k]);
        }
      };
      walk(post, []);
      expect(seen.length).toBeGreaterThan(200);

      // G2: «Samsung Health» non e' una quarta sorgente autonoma nel sottotitolo (EN protetta esclusa)
      for (const [lang, val] of Object.entries(post.hero.subtitle)) {
        if (lang === "en") continue;
        expect(val, `hero.subtitle.${lang}`).not.toMatch(/\([^()]*Samsung Health[^()]*\)|（[^（）]*Samsung Health[^（）]*）/);
      }

      // G5: nessuna nuova affermazione architetturale «senza server intermedi» (EN protetta esclusa).
      // ROSSO su ed7f8cc9: faq.it/de/es/pt/fr/pl/nl/ja/ko/tr (sezione «FitMesh e Google Health»).
      const noServers = /senza server intermedi|sin servidores intermedios|ohne Zwischenserver|sem servidores intermedi|sans serveurs intermédiaires|bez serwerów pośrednich|ara sunucular olmadan|zonder tussenservers|中間サーバーを経由せず|중간 서버 없이/i;
      const check = (o: unknown, path: string[]): void => {
        if (typeof o === "string") {
          const lang = [...path].reverse().find((k) => /^[a-z]{2}$/.test(k));
          if (lang && lang !== "en") expect(o, path.join(".")).not.toMatch(noServers);
          return;
        }
        if (Array.isArray(o)) o.forEach((x, i) => check(x, [...path, String(i)]));
        else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) check(v, [...path, k]);
      };
      check(post, []);
    });

    it("Garmin: nessun obbligo generale di API per attivita' GPS (TLDR e In sintesi, 11 lingue + sv/da)", () => {
      const post = BLOG_POSTS_BY_SLUG["esportare-dati-garmin"];
      expect(post).toBeDefined();
      expect(post.tldr).toBeDefined();
      // Il vecchio controllo cercava due sole stringhe (it/en): per le altre 9 lingue era vuoto.
      // Ora: il bullet 4 di ogni lingua non nomina API/OAuth e non dichiara cosa Garmin trasferisce.
      for (const [lang, items] of Object.entries(post.tldr!)) {
        expect(items[3], `tldr[3].${lang}`).toBeTruthy();
        expect(items[3], `tldr[3].${lang}`).not.toMatch(API_TOKEN);
        expect(items[3], `tldr[3].${lang}`).toMatch(/Health Connect/);
      }
    });
  });

  describe("Invarianti e divieto di em dash", () => {
    it("nessun em dash vietato nei nuovi seoTitle e metaDescription delle 6 varianti autorizzate", () => {
      const emDash = "\u2014";
      const targetVariants = [
        { slug: "fitbit-data-not-syncing-android", lang: "nl" },
        { slug: "passi-non-si-sincronizzano-galaxy-watch", lang: "nl" },
        { slug: "esportare-dati-garmin", lang: "fr" },
        { slug: "health-connect-not-syncing", lang: "sv" },
        { slug: "come-funziona-health-connect", lang: "es" },
        { slug: "google-health-google-fit", lang: "de" },
      ];

      for (const { slug, lang } of targetVariants) {
        const rawPost = BLOG_POSTS_BY_SLUG[slug];
        expect(rawPost).toBeDefined();

        const post = JSON.parse(JSON.stringify(rawPost));
        if (slug === "health-connect-not-syncing") {
          applyNordicOverlay(post, nordicOverlayJson as any);
        }

        const title = blogSeoTitle(post, lang as any);
        expect(title, `${slug}.${lang} seoTitle contains em dash`).not.toContain(emDash);

        const desc = tl(post.metaDescription, lang as any);
        expect(desc, `${slug}.${lang} metaDescription contains em dash`).not.toContain(emDash);
      }
    });
  });
});

// ---------------------------------------------------------------------------------------------
// SEGUITO FINDING 83cb361 (S4): prove sul CONTENUTO, non solo sulle description.
// Ogni stringa del post (TS) e ogni voce dell'overlay nordico sv/da e' visitata con la sua lingua.
// ---------------------------------------------------------------------------------------------

type Cell = { path: string; lang: string; text: string };

function collectCells(slug: string): Cell[] {
  const out: Cell[] = [];
  const walk = (o: unknown, path: string[], src: string): void => {
    if (typeof o === "string") {
      const lang = [...path].reverse().find((k) => CONTENT_LANGS.has(k));
      if (lang) out.push({ path: `${src}:${path.join(".")}`, lang, text: norm(o) });
      return;
    }
    if (Array.isArray(o)) o.forEach((x, i) => walk(x, [...path, String(i)], src));
    else if (o && typeof o === "object") {
      for (const [k, v] of Object.entries(o)) walk(v, [...path, k], src);
    }
  };
  walk(BLOG_POSTS_BY_SLUG[slug], [], "ts");
  walk((nordicOverlayJson as any)[slug] ?? {}, [], "overlay");
  return out;
}

function projectLang(v: unknown, lang: string): unknown {
  if (Array.isArray(v)) return v.map((x) => projectLang(x, lang));
  if (v && typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length > 0 && entries.every(([k]) => CONTENT_LANGS.has(k))) {
      const picked = (v as Record<string, unknown>)[lang];
      return picked === undefined ? null : projectLang(picked, lang);
    }
    return Object.fromEntries(entries.map(([k, x]) => [k, projectLang(x, lang)]));
  }
  return v;
}

const sha = (slug: string, lang: string) =>
  createHash("sha256").update(JSON.stringify(projectLang(BLOG_POSTS_BY_SLUG[slug], lang))).digest("hex");

describe("SEGUITO 83cb361: contenuto, non solo metadati", () => {
  describe("Fitbit (11 lingue TS + sv/da overlay, ogni campo)", () => {
    const cells = collectCells("fitbit-data-not-syncing-android");

    it("copertura: 11 lingue TS e sv/da overlay sono davvero visitate", () => {
      const langs = new Set(cells.map((c) => c.lang));
      for (const l of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da"]) {
        expect(langs.has(l), l).toBe(true);
      }
      expect(cells.filter((c) => c.path.startsWith("overlay:")).length).toBeGreaterThan(20);
      expect(cells.filter((c) => c.path.startsWith("ts:body.0.text")).length).toBe(11);
    });

    it("nessuna percentuale ne' tempo garantito in nessun campo, in nessuna lingua", () => {
      for (const c of cells) {
        expect(c.text, `${c.path}`).not.toMatch(PCT_CLAIM);
        expect(c.text, `${c.path}`).not.toMatch(TIME_PROMISE);
      }
    });

    it("body[0], frequenza universale e conteggio personale assenti dappertutto", () => {
      for (const c of cells) {
        expect(c.text, `${c.path}`).not.toMatch(UNIVERSAL_FREQUENCY);
        expect(c.text, `${c.path}`).not.toMatch(PERSONAL_COUNT);
      }
      for (const l of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da"]) {
        const intro = cells.find((c) => c.path === `ts:body.0.text.${l}` || c.path === `overlay:body.0.text.${l}`);
        expect(intro, `body[0] ${l}`).toBeDefined();
        expect(intro!.text, `body[0] ${l}`).toMatch(/Health Connect/);
      }
    });

    it("TLDR[0]: istruzione sui permessi, non un claim di frequenza (13 lingue)", () => {
      for (const l of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da"]) {
        const t = cells.find((c) => c.path === `ts:tldr.${l}.0` || c.path === `overlay:tldr.${l}.0`);
        expect(t, `tldr[0] ${l}`).toBeDefined();
        expect(t!.text, `tldr[0] ${l}`).toMatch(/Health Connect/);
        expect(t!.text, `tldr[0] ${l}`).not.toMatch(FREQUENCY_BULLET);
      }
    });

    it("frequenza: nessun marcatore «e' un problema frequente» in nessun campo (hero, tldr, body, faq, metadati, overlay)", () => {
      // CS-1 X3: FREQUENCY_BULLET era applicato solo a tldr[0]; ora a OGNI cella di testo del post.
      // Due precisazioni, entrambe nominali (nessuna esclusione per campo):
      // 1) «多く» in giapponese vuol dire anche «molti» (多くのデバイス, 多くの人, 多くのガイド: ts:body.7/8):
      //    nel test su tutti i campi vale la forma di frequenza, non il quantificatore;
      // 2) l'H2 generico «Insidie comuni che bloccano la sincronizzazione» (body.6, gia' su main
      //    c011056b) usa «häufig/fréquent/...» come etichetta di sezione, non come stima: ammesso solo
      //    con il testo esatto, per cella. Qualunque altro titolo o frase con marcatore resta rosso.
      const ALL_FIELDS_FREQUENCY = new RegExp(FREQUENCY_BULLET.source.replace("多く|", "多くの場合|よくある|頻繁|"), "i");
      const sectionLabels: Record<string, string> = {
        "ts:body.6.text.de": "Häufige Stolperfallen bei der Synchronisierung",
        "ts:body.6.text.fr": "Erreurs fréquentes qui bloquent la synchronisation",
        "ts:body.6.text.pl": "Częste pułapki, na które warto uważać",
        "ts:body.6.text.nl": "Veelvoorkomende valkuilen die mensen struikelen",
        "ts:body.6.text.ja": "よくある落とし穴",
        "overlay:body.6.text.sv": "Vanliga fallgropar som många snubblar på",
      };
      const allowed = new Set<string>();
      for (const c of cells) {
        if (sectionLabels[c.path] === c.text) {
          allowed.add(c.path);
          continue;
        }
        expect(c.text, c.path).not.toMatch(ALL_FIELDS_FREQUENCY);
      }
      // le etichette ammesse esistono davvero (la lista non e' un'esenzione fantasma)
      expect([...allowed].sort()).toEqual(Object.keys(sectionLabels).sort());
    });

    it("metaDescription e hero.subtitle: nessuna promessa di ripristino (13 lingue)", () => {
      for (const c of cells) {
        if (/metaDescription|hero\.subtitle/.test(c.path)) {
          expect(c.text, `${c.path}`).not.toMatch(RESTORE_PROMISE);
        }
      }
    });
  });

  describe("Google Health (10 lingue non protette, ogni campo)", () => {
    const cells = collectCells("google-health-google-fit").filter((c) => c.lang !== "en");

    it("nessuna sorgente Samsung diretta di FitMesh, in nessun campo, 10 lingue", () => {
      expect(cells.length).toBeGreaterThan(400);
      const sdk = /Samsung Health( Data)? ?SDK|SDK de Samsung|SDK Samsung|Samsung Health-SDK|SDK from Samsung|Samsung.{0,12}SDK|SDK.{0,12}Samsung/i;
      for (const c of cells) expect(c.text, c.path).not.toMatch(sdk);
    });

    it("schema 'percorso verificato' (flow-diagram): primo passo senza Samsung, solo Health Connect/Apple Health/Bluetooth", () => {
      const post: any = BLOG_POSTS_BY_SLUG["google-health-google-fit"];
      const flow = post.body.find(
        (s: any) => s.type === "flow-diagram" && JSON.stringify(s).includes("percorso verificato"),
      );
      expect(flow, "flow-diagram con 'percorso verificato'").toBeDefined();
      const verified = flow.flows.find((f: any) =>
        Object.values(f.steps as Record<string, string[]>).some((arr) => arr.some((x) => /verific|verified|verifi|doğrulan|検証|확인/i.test(x))),
      );
      expect(verified, "percorso FitMesh verificato").toBeDefined();
      for (const [lang, steps] of Object.entries(verified.steps as Record<string, string[]>)) {
        if (lang === "en") continue;
        const first = steps[0];
        expect(first, `flow.${lang}[0]`).toMatch(/Health Connect/);
        expect(first, `flow.${lang}[0]`).toMatch(/Apple Health/);
        expect(first, `flow.${lang}[0]`).not.toMatch(/Samsung/);
      }
    });

    it("TLDR FitMesh: nessuna menzione Samsung come sorgente (tutte le lingue non protette)", () => {
      const post = BLOG_POSTS_BY_SLUG["google-health-google-fit"];
      for (const [lang, items] of Object.entries(post.tldr!)) {
        if (lang === "en") continue;
        const fitmesh = items.filter((x) => /FitMesh/.test(x));
        expect(fitmesh.length, `tldr.${lang} bullet FitMesh`).toBeGreaterThan(0);
        for (const x of fitmesh) expect(x, `tldr.${lang}`).not.toMatch(/Samsung/);
      }
    });

    it("hero.subtitle: Samsung Health non e' una sorgente elencata (10 lingue)", () => {
      const post = BLOG_POSTS_BY_SLUG["google-health-google-fit"];
      for (const [lang, val] of Object.entries(post.hero.subtitle)) {
        if (lang === "en") continue;
        expect(val, `hero.subtitle.${lang}`).not.toMatch(/Samsung/);
      }
    });
  });

  describe("URL CTR protette: contenuto renderizzato byte-identico a main c011056b", () => {
    // Impronte della proiezione sulla lingua protetta dell'INTERO oggetto post (hero, seoTitle,
    // metaDescription, tldr, body, faq, flussi, campi non localizzati), calcolate sul post di
    // main c011056b0c2091b9282b530799fdf96972476695. Se Matteo decide (D2/D3) di cambiare una
    // di queste pagine, l'impronta va rigenerata con quella decisione scritta nel commit.
    const PROTECTED: Array<[string, string, string]> = [
      ["google-health-google-fit", "en", "646a51d2ffe65910d02ac0f00cf1bad6563e331025a71655cc41828166efbcf0"],
      ["galaxy-ring-android-health-connect", "en", "442ecef3ee722df4393fdc63f1092ad6b4d629a95ac2e0a44800dbc2c9f369cd"],
      ["galaxy-ring-android-health-connect", "it", "11a692f8138312499c119cd32ca3a19706f2a6bb3963a1ce59a75c45e56b33e8"],
      ["oura-ring-health-connect-android", "en", "f67531b98db56bec28741e3a71f0f3d3330877e7770441121d02bde300c2677d"],
      ["garmin-samsung-health-sync-guide", "it", "14d2cb6bd54987e3cd3253a5b48bd19e61c816133d8ba4e26bcb694251765dae"],
    ];
    it.each(PROTECTED)("%s [%s] invariato rispetto a main", (slug, lang, expected) => {
      expect(BLOG_POSTS_BY_SLUG[slug], slug).toBeDefined();
      expect(sha(slug, lang)).toBe(expected);
    });
  });

  describe("Garmin (11 lingue TS + sv/da overlay, ogni campo)", () => {
    const cells = collectCells("esportare-dati-garmin");

    it("copertura: overlay sv/da di TLDR, body.20, body.21, body.24 e body.15 presenti", () => {
      const ov = (nordicOverlayJson as any)["esportare-dati-garmin"];
      for (const key of ["tldr", "body.20.text", "body.21.text", "body.24.items", "body.15.items"]) {
        expect(ov[key], key).toBeDefined();
        expect(ov[key].sv, `${key}.sv`).toBeTruthy();
        expect(ov[key].da, `${key}.da`).toBeTruthy();
      }
    });

    it("nessuna roadmap di integrazione diretta, datata o no (CS-1 X2), in nessuna lingua e in nessun campo", () => {
      for (const c of cells) expect(c.text, c.path).not.toMatch(ROADMAP_PROMISE);
    });

    it("nessuna roadmap datata di integrazione diretta (Q3 2026 / T3 2026 / 3분기), in nessuna lingua", () => {
      const roadmap = /\bQ3\b|\bT3\b|3분기|第3四半期|3\.\s*(?:Quartal|kvartal)\w*|3[ºo°]\s*trimestre|3e\s*trimestre|3\.\s*çeyrek|üçüncü çeyrek|derde kwartaal|3\.\s*kwartał|tercer trimestre|terzo trimestre|third quarter/i;
      for (const c of cells) expect(c.text, c.path).not.toMatch(roadmap);
    });

    it("TLDR[3] / In sintesi / body.20 / body.21 senza obbligo API ne' OAuth ne' 'Garmin non trasferisce' (13 lingue)", () => {
      const notTransfer = /non trasferisce|does not transfer|doesn't transfer|überträgt nicht|nicht übertr|no transfiere|não transfere|ne transfère pas|nie przesyła|aktarmaz|draagt .* niet over|転送しません|전송하지 않|överför inte|overfører ikke/i;
      const targets = /^(ts:tldr\.[a-z]{2}\.3|overlay:tldr\.(sv|da)\.3|ts:body\.20\.text\.[a-z]{2}|overlay:body\.20\.text\.(sv|da)|ts:body\.21\.text\.[a-z]{2}|overlay:body\.21\.text\.(sv|da)|ts:body\.24\.items\.[a-z]{2}\.3|overlay:body\.24\.items\.(sv|da)\.3)$/;
      const hit = cells.filter((c) => targets.test(c.path));
      // 4 campi x 11 lingue TS + 4 campi x 2 lingue overlay
      expect(hit.length).toBe(4 * 11 + 4 * 2);
      for (const c of hit) {
        expect(c.text, c.path).not.toMatch(API_TOKEN);
        expect(c.text, c.path).not.toMatch(notTransfer);
      }
    });

    it("overlay sv/da allineato al TS: tldr[3] == body.24.items[3] e nessun 'officiellt stöder'", () => {
      const ov = (nordicOverlayJson as any)["esportare-dati-garmin"];
      for (const l of ["sv", "da"]) {
        expect(ov["tldr"][l][3], l).toBe(ov["body.24.items"][l][3]);
        for (const it2 of ov["body.15.items"][l] as string[]) {
          expect(it2, `body.15.items.${l}`).not.toMatch(/officiellt stöder|officielt understøtter|Q3|kvartal/i);
        }
      }
    });

    it("body.15.items[2] (FitMesh Sync), TS 11 lingue + sv/da: via Health Connect, nessuna promessa di integrazione ufficiale ne' obbligo API (CS-2, CS-1 X4)", () => {
      // Asserisce la promessa, non la parola: tolta la sola clausola di negazione ammessa
      // («non tramite l'API ufficiale Garmin Connect elencata sopra»), il resto della voce non puo'
      // contenere API/OAuth/«ufficiale»/«integra*». Una frase «officiellt är integrerade med Garmin
      // Connect API» o un beneficio da integrazione («centralt ställe ... utan att exportera») e' rossa.
      const post: any = BLOG_POSTS_BY_SLUG["esportare-dati-garmin"];
      const ov = (nordicOverlayJson as any)["esportare-dati-garmin"];
      const negation: Record<string, RegExp> = {
        it: /non tramite l'API ufficiale Garmin Connect elencata sopra/,
        en: /not through the official Garmin Connect API listed above/,
        es: /no mediante la API oficial de Garmin Connect mencionada arriba/,
        de: /nicht über die oben genannte offizielle Garmin Connect API/,
        pt: /não pela API oficial do Garmin Connect listada acima/,
        fr: /et non via l'API officielle Garmin Connect mentionnée ci-dessus/,
        pl: /a nie przez oficjalne API Garmin Connect wymienione powyżej/,
        tr: /yukarıda listelenen resmi Garmin Connect API'si üzerinden değil/,
        nl: /niet via de hierboven genoemde officiële Garmin Connect API/,
        ja: /上記の公式Garmin Connect APIを使用しているわけではありません/,
        ko: /위에 나열된 공식 Garmin Connect API를 통한 것이 아닙니다/,
        sv: /och inte via det officiella Garmin Connect API som nämns ovan/,
        da: /og ikke via det officielle Garmin Connect-API, der er nævnt ovenfor/,
      };
      const residualBan =
        /\bAPI\b|API-|OAuth|ufficial|official|oficial|offiziell|officiel|officiell|officiël|resmi|公式|공식|oficjaln|integra|integr|統合|통합|entegr|godkänd|godkendt|approv|aprovad|zatwierdz/i;
      const items: Array<[string, string]> = [];
      for (const [l, arr] of Object.entries(post.body[15].items as Record<string, string[]>)) items.push([`ts.${l}`, arr[2]]);
      for (const l of ["sv", "da"]) items.push([`overlay.${l}`, ov["body.15.items"][l][2]]);
      expect(items.length).toBe(13);
      for (const [where, raw] of items) {
        const l = where.split(".")[1];
        const t = norm(raw);
        expect(t, where).toMatch(/Health[ -]Connect/);
        expect(t, where).toMatch(negation[l]);
        expect(t.replace(negation[l], ""), `${where} residuo`).not.toMatch(residualBan);
        // la voce FINISCE con la clausola di negazione: nessuna coda di beneficio dopo (CS-2: «...vilket gör
        // det möjligt att samla data på ett centralt ställe utan att behöva exportera dem manuellt»).
        expect(t.trim(), `${where} chiusura`).toMatch(new RegExp(negation[l].source + "[.。]$"));
      }
    });

    it("body.20: dichiara l'assenza di fonte primaria invece di elencare metriche scritte (11 lingue)", () => {
      const post: any = BLOG_POSTS_BY_SLUG["esportare-dati-garmin"];
      for (const [lang, text] of Object.entries(post.body[20].text as Record<string, string>)) {
        expect(text, `body[20].${lang}`).toMatch(/Health Connect/);
        expect(text, `body[20].${lang}`).not.toMatch(/maggio 2026|May 2026|mayo de 2026|Mai 2026|maio de 2026|mai 2026|maj 2026|5月|2026년 5월|mayıs 2026|mei 2026/i);
      }
    });
  });

  describe("Overlay Garmin/Google Health/Fitbit: nessuna regressione fra TS e sv/da", () => {
    it("ogni chiave overlay dei tre post ha sv e da non vuoti", () => {
      for (const slug of ["esportare-dati-garmin", "fitbit-data-not-syncing-android"]) {
        const ov = (nordicOverlayJson as any)[slug];
        expect(ov, slug).toBeDefined();
        for (const [key, val] of Object.entries(ov as Record<string, any>)) {
          for (const l of ["sv", "da"]) {
            const v = val[l];
            expect(v, `${slug} ${key}.${l}`).toBeTruthy();
            if (Array.isArray(v)) for (const x of v) expect(String(x).length, `${slug} ${key}.${l}`).toBeGreaterThan(0);
          }
        }
      }
      // Google Health non ha voci overlay: se qualcuno le aggiunge, la sweep sopra va estesa a sv/da.
      expect((nordicOverlayJson as any)["google-health-google-fit"]).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------------------------
// SEGUITO S2 (CS2-1..CS2-4), RIPROGETTATO nel giro 2 (SA-GUARDIE-V2) e RISTRETTO nel giro 3 (SA-GUARDIE-V3): le due
// guardie riconoscono una AFFERMAZIONE nel suo contesto di FRASE, non una parola in blocco.
//  - Fitbit: una espressione di frequenza/proporzione/superlativo di causa NELLA STESSA FRASE di un nome o stato di
//    problema/causa/colpa/motivo, di una causa nota (permessi, ottimizzazione/risparmio energetico) o di un verbo di
//    problema (fallisce, blocca, chiude, dipende da), in frase dichiarativa (non domanda, non posizione di un menu, non
//    modo, non scheduling «piu' volte al giorno», non etichetta attributiva senza predicato, non presa di distanza).
//    «sync», «batteria», «perche'/because/weil» NON sono da soli un contesto di problema (V3, F2).
//  - Garmin: una frase POSITIVA (nessuna negazione prima O dopo il predicato, nella clausola) in cui un predicato di
//    integrazione/collegamento/ufficialita'/partnership/avallo/supporto DIRETTO ha per oggetto Garmin e FitMesh (o
//    «noi») e' il soggetto; la lettura/import/sync DIRETTA da Garmin al presente; le previsioni e le roadmap.
//  - Beneficio in testa a body.15.items[2]: una frase positiva che affermi beneficio da integrazione/automazione.
// LIMITI NOTI (sono euristiche di testo, non semantica; non vengono nascosti; le frasi sono nel test LIMITI-NOTI):
//  - lessici scritti da un agente non madrelingua; copertura ragionevole, non completa, per lingua;
//  - una promessa senza «Garmin» nella frase e senza predicato forte nella stessa frase (es. «E' prevista.»
//    riferita a una frase precedente) non e' vista; idem un oggetto nominato solo con un pronome («Lo supporta.»);
//  - la segmentazione spezza anche su abbreviazioni/decimali e su «;»: una frase divisa a meta' perde il contesto;
//  - la negazione Garmin e' cercata nella clausola: 7 parole PRIMA del predicato, e DOPO il predicato solo come
//    «negazione + (0-3 parole) + parola di disponibilita'/previsione» o lessema negativo (impossibile, not yet...);
//    «senza/without» NON sono negazioni del predicato, tranne «senza/without ... accordo/approvazione» con
//    incapacita' («non puo'», «cannot») e «avrebbe bisogno dell'approvazione ... e non ce l'ha»;
//  - una frase senza FitMesh con un nome proprio sconosciuto davanti al predicato e' letta come terza parte («Runna
//    integra...»); un sostantivo iniziale maiuscolo seguito dal predicato puo' dare un falso negativo;
//  - le domande retoriche in forma interrogativa passano (voluto dal mandato), anche se promettono;
//  - la distanza/negazione Fitbit («non possiamo dire che ... spesso») ritira l'affermazione solo se precede il
//    marcatore nella stessa clausola; non copre ipotesi («potrebbe essere spesso...»);
//  - «stops/blocca/chiude/kills» + frequenza e' una frequenza di EVENTO-PROBLEMA: «Fitbit usually stops syncing when
//    the phone is off» e' rossa per scelta (indistinguibile da «often stops»);
//  - «compatibile con Garmin» e' trattato come supporto; la citazione di una terza parte e' una lista, non un NER;
//  - non catturati (sonde del giro 3, vedi LIMITI-NOTI): litote («non e' raro che»), «usual suspect», «su dieci casi,
//    nove...», frequenze temporali («ogni giorno»), «dialoga con Garmin Connect», flussi senza verbo di lettura
//    («flows directly into FitMesh»), frasi con soli pronomi; «FitMesh funziona con Garmin.» (vago: ammesso);
//  - lessici di frequenza: nessuna garanzia su sinonimi non elencati, ne' su costruzioni analitiche («one in
//    two cases», «nel 90% dei casi» e' preso dal test PCT_CLAIM, non da qui).
// Nessun contenuto e' modificato da questo blocco: se la guardia segnalasse contenuto corrente sarebbe un FINDING.
// ---------------------------------------------------------------------------------------------


describe("SEGUITO S2 (riprogettato): guardie di frequenza (Fitbit) e di promessa (Garmin), per frase", () => {
  describe("Fitbit: frequenza di occorrenza del problema in OGNI cella (11 lingue TS + sv/da overlay)", () => {
    const cells = collectCells("fitbit-data-not-syncing-android");

    it("riconoscimento per lingua: la forma «spesso/often/souvent/...» e' rossa in tutte le 13 lingue (e no/fi)", () => {
      const flagged: Record<string, string> = {
        it: "Spesso il problema sono i permessi.",
        en: "This often happens because of permissions.",
        es: "A menudo el problema son los permisos.",
        de: "Meistens liegt es an den Berechtigungen.",
        pt: "Muitas vezes o problema são as permissões.",
        fr: "Le problème vient souvent des autorisations.",
        pl: "Zazwyczaj problemem są uprawnienia.",
        tr: "Genellikle sorun izinlerden kaynaklanır.",
        nl: "Meestal zijn het de machtigingen.",
        ja: "多くの場合は権限が原因です。",
        ko: "문제는 보통 권한입니다.",
        sv: "Oftast är det behörigheterna.",
        da: "Det er som regel tilladelserne.",
        no: "Det er ofte tillatelsene.",
        fi: "Usein ongelma ovat oikeudet.",
      };
      for (const [l, t] of Object.entries(flagged)) {
        expect(norm(t), l).toMatch(FREQUENCY_OCCURRENCE);
        expect(fitbitFrequencyProblems(t).length, `${l} frase di frequenza del problema`).toBeGreaterThan(0);
      }
    });

    it("nessuna cella afferma quanto spesso accade il problema (hero, tldr, body, faq, metadati, overlay)", () => {
      const allowed = new Set<string>();
      for (const c of cells) {
        if (SECTION_LABELS_EXTENDED[c.path] === c.text) {
          allowed.add(c.path);
          continue;
        }
        expect(fitbitFrequencyProblems(c.text), c.path).toEqual([]);
      }
      // etichette di sezione davvero presenti con quel testo esatto (nessuna esenzione fantasma)
      expect([...allowed].sort()).toEqual(Object.keys(SECTION_LABELS_EXTENDED).sort());
    });

    it("controlli positivi: frasi legittime che il marcatore NON deve fermare (non si vieta la parola in blocco)", () => {
      // (a) gia' nel contenuto: quantita' di persone/guide, non frequenza dell'evento (ko body.3 e body.8, = main)
      const ko3 = cells.find((c) => c.path === "ts:body.3.text.ko");
      const ko8 = cells.find((c) => c.path === "ts:body.8.body.ko");
      expect(ko3?.text).toMatch(/대부분의 사람들/);
      expect(ko8?.text).toMatch(/대부분의 문제 해결 가이드/);
      expect(ko3!.text).not.toMatch(FREQUENCY_OCCURRENCE);
      expect(ko8!.text).not.toMatch(FREQUENCY_OCCURRENCE);
      // (b) il «多く» di body.7/8 ja e' un quantificatore («多くのデバイス»): non e' frequenza
      expect(norm("多くのデバイスは、Health Connectの権限を個別に管理します。")).not.toMatch(FREQUENCY_OCCURRENCE);
      // (c) causa e rimedio senza stima di frequenza: stessa materia (permessi, problema), nessun avverbio
      for (const t of [
        "Il problema sono i permessi: controllali prima di reinstallare l'app.",
        "Check the Health Connect permissions first; if the problem persists, restart the phone.",
        "Ogni volta che installi un'app nuova, apri Health Connect e verifica i permessi.",
        "Si le problème persiste après la vérification des autorisations, redémarrez le téléphone.",
      ]) {
        expect(norm(t), t).not.toMatch(FREQUENCY_OCCURRENCE);
      }
      // (d) parole che CONTENGONO un marcatore ma non lo sono: confini di parola
      for (const t of ["Software update", "Soft permissions", "oftware", "Das ist die Sprache.", "sıkıştırma ayarı"]) {
        expect(norm(t), t).not.toMatch(FREQUENCY_OCCURRENCE);
      }
      // (e) il marcatore da solo non e' una violazione: serve il contesto di problema nella stessa frase
      for (const t of [
        "Health Connect di solito si trova nelle Impostazioni di Android.",
        "How often does Fitbit sync with Health Connect?",
        "Sık sorulan sorular bölümüne de bakın.",
      ]) {
        expect(fitbitFrequencyProblems(t), t).toEqual([]);
      }
    });
  });

  describe("Garmin: promessa e non parola, in OGNI cella (11 lingue TS + sv/da overlay)", () => {
    const cells = collectCells("esportare-dati-garmin");

    it("copertura: 13 voci body.15.items[2] e 13 etichette CTA davvero visitate; esenzioni verificate", () => {
      const neg = cells.filter((c) => GA_NEG_PATH.test(c.path));
      const cta = cells.filter((c) => GA_CTA_PATH.test(c.path));
      expect(neg.length).toBe(13);
      expect(cta.length).toBe(13);
      expect(cells.length).toBeGreaterThan(900);
      for (const c of neg) {
        expect(isFitmeshSyncNegationCell(c.lang, c.text), `negazione ${c.path}`).toBe(true);
      }
      for (const c of cta) expect(c.text, c.path).toBe(nz(GA_CTA_LABELS[c.lang]));
    });

    it("nessuna cella promette integrazione ufficiale/API/partnership/supporto di FitMesh, ne' integrazione prevista", () => {
      for (const c of cells) expect(garminCellVerdict(c.path, c.text), c.path).toEqual([]);
    });

    it("body.15.items[2]: nessun beneficio affermato nella voce, ne' in testa ne' in coda (CS2-3, G3)", () => {
      // P4sv («samlar automatiskt alla dina Garmin-data på ett ställe ...») rientrava dall'inizio.
      const benefit: Record<string, string> = {
        sv: "**FitMesh Sync**: samlar automatiskt alla dina Garmin-data på ett ställe utan manuell export och läser idag dina Garmin-data via Health Connect och inte via det officiella Garmin Connect API som nämns ovan.",
        it: "**FitMesh Sync**: raccoglie in automatico tutto in un posto e oggi legge i tuoi dati Garmin tramite il pass-through Health Connect, non tramite l'API ufficiale Garmin Connect elencata sopra.",
        sv2: "**FitMesh Sync**: samlar allt och läser idag dina Garmin-data via Health Connect och inte via det officiella Garmin Connect API som nämns ovan.",
        en: "**FitMesh Sync**: syncs everything automatically; today reads your Garmin data through the Health Connect pass-through, not through the official Garmin Connect API listed above.",
      };
      for (const [l, t] of Object.entries(benefit)) expect(isFitmeshSyncNegationCell(l.replace(/\d+$/, ""), t), l).toBe(false);
      // e una frase in coda dopo la negazione, o una seconda frase, la respinge
      const real = cells.find((c) => c.path === "ts:body.15.items.it.2")!.text;
      expect(isFitmeshSyncNegationCell("it", real)).toBe(true);
      expect(isFitmeshSyncNegationCell("it", `${real} Garmin e FitMesh sono partner.`)).toBe(false);
      expect(isFitmeshSyncNegationCell("it", real.replace(/\.$/, ", ed è integrata ufficialmente."))).toBe(false);
      // la resa corrente NON e' vincolata da una lista di parole: una resa neutra diversa resta ammessa
      expect(
        isFitmeshSyncNegationCell(
          "sv",
          "**FitMesh Sync**: hämtar idag dina Garmin-uppgifter via Health Connect och inte via det officiella Garmin Connect API som nämns ovan.",
        ),
      ).toBe(true);
    });

    it("controlli positivi: frasi vere e legittime (gia' nel contenuto) che la guardia NON ferma", () => {
      const get = (p: string) => cells.find((c) => c.path === p)!.text;
      // (a) terze parti con integrazione ufficiale: vero, nessun FitMesh, citate per nome
      const it1 = get("ts:body.15.items.it.1");
      expect(it1).toMatch(/integrazione ufficiale/);
      expect(garminPromiseProblems(it1)).toEqual([]);
      const sv1 = get("overlay:body.15.items.sv.1");
      expect(sv1).toMatch(/officiellt integrerade/);
      expect(garminPromiseProblems(sv1)).toEqual([]);
      // (b) descrizione dell'API Garmin (richiede OAuth), senza FitMesh e senza promessa
      const it0 = get("ts:body.15.items.it.0");
      expect(it0).toMatch(/OAuth/);
      expect(garminPromiseProblems(it0)).toEqual([]);
      // (c) «in futuro» riferito alla reimportazione dei file, non a una integrazione (body.8)
      const b8 = get("ts:body.8.text.it");
      expect(b8).toMatch(/in futuro/);
      expect(garminPromiseProblems(b8)).toEqual([]);
      // (d) FitMesh nominato in una frase che descrive solo cio' che fa oggi: nominarlo non e' vietato
      for (const t of [
        "FitMesh legge i dati Garmin tramite Health Connect.",
        "FitMesh reads your Garmin data through Health Connect.",
        "FitMesh läser dina Garmin-data via Health Connect.",
      ]) {
        expect(garminPromiseProblems(t), t).toEqual([]);
      }
      // (e) le due esenzioni NON sono un varco generale: la stessa etichetta con altro testo e' rossa
      expect(garminCellVerdict("ts:body.25.ctaLabel.it", "Vedi integrazione Garmin su FitMesh →").length).toBe(0);
      expect(garminPromiseProblems("Vedi integrazione Garmin su FitMesh →").length).toBeGreaterThan(0);
      expect(garminCellVerdict("ts:body.25.ctaLabel.it", "Vedi integrazione ufficiale Garmin su FitMesh →").length).toBeGreaterThan(0);
      expect(nz("Vedi integrazione ufficiale Garmin su FitMesh →")).not.toBe(nz(GA_CTA_LABELS.it));
    });

    it("riconoscimento: le promesse (anche senza nominare FitMesh, anche «prevista») sono rosse in piu' lingue", () => {
      const promises = [
        "FitMesh è integrata ufficialmente con l'API Garmin Connect.",
        "L'app è integrata ufficialmente con l'API Garmin Connect.",
        "L'integrazione diretta di FitMesh con Garmin è prevista.",
        "FitMesh is officially integrated with the Garmin Connect API.",
        "FitMesh est intégrée officiellement à l'API Garmin Connect.",
        "FitMesh ist offiziell in die Garmin Connect API integriert.",
        "FitMesh är officiellt integrerat med Garmin Connect API.",
        "FitMesh es socio oficial de Garmin.",
        "FitMesh supports Garmin Connect natively.",
        "FitMesh 将来 Garmin Connect を統合する予定です。",
      ];
      for (const t of promises) expect(garminPromiseProblems(norm(t)).length, t).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------------------------
// CORPUS data-driven (misura la QUALITA' delle due guardie, non solo le regole).
// Ogni voce e' un test nominato. La frase e' inserita in una cella REALE del post (di norma in testa a una FAQ,
// come nel controllo indipendente S3) e la cella risultante passa dal vero percorso di guardia
// (fitbitCellVerdict / garminCellVerdict, gli stessi del test sul contenuto). Prima della verifica si controlla
// che la cella originale sia verde, cosi' un rosso/verde non dipende dal contenuto di partenza.
//   DEVE-PASSARE: frasi vere e non promissorie (L1-L18 verbatim dal controllo S3, piu' voci proprie).
//   DEVE-FALLIRE: i mutanti del controllo S3 (P*, K*, V1-V9) piu' voci proprie (altre lingue, altri campi).
// ---------------------------------------------------------------------------------------------
type CorpusEntry = {
  id: string;
  post: "FB" | "GA";
  path: string; // cella reale (collectCells), lingua inclusa
  mode?: "prepend" | "set" | "replace";
  text: string; // frase da inserire (prepend), testo nuovo (set), oppure testo nuovo per replace
  from?: string; // replace: stringa esistente nella cella
  expect: "pass" | "fail";
  src: "S3-L" | "S3-P" | "S3-K" | "S3-V" | "SA" | "S4-LF" | "S4-LG" | "S4-PF" | "S4-PG" | "S4-EX" | "SA3";
};
const FB_SLUG = "fitbit-data-not-syncing-android";
const GA_SLUG = "esportare-dati-garmin";
const ITEM_NEG_SV = "**FitMesh Sync**: samlar automatiskt alla dina Garmin-data på ett ställe utan manuell export och läser idag dina Garmin-data via Health Connect och inte via det officiella Garmin Connect API som nämns ovan.";
const E = (
  src: CorpusEntry["src"],
  expectV: CorpusEntry["expect"],
  id: string,
  post: CorpusEntry["post"],
  path: string,
  text: string,
  extra: Partial<CorpusEntry> = {},
): CorpusEntry => ({ id, post, path, text, expect: expectV, src, ...extra });
const CORPUS: CorpusEntry[] = [
  // ---- DEVE-FALLIRE: mutanti dichiarati da AS (CONTROLLO-S3 §b) ----
  E("S3-P", "fail", "P1it", "FB", "ts:faq.0.a.it", "Spesso il problema sono i permessi."),
  E("S3-P", "fail", "P2fr", "FB", "ts:faq.0.a.fr", "Le problème vient souvent des autorisations."),
  E("S3-P", "fail", "P2en", "FB", "ts:faq.0.a.en", "This often happens because of permissions."),
  E("S3-P", "fail", "P3it", "GA", "ts:faq.0.a.it", "L'integrazione diretta di FitMesh con Garmin è prevista."),
  E("S3-P", "fail", "P4sv", "GA", "overlay:body.15.items.sv.2", ITEM_NEG_SV, { mode: "set" }),
  E("S3-P", "fail", "P5it", "GA", "ts:faq.0.a.it", "FitMesh è integrata ufficialmente con l'API Garmin Connect."),
  // ---- DEVE-FALLIRE: mutanti nuovi del controllo S3 ----
  E("S3-K", "fail", "K1ja", "FB", "ts:faq.0.a.ja", "この問題はよく権限が原因で起こります。"),
  E("S3-K", "fail", "K2ko", "FB", "ts:faq.0.a.ko", "이 문제는 자주 권한 때문에 발생합니다."),
  E("S3-K", "fail", "K3tr", "FB", "ts:faq.0.a.tr", "Bu sorun sık sık izinlerden kaynaklanır."),
  E("S3-K", "fail", "K4pl", "FB", "ts:faq.0.a.pl", "Zwykle problemem są uprawnienia."),
  E("S3-K", "fail", "K5sv", "GA", "overlay:faq.0.a.sv", "FitMesh är officiellt integrerat med Garmin Connect API."),
  E("S3-K", "fail", "K6da", "GA", "overlay:faq.0.a.da", "FitMesh understøtter Garmin Connect direkte."),
  E("S3-K", "fail", "K7da", "GA", "overlay:body.15.items.da.2",
    "**FitMesh Sync**: samler automatisk alt og læser i dag dine Garmin-data via Health Connect og ikke via det officielle Garmin Connect-API, der er nævnt ovenfor.", { mode: "set" }),
  E("S3-K", "fail", "K8it", "GA", "ts:body.15.items.it.2", "**FitMesh Sync**: oggi legge tutti i tuoi dati Garmin",
    { mode: "replace", from: "**FitMesh Sync**: oggi legge i tuoi dati Garmin" }),
  E("S3-K", "fail", "K9de", "GA", "ts:faq.0.a.de", "Eine direkte Anbindung an die Garmin API kommt in Zukunft."),
  E("S3-K", "fail", "K10ko", "GA", "ts:faq.0.a.ko", "FitMesh와 Garmin의 직접 연동은 향후 제공됩니다."),
  E("S3-K", "fail", "K11it", "GA", "ts:hero.subtitle.it", "FitMesh si collega ufficialmente a Garmin."),
  E("S3-K", "fail", "K12en", "GA", "ts:hero.subtitle.en", "FitMesh is officially connected to Garmin."),
  // ---- DEVE-FALLIRE: forme sorelle V1-V9 (sopravvivevano a 469e2447) ----
  E("S3-V", "fail", "V1it", "FB", "ts:faq.0.a.it", "In molti casi il problema sono i permessi."),
  E("S3-V", "fail", "V2en", "FB", "ts:faq.0.a.en", "In many cases, permissions are the cause."),
  E("S3-V", "fail", "V3it", "FB", "ts:faq.0.a.it", "Il più delle volte il problema sono i permessi."),
  E("S3-V", "fail", "V4it", "FB", "ts:faq.0.a.it", "Spessissimo il problema sono i permessi."),
  E("S3-V", "fail", "V5en", "FB", "ts:faq.0.a.en", "Nine times out of ten, permissions are the cause."),
  E("S3-V", "fail", "V6it", "GA", "ts:hero.subtitle.it", "Sincronizzazione ufficiale con Garmin Connect, senza export manuale."),
  E("S3-V", "fail", "V7it", "GA", "ts:faq.0.a.it", "Siamo partner ufficiali di Garmin."),
  E("S3-V", "fail", "V8en", "GA", "ts:hero.subtitle.en", "Officially syncs with Garmin Connect."),
  E("S3-V", "fail", "V9ja", "GA", "ts:faq.0.a.ja", "FitMesh は Garmin 公認のアプリです。"),
  // ---- DEVE-PASSARE: L1-L18 VERBATIM dal controllo S3 (frasi legittime) ----
  E("S3-L", "pass", "L1it", "FB", "ts:faq.0.a.it", "Quando apri l'app, FitMesh legge i nuovi dati da Health Connect."),
  E("S3-L", "pass", "L2it", "FB", "ts:faq.0.a.it", "La sincronizzazione in background può avvenire più volte al giorno."),
  E("S3-L", "pass", "L3it", "FB", "ts:faq.0.a.it", "Health Connect di solito si trova nelle Impostazioni di Android."),
  E("S3-L", "pass", "L4ja", "FB", "ts:faq.0.a.ja", "設定画面をよく確認してください。"),
  E("S3-L", "pass", "L5ko", "FB", "ts:faq.0.a.ko", "절전 모드를 끄고 보통 모드로 되돌리세요."),
  E("S3-L", "pass", "L6sv", "FB", "overlay:faq.0.a.sv", "Starta om telefonen och återgå till normalt läge."),
  E("S3-L", "pass", "L7en", "FB", "ts:faq.0.a.en", "How often does Fitbit sync with Health Connect? It depends on the Fitbit app."),
  E("S3-L", "pass", "L8de", "FB", "ts:faq.0.a.de", "Wie oft Fitbit synchronisiert, legt die Fitbit-App fest."),
  E("S3-L", "pass", "L9tr", "FB", "ts:faq.0.a.tr", "Sık sorulan sorular bölümüne de bakın."),
  E("S3-L", "pass", "L10it", "GA", "ts:faq.0.a.it", "FitMesh non usa l'API Garmin Connect: legge da Health Connect."),
  E("S3-L", "pass", "L11en", "GA", "ts:faq.0.a.en", "FitMesh does not use the Garmin Connect API."),
  E("S3-L", "pass", "L12it", "GA", "ts:faq.0.a.it", "In FitMesh apri la sezione Integrazioni e attiva Health Connect."),
  E("S3-L", "pass", "L13it", "GA", "ts:faq.0.a.it", "L'app ufficiale Garmin Connect si integra con Apple Salute su iPhone."),
  E("S3-L", "pass", "L14it", "GA", "ts:faq.0.a.it", "Se il servizio restituisce un errore imprevisto con l'API, riprova più tardi."),
  E("S3-L", "pass", "L15en", "GA", "ts:faq.0.a.en", "FitMesh reads Garmin data only through Health Connect, the official Android health data hub."),
  E("S3-L", "pass", "L16it", "GA", "ts:faq.0.a.it", "Garmin Connect è il servizio ufficiale di Garmin; FitMesh non vi si collega direttamente."),
  E("S3-L", "pass", "L17it", "GA", "ts:faq.0.a.it", "FitMesh è compatibile con Health Connect."),
  E("S3-L", "pass", "L18en", "GA", "ts:faq.0.a.en", "Garmin's official API is available to approved business developers."),
  // ---- DEVE-PASSARE: voci proprie (negazioni in tutte le lingue, terze parti, domande, etichette, usi non frequenziali) ----
  E("SA", "pass", "N1es", "GA", "ts:faq.0.a.es", "FitMesh no se integra oficialmente con Garmin; lee los datos a través de Health Connect."),
  E("SA", "pass", "N2fr", "GA", "ts:faq.0.a.fr", "FitMesh n'est pas intégré officiellement à Garmin Connect."),
  E("SA", "pass", "N3de", "GA", "ts:faq.0.a.de", "FitMesh ist nicht offiziell mit Garmin verbunden."),
  E("SA", "pass", "N4sv", "GA", "overlay:faq.0.a.sv", "FitMesh är inte officiellt integrerat med Garmin."),
  E("SA", "pass", "N5da", "GA", "overlay:faq.0.a.da", "FitMesh understøtter ikke Garmin direkte."),
  E("SA", "pass", "N6pt", "GA", "ts:faq.0.a.pt", "O FitMesh não tem integração oficial com a Garmin."),
  E("SA", "pass", "N7pl", "GA", "ts:faq.0.a.pl", "FitMesh nie jest oficjalnie zintegrowany z Garmin."),
  E("SA", "pass", "N8tr", "GA", "ts:faq.0.a.tr", "FitMesh Garmin ile resmi olarak entegre değildir."),
  E("SA", "pass", "N9nl", "GA", "ts:faq.0.a.nl", "FitMesh is niet officieel geïntegreerd met Garmin."),
  E("SA", "pass", "N10ja", "GA", "ts:faq.0.a.ja", "FitMesh は Garmin と公式に連携していません。"),
  E("SA", "pass", "N11ko", "GA", "ts:faq.0.a.ko", "FitMesh는 Garmin과 공식적으로 연동되지 않습니다."),
  E("SA", "pass", "N12it", "GA", "ts:faq.0.a.it", "FitMesh non ha un'integrazione diretta con Garmin: legge i dati da Health Connect."),
  E("SA", "pass", "T1it", "GA", "ts:faq.0.a.it", "Strava ha un'integrazione ufficiale con Garmin Connect."),
  E("SA", "pass", "T2en", "GA", "ts:faq.0.a.en", "Intervals.icu connects directly to Garmin Connect."),
  E("SA", "pass", "T3en", "GA", "ts:faq.0.a.en", "Garmin officially supports exporting activities as FIT files."),
  E("SA", "pass", "T4sv", "GA", "overlay:faq.0.a.sv", "Garmin Connect är den officiella tjänsten från Garmin."),
  E("SA", "pass", "Q1en", "GA", "ts:faq.0.a.en", "Is FitMesh officially integrated with Garmin?"),
  E("SA", "pass", "Q2it", "GA", "ts:faq.0.a.it", "FitMesh è integrato ufficialmente con Garmin?"),
  E("SA", "pass", "B1it", "GA", "ts:faq.0.a.it", "Integrazioni: Health Connect e Apple Salute."),
  E("SA", "pass", "M1it", "GA", "ts:faq.0.a.it", "FitMesh si collega ai dati Garmin tramite Health Connect."),
  E("SA", "pass", "F1fr", "FB", "ts:faq.0.a.fr", "Combien de fois par jour Fitbit se synchronise-t-il ? Cela dépend de l'application."),
  E("SA", "pass", "F2es", "FB", "ts:faq.0.a.es", "¿Con qué frecuencia sincroniza Fitbit? Depende de la app de Fitbit."),
  E("SA", "pass", "F3pt", "FB", "ts:faq.0.a.pt", "A sincronização em segundo plano pode ocorrer muitas vezes ao dia."),
  E("SA", "pass", "F4nl", "FB", "ts:faq.0.a.nl", "Hoe vaak Fitbit synchroniseert, bepaalt de Fitbit-app."),
  E("SA", "pass", "F5ja", "FB", "ts:faq.0.a.ja", "設定をよく確認してから、Health Connect の同期を再開してください。"),
  E("SA", "pass", "F6ko", "FB", "ts:faq.0.a.ko", "보통 모드로 전환한 뒤 동기화를 다시 시도하세요."),
  E("SA", "pass", "F7de", "FB", "ts:faq.0.a.de", "Die Berechtigungen findest du normalerweise in den Einstellungen."),
  E("SA", "pass", "F8en", "FB", "ts:faq.0.a.en", "Permissions are usually listed under Settings in Health Connect."),
  E("SA", "pass", "F9sv", "FB", "overlay:faq.0.a.sv", "Hur ofta Fitbit synkroniserar beror på Fitbit-appen."),
  E("SA", "pass", "G1it", "GA", "ts:faq.0.a.it", "Contatta il supporto Garmin se il dispositivo non si accende."),
  E("SA", "pass", "G2it", "GA", "ts:faq.0.a.it", "FitMesh non supporterà Garmin direttamente."),
  E("SA", "pass", "G3fr", "GA", "ts:faq.0.a.fr", "FitMesh se connecte à Garmin via Health Connect."),
  E("SA", "pass", "F10it", "FB", "ts:faq.0.a.it", "La maggior parte delle persone usa Health Connect."),
  // ---- DEVE-FALLIRE: voci proprie (altre lingue, altri campi) ----
  E("SA", "fail", "X1de", "FB", "ts:faq.0.a.de", "Häufig liegt das Problem an den Berechtigungen."),
  E("SA", "fail", "X2pt", "FB", "ts:faq.0.a.pt", "Muitas vezes o problema são as permissões."),
  E("SA", "fail", "X3es", "FB", "ts:faq.0.a.es", "En muchos casos el problema son los permisos."),
  E("SA", "fail", "X4nl", "FB", "ts:faq.0.a.nl", "Vaak is het probleem een gebrek aan machtigingen."),
  E("SA", "fail", "X5da", "FB", "overlay:faq.0.a.da", "Det er ofte tilladelserne, der er problemet."),
  E("SA", "fail", "X6sv", "FB", "overlay:hero.subtitle.sv", "Ofta beror det på behörigheterna."),
  E("SA", "fail", "X7it", "FB", "ts:hero.subtitle.it", "Quasi sempre la causa sono i permessi di Health Connect."),
  E("SA", "fail", "X8ja", "FB", "ts:hero.subtitle.ja", "同期が止まる原因はしばしば権限です。"),
  E("SA", "fail", "Y1it", "GA", "ts:hero.subtitle.it", "FitMesh integra direttamente l'API ufficiale di Garmin."),
  E("SA", "fail", "Y2es", "GA", "ts:faq.0.a.es", "FitMesh es compatible de forma nativa con Garmin Connect."),
  E("SA", "fail", "Y3fr", "GA", "ts:faq.0.a.fr", "FitMesh sera bientôt intégré directement à Garmin."),
  E("SA", "fail", "Y4pl", "GA", "ts:faq.0.a.pl", "FitMesh jest oficjalnym partnerem Garmin."),
  E("SA", "fail", "Y5tr", "GA", "ts:faq.0.a.tr", "FitMesh Garmin ile resmi olarak entegredir."),
  E("SA", "fail", "Y6nl", "GA", "ts:faq.0.a.nl", "FitMesh is een officiële partner van Garmin."),
  E("SA", "fail", "Y7da", "GA", "overlay:hero.subtitle.da", "FitMesh er officielt integreret med Garmin."),
  E("SA", "fail", "Y8ko", "GA", "ts:hero.subtitle.ko", "FitMesh는 Garmin과 공식적으로 연동됩니다."),
  E("SA", "fail", "Y9it", "GA", "ts:faq.0.a.it", "FitMesh legge i dati Garmin. Si integra ufficialmente."),
  E("SA", "fail", "Y10de", "GA", "ts:body.15.items.de.2",
    "**FitMesh Sync**: liest alle deine Garmin-Daten automatisch über Health Connect und nicht über die oben genannte offizielle Garmin Connect API.", { mode: "set" }),
  E("SA", "fail", "Y11en", "GA", "ts:faq.0.a.en", "FitMesh uses the Garmin Connect API to read your activities."),
  E("SA", "fail", "Y13it", "GA", "ts:faq.0.a.it", "Garmin ha approvato FitMesh."),
  E("SA", "fail", "Y14it", "GA", "ts:faq.0.a.it", "FitMesh funziona direttamente con Garmin Connect."),
  E("SA", "fail", "Y15it", "GA", "ts:faq.0.a.it", "In futuro FitMesh leggerà Garmin direttamente."),
  E("SA", "fail", "Y16it", "GA", "ts:faq.0.a.it", "FitMesh ha un accordo con Garmin."),
  E("SA", "fail", "X9it", "FB", "ts:faq.0.a.it", "La maggior parte dei problemi dipende dai permessi."),
  E("SA", "fail", "X10fi", "FB", "ts:hero.subtitle.en", "Se on usein akun optimointi."),
  E("SA", "fail", "Y12it", "GA", "ts:faq.0.a.it", "FitMesh non richiede export manuali, e legge i dati tramite l'API ufficiale Garmin Connect."),
];

describe("CORPUS delle guardie Fitbit/Garmin (SA-GUARDIE-V2): ogni voce e' un test nominato", () => {
  const cellsBy: Record<"FB" | "GA", Map<string, string>> = {
    FB: new Map(collectCells(FB_SLUG).map((c) => [c.path, c.text])),
    GA: new Map(collectCells(GA_SLUG).map((c) => [c.path, c.text])),
  };
  const verdict = (post: "FB" | "GA", path: string, text: string): string[] =>
    post === "FB" ? fitbitCellVerdict(path, nz(text)) : garminCellVerdict(path, nz(text));

  it("copertura del corpus: 18 L + 6 P + 12 K + 9 V dal controllo S3, piu' voci proprie in tutte le lingue", () => {
    const by = (s: CorpusEntry["src"]) => CORPUS.filter((e) => e.src === s).length;
    expect(by("S3-L")).toBe(18);
    expect(by("S3-P")).toBe(6);
    expect(by("S3-K")).toBe(12);
    expect(by("S3-V")).toBe(9);
    expect(CORPUS.filter((e) => e.src === "SA" && e.expect === "pass").length).toBeGreaterThanOrEqual(12);
    expect(CORPUS.filter((e) => e.src === "SA" && e.expect === "fail").length).toBeGreaterThanOrEqual(8);
    expect(new Set(CORPUS.map((e) => e.id)).size).toBe(CORPUS.length);
    const langs = new Set(CORPUS.map((e) => cellLang(e.path)));
    for (const l of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da"]) {
      expect(langs.has(l), `lingua ${l} nel corpus`).toBe(true);
    }
  });

  it.each(CORPUS.map((e) => [`${e.expect === "pass" ? "DEVE-PASSARE" : "DEVE-FALLIRE"} ${e.src} ${e.id} ${e.path}`, e] as const))(
    "%s",
    (_name, e) => {
      const original = cellsBy[e.post].get(e.path);
      expect(original, `cella ${e.path}`).toBeDefined();
      // il contenuto di partenza e' verde: l'esito dipende dalla sola frase inserita
      expect(verdict(e.post, e.path, original!), `cella originale ${e.path}`).toEqual([]);
      let mutated: string;
      if (e.mode === "set") mutated = e.text;
      else if (e.mode === "replace") {
        expect(original!.includes(nz(e.from!)), `ancora ${e.id}`).toBe(true);
        mutated = original!.replace(nz(e.from!), () => e.text);
      } else mutated = `${e.text} ${original}`;
      const problems = verdict(e.post, e.path, mutated);
      if (e.expect === "pass") expect(problems, e.id).toEqual([]);
      else expect(problems.length, `${e.id} deve essere rosso`).toBeGreaterThan(0);
    },
  );
});

// ---------------------------------------------------------------------------------------------
// CORPUS S4 (giro 3, SA-GUARDIE-V3): le frasi del controllo indipendente CONTROLLO-S4 (giro 2), VERBATIM, con il
// ruolo che il revisore ha dato: LF*/LG* = legittime (DEVE-PASSARE), PF*/PG* = promesse/frequenze (DEVE-FALLIRE),
// EX = sonde aggiuntive dello scheduling. Una frase che la guardia non riesce a classificare nel verso giusto
// senza falsi positivi NON sta qui: sta in LIMITI_NOTI, con la motivazione e l'esito osservato.
// ---------------------------------------------------------------------------------------------
const CORPUS_S4: CorpusEntry[] = [
  E("S4-LF", "pass", "S4-LF01it", "FB", "ts:faq.0.a.it", "Di solito i permessi si trovano nella scheda Autorizzazioni di Health Connect."),
  E("S4-LF", "pass", "S4-LF02de", "FB", "ts:faq.0.a.de", "Normalerweise findest du Health Connect unter Einstellungen > Apps."),
  E("S4-LF", "pass", "S4-LF03pl", "FB", "ts:faq.0.a.pl", "Uprawnienia znajdziesz zwykle w Ustawieniach."),
  E("S4-LF", "pass", "S4-LF04tr", "FB", "ts:faq.0.a.tr", "İzinler genellikle Ayarlar içinde bulunur."),
  E("S4-LF", "pass", "S4-LF05ko", "FB", "ts:faq.0.a.ko", "보통 설정에서 권한을 확인할 수 있습니다."),
  E("S4-LF", "pass", "S4-LF06fr", "FB", "ts:faq.0.a.fr", "Le problème vient-il souvent des autorisations ?"),
  E("S4-LF", "pass", "S4-LF07it", "FB", "ts:faq.0.a.it", "Non possiamo dire che il problema sia spesso nei permessi: verifica ogni passaggio."),
  E("S4-LF", "pass", "S4-LF08en", "FB", "ts:faq.0.a.en", "We cannot say that permissions are usually the cause, so check every step."),
  E("S4-LF", "pass", "S4-LF09it", "FB", "ts:faq.0.a.it", "Con la sincronizzazione continua attiva, l'app Fitbit sincronizza spesso durante la giornata."),
  E("S4-LF", "pass", "S4-LF10it", "FB", "ts:faq.0.a.it", "La batteria di un Fitbit di solito dura diversi giorni."),
  E("S4-LF", "pass", "S4-LF11en", "FB", "ts:faq.0.a.en", "On Android 14 Health Connect is usually already installed because it is part of the system."),
  E("S4-LF", "pass", "S4-LF12de", "FB", "ts:faq.0.a.de", "Ab Android 14 ist Health Connect meist vorinstalliert, weil es Teil des Systems ist."),
  E("S4-LF", "pass", "S4-LF13ja", "FB", "ts:body.6.text.ja", "よくある同期エラーと対処法", { mode: "set" }),
  E("S4-LF", "pass", "S4-LF14ko", "FB", "ts:body.6.text.ko", "자주 발생하는 동기화 문제", { mode: "set" }),
  E("S4-LF", "pass", "S4-LF15tr", "FB", "ts:body.6.text.tr", "Sık karşılaşılan senkronizasyon sorunları", { mode: "set" }),
  E("S4-LF", "pass", "S4-LF16es", "FB", "ts:faq.0.a.es", "Normalmente la opción está en Ajustes > Aplicaciones > Health Connect."),
  E("S4-LF", "pass", "S4-LF17nl", "FB", "ts:faq.0.a.nl", "Meestal staat Health Connect onder Instellingen."),
  E("S4-LF", "pass", "S4-LF18sv", "FB", "overlay:faq.0.a.sv", "Behörigheterna hittar du oftast under Inställningar."),
  E("S4-LF", "pass", "S4-LF19da", "FB", "overlay:faq.0.a.da", "Tilladelserne finder du typisk under Indstillinger."),
  E("S4-LF", "pass", "S4-LF20pt", "FB", "ts:faq.0.a.pt", "O Fitbit geralmente sincroniza várias vezes por dia em segundo plano."),
  E("S4-LF", "pass", "S4-LF21en", "FB", "ts:faq.0.a.en", "Fitbit usually syncs in the background when All-Day Sync is on."),
  E("S4-LF", "pass", "S4-LF22ja", "FB", "ts:faq.0.a.ja", "権限が原因かどうかは、設定画面をよく見て判断してください。"),
  E("S4-LG", "pass", "S4-LG01it", "GA", "ts:faq.0.a.it", "FitMesh non è un partner ufficiale di Garmin."),
  E("S4-LG", "pass", "S4-LG02en", "GA", "ts:faq.0.a.en", "FitMesh has no partnership with Garmin."),
  E("S4-LG", "pass", "S4-LG03fr", "GA", "ts:faq.0.a.fr", "L'application Garmin Connect se synchronise directement avec la montre."),
  E("S4-LG", "pass", "S4-LG04it", "GA", "ts:faq.0.a.it", "Garmin Connect si sincronizza direttamente con l'orologio via Bluetooth."),
  E("S4-LG", "pass", "S4-LG05en", "GA", "ts:faq.0.a.en", "Runna integrates directly with Garmin Connect."),
  E("S4-LG", "pass", "S4-LG06it", "GA", "ts:faq.0.a.it", "Stryd si integra ufficialmente con Garmin Connect IQ."),
  E("S4-LG", "pass", "S4-LG07pt", "GA", "ts:faq.0.a.pt", "O FitMesh não se conecta diretamente à Garmin."),
  E("S4-LG", "pass", "S4-LG08tr", "GA", "ts:faq.0.a.tr", "FitMesh, Garmin'in resmi API'sini kullanmaz."),
  E("S4-LG", "pass", "S4-LG09ja", "GA", "ts:faq.0.a.ja", "FitMesh は Garmin の公式 API を使用していません。"),
  E("S4-LG", "pass", "S4-LG10ko", "GA", "ts:faq.0.a.ko", "FitMesh는 Garmin 공식 API를 사용하지 않습니다."),
  E("S4-LG", "pass", "S4-LG11nl", "GA", "ts:faq.0.a.nl", "FitMesh is geen officiële partner van Garmin."),
  E("S4-LG", "pass", "S4-LG12de", "GA", "ts:faq.0.a.de", "FitMesh ist kein offizieller Garmin-Partner."),
  E("S4-LG", "pass", "S4-LG13en", "GA", "ts:faq.0.a.en", "Without an official API agreement, FitMesh cannot connect to Garmin directly."),
  E("S4-LG", "pass", "S4-LG14it", "GA", "ts:faq.0.a.it", "Senza un accordo con Garmin, FitMesh non può usare l'API ufficiale."),
  E("S4-LG", "pass", "S4-LG15en", "GA", "ts:faq.0.a.en", "FitMesh would need Garmin's approval to use the official API, and it does not have it."),
  E("S4-LG", "pass", "S4-LG16it", "GA", "ts:faq.0.a.it", "Il collegamento diretto a Garmin non è disponibile in FitMesh."),
  E("S4-LG", "pass", "S4-LG17en", "GA", "ts:faq.0.a.en", "Direct Garmin integration is not available in FitMesh."),
  E("S4-LG", "pass", "S4-LG18fr", "GA", "ts:faq.0.a.fr", "L'intégration officielle avec Garmin n'est pas disponible dans FitMesh."),
  E("S4-LG", "pass", "S4-LG19es", "GA", "ts:faq.0.a.es", "La integración directa con Garmin no está disponible en FitMesh."),
  E("S4-LG", "pass", "S4-LG20en", "GA", "ts:faq.0.a.en", "Why doesn't FitMesh connect directly to Garmin? Garmin's API is reserved for approved business partners."),
  E("S4-LG", "pass", "S4-LG21sv", "GA", "overlay:faq.0.a.sv", "FitMesh är inte en officiell partner till Garmin."),
  E("S4-LG", "pass", "S4-LG22da", "GA", "overlay:faq.0.a.da", "FitMesh er ikke en officiel partner til Garmin."),
  E("S4-LG", "pass", "S4-LG23it", "GA", "ts:faq.0.a.it", "Integrazione Garmin: come funziona oggi."),
  E("S4-LG", "pass", "S4-LG24pl", "GA", "ts:faq.0.a.pl", "FitMesh nie jest oficjalnym partnerem Garmin."),
  E("S4-LG", "pass", "S4-LG25en", "GA", "ts:faq.0.a.en", "FitMesh is not certified by Garmin."),
  E("S4-LG", "pass", "S4-LG26de", "GA", "ts:faq.0.a.de", "Eine direkte Garmin-Anbindung bietet FitMesh nicht an."),
  E("S4-PF", "fail", "S4-PF01it", "FB", "ts:faq.0.a.it", "Nella stragrande maggioranza dei casi il colpevole è l'ottimizzazione della batteria."),
  E("S4-PF", "fail", "S4-PF02en", "FB", "ts:faq.0.a.en", "Battery optimization is the most common cause."),
  E("S4-PF", "fail", "S4-PF03en", "FB", "ts:faq.0.a.en", "Permissions are behind the majority of sync failures."),
  E("S4-PF", "fail", "S4-PF04de", "FB", "ts:faq.0.a.de", "Meist ist der Energiesparmodus schuld."),
  E("S4-PF", "fail", "S4-PF05fr", "FB", "ts:faq.0.a.fr", "Dans neuf cas sur dix, c'est l'optimisation de la batterie."),
  E("S4-PF", "fail", "S4-PF06es", "FB", "ts:faq.0.a.es", "Lo más habitual es que falten permisos."),
  E("S4-PF", "fail", "S4-PF07pt", "FB", "ts:faq.0.a.pt", "É comum que o problema seja a otimização de bateria."),
  E("S4-PF", "fail", "S4-PF08nl", "FB", "ts:faq.0.a.nl", "Het probleem zit bijna altijd in de batterijbesparing."),
  E("S4-PF", "fail", "S4-PF09sv", "FB", "overlay:faq.0.a.sv", "Oftast handlar det om batterioptimering."),
  E("S4-PF", "fail", "S4-PF10da", "FB", "overlay:faq.0.a.da", "Problemet skyldes typisk batterioptimering."),
  E("S4-PF", "fail", "S4-PF11pl", "FB", "ts:faq.0.a.pl", "Najczęściej winna jest optymalizacja baterii."),
  E("S4-PF", "fail", "S4-PF12tr", "FB", "ts:faq.0.a.tr", "Sorun çoğunlukla pil tasarrufundan kaynaklanır."),
  E("S4-PF", "fail", "S4-PF13ja", "FB", "ts:faq.0.a.ja", "同期の問題の大半は権限設定によるものです。"),
  E("S4-PF", "fail", "S4-PF14ko", "FB", "ts:faq.0.a.ko", "동기화 문제의 대부분은 권한 설정 때문입니다."),
  E("S4-PF", "fail", "S4-PF15en", "FB", "ts:faq.0.a.en", "Nine out of ten sync problems come from battery settings."),
  E("S4-PF", "fail", "S4-PF16it", "FB", "ts:faq.0.a.it", "Capita di frequente che Android chiuda Fitbit in background."),
  E("S4-PF", "fail", "S4-PF17en", "FB", "ts:faq.0.a.en", "Android regularly kills the Fitbit app in the background, which stops syncing."),
  E("S4-PF", "fail", "S4-PF18en", "FB", "ts:faq.0.a.en", "Permission issues account for roughly 80 percent of cases."),
  E("S4-PG", "fail", "S4-PG01it", "GA", "ts:faq.0.a.it", "FitMesh è un'app certificata Garmin."),
  E("S4-PG", "fail", "S4-PG02en", "GA", "ts:faq.0.a.en", "FitMesh is Garmin's recommended companion app."),
  E("S4-PG", "fail", "S4-PG03en", "GA", "ts:faq.0.a.en", "FitMesh pulls your Garmin activities straight from Garmin Connect."),
  E("S4-PG", "fail", "S4-PG04it", "GA", "ts:faq.0.a.it", "FitMesh importa le attività direttamente da Garmin Connect."),
  E("S4-PG", "fail", "S4-PG05de", "GA", "ts:faq.0.a.de", "FitMesh liest deine Garmin-Daten direkt aus Garmin Connect."),
  E("S4-PG", "fail", "S4-PG06es", "GA", "ts:faq.0.a.es", "FitMesh se sincroniza con Garmin Connect en tiempo real."),
  E("S4-PG", "fail", "S4-PG07fr", "GA", "ts:faq.0.a.fr", "Connectez votre compte Garmin à FitMesh en un clic."),
  E("S4-PG", "fail", "S4-PG08en", "GA", "ts:faq.0.a.en", "Log in with your Garmin account to link it to FitMesh."),
  E("S4-PG", "fail", "S4-PG09it", "GA", "ts:faq.0.a.it", "Accedi con il tuo account Garmin per collegarlo a FitMesh."),
  E("S4-PG", "fail", "S4-PG10en", "GA", "ts:faq.0.a.en", "FitMesh is endorsed by Garmin."),
  E("S4-PG", "fail", "S4-PG11en", "GA", "ts:faq.0.a.en", "Garmin and FitMesh teamed up to bring your data together."),
  E("S4-PG", "fail", "S4-PG12pl", "GA", "ts:faq.0.a.pl", "Bezpośrednia synchronizacja z Garmin pojawi się wkrótce w FitMesh."),
  E("S4-PG", "fail", "S4-PG13sv", "GA", "overlay:faq.0.a.sv", "Direktsynk med Garmin kommer snart till FitMesh."),
  E("S4-PG", "fail", "S4-PG14nl", "GA", "ts:faq.0.a.nl", "FitMesh krijgt binnenkort een directe koppeling met Garmin."),
  E("S4-PG", "fail", "S4-PG15tr", "GA", "ts:faq.0.a.tr", "FitMesh yakında Garmin ile doğrudan senkronize olacak."),
  E("S4-PG", "fail", "S4-PG16ja", "GA", "ts:faq.0.a.ja", "FitMesh は Garmin Connect と直接同期します。"),
  E("S4-PG", "fail", "S4-PG17ko", "GA", "ts:faq.0.a.ko", "FitMesh는 곧 Garmin 계정 연결을 지원합니다."),
  E("S4-PG", "fail", "S4-PG18en", "GA", "ts:faq.0.a.en", "Our Garmin integration launches next month."),
  E("S4-PG", "fail", "S4-PG19en", "GA", "ts:faq.0.a.en", "Garmin sync is on our roadmap for FitMesh."),
  E("S4-PG", "fail", "S4-PG20it", "GA", "ts:faq.0.a.it", "Stiamo lavorando per portare Garmin su FitMesh."),
  E("S4-PG", "fail", "S4-PG21en", "GA", "ts:faq.0.a.en", "FitMesh reads your Garmin data without Health Connect."),
  E("S4-PG", "fail", "S4-PG22en", "GA", "ts:faq.0.a.en", "FitMesh's Garmin connector is live."),
  E("S4-PG", "fail", "S4-PG23fr", "GA", "ts:faq.0.a.fr", "FitMesh fonctionne nativement avec Garmin."),
  E("S4-PG", "fail", "S4-PG24en", "GA", "ts:faq.0.a.en", "Garmin officially recommends FitMesh."),
  E("S4-PG", "fail", "S4-PG25pt", "GA", "ts:faq.0.a.pt", "O FitMesh terá integração direta com a Garmin no próximo ano."),
  E("S4-PG", "fail", "S4-PG26ko", "GA", "ts:faq.0.a.ko", "FitMesh는 Garmin Connect와 직접 동기화됩니다."),
  E("S4-PG", "fail", "S4-PG27da", "GA", "overlay:faq.0.a.da", "FitMesh synkroniserer direkte med Garmin Connect."),
  E("S4-PG", "fail", "S4-PG28it", "GA", "ts:faq.0.a.it", "Presto potrai collegare Garmin a FitMesh senza passare da Health Connect."),
  E("S4-EX", "fail", "S4-EX1", "FB", "ts:faq.0.a.it", "Spesso si blocca più volte al giorno."),
  E("S4-EX", "fail", "S4-EX2", "FB", "ts:faq.0.a.en", "It often stops several times a day."),
  E("S4-EX", "fail", "S4-EX3", "FB", "ts:faq.0.a.it", "Spesso il problema sono i permessi, più volte al giorno."),
  E("SA3", "pass", "SA3-F01", "FB", "ts:faq.0.a.en", "Fitbit syncs often when the app is open."),
  E("SA3", "pass", "SA3-F02", "FB", "ts:faq.0.a.it", "L'app Fitbit si aggiorna spesso se la sincronizzazione continua è attiva."),
  E("SA3", "pass", "SA3-F03", "FB", "ts:faq.0.a.de", "Fitbit synchronisiert meist im Hintergrund, wenn die App läuft."),
  E("SA3", "pass", "SA3-F04", "FB", "ts:faq.0.a.en", "Health Connect is often preinstalled on newer phones."),
  E("SA3", "pass", "SA3-F05", "FB", "ts:faq.0.a.en", "The battery usually lasts about five days."),
  E("SA3", "pass", "SA3-F06", "FB", "ts:faq.0.a.es", "La batería suele durar varios días."),
  E("SA3", "pass", "SA3-F07", "FB", "ts:faq.0.a.en", "Fitbit typically syncs every 15 minutes."),
  E("SA3", "pass", "SA3-F08", "FB", "ts:faq.0.a.en", "Android often limits background apps."),
  E("SA3", "pass", "SA3-F09", "FB", "ts:faq.0.a.pt", "Fitbit sincroniza frequentemente quando o app está aberto."),
  E("SA3", "pass", "SA3-F10", "FB", "ts:faq.0.a.fr", "Le Fitbit se synchronise souvent en arrière-plan."),
  E("SA3", "pass", "SA3-F11", "FB", "overlay:faq.0.a.da", "Fitbit synkroniserer ofte i baggrunden."),
  E("SA3", "pass", "SA3-F12", "FB", "ts:faq.0.a.tr", "Fitbit senkronizasyonu genellikle arka planda yapar."),
  E("SA3", "pass", "SA3-F13", "FB", "ts:faq.0.a.en", "Sync usually happens in the background because Android allows it."),
  E("SA3", "pass", "SA3-F14", "FB", "ts:faq.0.a.en", "Fitbit usually syncs every few minutes, so wait a bit."),
  E("SA3", "pass", "SA3-F15", "FB", "ts:faq.0.a.it", "Il Fitbit di solito si sincronizza ogni 15 minuti in background."),
  E("SA3", "pass", "SA3-F16", "FB", "ts:faq.0.a.it", "Spesso Android limita le app in background per risparmiare batteria."),
  E("SA3", "fail", "SA3-F20", "FB", "ts:faq.0.a.it", "Spesso è colpa delle autorizzazioni."),
  E("SA3", "fail", "SA3-F21", "FB", "ts:faq.0.a.en", "Most of the time it's the permissions."),
  E("SA3", "fail", "SA3-F22", "FB", "ts:faq.0.a.it", "La causa più comune è l'ottimizzazione della batteria."),
  E("SA3", "fail", "SA3-F23", "FB", "ts:faq.0.a.en", "Typically the culprit is Doze mode."),
  E("SA3", "fail", "SA3-F24", "FB", "ts:faq.0.a.de", "Meistens sind die Berechtigungen schuld."),
  E("SA3", "fail", "SA3-F25", "FB", "ts:faq.0.a.it", "Il problema si presenta spesso dopo gli aggiornamenti."),
  E("SA3", "fail", "SA3-F26", "FB", "ts:faq.0.a.en", "Fitbit often fails to sync because of battery saver."),
  E("SA3", "fail", "SA3-F27", "FB", "ts:faq.0.a.en", "Frequently, sync stops after an Android update."),
  E("SA3", "fail", "SA3-F28", "FB", "ts:faq.0.a.fr", "La plupart du temps, c'est une question d'autorisations."),
  E("SA3", "fail", "SA3-F29", "FB", "ts:faq.0.a.pt", "Muitas vezes o erro vem das permissões."),
  E("SA3", "fail", "SA3-F30", "FB", "ts:faq.0.a.en", "Sync problems usually come from battery optimization."),
  E("SA3", "fail", "SA3-F31", "FB", "ts:faq.0.a.it", "I permessi sono spesso disattivati dopo un aggiornamento."),
  E("SA3", "fail", "SA3-F32", "FB", "ts:faq.0.a.it", "Non possiamo dire quanto sia frequente, ma di solito è colpa dei permessi."),
  E("SA3", "fail", "SA3-F33", "FB", "ts:faq.0.a.en", "Of course, most often it is the permissions."),
  E("SA3", "fail", "SA3-F34", "FB", "ts:faq.0.a.it", "Il problema potrebbe essere spesso nei permessi."),
  E("SA3", "pass", "SA3-G01", "GA", "ts:faq.0.a.it", "FitMesh importa i file FIT esportati da Garmin Connect."),
  E("SA3", "pass", "SA3-G02", "GA", "ts:faq.0.a.it", "Puoi esportare i dati da Garmin Connect e importarli in FitMesh."),
  E("SA3", "pass", "SA3-G03", "GA", "ts:faq.0.a.it", "FitMesh non importa direttamente da Garmin Connect."),
  E("SA3", "pass", "SA3-G04", "GA", "ts:faq.0.a.en", "FitMesh doesn't read data straight from Garmin."),
  E("SA3", "pass", "SA3-G05", "GA", "ts:faq.0.a.en", "FitMesh reads your Garmin data directly from Health Connect."),
  E("SA3", "pass", "SA3-G06", "GA", "ts:faq.0.a.en", "We don't offer a direct Garmin sync."),
  E("SA3", "pass", "SA3-G07", "GA", "ts:faq.0.a.de", "Dies ist keine direkte Garmin-Integration."),
  E("SA3", "pass", "SA3-G08", "GA", "ts:faq.0.a.en", "Garmin Connect is not integrated with FitMesh."),
  E("SA3", "pass", "SA3-G09", "GA", "ts:faq.0.a.en", "Direct sync with Garmin is currently not offered by FitMesh."),
  E("SA3", "pass", "SA3-G10", "GA", "ts:faq.0.a.en", "FitMesh is not Garmin's recommended app."),
  E("SA3", "pass", "SA3-G11", "GA", "ts:faq.0.a.en", "Garmin does not endorse FitMesh."),
  E("SA3", "pass", "SA3-G12", "GA", "ts:faq.0.a.it", "FitMesh consiglia di esportare i dati da Garmin in formato FIT."),
  E("SA3", "pass", "SA3-G13", "GA", "ts:faq.0.a.en", "Garmin never recommended FitMesh."),
  E("SA3", "pass", "SA3-G14", "GA", "ts:faq.0.a.en", "Garmin Connect syncs with your watch in real time."),
  E("SA3", "pass", "SA3-G15", "GA", "ts:faq.0.a.en", "FitMesh is available for Garmin users."),
  E("SA3", "pass", "SA3-G16", "GA", "ts:faq.0.a.en", "FitMesh will not support Garmin directly."),
  E("SA3", "pass", "SA3-G17", "GA", "ts:faq.0.a.en", "The Garmin integration is unavailable in FitMesh."),
  E("SA3", "pass", "SA3-G18", "GA", "ts:faq.0.a.tr", "Garmin entegrasyonu FitMesh'te mevcut değil."),
  E("SA3", "pass", "SA3-G19", "GA", "ts:faq.0.a.tr", "FitMesh Garmin'i doğrudan desteklemiyor."),
  E("SA3", "pass", "SA3-G20", "GA", "ts:faq.0.a.it", "Impossibile collegare Garmin direttamente a FitMesh."),
  E("SA3", "pass", "SA3-G21", "GA", "ts:faq.0.a.ja", "FitMesh は Garmin と直接連携していません。"),
  E("SA3", "pass", "SA3-G22", "GA", "ts:faq.0.a.ko", "FitMesh는 Garmin과 직접 연동하지 않습니다."),
  E("SA3", "pass", "SA3-G23", "GA", "ts:faq.0.a.tr", "FitMesh Garmin ile doğrudan entegre değil."),
  E("SA3", "pass", "SA3-G24", "GA", "ts:faq.0.a.en", "FitMesh doesn't yet support Garmin directly."),
  E("SA3", "fail", "SA3-G30", "GA", "ts:faq.0.a.en", "FitMesh syncs your Garmin data in real time."),
  E("SA3", "fail", "SA3-G31", "GA", "ts:faq.0.a.it", "FitMesh si connette a Garmin con un clic."),
  E("SA3", "fail", "SA3-G32", "GA", "ts:faq.0.a.it", "Garmin è supportato da FitMesh."),
  E("SA3", "fail", "SA3-G33", "GA", "ts:faq.0.a.it", "FitMesh recupera le attività da Garmin Connect direttamente."),
  E("SA3", "fail", "SA3-G34", "GA", "ts:faq.0.a.fr", "FitMesh récupère vos activités directement depuis Garmin Connect."),
  E("SA3", "fail", "SA3-G35", "GA", "ts:faq.0.a.pl", "FitMesh pobiera dane z Garmin Connect bezpośrednio."),
  E("SA3", "fail", "SA3-G36", "GA", "ts:faq.0.a.tr", "FitMesh Garmin Connect'ten verileri doğrudan alır."),
  E("SA3", "fail", "SA3-G37", "GA", "ts:faq.0.a.en", "Garmin has certified FitMesh."),
  E("SA3", "fail", "SA3-G38", "GA", "ts:faq.0.a.en", "FitMesh is in collaboration with Garmin."),
  E("SA3", "fail", "SA3-G39", "GA", "ts:faq.0.a.it", "Garmin sarà presto disponibile in FitMesh."),
  E("SA3", "fail", "SA3-G40", "GA", "ts:faq.0.a.en", "We're building the Garmin connector for FitMesh."),
  E("SA3", "fail", "SA3-G41", "GA", "ts:faq.0.a.en", "FitMesh will read your Garmin data natively."),
  E("SA3", "fail", "SA3-G42", "GA", "ts:faq.0.a.en", "Without Health Connect, FitMesh reads Garmin data directly."),
  E("SA3", "fail", "SA3-G43", "GA", "ts:faq.0.a.it", "FitMesh legge i dati Garmin direttamente da Garmin Connect, non via Health Connect."),
  E("SA3", "fail", "SA3-G44", "GA", "ts:faq.0.a.en", "FitMesh is an official Garmin partner, not a third-party tool."),
  E("SA3", "fail", "SA3-G45", "GA", "ts:faq.0.a.es", "FitMesh no ofrece integración directa con Garmin, pero lo estamos preparando."),
  E("SA3", "fail", "SA3-G46", "GA", "ts:faq.0.a.en", "FitMesh offers direct Garmin sync. This is not available on iOS."),
  E("SA3", "fail", "SA3-G47", "GA", "ts:faq.0.a.tr", "FitMesh Garmin'i doğrudan destekler."),
  E("SA3", "pass", "SA3-G48", "GA", "ts:faq.0.a.en", "Without an official partnership, FitMesh cannot offer a direct Garmin sync."),
  E("SA3", "pass", "SA3-G49", "GA", "ts:faq.0.a.fr", "Sans accord avec Garmin, FitMesh ne peut pas utiliser l'API officielle."),
  E("SA3", "pass", "SA3-G50", "GA", "ts:faq.0.a.de", "Ohne Vereinbarung mit Garmin kann FitMesh die offizielle API nicht nutzen."),
  E("SA3", "fail", "SA3-G51", "GA", "ts:faq.0.a.en", "FitMesh connects to Garmin without any export, officially."),
];

// LIMITI-NOTI: frasi del revisore che la guardia classifica nel verso SBAGLIATO o non vede. Non sono nel corpus
// pass/fail. `observed` e' l'esito reale della guardia (il test lo verifica: se un limite sparisce, va promosso
// nel corpus). Nessuna frase legittima e' qui con observed «rosso»: i falsi positivi non sono accettati.
type KnownLimit = { id: string; post: "FB" | "GA"; path: string; text: string; observed: "verde" | "rosso"; truth: "legittima" | "promessa"; why: string };
const LIMITI_NOTI: KnownLimit[] = [
  { id: "LIM-F1", post: "FB", path: "ts:faq.0.a.en", text: "It often happens because of the update.", observed: "verde", truth: "promessa",
    why: "«happens because» senza un nome di causa noto nel lessico di contesto non e' visto (la causa non e' nominata)." },
  { id: "LIM-F2", post: "FB", path: "ts:faq.0.a.it", text: "Non è raro che il problema siano i permessi.", observed: "verde", truth: "promessa",
    why: "litote («non e' raro»): la negazione di un contrario non e' un marcatore di frequenza." },
  { id: "LIM-F3", post: "FB", path: "ts:faq.0.a.en", text: "Permissions are the usual suspect.", observed: "verde", truth: "promessa",
    why: "«usual suspect» e' un idioma di frequenza senza avverbio ne' superlativo di causa." },
  { id: "LIM-F4", post: "FB", path: "ts:faq.0.a.it", text: "Su dieci casi, nove dipendono dai permessi.", observed: "verde", truth: "promessa",
    why: "rapporto costruito in forma «su N casi, M ...»: solo «N su dieci» e le forme equivalenti sono coperte." },
  { id: "LIM-F5", post: "FB", path: "ts:faq.0.a.it", text: "Il problema si ripresenta ogni giorno.", observed: "verde", truth: "promessa",
    why: "frequenza temporale («ogni giorno») non e' un marcatore: sarebbe indistinguibile dallo scheduling lecito." },
  { id: "LIM-G1", post: "GA", path: "ts:faq.0.a.it", text: "FitMesh dialoga con Garmin Connect.", observed: "verde", truth: "promessa",
    why: "verbo («dialoga») fuori lessico di integrazione/lettura; senza «diretto/ufficiale» la frase e' vaga." },
  { id: "LIM-G2", post: "GA", path: "ts:faq.0.a.en", text: "Garmin data flows directly into FitMesh.", observed: "verde", truth: "promessa",
    why: "FitMesh non e' il soggetto e non c'e' un verbo di lettura/integrazione: il flusso e' espresso con «flows into»." },
  { id: "LIM-G3", post: "GA", path: "ts:faq.0.a.it", text: "Lo supporta ufficialmente.", observed: "verde", truth: "promessa",
    why: "frase con solo pronome, senza «Garmin» ne' «FitMesh»: l'oggetto e' nella frase precedente (limite dichiarato da V2)." },

];

describe("CORPUS S4 (CONTROLLO-S4, giro 2): ogni frase del revisore e' un test nominato; LIMITI-NOTI dichiarati", () => {
  const cellsBy: Record<"FB" | "GA", Map<string, string>> = {
    FB: new Map(collectCells(FB_SLUG).map((c) => [c.path, c.text])),
    GA: new Map(collectCells(GA_SLUG).map((c) => [c.path, c.text])),
  };
  const verdict = (post: "FB" | "GA", path: string, text: string): string[] =>
    post === "FB" ? fitbitCellVerdict(path, nz(text)) : garminCellVerdict(path, nz(text));
  const build = (e: { post: "FB" | "GA"; path: string; text: string; mode?: CorpusEntry["mode"]; from?: string }): string => {
    const original = cellsBy[e.post].get(e.path);
    expect(original, `cella ${e.path}`).toBeDefined();
    expect(verdict(e.post, e.path, original!), `cella originale ${e.path}`).toEqual([]);
    if (e.mode === "set") return e.text;
    return `${e.text} ${original}`;
  };

  it("copertura: 94 frasi della matrice del revisore + 3 sonde, ciascuna nel corpus o in LIMITI-NOTI, con id unici", () => {
    const ids = [...CORPUS_S4.map((e) => e.id), ...LIMITI_NOTI.map((e) => e.id)];
    expect(ids.length).toBe(CORPUS_S4.length + LIMITI_NOTI.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set([...ids, ...CORPUS.map((e) => e.id)]).size).toBe(ids.length + CORPUS.length);
    expect(CORPUS_S4.filter((e) => e.src.startsWith("S4-")).length + LIMITI_NOTI.filter((e) => e.id.startsWith("S4-")).length).toBe(97);
    for (const l of LIMITI_NOTI) expect(l.why.length, l.id).toBeGreaterThan(10);
    // nessun falso positivo accettato: un limite «rosso» non puo' essere una frase legittima
    for (const l of LIMITI_NOTI) expect(l.observed === "rosso" && l.truth === "legittima", l.id).toBe(false);
  });

  it.each(CORPUS_S4.map((e) => [`${e.expect === "pass" ? "DEVE-PASSARE" : "DEVE-FALLIRE"} ${e.src} ${e.id} ${e.path}`, e] as const))(
    "%s",
    (_name, e) => {
      const problems = verdict(e.post, e.path, build(e));
      if (e.expect === "pass") expect(problems, e.id).toEqual([]);
      else expect(problems.length, `${e.id} deve essere rosso`).toBeGreaterThan(0);
    },
  );

  it.each(LIMITI_NOTI.map((e) => [`LIMITE-NOTO ${e.id} (${e.truth}, guardia ${e.observed})`, e] as const))("%s", (_n, e) => {
    const problems = verdict(e.post, e.path, build(e));
    expect(problems.length > 0 ? "rosso" : "verde", `${e.id}: ${e.why}`).toBe(e.observed);
  });
});
