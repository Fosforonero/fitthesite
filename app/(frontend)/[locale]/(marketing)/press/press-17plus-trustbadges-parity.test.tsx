import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { locales } from "@/lib/i18n";
import { PROVIDERS } from "@/lib/providers/data";
import PressPage from "./page";

/**
 * SPRINT P0.24-B FASE A (22/09/2026), SECONDA RETTIFICA nello stesso
 * giorno: dopo aver tolto il conteggio "wearable" (nessuna categoria
 * rigoroso, vedi lib/product-facts.test.ts) il key fact enumerava ancora
 * i tre canali reali ("via Health Connect, Apple Health o Bluetooth
 * diretto") nella frase di rimando. Su richiesta di Matteo, micro-gate
 * finale: l'etichetta stessa non deve piu' dire "wearable" (era gia' un
 * residuo della stessa categoria non rigorosa), e la frase deve restare
 * breve — l'enumerazione dei tre canali puo' rendere la traduzione
 * artificiosa in alcune lingue (constatato: il primo giro aveva gia'
 * prodotto un errore in coreano, "블루투스" traslitterato invece di
 * "Bluetooth", proprio in quella frase piu' lunga). Il key fact ora ha
 * un'etichetta neutra ("Compatibilità"/"Compatibility"/ecc.) e una frase
 * breve che rimanda allo stato aggiornato su fitmesh.fit/integrations,
 * senza elencare i canali. Questi test verificano: nessuna etichetta
 * "wearable"-specifica residua, nessun claim numerico, presenza del
 * rimando — non un singolo valore di testo atteso (le 15 traduzioni sono
 * tutte diverse).
 */
describe("press: key fact compatibilità non fa piu' un claim 'wearable' numerico o iper-specifico", () => {
  for (const locale of locales as readonly string[]) {
    it(`${locale}: key fact compatibilità renderizzato coerente`, async () => {
      const html = renderToStaticMarkup(await PressPage({ params: Promise.resolve({ locale }) }));

      const markerIndex = html.indexOf("fitmesh.fit/integrations");
      expect(markerIndex, `${locale}: il key fact compatibilità non rimanda a fitmesh.fit/integrations`).toBeGreaterThanOrEqual(0);

      // Finestra intorno al rimando: la pagina menziona Health Connect,
      // Apple Health e altri claim numerici ANCHE altrove (blurb100/200,
      // Pricing, Piattaforme), quindi un controllo sull'HTML intero non
      // scoprirebbe un key fact rimasto vuoto/generico — questa finestra
      // isola solo il testo del key fact stesso. 150 caratteri indietro
      // bastano a includere anche l'etichetta (<dt>...</dt>), separata dal
      // valore da markup HTML (class attributes) non solo da testo: misurato
      // ~90 caratteri per l'etichetta piu' corta (EN "Compatibility").
      const windowText = html.slice(Math.max(0, markerIndex - 150), markerIndex + 60);

      // Nessun conteggio grezzo del catalogo (17) ne' un residuo dei
      // conteggi rimossi nei giri precedenti (14) adiacente a
      // "brand"/"marc"/ecc.
      for (const n of [PROVIDERS.length, 14]) {
        const numericClaimPattern = new RegExp(`${n}[^0-9]{0,4}(brand|marc|märk|merk|marek|개|브랜드|ブランド)`, "i");
        expect(windowText, `${locale}: trovato un claim numerico (${n}) nel key fact compatibilità`).not.toMatch(
          numericClaimPattern,
        );
      }

      // L'etichetta non deve piu' essere quella "wearable"-specifica del
      // giro precedente (in nessuna delle 15 lingue): era essa stessa un
      // residuo della categoria non rigorosa, non solo il numero.
      const wearableLabelPattern = /wearable|웨어러블|ウェアラブル|urzadzenia|giyilebilir/i;
      expect(windowText, `${locale}: l'etichetta del key fact e' ancora "wearable"-specifica`).not.toMatch(
        wearableLabelPattern,
      );
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
