/**
 * FitMesh Labs: Calcolatore HRV (RMSSD/SDNN). Contenuto sorgente IT,
 * scritto a mano (requisito Fase 9: "creare prima una versione sorgente
 * completa e approvabile"). L'inglese viene generato da questo file via
 * ./tools/local-translator/translate-ts.sh + review.sh + technical-review.sh,
 * poi rivisto a mano (terminologia RR/IBI/NN, formule, unità, placeholder,
 * disclaimer, metadata, FAQ) prima di essere considerato definitivo.
 *
 * Ogni campo traducibile è un oggetto `{ it: "...", en: "..." }` (tipo
 * `LabsText`), stesso pattern per-campo usato in tutto il resto del sito
 * (blog/provider/landing): necessario perché `tools/local-translator/
 * ts_localize.py` individua i gruppi da tradurre cercando esattamente
 * questa forma; una struttura con "it"/"en" come chiave di primo livello
 * (invece che per-campo) non verrebbe riconosciuta dallo strumento.
 *
 * Fonti citate (verificate live via ricerca web durante lo sviluppo, non a
 * memoria: vedi consegna sprint):
 *  - Task Force of ESC/NASPE, "Heart rate variability: standards of
 *    measurement, physiological interpretation and clinical use",
 *    Circulation 1996;93(5):1043-65. PMID 8598068.
 *  - "Consumer Wearable Health and Fitness Technology in Cardiovascular
 *    Medicine: JACC State-of-the-Art Review", J Am Coll Cardiol 2023.
 *    PMID 37438010.
 *  - Peltola MA, "Role of editing of R-R intervals in the analysis of heart
 *    rate variability", Front Physiol 2012;3:148. DOI 10.3389/fphys.2012.00148.
 *
 * Nessun medical reviewer inventato: la revisione dichiarata in pagina è
 * tecnico-editoriale (verifica formule + fonti + guardrail automatico),
 * non una revisione medica: perché non esiste.
 */

import type { LabsText, LabsTextList } from "@/lib/labs/registry";
import { liveLabsToolByKey } from "@/lib/labs/registry";

// P1.1 Fase 1: methodologyVersion/lastRevised vivono nel registry (unica
// fonte di verità, vedi lib/labs/registry.ts), non più dichiarate qui.
export const METHODOLOGY_VERSION = liveLabsToolByKey("hrv-rmssd").methodologyVersion;
export const LAST_REVIEWED = liveLabsToolByKey("hrv-rmssd").lastRevised;
export const PUBLISHED_AT = "2026-07-16";

interface ProseSectionContent {
  heading: LabsText;
  paragraphs: LabsTextList;
}

export interface HrvFaqEntry {
  question: LabsText;
  answer: LabsText;
}

export interface HrvSourceEntry {
  title: LabsText;
  authorOrOrg: LabsText;
  year: string;
  url: string;
  verifiedOn: LabsText;
}

export interface HrvFormulaRow {
  label: LabsText;
  /** Notazione matematica: language-neutral, non tradotta. */
  formula: string;
}

export interface HrvToolContent {
  metaTitle: LabsText;
  metaDescription: LabsText;
  heroKicker: LabsText;
  heroTitle: LabsText;
  heroSubtitle: LabsText;
  directAnswer: LabsTextList;
  sections: {
    whatIsHrv: ProseSectionContent;
    rrIbiNn: ProseSectionContent;
    rmssdFormula: ProseSectionContent;
    stddevFormula: ProseSectionContent;
    rmssdVsSdnn: ProseSectionContent;
    whyDevicesDiffer: ProseSectionContent;
    durationPostureEtc: ProseSectionContent;
    workedExample: ProseSectionContent;
    limits: ProseSectionContent;
    privacy: ProseSectionContent;
  };
  faq: HrvFaqEntry[];
  sources: HrvSourceEntry[];
  formulaRows: HrvFormulaRow[];
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
  formulaTableHeading: LabsText;
  revisionLabel: LabsText;
  revisionMethodologyLabel: LabsText;
  revisionReviewedLabel: LabsText;
  calculatorLabels: {
    textareaLabel: LabsText;
    textareaPlaceholder: LabsText;
    unitLabel: LabsText;
    unitMs: LabsText;
    unitS: LabsText;
    sampleDataButton: LabsText;
    resetButton: LabsText;
    ambiguousWarningIntro: LabsText;
    rejectedWarningIntro: LabsText;
    rejectedReasonNonNumeric: LabsText;
    rejectedReasonZero: LabsText;
    rejectedReasonNegative: LabsText;
    shortSampleWarning: LabsText;
    minimumIntervalsNotice: LabsText;
    artifactDisclaimer: LabsText;
    resultsHeading: LabsText;
    resultValidCount: LabsText;
    resultDuration: LabsText;
    resultMeanRr: LabsText;
    resultDerivedHr: LabsText;
    resultRmssd: LabsText;
    resultLnRmssd: LabsText;
    resultLnRmssdUndefined: LabsText;
    resultStdDev: LabsText;
    resultStdDevNote: LabsText;
    copyResultsButton: LabsText;
    copiedButton: LabsText;
    downloadCsvButton: LabsText;
    unitsMs: LabsText;
    unitsBpm: LabsText;
    noResultsYet: LabsText;
    // P1.1 Fase 4: grafici, evidenza outlier, condivisione.
    rrChartHeading: LabsText;
    diffChartHeading: LabsText;
    chartTableToggleLabel: LabsText;
    chartIndexHeader: LabsText;
    chartValueHeader: LabsText;
    implausibleLabel: LabsText;
    implausibleCountWarning: LabsText;
    shareButton: LabsText;
    sharedButton: LabsText;
  };
}

