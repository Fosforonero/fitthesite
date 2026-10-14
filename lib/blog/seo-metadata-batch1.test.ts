import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { blogSeoTitle, tl } from "@/lib/blog/types";
import { applyNordicOverlay } from "@/lib/blog/nordic-overlay";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";

// Regex condivise (T3): le frequenze e i tempi coprono tutte le 13 lingue, non solo IT/EN/ES/DE/NL.
const PCT_CLAIM = /\d+\s*(?:%|percent|per\s*cento|por\s*(?:ciento|cento)|pour\s*cent|Prozent|procent|퍼센트|パーセント)|%\s*\d+|yüzde\s*\d+/i;
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
const norm = (s: string): string => s.normalize("NFKC");

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
const CONTENT_LANGS = new Set(["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"]);
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
// SEGUITO S2 (CS2-1..CS2-4), RIPROGETTATO nel giro 2 (SA-GUARDIE-V2): le due guardie riconoscono una
// AFFERMAZIONE nel suo contesto di FRASE, non una parola in blocco.
//  - Fitbit: una espressione di frequenza/proporzione NELLA STESSA FRASE di un contesto di problema/causa/
//    sincronizzazione/permesso, in una frase dichiarativa (non domanda, non posizione di un menu, non modo).
//  - Garmin: una frase POSITIVA (nessuna negazione prima/attorno al predicato) in cui un predicato di
//    integrazione/collegamento/ufficialita'/partnership/supporto DIRETTO ha per oggetto Garmin, e il soggetto non
//    e' un terzo; anche le previsioni di tale integrazione.
//  - Beneficio in testa a body.15.items[2]: una frase positiva che affermi beneficio da integrazione/automazione.
// LIMITI NOTI (sono euristiche di testo, non semantica; non vengono nascosti):
//  - lessici scritti da un agente non madrelingua; copertura ragionevole, non completa, per lingua;
//  - una promessa senza «Garmin» nella frase e senza predicato forte nella stessa frase (es. «E' prevista.»
//    riferita a una frase precedente) non e' vista; idem un oggetto nominato solo con un pronome;
//  - la segmentazione spezza anche su abbreviazioni/decimali e su «;»: una frase divisa a meta' perde il contesto;
//  - la negazione e' cercata nella clausola (finestra di 7 parole prima del predicato; tutta la clausola per
//    ja/ko/tr): «senza», «without» NON sono negazioni del predicato, «no» davanti a un sostantivo lo e' (falso
//    negativo possibile: «with no manual export» davanti al predicato nella stessa clausola);
//  - le domande retoriche in forma interrogativa passano (voluto dal mandato), anche se promettono;
//  - «compatibile con Garmin» e' trattato come supporto; la citazione di una terza parte e' una lista, non un NER;
//  - non catturati (verificati con sonde, vedi SA-GUARDIE-V2): «Permissions are the usual suspect.», «Su dieci casi,
//    nove dipendono dai permessi.», «Il problema si ripresenta ogni giorno.», «FitMesh dialoga con Garmin Connect.»
//    (verbo non in lessico), «FitMesh funziona con Garmin.» (vago: lasciato ammesso di proposito), frasi senza
//    «Garmin» e senza «FitMesh»/predicato forte, promesse espresse con pronomi («Lo supporta.»);
//  - lessici di frequenza: nessuna garanzia su sinonimi non elencati, ne' su costruzioni analitiche («one in
//    two cases», «nel 90% dei casi» e' preso dal test PCT_CLAIM, non da qui).
// Nessun contenuto e' modificato da questo blocco: se la guardia segnalasse contenuto corrente sarebbe un FINDING.
// ---------------------------------------------------------------------------------------------

const nz = (s: string): string => norm(s).replace(/[‘’]/g, "'");
const LB = "(?<![\\p{L}\\p{N}])";
const RB = "(?![\\p{L}\\p{N}])";
const stemRe = (list: string[]): RegExp =>
  new RegExp(`${LB}(?:${list.map((w) => w.replace(/ /g, "\\s+")).join("|")})\\p{L}*`, "iu");

// Segmenta in frasi: . ! ? ; newline e, per ja/ko, 。！？. La punteggiatura finale resta nella frase (domande).
function segmentSentences(t: string): string[] {
  const out: string[] = [];
  for (const line of t.split(/\n+/)) {
    // «.», «!», «?», «;» seguiti da spazio (un punto dentro «Intervals.icu» o «1.5» non separa); «。！？» sempre
    for (const s of line.split(/(?<=[.!?;])\s+|(?<=[。！？])/u)) if (s.trim().length > 0) out.push(s.trim());
  }
  return out;
}
const isQuestion = (s: string): boolean => /[?？]\s*$/.test(s);

