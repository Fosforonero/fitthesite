/**
 * lib/product-facts.ts — UNICA FONTE DI VERITÀ per i fatti prodotto
 * machine-readable (JSON-LD, /llms.txt, guardrail di coerenza).
 *
 * Regola: se un fatto vive già in un altro modulo "source of truth"
 * (prezzi in lib/pricing.ts, iOS/geo in lib/flags.ts, provider in
 * lib/providers/data.ts), questo file lo IMPORTA e lo ricompone — non lo
 * ridichiara mai. Se un dato cambia in continuo e non può essere letto qui
 * in modo affidabile va OMESSO, non hardcodato: vedi `FOUNDER_PROGRAM` sotto,
 * che espone solo i fatti stabili (tot. posti, beneficio). Il contatore
 * pubblico dei posti Founder occupati è stato rimosso (Hotfix P0.6C,
 * vedi `founderAutoGrant.note` sotto): il conteggio non era riconciliato
 * con i grant realmente assegnati, quindi non va reintrodotto in nessuna
 * forma (badge, banner, endpoint) finché `founderAutoGrant.status` non è
 * `live_verified`.
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
 * Android-only). Disponibilità UE riverificata 2026-07-13 tramite l'API
 * pubblica di lookup Apple (`itunes.apple.com/lookup`) su tutti e 27 gli
 * storefront UE: resultCount 1 ovunque, stesso App ID, iOS 14.0+ — nessun
 * gating geografico residuo (vedi lib/locale-negotiation.ts per il routing
 * lingua, non correlato alla disponibilità store).
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
    /** Verificato sui 27 storefront UE (2026-07-13); non riverificato oggi ogni altro storefront Apple esistente. */
    regions: "eu-and-previously-verified-regions" as const,
    minOsVersion: "iOS 14.0",
    /** Apple Health/HealthKit nativo + Bluetooth diretto al Colmi Ring — MAI Health Connect (Android-only). */
    dataSource: "Apple Health (HealthKit) + Colmi Ring via Bluetooth diretto" as const,
  },
} as const;

/**
 * "Live sull'App Store, incluse le storefront UE" — per JSON-LD/llms.txt,
 * localizzato. Formulazione verificabile (27/27 storefront UE confermati
 * 2026-07-13): niente "worldwide" perché non è stato riverificato oggi ogni
 * storefront Apple esistente al mondo, solo i 27 UE.
 */
export const IOS_REGIONS_NOTE: Record<Locale, string> = {
  it: "Live sull'App Store, incluse tutte le storefront dell'Unione Europea.",
  en: "Live on the App Store, including European Union storefronts.",
  es: "Disponible en la App Store, incluidas todas las tiendas de la Unión Europea.",
  de: "Im App Store verfügbar, einschließlich aller Storefronts der Europäischen Union.",
  pt: "Disponível na App Store, incluindo todas as lojas da União Europeia.",
  fr: "Disponible sur l'App Store, y compris dans toutes les boutiques de l'Union européenne.",
  pl: "Dostępne w App Store, we wszystkich sklepach Unii Europejskiej.",
  tr: "Avrupa Birliği'ndeki tüm mağazalar dahil olmak üzere App Store'da kullanılabilir.",
  nl: "Beschikbaar in de App Store, inclusief alle winkels van de Europese Unie.",
  ja: "欧州連合（EU）内のすべてのストアフロントを含め、App Storeで提供中です。",
  ko: "유럽연합(EU) 내 모든 스토어프론트를 포함하여 App Store에서 이용 가능합니다.",
  sv: "Tillgänglig i App Store, inklusive alla butiker inom Europeiska unionen.",
  da: "Tilgængelig i App Store, inklusive alle butikker i Den Europæiske Union.",
  no: "Tilgjengelig i App Store, inkludert alle butikker i EU.",
  fi: "Saatavilla App Storessa, mukaan lukien kaikki Euroopan unionin kaupat.",
};

