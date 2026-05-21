/**
 * Single source of truth per le pagine /sync/[provider] e /integrations.
 *
 * Ogni provider produce una landing SEO dedicata. Lo `status` determina
 * la CTA principale (download vs waitlist) e il badge mostrato.
 *
 * Quando una integrazione passa da `roadmap` o `beta` a `live`, basta
 * cambiare lo status qui e la landing si aggiorna automaticamente.
 */

import type { Locale } from "@/lib/i18n";

export type ProviderStatus =
  | "live" // Supportato nativamente (es. Galaxy Watch via Samsung Health → HC)
  | "live-basic" // Funziona oggi via Health Connect al livello base, OAuth ufficiale in arrivo per dati avanzati
  | "beta" // Implementato ma in test
  | "roadmap-q3" // Pianificato Q3 2026 (NO path HC, serve OAuth)
  | "roadmap-q4"; // Pianificato Q4 2026 (NO path HC, serve OAuth)

export type ProviderCategory =
  | "smartwatch"
  | "fitness-platform"
  | "health-platform"
  | "wearable";

export interface ProviderFAQ {
  q: { it: string; en: string };
  a: { it: string; en: string };
}

export interface Provider {
  /** URL slug — minuscolo, no spazi, no diacritici. Stabile (è SEO-critical). */
  slug: string;
  /** Nome commerciale completo (es. "Galaxy Watch", "Fitbit"). */
  name: string;
  /** Produttore (es. "Samsung", "Google"). */
  vendor: string;
  category: ProviderCategory;
  status: ProviderStatus;
  /** Colore brand del provider (esadecimale). Usato per il monogramma badge. */
  brandColor: string;
  /** Lettera o emoji per il monogramma (no logo proprietario per ora). */
  initial: string;
  /** Tagline breve mostrata nelle card hub e nelle meta description. */
  tagline: { it: string; en: string };
  /** Long description per la landing (1-2 paragrafi). */
  longDesc: { it: string; en: string };
  /** Note tecniche sulla modalità di connessione (Health Connect / API diretta / etc.). */
  techNote: { it: string; en: string };
  /** Tipi di dato supportati o pianificati (mostrati come pill). */
  dataTypes: Array<{
    key: string;
    label: { it: string; en: string };
    supported: boolean;
  }>;
  /** FAQ specifiche del provider (per JSON-LD FAQPage + render). */
  faqs: ProviderFAQ[];
  /** Keyword principali per il <meta description> e l'H1. */
  seoKeywords: { it: string[]; en: string[] };
  /**
   * Solo per status="live-basic": dettagli su cosa funziona oggi via Health Connect
   * e cosa aggiungerà l'integrazione OAuth ufficiale.
   */
  viaHC?: {
    /** ETA OAuth ufficiale (es. "Q3 2026"). */
    oauthEta: { it: string; en: string };
    /** Lista cose che funzionano già via HC (1 riga ognuna). */
    worksNow: { it: string[]; en: string[] };
    /** Lista cose che l'OAuth aggiungerà (1 riga ognuna). */
    oauthAdds: { it: string[]; en: string[] };
  };
  /** Guida step-by-step opzionale renderizzata tra tech note e FAQ. */
  setupGuide?: ProviderSetupGuide;
}

export interface ProviderSetupGuide {
  /** Passi numerati (5 step ideale). Markdown bold inline OK via **text**. */
  steps: { it: string[]; en: string[] };
  /** Cosa viene sincronizzato (bullet list). */
  syncedData: { it: string[]; en: string[] };
  /** Troubleshooting Q&A (3 ideale). */
  troubleshooting: Array<{
    q: { it: string; en: string };
    a: { it: string; en: string };
  }>;
  /** Note tecniche conclusive (1 paragrafo). */
  technicalNotes: { it: string; en: string };
}

const STD_DATA_TYPES = (extras: Record<string, boolean> = {}) => [
  {
    key: "steps",
    label: { it: "Passi", en: "Steps" },
    supported: extras.steps ?? true,
  },
  {
    key: "hr",
    label: { it: "Frequenza cardiaca", en: "Heart rate" },
    supported: extras.hr ?? true,
  },
  {
    key: "sleep",
    label: { it: "Sonno con fasi", en: "Sleep with stages" },
    supported: extras.sleep ?? true,
  },
  {
    key: "calories",
    label: { it: "Calorie", en: "Calories" },
    supported: extras.calories ?? true,
  },
  {
    key: "distance",
    label: { it: "Distanza & GPS", en: "Distance & GPS" },
    supported: extras.distance ?? true,
  },
  {
    key: "workouts",
    label: { it: "Allenamenti", en: "Workouts" },
    supported: extras.workouts ?? true,
  },
  {
    key: "vo2max",
    label: { it: "VO₂ max", en: "VO₂ max" },
    supported: extras.vo2max ?? false,
  },
  {
    key: "spo2",
    label: { it: "SpO₂", en: "SpO₂" },
    supported: extras.spo2 ?? false,
  },
];