// ---- G2: frequenza di occorrenza (Fitbit) ----
// Marcatori: avverbi e locuzioni di frequenza/proporzione. Da soli NON bastano: serve un contesto di problema.
const FREQ_LATIN_WORDS = [
  // it
  "spesso", "spessissimo", "sovente", "di frequente", "frequentemente", "di solito", "solitamente", "generalmente",
  "in genere", "di norma", "normalmente", "per lo più", "perlopiù", "nella maggior parte dei casi",
  "la maggior parte delle volte", "molte volte", "tante volte", "di consueto", "abitualmente", "comunemente",
  "tipicamente", "di regola", "in molti casi", "in tanti casi", "il più delle volte", "la più parte delle volte",
  "quasi sempre", "nove volte su dieci", "molto spesso",
  // en
  "often", "oftentimes", "frequently", "commonly", "usually", "typically", "generally", "normally", "most of the time",
  "in most cases", "more often than not", "tends? to", "as a rule", "habitually", "in many cases", "in a lot of cases",
  "nine times out of ten", "almost always", "many times", "much of the time", "in the majority of cases",
  // es
  "a menudo", "con frecuencia", "frecuentemente", "por lo general", "habitualmente", "muchas veces",
  "la mayoría de las veces", "en la mayoría de los casos", "suele", "suelen", "típicamente", "comúnmente", "usualmente",
  "en muchos casos", "casi siempre", "nueve de cada diez veces",
  // fr
  "souvent", "fréquemment", "en général", "habituellement", "d'habitude", "la plupart du temps",
  "dans la plupart des cas", "couramment", "typiquement", "d'ordinaire", "le plus souvent", "bien souvent",
  "dans de nombreux cas", "dans bien des cas", "presque toujours", "neuf fois sur dix",
  // de
  "oft", "öfter", "oftmals", "meist", "meistens", "in den meisten Fällen", "normalerweise", "in der Regel",
  "üblicherweise", "gewöhnlich", "typischerweise", "generell", "im Regelfall", "häufig", "haeufig",
  "in vielen Fällen", "fast immer", "neun von zehn Mal", "größtenteils", "meistenteils",
  // pt
  "muitas vezes", "geralmente", "com frequência", "na maioria das vezes", "na maioria dos casos", "costuma",
  "costumam", "usualmente", "comumente", "em muitos casos", "quase sempre", "frequentemente", "habitualmente",
  // pl
  "zwykle", "zazwyczaj", "na ogół", "przeważnie", "zwyczajowo", "bywa", "w większości przypadków", "nierzadko",
  "typowo", "często", "w wielu przypadkach", "prawie zawsze", "najczęściej",
  // tr
  "sık sık", "sıklıkla", "sıkça", "sık", "genellikle", "genelde", "çoğunlukla", "çoğu zaman", "çoğu durumda",
  "normalde", "tipik olarak", "çoğu kez", "birçok durumda", "neredeyse her zaman", "en sık",
  // nl
  "meestal", "doorgaans", "gewoonlijk", "veelal", "dikwijls", "in de meeste gevallen", "normaal gesproken",
  "meestentijds", "vaker", "in de regel", "vaak", "in veel gevallen", "bijna altijd", "negen van de tien keer",
  // sv / da / no / fi
  "ofta", "oftast", "vanligtvis", "generellt", "normalt", "brukar", "för det mesta", "i de flesta fall", "typiskt",
  "som regel", "ofte", "oftest", "plejer", "for det meste", "i de fleste tilfælde", "typisk", "sædvanligvis",
  "pleier", "vanligvis", "i de fleste tilfeller", "usein", "yleensä", "tavallisesti", "useimmiten", "monesti",
  "i många fall", "nästan alltid", "næsten altid", "i mange tilfælde", "nesten alltid", "melkein aina",
];
const FREQ_CJK_WORDS = [
  "よく", "頻繁", "しばしば", "たいてい", "大抵", "多くの場合", "ほとんどの場合", "通常は", "一般的に", "普通は",
  "ことが多", "がちです", "ほぼ常に", "十中八九", "자주", "종종", "흔히", "보통", "대개", "주로", "대부분의 경우",
  "일반적으로", "빈번", "경우가 많", "때가 많", "거의 항상",
];
// Proporzione di problemi/casi («la maggior parte dei problemi», «most sync failures»): non «la maggior parte
// delle persone/guide», che non dice quanto spesso accade l'evento.
const FREQ_PROPORTION =
  `${LB}(?:la\\s+maggior\\s+parte|la\\s+mayor[ií]a|la\\s+plupart|die\\s+meisten|a\\s+maioria|większość|çoğu|de\\s+meeste|de\\s+flesta|de\\s+fleste|most|the\\s+majority)\\s+(?:(?:dei|delle|degli|di|of|de|des|der|von|las|los|les|the|d')\\s*){0,2}(?:problem|issue|failure|error|cases?\\b|casi\\b|caso\\b|errori|errores|erreurs|fehler|fälle|casos|przypadk|sorun|durum|fout|gevallen|tilfælde|fall\\b|sync\\s+(?:problem|issue|failure))`;