// ── Stato prodotto ──────────────────────────────────────────────────────────
/**
 * Non è una closed beta: il download è pubblico (Play Store, App Store
 * incluse le storefront UE) e nessuna funzione richiede un invito.
 *
 * Sprint P0.10K — chiusura commerciale del sito: `summary` finisce in
 * /llms.txt (vedi lib/llms-txt.ts) e viene letto dagli assistenti AI come
 * fatto, quindi non può più descrivere la promozione Founder come
 * un'offerta disponibile — la versione precedente diceva "with an open
 * early-adopter 'Founder' pricing promotion", cioè esattamente "puoi ancora
 * aderire". Lo stato commerciale che il sito pubblica oggi è: prova Pro di
 * 14 giorni, poi acquisto o abbonamento; le nuove adesioni Founder tramite
 * il sito sono chiuse (stessa semantica di founderSiteClosedNote() in
 * lib/founder/historical-note.ts — chiude il SITO, non anticipa il cutoff
 * tecnico del backend). Backend, cutoff e Founder già concessi non sono
 * toccati: `FOUNDER_PROGRAM` sotto resta la fonte dei fatti stabili del
 * programma.
 */
export const PRODUCT_STATUS = {
  stage: "public",
  isClosedBeta: false,
  summary:
    "Publicly downloadable on Google Play and the App Store, including EU storefronts — not invite-only or access-gated. FitMesh Pro comes with a 14-day trial; after the trial, continuing to use Pro features requires a purchase or subscription. The early-adopter 'Founder' pricing promotion is not open to new sign-ups through the site.",
} as const;

// ── Capability truth layer (Sprint P0.6A) ───────────────────────────────────
/**
 * Fonte unica per lo stato di capacità del prodotto usate come claim
 * pubblici. Stati ammessi (Sprint P0.6 Fase 1): "live_verified" (unica
 * pubblicabile senza riserva), "live_limited" (pubblicabile con riserva
 * esplicita), "release_candidate", "in_development", "planned",
 * "unsupported", "unknown".
 *
 * `tools/check-llms-consistency.ts` legge questo oggetto invece di avere il
 * ban hardcodato nel testo dello script: quando una capacità passa un test
 * reale su device fisico e lo stato qui sopra viene aggiornato a
 * "live_verified", il guardrail corrispondente si sblocca da solo — nessuna
 * modifica allo script stesso.
 */
export const CAPABILITY_STATUS: Record<
  string,
  {
    status:
      | "live_verified"
      | "live_limited"
      | "release_candidate"
      | "in_development"
      | "planned"
      | "pending_production_verification"
      | "unsupported"
      | "unknown";
    note: string;
  }
> = {
  vo2max: {
    status: "unsupported",
    note:
      "vo2Max è sempre null in health_repository.dart, nessuna versione del plugin health espone VO2_MAX (verificato fino alla 13.3.1), nessun bridge nativo su nessuna piattaforma. Non promuovere a live_verified senza che health esponga davvero VO2_MAX E health_repository.dart lo legga (non più null hardcoded).",
  },
  founderAutoGrant: {
    status: "pending_production_verification",
    note:
      "Sprint P0.6B (freeze esplicito): il codice SQL del trigger di auto-grant Founder esiste nel repo, ma il codice presente NON costituisce prova di funzionamento in produzione. Restano da verificare, con dati reali di produzione: (1) il trigger è effettivamente applicato al DB di produzione, non solo presente in una migration; (2) una registrazione reale con un utente normale (non un account di test creato per l'occasione) attiva il grant; (3) il grant assegnato è corretto (lifetime Pro, non altro); (4) il cap di 1000 posti e il comportamento anti-race reggono sotto scrittura concorrente; (5) il conteggio dei posti usati è coerente con i grant realmente assegnati. Nessuna di queste verifiche deve avvenire creando account QA — solo osservando dati di produzione reali una volta che lo sprint Build 189 le esegue. Hotfix P0.6C (2026-07-17): il contatore pubblico dei posti Founder occupati (FounderCounter, FounderBanner, GET /api/v1/beta/spots) è stato rimosso dal sito perché il conteggio non è riconciliato con i grant realmente assegnati in produzione — era fermo a 705 e non verificabile. Non reintrodurre alcuna forma di contatore/badge/banner pubblico che mostri un numero di posti Founder occupati o rimasti finché questo status non passa a live_verified con il report coordinato dello sprint app/Build 189. Termini Founder, entitlement, trigger Supabase, cap 1000 e grant utenti non sono toccati da questo hotfix: resta tutto come nel freeze P0.6B.",
  },
};

