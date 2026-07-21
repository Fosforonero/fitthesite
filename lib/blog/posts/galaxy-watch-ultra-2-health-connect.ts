/**
 * SPRINT P1.3N: registrato LOCALMENTE per testare l'intera pipeline
 * (route, sitemap, JSON-LD, guardrail) prima dell'evento. NON pushato,
 * NON deployato: nulla di questo è pubblico finché il branch non viene
 * pushato dopo la conferma Samsung (Galaxy Unpacked, 2026-07-22, 14:00
 * BST / 15:00 CEST).
 *
 * Nome prodotto, slug, title, H1, specifiche, prezzo, disponibilità,
 * funzioni salute: tutti PROVVISORI, marcati [TBD] dove dipendono
 * dall'annuncio. "Galaxy Watch Ultra 2" è un nome atteso dalla stampa
 * tech (reported_not_confirmed, vedi fact-ledger.md): se Samsung annuncia
 * un nome diverso, rinominare: questo file, lo slug in slugs.ts, l'entry
 * in covers.ts, title/H1/keyword/metadata, il testo dentro l'OG image, il
 * JSON-LD, e ogni internal link che punta qui. Nessun redirect da questo
 * slug provvisorio: la pagina non è mai stata pubblicata.
 *
 * Fact ledger completo: docs/seo/galaxy-watch/fact-ledger.md.
 */
