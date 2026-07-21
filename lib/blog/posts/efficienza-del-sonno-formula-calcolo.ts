import type { BlogPost } from "../types";

/**
 * P1.1 Fase 9.1 — articolo editoriale per il nuovo Calcolatore Efficienza
 * del Sonno (/labs/calcolatore-efficienza-sonno). Stesse fonti primarie già
 * verificate live per il contenuto del tool (lib/labs/sleep-efficiency/
 * content.ts): Reed & Sacco 2016, Buysse et al. 1989 (PSQI), AASM Scoring
 * Manual 2007. Solo it/en per ora, come il resto del cluster Labs P1.1.
 */
export const post: BlogPost = {
  slug: "efficienza-del-sonno-formula-calcolo",
  category: "guides",
  publishedAt: "2026-07-18",
  updatedAt: "2026-07-18",
  readMinutes: 8,
  hero: {
    kicker: { it: "Sonno", en: "Sleep" },
    title: {
      it: "Efficienza del sonno: formula, calcolo e interpretazione",
      en: "Sleep efficiency: formula, calculation and interpretation",
    },
    subtitle: {
      it: "Quanto del tempo passato a letto è davvero sonno? La formula è semplice, ma il numero che ne esce dipende da come definisci 'tempo a letto': questa guida spiega la formula, un esempio completo e i limiti da conoscere prima di fidartene.",
      en: "How much of the time you spend in bed is actually sleep? The formula is simple, but the number you get depends on how you define \"time in bed\": this guide covers the formula, a full worked example, and the limits worth knowing before you trust it.",
    },
  },
  metaDescription: {
    it: "Efficienza del sonno: cos'è, come si calcola (formula TST/TIB × 100), esempio numerico completo e limiti. Con calcolatore gratuito nel browser.",
    en: "Sleep efficiency: what it is, how to calculate it (TST/TIB × 100 formula), a full worked example, and its limits. With a free in-browser calculator.",
  },
  primaryKeyword: {
    it: "efficienza del sonno formula",
    en: "sleep efficiency formula",
  },
  secondaryKeywords: {
    it: [
      "come si calcola l'efficienza del sonno",
      "tempo a letto vs tempo dormito",
      "calcolatore efficienza sonno",
      "cos'è una buona efficienza del sonno",
      "efficienza del sonno percentuale",
    ],
    en: [
      "how to calculate sleep efficiency",
      "time in bed vs time asleep",
      "sleep efficiency calculator",
      "what is good sleep efficiency",
      "sleep efficiency percentage",
    ],
  },
  tldr: {
    it: [
      "Efficienza del sonno = Tempo Totale di Sonno diviso Tempo Totale a Letto, moltiplicato per 100.",
      "Esempio: 8 ore a letto, 7 ore dormite → efficienza = 87,5%.",
      "Il denominatore 'tempo a letto' non ha un'unica definizione in letteratura: strumenti diversi possono dare numeri diversi per la stessa notte.",
      "Non esiste una soglia universale di 'buono/cattivo' applicata qui: la CBT-I usa soglie operative guidate da un professionista, non un giudizio automatico su un singolo calcolo.",
      "Puoi calcolarla gratis, nel browser, con il Calcolatore Efficienza del Sonno di FitMesh Labs: nessun dato inviato a un server.",
    ],
    en: [
      "Sleep efficiency = Total Sleep Time divided by Time in Bed, multiplied by 100.",
      "Example: 8 hours in bed, 7 hours asleep → efficiency = 87.5%.",
      "The \"time in bed\" denominator doesn't have one single definition in the literature: different tools can give different numbers for the same night.",
      "There's no universal \"good/bad\" threshold applied here: CBT-I uses professional-guided operational thresholds, not an automatic judgment on a single calculation.",
      "You can calculate it for free, in your browser, with FitMesh Labs' Sleep Efficiency Calculator: no data sent to a server.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "L'efficienza del sonno è una delle metriche più citate nella ricerca sul sonno: mette in relazione quanto tempo passi a letto con quanto di quel tempo è effettivamente sonno. È alla base di molti protocolli di terapia cognitivo-comportamentale per l'insonnia (CBT-I) ed è la metrica che molti wearable riportano come parte del loro punteggio sonno. Questa guida spiega la formula esatta, un esempio numerico completo, e perché due strumenti diversi possono darti risultati leggermente diversi per la stessa notte.",
        en: "Sleep efficiency is one of the most cited metrics in sleep research: it relates how much time you spend in bed to how much of that time is actually sleep. It underlies many cognitive behavioral therapy for insomnia (CBT-I) protocols, and it's the metric many wearables report as part of their sleep score. This guide covers the exact formula, a full worked example, and why two different tools can give you slightly different results for the same night.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Risposta rapida", en: "Quick answer" },
      body: {
        it: "Efficienza del sonno (%) = Tempo Totale di Sonno / Tempo Totale a Letto × 100. Esempio: 420 minuti dormiti su 480 minuti a letto = 87,5%. Nessuna soglia universale di 'buono/cattivo' qui: solo il numero calcolato dai tuoi dati.",
        en: "Sleep Efficiency (%) = Total Sleep Time / Time in Bed × 100. Example: 420 minutes asleep out of 480 minutes in bed = 87.5%. No universal \"good/bad\" threshold here: just the number calculated from your data.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "La formula", en: "The formula" },
    },
    {
      type: "paragraph",
      text: {
        it: "**Efficienza del sonno (%) = Tempo Totale di Sonno ÷ Tempo Totale a Letto × 100.** Il Tempo Totale di Sonno (TST, Total Sleep Time) è quanto hai effettivamente dormito. Il Tempo Totale a Letto (TIB, Time in Bed) è quanto tempo sei rimasto a letto in totale, sonno più veglia: latenza di addormentamento, risvegli notturni, e il tempo sveglio a letto prima di alzarti al mattino.",
        en: "**Sleep Efficiency (%) = Total Sleep Time ÷ Time in Bed × 100.** Total Sleep Time (TST) is how much you actually slept. Time in Bed (TIB) is how long you stayed in bed in total, sleep plus wakefulness: sleep onset latency, night-time awakenings, and the time spent awake in bed before getting up in the morning.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Esempio di calcolo completo", en: "Full worked example" },
    },
    {
      type: "paragraph",
      text: {
        it: "Vai a letto alle 23:30 e ti alzi definitivamente alle 07:15: tempo a letto = 7 ore e 45 minuti (465 minuti). Ci metti 15 minuti ad addormentarti, sei sveglio 20 minuti durante la notte, e resti a letto sveglio 5 minuti dopo il risveglio finale prima di alzarti: tempo sveglio totale = 40 minuti. Tempo di sonno = 465 − 40 = 425 minuti. Efficienza del sonno = 425 / 465 × 100 ≈ 91,4%.",
        en: "You go to bed at 11:30 PM and get up for good at 7:15 AM: time in bed = 7 hours 45 minutes (465 minutes). It takes you 15 minutes to fall asleep, you're awake 20 minutes during the night, and you stay awake in bed 5 minutes after your final wake-up before getting up: total awake time = 40 minutes. Sleep time = 465 − 40 = 425 minutes. Sleep efficiency = 425 / 465 × 100 ≈ 91.4%.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Puoi rifare questo identico calcolo, e provare i tuoi numeri, con il [Calcolatore Efficienza del Sonno di FitMesh Labs](/it/labs/calcolatore-efficienza-sonno): modalità semplice (solo tempo a letto e tempo dormito) o avanzata (con orari, latenza e risvegli), tutto calcolato nel browser, nessun dato inviato a un server.",
        en: "You can redo this exact calculation, and try your own numbers, with the [FitMesh Labs Sleep Efficiency Calculator](/en/labs/sleep-efficiency-calculator): simple mode (just time in bed and time asleep) or advanced mode (with clock times, latency and awakenings), all calculated in your browser, no data sent to a server.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Tempo a letto vs tempo dormito: perché la differenza conta",
        en: "Time in bed vs. time asleep: why the difference matters",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Un'efficienza bassa non significa necessariamente 'poco sonno': può indicare che passi molto tempo a letto sveglio, per difficoltà ad addormentarti, risvegli frequenti, o semplicemente l'abitudine di restare a letto sveglio prima di alzarti (a leggere, al telefono). L'efficienza isola questo dal tempo di sonno assoluto: due notti con lo stesso numero di ore dormite possono avere efficienze molto diverse a seconda di quanto tempo extra hai passato a letto senza dormire.",
        en: "Low efficiency doesn't necessarily mean \"little sleep\": it can mean you spend a lot of time in bed awake, from difficulty falling asleep, frequent awakenings, or simply the habit of staying in bed awake before getting up (reading, on your phone). Efficiency isolates this from absolute sleep time: two nights with the same number of hours slept can have very different efficiencies depending on how much extra time you spent in bed not sleeping.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché il denominatore è oggetto di dibattito",
        en: "Why the denominator is debated",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La definizione che questa guida usa (TST / TIB × 100) è quella più diffusa, ma non è l'unica in letteratura. Uno studio pubblicato sul Journal of Clinical Sleep Medicine (Reed & Sacco, 2016) mostra che scegliere un denominatore diverso (per esempio la 'durata dell'episodio di sonno' invece del tempo a letto grezzo) può cambiare il risultato di diversi punti percentuali per la stessa notte. Non è un difetto della formula: è un motivo in più per sapere esattamente quale definizione sta usando lo strumento che stai guardando, prima di confrontare numeri fra dispositivi diversi.",
        en: "The definition this guide uses (TST / TIB × 100) is the most common, but it's not the only one in the literature. A study published in the Journal of Clinical Sleep Medicine (Reed & Sacco, 2016) shows that choosing a different denominator (for example \"sleep episode duration\" instead of raw time in bed) can shift the result by several percentage points for the same night. That's not a flaw in the formula: it's one more reason to know exactly which definition the tool you're looking at is using, before comparing numbers across different devices.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Come i wearable stimano il tempo di sonno", en: "How wearables estimate sleep time" },
    },
    {
      type: "list",
      items: {
        it: [
          "**Actigrafia**: stima il sonno dal movimento (accelerometro): meno movimento = probabile sonno. Metodo storico, usato anche in ricerca clinica, ma può confondere l'immobilità sveglia con il sonno.",
          "**PPG (fotopletismografia)**: aggiunge il segnale del battito cardiaco/variabilità HRV al movimento per classificare le fasi del sonno con più precisione, tipico di anelli e orologi moderni.",
          "**Diario del sonno (self-report)**: quello che percepisci tu al risveglio, spesso meno preciso per la latenza esatta e i risvegli brevi che non ricordi, ma è l'unico metodo che non richiede un dispositivo.",
        ],
        en: [
          "**Actigraphy**: estimates sleep from movement (accelerometer): less movement = likely sleep. The historical method, also used in clinical research, but can confuse being still while awake with sleep.",
          "**PPG (photoplethysmography)**: adds heart rate/HRV signal to movement to classify sleep stages more precisely, typical of modern rings and watches.",
          "**Sleep diary (self-report)**: what you perceive when you wake up, often less precise for exact latency and brief awakenings you don't remember, but it's the only method that needs no device.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Limiti", en: "Limits" },
    },
    {
      type: "paragraph",
      text: {
        it: "L'efficienza del sonno non è una diagnosi e non sostituisce una valutazione clinica (polisonnografia, actigrafia professionale, un colloquio con un medico del sonno). Un singolo numero, una singola notte, dice poco: la letteratura sul sonno tratta l'efficienza come utile soprattutto come trend nel tempo, in condizioni comparabili, non come valore isolato da giudicare.",
        en: "Sleep efficiency is not a diagnosis and doesn't replace a clinical assessment (polysomnography, professional actigraphy, a consultation with a sleep physician). A single number, a single night, says little: the sleep literature treats efficiency as most useful as a trend over time, under comparable conditions, not as an isolated value to judge.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Calcola la tua efficienza del sonno gratis",
        en: "Calculate your sleep efficiency for free",
      },
      body: {
        it: "Modalità semplice o avanzata, formula e metodologia trasparenti, tutto nel browser. Nessun dato inviato a un server FitMesh.",
        en: "Simple or advanced mode, transparent formula and methodology, all in your browser. No data sent to a FitMesh server.",
      },
      ctaLabel: { it: "Apri il calcolatore →", en: "Open the calculator →" },
      ctaHref: { it: "/it/labs/calcolatore-efficienza-sonno", en: "/en/labs/sleep-efficiency-calculator" },
    },
  ],
  faq: [
    {
      q: { it: "Qual è una buona efficienza del sonno?", en: "What is a good sleep efficiency?" },
      a: {
        it: "Non esiste un numero universalmente valido applicato qui: la terapia CBT-I usa spesso l'85% come soglia operativa (sotto la quale si accorcia il tempo a letto), ma è un protocollo clinico guidato da un professionista, non un giudizio automatico su un singolo calcolo.",
        en: "There's no universally valid number applied here: CBT-I therapy often uses 85% as an operational threshold (below which time in bed is shortened), but that's a clinical protocol guided by a professional, not an automatic judgment on a single calculation.",
      },
    },
    {
      q: { it: "Perché la mia efficienza cambia da app ad app?", en: "Why does my efficiency differ between apps?" },
      a: {
        it: "Perché il denominatore 'tempo a letto' non ha una definizione unica (vedi sopra): app e dispositivi diversi possono calcolarlo in modo leggermente diverso, e la stima di quando ti sei addormentato/svegliato varia in base al sensore (actigrafia vs PPG vs diario).",
        en: "Because the \"time in bed\" denominator doesn't have a single definition (see above): different apps and devices can calculate it slightly differently, and the estimate of when you fell asleep/woke up varies by sensor (actigraphy vs. PPG vs. diary).",
      },
    },
    {
      q: { it: "L'efficienza del sonno può superare il 100%?", en: "Can sleep efficiency exceed 100%?" },
      a: {
        it: "Numericamente sì, se il tempo di sonno registrato/derivato supera il tempo a letto: è quasi sempre un segnale che uno dei dati inseriti o stimati è incoerente, non un risultato fisiologicamente valido.",
        en: "Numerically, yes, if the recorded/derived sleep time exceeds time in bed: it's almost always a sign that one of the entered or estimated values is inconsistent, not a physiologically valid result.",
      },
    },
    {
      q: { it: "Qual è la differenza fra efficienza del sonno e durata del sonno?", en: "What's the difference between sleep efficiency and sleep duration?" },
      a: {
        it: "La durata del sonno è un numero assoluto (quante ore hai dormito). L'efficienza è un rapporto (quale frazione del tempo a letto era sonno). Puoi dormire poche ore con un'efficienza alta (poco tempo a letto sveglio), o molte ore con un'efficienza bassa (molto tempo a letto sveglio).",
        en: "Sleep duration is an absolute number (how many hours you slept). Efficiency is a ratio (what fraction of time in bed was sleep). You can sleep few hours with high efficiency (little time in bed awake), or many hours with low efficiency (a lot of time in bed awake).",
      },
    },
    {
      q: { it: "I miei dati vengono inviati o salvati da qualche parte?", en: "Is my data sent or saved anywhere?" },
      a: {
        it: "No: il Calcolatore Efficienza del Sonno di FitMesh Labs calcola interamente nel browser. Nessuna richiesta di rete, nessun salvataggio su server, nessun dato nell'URL.",
        en: "No: the FitMesh Labs Sleep Efficiency Calculator calculates entirely in your browser. No network request, no server-side saving, no data in the URL.",
      },
    },
  ],
  sources: [
    "https://jcsm.aasm.org/doi/10.5664/jcsm.5498",
    "https://pubmed.ncbi.nlm.nih.gov/2748771/",
    "https://aasm.org/clinical-resources/scoring-manual/",
  ],
  related: [
    "hrv-cose-significato-valori",
    "metriche-recupero-hrv-sonno-frequenza-cardiaca",
    "tracciare-sonno-anello",
  ],
  ldType: "BlogPosting",
};
