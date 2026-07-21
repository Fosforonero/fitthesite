/**
 * FitMesh Labs: Calcolatore Efficienza del Sonno. Contenuto sorgente IT
 * scritto a mano, inglese tradotto a mano (stesso approccio manuale già
 * documentato in lib/labs/hrv/content.ts per la Fase 0 Founder: la pipeline
 * Ollama locale prevista da AGENTS.md ha prodotto corruzioni severe su
 * questo tipo di copy tecnico in un tentativo precedente nella stessa
 * sessione - testo non tradotto lasciato in altre lingue, caratteri cinesi
 * misti in portoghese, placeholder non ripristinati - quindi qui si è
 * scelto direttamente il percorso manuale invece di ripetere il tentativo).
 *
 * Fonti citate (verificate live via ricerca web durante lo sviluppo, non a
 * memoria):
 *  - Reed DL, Sacco WP. "Measuring sleep efficiency: what should the
 *    denominator be?" J Clin Sleep Med 2016;12(2):263-266. PMID 26194727.
 *    DOI 10.5664/jcsm.5498. (fonte primaria sull'ambiguità del denominatore
 *    "tempo a letto" - la stessa ambiguità che questo tool dichiara
 *    esplicitamente di risolvere con la propria definizione operativa,
 *    vedi sezione Limiti)
 *  - Buysse DJ, Reynolds CF, Monk TH, Berman SR, Kupfer DJ. "The Pittsburgh
 *    Sleep Quality Index: a new instrument for psychiatric practice and
 *    research." Psychiatry Res 1989;28(2):193-213. PMID 2748771.
 *    DOI 10.1016/0165-1781(89)90047-4.
 *  - Iber C, Ancoli-Israel S, Chesson AL, Quan SF. The AASM Manual for the
 *    Scoring of Sleep and Associated Events: Rules, Terminology and
 *    Technical Specifications. Westchester, IL: American Academy of Sleep
 *    Medicine; 2007.
 *
 * Nessun medical reviewer inventato: revisione tecnico-editoriale
 * (formule + fonti + guardrail automatico), non medica - perché non esiste.
 */

import type { LabsText, LabsTextList } from "@/lib/labs/registry";
import { liveLabsToolByKey } from "@/lib/labs/registry";

export const METHODOLOGY_VERSION = liveLabsToolByKey("sleep-efficiency").methodologyVersion;
export const LAST_REVIEWED = liveLabsToolByKey("sleep-efficiency").lastRevised;
export const PUBLISHED_AT = "2026-07-17";

interface ProseSectionContent {
  heading: LabsText;
  paragraphs: LabsTextList;
}

export interface SleepEfficiencyFaqEntry {
  question: LabsText;
  answer: LabsText;
}

export interface SleepEfficiencySourceEntry {
  title: LabsText;
  authorOrOrg: LabsText;
  year: string;
  url: string;
  verifiedOn: LabsText;
}

