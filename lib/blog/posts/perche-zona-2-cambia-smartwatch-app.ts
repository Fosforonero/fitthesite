/**
 * SPRINT P1.4B - cluster atomico con il calcolatore Heart Rate Zones
 * (lib/labs/heart-rate-zones/). Pubblicazione solo IT/EN (stesso meccanismo
 * di galaxy-watch-ultra2-watch9-health-connect: REDIRECT_INCOMPLETE_LOCALE_SLUGS
 * in lib/blog/locale-filter.ts, 307 verso EN per le altre 13 locale).
 *
 * Fonti citate (verificate live via ricerca web durante lo sviluppo, non a
 * memoria): Tanaka 2001 (PMID 11153730), Karvonen 1957 (PMID 13470504),
 * San-Millán & Brooks 2018 (PMID 28623613) - stesse fonti del calcolatore,
 * vedi lib/labs/heart-rate-zones/content.ts.
 *
 * Nessun medical reviewer inventato: revisione tecnico-editoriale, non
 * medica. Nessuna presentazione della Zona 2 come universale: ogni sezione
 * dichiara esplicitamente che le formule sono stime di popolazione.
 *
 * SPRINT P1.5B Fase B (2026-08-05): aggiunta traduzione editoriale completa
 * DE. Slug DE scelto (non traduzione letterale automatica):
 * "zone-2-unterschiede-smartwatch-app" ("Zone 2" resta invariato in
 * tedesco, terminologia standard anche nella sport science DACH). CTA verso
 * il calcolatore FitMesh Labs dichiarato esplicitamente verso la versione EN
 * (LABS_LOCALES = it/en, nessuna versione DE esiste) — stessa nota di
 * sleep-score-regolarita-ritmo-circadiano.ts: verificato live che è di
 * fatto ridondante (il redirect Labs funziona con qualsiasi slug it/en sotto
 * /de/), mantenuto solo per leggibilità. CTA verso /fitness-data-sync usa
 * invece il vero `/de/fitness-data-sync` (FITNESS_DATA_SYNC_COMPLETE_LOCALES
 * include de) — anche questo di fatto ridondante rispetto al fallback
 * implicito (stesso segmento finale it/en/de), dichiarato per chiarezza.
 * Confini di zona (limite inferiore incluso, superiore escluso tranne Zona
 * 5) e formula di Tanaka (208 − 0,7×età) tradotti 1:1, valori numerici
 * invariati. Negazione "FitMesh non ricalcola né configura le zone del tuo
 * dispositivo" preservata esattamente.
 */
