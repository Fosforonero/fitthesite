/**
 * SPRINT P1.4B - pubblicazione solo IT/EN (stesso meccanismo di
 * galaxy-watch-ultra2-watch9-health-connect: REDIRECT_INCOMPLETE_LOCALE_SLUGS
 * in lib/blog/indexability.ts, 307 verso EN per le altre 13 locale).
 *
 * SPRINT P1.4B-A (hardening 2026-07-30): fonti ri-verificate live dopo che un
 * audit ha trovato due problemi reali nella prima pubblicazione - 1) la fonte
 * Whoop puntava a una pagina sulle zone di frequenza cardiaca, non sul sonno;
 * 2) Fitbit non aveva alcuna fonte ufficiale collegata (solo un commento che
 * citava un blog terzo, Android Police, mai messo nell'array `sources`
 * pubblico). Corrette con le documentazioni ufficiali qui sotto.
 *
 * SPRINT P1.4B-B (micro-hotfix 2026-07-30): la fonte Whoop introdotta in
 * P1.4B-A (support.whoop.com/hc/en-us/articles/360019623493-What-is-Sleep-Consistency-)
 * restituisce 401 in QA pubblica (il vecchio dominio Zendesk/hc/ sembra
 * dietro un blocco bot/WAF dopo la migrazione di Whoop al nuovo supporto
 * Salesforce, support.whoop.com/s/). Sostituita con DUE fonti Whoop
 * distinte, ciascuna usata SOLO per il claim che dichiara esplicitamente
 * (verificate live, 200 su GET pubblico):
 *  - whoop.com/thelocker "Sleep Consistency: Why It Matters..." - SOLO per
 *    la regolarità degli orari/Sleep Consistency (definizione: quanto sono
 *    simili i tuoi orari di sonno-veglia su una finestra di 4 giorni,
 *    0-100%) e per la ricerca su regolarità e rischio di mortalità (che
 *    corrobora, indipendentemente, la fonte SRI 2024 già citata sotto).
 *  - support.whoop.com/s/article/WHOOP-Sleep - SOLO per la definizione di
 *    Sleep Performance (ore di sonno ottenute rispetto al Sleep Need
 *    personalizzato, 0-100%). NON usata per claim sulla relazione fra
 *    Sleep Performance e Recovery: la vecchia frase "punteggio distinto dal
 *    Recovery, non annidato al suo interno" è stata rimossa perché non
 *    verificabile in modo pulito da questa fonte (pagina Salesforce
 *    renderizzata via JS, non leggibile con un fetch semplice) - meglio
 *    dire meno di quanto la fonte davvero copra.
 *
 * SPRINT P1.5B Fase B (2026-08-05): aggiunta traduzione editoriale completa
 * DE. Slug DE scelto (non traduzione letterale automatica):
 * "sleep-score-was-er-wirklich-misst" (rispecchia l'H1 IT/EN, "Sleep Score"
 * resta invariato in tedesco come nel gergo fitness-tech reale, es. Oura/
 * Whoop community). CTA verso il calcolatore FitMesh Labs dichiarato
 * esplicitamente verso la versione EN (LABS_LOCALES = it/en, nessuna
 * versione DE esiste) — non è una "traduzione del calcolatore" (fuori
 * scope), ed è di fatto ridondante: verificato live che /de/labs/* con
 * qualsiasi slug it/en redirige comunque 307 a singolo hop verso
 * /en/labs/..., quindi anche il fallback implicito su `.it` sarebbe
 * atterrato correttamente. Dichiarazione esplicita mantenuta solo per
 * leggibilità (vedi commento sul blocco CTA più sotto). Formule/soglie
 * numeriche (efficienza sonno = tempo dormito / tempo a letto × 100) e
 * negazioni ("non è un consiglio medico", "FitMesh non emette un punteggio
 * composito proprietario") tradotte 1:1 in significato.
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
 *  - Whoop, "Sleep Consistency: Why It Matters and How You Compare"
 *    (whoop.com/thelocker - Sleep Consistency/regolarità SOLO).
 *  - Whoop, "WHOOP Sleep" (support.whoop.com/s/article/WHOOP-Sleep - Sleep
 *    Performance SOLO).
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
    kicker: { it: "Guida", en: "Guide", de: "Ratgeber" },
    title: {
      it: "Sleep Score: cosa misura davvero, e cosa spesso non misura",
      en: "Sleep Score: what it really measures, and what it often doesn't",
      de: "Sleep Score: Was er wirklich misst und was oft nicht",
    },
    subtitle: {
      it: "Anelli e smartwatch diversi danno Sleep Score diversi per la stessa notte, perché i componenti e i pesi usati sono in gran parte proprietari e non pubblici. Un fattore che la ricerca recente indica come rilevante quanto (o più de) la durata - la regolarità degli orari di sonno - resta spesso poco visibile in questi punteggi.",
      en: "Different rings and smartwatches give different Sleep Scores for the same night, because the components and weights they use are largely proprietary and undisclosed. One factor that recent research flags as just as relevant as (or more than) duration - the regularity of sleep timing - often stays underexposed in these scores.",
      de: "Unterschiedliche Ringe und Smartwatches liefern für dieselbe Nacht unterschiedliche Sleep Scores, weil die verwendeten Komponenten und Gewichtungen größtenteils proprietär und nicht öffentlich sind. Ein Faktor, den aktuelle Forschung als genauso relevant wie (oder relevanter als) die Dauer einstuft, nämlich die Regelmäßigkeit der Schlafzeiten, bleibt in diesen Werten oft wenig sichtbar.",
    },
  },
  metaDescription: {
    it: "Cos'è lo Sleep Score, perché varia tra Oura, Fitbit e Whoop, e perché la regolarità del sonno conta quanto la durata. Solo fonti verificate, nessuna diagnosi.",
    en: "What a Sleep Score is, why it varies between Oura, Fitbit, and Whoop, and why sleep regularity matters as much as duration. Verified sources, no diagnosis.",
    de: "Was der Sleep Score wirklich misst und warum er zwischen Oura, Fitbit und Whoop variiert. Schlafregelmäßigkeit zählt ebenso. Geprüfte Quellen, keine Diagnose.",
  },
  // P1.5B Fase B: H1 (hero.title.de) resta descrittivo; seoTitle.de piu'
  // corto per restare <=60 caratteri renderizzati (stesso pattern usato per
  // l'override nl in P0.8 e per il micro-fix DE di P1.5B Fase A).
  seoTitle: {
    de: "Sleep Score: Was er wirklich misst",
  },
  primaryKeyword: {
    it: "sleep score cos'è",
    en: "sleep score vs circadian score",
    de: "sleep score erklärt",
  },
  secondaryKeywords: {
    it: ["sleep score come si calcola", "punteggio sonno anello smartwatch", "regolarità del sonno salute", "sleep regularity index", "sleep score oura fitbit whoop differenze"],
    en: ["what is a sleep score", "how is sleep score calculated", "sleep regularity index", "sleep score oura fitbit whoop", "circadian score vs sleep score"],
    de: ["wie wird der sleep score berechnet", "schlafregelmäßigkeit gesundheit", "sleep regularity index", "sleep score oura fitbit whoop unterschiede", "was ist ein guter sleep score"],
  },
  readMinutes: 9,
  tldr: {
    it: [
      "Lo Sleep Score è un numero composito: combina più metriche (durata, efficienza, fasi, tempistica, a volte frequenza cardiaca) con pesi che ogni azienda tiene in gran parte proprietari.",
      "Oura dichiara pubblicamente 7 componenti (tempo totale di sonno, efficienza, sensazione di riposo, REM, sonno profondo, latenza, tempistica), ma non i pesi esatti; Fitbit (ora documentato sotto Google Health) dichiara 6 componenti (durata, tempo per raggiungere il sonno stabile, sonno stabile, agitazione, risvegli completi, interruzioni); Whoop non dà uno \"sleep score\" tradizionale ma una Sleep Performance (percentuale del bisogno di sonno personalizzato ottenuto).",
      "Uno studio del 2024 su oltre 60.000 persone (UK Biobank) ha trovato che la regolarità degli orari di sonno predice il rischio di mortalità meglio della sola durata del sonno - un fattore spesso meno visibile nei punteggi sonno consumer rispetto a durata ed efficienza.",
      "Questo articolo non emette un punteggio: collega alle fonti ufficiali di ogni piattaforma e al calcolatore FitMesh Labs per l'unica metrica davvero trasparente e verificabile, l'efficienza del sonno.",
    ],
    en: [
      "A Sleep Score is a composite number: it combines multiple metrics (duration, efficiency, stages, timing, sometimes heart rate) with weights each company keeps largely proprietary.",
      "Oura publicly discloses 7 components (total sleep time, efficiency, restfulness, REM, deep sleep, latency, timing), but not the exact weights; Fitbit (now documented under Google Health) discloses 6 components (duration, time to sound sleep, sound sleep, restlessness, full awakenings, interruptions); Whoop doesn't give a traditional \"sleep score\" but a Sleep Performance figure (the percentage of your personalized sleep need obtained).",
      "A 2024 study of over 60,000 people (UK Biobank) found that the regularity of sleep timing predicts mortality risk better than sleep duration alone - a factor often less visible in consumer sleep scores than duration and efficiency.",
      "This article doesn't issue a score: it links to each platform's official documentation and to the FitMesh Labs calculator for the one genuinely transparent, verifiable metric, sleep efficiency.",
    ],
    de: [
      "Der Sleep Score ist eine zusammengesetzte Kennzahl: Er kombiniert mehrere Messwerte (Dauer, Effizienz, Schlafphasen, Zeitpunkt, teilweise Herzfrequenz) mit Gewichtungen, die jedes Unternehmen größtenteils geheim hält.",
      "Oura nennt öffentlich 7 Komponenten (Gesamtschlafzeit, Effizienz, Erholungsgefühl, REM, Tiefschlaf, Einschlafdauer, Zeitpunkt), aber nicht die genauen Gewichtungen; Fitbit (inzwischen unter Google Health dokumentiert) nennt 6 Komponenten (Dauer, Zeit bis zum stabilen Schlaf, stabiler Schlaf, Unruhe, vollständige Aufwachphasen, Unterbrechungen); Whoop vergibt keinen klassischen \"Sleep Score\", sondern eine Sleep Performance (den Prozentsatz des erreichten, individuell berechneten Schlafbedarfs).",
      "Eine Studie aus dem Jahr 2024 mit über 60.000 Teilnehmenden (UK Biobank) fand heraus, dass die Regelmäßigkeit der Schlafzeiten das Sterblichkeitsrisiko besser vorhersagt als die reine Schlafdauer, ein Faktor, der in Consumer-Schlafwerten oft weniger sichtbar ist als Dauer und Effizienz.",
      "Dieser Artikel vergibt selbst keinen Punktwert: Er verlinkt auf die offiziellen Quellen jeder Plattform und auf den FitMesh Labs Rechner für die einzige wirklich transparente und nachprüfbare Kennzahl, die Schlafeffizienz.",
    ],
  },
  body: [
    {
      type: "heading",
      level: 2,
      text: { it: "Cos'è uno Sleep Score", en: "What a Sleep Score is", de: "Was ein Sleep Score ist" },
    },
    {
      type: "paragraph",
      text: {
        it: "Uno Sleep Score è un numero unico (di solito da 0 a 100) che un anello o smartwatch calcola combinando più metriche del sonno rilevate durante la notte: quanto hai dormito, quanto efficientemente, come si sono distribuite le fasi del sonno, a che ora sei andato a letto e ti sei svegliato, e in alcuni casi la frequenza cardiaca notturna. L'obiettivo dichiarato è dare un riassunto rapido, invece di dover leggere 6-7 grafici separati ogni mattina.",
        en: "A Sleep Score is a single number (usually 0 to 100) that a ring or smartwatch calculates by combining multiple sleep metrics detected overnight: how long you slept, how efficiently, how sleep stages were distributed, what time you went to bed and woke up, and in some cases overnight heart rate. The stated goal is to give a quick summary instead of having to read 6-7 separate charts every morning.",
        de: "Ein Sleep Score ist eine einzelne Zahl (meist zwischen 0 und 100), die ein Ring oder eine Smartwatch berechnet, indem er mehrere während der Nacht erfasste Schlafmesswerte kombiniert: wie lange du geschlafen hast, wie effizient, wie sich die Schlafphasen verteilt haben, um welche Uhrzeit du eingeschlafen und aufgewacht bist, und in manchen Fällen die nächtliche Herzfrequenz. Das erklärte Ziel ist eine schnelle Zusammenfassung zu liefern, statt jeden Morgen 6-7 einzelne Diagramme lesen zu müssen.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il problema per chi vuole capire il proprio numero: ogni azienda combina questi fattori in modo diverso, con pesi che restano in gran parte non pubblici. Questo significa che la stessa identica notte di sonno, misurata da due dispositivi diversi, può produrre due Sleep Score diversi - non perché uno dei due sbagli la misurazione, ma perché la FORMULA di composizione è diversa.",
        en: "The problem for anyone trying to understand their own number: every company combines these factors differently, with weights that remain largely undisclosed. This means the exact same night of sleep, measured by two different devices, can produce two different Sleep Scores - not because one of them is measuring wrong, but because the composition FORMULA is different.",
        de: "Das Problem für alle, die ihre eigene Zahl verstehen wollen: Jedes Unternehmen kombiniert diese Faktoren unterschiedlich, mit Gewichtungen, die größtenteils nicht öffentlich sind. Das bedeutet, dass exakt dieselbe Nacht, gemessen mit zwei verschiedenen Geräten, zwei unterschiedliche Sleep Scores ergeben kann, nicht weil eines der beiden Geräte falsch misst, sondern weil die FORMEL zur Berechnung unterschiedlich ist.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Come lo calcolano (pubblicamente) tre piattaforme note", en: "How three well-known platforms calculate it (publicly)", de: "Wie drei bekannte Plattformen ihn (öffentlich) berechnen" },
    },
    {
      type: "table",
      caption: { it: "Componenti dichiarati pubblicamente (non i pesi esatti, quasi sempre proprietari)", en: "Publicly disclosed components (not the exact weights, almost always proprietary)", de: "Öffentlich genannte Komponenten (nicht die genauen Gewichtungen, fast immer proprietär)" },
      headers: {
        it: ["Piattaforma", "Componenti dichiarati", "Punteggio unico?"],
        en: ["Platform", "Disclosed components", "Single score?"],
        de: ["Plattform", "Genannte Komponenten", "Einzelner Punktwert?"],
      },
      rows: [
        {
          it: ["Oura", "Tempo totale di sonno, efficienza, sensazione di riposo, REM, sonno profondo, latenza, tempistica (7 fattori)", "Sì, Sleep Score 0-100"],
          en: ["Oura", "Total sleep time, efficiency, restfulness, REM, deep sleep, latency, timing (7 factors)", "Yes, Sleep Score 0-100"],
          de: ["Oura", "Gesamtschlafzeit, Effizienz, Erholungsgefühl, REM, Tiefschlaf, Einschlafdauer, Zeitpunkt (7 Faktoren)", "Ja, Sleep Score 0-100"],
        },
        {
          it: ["Fitbit (Google Health)", "Sei fattori dichiarati: durata del sonno, tempo per raggiungere il sonno stabile, sonno stabile, agitazione, risvegli completi, interruzioni", "Sì, Sleep Score 0-100"],
          en: ["Fitbit (Google Health)", "Six disclosed factors: sleep duration, time to sound sleep, sound sleep, restlessness, full awakenings, interruptions", "Yes, Sleep Score 0-100"],
          de: ["Fitbit (Google Health)", "Sechs genannte Faktoren: Schlafdauer, Zeit bis zum stabilen Schlaf, stabiler Schlaf, Unruhe, vollständige Aufwachphasen, Unterbrechungen", "Ja, Sleep Score 0-100"],
        },
        {
          it: ["Whoop", "Sleep Performance = % del bisogno di sonno personalizzato (Sleep Need) ottenuto; Sleep Consistency (regolarità di orari di sonno/veglia su una finestra di 4 giorni) tracciata separatamente", "No: nessuno sleep score tradizionale 0-100; Sleep Performance è la metrica più vicina"],
          en: ["Whoop", "Sleep Performance = % of personalized Sleep Need actually obtained; Sleep Consistency (sleep/wake timing regularity over a 4-day window) tracked separately", "No: no traditional 0-100 sleep score; Sleep Performance is the closest metric"],
          de: ["Whoop", "Sleep Performance = erreichter Prozentsatz des individuell berechneten Schlafbedarfs (Sleep Need); Sleep Consistency (Regelmäßigkeit der Schlaf-/Wachzeiten über ein 4-Tage-Fenster) wird separat erfasst", "Nein: kein klassischer 0-100-Sleep-Score; Sleep Performance ist die nächstliegende Kennzahl"],
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Nota", en: "Note", de: "Hinweis" },
      body: {
        it: "Questa tabella riporta solo ciò che ogni azienda dichiara pubblicamente nella propria documentazione ufficiale (vedi Fonti in fondo). Nessuna delle tre pubblica i pesi esatti assegnati a ciascun componente: non è quindi possibile ricostruire con precisione la formula completa da fonti esterne, e questo articolo non ci prova.",
        en: "This table reports only what each company publicly discloses in its own official documentation (see Sources below). None of the three publishes the exact weights assigned to each component: it is therefore not possible to precisely reconstruct the full formula from external sources, and this article does not attempt to.",
        de: "Diese Tabelle enthält nur, was jedes Unternehmen in seiner eigenen offiziellen Dokumentation öffentlich angibt (siehe Quellen am Ende). Keines der drei Unternehmen veröffentlicht die genauen Gewichtungen der einzelnen Komponenten: Die vollständige Formel lässt sich aus externen Quellen daher nicht präzise rekonstruieren, und dieser Artikel unternimmt keinen entsprechenden Versuch.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Il fattore che spesso resta in ombra: la regolarità", en: "The factor that often stays in the shadows: regularity", de: "Der Faktor, der oft im Schatten bleibt: Regelmäßigkeit" },
    },
    {
      type: "paragraph",
      text: {
        it: "Un fattore in particolare merita attenzione: la REGOLARITÀ degli orari di sonno, cioè quanto i tuoi orari di andare a letto e svegliarti restano costanti notte dopo notte - un concetto distinto sia dalla durata sia dall'efficienza, e più vicino all'idea di \"punteggio circadiano\".",
        en: "One factor in particular deserves attention: the REGULARITY of sleep timing - how consistent your bedtime and wake time stay night after night - a concept distinct from both duration and efficiency, and closer to the idea of a \"circadian score\".",
        de: "Ein Faktor verdient besondere Aufmerksamkeit: die REGELMÄSSIGKEIT der Schlafzeiten, also wie konstant deine Einschlaf- und Aufwachzeiten Nacht für Nacht bleiben, ein Konzept, das sich sowohl von der Dauer als auch von der Effizienz unterscheidet und näher an der Idee eines \"zirkadianen Scores\" liegt.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Uno studio prospettico pubblicato nel 2024 sulla rivista Sleep, condotto su oltre 60.000 partecipanti della UK Biobank con dati di accelerometro reali (oltre 10 milioni di ore), ha misurato un Sleep Regularity Index (SRI, indice di regolarità del sonno) e lo ha confrontato con la durata del sonno come predittore di mortalità. Il risultato: la regolarità del sonno si è dimostrata un predittore più forte della mortalità per tutte le cause rispetto alla sola durata - con una riduzione del rischio dal 20% al 48% per chi si trovava nei quattro quintili più regolari rispetto al meno regolare.",
        en: "A prospective study published in 2024 in the journal Sleep, conducted on over 60,000 UK Biobank participants using real accelerometer data (over 10 million hours), measured a Sleep Regularity Index (SRI) and compared it to sleep duration as a predictor of mortality. The result: sleep regularity was a stronger predictor of all-cause mortality than duration alone - with a 20% to 48% lower risk for those in the four most regular quintiles compared to the least regular one.",
        de: "Eine prospektive Studie, die 2024 in der Fachzeitschrift Sleep veröffentlicht wurde und über 60.000 Teilnehmende der UK Biobank mit echten Beschleunigungssensor-Daten (über 10 Millionen Stunden) untersuchte, hat einen Sleep Regularity Index (SRI, Schlafregelmäßigkeits-Index) gemessen und ihn mit der Schlafdauer als Sterblichkeitsprädiktor verglichen. Das Ergebnis: Die Schlafregelmäßigkeit erwies sich als stärkerer Prädiktor für die Gesamtmortalität als die reine Dauer, mit einem um 20 bis 48 Prozent geringeren Risiko für Personen in den vier regelmäßigeren Quintilen im Vergleich zum unregelmäßigsten Quintil.",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Cosa NON dice questo studio", en: "What this study does NOT say", de: "Was diese Studie NICHT aussagt" },
      body: {
        it: "È uno studio di coorte osservazionale: mostra un'associazione statistica su una popolazione ampia, non una relazione di causa-effetto dimostrata per il singolo individuo, e non permette di calcolare un rischio personale da un singolo numero. Non è un consiglio medico e non sostituisce il parere di un professionista sanitario.",
        en: "This is an observational cohort study: it shows a statistical association across a large population, not a proven cause-and-effect relationship for any single individual, and it does not let you calculate a personal risk from a single number. It is not medical advice and does not replace guidance from a healthcare professional.",
        de: "Es handelt sich um eine beobachtende Kohortenstudie: Sie zeigt eine statistische Assoziation in einer großen Bevölkerungsgruppe, keine für den Einzelnen bewiesene Ursache-Wirkungs-Beziehung, und sie erlaubt es nicht, aus einer einzelnen Zahl ein persönliches Risiko zu berechnen. Dies ist kein medizinischer Rat und ersetzt nicht die Einschätzung einer medizinischen Fachperson.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il punto per chi guarda il proprio Sleep Score ogni mattina: la maggior parte dei punteggi consumer include QUALCHE nozione di tempistica (Oura la elenca esplicitamente, Whoop la chiama \"coerenza\"), ma la regolarità notte-dopo-notte spesso pesa meno nella percezione dell'utente rispetto a durata ed efficienza, che sono più immediate da capire e da migliorare in una singola notte. La ricerca sopra suggerisce che vale la pena guardare la propria costanza di orari con la stessa attenzione riservata alle ore dormite.",
        en: "The takeaway for anyone checking their Sleep Score every morning: most consumer scores include SOME notion of timing (Oura lists it explicitly, Whoop calls it \"consistency\"), but night-to-night regularity often carries less weight in how users perceive it compared to duration and efficiency, which are more immediately understandable and fixable in a single night. The research above suggests it's worth watching your own timing consistency with the same attention usually reserved for hours slept.",
        de: "Für alle, die jeden Morgen ihren Sleep Score ansehen, bedeutet das: Die meisten Consumer-Werte enthalten IRGENDEINE Vorstellung von Zeitpunkt (Oura nennt sie ausdrücklich, Whoop nennt sie \"Consistency\"), aber die Nacht-für-Nacht-Regelmäßigkeit fällt in der Wahrnehmung der Nutzer oft weniger ins Gewicht als Dauer und Effizienz, die unmittelbarer verständlich und in einer einzelnen Nacht leichter zu verbessern sind. Die oben genannte Forschung legt nahe, dass es sich lohnt, der eigenen Zeitkonstanz dieselbe Aufmerksamkeit zu schenken wie den geschlafenen Stunden.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa puoi effettivamente calcolare tu stesso, in modo trasparente", en: "What you can actually calculate yourself, transparently", de: "Was du selbst tatsächlich transparent berechnen kannst" },
    },
    {
      type: "paragraph",
      text: {
        it: "Nessuno Sleep Score proprietario può essere replicato con precisione da fonti esterne, perché i pesi non sono pubblici. Una metrica invece è completamente trasparente e replicabile con carta e penna: l'efficienza del sonno (tempo dormito diviso tempo a letto, per 100). FitMesh Labs offre un calcolatore gratuito che applica questa singola formula, dichiarata esplicitamente, senza combinarla con altri fattori non dichiarati.",
        en: "No proprietary Sleep Score can be precisely replicated from external sources, because the weights are not public. One metric, however, is fully transparent and replicable with pen and paper: sleep efficiency (time asleep divided by time in bed, times 100). FitMesh Labs offers a free calculator that applies this single, explicitly stated formula, without blending it with other undisclosed factors.",
        de: "Kein proprietärer Sleep Score lässt sich aus externen Quellen präzise nachbilden, weil die Gewichtungen nicht öffentlich sind. Eine Kennzahl dagegen ist vollständig transparent und mit Papier und Stift nachrechenbar: die Schlafeffizienz (geschlafene Zeit geteilt durch Zeit im Bett, mal 100). FitMesh Labs bietet einen kostenlosen Rechner, der genau diese eine, ausdrücklich genannte Formel anwendet, ohne sie mit anderen, nicht offengelegten Faktoren zu vermischen.",
      },
    },
    {
      type: "cta",
      title: { it: "Calcola la tua efficienza del sonno", en: "Calculate your sleep efficiency", de: "Berechne deine Schlafeffizienz" },
      body: {
        it: "Formula esplicita, calcolo nel browser, nessun dato inviato: scopri quanto del tempo a letto è stato davvero sonno.",
        en: "Explicit formula, calculated in your browser, nothing sent anywhere: see how much of your time in bed was actually sleep.",
        de: "Explizite Formel, Berechnung im Browser, keine Daten werden gesendet: Finde heraus, wie viel deiner Zeit im Bett wirklich Schlaf war.",
      },
      ctaLabel: { it: "Apri il calcolatore →", en: "Open the calculator →", de: "Rechner öffnen →" },
      // DE dichiarato esplicitamente verso la versione EN per documentare
      // l'intento (LABS_LOCALES = it/en, nessuna pagina DE esiste). Verificato
      // live: BlogRenderer.localizeInternalHref riscrive comunque il prefisso
      // sulla locale corrente per i path non /blog|/lp (qui diventa
      // /de/labs/sleep-efficiency-calculator), ma /de/labs/* con QUALSIASI
      // slug it/en redirige 307 a singolo hop verso /en/labs/... — quindi
      // anche senza questa chiave il fallback su `.it` sarebbe atterrato
      // correttamente. Non e' quindi un fix del bug locale-mismatch
      // classe P0.11-D (quello riguardava un path senza NESSUNA destinazione
      // valida); qui e' solo dichiarazione esplicita, innocua e più leggibile.
      ctaHref: { it: "/it/labs/calcolatore-efficienza-sonno", en: "/en/labs/sleep-efficiency-calculator", de: "/en/labs/sleep-efficiency-calculator" },
      ctaId: "blog-sleep-score-sleep-efficiency-cta",
      ctaPlacement: "blog_body_mid",
    },
    {
      type: "paragraph",
      text: {
        it: "Se ti interessa anche il tema della frequenza cardiaca durante l'attività fisica - un altro caso in cui numeri diversi tra dispositivi nascono da METODI diversi, non da errori di misurazione - abbiamo pubblicato un approfondimento dedicato e un secondo calcolatore.",
        en: "If you're also interested in heart rate during exercise - another case where different numbers between devices come from different METHODS, not measurement errors - we've published a dedicated deep dive and a second calculator.",
        de: "Wenn dich auch das Thema Herzfrequenz während des Trainings interessiert, ein weiterer Fall, in dem unterschiedliche Zahlen zwischen Geräten aus unterschiedlichen METHODEN entstehen, nicht aus Messfehlern, haben wir dazu einen eigenen Beitrag und einen zweiten Rechner veröffentlicht.",
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
        de: [
          "Warum sich Zone 2 zwischen Smartwatch und App unterscheidet: dasselbe Prinzip wie in der Tabelle oben, angewendet auf Herzfrequenzzonen.",
        ],
      },
    },
  ],
  faq: [
    {
      q: { it: "Qual è un buon Sleep Score?", en: "What is a good Sleep Score?", de: "Was ist ein guter Sleep Score?" },
      a: {
        it: "Questo articolo non emette una valutazione \"buono/cattivo\": ogni piattaforma definisce le proprie fasce interpretative nella propria documentazione ufficiale, con pesi che restano in gran parte non pubblici. Confrontare il numero assoluto tra dispositivi diversi ha poco senso, perché le formule sono diverse.",
        en: "This article does not issue a \"good/bad\" rating: each platform defines its own interpretive bands in its own official documentation, with weights that remain largely undisclosed. Comparing the absolute number across different devices makes little sense, because the formulas differ.",
        de: "Dieser Artikel gibt keine \"gut/schlecht\"-Bewertung ab: Jede Plattform definiert ihre eigenen Interpretationsbereiche in der jeweiligen offiziellen Dokumentation, mit Gewichtungen, die größtenteils nicht öffentlich sind. Die absolute Zahl zwischen verschiedenen Geräten zu vergleichen, ergibt wenig Sinn, weil die Formeln unterschiedlich sind.",
      },
    },
    {
      q: { it: "Perché il mio Sleep Score cambia tra un dispositivo e l'altro per la stessa notte?", en: "Why does my Sleep Score differ between devices for the same night?", de: "Warum unterscheidet sich mein Sleep Score zwischen Geräten für dieselbe Nacht?" },
      a: {
        it: "Perché ogni azienda combina metriche diverse (durata, efficienza, fasi, tempistica, a volte frequenza cardiaca) con pesi proprietari diversi. Non è un errore di misurazione: è una scelta di formula diversa, come per le zone di frequenza cardiaca.",
        en: "Because each company combines different metrics (duration, efficiency, stages, timing, sometimes heart rate) with different proprietary weights. It's not a measurement error: it's a different formula choice, similar to heart rate zones.",
        de: "Weil jedes Unternehmen unterschiedliche Messwerte (Dauer, Effizienz, Schlafphasen, Zeitpunkt, teilweise Herzfrequenz) mit unterschiedlichen proprietären Gewichtungen kombiniert. Das ist kein Messfehler: Es ist eine andere Formel-Entscheidung, ähnlich wie bei Herzfrequenzzonen.",
      },
    },
    {
      q: { it: "Cos'è il Sleep Regularity Index (SRI)?", en: "What is the Sleep Regularity Index (SRI)?", de: "Was ist der Sleep Regularity Index (SRI)?" },
      a: {
        it: "È una misura scientifica di quanto i tuoi orari di sonno-veglia restano costanti notte dopo notte, usata in ricerca (non è un punteggio consumer ufficiale di nessuna delle tre piattaforme citate sopra). Uno studio del 2024 sulla rivista Sleep lo ha associato al rischio di mortalità in modo più forte della sola durata del sonno, su un campione di oltre 60.000 persone.",
        en: "It's a scientific measure of how consistent your sleep-wake timing stays from night to night, used in research (it is not an official consumer score from any of the three platforms cited above). A 2024 study in the journal Sleep associated it with mortality risk more strongly than sleep duration alone, in a sample of over 60,000 people.",
        de: "Er ist ein wissenschaftliches Maß dafür, wie konstant deine Schlaf-Wach-Zeiten Nacht für Nacht bleiben, und wird in der Forschung verwendet (er ist kein offizieller Consumer-Wert einer der drei oben genannten Plattformen). Eine Studie aus dem Jahr 2024 in der Fachzeitschrift Sleep hat ihn stärker mit dem Sterblichkeitsrisiko assoziiert als die reine Schlafdauer, an einer Stichprobe von über 60.000 Personen.",
      },
    },
    {
      q: { it: "FitMesh calcola un suo Sleep Score?", en: "Does FitMesh calculate its own Sleep Score?", de: "Berechnet FitMesh einen eigenen Sleep Score?" },
      a: {
        it: "No: questo articolo descrive come funzionano gli Sleep Score di terze parti e collega al calcolatore FitMesh Labs per l'unica metrica pienamente trasparente, l'efficienza del sonno. FitMesh non emette un punteggio composito proprietario.",
        en: "No: this article describes how third-party Sleep Scores work and links to the FitMesh Labs calculator for the one fully transparent metric, sleep efficiency. FitMesh does not issue a proprietary composite score.",
        de: "Nein: Dieser Artikel beschreibt, wie die Sleep Scores von Drittanbietern funktionieren, und verlinkt auf den FitMesh Labs Rechner für die einzige vollständig transparente Kennzahl, die Schlafeffizienz. FitMesh vergibt keinen eigenen zusammengesetzten Punktwert.",
      },
    },
  ],
  related: ["efficienza-del-sonno-formula-calcolo", "perche-zona-2-cambia-smartwatch-app", "hrv-cose-significato-valori"],
  sources: [
    "https://pubmed.ncbi.nlm.nih.gov/37738616/",
    "https://support.ouraring.com/hc/en-us/articles/360057792293-A-Guide-to-Your-Sleep-Contributors",
    "https://support.google.com/fitbit/answer/14236513",
    "https://www.whoop.com/us/en/thelocker/new-feature-sleep-consistency-why-we-track-it/",
    "https://support.whoop.com/s/article/WHOOP-Sleep?language=en_US",
  ],
  brandsMentioned: ["Oura", "Fitbit", "Whoop"],
  ldType: "BlogPosting",
};
