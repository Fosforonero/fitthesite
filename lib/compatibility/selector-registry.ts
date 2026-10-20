export type SelectorPhoneOs = "android" | "ios";

export type SelectorDevice =
  | "garmin"
  | "samsung"
  | "fitbit"
  | "pixel"
  | "apple-watch"
  | "oura"
  | "colmi"
  | "whoop"
  | "polar"
  | "google-fit"
  | "withings";

export type SelectorMetric =
  | "steps"
  | "heart_rate"
  | "sleep"
  | "sleep_stages"
  | "hrv"
  | "spo2"
  | "temperature"
  | "body_battery"
  | "energy_score"
  | "readiness"
  | "vo2_max"
  | "workouts";

export type SelectorStatus =
  | "direct_verified"
  | "health_store"
  | "conditional"
  | "unsupported"
  | "unverified";

export interface SelectorRouteStep {
  device: { it: string; en: string };
  sourceApp: { it: string; en: string };
  healthStore: { it: string; en: string } | null;
  fitmeshApp: { it: string; en: string };
}

export interface SelectorResult {
  status: SelectorStatus;
  statusBadge: { it: string; en: string };
  route: SelectorRouteStep;
  explanation: { it: string; en: string };
  limitations: { it: string; en: string };
  evidence: { it: string; en: string };
  cta: {
    type: "guide" | "store" | "none";
    label: { it: string; en: string };
    guideSlug?: string;
    href?: { it: string; en: string };
  };
}

export interface DeviceOption {
  id: SelectorDevice;
  label: { it: string; en: string };
  category: "watch" | "ring" | "band" | "platform";
}

export interface MetricOption {
  id: SelectorMetric;
  label: { it: string; en: string };
  category: "activity" | "cardio" | "sleep" | "advanced";
}

export const SELECTOR_GUIDE_SLUGS: readonly string[] = [
  "colmi-r02-setup",
  "colmi-r09-temperatura-sviluppo",
  "garmin-samsung-health-sync-guide",
  "garmin-body-battery-health-connect",
  "passi-non-si-sincronizzano-galaxy-watch",
  "health-connect-vs-samsung-health",
  "health-connect-not-syncing",
  "fitbit-data-not-syncing-android",
  "esportare-dati-fitbit-google",
  "dati-pixel-watch-dashboard",
  "how-to-export-apple-health-data",
  "oura-ring-health-connect-android",
];

export const SELECTOR_DEVICES: readonly DeviceOption[] = [
  { id: "garmin", label: { it: "Garmin (Forerunner, Fenix, Venu)", en: "Garmin (Forerunner, Fenix, Venu)" }, category: "watch" },
  { id: "samsung", label: { it: "Samsung Galaxy Watch (Wear OS)", en: "Samsung Galaxy Watch (Wear OS)" }, category: "watch" },
  { id: "pixel", label: { it: "Google Pixel Watch", en: "Google Pixel Watch" }, category: "watch" },
  { id: "apple-watch", label: { it: "Apple Watch (Series, Ultra, SE)", en: "Apple Watch (Series, Ultra, SE)" }, category: "watch" },
  { id: "fitbit", label: { it: "Fitbit (Sense, Versa, Charge)", en: "Fitbit (Sense, Versa, Charge)" }, category: "band" },
  { id: "colmi", label: { it: "Colmi Ring (R02, R06, R09)", en: "Colmi Ring (R02, R06, R09)" }, category: "ring" },
  { id: "oura", label: { it: "Oura Ring (Gen 3, Gen 4)", en: "Oura Ring (Gen 3, Gen 4)" }, category: "ring" },
  { id: "polar", label: { it: "Polar (Vantage, Pacer, Grit)", en: "Polar (Vantage, Pacer, Grit)" }, category: "watch" },
  { id: "google-fit", label: { it: "Google Fit (Servizio in dismissione)", en: "Google Fit (Deprecated service)" }, category: "platform" },
  { id: "whoop", label: { it: "Whoop 4.0", en: "Whoop 4.0" }, category: "band" },
  { id: "withings", label: { it: "Withings (ScanWatch, bilance)", en: "Withings (ScanWatch, scales)" }, category: "watch" },
];

export const SELECTOR_METRICS: readonly MetricOption[] = [
  { id: "steps", label: { it: "Passi giornalieri", en: "Daily steps" }, category: "activity" },
  { id: "heart_rate", label: { it: "Frequenza cardiaca", en: "Heart rate" }, category: "cardio" },
  { id: "sleep", label: { it: "Durata totale sonno", en: "Total sleep duration" }, category: "sleep" },
  { id: "sleep_stages", label: { it: "Fasi del sonno (REM, profondo, leggero)", en: "Sleep stages (REM, deep, light)" }, category: "sleep" },
  { id: "hrv", label: { it: "Variabilità cardiaca (HRV)", en: "Heart rate variability (HRV)" }, category: "cardio" },
  { id: "spo2", label: { it: "Ossigenazione sangue (SpO2)", en: "Blood oxygen (SpO2)" }, category: "cardio" },
  { id: "temperature", label: { it: "Variazione temperatura cutanea", en: "Skin temperature variation" }, category: "advanced" },
  { id: "body_battery", label: { it: "Body Battery / Training Load (Garmin)", en: "Body Battery / Training Load (Garmin)" }, category: "advanced" },
  { id: "energy_score", label: { it: "Energy Score (Samsung)", en: "Energy Score (Samsung)" }, category: "advanced" },
  { id: "readiness", label: { it: "Readiness Score (Apple / Oura)", en: "Readiness Score (Apple / Oura)" }, category: "advanced" },
  { id: "vo2_max", label: { it: "VO2 Max stimato", en: "Estimated VO2 Max" }, category: "cardio" },
  { id: "workouts", label: { it: "Sessioni di allenamento e distanze", en: "Workout sessions and distance" }, category: "activity" },
];

const STORE_HREF = { it: "/it#download", en: "/en#download" };

function buildCrossVendorScoreUnsupported(
  deviceLabel: { it: string; en: string },
  sourceAppLabel: { it: string; en: string },
  scoreOwner: { it: string; en: string },
  referenceDoc: { it: string; en: string }
): SelectorResult {
  return {
    status: "unsupported",
    statusBadge: { it: "Non letta da FitMesh per questo dispositivo", en: "Not read by FitMesh for this device" },
    route: {
      device: deviceLabel,
      sourceApp: sourceAppLabel,
      healthStore: null,
      fitmeshApp: { it: "Percorso non disponibile", en: "Route not available" },
    },
    explanation: {
      it: `Questa e' una metrica proprietaria dell'ecosistema ${scoreOwner.it}. FitMesh non la legge per ${deviceLabel.it}: qui non risulta documentata un'esportazione equivalente verso l'archivio salute dello smartphone.`,
      en: `This is a proprietary metric of the ${scoreOwner.en} ecosystem. FitMesh does not read it for ${deviceLabel.en}: no equivalent export to the phone's health store is documented here.`,
    },
    limitations: {
      it: "I punteggi sintetici proprietari non sono intercambiabili tra produttori diversi.",
      en: "Proprietary composite scores are not interchangeable across different hardware vendors.",
    },
    evidence: referenceDoc,
    cta: {
      type: "none",
      label: { it: "Nessun percorso documentato per questo dispositivo", en: "No documented route for this device" },
    },
  };
}

function buildWorkoutsConditionalResult(
  os: SelectorPhoneOs,
  deviceLabel: { it: string; en: string },
  sourceAppLabel: { it: string; en: string },
  evidenceText: { it: string; en: string },
  guideCanonicalSlug: string,
  guideLabel: { it: string; en: string },
  sessionsNamedBySource = true
): SelectorResult {
  const storeIt = os === "android" ? "Health Connect" : "Apple Salute (HealthKit)";
  const storeEn = os === "android" ? "Health Connect" : "Apple Health (HealthKit)";
  return {
    status: "conditional",
    statusBadge: sessionsNamedBySource
      ? { it: "Sessioni lette; distanze in verifica", en: "Sessions read; distances under verification" }
      : { it: "Dati di attività letti; sedute non confermate dalla fonte", en: "Activity data read; sessions not confirmed by the source" },
    route: {
      device: deviceLabel,
      sourceApp: sourceAppLabel,
      healthStore: { it: storeIt, en: storeEn },
      fitmeshApp: { it: "FitMesh Sync (lettura locale)", en: "FitMesh Sync (local read)" },
    },
    explanation: sessionsNamedBySource
      ? {
          it: `${sourceAppLabel.it} esporta le sessioni di allenamento verso ${storeIt}, da dove FitMesh legge durata, calorie e attività. La precisione delle distanze degli allenamenti è attualmente in verifica.`,
          en: `${sourceAppLabel.en} exports workout sessions to ${storeEn}, from which FitMesh reads duration, calories, and activity. Workout distance accuracy is currently under verification.`,
        }
      : {
          it: `L'elenco di ${sourceAppLabel.it} per ${storeIt} nomina dati di attività (distanza, velocità, frequenza cardiaca, calorie) ma non le sedute di allenamento come voce a parte. FitMesh legge le sedute se ${storeIt} le contiene; che ${sourceAppLabel.it} le scriva non è confermato dalla fonte. La precisione delle distanze è in verifica.`,
          en: `${sourceAppLabel.en}'s list for ${storeEn} names activity data (distance, speed, heart rate, calories) but not workout sessions as a separate item. FitMesh reads sessions if ${storeEn} contains them; the source does not confirm that ${sourceAppLabel.en} writes them. Distance accuracy is under verification.`,
        },
    limitations: {
      it: "Le distanze degli allenamenti sono in verifica e possono risultare sovrastimate quando più applicazioni registrano o esportano la stessa sessione. FitMesh non promette la deduplicazione automatica.",
      en: "Workout distances are under verification and may appear inflated when multiple applications record or export the same session. FitMesh does not promise automatic deduplication.",
    },
    evidence: evidenceText,
    cta: {
      type: "guide",
      label: guideLabel,
      guideSlug: guideCanonicalSlug,
    },
  };
}

