import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "how-does-health-connect-work",
  category: "guides",
  publishedAt: "2026-05-22",
  updatedAt: "2026-05-22",
  readMinutes: 9,
  primaryKeyword: {
    it: "come funziona health connect",
    en: "how does health connect work",
  },
  secondaryKeywords: {
    it: [
      "health connect android",
      "health connect permessi",
      "health connect api",
      "health connect privacy",
      "come usare health connect",
    ],
    en: [
      "what is health connect android",
      "health connect permissions",
      "health connect api explained",
      "health connect privacy",
      "how to use health connect",
    ],
  },
  metaDescription: {
    it: "Come funziona Health Connect spiegato chiaramente: cos'è, come gestisce i permessi, cosa può e non può fare, e perché è fondamentale per i wearable Android nel 2026.",
    en: "What is Health Connect and how does it actually work? A plain-English guide to Android's health data hub: permissions, data flow, privacy, and what it can't do.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Come funziona Health Connect: guida completa per Android",
      en: "How Does Health Connect Actually Work? The Complete Android Guide",
    },
    subtitle: {
      it: "Health Connect non è una semplice app: è il livello di scambio dati che permette a tutte le app salute Android di parlarsi. Ecco cosa fa davvero, come gestisce i permessi, e cosa succede quando qualcosa va storto.",
      en: "Health Connect isn't just another app — it's the data-sharing layer that lets every Android health app talk to each other. Here's what it really does, how it handles your permissions, and what to check when things go wrong.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Hai un Galaxy Watch, un Pixel Watch, o un qualsiasi wearable Android, e prima o poi ti sei trovato davanti a Health Connect chiedendoti a cosa serve. Non è una dashboard fitness, non ha grafici, e non registra dati da sola. Eppure è il componente che tiene insieme l'ecosistema salute Android. Capire come funziona ti aiuta a risolvere i problemi di sincronizzazione, a controllare chi accede ai tuoi dati, e a capire dove finiscono davvero le tue informazioni di salute.",
        en: "You have a Galaxy Watch, a Pixel Watch, or some other Android wearable. At some point you've stumbled across the Health Connect app and wondered what it's actually for. It has no fitness dashboard, no charts, and it doesn't record any data on its own. Yet it's the component that holds the entire Android health ecosystem together. Understanding how it works helps you fix sync problems, control who accesses your data, and understand where your health information actually goes.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cos'è Health Connect (e cosa non è)",
        en: "What Is Health Connect — and What It Isn't",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect è un'API Android e un'app di sistema distribuita da Google. La sua funzione principale è una sola: permettere alle app salute di scambiare dati in modo controllato, con il consenso esplicito dell'utente per ogni tipo di dato. Non è Google Fit 2.0 (anche se tecnicamente lo ha sostituito). Non è un cloud backup. Non è una dashboard.",
        en: "Health Connect is an Android API and system app distributed by Google. Its one job is to let health apps exchange data with each other in a controlled way — with your explicit consent for each data type. It is not Google Fit 2.0 (even though it technically replaced that project). It is not a cloud backup service. It is not a dashboard.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il paragone più accurato è quello di un quadro elettrico: non produce energia né la consuma, ma decide quali circuiti sono connessi e con quali protezioni. Nessuna app può leggere i tuoi passi da Health Connect senza che tu abbia esplicitamente concesso quel permesso — e puoi revocarlo in qualsiasi momento, tipo per tipo.",
        en: "The most accurate comparison is a circuit breaker panel in your home: it doesn't produce or consume power, but it controls which circuits connect to each other and under what conditions. No app can read your steps from Health Connect without your explicit permission — and you can revoke access at any time, on a per-data-type basis.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Nota tecnica", en: "Worth knowing" },
      body: {
        it: "Health Connect è on-device. I dati non escono verso i server di Google tramite Health Connect. Google potrebbe ricevere dati di salute solo se usi un'app Google (come Fitbit) che legge da Health Connect e poi sincronizza sul cloud — ma Health Connect di per sé è un database locale sul tuo telefono.",
        en: "Health Connect is fully on-device. Your data never leaves to Google's servers via Health Connect itself. Google could only receive your health data if you explicitly use a Google app (like Fitbit) that reads from Health Connect and then syncs to the cloud — but Health Connect itself is just a local database on your phone.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il flusso dati: da dove arrivano e dove vanno",
        en: "How Data Actually Flows: From Wearable to App",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il percorso dei dati in un tipico setup con Galaxy Watch funziona così:",
        en: "Here's how data moves in a typical Galaxy Watch setup — there are more steps than most people expect:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "I sensori del Watch (accelerometro, fotopletismografo, giroscopio) catturano i raw data.",
          "Samsung Health riceve i dati via Bluetooth e li elabora: calcola i passi, la frequenza cardiaca, le fasi del sonno, la SpO2.",
          "Samsung Health scrive una copia dei dati su Health Connect, per i tipi di dato che hai autorizzato.",
          "Health Connect archivia questa copia in un database locale sul telefono.",
          "Qualsiasi app con permesso (FitMesh Sync, Strava, un'app medica, ecc.) legge da Health Connect — non direttamente da Samsung Health.",
        ],
        en: [
          "Watch sensors (accelerometer, photoplethysmograph, gyroscope) capture raw readings.",
          "Samsung Health receives that data over Bluetooth and processes it: calculates steps, heart rate, sleep stages, SpO2.",
          "Samsung Health writes a copy to Health Connect for the data types you've authorized.",
          "Health Connect stores that copy in a local database on your phone.",
          "Any app with permission — FitMesh Sync, Strava, a health coaching app, etc. — reads from Health Connect, not directly from Samsung Health.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Su Pixel Watch il flusso è analogo, con Fitbit (o Google Fit per i device più vecchi) al posto di Samsung Health. Su Garmin il percorso è diverso: Garmin non scrive su Health Connect in modo nativo. Usa un'API OAuth separata, quindi ogni app deve integrarsi direttamente con Garmin Connect.",
        en: "On a Pixel Watch the flow is similar, but Fitbit (or Google Fit on older devices) takes Samsung Health's role as the companion app. On Garmin, the path is different: Garmin doesn't write to Health Connect natively at all. It uses a separate OAuth API, so every app must integrate directly with Garmin Connect to pull your data.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "I tipi di dato che Health Connect gestisce",
        en: "What Data Types Health Connect Supports",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect gestisce decine di tipi di dato organizzati per categoria. Ecco i più rilevanti per chi usa un wearable quotidianamente:",
        en: "Health Connect handles dozens of data types, grouped by category. The ones that matter most for everyday wearable users:",
      },
    },
    {
      type: "table",
      caption: {
        it: "Principali tipi di dato in Health Connect",
        en: "Key data types in Health Connect",
      },
      headers: {
        it: ["Categoria", "Tipi di dato inclusi", "Chi di solito li scrive"],
        en: ["Category", "Data types included", "Who typically writes them"],
      },
      rows: [
        {
          it: ["Attività", "Passi, distanza, calorie attive, minuti attivi", "Samsung Health, Fitbit, Google Fit"],
          en: ["Activity", "Steps, distance, active calories, active minutes", "Samsung Health, Fitbit, Google Fit"],
        },
        {
          it: ["Cardiaco", "BPM, HRV, SpO2, frequenza a riposo", "Samsung Health, Fitbit, Polar Beat"],
          en: ["Heart", "BPM, HRV, SpO2, resting heart rate", "Samsung Health, Fitbit, Polar Beat"],
        },
        {
          it: ["Sonno", "Durata, fasi (leggero/profondo/REM), punteggio", "Samsung Health, Sleep as Android"],
          en: ["Sleep", "Duration, stages (light/deep/REM), score", "Samsung Health, Sleep as Android"],
        },
        {
          it: ["Corpo", "Peso, altezza, BMI, percentuale grasso", "Samsung Health, app bilance smart"],
          en: ["Body", "Weight, height, BMI, body fat percentage", "Samsung Health, smart scale apps"],
        },
        {
          it: ["Allenamenti", "Sessioni GPS, nuoto, ciclismo (con metadati)", "Strava, Samsung Health, Polar Flow"],
          en: ["Workouts", "GPS sessions, swimming, cycling (with metadata)", "Strava, Samsung Health, Polar Flow"],
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        it: "Ogni tipo di dato ha la sua autorizzazione separata. Puoi concedere a un'app il permesso di leggere i passi senza darle accesso ai dati del sonno. Questa granularità è una delle principali differenze rispetto a Google Fit, che aveva permessi molto più grossolani.",
        en: "Each data type has its own separate permission. You can let an app read your step count without giving it access to sleep data. That granularity is one of the biggest practical improvements over Google Fit, which had much coarser permission controls.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come configurare Health Connect e i permessi",
        en: "How to Set Up Health Connect and Manage Permissions",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Su Android 14 e versioni successive, Health Connect è preinstallato come app di sistema. Su Android 12 e 13 è disponibile sul Play Store. Il processo di configurazione base:",
        en: "On Android 14 and later, Health Connect comes pre-installed as a system app. On Android 12 and 13, grab it from the Play Store. The basic setup flow:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri Health Connect (cercala nelle Impostazioni Android → Privacy, oppure nell'app drawer).",
          "Vai su 'Autorizzazioni app': vedrai tutte le app che hanno richiesto accesso ai dati salute.",
          "Per ogni app, espandi per vedere esattamente quali tipi di dato può leggere e quali può scrivere.",
          "Abilita o disabilita i permessi singolarmente.",
          "Se Samsung Health non compare ancora, apri Samsung Health → Impostazioni → Gestione dati → Health Connect e segui il flusso di autorizzazione.",
        ],
        en: [
          "Open Health Connect — find it in Android Settings → Privacy, or search your app drawer.",
          "Go to 'App permissions' to see every installed app that has requested health data access.",
          "Expand any app to see exactly which data types it can read and which it can write.",
          "Enable or disable permissions individually.",
          "If Samsung Health isn't listed yet, open Samsung Health → Settings → Data management → Health Connect and complete the authorization flow.",
        ],
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Permessi disabilitati di default", en: "The default-off problem" },
      body: {
        it: "Su molti Galaxy phone aggiornati prima della metà del 2024, Samsung Health non è autorizzata a scrivere su Health Connect per default. Devi abilitarla manualmente. Questo è il motivo più comune per cui le app terze non vedono i dati del Galaxy Watch, anche quando Samsung Health funziona perfettamente.",
        en: "On many Galaxy phones updated before mid-2024, Samsung Health is not authorized to write to Health Connect by default. You have to enable it manually. This is the single most common reason third-party apps can't see Galaxy Watch data — even when Samsung Health itself is working perfectly. Check this first before anything else.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa Health Connect NON fa (limiti importanti)",
        en: "What Health Connect Cannot Do — Limits Worth Knowing",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Conoscere i limiti è importante quanto capire le funzionalità. Ecco le cose che Health Connect non fa, e che spesso sorprendono chi la usa per la prima volta:",
        en: "Knowing the limits is just as important as understanding the features. These are the things Health Connect doesn't do — they surprise a lot of first-time users:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Non sincronizza retroattivamente**: Health Connect può leggere solo i dati scritti dopo che il permesso è stato concesso. Se autorizzi un'app oggi, non vedrà i tuoi passi di tre anni fa — quelli restano solo nel database di Samsung Health.",
          "**Non è un backup cloud**: se perdi il telefono o fai un factory reset, i dati di Health Connect sono persi. Il backup dipende dall'app companion originale (Samsung Health ha il suo backup cloud separato, se lo hai abilitato).",
          "**Non visualizza nulla**: nessun grafico, nessun trend, nessuna review settimanale. Per visualizzare i dati servono app terze che li leggono da Health Connect.",
          "**Non supporta tutti i brand allo stesso modo**: Garmin, Polar (via app), Suunto e altri non scrivono nativamente su Health Connect. Usano API OAuth separate che ogni app deve integrare individualmente.",
          "**Non sostituisce l'app companion**: non puoi togliere Samsung Health o Galaxy Wearable e aspettarti che la sincronizzazione funzioni. L'app companion deve restare installata e attiva.",
        ],
        en: [
          "**No retroactive sync**: Health Connect can only read data that was written after permission was granted. Authorize an app today and it won't see steps from three years ago — those exist only in Samsung Health's own database.",
          "**No cloud backup**: if you lose your phone or factory reset it, Health Connect data is gone. Backup depends on the companion app that originally wrote the data (Samsung Health has its own cloud backup if you've enabled it).",
          "**No visualizations at all**: no charts, no trends, no weekly summaries. You need third-party apps to actually see your data — Health Connect just stores and shares it.",
          "**Uneven brand support**: Garmin, Polar (via their app), Suunto and several others don't write natively to Health Connect. They use separate OAuth APIs that each app must individually integrate.",
          "**Can't replace your companion app**: you can't uninstall Samsung Health and expect sync to keep working. The companion app must stay installed and active.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Health Connect e la privacy: i fatti reali",
        en: "Health Connect and Privacy: What Actually Happens to Your Data",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il modello di privacy di Health Connect è genuinamente più solido rispetto alle API cloud tradizionali, per due ragioni strutturali. Prima: i dati restano sul dispositivo — Google non ha accesso automatico ai contenuti di Health Connect. Seconda: ogni accesso è registrato con timestamp e nome dell'app, visibile in 'Cronologia accessi ai dati'.",
        en: "Health Connect's privacy model is genuinely stronger than traditional cloud APIs, for two structural reasons. First: your data stays on your device — Google has no automatic access to what's stored in Health Connect. Second: every access is logged with a timestamp and app name, visible under 'Data access history' in the Health Connect app.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il rischio privacy reale viene dalle app che leggono da Health Connect e poi mandano quei dati sui propri server. Un'app di coaching fitness potrebbe leggere la tua HRV e archiviarla nel cloud — ma questo è comportamento dell'app, non di Health Connect. La funzione 'Cronologia accessi' ti aiuta a capire chi accede a cosa e quando, per prendere decisioni informate sui permessi.",
        en: "The real privacy risk comes from apps that read from Health Connect and then upload that data to their own servers. A fitness coaching app might read your HRV and archive it in its cloud — but that's app behavior, not Health Connect behavior. The 'Data access history' view helps you see exactly who is accessing what and when, so you can make informed decisions about which permissions to keep.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Risolvere i problemi più comuni",
        en: "Fixing the Most Common Health Connect Problems",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La maggior parte dei problemi con Health Connect ricade in tre categorie. Prima di cercare soluzioni complesse, verifica in quest'ordine:",
        en: "Most Health Connect issues fall into three buckets. Run through these in order before looking for more complex fixes:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Permesso non concesso**: apri Health Connect → Autorizzazioni app → cerca l'app che non riceve dati → controlla che i tipi rilevanti siano attivi sia in lettura che in scrittura.",
          "**Samsung Health non scrive su Health Connect**: in Samsung Health → Impostazioni → Gestione dati → Health Connect, verifica che la sincronizzazione sia abilitata e che i tipi di dato che ti servono siano spuntati.",
          "**Dati storici mancanti**: per design, Health Connect non sincronizza retroattivamente. Se mancano i dati storici dopo aver installato un'app, considera di esportarli manualmente dall'app companion originale.",
        ],
        en: [
          "**Permission not granted**: open Health Connect → App permissions → find the app not getting data → confirm the relevant data types are enabled for both read and write.",
          "**Samsung Health not writing to Health Connect**: in Samsung Health → Settings → Data management → Health Connect, confirm sync is on and the data types you need are checked.",
          "**Missing historical data**: by design, Health Connect doesn't sync retroactively. If you just installed an app and past data is missing, the only option is to manually export from the original companion app.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi vedere tutti i tuoi dati Health Connect in una dashboard unificata?",
        en: "Want to see all your Health Connect data in one place?",
      },
      body: {
        it: "FitMesh Sync legge i dati da Health Connect e li mostra in una dashboard web accessibile da browser — utile per analizzare trend su schermo grande o condividere dati con un professionista. Compatibile con Galaxy Watch, Pixel Watch e altri wearable Android via Health Connect.",
        en: "FitMesh Sync is one option for users who want to pull their Health Connect data into a clean web dashboard — useful for analyzing trends on a full screen, sharing data with a coach, or comparing metrics across devices. Works with Galaxy Watch, Pixel Watch, and other Android wearables via Health Connect.",
      },
      ctaLabel: {
        it: "Scopri le integrazioni FitMesh →",
        en: "Explore FitMesh integrations →",
      },
      ctaHref: {
        it: "/it/integrations",
        en: "/en/integrations",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Health Connect sostituisce Google Fit?",
        en: "Does Health Connect replace Google Fit?",
      },
      a: {
        it: "Tecnicamente sì. Health Connect è il successore ufficiale dell'API Google Fit. Google ha deprecato Google Fit e ha chiesto agli sviluppatori di migrare entro il 2025. L'app Google Fit esiste ancora ma non riceve nuove funzionalità.",
        en: "Yes — Health Connect is the official successor to the Google Fit API. Google deprecated Google Fit and required developers to migrate by 2025. The Google Fit app still exists but receives no new features. For end users, apps that previously used Google Fit as their data exchange layer now use Health Connect instead.",
      },
    },
    {
      q: {
        it: "Health Connect funziona su iPhone?",
        en: "Does Health Connect work on iPhone?",
      },
      a: {
        it: "No. Health Connect è esclusivamente Android. L'equivalente Apple è HealthKit / Apple Health, che funziona su iPhone e Apple Watch. Le due piattaforme non sono interoperabili nativamente.",
        en: "No — Health Connect is Android-only. The Apple equivalent is HealthKit (Apple Health), which works on iPhone and Apple Watch. The two platforms are not natively interoperable: a Galaxy Watch can't write directly to Apple Health, and an Apple Watch can't write to Health Connect.",
      },
    },
    {
      q: {
        it: "Posso usare Health Connect con Garmin?",
        en: "Does Health Connect work with Garmin?",
      },
      a: {
        it: "Garmin non scrive nativamente su Health Connect. Per portare dati Garmin in un'app terza, quella app deve integrarsi direttamente con la Garmin Connect API (OAuth). FitMesh Sync, per esempio, si integra con Garmin Connect via la loro API ufficiale.",
        en: "Garmin doesn't write natively to Health Connect — the Garmin Connect Android app has no built-in Health Connect sync. To get Garmin data into a third-party app, that app has to integrate directly with the Garmin Connect API via OAuth. FitMesh Sync does this via Garmin's official API. See our [Garmin Connect integration](/en/sync/galaxy-watch) for details.",
      },
    },
    {
      q: {
        it: "I miei dati Health Connect sono al sicuro se perdo il telefono?",
        en: "What happens to my Health Connect data if I lose my phone?",
      },
      a: {
        it: "No, Health Connect non fa backup automatico. Se perdi il telefono o fai un factory reset, i dati locali di Health Connect sono persi. Il backup dipende dall'app companion che li ha scritti originalmente. Dopo il ripristino, i dati torneranno a fluire su Health Connect solo dal momento del ripristino in poi.",
        en: "Health Connect has no automatic backup. If you lose your phone or factory reset it, the local Health Connect data is gone. Your backup coverage depends on the companion app that originally wrote the data — Samsung Health, for example, has its own cloud backup if you've enabled it. After restoring your phone, data will start flowing into Health Connect again from that point forward.",
      },
    },
    {
      q: {
        it: "Perché un'app non vede i miei dati anche se Health Connect funziona?",
        en: "Why can't an app see my data even though Health Connect is working?",
      },
      a: {
        it: "Ci sono tre ragioni comuni. Prima: l'app non ha il permesso per quel tipo specifico di dato. Seconda: Samsung Health non sta scrivendo su Health Connect per quel dato. Terza: i dati che cerchi sono storici e precedenti all'autorizzazione, che Health Connect non sincronizza retroattivamente.",
        en: "Three common reasons: (1) the app doesn't have permission for that specific data type — check Health Connect → App permissions; (2) Samsung Health isn't writing that data type to Health Connect — check Samsung Health → Settings → Health Connect; (3) the data predates when you granted authorization — Health Connect doesn't backfill historical data.",
      },
    },
  ],
  related: [
    "come-funziona-health-connect",
    "passi-non-si-sincronizzano-galaxy-watch",
    "health-connect-vs-samsung-health",
  ],
  brandsMentioned: ["Google", "Samsung", "Garmin", "Fitbit", "Polar"],
  ldType: "BlogPosting",
};
