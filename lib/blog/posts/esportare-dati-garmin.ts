import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "esportare-dati-garmin",
  category: "guides",
  publishedAt: "2026-05-23",
  updatedAt: "2026-05-23",
  readMinutes: 9,
  primaryKeyword: {
    it: "esportare dati garmin",
    en: "export garmin data",
  },
  secondaryKeywords: {
    it: [
      "scaricare allenamenti garmin connect",
      "garmin export gpx tcx fit",
      "garmin connect download attività",
      "garmin dati csv",
      "portare dati garmin altra app",
    ],
    en: [
      "download garmin connect activities",
      "garmin export gpx tcx fit",
      "garmin connect download activities",
      "garmin data csv",
      "transfer garmin data to another app",
    ],
  },
  metaDescription: {
    it: "Come esportare dati Garmin: guida pratica per scaricare allenamenti in GPX, TCX, FIT e CSV da Garmin Connect — sito web, app mobile e API. Pro e contro di ogni metodo.",
    en: "How to export Garmin data: practical guide to downloading activities in GPX, TCX, FIT and CSV from Garmin Connect — website, mobile app and API. Pros and cons of each method.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Esportare dati Garmin: GPX, TCX, FIT e CSV — guida completa",
      en: "Exporting Garmin data: GPX, TCX, FIT and CSV — complete guide",
    },
    subtitle: {
      it: "Garmin tiene i tuoi allenamenti nel proprio cloud, ma i dati sono tuoi. Ecco tutti i modi per tirarli fuori — e gli onesti limiti di ciascuno.",
      en: "Garmin keeps your workouts in its own cloud, but the data is yours. Here are all the ways to get it out — and the honest limitations of each.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Hai migliaia di allenamenti su Garmin Connect e vuoi portarli su Strava, analizzarli su uno strumento terzo, fare un backup autonomo, o semplicemente smettere di dipendere da un solo cloud proprietario. I dati ci sono — Garmin lo permette. Ma il processo non è sempre immediato come si spera, e ci sono differenze importanti tra l'app mobile e il sito web, e tra i vari formati disponibili.",
        en: "You have thousands of workouts on Garmin Connect and you want to transfer them to Strava, analyze them on a third-party tool, do an independent backup, or simply stop depending on a single proprietary cloud. The data is there — Garmin allows it. But the process isn't always as immediate as you'd hope, and there are important differences between the mobile app and website, and between the various available formats.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 1: export singola attività dal sito web",
        en: "Method 1: single activity export from the website",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo è il metodo più diretto per estrarre un'attività specifica. Funziona solo dal sito web — non dall'app mobile. L'app Garmin Connect per Android e iOS non ha la funzione di export individuale.",
        en: "This is the most direct method for extracting a specific activity. It works only from the website — not the mobile app. The Garmin Connect Android and iOS app doesn't have individual export functionality.",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "App mobile vs sito web", en: "Mobile app vs website" },
      body: {
        it: "Esportare GPX o TCX da Garmin richiede il sito web (connect.garmin.com), non l'app mobile. L'app mobile di Garmin Connect non offre export dei dati in nessun formato. Questo è un limite tecnico intenzionale, non un bug.",
        en: "Exporting GPX or TCX from Garmin requires the website (connect.garmin.com), not the mobile app. The Garmin Connect mobile app doesn't offer data export in any format. This is an intentional technical limitation, not a bug.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Vai su connect.garmin.com e accedi con le tue credenziali.",
          "Clicca su 'Attività' nel menu laterale sinistro.",
          "Clicca sull'attività che vuoi esportare per aprirla.",
          "In alto a destra, clicca sull'icona ingranaggio (⚙) o sull'icona tre puntini verticali.",
          "Seleziona 'Esporta originale' per il file FIT originale, oppure 'Esporta come TCX' o 'Esporta come GPX'.",
          "Il file viene scaricato sul tuo computer.",
        ],
        en: [
          "Go to connect.garmin.com and log in with your credentials.",
          "Click 'Activities' in the left sidebar menu.",
          "Click on the activity you want to export to open it.",
          "In the top right, click the gear icon (⚙) or three vertical dots icon.",
          "Select 'Export Original' for the original FIT file, or 'Export as TCX' or 'Export as GPX'.",
          "The file is downloaded to your computer.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Formati di export: GPX, TCX, FIT, CSV — quale scegliere",
        en: "Export formats: GPX, TCX, FIT, CSV — which to choose",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La scelta del formato dipende dall'uso finale. Ognuno porta informazioni diverse e ha compatibilità diverse.",
        en: "Format choice depends on the final use. Each carries different information and has different compatibility.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Confronto formati export Garmin",
        en: "Garmin export format comparison",
      },
      headers: {
        it: ["Formato", "Contiene", "Meglio per", "Limite"],
        en: ["Format", "Contains", "Best for", "Limitation"],
      },
      rows: [
        {
          it: ["FIT (originale)", "Tutto: GPS, HR, cadenza, potenza, dati proprietary Garmin", "Backup completo, re-import in Garmin", "Formato binario, leggibile solo con tool specifici"],
          en: ["FIT (original)", "Everything: GPS, HR, cadence, power, Garmin proprietary data", "Full backup, re-import into Garmin", "Binary format, readable only with specific tools"],
        },
        {
          it: ["GPX", "Traccia GPS, timestamp, HR base", "Mappe, Strava, Komoot, analisi percorso", "Niente potenza, niente cadenza running"],
          en: ["GPX", "GPS track, timestamp, basic HR", "Maps, Strava, Komoot, route analysis", "No power, no running cadence"],
        },
        {
          it: ["TCX", "GPS, HR, calorie, lap, distanza", "Strava (import), Training Peaks", "Meno supportato dei formati moderni"],
          en: ["TCX", "GPS, HR, calories, laps, distance", "Strava (import), Training Peaks", "Less supported than modern formats"],
        },
        {
          it: ["CSV", "Tabelle di riepilogo, no GPS", "Excel, fogli di calcolo, analisi statistiche", "Nessun dato GPS o workout details"],
          en: ["CSV", "Summary tables, no GPS", "Excel, spreadsheets, statistical analysis", "No GPS data or workout details"],
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        it: "Per importare un allenamento su Strava, TCX o GPX vanno bene entrambi — Strava li supporta. Per un backup completo che ti permetta di reimportare in futuro o analizzare con tool come GoldenCheetah o Intervals.icu, il FIT originale è la scelta migliore anche se meno leggibile direttamente.",
        en: "For importing a workout into Strava, both TCX and GPX work fine — Strava supports them. For a complete backup that lets you re-import later or analyze with tools like GoldenCheetah or Intervals.icu, the original FIT file is the best choice even if less directly readable.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 2: export massivo con Garmin Data Management",
        en: "Method 2: bulk export with Garmin Data Management",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per scaricare l'intera storia degli allenamenti in un colpo solo, Garmin ha una funzione di export massivo. Questo è l'equivalente Garmin di un \"Google Takeout\" — ti dà tutto, non solo le attività.",
        en: "To download the entire workout history at once, Garmin has a bulk export function. This is Garmin's equivalent of a 'Google Takeout' — it gives you everything, not just activities.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Accedi a connect.garmin.com.",
          "Clicca sul tuo nome utente in alto a destra → 'Impostazioni account'.",
          "Nella sezione 'Gestione account', cerca 'Esporta i tuoi dati'.",
          "Clicca 'Richiedi dati'. Garmin prepara un archivio ZIP con tutto.",
          "Ricevi un'email con il link di download entro 24-48 ore (per account grandi anche oltre).",
          "L'archivio include tutti gli FIT originali, i dati di salute (battito cardiaco, sonno, passi), le rotte, e le impostazioni del dispositivo.",
        ],
        en: [
          "Log in to connect.garmin.com.",
          "Click your username in the top right → 'Account Settings'.",
          "In the 'Account management' section, find 'Export Your Data'.",
          "Click 'Request Data'. Garmin prepares a ZIP archive with everything.",
          "Receive an email with the download link within 24-48 hours (longer for large accounts).",
          "The archive includes all original FIT files, health data (heart rate, sleep, steps), routes, and device settings.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Dimensioni dell'archivio", en: "Archive size" },
      body: {
        it: "Per chi usa Garmin da anni con attività frequenti, l'archivio può pesare diversi GB. Prepara spazio di storage adeguato prima di richiederlo. Il file più grande tende a essere la cartella dei dati HR granulari (campioni ogni 15 secondi per anni).",
        en: "For people who have been using Garmin for years with frequent activities, the archive can weigh several GB. Prepare adequate storage space before requesting it. The largest file tends to be the folder with granular HR data (samples every 15 seconds for years).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 3: API Garmin Connect (per integrazioni continue)",
        en: "Method 3: Garmin Connect API (for continuous integrations)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se hai bisogno di un flusso continuo di dati — non un export una tantum ma ogni allenamento che finisce su Garmin Compare viene automaticamente inviato da qualche parte — la strada è la Garmin Health API o la Connect API. Attenzione però: non è una strada self-service.",
        en: "If you need a continuous data flow — not a one-time export but every workout that lands on Garmin Connect automatically sent somewhere — the path is the Garmin Health API or Connect API. But beware: this is not a self-service path.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Garmin Connect API**: richiede un'applicazione OAuth approvata da Garmin. Non puoi accedere ai tuoi dati personali via API direttamente senza essere uno sviluppatore approvato con una app registrata. Il processo di approvazione richiede tempo e ha criteri di valutazione.",
          "**App già integrate**: Strava, Training Peaks, Final Surge e alcune altre piattaforme hanno già l'integrazione ufficiale. Puoi autorizzare queste app da Garmin Connect → App e Dispositivi Connessi → Gestisci App.",
          "**FitMesh Sync**: tra i servizi che supportano l'integrazione con Garmin Connect via la loro API ufficiale, permettendo di centralizzare i dati senza doverli esportare manualmente ogni volta.",
        ],
        en: [
          "**Garmin Connect API**: requires an OAuth application approved by Garmin. You can't access your personal data via API directly without being an approved developer with a registered app. The approval process takes time and has evaluation criteria.",
          "**Already-integrated apps**: Strava, Training Peaks, Final Surge and some other platforms already have official integration. You can authorize these apps from Garmin Connect → Connected Apps & Devices → Manage Apps.",
          "**FitMesh Sync**: among the services that support Garmin Connect API integration officially, allowing centralizing data without manual export each time.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Importare i dati Garmin su Strava: step pratici",
        en: "Importing Garmin data into Strava: practical steps",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'import manuale su Strava è uno dei casi d'uso più comuni per l'export Garmin. Ci sono due strade: integrazione diretta (consigliata) o import file (per attività singole o batch).",
        en: "Manual import into Strava is one of the most common use cases for Garmin export. There are two paths: direct integration (recommended) or file import (for single activities or batches).",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Integrazione diretta**: da Garmin Connect → App Connesse → cerca Strava → autorizza. Da quel momento ogni attività viene sincronizzata automaticamente. Non richiede export manuale.",
          "**Import file singolo**: vai su strava.com → menu in alto '+' → 'Carica attività'. Supporta GPX, FIT e TCX. Tieni presente che Strava ha un limite di 25 importazioni/settimana per account free e alcune restrizioni sui dati di potenza.",
          "**Import batch storico**: Strava permette di importare l'archivio completo degli FIT se fai richiesta tramite il loro support (funzione limitata, richiede contatto diretto).",
        ],
        en: [
          "**Direct integration**: from Garmin Connect → Connected Apps → search Strava → authorize. From then on every activity syncs automatically. No manual export needed.",
          "**Single file import**: go to strava.com → '+' menu at top → 'Upload activity'. Supports GPX, FIT and TCX. Note that Strava has a limit of 25 uploads/week for free accounts and some restrictions on power data.",
          "**Historical batch import**: Strava allows importing the full FIT archive if you request it via their support (limited feature, requires direct contact).",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Garmin e Health Connect: la situazione attuale",
        en: "Garmin and Health Connect: the current situation",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Una domanda frequente: Garmin scrive su Health Connect? La risposta attuale (maggio 2026) è: parzialmente. Garmin Connect per Android ha iniziato a supportare la scrittura su Health Connect per alcune metriche di base (passi giornalieri, frequenza cardiaca a riposo, dati di sonno aggregati), ma non per le attività complete con GPS. Per i dati di allenamento completi, la via è ancora l'API OAuth di Garmin, non Health Connect.",
        en: "A frequent question: does Garmin write to Health Connect? The current answer (May 2026) is: partially. Garmin Connect for Android has started supporting Health Connect writing for some basic metrics (daily steps, resting heart rate, aggregated sleep data), but not for complete activities with GPS. For full workout data, the path is still Garmin's OAuth API, not Health Connect.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo significa che app che usano solo Health Connect per leggere dati Garmin vedranno passi e BPM, ma non i dettagli delle uscite in bici o delle corse GPS. Per quelli serve un'integrazione diretta con Garmin Connect API.",
        en: "This means apps that use only Health Connect to read Garmin data will see steps and BPM, but not the details of cycling sessions or GPS runs. For those, direct Garmin Connect API integration is needed.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi portare gli allenamenti Garmin in una dashboard centralizzata?",
        en: "Want to bring Garmin workouts into a centralized dashboard?",
      },
      body: {
        it: "Tra le opzioni che semplificano questo c'è FitMesh Sync: si integra con Garmin Connect via API ufficiale e porta i tuoi allenamenti in una dashboard web accessibile da browser — senza dover esportare file manualmente ogni volta.",
        en: "Among the options that simplify this is FitMesh Sync: it integrates with Garmin Connect via the official API and brings your workouts to a browser-accessible web dashboard — without having to manually export files each time.",
      },
      ctaLabel: {
        it: "Vedi integrazione Garmin su FitMesh →",
        en: "See Garmin integration on FitMesh →",
      },
      ctaHref: {
        it: "/it/sync/garmin",
        en: "/en/sync/garmin",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Posso esportare i dati Garmin dall'app mobile?",
        en: "Can I export Garmin data from the mobile app?",
      },
      a: {
        it: "No. L'app Garmin Connect per Android e iOS non permette di esportare file di attività in nessun formato. Per esportare un'attività devi usare il sito web connect.garmin.com da un browser desktop o mobile. Questa è una limitazione intenzionale di Garmin, non un bug dell'app.",
        en: "No. The Garmin Connect app for Android and iOS doesn't allow exporting activity files in any format. To export an activity you must use the website connect.garmin.com from a desktop or mobile browser. This is an intentional Garmin limitation, not an app bug.",
      },
    },
    {
      q: {
        it: "Qual è la differenza tra GPX e FIT per esportare da Garmin?",
        en: "What's the difference between GPX and FIT when exporting from Garmin?",
      },
      a: {
        it: "FIT è il formato nativo Garmin — contiene tutti i dati originali inclusi metriche proprietarie come Training Load, Body Battery, e i dati di potenza running se il tuo dispositivo li supporta. GPX è uno standard aperto che contiene GPS track e frequenza cardiaca ma perde alcune informazioni proprietarie. Per backup completo usa FIT; per condivisione o import in Strava, GPX o TCX vanno bene entrambi.",
        en: "FIT is Garmin's native format — it contains all original data including proprietary metrics like Training Load, Body Battery, and running power data if your device supports it. GPX is an open standard that contains GPS track and heart rate but loses some proprietary information. For complete backup use FIT; for sharing or Strava import, both GPX or TCX work fine.",
      },
    },
    {
      q: {
        it: "Come scaricare tutti i miei allenamenti Garmin in una volta sola?",
        en: "How to download all my Garmin workouts at once?",
      },
      a: {
        it: "Usa la funzione 'Esporta i tuoi dati' in Impostazioni Account di Garmin Connect web. Ricevi un archivio ZIP con tutti gli FIT originali, di solito entro 24-48 ore. Per anni di dati frequenti l'archivio può pesare diversi GB. In alternativa, strumenti di terze parti come Tapiriik o GarminDB possono scaricare in batch le attività via API (richiedono account Garmin valido).",
        en: "Use the 'Export Your Data' function in Garmin Connect web Account Settings. You receive a ZIP archive with all original FITs, usually within 24-48 hours. For years of frequent data the archive can weigh several GB. Alternatively, third-party tools like Tapiriik or GarminDB can batch-download activities via API (require valid Garmin account).",
      },
    },
    {
      q: {
        it: "I dati Garmin vengono cancellati se smetto di pagare Garmin Connect?",
        en: "Is Garmin data deleted if I stop paying for Garmin Connect?",
      },
      a: {
        it: "Garmin Connect è gratuito — non c'è un abbonamento base per il cloud. Alcune funzionalità avanzate come le mappe di copertura o le analisi avanzate richiedono piani premium, ma i dati di allenamento sono conservati gratuitamente. Se cancelli l'account, i dati vengono eliminati — ecco perché fare un export prima è importante.",
        en: "Garmin Connect is free — there's no basic subscription for the cloud. Some advanced features like coverage maps or advanced analytics require premium plans, but workout data is stored for free. If you delete the account, data is deleted — which is why doing an export first is important.",
      },
    },
    {
      q: {
        it: "Posso importare dati da un vecchio Garmin su uno nuovo senza perdere la storia?",
        en: "Can I import data from an old Garmin to a new one without losing history?",
      },
      a: {
        it: "Sì, ma solo la storia su Garmin Connect (cloud) — non quella sul dispositivo fisico. Quando colleghi un nuovo Garmin allo stesso account Garmin Connect, vedi tutta la tua storia precedente. I file FIT sul vecchio dispositivo (nella cartella Activities della scheda micro-SD o della memoria interna) non vengono automaticamente copiati sul nuovo. Puoi importarli manualmente su Garmin Connect via sito web.",
        en: "Yes, but only the history on Garmin Connect (cloud) — not the one on the physical device. When you connect a new Garmin to the same Garmin Connect account, you see all your previous history. FIT files on the old device (in the Activities folder on the micro-SD or internal memory) are not automatically copied to the new one. You can import them manually on Garmin Connect via the website.",
      },
    },
  ],
  related: [
    "guida-sync-wearable-2026",
    "esportare-dati-fitbit-google",
    "come-funziona-health-connect",
  ],
  brandsMentioned: ["Garmin", "Strava", "Training Peaks", "Google"],
  ldType: "BlogPosting",
};