function buildColmiDirectVerified(os: SelectorPhoneOs): SelectorResult {
  const matrixId = os === "ios" ? "colmi-ios" : "colmi-android";
  return {
    status: "direct_verified",
    statusBadge: {
      it: "Connessione BLE diretta (documentata nel codice)",
      en: "Direct BLE connection (documented in code)",
    },
    route: {
      device: { it: "Colmi Smart Ring (R02, R06, R09)", en: "Colmi Smart Ring (R02, R06, R09)" },
      sourceApp: { it: "Nessuna app intermedia richiesta", en: "No intermediate app required" },
      healthStore: null,
      fitmeshApp: { it: "FitMesh Sync (lettura BLE diretta)", en: "FitMesh Sync (direct BLE read)" },
    },
    explanation: {
      it:
        os === "ios"
          ? "FitMesh Sync prevede il collegamento diretto all'anello Colmi via Bluetooth Low Energy (CoreBluetooth) per leggere passi, frequenza cardiaca e sonno senza app o cloud del produttore. Su iPhone è prevista anche la scrittura opzionale verso Apple Salute per passi e frequenza a riposo."
          : "FitMesh Sync prevede il collegamento diretto all'anello Colmi via Bluetooth Low Energy per leggere passi in bucket da 15 minuti, frequenza cardiaca e sonno con stadi senza passare dall'app o dal cloud del produttore.",
      en:
        os === "ios"
          ? "FitMesh Sync implements a direct Bluetooth Low Energy (CoreBluetooth) connection to the Colmi ring to read steps, heart rate, and sleep without the manufacturer app or cloud. Optional write-back to Apple Health is available on iPhone for steps and resting heart rate."
          : "FitMesh Sync implements a direct Bluetooth Low Energy connection to the Colmi ring to read 15-minute step buckets, heart rate, and sleep with stages without routing through the manufacturer app or cloud.",
    },
    limitations: {
      it:
        os === "ios"
          ? "Richiede la vicinanza Bluetooth dell'anello durante la sincronizzazione. La scrittura verso Apple Salute è opzionale (disattivata di default) e non include il sonno nella versione pubblica corrente."
          : "Richiede la vicinanza Bluetooth dell'anello allo smartphone durante la sincronizzazione. Non viene promessa la deduplicazione automatica se si indossano più dispositivi contemporaneamente.",
      en:
        os === "ios"
          ? "Requires the ring to be within Bluetooth range during sync. Write-back to Apple Health is optional (disabled by default) and excludes sleep in the current public release."
          : "Requires the ring to remain within Bluetooth range of the smartphone during sync. Automatic deduplication is not promised when wearing multiple devices simultaneously.",
    },
    evidence: {
      it: `Specifiche del driver BLE diretto documentate nella scheda ${matrixId} di lib/compatibility/matrix-data.ts e in lib/providers/data.ts (colmi-ring).`,
      en: `Direct BLE driver specifications documented in entry ${matrixId} of lib/compatibility/matrix-data.ts and in lib/providers/data.ts (colmi-ring).`,
    },
    cta: {
      type: "guide",
      label: { it: "Guida configurazione anello Colmi", en: "Colmi ring setup guide" },
      guideSlug: "colmi-r02-setup",
    },
  };
}

function buildColmiSpo2Conditional(): SelectorResult {
  return {
    status: "conditional",
    statusBadge: { it: "Supporto condizionale (SpO2)", en: "Conditional support (SpO2)" },
    route: {
      device: { it: "Colmi Smart Ring (R02, R06, R09)", en: "Colmi Smart Ring (R02, R06, R09)" },
      sourceApp: { it: "Nessuna app intermedia richiesta", en: "No intermediate app required" },
      healthStore: null,
      fitmeshApp: { it: "FitMesh Sync (lettura BLE diretta)", en: "FitMesh Sync (direct BLE read)" },
    },
    explanation: {
      it: "Il driver BLE di FitMesh supporta la lettura delle misurazioni di saturazione ossigeno (SpO2) dall'anello tramite Bluetooth Low Energy.",
      en: "The FitMesh BLE driver supports reading blood oxygen (SpO2) measurements from the ring via Bluetooth Low Energy.",
    },
    limitations: {
      it: "Questa pagina non descrive come FitMesh combini la SpO2 dell'anello con quella di altre fonti.",
      en: "This page does not describe how FitMesh combines the ring's SpO2 with other sources.",
    },
    evidence: {
      it: "Specifiche del driver BLE documentate in lib/compatibility/matrix-data.ts e lib/providers/data.ts (colmi-ring).",
      en: "BLE driver specifications documented in lib/compatibility/matrix-data.ts and lib/providers/data.ts (colmi-ring).",
    },
    cta: {
      type: "store",
      label: { it: "Scarica FitMesh Sync", en: "Download FitMesh Sync" },
      href: STORE_HREF,
    },
  };
}

function buildColmiTemperatureConditional(): SelectorResult {
  return {
    status: "conditional",
    statusBadge: { it: "Dipendente dal modello (R02 / R09)", en: "Model-dependent (R02 / R09)" },
    route: {
      device: { it: "Colmi Smart Ring (modelli con sensore termico)", en: "Colmi Smart Ring (models with thermal sensor)" },
      sourceApp: { it: "Nessuna app intermedia richiesta", en: "No intermediate app required" },
      healthStore: null,
      fitmeshApp: { it: "FitMesh Sync (lettura BLE diretta)", en: "FitMesh Sync (direct BLE read)" },
    },
    explanation: {
      it: "Secondo la documentazione di compatibilità FitMesh, il sensore di temperatura cutanea è presente sui modelli Colmi R02 e R09, mentre non è presente sul modello R06.",
      en: "Per FitMesh compatibility documentation, skin temperature sensing is present on Colmi R02 and R09 models, whereas the R06 model lacks a physical thermal sensor.",
    },
    limitations: {
      it: "Disponibile solo sui modelli dotati del sensore fisico; rileva le variazioni cutanee periferiche e non sostituisce un termometro clinico.",
      en: "Available only on models equipped with the physical sensor; tracks peripheral skin variation and does not replace a clinical thermometer.",
    },
    evidence: {
      it: "Scheda tecnica in lib/compatibility/matrix-data.ts (colmi-android / colmi-ios) e approfondimento tecnico colmi-r09-temperatura-sviluppo in lib/blog/data.ts.",
      en: "Technical specification in lib/compatibility/matrix-data.ts (colmi-android / colmi-ios) and technical analysis colmi-r09-temperatura-sviluppo in lib/blog/data.ts.",
    },
    cta: {
      type: "guide",
      label: { it: "Leggi l'approfondimento temperatura Colmi R09", en: "Read the Colmi R09 temperature guide" },
      guideSlug: "colmi-r09-temperatura-sviluppo",
    },
  };
}

function buildGarminSupportedOrConditional(
  os: SelectorPhoneOs,
  metric: "steps" | "heart_rate" | "sleep" | "sleep_stages"
): SelectorResult {
  const isAndroid = os === "android";
  const storeIt = isAndroid ? "Health Connect" : "Apple Salute (HealthKit)";
  const storeEn = isAndroid ? "Health Connect" : "Apple Health (HealthKit)";
  const faqUrl = isAndroid
    ? "https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5"
    : "https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA";

  const isConditional = !isAndroid || metric === "sleep_stages";

  return {
    status: isConditional ? "conditional" : "health_store",
    statusBadge: isConditional
      ? { it: `Condizionale via ${storeIt}`, en: `Conditional via ${storeEn}` }
      : { it: `Supportato via ${storeIt}`, en: `Supported via ${storeEn}` },
    route: {
      device: { it: "Smartwatch Garmin", en: "Garmin Smartwatch" },
      sourceApp: { it: "Garmin Connect", en: "Garmin Connect" },
      healthStore: { it: storeIt, en: storeEn },
      fitmeshApp: { it: "FitMesh Sync (lettura locale autorizzata)", en: "FitMesh Sync (authorized local read)" },
    },
    explanation: {
      it: `Garmin Connect sincronizza l'orologio ed esporta passi, frequenza cardiaca e sonno verso ${storeIt}. FitMesh legge i record locali senza richiedere le credenziali dell'account Garmin.`,
      en: `Garmin Connect syncs the watch and exports steps, heart rate, and sleep to ${storeEn}. FitMesh reads the local records without requiring your Garmin account credentials.`,
    },
    limitations: {
      it: isAndroid
        ? metric === "sleep_stages"
          ? "La disponibilità delle fasi dettagliate del sonno dipende dal supporto del singolo modello hardware Garmin e dalla sincronizzazione con Garmin Connect."
          : "Richiede l'apertura periodica di Garmin Connect per completare la sincronizzazione Bluetooth dall'orologio e il permesso di scrittura attivo verso Health Connect."
        : "Su iPhone Garmin Connect deve essere aperta in primo piano per completare il trasferimento verso Apple Salute; lo storico iniziale copre fino a circa due settimane.",
      en: isAndroid
        ? metric === "sleep_stages"
          ? "Availability of detailed sleep stages depends on support from your specific Garmin hardware model and synchronization with Garmin Connect."
          : "Requires opening Garmin Connect periodically to complete Bluetooth sync from the watch and active write permissions to Health Connect."
        : "On iPhone, Garmin Connect must be opened in the foreground to complete data transfer to Apple Health; initial historical backfill covers up to roughly two weeks.",
    },
    evidence: {
      it: `Documentazione ufficiale Garmin Support (${faqUrl}) e matrice di compatibilità FitMesh (lib/compatibility/matrix-data.ts).`,
      en: `Official Garmin Support documentation (${faqUrl}) and FitMesh compatibility matrix (lib/compatibility/matrix-data.ts).`,
    },
    cta: {
      type: "guide",
      label: { it: "Guida alla sincronizzazione Garmin", en: "Garmin synchronization guide" },
      guideSlug: "garmin-samsung-health-sync-guide",
    },
  };
}

