/**
 * Landing "fitness data sync" (sprint P0.2, Fase 3 + Fase 7).
 *
 * Fonte per /{locale}/fitness-data-sync (route dedicata, non /lp/[slug] —
 * pagina commerciale top-level per intento generico "sync fitness data").
 *
 * Fase 7 (2026-07-12): tradotto it/en/de/es (stesse 4 locale di
 * FITNESS_DATA_SYNC_COMPLETE_LOCALES) a mano, non via tools/local-translator
 * (Ollama). Motivo: questo contenuto descrive stato di prodotto
 * commercialmente/legalmente sensibile (live vs in-development vs roadmap,
 * read vs write) — lo stesso tipo di claim che l'intero sprint P0.2 esiste
 * per correggere. Una traduzione automatica non verificata frase per frase
 * rischierebbe di reintrodurre esattamente l'errore che il guardrail
 * (tools/check-llms-consistency.ts) e questa pagina servono a prevenire.
 * Le altre 11 locale del sito NON sono in scope (vedi FDS_LOCALES in
 * app/.../fitness-data-sync/page.tsx) — cadono su EN via tl().
 *
 * Verità commerciale alla base di questo contenuto (verificata nel codice
 * dell'app, non assunta): Strava legge in modo affidabile per gli account
 * già connessi, ma l'accesso a NUOVE connessioni è limitato (approvazione
 * Strava, P1.9 FASE 2 2026-09-01 — non era così finché non corretto qui);
 * l'invio verso Strava è in sviluppo (buildWriteAuthorizationUrl() non ha
 * ancora un trigger UI verificato su device reale); TrainingPeaks non è ancora funzionante
 * end-to-end; Health Connect e Apple Health hanno write-back reale,
 * opt-in, off di default, con timing diverso per piattaforma (Android:
 * export singolo per attivazione toggle; iOS: re-export a ogni sync). Data
 * di verifica: 2026-07-12. Checklist di promozione "in development" → "live":
 * docs/seo/capability-promotion-checklist.md.
 */

import type { Locale } from "@/lib/i18n";

export type Localized = {
  it: string;
  en: string;
  es: string;
  de: string;
};
export type LocalizedList = {
  it: string[];
  en: string[];
  es: string[];
  de: string[];
};

export function tl(l: Localized, lc: Locale): string {
  return (l as Record<string, string | undefined>)[lc] ?? l.en;
}
export function tll(l: LocalizedList, lc: Locale): string[] {
  return (l as Record<string, string[] | undefined>)[lc] ?? l.en;
}

export type IntegrationDirection = "read" | "write" | "read-write" | "export";
/**
 * Vocabolario deliberatamente più piccolo di `ProviderStatus` in
 * `lib/providers/data.ts` (che ha anche `"live-basic"`, per il caso
 * "bridge generico Health Connect funziona oggi, OAuth dedicato ancora no").
 * Qui quel caso (Fitbit, Polar, Garmin, Withings) è rappresentato con
 * `"beta"` per mancanza di un valore migliore — NON significa "in fase di
 * test", significa "solo il bridge generico funziona oggi". Non assumere
 * parità 1:1 con `"beta"` di `data.ts` (dove Suunto usa lo stesso valore per
 * indicare un'integrazione OAuth dedicata reale ma non ancora collaudata su
 * larga scala — un significato diverso sotto la stessa parola).
 */
export type IntegrationStatus =
  | "live"
  | "in-development"
  | "roadmap"
  | "beta"
  // P1.9 FASE 2 (2026-09-01): distinto da "beta" sopra apposta (qui "beta"
  // significa "solo bridge generico", il contrario della situazione di
  // Strava: OAuth dedicato reale, che funziona per chi è già connesso, ma
  // nuove connessioni sono soggette ad approvazione esterna). Oggi usato
  // solo per Strava.
  | "limited-beta";

export interface CompatibilityRow {
  /** Nome del brand/servizio — non tradotto (nome proprio). */
  source: string;
  platform: Localized;
  connectionMethod: Localized;
  direction: IntegrationDirection;
  dataTypes: Localized;
  authMethod: Localized;
  defaultState: Localized;
  syncFrequency: Localized;
  status: IntegrationStatus;
  limitations: Localized;
  lastVerified: string;
  detailHref?: string;
}

const ANDROID_ONLY: Localized = { it: "Solo Android", en: "Android only", es: "Solo Android", de: "Nur Android" };
const HC_PERMISSION: Localized = {
  it: "Permesso Health Connect",
  en: "Health Connect permission",
  es: "Permiso de Health Connect",
  de: "Health Connect-Berechtigung",
};
const OPT_IN: Localized = { it: "Opt-in", en: "Opt-in", es: "Opt-in", de: "Opt-in" };
const EVERY_SYNC: Localized = { it: "Ogni sync", en: "Every sync", es: "Cada sincronización", de: "Bei jeder Synchronisierung" };
const ANDROID_ONLY_LIMIT: Localized = { it: "Solo Android.", en: "Android only.", es: "Solo Android.", de: "Nur Android." };
const STEPS_HR_SLEEP_CAL_WORKOUTS: Localized = {
  it: "Passi, frequenza cardiaca, sonno, calorie, allenamenti",
  en: "Steps, heart rate, sleep, calories, workouts",
  es: "Pasos, frecuencia cardíaca, sueño, calorías, entrenamientos",
  de: "Schritte, Herzfrequenz, Schlaf, Kalorien, Workouts",
};
const STEPS_HR_SLEEP_CAL: Localized = {
  it: "Passi, frequenza cardiaca, sonno, calorie",
  en: "Steps, heart rate, sleep, calories",
  es: "Pasos, frecuencia cardíaca, sueño, calorías",
  de: "Schritte, Herzfrequenz, Schlaf, Kalorien",
};

