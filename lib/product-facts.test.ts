import { describe, expect, it } from "vitest";
import { APP_FEATURE_LIST_ANDROID, APP_FEATURE_LIST_IOS, LIVE_PROVIDER_COUNT } from "./product-facts";
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
 * P0.24-B FASE A (22/09/2026): il badge marketing "N+ wearable supportati"
 * (home hero, press kit) interpolava `PROVIDERS.length` grezzo (17, l'intero
 * catalogo incluse 3 integrazioni non-live: 1 limited-beta + 2 not-available)
 * come se fossero tutte disponibili oggi. `LIVE_PROVIDER_COUNT` sostituisce
 * quell'interpolazione con l'unione deduplicata (per nome) dei provider
 * realmente live su almeno una piattaforma, stessa fonte gia' usata per
 * JSON-LD/llms.txt (SUPPORTED_PROVIDERS_ANDROID/IOS). Il test ricalcola
 * l'unione in modo indipendente (non richiamando la stessa funzione filtrata
 * altrove) per non limitarsi a verificare che il codice sia coerente con se
 * stesso.
 */
describe("product-facts: LIVE_PROVIDER_COUNT e' il conteggio live deduplicato, non il totale catalogo", () => {
  it("e' strettamente minore del totale catalogo (prova che filtra, non alias di PROVIDERS.length)", () => {
    expect(LIVE_PROVIDER_COUNT).toBeLessThan(PROVIDERS.length);
  });

  it("combacia con l'unione indipendente per nome dei provider live su almeno una piattaforma", () => {
    const LIVE = new Set(["live", "live-basic", "live-bridge"]);
    const independentUnion = new Set(
      PROVIDERS.filter((p: Provider) => LIVE.has(p.status)).map((p: Provider) => p.name),
    );
    expect(LIVE_PROVIDER_COUNT).toBe(independentUnion.size);
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
