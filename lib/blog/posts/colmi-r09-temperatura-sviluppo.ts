import type { BlogPost } from "../types";

/**
 * Stato dei fatti su Colmi ring in FitMesh: cosa funziona già oggi (Colmi
 * R02/R03 e i cloni OEM con lo stesso protocollo BLE, via BLE diretto) e cosa
 * stiamo costruendo per l'R09 (sensore di temperatura cutanea). Scope di
 * compatibilità allineato al provider entry corretto in lib/providers/data.ts
 * (colmi-ring, status live): NON più ampio ("R02-R10") di quanto lì
 * verificato. L'R09 NON ha temperatura verificata/spedita: codice scritto,
 * test automatici verdi, ma verifica su hardware fisico ancora da fare.
 * Framing "in sviluppo", mai "già funzionante". Nessuna promessa di data,
 * nessun claim diagnostico. it/en; gli altri locali si aggiungono dopo.
 */
export const post: BlogPost = {
  slug: "colmi-r09-temperatura-sviluppo",
  category: "guides",
  publishedAt: "2026-07-05",
  updatedAt: "2026-07-05",
  readMinutes: 8,
  hero: {
    kicker: { it: "Guida - Anello Colmi", en: "Guide - Colmi ring" },
    title: {
      it: "Anello Colmi in FitMesh: tutto quello che leggiamo oggi, e cosa stiamo costruendo per l'R09",
      en: "Colmi ring in FitMesh: everything we read today, and what we're building for the R09",
    },
    subtitle: {
      it: "Con i Colmi R02/R03 e i cloni OEM con lo stesso protocollo BLE, FitMesh Sync legge già oggi passi, distanza, calorie, battito, FC a riposo, SpO2, HRV, stress, sonno con fasi e batteria via Bluetooth diretto, fusi con i dati del tuo smartwatch senza doppi conteggi. Il modello R09 ha in più un sensore di temperatura cutanea che l'R02/R03 non hanno: ecco cosa fa già l'anello oggi, e cosa stiamo costruendo per usare quel sensore — ancora in sviluppo, non verificato su hardware fisico.",
      en: "With the Colmi R02 and R03 (and OEM clones sharing the same BLE protocol), FitMesh Sync already reads steps, distance, calories, heart rate, resting HR, SpO2, HRV, stress, sleep with stages and battery over direct Bluetooth, merged with your smartwatch data with no double counting. The R09 model adds a skin-temperature sensor the R02/R03 don't have: here's everything the ring already does today, and what we're building to put that sensor to use — still in development, not yet verified on physical hardware.",
    },
  },
  metaDescription: {
    it: "Cosa legge oggi FitMesh Sync dal tuo anello Colmi (R02/R03 e cloni OEM compatibili): passi, battito, SpO2, HRV, stress, sonno con fasi. Più cosa stiamo costruendo per il sensore di temperatura dell'R09.",
    en: "What FitMesh Sync reads from your Colmi ring today (R02/R03 and compatible OEM clones): steps, heart rate, SpO2, HRV, stress, sleep with stages. Plus what we're building for the R09's temperature sensor.",
  },
  primaryKeyword: {
    it: "anello colmi r09 temperatura fitmesh",
    en: "colmi r09 temperature fitmesh",
  },
  secondaryKeywords: {
    it: [
      "anello colmi dati fitmesh",
      "colmi r09 sensore temperatura",
      "colmi r02 r03 cloni compatibili",
      "temperatura cutanea anello smart",
      "colmi ring indice di recupero",
      "cosa misura l'anello colmi",
      "colmi r09 quando esce",
    ],
    en: [
      "colmi ring data fitmesh",
      "colmi r09 temperature sensor",
      "colmi r02 r03 compatible clones",
      "smart ring skin temperature",
      "colmi ring recovery index",
      "what does colmi ring measure",
      "colmi r09 release date",
    ],
  },
  tldr: {
    it: [
      "Oggi, con i Colmi R02/R03 e i cloni OEM con lo stesso protocollo BLE, FitMesh Sync legge via Bluetooth diretto passi, distanza, calorie, battito (con FC a riposo), SpO2, HRV, stress e sonno con fasi, più la batteria dell'anello.",
      "I dati dell'anello si fondono con quelli del tuo smartwatch nella stessa dashboard: l'anello vince di notte per il sonno, mai doppi conteggi quando indossi entrambi.",
      "Gli allenamenti non sono letti dall'anello: per quelli serve oggi uno smartwatch o un'altra fonte collegata.",
      "L'R09 ha un sensore di temperatura cutanea che l'R02/R03 non hanno: stiamo costruendo il supporto, ma è ancora in sviluppo, non verificato su un anello fisico, e non è nella build attuale.",
      "Quando sarà pronto, la temperatura sarà un segnale di benessere informativo, non diagnostico — non un annuncio con una data promessa.",
    ],
    en: [
      "Today, with the Colmi R02 and R03 (and OEM clones sharing the same BLE protocol), FitMesh Sync reads steps, distance, calories, heart rate (with resting HR), SpO2, HRV, stress and sleep with stages over direct Bluetooth, plus the ring's battery level.",
      "Ring data merges with your smartwatch data in the same dashboard: the ring wins overnight for sleep, never double-counted when you wear both.",
      "Workouts aren't read from the ring: for those, you currently need a smartwatch or another connected source.",
      "The R09 has a skin-temperature sensor the R02/R03 don't have: we're building support for it, but it's still in development, not verified on physical hardware, and not in the current build.",
      "When it ships, temperature will be a non-diagnostic wellness signal — not an announcement with a promised date.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se indossi un anello Colmi, FitMesh Sync legge già molto di quello che misura, senza bisogno dell'app companion del produttore. Questa pagina fa il punto su due cose distinte: primo, cosa funziona davvero oggi per chi indossa un Colmi R02/R03 o un clone OEM con lo stesso protocollo BLE. Secondo, cosa stiamo costruendo per il modello R09 nello specifico, che ha un sensore che gli altri modelli non hanno — ed è lavoro ancora in corso, non una funzione già disponibile.",
        en: "If you wear a Colmi ring, FitMesh Sync already reads a lot of what it measures, no manufacturer companion app required. This page covers two separate things: first, what actually works today if you wear a Colmi R02 or R03 (or an OEM clone sharing the same BLE protocol). Second, what we're building specifically for the R09 model, which has a sensor the others don't — and that part is still work in progress, not a feature you can use yet.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Risposta rapida", en: "Quick answer" },
      body: {
        it: "Oggi: passi, distanza, calorie, battito (con FC a riposo), SpO2, HRV, stress e sonno con fasi arrivano nella dashboard da un Colmi R02/R03 o da un clone OEM con lo stesso protocollo BLE, fusi con i dati del tuo smartwatch. In sviluppo: il sensore di temperatura cutanea dell'R09, ancora non verificato su un anello fisico e non presente nella build attuale dell'app.",
        en: "Today: steps, distance, calories, heart rate (with resting HR), SpO2, HRV, stress and sleep with stages land in your dashboard from a Colmi R02 or R03 ring (or an OEM clone sharing the same BLE protocol), merged with your smartwatch data. In development: the R09's skin-temperature sensor, not yet verified on physical hardware and not present in the app's current build.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa legge già oggi FitMesh dal tuo anello Colmi",
        en: "What FitMesh already reads from your Colmi ring today",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync si connette all'anello via Bluetooth diretto, senza app companion nel mezzo. Con un Colmi R02, un R03, o un clone OEM con lo stesso protocollo BLE, oggi hai passi, distanza, calorie, frequenza cardiaca con log giornaliero e FC a riposo, SpO2, HRV (RMSSD), un indice di stress e il sonno completo con le fasi (leggero, profondo, REM, sveglia). La batteria dell'anello è sempre visibile nell'app. Un dato che l'anello non copre: gli allenamenti. Per registrare le sessioni di allenamento serve oggi uno smartwatch o un'altra fonte collegata.",
        en: "FitMesh Sync connects to the ring over direct Bluetooth, no companion app in between. With a Colmi R02, R03, or an OEM clone sharing the same BLE protocol, you get steps, distance, calories, heart rate with a daily log plus resting HR, SpO2, HRV (RMSSD), a stress index, and full sleep with stages (light, deep, REM, awake). Ring battery is always visible in the app. One data point the ring doesn't cover: workouts. Recording workout sessions currently requires a smartwatch or another connected source.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Metriche dell'anello Colmi già in FitMesh Sync",
        en: "Colmi ring metrics already in FitMesh Sync",
      },
      headers: {
        it: ["Metrica", "Disponibile oggi", "Note"],
        en: ["Metric", "Available today", "Notes"],
      },
      rows: [
        { it: ["Passi", "Sì", "Log giornaliero"], en: ["Steps", "Yes", "Daily log"] },
        { it: ["Distanza", "Sì", "Calcolata da passi"], en: ["Distance", "Yes", "Calculated from steps"] },
        { it: ["Calorie", "Sì", "Stima da attività"], en: ["Calories", "Yes", "Activity estimate"] },
        {
          it: ["Frequenza cardiaca", "Sì", "Log giornaliero + FC a riposo"],
          en: ["Heart rate", "Yes", "Daily log + resting HR"],
        },
        { it: ["SpO2", "Sì", "Lettura spot e notturna"], en: ["SpO2", "Yes", "Spot and overnight readings"] },
        { it: ["HRV", "Sì", "Indice RMSSD"], en: ["HRV", "Yes", "RMSSD index"] },
        { it: ["Stress", "Sì", "Indice 0-100"], en: ["Stress", "Yes", "0-100 index"] },
        {
          it: ["Sonno con fasi", "Sì", "L'anello vince di notte nella fusione multi-device"],
          en: ["Sleep with stages", "Yes", "The ring wins overnight in multi-device fusion"],
        },
        { it: ["Batteria", "Sì", "Sempre visibile in app"], en: ["Battery", "Yes", "Always visible in app"] },
        {
          it: ["Allenamenti", "No", "Serve uno smartwatch o un'altra fonte collegata"],
          en: ["Workouts", "No", "Requires a smartwatch or another connected source"],
        },
        {
          it: ["Temperatura cutanea (solo R09)", "In sviluppo, non verificata", "Non è nella build attuale dell'app"],
          en: ["Skin temperature (R09 only)", "In development, not verified", "Not in the app's current build"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come si fondono i dati dell'anello con quelli dello smartwatch",
        en: "How ring data merges with your smartwatch data",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se indossi anche uno smartwatch, FitMesh Sync non somma le due fonti: applica una fusione a priorità di sorgente, dove l'anello è lo specialista del sonno e prevale di notte, mentre lo smartwatch prevale di giorno per le metriche in cui è più preciso. Ogni metrica viene contata una sola volta, con la fonte migliore disponibile in quel momento — niente doppi passi, niente doppie ore di sonno.",
        en: "If you also wear a smartwatch, FitMesh Sync doesn't add the two sources together: it applies a source-priority fusion, where the ring is the sleep specialist and wins overnight, while the smartwatch wins during the day for the metrics where it's more accurate. Each metric is counted only once, with the best source available at that moment — no doubled steps, no doubled hours of sleep.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "L'R09: stesso protocollo, un sensore in più",
        en: "The R09: same protocol, one extra sensor",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il Colmi R09 condivide lo stesso protocollo BLE della famiglia di anelli che FitMesh supporta oggi in modo verificato — Colmi R02, R03 e i cloni OEM compatibili. La differenza è hardware: l'R09 (e l'affine Yawell R05) integra un sensore di temperatura reale, che i modelli R02/R03 semplicemente non hanno. Oggi quel sensore non è ancora letto da FitMesh: è il pezzo su cui stiamo lavorando.",
        en: "The Colmi R09 shares the same BLE protocol as the ring family FitMesh officially supports today — Colmi R02, R03 and compatible OEM clones. The difference is hardware: the R09 (and the related Yawell R05) includes an actual temperature sensor, which the R02/R03 models simply don't have. Today, that sensor isn't read by FitMesh yet — it's the piece we're working on.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa stiamo costruendo: temperatura come segnale di benessere",
        en: "What we're building: temperature as a wellness signal",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il comando che l'R09 usa per esporre la temperatura non era mai stato documentato in FitMesh prima d'ora: lo abbiamo individuato analizzando il protocollo BLE dell'anello, un lavoro di reverse engineering informato anche dalla ricerca pubblica del progetto open source Gadgetbridge su anelli con hardware simile. Il codice per leggere e interpretare quel dato — nel parser del protocollo dell'anello e nella pipeline che fonde i dati con le altre fonti — è scritto, e i nostri test automatici passano. Il piano è che l'indice di recupero guadagni un fattore legato alla deviazione di temperatura rispetto alla tua base personale, e che la scheda salute cardiaca mostri una nota quando la temperatura è sopra la tua norma.",
        en: "The command the R09 uses to expose temperature had never been documented in FitMesh before: we found it by analyzing the ring's BLE protocol, reverse-engineering work informed in part by public research from the open-source Gadgetbridge project on rings with similar hardware. The code to read and interpret that data — in the ring's protocol parser and in the pipeline that merges it with other sources — is written, and our automated tests pass. The plan is for the recovery index to gain a factor tied to temperature deviation from your personal baseline, and for the heart health card to show a note when temperature is above your norm.",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Ancora in sviluppo: non è nella build attuale", en: "Still in development: not in the current build" },
      body: {
        it: "Il supporto alla temperatura dell'R09 non è ancora verificato su un anello fisico e non è incluso nella versione di FitMesh Sync disponibile oggi. Prima di essere rilasciato deve superare un test su hardware reale, indossato. Finché quel test non è confermato, consideralo lavoro in corso, non una funzione disponibile.",
        en: "R09 temperature support hasn't been verified on a physical ring yet, and it isn't included in the version of FitMesh Sync available today. Before it ships, it needs to pass testing on real, worn hardware. Until that test is confirmed, consider it work in progress, not an available feature.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché la temperatura non sarà mai una diagnosi",
        en: "Why temperature will never be a diagnosis",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Come già oggi i dati SpO2 dell'anello — trattati come stima informativa su possibili pattern notturni, non come diagnosi — anche la futura temperatura cutanea sarà un segnale di benessere informativo, non uno strumento diagnostico. Gli anelli smart, incluso l'R09, non sono dispositivi medici e non sono certificati per diagnosticare malattie o condizioni di salute. Una deviazione di temperatura rispetto alla tua base personale sarà un dato in più da osservare nel tempo, non un responso clinico. Per qualsiasi sintomo reale, la valutazione resta quella di un medico.",
        en: "Just like the ring's SpO2 data today — treated as an informational estimate around possible overnight patterns, not a diagnosis — future skin-temperature data will be a non-diagnostic wellness signal, not a diagnostic tool. Smart rings, including the R09, are not medical devices and are not certified to diagnose illness or health conditions. A temperature deviation from your personal baseline will be one more data point to watch over time, not a clinical verdict. For any real symptoms, an actual doctor's evaluation is what matters.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Quando sarà pronto", en: "When it'll ship" },
    },
    {
      type: "paragraph",
      text: {
        it: "Non diamo una data. Il passo che manca è verificare il funzionamento su un anello R09 fisico indossato — controllare che la lettura di temperatura si popoli davvero nella scheda giusta e che l'indice di recupero la usi correttamente. Solo dopo quella verifica decideremo quando includerla in una versione pubblica di FitMesh Sync. Se vuoi sapere quando succede, tienilo d'occhio nella sezione Novità dell'app.",
        en: "We're not giving a date. What's left is verifying it works on a physical, worn R09 ring — checking that the temperature reading actually populates in the right card and that the recovery index uses it correctly. Only after that verification will we decide when to include it in a public FitMesh Sync release. If you want to know when it happens, keep an eye on the app's What's New section.",
      },
    },
    {
      type: "cta",
      title: { it: "Prova FitMesh con il tuo anello Colmi oggi", en: "Try FitMesh with your Colmi ring today" },
      body: {
        it: "Passi, battito, SpO2, HRV, stress e sonno con fasi, fusi con i dati del tuo smartwatch senza doppi conteggi. I primi 1000 iscritti founder ottengono il Pro a vita gratis; tutti gli altri hanno 14 giorni di prova completa.",
        en: "Steps, heart rate, SpO2, HRV, stress and sleep with stages, merged with your smartwatch data with no double counting. The first 1,000 founder sign-ups get lifetime Pro free; everyone else gets a full 14-day trial.",
      },
      ctaLabel: { it: "Unisciti alla beta →", en: "Join the beta →" },
      ctaHref: { it: "/it/beta", en: "/en/beta" },
    },
  ],
  faq: [
    {
      q: { it: "Quali modelli di anello Colmi funzionano con FitMesh?", en: "Which Colmi ring models work with FitMesh?" },
      a: {
        it: "Il Colmi R02, il Colmi R03 e i cloni OEM con lo stesso protocollo BLE. Passi, distanza, calorie, battito, SpO2, HRV, stress e sonno con fasi funzionano su questi modelli.",
        en: "The Colmi R02, the Colmi R03, and OEM clones sharing the same BLE protocol. Steps, distance, calories, heart rate, SpO2, HRV, stress and sleep with stages work across these models.",
      },
    },
    {
      q: { it: "FitMesh legge già la temperatura dell'R09?", en: "Does FitMesh already read R09 temperature?" },
      a: {
        it: "No. Il codice è scritto e i test automatici passano, ma manca ancora la verifica su un anello R09 fisico indossato. Non è nella build attuale di FitMesh Sync.",
        en: "No. The code is written and automated tests pass, but verification on a physical, worn R09 ring is still pending. It isn't in the current build of FitMesh Sync.",
      },
    },
    {
      q: {
        it: "La temperatura dell'anello potrà dirmi se mi sto ammalando?",
        en: "Will ring temperature be able to tell me if I'm getting sick?",
      },
      a: {
        it: "No. Quando sarà disponibile, la temperatura sarà un segnale di benessere informativo, non uno strumento diagnostico. Gli anelli smart non sono dispositivi medici. Per qualsiasi sintomo reale, rivolgiti a un medico.",
        en: "No. When available, temperature will be a non-diagnostic wellness signal, not a diagnostic tool. Smart rings are not medical devices. For any real symptoms, see a doctor.",
      },
    },
    {
      q: { it: "L'anello registra i miei allenamenti?", en: "Does the ring record my workouts?" },
      a: {
        it: "Non ancora. Passi, distanza e calorie sì, ma il riconoscimento delle sessioni di allenamento richiede oggi uno smartwatch o un'altra fonte collegata.",
        en: "Not yet. Steps, distance and calories, yes — but workout session detection currently requires a smartwatch or another connected source.",
      },
    },
    {
      q: {
        it: "Se indosso anche uno smartwatch, i dati si duplicano?",
        en: "If I also wear a smartwatch, does data get duplicated?",
      },
      a: {
        it: "No. FitMesh Sync fonde le fonti per priorità: l'anello prevale di notte per il sonno, lo smartwatch prevale di giorno dove è più preciso. Ogni metrica è contata una sola volta.",
        en: "No. FitMesh Sync merges sources by priority: the ring wins overnight for sleep, the smartwatch wins during the day where it's more accurate. Each metric is counted only once.",
      },
    },
    {
      q: { it: "Quando uscirà il supporto alla temperatura dell'R09?", en: "When will R09 temperature support ship?" },
      a: {
        it: "Non abbiamo una data. Deve prima superare la verifica su hardware fisico indossato. Segui la sezione Novità dell'app per l'annuncio quando succede.",
        en: "We don't have a date. It first needs to pass verification on physical, worn hardware. Follow the app's What's New section for the announcement when it happens.",
      },
    },
  ],
  related: [
    "colmi-ring-fitmesh",
    "colmi-r02-setup",
    "anello-colmi-r02-affidabile",
    "novita-anello-colmi-sonno",
    "tracciare-sonno-anello",
  ],
  brandsMentioned: ["Colmi"],
  ldType: "BlogPosting",
};
