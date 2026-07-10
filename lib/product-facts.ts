/**
 * lib/product-facts.ts — UNICA FONTE DI VERITÀ per i fatti prodotto
 * machine-readable (JSON-LD, /llms.txt, guardrail di coerenza).
 *
 * Regola: se un fatto vive già in un altro modulo "source of truth"
 * (prezzi in lib/pricing.ts, iOS/geo in lib/flags.ts, provider in
 * lib/providers/data.ts), questo file lo IMPORTA e lo ricompone — non lo
 * ridichiara mai. Se un dato cambia in continuo e non può essere letto qui
 * in modo affidabile (es. il conteggio LIVE dei founder rimasti, che dipende
 * da una query Supabase runtime), va OMESSO, non hardcodato: vedi
 * `FOUNDER_PROGRAM` sotto, che espone solo i fatti stabili (tot. posti,
 * beneficio) e rimanda a `/{locale}/beta` per il numero live.
 *
 * Consumato da: components/seo/*JsonLd.tsx, app/(frontend)/.../layout.tsx,
 * app/(frontend)/.../page.tsx, lib/llms-txt.ts, tools/check-llms-consistency.ts.
 */

import type { Locale } from "@/lib/i18n";
import {
  PRICE_LIFETIME_ANDROID_RAW,
  PRICE_LIFETIME_IOS_RAW,
  PRICE_SUB_6M_RAW,
} from "@/lib/pricing";
import { APPLE_STORE_URL, APPLE_APP_ID } from "@/lib/flags";
import { PROVIDERS, type ProviderStatus } from "@/lib/providers/data";

// ── Identità e URL canonici ────────────────────────────────────────────────

export const SITE_URL = "https://www.fitmesh.fit";
export const PRODUCT_NAME = "FitMesh Sync";

export const ANDROID_PACKAGE = "com.fitmeshsync.app";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

// App Store: riesportato da lib/flags.ts, che resta l'unica fonte per
// APPLE_APP_ID/APPLE_STORE_URL (governano anche lo Smart App Banner iOS).
export { APPLE_STORE_URL, APPLE_APP_ID };

// ── Disponibilità piattaforme ───────────────────────────────────────────────
/**
 * Android: live ovunque, nessuna limitazione geografica.
 *
 * iOS: l'app è approvata da Apple ed è già live sull'App Store fuori dai 27
 * paesi UE (vedi lib/flags.ts EU27/isIosAvailable — anche con il flag globale
 * NEXT_PUBLIC_IOS_ENABLED spento, isIosAvailable() ritorna true per qualunque
 * paese non-UE). La disponibilità nell'UE è in corso di rollout, in attesa
 * della verifica "trader status" DSA. Questo è un fatto di prodotto stabile
 * (non dipende dal toggle, che gestisce solo la UI interattiva) — per questo
 * qui è rappresentato come fatto fisso, non come lettura del flag.
 */
export const AVAILABILITY = {
  android: {
    live: true,
    storeUrl: PLAY_STORE_URL,
    regions: "worldwide" as const,
    minOsVersion: "Android 8.0",
  },
  ios: {
    live: true,
    storeUrl: APPLE_STORE_URL,
    regions: "worldwide-outside-eu" as const,
    regionsNote:
      "Live on the App Store outside the European Union. EU availability is rolling out, pending DSA trader-status verification.",
    minOsVersion: "iOS 15.0",
  },
} as const;

// ── Stato prodotto ──────────────────────────────────────────────────────────
/**
 * Non è una closed beta: il download è pubblico (Play Store, App Store fuori
 * UE) e l'iscrizione a /beta è aperta a chiunque. "Founder" è una promozione
 * prezzo a tempo/posti limitati sopra un prodotto già pubblico, non un
 * programma a inviti.
 */
export const PRODUCT_STATUS = {
  stage: "public",
  isClosedBeta: false,
  summary:
    "Publicly downloadable on Google Play and (outside the EU) the App Store, with an open early-adopter 'Founder' pricing promotion — not invite-only or access-gated.",
} as const;

// ── Programma Founder ───────────────────────────────────────────────────────
/**
 * `totalSeats` è stabile (cifra di programma, confermata in lib/pricing.ts,
 * components/FounderBanner.tsx, app/api/v1/beta/spots/route.ts). Il numero di
 * posti GIÀ USATI cambia in continuo (query Supabase a runtime): non va
 * hardcodato qui, va letto live su /{locale}/beta.
 */
export const FOUNDER_PROGRAM = {
  totalSeats: 1000,
  benefit: "lifetime Pro access, free, no review required",
  liveCountPath: "/beta",
} as const;