// ── Programma Founder ───────────────────────────────────────────────────────
/**
 * `totalSeats` è stabile (cifra di programma, confermata in lib/pricing.ts).
 * Il numero di posti GIÀ USATI non è esposto pubblicamente (Hotfix P0.6C):
 * vedi `founderAutoGrant.note` sopra per il motivo. Nessun campo qui punta
 * a un conteggio live: se ne serve uno in futuro, va riconciliato prima.
 */
export const FOUNDER_PROGRAM = {
  totalSeats: 1000,
  benefit: "lifetime Pro access, free, no review required",
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
  it: "Sincronizza Galaxy Watch e Wear OS con una dashboard premium: passi, battito, sonno, calorie. Niente cloud opachi.",
  en: "Mirror Galaxy Watch and Wear OS data to a premium personal dashboard: steps, heart rate, sleep, calories. No opaque clouds.",
  es: "Sincroniza Galaxy Watch y Wear OS con un panel premium: pasos, frecuencia cardíaca, sueño, calorías. Sin nubes opacas.",
  de: "Synchronisiert Galaxy Watch und Wear OS mit einem Premium-Dashboard: Schritte, Herzfrequenz, Schlaf, Kalorien. Keine undurchsichtigen Clouds.",
  pt: "Sincroniza Galaxy Watch e Wear OS com um painel premium: passos, frequência cardíaca, sono, calorias. Sem nuvens opacas.",
  fr: "Synchronise Galaxy Watch et Wear OS avec un tableau de bord premium : pas, fréquence cardiaque, sommeil, calories. Aucun cloud opaque.",
  pl: "Synchronizuje Galaxy Watch i Wear OS z panelem premium: kroki, tętno, sen, kalorie. Bez ukrytych chmur.",
  tr: "Galaxy Watch ve Wear OS verilerini premium bir kişisel panele yansıtır: adımlar, kalp atışı, uyku, kalori. Opak bulut yok.",
  nl: "Spiegelt Galaxy Watch en Wear OS data naar een premium persoonlijk dashboard: stappen, hartslag, slaap, calorieën. Geen ondoorzichtige clouds.",
  ja: "Galaxy WatchとWear OSのデータをプレミアムダッシュボードへ同期: 歩数、心拍数、睡眠、カロリー。プライバシーファースト。",
  ko: "Galaxy Watch와 Wear OS 데이터를 프리미엄 대시보드에 동기화: 걸음 수, 심박수, 수면, 칼로리. 개인정보 보호 최우선.",
  sv: "Speglar data från Galaxy Watch och Wear OS till en premium personlig dashboard: steg, puls, sömn, kalorier. Inga oklara moln.",
  da: "Spejler data fra Galaxy Watch og Wear OS til et premium personligt dashboard: skridt, puls, søvn, kalorier. Ingen uklare skyer.",
  no: "Speiler data fra Galaxy Watch og Wear OS til et premium personlig dashbord: skritt, puls, søvn, kalorier. Ingen uklare skyer.",
  fi: "Peilaa Galaxy Watchin ja Wear OS:n tiedot premium-koontinäyttöön: askeleet, syke, uni, kalorit. Ei epämääräisiä pilviä.",
};

