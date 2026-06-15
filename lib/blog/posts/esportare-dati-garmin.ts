import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "esportare-dati-garmin",
  category: "guides",
  publishedAt: "2026-05-23",
  updatedAt: "2026-05-23",
  readMinutes: 9,
  tldr: {
    it: [
      "L'export di singole attività richiede il sito web connect.garmin.com: l'app mobile Garmin Connect non esporta file in nessun formato.",
      "Per il backup completo scegli il formato FIT originale: contiene tutti i dati proprietari Garmin che GPX e TCX non preservano.",
      "L'export massivo (Impostazioni Account → Esporta i tuoi dati) scarica tutta la storia in un archivio ZIP, tipicamente entro 24-48 ore.",
      "Garmin non scrive dati di allenamento completi su Health Connect: per le attività GPS serve l'integrazione diretta con la Garmin Connect API.",
      "Prima di cancellare l'account Garmin, esegui sempre un export massivo: i dati vengono eliminati definitivamente alla chiusura.",
    ],
    en: [
      "Single activity export requires the connect.garmin.com website: the Garmin Connect mobile app exports no files in any format.",
      "For a complete backup choose the original FIT format: it contains all Garmin proprietary data that GPX and TCX do not preserve.",
      "Bulk export (Account Settings → Export Your Data) downloads the full history in a ZIP archive, typically within 24-48 hours.",
      "Garmin does not write complete workout data to Health Connect: for GPS activities you need direct Garmin Connect API integration.",
      "Before deleting your Garmin account, always run a bulk export first: data is permanently deleted upon account closure.",
    ],
    es: [
      "Exportar actividades individuales requiere el sitio web connect.garmin.com: la app móvil de Garmin Connect no exporta archivos en ningún formato.",
      "Para un respaldo completo, elige el formato FIT original: contiene todos los datos propietarios de Garmin que GPX y TCX no conservan.",
      "La exportación masiva (Ajustes de cuenta → Exportar tus datos) descarga todo el historial en un archivo ZIP, normalmente en 24-48 horas.",
      "Garmin no escribe datos completos de entrenamientos en Health Connect: para actividades GPS necesitas la integración directa con la API de Garmin Connect.",
      "Antes de eliminar tu cuenta de Garmin, realiza siempre una exportación masiva: los datos se borran de forma definitiva al cerrar la cuenta.",
    ],
  },
  primaryKeyword: {
    it: "esportare dati garmin",
    en: "export garmin data",
    es: "exportar datos garmin",
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
    it: "Come esportare dati Garmin: guida pratica per scaricare allenamenti in GPX, TCX, FIT e CSV da Garmin Connect (sito web, app mobile e API). Pro e contro di ogni metodo.",
    en: "How to export Garmin data: practical guide to downloading activities in GPX, TCX, FIT and CSV from Garmin Connect (website, mobile app and API). Pros and cons of each method.",
    es: "Cómo exportar datos de Garmin: guía práctica para descargar entrenamientos en GPX, TCX, FIT y CSV desde Garmin Connect (web, app móvil y API). Ventajas y limitaciones de cada método.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide", es: "Guía" },
    title: {
      it: "Esportare dati Garmin: GPX, TCX, FIT, CSV",
      en: "Exporting Garmin data: GPX, TCX, FIT and CSV, a complete guide",
      es: "Exportar datos de Garmin: GPX, TCX, FIT y CSV, guía completa",
    },
    subtitle: {
      it: "Garmin tiene i tuoi allenamenti nel proprio cloud, ma i dati sono tuoi. Ecco tutti i modi per tirarli fuori, con gli onesti limiti di ciascuno.",
      en: "Garmin keeps your workouts in its own cloud, but the data is yours. Here are all the ways to get it out, with the honest limitations of each.",
      es: "Garmin guarda tus entrenamientos en su propio servicio en la nube, pero los datos son tuyos. Aquí tienes todas las formas de obtenerlos, con las limitaciones reales de cada una.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Garmin tiene i tuoi allenamenti nel proprio cloud, ma i dati sono tuoi e puoi portarli fuori in tre modi: export singola attività, export massivo dell'intera storia, o integrazione API continua verso Strava e altri. Il processo non è sempre immediato come si spera, e ci sono differenze importanti tra l'app mobile (che non esporta nulla) e il sito web, e tra i vari formati disponibili.",
        en: "Garmin keeps your workouts in its own cloud, but the data is yours and you can take it out three ways: single activity export, bulk export of the full history, or continuous API integration to Strava and others. The process isn't always as immediate as you'd hope, and there are important differences between the mobile app (which exports nothing) and the website, and between the various available formats.",
        es: "Garmin guarda tus entrenamientos en su propio servicio en la nube, pero los datos son tuyos y puedes exportarlos de tres maneras: exportación de una actividad individual, exportación masiva de todo el historial, o integración continua por API hacia Strava y otras plataformas. El proceso no siempre es tan inmediato como cabría esperar, y hay diferencias importantes entre la app móvil (que no exporta nada) y el sitio web, así como entre los distintos formatos disponibles.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 1: export singola attività dal sito web",
        en: "Method 1: single activity export from the website",
        es: "Método 1: exportar una actividad individual desde el sitio web",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo è il metodo più diretto per estrarre un'attività specifica. Funziona solo dal sito web, non dall'app mobile. L'app Garmin Connect per Android e iOS non ha la funzione di export individuale.",
        en: "This is the most direct method for extracting a specific activity. It works only from the website, not the mobile app. The Garmin Connect Android and iOS app doesn't have individual export functionality.",
        es: "Este es el método más directo para extraer una actividad específica. Solo funciona desde el sitio web, no desde la app móvil. La app de Garmin Connect para Android e iOS no cuenta con la función de exportación individual.",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "App mobile vs sito web", en: "Mobile app vs website", es: "App móvil frente al sitio web" },
      body: {
        it: "Esportare GPX o TCX da Garmin richiede il sito web (connect.garmin.com), non l'app mobile. L'app mobile di Garmin Connect non offre export dei dati in nessun formato. Questo è un limite tecnico intenzionale, non un bug.",
        en: "Exporting GPX or TCX from Garmin requires the website (connect.garmin.com), not the mobile app. The Garmin Connect mobile app doesn't offer data export in any format. This is an intentional technical limitation, not a bug.",
        es: "Exportar GPX o TCX desde Garmin requiere usar el sitio web (connect.garmin.com), no la app móvil. La app móvil de Garmin Connect no ofrece exportación de datos en ningún formato. Esta es una limitación técnica intencional, no un error.",
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
        es: [
          "Ve a connect.garmin.com e inicia sesión con tus credenciales.",
          "Haz clic en 'Actividades' en el menú lateral izquierdo.",
          "Haz clic en la actividad que quieres exportar para abrirla.",
          "En la parte superior derecha, haz clic en el icono de engranaje (⚙) o en los tres puntos verticales.",
          "Selecciona 'Exportar original' para el archivo FIT original, o 'Exportar como TCX' o 'Exportar como GPX'.",
          "El archivo se descarga en tu ordenador.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Formati di export: GPX, TCX, FIT, CSV: quale scegliere",
        en: "Export formats: GPX, TCX, FIT, CSV: which to choose",
        es: "Formatos de exportación: GPX, TCX, FIT, CSV: cuál elegir",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La scelta del formato dipende dall'uso finale. Ognuno porta informazioni diverse e ha compatibilità diverse.",
        en: "Format choice depends on the final use. Each carries different information and has different compatibility.",
        es: "La elección del formato depende del uso final. Cada uno contiene información diferente y tiene distintos niveles de compatibilidad.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Confronto formati export Garmin",
        en: "Garmin export format comparison",
        es: "Comparación de formatos de exportación de Garmin",
      },
      headers: {
        it: ["Formato", "Contiene", "Meglio per", "Limite"],
        en: ["Format", "Contains", "Best for", "Limitation"],
        es: ["Formato", "Contiene", "Mejor para", "Limitación"],
      },
      rows: [
        {
          it: ["FIT (originale)", "Tutto: GPS, HR, cadenza, potenza, dati proprietary Garmin", "Backup completo, re-import in Garmin", "Formato binario, leggibile solo con tool specifici"],
          en: ["FIT (original)", "Everything: GPS, HR, cadence, power, Garmin proprietary data", "Full backup, re-import into Garmin", "Binary format, readable only with specific tools"],
          es: ["FIT (original)", "Todo: GPS, frecuencia cardíaca, cadencia, potencia, datos propietarios de Garmin", "Respaldo completo, reimportación en Garmin", "Formato binario, legible solo con herramientas específicas"],
        },
        {
          it: ["GPX", "Traccia GPS, timestamp, HR base", "Mappe, Strava, Komoot, analisi percorso", "Niente potenza, niente cadenza running"],
          en: ["GPX", "GPS track, timestamp, basic HR", "Maps, Strava, Komoot, route analysis", "No power, no running cadence"],
          es: ["GPX", "Ruta GPS, marca de tiempo, frecuencia cardíaca básica", "Mapas, Strava, Komoot, análisis de recorrido", "Sin potencia, sin cadencia de carrera"],
        },
        {
          it: ["TCX", "GPS, HR, calorie, lap, distanza", "Strava (import), Training Peaks", "Meno supportato dei formati moderni"],
          en: ["TCX", "GPS, HR, calories, laps, distance", "Strava (import), Training Peaks", "Less supported than modern formats"],
          es: ["TCX", "GPS, frecuencia cardíaca, calorías, vueltas, distancia", "Strava (importación), Training Peaks", "Menos compatible que los formatos modernos"],
        },
        {
          it: ["CSV", "Tabelle di riepilogo, no GPS", "Excel, fogli di calcolo, analisi statistiche", "Nessun dato GPS o workout details"],
          en: ["CSV", "Summary tables, no GPS", "Excel, spreadsheets, statistical analysis", "No GPS data or workout details"],
          es: ["CSV", "Tablas de resumen, sin GPS", "Excel, hojas de cálculo, análisis estadístico", "Sin datos GPS ni detalles del entrenamiento"],
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        it: "Per importare un allenamento su Strava, TCX o GPX vanno bene entrambi: Strava li supporta. Per un backup completo che ti permetta di reimportare in futuro o analizzare con tool come GoldenCheetah o Intervals.icu, il FIT originale è la scelta migliore anche se meno leggibile direttamente.",
        en: "For importing a workout into Strava, both TCX and GPX work fine: Strava supports them. For a complete backup that lets you re-import later or analyze with tools like GoldenCheetah or Intervals.icu, the original FIT file is the best choice even if less directly readable.",
        es: "Para importar un entrenamiento en Strava, tanto TCX como GPX funcionan bien: Strava los admite. Para un respaldo completo que te permita reimportar más adelante o analizar con herramientas como GoldenCheetah o Intervals.icu, el archivo FIT original es la mejor opción, aunque sea menos legible de forma directa.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 2: export massivo con Garmin Data Management",
        en: "Method 2: bulk export with Garmin Data Management",
        es: "Método 2: exportación masiva con Garmin Data Management",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per scaricare l'intera storia degli allenamenti in un colpo solo, Garmin ha una funzione di export massivo. Questo è l'equivalente Garmin di un \"Google Takeout\": ti dà tutto, non solo le attività.",
        en: "To download the entire workout history at once, Garmin has a bulk export function. This is Garmin's equivalent of a 'Google Takeout': it gives you everything, not just activities.",
        es: "Para descargar todo el historial de entrenamientos de una sola vez, Garmin ofrece una función de exportación masiva. Es el equivalente de Garmin al 'Google Takeout': te da todo, no solo las actividades.",
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
        es: [
          "Inicia sesión en connect.garmin.com.",
          "Haz clic en tu nombre de usuario en la parte superior derecha → 'Ajustes de cuenta'.",
          "En la sección 'Gestión de cuenta', busca 'Exportar tus datos'.",
          "Haz clic en 'Solicitar datos'. Garmin prepara un archivo ZIP con todo.",
          "Recibirás un correo con el enlace de descarga en 24-48 horas (puede tardar más en cuentas con mucho historial).",
          "El archivo incluye todos los FIT originales, datos de salud (frecuencia cardíaca, sueño, pasos), rutas y ajustes del dispositivo.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Dimensioni dell'archivio", en: "Archive size", es: "Tamaño del archivo" },
      body: {
        it: "Per chi usa Garmin da anni con attività frequenti, l'archivio può pesare diversi GB. Prepara spazio di storage adeguato prima di richiederlo. Il file più grande tende a essere la cartella dei dati HR granulari (campioni ogni 15 secondi per anni).",
        en: "For people who have been using Garmin for years with frequent activities, the archive can weigh several GB. Prepare adequate storage space before requesting it. The largest file tends to be the folder with granular HR data (samples every 15 seconds for years).",
        es: "Para quienes llevan años usando Garmin con actividades frecuentes, el archivo puede ocupar varios GB. Prepara espacio de almacenamiento suficiente antes de solicitarlo. El archivo más grande suele ser la carpeta de datos de frecuencia cardíaca detallados (muestras cada 15 segundos durante años).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Metodo 3: API Garmin Connect (per integrazioni continue)",
        en: "Method 3: Garmin Connect API (for continuous integrations)",
        es: "Método 3: API de Garmin Connect (para integraciones continuas)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se hai bisogno di un flusso continuo di dati (non un export una tantum, ma ogni allenamento che finisce su Garmin Connect viene automaticamente inviato da qualche parte), la strada è la Garmin Health API o la Connect API. Attenzione però: non è una strada self-service.",
        en: "If you need a continuous data flow (not a one-time export, but every workout that lands on Garmin Connect automatically sent somewhere), the path is the Garmin Health API or Connect API. But beware: this is not a self-service path.",
        es: "Si necesitas un flujo continuo de datos (no una exportación puntual, sino que cada entrenamiento que llega a Garmin Connect se envíe automáticamente a otro servicio), el camino es la Garmin Health API o la Connect API. Eso sí: no es una opción de autoservicio.",
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
        es: [
          "**API de Garmin Connect**: requiere una aplicación OAuth aprobada por Garmin. No puedes acceder a tus datos personales por API directamente sin ser un desarrollador aprobado con una app registrada. El proceso de aprobación lleva tiempo y tiene criterios de evaluación.",
          "**Apps ya integradas**: Strava, Training Peaks, Final Surge y otras plataformas ya cuentan con integración oficial. Puedes autorizar estas apps desde Garmin Connect → Apps y dispositivos conectados → Gestionar apps.",
          "**FitMesh Sync**: entre los servicios que admiten la integración oficial con la API de Garmin Connect, permitiendo centralizar los datos sin necesidad de exportarlos manualmente cada vez.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Importare i dati Garmin su Strava: step pratici",
        en: "Importing Garmin data into Strava: practical steps",
        es: "Importar datos de Garmin en Strava: pasos prácticos",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'import manuale su Strava è uno dei casi d'uso più comuni per l'export Garmin. Ci sono due strade: integrazione diretta (consigliata) o import file (per attività singole o batch).",
        en: "Manual import into Strava is one of the most common use cases for Garmin export. There are two paths: direct integration (recommended) or file import (for single activities or batches).",
        es: "La importación manual en Strava es uno de los casos de uso más habituales al exportar datos de Garmin. Hay dos vías: integración directa (recomendada) o importación de archivo (para actividades individuales o en lote).",
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
        es: [
          "**Integración directa**: desde Garmin Connect → Apps conectadas → busca Strava → autoriza. A partir de ese momento cada actividad se sincroniza automáticamente. No requiere exportación manual.",
          "**Importación de archivo individual**: ve a strava.com → menú '+' en la parte superior → 'Subir actividad'. Admite GPX, FIT y TCX. Ten en cuenta que Strava tiene un límite de 25 importaciones por semana para cuentas gratuitas y algunas restricciones sobre los datos de potencia.",
          "**Importación histórica en lote**: Strava permite importar el archivo completo de FITs si lo solicitas a través de su soporte (función limitada, requiere contacto directo).",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Garmin e Health Connect: la situazione attuale",
        en: "Garmin and Health Connect: the current situation",
        es: "Garmin y Health Connect: la situación actual",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Una domanda frequente: Garmin scrive su Health Connect? La risposta attuale (maggio 2026) è: parzialmente. Garmin Connect per Android ha iniziato a supportare la scrittura su Health Connect per alcune metriche di base (passi giornalieri, frequenza cardiaca a riposo, dati di sonno aggregati), ma non per le attività complete con GPS. Per i dati di allenamento completi, la via è ancora l'API OAuth di Garmin, non Health Connect.",
        en: "A frequent question: does Garmin write to Health Connect? The current answer (May 2026) is: partially. Garmin Connect for Android has started supporting Health Connect writing for some basic metrics (daily steps, resting heart rate, aggregated sleep data), but not for complete activities with GPS. For full workout data, the path is still Garmin's OAuth API, not Health Connect.",
        es: "Una pregunta frecuente: ¿Garmin escribe datos en Health Connect? La respuesta actual (mayo de 2026) es: parcialmente. Garmin Connect para Android ha comenzado a admitir la escritura en Health Connect para algunas métricas básicas (pasos diarios, frecuencia cardíaca en reposo, datos de sueño agregados), pero no para actividades completas con GPS. Para los datos de entrenamiento completos, la vía sigue siendo la API OAuth de Garmin, no Health Connect.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo significa che app che usano solo Health Connect per leggere dati Garmin vedranno passi e BPM, ma non i dettagli delle uscite in bici o delle corse GPS. Per quelli serve un'integrazione diretta con Garmin Connect API.",
        en: "This means apps that use only Health Connect to read Garmin data will see steps and BPM, but not the details of cycling sessions or GPS runs. For those, direct Garmin Connect API integration is needed.",
        es: "Esto significa que las apps que solo usan Health Connect para leer datos de Garmin verán pasos y frecuencia cardíaca, pero no los detalles de las salidas en bicicleta o las carreras con GPS. Para eso se necesita una integración directa con la API de Garmin Connect.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "La nostra posizione netta sui formati di export", en: "Our clear stance on export formats", es: "Nuestra posición clara sobre los formatos de exportación" },
      body: {
        it: "Usa sempre FIT come formato di backup primario, non GPX. Il FIT contiene dati che GPX non può rappresentare (Training Load, Body Battery, potenza running, dati proprietari Garmin) e permette re-import completo in Garmin Connect o in tool come GoldenCheetah e Intervals.icu. Il GPX è comodo per la condivisione e l'import su Strava, ma come archivio è una copia degradata. Il costo in storage è trascurabile: non c'è ragione per accontentarsi del formato meno completo.",
        en: "Always use FIT as your primary backup format, not GPX. FIT contains data that GPX cannot represent (Training Load, Body Battery, running power, Garmin proprietary data) and allows full re-import into Garmin Connect or tools like GoldenCheetah and Intervals.icu. GPX is convenient for sharing and Strava import, but as an archive it's a degraded copy. The storage cost is negligible: there is no reason to settle for the less complete format.",
        es: "Usa siempre FIT como formato de respaldo principal, no GPX. El FIT contiene datos que GPX no puede representar (Training Load, Body Battery, potencia de carrera, datos propietarios de Garmin) y permite la reimportación completa en Garmin Connect o en herramientas como GoldenCheetah e Intervals.icu. El GPX es cómodo para compartir y para importar en Strava, pero como archivo de respaldo es una copia degradada. El espacio de almacenamiento adicional es mínimo: no hay razón para conformarse con el formato menos completo.",
      },
    },
    { type: "heading", level: 2, text: { it: "In sintesi", en: "In summary", es: "En resumen" } },
    {
      type: "list",
      items: {
        it: [
          "L'export di singole attività richiede il sito web connect.garmin.com: l'app mobile Garmin Connect non esporta file in nessun formato.",
          "Per backup completo scegli il formato FIT originale: contiene tutti i dati proprietari Garmin che GPX e TCX non preservano.",
          "L'export massivo (Impostazioni Account → Esporta i tuoi dati) scarica tutta la storia in un archivio ZIP, tipicamente entro 24-48 ore.",
          "Garmin non scrive dati di allenamento completi su Health Connect: per attività GPS serve l'integrazione diretta con la Garmin Connect API.",
          "Prima di cancellare l'account Garmin, esegui sempre un export massivo: i dati vengono eliminati definitivamente alla chiusura.",
        ],
        en: [
          "Single activity export requires the connect.garmin.com website: the Garmin Connect mobile app exports no files in any format.",
          "For complete backup choose the original FIT format: it contains all Garmin proprietary data that GPX and TCX do not preserve.",
          "Bulk export (Account Settings → Export Your Data) downloads the full history in a ZIP archive, typically within 24-48 hours.",
          "Garmin does not write complete workout data to Health Connect: for GPS activities you need direct Garmin Connect API integration.",
          "Before deleting your Garmin account, always run a bulk export first: data is permanently deleted upon account closure.",
        ],
        es: [
          "Exportar actividades individuales requiere el sitio web connect.garmin.com: la app móvil de Garmin Connect no exporta archivos en ningún formato.",
          "Para un respaldo completo, elige el formato FIT original: contiene todos los datos propietarios de Garmin que GPX y TCX no conservan.",
          "La exportación masiva (Ajustes de cuenta → Exportar tus datos) descarga todo el historial en un archivo ZIP, normalmente en 24-48 horas.",
          "Garmin no escribe datos completos de entrenamientos en Health Connect: para actividades GPS necesitas la integración directa con la API de Garmin Connect.",
          "Antes de eliminar tu cuenta de Garmin, realiza siempre una exportación masiva: los datos se borran de forma definitiva al cerrar la cuenta.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi portare gli allenamenti Garmin in una dashboard centralizzata?",
        en: "Want to bring Garmin workouts into a centralized dashboard?",
        es: "¿Quieres llevar tus entrenamientos de Garmin a un panel centralizado?",
      },
      body: {
        it: "Tra le opzioni che semplificano questo c'è FitMesh Sync: si integra con Garmin Connect via API ufficiale e porta i tuoi allenamenti in una dashboard web accessibile da browser, senza dover esportare file manualmente ogni volta.",
        en: "Among the options that simplify this is FitMesh Sync: it integrates with Garmin Connect via the official API and brings your workouts to a browser-accessible web dashboard, without having to manually export files each time.",
        es: "Entre las opciones que simplifican esto está FitMesh Sync: se integra con Garmin Connect a través de la API oficial y lleva tus entrenamientos a un panel web accesible desde el navegador, sin necesidad de exportar archivos manualmente cada vez.",
      },
      ctaLabel: {
        it: "Vedi integrazione Garmin su FitMesh →",
        en: "See Garmin integration on FitMesh →",
        es: "Ver integración de Garmin en FitMesh →",
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
        es: "¿Puedo exportar los datos de Garmin desde la app móvil?",
      },
      a: {
        it: "No. L'app Garmin Connect per Android e iOS non permette di esportare file di attività in nessun formato. Per esportare un'attività devi usare il sito web connect.garmin.com da un browser desktop o mobile. Questa è una limitazione intenzionale di Garmin, non un bug dell'app.",
        en: "No. The Garmin Connect app for Android and iOS doesn't allow exporting activity files in any format. To export an activity you must use the website connect.garmin.com from a desktop or mobile browser. This is an intentional Garmin limitation, not an app bug.",
        es: "No. La app de Garmin Connect para Android e iOS no permite exportar archivos de actividad en ningún formato. Para exportar una actividad debes usar el sitio web connect.garmin.com desde un navegador de escritorio o móvil. Esta es una limitación intencional de Garmin, no un error de la app.",
      },
    },
    {
      q: {
        it: "Qual è la differenza tra GPX e FIT per esportare da Garmin?",
        en: "What's the difference between GPX and FIT when exporting from Garmin?",
        es: "¿Cuál es la diferencia entre GPX y FIT al exportar desde Garmin?",
      },
      a: {
        it: "FIT è il formato nativo Garmin: contiene tutti i dati originali inclusi metriche proprietarie come Training Load, Body Battery, e i dati di potenza running se il tuo dispositivo li supporta. GPX è uno standard aperto che contiene GPS track e frequenza cardiaca ma perde alcune informazioni proprietarie. Per backup completo usa FIT; per condivisione o import in Strava, GPX o TCX vanno bene entrambi.",
        en: "FIT is Garmin's native format: it contains all original data including proprietary metrics like Training Load, Body Battery, and running power data if your device supports it. GPX is an open standard that contains GPS track and heart rate but loses some proprietary information. For complete backup use FIT; for sharing or Strava import, both GPX or TCX work fine.",
        es: "FIT es el formato nativo de Garmin: contiene todos los datos originales, incluidas métricas propietarias como Training Load, Body Battery y datos de potencia de carrera si tu dispositivo los admite. GPX es un estándar abierto que incluye la ruta GPS y la frecuencia cardíaca, pero pierde parte de la información propietaria. Para un respaldo completo usa FIT; para compartir o importar en Strava, tanto GPX como TCX funcionan bien.",
      },
    },
    {
      q: {
        it: "Come scaricare tutti i miei allenamenti Garmin in una volta sola?",
        en: "How to download all my Garmin workouts at once?",
        es: "¿Cómo descargar todos mis entrenamientos de Garmin de una sola vez?",
      },
      a: {
        it: "Usa la funzione 'Esporta i tuoi dati' in Impostazioni Account di Garmin Connect web. Ricevi un archivio ZIP con tutti gli FIT originali, di solito entro 24-48 ore. Per anni di dati frequenti l'archivio può pesare diversi GB. In alternativa, strumenti di terze parti come Tapiriik o GarminDB possono scaricare in batch le attività via API (richiedono account Garmin valido).",
        en: "Use the 'Export Your Data' function in Garmin Connect web Account Settings. You receive a ZIP archive with all original FITs, usually within 24-48 hours. For years of frequent data the archive can weigh several GB. Alternatively, third-party tools like Tapiriik or GarminDB can batch-download activities via API (require valid Garmin account).",
        es: "Usa la función 'Exportar tus datos' en los Ajustes de cuenta de Garmin Connect en la web. Recibirás un archivo ZIP con todos los FIT originales, normalmente en 24-48 horas. Para años de actividad frecuente, el archivo puede pesar varios GB. Como alternativa, herramientas de terceros como Tapiriik o GarminDB pueden descargar actividades en lote por API (requieren una cuenta de Garmin válida).",
      },
    },
    {
      q: {
        it: "I dati Garmin vengono cancellati se smetto di pagare Garmin Connect?",
        en: "Is Garmin data deleted if I stop paying for Garmin Connect?",
        es: "¿Se borran los datos de Garmin si dejo de pagar Garmin Connect?",
      },
      a: {
        it: "Garmin Connect è gratuito: non c'è un abbonamento base per il cloud. Alcune funzionalità avanzate come le mappe di copertura o le analisi avanzate richiedono piani premium, ma i dati di allenamento sono conservati gratuitamente. Se cancelli l'account, i dati vengono eliminati: ecco perché fare un export prima è importante.",
        en: "Garmin Connect is free: there's no basic subscription for the cloud. Some advanced features like coverage maps or advanced analytics require premium plans, but workout data is stored for free. If you delete the account, data is deleted, which is why doing an export first is important.",
        es: "Garmin Connect es gratuito: no existe una suscripción básica para el servicio en la nube. Algunas funciones avanzadas, como los mapas de cobertura o los análisis detallados, requieren planes de pago, pero los datos de entrenamientos se conservan de forma gratuita. Si eliminas la cuenta, los datos se borran, por eso es importante exportarlos antes.",
      },
    },
    {
      q: {
        it: "Posso importare dati da un vecchio Garmin su uno nuovo senza perdere la storia?",
        en: "Can I import data from an old Garmin to a new one without losing history?",
        es: "¿Puedo importar datos de un Garmin antiguo a uno nuevo sin perder el historial?",
      },
      a: {
        it: "Sì, ma solo la storia su Garmin Connect (cloud), non quella sul dispositivo fisico. Quando colleghi un nuovo Garmin allo stesso account Garmin Connect, vedi tutta la tua storia precedente. I file FIT sul vecchio dispositivo (nella cartella Activities della scheda micro-SD o della memoria interna) non vengono automaticamente copiati sul nuovo. Puoi importarli manualmente su Garmin Connect via sito web.",
        en: "Yes, but only the history on Garmin Connect (cloud), not the one on the physical device. When you connect a new Garmin to the same Garmin Connect account, you see all your previous history. FIT files on the old device (in the Activities folder on the micro-SD or internal memory) are not automatically copied to the new one. You can import them manually on Garmin Connect via the website.",
        es: "Sí, pero solo el historial almacenado en Garmin Connect (en la nube), no el que está en el dispositivo físico. Al conectar un Garmin nuevo a la misma cuenta de Garmin Connect, verás todo tu historial anterior. Los archivos FIT en el dispositivo antiguo (en la carpeta Activities de la tarjeta micro-SD o de la memoria interna) no se copian automáticamente al nuevo. Puedes importarlos manualmente en Garmin Connect desde el sitio web.",
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
