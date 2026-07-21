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

    { type: "heading", level: 2, text: { it: "Cosa viene scritto in Health Connect", en: "What Gets Written to Health Connect" } },
    { type: "paragraph", text: { it: "Regola fondamentale: il fatto che Health Connect supporti un tipo di record non dimostra che Samsung lo scriva da questo modello specifico. Dove manca una prova esplicita per il nuovo Galaxy Watch, la matrice sotto riporta \"non documentato\", non un'ipotesi.", en: "Fundamental rule: the fact that Health Connect supports a record type doesn't prove Samsung writes it from this specific model. Where explicit proof for the new Galaxy Watch is missing, the matrix below reads \"not documented\", not a guess." } },

    { type: "heading", level: 2, text: { it: "La matrice verificata: dal polso a FitMesh", en: "The Verified Matrix: From the Wrist to FitMesh" } },
    { type: "paragraph", text: { it: "Ogni riga separa cinque passaggi indipendenti, verificati uno per uno: cosa il watch misura fisicamente, cosa Samsung Health mostra nell'app, cosa viene effettivamente scritto in Health Connect, cosa FitMesh legge oggi, e la fonte o il limite di ciascuna affermazione. Nessuna colonna viene dedotta dalla precedente: un sì nella seconda non implica un sì nella terza, un sì nella terza non implica un sì nella quarta.", en: "Each row separates five independent, individually verified steps: what the watch physically measures, what Samsung Health displays in the app, what actually gets written to Health Connect, what FitMesh reads today, and the source or limitation behind each claim. No column is inferred from the previous one: a yes in the second doesn't imply a yes in the third, and a yes in the third doesn't imply a yes in the fourth." } },
    {
      type: "table",
      caption: { it: "Metrica/funzione, dove vive il dato, e cosa legge davvero FitMesh oggi", en: "Metric/feature, where the data lives, and what FitMesh actually reads today" },
      headers: {
        it: ["Metrica o funzione", "Misurata dal watch", "Visibile in Samsung Health", "Scritta in Health Connect", "Letta oggi da FitMesh", "Stato/fonte"],
        en: ["Metric or feature", "Measured by the watch", "Visible in Samsung Health", "Written to Health Connect", "Read today by FitMesh", "Status/source"],
      },
      rows: [
        { it: ["Frequenza cardiaca", "[TBD]", "Sì (presumibile)", "Non documentato per questo modello [TBD]", "Sì", "Standard: HeartRateRecord, letto in health_repository.dart"], en: ["Heart rate", "[TBD]", "Yes (presumed)", "Not documented for this model [TBD]", "Yes", "Standard: HeartRateRecord, read in health_repository.dart"] },
        { it: ["HRV", "[TBD]", "Sì (presumibile, via Vitals)", "Non documentato per questo modello [TBD]", "Sì", "Standard: HeartRateVariabilityRmssdRecord"], en: ["HRV", "[TBD]", "Yes (presumed, via Vitals)", "Not documented for this model [TBD]", "Yes", "Standard: HeartRateVariabilityRmssdRecord"] },
        { it: ["Sonno e fasi", "[TBD]", "Sì (presumibile)", "Non documentato per questo modello [TBD]", "Sì", "Standard: SleepSessionRecord"], en: ["Sleep and stages", "[TBD]", "Yes (presumed)", "Not documented for this model [TBD]", "Yes", "Standard: SleepSessionRecord"] },
        { it: ["SpO₂", "[TBD]", "Sì (presumibile, via Vitals)", "Non documentato per questo modello [TBD]", "Sì", "Standard: OxygenSaturationRecord"], en: ["SpO₂", "[TBD]", "Yes (presumed, via Vitals)", "Not documented for this model [TBD]", "Yes", "Standard: OxygenSaturationRecord"] },
        { it: ["Frequenza respiratoria", "[TBD]", "Sì (presumibile, via Vitals)", "Non documentato per questo modello [TBD]", "Sì", "Standard: RespiratoryRateRecord, letto in health_repository.dart"], en: ["Respiratory rate", "[TBD]", "Yes (presumed, via Vitals)", "Not documented for this model [TBD]", "Yes", "Standard: RespiratoryRateRecord, read in health_repository.dart"] },
        { it: ["Temperatura cutanea", "[TBD]", "Sì (presumibile, via Vitals)", "Non documentato per questo modello [TBD]", "No: FitMesh legge BodyTemperatureRecord (tipo diverso), non SkinTemperatureRecord", "Standard, ma non letto da FitMesh oggi"], en: ["Skin temperature", "[TBD]", "Yes (presumed, via Vitals)", "Not documented for this model [TBD]", "No: FitMesh reads BodyTemperatureRecord (a different type), not SkinTemperatureRecord", "Standard, but not read by FitMesh today"] },
        { it: ["Allenamenti", "[TBD]", "Sì (presumibile)", "Non documentato per questo modello [TBD]", "Sì", "Standard: ExerciseSessionRecord"], en: ["Workouts", "[TBD]", "Yes (presumed)", "Not documented for this model [TBD]", "Yes", "Standard: ExerciseSessionRecord"] },
        { it: ["Durata e calorie (allenamento)", "[TBD]", "Sì (presumibile)", "Non documentato per questo modello [TBD]", "Sì", "Standard: ActiveCaloriesBurnedRecord/TotalCaloriesBurnedRecord, letti in health_repository.dart"], en: ["Duration and calories (workout)", "[TBD]", "Yes (presumed)", "Not documented for this model [TBD]", "Yes", "Standard: ActiveCaloriesBurnedRecord/TotalCaloriesBurnedRecord, read in health_repository.dart"] },
        { it: ["GPS e percorsi", "[TBD]", "[TBD]", "Non documentato [TBD]", "No: nessun ExerciseRoute/GPS richiesto nel codice attuale", "Non letto da FitMesh"], en: ["GPS and routes", "[TBD]", "[TBD]", "Not documented [TBD]", "No: no ExerciseRoute/GPS requested in current code", "Not read by FitMesh"] },
        { it: ["VO₂ max", "[TBD]", "Sì (via Fitness Index)", "Non documentato per questo modello [TBD]", "No: esplicitamente escluso dal percorso Health Connect", "Standard, ma non letto da FitMesh"], en: ["VO₂ max", "[TBD]", "Yes (via Fitness Index)", "Not documented for this model [TBD]", "No: explicitly excluded from the Health Connect path", "Standard, but not read by FitMesh"] },
        { it: ["Composizione corporea (BIA)", "[TBD]", "Sì (presumibile, via Heart Health Score)", "Non documentato [TBD]", "No: nessun BodyFatRecord/LeanBodyMass richiesto nel codice attuale", "Non letto da FitMesh"], en: ["Body composition (BIA)", "[TBD]", "Yes (presumed, via Heart Health Score)", "Not documented [TBD]", "No: no BodyFatRecord/LeanBodyMass requested in current code", "Not read by FitMesh"] },
        { it: ["Energy Score", "[TBD]", "Sì", "Nessun equivalente diretto", "No", "Proprietario Samsung"], en: ["Energy Score", "[TBD]", "Yes", "No direct equivalent", "No", "Proprietary Samsung"] },
        { it: ["Apnea notturna (rilevamento)", "[TBD]", "Sì (presumibile)", "Non documentato: se disponibile a FitMesh, arriva da un canale SDK Samsung Health diretto, non da Health Connect", "Solo come flag booleano, via un canale diretto separato (non il percorso Health Connect ordinario)", "Verificato nel codice: `samsungSleepApneaDetected`, canale diretto Samsung Health SDK"], en: ["Sleep apnea (detection)", "[TBD]", "Yes (presumed)", "Not documented: if available to FitMesh, it comes via a direct Samsung Health SDK channel, not Health Connect", "Only as a boolean flag, via a separate direct channel (not the ordinary Health Connect path)", "Verified in code: `samsungSleepApneaDetected`, direct Samsung Health SDK channel"] },
        { it: ["Carico di allenamento (Daily Cardio Load)", "[TBD]", "Sì", "Nessun equivalente diretto", "No", "Proprietario Samsung"], en: ["Training load (Daily Cardio Load)", "[TBD]", "Yes", "No direct equivalent", "No", "Proprietary Samsung"] },
        { it: ["Fitness Index", "[TBD]", "Sì", "Nessun equivalente diretto", "No", "Proprietario Samsung"], en: ["Fitness Index", "[TBD]", "Yes", "No direct equivalent", "No", "Proprietary Samsung"] },
        { it: ["AGEs Index", "[TBD]", "Sì", "Nessun equivalente diretto", "No", "Proprietario Samsung"], en: ["AGEs Index", "[TBD]", "Yes", "No direct equivalent", "No", "Proprietary Samsung"] },
        { it: ["Heart Health Score", "[TBD]", "Sì", "Nessun equivalente diretto", "No", "Proprietario Samsung"], en: ["Heart Health Score", "[TBD]", "Yes", "No direct equivalent", "No", "Proprietary Samsung"] },
      ],
    },

    { type: "heading", level: 2, text: { it: "Cosa può leggere FitMesh oggi", en: "What FitMesh Can Read Today" } },
    { type: "paragraph", text: { it: "Il percorso ordinario è Galaxy Watch → Samsung Health/Health Connect → FitMesh: non esiste un'integrazione diretta di FitMesh col Galaxy Watch per le metriche standard. FitMesh legge battito, HRV, sonno, SpO₂, allenamenti e calorie una volta concessi i permessi Health Connect. Un'eccezione parziale è il rilevamento dell'apnea notturna, letto tramite un canale diretto verso l'SDK Samsung Health (non Health Connect) come semplice flag sì/no, non come dato grezzo. FitMesh non replica nessun punteggio proprietario Samsung (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score): non esistono come tipo di dato standard, quindi non c'è nulla da leggere.", en: "The ordinary path is Galaxy Watch → Samsung Health/Health Connect → FitMesh: there's no direct FitMesh-to-Galaxy-Watch integration for standard metrics. FitMesh reads heart rate, HRV, sleep, SpO₂, workouts, and calories once Health Connect permissions are granted. A partial exception is sleep apnea detection, read through a direct channel to the Samsung Health SDK (not Health Connect) as a simple yes/no flag, not raw data. FitMesh doesn't replicate any proprietary Samsung score (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score): they don't exist as a standard data type, so there's nothing to read." } },

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
  ],
  sources: [
    "https://news.samsung.com/global/samsung-introduces-next-gen-galaxy-watch-features-for-ai-powered-everyday-health-companion",
    "https://developer.android.com/health-and-fitness/health-connect/data-types",
  ],
  brandsMentioned: ["Samsung", "Qualcomm"],
  ldType: "BlogPosting",
};
