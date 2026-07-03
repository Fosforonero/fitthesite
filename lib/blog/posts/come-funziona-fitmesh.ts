import type { BlogPost } from "../types";

/**
 * Guida esplicativa "come funziona FitMesh" con screenshot reali anonimizzati
 * (in inglese). SEO/GEO: definizione citabile in apertura, TL;DR, tabella,
 * FAQ ricca (FAQPage JSON-LD). Schermate via sezioni `image`. it/en; gli altri
 * locali si aggiungono dopo.
 */
export const post: BlogPost = {
  slug: "come-funziona-fitmesh",
  category: "guides",
  publishedAt: "2026-07-03",
  updatedAt: "2026-07-03",
  readMinutes: 7,
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Come funziona FitMesh: anello e orologio in un'unica dashboard",
      en: "How FitMesh works: your ring and watch in one dashboard",
    },
    subtitle: {
      it: "FitMesh Sync legge i dati dei tuoi wearable, incluso l'anello Colmi via Bluetooth, li unisce senza doppioni e li mostra in un'unica dashboard web. Ecco come funziona, schermata per schermata.",
      en: "FitMesh Sync reads your wearables' data, including the Colmi ring over Bluetooth, merges it without duplicates and shows it in one web dashboard. Here's how it works, screen by screen.",
    },
  },
  metaDescription: {
    it: "Come funziona FitMesh Sync: legge l'anello Colmi via Bluetooth e lo smartwatch via Health Connect, unisce i dati senza doppioni in un'unica dashboard web. Guida con schermate reali.",
    en: "How FitMesh Sync works: it reads the Colmi ring over Bluetooth and your smartwatch via Health Connect, merges data with no duplicates in one web dashboard. Guide with real screenshots.",
  },
  primaryKeyword: { it: "come funziona fitmesh", en: "how fitmesh works" },
  secondaryKeywords: {
    it: [
      "fitmesh cos'è",
      "fitmesh dashboard",
      "fitmesh anello colmi",
      "fitmesh health connect",
      "unire dati anello e orologio",
      "app unica dati wearable",
      "vedere dati wearable sul web",
    ],
    en: [
      "what is fitmesh",
      "fitmesh dashboard",
      "fitmesh colmi ring",
      "fitmesh health connect",
      "merge ring and watch data",
      "one app for wearable data",
      "see wearable data on the web",
    ],
  },
  tldr: {
    it: [
      "FitMesh Sync è un'app che raccoglie i dati dei tuoi wearable e li mostra in un'unica dashboard, sul telefono e sul web.",
      "Legge l'anello Colmi direttamente via Bluetooth e lo smartwatch tramite Health Connect su Android.",
      "Unisce le fonti con la deduplicazione: lo stesso passo non viene mai contato due volte.",
      "Per ogni metrica vedi da quale app arriva il dato (passi, sonno, frequenza cardiaca, SpO2).",
      "I dati restano sul tuo account nel cloud in UE. App Android disponibile ora, iOS in arrivo.",
    ],
    en: [
      "FitMesh Sync is an app that gathers your wearables' data and shows it in one dashboard, on your phone and on the web.",
      "It reads the Colmi ring directly over Bluetooth and your smartwatch through Health Connect on Android.",
      "It merges the sources with deduplication: the same step is never counted twice.",
      "For each metric you can see which app provided the data (steps, sleep, heart rate, SpO2).",
      "Your data stays on your account in the EU cloud. Android app available now, iOS coming.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se ti stai chiedendo come funziona FitMesh prima di provarlo, la risposta in una frase è questa: FitMesh Sync raccoglie i dati di tutti i tuoi wearable, incluso un anello smart economico, li unisce senza doppioni e te li mostra in un'unica dashboard, sul telefono e da qualsiasi browser. In questa guida lo vediamo schermata per schermata, con immagini reali dell'app.",
        en: "If you're wondering how FitMesh works before trying it, the one-sentence answer is this: FitMesh Sync gathers the data from all your wearables, including an affordable smart ring, merges it without duplicates and shows it to you in one dashboard, on your phone and from any browser. In this guide we go through it screen by screen, with real screenshots of the app.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cos'è FitMesh, in breve", en: "What FitMesh is, in short" },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync è un'app per la salute e il fitness che fa da ponte tra i tuoi dispositivi indossabili e una dashboard unificata. Molte persone usano un anello di notte e un orologio di giorno, ma i dati finiscono in app separate, ognuna con la sua vista parziale. FitMesh li mette insieme: una sola schermata con passi, frequenza cardiaca, sonno, SpO2, calorie e allenamenti, indipendentemente dal dispositivo che li ha registrati.",
        en: "FitMesh Sync is a health and fitness app that bridges your wearables and a unified dashboard. Many people wear a ring at night and a watch during the day, but the data ends up in separate apps, each with its own partial view. FitMesh brings it together: one screen with steps, heart rate, sleep, SpO2, calories and workouts, no matter which device recorded them.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Tutti i tuoi dati in un'unica dashboard",
        en: "All your data in one dashboard",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La schermata principale è la dashboard \"Oggi\": ogni scheda è una metrica, con il valore del giorno e la variazione rispetto al tuo trend. In un colpo d'occhio vedi passi, frequenza cardiaca, calorie, sonno, distanza, indice di recupero e il riepilogo degli allenamenti. Nessun salto tra app diverse.",
        en: "The main screen is the \"Today\" dashboard: each card is a metric, with the day's value and the change against your trend. At a glance you see steps, heart rate, calories, sleep, distance, a recovery index and your workout summary. No jumping between different apps.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/01-dashboard.png",
      alt: {
        it: "Dashboard di FitMesh Sync con passi, frequenza cardiaca, calorie, sonno, distanza e indice di recupero in un'unica vista",
        en: "FitMesh Sync dashboard showing steps, heart rate, calories, sleep, distance and recovery index in one view",
      },
      caption: {
        it: "La dashboard \"Oggi\": tutte le metriche in un posto solo.",
        en: "The \"Today\" dashboard: every metric in one place.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Da dove vengono i dati (e perché non ci sono doppioni)",
        en: "Where the data comes from (and why there are no duplicates)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questa è la parte che rende FitMesh diverso. Il Centro sincronizzazione mostra, per ogni metrica, quale app ha fornito il dato all'ultima sincronizzazione: i passi da Samsung Health, il sonno da Google, le calorie attive calcolate da FitMesh, e così via. Quando più fonti registrano la stessa cosa nello stesso momento, la deduplicazione sceglie il dato migliore invece di sommarli: lo stesso passo non viene contato due volte. Puoi approfondire il tema in [più smartwatch insieme senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi).",
        en: "This is the part that makes FitMesh different. The Sync Center shows, for each metric, which app provided the data at the last sync: steps from Samsung Health, sleep from Google, active calories computed by FitMesh, and so on. When multiple sources record the same thing at the same time, deduplication picks the best value instead of adding them up: the same step is never counted twice. You can dig deeper in [multiple smartwatches together without double data](/en/blog/piu-smartwatch-insieme-dati-doppi).",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/02-sync-center.png",
      alt: {
        it: "Centro sincronizzazione di FitMesh: per ogni metrica mostra l'app di provenienza del dato, con deduplicazione tra le fonti",
        en: "FitMesh Sync Center showing the source app for each metric, with deduplication across sources",
      },
      caption: {
        it: "Per ogni metrica vedi da dove arriva il dato. Niente somme sbagliate.",
        en: "For each metric you see where the data comes from. No wrong sums.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il tuo anello smart, letto via Bluetooth",
        en: "Your smart ring, read over Bluetooth",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh legge l'anello Colmi direttamente via Bluetooth, senza dover tenere aperta l'app del produttore. Dalla sezione \"Anello smart\" lo colleghi e, con \"Measure now\", fai una misura al volo di frequenza cardiaca e ossigeno nel sangue. I dati dell'anello (passi, battito, SpO2, sonno con fasi, stress, batteria) entrano nella stessa dashboard degli altri dispositivi. Sono misure di benessere di consumo, non strumenti diagnostici. Guida completa: [anello Colmi con FitMesh](/it/blog/colmi-ring-fitmesh).",
        en: "FitMesh reads the Colmi ring directly over Bluetooth, with no need to keep the maker's app open. From the \"Smart ring\" section you connect it and, with \"Measure now\", take an on-the-spot reading of heart rate and blood oxygen. The ring's data (steps, heart rate, SpO2, sleep with stages, stress, battery) flows into the same dashboard as your other devices. These are consumer wellness measurements, not diagnostic tools. Full guide: [the Colmi ring with FitMesh](/en/blog/colmi-ring-fitmesh).",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/03-smart-ring.png",
      alt: {
        it: "Schermata anello smart di FitMesh: misura al volo di frequenza cardiaca e SpO2 e collegamento dell'anello Colmi via Bluetooth",
        en: "FitMesh smart ring screen: on-the-spot heart rate and SpO2 measurement and Colmi ring pairing over Bluetooth",
      },
      caption: {
        it: "L'anello Colmi collegato via Bluetooth, con misura istantanea di battito e SpO2.",
        en: "The Colmi ring connected over Bluetooth, with instant heart rate and SpO2 reading.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Trend e storico", en: "Trends and history" },
    },
    {
      type: "paragraph",
      text: {
        it: "Oltre alla giornata, FitMesh tiene lo storico. Nella sezione Trend scegli il periodo (7 giorni, 30, 90 o un anno) e vedi medie, totali e la variazione di ogni metrica nel tempo: passi, sonno, recupero, HRV, frequenza a riposo. È il quadro d'insieme che una singola app del produttore raramente ti dà.",
        en: "Beyond the day itself, FitMesh keeps your history. In the Trends section you pick the range (7 days, 30, 90 or a year) and see averages, totals and how each metric changes over time: steps, sleep, recovery, HRV, resting heart rate. It's the bigger picture a single manufacturer app rarely gives you.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/04-trends.png",
      alt: {
        it: "Sezione Trend di FitMesh con medie e totali su 7 giorni, indice di recupero, sonno, HRV e variazioni percentuali",
        en: "FitMesh Trends section with 7-day averages and totals, recovery index, sleep, HRV and percentage changes",
      },
      caption: {
        it: "Trend su 7, 30, 90 giorni o un anno: lo storico, non solo l'oggi.",
        en: "Trends over 7, 30, 90 days or a year: your history, not just today.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Tutto quello che puoi fare", en: "Everything you can do" },
    },
    {
      type: "paragraph",
      text: {
        it: "Dal menu raggiungi tutte le funzioni: registrare un allenamento con cronometro, battito e distanza; i trend; collegare l'anello smart o gestire i dispositivi e la sincronizzazione via Health Connect; i provider esterni (Strava, Oura, Suunto e altri); impostazioni di profilo, obiettivi, unità e tema. C'è anche \"Condividi con AI\", che genera un testo con i tuoi dati da usare con un assistente.",
        en: "From the menu you reach every feature: record a workout with a timer, heart rate and distance; trends; connect the smart ring or manage devices and syncing via Health Connect; external providers (Strava, Oura, Suunto and more); settings for profile, goals, units and theme. There's also \"Share with AI\", which generates a text with your data to use with an assistant.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/05-menu.png",
      alt: {
        it: "Menu di FitMesh con registra allenamento, trend, anello smart, dispositivi e sync, provider esterni e impostazioni",
        en: "FitMesh menu with record workout, trends, smart ring, devices and sync, external providers and settings",
      },
      caption: {
        it: "Il menu: allenamenti, anello, sincronizzazione, provider esterni e impostazioni.",
        en: "The menu: workouts, ring, syncing, external providers and settings.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Come iniziare, in 3 passi", en: "How to get started, in 3 steps" },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Installa FitMesh Sync dal Play Store e accedi. Su Android autorizzi Health Connect, così l'app legge i dati del tuo smartwatch.",
          "Se hai un anello Colmi, aprilo dalla sezione \"Anello smart\" e collegalo via Bluetooth: passi, battito, SpO2 e sonno entrano nella dashboard.",
          "Apri la dashboard web dallo stesso account, da qualsiasi browser: ritrovi tutto unito e deduplicato, anche dal computer.",
        ],
        en: [
          "Install FitMesh Sync from the Play Store and sign in. On Android you grant Health Connect access, so the app reads your smartwatch data.",
          "If you have a Colmi ring, open the \"Smart ring\" section and connect it over Bluetooth: steps, heart rate, SpO2 and sleep flow into the dashboard.",
          "Open the web dashboard with the same account, from any browser: you find everything merged and deduplicated, from your computer too.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa fa, per piattaforma", en: "What it does, by platform" },
    },
    {
      type: "table",
      caption: {
        it: "Riepilogo delle funzioni principali di FitMesh Sync",
        en: "Summary of FitMesh Sync's main features",
      },
      headers: {
        it: ["Funzione", "Android", "iPhone"],
        en: ["Feature", "Android", "iPhone"],
      },
      rows: [
        {
          it: ["Legge lo smartwatch (Health Connect)", "Sì", "In arrivo (Apple Salute)"],
          en: ["Reads your smartwatch (Health Connect)", "Yes", "Coming (Apple Health)"],
        },
        {
          it: ["Anello Colmi via Bluetooth", "Sì", "In arrivo"],
          en: ["Colmi ring over Bluetooth", "Yes", "Coming"],
        },
        {
          it: ["Deduplicazione tra fonti", "Sì", "In arrivo"],
          en: ["Deduplication across sources", "Yes", "Coming"],
        },
        {
          it: ["Dashboard web (stesso account)", "Sì", "Sì"],
          en: ["Web dashboard (same account)", "Yes", "Yes"],
        },
        {
          it: ["Dati nel cloud in UE", "Sì", "Sì"],
          en: ["Data in the EU cloud", "Yes", "Yes"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Privacy: i tuoi dati nel cloud in UE",
        en: "Privacy: your data in the EU cloud",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "I dati salute restano sul tuo account, su server nell'Unione Europea. FitMesh non li vende e non mostra pubblicità: il servizio si sostiene con un piccolo abbonamento o uno sblocco a vita, e i primi 1000 iscritti founder hanno il Pro a vita gratis. Se vuoi il dettaglio: [FitMesh è gratis? prezzo e posti founder](/it/blog/fitmesh-gratis-prezzo-founder).",
        en: "Your health data stays on your account, on servers in the European Union. FitMesh doesn't sell it and shows no ads: the service is funded by a small subscription or a one-time lifetime unlock, and the first 1,000 founder sign-ups get lifetime Pro free. For the details: [is FitMesh free? pricing and founder spots](/en/blog/fitmesh-gratis-prezzo-founder).",
      },
    },
    {
      type: "cta",
      title: {
        it: "Prova FitMesh sui tuoi dati veri",
        en: "Try FitMesh on your real data",
      },
      body: {
        it: "L'app Android e la dashboard web sono disponibili ora, l'iPhone è in arrivo. I primi 1000 iscritti founder ottengono il Pro a vita gratis: collega i tuoi wearable e l'anello Colmi e vedi tutto in un posto solo.",
        en: "The Android app and web dashboard are available now, iPhone is coming. The first 1,000 founder sign-ups get lifetime Pro free: connect your wearables and the Colmi ring and see everything in one place.",
      },
      ctaLabel: { it: "Unisciti alla beta →", en: "Join the beta →" },
      ctaHref: { it: "/it/beta", en: "/en/beta" },
    },
  ],
  faq: [
    {
      q: { it: "Come funziona FitMesh?", en: "How does FitMesh work?" },
      a: {
        it: "FitMesh Sync legge i dati dei tuoi wearable, l'anello Colmi via Bluetooth e lo smartwatch tramite Health Connect su Android, li unisce con la deduplicazione (niente doppioni) e li mostra in un'unica dashboard sul telefono e sul web. I dati restano sul tuo account nel cloud in UE.",
        en: "FitMesh Sync reads your wearables' data, the Colmi ring over Bluetooth and your smartwatch through Health Connect on Android, merges it with deduplication (no duplicates) and shows it in one dashboard on your phone and on the web. Your data stays on your account in the EU cloud.",
      },
    },
    {
      q: {
        it: "FitMesh legge davvero l'anello smart?",
        en: "Does FitMesh really read the smart ring?",
      },
      a: {
        it: "Sì. Legge l'anello Colmi direttamente via Bluetooth, senza tenere aperta l'app del produttore: passi, frequenza cardiaca, SpO2, sonno con fasi, stress e batteria. Con \"Measure now\" puoi anche fare una misura istantanea di battito e ossigeno.",
        en: "Yes. It reads the Colmi ring directly over Bluetooth, with no need to keep the maker's app open: steps, heart rate, SpO2, sleep with stages, stress and battery. With \"Measure now\" you can also take an instant heart rate and blood oxygen reading.",
      },
    },
    {
      q: {
        it: "Con quali dispositivi funziona?",
        en: "Which devices does it work with?",
      },
      a: {
        it: "Su Android, con qualsiasi dispositivo che scrive su Health Connect (la maggior parte di smartwatch e band recenti), più l'anello Colmi via Bluetooth. Provider come Strava, Oura e Suunto si collegano dalla sezione provider esterni. La versione iPhone è in arrivo e userà Apple Salute.",
        en: "On Android, with any device that writes to Health Connect (most recent smartwatches and bands), plus the Colmi ring over Bluetooth. Providers like Strava, Oura and Suunto connect from the external providers section. The iPhone version is coming and will use Apple Health.",
      },
    },
    {
      q: {
        it: "Serve Health Connect?",
        en: "Do I need Health Connect?",
      },
      a: {
        it: "Su Android sì, per leggere i dati dello smartwatch: al primo avvio autorizzi FitMesh in Health Connect. L'anello Colmi invece si legge direttamente via Bluetooth, senza Health Connect.",
        en: "On Android yes, to read your smartwatch data: on first launch you grant FitMesh access in Health Connect. The Colmi ring, instead, is read directly over Bluetooth, without Health Connect.",
      },
    },
    {
      q: {
        it: "Perché i dati non vengono contati due volte?",
        en: "Why isn't data counted twice?",
      },
      a: {
        it: "Perché FitMesh applica una deduplicazione: se la stessa metrica arriva da più fonti nello stesso intervallo (per esempio anello e orologio), sceglie il dato migliore invece di sommarli. Nel Centro sincronizzazione vedi, per ogni metrica, da quale app proviene.",
        en: "Because FitMesh applies deduplication: if the same metric arrives from multiple sources in the same interval (for example ring and watch), it picks the best value instead of adding them up. In the Sync Center you see, for each metric, which app it comes from.",
      },
    },
    {
      q: {
        it: "Dove sono conservati i miei dati?",
        en: "Where is my data stored?",
      },
      a: {
        it: "Sul tuo account, su server nell'Unione Europea. FitMesh non vende i tuoi dati e non mostra pubblicità. Puoi aprire la stessa dashboard da qualsiasi browser con il tuo account.",
        en: "On your account, on servers in the European Union. FitMesh doesn't sell your data and shows no ads. You can open the same dashboard from any browser with your account.",
      },
    },
    {
      q: { it: "FitMesh è gratis?", en: "Is FitMesh free?" },
      a: {
        it: "Non c'è un piano gratuito permanente, ma costa pochissimo: prova completa di 14 giorni, poi un abbonamento leggero (circa un caffè ogni sei mesi) o lo sblocco a vita (meno di una pizza). I primi 1000 iscritti founder hanno il Pro a vita gratis.",
        en: "There's no permanent free plan, but it costs very little: a full 14-day trial, then a light subscription (about a coffee every six months) or a one-time lifetime unlock (less than a pizza). The first 1,000 founder sign-ups get lifetime Pro free.",
      },
    },
    {
      q: { it: "Funziona su iPhone?", en: "Does it work on iPhone?" },
      a: {
        it: "L'app Android è disponibile ora; la versione iPhone è in arrivo e scriverà su Apple Salute. La dashboard web, invece, è già accessibile da qualsiasi dispositivo con il tuo account, iPhone compreso.",
        en: "The Android app is available now; the iPhone version is coming and will write to Apple Health. The web dashboard, however, is already accessible from any device with your account, iPhone included.",
      },
    },
  ],
  related: [
    "colmi-ring-fitmesh",
    "piu-smartwatch-insieme-dati-doppi",
    "come-funziona-health-connect",
    "vedere-dati-wearable-browser-pc",
    "fitmesh-gratis-prezzo-founder",
  ],
  brandsMentioned: ["Colmi", "Samsung Health", "Google"],
  ldType: "BlogPosting",
};
