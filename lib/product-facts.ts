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
 * Android e iOS sono piattaforme DIVERSE con fonti dati diverse — Android
 * legge da Health Connect (Galaxy Watch, Wear OS, Fitbit, Garmin, ecc.),
 * iOS legge nativamente da Apple Health/HealthKit + si collega via
 * Bluetooth diretto al Colmi Ring (MAI Health Connect, che è Android-only).
 * Per questo descrizioni, feature list e provider supportati sono separati
 * per piattaforma qui sotto (niente `PRICE`/`FEATURE` generico condiviso
 * che finisce per descrivere Android come se valesse anche per iOS).
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
 * Android: live ovunque, nessuna limitazione geografica. Legge da Health
 * Connect (Galaxy Watch, Wear OS, Fitbit, Garmin, ecc. — MAI Apple Health).
 *
 * iOS: verificato direttamente sulla scheda live dell'App Store (2026-07-10,
 * app id 6779751708) — l'app è pubblicata e scaricabile oggi, "Requires iOS
 * 14.0 or later", legge Apple Salute/HealthKit e si collega DIRETTAMENTE via
 * Bluetooth al Colmi Ring (nessun passaggio da Health Connect, che è
 * Android-only). Fuori dai 27 paesi UE è già disponibile a tutti; nell'UE il
 * rollout è in corso (verifica "trader status" DSA — vedi lib/flags.ts). È
 * un fatto di prodotto stabile (non dipende dal toggle NEXT_PUBLIC_IOS_ENABLED,
 * che gestisce solo la UI interattiva) — per questo qui è rappresentato come
 * fatto fisso, non come lettura del flag.
 */
export const AVAILABILITY = {
  android: {
    live: true,
    storeUrl: PLAY_STORE_URL,
    regions: "worldwide" as const,
    minOsVersion: "Android 8.0",
    dataSource: "Health Connect" as const,
  },
  ios: {
    live: true,
    storeUrl: APPLE_STORE_URL,
    regions: "worldwide-outside-eu" as const,
    minOsVersion: "iOS 14.0",
    /** Apple Health/HealthKit nativo + Bluetooth diretto al Colmi Ring — MAI Health Connect (Android-only). */
    dataSource: "Apple Health (HealthKit) + Colmi Ring via Bluetooth diretto" as const,
  },
} as const;

/** "Live sull'App Store fuori UE, rollout UE in corso" — per JSON-LD/llms.txt, localizzato. */
export const IOS_REGIONS_NOTE: Record<Locale, string> = {
  it: "Live sull'App Store fuori dall'Unione Europea. La disponibilità nell'UE è in fase di rollout, in attesa della verifica dello stato di trader DSA.",
  en: "Live on the App Store outside the European Union. EU availability is rolling out, pending DSA trader-status verification.",
  es: "Disponible en la App Store fuera de la Unión Europea. La disponibilidad en la UE se está desplegando, pendiente de la verificación del estado de comerciante DSA.",
  de: "Im App Store außerhalb der Europäischen Union verfügbar. Die Verfügbarkeit in der EU wird schrittweise ausgerollt, vorbehaltlich der DSA-Händlerstatus-Prüfung.",
  pt: "Disponível na App Store fora da União Europeia. A disponibilidade na UE está sendo lançada gradualmente, aguardando a verificação do status de comerciante DSA.",
  fr: "Disponible sur l'App Store en dehors de l'Union européenne. La disponibilité dans l'UE est en cours de déploiement, en attente de la vérification du statut de commerçant DSA.",
  pl: "Dostępne w App Store poza Unią Europejską. Dostępność w UE jest wdrażana stopniowo, w oczekiwaniu na weryfikację statusu przedsiębiorcy DSA.",
  tr: "Avrupa Birliği dışında App Store'da kullanılabilir. AB'de kullanılabilirlik, DSA satıcı durumu doğrulaması beklenirken kademeli olarak devreye alınıyor.",
  nl: "Beschikbaar in de App Store buiten de Europese Unie. De beschikbaarheid in de EU wordt geleidelijk uitgerold, in afwachting van de DSA-handelaarsstatuscontrole.",
  ja: "欧州連合（EU）域外ではApp Storeで提供中です。EUでの提供は、DSAトレーダーステータスの確認待ちで順次展開中です。",
  ko: "유럽연합(EU) 외 지역에서는 App Store에 출시되어 있습니다. EU 내 이용 가능 여부는 DSA 판매자 상태 확인을 기다리며 단계적으로 배포되고 있습니다.",
  sv: "Tillgänglig i App Store utanför Europeiska unionen. Tillgängligheten i EU rullas ut stegvis, i väntan på DSA-handlarstatuskontroll.",
  da: "Tilgængelig i App Store uden for Den Europæiske Union. Tilgængeligheden i EU rulles gradvist ud i afventning af DSA-forhandlerstatusverifikation.",
  no: "Tilgjengelig i App Store utenfor EU. Tilgjengeligheten i EU rulles gradvis ut, i påvente av DSA-forhandlerstatusverifisering.",
  fi: "Saatavilla App Storessa Euroopan unionin ulkopuolella. Saatavuus EU:ssa otetaan käyttöön vaiheittain DSA-kauppiasstatuksen vahvistusta odotettaessa.",
};

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
    "Publicly downloadable on Google Play and the App Store (outside the EU), with an open early-adopter 'Founder' pricing promotion — not invite-only or access-gated.",
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

