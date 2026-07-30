/**
 * FitMesh Labs: Calcolatore Zone di Frequenza Cardiaca. Contenuto sorgente IT
 * scritto a mano, inglese tradotto a mano (stesso approccio manuale di
 * hrv/content.ts e sleep-efficiency/content.ts - niente Ollama su questo tipo
 * di copy tecnico, vedi commento in quei file per la motivazione).
 *
 * Fonti citate (verificate live via ricerca web durante lo sviluppo, non a
 * memoria):
 *  - Tanaka H, Monahan KD, Seals DR. "Age-predicted maximal heart rate
 *    revisited." J Am Coll Cardiol. 2001;37(1):153-156. PMID 11153730.
 *    DOI 10.1016/S0735-1097(00)01054-8. (formula di stima FC max da età)
 *  - Karvonen MJ, Kentala E, Mustala O. "The effects of training on heart
 *    rate; a longitudinal study." Ann Med Exp Biol Fenn. 1957;35(3):307-315.
 *    PMID 13470504. (metodo Karvonen / % riserva di frequenza cardiaca)
 *  - San-Millán I, Brooks GA. "Assessment of Metabolic Flexibility by Means
 *    of Measuring Blood Lactate, Fat, and Carbohydrate Oxidation Responses to
 *    Exercise in Professional Endurance Athletes and Less-Fit Individuals."
 *    Sports Med. 2018;48(2):467-479. PMID 28623613. DOI 10.1007/s40279-017-0751-x.
 *    (perché due metodi/dispositivi diversi mostrano bpm diversi per la
 *    stessa zona nominale - stesso principio usato nell'articolo Zona 2)
 *
 * Nessun medical reviewer inventato: revisione tecnico-editoriale (formule +
 * fonti + guardrail automatico), non medica - perché non esiste.
 */

import type { LabsText, LabsTextList } from "@/lib/labs/registry";
import { liveLabsToolByKey } from "@/lib/labs/registry";

export const METHODOLOGY_VERSION = liveLabsToolByKey("heart-rate-zones").methodologyVersion;
export const LAST_REVIEWED = liveLabsToolByKey("heart-rate-zones").lastRevised;
export const PUBLISHED_AT = "2026-07-30";

interface ProseSectionContent {
  heading: LabsText;
  paragraphs: LabsTextList;
}

export interface HeartRateZonesFaqEntry {
  question: LabsText;
  answer: LabsText;
}

export interface HeartRateZonesSourceEntry {
  title: LabsText;
  authorOrOrg: LabsText;
  year: string;
  url: string;
  verifiedOn: LabsText;
}

export interface HeartRateZonesToolContent {
  metaTitle: LabsText;
  metaDescription: LabsText;
  heroKicker: LabsText;
  heroTitle: LabsText;
  heroSubtitle: LabsText;
  directAnswer: LabsTextList;
  sections: {
    whatAreZones: ProseSectionContent;
    twoMethods: ProseSectionContent;
    ageMethodsComparison: ProseSectionContent;
    whyDevicesDisagree: ProseSectionContent;
    workedExample: ProseSectionContent;
    limits: ProseSectionContent;
    privacy: ProseSectionContent;
  };
  faq: HeartRateZonesFaqEntry[];
  sources: HeartRateZonesSourceEntry[];
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
  zoneNames: Record<"z1" | "z2" | "z3" | "z4" | "z5", LabsText>;
  calculatorLabels: {
    maxHrModeLabel: LabsText;
    maxHrModeTanaka: LabsText;
    maxHrModeAge220: LabsText;
    maxHrModeMeasured: LabsText;
    maxHrModeAge220Hint: LabsText;
    ageLabel: LabsText;
    measuredMaxHrLabel: LabsText;
    restingHrLabel: LabsText;
    sampleDataButton: LabsText;
    resetButton: LabsText;
    resultsHeading: LabsText;
    resultMethodLabel: LabsText;
    resultMaxHr: LabsText;
    resultRestingHr: LabsText;
    resultHrr: LabsText;
    percentMaxHrTableHeading: LabsText;
    hrrTableHeading: LabsText;
    tableZoneColumn: LabsText;
    tableRangeColumn: LabsText;
    copyResultsButton: LabsText;
    copiedButton: LabsText;
    downloadCsvButton: LabsText;
    noResultsYet: LabsText;
    errorMissingField: LabsText;
    errorNegativeValue: LabsText;
    errorAgeOutOfRange: LabsText;
    errorMaxHrOutOfRange: LabsText;
    errorRestingHrOutOfRange: LabsText;
    errorRestingHrNotBelowMax: LabsText;
    warningHighRestingHr: LabsText;
    warningLowRestingHr: LabsText;
    warningNarrowReserve: LabsText;
  };
}