function buildGarminBodyBatteryUnsupported(os: SelectorPhoneOs): SelectorResult {
  const faqUrl =
    os === "android"
      ? "https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5"
      : "https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA";
  const storeIt = os === "android" ? "Health Connect" : "Apple Salute";
  const storeEn = os === "android" ? "Health Connect" : "Apple Health";

  return {
    status: "unsupported",
    statusBadge: { it: "Non esportato da Garmin", en: "Not exported by Garmin" },
    route: {
      device: { it: "Smartwatch Garmin", en: "Garmin Smartwatch" },
      sourceApp: { it: "Garmin Connect", en: "Garmin Connect" },
      healthStore: { it: `${storeIt} (metrica esclusa da Garmin)`, en: `${storeEn} (metric excluded by Garmin)` },
      fitmeshApp: { it: "Percorso non disponibile", en: "Route not available" },
    },
    explanation: {
      it: `Garmin elabora Body Battery all'interno di Garmin Connect ma non include questo indice proprietario tra i dati esportati verso ${storeIt}.`,
      en: `Garmin computes Body Battery inside Garmin Connect but does not include this proprietary index among metrics exported to ${storeEn}.`,
    },
    limitations: {
      it: "FitMesh utilizza esclusivamente i canali di sistema ufficiali e non effettua accessi non autorizzati ai server Garmin.",
      en: "FitMesh strictly uses official system health channels and does not perform unauthorized scraping of Garmin servers.",
    },
    evidence: {
      it: `Elenco ufficiale delle metriche esportate da Garmin Support (${faqUrl}).`,
      en: `Official list of exported metrics from Garmin Support (${faqUrl}).`,
    },
    cta: {
      type: "guide",
      label: { it: "Approfondisci Body Battery e Health Connect", en: "Read the Body Battery and Health Connect analysis" },
      guideSlug: "garmin-body-battery-health-connect",
    },
  };
}

function buildSamsungAndroidHealthStore(): SelectorResult {
  return {
    status: "health_store",
    statusBadge: { it: "Supportato via Health Connect", en: "Supported via Health Connect" },
    route: {
      device: { it: "Samsung Galaxy Watch (Wear OS)", en: "Samsung Galaxy Watch (Wear OS)" },
      sourceApp: { it: "Samsung Health", en: "Samsung Health" },
      healthStore: { it: "Health Connect", en: "Health Connect" },
      fitmeshApp: { it: "FitMesh Sync (lettura locale Health Connect)", en: "FitMesh Sync (local Health Connect read)" },
    },
    explanation: {
      it: "Samsung Health raccoglie passi, frequenza cardiaca e sonno dal Galaxy Watch e li scrive su Health Connect. In FitMesh la sincronizzazione dei dati Samsung avviene tramite Health Connect.",
      en: "Samsung Health collects steps, heart rate, and sleep from the Galaxy Watch and writes them to Health Connect. In FitMesh, synchronization of Samsung data takes place through Health Connect.",
    },
    limitations: {
      it: "Nelle impostazioni di Samsung Health è necessario abilitare la condivisione dei dati con Health Connect e concedere i permessi di lettura a FitMesh.",
      en: "In Samsung Health settings, data sharing with Health Connect must be enabled and read permissions granted to FitMesh.",
    },
    evidence: {
      it: "Documentazione ufficiale Samsung Developer (https://developer.samsung.com/health/health-connect-faq.html) e matrice di compatibilità FitMesh (lib/compatibility/matrix-data.ts).",
      en: "Official Samsung Developer documentation (https://developer.samsung.com/health/health-connect-faq.html) and FitMesh compatibility matrix (lib/compatibility/matrix-data.ts).",
    },
    cta: {
      type: "guide",
      label: { it: "Risoluzione passi Galaxy Watch non sincronizzati", en: "Fix Galaxy Watch steps not syncing" },
      guideSlug: "passi-non-si-sincronizzano-galaxy-watch",
    },
  };
}

function buildSamsungEnergyScoreUnsupported(): SelectorResult {
  return {
    status: "unsupported",
    statusBadge: { it: "Non disponibile tramite Health Connect", en: "Not available via Health Connect" },
    route: {
      device: { it: "Samsung Galaxy Watch", en: "Samsung Galaxy Watch" },
      sourceApp: { it: "Samsung Health", en: "Samsung Health" },
      healthStore: { it: "Health Connect (Energy Score non esportato)", en: "Health Connect (Energy Score not exported)" },
      fitmeshApp: { it: "Percorso non disponibile", en: "Route not available" },
    },
    explanation: {
      it: "Samsung documenta l'accesso all'Energy Score attraverso il proprio Samsung Health Data SDK, ma non lo esporta tramite lo standard Health Connect. In FitMesh la sincronizzazione Samsung avviene tramite Health Connect e non include l'Energy Score.",
      en: "Samsung documents Energy Score access through its Samsung Health Data SDK, but does not export it via standard Health Connect. In FitMesh, Samsung synchronization operates via Health Connect and does not include Energy Score.",
    },
    limitations: {
      it: "L'Energy Score non transita nel percorso Health Connect utilizzato da FitMesh.",
      en: "Energy Score does not transit through the Health Connect route used by FitMesh.",
    },
    evidence: {
      it: "Documentazione Samsung Health Data SDK (https://developer.samsung.com/health/data/guide/features/data-types.html) e FAQ Samsung Developer per Health Connect (https://developer.samsung.com/health/health-connect-faq.html).",
      en: "Samsung Health Data SDK documentation (https://developer.samsung.com/health/data/guide/features/data-types.html) and Samsung Developer Health Connect FAQ (https://developer.samsung.com/health/health-connect-faq.html).",
    },
    cta: {
      type: "guide",
      label: { it: "Guida sincronizzazione Samsung Health e Health Connect", en: "Samsung Health and Health Connect guide" },
      guideSlug: "health-connect-vs-samsung-health",
    },
  };
}

function buildSamsungIosUnsupported(): SelectorResult {
  return {
    status: "unsupported",
    statusBadge: { it: "Incompatibilità di piattaforma (Wear OS / iOS)", en: "Platform incompatibility (Wear OS / iOS)" },
    route: {
      device: { it: "Samsung Galaxy Watch (Wear OS)", en: "Samsung Galaxy Watch (Wear OS)" },
      sourceApp: { it: "Galaxy Wearable (solo Android)", en: "Galaxy Wearable (Android only)" },
      healthStore: null,
      fitmeshApp: { it: "Percorso non disponibile", en: "Route not available" },
    },
    explanation: {
      it: "I modelli Samsung Galaxy Watch basati su Wear OS (da Galaxy Watch 4 in avanti) richiedono uno smartphone Android con Google Mobile Services e non possono essere abbinati a iPhone.",
      en: "Wear OS-based Samsung Galaxy Watch models (Galaxy Watch 4 and newer) require an Android smartphone with Google Mobile Services and cannot pair with iPhone.",
    },
    limitations: {
      it: "Limitazione hardware e di sistema operativo definita da Samsung.",
      en: "Hardware and operating system limitation defined by Samsung.",
    },
    evidence: {
      it: "Requisiti ufficiali di compatibilità Samsung Galaxy Watch (https://www.samsung.com/us/support/answer/ANS00089142/).",
      en: "Official Samsung Galaxy Watch compatibility requirements (https://www.samsung.com/us/support/answer/ANS00089142/).",
    },
    cta: {
      type: "none",
      label: { it: "Dispositivo Wear OS non compatibile con iOS", en: "Wear OS device not compatible with iOS" },
    },
  };
}

function buildFitbitAndroidResult(isConditionalStages: boolean): SelectorResult {
  return {
    status: isConditionalStages ? "conditional" : "health_store",
    statusBadge: isConditionalStages
      ? { it: "Condizionale via Health Connect", en: "Conditional via Health Connect" }
      : { it: "Supportato via Health Connect", en: "Supported via Health Connect" },
    route: {
      device: { it: "Dispositivo Fitbit", en: "Fitbit Device" },
      sourceApp: { it: "App Fitbit / Google Health", en: "Fitbit / Google Health App" },
      healthStore: { it: "Health Connect", en: "Health Connect" },
      fitmeshApp: { it: "FitMesh Sync (lettura locale)", en: "FitMesh Sync (local read)" },
    },
    explanation: {
      it: "L'app Fitbit / Google Health su Android esporta passi, frequenza cardiaca e sonno verso Health Connect, da dove FitMesh li legge localmente.",
      en: "The Fitbit / Google Health app on Android exports steps, heart rate, and sleep to Health Connect, where FitMesh reads them locally.",
    },
    limitations: {
      it: isConditionalStages
        ? "L'esportazione delle fasi del sonno dettagliate (REM e sonno profondo) dipende dai permessi e dalla configurazione concessa nell'app."
        : "Richiede la sincronizzazione con Health Connect attiva nelle impostazioni dell'app. Nessuna interrogazione diretta delle Web API cloud Fitbit.",
      en: isConditionalStages
        ? "Export of detailed sleep stages (REM and deep sleep) depends on permissions and configuration granted in the app."
        : "Requires Health Connect sync enabled in app settings. No direct polling of Fitbit cloud Web APIs.",
    },
    evidence: {
      it: "Documentazione ufficiale Google Health Help Center (https://support.google.com/googlehealth/answer/14506680) e matrice di compatibilità FitMesh (lib/compatibility/matrix-data.ts).",
      en: "Official Google Health Help Center documentation (https://support.google.com/googlehealth/answer/14506680) and FitMesh compatibility matrix (lib/compatibility/matrix-data.ts).",
    },
    cta: {
      type: "guide",
      label: { it: "Risoluzione problemi sincronizzazione Fitbit su Android", en: "Fix Fitbit data not syncing on Android" },
      guideSlug: "fitbit-data-not-syncing-android",
    },
  };
}

