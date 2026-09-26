/**
 * Cover dei post del blog: set piccolo e riutilizzabile (illustrazioni text-free
 * warm + accenti brand). Un tipo per argomento, assegnato per slug. Usate come
 * miniatura nell'index, cover nell'header, e `image` nel JSON-LD.
 * File in `public/blog/covers/`.
 */
import type { Locale } from "@/lib/i18n";
import { tl } from "./types";
import type { BlogPost } from "./types";

export type CoverType =
  | "ring"
  | "multidevice"
  | "sync"
  | "sleep"
  | "privacy"
  | "platform"
  | "news"
  | "compare"
  | "dashboard"
  | "metrics"
  | "troubleshooting"
  | "export"
  | "watch"
  | "healthconnect"
  | "zone2"
  | "circadian"
  | "fitmeshOverview"
  | "samsungTogether"
  | "appleTogether"
  | "pixelWatch"
  | "googleHealthSync"
  | "apiMigration"
  | "stepsChart"
  | "appleHealthConnected"
  | "galaxyWatchSleep"
  | "ringVsWatch"
  | "sleepTrackerComparison"
  | "vo2MaxComparison"
  | "smartRingGuide"
  | "budgetSmartRings"
  | "multipleWatchDuplicates"
  | "huaweiPath"
  | "galaxyWatchTroubleshooting"
  | "healthConnectOverview"
  | "colmiRingFitmesh"
  | "changeSmartwatch";

export const COVER_W = 1200;
export const COVER_H = 675;

