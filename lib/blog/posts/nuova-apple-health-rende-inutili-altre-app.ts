import type { BlogPost } from "../types";

/**
 * SPRINT P1.21 (11/09/2026): articolo di analisi sulla app Salute
 * riprogettata annunciata da Apple il 9 settembre 2026.
 *
 * Fonti primarie usate (tutte citate inline nel corpo, `sourcesRenderedInline: true`):
 * - Apple Newsroom, "Apple advances health and fitness capabilities using
 *   Apple Intelligence" (9/9/2026)
 * - Apple Newsroom, "Introducing Apple Watch Series 12, with the all-new
 *   Health Sensing System" (9/9/2026)
 * - Apple Newsroom, "Apple unveils Apple Watch Ultra 4" (9/9/2026)
 * - developer.apple.com/documentation/healthkit (indice tipi + changelog,
 *   verificato 11/09/2026 — nessun HKQuantityTypeIdentifier/
 *   HKCategoryTypeIdentifier per readiness/healthAge/longevity/sleepScore)
 *
 * ADDENDUM P1.21-A (11/09/2026), correzione temporale bloccante applicata:
 * la app riprogettata NON è ancora disponibile — "later this year", prima
 * solo in inglese USA, separata dal rilascio di iOS 27 (14/9/2026). Framing
 * vincolato: "Apple ha annunciato"/"arriverà"/"secondo quanto presentato da
 * Apple" — MAI "ha introdotto"/"è ora disponibile"/"abbiamo provato" per la
 * app riprogettata nel suo complesso. Nessuna data di lancio non comunicata
 * da Apple.
 *
 * MICRO-GATE P1.21-B (11/09/2026), review SEO/GEO/truth applicata (11 punti,
 * verificata con un pass di verifica avversariale a 4 agenti paralleli,
 * uno per locale, prima di applicare — vedi Workflow wf_81179ac7-df3):
 * - Ogni riferimento al 14/9 reso evergreen ("Apple ha annunciato la
 *   disponibilità... a partire dal 14 settembre 2026"), corretto un vero
 *   errore di tempo verbale: il paragrafo "Cosa ha annunciato Apple"
 *   diceva "iOS 27 è arrivato" al passato, ma la data di preparazione di
 *   questo articolo (11/9) precede il 14/9 di 3 giorni.
 * - Rimossa ogni variante "FitMesh legge qualunque/tutto ciò che è presente
 *   in Apple Salute": ora "legge, previa autorizzazione, i campioni dei
 *   tipi HealthKit supportati, senza limitarli alla sola sorgente Apple
 *   Watch" (TL;DR, corpo, benefici CTA).
 * - Chiarito che il riconoscimento di Garmin/Samsung/Fitbit/altri come nomi
 *   sorgente NON è un'integrazione diretta iOS: sono le app di quei
 *   produttori a scrivere in Apple Salute, FitMesh legge da lì.
 * - Distinti esplicitamente i ruoli invece di affermare che Apple Salute
 *   "non unisce" fonti eterogenee: Apple Salute = archivio/analisi
 *   dell'ecosistema Apple dei dati che raggiungono HealthKit; FitMesh =
 *   dashboard cross-platform legata all'account, con ponte opzionale.
 * - "Nessuna app può leggere Readiness/Health Age, punto" sostituito con
 *   il risultato circoscritto dell'audit dell'11/9 (nessuna API pubblica
 *   documentata identificata; FitMesh non ne dichiara supporto oggi).
 * - Title FR accorciato, 4 meta description riscritte (da 189-212 a
 *   153-165 caratteri), intro riaperta con risposta diretta, aggiunta
 *   tabella di raffronto compatta prima del verdetto.
 * - Il pass di verifica ha trovato un problema reale non nella lista dei
 *   10 punti espliciti ma comunque in violazione del framing vincolato:
 *   la frase centrale del verdetto ("Apple Health diventa molto più
 *   completa...") usava un presente non coperto da hedging per una
 *   funzione non ancora pubblica — corretto in "una volta disponibile,
 *   [...] diventerà" in tutte e 4 le lingue (anche dove il pass EN/DE/FR
 *   l'aveva giudicato borderline-accettabile, per coerenza).
 *
 * Verdetto centrale fissato dal mandato: Apple Health diventa molto più
 * completa e può ridurre il bisogno di alcune app di sola analisi, ma non
 * sostituisce automaticamente gli strumenti che collegano dispositivi,
 * fonti e piattaforme differenti. Il caso in cui FitMesh è MENO necessario
 * (utente solo-Apple con Watch nuovo, interessato solo agli insight nativi)
 * è dichiarato esplicitamente, non nascosto.
 *
 * Divieti rispettati: nessun claim medico/diagnostico/di superiorità
 * algoritmica; nessuna promessa che FitMesh importi/sincronizzi "tutti i
 * dati"; nessun supporto dichiarato ai nuovi punteggi Apple senza prova API
 * (Readiness/Health Age: nessuna prova trovata, dichiarato come tale).
 *
 * Cannibalizzazione: nessun post esistente copre questo intento (verificato
 * su 36 post con overlap tematico Apple Health/HealthKit/Apple Watch).
 * Overlap ALTA con dati-anello-smart-apple-salute.ts (meccanismo del ponte
 * di scrittura — collegato, non riscritto) e how-to-export-apple-health-data.ts
 * (export XML/CSV — collegato, non riscritto).
 *
 * publishedAt/updatedAt: data di preparazione. STOP prima del merge per
 * mandato — nessuna pubblicazione senza GO esplicito.
 */
