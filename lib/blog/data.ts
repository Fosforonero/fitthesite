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
import { post as bestHealthDataSyncAppAndroid } from "./posts/best-health-data-sync-app-android";
// Batch 5
import { post as piuSmartwatchInsiemeDatiDoppi } from "./posts/piu-smartwatch-insieme-dati-doppi";
// Pillar Colmi
import { post as colmiRingFitmesh } from "./posts/colmi-ring-fitmesh";
// iOS launch batch
import { post as fitmeshArrivaSuIphone } from "./posts/fitmesh-arriva-su-iphone";
import { post as datiAnelloSmartAppleSalute } from "./posts/dati-anello-smart-apple-salute";
// Novità (release notes / sezione /novita)
import { post as novitaAnelloColmiSonno } from "./posts/novita-anello-colmi-sonno";
import { post as novitaDashboardMultiDevice } from "./posts/novita-dashboard-multi-device";
import { post as novitaFitmeshAppStore } from "./posts/novita-fitmesh-su-app-store";
import { post as scrivereDatiAndroidSuAppleSalute } from "./posts/scrivere-dati-android-su-apple-salute";
import { post as daAndroidAIphoneDatiFitness } from "./posts/da-android-a-iphone-dati-fitness";
import { post as anelloOrologioScenariReali } from "./posts/anello-orologio-scenari-reali";
// Cluster anello smart
import { post as anelloVsSmartwatch } from "./posts/anello-vs-smartwatch";
import { post as anelloSmartGuidaCompleta } from "./posts/anello-smart-guida-completa";
import { post as miglioriAnelliEconomici } from "./posts/migliori-anelli-economici";
import { post as tracciareSonnoAnello } from "./posts/tracciare-sonno-anello";
import { post as colmiR02Setup } from "./posts/colmi-r02-setup";
import { post as syncThemAll } from "./posts/sync-them-all";
// Novità: fonte del dato (provenienza per-dispositivo)
import { post as novitaFonteDelDato } from "./posts/novita-fonte-del-dato";
// Novità: lancio su Google Play
import { post as fitmeshSyncDisponibileGooglePlay } from "./posts/fitmesh-sync-disponibile-google-play";
// Google Fit: dismissione API 2026 (intento developer)
import { post as googleFitApiDismissione } from "./posts/google-fit-api-dismissione-2026";
// Net-new 18/06: Xiaomi/Amazfit, Withings, Pixel Watch
import { post as esportareDatiXiaomiAmazfit } from "./posts/esportare-dati-xiaomi-amazfit";
import { post as sincronizzareWithings } from "./posts/sincronizzare-withings";
import { post as datiPixelWatchDashboard } from "./posts/dati-pixel-watch-dashboard";
// Huawei Health integration guide
import { post as huaweiHealthHealthConnect } from "./posts/huawei-health-health-connect-sincronizzazione";
// Garmin Body Battery / Health Connect gap
// REWRITTEN 2026-07-15 (Sprint P0.6A): the original article's core premise
// ("FitMesh Pro offers a direct Garmin OAuth connection for Body Battery/
// stress/VO2 max") did not exist in the app and was unpublished 2026-07-14.
// Rewritten to describe reality: Garmin's basic metrics (steps/HR/sleep/
// calories/SpO2/workouts) reach FitMesh via the generic Health Connect
// bridge; Body Battery/stress/VO2 max reach neither Health Connect nor
// FitMesh, since Garmin doesn't export them and FitMesh has no direct
// Garmin OAuth connection. Same slug/canonical/publishedAt preserved.
import { post as garminBodyBatteryHealthConnect } from "./posts/garmin-body-battery-health-connect";
// SEO wave 21/06
import { post as polarHealthConnectSync } from "./posts/polar-health-connect-sync";
import { post as googleHealthGoogleFit } from "./posts/google-health-google-fit";
import { post as sleepTrackerComparison2026 } from "./posts/sleep-tracker-comparison-2026";
import { post as garminSamsungHealthSyncGuide } from "./posts/garmin-samsung-health-sync-guide";
import { post as galaxyRingAndroidHealthConnect } from "./posts/galaxy-ring-android-health-connect";
import { post as vo2MaxWearableComparison2026 } from "./posts/vo2-max-wearable-comparison-2026";
import { post as ouraRingHealthConnectAndroid } from "./posts/oura-ring-health-connect-android";
// BOFU pricing / founder
import { post as fitmeshGratisPrezzoFounder } from "./posts/fitmesh-gratis-prezzo-founder";
// Backlog 02/07: affidabilità Colmi R02 + cambio wearable senza perdere storico
import { post as anelloColmiR02Affidabile } from "./posts/anello-colmi-r02-affidabile";
import { post as cambiareSmartwatchSenzaPerdereDati } from "./posts/cambiare-smartwatch-senza-perdere-dati";
// Guida "come funziona" con screenshot reali
import { post as comeFunzionaFitmesh } from "./posts/come-funziona-fitmesh";
// BOFU fiducia: server UE
import { post as doveSonoITuoiDatiServerUe } from "./posts/dove-sono-i-tuoi-dati-server-ue";
// Annuncio Mesh Famiglia + comparison competitor + BOFU urgenza founder (04/07)
import { post as meshFamigliaLancio } from "./posts/mesh-famiglia-lancio";
import { post as fitmeshVsAlternativeSync } from "./posts/fitmesh-vs-alternative-sync";
import { post as percheDiventareFounderFitmesh } from "./posts/perche-diventare-founder-fitmesh";
// Stato Colmi ring: cosa funziona oggi (R02/R03) + sviluppo temperatura R09 (05/07)
import { post as colmiR09TemperaturaSviluppo } from "./posts/colmi-r09-temperatura-sviluppo";
// P1.1 Fase 9: content cluster FitMesh Labs (HRV + Sleep Efficiency).
import { post as efficienzaDelSonnoFormulaCalcolo } from "./posts/efficienza-del-sonno-formula-calcolo";
import { post as metricheRecuperoHrvSonnoFrequenzaCardiaca } from "./posts/metriche-recupero-hrv-sonno-frequenza-cardiaca";
// P1.3N — DRAFT pre-evento Galaxy Unpacked (2026-07-22), slug/nome prodotto
// PROVVISORI. Registrato solo per testare la pipeline in locale: questo
// branch non viene pushato prima della conferma Samsung.
import { post as galaxyWatchUltra2HealthConnect } from "./posts/galaxy-watch-ultra-2-health-connect";

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
  bestHealthDataSyncAppAndroid,
  // Batch 5
  piuSmartwatchInsiemeDatiDoppi,
  // Pillar Colmi
  colmiRingFitmesh,
  // iOS launch batch
  fitmeshArrivaSuIphone,
  datiAnelloSmartAppleSalute,
  // Novità (release notes)
  novitaAnelloColmiSonno,
  novitaDashboardMultiDevice,
  novitaFitmeshAppStore,
  scrivereDatiAndroidSuAppleSalute,
  daAndroidAIphoneDatiFitness,
  anelloOrologioScenariReali,
  // Cluster anello smart
  anelloSmartGuidaCompleta,
  anelloVsSmartwatch,
  miglioriAnelliEconomici,
  tracciareSonnoAnello,
  colmiR02Setup,
  syncThemAll,
  novitaFonteDelDato,
  fitmeshSyncDisponibileGooglePlay,
  // Google Fit: dismissione API 2026
  googleFitApiDismissione,
  // Net-new 18/06
  esportareDatiXiaomiAmazfit,
  sincronizzareWithings,
  datiPixelWatchDashboard,
  // Huawei Health integration guide
  huaweiHealthHealthConnect,
  // Garmin Body Battery / Health Connect gap
  garminBodyBatteryHealthConnect,
  // SEO wave 21/06
  polarHealthConnectSync,
  googleHealthGoogleFit,
  sleepTrackerComparison2026,
  garminSamsungHealthSyncGuide,
  galaxyRingAndroidHealthConnect,
  vo2MaxWearableComparison2026,
  ouraRingHealthConnectAndroid,
  // BOFU pricing / founder
  fitmeshGratisPrezzoFounder,
  anelloColmiR02Affidabile,
  cambiareSmartwatchSenzaPerdereDati,
  comeFunzionaFitmesh,
  doveSonoITuoiDatiServerUe,
  // Mesh Famiglia + comparison competitor + BOFU urgenza founder (04/07)
  meshFamigliaLancio,
  fitmeshVsAlternativeSync,
  percheDiventareFounderFitmesh,
  colmiR09TemperaturaSviluppo,
  efficienzaDelSonnoFormulaCalcolo,
  metricheRecuperoHrvSonnoFrequenzaCardiaca,
  galaxyWatchUltra2HealthConnect,
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
