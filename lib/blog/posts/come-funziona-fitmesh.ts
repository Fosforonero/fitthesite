import type { BlogPost, BlogSection } from "../types";
import {
  featureStatusSentence,
  isFeatureAvailable,
  meshStatusSentenceRenderable,
} from "@/lib/feature-status";

/** Lingue con testo in questo file: it (fonte) ed en (derivata). */
type PillarLocale = "it" | "en";

/** Dove si consultano i dati oggi: la dashboard dell'app mobile. */
const DOVE_SI_CONSULTA: Record<PillarLocale, string> = {
  it: "I dati si consultano nella dashboard dell'app FitMesh Sync, su iPhone e su Android.",
  en: "Your data is viewed in the dashboard of the FitMesh Sync app, on iPhone and Android.",
};

/**
 * Stato della dashboard web: DERIVATO da lib/feature-status.ts (che legge
 * CAPABILITY_STATUS in lib/product-facts.ts), come nella guida ultratleta.
 * Nessuna frase di stato scritta qui: quando la funzione diventa disponibile
 * la frase esce da sola e resta solo il riferimento all'app.
 */
function statoDashboardWeb(lc: PillarLocale): string {
  return [
    isFeatureAvailable("webDashboard") ? "" : featureStatusSentence("webDashboard", lc),
    DOVE_SI_CONSULTA[lc],
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Stato di Mesh Famiglia: frase canonica del registro, solo dove e' resa
 * (meshStatusSentenceRenderable: le otto lingue con formula approvata).
 * Il blocco che la contiene e' inoltre ristretto a quelle otto lingue.
 */
function statoMesh(lc: PillarLocale): string {
  if (isFeatureAvailable("familyMesh") || !meshStatusSentenceRenderable(lc)) return "";
  return featureStatusSentence("familyMesh", lc);
}

/** Le otto lingue in cui la frase Mesh ha la formula approvata (feature-status.ts). */
const MESH_SENTENCE_LOCALES = ["it", "en", "es", "de", "pt", "fr", "pl", "tr"] as const;

/**
 * Pillar «Cos'è FitMesh Sync e come funziona» (sprint PM 02/10/2026).
 *
 * Fatti di prodotto riletti nel codice dell'app al tag v3.10.0+191
 * (9e5e80d3) il 02/10/2026, nessuna prova su dispositivo. Una riga per claim,
 * con file:riga, categoria E1-E4 e condizione, nella matrice dei fatti del
 * pillar (fuori dal repository pubblico).
 *
 * Provenienza delle lingue (TRANSLATIONS «Declaring the source»):
 * - lingua di partenza: it (fonte);
 * - en: derivato dall'it di questo file, stessa revisione git; controllo
 *   applicato: revisione di AGENTE, non madrelingua (TRANSLATIONS 6: nessuna
 *   firma nominata registrata);
 * - altre lingue: nessun testo in questo file. Le traduzioni arrivano solo
 *   dopo la consegna esplicita delle traduzioni; finche' mancano, lo slug e' in
 *   REDIRECT_INCOMPLETE_LOCALE_SLUGS (lib/blog/indexability.ts) e ogni
 *   lingua diversa da it/en va in 307 verso l'inglese;
 * - frasi di stato di dashboard web e Mesh Famiglia: non sono di questo post,
 *   arrivano da lib/feature-status.ts con la provenienza registrata li'.
 *
 * STRUTTURA CONGELATA (base PILLAR-BASE-v1, 02/10/2026): non inserire, togliere
 * o spostare blocchi del corpo o FAQ. I path delle traduzioni (walkPost in
 * lib/blog/nordic-overlay.ts) sono indicizzati sull'ordine: un cambio di
 * struttura rende inservibili le traduzioni consegnate su questa base. Le
 * correzioni di testo dentro un blocco esistente sono ammesse, ma cambiano la
 * base: vanno ricomunicate a chi traduce. Il guardrail
 * tools/check-p15c-pillar-truth.ts fallisce se la struttura cambia.
 *
 * Nessuna immagine nel corpo: le schermate precedenti mostravano dati e barra
 * di stato di un telefono reale. Tornano solo schermate dimostrative con dati
 * di esempio (decisione del 02/10/2026).
 */
export const post: BlogPost = {
  slug: "come-funziona-fitmesh",
  category: "guides",
  publishedAt: "2026-07-03",
  // Riscrittura it/en del 02/10/2026 (sprint PM): nuovo corpo, FAQ e metadata.
  updatedAt: "2026-10-02",
  // Stima sulla lunghezza it/en (circa 1.100 parole).
  readMinutes: 5,
  hero: {
    kicker: {
      it: "Guida",
      en: "Guide",
    },
    title: {
      it: "Cos'è FitMesh Sync e come funziona",
      en: "What Is FitMesh Sync and How Does It Work?",
    },
    subtitle: {
      // E' anche l'excerpt della card in home e dell'indice blog: niente
      // «web», niente «senza doppioni», coerente con corpo e metaDescription.
      it: "FitMesh Sync riunisce nell'app i dati che anello, smartwatch e app fitness rendono disponibili. Ecco cosa fa, cosa resta nelle app dei produttori e come iniziare.",
      en: "FitMesh Sync brings together, in the app, the data your ring, smartwatch and fitness apps make available. Here is what it does, what stays in the makers' apps and how to start.",
    },
  },
  metaDescription: {
    // 140-160 caratteri (it 145, en 157).
    it: "Cos'è FitMesh Sync, come riunisce nell'app i dati di anello e smartwatch, cosa resta nelle app dei produttori, come iniziare, limiti e prova Pro.",
    en: "What FitMesh Sync is, how it brings ring and smartwatch data together in the app, what stays in the makers' apps, how to start, its limits and the Pro trial.",
  },
  // Descrive l'immagine (cover concettuale invariata), non ripete l'H1.
  coverAlt: {
    it: "Illustrazione: uno smartwatch, un anello, una fascia e un telefono collegati da linee luminose a un pannello centrale, che porta i dati ai grafici di sonno, passi e battito su uno smartphone.",
    en: "Illustration: a smartwatch, a ring, a band and a phone linked by glowing lines to a central panel that carries the data to sleep, steps and heart rate charts on a smartphone.",
  },
  primaryKeyword: {
    it: "come funziona FitMesh Sync",
    en: "how FitMesh Sync works",
  },
  secondaryKeywords: {
    it: [
      "cos'è FitMesh Sync",
      "fitmesh dashboard nell'app",
      "fitmesh anello colmi",
      "fitmesh health connect",
      "fitmesh apple salute",
      "unire dati anello e orologio",
      "dati di più wearable in un'app",
    ],
    en: [
      "what is FitMesh Sync",
      "fitmesh dashboard in the app",
      "fitmesh colmi ring",
      "fitmesh health connect",
      "fitmesh apple health",
      "combine ring and watch data",
      "data from several wearables in one app",
    ],
  },
  tldr: {
    it: [
      "App per iPhone e Android che riunisce in un account i dati fitness di più dispositivi.",
      "Legge Apple Salute, Health Connect e un anello Colmi compatibile via Bluetooth, solo per i dati che autorizzi.",
      "Quando più fonti contano i passi dello stesso giorno, mostra un solo conteggio invece di sommare i totali.",
      "Download gratuito e prova Pro di 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento.",
      statoDashboardWeb("it"),
    ],
    en: [
      "An app for iPhone and Android that brings fitness data from several devices into one account.",
      "It reads Apple Health, Health Connect and a compatible Colmi ring over Bluetooth, only for the data you authorize.",
      "When several sources count steps for the same day, it shows one step count instead of adding up the totals.",
      "The app is free to download, with a 14-day Pro trial. After the trial, continuing to use Pro features requires a purchase or subscription.",
      statoDashboardWeb("en"),
    ],
  },
  body: [
    // ── 1. Cos'è FitMesh Sync ────────────────────────────────────────────
    {
      type: "heading",
      level: 2,
      text: { it: "Cos'è FitMesh Sync", en: "What FitMesh Sync is" },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync è un'app per iPhone e Android. Legge i dati che orologi, anelli e app fitness salvano in Apple Salute o in Health Connect e, con un anello Colmi compatibile, si collega anche via Bluetooth. Nell'app li mostra insieme, giorno per giorno. Da Apple Salute e da Health Connect legge solo i tipi di dato che autorizzi e che una sorgente ha davvero scritto.",
        en: "FitMesh Sync is an app for iPhone and Android. It reads the data that watches, rings and fitness apps save to Apple Health or Health Connect and, with a compatible Colmi ring, it also connects over Bluetooth. In the app it shows that data together, day by day. From Apple Health and Health Connect it only reads the data types you authorize and that a source has actually written.",
      },
    },
    // ── 2. Quale problema risolve e per chi ─────────────────────────────
    {
      type: "heading",
      level: 2,
      text: { it: "Quale problema risolve e per chi", en: "The problem it solves, and for whom" },
    },
    {
      type: "paragraph",
      text: {
        it: "È pensata per chi usa più di un dispositivo, per esempio un anello di notte e un orologio di giorno, oppure un iPhone e un telefono Android. Senza un'app che li riunisca, i dati restano divisi fra app diverse e, con due telefoni, fra due piattaforme.",
        en: "It is meant for people who use more than one device, for example a ring at night and a watch during the day, or an iPhone and an Android phone. Without an app that brings them together, the data stays split across different apps and, with two phones, across two platforms.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Con lo stesso account, ogni telefono mostra i dati già sincronizzati dagli altri, anche quando cambi telefono, a patto di avere una connessione e un accesso attivo, per esempio la prova o Pro.",
        en: "With the same account, each phone shows the data the others have already synced, including when you switch phones, as long as you have a connection and active access, such as the trial or Pro.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Cosa viene raccolto e come chiedere la cancellazione dell'account: vedi l'[informativa sulla privacy](/it/privacy) e la pagina [cancellazione dell'account](/delete-account) (in inglese).",
        en: "What is collected and how to request account deletion: see the [privacy policy](/en/privacy) and the [account deletion](/delete-account) page.",
      },
    },
    // ── 3. Come raccoglie e unisce le metriche compatibili ─────────────
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come raccoglie e unisce le metriche compatibili",
        en: "How it collects and combines compatible metrics",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync raccoglie i dati da tre percorsi.",
        en: "FitMesh Sync collects data through three paths.",
      },
    },
    {
      type: "table",
      caption: {
        it: "I tre percorsi di raccolta dei dati.",
        en: "The three data collection paths.",
      },
      headers: {
        it: ["Percorso", "Piattaforma", "Cosa serve", "Cosa arriva"],
        en: ["Path", "Platform", "What it needs", "What arrives"],
      },
      rows: [
        {
          it: ["Anello Colmi via Bluetooth", "iPhone e Android", "Un anello Colmi compatibile, il Bluetooth attivo e il collegamento dall'app. Non passa da Apple Salute né da Health Connect.", "Le metriche che l'anello registra e che l'app riesce a leggere dal modello in uso."],
          en: ["Colmi ring over Bluetooth", "iPhone and Android", "A compatible Colmi ring, Bluetooth on and pairing in the app. It does not go through Apple Health or Health Connect.", "The metrics the ring records and the app can read for that model."],
        },
        {
          it: ["Health Connect", "Android", "Il permesso per i tipi scelti. Il dispositivo o l'app che registra il dato deve scriverlo in Health Connect.", "I tipi autorizzati che la sorgente scrive."],
          en: ["Health Connect", "Android", "Permission for the types you choose. The device or app that records the data must write it to Health Connect.", "The authorized types the source writes."],
        },
        {
          it: ["Apple Salute", "iPhone", "L'accesso per i tipi scelti. Il dispositivo o l'app che registra il dato deve scriverlo in Apple Salute.", "I tipi autorizzati che la sorgente scrive."],
          en: ["Apple Health", "iPhone", "Access for the types you choose. The device or app that records the data must write it to Apple Health.", "The authorized types the source writes."],
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        it: "La giornata non è la somma dei totali di ogni dispositivo: FitMesh raggruppa i dati per giorno e per fonte e li unisce con regole che cambiano secondo la metrica.",
        en: "The day is not the sum of each device's totals: FitMesh groups the data by day and by source and combines it with rules that depend on the metric.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Passi.** Con più fonti per lo stesso giorno, FitMesh mostra un solo conteggio. In automatico lo sceglie per affidabilità e copertura dei dati; se i dati orari dell'anello Colmi e del telefono sono coerenti, può comporlo ora per ora. Il criterio non è il numero più alto.",
          "**Sonno.** Una sessione principale per giorno, attribuita al giorno del risveglio; i pisolini restano separati.",
          "**Allenamenti.** Due registrazioni dello stesso allenamento si uniscono quando inizio, fine e tipo coincidono. Se due piattaforme lo registrano in modo diverso, può comparire due volte.",
        ],
        en: [
          "**Steps.** With several sources for the same day, FitMesh shows one step count. In automatic mode it picks it by how reliable and complete the data is; if the hourly data from the Colmi ring and the phone line up, it can build it hour by hour. The rule is not the highest number.",
          "**Sleep.** One main session per day, assigned to the day you wake up; naps stay separate.",
          "**Workouts.** Two records of the same workout are merged when start, end and type match. If two platforms record it differently, it can appear twice.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Nell'app, il «Centro Sincronizzazione» (dal menu, «Dispositivi & sync») mostra per ogni metrica l'app che l'ha fornita all'ultima sincronizzazione. Il numero unito è una scelta motivata, non una garanzia: se non ti torna, confrontalo con l'app del produttore.",
        en: "In the app, the “Sync Center” (from the menu, “Devices & sync”) shows, for each metric, the app that provided it at the last sync. The combined number is a reasoned choice, not a guarantee: if it doesn't add up, compare it with the maker's app.",
      },
    },
    // ── 4. Cosa resta nelle app dei produttori ──────────────────────────
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa resta nelle app dei produttori", en: "What stays in the makers' apps" },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync non sostituisce l'app del produttore. Punteggi e indici calcolati da quelle app, per esempio di recupero o di carico di allenamento, restano lì: FitMesh non li importa. Restano lì anche l'abbinamento dell'orologio e le sue impostazioni.",
        en: "FitMesh Sync does not replace the maker's app. Scores and indexes calculated by those apps, for example for recovery or training load, stay there: FitMesh does not import them. Watch pairing and watch settings stay there too.",
      },
    },
    // ── 5. Come iniziare ────────────────────────────────────────────────
    {
      type: "heading",
      level: 2,
      text: { it: "Come iniziare", en: "How to get started" },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Scarica FitMesh Sync da App Store (iOS 14.0 o successivo) o da Google Play (Android 8.0 o successivo) e tocca «Accedi» oppure «Crea account».",
          "Nell'app del tuo orologio o della tua app fitness, attiva la condivisione dei dati verso Apple Salute o Health Connect, se non è già attiva.",
          "In FitMesh Sync autorizza le letture: su iPhone dai accesso ad Apple Salute, su Android a Health Connect, scegliendo quali dati leggere.",
          "Con un anello Colmi compatibile, consenti il Bluetooth, apri «Anello smart» dal menu e tocca «Collega anello».",
          "Tocca «Sincronizza ora» per la prima sincronizzazione.",
        ],
        en: [
          "Download FitMesh Sync from the App Store (iOS 14.0 or later) or Google Play (Android 8.0 or later) and tap “Sign in” or “Create account”.",
          "In your watch's app or your fitness app, turn on data sharing with Apple Health or Health Connect, if it is not already on.",
          "In FitMesh Sync, authorize the readings: on iPhone give access to Apple Health, on Android to Health Connect, choosing which data to read.",
          "With a compatible Colmi ring, allow Bluetooth, open “Smart ring” from the menu and tap “Pair ring”.",
          "Tap “Sync now” for the first sync.",
        ],
      },
    },
    // ── 6. Limiti, download, prova e Pro ────────────────────────────────
    {
      type: "heading",
      level: 2,
      text: { it: "Limiti, download, prova e Pro", en: "Limits, download, trial and Pro" },
    },
    {
      type: "paragraph",
      text: {
        it: "Alcune metriche restano fuori. In questa versione FitMesh Sync non mostra il VO2 max e non legge la temperatura notturna del polso di Apple Watch. Su iPhone la distanza giornaliera è quella a piedi e di corsa. Su Android non legge pressione, glicemia, idratazione e nutrizione da Health Connect.",
        en: "Some metrics are left out. In this version FitMesh Sync does not show VO2 max and does not read Apple Watch overnight wrist temperature. On iPhone the daily distance is walking and running distance. On Android it does not read blood pressure, blood glucose, hydration and nutrition from Health Connect.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il download è gratuito. Ogni nuovo account ha una prova di FitMesh Pro di 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento. L'acquisto si fa nell'app tramite lo store, al prezzo che lo store mostra.",
        en: "The app is free to download. Every new account gets a 14-day FitMesh Pro trial. After the trial, continuing to use Pro features requires a purchase or subscription. You buy it in the app through your store, at the price the store shows.",
      },
    },
    // ── 7. Dove si consultano i dati: stato di dashboard web e Mesh ─────
    // Frasi di stato DERIVATE da lib/feature-status.ts (CAPABILITY_STATUS).
    // Nessuna data, nessuna idoneita', nessuna meccanica (decisione Q2 del
    // 02/10/2026). Il titolo non nomina le due funzioni, cosi' resta vero in
    // ogni lingua e anche quando una frase di stato esce dal testo.
    {
      type: "heading",
      level: 2,
      text: {
        it: "Dove si consultano i dati oggi",
        en: "Where you view your data today",
      },
    },
    {
      type: "paragraph",
      text: { it: statoDashboardWeb("it"), en: statoDashboardWeb("en") },
    },
    // Frase Mesh: blocco proprio, ristretto alle otto lingue con formula
    // approvata (decisione Q4); nelle altre lingue non e' mai valutato. Esce
    // dal corpo quando la Mesh diventa disponibile.
    ...(statoMesh("it") === ""
      ? []
      : ([
          {
            type: "paragraph",
            locales: MESH_SENTENCE_LOCALES,
            text: { it: statoMesh("it"), en: statoMesh("en") },
          },
        ] as BlogSection[])),
    {
      type: "fitmesh-editorial-cta",
      contentCluster: "general",
      placement: "article_end",
      title: {
        it: "Inizia con FitMesh Sync",
        en: "Get started with FitMesh Sync",
      },
      body: {
        it: "Scarica l'app per iPhone o Android, accedi e autorizza le sorgenti che vuoi leggere.",
        en: "Download the app for iPhone or Android, sign in and authorize the sources you want to read.",
      },
      // Nessun beneficio elencato: il percorso di download e' la riga dei
      // pulsanti App Store e Google Play (StoreButtonsRow, resa dal renderer).
      benefits: { it: [], en: [] },
    },
  ],
  faq: [
    {
      q: {
        it: "Quali dati legge FitMesh Sync su iPhone e su Android?",
        en: "What data does FitMesh Sync read on iPhone and Android?",
      },
      a: {
        it: "Da Apple Salute su iPhone e da Health Connect su Android: passi, distanza, calorie attive, battito, battito a riposo, HRV (misurata in modo diverso su iPhone e su Android), ossigeno nel sangue, sonno con le fasi, allenamenti, peso, frequenza respiratoria e temperatura corporea. Arrivano solo i tipi che autorizzi e che una sorgente ha davvero scritto.",
        en: "From Apple Health on iPhone and from Health Connect on Android: steps, distance, active calories, heart rate, resting heart rate, HRV (measured differently on iPhone and Android), blood oxygen, sleep with stages, workouts, weight, respiratory rate and body temperature. Only the types you authorize, and that a source has actually written, come through.",
      },
    },
    {
      q: {
        it: "Quali anelli Colmi posso collegare?",
        en: "Which Colmi rings can I pair?",
      },
      a: {
        it: "Gli anelli Colmi che l'app riconosce dal nome Bluetooth, per esempio R02, su iPhone e su Android. Le metriche che arrivano dipendono dal modello. Il collegamento può non riuscire se l'anello è già connesso a un'altra app o è fuori portata.",
        en: "Colmi rings the app recognizes by their Bluetooth name, for example R02, on iPhone and Android. The metrics that arrive depend on the model. Pairing can fail if the ring is already connected to another app or out of range.",
      },
    },
    {
      q: {
        it: "Posso usare un iPhone e un telefono Android con lo stesso account?",
        en: "Can I use an iPhone and an Android phone with the same account?",
      },
      a: {
        it: "Sì. Ogni telefono legge la propria piattaforma, con i suoi permessi di lettura. Dopo che un telefono ha sincronizzato, l'altro mostra anche quei dati quando si aggiorna, per esempio con «Sincronizza ora».",
        en: "Yes. Each phone reads its own platform, with its own read permissions. Once one phone has synced, the other also shows that data when it refreshes, for example with “Sync now”.",
      },
    },
    {
      q: {
        it: "Cosa non passa a un nuovo telefono?",
        en: "What does not carry over to a new phone?",
      },
      a: {
        it: "Gli allenamenti registrati con l'app FitMesh Sync restano sul telefono dove li hai registrati. Non passano nemmeno l'abbinamento dell'anello, i collegamenti ai servizi esterni e i giorni che non erano stati sincronizzati: sul nuovo telefono riabbini l'anello e ricolleghi i servizi.",
        en: "Workouts recorded with the FitMesh Sync app stay on the phone where you recorded them. Ring pairing, connections to external services and days that had not been synced do not carry over either: on the new phone you pair the ring again and reconnect the services.",
      },
    },
    {
      q: {
        it: "Posso scegliere quale fonte usare per i passi?",
        en: "Can I choose which source to use for steps?",
      },
      a: {
        it: "Sì. Nell'app puoi indicare una fonte preferita per i passi e FitMesh usa quella. Se nei dati di quel giorno la fonte indicata non c'è, torna alla scelta automatica.",
        en: "Yes. In the app you can set a preferred source for steps and FitMesh uses it. If the chosen source is missing from that day's data, it goes back to the automatic choice.",
      },
    },
    {
      q: {
        it: "Ogni quanto si sincronizza?",
        en: "How often does it sync?",
      },
      a: {
        it: "Non c'è un intervallo garantito: i tempi dipendono dall'app del produttore, dalla piattaforma e dal sistema operativo. Puoi sincronizzare a mano con «Sincronizza ora». Su Android la lettura ad app chiusa richiede anche l'«Accesso ai dati in background» in Health Connect, e non è garantita.",
        en: "There is no guaranteed interval: timing depends on the maker's app, the platform and the operating system. You can sync by hand with “Sync now”. On Android, reading while the app is closed also needs “Background data access” in Health Connect, and it is not guaranteed.",
      },
    },
    {
      q: {
        it: "Perché una metrica è vuota?",
        en: "Why is a metric empty?",
      },
      a: {
        it: "Di solito perché il dispositivo non la scrive in Apple Salute o in Health Connect. Controlla che la condivisione sia attiva nell'app del produttore e che FitMesh Sync abbia il permesso per quel tipo di dato; su Android verifica anche «Tipi di dato sincronizzati» nelle impostazioni dell'app.",
        en: "Usually because the device does not write it to Apple Health or Health Connect. Check that sharing is on in the maker's app and that FitMesh Sync has permission for that data type; on Android also check “Synced data types” in the app's settings.",
      },
    },
    {
      q: {
        it: "FitMesh Sync scrive dati in Apple Salute o in Health Connect?",
        en: "Does FitMesh Sync write data to Apple Health or Health Connect?",
      },
      a: {
        it: "Solo se lo attivi: le opzioni «Scrivi su Apple Salute» (iPhone) e «Scrivi su Health Connect» (Android) sono spente per impostazione predefinita, richiedono il permesso di scrittura e riguardano alcuni dati della giornata in corso. Il sonno non viene scritto in Apple Salute.",
        en: "Only if you turn it on: the “Write to Apple Health” (iPhone) and “Write to Health Connect” (Android) options are off by default, need write permission and cover some of the current day's data. Sleep is not written to Apple Health.",
      },
    },
    {
      q: {
        it: "FitMesh Sync fa diagnosi o dà consigli medici?",
        en: "Does FitMesh Sync diagnose or give medical advice?",
      },
      a: {
        it: "No. I dati e gli indicatori che l'app mostra hanno scopo informativo e non sono un parere medico. Per decisioni sulla salute rivolgiti a un medico.",
        en: "No. The data and indicators the app shows are for information only and are not medical advice. For health decisions, talk to a doctor.",
      },
    },
  ],
  // Solo correlati senza claim noti su dashboard web, Founder o «senza
  // doppioni» nel titolo e nel sottotitolo (controllo del 02/10/2026).
  related: ["come-funziona-health-connect", "piu-smartwatch-insieme-dati-doppi"],
  // Nessuna fonte esterna: ogni claim del corpo riguarda il comportamento
  // dell'app (E1, matrice dei fatti del pillar). Le tre pagine radice di
  // documentazione citate prima sostenevano frasi rimosse e non sono state
  // riverificate (nessuna rete): tolti `sources`, `sourcesRenderedInline` e
  // la callout «Fonti e verifica» con la data del 5 agosto 2026.
  brandsMentioned: ["Colmi", "Apple", "Google"],
  ldType: "BlogPosting",
};
