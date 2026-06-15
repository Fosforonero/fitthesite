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
    es: [
      "Tras la migración de 2023, los datos de Fitbit residen en Google: la exportación se realiza a través de Google Takeout (takeout.google.com), ya no desde Fitbit.com.",
      "Google Takeout es el método más completo: incluye todo el historial en JSON/CSV, desde las actividades hasta el sueño y la frecuencia cardíaca por minuto.",
      "Health Connect es el método para el flujo continuo: desde la app de Fitbit a HC, cualquier app Android con permisos HC puede leer los datos.",
      "Límite de HC para Fitbit: las fases del sueño (REM/profundo/ligero) no se exponen de forma granular; el GPS y el VO₂ máx requieren la Fitbit Web API.",
      "Antes de cerrar la cuenta: exporta con Takeout y luego solicita la eliminación GDPR. Nunca en el orden inverso.",
    ],
  },
  primaryKeyword: {
    it: "esportare dati fitbit dopo google",
    en: "export fitbit data after google",
    es: "exportar datos fitbit después de google",
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
    es: "Tras la adquisición de Fitbit por Google: cómo exportar tus datos de Fitbit en 2026, qué cambia si migraste a Google Account y qué alternativas existen.",
  },
  hero: {
    kicker: { it: "Ecosistema", en: "Ecosystem", es: "Ecosistema" },
    title: {
      it: "Esportare dati Fitbit dopo l'acquisto Google",
      en: "Exporting Fitbit data after the Google acquisition: practical guide",
      es: "Exportar datos de Fitbit después de la compra por Google: guía práctica",
    },
    subtitle: {
      it: "Google ha comprato Fitbit nel 2021, ha unificato account nel 2023, ha sostituito Fitbit.com con strumenti Google. Dove vanno i tuoi dati e come li porti via.",
      en: "Google bought Fitbit in 2021, unified accounts in 2023, replaced Fitbit.com with Google tools. Where your data goes and how to take it out.",
      es: "Google compró Fitbit en 2021, unificó las cuentas en 2023 y reemplazó Fitbit.com con herramientas propias. Aquí te explicamos dónde están tus datos y cómo recuperarlos.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Esportare i dati Fitbit nel 2026 è più semplice di quanto sembri, ma richiede di capire una cosa fondamentale: dopo l'acquisizione Google e la migrazione forzata del 2023, i tuoi dati Fitbit vivono nell'infrastruttura Google e si scaricano via Google Takeout. Il vecchio portale Fitbit.com è sparito. Questa guida mostra le due strade principali: Google Takeout per l'archivio storico completo, Health Connect per il flusso quotidiano verso app terze.",
        en: "Exporting Fitbit data in 2026 is simpler than it looks, but requires understanding one key thing: after the Google acquisition and forced 2023 migration, your Fitbit data lives in Google infrastructure and downloads via Google Takeout. The old Fitbit.com portal is gone. This guide covers the two main paths: Google Takeout for the full historical archive, Health Connect for the daily flow to third-party apps.",
        es: "Exportar los datos de Fitbit en 2026 es más sencillo de lo que parece, pero requiere entender algo fundamental: tras la adquisición por Google y la migración forzada de 2023, tus datos de Fitbit residen en la infraestructura de Google y se descargan a través de Google Takeout. El antiguo portal Fitbit.com ha desaparecido. Esta guía muestra los dos caminos principales: Google Takeout para el archivo histórico completo, y Health Connect para el flujo diario hacia apps de terceros.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Stato dell'arte a maggio 2026", en: "State of the art as of May 2026", es: "Estado actual a mayo de 2026" },
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
        es: [
          "**Cuenta**: el Fitbit Account heredado dejó de existir en 2025. Todas las cuentas son ahora Google Accounts. El acceso con email de Google es obligatorio.",
          "**App de Fitbit**: sigue disponible como app Android/iOS, ahora distribuida por Google LLC.",
          "**Fitbit.com**: el panel web público fue desmantelado. Solo permanece accesible el área de cuenta y privacidad.",
          "**Datos históricos**: completamente preservados durante la migración, accesibles desde la app y desde Google Takeout.",
          "**Health Connect**: desde 2024, la app de Fitbit escribe en Health Connect (Android). El Pixel Watch también.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Pixel Watch è Fitbit sotto il cofano", en: "Pixel Watch is Fitbit under the hood", es: "Pixel Watch es Fitbit por dentro" },
      body: {
        it: "Se hai un Pixel Watch (qualsiasi generazione), tecnicamente i tuoi dati vivono nell'infrastruttura Fitbit-by-Google. Tutto quello che dici di Fitbit in questo articolo vale per il tuo Pixel Watch.",
        en: "If you have a Pixel Watch (any generation), technically your data lives in Fitbit-by-Google infrastructure. Everything we say about Fitbit here applies to your Pixel Watch.",
        es: "Si tienes un Pixel Watch (de cualquier generación), técnicamente tus datos residen en la infraestructura de Fitbit-by-Google. Todo lo que se explica sobre Fitbit en este artículo aplica también a tu Pixel Watch.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Strada A: Google Takeout (la più completa)", en: "Path A: Google Takeout (most complete)", es: "Opción A: Google Takeout (la más completa)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Google Takeout è il portale ufficiale Google per scaricare dati di tutti i prodotti, incluso Fitbit. È il modo strutturato per ottenere lo storico completo.",
        en: "Google Takeout is the official Google portal to download data from all products, Fitbit included. It's the structured way to get the full history.",
        es: "Google Takeout es el portal oficial de Google para descargar los datos de todos sus productos, incluido Fitbit. Es la forma estructurada de obtener el historial completo.",
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
        es: [
          "Ve a takeout.google.com e inicia sesión con el Google Account vinculado a Fitbit.",
          "Haz clic en 'Deseleccionar todo', luego busca 'Fitbit' en la lista y selecciónalo.",
          "Despliega los subelementos (Activity, Sleep, Heart Rate, etc.): puedes elegir de forma granular qué tipos incluir.",
          "Elige el formato de exportación (JSON recomendado, CSV para la mayoría de los datos de actividad) y el destino (descarga directa, Drive, Dropbox, OneDrive).",
          "Inicia la exportación. Los tiempos van de minutos (cuenta pequeña) a horas (años de datos granulares). Recibirás un correo cuando esté listo.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il pacchetto contiene cartelle per ciascun tipo di dato. Esempi: 'Personal & Account → Profile', 'Activities → activities-YYYY-MM-DD.json' (daily summary), 'Heart Rate → heart_rate-YYYY-MM-DD.json' (sample per minuto), 'Sleep → sleep-YYYY-MM-DD.json' con stages. Per backfill profondi i file possono pesare GB.",
        en: "The package contains folders per data type. Examples: 'Personal & Account → Profile', 'Activities → activities-YYYY-MM-DD.json' (daily summary), 'Heart Rate → heart_rate-YYYY-MM-DD.json' (per-minute samples), 'Sleep → sleep-YYYY-MM-DD.json' with stages. For deep backfills files can weigh GB.",
        es: "El paquete contiene carpetas por tipo de dato. Por ejemplo: 'Personal & Account → Profile', 'Activities → activities-YYYY-MM-DD.json' (resumen diario), 'Heart Rate → heart_rate-YYYY-MM-DD.json' (muestras por minuto), 'Sleep → sleep-YYYY-MM-DD.json' con las fases. En historiales extensos, los archivos pueden pesar varios GB.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Strada B: Health Connect (per uso quotidiano)", en: "Path B: Health Connect (for daily use)", es: "Opción B: Health Connect (para uso diario)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Se non ti serve uno snapshot storico una tantum ma un flusso continuo dei dati Fitbit verso un'altra app, la strada è Health Connect.",
        en: "If you don't need a one-time historical snapshot but a continuous flow of Fitbit data to another app, the path is Health Connect.",
        es: "Si no necesitas un volcado histórico puntual sino un flujo continuo de datos de Fitbit hacia otra app, la opción es Health Connect.",
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
        es: [
          "Asegúrate de que la app de Fitbit esté actualizada (versión 4.10 o superior).",
          "Abre Fitbit → pestaña 'You' (abajo a la derecha) → busca 'Health Connect' en los ajustes del perfil.",
          "Toca 'Connect' y autoriza la escritura para los tipos de dato que quieres exponer.",
          "A partir de ese momento, cualquier app Android de terceros con permisos de Health Connect podrá leer tus datos de Fitbit.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Limite importante: via Health Connect, Fitbit espone le fasi di sonno solo come durata totale (non REM/Deep/Light/Awake distinte), e non espone GPS track per allenamenti, VO₂ max o Cardio Fitness Score. Per quelli serve la Fitbit Web API ufficiale (OAuth), che richiede approvazione developer ed è di solito accessibile solo ad app già approvate.",
        en: "Important limit: via Health Connect, Fitbit exposes sleep stages only as total duration (not separate REM/Deep/Light/Awake), and doesn't expose workout GPS tracks, VO₂ max or Cardio Fitness Score. For those you need the official Fitbit Web API (OAuth), which requires developer approval and is usually only accessible to already-approved apps.",
        es: "Límite importante: a través de Health Connect, Fitbit expone las fases del sueño solo como duración total (no como REM/profundo/ligero/despierto por separado), y no expone las rutas GPS de los entrenamientos, el VO₂ máx ni el Cardio Fitness Score. Para esos datos se necesita la Fitbit Web API oficial (OAuth), que requiere aprobación como desarrollador y suele estar disponible solo para apps ya aprobadas.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa fare prima di chiudere l'account", en: "What to do before closing the account", es: "Qué hacer antes de cerrar la cuenta" },
    },
    {
      type: "paragraph",
      text: {
        it: "Se stai pensando di lasciare Fitbit (per passare a Garmin, Apple Watch, Galaxy Watch), fai questi tre passaggi in ordine:",
        en: "If you're thinking of leaving Fitbit (to switch to Garmin, Apple Watch, Galaxy Watch), do these three steps in order:",
        es: "Si estás pensando en dejar Fitbit (para pasarte a Garmin, Apple Watch o Galaxy Watch), sigue estos tres pasos en orden:",
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
        es: [
          "**Exporta todo con Takeout** antes de cualquier otra cosa. Una vez eliminada la cuenta, ya no es posible.",
          "**Desactiva la sincronización en la nube** que ya no necesites (Strava, MyFitnessPal sync, etc.).",
          "**Solicita la eliminación GDPR** si quieres asegurarte de que todo se borre también de las copias de seguridad. Ve a privacy.google.com y selecciona 'Eliminar tus datos'.",
        ],
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Attenzione al timing", en: "Mind the timing", es: "Atención al momento en que lo haces" },
      body: {
        it: "Google Takeout può impiegare giorni a generare l'export per account grossi. Non avviare la cancellazione prima di avere il pacchetto in mano. Tieni anche conto che Google conserva backup per fino a 180 giorni dopo cancellazione (documentato in privacy policy).",
        en: "Google Takeout can take days to generate the export for large accounts. Don't initiate deletion before having the package in hand. Also note Google keeps backups for up to 180 days after deletion (documented in privacy policy).",
        es: "Google Takeout puede tardar días en generar la exportación para cuentas con muchos datos. No inicies la eliminación antes de tener el paquete en tu poder. Ten en cuenta también que Google conserva copias de seguridad hasta 180 días después de la eliminación (según su política de privacidad).",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "La nostra posizione sull'ecosistema Fitbit-Google", en: "Our take on the Fitbit-Google ecosystem", es: "Nuestra opinión sobre el ecosistema Fitbit-Google" },
      body: {
        it: "Se usi Fitbit principalmente per passi, BPM e sonno e non hai bisogno delle funzionalità premium Fitbit, ha senso considerare un'alternativa che ti dia più controllo sui dati. La dipendenza da un singolo ecosistema Google (dove la policy può cambiare e il servizio può essere dismesso) è un rischio reale per chi si affida a questi dati nel tempo. Esporta regolarmente via Takeout e considera di affiancare una dashboard alternativa che legga da Health Connect: ti dà una copia indipendente e accesso da browser senza passare per i server Google.",
        en: "If you use Fitbit primarily for steps, HR and sleep and don't need premium Fitbit features, it makes sense to consider an alternative that gives you more data control. Dependence on a single Google ecosystem (where policy can change and the service can be discontinued) is a real risk for those who rely on this data over time. Export regularly via Takeout and consider adding an alternative dashboard that reads from Health Connect: it gives you an independent copy and browser access without going through Google's servers.",
        es: "Si usas Fitbit principalmente para pasos, frecuencia cardíaca y sueño y no necesitas las funciones premium de Fitbit, tiene sentido considerar una alternativa que te dé más control sobre tus datos. Depender de un único ecosistema (donde la política puede cambiar y el servicio puede cerrarse) es un riesgo real para quien confía en estos datos a largo plazo. Exporta regularmente con Takeout y considera sumar un panel alternativo que lea desde Health Connect: te da una copia independiente y acceso desde el navegador sin pasar por los servidores de Google.",
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
        es: [
          "Tras la migración de 2023, los datos de Fitbit residen en Google: la exportación se hace a través de Google Takeout (takeout.google.com), ya no desde Fitbit.com.",
          "Google Takeout es el método más completo: incluye todo el historial en JSON/CSV, desde las actividades hasta el sueño y la frecuencia cardíaca por minuto.",
          "Health Connect es el método para el flujo continuo: desde la app de Fitbit a HC, cualquier app Android con permisos HC puede leer los datos en tiempo real.",
          "Límite de HC para Fitbit: las fases del sueño (REM/profundo/ligero) no se exponen de forma granular a través de HC. El GPS y el VO₂ máx requieren la Fitbit Web API.",
          "Antes de cerrar la cuenta: exporta con Takeout y luego solicita la eliminación GDPR. Nunca en el orden inverso.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Tieni il Fitbit ma vuoi una dashboard alternativa?",
        en: "Keeping Fitbit but want an alternative dashboard?",
        es: "¿Sigues con Fitbit pero quieres un panel alternativo?",
      },
      body: {
        it: "FitMesh Sync legge Fitbit via Health Connect oggi (passi, BPM, sonno, calorie, distanza) e prevede integrazione OAuth Web API per dati avanzati nel 2026.",
        en: "FitMesh Sync reads Fitbit via Health Connect today (steps, HR, sleep, calories, distance) and plans Web API OAuth integration for advanced data in 2026.",
        es: "FitMesh Sync lee Fitbit a través de Health Connect ahora mismo (pasos, frecuencia cardíaca, sueño, calorías, distancia) y tiene prevista la integración con la Web API OAuth para datos avanzados en 2026.",
      },
      ctaLabel: { it: "Vedi Fitbit su FitMesh →", en: "See Fitbit on FitMesh →", es: "Ver Fitbit en FitMesh →" },
      ctaHref: { it: "/it/sync/fitbit", en: "/en/sync/fitbit" },
    },
  ],
  faq: [
    {
      q: {
        it: "Se non ho migrato a Google Account, posso ancora accedere?",
        en: "If I haven't migrated to a Google Account, can I still log in?",
        es: "Si no he migrado a Google Account, ¿puedo seguir accediendo?",
      },
      a: {
        it: "Dal 2025 i Fitbit Account legacy non sono più supportati. Se hai un dispositivo Fitbit attivo dovresti aver ricevuto multiple richieste di migrazione. Se hai mancato la finestra, contatta il supporto Fitbit per ripristinare l'accesso: è ancora possibile ma può richiedere verifica identità.",
        en: "Since 2025 legacy Fitbit Accounts are no longer supported. If you have an active Fitbit device you should have received multiple migration requests. If you missed the window, contact Fitbit support to restore access: it's still possible but may require ID verification.",
        es: "Desde 2025, los Fitbit Accounts heredados ya no tienen soporte. Si tienes un dispositivo Fitbit activo, deberías haber recibido varias solicitudes de migración. Si no lo hiciste a tiempo, contacta con el soporte de Fitbit para recuperar el acceso: sigue siendo posible, pero puede requerir verificación de identidad.",
      },
    },
    {
      q: {
        it: "Google usa i miei dati Fitbit per pubblicità?",
        en: "Does Google use my Fitbit data for advertising?",
        es: "¿Google usa mis datos de Fitbit para publicidad?",
      },
      a: {
        it: "La privacy policy attuale di Fitbit (gestita da Google) dichiara che i dati salute non sono usati per Google Ads. Questa è anche una condizione imposta dalle authority europee al momento dell'approvazione dell'acquisizione (impegni vincolanti fino al 2031). Tecnicamente Google può cambiare la policy in futuro per nuovi dati raccolti, ma con preavviso e opt-out.",
        en: "Fitbit's current privacy policy (Google-managed) states health data isn't used for Google Ads. This is also a condition imposed by European authorities at acquisition approval (binding commitments until 2031). Technically Google can change the policy in the future for newly collected data, but with prior notice and opt-out.",
        es: "La política de privacidad actual de Fitbit (gestionada por Google) declara que los datos de salud no se usan para Google Ads. Esta es también una condición impuesta por las autoridades europeas en el momento de aprobar la adquisición (compromisos vinculantes hasta 2031). Técnicamente, Google podría cambiar la política en el futuro para datos nuevos, pero con aviso previo y posibilidad de rechazarlo.",
      },
    },
    {
      q: {
        it: "Posso trasferire i dati Fitbit a un Galaxy Watch?",
        en: "Can I transfer Fitbit data to a Galaxy Watch?",
        es: "¿Puedo transferir los datos de Fitbit a un Galaxy Watch?",
      },
      a: {
        it: "Direttamente no: non c'è importazione nativa in Samsung Health. Hai due strade. Una: esporta da Takeout, mantieni i file come archivio (non visualizzabili in Samsung Health). Due: via Health Connect, lo storico recente Fitbit (60–90 giorni tipici) compare in HC e Samsung Health può leggerli. Lo storico più vecchio richiede lavoro manuale.",
        en: "Directly no: there's no native import in Samsung Health. Two paths. One: export from Takeout, keep files as archive (not viewable in Samsung Health). Two: via Health Connect, recent Fitbit history (typical 60–90 days) appears in HC and Samsung Health can read it. Older history requires manual work.",
        es: "De forma directa no: Samsung Health no tiene importación nativa de datos de Fitbit. Hay dos opciones. Primera: exporta desde Takeout y guarda los archivos como archivo personal (no se pueden visualizar en Samsung Health). Segunda: a través de Health Connect, el historial reciente de Fitbit (normalmente 60-90 días) aparece en HC y Samsung Health puede leerlo. El historial más antiguo requiere trabajo manual.",
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