// Marcatore lessicale (invariato nella forma, esteso): NON e' di per se' una violazione.
const FREQUENCY_OCCURRENCE = new RegExp(
  `${LB}(?:${FREQ_LATIN_WORDS.map((w) => w.replace(/ /g, "\\s+")).join("|")})${RB}|${FREQ_PROPORTION}|${FREQ_CJK_WORDS.join("|")}`,
  "iu",
);
// Contesto: problema, causa, sincronizzazione, permesso (per lingua, per RADICE; sinonimi non elencati sfuggono).
const FREQ_CONTEXT_STEMS = [
  // it
  "problem", "caus", "errore", "error", "permess", "autorizz", "sincroniz", "non si sincron", "non funzion", "fallisc",
  "blocc", "ritard", "batteria", "perch", "dipend", "dovut",
  // en
  "issue", "fail", "permission", "sync", "delay", "stuck", "missing", "battery", "because", "due to", "reason", "why",
  "happens", "occurs", "responsible", "culprit", "breaks?", "stops?",
  // es
  "causa", "fall[ao]", "permiso", "sincroniz", "retras", "bloque", "batería", "porque", "debido", "motivo",
  // fr
  "problème", "erreur", "échec", "échou", "autorisation", "synchronis", "retard", "bloqu", "batterie", "parce que",
  "en raison", "à cause", "vient", "provient",
  // de
  "Problem", "Ursache", "Fehler", "fehl", "Berechtigung", "synchronisier", "Verzögerung", "blockier", "Akku", "weil",
  "liegt", "wegen", "daran", "Grund",
  // pt
  "erro", "falh", "permiss", "atraso", "bateria", "devido", "motivo", "acontece",
  // pl
  "przyczyn", "błąd", "błęd", "uprawnie", "synchroniz", "opóźni", "blokuj", "bateri", "ponieważ", "powodu",
  // tr
  "sorun", "neden", "hata", "izin", "senkroniz", "gecik", "pil\\b", "çünkü", "kaynaklan",
  // nl
  "probleem", "oorzaak", "fout", "machtiging", "toestemming", "synchronis", "vertraging", "batterij", "omdat",
  "doordat", "gebeurt",
  // sv / da / no / fi
  "orsak", "fel\\b", "behörighet", "synkronis", "fördröj", "batteri", "eftersom", "beror", "på grund", "årsag",
  "fejl", "tilladelse", "forsink", "fordi", "skyldes", "tillatelse", "feil", "ongelma", "syy", "virhe", "oikeu",
  "synkronoi", "akku", "akun", "koska",
];
const FREQ_CONTEXT_CJK = [
  "問題", "原因", "エラー", "失敗", "権限", "許可", "同期", "遅延", "バッテリー", "ため", "起こ",
  "문제", "원인", "오류", "실패", "권한", "동기화", "지연", "배터리", "때문", "발생",
];
const FREQ_CONTEXT = new RegExp(
  `${LB}(?:${FREQ_CONTEXT_STEMS.map((w) => w.replace(/ /g, "\\s+")).join("|")})|${FREQ_CONTEXT_CJK.join("|")}`,
  "iu",
);
// Usi NON frequenziali (mandato G2): il marcatore dentro questi idiomi e' rimosso prima del controllo.
const FREQ_NEUTRAL_IDIOMS: RegExp[] = [
  // interrogativi: «How often...», «Wie oft...», «Quanto spesso...» (frase indiretta compresa)
  /(?:how\s+often|how\s+frequently|wie\s+oft|wie\s+häufig|quanto\s+spesso|con\s+quale\s+frequenza|con\s+che\s+frequenza|con\s+qu[eé]\s+frecuencia|cada\s+cu[aá]nto|à\s+quelle\s+fréquence|combien\s+de\s+fois|com\s+que\s+frequência|jak\s+często|ne\s+sıklıkla|ne\s+sıklıkta|hoe\s+vaak|hur\s+ofta|hvor\s+ofte|kuinka\s+usein|どのくらいの頻度|どれくらいの頻度|どのくらい頻繁|얼마나\s+자주)/giu,
  // «domande frequenti» e simili (FAQ standard)
  /(?:sık\s+sorulan(?:\s+sorular)?|sıkça\s+sorulan(?:\s+sorular)?|よくある(?:ご)?質問|자주\s+묻는\s+질문|häufig\s+gestellte\s+fragen|oft\s+gestellte\s+fragen|foire\s+aux\s+questions|preguntas\s+frecuentes|domande\s+frequenti|frequently\s+asked\s+questions|perguntas\s+frequentes|często\s+zadawane\s+pytania|veelgestelde\s+vragen|vanliga\s+frågor|ofte\s+stillede\s+spørgsmål|ofte\s+stilte\s+spørsmål|usein\s+kysytyt\s+kysymykset)/giu,
  // modo/stato «normale» (non frequenza)
  /(?:normalt\s+läge|normalt\s+tilstand|normal(?:e|t)?\s+(?:mode|modus|modo|tilstand|läge)|normalmodus|normaal\s+modus|tryb\s+normalny|normal\s+mod|보통\s+(?:모드|상태|설정)|通常(?:は)?モード|通常の(?:モード|状態))/giu,
  // «controlla bene», «leggi con attenzione»
  /よく(?=確認|読|見|チェック|調べ|考え|理解|注意|聞)/gu,
  // scheduling: «più volte al giorno», «several times a day»
  /(?:\p{L}+\s+){0,2}(?:volte|times|veces|fois|vezes|mal|razy|kez|keer|gånger|gange)\s+(?:al|a|ao|per|par|pro|por|am|na|w|om|i|på|per)\s+(?:giorno|day|día|dia|jour|tag|dzień|dag|dygn|gün)/giu,
  /(?:毎日|1日に?\s*\d+回|하루\s*\d+번|매일)/gu,
];
// Posizione di un menu/impostazione: «di solito si trova nelle Impostazioni», «findest du normalerweise in den
// Einstellungen». La frase dice DOVE, non quanto spesso accade un problema.
const FREQ_LOCATION = new RegExp(
  `${LB}(?:si\\s+trova|si\\s+trovano|trovi|trovate|puoi\\s+trovare|is\\s+(?:found|located|listed)|are\\s+(?:found|located|listed)|you\\s+(?:can\\s+)?find|findest|befindet\\s+sich|befinden\\s+sich|se\\s+encuentra|se\\s+encuentran|encuentras|se\\s+trouve|se\\s+trouvent|tu\\s+trouves|encontra|encontras|znajdziesz|znajduje|bulunur|bulabilirsin|vind\\s+je|te\\s+vinden|finns|hittar\\s+du|finder\\s+du|findes|ligger)${RB}|${LB}(?:in|under|nelle|nei|nella|in\\s+den|in\\s+der|dans\\s+les|dans\\s+le|en|em|w|içinde|onder|i|på|under)\\s+(?:the\\s+|le\\s+|las\\s+|los\\s+|den\\s+)?(?:Settings|Impostazioni|Einstellungen|Paramètres|Ajustes|Configuraciones|Configurações|Ustawieniach|Ayarlar|Instellingen|Inställningar|Indstillinger|Innstillinger)|(?:設定|설정)(?:画面)?(?:に|で|には|에서|에)`,
  "iu",
);

