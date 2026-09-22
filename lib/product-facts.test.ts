import { describe, expect, it } from "vitest";
import { APP_FEATURE_LIST_ANDROID, APP_FEATURE_LIST_IOS, SUPPORTED_PROVIDERS_ANDROID, SUPPORTED_PROVIDERS_IOS } from "./product-facts";
import { locales } from "./i18n";
import { PROVIDERS, type Provider } from "./providers/data";

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
/**
 * P0.24-B FASE A (22/09/2026), RETTIFICA: un primo tentativo aveva
 * introdotto `LIVE_PROVIDER_COUNT` (unione deduplicata dei provider live,
 * = 14) per correggere il badge "N wearable supportati" (prima
 * `PROVIDERS.length` grezzo, 17, incluse 3 integrazioni non-live). Corretto
 * sul numero, ma NON sulla categoria dichiarata dal badge stesso: di quei
 * 14, "Smartphone Android" (category "phone-only") e "Apple Health"
 * (category "health-platform") non sono wearable per la tassonomia
 * `ProviderCategory` già esistente e pubblica su /integrations
 * (`categoryLabel`). Filtrare su category non basta a rendere il numero
 * "rigoroso": "Garmin Connect" e "Withings" sono category
 * fitness-platform/health-platform pur essendo brand che vendono wearable
 * veri — un confine altrettanto arbitrario. Istruzione esplicita di
 * Matteo: se non esiste un conteggio rigoroso di marchi wearable, il
 * numero va tolto dalle superfici marketing (home hero, press kit), non
 * ri-etichettato per farlo tornare — vedi il commento sopra
 * SUPPORTED_PROVIDERS_ANDROID/IOS in product-facts.ts. Questi test
 * verificano la SEMANTICA (non solo un valore numerico): (1) fissano quali
 * provider live hanno una category non-wearable, cosi' se la
 * categorizzazione cambia un domani, il test lo segnala esplicitamente
 * invece di lasciare che un numero aggregato torni silenziosamente
 * "quasi giusto"; (2) verificano che home/press non facciano piu' nessun
 * claim numerico "N wearable/brand" non qualificato, in nessuna delle 15
 * lingue.
 */
describe("product-facts: nessun conteggio 'wearable' aggregato senza una categoria rigorosa", () => {
  it("fissa quali provider live NON sono category wearable/smartwatch (la ragione per cui un conteggio aggregato non e' rigoroso)", () => {
    const liveNames = new Set([...SUPPORTED_PROVIDERS_ANDROID, ...SUPPORTED_PROVIDERS_IOS]);
    const liveByName = new Map(PROVIDERS.filter((p: Provider) => liveNames.has(p.name)).map((p: Provider) => [p.name, p]));

    const nonWearableCategories = ["health-platform", "fitness-platform", "phone-only"];
    const nonWearableLive = [...liveByName.values()].filter((p) => nonWearableCategories.includes(p.category));
    const nonWearableNames = nonWearableLive.map((p) => p.name).sort();

    // Se questo elenco cambia (un provider "non-wearable" diventa
    // wearable/smartwatch, o viceversa), la decisione di togliere il
    // numero dalle superfici marketing va rivalutata: non e' piu' lo
    // stesso confine indistinto documentato qui.
    expect(nonWearableNames).toEqual(["Apple Health", "Garmin Connect", "Smartphone Android", "Withings"]);
  });

  it("almeno un provider live vende wearable veri pur avendo category non-wearable (il confine e' arbitrario, non rigoroso)", () => {
    const withings = PROVIDERS.find((p: Provider) => p.name === "Withings");
    expect(withings, "Withings non trovato nel catalogo").toBeDefined();
    expect(withings!.category, "Withings vende smartwatch/scale reali ma qui e' category 'health-platform': filtrare per category escluderebbe un vero brand wearable, non e' un confine rigoroso").not.toBe("wearable");
  });
});

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