function buildFitbitIosConditional(): SelectorResult {
  return {
    status: "conditional",
    statusBadge: { it: "Condizionale via Google Health / Apple Salute", en: "Conditional via Google Health / Apple Health" },
    route: {
      device: { it: "Dispositivo Fitbit", en: "Fitbit Device" },
      sourceApp: { it: "App Google Health (iOS)", en: "Google Health App (iOS)" },
      healthStore: { it: "Apple Salute (HealthKit)", en: "Apple Health (HealthKit)" },
      fitmeshApp: { it: "FitMesh Sync iOS (lettura locale)", en: "FitMesh Sync iOS (local read)" },
    },
    explanation: {
      it: "Su iPhone la condivisione verso Apple Salute documentata da Google Support copre passi, frequenza cardiaca, sonno e sessioni di esercizio tramite l'app Google Health per iOS.",
      en: "On iPhone, Apple Health sharing documented by Google Support covers steps, heart rate, sleep, and exercise sessions via the Google Health iOS app.",
    },
    limitations: {
      it: "Non si tratta di una connessione cloud diretta: dipende dalla sincronizzazione dell'app Google Health con Apple Salute e dai permessi concessi in HealthKit.",
      en: "This is not a direct cloud connection: it depends on the Google Health app syncing with Apple Health and permissions granted in HealthKit.",
    },
    evidence: {
      it: "Documentazione ufficiale Google Health Help Center per Apple Health (https://support.google.com/googlehealth/answer/17037331) e matrice di compatibilità FitMesh (lib/compatibility/matrix-data.ts).",
      en: "Official Google Health Help Center documentation for Apple Health (https://support.google.com/googlehealth/answer/17037331) and FitMesh compatibility matrix (lib/compatibility/matrix-data.ts).",
    },
    cta: {
      type: "guide",
      label: { it: "Guida esportazione dati Fitbit e Google", en: "Fitbit and Google data export guide" },
      guideSlug: "esportare-dati-fitbit-google",
    },
  };
}

function buildPixelAndroidHealthStore(): SelectorResult {
  return {
    status: "health_store",
    statusBadge: { it: "Supportato via Health Connect", en: "Supported via Health Connect" },
    route: {
      device: { it: "Google Pixel Watch", en: "Google Pixel Watch" },
      sourceApp: { it: "App Google Pixel Watch / Google Health", en: "Google Pixel Watch / Google Health App" },
      healthStore: { it: "Health Connect", en: "Health Connect" },
      fitmeshApp: { it: "FitMesh Sync (lettura locale)", en: "FitMesh Sync (local read)" },
    },
    explanation: {
      it: "Pixel Watch sincronizza passi, frequenza cardiaca e sonno con stadi verso Health Connect tramite Google Health, e FitMesh li legge localmente.",
      en: "Pixel Watch syncs steps, heart rate, and sleep with stages to Health Connect via Google Health, and FitMesh reads them locally.",
    },
    limitations: {
      it: "Richiede uno smartphone Android compatibile con sincronizzazione Health Connect abilitata.",
      en: "Requires a compatible Android smartphone with Health Connect synchronization enabled.",
    },
    evidence: {
      it: "Documentazione ufficiale Google Pixel Watch Support (https://support.google.com/googlepixelwatch/answer/12759285), Google Health Help Center per la scrittura verso Health Connect (https://support.google.com/googlehealth/answer/14506680) e matrice di compatibilità FitMesh (lib/compatibility/matrix-data.ts).",
      en: "Official Google Pixel Watch Support documentation (https://support.google.com/googlepixelwatch/answer/12759285), Google Health Help Center for the write to Health Connect (https://support.google.com/googlehealth/answer/14506680) and FitMesh compatibility matrix (lib/compatibility/matrix-data.ts).",
    },
    cta: {
      type: "guide",
      label: { it: "Guida dati Pixel Watch su dashboard", en: "Pixel Watch data dashboard guide" },
      guideSlug: "dati-pixel-watch-dashboard",
    },
  };
}

function buildPixelIosUnsupported(): SelectorResult {
  return {
    status: "unsupported",
    statusBadge: { it: "Non supportato su iOS", en: "Unsupported on iOS" },
    route: {
      device: { it: "Google Pixel Watch", en: "Google Pixel Watch" },
      sourceApp: { it: "App Google Pixel Watch (solo Android)", en: "Google Pixel Watch App (Android only)" },
      healthStore: null,
      fitmeshApp: { it: "Percorso non disponibile", en: "Route not available" },
    },
    explanation: {
      it: "Google Pixel Watch richiede uno smartphone Android per la configurazione e non è compatibile con iPhone (iOS).",
      en: "Google Pixel Watch requires an Android smartphone for setup and is not compatible with iPhone (iOS).",
    },
    limitations: {
      it: "Incompatibilità di piattaforma documentata da Google.",
      en: "Platform incompatibility documented by Google.",
    },
    evidence: {
      it: "Requisiti ufficiali di sistema Google Pixel Watch (https://support.google.com/googlepixelwatch/answer/12759285).",
      en: "Official Google Pixel Watch system requirements (https://support.google.com/googlepixelwatch/answer/12759285).",
    },
    cta: {
      type: "none",
      label: { it: "Google Pixel Watch non compatibile con iPhone", en: "Google Pixel Watch not compatible with iPhone" },
    },
  };
}

function buildAppleWatchAndroidUnsupported(): SelectorResult {
  return {
    status: "unsupported",
    statusBadge: { it: "Non supportato su Android", en: "Unsupported on Android" },
    route: {
      device: { it: "Apple Watch", en: "Apple Watch" },
      sourceApp: { it: "App Watch (esclusiva iOS)", en: "Watch App (iOS exclusive)" },
      healthStore: null,
      fitmeshApp: { it: "Percorso non disponibile", en: "Route not available" },
    },
    explanation: {
      it: "Apple Watch richiede un iPhone per l'abbinamento e la sincronizzazione con HealthKit; non può essere abbinato a smartphone Android.",
      en: "Apple Watch requires an iPhone for pairing and HealthKit synchronization; it cannot pair with Android smartphones.",
    },
    limitations: {
      it: "Vincolo hardware e di sistema operativo dell'ecosistema Apple.",
      en: "Hardware and operating system constraint of the Apple ecosystem.",
    },
    evidence: {
      it: "Requisiti di sistema ufficiali Apple Support (https://support.apple.com/en-us/118490).",
      en: "Official Apple Support system requirements (https://support.apple.com/en-us/118490).",
    },
    cta: {
      type: "none",
      label: { it: "Apple Watch non abbinabile ad Android", en: "Apple Watch cannot pair with Android" },
    },
  };
}

function buildAppleWatchIosHealthStore(): SelectorResult {
  return {
    status: "health_store",
    statusBadge: { it: "Supportato via Apple Salute", en: "Supported via Apple Health" },
    route: {
      device: { it: "Apple Watch", en: "Apple Watch" },
      sourceApp: { it: "watchOS (sincronizzazione nativa)", en: "watchOS (native sync)" },
      healthStore: { it: "Apple Salute (HealthKit)", en: "Apple Health (HealthKit)" },
      fitmeshApp: { it: "FitMesh Sync iOS (lettura locale autorizzata)", en: "FitMesh Sync iOS (authorized local read)" },
    },
    explanation: {
      it: "Apple Watch registra nativamente passi, frequenza cardiaca e sonno in Apple Salute (HealthKit). FitMesh Sync su iPhone legge localmente le categorie autorizzate dall'utente.",
      en: "Apple Watch natively records steps, heart rate, and sleep in Apple Health (HealthKit). FitMesh Sync on iPhone locally reads the categories authorized by the user.",
    },
    limitations: {
      it: "Richiede la concessione esplicita dei permessi di lettura per ciascuna metrica nella schermata di sistema Apple Salute.",
      en: "Requires explicit read permission for each metric in the Apple Health system authorization prompt.",
    },
    evidence: {
      it: "Documentazione ufficiale Apple Developer HealthKit (https://developer.apple.com/documentation/healthkit) e scheda provider Apple Health FitMesh (lib/providers/data.ts).",
      en: "Official Apple Developer HealthKit documentation (https://developer.apple.com/documentation/healthkit) and FitMesh Apple Health provider specification (lib/providers/data.ts).",
    },
    cta: {
      type: "store",
      label: { it: "Scarica FitMesh Sync per iPhone", en: "Download FitMesh Sync for iPhone" },
      href: STORE_HREF,
    },
  };
}

function buildAppleWatchReadinessUnsupported(): SelectorResult {
  return {
    status: "unsupported",
    statusBadge: { it: "Non esposto nelle API HealthKit", en: "Not exposed in HealthKit APIs" },
    route: {
      device: { it: "Apple Watch", en: "Apple Watch" },
      sourceApp: { it: "App Parametri Vitali / Salute Apple", en: "Apple Vitals / Health App" },
      healthStore: { it: "HealthKit (nessun tipo Readiness pubblico)", en: "HealthKit (no public Readiness type)" },
      fitmeshApp: { it: "Percorso non disponibile", en: "Route not available" },
    },
    explanation: {
      it: "Il framework pubblico Apple HealthKit espone le singole metriche fisiologiche, ma non documenta un tipo di dato pubblico per l'esportazione di un punteggio Readiness sintetico.",
      en: "The public Apple HealthKit framework exposes individual physiological metrics, but does not document a public data type for exporting a composite Readiness score.",
    },
    limitations: {
      it: "FitMesh legge le metriche primarie documentate in HealthKit, non gli indicatori sintetici proprietari.",
      en: "FitMesh reads documented primary HealthKit metrics rather than closed composite scores.",
    },
    evidence: {
      it: "Documentazione ufficiale Apple Developer HealthKit (https://developer.apple.com/documentation/healthkit).",
      en: "Official Apple Developer HealthKit documentation (https://developer.apple.com/documentation/healthkit).",
    },
    cta: {
      type: "none",
      label: { it: "Punteggio non esposto da HealthKit", en: "Score not exposed by HealthKit" },
    },
  };
}

