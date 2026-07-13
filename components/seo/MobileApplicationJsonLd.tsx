import { JsonLd } from "./JsonLd";
import { organizationCompactRef } from "./OrganizationJsonLd";
import type { Locale } from "@/lib/i18n";
import { schemaLanguage } from "@/lib/seo/schema-language";
import {
  SITE_URL,
  PRODUCT_NAME,
  PLAY_STORE_URL,
  AVAILABILITY,
  IOS_REGIONS_NOTE,
  APP_DESCRIPTIONS_ANDROID,
  APP_DESCRIPTIONS_IOS,
  APP_FEATURE_LIST_ANDROID,
  APP_FEATURE_LIST_IOS,
  appOffers,
} from "@/lib/product-facts";

/**
 * MobileApplication — SOLO su homepage, /beta (pagina di download/signup) e
 * altre pagine prodotto esplicite. Mai nel layout globale: prima veniva
 * emessa su ogni pagina marketing, inclusi tutti gli articoli del blog
 * ("MobileApplication non emessa indiscriminatamente sugli articoli").
 *
 * Android e iOS sono piattaforme diverse con fonti dati diverse — descrizione
 * e featureList sono SEPARATE per piattaforma (APP_DESCRIPTIONS_ANDROID/IOS,
 * APP_FEATURE_LIST_ANDROID/IOS in lib/product-facts.ts). Prima il nodo iOS
 * riusava la descrizione Android e citava Galaxy Watch/Wear OS — un'app iOS
 * non può leggere Health Connect (Android-only): iOS legge Apple Salute
 * (HealthKit) nativamente e si collega via Bluetooth diretto al Colmi Ring.
 *
 * Altre correzioni:
 *  - `offers`: SOLO il download gratuito (price: 0) — vedi `appOffers()` in
 *    lib/product-facts.ts. Prima l'array includeva anche un secondo Offer
 *    per lo sblocco Pro con un prezzo EUR fisso; quel prezzo è un'unica
 *    cifra applicata a ogni storefront senza conversione reale (Apple/Google
 *    gestiscono il prezzo per territorio lato loro), quindi non è un fatto
 *    verificato da dichiarare in dati strutturati. Il prezzo va comunicato
 *    come "prezzo localizzato mostrato dallo store" nel copy testuale, mai
 *    come `price`/`priceCurrency` JSON-LD.
 *  - minOsVersion iOS: "iOS 14.0" (verificato sulla scheda live App Store),
 *    prima "iOS 15.0" qui e "iOS 16+" in lib/providers/data.ts — due fonti
 *    in disaccordo fra loro.
 *  - Il nodo iOS è emesso incondizionatamente: l'app è live sull'App Store
 *    oggi, incluse tutte le storefront UE (verificato 2026-07-13, vedi
 *    lib/product-facts.ts). `description` include IOS_REGIONS_NOTE
 *    (localizzato) per rendere esplicita la copertura UE senza un
 *    `areaServed` fuorviante.
 *  - Nessun `aggregateRating`/`review`: non esistono recensioni verificate da
 *    mostrare, e non se ne inventano.
 *  - `softwareVersion` rimosso: nessun meccanismo in questo repo legge la
 *    versione live pubblicata sugli store — vedi lib/product-facts.ts.
 */

/** Costruzione dati pura (nessun JSX) — testabile in isolamento. */
export function mobileApplicationJsonLdData(locale: Locale) {
  const lang = schemaLanguage(locale);

  const androidNode = {
    "@type": "MobileApplication",
    "@id": `${SITE_URL}#mobile-app`,
    name: PRODUCT_NAME,
    alternateName: "FitMesh Android Health Tracker",
    description: APP_DESCRIPTIONS_ANDROID[locale] ?? APP_DESCRIPTIONS_ANDROID.en,
    operatingSystem: `${AVAILABILITY.android.minOsVersion} and up`,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Fitness",
    inLanguage: lang,
    offers: appOffers("android"),
    url: PLAY_STORE_URL,
    downloadUrl: PLAY_STORE_URL,
    publisher: organizationCompactRef(),
    image: `${SITE_URL}/icon-square.png`,
    screenshot: androidScreenshots(locale),
    featureList: APP_FEATURE_LIST_ANDROID[locale] ?? APP_FEATURE_LIST_ANDROID.en,
  };

  const iosNode = {
    "@type": "MobileApplication",
    "@id": `${SITE_URL}#mobile-app-ios`,
    name: PRODUCT_NAME,
    alternateName: "FitMesh iOS Health Tracker",
    description: `${APP_DESCRIPTIONS_IOS[locale] ?? APP_DESCRIPTIONS_IOS.en} ${IOS_REGIONS_NOTE[locale] ?? IOS_REGIONS_NOTE.en}`,
    operatingSystem: `${AVAILABILITY.ios.minOsVersion} and up`,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Fitness",
    inLanguage: lang,
    offers: appOffers("ios"),
    url: AVAILABILITY.ios.storeUrl,
    downloadUrl: AVAILABILITY.ios.storeUrl,
    publisher: organizationCompactRef(),
    image: `${SITE_URL}/icon-square.png`,
    featureList: APP_FEATURE_LIST_IOS[locale] ?? APP_FEATURE_LIST_IOS.en,
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
