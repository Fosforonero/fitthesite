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
  | "roadmap-q4" // Pianificato Q4 2026 (NO path HC, serve OAuth)
  | "coming-soon"; // In arrivo (data TBD — es. BLE diretto, feature sperimentali)

export type ProviderCategory =
  | "smartwatch"
  | "fitness-platform"
  | "health-platform"
  | "wearable"
  | "phone-only";

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
  /**
   * Slug di articoli blog correlati (renderizzati come card "Approfondisci"
   * in fondo alla landing). Internal linking SEO: distribuisce link equity
   * dalle landing /sync ai cornerstone /blog.
   */
  relatedBlogSlugs?: string[];
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
    relatedBlogSlugs: ["backup-galaxy-watch-pc", "guida-sync-wearable-2026"],
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
    slug: "pixel-watch",
    name: "Pixel Watch",
    vendor: "Google",
    category: "smartwatch",
    status: "live",
    brandColor: "#4285F4",
    initial: "P",
    tagline: {
      it: "Pixel Watch 1/2/3 su dashboard personale via Fitbit + Health Connect.",
      en: "Pixel Watch 1/2/3 on a personal dashboard via Fitbit + Health Connect.",
    },
    longDesc: {
      it: "Il Pixel Watch usa l'app Fitbit come backend ufficiale: i dati di passi, BPM, sonno e calorie passano dal Watch a Fitbit, da Fitbit a Health Connect, e da lì FitMesh li legge automaticamente. Funziona con Pixel Watch 1, 2 e 3, senza OAuth, senza chiavi API, in un setup di 5 minuti.",
      en: "The Pixel Watch uses the Fitbit app as its official backend: steps, heart rate, sleep and calories flow from the Watch to Fitbit, from Fitbit to Health Connect, and from there FitMesh reads them automatically. Works with Pixel Watch 1, 2 and 3, no OAuth, no API keys, 5-minute setup.",
    },
    techNote: {
      it: "Catena di sync: Pixel Watch → app Fitbit → Health Connect → FitMesh. Latenza tipica 15–30 minuti. Le fasi di sonno REM/Deep/Light dettagliate richiedono l'OAuth Fitbit Web API (Q3 2026).",
      en: "Sync chain: Pixel Watch → Fitbit app → Health Connect → FitMesh. Typical latency 15–30 minutes. Detailed REM/Deep/Light sleep stages require Fitbit Web API OAuth (Q3 2026).",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: false, spo2: true }),
    faqs: [
      {
        q: {
          it: "Devo installare l'app Fitbit?",
          en: "Do I need the Fitbit app?",
        },
        a: {
          it: "Sì — il Pixel Watch usa Fitbit come app companion ufficiale. Senza Fitbit installato i dati non vengono sincronizzati. Una volta connessa Fitbit a Health Connect, FitMesh legge tutto automaticamente.",
          en: "Yes — Pixel Watch uses Fitbit as the official companion app. Without Fitbit installed data isn't synced. Once Fitbit is connected to Health Connect, FitMesh reads everything automatically.",
        },
      },
      {
        q: {
          it: "Perché non vedo le fasi del sonno (REM/Deep/Light)?",
          en: "Why can't I see sleep stages (REM/Deep/Light)?",
        },
        a: {
          it: "Via Health Connect Fitbit espone il sonno solo come durata totale. Le fasi REM/Deep/Light/Awake arriveranno con l'OAuth Fitbit Web API previsto per Q3 2026.",
          en: "Via Health Connect Fitbit only exposes sleep as total duration. REM/Deep/Light/Awake stages will arrive with the planned Fitbit Web API OAuth (Q3 2026).",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare pixel watch dashboard",
        "pixel watch health connect",
        "pixel watch alternativa fitbit",
        "esportare dati pixel watch",
      ],
      en: [
        "sync pixel watch dashboard",
        "pixel watch health connect",
        "pixel watch fitbit alternative",
        "export pixel watch data",
      ],
    },
    setupGuide: {
      steps: {
        it: [
          "Installa **Health Connect** dal Play Store (preinstallato su Android 14+).",
          "Installa o aggiorna l'app **Fitbit** sul telefono Android associato al Pixel Watch (il Pixel Watch usa Fitbit come backend).",
          "Apri Fitbit → tab **You** (in basso a destra) → **Health Connect** → tocca **Connetti** e autorizza la scrittura di passi, BPM, sonno, calorie, distanza, allenamenti.",
          "Installa **FitMesh Sync** dal Play Store e accedi con Google.",
          "Concedi i permessi Health Connect richiesti da FitMesh al primo avvio, poi premi **Sincronizza ora**.",
        ],
        en: [
          "Install **Health Connect** from the Play Store (preinstalled on Android 14+).",
          "Install or update the **Fitbit app** on the Android phone paired with your Pixel Watch (Pixel Watch uses Fitbit as its backend).",
          "Open Fitbit → **You** tab (bottom right) → **Health Connect** → tap **Connect** and authorize write access for steps, heart rate, sleep, calories, distance, workouts.",
          "Install **FitMesh Sync** from the Play Store and sign in with Google.",
          "Grant the Health Connect permissions FitMesh requests on first launch, then tap **Sync now**.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri",
          "Frequenza cardiaca (media, riposo, sample)",
          "Sonno (durata totale e ora inizio/fine)",
          "Calorie attive e basali",
          "Distanza",
          "Allenamenti (tipo, durata, kcal)",
          "SpO₂ notturno (se attivato nel Pixel Watch)",
        ],
        en: [
          "Daily steps",
          "Heart rate (average, resting, samples)",
          "Sleep (total duration and start/end time)",
          "Active and basal calories",
          "Distance",
          "Workouts (type, duration, kcal)",
          "Overnight SpO₂ (if enabled on the Pixel Watch)",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Non vedo i miei dati su FitMesh",
            en: "I don't see my data in FitMesh",
          },
          a: {
            it: "Verifica che la connessione Fitbit → Health Connect sia attiva: Fitbit → You → Health Connect → stato 'Connesso'. Se non lo è, tocca 'Connetti' e riautorizza.",
            en: "Confirm that the Fitbit → Health Connect connection is active: Fitbit → You → Health Connect → status 'Connected'. If not, tap 'Connect' and re-authorize.",
          },
        },
        {
          q: {
            it: "I dati arrivano in ritardo",
            en: "Data arrives late",
          },
          a: {
            it: "Comportamento normale: la sync Pixel Watch → Fitbit → Health Connect ha un delay tipico di 15–30 minuti. Per accelerare apri Fitbit, refresh manuale (pull-to-refresh), poi 'Sincronizza ora' in FitMesh.",
            en: "Expected behavior: Pixel Watch → Fitbit → Health Connect typically has a 15–30 minute delay. To speed it up open Fitbit, pull down to refresh, then tap 'Sync now' in FitMesh.",
          },
        },
        {
          q: {
            it: "Vedo passi e BPM ma non le fasi di sonno",
            en: "I see steps and heart rate but no sleep stages",
          },
          a: {
            it: "Via Health Connect Fitbit espone il sonno come durata totale, non come fasi REM/Deep/Light. Le fasi arriveranno con l'OAuth Fitbit Web API previsto in roadmap.",
            en: "Via Health Connect Fitbit exposes sleep as total duration, not REM/Deep/Light stages. Stages will arrive with the planned Fitbit Web API OAuth integration.",
          },
        },
      ],
      technicalNotes: {
        it: "Catena di sync: Pixel Watch → Fitbit app → Health Connect → FitMesh. No OAuth, no chiavi API. Latenza tipica 15–30 minuti. Granularità: passi giornalieri, BPM per minuto, sonno per sessione. I dati restano sul telefono e vengono inviati solo al backend Supabase del tuo account FitMesh.",
        en: "Sync chain: Pixel Watch → Fitbit app → Health Connect → FitMesh. No OAuth, no API keys. Typical latency 15–30 minutes. Granularity: daily steps, heart rate per minute, sleep per session. Data stays on your phone and is only sent to your FitMesh account's Supabase backend.",
      },
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
    relatedBlogSlugs: ["vedere-dati-wearable-browser-pc", "guida-sync-wearable-2026"],
  },
  {
    slug: "oneplus-health",
    name: "OnePlus Health",
    vendor: "OnePlus",
    category: "smartwatch",
    status: "live",
    brandColor: "#EB0028",
    initial: "O",
    tagline: {
      it: "OnePlus Watch e OnePlus Band via OHealth + Health Connect.",
      en: "OnePlus Watch and OnePlus Band via OHealth + Health Connect.",
    },
    longDesc: {
      it: "OHealth (l'app companion ufficiale di OnePlus Watch e OnePlus Band) scrive su Health Connect: passi, BPM, sonno, calorie e allenamenti diventano leggibili da FitMesh senza OAuth e senza chiavi API. Funziona sia con OnePlus Watch 2/2R sia con OnePlus Band — confermato da founder beta su OnePlus Watch nel maggio 2026.",
      en: "OHealth (the official companion app for OnePlus Watch and OnePlus Band) writes to Health Connect: steps, heart rate, sleep, calories and workouts become readable by FitMesh without OAuth or API keys. Works with OnePlus Watch 2/2R and OnePlus Band — confirmed by a beta founder on OnePlus Watch in May 2026.",
    },
    techNote: {
      it: "Catena di sync: OnePlus Watch → OHealth → Health Connect (chiamata 'Connessione salute' in italiano) → FitMesh. Latenza tipica 5–15 minuti. La sync di sonno e BPM con granularità per minuto richiede OHealth aggiornata all'ultima versione.",
      en: "Sync chain: OnePlus Watch → OHealth → Health Connect → FitMesh. Typical latency 5–15 minutes. Per-minute sleep and heart rate granularity requires the latest OHealth version.",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: false, spo2: true }),
    faqs: [
      {
        q: {
          it: "OHealth supporta davvero Health Connect?",
          en: "Does OHealth really support Health Connect?",
        },
        a: {
          it: "Sì, dal 2024 OHealth integra la 'Connessione salute' di Android. Devi solo aprire OHealth → Profilo → Connessione salute (Health Connect) e autorizzare la scrittura. Dopo, FitMesh legge tutto in automatico.",
          en: "Yes, since 2024 OHealth integrates Android's Health Connect. Just open OHealth → Profile → Health Connect and authorize write access. After that, FitMesh reads everything automatically.",
        },
      },
      {
        q: {
          it: "Funziona anche con OnePlus Band?",
          en: "Does it work with OnePlus Band too?",
        },
        a: {
          it: "Sì, OnePlus Band sincronizza con OHealth come OnePlus Watch. I dati di passi, sonno e BPM passano da OHealth a Health Connect e da lì a FitMesh.",
          en: "Yes, OnePlus Band syncs with OHealth just like OnePlus Watch. Steps, sleep and heart rate flow from OHealth to Health Connect and then to FitMesh.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare oneplus watch dashboard",
        "ohealth health connect",
        "oneplus band dashboard",
        "esportare dati oneplus watch",
      ],
      en: [
        "sync oneplus watch dashboard",
        "ohealth health connect",
        "oneplus band dashboard",
        "export oneplus watch data",
      ],
    },
    setupGuide: {
      steps: {
        it: [
          "Installa o aggiorna **OHealth** dal Play Store (l'app companion ufficiale del OnePlus Watch/Band).",
          "Installa **Health Connect** dal Play Store (preinstallato su Android 14+).",
          "Apri **OHealth** → tab **Profilo** (in basso a destra) → **Connessione salute** (Health Connect) → tocca **Connetti** e autorizza la scrittura di passi, BPM, sonno, calorie, allenamenti.",
          "Installa **FitMesh Sync** dal Play Store e accedi con Google o email.",
          "Concedi i permessi Health Connect richiesti da FitMesh al primo avvio, poi premi **Sincronizza ora**.",
        ],
        en: [
          "Install or update **OHealth** from the Play Store (the official OnePlus Watch/Band companion app).",
          "Install **Health Connect** from the Play Store (preinstalled on Android 14+).",
          "Open **OHealth** → **Profile** tab (bottom right) → **Health Connect** → tap **Connect** and authorize write access for steps, heart rate, sleep, calories, workouts.",
          "Install **FitMesh Sync** from the Play Store and sign in with Google or email.",
          "Grant the Health Connect permissions FitMesh requests on first launch, then tap **Sync now**.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri",
          "Frequenza cardiaca (media, riposo, sample per minuto)",
          "Sonno (durata totale e ora inizio/fine)",
          "Calorie attive e basali",
          "Distanza",
          "Allenamenti (tipo, durata, kcal)",
          "SpO₂ notturno (se attivato su OnePlus Watch)",
        ],
        en: [
          "Daily steps",
          "Heart rate (average, resting, per-minute samples)",
          "Sleep (total duration and start/end time)",
          "Active and basal calories",
          "Distance",
          "Workouts (type, duration, kcal)",
          "Overnight SpO₂ (if enabled on OnePlus Watch)",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Non vedo dati su FitMesh dopo aver collegato OHealth",
            en: "I don't see data in FitMesh after connecting OHealth",
          },
          a: {
            it: "Apri OHealth → Profilo → Connessione salute e verifica che lo stato sia 'Connesso'. Se no, riconnetti e autorizza tutti i permessi. Poi forza una sync manuale in OHealth (pull-to-refresh sulla home).",
            en: "Open OHealth → Profile → Health Connect and check that the status is 'Connected'. If not, reconnect and authorize all permissions. Then force a manual sync in OHealth (pull-to-refresh on home).",
          },
        },
        {
          q: {
            it: "Vedo passi ma non sonno o BPM",
            en: "I see steps but no sleep or heart rate",
          },
          a: {
            it: "Sonno e BPM richiedono permessi separati in Health Connect. Vai in Health Connect (impostazioni Android → App → Connessione salute) → Permessi → OHealth → spunta sonno e frequenza cardiaca.",
            en: "Sleep and heart rate require separate Health Connect permissions. Go to Health Connect (Android Settings → Apps → Health Connect) → Permissions → OHealth → enable Sleep and Heart rate.",
          },
        },
        {
          q: {
            it: "Latenza alta tra Watch e FitMesh",
            en: "High latency between Watch and FitMesh",
          },
          a: {
            it: "Tipica catena OnePlus Watch → OHealth → Health Connect richiede 5–15 minuti. Per accelerare apri OHealth, refresh manuale, poi 'Sincronizza ora' in FitMesh.",
            en: "Typical chain OnePlus Watch → OHealth → Health Connect takes 5–15 minutes. To speed it up open OHealth, manual refresh, then 'Sync now' in FitMesh.",
          },
        },
      ],
      technicalNotes: {
        it: "Catena di sync: OnePlus Watch/Band → OHealth → Health Connect → FitMesh. No OAuth, no chiavi API. Latenza tipica 5–15 minuti. Granularità: passi giornalieri, BPM per minuto, sonno per sessione. Confermato funzionante su OnePlus Watch 2 in maggio 2026 (founder beta). I dati restano sul telefono e vengono inviati solo al backend Supabase del tuo account FitMesh.",
        en: "Sync chain: OnePlus Watch/Band → OHealth → Health Connect → FitMesh. No OAuth, no API keys. Typical latency 5–15 minutes. Granularity: daily steps, per-minute heart rate, per-session sleep. Confirmed working on OnePlus Watch 2 in May 2026 (beta founder). Data stays on your phone and is only sent to your FitMesh account's Supabase backend.",
      },
    },
    relatedBlogSlugs: ["guida-sync-wearable-2026", "vedere-dati-wearable-browser-pc"],
  },
  {
    slug: "amazfit-zepp",
    name: "Amazfit & Zepp",
    vendor: "Zepp Health (ex Huami)",
    category: "wearable",
    status: "live",
    brandColor: "#00B956",
    initial: "Z",
    tagline: {
      it: "Amazfit Bip 5/GTS 4/GTR 4/T-Rex Ultra via Zepp + Health Connect.",
      en: "Amazfit Bip 5/GTS 4/GTR 4/T-Rex Ultra via Zepp + Health Connect.",
    },
    longDesc: {
      it: "L'app Zepp (ex Amazfit, ex Mi Fit prima ancora) scrive su Health Connect dal 2024 per la maggior parte dei modelli moderni. Funziona out-of-the-box con Bip 5, GTS 4 Mini/4, GTR 4 Mini/4, T-Rex Ultra, Cheetah Pro: passi, BPM, sonno, calorie e allenamenti diventano leggibili da FitMesh senza OAuth e senza chiavi API. I modelli più vecchi (Bip 3, GTR 3, GTS 2) NON supportano Health Connect nativamente — restano legati alla loro versione storica dell'app Zepp e per ora non hanno path di sync supportato.",
      en: "The Zepp app (formerly Amazfit, formerly Mi Fit before that) writes to Health Connect since 2024 for most modern models. Works out-of-the-box with Bip 5, GTS 4 Mini/4, GTR 4 Mini/4, T-Rex Ultra, Cheetah Pro: steps, heart rate, sleep, calories and workouts become readable by FitMesh without OAuth or API keys. Older models (Bip 3, GTR 3, GTS 2) do NOT support Health Connect natively — they remain tied to their historical Zepp app version and currently have no supported sync path.",
    },
    techNote: {
      it: "Catena di sync: Amazfit (modello moderno) → app Zepp → Health Connect (chiamata 'Connessione salute' in italiano) → FitMesh. Latenza tipica 15–30 minuti. Per sonno e BPM con granularità per minuto serve Zepp aggiornata all'ultima versione e Android 10+.",
      en: "Sync chain: Amazfit (modern model) → Zepp app → Health Connect → FitMesh. Typical latency 15–30 minutes. Per-minute sleep and heart rate granularity requires the latest Zepp app version and Android 10+.",
    },
    dataTypes: STD_DATA_TYPES({ spo2: true, vo2max: false }),
    faqs: [
      {
        q: {
          it: "Funziona con Bip 3?",
          en: "Does it work with Bip 3?",
        },
        a: {
          it: "No. Amazfit Bip 3 (e altri modelli pre-2023 come Bip U, GTR 3, GTS 2) restano legati a versioni più vecchie dell'app Zepp che non scrivono su Health Connect. Niente Health Connect = niente FitMesh. Soluzione: passa a un modello supportato (Bip 5 in su) oppure attendi un eventuale OAuth Zepp ufficiale (non in roadmap a oggi).",
          en: "No. The Amazfit Bip 3 (and other pre-2023 models like Bip U, GTR 3, GTS 2) are tied to older Zepp app versions that do not write to Health Connect. No Health Connect = no FitMesh. Workaround: switch to a supported model (Bip 5 and newer) or wait for an eventual official Zepp OAuth (not on the roadmap today).",
        },
      },
      {
        q: {
          it: "Differenze tra Amazfit moderni e vecchi",
          en: "Differences between modern and old Amazfit",
        },
        a: {
          it: "Modelli moderni (Bip 5, GTS 4 Mini/4, GTR 4 Mini/4, T-Rex Ultra, Cheetah Pro, dal 2023 in poi) usano la nuova app Zepp con bridge Health Connect: FitMesh legge tutto in automatico. Modelli pre-2023 (Bip 3, GTR 3, GTS 2, ecc.) usano un fork separato dell'app e non hanno bridge HC: per ora non sono supportati.",
          en: "Modern models (Bip 5, GTS 4 Mini/4, GTR 4 Mini/4, T-Rex Ultra, Cheetah Pro, from 2023 onward) use the new Zepp app with Health Connect bridge: FitMesh reads everything automatically. Pre-2023 models (Bip 3, GTR 3, GTS 2, etc.) use a separate fork of the app with no HC bridge: not supported for now.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "amazfit dashboard web",
        "zepp health connect",
        "sincronizzare amazfit android",
        "amazfit gtr 4 dashboard",
      ],
      en: [
        "amazfit web dashboard",
        "zepp health connect",
        "sync amazfit android",
        "amazfit gtr 4 dashboard",
      ],
    },
    setupGuide: {
      steps: {
        it: [
          "Verifica che il tuo Amazfit sia un modello moderno: **Bip 5, GTS 4 Mini/4, GTR 4 Mini/4, T-Rex Ultra, Cheetah Pro** o più recente. I modelli pre-2023 (Bip 3, GTR 3, GTS 2) NON sono supportati.",
          "Installa o aggiorna **Zepp** dal Play Store (l'app companion ufficiale Amazfit, ex Mi Fit).",
          "Installa **Health Connect** dal Play Store (preinstallato su Android 14+).",
          "Apri **Zepp** → tab **Profilo** in basso a destra → **Impostazioni** → **App di terze parti** (o **Servizi salute**) → **Health Connect** / **Connessione salute** → tocca **Connetti** e autorizza la scrittura di passi, BPM, sonno, calorie, allenamenti.",
          "Installa **FitMesh Sync** dal Play Store, accedi con Google o email, concedi i permessi Health Connect e premi **Sincronizza ora**.",
        ],
        en: [
          "Check that your Amazfit is a modern model: **Bip 5, GTS 4 Mini/4, GTR 4 Mini/4, T-Rex Ultra, Cheetah Pro** or newer. Pre-2023 models (Bip 3, GTR 3, GTS 2) are NOT supported.",
          "Install or update **Zepp** from the Play Store (the official Amazfit companion app, formerly Mi Fit).",
          "Install **Health Connect** from the Play Store (preinstalled on Android 14+).",
          "Open **Zepp** → **Profile** tab (bottom right) → **Settings** → **Third-party apps** (or **Health services**) → **Health Connect** → tap **Connect** and authorize write access for steps, heart rate, sleep, calories, workouts.",
          "Install **FitMesh Sync** from the Play Store, sign in with Google or email, grant the Health Connect permissions and tap **Sync now**.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri",
          "Frequenza cardiaca (media, riposo, sample per minuto)",
          "Sonno (durata totale e ora inizio/fine)",
          "Calorie attive e basali",
          "Distanza",
          "Allenamenti (tipo, durata, kcal)",
          "SpO₂ notturno (se supportato dal modello)",
        ],
        en: [
          "Daily steps",
          "Heart rate (average, resting, per-minute samples)",
          "Sleep (total duration and start/end time)",
          "Active and basal calories",
          "Distance",
          "Workouts (type, duration, kcal)",
          "Overnight SpO₂ (if supported by the model)",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Ho un Bip 3 / GTR 3 / GTS 2: non vedo l'opzione Health Connect in Zepp",
            en: "I have a Bip 3 / GTR 3 / GTS 2: I don't see the Health Connect option in Zepp",
          },
          a: {
            it: "Corretto: i modelli Amazfit pre-2023 usano una versione storica dell'app Zepp senza bridge Health Connect. Non c'è workaround supportato oggi. Per portare quei dati su FitMesh serve passare a un modello supportato oppure attendere un eventuale OAuth ufficiale Zepp (non in roadmap).",
            en: "Correct: pre-2023 Amazfit models use a legacy Zepp app version with no Health Connect bridge. No supported workaround today. To bring that data into FitMesh you'd need to switch to a supported model or wait for an eventual official Zepp OAuth (not on the roadmap).",
          },
        },
        {
          q: {
            it: "Connessione Zepp ↔ Health Connect attiva ma non vedo dati su FitMesh",
            en: "Zepp ↔ Health Connect connection is active but I see no data in FitMesh",
          },
          a: {
            it: "Apri Zepp e forza un refresh manuale (pull-to-refresh sulla home) — Zepp polla il braccialetto via Bluetooth e può tardare. Poi in FitMesh premi 'Sincronizza ora'. Verifica anche in Health Connect (Impostazioni Android → App → Connessione salute) che Zepp abbia i permessi di scrittura per i tipi che ti interessano (passi, sonno, BPM).",
            en: "Open Zepp and force a manual refresh (pull-to-refresh on home) — Zepp polls the wearable over Bluetooth and can lag. Then tap 'Sync now' in FitMesh. Also check in Health Connect (Android Settings → Apps → Health Connect) that Zepp has write permission for the metrics you care about (steps, sleep, heart rate).",
          },
        },
        {
          q: {
            it: "Sonno frammentato o duplicato dopo il sync",
            en: "Fragmented or duplicated sleep after sync",
          },
          a: {
            it: "Zepp scrive ogni sessione di sonno come segmento separato — se hai più sveglie nottturne possono apparire più segmenti. FitMesh applica deduplica per tuple `(start, end, stage)` esatte. Se vedi ancora duplicati controlla che non sia attivo un altro tracker (Galaxy Watch, Mi Band) sullo stesso giorno: in tal caso usa 'Risoluzione conflitti dati' nelle impostazioni FitMesh per scegliere la sorgente prioritaria.",
            en: "Zepp writes each sleep session as a separate segment — multiple night wake-ups may surface as multiple segments. FitMesh dedupes exact `(start, end, stage)` tuples. If duplicates persist, check that no other tracker (Galaxy Watch, Mi Band) is active on the same day: if so, use 'Data conflict resolution' in FitMesh settings to pick the priority source.",
          },
        },
      ],
      technicalNotes: {
        it: "Catena di sync: Amazfit (modello moderno) → app Zepp → Health Connect → FitMesh. No OAuth, no chiavi API. Latenza tipica 15–30 minuti. Granularità: passi giornalieri, BPM per minuto, sonno per sessione, allenamenti come record discreti. I modelli pre-2023 (Bip 3, GTR 3, GTS 2) restano fuori scope perché la loro versione storica dell'app Zepp non scrive su Health Connect. I dati restano sul telefono e vengono inviati solo al backend Supabase del tuo account FitMesh.",
        en: "Sync chain: Amazfit (modern model) → Zepp app → Health Connect → FitMesh. No OAuth, no API keys. Typical latency 15–30 minutes. Granularity: daily steps, per-minute heart rate, per-session sleep, workouts as discrete records. Pre-2023 models (Bip 3, GTR 3, GTS 2) are out of scope because their legacy Zepp app version does not write to Health Connect. Data stays on your phone and is only sent to your FitMesh account's Supabase backend.",
      },
    },
    relatedBlogSlugs: ["guida-sync-wearable-2026", "vedere-dati-wearable-browser-pc"],
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
    setupGuide: {
      steps: {
        it: [
          "Verifica i requisiti: **Android 10 o superiore** e app **Fitbit versione 4.10** o superiore.",
          "Installa **Health Connect** dal Play Store (preinstallato su Android 14+).",
          "Apri l'app Fitbit → tab **You** in basso a destra → **Health Connect** → tocca **Connetti** e autorizza la scrittura.",
          "Installa **FitMesh Sync** dal Play Store e accedi con Google.",
          "Concedi a FitMesh i permessi Health Connect richiesti, poi premi **Sincronizza ora**.",
        ],
        en: [
          "Check requirements: **Android 10 or higher** and **Fitbit app version 4.10** or higher.",
          "Install **Health Connect** from the Play Store (preinstalled on Android 14+).",
          "Open the Fitbit app → **You** tab (bottom right) → **Health Connect** → tap **Connect** and authorize write access.",
          "Install **FitMesh Sync** from the Play Store and sign in with Google.",
          "Grant FitMesh the requested Health Connect permissions, then tap **Sync now**.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri",
          "Frequenza cardiaca (media, riposo, sample)",
          "Sonno (durata totale, ora inizio/fine)",
          "Calorie attive e basali",
          "Distanza",
          "Allenamenti base (tipo, durata, kcal, BPM medio)",
          "SpO₂ notturno (se supportato dal device)",
        ],
        en: [
          "Daily steps",
          "Heart rate (average, resting, samples)",
          "Sleep (total duration, start/end time)",
          "Active and basal calories",
          "Distance",
          "Basic workouts (type, duration, kcal, average BPM)",
          "Overnight SpO₂ (when supported by the device)",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Non vedo i miei dati su FitMesh",
            en: "I don't see my data in FitMesh",
          },
          a: {
            it: "Il bridge Fitbit → Health Connect non è automatico al 100%. Apri Fitbit → You → Health Connect e verifica che lo stato sia 'Connesso'. Se non lo è, tocca 'Connetti' e riautorizza i permessi.",
            en: "The Fitbit → Health Connect bridge isn't fully automatic. Open Fitbit → You → Health Connect and check that status reads 'Connected'. If not, tap 'Connect' and re-authorize permissions.",
          },
        },
        {
          q: {
            it: "I dati arrivano in ritardo",
            en: "Data arrives late",
          },
          a: {
            it: "L'app Fitbit fa polling sul cloud ogni 15 minuti. Per forzare un sync scorri verso il basso sulla home Fitbit per il refresh manuale, poi premi 'Sincronizza ora' su FitMesh.",
            en: "The Fitbit app polls the cloud every 15 minutes. To force a sync pull down on the Fitbit home for manual refresh, then tap 'Sync now' in FitMesh.",
          },
        },
        {
          q: {
            it: "Vedo passi e BPM ma non le fasi di sonno",
            en: "I see steps and heart rate but no sleep stages",
          },
          a: {
            it: "Via Health Connect Fitbit espone solo la durata totale del sonno, non le fasi REM/Deep/Light. Le fasi dettagliate arriveranno con l'OAuth Fitbit Web API previsto per Q3 2026.",
            en: "Via Health Connect Fitbit only exposes total sleep duration, not REM/Deep/Light stages. Detailed stages will arrive with the planned Fitbit Web API OAuth (Q3 2026).",
          },
        },
      ],
      technicalNotes: {
        it: "Catena di sync: Fitbit device → app Fitbit → Health Connect → FitMesh. Latenza tipica 15–30 minuti. Per backfill storico oltre 30 giorni serve l'OAuth Fitbit Web API ufficiale, in roadmap Q3 2026.",
        en: "Sync chain: Fitbit device → Fitbit app → Health Connect → FitMesh. Typical latency 15–30 minutes. Historical backfill beyond 30 days requires the official Fitbit Web API OAuth, on the Q3 2026 roadmap.",
      },
    },
    relatedBlogSlugs: ["esportare-dati-fitbit-google", "alternative-health-sync-2026"],
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
    setupGuide: {
      steps: {
        it: [
          "Verifica i requisiti: **Android 10+** e app **Garmin Connect** installata con almeno un device già accoppiato.",
          "Installa **Health Connect** dal Play Store (preinstallato su Android 14+).",
          "Apri Garmin Connect → menu ☰ → **Impostazioni** → **Partner connessi** → **Health Connect** → tocca **Connetti** e abilita lettura/scrittura per passi, BPM, sonno, calorie, distanza, allenamenti.",
          "Installa **FitMesh Sync** dal Play Store e accedi con Google.",
          "Concedi a FitMesh i permessi Health Connect richiesti al primo avvio, poi premi **Sincronizza ora**.",
          "(Opzionale) Iscriviti alla waitlist per l'**OAuth Garmin Health API** (Q3 2026) e sbloccare Body Battery, Training Load e GPS dettagliato.",
        ],
        en: [
          "Check requirements: **Android 10+** and **Garmin Connect** app installed with at least one paired device.",
          "Install **Health Connect** from the Play Store (preinstalled on Android 14+).",
          "Open Garmin Connect → ☰ menu → **Settings** → **Connected Partners** → **Health Connect** → tap **Connect** and enable read/write for steps, heart rate, sleep, calories, distance, workouts.",
          "Install **FitMesh Sync** from the Play Store and sign in with Google.",
          "Grant FitMesh the requested Health Connect permissions on first launch, then tap **Sync now**.",
          "(Optional) Join the waitlist for the **Garmin Health API OAuth** (Q3 2026) to unlock Body Battery, Training Load and detailed GPS.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri e per intervallo",
          "Frequenza cardiaca media + zone HR",
          "Sonno (durata totale, no fasi)",
          "Calorie attive e basali",
          "Distanza giornaliera",
          "Allenamenti base (tipo, durata, kcal)",
          "Body Battery, Training Load, GPS dettagliato → Q3 2026 via OAuth",
        ],
        en: [
          "Daily and intraday steps",
          "Average heart rate + HR zones",
          "Sleep (total duration, no stages)",
          "Active and basal calories",
          "Daily distance",
          "Basic workouts (type, duration, kcal)",
          "Body Battery, Training Load, detailed GPS → Q3 2026 via OAuth",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Voglio Body Battery e Training Load oggi",
            en: "I want Body Battery and Training Load today",
          },
          a: {
            it: "Non è possibile via Health Connect: queste sono metriche proprietarie Garmin non esposte all'API HC. L'integrazione nativa via OAuth Garmin Health API è in roadmap Q3 2026 (in attesa di approvazione Garmin Developer Program).",
            en: "Not possible via Health Connect: these are proprietary Garmin metrics not exposed to the HC API. Native integration via Garmin Health API OAuth is on the Q3 2026 roadmap (pending Garmin Developer Program approval).",
          },
        },
        {
          q: {
            it: "Vedo i passi ma non gli allenamenti",
            en: "I see steps but not workouts",
          },
          a: {
            it: "In Garmin Connect → Impostazioni → Partner connessi → Health Connect verifica che il permesso 'Allenamenti' (Exercise) sia attivo. È un permesso separato dai passi.",
            en: "In Garmin Connect → Settings → Connected Partners → Health Connect verify that the 'Exercise' permission is enabled. It's separate from steps.",
          },
        },
        {
          q: {
            it: "Quando arriva l'invito all'OAuth?",
            en: "When do I get the OAuth invite?",
          },
          a: {
            it: "L'invito alla beta OAuth Garmin parte da Q3 2026 in waves, in ordine cronologico di iscrizione alla waitlist. L'approvazione finale dipende dal Garmin Developer Program.",
            en: "OAuth Garmin beta invites roll out from Q3 2026 in waves, in waitlist signup order. Final approval depends on Garmin Developer Program.",
          },
        },
      ],
      technicalNotes: {
        it: "Oggi: bridge Garmin Connect → Health Connect, latenza tipica 15–30 minuti, granularità giornaliera. Q3 2026: OAuth 2.0 + Garmin Health API ufficiale con webhook su nuove attività, BPM secondo per secondo, GPS track completo, backfill 12 mesi al primo connect.",
        en: "Today: Garmin Connect → Health Connect bridge, typical latency 15–30 minutes, daily granularity. Q3 2026: official OAuth 2.0 + Garmin Health API with new-activity webhooks, second-by-second heart rate, full GPS tracks, 12-month backfill on first connect.",
      },
    },
    relatedBlogSlugs: ["scegliere-smartwatch-dati-2026", "guida-sync-wearable-2026"],
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
    slug: "suunto",
    name: "Suunto",
    vendor: "Suunto",
    category: "wearable",
    status: "beta",
    brandColor: "#FF7A45",
    initial: "S",
    tagline: {
      it: "Suunto Race, Peak, Vertical, Trail: integrazione OAuth diretta — sync attività, sonno e recupero.",
      en: "Suunto Race, Peak, Vertical, Trail: direct OAuth integration — sync activity, sleep and recovery.",
    },
    longDesc: {
      it: "FitMesh Sync integra Suunto direttamente tramite la Suunto Cloud API — senza passare da Health Connect. Dopo il collegamento OAuth, i dati di attività, sonno e recupero vengono scaricati automaticamente via webhook in tempo reale. Suunto Race, Peak, Vertical, Trail e tutti i modelli compatibili con la Suunto Cloud API sono supportati.",
      en: "FitMesh Sync integrates Suunto directly via the Suunto Cloud API — no Health Connect required. After the OAuth connection, activity, sleep and recovery data is pulled automatically via real-time webhooks. Suunto Race, Peak, Vertical, Trail and all Suunto Cloud API-compatible models are supported.",
    },
    techNote: {
      it: "Integrazione diretta: OAuth 2.0 (Authorization Code + PKCE) → Suunto Cloud API (activity, sleep, recovery, workout). Il client_secret è gestito server-side su Vercel — mai nel binario dell'app. Webhook real-time su nuove attività.",
      en: "Direct integration: OAuth 2.0 (Authorization Code + PKCE) → Suunto Cloud API (activity, sleep, recovery, workout). The client_secret is handled server-side on Vercel — never in the app binary. Real-time webhooks on new activities.",
    },
    dataTypes: STD_DATA_TYPES({
      steps: true,
      hr: true,
      sleep: true,
      calories: true,
      distance: true,
      workouts: true,
      vo2max: true,
      spo2: false,
    }),
    faqs: [
      {
        q: {
          it: "Quali Suunto sono supportati?",
          en: "Which Suunto devices are supported?",
        },
        a: {
          it: "Tutti i modelli compatibili con la Suunto app e la Suunto Cloud API: Race, Peak, Vertical, Trail, 9 Baro, 5 Peak, Spartan Ultra/Trainer, Ambit4. È sufficiente avere l'app Suunto sul telefono con l'account attivo.",
          en: "All models compatible with the Suunto app and Suunto Cloud API: Race, Peak, Vertical, Trail, 9 Baro, 5 Peak, Spartan Ultra/Trainer, Ambit4. You just need the Suunto app on your phone with an active account.",
        },
      },
      {
        q: {
          it: "Perché non passa da Health Connect come Garmin o Polar?",
          en: "Why doesn't it go through Health Connect like Garmin or Polar?",
        },
        a: {
          it: "L'app Suunto non scrive su Health Connect. Usiamo quindi l'integrazione ufficiale Suunto Cloud API — che è più completa: include dati di recupero e metriche avanzate non accessibili via Health Connect.",
          en: "The Suunto app does not write to Health Connect. We therefore use the official Suunto Cloud API integration — which is more complete: it includes recovery data and advanced metrics not accessible via Health Connect.",
        },
      },
      {
        q: {
          it: "Vedo i dati di recupero Suunto?",
          en: "Do I see Suunto recovery data?",
        },
        a: {
          it: "Sì — l'API Suunto espone il Recovery Score giornaliero, incluso lo status generale. FitMesh lo mostra nella sezione 'Vitali' della dashboard.",
          en: "Yes — the Suunto API exposes the daily Recovery Score, including overall status. FitMesh displays it in the 'Vitals' section of the dashboard.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare suunto dashboard",
        "suunto cloud api sync",
        "suunto race peak vertical dashboard",
        "esportare dati suunto",
      ],
      en: [
        "sync suunto dashboard",
        "suunto cloud api sync",
        "suunto race peak vertical dashboard",
        "export suunto data",
      ],
    },
    setupGuide: {
      steps: {
        it: [
          "Installa **FitMesh Sync** dal Play Store e accedi con Google o email.",
          "Apri **Impostazioni** → **Dispositivi & sync** → **Provider esterni** → tocca **Suunto**.",
          "Tocca **Collega Suunto** — verrai reindirizzato alla pagina login Suunto.",
          "Accedi con le tue credenziali Suunto e **Autorizza** FitMesh ad accedere ai dati.",
          "Attendi il primo sync (15–60 secondi). Le nuove attività sincronizzano automaticamente via webhook.",
        ],
        en: [
          "Install **FitMesh Sync** from the Play Store and sign in with Google or email.",
          "Open **Settings** → **Devices & sync** → **External providers** → tap **Suunto**.",
          "Tap **Connect Suunto** — you'll be redirected to the Suunto login page.",
          "Sign in with your Suunto credentials and **Authorize** FitMesh to access your data.",
          "Wait for the first sync (15–60 seconds). New activities sync automatically via webhook.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri e distanza",
          "Frequenza cardiaca (media, max, campioni continui)",
          "Calorie attive per sessione",
          "Sonno (durata totale e inizio/fine)",
          "Recovery Score giornaliero",
          "Allenamenti (tipo, durata, distanza, kcal, BPM medio/max)",
          "VO₂ max stimato",
        ],
        en: [
          "Daily steps and distance",
          "Heart rate (average, max, continuous samples)",
          "Active calories per session",
          "Sleep (total duration and start/end time)",
          "Daily Recovery Score",
          "Workouts (type, duration, distance, kcal, average/max HR)",
          "Estimated VO₂ max",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Non vedo dati dopo aver collegato Suunto",
            en: "I don't see data after connecting Suunto",
          },
          a: {
            it: "Assicurati che il tuo Suunto abbia effettuato almeno un sync con l'app Suunto prima di collegare FitMesh. I webhook arrivano solo su nuove attività registrate dopo il collegamento; per i dati passati usa 'Ricostruisci storico' nelle impostazioni.",
            en: "Make sure your Suunto has synced at least once with the Suunto app before connecting FitMesh. Webhooks only fire on new activities recorded after the connection; for past data use 'Rebuild history' in settings.",
          },
        },
        {
          q: {
            it: "La connessione OAuth è scaduta",
            en: "The OAuth connection has expired",
          },
          a: {
            it: "I token Suunto scadono ogni 12 ore. FitMesh li rinnova automaticamente in background. Se vedi 'Token scaduto' nelle impostazioni, tocca 'Ricollega Suunto' per eseguire un nuovo OAuth.",
            en: "Suunto tokens expire every 12 hours. FitMesh renews them automatically in the background. If you see 'Token expired' in settings, tap 'Reconnect Suunto' to run a new OAuth flow.",
          },
        },
        {
          q: {
            it: "Posso collegare Suunto e un Galaxy Watch insieme?",
            en: "Can I connect Suunto and a Galaxy Watch together?",
          },
          a: {
            it: "Sì — FitMesh gestisce sorgenti multiple. Galaxy Watch arriva via Health Connect, Suunto via API diretta. Per le metriche condivise (passi, BPM) FitMesh usa una logica di priorità configurabile nelle impostazioni.",
            en: "Yes — FitMesh handles multiple sources. Galaxy Watch arrives via Health Connect, Suunto via direct API. For shared metrics (steps, heart rate) FitMesh uses a configurable priority logic in settings.",
          },
        },
      ],
      technicalNotes: {
        it: "Integrazione diretta Suunto Cloud API (non Health Connect). OAuth 2.0 Authorization Code + PKCE. Il client_secret è server-side su Vercel (mai nell'app). Token access: 12h, refresh: 30 giorni. Webhook real-time su nuovi workout, dati sleep/activity/recovery via polling orario come backup. Backfill: ultimi 30 giorni al primo connect.",
        en: "Direct Suunto Cloud API integration (not Health Connect). OAuth 2.0 Authorization Code + PKCE. The client_secret is server-side on Vercel (never in the app). Access token: 12h, refresh: 30 days. Real-time webhooks on new workouts, sleep/activity/recovery via hourly polling as backup. Backfill: last 30 days on first connect.",
      },
    },
    relatedBlogSlugs: ["guida-sync-wearable-2026", "scegliere-smartwatch-dati-2026"],
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
    relatedBlogSlugs: ["gdpr-dati-fitness-smartwatch", "guida-sync-wearable-2026"],
  },
  {
    slug: "huawei",
    name: "Huawei Health",
    vendor: "Huawei",
    category: "wearable",
    status: "roadmap-q4",
    brandColor: "#CF0A2C",
    initial: "H",
    tagline: {
      it: "Huawei Watch GT, Band, Watch Ultimate: integrazione nativa via Huawei Health Kit — Q4 2026.",
      en: "Huawei Watch GT, Band, Watch Ultimate: native integration via Huawei Health Kit — Q4 2026.",
    },
    longDesc: {
      it: "Huawei Health non scrive su Health Connect per limiti di compatibilità con Huawei Mobile Services. Per portare i dati dei tuoi Watch GT, Band, Watch Fit, Watch Ultimate su FitMesh stiamo costruendo l'integrazione nativa via Huawei Health Kit (OAuth ufficiale), prevista per Q4 2026. Iscriviti alla waitlist per la beta chiusa.",
      en: "Huawei Health doesn't write to Health Connect due to Huawei Mobile Services compatibility limits. To bring data from your Watch GT, Band, Watch Fit, Watch Ultimate into FitMesh we're building a native integration via Huawei Health Kit (official OAuth), planned for Q4 2026. Join the waitlist for the closed beta.",
    },
    techNote: {
      it: "Roadmap Q4 2026: OAuth 2.0 + Huawei Health Kit REST API. Polling 30 min. Backfill 12 mesi al primo connect, compatibilmente con i limiti dell'API Huawei.",
      en: "Q4 2026 roadmap: OAuth 2.0 + Huawei Health Kit REST API. 30-min polling. 12-month backfill on first connect, subject to Huawei API limits.",
    },
    dataTypes: STD_DATA_TYPES({ vo2max: true, spo2: true }),
    faqs: [
      {
        q: {
          it: "Perché non funziona già via Health Connect?",
          en: "Why doesn't it work via Health Connect today?",
        },
        a: {
          it: "Huawei Health non espone dati a Health Connect: l'app Huawei è progettata per l'ecosistema Huawei Mobile Services e non integra le API HC di Google. Per garantire qualità dati uniforme integriamo direttamente con l'API ufficiale Huawei Health Kit.",
          en: "Huawei Health doesn't expose data to Health Connect: the Huawei app is built for the Huawei Mobile Services ecosystem and doesn't integrate Google's HC APIs. To ensure consistent data quality we're integrating directly with the official Huawei Health Kit API.",
        },
      },
      {
        q: {
          it: "Quando arriva il mio invito alla beta?",
          en: "When do I get my beta invite?",
        },
        a: {
          it: "Beta in waves da Q4 2026, in ordine cronologico di iscrizione alla waitlist. Riceverai una mail con il link al download della build beta.",
          en: "Beta in waves starting Q4 2026, in waitlist signup order. You'll get an email with a link to download the beta build.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "sincronizzare huawei health dashboard",
        "huawei watch gt dashboard",
        "huawei health kit oauth",
        "huawei band export dati",
      ],
      en: [
        "sync huawei health dashboard",
        "huawei watch gt dashboard",
        "huawei health kit oauth",
        "huawei band export data",
      ],
    },
    setupGuide: {
      steps: {
        it: [
          "**Iscriviti alla beta waitlist** dalla CTA principale qui sotto.",
          "Conferma l'iscrizione dalla mail che ti inviamo.",
          "Verifica i requisiti: **Huawei Health installato**, Huawei ID attivo, almeno un device Huawei sincronizzato negli ultimi 30 giorni.",
          "**Attendi l'invito** alla beta chiusa, in distribuzione da Q4 2026.",
          "Al lancio: aggiorna **FitMesh Sync**, tocca **Collega Huawei** e completa l'OAuth Huawei Health Kit.",
        ],
        en: [
          "**Join the beta waitlist** from the main CTA below.",
          "Confirm your subscription from the email we send you.",
          "Check requirements: **Huawei Health installed**, active Huawei ID, at least one Huawei device paired and synced within the last 30 days.",
          "**Wait for your beta invite**, rolling out from Q4 2026.",
          "At launch: update **FitMesh Sync**, tap **Connect Huawei** and complete the Huawei Health Kit OAuth flow.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri",
          "Frequenza cardiaca (media, riposo, continua)",
          "Sonno con fasi (TruSleep)",
          "Calorie attive e basali",
          "Distanza e GPS",
          "Allenamenti (tipo, durata, kcal, BPM medio)",
          "SpO₂",
        ],
        en: [
          "Daily steps",
          "Heart rate (average, resting, continuous)",
          "Sleep with stages (TruSleep)",
          "Active and basal calories",
          "Distance and GPS",
          "Workouts (type, duration, kcal, average BPM)",
          "SpO₂",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Voglio i miei dati Huawei su FitMesh oggi",
            en: "I want my Huawei data in FitMesh today",
          },
          a: {
            it: "Non è possibile oggi: Huawei Health non scrive su Health Connect. L'integrazione nativa via Huawei Health Kit è in roadmap Q4 2026. Iscriviti alla waitlist per l'invito alla beta chiusa.",
            en: "Not possible today: Huawei Health doesn't write to Health Connect. Native integration via Huawei Health Kit is on the Q4 2026 roadmap. Join the waitlist for the closed beta invite.",
          },
        },
        {
          q: {
            it: "Posso usare un'app di terze parti come ponte?",
            en: "Can I use a third-party bridge app?",
          },
          a: {
            it: "Le bridge app cloud-to-cloud per Huawei richiedono setup tecnico avanzato e la qualità dei dati può variare nel tempo (Huawei non offre API pubbliche ufficiali per terze parti su Health Drive). Noi consigliamo di aspettare l'integrazione nativa via OAuth Huawei Cloud Health, in roadmap per Q4 2026.",
            en: "Cloud-to-cloud bridge apps for Huawei require advanced technical setup and data quality may vary over time (Huawei doesn't offer official public APIs for third parties on Health Drive). We recommend waiting for the native integration via Huawei Cloud Health OAuth, in roadmap for Q4 2026.",
          },
        },
        {
          q: {
            it: "Quale Huawei sarà supportato al lancio?",
            en: "Which Huawei devices will be supported at launch?",
          },
          a: {
            it: "Tutti i wearable Huawei compatibili con Huawei Health Kit: Watch GT 2/3/4/5, Watch Ultimate, Watch Fit 2/3, Band 7/8/9. La copertura completa sarà confermata in beta.",
            en: "All Huawei wearables compatible with Huawei Health Kit: Watch GT 2/3/4/5, Watch Ultimate, Watch Fit 2/3, Band 7/8/9. Full coverage will be confirmed during beta.",
          },
        },
      ],
      technicalNotes: {
        it: "Roadmap Q4 2026: OAuth 2.0 + Huawei Health Kit REST API. Polling 30 min. Granularità: passi per ora, BPM per sample, sonno per fase TruSleep. Backfill 12 mesi al primo connect, compatibilmente con i limiti dell'API Huawei.",
        en: "Q4 2026 roadmap: OAuth 2.0 + Huawei Health Kit REST API. 30-min polling. Granularity: steps per hour, heart rate per sample, sleep per TruSleep stage. 12-month backfill on first connect, subject to Huawei API limits.",
      },
    },
  },

  // ── Phone-only (no wearable required) ───────────────────────────────────
  {
    slug: "smartphone-android",
    name: "Smartphone Android",
    vendor: "Health Connect",
    category: "phone-only",
    status: "live",
    brandColor: "#21E6C1",
    initial: "📱",
    tagline: {
      it: "Niente smartwatch? Funziona già — passi e attività dal telefono via Health Connect.",
      en: "No smartwatch? It already works — steps and activity from your phone via Health Connect.",
    },
    longDesc: {
      it: "FitMesh Sync legge i dati salute direttamente dal telefono tramite Health Connect — passi del pedometro Android, frequenza cardiaca da app come Samsung Health in modalità telefono-only, dati Google Fit e inserimenti manuali. Nessuno smartwatch necessario: se il tuo telefono scrive su Health Connect, FitMesh li legge.",
      en: "FitMesh Sync reads health data directly from your phone via Health Connect — Android pedometer steps, heart rate from apps like Samsung Health in phone-only mode, Google Fit data and manual entries. No smartwatch required: if your phone writes to Health Connect, FitMesh reads it.",
    },
    techNote: {
      it: "Health Connect aggrega tutte le sorgenti disponibili sul telefono. Nessun OAuth, nessuna chiave API. Basta concedere i permessi Health Connect a FitMesh al primo avvio.",
      en: "Health Connect aggregates all available sources on the phone. No OAuth, no API keys. Just grant Health Connect permissions to FitMesh on first launch.",
    },
    dataTypes: STD_DATA_TYPES({
      steps: true,
      hr: true,
      sleep: true,
      calories: true,
      distance: true,
      workouts: true,
      vo2max: false,
      spo2: false,
    }),
    faqs: [
      {
        q: {
          it: "Funziona senza nessun smartwatch?",
          en: "Does it work without any smartwatch?",
        },
        a: {
          it: "Sì. FitMesh legge i dati che il tuo telefono scrive su Health Connect — passi del pedometro integrato, attività registrate manualmente, dati di app come Samsung Health o Google Fit in modalità telefono. Non hai bisogno di un orologio.",
          en: "Yes. FitMesh reads the data your phone writes to Health Connect — steps from the built-in pedometer, manually logged activities, data from apps like Samsung Health or Google Fit in phone mode. You don't need a watch.",
        },
      },
      {
        q: {
          it: "Che dati vedo senza smartwatch?",
          en: "What data do I see without a smartwatch?",
        },
        a: {
          it: "Dipende dalle app installate: con Samsung Health (modalità solo telefono) vedi passi, calorie stimate e frequenza cardiaca manuale. Con Google Fit vedi passi e attività. Gli inserimenti manuali (peso, sonno, acqua) appaiono sempre.",
          en: "It depends on the apps you have installed: with Samsung Health (phone-only mode) you see steps, estimated calories and manual heart rate. With Google Fit you see steps and activities. Manual entries (weight, sleep, water) always appear.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "fitmesh senza smartwatch",
        "health connect solo telefono",
        "passi android senza orologio",
        "pedometro android dashboard",
      ],
      en: [
        "fitmesh without smartwatch",
        "health connect phone only",
        "android steps without watch",
        "android pedometer dashboard",
      ],
    },
    setupGuide: {
      steps: {
        it: [
          "Installa **Health Connect** dal Play Store (preinstallato su Android 14+).",
          "Assicurati che le app che vuoi usare (Samsung Health, Google Fit, ecc.) abbiano i permessi di scrittura su Health Connect attivi.",
          "Installa **FitMesh Sync** dal Play Store e accedi con Google.",
          "Al primo avvio scegli **'Solo telefono'** nella schermata di benvenuto.",
          "Concedi i permessi Health Connect richiesti e premi **Sincronizza ora**.",
        ],
        en: [
          "Install **Health Connect** from the Play Store (preinstalled on Android 14+).",
          "Make sure the apps you want to use (Samsung Health, Google Fit, etc.) have Health Connect write permissions enabled.",
          "Install **FitMesh Sync** from the Play Store and sign in with Google.",
          "On first launch, choose **'Phone only'** on the welcome screen.",
          "Grant the requested Health Connect permissions and tap **Sync now**.",
        ],
      },
      syncedData: {
        it: [
          "Passi giornalieri (pedometro Android)",
          "Frequenza cardiaca (da app companion o inserimento manuale)",
          "Sonno (inserimento manuale o app compatibile)",
          "Calorie stimate",
          "Distanza",
          "Allenamenti registrati manualmente o da app fitness",
        ],
        en: [
          "Daily steps (Android pedometer)",
          "Heart rate (from companion apps or manual entry)",
          "Sleep (manual entry or compatible app)",
          "Estimated calories",
          "Distance",
          "Workouts logged manually or from fitness apps",
        ],
      },
      troubleshooting: [
        {
          q: {
            it: "Non vedo i miei passi",
            en: "I don't see my steps",
          },
          a: {
            it: "Verifica che Health Connect → Permessi → FitMesh Sync → Passi sia abilitato. Se hai Samsung Health o Google Fit installati, verifica anche che abbiano i permessi di scrittura per i passi in Health Connect.",
            en: "Check that Health Connect → Permissions → FitMesh Sync → Steps is enabled. If you have Samsung Health or Google Fit installed, also verify they have write permissions for steps in Health Connect.",
          },
        },
        {
          q: {
            it: "Vedo meno dati rispetto a chi ha uno smartwatch",
            en: "I see less data than someone with a smartwatch",
          },
          a: {
            it: "Corretto: un wearable aggiunge sensori continui (BPM 24/7, SpO₂, fasi sonno automatiche). Il telefono offre i dati di base — ma per molti utenti è sufficiente per tracciare i passi giornalieri e le attività.",
            en: "Correct: a wearable adds continuous sensors (24/7 heart rate, SpO₂, automatic sleep stages). The phone offers basic data — but for many users it's enough to track daily steps and activities.",
          },
        },
        {
          q: {
            it: "Posso aggiungere uno smartwatch in un secondo momento?",
            en: "Can I add a smartwatch later?",
          },
          a: {
            it: "Sì. Basta collegare il tuo wearable a Health Connect (via Samsung Health, Zepp, OHealth o altra app companion) e FitMesh leggerà automaticamente i nuovi dati. Puoi cambiare la modalità da Impostazioni in qualsiasi momento.",
            en: "Yes. Just connect your wearable to Health Connect (via Samsung Health, Zepp, OHealth or another companion app) and FitMesh will automatically read the new data. You can change the mode in Settings at any time.",
          },
        },
      ],
      technicalNotes: {
        it: "Connessione via Health Connect, nessun OAuth. I dati del telefono (pedometro, app fitness) vengono letti esattamente come quelli di un wearable — Health Connect astrae la sorgente. La qualità e la granularità dei dati dipende dalle app installate e dai sensori del dispositivo.",
        en: "Connection via Health Connect, no OAuth. Phone data (pedometer, fitness apps) is read exactly like wearable data — Health Connect abstracts the source. Data quality and granularity depend on the apps installed and the device's sensors.",
      },
    },
  },

  // ── Anelli smart BLE diretto (in arrivo) ────────────────────────────────
  {
    slug: "colmi-ring",
    name: "Colmi Ring",
    vendor: "Colmi",
    category: "wearable",
    status: "live",
    brandColor: "#7CFF5B",
    initial: "C",
    tagline: {
      it: "Colmi R02/R03 e anelli compatibili: dati direttamente in FitMesh via Bluetooth, senza app companion.",
      en: "Colmi R02/R03 and compatible rings: data straight into FitMesh via Bluetooth, no companion app needed.",
    },
    longDesc: {
      it: "FitMesh Sync supporta gli anelli smart Colmi R02 e R03 (e i cloni OEM con lo stesso protocollo BLE) tramite connessione Bluetooth diretta. L'app legge l'anello senza bisogno dell'app companion del produttore: passi, distanza, calorie, battito cardiaco (log giornaliero + FC a riposo), SpO2, HRV, stress, sonno con fasi e batteria entrano direttamente nella tua dashboard multi-device. Il dato notturno dell'anello si fonde con quello diurno dello smartwatch senza doppi conteggi.",
      en: "FitMesh Sync supports Colmi R02 and R03 smart rings (and OEM clones sharing the same BLE protocol) via direct Bluetooth connection. The app reads the ring without needing the manufacturer's companion app: steps, distance, calories, heart rate (daily log + resting HR), SpO2, HRV, stress, sleep with stages and battery feed directly into your multi-device dashboard. Nightly ring data merges with daytime smartwatch data — no double counting.",
    },
    techNote: {
      it: "Lettura BLE diretta (no Health Connect, no app OEM). FitMesh si connette all'anello come dispositivo Bluetooth, scarica i dati grezzi e li integra nella dashboard multi-sorgente (fusione anello+smartwatch: l'anello copre la notte e le metriche che lo smartwatch non ha). Sonno con fasi: l'anello è specialista e prevale di notte.",
      en: "Direct BLE read (no Health Connect, no OEM app). FitMesh connects to the ring as a Bluetooth device, downloads raw data and merges it into the multi-source dashboard (ring+smartwatch fusion: the ring covers nighttime and metrics the smartwatch lacks). Sleep with stages: the ring is the specialist and wins overnight.",
    },
    dataTypes: [
      { key: "steps", label: { it: "Passi", en: "Steps" }, supported: true },
      { key: "hr", label: { it: "Frequenza cardiaca", en: "Heart rate" }, supported: true },
      { key: "sleep", label: { it: "Sonno con fasi", en: "Sleep with stages" }, supported: true },
      { key: "calories", label: { it: "Calorie", en: "Calories" }, supported: true },
      { key: "distance", label: { it: "Distanza", en: "Distance" }, supported: true },
      { key: "workouts", label: { it: "Allenamenti", en: "Workouts" }, supported: false },
      { key: "spo2", label: { it: "SpO₂", en: "SpO₂" }, supported: true },
      { key: "hrv", label: { it: "HRV", en: "HRV" }, supported: true },
      { key: "stress", label: { it: "Stress", en: "Stress" }, supported: true },
    ],
    faqs: [
      {
        q: {
          it: "Funziona anche con il Colmi R03 e i cloni OEM?",
          en: "Does it work with the Colmi R03 and OEM clones too?",
        },
        a: {
          it: "Sì. FitMesh usa il protocollo BLE condiviso da Colmi R02, R03 e diversi anelli OEM che usano lo stesso firmware. Se il tuo anello usa l'app QRing o un'app companion identica per interfaccia, è probabile che sia compatibile.",
          en: "Yes. FitMesh uses the BLE protocol shared by the Colmi R02, R03 and several OEM rings that run the same firmware. If your ring uses the QRing app or a companion app identical in interface, it's likely compatible.",
        },
      },
      {
        q: {
          it: "Devo tenere installata l'app del produttore?",
          en: "Do I need to keep the manufacturer's app installed?",
        },
        a: {
          it: "No. FitMesh Sync si connette all'anello via Bluetooth diretto e scarica i dati autonomamente. L'app companion del produttore non è richiesta e puoi disinstallarla se preferisci.",
          en: "No. FitMesh Sync connects directly to the ring over Bluetooth and downloads data on its own. The manufacturer's companion app is not required and you can uninstall it if you prefer.",
        },
      },
      {
        q: {
          it: "Quanto dura la batteria dell'anello con FitMesh?",
          en: "How does FitMesh affect the ring's battery life?",
        },
        a: {
          it: "FitMesh scarica i dati in batch quando l'anello è nelle vicinanze, senza mantenere una connessione BLE continua. L'impatto sulla batteria dell'anello è minimo (il Colmi R02 arriva tipicamente a 5–7 giorni di autonomia).",
          en: "FitMesh downloads data in batches when the ring is nearby, without maintaining a continuous BLE connection. The impact on ring battery life is minimal (the Colmi R02 typically achieves 5–7 days of battery life).",
        },
      },
      {
        q: {
          it: "Quanto sono precisi i dati di battito e SpO₂?",
          en: "How accurate are the heart rate and SpO₂ readings?",
        },
        a: {
          it: "Gli anelli Colmi R02/R03 stimano battito e SpO₂ tramite sensori PPG ottici. I dati sono informativi: utili per monitorare trend giornalieri e notturni, ma non sostituiscono dispositivi medici certificati. Per uso clinico consultare sempre un medico.",
          en: "Colmi R02/R03 rings estimate heart rate and SpO₂ via optical PPG sensors. The data is informational: useful for tracking daily and nightly trends, but not a replacement for certified medical devices. Always consult a healthcare professional for clinical use.",
        },
      },
      {
        q: {
          it: "I miei dati restano privati?",
          en: "Is my data private?",
        },
        a: {
          it: "Sì. I dati dell'anello vengono letti via Bluetooth direttamente dal telefono e inviati solo al backend Supabase del tuo account FitMesh (server in EU). Non passano dai server del produttore dell'anello.",
          en: "Yes. Ring data is read via Bluetooth directly by the phone and sent only to your FitMesh account's Supabase backend (EU servers). It does not pass through the ring manufacturer's servers.",
        },
      },
    ],
    seoKeywords: {
      it: [
        "colmi r02 app",
        "colmi r02 dati dashboard",
        "anello smart economico app",
        "colmi r02 italiano",
        "colmi ring fitmesh",
      ],
      en: [
        "colmi r02 app alternative",
        "colmi r02 export data",
        "colmi ring sync",
        "budget smart ring dashboard",
        "colmi ring fitmesh",
      ],
    },
    relatedBlogSlugs: ["colmi-ring-fitmesh"],
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
    "coming-soon": { it: "In arrivo", en: "Coming soon", color: "#7CFF5B" },
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
    "phone-only": { it: "Solo telefono", en: "Phone-only" },
  };
  return map[category][lc];
}