import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "perche-zona-2-cambia-smartwatch-app",
  category: "guides",
  publishedAt: "2026-07-30",
  updatedAt: "2026-07-30",
  hero: {
    kicker: { it: "Guida", en: "Guide", de: "Ratgeber" },
    title: {
      it: "Perché la Zona 2 cambia da smartwatch e app",
      en: "Why Zone 2 differs between watches and apps",
      de: "Warum sich Zone 2 zwischen Smartwatch und App unterscheidet",
    },
    subtitle: {
      it: "Lo stesso sforzo, misurato nello stesso istante, può risultare \"Zona 2\" su un dispositivo e \"Zona 3\" su un altro. Non è un errore di misurazione: è quasi sempre una differenza di metodo tra % FC massima e % riserva cardiaca (Karvonen).",
      en: "The same effort, measured at the same instant, can show up as \"Zone 2\" on one device and \"Zone 3\" on another. It's not a measurement error: it's almost always a difference in method between %max heart rate and %heart rate reserve (Karvonen).",
      de: "Dieselbe Anstrengung, im selben Moment gemessen, kann auf einem Gerät als \"Zone 2\" und auf einem anderen als \"Zone 3\" angezeigt werden. Das ist kein Messfehler: Es handelt sich fast immer um einen Unterschied in der Methode zwischen %HFmax und %Herzfrequenzreserve (Karvonen).",
    },
  },
  metaDescription: {
    it: "Perché anello, smartwatch e app mostrano zone di frequenza cardiaca diverse per lo stesso sforzo. Metodi %FC max, Karvonen e formula di Tanaka, con calcolatore.",
    en: "Why your ring, smartwatch, and training apps show different heart rate zones for the same effort. %HRmax, Karvonen, and the Tanaka formula, with a calculator.",
    de: "Warum Ring, Smartwatch und App bei gleicher Anstrengung unterschiedliche Herzfrequenzzonen anzeigen. Methoden %HFmax, Karvonen und Tanaka-Formel, mit Rechner.",
  },
  // P1.5B Fase B: H1 (hero.title.de) resta descrittivo; seoTitle.de piu'
  // corto per restare <=60 caratteri renderizzati (stesso pattern usato per
  // l'override nl in P0.8 e per il micro-fix DE di P1.5B Fase A).
  seoTitle: {
    de: "Warum Zone 2 zwischen Geräten variiert",
  },
  primaryKeyword: {
    it: "perché zona 2 cambia smartwatch",
    en: "why zone 2 differs watches apps",
    de: "warum zone 2 unterschiedlich smartwatch",
  },
  secondaryKeywords: {
    it: ["zona 2 frequenza cardiaca", "zone frequenza cardiaca metodo karvonen", "zona 2 allenamento cos'è", "fc massima formula tanaka", "zone diverse garmin polar whoop"],
    en: ["zone 2 heart rate training", "heart rate zones karvonen method", "what is zone 2 training", "max heart rate tanaka formula", "different zones garmin polar whoop"],
    de: ["zone 2 herzfrequenz training", "herzfrequenzzonen karvonen methode", "was ist zone 2 training", "maximale herzfrequenz tanaka formel", "unterschiedliche zonen garmin polar whoop"],
  },
  readMinutes: 10,
  tldr: {
    it: [
      "La Zona 2 nominale può corrispondere a bpm diversi a seconda del metodo: % della FC massima, oppure % della riserva cardiaca (metodo Karvonen, che tiene conto della FC a riposo).",
      "Alcuni dispositivi/app usano %FC max di default, altri %riserva cardiaca solo se hai inserito la FC a riposo, altri ancora ancorano le zone a un test di soglia del lattato individuale, altri ricalcolano periodicamente in base alla FC a riposo osservata.",
      "Fisiologicamente, la \"Zona 2\" della ricerca sull'allenamento aerobico è definita da una soglia di lattato individuale (circa 1,5-2,0 mmol/L), non da una percentuale fissa uguale per tutti - le percentuali sono un'approssimazione pratica.",
      "Il calcolatore FitMesh Labs mostra entrambi i metodi (% FC max e Karvonen) fianco a fianco con la tua età/FC a riposo, per capire esattamente da dove nasce la differenza che vedi tra i tuoi dispositivi.",
    ],
    en: [
      "The nominal Zone 2 can correspond to different bpm depending on the method: % of max heart rate, or % of heart rate reserve (the Karvonen method, which accounts for resting heart rate).",
      "Some devices/apps default to %max heart rate, others use %heart rate reserve only if you've entered a resting heart rate, others anchor zones to an individual lactate threshold test, others periodically recalculate based on observed resting heart rate.",
      "Physiologically, the \"Zone 2\" from aerobic training research is defined by an individual lactate threshold (roughly 1.5-2.0 mmol/L), not a fixed percentage that's the same for everyone - percentages are a practical approximation.",
      "The FitMesh Labs calculator shows both methods (%HRmax and Karvonen) side by side using your age/resting heart rate, so you can see exactly where the difference you notice between your devices comes from.",
    ],
    de: [
      "Die nominelle Zone 2 kann je nach Methode unterschiedlichen bpm-Werten entsprechen: % der maximalen Herzfrequenz, oder % der Herzfrequenzreserve (Karvonen-Methode, die die Ruheherzfrequenz berücksichtigt).",
      "Manche Geräte/Apps verwenden standardmäßig %HFmax, andere %Herzfrequenzreserve nur, wenn du eine Ruheherzfrequenz eingegeben hast, wieder andere verankern die Zonen an einem individuellen Laktatschwellentest, und manche berechnen die Zonen regelmäßig anhand der beobachteten Ruheherzfrequenz neu.",
      "Physiologisch ist die \"Zone 2\" aus der Forschung zum Ausdauertraining durch eine individuelle Laktatschwelle definiert (etwa 1,5-2,0 mmol/L), nicht durch einen festen, für alle gleichen Prozentsatz, die Prozentwerte sind eine praktische Annäherung.",
      "Der FitMesh Labs Rechner zeigt beide Methoden (%HFmax und Karvonen) mit deinem Alter/deiner Ruheherzfrequenz nebeneinander, damit du genau siehst, woher der Unterschied zwischen deinen Geräten kommt.",
    ],
  },
  body: [
    {
      type: "heading",
      level: 2,
      text: { it: "Lo stesso sforzo, due zone diverse", en: "The same effort, two different zones", de: "Dieselbe Anstrengung, zwei unterschiedliche Zonen" },
    },
    {
      type: "paragraph",
      text: {
        it: "Se ti alleni con più di un dispositivo, o hai cambiato smartwatch/app di recente, probabilmente hai già notato questo: la stessa corsa, con lo stesso sforzo percepito, viene classificata come \"Zona 2\" su un dispositivo e \"Zona 3\" su un altro. La frequenza cardiaca misurata (i bpm grezzi) è spesso identica o quasi tra i due - è la ZONA NOMINALE assegnata a quel numero che cambia.",
        en: "If you train with more than one device, or recently switched watches/apps, you've probably already noticed this: the same run, at the same perceived effort, gets classified as \"Zone 2\" on one device and \"Zone 3\" on another. The measured heart rate (the raw bpm) is often identical or nearly so between the two - it's the NOMINAL ZONE assigned to that number that changes.",
        de: "Wenn du mit mehr als einem Gerät trainierst oder kürzlich Smartwatch/App gewechselt hast, ist dir das wahrscheinlich schon aufgefallen: Derselbe Lauf, mit derselben gefühlten Anstrengung, wird auf einem Gerät als \"Zone 2\" und auf einem anderen als \"Zone 3\" eingestuft. Die gemessene Herzfrequenz (die rohen bpm-Werte) ist zwischen beiden oft identisch oder fast identisch, es ist die dem Wert zugewiesene NOMINALE ZONE, die sich ändert.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "I due metodi più comuni", en: "The two most common methods", de: "Die zwei gängigsten Methoden" },
    },
    {
      type: "table",
      caption: { it: "Confronto diretto, stessa persona (FC max 180, FC riposo 60)", en: "Direct comparison, same person (max HR 180, resting HR 60)", de: "Direkter Vergleich, dieselbe Person (max. HF 180, Ruhe-HF 60)" },
      headers: { it: ["Metodo", "Riferimento", "Zona 2 (60-70%) in bpm"], en: ["Method", "Reference", "Zone 2 (60-70%) in bpm"], de: ["Methode", "Bezugswert", "Zone 2 (60-70%) in bpm"] },
      rows: [
        { it: ["% FC massima", "Solo FC massima (180)", "108 ≤ FC < 126 bpm"], en: ["%Max heart rate", "Max HR only (180)", "108 ≤ HR < 126 bpm"], de: ["%HF maximal", "Nur maximale HF (180)", "108 ≤ HF < 126 bpm"] },
        { it: ["Karvonen (% riserva cardiaca)", "FC riposo (60) + % di (FC max − FC riposo)", "132 ≤ FC < 144 bpm"], en: ["Karvonen (%heart rate reserve)", "Resting HR (60) + % of (max HR − resting HR)", "132 ≤ HR < 144 bpm"], de: ["Karvonen (%Herzfrequenzreserve)", "Ruhe-HF (60) + % von (max. HF − Ruhe-HF)", "132 ≤ HF < 144 bpm"] },
      ],
    },
    {
      type: "paragraph",
      text: {
        it: "18 bpm di differenza per la stessa zona nominale, sulla stessa persona, allo stesso istante - solo perché il riferimento usato per calcolare la percentuale è diverso. Nessuno dei due metodi è \"sbagliato\": sono scelte di progettazione diverse (vedi il calcolatore in fondo per l'esempio completo). Convenzione dei confini usata sopra e nel calcolatore: il limite inferiore di ogni zona è incluso, il limite superiore è escluso - tranne per la Zona 5, che include anche il limite superiore.",
        en: "18 bpm of difference for the same nominal zone, on the same person, at the same instant - purely because the reference used to compute the percentage is different. Neither method is \"wrong\": they are different design choices (see the calculator below for the full worked example). Boundary convention used above and in the calculator: each zone's lower bound is inclusive, its upper bound is exclusive - except for Zone 5, which also includes its upper bound.",
        de: "18 bpm Unterschied für dieselbe nominelle Zone, bei derselben Person, im selben Moment, nur weil der zur Berechnung des Prozentsatzes verwendete Bezugswert unterschiedlich ist. Keine der beiden Methoden ist \"falsch\": Es sind unterschiedliche Design-Entscheidungen (das vollständige Beispiel findest du im Rechner unten). Grenzkonvention, die oben und im Rechner verwendet wird: Die untere Grenze jeder Zone ist eingeschlossen, die obere Grenze ist ausgeschlossen, mit Ausnahme von Zone 5, bei der auch die obere Grenze eingeschlossen ist.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Perché anello, smartwatch e app non sono d'accordo", en: "Why your ring, smartwatch, and apps don't agree", de: "Warum Ring, Smartwatch und App nicht übereinstimmen" },
    },
    {
      type: "list",
      items: {
        it: [
          "Alcuni dispositivi/app usano di default il metodo % FC massima per tutti gli utenti.",
          "Altri passano automaticamente al metodo Karvonen (% riserva cardiaca) solo se hai inserito una FC a riposo nel profilo - altrimenti restano su % FC massima.",
          "Altri ancora ancorano le zone a una soglia di lattato individuale, misurata con un test dedicato (non stimata da una formula), se ne hai completato uno.",
          "Alcuni dispositivi ricalcolano periodicamente la FC a riposo osservata (es. ogni mese) e di conseguenza le zone Karvonen si spostano nel tempo, anche senza che tu cambi nulla manualmente.",
          "La formula di stima della FC massima da età, se usata, può differire tra dispositivi (Tanaka 208−0,7×età è una delle diverse formule pubblicate, non l'unica in uso).",
        ],
        en: [
          "Some devices/apps default to the %max heart rate method for all users.",
          "Others automatically switch to the Karvonen method (%heart rate reserve) only if you've entered a resting heart rate in your profile - otherwise they stay on %max heart rate.",
          "Others anchor zones to an individually measured lactate threshold from a dedicated test (not estimated from a formula), if you've completed one.",
          "Some devices periodically recalculate observed resting heart rate (e.g. monthly), so Karvonen zones shift over time even without you changing anything manually.",
          "The formula used to estimate max heart rate from age, if used at all, can differ between devices (Tanaka's 208−0.7×age is one of several published formulas, not the only one in use).",
        ],
        de: [
          "Manche Geräte/Apps verwenden standardmäßig die %HFmax-Methode für alle Nutzer.",
          "Andere wechseln automatisch zur Karvonen-Methode (%Herzfrequenzreserve), aber nur, wenn du eine Ruheherzfrequenz im Profil eingegeben hast, andernfalls bleiben sie bei %HFmax.",
          "Wieder andere verankern die Zonen an einer individuellen Laktatschwelle, gemessen mit einem eigenen Test (nicht per Formel geschätzt), falls du einen absolviert hast.",
          "Manche Geräte berechnen die beobachtete Ruheherzfrequenz regelmäßig neu (z. B. monatlich), wodurch sich die Karvonen-Zonen mit der Zeit verschieben, auch ohne dass du manuell etwas änderst.",
          "Die Formel zur Schätzung der maximalen Herzfrequenz aus dem Alter kann, falls verwendet, zwischen Geräten variieren (Tanaka 208−0,7×Alter ist eine von mehreren veröffentlichten Formeln, nicht die einzige in Gebrauch).",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Nessuno dei metodi è universale", en: "No method is universal", de: "Keine der Methoden ist universell" },
      body: {
        it: "Questo articolo non sostiene che un metodo sia \"più corretto\" in assoluto. Descrive perché numeri diversi sulla stessa persona sono attesi, non un difetto di uno dei due dispositivi.",
        en: "This article does not claim one method is universally \"more correct\". It describes why different numbers on the same person are expected, not a defect in either device.",
        de: "Dieser Artikel behauptet nicht, dass eine Methode absolut \"richtiger\" ist. Er beschreibt, warum unterschiedliche Zahlen bei derselben Person zu erwarten sind, und nicht ein Defekt eines der beiden Geräte.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cos'è davvero la Zona 2, dal punto di vista fisiologico", en: "What Zone 2 actually is, physiologically", de: "Was Zone 2 physiologisch tatsächlich ist" },
    },
    {
      type: "paragraph",
      text: {
        it: "Nella ricerca sull'allenamento aerobico, la \"Zona 2\" (a volte chiamata \"zona 2 training\" o \"base aerobica\") non è definita da una percentuale fissa della FC massima uguale per tutti, ma da una soglia metabolica individuale: l'intensità alla quale il lattato nel sangue resta relativamente controllato, circa tra 1,5 e 2,0 mmol/L, appena sotto la prima soglia di lattato (LT1). A questa intensità, l'ossidazione dei grassi e l'adattamento mitocondriale sono favoriti rispetto a intensità più alte, dove il metabolismo si sposta verso la via glicolitica.",
        en: "In aerobic training research, \"Zone 2\" (sometimes called \"zone 2 training\" or \"aerobic base\") is not defined by a fixed percentage of max heart rate that's the same for everyone, but by an individual metabolic threshold: the intensity at which blood lactate stays relatively controlled, roughly between 1.5 and 2.0 mmol/L, just below the first lactate threshold (LT1). At this intensity, fat oxidation and mitochondrial adaptation are favored compared to higher intensities, where metabolism shifts toward the glycolytic pathway.",
        de: "In der Forschung zum Ausdauertraining ist \"Zone 2\" (manchmal \"Zone-2-Training\" oder \"aerobe Basis\" genannt) nicht durch einen festen, für alle gleichen Prozentsatz der maximalen Herzfrequenz definiert, sondern durch eine individuelle metabolische Schwelle: die Intensität, bei der der Laktatwert im Blut relativ kontrolliert bleibt, etwa zwischen 1,5 und 2,0 mmol/L, knapp unter der ersten Laktatschwelle (LT1). Bei dieser Intensität werden Fettoxidation und mitochondriale Anpassung begünstigt, im Vergleich zu höheren Intensitäten, bei denen der Stoffwechsel stärker auf den glykolytischen Weg umschaltet.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Le percentuali fisse (50-60%, 60-70% ecc.) sono un'approssimazione pratica di questa soglia metabolica, comoda perché non richiede un prelievo di sangue durante l'esercizio - ma restano stime di popolazione. La vera soglia individuale può cadere a una percentuale diversa da quella nominale, soprattutto per atleti molto allenati o condizioni individuali particolari: un test del lattato in laboratorio resta il riferimento più preciso per chi vuole allenare la Zona 2 in modo mirato.",
        en: "Fixed percentages (50-60%, 60-70%, etc.) are a practical approximation of this metabolic threshold, convenient because it doesn't require a blood draw during exercise - but they remain population estimates. The true individual threshold can fall at a different percentage than the nominal one, especially for highly trained athletes or particular individual conditions: a laboratory lactate test remains the most precise reference for anyone who wants to target Zone 2 training specifically.",
        de: "Die festen Prozentsätze (50-60%, 60-70% usw.) sind eine praktische Annäherung an diese metabolische Schwelle, praktisch, weil während der Belastung keine Blutentnahme nötig ist, aber sie bleiben Populationsschätzungen. Die tatsächliche individuelle Schwelle kann bei einem anderen Prozentsatz liegen als dem nominellen, besonders bei sehr trainierten Athletinnen und Athleten oder besonderen individuellen Voraussetzungen: Ein Laktattest im Labor bleibt die präziseste Referenz für alle, die Zone 2 gezielt trainieren möchten.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Vedi la differenza tu stesso", en: "See the difference yourself", de: "Sieh dir den Unterschied selbst an" },
    },
    {
      type: "paragraph",
      text: {
        it: "Invece di indovinare perché i tuoi numeri non tornano tra un dispositivo e l'altro, puoi calcolare entrambi i metodi fianco a fianco con i tuoi dati (età o FC massima reale, più FC a riposo) e vedere esattamente quanti bpm di differenza produce la scelta del metodo.",
        en: "Instead of guessing why your numbers don't match between devices, you can calculate both methods side by side with your own data (age or real max heart rate, plus resting heart rate) and see exactly how many bpm of difference the method choice produces.",
        de: "Statt zu raten, warum deine Zahlen zwischen den Geräten nicht übereinstimmen, kannst du beide Methoden mit deinen eigenen Daten (Alter oder reale maximale Herzfrequenz, plus Ruheherzfrequenz) nebeneinander berechnen und genau sehen, wie viele bpm Unterschied die Wahl der Methode ausmacht.",
      },
    },
    {
      type: "cta",
      title: { it: "Calcola le tue zone con entrambi i metodi", en: "Calculate your zones with both methods", de: "Berechne deine Zonen mit beiden Methoden" },
      body: {
        it: "% FC massima e Karvonen, affiancati, con la formula esplicita e un esempio numerico. Calcolo nel browser, nessun dato inviato.",
        en: "%Max heart rate and Karvonen, side by side, with the explicit formula and a worked example. Calculated in your browser, nothing sent anywhere.",
        de: "%HFmax und Karvonen, nebeneinander, mit expliziter Formel und einem Rechenbeispiel. Berechnung im Browser, keine Daten werden gesendet.",
      },
      ctaLabel: { it: "Apri il calcolatore zone FC →", en: "Open the heart rate zones calculator →", de: "Herzfrequenzzonen-Rechner öffnen →" },
      // DE dichiarato esplicitamente verso la versione EN (stessa nota di
      // sleep-score-regolarita-ritmo-circadiano.ts): dichiarazione esplicita
      // e innocua, non un fix funzionale — /de/labs/* con QUALSIASI slug
      // it/en redirige comunque 307 a singolo hop verso /en/labs/..., quindi
      // anche il fallback su `.it` sarebbe atterrato correttamente (verificato
      // live).
      ctaHref: { it: "/it/labs/calcolatore-zone-frequenza-cardiaca", en: "/en/labs/heart-rate-zones-calculator", de: "/en/labs/heart-rate-zones-calculator" },
      ctaId: "blog-zone2-hr-zones-calculator-cta",
      ctaPlacement: "blog_body_mid",
    },
    {
      type: "paragraph",
      text: {
        it: "Se vuoi tenere frequenza cardiaca e allenamenti compatibili in un'unica cronologia, invece di ricalcolarli manualmente ogni volta, FitMesh Sync sincronizza i dati compatibili rilevati dal tuo anello o smartwatch in una dashboard personale. Il calcolatore sopra resta uno strumento educativo indipendente: FitMesh non ricalcola né configura le zone di frequenza cardiaca del tuo dispositivo.",
        en: "If you want to keep compatible heart rate and workout data in one timeline, instead of recalculating it manually every time, FitMesh Sync syncs compatible data detected by your ring or smartwatch into a personal dashboard. The calculator above remains a separate educational tool: FitMesh does not recalculate or configure your device's heart rate zones.",
        de: "Wenn du Herzfrequenz- und Trainingsdaten in einer einzigen Chronik zusammenhalten möchtest, statt sie jedes Mal manuell neu zu berechnen, synchronisiert FitMesh Sync kompatible Daten von deinem Ring oder deiner Smartwatch in ein persönliches Dashboard. Der Rechner oben bleibt ein unabhängiges Lernwerkzeug: FitMesh berechnet oder konfiguriert die Herzfrequenzzonen deines Geräts nicht neu.",
      },
    },
    {
      type: "cta",
      title: { it: "Porta i tuoi dati di frequenza cardiaca in un unico posto", en: "Bring your heart rate data into one place", de: "Bring deine Herzfrequenzdaten an einen Ort" },
      body: {
        it: "FitMesh Sync collega anelli, smartwatch e app di fitness a una dashboard unica, gratuita per iniziare.",
        en: "FitMesh Sync connects rings, smartwatches, and fitness apps into a single dashboard, free to start.",
        de: "FitMesh Sync verbindet Ringe, Smartwatches und Fitness-Apps mit einem einzigen Dashboard, kostenlos zum Einstieg.",
      },
      ctaLabel: { it: "Scopri FitMesh Sync →", en: "Discover FitMesh Sync →", de: "FitMesh Sync entdecken →" },
      // DE reale: FITNESS_DATA_SYNC_COMPLETE_LOCALES include de.
      ctaHref: { it: "/it/fitness-data-sync", en: "/en/fitness-data-sync", de: "/de/fitness-data-sync" },
      ctaId: "blog-zone2-sync-app-cta",
      ctaPlacement: "blog_body_end",
    },
  ],
  faq: [
    {
      q: { it: "Qual è la Zona 2 giusta per me?", en: "What is the right Zone 2 for me?", de: "Welche Zone 2 ist die richtige für mich?" },
      a: {
        it: "Questo articolo non lo prescrive: mostra due metodi di stima comuni (% FC massima e Karvonen) e spiega perché differiscono. La stima più precisa della tua soglia metabolica individuale richiede un test del lattato in laboratorio, non una formula generica.",
        en: "This article doesn't prescribe it: it shows two common estimation methods (%HRmax and Karvonen) and explains why they differ. The most precise estimate of your individual metabolic threshold requires a laboratory lactate test, not a generic formula.",
        de: "Dieser Artikel schreibt das nicht vor: Er zeigt zwei gängige Schätzmethoden (%HFmax und Karvonen) und erklärt, warum sie sich unterscheiden. Die genaueste Schätzung deiner individuellen metabolischen Schwelle erfordert einen Laktattest im Labor, keine generische Formel.",
      },
    },
    {
      q: { it: "Perché il mio smartwatch ha ricalcolato le mie zone senza che facessi nulla?", en: "Why did my smartwatch recalculate my zones without me doing anything?", de: "Warum hat meine Smartwatch meine Zonen neu berechnet, ohne dass ich etwas getan habe?" },
      a: {
        it: "Alcuni dispositivi ricalcolano periodicamente la tua FC a riposo osservata (es. ogni mese) e aggiornano automaticamente le zone Karvonen di conseguenza, poiché quel metodo dipende dalla FC a riposo.",
        en: "Some devices periodically recalculate your observed resting heart rate (e.g. monthly) and automatically update Karvonen zones accordingly, since that method depends on resting heart rate.",
        de: "Manche Geräte berechnen deine beobachtete Ruheherzfrequenz regelmäßig neu (z. B. monatlich) und aktualisieren die Karvonen-Zonen entsprechend automatisch, da diese Methode von der Ruheherzfrequenz abhängt.",
      },
    },
    {
      q: { it: "Devo usare la FC massima stimata dall'età o farla misurare?", en: "Should I use the age-estimated max heart rate or have it measured?", de: "Sollte ich die altersgeschätzte maximale Herzfrequenz verwenden oder sie messen lassen?" },
      a: {
        it: "Se hai accesso a un test da sforzo reale o a un picco osservato durante uno sforzo massimale, quel valore misurato è più affidabile della stima di popolazione (formula di Tanaka o altre). Il calcolatore FitMesh Labs supporta entrambe le modalità.",
        en: "If you have access to a real graded exercise test or an observed peak during a maximal effort, that measured value is more reliable than the population estimate (Tanaka's formula or others). The FitMesh Labs calculator supports both modes.",
        de: "Wenn du Zugang zu einem echten Belastungstest oder einem beobachteten Spitzenwert bei maximaler Anstrengung hast, ist dieser gemessene Wert zuverlässiger als die Populationsschätzung (Tanaka-Formel oder andere). Der FitMesh Labs Rechner unterstützt beide Varianten.",
      },
    },
    {
      q: { it: "La Zona 2 è la stessa cosa per correre, andare in bici e nuotare?", en: "Is Zone 2 the same for running, cycling, and swimming?", de: "Ist Zone 2 beim Laufen, Radfahren und Schwimmen dasselbe?" },
      a: {
        it: "La frequenza cardiaca a una data soglia metabolica può differire tra sport (per posizione del corpo, muscoli coinvolti, temperatura), quindi le zone calcolate per uno sport non si trasferiscono automaticamente e senza verifica a un altro. Questo articolo tratta il calcolo generico delle zone, non le differenze specifiche tra sport.",
        en: "Heart rate at a given metabolic threshold can differ between sports (due to body position, muscles involved, temperature), so zones calculated for one sport don't automatically and reliably transfer to another without verification. This article covers the generic zone calculation, not sport-specific differences.",
        de: "Die Herzfrequenz bei einer bestimmten metabolischen Schwelle kann zwischen Sportarten variieren (durch Körperhaltung, beteiligte Muskeln, Temperatur), daher lassen sich für eine Sportart berechnete Zonen nicht automatisch und ohne Überprüfung auf eine andere übertragen. Dieser Artikel behandelt die allgemeine Zonenberechnung, nicht sportartspezifische Unterschiede.",
      },
    },
  ],
  related: ["sleep-score-regolarita-ritmo-circadiano", "hrv-cose-significato-valori", "vo2-max-wearable-comparison-2026"],
  sources: [
    "https://www.jacc.org/doi/abs/10.1016/s0735-1097(00)01054-8",
    "https://pubmed.ncbi.nlm.nih.gov/13470504/",
    "https://pubmed.ncbi.nlm.nih.gov/28623613/",
  ],
  ldType: "BlogPosting",
};
