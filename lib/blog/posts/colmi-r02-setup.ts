import type { BlogPost } from "../types";

/**
 * Supporting guide: Colmi R02 setup step-by-step: come indossarlo, caricarlo
 * e collegarlo a FitMesh Sync. Target: utenti che hanno appena ricevuto l'anello
 * e cercano istruzioni pratiche in italiano/inglese.
 * Pillar collegato: colmi-ring-fitmesh
 */
export const post: BlogPost = {
  slug: "colmi-r02-setup",
  category: "guides",
  publishedAt: "2026-06-13",
  updatedAt: "2026-06-13",
  ldType: "BlogPosting",
  readMinutes: 7,
  hero: {
    kicker: { it: "Guida", en: "Guide", es: "Guía" },
    title: {
      it: "Colmi R02: come configurarlo e leggerne i dati",
      en: "Colmi R02 setup guide: how to use it and read your data",
      es: "Colmi R02: cómo configurarlo y entender tus datos",
    },
    subtitle: {
      it: "Hai appena ricevuto il Colmi R02 e vuoi capire come funziona, come indossarlo correttamente, e come far confluire i dati in FitMesh insieme al tuo smartwatch. Questa guida copre tutto, dall'apertura della scatola alla prima dashboard unificata.",
      en: "You just received your Colmi R02 and want to understand how it works, how to wear it properly, and how to get the data into FitMesh alongside your smartwatch. This guide covers everything from opening the box to your first unified dashboard.",
      es: "Acabas de recibir el Colmi R02 y quieres entender cómo funciona, cómo llevarlo correctamente y cómo ver todos los datos en FitMesh junto con tu smartwatch. Esta guía cubre todo: desde abrir la caja hasta tu primer panel unificado.",
    },
  },
  metaDescription: {
    it: "Colmi R02: come indossarlo, caricarlo e collegarlo a FitMesh per vedere tutti i dati in un'unica dashboard. Guida pratica passo-passo in italiano.",
    en: "Colmi R02 setup: how to wear it, charge it, and connect it to FitMesh for a unified health dashboard. Step-by-step practical guide.",
    es: "Configurar el anillo Colmi R02: cómo llevarlo, cargarlo y conectarlo a FitMesh para ver todos tus datos de salud en un panel unificado. Guía práctica paso a paso.",
  },
  primaryKeyword: {
    it: "configurare anello Colmi",
    en: "set up Colmi ring",
    es: "configurar anillo Colmi",
  },
  secondaryKeywords: {
    it: [
      "colmi r02 configurazione",
      "colmi r02 istruzioni italiano",
      "colmi r02 come si usa",
      "colmi r02 setup",
      "colmi r02 come funziona",
      "anello colmi fitmesh",
    ],
    en: [
      "colmi r02 setup guide",
      "how to use colmi r02",
      "colmi r02 instructions",
      "colmi r02 configuration",
      "colmi ring fitmesh",
      "colmi r02 how it works",
    ],
  },
  tldr: {
    it: [
      "Indossa l'anello Colmi sull'anulare o il medio della mano non dominante, sensore verso il palmo.",
      "La batteria dura 5-7 giorni; carica con il disco magnetico collegato a qualsiasi caricatore USB standard.",
      "La connessione a FitMesh Sync avviene su Android in 6 passi: nessuna app del produttore richiesta.",
      "Una volta configurato, i dati del tuo account FitMesh si vedono anche su iPhone (app iOS in arrivo) e possono passare in Apple Salute.",
      "I dati notturni (HRV, SpO2, fasi del sonno) arrivano automaticamente ogni mattina dopo la prima sincronizzazione.",
    ],
    en: [
      "Wear the Colmi ring on the ring or middle finger of your non-dominant hand, sensor facing your palm.",
      "Battery lasts 5-7 days; charge with the magnetic disc connected to any standard USB adapter.",
      "Connecting to FitMesh Sync on Android takes 6 steps and requires no manufacturer app.",
      "Once set up, your FitMesh account data is also viewable on iPhone (iOS app coming soon) and can flow into Apple Health.",
      "Overnight data (HRV, SpO2, sleep stages) arrives automatically each morning after the first sync.",
    ],
    es: [
      "Lleva el anillo Colmi en el dedo anular o corazón de la mano no dominante, con el sensor orientado hacia la palma.",
      "La batería dura entre 5 y 7 días; cárgalo con el disco magnético conectado a cualquier cargador USB estándar.",
      "Conectar el anillo a FitMesh Sync en Android requiere 6 pasos y no necesitas ninguna app del fabricante.",
      "Una vez configurado, los datos de tu cuenta FitMesh también se pueden ver en iPhone (app iOS próximamente) y pueden pasar a Apple Health.",
      "Los datos nocturnos (HRV, SpO2, fases del sueño) llegan automáticamente cada mañana tras la primera sincronización.",
    ],
  },
  body: [
    // --- WHAT'S IN THE BOX ---
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa trovi nella scatola del Colmi R02",
        en: "What's in the Colmi R02 box",
        es: "Qué hay dentro de la caja del Colmi R02",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La confezione del Colmi R02 è essenziale. All'interno trovi:",
        en: "The Colmi R02 packaging is minimal. Inside you'll find:",
        es: "El empaque del Colmi R02 es sencillo. Dentro encontrarás:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**L'anello** nelle dimensioni che hai ordinato.",
          "**Il caricatore magnetico**: un dischetto con magnete che si attacca al lato piatto dell'anello.",
          "**Cavo USB-A** (alcuni bundle includono anche il cavo USB-C; l'alimentatore non è incluso, va bene qualsiasi caricatore USB standard).",
          "**Manualino di istruzioni** in più lingue (il contenuto è essenziale: per tutti i dettagli rimanda all'app).",
          "**Kit di taglie di prova** (se lo hai ordinato), per trovare la misura giusta prima di indossare l'anello definitivo.",
        ],
        en: [
          "**The ring** in the size you ordered.",
          "**The magnetic charger**: a small disc with a magnet that attaches to the flat side of the ring.",
          "**USB-A cable** (some bundles include USB-C; the power adapter is not included, any standard USB charger works).",
          "**Quick-start booklet** in multiple languages (content is very basic; for full details it defers to the app).",
          "**Sizing kit** (if you ordered it), to find the right fit before committing to the actual ring.",
        ],
        es: [
          "**El anillo** en la talla que pediste.",
          "**El cargador magnético**: un pequeño disco con imán que se adhiere al lado plano del anillo.",
          "**Cable USB-A** (algunos paquetes incluyen también cable USB-C; el adaptador de corriente no está incluido, cualquier cargador USB estándar funciona).",
          "**Manual de inicio rápido** en varios idiomas (el contenido es muy básico; para todos los detalles remite a la app).",
          "**Kit de tallas de prueba** (si lo pediste), para encontrar la medida correcta antes de quedarte con el anillo definitivo.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Hai il kit di taglie di prova?",
        en: "Got the sizing kit?",
        es: "¿Tienes el kit de tallas de prueba?",
      },
      body: {
        it: "Prova ogni anello per 10-15 minuti. L'anello non deve lasciare segni rossi sulla pelle (troppo stretto) e non deve ruotare liberamente (troppo largo). Le dita cambiano leggermente di diametro durante la giornata: misura di pomeriggio per un risultato più rappresentativo.",
        en: "Try each size for 10-15 minutes. The ring should not leave red marks on the skin (too tight) and should not rotate freely (too loose). Fingers change slightly in diameter throughout the day: measure in the afternoon for a more representative result.",
        es: "Prueba cada talla durante 10-15 minutos. El anillo no debe dejar marcas rojas en la piel (demasiado apretado) ni girar libremente (demasiado suelto). Los dedos cambian ligeramente de diámetro a lo largo del día: mídelos por la tarde para obtener un resultado más representativo.",
      },
    },
    // --- HOW TO WEAR IT ---
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come indossare il Colmi R02 correttamente",
        en: "How to wear the Colmi R02 correctly",
        es: "Cómo llevar el Colmi R02 correctamente",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "**Quale dito**: il Colmi R02 funziona meglio sull'**anulare** o sul **medio** della mano non dominante. Questi diti hanno un flusso sanguigno regolare e sono meno esposti a movimenti bruschi durante la giornata. Evita l'indice (troppo movimento) e il mignolo (circolazione spesso meno regolare).",
        en: "**Which finger**: the Colmi R02 works best on the **ring finger** or **middle finger** of your non-dominant hand. These fingers have consistent blood flow and are less exposed to sudden movements during the day. Avoid the index finger (too much movement) and the pinky (often less consistent circulation).",
        es: "**Qué dedo usar**: el Colmi R02 funciona mejor en el **dedo anular** o en el **dedo corazón** de la mano no dominante. Estos dedos tienen un flujo sanguíneo regular y están menos expuestos a movimientos bruscos durante el día. Evita el índice (demasiado movimiento) y el meñique (circulación a menudo menos regular).",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "**Orientamento**: il lato con il sensore ottico (la parte piatta o leggermente convessa all'interno dell'anello) deve stare sulla parte **inferiore del dito**, quella rivolta verso il palmo della mano. Questo assicura il contatto diretto tra il sensore e la pelle. Se l'anello ha un piccolo punto o una scanalatura indicatrice, posizionalo sul lato inferiore.",
        en: "**Orientation**: the side with the optical sensor (the flat or slightly curved inner surface of the ring) should sit on the **underside of your finger**, the side facing your palm. This ensures direct contact between the sensor and your skin. If the ring has a small dot or groove as a position indicator, place that on the underside.",
        es: "**Orientación**: el lado con el sensor óptico (la parte plana o ligeramente curva del interior del anillo) debe quedar en la **parte inferior del dedo**, la que mira hacia la palma. Esto garantiza el contacto directo entre el sensor y la piel. Si el anillo tiene un pequeño punto o ranura indicadora de posición, colócalo en la parte inferior.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Test rapido per la misura",
        en: "Quick fit check",
        es: "Comprobación rápida del ajuste",
      },
      body: {
        it: "Dopo 5 minuti di usura, guarda se ci sono segni rossi sulla pelle: se sì, la misura è troppo piccola. Se l'anello ruota o scivola facilmente, considera una taglia più piccola. Le dita si gonfiano con il caldo e si restringono al freddo: una lieve differenza a orari diversi della giornata è normale.",
        en: "After wearing it for 5 minutes, look for red marks on the skin: if you see them, the size is too small. If the ring spins or slides off easily, go one size smaller. Fingers swell in heat and shrink when cold: a slight difference at different times of day is normal.",
        es: "Después de llevarlo 5 minutos, fíjate si aparecen marcas rojas en la piel: si es así, la talla es demasiado pequeña. Si el anillo gira o se sale fácilmente, prueba una talla menos. Los dedos se hinchan con el calor y se encogen con el frío: una pequeña diferencia a distintas horas del día es normal.",
      },
    },
    // --- CHARGING ---
    {
      type: "heading",
      level: 2,
      text: {
        it: "Ricarica: quanto dura la batteria e come caricarla",
        en: "Charging: how long the battery lasts and how to charge",
        es: "Carga: cuánto dura la batería y cómo cargarla",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Con il monitoraggio continuo attivo (battito cardiaco, SpO2 notturno, passi), il Colmi R02 dura tipicamente **5-7 giorni**. Con il monitoraggio SpO2 continuo molto attivo la durata può scendere a 3-4 giorni.",
        en: "With continuous monitoring active (heart rate, overnight SpO2, steps), the Colmi R02 typically lasts **5-7 days**. With aggressive continuous overnight SpO2 monitoring it can drop to 3-4 days.",
        es: "Con el monitoreo continuo activo (frecuencia cardíaca, SpO2 nocturno, pasos), el Colmi R02 dura normalmente **entre 5 y 7 días**. Con un monitoreo muy intensivo de SpO2 nocturno continuo, puede bajar a 3-4 días.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Come caricare**: aggancia il caricatore magnetico al lato piatto dell'anello. Il magnete lo mantiene in posizione. Collega il cavo a qualsiasi alimentatore USB standard (5V/1A è sufficiente, non serve il caricatore rapido).",
          "**Come sapere che sta caricando**: la maggior parte dei modelli R02 mostra un LED che lampeggia durante la carica. Quando il LED si spegne o smette di lampeggiare, la carica è completa.",
          "**Tempo di ricarica completa**: circa 1-2 ore da vuoto.",
          "**Routine consigliata**: caricalo ogni 4-5 giorni la mattina, durante la doccia o la colazione. Così non rischi di restare senza batteria di notte, il momento in cui i dati sono più preziosi.",
        ],
        en: [
          "**How to charge**: attach the magnetic charger to the flat side of the ring. The magnet holds it in place. Connect the cable to any standard USB adapter (5V/1A is enough, no fast charger needed).",
          "**How to know it's charging**: most R02 models show an LED that blinks during charging. When the LED turns off or stops blinking, charging is complete.",
          "**Full charge time**: approximately 1-2 hours from empty.",
          "**Recommended routine**: charge every 4-5 days in the morning during your shower or over breakfast. This way you never risk running out of battery overnight, when your data matters most.",
        ],
        es: [
          "**Cómo cargar**: acopla el cargador magnético al lado plano del anillo. El imán lo mantiene en su sitio. Conecta el cable a cualquier adaptador USB estándar (5V/1A es suficiente, no necesitas carga rápida).",
          "**Cómo saber que está cargando**: la mayoría de los modelos R02 muestran un LED que parpadea durante la carga. Cuando el LED se apaga o deja de parpadear, la carga ha terminado.",
          "**Tiempo de carga completa**: aproximadamente 1-2 horas desde cero.",
          "**Rutina recomendada**: cárgalo cada 4-5 días por la mañana, mientras te duchas o desayunas. Así nunca corres el riesgo de quedarte sin batería por la noche, que es cuando los datos son más valiosos.",
        ],
      },
    },
    // --- FIRST SYNC ---
    {
      type: "heading",
      level: 2,
      text: {
        it: "Prima sincronizzazione con FitMesh Sync: passo dopo passo",
        en: "First sync with FitMesh Sync: step by step",
        es: "Primera sincronización con FitMesh Sync: paso a paso",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync si connette al Colmi R02 via Bluetooth diretto, senza passare dall'app del produttore. Non ti serve scaricare l'app companion Colmi per usare FitMesh: anche se puoi tenerla installata se lo preferisci, non è necessaria.",
        en: "FitMesh Sync connects to the Colmi R02 over direct Bluetooth, without going through the manufacturer's companion app. You don't need to download the Colmi companion app to use FitMesh: you can keep it installed if you prefer, but it is not required.",
        es: "FitMesh Sync se conecta al Colmi R02 por Bluetooth directo, sin pasar por la app del fabricante. No necesitas descargar la app companion de Colmi para usar FitMesh: puedes tenerla instalada si lo prefieres, pero no es necesaria.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Installa FitMesh Sync**: se non l'hai già fatto, scaricala dal Google Play Store. La versione beta è accessibile tramite link di invito dalla pagina [/it/beta](/it/beta).",
          "**Apri FitMesh e vai su \"Dispositivi\"**: nella schermata principale, seleziona il menu dispositivi o tocca il tasto \"+\" per aggiungere un nuovo device.",
          "**Seleziona \"Anello smart\" e poi \"Colmi R02/R03\"**: FitMesh avvia la scansione Bluetooth. Assicurati che il Bluetooth del telefono sia attivo e che l'anello sia vicino (entro 50 cm).",
          "**Abbina l'anello**: quando il Colmi R02 appare nella lista dei dispositivi rilevati, selezionalo. L'abbinamento richiede pochi secondi. Non ti viene chiesto nessun PIN.",
          "**Prima sincronizzazione dati**: dopo l'abbinamento, FitMesh scarica automaticamente i dati storici presenti nella memoria dell'anello (tipicamente gli ultimi 7 giorni). Questa prima sincronizzazione può richiedere da 30 secondi a qualche minuto.",
          "**Sincronizzazioni successive**: le sincronizzazioni seguenti avvengono in automatico ogni volta che l'anello è in range del telefono. Non devi fare nulla manualmente.",
        ],
        en: [
          "**Install FitMesh Sync**: if you haven't already, download it from the Google Play Store. The beta version is accessible via an invite link from the [/en/beta](/en/beta) page.",
          "**Open FitMesh and go to \"Devices\"**: from the main screen, select the devices menu or tap the \"+\" button to add a new device.",
          "**Select \"Smart ring\" then \"Colmi R02/R03\"**: FitMesh starts a Bluetooth scan. Make sure your phone's Bluetooth is on and the ring is nearby (within 50 cm).",
          "**Pair the ring**: when the Colmi R02 appears in the detected devices list, select it. Pairing takes a few seconds. No PIN is required.",
          "**First data sync**: after pairing, FitMesh automatically downloads the historical data stored in the ring's memory (typically the past 7 days). This first sync can take anywhere from 30 seconds to a few minutes.",
          "**Subsequent syncs**: future syncs happen automatically every time the ring is in range of your phone. You don't need to do anything manually.",
        ],
        es: [
          "**Instala FitMesh Sync**: si aún no lo has hecho, descárgala desde Google Play Store. La versión beta es accesible mediante un enlace de invitación desde la página [/es/beta](/es/beta).",
          "**Abre FitMesh y ve a \"Dispositivos\"**: desde la pantalla principal, selecciona el menú de dispositivos o toca el botón \"+\" para agregar un nuevo dispositivo.",
          "**Selecciona \"Anillo inteligente\" y luego \"Colmi R02/R03\"**: FitMesh inicia el escaneo Bluetooth. Asegúrate de que el Bluetooth de tu teléfono esté activado y de que el anillo esté cerca (a menos de 50 cm).",
          "**Vincula el anillo**: cuando el Colmi R02 aparezca en la lista de dispositivos detectados, selecciónalo. La vinculación tarda unos segundos. No se te pedirá ningún PIN.",
          "**Primera sincronización de datos**: tras la vinculación, FitMesh descarga automáticamente los datos históricos almacenados en la memoria del anillo (normalmente los últimos 7 días). Esta primera sincronización puede tardar entre 30 segundos y varios minutos.",
          "**Sincronizaciones posteriores**: las siguientes sincronizaciones se realizan de forma automática cada vez que el anillo está al alcance del teléfono. No tienes que hacer nada manualmente.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per i dettagli tecnici completi su come funziona la connessione Bluetooth, cosa succede durante la sincronizzazione e come avviene la fusione dei dati con il tuo smartwatch, leggi la [guida completa all'anello Colmi](/it/blog/colmi-ring-fitmesh).",
        en: "For the full technical details on how the Bluetooth connection works, what happens during a sync, and how data fusion with your smartwatch is handled, read the [full Colmi ring guide](/en/blog/colmi-ring-fitmesh).",
        es: "Para conocer todos los detalles técnicos sobre cómo funciona la conexión Bluetooth, qué ocurre durante la sincronización y cómo se fusionan los datos con tu smartwatch, lee la [guía completa del anillo Colmi](/es/blog/colmi-ring-fitmesh).",
      },
    },
    // --- iOS NOTE ---
    {
      type: "heading",
      level: 2,
      text: {
        it: "iPhone e Apple Salute: cosa succede una volta configurato",
        en: "iPhone and Apple Health: what happens once you're set up",
        es: "iPhone y Apple Health: qué ocurre una vez configurado",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La connessione Bluetooth tra FitMesh Sync e l'anello Colmi avviene su Android, dove i dati vengono raccolti e caricati sul tuo account FitMesh. Una volta che i dati sono nel tuo account, però, li puoi vedere ovunque: l'app FitMesh per iPhone (iOS) e il ponte verso Apple Salute sono in arrivo con lancio imminente.",
        en: "The Bluetooth connection between FitMesh Sync and the Colmi ring happens on Android, where the data is collected and uploaded to your FitMesh account. Once the data is in your account, however, you can access it anywhere: the FitMesh app for iPhone (iOS) and the Apple Health bridge are coming soon.",
        es: "La conexión Bluetooth entre FitMesh Sync y el anillo Colmi se realiza en Android, donde los datos se recopilan y se suben a tu cuenta FitMesh. Una vez que los datos están en tu cuenta, puedes acceder a ellos desde cualquier lugar: la app FitMesh para iPhone (iOS) y el puente hacia Apple Health están próximamente disponibles.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Uso su iPhone (app iOS in arrivo)",
        en: "Using on iPhone (iOS app coming soon)",
        es: "Uso en iPhone (app iOS próximamente)",
      },
      body: {
        it: "Se usi iPhone, configura l'anello Colmi tramite FitMesh Sync su un dispositivo Android (il tuo, o quello di un familiare). I dati vengono caricati sul tuo account FitMesh e saranno accessibili dall'app iOS non appena disponibile. In aggiunta, il ponte opzionale verso Apple Salute ti permettera' di far confluire le metriche dell'anello (sonno, battito, SpO2) direttamente nell'app Salute di Apple. L'app iOS di FitMesh Sync non e' ancora scaricabile su App Store: iscriviti alla beta per essere tra i primi ad accedervi.",
        en: "If you use iPhone, set up the Colmi ring via FitMesh Sync on an Android device (yours or a family member's). The data is uploaded to your FitMesh account and will be accessible from the iOS app as soon as it becomes available. Additionally, the optional Apple Health bridge will let ring metrics (sleep, heart rate, SpO2) flow directly into Apple's Health app. The FitMesh Sync iOS app is not yet available on the App Store: sign up for the beta to be among the first to access it.",
        es: "Si usas iPhone, configura el anillo Colmi a través de FitMesh Sync en un dispositivo Android (el tuyo o el de un familiar). Los datos se suben a tu cuenta FitMesh y estarán accesibles desde la app iOS en cuanto esté disponible. Además, el puente opcional hacia Apple Health permitirá que las métricas del anillo (sueño, frecuencia cardíaca, SpO2) lleguen directamente a la app Salud de Apple. La app iOS de FitMesh Sync todavía no está disponible en el App Store: regístrate en la beta para ser de los primeros en acceder.",
      },
    },
    // --- UNDERSTANDING THE DATA ---
    {
      type: "heading",
      level: 2,
      text: {
        it: "Capire i dati nella dashboard FitMesh",
        en: "Understanding the data in the FitMesh dashboard",
        es: "Entender los datos en el panel de FitMesh",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Una volta sincronizzato, nella dashboard FitMesh trovi le metriche dell'anello Colmi organizzate per tipologia.",
        en: "Once synced, the FitMesh dashboard shows your Colmi ring metrics organized by type.",
        es: "Una vez sincronizado, el panel de FitMesh muestra las métricas del anillo Colmi organizadas por tipo.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "Dati giornalieri",
        en: "Daily data",
        es: "Datos diarios",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Passi e distanza",
          "Calorie stimate",
          "Minuti attivi",
          "Frequenza cardiaca media e frequenza cardiaca a riposo",
        ],
        en: [
          "Steps and distance",
          "Estimated calories",
          "Active minutes",
          "Average heart rate and resting heart rate",
        ],
        es: [
          "Pasos y distancia",
          "Calorías estimadas",
          "Minutos activos",
          "Frecuencia cardíaca media y frecuencia cardíaca en reposo",
        ],
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "Dati notturni",
        en: "Overnight data",
        es: "Datos nocturnos",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Disponibili ogni mattina dopo la prima sincronizzazione:",
        en: "Available each morning after the first sync:",
        es: "Disponibles cada mañana tras la primera sincronización:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Ore di sonno totali",
          "Distribuzione delle fasi (sonno leggero, profondo, REM, veglia)",
          "HRV notturno (variabilità della frequenza cardiaca)",
          "SpO2 notturno (saturazione stimata dell'ossigeno)",
          "Frequenza cardiaca minima notturna (battito a riposo)",
        ],
        en: [
          "Total sleep hours",
          "Sleep stage breakdown (light, deep, REM, awake)",
          "Overnight HRV (heart rate variability)",
          "Overnight SpO2 (estimated oxygen saturation)",
          "Overnight minimum heart rate (resting HR)",
        ],
        es: [
          "Horas totales de sueño",
          "Distribución de las fases del sueño (ligero, profundo, REM, vigilia)",
          "HRV nocturno (variabilidad de la frecuencia cardíaca)",
          "SpO2 nocturno (saturación estimada de oxígeno)",
          "Frecuencia cardíaca mínima nocturna (frecuencia cardíaca en reposo)",
        ],
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "Vista unificata con il tuo smartwatch",
        en: "Unified view with your smartwatch",
        es: "Vista unificada con tu smartwatch",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se hai gia' collegato uno smartwatch a FitMesh (Galaxy Watch, Pixel Watch, Garmin, Amazfit e altri), i dati dell'anello Colmi si integrano automaticamente con quelli del watch sulla stessa timeline. Di notte le metriche vengono dall'anello; le sessioni di allenamento e le metriche diurne vengono dal watch. Non ci sono doppi conteggi.",
        en: "If you have already connected a smartwatch to FitMesh (Galaxy Watch, Pixel Watch, Garmin, Amazfit, and others), the Colmi ring data integrates automatically with watch data on the same timeline. At night the metrics come from the ring; workout sessions and daytime metrics come from the watch. There is no double counting.",
        es: "Si ya conectaste un smartwatch a FitMesh (Galaxy Watch, Pixel Watch, Garmin, Amazfit y otros), los datos del anillo Colmi se integran automáticamente con los del reloj en la misma línea de tiempo. Por la noche las métricas provienen del anillo; las sesiones de entrenamiento y las métricas diurnas provienen del reloj. No hay duplicados.",
      },
    },
    // --- FAQ ---
    // --- CTA ---
    {
      type: "cta",
      title: {
        it: "Hai un anello Colmi e vuoi iniziare?",
        en: "Got a Colmi ring and ready to start?",
        es: "¿Tienes un anillo Colmi y quieres empezar?",
      },
      body: {
        it: "FitMesh Sync e' in beta privata. I primi 1000 utenti ottengono 1 anno di Pro gratis, incluso l'accesso alla funzione anello Colmi non appena rilasciata. Iscriviti ora per tenere il posto.",
        en: "FitMesh Sync is in private beta. The first 1,000 users get 1 year of Pro for free, including access to the Colmi ring feature as soon as it ships. Sign up now to keep your spot.",
        es: "FitMesh Sync está en beta privada. Los primeros 1.000 usuarios obtienen 1 año de Pro gratis, incluido el acceso a la función del anillo Colmi en cuanto esté disponible. Regístrate ahora para reservar tu lugar.",
      },
      ctaLabel: {
        it: "Iscriviti alla beta",
        en: "Sign up for beta",
        es: "Regístrate en la beta",
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
        it: "Il Colmi R02 e' impermeabile?",
        en: "Is the Colmi R02 waterproof?",
        es: "¿El Colmi R02 es resistente al agua?",
      },
      a: {
        it: "Si', il Colmi R02 ha una certificazione IP68: resiste all'immersione fino a 50 metri in acqua dolce secondo le specifiche del produttore. Puoi tenerlo durante la doccia e il lavaggio delle mani. Evita comunque immersioni prolungate in acqua salata o in piscina, che possono deteriorare i materiali nel tempo.",
        en: "Yes. The Colmi R02 carries an IP68 rating: it resists immersion up to 50 meters in fresh water according to the manufacturer's specifications. You can wear it in the shower and while washing your hands. Avoid prolonged immersion in salt water or chlorinated pools, which can degrade the materials over time.",
        es: "Sí. El Colmi R02 tiene certificación IP68: resiste la inmersión hasta 50 metros en agua dulce según las especificaciones del fabricante. Puedes llevarlo en la ducha y al lavarte las manos. Evita la inmersión prolongada en agua salada o en piscinas con cloro, ya que pueden deteriorar los materiales con el tiempo.",
      },
    },
    {
      q: {
        it: "Devo tenere installata l'app QRing o Colmi per usare FitMesh?",
        en: "Do I need the QRing or Colmi app to use FitMesh?",
        es: "¿Necesito tener instalada la app QRing o Colmi para usar FitMesh?",
      },
      a: {
        it: "No. FitMesh Sync si connette direttamente all'anello Colmi via Bluetooth e non richiede l'app companion del produttore. Puoi disinstallarla se non la usi. Se preferisci tenerla per confronto, non crea conflitti: i due sistemi operano in modo indipendente.",
        en: "No. FitMesh Sync connects directly to the Colmi ring over Bluetooth and does not require the manufacturer's companion app. You can uninstall it if you don't use it. If you prefer to keep it for comparison, there's no conflict: the two systems operate independently.",
        es: "No. FitMesh Sync se conecta directamente al anillo Colmi por Bluetooth y no requiere la app companion del fabricante. Puedes desinstalarla si no la usas. Si prefieres conservarla para comparar, no hay ningún conflicto: los dos sistemas funcionan de forma independiente.",
      },
    },
    {
      q: {
        it: "L'anello Colmi funziona con iPhone?",
        en: "Does the Colmi ring work with iPhone?",
        es: "¿El anillo Colmi funciona con iPhone?",
      },
      a: {
        it: "La connessione Bluetooth tra FitMesh Sync e l'anello Colmi richiede Android. Una volta configurato su Android, pero', i dati vengono caricati sul tuo account FitMesh e saranno visibili anche su iPhone tramite l'app iOS di FitMesh (in arrivo a breve) e facoltativamente su Apple Salute. Se usi solo iPhone, iscriviti alla beta: sarai avvisato al lancio dell'app iOS.",
        en: "The Bluetooth connection between FitMesh Sync and the Colmi ring requires Android. Once set up on Android, however, the data is uploaded to your FitMesh account and will be viewable on iPhone through the FitMesh iOS app (coming soon) and optionally in Apple Health. If you only have an iPhone, sign up for the beta: you will be notified at the iOS app launch.",
        es: "La conexión Bluetooth entre FitMesh Sync y el anillo Colmi requiere Android. Una vez configurado en Android, los datos se suben a tu cuenta FitMesh y podrás verlos en iPhone a través de la app iOS de FitMesh (próximamente) y, de forma opcional, en Apple Health. Si solo tienes iPhone, regístrate en la beta: te avisaremos cuando se lance la app iOS.",
      },
    },
    {
      q: {
        it: "Quanti dati storici vengono scaricati al primo abbinamento?",
        en: "How much historical data is downloaded on first pairing?",
        es: "¿Cuántos datos históricos se descargan al vincular el anillo por primera vez?",
      },
      a: {
        it: "FitMesh scarica tipicamente gli ultimi 7 giorni di dati dalla memoria dell'anello Colmi. I dati piu' vecchi potrebbero non essere disponibili perche' la memoria interna dell'anello ha capacita' limitata e sovrascrive i dati piu' datati.",
        en: "FitMesh typically downloads the last 7 days of data from the Colmi ring's memory. Older data may not be available because the ring's internal memory is limited and overwrites older records.",
        es: "FitMesh descarga normalmente los últimos 7 días de datos de la memoria del anillo Colmi. Los datos más antiguos pueden no estar disponibles porque la memoria interna del anillo tiene capacidad limitada y sobreescribe los registros más viejos.",
      },
    },
  ],
  related: ["colmi-ring-fitmesh", "tracciare-sonno-anello", "anello-vs-smartwatch"],
  brandsMentioned: ["Colmi"],
};
