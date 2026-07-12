/**
 * Landing "fitness data sync" (sprint P0.2, Fase 3).
 *
 * Fonte per /{locale}/fitness-data-sync (route dedicata, non /lp/[slug] —
 * pagina commerciale top-level per intento generico "sync fitness data").
 *
 * Solo EN è popolato in questa fase. IT/DE/ES arrivano in Fase 7
 * (traduzione) — vedi FITNESS_DATA_SYNC_COMPLETE_LOCALES in
 * lib/content/static-page-locales.ts, che va estesa quando le traduzioni
 * sono pronte.
 *
 * Verità commerciale alla base di questo contenuto (verificata nel codice
 * dell'app, non assunta): Strava legge in live oggi, l'invio verso Strava è
 * in sviluppo (buildWriteAuthorizationUrl() non ha ancora un trigger UI
 * verificato su device reale); TrainingPeaks non è ancora funzionante
 * end-to-end; Health Connect e Apple Health hanno write-back reale,
 * opt-in, off di default. Data di verifica: 2026-07-12.
 */

export type IntegrationDirection = "read" | "write" | "read-write" | "export";
export type IntegrationStatus =
  | "live"
  | "in-development"
  | "roadmap"
  | "beta";

export interface CompatibilityRow {
  source: string;
  platform: string;
  connectionMethod: string;
  direction: IntegrationDirection;
  dataTypes: string;
  authMethod: string;
  defaultState: string;
  syncFrequency: string;
  status: IntegrationStatus;
  limitations: string;
  lastVerified: string;
  detailHref?: string;
}

/** Le 4 integrazioni con trattamento completo (tutti i campi richiesti). */
export const DETAILED_COMPATIBILITY: CompatibilityRow[] = [
  {
    source: "Strava",
    platform: "Android + iOS",
    connectionMethod: "OAuth 2.0 (PKCE mobile flow)",
    direction: "read",
    dataTypes: "Runs, rides, swims, walks, GPS track, pace, calories, heart rate",
    authMethod: "OAuth2 (scope: read, activity:read_all, profile:read_all)",
    defaultState: "Opt-in — user connects manually in Settings",
    syncFrequency: "Fetched on each app sync",
    status: "live",
    limitations:
      "Read only today. Sending FitMesh-recorded workouts back to Strava is in development and not yet available in the app.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/strava",
  },
  {
    source: "TrainingPeaks",
    platform: "Android + iOS",
    connectionMethod: "Personal Access Token (manual, pasted in Settings)",
    direction: "export",
    dataTypes: "Individual workouts (TCX)",
    authMethod: "Bearer token (user-generated PAT)",
    defaultState: "N/A — not yet functional",
    syncFrequency: "N/A",
    status: "in-development",
    limitations:
      "You can save a token in Settings today, but it isn't connected to any send action yet. This is in development, not a live integration.",
    lastVerified: "2026-07-12",
  },
  {
    source: "Health Connect",
    platform: "Android only",
    connectionMethod: "Native Android permission",
    direction: "read-write",
    dataTypes:
      "Read: everything connected sources write to Health Connect. Write-back: steps, sleep stages, one heart-rate reading per day, distance, active calories.",
    authMethod: "Native Android runtime permission",
    defaultState: "Opt-in — off by default (toggle in Settings)",
    syncFrequency:
      "Read: every sync. Write-back: runs once when you turn the toggle on, not automatically on every later sync.",
    status: "live",
    limitations:
      "Write-back doesn't include weight or HRV, and isn't re-triggered automatically on every sync (toggle it off and on again to re-export).",
    lastVerified: "2026-07-12",
  },
  {
    source: "Apple Health",
    platform: "iOS only",
    connectionMethod: "Native HealthKit permission",
    direction: "read-write",
    dataTypes:
      "Read: HealthKit sources plus the Colmi ring over direct Bluetooth. Write-back: sleep stages, steps, resting heart rate, SpO2, weight, distance, active calories.",
    authMethod: "Native HealthKit authorization",
    defaultState: "Opt-in — off by default (toggle in Settings)",
    syncFrequency: "Read: every sync. Write-back: after every successful sync.",
    status: "live",
    limitations:
      "Write-back doesn't include HRV (the cloud stores RMSSD, HealthKit expects SDNN — writing it would produce a wrong value).",
    lastVerified: "2026-07-12",
  },
];

