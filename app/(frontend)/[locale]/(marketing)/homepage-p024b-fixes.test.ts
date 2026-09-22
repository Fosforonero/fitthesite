import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * SPRINT P0.24-B FASE A (22/09/2026): la homepage importa
 * lib/blog/payload-source.ts (per i post correlati), che a sua volta importa
 * @payload-config — non risolvibile nella pipeline Vite di vitest (stesso
 * limite gia' incontrato e documentato per blog/[slug]/page.tsx nel
 * micro-gate P0.24-A-A). `renderToStaticMarkup` sulla pagina intera non e'
 * quindi praticabile qui: questo file verifica le stesse correzioni a
 * livello di sorgente, e la prova di rendering reale e' stata fatta
 * separatamente con `next build` + `next start` + fetch (vedi PR/memoria),
 * non solo asserita.
 */
const SOURCE = readFileSync(
  join(process.cwd(), "app/(frontend)/[locale]/(marketing)/page.tsx"),
  "utf8",
);

describe("homepage: badge wearable usa il conteggio live, non il totale catalogo", () => {
  it("il badge hero interpola LIVE_PROVIDER_COUNT, non piu' PROVIDERS.length", () => {
    expect(SOURCE).not.toMatch(/\{PROVIDERS\.length\}\+/);
    expect(SOURCE).toMatch(/\{LIVE_PROVIDER_COUNT\}\+/);
  });

  it("importa LIVE_PROVIDER_COUNT da lib/product-facts", () => {
    expect(SOURCE).toMatch(/import\s*\{[^}]*LIVE_PROVIDER_COUNT[^}]*\}\s*from\s*"@\/lib\/product-facts"/);
  });
});

describe("homepage: TrustBadges non forza piu' un fallback it/en", () => {
  it("nessun call-site passa ancora locale={lc === \"it\" ? \"it\" : \"en\"}", () => {
    expect(SOURCE).not.toMatch(/TrustBadges locale=\{lc === "it" \? "it" : "en"\}/);
    expect(SOURCE).toMatch(/<TrustBadges locale=\{lc\} \/>/);
  });
});

describe("homepage: sezione 'Bring Your Own AI' tradotta anche in IT/ES, non solo inglese hardcoded", () => {
  it("l'H2 non e' piu' un literal JSX bare in inglese", () => {
    // Il vecchio difetto: l'H2 era un unico literal senza alcun ternario di
    // locale, identico su tutte le 15 locale nonostante il resto della
    // sezione (kicker/body/CTA) fosse gia' tradotto it/es/altrimenti-en.
    expect(SOURCE).not.toMatch(
      />\s*Use your favorite AI assistant with your own health data\.\s*<\/h2>/,
    );
  });

  it("l'H2 e le due card hanno traduzioni IT ed ES nel sorgente", () => {
    expect(SOURCE).toContain("Usa il tuo assistente AI preferito con i tuoi dati di salute.");
    expect(SOURCE).toContain("Usa tu asistente de IA favorito con tus datos de salud.");
    expect(SOURCE).toContain("Porta il tuo wearable.");
    expect(SOURCE).toContain("Trae tu wearable.");
    expect(SOURCE).toContain("Porta la tua AI.");
    expect(SOURCE).toContain("Trae tu IA.");
  });

  it("l'inglese resta come fallback esplicito per le altre locale (non rimosso, solo non piu' unico)", () => {
    expect(SOURCE).toContain("Use your favorite AI assistant with your own health data.");
    expect(SOURCE).toContain("Bring your own wearable.");
    expect(SOURCE).toContain("Bring your own AI.");
  });
});