// ── Prezzi e trial ──────────────────────────────────────────────────────────
// Valori raw riesportati da lib/pricing.ts (unica fonte per i prezzi).
export const PRICING_FACTS = {
  lifetimeAndroid: { amount: PRICE_LIFETIME_ANDROID_RAW, currency: "EUR" },
  lifetimeIos: { amount: PRICE_LIFETIME_IOS_RAW, currency: "EUR" },
  subSixMonths: { amount: PRICE_SUB_6M_RAW, currency: "EUR" },
  /** Il download dell'app è sempre gratuito: i prezzi sopra sono acquisti in-app per sbloccare Pro. */
  appDownloadIsFree: true,
  trialDays: 14,
} as const;

/** Offer array standard per un MobileApplication/SoftwareApplication: download gratis + sblocco Pro in-app. */
export function appOffers(platform: "android" | "ios") {
  const lifetime = platform === "android" ? PRICING_FACTS.lifetimeAndroid : PRICING_FACTS.lifetimeIos;
  return [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      category: "free",
      name: "App download",
    },
    {
      "@type": "Offer",
      price: lifetime.amount,
      priceCurrency: lifetime.currency,
      category: "OneTimePurchase",
      name: "FitMesh Pro (lifetime unlock, in-app purchase)",
    },
  ];
}

// ── Funzionalità disponibili vs roadmap ─────────────────────────────────────
// Descrizioni feature riusate da Organization/MobileApplication JSON-LD.
export const ORG_DESCRIPTIONS: Record<Locale, string> = {
  it: "FitMesh Sync sincronizza i dati del tuo smartwatch su una dashboard personale privacy-first. Galaxy Watch, Wear OS, Health Connect.",
  en: "FitMesh Sync mirrors your smartwatch data to a privacy-first personal dashboard. Galaxy Watch, Wear OS, Health Connect.",
  es: "FitMesh Sync sincroniza los datos de tu smartwatch en un panel personal centrado en la privacidad. Galaxy Watch, Wear OS, Health Connect.",
  de: "FitMesh Sync synchronisiert deine Smartwatch-Daten mit einem datenschutzorientierten persönlichen Dashboard. Galaxy Watch, Wear OS, Health Connect.",
  pt: "O FitMesh Sync sincroniza os dados do seu smartwatch com um painel pessoal focado na privacidade. Galaxy Watch, Wear OS, Health Connect.",
  fr: "FitMesh Sync synchronise les données de votre montre connectée avec un tableau de bord personnel axé sur la confidentialité. Galaxy Watch, Wear OS, Health Connect.",
  pl: "FitMesh Sync synchronizuje dane Twojego smartwatcha z osobistym panelem, który stawia prywatność na pierwszym miejscu. Galaxy Watch, Wear OS, Health Connect.",
  tr: "FitMesh Sync, akıllı saatinizin verilerini gizlilik öncelikli kişisel bir panele yansıtır. Galaxy Watch, Wear OS, Health Connect.",
  nl: "FitMesh Sync spiegelt de data van je smartwatch naar een privacy-first persoonlijk dashboard. Galaxy Watch, Wear OS, Health Connect.",
  ja: "FitMesh Syncは、スマートウォッチのデータをプライバシーファーストな個人ダッシュボードに同期します。Galaxy Watch、Wear OS、Health Connect。",
  ko: "FitMesh Sync는 스마트워치 데이터를 개인정보 보호를 최우선으로 하는 개인 대시보드에 동기화합니다. Galaxy Watch, Wear OS, Health Connect.",
  sv: "FitMesh Sync speglar din smartklockas data till en integritetsfokuserad personlig dashboard. Galaxy Watch, Wear OS, Health Connect.",
  da: "FitMesh Sync spejler dit smartwatchs data til et privatlivsfokuseret personligt dashboard. Galaxy Watch, Wear OS, Health Connect.",
  no: "FitMesh Sync speiler smartklokkens data til et personvernfokusert personlig dashbord. Galaxy Watch, Wear OS, Health Connect.",
  fi: "FitMesh Sync peilaa älykellosi tiedot henkilökohtaiseen koontinäyttöön. Yksityisyys edellä. Galaxy Watch, Wear OS, Health Connect.",
};