export const PROVIDERS: Provider[] = [
  // ── Smartwatch (live via Health Connect) ────────────────────────────────
  {
    slug: "galaxy-watch",
    name: "Galaxy Watch",
    vendor: "Samsung",
    category: "smartwatch",
    status: "live",
    brandColor: "#1428A0",
    initial: "G",
    tagline: {
      it: "Galaxy Watch 4/5/6/7/Ultra su dashboard personale. Setup in 30 secondi.",
      en: "Galaxy Watch 4/5/6/7/Ultra on a personal dashboard. 30-second setup.",
    },
    longDesc: {
      it: "FitMesh Sync legge i dati del tuo Samsung Galaxy Watch tramite Samsung Health + Health Connect e li mostra su una dashboard web personale: passi, battito, sonno con fasi, allenamenti, calorie, VO₂ max. Niente cloud opachi, niente account social, niente pubblicità.",
      en: "FitMesh Sync reads your Samsung Galaxy Watch data via Samsung Health + Health Connect and surfaces it on a personal web dashboard: steps, heart rate, sleep stages, workouts, calories, VO₂ max. No opaque clouds, no social accounts, no ads.",
    },
    techNote: {
      it: "Connessione nativa via Health Connect — non richiede login OAuth. I dati restano sul telefono e vengono inviati solo al server che scegli tu nelle impostazioni.",
      en: "Native connection via Health Connect — no OAuth login required. Data stays on your phone and is only sent to the server you choose in settings.",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: true, spo2: true }),
    faqs: [
      {
        q: {
          it: "Funziona con Galaxy Watch 4?",
          en: "Does it work with Galaxy Watch 4?",
        },
        a: {
          it: "Sì. Tutti i Galaxy Watch dal 4 in poi (Watch 4, 5, 5 Pro, 6, 6 Classic, 7, Ultra) sono supportati nativamente perché scrivono su Samsung Health, che FitMesh legge via Health Connect.",
          en: "Yes. All Galaxy Watch models from 4 onwards (Watch 4, 5, 5 Pro, 6, 6 Classic, 7, Ultra) are supported natively because they write to Samsung Health, which FitMesh reads via Health Connect.",
        },
      },
      {
        q: {
          it: "Devo installare Samsung Health?",
          en: "Do I need to install Samsung Health?",
        },
        a: {
          it: "Sì. Samsung Health è il bridge che il tuo Galaxy Watch usa per scrivere su Health Connect. È già preinstallato sui telefoni Samsung. Su altri Android Samsung Health è gratis dal Play Store.",
          en: "Yes. Samsung Health is the bridge your Galaxy Watch uses to write to Health Connect. It's preinstalled on Samsung phones. On other Android devices Samsung Health is free on the Play Store.",
        },
      },
      {
        q: {
          it: "I dati arrivano in tempo reale?",
          en: "Is the data real-time?",
        },
        a: {
          it: "Il sync è automatico ogni 15 minuti in background, oltre a un sync immediato all'apertura dell'app. Per dati istantanei puoi premere 'Sincronizza ora' nel menu.",
          en: "Sync runs automatically every 15 minutes in the background, plus an instant sync when you open the app. For real-time data tap 'Sync now' in the menu.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare galaxy watch dashboard",
        "samsung health export dati",
        "galaxy watch dashboard web",
        "dati salute galaxy watch",
      ],
      en: [
        "sync galaxy watch dashboard",
        "samsung health export data",
        "galaxy watch web dashboard",
        "galaxy watch health data",
      ],
    },
    setupGuide: {
      steps: {
        it: [
          "Installa **Health Connect** dal Play Store (preinstallato su Android 14+).",
          "Aggiorna **Samsung Health** all'ultima versione e apri l'app almeno una volta.",
          "Apri Samsung Health → menu ☰ → Impostazioni → Health Connect → tocca **Autorizza** e abilita lettura/scrittura per passi, BPM, sonno, calorie, distanza, allenamenti, SpO₂.",
          "Installa **FitMesh Sync** dal Play Store e accedi con Google.",
          "Concedi a FitMesh i permessi Health Connect richiesti al primo avvio. Premi **Sincronizza ora** per il backfill iniziale.",
        ],
        en: [
          "Install **Health Connect** from the Play Store (preinstalled on Android 14+).",
          "Update **Samsung Health** to the latest version and open it at least once.",
          "Open Samsung Health → ☰ menu → Settings → Health Connect → tap **Allow** and enable read/write for steps, heart rate, sleep, calories, distance, workouts, SpO₂.",
          "Install **FitMesh Sync** from the Play Store and sign in with Google.",
          "Grant FitMesh the requested Health Connect permissions on first launch. Tap **Sync now** for the initial backfill.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri e per intervallo",
          "Frequenza cardiaca (media, riposo, sample continuo)",
          "Sonno con fasi (Profondo, REM, Leggero, Sveglio)",
          "Calorie attive e basali",
          "Distanza percorsa",
          "Allenamenti (tipo, durata, kcal, BPM medio)",
          "SpO₂ — saturazione ossigeno notturna",
          "VO₂ max (se misurato dal Watch)",
        ],
        en: [
          "Daily and intraday steps",
          "Heart rate (average, resting, continuous samples)",
          "Sleep with stages (Deep, REM, Light, Awake)",
          "Active and basal calories",
          "Distance",
          "Workouts (type, duration, kcal, average BPM)",
          "SpO₂ — overnight blood oxygen",
          "VO₂ max (when measured by the Watch)",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Non vedo i miei dati su FitMesh",
            en: "I don't see my data in FitMesh",
          },
          a: {
            it: "Torna in Samsung Health → Impostazioni → Health Connect → verifica che FitMesh sia nella lista app autorizzate.",
            en: "Go back to Samsung Health → Settings → Health Connect → make sure FitMesh is in the authorized apps list.",
          },
        },
        {
          q: {
            it: "I dati arrivano in ritardo",
            en: "Data arrives late",
          },
          a: {
            it: "Samsung Health spinge su Health Connect ogni 15 minuti circa. Per forzare un push immediato apri Samsung Health, scorri verso il basso sulla home, poi torna su FitMesh e premi 'Sincronizza ora'.",
            en: "Samsung Health pushes to Health Connect roughly every 15 minutes. To force an immediate push open Samsung Health, pull down to refresh, then return to FitMesh and tap 'Sync now'.",
          },
        },
        {
          q: {
            it: "Vedo i passi ma non il sonno",
            en: "I see steps but not sleep",
          },
          a: {
            it: "In Samsung Health → Impostazioni → Health Connect controlla che il permesso 'Sonno' sia attivo. È un permesso separato e di default non è incluso nel 'Concedi tutto'.",
            en: "In Samsung Health → Settings → Health Connect verify that the 'Sleep' permission is enabled. It's a separate permission and is not included in 'Allow all' by default.",
          },
        },
      ],
      technicalNotes: {
        it: "Connessione via Health Connect, no OAuth. Latenza tipica 5–15 minuti dal Watch alla dashboard. Granularità: passi e BPM per minuto, sonno per fase, allenamenti per sessione. I dati restano sul telefono e vengono inviati solo al backend Supabase del tuo account FitMesh.",
        en: "Connection via Health Connect, no OAuth. Typical latency 5–15 minutes from Watch to dashboard. Granularity: steps and heart rate per minute, sleep per stage, workouts per session. Data stays on your phone and is only sent to your FitMesh account's Supabase backend.",
      },
    },
  },
  {
    slug: "wear-os",
    name: "Wear OS",
    vendor: "Google",
    category: "smartwatch",
    status: "live",
    brandColor: "#4285F4",
    initial: "W",
    tagline: {
      it: "Pixel Watch e qualsiasi Wear OS su dashboard personale. Privacy-first.",
      en: "Pixel Watch and any Wear OS on a personal dashboard. Privacy-first.",
    },
    longDesc: {
      it: "FitMesh Sync supporta tutti gli smartwatch Wear OS — Pixel Watch 1/2/3, OnePlus Watch, TicWatch, Mobvoi, Fossil Gen 6 — leggendoli via Health Connect. I dati raccolti dal sensore vanno direttamente nella tua dashboard, senza passare da Google Fit o cloud terzi.",
      en: "FitMesh Sync supports every Wear OS smartwatch — Pixel Watch 1/2/3, OnePlus Watch, TicWatch, Mobvoi, Fossil Gen 6 — reading them via Health Connect. Sensor data goes straight to your dashboard without routing through Google Fit or any third-party cloud.",
    },
    techNote: {
      it: "Health Connect è lo standard ufficiale Android per i dati di salute, sostituendo Google Fit dal 2025. FitMesh si integra senza chiavi API né OAuth.",
      en: "Health Connect is the official Android standard for health data, replacing Google Fit since 2025. FitMesh integrates without API keys or OAuth.",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: true, spo2: true }),
    faqs: [
      {
        q: { it: "Funziona col Pixel Watch?", en: "Does it work with Pixel Watch?" },
        a: {
          it: "Sì, Pixel Watch 1, 2 e 3 sono supportati nativamente. I dati passano via Fitbit (app) → Health Connect → FitMesh.",
          en: "Yes, Pixel Watch 1, 2 and 3 are natively supported. Data flows via Fitbit app → Health Connect → FitMesh.",
        },
      },
      {
        q: {
          it: "Serve Google Fit?",
          en: "Do I need Google Fit?",
        },
        a: {
          it: "No, Google Fit non è più richiesto. Health Connect è il bridge ufficiale dal 2025. Se hai ancora Google Fit installato puoi disinstallarlo.",
          en: "No, Google Fit is no longer required. Health Connect is the official bridge from 2025 onwards. If you still have Google Fit installed you can uninstall it.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare wear os dashboard",
        "pixel watch dashboard web",
        "wear os health connect",
      ],
      en: [
        "sync wear os dashboard",
        "pixel watch web dashboard",
        "wear os health connect",
      ],
    },
  },
  {
    slug: "xiaomi-mi-band",
    name: "Mi Band & Xiaomi Watch",
    vendor: "Xiaomi",
    category: "wearable",
    status: "live",
    brandColor: "#FF6900",
    initial: "X",
    tagline: {
      it: "Mi Band 7/8/9 e Xiaomi Watch S/Active via Mi Fitness + Health Connect.",
      en: "Mi Band 7/8/9 and Xiaomi Watch S/Active via Mi Fitness + Health Connect.",
    },
    longDesc: {
      it: "Se hai Mi Band 7, 8 o 9 — oppure Xiaomi Watch S1/S2/Active — FitMesh legge i tuoi dati attraverso Mi Fitness (che scrive su Health Connect dal 2024). Funziona anche con Redmi Smart Band e Amazfit (via Zepp).",
      en: "If you own Mi Band 7, 8 or 9 — or Xiaomi Watch S1/S2/Active — FitMesh reads your data through Mi Fitness (which writes to Health Connect since 2024). Also works with Redmi Smart Band and Amazfit (via Zepp).",
    },
    techNote: {
      it: "Richiede Mi Fitness ≥ versione che supporta Health Connect (controlla aggiornamento). Per Amazfit serve Zepp app con sync Health Connect abilitato nelle impostazioni.",
      en: "Requires Mi Fitness version with Health Connect support (check for updates). For Amazfit you'll need Zepp with Health Connect sync enabled in settings.",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: false, spo2: true }),
    faqs: [
      {
        q: {
          it: "Funziona con Mi Band 6 o precedenti?",
          en: "Does it work with Mi Band 6 or older?",
        },
        a: {
          it: "Solo se Mi Fitness su quel telefono supporta Health Connect. Mi Band 5 e 6 storicamente usano Mi Fit (vecchia app) che non scrive su Health Connect — meglio Mi Band 7 o superiore.",
          en: "Only if Mi Fitness on that phone supports Health Connect. Mi Band 5 and 6 historically use Mi Fit (the old app) which doesn't write to Health Connect — Mi Band 7 or newer is recommended.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "mi band dashboard",
        "xiaomi watch dashboard",
        "mi fitness health connect",
        "amazfit dashboard web",
      ],
      en: [
        "mi band dashboard",
        "xiaomi watch dashboard",
        "mi fitness health connect",
        "amazfit web dashboard",
      ],
    },
  },

  // ── Roadmap: OAuth-based integrations ───────────────────────────────────
  {
    slug: "fitbit",
    name: "Fitbit",
    vendor: "Google",
    category: "wearable",
    status: "live-basic",
    brandColor: "#00B0B9",
    initial: "F",
    tagline: {
      it: "Fitbit Charge / Inspire / Sense / Versa: funziona già oggi via Health Connect.",
      en: "Fitbit Charge / Inspire / Sense / Versa: works today via Health Connect.",
    },
    longDesc: {
      it: "Dal 2024 l'app Fitbit scrive automaticamente su Health Connect — quindi FitMesh legge già i tuoi dati Fitbit (passi, BPM, sonno totale, calorie) senza configurazioni extra. Per dati avanzati come le fasi di sonno dettagliate e gli allenamenti con GPS track stiamo costruendo l'integrazione OAuth ufficiale Fitbit Web API, prevista per Q3 2026.",
      en: "Since 2024 the Fitbit app writes to Health Connect automatically — so FitMesh already reads your Fitbit data (steps, heart rate, total sleep, calories) without extra setup. For advanced data like detailed sleep stages and workouts with GPS tracks we're building the official Fitbit Web API OAuth integration, planned for Q3 2026.",
    },
    techNote: {
      it: "Oggi: bridge automatico via app Fitbit → Health Connect. Q3 2026: OAuth 2.0 + Fitbit Web API per backfill storico 12 mesi e dati granulari.",
      en: "Today: automatic bridge via Fitbit app → Health Connect. Q3 2026: OAuth 2.0 + Fitbit Web API for 12-month historical backfill and granular data.",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: true, spo2: true }),
    viaHC: {
      oauthEta: { it: "Q3 2026", en: "Q3 2026" },
      worksNow: {
        it: [
          "Passi giornalieri (live)",
          "Frequenza cardiaca media e sample",
          "Sonno totale (durata + ora inizio/fine)",
          "Calorie attive e basali",
          "Distanza giornaliera",
        ],
        en: [
          "Daily steps (live)",
          "Average and sample heart rate",
          "Total sleep (duration + start/end time)",
          "Active and basal calories",
          "Daily distance",
        ],
      },
      oauthAdds: {
        it: [
          "Fasi di sonno dettagliate (REM/Deep/Light/Awake)",
          "GPS track completo per ogni allenamento",
          "Backfill storico fino a 12 mesi",
          "VO₂ max e Cardio Fitness Score",
          "Notifiche real-time (vs polling 15 min via HC)",
        ],
        en: [
          "Detailed sleep stages (REM/Deep/Light/Awake)",
          "Full GPS tracks for each workout",
          "Historical backfill up to 12 months",
          "VO₂ max and Cardio Fitness Score",
          "Real-time notifications (vs HC's 15-min polling)",
        ],
      },
    },
    faqs: [
      {
        q: {
          it: "Funziona già oggi senza fare nulla?",
          en: "Does it work today without any setup?",
        },
        a: {
          it: "Sì — se hai l'app Fitbit installata sul telefono Android e Health Connect abilitato, FitMesh legge automaticamente passi, BPM, sonno e calorie. Il bridge Fitbit → Health Connect è stato aggiunto da Google nel 2024 ed è attivo di default.",
          en: "Yes — if you have the Fitbit app installed on Android with Health Connect enabled, FitMesh automatically reads steps, heart rate, sleep and calories. The Fitbit → Health Connect bridge was added by Google in 2024 and is on by default.",
        },
      },
      {
        q: {
          it: "Cosa manca rispetto all'OAuth ufficiale?",
          en: "What's missing vs the official OAuth?",
        },
        a: {
          it: "Via Health Connect mancano: fasi di sonno dettagliate, GPS track allenamenti, dati storici oltre 30 giorni, VO₂ max. Questi arriveranno con l'OAuth Fitbit Web API previsto per Q3 2026.",
          en: "Via Health Connect you're missing: detailed sleep stages, workout GPS tracks, historical data beyond 30 days, VO₂ max. These will come with the Fitbit Web API OAuth planned for Q3 2026.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare fitbit health connect",
        "fitbit dashboard alternativa",
        "esportare dati fitbit",
        "fitbit a galaxy watch",
      ],
      en: [
        "sync fitbit to health connect",
        "fitbit dashboard alternative",
        "export fitbit data",
        "fitbit to galaxy watch",
      ],
    },
  },
  {
    slug: "garmin",
    name: "Garmin Connect",
    vendor: "Garmin",
    category: "fitness-platform",
    status: "live-basic",
    brandColor: "#000000",
    initial: "G",
    tagline: {
      it: "Forerunner, Fenix, Venu, Epix funzionano oggi via Garmin Connect → Health Connect.",
      en: "Forerunner, Fenix, Venu, Epix work today via Garmin Connect → Health Connect.",
    },
    longDesc: {
      it: "Dal 2024 Garmin Connect scrive su Health Connect — i tuoi dati Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct sono già leggibili da FitMesh oggi (passi, BPM, sonno, calorie, distanza, allenamenti base). Per Body Battery, Training Load, Recovery Time, Stress Score e GPS dettagliato stiamo costruendo l'integrazione OAuth ufficiale Garmin Health API, prevista per Q3 2026.",
      en: "Since 2024 Garmin Connect writes to Health Connect — your Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct data is already readable by FitMesh today (steps, heart rate, sleep, calories, distance, basic workouts). For Body Battery, Training Load, Recovery Time, Stress Score and detailed GPS we're building the official Garmin Health API OAuth integration, planned for Q3 2026.",
    },
    techNote: {
      it: "Oggi: bridge automatico via Garmin Connect app → Health Connect. Q3 2026: OAuth 2.0 + Garmin Health API per metriche performance avanzate (richiede approvazione Garmin Developer Program).",
      en: "Today: automatic bridge via Garmin Connect app → Health Connect. Q3 2026: OAuth 2.0 + Garmin Health API for advanced performance metrics (requires Garmin Developer Program approval).",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: true, spo2: true }),
    viaHC: {
      oauthEta: { it: "Q3 2026", en: "Q3 2026" },
      worksNow: {
        it: [
          "Passi giornalieri (live)",
          "Frequenza cardiaca media + zone HR",
          "Sonno totale (no fasi dettagliate)",
          "Calorie attive + basali",
          "Distanza giornaliera",
          "Allenamenti base (tipo, durata, kcal)",
        ],
        en: [
          "Daily steps (live)",
          "Average heart rate + HR zones",
          "Total sleep (no detailed stages)",
          "Active + basal calories",
          "Daily distance",
          "Basic workouts (type, duration, kcal)",
        ],
      },
      oauthAdds: {
        it: [
          "Body Battery (livello energia)",
          "Training Load + Recovery Time",
          "Stress Score notturno e diurno",
          "GPS track completo allenamenti",
          "VO₂ max stimato Garmin",
          "Pulse Ox (saturazione ossigeno)",
        ],
        en: [
          "Body Battery (energy level)",
          "Training Load + Recovery Time",
          "Day and night Stress Score",
          "Full GPS workout tracks",
          "Garmin-estimated VO₂ max",
          "Pulse Ox (blood oxygen)",
        ],
      },
    },
    faqs: [
      {
        q: {
          it: "Quali Garmin sono supportati oggi?",
          en: "Which Garmin watches are supported today?",
        },
        a: {
          it: "Tutti i Garmin compatibili con Garmin Connect su Android (dal 2018) funzionano oggi via Health Connect: Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, anche Vivosmart e Vivofit. Verifica solo che 'Sincronizza con Health Connect' sia attivo nelle impostazioni di Garmin Connect.",
          en: "Every Garmin compatible with Garmin Connect on Android (from 2018) works today via Health Connect: Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, Vivosmart and Vivofit included. Just check that 'Sync with Health Connect' is enabled in Garmin Connect settings.",
        },
      },
      {
        q: {
          it: "Vedrò Body Battery e Training Load?",
          en: "Will I see Body Battery and Training Load?",
        },
        a: {
          it: "Non oggi — Health Connect non espone queste metriche proprietarie Garmin. Saranno disponibili con l'OAuth ufficiale previsto per Q3 2026.",
          en: "Not today — Health Connect doesn't expose these proprietary Garmin metrics. They'll be available with the official OAuth planned for Q3 2026.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare garmin dashboard",
        "garmin connect alternativa",
        "esportare garmin",
        "garmin a samsung health",
      ],
      en: [
        "sync garmin dashboard",
        "garmin connect alternative",
        "export garmin data",
        "garmin to samsung health",
      ],
    },
  },
  {
    slug: "strava",
    name: "Strava",
    vendor: "Strava",
    category: "fitness-platform",
    status: "roadmap-q3",
    brandColor: "#FC4C02",
    initial: "S",
    tagline: {
      it: "Tutte le tue attività Strava in un'unica dashboard salute — Q3 2026.",
      en: "All your Strava activities in one health dashboard — Q3 2026.",
    },
    longDesc: {
      it: "L'integrazione Strava porterà tutte le tue corse, pedalate, nuotate e camminate sulla dashboard FitMesh — con GPS track, dislivello, ritmo medio, calorie e frequenza cardiaca per ogni segmento. Anche le attività manuali e gli allenamenti in palestra.",
      en: "The Strava integration will pull every run, ride, swim and walk onto your FitMesh dashboard — with GPS tracks, elevation, average pace, calories and heart rate for each segment. Manual activities and gym workouts included.",
    },
    techNote: {
      it: "OAuth 2.0 + Strava API v3. Webhook subscription per sync near-real-time. Quota gratuita 1000 attività/24h, sufficiente per uso personale.",
      en: "OAuth 2.0 + Strava API v3. Webhook subscription for near-real-time sync. Free tier 1000 activities/24h, plenty for personal use.",
    },
    dataTypes: STD_DATA_TYPES({
      sleep: false,
      vo2max: false,
      spo2: false,
    }),
    faqs: [
      {
        q: {
          it: "Importerà tutto lo storico Strava?",
          en: "Will it import all my Strava history?",
        },
        a: {
          it: "Sì — al primo OAuth puoi scegliere quante attività importare (ultimi 3/6/12 mesi o tutto lo storico). Default: 12 mesi.",
          en: "Yes — at the first OAuth you choose how many activities to import (last 3/6/12 months or full history). Default: 12 months.",
        },
      },
      {
        q: {
          it: "Sostituisce Strava o lavora insieme?",
          en: "Does it replace Strava or work alongside?",
        },
        a: {
          it: "Solo lettura — FitMesh non modifica nulla su Strava. Tu continui ad usare Strava normalmente, FitMesh aggiunge solo una vista unificata con i dati salute del watch.",
          en: "Read-only — FitMesh changes nothing on Strava. You keep using Strava normally; FitMesh just adds a unified view alongside your watch health data.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare strava dashboard",
        "strava export dati",
        "alternativa strava analytics",
      ],
      en: [
        "sync strava dashboard",
        "strava export data",
        "strava analytics alternative",
      ],
    },
  },
  {
    slug: "polar",
    name: "Polar",
    vendor: "Polar",
    category: "wearable",
    status: "live-basic",
    brandColor: "#E60000",
    initial: "P",
    tagline: {
      it: "Polar Vantage, Grit X, Ignite funzionano oggi via Polar Flow → Health Connect.",
      en: "Polar Vantage, Grit X, Ignite work today via Polar Flow → Health Connect.",
    },
    longDesc: {
      it: "Dal 2024 Polar Flow scrive su Health Connect — quindi Vantage V/M, Grit X Pro, Ignite 3, Pacer Pro e la fascia toracica H10 sono già leggibili da FitMesh oggi al livello base. Per Recovery Pro, ZoneOptimizer, Nightly Recharge e dati cardio secondo per secondo serve l'OAuth Polar Accesslink, in arrivo Q4 2026.",
      en: "Since 2024 Polar Flow writes to Health Connect — so Vantage V/M, Grit X Pro, Ignite 3, Pacer Pro and the H10 chest strap are already readable by FitMesh today at the basic level. For Recovery Pro, ZoneOptimizer, Nightly Recharge and per-second cardio data we need Polar Accesslink OAuth, coming Q4 2026.",
    },
    techNote: {
      it: "Oggi: bridge via Polar Flow → Health Connect. Q4 2026: OAuth 2.0 + Polar Accesslink API per Recovery Pro/Nightly Recharge e dati HRV intra-workout.",
      en: "Today: bridge via Polar Flow → Health Connect. Q4 2026: OAuth 2.0 + Polar Accesslink API for Recovery Pro/Nightly Recharge and intra-workout HRV data.",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: true, spo2: false }),
    viaHC: {
      oauthEta: { it: "Q4 2026", en: "Q4 2026" },
      worksNow: {
        it: [
          "Passi giornalieri",
          "Frequenza cardiaca media",
          "Sonno (durata totale)",
          "Calorie giornaliere",
          "Allenamenti base (durata, tipo)",
        ],
        en: [
          "Daily steps",
          "Average heart rate",
          "Sleep (total duration)",
          "Daily calories",
          "Basic workouts (duration, type)",
        ],
      },
      oauthAdds: {
        it: [
          "Recovery Pro (recupero post-allenamento)",
          "Nightly Recharge (recupero notte)",
          "ZoneOptimizer personalizzato",
          "HR secondo per secondo per ogni workout (H10)",
          "Sleep Plus Stages dettagliate",
        ],
        en: [
          "Recovery Pro (post-workout recovery)",
          "Nightly Recharge (overnight recovery)",
          "Personalized ZoneOptimizer",
          "Per-second HR for each workout (H10)",
          "Detailed Sleep Plus Stages",
        ],
      },
    },
    faqs: [
      {
        q: {
          it: "Funziona oggi senza configurazione?",
          en: "Does it work today without setup?",
        },
        a: {
          it: "Sì, se hai Polar Flow installato su Android. Apri Polar Flow → Impostazioni → Health Connect → attiva la sincronizzazione. Da quel momento FitMesh leggerà automaticamente passi, BPM, sonno e calorie.",
          en: "Yes, if you have Polar Flow installed on Android. Open Polar Flow → Settings → Health Connect → enable sync. From that point on FitMesh will automatically read steps, heart rate, sleep and calories.",
        },
      },
      {
        q: {
          it: "Funziona con la fascia toracica H10?",
          en: "Does it work with the H10 chest strap?",
        },
        a: {
          it: "Sì, la H10 abbinata a Polar Flow scrive su Health Connect i dati base degli allenamenti. Il battito secondo per secondo intra-workout arriverà con l'OAuth Accesslink.",
          en: "Yes — H10 paired with Polar Flow writes basic workout data to Health Connect. Per-second intra-workout heart rate will come with the Accesslink OAuth.",
        },
      },
    ],
    seoKeywords: {
      it: ["sincronizzare polar dashboard", "polar flow alternativa", "polar health connect"],
      en: ["sync polar dashboard", "polar flow alternative", "polar health connect"],
    },
  },
  {
    slug: "oura",
    name: "Oura Ring",
    vendor: "Oura",
    category: "wearable",
    status: "roadmap-q4",
    brandColor: "#8E8E93",
    initial: "O",
    tagline: {
      it: "Oura Ring Gen 3 e Gen 4: sonno e readiness su dashboard unificata — Q4 2026.",
      en: "Oura Ring Gen 3 and Gen 4: sleep and readiness on a unified dashboard — Q4 2026.",
    },
    longDesc: {
      it: "L'integrazione Oura porterà i dati di sonno avanzati, Readiness Score, Activity Score e HRV notturno del tuo Oura Ring sulla dashboard FitMesh — utile soprattutto se combini Oura (sonno) con un Galaxy Watch o Garmin (attività).",
      en: "The Oura integration will bring advanced sleep data, Readiness Score, Activity Score and overnight HRV from your Oura Ring onto FitMesh — particularly useful if you combine Oura (sleep) with a Galaxy Watch or Garmin (activity).",
    },
    techNote: {
      it: "OAuth 2.0 + Oura Cloud API v2. Polling 30 min. Backfill 12 mesi al primo connect.",
      en: "OAuth 2.0 + Oura Cloud API v2. 30-min polling. 12-month backfill on first connect.",
    },
    dataTypes: STD_DATA_TYPES({
      steps: true,
      distance: false,
      workouts: false,
      vo2max: false,
      spo2: true,
    }),
    faqs: [],
    seoKeywords: {
      it: ["sincronizzare oura ring dashboard", "oura ring export dati"],
      en: ["sync oura ring dashboard", "oura ring export data"],
    },
  },
  {
    slug: "withings",
    name: "Withings",
    vendor: "Withings",
    category: "health-platform",
    status: "live-basic",
    brandColor: "#00C2A8",
    initial: "W",
    tagline: {
      it: "Bilance Withings, ScanWatch, Body+ funzionano già via Health Mate → Health Connect.",
      en: "Withings scales, ScanWatch, Body+ already work via Health Mate → Health Connect.",
    },
    longDesc: {
      it: "Health Mate scrive su Health Connect dal 2024 — quindi peso, composizione corporea (Body+/Body Comp), passi (ScanWatch), pressione arteriosa (BPM Connect) sono già leggibili da FitMesh oggi. Per ECG dettagliato, rilevamento FA e dati Sleep Mat granulari serve l'OAuth Withings API v2, in arrivo Q4 2026.",
      en: "Health Mate writes to Health Connect since 2024 — so weight, body composition (Body+/Body Comp), steps (ScanWatch), blood pressure (BPM Connect) are already readable by FitMesh today. For detailed ECG, AFib detection and granular Sleep Mat data we need Withings API v2 OAuth, coming Q4 2026.",
    },
    techNote: {
      it: "Oggi: bridge via Health Mate → Health Connect. Q4 2026: OAuth 2.0 + Withings API v2 con webhook su nuove misure.",
      en: "Today: bridge via Health Mate → Health Connect. Q4 2026: OAuth 2.0 + Withings API v2 with new-measurement webhooks.",
    },
    dataTypes: STD_DATA_TYPES({
      steps: true,
      distance: false,
      workouts: false,
      vo2max: false,
      spo2: true,
    }),
    viaHC: {
      oauthEta: { it: "Q4 2026", en: "Q4 2026" },
      worksNow: {
        it: [
          "Peso (Body+, Body Comp, Body Cardio)",
          "% grasso corporeo e massa muscolare",
          "Passi giornalieri (ScanWatch)",
          "Frequenza cardiaca",
          "Pressione arteriosa (BPM Connect)",
          "Sonno totale (Sleep Mat)",
        ],
        en: [
          "Weight (Body+, Body Comp, Body Cardio)",
          "Body fat % and muscle mass",
          "Daily steps (ScanWatch)",
          "Heart rate",
          "Blood pressure (BPM Connect)",
          "Total sleep (Sleep Mat)",
        ],
      },
      oauthAdds: {
        it: [
          "ECG dettagliato + rilevamento FA",
          "Sleep Mat con fasi e respirazione",
          "Pulse Wave Velocity (rigidità arteriosa)",
          "Trend lungo periodo composizione corporea",
        ],
        en: [
          "Detailed ECG + AFib detection",
          "Sleep Mat with stages and breathing",
          "Pulse Wave Velocity (arterial stiffness)",
          "Long-term body composition trends",
        ],
      },
    },
    faqs: [
      {
        q: {
          it: "Posso pesare e vedere il peso in dashboard?",
          en: "Can I weigh in and see weight on the dashboard?",
        },
        a: {
          it: "Sì — Body+ e Body Comp scrivono peso, % grasso, % massa muscolare su Health Connect. FitMesh li mostra automaticamente nel pannello composizione corporea.",
          en: "Yes — Body+ and Body Comp write weight, body fat % and muscle mass to Health Connect. FitMesh shows them automatically in the body composition panel.",
        },
      },
    ],
    seoKeywords: {
      it: ["sincronizzare withings dashboard", "withings health connect", "withings body composition android"],
      en: ["sync withings dashboard", "withings health connect", "withings body composition android"],
    },
  },
];

