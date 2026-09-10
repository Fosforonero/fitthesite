import type { BlogPost } from "../types";

/**
 * SPRINT novità 3.10.0/191 (10/09/2026): voce /novita della release 191.
 * Fonte: AppFitmesh/CHANGELOG.md al tag v3.10.0+191, commit
 * 9e5e80d32ed87b2c8dc9403ccd41812a856f2603 (verificato via `git rev-list`).
 * Descrive solo tre temi verificati con prova diretta sul codice reale a
 * quel tag: navigazione dei giorni passati, meccanica del grafico orario
 * (7 stati in flutter_app/lib/features/dashboard/domain/
 * serie_oraria_parziale.dart, collegamento al widget reale confermato in
 * dashboard_screen.dart:6339-6845), e due correzioni di accesso Google.
 *
 * Esplicitamente escluso, per mandato: manifesto privacy iOS, pressione/
 * anello/R02 (docs/colmi-r02-protocol-gap-audit.md, backlog ampio e ancora
 * aperto), qualunque menzione di iPhone 18/Duo/iOS 27, e la frase sulla
 * verifica-accesso quando il server non risponde (dipendenza dal backend
 * del 401 a tre stati non confermata — resta una domanda aperta
 * all'agente app, non una dipendenza di questa PR).
 *
 * publishedAt/updatedAt: GO PUBBLICAZIONE (10/09/2026, stesso giorno della
 * preparazione) — data reale di pubblicazione, non più un placeholder.
 * Disponibilità store riverificata a questa stessa data/ora: iOS live sulla
 * 3.10.0 ("1 h fa"), Android ancora sulla 3.9.9 — nota esplicita nel corpo
 * dell'articolo (primo blocco, callout "Disponibilità"), senza promesse di
 * tempi, come da mandato.
 */