function buildOuraConditional(os: SelectorPhoneOs): SelectorResult {
  const isAndroid = os === "android";
  const storeIt = isAndroid ? "Health Connect" : "Apple Salute (HealthKit)";
  const storeEn = isAndroid ? "Health Connect" : "Apple Health (HealthKit)";
  const docUrl = isAndroid
    ? "https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration"
    : "https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration";

  return {
    status: "conditional",
    statusBadge: { it: `Condizionale via ${storeIt}`, en: `Conditional via ${storeEn}` },
    route: {
      device: { it: "Oura Ring (Gen 3, Gen 4)", en: "Oura Ring (Gen 3, Gen 4)" },
      sourceApp: { it: "Oura App", en: "Oura App" },
      healthStore: { it: storeIt, en: storeEn },
      fitmeshApp: { it: "FitMesh Sync (lettura locale)", en: "FitMesh Sync (local read)" },
    },
    explanation: {
      it: `L'app Oura sincronizza l'anello via Bluetooth ed esporta questa metrica verso ${storeIt}, da dove FitMesh la legge localmente senza interrogare le API cloud Oura.`,
      en: `The Oura app syncs the ring via Bluetooth and exports this metric to ${storeEn}, where FitMesh reads it locally without querying Oura cloud APIs.`,
    },
    limitations: {
      it: `Richiede l'apertura dell'app Oura per scaricare i dati dall'anello, l'abbonamento Oura attivo ove previsto da Gen 3+ e l'esportazione verso ${storeIt} abilitata nelle impostazioni Oura.`,
      en: `Requires opening the Oura app to download ring data, an active Oura membership where required on Gen 3+, and export to ${storeEn} enabled in Oura settings.`,
    },
    evidence: {
      it: `Documentazione ufficiale Oura Help Center (${docUrl}) e matrice di compatibilità FitMesh (lib/compatibility/matrix-data.ts).`,
      en: `Official Oura Help Center documentation (${docUrl}) and FitMesh compatibility matrix (lib/compatibility/matrix-data.ts).`,
    },
    cta: {
      type: "guide",
      label: { it: "Guida Oura Ring e Health Connect", en: "Oura Ring and Health Connect guide" },
      guideSlug: "oura-ring-health-connect-android",
    },
  };
}

function buildOuraReadinessUnsupported(os: SelectorPhoneOs): SelectorResult {
  const isAndroid = os === "android";
  const storeIt = isAndroid ? "Health Connect" : "Apple Salute";
  const storeEn = isAndroid ? "Health Connect" : "Apple Health";
  const docUrl = isAndroid
    ? "https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration"
    : "https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration";

  return {
    status: "unsupported",
    statusBadge: {
      it: `Non disponibile nel percorso ${storeIt}`,
      en: `Not available via ${storeEn} route`,
    },
    route: {
      device: { it: "Oura Ring (Gen 3, Gen 4)", en: "Oura Ring (Gen 3, Gen 4)" },
      sourceApp: { it: "Oura App", en: "Oura App" },
      healthStore: {
        it: `${storeIt} (Readiness non incluso nell'esportazione locale)`,
        en: `${storeEn} (Readiness not included in local export)`,
      },
      fitmeshApp: { it: "Percorso non disponibile", en: "Route not available" },
    },
    explanation: {
      it: `La documentazione Oura per ${storeIt} non include il Readiness Score tra le metriche condivise con l'archivio salute del telefono. Sebbene le API Oura documentino riepiloghi di readiness, FitMesh acquisisce i dati Oura tramite ${storeIt} e non dispone di un'integrazione cloud diretta con Oura.`,
      en: `Oura's documentation for ${storeEn} does not include Readiness Score among the metrics shared with the phone's health store. Although Oura APIs document readiness summaries, FitMesh reads Oura data via ${storeEn} and does not provide a direct Oura cloud integration.`,
    },
    limitations: {
      it: `Il limite riguarda il percorso tramite ${storeIt} esaminato e le integrazioni effettivamente disponibili in FitMesh.`,
      en: `This limitation applies to the examined ${storeEn} route and the integrations actually available in FitMesh.`,
    },
    evidence: {
      it: `Documentazione Oura Help Center (${docUrl}) e documentazione API Oura (https://cloud.ouraring.com/docs/authentication).`,
      en: `Oura Help Center documentation (${docUrl}) and Oura API documentation (https://cloud.ouraring.com/docs/authentication).`,
    },
    cta: {
      type: "guide",
      label: { it: "Analisi Oura Ring e condivisione dati", en: "Oura Ring data sharing analysis" },
      guideSlug: "oura-ring-health-connect-android",
    },
  };
}

function buildPolarIndirectUnverified(os: SelectorPhoneOs): SelectorResult {
  const storeIt = os === "android" ? "Health Connect" : "Apple Salute (HealthKit)";
  const storeEn = os === "android" ? "Health Connect" : "Apple Health (HealthKit)";
  return {
    status: "unverified",
    statusBadge: {
      it: "Percorso indiretto non verificato",
      en: "Indirect route unverified",
    },
    route: {
      device: { it: "Sportwatch Polar", en: "Polar Sportwatch" },
      sourceApp: { it: "Polar Flow", en: "Polar Flow" },
      healthStore: { it: storeIt, en: storeEn },
      fitmeshApp: {
        it: "Verifica end-to-end non disponibile",
        en: "End-to-end verification unavailable",
      },
    },
    explanation: {
      it: `Polar non ha un'integrazione diretta in FitMesh. L'assenza di un'integrazione diretta non esclude che Polar Flow possa scrivere alcune metriche standard su ${storeIt}, ma questo percorso indiretto non è verificato end-to-end nella presente matrice.`,
      en: `Polar does not have a direct integration in FitMesh. The absence of a direct integration does not rule out Polar Flow writing standard metrics to ${storeEn}, but this indirect route is not verified end-to-end in this matrix.`,
    },
    limitations: {
      it: "Nessun collegamento diretto con Polar Flow e nessuna verifica end-to-end disponibile per il transito indiretto tramite l'archivio salute del telefono.",
      en: "No direct connection with Polar Flow and no end-to-end verification available for indirect transit through the phone's health store.",
    },
    evidence: {
      it: "Registro provider FitMesh (lib/providers/data.ts) e criterio di verifica della matrice (lib/compatibility/matrix-data.ts).",
      en: "FitMesh provider registry (lib/providers/data.ts) and matrix verification standard (lib/compatibility/matrix-data.ts).",
    },
    cta: {
      type: "none",
      label: { it: "Percorso indiretto non ancora verificato", en: "Indirect route not yet verified" },
    },
  };
}

function buildGoogleFitIndirectUnverified(os: SelectorPhoneOs): SelectorResult {
  const storeIt = os === "android" ? "Health Connect" : "Apple Salute (HealthKit)";
  const storeEn = os === "android" ? "Health Connect" : "Apple Health (HealthKit)";
  return {
    status: "unverified",
    statusBadge: {
      it: "Percorso indiretto non verificato",
      en: "Indirect route unverified",
    },
    route: {
      device: { it: "Piattaforma Google Fit", en: "Google Fit Platform" },
      sourceApp: { it: "Google Fit", en: "Google Fit" },
      healthStore: { it: storeIt, en: storeEn },
      fitmeshApp: {
        it: "Verifica end-to-end non disponibile",
        en: "End-to-end verification unavailable",
      },
    },
    explanation: {
      it: `Google Fit non è un'integrazione diretta di FitMesh e le relative API sono in dismissione da parte di Google. L'eventuale passaggio indiretto di metriche standard attraverso ${storeIt} non è verificato end-to-end in questa matrice.`,
      en: `Google Fit is not a direct FitMesh integration and its APIs are being deprecated by Google. Any indirect transit of standard metrics through ${storeEn} is not verified end-to-end in this matrix.`,
    },
    limitations: {
      it: `Non esiste un connettore diretto Google Fit in FitMesh; l'eventuale transito tramite ${storeIt} dipende dalla singola app sorgente e non è certificato qui.`,
      en: `There is no direct Google Fit connector in FitMesh; any transit through ${storeEn} depends on the individual source app and is not certified here.`,
    },
    evidence: {
      it: "Guida di migrazione Google Developers (https://developer.android.com/health-and-fitness/guides/health-connect/migrate/comparison-guide) e registro provider FitMesh (lib/providers/data.ts).",
      en: "Google Developers migration guide (https://developer.android.com/health-and-fitness/guides/health-connect/migrate/comparison-guide) and FitMesh provider registry (lib/providers/data.ts).",
    },
    cta: {
      type: "none",
      label: { it: "Percorso indiretto non ancora verificato", en: "Indirect route not yet verified" },
    },
  };
}

