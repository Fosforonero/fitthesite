import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "steps-total-vs-hourly-chart",
  category: "guides",
  // MICRO-GATE PR#66-B (08/09/2026): data aggiornata alla vera data di
  // pubblicazione (merge), come richiesto dal commento precedente — non e'
  // rimasta la data di scrittura della bozza (02/09/2026).
  //
  // SPRINT novità 3.10.0/191 (10/09/2026): aggiornamento puntuale alla
  // meccanica del grafico orario (7 stati verificati su
  // flutter_app/lib/features/dashboard/domain/serie_oraria_parziale.dart
  // al tag v3.10.0+191) — slug, H1 e publishedAt restano INVARIATI per
  // mandato. updatedAt qui sotto e' ancora il placeholder della versione
  // precedente: OBBLIGATORIO impostarlo alla data REALE di pubblicazione
  // di questa PR, non lasciarlo a "2026-09-08".
  publishedAt: "2026-09-08",
  updatedAt: "2026-09-08",
  readMinutes: 6,
  // Titolo SEO alternativo (< H1): H1 resta la domanda per intero, il title
  // renderizzato usa la forma breve. Il renderer aggiunge " · FitMesh" UNA
  // volta sola in generateMetadata (blog/[slug]/page.tsx) — non ripeterlo qui.
  seoTitle: {
    it: "Passi totali diversi dal grafico: perché",
    en: "Steps Total vs. Hourly Chart: Why",
    de: "Schritte gesamt vs. Stundendiagramm: warum",
    fr: "Total des pas vs graphique horaire : pourquoi",
  },
  primaryKeyword: {
    it: "passi totali diversi dal grafico",
    en: "steps total different from chart",
    de: "Schritte gesamt stimmt nicht mit Diagramm überein",
    fr: "total des pas différent du graphique",
  },
  secondaryKeywords: {
    it: [
      "grafico passi sbagliato",
      "Samsung Health e Health Connect passi diversi",
      "perché FitMesh non mostra il grafico orario",
      "linea tratteggiata grafico passi",
      "dati passi mancanti per ora",
    ],
    en: [
      "steps chart wrong",
      "Samsung Health vs Health Connect steps different",
      "why doesn't my steps chart show",
      "dashed line steps chart",
      "missing hourly steps data",
    ],
    de: [
      "Schritte-Diagramm falsch",
      "Samsung Health und Health Connect unterschiedliche Schritte",
      "warum zeigt FitMesh kein Stundendiagramm",
      "gestrichelte Linie Schritte-Diagramm",
      "stündliche Schrittdaten fehlen",
    ],
    fr: [
      "graphique des pas incorrect",
      "Samsung Health et Health Connect pas différents",
      "pourquoi FitMesh n'affiche pas le graphique horaire",
      "ligne pointillée graphique des pas",
      "données de pas horaires manquantes",
    ],
  },
  metaDescription: {
    it: "Totale giornaliero e grafico orario non coincidono? Scopri come FitMesh sceglie la fonte, quando nasconde il grafico e cosa indica la linea tratteggiata.",
    en: "Daily total and hourly chart don't match? Here's how FitMesh picks the source, when it hides the chart, and what the dashed line actually means.",
    de: "Tagestotal und Stundendiagramm stimmen nicht überein? So wählt FitMesh die Quelle, wann es das Diagramm ausblendet und was die gestrichelte Linie bedeutet.",
    fr: "Le total du jour et le graphique horaire ne correspondent pas ? Voici comment FitMesh choisit la source, quand il masque le graphique et ce que signifie la ligne pointillée.",
  },
  tldr: {
    it: [
      "Il totale del giorno e il grafico orario rispondono a domande diverse: quanti passi in tutto, e in che ore.",
      "FitMesh non somma le fonti e non sceglie in base a chi ha il numero più alto: sceglie la fonte più coerente e con più ore misurate per quel giorno.",
      "Quando il dettaglio orario è utilizzabile e proviene dalla stessa fonte del totale, FitMesh può mostrare anche una curva parziale, dichiarandone i limiti. Se la provenienza non è verificabile, è diversa o i dati sono incoerenti, FitMesh non mostra quella curva anche se i dati orari esistono: non promette una copertura oraria completa.",
      "I passi senza un'ora precisa non vengono mai spalmati sul grafico per farlo tornare.",
      "La linea tratteggiata è la tua media personale dei giorni precedenti, non un obiettivo.",
    ],
    en: [
      "The day's total and the hourly chart answer different questions: how many steps in total, and in which hours.",
      "FitMesh doesn't add sources together and doesn't pick a winner by the biggest number: it picks the most consistent source with the most hours measured that day.",
      "When hourly detail is usable and comes from the same source as the total, FitMesh can show even a partial curve, stating its limits. If the provenance isn't verifiable, comes from elsewhere, or the numbers don't add up, FitMesh won't show that curve even though the hourly data exists: it doesn't promise full hourly coverage.",
      "Steps without a specific hour are never spread across the chart to make the numbers line up.",
      "The dashed line is your own average from previous days, not a goal.",
    ],
    de: [
      "Tagestotal und Stundendiagramm beantworten unterschiedliche Fragen: wie viele Schritte insgesamt, und in welchen Stunden.",
      "FitMesh addiert die Quellen nicht und wählt nicht die mit der größten Zahl: Es wählt die konsistenteste Quelle mit den meisten gemessenen Stunden an diesem Tag.",
      "Wenn das stündliche Detail nutzbar ist und aus derselben Quelle wie der Gesamtwert stammt, kann FitMesh auch eine unvollständige Kurve zeigen — mit einem Hinweis auf ihre Grenzen. Ist die Herkunft nicht überprüfbar, stammt sie aus einer anderen Quelle, oder sind die Daten widersprüchlich, zeigt FitMesh diese Kurve nicht, auch wenn die stündlichen Daten vorhanden sind: Eine vollständige stündliche Abdeckung wird nicht versprochen.",
      "Schritte ohne genaue Stunde werden nie über das Diagramm verteilt, nur damit die Zahlen passen.",
      "Die gestrichelte Linie ist dein eigener Durchschnitt der letzten Tage, kein Ziel.",
    ],
    fr: [
      "Le total du jour et le graphique horaire répondent à des questions différentes : combien de pas au total, et à quelles heures.",
      "FitMesh n'additionne pas les sources et ne choisit pas celle avec le plus grand chiffre : il choisit la source la plus cohérente et la mieux couverte ce jour-là.",
      "Quand le détail horaire est exploitable et provient de la même source que le total, FitMesh peut afficher une courbe même partielle, en indiquant ses limites. Si la provenance n'est pas vérifiable, est différente, ou si les données sont incohérentes entre elles, FitMesh n'affiche pas cette courbe même si les données horaires existent : une couverture horaire complète n'est pas garantie.",
      "Les pas sans heure précise ne sont jamais répartis sur le graphique pour faire correspondre les chiffres.",
      "La ligne pointillée est votre propre moyenne des jours précédents, pas un objectif.",
    ],
  },
  hero: {
    kicker: {
      it: "Guida",
      en: "Guide",
      de: "Anleitung",
      fr: "Guide",
    },
    title: {
      it: "Il totale dei passi non coincide col grafico orario? Ecco perché",
      en: "The Steps Total Doesn't Match the Hourly Chart? Here's Why",
      de: "Schritte-Gesamtwert stimmt nicht mit dem Stundendiagramm überein? So kommt das",
      fr: "Le total des pas ne correspond pas au graphique horaire ? Voici pourquoi",
    },
    subtitle: {
      it: "Un totale del giorno e un grafico ora per ora che a volte manca: non è un errore, è come FitMesh gestisce più fonti dello stesso dato senza inventare numeri.",
      en: "A daily total and an hour-by-hour chart that sometimes isn't there: it's not a bug, it's how FitMesh handles multiple sources of the same data without making up numbers.",
      de: "Ein Tagestotal und ein Stunde-für-Stunde-Diagramm, das manchmal fehlt: kein Fehler, sondern wie FitMesh mehrere Quellen desselben Werts behandelt, ohne Zahlen zu erfinden.",
      fr: "Un total du jour et un graphique heure par heure qui manque parfois : ce n'est pas un bug, c'est la façon dont FitMesh gère plusieurs sources d'une même donnée sans inventer de chiffres.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se indossi più di un dispositivo, può capitare di vedere un totale passi in cima alla giornata e, subito sotto, nessun grafico ora per ora: oppure un grafico che sembra raccontare una storia diversa dal numero grande. Non sono due bug scollegati: il totale del giorno e il grafico orario rispondono a due domande diverse, e a volte solo la prima ha una risposta affidabile.",
        en: "If you wear more than one device, you might see a steps total at the top of your day and, right below it, no hour-by-hour chart, or a chart that seems to tell a different story than the big number. These aren't two unrelated bugs: the day's total and the hourly chart answer two different questions, and sometimes only the first one has a reliable answer.",
        de: "Wenn du mehr als ein Gerät trägst, kann es sein, dass du oben in deinem Tag ein Schritte-Total siehst und direkt darunter kein Stunde-für-Stunde-Diagramm, oder ein Diagramm, das etwas anderes zu erzählen scheint als die große Zahl. Das sind keine zwei unabhängigen Fehler: Das Tagestotal und das Stundendiagramm beantworten zwei unterschiedliche Fragen, und manchmal hat nur die erste eine verlässliche Antwort.",
        fr: "Si vous portez plusieurs appareils, il peut arriver de voir un total de pas en haut de votre journée et, juste en dessous, aucun graphique heure par heure, ou un graphique qui semble raconter une autre histoire que le grand chiffre. Ce ne sont pas deux bugs sans rapport : le total du jour et le graphique horaire répondent à deux questions différentes, et parfois seule la première a une réponse fiable.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché più fonti non vengono semplicemente sommate",
        en: "Why multiple sources aren't simply added together",
        de: "Warum mehrere Quellen nicht einfach addiert werden",
        fr: "Pourquoi plusieurs sources ne sont pas simplement additionnées",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se orologio, anello e telefono misurano tutti i passi nello stesso giorno, contano gli stessi passi reali: sommarli gonfierebbe il numero. FitMesh non somma le fonti in modo indiscriminato, e non risolve nemmeno scegliendo il valore più alto tra loro. Sceglie invece la fonte più coerente al proprio interno e con la copertura oraria migliore per quel giorno specifico: un valore che non si contraddice da solo e che ha effettivamente misurato più ore vince su uno che ha semplicemente un numero più grande.",
        en: "If your watch, ring and phone all track steps on the same day, they're counting the same real steps: adding them up would inflate the number. FitMesh doesn't add sources together indiscriminately, and it doesn't settle things by simply picking the higher value either. Instead it picks the source that's most internally consistent and has the best hourly coverage for that specific day: a value that doesn't contradict itself and actually measured more hours wins over one that simply has a bigger number.",
        de: "Wenn Uhr, Ring und Telefon am selben Tag alle Schritte erfassen, zählen sie dieselben echten Schritte: Sie zu addieren würde die Zahl aufblähen. FitMesh addiert Quellen nicht wahllos und löst das auch nicht, indem es einfach den höheren Wert wählt. Stattdessen wählt es die Quelle, die in sich am konsistentesten ist und für diesen bestimmten Tag die beste stündliche Abdeckung hat: Ein Wert, der sich nicht selbst widerspricht und tatsächlich mehr Stunden gemessen hat, gewinnt gegenüber einem, der einfach eine größere Zahl hat.",
        fr: "Si votre montre, votre bague et votre téléphone suivent tous les pas le même jour, ils comptent les mêmes pas réels : les additionner gonflerait le chiffre. FitMesh n'additionne pas les sources sans discernement, et ne tranche pas non plus en choisissant simplement la valeur la plus élevée. Il choisit plutôt la source la plus cohérente en interne et disposant de la meilleure couverture horaire pour ce jour précis : une valeur qui ne se contredit pas elle-même et qui a réellement mesuré plus d'heures l'emporte sur une valeur qui a simplement un chiffre plus grand.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "E se due fonti danno numeri davvero diversi?",
        en: "What if two sources give genuinely different numbers?",
        de: "Was, wenn zwei Quellen wirklich unterschiedliche Zahlen liefern?",
        fr: "Et si deux sources donnent des chiffres vraiment différents ?",
      },
      body: {
        it: "A volte nessuno dei criteri riesce a decidere in modo affidabile: in quel caso FitMesh non inventa un vincitore per grandezza, tratta quel giorno come incerto piuttosto che indovinare. Meglio un giorno segnalato come poco chiaro che un numero sbagliato mostrato con sicurezza.",
        en: "Sometimes none of the criteria can decide reliably: in that case FitMesh doesn't invent a winner by size, it treats that day as unclear rather than guessing. A day flagged as uncertain beats a wrong number shown with confidence.",
        de: "Manchmal kann keines der Kriterien zuverlässig entscheiden: In diesem Fall erfindet FitMesh keinen Gewinner nach Größe, sondern behandelt diesen Tag als unklar, statt zu raten. Ein als unklar markierter Tag ist besser als eine falsche Zahl, die mit Sicherheit angezeigt wird.",
        fr: "Parfois, aucun critère ne permet de trancher de façon fiable : dans ce cas, FitMesh n'invente pas un vainqueur selon la taille du chiffre, il traite ce jour comme incertain plutôt que de deviner. Un jour signalé comme incertain vaut mieux qu'un chiffre erroné affiché avec assurance.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché il grafico orario a volte non compare del tutto",
        en: "Why the hourly chart sometimes doesn't show up at all",
        de: "Warum das Stundendiagramm manchmal überhaupt nicht erscheint",
        fr: "Pourquoi le graphique horaire n'apparaît parfois pas du tout",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il grafico ora per ora e il totale del giorno possono arrivare da fonti diverse. FitMesh disegna la curva solo quando il dettaglio orario è utilizzabile e dimostrabilmente della stessa fonte del totale: se copre l'intera giornata la mostra intera, se ne copre solo una parte la mostra dichiarandola parziale, con la quota senza orario indicata accanto. Se invece la provenienza del dettaglio orario non è verificabile, viene da una fonte diversa dal totale, oppure i numeri sono incoerenti fra loro, FitMesh non disegna quella curva sotto il totale — anche quando i dati orari esistono: la mostrerebbe come se fosse la forma di un numero che non è il suo. Il totale del giorno resta comunque visibile in ogni caso, ma il grafico orario non è garantito coprire sempre l'intera giornata.",
        en: "The hour-by-hour chart and the day's total can come from different sources. FitMesh only draws the curve when the hourly detail is usable and demonstrably from the same source as the total: when that's the case, if it covers the whole day it shows it in full, and if it covers only part of the day it shows it labeled as partial, with the portion that has no hourly breakdown noted alongside it. But if the hourly detail's provenance isn't verifiable, comes from a source other than the total's, or the numbers don't add up, FitMesh won't draw that curve under the total — even when the hourly data exists: that would show the shape of a number that isn't its own. The day's total stays visible either way, but the hourly chart isn't guaranteed to always cover the full day.",
        de: "Das Stunde-für-Stunde-Diagramm und das Tagestotal können aus unterschiedlichen Quellen stammen. FitMesh zeichnet die Kurve nur, wenn das stündliche Detail nutzbar und nachweislich aus derselben Quelle wie der Gesamtwert ist: In diesem Fall zeigt es sie vollständig, wenn sie den ganzen Tag abdeckt, und als unvollständig gekennzeichnet, wenn sie nur einen Teil abdeckt — mit dem Anteil ohne stündliche Aufschlüsselung daneben angegeben. Ist dagegen die Herkunft des stündlichen Details nicht überprüfbar, stammt sie aus einer anderen Quelle als der Gesamtwert, oder sind die Zahlen widersprüchlich, zeichnet FitMesh diese Kurve nicht unter dem Gesamtwert — selbst wenn die stündlichen Daten vorhanden sind: Es würde damit die Form einer Zahl zeigen, die nicht ihre eigene ist. Das Tagestotal bleibt in jedem Fall sichtbar, das Stundendiagramm deckt aber nicht garantiert immer den ganzen Tag ab.",
        fr: "Le graphique heure par heure et le total du jour peuvent provenir de sources différentes. FitMesh ne trace la courbe que lorsque le détail horaire est exploitable et manifestement issu de la même source que le total : dans ce cas, s'il couvre toute la journée, il l'affiche en entier, et s'il n'en couvre qu'une partie, il l'affiche en la signalant comme partielle, avec la part sans détail horaire indiquée à côté. Si en revanche la provenance du détail horaire n'est pas vérifiable, provient d'une source différente du total, ou si les chiffres sont incohérents entre eux, FitMesh ne trace pas cette courbe sous le total — même quand les données horaires existent : ce serait montrer la forme d'un nombre qui n'est pas le sien. Le total du jour reste visible dans tous les cas, mais le graphique horaire n'est pas garanti de toujours couvrir la journée entière.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Un punto importante: i passi che non hanno un'ora precisa associata non vengono mai spalmati sulle ore per far tornare i conti visivamente. Sarebbe un grafico più bello ma un dato inventato. FitMesh preferisce non mostrare nulla piuttosto che mostrare qualcosa che non è mai stato misurato.",
        en: "One important point: steps that don't have a specific hour attached are never spread across the hours just to make the numbers look right. That would be a nicer-looking chart built on a made-up number. FitMesh would rather show nothing than show something that was never actually measured.",
        de: "Ein wichtiger Punkt: Schritte ohne eine genau zugeordnete Stunde werden nie über die Stunden verteilt, nur damit die Zahlen optisch passen. Das wäre ein hübscheres Diagramm auf Basis einer erfundenen Zahl. FitMesh zeigt lieber nichts, als etwas zu zeigen, das nie tatsächlich gemessen wurde.",
        fr: "Un point important : les pas sans heure précise associée ne sont jamais répartis sur les heures juste pour que les chiffres paraissent cohérents. Ce serait un graphique plus joli, mais basé sur un chiffre inventé. FitMesh préfère ne rien afficher plutôt que d'afficher quelque chose qui n'a jamais été réellement mesuré.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa significa la linea tratteggiata",
        en: "What the dashed line actually means",
        de: "Was die gestrichelte Linie bedeutet",
        fr: "Ce que signifie la ligne pointillée",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La linea tratteggiata sul grafico non è il tuo obiettivo di passi: è la tua media personale nei giorni precedenti. FitMesh la calcola sui giorni di calendario immediatamente prima di quello che stai guardando (fino a 7), contando solo i giorni con un dato reale e maggiore di zero: un giorno assente o azzerato non viene trattato come uno zero che abbassa la media, semplicemente non entra nel conto. Se hai meno di 3 giorni validi nella finestra, la linea non viene disegnata: meglio nessuna linea che una media calcolata su troppo poco.",
        en: "The dashed line on the chart is not your steps goal: it's your own average from previous days. FitMesh calculates it over the calendar days right before the one you're looking at (up to 7), counting only days with a real value greater than zero: a missing or zeroed-out day isn't treated as a zero that drags the average down, it simply isn't counted at all. If you have fewer than 3 valid days in that window, no line is drawn: better no line than an average built on too little.",
        de: "Die gestrichelte Linie im Diagramm ist nicht dein Schrittziel: Sie ist dein eigener Durchschnitt aus vorherigen Tagen. FitMesh berechnet ihn über die Kalendertage direkt vor dem angezeigten Tag (bis zu 7), wobei nur Tage mit einem echten Wert größer als null gezählt werden: Ein fehlender oder auf null stehender Tag wird nicht als Null behandelt, die den Durchschnitt senkt, er zählt einfach gar nicht mit. Hast du weniger als 3 gültige Tage in diesem Zeitraum, wird keine Linie gezeichnet: lieber keine Linie als ein Durchschnitt aus zu wenigen Daten.",
        fr: "La ligne pointillée sur le graphique n'est pas votre objectif de pas : c'est votre propre moyenne des jours précédents. FitMesh la calcule sur les jours calendaires juste avant celui que vous consultez (jusqu'à 7), en ne comptant que les jours avec une vraie valeur supérieure à zéro : un jour absent ou à zéro n'est pas traité comme un zéro qui fait baisser la moyenne, il n'est tout simplement pas compté. S'il y a moins de 3 jours valides dans cette fenêtre, aucune ligne n'est tracée : mieux vaut pas de ligne qu'une moyenne calculée sur trop peu de données.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Vuoi capire come funziona la fusione dati in generale?",
        en: "Want to understand how data fusion works overall?",
        de: "Möchtest du verstehen, wie die Datenfusion insgesamt funktioniert?",
        fr: "Vous voulez comprendre comment fonctionne la fusion des données en général ?",
      },
      body: {
        it: "Questo articolo si concentra sui passi e sul grafico orario. Per il quadro completo di come FitMesh unisce più dispositivi senza doppioni, vedi [come funziona FitMesh Sync](/it/blog/come-funziona-fitmesh).",
        en: "This article focuses on steps and the hourly chart. For the full picture of how FitMesh merges multiple devices without duplicates, see [how FitMesh Sync works](/en/blog/come-funziona-fitmesh).",
        de: "Dieser Artikel konzentriert sich auf Schritte und das Stundendiagramm. Für das vollständige Bild, wie FitMesh mehrere Geräte ohne Duplikate zusammenführt, siehe [wie FitMesh Sync funktioniert](/de/blog/come-funziona-fitmesh).",
        fr: "Cet article se concentre sur les pas et le graphique horaire. Pour la vue d'ensemble de la façon dont FitMesh fusionne plusieurs appareils sans doublons, voir [comment fonctionne FitMesh Sync](/fr/blog/come-funziona-fitmesh).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Controlli pratici in Health Connect e Samsung Health",
        en: "Practical checks in Health Connect and Samsung Health",
        de: "Praktische Kontrollen in Health Connect und Samsung Health",
        fr: "Vérifications pratiques dans Health Connect et Samsung Health",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Apri Health Connect (Impostazioni > App > Health Connect > App connesse) e controlla quali app scrivono i passi: se sono più di una, un disallineamento occasionale è atteso, non un errore.",
          "Su Samsung Health, verifica se il conteggio passi arriva da un solo dispositivo cumulativo (es. l'orologio per l'intera giornata) o da più fonti separate: un conteggio cumulativo copre più ore ma non è granulare quanto una serie oraria reale.",
          "Guarda quante ore copre ciascuna fonte in una giornata tipica: una fonte che copre poche ore (es. solo mentre l'orologio è al polso) darà più spesso un grafico assente rispetto a una che copre l'intera giornata.",
          "Se il telefono resta a casa per alcune ore, il sensore passi del telefono smette di misurare in quella finestra: è una fonte con copertura parziale, non un guasto.",
        ],
        en: [
          "Open Health Connect (Settings > Apps > Health Connect > Connected apps) and check which apps write steps: if there's more than one, an occasional mismatch is expected, not a bug.",
          "On Samsung Health, check whether the step count comes from a single cumulative device (e.g. the watch tracking the whole day) or from several separate sources: a cumulative count covers more hours but isn't as granular as a real hourly series.",
          "Look at how many hours each source covers on a typical day: a source that only covers a few hours (e.g. only while the watch is on your wrist) will more often show no chart than one that covers the full day.",
          "If your phone stays at home for a few hours, the phone's step sensor stops measuring during that window: that's a source with partial coverage, not a malfunction.",
        ],
        de: [
          "Öffne Health Connect (Einstellungen > Apps > Health Connect > Verbundene Apps) und prüfe, welche Apps Schritte schreiben: Sind es mehrere, ist eine gelegentliche Abweichung zu erwarten, kein Fehler.",
          "Prüfe bei Samsung Health, ob die Schrittzahl von einem einzigen kumulativen Gerät stammt (z. B. der Uhr, die den ganzen Tag erfasst) oder von mehreren getrennten Quellen: Eine kumulative Zählung deckt mehr Stunden ab, ist aber nicht so granular wie eine echte Stundenreihe.",
          "Schau dir an, wie viele Stunden jede Quelle an einem typischen Tag abdeckt: Eine Quelle, die nur wenige Stunden abdeckt (z. B. nur wenn die Uhr am Handgelenk ist), zeigt häufiger kein Diagramm als eine, die den ganzen Tag abdeckt.",
          "Bleibt dein Telefon ein paar Stunden zu Hause, misst der Schrittsensor des Telefons in diesem Zeitraum nicht: Das ist eine Quelle mit teilweiser Abdeckung, kein Defekt.",
        ],
        fr: [
          "Ouvrez Health Connect (Paramètres > Applications > Health Connect > Applications connectées) et vérifiez quelles applications écrivent les pas : s'il y en a plusieurs, un écart occasionnel est normal, pas un bug.",
          "Sur Samsung Health, vérifiez si le nombre de pas provient d'un seul appareil cumulatif (par ex. la montre qui suit toute la journée) ou de plusieurs sources distinctes : un comptage cumulatif couvre plus d'heures mais est moins précis qu'une vraie série horaire.",
          "Regardez combien d'heures chaque source couvre sur une journée type : une source qui ne couvre que quelques heures (par ex. seulement quand la montre est au poignet) affichera plus souvent l'absence de graphique qu'une source couvrant toute la journée.",
          "Si votre téléphone reste à la maison pendant quelques heures, son capteur de pas cesse de mesurer pendant cette période : c'est une source à couverture partielle, pas une panne.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Limite della fonte o bug: come distinguerli",
        en: "Source limitation or bug: how to tell the difference",
        de: "Grenze der Quelle oder Fehler: wie man es unterscheidet",
        fr: "Limite de la source ou bug : comment faire la différence",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Un grafico assente in un giorno con più dispositivi, poche ore misurate da una fonte, o un dispositivo lasciato in carica, sono limiti attesi della copertura dei dati, non un errore di FitMesh. È invece il caso di scriverci se il grafico manca sistematicamente anche con un solo dispositivo che copre tutta la giornata, o se il totale del giorno stesso cambia in modo incoerente da un momento all'altro senza una spiegazione di copertura.",
        en: "A missing chart on a day with multiple devices, a source that only measured a few hours, or a device left charging, are expected limits of data coverage, not a FitMesh error. It's worth writing to us if the chart is systematically missing even with a single device that covers the full day, or if the day's total itself changes inconsistently from one moment to the next with no coverage explanation.",
        de: "Ein fehlendes Diagramm an einem Tag mit mehreren Geräten, eine Quelle, die nur wenige Stunden gemessen hat, oder ein zum Laden liegen gelassenes Gerät sind zu erwartende Grenzen der Datenabdeckung, kein FitMesh-Fehler. Es lohnt sich, uns zu schreiben, wenn das Diagramm systematisch fehlt, selbst bei einem einzigen Gerät, das den ganzen Tag abdeckt, oder wenn sich das Tagestotal selbst ohne Erklärung durch die Abdeckung uneinheitlich ändert.",
        fr: "Un graphique absent un jour avec plusieurs appareils, une source n'ayant mesuré que quelques heures, ou un appareil laissé en charge, sont des limites attendues de la couverture des données, pas une erreur de FitMesh. Il vaut la peine de nous écrire si le graphique manque systématiquement même avec un seul appareil couvrant toute la journée, ou si le total du jour lui-même change de façon incohérente sans explication liée à la couverture.",
      },
    },
    {
      type: "fitmesh-editorial-cta",
      contentCluster: "multi_device_dedup",
      placement: "article_end",
      title: {
        it: "Vedi come FitMesh gestisce i tuoi dispositivi",
        en: "See how FitMesh handles your devices",
        de: "Sieh, wie FitMesh mit deinen Geräten umgeht",
        fr: "Découvrez comment FitMesh gère vos appareils",
      },
      body: {
        it: "FitMesh unisce orologio, anello e telefono in un'unica dashboard, mostrando sempre da quale fonte arriva ogni dato quando è utile saperlo.",
        en: "FitMesh brings your watch, ring and phone together in one dashboard, always showing which source a metric comes from when it's useful to know.",
        de: "FitMesh führt Uhr, Ring und Telefon in einem Dashboard zusammen und zeigt immer, aus welcher Quelle ein Wert stammt, wenn das nützlich ist.",
        fr: "FitMesh réunit votre montre, votre bague et votre téléphone dans un seul tableau de bord, en indiquant toujours la source d'une donnée quand c'est utile.",
      },
      benefits: {
        it: [
          "Passi contati una volta sola, senza somme indiscriminate tra dispositivi",
          "Fonte del dato indicata quando più di un dispositivo misura la stessa cosa",
          "Grafico orario coerente col totale, mai forzato",
        ],
        en: [
          "Steps counted once, no indiscriminate adding across devices",
          "Data source shown when more than one device measures the same thing",
          "Hourly chart consistent with the total, never forced",
        ],
        de: [
          "Schritte werden nur einmal gezählt, kein wahlloses Aufaddieren über Geräte hinweg",
          "Datenquelle angezeigt, wenn mehr als ein Gerät dasselbe misst",
          "Stundendiagramm stimmt mit dem Total überein, nie erzwungen",
        ],
        fr: [
          "Pas comptés une seule fois, sans addition indiscriminée entre appareils",
          "Source de la donnée indiquée quand plusieurs appareils mesurent la même chose",
          "Graphique horaire cohérent avec le total, jamais forcé",
        ],
      },
      secondaryHref: {
        it: "/it/blog/come-funziona-fitmesh",
        en: "/en/blog/come-funziona-fitmesh",
        de: "/de/blog/come-funziona-fitmesh",
        fr: "/fr/blog/come-funziona-fitmesh",
      },
      secondaryLabel: {
        it: "Come funziona FitMesh Sync",
        en: "How FitMesh Sync works",
        de: "Wie FitMesh Sync funktioniert",
        fr: "Comment fonctionne FitMesh Sync",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Perché oggi non vedo il grafico orario dei passi?",
        en: "Why don't I see the hourly steps chart today?",
        de: "Warum sehe ich heute kein Stundendiagramm für Schritte?",
        fr: "Pourquoi je ne vois pas le graphique horaire des pas aujourd'hui ?",
      },
      a: {
        it: "Succede quando il dettaglio orario disponibile non può essere mostrato come rappresentazione affidabile del tuo totale del giorno: perché viene da una fonte diversa da quella del totale, perché la sua provenienza non è verificabile, oppure perché i numeri sono incoerenti tra loro. In tutti questi casi FitMesh non disegna quella curva, anche se i dati orari esistono: preferisce non mostrarla piuttosto che presentarla come se fosse il tuo giorno intero. Il totale resta comunque visibile, ma il grafico orario non è garantito essere sempre completo.",
        en: "This happens when the available hourly detail can't be shown as a reliable picture of your day's total: because it comes from a source other than the total's, because its provenance isn't verifiable, or because the numbers don't add up. In every one of these cases, FitMesh won't draw that curve, even though the hourly data exists: it would rather not show it than present it as if it were your whole day. The total stays visible regardless, but the hourly chart isn't guaranteed to always be complete.",
        de: "Das passiert, wenn die verfügbaren stündlichen Daten nicht als verlässliche Darstellung deines Tagestotals gezeigt werden können: weil sie aus einer anderen Quelle als das Total stammen, weil ihre Herkunft nicht überprüfbar ist, oder weil die Zahlen untereinander widersprüchlich sind. In all diesen Fällen zeichnet FitMesh diese Kurve nicht, auch wenn die stündlichen Daten vorhanden sind: Es zeigt sie lieber gar nicht, als sie so darzustellen, als wäre es dein ganzer Tag. Das Total bleibt trotzdem sichtbar, das Stundendiagramm ist aber nicht garantiert immer vollständig.",
        fr: "Cela arrive quand le détail horaire disponible ne peut pas être présenté comme une représentation fiable de votre total du jour : parce qu'il provient d'une source différente de celle du total, parce que sa provenance n'est pas vérifiable, ou parce que les chiffres sont incohérents entre eux. Dans tous ces cas, FitMesh préfère ne pas tracer cette courbe plutôt que de la montrer comme si elle représentait toute votre journée : le total reste visible malgré tout, mais le graphique horaire n'est pas garanti d'être toujours complet.",
      },
    },
    {
      q: {
        it: "La linea tratteggiata è il mio obiettivo di passi?",
        en: "Is the dashed line my steps goal?",
        de: "Ist die gestrichelte Linie mein Schrittziel?",
        fr: "La ligne pointillée est-elle mon objectif de pas ?",
      },
      a: {
        it: "No. È la tua media personale calcolata sui giorni di calendario precedenti con un dato reale (fino a 7, almeno 3 per essere disegnata). Non rappresenta un obiettivo che ti sei dato.",
        en: "No. It's your own average calculated over previous calendar days with a real value (up to 7, at least 3 for it to be drawn). It doesn't represent a goal you've set.",
        de: "Nein. Es ist dein eigener Durchschnitt aus den vorherigen Kalendertagen mit einem echten Wert (bis zu 7, mindestens 3, damit sie gezeichnet wird). Sie stellt kein von dir gesetztes Ziel dar.",
        fr: "Non. C'est votre propre moyenne calculée sur les jours calendaires précédents avec une vraie valeur (jusqu'à 7, au moins 3 pour qu'elle soit tracée). Elle ne représente pas un objectif que vous vous êtes fixé.",
      },
    },
    {
      q: {
        it: "Posso forzare la comparsa del grafico orario?",
        en: "Can I force the hourly chart to show up?",
        de: "Kann ich erzwingen, dass das Stundendiagramm erscheint?",
        fr: "Puis-je forcer l'apparition du graphique horaire ?",
      },
      a: {
        it: "No, e non lo vorresti davvero: forzarlo vorrebbe dire riscalare o inventare dati per farli combaciare col totale. Se vuoi un grafico più spesso presente, la cosa che aiuta davvero è aumentare la copertura oraria della fonte che tieni sempre con te (per esempio indossando l'orologio o l'anello più a lungo durante la giornata).",
        en: "No, and you wouldn't really want to: forcing it would mean rescaling or making up data to match the total. If you want the chart to show up more often, what actually helps is increasing the hourly coverage of the source you keep on you most (for example wearing your watch or ring longer during the day).",
        de: "Nein, und das würdest du auch nicht wirklich wollen: Das würde bedeuten, Daten zu skalieren oder zu erfinden, damit sie zum Total passen. Wenn du möchtest, dass das Diagramm häufiger erscheint, hilft es wirklich, die stündliche Abdeckung der Quelle zu erhöhen, die du am meisten bei dir trägst (zum Beispiel Uhr oder Ring länger am Tag tragen).",
        fr: "Non, et vous ne le voudriez pas vraiment : le forcer signifierait remettre à l'échelle ou inventer des données pour correspondre au total. Si vous voulez que le graphique apparaisse plus souvent, ce qui aide vraiment, c'est d'augmenter la couverture horaire de la source que vous gardez le plus sur vous (par exemple porter votre montre ou votre bague plus longtemps dans la journée).",
      },
    },
    {
      q: {
        it: "Questo vale anche per altre metriche, non solo i passi?",
        en: "Does this apply to other metrics too, not just steps?",
        de: "Gilt das auch für andere Messwerte, nicht nur Schritte?",
        fr: "Cela s'applique-t-il aussi à d'autres métriques, pas seulement aux pas ?",
      },
      a: {
        it: "Il principio di non sommare fonti diverse e di preferire quella più coerente vale in generale per i dati cumulativi. Il meccanismo esatto descritto qui, con l'uguaglianza tra somma oraria e totale, riguarda specificamente i passi.",
        en: "The principle of not adding sources together and preferring the more consistent one applies generally to cumulative data. The exact mechanism described here, matching the hourly sum against the total, is specific to steps.",
        de: "Das Prinzip, Quellen nicht zu addieren und die konsistentere zu bevorzugen, gilt generell für kumulative Daten. Der hier beschriebene genaue Mechanismus mit dem Abgleich von Stundensumme und Total bezieht sich speziell auf Schritte.",
        fr: "Le principe consistant à ne pas additionner les sources et à privilégier la plus cohérente s'applique en général aux données cumulatives. Le mécanisme exact décrit ici, avec la correspondance entre la somme horaire et le total, est spécifique aux pas.",
      },
    },
  ],
  // P1.9-10: alt reale della cover, scritto a mano nelle 4 locale pubblicate.
  // Descrive l'IMMAGINE (non ripete l'H1/keyword) - vedi coverAlt() in covers.ts.
  coverAlt: {
    it: "Illustrazione di smartwatch e smart ring che inviano dati a un telefono, con confronto tra totale dei passi e grafico orario.",
    en: "Illustration of a smartwatch and smart ring sending data to a phone, with a comparison between the daily step total and hourly chart.",
    de: "Illustration einer Smartwatch und eines Smart Rings, die Daten an ein Smartphone senden, mit Vergleich von Tagesschritten und Stundendiagramm.",
    fr: "Illustration d'une montre connectée et d'une bague connectée envoyant des données à un téléphone, avec comparaison du total quotidien et du graphique horaire.",
  },
  related: [
    "novita-fonte-del-dato",
    "fitmesh-samsung-health-usarli-insieme",
    "novita-dashboard-multi-device",
    "come-funziona-fitmesh",
    "health-connect-not-syncing",
  ],
};