export const APP_DESCRIPTIONS: Record<Locale, string> = {
  it: "Sincronizza Galaxy Watch e Wear OS con una dashboard premium: passi, battito, sonno, calorie e VO₂ max. Niente cloud opachi.",
  en: "Mirror Galaxy Watch and Wear OS data to a premium personal dashboard: steps, heart rate, sleep, calories, VO₂ max. No opaque clouds.",
  es: "Sincroniza Galaxy Watch y Wear OS con un panel premium: pasos, frecuencia cardíaca, sueño, calorías y VO₂ máx. Sin nubes opacas.",
  de: "Synchronisiert Galaxy Watch und Wear OS mit einem Premium-Dashboard: Schritte, Herzfrequenz, Schlaf, Kalorien und VO₂ max. Keine undurchsichtigen Clouds.",
  pt: "Sincroniza Galaxy Watch e Wear OS com um painel premium: passos, frequência cardíaca, sono, calorias e VO₂ máx. Sem nuvens opacas.",
  fr: "Synchronise Galaxy Watch et Wear OS avec un tableau de bord premium : pas, fréquence cardiaque, sommeil, calories et VO₂ max. Aucun cloud opaque.",
  pl: "Synchronizuje Galaxy Watch i Wear OS z panelem premium: kroki, tętno, sen, kalorie i VO₂ max. Bez ukrytych chmur.",
  tr: "Galaxy Watch ve Wear OS verilerini premium bir kişisel panele yansıtır: adımlar, kalp atışı, uyku, kalori ve VO₂ maks. Opak bulut yok.",
  nl: "Spiegelt Galaxy Watch en Wear OS data naar een premium persoonlijk dashboard: stappen, hartslag, slaap, calorieën en VO₂ max. Geen ondoorzichtige clouds.",
  ja: "Galaxy WatchとWear OSのデータをプレミアムダッシュボードへ同期: 歩数、心拍数、睡眠、カロリー、VO₂ max。プライバシーファースト。",
  ko: "Galaxy Watch와 Wear OS 데이터를 프리미엄 대시보드에 동기화: 걸음 수, 심박수, 수면, 칼로리, VO₂ max. 개인정보 보호 최우선.",
  sv: "Speglar data från Galaxy Watch och Wear OS till en premium personlig dashboard: steg, puls, sömn, kalorier och VO₂ max. Inga oklara moln.",
  da: "Spejler data fra Galaxy Watch og Wear OS til et premium personligt dashboard: skridt, puls, søvn, kalorier og VO₂ max. Ingen uklare skyer.",
  no: "Speiler data fra Galaxy Watch og Wear OS til et premium personlig dashbord: skritt, puls, søvn, kalorier og VO₂ max. Ingen uklare skyer.",
  fi: "Peilaa Galaxy Watchin ja Wear OS:n tiedot premium-koontinäyttöön: askeleet, syke, uni, kalorit ja VO₂ max. Ei epämääräisiä pilviä.",
};

export const APP_FEATURE_LIST: Record<"it" | "en", string[]> = {
  it: [
    "Sincronizza Galaxy Watch, Wear OS e wearable Health Connect",
    "Dashboard premium per passi, battito, sonno, calorie, VO2 max",
    "Mesh Famiglia — monitora salute familiari (passi, sonno, attivita)",
    "Privacy-first: server EU, GDPR, niente tracker o cloud opachi",
    "Offline-first con sync background ogni 15-30 minuti",
  ],
  en: [
    "Sync Galaxy Watch, Wear OS, and Health Connect wearables",
    "Premium dashboard for steps, heart rate, sleep, calories, VO2 max",
    "Family Mesh — monitor family health (steps, sleep, activity)",
    "Privacy-first: EU servers, GDPR, no trackers or opaque clouds",
    "Offline-first with background sync every 15-30 minutes",
  ],
};

// versione app: NON esposta in JSON-LD/llms.txt. Non esiste un meccanismo che
// legga automaticamente la versione live pubblicata su Play/App Store al
// build time di questo sito: un valore hardcodato (es. "3.2.2") va stantio a
// ogni release e nessuno lo aggiorna. Per il principio "ometti invece di
// duplicare a mano", `softwareVersion` va omesso ovunque finché non esiste
// una fonte automatica (es. fetch dalla Play Developer API in build).

// ── Provider realmente supportati (derivati da lib/providers/data.ts) ──────
const LIVE_STATUSES = new Set<ProviderStatus>(["live", "live-basic"]);

export const SUPPORTED_PROVIDERS = PROVIDERS.filter((p) => LIVE_STATUSES.has(p.status)).map(
  (p) => p.name,
);

export const ROADMAP_PROVIDERS = PROVIDERS.filter((p) => !LIVE_STATUSES.has(p.status)).map(
  (p) => ({ name: p.name, status: p.status as ProviderStatus }),
);