import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "galaxy-watch-ultra-2-health-connect", // [TBD Fase 2] confermare nome esatto
  category: "ecosystem",
  publishedAt: "2026-07-22", // [TBD] data di pubblicazione reale
  updatedAt: "2026-07-22", // [TBD]
  hero: {
    kicker: { it: "Analisi", en: "Analysis" },
    title: {
      it: "Galaxy Watch Ultra 2: quali dati salute arrivano davvero in Health Connect e FitMesh?", // [TBD] nome prodotto
      en: "Galaxy Watch Ultra 2: Which Health Data Actually Reaches Health Connect and FitMesh?",
    },
    subtitle: {
      it: "[TBD Fase 6.1 dopo l'evento, max 80 parole] Bozza: Samsung ha già annunciato (giugno 2026) Vitals, Heart Health Score, Daily Cardio Load, Fitness Index e AGEs Index per Samsung Health, disponibili prima sul nuovo Galaxy Watch. Nome, hardware, prezzo e disponibilità restano da confermare il 22/07.",
      en: "[TBD Phase 6.1 after the event, max 80 words] Draft: Samsung already announced (June 2026) Vitals, Heart Health Score, Daily Cardio Load, Fitness Index, and AGEs Index for Samsung Health, available first on the new Galaxy Watch. Name, hardware, price, and availability remain to be confirmed on 07/22.",
    },
  },
  metaDescription: {
    it: "Analisi verificata delle nuove metriche Galaxy Watch: Vitals, Cardio Load, Fitness Index, dati esportabili e compatibilità con Health Connect e FitMesh.",
    en: "Verified analysis of the new Galaxy Watch metrics: Vitals, Cardio Load, Fitness Index, exportable data, and compatibility with Health Connect and FitMesh.",
  },
  primaryKeyword: {
    it: "galaxy watch ultra 2 health connect", // [TBD] confermare nome
    en: "galaxy watch ultra 2 health connect",
  },
  secondaryKeywords: {
    it: ["galaxy watch nuove funzioni salute", "vitals galaxy watch", "daily cardio load cos'è", "fitness index galaxy watch", "galaxy watch fitmesh compatibilità"],
    en: ["galaxy watch new health features", "galaxy watch vitals", "what is daily cardio load", "galaxy watch fitness index", "galaxy watch fitmesh compatibility"],
  },
  readMinutes: 10, // [TBD] ricalcolare a contenuto finale
  tldr: {
    it: [
      "[TBD] Nome, hardware e prezzo del nuovo Galaxy Watch da confermare dopo Unpacked (22/07/2026, 15:00 CEST).",
      "Samsung ha già annunciato (giugno 2026) 5 nuove funzioni Samsung Health: Vitals, Heart Health Score, Daily Cardio Load, Fitness Index, AGEs Index, disponibili prima sul nuovo Galaxy Watch.",
      "Sono in gran parte punteggi proprietari Samsung: l'esistenza di un tipo di dato in Health Connect non dimostra che Samsung lo esporti da questo modello.",
      "FitMesh non legge VO2 max né temperatura cutanea reale (SkinTemperatureRecord) dal Galaxy Watch via Health Connect oggi, e non replica nessun punteggio proprietario Samsung: solo metriche standard realmente esposte.",
    ],
    en: [
      "[TBD] Name, hardware, and price of the new Galaxy Watch to confirm after Unpacked (2026-07-22, 15:00 CEST).",
      "Samsung already announced (June 2026) 5 new Samsung Health features: Vitals, Heart Health Score, Daily Cardio Load, Fitness Index, AGEs Index, available first on the new Galaxy Watch.",
      "Most are proprietary Samsung scores: a data type existing in Health Connect doesn't prove Samsung exports it from this model.",
      "FitMesh doesn't read VO2 max or real skin temperature (SkinTemperatureRecord) from the Galaxy Watch via Health Connect today, and doesn't replicate any proprietary Samsung score: only standard metrics actually exposed.",
    ],
  },
  body: [
    {
      type: "image",
      src: "/blog/covers/galaxy-watch-unpacked.webp",
      width: 1200,
      height: 675,
      alt: { it: "Illustrazione concettuale di uno smartwatch rugged generico con dati che confluiscono verso un hub centrale", en: "Conceptual illustration of a generic rugged smartwatch with data flowing into a central hub" },
      caption: {
        it: "Illustrazione editoriale FitMesh. Il dispositivo rappresentato è generico e non riproduce il prodotto Samsung.",
        en: "FitMesh editorial illustration. The depicted device is generic and does not reproduce the Samsung product.",
      },
    },
    { type: "heading", level: 2, text: { it: "Cosa ha annunciato realmente Samsung", en: "What Samsung Actually Announced" } },
    { type: "paragraph", text: { it: "[TBD Fase 6.2: da scrivere subito dopo l'evento, solo con fonti Samsung Newsroom/prodotto/Support verificate live. Nessun rumor riportato come fatto.]", en: "[TBD Phase 6.2: to write immediately after the event, using only live-verified Samsung Newsroom/product/Support sources. No rumor reported as fact.]" } },

    { type: "heading", level: 2, text: { it: "Specifiche ufficiali", en: "Official Specifications" } },
    {
      type: "table",
      caption: { it: "Solo dati confermati da Samsung: [TBD post-evento]", en: "Samsung-confirmed data only: [TBD post-event]" },
      headers: { it: ["Caratteristica", "Valore", "Fonte"], en: ["Feature", "Value", "Source"] },
      rows: [
        { it: ["Processore", "[TBD]", "Samsung"], en: ["Processor", "[TBD]", "Samsung"] },
        { it: ["Batteria (capacità nominale)", "[TBD]", "Samsung"], en: ["Battery (nominal capacity)", "[TBD]", "Samsung"] },
        { it: ["Autonomia dichiarata", "[TBD]", "Samsung"], en: ["Stated battery life", "[TBD]", "Samsung"] },
        { it: ["Autonomia reale", "Non ancora testata", "n/d"], en: ["Real-world battery life", "Not yet tested", "n/a"] },
        { it: ["Display", "[TBD]", "Samsung"], en: ["Display", "[TBD]", "Samsung"] },
        { it: ["Resistenza (ATM/IP)", "[TBD]", "Samsung"], en: ["Water/dust resistance (ATM/IP)", "[TBD]", "Samsung"] },
        { it: ["Connettività", "[TBD]", "Samsung"], en: ["Connectivity", "[TBD]", "Samsung"] },
        { it: ["Prezzo Italia/Europa", "[TBD]", "Samsung"], en: ["Italy/EU price", "[TBD]", "Samsung"] },
        { it: ["Disponibilità Italia", "[TBD]", "Samsung"], en: ["Italy availability", "[TBD]", "Samsung"] },
      ],
    },

    { type: "heading", level: 2, text: { it: "Funzioni salute: nuove, aggiornate o già esistenti", en: "Health Features: New, Updated, or Already Existing" } },
    { type: "paragraph", text: { it: "Samsung ha già annunciato (Samsung Newsroom, giugno 2026) 5 nuove funzioni Samsung Health, dichiarate disponibili PRIMA sul nuovo Galaxy Watch rispetto ai modelli esistenti (Watch 7, Watch Ultra):", en: "Samsung already announced (Samsung Newsroom, June 2026) 5 new Samsung Health features, stated to be available FIRST on the new Galaxy Watch compared to existing models (Watch 7, Watch Ultra):" } },
    { type: "list", items: {
      it: [
        "Vitals: 5 segnali notturni (battito, HRV, frequenza respiratoria, temperatura cutanea, SpO₂) confrontati con la baseline personale.",
        "Heart Health Score: combina composizione corporea, sonno, stress e attività in un punteggio cardiovascolare giornaliero.",
        "Daily Cardio Load: sforzo cardiovascolare accumulato, capacità di allenamento stimata.",
        "Fitness Index: battito, VO₂ max, passi giornalieri, confronto con gruppi di pari.",
        "AGEs Index: misurazioni notturne automatiche per una panoramica dello stile di vita nel lungo periodo.",
      ],
      en: [
        "Vitals: 5 overnight signals (heart rate, HRV, respiratory rate, skin temperature, SpO₂) compared against personal baseline.",
        "Heart Health Score: combines body composition, sleep, stress, and activity into a daily cardiovascular score.",
        "Daily Cardio Load: accumulated cardiovascular strain, estimated training capacity.",
        "Fitness Index: heart rate, VO₂ max, daily steps, comparison against peer groups.",
        "AGEs Index: automatic overnight measurements for a long-term lifestyle overview.",
      ],
    } },
    { type: "callout", variant: "warning", title: { it: "Cosa NON diciamo", en: "What We're NOT Saying" }, body: { it: "Vitals non diagnostica infezioni o malattie. AGEs Index non è una previsione certa dell'invecchiamento biologico. Sono funzioni di wellness con punteggi proprietari, non strumenti diagnostici.", en: "Vitals does not diagnose infections or illnesses. AGEs Index is not a certain prediction of biological aging. These are wellness features with proprietary scores, not diagnostic tools." } },
    { type: "paragraph", text: { it: "[TBD Fase 6.4: funzioni mediche del nuovo modello specifiche (apnea notturna, ECG, pressione): paese, versione software, telefono necessario, ente regolatore, limitazioni, disponibilità Italia.]", en: "[TBD Phase 6.4: new model's specific medical features (sleep apnea, ECG, blood pressure): country, software version, required phone, regulatory body, limitations, Italy availability.]" } },

    { type: "heading", level: 2, text: { it: "Cosa resta dentro Samsung Health", en: "What Stays Inside Samsung Health" } },
    { type: "paragraph", text: { it: "Energy Score, Daily Cardio Load, Fitness Index, AGEs Index e Heart Health Score sono punteggi proprietari calcolati e mostrati da Samsung Health: non esistono come tipo di dato standard in Health Connect, quindi non hanno un equivalente esportabile 1:1. Restano visibili solo dentro l'app Samsung Health.", en: "Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, and Heart Health Score are proprietary scores calculated and displayed by Samsung Health: they don't exist as a standard Health Connect data type, so there's no directly exportable 1:1 equivalent. They remain visible only inside the Samsung Health app." } },

    { type: "heading", level: 2, text: { it: "Due percorsi distinti, non uno solo", en: "Two Distinct Paths, Not Just One" } },
    { type: "paragraph", text: { it: "FitMesh non riceve i dati del Galaxy Watch attraverso un unico canale che passa sempre per Health Connect. Dopo che un dato arriva in Samsung Health, esistono due percorsi paralleli e strutturalmente distinti verso FitMesh, con permessi diversi, superficie dati diversa, e persino priorità di fusione diverse quando entrambi riportano lo stesso valore.", en: "FitMesh doesn't receive Galaxy Watch data through a single channel that always goes via Health Connect. Once a data point reaches Samsung Health, there are two parallel, structurally distinct paths to FitMesh, with different permissions, different data surface, and even different merge priority when both report the same value." } },
    { type: "list", items: {
      it: [
        "Galaxy Watch → Samsung Health → Samsung Health Data SDK → FitMesh: canale diretto, richiede approvazione partner Samsung (package name e firma registrati), legge un sottoinsieme di tipi selezionati direttamente dall'archivio Samsung Health, senza passare da Health Connect.",
        "Galaxy Watch → Samsung Health → Health Connect → FitMesh: percorso generico dell'interoperabilità Android, lo stesso che FitMesh usa per qualunque altra sorgente compatibile (non solo Samsung), indipendente dall'approvazione Samsung.",
      ],
      en: [
        "Galaxy Watch -> Samsung Health -> Samsung Health Data SDK -> FitMesh: a direct channel, requiring Samsung partner approval (registered package name and signature), reading a selected subset of data types directly from the Samsung Health store, without going through Health Connect.",
        "Galaxy Watch -> Samsung Health -> Health Connect -> FitMesh: the generic Android interoperability path, the same one FitMesh uses for any other compatible source (not just Samsung), independent of Samsung's approval.",
      ],
    } },
    { type: "paragraph", text: { it: "Per alcune metriche (battito, sonno) il canale diretto Samsung ha la priorità quando entrambi i percorsi riportano un valore. Per altre (SpO₂, allenamenti) vince Health Connect e Samsung riempie solo i dati mancanti. Alcune metriche (pressione arteriosa, apnea notturna, composizione corporea) arrivano oggi SOLO dal canale diretto Samsung, mai da Health Connect. Nessuna di queste regole è dedotta: sono verificate nel codice di fusione di FitMesh.", en: "For some metrics (heart rate, sleep) the direct Samsung channel takes priority when both paths report a value. For others (SpO2, workouts) Health Connect wins and Samsung only fills in missing data. Some metrics (blood pressure, sleep apnea, body composition) arrive today ONLY from the direct Samsung channel, never from Health Connect. None of these rules are inferred: they're verified in FitMesh's merge code." } },

    { type: "heading", level: 2, text: { it: "La matrice verificata: dal polso a FitMesh", en: "The Verified Matrix: From the Wrist to FitMesh" } },
    { type: "paragraph", text: { it: "Due tabelle separate, non una sola. La prima segue ogni metrica attraverso quattro passaggi indipendenti: cosa Samsung Health mostra, cosa FitMesh legge via il canale diretto Samsung, cosa viene scritto in Health Connect, cosa FitMesh legge via Health Connect. Nessuna colonna è dedotta dalla precedente: un sì nella prima non implica un sì nella seconda, un sì nella terza non implica un sì nella quarta. La seconda tabella confronta i quattro sistemi coinvolti (Samsung Health, Samsung Health Data SDK, Health Connect, Google Health) come piattaforme, non come metriche.", en: "Two separate tables, not one. The first follows each metric through four independent steps: what Samsung Health displays, what FitMesh reads via the direct Samsung channel, what gets written to Health Connect, what FitMesh reads via Health Connect. No column is inferred from the previous one: a yes in the first doesn't imply a yes in the second, a yes in the third doesn't imply a yes in the fourth. The second table compares the four systems involved (Samsung Health, Samsung Health Data SDK, Health Connect, Google Health) as platforms, not as metrics." } },
    {
      type: "table",
      caption: { it: "Tabella A: disponibilità dei dati per metrica", en: "Table A: Data Availability by Metric" },
      headers: {
        it: ["Metrica", "Samsung Health", "FitMesh via Samsung SDK", "Health Connect", "FitMesh via Health Connect", "Stato"],
        en: ["Metric", "Samsung Health", "FitMesh via Samsung SDK", "Health Connect", "FitMesh via Health Connect", "Status"],
      },
      rows: [
        { it: ["Frequenza cardiaca", "Sì (presumibile) [TBD nuovo modello]", "Sì, priorità Samsung se presente", "Non documentato per questo modello [TBD]", "Sì", "Doppio percorso, Samsung ha priorità"], en: ["Heart rate", "Yes (presumed) [TBD new model]", "Yes, Samsung priority if present", "Not documented for this model [TBD]", "Yes", "Dual path, Samsung has priority"] },
        { it: ["HRV", "Sì, via Vitals [TBD nuovo modello]", "No: non esposto dall'SDK Samsung", "Non documentato per questo modello [TBD]", "Sì", "Solo via Health Connect"], en: ["HRV", "Yes, via Vitals [TBD new model]", "No: not exposed by the Samsung SDK", "Not documented for this model [TBD]", "Yes", "Health Connect only"] },
        { it: ["Sonno e fasi", "Sì [TBD nuovo modello]", "Sì, priorità Samsung (blocco intero) se presente", "Non documentato per questo modello [TBD]", "Sì", "Doppio percorso, Samsung ha priorità"], en: ["Sleep and stages", "Yes [TBD new model]", "Yes, Samsung priority (whole block) if present", "Not documented for this model [TBD]", "Yes", "Dual path, Samsung has priority"] },
        { it: ["SpO₂", "Sì, via Vitals [TBD nuovo modello]", "Sì, gap-fill (HC vince se presente)", "Non documentato per questo modello [TBD]", "Sì", "Doppio percorso, Health Connect vince"], en: ["SpO₂", "Yes, via Vitals [TBD new model]", "Yes, gap-fill (HC wins if present)", "Not documented for this model [TBD]", "Yes", "Dual path, Health Connect wins"] },
        { it: ["Frequenza respiratoria", "Sì, via Vitals [TBD nuovo modello]", "No: non esposto dall'SDK Samsung", "Non documentato per questo modello [TBD]", "Sì", "Solo via Health Connect"], en: ["Respiratory rate", "Yes, via Vitals [TBD new model]", "No: not exposed by the Samsung SDK", "Not documented for this model [TBD]", "Yes", "Health Connect only"] },
        { it: ["Temperatura cutanea", "Sì, via Vitals [TBD nuovo modello]", "Sì, gap-fill", "Non documentato per questo modello [TBD]", "No: FitMesh legge BodyTemperatureRecord (tipo diverso), non SkinTemperatureRecord", "Solo via canale diretto Samsung"], en: ["Skin temperature", "Yes, via Vitals [TBD new model]", "Yes, gap-fill", "Not documented for this model [TBD]", "No: FitMesh reads BodyTemperatureRecord (a different type), not SkinTemperatureRecord", "Direct Samsung channel only"] },
        { it: ["Allenamenti, durata e calorie", "Sì [TBD nuovo modello]", "Sì, gap-fill", "Non documentato per questo modello [TBD]", "Sì", "Doppio percorso, Health Connect vince"], en: ["Workouts, duration and calories", "Yes [TBD new model]", "Yes, gap-fill", "Not documented for this model [TBD]", "Yes", "Dual path, Health Connect wins"] },
        { it: ["GPS e percorsi", "[TBD nuovo modello]", "No: nessun campo GPS richiesto da FitMesh via SDK", "Non documentato [TBD]", "No: nessun ExerciseRoute richiesto nel codice attuale", "Non letto da FitMesh in nessun percorso"], en: ["GPS and routes", "[TBD new model]", "No: no GPS field requested by FitMesh via the SDK", "Not documented [TBD]", "No: no ExerciseRoute requested in current code", "Not read by FitMesh in either path"] },
        { it: ["VO₂ max", "Sì, via Fitness Index [TBD nuovo modello]", "No: non esposto dall'SDK Samsung", "Non documentato per questo modello [TBD]", "No: esplicitamente escluso dal codice", "Non letto da FitMesh in nessun percorso"], en: ["VO₂ max", "Yes, via Fitness Index [TBD new model]", "No: not exposed by the Samsung SDK", "Not documented for this model [TBD]", "No: explicitly excluded from the code", "Not read by FitMesh in either path"] },
        { it: ["Composizione corporea (peso/altezza/BMI)", "Sì, via Heart Health Score [TBD nuovo modello]", "Sì, gap-fill", "Non documentato [TBD]", "No: nessun BodyFatRecord/LeanBodyMass richiesto", "Solo via canale diretto Samsung"], en: ["Body composition (weight/height/BMI)", "Yes, via Heart Health Score [TBD new model]", "Yes, gap-fill", "Not documented [TBD]", "No: no BodyFatRecord/LeanBodyMass requested", "Direct Samsung channel only"] },
        { it: ["Pressione arteriosa", "[TBD nuovo modello]", "Sì, gap-fill", "Non richiesto da FitMesh via questo percorso", "No", "Solo via canale diretto Samsung"], en: ["Blood pressure", "[TBD new model]", "Yes, gap-fill", "Not requested by FitMesh via this path", "No", "Direct Samsung channel only"] },
        { it: ["Apnea notturna (rilevamento)", "Sì (presumibile) [TBD nuovo modello]", "Sì, priorità Samsung, solo flag booleano (non dato grezzo)", "Non un tipo di dato Health Connect", "No", "Solo via canale diretto Samsung, solo come flag"], en: ["Sleep apnea (detection)", "Yes (presumed) [TBD new model]", "Yes, Samsung priority, boolean flag only (not raw data)", "Not a Health Connect data type", "No", "Direct Samsung channel only, flag only"] },
        { it: ["ECG", "[TBD nuovo modello]", "No", "[TBD nuovo modello]", "No", "Non letto da FitMesh in nessun percorso"], en: ["ECG", "[TBD new model]", "No", "[TBD new model]", "No", "Not read by FitMesh in either path"] },
        { it: ["Zone di frequenza cardiaca dedicate", "[TBD nuovo modello]", "No", "No", "No", "Non implementato in FitMesh"], en: ["Dedicated heart-rate zones", "[TBD new model]", "No", "No", "No", "Not implemented in FitMesh"] },
        { it: ["Punteggi proprietari Samsung (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Antioxidant Index, Heart Health Score, Hearing Health)", "Sì", "No: sono calcoli interni Samsung Health, non un tipo di dato SDK", "Nessun equivalente diretto", "No", "Restano dentro Samsung Health, non replicabili da FitMesh"], en: ["Samsung proprietary scores (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Antioxidant Index, Heart Health Score, Hearing Health)", "Yes", "No: they're internal Samsung Health calculations, not an SDK data type", "No direct equivalent", "No", "Stay inside Samsung Health, not replicable by FitMesh"] },
      ],
    },
    {
      type: "table",
      caption: { it: "Tabella B: differenza tra le piattaforme", en: "Table B: Difference Between the Platforms" },
      headers: {
        it: ["Sistema", "Dove opera", "Funzione", "Relazione con Galaxy Watch", "Uso attuale in FitMesh"],
        en: ["System", "Where It Operates", "Function", "Relationship to Galaxy Watch", "Current Use in FitMesh"],
      },
      rows: [
        { it: ["Samsung Health", "App e store dati Samsung", "Hub che riceve e mostra tutti i dati del Galaxy Watch", "Diretto: è l'app companion del Watch", "Non letto direttamente da FitMesh: è il livello sorgente, non un'API"], en: ["Samsung Health", "Samsung app and data store", "Hub that receives and displays all Galaxy Watch data", "Direct: it's the Watch's companion app", "Not read directly by FitMesh: it's the source layer, not an API"] },
        { it: ["Samsung Health Data SDK", "SDK Android, richiede approvazione partner Samsung", "Accesso diretto in lettura a un set selezionato di tipi dati dell'archivio Samsung Health", "Diretto tramite l'app Samsung Health, non tramite il Watch direttamente", "Sì, per i tipi verificati nel codice: battito, sonno, SpO₂, temperatura cutanea, allenamenti, composizione corporea, pressione, apnea (vedi Tabella A)"], en: ["Samsung Health Data SDK", "Android SDK, requires Samsung partner approval", "Direct read access to a selected set of data types from the Samsung Health store", "Direct via the Samsung Health app, not via the Watch directly", "Yes, for the types verified in code: heart rate, sleep, SpO2, skin temperature, workouts, body composition, blood pressure, apnea (see Table A)"] },
        { it: ["Health Connect", "Store di interoperabilità on-device Android, di Google", "Scambio dati generico tra app, indipendente dal produttore", "Samsung Health può scrivervi dati (non documentato per il nuovo modello specifico)", "Sì, per i tipi supportati: battito, HRV, sonno, SpO₂, frequenza respiratoria, allenamenti (vedi Tabella A)"], en: ["Health Connect", "Google's on-device Android interoperability store", "Generic data exchange between apps, manufacturer-independent", "Samsung Health can write data to it (not documented for this specific new model)", "Yes, for the supported types: heart rate, HRV, sleep, SpO2, respiratory rate, workouts (see Table A)"] },
        { it: ["Google Health API", "API cloud, richiede OAuth", "Evoluzione della Fitbit Web API: gestione dati salute/fitness da Fitbit, Pixel Watch e altri dispositivi/app terze su un'infrastruttura unificata", "Nessun percorso automatico dichiarato dalla documentazione ufficiale verso i dati Galaxy Watch: Samsung non è nominata come fonte", "Non dichiarato integrato: nessun codice FitMesh la richiama oggi"], en: ["Google Health API", "Cloud API, requires OAuth", "Evolution of the Fitbit Web API: managing health/fitness data from Fitbit, Pixel Watch and other third-party devices/apps on a unified infrastructure", "No automatic path to Galaxy Watch data declared in the official documentation: Samsung isn't named as a source", "Not declared integrated: no FitMesh code calls it today"] },
        { it: ["Google Health (app consumer)", "App consumer Google, distinta dall'API", "Esperienza salute/fitness per l'utente finale, erede dell'app Fitbit", "Non sostituisce Samsung Health; nessuna relazione diretta con Galaxy Watch documentata", "Non è una sorgente dati automatica per FitMesh: prodotto separato dall'API sopra"], en: ["Google Health (consumer app)", "Google consumer app, distinct from the API", "End-user health/fitness experience, successor to the Fitbit app", "Doesn't replace Samsung Health; no direct relationship with Galaxy Watch documented", "Not an automatic data source for FitMesh: a separate product from the API above"] },
      ],
    },

    { type: "heading", level: 2, text: { it: "Samsung Health, Health Connect e Google Health non sono la stessa cosa", en: "Samsung Health, Health Connect and Google Health Are Not the Same" } },
    { type: "list", items: {
      it: [
        "Samsung Health è l'app e lo store in cui confluiscono i dati del Galaxy Watch: è il punto di partenza di entrambi i percorsi verso FitMesh, non un'API in sé.",
        "Il Samsung Health Data SDK permette ad app partner approvate (come FitMesh) di leggere direttamente tipi di dato selezionati dall'archivio Samsung Health, previa registrazione di package name e firma presso Samsung.",
        "Health Connect è lo store di interoperabilità on-device di Android, gestito da Google: qualunque app può scrivervi o leggervi dati con il permesso dell'utente, indipendentemente dal produttore del dispositivo.",
        "La Google Health API è l'evoluzione della Fitbit Web API su un'infrastruttura Google unificata: non è la stessa cosa di Health Connect, e la documentazione ufficiale non dichiara una relazione esplicita tra le due.",
        "La Google Health API non sostituisce Health Connect: sono due sistemi Google distinti, con scopi e meccanismi di accesso diversi (API cloud OAuth contro store on-device).",
        "La Google Health API non riceve automaticamente i dati del Galaxy Watch: la documentazione ufficiale cita Fitbit, Pixel Watch e dispositivi/app terze generiche, senza nominare Samsung come fonte.",
        "La nuova app consumer Google Health è un prodotto distinto dalla Google Health API: la prima è l'esperienza per l'utente finale, la seconda è l'infrastruttura per gli sviluppatori.",
        "FitMesh non va descritto come integrato con la Google Health API finché non esiste un flusso verificato nel codice: oggi nessun file del repository la richiama.",
        "In sintesi: quattro sistemi distinti (Samsung Health, Samsung Health Data SDK, Health Connect, Google Health), non sinonimi intercambiabili, con implicazioni diverse per [quali dati FitMesh riesce davvero a leggere](/it/fitness-data-sync).",
      ],
      en: [
        "Samsung Health is the app and store where Galaxy Watch data lands first: it's the starting point of both paths to FitMesh, not an API in itself.",
        "The Samsung Health Data SDK lets approved partner apps (like FitMesh) read selected data types directly from the Samsung Health store, after registering a package name and signature with Samsung.",
        "Health Connect is Android's on-device interoperability store, run by Google: any app can write to or read from it with user permission, regardless of device manufacturer.",
        "The Google Health API is the evolution of the Fitbit Web API on a unified Google infrastructure: it is not the same thing as Health Connect, and the official documentation doesn't declare an explicit relationship between the two.",
        "The Google Health API doesn't replace Health Connect: they're two distinct Google systems, with different purposes and access mechanisms (cloud OAuth API versus on-device store).",
        "The Google Health API doesn't automatically receive Galaxy Watch data: the official documentation cites Fitbit, Pixel Watch, and generic third-party devices/apps, without naming Samsung as a source.",
        "The new consumer Google Health app is a distinct product from the Google Health API: the former is the end-user experience, the latter is the developer infrastructure.",
        "FitMesh shouldn't be described as integrated with the Google Health API until a verified code path exists: no file in the repository calls it today.",
        "In short: four distinct systems (Samsung Health, Samsung Health Data SDK, Health Connect, Google Health), not interchangeable synonyms, with different implications for [which data FitMesh can actually read](/en/fitness-data-sync).",
      ],
    } },

    { type: "heading", level: 2, text: { it: "Cosa può leggere FitMesh oggi", en: "What FitMesh Can Read Today" } },
    { type: "paragraph", text: { it: "FitMesh legge dati del Galaxy Watch attraverso due percorsi paralleli, non uno con un'eccezione. Via Health Connect: battito, HRV, sonno, SpO₂, frequenza respiratoria, allenamenti e calorie, una volta concessi i permessi. Via il canale diretto Samsung Health Data SDK (approvazione partner già ottenuta): battito e sonno con priorità sul dato Health Connect, più SpO₂, temperatura cutanea, allenamenti, composizione corporea, pressione arteriosa e apnea notturna (quest'ultima solo come flag booleano, non come dato grezzo) disponibili SOLO da questo canale. FitMesh non replica nessun punteggio proprietario Samsung (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Antioxidant Index, Heart Health Score, Hearing Health): non esistono come tipo di dato in nessuno dei due percorsi, quindi non c'è nulla da leggere.", en: "FitMesh reads Galaxy Watch data through two parallel paths, not one with an exception. Via Health Connect: heart rate, HRV, sleep, SpO2, respiratory rate, workouts, and calories, once permissions are granted. Via the direct Samsung Health Data SDK channel (partner approval already obtained): heart rate and sleep with priority over the Health Connect value, plus SpO2, skin temperature, workouts, body composition, blood pressure, and sleep apnea (the latter only as a boolean flag, not raw data) available ONLY from this channel. FitMesh doesn't replicate any proprietary Samsung score (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Antioxidant Index, Heart Health Score, Hearing Health): they don't exist as a data type in either path, so there's nothing to read." } },

    { type: "heading", level: 2, text: { it: "Dato grezzo vs punteggio proprietario", en: "Raw Data vs. Proprietary Score" } },
    { type: "paragraph", text: { it: "Un dato grezzo (battito, HRV, ore di sonno) è un valore misurato direttamente, con un'unità di misura standard, esportabile come tale. Un punteggio proprietario (Fitness Index, Daily Cardio Load, Energy Score) è un calcolo derivato che combina più dati grezzi con una formula non pubblica di Samsung: due app diverse possono ricevere lo stesso dato grezzo ma non potranno mai calcolare lo stesso punteggio proprietario, perché la formula non è documentata pubblicamente.", en: "A raw data point (heart rate, HRV, hours of sleep) is a directly measured value, with a standard unit, exportable as-is. A proprietary score (Fitness Index, Daily Cardio Load, Energy Score) is a derived calculation combining multiple raw data points with a non-public Samsung formula: two different apps can receive the same raw data but can never compute the same proprietary score, because the formula isn't publicly documented." } },

    { type: "heading", level: 2, text: { it: "Compatibilità e requisiti Android", en: "Compatibility and Android Requirements" } },
    { type: "paragraph", text: { it: "Health Connect è disponibile solo su Android: questa analisi di compatibilità con FitMesh riguarda esclusivamente il percorso Android. [TBD: requisiti versione One UI/Samsung Health per il nuovo modello, verificare dopo l'evento.]", en: "Health Connect is Android-only: this FitMesh compatibility analysis covers exclusively the Android path. [TBD: One UI/Samsung Health version requirements for the new model, verify after the event.]" } },

    { type: "heading", level: 2, text: { it: "Limiti e funzioni da verificare dopo la disponibilità reale", en: "Limits and Features to Verify After Real Availability" } },
    { type: "list", items: {
      it: [
        "[TBD] Se Samsung dichiara esplicitamente quali metriche del nuovo modello sono scritte in Health Connect (oggi non documentato per nessun modello specifico).",
        "[TBD] Disponibilità regionale di ciascuna funzione salute (specialmente quelle regolamentate).",
        "[TBD] Se FitMesh ottiene un device di test fisico per verificare empiricamente il comportamento reale (non solo teorico) di Health Connect su questo modello.",
      ],
      en: [
        "[TBD] Whether Samsung explicitly states which of the new model's metrics are written to Health Connect (today not documented for any specific model).",
        "[TBD] Regional availability of each health feature (especially regulated ones).",
        "[TBD] Whether FitMesh obtains a physical test device to empirically verify (not just theoretical) Health Connect behavior on this model.",
      ],
    } },

    { type: "cta", title: { it: "Verifica quali dati del tuo Galaxy Watch sono compatibili con FitMesh", en: "Check Which Data from Your Galaxy Watch Is Compatible with FitMesh" }, body: { it: "Collega il tuo Galaxy Watch via Samsung Health e Health Connect e vedi in tempo reale quali metriche standard arrivano davvero sulla tua dashboard.", en: "Connect your Galaxy Watch via Samsung Health and Health Connect and see in real time which standard metrics actually reach your dashboard." }, ctaLabel: { it: "Collega il tuo Galaxy Watch", en: "Connect Your Galaxy Watch" }, ctaHref: { it: "/it/sync/galaxy-watch", en: "/en/sync/galaxy-watch" } },

    { type: "heading", level: 2, text: { it: "Fonti e cronologia degli aggiornamenti", en: "Sources and Update History" } },
    { type: "paragraph", text: { it: "Le fonti primarie citate in questo articolo sono elencate anche nei dati strutturati della pagina. Verificate live prima della pubblicazione: comunicato Samsung Newsroom sulle nuove funzioni Samsung Health e documentazione ufficiale Android su Health Connect. Le affermazioni sul comportamento di FitMesh sono verificate direttamente nel codice sorgente dell'app, non dedotte dalla documentazione Samsung o Google.", en: "The primary sources cited in this article are also listed in the page's structured data. Verified live before publication: the Samsung Newsroom announcement on new Samsung Health features and the official Android documentation on Health Connect. Claims about FitMesh's behavior are verified directly in the app's source code, not inferred from Samsung or Google documentation." } },
    { type: "paragraph", text: { it: "Cronologia: prima pubblicazione alla data indicata sopra. Eventuali aggiornamenti successivi (nome prodotto, specifiche, disponibilità regionale) saranno registrati qui con la data della modifica.", en: "History: first published on the date shown above. Any subsequent updates (product name, specs, regional availability) will be logged here with the date of the change." } },
  ],
  faq: [
    { q: { it: "Il nuovo Galaxy Watch usa Snapdragon Wear Elite?", en: "Does the New Galaxy Watch Use Snapdragon Wear Elite?" }, a: { it: "[TBD post-evento] Qualcomm conferma che Snapdragon Wear Elite esiste per Wear OS, ma questo non dimostra che Samsung lo abbia adottato su questo modello: lo diciamo solo se Samsung lo conferma esplicitamente.", en: "[TBD post-event] Qualcomm confirms Snapdragon Wear Elite exists for Wear OS, but that doesn't prove Samsung adopted it on this model: we state it only if Samsung explicitly confirms it." } },
    { q: { it: "Quali nuove funzioni salute introduce?", en: "What New Health Features Does It Introduce?" }, a: { it: "Samsung ha già annunciato Vitals, Heart Health Score, Daily Cardio Load, Fitness Index e AGEs Index, disponibili prima su questo Galaxy Watch rispetto ai modelli precedenti.", en: "Samsung already announced Vitals, Heart Health Score, Daily Cardio Load, Fitness Index, and AGEs Index, available first on this Galaxy Watch compared to previous models." } },
    { q: { it: "Vitals può diagnosticare una malattia?", en: "Can Vitals Diagnose an Illness?" }, a: { it: "No. Vitals confronta 5 segnali notturni con la tua baseline personale per segnalare deviazioni: è una funzione di wellness, non uno strumento diagnostico.", en: "No. Vitals compares 5 overnight signals against your personal baseline to flag deviations: it's a wellness feature, not a diagnostic tool." } },
    { q: { it: "Il Galaxy Watch esporta il VO₂ max in Health Connect?", en: "Does the Galaxy Watch Export VO₂ Max to Health Connect?" }, a: { it: "Health Connect supporta un tipo di dato VO₂ max (Vo2MaxRecord), ma questo non dimostra che Samsung lo scriva da questo modello [TBD post-evento]. In ogni caso, FitMesh non legge VO₂ max dal percorso Health Connect indipendentemente da questo.", en: "Health Connect supports a VO₂ max data type (Vo2MaxRecord), but that doesn't prove Samsung writes it from this model [TBD post-event]. Either way, FitMesh doesn't read VO₂ max via the Health Connect path regardless." } },
    { q: { it: "FitMesh supporta il nuovo Galaxy Watch?", en: "Does FitMesh Support the New Galaxy Watch?" }, a: { it: "FitMesh legge le metriche standard che il Galaxy Watch scrive in Health Connect (battito, HRV, SpO₂, sonno, allenamenti, calorie), non i punteggi proprietari Samsung. Non c'è un'integrazione diretta con il dispositivo, con una parziale eccezione per l'apnea notturna (flag booleano via canale diretto Samsung Health).", en: "FitMesh reads the standard metrics the Galaxy Watch writes to Health Connect (heart rate, HRV, SpO₂, sleep, workouts, calories), not Samsung's proprietary scores. There's no direct integration with the device, with a partial exception for sleep apnea (boolean flag via a direct Samsung Health channel)." } },
    { q: { it: "Se Samsung Health mostra una funzione, significa che è disponibile anche fuori dall'app?", en: "If Samsung Health Shows a Feature, Does That Mean It's Available Outside the App?" }, a: { it: "No. Sono tre passaggi separati: cosa il watch misura, cosa Samsung Health mostra, e cosa viene scritto in Health Connect. Una funzione visibile in Samsung Health può restare un calcolo interno all'app senza mai diventare un tipo di dato esportabile: è il caso di quasi tutti i punteggi proprietari citati in questo articolo.", en: "No. These are three separate steps: what the watch measures, what Samsung Health displays, and what gets written to Health Connect. A feature visible in Samsung Health can remain an internal app calculation without ever becoming an exportable data type: that's the case for nearly all the proprietary scores mentioned in this article." } },
    { q: { it: "Energy Score è disponibile fuori da Samsung Health?", en: "Is Energy Score Available Outside Samsung Health?" }, a: { it: "[TBD post-evento: da verificare su Samsung Support/documentazione ufficiale]", en: "[TBD post-event: to verify against Samsung Support/official documentation]" } },
    { q: { it: "Serve uno smartphone Samsung?", en: "Do I Need a Samsung Smartphone?" }, a: { it: "[TBD post-evento: verificare requisiti Samsung Health per il nuovo modello]", en: "[TBD post-event: verify Samsung Health requirements for the new model]" } },
    { q: { it: "Quali funzioni sono disponibili in Italia?", en: "Which Features Are Available in Italy?" }, a: { it: "[TBD post-evento: verificare limitazioni territoriali per ciascuna funzione, specialmente quelle regolamentate]", en: "[TBD post-event: verify territorial limitations for each feature, especially regulated ones]" } },
  ],
  related: [
    "come-funziona-health-connect",
    "anello-vs-smartwatch",
    "health-connect-vs-samsung-health",
    "guida-sync-wearable-2026",
    "google-health-google-fit",
    "google-fit-api-dismissione-2026",
  ],
  sources: [
    "https://news.samsung.com/global/samsung-introduces-next-gen-galaxy-watch-features-for-ai-powered-everyday-health-companion",
    "https://news.samsung.com/uk/samsung-introduces-next-gen-galaxy-watch-features-for-ai-powered-everyday-health-companion",
    "https://news.samsung.com/it/in-arrivo-un-nuovo-alleato-per-il-benessere-al-polso-potenziato-dallai",
    "https://developer.android.com/health-and-fitness/health-connect/data-types",
    "https://developer.samsung.com/health/data/overview.html",
    "https://developer.samsung.com/health/data/process.html",
    "https://developers.google.com/health",
  ],
  brandsMentioned: ["Samsung", "Qualcomm"],
  ldType: "BlogPosting",
};
