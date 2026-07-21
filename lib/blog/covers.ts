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
  | "export";

export const COVER_W = 1200;
export const COVER_H = 675;

const COVER_FILE: Record<CoverType, string> = {
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
};

/** Assegnazione esplicita per slug (i 51 post attuali). */
const POST_COVER: Record<string, CoverType> = {
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
  "dati-anello-smart-apple-salute": "ring",
  "novita-anello-colmi-sonno": "sleep",
  "piu-smartwatch-insieme-dati-doppi": "multidevice",
  "novita-dashboard-multi-device": "dashboard",
  "fitbit-data-not-syncing-android": "troubleshooting",
  "best-health-data-sync-app-android": "compare",
  "smartwatch-estate-2026": "multidevice",
  "health-connect-not-syncing": "troubleshooting",
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
  "come-funziona-fitmesh": "dashboard",
  "efficienza-del-sonno-formula-calcolo": "sleep",
  "metriche-recupero-hrv-sonno-frequenza-cardiaca": "metrics",
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
