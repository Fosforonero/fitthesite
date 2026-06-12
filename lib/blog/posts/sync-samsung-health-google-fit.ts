import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "sync-samsung-health-google-fit",
  category: "guides",
  publishedAt: "2026-05-23",
  updatedAt: "2026-05-23",
  readMinutes: 8,
  tldr: {
    it: [
      "Il sync diretto Samsung Health→Google Fit non esiste più dal 2024: Google ha deprecato Google Fit e spostato l'ecosistema Android su Health Connect.",
      "Il percorso corretto oggi: Samsung Health scrive su Health Connect, le app di destinazione leggono da lì. Funziona per la maggior parte dei dati standard.",
      "Non disponibili via Health Connect: metriche proprietarie Samsung, GPS dettagliato degli allenamenti, dati storici precedenti all'autorizzazione.",
      "Se l'app di destinazione non supporta Health Connect nel 2026, probabilmente non viene mantenuta: valuta di cambiarla.",
      "I dati storici in Samsung Health restano al sicuro nel cloud Samsung. Per portarli altrove usa l'export manuale (CSV/XML).",
    ],
    en: [
      "Direct Samsung Health to Google Fit sync has not existed since 2024: Google deprecated Google Fit and moved the Android ecosystem to Health Connect.",
      "The correct path today: Samsung Health writes to Health Connect, destination apps read from there. Works for most standard data.",
      "Not available via Health Connect: Samsung proprietary metrics, detailed workout GPS, historical data predating authorization.",
      "If the destination app does not support Health Connect in 2026, it is probably not maintained: consider switching.",
      "Historical data in Samsung Health stays safe in Samsung cloud. To port it elsewhere, use manual export (CSV/XML).",
    ],
  },
  primaryKeyword: {
    it: "sync samsung health google fit",
    en: "sync samsung health google fit",
  },
  secondaryKeywords: {
    it: [
      "sincronizzare samsung health google fit",
      "samsung health google fit 2026",
      "health connect samsung health google",
      "trasferire dati samsung health",
      "samsung health google fit workaround",
    ],
    en: [
      "samsung health google fit sync",
      "health connect samsung health google",
      "transfer samsung health data to google",
      "samsung health google fit 2026",
    ],
  },
  metaDescription: {
    it: "Sync Samsung Health → Google Fit nel 2026: il sync diretto non esiste più, ma c'è un workaround via Health Connect. Spiegazione onesta di cosa funziona, cosa no, e perché.",
    en: "Samsung Health to Google Fit sync in 2026: direct sync no longer exists, but there's a workaround via Health Connect. Honest explanation of what works, what doesn't, and why.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Sync Samsung Health ↔ Google Fit nel 2026",
      en: "Syncing Samsung Health and Google Fit in 2026: what actually works",
    },
    subtitle: {
      it: "Il sync diretto Samsung Health → Google Fit non esiste più. Ecco cosa è successo, il workaround via Health Connect che funziona oggi, e i limiti che devi conoscere.",
      en: "Direct Samsung Health → Google Fit sync no longer exists. Here's what happened, the Health Connect workaround that works today, and the limits you need to know.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Il sync diretto Samsung Health con Google Fit non esiste più dal 2024: Google ha deprecato Google Fit e spostato l'intero ecosistema Android su Health Connect. Il workaround funzionante oggi è Samsung Health che scrive su Health Connect, con le altre app che leggono da lì. Funziona per la maggior parte dei dati standard, con alcune eccezioni note che spieghiamo in questo articolo.",
        en: "Direct Samsung Health to Google Fit sync has not existed since 2024: Google deprecated Google Fit and moved the entire Android ecosystem to Health Connect. The working workaround today is Samsung Health writing to Health Connect, with other apps reading from there. It works for most standard data, with some known exceptions explained in this article.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "La storia breve: Google Fit è stato deprecato",
        en: "The short story: Google Fit was deprecated",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Google Fit esisteva come API di scambio dati salute per Android dal 2014. Nel 2022, Google ha annunciato che avrebbe spostato tutto l'ecosistema su Health Connect, la nuova piattaforma on-device che sostituisce il ruolo che aveva Google Fit come intermediario cloud. L'integrazione diretta Samsung Health ↔ Google Fit è stata dismessa nel corso del 2024, quando Google ha ufficialmente smesso di sviluppare Google Fit come prodotto.",
        en: "Google Fit existed as an Android health data exchange API since 2014. In 2022, Google announced it would move the entire ecosystem to Health Connect, the new on-device platform replacing Google Fit's role as cloud intermediary. The direct Samsung Health ↔ Google Fit integration was discontinued during 2024, when Google officially stopped developing Google Fit as a product.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Google Fit come app esiste ancora sui telefoni (e sul Play Store), ma non riceve aggiornamenti significativi e Google ha dichiarato che il suo futuro è incerto. Non è un prodotto morto ufficialmente, ma non è neanche un prodotto su cui puntare.",
        en: "Google Fit as an app still exists on phones (and the Play Store), but receives no significant updates and Google has stated its future is uncertain. It's not an officially dead product, but it's not one to bet on either.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Perché Health Connect è la risposta", en: "Why Health Connect is the answer" },
      body: {
        it: "Health Connect è il sostituto architetturale di Google Fit. Non è un'app con una dashboard, è uno strato di scambio dati on-device. Samsung Health scrive su Health Connect, le altre app (incluso ciò che prima leggeva da Google Fit) leggono da Health Connect. Il risultato finale per i dati è lo stesso, ma il flusso è diverso.",
        en: "Health Connect is the architectural replacement for Google Fit. It's not an app with a dashboard, it's an on-device data exchange layer. Samsung Health writes to Health Connect, other apps (including what previously read from Google Fit) read from Health Connect. The end result for the data is the same, but the flow is different.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il workaround via Health Connect: step pratici",
        en: "The Health Connect workaround: practical steps",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se la tua esigenza è che i dati di Samsung Health (Galaxy Watch) siano leggibili da un'altra app che prima usava Google Fit, il percorso è questo. Funziona per la maggior parte dei dati, con alcune eccezioni che spieghiamo dopo.",
        en: "If your need is for Samsung Health (Galaxy Watch) data to be readable by another app that previously used Google Fit, here's the path. It works for most data, with some exceptions we explain after.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Verifica che Health Connect sia installato sul tuo telefono Android (su Android 14+ è preinstallato; su Android 12-13 cerca 'Health Connect' sul Play Store).",
          "Apri Samsung Health → tocca il tuo profilo in alto a destra → Impostazioni → Gestione dati.",
          "Trova 'Health Connect' nella lista e tocca per aprire le impostazioni.",
          "Abilita la sincronizzazione con Health Connect e seleziona i tipi di dato che vuoi condividere: passi, frequenza cardiaca, sonno, calorie, allenamenti.",
          "Apri l'app di destinazione (quella che leggeva da Google Fit) e trova nelle sue impostazioni la sezione Health Connect o Sorgente dati.",
          "Autorizza quella app a leggere da Health Connect per i tipi di dato che ti servono.",
          "Verifica che i dati fluiscano: di solito entro 30-60 minuti le app vedono i nuovi dati.",
        ],
        en: [
          "Verify Health Connect is installed on your Android phone (on Android 14+ it's preinstalled; on Android 12-13 search 'Health Connect' on the Play Store).",
          "Open Samsung Health → tap your profile top right → Settings → Data management.",
          "Find 'Health Connect' in the list and tap to open settings.",
          "Enable sync with Health Connect and select the data types you want to share: steps, heart rate, sleep, calories, workouts.",
          "Open the destination app (the one that read from Google Fit) and find the Health Connect or Data Source section in its settings.",
          "Authorize that app to read from Health Connect for the data types you need.",
          "Verify data flows: usually within 30-60 minutes apps see new data.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa funziona e cosa no: la mappa onesta",
        en: "What works and what doesn't: the honest map",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Via Health Connect, Samsung Health espone la maggior parte dei dati standard. Ci sono però gap specifici da conoscere prima di affidarsi a questa soluzione per usi critici.",
        en: "Via Health Connect, Samsung Health exposes most standard data. However, there are specific gaps to know about before relying on this solution for critical uses.",
      },
    },
    {
      type: "comparison",
      aTitle: { it: "Dati disponibili via HC", en: "Data available via HC" },
      aItems: {
        it: [
          "Passi giornalieri e conteggio orario",
          "Frequenza cardiaca (letture continue e riepilogo)",
          "Dati di sonno (durata, fasi principali)",
          "Calorie bruciate",
          "Distanza percorsa",
          "Dati di allenamento base (durata, tipo, calorie)",
          "Peso e composizione corporea (se inseriti in SH)",
          "SpO2 (se misurato)",
        ],
        en: [
          "Daily steps and hourly count",
          "Heart rate (continuous readings and summary)",
          "Sleep data (duration, main phases)",
          "Calories burned",
          "Distance walked/run",
          "Basic workout data (duration, type, calories)",
          "Weight and body composition (if entered in SH)",
          "SpO2 (if measured)",
        ],
      },
      bTitle: { it: "Dati non disponibili / limitati", en: "Unavailable / limited data" },
      bItems: {
        it: [
          "Samsung Score e metriche proprietarie Samsung",
          "Dati GPS completi degli allenamenti (traccia, velocità per km)",
          "Energy score e Recovery metrics di Samsung Health",
          "Fasi di sonno granulari (REM vs profondo vs leggero): esposte solo in forma aggregata",
          "Dati storici precedenti all'autorizzazione HC (non retroattivi)",
          "Body Battery e metriche di stress proprietarie",
        ],
        en: [
          "Samsung Score and Samsung proprietary metrics",
          "Full workout GPS data (track, pace per km)",
          "Samsung Health Energy score and Recovery metrics",
          "Granular sleep phases (REM vs deep vs light): exposed in aggregate form only",
          "Historical data predating HC authorization (not retroactive)",
          "Body Battery and proprietary stress metrics",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Se la tua app non supporta Health Connect: alternative",
        en: "If your app doesn't support Health Connect: alternatives",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Non tutte le app che leggevano da Google Fit hanno aggiornato il loro codice per leggere da Health Connect. Alcune app più vecchie o con sviluppo lento sono rimaste ferme al vecchio paradigma. Se ti trovi in questa situazione, hai alcune opzioni.",
        en: "Not all apps that read from Google Fit have updated their code to read from Health Connect. Some older or slow-developing apps have remained on the old paradigm. If you find yourself in this situation, you have some options.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Verifica se l'app ha un aggiornamento**: cerca su Play Store → dettaglio app → aggiornamenti recenti. Leggi le note di versione per vedere se menzionano 'Health Connect'.",
          "**Usa un bridge**: alcune app come FitMesh Sync leggono da Health Connect e possono esportare i dati in formati o verso piattaforme che ancora usano il vecchio sistema.",
          "**Export manuale**: Samsung Health permette di esportare i dati in CSV o XML. Utile per import una tantum ma non per sincronizzazione continua.",
          "**Considera di cambiare app**: se l'app di destinazione non supporta ancora Health Connect nel 2026, è un segnale che non viene mantenuta attivamente. Esistono alternative più aggiornate.",
        ],
        en: [
          "**Check if the app has an update**: look on Play Store → app detail → recent updates. Read version notes to see if they mention 'Health Connect'.",
          "**Use a bridge**: some apps like FitMesh Sync read from Health Connect and can export data in formats or to platforms that still use the old system.",
          "**Manual export**: Samsung Health allows exporting data in CSV or XML. Useful for one-time imports but not for continuous sync.",
          "**Consider switching apps**: if the destination app doesn't support Health Connect by 2026, it's a sign it's not actively maintained. More updated alternatives exist.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Troubleshooting: i problemi più comuni",
        en: "Troubleshooting: the most common problems",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Ecco i problemi che emergono più frequentemente e le relative soluzioni.",
        en: "Here are the most frequently encountered problems and their solutions.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Samsung Health non appare in Health Connect**: apri Samsung Health → Impostazioni → Gestione dati → Health Connect → attiva la sincronizzazione. Se ancora non appare, aggiorna Samsung Health a l'ultima versione.",
          "**I passi ci sono ma le attività no**: Samsung Health espone i passi automaticamente, ma le sessioni di allenamento richiedono autorizzazioni separate. In Health Connect → Autorizzazioni app → Samsung Health, verifica che 'Allenamento' sia abilitato in scrittura.",
          "**I dati appaiono in ritardo**: il sync tra Samsung Health e Health Connect non è in tempo reale. Avviene periodicamente, di solito ogni 30-60 minuti. Puoi accelerarlo aprendo manualmente Samsung Health.",
          "**I dati storici mancano**: Health Connect non sincronizza retroattivamente. Le attività di prima dell'autorizzazione non appariranno. Usa l'export manuale di Samsung Health per recuperare lo storico.",
          "**App di destinazione non vede niente**: verifica che l'app abbia il permesso di LETTURA su Health Connect. Non basta che Samsung Health abbia il permesso di scrittura.",
        ],
        en: [
          "**Samsung Health doesn't appear in Health Connect**: open Samsung Health → Settings → Data management → Health Connect → enable sync. If it still doesn't appear, update Samsung Health to the latest version.",
          "**Steps are there but activities aren't**: Samsung Health exposes steps automatically, but workout sessions require separate permissions. In Health Connect → App permissions → Samsung Health, verify 'Exercise' is enabled for writing.",
          "**Data appears delayed**: sync between Samsung Health and Health Connect isn't real-time. It happens periodically, usually every 30-60 minutes. You can speed it up by manually opening Samsung Health.",
          "**Historical data is missing**: Health Connect doesn't sync retroactively. Activities before authorization won't appear. Use Samsung Health manual export to recover historical data.",
          "**Destination app sees nothing**: verify the app has READ permission on Health Connect. Samsung Health having write permission isn't enough.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "Il segnale che stai perdendo tempo", en: "The sign you're wasting time" },
      body: {
        it: "Se la tua app di destinazione non supporta ancora Health Connect nel 2026, non è un problema di configurazione: è un'app abbandonata. Due anni dopo la deprecazione di Google Fit, qualsiasi app attivamente mantenuta ha già implementato il supporto HC. Cambia app invece di cercare workaround per un prodotto che non riceve aggiornamenti.",
        en: "If your destination app still doesn't support Health Connect in 2026, this isn't a configuration problem: it's an abandoned app. Two years after Google Fit's deprecation, any actively maintained app has already implemented HC support. Switch apps instead of hunting for workarounds for a product that no longer receives updates.",
      },
    },
    { type: "heading", level: 2, text: { it: "In sintesi", en: "In summary" } },
    {
      type: "list",
      items: {
        it: [
          "Il sync diretto Samsung Health→Google Fit non esiste più dal 2024: Google ha deprecato Google Fit e spostato l'ecosistema Android su Health Connect.",
          "Il percorso corretto oggi è: Samsung Health scrive su Health Connect, le app di destinazione leggono da Health Connect. Funziona per la maggior parte dei dati standard.",
          "Dati non disponibili via Health Connect: metriche proprietarie Samsung, GPS dettagliato degli allenamenti, dati storici precedenti all'autorizzazione.",
          "Se l'app di destinazione non supporta Health Connect nel 2026, probabilmente non viene mantenuta: considera di cambiarla.",
          "I dati storici in Samsung Health sono al sicuro nel cloud Samsung indipendentemente da Google Fit. Per portarli altrove usa l'export manuale (CSV/XML).",
        ],
        en: [
          "Direct Samsung Health to Google Fit sync has not existed since 2024: Google deprecated Google Fit and moved the Android ecosystem to Health Connect.",
          "The correct path today is: Samsung Health writes to Health Connect, destination apps read from Health Connect. Works for most standard data.",
          "Data not available via Health Connect: Samsung proprietary metrics, detailed workout GPS, historical data predating authorization.",
          "If the destination app doesn't support Health Connect in 2026, it's probably not being maintained: consider switching.",
          "Historical data in Samsung Health is safe in Samsung cloud independent of Google Fit. To port it elsewhere, use manual export (CSV/XML).",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi leggere i dati Samsung Health da browser senza Google Fit?",
        en: "Want to read Samsung Health data from browser without Google Fit?",
      },
      body: {
        it: "Tra le opzioni che semplificano questo c'è FitMesh Sync: legge da Health Connect (dove Samsung Health scrive) e mostra i tuoi dati in una dashboard web accessibile da qualsiasi browser, senza dipendere da Google Fit o da infrastrutture proprietarie.",
        en: "Among the options that simplify this is FitMesh Sync: it reads from Health Connect (where Samsung Health writes) and shows your data in a web dashboard accessible from any browser, without depending on Google Fit or proprietary infrastructure.",
      },
      ctaLabel: {
        it: "Scopri FitMesh Sync per Samsung Health →",
        en: "Discover FitMesh Sync for Samsung Health →",
      },
      ctaHref: {
        it: "/it/sync/samsung-health",
        en: "/en/sync/samsung-health",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Perché Samsung Health non si sincronizza con Google Fit nel 2026?",
        en: "Why doesn't Samsung Health sync with Google Fit in 2026?",
      },
      a: {
        it: "Perché Google ha deprecato Google Fit e ha spostato l'ecosistema Android su Health Connect. Samsung ha seguito questo cambiamento: Samsung Health ora scrive su Health Connect invece di Google Fit. Se hai app che leggevano da Google Fit, devono aggiornarsi per leggere da Health Connect.",
        en: "Because Google deprecated Google Fit and moved the Android ecosystem to Health Connect. Samsung followed this change: Samsung Health now writes to Health Connect instead of Google Fit. If you have apps that read from Google Fit, they need to update to read from Health Connect.",
      },
    },
    {
      q: {
        it: "Devo disinstallare Google Fit?",
        en: "Do I need to uninstall Google Fit?",
      },
      a: {
        it: "Non necessariamente. Google Fit è innocua anche se installata. Ma se stai cercando di usarla come intermediario per ricevere dati da Samsung Health, non funzionerà più come prima. Health Connect è il percorso corretto. Google Fit può rimanere installata ma non è più il punto centrale dell'ecosistema salute Android.",
        en: "Not necessarily. Google Fit is harmless even if installed. But if you're trying to use it as an intermediary to receive data from Samsung Health, it won't work as before. Health Connect is the correct path. Google Fit can remain installed but is no longer the central point of the Android health ecosystem.",
      },
    },
    {
      q: {
        it: "Health Connect funziona su tutti i telefoni Android?",
        en: "Does Health Connect work on all Android phones?",
      },
      a: {
        it: "Health Connect richiede Android 9 o superiore (ma alcune funzioni richiedono Android 12+). Su Android 14 e superiori è integrato nel sistema operativo. Su Android 12-13 deve essere installato separatamente dal Play Store. Su versioni più vecchie di Android 9, non è disponibile. La maggior parte dei telefoni Samsung in commercio oggi (Galaxy S e A series) supporta Health Connect senza problemi.",
        en: "Health Connect requires Android 9 or higher (but some features require Android 12+). On Android 14 and above it's integrated into the operating system. On Android 12-13 it must be installed separately from the Play Store. On versions older than Android 9, it's not available. Most Samsung phones on sale today (Galaxy S and A series) support Health Connect without problems.",
      },
    },
    {
      q: {
        it: "I miei dati storici di Samsung Health sono persi se Google Fit smette di funzionare?",
        en: "Is my historical Samsung Health data lost if Google Fit stops working?",
      },
      a: {
        it: "No. I dati storici in Samsung Health sono nel cloud di Samsung (Samsung Cloud), indipendentemente da Google Fit. Il fatto che Google Fit non funzioni più come intermediario non tocca i dati in Samsung Health. Se vuoi portare lo storico su un'altra piattaforma, usa l'export Samsung Health (CSV/XML) o le nuove integrazioni via Health Connect per il dato recente.",
        en: "No. Historical data in Samsung Health is in Samsung's cloud (Samsung Cloud), independent of Google Fit. The fact that Google Fit no longer works as intermediary doesn't touch data in Samsung Health. If you want to port historical data to another platform, use Samsung Health export (CSV/XML) or new Health Connect integrations for recent data.",
      },
    },
    {
      q: {
        it: "Samsung Health può sincronizzarsi direttamente con Google Health?",
        en: "Can Samsung Health sync directly with Google Health?",
      },
      a: {
        it: "Google Health non è una piattaforma pubblica separata: è il marchio ombrello per i prodotti salute di Google (che include Health Connect, Fitbit, Google Fit). Il punto di integrazione tecnico è Health Connect. Samsung Health scrive su Health Connect, e qualsiasi app (incluse quelle di Google) può leggere da lì. Non esiste un sync diretto Samsung Health → un cloud Google specifico al di fuori di questo meccanismo.",
        en: "Google Health isn't a separate public platform: it's the umbrella brand for Google's health products (which includes Health Connect, Fitbit, Google Fit). The technical integration point is Health Connect. Samsung Health writes to Health Connect, and any app (including Google's) can read from there. There's no direct Samsung Health → specific Google cloud sync outside this mechanism.",
      },
    },
  ],
  related: [
    "come-funziona-health-connect",
    "health-connect-vs-samsung-health",
    "passi-non-si-sincronizzano-galaxy-watch",
  ],
  brandsMentioned: ["Samsung", "Google", "Fitbit"],
  ldType: "BlogPosting",
};
