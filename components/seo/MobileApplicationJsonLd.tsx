import { JsonLd } from "./JsonLd";
import { ogLocale, type Locale } from "@/lib/i18n";
import {
  SITE_URL,
  PRODUCT_NAME,
  PLAY_STORE_URL,
  AVAILABILITY,
  APP_DESCRIPTIONS,
  APP_FEATURE_LIST,
  appOffers,
} from "@/lib/product-facts";

/**
 * MobileApplication — SOLO su homepage, /beta (pagina di download/signup) e
 * altre pagine prodotto esplicite. Mai nel layout globale: prima veniva
 * emessa su ogni pagina marketing, inclusi tutti gli articoli del blog
 * ("MobileApplication non emessa indiscriminatamente sugli articoli").
 *
 * Correzioni rispetto alla versione precedente:
 *  - `offers` ora include SEMPRE l'offerta gratuita di download più lo
 *    sblocco Pro come acquisto in-app separato — prima mostrava solo il
 *    prezzo Pro come se servisse per scaricare l'app.
 *  - Il nodo iOS usa il prezzo iOS reale (PRICE_LIFETIME_IOS_RAW, €4,99),
 *    prima riusava per errore il prezzo Android (€3,99).
 *  - Il nodo iOS è emesso incondizionatamente (non dietro il flag
 *    IOS_ENABLED): l'app è approvata da Apple ed è già live fuori UE oggi
 *    (vedi lib/flags.ts) — nasconderla del tutto dal JSON-LD contraddiceva
 *    sia questo fatto sia il testo già pubblicato sul sito (blog "FitMesh
 *    arriva su iPhone"). Il limite UE è reso esplicito in `description`,
 *    non con un `areaServed` fuorviante.
 *  - `softwareVersion` rimosso: nessun meccanismo in questo repo legge la
 *    versione live pubblicata sugli store, quindi un valore hardcodato
 *    (era "3.2.2") diventa stantio a ogni release senza che nessuno se ne
 *    accorga. Meglio ometterlo — vedi lib/product-facts.ts.
 */
/** Costruzione dati pura (nessun JSX) — testabile in isolamento. */
export function mobileApplicationJsonLdData(locale: Locale) {
  const lang = ogLocale[locale].replace("_", "-");
  const featureList = locale === "it" ? APP_FEATURE_LIST.it : APP_FEATURE_LIST.en;
  const description = APP_DESCRIPTIONS[locale] ?? APP_DESCRIPTIONS.en;

  const androidNode = {
    "@type": "MobileApplication",
    "@id": `${SITE_URL}#mobile-app`,
    name: PRODUCT_NAME,
    alternateName: "FitMesh Android Health Tracker",
    description,
    operatingSystem: `${AVAILABILITY.android.minOsVersion} and up`,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Fitness",
    inLanguage: lang,
    offers: appOffers("android"),
    url: PLAY_STORE_URL,
    downloadUrl: PLAY_STORE_URL,
    publisher: { "@id": `${SITE_URL}#organization` },
    image: `${SITE_URL}/icon-square.png`,
    screenshot: androidScreenshots(locale),
    featureList,
  };

  const iosNode = {
    "@type": "MobileApplication",
    "@id": `${SITE_URL}#mobile-app-ios`,
    name: PRODUCT_NAME,
    alternateName: "FitMesh iOS Health Tracker",
    description: `${description} ${AVAILABILITY.ios.regionsNote}`,
    operatingSystem: `${AVAILABILITY.ios.minOsVersion} and up`,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Fitness",
    inLanguage: lang,
    offers: appOffers("ios"),
    url: AVAILABILITY.ios.storeUrl,
    downloadUrl: AVAILABILITY.ios.storeUrl,
    publisher: { "@id": `${SITE_URL}#organization` },
    image: `${SITE_URL}/icon-square.png`,
    featureList,
  };

  return {
    android: { "@context": "https://schema.org", ...androidNode },
    ios: { "@context": "https://schema.org", ...iosNode },
  };
}

export function MobileApplicationJsonLd({ locale }: { locale: Locale }) {
  const { android, ios } = mobileApplicationJsonLdData(locale);
  return (
    <>
      <JsonLd data={android} />
      <JsonLd data={ios} />
    </>
  );
}

/** Screenshot reali dell'app. Solo it/ e en/ hanno asset propri; tutte le altre locale usano en/ come fallback per evitare 404. */
function androidScreenshots(locale: Locale) {
  const sl = locale === "it" ? "it" : "en";
  const captions: Record<string, [string, string]> = {
    dashboard: [
      "Dashboard FitMesh Sync: passi, battito, calorie, sonno e Recovery Index",
      "FitMesh Sync dashboard: steps, heart rate, calories, sleep and Recovery Index",
    ],
    sleep: [
      "Sonno con fasi (profondo, REM, leggero) e salute del cuore",
      "Sleep stages (deep, REM, light) and heart health",
    ],
    week: [
      "Confronto settimanale: passi, sonno, calorie e battito medio",
      "Week-over-week comparison: steps, sleep, calories and average heart rate",
    ],
    trends: [
      "Trend di passi e calorie negli ultimi 7 giorni",
      "Steps and calories trends over the last 7 days",
    ],
    vitals: [
      "SpO₂, piani saliti e metriche avanzate",
      "SpO₂, floors climbed and advanced metrics",
    ],
  };
  return Object.entries(captions).map(([name, [capIt, capEn]]) => ({
    "@type": "ImageObject",
    url: `${SITE_URL}/screens/${sl}/${name}.jpg`,
    caption: locale === "it" ? capIt : capEn,
    width: 720,
    height: 1440,
  }));
}
