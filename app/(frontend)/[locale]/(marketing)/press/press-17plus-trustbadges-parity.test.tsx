import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { locales } from "@/lib/i18n";
import { PROVIDERS } from "@/lib/providers/data";
import PressPage from "./page";

/**
 * SPRINT P0.24-B FASE A (22/09/2026), RETTIFICA nello stesso giorno: un
 * primo fix aveva sostituito `PROVIDERS.length` (17) con un
 * `LIVE_PROVIDER_COUNT` deduplicato (14) e la frase "via Health Connect
 * (Android) e Apple Health (iOS)". Corretto sul numero grezzo, ma non su
 * due problemi piu' fondamentali, entrambi segnalati da Matteo:
 *
 * 1. Categoria: di quei 14, "Smartphone Android" (un telefono, non un
 *    wearable) e "Apple Health" (un aggregatore dati, non un dispositivo)
 *    non sono wearable per la tassonomia `ProviderCategory` gia'
 *    esistente. Filtrare per categoria non basta comunque a rendere il
 *    conteggio rigoroso: "Garmin Connect"/"Withings" vendono wearable
 *    veri ma sono categorizzati come piattaforma (vedi
 *    lib/product-facts.test.ts per la prova). Senza un confine rigoroso,
 *    il numero va tolto dalla superficie marketing, non ri-etichettato.
 * 2. Canale: "Health Connect (Android) e Apple Health (iOS)" ignora il BLE
 *    diretto (Colmi Ring, live su entrambe le piattaforme, MAI tramite
 *    Health Connect ne' Apple Health — vedi `syncMechanism: "direct-ble"`
 *    in lib/providers/data.ts).
 *
 * Il key fact ora rimanda a fitmesh.fit/integrations (l'elenco vero,
 * per-provider, con categoria e stato) invece di aggregare un numero, e
 * nomina tutti e tre i canali reali. Questi test verificano la SEMANTICA
 * (assenza di claim numerico, presenza dei tre canali, presenza del
 * rimando), non un singolo valore atteso.
 */
describe("press: key fact wearable non fa piu' un claim numerico non qualificato", () => {
  for (const locale of locales as readonly string[]) {
    it(`${locale}: key fact wearable renderizzato coerente`, async () => {
      const html = renderToStaticMarkup(await PressPage({ params: Promise.resolve({ locale }) }));

      const markerIndex = html.indexOf("fitmesh.fit/integrations");
      expect(markerIndex, `${locale}: il key fact wearable non rimanda a fitmesh.fit/integrations`).toBeGreaterThanOrEqual(0);

      // Finestra intorno al rimando: la pagina menziona Health Connect e
      // Apple Health ANCHE altrove (blurb100/blurb200), quindi un controllo
      // sull'HTML intero non scoprirebbe un key fact rimasto vuoto/generico
      // — questa finestra isola solo il testo del key fact stesso.
      const windowText = html.slice(Math.max(0, markerIndex - 40), markerIndex + 220);

      // Nessun conteggio grezzo del catalogo (17) ne' un residuo del
      // conteggio dedup rimosso (14) adiacente a "brand"/"marc"/ecc.
      for (const n of [PROVIDERS.length, 14]) {
        const numericClaimPattern = new RegExp(`${n}[^0-9]{0,4}(brand|marc|märk|merk|marek|개|브랜드|ブランド)`, "i");
        expect(windowText, `${locale}: trovato un claim numerico (${n}) nel key fact wearable`).not.toMatch(
          numericClaimPattern,
        );
      }

      // I tre canali reali: Health Connect (Android), Apple Health (iOS),
      // BLE diretto (Colmi Ring, entrambe le piattaforme). "bluetooth" e'
      // scritto in latino in tutte le 15 lingue del sito (nome proprio
      // della tecnologia, non tradotto).
      expect(windowText, `${locale}: il key fact wearable non menziona Health Connect`).toMatch(/health connect/i);
      expect(windowText, `${locale}: il key fact wearable non menziona Apple Health`).toMatch(/apple health/i);
      expect(windowText, `${locale}: il key fact wearable non menziona il Bluetooth diretto`).toMatch(/bluetooth/i);
    });
  }
});

/**
 * TrustBadges.tsx ha traduzioni corrette per tutte le 15 locale, ma il
 * call-site su /press forzava `locale={lc === "it" ? "it" : "en"}`: le 13
 * traduzioni non-IT/non-EN non venivano mai usate. Verifica diretta sul
 * rendering per un campione di locale non-it/non-en.
 */
describe("press: TrustBadges usa la locale reale, non un fallback it/en forzato", () => {
  it("de: mostra la traduzione tedesca del titolo TrustBadges, non quella inglese", async () => {
    const html = renderToStaticMarkup(await PressPage({ params: Promise.resolve({ locale: "de" }) }));
    expect(html).toContain("Mit Sorgfalt entwickelt");
    expect(html).not.toContain("Built with care");
  });

  it("es: mostra la traduzione spagnola del titolo TrustBadges, non quella inglese", async () => {
    const html = renderToStaticMarkup(await PressPage({ params: Promise.resolve({ locale: "es" }) }));
    expect(html).toContain("Hecho con cuidado");
    expect(html).not.toContain("Built with care");
  });
});