export const APP_DESCRIPTIONS_IOS: Record<Locale, string> = {
  it: "Sincronizza Apple Salute e il Colmi Ring con una dashboard premium: passi, battito, sonno, calorie. Niente cloud opachi.",
  en: "Mirror Apple Health and Colmi Ring data to a premium personal dashboard: steps, heart rate, sleep, calories. No opaque clouds.",
  es: "Sincroniza Apple Salud y el anillo Colmi con un panel premium: pasos, frecuencia cardíaca, sueño, calorías. Sin nubes opacas.",
  de: "Synchronisiert Apple Health und den Colmi Ring mit einem Premium-Dashboard: Schritte, Herzfrequenz, Schlaf, Kalorien. Keine undurchsichtigen Clouds.",
  pt: "Sincroniza o Apple Saúde e o anel Colmi com um painel premium: passos, frequência cardíaca, sono, calorias. Sem nuvens opacas.",
  fr: "Synchronise Apple Santé et la bague Colmi avec un tableau de bord premium : pas, fréquence cardiaque, sommeil, calories. Aucun cloud opaque.",
  pl: "Synchronizuje Apple Zdrowie i pierścień Colmi z panelem premium: kroki, tętno, sen, kalorie. Bez ukrytych chmur.",
  tr: "Apple Sağlık ve Colmi Ring verilerini premium bir kişisel panele yansıtır: adımlar, kalp atışı, uyku, kalori. Opak bulut yok.",
  nl: "Spiegelt Apple Gezondheid en Colmi Ring-data naar een premium persoonlijk dashboard: stappen, hartslag, slaap, calorieën. Geen ondoorzichtige clouds.",
  ja: "Apple ヘルスケアとColmi Ringのデータをプレミアムダッシュボードへ同期: 歩数、心拍数、睡眠、カロリー。プライバシーファースト。",
  ko: "Apple 건강과 Colmi Ring 데이터를 프리미엄 대시보드에 동기화: 걸음 수, 심박수, 수면, 칼로리. 개인정보 보호 최우선.",
  sv: "Speglar data från Apple Hälsa och Colmi Ring till en premium personlig dashboard: steg, puls, sömn, kalorier. Inga oklara moln.",
  da: "Spejler data fra Apple Sundhed og Colmi Ring til et premium personligt dashboard: skridt, puls, søvn, kalorier. Ingen uklare skyer.",
  no: "Speiler data fra Apple Helse og Colmi Ring til et premium personlig dashbord: skritt, puls, søvn, kalorier. Ingen uklare skyer.",
  fi: "Peilaa Apple Terveys- ja Colmi Ring -tiedot premium-koontinäyttöön: askeleet, syke, uni, kalorit. Ei epämääräisiä pilviä.",
};

