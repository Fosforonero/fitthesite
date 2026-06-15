import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "health-connect-vs-samsung-health",
  category: "comparisons",
  publishedAt: "2026-05-21",
  updatedAt: "2026-05-21",
  readMinutes: 8,
  tldr: {
    it: [
      "Samsung Health e Health Connect non sono concorrenti: lavorano insieme.",
      "Samsung Health raccoglie i dati dal Galaxy Watch via Bluetooth: disabilitarla rompe il sync del Watch.",
      "Health Connect è il layer di permessi Android tra app salute: disabilitarla impedisce alle app terze di leggere i dati, ma Samsung Health continua a funzionare.",
      "Il flusso reale è: Watch → Samsung Health → Health Connect → app terze.",
      "Per bloccare il cloud Samsung senza rompere nulla: Samsung Health → Impostazioni → Privacy → disabilita la sincronizzazione con Samsung Cloud. I dati restano locali e continuano a fluire verso Health Connect.",
    ],
    en: [
      "Samsung Health and Health Connect are not competitors: they work together.",
      "Samsung Health collects data from the Galaxy Watch via Bluetooth: disabling it breaks Watch sync.",
      "Health Connect is the Android permissions layer between health apps: disabling it stops third-party apps from reading data, but Samsung Health keeps working.",
      "The real flow is: Watch → Samsung Health → Health Connect → third-party apps.",
      "To block the Samsung cloud without breaking anything: Samsung Health → Settings → Privacy → disable sync with Samsung Cloud. Data stays local and keeps flowing to Health Connect.",
    ],
    es: [
      "Samsung Health y Health Connect no son competidores: trabajan juntos.",
      "Samsung Health recopila los datos del Galaxy Watch por Bluetooth: desactivarla rompe la sincronización del Watch.",
      "Health Connect es la capa de permisos de Android entre apps de salud: desactivarla impide que apps de terceros lean tus datos, pero Samsung Health sigue funcionando.",
      "El flujo real es: Watch → Samsung Health → Health Connect → apps de terceros.",
      "Para bloquear la nube de Samsung sin romper nada: Samsung Health → Ajustes → Privacidad → desactiva la sincronización con Samsung Cloud. Los datos quedan locales y siguen fluyendo hacia Health Connect.",
    ],
  },
  primaryKeyword: {
    it: "health connect vs samsung health",
    en: "health connect vs samsung health",
    es: "health connect vs samsung health",
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
    es: "Health Connect vs Samsung Health explicados de forma sencilla: para qué sirven, por qué trabajan juntos y cuándo usar cada uno en 2026. Galaxy Watch incluido.",
  },
  hero: {
    kicker: { it: "Confronto", en: "Comparison", es: "Comparativa" },
    title: {
      it: "Health Connect vs Samsung Health: differenze 2026",
      en: "Health Connect vs Samsung Health: differences and when to use which in 2026",
      es: "Health Connect vs Samsung Health: diferencias y cuándo usar cada uno en 2026",
    },
    subtitle: {
      it: "Non sono concorrenti. Lavorano insieme. Ma è importante capire chi fa cosa per non disabilitare quello sbagliato.",
      en: "Not competitors. They work together. But it matters to understand who does what so you don't disable the wrong one.",
      es: "No son competidores. Trabajan juntos. Pero es importante entender qué hace cada uno para no desactivar el que no debes.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Samsung Health e Health Connect non sono concorrenti: lavorano insieme, e disabilitare quella sbagliata interrompe il sync del Galaxy Watch o impedisce alle app terze di leggere i tuoi dati. Samsung Health raccoglie i dati dal Watch; Health Connect è il quadro elettrico dei permessi che decide cosa esce verso le altre app. Capire questa distinzione risolve il 90% delle domande su Galaxy Watch e app fitness.",
        en: "Samsung Health and Health Connect are not competitors: they work together, and disabling the wrong one either breaks Galaxy Watch sync or stops third-party apps from reading your data. Samsung Health collects data from the Watch; Health Connect is the permissions panel that decides what flows out to other apps. Understanding this distinction resolves 90% of questions about Galaxy Watch and fitness apps.",
        es: "Samsung Health y Health Connect no son competidores: trabajan juntos, y desactivar el incorrecto puede romper la sincronización del Galaxy Watch o impedir que las apps de terceros lean tus datos. Samsung Health recopila los datos del Watch; Health Connect es el panel de permisos que decide qué sale hacia las demás apps. Entender esta distinción resuelve el 90% de las dudas sobre Galaxy Watch y apps de fitness.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Samsung Health: l'app del produttore", en: "Samsung Health: the manufacturer's app", es: "Samsung Health: la app del fabricante" },
    },
    {
      type: "paragraph",
      text: {
        it: "Samsung Health è l'app companion ufficiale per Galaxy Watch (e accessoriamente per altri device Samsung). Il suo lavoro è:",
        en: "Samsung Health is the official companion app for Galaxy Watch (and accessorily for other Samsung devices). Its job:",
        es: "Samsung Health es la app compañera oficial para Galaxy Watch (y también para otros dispositivos Samsung). Sus funciones son:",
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
        es: [
          "Recibir los datos del Watch por Bluetooth.",
          "Mostrarlos en paneles, gráficos, logros y programas guiados.",
          "Sincronizarlos con la nube de Samsung Health (si tienes una Samsung Account y la opción está activada).",
          "Desde mediados de 2024, escribir automáticamente en Health Connect los tipos de dato permitidos.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Samsung Health è proprietaria, focalizzata su esperienza utente Samsung, e include feature consumer come food tracking, programmi fitness guidati, dashboard sociale (sfide tra amici). Il suo modello di dati è del tutto sue (formato interno, non documentato pubblicamente).",
        en: "Samsung Health is proprietary, focused on the Samsung user experience, and includes consumer features like food tracking, guided fitness programs, social dashboard (challenges with friends). Its data model is fully its own (internal format, not publicly documented).",
        es: "Samsung Health es propietaria, orientada a la experiencia de usuario Samsung, e incluye funciones de consumo como seguimiento de alimentación, programas de fitness guiados y panel social (retos entre amigos). Su modelo de datos es completamente propio (formato interno, no documentado públicamente).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Health Connect: il livello di scambio Android", en: "Health Connect: the Android exchange layer", es: "Health Connect: la capa de intercambio de Android" },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect è una API e un'app distribuita da Google, pensata come livello neutrale dove tutte le app salute Android scrivono e leggono. Non ha una dashboard utente ricca: è quasi solo un pannello di controllo che ti mostra:",
        en: "Health Connect is an API and an app distributed by Google, designed as a neutral layer where all Android health apps write and read. It doesn't have a rich user dashboard: it's almost just a control panel showing you:",
        es: "Health Connect es una API y una app distribuida por Google, diseñada como capa neutral donde todas las apps de salud de Android leen y escriben datos. No tiene un panel de usuario completo: es casi exclusivamente un panel de control que te muestra:",
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
        es: [
          "Qué apps tienen permiso para leer cada tipo de dato (pasos, frecuencia cardíaca, sueño, etc.).",
          "Qué apps tienen permiso para escribir.",
          "Historial de quién ha leído qué y cuándo.",
          "Botón para revocar permisos individualmente.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il modello dati Health Connect è documentato pubblicamente (developer.android.com/health-connect), strutturato, e ogni tipo è una classe esplicita. È la versione 2.0 di Google Fit, completamente on-device.",
        en: "The Health Connect data model is publicly documented (developer.android.com/health-connect), structured, and each type is an explicit class. It's Google Fit 2.0, fully on-device.",
        es: "El modelo de datos de Health Connect está documentado públicamente (developer.android.com/health-connect), es estructurado y cada tipo es una clase explícita. Es Google Fit 2.0, completamente en el dispositivo.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Come lavorano insieme", en: "How they work together", es: "Cómo trabajan juntos" },
    },
    {
      type: "paragraph",
      text: {
        it: "Sul tuo Galaxy Watch, il flusso reale dei dati è:",
        en: "On your Galaxy Watch, the actual data flow is:",
        es: "En tu Galaxy Watch, el flujo real de datos es:",
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
        es: [
          "Sensores del Watch → BLE → Samsung Health (app principal).",
          "Samsung Health guarda internamente y (si está activado) escribe en Health Connect los tipos de dato permitidos.",
          "Health Connect mantiene una copia neutral de los datos y expone su acceso a cualquier app con permiso.",
          "Apps de terceros (FitMesh Sync, Strava, MyFitnessPal, apps de seguimiento del sueño, etc.) leen a través de Health Connect.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "Punto chiave", en: "Key point", es: "Punto clave" },
      body: {
        it: "Samsung Health è chi raccoglie i dati e li gestisce. Health Connect è il quadro elettrico dei permessi che decide cosa esce verso le altre app. Disattivare Samsung Health = il Watch non si sincronizza più. Disattivare Health Connect = le app terze non vedono più i dati, ma Samsung Health continua a funzionare.",
        en: "Samsung Health is who collects data and manages it. Health Connect is the electrical panel deciding what goes out to other apps. Disable Samsung Health = the Watch no longer syncs. Disable Health Connect = third-party apps no longer see data, but Samsung Health keeps working.",
        es: "Samsung Health es quien recopila los datos y los gestiona. Health Connect es el panel de permisos que decide qué sale hacia las demás apps. Desactivar Samsung Health = el Watch deja de sincronizarse. Desactivar Health Connect = las apps de terceros dejan de ver los datos, pero Samsung Health sigue funcionando.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Differenze pratiche, una per una", en: "Practical differences, one by one", es: "Diferencias prácticas, una por una" },
    },
    {
      type: "table",
      headers: {
        it: ["Aspetto", "Samsung Health", "Health Connect"],
        en: ["Aspect", "Samsung Health", "Health Connect"],
        es: ["Aspecto", "Samsung Health", "Health Connect"],
      },
      rows: [
        {
          it: ["Funzione primaria", "App utente: visualizza, allenamenti, coaching", "Livello permessi tra app salute"],
          en: ["Primary function", "User app: visualize, workouts, coaching", "Permissions layer between health apps"],
          es: ["Función principal", "App de usuario: visualización, entrenamientos, coaching", "Capa de permisos entre apps de salud"],
        },
        {
          it: ["Dashboard ricca", "Sì (passi, sonno, food, sfide, ECG, etc.)", "No (solo gestione permessi)"],
          en: ["Rich dashboard", "Yes (steps, sleep, food, challenges, ECG, etc.)", "No (permissions only)"],
          es: ["Panel completo", "Sí (pasos, sueño, alimentación, retos, ECG, etc.)", "No (solo gestión de permisos)"],
        },
        {
          it: ["Cloud sync", "Sì (Samsung Cloud, opt-in via Samsung Account)", "No (strettamente on-device)"],
          en: ["Cloud sync", "Yes (Samsung Cloud, opt-in via Samsung Account)", "No (strictly on-device)"],
          es: ["Sincronización en la nube", "Sí (Samsung Cloud, opcional con Samsung Account)", "No (estrictamente en el dispositivo)"],
        },
        {
          it: ["Tipi di dato proprietari", "Sì (es. Body Composition, allenamenti guidati)", "No, solo schemi standard"],
          en: ["Proprietary data types", "Yes (e.g. Body Composition, guided workouts)", "No, only standard schemas"],
          es: ["Tipos de dato propietarios", "Sí (p. ej. composición corporal, entrenamientos guiados)", "No, solo esquemas estándar"],
        },
        {
          it: ["Esportazione manuale", "CSV via app, processo lungo", "Non c'è export utente (lo fanno le app terze)"],
          en: ["Manual export", "CSV via app, slow process", "No user export (third-party apps do it)"],
          es: ["Exportación manual", "CSV desde la app, proceso lento", "No hay exportación para el usuario (lo hacen las apps de terceros)"],
        },
        {
          it: ["Aggiornato da", "Samsung", "Google (con Play Store)"],
          en: ["Updated by", "Samsung", "Google (via Play Store)"],
          es: ["Actualizado por", "Samsung", "Google (a través de Play Store)"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Quando usare cosa", en: "When to use which", es: "Cuándo usar cada uno" },
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
        es: [
          "**¿Quieres ver tu sueño con gráficos detallados o seguir un programa de entrenamiento de Samsung?** → Samsung Health.",
          "**¿Quieres que una app de terceros (p. ej. MyFitnessPal, app de nutrición, app de coaching) lea tus datos?** → Necesitas Health Connect y darle los permisos correspondientes.",
          "**¿Te preocupa que Samsung envíe tus datos a la nube?** → En Samsung Health → Ajustes → Privacidad desactiva 'Sincronizar con Samsung Cloud'. Los datos quedan locales y siguen fluyendo hacia Health Connect.",
          "**¿Quieres saber quién está leyendo tus datos?** → Abre Health Connect → Acceso de apps: verás la lista completa con marcas de tiempo.",
          "**¿Quieres desinstalar una?** → En teléfonos Galaxy no puedes desinstalar Samsung Health (viene preinstalada), pero puedes desactivarla (perderás la sincronización con el Watch). Health Connect viene preinstalado en Android 14+ y puede desactivarse sin afectar a Samsung Health.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "E se il telefono non è Samsung?",
        en: "What if the phone isn't Samsung?",
        es: "¿Y si el teléfono no es Samsung?",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Funziona comunque. Samsung Health è disponibile gratis sul Play Store anche su Pixel, OnePlus, Xiaomi. Il Galaxy Watch si accoppia via Galaxy Wearable (anch'esso multi-brand) e Samsung Health prende il sopravvento per leggere i dati. La sincronizzazione con Health Connect funziona uguale.",
        en: "Still works. Samsung Health is free on the Play Store also for Pixel, OnePlus, Xiaomi. The Galaxy Watch pairs via Galaxy Wearable (also multi-brand) and Samsung Health takes over to read data. Health Connect sync works the same way.",
        es: "Funciona igual. Samsung Health está disponible gratis en Play Store también para Pixel, OnePlus, Xiaomi. El Galaxy Watch se vincula a través de Galaxy Wearable (también compatible con múltiples marcas) y Samsung Health toma el control para leer los datos. La sincronización con Health Connect funciona exactamente igual.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "In sintesi", en: "In summary", es: "En resumen" },
    },
    {
      type: "list",
      items: {
        it: [
          "Samsung Health raccoglie i dati dal Galaxy Watch via Bluetooth e li gestisce: disabilitarla rompe il sync del Watch.",
          "Health Connect è il layer di permessi Android tra app salute: disabilitarla impedisce alle app terze di leggere i dati, ma Samsung Health continua a funzionare.",
          "Il flusso dati reale è: Watch → Samsung Health → Health Connect → app terze (FitMesh Sync, MyFitnessPal, ecc.).",
          "Per bloccare il cloud Samsung senza rompere nulla: Samsung Health → Impostazioni → Privacy → disabilita 'Sincronizza con Samsung Cloud'. I dati restano locali e continuano a fluire verso Health Connect.",
          "Per vedere chi legge i tuoi dati: Health Connect → Accesso alle app → lista completa con timestamp.",
        ],
        en: [
          "Samsung Health collects data from the Galaxy Watch via Bluetooth and manages it: disabling it breaks Watch sync.",
          "Health Connect is the Android permissions layer between health apps: disabling it stops third-party apps from reading data, but Samsung Health keeps working.",
          "The real data flow is: Watch → Samsung Health → Health Connect → third-party apps (FitMesh Sync, MyFitnessPal, etc.).",
          "To block Samsung cloud without breaking anything: Samsung Health → Settings → Privacy → disable 'Sync with Samsung Cloud'. Data stays local and keeps flowing to Health Connect.",
          "To see who reads your data: Health Connect → App access → full list with timestamps.",
        ],
        es: [
          "Samsung Health recopila los datos del Galaxy Watch por Bluetooth y los gestiona: desactivarla rompe la sincronización del Watch.",
          "Health Connect es la capa de permisos de Android entre apps de salud: desactivarla impide que las apps de terceros lean los datos, pero Samsung Health sigue funcionando.",
          "El flujo de datos real es: Watch → Samsung Health → Health Connect → apps de terceros (FitMesh Sync, MyFitnessPal, etc.).",
          "Para bloquear la nube de Samsung sin romper nada: Samsung Health → Ajustes → Privacidad → desactiva 'Sincronizar con Samsung Cloud'. Los datos quedan locales y siguen fluyendo hacia Health Connect.",
          "Para ver quién lee tus datos: Health Connect → Acceso de apps → lista completa con marcas de tiempo.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi una dashboard alternativa che legga da Health Connect?",
        en: "Want an alternative dashboard reading from Health Connect?",
        es: "¿Quieres un panel alternativo que lea desde Health Connect?",
      },
      body: {
        it: "FitMesh Sync legge i dati Galaxy Watch via Health Connect e li mostra su una dashboard web pulita. Privacy-first, no ads, no tracker.",
        en: "FitMesh Sync reads Galaxy Watch data via Health Connect and shows it on a clean web dashboard. Privacy-first, no ads, no trackers.",
        es: "FitMesh Sync lee los datos del Galaxy Watch a través de Health Connect y los muestra en un panel web limpio. Privacidad ante todo, sin anuncios, sin rastreadores.",
      },
      ctaLabel: { it: "Vedi Galaxy Watch su FitMesh →", en: "See Galaxy Watch on FitMesh →", es: "Ver Galaxy Watch en FitMesh →" },
      ctaHref: { it: "/it/sync/galaxy-watch", en: "/en/sync/galaxy-watch" },
    },
  ],
  faq: [
    {
      q: {
        it: "Posso usare Health Connect senza Samsung Health?",
        en: "Can I use Health Connect without Samsung Health?",
        es: "¿Puedo usar Health Connect sin Samsung Health?",
      },
      a: {
        it: "Su un Galaxy Watch no: Samsung Health è il bridge ufficiale tra il Watch e il telefono. Senza Samsung Health il Watch non sincronizza. Su un altro wearable (Pixel Watch, Mi Band, Garmin, Polar, etc.) puoi usare la rispettiva app companion + Health Connect e ignorare completamente Samsung Health.",
        en: "On a Galaxy Watch no: Samsung Health is the official bridge between Watch and phone. Without it the Watch won't sync. On other wearables (Pixel Watch, Mi Band, Garmin, Polar, etc.) you can use the respective companion app + Health Connect and ignore Samsung Health entirely.",
        es: "En un Galaxy Watch no: Samsung Health es el puente oficial entre el Watch y el teléfono. Sin ella, el Watch no sincroniza. Con otros wearables (Pixel Watch, Mi Band, Garmin, Polar, etc.) puedes usar la app compañera correspondiente junto con Health Connect e ignorar Samsung Health por completo.",
      },
    },
    {
      q: {
        it: "I dati passano dal cloud Samsung anche se uso solo Health Connect?",
        en: "Do data pass through Samsung cloud even if I only use Health Connect?",
        es: "¿Los datos pasan por la nube de Samsung aunque use solo Health Connect?",
      },
      a: {
        it: "Dipende dalle tue impostazioni. Se in Samsung Health hai disabilitato la sincronizzazione con Samsung Account, i dati restano locali sul telefono e poi sono copiati su Health Connect (anch'esso locale). Se invece la sincronizzazione cloud è attiva, i dati sono prima nel cloud Samsung e poi copiati localmente, anche se Health Connect vede solo la copia locale.",
        en: "Depends on your settings. If you disabled sync with Samsung Account in Samsung Health, data stays local on the phone then is copied to Health Connect (also local). If cloud sync is enabled, data is first in the Samsung cloud then copied locally, even though Health Connect only sees the local copy.",
        es: "Depende de tus ajustes. Si en Samsung Health desactivaste la sincronización con Samsung Account, los datos quedan locales en el teléfono y luego se copian en Health Connect (también local). Si la sincronización en la nube está activada, los datos van primero a la nube de Samsung y después se copian localmente, aunque Health Connect solo ve la copia local.",
      },
    },
    {
      q: {
        it: "Quando Health Connect non riceve i dati Samsung Health?",
        en: "When does Health Connect not receive Samsung Health data?",
        es: "¿Cuándo Health Connect no recibe los datos de Samsung Health?",
      },
      a: {
        it: "Tre casi tipici. Uno: Samsung Health → Impostazioni → Health Connect non è stato autorizzato (situazione default su molti device fino al 2024). Due: hai autorizzato solo alcuni tipi di dato. Tre: una versione vecchia di Samsung Health (< 6.20 ca.) non ha la sync HC. Aggiorna e ri-autorizza.",
        en: "Three typical cases. One: Samsung Health → Settings → Health Connect not authorized (default situation on many devices until 2024). Two: only some data types authorized. Three: an old Samsung Health version (< ~6.20) doesn't have HC sync. Update and re-authorize.",
        es: "Tres casos habituales. Primero: Samsung Health → Ajustes → Health Connect no fue autorizado (situación por defecto en muchos dispositivos hasta 2024). Segundo: solo autorizaste algunos tipos de dato. Tercero: una versión antigua de Samsung Health (anterior a la 6.20 aprox.) no tiene sincronización con Health Connect. Actualiza y vuelve a autorizar.",
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
