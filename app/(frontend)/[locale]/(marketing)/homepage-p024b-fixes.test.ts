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

/**
 * RETTIFICA (22/09/2026, stesso giorno): il fix precedente sostituiva
 * `PROVIDERS.length` (17) con `LIVE_PROVIDER_COUNT` (14) nel badge, ma non
 * riconciliava la CATEGORIA dichiarata dal badge ("Wearable supportati")
 * con cosa viene davvero contato: di quei 14, "Smartphone Android"
 * (category "phone-only") e "Apple Health" (category "health-platform")
 * non sono wearable, e filtrare per category non produce comunque un
 * conteggio rigoroso ("Garmin Connect"/"Withings" vendono wearable veri ma
 * hanno category fitness-platform/health-platform — vedi
 * lib/product-facts.test.ts). Istruzione esplicita di Matteo: senza un
 * conteggio rigoroso, il numero va tolto dalla superficie marketing, non
 * ri-etichettato. Il badge e' ora un link a /integrations (elenco
 * completo, per-provider, con categoria e stato reali), non un'aggregazione.
 */
describe("homepage: badge wearable NON fa piu' un claim numerico non qualificato, rimanda al catalogo", () => {
  it("nessun conteggio grezzo (PROVIDERS.length) ne' un LIVE_PROVIDER_COUNT ormai rimosso", () => {
    expect(SOURCE).not.toMatch(/\{PROVIDERS\.length\}\+/);
    expect(SOURCE).not.toMatch(/LIVE_PROVIDER_COUNT/);
  });

  it("nessun claim numerico 'N+' adiacente all'etichetta wearable nel sorgente", () => {
    // Un numero letterale (es. {14}+ o "14+" scritto a mano) nelle righe
    // intorno a wearablesSupportedLabel sarebbe la stessa classe di difetto
    // sotto altro nome: un conteggio non riconciliato con la categoria
    // dichiarata. Cerca per riga (non con una regex multilinea fragile
    // sull'indentazione JSX) una finestra di poche righe intorno al
    // riferimento all'etichetta.
    const lines = SOURCE.split("\n");
    const labelLineIndex = lines.findIndex((l) => l.includes("HOMEPAGE_COPY.wearablesSupportedLabel"));
    expect(labelLineIndex, "riferimento a wearablesSupportedLabel non trovato nel sorgente").toBeGreaterThanOrEqual(0);
    const window = lines.slice(Math.max(0, labelLineIndex - 6), labelLineIndex + 2).join("\n");
    expect(window).not.toMatch(/\d+\+/);
  });

  it("il badge e' un link verso /integrations, non un'aggregazione", () => {
    expect(SOURCE).toMatch(/<Link href=\{`\/\$\{lc\}\/integrations`\}[^>]*>/);
    expect(SOURCE).toMatch(/\{tl\(HOMEPAGE_COPY\.seeAll, lc\)\}/);
    expect(SOURCE).toMatch(/\{tl\(HOMEPAGE_COPY\.wearablesSupportedLabel, lc\)\}/);
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
