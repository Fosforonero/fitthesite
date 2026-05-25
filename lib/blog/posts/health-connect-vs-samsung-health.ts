import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "health-connect-vs-samsung-health",
  category: "comparisons",
  publishedAt: "2026-05-21",
  updatedAt: "2026-05-21",
  readMinutes: 8,
  primaryKeyword: {
    it: "health connect vs samsung health",
    en: "health connect vs samsung health",
  },
  secondaryKeywords: {
    it: [
      "samsung health o health connect",
      "health connect funziona con galaxy watch",
      "samsung health 2026",
      "samsung health esportare dati",
    ],
    en: [
      "samsung health or health connect",
      "health connect works with galaxy watch",
      "samsung health 2026",
      "samsung health export data",
    ],
  },
  metaDescription: {
    it: "Health Connect vs Samsung Health spiegati semplicemente: a cosa servono, perché lavorano insieme, e quando usare cosa nel 2026. Galaxy Watch incluso.",
    en: "Health Connect vs Samsung Health explained simply: what they do, why they work together, and when to use which in 2026. Galaxy Watch included.",
  },
  hero: {
    kicker: { it: "Confronto", en: "Comparison" },
    title: {
      it: "Health Connect vs Samsung Health: differenze 2026",
      en: "Health Connect vs Samsung Health: differences and when to use which in 2026",
    },
    subtitle: {
      it: "Non sono concorrenti. Lavorano insieme. Ma è importante capire chi fa cosa per non disabilitare quello sbagliato.",
      en: "Not competitors. They work together. But it matters to understand who does what so you don't disable the wrong one.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "La confusione è comprensibile. Hai un Galaxy Watch, accendi il telefono e vedi due app: Samsung Health e Health Connect. Entrambe parlano di passi, BPM, sonno. Sembrano fare la stessa cosa. Domanda naturale: ne servono davvero due? Possiamo disinstallare quella che non usiamo?",
        en: "The confusion is understandable. You have a Galaxy Watch, turn on the phone and see two apps: Samsung Health and Health Connect. Both talk about steps, HR, sleep. They look like they do the same thing. Natural question: do we really need both? Can we uninstall the one we don't use?",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Risposta breve: no, fanno cose diverse, e sui telefoni Samsung con Galaxy Watch ti servono entrambe. Risposta lunga: leggi avanti.",
        en: "Short answer: no, they do different things, and on Samsung phones with Galaxy Watch you need both. Long answer: read on.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Samsung Health: l'app del produttore", en: "Samsung Health: the manufacturer's app" },
    },
    {
      type: "paragraph",
      text: {
        it: "Samsung Health è l'app companion ufficiale per Galaxy Watch (e accessoriamente per altri device Samsung). Il suo lavoro è:",
        en: "Samsung Health is the official companion app for Galaxy Watch (and accessorily for other Samsung devices). Its job:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Ricevere i dati dal Watch via Bluetooth.",
          "Visualizzarli in dashboard, grafici, achievement, programmi guidati.",
          "Sincronizzarli col cloud Samsung Health (se hai un Samsung Account e l'opzione è attiva).",
          "Da metà 2024, scrivere automaticamente su Health Connect i tipi di dato richiesti.",
        ],
        en: [
          "Receive data from the Watch via Bluetooth.",
          "Display it in dashboards, charts, achievements, guided programs.",
          "Sync it with the Samsung Health cloud (if you have a Samsung Account and the option is on).",
          "Since mid-2024, automatically write to Health Connect for the requested data types.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Samsung Health è proprietaria, focalizzata su esperienza utente Samsung, e include feature consumer come food tracking, programmi fitness guidati, dashboard sociale (sfide tra amici). Il suo modello di dati è del tutto sue (formato interno, non documentato pubblicamente).",
        en: "Samsung Health is proprietary, focused on the Samsung user experience, and includes consumer features like food tracking, guided fitness programs, social dashboard (challenges with friends). Its data model is fully its own (internal format, not publicly documented).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Health Connect: il livello di scambio Android", en: "Health Connect: the Android exchange layer" },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect è una API e un'app distribuita da Google, pensata come livello neutrale dove tutte le app salute Android scrivono e leggono. Non ha una dashboard utente ricca — è quasi solo un pannello di controllo che ti mostra:",
        en: "Health Connect is an API and an app distributed by Google, designed as a neutral layer where all Android health apps write and read. It doesn't have a rich user dashboard — it's almost just a control panel showing you:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Quali app hanno il permesso di leggere ogni tipo di dato (passi, BPM, sonno, etc.).",
          "Quali app hanno il permesso di scrivere.",
          "Cronologia di chi ha letto cosa quando.",
          "Pulsante per revocare permessi singolarmente.",
        ],
        en: [
          "Which apps have permission to read each data type (steps, HR, sleep, etc.).",
          "Which apps have permission to write.",
          "History of who read what when.",
          "Button to revoke permissions individually.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il modello dati Health Connect è documentato pubblicamente (developer.android.com/health-connect), strutturato, e ogni tipo è una classe esplicita. È la versione 2.0 di Google Fit, completamente on-device.",
        en: "The Health Connect data model is publicly documented (developer.android.com/health-connect), structured, and each type is an explicit class. It's Google Fit 2.0, fully on-device.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Come lavorano insieme", en: "How they work together" },
    },
    {
      type: "paragraph",
      text: {
        it: "Sul tuo Galaxy Watch, il flusso reale dei dati è:",
        en: "On your Galaxy Watch, the actual data flow is:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Sensori del Watch → BLE → Samsung Health (app principale).",
          "Samsung Health archivia internamente + (se attivato) scrive su Health Connect i tipi di dato consentiti.",
          "Health Connect tiene una copia neutrale dei dati ed espone l'API a chiunque abbia il permesso.",
          "App terze (FitMesh Sync, Strava, MyFitnessPal, app di sleep coaching, etc.) leggono via Health Connect.",
        ],
        en: [
          "Watch sensors → BLE → Samsung Health (main app).",
          "Samsung Health stores internally + (if enabled) writes to Health Connect the allowed data types.",
          "Health Connect keeps a neutral copy of data and exposes the API to anyone with permission.",
          "Third-party apps (FitMesh Sync, Strava, MyFitnessPal, sleep coaching apps, etc.) read via Health Connect.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "Punto chiave", en: "Key point" },
      body: {
        it: "Samsung Health è chi raccoglie i dati e li gestisce. Health Connect è il quadro elettrico dei permessi che decide cosa esce verso le altre app. Disattivare Samsung Health = il Watch non si sincronizza più. Disattivare Health Connect = le app terze non vedono più i dati, ma Samsung Health continua a funzionare.",
        en: "Samsung Health is who collects data and manages it. Health Connect is the electrical panel deciding what goes out to other apps. Disable Samsung Health = the Watch no longer syncs. Disable Health Connect = third-party apps no longer see data, but Samsung Health keeps working.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Differenze pratiche, una per una", en: "Practical differences, one by one" },
    },
    {
      type: "table",
      headers: {
        it: ["Aspetto", "Samsung Health", "Health Connect"],
        en: ["Aspect", "Samsung Health", "Health Connect"],
      },
      rows: [
        {
          it: ["Funzione primaria", "App utente: visualizza, allenamenti, coaching", "Livello permessi tra app salute"],
          en: ["Primary function", "User app: visualize, workouts, coaching", "Permissions layer between health apps"],
        },
        {
          it: ["Dashboard ricca", "Sì (passi, sonno, food, sfide, ECG, etc.)", "No (solo gestione permessi)"],
          en: ["Rich dashboard", "Yes (steps, sleep, food, challenges, ECG, etc.)", "No (permissions only)"],
        },
        {
          it: ["Cloud sync", "Sì (Samsung Cloud, opt-in via Samsung Account)", "No (strettamente on-device)"],
          en: ["Cloud sync", "Yes (Samsung Cloud, opt-in via Samsung Account)", "No (strictly on-device)"],
        },
        {
          it: ["Tipi di dato proprietari", "Sì (es. Body Composition, allenamenti guidati)", "No, solo schemi standard"],
          en: ["Proprietary data types", "Yes (e.g. Body Composition, guided workouts)", "No, only standard schemas"],
        },
        {
          it: ["Esportazione manuale", "CSV via app, processo lungo", "Non c'è export utente (lo fanno le app terze)"],
          en: ["Manual export", "CSV via app, slow process", "No user export (third-party apps do it)"],
        },
        {
          it: ["Aggiornato da", "Samsung", "Google (con Play Store)"],
          en: ["Updated by", "Samsung", "Google (via Play Store)"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Quando usare cosa", en: "When to use which" },
    },
    {
      type: "list",
      items: {
        it: [
          "**Vuoi vedere il tuo sonno con grafici dettagliati o seguire un programma di allenamento Samsung?** → Samsung Health.",
          "**Vuoi che un'app terza (es. MyFitnessPal, app dietologica, app coaching) legga i tuoi dati?** → Devi avere Health Connect e dare permessi.",
          "**Sei preoccupato che Samsung mandi i tuoi dati nel cloud?** → In Samsung Health → Impostazioni → Privacy disabilita 'Sincronizza con Samsung Cloud'. I dati restano locali e continuano a fluire verso Health Connect.",
          "**Vuoi capire chi sta leggendo i tuoi dati?** → Apri Health Connect → Accessibilità app: vedi la lista completa con timestamp.",
          "**Vuoi disinstallare una?** → Su Galaxy phone non puoi disinstallare Samsung Health (preinstallato), ma puoi disabilitarlo (perderai il sync Watch). Health Connect è preinstallato su Android 14+ e può essere disabilitato senza rompere Samsung Health.",
        ],
        en: [
          "**Want to see your sleep with detailed charts or follow a Samsung workout program?** → Samsung Health.",
          "**Want a third-party app (e.g. MyFitnessPal, dietitian app, coaching app) to read your data?** → You need Health Connect with granted permissions.",
          "**Worried Samsung sends your data to the cloud?** → In Samsung Health → Settings → Privacy disable 'Sync with Samsung Cloud'. Data stays local and keeps flowing to Health Connect.",
          "**Want to see who's reading your data?** → Open Health Connect → App accessibility: see the full list with timestamps.",
          "**Want to uninstall one?** → On Galaxy phones you can't uninstall Samsung Health (preinstalled) but you can disable it (you'll lose Watch sync). Health Connect is preinstalled on Android 14+ and can be disabled without breaking Samsung Health.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "E se il telefono non è Samsung?",
        en: "What if the phone isn't Samsung?",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Funziona comunque. Samsung Health è disponibile gratis sul Play Store anche su Pixel, OnePlus, Xiaomi. Il Galaxy Watch si accoppia via Galaxy Wearable (anch'esso multi-brand) e Samsung Health prende il sopravvento per leggere i dati. La sincronizzazione con Health Connect funziona uguale.",
        en: "Still works. Samsung Health is free on the Play Store also for Pixel, OnePlus, Xiaomi. The Galaxy Watch pairs via Galaxy Wearable (also multi-brand) and Samsung Health takes over to read data. Health Connect sync works the same way.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi una dashboard alternativa che legga da Health Connect?",
        en: "Want an alternative dashboard reading from Health Connect?",
      },
      body: {
        it: "FitMesh Sync legge i dati Galaxy Watch via Health Connect e li mostra su una dashboard web pulita. Privacy-first, no ads, no tracker.",
        en: "FitMesh Sync reads Galaxy Watch data via Health Connect and shows it on a clean web dashboard. Privacy-first, no ads, no trackers.",
      },
      ctaLabel: { it: "Vedi Galaxy Watch su FitMesh →", en: "See Galaxy Watch on FitMesh →" },
      ctaHref: { it: "/it/sync/galaxy-watch", en: "/en/sync/galaxy-watch" },
    },
  ],
  faq: [
    {
      q: {
        it: "Posso usare Health Connect senza Samsung Health?",
        en: "Can I use Health Connect without Samsung Health?",
      },
      a: {
        it: "Su un Galaxy Watch no — Samsung Health è il bridge ufficiale tra il Watch e il telefono. Senza Samsung Health il Watch non sincronizza. Su un altro wearable (Pixel Watch, Mi Band, Garmin, Polar, etc.) puoi usare la rispettiva app companion + Health Connect e ignorare completamente Samsung Health.",
        en: "On a Galaxy Watch no — Samsung Health is the official bridge between Watch and phone. Without it the Watch won't sync. On other wearables (Pixel Watch, Mi Band, Garmin, Polar, etc.) you can use the respective companion app + Health Connect and ignore Samsung Health entirely.",
      },
    },
    {
      q: {
        it: "I dati passano dal cloud Samsung anche se uso solo Health Connect?",
        en: "Do data pass through Samsung cloud even if I only use Health Connect?",
      },
      a: {
        it: "Dipende dalle tue impostazioni. Se in Samsung Health hai disabilitato la sincronizzazione con Samsung Account, i dati restano locali sul telefono e poi sono copiati su Health Connect (anch'esso locale). Se invece la sincronizzazione cloud è attiva, i dati sono prima nel cloud Samsung e poi copiati localmente — anche se Health Connect vede solo la copia locale.",
        en: "Depends on your settings. If you disabled sync with Samsung Account in Samsung Health, data stays local on the phone then is copied to Health Connect (also local). If cloud sync is enabled, data is first in the Samsung cloud then copied locally — even though Health Connect only sees the local copy.",
      },
    },
    {
      q: {
        it: "Quando Health Connect non riceve i dati Samsung Health?",
        en: "When does Health Connect not receive Samsung Health data?",
      },
      a: {
        it: "Tre casi tipici. Uno: Samsung Health → Impostazioni → Health Connect non è stato autorizzato (situazione default su molti device fino al 2024). Due: hai autorizzato solo alcuni tipi di dato. Tre: una versione vecchia di Samsung Health (< 6.20 ca.) non ha la sync HC. Aggiorna e ri-autorizza.",
        en: "Three typical cases. One: Samsung Health → Settings → Health Connect not authorized (default situation on many devices until 2024). Two: only some data types authorized. Three: an old Samsung Health version (< ~6.20) doesn't have HC sync. Update and re-authorize.",
      },
    },
  ],
  related: [
    "guida-sync-wearable-2026",
    "backup-galaxy-watch-pc",
    "alternative-health-sync-2026",
  ],
  brandsMentioned: ["Samsung", "Google"],
  ldType: "BlogPosting",
};
