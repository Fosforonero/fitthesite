import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "fitbit-data-not-syncing-android",
  category: "guides",
  publishedAt: "2026-06-08",
  updatedAt: "2026-06-08",
  readMinutes: 7,
  tldr: {
    it: [
      "Nel 95% dei casi il problema non è Fitbit ma un permesso mancante in Health Connect.",
      "Fitbit scrive su Health Connect solo se abiliti la scrittura manualmente nelle sue impostazioni.",
      "L'app di destinazione ha bisogno di un permesso di lettura separato e indipendente da quello di Fitbit.",
      "Health Connect non sincronizza i dati storici: solo dal momento dell'autorizzazione in avanti.",
      "Alcuni Fitbit di vecchia generazione scrivono su Google Fit, non su Health Connect: aggiorna il firmware o verifica la compatibilità.",
    ],
    en: [
      "In 95% of cases the problem isn't Fitbit but a missing permission in Health Connect.",
      "Fitbit writes to Health Connect only if you enable writing manually in its settings.",
      "The destination app needs its own read permission, separate and independent from Fitbit's.",
      "Health Connect doesn't sync historical data: only from the moment of authorization onwards.",
      "Some older Fitbit models write to Google Fit, not Health Connect: update the firmware or check compatibility.",
    ],
    es: [
      "En el 95% de los casos el problema no es Fitbit, sino un permiso faltante en Health Connect.",
      "Fitbit escribe en Health Connect solo si habilitas la escritura manualmente en sus ajustes.",
      "La app de destino necesita su propio permiso de lectura, separado e independiente del de Fitbit.",
      "Health Connect no sincroniza datos históricos: solo desde el momento de la autorización en adelante.",
      "Algunos modelos antiguos de Fitbit escriben en Google Fit, no en Health Connect: actualiza el firmware o verifica la compatibilidad.",
    ],
  },
  primaryKeyword: {
    it: "fitbit non si sincronizza android",
    en: "fitbit data not syncing android",
    es: "fitbit no sincroniza datos android",
  },
  secondaryKeywords: {
    it: [
      "fitbit health connect android",
      "fitbit non sincronizza dati",
      "fitbit permessi health connect",
      "fitbit google fit android",
      "fitbit sync non funziona",
    ],
    en: [
      "fitbit health connect android",
      "fitbit not syncing data",
      "fitbit health connect permissions",
      "fitbit google fit android",
      "fitbit sync not working",
    ],
  },
  metaDescription: {
    it: "Se i dati Fitbit non appaiono nelle app Android, il problema quasi sempre non è Fitbit: è un permesso mancante in Health Connect. Ecco dove guardare e come risolverlo in 30 secondi.",
    en: "When Fitbit data isn't showing up in Android apps, the fix is almost always a missing permission in Health Connect, not a Fitbit problem. Here's where to look and how to fix it in 30 seconds.",
    es: "Si los datos de Fitbit no aparecen en tus apps de Android, casi siempre el problema no es Fitbit: es un permiso faltante en Health Connect. Aquí te explicamos dónde mirar y cómo solucionarlo en 30 segundos.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide", es: "Guía" },
    title: {
      it: "Fitbit non si sincronizza su Android: la causa vera (e la soluzione)",
      en: "Fitbit data not syncing on Android: the real cause (and the fix)",
      es: "Fitbit no sincroniza en Android: la causa real (y la solución)",
    },
    subtitle: {
      it: "Il 95% dei casi ha una sola causa: i permessi Health Connect. Non Bluetooth, non una reinstallazione. Ecco dove guardare.",
      en: "95% of cases have one root cause: Health Connect permissions. Not Bluetooth, not a reinstall. Here's where to look.",
      es: "El 95% de los casos tiene una sola causa: los permisos de Health Connect. No es el Bluetooth ni una reinstalación. Aquí te mostramos dónde buscar.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Quando i dati Fitbit non compaiono nelle app Android, il problema è quasi sempre un permesso mancante in Health Connect, non un bug di Fitbit. Ho visto questa situazione decine di volte: l'app Fitbit funziona perfettamente, il wearable sincronizza, ma una terza app non vede nulla. La colpa non è di Fitbit. Fitbit ha già fatto la sua parte.",
        en: "When Fitbit data isn't showing up in Android apps, the fix is almost always a missing permission in Health Connect, not a Fitbit problem. I've seen this situation dozens of times: the Fitbit app works perfectly, the wearable syncs, but a third-party app sees nothing. It's not Fitbit's fault. Fitbit already did its part.",
        es: "Cuando los datos de Fitbit no aparecen en las apps de Android, la solución casi siempre es un permiso faltante en Health Connect, no un problema de Fitbit. He visto esta situación decenas de veces: la app Fitbit funciona perfectamente, el wearable sincroniza, pero una app de terceros no ve nada. No es culpa de Fitbit. Fitbit ya hizo su parte.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché succede: come funziona lo scambio dati su Android",
        en: "Why it happens: how data exchange works on Android",
        es: "Por qué ocurre: cómo funciona el intercambio de datos en Android",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Su Android, Fitbit non condivide i dati direttamente con le altre app. Li deposita in Health Connect, un database locale sul tuo telefono che fa da intermediario. Pensa a Health Connect come a una cassetta postale condivisa: Fitbit ci lascia dentro i tuoi passi, la frequenza cardiaca, i dati del sonno. Le altre app possono leggere quella posta, ma solo se hanno una chiave per aprire la cassetta. Se un'app non ha quel permesso esplicito, non vede nulla. E Fitbit non ha modo di sapere che la posta non è stata ritirata.",
        en: "On Android, Fitbit doesn't share data directly with other apps. It drops data into Health Connect, a local database on your phone that acts as an intermediary. Think of Health Connect like a shared mailbox: Fitbit drops your steps, heart rate, and sleep data inside. Other apps can read that mail, but only if they have a key to open the mailbox. If an app doesn't have that explicit permission, it sees nothing. And Fitbit has no way of knowing the mail wasn't picked up.",
        es: "En Android, Fitbit no comparte los datos directamente con otras apps. Los deposita en Health Connect, una base de datos local en tu teléfono que actúa como intermediario. Piensa en Health Connect como un buzón compartido: Fitbit deja dentro tus pasos, tu frecuencia cardíaca y los datos de sueño. Las demás apps pueden leer ese contenido, pero solo si tienen una clave para abrir el buzón. Si una app no tiene ese permiso explícito, no ve nada. Y Fitbit no tiene forma de saber que el contenido no fue recogido.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il meccanismo è intenzionale: Health Connect è progettato per dare all'utente il controllo granulare su chi legge cosa. Ma questa granularità crea un punto di configurazione in più che molti non sanno esista. Risultato: l'utente vede un'app che 'non funziona', mentre in realtà è semplicemente senza permesso di lettura.",
        en: "The mechanism is intentional: Health Connect is designed to give users granular control over who reads what. But that granularity creates an extra configuration point that most people don't know exists. Result: the user sees an app that 'doesn't work', when really it's simply missing a read permission.",
        es: "El mecanismo es intencional: Health Connect está diseñado para darte un control detallado sobre quién lee qué. Pero esa granularidad crea un punto de configuración adicional que la mayoría desconoce. El resultado es que el usuario ve una app que 'no funciona', cuando en realidad simplemente le falta el permiso de lectura.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "La soluzione passo per passo",
        en: "The step-by-step fix",
        es: "La solución paso a paso",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri l'app **Fitbit** sul telefono. Vai su **Impostazioni account** (icona profilo in alto a sinistra) → **Impostazioni app** → **Health Connect**. Qui trovi l'interruttore per abilitare la scrittura dei dati su Health Connect. Se è disattivato, abilitalo. Questo passaggio manca su quasi tutte le guide online.",
          "Apri **Health Connect** (la trovi nelle Impostazioni Android → Privacy → Health Connect, oppure cerca 'Health Connect' nel cassetto app). Vai su **Autorizzazioni app**.",
          "Trova l'app che non riceve i dati Fitbit (es. FitMesh Sync, o qualsiasi altra app che stai usando). Aprila e verifica che i tipi di dato che ti servono (passi, frequenza cardiaca, sonno, etc.) siano attivati in **Lettura**.",
          "Torna nella lista principale di **Autorizzazioni app** e cerca anche **Fitbit**. Verifica che Fitbit abbia il permesso di **Scrittura** per quei tipi di dato. Senza scrittura da parte di Fitbit, non c'è nulla da leggere.",
          "Se i permessi erano già tutti attivi ma i dati non arrivano ancora, prova a revocare e riattivare il permesso di lettura nell'app di destinazione. Su alcuni dispositivi il refresh dei permessi sblocca un'inizializzazione in sospeso.",
        ],
        en: [
          "Open the **Fitbit** app on your phone. Go to **Account Settings** (profile icon, top left) → **App Settings** → **Health Connect**. Here you'll find the toggle to enable writing data to Health Connect. If it's off, enable it. This step is missing from almost every guide online.",
          "Open **Health Connect** (find it in Android Settings → Privacy → Health Connect, or search 'Health Connect' in the app drawer). Go to **App permissions**.",
          "Find the app that isn't receiving Fitbit data (e.g. FitMesh Sync, or whatever app you're using). Open it and verify that the data types you need (steps, heart rate, sleep, etc.) are enabled for **Read**.",
          "Back in the main **App permissions** list, also find **Fitbit**. Verify that Fitbit has **Write** permission for those data types. Without Fitbit writing, there's nothing to read.",
          "If all permissions were already active but data still isn't showing, try revoking and re-enabling the read permission in the destination app. On some devices, refreshing permissions unblocks a stuck initialization.",
        ],
        es: [
          "Abre la app **Fitbit** en tu teléfono. Ve a **Ajustes de cuenta** (icono de perfil, arriba a la izquierda) → **Ajustes de la app** → **Health Connect**. Aquí encontrarás el interruptor para habilitar la escritura de datos en Health Connect. Si está desactivado, actívalo. Este paso falta en casi todas las guías en línea.",
          "Abre **Health Connect** (encuéntralo en Ajustes de Android → Privacidad → Health Connect, o busca 'Health Connect' en el cajón de apps). Ve a **Permisos de apps**.",
          "Encuentra la app que no está recibiendo los datos de Fitbit (por ejemplo, FitMesh Sync, o cualquier app que estés usando). Ábrela y verifica que los tipos de datos que necesitas (pasos, frecuencia cardíaca, sueño, etc.) estén activados en **Lectura**.",
          "Vuelve a la lista principal de **Permisos de apps** y busca también **Fitbit**. Verifica que Fitbit tenga permiso de **Escritura** para esos tipos de datos. Sin escritura por parte de Fitbit, no hay nada que leer.",
          "Si todos los permisos ya estaban activos pero los datos aún no aparecen, prueba a revocar y volver a activar el permiso de lectura en la app de destino. En algunos dispositivos, actualizar los permisos desbloquea una inicialización pendiente.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Insidie comuni che bloccano la sincronizzazione",
        en: "Common gotchas that trip people up",
        es: "Errores comunes que bloquean la sincronización",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Health Connect non sincronizza i dati storici.** Se autorizzi un'app oggi, vedrà solo i dati Fitbit scritti da quel momento in avanti. I dati del mese scorso, dell'anno scorso: non li vedrà mai via Health Connect. Questa è una scelta di design, non un bug. Se hai bisogno di dati storici, devi esportarli direttamente dall'app Fitbit (Impostazioni account → Esporta dati account).",
          "**La scrittura su Health Connect non è attiva di default in Fitbit.** A differenza di Samsung Health (che su molti dispositivi chiede di configurare Health Connect durante il setup), Fitbit richiede un'attivazione manuale esplicita nella sezione impostazioni. Se non l'hai mai toccata, è quasi certamente disattivata.",
          "**Il rapporto Fitbit-Google è complicato.** Google ha acquisito Fitbit nel 2021. Alcuni modelli Fitbit più vecchi scrivono su Google Fit ma non su Health Connect, dipende dalla versione del firmware. Se hai un Fitbit di vecchia generazione e non vedi l'opzione Health Connect nell'app, verifica che il firmware sia aggiornato. In alternativa, potrebbe non essere supportato.",
          "**La lettura da parte dell'app terza è un permesso separato da quello di scrittura di Fitbit.** Molti pensano: 'ho autorizzato Fitbit, quindi l'altra app deve vedere i dati'. No: i due permessi sono completamente indipendenti. Fitbit scrive, l'app terza legge, ma per leggere serve un permesso esplicito rilasciato all'app terza. Devono essere entrambi attivi.",
        ],
        en: [
          "**Health Connect does NOT retroactively sync data.** If you authorize an app today, it will only see Fitbit data written from that moment onwards. Last month's data, last year's data: it will never see it via Health Connect. This is a design choice, not a bug. If you need historical data, you must export it directly from the Fitbit app (Account Settings → Export Account Data).",
          "**Writing to Health Connect is not active by default in Fitbit.** Unlike Samsung Health (which on many devices asks you to configure Health Connect during setup), Fitbit requires an explicit manual activation in the app's settings section. If you've never touched it, it's almost certainly off.",
          "**The Fitbit-Google relationship is complicated.** Google acquired Fitbit in 2021. Some older Fitbit models write to Google Fit but not Health Connect, depending on firmware version. If you have an older Fitbit and don't see the Health Connect option in the app, verify that firmware is up to date. Alternatively, it may simply not be supported.",
          "**The third-party app's read permission is separate from Fitbit's write permission.** Many people think: 'I authorized Fitbit, so the other app must see the data.' No: the two permissions are completely independent. Fitbit writes, the third-party app reads, but reading requires an explicit permission granted to the third-party app. Both must be active.",
        ],
        es: [
          "**Health Connect NO sincroniza datos históricos.** Si autorizas una app hoy, solo verá los datos de Fitbit escritos a partir de ese momento. Los datos del mes pasado o del año pasado no los verá nunca a través de Health Connect. Es una decisión de diseño, no un error. Si necesitas datos históricos, debes exportarlos directamente desde la app Fitbit (Ajustes de cuenta → Exportar datos de la cuenta).",
          "**La escritura en Health Connect no está activa por defecto en Fitbit.** A diferencia de Samsung Health (que en muchos dispositivos pide configurar Health Connect durante la instalación), Fitbit requiere una activación manual explícita en la sección de ajustes de la app. Si nunca la has tocado, casi con certeza está desactivada.",
          "**La relación Fitbit-Google es complicada.** Google adquirió Fitbit en 2021. Algunos modelos más antiguos de Fitbit escriben en Google Fit pero no en Health Connect, según la versión del firmware. Si tienes un Fitbit de generación anterior y no ves la opción Health Connect en la app, verifica que el firmware esté actualizado. Si ya está actualizado y la opción no aparece, es posible que ese modelo no sea compatible.",
          "**El permiso de lectura de la app de terceros es independiente del permiso de escritura de Fitbit.** Muchos piensan: 'ya autoricé Fitbit, así que la otra app debería ver los datos'. No: los dos permisos son completamente independientes. Fitbit escribe, la app de terceros lee, pero para leer se necesita un permiso explícito concedido a esa app. Ambos deben estar activos.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "La mia opinione diretta",
        en: "My direct opinion",
        es: "Mi opinión directa",
      },
      body: {
        it: "La maggior parte delle guide su questo problema dice 'reinstalla l'app' o 'riavvia il Bluetooth'. È sbagliato. Il problema è nei permessi di Health Connect nel 95% dei casi, e una volta che sai dove guardare ci vuole meno di 30 secondi per trovarlo. Non perdere tempo con passaggi drastici: controlla prima i permessi, poi eventualmente il resto.",
        en: "Most troubleshooting guides say 'reinstall the app' or 'restart Bluetooth.' That's wrong. The problem is in Health Connect permissions 95% of the time, and once you know where to look it takes less than 30 seconds to find it. Don't waste time on drastic steps: check permissions first, then everything else if needed.",
        es: "La mayoría de las guías sobre este problema dicen 'reinstala la app' o 'reinicia el Bluetooth'. Eso está mal. El problema está en los permisos de Health Connect en el 95% de los casos, y una vez que sabes dónde mirar, encontrarlo lleva menos de 30 segundos. No pierdas tiempo con pasos drásticos: revisa primero los permisos y, si es necesario, el resto después.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "In sintesi",
        en: "In summary",
        es: "En resumen",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Fitbit scrive i dati in Health Connect solo se lo abiliti manualmente: Fitbit app → Impostazioni → Health Connect → attiva la scrittura.",
          "L'app che vuoi usare deve avere il permesso di lettura in Health Connect, separato e indipendente da quello di Fitbit.",
          "Health Connect non sincronizza mai dati passati: solo dal momento dell'autorizzazione in avanti.",
          "Alcuni Fitbit di vecchia generazione scrivono su Google Fit, non su Health Connect. Aggiorna il firmware o controlla la compatibilità del tuo modello.",
        ],
        en: [
          "Fitbit writes data to Health Connect only if you enable it manually: Fitbit app → Settings → Health Connect → enable writing.",
          "The app you want to use needs its own read permission in Health Connect, separate and independent from Fitbit's permission.",
          "Health Connect never syncs past data: only from the moment of authorization onwards.",
          "Some older Fitbit models write to Google Fit, not Health Connect. Update the firmware or check your model's compatibility.",
        ],
        es: [
          "Fitbit escribe datos en Health Connect solo si lo habilitas manualmente: app Fitbit → Ajustes → Health Connect → activa la escritura.",
          "La app que quieres usar necesita su propio permiso de lectura en Health Connect, separado e independiente del permiso de Fitbit.",
          "Health Connect nunca sincroniza datos pasados: solo desde el momento de la autorización en adelante.",
          "Algunos modelos antiguos de Fitbit escriben en Google Fit, no en Health Connect. Actualiza el firmware o verifica la compatibilidad de tu modelo.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi vedere i dati Fitbit in una dashboard web, senza configurazioni complesse?",
        en: "Want to see your Fitbit data in a web dashboard, without complex configuration?",
        es: "¿Quieres ver tus datos de Fitbit en un panel web, sin configuraciones complejas?",
      },
      body: {
        it: "FitMesh Sync si integra con Fitbit via la sua API ufficiale e mostra passi, frequenza cardiaca, sonno e allenamenti in una dashboard accessibile da browser. Nessun problema di permessi Health Connect: la connessione Fitbit è diretta e guidata passo passo.",
        en: "FitMesh Sync integrates with Fitbit via its official API and shows steps, heart rate, sleep, and workouts in a browser-accessible dashboard. No Health Connect permission headaches: the Fitbit connection is direct and guided step by step.",
        es: "FitMesh Sync se integra con Fitbit a través de su API oficial y muestra pasos, frecuencia cardíaca, sueño y entrenamientos en un panel accesible desde el navegador. Sin problemas de permisos en Health Connect: la conexión con Fitbit es directa y guiada paso a paso.",
      },
      ctaLabel: {
        it: "Scopri le integrazioni FitMesh →",
        en: "Explore FitMesh integrations →",
        es: "Descubre las integraciones de FitMesh →",
      },
      ctaHref: {
        it: "/it/integrations",
        en: "/en/integrations",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Perché Fitbit non appare in Health Connect come app autorizzata?",
        en: "Why doesn't Fitbit appear in Health Connect as an authorized app?",
        es: "¿Por qué Fitbit no aparece en Health Connect como app autorizada?",
      },
      a: {
        it: "Fitbit non si registra automaticamente in Health Connect al momento dell'installazione. Devi andare in Fitbit → Impostazioni account → Impostazioni app → Health Connect e avviare tu il processo di autorizzazione. Solo dopo quel passaggio Fitbit apparirà nella lista di Health Connect.",
        en: "Fitbit doesn't automatically register in Health Connect when installed. You need to go to Fitbit → Account Settings → App Settings → Health Connect and initiate the authorization process yourself. Only after that step will Fitbit appear in Health Connect's list.",
        es: "Fitbit no se registra automáticamente en Health Connect al instalarse. Debes ir a Fitbit → Ajustes de cuenta → Ajustes de la app → Health Connect e iniciar tú el proceso de autorización. Solo después de ese paso aparecerá Fitbit en la lista de Health Connect.",
      },
    },
    {
      q: {
        it: "Posso recuperare i dati Fitbit storici dopo aver configurato Health Connect?",
        en: "Can I recover historical Fitbit data after setting up Health Connect?",
        es: "¿Puedo recuperar datos históricos de Fitbit después de configurar Health Connect?",
      },
      a: {
        it: "No, non via Health Connect. Per design, Health Connect non importa dati precedenti all'autorizzazione. Per accedere ai dati storici devi usare la funzione di esportazione di Fitbit (Impostazioni account → Esporta dati account), che genera un archivio con tutti i dati storici in formato CSV/JSON.",
        en: "No, not via Health Connect. By design, Health Connect doesn't import data that predates the authorization. To access historical data you need to use Fitbit's export feature (Account Settings → Export Account Data), which generates an archive with all historical data in CSV/JSON format.",
        es: "No, no a través de Health Connect. Por diseño, Health Connect no importa datos anteriores a la autorización. Para acceder a los datos históricos debes usar la función de exportación de Fitbit (Ajustes de cuenta → Exportar datos de la cuenta), que genera un archivo con todos los datos históricos en formato CSV/JSON.",
      },
    },
    {
      q: {
        it: "Il mio Fitbit sincronizza con Google Fit ma non con Health Connect: perché?",
        en: "My Fitbit syncs with Google Fit but not Health Connect: why?",
        es: "Mi Fitbit sincroniza con Google Fit pero no con Health Connect: ¿por qué?",
      },
      a: {
        it: "Alcuni modelli Fitbit più vecchi hanno il supporto per Google Fit ma non per Health Connect, per via del firmware. Google Fit è la vecchia API (ora deprecata); Health Connect è quella nuova. Se il tuo modello non supporta Health Connect, aggiorna il firmware dall'app Fitbit e controlla se l'opzione compare. Se il firmware è già aggiornato e l'opzione non c'è, il modello potrebbe non essere supportato: in quel caso la connessione diretta via API Fitbit (come quella di FitMesh Sync) è un'alternativa valida.",
        en: "Some older Fitbit models support Google Fit but not Health Connect, due to firmware. Google Fit is the old API (now deprecated); Health Connect is the new one. If your model doesn't support Health Connect, update the firmware from the Fitbit app and check if the option appears. If firmware is already updated and the option isn't there, the model may not be supported: in that case a direct API connection via Fitbit's API (like FitMesh Sync uses) is a valid alternative.",
        es: "Algunos modelos más antiguos de Fitbit tienen soporte para Google Fit pero no para Health Connect, por limitaciones del firmware. Google Fit es la API antigua (ahora obsoleta); Health Connect es la nueva. Si tu modelo no es compatible con Health Connect, actualiza el firmware desde la app Fitbit y comprueba si aparece la opción. Si el firmware ya está actualizado y la opción no aparece, es posible que ese modelo no sea compatible: en ese caso, la conexión directa mediante la API de Fitbit (como la que usa FitMesh Sync) es una alternativa válida.",
      },
    },
    {
      q: {
        it: "Devo tenere installata l'app Fitbit per la sincronizzazione?",
        en: "Do I need to keep the Fitbit app installed for syncing?",
        es: "¿Necesito tener instalada la app Fitbit para la sincronización?",
      },
      a: {
        it: "Se usi Health Connect come canale, sì: l'app Fitbit deve essere installata e attiva, perché è lei che scrive i dati su Health Connect. Se invece usi un'app che si connette direttamente all'API Fitbit (come FitMesh Sync), la dipendenza cambia: in quel caso l'app comunica con i server Fitbit via OAuth, indipendentemente dall'app companion installata sul telefono.",
        en: "If you use Health Connect as the channel, yes: the Fitbit app must be installed and active, because it's the one writing data to Health Connect. If instead you use an app that connects directly to the Fitbit API (like FitMesh Sync), the dependency changes: in that case the app communicates with Fitbit's servers via OAuth, independently of the companion app installed on the phone.",
        es: "Si usas Health Connect como canal, sí: la app Fitbit debe estar instalada y activa, porque es ella quien escribe los datos en Health Connect. Si en cambio usas una app que se conecta directamente a la API de Fitbit (como FitMesh Sync), la dependencia cambia: en ese caso la app se comunica con los servidores de Fitbit mediante OAuth, con independencia de la app companion instalada en el teléfono.",
      },
    },
  ],
  related: [
    "come-funziona-health-connect",
    "health-connect-not-syncing",
    "esportare-dati-fitbit-google",
  ],
  brandsMentioned: ["Fitbit", "Google", "Samsung"],
  ldType: "BlogPosting",
};
