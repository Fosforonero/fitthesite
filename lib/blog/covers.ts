/**
 * Cover dei post del blog: set piccolo e riutilizzabile (illustrazioni text-free
 * warm + accenti brand). Un tipo per argomento, assegnato per slug. Usate come
 * miniatura nell'index, cover nell'header, e `image` nel JSON-LD.
 * File in `public/blog/covers/`. news/metrics: fallback finche' non arrivano.
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
  | "metrics";

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
  news: "dashboard.webp", // TODO: news.webp quando arriva
  metrics: "devices.webp", // TODO: metrics.webp quando arriva
};

/** Assegnazione esplicita per slug (i 51 post attuali). */
const POST_COVER: Record<string, CoverType> = {
  "scrivere-dati-android-su-apple-salute": "platform",
  "da-android-a-iphone-dati-fitness": "platform",
  "anello-orologio-scenari-reali": "ring",
  "novita-fitmesh-su-app-store": "news",
  "google-health-google-fit": "sync",
  "huawei-health-health-connect-sincronizzazione": "sync",
  "garmin-body-battery-health-connect": "metrics",
  "polar-health-connect-sync": "sync",
  "sleep-tracker-comparison-2026": "compare",
  "garmin-samsung-health-sync-guide": "sync",
  "galaxy-ring-android-health-connect": "ring",
  "vo2-max-wearable-comparison-2026": "compare",
  "oura-ring-health-connect-android": "ring",
  "esportare-dati-xiaomi-amazfit": "sync",
  "sincronizzare-withings": "sync",
  "dati-pixel-watch-dashboard": "dashboard",
  "anello-smart-guida-completa": "ring",
  "google-fit-cierra-alternativas-health-connect": "sync",
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
  "fitbit-data-not-syncing-android": "sync",
  "best-health-data-sync-app-android": "compare",
  "smartwatch-estate-2026": "multidevice",
  "health-connect-not-syncing": "sync",
  "how-to-export-apple-health-data": "platform",
  "smartwatch-per-anziani-guida": "compare",
  "esportare-dati-garmin": "sync",
  "sync-samsung-health-google-fit": "sync",
  "best-smartwatch-for-elderly": "compare",
  "come-funziona-health-connect": "sync",
  "hrv-cose-significato-valori": "metrics",
  "passi-non-si-sincronizzano-galaxy-watch": "sync",
  "guida-sync-wearable-2026": "sync",
  "scegliere-smartwatch-dati-2026": "compare",
  "health-connect-vs-samsung-health": "compare",
  "backup-galaxy-watch-pc": "sync",
  "esportare-dati-fitbit-google": "sync",
  "vedere-dati-wearable-browser-pc": "dashboard",
  "alternative-app-sync-wearable-2026": "compare",
  "gdpr-dati-fitness-smartwatch": "privacy",
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
