/**
 * Indice del blog: aggrega tutti i post di `lib/blog/posts/*.ts`.
 *
 * Pattern: ogni post è un modulo TS che esporta `post: BlogPost`. Qui li
 * importiamo, li ordiniamo per `publishedAt` desc, e forniamo helper di
 * accesso (by-slug, by-category, related).
 *
 * Quando aggiungi un articolo:
 *   1. Crea `lib/blog/posts/{slug}.ts` con `export const post: BlogPost = {...}`
 *   2. Importalo qui sotto e aggiungilo a `RAW_POSTS`
 *   3. Il resto (route, sitemap, indici) si aggiorna automaticamente
 */

import type { BlogPost, BlogCategory } from "./types";
import { post as guidaSyncWearable2026 } from "./posts/guida-sync-wearable-2026";
import { post as scegliereSmartwatchDati2026 } from "./posts/scegliere-smartwatch-dati-2026";
import { post as healthConnectVsSamsungHealth } from "./posts/health-connect-vs-samsung-health";
import { post as backupGalaxyWatchPc } from "./posts/backup-galaxy-watch-pc";
import { post as esportareDatiFitbitGoogle } from "./posts/esportare-dati-fitbit-google";
import { post as vedereDatiWearableBrowserPc } from "./posts/vedere-dati-wearable-browser-pc";
import { post as alternativeAppSyncWearable2026 } from "./posts/alternative-app-sync-wearable-2026";
import { post as gdprDatiFitnessSmartwatch } from "./posts/gdpr-dati-fitness-smartwatch";
import { post as comeFunzionaHealthConnect } from "./posts/come-funziona-health-connect";
import { post as hrvCoeSignificatoValori } from "./posts/hrv-cose-significato-valori";
import { post as passiNonSiSincronizzanoGalaxyWatch } from "./posts/passi-non-si-sincronizzano-galaxy-watch";
// Goldmine batch 2
import { post as smartwatchPerAnzianiGuida } from "./posts/smartwatch-per-anziani-guida";
import { post as esportareDatiGarmin } from "./posts/esportare-dati-garmin";
import { post as syncSamsungHealthGoogleFit } from "./posts/sync-samsung-health-google-fit";
import { post as bestSmartwatchForElderly } from "./posts/best-smartwatch-for-elderly";
// Batch 3
import { post as smartwatchEstate2026 } from "./posts/smartwatch-estate-2026";
import { post as healthConnectNotSyncing } from "./posts/health-connect-not-syncing";
import { post as howToExportAppleHealthData } from "./posts/how-to-export-apple-health-data";
// Batch 4
import { post as fitbitDataNotSyncingAndroid } from "./posts/fitbit-data-not-syncing-android";

const RAW_POSTS: BlogPost[] = [
  guidaSyncWearable2026,
  scegliereSmartwatchDati2026,
  healthConnectVsSamsungHealth,
  backupGalaxyWatchPc,
  esportareDatiFitbitGoogle,
  vedereDatiWearableBrowserPc,
  alternativeAppSyncWearable2026,
  gdprDatiFitnessSmartwatch,
  comeFunzionaHealthConnect,
  hrvCoeSignificatoValori,
  passiNonSiSincronizzanoGalaxyWatch,
  // Goldmine batch 2
  smartwatchPerAnzianiGuida,
  esportareDatiGarmin,
  syncSamsungHealthGoogleFit,
  bestSmartwatchForElderly,
  // Batch 3
  smartwatchEstate2026,
  healthConnectNotSyncing,
  howToExportAppleHealthData,
  // Batch 4
  fitbitDataNotSyncingAndroid,
];

/** Ordinati per data publish desc (più recente prima). */
export const BLOG_POSTS: BlogPost[] = [...RAW_POSTS].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);

export const BLOG_POSTS_BY_SLUG: Record<string, BlogPost> = Object.fromEntries(
  BLOG_POSTS.map((p) => [p.slug, p]),
);

export const BLOG_SLUGS: string[] = BLOG_POSTS.map((p) => p.slug);

export function postsByCategory(c: BlogCategory): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.category === c);
}

/** Risolve gli slug di related in oggetti `BlogPost`. Filtra slug invalidi. */
export function relatedPosts(slugs: string[] | undefined): BlogPost[] {
  if (!slugs?.length) return [];
  return slugs
    .map((s) => BLOG_POSTS_BY_SLUG[s])
    .filter((p): p is BlogPost => Boolean(p));
}

export type { BlogPost, BlogCategory } from "./types";
export { categoryLabel } from "./types";