/** Le 4 integrazioni con trattamento completo (tutti i campi richiesti). */
export const DETAILED_COMPATIBILITY: CompatibilityRow[] = [
  {
    source: "Strava",
    platform: { it: "Android + iOS", en: "Android + iOS", es: "Android + iOS", de: "Android + iOS" },
    connectionMethod: {
      it: "OAuth 2.0 (flusso PKCE mobile)",
      en: "OAuth 2.0 (PKCE mobile flow)",
      es: "OAuth 2.0 (flujo PKCE móvil)",
      de: "OAuth 2.0 (mobiler PKCE-Flow)",
    },
    direction: "read",
    dataTypes: {
      it: "Corse, uscite in bici, nuotate, camminate, tracciato GPS, ritmo, calorie, frequenza cardiaca",
      en: "Runs, rides, swims, walks, GPS track, pace, calories, heart rate",
      es: "Carreras, salidas en bici, natación, caminatas, trazado GPS, ritmo, calorías, frecuencia cardíaca",
      de: "Läufe, Radtouren, Schwimmen, Spaziergänge, GPS-Track, Tempo, Kalorien, Herzfrequenz",
    },
    authMethod: {
      it: "OAuth2 (scope: read, activity:read_all, profile:read_all)",
      en: "OAuth2 (scope: read, activity:read_all, profile:read_all)",
      es: "OAuth2 (scope: read, activity:read_all, profile:read_all)",
      de: "OAuth2 (Scope: read, activity:read_all, profile:read_all)",
    },
    defaultState: {
      it: "Opt-in — l'utente si connette manualmente in Impostazioni",
      en: "Opt-in — user connects manually in Settings",
      es: "Opt-in — el usuario se conecta manualmente en Ajustes",
      de: "Opt-in — Nutzer verbindet sich manuell in den Einstellungen",
    },
    syncFrequency: {
      it: "Recuperato a ogni sync dell'app",
      en: "Fetched on each app sync",
      es: "Se obtiene en cada sincronización de la app",
      de: "Wird bei jeder App-Synchronisierung abgerufen",
    },
    // P1.9 FASE 2 (2026-09-01): era "live" — corretto in base a
    // docs/seo/capability-promotion-checklist.md ("già live e verificato"
    // vale SOLO per la lettura di account già connessi; nuove connessioni
    // restano soggette ad approvazione Strava, nessun numero pubblicato).
    status: "limited-beta",
    limitations: {
      it: "Accesso limitato: la lettura funziona per gli account già collegati, ma le nuove connessioni sono soggette all'approvazione di Strava. L'invio degli allenamenti registrati da FitMesh verso Strava è in sviluppo e non ancora disponibile nell'app.",
      en: "Limited access: reading works for accounts already connected, but new connections are subject to Strava's approval. Sending FitMesh-recorded workouts back to Strava is in development and not yet available in the app.",
      es: "Acceso limitado: la lectura funciona para las cuentas ya conectadas, pero las nuevas conexiones están sujetas a la aprobación de Strava. El envío de entrenamientos registrados por FitMesh a Strava está en desarrollo y aún no disponible en la app.",
      de: "Eingeschränkter Zugang: Das Lesen funktioniert für bereits verbundene Konten, neue Verbindungen bedürfen jedoch der Freigabe durch Strava. Das Senden von FitMesh-aufgezeichneten Workouts an Strava ist in Entwicklung und in der App noch nicht verfügbar.",
    },
    lastVerified: "2026-09-01",
    detailHref: "/sync/strava",
  },
  {
    source: "TrainingPeaks",
    platform: { it: "Android + iOS", en: "Android + iOS", es: "Android + iOS", de: "Android + iOS" },
    connectionMethod: {
      it: "Personal Access Token (manuale, incollato in Impostazioni)",
      en: "Personal Access Token (manual, pasted in Settings)",
      es: "Personal Access Token (manual, pegado en Ajustes)",
      de: "Personal Access Token (manuell, in den Einstellungen eingefügt)",
    },
    direction: "export",
    dataTypes: {
      it: "Singoli allenamenti (TCX)",
      en: "Individual workouts (TCX)",
      es: "Entrenamientos individuales (TCX)",
      de: "Einzelne Workouts (TCX)",
    },
    authMethod: {
      it: "Bearer token (PAT generato dall'utente)",
      en: "Bearer token (user-generated PAT)",
      es: "Token Bearer (PAT generado por el usuario)",
      de: "Bearer-Token (vom Nutzer generierter PAT)",
    },
    defaultState: {
      it: "N/D — non ancora funzionante",
      en: "N/A — not yet functional",
      es: "N/D — aún no funcional",
      de: "N/A — noch nicht funktionsfähig",
    },
    syncFrequency: { it: "N/D", en: "N/A", es: "N/D", de: "N/A" },
    status: "in-development",
    limitations: {
      it: "Oggi puoi salvare un token in Impostazioni, ma non è ancora collegato a nessuna azione di invio. È in sviluppo, non un'integrazione live.",
      en: "You can save a token in Settings today, but it isn't connected to any send action yet. This is in development, not a live integration.",
      es: "Hoy puedes guardar un token en Ajustes, pero todavía no está conectado a ninguna acción de envío. Está en desarrollo, no es una integración live.",
      de: "Du kannst heute einen Token in den Einstellungen speichern, aber er ist noch mit keiner Sendeaktion verbunden. Das ist in Entwicklung, keine Live-Integration.",
    },
    lastVerified: "2026-07-12",
  },
  {
    source: "Health Connect",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "Permesso nativo Android",
      en: "Native Android permission",
      es: "Permiso nativo de Android",
      de: "Native Android-Berechtigung",
    },
    direction: "read-write",
    dataTypes: {
      it: "Lettura: tutto ciò che le fonti connesse scrivono su Health Connect. Write-back: passi, fasi del sonno, una misurazione della frequenza cardiaca al giorno, distanza, calorie attive.",
      en: "Read: everything connected sources write to Health Connect. Write-back: steps, sleep stages, one heart-rate reading per day, distance, active calories.",
      es: "Lectura: todo lo que las fuentes conectadas escriben en Health Connect. Write-back: pasos, fases del sueño, una medición de frecuencia cardíaca al día, distancia, calorías activas.",
      de: "Lesen: alles, was verbundene Quellen in Health Connect schreiben. Write-back: Schritte, Schlafphasen, eine Herzfrequenzmessung pro Tag, Distanz, aktive Kalorien.",
    },
    authMethod: {
      it: "Permesso runtime nativo Android",
      en: "Native Android runtime permission",
      es: "Permiso de tiempo de ejecución nativo de Android",
      de: "Native Android-Laufzeitberechtigung",
    },
    defaultState: {
      it: "Opt-in — disattivato di default (interruttore in Impostazioni)",
      en: "Opt-in — off by default (toggle in Settings)",
      es: "Opt-in — desactivado por defecto (interruptor en Ajustes)",
      de: "Opt-in — standardmäßig deaktiviert (Schalter in den Einstellungen)",
    },
    syncFrequency: {
      it: "Lettura: a ogni sync. Write-back: viene eseguito una volta quando attivi l'interruttore, non automaticamente a ogni sync successivo.",
      en: "Read: every sync. Write-back: runs once when you turn the toggle on, not automatically on every later sync.",
      es: "Lectura: en cada sincronización. Write-back: se ejecuta una vez cuando activas el interruptor, no automáticamente en cada sincronización posterior.",
      de: "Lesen: bei jeder Synchronisierung. Write-back: läuft einmal, wenn du den Schalter aktivierst, nicht automatisch bei jeder späteren Synchronisierung.",
    },
    status: "live",
    limitations: {
      it: "Il write-back non include peso o HRV, e non viene riattivato automaticamente a ogni sync (disattiva e riattiva l'interruttore per ri-esportare).",
      en: "Write-back doesn't include weight or HRV, and isn't re-triggered automatically on every sync (toggle it off and on again to re-export).",
      es: "El write-back no incluye peso ni HRV, y no se vuelve a activar automáticamente en cada sincronización (desactiva y vuelve a activar el interruptor para volver a exportar).",
      de: "Write-back umfasst weder Gewicht noch HRV und wird nicht automatisch bei jeder Synchronisierung erneut ausgelöst (Schalter aus- und wieder einschalten, um erneut zu exportieren).",
    },
    lastVerified: "2026-07-12",
  },
  {
    source: "Apple Health",
    platform: { it: "Solo iOS", en: "iOS only", es: "Solo iOS", de: "Nur iOS" },
    connectionMethod: {
      it: "Permesso nativo HealthKit",
      en: "Native HealthKit permission",
      es: "Permiso nativo de HealthKit",
      de: "Native HealthKit-Berechtigung",
    },
    direction: "read-write",
    dataTypes: {
      it: "Lettura: fonti HealthKit più l'anello Colmi via Bluetooth diretto. Write-back: fasi del sonno, passi, frequenza cardiaca a riposo, SpO2, peso, distanza, calorie attive.",
      en: "Read: HealthKit sources plus the Colmi ring over direct Bluetooth. Write-back: sleep stages, steps, resting heart rate, SpO2, weight, distance, active calories.",
      es: "Lectura: fuentes de HealthKit más el anillo Colmi por Bluetooth directo. Write-back: fases del sueño, pasos, frecuencia cardíaca en reposo, SpO2, peso, distancia, calorías activas.",
      de: "Lesen: HealthKit-Quellen plus der Colmi-Ring über direktes Bluetooth. Write-back: Schlafphasen, Schritte, Ruheherzfrequenz, SpO2, Gewicht, Distanz, aktive Kalorien.",
    },
    authMethod: {
      it: "Autorizzazione nativa HealthKit",
      en: "Native HealthKit authorization",
      es: "Autorización nativa de HealthKit",
      de: "Native HealthKit-Autorisierung",
    },
    defaultState: {
      it: "Opt-in — disattivato di default (interruttore in Impostazioni)",
      en: "Opt-in — off by default (toggle in Settings)",
      es: "Opt-in — desactivado por defecto (interruptor en Ajustes)",
      de: "Opt-in — standardmäßig deaktiviert (Schalter in den Einstellungen)",
    },
    syncFrequency: {
      it: "Lettura: a ogni sync. Write-back: dopo ogni sync riuscito.",
      en: "Read: every sync. Write-back: after every successful sync.",
      es: "Lectura: en cada sincronización. Write-back: después de cada sincronización exitosa.",
      de: "Lesen: bei jeder Synchronisierung. Write-back: nach jeder erfolgreichen Synchronisierung.",
    },
    status: "live",
    limitations: {
      it: "Il write-back non include HRV (il cloud memorizza RMSSD, HealthKit si aspetta SDNN — scriverlo produrrebbe un valore sbagliato).",
      en: "Write-back doesn't include HRV (the cloud stores RMSSD, HealthKit expects SDNN — writing it would produce a wrong value).",
      es: "El write-back no incluye HRV (la nube almacena RMSSD, HealthKit espera SDNN — escribirlo produciría un valor incorrecto).",
      de: "Write-back umfasst kein HRV (die Cloud speichert RMSSD, HealthKit erwartet SDNN — das Schreiben würde einen falschen Wert erzeugen).",
    },
    lastVerified: "2026-07-12",
  },
];

