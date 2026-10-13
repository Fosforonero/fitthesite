import { describe, expect, it } from "vitest";
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { blogSeoTitle, tl } from "@/lib/blog/types";
import { applyNordicOverlay } from "@/lib/blog/nordic-overlay";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";

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
        expect(val, `hero.subtitle.${lang} contains 95%`).not.toContain("95%");
        expect(val, `hero.subtitle.${lang} contains 30s`).not.toMatch(/30\s*(secondi|seconds|segundos|Sekunden|seconden|sekund)/i);
      }

      // Verifica metaDescription
      for (const [lang, val] of Object.entries(post.metaDescription)) {
        expect(val, `metaDescription.${lang} contains 95%`).not.toContain("95%");
        expect(val, `metaDescription.${lang} contains 30s`).not.toMatch(/30\s*(secondi|seconds|segundos|Sekunden|seconden|sekund)/i);
      }

      // Verifica overlay nordico
      const nordic = (nordicOverlayJson as any)["fitbit-data-not-syncing-android"];
      if (nordic) {
        if (nordic["hero.subtitle"]) {
          for (const [l, v] of Object.entries(nordic["hero.subtitle"])) {
            expect(v as string).not.toContain("95%");
            expect(v as string).not.toMatch(/30\s*sekund/i);
          }
        }
        if (nordic["metaDescription"]) {
          for (const [l, v] of Object.entries(nordic["metaDescription"])) {
            expect(v as string).not.toContain("95%");
            expect(v as string).not.toMatch(/30\s*sekund/i);
          }
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

      // Sezione 8 e Sezione 11 non devono attribuire a FitMesh l'integrazione diretta SDK
      const bodyStr = JSON.stringify(post.body);
      expect(bodyStr).not.toContain("FitMesh si interfaccia con il Samsung Health Data SDK");
      expect(bodyStr).not.toContain("FitMesh interfaces with the Samsung Health Data SDK");
      expect(bodyStr).not.toContain("FitMesh verbindet sich über das Samsung Health Data SDK");
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

    it("Garmin: nessun obbligo generale di API per attività GPS e corretta distinzione export web vs API", () => {
      const post = BLOG_POSTS_BY_SLUG["esportare-dati-garmin"];
      expect(post).toBeDefined();

      // TLDR bullet 4 non deve asserire obbligo generale di API per le attività GPS
      expect(post.tldr).toBeDefined();
      for (const [lang, items] of Object.entries(post.tldr!)) {
        expect(items[3], `tldr[3].${lang}`).not.toContain("per le attività GPS serve l'integrazione diretta con la Garmin Connect API");
        expect(items[3], `tldr[3].${lang}`).not.toContain("for GPS activities you need direct Garmin Connect API integration");
      }

      // "In sintesi" lista bullet 4
      const bodyStr = JSON.stringify(post.body);
      expect(bodyStr).not.toContain("per le attività GPS serve l'integrazione diretta con la Garmin Connect API");
      expect(bodyStr).not.toContain("for GPS activities you need direct Garmin Connect API integration");
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