function buildUnverifiedResult(os: SelectorPhoneOs, device: SelectorDevice): SelectorResult {
  const deviceEntry = SELECTOR_DEVICES.find((d) => d.id === device);
  const deviceLabel = deviceEntry
    ? deviceEntry.label
    : { it: "Dispositivo selezionato", en: "Selected device" };
  const storeIt = os === "android" ? "Health Connect" : "Apple Salute (HealthKit)";
  const storeEn = os === "android" ? "Health Connect" : "Apple Health (HealthKit)";

  return {
    status: "unverified",
    statusBadge: { it: "Combinazione non verificata", en: "Unverified combination" },
    route: {
      device: deviceLabel,
      sourceApp: { it: "App del produttore", en: "Vendor application" },
      healthStore: { it: storeIt, en: storeEn },
      fitmeshApp: { it: "Verifica end-to-end non disponibile", en: "End-to-end verification unavailable" },
    },
    explanation: {
      it: "Questa combinazione di sistema operativo, dispositivo e metrica non dispone ancora di una verifica end-to-end documentata tra l'esportazione del produttore e la versione distribuita di FitMesh.",
      en: "This combination of operating system, device, and metric does not yet have documented end-to-end verification between vendor export and the distributed FitMesh release.",
    },
    limitations: {
      it: "La sola presenza di un reader nell'app o una nota generica del produttore non bastano a dichiarare il percorso verificato senza evidenza completa.",
      en: "The mere presence of an app reader or generic vendor note is not sufficient to declare a route verified without complete end-to-end evidence.",
    },
    evidence: {
      it: "Criterio di verifica FitMesh: le combinazioni prive di prova documentale e riscontro nella release pubblicata restano classificate come non verificate.",
      en: "FitMesh verification standard: combinations lacking documentary proof and published release verification remain classified as unverified.",
    },
    cta: {
      type: "none",
      label: { it: "Percorso non ancora verificato", en: "Route not yet verified" },
    },
  };
}

const GARMIN_SCORE_OWNER = { it: "Garmin (Body Battery)", en: "Garmin (Body Battery)" };
const SAMSUNG_SCORE_OWNER = { it: "Samsung Galaxy AI (Energy Score)", en: "Samsung Galaxy AI (Energy Score)" };
const OURA_APPLE_SCORE_OWNER = { it: "Oura / Apple (Readiness)", en: "Oura / Apple (Readiness)" };

function buildPolarMatrixForOs(os: SelectorPhoneOs): Record<SelectorMetric, SelectorResult> {
  const indirectUnverified = buildPolarIndirectUnverified(os);
  return {
    steps: indirectUnverified,
    heart_rate: indirectUnverified,
    sleep: indirectUnverified,
    sleep_stages: indirectUnverified,
    hrv: indirectUnverified,
    spo2: indirectUnverified,
    temperature: indirectUnverified,
    vo2_max: indirectUnverified,
    workouts: indirectUnverified,
    body_battery: buildCrossVendorScoreUnsupported(
      { it: "Sportwatch Polar", en: "Polar Sportwatch" },
      { it: "Polar Flow", en: "Polar Flow" },
      GARMIN_SCORE_OWNER,
      {
        it: "Documentazione Garmin Support (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
        en: "Garmin Support documentation (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
      }
    ),
    energy_score: buildCrossVendorScoreUnsupported(
      { it: "Sportwatch Polar", en: "Polar Sportwatch" },
      { it: "Polar Flow", en: "Polar Flow" },
      SAMSUNG_SCORE_OWNER,
      {
        it: "Documentazione Samsung Health Data SDK (https://developer.samsung.com/health/data/guide/features/data-types.html).",
        en: "Samsung Health Data SDK documentation (https://developer.samsung.com/health/data/guide/features/data-types.html).",
      }
    ),
    readiness: buildCrossVendorScoreUnsupported(
      { it: "Sportwatch Polar", en: "Polar Sportwatch" },
      { it: "Polar Flow", en: "Polar Flow" },
      OURA_APPLE_SCORE_OWNER,
      {
        it: "Documentazione Oura Help Center (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
        en: "Oura Help Center documentation (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
      }
    ),
  };
}

function buildGoogleFitMatrixForOs(os: SelectorPhoneOs): Record<SelectorMetric, SelectorResult> {
  const indirectUnverified = buildGoogleFitIndirectUnverified(os);
  return {
    steps: indirectUnverified,
    heart_rate: indirectUnverified,
    sleep: indirectUnverified,
    sleep_stages: indirectUnverified,
    hrv: indirectUnverified,
    spo2: indirectUnverified,
    temperature: indirectUnverified,
    vo2_max: indirectUnverified,
    workouts: indirectUnverified,
    body_battery: buildCrossVendorScoreUnsupported(
      { it: "Piattaforma Google Fit", en: "Google Fit Platform" },
      { it: "Google Fit", en: "Google Fit" },
      GARMIN_SCORE_OWNER,
      {
        it: "Guida di migrazione Google Developers (https://developer.android.com/health-and-fitness/guides/health-connect/migrate/comparison-guide).",
        en: "Google Developers migration guide (https://developer.android.com/health-and-fitness/guides/health-connect/migrate/comparison-guide).",
      }
    ),
    energy_score: buildCrossVendorScoreUnsupported(
      { it: "Piattaforma Google Fit", en: "Google Fit Platform" },
      { it: "Google Fit", en: "Google Fit" },
      SAMSUNG_SCORE_OWNER,
      {
        it: "Guida di migrazione Google Developers (https://developer.android.com/health-and-fitness/guides/health-connect/migrate/comparison-guide).",
        en: "Google Developers migration guide (https://developer.android.com/health-and-fitness/guides/health-connect/migrate/comparison-guide).",
      }
    ),
    readiness: buildCrossVendorScoreUnsupported(
      { it: "Piattaforma Google Fit", en: "Google Fit Platform" },
      { it: "Google Fit", en: "Google Fit" },
      OURA_APPLE_SCORE_OWNER,
      {
        it: "Guida di migrazione Google Developers (https://developer.android.com/health-and-fitness/guides/health-connect/migrate/comparison-guide).",
        en: "Google Developers migration guide (https://developer.android.com/health-and-fitness/guides/health-connect/migrate/comparison-guide).",
      }
    ),
  };
}

function buildSamsungIosMatrix(): Record<SelectorMetric, SelectorResult> {
  const entry = buildSamsungIosUnsupported();
  return {
    steps: entry,
    heart_rate: entry,
    sleep: entry,
    sleep_stages: entry,
    hrv: entry,
    spo2: entry,
    temperature: entry,
    body_battery: entry,
    energy_score: entry,
    readiness: entry,
    vo2_max: entry,
    workouts: entry,
  };
}

function buildPixelIosMatrix(): Record<SelectorMetric, SelectorResult> {
  const entry = buildPixelIosUnsupported();
  return {
    steps: entry,
    heart_rate: entry,
    sleep: entry,
    sleep_stages: entry,
    hrv: entry,
    spo2: entry,
    temperature: entry,
    body_battery: entry,
    energy_score: entry,
    readiness: entry,
    vo2_max: entry,
    workouts: entry,
  };
}

function buildAppleWatchAndroidMatrix(): Record<SelectorMetric, SelectorResult> {
  const entry = buildAppleWatchAndroidUnsupported();
  return {
    steps: entry,
    heart_rate: entry,
    sleep: entry,
    sleep_stages: entry,
    hrv: entry,
    spo2: entry,
    temperature: entry,
    body_battery: entry,
    energy_score: entry,
    readiness: entry,
    vo2_max: entry,
    workouts: entry,
  };
}

/**
 * Explicit compatibility matrix keyed by (os, device, metric).
 * Any combination not explicitly mapped here (or mapped to undefined) resolves to "unverified".
 * No positive fallback is permitted.
 */
export const EXPLICIT_COMPATIBILITY_MATRIX: Record<
  SelectorPhoneOs,
  Record<SelectorDevice, Partial<Record<SelectorMetric, SelectorResult>>>