export interface SleepEfficiencyToolContent {
  metaTitle: LabsText;
  metaDescription: LabsText;
  heroKicker: LabsText;
  heroTitle: LabsText;
  heroSubtitle: LabsText;
  directAnswer: LabsTextList;
  sections: {
    whatIsSleepEfficiency: ProseSectionContent;
    simpleVsAdvanced: ProseSectionContent;
    midnightAndMethodology: ProseSectionContent;
    workedExample: ProseSectionContent;
    limits: ProseSectionContent;
    privacy: ProseSectionContent;
  };
  faq: SleepEfficiencyFaqEntry[];
  sources: SleepEfficiencySourceEntry[];
  /** Versione testuale della formula (mai HTML KaTeX serializzato) - per meta/JSON-LD. */
  formulaPlainText: LabsText;
  formulaHeading: LabsText;
  formulaExplanation: LabsText;
  citationHeading: LabsText;
  citationText: LabsText;
  copyLabel: LabsText;
  copiedLabel: LabsText;
  ctaHeading: LabsText;
  ctaBody: LabsText;
  ctaLabel: LabsText;
  relatedToolsHeading: LabsText;
  breadcrumbHome: LabsText;
  breadcrumbLabs: LabsText;
  sourcesHeading: LabsText;
  faqHeading: LabsText;
  revisionLabel: LabsText;
  revisionMethodologyLabel: LabsText;
  revisionReviewedLabel: LabsText;
  calculatorLabels: {
    modeLabel: LabsText;
    modeSimple: LabsText;
    modeAdvanced: LabsText;
    sampleDataButton: LabsText;
    resetButton: LabsText;
    hoursUnit: LabsText;
    minutesUnit: LabsText;
    simpleTimeInBedLabel: LabsText;
    simpleTotalSleepLabel: LabsText;
    advancedBedTimeLabel: LabsText;
    advancedOutOfBedTimeLabel: LabsText;
    advancedLatencyLabel: LabsText;
    advancedWasoLabel: LabsText;
    advancedFinalWakeLabel: LabsText;
    amLabel: LabsText;
    pmLabel: LabsText;
    formatToggleLabel: LabsText;
    /** Nomi accessibili contestuali (P1.1B Fase 1): mai riusare hoursUnit/minutesUnit come aria-label duplicato. */
    simpleTimeInBedHoursLabel: LabsText;
    simpleTimeInBedMinutesLabel: LabsText;
    simpleTotalSleepHoursLabel: LabsText;
    simpleTotalSleepMinutesLabel: LabsText;
    advancedBedHourLabel: LabsText;
    advancedBedMinuteLabel: LabsText;
    advancedBedAmPmLabel: LabsText;
    advancedOutHourLabel: LabsText;
    advancedOutMinuteLabel: LabsText;
    advancedOutAmPmLabel: LabsText;
    resultsHeading: LabsText;
    resultEfficiency: LabsText;
    resultTotalSleep: LabsText;
    resultTimeInBed: LabsText;
    resultTotalAwake: LabsText;
    resultLatency: LabsText;
    resultWaso: LabsText;
    resultFinalWake: LabsText;
    nightBreakdownHeading: LabsText;
    copyResultsButton: LabsText;
    copiedButton: LabsText;
    downloadCsvButton: LabsText;
    noResultsYet: LabsText;
    errorMissingField: LabsText;
    errorNegativeValue: LabsText;
    errorTimeOutOfRange: LabsText;
    errorMinutesOutOfRange: LabsText;
    errorTimeInBedZero: LabsText;
    /** P1.1B Fase 3: erano warning, ora errori bloccanti (fisiologicamente impossibili, non solo insoliti). */
    errorSleepExceedsTimeInBed: LabsText;
    errorNegativeDerivedSleepTime: LabsText;
    errorEfficiencyOutOfRange: LabsText;
    warningShortTimeInBed: LabsText;
    warningLongTimeInBed: LabsText;
    crossedMidnightNote: LabsText;
  };
}

