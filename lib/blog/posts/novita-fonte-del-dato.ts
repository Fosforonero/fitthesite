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
  },
  hero: {
    kicker: { it: "Novità", en: "What's New" },
    title: {
      it: "Ora sai da quale dispositivo arriva ogni dato",
      en: "Now you know which device each metric comes from",
    },
    subtitle: {
      it: "Orologio, anello e altri dispositivi nella stessa schermata, con l'indicazione chiara di chi ha misurato cosa. Una vista unica, senza conteggi doppi.",
      en: "Watch, ring and other devices in one screen, with a clear label of which one measured what. One view, no double counting.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "In FitMesh Sync i tuoi dispositivi lavorano insieme: orologio, anello e altri wearable confluiscono in un'unica schermata. Da oggi c'e una cosa in piu: vedi con chiarezza da quale dispositivo arriva ogni dato.",
        en: "In FitMesh Sync your devices work together: watch, ring and other wearables flow into one screen. From today there is something more: you can clearly see which device each metric comes from.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Vedi la fonte di ogni dato",
        en: "See the source of each metric",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Sotto le metriche della giornata puo comparire una piccola etichetta, per esempio 'Fonte: anello' sotto il Sonno. Vuol dire che quel valore lo ha misurato l'anello, non l'orologio. Quando un dato arriva dal dispositivo che porti sempre al polso non serve dirlo, quindi l'etichetta compare solo quando e utile saperlo.",
        en: "Under the metrics for the day a small label can appear, for example 'Source: ring' under Sleep. It means that value was measured by the ring, not the watch. When a metric comes from the device you always wear there is no need to say it, so the label only shows up when it is useful to know.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Niente conteggi doppi",
        en: "No double counting",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se indossi piu dispositivi nello stesso momento, contano gli stessi passi reali. FitMesh Sync non li somma: tiene il quadro corretto della tua giornata, senza gonfiare i numeri.",
        en: "If you wear multiple devices at the same time, they count the same real steps. FitMesh Sync does not add them up: it keeps the correct picture of your day, without inflating the numbers.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Vuoi capire come gestiamo piu dispositivi nel dettaglio?",
        en: "Want to understand how we handle multiple devices in detail?",
      },
      body: {
        it: "Abbiamo una guida dedicata che spiega tutto, con esempi per ogni combinazione: [piu smartwatch insieme senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi).",
        en: "We have a dedicated guide that explains everything, with examples for each combination: [multiple smartwatches together without double data](/en/blog/piu-smartwatch-insieme-dati-doppi).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Orologio in carica? Ci pensa un altro dispositivo",
        en: "Watch charging? Another device covers it",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Capita di lasciare l'orologio in carica per qualche ora. In quel periodo, se indossi l'anello, e lui a tenere il conto. Quando guardi la giornata, le ore coperte da dispositivi diversi si uniscono in un quadro unico, senza buchi e senza doppioni.",
        en: "It happens to leave the watch charging for a few hours. During that time, if you wear the ring, the ring keeps count. When you look at your day, the hours covered by different devices come together into one picture, with no gaps and no duplicates.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Lo stesso su Android e iPhone",
        en: "The same on Android and iPhone",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Che tu usi un telefono Android o un iPhone, il comportamento e identico: i dati dei tuoi dispositivi si uniscono nella stessa vista, con la stessa trasparenza sulla fonte. Se usi entrambi, trovi qualche dettaglio in piu nella pagina dedicata ai [due telefoni sullo stesso account](/it/lp/due-telefoni).",
        en: "Whether you use an Android phone or an iPhone, the behavior is identical: your devices' data come together in the same view, with the same transparency about the source. If you use both, you can find more details on the page about [two phones on the same account](/en/lp/due-telefoni).",
      },
    },
    {
      type: "cta",
      title: {
        it: "Provalo con i tuoi dispositivi",
        en: "Try it with your devices",
      },
      body: {
        it: "Entra nella beta, collega orologio e anello e guarda la giornata unita in un solo posto, con la fonte di ogni dato sempre chiara.",
        en: "Join the beta, connect your watch and ring, and see your day brought together in one place, with the source of each metric always clear.",
      },
      ctaLabel: {
        it: "Inizia la beta gratuita",
        en: "Start the free beta",
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
      },
      a: {
        it: "L'etichetta appare solo quando il dato arriva da un dispositivo diverso da quello che indossi di solito, cosi resta un'informazione utile e non rumore. Quando il dato arriva dal dispositivo principale, l'etichetta non serve.",
        en: "The label only appears when the metric comes from a device different from the one you usually wear, so it stays useful information and not noise. When the metric comes from your main device, the label is not needed.",
      },
    },
    {
      q: {
        it: "Se ho orologio e anello, i passi si sommano?",
        en: "If I have a watch and a ring, are steps added up?",
      },
      a: {
        it: "No. Contano gli stessi passi reali, quindi FitMesh Sync li unisce senza raddoppiarli. Il numero che vedi e il quadro corretto della giornata, non la somma dei dispositivi.",
        en: "No. They count the same real steps, so FitMesh Sync brings them together without doubling them. The number you see is the correct picture of your day, not the sum of the devices.",
      },
    },
    {
      q: {
        it: "Funziona se uso due telefoni, Android e iPhone?",
        en: "Does it work if I use two phones, Android and iPhone?",
      },
      a: {
        it: "Si. I dati confluiscono nello stesso account e si uniscono nella stessa vista, con la fonte di ogni metrica indicata dove serve.",
        en: "Yes. The data flow into the same account and come together in the same view, with the source of each metric shown where it helps.",
      },
    },
    {
      q: {
        it: "Devo configurare qualcosa?",
        en: "Do I need to configure anything?",
      },
      a: {
        it: "No. Basta avere i dispositivi collegati: l'unione dei dati e l'indicazione della fonte sono automatiche.",
        en: "No. Just have your devices connected: merging the data and showing the source happen automatically.",
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
