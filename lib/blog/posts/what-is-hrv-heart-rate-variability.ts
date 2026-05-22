import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "what-is-hrv-heart-rate-variability",
  category: "guides",
  publishedAt: "2026-05-22",
  updatedAt: "2026-05-22",
  readMinutes: 10,
  primaryKeyword: {
    it: "cos'è la HRV",
    en: "what is HRV",
  },
  secondaryKeywords: {
    it: [
      "HRV valori normali",
      "variabilità frequenza cardiaca",
      "HRV significato sport",
      "HRV bassa cosa significa",
      "HRV smartwatch",
    ],
    en: [
      "HRV normal values",
      "heart rate variability explained",
      "HRV meaning in fitness",
      "low HRV what does it mean",
      "HRV smartwatch accuracy",
    ],
  },
  metaDescription: {
    it: "Cos'è la HRV (variabilità della frequenza cardiaca), valori normali per età, cosa significa alta o bassa, e come leggerla sul tuo wearable nel 2026.",
    en: "What is HRV (heart rate variability), what are normal values by age, what high or low HRV means, and how to read it correctly on your Galaxy Watch, Garmin, or Oura Ring.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Cos'è la HRV: significato, valori normali e come leggerla",
      en: "What Is HRV? Heart Rate Variability Explained Simply",
    },
    subtitle: {
      it: "La variabilità della frequenza cardiaca è una delle metriche più fraintese degli smartwatch. Non misura quanto batte il cuore, ma quanto irregolarmente — e quella irregolarità è in realtà un segnale di salute. Ecco cosa significa davvero, come si interpretano i valori, e perché il confronto con gli altri è quasi sempre inutile.",
      en: "HRV is one of the most misunderstood numbers on your smartwatch. It doesn't measure how fast your heart beats — it measures how irregular the timing is between beats. And that irregularity is actually a good thing. Here's what HRV really means, how to interpret your own numbers, and why comparing them to anyone else is almost pointless.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Hai un Galaxy Watch, un Garmin, un Oura Ring — e da qualche settimana noti questo numero chiamato HRV che compare nell'app. A volte è 45, a volte è 28, e non sai se è buono o cattivo, alto o basso, se preoccuparti o ignorarlo. Il problema non è tuo: l'HRV è una metrica genuinamente controintuitiva, e la maggior parte delle app fa un lavoro pessimo nello spiegarla. Partiamo dalle basi.",
        en: "You have a Galaxy Watch, a Garmin, or an Oura Ring. A few weeks in, you notice a number called HRV showing up in the app. Some mornings it's 62. Other mornings it's 31. You have no idea if those numbers are good or bad, high or low, or whether you should care at all. That confusion is completely normal — HRV is a genuinely counterintuitive metric, and most apps do a poor job explaining it. Let's fix that.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cos'è la HRV: la definizione semplice",
        en: "What Is HRV? The Simple Definition",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il cuore non batte come un metronomo perfetto. Anche con una frequenza cardiaca di 60 BPM, i singoli battiti non avvengono esattamente ogni secondo: uno arriva dopo 980 ms, il successivo dopo 1.020 ms, quello dopo ancora dopo 990 ms. Questa variazione negli intervalli tra un battito e l'altro si chiama variabilità della frequenza cardiaca (HRV, Heart Rate Variability).",
        en: "Your heart doesn't beat like a metronome. Even if your heart rate is exactly 60 BPM, individual beats don't land at perfectly even 1-second intervals. One beat arrives 980 ms after the last. The next comes 1,020 ms later. The one after that, 990 ms. That variation in the gap between beats is called heart rate variability, or HRV.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Più questa variazione è ampia — più i battiti sono 'irregolari' nell'intervallo — più alta è la tua HRV. Questo sembra controintuitivo perché di solito l'irregolarità cardiaca è associata a problemi. Ma qui si tratta di variazioni fisiologiche nell'ordine dei millisecondi, non di aritmie. Una HRV alta indica in genere che il sistema nervoso autonomo funziona bene e il corpo è in buono stato di recupero.",
        en: "The wider that variation — the more 'irregular' the timing — the higher your HRV. This seems backwards, because cardiac irregularity is usually associated with problems. But we're talking about millisecond-level physiological variation, not arrhythmias. A high HRV is generally a signal that your autonomic nervous system is functioning well and your body is in a good recovery state.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché la HRV riflette il sistema nervoso autonomo",
        en: "Why HRV Reflects Your Autonomic Nervous System",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il sistema nervoso autonomo ha due bracci: il simpatico (attivazione, risposta 'fight or flight') e il parasimpatico (recupero, risposta 'rest and digest'). Il cuore è influenzato da entrambi costantemente, e la variazione nei tempi tra i battiti è il risultato di questo equilibrio che si aggiusta momento per momento.",
        en: "Your autonomic nervous system has two branches: the sympathetic (activation, the 'fight or flight' response) and the parasympathetic (recovery, the 'rest and digest' response). Your heart is constantly being tugged in both directions, and the beat-to-beat variation in timing reflects how that balance is shifting moment by moment.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Quando sei sotto stress cronico, non hai dormito bene, hai fatto un allenamento intenso ieri sera, o stai iniziando a prendere un'influenza, il sistema simpatico prende il sopravvento: il cuore batte più regolarmente e la HRV cala. Quando sei riposato e ben recuperato, il sistema parasimpatico domina e la HRV sale.",
        en: "When you're under chronic stress, slept badly, had a hard workout the night before, or are starting to come down with something, the sympathetic branch takes over. Your heart beats more regularly and your HRV drops. When you're rested and well-recovered, the parasympathetic branch dominates and HRV rises.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "La regola pratica", en: "The practical takeaway" },
      body: {
        it: "HRV alta = corpo in recupero, sistema parasimpatico attivo, buona riserva per lo stress fisico e mentale. HRV bassa = corpo in allerta o affaticato, sistema simpatico attivo, meno riserva disponibile. Né alta né bassa è intrinsecamente migliore: conta il trend personale nel tempo.",
        en: "High HRV = body in recovery mode, parasympathetic system active, good reserve to handle physical and mental stress. Low HRV = body on alert or fatigued, sympathetic system active, less reserve available. Neither is intrinsically better — what matters is your own trend over time, not the absolute number.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Valori normali di HRV per età e livello di fitness",
        en: "HRV Normal Values by Age and Fitness Level",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La domanda più frequente è: 'Il mio valore è normale?' La risposta onesta è che i range di riferimento per la HRV sono estremamente ampi e dipendono da molte variabili. Un adulto sedentario di 40 anni potrebbe avere una HRV media di 35 ms; un atleta della stessa età potrebbe avere 80-90 ms. Entrambi sono normali per chi sono.",
        en: "The most common question is 'Is my HRV normal?' The honest answer is that reference ranges for HRV are extremely wide and depend on many variables. A sedentary 40-year-old might average 35 ms. An athlete the same age might average 80-90 ms. Both are completely normal for who they are.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Range HRV orientativi per fascia d'età (RMSSD, misurazione notturna). Fonte: letteratura fisiologica generale. Non usare per diagnosi medica.",
        en: "Approximate HRV ranges by age (RMSSD, overnight measurement). Source: general physiological literature. Not for medical diagnosis.",
      },
      headers: {
        it: ["Fascia d'età", "Range tipico (ms)", "Note"],
        en: ["Age group", "Typical range (ms)", "Notes"],
      },
      rows: [
        {
          it: ["20-29 anni", "55-105 ms", "Alta variabilità fisiologica tra individui"],
          en: ["20–29", "55–105 ms", "Wide physiological spread between individuals"],
        },
        {
          it: ["30-39 anni", "45-90 ms", "Calo naturale rispetto ai 20 anni"],
          en: ["30–39", "45–90 ms", "Natural decline vs. 20s"],
        },
        {
          it: ["40-49 anni", "35-75 ms", "Fitness ha impatto maggiore sulla differenza"],
          en: ["40–49", "35–75 ms", "Fitness level has a larger impact on the gap"],
        },
        {
          it: ["50-59 anni", "25-60 ms", "Variabilità tra sedentari e atleti si allarga"],
          en: ["50–59", "25–60 ms", "Gap between sedentary and athletic widens"],
        },
        {
          it: ["60+ anni", "20-50 ms", "Livelli assoluti più bassi, trend personale ancora valido"],
          en: ["60+", "20–50 ms", "Lower absolute levels, personal trend still meaningful"],
        },
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Il confronto con gli altri è quasi inutile", en: "Don't compare your HRV to anyone else's" },
      body: {
        it: "Un HRV di 42 ms è ottimo per una persona e mediocre per un'altra. Conta il tuo trend nel tempo: se la tua baseline è 50 ms e una mattina scende a 32, quel calo è significativo per te. Le app come Garmin e Oura mostrano un 'intervallo normale personale' proprio per questo.",
        en: "An HRV of 42 ms is excellent for one person and below average for another. What matters is **your own trend** over time. If your baseline is 50 ms and one morning you wake up at 32, that drop is significant — for you. If your baseline is always around 30 ms and you feel fine, you're probably in balance. Apps like Garmin and Oura show a 'personal normal range' banner for exactly this reason.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come i wearable misurano la HRV",
        en: "How Your Wearable Measures HRV",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "I wearable consumer (Galaxy Watch, Garmin, Oura, Polar) usano principalmente due metodi:",
        en: "Consumer wearables like Galaxy Watch, Garmin, Oura, and Polar use two main methods:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**PPG (fotopletismografia)**: un LED verde (o infrarosso) illumina il polso e un sensore misura le variazioni di assorbimento della luce causate dal flusso sanguigno. È il metodo usato dalla grande maggioranza degli smartwatch. Meno preciso di un ECG, ma sufficiente per il tracking delle tendenze nel tempo.",
          "**ECG**: disponibile su alcuni watch premium (Galaxy Watch Ultra, Apple Watch con funzione ECG). Misura direttamente l'attività elettrica del cuore. Più accurato per sessioni brevi, ma la differenza pratica per il tracking quotidiano è spesso marginale.",
        ],
        en: [
          "**PPG (photoplethysmography)**: a green or infrared LED shines on your wrist, and a sensor measures how light absorption changes as blood pulses through. This is what the vast majority of smartwatches use. It's less precise than an ECG, but accurate enough to track trends over time — which is all you really need.",
          "**ECG**: available on some premium devices (Galaxy Watch Ultra, Apple Watch). This measures the heart's electrical activity directly. More accurate for short sessions, but for day-to-day trend tracking the practical difference is often marginal.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La misura più affidabile è durante il sonno, quando sei immobile e i movimenti non distorcono il segnale. Garmin chiama questa metrica 'HRV Status' (media RMSSD notturna). Oura fa lo stesso. Galaxy Watch registra la HRV durante il sonno e la espone in Samsung Health.",
        en: "The most reliable measurement your wearable can take is during sleep — you're still, there's no movement to distort the signal. Garmin calls this metric 'HRV Status' (based on nightly RMSSD). Oura does the same. Galaxy Watch records overnight HRV and surfaces the values in Samsung Health and, if you've authorized it, in Health Connect and connected apps.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come usare la HRV nell'allenamento quotidiano",
        en: "How to Actually Use HRV in Your Training",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'uso più diffuso della HRV tra gli atleti amatori è come indicatore di recupero: se la HRV è significativamente sotto la baseline personale, potrebbe non essere il giorno migliore per un allenamento intenso. Questa è una semplificazione utile, ma con condizioni importanti.",
        en: "The most common use of HRV among recreational athletes is as a recovery indicator: if HRV is significantly below your personal baseline, it might not be the best day for a hard session. That's a useful heuristic — but with some important caveats.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Guardalo come trend settimanale**, non come dato giornaliero assoluto. Una singola notte di HRV bassa può avere cento cause (cena pesante, alcol, caldo, posizione di sonno atipica). Una settimana intera sotto la tua baseline è più informativa.",
          "**Non è un indicatore di malattia**: HRV bassa non significa che stai per ammalarti o che hai un problema cardiaco. È un segnale del sistema nervoso autonomo, non una diagnosi.",
          "**Il confronto tra app diverse non è diretto**: Garmin, Samsung, Oura e Polar usano algoritmi e intervalli di misura diversi. Un valore di 55 su Garmin non è direttamente confrontabile con un 55 su Oura, anche se entrambi misurano 'HRV'.",
          "**Non sostituisce il buon senso**: se hai dormito 5 ore ma la tua HRV è alta quella mattina, probabilmente il debito di sonno pesa più del numero HRV.",
        ],
        en: [
          "**Look at it as a weekly trend**, not an absolute daily number. A single night of low HRV can have a hundred causes — a heavy dinner, alcohol, sleeping in an unusual position, a hot night. A full week below your baseline is more informative than any single reading.",
          "**It's not a disease indicator**: low HRV does not mean you're about to get sick or have a heart problem. It's a signal of autonomic nervous system state, not a diagnosis. If you have cardiac concerns, talk to a doctor — not your watch app.",
          "**Cross-app comparison doesn't work**: Garmin, Samsung, Oura, and Polar use different algorithms and different measurement windows. A 55 on Garmin is not the same as a 55 on Oura, even though both call it HRV. Pick one device as your reference and stick with it.",
          "**Common sense still wins**: if you slept five hours and your HRV looks good that morning, the sleep debt is probably still real. The number is one input, not a verdict.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "HRV e salute generale: oltre lo sport",
        en: "HRV Beyond Sports: What It Tells You About General Health",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Al di là dello sport, la HRV è usata in contesti clinici come marcatore di stress cronico, benessere cardiovascolare e risposta al trattamento in alcune patologie. Questo non significa che il numero sul tuo smartwatch abbia lo stesso peso clinico di una misurazione medica — la precisione è diversa, i protocolli di misura sono diversi.",
        en: "Beyond sports performance, HRV is used in clinical settings as a marker of chronic stress, cardiovascular health, and treatment response for some conditions. That doesn't mean the number on your wearable carries the same clinical weight as a medical measurement — the precision, protocols, and context are very different.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il valore del wearable è nel tracking longitudinale personale: vedere i propri pattern nel tempo, notare variazioni correlate a eventi della vita (stress lavorativo, cambi di routine, viaggi), e usare queste informazioni per prendere decisioni più consapevoli. Non per autodiagnosticarsi.",
        en: "The real value of consumer wearable HRV tracking is longitudinal: seeing your own patterns over weeks and months, noticing correlations with life events like a stressful work deadline, a change in sleep schedule, or a long-haul flight, and using that awareness to make smarter lifestyle decisions. Not for self-diagnosis.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi monitorare la tua HRV su una dashboard unificata?",
        en: "Want to track your HRV across all your devices in one place?",
      },
      body: {
        it: "Se hai un Garmin, un Oura Ring, o un Galaxy Watch e vuoi vedere la tua HRV storica su un'unica dashboard web — con trend nel tempo, confronto tra dispositivi e metriche correlate — FitMesh Sync è una delle opzioni che aggregano questi dati via API ufficiali.",
        en: "If you have a Garmin, an Oura Ring, or a Galaxy Watch and want to see your HRV history on a single web dashboard — with trends over time, cross-device comparison, and related metrics like resting heart rate and sleep score — FitMesh Sync is one option for users who want that kind of unified view via official APIs.",
      },
      ctaLabel: {
        it: "Vedi le integrazioni disponibili →",
        en: "See available integrations →",
      },
      ctaHref: {
        it: "/it/integrations",
        en: "/en/integrations",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Cos'è la HRV in parole semplici?",
        en: "What is HRV in simple terms?",
      },
      a: {
        it: "La HRV misura quanto variano i tempi tra un battito cardiaco e il successivo. Non è la frequenza cardiaca media — è la variazione di quella frequenza momento per momento. Alta variabilità indica in genere che il corpo è ben riposato e il sistema nervoso è in equilibrio. Bassa variabilità segnala stress, affaticamento o convalescenza.",
        en: "HRV measures how much the timing between your heartbeats varies. It's not your heart rate — it's the variation in that rate from beat to beat. Higher variability generally means your body is well-rested and your nervous system is balanced. Lower variability signals stress, fatigue, or that your body is working to recover from something.",
      },
    },
    {
      q: {
        it: "Quant'è alta una buona HRV?",
        en: "What is a good HRV number?",
      },
      a: {
        it: "Non esiste un target universale. La HRV varia enormemente per età, sesso, livello di fitness e genetica. Un range normale per un adulto di 35 anni potrebbe essere tra 40 e 80 ms (RMSSD), ma un atleta potrebbe stare ben oltre i 100 ms. La metrica utile non è il valore assoluto, ma il tuo trend personale su 2-4 settimane.",
        en: "There's no universal target. HRV varies enormously by age, sex, fitness level, and genetics. A typical range for a 35-year-old adult might be 40–80 ms (RMSSD), but an endurance athlete could be well above 100 ms. The useful metric isn't the absolute number — it's your personal trend over 2–4 weeks. Figure out what's normal for you, then watch for significant deviations.",
      },
    },
    {
      q: {
        it: "Cosa significa HRV bassa?",
        en: "What does low HRV mean?",
      },
      a: {
        it: "Una HRV sotto la tua baseline personale può segnalare varie cose: stress fisico (allenamento intenso, malattia in arrivo, convalescenza), stress emotivo, scarsa qualità del sonno, consumo di alcol la sera prima, o una notte con più movimenti del solito. Un singolo valore basso non è preoccupante. Una settimana intera di valori significativamente sotto la tua normale merita attenzione.",
        en: "HRV below your personal baseline can mean several things: physical stress from a hard workout, an illness brewing, mental or emotional stress, poor sleep quality, alcohol the night before, or simply a night with more tossing and turning than usual (which affects the PPG reading). A single low reading isn't concerning. A full week of readings significantly below your normal range is worth paying attention to.",
      },
    },
    {
      q: {
        it: "Galaxy Watch, Garmin e Oura misurano la stessa HRV?",
        en: "Are HRV numbers comparable between Galaxy Watch, Garmin, and Oura?",
      },
      a: {
        it: "Misurano la stessa metrica biologica ma con hardware, algoritmi e protocolli diversi. Il risultato numerico può differire significativamente tra device sulla stessa persona nella stessa notte. Non confrontare il numero assoluto tra device diversi — scegli un device come riferimento principale.",
        en: "They all measure the same underlying biological signal — the variation in R-R intervals — but using different hardware, algorithms, and measurement windows. The numerical result can differ significantly between devices for the same person on the same night. Don't try to compare absolute numbers across devices. Pick one as your primary reference and track your trend there consistently.",
      },
    },
    {
      q: {
        it: "Posso migliorare la mia HRV?",
        en: "Can you improve your HRV?",
      },
      a: {
        it: "Sì, ma lentamente e indirettamente. Le variabili che influenzano positivamente la HRV nel lungo periodo: sonno regolare e sufficiente, attività fisica aerobica moderata e costante, gestione dello stress, riduzione dell'alcol, e una routine di vita stabile. I cambiamenti nella HRV baseline si vedono nel giro di settimane o mesi, non giorni.",
        en: "Yes — but slowly and indirectly. The factors with the strongest evidence for improving HRV over time are: consistent, adequate sleep (7–8 hours for most adults), regular moderate aerobic exercise, stress management practices like deep breathing or mindfulness, reducing alcohol, and generally keeping a stable daily routine. There are no quick hacks. Meaningful changes in your HRV baseline typically show up over weeks or months, not days.",
      },
    },
  ],
  related: [
    "hrv-cose-significato-valori",
    "how-does-health-connect-work",
    "galaxy-watch-steps-not-syncing",
  ],
  brandsMentioned: ["Garmin", "Samsung", "Oura", "Polar", "Apple", "Google"],
  ldType: "BlogPosting",
};
