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
