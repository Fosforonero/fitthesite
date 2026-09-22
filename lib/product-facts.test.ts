import { describe, expect, it } from "vitest";
import { APP_FEATURE_LIST_ANDROID, APP_FEATURE_LIST_IOS } from "./product-facts";
import { locales } from "./i18n";

/**
 * P0.24-B FASE A: le liste feature dell'app (consumate oggi solo da
 * `mobileApplicationJsonLdData()` in components/seo/MobileApplicationJsonLd.tsx,
 * componente NON montato su nessuna pagina, vedi il commento in cima a quel
 * file) elencavano "Family Mesh"/"Mesh Famiglia" come funzione live, in
 * contraddizione con /famiglia (getFamigliaComingSoon: non disponibile,
 * progetto in valutazione). Codice morto oggi, ma questo file si dichiara
 * "UNICA FONTE DI VERITA' per i fatti prodotto machine-readable": una voce
 * falsa qui torna viva nel momento in cui qualcuno rimonta quel componente
 * (es. quando esistera' un aggregateRating vero), senza che nessuno se ne
 * accorga. Questo test tiene la voce fuori finche' la funzione non spedisce
 * davvero.
 */
describe("product-facts: le feature list non promettono Family Mesh", () => {
  it("nessuna locale, nessuna piattaforma, elenca Family Mesh/Mesh Famiglia come funzione", () => {
    for (const locale of locales) {
      for (const [platform, list] of [
        ["Android", APP_FEATURE_LIST_ANDROID[locale]] as const,
        ["iOS", APP_FEATURE_LIST_IOS[locale]] as const,
      ]) {
        if (!list) continue; // locale senza feature list dedicata: fuori scope di questo controllo
        const hit = list.find((line) => /family mesh|mesh famiglia|mesh familia|mesh família|mesh famille|familien-mesh|mesh rodzin|aile mesh/i.test(line));
        expect(hit, `${platform}/${locale}: trovata una voce Family Mesh nella feature list: "${hit}"`).toBeUndefined();
      }
    }
  });
});