> = {
  android: {
    colmi: {
      steps: buildColmiDirectVerified("android"),
      heart_rate: buildColmiDirectVerified("android"),
      sleep: buildColmiDirectVerified("android"),
      sleep_stages: buildColmiDirectVerified("android"),
      spo2: buildColmiSpo2Conditional(),
      temperature: buildColmiTemperatureConditional(),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Colmi Smart Ring", en: "Colmi Smart Ring" },
        { it: "Connessione BLE", en: "BLE Connection" },
        GARMIN_SCORE_OWNER,
        {
          it: "Specifiche hardware Colmi BLE in lib/compatibility/matrix-data.ts e documentazione Garmin Body Battery (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
          en: "Colmi BLE hardware specifications in lib/compatibility/matrix-data.ts and Garmin Body Battery documentation (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Colmi Smart Ring", en: "Colmi Smart Ring" },
        { it: "Connessione BLE", en: "BLE Connection" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Specifiche hardware Colmi BLE in lib/compatibility/matrix-data.ts e documentazione Samsung Health Data SDK (https://developer.samsung.com/health/data/guide/features/data-types.html).",
          en: "Colmi BLE hardware specifications in lib/compatibility/matrix-data.ts and Samsung Health Data SDK documentation (https://developer.samsung.com/health/data/guide/features/data-types.html).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Colmi Smart Ring", en: "Colmi Smart Ring" },
        { it: "Connessione BLE", en: "BLE Connection" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Specifiche hardware Colmi BLE documentate in lib/compatibility/matrix-data.ts (colmi-android).",
          en: "Colmi BLE hardware specifications documented in lib/compatibility/matrix-data.ts (colmi-android).",
        }
      ),
    },
    garmin: {
      steps: buildGarminSupportedOrConditional("android", "steps"),
      heart_rate: buildGarminSupportedOrConditional("android", "heart_rate"),
      sleep: buildGarminSupportedOrConditional("android", "sleep"),
      sleep_stages: buildGarminSupportedOrConditional("android", "sleep_stages"),
      workouts: buildWorkoutsConditionalResult(
        "android",
        { it: "Smartwatch Garmin", en: "Garmin Smartwatch" },
        { it: "Garmin Connect", en: "Garmin Connect" },
        {
          it: "Documentazione Garmin Support (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) e verifica sessioni in FitMesh.",
          en: "Garmin Support documentation (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) and FitMesh session verification.",
        },
        "garmin-samsung-health-sync-guide",
        { it: "Guida sincronizzazione Garmin", en: "Garmin synchronization guide" },
        false
      ),
      body_battery: buildGarminBodyBatteryUnsupported("android"),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Smartwatch Garmin", en: "Garmin Smartwatch" },
        { it: "Garmin Connect", en: "Garmin Connect" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Documentazione Garmin Support (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) e Samsung Health Data SDK.",
          en: "Garmin Support documentation (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) and Samsung Health Data SDK.",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Smartwatch Garmin", en: "Garmin Smartwatch" },
        { it: "Garmin Connect", en: "Garmin Connect" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Garmin Support (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
          en: "Garmin Support documentation (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
        }
      ),
    },
    samsung: {
      steps: buildSamsungAndroidHealthStore(),
      heart_rate: buildSamsungAndroidHealthStore(),
      sleep: buildSamsungAndroidHealthStore(),
      sleep_stages: buildSamsungAndroidHealthStore(),
      workouts: buildWorkoutsConditionalResult(
        "android",
        { it: "Samsung Galaxy Watch (Wear OS)", en: "Samsung Galaxy Watch (Wear OS)" },
        { it: "Samsung Health", en: "Samsung Health" },
        {
          it: "Documentazione Samsung Developer (https://developer.samsung.com/health/health-connect-faq.html) e verifica sessioni in FitMesh.",
          en: "Samsung Developer documentation (https://developer.samsung.com/health/health-connect-faq.html) and FitMesh session verification.",
        },
        "health-connect-not-syncing",
        { it: "Guida risoluzione Health Connect", en: "Health Connect troubleshooting guide" }
      ),
      energy_score: buildSamsungEnergyScoreUnsupported(),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Samsung Galaxy Watch", en: "Samsung Galaxy Watch" },
        { it: "Samsung Health", en: "Samsung Health" },
        GARMIN_SCORE_OWNER,
        {
          it: "Documentazione Samsung Developer (https://developer.samsung.com/health/health-connect-faq.html) e Garmin Support.",
          en: "Samsung Developer documentation (https://developer.samsung.com/health/health-connect-faq.html) and Garmin Support.",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Samsung Galaxy Watch", en: "Samsung Galaxy Watch" },
        { it: "Samsung Health", en: "Samsung Health" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Samsung Developer (https://developer.samsung.com/health/health-connect-faq.html).",
          en: "Samsung Developer documentation (https://developer.samsung.com/health/health-connect-faq.html).",
        }
      ),
    },
    fitbit: {
      steps: buildFitbitAndroidResult(false),
      heart_rate: buildFitbitAndroidResult(false),
      sleep: buildFitbitAndroidResult(false),
      sleep_stages: buildFitbitAndroidResult(true),
      workouts: buildWorkoutsConditionalResult(
        "android",
        { it: "Dispositivo Fitbit", en: "Fitbit Device" },
        { it: "App Fitbit / Google Health", en: "Fitbit / Google Health App" },
        {
          it: "Documentazione Google Health Help Center (https://support.google.com/googlehealth/answer/14506680) e verifica sessioni in FitMesh.",
          en: "Google Health Help Center documentation (https://support.google.com/googlehealth/answer/14506680) and FitMesh session verification.",
        },
        "fitbit-data-not-syncing-android",
        { it: "Guida sincronizzazione Fitbit su Android", en: "Fitbit Android synchronization guide" }
      ),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Fitbit", en: "Fitbit Device" },
        { it: "App Fitbit", en: "Fitbit App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Documentazione Google Health Help Center (https://support.google.com/googlehealth/answer/14506680).",
          en: "Google Health Help Center documentation (https://support.google.com/googlehealth/answer/14506680).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Fitbit", en: "Fitbit Device" },
        { it: "App Fitbit", en: "Fitbit App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Documentazione Google Health Help Center (https://support.google.com/googlehealth/answer/14506680).",
          en: "Google Health Help Center documentation (https://support.google.com/googlehealth/answer/14506680).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Fitbit", en: "Fitbit Device" },
        { it: "App Fitbit", en: "Fitbit App" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Google Health Help Center (https://support.google.com/googlehealth/answer/14506680): il Daily Readiness Score proprietario Fitbit non è esportato su Health Connect.",
          en: "Google Health Help Center documentation (https://support.google.com/googlehealth/answer/14506680): Fitbit proprietary Daily Readiness Score is not exported to Health Connect.",
        }
      ),
    },
    pixel: {
      steps: buildPixelAndroidHealthStore(),
      heart_rate: buildPixelAndroidHealthStore(),
      sleep: buildPixelAndroidHealthStore(),
      sleep_stages: buildPixelAndroidHealthStore(),
      workouts: buildWorkoutsConditionalResult(
        "android",
        { it: "Google Pixel Watch", en: "Google Pixel Watch" },
        { it: "App Google Pixel Watch / Google Health", en: "Google Pixel Watch / Google Health App" },
        {
          it: "Documentazione Google Pixel Watch Support (https://support.google.com/googlepixelwatch/answer/12759285) e verifica sessioni in FitMesh.",
          en: "Google Pixel Watch Support documentation (https://support.google.com/googlepixelwatch/answer/12759285) and FitMesh session verification.",
        },
        "dati-pixel-watch-dashboard",
        { it: "Guida dati Pixel Watch", en: "Pixel Watch data guide" }
      ),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Google Pixel Watch", en: "Google Pixel Watch" },
        { it: "App Google Pixel Watch / Google Health", en: "Google Pixel Watch / Google Health App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Documentazione Google Pixel Watch Support (https://support.google.com/googlepixelwatch/answer/12759285).",
          en: "Google Pixel Watch Support documentation (https://support.google.com/googlepixelwatch/answer/12759285).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Google Pixel Watch", en: "Google Pixel Watch" },
        { it: "App Google Pixel Watch / Google Health", en: "Google Pixel Watch / Google Health App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Documentazione Google Pixel Watch Support (https://support.google.com/googlepixelwatch/answer/12759285).",
          en: "Google Pixel Watch Support documentation (https://support.google.com/googlepixelwatch/answer/12759285).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Google Pixel Watch", en: "Google Pixel Watch" },
        { it: "App Google Pixel Watch / Google Health", en: "Google Pixel Watch / Google Health App" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Google Pixel Watch Support (https://support.google.com/googlepixelwatch/answer/12759285) e Google Fitbit Support (https://support.google.com/googlehealth/answer/14506680).",
          en: "Google Pixel Watch Support documentation (https://support.google.com/googlepixelwatch/answer/12759285) and Google Fitbit Support (https://support.google.com/googlehealth/answer/14506680).",
        }
      ),
    },
    "apple-watch": buildAppleWatchAndroidMatrix(),
    oura: {
      steps: buildOuraConditional("android"),
      heart_rate: buildOuraConditional("android"),
      sleep: buildOuraConditional("android"),
      sleep_stages: buildOuraConditional("android"),
      hrv: buildOuraConditional("android"),
      workouts: buildWorkoutsConditionalResult(
        "android",
        { it: "Oura Ring (Gen 3, Gen 4)", en: "Oura Ring (Gen 3, Gen 4)" },
        { it: "Oura App", en: "Oura App" },
        {
          it: "Documentazione Oura Help Center (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration) e verifica sessioni in FitMesh.",
          en: "Oura Help Center documentation (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration) and FitMesh session verification.",
        },
        "oura-ring-health-connect-android",
        { it: "Guida Oura Ring su Android", en: "Oura Ring on Android guide" }
      ),
      readiness: buildOuraReadinessUnsupported("android"),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Oura Ring", en: "Oura Ring" },
        { it: "Oura App", en: "Oura App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Documentazione Oura Help Center (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
          en: "Oura Help Center documentation (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Oura Ring", en: "Oura Ring" },
        { it: "Oura App", en: "Oura App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Documentazione Oura Help Center (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
          en: "Oura Help Center documentation (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
        }
      ),
    },
    polar: buildPolarMatrixForOs("android"),
    "google-fit": buildGoogleFitMatrixForOs("android"),
    whoop: {
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Whoop 4.0", en: "Whoop 4.0" },
        { it: "Whoop App", en: "Whoop App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Specifiche ecosistema Garmin (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
          en: "Garmin ecosystem specifications (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Whoop 4.0", en: "Whoop 4.0" },
        { it: "Whoop App", en: "Whoop App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Specifiche Samsung Health Data SDK (https://developer.samsung.com/health/data/guide/features/data-types.html).",
          en: "Samsung Health Data SDK specifications (https://developer.samsung.com/health/data/guide/features/data-types.html).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Whoop 4.0", en: "Whoop 4.0" },
        { it: "Whoop App", en: "Whoop App" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Oura Help Center (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
          en: "Oura Help Center documentation (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
        }
      ),
    },
    withings: {
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Withings", en: "Withings Device" },
        { it: "Withings App", en: "Withings App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Specifiche ecosistema Garmin (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
          en: "Garmin ecosystem specifications (https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Withings", en: "Withings Device" },
        { it: "Withings App", en: "Withings App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Specifiche Samsung Health Data SDK (https://developer.samsung.com/health/data/guide/features/data-types.html).",
          en: "Samsung Health Data SDK specifications (https://developer.samsung.com/health/data/guide/features/data-types.html).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Withings", en: "Withings Device" },
        { it: "Withings App", en: "Withings App" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Oura Help Center (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
          en: "Oura Help Center documentation (https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration).",
        }
      ),
    },
  },
  ios: {
    colmi: {
      steps: buildColmiDirectVerified("ios"),
      heart_rate: buildColmiDirectVerified("ios"),
      sleep: buildColmiDirectVerified("ios"),
      sleep_stages: buildColmiDirectVerified("ios"),
      spo2: buildColmiSpo2Conditional(),
      temperature: buildColmiTemperatureConditional(),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Colmi Smart Ring", en: "Colmi Smart Ring" },
        { it: "Connessione BLE", en: "BLE Connection" },
        GARMIN_SCORE_OWNER,
        {
          it: "Specifiche hardware Colmi BLE in lib/compatibility/matrix-data.ts e documentazione Garmin Body Battery (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA).",
          en: "Colmi BLE hardware specifications in lib/compatibility/matrix-data.ts and Garmin Body Battery documentation (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Colmi Smart Ring", en: "Colmi Smart Ring" },
        { it: "Connessione BLE", en: "BLE Connection" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Specifiche hardware Colmi BLE in lib/compatibility/matrix-data.ts e documentazione Samsung Health Data SDK (https://developer.samsung.com/health/data/guide/features/data-types.html).",
          en: "Colmi BLE hardware specifications in lib/compatibility/matrix-data.ts and Samsung Health Data SDK documentation (https://developer.samsung.com/health/data/guide/features/data-types.html).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Colmi Smart Ring", en: "Colmi Smart Ring" },
        { it: "Connessione BLE", en: "BLE Connection" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Specifiche hardware Colmi BLE documentate in lib/compatibility/matrix-data.ts (colmi-ios).",
          en: "Colmi BLE hardware specifications documented in lib/compatibility/matrix-data.ts (colmi-ios).",
        }
      ),
    },
    garmin: {
      steps: buildGarminSupportedOrConditional("ios", "steps"),
      heart_rate: buildGarminSupportedOrConditional("ios", "heart_rate"),
      sleep: buildGarminSupportedOrConditional("ios", "sleep"),
      workouts: buildWorkoutsConditionalResult(
        "ios",
        { it: "Smartwatch Garmin", en: "Garmin Smartwatch" },
        { it: "Garmin Connect", en: "Garmin Connect" },
        {
          it: "Documentazione Garmin Support (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA) e verifica sessioni in FitMesh.",
          en: "Garmin Support documentation (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA) and FitMesh session verification.",
        },
        "garmin-samsung-health-sync-guide",
        { it: "Guida sincronizzazione Garmin", en: "Garmin synchronization guide" }
      ),
      body_battery: buildGarminBodyBatteryUnsupported("ios"),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Smartwatch Garmin", en: "Garmin Smartwatch" },
        { it: "Garmin Connect", en: "Garmin Connect" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Documentazione Garmin Support (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA) e Samsung Health Data SDK.",
          en: "Garmin Support documentation (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA) and Samsung Health Data SDK.",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Smartwatch Garmin", en: "Garmin Smartwatch" },
        { it: "Garmin Connect", en: "Garmin Connect" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Garmin Support (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA).",
          en: "Garmin Support documentation (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA).",
        }
      ),
    },
    samsung: buildSamsungIosMatrix(),
    fitbit: {
      steps: buildFitbitIosConditional(),
      heart_rate: buildFitbitIosConditional(),
      sleep: buildFitbitIosConditional(),
      workouts: buildWorkoutsConditionalResult(
        "ios",
        { it: "Dispositivo Fitbit", en: "Fitbit Device" },
        { it: "App Google Health (iOS)", en: "Google Health App (iOS)" },
        {
          it: "Documentazione Google Health Help Center per Apple Health (https://support.google.com/googlehealth/answer/17037331) e verifica sessioni in FitMesh.",
          en: "Google Health Help Center documentation for Apple Health (https://support.google.com/googlehealth/answer/17037331) and FitMesh session verification.",
        },
        "esportare-dati-fitbit-google",
        { it: "Guida esportazione dati Fitbit e Google", en: "Fitbit and Google data export guide" }
      ),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Fitbit", en: "Fitbit Device" },
        { it: "App Fitbit", en: "Fitbit App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Documentazione Google Health Help Center (https://support.google.com/googlehealth/answer/17037331).",
          en: "Google Health Help Center documentation (https://support.google.com/googlehealth/answer/17037331).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Fitbit", en: "Fitbit Device" },
        { it: "App Fitbit", en: "Fitbit App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Documentazione Google Health Help Center (https://support.google.com/googlehealth/answer/17037331).",
          en: "Google Health Help Center documentation (https://support.google.com/googlehealth/answer/17037331).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Fitbit", en: "Fitbit Device" },
        { it: "App Fitbit", en: "Fitbit App" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Google Health Help Center (https://support.google.com/googlehealth/answer/17037331): i punteggi Readiness non figurano tra i dati condivisi con Apple Salute.",
          en: "Google Health Help Center documentation (https://support.google.com/googlehealth/answer/17037331): Readiness scores are not listed among data shared with Apple Health.",
        }
      ),
    },
    pixel: buildPixelIosMatrix(),
    "apple-watch": {
      steps: buildAppleWatchIosHealthStore(),
      heart_rate: buildAppleWatchIosHealthStore(),
      sleep: buildAppleWatchIosHealthStore(),
      sleep_stages: buildAppleWatchIosHealthStore(),
      workouts: buildWorkoutsConditionalResult(
        "ios",
        { it: "Apple Watch", en: "Apple Watch" },
        { it: "App Allenamento (watchOS)", en: "Workout App (watchOS)" },
        {
          it: "Documentazione Apple Developer HealthKit (https://developer.apple.com/documentation/healthkit) e verifica sessioni in FitMesh.",
          en: "Apple Developer HealthKit documentation (https://developer.apple.com/documentation/healthkit) and FitMesh session verification.",
        },
        "how-to-export-apple-health-data",
        { it: "Guida ai dati Apple Salute", en: "Apple Health data guide" }
      ),
      readiness: buildAppleWatchReadinessUnsupported(),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Apple Watch", en: "Apple Watch" },
        { it: "watchOS / Apple Salute", en: "watchOS / Apple Health" },
        GARMIN_SCORE_OWNER,
        {
          it: "Documentazione Apple Developer HealthKit (https://developer.apple.com/documentation/healthkit) e Garmin Support.",
          en: "Apple Developer HealthKit documentation (https://developer.apple.com/documentation/healthkit) and Garmin Support.",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Apple Watch", en: "Apple Watch" },
        { it: "watchOS / Apple Salute", en: "watchOS / Apple Health" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Documentazione Apple Developer HealthKit (https://developer.apple.com/documentation/healthkit) e Samsung Health Data SDK.",
          en: "Apple Developer HealthKit documentation (https://developer.apple.com/documentation/healthkit) and Samsung Health Data SDK.",
        }
      ),
    },
    oura: {
      steps: buildOuraConditional("ios"),
      heart_rate: buildOuraConditional("ios"),
      sleep: buildOuraConditional("ios"),
      sleep_stages: buildOuraConditional("ios"),
      workouts: buildWorkoutsConditionalResult(
        "ios",
        { it: "Oura Ring (Gen 3, Gen 4)", en: "Oura Ring (Gen 3, Gen 4)" },
        { it: "Oura App", en: "Oura App" },
        {
          it: "Documentazione Oura Help Center per Apple Health (https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration) e verifica sessioni in FitMesh.",
          en: "Oura Help Center documentation for Apple Health (https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration) and FitMesh session verification.",
        },
        "oura-ring-health-connect-android",
        { it: "Analisi integrazione Oura Ring", en: "Oura Ring integration analysis" }
      ),
      readiness: buildOuraReadinessUnsupported("ios"),
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Oura Ring", en: "Oura Ring" },
        { it: "Oura App", en: "Oura App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Documentazione Oura Help Center (https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration).",
          en: "Oura Help Center documentation (https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Oura Ring", en: "Oura Ring" },
        { it: "Oura App", en: "Oura App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Documentazione Oura Help Center (https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration).",
          en: "Oura Help Center documentation (https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration).",
        }
      ),
    },
    polar: buildPolarMatrixForOs("ios"),
    "google-fit": buildGoogleFitMatrixForOs("ios"),
    whoop: {
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Whoop 4.0", en: "Whoop 4.0" },
        { it: "Whoop App", en: "Whoop App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Specifiche ecosistema Garmin (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA).",
          en: "Garmin ecosystem specifications (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Whoop 4.0", en: "Whoop 4.0" },
        { it: "Whoop App", en: "Whoop App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Specifiche Samsung Health Data SDK (https://developer.samsung.com/health/data/guide/features/data-types.html).",
          en: "Samsung Health Data SDK specifications (https://developer.samsung.com/health/data/guide/features/data-types.html).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Whoop 4.0", en: "Whoop 4.0" },
        { it: "Whoop App", en: "Whoop App" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Apple Developer HealthKit (https://developer.apple.com/documentation/healthkit).",
          en: "Apple Developer HealthKit documentation (https://developer.apple.com/documentation/healthkit).",
        }
      ),
    },
    withings: {
      body_battery: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Withings", en: "Withings Device" },
        { it: "Withings App", en: "Withings App" },
        GARMIN_SCORE_OWNER,
        {
          it: "Specifiche ecosistema Garmin (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA).",
          en: "Garmin ecosystem specifications (https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA).",
        }
      ),
      energy_score: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Withings", en: "Withings Device" },
        { it: "Withings App", en: "Withings App" },
        SAMSUNG_SCORE_OWNER,
        {
          it: "Specifiche Samsung Health Data SDK (https://developer.samsung.com/health/data/guide/features/data-types.html).",
          en: "Samsung Health Data SDK specifications (https://developer.samsung.com/health/data/guide/features/data-types.html).",
        }
      ),
      readiness: buildCrossVendorScoreUnsupported(
        { it: "Dispositivo Withings", en: "Withings Device" },
        { it: "Withings App", en: "Withings App" },
        OURA_APPLE_SCORE_OWNER,
        {
          it: "Documentazione Apple Developer HealthKit (https://developer.apple.com/documentation/healthkit).",
          en: "Apple Developer HealthKit documentation (https://developer.apple.com/documentation/healthkit).",
        }
      ),
    },
  },
};

export function resolveCompatibilityPath(
  os: SelectorPhoneOs,
  device: SelectorDevice,
  metric: SelectorMetric
): SelectorResult {
  const explicitMatch = EXPLICIT_COMPATIBILITY_MATRIX[os]?.[device]?.[metric];
  if (explicitMatch) {
    return explicitMatch;
  }
  return buildUnverifiedResult(os, device);
}