/** Altri provider — direzione e stato, fonte: lib/providers/data.ts. */
export const OTHER_PROVIDERS_COMPATIBILITY: CompatibilityRow[] = [
  {
    source: "Galaxy Watch",
    platform: "Android",
    connectionMethod: "Samsung Health → Health Connect",
    direction: "read",
    dataTypes: "Steps, heart rate, sleep, calories, workouts",
    authMethod: "Health Connect permission",
    defaultState: "Opt-in",
    syncFrequency: "Every sync",
    status: "live",
    limitations: "Android only.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/galaxy-watch",
  },
  {
    source: "Wear OS / Pixel Watch",
    platform: "Android",
    connectionMethod: "Companion app → Health Connect",
    direction: "read",
    dataTypes: "Steps, heart rate, sleep, calories, workouts",
    authMethod: "Health Connect permission",
    defaultState: "Opt-in",
    syncFrequency: "Every sync",
    status: "live",
    limitations: "Android only.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/wear-os",
  },
  {
    source: "Xiaomi Mi Band / Watch",
    platform: "Android",
    connectionMethod: "Mi Fitness → Health Connect",
    direction: "read",
    dataTypes: "Steps, heart rate, sleep, calories",
    authMethod: "Health Connect permission",
    defaultState: "Opt-in",
    syncFrequency: "Every sync",
    status: "live",
    limitations: "Mi Band 7 and later. Android only.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/xiaomi-mi-band",
  },
  {
    source: "Fitbit",
    platform: "Android",
    connectionMethod: "Fitbit app → Health Connect (basic tier)",
    direction: "read",
    dataTypes: "Steps, heart rate, total sleep duration, calories",
    authMethod: "Health Connect permission",
    defaultState: "Opt-in",
    syncFrequency: "Every sync",
    status: "beta",
    limitations:
      "Detailed sleep stages and GPS workouts need the official Fitbit Web API OAuth, still on the roadmap. Basic metrics work today via Health Connect.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/fitbit",
  },
  {
    source: "Garmin Connect",
    platform: "Android",
    connectionMethod: "Garmin Connect app → Health Connect (basic tier)",
    direction: "read",
    dataTypes: "Steps, heart rate, sleep, calories, distance, basic workouts",
    authMethod: "Health Connect permission",
    defaultState: "Opt-in",
    syncFrequency: "Every sync",
    status: "beta",
    limitations:
      "Body Battery, Training Load, Recovery Time and detailed GPS need the official Garmin Health API OAuth, still on the roadmap.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/garmin",
  },
  {
    source: "Polar",
    platform: "Android",
    connectionMethod: "Polar Flow → Health Connect (basic tier)",
    direction: "read",
    dataTypes: "Steps, heart rate, sleep, calories",
    authMethod: "Health Connect permission",
    defaultState: "Opt-in",
    syncFrequency: "Every sync",
    status: "beta",
    limitations: "Accesslink OAuth for advanced metrics is on the roadmap.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/polar",
  },
  {
    source: "Withings",
    platform: "Android",
    connectionMethod: "Health Mate → Health Connect (basic tier)",
    direction: "read",
    dataTypes: "Weight, sleep, heart rate, steps",
    authMethod: "Health Connect permission",
    defaultState: "Opt-in",
    syncFrequency: "Every sync",
    status: "beta",
    limitations: "Official OAuth API v2 for advanced metrics is on the roadmap.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/withings",
  },
  {
    source: "Suunto",
    platform: "Android",
    connectionMethod: "OAuth",
    direction: "read",
    dataTypes: "Workouts, heart rate",
    authMethod: "OAuth2",
    defaultState: "Opt-in",
    syncFrequency: "Every sync",
    status: "beta",
    limitations: "In active testing.",
    lastVerified: "2026-07-12",
  },
  {
    source: "Oura Ring",
    platform: "Android",
    connectionMethod: "OAuth (dedicated integration)",
    direction: "read",
    dataTypes: "Sleep, readiness, heart rate",
    authMethod: "OAuth2",
    defaultState: "N/A",
    syncFrequency: "N/A",
    status: "roadmap",
    limitations:
      "Not connectable yet through FitMesh's dedicated Oura integration. If your Oura app already writes to Health Connect on your phone, FitMesh's generic Health Connect read may still pick up that data independently.",
    lastVerified: "2026-07-12",
  },
  {
    source: "Huawei Health",
    platform: "Android",
    connectionMethod: "Huawei Health Kit OAuth",
    direction: "read",
    dataTypes: "Steps, heart rate, sleep",
    authMethod: "OAuth2",
    defaultState: "N/A",
    syncFrequency: "N/A",
    status: "roadmap",
    limitations: "Under evaluation.",
    lastVerified: "2026-07-12",
  },
  {
    source: "Colmi Ring",
    platform: "Android + iOS",
    connectionMethod: "Direct Bluetooth (no health hub needed)",
    direction: "read",
    dataTypes: "Heart rate, SpO2, HRV, stress, sleep, temperature",
    authMethod: "Bluetooth pairing",
    defaultState: "Opt-in — connect the ring in the app",
    syncFrequency: "Every sync",
    status: "live",
    limitations: "None specific to this connection method.",
    lastVerified: "2026-07-12",
    detailHref: "/sync/colmi-ring",
  },
];