// Problemi per cella (vuoto = nessuna espressione di frequenza del problema).
function fitbitFrequencyProblems(text: string): string[] {
  const out: string[] = [];
  for (const raw of segmentSentences(nz(text))) {
    if (isQuestion(raw)) continue; // domanda: non afferma
    let s = raw;
    for (const idiom of FREQ_NEUTRAL_IDIOMS) s = s.replace(idiom, " ");
    if (!FREQUENCY_OCCURRENCE.test(s)) continue;
    if (FREQ_LOCATION.test(s)) continue;
    if (!FREQ_CONTEXT.test(s)) continue;
    out.push(`frequenza del problema: ${raw.slice(0, 80)}`);
  }
  return out;
}

// Etichette di sezione (titolo H2 «insidie comuni»), non stime di frequenza. Ammesse SOLO con il testo esatto,
// per cella: sono le 3 gia' presenti e documentate (nessuna nuova).
const SECTION_LABELS_EXTENDED: Record<string, string> = {
  "ts:body.6.text.ja": "よくある落とし穴",
  "ts:body.6.text.tr": "Sık yapılan hatalar",
  "ts:body.6.text.ko": "사람들이 자주 걸리는 함정",
};

// ---- G1: promessa Garmin (frase positiva, predicato di integrazione/ufficialita'/supporto DIRETTO su Garmin) ----
// Predicati. Radici con confine di parola a sinistra (nessun «imprevisto» -> «previst»), suffisso libero.
const GA_PRED_INTEGRATION = stemRe([
  // it/en/es/pt/fr/de/pl/tr/nl/sv/da/no/fi: integrazione e collegamento (verbi e nomi)
  "integr(?!al|it)", "intégr(?!al|it)", "integrier", "zintegr", "entegr", "geïntegr", "ïntegr", "integroi", "geintegr",
  "collega", "collegat", "collegament", "connett", "conness", "connects", "connected", "connecting", "connection",
  "connecter", "connecte", "connectée", "connecté", "connectent", "conecta", "conectad", "conexi", "conexão", "vincula", "enlaza", "ligad", "relie", "relié", "lié", "liaison",
  "verbind", "verknüpf", "anbindung", "angebunden", "anknüpf", "łączy", "połącz", "bağlan", "bağlı", "bağlantı",
  "verbonden", "koppel", "gekoppeld", "koppling", "kopplad", "kopplar", "ansluter", "ansluten", "anslutning",
  "forbinder", "forbundet", "tilslut", "kobler", "koblet", "yhdistä", "yhdistet",
]);
const GA_PRED_INTEGRATION_CONNECT_TO = /(?<![\p{L}\p{N}])connect\s+(?:to|with)\b/iu;
const GA_PRED_INTEGRATION_CJK = /統合|連携|接続|つなが|繋が|統合|통합|연동|연결/u;
// Supporto: SOLO forme verbali/aggettivali (il sostantivo «supporto Garmin» e' anche l'assistenza di Garmin)
const GA_PRED_SUPPORT = stemRe([
  "supporta", "supports", "supported", "supporting", "soporta", "unterstützt", "unterstützen", "prend en charge",
  "prennent en charge", "supporte", "suporta", "obsługuje", "wspiera", "destekler", "destekliyor", "ondersteunt",
  "stöder", "støtter", "understøtter", "compatib", "kompatib", "kompatyb", "uyumlu", "tukee", "kompatibel",
]);
const GA_PRED_SUPPORT_CJK = /対応|サポート|지원/u;
const GA_PRED_PARTNER = stemRe([
  "partner", "partenar", "socio", "socia", "socios", "socias", "ortak", "partnerschaft", "partnerskap", "kumppan",
  "accordo", "agreement", "acuerdo", "accord", "vereinbarung", "abkommen", "overeenkomst", "avtal", "aftale", "anlaşma", "umowa",
  "collaborazion", "collaboration", "colaboraci", "zusammenarbeit", "kooperation", "cooperation",
]);
const GA_PRED_PARTNER_CJK = /パートナー|파트너|提携|제휴/u;
// Stato: certificato/approvato DA Garmin / «Garmin-approved»
const GA_PRED_STATUS = new RegExp(
  `${LB}(?:certific\\p{L}*|zertifiz\\p{L}*|certifi\\p{L}*|(?:approved|authori[sz]ed|autorizzat\\p{L}*|approvat\\p{L}*|aprovad\\p{L}*|aprobad\\p{L}*|godkänd|godkendt|genehmigt|zatwierdzon\\p{L}*|goedgekeurd)\\s+(?:by|da|von|por|par|av|af|door|przez))`,
  "iu",
);
// Stato con FitMesh come oggetto: «Garmin ha approvato FitMesh», «FitMesh e' approvata»
const GA_PRED_STATUS_LOOSE = stemRe(["approv", "aprob", "aprov", "genehmig", "godkän", "godkend", "zatwierdz", "goedgekeurd", "authori[sz]", "autorizz"]);
// «funziona/works with» + diretto/ufficiale; sostantivo «supporto» con FitMesh soggetto
const GA_PRED_WORKS = new RegExp(
  `${LB}(?:funziona|funzionano|works?|funktioniert|funktionieren|fonctionne|fonctionnent|funciona|funcionan|działa|werkt|fungerar|fungerer|toimii)(?:\\s+\\p{L}+)?\\s+(?:con|with|mit|avec|z|met|med|com|ile)${RB}|ile\\s+çalışır`,
  "iu",
);
const GA_PRED_SUPPORT_NOUN = stemRe(["support", "supporto", "soporte", "unterstützung", "stöd", "støtte", "destek", "ondersteuning", "wsparcie", "suporte"]);
const GA_PRED_WILL_SUPPORT = /(?<![\p{L}\p{N}])(?:will|to|can|could|would|may)(?:\s+(?:soon|also|now|natively|officially))?\s+support(?![\p{L}])/iu;
const GA_PRED_STATUS_CJK = /公認|認定|인증/u;
// Uso dell'API: «usa/uses ... API» e «tramite/through ... API» (anche posposto in ja/ko/tr). Il tratto fra verbo
// e API non attraversa virgole/due punti e non contiene un'altra preposizione di mezzo: «via HC e non via l'API»
// ha DUE predicati, il secondo e' negato.
const GA_VIA =
  "tramite|attraverso|mediante|via|through|über|à\\s+travers|a\\s+través\\s+de|przez|aracılığıyla|genom|gennem|ved\\s+hjælp\\s+af|pela|pelo";