export const APP_FEATURE_LIST_ANDROID: Record<Locale, string[]> = {
  it: [
    "Sincronizza Galaxy Watch, Wear OS e wearable Health Connect",
    "Dashboard premium per passi, battito, sonno, calorie",
    "Mesh Famiglia — monitora salute familiari (passi, sonno, attivita)",
    "Privacy-first: server EU, GDPR, niente tracker o cloud opachi",
    "Offline-first: i dati restano in coda e si inviano alla prossima apertura dell'app",
  ],
  en: [
    "Sync Galaxy Watch, Wear OS, and Health Connect wearables",
    "Premium dashboard for steps, heart rate, sleep, calories",
    "Family Mesh — monitor family health (steps, sleep, activity)",
    "Privacy-first: EU servers, GDPR, no trackers or opaque clouds",
    "Offline-first: data queues up and syncs the next time you open the app",
  ],
  es: [
    "Sincroniza Galaxy Watch, Wear OS y wearables compatibles con Health Connect",
    "Panel premium para pasos, frecuencia cardíaca, sueño, calorías",
    "Mesh Familiar — supervisa la salud familiar (pasos, sueño, actividad)",
    "Privacidad ante todo: servidores UE, RGPD, sin rastreadores ni nubes opacas",
    "Offline-first: los datos quedan en cola y se envían al abrir la app de nuevo",
  ],
  de: [
    "Synchronisiert Galaxy Watch, Wear OS und Health-Connect-Wearables",
    "Premium-Dashboard für Schritte, Herzfrequenz, Schlaf, Kalorien",
    "Familien-Mesh — überwacht die Gesundheit der Familie (Schritte, Schlaf, Aktivität)",
    "Datenschutz zuerst: EU-Server, DSGVO, keine Tracker oder undurchsichtigen Clouds",
    "Offline-first: Daten werden zwischengespeichert und beim nächsten Öffnen der App gesendet",
  ],
  pt: [
    "Sincroniza Galaxy Watch, Wear OS e wearables compatíveis com Health Connect",
    "Painel premium para passos, frequência cardíaca, sono, calorias",
    "Mesh Família — monitora a saúde da família (passos, sono, atividade)",
    "Privacidade em primeiro lugar: servidores UE, RGPD, sem rastreadores ou nuvens opacas",
    "Offline-first: os dados ficam em espera e são enviados na próxima abertura da app",
  ],
  fr: [
    "Synchronise Galaxy Watch, Wear OS et les wearables compatibles Health Connect",
    "Tableau de bord premium pour les pas, la fréquence cardiaque, le sommeil, les calories",
    "Family Mesh — suivez la santé de la famille (pas, sommeil, activité)",
    "Confidentialité avant tout : serveurs UE, RGPD, aucun tracker ni cloud opaque",
    "Offline-first : les données restent en attente et sont envoyées à la prochaine ouverture de l'app",
  ],
  pl: [
    "Synchronizuje Galaxy Watch, Wear OS i wearables zgodne z Health Connect",
    "Panel premium dla kroków, tętna, snu, kalorii",
    "Mesh Rodzinny — monitoruje zdrowie rodziny (kroki, sen, aktywność)",
    "Prywatność przede wszystkim: serwery UE, RODO, brak trackerów i nieprzejrzystych chmur",
    "Offline-first: dane czekają w kolejce i wysyłają się przy następnym otwarciu aplikacji",
  ],
  tr: [
    "Galaxy Watch, Wear OS ve Health Connect uyumlu giyilebilirleri senkronize eder",
    "Adımlar, kalp atışı, uyku, kalori için premium pano",
    "Aile Mesh — aile sağlığını izler (adımlar, uyku, aktivite)",
    "Gizlilik öncelikli: AB sunucuları, GDPR, izleyici veya opak bulut yok",
    "Offline-first: veriler kuyrukta bekler ve uygulamayı bir sonraki açışında gönderilir",
  ],
  nl: [
    "Synchroniseert Galaxy Watch, Wear OS en Health Connect-wearables",
    "Premium dashboard voor stappen, hartslag, slaap, calorieën",
    "Family Mesh — houd de gezondheid van het gezin in de gaten (stappen, slaap, activiteit)",
    "Privacy-first: EU-servers, AVG, geen trackers of ondoorzichtige clouds",
    "Offline-first: gegevens blijven in de wachtrij en worden verzonden bij de volgende keer openen van de app",
  ],
  ja: [
    "Galaxy Watch、Wear OS、Health Connect対応ウェアラブルを同期",
    "歩数、心拍数、睡眠、カロリーのプレミアムダッシュボード",
    "Family Mesh — 家族の健康を見守る（歩数、睡眠、活動量）",
    "プライバシーファースト：EUサーバー、GDPR準拠、トラッカーや不透明なクラウドなし",
    "オフラインファースト：データは一時保存され、次にアプリを開いたときに送信されます",
  ],
  ko: [
    "Galaxy Watch, Wear OS 및 Health Connect 웨어러블 동기화",
    "걸음 수, 심박수, 수면, 칼로리를 위한 프리미엄 대시보드",
    "Family Mesh — 가족 건강 모니터링 (걸음 수, 수면, 활동)",
    "개인정보 보호 최우선: EU 서버, GDPR, 트래커나 불투명한 클라우드 없음",
    "오프라인 우선: 데이터는 대기열에 저장되었다가 앱을 다음에 열 때 전송됩니다",
  ],
  sv: [
    "Synkroniserar Galaxy Watch, Wear OS och Health Connect-wearables",
    "Premium dashboard för steg, puls, sömn, kalorier",
    "Family Mesh — övervaka familjens hälsa (steg, sömn, aktivitet)",
    "Integritet först: EU-servrar, GDPR, inga spårare eller oklara moln",
    "Offline-first: data köas och skickas nästa gång du öppnar appen",
  ],
  da: [
    "Synkroniserer Galaxy Watch, Wear OS og Health Connect-wearables",
    "Premium dashboard til skridt, puls, søvn, kalorier",
    "Family Mesh — hold øje med familiens sundhed (skridt, søvn, aktivitet)",
    "Privatliv først: EU-servere, GDPR, ingen trackere eller uklare skyer",
    "Offline-first: data ligger i kø og sendes, næste gang du åbner appen",
  ],
  no: [
    "Synkroniserer Galaxy Watch, Wear OS og Health Connect-wearables",
    "Premium dashbord for skritt, puls, søvn, kalorier",
    "Family Mesh — overvåk familiens helse (skritt, søvn, aktivitet)",
    "Personvern først: EU-servere, GDPR, ingen sporere eller uklare skyer",
    "Offline-first: data legges i kø og sendes neste gang du åpner appen",
  ],
  fi: [
    "Synkronoi Galaxy Watchin, Wear OS:n ja Health Connect -yhteensopivat puettavat laitteet",
    "Premium-koontinäyttö askelille, sykkeelle, unelle, kaloreille",
    "Family Mesh — seuraa perheen terveyttä (askeleet, uni, aktiivisuus)",
    "Yksityisyys edellä: EU-palvelimet, GDPR, ei seurantaa tai epämääräisiä pilviä",
    "Offline-first: tiedot jonottavat ja lähtevät, kun avaat sovelluksen seuraavan kerran",
  ],
};