export const SLEEP_EFFICIENCY_TOOL_CONTENT: SleepEfficiencyToolContent = {
  metaTitle: {
    it: "Calcolatore efficienza del sonno: formula e calcolo online",
    en: "Sleep Efficiency Calculator: Formula & Online Calculation",
  },
  metaDescription: {
    it: "Calcola la tua efficienza del sonno da tempo a letto e tempo dormito, in modalità semplice o avanzata. Formula, esempio e metodologia. Calcolo nel browser, nessun dato inviato.",
    en: "Calculate your sleep efficiency from time in bed and time asleep, in simple or advanced mode. Formula, worked example, and methodology. Calculated in your browser, nothing sent anywhere.",
  },
  heroKicker: { it: "FitMesh Labs · Sonno", en: "FitMesh Labs · Sleep" },
  heroTitle: { it: "Calcolatore efficienza del sonno", en: "Sleep Efficiency Calculator" },
  heroSubtitle: {
    it: "Quanto del tempo passato a letto è stato effettivamente sonno. Calcolo istantaneo nel browser, modalità semplice o avanzata.",
    en: "How much of the time you spend in bed is actually sleep. Instant in-browser calculation, simple or advanced mode.",
  },
  directAnswer: {
    it: [
      "L'efficienza del sonno è la percentuale di tempo trascorso a letto che hai effettivamente passato dormendo: Tempo Totale di Sonno diviso Tempo Totale a Letto, moltiplicato per 100.",
      "Esempio: 8 ore a letto, 7 ore di sonno effettivo → efficienza del sonno = 87,5%.",
    ],
    en: [
      "Sleep efficiency is the percentage of time spent in bed that you actually spent asleep: Total Sleep Time divided by Time in Bed, multiplied by 100.",
      "Example: 8 hours in bed, 7 hours of actual sleep → sleep efficiency = 87.5%.",
    ],
  },
  sections: {
    whatIsSleepEfficiency: {
      heading: { it: "Cos'è l'efficienza del sonno", en: "What is sleep efficiency" },
      paragraphs: {
        it: [
          "L'efficienza del sonno è una delle metriche più usate nella ricerca sul sonno e nella terapia cognitivo-comportamentale per l'insonnia (CBT-I): mette in relazione quanto tempo passi a letto con quanto di quel tempo è effettivamente sonno, non veglia.",
          "Non misura la qualità del sonno in senso assoluto (fasi, profondità, frequenza cardiaca durante la notte): misura solo la proporzione di tempo a letto che si traduce in sonno effettivo. Un'efficienza bassa può indicare difficoltà ad addormentarsi, risvegli notturni frequenti, o semplicemente il tempo passato a letto sveglio prima di alzarsi.",
        ],
        en: [
          "Sleep efficiency is one of the most widely used metrics in sleep research and in cognitive behavioral therapy for insomnia (CBT-I): it relates how much time you spend in bed to how much of that time is actually sleep, not wakefulness.",
          "It does not measure sleep quality in an absolute sense (stages, depth, overnight heart rate): it only measures the proportion of time in bed that translates into actual sleep. Low efficiency can indicate difficulty falling asleep, frequent night-time awakenings, or simply time spent awake in bed before getting up.",
        ],
      },
    },
    simpleVsAdvanced: {
      heading: { it: "Modalità semplice o avanzata: quale usare", en: "Simple or advanced mode: which to use" },
      paragraphs: {
        it: [
          "La modalità semplice basta se conosci già due numeri: quanto tempo sei stato a letto in totale, e quanto di quel tempo hai dormito (per esempio da un'app di sonno o da una stima personale). È il calcolo più diretto, senza bisogno di orari precisi.",
          "La modalità avanzata scompone la notte: ora in cui sei andato a letto/hai spento la luce, ora in cui ti sei alzato, quanto tempo hai impiegato ad addormentarti (latenza), quanto tempo sei stato sveglio durante la notte, e quanto tempo sei rimasto sveglio a letto dopo il risveglio finale prima di alzarti. Da questi valori il tempo di sonno viene derivato, non inserito direttamente - utile se vuoi capire dove va il tempo a letto che non è sonno.",
        ],
        en: [
          "Simple mode is enough if you already know two numbers: how long you were in bed in total, and how much of that time you slept (for example from a sleep app or a personal estimate). It's the most direct calculation, no precise clock times needed.",
          "Advanced mode breaks the night down: the time you went to bed/turned the lights off, the time you got up, how long it took you to fall asleep (latency), how long you were awake during the night, and how long you stayed awake in bed after your final wake-up before getting up. From these values, sleep time is derived, not entered directly - useful if you want to see where the non-sleep time in bed actually goes.",
        ],
      },
    },
    midnightAndMethodology: {
      heading: { it: "Attraversamento della mezzanotte e definizione usata", en: "Crossing midnight and the definition used" },
      paragraphs: {
        it: [
          "In modalità avanzata inserisci solo orari (es. 23:30, 07:15), non date reali: se l'ora di uscita dal letto è precedente all'ora di andare a letto, il calcolatore assume automaticamente che sia il giorno successivo. Non essendo mai usata una data di calendario reale, non ci sono implicazioni di cambio ora legale (DST) da gestire.",
          "Definizione operativa adottata: Tempo a Letto (TIB) = dall'ora di andare a letto all'ora di uscita dal letto. Tempo Totale di Sonno (TST) = TIB meno latenza di addormentamento, meno tempo sveglio durante la notte, meno tempo sveglio dopo il risveglio finale. Efficienza del sonno = TST / TIB × 100.",
          "Questa non è l'unica definizione operativa possibile in letteratura: il denominatore \"tempo a letto\" è oggetto di un dibattito metodologico esplicito (vedi Fonti, Reed & Sacco 2016), perché diversi studi/dispositivi lo calcolano in modi leggermente diversi. Questo strumento dichiara la propria definizione in modo esplicito, invece di presentare un singolo numero senza spiegare da dove viene.",
        ],
        en: [
          "In advanced mode you only enter clock times (e.g. 11:30 PM, 7:15 AM), never real calendar dates: if the out-of-bed time is earlier than the bedtime, the calculator automatically assumes it's the next day. Since no real calendar date is ever used, there are no daylight-saving-time (DST) implications to handle.",
          "Operational definition used: Time in Bed (TIB) = from bedtime to out-of-bed time. Total Sleep Time (TST) = TIB minus sleep onset latency, minus time awake during the night, minus time awake after the final wake-up. Sleep Efficiency = TST / TIB × 100.",
          "This is not the only operational definition in the literature: the \"time in bed\" denominator is the subject of an explicit methodological debate (see Sources, Reed & Sacco 2016), because different studies/devices calculate it in slightly different ways. This tool states its own definition explicitly, instead of presenting a single number without explaining where it comes from.",
        ],
      },
    },
    workedExample: {
      heading: { it: "Esempio numerico completo", en: "Full worked example" },
      paragraphs: {
        it: [
          "A letto alle 23:30, sveglia definitiva alle 07:15: tempo a letto = 7 ore e 45 minuti (465 minuti). Ci hai messo 15 minuti ad addormentarti, sei stato sveglio 20 minuti durante la notte, e sei rimasto a letto sveglio 5 minuti dopo il risveglio finale prima di alzarti: tempo sveglio totale = 40 minuti.",
          "Tempo di sonno = 465 − 40 = 425 minuti (7 ore e 5 minuti). Efficienza del sonno = 425 / 465 × 100 ≈ 91,4%.",
        ],
        en: [
          "In bed at 11:30 PM, final wake-up at 7:15 AM: time in bed = 7 hours 45 minutes (465 minutes). It took 15 minutes to fall asleep, you were awake 20 minutes during the night, and stayed awake in bed 5 minutes after your final wake-up before getting up: total awake time = 40 minutes.",
          "Sleep time = 465 − 40 = 425 minutes (7 hours 5 minutes). Sleep efficiency = 425 / 465 × 100 ≈ 91.4%.",
        ],
      },
    },
    limits: {
      heading: { it: "Limiti", en: "Limits" },
      paragraphs: {
        it: [
          "Questo strumento non diagnostica nulla e non sostituisce una valutazione clinica del sonno (polisonnografia, actigrafia professionale, o un colloquio con un medico del sonno). Non mostra fasce di valutazione \"buono/cattivo\": mostra solo il numero calcolato dai dati che inserisci.",
          "I valori che inserisci (specialmente in modalità semplice) sono spesso stime personali, non misurazioni oggettive: la percezione soggettiva di quanto si è dormito è nota per essere imprecisa, soprattutto per la latenza di addormentamento e i risvegli brevi che non si ricordano al mattino.",
          "Il denominatore \"tempo a letto\" non ha una definizione unica in letteratura (vedi sezione precedente e Reed & Sacco 2016 nelle Fonti): confrontare l'efficienza calcolata qui con quella di un altro strumento/dispositivo che usa una definizione diversa può dare numeri diversi anche per la stessa notte.",
        ],
        en: [
          "This tool does not diagnose anything and does not replace a clinical sleep assessment (polysomnography, professional actigraphy, or a consultation with a sleep physician). It does not show \"good/bad\" rating bands: it only shows the number calculated from the data you enter.",
          "The values you enter (especially in simple mode) are often personal estimates, not objective measurements: subjective perception of how much you slept is known to be imprecise, especially for sleep onset latency and brief awakenings you don't remember in the morning.",
          "The \"time in bed\" denominator does not have a single definition in the literature (see the previous section and Reed & Sacco 2016 in Sources): comparing the efficiency calculated here with that of another tool/device using a different definition can give different numbers for the same night.",
        ],
      },
    },
    privacy: {
      heading: { it: "Privacy", en: "Privacy" },
      paragraphs: {
        it: [
          "Tutto il calcolo avviene nel tuo browser: gli orari e le durate che inserisci non vengono mai inviati a un server, non sono salvati da FitMesh, e non compaiono nell'URL della pagina. Chiudendo o ricaricando la pagina, i dati inseriti spariscono.",
          "L'export CSV e la copia del riepilogo avvengono localmente sul tuo dispositivo (download diretto o clipboard), senza alcun servizio esterno coinvolto.",
        ],
        en: [
          "All calculation happens in your browser: the times and durations you enter are never sent to a server, are not saved by FitMesh, and never appear in the page URL. Closing or reloading the page clears whatever you entered.",
          "CSV export and copying the summary happen locally on your device (direct download or clipboard), with no external service involved.",
        ],
      },
    },
  },
  faq: [
    {
      question: { it: "Qual è una buona efficienza del sonno?", en: "What is a good sleep efficiency?" },
      answer: {
        it: "Questo strumento non emette una valutazione \"buono/cattivo\": mostra solo il numero calcolato. Nella letteratura sulla terapia CBT-I si usano spesso soglie operative (es. sotto l'85% come indicazione per accorciare il tempo a letto), ma sono protocolli clinici guidati da un professionista, non un giudizio automatico su un singolo calcolo isolato - non sono replicate qui.",
        en: "This tool does not issue a \"good/bad\" rating: it only shows the calculated number. CBT-I literature often uses operational thresholds (e.g. below 85% as a signal to shorten time in bed), but those are clinical protocols guided by a professional, not an automatic judgment on a single isolated calculation - they are not replicated here.",
      },
    },
    {
      question: { it: "Perché il tempo di sonno calcolato può essere diverso da quello che percepisco?", en: "Why can the calculated sleep time differ from what I perceive?" },
      answer: {
        it: "In modalità avanzata il tempo di sonno è derivato sottraendo latenza, risvegli notturni e tempo sveglio finale dal tempo a letto: se sottostimi (o non ricordi) uno di questi valori, il risultato rifletterà quella sottostima. È un limite noto delle stime soggettive, non un errore del calcolo.",
        en: "In advanced mode, sleep time is derived by subtracting latency, night-time awakenings, and final awake time from time in bed: if you underestimate (or don't remember) one of these values, the result will reflect that underestimate. This is a known limitation of subjective estimates, not a calculation error.",
      },
    },
    {
      question: { it: "Cosa succede se dormo dopo mezzanotte?", en: "What happens if I sleep past midnight?" },
      answer: {
        it: "Nessun problema: inserisci solo orari (non date), e se l'ora di uscita dal letto è precedente a quella di andare a letto, il calcolatore assume automaticamente che sia il giorno successivo.",
        en: "No problem: you only enter clock times (not dates), and if the out-of-bed time is earlier than the bedtime, the calculator automatically assumes it's the next day.",
      },
    },
    {
      question: { it: "L'efficienza del sonno può superare il 100%?", en: "Can sleep efficiency exceed 100%?" },
      answer: {
        it: "No: se il tempo di sonno inserito/derivato supererebbe il tempo a letto, è un segnale che uno dei valori inseriti è incoerente, quindi il calcolatore blocca il risultato con un messaggio d'errore invece di mostrare un numero fuori scala. Correggi il valore indicato per vedere il risultato.",
        en: "No: if the entered/derived sleep time would exceed time in bed, that's a signal that one of the entered values is inconsistent, so the calculator blocks the result with an error message instead of showing an out-of-range number. Fix the indicated value to see the result.",
      },
    },
    {
      question: { it: "I miei dati vengono inviati o salvati da qualche parte?", en: "Is my data sent or saved anywhere?" },
      answer: {
        it: "No: il calcolo avviene interamente nel browser. Nessuna richiesta di rete, nessun salvataggio su server FitMesh, nessun dato nell'URL.",
        en: "No: the calculation happens entirely in your browser. No network request, no saving to FitMesh servers, no data in the URL.",
      },
    },
    {
      question: { it: "Come si differenzia dal punteggio sonno di anelli/smartwatch?", en: "How is this different from a ring/smartwatch sleep score?" },
      answer: {
        it: "Un punteggio sonno di un wearable combina tipicamente più fattori (efficienza, fasi del sonno, tempistica, frequenza cardiaca) in un unico numero con pesi spesso non dichiarati pubblicamente. Questo calcolatore mostra solo l'efficienza del sonno, con la formula e la definizione completamente esplicite.",
        en: "A wearable's sleep score typically combines several factors (efficiency, sleep stages, timing, heart rate) into one number with weights that are often not publicly disclosed. This calculator shows only sleep efficiency, with the formula and definition fully explicit.",
      },
    },
  ],
  sources: [
    {
      title: { it: "Measuring sleep efficiency: what should the denominator be?", en: "Measuring sleep efficiency: what should the denominator be?" },
      authorOrOrg: { it: "Reed DL, Sacco WP - Journal of Clinical Sleep Medicine", en: "Reed DL, Sacco WP - Journal of Clinical Sleep Medicine" },
      year: "2016",
      url: "https://jcsm.aasm.org/doi/10.5664/jcsm.5498",
      verifiedOn: { it: "17 luglio 2026", en: "July 17, 2026" },
    },
    {
      title: { it: "The Pittsburgh Sleep Quality Index: a new instrument for psychiatric practice and research", en: "The Pittsburgh Sleep Quality Index: a new instrument for psychiatric practice and research" },
      authorOrOrg: { it: "Buysse DJ, Reynolds CF, Monk TH, Berman SR, Kupfer DJ - Psychiatry Research", en: "Buysse DJ, Reynolds CF, Monk TH, Berman SR, Kupfer DJ - Psychiatry Research" },
      year: "1989",
      url: "https://pubmed.ncbi.nlm.nih.gov/2748771/",
      verifiedOn: { it: "17 luglio 2026", en: "July 17, 2026" },
    },
    {
      title: { it: "The AASM Manual for the Scoring of Sleep and Associated Events", en: "The AASM Manual for the Scoring of Sleep and Associated Events" },
      authorOrOrg: { it: "Iber C, Ancoli-Israel S, Chesson AL, Quan SF - American Academy of Sleep Medicine", en: "Iber C, Ancoli-Israel S, Chesson AL, Quan SF - American Academy of Sleep Medicine" },
      year: "2007",
      url: "https://aasm.org/clinical-resources/scoring-manual/",
      verifiedOn: { it: "17 luglio 2026", en: "July 17, 2026" },
    },
  ],
  formulaPlainText: {
    it: "Efficienza del sonno (%) = Tempo Totale di Sonno / Tempo Totale a Letto × 100",
    en: "Sleep Efficiency (%) = Total Sleep Time / Time in Bed × 100",
  },
  formulaHeading: { it: "Formula", en: "Formula" },
  formulaExplanation: {
    it: "Il rapporto tra il tempo effettivamente dormito e il tempo totale passato a letto, espresso in percentuale.",
    en: "The ratio between time actually spent asleep and total time spent in bed, expressed as a percentage.",
  },
  citationHeading: { it: "Come citare questo strumento", en: "How to cite this tool" },
  citationText: {
    it: `FitMesh Labs, "Calcolatore efficienza del sonno" (versione metodologia ${METHODOLOGY_VERSION}, ultima revisione ${LAST_REVIEWED}).`,
    en: `FitMesh Labs, "Sleep Efficiency Calculator" (methodology version ${METHODOLOGY_VERSION}, last reviewed ${LAST_REVIEWED}).`,
  },
  copyLabel: { it: "Copia citazione", en: "Copy citation" },
  copiedLabel: { it: "Copiato", en: "Copied" },
  ctaHeading: { it: "Vuoi tracciare l'efficienza del sonno ogni notte, in automatico?", en: "Want to track sleep efficiency every night, automatically?" },
  ctaBody: {
    it: "FitMesh Sync sincronizza il sonno rilevato dal tuo anello o smartwatch in una dashboard personale - nessun inserimento manuale ogni mattina.",
    en: "FitMesh Sync syncs the sleep detected by your ring or smartwatch into a personal dashboard - no manual entry every morning.",
  },
  ctaLabel: { it: "Scopri FitMesh Sync", en: "Discover FitMesh Sync" },
  relatedToolsHeading: { it: "Altri strumenti FitMesh Labs", en: "Other FitMesh Labs tools" },
  breadcrumbHome: { it: "Home", en: "Home" },
  breadcrumbLabs: { it: "FitMesh Labs", en: "FitMesh Labs" },
  sourcesHeading: { it: "Fonti", en: "Sources" },
  faqHeading: { it: "Domande frequenti", en: "Frequently asked questions" },
  revisionLabel: { it: "Metodologia", en: "Methodology" },
  revisionMethodologyLabel: { it: "Versione", en: "Version" },
  revisionReviewedLabel: { it: "Ultima revisione", en: "Last reviewed" },
  calculatorLabels: {
    modeLabel: { it: "Modalità", en: "Mode" },
    modeSimple: { it: "Semplice", en: "Simple" },
    modeAdvanced: { it: "Avanzata", en: "Advanced" },
    sampleDataButton: { it: "Usa dati di esempio", en: "Use sample data" },
    resetButton: { it: "Azzera", en: "Reset" },
    hoursUnit: { it: "ore", en: "hours" },
    minutesUnit: { it: "minuti", en: "minutes" },
    simpleTimeInBedLabel: { it: "Tempo totale a letto", en: "Total time in bed" },
    simpleTotalSleepLabel: { it: "Tempo totale dormito", en: "Total time asleep" },
    advancedBedTimeLabel: { it: "Ora di andare a letto / luci spente", en: "Bedtime / lights off" },
    advancedOutOfBedTimeLabel: { it: "Ora di uscita dal letto", en: "Out-of-bed time" },
    advancedLatencyLabel: { it: "Tempo per addormentarsi (latenza)", en: "Time to fall asleep (latency)" },
    advancedWasoLabel: { it: "Tempo sveglio durante la notte", en: "Time awake during the night" },
    advancedFinalWakeLabel: { it: "Tempo sveglio dopo il risveglio finale", en: "Time awake after final wake-up" },
    amLabel: { it: "AM", en: "AM" },
    pmLabel: { it: "PM", en: "PM" },
    formatToggleLabel: { it: "Formato 24h", en: "24h format" },
    simpleTimeInBedHoursLabel: { it: "Ore del tempo totale a letto", en: "Hours of total time in bed" },
    simpleTimeInBedMinutesLabel: { it: "Minuti del tempo totale a letto", en: "Minutes of total time in bed" },
    simpleTotalSleepHoursLabel: { it: "Ore del tempo totale dormito", en: "Hours of total time asleep" },
    simpleTotalSleepMinutesLabel: { it: "Minuti del tempo totale dormito", en: "Minutes of total time asleep" },
    advancedBedHourLabel: { it: "Ora di andare a letto: ora", en: "Bedtime: hour" },
    advancedBedMinuteLabel: { it: "Ora di andare a letto: minuti", en: "Bedtime: minutes" },
    advancedBedAmPmLabel: { it: "Ora di andare a letto: AM o PM", en: "Bedtime: AM or PM" },
    advancedOutHourLabel: { it: "Ora di uscita dal letto: ora", en: "Out-of-bed time: hour" },
    advancedOutMinuteLabel: { it: "Ora di uscita dal letto: minuti", en: "Out-of-bed time: minutes" },
    advancedOutAmPmLabel: { it: "Ora di uscita dal letto: AM o PM", en: "Out-of-bed time: AM or PM" },
    resultsHeading: { it: "Risultati", en: "Results" },
    resultEfficiency: { it: "Efficienza del sonno", en: "Sleep efficiency" },
    resultTotalSleep: { it: "Tempo totale dormito", en: "Total sleep time" },
    resultTimeInBed: { it: "Tempo totale a letto", en: "Total time in bed" },
    resultTotalAwake: { it: "Tempo totale sveglio", en: "Total time awake" },
    resultLatency: { it: "Latenza", en: "Latency" },
    resultWaso: { it: "Sveglio durante la notte", en: "Awake during the night" },
    resultFinalWake: { it: "Sveglio dopo il risveglio finale", en: "Awake after final wake-up" },
    nightBreakdownHeading: { it: "Scomposizione della notte", en: "Night breakdown" },
    copyResultsButton: { it: "Copia risultati", en: "Copy results" },
    copiedButton: { it: "Copiato", en: "Copied" },
    downloadCsvButton: { it: "Scarica CSV", en: "Download CSV" },
    noResultsYet: { it: "Inserisci i dati per vedere il risultato.", en: "Enter your data to see the result." },
    errorMissingField: { it: "Campo mancante", en: "Missing field" },
    errorNegativeValue: { it: "Il valore non può essere negativo", en: "Value cannot be negative" },
    errorTimeOutOfRange: { it: "Orario non valido", en: "Invalid time" },
    errorMinutesOutOfRange: { it: "Minuti non validi: usa un valore da 0 a 59", en: "Invalid minutes: use a value from 0 to 59" },
    errorTimeInBedZero: { it: "Ora di andare a letto e ora di uscita identiche: specifica orari diversi", en: "Bedtime and out-of-bed time are identical: please enter different times" },
    errorSleepExceedsTimeInBed: {
      it: "Il tempo dormito supera il tempo a letto: questo non è fisiologicamente possibile. Correggi il tempo a letto o il tempo dormito.",
      en: "Sleep time exceeds time in bed: this is not physiologically possible. Fix the time in bed or the time asleep.",
    },
    errorNegativeDerivedSleepTime: {
      it: "Latenza + risvegli + tempo sveglio finale superano il tempo a letto: il tempo di sonno derivato sarebbe negativo, il che non è possibile. Correggi uno di questi valori o l'orario a letto/di uscita.",
      en: "Latency + awakenings + final awake time exceed time in bed: the derived sleep time would be negative, which is not possible. Fix one of these values or the bedtime/out-of-bed time.",
    },
    errorEfficiencyOutOfRange: {
      it: "Il risultato calcolato non è fisiologicamente valido (fuori dall'intervallo 0-100%): correggi i valori inseriti.",
      en: "The calculated result is not physiologically valid (outside the 0-100% range): please fix the entered values.",
    },
    warningShortTimeInBed: {
      it: "Tempo a letto molto breve: il risultato potrebbe non essere rappresentativo di una notte tipica.",
      en: "Very short time in bed: the result may not be representative of a typical night.",
    },
    warningLongTimeInBed: {
      it: "Tempo a letto insolitamente lungo: verifica di aver inserito gli orari correttamente.",
      en: "Unusually long time in bed: check that you entered the times correctly.",
    },
    crossedMidnightNote: {
      it: "Calcolato attraversando la mezzanotte.",
      en: "Calculated across midnight.",
    },
  },
};