export const post: BlogPost = {
  slug: "novita-giorni-passati",
  category: "news",
  publishedAt: "2026-09-10",
  updatedAt: "2026-09-10",
  ldType: "BlogPosting",
  readMinutes: 3,
  // Titolo SEO alternativo (< H1): l'H1 contiene "FitMesh Sync 3.10.0" per
  // rispecchiare la versione visibile sullo store. Il renderer aggiunge
  // " · FitMesh" UNA volta sola in generateMetadata (via blogSeoTitle,
  // lib/blog/types.ts) — senza questo campo il <title> ripeterebbe
  // "FitMesh" due volte. Verificato che questo difetto esiste già,
  // fuori scope, su novita-fitmesh-su-app-store.ts (non toccato qui).
  seoTitle: {
    it: "Sync 3.10.0: giorni passati, dati più chiari",
    en: "Sync 3.10.0: Past Days, Clearer Data",
    de: "Sync 3.10.0: vergangene Tage, klarere Daten",
    fr: "Sync 3.10.0 : jours passés, données plus claires",
  },
  primaryKeyword: {
    it: "fitmesh 3.10.0 novità",
    en: "fitmesh 3.10.0 update",
    de: "fitmesh 3.10.0 update",
    fr: "fitmesh 3.10.0 nouveautés",
  },
  secondaryKeywords: {
    it: [
      "fitmesh giorni passati dashboard",
      "fitmesh grafico passi parziale",
      "fitmesh versione 191",
      "fitmesh accesso google errore",
    ],
    en: [
      "fitmesh past days dashboard",
      "fitmesh partial steps chart",
      "fitmesh version 191",
      "fitmesh google sign-in error",
    ],
    de: [
      "fitmesh vergangene tage dashboard",
      "fitmesh unvollständiges schritte diagramm",
      "fitmesh version 191",
      "fitmesh google anmeldefehler",
    ],
    fr: [
      "fitmesh jours passés tableau de bord",
      "fitmesh graphique des pas partiel",
      "fitmesh version 191",
      "fitmesh erreur connexion google",
    ],
  },
  metaDescription: {
    it: "Cosa cambia nella versione 3.10.0 di FitMesh Sync: navigazione dei giorni passati, grafico dei passi più onesto sui dati parziali, accesso Google più chiaro.",
    en: "What changes in FitMesh Sync version 3.10.0: navigating past days, a more honest steps chart about partial data, clearer Google sign-in.",
    de: "Was sich in FitMesh Sync Version 3.10.0 ändert: Navigation durch vergangene Tage, ein ehrlicheres Schritte-Diagramm bei unvollständigen Daten, klarere Google-Anmeldung.",
    fr: "Ce qui change dans la version 3.10.0 de FitMesh Sync : navigation dans les jours passés, un graphique des pas plus honnête sur les données partielles, connexion Google plus claire.",
  },
  tldr: {
    it: [
      "Puoi scegliere un giorno passato e tutta la schermata lo segue: etichette, finestre storiche e punteggi non restano più agganciati a oggi.",
      "Quando il dettaglio orario dei passi è utilizzabile e viene dalla stessa fonte del totale, il grafico può mostrarsi anche parziale, dichiarandolo; se la provenienza non è verificabile, è diversa o i dati sono incoerenti, FitMesh non mostra quella curva anche se i dati orari esistono.",
      "Il rientro dopo una disconnessione automatica di Google è più diretto, e gli errori di accesso si leggono più chiaramente.",
    ],
    en: [
      "You can pick a past day and the whole screen follows it: labels, historical windows, and scores are no longer locked to today.",
      "When hourly step detail is usable and comes from the same source as the total, the chart can show up even when partial, saying so; if the provenance isn't verifiable, comes from elsewhere, or the numbers don't add up, FitMesh won't show that curve even though the hourly data exists.",
      "Getting back in after an automatic Google sign-out is more straightforward, and sign-in errors are easier to read.",
    ],
    de: [
      "Du kannst einen vergangenen Tag auswählen, und der ganze Bildschirm folgt ihm: Beschriftungen, historische Zeitfenster und Werte bleiben nicht mehr an heute hängen.",
      "Wenn das stündliche Schritte-Detail nutzbar ist und aus derselben Quelle wie der Gesamtwert stammt, kann das Diagramm auch unvollständig angezeigt werden — mit entsprechendem Hinweis; ist die Herkunft nicht überprüfbar, stammt sie aus einer anderen Quelle, oder sind die Zahlen widersprüchlich, zeigt FitMesh diese Kurve nicht, auch wenn die stündlichen Daten vorhanden sind.",
      "Die Rückkehr nach einer automatischen Google-Abmeldung ist direkter, und Anmeldefehler sind besser lesbar.",
    ],
    fr: [
      "Vous pouvez choisir un jour passé et tout l'écran le suit : libellés, fenêtres historiques et scores ne restent plus figés sur aujourd'hui.",
      "Quand le détail horaire des pas est exploitable et provient de la même source que le total, le graphique peut s'afficher même partiel, en le signalant ; si la provenance n'est pas vérifiable, provient d'ailleurs, ou si les chiffres sont incohérents, FitMesh n'affiche pas cette courbe, même si les données horaires existent.",
      "Le retour après une déconnexion automatique de Google est plus direct, et les erreurs de connexion se lisent plus clairement.",
    ],
  },
  hero: {
    kicker: {
      it: "Novità",
      en: "News",
      de: "Neuigkeiten",
      fr: "Actualité",
    },
    title: {
      it: "FitMesh Sync 3.10.0: giorni passati e dati più chiari",
      en: "FitMesh Sync 3.10.0: Past Days and Clearer Data",
      de: "FitMesh Sync 3.10.0: vergangene Tage und klarere Daten",
      fr: "FitMesh Sync 3.10.0 : jours passés et données plus claires",
    },
    subtitle: {
      it: "La dashboard ora segue il giorno che stai guardando, non solo oggi — e i grafici dicono con onestà quando un dato è solo parziale.",
      en: "The dashboard now follows the day you're looking at, not just today — and the charts honestly flag when a reading is only partial.",
      de: "Das Dashboard folgt jetzt dem Tag, den du dir ansiehst, nicht nur heute — und die Diagramme sagen ehrlich, wann ein Wert nur teilweise vorliegt.",
      fr: "Le tableau de bord suit désormais le jour que vous consultez, pas seulement aujourd'hui — et les graphiques indiquent honnêtement quand une donnée n'est que partielle.",
    },
  },
  body: [
    {
      // GO PUBBLICAZIONE (10/09/2026): disponibilità store asimmetrica al
      // momento della pubblicazione — iOS live, Android ancora sulla 3.9.9.
      // Nota esplicita, senza promesse di tempi, per mandato. Da rimuovere
      // quando anche Android sarà verificato live sulla 3.10.0 (non
      // automatico: richiede una modifica successiva esplicita).
      type: "callout",
      variant: "info",
      title: {
        it: "Disponibilità",
        en: "Availability",
        de: "Verfügbarkeit",
        fr: "Disponibilité",
      },
      body: {
        it: "Disponibile su iOS. L'aggiornamento per Android è in arrivo.",
        en: "Available on iOS. The Android update is on its way.",
        de: "Verfügbar auf iOS. Das Update für Android ist unterwegs.",
        fr: "Disponible sur iOS. La mise à jour pour Android est en route.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La versione 3.10.0 (build 191) è soprattutto un aggiornamento su come la dashboard racconta i tuoi dati, non su nuove metriche.",
        en: "Version 3.10.0 (build 191) is mainly an update about how the dashboard tells the story of your data, not about new metrics.",
        de: "Version 3.10.0 (Build 191) ist vor allem ein Update darüber, wie das Dashboard deine Daten erzählt, nicht über neue Messwerte.",
        fr: "La version 3.10.0 (build 191) est avant tout une mise à jour sur la façon dont le tableau de bord raconte vos données, pas sur de nouvelles métriques.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Puoi guardare i giorni passati",
        en: "You can look back at past days",
        de: "Du kannst vergangene Tage ansehen",
        fr: "Vous pouvez consulter les jours passés",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Prima la dashboard mostrava solo oggi. Ora scegli un giorno e tutta la schermata — etichette, finestre storiche di cuore e punteggio, medie — lo segue davvero: il punteggio di un giorno passato non cambia più per quello che è successo dopo.",
        en: "Before, the dashboard only showed today. Now you pick a day and the whole screen — labels, historical heart-rate and score windows, averages — genuinely follows it: a past day's score no longer changes because of what happened afterward.",
        de: "Bisher zeigte das Dashboard nur heute. Jetzt wählst du einen Tag, und der ganze Bildschirm — Beschriftungen, historische Herzfrequenz- und Score-Fenster, Durchschnittswerte — folgt ihm wirklich: Der Score eines vergangenen Tages ändert sich nicht mehr durch das, was danach passiert ist.",
        fr: "Avant, le tableau de bord n'affichait qu'aujourd'hui. Maintenant vous choisissez un jour et tout l'écran — libellés, fenêtres historiques de fréquence cardiaque et de score, moyennes — le suit vraiment : le score d'un jour passé ne change plus à cause de ce qui s'est passé après.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il grafico dei passi dice quello che sa",
        en: "The steps chart says what it knows",
        de: "Das Schritte-Diagramm sagt, was es weiß",
        fr: "Le graphique des pas dit ce qu'il sait",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Quando il dettaglio orario è utilizzabile e proviene dalla stessa fonte del totale, FitMesh può mostrare anche una curva parziale, dichiarandone i limiti. Ma se la provenienza non è verificabile, viene da una fonte diversa o i dati sono incoerenti, FitMesh non disegna quella curva — anche quando i dati orari esistono: la mostrerebbe come se fosse la forma di un numero che non è il suo. Il grafico orario non è quindi garantito coprire sempre l'intera giornata. La media dei giorni precedenti distingue inoltre tre casi — confrontabile, percorsi diversi, non verificabile — e quando non è verificabile resta testo, senza disegnare una linea che l'app non può sostenere.",
        en: "When hourly detail is usable and comes from the same source as the total, FitMesh can show even a partial curve, stating its limits. But if the provenance isn't verifiable, comes from a different source, or the numbers don't add up, FitMesh won't draw that curve — even when the hourly data exists: it would be showing the shape of a number that isn't its own. The hourly chart isn't guaranteed to always cover the full day. The average of previous days also distinguishes three cases — comparable, different paths, not verifiable — and when it's not verifiable, it stays text, without drawing a line the app can't back up.",
        de: "Wenn das stündliche Detail nutzbar ist und aus derselben Quelle wie der Gesamtwert stammt, kann FitMesh auch eine unvollständige Kurve zeigen und dabei ihre Grenzen benennen. Ist die Herkunft jedoch nicht überprüfbar, stammt sie aus einer anderen Quelle, oder sind die Zahlen widersprüchlich, zeichnet FitMesh diese Kurve nicht — selbst wenn die stündlichen Daten vorhanden sind: Es würde damit die Form einer Zahl zeigen, die nicht ihre eigene ist. Das Stundendiagramm deckt daher nicht garantiert immer den ganzen Tag ab. Der Durchschnitt der vorangegangenen Tage unterscheidet außerdem drei Fälle — vergleichbar, unterschiedliche Wege, nicht überprüfbar — und wenn er nicht überprüfbar ist, bleibt er Text, ohne eine Linie zu zeichnen, die die App nicht belegen kann.",
        fr: "Quand le détail horaire est exploitable et provient de la même source que le total, FitMesh peut afficher même une courbe partielle, en précisant ses limites. Mais si la provenance n'est pas vérifiable, provient d'une source différente, ou si les données sont incohérentes, FitMesh ne trace pas cette courbe — même quand les données horaires existent : ce serait montrer la forme d'un nombre qui n'est pas le sien. Le graphique horaire n'est donc pas garanti de toujours couvrir la journée entière. La moyenne des jours précédents distingue en outre trois cas — comparable, parcours différents, non vérifiable — et quand elle n'est pas vérifiable, elle reste du texte, sans tracer une ligne que l'appli ne peut pas justifier.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Accesso più chiaro",
        en: "Clearer sign-in",
        de: "Klarere Anmeldung",
        fr: "Connexion plus claire",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se l'accesso Google viene interrotto da solo, ora puoi rientrare subito, senza chiudere e riaprire l'app. Gli errori di accesso compaiono accanto al pulsante che li ha generati, con un testo comprensibile e nella tua lingua.",
        en: "If your Google access gets cut off on its own, you can now sign back in right away, without closing and reopening the app. Sign-in errors show up next to the button that triggered them, in plain language and in your own language.",
        de: "Wird der Google-Zugriff von selbst unterbrochen, kannst du dich jetzt sofort wieder anmelden, ohne die App zu schließen und neu zu öffnen. Anmeldefehler erscheinen direkt neben der Schaltfläche, die sie ausgelöst hat, verständlich formuliert und in deiner Sprache.",
        fr: "Si l'accès Google est coupé tout seul, vous pouvez désormais vous reconnecter immédiatement, sans fermer et rouvrir l'application. Les erreurs de connexion apparaissent à côté du bouton qui les a déclenchées, avec un texte compréhensible et dans votre langue.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Vuoi il dettaglio tecnico del grafico orario?",
        en: "Want the technical details behind the hourly chart?",
        de: "Möchtest du das technische Detail zum Stundendiagramm?",
        fr: "Vous voulez le détail technique du graphique horaire ?",
      },
      body: {
        it: "Questa notizia riassume cosa cambia. Per come FitMesh decide quando mostrare o meno la curva, vedi [il totale dei passi non coincide col grafico orario?](/it/blog/steps-total-vs-hourly-chart).",
        en: "This news post sums up what's changing. For how FitMesh decides when to show the curve — or not — see [why doesn't your steps total match the hourly chart?](/en/blog/steps-total-vs-hourly-chart).",
        de: "Diese Neuigkeit fasst zusammen, was sich ändert. Wie FitMesh entscheidet, wann die Kurve gezeigt wird oder nicht, erfährst du unter [Stimmt der Schritte-Gesamtwert nicht mit dem Stundendiagramm überein?](/de/blog/schritte-gesamt-stimmt-nicht-mit-stundendiagramm-ueberein).",
        fr: "Cette actualité résume ce qui change. Pour savoir comment FitMesh décide de montrer ou non la courbe, voir [le total des pas ne correspond pas au graphique horaire ?](/fr/blog/total-pas-ne-correspond-pas-au-graphique-horaire).",
      },
    },
  ],
  related: ["steps-total-vs-hourly-chart", "novita-passi-piu-affidabili", "come-funziona-fitmesh"],
};