export interface FaqEntry {
  q: string;
  a: string;
}

export const FITNESS_DATA_SYNC_FAQ: FaqEntry[] = [
  {
    q: "What is fitness data sync?",
    a: "Fitness data sync means moving or combining health and workout data across the apps and wearables you actually use, so you don't have to check five different apps to see your steps, sleep and workouts. It can mean a platform-level health hub (Health Connect on Android, Apple Health on iOS), a bridge app that moves data from one specific app to another, or an independent dashboard that reads from multiple sources and shows them in one place. FitMesh Sync is the third kind: a dashboard.",
  },
  {
    q: "What is the difference between a health hub, a bridge app and a fitness dashboard?",
    a: "A health hub (Health Connect, Apple Health) is a permission-gated data store built into the OS: apps read and write to it, but it has no dashboard of its own. A bridge app moves data from one specific source to one specific destination, usually for a narrow use case (e.g. exporting a single workout file). An independent dashboard, like FitMesh Sync, reads from multiple connected sources at once, deduplicates overlapping data, and shows everything in one view. Dashboards don't promise to write everywhere a bridge app might.",
  },
  {
    q: "Can FitMesh sync data between every fitness app?",
    a: "No. FitMesh reads from Health Connect (Android), Apple Health plus a direct Bluetooth connection to the Colmi ring (iOS), and a growing list of OAuth-connected providers (see the compatibility table above). It is not a universal bridge that can move data between any two arbitrary apps. Some integrations are read-only today, some also support a specific, limited write-back, and some are still in development. Check the table for the exact status of the source or destination you care about before assuming it works.",
  },
  {
    q: "How does FitMesh handle duplicate fitness data?",
    a: "When multiple sources report the same metric for the same day (e.g. your phone counting steps and your watch also counting steps), FitMesh applies per-metric fusion rules rather than summing everything: it picks the more complete or more accurate source and fills gaps from the others, instead of double-counting. When FitMesh writes data back to Health Connect or Apple Health, it also tags what it writes so its own read pass on a later sync doesn't pick that data back up as a new foreign source, which is what would cause a sync loop.",
  },
  {
    q: "Does FitMesh work on Android and iPhone?",
    a: "Yes, on both, but the underlying connection is different per platform. On Android, FitMesh reads from Health Connect, which is fed by whichever companion apps you already have installed (Samsung Health, Garmin Connect, Fitbit, and more). On iPhone, FitMesh reads from Apple Health and can also connect directly to the Colmi ring over Bluetooth, without needing Apple Health as an intermediary for that specific device.",
  },
  {
    q: "Can FitMesh write my data to other apps?",
    a: "In a limited, opt-in way. FitMesh can write its deduplicated, fused data back to Health Connect (Android) and Apple Health (iOS), off by default until you turn it on in Settings. Sending individual workouts to Strava, TrainingPeaks or similar training platforms is a separate, narrower capability that's still in development for some destinations. This isn't a general-purpose \"sync to anywhere\" feature: check the compatibility table for what's actually available today for the destination you have in mind.",
  },
];