export const HRV_TOOL_CONTENT: HrvToolContent = {
  metaTitle: {
    it: "Calcolatore HRV: RMSSD e analisi intervalli RR",
    en: "HRV Calculator: RMSSD & RR Interval Analysis",
  },
  metaDescription: {
    it: "Calcola RMSSD e deviazione standard da intervalli RR/IBI. Elaborazione locale nel browser, nessun upload dei dati. Formule documentate, esempio incluso.",
    en: "Calculate RMSSD and standard deviation from RR/IBI intervals. Local browser processing, no data upload. Documented formulas, worked example included.",
  },
  heroKicker: { it: "FitMesh Labs", en: "FitMesh Labs" },
  heroTitle: {
    it: "Calcolatore HRV: RMSSD e analisi intervalli RR",
    en: "HRV Calculator: RMSSD & RR Interval Analysis",
  },
  heroSubtitle: {
    it: "Incolla una serie di intervalli RR/IBI e ottieni RMSSD, deviazione standard e frequenza cardiaca derivata dal RR medio, calcolati interamente nel tuo browser. Nessun dato lascia il tuo dispositivo.",
    en: "Paste a series of RR/IBI intervals and get RMSSD, standard deviation and heart rate derived from mean RR, computed entirely in your browser. No data ever leaves your device.",
  },
  directAnswer: {
    it: [
      "Per calcolare l'HRV (RMSSD) da una lista di intervalli RR: incolla i valori nel campo qui sotto (uno per riga, o separati da spazio/virgola/punto e virgola), scegli l'unità (millisecondi o secondi) e lo strumento calcola in tempo reale RMSSD, deviazione standard, intervallo RR medio e frequenza cardiaca derivata, tutto nel browser, senza inviare nulla a un server.",
      "RMSSD è la radice quadrata della media dei quadrati delle differenze fra intervalli RR consecutivi: è la metrica HRV nel dominio del tempo più usata perché non richiede una registrazione lunga e riflette principalmente l'attività del sistema nervoso parasimpatico.",
    ],
    en: [
      "To calculate HRV (RMSSD) from a list of RR intervals: paste the values into the field below (one per line, or separated by spaces/commas/semicolons), choose the unit (milliseconds or seconds), and the tool computes RMSSD, standard deviation, average RR interval and derived heart rate in real time, all in your browser, without sending anything to a server.",
      "RMSSD is the square root of the mean of the squared differences between consecutive RR intervals: it's the most widely used time-domain HRV metric because it doesn't require a long recording and mainly reflects parasympathetic nervous system activity.",
    ],
  },
  sections: {
    whatIsHrv: {
      heading: { it: "Cos'è l'HRV", en: "What is HRV" },
      paragraphs: {
        it: [
          "La variabilità della frequenza cardiaca (HRV, Heart Rate Variability) misura quanto varia nel tempo l'intervallo fra un battito e il successivo. Non è la frequenza cardiaca media: due persone possono avere lo stesso battito medio (es. 60 bpm) e un'HRV molto diversa, perché l'HRV descrive la variabilità di quegli intervalli, non la loro media.",
          "Il battito cardiaco non è un metronomo: l'intervallo fra un battito e l'altro cambia continuamente sotto l'influenza del sistema nervoso autonomo (le componenti simpatica e parasimpatica), della respirazione, della postura e di molti altri fattori. L'HRV è lo strumento con cui questa variabilità viene quantificata numericamente.",
          "Questa pagina descrive esclusivamente il calcolo matematico dell'HRV a partire da dati che fornisci tu. Non è uno strumento diagnostico, non classifica il risultato come \"buono\" o \"cattivo\", e non stima l'età biologica, lo stato di recupero o il rischio cardiovascolare.",
        ],
        en: [
          "Heart rate variability (HRV) measures how much the interval between one heartbeat and the next changes over time. It's not the average heart rate: two people can have the same average heart rate (e.g. 60 bpm) and very different HRV, because HRV describes the variability of those intervals, not their average.",
          "The heartbeat isn't a metronome: the interval between one beat and the next constantly changes under the influence of the autonomic nervous system (its sympathetic and parasympathetic branches), breathing, posture and many other factors. HRV is the tool used to quantify that variability numerically.",
          "This page describes exclusively the mathematical calculation of HRV from data you provide. It is not a diagnostic tool, it does not classify the result as \"good\" or \"bad\", and it does not estimate biological age, recovery state or cardiovascular risk.",
        ],
      },
    },
    rrIbiNn: {
      heading: {
        it: "RR, IBI e NN: non sono sinonimi intercambiabili",
        en: "RR, IBI and NN: not interchangeable synonyms",
      },
      paragraphs: {
        it: [
          "**Intervallo RR**: il tempo fra due picchi R consecutivi su un tracciato ECG (il picco R è la deflessione più marcata del complesso QRS, corrispondente alla contrazione ventricolare). È il termine tecnicamente corretto quando la fonte del dato è un elettrocardiogramma o una fascia toracica con elettrodi ECG.",
          "**IBI (Interbeat Interval)**: termine più generico, usato spesso dai dispositivi che rilevano il battito con un sensore ottico PPG (fotopletismografia, tipico di orologi e anelli da polso) invece che con elettrodi ECG. Un sensore PPG non misura un vero picco R, ma stima il momento del battito dal cambiamento di volume sanguigno nel tessuto: il valore che restituisce è concettualmente un intervallo fra battiti, non un intervallo RR in senso stretto, anche se nella pratica viene spesso chiamato così.",
          "**Intervallo NN (normal-to-normal)**: un intervallo RR/IBI dopo che la serie è stata ripulita da battiti ectopici, artefatti da movimento e picchi mancati o falsi, cioè dopo che sono rimasti solo intervalli fra battiti sinusali \"normali\". Gli standard clinici (Task Force ESC/NASPE, 1996) definiscono le metriche HRV classiche, incluso SDNN, sugli intervalli NN, non sugli RR grezzi.",
          "Questo strumento lavora sui valori che inserisci così come sono: non distingue automaticamente RR da IBI, e soprattutto non applica alcuna pulizia per trasformarli in intervalli NN. Se i tuoi dati contengono battiti ectopici o artefatti, restano nel calcolo: vedi la sezione Limiti più sotto.",
        ],
        en: [
          "**RR interval**: the time between two consecutive R peaks on an ECG trace (the R peak is the sharpest deflection of the QRS complex, corresponding to ventricular contraction). It's the technically correct term when the data source is an electrocardiogram or a chest strap with ECG electrodes.",
          "**IBI (Interbeat Interval)**: a more generic term, often used by devices that detect the heartbeat with an optical PPG sensor (photoplethysmography, typical of wrist watches and rings) instead of ECG electrodes. A PPG sensor doesn't measure a true R peak; it estimates the timing of the beat from the change in blood volume in the tissue: the value it returns is conceptually an interval between beats, not strictly an RR interval, even though it's often called that in practice.",
          "**NN interval (normal-to-normal)**: an RR/IBI interval after the series has been cleaned of ectopic beats, motion artifacts, and missed or false peaks, i.e. after only intervals between \"normal\" sinus beats remain. Clinical standards (ESC/NASPE Task Force, 1996) define the classic HRV metrics, including SDNN, on NN intervals, not on raw RR intervals.",
          "This tool works on the values you enter exactly as they are: it does not automatically distinguish RR from IBI, and above all it does not apply any cleaning to turn them into NN intervals. If your data contains ectopic beats or artifacts, they remain in the calculation: see the Limits section below.",
        ],
      },
    },
    rmssdFormula: {
      heading: { it: "Formula RMSSD", en: "RMSSD formula" },
      paragraphs: {
        it: [
          "RMSSD (Root Mean Square of Successive Differences) è la radice quadrata della media dei quadrati delle differenze fra intervalli RR consecutivi:",
          "RMSSD = √[ Σ(RRᵢ₊₁ − RRᵢ)² / (n − 1) ]",
          "dove n è il numero di intervalli RR nella serie, quindi ci sono esattamente (n − 1) differenze successive. Elevare al quadrato ogni differenza prima di sommarla dà più peso alle variazioni brusche battito-per-battito rispetto a un trend lento: per questo RMSSD è considerata sensibile soprattutto alla componente ad alta frequenza/parasimpatica della variabilità, ed è la metrica raccomandata dagli standard ESC/NASPE quando si lavora con registrazioni brevi.",
          "Questo strumento richiede almeno 2 intervalli RR validi per calcolare RMSSD (serve almeno una differenza successiva). Con solo 2 intervalli, RMSSD coincide con il valore assoluto dell'unica differenza disponibile.",
        ],
        en: [
          "RMSSD (Root Mean Square of Successive Differences) is the square root of the mean of the squared differences between consecutive RR intervals:",
          "RMSSD = √[ Σ(RRᵢ₊₁ − RRᵢ)² / (n − 1) ]",
          "where n is the number of RR intervals in the series, so there are exactly (n − 1) successive differences. Squaring each difference before summing it gives more weight to abrupt beat-to-beat changes than to a slow trend, which is why RMSSD is considered particularly sensitive to the high-frequency/parasympathetic component of variability, and is the metric recommended by the ESC/NASPE standards when working with short recordings.",
          "This tool requires at least 2 valid RR intervals to calculate RMSSD (at least one successive difference is needed). With only 2 intervals, RMSSD equals the absolute value of the single available difference.",
        ],
      },
    },
    stddevFormula: {
      heading: {
        it: "Formula della deviazione standard",
        en: "Standard deviation formula",
      },
      paragraphs: {
        it: [
          "Questo strumento calcola anche la deviazione standard campionaria degli intervalli inseriti, con denominatore (n − 1): la correzione di Bessel, standard quando i dati inseriti sono considerati un campione:",
          "Deviazione standard = √[ Σ(RRᵢ − RR̄)² / (n − 1) ]",
          "dove RR̄ è la media aritmetica degli intervalli validi. Il denominatore (n − 1), non n, è dichiarato esplicitamente perché la scelta cambia il risultato (specialmente su campioni piccoli) e diverse fonti/strumenti usano convenzioni diverse senza specificarlo.",
          "Questo valore è etichettato nei risultati come \"deviazione standard degli intervalli inseriti\", non come \"SDNN\": vedi la sezione successiva per il motivo.",
        ],
        en: [
          "This tool also calculates the sample standard deviation of the intervals you entered, with denominator (n − 1): Bessel's correction, standard when the entered data is treated as a sample:",
          "Standard deviation = √[ Σ(RRᵢ − RR̄)² / (n − 1) ]",
          "where RR̄ is the arithmetic mean of the valid intervals. The (n − 1) denominator, not n, is stated explicitly because the choice changes the result (especially on small samples) and different sources/tools use different conventions without specifying it.",
          "This value is labeled in the results as \"standard deviation of the entered intervals\", not \"SDNN\": see the next section for why.",
        ],
      },
    },
    rmssdVsSdnn: {
      heading: {
        it: "Perché non chiamiamo questo valore \"SDNN\" senza spiegazione",
        en: "Why we don't call this value \"SDNN\" without an explanation",
      },
      paragraphs: {
        it: [
          "SDNN è, per definizione clinica, la deviazione standard degli intervalli NN, cioè degli intervalli RR/IBI DOPO la rimozione di battiti ectopici e artefatti (vedi sopra). SDNN riflette la variabilità complessiva della registrazione, sia la componente simpatica sia quella parasimpatica, ed è particolarmente sensibile alla durata della registrazione: un SDNN calcolato su 24 ore non è confrontabile con uno calcolato su 5 minuti, per esplicita indicazione degli standard ESC/NASPE.",
          "Questo strumento non rimuove automaticamente alcun intervallo sospetto (vedi Qualità dati/Limiti): calcola la deviazione standard esattamente sui valori che hai inserito, artefatti inclusi se presenti. Chiamarlo \"SDNN\" senza qualifiche implicherebbe una pulizia dei dati che qui non avviene.",
          "Il termine SDNN è appropriato quando: (1) la serie è stata effettivamente ripulita da ectopie/artefatti con un metodo dichiarato, e (2) la durata della registrazione è nota e coerente con il confronto che si vuole fare (breve termine con breve termine, 24 ore con 24 ore). Se entrambe le condizioni valgono per i tuoi dati, puoi legittimamente chiamare SDNN il valore che questo strumento etichetta come \"deviazione standard degli intervalli inseriti\".",
        ],
        en: [
          "SDNN is, by clinical definition, the standard deviation of NN intervals, i.e. of RR/IBI intervals AFTER removal of ectopic beats and artifacts (see above). SDNN reflects the overall variability of the recording, both the sympathetic and parasympathetic components, and is particularly sensitive to recording duration: an SDNN calculated over 24 hours is not comparable to one calculated over 5 minutes, per the explicit guidance of the ESC/NASPE standards.",
          "This tool does not automatically remove any suspicious interval (see Data quality/Limits): it calculates the standard deviation on exactly the values you entered, artifacts included if present. Calling it \"SDNN\" without qualification would imply a data cleaning step that doesn't happen here.",
          "The term SDNN is appropriate when: (1) the series has actually been cleaned of ectopic beats/artifacts using a stated method, and (2) the recording duration is known and consistent with the comparison you want to make (short-term with short-term, 24-hour with 24-hour). If both conditions hold for your data, you can legitimately call the value this tool labels \"standard deviation of the entered intervals\" SDNN.",
        ],
      },
    },
    whyDevicesDiffer: {
      heading: {
        it: "Perché wearable diversi mostrano risultati diversi",
        en: "Why different wearables show different results",
      },
      paragraphs: {
        it: [
          "Se misuri l'HRV con dispositivi diversi nella stessa notte, aspettati numeri diversi anche a parità di condizioni fisiologiche. Le cause principali, documentate nella letteratura sui wearable di consumo (vedi la JACC review citata nelle fonti):",
          "**Tecnologia del sensore**: un elettrocardiogramma o una fascia toracica ECG misura direttamente l'attività elettrica del cuore; un sensore ottico PPG da polso o da anello stima il battito dal flusso sanguigno nel tessuto, con un ritardo variabile (pulse transit time) rispetto al battito elettrico effettivo, una fonte di rumore che l'ECG non ha.",
          "**Algoritmi proprietari di pulizia/interpolazione**: ogni produttore applica filtri e correzioni diversi (non dichiarati pubblicamente nella maggior parte dei casi) prima di calcolare l'HRV che mostra: quanti intervalli scarta, come li corregge, quale finestra temporale usa.",
          "**Metrica riportata**: alcuni dispositivi mostrano RMSSD, altri ln(RMSSD), altri SDNN, altri ancora un punteggio composito proprietario (es. un \"punteggio di readiness\" che combina HRV con altri segnali), valori con scale e significati diversi che non sono direttamente comparabili fra loro.",
          "**Finestra e contesto della misurazione**: una misurazione notturna, una spot-check di 1 minuto da svegli e una registrazione durante l'attività fisica producono numeri strutturalmente diversi, anche sulla stessa persona nello stesso giorno.",
        ],
        en: [
          "If you measure HRV with different devices on the same night, expect different numbers even under identical physiological conditions. The main causes, documented in the consumer wearable literature (see the JACC review cited in the sources):",
          "**Sensor technology**: an electrocardiogram or ECG chest strap directly measures the heart's electrical activity; an optical PPG sensor on a wrist or ring estimates the beat from blood flow changes in the tissue, with a variable delay (pulse transit time) relative to the actual electrical beat, a source of noise that ECG doesn't have.",
          "**Proprietary cleaning/interpolation algorithms**: each manufacturer applies different filters and corrections (not publicly disclosed in most cases) before calculating the HRV it shows: how many intervals it discards, how it corrects them, which time window it uses.",
          "**Reported metric**: some devices show RMSSD, others ln(RMSSD), others SDNN, others still a proprietary composite score (e.g. a \"readiness score\" combining HRV with other signals), values with different scales and meanings that aren't directly comparable to each other.",
          "**Measurement window and context**: an overnight measurement, a 1-minute spot-check while awake, and a recording during physical activity produce structurally different numbers, even on the same person on the same day.",
        ],
      },
    },
    durationPostureEtc: {
      heading: {
        it: "Durata, postura, orario, sensore e artefatti",
        en: "Duration, posture, time of day, sensor and artifacts",
      },
      paragraphs: {
        it: [
          "**Durata della registrazione**: registrazioni molto brevi (pochi secondi/pochi battiti) danno stime statisticamente instabili: questo strumento mostra un avviso quando il campione è corto, senza bloccare il calcolo.",
          "**Postura**: il tono vagale cambia fra posizione sdraiata e in piedi; misurazioni fatte in posture diverse non sono direttamente confrontabili.",
          "**Orario**: l'HRV segue un ritmo circadiano; il confronto più affidabile è misurazione con misurazione fatta nella stessa fascia oraria (tipicamente notturna, la più standardizzata nella pratica dei wearable di consumo).",
          "**Sensore**: vedi sezione precedente: ECG vs PPG non sono intercambiabili.",
          "**Artefatti**: movimento, battiti ectopici e picchi persi o falsi alterano fortemente RMSSD, perché la formula eleva al quadrato le differenze successive: un singolo artefatto di grande ampiezza può dominare la somma e distorcere il risultato più di quanto farebbe su una metrica meno sensibile alle variazioni istantanee.",
        ],
        en: [
          "**Recording duration**: very short recordings (a few seconds/a few beats) give statistically unstable estimates: this tool shows a warning when the sample is short, without blocking the calculation.",
          "**Posture**: vagal tone changes between lying down and standing; measurements taken in different postures aren't directly comparable.",
          "**Time of day**: HRV follows a circadian rhythm; the most reliable comparison is measurement against measurement taken in the same time window (typically overnight, the most standardized in consumer wearable practice).",
          "**Sensor**: see previous section: ECG vs PPG aren't interchangeable.",
          "**Artifacts**: movement, ectopic beats, and missed or false peaks strongly alter RMSSD, because the formula squares successive differences: a single large-amplitude artifact can dominate the sum and distort the result more than it would on a metric less sensitive to instantaneous changes.",
        ],
      },
    },
    workedExample: {
      heading: {
        it: "Esempio di calcolo completo",
        en: "Full worked example",
      },
      paragraphs: {
        it: [
          "Quattro intervalli RR in millisecondi: 800, 810, 790, 805.",
          "Differenze successive: 810 − 800 = 10; 790 − 810 = −20; 805 − 790 = 15.",
          "Quadrati delle differenze: 100; 400; 225. Somma = 725. Numero di differenze = n − 1 = 3.",
          "RMSSD = √(725 / 3) = √241,67 ≈ 15,55 ms.",
          "Media RR = (800 + 810 + 790 + 805) / 4 = 801,25 ms. Frequenza cardiaca derivata = 60000 / 801,25 ≈ 74,88 bpm.",
          "Deviazione standard (n − 1 = 3): scarti dalla media −1,25 / 8,75 / −11,25 / 3,75; quadrati 1,5625 / 76,5625 / 126,5625 / 14,0625; somma = 218,75; /3 = 72,92; radice ≈ 8,54 ms.",
          "Puoi verificare questo esempio incollando \"800, 810, 790, 805\" nel campo qui sopra (unità: millisecondi).",
        ],
        en: [
          "Four RR intervals in milliseconds: 800, 810, 790, 805.",
          "Successive differences: 810 − 800 = 10; 790 − 810 = −20; 805 − 790 = 15.",
          "Squared differences: 100; 400; 225. Sum = 725. Number of differences = n − 1 = 3.",
          "RMSSD = √(725 / 3) = √241.67 ≈ 15.55 ms.",
          "Mean RR = (800 + 810 + 790 + 805) / 4 = 801.25 ms. Derived heart rate = 60000 / 801.25 ≈ 74.88 bpm.",
          "Standard deviation (n − 1 = 3): deviations from the mean −1.25 / 8.75 / −11.25 / 3.75; squares 1.5625 / 76.5625 / 126.5625 / 14.0625; sum = 218.75; /3 = 72.92; square root ≈ 8.54 ms.",
          "You can verify this example by pasting \"800, 810, 790, 805\" into the field above (unit: milliseconds).",
        ],
      },
    },
    limits: {
      heading: { it: "Limiti di questo strumento", en: "Limits of this tool" },
      paragraphs: {
        it: [
          "Non rimuove né corregge automaticamente battiti ectopici, artefatti da movimento o picchi persi/falsi: i valori che inserisci vengono usati esattamente come sono.",
          "Non calcola metriche nel dominio della frequenza (LF, HF, rapporto LF/HF): solo metriche nel dominio del tempo (RMSSD, deviazione standard, media, frequenza derivata).",
          "Non conosce età, sesso, stato di salute, postura, orario o dispositivo di origine dei tuoi dati: non può quindi contestualizzare il risultato rispetto a nessuno di questi fattori.",
          "Un singolo risultato non indica nulla su recupero, stress, forma fisica o salute cardiovascolare: la letteratura su cui si basa questo strumento (vedi Fonti) descrive l'HRV come utile soprattutto come trend personale nel tempo, misurato in condizioni comparabili, non come valore isolato.",
          "Non esiste alcuna tabella di valori HRV \"normali\" per età o sesso in questa pagina, deliberatamente: le evidenze disponibili non supportano valori assoluti universalmente applicabili a persone, durate di registrazione e dispositivi diversi.",
        ],
        en: [
          "It does not automatically remove or correct ectopic beats, motion artifacts, or missed/false peaks: the values you enter are used exactly as they are.",
          "It does not calculate frequency-domain metrics (LF, HF, LF/HF ratio): only time-domain metrics (RMSSD, standard deviation, mean, derived heart rate).",
          "It does not know your age, sex, health status, posture, time of day, or the source device of your data: it therefore cannot contextualize the result against any of these factors.",
          "A single result says nothing about recovery, stress, fitness, or cardiovascular health: the literature this tool is based on (see Sources) describes HRV as most useful as a personal trend over time, measured under comparable conditions, not as an isolated value.",
          "There is no table of \"normal\" HRV values by age or sex on this page, deliberately: the available evidence does not support absolute values that are universally applicable across different people, recording durations, and devices.",
        ],
      },
    },
    privacy: {
      heading: { it: "Privacy", en: "Privacy" },
      paragraphs: {
        it: [
          "Tutti i calcoli avvengono nel tuo browser, nel codice JavaScript di questa pagina. Nessun intervallo RR, nessun risultato e nessun input viene mai inviato a un server, incluso a un server FitMesh: digitare o calcolare non genera alcuna richiesta di rete.",
          "Nessun valore entra in parametri URL, cookie, localStorage o eventi analytics. \"Copia risultati\" copia il testo negli appunti solo dopo che clicchi il pulsante, un'azione esplicita, mai automatica. \"Scarica CSV\" genera un file localmente nel tuo browser: non c'è upload.",
          "Il pulsante \"Condividi\" apre il pannello di condivisione nativo del tuo browser/sistema operativo con un riepilogo testuale dei risultati calcolati e l'indirizzo di questa pagina - mai gli intervalli RR grezzi che hai inserito. Nessun dato entra nell'URL: la condivisione avviene interamente in locale, tramite il sistema operativo, non tramite un server FitMesh.",
        ],
        en: [
          "All calculations happen in your browser, in this page's JavaScript code. No RR interval, no result, and no input is ever sent to a server, including a FitMesh server: typing or calculating never generates a network request.",
          "No value ever enters URL parameters, cookies, localStorage, or analytics events. \"Copy results\" copies text to the clipboard only after you click the button, an explicit action, never automatic. \"Download CSV\" generates a file locally in your browser: there is no upload.",
          "The \"Share\" button opens your browser/OS's native share sheet with a text summary of the calculated results and this page's address - never the raw RR intervals you entered. No data ever enters the URL: sharing happens entirely locally, through the operating system, not through a FitMesh server.",
        ],
      },
    },
  },
  faq: [
    {
      question: {
        it: "Cosa sono gli intervalli RR e dove li trovo?",
        en: "What are RR intervals and where do I find them?",
      },
      answer: {
        it: "Sono gli intervalli di tempo (in millisecondi o secondi) fra un battito cardiaco e il successivo. Alcuni dispositivi (fasce toraciche ECG, alcune app di misurazione HRV, alcuni orologi) permettono di esportare la serie grezza di questi intervalli, spesso come file di testo o CSV. Se il tuo dispositivo mostra solo un valore finale di HRV (es. \"RMSSD: 42 ms\") e non la serie di intervalli, questo strumento non può verificarlo: serve la lista dei singoli intervalli, non il risultato già calcolato.",
        en: "They are the time intervals (in milliseconds or seconds) between one heartbeat and the next. Some devices (ECG chest straps, some HRV measurement apps, some watches) let you export the raw series of these intervals, often as a text or CSV file. If your device only shows a final HRV value (e.g. \"RMSSD: 42 ms\") and not the series of intervals, this tool can't verify it: it needs the list of individual intervals, not an already-computed result.",
      },
    },
    {
      question: {
        it: "Perché il mio calcolo dà un numero diverso da quello del mio smartwatch?",
        en: "Why does my calculation give a different number than my smartwatch?",
      },
      answer: {
        it: "Perché il tuo smartwatch quasi certamente applica una pulizia dei dati (rimozione di battiti ectopici/artefatti) prima di calcolare l'HRV, usa un algoritmo proprietario non documentato pubblicamente, e potrebbe misurare su una finestra temporale diversa da quella che hai incollato qui. Questo strumento calcola esattamente la formula RMSSD sui valori che fornisci, senza alcuna correzione: è normale che il numero differisca.",
        en: "Because your smartwatch almost certainly applies data cleaning (removing ectopic beats/artifacts) before calculating HRV, uses a proprietary algorithm that isn't publicly documented, and may measure over a different time window than the one you pasted here. This tool calculates exactly the RMSSD formula on the values you provide, with no correction: it's normal for the number to differ.",
      },
    },
    {
      question: {
        it: "Questo strumento mi dice se la mia HRV è buona o cattiva?",
        en: "Does this tool tell me if my HRV is good or bad?",
      },
      answer: {
        it: "No, deliberatamente. Non esiste un valore di HRV universalmente \"buono\" o \"cattivo\": dipende da età, sesso, condizione fisica, dispositivo di misurazione, postura, orario e molti altri fattori, nessuno dei quali questo strumento conosce. Mostra solo il calcolo matematico sui dati che inserisci, mai un'interpretazione o una classificazione.",
        en: "No, deliberately. There is no universally \"good\" or \"bad\" HRV value: it depends on age, sex, physical condition, measuring device, posture, time of day, and many other factors, none of which this tool knows. It only shows the mathematical calculation on the data you enter, never an interpretation or classification.",
      },
    },
    {
      question: {
        it: "Posso usare questo strumento per una diagnosi medica?",
        en: "Can I use this tool for a medical diagnosis?",
      },
      answer: {
        it: "No. Questo è uno strumento di calcolo matematico, non un dispositivo medico e non un servizio diagnostico. Non sostituisce in alcun modo il parere di un medico o di un professionista sanitario. Se hai dubbi sulla tua salute cardiovascolare, rivolgiti a un medico.",
        en: "No. This is a mathematical calculation tool, not a medical device and not a diagnostic service. It does not replace, in any way, the advice of a doctor or healthcare professional. If you have concerns about your cardiovascular health, consult a doctor.",
      },
    },
    {
      question: {
        it: "I miei dati vengono salvati da qualche parte?",
        en: "Is my data saved anywhere?",
      },
      answer: {
        it: "No. Tutto il calcolo avviene nel tuo browser e non viene mai inviato a un server, incluso a FitMesh. Non c'è alcun salvataggio, nemmeno locale: se chiudi o ricarichi la pagina, i dati inseriti vanno persi (a meno che tu non abbia scaricato il CSV o copiato i risultati tu stesso).",
        en: "No. All calculation happens in your browser and is never sent to a server, including FitMesh. There is no storage at all, not even local: if you close or reload the page, the entered data is lost (unless you downloaded the CSV or copied the results yourself).",
      },
    },
    {
      question: {
        it: "Qual è la differenza fra RMSSD e SDNN?",
        en: "What's the difference between RMSSD and SDNN?",
      },
      answer: {
        it: "RMSSD misura le differenze fra intervalli RR consecutivi ed è più legata alla componente parasimpatica a breve termine; è comunemente usata anche su registrazioni brevi, ma la durata della registrazione e le condizioni di raccolta vanno dichiarate e mantenute coerenti quando si confrontano i risultati. SDNN misura la deviazione standard dell'intera serie di intervalli NN (puliti da artefatti) ed è più sensibile alla durata della registrazione e riflette la variabilità complessiva. Questo strumento calcola sempre RMSSD; la deviazione standard che mostra è definita come \"SDNN\" solo se i tuoi dati sono già puliti da ectopie/artefatti: vedi la sezione dedicata più sopra.",
        en: "RMSSD measures the differences between consecutive RR intervals and is more closely tied to short-term parasympathetic activity; it's commonly used with short recordings, but recording duration and collection conditions must be reported and kept consistent when comparing results. SDNN measures the standard deviation of the entire series of NN intervals (cleaned of artifacts) and is more sensitive to recording duration, reflecting overall variability. This tool always calculates RMSSD; the standard deviation it shows is properly called \"SDNN\" only if your data is already cleaned of ectopic beats/artifacts: see the dedicated section above.",
      },
    },
  ],
  sources: [
    {
      title: {
        it: "Heart rate variability: standards of measurement, physiological interpretation and clinical use",
        en: "Heart rate variability: standards of measurement, physiological interpretation and clinical use",
      },
      authorOrOrg: {
        it: "Task Force of The European Society of Cardiology and The North American Society of Pacing and Electrophysiology, Circulation 93(5):1043-65",
        en: "Task Force of The European Society of Cardiology and The North American Society of Pacing and Electrophysiology, Circulation 93(5):1043-65",
      },
      year: "1996",
      url: "https://pubmed.ncbi.nlm.nih.gov/8598068/",
      verifiedOn: {
        it: "Verificato il 16 luglio 2026 (PMID 8598068)",
        en: "Verified on July 16, 2026 (PMID 8598068)",
      },
    },
    {
      title: {
        it: "Consumer Wearable Health and Fitness Technology in Cardiovascular Medicine: JACC State-of-the-Art Review",
        en: "Consumer Wearable Health and Fitness Technology in Cardiovascular Medicine: JACC State-of-the-Art Review",
      },
      authorOrOrg: {
        it: "Journal of the American College of Cardiology",
        en: "Journal of the American College of Cardiology",
      },
      year: "2023",
      url: "https://pubmed.ncbi.nlm.nih.gov/37438010/",
      verifiedOn: {
        it: "Verificato il 16 luglio 2026 (PMID 37438010)",
        en: "Verified on July 16, 2026 (PMID 37438010)",
      },
    },
    {
      title: {
        it: "Role of editing of R-R intervals in the analysis of heart rate variability",
        en: "Role of editing of R-R intervals in the analysis of heart rate variability",
      },
      authorOrOrg: {
        it: "Peltola M.A., Frontiers in Physiology 3:148",
        en: "Peltola M.A., Frontiers in Physiology 3:148",
      },
      year: "2012",
      url: "https://doi.org/10.3389/fphys.2012.00148",
      verifiedOn: {
        it: "Verificato il 16 luglio 2026",
        en: "Verified on July 16, 2026",
      },
    },
  ],
  // P1.1 Fase 4: formule in LaTeX (renderizzate via KaTeX, vedi
  // components/labs/math), non più stringhe unicode semplici. La formula
  // RMSSD è quella mandata dallo sprint P1.1 alla lettera.
  formulaRows: [
    {
      label: { it: "RMSSD", en: "RMSSD" },
      formula: String.raw`\mathrm{RMSSD} = \sqrt{ \frac{ \sum_{i=1}^{n-1} \left(RR_{i+1}-RR_i\right)^2 }{n-1} }`,
    },
    {
      label: { it: "Deviazione standard (campionaria)", en: "Standard deviation (sample)" },
      formula: String.raw`\mathrm{SD} = \sqrt{ \frac{ \sum_{i=1}^{n} \left(RR_i - \overline{RR}\right)^2 }{n-1} }`,
    },
    {
      label: { it: "Frequenza cardiaca derivata", en: "Derived heart rate" },
      formula: String.raw`\mathrm{HR} = \frac{60000}{\overline{RR}\ (\mathrm{ms})}`,
    },
    { label: { it: "ln(RMSSD)", en: "ln(RMSSD)" }, formula: String.raw`\ln(\mathrm{RMSSD})` },
  ],
  citationHeading: { it: "Come citare questo strumento", en: "How to cite this tool" },
  citationText: {
    it:
      'FitMesh Labs, "Calcolatore HRV: RMSSD e analisi intervalli RR". FitMesh Sync. ' +
      "https://www.fitmesh.fit/it/labs/calcolatore-hrv-rmssd " +
      `(versione metodologia ${METHODOLOGY_VERSION}, ultima revisione ${LAST_REVIEWED}).`,
    en:
      'FitMesh Labs, "HRV Calculator: RMSSD & RR Interval Analysis". FitMesh Sync. ' +
      "https://www.fitmesh.fit/en/labs/hrv-rmssd-calculator " +
      `(methodology version ${METHODOLOGY_VERSION}, last reviewed ${LAST_REVIEWED}).`,
  },
  copyLabel: { it: "Copia citazione", en: "Copy citation" },
  copiedLabel: { it: "Copiato!", en: "Copied!" },
  ctaHeading: {
    it: "Vuoi vedere l'HRV del tuo dispositivo insieme al resto dei tuoi dati?",
    en: "Want to see your device's HRV alongside the rest of your data?",
  },
  ctaBody: {
    it: "FitMesh Sync non importa gli intervalli RR grezzi (la maggior parte di Health Connect/Apple Health espone solo il valore HRV già calcolato dal dispositivo, non la serie battito-per-battito): questo calcolatore resta uno strumento indipendente. Se vuoi vedere l'HRV riportato dal tuo wearable insieme a battito, sonno e altre metriche in un'unica dashboard, ecco come funziona FitMesh Sync.",
    en: "FitMesh Sync does not import raw RR intervals (most of Health Connect/Apple Health only exposes the HRV value already computed by the device, not the beat-by-beat series): this calculator remains an independent tool. If you want to see the HRV reported by your wearable alongside heart rate, sleep, and other metrics in one dashboard, here's how FitMesh Sync works.",
  },
  ctaLabel: { it: "Scopri come funziona la sincronizzazione", en: "See how sync works" },
  relatedToolsHeading: { it: "Altri strumenti FitMesh Labs", en: "Other FitMesh Labs tools" },
  breadcrumbHome: { it: "Home", en: "Home" },
  breadcrumbLabs: { it: "Labs", en: "Labs" },
  sourcesHeading: { it: "Fonti", en: "Sources" },
  faqHeading: { it: "Domande frequenti", en: "Frequently asked questions" },
  formulaTableHeading: { it: "Formule", en: "Formulas" },
  revisionLabel: {
    it: "Revisione tecnico-editoriale (formule, fonti, guardrail automatico): nessun revisore medico dichiarato",
    en: "Technical-editorial review (formulas, sources, automated guardrail): no medical reviewer declared",
  },
  revisionMethodologyLabel: { it: "Versione metodologia", en: "Methodology version" },
  revisionReviewedLabel: { it: "Ultima revisione", en: "Last reviewed" },
  calculatorLabels: {
    textareaLabel: {
      it: "Intervalli RR/IBI (uno per riga, o separati da spazio, virgola o punto e virgola)",
      en: "RR/IBI intervals (one per line, or separated by space, comma, or semicolon)",
    },
    textareaPlaceholder: {
      it: "Es. 812\n828\n795\n840\n...\noppure: 812, 828, 795, 840",
      en: "E.g. 812\n828\n795\n840\n...\nor: 812, 828, 795, 840",
    },
    unitLabel: { it: "Unità:", en: "Unit:" },
    unitMs: { it: "Millisecondi", en: "Milliseconds" },
    unitS: { it: "Secondi", en: "Seconds" },
    sampleDataButton: { it: "Usa dati di esempio", en: "Use sample data" },
    resetButton: { it: "Azzera", en: "Reset" },
    ambiguousWarningIntro: {
      it: "Alcuni valori sono ambigui e non sono stati inclusi nel calcolo: la virgola potrebbe essere un separatore decimale o un separatore di elenco:",
      en: "Some values are ambiguous and were not included in the calculation: the comma could be a decimal separator or a list separator:",
    },
    rejectedWarningIntro: {
      it: "Valori non validi esclusi dal calcolo:",
      en: "Invalid values excluded from the calculation:",
    },
    rejectedReasonNonNumeric: { it: "non è un numero", en: "not a number" },
    rejectedReasonZero: { it: "zero non è un intervallo valido", en: "zero is not a valid interval" },
    rejectedReasonNegative: {
      it: "i valori negativi non sono validi",
      en: "negative values are not valid",
    },
    shortSampleWarning: {
      it: "Campione corto (meno di 30 intervalli): il risultato è statisticamente instabile e non dovrebbe essere interpretato come rappresentativo.",
      en: "Short sample (fewer than 30 intervals): the result is statistically unstable and should not be interpreted as representative.",
    },
    minimumIntervalsNotice: {
      it: "Servono almeno 2 intervalli validi per calcolare RMSSD.",
      en: "At least 2 valid intervals are needed to calculate RMSSD.",
    },
    artifactDisclaimer: {
      it: "Artefatti, battiti ectopici, movimento e intervalli persi possono alterare fortemente il risultato. Questo strumento non li rileva né li corregge automaticamente.",
      en: "Artifacts, ectopic beats, movement, and missed intervals can strongly alter the result. This tool does not detect or correct them automatically.",
    },
    resultsHeading: { it: "Risultati", en: "Results" },
    resultValidCount: { it: "Intervalli validi", en: "Valid intervals" },
    resultDuration: { it: "Durata campione", en: "Sample duration" },
    resultMeanRr: { it: "RR medio", en: "Mean RR" },
    resultDerivedHr: { it: "Frequenza cardiaca derivata", en: "Derived heart rate" },
    resultRmssd: { it: "RMSSD", en: "RMSSD" },
    resultLnRmssd: { it: "ln(RMSSD)", en: "ln(RMSSD)" },
    resultLnRmssdUndefined: { it: "non definito (RMSSD = 0)", en: "undefined (RMSSD = 0)" },
    resultStdDev: {
      it: "Deviazione standard degli intervalli inseriti",
      en: "Standard deviation of the entered intervals",
    },
    resultStdDevNote: {
      it: "Denominatore n−1. Non è etichettata \"SDNN\": SDNN richiede intervalli normal-to-normal ripuliti da artefatti: vedi la sezione dedicata più sotto.",
      en: "Denominator n−1. Not labeled \"SDNN\": SDNN requires normal-to-normal intervals cleaned of artifacts: see the dedicated section below.",
    },
    copyResultsButton: { it: "Copia risultati", en: "Copy results" },
    copiedButton: { it: "Copiato!", en: "Copied!" },
    downloadCsvButton: { it: "Scarica CSV", en: "Download CSV" },
    unitsMs: { it: "ms", en: "ms" },
    unitsBpm: { it: "bpm", en: "bpm" },
    noResultsYet: {
      it: "Inserisci almeno 2 intervalli RR validi per vedere i risultati.",
      en: "Enter at least 2 valid RR intervals to see the results.",
    },
    rrChartHeading: { it: "Intervalli RR", en: "RR intervals" },
    diffChartHeading: { it: "Differenze successive", en: "Successive differences" },
    chartTableToggleLabel: { it: "Mostra come tabella", en: "Show as table" },
    chartIndexHeader: { it: "#", en: "#" },
    chartValueHeader: { it: "Valore", en: "Value" },
    implausibleLabel: { it: "fuori range plausibile", en: "outside plausible range" },
    implausibleCountWarning: {
      it: "valore/i fuori dal range fisiologicamente plausibile (300–2000 ms): inclusi comunque nel calcolo, non rimossi automaticamente. Verifica se sono un errore di inserimento.",
      en: "value(s) outside the physiologically plausible range (300–2000 ms): still included in the calculation, not automatically removed. Check whether they're a data-entry error.",
    },
    shareButton: { it: "Condividi", en: "Share" },
    sharedButton: { it: "Condiviso", en: "Shared" },
  },
};