export const post: BlogPost = {
  slug: "nuova-apple-health-rende-inutili-altre-app",
  category: "guides",
  publishedAt: "2026-09-11",
  updatedAt: "2026-09-11",
  ldType: "BlogPosting",
  readMinutes: 8,
  seoTitle: {
    it: "La nuova Apple Health sostituisce le altre app?",
    en: "Will the New Apple Health Replace Fitness Apps?",
    de: "Ersetzt die neue Apple Health andere Apps?",
    fr: "Nouvelle Apple Health : remplace-t-elle les apps ?",
  },
  primaryKeyword: {
    it: "nuova apple health sostituisce altre app",
    en: "new apple health replace fitness apps",
    de: "neue apple health ersetzt andere apps",
    fr: "nouvelle apple health remplace applications",
  },
  secondaryKeywords: {
    it: [
      "apple health riprogettata annuncio",
      "readiness health age longevity apple",
      "apple health healthkit terze parti",
      "fitmesh vs apple health",
    ],
    en: [
      "redesigned apple health announcement",
      "readiness health age longevity apple",
      "apple health healthkit third-party apps",
      "fitmesh vs apple health",
    ],
    de: [
      "neu gestaltete apple health ankündigung",
      "readiness health age longevity apple",
      "apple health healthkit drittanbieter-apps",
      "fitmesh vs apple health",
    ],
    fr: [
      "annonce apple health repensée",
      "readiness health age longevity apple",
      "apple health healthkit applications tierces",
      "fitmesh vs apple health",
    ],
  },
  metaDescription: {
    it: "Apple ha annunciato una nuova app Salute con Insights e Longevity: cosa sappiamo, cosa non è documentato, e dove FitMesh resta utile con più dispositivi.",
    en: "Apple has announced a redesigned Health app with Insights and Longevity: what we know, what's undocumented, and where FitMesh still matters for multi-device users.",
    de: "Apple hat eine neue App Health mit Insights und Longevity angekündigt: was wir wissen, was noch offen ist, und wo FitMesh für mehrere Geräte nützlich bleibt.",
    fr: "Apple a annoncé une app Santé repensée avec Insights et Longevity : ce que l'on sait, ce qui reste flou, et où FitMesh reste utile avec plusieurs appareils.",
  },
  tldr: {
    it: [
      "Apple ha annunciato (9/9/2026) una app Salute completamente riprogettata, con i tab Insights e Longevity — ma non è ancora disponibile: arriverà più avanti nel 2026, prima solo in inglese USA, separata dal rilascio di iOS 27 del 14/9.",
      "Serve un iPhone/iPad abilitato per Apple Intelligence per l'intera app; alcune funzioni (frequenza cardiaca ogni 5 secondi, HRV più frequente, la complicazione Passi sul quadrante) richiedono in più Apple Watch Series 12 o Ultra 4.",
      "A oggi, sulla documentazione sviluppatore Apple, Readiness e Health Age non risultano esposti tramite HealthKit ad app di terze parti: nessuna prova che si possano leggere da fuori la app Salute.",
      "FitMesh, nella release pubblica 3.10.0, legge — previa autorizzazione dell'utente — i campioni dei tipi HealthKit supportati (passi, frequenza cardiaca, sonno e altri), senza limitarli alla sola sorgente Apple Watch, e può scrivere alcune metriche verso Apple Salute su attivazione esplicita, con limiti dichiarati.",
      "Il ruolo di FitMesh resta distinto: Apple Salute è l'archivio e l'analisi dell'ecosistema Apple dei dati che raggiungono HealthKit, mentre FitMesh è una dashboard cross-platform legata all'account, con un ponte opzionale verso alcune metriche supportate.",
    ],
    en: [
      "Apple has announced (9/9/2026) a completely redesigned Health app, with Insights and Longevity tabs — but it isn't available yet: it's coming later in 2026, starting in U.S. English only, separate from the iOS 27 release on 9/14.",
      "An Apple Intelligence-enabled iPhone/iPad is required for the whole app; some features (5-second heart rate, more frequent HRV, the Steps watch face complication) additionally require Apple Watch Series 12 or Ultra 4.",
      "As of today, Apple's developer documentation shows no evidence that Readiness or Health Age are exposed via HealthKit to third-party apps: nothing suggests they can be read from outside the Health app.",
      "FitMesh, in its public 3.10.0 release, reads — with the user's authorization — samples of the supported HealthKit types (steps, heart rate, sleep, and others), without limiting itself to the Apple Watch source, and can write some metrics to Apple Health when explicitly enabled, with stated limits.",
      "FitMesh's role stays distinct: Apple Health is the Apple ecosystem's archive and analysis of data that reaches HealthKit, while FitMesh is a cross-platform, account-based dashboard with an optional bridge to some supported metrics.",
    ],
    de: [
      "Apple hat (9.9.2026) eine komplett neu gestaltete App Health angekündigt, mit den Tabs Insights und Longevity — verfügbar ist sie aber noch nicht: Sie kommt später im Jahr 2026, zunächst nur auf US-Englisch, getrennt vom iOS-27-Release am 14.9.",
      "Für die gesamte App ist ein Apple-Intelligence-fähiges iPhone/iPad nötig; einige Funktionen (Herzfrequenz alle 5 Sekunden, häufigere HRV, die Schritte-Komplikation auf dem Zifferblatt) erfordern zusätzlich Apple Watch Series 12 oder Ultra 4.",
      "Laut der Apple-Entwicklerdokumentation gibt es heute keinen Beleg dafür, dass Readiness oder Health Age über HealthKit für Drittanbieter-Apps zugänglich sind: nichts deutet darauf hin, dass sie außerhalb der App Health lesbar sind.",
      "FitMesh liest in seiner öffentlichen Version 3.10.0 — nach Zustimmung der Nutzerin oder des Nutzers — Messwerte der unterstützten HealthKit-Typen (Schritte, Herzfrequenz, Schlaf und weitere), ohne sich auf die Apple-Watch-Quelle zu beschränken, und kann bei expliziter Aktivierung einige Messwerte nach Apple Health schreiben, mit klar benannten Grenzen.",
      "Die Rolle von FitMesh bleibt eigenständig: Apple Health ist das Archiv und die Analyse des Apple-Ökosystems für Daten, die HealthKit erreichen, während FitMesh ein kontobasiertes, plattformübergreifendes Dashboard mit einer optionalen Brücke zu einigen unterstützten Messwerten ist.",
    ],
    fr: [
      "Apple a annoncé (9/9/2026) une app Santé entièrement repensée, avec les onglets Insights et Longevity — mais elle n'est pas encore disponible : elle arrivera plus tard en 2026, d'abord en anglais américain uniquement, séparément de la sortie d'iOS 27 le 14/9.",
      "Un iPhone/iPad compatible Apple Intelligence est requis pour toute l'app ; certaines fonctions (fréquence cardiaque toutes les 5 secondes, VFC plus fréquente, la complication Pas sur le cadran) nécessitent en plus une Apple Watch Series 12 ou Ultra 4.",
      "À ce jour, la documentation développeur Apple ne montre aucune preuve que Readiness ou Health Age soient exposés via HealthKit aux applications tierces : rien n'indique qu'ils soient lisibles en dehors de l'app Santé.",
      "FitMesh, dans sa version publique 3.10.0, lit — avec l'autorisation de l'utilisateur — des échantillons des types HealthKit pris en charge (pas, fréquence cardiaque, sommeil et autres), sans se limiter à la seule source Apple Watch, et peut écrire certaines mesures vers Apple Santé sur activation explicite, avec des limites déclarées.",
      "Le rôle de FitMesh reste distinct : Apple Santé est l'archive et l'analyse de l'écosystème Apple pour les données qui atteignent HealthKit, tandis que FitMesh est un tableau de bord multiplateforme lié au compte, avec un pont optionnel vers certaines mesures prises en charge.",
    ],
  },
  hero: {
    kicker: {
      it: "Analisi",
      en: "Analysis",
      de: "Analyse",
      fr: "Analyse",
    },
    title: {
      it: "La nuova Apple Health renderà inutili le altre app? Cosa sappiamo finora",
      en: "Will the New Apple Health Make Other Apps Useless? What We Know So Far",
      de: "Macht die neue Apple Health andere Apps überflüssig? Was wir bisher wissen",
      fr: "La nouvelle Apple Santé rendra-t-elle les autres apps inutiles ? Ce que l'on sait pour l'instant",
    },
    subtitle: {
      it: "Apple ha annunciato una app Salute molto più ambiziosa. Non è ancora possibile verificarla nell'uso pubblico definitivo: ecco cosa è stato presentato, cosa è già documentato tecnicamente, e cosa resta da vedere.",
      en: "Apple has announced a much more ambitious Health app. It isn't yet possible to verify it in final public use: here's what's been presented, what's already documented technically, and what's still unknown.",
      de: "Apple hat eine deutlich ambitioniertere App Health angekündigt. Eine Überprüfung im endgültigen öffentlichen Einsatz ist noch nicht möglich: hier, was vorgestellt wurde, was technisch bereits dokumentiert ist, und was noch offen bleibt.",
      fr: "Apple a annoncé une app Santé bien plus ambitieuse. Il n'est pas encore possible de la vérifier dans son usage public définitif : voici ce qui a été présenté, ce qui est déjà documenté techniquement, et ce qui reste à voir.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "La nuova Apple Salute non rende obsolete tutte le altre app — ma può ridurre il bisogno di applicazioni di sola analisi nello scenario esclusivamente Apple. Il 9 settembre 2026 Apple ha annunciato una riprogettazione profonda della app Salute, insieme ai nuovi Apple Watch Series 12 e Ultra 4: punteggi giornalieri, un'analisi di lungo periodo della salute, persino analisi del sangue collegate. Resta lecito chiedersi cosa significhi per le app che oggi uniscono più dispositivi — inclusa FitMesh: dipende da cosa possiedi, e su alcuni punti Apple stessa non è stata ancora chiara.",
        en: "The new Apple Health doesn't make every other app obsolete — but it can reduce the need for analysis-only apps in the Apple-only scenario. On September 9, 2026, Apple announced a deep redesign of the Health app, alongside the new Apple Watch Series 12 and Ultra 4: daily scores, a long-term health analysis, even connected blood testing. It's still fair to ask what this means for apps that bring multiple devices together today — FitMesh included: it depends on what you own, and on some points Apple itself hasn't been clear yet.",
        de: "Die neue Apple Health macht nicht jede andere App überflüssig — kann aber im rein Apple-basierten Szenario den Bedarf an reinen Analyse-Apps verringern. Am 9. September 2026 hat Apple eine tiefgreifende Neugestaltung der App Health angekündigt, zusammen mit den neuen Apple Watch Series 12 und Ultra 4: tägliche Punktzahlen, eine langfristige Gesundheitsanalyse, sogar angebundene Bluttests. Es bleibt berechtigt zu fragen, was das für Apps bedeutet, die heute mehrere Geräte zusammenführen — FitMesh eingeschlossen: Es hängt davon ab, was du besitzt, und bei einigen Punkten war Apple selbst noch nicht eindeutig.",
        fr: "La nouvelle Apple Santé ne rend pas toutes les autres applications obsolètes — mais elle peut réduire le besoin d'applications de simple analyse dans le scénario exclusivement Apple. Le 9 septembre 2026, Apple a annoncé une refonte profonde de l'app Santé, aux côtés des nouvelles Apple Watch Series 12 et Ultra 4 : scores quotidiens, analyse de santé à long terme, et même des analyses sanguines connectées. Il reste légitime de se demander ce que cela signifie pour les applications qui réunissent aujourd'hui plusieurs appareils — FitMesh y compris : cela dépend de ce que vous possédez, et sur certains points Apple elle-même n'a pas encore été claire.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa ha annunciato Apple, e quando arriva davvero",
        en: "What Apple announced, and when it's actually arriving",
        de: "Was Apple angekündigt hat, und wann es wirklich kommt",
        fr: "Ce qu'Apple a annoncé, et quand ça arrive vraiment",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Prima distinzione importante, spesso confusa: Apple ha annunciato la disponibilità di **iOS 27** e **watchOS 27** a partire dal 14 settembre 2026, ma la **app Salute riprogettata è una cosa diversa e separata**, non ancora disponibile. Apple scrive esplicitamente che arriverà \"later this year\" (più avanti nel 2026), inizialmente solo in inglese statunitense, con altre lingue a seguire — nessuna data precisa comunicata. Fonte: [Apple Newsroom — Apple advances health and fitness capabilities using Apple Intelligence](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/), 9 settembre 2026.",
        en: "First important distinction, often confused: Apple has announced the availability of **iOS 27** and **watchOS 27** starting September 14, 2026, but the **redesigned Health app is a separate, different thing**, not yet available. Apple explicitly states it's coming \"later this year\" (in 2026), initially in U.S. English only, with more languages to follow — no precise date given. Source: [Apple Newsroom — Apple advances health and fitness capabilities using Apple Intelligence](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/), September 9, 2026.",
        de: "Eine wichtige, oft verwechselte Unterscheidung: Apple hat die Verfügbarkeit von **iOS 27** und **watchOS 27** ab dem 14. September 2026 angekündigt, aber die **neu gestaltete App Health ist etwas Eigenes und Separates**, noch nicht verfügbar. Apple schreibt ausdrücklich, sie komme \"later this year\" (im Laufe des Jahres 2026), zunächst nur auf US-Englisch, weitere Sprachen sollen folgen — kein genaues Datum genannt. Quelle: [Apple Newsroom — Apple advances health and fitness capabilities using Apple Intelligence](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/), 9. September 2026.",
        fr: "Première distinction importante, souvent confondue : Apple a annoncé la disponibilité d'**iOS 27** et **watchOS 27** à partir du 14 septembre 2026, mais l'**app Santé repensée est une chose différente et séparée**, pas encore disponible. Apple écrit explicitement qu'elle arrivera \"later this year\" (plus tard en 2026), d'abord en anglais américain uniquement, avec d'autres langues à suivre — aucune date précise communiquée. Source : [Apple Newsroom — Apple advances health and fitness capabilities using Apple Intelligence](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/), 9 septembre 2026.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Secondo quanto presentato da Apple, l'app riprogettata richiede un iPhone o iPad abilitato per Apple Intelligence per essere usata nel suo complesso — non solo per singole funzioni. Il requisito Apple Watch, invece, varia per funzione: **Health Age**, per esempio, richiede \"Apple Watch\" in generale, senza specificare un modello. Alcune funzioni dei nuovi sensori (vedi sotto) richiedono invece specificamente Series 12 o Ultra 4.",
        en: "According to what Apple has presented, the redesigned app requires an Apple Intelligence-enabled iPhone or iPad to be used at all — not just for individual features. The Apple Watch requirement, on the other hand, varies by feature: **Health Age**, for instance, requires \"Apple Watch\" in general, with no specific model named. Some new-sensor features (see below), instead, specifically require Series 12 or Ultra 4.",
        de: "Laut Apples Darstellung erfordert die neu gestaltete App insgesamt ein Apple-Intelligence-fähiges iPhone oder iPad — nicht nur für einzelne Funktionen. Die Apple-Watch-Anforderung variiert dagegen je nach Funktion: **Health Age** etwa erfordert \"Apple Watch\" im Allgemeinen, ohne ein bestimmtes Modell zu nennen. Manche Funktionen der neuen Sensoren (siehe unten) erfordern hingegen speziell Series 12 oder Ultra 4.",
        fr: "Selon ce qu'Apple a présenté, l'app repensée nécessite un iPhone ou iPad compatible Apple Intelligence pour être utilisée dans son ensemble — pas seulement pour certaines fonctions. L'exigence Apple Watch, elle, varie selon la fonction : **Health Age**, par exemple, nécessite \"Apple Watch\" en général, sans modèle précis indiqué. Certaines fonctions liées aux nouveaux capteurs (voir plus bas), en revanche, nécessitent spécifiquement une Series 12 ou Ultra 4.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Insights, Longevity, Health Age, Readiness: quattro cose diverse",
        en: "Insights, Longevity, Health Age, Readiness: four different things",
        de: "Insights, Longevity, Health Age, Readiness: vier verschiedene Dinge",
        fr: "Insights, Longevity, Health Age, Readiness : quatre choses différentes",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Sono termini che si sovrappongono nella comunicazione, ma indicano cose diverse. **Insights** è un tab per la vista quotidiana: mostra un riepilogo che si aggiorna nel corso della giornata su cuore, sonno, readiness, attività, parametri vitali e ciclo mestruale, più una sezione \"For You\" con suggerimenti personalizzati. **Longevity** è un tab separato per la vista di lungo periodo: analizza i dati longitudinali su cuore, sonno, benessere mentale, movimento, metabolismo, udito e nutrizione. **Health Age** è un punteggio dentro il tab Longevity, non un tab a sé: secondo Apple \"usa dati Apple Watch per mostrare come le tue metriche si posizionano rispetto alla tua età anagrafica\", con VO2 max, frequenza cardiaca a riposo, sonno e HRV come input, più dati di laboratorio che l'utente può aggiungere manualmente (A1c, LDL). **Readiness** è un punteggio giornaliero da 0 a 10 (Recover / Pace Yourself / Ready / Go For It), calcolato sul Watch analizzando attività recente, carico di allenamento, parametri vitali e punteggio del sonno, e mostrato poi nel tab Insights. Fonti: [Apple Newsroom — Apple advances health and fitness capabilities using Apple Intelligence](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/) e [Apple Newsroom — Introducing Apple Watch Series 12, with the all-new Health Sensing System](https://www.apple.com/newsroom/2026/09/introducing-apple-watch-series-12-with-the-all-new-health-sensing-system/), 9 settembre 2026.",
        en: "These terms overlap in Apple's communication, but they mean different things. **Insights** is a tab for the day-to-day view: it shows a summary that updates throughout the day covering heart, sleep, readiness, fitness, vitals, and cycle tracking, plus a \"For You\" section with personalized recommendations. **Longevity** is a separate tab for the long-term view: it analyzes longitudinal data on heart health, sleep, mental wellbeing, movement, metabolic health, hearing, and nutrition. **Health Age** is a score inside the Longevity tab, not a tab of its own: Apple describes it as using \"Apple Watch data to show how your metrics are tracking relative to your chronological age\", factoring in VO2 max, resting heart rate, sleep, and HRV, plus lab data users can add manually (A1c, LDL). **Readiness** is a daily 0-10 score (Recover / Pace Yourself / Ready / Go For It), calculated on the Watch from recent activity, training load, vitals, and sleep score, then surfaced in the Insights tab. Sources: [Apple Newsroom — Apple advances health and fitness capabilities using Apple Intelligence](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/) and [Apple Newsroom — Introducing Apple Watch Series 12, with the all-new Health Sensing System](https://www.apple.com/newsroom/2026/09/introducing-apple-watch-series-12-with-the-all-new-health-sensing-system/), September 9, 2026.",
        de: "Diese Begriffe überschneiden sich in der Kommunikation, bedeuten aber unterschiedliche Dinge. **Insights** ist ein Tab für die Tagesansicht: zeigt eine im Tagesverlauf aktualisierte Zusammenfassung zu Herz, Schlaf, Readiness, Fitness, Vitalwerten und Zyklus-Tracking, plus einen Bereich \"For You\" mit personalisierten Empfehlungen. **Longevity** ist ein separater Tab für die Langzeitansicht: analysiert longitudinale Daten zu Herzgesundheit, Schlaf, mentalem Wohlbefinden, Bewegung, Stoffwechselgesundheit, Hören und Ernährung. **Health Age** ist eine Punktzahl innerhalb des Longevity-Tabs, kein eigener Tab: Apple beschreibt sie als Nutzung von \"Apple-Watch-Daten, um zu zeigen, wie deine Werte im Verhältnis zu deinem kalendarischen Alter stehen\", mit VO2max, Ruhepuls, Schlaf und HRV als Eingaben, plus Labordaten, die Nutzer manuell hinzufügen können (A1c, LDL). **Readiness** ist eine tägliche Punktzahl von 0 bis 10 (Recover / Pace Yourself / Ready / Go For It), berechnet auf der Watch aus jüngster Aktivität, Trainingsbelastung, Vitalwerten und Schlafwert, dann im Insights-Tab angezeigt. Quellen: [Apple Newsroom — Apple advances health and fitness capabilities using Apple Intelligence](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/) und [Apple Newsroom — Introducing Apple Watch Series 12, with the all-new Health Sensing System](https://www.apple.com/newsroom/2026/09/introducing-apple-watch-series-12-with-the-all-new-health-sensing-system/), 9. September 2026.",
        fr: "Ces termes se chevauchent dans la communication d'Apple, mais désignent des choses différentes. **Insights** est un onglet pour la vue quotidienne : il affiche un résumé mis à jour tout au long de la journée sur le cœur, le sommeil, la readiness, l'activité, les constantes vitales et le suivi du cycle, plus une section \"For You\" avec des recommandations personnalisées. **Longevity** est un onglet séparé pour la vue à long terme : il analyse les données longitudinales sur la santé cardiaque, le sommeil, le bien-être mental, le mouvement, la santé métabolique, l'audition et la nutrition. **Health Age** est un score à l'intérieur de l'onglet Longevity, pas un onglet à part : Apple le décrit comme utilisant \"les données Apple Watch pour montrer comment vos indicateurs évoluent par rapport à votre âge civil\", en intégrant VO2 max, fréquence cardiaque au repos, sommeil et VFC, plus des données de laboratoire que l'utilisateur peut ajouter manuellement (HbA1c, LDL). **Readiness** est un score quotidien de 0 à 10 (Recover / Pace Yourself / Ready / Go For It), calculé sur la montre à partir de l'activité récente, de la charge d'entraînement, des constantes vitales et du score de sommeil, puis affiché dans l'onglet Insights. Sources : [Apple Newsroom — Apple advances health and fitness capabilities using Apple Intelligence](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/) et [Apple Newsroom — Introducing Apple Watch Series 12, with the all-new Health Sensing System](https://www.apple.com/newsroom/2026/09/introducing-apple-watch-series-12-with-the-all-new-health-sensing-system/), 9 septembre 2026.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Cosa richiede specificamente l'hardware nuovo",
        en: "What specifically requires the new hardware",
        de: "Was speziell die neue Hardware erfordert",
        fr: "Ce qui nécessite spécifiquement le nouveau matériel",
      },
      body: {
        it: "Series 12/Ultra 4 introducono un chip S11 che consente frequenza cardiaca ogni 5 secondi (invece di circa una lettura ogni 5 minuti) e HRV fino a 24 volte più frequente, oltre a una complicazione Passi in tempo reale sul quadrante. Readiness è presentata da Apple come introdotta insieme a questi due modelli, ma — a differenza di altre funzioni come Audio Intelligence, per cui Apple scrive esplicitamente \"richiede Apple Watch Series 12 o Ultra 4\" — non abbiamo trovato una frase altrettanto esplicita che vincoli Readiness a quell'hardware. È un'esclusività fortemente implicita, non dichiarata con la stessa formula netta.",
        en: "Series 12/Ultra 4 introduce an S11 chip that enables heart rate readings every 5 seconds (versus roughly one every 5 minutes before) and HRV up to 24 times more often, plus a real-time Steps complication on the watch face. Apple presents Readiness as introduced alongside these two models, but — unlike other features such as Audio Intelligence, for which Apple explicitly writes \"requires Apple Watch Series 12 or Ultra 4\" — we didn't find an equally explicit sentence tying Readiness to that hardware. It's a strongly implied exclusivity, not stated with the same clear-cut wording.",
        de: "Series 12/Ultra 4 führen einen S11-Chip ein, der Herzfrequenzmessungen alle 5 Sekunden (statt zuvor etwa alle 5 Minuten) und bis zu 24-mal häufigere HRV-Messungen ermöglicht, plus eine Echtzeit-Schritte-Komplikation auf dem Zifferblatt. Apple stellt Readiness als zusammen mit diesen beiden Modellen eingeführt dar, aber — anders als bei anderen Funktionen wie Audio Intelligence, für die Apple ausdrücklich schreibt \"erfordert Apple Watch Series 12 oder Ultra 4\" — haben wir keinen ebenso eindeutigen Satz gefunden, der Readiness an diese Hardware bindet. Es ist eine stark implizierte Exklusivität, nicht mit derselben klaren Formulierung erklärt.",
        fr: "Les Series 12/Ultra 4 introduisent une puce S11 qui permet une fréquence cardiaque toutes les 5 secondes (contre environ une mesure toutes les 5 minutes auparavant) et une VFC jusqu'à 24 fois plus fréquente, plus une complication Pas en temps réel sur le cadran. Apple présente Readiness comme introduite avec ces deux modèles, mais — contrairement à d'autres fonctions comme Audio Intelligence, pour laquelle Apple écrit explicitement \"nécessite Apple Watch Series 12 ou Ultra 4\" — nous n'avons pas trouvé de phrase aussi explicite liant Readiness à ce matériel. Il s'agit d'une exclusivité fortement sous-entendue, non déclarée avec la même formule nette.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa non sappiamo ancora",
        en: "What we still don't know",
        de: "Was wir noch nicht wissen",
        fr: "Ce que l'on ne sait pas encore",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Apple, parlando del tab Longevity nel suo insieme, scrive che l'utente può vedere \"cosa influenza la sua salute di lungo periodo sulla base di dati da iPhone, Apple Watch, AirPods e referti clinici, oltre che da app e dispositivi di terze parti\". È l'unica menzione esplicita di dati di terze parti in tutto l'annuncio — ma è riferita alla scheda Longevity in generale, non specificamente al calcolo dell'algoritmo di Health Age, che nello stesso comunicato viene descritto come basato su \"dati Apple Watch\". Apple non chiarisce il collegamento tra le due frasi: **citare i dati di terze parti nella visione complessiva di Longevity non prova che quei dati alimentino Health Age, Readiness o ogni altro algoritmo specifico** — è un punto che resta esplicitamente aperto, non un fatto risolto in un senso o nell'altro. L'unica eccezione dichiarata con precisione riguarda il test per stimare il VO2 max, per cui Apple ammette esplicitamente anche \"un dispositivo di terze parti per la rilevazione della frequenza cardiaca\", oltre ad Apple Watch e AirPods Pro 3.",
        en: "Speaking about the Longevity tab as a whole, Apple writes that users can see \"what's shaping their long-term health based on data from iPhone, Apple Watch, AirPods, and clinical health records, as well as third-party apps and devices.\" It's the only explicit mention of third-party data in the entire announcement — but it refers to the Longevity tab in general, not specifically to how the Health Age algorithm is calculated, which the same announcement describes as based on \"Apple Watch data.\" Apple doesn't clarify the link between the two sentences: **citing third-party data in the overall Longevity vision doesn't prove that data feeds Health Age, Readiness, or any other specific algorithm** — this stays an explicitly open question, not a fact resolved either way. The one precisely stated exception concerns the VO2 max estimate test, for which Apple explicitly allows \"a third-party heart rate sensing device\" too, alongside Apple Watch and AirPods Pro 3.",
        de: "Zum Longevity-Tab insgesamt schreibt Apple, Nutzer könnten sehen, \"was ihre langfristige Gesundheit prägt, basierend auf Daten von iPhone, Apple Watch, AirPods und klinischen Gesundheitsdaten sowie von Drittanbieter-Apps und -Geräten\". Das ist die einzige explizite Erwähnung von Drittanbieterdaten in der gesamten Ankündigung — sie bezieht sich aber auf den Longevity-Tab im Allgemeinen, nicht speziell auf die Berechnung des Health-Age-Algorithmus, der in derselben Ankündigung als auf \"Apple-Watch-Daten\" basierend beschrieben wird. Apple klärt den Zusammenhang zwischen den beiden Sätzen nicht: **Drittanbieterdaten in der Gesamtvision von Longevity zu erwähnen, beweist nicht, dass diese Daten in Health Age, Readiness oder einen anderen spezifischen Algorithmus einfließen** — dieser Punkt bleibt ausdrücklich offen, keine in die eine oder andere Richtung geklärte Tatsache. Die einzige präzise genannte Ausnahme betrifft den Test zur Schätzung des VO2max, für den Apple ausdrücklich auch \"ein Herzfrequenzmessgerät eines Drittanbieters\" zulässt, neben Apple Watch und AirPods Pro 3.",
        fr: "En parlant de l'onglet Longevity dans son ensemble, Apple écrit que l'utilisateur peut voir \"ce qui façonne sa santé à long terme à partir de données provenant de l'iPhone, de l'Apple Watch, des AirPods et de dossiers médicaux cliniques, ainsi que d'applications et d'appareils tiers\". C'est la seule mention explicite de données tierces dans toute l'annonce — mais elle concerne l'onglet Longevity en général, pas spécifiquement le calcul de l'algorithme Health Age, décrit dans la même annonce comme basé sur des \"données Apple Watch\". Apple ne clarifie pas le lien entre ces deux phrases : **citer les données tierces dans la vision globale de Longevity ne prouve pas que ces données alimentent Health Age, Readiness ou tout autre algorithme spécifique** — ce point reste explicitement ouvert, ce n'est pas un fait tranché dans un sens ou dans l'autre. La seule exception précisément énoncée concerne le test d'estimation du VO2 max, pour lequel Apple admet explicitement aussi \"un dispositif tiers de mesure de la fréquence cardiaque\", en plus de l'Apple Watch et des AirPods Pro 3.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Sul fronte tecnico, la documentazione sviluppatore di Apple non aiuta ancora a sciogliere il dubbio: consultando l'indice completo dei tipi HealthKit (`HKQuantityTypeIdentifier` e `HKCategoryTypeIdentifier`) e il changelog ufficiale l'11 settembre 2026, **nessun identificatore per Readiness, Health Age, il tab Longevity o lo Sleep Score risulta presente**. L'ultima voce del changelog HealthKit resta datata giugno 2026. Un'eccezione parziale: è comparso un nuovo identificatore reale, `heartRateVariabilityRMSSD`, ma senza alcuna descrizione testuale pubblicata — dichiarato nell'SDK, non ancora documentato in prosa, e non è chiaro se corrisponda a quella che Apple chiama \"Recovery HRV\". Fonte: [Apple Developer — HealthKit, indice identificatori](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier) e [changelog HealthKit](https://developer.apple.com/documentation/updates/healthkit), consultati l'11 settembre 2026. In assenza di una API pubblica, non c'è oggi alcuna prova che Readiness o Health Age possano essere letti da un'app di terze parti — né che non lo saranno mai: è uno stato di cose da verificare quando (e se) arriverà una documentazione più completa, non un fatto su cui scommettere ora.",
        en: "On the technical side, Apple's developer documentation doesn't yet resolve the doubt: checking the full index of HealthKit types (`HKQuantityTypeIdentifier` and `HKCategoryTypeIdentifier`) and the official changelog on September 11, 2026, **no identifier for Readiness, Health Age, the Longevity tab, or Sleep Score is present**. The latest HealthKit changelog entry is still dated June 2026. One partial exception: a new real identifier, `heartRateVariabilityRMSSD`, has appeared, but with no published description — declared in the SDK, not yet documented in prose, and it's unclear whether it corresponds to what Apple calls \"Recovery HRV.\" Source: [Apple Developer — HealthKit, type index](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier) and [HealthKit changelog](https://developer.apple.com/documentation/updates/healthkit), checked September 11, 2026. Without a public API, there's currently no evidence that Readiness or Health Age can be read by a third-party app — nor that they never will be: it's a state of affairs to check again once (and if) fuller documentation arrives, not a fact to bet on now.",
        de: "Auf technischer Seite löst Apples Entwicklerdokumentation den Zweifel noch nicht: Beim Abgleich mit dem vollständigen Index der HealthKit-Typen (`HKQuantityTypeIdentifier` und `HKCategoryTypeIdentifier`) und dem offiziellen Changelog am 11. September 2026 **ist kein Identifier für Readiness, Health Age, den Longevity-Tab oder Sleep Score vorhanden**. Der letzte Eintrag im HealthKit-Changelog ist noch immer aus dem Juni 2026 datiert. Eine teilweise Ausnahme: Ein neuer, echter Identifier ist aufgetaucht, `heartRateVariabilityRMSSD`, jedoch ohne veröffentlichte Beschreibung — im SDK deklariert, noch nicht in Textform dokumentiert, und es ist unklar, ob er dem entspricht, was Apple \"Recovery HRV\" nennt. Quelle: [Apple Developer — HealthKit, Identifier-Index](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier) und [HealthKit-Changelog](https://developer.apple.com/documentation/updates/healthkit), abgerufen am 11. September 2026. Ohne öffentliche API gibt es derzeit keinen Beleg dafür, dass Readiness oder Health Age von einer Drittanbieter-App gelesen werden können — ebenso wenig dafür, dass dies nie der Fall sein wird: Dieser Stand ist zu prüfen, sobald (und falls) eine vollständigere Dokumentation erscheint, keine Tatsache, auf die man sich jetzt verlassen sollte.",
        fr: "Sur le plan technique, la documentation développeur d'Apple ne lève pas encore le doute : en consultant l'index complet des types HealthKit (`HKQuantityTypeIdentifier` et `HKCategoryTypeIdentifier`) et le changelog officiel le 11 septembre 2026, **aucun identifiant pour Readiness, Health Age, l'onglet Longevity ou le Sleep Score n'est présent**. La dernière entrée du changelog HealthKit reste datée de juin 2026. Une exception partielle : un nouvel identifiant réel est apparu, `heartRateVariabilityRMSSD`, mais sans aucune description publiée — déclaré dans le SDK, pas encore documenté en prose, et on ne sait pas s'il correspond à ce qu'Apple appelle \"Recovery HRV\". Source : [Apple Developer — HealthKit, index des identifiants](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier) et [changelog HealthKit](https://developer.apple.com/documentation/updates/healthkit), consultés le 11 septembre 2026. En l'absence d'API publique, il n'existe aujourd'hui aucune preuve que Readiness ou Health Age puissent être lus par une application tierce — ni qu'ils ne le seront jamais : c'est un état des choses à revérifier quand (et si) une documentation plus complète arrivera, pas un fait sur lequel parier maintenant.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa fa già FitMesh oggi, verificato nel codice della 3.10.0",
        en: "What FitMesh already does today, verified in the 3.10.0 code",
        de: "Was FitMesh heute schon tut, verifiziert im Code von 3.10.0",
        fr: "Ce que FitMesh fait déjà aujourd'hui, vérifié dans le code de la 3.10.0",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Diversamente dalle funzioni annunciate ma non ancora rilasciate, questo è verificabile: nella release pubblica 3.10.0, su iPhone FitMesh legge — previa autorizzazione dell'utente — i campioni dei tipi HealthKit supportati (passi, frequenza cardiaca, sonno, SpO2, calorie, peso e altri), senza limitarli alla sola sorgente Apple Watch: la lettura non filtra per sorgente. Quando arbitra tra più fonti riconosce esplicitamente decine di nomi sorgente di app e dispositivi terzi (Samsung Health, Garmin, Fitbit, Amazfit, Huawei, Polar, Oura, Whoop, Suunto, l'anello Colmi, e altri) — non un collegamento diretto di FitMesh con quei produttori, ma dati che quelle stesse app scrivono in Apple Salute e che FitMesh poi legge da lì. Per il dettaglio completo del meccanismo, incluso cosa il ponte NON fa, vedi [i dati dell'anello smart in Apple Salute](/it/blog/dati-anello-smart-apple-salute).",
        en: "Unlike features that have been announced but not yet released, this is verifiable: in the public 3.10.0 release, on iPhone FitMesh reads — with the user's authorization — samples of the supported HealthKit types (steps, heart rate, sleep, SpO2, calories, weight, and others), without limiting itself to the Apple Watch source: reading doesn't filter by source. When arbitrating between multiple sources, it explicitly recognizes dozens of third-party app and device source names (Samsung Health, Garmin, Fitbit, Amazfit, Huawei, Polar, Oura, Whoop, Suunto, the Colmi ring, and others) — not a direct connection between FitMesh and those manufacturers, but data those same apps write into Apple Health, which FitMesh then reads from there. For the full mechanism, including what the bridge does NOT do, see [smart ring data in Apple Health](/en/blog/dati-anello-smart-apple-salute).",
        de: "Anders als bei angekündigten, aber noch nicht veröffentlichten Funktionen ist dies überprüfbar: In der öffentlichen Version 3.10.0 liest FitMesh auf dem iPhone — nach Zustimmung der Nutzerin oder des Nutzers — Messwerte der unterstützten HealthKit-Typen (Schritte, Herzfrequenz, Schlaf, SpO2, Kalorien, Gewicht und weitere), ohne sich auf die Apple-Watch-Quelle zu beschränken: Das Lesen filtert nicht nach Quelle. Bei der Abwägung mehrerer Quellen erkennt es ausdrücklich Dutzende Quellennamen von Drittanbieter-Apps und -Geräten (Samsung Health, Garmin, Fitbit, Amazfit, Huawei, Polar, Oura, Whoop, Suunto, den Colmi-Ring und weitere) — keine direkte Verbindung zwischen FitMesh und diesen Herstellern, sondern Daten, die dieselben Apps in Apple Health schreiben und die FitMesh von dort liest. Den vollständigen Mechanismus, einschließlich dessen, was die Brücke NICHT tut, findest du unter [Smart-Ring-Daten in Apple Health](/de/blog/dati-anello-smart-apple-salute).",
        fr: "Contrairement aux fonctions annoncées mais pas encore publiées, ceci est vérifiable : dans la version publique 3.10.0, sur iPhone, FitMesh lit — avec l'autorisation de l'utilisateur — des échantillons des types HealthKit pris en charge (pas, fréquence cardiaque, sommeil, SpO2, calories, poids et autres), sans se limiter à la seule source Apple Watch : la lecture ne filtre pas par source. Lors de l'arbitrage entre plusieurs sources, il reconnaît explicitement des dizaines de noms de sources d'applications et d'appareils tiers (Samsung Health, Garmin, Fitbit, Amazfit, Huawei, Polar, Oura, Whoop, Suunto, la bague Colmi, et d'autres) — pas une connexion directe entre FitMesh et ces fabricants, mais des données que ces mêmes applications écrivent dans Apple Santé, que FitMesh lit ensuite depuis là. Pour le mécanisme complet, y compris ce que le pont ne fait PAS, voir [les données de la bague connectée dans Apple Santé](/fr/blog/dati-anello-smart-apple-salute).",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "In scrittura, sempre su attivazione esplicita (spenta di default) e mai in tempo reale, FitMesh può inviare verso Apple Salute passi, distanza e calorie attive (solo la quota mancante rispetto a quanto già presente, mai una somma), più frequenza cardiaca a riposo, SpO2 e peso (ma solo se quel giorno non esiste già un dato da un'altra fonte). **Non scrive mai HRV** — il cloud calcola RMSSD mentre HealthKit su iOS espone SDNN, una metrica diversa, e scriverla darebbe un valore sbagliato — e **il sonno è oggi disattivato** in attesa di correggere un difetto noto. Non c'è backfill storico in scrittura: solo il giorno corrente. Per come esportare invece i tuoi dati DA Apple Salute (XML nativo, CSV per il medico, o dashboard web), vedi [come esportare i dati di Apple Health](/it/blog/how-to-export-apple-health-data).",
        en: "On the writing side, always on explicit opt-in (off by default) and never in real time, FitMesh can send steps, distance, and active calories to Apple Health (only the gap missing from what's already there, never a sum), plus resting heart rate, SpO2, and weight (but only if no data already exists from another source that day). **It never writes HRV** — the cloud calculates RMSSD while HealthKit on iOS exposes SDNN, a different metric, and writing it would produce a wrong value — and **sleep is currently disabled** pending a fix for a known issue. There's no historical write backfill: only the current day. For how to export your data FROM Apple Health instead (native XML, CSV for your doctor, or a web dashboard), see [how to export Apple Health data](/en/blog/how-to-export-apple-health-data).",
        de: "Beim Schreiben, immer nur nach expliziter Aktivierung (standardmäßig aus) und nie in Echtzeit, kann FitMesh Schritte, Distanz und aktive Kalorien an Apple Health senden (nur die fehlende Differenz zum bereits Vorhandenen, nie eine Summe), außerdem Ruheherzfrequenz, SpO2 und Gewicht (aber nur, wenn an diesem Tag noch keine Daten aus einer anderen Quelle vorliegen). **HRV wird nie geschrieben** — die Cloud berechnet RMSSD, während HealthKit auf iOS SDNN liefert, eine andere Kennzahl, deren Schreiben einen falschen Wert ergeben würde — und **Schlaf ist derzeit deaktiviert**, bis ein bekannter Fehler behoben ist. Es gibt kein historisches Schreib-Backfill: nur der aktuelle Tag. Wie du umgekehrt deine Daten AUS Apple Health exportierst (natives XML, CSV für deinen Arzt oder ein Web-Dashboard), erfährst du unter [Apple-Health-Daten exportieren](/de/blog/how-to-export-apple-health-data).",
        fr: "Côté écriture, toujours sur activation explicite (désactivée par défaut) et jamais en temps réel, FitMesh peut envoyer vers Apple Santé les pas, la distance et les calories actives (seulement la part manquante par rapport à ce qui existe déjà, jamais une somme), plus la fréquence cardiaque au repos, la SpO2 et le poids (mais seulement si aucune donnée d'une autre source n'existe déjà ce jour-là). **Il n'écrit jamais la VFC** — le cloud calcule le RMSSD alors que HealthKit sur iOS expose le SDNN, une métrique différente, et l'écrire donnerait une valeur erronée — et **le sommeil est actuellement désactivé** en attendant la correction d'un problème connu. Il n'y a pas de rattrapage historique en écriture : seulement le jour en cours. Pour savoir comment exporter au contraire vos données DEPUIS Apple Santé (XML natif, CSV pour votre médecin, ou tableau de bord web), voir [comment exporter les données Apple Health](/fr/blog/how-to-export-apple-health-data).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Tre scenari pratici",
        en: "Three practical scenarios",
        de: "Drei praktische Szenarien",
        fr: "Trois scénarios pratiques",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Solo Apple** (iPhone + Apple Watch, nessun altro dispositivo): questo è lo scenario in cui la nuova app Salute, quando arriverà, probabilmente coprirà già gran parte di quello che serve nativamente — Insights, Readiness, Health Age nascono proprio per questo caso d'uso. È onestamente lo scenario in cui FitMesh aggiunge meno.",
          "**Ecosistema misto** (Apple insieme a un dispositivo non-Apple — un Garmin, un Samsung Galaxy Watch, un anello smart): qui la differenza resta netta. L'app Salute riprogettata, per quanto presentato finora, analizza i tuoi dati per darti insight — non descrive un meccanismo per unire e deduplicare fonti eterogenee nello stesso modo in cui lo fa FitMesh oggi.",
          "**Cambio piattaforma** (per esempio da Android a iPhone, o viceversa): lo storico che FitMesh ha già raccolto resta legato al tuo account, non al dispositivo fisico — indipendentemente da quale app Salute nativa userai dopo il cambio.",
        ],
        en: [
          "**Apple-only** (iPhone + Apple Watch, no other device): this is the scenario where the new Health app, once it arrives, will likely already cover most of what you need natively — Insights, Readiness, and Health Age exist specifically for this use case. Honestly, this is the scenario where FitMesh adds the least.",
          "**Mixed ecosystem** (Apple alongside a non-Apple device — a Garmin, a Samsung Galaxy Watch, a smart ring): here the difference stays clear. The redesigned Health app, based on what's been presented so far, analyzes your data to give you insights — it doesn't describe a mechanism for bringing together and deduplicating heterogeneous sources the way FitMesh does today.",
          "**Switching platforms** (for example from Android to iPhone, or the other way around): the history FitMesh has already collected stays tied to your account, not to the physical device — regardless of which native Health app you use after the switch.",
        ],
        de: [
          "**Nur Apple** (iPhone + Apple Watch, kein weiteres Gerät): Das ist das Szenario, in dem die neue App Health, sobald sie verfügbar ist, vermutlich bereits nativ den Großteil dessen abdeckt, was du brauchst — Insights, Readiness und Health Age sind genau für diesen Anwendungsfall gedacht. Das ist ehrlich gesagt das Szenario, in dem FitMesh am wenigsten hinzufügt.",
          "**Gemischtes Ökosystem** (Apple zusammen mit einem Nicht-Apple-Gerät — ein Garmin, eine Samsung Galaxy Watch, ein Smart Ring): Hier bleibt der Unterschied klar. Die neu gestaltete App Health analysiert, nach bisherigem Stand, deine Daten, um dir Einblicke zu geben — sie beschreibt keinen Mechanismus, um heterogene Quellen so zusammenzuführen und zu deduplizieren, wie FitMesh es heute tut.",
          "**Plattformwechsel** (zum Beispiel von Android zu iPhone oder umgekehrt): Der Verlauf, den FitMesh bereits gesammelt hat, bleibt an dein Konto gebunden, nicht an das physische Gerät — unabhängig davon, welche native App Health du nach dem Wechsel nutzt.",
        ],
        fr: [
          "**Uniquement Apple** (iPhone + Apple Watch, aucun autre appareil) : c'est le scénario où la nouvelle app Santé, une fois disponible, couvrira probablement déjà nativement l'essentiel de ce dont vous avez besoin — Insights, Readiness et Health Age existent précisément pour ce cas d'usage. C'est honnêtement le scénario où FitMesh apporte le moins.",
          "**Écosystème mixte** (Apple aux côtés d'un appareil non-Apple — une Garmin, une Samsung Galaxy Watch, une bague connectée) : ici, la différence reste nette. L'app Santé repensée, d'après ce qui a été présenté jusqu'ici, analyse vos données pour vous donner des insights — elle ne décrit pas de mécanisme pour réunir et dédupliquer des sources hétérogènes de la même façon que le fait FitMesh aujourd'hui.",
          "**Changement de plateforme** (par exemple d'Android vers iPhone, ou l'inverse) : l'historique déjà collecté par FitMesh reste lié à votre compte, pas à l'appareil physique — quelle que soit l'app Santé native que vous utiliserez après le changement.",
        ],
      },
    },
    {
      type: "table",
      caption: {
        it: "Apple Health annunciata, FitMesh 3.10.0, e cosa resta da vedere",
        en: "Apple Health as announced, FitMesh 3.10.0, and what's still unknown",
        de: "Apple Health wie angekündigt, FitMesh 3.10.0, und was noch offen ist",
        fr: "Apple Santé telle qu'annoncée, FitMesh 3.10.0, et ce qui reste inconnu",
      },
      headers: {
        it: ["Aspetto", "Apple Health (annunciata)", "FitMesh 3.10.0", "Non ancora noto"],
        en: ["Aspect", "Apple Health (announced)", "FitMesh 3.10.0", "Not yet known"],
        de: ["Aspekt", "Apple Health (angekündigt)", "FitMesh 3.10.0", "Noch nicht bekannt"],
        fr: ["Aspect", "Apple Santé (annoncée)", "FitMesh 3.10.0", "Pas encore connu"],
      },
      rows: [
        {
          it: ["Disponibilità", "Annunciata il 9/9/2026, non ancora pubblica", "Già in release pubblica", "Data di lancio precisa"],
          en: ["Availability", "Announced 9/9/2026, not yet public", "Already in public release", "Precise launch date"],
          de: ["Verfügbarkeit", "Angekündigt am 9.9.2026, noch nicht öffentlich", "Bereits in öffentlicher Version", "Genaues Startdatum"],
          fr: ["Disponibilité", "Annoncée le 9/9/2026, pas encore publique", "Déjà en version publique", "Date de lancement précise"],
        },
        {
          it: ["Punteggi Readiness / Health Age", "Presentati, solo nell'app Salute nativa", "Non letti, nessun supporto dichiarato", "Se e quando arriverà un'API pubblica"],
          en: ["Readiness / Health Age scores", "Presented, native Health app only", "Not read, no support claimed", "Whether/when a public API arrives"],
          de: ["Readiness-/Health-Age-Punktzahlen", "Vorgestellt, nur in der nativen App Health", "Nicht gelesen, kein Support beansprucht", "Ob/wann eine öffentliche API kommt"],
          fr: ["Scores Readiness / Health Age", "Présentés, app Santé native uniquement", "Non lus, aucune prise en charge revendiquée", "Si/quand une API publique arrivera"],
        },
        {
          it: ["Dati da dispositivi non-Apple", "Nessun meccanismo di unione descritto finora", "Letti da HealthKit se già presenti lì, arbitrati tra più fonti", "Se entreranno nei punteggi nativi"],
          en: ["Data from non-Apple devices", "No unification mechanism described so far", "Read from HealthKit when already there, arbitrated across sources", "Whether it will feed native scores"],
          de: ["Daten von Nicht-Apple-Geräten", "Bisher kein Zusammenführungsmechanismus beschrieben", "Aus HealthKit gelesen, wenn dort vorhanden, quellenübergreifend abgewogen", "Ob sie in native Punktzahlen einfließen"],
          fr: ["Données d'appareils non-Apple", "Aucun mécanisme d'unification décrit jusqu'ici", "Lues depuis HealthKit si déjà présentes, arbitrées entre sources", "Si elles alimenteront les scores natifs"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il verdetto, in quattro strati",
        en: "The verdict, in four layers",
        de: "Das Fazit, in vier Ebenen",
        fr: "Le verdict, en quatre niveaux",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Separando cosa Apple ha annunciato, cosa è già documentato nelle API, cosa non sappiamo ancora, e cosa FitMesh fa davvero oggi: **una volta disponibile, Apple Health diventerà molto più completa e potrà ridurre il bisogno di alcune app di sola analisi. Non sostituirà però automaticamente gli strumenti che collegano dispositivi, fonti e piattaforme differenti.** Il primo strato (l'annuncio) è ambizioso ma non ancora verificabile nell'uso pubblico. Il secondo strato (le API): l'11 settembre 2026 non abbiamo identificato nessuna API HealthKit pubblica documentata per Readiness o Health Age, e FitMesh non ne dichiara oggi il supporto. Il terzo strato (le domande aperte) riguarda soprattutto se e come i dati di dispositivi non-Apple entreranno in questi punteggi: non lo sappiamo, e non lo scriviamo come se lo sapessimo. Il quarto strato — l'unico verificabile con certezza oggi — riguarda i ruoli: Apple Salute è l'archivio e l'analisi dell'ecosistema Apple dei dati che raggiungono HealthKit; FitMesh, nella sua release pubblica, è una dashboard cross-platform legata all'account che unisce già fonti Apple e non-Apple in un solo posto, con un ponte opzionale verso alcune metriche supportate. Sono ruoli distinti, non necessariamente in competizione.",
        en: "Separating what Apple has announced, what's already documented in the API, what we still don't know, and what FitMesh actually does today: **once available, Apple Health will become much more capable and may reduce the need for some analysis-only apps. It won't, however, automatically replace tools that connect different devices, sources, and platforms.** The first layer (the announcement) is ambitious but not yet verifiable in public use. The second layer (the API): as of September 11, 2026 we identified no documented public HealthKit API for Readiness or Health Age, and FitMesh doesn't claim support for either today. The third layer (open questions) is mostly about whether and how data from non-Apple devices will feed into these scores: we don't know, and we're not writing as if we did. The fourth layer — the only one verifiable with certainty today — is about roles: Apple Health is the Apple ecosystem's archive and analysis of data that reaches HealthKit; FitMesh, in its public release, is a cross-platform, account-based dashboard that already brings Apple and non-Apple sources together in one place, with an optional bridge to some supported metrics. These are distinct roles, not necessarily in competition.",
        de: "Wenn man trennt, was Apple angekündigt hat, was in der API bereits dokumentiert ist, was wir noch nicht wissen, und was FitMesh heute tatsächlich tut: **sobald verfügbar, wird Apple Health deutlich leistungsfähiger und kann den Bedarf an manchen reinen Analyse-Apps verringern. Sie wird aber nicht automatisch Werkzeuge ersetzen, die unterschiedliche Geräte, Quellen und Plattformen verbinden.** Die erste Ebene (die Ankündigung) ist ambitioniert, aber im öffentlichen Einsatz noch nicht überprüfbar. Die zweite Ebene (die API): Mit Stand 11. September 2026 haben wir keine dokumentierte öffentliche HealthKit-API für Readiness oder Health Age identifiziert, und FitMesh erhebt heute für keines von beiden einen Unterstützungsanspruch. Die dritte Ebene (offene Fragen) betrifft vor allem, ob und wie Daten von Nicht-Apple-Geräten in diese Punktzahlen einfließen: Wir wissen es nicht, und wir schreiben nicht so, als wüssten wir es. Die vierte Ebene — die einzige, die heute mit Sicherheit überprüfbar ist — betrifft die Rollen: Apple Health ist das Archiv und die Analyse des Apple-Ökosystems für Daten, die HealthKit erreichen; FitMesh ist in seiner öffentlichen Version ein kontobasiertes, plattformübergreifendes Dashboard, das bereits Apple- und Nicht-Apple-Quellen an einem Ort zusammenführt, mit einer optionalen Brücke zu einigen unterstützten Messwerten. Das sind eigenständige Rollen, nicht zwangsläufig in Konkurrenz.",
        fr: "En séparant ce qu'Apple a annoncé, ce qui est déjà documenté dans l'API, ce que l'on ne sait pas encore, et ce que FitMesh fait réellement aujourd'hui : **une fois disponible, Apple Santé deviendra beaucoup plus complète et pourra réduire le besoin de certaines applications de simple analyse. Elle ne remplacera cependant pas automatiquement les outils qui relient différents appareils, sources et plateformes.** Le premier niveau (l'annonce) est ambitieux mais pas encore vérifiable en usage public. Le deuxième niveau (l'API) : au 11 septembre 2026, nous n'avons identifié aucune API HealthKit publique documentée pour Readiness ou Health Age, et FitMesh ne revendique aujourd'hui la prise en charge d'aucun des deux. Le troisième niveau (les questions ouvertes) concerne surtout si et comment les données d'appareils non-Apple alimenteront ces scores : nous ne le savons pas, et nous n'écrivons pas comme si nous le savions. Le quatrième niveau — le seul vérifiable avec certitude aujourd'hui — concerne les rôles : Apple Santé est l'archive et l'analyse de l'écosystème Apple pour les données qui atteignent HealthKit ; FitMesh, dans sa version publique, est un tableau de bord multiplateforme lié au compte qui réunit déjà des sources Apple et non-Apple au même endroit, avec un pont optionnel vers certaines mesures prises en charge. Ce sont des rôles distincts, pas nécessairement en concurrence.",
      },
    },
    {
      type: "fitmesh-editorial-cta",
      contentCluster: "fitmesh_vs_alternatives",
      placement: "article_end",
      title: {
        it: "Usi già più di un dispositivo?",
        en: "Already using more than one device?",
        de: "Nutzt du bereits mehr als ein Gerät?",
        fr: "Vous utilisez déjà plus d'un appareil ?",
      },
      body: {
        it: "FitMesh unisce oggi, in modo verificabile, i dati di Apple Salute con quelli di dispositivi non-Apple in un'unica dashboard — indipendentemente da quando arriverà la nuova app Salute riprogettata.",
        en: "FitMesh already brings together, in a verifiable way, data from Apple Health and non-Apple devices into a single dashboard — regardless of when the redesigned Health app arrives.",
        de: "FitMesh führt schon heute nachweisbar Daten aus Apple Health und Nicht-Apple-Geräten in einem einzigen Dashboard zusammen — unabhängig davon, wann die neu gestaltete App Health kommt.",
        fr: "FitMesh réunit déjà, de manière vérifiable, les données d'Apple Santé et d'appareils non-Apple dans un seul tableau de bord — indépendamment de la date d'arrivée de la nouvelle app Santé repensée.",
      },
      benefits: {
        it: [
          "Legge, previa autorizzazione, i campioni dei tipi HealthKit supportati — non solo quelli di Apple Watch",
          "Può scrivere alcune metriche verso Apple Salute, su attivazione esplicita",
          "Storico legato al tuo account, non al dispositivo fisico",
        ],
        en: [
          "Reads, with authorization, samples of the supported HealthKit types — not just Apple Watch ones",
          "Can write some metrics to Apple Health, on explicit opt-in",
          "History tied to your account, not to the physical device",
        ],
        de: [
          "Liest, nach Zustimmung, Messwerte der unterstützten HealthKit-Typen — nicht nur die der Apple Watch",
          "Kann bei expliziter Aktivierung einige Messwerte nach Apple Health schreiben",
          "Verlauf an dein Konto gebunden, nicht an das physische Gerät",
        ],
        fr: [
          "Lit, avec autorisation, des échantillons des types HealthKit pris en charge — pas seulement ceux de l'Apple Watch",
          "Peut écrire certaines mesures vers Apple Santé, sur activation explicite",
          "Historique lié à votre compte, pas à l'appareil physique",
        ],
      },
      secondaryHref: {
        it: "/it/sync/apple-health",
        en: "/en/sync/apple-health",
        de: "/de/sync/apple-health",
        fr: "/fr/sync/apple-health",
      },
      secondaryLabel: {
        it: "FitMesh e Apple Salute",
        en: "FitMesh and Apple Health",
        de: "FitMesh und Apple Health",
        fr: "FitMesh et Apple Santé",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "La nuova app Salute è già disponibile?",
        en: "Is the new Health app available yet?",
        de: "Ist die neue App Health schon verfügbar?",
        fr: "La nouvelle app Santé est-elle déjà disponible ?",
      },
      a: {
        it: "No. Apple l'ha annunciata il 9 settembre 2026 e ha dichiarato che arriverà più avanti nel 2026, inizialmente solo in inglese statunitense — separatamente da iOS 27 e watchOS 27, la cui disponibilità Apple ha annunciato a partire dal 14 settembre 2026. Non è stata comunicata una data precisa per la nuova app Salute.",
        en: "No. Apple announced it on September 9, 2026, and stated it's coming later in 2026, initially in U.S. English only — separately from iOS 27 and watchOS 27, whose availability Apple announced starting September 14, 2026. No precise date has been given for the new Health app.",
        de: "Nein. Apple hat sie am 9. September 2026 angekündigt und erklärt, sie komme später im Jahr 2026, zunächst nur auf US-Englisch — getrennt von iOS 27 und watchOS 27, deren Verfügbarkeit Apple ab dem 14. September 2026 angekündigt hat. Für die neue App Health wurde kein genaues Datum genannt.",
        fr: "Non. Apple l'a annoncée le 9 septembre 2026 et a déclaré qu'elle arriverait plus tard en 2026, d'abord en anglais américain uniquement — séparément d'iOS 27 et watchOS 27, dont Apple a annoncé la disponibilité à partir du 14 septembre 2026. Aucune date précise n'a été communiquée pour la nouvelle app Santé.",
      },
    },
    {
      q: {
        it: "Serve un Apple Watch Series 12 o Ultra 4 per usarla?",
        en: "Do I need an Apple Watch Series 12 or Ultra 4 to use it?",
        de: "Brauche ich eine Apple Watch Series 12 oder Ultra 4, um sie zu nutzen?",
        fr: "Faut-il une Apple Watch Series 12 ou Ultra 4 pour l'utiliser ?",
      },
      a: {
        it: "Non per l'app nel suo complesso: serve un iPhone/iPad abilitato per Apple Intelligence, ma Health Age, per esempio, richiede solo \"Apple Watch\" in generale. Alcune funzioni legate ai nuovi sensori (frequenza cardiaca ogni 5 secondi, HRV più frequente, la complicazione Passi) richiedono invece specificamente Series 12 o Ultra 4.",
        en: "Not for the app as a whole: you need an Apple Intelligence-enabled iPhone/iPad, but Health Age, for instance, only requires \"Apple Watch\" in general. Some features tied to the new sensors (5-second heart rate, more frequent HRV, the Steps complication) do specifically require Series 12 or Ultra 4.",
        de: "Nicht für die App insgesamt: Du brauchst ein Apple-Intelligence-fähiges iPhone/iPad, aber Health Age zum Beispiel erfordert nur \"Apple Watch\" im Allgemeinen. Einige Funktionen im Zusammenhang mit den neuen Sensoren (Herzfrequenz alle 5 Sekunden, häufigere HRV, die Schritte-Komplikation) erfordern hingegen speziell Series 12 oder Ultra 4.",
        fr: "Pas pour l'app dans son ensemble : il faut un iPhone/iPad compatible Apple Intelligence, mais Health Age, par exemple, ne nécessite qu'une \"Apple Watch\" en général. Certaines fonctions liées aux nouveaux capteurs (fréquence cardiaque toutes les 5 secondes, VFC plus fréquente, la complication Pas) nécessitent en revanche spécifiquement une Series 12 ou Ultra 4.",
      },
    },
    {
      q: {
        it: "FitMesh potrà leggere Readiness o Health Age?",
        en: "Will FitMesh be able to read Readiness or Health Age?",
        de: "Wird FitMesh Readiness oder Health Age auslesen können?",
        fr: "FitMesh pourra-t-il lire Readiness ou Health Age ?",
      },
      a: {
        it: "Non ad oggi. Alla verifica dell'11 settembre 2026, la documentazione sviluppatore di Apple non elenca nessuna API HealthKit pubblica per queste due metriche. Se e quando Apple la pubblicherà, andrà verificato di nuovo — non lo diamo per scontato ora.",
        en: "Not as of today. As of the September 11, 2026 check, Apple's developer documentation lists no public HealthKit API for either metric. If and when Apple publishes one, it will need to be checked again — we're not assuming it now.",
        de: "Nicht mit Stand heute. Bei der Überprüfung am 11. September 2026 listet Apples Entwicklerdokumentation für keine der beiden Kennzahlen eine öffentliche HealthKit-API auf. Falls und sobald Apple eine veröffentlicht, muss das erneut geprüft werden — wir setzen es jetzt nicht voraus.",
        fr: "Pas à ce jour. Lors de la vérification du 11 septembre 2026, la documentation développeur d'Apple ne liste aucune API HealthKit publique pour ces deux métriques. Si et quand Apple en publie une, il faudra revérifier — nous ne le présumons pas maintenant.",
      },
    },
    {
      q: {
        it: "Se ho solo dispositivi Apple, mi serve ancora FitMesh?",
        en: "If I only have Apple devices, do I still need FitMesh?",
        de: "Brauche ich FitMesh noch, wenn ich nur Apple-Geräte habe?",
        fr: "Si je n'ai que des appareils Apple, ai-je encore besoin de FitMesh ?",
      },
      a: {
        it: "Onestamente, probabilmente meno. Se usi solo iPhone e Apple Watch, la nuova app Salute — quando arriverà — è pensata proprio per quel caso d'uso e potrebbe già coprire gran parte di quello che ti serve nativamente.",
        en: "Honestly, probably less. If you only use an iPhone and Apple Watch, the new Health app — once it arrives — is designed precisely for that use case and could already cover most of what you need natively.",
        de: "Ehrlich gesagt, wahrscheinlich weniger. Wenn du nur iPhone und Apple Watch nutzt, ist die neue App Health — sobald sie kommt — genau für diesen Anwendungsfall gedacht und könnte bereits nativ den Großteil dessen abdecken, was du brauchst.",
        fr: "Honnêtement, probablement moins. Si vous n'utilisez qu'un iPhone et une Apple Watch, la nouvelle app Santé — une fois disponible — est conçue précisément pour ce cas d'usage et pourrait déjà couvrir nativement l'essentiel de vos besoins.",
      },
    },
  ],
  // Alt reale della cover (ADDENDUM P1.21-A), scritto a mano nelle 4 locale
  // pubblicate — descrive l'IMMAGINE (illustrazione concettuale, non uno
  // screenshot Apple), non ripete H1/keyword. Vedi coverAlt() in covers.ts.
  coverAlt: {
    it: "Smartphone con dashboard salute collegato a smartwatch, smart ring e altri dispositivi.",
    en: "Smartphone health dashboard connected to a smartwatch, smart ring, and other devices.",
    de: "Smartphone mit Gesundheitsdashboard, verbunden mit Smartwatch, Smart Ring und weiteren Geräten.",
    fr: "Smartphone affichant un tableau de bord santé connecté à une montre, une bague et d'autres appareils.",
  },
  sources: [
    "https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/",
    "https://www.apple.com/newsroom/2026/09/introducing-apple-watch-series-12-with-the-all-new-health-sensing-system/",
    "https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier",
    "https://developer.apple.com/documentation/updates/healthkit",
  ],
  // Già citate inline come "Fonte: [...]" nel corpo — non duplicare nella
  // sezione "Fonti" condivisa (stesso pattern di anello-vs-smartwatch.ts).
  sourcesRenderedInline: true,
  brandsMentioned: ["Apple", "Samsung", "Garmin"],
  related: ["dati-anello-smart-apple-salute", "how-to-export-apple-health-data", "come-funziona-fitmesh"],
};
