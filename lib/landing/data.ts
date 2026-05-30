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
          it: "No, lavora insieme. Samsung Health continua a ricevere dati dal Watch. FitMesh ne legge una copia e la mostra sulla dashboard web. Sono complementari.",
          en: "No, they work together. Samsung Health keeps receiving data from the Watch. FitMesh reads a copy and shows it on the web dashboard. They're complementary.",
        },
      },
      {
        q: {
          it: "E se Samsung Health non condivide tutto con Health Connect?",
          en: "What if Samsung Health doesn't share everything with Health Connect?",
        },
        a: {
          it: "Su telefoni Samsung FitMesh legge i dati direttamente da Samsung Health, oltre che da Health Connect. Così recupera anche le metriche che Samsung Health spesso non passa a Health Connect — in particolare frequenza cardiaca e sonno — più allenamenti, peso, pressione, glicemia e altro quando disponibili. Basta concedere i permessi di lettura una volta dalle impostazioni dell'app.",
          en: "On Samsung phones FitMesh reads data directly from Samsung Health, in addition to Health Connect. This recovers metrics that Samsung Health often doesn't pass to Health Connect — especially heart rate and sleep — plus workouts, weight, blood pressure, glucose and more when available. Just grant read permission once from the app settings.",
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

  // ── 4. Oura Ring Sync ─────────────────────────────────────────────────
  {
    slug: "oura-ring-sync",
    relatedProvider: "oura",
    publishedAt: "2026-05-30",
    updatedAt: "2026-05-30",
    primaryKeyword: {
      it: "sync dati oura ring",
      en: "sync oura ring data",
    },
    secondaryKeywords: {
      it: [
        "oura ring dashboard web",
        "esportare dati oura",
        "oura ring senza abbonamento",
        "oura ring health connect",
      ],
      en: [
        "oura ring web dashboard",
        "export oura data",
        "oura ring without subscription",
        "oura ring health connect android",
      ],
    },
    metaDescription: {
      it: "Dashboard web per Oura Ring: sincronizza sonno, HRV e recupero su una piattaforma tua, senza dipendere dall'app Oura. Setup via Health Connect su Android.",
      en: "Web dashboard for Oura Ring: sync sleep, HRV and recovery to a platform you own, without depending on the Oura app. Health Connect setup on Android.",
    },
    hero: {
      kicker: { it: "Oura Ring + FitMesh", en: "Oura Ring + FitMesh" },
      title: {
        it: "Dashboard web per Oura Ring: sonno e recupero fuori dal silo Oura",
        en: "Web dashboard for Oura Ring: sleep and recovery outside the Oura silo",
      },
      subtitle: {
        it: "Oura è tra i migliori anelli smart per sonno e recupero, ma i tuoi dati stanno chiusi nell'app Oura. Con FitMesh puoi vederli su web insieme agli altri wearable.",
        en: "Oura is among the best smart rings for sleep and recovery, but your data is locked in the Oura app. With FitMesh you can view it on the web alongside your other wearables.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta" },
        href: { it: "/it/beta", en: "/en/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi integrazione Oura", en: "See Oura integration" },
        href: { it: "/it/sync/oura", en: "/en/sync/oura" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Oura Ring è apprezzato da atleti, biohacker e chi vuole monitorare sonno e recupero in modo discreto — niente schermo, niente notifiche, solo sensori. Il problema classico: i dati di Oura rimangono nell'app Oura e nel cloud Oura. Se vuoi vederli su PC, confrontarli con i dati del tuo Galaxy Watch, o avere un backup indipendente, non hai opzioni native facili.",
          en: "Oura Ring is loved by athletes, biohackers, and anyone who wants to monitor sleep and recovery discreetly — no screen, no notifications, just sensors. The classic problem: Oura data stays in the Oura app and Oura cloud. If you want to view it on a PC, compare it with your Galaxy Watch data, or have an independent backup, there are no easy native options.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Come funziona oggi: Oura → Health Connect → FitMesh",
          en: "How it works today: Oura → Health Connect → FitMesh",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "L'app Oura su Android scrive alcuni dati su Health Connect: passi, calorie, sonno (durata totale e fasi base). FitMesh legge da Health Connect, quindi riceve questi dati automaticamente una volta che il collegamento è configurato.",
          en: "The Oura app on Android writes some data to Health Connect: steps, calories, sleep (total duration and basic stages). FitMesh reads from Health Connect, so it receives this data automatically once the connection is configured.",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Disponibile oggi via Health Connect**: passi, calorie, sonno totale con fasi (Profondo, REM, Leggero, Sveglio)",
            "**In roadmap**: integrazione diretta Oura API per Readiness Score, HRV dettagliato, temperature corporea notturna, SpO2 trend",
          ],
          en: [
            "**Available today via Health Connect**: steps, calories, total sleep with stages (Deep, REM, Light, Awake)",
            "**In roadmap**: direct Oura API integration for Readiness Score, detailed HRV, nightly body temperature, SpO2 trend",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Setup in 4 passi",
          en: "Setup in 4 steps",
        },
      },
      {
        type: "list",
        ordered: true,
        items: {
          it: [
            "Installa **FitMesh Sync** dal Play Store e accedi con Google.",
            "Apri l'**app Oura** su Android → Impostazioni → Health Connect → abilita la sincronizzazione per Sonno, Passi, Calorie.",
            "In **Health Connect** → Accesso app e dati → FitMesh Sync → concedi accesso in lettura per Sonno, Passi, Calorie, Frequenza cardiaca.",
            "Apri la **dashboard FitMesh** su web: i tuoi dati Oura sono lì accanto agli altri wearable.",
          ],
          en: [
            "Install **FitMesh Sync** from the Play Store and sign in with Google.",
            "Open the **Oura app** on Android → Settings → Health Connect → enable sync for Sleep, Steps, Calories.",
            "In **Health Connect** → App permissions → FitMesh Sync → grant read access for Sleep, Steps, Calories, Heart Rate.",
            "Open the **FitMesh dashboard** on the web: your Oura data is there alongside other wearables.",
          ],
        },
      },
      {
        type: "callout",
        variant: "tip",
        title: {
          it: "Multi-wearable: Oura + Galaxy Watch insieme",
          en: "Multi-wearable: Oura + Galaxy Watch together",
        },
        body: {
          it: "Molti usano Oura di notte (per sonno e recupero) e un Galaxy Watch o Garmin di giorno (per sport e notifiche). FitMesh unifica tutti e due in una dashboard: il tuo Readiness Score Oura (quando disponibile via API) insieme ai passi e agli allenamenti del Watch.",
          en: "Many people use Oura at night (for sleep and recovery) and a Galaxy Watch or Garmin during the day (for sport and notifications). FitMesh unifies both in one dashboard: your Oura Readiness Score (when available via API) alongside Watch steps and workouts.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Tieni i tuoi dati Oura su una piattaforma tua",
          en: "Keep your Oura data on a platform you own",
        },
        body: {
          it: "100 posti founder gratis durante la beta. App Android + dashboard web. Sync automatico da Oura via Health Connect, roadmap API Oura per metriche avanzate.",
          en: "100 free founder seats during beta. Android app + web dashboard. Automatic sync from Oura via Health Connect, Oura API roadmap for advanced metrics.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Vedrò il Readiness Score di Oura?",
          en: "Will I see Oura's Readiness Score?",
        },
        a: {
          it: "Non oggi — il Readiness Score è una metrica proprietaria Oura non esposta via Health Connect. È in roadmap con l'integrazione OAuth dell'API Oura. Oggi via HC vedi sonno con fasi, passi e calorie.",
          en: "Not today — Readiness Score is a proprietary Oura metric not exposed via Health Connect. It's on the roadmap with OAuth Oura API integration. Today via HC you see sleep with stages, steps, and calories.",
        },
      },
      {
        q: {
          it: "Funziona con Oura Ring 3 e 4?",
          en: "Does it work with Oura Ring 3 and 4?",
        },
        a: {
          it: "Sì, entrambe le generazioni supportano Health Connect via app Oura su Android. L'Oura Ring 4 ha sensori migliorati per temperatura corporea e SpO2 — queste metriche avanzate saranno disponibili con l'integrazione API Oura in roadmap.",
          en: "Yes, both generations support Health Connect via the Oura Android app. Oura Ring 4 has improved sensors for body temperature and SpO2 — these advanced metrics will be available with the roadmap Oura API integration.",
        },
      },
      {
        q: {
          it: "Ho bisogno di abbonamento Oura per usare FitMesh?",
          en: "Do I need an Oura subscription to use FitMesh?",
        },
        a: {
          it: "Per i dati via Health Connect (che sono quelli disponibili oggi), no — Health Connect funziona indipendentemente dall'abbonamento Oura. Per le metriche avanzate tramite API Oura (Readiness Score, HRV dettagliato), potrebbe essere richiesto un account Oura attivo.",
          en: "For Health Connect data (available today), no — Health Connect works independently of Oura subscription. For advanced metrics via Oura API (Readiness Score, detailed HRV), an active Oura account may be required.",
        },
      },
    ],
    brandsMentioned: ["Oura", "Samsung", "Google", "Garmin"],
  },

  // ── 5. Polar Flow Sync ────────────────────────────────────────────────
  {
    slug: "polar-flow-sync",
    relatedProvider: "polar",
    publishedAt: "2026-05-30",
    updatedAt: "2026-05-30",
    primaryKeyword: {
      it: "sync dati polar flow",
      en: "export polar flow data",
    },
    secondaryKeywords: {
      it: [
        "polar flow dashboard alternativa",
        "esportare dati polar",
        "polar heart rate health connect",
        "polar ignite vantage dashboard web",
      ],
      en: [
        "polar flow alternative dashboard",
        "export polar data to web",
        "polar health connect android",
        "polar ignite vantage web dashboard",
      ],
    },
    metaDescription: {
      it: "Dashboard web per Polar Flow: sincronizza allenamenti, frequenza cardiaca e recupero Polar su una piattaforma tua. Setup via Health Connect su Android.",
      en: "Web dashboard for Polar Flow: sync Polar workouts, heart rate and recovery to a platform you own. Health Connect setup on Android.",
    },
    hero: {
      kicker: { it: "Polar + FitMesh", en: "Polar + FitMesh" },
      title: {
        it: "Dashboard web per Polar Flow: i tuoi dati Polar fuori dal silo",
        en: "Web dashboard for Polar Flow: your Polar data outside the silo",
      },
      subtitle: {
        it: "Polar Flow è una piattaforma solida per atleti di endurance, ma i tuoi dati restano chiusi nel cloud Polar. FitMesh li porta su web insieme agli altri wearable.",
        en: "Polar Flow is a solid platform for endurance athletes, but your data stays locked in the Polar cloud. FitMesh brings it to the web alongside your other wearables.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta" },
        href: { it: "/it/beta", en: "/en/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi integrazione Polar", en: "See Polar integration" },
        href: { it: "/it/sync/polar", en: "/en/sync/polar" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Polar è storica nell'endurance sport: cardiofrequenzimetri, GPS per ciclismo e running, analisi del carico allenamento. Il problema comune è lo stesso di molti brand sportivi: i dati vivono in Polar Flow e in Polar Flow soltanto. Se hai anche un Galaxy Watch per la quotidianità, o vuoi vedere tutti i tuoi dati in un unico posto su PC, Polar non ti aiuta in modo nativo.",
          en: "Polar has a long history in endurance sport: heart rate monitors, GPS for cycling and running, training load analysis. The common problem is the same as many sports brands: data lives in Polar Flow and Polar Flow only. If you also have a Galaxy Watch for daily wear, or want all your data in one place on a PC, Polar doesn't help you natively.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Come funziona oggi: Polar → Health Connect → FitMesh",
          en: "How it works today: Polar → Health Connect → FitMesh",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "L'app Polar Flow su Android sincronizza passi, frequenza cardiaca e allenamenti su Health Connect. FitMesh legge da Health Connect, quindi riceve questi dati in automatico.",
          en: "The Polar Flow app on Android syncs steps, heart rate, and workouts to Health Connect. FitMesh reads from Health Connect, so it receives this data automatically.",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Disponibile oggi via Health Connect**: passi, frequenza cardiaca (media e campioni), calorie, allenamenti (tipo, durata, BPM medio, kcal), sonno base",
            "**In roadmap**: integrazione OAuth Polar Accesslink API per Training Load, Nightly Recharge, Recovery Pro, ortostasi",
          ],
          en: [
            "**Available today via Health Connect**: steps, heart rate (average and samples), calories, workouts (type, duration, average HR, kcal), basic sleep",
            "**In roadmap**: OAuth Polar Accesslink API integration for Training Load, Nightly Recharge, Recovery Pro, orthostatic test",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Chi trae più vantaggio da questa integrazione",
          en: "Who benefits most from this integration",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Triatleti e runner con più device**: Polar per gli allenamenti specifici, Galaxy Watch o altro per la quotidianità — FitMesh li unifica.",
            "**Chi vuole backup indipendente da Polar**: storico allenamenti in un cloud europeo (Frankfurt) che non dipende da decision aziendali di Polar.",
            "**Chi analizza i dati su PC**: dashboard web accessibile da browser, senza aprire l'app Polar su telefono.",
            "**Chi usa Polar senza abbonamento premium**: FitMesh non richiede Polar premium per i dati via Health Connect.",
          ],
          en: [
            "**Triathletes and runners with multiple devices**: Polar for specific training, Galaxy Watch or other for daily wear — FitMesh unifies them.",
            "**Those wanting independent Polar backup**: workout history in a European cloud (Frankfurt) not dependent on Polar's corporate decisions.",
            "**Those who analyze data on PC**: browser-accessible web dashboard, without opening the Polar app on phone.",
            "**Those using Polar without premium subscription**: FitMesh doesn't require Polar premium for data via Health Connect.",
          ],
        },
      },
      {
        type: "callout",
        variant: "info",
        title: {
          it: "Polar Accesslink API è in roadmap",
          en: "Polar Accesslink API is in the roadmap",
        },
        body: {
          it: "Le metriche avanzate Polar (Training Load, Nightly Recharge, Recovery Pro) non passano via Health Connect — sono proprietarie. L'integrazione via Polar Accesslink API è in roadmap per Q4 2026, dipende dall'approvazione del Polar Developer Program.",
          en: "Advanced Polar metrics (Training Load, Nightly Recharge, Recovery Pro) don't pass via Health Connect — they're proprietary. Integration via Polar Accesslink API is in the Q4 2026 roadmap, subject to Polar Developer Program approval.",
        },
      },
      {
        type: "cta",
        title: {
          it: "I tuoi dati Polar su una dashboard tua",
          en: "Your Polar data on a dashboard you own",
        },
        body: {
          it: "100 posti founder gratis durante la beta. App Android + dashboard web. Sync automatico da Polar Flow via Health Connect.",
          en: "100 free founder seats during beta. Android app + web dashboard. Automatic sync from Polar Flow via Health Connect.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Quale Polar è compatibile?",
          en: "Which Polar devices are compatible?",
        },
        a: {
          it: "Tutti i dispositivi Polar compatibili con l'app Polar Flow su Android: Vantage M2, V3, Ignite 3, Pacer, Pacer Pro, Grit X2, Unite, e modelli precedenti. L'unico requisito è che la sincronizzazione avvenga tramite app Polar Flow su Android con Health Connect abilitato.",
          en: "All Polar devices compatible with the Polar Flow app on Android: Vantage M2, V3, Ignite 3, Pacer, Pacer Pro, Grit X2, Unite, and older models. The only requirement is sync happening via the Polar Flow Android app with Health Connect enabled.",
        },
      },
      {
        q: {
          it: "Vedrò Training Load e Nightly Recharge?",
          en: "Will I see Training Load and Nightly Recharge?",
        },
        a: {
          it: "Non oggi — sono metriche proprietarie Polar non esposte via Health Connect. Saranno disponibili con l'integrazione Polar Accesslink API in roadmap. Oggi via Health Connect vedi frequenza cardiaca, allenamenti, passi e sonno base.",
          en: "Not today — they're proprietary Polar metrics not exposed via Health Connect. They'll be available with the roadmap Polar Accesslink API integration. Today via Health Connect you see heart rate, workouts, steps, and basic sleep.",
        },
      },
      {
        q: {
          it: "Polar si sovrappone a Garmin? Quale scelgo?",
          en: "Does Polar overlap with Garmin? Which should I choose?",
        },
        a: {
          it: "Dipende dal tuo uso principale. Polar è tradizionalmente forte in running e ciclismo con analisi cardio avanzata (zone HR, soglia lattato). Garmin è più completo per sport di outdoor e ha ecosystem più ampio. Entrambi si integrano con FitMesh via Health Connect, quindi puoi usarli in parallelo se hai device di entrambi i brand.",
          en: "Depends on your primary use. Polar is traditionally strong in running and cycling with advanced cardio analysis (HR zones, lactate threshold). Garmin is more complete for outdoor sports with a broader ecosystem. Both integrate with FitMesh via Health Connect, so you can use them in parallel if you have devices from both brands.",
        },
      },
    ],
    brandsMentioned: ["Polar", "Samsung", "Google", "Garmin"],
  },

  // ── 6. Apple Health Export ────────────────────────────────────────────
  {
    slug: "apple-health-export",
    publishedAt: "2026-05-30",
    updatedAt: "2026-05-30",
    primaryKeyword: {
      it: "esportare dati apple health",
      en: "apple health data export web",
    },
    secondaryKeywords: {
      it: [
        "apple health dashboard web",
        "vedere dati apple health su pc",
        "apple health backup cloud",
        "fitmesh ios iphone",
      ],
      en: [
        "apple health web dashboard",
        "view apple health data on pc",
        "apple health cloud backup",
        "fitmesh ios iphone app",
      ],
    },
    metaDescription: {
      it: "Dashboard web per Apple Health in arrivo su iOS: visualizza passi, sonno, frequenza cardiaca da iPhone su browser. FitMesh iOS beta — iscriviti ora.",
      en: "Web dashboard for Apple Health coming to iOS: view steps, sleep, heart rate from iPhone in a browser. FitMesh iOS beta — sign up now.",
    },
    hero: {
      kicker: { it: "FitMesh iOS", en: "FitMesh iOS" },
      title: {
        it: "Dashboard web per Apple Health — FitMesh iOS in arrivo",
        en: "Web dashboard for Apple Health — FitMesh iOS coming soon",
      },
      subtitle: {
        it: "I tuoi dati da Apple Watch, Garmin, Oura e tutti i wearable che scrivono su Apple Health — su una dashboard web accessibile da qualsiasi browser, senza export manuali.",
        en: "Your data from Apple Watch, Garmin, Oura, and all wearables writing to Apple Health — on a web dashboard accessible from any browser, no manual exports needed.",
      },
      primaryCta: {
        label: { it: "Unisciti alla beta iOS", en: "Join iOS beta" },
        href: { it: "/it/beta", en: "/en/beta" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Apple Health è il sistema più completo per raccogliere dati salute su iPhone. Il problema storico: i dati restano nell'app, senza una web dashboard nativa. Puoi fare l'export XML manuale — ma è un file tecnico che richiede strumenti per essere letto, e devi rifarlo ogni volta. FitMesh iOS cambierà questa situazione.",
          en: "Apple Health is the most comprehensive system for collecting health data on iPhone. The long-standing problem: data stays in the app, with no native web dashboard. You can do a manual XML export — but it's a technical file requiring tools to read, and you have to redo it every time. FitMesh iOS will change this.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Come funzionerà FitMesh iOS",
          en: "How FitMesh iOS will work",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Installi FitMesh Sync su iPhone** — concedi i permessi HealthKit per i tipi di dati che vuoi sincronizzare.",
            "**Sync automatico in background** — FitMesh legge i dati da Apple Health e li invia alla dashboard cloud senza che tu debba fare niente.",
            "**Accedi alla dashboard da qualsiasi browser** — stesso account, stessi dati, da PC, tablet o telefono.",
            "**Multi-wearable unificato** — Apple Watch, Garmin, Oura, Fitbit: se scrivono su Apple Health, FitMesh li aggrega insieme.",
          ],
          en: [
            "**Install FitMesh Sync on iPhone** — grant HealthKit permissions for the data types you want to sync.",
            "**Automatic background sync** — FitMesh reads data from Apple Health and sends it to the cloud dashboard without you doing anything.",
            "**Access dashboard from any browser** — same account, same data, from PC, tablet, or phone.",
            "**Unified multi-wearable** — Apple Watch, Garmin, Oura, Fitbit: if they write to Apple Health, FitMesh aggregates them together.",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Chi ne trarrà più beneficio",
          en: "Who benefits most",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Utenti iPhone + Apple Watch**: storico dati su web, accessibile da PC senza dover usare l'app Health.",
            "**Multi-wearable su iPhone**: Garmin per running + Apple Watch per quotidiano — FitMesh li unifica.",
            "**Caregiver di familiari con iPhone**: dashboard condivisa per vedere i dati salute di chi si vuole bene.",
            "**Chi vuole backup indipendente**: copia dei propri dati Apple Health su server EU (Frankfurt), non nel cloud Apple.",
          ],
          en: [
            "**iPhone + Apple Watch users**: web history accessible from a PC without using the Health app.",
            "**Multi-wearable on iPhone**: Garmin for running + Apple Watch for daily — FitMesh unifies them.",
            "**Caregivers of iPhone family members**: shared dashboard to view health data of loved ones.",
            "**Those wanting independent backup**: copy of Apple Health data on EU server (Frankfurt), not in Apple cloud.",
          ],
        },
      },
      {
        type: "callout",
        variant: "info",
        title: {
          it: "Già disponibile su Android",
          en: "Already available on Android",
        },
        body: {
          it: "FitMesh Sync è già disponibile su Android via Health Connect. Se hai un telefono Android con Galaxy Watch, Garmin, Fitbit o Pixel Watch, puoi iniziare subito. La versione iOS è in sviluppo attivo — iscriviti alla beta per essere tra i primi.",
          en: "FitMesh Sync is already available on Android via Health Connect. If you have an Android phone with Galaxy Watch, Garmin, Fitbit, or Pixel Watch, you can start right now. The iOS version is in active development — join the beta to be among the first.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Iscriviti alla beta iOS — posti limitati",
          en: "Join the iOS beta — limited spots",
        },
        body: {
          it: "Stiamo costruendo FitMesh iOS per portare Apple Health su web. Iscriviti ora e sarai tra i primi a ricevere l'accesso quando sarà pronto.",
          en: "We're building FitMesh iOS to bring Apple Health to the web. Sign up now and you'll be among the first to get access when it's ready.",
        },
        ctaLabel: { it: "Iscriviti alla beta →", en: "Join beta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Quando arriva FitMesh su iOS?",
          en: "When is FitMesh coming to iOS?",
        },
        a: {
          it: "È in sviluppo attivo. La versione beta iOS sarà disponibile dopo il completamento del processo Apple Developer Program e TestFlight. Iscriviti alla lista beta — riceverai un'email non appena i posti saranno disponibili.",
          en: "It's in active development. The iOS beta will be available after completing the Apple Developer Program and TestFlight process. Join the beta list — you'll receive an email as soon as spots are available.",
        },
      },
      {
        q: {
          it: "FitMesh iOS richiede un abbonamento?",
          en: "Does FitMesh iOS require a subscription?",
        },
        a: {
          it: "Durante la beta è gratuito — 100 posti founder. Il modello post-beta è in definizione. L'obiettivo è rimanere accessibile: una dashboard salute non dovrebbe costare quanto un servizio di streaming.",
          en: "During beta it's free — 100 founder spots. The post-beta model is being defined. The goal is to remain accessible: a health dashboard shouldn't cost as much as a streaming service.",
        },
      },
      {
        q: {
          it: "I miei dati Apple Health sono al sicuro con FitMesh?",
          en: "Is my Apple Health data safe with FitMesh?",
        },
        a: {
          it: "I dati vengono trasmessi su HTTPS e archiviati in un database Postgres protetto da RLS (Row Level Security) — ogni utente vede solo i propri dati. Il server è in EU (Frankfurt). Puoi cancellare tutto dai nostri server in qualsiasi momento con 'Elimina account e dati' nell'app. La privacy policy è consultabile su fitmesh.fit.",
          en: "Data is transmitted over HTTPS and stored in a Postgres database protected by RLS (Row Level Security) — each user sees only their own data. Server is in the EU (Frankfurt). You can delete everything from our servers at any time with 'Delete account and data' in the app. Privacy policy is available at fitmesh.fit.",
        },
      },
    ],
    brandsMentioned: ["Apple", "Samsung", "Garmin", "Oura", "Fitbit", "Google"],
  },
];

export const LANDING_PAGES: LandingPage[] = LANDING_PAGES_RAW;

export const LANDING_PAGES_BY_SLUG: Record<string, LandingPage> = Object.fromEntries(
  LANDING_PAGES.map((p) => [p.slug, p]),
);

export const LANDING_SLUGS: string[] = LANDING_PAGES.map((p) => p.slug);