/**
 * Offer array per un MobileApplication/SoftwareApplication: SOLO il download
 * gratuito (price: 0). L'unlock Pro in-app NON è più pubblicato in JSON-LD:
 * `PRICING_FACTS.lifetime*` è una cifra EUR unica applicata a ogni store/
 * mercato senza conversione reale, e non c'è in questo repo nessuna fonte
 * che confermi un prezzo preciso per uno storefront/valuta specifico (Apple
 * gestisce prezzo per territorio via price tier in App Store Connect, a cui
 * questo repo non ha accesso). Dichiarare un `price`/`priceCurrency` fisso
 * per un IAP il cui importo reale varia per storefront sarebbe una claim non
 * verificata in dati strutturati che Google/gli assistenti AI trattano come
 * fatto. Il prezzo va mostrato SOLO come "prezzo localizzato mostrato dallo
 * store" in copy testuale (mai in JSON-LD) finché non esiste una fonte
 * verificata per storefront. `platform` è tenuto nella firma per stabilità
 * delle chiamate esistenti, anche se oggi non influenza più l'output.
 */
export function appOffers(platform: "android" | "ios") {
  void platform;
  return [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      category: "free",
      name: "App download",
    },
  ];
}

// ── Descrizioni Organization (piattaforma-neutre) ───────────────────────────
export const ORG_DESCRIPTIONS: Record<Locale, string> = {
  it: "FitMesh Sync sincronizza i dati del tuo smartwatch su una dashboard personale privacy-first, su Android (Health Connect) e iPhone (Apple Salute).",
  en: "FitMesh Sync mirrors your smartwatch data to a privacy-first personal dashboard, on Android (Health Connect) and iPhone (Apple Health).",
  es: "FitMesh Sync sincroniza los datos de tu smartwatch en un panel personal centrado en la privacidad, en Android (Health Connect) y iPhone (Apple Salud).",
  de: "FitMesh Sync synchronisiert deine Smartwatch-Daten mit einem datenschutzorientierten persönlichen Dashboard, auf Android (Health Connect) und iPhone (Apple Health).",
  pt: "O FitMesh Sync sincroniza os dados do seu smartwatch com um painel pessoal focado na privacidade, no Android (Health Connect) e no iPhone (Apple Saúde).",
  fr: "FitMesh Sync synchronise les données de votre montre connectée avec un tableau de bord personnel axé sur la confidentialité, sur Android (Health Connect) et iPhone (Apple Santé).",
  pl: "FitMesh Sync synchronizuje dane Twojego smartwatcha z osobistym panelem, który stawia prywatność na pierwszym miejscu, na Androidzie (Health Connect) i iPhonie (Apple Zdrowie).",
  tr: "FitMesh Sync, akıllı saatinizin verilerini gizlilik öncelikli kişisel bir panele, Android'de (Health Connect) ve iPhone'da (Apple Sağlık) yansıtır.",
  nl: "FitMesh Sync spiegelt de data van je smartwatch naar een privacy-first persoonlijk dashboard, op Android (Health Connect) en iPhone (Apple Gezondheid).",
  ja: "FitMesh Syncは、スマートウォッチのデータをプライバシーファーストな個人ダッシュボードに、Android（Health Connect）とiPhone（Apple ヘルスケア）の両方で同期します。",
  ko: "FitMesh Sync는 스마트워치 데이터를 개인정보 보호를 최우선으로 하는 개인 대시보드에 Android(Health Connect)와 iPhone(Apple 건강) 모두에서 동기화합니다.",
  sv: "FitMesh Sync speglar din smartklockas data till en integritetsfokuserad personlig dashboard, på Android (Health Connect) och iPhone (Apple Hälsa).",
  da: "FitMesh Sync spejler dit smartwatchs data til et privatlivsfokuseret personligt dashboard, på Android (Health Connect) og iPhone (Apple Sundhed).",
  no: "FitMesh Sync speiler smartklokkens data til et personvernfokusert personlig dashbord, på Android (Health Connect) og iPhone (Apple Helse).",
  fi: "FitMesh Sync peilaa älykellosi tiedot henkilökohtaiseen koontinäyttöön. Yksityisyys edellä, Androidilla (Health Connect) ja iPhonella (Apple Terveys).",
};

