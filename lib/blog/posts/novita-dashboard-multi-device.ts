import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "novita-dashboard-multi-device",
  category: "news",
  publishedAt: "2026-06-10",
  updatedAt: "2026-06-10",
  ldType: "BlogPosting",
  readMinutes: 4,
  primaryKeyword: {
    it: "dashboard multi dispositivo",
    en: "multi device dashboard",
    es: "panel multi dispositivo",
  },
  secondaryKeywords: {
    it: [
      "dati piu smartwatch una dashboard",
      "niente doppioni wearable",
      "FitMesh Sync dashboard",
      "aggregare dati wearable",
      "passi contati una volta sola",
    ],
    en: [
      "data multiple smartwatches one dashboard",
      "no duplicate wearable data",
      "FitMesh Sync dashboard",
      "aggregate wearable data",
      "steps counted only once",
    ],
  },
  metaDescription: {
    it: "FitMesh Sync lancia la dashboard multi dispositivo: orologi e anello in un'unica vista, senza doppioni. Ogni metrica viene tenuta una volta sola, con la fonte migliore disponibile.",
    en: "FitMesh Sync launches the multi device dashboard: watches and ring in one view, no duplicates. Each metric is kept once, with the best source available.",
    es: "FitMesh Sync estrena el panel multi dispositivo: relojes y anillo en una sola vista, sin duplicados. Cada métrica se guarda una vez, con la mejor fuente disponible.",
  },
  tldr: {
    it: [
      "Una sola dashboard raccoglie i dati di tutti i tuoi dispositivi: smartwatch, anello e qualsiasi altra sorgente collegata.",
      "FitMesh Sync elimina i doppioni automaticamente: i passi vengono contati una volta sola anche se indossi piu dispositivi.",
      "Per ogni metrica viene tenuto il valore migliore, non la somma di tutti.",
      "La vista globale e disponibile da subito per tutti gli utenti beta.",
    ],
    en: [
      "A single dashboard collects data from all your devices: smartwatches, ring, and any other connected source.",
      "FitMesh Sync eliminates duplicates automatically: steps are counted only once even if you wear multiple devices.",
      "For each metric the best value is kept, not the sum of all.",
      "The global view is available immediately for all beta users.",
    ],
    es: [
      "Un solo panel reúne los datos de todos tus dispositivos: smartwatches, anillo y cualquier otra fuente conectada.",
      "FitMesh Sync elimina los duplicados de forma automática: los pasos se cuentan una sola vez aunque lleves varios dispositivos.",
      "Para cada métrica se conserva el mejor valor, no la suma de todos.",
      "La vista global está disponible desde ya para todos los usuarios beta.",
    ],
  },
  hero: {
    kicker: { it: "Novità", en: "What's New", es: "Novedades" },
    title: {
      it: "Dashboard multi dispositivo: tutti i tuoi wearable in una vista, senza doppioni",
      en: "Multi device dashboard: all your wearables in one view, no duplicates",
      es: "Panel multi dispositivo: todos tus wearables en una vista, sin duplicados",
    },
    subtitle: {
      it: "Con l'aggiornamento di oggi, FitMesh Sync introduce la dashboard globale: un solo schermo che aggrega i dati di orologi, anello e altre sorgenti, eliminando i doppioni e mostrando sempre il valore migliore per ciascuna metrica.",
      en: "With today's update, FitMesh Sync introduces the global dashboard: a single screen that aggregates data from watches, ring and other sources, eliminating duplicates and always showing the best value for each metric.",
      es: "Con la actualización de hoy, FitMesh Sync presenta el panel global: una sola pantalla que agrupa los datos de relojes, anillo y otras fuentes, elimina los duplicados y muestra siempre el mejor valor para cada métrica.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Molti di voi usano piu di un dispositivo. Chi porta lo smartwatch durante il giorno e l'anello di notte. Chi ha cambiato orologio a meta anno e vuole vedere i dati continui. Chi usa dispositivi diversi a seconda dell'attivita. Finora FitMesh Sync mostrava i dati separati per sorgente: utile, ma non abbastanza. Da oggi c'e la dashboard globale.",
        en: "Many of you use more than one device. Some wear the smartwatch during the day and the ring at night. Some changed watch mid-year and want to see continuous data. Some use different devices depending on the activity. Until now FitMesh Sync showed data separated by source: useful, but not enough. From today there is the global dashboard.",
        es: "Muchos de vosotros usáis más de un dispositivo. Hay quienes llevan el smartwatch durante el día y el anillo por la noche. Quienes cambiaron de reloj a mitad de año y quieren ver los datos de forma continua. Quienes usan dispositivos distintos según la actividad. Hasta ahora FitMesh Sync mostraba los datos separados por fuente: útil, pero no suficiente. A partir de hoy existe el panel global.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Una vista, tutte le sorgenti",
        en: "One view, all sources",
        es: "Una vista, todas las fuentes",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La nuova dashboard globale raccoglie in un unico posto i dati di tutti i dispositivi che hai collegato a FitMesh Sync: smartwatch, anello Colmi, e qualsiasi altra sorgente attiva. Non devi passare da una scheda all'altra per confrontare i numeri: li vedi tutti insieme, organizzati per data e tipo di metrica.",
        en: "The new global dashboard collects in one place the data from all devices you have connected to FitMesh Sync: smartwatches, Colmi ring, and any other active source. You do not need to switch between tabs to compare numbers: you see them all together, organized by date and metric type.",
        es: "El nuevo panel global reúne en un solo lugar los datos de todos los dispositivos que has conectado a FitMesh Sync: smartwatches, anillo Colmi y cualquier otra fuente activa. No necesitas cambiar de pestaña para comparar cifras: los ves todos juntos, ordenados por fecha y tipo de métrica.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come gestiamo i doppioni",
        en: "How we handle duplicates",
        es: "Cómo gestionamos los duplicados",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il problema dei doppioni e reale: se due dispositivi registrano entrambi i tuoi passi nella stessa ora, sommarli darebbe un numero sbagliato. Il sistema che abbiamo costruito risolve questo in tre passaggi:",
        en: "The duplicate problem is real: if two devices both record your steps in the same hour, adding them up would give a wrong number. The system we built solves this in three steps:",
        es: "El problema de los duplicados es real: si dos dispositivos registran tus pasos en la misma hora, sumarlos daría un número incorrecto. El sistema que hemos creado lo resuelve en tres pasos:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Identifica le sovrapposizioni.** Per ogni intervallo di tempo, FitMesh Sync vede quante sorgenti hanno registrato la stessa metrica.",
          "**Sceglie la fonte migliore.** Tra le sorgenti sovrapposte, l'app usa quella con il dato piu completo o piu preciso per quell'intervallo.",
          "**Mostra un valore solo.** Il numero che vedi nella dashboard e sempre il singolo valore migliore, non la somma.",
        ],
        en: [
          "**Identifies overlaps.** For each time interval, FitMesh Sync sees how many sources recorded the same metric.",
          "**Chooses the best source.** Among overlapping sources, the app uses the one with the most complete or most accurate data for that interval.",
          "**Shows a single value.** The number you see in the dashboard is always the single best value, not the sum.",
        ],
        es: [
          "**Identifica las superposiciones.** Para cada intervalo de tiempo, FitMesh Sync detecta cuántas fuentes registraron la misma métrica.",
          "**Elige la mejor fuente.** Entre las fuentes superpuestas, la app utiliza la que tiene el dato más completo o más preciso para ese intervalo.",
          "**Muestra un único valor.** El número que ves en el panel es siempre el mejor valor individual, no la suma.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Vuoi capire come gestiamo piu smartwatch nel dettaglio?",
        en: "Want to understand how we handle multiple smartwatches in detail?",
        es: "¿Quieres entender cómo gestionamos varios smartwatches en detalle?",
      },
      body: {
        it: "Abbiamo scritto una guida tecnica che spiega tutto il funzionamento: [come gestiamo piu smartwatch senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi). Trovi esempi concreti per ogni combinazione di dispositivi.",
        en: "We have written a technical guide that explains everything: [how we handle multiple smartwatches without double data](/en/blog/piu-smartwatch-insieme-dati-doppi). You will find concrete examples for each device combination.",
        es: "Hemos escrito una guía que explica todo el funcionamiento: [cómo gestionamos varios smartwatches sin datos duplicados](/es/blog/piu-smartwatch-insieme-dati-doppi). Encontrarás ejemplos concretos para cada combinación de dispositivos.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa cambia per chi ha un solo dispositivo",
        en: "What changes for single-device users",
        es: "Qué cambia si tienes un solo dispositivo",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se usi un solo wearable, la dashboard globale ti mostra semplicemente i tuoi dati con una vista piu pulita e coerente rispetto a prima. Non cambia nulla nella logica di raccolta, ma la presentazione e piu chiara: le metriche principali sono in evidenza, le tendenze settimanali e mensili sono piu leggibili.",
        en: "If you use a single wearable, the global dashboard simply shows you your data with a cleaner and more consistent view than before. Nothing changes in the collection logic, but the presentation is clearer: the main metrics are highlighted, weekly and monthly trends are more readable.",
        es: "Si usas un solo wearable, el panel global te muestra tus datos con una vista más limpia y coherente que antes. No cambia nada en la lógica de recopilación, pero la presentación es más clara: las métricas principales están destacadas y las tendencias semanales y mensuales son más fáciles de leer.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Esempi pratici di come funziona",
        en: "Practical examples of how it works",
        es: "Ejemplos prácticos de cómo funciona",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Smartwatch di giorno, anello di notte.** I passi durante il giorno arrivano dallo smartwatch. Il sonno viene dal Colmi ring. La dashboard li mostra entrambi senza che uno sovrascriva l'altro.",
          "**Due smartwatch contemporaneamente.** Se indossi entrambi nella stessa finestra, l'app usa i passi della fonte che ha prodotto il dato piu alto o piu completo per quell'ora, non la somma.",
          "**Cambio orologio a meta anno.** I dati del primo orologio per i mesi precedenti e del nuovo orologio per i mesi successivi appaiono come una linea continua nella vista storica.",
        ],
        en: [
          "**Smartwatch by day, ring by night.** Steps during the day come from the smartwatch. Sleep comes from the Colmi ring. The dashboard shows both without one overwriting the other.",
          "**Two smartwatches at the same time.** If you wear both in the same window, the app uses the steps from the source that produced the highest or most complete data for that hour, not the sum.",
          "**Watch change mid-year.** Data from the first watch for previous months and the new watch for subsequent months appear as a continuous line in the historical view.",
        ],
        es: [
          "**Smartwatch de día, anillo de noche.** Los pasos durante el día provienen del smartwatch. El sueño llega del anillo Colmi. El panel muestra ambos sin que uno sobreescriba al otro.",
          "**Dos smartwatches a la vez.** Si llevas los dos en la misma franja horaria, la app usa los pasos de la fuente que produjo el dato más alto o más completo para esa hora, no la suma.",
          "**Cambio de reloj a mitad de año.** Los datos del primer reloj en los meses anteriores y los del nuevo reloj en los meses siguientes aparecen como una línea continua en la vista histórica.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come accedere alla dashboard globale",
        en: "How to access the global dashboard",
        es: "Cómo acceder al panel global",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Aggiorna FitMesh Sync all'ultima versione. La dashboard globale appare automaticamente nella schermata principale se hai piu di un dispositivo collegato. Se hai un solo dispositivo, la trovi sotto la voce 'Vista globale' nel menu principale. Non serve configurare nulla: i dispositivi che hai gia collegato vengono unificati in automatico.",
        en: "Update FitMesh Sync to the latest version. The global dashboard appears automatically on the main screen if you have more than one device connected. If you have a single device, you find it under 'Global view' in the main menu. No configuration needed: the devices you have already connected are unified automatically.",
        es: "Actualiza FitMesh Sync a la última versión. El panel global aparece automáticamente en la pantalla principal si tienes más de un dispositivo conectado. Si tienes un solo dispositivo, lo encuentras en la opción 'Vista global' del menú principal. No necesitas configurar nada: los dispositivos que ya tienes conectados se unifican de forma automática.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Prova la dashboard multi dispositivo",
        en: "Try the multi device dashboard",
        es: "Prueba el panel multi dispositivo",
      },
      body: {
        it: "Entra nella beta e collega tutti i tuoi wearable. La dashboard globale li unisce subito, senza doppioni e senza configurazioni manuali.",
        en: "Join the beta and connect all your wearables. The global dashboard unifies them right away, with no duplicates and no manual configuration.",
        es: "Únete a la beta y conecta todos tus wearables. El panel global los unifica de inmediato, sin duplicados y sin configuraciones manuales.",
      },
      ctaLabel: {
        it: "Inizia la beta gratuita",
        en: "Start the free beta",
        es: "Empieza la beta gratis",
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
        it: "Se cambio ordine di priorita tra i dispositivi, i dati storici cambiano?",
        en: "If I change the priority order between devices, does historical data change?",
        es: "Si cambio el orden de prioridad entre los dispositivos, ¿cambian los datos históricos?",
      },
      a: {
        it: "Si, la dashboard viene ricalcolata in base alle preferenze aggiornate. I dati originali di ogni dispositivo restano intatti: cambia solo quale valore viene mostrato quando ci sono sovrapposizioni. Puoi cambiare le priorita in qualsiasi momento dalle impostazioni dispositivi.",
        en: "Yes, the dashboard is recalculated based on updated preferences. The original data from each device remains intact: only which value is shown changes when there are overlaps. You can change priorities at any time from device settings.",
        es: "Sí, el panel se recalcula según las preferencias actualizadas. Los datos originales de cada dispositivo permanecen intactos: solo cambia qué valor se muestra cuando hay superposiciones. Puedes cambiar las prioridades en cualquier momento desde los ajustes de dispositivos.",
      },
    },
    {
      q: {
        it: "Posso vedere anche i dati delle singole sorgenti, non solo la vista unificata?",
        en: "Can I also see individual source data, not just the unified view?",
        es: "¿Puedo ver también los datos de cada fuente por separado, no solo la vista unificada?",
      },
      a: {
        it: "Si. Nella dashboard globale trovi un selettore che ti permette di passare dalla vista unificata alla vista per sorgente. In questo modo puoi confrontare i dati dispositivo per dispositivo e capire eventuali differenze tra un orologio e l'altro.",
        en: "Yes. In the global dashboard you find a selector that lets you switch from the unified view to the per-source view. This way you can compare device-by-device data and understand any differences between one watch and another.",
        es: "Sí. En el panel global hay un selector que te permite pasar de la vista unificada a la vista por fuente. Así puedes comparar los datos dispositivo a dispositivo y entender las posibles diferencias entre un reloj y otro.",
      },
    },
    {
      q: {
        it: "La dashboard funziona anche se uso Health Connect su Android o Apple Salute su iPhone?",
        en: "Does the dashboard work even if I use Health Connect on Android or Apple Health on iPhone?",
        es: "¿El panel funciona aunque use Health Connect en Android o Apple Salud en iPhone?",
      },
      a: {
        it: "Si. FitMesh Sync legge da Health Connect (Android) e da Apple Salute (iPhone) come sorgenti aggiuntive, e le include nella logica di deduplicazione. Anche i dati che arrivano da quelle piattaforme vengono confrontati con quelli dei dispositivi diretti e unificati nella vista globale.",
        en: "Yes. FitMesh Sync reads from Health Connect (Android) and Apple Health (iPhone) as additional sources, and includes them in the deduplication logic. Even data coming from those platforms is compared with data from direct devices and unified in the global view.",
        es: "Sí. FitMesh Sync lee de Health Connect (Android) y de Apple Salud (iPhone) como fuentes adicionales, y las incluye en la lógica de eliminación de duplicados. Los datos que llegan de esas plataformas también se comparan con los de los dispositivos directos y se unifican en la vista global.",
      },
    },
  ],
  related: ["piu-smartwatch-insieme-dati-doppi", "colmi-ring-fitmesh"],
};
