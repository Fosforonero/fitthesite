import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "novita-fonte-del-dato",
  category: "news",
  publishedAt: "2026-06-14",
  updatedAt: "2026-06-14",
  ldType: "BlogPosting",
  readMinutes: 4,
  primaryKeyword: {
    it: "da quale dispositivo arrivano i dati",
    en: "which device your data comes from",
    es: "de qué dispositivo provienen tus datos",
  },
  secondaryKeywords: {
    it: [
      "fonte dei dati salute",
      "orologio e anello insieme",
      "passi contati una volta sola",
      "FitMesh Sync trasparenza dati",
      "unire dati wearable senza doppioni",
    ],
    en: [
      "health data source",
      "watch and ring together",
      "steps counted only once",
      "FitMesh Sync data transparency",
      "merge wearable data without duplicates",
    ],
  },
  metaDescription: {
    it: "FitMesh Sync ora mostra da quale dispositivo arriva ogni dato salute: orologio, anello o altro. Una vista unica, senza doppioni, sempre chiara su chi misura cosa.",
    en: "FitMesh Sync now shows which device each health metric comes from: watch, ring or other. One clear view, no duplicates, always transparent about the source.",
    es: "FitMesh Sync ahora muestra de qué dispositivo proviene cada dato de salud: reloj, anillo u otro. Una vista única, sin duplicados, siempre clara sobre quién mide qué.",
  },
  tldr: {
    it: [
      "Ogni metrica ora puo mostrare da dove arriva, per esempio 'Fonte: anello' sotto il Sonno.",
      "Se indossi orologio e anello insieme, i passi non vengono contati due volte.",
      "Quando un dispositivo e in carica, un altro copre quel periodo senza lasciare buchi.",
      "Funziona allo stesso modo su Android e iPhone, senza configurare nulla.",
    ],
    en: [
      "Each metric can now show where it comes from, for example 'Source: ring' under Sleep.",
      "If you wear a watch and a ring together, your steps are not counted twice.",
      "When one device is charging, another covers that window with no gaps.",
      "It works the same way on Android and iPhone, with nothing to configure.",
    ],
    es: [
      "Cada métrica ahora puede mostrar de dónde proviene, por ejemplo 'Fuente: anillo' bajo el Sueño.",
      "Si llevas reloj y anillo a la vez, los pasos no se cuentan dos veces.",
      "Cuando un dispositivo está cargando, otro cubre ese periodo sin dejar huecos.",
      "Funciona igual en Android y en iPhone, sin necesidad de configurar nada.",
    ],
  },
  hero: {
    kicker: { it: "Novità", en: "What's New", es: "Novedades" },
    title: {
      it: "Ora sai da quale dispositivo arriva ogni dato",
      en: "Now you know which device each metric comes from",
      es: "Ahora sabes de qué dispositivo proviene cada dato",
    },
    subtitle: {
      it: "Orologio, anello e altri dispositivi nella stessa schermata, con l'indicazione chiara di chi ha misurato cosa. Una vista unica, senza conteggi doppi.",
      en: "Watch, ring and other devices in one screen, with a clear label of which one measured what. One view, no double counting.",
      es: "Reloj, anillo y otros dispositivos en una sola pantalla, con la indicación clara de cuál midió qué. Una vista única, sin conteos dobles.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "In FitMesh Sync i tuoi dispositivi lavorano insieme: orologio, anello e altri wearable confluiscono in un'unica schermata. Da oggi c'e una cosa in piu: vedi con chiarezza da quale dispositivo arriva ogni dato.",
        en: "In FitMesh Sync your devices work together: watch, ring and other wearables flow into one screen. From today there is something more: you can clearly see which device each metric comes from.",
        es: "En FitMesh Sync tus dispositivos trabajan juntos: reloj, anillo y otros wearables se reúnen en una sola pantalla. A partir de hoy hay algo más: puedes ver con claridad de qué dispositivo proviene cada dato.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Vedi la fonte di ogni dato",
        en: "See the source of each metric",
        es: "Ve la fuente de cada dato",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Sotto le metriche della giornata puo comparire una piccola etichetta, per esempio 'Fonte: anello' sotto il Sonno. Vuol dire che quel valore lo ha misurato l'anello, non l'orologio. Quando un dato arriva dal dispositivo che porti sempre al polso non serve dirlo, quindi l'etichetta compare solo quando e utile saperlo.",
        en: "Under the metrics for the day a small label can appear, for example 'Source: ring' under Sleep. It means that value was measured by the ring, not the watch. When a metric comes from the device you always wear there is no need to say it, so the label only shows up when it is useful to know.",
        es: "Bajo las métricas del día puede aparecer una pequeña etiqueta, por ejemplo 'Fuente: anillo' bajo el Sueño. Significa que ese valor lo midió el anillo, no el reloj. Cuando un dato proviene del dispositivo que siempre llevas puesto no hace falta indicarlo, por eso la etiqueta aparece solo cuando es útil saberlo.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Niente conteggi doppi",
        en: "No double counting",
        es: "Sin conteos dobles",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se indossi piu dispositivi nello stesso momento, contano gli stessi passi reali. FitMesh Sync non li somma: tiene il quadro corretto della tua giornata, senza gonfiare i numeri.",
        en: "If you wear multiple devices at the same time, they count the same real steps. FitMesh Sync does not add them up: it keeps the correct picture of your day, without inflating the numbers.",
        es: "Si llevas varios dispositivos al mismo tiempo, todos cuentan los mismos pasos reales. FitMesh Sync no los suma: mantiene el cuadro correcto de tu día, sin inflar los números.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Vuoi capire come gestiamo piu dispositivi nel dettaglio?",
        en: "Want to understand how we handle multiple devices in detail?",
        es: "¿Quieres entender cómo gestionamos varios dispositivos en detalle?",
      },
      body: {
        it: "Abbiamo una guida dedicata che spiega tutto, con esempi per ogni combinazione: [piu smartwatch insieme senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi).",
        en: "We have a dedicated guide that explains everything, with examples for each combination: [multiple smartwatches together without double data](/en/blog/piu-smartwatch-insieme-dati-doppi).",
        es: "Tenemos una guía dedicada que explica todo, con ejemplos para cada combinación: [varios smartwatches a la vez sin datos duplicados](/es/blog/piu-smartwatch-insieme-dati-doppi).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Orologio in carica? Ci pensa un altro dispositivo",
        en: "Watch charging? Another device covers it",
        es: "¿Reloj cargando? Otro dispositivo lo cubre",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Capita di lasciare l'orologio in carica per qualche ora. In quel periodo, se indossi l'anello, e lui a tenere il conto. Quando guardi la giornata, le ore coperte da dispositivi diversi si uniscono in un quadro unico, senza buchi e senza doppioni.",
        en: "It happens to leave the watch charging for a few hours. During that time, if you wear the ring, the ring keeps count. When you look at your day, the hours covered by different devices come together into one picture, with no gaps and no duplicates.",
        es: "A veces dejas el reloj cargando durante unas horas. En ese tiempo, si llevas el anillo, es él quien lleva la cuenta. Cuando consultas tu día, las horas cubiertas por distintos dispositivos se unen en un cuadro único, sin huecos y sin duplicados.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Lo stesso su Android e iPhone",
        en: "The same on Android and iPhone",
        es: "Lo mismo en Android y en iPhone",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Che tu usi un telefono Android o un iPhone, il comportamento e identico: i dati dei tuoi dispositivi si uniscono nella stessa vista, con la stessa trasparenza sulla fonte. Se usi entrambi, trovi qualche dettaglio in piu nella pagina dedicata ai [due telefoni sullo stesso account](/it/lp/due-telefoni).",
        en: "Whether you use an Android phone or an iPhone, the behavior is identical: your devices' data come together in the same view, with the same transparency about the source. If you use both, you can find more details on the page about [two phones on the same account](/en/lp/due-telefoni).",
        es: "Tanto si usas un teléfono Android como un iPhone, el comportamiento es idéntico: los datos de tus dispositivos se unen en la misma vista, con la misma transparencia sobre la fuente. Si usas ambos, encontrarás más detalles en la página sobre [dos teléfonos en la misma cuenta](/es/lp/due-telefoni).",
      },
    },
    {
      type: "cta",
      title: {
        it: "Provalo con i tuoi dispositivi",
        en: "Try it with your devices",
        es: "Pruébalo con tus dispositivos",
      },
      body: {
        it: "Entra nella beta, collega orologio e anello e guarda la giornata unita in un solo posto, con la fonte di ogni dato sempre chiara.",
        en: "Join the beta, connect your watch and ring, and see your day brought together in one place, with the source of each metric always clear.",
        es: "Únete a la beta, conecta tu reloj y tu anillo, y ve cómo tu día se reúne en un solo lugar, con la fuente de cada dato siempre clara.",
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
        it: "Perche alcune metriche mostrano la fonte e altre no?",
        en: "Why do some metrics show the source and others do not?",
        es: "¿Por qué algunas métricas muestran la fuente y otras no?",
      },
      a: {
        it: "L'etichetta appare solo quando il dato arriva da un dispositivo diverso da quello che indossi di solito, cosi resta un'informazione utile e non rumore. Quando il dato arriva dal dispositivo principale, l'etichetta non serve.",
        en: "The label only appears when the metric comes from a device different from the one you usually wear, so it stays useful information and not noise. When the metric comes from your main device, the label is not needed.",
        es: "La etiqueta aparece solo cuando el dato proviene de un dispositivo distinto al que llevas normalmente, para que sea información útil y no ruido. Cuando el dato proviene de tu dispositivo principal, la etiqueta no es necesaria.",
      },
    },
    {
      q: {
        it: "Se ho orologio e anello, i passi si sommano?",
        en: "If I have a watch and a ring, are steps added up?",
        es: "Si tengo reloj y anillo, ¿los pasos se suman?",
      },
      a: {
        it: "No. Contano gli stessi passi reali, quindi FitMesh Sync li unisce senza raddoppiarli. Il numero che vedi e il quadro corretto della giornata, non la somma dei dispositivi.",
        en: "No. They count the same real steps, so FitMesh Sync brings them together without doubling them. The number you see is the correct picture of your day, not the sum of the devices.",
        es: "No. Cuentan los mismos pasos reales, así que FitMesh Sync los une sin duplicarlos. El número que ves es el cuadro correcto de tu día, no la suma de los dispositivos.",
      },
    },
    {
      q: {
        it: "Funziona se uso due telefoni, Android e iPhone?",
        en: "Does it work if I use two phones, Android and iPhone?",
        es: "¿Funciona si uso dos teléfonos, Android e iPhone?",
      },
      a: {
        it: "Si. I dati confluiscono nello stesso account e si uniscono nella stessa vista, con la fonte di ogni metrica indicata dove serve.",
        en: "Yes. The data flow into the same account and come together in the same view, with the source of each metric shown where it helps.",
        es: "Sí. Los datos fluyen hacia la misma cuenta y se unen en la misma vista, con la fuente de cada métrica indicada donde corresponde.",
      },
    },
    {
      q: {
        it: "Devo configurare qualcosa?",
        en: "Do I need to configure anything?",
        es: "¿Tengo que configurar algo?",
      },
      a: {
        it: "No. Basta avere i dispositivi collegati: l'unione dei dati e l'indicazione della fonte sono automatiche.",
        en: "No. Just have your devices connected: merging the data and showing the source happen automatically.",
        es: "No. Solo tienes que tener los dispositivos conectados: la unión de los datos y la indicación de la fuente son automáticas.",
      },
    },
  ],
  related: [
    "piu-smartwatch-insieme-dati-doppi",
    "sync-them-all",
    "colmi-ring-fitmesh",
    "anello-vs-smartwatch",
  ],
};