// ── Descrizioni + feature MobileApplication, SEPARATE per piattaforma ──────
// Android legge Health Connect (Galaxy Watch, Wear OS, ecc.); iOS legge
// Apple Salute/HealthKit + Colmi Ring via Bluetooth diretto. Non condividere
// mai lo stesso testo fra le due: prima di questo sprint la descrizione iOS
// riusava quella Android (menzionava Galaxy Watch/Wear OS su iOS, dove non
// esistono/non si applicano).
export const APP_DESCRIPTIONS_ANDROID: Record<Locale, string> = {
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

export const APP_DESCRIPTIONS_IOS: Record<Locale, string> = {
  it: "Sincronizza Apple Salute e il Colmi Ring con una dashboard premium: passi, battito, sonno, calorie e VO₂ max. Niente cloud opachi.",
  en: "Mirror Apple Health and Colmi Ring data to a premium personal dashboard: steps, heart rate, sleep, calories, VO₂ max. No opaque clouds.",
  es: "Sincroniza Apple Salud y el anillo Colmi con un panel premium: pasos, frecuencia cardíaca, sueño, calorías y VO₂ máx. Sin nubes opacas.",
  de: "Synchronisiert Apple Health und den Colmi Ring mit einem Premium-Dashboard: Schritte, Herzfrequenz, Schlaf, Kalorien und VO₂ max. Keine undurchsichtigen Clouds.",
  pt: "Sincroniza o Apple Saúde e o anel Colmi com um painel premium: passos, frequência cardíaca, sono, calorias e VO₂ máx. Sem nuvens opacas.",
  fr: "Synchronise Apple Santé et la bague Colmi avec un tableau de bord premium : pas, fréquence cardiaque, sommeil, calories et VO₂ max. Aucun cloud opaque.",
  pl: "Synchronizuje Apple Zdrowie i pierścień Colmi z panelem premium: kroki, tętno, sen, kalorie i VO₂ max. Bez ukrytych chmur.",
  tr: "Apple Sağlık ve Colmi Ring verilerini premium bir kişisel panele yansıtır: adımlar, kalp atışı, uyku, kalori ve VO₂ maks. Opak bulut yok.",
  nl: "Spiegelt Apple Gezondheid en Colmi Ring-data naar een premium persoonlijk dashboard: stappen, hartslag, slaap, calorieën en VO₂ max. Geen ondoorzichtige clouds.",
  ja: "Apple ヘルスケアとColmi Ringのデータをプレミアムダッシュボードへ同期: 歩数、心拍数、睡眠、カロリー、VO₂ max。プライバシーファースト。",
  ko: "Apple 건강과 Colmi Ring 데이터를 프리미엄 대시보드에 동기화: 걸음 수, 심박수, 수면, 칼로리, VO₂ max. 개인정보 보호 최우선.",
  sv: "Speglar data från Apple Hälsa och Colmi Ring till en premium personlig dashboard: steg, puls, sömn, kalorier och VO₂ max. Inga oklara moln.",
  da: "Spejler data fra Apple Sundhed og Colmi Ring til et premium personligt dashboard: skridt, puls, søvn, kalorier og VO₂ max. Ingen uklare skyer.",
  no: "Speiler data fra Apple Helse og Colmi Ring til et premium personlig dashbord: skritt, puls, søvn, kalorier og VO₂ max. Ingen uklare skyer.",
  fi: "Peilaa Apple Terveys- ja Colmi Ring -tiedot premium-koontinäyttöön: askeleet, syke, uni, kalorit ja VO₂ max. Ei epämääräisiä pilviä.",
};

export const APP_FEATURE_LIST_ANDROID: Record<Locale, string[]> = {
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
  es: [
    "Sincroniza Galaxy Watch, Wear OS y wearables compatibles con Health Connect",
    "Panel premium para pasos, frecuencia cardíaca, sueño, calorías, VO2 max",
    "Mesh Familiar — supervisa la salud familiar (pasos, sueño, actividad)",
    "Privacidad ante todo: servidores UE, RGPD, sin rastreadores ni nubes opacas",
    "Offline-first con sincronización en segundo plano cada 15-30 minutos",
  ],
  de: [
    "Synchronisiert Galaxy Watch, Wear OS und Health-Connect-Wearables",
    "Premium-Dashboard für Schritte, Herzfrequenz, Schlaf, Kalorien, VO2max",
    "Familien-Mesh — überwacht die Gesundheit der Familie (Schritte, Schlaf, Aktivität)",
    "Datenschutz zuerst: EU-Server, DSGVO, keine Tracker oder undurchsichtigen Clouds",
    "Offline-first mit Hintergrundsynchronisierung alle 15-30 Minuten",
  ],
  pt: [
    "Sincroniza Galaxy Watch, Wear OS e wearables compatíveis com Health Connect",
    "Painel premium para passos, frequência cardíaca, sono, calorias, VO2 max",
    "Mesh Família — monitora a saúde da família (passos, sono, atividade)",
    "Privacidade em primeiro lugar: servidores UE, RGPD, sem rastreadores ou nuvens opacas",
    "Offline-first com sincronização em segundo plano a cada 15-30 minutos",
  ],
  fr: [
    "Synchronise Galaxy Watch, Wear OS et les wearables compatibles Health Connect",
    "Tableau de bord premium pour les pas, la fréquence cardiaque, le sommeil, les calories, le VO2 max",
    "Family Mesh — suivez la santé de la famille (pas, sommeil, activité)",
    "Confidentialité avant tout : serveurs UE, RGPD, aucun tracker ni cloud opaque",
    "Offline-first avec synchronisation en arrière-plan toutes les 15-30 minutes",
  ],
  pl: [
    "Synchronizuje Galaxy Watch, Wear OS i wearables zgodne z Health Connect",
    "Panel premium dla kroków, tętna, snu, kalorii, VO2 max",
    "Mesh Rodzinny — monitoruje zdrowie rodziny (kroki, sen, aktywność)",
    "Prywatność przede wszystkim: serwery UE, RODO, brak trackerów i nieprzejrzystych chmur",
    "Offline-first z synchronizacją w tle co 15-30 minut",
  ],
  tr: [
    "Galaxy Watch, Wear OS ve Health Connect uyumlu giyilebilirleri senkronize eder",
    "Adımlar, kalp atışı, uyku, kalori, VO2 max için premium pano",
    "Aile Mesh — aile sağlığını izler (adımlar, uyku, aktivite)",
    "Gizlilik öncelikli: AB sunucuları, GDPR, izleyici veya opak bulut yok",
    "Her 15-30 dakikada bir arka plan senkronizasyonu ile offline-first",
  ],
  nl: [
    "Synchroniseert Galaxy Watch, Wear OS en Health Connect-wearables",
    "Premium dashboard voor stappen, hartslag, slaap, calorieën, VO2 max",
    "Family Mesh — houd de gezondheid van het gezin in de gaten (stappen, slaap, activiteit)",
    "Privacy-first: EU-servers, AVG, geen trackers of ondoorzichtige clouds",
    "Offline-first met achtergrondsynchronisatie elke 15-30 minuten",
  ],
  ja: [
    "Galaxy Watch、Wear OS、Health Connect対応ウェアラブルを同期",
    "歩数、心拍数、睡眠、カロリー、VO2 maxのプレミアムダッシュボード",
    "Family Mesh — 家族の健康を見守る（歩数、睡眠、活動量）",
    "プライバシーファースト：EUサーバー、GDPR準拠、トラッカーや不透明なクラウドなし",
    "15〜30分ごとのバックグラウンド同期によるオフラインファースト",
  ],
  ko: [
    "Galaxy Watch, Wear OS 및 Health Connect 웨어러블 동기화",
    "걸음 수, 심박수, 수면, 칼로리, VO2 max를 위한 프리미엄 대시보드",
    "Family Mesh — 가족 건강 모니터링 (걸음 수, 수면, 활동)",
    "개인정보 보호 최우선: EU 서버, GDPR, 트래커나 불투명한 클라우드 없음",
    "15-30분마다 백그라운드 동기화하는 오프라인 우선 설계",
  ],
  sv: [
    "Synkroniserar Galaxy Watch, Wear OS och Health Connect-wearables",
    "Premium dashboard för steg, puls, sömn, kalorier, VO2 max",
    "Family Mesh — övervaka familjens hälsa (steg, sömn, aktivitet)",
    "Integritet först: EU-servrar, GDPR, inga spårare eller oklara moln",
    "Offline-first med bakgrundssynkronisering var 15-30:e minut",
  ],
  da: [
    "Synkroniserer Galaxy Watch, Wear OS og Health Connect-wearables",
    "Premium dashboard til skridt, puls, søvn, kalorier, VO2 max",
    "Family Mesh — hold øje med familiens sundhed (skridt, søvn, aktivitet)",
    "Privatliv først: EU-servere, GDPR, ingen trackere eller uklare skyer",
    "Offline-first med baggrundssynkronisering hvert 15.-30. minut",
  ],
  no: [
    "Synkroniserer Galaxy Watch, Wear OS og Health Connect-wearables",
    "Premium dashbord for skritt, puls, søvn, kalorier, VO2 max",
    "Family Mesh — overvåk familiens helse (skritt, søvn, aktivitet)",
    "Personvern først: EU-servere, GDPR, ingen sporere eller uklare skyer",
    "Offline-first med bakgrunnssynkronisering hvert 15.-30. minutt",
  ],
  fi: [
    "Synkronoi Galaxy Watchin, Wear OS:n ja Health Connect -yhteensopivat puettavat laitteet",
    "Premium-koontinäyttö askelille, sykkeelle, unelle, kaloreille, VO2 maxille",
    "Family Mesh — seuraa perheen terveyttä (askeleet, uni, aktiivisuus)",
    "Yksityisyys edellä: EU-palvelimet, GDPR, ei seurantaa tai epämääräisiä pilviä",
    "Offline-first-toiminto taustasynkronoinnilla 15-30 minuutin välein",
  ],
};

export const APP_FEATURE_LIST_IOS: Record<Locale, string[]> = {
  it: [
    "Sincronizza Apple Salute (HealthKit) e il Colmi Ring via Bluetooth diretto",
    "Dashboard premium per passi, battito, sonno, calorie, VO2 max",
    "Mesh Famiglia — monitora salute familiari (passi, sonno, attivita)",
    "Privacy-first: server EU, GDPR, niente tracker o cloud opachi",
    "Live sull'App Store nel mondo, rollout UE in corso",
  ],
  en: [
    "Sync Apple Health (HealthKit) and the Colmi Ring via direct Bluetooth",
    "Premium dashboard for steps, heart rate, sleep, calories, VO2 max",
    "Family Mesh — monitor family health (steps, sleep, activity)",
    "Privacy-first: EU servers, GDPR, no trackers or opaque clouds",
    "Live on the App Store worldwide, EU rollout in progress",
  ],
  es: [
    "Sincroniza Apple Salud (HealthKit) y el anillo Colmi por Bluetooth directo",
    "Panel premium para pasos, frecuencia cardíaca, sueño, calorías, VO2 max",
    "Mesh Familiar — supervisa la salud familiar (pasos, sueño, actividad)",
    "Privacidad ante todo: servidores UE, RGPD, sin rastreadores ni nubes opacas",
    "Disponible en la App Store en todo el mundo, despliegue en la UE en curso",
  ],
  de: [
    "Synchronisiert Apple Health (HealthKit) und den Colmi Ring per direktem Bluetooth",
    "Premium-Dashboard für Schritte, Herzfrequenz, Schlaf, Kalorien, VO2max",
    "Familien-Mesh — überwacht die Gesundheit der Familie (Schritte, Schlaf, Aktivität)",
    "Datenschutz zuerst: EU-Server, DSGVO, keine Tracker oder undurchsichtigen Clouds",
    "Weltweit im App Store live, EU-Rollout läuft",
  ],
  pt: [
    "Sincroniza o Apple Saúde (HealthKit) e o anel Colmi via Bluetooth direto",
    "Painel premium para passos, frequência cardíaca, sono, calorias, VO2 max",
    "Mesh Família — monitora a saúde da família (passos, sono, atividade)",
    "Privacidade em primeiro lugar: servidores UE, RGPD, sem rastreadores ou nuvens opacas",
    "Ativo na App Store em todo o mundo, lançamento na UE em andamento",
  ],
  fr: [
    "Synchronise Apple Santé (HealthKit) et la bague Colmi via Bluetooth direct",
    "Tableau de bord premium pour les pas, la fréquence cardiaque, le sommeil, les calories, le VO2 max",
    "Family Mesh — suivez la santé de la famille (pas, sommeil, activité)",
    "Confidentialité avant tout : serveurs UE, RGPD, aucun tracker ni cloud opaque",
    "Active sur l'App Store dans le monde entier, déploiement dans l'UE en cours",
  ],
  pl: [
    "Synchronizuje Apple Zdrowie (HealthKit) i pierścień Colmi przez bezpośredni Bluetooth",
    "Panel premium dla kroków, tętna, snu, kalorii, VO2 max",
    "Mesh Rodzinny — monitoruje zdrowie rodziny (kroki, sen, aktywność)",
    "Prywatność przede wszystkim: serwery UE, RODO, brak trackerów i nieprzejrzystych chmur",
    "Dostępny w App Store na całym świecie, wdrożenie w UE w toku",
  ],
  tr: [
    "Apple Sağlık (HealthKit) ve Colmi Ring'i doğrudan Bluetooth ile senkronize eder",
    "Adımlar, kalp atışı, uyku, kalori, VO2 max için premium pano",
    "Aile Mesh — aile sağlığını izler (adımlar, uyku, aktivite)",
    "Gizlilik öncelikli: AB sunucuları, GDPR, izleyici veya opak bulut yok",
    "Dünya genelinde App Store'da yayında, AB'de dağıtım sürüyor",
  ],
  nl: [
    "Synchroniseert Apple Gezondheid (HealthKit) en de Colmi Ring via directe Bluetooth",
    "Premium dashboard voor stappen, hartslag, slaap, calorieën, VO2 max",
    "Family Mesh — houd de gezondheid van het gezin in de gaten (stappen, slaap, activiteit)",
    "Privacy-first: EU-servers, AVG, geen trackers of ondoorzichtige clouds",
    "Wereldwijd live in de App Store, EU-uitrol bezig",
  ],
  ja: [
    "Apple ヘルスケア（HealthKit）とColmi Ringを直接Bluetoothで同期",
    "歩数、心拍数、睡眠、カロリー、VO2 maxのプレミアムダッシュボード",
    "Family Mesh — 家族の健康を見守る（歩数、睡眠、活動量）",
    "プライバシーファースト：EUサーバー、GDPR準拠、トラッカーや不透明なクラウドなし",
    "世界中のApp Storeで提供中、EUでの展開は進行中",
  ],
  ko: [
    "Apple 건강(HealthKit)과 Colmi Ring을 직접 블루투스로 동기화",
    "걸음 수, 심박수, 수면, 칼로리, VO2 max를 위한 프리미엄 대시보드",
    "Family Mesh — 가족 건강 모니터링 (걸음 수, 수면, 활동)",
    "개인정보 보호 최우선: EU 서버, GDPR, 트래커나 불투명한 클라우드 없음",
    "전 세계 App Store에 출시, EU 배포 진행 중",
  ],
  sv: [
    "Synkroniserar Apple Hälsa (HealthKit) och Colmi Ring via direkt Bluetooth",
    "Premium dashboard för steg, puls, sömn, kalorier, VO2 max",
    "Family Mesh — övervaka familjens hälsa (steg, sömn, aktivitet)",
    "Integritet först: EU-servrar, GDPR, inga spårare eller oklara moln",
    "Live i App Store världen över, EU-utrullning pågår",
  ],
  da: [
    "Synkroniserer Apple Sundhed (HealthKit) og Colmi Ring via direkte Bluetooth",
    "Premium dashboard til skridt, puls, søvn, kalorier, VO2 max",
    "Family Mesh — hold øje med familiens sundhed (skridt, søvn, aktivitet)",
    "Privatliv først: EU-servere, GDPR, ingen trackere eller uklare skyer",
    "Live i App Store på verdensplan, EU-udrulning i gang",
  ],
  no: [
    "Synkroniserer Apple Helse (HealthKit) og Colmi Ring via direkte Bluetooth",
    "Premium dashbord for skritt, puls, søvn, kalorier, VO2 max",
    "Family Mesh — overvåk familiens helse (skritt, søvn, aktivitet)",
    "Personvern først: EU-servere, GDPR, ingen sporere eller uklare skyer",
    "Live i App Store over hele verden, EU-utrulling pågår",
  ],
  fi: [
    "Synkronoi Apple Terveyden (HealthKit) ja Colmi Ringin suoralla Bluetooth-yhteydellä",
    "Premium-koontinäyttö askelille, sykkeelle, unelle, kaloreille, VO2 maxille",
    "Family Mesh — seuraa perheen terveyttä (askeleet, uni, aktiivisuus)",
    "Yksityisyys edellä: EU-palvelimet, GDPR, ei seurantaa tai epämääräisiä pilviä",
    "Käytössä App Storessa maailmanlaajuisesti, EU-käyttöönotto käynnissä",
  ],
};

// versione app: NON esposta in JSON-LD/llms.txt. Non esiste un meccanismo che
// legga automaticamente la versione live pubblicata su Play/App Store al
// build time di questo sito: un valore hardcodato (es. "3.2.2") va stantio a
// ogni release e nessuno lo aggiorna. Per il principio "ometti invece di
// duplicare a mano", `softwareVersion` va omesso ovunque finché non esiste
// una fonte automatica (es. fetch dalla Play Developer API in build).

// ── Provider realmente supportati, SEPARATI PER PIATTAFORMA ────────────────
// Niente verità globale derivata da un unico `status`: un provider live su
// Android non è automaticamente live su iOS (vedi Provider.platforms in
// lib/providers/data.ts — default ["android"] se omesso).
const LIVE_STATUSES = new Set<ProviderStatus>(["live", "live-basic"]);

function platformsOf(p: (typeof PROVIDERS)[number]): Array<"android" | "ios"> {
  return p.platforms ?? ["android"];
}

export const SUPPORTED_PROVIDERS_ANDROID = PROVIDERS.filter(
  (p) => LIVE_STATUSES.has(p.status) && platformsOf(p).includes("android"),
).map((p) => p.name);

export const SUPPORTED_PROVIDERS_IOS = PROVIDERS.filter(
  (p) => LIVE_STATUSES.has(p.status) && platformsOf(p).includes("ios"),
).map((p) => p.name);

export const ROADMAP_PROVIDERS_ANDROID = PROVIDERS.filter(
  (p) => !LIVE_STATUSES.has(p.status) && platformsOf(p).includes("android"),
).map((p) => ({ name: p.name, status: p.status as ProviderStatus }));

export const ROADMAP_PROVIDERS_IOS = PROVIDERS.filter(
  (p) => !LIVE_STATUSES.has(p.status) && platformsOf(p).includes("ios"),
).map((p) => ({ name: p.name, status: p.status as ProviderStatus }));