/** Altri provider — direzione e stato, fonte: lib/providers/data.ts. */
export const OTHER_PROVIDERS_COMPATIBILITY: CompatibilityRow[] = [
  {
    source: "Galaxy Watch",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "Samsung Health → Health Connect",
      en: "Samsung Health → Health Connect",
      es: "Samsung Health → Health Connect",
      de: "Samsung Health → Health Connect",
    },
    direction: "read",
    dataTypes: STEPS_HR_SLEEP_CAL_WORKOUTS,
    authMethod: HC_PERMISSION,
    defaultState: OPT_IN,
    syncFrequency: EVERY_SYNC,
    status: "live",
    limitations: ANDROID_ONLY_LIMIT,
    lastVerified: "2026-07-12",
    detailHref: "/sync/galaxy-watch",
  },
  {
    source: "Wear OS / Pixel Watch",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "App companion → Health Connect",
      en: "Companion app → Health Connect",
      es: "App complementaria → Health Connect",
      de: "Companion-App → Health Connect",
    },
    direction: "read",
    dataTypes: STEPS_HR_SLEEP_CAL_WORKOUTS,
    authMethod: HC_PERMISSION,
    defaultState: OPT_IN,
    syncFrequency: EVERY_SYNC,
    status: "live",
    limitations: ANDROID_ONLY_LIMIT,
    lastVerified: "2026-07-12",
    detailHref: "/sync/wear-os",
  },
  {
    source: "Xiaomi Mi Band / Watch",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "Mi Fitness → Health Connect",
      en: "Mi Fitness → Health Connect",
      es: "Mi Fitness → Health Connect",
      de: "Mi Fitness → Health Connect",
    },
    direction: "read",
    dataTypes: STEPS_HR_SLEEP_CAL,
    authMethod: HC_PERMISSION,
    defaultState: OPT_IN,
    syncFrequency: EVERY_SYNC,
    status: "live",
    limitations: {
      it: "Mi Band 7 e successivi. Solo Android.",
      en: "Mi Band 7 and later. Android only.",
      es: "Mi Band 7 y posteriores. Solo Android.",
      de: "Mi Band 7 und neuer. Nur Android.",
    },
    lastVerified: "2026-07-12",
    detailHref: "/sync/xiaomi-mi-band",
  },
  {
    source: "Fitbit",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "App Fitbit → Health Connect (livello base)",
      en: "Fitbit app → Health Connect (basic tier)",
      es: "App de Fitbit → Health Connect (nivel básico)",
      de: "Fitbit-App → Health Connect (Basis-Stufe)",
    },
    direction: "read",
    dataTypes: {
      it: "Passi, frequenza cardiaca, durata totale del sonno, calorie",
      en: "Steps, heart rate, total sleep duration, calories",
      es: "Pasos, frecuencia cardíaca, duración total del sueño, calorías",
      de: "Schritte, Herzfrequenz, gesamte Schlafdauer, Kalorien",
    },
    authMethod: HC_PERMISSION,
    defaultState: OPT_IN,
    syncFrequency: EVERY_SYNC,
    status: "beta",
    limitations: {
      it: "Le fasi del sonno dettagliate e gli allenamenti GPS richiedono l'OAuth ufficiale della Fitbit Web API, ancora in roadmap. Le metriche base funzionano oggi via Health Connect.",
      en: "Detailed sleep stages and GPS workouts need the official Fitbit Web API OAuth, still on the roadmap. Basic metrics work today via Health Connect.",
      es: "Las fases del sueño detalladas y los entrenamientos con GPS necesitan el OAuth oficial de la Fitbit Web API, todavía en la hoja de ruta. Las métricas básicas funcionan hoy vía Health Connect.",
      de: "Detaillierte Schlafphasen und GPS-Workouts benötigen das offizielle Fitbit-Web-API-OAuth, das noch auf der Roadmap steht. Basis-Metriken funktionieren heute über Health Connect.",
    },
    lastVerified: "2026-07-12",
    detailHref: "/sync/fitbit",
  },
  {
    source: "Garmin Connect",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "App Garmin Connect → Health Connect (livello base)",
      en: "Garmin Connect app → Health Connect (basic tier)",
      es: "App de Garmin Connect → Health Connect (nivel básico)",
      de: "Garmin Connect-App → Health Connect (Basis-Stufe)",
    },
    direction: "read",
    dataTypes: {
      it: "Passi, frequenza cardiaca, sonno, calorie, distanza, allenamenti base",
      en: "Steps, heart rate, sleep, calories, distance, basic workouts",
      es: "Pasos, frecuencia cardíaca, sueño, calorías, distancia, entrenamientos básicos",
      de: "Schritte, Herzfrequenz, Schlaf, Kalorien, Distanz, einfache Workouts",
    },
    authMethod: HC_PERMISSION,
    defaultState: OPT_IN,
    syncFrequency: EVERY_SYNC,
    status: "beta",
    limitations: {
      it: "Body Battery, Training Load, Recovery Time e il GPS dettagliato richiedono l'OAuth ufficiale della Garmin Health API, ancora in roadmap.",
      en: "Body Battery, Training Load, Recovery Time and detailed GPS need the official Garmin Health API OAuth, still on the roadmap.",
      es: "Body Battery, Training Load, Recovery Time y el GPS detallado necesitan el OAuth oficial de la Garmin Health API, todavía en la hoja de ruta.",
      de: "Body Battery, Training Load, Recovery Time und detailliertes GPS benötigen das offizielle Garmin-Health-API-OAuth, das noch auf der Roadmap steht.",
    },
    lastVerified: "2026-07-12",
    detailHref: "/sync/garmin",
  },
  {
    source: "Polar",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "Polar Flow → Health Connect (livello base)",
      en: "Polar Flow → Health Connect (basic tier)",
      es: "Polar Flow → Health Connect (nivel básico)",
      de: "Polar Flow → Health Connect (Basis-Stufe)",
    },
    direction: "read",
    dataTypes: STEPS_HR_SLEEP_CAL,
    authMethod: HC_PERMISSION,
    defaultState: OPT_IN,
    syncFrequency: EVERY_SYNC,
    status: "beta",
    limitations: {
      it: "L'OAuth Accesslink per le metriche avanzate è in roadmap.",
      en: "Accesslink OAuth for advanced metrics is on the roadmap.",
      es: "El OAuth de Accesslink para métricas avanzadas está en la hoja de ruta.",
      de: "Accesslink-OAuth für erweiterte Metriken steht auf der Roadmap.",
    },
    lastVerified: "2026-07-12",
    detailHref: "/sync/polar",
  },
  {
    source: "Withings",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "Health Mate → Health Connect (livello base)",
      en: "Health Mate → Health Connect (basic tier)",
      es: "Health Mate → Health Connect (nivel básico)",
      de: "Health Mate → Health Connect (Basis-Stufe)",
    },
    direction: "read",
    dataTypes: {
      it: "Peso, sonno, frequenza cardiaca, passi",
      en: "Weight, sleep, heart rate, steps",
      es: "Peso, sueño, frecuencia cardíaca, pasos",
      de: "Gewicht, Schlaf, Herzfrequenz, Schritte",
    },
    authMethod: HC_PERMISSION,
    defaultState: OPT_IN,
    syncFrequency: EVERY_SYNC,
    status: "beta",
    limitations: {
      it: "L'API OAuth ufficiale v2 per le metriche avanzate è in roadmap.",
      en: "Official OAuth API v2 for advanced metrics is on the roadmap.",
      es: "La API OAuth oficial v2 para métricas avanzadas está en la hoja de ruta.",
      de: "Die offizielle OAuth-API v2 für erweiterte Metriken steht auf der Roadmap.",
    },
    lastVerified: "2026-07-12",
    detailHref: "/sync/withings",
  },
  {
    source: "Suunto",
    platform: ANDROID_ONLY,
    connectionMethod: { it: "OAuth", en: "OAuth", es: "OAuth", de: "OAuth" },
    direction: "read",
    dataTypes: {
      it: "Allenamenti, frequenza cardiaca",
      en: "Workouts, heart rate",
      es: "Entrenamientos, frecuencia cardíaca",
      de: "Workouts, Herzfrequenz",
    },
    authMethod: { it: "OAuth2", en: "OAuth2", es: "OAuth2", de: "OAuth2" },
    defaultState: OPT_IN,
    syncFrequency: EVERY_SYNC,
    status: "beta",
    limitations: {
      it: "In fase di test attivo.",
      en: "In active testing.",
      es: "En pruebas activas.",
      de: "In aktivem Test.",
    },
    lastVerified: "2026-07-12",
  },
  {
    source: "Oura Ring",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "OAuth (integrazione dedicata)",
      en: "OAuth (dedicated integration)",
      es: "OAuth (integración dedicada)",
      de: "OAuth (dedizierte Integration)",
    },
    direction: "read",
    dataTypes: {
      it: "Sonno, readiness, frequenza cardiaca",
      en: "Sleep, readiness, heart rate",
      es: "Sueño, readiness, frecuencia cardíaca",
      de: "Schlaf, Readiness, Herzfrequenz",
    },
    authMethod: { it: "OAuth2", en: "OAuth2", es: "OAuth2", de: "OAuth2" },
    defaultState: { it: "N/D", en: "N/A", es: "N/D", de: "N/A" },
    syncFrequency: { it: "N/D", en: "N/A", es: "N/D", de: "N/A" },
    status: "roadmap",
    limitations: {
      it: "Non ancora collegabile tramite l'integrazione Oura dedicata di FitMesh: il client OAuth non è configurato in nessuna build reale, quindi il pulsante di connessione non compare nell'app. Se la tua app Oura scrive già su Health Connect sul telefono, la lettura generica di Health Connect di FitMesh potrebbe comunque raccogliere quei dati indipendentemente.",
      en: "Not connectable yet through FitMesh's dedicated Oura integration: the OAuth client isn't configured in any real build, so the connect button doesn't appear in the app. If your Oura app already writes to Health Connect on your phone, FitMesh's generic Health Connect read may still pick up that data independently.",
      es: "Todavía no se puede conectar a través de la integración dedicada de Oura de FitMesh: el cliente OAuth no está configurado en ninguna build real, por lo que el botón de conexión no aparece en la app. Si tu app de Oura ya escribe en Health Connect en tu teléfono, la lectura genérica de Health Connect de FitMesh podría seguir recogiendo esos datos de forma independiente.",
      de: "Noch nicht über FitMeshs dedizierte Oura-Integration verbindbar: Der OAuth-Client ist in keinem realen Build konfiguriert, daher erscheint die Verbindungsschaltfläche nicht in der App. Wenn deine Oura-App bereits in Health Connect auf deinem Telefon schreibt, kann FitMeshs generisches Health-Connect-Lesen diese Daten trotzdem unabhängig erfassen.",
    },
    lastVerified: "2026-07-15",
  },
  {
    source: "Huawei Health",
    platform: ANDROID_ONLY,
    connectionMethod: {
      it: "Huawei Health Kit OAuth",
      en: "Huawei Health Kit OAuth",
      es: "Huawei Health Kit OAuth",
      de: "Huawei Health Kit OAuth",
    },
    direction: "read",
    dataTypes: {
      it: "Passi, frequenza cardiaca, sonno",
      en: "Steps, heart rate, sleep",
      es: "Pasos, frecuencia cardíaca, sueño",
      de: "Schritte, Herzfrequenz, Schlaf",
    },
    authMethod: { it: "OAuth2", en: "OAuth2", es: "OAuth2", de: "OAuth2" },
    defaultState: { it: "N/D", en: "N/A", es: "N/D", de: "N/A" },
    syncFrequency: { it: "N/D", en: "N/A", es: "N/D", de: "N/A" },
    status: "roadmap",
    limitations: {
      it: "In fase di valutazione.",
      en: "Under evaluation.",
      es: "En evaluación.",
      de: "In Prüfung.",
    },
    lastVerified: "2026-07-12",
  },
  {
    source: "Colmi Ring",
    platform: { it: "Android + iOS", en: "Android + iOS", es: "Android + iOS", de: "Android + iOS" },
    connectionMethod: {
      it: "Bluetooth diretto (nessun hub salute necessario)",
      en: "Direct Bluetooth (no health hub needed)",
      es: "Bluetooth directo (no necesita hub de salud)",
      de: "Direktes Bluetooth (kein Health-Hub nötig)",
    },
    direction: "read",
    dataTypes: {
      it: "Frequenza cardiaca, SpO2, HRV, stress, sonno, temperatura",
      en: "Heart rate, SpO2, HRV, stress, sleep, temperature",
      es: "Frecuencia cardíaca, SpO2, HRV, estrés, sueño, temperatura",
      de: "Herzfrequenz, SpO2, HRV, Stress, Schlaf, Temperatur",
    },
    authMethod: {
      it: "Pairing Bluetooth",
      en: "Bluetooth pairing",
      es: "Emparejamiento Bluetooth",
      de: "Bluetooth-Pairing",
    },
    defaultState: {
      it: "Opt-in — collega l'anello nell'app",
      en: "Opt-in — connect the ring in the app",
      es: "Opt-in — conecta el anillo en la app",
      de: "Opt-in — Ring in der App verbinden",
    },
    syncFrequency: EVERY_SYNC,
    status: "live",
    limitations: {
      it: "Nessuna limitazione specifica a questo metodo di connessione.",
      en: "None specific to this connection method.",
      es: "Ninguna limitación específica de este método de conexión.",
      de: "Keine Einschränkungen speziell für diese Verbindungsmethode.",
    },
    lastVerified: "2026-07-12",
    detailHref: "/sync/colmi-ring",
  },
];

