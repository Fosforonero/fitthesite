import type { BlogPost } from "../types";

/**
 * Pillar manifesto: un account FitMesh per unire ogni wearable in una dashboard
 * cross-device (Android + iPhone in arrivo). Messaggio brand fondativo.
 * Target: utenti multi-device che cercano un'alternativa agli ecosistemi chiusi.
 */
export const post: BlogPost = {
  slug: "sync-them-all",
  category: "ecosystem",
  publishedAt: "2026-06-13",
  updatedAt: "2026-06-14",
  readMinutes: 6,
  ldType: "Article",

  hero: {
    kicker: {
      it: "Manifesto",
      en: "Manifesto",
      es: "Manifiesto",
    },
    title: {
      it: "Un'app per sincronizzarli tutti: la dashboard che unisce ogni wearable",
      en: "One app to sync them all: the dashboard that unifies every wearable",
      es: "Una app para sincronizarlos todos: el panel que une cada wearable",
    },
    subtitle: {
      it: "Galaxy Watch, anello smart, Garmin, fascia cardio: i tuoi dati salute sono sparsi in app diverse. FitMesh li unisce in un'unica dashboard, senza doppi conteggi, su Android e iPhone.",
      en: "Galaxy Watch, smart ring, Garmin, chest strap: your health data is scattered across apps. FitMesh unifies it in one dashboard, no double counting, on Android and iPhone.",
      es: "Galaxy Watch, anillo inteligente, Garmin, banda cardíaca: tus datos de salud están repartidos entre distintas apps. FitMesh los reúne en un único panel, sin dobles conteos, en Android e iPhone.",
    },
  },

  metaDescription: {
    it: "I tuoi wearable vivono in silos separati. FitMesh Sync li riunisce in un'unica dashboard cross-device: un account, ogni smartwatch e anello smart, niente doppi conteggi.",
    en: "Your wearables live in separate silos. FitMesh Sync brings them together in one cross-device dashboard: one account, every smartwatch and smart ring, no double counting.",
    es: "Tus wearables viven en silos separados. FitMesh Sync los reúne en un panel multidispositivo: una cuenta, cada smartwatch y anillo inteligente, sin dobles conteos.",
  },

  primaryKeyword: {
    it: "app sincronizzazione wearable",
    en: "sync all wearables app",
    es: "app sincronización wearables",
  },

  secondaryKeywords: {
    it: [
      "dashboard wearable unica",
      "unire dati smartwatch",
      "sincronizzare piu smartwatch",
      "app per tutti i wearable",
      "app salute multi-device",
      "fusione dati wearable",
      "un account per tutti i dispositivi salute",
    ],
    en: [
      "unified health dashboard",
      "combine smartwatch data",
      "one app for all wearables",
      "multi-device health app",
      "merge wearable data",
      "health data hub",
      "one account all health devices",
    ],
  },

  tldr: {
    it: [
      "I tuoi wearable parlano ecosistemi diversi: FitMesh li unisce in un'unica dashboard senza che tu debba scegliere un solo device.",
      "Un account FitMesh funziona su Android e iPhone (iOS in arrivo), con ponte opzionale verso Apple Salute.",
      "Fusione intelligente: per ogni metrica e ogni finestra di tempo viene scelta la fonte migliore, mai la somma di due.",
      "Piu dispositivi colleghi, piu la dashboard si completa: ogni device accende sezioni che prima erano vuote.",
      "Dati su server europei, mai condivisi con terzi, conformita GDPR completa.",
    ],
    en: [
      "Your wearables speak different ecosystems: FitMesh merges them into one dashboard without forcing you to pick a single device.",
      "One FitMesh account works on Android and iPhone (iOS coming soon), with optional Apple Health bridge.",
      "Smart fusion: for each metric and each time window the best source is chosen, never the sum of two.",
      "The more devices you connect, the more complete your dashboard gets: each device lights up sections that were empty before.",
      "Data on European servers, never shared with third parties, full GDPR compliance.",
    ],
    es: [
      "Tus wearables hablan ecosistemas distintos: FitMesh los unifica en un solo panel sin que tengas que elegir un único dispositivo.",
      "Una cuenta de FitMesh funciona en Android e iPhone (iOS próximamente), con puente opcional hacia Apple Salute.",
      "Fusión inteligente: para cada métrica y cada franja horaria se elige la mejor fuente, nunca la suma de dos.",
      "Cuantos más dispositivos conectes, más completo estará tu panel: cada dispositivo activa secciones que antes estaban vacías.",
      "Datos en servidores europeos, nunca compartidos con terceros, pleno cumplimiento del GDPR.",
    ],
  },

  body: [
    {
      type: "paragraph",
      text: {
        it: "I tuoi dati di salute sono prigionieri. Il Galaxy Watch li tiene in Samsung Health, l'anello smart nella sua app, il Garmin in Garmin Connect, la fascia cardio in un'altra ancora. Ogni ecosistema vede solo se stesso, e tu salti tra cinque app per capire come stai davvero. **FitMesh esiste per questo: un'app per sincronizzarli tutti.**",
        en: "Your health data is trapped. The Galaxy Watch keeps it in Samsung Health, the smart ring in its own app, the Garmin in Garmin Connect, the chest strap somewhere else again. Every ecosystem sees only itself, and you hop between five apps to understand how you're actually doing. **That's why FitMesh exists: one app to sync them all.**",
        es: "Tus datos de salud están atrapados. El Galaxy Watch los guarda en Samsung Health, el anillo inteligente en su propia app, el Garmin en Garmin Connect, la banda cardíaca en otro sitio distinto. Cada ecosistema solo se ve a sí mismo, y tú saltas entre cinco apps para entender cómo estás de verdad. **Por eso existe FitMesh: una app para sincronizarlos todos.**",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Non e uno slogan. E letteralmente l'architettura del prodotto: una dashboard che raccoglie i dati da ogni dispositivo che indossi e li unisce in una sola vista coerente, senza doppioni e senza che tu debba scegliere un solo device a cui essere fedele.",
        en: "It's not a slogan. It's literally the product architecture: a dashboard that pulls data from every device you wear and merges it into one coherent view, no duplicates, without forcing you to stay loyal to a single device.",
        es: "No es un eslogan. Es literalmente la arquitectura del producto: un panel que recoge los datos de cada dispositivo que llevas puesto y los fusiona en una sola vista coherente, sin duplicados y sin que tengas que ser fiel a un único dispositivo.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "Il problema: una vita, cinque app",
        en: "The problem: one life, five apps",
        es: "El problema: una vida, cinco apps",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Chi usa piu di un wearable lo sa: nessun produttore ti mostra il quadro completo. Samsung non legge il Garmin. Garmin non sa nulla del tuo anello. L'anello ignora la fascia cardio. Ognuno e bravissimo nel suo dominio e cieco su tutto il resto.",
        en: "Anyone who owns more than one wearable knows it: no manufacturer shows you the full picture. Samsung doesn't read your Garmin. Garmin knows nothing about your ring. The ring ignores the chest strap. Each is excellent in its own domain and blind to everything else.",
        es: "Quien usa más de un wearable lo sabe: ningún fabricante te muestra el panorama completo. Samsung no lee el Garmin. Garmin no sabe nada de tu anillo. El anillo ignora la banda cardíaca. Cada uno es excelente en su dominio y ciego ante todo lo demás.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il risultato e una giornata spezzata in silos: i passi di qui, il sonno di la, gli allenamenti in un terzo posto. Per vedere un trend reale dovresti tenere a mente numeri da app diverse, e nessuno lo fa davvero.",
        en: "The result is a day split into silos: steps over here, sleep over there, workouts in a third place. To see a real trend you'd have to keep numbers from different apps in your head, and nobody actually does.",
        es: "El resultado es un día fragmentado en silos: los pasos aquí, el sueño allá, los entrenamientos en un tercer lugar. Para ver una tendencia real tendrías que recordar cifras de distintas apps, y nadie lo hace de verdad.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "La soluzione: un hub che parla con tutti",
        en: "The solution: a hub that talks to everything",
        es: "La solución: un hub que habla con todos",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh si mette al centro. Legge i dati da Health Connect (Galaxy Watch, Pixel Watch, Fitbit e qualsiasi wearable compatibile), dai provider cloud come Garmin e Suunto, e direttamente via Bluetooth dagli anelli smart come i Colmi R02/R03. Tutto confluisce in **una dashboard sola**, accessibile dallo stesso account su [Android e iPhone insieme](/it/lp/due-telefoni) (l'app iOS e in arrivo, lancio imminente).",
        en: "FitMesh sits in the middle. It reads data from Health Connect (Galaxy Watch, Pixel Watch, Fitbit and any compatible wearable), from cloud providers like Garmin and Suunto, and directly over Bluetooth from smart rings such as the Colmi R02/R03. Everything flows into **one single dashboard**, accessible from the same account on [Android and iPhone together](/en/lp/due-telefoni) (the iOS app is coming soon, launch imminent).",
        es: "FitMesh se sitúa en el centro. Lee los datos de Health Connect (Galaxy Watch, Pixel Watch, Fitbit y cualquier wearable compatible), de proveedores en la nube como Garmin y Suunto, y directamente por Bluetooth de anillos inteligentes como los Colmi R02/R03. Todo confluye en **un único panel**, accesible desde la misma cuenta en [Android e iPhone juntos](/es/lp/due-telefoni) (la app para iOS está próximamente disponible, lanzamiento inminente).",
      },
    },
    {
      type: "table",
      caption: {
        it: "Ogni tipo di device copre un ruolo specifico: FitMesh unisce tutto",
        en: "Each device type covers a specific role: FitMesh brings them all together",
        es: "Cada tipo de dispositivo cubre un rol específico: FitMesh los une a todos",
      },
      headers: {
        it: ["Dispositivo", "Specialista di", "Quando ti copre"],
        en: ["Device", "Specialist in", "When it covers you"],
        es: ["Dispositivo", "Especialista en", "Cuándo te cubre"],
      },
      rows: [
        {
          it: ["Smartwatch (Galaxy, Pixel, Apple)", "Vita quotidiana, attivita, sport", "Tutto il giorno"],
          en: ["Smartwatch (Galaxy, Pixel, Apple)", "Daily life, activity, sport", "All day"],
          es: ["Smartwatch (Galaxy, Pixel, Apple)", "Vida cotidiana, actividad, deporte", "Todo el día"],
        },
        {
          it: ["Anello smart", "Sonno, recupero, battito a riposo", "La notte e quando il watch e in carica"],
          en: ["Smart ring", "Sleep, recovery, resting heart rate", "At night and when the watch is charging"],
          es: ["Anillo inteligente", "Sueño, recuperación, frecuencia cardíaca en reposo", "Por la noche y cuando el reloj está cargando"],
        },
        {
          it: ["Sportwatch (Garmin, Suunto)", "Allenamenti, GPS, VO2max", "Durante gare e sessioni"],
          en: ["Sportwatch (Garmin, Suunto)", "Workouts, GPS, VO2max", "During races and sessions"],
          es: ["Sportwatch (Garmin, Suunto)", "Entrenamientos, GPS, VO2max", "Durante carreras y sesiones"],
        },
        {
          it: ["Fascia cardio", "Battito durante lo sforzo", "Negli allenamenti specifici"],
          en: ["Chest strap", "Heart rate under effort", "In specific workouts"],
          es: ["Banda cardíaca", "Frecuencia cardíaca durante el esfuerzo", "En entrenamientos específicos"],
        },
      ],
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "La parte difficile: unire senza fare confusione",
        en: "The hard part: merging without confusion",
        es: "La parte difícil: unir sin crear confusión",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Mettere insieme cinque fonti e facile a parole. La sfida vera e non sommare due volte gli stessi passi quando hai watch e anello al polso nella stessa ora. FitMesh non somma alla cieca: per ogni metrica e ogni momento sceglie **la fonte migliore**, non tutte insieme.",
        en: "Combining five sources is easy to say. The real challenge is not counting the same steps twice when you wear both watch and ring in the same hour. FitMesh doesn't sum blindly: for each metric and each moment it picks **the best source**, not all of them at once.",
        es: "Combinar cinco fuentes es fácil de decir. El verdadero reto es no contar los mismos pasos dos veces cuando llevas el reloj y el anillo a la vez durante la misma hora. FitMesh no suma a ciegas: para cada métrica y cada momento elige **la mejor fuente**, no todas a la vez.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Il principio in una frase",
        en: "The principle in one line",
        es: "El principio en una frase",
      },
      body: {
        it: "**Unione prima, conflitto poi.** Se una metrica la fornisce un solo dispositivo, si prende e basta: e cosi che l'anello accende metriche come lo stress o l'HRV notturno che lo smartwatch non misura. Se invece due dispositivi misurano la stessa cosa nello stesso momento, vince lo specialista per quel dominio: il sonno dall'anello, l'allenamento dallo sportwatch, i passi della giornata dal watch.",
        en: "**Union first, conflict second.** If a metric comes from a single device, it's taken as-is: that's how the ring lights up metrics like stress or nighttime HRV that the smartwatch doesn't measure. If two devices measure the same thing at the same time, the specialist for that domain wins: sleep from the ring, the workout from the sportwatch, the day's steps from the watch.",
        es: "**Unión primero, conflicto después.** Si una métrica la proporciona un solo dispositivo, se toma tal cual: así es como el anillo activa métricas como el estrés o el HRV nocturno que el smartwatch no mide. Si dos dispositivos miden lo mismo al mismo tiempo, gana el especialista en ese dominio: el sueño del anillo, el entrenamiento del sportwatch, los pasos del día del reloj.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La conseguenza e la cosa piu bella: **piu dispositivi colleghi, piu la tua dashboard si completa.** Ogni device aggiunto non si limita a migliorare un numero, accende sezioni che prima erano vuote.",
        en: "And here's the best consequence: **the more devices you connect, the more complete your dashboard gets.** Every device you add doesn't just improve a number, it lights up sections that were empty before.",
        es: "Y esta es la mejor consecuencia: **cuantos más dispositivos conectes, más completo estará tu panel.** Cada dispositivo que añades no solo mejora un número, también activa secciones que antes estaban vacías.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "Una giornata, una timeline continua",
        en: "One day, one continuous timeline",
        es: "Un día, una línea de tiempo continua",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Ecco come FitMesh ricompone una giornata reale di chi usa piu device:",
        en: "Here's how FitMesh reassembles a real day for someone who uses multiple devices:",
        es: "Así recompone FitMesh un día real de alguien que usa varios dispositivos:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Notte** -- dormi con l'anello, il watch e in carica: sonno, HRV e battito a riposo arrivano dall'anello.",
          "**Giorno** -- il watch al polso conta passi, calorie e battito.",
          "**Allenamento** -- il Garmin con la fascia registra la corsa: GPS, ritmo e battito precisi, presi come sessione unica.",
          "**Sera** -- di nuovo il watch per i passi fino a fine giornata.",
        ],
        en: [
          "**Night** -- you sleep with the ring, the watch is charging: sleep, HRV and resting heart rate come from the ring.",
          "**Day** -- the watch on your wrist counts steps, calories and heart rate.",
          "**Workout** -- the Garmin with the chest strap records the run: precise GPS, pace and heart rate, taken as a single session.",
          "**Evening** -- the watch again for steps until the end of the day.",
        ],
        es: [
          "**Noche** -- duermes con el anillo, el reloj está cargando: el sueño, el HRV y la frecuencia cardíaca en reposo vienen del anillo.",
          "**Día** -- el reloj en la muñeca cuenta pasos, calorías y frecuencia cardíaca.",
          "**Entrenamiento** -- el Garmin con la banda cardíaca registra la carrera: GPS, ritmo y frecuencia cardíaca precisos, tomados como una única sesión.",
          "**Tarde** -- de nuevo el reloj para los pasos hasta el final del día.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Nessun buco, nessun doppione. Una sola linea continua, indipendentemente da cosa avevi addosso in quel momento. E questo che intendiamo con *un'app per sincronizzarli tutti*.",
        en: "No gaps, no duplicates. One continuous line, regardless of what you were wearing at any given moment. That's what we mean by *one app to sync them all*.",
        es: "Sin huecos, sin duplicados. Una sola línea continua, independientemente de lo que llevaras puesto en cada momento. Eso es lo que queremos decir con *una app para sincronizarlos todos*.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "Un account, Android e iPhone",
        en: "One account, Android and iPhone",
        es: "Una cuenta, Android e iPhone",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync e disponibile su Android con Health Connect integrato. L'app iPhone e in fase di rilascio imminente: con lo stesso account potrai vedere la tua dashboard su entrambi i telefoni, con ponte opzionale verso Apple Salute per chi vuole portare i dati anche nell'ecosistema Apple. [Android e iPhone insieme](/it/lp/due-telefoni): un solo account, una sola storia di salute.",
        en: "FitMesh Sync is available on Android with Health Connect integrated. The iPhone app is launching imminently: with the same account you'll be able to view your dashboard on both phones, with an optional bridge to Apple Health for those who want to bring data into the Apple ecosystem too. [Android and iPhone together](/en/lp/due-telefoni): one account, one health history.",
        es: "FitMesh Sync está disponible en Android con Health Connect integrado. La app para iPhone está a punto de lanzarse: con la misma cuenta podrás ver tu panel en ambos teléfonos, con un puente opcional hacia Apple Salute para quienes quieran llevar los datos también al ecosistema Apple. [Android e iPhone juntos](/es/lp/due-telefoni): una sola cuenta, una sola historia de salud.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "Privacy: i tuoi dati restano tuoi",
        en: "Privacy: your data stays yours",
        es: "Privacidad: tus datos siguen siendo tuyos",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Unire tutto in un posto solo ha senso solo se quel posto e sicuro. I dati salute di FitMesh vivono su server europei, sono accessibili solo a te tramite il tuo account, non vengono mai venduti ne condivisi con terze parti, e non c'e alcun tracker pubblicitario. La cancellazione di account e dati avviene entro 48 ore, come previsto dal GDPR.",
        en: "Bringing everything into one place only makes sense if that place is secure. FitMesh's health data lives on European servers, is accessible only to you through your account, is never sold or shared with third parties, and there are no ad trackers. Account and data deletion happens within 48 hours, as required by GDPR.",
        es: "Reunir todo en un solo lugar solo tiene sentido si ese lugar es seguro. Los datos de salud de FitMesh viven en servidores europeos, son accesibles únicamente a través de tu cuenta, nunca se venden ni se comparten con terceros, y no hay ningún rastreador publicitario. La eliminación de cuenta y datos se realiza en un plazo de 48 horas, según lo exige el GDPR.",
      },
    },

    {
      type: "cta",
      title: {
        it: "Sei tra i primi 1000?",
        en: "Among the first 1000?",
        es: "¿Estás entre los primeros 1000?",
      },
      body: {
        it: "FitMesh Sync e in beta privata. Crea l'account e il primo anno di Pro e in regalo, si attiva da solo. Porta tutti i tuoi dispositivi in un'unica dashboard.",
        en: "FitMesh Sync is in private beta. Create your account and your first year of Pro is on us, it activates automatically. Bring all your devices into one dashboard.",
        es: "FitMesh Sync está en beta privada. Crea tu cuenta y el primer año de Pro es un regalo que se activa solo. Lleva todos tus dispositivos a un único panel.",
      },
      ctaLabel: {
        it: "Diventa founder",
        en: "Become a founder",
        es: "Conviértete en founder",
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
        it: "Quali dispositivi posso collegare a FitMesh?",
        en: "Which devices can I connect to FitMesh?",
        es: "¿Qué dispositivos puedo conectar a FitMesh?",
      },
      a: {
        it: "Qualsiasi wearable compatibile con Health Connect (Galaxy Watch, Pixel Watch, Fitbit e altri), i provider cloud come Garmin e Suunto, e gli anelli smart Colmi R02/R03 via Bluetooth diretto. La lista completa e nella pagina [integrazioni](/integrations).",
        en: "Any Health Connect-compatible wearable (Galaxy Watch, Pixel Watch, Fitbit and others), cloud providers like Garmin and Suunto, and Colmi R02/R03 smart rings over direct Bluetooth. The full list is on the [integrations](/integrations) page.",
        es: "Cualquier wearable compatible con Health Connect (Galaxy Watch, Pixel Watch, Fitbit y otros), proveedores en la nube como Garmin y Suunto, y los anillos inteligentes Colmi R02/R03 por Bluetooth directo. La lista completa está en la página de [integraciones](/integrations).",
      },
    },
    {
      q: {
        it: "FitMesh somma i passi di due dispositivi insieme?",
        en: "Does FitMesh add up steps from two devices?",
        es: "¿FitMesh suma los pasos de dos dispositivos?",
      },
      a: {
        it: "No. Per ogni metrica e ogni finestra di tempo sceglie una sola fonte, mai la somma. E la regola che evita i doppi conteggi quando indossi piu device contemporaneamente.",
        en: "No. For each metric and each time window it picks a single source, never the sum. That's the rule that avoids double counting when you wear several devices at once.",
        es: "No. Para cada métrica y cada franja horaria elige una única fuente, nunca la suma. Es la regla que evita los dobles conteos cuando llevas varios dispositivos a la vez.",
      },
    },
    {
      q: {
        it: "FitMesh funziona anche su iPhone?",
        en: "Does FitMesh work on iPhone too?",
        es: "¿FitMesh funciona también en iPhone?",
      },
      a: {
        it: "L'app iOS e in rilascio imminente. Con lo stesso account FitMesh potrai accedere alla tua dashboard su Android e iPhone, con ponte opzionale verso Apple Salute. Iscriviti alla beta per essere tra i primi ad accedervi.",
        en: "The iOS app is launching imminently. With the same FitMesh account you'll be able to access your dashboard on Android and iPhone, with an optional bridge to Apple Health. Sign up for the beta to be among the first to access it.",
        es: "La app para iOS está a punto de lanzarse. Con la misma cuenta de FitMesh podrás acceder a tu panel en Android e iPhone, con un puente opcional hacia Apple Salute. Suscríbete a la beta para ser de los primeros en acceder.",
      },
    },
  ],

  related: [
    "novita-fonte-del-dato",
    "colmi-ring-fitmesh",
    "piu-smartwatch-insieme-dati-doppi",
    "anello-vs-smartwatch",
  ],

  brandsMentioned: [
    "Samsung",
    "Garmin",
    "Suunto",
    "Fitbit",
    "Colmi",
    "Google",
    "Apple",
  ],
};
