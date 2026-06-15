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
      "La via più comoda è una dashboard web senza export manuale: serve un'app che legga da HealthKit e sincronizzi in background. FitMesh iOS è in beta TestFlight, uscita App Store imminente.",
    ],
    en: [
      "The most complete method is the native XML export (Health → profile → Export All Health Data): it contains every record, but the file can reach 2 GB and isn't readable directly.",
      "Reading the XML on a PC requires additional tools: open-source Python scripts or Apple Shortcuts for specific metrics.",
      "For sharing specific data with a doctor, use the per-metric export directly from the chart in Health: it produces a clean CSV.",
      "The XML file is unencrypted: treat it like a sensitive medical document and don't upload it to public cloud services.",
      "The most convenient path is a web dashboard without manual exports: it needs an app that reads from HealthKit and syncs in the background. FitMesh iOS is in beta on TestFlight, App Store launch imminent.",
    ],
    es: [
      "El método más completo es la exportación XML nativa (Salud → perfil → Exportar todos los datos): contiene cada registro, pero el archivo puede llegar a 2 GB y no se puede leer directamente.",
      "Para leer el XML en PC hacen falta herramientas adicionales: scripts Python de código abierto o Apple Shortcuts para métricas concretas.",
      "Para compartir datos específicos con un médico, usa la exportación por métrica individual directamente desde el gráfico en Salud: genera un CSV limpio.",
      "El archivo XML no está cifrado: trátalo como un documento médico sensible y no lo subas a servicios en la nube públicos.",
      "La opción más cómoda es un panel web sin exportaciones manuales: necesita una app que lea de HealthKit y sincronice en segundo plano. FitMesh iOS está en beta en TestFlight, con lanzamiento en App Store próximo.",
    ],
  },
  primaryKeyword: {
    it: "esportare dati apple health",
    en: "how to export apple health data",
    es: "exportar datos apple health",
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
    es: "Cómo exportar los datos de Apple Health a PC o web en 2026: exportación XML nativa, herramientas gratuitas para leerla y panel web para iPhone. Guía completa.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide", es: "Guía" },
    title: {
      it: "Come esportare i dati Apple Health su PC o web (2026)",
      en: "How to export Apple Health data to PC or web (2026)",
      es: "Cómo exportar los datos de Apple Health a PC o web (2026)",
    },
    subtitle: {
      it: "Apple Health raccoglie anni di dati salute sul tuo iPhone, ma per vederli su computer o condividerli con qualcuno ci vuole qualche passaggio in più. Ecco tutti i metodi, in ordine di facilità.",
      en: "Apple Health collects years of health data on your iPhone, but viewing them on a computer or sharing them with someone takes a few extra steps. Here are all the methods, easiest first.",
      es: "Apple Health acumula años de datos de salud en tu iPhone, pero para verlos en un ordenador o compartirlos con alguien necesitas seguir algunos pasos adicionales. Aquí tienes todos los métodos, del más sencillo al más técnico.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Apple Health raccoglie anni di dati salute sul tuo iPhone ma non ha una web dashboard: per vederli su computer o condividerli servono passaggi precisi. Ci sono tre metodi, ognuno con un diverso compromesso tra completezza e semplicità. Questa guida li copre tutti in ordine di facilità, dal più immediato al più tecnico.",
        en: "Apple Health collects years of health data on your iPhone but has no web dashboard: getting that data to a computer or sharing it requires specific steps. There are three methods, each with a different tradeoff between completeness and simplicity. This guide covers all of them, easiest first.",
        es: "Apple Health acumula años de datos de salud en tu iPhone, pero no cuenta con un panel web: llevar esos datos a un ordenador o compartirlos requiere pasos concretos. Existen tres métodos, cada uno con un equilibrio distinto entre completitud y sencillez. Esta guía los cubre todos, del más inmediato al más técnico.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 1: Export XML nativo (gratis, completo, ma tecnico)",
        en: "Method 1: Native XML export (free, complete, but technical)",
        es: "Método 1: Exportación XML nativa (gratis, completa, pero técnica)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Apple Health include un export nativo che produce un file ZIP con tutti i tuoi dati in formato XML. È il metodo più completo: include letteralmente ogni record, ma il file risultante è difficile da leggere senza strumenti aggiuntivi.",
        en: "Apple Health includes a native export that produces a ZIP file with all your data in XML format. It's the most complete method: includes literally every record, but the resulting file is hard to read without additional tools.",
        es: "Apple Health incluye una exportación nativa que genera un archivo ZIP con todos tus datos en formato XML. Es el método más completo: contiene literalmente cada registro, aunque el archivo resultante es difícil de leer sin herramientas adicionales.",
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
        es: [
          "Abre **Salud** en tu iPhone.",
          "Toca tu **foto de perfil** en la esquina superior derecha.",
          "Desplázate hasta el final → toca **Exportar todos los datos de salud**.",
          "Confirma → espera (puede tardar varios minutos si tienes años de datos).",
          "Elige cómo compartirlo: **AirDrop al Mac**, **Guardar en iCloud Drive**, **Enviártelo por correo**.",
          "En el PC/Mac, descomprime el archivo. Encontrarás `export.xml` (el grueso de los datos) y la carpeta `workout-routes/` con los datos GPS.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Il file XML può essere enorme",
        en: "The XML file can be huge",
        es: "El archivo XML puede ser muy grande",
      },
      body: {
        it: "Dopo 3-4 anni di Apple Watch, l'export XML può pesare 500MB-2GB decompresso. Non aprirlo con un editor di testo normale: va in crash. Usa gli strumenti gratuiti descritti sotto, o importalo in Python/R per analisi avanzate.",
        en: "After 3-4 years of Apple Watch, the XML export can be 500MB-2GB uncompressed. Don't open it with a regular text editor: it'll crash. Use the free tools described below, or import it in Python/R for advanced analysis.",
        es: "Tras 3-4 años con Apple Watch, la exportación XML puede ocupar entre 500 MB y 2 GB descomprimida. No la abras con un editor de texto normal: se bloqueará. Usa las herramientas gratuitas que se describen a continuación, o impórtala en Python/R para análisis avanzados.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come leggere il file XML su PC (strumenti gratuiti)",
        en: "How to read the XML file on PC (free tools)",
        es: "Cómo leer el archivo XML en el PC (herramientas gratuitas)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Una volta che hai il file XML sul computer, ci sono alcune strade gratuite per visualizzarlo in modo leggibile:",
        en: "Once you have the XML file on your computer, there are a few free ways to display it in a readable format:",
        es: "Una vez que tienes el archivo XML en el ordenador, hay varias opciones gratuitas para visualizarlo de forma legible:",
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
        es: [
          "**Script Python**: si tienes Python instalado, bibliotecas como `pandas` y `lxml` te permiten leer el XML, filtrar por tipo de métrica y exportar a CSV. En GitHub encontrarás decenas de scripts de código abierto listos para usar.",
          "**Numbers/Excel**: el XML de Apple Health no se puede importar directamente en Excel, pero sí el CSV generado tras la conversión con Python.",
          "**Apple Shortcuts**: en iPhone y Mac, la app Atajos puede leer directamente de Apple Health sin necesidad de exportar. Útil para automatizar informes semanales o mensuales.",
          "**Tableau Public / Google Looker Studio**: tras convertir a CSV, puedes visualizar los datos con estas herramientas gratuitas de visualización.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 2: Condivisione con il medico (PDF o grafici nativi)",
        en: "Method 2: Sharing with your doctor (native PDF or charts)",
        es: "Método 2: Compartir con tu médico (PDF o gráficos nativos)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per condividere dati specifici con un medico, Apple Health ha una funzione integrata più semplice dell'export XML completo:",
        en: "For sharing specific data with a doctor, Apple Health has a built-in feature simpler than the full XML export:",
        es: "Para compartir datos específicos con un médico, Apple Health dispone de una función integrada más sencilla que la exportación XML completa:",
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
        es: [
          "En **Salud** → abre la categoría que te interesa (p. ej., Frecuencia cardíaca, Sueño).",
          "Toca el gráfico → **Exportar registros de salud** (abajo) → CSV para esa métrica individual.",
          "O bien: en **Resumen** → desplázate hasta **Compartir salud** → configura quién puede ver tus datos (otros usuarios de iPhone o médicos en plataformas concretas).",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 3: Dashboard web: la via più comoda (iOS in arrivo)",
        en: "Method 3: Web dashboard, the most convenient way (iOS coming)",
        es: "Método 3: Panel web, la opción más cómoda (iOS próximamente)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'opzione più comoda (avere i dati Apple Health su una dashboard web accessibile da qualsiasi browser senza dover fare export manuali ogni volta) richiede un'app che legga Apple Health e la sincronizzi nel cloud.",
        en: "The most convenient option (having Apple Health data on a web dashboard accessible from any browser, without manual exports every time) requires an app that reads Apple Health and syncs it to the cloud.",
        es: "La opción más cómoda (tener los datos de Apple Health en un panel web accesible desde cualquier navegador, sin exportaciones manuales cada vez) requiere una app que lea Apple Health y sincronice los datos en la nube.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync è in arrivo su iPhone: la beta TestFlight è attiva e l'uscita App Store è imminente. L'app iPhone legge i dati da Apple Health (HealthKit), li sincronizza automaticamente e li mostra sulla stessa dashboard web che già usiamo per Android. Feature extra: il ponte di scrittura (opt-in) porta i dati dei wearable Android direttamente in Apple Salute, utile se hai sia un dispositivo Android che un iPhone.",
        en: "FitMesh Sync is arriving on iPhone: the TestFlight beta is active and the App Store launch is imminent. The iPhone app reads data from Apple Health (HealthKit), syncs it automatically, and displays it on the same web dashboard already used for Android. Extra feature: the write bridge (opt-in) brings Android wearable data directly into Apple Health, useful if you have both an Android device and an iPhone.",
        es: "FitMesh Sync está próximo en iPhone: la beta de TestFlight ya está activa y el lanzamiento en App Store es inminente. La app para iPhone lee los datos de Apple Health (HealthKit), los sincroniza automáticamente y los muestra en el mismo panel web que ya usamos para Android. Función extra: el puente de escritura (opt-in) lleva los datos de los wearables Android directamente a Apple Salud, muy útil si tienes tanto un dispositivo Android como un iPhone.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Se hai sia iPhone che Android",
        en: "If you have both iPhone and Android",
        es: "Si tienes iPhone y Android",
      },
      body: {
        it: "Molti utenti usano un iPhone ma hanno un wearable Android (es. Galaxy Watch o un anello smart). Con FitMesh Sync Android puoi già sincronizzare quei dati su web. La versione iOS (beta ora, App Store imminente) aggiunge anche il ponte di scrittura opt-in: i dati del wearable Android vengono scritti direttamente in Apple Salute, così li vedi nell'app Salute di iPhone senza alcun export manuale.",
        en: "Many users have an iPhone but an Android wearable (e.g. Galaxy Watch or a smart ring). With FitMesh Sync Android you can already sync that data to the web. The iOS version (in beta now, App Store coming soon) also adds the opt-in write bridge: Android wearable data gets written directly into Apple Health, so you see it in the iPhone Health app without any manual export.",
        es: "Muchos usuarios tienen iPhone pero llevan un wearable Android (p. ej., Galaxy Watch o un anillo inteligente). Con FitMesh Sync para Android ya puedes sincronizar esos datos en la web. La versión iOS (en beta ahora, App Store próximamente) añade además el puente de escritura opt-in: los datos del wearable Android se escriben directamente en Apple Salud, de modo que los ves en la app Salud del iPhone sin ninguna exportación manual.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "Perché dovresti esportare i dati adesso, non quando smetti di usare Apple Watch", en: "Why you should export your data now, not when you stop using Apple Watch", es: "Por qué deberías exportar tus datos ahora y no cuando dejes de usar Apple Watch" },
      body: {
        it: "L'errore più comune che vediamo: le persone esportano Apple Health solo quando cambiano telefono o ecosistema, e spesso scoprono che mesi di dati sono andati persi (backup iCloud non configurato, device reset). Esporta i dati ogni 6 mesi come routine: il file ZIP di Apple Health è il tuo backup assicurativo contro qualsiasi cambio futuro di dispositivo, piattaforma, o policy Apple.",
        en: "The most common mistake we see: people export Apple Health data only when switching phones or ecosystems, and often discover months of data are gone (iCloud backup not configured, device reset). Export your data every 6 months as a routine: the Apple Health ZIP file is your insurance backup against any future device change, platform switch, or Apple policy change.",
        es: "El error más habitual que vemos: las personas exportan sus datos de Apple Health solo cuando cambian de teléfono o de ecosistema, y a menudo descubren que han perdido meses de registros (copia de iCloud no configurada, dispositivo restablecido). Exporta los datos cada 6 meses como rutina: el archivo ZIP de Apple Health es tu copia de seguridad ante cualquier cambio futuro de dispositivo, plataforma o política de Apple.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa contiene un export Apple Health completo",
        en: "What a complete Apple Health export contains",
        es: "Qué contiene una exportación completa de Apple Health",
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
        es: [
          "**Pasos y distancia**: cada muestra con marca de tiempo precisa",
          "**Frecuencia cardíaca**: todas las muestras (cada pocos minutos si tienes Apple Watch)",
          "**Frecuencia cardíaca en reposo y variabilidad (HRV)**: calculadas cada mañana",
          "**Sueño**: fases (Core, Deep, REM, Awake) con marcas de tiempo",
          "**Entrenamientos**: tipo, duración, calorías, frecuencia cardíaca media, GPS",
          "**SpO2**: cada muestra disponible",
          "**ECG**: archivo PDF y valores sin procesar si tienes Apple Watch Series 4 o posterior",
          "**Mindfulness**: sesiones de respiración consciente",
          "**Peso y composición corporal**: si se han introducido manualmente o desde una báscula inteligente",
          "**Presión arterial y glucosa**: si se han introducido manualmente",
          "**Datos ambientales**: niveles de ruido, caídas detectadas",
        ],
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
        es: [
          "El método más completo es la exportación XML nativa (Salud → perfil → Exportar todos los datos de salud): contiene cada registro con marca de tiempo, pero el archivo puede pesar 2 GB y no se puede leer directamente.",
          "Para leer el XML en el PC hacen falta herramientas adicionales: scripts Python de código abierto en GitHub, o Apple Shortcuts para métricas concretas.",
          "Para compartir datos específicos con un médico, usa la exportación por métrica individual directamente desde el gráfico en Salud: genera un CSV limpio.",
          "El archivo XML no está cifrado: trátalo como un documento médico sensible y no lo subas a servicios en la nube públicos.",
          "La opción más cómoda (panel web sin exportaciones manuales) requiere una app que lea de HealthKit y sincronice en segundo plano: FitMesh iOS está en beta en TestFlight, con lanzamiento en App Store próximo.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Dashboard web per iPhone: unisciti alla lista d'attesa iOS",
        en: "Web dashboard for iPhone: join the iOS waitlist",
        es: "Panel web para iPhone: únete a la lista de espera de iOS",
      },
      body: {
        it: "FitMesh Sync è in beta TestFlight su iPhone, uscita App Store imminente. L'app legge i dati da Apple Health e li sincronizza automaticamente su web, senza export manuali. Entra in beta gratis e sarai tra i primi a provarla. Bonus: il ponte di scrittura (opt-in) porta anche i dati dei wearable Android dentro Apple Salute.",
        en: "FitMesh Sync is in TestFlight beta on iPhone, App Store launch imminent. The app reads data from Apple Health and syncs it automatically to the web, no manual exports needed. Join the free beta and be among the first to try it. Bonus: the write bridge (opt-in) also brings Android wearable data into Apple Health.",
        es: "FitMesh Sync está en beta de TestFlight en iPhone, con lanzamiento en App Store inminente. La app lee los datos de Apple Health y los sincroniza automáticamente en la web, sin exportaciones manuales. Únete a la beta gratis y sé de los primeros en probarla. Bonus: el puente de escritura (opt-in) también lleva los datos de los wearables Android a Apple Salud.",
      },
      ctaLabel: {
        it: "Entra in beta iOS →",
        en: "Join iOS beta →",
        es: "Únete a la beta de iOS →",
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
        es: "¿La exportación de Apple Health es segura para la privacidad?",
      },
      a: {
        it: "Il file XML non è criptato: chiunque lo riceva può leggere tutti i tuoi dati salute. Trattalo come un documento medico sensibile. Non caricarlo su servizi cloud pubblici, non mandarlo via email non criptata. Se usi AirDrop o cavi USB su Mac, la trasmissione è crittografata.",
        en: "The XML file is unencrypted: anyone who receives it can read all your health data. Treat it like a sensitive medical document. Don't upload it to public cloud services, don't send it via unencrypted email. AirDrop or USB cable to Mac are encrypted transfers.",
        es: "El archivo XML no está cifrado: cualquier persona que lo reciba puede leer todos tus datos de salud. Trátalo como un documento médico sensible. No lo subas a servicios en la nube públicos ni lo envíes por correo sin cifrar. Transferirlo por AirDrop o cable USB al Mac sí es una transmisión cifrada.",
      },
    },
    {
      q: {
        it: "Posso importare i dati Apple Health in Google Fit o Health Connect?",
        en: "Can I import Apple Health data into Google Fit or Health Connect?",
        es: "¿Puedo importar los datos de Apple Health en Health Connect?",
      },
      a: {
        it: "Direttamente no: Apple Health e Health Connect/Google Fit sono sistemi separati e non hanno import nativo dall'uno all'altro. Esistono script Python open-source che leggono l'export XML Apple Health e lo scrivono su Health Connect via API, ma richiedono setup tecnico. Per gli allenamenti specifici (es. da Garmin), Garmin Connect sincronizza sia con Apple Health che con Health Connect: è la via più pulita per chi ha device multi-piattaforma.",
        en: "Not directly: Apple Health and Health Connect/Google Fit are separate systems with no native import from one to the other. Open-source Python scripts exist that read the Apple Health XML export and write it to Health Connect via API, but they require technical setup. For specific workouts (e.g. from Garmin), Garmin Connect syncs with both Apple Health and Health Connect, the cleanest path for multi-platform device users.",
        es: "De forma directa, no: Apple Health y Health Connect son sistemas separados y ninguno ofrece importación nativa desde el otro. Existen scripts Python de código abierto que leen la exportación XML de Apple Health y escriben los datos en Health Connect, pero requieren configuración técnica. Para entrenamientos concretos (p. ej., de Garmin), Garmin Connect sincroniza tanto con Apple Health como con Health Connect, que es la vía más limpia para quienes tienen dispositivos de varias plataformas.",
      },
    },
    {
      q: {
        it: "Quanto spazio occupa un export Apple Health?",
        en: "How much space does an Apple Health export take?",
        es: "¿Cuánto espacio ocupa una exportación de Apple Health?",
      },
      a: {
        it: "Dipende dagli anni di dati e da quanti wearable hai usato. Un utente con 2 anni di Apple Watch può aspettarsi 100-400MB compressi (ZIP), che diventano 500MB-2GB decompressi. Chi usa Apple Watch + misurazioni cardiache frequenti può arrivare a 3-5GB decompressi.",
        en: "Depends on years of data and how many wearables you've used. A 2-year Apple Watch user can expect 100-400MB compressed (ZIP), becoming 500MB-2GB uncompressed. Those using Apple Watch + frequent cardiac measurements can reach 3-5GB uncompressed.",
        es: "Depende de los años de datos y de cuántos wearables hayas usado. Un usuario con 2 años de Apple Watch puede esperar entre 100 y 400 MB comprimidos (ZIP), que se convierten en 500 MB a 2 GB descomprimidos. Quienes usan Apple Watch con mediciones cardíacas frecuentes pueden llegar a 3-5 GB descomprimidos.",
      },
    },
    {
      q: {
        it: "Posso automatizzare l'export mensile?",
        en: "Can I automate monthly exports?",
        es: "¿Puedo automatizar las exportaciones mensuales?",
      },
      a: {
        it: "Tramite l'export XML nativo no: va fatto manualmente ogni volta. Tramite Apple Shortcuts puoi automatizzare l'estrazione di metriche specifiche (es. 'esporta i passi di questa settimana in CSV') e inviarle a te stesso via email o salvarle su iCloud. Per un backup automatico completo, la strada è un'app che si connette a HealthKit e sincronizza in background (che è esattamente quello che FitMesh iOS farà).",
        en: "Via native XML export, no: it must be done manually each time. Via Apple Shortcuts you can automate extraction of specific metrics (e.g. 'export this week's steps to CSV') and send them to yourself via email or save to iCloud. For a full automatic backup, the path is an app that connects to HealthKit and syncs in the background, which is exactly what FitMesh iOS will do.",
        es: "Con la exportación XML nativa, no: hay que hacerla manualmente cada vez. Con Apple Shortcuts puedes automatizar la extracción de métricas concretas (p. ej., 'exportar los pasos de esta semana en CSV') y enviártelas por correo o guardarlas en iCloud. Para una copia de seguridad automática completa, la solución es una app que se conecte a HealthKit y sincronice en segundo plano, que es exactamente lo que hará FitMesh iOS.",
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