export const PROVIDERS_BY_SLUG: Record<string, Provider> = Object.fromEntries(
  PROVIDERS.map((p) => [p.slug, p]),
);

export const PROVIDER_SLUGS: string[] = PROVIDERS.map((p) => p.slug);

export function statusLabel(
  status: ProviderStatus,
  lc: Locale,
): { text: string; color: string } {
  const map: Record<ProviderStatus, { it: string; en: string; color: string }> = {
    live: { it: "Disponibile ora", en: "Available now", color: "#31E981" },
    "live-basic": {
      it: "Funziona via Health Connect",
      en: "Works via Health Connect",
      color: "#21E6C1",
    },
    beta: { it: "Beta", en: "Beta", color: "#FFB547" },
    "roadmap-q3": { it: "In arrivo Q3 2026", en: "Coming Q3 2026", color: "#38BDF8" },
    "roadmap-q4": { it: "In arrivo Q4 2026", en: "Coming Q4 2026", color: "#A78BFA" },
  };
  const entry = map[status];
  return { text: entry[lc], color: entry.color };
}

export function categoryLabel(
  category: ProviderCategory,
  lc: Locale,
): string {
  const map: Record<ProviderCategory, { it: string; en: string }> = {
    smartwatch: { it: "Smartwatch", en: "Smartwatch" },
    "fitness-platform": {
      it: "Piattaforma fitness",
      en: "Fitness platform",
    },
    "health-platform": {
      it: "Piattaforma salute",
      en: "Health platform",
    },
    wearable: { it: "Wearable", en: "Wearable" },
  };
  return map[category][lc];
}