export const APP_FEATURE_LIST_IOS: Record<Locale, string[]> = {
  it: [
    "Sincronizza Apple Salute (HealthKit) e il Colmi Ring via Bluetooth diretto",
    "Dashboard premium per passi, battito, sonno, calorie",
    "Mesh Famiglia — monitora salute familiari (passi, sonno, attivita)",
    "Privacy-first: server EU, GDPR, niente tracker o cloud opachi",
    "Live sull'App Store, incluse tutte le storefront UE",
  ],
  en: [
    "Sync Apple Health (HealthKit) and the Colmi Ring via direct Bluetooth",
    "Premium dashboard for steps, heart rate, sleep, calories",
    "Family Mesh — monitor family health (steps, sleep, activity)",
    "Privacy-first: EU servers, GDPR, no trackers or opaque clouds",
    "Live on the App Store, including all EU storefronts",
  ],
  es: [
    "Sincroniza Apple Salud (HealthKit) y el anillo Colmi por Bluetooth directo",
    "Panel premium para pasos, frecuencia cardíaca, sueño, calorías",
    "Mesh Familiar — supervisa la salud familiar (pasos, sueño, actividad)",
    "Privacidad ante todo: servidores UE, RGPD, sin rastreadores ni nubes opacas",
    "Disponible en la App Store, incluidas todas las tiendas de la UE",
  ],
  de: [
    "Synchronisiert Apple Health (HealthKit) und den Colmi Ring per direktem Bluetooth",
    "Premium-Dashboard für Schritte, Herzfrequenz, Schlaf, Kalorien",
    "Familien-Mesh — überwacht die Gesundheit der Familie (Schritte, Schlaf, Aktivität)",
    "Datenschutz zuerst: EU-Server, DSGVO, keine Tracker oder undurchsichtigen Clouds",
    "Im App Store live, einschließlich aller EU-Storefronts",
  ],
  pt: [
    "Sincroniza o Apple Saúde (HealthKit) e o anel Colmi via Bluetooth direto",
    "Painel premium para passos, frequência cardíaca, sono, calorias",
    "Mesh Família — monitora a saúde da família (passos, sono, atividade)",
    "Privacidade em primeiro lugar: servidores UE, RGPD, sem rastreadores ou nuvens opacas",
    "Ativo na App Store, incluindo todas as lojas da UE",
  ],
  fr: [
    "Synchronise Apple Santé (HealthKit) et la bague Colmi via Bluetooth direct",
    "Tableau de bord premium pour les pas, la fréquence cardiaque, le sommeil, les calories",
    "Family Mesh — suivez la santé de la famille (pas, sommeil, activité)",
    "Confidentialité avant tout : serveurs UE, RGPD, aucun tracker ni cloud opaque",
    "Active sur l'App Store, y compris dans toutes les boutiques de l'UE",
  ],
  pl: [
    "Synchronizuje Apple Zdrowie (HealthKit) i pierścień Colmi przez bezpośredni Bluetooth",
    "Panel premium dla kroków, tętna, snu, kalorii",
    "Mesh Rodzinny — monitoruje zdrowie rodziny (kroki, sen, aktywność)",
    "Prywatność przede wszystkim: serwery UE, RODO, brak trackerów i nieprzejrzystych chmur",
    "Dostępny w App Store, we wszystkich sklepach UE",
  ],
  tr: [
    "Apple Sağlık (HealthKit) ve Colmi Ring'i doğrudan Bluetooth ile senkronize eder",
    "Adımlar, kalp atışı, uyku, kalori için premium pano",
    "Aile Mesh — aile sağlığını izler (adımlar, uyku, aktivite)",
    "Gizlilik öncelikli: AB sunucuları, GDPR, izleyici veya opak bulut yok",
    "AB dahil tüm mağazalarda App Store'da yayında",
  ],
  nl: [
    "Synchroniseert Apple Gezondheid (HealthKit) en de Colmi Ring via directe Bluetooth",
    "Premium dashboard voor stappen, hartslag, slaap, calorieën",
    "Family Mesh — houd de gezondheid van het gezin in de gaten (stappen, slaap, activiteit)",
    "Privacy-first: EU-servers, AVG, geen trackers of ondoorzichtige clouds",
    "Live in de App Store, inclusief alle EU-winkels",
  ],
  ja: [
    "Apple ヘルスケア（HealthKit）とColmi Ringを直接Bluetoothで同期",
    "歩数、心拍数、睡眠、カロリーのプレミアムダッシュボード",
    "Family Mesh — 家族の健康を見守る（歩数、睡眠、活動量）",
    "プライバシーファースト：EUサーバー、GDPR準拠、トラッカーや不透明なクラウドなし",
    "EU域内を含む対応国のApp Storeで提供中",
  ],
  ko: [
    "Apple 건강(HealthKit)과 Colmi Ring을 직접 블루투스로 동기화",
    "걸음 수, 심박수, 수면, 칼로리를 위한 프리미엄 대시보드",
    "Family Mesh — 가족 건강 모니터링 (걸음 수, 수면, 활동)",
    "개인정보 보호 최우선: EU 서버, GDPR, 트래커나 불투명한 클라우드 없음",
    "EU를 포함한 App Store에 출시",
  ],
  sv: [
    "Synkroniserar Apple Hälsa (HealthKit) och Colmi Ring via direkt Bluetooth",
    "Premium dashboard för steg, puls, sömn, kalorier",
    "Family Mesh — övervaka familjens hälsa (steg, sömn, aktivitet)",
    "Integritet först: EU-servrar, GDPR, inga spårare eller oklara moln",
    "Live i App Store, inklusive alla EU-butiker",
  ],
  da: [
    "Synkroniserer Apple Sundhed (HealthKit) og Colmi Ring via direkte Bluetooth",
    "Premium dashboard til skridt, puls, søvn, kalorier",
    "Family Mesh — hold øje med familiens sundhed (skridt, søvn, aktivitet)",
    "Privatliv først: EU-servere, GDPR, ingen trackere eller uklare skyer",
    "Live i App Store, inklusive alle EU-butikker",
  ],
  no: [
    "Synkroniserer Apple Helse (HealthKit) og Colmi Ring via direkte Bluetooth",
    "Premium dashbord for skritt, puls, søvn, kalorier",
    "Family Mesh — overvåk familiens helse (skritt, søvn, aktivitet)",
    "Personvern først: EU-servere, GDPR, ingen sporere eller uklare skyer",
    "Live i App Store, inkludert alle EU-butikker",
  ],
  fi: [
    "Synkronoi Apple Terveyden (HealthKit) ja Colmi Ringin suoralla Bluetooth-yhteydellä",
    "Premium-koontinäyttö askelille, sykkeelle, unelle, kaloreille",
    "Family Mesh — seuraa perheen terveyttä (askeleet, uni, aktiivisuus)",
    "Yksityisyys edellä: EU-palvelimet, GDPR, ei seurantaa tai epämääräisiä pilviä",
    "Käytössä App Storessa, mukaan lukien kaikki EU-kaupat",
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