export const HEART_RATE_ZONES_TOOL_CONTENT: HeartRateZonesToolContent = {
  metaTitle: {
    it: "Calcolatore zone di frequenza cardiaca: % FC max e Karvonen",
    en: "Heart Rate Zones Calculator: %HRmax and Karvonen Method",
  },
  metaDescription: {
    it: "Calcola le tue zone di frequenza cardiaca con due metodi affiancati (% FC max e Karvonen/% riserva cardiaca): scopri perché anelli e smartwatch diversi mostrano bpm diversi per la stessa zona. Calcolo nel browser, nessun dato inviato.",
    en: "Calculate your heart rate zones with two methods side by side (%HRmax and Karvonen/%heart rate reserve): see why different rings and smartwatches show different bpm for the same zone. Calculated in your browser, nothing sent anywhere.",
  },
  heroKicker: { it: "FitMesh Labs · Attività", en: "FitMesh Labs · Activity" },
  heroTitle: { it: "Calcolatore zone di frequenza cardiaca", en: "Heart Rate Zones Calculator" },
  heroSubtitle: {
    it: "Due metodi, fianco a fianco: % della FC massima e metodo Karvonen (% riserva cardiaca). Calcolo istantaneo nel browser.",
    en: "Two methods, side by side: %max heart rate and the Karvonen method (%heart rate reserve). Instant in-browser calculation.",
  },
  directAnswer: {
    it: [
      "Le zone di frequenza cardiaca dividono lo sforzo in fasce di intensità (di solito 5), calcolate come percentuale della tua frequenza cardiaca massima oppure della tua riserva cardiaca (FC massima meno FC a riposo, metodo Karvonen). La FC massima può venire da tre fonti: formula di Tanaka, formula classica \"220-età\", o un valore misurato.",
      "I due metodi di zona danno numeri diversi per la stessa zona nominale: per esempio, con FC max 180 e FC riposo 60, la Zona 2 (60-70%) è 108 ≤ FC < 126 bpm col metodo % FC max, ma 132 ≤ FC < 144 bpm col metodo Karvonen (limite superiore escluso, tranne per la Zona 5).",
    ],
    en: [
      "Heart rate zones split effort into intensity bands (usually 5), calculated either as a percentage of your maximum heart rate or of your heart rate reserve (max HR minus resting HR, the Karvonen method). Max heart rate can come from three sources: the Tanaka formula, the classic \"220-age\" formula, or a measured value.",
      "The two zone methods give different numbers for the same nominal zone: for example, with a max HR of 180 and a resting HR of 60, Zone 2 (60-70%) is 108 ≤ HR < 126 bpm with the %HRmax method, but 132 ≤ HR < 144 bpm with the Karvonen method (upper bound excluded, except for Zone 5).",
    ],
  },
  sections: {
    whatAreZones: {
      heading: { it: "Cosa sono le zone di frequenza cardiaca", en: "What heart rate zones are" },
      paragraphs: {
        it: [
          "Le zone di frequenza cardiaca sono un modo per tradurre lo sforzo percepito in un numero misurabile (i battiti al minuto), suddiviso in fasce che vanno dallo sforzo molto leggero al massimale. Il modello a 5 zone usato qui è il più diffuso nella comunicazione consumer (app fitness, smartwatch, anelli), non l'unico possibile in letteratura.",
          "Ogni zona corrisponde a un intervallo percentuale (50-60%, 60-70%, 70-80%, 80-90%, 90-100%): questo strumento applica le STESSE cinque fasce percentuali a due riferimenti diversi (FC massima, oppure riserva cardiaca), per mostrare esplicitamente da dove nasce la differenza in bpm che trovi tra un dispositivo e l'altro.",
        ],
        en: [
          "Heart rate zones are a way to translate perceived effort into a measurable number (beats per minute), split into bands from very light effort to maximal. The 5-zone model used here is the most common in consumer communication (fitness apps, smartwatches, rings), not the only one that exists in the literature.",
          "Each zone corresponds to a percentage range (50-60%, 60-70%, 70-80%, 80-90%, 90-100%): this tool applies the SAME five percentage bands to two different reference points (max heart rate, or heart rate reserve), to show explicitly where the bpm difference you see between devices actually comes from.",
        ],
      },
    },
    twoMethods: {
      heading: { it: "I due metodi: % FC max e Karvonen", en: "The two methods: %HRmax and Karvonen" },
      paragraphs: {
        it: [
          "Metodo % FC massima: ogni zona è semplicemente FC massima moltiplicata per la percentuale della fascia (es. 70% di 180 = 126 bpm). Non tiene conto della tua FC a riposo: due persone con la stessa FC massima ma FC a riposo molto diverse (es. un atleta allenato con FC riposo 45 e una persona sedentaria con FC riposo 75) ricevono esattamente le stesse zone in bpm.",
          "Metodo Karvonen (% riserva di frequenza cardiaca, HRR): la zona è FC a riposo più la percentuale della differenza tra FC massima e FC a riposo (es. riposo 60 + 70% di (180-60) = 60 + 84 = 144 bpm). Tiene conto della tua FC a riposo, quindi tende a dare zone più personalizzate - a parità di FC massima, chi ha una FC a riposo più bassa (spesso più allenato) ottiene zone in bpm leggermente più alte.",
          "FC massima: se non l'hai mai misurata con un test da sforzo reale, questo strumento la stima con la formula di Tanaka (208 − 0,7 × età) oppure con la formula classica \"220 − età\" - entrambe stime di popolazione, non un valore personale misurato (vedi la sezione dedicata al confronto tra i due metodi, e Limiti).",
        ],
        en: [
          "%Max heart rate method: each zone is simply max heart rate multiplied by the band's percentage (e.g. 70% of 180 = 126 bpm). It ignores your resting heart rate: two people with the same max heart rate but very different resting heart rates (e.g. a trained athlete with a resting HR of 45 and a sedentary person with a resting HR of 75) get exactly the same zones in bpm.",
          "Karvonen method (%heart rate reserve, HRR): the zone is resting heart rate plus the band's percentage of the difference between max heart rate and resting heart rate (e.g. resting 60 + 70% of (180-60) = 60 + 84 = 144 bpm). It accounts for your resting heart rate, so it tends to give more personalized zones - at the same max heart rate, someone with a lower resting heart rate (often fitter) gets slightly higher bpm zones.",
          "Max heart rate: if you have never measured it with a real maximal exercise test, this tool estimates it using the Tanaka formula (208 − 0.7 × age) or the classic \"220 − age\" formula - both population estimates, not a personally measured value (see the dedicated comparison section below, and Limits).",
        ],
      },
    },
    ageMethodsComparison: {
      heading: {
        it: "Tanaka o 220-età: due stime diverse, non intercambiabili",
        en: "Tanaka or 220-age: two different estimates, not interchangeable",
      },
      paragraphs: {
        it: [
          "La formula \"220 − età\" è probabilmente la stima di FC massima più diffusa nell'uso pratico, ma la sua origine non è tracciabile con certezza a un singolo studio validato. La formula di Tanaka (208 − 0,7 × età) fu pubblicata nel 2001 proprio per sostituirla con una stima basata su una meta-analisi di oltre 18.000 soggetti adulti sani. Questo calcolatore mostra entrambe fianco a fianco, così puoi vedere di quanto divergono per la tua età, invece di trattare \"220-età\" come un valore preciso o universalmente validato.",
          "Le due formule non sono parallele: coincidono esattamente a 40 anni (220−40 = 180 = 208−0,7×40), ma divergono in direzioni opposte allontanandosi da quell'età. Esempio: a 60 anni, \"220-età\" dà 160 bpm, Tanaka dà 166 bpm (6 bpm di differenza); a 20 anni, \"220-età\" dà 200 bpm, Tanaka dà 194 bpm (di nuovo 6 bpm, ma nella direzione opposta).",
          "Se conosci la tua FC massima da un test reale, usa sempre la modalità \"misurata\": nessuna delle due formule di stima sostituisce un valore osservato direttamente.",
        ],
        en: [
          "The \"220 − age\" formula is probably the most common max heart rate estimate in practical use, but its origin cannot be reliably traced to a single validated study. The Tanaka formula (208 − 0.7 × age) was published in 2001 specifically to replace it with an estimate based on a meta-analysis of over 18,000 healthy adult subjects. This calculator shows both side by side, so you can see how much they diverge at your age, instead of treating \"220-age\" as a precise or universally validated value.",
          "The two formulas are not parallel: they coincide exactly at age 40 (220−40 = 180 = 208−0.7×40), but diverge in opposite directions moving away from that age. Example: at age 60, \"220-age\" gives 160 bpm, Tanaka gives 166 bpm (a 6 bpm difference); at age 20, \"220-age\" gives 200 bpm, Tanaka gives 194 bpm (6 bpm again, but in the opposite direction).",
          "If you know your max heart rate from a real test, always use \"measured\" mode: neither estimation formula replaces a directly observed value.",
        ],
      },
    },
    whyDevicesDisagree: {
      heading: {
        it: "Perché anello, smartwatch e app mostrano zone diverse",
        en: "Why your ring, smartwatch, and apps show different zones",
      },
      paragraphs: {
        it: [
          "Se hai mai confrontato le zone mostrate da due dispositivi diversi durante lo stesso allenamento, probabilmente non coincidono - e non è un errore di misurazione della frequenza cardiaca in sé, è quasi sempre una differenza di METODO. Alcuni dispositivi usano di default il metodo % FC massima, altri il metodo Karvonen (% riserva) solo se hai inserito una FC a riposo, altri ancora ancorano le zone a una soglia di lattato ottenuta da un test dedicato, e altri ricalcolano periodicamente la FC a riposo e quindi le zone stesse.",
          "Nessuno di questi metodi è \"sbagliato\": sono scelte di progettazione diverse, con conseguenze numeriche reali. Lo stesso sforzo percepito può ricadere in una zona nominale diversa (es. \"Zona 2\" su un dispositivo, \"Zona 3\" su un altro) semplicemente perché il riferimento usato per calcolare la percentuale è diverso, non perché il tuo corpo stia lavorando in modo diverso.",
          "Confrontare direttamente i numeri in bpm tra due dispositivi ha senso solo se sai quale metodo ciascuno usa. Questo calcolatore mostra entrambi i metodi fianco a fianco proprio per rendere esplicito questo confronto, invece di lasciarti indovinare perché i numeri non tornano.",
        ],
        en: [
          "If you have ever compared the zones shown by two different devices during the same workout, they probably do not match - and it is usually not a heart-rate-measurement error, it is almost always a difference in METHOD. Some devices default to the %max heart rate method, others use the Karvonen (%reserve) method only if you have entered a resting heart rate, others anchor zones to a lactate threshold obtained from a dedicated test, and others periodically recalculate resting heart rate and therefore the zones themselves.",
          "None of these methods is \"wrong\": they are different design choices with real numeric consequences. The same perceived effort can fall into a different nominal zone (e.g. \"Zone 2\" on one device, \"Zone 3\" on another) simply because the reference used to compute the percentage is different, not because your body is working differently.",
          "Comparing bpm numbers directly between two devices only makes sense if you know which method each one uses. This calculator shows both methods side by side specifically to make that comparison explicit, instead of leaving you to guess why the numbers do not match.",
        ],
      },
    },
    workedExample: {
      heading: { it: "Esempio numerico completo", en: "Full worked example" },
      paragraphs: {
        it: [
          "Età 40 anni (FC massima stimata con Tanaka: 208 − 0,7×40 = 180 bpm), FC a riposo 60 bpm (riserva cardiaca = 180 − 60 = 120 bpm).",
          "Zona 2 (60-70%) col metodo % FC massima: 180×0,60 = 108 bpm, 180×0,70 = 126 bpm → 108 ≤ FC < 126 bpm.",
          "Zona 2 (60-70%) col metodo Karvonen: 60 + 120×0,60 = 132 bpm, 60 + 120×0,70 = 144 bpm → 132 ≤ FC < 144 bpm.",
          "Stessa zona nominale, stessa persona, stesso istante: 18 bpm di differenza tra i due metodi solo per la scelta del riferimento.",
          "Convenzione dei confini: il limite inferiore di ogni zona è incluso, il limite superiore è escluso - tranne per la Zona 5, che include anche il limite superiore. Esempio: a esattamente 126 bpm (metodo % FC massima), il calcolatore assegna la Zona 3, non la Zona 2, perché 126 è il limite superiore ESCLUSO della Zona 2 ed è insieme il limite inferiore INCLUSO della Zona 3 - non un buco né una sovrapposizione, solo una regola di assegnazione univoca.",
        ],
        en: [
          "Age 40 (max heart rate estimated with Tanaka: 208 − 0.7×40 = 180 bpm), resting heart rate 60 bpm (heart rate reserve = 180 − 60 = 120 bpm).",
          "Zone 2 (60-70%) with the %max heart rate method: 180×0.60 = 108 bpm, 180×0.70 = 126 bpm → 108 ≤ HR < 126 bpm.",
          "Zone 2 (60-70%) with the Karvonen method: 60 + 120×0.60 = 132 bpm, 60 + 120×0.70 = 144 bpm → 132 ≤ HR < 144 bpm.",
          "Same nominal zone, same person, same instant: an 18 bpm difference between the two methods purely from the choice of reference.",
          "Boundary convention: each zone's lower bound is inclusive, its upper bound is exclusive - except for Zone 5, which also includes its upper bound. Example: at exactly 126 bpm (%max heart rate method), the calculator assigns Zone 3, not Zone 2, because 126 is Zone 2's EXCLUDED upper bound and Zone 3's INCLUDED lower bound at the same time - not a gap or an overlap, just an unambiguous assignment rule.",
        ],
      },
    },
    limits: {
      heading: { it: "Limiti", en: "Limits" },
      paragraphs: {
        it: [
          "Questo strumento non diagnostica nulla, non sostituisce un test da sforzo o un test del lattato in laboratorio, e non è un consiglio di allenamento personalizzato. Mostra solo i numeri calcolati dai dati che inserisci, con la formula esplicita usata per ottenerli.",
          "La FC massima stimata con Tanaka o con \"220-età\" è una media di popolazione, con una variabilità individuale reale intorno alla stima: la FC massima vera di una persona può discostarsi in modo significativo dal valore stimato dall'età, soprattutto per atleti allenati o condizioni individuali particolari. Se conosci la tua FC massima da un test reale, usa la modalità \"misurata\" invece di una delle due stime: nessun valore stimato da una formula sostituisce una misurazione individuale.",
          "L'intervallo 18-100 anni accettato dalle modalità di stima è un limite TECNICO di questo calcolatore, non una dichiarazione che l'intera fascia coincida esattamente con la popolazione studiata da Tanaka et al. (che descrivono la propria meta-analisi come condotta su \"adulti sani\", senza pubblicare i limiti di età esatti di ogni sotto-studio incluso). Alle età più vicine agli estremi di questo intervallo (vicino a 18 o vicino a 100 anni) la stima richiede particolare cautela: la variabilità individuale intorno al valore medio di popolazione tende a essere maggiore lontano dalle età più rappresentate negli studi.",
          "Le 5 fasce percentuali usate qui (50-60/60-70/70-80/80-90/90-100%) sono una convenzione comune, non l'unica in letteratura o nei dispositivi: alcuni sistemi usano 3 zone, altri 7, altri ancorano le zone a soglie di lattato individuali misurate in laboratorio anziché a percentuali fisse - motivo ulteriore per cui il numero di zona che vedi su un dispositivo può non corrispondere a quello di un altro.",
        ],
        en: [
          "This tool does not diagnose anything, does not replace a laboratory exercise or lactate test, and is not personalized training advice. It only shows the numbers calculated from the data you enter, with the explicit formula used to obtain them.",
          "The max heart rate estimated with Tanaka or with \"220-age\" is a population average, with real individual variability around the estimate: a person's true max heart rate can differ significantly from the value estimated from age, especially for trained athletes or particular individual conditions. If you know your max heart rate from a real test, use \"measured\" mode instead of either estimate: no formula-estimated value replaces an individual measurement.",
          "The 18-100 year range accepted by the estimate modes is a TECHNICAL limit of this calculator, not a claim that the entire range exactly matches the population studied by Tanaka et al. (who describe their meta-analysis as conducted on \"healthy adults\", without publishing the exact age limits of every included sub-study). At ages closer to the extremes of this range (near 18 or near 100 years), the estimate calls for particular caution: individual variability around the population average tends to be larger further from the ages most represented in the studies.",
          "The 5 percentage bands used here (50-60/60-70/70-80/80-90/90-100%) are a common convention, not the only one in the literature or in devices: some systems use 3 zones, others 7, others anchor zones to individually measured lactate thresholds instead of fixed percentages - a further reason why the zone number you see on one device may not match another.",
        ],
      },
    },
    privacy: {
      heading: { it: "Privacy", en: "Privacy" },
      paragraphs: {
        it: [
          "Tutto il calcolo avviene nel tuo browser: età, FC massima e FC a riposo che inserisci non vengono mai inviate a un server, non sono salvate da FitMesh, e non compaiono nell'URL della pagina. Chiudendo o ricaricando la pagina, i dati inseriti spariscono.",
          "L'export CSV e la copia del riepilogo avvengono localmente sul tuo dispositivo (download diretto o clipboard), senza alcun servizio esterno coinvolto.",
        ],
        en: [
          "All calculation happens in your browser: the age, max heart rate, and resting heart rate you enter are never sent to a server, are not saved by FitMesh, and never appear in the page URL. Closing or reloading the page clears whatever you entered.",
          "CSV export and copying the summary happen locally on your device (direct download or clipboard), with no external service involved.",
        ],
      },
    },
  },
  faq: [
    {
      question: { it: "Qual è il metodo giusto da usare, % FC max o Karvonen?", en: "Which method should I use, %HRmax or Karvonen?" },
      answer: {
        it: "Nessuno dei due è universalmente \"più giusto\": il metodo Karvonen tiene conto della tua FC a riposo ed è generalmente considerato più personalizzato, ma entrambi restano stime basate su formule di popolazione se la tua FC massima non è misurata da un test reale. La cosa più utile è sapere quale metodo usa il dispositivo che stai già usando per allenarti, per non confrontare numeri calcolati in modo diverso.",
        en: "Neither method is universally \"more correct\": the Karvonen method accounts for your resting heart rate and is generally considered more personalized, but both remain estimates based on population formulas if your max heart rate is not measured from a real test. The most useful thing is knowing which method the device you already train with uses, so you are not comparing numbers calculated differently.",
      },
    },
    {
      question: { it: "Perché la Zona 2 del mio anello/smartwatch non corrisponde a quella di questo calcolatore?", en: "Why doesn't my ring/smartwatch's Zone 2 match this calculator?" },
      answer: {
        it: "Perché il tuo dispositivo probabilmente usa un metodo diverso (% FC max invece di Karvonen, o viceversa), una FC massima stimata con una formula diversa da Tanaka, oppure zone ancorate a un test di soglia del lattato che questo calcolatore non replica. Vedi la sezione \"Perché anello, smartwatch e app mostrano zone diverse\" sopra.",
        en: "Because your device probably uses a different method (%HRmax instead of Karvonen, or vice versa), a max heart rate estimated with a different formula than Tanaka's, or zones anchored to a lactate threshold test this calculator does not replicate. See the \"Why your ring, smartwatch, and apps show different zones\" section above.",
      },
    },
    {
      question: { it: "Come inserisco la mia FC massima reale invece di stimarla dall'età?", en: "How do I enter my real max heart rate instead of estimating it from age?" },
      answer: {
        it: "Passa alla modalità \"misurata\" e inserisci il valore che conosci (da un test da sforzo, un test di laboratorio, o il picco osservato con un cardiofrequenzimetro durante uno sforzo massimale reale). Il calcolatore userà quel valore al posto della stima scelta (Tanaka o 220-età).",
        en: "Switch to \"measured\" mode and enter the value you know (from a graded exercise test, a lab test, or the peak observed with a heart rate monitor during a real maximal effort). The calculator will use that value instead of the chosen estimate (Tanaka or 220-age).",
      },
    },
    {
      question: { it: "Perché offrite sia Tanaka sia \"220-età\"? Quale devo usare?", en: "Why do you offer both Tanaka and \"220-age\"? Which should I use?" },
      answer: {
        it: "\"220-età\" è la stima più diffusa nell'uso pratico, ma la sua origine non è tracciabile con certezza a un singolo studio validato. Tanaka (2001) fu pubblicata proprio per sostituirla con una stima basata su una meta-analisi più ampia. Le due formule coincidono esattamente a 40 anni e divergono in direzioni opposte allontanandosi da quell'età (vedi la sezione dedicata sopra). Se non hai una FC massima misurata, Tanaka è la stima con la base di evidenza più solida delle due; \"220-età\" resta qui perché è quella che probabilmente già conosci dal tuo dispositivo, per un confronto diretto.",
        en: "\"220-age\" is the most common estimate in practical use, but its origin cannot be reliably traced to a single validated study. Tanaka (2001) was published specifically to replace it with an estimate based on a larger meta-analysis. The two formulas coincide exactly at age 40 and diverge in opposite directions moving away from that age (see the dedicated section above). If you don't have a measured max heart rate, Tanaka has the stronger evidence base of the two; \"220-age\" is included here because it's likely the one your device already shows you, for a direct comparison.",
      },
    },
    {
      question: { it: "Perché il calcolatore non accetta età da bambino con le modalità di stima?", en: "Why doesn't the calculator accept a child's age with the estimate modes?" },
      answer: {
        it: "Le formule di Tanaka e \"220-età\" sono state sviluppate e verificate su popolazioni adulte (lo studio di Tanaka descrive esplicitamente la propria meta-analisi come condotta su adulti sani): applicarle a un'età pediatrica andrebbe oltre il range su cui sono verificate, non perché un'età bassa sia di per sé un dato impossibile. La modalità \"misurata\" invece non usa né richiede l'età, perché non entra nel calcolo.",
        en: "The Tanaka and \"220-age\" formulas were developed and verified on adult populations (Tanaka's study explicitly describes its meta-analysis as conducted on healthy adults): applying them to a pediatric age would go beyond the range they are verified for, not because a low age is itself an impossible value. \"Measured\" mode, on the other hand, does not use or require age at all, since it doesn't enter the calculation.",
      },
    },
    {
      question: { it: "Cosa succede se la mia FC a riposo è quasi uguale alla mia FC massima?", en: "What happens if my resting heart rate is close to my max heart rate?" },
      answer: {
        it: "Se la FC a riposo inserita è pari o superiore alla FC massima (stimata o misurata), il calcolo è fisiologicamente impossibile: il calcolatore blocca il risultato con un messaggio d'errore invece di mostrare zone incoerenti. Una riserva cardiaca molto stretta ma ancora valida genera invece solo un avviso non bloccante.",
        en: "If the entered resting heart rate is equal to or higher than max heart rate (estimated or measured), the calculation is physiologically impossible: the calculator blocks the result with an error message instead of showing inconsistent zones. A valid but very narrow heart rate reserve instead only produces a non-blocking warning.",
      },
    },
    {
      question: { it: "I miei dati vengono inviati o salvati da qualche parte?", en: "Is my data sent or saved anywhere?" },
      answer: {
        it: "No: il calcolo avviene interamente nel browser. Nessuna richiesta di rete, nessun salvataggio su server FitMesh, nessun dato nell'URL.",
        en: "No: the calculation happens entirely in your browser. No network request, no saving to FitMesh servers, no data in the URL.",
      },
    },
  ],
  sources: [
    {
      title: { it: "Age-predicted maximal heart rate revisited", en: "Age-predicted maximal heart rate revisited" },
      authorOrOrg: { it: "Tanaka H, Monahan KD, Seals DR - Journal of the American College of Cardiology", en: "Tanaka H, Monahan KD, Seals DR - Journal of the American College of Cardiology" },
      year: "2001",
      url: "https://www.jacc.org/doi/abs/10.1016/s0735-1097(00)01054-8",
      verifiedOn: { it: "30 luglio 2026", en: "July 30, 2026" },
    },
    {
      title: { it: "The effects of training on heart rate; a longitudinal study", en: "The effects of training on heart rate; a longitudinal study" },
      authorOrOrg: { it: "Karvonen MJ, Kentala E, Mustala O - Annales Medicinae Experimentalis et Biologiae Fenniae", en: "Karvonen MJ, Kentala E, Mustala O - Annales Medicinae Experimentalis et Biologiae Fenniae" },
      year: "1957",
      url: "https://pubmed.ncbi.nlm.nih.gov/13470504/",
      verifiedOn: { it: "30 luglio 2026", en: "July 30, 2026" },
    },
    {
      title: {
        it: "Assessment of Metabolic Flexibility by Means of Measuring Blood Lactate, Fat, and Carbohydrate Oxidation Responses to Exercise in Professional Endurance Athletes and Less-Fit Individuals",
        en: "Assessment of Metabolic Flexibility by Means of Measuring Blood Lactate, Fat, and Carbohydrate Oxidation Responses to Exercise in Professional Endurance Athletes and Less-Fit Individuals",
      },
      authorOrOrg: { it: "San-Millán I, Brooks GA - Sports Medicine", en: "San-Millán I, Brooks GA - Sports Medicine" },
      year: "2018",
      url: "https://pubmed.ncbi.nlm.nih.gov/28623613/",
      verifiedOn: { it: "30 luglio 2026", en: "July 30, 2026" },
    },
  ],
  formulaPlainText: {
    it: "FC max (Tanaka) = 208 − 0,7 × età. FC max (220-età) = 220 − età. Zona (% FC max) = FC max × %. Zona (Karvonen) = FC riposo + (FC max − FC riposo) × %",
    en: "Max HR (Tanaka) = 208 − 0.7 × age. Max HR (220-age) = 220 − age. Zone (%HRmax) = Max HR × %. Zone (Karvonen) = Resting HR + (Max HR − Resting HR) × %",
  },
  formulaHeading: { it: "Formule", en: "Formulas" },
  formulaExplanation: {
    it: "Due modi di calcolare la stessa fascia percentuale di intensità: uno usa solo la FC massima come riferimento, l'altro usa la riserva cardiaca (FC massima meno FC a riposo).",
    en: "Two ways to calculate the same percentage intensity band: one uses only max heart rate as the reference, the other uses heart rate reserve (max heart rate minus resting heart rate).",
  },
  citationHeading: { it: "Come citare questo strumento", en: "How to cite this tool" },
  citationText: {
    it: `FitMesh Labs, "Calcolatore zone di frequenza cardiaca" (versione metodologia ${METHODOLOGY_VERSION}, ultima revisione ${LAST_REVIEWED}).`,
    en: `FitMesh Labs, "Heart Rate Zones Calculator" (methodology version ${METHODOLOGY_VERSION}, last reviewed ${LAST_REVIEWED}).`,
  },
  copyLabel: { it: "Copia citazione", en: "Copy citation" },
  copiedLabel: { it: "Copiato", en: "Copied" },
  ctaHeading: {
    it: "Vuoi riunire battito e allenamenti compatibili in un'unica cronologia?",
    en: "Want to keep compatible heart-rate and workout data in one timeline?",
  },
  ctaBody: {
    it: "FitMesh Sync porta la frequenza cardiaca e gli allenamenti compatibili rilevati da anello o smartwatch in un'unica cronologia personale. Il calcolatore sopra resta uno strumento educativo indipendente: FitMesh non ricalcola né configura le zone di frequenza cardiaca del tuo dispositivo.",
    en: "FitMesh Sync brings compatible heart rate and workout data detected by your ring or smartwatch into a single personal timeline. The calculator above remains a separate educational tool: FitMesh does not recalculate or configure your device's heart rate zones.",
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
  zoneNames: {
    z1: { it: "Zona 1 · Molto leggero", en: "Zone 1 · Very light" },
    z2: { it: "Zona 2 · Leggero", en: "Zone 2 · Light" },
    z3: { it: "Zona 3 · Moderato", en: "Zone 3 · Moderate" },
    z4: { it: "Zona 4 · Intenso", en: "Zone 4 · Hard" },
    z5: { it: "Zona 5 · Massimale", en: "Zone 5 · Maximum" },
  },
  calculatorLabels: {
    maxHrModeLabel: { it: "FC massima", en: "Max heart rate" },
    maxHrModeTanaka: { it: "Stima (Tanaka)", en: "Estimate (Tanaka)" },
    maxHrModeAge220: { it: "Stima (220-età)", en: "Estimate (220-age)" },
    maxHrModeMeasured: { it: "Valore misurato", en: "Measured value" },
    maxHrModeAge220Hint: {
      it: "Stima classica e molto diffusa, non convalidata con la stessa precisione della formula di Tanaka.",
      en: "Classic, very common estimate, not validated with the same precision as the Tanaka formula.",
    },
    ageLabel: { it: "Età", en: "Age" },
    measuredMaxHrLabel: { it: "FC massima misurata (bpm)", en: "Measured max heart rate (bpm)" },
    restingHrLabel: { it: "FC a riposo (bpm)", en: "Resting heart rate (bpm)" },
    sampleDataButton: { it: "Usa dati di esempio", en: "Use sample data" },
    resetButton: { it: "Azzera", en: "Reset" },
    resultsHeading: { it: "Risultati", en: "Results" },
    resultMethodLabel: { it: "Metodo FC massima", en: "Max heart rate method" },
    resultMaxHr: { it: "FC massima", en: "Max heart rate" },
    resultRestingHr: { it: "FC a riposo", en: "Resting heart rate" },
    resultHrr: { it: "Riserva cardiaca (HRR)", en: "Heart rate reserve (HRR)" },
    percentMaxHrTableHeading: { it: "Zone: metodo % FC massima", en: "Zones: %max heart rate method" },
    hrrTableHeading: { it: "Zone: metodo Karvonen (% riserva)", en: "Zones: Karvonen method (%reserve)" },
    tableZoneColumn: { it: "Zona", en: "Zone" },
    tableRangeColumn: { it: "Intervallo (bpm)", en: "Range (bpm)" },
    copyResultsButton: { it: "Copia risultati", en: "Copy results" },
    copiedButton: { it: "Copiato", en: "Copied" },
    downloadCsvButton: { it: "Scarica CSV", en: "Download CSV" },
    noResultsYet: { it: "Inserisci i dati per vedere il risultato.", en: "Enter your data to see the result." },
    errorMissingField: { it: "Campo mancante", en: "Missing field" },
    errorNegativeValue: { it: "Il valore non può essere negativo", en: "Value cannot be negative" },
    errorAgeOutOfRange: {
      it: "Età fuori dall'intervallo supportato da questo calcolatore: usa un valore tra 18 e 100 anni (le formule di stima sono verificate su popolazioni adulte, non pediatriche).",
      en: "Age outside this calculator's supported range: use a value between 18 and 100 years (the estimation formulas are verified on adult populations, not pediatric ones).",
    },
    errorMaxHrOutOfRange: { it: "FC massima non plausibile: usa un valore tra 100 e 230 bpm", en: "Implausible max heart rate: use a value between 100 and 230 bpm" },
    errorRestingHrOutOfRange: { it: "FC a riposo non plausibile: usa un valore tra 25 e 150 bpm", en: "Implausible resting heart rate: use a value between 25 and 150 bpm" },
    errorRestingHrNotBelowMax: {
      it: "La FC a riposo deve essere inferiore alla FC massima: questo non è fisiologicamente possibile. Correggi uno dei due valori.",
      en: "Resting heart rate must be lower than max heart rate: this is not physiologically possible. Fix one of the two values.",
    },
    warningHighRestingHr: {
      it: "FC a riposo insolitamente alta: verifica di aver inserito il valore corretto.",
      en: "Unusually high resting heart rate: check that you entered the correct value.",
    },
    warningLowRestingHr: {
      it: "FC a riposo insolitamente bassa: verifica di aver inserito il valore corretto.",
      en: "Unusually low resting heart rate: check that you entered the correct value.",
    },
    warningNarrowReserve: {
      it: "Riserva cardiaca molto stretta: le zone Karvonen risultanti saranno molto ravvicinate.",
      en: "Very narrow heart rate reserve: the resulting Karvonen zones will be very close together.",
    },
  },
};
