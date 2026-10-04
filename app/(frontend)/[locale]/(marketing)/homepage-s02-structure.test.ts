import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "page.tsx"), "utf8");

describe("home S02: struttura (A1a)", () => {
  it("non rende hero.pricing ne' importi", () => {
    expect(src).not.toMatch(/hero\.pricing/);
    expect(src).not.toMatch(/lifetimeBothShort|subSixMonthsLabel|fromLifetime/);
    expect(src).not.toMatch(/from "@\/lib\/pricing"/);
  });

  it("«Come funziona» sta subito sotto i TrustBadges e prima del marquee", () => {
    const trust = src.indexOf("<TrustBadges");
    const how = src.indexOf("HOMEPAGE_COPY.howItWorksHeading");
    const marquee = src.indexOf("HOMEPAGE_COPY.worksWithKicker");
    expect(trust).toBeGreaterThan(0);
    expect(how).toBeGreaterThan(trust);
    expect(marquee).toBeGreaterThan(how);
  });

  it("il marquee filtra sugli stati live, live-basic, live-bridge", () => {
    expect(src).toMatch(/TICKER_STATUSES[^;]*"live", "live-basic", "live-bridge"/);
    expect(src).toMatch(/PROVIDERS\.filter\(/);
  });

  it("le chiavi nuove della sezione prezzi si leggono senza ripiego inglese", () => {
    expect(src).toMatch(/tlOwn\(PRICING_SECTION\.storeNote, lc\)/);
    expect(src).toMatch(/tlOwn\(PRICING_SECTION\.priceFromStore, lc\)/);
  });

  it("il blocco privacy usa nav.privacy e non le chiavi tolte", () => {
    expect(src).toMatch(/\{t\.nav\.privacy\}/);
    expect(src).not.toMatch(/privacy_block\.(kicker|heading|description)|privacyPoints/);
  });

  it("il pillar e' fra i featuredSlugs e il link «Guida completa ai prezzi» non c'e'", () => {
    const fs = src.slice(src.indexOf("const featuredSlugs"), src.indexOf("];", src.indexOf("const featuredSlugs")));
    expect(fs).toMatch(/"come-funziona-fitmesh"/);
    expect(src).not.toMatch(/Guida completa ai prezzi|Full pricing guide/);
  });

  it("il blocco della guida: dopo i passi, solo se ultraGuide non e' nullo, dati dal modulo (nessun testo scritto nella pagina)", () => {
    const steps = src.indexOf("HOMEPAGE_COPY.howItWorksHeading");
    const guida = src.indexOf("{ultraGuide && (");
    expect(guida).toBeGreaterThan(steps);
    expect(src).toMatch(/const ultraGuide = ultraGuideBlock\(\{ postsBySlug, lc, isBlogVariantIndexable, blogLinkHref \}\)/);
    const blocco = src.slice(guida, src.indexOf("\n        )}", guida));
    for (const campo of ["href", "kicker", "title", "text", "readLabel"]) expect(blocco).toContain(`ultraGuide.${campo}`);
    // il post e' risolto dallo slug, non da un titolo scritto a mano
    expect(src).not.toMatch(/Guida (?:per|all')ultra/i);
  });

  it("nessun importo nel sorgente della pagina", () => {
    expect(src).not.toMatch(/€\s?\d|\d\s?€|\$\s?\d/);
  });
});
