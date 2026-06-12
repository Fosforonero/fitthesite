import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "come-funziona-health-connect",
  category: "guides",
  publishedAt: "2026-05-22",
  updatedAt: "2026-05-22",
  readMinutes: 9,
  tldr: {
    it: [
      "Health Connect è un database locale on-device: i dati non escono verso Google per via di HC stesso. La privacy dipende dalle app che leggono da HC.",
      "Il flusso tipico è: sensori Watch → app companion (Samsung Health, Fitbit) → Health Connect → app terze. Ogni step richiede permessi espliciti.",
      "Garmin non scrive su Health Connect in modo nativo: le app che vogliono dati Garmin devono integrarsi con la Garmin Connect API separatamente.",
      "Health Connect non sincronizza retroattivamente: i dati precedenti all'autorizzazione restano solo nell'app companion originale.",
      "Il problema di sync più comune non è un bug hardware: è un permesso mancante in Health Connect. Verifica lì per primo.",
    ],
    en: [
      "Health Connect is a local on-device database: data doesn't leave to Google via HC itself. Privacy depends on the apps reading from HC.",
      "The typical flow is: Watch sensors → companion app (Samsung Health, Fitbit) → Health Connect → third-party apps. Each step requires explicit permissions.",
      "Garmin doesn't write to Health Connect natively: apps wanting Garmin data must integrate with the Garmin Connect API separately.",
      "Health Connect doesn't sync retroactively: data predating the authorization stays only in the original companion app.",
      "The most common sync problem isn't a hardware bug: it's a missing permission in Health Connect. Check there first.",
    ],
  },
  primaryKeyword: {
    it: "come funziona health connect",
    en: "how does health connect work",
  },
  secondaryKeywords: {
    it: [
      "health connect android",
      "health connect permessi",
      "health connect dati salute",
      "health connect api",
      "come usare health connect",
    ],
    en: [
      "health connect android",
      "health connect permissions",
      "health connect health data",
      "health connect api",
      "how to use health connect",
    ],
  },
  metaDescription: {
    it: "Come funziona Health Connect spiegato in modo chiaro: cos'è, come gestisce i permessi tra app, cosa può e non può fare, e perché è fondamentale per i wearable Android nel 2026.",
    en: "How Health Connect works explained clearly: what it is, how it manages app permissions, what it can and cannot do, and why it's essential for Android wearables in 2026.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Come funziona Health Connect: guida Android 2026",
      en: "How Health Connect works: the complete guide for Android",
    },
    subtitle: {
      it: "Health Connect non è una semplice app: è il livello di scambio dati che permette a tutte le app salute Android di parlarsi. Ecco cosa fa davvero, come gestisce i tuoi permessi, e cosa succede quando qualcosa non funziona.",
      en: "Health Connect is not just an app: it's the data exchange layer that lets all Android health apps communicate. Here's what it actually does, how it manages your permissions, and what happens when something doesn't work.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Health Connect non è una dashboard fitness: è il livello di scambio dati che permette a tutte le app salute Android di parlarsi, e capire come funziona risolve il 90% dei problemi di sincronizzazione. Non ha grafici, non registra dati da sola, ma decide chi può leggere i tuoi passi, il BPM, il sonno (tipo per tipo, con il tuo consenso esplicito). Se i dati del tuo Galaxy Watch non arrivano in un'app terza, quasi certamente il problema è un permesso non concesso in Health Connect, non un bug hardware.",
        en: "Health Connect is not a fitness dashboard: it's the data exchange layer that lets all Android health apps communicate, and understanding how it works resolves 90% of sync problems. It has no charts, records no data on its own, but decides who can read your steps, HR, sleep (type by type, with your explicit consent). If your Galaxy Watch data isn't reaching a third-party app, the problem is almost certainly a missing permission in Health Connect, not a hardware bug.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cos'è Health Connect (e cosa non è)",
        en: "What Health Connect is (and what it isn't)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect è un'API Android e un'app di sistema distribuita da Google. La sua funzione principale è una sola: permettere alle app salute di scambiare dati tra loro in modo controllato, con il tuo consenso esplicito per ogni tipo di dato. Non è Google Fit versione due (anche se tecnicamente ha sostituito quel progetto). Non è un cloud backup. Non è una dashboard.",
        en: "Health Connect is an Android API and system app distributed by Google. Its main function is one thing: letting health apps exchange data between each other in a controlled way, with your explicit consent for each data type. It's not Google Fit version two (even though technically it replaced that project). It's not a cloud backup. It's not a dashboard.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il paragone più accurato è quello di un quadro elettrico: non produce energia, non la consuma, ma decide quali circuiti sono connessi tra loro e con quali protezioni. Un'app non può leggere i tuoi passi da Health Connect senza che tu le abbia esplicitamente concesso quel permesso, e puoi revocarlo in qualsiasi momento, tipo per tipo.",
        en: "The most accurate comparison is an electrical panel: it doesn't produce energy, doesn't consume it, but decides which circuits are connected to each other and with what protections. An app can't read your steps from Health Connect without your explicit permission, and you can revoke it at any time, type by type.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Nota tecnica", en: "Technical note" },
      body: {
        it: "Health Connect è on-device. I dati non escono mai verso i server Google per via di Health Connect. Google potrebbe ricevere i tuoi dati salute solo se usi esplicitamente un'app Google (come Google Fit o Fitbit) che legge da HC e poi sincronizza sul cloud. Health Connect di per sé è un database locale sul tuo telefono.",
        en: "Health Connect is on-device. Data never leaves to Google's servers via Health Connect. Google could receive your health data only if you explicitly use a Google app (like Google Fit or Fitbit) that reads from HC and then syncs to the cloud. Health Connect itself is a local database on your phone.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il flusso dati: da dove arrivano e dove vanno",
        en: "The data flow: where data comes from and where it goes",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il flusso reale dei dati in un setup tipico con Galaxy Watch funziona così:",
        en: "The actual data flow in a typical Galaxy Watch setup works like this:",
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
          "Health Connect tiene questa copia in un database locale sul telefono.",
          "Qualsiasi app che ha ricevuto permesso (FitMesh Sync, Strava, un'app del medico, etc.) legge da Health Connect, non direttamente da Samsung Health.",
        ],
        en: [
          "Watch sensors (accelerometer, photoplethysmograph, gyroscope) capture raw data.",
          "Samsung Health receives data via Bluetooth and processes it: calculates steps, heart rate, sleep phases, SpO2.",
          "Samsung Health writes a copy of the data to Health Connect, for the data types you've authorized.",
          "Health Connect holds this copy in a local database on the phone.",
          "Any app that has been granted permission (FitMesh Sync, Strava, a doctor's app, etc.) reads from Health Connect, not directly from Samsung Health.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Su Pixel Watch il flusso è analogo, con Fitbit (o Google Fit, per i device più vecchi) al posto di Samsung Health come app companion. Su Garmin il percorso è diverso: Garmin non scrive su Health Connect in modo nativo, ma usa una API OAuth separata. Ogni app deve integrarsi con Garmin Connect direttamente.",
        en: "On Pixel Watch the flow is similar, with Fitbit (or Google Fit, for older devices) replacing Samsung Health as the companion app. On Garmin the path is different: Garmin doesn't write to Health Connect natively, but uses a separate OAuth API. Each app must integrate with Garmin Connect directly.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "I tipi di dato che Health Connect gestisce",
        en: "The data types Health Connect manages",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect gestisce decine di tipi di dato, organizzati per categoria. I più rilevanti per chi usa un wearable quotidianamente:",
        en: "Health Connect manages dozens of data types, organized by category. The most relevant for everyday wearable users:",
      },
    },
    {
      type: "table",
      caption: {
        it: "Principali tipi di dato in Health Connect",
        en: "Main data types in Health Connect",
      },
      headers: {
        it: ["Categoria", "Tipi di dato inclusi", "Chi di solito li scrive"],
        en: ["Category", "Data types included", "Who usually writes them"],
      },
      rows: [
        {
          it: ["Attività", "Passi, distanza, calorie attive, minuti attivi", "Samsung Health, Fitbit, Google Fit"],
          en: ["Activity", "Steps, distance, active calories, active minutes", "Samsung Health, Fitbit, Google Fit"],
        },
        {
          it: ["Cardiaco", "BPM, HRV, SpO2, frequenza a riposo", "Samsung Health, Fitbit, Polar Beat"],
          en: ["Cardiac", "BPM, HRV, SpO2, resting heart rate", "Samsung Health, Fitbit, Polar Beat"],
        },
        {
          it: ["Sonno", "Durata, fasi (leggero/profondo/REM), punteggio", "Samsung Health, Sleep as Android"],
          en: ["Sleep", "Duration, phases (light/deep/REM), score", "Samsung Health, Sleep as Android"],
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
        it: "Ogni tipo di dato ha la sua autorizzazione separata. Puoi concedere a un'app il permesso di leggere i passi senza darle accesso al sonno. Questa granularità è una delle differenze sostanziali rispetto a Google Fit, che aveva permessi molto più grossolani.",
        en: "Each data type has its own separate permission. You can grant an app permission to read steps without giving it access to sleep data. This granularity is one of the substantial differences from Google Fit, which had much coarser permissions.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come attivare Health Connect e configurare i permessi",
        en: "How to activate Health Connect and configure permissions",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Su Android 14 e successivi, Health Connect è preinstallato come app di sistema. Su Android 12 e 13 è disponibile sul Play Store come app separata. Il processo di configurazione base è:",
        en: "On Android 14 and later, Health Connect is preinstalled as a system app. On Android 12 and 13, it's available on the Play Store as a separate app. The basic setup process is:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri Health Connect (puoi trovarla nelle impostazioni Android, sezione 'Privacy', oppure cercandola nel cassetto app).",
          "Vai su 'Autorizzazioni app': vedrai tutte le app installate che hanno chiesto accesso ai dati salute.",
          "Per ogni app, puoi espandere e vedere esattamente quali tipi di dato può leggere e quali può scrivere.",
          "Attiva o disattiva i permessi singolarmente.",
          "Se un'app come Samsung Health non appare ancora, apri Samsung Health → Impostazioni → Gestione dati → Health Connect e segui il flusso di autorizzazione.",
        ],
        en: [
          "Open Health Connect (you can find it in Android settings, under 'Privacy', or by searching in the app drawer).",
          "Go to 'App permissions': you'll see all installed apps that have requested access to health data.",
          "For each app, you can expand and see exactly which data types it can read and which it can write.",
          "Enable or disable permissions individually.",
          "If an app like Samsung Health doesn't appear yet, open Samsung Health → Settings → Data management → Health Connect and follow the authorization flow.",
        ],
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Attenzione: permessi di default", en: "Attention: default permissions" },
      body: {
        it: "Su molti Galaxy phone aggiornati a metà 2024 o prima, Samsung Health non è autorizzata a scrivere su Health Connect per default. Devi abilitarlo manualmente. Questo è il motivo più comune per cui le app terze non vedono i dati del Galaxy Watch, anche se Samsung Health funziona perfettamente.",
        en: "On many Galaxy phones updated before mid-2024, Samsung Health is not authorized to write to Health Connect by default. You need to enable it manually. This is the most common reason third-party apps don't see Galaxy Watch data, even when Samsung Health works perfectly.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa Health Connect non fa (limiti importanti da conoscere)",
        en: "What Health Connect doesn't do (important limits to know)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Conoscere i limiti è importante quanto capire le funzionalità. Ecco le cose che Health Connect non fa, e che spesso sorprendono chi la usa per la prima volta:",
        en: "Knowing the limits is as important as understanding the features. Here are things Health Connect doesn't do, which often surprise first-time users:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Non sincronizza retroattivamente**: Health Connect può leggere solo i dati scritti dopo che il permesso è stato concesso. Se autorizzi un'app oggi, non vedrà i tuoi passi di tre anni fa: quelli restano solo nel database di Samsung Health (o Fitbit, etc.).",
          "**Non è un cloud backup**: se perdi il telefono o fai un factory reset, i dati in Health Connect sono persi. Il backup dipende dall'app che ha scritto quei dati (es. Samsung Health ha il suo cloud backup separato).",
          "**Non fa visualizzazioni**: nessun grafico, nessuna tendenza, nessuna settimana in review. Per visualizzare i dati servono app terze che li leggono da HC.",
          "**Non supporta tutti i brand allo stesso modo**: Garmin, Polar (via app), Suunto e alcuni altri non scrivono nativamente su Health Connect. Il loro punto di accesso è una API OAuth separata che ogni app deve integrare individualmente.",
          "**Non sostituisce l'app companion**: non puoi usare solo Health Connect per tenere in vita la sincronizzazione del Watch. Samsung Health (o Fitbit, o Galaxy Wearable) deve rimanere installata e attiva.",
        ],
        en: [
          "**Doesn't sync retroactively**: Health Connect can only read data written after permission was granted. If you authorize an app today, it won't see your steps from three years ago: those remain only in the Samsung Health (or Fitbit, etc.) database.",
          "**Is not a cloud backup**: if you lose your phone or do a factory reset, data in Health Connect is lost. Backup depends on the app that wrote that data (e.g. Samsung Health has its own separate cloud backup).",
          "**Doesn't do visualizations**: no charts, no trends, no weekly reviews. To visualize data you need third-party apps that read from HC.",
          "**Doesn't support all brands equally**: Garmin, Polar (via app), Suunto and some others don't write natively to Health Connect. Their access point is a separate OAuth API that each app must integrate individually.",
          "**Doesn't replace the companion app**: you can't use only Health Connect to keep Watch sync alive. Samsung Health (or Fitbit, or Galaxy Wearable) must remain installed and active.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Health Connect e la privacy: cosa succede davvero ai tuoi dati",
        en: "Health Connect and privacy: what actually happens to your data",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il modello di privacy di Health Connect è genuinamente più solido rispetto a quello delle API cloud tradizionali, per due motivi strutturali. Primo: i dati restano sul dispositivo (Google non ha accesso automatico ai contenuti di Health Connect). Secondo: ogni accesso è loggato con timestamp e nome dell'app, e puoi vederlo in 'Cronologia accessi ai dati'.",
        en: "The privacy model of Health Connect is genuinely stronger compared to traditional cloud APIs, for two structural reasons. First: data stays on the device (Google doesn't have automatic access to Health Connect contents). Second: every access is logged with timestamp and app name, and you can see it in 'Data access history'.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il rischio privacy, quando esiste, viene dalle app che leggono da Health Connect e poi mandano quei dati sui loro server. Un'app di coaching fitness potrebbe leggere la tua HRV e archiviarla nel suo cloud: questo è un comportamento dell'app, non di Health Connect. La funzione 'Cronologia accessi ai dati' ti aiuta a capire chi sta accedendo a cosa e quando, permettendoti di prendere decisioni informate su quali permessi mantenere.",
        en: "The privacy risk, when it exists, comes from apps that read from Health Connect and then send that data to their servers. A fitness coaching app might read your HRV and archive it in its cloud: this is app behavior, not Health Connect behavior. The 'Data access history' feature helps you understand who is accessing what and when, allowing informed decisions about which permissions to keep.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "Il problema dei permessi viene sempre prima dell'hardware", en: "The permission problem always comes before hardware" },
      body: {
        it: "Il 90% delle segnalazioni 'il mio Galaxy Watch non sincronizza con [app]' ha una causa identica: Samsung Health non è autorizzata a scrivere su Health Connect, oppure l'app terza non ha il permesso di lettura per quel tipo di dato. Controllare Health Connect dovrebbe essere il PRIMO passo, non l'ultimo. Prima di reinstallare app, resettare il Watch o aprire ticket di supporto, apri Health Connect → Autorizzazioni app e verifica tutto in 2 minuti.",
        en: "90% of 'my Galaxy Watch isn't syncing with [app]' reports have an identical cause: Samsung Health isn't authorized to write to Health Connect, or the third-party app doesn't have read permission for that data type. Checking Health Connect should be the FIRST step, not the last. Before reinstalling apps, resetting the Watch, or opening support tickets, open Health Connect → App permissions and verify everything in 2 minutes.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Risolvere i problemi più comuni",
        en: "Solving the most common problems",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La maggior parte dei problemi con Health Connect ricade in tre categorie. Prima di cercare soluzioni complesse, verifica in quest'ordine:",
        en: "Most Health Connect problems fall into three categories. Before looking for complex solutions, check in this order:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Permesso non concesso**: apri Health Connect → Autorizzazioni app → cerca l'app che non riceve dati → controlla che i tipi rilevanti siano attivi sia in lettura che in scrittura.",
          "**Samsung Health non scrive su HC**: in Samsung Health → Impostazioni → Gestione dati → Health Connect, verifica che la sincronizzazione sia abilitata e che i tipi di dato che ti servono siano spuntati.",
          "**Dati storici mancanti**: per design, HC non sincronizza retroattivamente. Se hai appena installato un'app e mancano i dati storici, considera di esportarli manualmente dall'app companion originale.",
        ],
        en: [
          "**Permission not granted**: open Health Connect → App permissions → find the app not receiving data → verify that the relevant types are enabled for both read and write.",
          "**Samsung Health not writing to HC**: in Samsung Health → Settings → Data management → Health Connect, verify that sync is enabled and the data types you need are checked.",
          "**Missing historical data**: by design, HC doesn't sync retroactively. If you just installed an app and historical data is missing, consider manually exporting it from the original companion app.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "In sintesi", en: "In summary" },
    },
    {
      type: "list",
      items: {
        it: [
          "Health Connect è un database locale on-device: i dati non escono verso Google per via di HC stesso. La privacy dipende dalle app che leggono da HC, non da HC in sé.",
          "Il flusso tipico è: sensori Watch → app companion (Samsung Health, Fitbit) → Health Connect → app terze. Ogni step richiede permessi espliciti.",
          "Garmin non scrive su Health Connect in modo nativo: le app che vogliono dati Garmin devono integrarsi con la Garmin Connect API separatamente.",
          "Health Connect non sincronizza retroattivamente: i dati precedenti all'autorizzazione restano solo nell'app companion originale.",
          "Il problema di sync più comune non è un bug hardware: è un permesso mancante in Health Connect. Verifica lì per primo.",
        ],
        en: [
          "Health Connect is a local on-device database: data doesn't leave to Google via HC itself. Privacy depends on apps reading from HC, not on HC itself.",
          "The typical flow is: Watch sensors → companion app (Samsung Health, Fitbit) → Health Connect → third-party apps. Each step requires explicit permissions.",
          "Garmin doesn't write to Health Connect natively: apps wanting Garmin data must integrate with the Garmin Connect API separately.",
          "Health Connect doesn't sync retroactively: data predating the authorization stays only in the original companion app.",
          "The most common sync problem isn't a hardware bug: it's a missing permission in Health Connect. Check there first.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi vedere tutti i tuoi dati Health Connect in una dashboard unificata?",
        en: "Want to see all your Health Connect data in a unified dashboard?",
      },
      body: {
        it: "FitMesh Sync legge i dati da Health Connect e li mostra in una dashboard web pulita, accessibile da browser. Utile se vuoi analizzare trend su schermo grande o condividere dati con un professionista. Compatibile con Galaxy Watch, Pixel Watch, e altri wearable Android via Health Connect.",
        en: "FitMesh Sync reads data from Health Connect and shows it in a clean web dashboard, accessible from browser. Useful if you want to analyze trends on a large screen or share data with a professional. Compatible with Galaxy Watch, Pixel Watch, and other Android wearables via Health Connect.",
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
        it: "Tecnicamente sì: Health Connect è il successore ufficiale dell'API di Google Fit. Google ha deprecato Google Fit e ha chiesto agli sviluppatori di migrare su Health Connect entro il 2025. L'app Google Fit esiste ancora ma non riceve nuove funzionalità. Per gli utenti finali, questo significa che le app che usavano Google Fit come livello di scambio ora usano (o dovrebbero usare) Health Connect.",
        en: "Technically yes: Health Connect is the official successor to the Google Fit API. Google deprecated Google Fit and asked developers to migrate to Health Connect by 2025. The Google Fit app still exists but receives no new features. For end users, this means apps that used Google Fit as an exchange layer now use (or should use) Health Connect.",
      },
    },
    {
      q: {
        it: "Health Connect funziona su iPhone?",
        en: "Does Health Connect work on iPhone?",
      },
      a: {
        it: "No. Health Connect è esclusivamente Android (Google). L'equivalente Apple è HealthKit / Apple Health, che funziona su iPhone e Apple Watch. Le due piattaforme non sono interoperabili nativamente: un Galaxy Watch non può scrivere su Apple Health direttamente, e un Apple Watch non può scrivere su Health Connect.",
        en: "No. Health Connect is exclusively Android (Google). The Apple equivalent is HealthKit / Apple Health, which works on iPhone and Apple Watch. The two platforms are not natively interoperable: a Galaxy Watch can't write to Apple Health directly, and an Apple Watch can't write to Health Connect.",
      },
    },
    {
      q: {
        it: "Posso usare Health Connect con Garmin Connect?",
        en: "Can I use Health Connect with Garmin Connect?",
      },
      a: {
        it: "Garmin non scrive nativamente su Health Connect. L'app Garmin Connect per Android non ha una funzione di sync nativa verso HC. Per portare i dati Garmin in un'app terza, quella app deve integrarsi direttamente con la Garmin Connect API (OAuth). Alcune app lo fanno; FitMesh Sync, per esempio, si integra con Garmin Connect via la loro API ufficiale.",
        en: "Garmin doesn't write natively to Health Connect. The Garmin Connect app for Android doesn't have a native sync function to HC. To bring Garmin data into a third-party app, that app must integrate directly with the Garmin Connect API (OAuth). Some apps do this; FitMesh Sync, for example, integrates with Garmin Connect via their official API.",
      },
    },
    {
      q: {
        it: "I dati in Health Connect sono sicuri se perdo il telefono?",
        en: "Is data in Health Connect safe if I lose my phone?",
      },
      a: {
        it: "No, Health Connect non fa backup automatico dei dati. Se perdi il telefono o fai un factory reset, i dati locali di Health Connect sono persi. Il backup dei dati dipende dall'app companion che li ha scritti originalmente (es. Samsung Health ha il suo backup cloud separato se lo hai abilitato). Dopo il ripristino del telefono, i dati torneranno a fluire su Health Connect dal momento del ripristino in poi.",
        en: "No, Health Connect doesn't automatically back up data. If you lose your phone or do a factory reset, local Health Connect data is lost. Data backup depends on the companion app that originally wrote it (e.g. Samsung Health has its own cloud backup if you enabled it). After phone restore, data will start flowing to Health Connect again from the restore moment onwards.",
      },
    },
    {
      q: {
        it: "Perché alcune app non vedono i miei dati anche se Health Connect funziona?",
        en: "Why don't some apps see my data even though Health Connect works?",
      },
      a: {
        it: "Ci sono tre ragioni comuni. Prima: l'app non ha il permesso per quel tipo specifico di dato (controlla in Health Connect → Autorizzazioni app). Seconda: Samsung Health (o l'app companion) non sta scrivendo su Health Connect per quel dato (verifica la configurazione in Samsung Health → Impostazioni → Health Connect). Terza: i dati che cerchi sono storici e precedenti all'autorizzazione. Health Connect non sincronizza retroattivamente i dati passati.",
        en: "There are three common reasons. First: the app doesn't have permission for that specific data type (check in Health Connect → App permissions). Second: Samsung Health (or the companion app) isn't writing to Health Connect for that data (verify settings in Samsung Health → Settings → Health Connect). Third: the data you're looking for is historical and predates the authorization. Health Connect doesn't retroactively sync past data.",
      },
    },
  ],
  related: [
    "health-connect-vs-samsung-health",
    "guida-sync-wearable-2026",
    "passi-non-si-sincronizzano-galaxy-watch",
  ],
  brandsMentioned: ["Google", "Samsung", "Garmin", "Fitbit", "Polar"],
  ldType: "BlogPosting",
};