const GA_USE =
  "usa|usano|usiamo|utilizza|utilizziamo|uses?|using|utilis[ea]\\p{L}*|nutzt|nutzen|verwendet|verwenden|utiliza|usan|używa|kullanır|kullanıyor|gebruikt|använder|bruger|accede|accesses|greift|bedient|chiama|calls";
const GA_GAP = `(?:(?!${LB}(?:${GA_VIA}|${GA_USE})${RB})[^.。;,:，、]){0,60}?`;
const GA_PRED_API = new RegExp(
  `${LB}(?:${GA_USE}|${GA_VIA})${RB}${GA_GAP}\\bAPI\\b` +
    `|\\bAPI\\b[^.。;]{0,24}(?:を使用|を利用|を通じ|を介|를\\s*통|을\\s*통|를\\s*사용|을\\s*사용|üzerinden|kullan)`,
  "iu",
);
const GA_SYNC = stemRe(["sincronizz", "sincroniz", "sync", "synchron", "synkron", "senkron", "synchroniz", "synchronis"]);
const GA_SYNC_CJK = /同期|동기화/u;
const GA_OFFICIAL = /(?<![\p{L}\p{N}])(?:ufficial|official|oficial|offiziell|officiel|officiell|officiël|officieel|resmi|resmen|oficjaln)\p{L}*|公式|公認|공식/iu;
const GA_DIRECT = /(?<![\p{L}\p{N}])(?:dirett|direct|direkt|nativ|native)\p{L}*|直接|直結|ネイティブ|직접|네이티브/iu;
// Sincronizzazione ufficiale/diretta: sync e ufficiale/diretto ADIACENTI (max 2 parole in mezzo, entrambi gli ordini)
const GA_SYNC_OFFICIAL = new RegExp(
  `(?:${GA_SYNC.source})(?:\\s+\\p{L}+){0,2}?\\s+(?:${GA_OFFICIAL.source}|${GA_DIRECT.source})` +
    `|(?:${GA_OFFICIAL.source}|${GA_DIRECT.source})(?:\\s+\\p{L}+){0,2}?\\s+(?:${GA_SYNC.source})` +
    `|(?:公式|公認|공식|直接|직접)[^。、,]{0,6}(?:同期|동기화)|(?:同期|동기화)[^。、,]{0,6}(?:公式|공식|直接|직접)`,
  "iu",
);
const GA_FUTURE = new RegExp(
  `${LB}(?:previst\\p{L}*|prévu\\p{L}*|vorgesehen|in\\s+futuro|nel\\s+futuro|a\\s+futuro|in\\s+the\\s+future|in\\s+future|dans\\s+le\\s+futur|à\\s+l'avenir|ileride|in\\s+Zukunft|zukünftig|künftig|en\\s+el\\s+futuro|en\\s+futuro|no\\s+futuro|futuramente|w\\s+przyszłości|przyszł\\p{L}*|gelecekte|gelecek|in\\s+de\\s+toekomst|toekomst|today\\s+not|stiamo\\s+lavorando|we\\s+are\\s+working|we're\\s+working|work\\s+in\\s+progress|will\\s+(?:be|soon|support|integrate|connect|work)|sarà|sara'|saranno|arriverà|verrà|coming\\s+soon|coming|upcoming|soon|roadmap|planned|planerad\\p{L}*|planlagt|geplant|planlanıyor|kommer\\s+att|kommer\\s+snart|kommer\\s+i\\s+(?:framtiden|fremtiden)|kommt\\s+bald|en\\s+préparation|bientôt|prochainement|in\\s+arrivo|prossimamente|llegará|será|próximamente|em\\s+breve|wkrótce|yakında|binnenkort|pian)${RB}|将来|今後|予定|향후|앞으로|예정`,
  "iu",
);
const GA_NEGATION_WORDS = new RegExp(
  `${LB}(?:non|né|nessun\\p{L}*|mai|niente|not|no|never|neither|nor|cannot|nunca|ni|tampoco|ne|pas|jamais|aucun\\p{L}*|nicht|kein\\p{L}*|nie|weder|não|nem|nenhum\\p{L}*|żaden|nigdy|niet|geen|nooit|inte|ingen|inget|aldrig|ej|ikke|intet|ei|eivät|emme|ole)${RB}|${LB}n'(?=\\p{L})|\\p{L}+n't`,
  "iu",
);
const GA_NEGATION_CJK = /ない|ません|ではなく|ではありません|いません|아니|않|없|못|안\s/u;
const GA_NEGATION_TR = /(?<![\p{L}\p{N}])(?:değil\p{L}*|yok)(?![\p{L}\p{N}])/iu;
const GA_CJK_CHARS = /[぀-ヿ㐀-鿿가-힯]/u;
const GA_CLAUSE_BOUND = /[,，、:：]|\s(?:ma|but|however|though|mais|aber|doch|pero|mas|ale|ancak|maar|men|sondern|però|invece|whereas|while|tuttavia)\s|が、|けど|けれど|지만/giu;
const GA_THIRD_PARTY =
  /(?<![\p{L}\p{N}])(?:Strava|Training\s?Peaks|Final\s?Surge|Tapiriik|GarminDB|Intervals|Runalyze|Apple|Google|Samsung|Fitbit|Polar|Suunto|Coros|Wahoo|Zwift|MyFitnessPal|Komoot|Runkeeper|Oura|Whoop|Withings|Health\s?Connect|HealthKit|Salute)/iu;