export interface FaqEntry {
  q: Localized;
  a: Localized;
}

export const FITNESS_DATA_SYNC_FAQ: FaqEntry[] = [
  {
    q: {
      it: "Cos'è il fitness data sync?",
      en: "What is fitness data sync?",
      es: "¿Qué es la sincronización de datos de fitness?",
      de: "Was ist Fitnessdaten-Synchronisierung?",
    },
    a: {
      it: "Il fitness data sync significa spostare o combinare i dati di salute e allenamento tra le app e i wearable che usi davvero, così non devi controllare cinque app diverse per vedere passi, sonno e allenamenti. Può significare un health hub di piattaforma (Health Connect su Android, Apple Health su iOS), una bridge app che sposta dati da un'app specifica a un'altra, o una dashboard indipendente che legge da più fonti e le mostra in un unico posto. FitMesh Sync è il terzo tipo: una dashboard.",
      en: "Fitness data sync means moving or combining health and workout data across the apps and wearables you actually use, so you don't have to check five different apps to see your steps, sleep and workouts. It can mean a platform-level health hub (Health Connect on Android, Apple Health on iOS), a bridge app that moves data from one specific app to another, or an independent dashboard that reads from multiple sources and shows them in one place. FitMesh Sync is the third kind: a dashboard.",
      es: "La sincronización de datos de fitness significa mover o combinar datos de salud y entrenamiento entre las apps y wearables que realmente usas, para que no tengas que revisar cinco apps distintas para ver tus pasos, sueño y entrenamientos. Puede significar un hub de salud a nivel de sistema (Health Connect en Android, Apple Health en iOS), una bridge app que mueve datos de una app específica a otra, o un panel independiente que lee de varias fuentes y las muestra en un solo lugar. FitMesh Sync es el tercer tipo: un panel.",
      de: "Fitnessdaten-Synchronisierung bedeutet, Gesundheits- und Trainingsdaten über die Apps und Wearables zu verschieben oder zu kombinieren, die du tatsächlich nutzt, damit du nicht fünf verschiedene Apps prüfen musst, um deine Schritte, deinen Schlaf und deine Workouts zu sehen. Das kann ein plattformweiter Health-Hub sein (Health Connect auf Android, Apple Health auf iOS), eine Bridge-App, die Daten von einer bestimmten App zu einer anderen verschiebt, oder ein unabhängiges Dashboard, das aus mehreren Quellen liest und sie an einem Ort zeigt. FitMesh Sync ist die dritte Art: ein Dashboard.",
    },
  },
  {
    q: {
      it: "Qual è la differenza tra un health hub, una bridge app e una dashboard fitness?",
      en: "What is the difference between a health hub, a bridge app and a fitness dashboard?",
      es: "¿Cuál es la diferencia entre un hub de salud, una bridge app y un panel de fitness?",
      de: "Was ist der Unterschied zwischen einem Health-Hub, einer Bridge-App und einem Fitness-Dashboard?",
    },
    a: {
      it: "Un health hub (Health Connect, Apple Health) è un archivio dati gestito dal permesso, integrato nel sistema operativo: le app leggono e scrivono lì, ma non ha una propria dashboard. Una bridge app sposta dati da una fonte specifica a una destinazione specifica, di solito per un caso d'uso ristretto (es. esportare un singolo file di allenamento). Una dashboard indipendente, come FitMesh Sync, legge da più fonti connesse contemporaneamente, deduplica i dati sovrapposti e mostra tutto in un'unica vista. Le dashboard non promettono di scrivere ovunque possa farlo una bridge app.",
      en: "A health hub (Health Connect, Apple Health) is a permission-gated data store built into the OS: apps read and write to it, but it has no dashboard of its own. A bridge app moves data from one specific source to one specific destination, usually for a narrow use case (e.g. exporting a single workout file). An independent dashboard, like FitMesh Sync, reads from multiple connected sources at once, deduplicates overlapping data, and shows everything in one view. Dashboards don't promise to write everywhere a bridge app might.",
      es: "Un hub de salud (Health Connect, Apple Health) es un almacén de datos gestionado por permisos, integrado en el sistema operativo: las apps leen y escriben ahí, pero no tiene panel propio. Una bridge app mueve datos de una fuente específica a un destino específico, normalmente para un caso de uso concreto (p. ej. exportar un único archivo de entrenamiento). Un panel independiente, como FitMesh Sync, lee de varias fuentes conectadas a la vez, deduplica los datos superpuestos y muestra todo en una sola vista. Los paneles no prometen escribir en todas partes donde podría hacerlo una bridge app.",
      de: "Ein Health-Hub (Health Connect, Apple Health) ist ein berechtigungsgesteuerter Datenspeicher, der ins Betriebssystem integriert ist: Apps lesen und schreiben dort, aber er hat kein eigenes Dashboard. Eine Bridge-App verschiebt Daten von einer bestimmten Quelle zu einem bestimmten Ziel, meist für einen engen Anwendungsfall (z. B. den Export einer einzelnen Trainingsdatei). Ein unabhängiges Dashboard wie FitMesh Sync liest gleichzeitig aus mehreren verbundenen Quellen, dedupliziert überlappende Daten und zeigt alles in einer Ansicht. Dashboards versprechen nicht, überall zu schreiben, wo eine Bridge-App das könnte.",
    },
  },
  {
    q: {
      it: "FitMesh può sincronizzare dati tra ogni app fitness?",
      en: "Can FitMesh sync data between every fitness app?",
      es: "¿Puede FitMesh sincronizar datos entre todas las apps de fitness?",
      de: "Kann FitMesh Daten zwischen jeder Fitness-App synchronisieren?",
    },
    a: {
      it: "No. FitMesh legge da Health Connect (Android), Apple Health più una connessione Bluetooth diretta all'anello Colmi (iOS), e una lista crescente di provider connessi via OAuth (vedi la tabella di compatibilità sopra). Non è un bridge universale che può spostare dati tra due app qualsiasi. Alcune integrazioni sono solo lettura oggi, alcune supportano anche un write-back specifico e limitato, e altre sono ancora in sviluppo. Controlla la tabella per lo stato esatto della fonte o destinazione che ti interessa prima di dare per scontato che funzioni.",
      en: "No. FitMesh reads from Health Connect (Android), Apple Health plus a direct Bluetooth connection to the Colmi ring (iOS), and a growing list of OAuth-connected providers (see the compatibility table above). It is not a universal bridge that can move data between any two arbitrary apps. Some integrations are read-only today, some also support a specific, limited write-back, and some are still in development. Check the table for the exact status of the source or destination you care about before assuming it works.",
      es: "No. FitMesh lee desde Health Connect (Android), Apple Health más una conexión Bluetooth directa al anillo Colmi (iOS), y una lista creciente de proveedores conectados por OAuth (ver la tabla de compatibilidad arriba). No es un bridge universal que pueda mover datos entre dos apps cualesquiera. Algunas integraciones son solo lectura hoy, algunas también admiten un write-back específico y limitado, y otras siguen en desarrollo. Consulta la tabla para conocer el estado exacto de la fuente o destino que te interesa antes de asumir que funciona.",
      de: "Nein. FitMesh liest aus Health Connect (Android), Apple Health plus einer direkten Bluetooth-Verbindung zum Colmi-Ring (iOS) und einer wachsenden Liste von OAuth-verbundenen Anbietern (siehe Kompatibilitätstabelle oben). Es ist keine universelle Bridge, die Daten zwischen zwei beliebigen Apps verschieben kann. Manche Integrationen sind heute nur lesend, manche unterstützen auch ein spezifisches, begrenztes Write-back, und manche befinden sich noch in Entwicklung. Prüfe die Tabelle auf den genauen Status der Quelle oder des Ziels, das dich interessiert, bevor du annimmst, dass es funktioniert.",
    },
  },
  {
    q: {
      it: "Come gestisce FitMesh i dati fitness duplicati?",
      en: "How does FitMesh handle duplicate fitness data?",
      es: "¿Cómo gestiona FitMesh los datos de fitness duplicados?",
      de: "Wie geht FitMesh mit doppelten Fitnessdaten um?",
    },
    a: {
      it: "Quando più fonti riportano la stessa metrica per lo stesso giorno (es. il telefono che conta i passi e anche l'orologio che li conta), FitMesh applica regole di fusione per metrica invece di sommare tutto: sceglie la fonte più completa o accurata e riempie i buchi dalle altre, invece di contare due volte. Quando FitMesh scrive dati indietro su Health Connect o Apple Health, tagga anche ciò che scrive così che la sua stessa lettura al sync successivo non lo riprenda come se fosse una nuova fonte esterna, il che causerebbe un loop di sync.",
      en: "When multiple sources report the same metric for the same day (e.g. your phone counting steps and your watch also counting steps), FitMesh applies per-metric fusion rules rather than summing everything: it picks the more complete or more accurate source and fills gaps from the others, instead of double-counting. When FitMesh writes data back to Health Connect or Apple Health, it also tags what it writes so its own read pass on a later sync doesn't pick that data back up as a new foreign source, which is what would cause a sync loop.",
      es: "Cuando varias fuentes reportan la misma métrica para el mismo día (p. ej. tu teléfono contando pasos y tu reloj también contando pasos), FitMesh aplica reglas de fusión por métrica en lugar de sumar todo: elige la fuente más completa o precisa y rellena los huecos con las demás, en vez de contar dos veces. Cuando FitMesh escribe datos de vuelta en Health Connect o Apple Health, también etiqueta lo que escribe para que su propia lectura en una sincronización posterior no recoja esos datos como una nueva fuente externa, lo que causaría un bucle de sincronización.",
      de: "Wenn mehrere Quellen dieselbe Metrik für denselben Tag melden (z. B. dein Telefon zählt Schritte und deine Uhr zählt ebenfalls Schritte), wendet FitMesh Fusionsregeln pro Metrik an, statt alles zu addieren: Es wählt die vollständigere oder genauere Quelle und füllt Lücken aus den anderen, statt doppelt zu zählen. Wenn FitMesh Daten zurück in Health Connect oder Apple Health schreibt, markiert es auch, was es schreibt, damit sein eigener Lesevorgang bei einer späteren Synchronisierung diese Daten nicht als neue externe Quelle aufgreift, was einen Sync-Loop verursachen würde.",
    },
  },
  {
    q: {
      it: "FitMesh funziona su Android e iPhone?",
      en: "Does FitMesh work on Android and iPhone?",
      es: "¿FitMesh funciona en Android y iPhone?",
      de: "Funktioniert FitMesh auf Android und iPhone?",
    },
    a: {
      it: "Sì, su entrambi, ma la connessione sottostante è diversa per piattaforma. Su Android, FitMesh legge da Health Connect, alimentato da qualsiasi app companion tu abbia già installato (Samsung Health, Garmin Connect, Fitbit e altre). Su iPhone, FitMesh legge da Apple Health e può anche connettersi direttamente all'anello Colmi via Bluetooth, senza bisogno di Apple Health come intermediario per quel dispositivo specifico.",
      en: "Yes, on both, but the underlying connection is different per platform. On Android, FitMesh reads from Health Connect, which is fed by whichever companion apps you already have installed (Samsung Health, Garmin Connect, Fitbit, and more). On iPhone, FitMesh reads from Apple Health and can also connect directly to the Colmi ring over Bluetooth, without needing Apple Health as an intermediary for that specific device.",
      es: "Sí, en ambos, pero la conexión subyacente es diferente según la plataforma. En Android, FitMesh lee desde Health Connect, que se alimenta de las apps complementarias que ya tengas instaladas (Samsung Health, Garmin Connect, Fitbit y más). En iPhone, FitMesh lee desde Apple Health y también puede conectarse directamente al anillo Colmi por Bluetooth, sin necesitar Apple Health como intermediario para ese dispositivo específico.",
      de: "Ja, auf beiden, aber die zugrunde liegende Verbindung ist je nach Plattform unterschiedlich. Auf Android liest FitMesh aus Health Connect, das von den bereits installierten Companion-Apps gespeist wird (Samsung Health, Garmin Connect, Fitbit und mehr). Auf dem iPhone liest FitMesh aus Apple Health und kann sich auch direkt über Bluetooth mit dem Colmi-Ring verbinden, ohne Apple Health als Vermittler für dieses spezifische Gerät zu benötigen.",
    },
  },
  {
    q: {
      it: "FitMesh può scrivere i miei dati su altre app?",
      en: "Can FitMesh write my data to other apps?",
      es: "¿Puede FitMesh escribir mis datos en otras apps?",
      de: "Kann FitMesh meine Daten in andere Apps schreiben?",
    },
    a: {
      it: "In modo limitato e opt-in. FitMesh può scrivere i suoi dati deduplicati e fusi su Health Connect (Android) e Apple Health (iOS), disattivato di default finché non lo attivi in Impostazioni. Inviare singoli allenamenti a Strava, TrainingPeaks o piattaforme di allenamento simili è una capacità separata e più ristretta, ancora in sviluppo per alcune destinazioni. Non è una funzione generica \"sync ovunque\": controlla la tabella di compatibilità per ciò che è effettivamente disponibile oggi per la destinazione che hai in mente.",
      en: "In a limited, opt-in way. FitMesh can write its deduplicated, fused data back to Health Connect (Android) and Apple Health (iOS), off by default until you turn it on in Settings. Sending individual workouts to Strava, TrainingPeaks or similar training platforms is a separate, narrower capability that's still in development for some destinations. This isn't a general-purpose \"sync to anywhere\" feature: check the compatibility table for what's actually available today for the destination you have in mind.",
      es: "De forma limitada y opt-in. FitMesh puede escribir sus datos deduplicados y fusionados de vuelta en Health Connect (Android) y Apple Health (iOS), desactivado por defecto hasta que lo actives en Ajustes. Enviar entrenamientos individuales a Strava, TrainingPeaks o plataformas de entrenamiento similares es una capacidad separada y más limitada, todavía en desarrollo para algunos destinos. Esto no es una función genérica de \"sincronizar a cualquier lugar\": consulta la tabla de compatibilidad para ver qué está realmente disponible hoy para el destino que tienes en mente.",
      de: "Auf begrenzte, Opt-in-Weise. FitMesh kann seine deduplizierten, fusionierten Daten zurück in Health Connect (Android) und Apple Health (iOS) schreiben, standardmäßig deaktiviert, bis du es in den Einstellungen aktivierst. Das Senden einzelner Workouts an Strava, TrainingPeaks oder ähnliche Trainingsplattformen ist eine separate, engere Fähigkeit, die für manche Ziele noch in Entwicklung ist. Das ist keine allgemeine \"Sync überallhin\"-Funktion: Prüfe die Kompatibilitätstabelle, was für das gewünschte Ziel heute tatsächlich verfügbar ist.",
    },
  },
];
