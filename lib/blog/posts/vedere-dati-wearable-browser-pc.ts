import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "vedere-dati-wearable-browser-pc",
  category: "guides",
  publishedAt: "2026-05-21",
  updatedAt: "2026-05-21",
  readMinutes: 7,
  primaryKeyword: {
    it: "vedere dati smartwatch su pc",
    en: "view smartwatch data on pc",
  },
  secondaryKeywords: {
    it: [
      "dashboard wearable browser",
      "smartwatch dashboard web",
      "vedere passi pc",
      "vedere sonno computer",
    ],
    en: [
      "wearable dashboard browser",
      "smartwatch web dashboard",
      "view steps pc",
      "view sleep computer",
    ],
  },
  metaDescription: {
    it: "Vuoi vedere passi, sonno e battito del tuo wearable da browser desktop? Quattro vie reali nel 2026, con pro e contro di ciascuna.",
    en: "Want to see steps, sleep and heart rate from your wearable on a desktop browser? Four real paths in 2026, with pros and cons of each.",
  },
  hero: {
    kicker: { it: "Guida pratica", en: "Practical guide" },
    title: {
      it: "Vedere passi, sonno e battito del wearable da browser desktop",
      en: "Viewing steps, sleep and heart rate from your wearable on a desktop browser",
    },
    subtitle: {
      it: "Spoiler: la maggior parte dei produttori ha smesso di investire sulle web dashboard. Ecco cosa funziona davvero oggi.",
      en: "Spoiler: most manufacturers have stopped investing in web dashboards. Here's what actually works today.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Negli anni 2014–2019 era normale loggarsi a Fitbit.com, Polar Flow web, Garmin Connect web e vedere tutto il proprio storico su PC. Negli ultimi 5 anni la tendenza è cambiata: l'esperienza primaria si è spostata sulle app mobile, le web dashboard sono state ridotte (Fitbit.com decommissionato, Samsung Health web mai esistito davvero per Galaxy Watch). Se vuoi una dashboard browser nel 2026, devi cercare attivamente.",
        en: "In 2014–2019 it was normal to log into Fitbit.com, Polar Flow web, Garmin Connect web and see your full history on PC. The trend changed in the last 5 years: primary experience moved to mobile apps, web dashboards were trimmed (Fitbit.com decommissioned, Samsung Health web never really existed for Galaxy Watch). If you want a browser dashboard in 2026, you have to actively look.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Web dashboard ufficiali ancora attive", en: "Official web dashboards still active" },
    },
    {
      type: "table",
      headers: {
        it: ["Brand", "Web dashboard ufficiale", "Cosa vedi"],
        en: ["Brand", "Official web dashboard", "What you see"],
      },
      rows: [
        {
          it: ["Garmin", "connect.garmin.com", "Tutto: attività, sonno, peso, calendario, mappe GPS"],
          en: ["Garmin", "connect.garmin.com", "Everything: activities, sleep, weight, calendar, GPS maps"],
        },
        {
          it: ["Polar", "flow.polar.com", "Attività, sleep, training load, calendario"],
          en: ["Polar", "flow.polar.com", "Activities, sleep, training load, calendar"],
        },
        {
          it: ["Strava", "strava.com", "Tutte le attività, segmenti, mappe, social"],
          en: ["Strava", "strava.com", "All activities, segments, maps, social"],
        },
        {
          it: ["Withings", "healthmate.withings.com", "Peso, sonno, BPM, ECG, attività"],
          en: ["Withings", "healthmate.withings.com", "Weight, sleep, HR, ECG, activity"],
        },
        {
          it: ["Oura", "cloud.ouraring.com", "Sleep, readiness, activity, biorhythm"],
          en: ["Oura", "cloud.ouraring.com", "Sleep, readiness, activity, biorhythm"],
        },
        {
          it: ["Whoop", "app.whoop.com", "Recovery, strain, sleep, calendario"],
          en: ["Whoop", "app.whoop.com", "Recovery, strain, sleep, calendar"],
        },
        {
          it: ["Fitbit", "Solo gestione account (no dashboard)", "Solo profilo / cancellazione"],
          en: ["Fitbit", "Account management only (no dashboard)", "Profile / deletion only"],
        },
        {
          it: ["Samsung Health", "Nessuna web dashboard ufficiale", "—"],
          en: ["Samsung Health", "No official web dashboard", "—"],
        },
        {
          it: ["Apple Health", "Nessuna web dashboard", "—"],
          en: ["Apple Health", "No web dashboard", "—"],
        },
        {
          it: ["Xiaomi Mi Fitness", "Nessuna web dashboard", "—"],
          en: ["Xiaomi Mi Fitness", "No web dashboard", "—"],
        },
        {
          it: ["Huawei Health", "Limitata, regionale (CN)", "—"],
          en: ["Huawei Health", "Limited, regional (CN)", "—"],
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        it: "Notizia importante per chi viene da Fitbit: la dashboard fitbit.com che permetteva di vedere passi e sonno su PC è stata smantellata progressivamente nel 2023–2024. Oggi su fitbit.com c'è solo l'area account/privacy. Stessa cosa per i Galaxy Watch: Samsung non ha mai offerto una vera web dashboard.",
        en: "Important news for ex-Fitbit users: the fitbit.com dashboard that let you see steps and sleep on PC was progressively decommissioned in 2023–2024. Today fitbit.com only has the account/privacy area. Same for Galaxy Watch: Samsung never offered a real web dashboard.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Tre vie per i casi non coperti (Galaxy Watch, Pixel Watch, Mi Band, Apple Watch)",
        en: "Three paths for uncovered cases (Galaxy Watch, Pixel Watch, Mi Band, Apple Watch)",
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "Via 1: app terze con dashboard web", en: "Path 1: third-party apps with web dashboards" },
    },
    {
      type: "paragraph",
      text: {
        it: "Esistono app che leggono via Health Connect (Android) o HealthKit (iOS via iCloud sync separato) e mostrano i dati su una dashboard web associata al tuo account. FitMesh Sync è la nostra soluzione: app Android che legge da Health Connect e push i dati al backend, poi web dashboard accessibile da qualsiasi browser con login Google/Apple. Esistono alternative — alcune più consumer (Welltory), altre più tecniche (Heads Up Health).",
        en: "There are apps reading via Health Connect (Android) or HealthKit (iOS via separate iCloud sync) and showing data on a web dashboard tied to your account. FitMesh Sync is our solution: Android app reading from Health Connect and pushing data to backend, then web dashboard accessible from any browser with Google/Apple login. There are alternatives — some more consumer (Welltory), others more technical (Heads Up Health).",
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "Via 2: home server self-hosted", en: "Path 2: self-hosted home server" },
    },
    {
      type: "paragraph",
      text: {
        it: "Per chi non ha problemi con un Raspberry Pi o un NAS: software open source come Grafana + database custom permettono di importare dati esportati (Apple Health XML, Fitbit Takeout JSON, Garmin FIT) e costruire dashboard browser totalmente private. Curva di apprendimento alta, controllo dati totale.",
        en: "For those comfortable with a Raspberry Pi or NAS: open-source software like Grafana + custom database lets you import exported data (Apple Health XML, Fitbit Takeout JSON, Garmin FIT) and build totally private browser dashboards. High learning curve, total data control.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "Via 3: foglio Google + script", en: "Path 3: Google Sheet + script" },
    },
    {
      type: "paragraph",
      text: {
        it: "La via minimalista: esporta periodicamente dal produttore, importa in Google Sheets, costruisci grafici. Funziona se ti basta vedere passi/peso/sonno con poca granularità. Non scala a dati intraday (BPM al secondo).",
        en: "The minimalist path: periodically export from the manufacturer, import into Google Sheets, build charts. Works if you're fine with low-granularity steps/weight/sleep. Doesn't scale to intraday data (per-second HR).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Decision tree rapido", en: "Quick decision tree" },
    },
    {
      type: "list",
      items: {
        it: [
          "**Hai Garmin / Polar / Strava / Withings / Oura / Whoop?** → Web dashboard ufficiale, fine.",
          "**Hai Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Apple Watch e ti basta visualizzazione?** → App terza con web dashboard (es. FitMesh).",
          "**Vuoi controllo totale e sei tecnico?** → Self-hosted con Grafana + Takeout.",
          "**Vuoi solo numeri base per analisi personale?** → Google Sheets + import periodico.",
        ],
        en: [
          "**Got Garmin / Polar / Strava / Withings / Oura / Whoop?** → Official web dashboard, done.",
          "**Got Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Apple Watch and just need visualization?** → Third-party app with web dashboard (e.g. FitMesh).",
          "**Want total control and you're technical?** → Self-hosted with Grafana + Takeout.",
          "**Just want basic numbers for personal analysis?** → Google Sheets + periodic import.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Cerchi una web dashboard pronta per Galaxy/Pixel/Fitbit/Mi Band?",
        en: "Looking for a ready web dashboard for Galaxy/Pixel/Fitbit/Mi Band?",
      },
      body: {
        it: "FitMesh Sync legge da Health Connect e mostra tutto su una web app pulita accessibile da qualsiasi browser desktop. Niente cloud opachi, niente ads.",
        en: "FitMesh Sync reads from Health Connect and shows everything on a clean web app accessible from any desktop browser. No opaque clouds, no ads.",
      },
      ctaLabel: { it: "Vedi tutte le integrazioni", en: "See all integrations" },
      ctaHref: { it: "/it/integrations", en: "/en/integrations" },
    },
  ],
  faq: [
    {
      q: {
        it: "C'è una web dashboard ufficiale per Samsung Health?",
        en: "Is there an official web dashboard for Samsung Health?",
      },
      a: {
        it: "No. Samsung non ha mai rilasciato una vera dashboard web per Samsung Health. Esiste un portale account su account.samsung.com ma serve solo per gestione account, non per visualizzare attività o sonno.",
        en: "No. Samsung never released a real web dashboard for Samsung Health. There's an account portal at account.samsung.com but it's only for account management, not for viewing activity or sleep.",
      },
    },
    {
      q: {
        it: "Apple Health ha una versione web?",
        en: "Does Apple Health have a web version?",
      },
      a: {
        it: "No. Apple Health è iOS-only e i dati vivono su iPhone (sincronizzati via iCloud tra dispositivi Apple). Non esiste una web dashboard, e Apple non ha annunciato piani in questa direzione.",
        en: "No. Apple Health is iOS-only and data lives on iPhone (synced via iCloud between Apple devices). There's no web dashboard and Apple has no announced plans for one.",
      },
    },
    {
      q: {
        it: "Le app terze possono mostrare anche i dati storici?",
        en: "Can third-party apps show historical data too?",
      },
      a: {
        it: "Dipende. Via Health Connect lo storico disponibile è quello che le app produttore hanno scritto su HC — tipicamente 30–90 giorni indietro al primo connect. Per storico più profondo serve l'export manuale del produttore o (dove esiste) l'OAuth ufficiale con backfill 6–12 mesi.",
        en: "Depends. Via Health Connect the available history is what manufacturer apps wrote to HC — typically 30–90 days back at first connect. For deeper history you need manufacturer manual export or (where it exists) official OAuth with 6–12 month backfill.",
      },
    },
  ],
  related: [
    "guida-sync-wearable-2026",
    "backup-galaxy-watch-pc",
    "esportare-dati-fitbit-google",
  ],
  brandsMentioned: ["Garmin", "Polar", "Strava", "Withings", "Oura", "Whoop", "Fitbit", "Samsung", "Apple", "Xiaomi", "Huawei", "Google"],
  ldType: "BlogPosting",
};
