/**
 * Cover dei post del blog: set piccolo e riutilizzabile (illustrazioni text-free
 * warm + accenti brand). Un tipo per argomento, assegnato per slug. Usate come
 * miniatura nell'index, cover nell'header, e `image` nel JSON-LD.
 * File in `public/blog/covers/`.
 */
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
  | "appleTogether";

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
  healthconnect: "health-connect-sync-troubleshooting.webp",
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
  "google-health-google-fit": "sync",
  "huawei-health-health-connect-sincronizzazione": "sync",
  "garmin-body-battery-health-connect": "troubleshooting",
  "polar-health-connect-sync": "sync",
  "sleep-tracker-comparison-2026": "compare",
  "garmin-samsung-health-sync-guide": "sync",
  "galaxy-ring-android-health-connect": "ring",
  "vo2-max-wearable-comparison-2026": "compare",
  "oura-ring-health-connect-android": "ring",
  "esportare-dati-xiaomi-amazfit": "export",
  "sincronizzare-withings": "sync",
  "dati-pixel-watch-dashboard": "dashboard",
  "anello-smart-guida-completa": "ring",
  "google-fit-api-dismissione-2026": "sync",
  "novita-fonte-del-dato": "news",
  "fitmesh-sync-disponibile-google-play": "news",
  "anello-vs-smartwatch": "compare",
  "migliori-anelli-economici": "compare",
  "tracciare-sonno-anello": "sleep",
  "colmi-r02-setup": "ring",
  "sync-them-all": "multidevice",
  "colmi-ring-fitmesh": "ring",
  "fitmesh-arriva-su-iphone": "platform",
  // P1.8S-IMG FASE 9 (2026-08-06): cover dedicata (fitmesh-apple-health-
  // together.webp) al posto della generica "ring" — pagina bridge
  // Apple Salute, winner della consolidazione cannibalizzazione P1.8S.
  "dati-anello-smart-apple-salute": "appleTogether",
  "novita-anello-colmi-sonno": "sleep",
  "piu-smartwatch-insieme-dati-doppi": "multidevice",
  "novita-dashboard-multi-device": "dashboard",
  "fitbit-data-not-syncing-android": "troubleshooting",
  "best-health-data-sync-app-android": "compare",
  "smartwatch-estate-2026": "multidevice",
  // P1.5C: prima usava "troubleshooting" (gear.webp, condivisa con altri 3
  // post). Ora cover dedicata: il post ha appena avuto il micro-fix CTR DE
  // (P1.5B Fase A) e merita un'immagine propria invece di quella generica.
  "health-connect-not-syncing": "healthconnect",
  "how-to-export-apple-health-data": "export",
  "smartwatch-per-anziani-guida": "compare",
  "esportare-dati-garmin": "export",
  "sync-samsung-health-google-fit": "sync",
  "best-smartwatch-for-elderly": "compare",
  "come-funziona-health-connect": "sync",
  "hrv-cose-significato-valori": "metrics",
  "passi-non-si-sincronizzano-galaxy-watch": "troubleshooting",
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
  "cambiare-smartwatch-senza-perdere-dati": "multidevice",
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
