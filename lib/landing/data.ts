/**
 * Landing pages high-intent (`/lp/[slug]`).
 *
 * Differenza vs blog: focus conversion. Struttura più snella, più CTA, content
 * più tagliente. Riusa il tipo `BlogSection` per coerenza render — i landing
 * sono blog post con `pillar: false`, FAQ leggera, related vuoto e brand
 * disclaimer obbligatorio se citano produttori.
 */

import type { BlogSection, BlogQA, Localized } from "@/lib/blog/types";

export interface LandingPage {
  /** Slug URL — kebab-case, stabile, SEO-critical. */
  slug: string;
  /** Target provider slug (`/sync/[provider]`), per cross-link CTA. */
  relatedProvider?: string;
  publishedAt: string;
  updatedAt: string;
  hero: {
    kicker: Localized;
    title: Localized;
    subtitle: Localized;
    /** CTA primaria in hero (label + path o ancora). */
    primaryCta: { label: Localized; href: Localized };
    /** CTA secondaria opzionale (default: /integrations). */
    secondaryCta?: { label: Localized; href: Localized };
  };
  metaDescription: Localized;
  primaryKeyword: Localized;
  secondaryKeywords: { it: string[]; en: string[] };
  body: BlogSection[];
  faq?: BlogQA[];
  brandsMentioned?: string[];
}

