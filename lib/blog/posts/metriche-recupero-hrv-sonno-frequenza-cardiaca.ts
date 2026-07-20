import type { BlogPost } from "../types";

/**
 * P1.1 Fase 9.2 — pillar "Metriche di recupero", collega HRV/RMSSD,
 * frequenza cardiaca a riposo, durata e efficienza del sonno, debito di
 * sonno. Nessun tool "debito di sonno" esiste ancora in FitMesh Labs: questo
 * pillar lo NOMINA come concetto senza promettere uno strumento non live
 * (requisito esplicito Fase 9.2). Collega i 2 calcolatori live (HRV,
 * Sleep Efficiency) e i rispettivi articoli.
 */
export const post: BlogPost = {
  slug: "metriche-recupero-hrv-sonno-frequenza-cardiaca",
  category: "guides",
  pillar: true,
  publishedAt: "2026-07-18",
  updatedAt: "2026-07-18",
  readMinutes: 10,
  hero: {
    kicker: { it: "Recupero", en: "Recovery" },
    title: {
      it: "Metriche di recupero: HRV, sonno e frequenza cardiaca",
      en: "Recovery metrics: HRV, sleep and resting heart rate",
    },
    subtitle: {
      it: "HRV, frequenza cardiaca a riposo, durata ed efficienza del sonno: metriche diverse, spesso confuse fra loro. Questa guida spiega cosa misura ciascuna, come si collegano, e dove calcolarle gratis nel browser — senza ridurle a un singolo punteggio 'di recupero' universale.",
      en: "HRV, resting heart rate, sleep duration and sleep efficiency: different metrics, often confused with one another. This guide explains what each one measures, how they connect, and where to calculate them for free in your browser — without reducing them to a single universal \"recovery score\".",
    },
  },
  metaDescription: {
    it: "HRV, frequenza cardiaca a riposo, durata ed efficienza del sonno: guida alle metriche di recupero, come si collegano fra loro, e calcolatori gratuiti.",
    en: "HRV, resting heart rate, sleep duration and sleep efficiency: a guide to recovery metrics, how they connect, and free calculators.",
  },
  primaryKeyword: {
    it: "metriche di recupero",
    en: "recovery metrics",
  },
  secondaryKeywords: {
    it: [
      "hrv e sonno",
      "frequenza cardiaca a riposo recupero",
      "debito di sonno",
      "come misurare il recupero",
      "recovery index cos'è",
    ],
    en: [
      "hrv and sleep",
      "resting heart rate recovery",
      "sleep debt",
      "how to measure recovery",
      "what is a recovery index",
    ],
  },
  tldr: {
    it: [
      "Il 'recupero' non è una singola metrica: è la combinazione di più segnali distinti — HRV, frequenza cardiaca a riposo, durata ed efficienza del sonno.",
      "HRV (RMSSD) riflette l'attività del sistema nervoso autonomo battito-per-battito, non la qualità del sonno in sé.",
      "L'efficienza del sonno dice quanto del tempo a letto era sonno reale; la durata dice quante ore hai dormito: sono due numeri diversi.",
      "Il debito di sonno (l'accumulo di sonno mancato su più notti) è un concetto reale nella letteratura, ma FitMesh non ha ancora uno strumento dedicato per calcolarlo.",
      "Puoi calcolare HRV ed efficienza del sonno gratis, nel browser, con FitMesh Labs — nessun punteggio composito, solo i numeri con la formula esplicita.",
    ],
    en: [
      "\"Recovery\" isn't a single metric: it's the combination of several distinct signals — HRV, resting heart rate, sleep duration and sleep efficiency.",
      "HRV (RMSSD) reflects autonomic nervous system activity beat-by-beat, not sleep quality itself.",
      "Sleep efficiency tells you how much of your time in bed was real sleep; duration tells you how many hours you slept: two different numbers.",
      "Sleep debt (the accumulation of missed sleep across multiple nights) is a real concept in the literature, but FitMesh doesn't have a dedicated tool to calculate it yet.",
      "You can calculate HRV and sleep efficiency for free, in your browser, with FitMesh Labs — no composite score, just the numbers with the explicit formula.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Molti wearable riducono il recupero a un singolo numero: un 'punteggio di readiness' o 'battery' che promette di dirti, con un colpo d'occhio, se oggi sei pronto o no. Il problema è che quel numero nasconde diversi segnali fisiologici distinti, spesso combinati con pesi proprietari mai dichiarati. Questa guida fa il percorso inverso: separa le metriche che compongono l'idea di 'recupero', spiega cosa misura ciascuna, e mostra dove puoi calcolarle tu stesso, con la formula esplicita, gratis.",
        en: "Many wearables reduce recovery to a single number: a \"readiness\" or \"battery\" score that promises to tell you, at a glance, whether you're ready today or not. The problem is that number hides several distinct physiological signals, often combined with proprietary weights that are never disclosed. This guide takes the opposite path: it separates out the metrics that make up the idea of \"recovery\", explains what each one measures, and shows you where you can calculate them yourself, with the explicit formula, for free.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Le metriche, una per una", en: "The metrics, one by one" },
    },
    {
      type: "list",
      items: {
        it: [
          "**HRV (variabilità della frequenza cardiaca)**: quanto varia l'intervallo fra un battito e il successivo. Riflette l'attività del sistema nervoso autonomo, non la frequenza cardiaca media. Metrica di riferimento: RMSSD. [Guida completa + calcolatore →](/it/labs/calcolatore-hrv-rmssd)",
          "**Frequenza cardiaca a riposo**: la media dei battiti al minuto in condizioni di riposo, tipicamente misurata durante il sonno. Un valore stabile nel tempo per la stessa persona, che tende a salire con stress fisiologico acuto (malattia, alcol, sovrallenamento).",
          "**Durata del sonno**: quante ore hai effettivamente dormito, in totale. Un numero assoluto, non un rapporto.",
          "**Efficienza del sonno**: quale frazione del tempo passato a letto era sonno reale, non veglia. Un rapporto, non un numero assoluto. [Guida completa + calcolatore →](/it/labs/calcolatore-efficienza-sonno)",
          "**Debito di sonno**: l'accumulo di sonno mancato rispetto al tuo fabbisogno, su più notti consecutive. Concetto reale e discusso nella letteratura sul sonno, ma FitMesh non ha oggi uno strumento dedicato per calcolarlo: lo citiamo qui per completezza, non per promettere una funzione che non esiste ancora.",
        ],
        en: [
          "**HRV (heart rate variability)**: how much the interval between one heartbeat and the next varies. Reflects autonomic nervous system activity, not average heart rate. Reference metric: RMSSD. [Full guide + calculator →](/en/labs/hrv-rmssd-calculator)",
          "**Resting heart rate**: the average beats per minute at rest, typically measured during sleep. A value that's stable over time for a given person, and tends to rise with acute physiological stress (illness, alcohol, overtraining).",
          "**Sleep duration**: how many hours you actually slept, in total. An absolute number, not a ratio.",
          "**Sleep efficiency**: what fraction of the time spent in bed was real sleep, not wakefulness. A ratio, not an absolute number. [Full guide + calculator →](/en/labs/sleep-efficiency-calculator)",
          "**Sleep debt**: the accumulation of missed sleep relative to your need, across multiple consecutive nights. A real concept discussed in the sleep literature, but FitMesh doesn't have a dedicated tool to calculate it today: we mention it here for completeness, not to promise a feature that doesn't exist yet.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come si collegano (e perché non è un unico numero)",
        en: "How they connect (and why it isn't one number)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Queste metriche sono correlate ma non intercambiabili. Puoi dormire 8 ore (buona durata) con un'efficienza bassa (molto tempo sveglio a letto). Puoi avere un'HRV nella tua norma personale ma una frequenza a riposo elevata per una notte di alcol. Un punteggio unico che le combina nasconde proprio queste discrepanze, che sono spesso l'informazione più utile: sapere QUALE segnale è fuori norma ti dice di più che un numero composito che li media insieme.",
        en: "These metrics correlate but aren't interchangeable. You can sleep 8 hours (good duration) with low efficiency (a lot of time awake in bed). You can have HRV within your personal norm but an elevated resting heart rate for a night after drinking. A single score that combines them hides exactly these discrepancies, which are often the most useful information: knowing WHICH signal is off tells you more than a composite number that averages them together.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Cosa fa FitMesh diversamente", en: "What FitMesh does differently" },
      body: {
        it: "FitMesh mostra le metriche separatamente nella dashboard, senza comprimerle in un punteggio proprietario a scatola chiusa. I due calcolatori FitMesh Labs (HRV, Efficienza del sonno) sono gratuiti, mostrano la formula esatta, e calcolano tutto nel tuo browser.",
        en: "FitMesh shows metrics separately in the dashboard, without compressing them into a proprietary black-box score. The two FitMesh Labs calculators (HRV, Sleep Efficiency) are free, show the exact formula, and calculate everything in your browser.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa NON sono queste metriche", en: "What these metrics are NOT" },
    },
    {
      type: "paragraph",
      text: {
        it: "Nessuna di queste metriche, da sola o combinata, è una diagnosi. Non misurano forma fisica, rischio cardiovascolare, o stato di salute generale. La letteratura su cui si basano (vedi le fonti negli articoli dedicati) le descrive come utili soprattutto come trend personale nel tempo, in condizioni comparabili, non come valore isolato da giudicare in una singola notte.",
        en: "None of these metrics, alone or combined, is a diagnosis. They don't measure fitness, cardiovascular risk, or general health status. The literature they're based on (see the sources in the dedicated articles) describes them as most useful as a personal trend over time, under comparable conditions, not as an isolated value to judge from a single night.",
      },
    },
    {
      type: "cta",
      title: { it: "Calcola le tue metriche, gratis", en: "Calculate your metrics, for free" },
      body: {
        it: "HRV ed efficienza del sonno, con formula esplicita, nel browser. Nessun dato inviato a un server.",
        en: "HRV and sleep efficiency, with the explicit formula, in your browser. No data sent to a server.",
      },
      ctaLabel: { it: "Vai a FitMesh Labs →", en: "Go to FitMesh Labs →" },
      ctaHref: { it: "/it/labs", en: "/en/labs" },
    },
  ],
  faq: [
    {
      q: { it: "Il recupero è un unico numero?", en: "Is recovery a single number?" },
      a: {
        it: "No, non in questa guida: è la combinazione di più segnali distinti (HRV, frequenza a riposo, durata ed efficienza del sonno), ciascuno con il proprio significato. Un punteggio unico che li combina nasconde le discrepanze fra loro, spesso l'informazione più utile.",
        en: "No, not in this guide: it's the combination of several distinct signals (HRV, resting heart rate, sleep duration and efficiency), each with its own meaning. A single score that combines them hides the discrepancies between them, often the most useful information.",
      },
    },
    {
      q: { it: "Cos'è il debito di sonno?", en: "What is sleep debt?" },
      a: {
        it: "L'accumulo di sonno mancato rispetto al tuo fabbisogno, su più notti consecutive. È un concetto reale nella letteratura sul sonno, ma FitMesh non ha oggi uno strumento dedicato per calcolarlo.",
        en: "The accumulation of missed sleep relative to your need, across multiple consecutive nights. It's a real concept in the sleep literature, but FitMesh doesn't have a dedicated tool to calculate it today.",
      },
    },
    {
      q: { it: "HRV e frequenza cardiaca a riposo sono la stessa cosa?", en: "Are HRV and resting heart rate the same thing?" },
      a: {
        it: "No. La frequenza a riposo è quanto velocemente batte il cuore in media a riposo. L'HRV è quanto VARIA l'intervallo fra un battito e il successivo: due persone con la stessa frequenza media possono avere HRV molto diversa.",
        en: "No. Resting heart rate is how fast your heart beats on average at rest. HRV is how much the interval between one beat and the next VARIES: two people with the same average heart rate can have very different HRV.",
      },
    },
    {
      q: { it: "Dove calcolo queste metriche?", en: "Where do I calculate these metrics?" },
      a: {
        it: "HRV ed efficienza del sonno hanno un calcolatore gratuito dedicato su FitMesh Labs, entrambi con formula esplicita e calcolo nel browser. Frequenza a riposo e debito di sonno non hanno ancora un calcolatore dedicato.",
        en: "HRV and sleep efficiency each have a dedicated free calculator on FitMesh Labs, both with the explicit formula and in-browser calculation. Resting heart rate and sleep debt don't have a dedicated calculator yet.",
      },
    },
  ],
  related: [
    "hrv-cose-significato-valori",
    "efficienza-del-sonno-formula-calcolo",
    "tracciare-sonno-anello",
  ],
  ldType: "BlogPosting",
};