/** Esportato per il guardrail `check-p15c-cover-map.ts` (esiste il file? duplicati?). */
export const COVER_FILE: Record<CoverType, string> = {
  ring: "ring.webp",
  multidevice: "wearables.webp",
  sync: "devices.webp",
  compare: "flow.webp",
  sleep: "recovery.webp",
  privacy: "shield.webp",
  platform: "smartphones.webp",
  dashboard: "dashboard.webp",
  metrics: "hearth.webp",
  troubleshooting: "gear.webp",
  export: "data-sync.webp",
  news: "news.webp",
  // P1.3N-C: cover originale dedicata (watch -> hub dati), NON riusata da
  // altri post. Illustrazione FitMesh generata esternamente (2026-07-21):
  // smartwatch rugged generico, nessun logo Samsung, nessuna copia esatta
  // di un prodotto reale, nessun testo incorporato.
  watch: "galaxy-watch-unpacked.webp",
  // P1.5C Fase 1/2: 3 cover dedicate consegnate da Matteo (2026-08-05),
  // NON riusate da altri post. Ledger completo (SHA-256, dimensioni,
  // esito audit) in docs/seo/p15c-cover-image-ledger.md. Ognuna
  // verificata: 1200x675, nessun logo/testo/watermark incorporato,
  // nessun EXIF/XMP/ICC (verificato via Pillow), nessuna animazione
  // (1 frame), nessuna licenza terze parti visibile. Un 4° file
  // consegnato insieme a questi ("pillar fitmesh.webp") e' risultato
  // BYTE-IDENTICO a zona2.webp (stesso SHA-256) ed e' stato scartato:
  // mai copiato, rinominato, ne' referenziato qui o altrove.
  healthconnect: "health-connect-not-syncing.webp",
  zone2: "zone-2-different-devices.webp",
  circadian: "sleep-score-circadian-rhythm.webp",
  // P1.8S/P1.8S-IMG (2026-08-06): 3 cover consegnate da Matteo, forense +
  // gate visivo/semantico superati (verificate 1200x686 sorgente -> crop
  // centrato 1200x675, no stretch, no alpha/EXIF/XMP, no loghi terzi).
  // Un 4° asset consegnato insieme ("samsung-health-health-connect-flow.webp",
  // destinato a health-connect-vs-samsung-health) e' stato SCARTATO (NO-GO):
  // 2 delle icone nel telefono centrale somigliano troppo da vicino a
  // marchi reali (icona verde ~ Health Connect, icona arancione ~ Strava)
  // — non committato, non modificato alla cieca, cover esistente invariata.
  fitmeshOverview: "how-fitmesh-works.webp",
  samsungTogether: "fitmesh-samsung-health-together.webp",
  appleTogether: "fitmesh-apple-health-together.webp",
  // P1.8C (2026-08-25): 3 cover consegnate da Matteo da /Users/matteo/Downloads
  // (pixel-watch-5.webp, google-health-google-fit.webp, migrazione-api-salute.webp),
  // NON riusate da altri post. Ledger completo (SHA-256, dimensioni, esito
  // audit, esito gate marchio) in docs/seo/p18c-cover-image-ledger.md. Ognuna
  // verificata: WebP reale 1200x675 esatti (VP8 lossy semplice, non VP8X),
  // singolo frame, nessun alpha, nessun EXIF/XMP/ICC, nessun testo/watermark
  // incorporato, crop sicuro mobile/desktop. pixel-watch-health-connect-sync
  // ha in piu' superato un gate marchio dedicato sul simbolo centrale
  // (identificazione cieca + confronto strutturale con Meta/Threads/Airbnb/
  // Peloton/Google Health Connect/Google Fit: tutti "rischio-basso", nessun
  // "rischio-medio"/"rischio-alto" — GO documentato nel ledger).
  pixelWatch: "pixel-watch-health-connect-sync.webp",
  googleHealthSync: "google-health-multi-source-sync.webp",
  apiMigration: "google-fit-api-migration.webp",
  // P1.9-10 (2026-09-02): cover dedicata consegnata da Matteo per
  // steps-total-vs-hourly-chart, 1200x675 esatti (VP8X, nessun alpha/EXIF/
  // XMP/animazione: byte flags a zero, verificato con xxd), 78.936 byte,
  // nessun testo/logo incorporato. Sostituisce il placeholder "troubleshooting"
  // (gear.webp) assegnato prima che l'asset fosse disponibile.
  stepsChart: "steps-total-vs-hourly-chart.webp",
  // ADDENDUM P1.21-A (11/09/2026): cover dedicata consegnata da Matteo da
  // /Users/matteo/Downloads/fitmesh-apple-health.webp, copiata (non
  // spostata/modificata) con questo nome descrittivo stabile. Verificata:
  // WebP reale, 1200x675 esatti, SHA-256 identico a byte tra sorgente e
  // copia, illustrazione concettuale (telefono con dashboard salute
  // connesso a smartwatch/anello/fascia via linee luminose) — nessun testo,
  // nessun logo Apple, non uno screenshot iOS reale.
  appleHealthConnected: "apple-health-connected-devices.webp",
  // SPRINT P1.26 (24/09/2026): cover dedicata per sonno Galaxy Watch
  // (smartwatch circolare su comodino, display con onde luminose astratte)
  galaxyWatchSleep: "galaxy-watch-sleep-health-connect.webp",
  ringVsWatch: "ring-vs-smartwatch.webp",
  sleepTrackerComparison: "sleep-tracker-comparison.webp",
  vo2MaxComparison: "vo2-max-wearable-comparison.webp",
  smartRingGuide: "smart-ring-complete-guide.webp",
  budgetSmartRings: "budget-smart-rings.webp",
  multipleWatchDuplicates: "multiple-smartwatches-duplicate-data.webp",
  // SPRINT PM P1.29-IMG (2026-09-26): cover dedicate per percorso Huawei Health e troubleshooting Galaxy Watch.
  huaweiPath: "huawei-health-path.webp",
  galaxyWatchTroubleshooting: "galaxy-watch-steps-troubleshooting.webp",
  // ADDENDUM PM P1.29-IMG-C (2026-09-26): cover dedicate round 2 (Health Connect pillar, Colmi ring, cambio smartwatch).
  healthConnectOverview: "how-health-connect-works.webp",
  colmiRingFitmesh: "colmi-ring-fitmesh.webp",
  changeSmartwatch: "change-smartwatch.webp",
};

/**
 * Assegnazione esplicita per slug. P1.5C: ogni post pubblicato ha una entry
 * esplicita qui (nessuno resta sul fallback per-categoria sotto) — vedi
 * `check-p15c-cover-map.ts`, che fallisce se un post pubblicato non ha una
 * entry propria. Il fallback per-categoria resta come rete di sicurezza per
 * post futuri non ancora triagati, non come stato normale.
 */
