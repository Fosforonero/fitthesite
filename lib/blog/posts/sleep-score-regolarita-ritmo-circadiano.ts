/**
 * SPRINT P1.4B - pubblicazione solo IT/EN (stesso meccanismo di
 * galaxy-watch-ultra2-watch9-health-connect: REDIRECT_INCOMPLETE_LOCALE_SLUGS
 * in lib/blog/indexability.ts, 307 verso EN per le altre 13 locale).
 *
 * SPRINT P1.4B-A (hardening 2026-07-30): fonti ri-verificate live dopo che un
 * audit ha trovato due problemi reali nella prima pubblicazione — 1) la fonte
 * Whoop puntava a una pagina sulle zone di frequenza cardiaca, non sul sonno;
 * 2) Fitbit non aveva alcuna fonte ufficiale collegata (solo un commento che
 * citava un blog terzo, Android Police, mai messo nell'array `sources`
 * pubblico). Corrette con le documentazioni ufficiali qui sotto.
 *
 * Fonti citate (verificate live via ricerca web durante lo sviluppo, non a
 * memoria):
 *  - Windred DP, Jones SE, Russell A, et al. "Sleep regularity is a stronger
 *    predictor of mortality risk than sleep duration: A prospective cohort
 *    study." Sleep. 2024;47(1):zsad253. PMID 37738616.
 *  - Oura, "A Guide to Your Sleep Contributors" (Oura Help, documentazione
 *    ufficiale: elenca esplicitamente i 7 contributori del Sleep Score).
 *  - Google Health / Fitbit, "What's the Sleep Score in the Google Health
 *    app" (support.google.com/fitbit - Fitbit ha spostato la propria
 *    documentazione ufficiale sotto il dominio Google Health dopo
 *    l'acquisizione; il dispositivo resta commercializzato come Fitbit).
 *  - Whoop, "What is Sleep Consistency?" (support.whoop.com, documentazione
 *    ufficiale: definisce sia Sleep Consistency sia i fattori di Sleep
 *    Performance).
 *
 * Nessun medical reviewer inventato: revisione tecnico-editoriale (fonti +
 * guardrail automatico), non medica - perché non esiste. Nessuna
 * interpretazione di rischio personale: la ricerca citata è uno studio di
 * coorte, riportata come tale, mai come consiglio individuale.
 */
