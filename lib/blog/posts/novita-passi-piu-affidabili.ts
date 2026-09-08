import type { BlogPost } from "../types";

/**
 * MICRO-GATE PR#66-B (08/09/2026): voce /novita della release 190, pubblicata
 * il giorno reale del merge — non la data della bozza dell'articolo evergreen
 * gemello (steps-total-vs-hourly-chart.ts, stesso branch). Descrive SOLO
 * comportamento verificato nella build pubblica 3.9.9 (Play Store "Updated
 * on Sep 2, 2026", App Store "Version 3.9.9 · 5d ago", entrambi confermati
 * l'08/09/2026) e nei commit reali del ramo app 190 (c45f5cd4, 68a6d1b3,
 * e31c0b57, 2e370a97, 56ec3d77, 03dc4881). Stesso perimetro di 4 lingue
 * dell'articolo di approfondimento collegato, per la stessa ragione: un
 * argomento tecnico sottile, dove una traduzione imprecisa costa più di una
 * lingua in meno.
 */
export const post: BlogPost = {
  slug: "novita-passi-piu-affidabili",
  category: "news",
  publishedAt: "2026-09-08",
  updatedAt: "2026-09-08",
  ldType: "BlogPosting",
  readMinutes: 3,
  primaryKeyword: {
    it: "fitmesh passi più precisi",
    en: "fitmesh more reliable steps",
    de: "fitmesh zuverlässigere schritte",
    fr: "fitmesh pas plus fiables",
  },
  secondaryKeywords: {
    it: [
      "grafico passi fitmesh aggiornamento",
      "totale passi diverso dal grafico risolto",
      "fitmesh versione 190",
      "linea tratteggiata media passi",
      "fitmesh più dispositivi passi doppi",
    ],
    en: [
      "fitmesh steps chart update",
      "steps total different from chart fixed",
      "fitmesh version 190",
      "dashed line steps average",
      "fitmesh multiple devices duplicate steps",
    ],
    de: [
      "fitmesh schritte diagramm update",
      "schritte gesamt stimmt nicht mit diagramm überein behoben",
      "fitmesh version 190",
      "gestrichelte linie schritte durchschnitt",
      "fitmesh mehrere geräte doppelte schritte",
    ],
    fr: [
      "mise à jour graphique des pas fitmesh",
      "total des pas différent du graphique corrigé",
      "fitmesh version 190",
      "ligne pointillée moyenne des pas",
      "fitmesh plusieurs appareils pas en double",
    ],
  },
  metaDescription: {
    it: "Cosa cambia nella versione 190 di FitMesh Sync: il totale passi del giorno e il grafico orario diventano più coerenti tra loro, senza numeri inventati.",
    en: "What changes in FitMesh Sync version 190: the day's steps total and the hourly chart become more consistent with each other, with no made-up numbers.",
    de: "Was sich in FitMesh Sync Version 190 ändert: Tagestotal und Stundendiagramm der Schritte werden konsistenter, ohne erfundene Zahlen.",
    fr: "Ce qui change dans la version 190 de FitMesh Sync : le total de pas du jour et le graphique horaire deviennent plus cohérents entre eux, sans chiffres inventés.",
  },
  tldr: {
    it: [
      "Il totale passi del giorno è scelto dalla fonte più coerente e con più ore misurate quel giorno, non da chi ha semplicemente il numero più alto.",
      "Il grafico orario compare solo quando la somma delle ore combacia esattamente col totale ufficiale: altrimenti resta nascosto, e il totale del giorno resta comunque visibile.",
      "La linea tratteggiata sul grafico è la tua media personale degli ultimi giorni (fino a 7, solo giorni con un dato reale), non un obiettivo di passi.",
    ],
    en: [
      "The day's steps total is chosen from the most consistent source with the most hours measured that day, not simply whichever has the biggest number.",
      "The hourly chart only appears when the sum of the hours matches the official total exactly: otherwise it stays hidden, and the day's total is still shown.",
      "The dashed line on the chart is your own average from previous days (up to 7, real data only), not a steps goal.",
    ],
    de: [
      "Das Tagestotal der Schritte wird aus der konsistentesten Quelle mit den meisten an diesem Tag gemessenen Stunden gewählt, nicht einfach aus der mit der größten Zahl.",
      "Das Stundendiagramm erscheint nur, wenn die Summe der Stunden exakt mit dem offiziellen Total übereinstimmt: sonst bleibt es ausgeblendet, das Tagestotal wird trotzdem angezeigt.",
      "Die gestrichelte Linie im Diagramm ist dein eigener Durchschnitt der letzten Tage (bis zu 7, nur echte Daten), kein Schrittziel.",
    ],
    fr: [
      "Le total de pas du jour est choisi à partir de la source la plus cohérente et ayant mesuré le plus d'heures ce jour-là, pas simplement celle avec le chiffre le plus élevé.",
      "Le graphique horaire n'apparaît que lorsque la somme des heures correspond exactement au total officiel : sinon il reste masqué, et le total du jour reste affiché.",
      "La ligne pointillée sur le graphique est votre propre moyenne des jours précédents (jusqu'à 7, données réelles uniquement), pas un objectif de pas.",
    ],
  },
  hero: {
    kicker: {
      it: "Novità",
      en: "What's New",
      de: "Neuigkeit",
      fr: "Nouveauté",
    },
    title: {
      it: "Passi più affidabili: cosa cambia nella 190",
      en: "More reliable steps: what changes in 190",
      de: "Zuverlässigere Schritte: was sich in 190 ändert",
      fr: "Des pas plus fiables : ce qui change dans la 190",
    },
    subtitle: {
      it: "Il totale del giorno e il grafico orario ora raccontano solo quello che è stato davvero misurato: niente somme gonfiate tra più dispositivi, niente grafico che inventa i dati mancanti per tornare col numero grande.",
      en: "The day's total and the hourly chart now only tell you what was actually measured: no inflated sums across devices, no chart making up missing data just to match the big number.",
      de: "Tagestotal und Stundendiagramm zeigen jetzt nur noch das, was tatsächlich gemessen wurde: keine aufgeblähten Summen über mehrere Geräte, kein Diagramm, das fehlende Daten erfindet, nur um zur großen Zahl zu passen.",
      fr: "Le total du jour et le graphique horaire ne racontent désormais que ce qui a réellement été mesuré : aucune somme gonflée entre plusieurs appareils, aucun graphique n'inventant des données manquantes pour coller au grand chiffre.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se indossi più di un dispositivo — un orologio di giorno e un anello di notte, per esempio — capire quanti passi hai fatto davvero non dovrebbe dipendere da quale fonte ha il numero più grande. Con questo aggiornamento, FitMesh sceglie il totale del giorno guardando quale fonte è più coerente al proprio interno e ha effettivamente misurato più ore, non quale ha semplicemente sommato o gonfiato di più. Lo stesso principio guida anche il grafico orario e la linea tratteggiata sul grafico dei passi.",
        en: "If you wear more than one device — a watch during the day and a ring at night, for example — understanding how many steps you actually took shouldn't depend on which source happens to report the biggest number. With this update, FitMesh chooses the day's total by looking at which source is most internally consistent and actually measured the most hours, not whichever added up or inflated the most. The same principle now also shapes the hourly chart and the dashed line on the steps chart.",
        de: "Wenn du mehr als ein Gerät trägst — zum Beispiel tagsüber eine Uhr und nachts einen Ring — sollte die tatsächliche Anzahl deiner Schritte nicht davon abhängen, welche Quelle zufällig die größte Zahl meldet. Mit diesem Update wählt FitMesh das Tagestotal danach aus, welche Quelle in sich am konsistentesten ist und tatsächlich die meisten Stunden gemessen hat, nicht danach, welche am meisten addiert oder aufgebläht hat. Dasselbe Prinzip bestimmt jetzt auch das Stundendiagramm und die gestrichelte Linie im Schritte-Diagramm.",
        fr: "Si vous portez plusieurs appareils — une montre le jour et une bague la nuit, par exemple — comprendre combien de pas vous avez réellement faits ne devrait pas dépendre de la source qui affiche le plus grand chiffre. Avec cette mise à jour, FitMesh choisit le total du jour en fonction de la source la plus cohérente en interne et ayant réellement mesuré le plus d'heures, pas celle qui a le plus additionné ou gonflé le chiffre. Le même principe régit désormais aussi le graphique horaire et la ligne pointillée du graphique des pas.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Le tre cose che cambi vedendo",
        en: "The three things you'll notice",
        de: "Die drei Dinge, die du bemerken wirst",
        fr: "Les trois choses que vous remarquerez",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Il totale del giorno** viene scelto dalla fonte più coerente e con la copertura oraria migliore per quel giorno specifico, non dal numero più alto tra le fonti disponibili.",
          "**Il grafico orario** compare solo quando la somma di tutte le ore combacia esattamente col totale ufficiale del giorno: se non combacia resta nascosto, senza riscalare i numeri per farli tornare, e il totale del giorno resta comunque visibile.",
          "**La linea tratteggiata** è la tua media personale calcolata sui giorni precedenti con un dato reale (fino a 7, minimo 3 per essere disegnata), non un obiettivo di passi fissato da FitMesh.",
        ],
        en: [
          "**The day's total** is chosen from the source that's most internally consistent and has the best hourly coverage for that specific day, not the highest number among the available sources.",
          "**The hourly chart** only appears when the sum of every hour matches the day's official total exactly: if it doesn't match, the chart stays hidden with no rescaling to force the numbers to line up, and the day's total is still shown.",
          "**The dashed line** is your own average calculated over previous days with real data (up to 7, a minimum of 3 to be drawn at all), not a steps goal set by FitMesh.",
        ],
        de: [
          "**Das Tagestotal** wird aus der Quelle gewählt, die in sich am konsistentesten ist und für diesen bestimmten Tag die beste stündliche Abdeckung hat, nicht aus der mit der höchsten Zahl unter den verfügbaren Quellen.",
          "**Das Stundendiagramm** erscheint nur, wenn die Summe aller Stunden exakt mit dem offiziellen Tagestotal übereinstimmt: Stimmt sie nicht überein, bleibt das Diagramm ausgeblendet, ohne Skalierung, um die Zahlen passend zu machen, und das Tagestotal wird trotzdem angezeigt.",
          "**Die gestrichelte Linie** ist dein eigener Durchschnitt, berechnet über vorherige Tage mit echten Daten (bis zu 7, mindestens 3, damit sie überhaupt gezeichnet wird), kein von FitMesh festgelegtes Schrittziel.",
        ],
        fr: [
          "**Le total du jour** est choisi à partir de la source la plus cohérente en interne et disposant de la meilleure couverture horaire pour ce jour précis, pas le chiffre le plus élevé parmi les sources disponibles.",
          "**Le graphique horaire** n'apparaît que lorsque la somme de toutes les heures correspond exactement au total officiel du jour : si elle ne correspond pas, le graphique reste masqué sans remise à l'échelle pour faire coïncider les chiffres, et le total du jour reste affiché.",
          "**La ligne pointillée** est votre propre moyenne calculée sur les jours précédents avec des données réelles (jusqu'à 7, un minimum de 3 pour être tracée), pas un objectif de pas fixé par FitMesh.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Il dettaglio tecnico completo",
        en: "The full technical detail",
        de: "Die vollständigen technischen Details",
        fr: "Le détail technique complet",
      },
      body: {
        it: "Questo aggiornamento spiega solo cosa cambia. Per il perché e per ogni caso limite (fonti in forte disaccordo, giorni con meno di 3 dati validi, e altro), c'è la guida completa: [il totale dei passi non coincide col grafico orario](/it/blog/steps-total-vs-hourly-chart).",
        en: "This update explains only what changes. For the why, and every edge case (sources that disagree sharply, days with fewer than 3 valid data points, and more), there's the full guide: [the steps total doesn't match the hourly chart](/en/blog/steps-total-vs-hourly-chart).",
        de: "Dieses Update erklärt nur, was sich ändert. Für das Warum und jeden Grenzfall (stark widersprüchliche Quellen, Tage mit weniger als 3 gültigen Datenpunkten und mehr) gibt es die vollständige Anleitung: [Schritte-Gesamtwert stimmt nicht mit dem Stundendiagramm überein](/de/blog/steps-total-vs-hourly-chart).",
        fr: "Cette mise à jour explique uniquement ce qui change. Pour le pourquoi et chaque cas limite (sources en fort désaccord, jours avec moins de 3 points de données valides, et plus), voici le guide complet : [le total des pas ne correspond pas au graphique horaire](/fr/blog/steps-total-vs-hourly-chart).",
      },
    },
  ],
  related: ["steps-total-vs-hourly-chart", "come-funziona-fitmesh"],
};