const LANDING_PAGES_RAW: LandingPage[] = [
  // ── 1. Backup Galaxy Watch ────────────────────────────────────────────
  {
    slug: "backup-galaxy-watch",
    relatedProvider: "galaxy-watch",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    primaryKeyword: {
      it: "backup galaxy watch",
      en: "galaxy watch backup",
    },
    secondaryKeywords: {
      it: [
        "scaricare dati samsung health",
        "samsung health backup pc",
        "backup galaxy watch senza samsung cloud",
      ],
      en: [
        "download samsung health data",
        "samsung health backup pc",
        "galaxy watch backup without samsung cloud",
      ],
    },
    metaDescription: {
      it: "Backup automatico dei dati Galaxy Watch su una dashboard tua, senza Samsung Cloud. Setup in 30 secondi via Health Connect. Privacy-first.",
      en: "Automatic backup of Galaxy Watch data on a dashboard you own, without Samsung Cloud. 30-second setup via Health Connect. Privacy-first.",
    },
    hero: {
      kicker: { it: "Backup Galaxy Watch", en: "Galaxy Watch backup" },
      title: {
        it: "Backup automatico Galaxy Watch, fuori da Samsung Cloud",
        en: "Automatic Galaxy Watch backup, outside Samsung Cloud",
      },
      subtitle: {
        it: "Passi, BPM, sonno, allenamenti del tuo Galaxy Watch su una dashboard web tua. Setup di 30 secondi via Health Connect, niente account aggiuntivi.",
        en: "Steps, HR, sleep, workouts from your Galaxy Watch on a web dashboard you own. 30-second setup via Health Connect, no extra accounts.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta" },
        href: { it: "/it/beta", en: "/en/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi tutte le integrazioni", en: "See all integrations" },
        href: { it: "/it/sync/galaxy-watch", en: "/en/sync/galaxy-watch" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Il Galaxy Watch è ottimo, Samsung Health è completo, ma se vuoi i tuoi dati fuori dal cloud Samsung — per archivio, per analisi su PC, per fare confronti tra anni — la strada nativa è clunky. Devi aprire l'app, andare in impostazioni, scaricare l'export, aspettare l'email, decomprimere, importare in Excel. Ogni volta da capo.",
          en: "Galaxy Watch is great, Samsung Health is comprehensive, but if you want your data out of Samsung cloud — for archive, for PC analysis, for cross-year comparisons — the native path is clunky. You open the app, go to settings, download the export, wait for the email, unzip, import to Excel. Every single time.",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "FitMesh Sync è la via automatica. Installi l'app Android, dai il permesso Health Connect, e da quel momento i dati del Galaxy Watch sono mirrorati su una dashboard web che apri da qualsiasi browser. Sync automatico ogni 15 minuti, nessuna manualità.",
          en: "FitMesh Sync is the automatic path. Install the Android app, grant the Health Connect permission, and from then on your Galaxy Watch data is mirrored to a web dashboard you open from any browser. Automatic sync every 15 minutes, zero manual work.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Cosa viene salvato", en: "What gets saved" },
      },
      {
        type: "list",
        items: {
          it: [
            "Passi giornalieri e per intervallo orario",
            "Frequenza cardiaca: media, riposo, e sample continui",
            "Sonno con fasi (Profondo, REM, Leggero, Sveglio)",
            "Allenamenti con tipo, durata, kcal, BPM medio",
            "Calorie attive e basali",
            "Distanza percorsa",
            "SpO₂ (se il tuo Watch lo misura)",
            "VO₂ max (se misurato)",
          ],
          en: [
            "Daily and hourly-interval steps",
            "Heart rate: average, resting, and continuous samples",
            "Sleep with stages (Deep, REM, Light, Awake)",
            "Workouts with type, duration, kcal, average HR",
            "Active and basal calories",
            "Distance",
            "SpO₂ (if your Watch measures it)",
            "VO₂ max (when measured)",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Setup in 3 step", en: "Setup in 3 steps" },
      },
      {
        type: "list",
        ordered: true,
        items: {
          it: [
            "Installa FitMesh Sync dal Play Store e accedi con Google.",
            "Apri Samsung Health → Impostazioni → Health Connect → autorizza FitMesh per i dati che vuoi salvare.",
            "Apri la dashboard web (link nell'app o accedi con la stessa Google). I tuoi dati sono lì.",
          ],
          en: [
            "Install FitMesh Sync from Play Store and sign in with Google.",
            "Open Samsung Health → Settings → Health Connect → authorize FitMesh for the data types you want to save.",
            "Open the web dashboard (link in the app or sign in with the same Google). Your data is there.",
          ],
        },
      },
      {
        type: "callout",
        variant: "tip",
        title: { it: "Senza dipendenze da Samsung Cloud", en: "No Samsung Cloud dependency" },
        body: {
          it: "FitMesh Sync legge da Health Connect, che è strettamente on-device. Non passa dal cloud Samsung. Puoi disabilitare la sincronizzazione Samsung Account in Samsung Health e FitMesh continua a funzionare.",
          en: "FitMesh Sync reads from Health Connect, which is strictly on-device. It doesn't pass through Samsung cloud. You can disable Samsung Account sync in Samsung Health and FitMesh keeps working.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Pronto al backup automatico?",
          en: "Ready for automatic backup?",
        },
        body: {
          it: "100 posti founder gratis durante la beta. App Android sul Play Store + dashboard web inclusa.",
          en: "100 free founder seats during beta. Android app on Play Store + web dashboard included.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "FitMesh Sync sostituisce Samsung Health?",
          en: "Does FitMesh Sync replace Samsung Health?",
        },
        a: {
          it: "No, lavora insieme. Samsung Health continua a ricevere dati dal Watch. FitMesh legge una copia da Health Connect e la mostra sulla dashboard web. Sono complementari.",
          en: "No, they work together. Samsung Health keeps receiving data from the Watch. FitMesh reads a copy from Health Connect and shows it on the web dashboard. They're complementary.",
        },
      },
      {
        q: {
          it: "Funziona su Galaxy Watch 4? E sui modelli più vecchi?",
          en: "Does it work on Galaxy Watch 4? And older models?",
        },
        a: {
          it: "Sì per Galaxy Watch 4, 5, 6, 7, Ultra (tutti scrivono su Samsung Health → Health Connect). Modelli più vecchi (Gear S3, Galaxy Watch Active) potrebbero funzionare se aggiornati e collegati a Samsung Health aggiornato, ma il supporto formale parte dal Watch 4.",
          en: "Yes for Galaxy Watch 4, 5, 6, 7, Ultra (all write to Samsung Health → Health Connect). Older models (Gear S3, Galaxy Watch Active) may work if updated and paired with current Samsung Health, but formal support starts with Watch 4.",
        },
      },
      {
        q: {
          it: "I dati sono cancellabili in un click?",
          en: "Can I delete data with one click?",
        },
        a: {
          it: "Sì. Nelle impostazioni FitMesh c'è 'Elimina account e dati', che cancella tutto in modo definitivo dai nostri server (con 30 giorni di backup operativo come da privacy policy). I dati sul telefono e nel Galaxy Watch restano intatti.",
          en: "Yes. In FitMesh settings there's 'Delete account and data', which definitively deletes everything from our servers (with 30 days of operational backup as per privacy policy). Data on phone and Galaxy Watch remains intact.",
        },
      },
    ],
    brandsMentioned: ["Samsung", "Google"],
  },

  // ── 2. Fitbit Export Google ───────────────────────────────────────────
  {
    slug: "fitbit-export-google",
    relatedProvider: "fitbit",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    primaryKeyword: {
      it: "esportare dati fitbit google",
      en: "export fitbit data google",
    },
    secondaryKeywords: {
      it: ["alternativa dashboard fitbit", "vedere dati fitbit senza app", "fitbit web 2026"],
      en: ["fitbit dashboard alternative", "view fitbit data without app", "fitbit web 2026"],
    },
    metaDescription: {
      it: "Vuoi esportare e visualizzare i dati Fitbit dopo l'acquisizione Google? Dashboard web alternativa via Health Connect, niente Fitbit Premium, privacy-first.",
      en: "Want to export and view Fitbit data after Google acquisition? Alternative web dashboard via Health Connect, no Fitbit Premium, privacy-first.",
    },
    hero: {
      kicker: { it: "Fitbit dopo Google", en: "Fitbit after Google" },
      title: {
        it: "Dashboard alternativa Fitbit, senza dipendenza da Google",
        en: "Alternative Fitbit dashboard, free from Google dependency",
      },
      subtitle: {
        it: "Fitbit.com è stato smantellato, Fitbit Premium ti spinge a pagare per le funzioni di sempre. Esporta i tuoi dati Fitbit su una dashboard web tua, via Health Connect.",
        en: "Fitbit.com was decommissioned, Fitbit Premium pushes you to pay for the features you always had. Export your Fitbit data to a dashboard you own, via Health Connect.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta" },
        href: { it: "/it/beta", en: "/en/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi integrazione Fitbit", en: "See Fitbit integration" },
        href: { it: "/it/sync/fitbit", en: "/en/sync/fitbit" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Dopo l'acquisizione Fitbit da parte di Google nel 2021 e la migrazione obbligatoria a Google Account nel 2023, l'esperienza Fitbit è cambiata: web dashboard rimosse, alcune feature spinte dietro Premium, accesso ai dati storici sempre più mediato dall'ecosystem Google. Se vuoi continuare a usare il tuo Fitbit ma con maggiore controllo dati, c'è una strada pulita: Health Connect + dashboard alternativa.",
          en: "After Google's 2021 Fitbit acquisition and the 2023 mandatory Google Account migration, the Fitbit experience changed: web dashboards removed, some features pushed behind Premium, access to historical data increasingly mediated by Google ecosystem. If you want to keep using your Fitbit with more data control, there's a clean path: Health Connect + alternative dashboard.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Cosa otteni con FitMesh Sync", en: "What you get with FitMesh Sync" },
      },
      {
        type: "list",
        items: {
          it: [
            "Dashboard web pulita accessibile da PC, tablet, telefono",
            "Sync automatico via Health Connect (Fitbit app → HC → FitMesh)",
            "Storico locale archiviato sul nostro backend EU (Frankfurt)",
            "Export dati in CSV/JSON quando vuoi",
            "Niente Fitbit Premium, niente subscription FitMesh subscription-based",
            "Roadmap: integrazione OAuth Fitbit Web API per sleep stages dettagliate e backfill 12 mesi",
          ],
          en: [
            "Clean web dashboard accessible from PC, tablet, phone",
            "Automatic sync via Health Connect (Fitbit app → HC → FitMesh)",
            "Local history stored on our EU backend (Frankfurt)",
            "CSV/JSON data export whenever",
            "No Fitbit Premium, no FitMesh subscription",
            "Roadmap: Fitbit Web API OAuth integration for detailed sleep stages and 12-month backfill",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Funziona con qualsiasi Fitbit moderno", en: "Works with any modern Fitbit" },
      },
      {
        type: "paragraph",
        text: {
          it: "Charge 5/6, Inspire 3, Sense 2, Versa 4, Luxe, Ace, e Pixel Watch (1, 2, 3) — tutti funzionano oggi via il bridge automatico Fitbit app → Health Connect. Setup di 5 minuti, una volta sola.",
          en: "Charge 5/6, Inspire 3, Sense 2, Versa 4, Luxe, Ace, and Pixel Watch (1, 2, 3) — all work today via the automatic Fitbit app → Health Connect bridge. 5-minute setup, once.",
        },
      },
      {
        type: "callout",
        variant: "info",
        title: { it: "Per chi stessa per lasciare Fitbit", en: "If you're about to leave Fitbit" },
        body: {
          it: "Anche se hai deciso di passare a Garmin, Apple Watch o Galaxy Watch, conviene salvare lo storico Fitbit ora. FitMesh tiene una copia sul tuo account, accessibile anche dopo che hai chiuso quello Fitbit/Google.",
          en: "Even if you've decided to switch to Garmin, Apple Watch or Galaxy Watch, save your Fitbit history now. FitMesh keeps a copy on your account, accessible even after you close your Fitbit/Google one.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Riprendi controllo del tuo Fitbit",
          en: "Take back control of your Fitbit",
        },
        body: {
          it: "Gratis durante la beta per i primi 100 founder. App Android + dashboard web.",
          en: "Free during beta for the first 100 founders. Android app + web dashboard.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Vedo le fasi di sonno REM/Deep/Light?",
          en: "Do I see REM/Deep/Light sleep stages?",
        },
        a: {
          it: "Oggi via Health Connect Fitbit espone solo la durata totale del sonno. Le fasi dettagliate arriveranno con l'integrazione OAuth Fitbit Web API, prevista per Q3 2026. La data total è comunque visibile da subito.",
          en: "Today via Health Connect Fitbit only exposes total sleep duration. Detailed stages will arrive with the Fitbit Web API OAuth integration, planned for Q3 2026. Total duration is visible from day one.",
        },
      },
      {
        q: {
          it: "FitMesh può cancellare i miei dati se cambio idea?",
          en: "Can FitMesh delete my data if I change my mind?",
        },
        a: {
          it: "Sì. Dalle impostazioni 'Elimina account e dati' cancella tutto dai nostri server. I dati nel cloud Fitbit/Google e sul tuo dispositivo restano intatti (puoi gestirli separatamente).",
          en: "Yes. Settings → 'Delete account and data' wipes everything from our servers. Data in Fitbit/Google cloud and on your device remains untouched (manage separately).",
        },
      },
      {
        q: {
          it: "Devo cancellare il Fitbit Account?",
          en: "Do I have to delete my Fitbit Account?",
        },
        a: {
          it: "No. FitMesh affianca, non sostituisce. Continuano a funzionare Fitbit app + le sue feature di sempre. FitMesh aggiunge solo la dashboard web alternativa e l'export.",
          en: "No. FitMesh adds to, doesn't replace. Fitbit app + all its existing features keep working. FitMesh just adds the alternative web dashboard and export.",
        },
      },
    ],
    brandsMentioned: ["Fitbit", "Google"],
  },

  // ── 3. Garmin Connect PC ──────────────────────────────────────────────
  {
    slug: "garmin-connect-pc",
    relatedProvider: "garmin",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    primaryKeyword: {
      it: "garmin connect pc",
      en: "garmin connect pc",
    },
    secondaryKeywords: {
      it: ["dashboard garmin browser", "garmin connect alternativa", "vedere dati garmin"],
      en: ["garmin dashboard browser", "garmin connect alternative", "view garmin data"],
    },
    metaDescription: {
      it: "Dashboard Garmin alternativa accessibile da PC, in aggiunta a Garmin Connect web. Cross-sync con Galaxy Watch, Oura, Fitbit. Setup via Health Connect.",
      en: "Alternative Garmin dashboard accessible from PC, in addition to Garmin Connect web. Cross-sync with Galaxy Watch, Oura, Fitbit. Setup via Health Connect.",
    },
    hero: {
      kicker: { it: "Garmin su PC", en: "Garmin on PC" },
      title: {
        it: "Garmin su una dashboard tua, accanto agli altri wearable",
        en: "Garmin on a dashboard you own, alongside other wearables",
      },
      subtitle: {
        it: "Garmin Connect web funziona, ma è isolato. Se hai anche un Galaxy Watch per la quotidianità o un Oura per il sonno, vuoi vederli insieme. FitMesh Sync li unifica.",
        en: "Garmin Connect web works, but it's isolated. If you also have a Galaxy Watch for daily wear or an Oura for sleep, you want them together. FitMesh Sync unifies them.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta" },
        href: { it: "/it/beta", en: "/en/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi integrazione Garmin", en: "See Garmin integration" },
        href: { it: "/it/sync/garmin", en: "/en/sync/garmin" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Garmin Connect è una delle migliori web dashboard wearable ancora in piedi nel 2026. Per chi usa solo Garmin va benissimo. Il problema arriva quando hai anche un Galaxy Watch (perché alla sera vuoi un orologio normale), un Oura Ring (perché segui meglio il sonno), o vuoi che i tuoi dati Garmin compaiano in un'app salute unificata. Garmin Connect è chiuso al suo silos.",
          en: "Garmin Connect is one of the best wearable web dashboards still standing in 2026. For Garmin-only users it's perfect. The problem comes when you also have a Galaxy Watch (because in the evening you want a regular watch), an Oura Ring (because you track sleep more carefully), or want your Garmin data to appear in a unified health app. Garmin Connect is closed to its silo.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Cosa fa FitMesh con Garmin", en: "What FitMesh does with Garmin" },
      },
      {
        type: "list",
        items: {
          it: [
            "Legge i dati Garmin via Health Connect (passi, BPM, sonno totale, calorie, distanza, allenamenti base) — funziona oggi.",
            "Roadmap Q3 2026: integrazione OAuth Garmin Health API per Body Battery, Training Load, Recovery Time, Stress Score e GPS dettagliato.",
            "Dashboard web cross-source: Garmin a fianco di Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Oura quando attivi.",
            "Esportazione CSV/JSON dei dati raccolti.",
          ],
          en: [
            "Reads Garmin data via Health Connect (steps, HR, total sleep, calories, distance, basic workouts) — works today.",
            "Q3 2026 roadmap: Garmin Health API OAuth integration for Body Battery, Training Load, Recovery Time, Stress Score, and detailed GPS.",
            "Cross-source web dashboard: Garmin alongside Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Oura when active.",
            "CSV/JSON export of collected data.",
          ],
        },
      },
      {
        type: "callout",
        variant: "tip",
        title: { it: "Per chi gestisce più wearable", en: "For multi-wearable users" },
        body: {
          it: "Atleta con Garmin per gli allenamenti + Galaxy Watch per la quotidianità? Coppia Oura Ring di notte + Garmin di giorno? FitMesh ti dà una vista unica senza che tu debba scegliere.",
          en: "Athlete with Garmin for workouts + Galaxy Watch daily? Oura Ring at night + Garmin by day? FitMesh gives you a single view without forcing you to choose.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Garmin + altri wearable, una dashboard sola",
          en: "Garmin + other wearables, one single dashboard",
        },
        body: {
          it: "Gratis durante la beta per i primi 100 founder. Funziona oggi via Health Connect.",
          en: "Free during beta for the first 100 founders. Works today via Health Connect.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Vedrò Body Battery e Training Load?",
          en: "Will I see Body Battery and Training Load?",
        },
        a: {
          it: "Non oggi — sono metriche proprietarie Garmin non esposte via Health Connect. Saranno disponibili con l'integrazione OAuth Garmin Health API, in roadmap per Q3 2026 (dipende dall'approvazione Garmin Developer Program).",
          en: "Not today — they're proprietary Garmin metrics not exposed via Health Connect. They'll be available with the Garmin Health API OAuth integration, on the Q3 2026 roadmap (depends on Garmin Developer Program approval).",
        },
      },
      {
        q: {
          it: "Quali Garmin sono supportati?",
          en: "Which Garmin watches are supported?",
        },
        a: {
          it: "Tutti i Garmin compatibili con Garmin Connect Android (dal 2018 in poi): Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, Vivosmart, Vivofit. Verifica che 'Sincronizza con Health Connect' sia attivo nelle impostazioni Garmin Connect.",
          en: "Every Garmin compatible with Garmin Connect Android (from 2018 onwards): Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, Vivosmart, Vivofit. Check that 'Sync with Health Connect' is enabled in Garmin Connect settings.",
        },
      },
      {
        q: {
          it: "Sostituisce Garmin Connect?",
          en: "Does it replace Garmin Connect?",
        },
        a: {
          it: "No, è complementare. Garmin Connect è il punto di riferimento per analisi Garmin-specifiche (Training Effect, Recovery Time, mappe GPS). FitMesh affianca una vista cross-source per chi ha più wearable.",
          en: "No, it's complementary. Garmin Connect remains the reference for Garmin-specific analysis (Training Effect, Recovery Time, GPS maps). FitMesh adds a cross-source view for multi-wearable users.",
        },
      },
    ],
    brandsMentioned: ["Garmin", "Samsung", "Google", "Fitbit", "Oura", "Xiaomi"],
  },
];

export const LANDING_PAGES: LandingPage[] = LANDING_PAGES_RAW;

export const LANDING_PAGES_BY_SLUG: Record<string, LandingPage> = Object.fromEntries(
  LANDING_PAGES.map((p) => [p.slug, p]),
);

export const LANDING_SLUGS: string[] = LANDING_PAGES.map((p) => p.slug);