/** Esportato per il guardrail `check-p15c-cover-map.ts` (ogni post ha una entry propria?). */
export const POST_COVER: Record<string, CoverType> = {
  // P1.8S (2026-08-06): nuovo articolo "perche' usare Samsung Health insieme
  // a FitMesh" — cover dedicata, non riusata dal pillar architetturale
  // health-connect-vs-samsung-health (che resta su "compare").
  "fitmesh-samsung-health-usarli-insieme": "samsungTogether",
  "scrivere-dati-android-su-apple-salute": "platform",
  "da-android-a-iphone-dati-fitness": "platform",
  "anello-orologio-scenari-reali": "ring",
  "novita-fitmesh-su-app-store": "news",
  // P1.8C (2026-08-25): cover dedicata (google-health-multi-source-sync.webp)
  // al posto della generica "sync" (devices.webp, condivisa con 9 altri
  // post). Solo il cover cambia — testo/H1/title/updatedAt di questo post
  // restano invariati per vincolo esplicito dello sprint (post appena
  // riscritto in P1.8B/PR #57).
  "google-health-google-fit": "googleHealthSync",
  "huawei-health-health-connect-sincronizzazione": "huaweiPath",
  "garmin-body-battery-health-connect": "troubleshooting",
  "polar-health-connect-sync": "sync",
  "sleep-tracker-comparison-2026": "sleepTrackerComparison",
  "garmin-samsung-health-sync-guide": "sync",
  "galaxy-ring-android-health-connect": "ring",
  "vo2-max-wearable-comparison-2026": "vo2MaxComparison",
  "oura-ring-health-connect-android": "ring",
  "esportare-dati-xiaomi-amazfit": "export",
  "sincronizzare-withings": "sync",
  // P1.8C (2026-08-25): cover dedicata (Pixel Watch reale, non lo smartwatch
  // rugged generico di "dashboard") — vedi nota sul gate marchio in COVER_FILE.
  "dati-pixel-watch-dashboard": "pixelWatch",
  "anello-smart-guida-completa": "smartRingGuide",
  // P1.8C (2026-08-25): cover dedicata (google-fit-api-migration.webp) al
  // posto della generica "sync" — il tema del post e' la migrazione API, non
  // un generico "sincronizzazione dispositivi".
  "google-fit-api-dismissione-2026": "apiMigration",
  "novita-fonte-del-dato": "news",
  "fitmesh-sync-disponibile-google-play": "news",
  "anello-vs-smartwatch": "ringVsWatch",
  "migliori-anelli-economici": "budgetSmartRings",
  "tracciare-sonno-anello": "sleep",
  "colmi-r02-setup": "ring",
  "sync-them-all": "multidevice",
  "colmi-ring-fitmesh": "colmiRingFitmesh",
  "fitmesh-arriva-su-iphone": "platform",
  // P1.8S-IMG FASE 9 (2026-08-06): cover dedicata (fitmesh-apple-health-
  // together.webp) al posto della generica "ring" — pagina bridge
  // Apple Salute, winner della consolidazione cannibalizzazione P1.8S.
  "dati-anello-smart-apple-salute": "appleTogether",
  "novita-anello-colmi-sonno": "sleep",
  "piu-smartwatch-insieme-dati-doppi": "multipleWatchDuplicates",
  "novita-dashboard-multi-device": "dashboard",
  "fitbit-data-not-syncing-android": "troubleshooting",
  "best-health-data-sync-app-android": "compare",
  "smartwatch-estate-2026": "multidevice",
  // P1.5C / P1.29-IMG-C: cover dedicata per troubleshooting sincronizzazione Health Connect.
  "health-connect-not-syncing": "healthconnect",
  "how-to-export-apple-health-data": "export",
  "smartwatch-per-anziani-guida": "compare",
  "esportare-dati-garmin": "export",
  "sync-samsung-health-google-fit": "sync",
  "best-smartwatch-for-elderly": "compare",
  "come-funziona-health-connect": "healthConnectOverview",
  "hrv-cose-significato-valori": "metrics",
  "passi-non-si-sincronizzano-galaxy-watch": "galaxyWatchTroubleshooting",
  "guida-sync-wearable-2026": "sync",
  "scegliere-smartwatch-dati-2026": "compare",
  "health-connect-vs-samsung-health": "compare",
  "backup-galaxy-watch-pc": "export",
  "esportare-dati-fitbit-google": "export",
  "vedere-dati-wearable-browser-pc": "dashboard",
  "alternative-app-sync-wearable-2026": "compare",
  "gdpr-dati-fitness-smartwatch": "privacy",
  "fitmesh-gratis-prezzo-founder": "dashboard",
  "anello-colmi-r02-affidabile": "ring",
  "cambiare-smartwatch-senza-perdere-dati": "changeSmartwatch",
  // P1.8S-IMG FASE 9 (2026-08-06): cover dedicata (how-fitmesh-works.webp)
  // al posto della generica "dashboard" — il pillar del prodotto merita
  // un'immagine propria dopo la revisione contenuto reale P1.5B Fase C.
  "come-funziona-fitmesh": "fitmeshOverview",
  "efficienza-del-sonno-formula-calcolo": "sleep",
  "metriche-recupero-hrv-sonno-frequenza-cardiaca": "metrics",
  "galaxy-watch-ultra2-watch9-health-connect": "watch",

  // P1.5C: nuove traduzioni DE (P1.5B Fase B), cover dedicate consegnate
  // insieme a quella di health-connect-not-syncing sopra.
  "sleep-score-regolarita-ritmo-circadiano": "circadian",
  "perche-zona-2-cambia-smartwatch-app": "zone2",

  // P1.5C: audit fallback silenzioso. Questi 4 post (2 sopra + 2 sotto,
  // categoria "guides", che non ha un case dedicato in coverType() sotto)
  // ricadevano TUTTI sul default ultimo "sync" (devices.webp), un cover
  // generico e non pertinente al tema reale del post. Resi espliciti con un
  // tipo coerente col contenuto.
  "colmi-r09-temperatura-sviluppo": "ring", // post sul sensore temperatura dell'anello Colmi R09
  "perche-diventare-founder-fitmesh": "dashboard", // stesso trattamento di fitmesh-gratis-prezzo-founder

  // P1.5C: questi 3 ricadevano gia' sul fallback per-categoria (comparisons/
  // news/privacy hanno un case dedicato in coverType()) e il risultato era
  // gia' corretto: resi espliciti solo per rimuovere l'ambiguita', stesso
  // file di prima, nessun cambio visivo.
  "fitmesh-vs-alternative-sync": "compare",
  "mesh-famiglia-lancio": "news",
  "dove-sono-i-tuoi-dati-server-ue": "privacy",

  // P1.9-10 (2026-09-02): cover dedicata (steps-total-vs-hourly-chart.webp),
  // non piu' il placeholder "troubleshooting"/gear.webp.
  "steps-total-vs-hourly-chart": "stepsChart",
  // MICRO-GATE PR#66-B (08/09/2026): voce /novita gemella dello stesso
  // argomento — riusa la stessa cover reale invece di un placeholder, nessun
  // nuovo asset immagine disponibile per questo containment.
  "novita-passi-piu-affidabili": "stepsChart",
  // SPRINT novità 3.10.0/191 (10/09/2026): nessun asset dedicato al tema
  // "navigazione giorni passati" disponibile — riuso l'illustrazione
  // astratta generica "dashboard" (chiave esistente, già usata da altri
  // post news/ecosystem), NON uno screenshot che finga di mostrare la UI
  // reale. Segnalato a Matteo come scelta di ripiego, non ideale.
  "novita-giorni-passati": "dashboard",
  // SPRINT P1.21 (11/09/2026): cover dedicata consegnata da Matteo, vedi
  // commento su appleHealthConnected in COVER_FILE sopra.
  "nuova-apple-health-rende-inutili-altre-app": "appleHealthConnected",
  // SPRINT P1.26 (24/09/2026): guida Galaxy Watch, sonno e Health Connect
  "galaxy-watch-sleep-tracking-health-connect": "galaxyWatchSleep",
};