const GA_FIRST_PERSON =
  /(?<![\p{L}\p{N}])FitMesh|(?<![\p{L}\p{N}])(?:noi|siamo|abbiamo|nostr\p{L}*|we're|our|wir|unser\p{L}*|nous|notre|nosotros|somos|nuestr\p{L}*|nós|nosso\p{L}*|nasz\p{L}*|jesteśmy|biz|bizim|wij|onze|vår\p{L}*|vores)(?![\p{L}\p{N}])|(?<![\p{L}\p{N}])we\s+(?:are|were|have|work|support|integrate|connect|offer|do|did|will|can|use|read|sync|plan|partner)(?![\p{L}])|私たち|当社|弊社|우리|저희/iu;
// FitMesh legge attraverso Health Connect: «FitMesh collega Garmin tramite Health Connect» non e' integrazione diretta
const GA_MEDIATED =
  /(?:tramite|attraverso|mediante|via|through|über|à\s+travers|a\s+través\s+de|przez|aracılığıyla|genom|gennem|pela|pelo|経由|を通じて|を介して|통해)\s+(?:il\s+|la\s+|the\s+|le\s+|el\s+|den\s+|das\s+|dem\s+|l')?(?:pass-through\s+|relais\s+)?(?:Health[ -]Connect|HC)/iu;
// Benefici di integrazione/automazione (G3), per lingua. Radici; confine di parola a sinistra.
const GA_BENEFIT = new RegExp(
  `${LB}(?:automat\\p{L}*|in\\s+automatico|tutt[oaie]\\b|un\\s+(?:solo|unico)\\s+posto|in\\s+un\\s+posto|centralizz\\p{L}*|export\\s+manuale|senza\\s+(?:dover\\s+)?esport\\p{L}*` +
    `|everything|all\\s+(?:of\\s+)?(?:your|the)|in\\s+one\\s+place|one\\s+place|single\\s+place|manual\\s+export|hands-free|seamless\\p{L}*|one-click` +
    `|todos?\\b|todas?\\b|en\\s+un\\s+solo\\s+lugar|sin\\s+exportar|tout\\b|tous\\b|toutes\\b|en\\s+un\\s+seul\\s+endroit|sans\\s+export\\p{L}*` +
    `|alles\\b|alle\\b|an\\s+einem\\s+Ort|ohne\\s+(?:manuellen\\s+)?Export|tudo\\b|em\\s+um\\s+só\\s+lugar|num\\s+só\\s+lugar|sem\\s+exportar` +
    `|wszystk\\p{L}*|w\\s+jednym\\s+miejscu|otomatik\\p{L}*|tüm\\b|hepsi|her\\s+şey|tek\\s+yerde|op\\s+één\\s+plek|zonder\\s+handmatige` +
    `|allt\\b|alla\\b|på\\s+ett\\s+ställe|utan\\s+manuell|alt\\b|ét\\s+sted|et\\s+sted|uden\\s+manuel)${RB}|自動|すべて|全て|全部|一か所|一箇所|자동|모든|전부|한 곳`,
  "iu",
);

type GaMatch = { idx: number; kind: "A" | "B" | "P" | "S" | "E" | "Y" | "W" };
function gaPredicateMatches(s: string): GaMatch[] {
  const m: GaMatch[] = [];
  // «FitMesh Sync» e' un nome di prodotto, non un verbo di sincronizzazione
  const t = s.replace(/FitMesh\s+Sync/giu, "FitMesh_____");
  const addOn = (re: RegExp, kind: GaMatch["kind"]) => {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    for (const x of t.matchAll(g)) m.push({ idx: x.index ?? 0, kind });
  };
  addOn(GA_PRED_INTEGRATION, "A");
  addOn(GA_PRED_INTEGRATION_CONNECT_TO, "A");
  addOn(GA_PRED_INTEGRATION_CJK, "A");
  addOn(GA_PRED_SUPPORT, "B");
  addOn(GA_PRED_SUPPORT_CJK, "B");
  addOn(GA_PRED_PARTNER, "P");
  addOn(GA_PRED_PARTNER_CJK, "P");
  addOn(GA_PRED_STATUS, "S");
  addOn(GA_PRED_STATUS_CJK, "S");
  addOn(GA_PRED_API, "E");
  addOn(GA_PRED_WILL_SUPPORT, "B");
  addOn(GA_PRED_WORKS, "W");
  if (/FitMesh/i.test(s)) {
    addOn(GA_PRED_STATUS_LOOSE, "S");
    addOn(GA_PRED_SUPPORT_NOUN, "B");
  }
  addOn(GA_SYNC_OFFICIAL, "Y");
  return m.sort((x, y) => x.idx - y.idx);
}
// Negazione del predicato in posizione idx: stessa clausola, finestra di 7 parole PRIMA (lingue SVO);
// tutta la clausola per ja/ko e per tr (negazione dopo il predicato).
function gaNegated(s: string, idx: number): boolean {
  let start = 0;
  let end = s.length;
  for (const b of s.matchAll(GA_CLAUSE_BOUND)) {
    const bi = b[0].length > 0 ? (b.index ?? 0) : 0;
    if (bi + b[0].length <= idx) start = Math.max(start, bi + b[0].length);
    else if (bi > idx) end = Math.min(end, bi);
  }
  const clause = s.slice(start, end);
  if (GA_CJK_CHARS.test(clause) && GA_NEGATION_CJK.test(clause)) return true;
  if (GA_NEGATION_TR.test(clause)) return true;
  const before = s.slice(start, idx).split(/\s+/).filter(Boolean).slice(-7).join(" ");
  if (GA_NEGATION_WORDS.test(before)) return true;
  // lingue V2 (de/sv/da/nl): «unterstützt Garmin nicht», «stöder inte», «understøtter ikke»: negazione DOPO il verbo
  const after = s.slice(idx, end).split(/\s+/).filter(Boolean).slice(1, 5).join(" ");
  return /(?<![\p{L}\p{N}])(?:nicht|inte|ikke|ej|niet)(?![\p{L}\p{N}])/iu.test(after);
}

// Motivi (vuoto = nessuna promessa) per UNA cella: segmenta in frasi e valuta ciascuna nel suo contesto.
function garminPromiseProblems(text: string): string[] {
  const out: string[] = [];
  const cell = nz(text);
  const sents = segmentSentences(cell);
  for (let si = 0; si < sents.length; si++) {
    const raw = sents[si];
    if (isQuestion(raw)) continue; // domanda: non afferma
    const s = raw;
    const hasOfficialOrDirect = GA_OFFICIAL.test(s) || GA_DIRECT.test(s);
    const preds = gaPredicateMatches(s).filter(
      (p) => !gaNegated(s, p.idx) && !(p.kind === "W" && !hasOfficialOrDirect), // «funziona con Garmin» e' vago
    );
    // previsione su FitMesh + Garmin anche senza un verbo di integrazione («In futuro FitMesh leggera' Garmin
    // direttamente»), purche' la frase non sia negata e non parli di un terzo
    if (
      preds.length === 0 &&
      GA_FUTURE.test(s) &&
      /FitMesh/i.test(s) &&
      /Garmin/i.test(s) &&
      (GA_OFFICIAL.test(s) || GA_DIRECT.test(s)) &&
      !GA_NEGATION_WORDS.test(s) &&
      !GA_NEGATION_CJK.test(s)
    ) {
      out.push(`integrazione prevista/futura: ${raw.slice(0, 80)}`);
      continue;
    }
    if (preds.length === 0) continue;
    const official = GA_OFFICIAL.test(s);
    const direct = GA_DIRECT.test(s);
    const kinds = new Set(preds.map((p) => p.kind));
    // «FitMesh collega Garmin tramite Health Connect»: integrazione mediata, non diretta ne' ufficiale
    const onlyPlain = [...kinds].every((k) => k === "A" || k === "B");
    if (onlyPlain && GA_MEDIATED.test(s) && !official && !direct) continue;
    const strong = kinds.has("W") || kinds.has("P") || kinds.has("S") || kinds.has("Y") || ((kinds.has("A") || kinds.has("B")) && (official || direct));
    const garminIdx = s.search(/Garmin/i);
    const hasGarmin = garminIdx >= 0;
    // Senza «Garmin» nella frase («Si integra ufficialmente.») conta solo se e' ufficiale/partner e la frase
    // PRECEDENTE parla di Garmin o FitMesh senza nominare un terzo (altrimenti «integrazione diretta» e' di Strava).
    const prev = si > 0 ? sents[si - 1] : "";
    const carriesOver = (official || kinds.has("P") || kinds.has("S")) && /Garmin|FitMesh/i.test(prev) && !GA_THIRD_PARTY.test(prev);
    if (!hasGarmin && !(strong && carriesOver)) continue;
    const mine = GA_FIRST_PERSON.test(s);
    const third = GA_THIRD_PARTY.test(s);
    if (!mine) {
      if (third) continue; // «Strava ha un'integrazione ufficiale con Garmin»: predicato di un terzo
      if (hasGarmin && garminIdx < preds[0].idx) continue; // Garmin e' il soggetto: «Garmin Connect si integra con...»
    }
    const future = GA_FUTURE.test(s);
    // senza FitMesh/noi nella frase serve un predicato forte (ufficiale/diretto/partner/stato) o una previsione:
    // «Al conectar un Garmin nuevo a la cuenta...» e' un'istruzione all'utente, non una promessa
    if (!mine && !strong && !future) continue;
    out.push(`${future ? "integrazione prevista/futura" : "integrazione/ufficialita'/supporto diretto"}: ${raw.slice(0, 80)}`);
  }
  return out;
}
// G3: beneficio affermato in una frase POSITIVA della voce (la clausola di negazione ammessa e' tolta prima).
function garminBenefitProblems(text: string, neg: RegExp): string[] {
  const out: string[] = [];
  const rest = nz(text).replace(neg, " ");
  for (const raw of segmentSentences(rest)) {
    if (isQuestion(raw)) continue;
    if (GA_BENEFIT.test(raw)) out.push(`beneficio di integrazione/automazione affermato: ${raw.slice(0, 80)}`);
  }
  return out;
}

const cellLang = (path: string): string => path.split(".").reverse().find((k) => CONTENT_LANGS.has(k)) ?? "";

// Esenzioni Garmin DOCUMENTATE, ciascuna verificata nel test (nessuna e' una esenzione fantasma):
// (i) body.15.items[2]: la clausola di negazione «FitMesh legge via Health Connect e NON tramite l'API ufficiale».
// Non e' una esenzione dalla guardia: la voce e' valutata dalla guardia di frase e in piu' dalla regola G3 (beneficio).
const GA_NEGATION: Record<string, RegExp> = {
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
// Voce body.15.items[2]: forma attesa (prefisso, una frase [ja/ko due], chiusura sulla negazione, Health Connect),
// NESSUNA lista chiusa di parole ammesse in testa (G3): la testa e' valutata dal lessico di beneficio e dalla
// guardia di frase, cosi' una resa diversa (revisione madrelingua SV/DA) non diventa rossa per costruzione.
function isFitmeshSyncNegationCell(lang: string, raw: string): boolean {
  const t = nz(raw).trim();
  const neg = GA_NEGATION[lang];
  if (!neg || !neg.test(t)) return false;
  if (!new RegExp(neg.source + "[.。]$").test(t)) return false; // finisce con la negazione
  const ss = segmentSentences(t);
  const wanted = lang === "ja" || lang === "ko" ? 2 : 1;
  if (ss.length !== wanted) return false;
  if (wanted === 2 && !neg.test(ss[1])) return false;
  if (!/Health[ -]Connect/.test(t)) return false;
  if (!/^\*\*FitMesh Sync\*\*[:：] ?/.test(t)) return false;
  if (!/Garmin/.test(t.replace(/^\*\*FitMesh Sync\*\*[:：] ?/, ""))) return false;
  if (garminBenefitProblems(t, neg).length > 0) return false; // G3: beneficio in testa (o in coda)
  return garminPromiseProblems(t).length === 0; // G1: nessuna promessa affermata nella voce
}
// (ii) CTA in riga rossa (body.25.ctaLabel): testo esatto, uguale a main c011056b (verificato nel referto).
const GA_CTA_LABELS: Record<string, string> = {
  it: "Vedi integrazione Garmin su FitMesh →",
  en: "See Garmin integration on FitMesh →",
  es: "Ver integración de Garmin en FitMesh →",
  de: "Garmin-Integration auf FitMesh ansehen →",
  pt: "Ver integração Garmin no FitMesh →",
  fr: "Voir l'intégration Garmin sur FitMesh →",
  pl: "Zobacz integrację Garmin na FitMesh →",
  tr: "FitMesh'te Garmin entegrasyonunu gör →",
  nl: "Zie Garmin-integratie op FitMesh →",
  ja: "FitMesh で Garmin 統合を見る →",
  ko: "FitMesh에서 Garmin 통합 보기 →",
  sv: "Se Garmin integration på FitMesh →",
  da: "Se Garmin integration på FitMesh →",
};
const GA_NEG_PATH = /^(?:ts|overlay):body\.15\.items\.[a-z]{2}\.2$/;
const GA_CTA_PATH = /^(?:ts|overlay):body\.25\.ctaLabel\.[a-z]{2}$/;
// Verdetto UNICO per cella, usato sia dal test sul contenuto sia dal corpus (vero percorso di guardia).
function garminCellVerdict(path: string, text: string): string[] {
  const lang = cellLang(path);
  if (GA_NEG_PATH.test(path)) {
    return isFitmeshSyncNegationCell(lang, text) ? [] : ["voce body.15.items[2]: forma/negazione/beneficio non conforme"];
  }
  if (GA_CTA_PATH.test(path) && text === nz(GA_CTA_LABELS[lang])) return []; // (ii)
  return garminPromiseProblems(text);
}
function fitbitCellVerdict(path: string, text: string): string[] {
  if (SECTION_LABELS_EXTENDED[path] === text) return []; // etichette gia' ammesse a testo esatto
  return fitbitFrequencyProblems(text);
}

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
  src: "S3-L" | "S3-P" | "S3-K" | "S3-V" | "SA";
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
