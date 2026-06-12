import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "esportare-dati-fitbit-google",
  category: "ecosystem",
  publishedAt: "2026-05-21",
  updatedAt: "2026-05-21",
  readMinutes: 8,
  tldr: {
    it: [
      "Dopo la migrazione del 2023, i dati Fitbit vivono su Google: l'export si fa via Google Takeout (takeout.google.com), non più da Fitbit.com.",
      "Google Takeout è il metodo più completo: include tutta la storia in JSON/CSV, dalle attività al sonno agli HR a cadenza per minuto.",
      "Health Connect è il metodo per il flusso continuo: dall'app Fitbit a HC, qualsiasi app Android con permessi HC può leggere i dati.",
      "Limite HC per Fitbit: le fasi del sonno (REM/Deep/Light) non sono esposte in modo granulare; GPS e VO₂ max richiedono la Fitbit Web API.",
      "Prima di chiudere l'account: esporta via Takeout, poi richiedi la cancellazione GDPR. Mai nell'ordine inverso.",
    ],
    en: [
      "After the 2023 migration, Fitbit data lives on Google: export goes via Google Takeout (takeout.google.com), no longer from Fitbit.com.",
      "Google Takeout is the most complete method: it includes the full history in JSON/CSV, from activities to sleep to per-minute HR.",
      "Health Connect is the method for continuous flow: from the Fitbit app to HC, any Android app with HC permissions can read the data.",
      "HC limit for Fitbit: sleep phases (REM/Deep/Light) are not exposed granularly; GPS and VO₂ max require the Fitbit Web API.",
      "Before closing the account: export via Takeout, then request GDPR deletion. Never in the reverse order.",
    ],
  },
  primaryKeyword: {
    it: "esportare dati fitbit dopo google",
    en: "export fitbit data after google",
  },
  secondaryKeywords: {
    it: [
      "fitbit google takeout",
      "fitbit account migrazione",
      "scaricare dati fitbit",
      "fitbit dati storico",
    ],
    en: [
      "fitbit google takeout",
      "fitbit account migration",
      "download fitbit data",
      "fitbit data history",
    ],
  },
  metaDescription: {
    it: "Dopo l'acquisizione Fitbit da parte di Google: come esportare i tuoi dati Fitbit nel 2026, cosa cambia se hai migrato a Google Account, alternative pratiche.",
    en: "After Google's Fitbit acquisition: how to export your Fitbit data in 2026, what changes if you migrated to a Google Account, practical alternatives.",
  },
  hero: {
    kicker: { it: "Ecosistema", en: "Ecosystem" },
    title: {
      it: "Esportare dati Fitbit dopo l'acquisto Google",
      en: "Exporting Fitbit data after the Google acquisition: practical guide",
    },
    subtitle: {
      it: "Google ha comprato Fitbit nel 2021, ha unificato account nel 2023, ha sostituito Fitbit.com con strumenti Google. Dove vanno i tuoi dati e come li porti via.",
      en: "Google bought Fitbit in 2021, unified accounts in 2023, replaced Fitbit.com with Google tools. Where your data goes and how to take it out.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Esportare i dati Fitbit nel 2026 è più semplice di quanto sembri, ma richiede di capire una cosa fondamentale: dopo l'acquisizione Google e la migrazione forzata del 2023, i tuoi dati Fitbit vivono nell'infrastruttura Google e si scaricano via Google Takeout. Il vecchio portale Fitbit.com è sparito. Questa guida mostra le due strade principali: Google Takeout per l'archivio storico completo, Health Connect per il flusso quotidiano verso app terze.",
        en: "Exporting Fitbit data in 2026 is simpler than it looks, but requires understanding one key thing: after the Google acquisition and forced 2023 migration, your Fitbit data lives in Google infrastructure and downloads via Google Takeout. The old Fitbit.com portal is gone. This guide covers the two main paths: Google Takeout for the full historical archive, Health Connect for the daily flow to third-party apps.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Stato dell'arte a maggio 2026", en: "State of the art as of May 2026" },
    },
    {
      type: "list",
      items: {
        it: [
          "**Account**: Fitbit Account legacy non esiste più dal 2025. Tutti gli account sono ora Google Account. Login con email Google obbligatorio.",
          "**App Fitbit**: continua a esistere come app Android/iOS, ora distribuita da Google LLC.",
          "**Fitbit.com**: la dashboard web pubblica è stata smantellata. Resta accessibile solo l'area account/privacy.",
          "**Dati storici**: completamente preservati nella migrazione, accessibili via app e via Google Takeout.",
          "**Health Connect**: dal 2024 l'app Fitbit scrive su Health Connect (Android). Pixel Watch idem.",
        ],
        en: [
          "**Account**: legacy Fitbit Account doesn't exist since 2025. All accounts are now Google Accounts. Google email login required.",
          "**Fitbit app**: still exists as Android/iOS app, now distributed by Google LLC.",
          "**Fitbit.com**: the public web dashboard was decommissioned. Only the account/privacy area remains accessible.",
          "**Historical data**: fully preserved during migration, accessible via app and via Google Takeout.",
          "**Health Connect**: since 2024 the Fitbit app writes to Health Connect (Android). Pixel Watch likewise.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Pixel Watch è Fitbit sotto il cofano", en: "Pixel Watch is Fitbit under the hood" },
      body: {
        it: "Se hai un Pixel Watch (qualsiasi generazione), tecnicamente i tuoi dati vivono nell'infrastruttura Fitbit-by-Google. Tutto quello che dici di Fitbit in questo articolo vale per il tuo Pixel Watch.",
        en: "If you have a Pixel Watch (any generation), technically your data lives in Fitbit-by-Google infrastructure. Everything we say about Fitbit here applies to your Pixel Watch.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Strada A: Google Takeout (la più completa)", en: "Path A: Google Takeout (most complete)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Google Takeout è il portale ufficiale Google per scaricare dati di tutti i prodotti, incluso Fitbit. È il modo strutturato per ottenere lo storico completo.",
        en: "Google Takeout is the official Google portal to download data from all products, Fitbit included. It's the structured way to get the full history.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Vai su takeout.google.com e accedi con il Google Account collegato al Fitbit.",
          "Clicca 'Deseleziona tutto', poi cerca 'Fitbit' nella lista e selezionalo.",
          "Espandi i sotto-elementi (Activity, Sleep, Heart Rate, etc.): puoi scegliere granularmente quali tipi includere.",
          "Scegli formato esportazione (JSON consigliato, CSV per la maggior parte dei dati di attività) e destinazione (download diretto, Drive, Dropbox, OneDrive).",
          "Avvia l'export. I tempi vanno da minuti (account piccolo) a ore (anni di dati granulari). Riceverai un'email quando è pronto.",
        ],
        en: [
          "Go to takeout.google.com and sign in with the Google Account linked to Fitbit.",
          "Click 'Deselect all', then search 'Fitbit' in the list and select it.",
          "Expand sub-items (Activity, Sleep, Heart Rate, etc.): you can choose granularly which types to include.",
          "Pick export format (JSON recommended, CSV for most activity data) and destination (direct download, Drive, Dropbox, OneDrive).",
          "Start the export. Times range from minutes (small account) to hours (years of granular data). You'll get an email when ready.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il pacchetto contiene cartelle per ciascun tipo di dato. Esempi: 'Personal & Account → Profile', 'Activities → activities-YYYY-MM-DD.json' (daily summary), 'Heart Rate → heart_rate-YYYY-MM-DD.json' (sample per minuto), 'Sleep → sleep-YYYY-MM-DD.json' con stages. Per backfill profondi i file possono pesare GB.",
        en: "The package contains folders per data type. Examples: 'Personal & Account → Profile', 'Activities → activities-YYYY-MM-DD.json' (daily summary), 'Heart Rate → heart_rate-YYYY-MM-DD.json' (per-minute samples), 'Sleep → sleep-YYYY-MM-DD.json' with stages. For deep backfills files can weigh GB.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Strada B: Health Connect (per uso quotidiano)", en: "Path B: Health Connect (for daily use)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Se non ti serve uno snapshot storico una tantum ma un flusso continuo dei dati Fitbit verso un'altra app, la strada è Health Connect.",
        en: "If you don't need a one-time historical snapshot but a continuous flow of Fitbit data to another app, the path is Health Connect.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Verifica che l'app Fitbit sia aggiornata (versione 4.10 o superiore).",
          "Apri Fitbit → tab 'You' (in basso a destra) → cerca 'Health Connect' nelle impostazioni profilo.",
          "Tocca 'Connect' e autorizza la scrittura per i tipi di dato che vuoi esporre.",
          "Da quel momento qualsiasi app Android terza con permessi Health Connect può leggere i tuoi dati Fitbit.",
        ],
        en: [
          "Make sure the Fitbit app is updated (version 4.10 or higher).",
          "Open Fitbit → 'You' tab (bottom right) → look for 'Health Connect' in profile settings.",
          "Tap 'Connect' and authorize write access for the data types you want to expose.",
          "From then on any third-party Android app with Health Connect permissions can read your Fitbit data.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Limite importante: via Health Connect, Fitbit espone le fasi di sonno solo come durata totale (non REM/Deep/Light/Awake distinte), e non espone GPS track per allenamenti, VO₂ max o Cardio Fitness Score. Per quelli serve la Fitbit Web API ufficiale (OAuth), che richiede approvazione developer ed è di solito accessibile solo ad app già approvate.",
        en: "Important limit: via Health Connect, Fitbit exposes sleep stages only as total duration (not separate REM/Deep/Light/Awake), and doesn't expose workout GPS tracks, VO₂ max or Cardio Fitness Score. For those you need the official Fitbit Web API (OAuth), which requires developer approval and is usually only accessible to already-approved apps.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa fare prima di chiudere l'account", en: "What to do before closing the account" },
    },
    {
      type: "paragraph",
      text: {
        it: "Se stai pensando di lasciare Fitbit (per passare a Garmin, Apple Watch, Galaxy Watch), fai questi tre passaggi in ordine:",
        en: "If you're thinking of leaving Fitbit (to switch to Garmin, Apple Watch, Galaxy Watch), do these three steps in order:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Esporta tutto via Takeout** prima di tutto. Una volta cancellato l'account è tardi.",
          "**Disabilita la condivisione cloud** che non ti serve più (Strava, MyFitnessPal sync, etc.).",
          "**Chiedi cancellazione GDPR** se vuoi assicurarti che tutto sia rimosso dai backup. Vai su privacy.google.com e seleziona 'Elimina i tuoi dati'.",
        ],
        en: [
          "**Export everything via Takeout** first. Once the account is deleted it's too late.",
          "**Disable cloud sharing** you no longer need (Strava, MyFitnessPal sync, etc.).",
          "**Request GDPR deletion** if you want to ensure everything is removed from backups. Go to privacy.google.com and select 'Delete your data'.",
        ],
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Attenzione al timing", en: "Mind the timing" },
      body: {
        it: "Google Takeout può impiegare giorni a generare l'export per account grossi. Non avviare la cancellazione prima di avere il pacchetto in mano. Tieni anche conto che Google conserva backup per fino a 180 giorni dopo cancellazione (documentato in privacy policy).",
        en: "Google Takeout can take days to generate the export for large accounts. Don't initiate deletion before having the package in hand. Also note Google keeps backups for up to 180 days after deletion (documented in privacy policy).",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "La nostra posizione sull'ecosistema Fitbit-Google", en: "Our take on the Fitbit-Google ecosystem" },
      body: {
        it: "Se usi Fitbit principalmente per passi, BPM e sonno e non hai bisogno delle funzionalità premium Fitbit, ha senso considerare un'alternativa che ti dia più controllo sui dati. La dipendenza da un singolo ecosistema Google (dove la policy può cambiare e il servizio può essere dismesso) è un rischio reale per chi si affida a questi dati nel tempo. Esporta regolarmente via Takeout e considera di affiancare una dashboard alternativa che legga da Health Connect: ti dà una copia indipendente e accesso da browser senza passare per i server Google.",
        en: "If you use Fitbit primarily for steps, HR and sleep and don't need premium Fitbit features, it makes sense to consider an alternative that gives you more data control. Dependence on a single Google ecosystem (where policy can change and the service can be discontinued) is a real risk for those who rely on this data over time. Export regularly via Takeout and consider adding an alternative dashboard that reads from Health Connect: it gives you an independent copy and browser access without going through Google's servers.",
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
          "Dopo la migrazione del 2023, i dati Fitbit vivono su Google: l'export si fa via Google Takeout (takeout.google.com), non più da Fitbit.com.",
          "Google Takeout è il metodo più completo: include tutta la storia in JSON/CSV, dalle attività al sonno agli HR a cadenza per minuto.",
          "Health Connect è il metodo per il flusso continuo: dall'app Fitbit vers HC, qualsiasi app Android con permessi HC può leggere i dati in tempo reale.",
          "Limite HC per Fitbit: le fasi del sonno (REM/Deep/Light) non sono esposte in modo granulare via HC. GPS e VO₂ max richiedono la Fitbit Web API.",
          "Prima di chiudere l'account: esporta via Takeout, poi richiedi la cancellazione GDPR. Mai nell'ordine inverso.",
        ],
        en: [
          "After the 2023 migration, Fitbit data lives on Google: export goes via Google Takeout (takeout.google.com), no longer from Fitbit.com.",
          "Google Takeout is the most complete method: includes the full history in JSON/CSV, from activities to sleep to per-minute HR.",
          "Health Connect is the method for continuous flow: from the Fitbit app to HC, any Android app with HC permissions can read data in real time.",
          "HC limit for Fitbit: sleep phases (REM/Deep/Light) are not exposed granularly via HC. GPS and VO₂ max require the Fitbit Web API.",
          "Before closing the account: export via Takeout, then request GDPR deletion. Never in the reverse order.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Tieni il Fitbit ma vuoi una dashboard alternativa?",
        en: "Keeping Fitbit but want an alternative dashboard?",
      },
      body: {
        it: "FitMesh Sync legge Fitbit via Health Connect oggi (passi, BPM, sonno, calorie, distanza) e prevede integrazione OAuth Web API per dati avanzati nel 2026.",
        en: "FitMesh Sync reads Fitbit via Health Connect today (steps, HR, sleep, calories, distance) and plans Web API OAuth integration for advanced data in 2026.",
      },
      ctaLabel: { it: "Vedi Fitbit su FitMesh →", en: "See Fitbit on FitMesh →" },
      ctaHref: { it: "/it/sync/fitbit", en: "/en/sync/fitbit" },
    },
  ],
  faq: [
    {
      q: {
        it: "Se non ho migrato a Google Account, posso ancora accedere?",
        en: "If I haven't migrated to a Google Account, can I still log in?",
      },
      a: {
        it: "Dal 2025 i Fitbit Account legacy non sono più supportati. Se hai un dispositivo Fitbit attivo dovresti aver ricevuto multiple richieste di migrazione. Se hai mancato la finestra, contatta il supporto Fitbit per ripristinare l'accesso: è ancora possibile ma può richiedere verifica identità.",
        en: "Since 2025 legacy Fitbit Accounts are no longer supported. If you have an active Fitbit device you should have received multiple migration requests. If you missed the window, contact Fitbit support to restore access: it's still possible but may require ID verification.",
      },
    },
    {
      q: {
        it: "Google usa i miei dati Fitbit per pubblicità?",
        en: "Does Google use my Fitbit data for advertising?",
      },
      a: {
        it: "La privacy policy attuale di Fitbit (gestita da Google) dichiara che i dati salute non sono usati per Google Ads. Questa è anche una condizione imposta dalle authority europee al momento dell'approvazione dell'acquisizione (impegni vincolanti fino al 2031). Tecnicamente Google può cambiare la policy in futuro per nuovi dati raccolti, ma con preavviso e opt-out.",
        en: "Fitbit's current privacy policy (Google-managed) states health data isn't used for Google Ads. This is also a condition imposed by European authorities at acquisition approval (binding commitments until 2031). Technically Google can change the policy in the future for newly collected data, but with prior notice and opt-out.",
      },
    },
    {
      q: {
        it: "Posso trasferire i dati Fitbit a un Galaxy Watch?",
        en: "Can I transfer Fitbit data to a Galaxy Watch?",
      },
      a: {
        it: "Direttamente no: non c'è importazione nativa in Samsung Health. Hai due strade. Una: esporta da Takeout, mantieni i file come archivio (non visualizzabili in Samsung Health). Due: via Health Connect, lo storico recente Fitbit (60–90 giorni tipici) compare in HC e Samsung Health può leggerli. Lo storico più vecchio richiede lavoro manuale.",
        en: "Directly no: there's no native import in Samsung Health. Two paths. One: export from Takeout, keep files as archive (not viewable in Samsung Health). Two: via Health Connect, recent Fitbit history (typical 60–90 days) appears in HC and Samsung Health can read it. Older history requires manual work.",
      },
    },
  ],
  related: [
    "guida-sync-wearable-2026",
    "scegliere-smartwatch-dati-2026",
    "gdpr-dati-fitness-smartwatch",
  ],
  brandsMentioned: ["Fitbit", "Google", "Samsung"],
  ldType: "BlogPosting",
};