/** Tipo cover del post: assegnazione esplicita, altrimenti default per categoria. */
export function coverType(post: BlogPost): CoverType {
  const explicit = POST_COVER[post.slug];
  if (explicit) return explicit;
  const cat = (post as { category?: string }).category;
  if (cat === "comparisons") return "compare";
  if (cat === "news") return "news";
  if (cat === "privacy") return "privacy";
  if (cat === "ecosystem") return "dashboard";
  return "sync";
}

/** URL relativo della cover (per next/image). */
export function coverSrc(post: BlogPost): string {
  return `/blog/covers/${COVER_FILE[coverType(post)]}`;
}

/**
 * P1.8C: alt text della cover per `lc`. Se il post ha scritto a mano un
 * `coverAlt` per QUESTA locale, lo usa (deve descrivere l'immagine, non
 * ripetere l'H1/keyword). Altrimenti ricade sul comportamento storico
 * (identico all'H1, `hero.title`) — nessun post esistente cambia risultato.
 */
export function coverAlt(post: BlogPost, lc: Locale): string {
  return post.coverAlt?.[lc] ?? tl(post.hero.title, lc);
}

/**
 * P1.8C: caption della cover per `lc`, solo se il post ne ha scritta una
 * REALE per questa locale — mai generata a riempimento. `undefined` = non
 * mostrare alcuna caption (comportamento storico per tutti i post che non
 * definiscono `coverCaption`).
 */
export function coverCaption(post: BlogPost, lc: Locale): string | undefined {
  return post.coverCaption?.[lc];
}
