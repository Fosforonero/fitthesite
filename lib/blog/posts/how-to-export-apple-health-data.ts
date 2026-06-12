import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "how-to-export-apple-health-data",
  category: "guides",
  publishedAt: "2026-05-30",
  updatedAt: "2026-05-30",
  readMinutes: 7,
  tldr: {
    it: [
      "Il metodo più completo è l'export XML nativo (Salute → profilo → Esporta tutti i dati): contiene ogni record, ma il file può pesare fino a 2 GB e non è leggibile direttamente.",
      "Per leggere l'XML su PC servono strumenti aggiuntivi: script Python open-source o Apple Shortcuts per metriche specifiche.",
      "Per condividere dati specifici con un medico, usa l'export per singola metrica direttamente dal grafico in Salute: produce un CSV pulito.",
      "Il file XML non è criptato: trattalo come un documento medico sensibile e non caricarlo su cloud pubblici.",
      "La via più comoda è una dashboard web senza export manuale: serve un'app che legga da HealthKit e sincronizzi in background. FitMesh iOS è in beta TestFlight — uscita App Store imminente.",
    ],
    en: [
      "The most complete method is the native XML export (Health → profile → Export All Health Data): it contains every record, but the file can reach 2 GB and isn't readable directly.",
      "Reading the XML on a PC requires additional tools: open-source Python scripts or Apple Shortcuts for specific metrics.",
      "For sharing specific data with a doctor, use the per-metric export directly from the chart in Health: it produces a clean CSV.",
      "The XML file is unencrypted: treat it like a sensitive medical document and don't upload it to public cloud services.",
      "The most convenient path is a web dashboard without manual exports: it needs an app that reads from HealthKit and syncs in the background. FitMesh iOS is in beta on TestFlight — App Store launch imminent.",
    ],
  },
  primaryKeyword: {
    it: "esportare dati apple health",
    en: "how to export apple health data",
  },
  secondaryKeywords: {
    it: [
      "esportare apple health su pc",
      "scaricare dati apple health",
      "apple health export csv",
      "vedere dati apple health browser",
      "backup apple health",
    ],
    en: [
      "export apple health data to pc",
      "download apple health data",
      "apple health export csv",
      "apple health data to web",
      "apple health backup",
      "view apple health data on computer",
    ],
  },
  metaDescription: {
    it: "Come esportare i dati Apple Health su PC o web nel 2026: export XML nativo, lettura con strumenti gratuiti, e dashboard web per iPhone. Guida completa.",
    en: "How to export Apple Health data to PC or web in 2026: native XML export, free tools to read it, and web dashboard for iPhone users. Complete guide.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Come esportare i dati Apple Health su PC o web (2026)",
      en: "How to export Apple Health data to PC or web (2026)",
    },
    subtitle: {
      it: "Apple Health raccoglie anni di dati salute sul tuo iPhone, ma per vederli su computer o condividerli con qualcuno ci vuole qualche passaggio in più. Ecco tutti i metodi, in ordine di facilità.",
      en: "Apple Health collects years of health data on your iPhone, but viewing them on a computer or sharing them with someone takes a few extra steps. Here are all the methods, easiest first.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Apple Health raccoglie anni di dati salute sul tuo iPhone ma non ha una web dashboard: per vederli su computer o condividerli servono passaggi precisi. Ci sono tre metodi, ognuno con un diverso compromesso tra completezza e semplicità. Questa guida li copre tutti in ordine di facilità, dal più immediato al più tecnico.",
        en: "Apple Health collects years of health data on your iPhone but has no web dashboard: getting that data to a computer or sharing it requires specific steps. There are three methods, each with a different tradeoff between completeness and simplicity. This guide covers all of them, easiest first.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 1: Export XML nativo (gratis, completo, ma tecnico)",
        en: "Method 1: Native XML export (free, complete, but technical)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Apple Health include un export nativo che produce un file ZIP con tutti i tuoi dati in formato XML. È il metodo più completo: include letteralmente ogni record, ma il file risultante è difficile da leggere senza strumenti aggiuntivi.",
        en: "Apple Health includes a native export that produces a ZIP file with all your data in XML format. It's the most complete method: includes literally every record, but the resulting file is hard to read without additional tools.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri **Salute** (Health) sul tuo iPhone.",
          "Tap sulla tua **foto profilo** in alto a destra.",
          "Scorri in fondo → tap **Esporta tutti i dati salute**.",
          "Conferma → aspetta (può richiedere alcuni minuti se hai anni di dati).",
          "Scegli come condividere: **AirDrop al Mac**, **Salva su iCloud Drive**, **Email a te stesso**.",
          "Sul PC/Mac, decomprimi il file. Trovi `export.xml` (il grosso dei dati) + cartella `workout-routes/` con i dati GPS.",
        ],
        en: [
          "Open **Health** on your iPhone.",
          "Tap your **profile photo** in the top-right corner.",
          "Scroll to the bottom → tap **Export All Health Data**.",
          "Confirm → wait (may take a few minutes if you have years of data).",
          "Choose how to share: **AirDrop to Mac**, **Save to iCloud Drive**, **Email to yourself**.",
          "On PC/Mac, unzip the file. You'll find `export.xml` (the bulk of the data) + `workout-routes/` folder with GPS data.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Il file XML può essere enorme",
        en: "The XML file can be huge",
      },
      body: {
        it: "Dopo 3-4 anni di Apple Watch, l'export XML può pesare 500MB-2GB decompresso. Non aprirlo con un editor di testo normale: va in crash. Usa gli strumenti gratuiti descritti sotto, o importalo in Python/R per analisi avanzate.",
        en: "After 3-4 years of Apple Watch, the XML export can be 500MB-2GB uncompressed. Don't open it with a regular text editor: it'll crash. Use the free tools described below, or import it in Python/R for advanced analysis.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come leggere il file XML su PC (strumenti gratuiti)",
        en: "How to read the XML file on PC (free tools)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Una volta che hai il file XML sul computer, ci sono alcune strade gratuite per visualizzarlo in modo leggibile:",
        en: "Once you have the XML file on your computer, there are a few free ways to display it in a readable format:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Script Python**: se hai Python installato, librerie come `pandas` e `lxml` permettono di leggere l'XML, filtrare per tipo di metrica, e esportare in CSV. GitHub ha decine di script open-source pronti all'uso per questo.",
          "**Numbers/Excel**: Apple Health XML non si importa direttamente in Excel, ma dopo conversione via script Python in CSV sì.",
          "**Apple Shortcuts**: su iPhone e Mac, l'app Comandi (Shortcuts) può leggere direttamente da Apple Health senza export. Utile per automatizzare report settimanali o mensili.",
          "**Tableau Public / Google Looker Studio**: dopo aver convertito in CSV, puoi visualizzare i dati con questi strumenti gratuiti di data viz.",
        ],
        en: [
          "**Python script**: if you have Python installed, libraries like `pandas` and `lxml` let you read the XML, filter by metric type, and export to CSV. GitHub has dozens of ready-to-use open-source scripts for this.",
          "**Numbers/Excel**: Apple Health XML can't be imported directly into Excel, but CSV (after Python conversion) can.",
          "**Apple Shortcuts**: on iPhone and Mac, the Shortcuts app can read directly from Apple Health without exporting. Useful for automating weekly or monthly reports.",
          "**Tableau Public / Google Looker Studio**: after converting to CSV, you can visualize the data with these free data viz tools.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 2: Condivisione con il medico (PDF o grafici nativi)",
        en: "Method 2: Sharing with your doctor (native PDF or charts)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per condividere dati specifici con un medico, Apple Health ha una funzione integrata più semplice dell'export XML completo:",
        en: "For sharing specific data with a doctor, Apple Health has a built-in feature simpler than the full XML export:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "In **Salute** → apri la categoria che ti interessa (es. Frequenza cardiaca, Sonno).",
          "Tap sul grafico → **Esporta dati campione** (in basso) → CSV per quella singola metrica.",
          "Oppure: in **Sommario** → scorri fino a **Condivisione della salute** → configura chi può vedere i tuoi dati (altri utenti iPhone o medici su piattaforme specifiche).",
        ],
        en: [
          "In **Health** → open the category you're interested in (e.g. Heart Rate, Sleep).",
          "Tap on the chart → **Export Health Records** (at the bottom) → CSV for that single metric.",
          "Or: in **Summary** → scroll to **Health Sharing** → configure who can see your data (other iPhone users or doctors on specific platforms).",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 3: Dashboard web: la via più comoda (iOS in arrivo)",
        en: "Method 3: Web dashboard, the most convenient way (iOS coming)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'opzione più comoda (avere i dati Apple Health su una dashboard web accessibile da qualsiasi browser senza dover fare export manuali ogni volta) richiede un'app che legga Apple Health e la sincronizzi nel cloud.",
        en: "The most convenient option (having Apple Health data on a web dashboard accessible from any browser, without manual exports every time) requires an app that reads Apple Health and syncs it to the cloud.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync è in arrivo su iPhone — la beta TestFlight è attiva e l'uscita App Store è imminente. L'app iPhone legge i dati da Apple Health (HealthKit), li sincronizza automaticamente e li mostra sulla stessa dashboard web che già usiamo per Android. Feature extra: il ponte di scrittura (opt-in) porta i dati dei wearable Android direttamente in Apple Salute — utile se hai sia un dispositivo Android che un iPhone.",
        en: "FitMesh Sync is arriving on iPhone — the TestFlight beta is active and the App Store launch is imminent. The iPhone app reads data from Apple Health (HealthKit), syncs it automatically, and displays it on the same web dashboard already used for Android. Extra feature: the write bridge (opt-in) brings Android wearable data directly into Apple Health — useful if you have both an Android device and an iPhone.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Se hai sia iPhone che Android",
        en: "If you have both iPhone and Android",
      },
      body: {
        it: "Molti utenti usano un iPhone ma hanno un wearable Android (es. Galaxy Watch o un anello smart). Con FitMesh Sync Android puoi già sincronizzare quei dati su web. La versione iOS (beta ora, App Store imminente) aggiunge anche il ponte di scrittura opt-in: i dati del wearable Android vengono scritti direttamente in Apple Salute, così li vedi nell'app Salute di iPhone senza alcun export manuale.",
        en: "Many users have an iPhone but an Android wearable (e.g. Galaxy Watch or a smart ring). With FitMesh Sync Android you can already sync that data to the web. The iOS version (in beta now, App Store coming soon) also adds the opt-in write bridge: Android wearable data gets written directly into Apple Health, so you see it in the iPhone Health app without any manual export.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "Perché dovresti esportare i dati adesso, non quando smetti di usare Apple Watch", en: "Why you should export your data now, not when you stop using Apple Watch" },
      body: {
        it: "L'errore più comune che vediamo: le persone esportano Apple Health solo quando cambiano telefono o ecosistema, e spesso scoprono che mesi di dati sono andati persi (backup iCloud non configurato, device reset). Esporta i dati ogni 6 mesi come routine: il file ZIP di Apple Health è il tuo backup assicurativo contro qualsiasi cambio futuro di dispositivo, piattaforma, o policy Apple.",
        en: "The most common mistake we see: people export Apple Health data only when switching phones or ecosystems, and often discover months of data are gone (iCloud backup not configured, device reset). Export your data every 6 months as a routine: the Apple Health ZIP file is your insurance backup against any future device change, platform switch, or Apple policy change.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa contiene un export Apple Health completo",
        en: "What a complete Apple Health export contains",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Passi e distanza**: ogni campione con timestamp preciso",
          "**Frequenza cardiaca**: tutti i campioni (ogni pochi minuti se hai Apple Watch)",
          "**Frequenza cardiaca a riposo e variabilità (HRV)**: calcolati ogni mattina",
          "**Sonno**: fasi (Core, Deep, REM, Awake) con timestamp",
          "**Allenamenti**: tipo, durata, calorie, frequenza cardiaca media, GPS",
          "**SpO2**: ogni campione disponibile",
          "**ECG**: file PDF + valori grezzi se hai Apple Watch Series 4+",
          "**Mindfulness**: sessioni di respiro consapevole",
          "**Peso e composizione corporea**: se inseriti manualmente o da bilancia smart",
          "**Pressione arteriosa e glicemia**: se inseriti manualmente",
          "**Dati ambientali**: rumori, cadute rilevate",
        ],
        en: [
          "**Steps and distance**: every sample with precise timestamp",
          "**Heart rate**: all samples (every few minutes if you have Apple Watch)",
          "**Resting heart rate and HRV**: calculated every morning",
          "**Sleep**: stages (Core, Deep, REM, Awake) with timestamps",
          "**Workouts**: type, duration, calories, average HR, GPS",
          "**SpO2**: every available sample",
          "**ECG**: PDF file + raw values if you have Apple Watch Series 4+",
          "**Mindfulness**: conscious breathing sessions",
          "**Weight and body composition**: if entered manually or from a smart scale",
          "**Blood pressure and glucose**: if entered manually",
          "**Environmental data**: noise levels, detected falls",
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
          "Il metodo più completo è l'export XML nativo (Salute → profilo → Esporta tutti i dati): contiene ogni record con timestamp, ma il file può pesare 2 GB e non è leggibile direttamente.",
          "Per leggere l'XML su PC servono strumenti aggiuntivi: script Python open-source su GitHub, o Apple Shortcuts per metriche specifiche.",
          "Per condividere dati specifici con un medico, usa l'export per singola metrica direttamente dal grafico in Salute: produce un CSV pulito.",
          "Il file XML non è criptato: trattalo come un documento medico sensibile, non caricarlo su cloud pubblici.",
          "La via più comoda (dashboard web senza export manuale) richiede un'app che legga da HealthKit e sincronizzi in background: FitMesh iOS è in beta TestFlight, uscita App Store imminente.",
        ],
        en: [
          "The most complete method is the native XML export (Health → profile → Export All Health Data): contains every record with timestamps, but the file can be 2 GB and isn't readable directly.",
          "Reading the XML on a PC requires additional tools: open-source Python scripts on GitHub, or Apple Shortcuts for specific metrics.",
          "For sharing specific data with a doctor, use the per-metric export directly from the chart in Health: produces a clean CSV.",
          "The XML file is unencrypted: treat it like a sensitive medical document, don't upload it to public cloud services.",
          "The most convenient path (web dashboard without manual exports) requires an app that reads from HealthKit and syncs in the background: FitMesh iOS is in TestFlight beta, App Store launch imminent.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Dashboard web per iPhone: unisciti alla lista d'attesa iOS",
        en: "Web dashboard for iPhone: join the iOS waitlist",
      },
      body: {
        it: "FitMesh Sync è in beta TestFlight su iPhone — uscita App Store imminente. L'app legge i dati da Apple Health e li sincronizza automaticamente su web, senza export manuali. Entra in beta gratis e sarai tra i primi a provarla. Bonus: il ponte di scrittura (opt-in) porta anche i dati dei wearable Android dentro Apple Salute.",
        en: "FitMesh Sync is in TestFlight beta on iPhone — App Store launch imminent. The app reads data from Apple Health and syncs it automatically to the web, no manual exports needed. Join the free beta and be among the first to try it. Bonus: the write bridge (opt-in) also brings Android wearable data into Apple Health.",
      },
      ctaLabel: {
        it: "Entra in beta iOS →",
        en: "Join iOS beta →",
      },
      ctaHref: {
        it: "/it/beta",
        en: "/en/beta",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "L'export Apple Health è sicuro per la privacy?",
        en: "Is Apple Health export safe for privacy?",
      },
      a: {
        it: "Il file XML non è criptato: chiunque lo riceva può leggere tutti i tuoi dati salute. Trattalo come un documento medico sensibile. Non caricarlo su servizi cloud pubblici, non mandarlo via email non criptata. Se usi AirDrop o cavi USB su Mac, la trasmissione è crittografata.",
        en: "The XML file is unencrypted: anyone who receives it can read all your health data. Treat it like a sensitive medical document. Don't upload it to public cloud services, don't send it via unencrypted email. AirDrop or USB cable to Mac are encrypted transfers.",
      },
    },
    {
      q: {
        it: "Posso importare i dati Apple Health in Google Fit o Health Connect?",
        en: "Can I import Apple Health data into Google Fit or Health Connect?",
      },
      a: {
        it: "Direttamente no: Apple Health e Health Connect/Google Fit sono sistemi separati e non hanno import nativo dall'uno all'altro. Esistono script Python open-source che leggono l'export XML Apple Health e lo scrivono su Health Connect via API, ma richiedono setup tecnico. Per gli allenamenti specifici (es. da Garmin), Garmin Connect sincronizza sia con Apple Health che con Health Connect: è la via più pulita per chi ha device multi-piattaforma.",
        en: "Not directly: Apple Health and Health Connect/Google Fit are separate systems with no native import from one to the other. Open-source Python scripts exist that read the Apple Health XML export and write it to Health Connect via API, but they require technical setup. For specific workouts (e.g. from Garmin), Garmin Connect syncs with both Apple Health and Health Connect, the cleanest path for multi-platform device users.",
      },
    },
    {
      q: {
        it: "Quanto spazio occupa un export Apple Health?",
        en: "How much space does an Apple Health export take?",
      },
      a: {
        it: "Dipende dagli anni di dati e da quanti wearable hai usato. Un utente con 2 anni di Apple Watch può aspettarsi 100-400MB compressi (ZIP), che diventano 500MB-2GB decompressi. Chi usa Apple Watch + misurazioni cardiache frequenti può arrivare a 3-5GB decompressi.",
        en: "Depends on years of data and how many wearables you've used. A 2-year Apple Watch user can expect 100-400MB compressed (ZIP), becoming 500MB-2GB uncompressed. Those using Apple Watch + frequent cardiac measurements can reach 3-5GB uncompressed.",
      },
    },
    {
      q: {
        it: "Posso automatizzare l'export mensile?",
        en: "Can I automate monthly exports?",
      },
      a: {
        it: "Tramite l'export XML nativo no: va fatto manualmente ogni volta. Tramite Apple Shortcuts puoi automatizzare l'estrazione di metriche specifiche (es. 'esporta i passi di questa settimana in CSV') e inviarle a te stesso via email o salvarle su iCloud. Per un backup automatico completo, la strada è un'app che si connette a HealthKit e sincronizza in background (che è esattamente quello che FitMesh iOS farà).",
        en: "Via native XML export, no: it must be done manually each time. Via Apple Shortcuts you can automate extraction of specific metrics (e.g. 'export this week's steps to CSV') and send them to yourself via email or save to iCloud. For a full automatic backup, the path is an app that connects to HealthKit and syncs in the background, which is exactly what FitMesh iOS will do.",
      },
    },
  ],
  related: [
    "fitmesh-arriva-su-iphone",
    "dati-anello-smart-apple-salute",
    "guida-sync-wearable-2026",
    "gdpr-dati-fitness-smartwatch",
  ],
  brandsMentioned: ["Apple", "Google"],
  ldType: "BlogPosting",
};
