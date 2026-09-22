import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { locales } from "@/lib/i18n";
import { LIVE_PROVIDER_COUNT } from "@/lib/product-facts";
import { PROVIDERS } from "@/lib/providers/data";
import PressPage from "./page";

/**
 * SPRINT P0.24-B FASE A (22/09/2026): il "key fact" wearable del press kit
 * interpolava `PROVIDERS.length` grezzo (17, l'intero catalogo incluse 3
 * integrazioni non-live) e diceva "via Health Connect" per tutte le
 * piattaforme, mentre Health Connect e' Android-only (i 3 provider iOS live
 * passano da Apple Health/Bluetooth diretto, mai Health Connect — vedi
 * lib/product-facts.ts AVAILABILITY.ios.dataSource). Questo test renderizza
 * la pagina vera per tutte le 15 locale e controlla che il key fact usi il
 * conteggio live deduplicato (LIVE_PROVIDER_COUNT) e nomini entrambi i
 * canali, non solo Health Connect.
 */
describe("press: key fact wearable usa il conteggio live, non il totale catalogo", () => {
  it("precondizione: LIVE_PROVIDER_COUNT < PROVIDERS.length (altrimenti il test sotto non discrimina nulla)", () => {
    expect(LIVE_PROVIDER_COUNT).toBeLessThan(PROVIDERS.length);
  });

  for (const locale of locales as readonly string[]) {
    it(`${locale}: key fact wearable renderizzato coerente`, async () => {
      const html = renderToStaticMarkup(await PressPage({ params: Promise.resolve({ locale }) }));

      expect(html, `${locale}: LIVE_PROVIDER_COUNT (${LIVE_PROVIDER_COUNT}) assente dal rendering`).toContain(
        String(LIVE_PROVIDER_COUNT),
      );
      expect(html, `${locale}: menziona Apple Health accanto a Health Connect`).toMatch(/apple health/i);

      // Il totale grezzo del catalogo (17) non deve comparire come conteggio
      // wearable isolato: cerchiamo la value del key fact e controlliamo che
      // non contenga il letterale "17" adiacente a "brand"/"marc"/"märk"/ecc.
      const rawCatalogPattern = new RegExp(`${PROVIDERS.length}[^0-9]{0,3}(brand|marc|märk|merk|marek|브랜드|ブランド)`, "i");
      expect(html, `${locale}: trovato ancora il totale catalogo grezzo (${PROVIDERS.length}) nel key fact wearable`).not.toMatch(
        rawCatalogPattern,
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