import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "sleep-score-regolarita-ritmo-circadiano",
  category: "guides",
  publishedAt: "2026-07-30",
  updatedAt: "2026-07-30",
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Sleep Score: cosa misura davvero, e cosa spesso non misura",
      en: "Sleep Score: what it really measures, and what it often doesn't",
    },
    subtitle: {
      it: "Anelli e smartwatch diversi danno Sleep Score diversi per la stessa notte, perché i componenti e i pesi usati sono in gran parte proprietari e non pubblici. Un fattore che la ricerca recente indica come rilevante quanto (o più de) la durata - la regolarità degli orari di sonno - resta spesso poco visibile in questi punteggi.",
      en: "Different rings and smartwatches give different Sleep Scores for the same night, because the components and weights they use are largely proprietary and undisclosed. One factor that recent research flags as just as relevant as (or more than) duration - the regularity of sleep timing - often stays underexposed in these scores.",
    },
  },
  metaDescription: {
    it: "Cos'è lo Sleep Score, perché varia tra Oura, Fitbit e Whoop, e perché la regolarità del sonno conta quanto la durata. Solo fonti verificate, nessuna diagnosi.",
    en: "What a Sleep Score is, why it varies between Oura, Fitbit, and Whoop, and why sleep regularity matters as much as duration. Verified sources, no diagnosis.",
  },
  primaryKeyword: {
    it: "sleep score cos'è",
    en: "sleep score vs circadian score",
  },
  secondaryKeywords: {
    it: ["sleep score come si calcola", "punteggio sonno anello smartwatch", "regolarità del sonno salute", "sleep regularity index", "sleep score oura fitbit whoop differenze"],
    en: ["what is a sleep score", "how is sleep score calculated", "sleep regularity index", "sleep score oura fitbit whoop", "circadian score vs sleep score"],
  },
  readMinutes: 9,
  tldr: {
    it: [
      "Lo Sleep Score è un numero composito: combina più metriche (durata, efficienza, fasi, tempistica, a volte frequenza cardiaca) con pesi che ogni azienda tiene in gran parte proprietari.",
      "Oura dichiara pubblicamente 7 componenti (tempo totale di sonno, efficienza, sensazione di riposo, REM, sonno profondo, latenza, tempistica), ma non i pesi esatti; Fitbit (ora documentato sotto Google Health) dichiara 6 componenti (durata, tempo per raggiungere il sonno stabile, sonno stabile, agitazione, risvegli completi, interruzioni); Whoop non dà uno \"sleep score\" tradizionale ma una Sleep Performance (percentuale del bisogno di sonno personalizzato ottenuto), un punteggio distinto dal Recovery.",
      "Uno studio del 2024 su oltre 60.000 persone (UK Biobank) ha trovato che la regolarità degli orari di sonno predice il rischio di mortalità meglio della sola durata del sonno - un fattore spesso meno visibile nei punteggi sonno consumer rispetto a durata ed efficienza.",
      "Questo articolo non emette un punteggio: collega alle fonti ufficiali di ogni piattaforma e al calcolatore FitMesh Labs per l'unica metrica davvero trasparente e verificabile, l'efficienza del sonno.",
    ],
    en: [
      "A Sleep Score is a composite number: it combines multiple metrics (duration, efficiency, stages, timing, sometimes heart rate) with weights each company keeps largely proprietary.",
      "Oura publicly discloses 7 components (total sleep time, efficiency, restfulness, REM, deep sleep, latency, timing), but not the exact weights; Fitbit (now documented under Google Health) discloses 6 components (duration, time to sound sleep, sound sleep, restlessness, full awakenings, interruptions); Whoop doesn't give a traditional \"sleep score\" but a Sleep Performance figure (the percentage of your personalized sleep need obtained), a score distinct from Recovery.",
      "A 2024 study of over 60,000 people (UK Biobank) found that the regularity of sleep timing predicts mortality risk better than sleep duration alone - a factor often less visible in consumer sleep scores than duration and efficiency.",
      "This article doesn't issue a score: it links to each platform's official documentation and to the FitMesh Labs calculator for the one genuinely transparent, verifiable metric, sleep efficiency.",
    ],
  },
  body: [
    {
      type: "heading",
      level: 2,
      text: { it: "Cos'è uno Sleep Score", en: "What a Sleep Score is" },
    },
    {
      type: "paragraph",
      text: {
        it: "Uno Sleep Score è un numero unico (di solito da 0 a 100) che un anello o smartwatch calcola combinando più metriche del sonno rilevate durante la notte: quanto hai dormito, quanto efficientemente, come si sono distribuite le fasi del sonno, a che ora sei andato a letto e ti sei svegliato, e in alcuni casi la frequenza cardiaca notturna. L'obiettivo dichiarato è dare un riassunto rapido, invece di dover leggere 6-7 grafici separati ogni mattina.",
        en: "A Sleep Score is a single number (usually 0 to 100) that a ring or smartwatch calculates by combining multiple sleep metrics detected overnight: how long you slept, how efficiently, how sleep stages were distributed, what time you went to bed and woke up, and in some cases overnight heart rate. The stated goal is to give a quick summary instead of having to read 6-7 separate charts every morning.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il problema per chi vuole capire il proprio numero: ogni azienda combina questi fattori in modo diverso, con pesi che restano in gran parte non pubblici. Questo significa che la stessa identica notte di sonno, misurata da due dispositivi diversi, può produrre due Sleep Score diversi - non perché uno dei due sbagli la misurazione, ma perché la FORMULA di composizione è diversa.",
        en: "The problem for anyone trying to understand their own number: every company combines these factors differently, with weights that remain largely undisclosed. This means the exact same night of sleep, measured by two different devices, can produce two different Sleep Scores - not because one of them is measuring wrong, but because the composition FORMULA is different.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Come lo calcolano (pubblicamente) tre piattaforme note", en: "How three well-known platforms calculate it (publicly)" },
    },
    {
      type: "table",
      caption: { it: "Componenti dichiarati pubblicamente (non i pesi esatti, quasi sempre proprietari)", en: "Publicly disclosed components (not the exact weights, almost always proprietary)" },
      headers: {
        it: ["Piattaforma", "Componenti dichiarati", "Punteggio unico?"],
        en: ["Platform", "Disclosed components", "Single score?"],
      },
      rows: [
        {
          it: ["Oura", "Tempo totale di sonno, efficienza, sensazione di riposo, REM, sonno profondo, latenza, tempistica (7 fattori)", "Sì, Sleep Score 0-100"],
          en: ["Oura", "Total sleep time, efficiency, restfulness, REM, deep sleep, latency, timing (7 factors)", "Yes, Sleep Score 0-100"],
        },
        {
          it: ["Fitbit (Google Health)", "Sei fattori dichiarati: durata del sonno, tempo per raggiungere il sonno stabile, sonno stabile, agitazione, risvegli completi, interruzioni", "Sì, Sleep Score 0-100"],
          en: ["Fitbit (Google Health)", "Six disclosed factors: sleep duration, time to sound sleep, sound sleep, restlessness, full awakenings, interruptions", "Yes, Sleep Score 0-100"],
        },
        {
          it: ["Whoop", "Sleep Performance = % del bisogno di sonno personalizzato (Sleep Need) ottenuto; Sleep Consistency (regolarità oraria) ed efficienza tracciate separatamente", "No: nessuno sleep score tradizionale 0-100; Sleep Performance è un punteggio distinto dal Recovery, non annidato al suo interno"],
          en: ["Whoop", "Sleep Performance = % of personalized Sleep Need actually obtained; Sleep Consistency (timing regularity) and efficiency tracked separately", "No: no traditional 0-100 sleep score; Sleep Performance is a score distinct from Recovery, not nested inside it"],
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Nota", en: "Note" },
      body: {
        it: "Questa tabella riporta solo ciò che ogni azienda dichiara pubblicamente nella propria documentazione ufficiale (vedi Fonti in fondo). Nessuna delle tre pubblica i pesi esatti assegnati a ciascun componente: non è quindi possibile ricostruire con precisione la formula completa da fonti esterne, e questo articolo non ci prova.",
        en: "This table reports only what each company publicly discloses in its own official documentation (see Sources below). None of the three publishes the exact weights assigned to each component: it is therefore not possible to precisely reconstruct the full formula from external sources, and this article does not attempt to.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Il fattore che spesso resta in ombra: la regolarità", en: "The factor that often stays in the shadows: regularity" },
    },
    {
      type: "paragraph",
      text: {
        it: "Un fattore in particolare merita attenzione: la REGOLARITÀ degli orari di sonno, cioè quanto i tuoi orari di andare a letto e svegliarti restano costanti notte dopo notte - un concetto distinto sia dalla durata sia dall'efficienza, e più vicino all'idea di \"punteggio circadiano\".",
        en: "One factor in particular deserves attention: the REGULARITY of sleep timing - how consistent your bedtime and wake time stay night after night - a concept distinct from both duration and efficiency, and closer to the idea of a \"circadian score\".",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Uno studio prospettico pubblicato nel 2024 sulla rivista Sleep, condotto su oltre 60.000 partecipanti della UK Biobank con dati di accelerometro reali (oltre 10 milioni di ore), ha misurato un Sleep Regularity Index (SRI, indice di regolarità del sonno) e lo ha confrontato con la durata del sonno come predittore di mortalità. Il risultato: la regolarità del sonno si è dimostrata un predittore più forte della mortalità per tutte le cause rispetto alla sola durata - con una riduzione del rischio dal 20% al 48% per chi si trovava nei quattro quintili più regolari rispetto al meno regolare.",
        en: "A prospective study published in 2024 in the journal Sleep, conducted on over 60,000 UK Biobank participants using real accelerometer data (over 10 million hours), measured a Sleep Regularity Index (SRI) and compared it to sleep duration as a predictor of mortality. The result: sleep regularity was a stronger predictor of all-cause mortality than duration alone - with a 20% to 48% lower risk for those in the four most regular quintiles compared to the least regular one.",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Cosa NON dice questo studio", en: "What this study does NOT say" },
      body: {
        it: "È uno studio di coorte osservazionale: mostra un'associazione statistica su una popolazione ampia, non una relazione di causa-effetto dimostrata per il singolo individuo, e non permette di calcolare un rischio personale da un singolo numero. Non è un consiglio medico e non sostituisce il parere di un professionista sanitario.",
        en: "This is an observational cohort study: it shows a statistical association across a large population, not a proven cause-and-effect relationship for any single individual, and it does not let you calculate a personal risk from a single number. It is not medical advice and does not replace guidance from a healthcare professional.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il punto per chi guarda il proprio Sleep Score ogni mattina: la maggior parte dei punteggi consumer include QUALCHE nozione di tempistica (Oura la elenca esplicitamente, Whoop la chiama \"coerenza\"), ma la regolarità notte-dopo-notte spesso pesa meno nella percezione dell'utente rispetto a durata ed efficienza, che sono più immediate da capire e da migliorare in una singola notte. La ricerca sopra suggerisce che vale la pena guardare la propria costanza di orari con la stessa attenzione riservata alle ore dormite.",
        en: "The takeaway for anyone checking their Sleep Score every morning: most consumer scores include SOME notion of timing (Oura lists it explicitly, Whoop calls it \"consistency\"), but night-to-night regularity often carries less weight in how users perceive it compared to duration and efficiency, which are more immediately understandable and fixable in a single night. The research above suggests it's worth watching your own timing consistency with the same attention usually reserved for hours slept.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa puoi effettivamente calcolare tu stesso, in modo trasparente", en: "What you can actually calculate yourself, transparently" },
    },
    {
      type: "paragraph",
      text: {
        it: "Nessuno Sleep Score proprietario può essere replicato con precisione da fonti esterne, perché i pesi non sono pubblici. Una metrica invece è completamente trasparente e replicabile con carta e penna: l'efficienza del sonno (tempo dormito diviso tempo a letto, per 100). FitMesh Labs offre un calcolatore gratuito che applica questa singola formula, dichiarata esplicitamente, senza combinarla con altri fattori non dichiarati.",
        en: "No proprietary Sleep Score can be precisely replicated from external sources, because the weights are not public. One metric, however, is fully transparent and replicable with pen and paper: sleep efficiency (time asleep divided by time in bed, times 100). FitMesh Labs offers a free calculator that applies this single, explicitly stated formula, without blending it with other undisclosed factors.",
      },
    },
    {
      type: "cta",
      title: { it: "Calcola la tua efficienza del sonno", en: "Calculate your sleep efficiency" },
      body: {
        it: "Formula esplicita, calcolo nel browser, nessun dato inviato: scopri quanto del tempo a letto è stato davvero sonno.",
        en: "Explicit formula, calculated in your browser, nothing sent anywhere: see how much of your time in bed was actually sleep.",
      },
      ctaLabel: { it: "Apri il calcolatore →", en: "Open the calculator →" },
      ctaHref: { it: "/it/labs/calcolatore-efficienza-sonno", en: "/en/labs/sleep-efficiency-calculator" },
      ctaId: "blog-sleep-score-sleep-efficiency-cta",
      ctaPlacement: "blog_body_mid",
    },
    {
      type: "paragraph",
      text: {
        it: "Se ti interessa anche il tema della frequenza cardiaca durante l'attività fisica - un altro caso in cui numeri diversi tra dispositivi nascono da METODI diversi, non da errori di misurazione - abbiamo pubblicato un approfondimento dedicato e un secondo calcolatore.",
        en: "If you're also interested in heart rate during exercise - another case where different numbers between devices come from different METHODS, not measurement errors - we've published a dedicated deep dive and a second calculator.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Perché la Zona 2 cambia da smartwatch e app: stesso principio della tabella sopra, applicato alle zone di frequenza cardiaca.",
        ],
        en: [
          "Why Zone 2 differs between watches and apps: the same principle as the table above, applied to heart rate zones.",
        ],
      },
    },
  ],
  faq: [
    {
      q: { it: "Qual è un buon Sleep Score?", en: "What is a good Sleep Score?" },
      a: {
        it: "Questo articolo non emette una valutazione \"buono/cattivo\": ogni piattaforma definisce le proprie fasce interpretative nella propria documentazione ufficiale, con pesi che restano in gran parte non pubblici. Confrontare il numero assoluto tra dispositivi diversi ha poco senso, perché le formule sono diverse.",
        en: "This article does not issue a \"good/bad\" rating: each platform defines its own interpretive bands in its own official documentation, with weights that remain largely undisclosed. Comparing the absolute number across different devices makes little sense, because the formulas differ.",
      },
    },
    {
      q: { it: "Perché il mio Sleep Score cambia tra un dispositivo e l'altro per la stessa notte?", en: "Why does my Sleep Score differ between devices for the same night?" },
      a: {
        it: "Perché ogni azienda combina metriche diverse (durata, efficienza, fasi, tempistica, a volte frequenza cardiaca) con pesi proprietari diversi. Non è un errore di misurazione: è una scelta di formula diversa, come per le zone di frequenza cardiaca.",
        en: "Because each company combines different metrics (duration, efficiency, stages, timing, sometimes heart rate) with different proprietary weights. It's not a measurement error: it's a different formula choice, similar to heart rate zones.",
      },
    },
    {
      q: { it: "Cos'è il Sleep Regularity Index (SRI)?", en: "What is the Sleep Regularity Index (SRI)?" },
      a: {
        it: "È una misura scientifica di quanto i tuoi orari di sonno-veglia restano costanti notte dopo notte, usata in ricerca (non è un punteggio consumer ufficiale di nessuna delle tre piattaforme citate sopra). Uno studio del 2024 sulla rivista Sleep lo ha associato al rischio di mortalità in modo più forte della sola durata del sonno, su un campione di oltre 60.000 persone.",
        en: "It's a scientific measure of how consistent your sleep-wake timing stays from night to night, used in research (it is not an official consumer score from any of the three platforms cited above). A 2024 study in the journal Sleep associated it with mortality risk more strongly than sleep duration alone, in a sample of over 60,000 people.",
      },
    },
    {
      q: { it: "FitMesh calcola un suo Sleep Score?", en: "Does FitMesh calculate its own Sleep Score?" },
      a: {
        it: "No: questo articolo descrive come funzionano gli Sleep Score di terze parti e collega al calcolatore FitMesh Labs per l'unica metrica pienamente trasparente, l'efficienza del sonno. FitMesh non emette un punteggio composito proprietario.",
        en: "No: this article describes how third-party Sleep Scores work and links to the FitMesh Labs calculator for the one fully transparent metric, sleep efficiency. FitMesh does not issue a proprietary composite score.",
      },
    },
  ],
  related: ["efficienza-del-sonno-formula-calcolo", "perche-zona-2-cambia-smartwatch-app", "hrv-cose-significato-valori"],
  sources: [
    "https://pubmed.ncbi.nlm.nih.gov/37738616/",
    "https://support.ouraring.com/hc/en-us/articles/360057792293-A-Guide-to-Your-Sleep-Contributors",
    "https://support.google.com/fitbit/answer/14236513",
    "https://support.whoop.com/hc/en-us/articles/360019623493-What-is-Sleep-Consistency-",
  ],
  brandsMentioned: ["Oura", "Fitbit", "Whoop"],
  ldType: "BlogPosting",
};
