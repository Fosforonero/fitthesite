import type { BlogPost } from "../types";

// P1.8S (2026-08-06): nuovo articolo "perche' usare Samsung Health insieme a
// FitMesh" — angolo benefit-led, distinto dal pillar architetturale
// health-connect-vs-samsung-health.ts (che resta l'unico proprietario del
// tema "come funzionano insieme a livello tecnico"). Verificato in FASE 0
// dell'addendum: nessuna pagina esistente copriva questo intento.
//
// Ogni claim di feature qui e' tracciato al truth ledger prodotto (workflow
// forense read-only su AppFitmesh, FASE 1 dell'addendum, 70 tool call).
// Regole vincolanti applicate: nessun "sostituisce", nessun "tutti i dati",
// nessun "zero duplicati"/"mai doppio conteggio" assoluto, nessuna promessa
// di sync in tempo reale, VO2 max dichiarato ASSENTE (schema presente ma mai
// popolato nella build pubblicata), apnea dichiarata come flag booleano non
// AHI, nessuna metrica proprietaria Samsung (Energy Score ecc.) dichiarata
// disponibile, nessun coaching/ECG Samsung replicato.
//
// SPRINT P0.12 FASE 5 (06/08): aggiunte le traduzioni DE e FR complete
// (hero, seo, tldr, body, tabella, FAQ) — stesse regole vincolanti sopra
// verificate riga per riga per ogni negazione/limite in entrambe le lingue
// (nessun "ersetzt"/"remplace" assoluto, nessun "Echtzeit"/"temps réel",
// nessun claim medico/IA, VO2max e punteggi Samsung confermati assenti in
// entrambe). Slug reali assegnati in lib/blog/slugs.ts (non più
// placeholder). ctaHref fitness-data-sync: DE esiste (/de/fitness-data-sync,
// FITNESS_DATA_SYNC_COMPLETE_LOCALES include "de"), FR non esiste ancora
// (locale non supportata dalla route stessa) — la CTA in francese punta a
// /en/fitness-data-sync come fallback onesto, invece di un link rotto.
export const post: BlogPost = {
  slug: "fitmesh-samsung-health-usarli-insieme",
  category: "guides",
  publishedAt: "2026-08-06",
  updatedAt: "2026-09-02",
  hero: {
    kicker: { it: "Guida", en: "Guide", de: "Anleitung", fr: "Guide" },
    title: {
      it: "Cosa aggiunge FitMesh ai dati del tuo Galaxy Watch",
      en: "What FitMesh Adds to Your Galaxy Watch Data",
      de: "Was FitMesh zu den Daten Ihrer Galaxy Watch hinzufügt",
      fr: "Ce que FitMesh ajoute aux données de votre Galaxy Watch",
    },
    subtitle: {
      it: "Samsung Health resta il centro di controllo del tuo ecosistema Galaxy. FitMesh entra in gioco quando i tuoi dati arrivano anche da un anello, un'altra app o un altro dispositivo.",
      en: "Samsung Health stays the control center for your Galaxy ecosystem. FitMesh adds value when your data also comes from a ring, another app, or another device.",
      de: "Samsung Health bleibt die Schaltzentrale Ihres Galaxy-Ökosystems. FitMesh kommt ins Spiel, sobald Ihre Daten zusätzlich von einem Ring, einer anderen App oder einem anderen Gerät stammen.",
      fr: "Samsung Health reste le centre de contrôle de votre écosystème Galaxy. FitMesh apporte une valeur ajoutée lorsque vos données proviennent aussi d'un anneau connecté, d'une autre application ou d'un autre appareil.",
    },
  },
  seoTitle: {
    it: "Samsung Health e FitMesh: perché usarli insieme",
    en: "FitMesh vs Samsung Health: Why Use Both",
    de: "Samsung Health und FitMesh: Warum beides nutzen",
    fr: "Samsung Health et FitMesh : pourquoi utiliser les deux",
  },
  metaDescription: {
    it: "Samsung Health e FitMesh non fanno lo stesso lavoro. Cosa legge davvero FitMesh dal tuo Galaxy Watch, cosa aggiunge, e quando Samsung Health da solo basta.",
    en: "Samsung Health and FitMesh don't do the same job. What FitMesh actually reads from your Galaxy Watch, what it adds, and when Samsung Health alone is enough.",
    de: "Samsung Health und FitMesh erfüllen nicht dieselbe Aufgabe: Was FitMesh von Ihrer Galaxy Watch liest, was es ergänzt – und wann Samsung Health allein reicht.",
    fr: "Samsung Health et FitMesh n'ont pas le même rôle. Ce que FitMesh lit réellement sur votre Galaxy Watch, ce qu'il ajoute, et quand Samsung Health seul suffit.",
  },
  primaryKeyword: { it: "samsung health e fitmesh", en: "fitmesh with samsung health", de: "samsung health und fitmesh", fr: "fitmesh avec samsung health" },
  secondaryKeywords: {
    it: [
      "fitmesh galaxy watch",
      "samsung health anello e orologio insieme",
      "perché usare fitmesh con samsung health",
      "samsung health data sdk fitmesh",
      "dati samsung health doppi dispositivi",
      "fitmesh apnea samsung health",
    ],
    en: [
      "fitmesh galaxy watch",
      "samsung health ring and watch together",
      "why use fitmesh with samsung health",
      "samsung health data sdk fitmesh",
      "samsung health multiple devices duplicate data",
      "fitmesh sleep apnea samsung health",
    ],
    de: [
      "fitmesh galaxy watch",
      "samsung health ring und uhr zusammen",
      "warum fitmesh mit samsung health nutzen",
      "samsung health data sdk fitmesh",
      "samsung health mehrere geräte doppelte daten",
      "fitmesh schlafapnoe samsung health",
    ],
    fr: [
      "fitmesh galaxy watch",
      "samsung health anneau et montre ensemble",
      "pourquoi utiliser fitmesh avec samsung health",
      "samsung health data sdk fitmesh",
      "samsung health plusieurs appareils données en double",
      "fitmesh apnée du sommeil samsung health",
    ],
  },
  readMinutes: 10,
  tldr: {
    it: [
      "Samsung Health e FitMesh non sono alternative: Samsung Health gestisce il tuo ecosistema Galaxy, FitMesh aggiunge valore quando i dati arrivano anche da un anello, un'altra app o un altro sistema operativo.",
      "FitMesh legge Samsung Health in due modi: tramite Health Connect (layer di permessi Android) e, sui dispositivi Samsung con Android 10+, anche tramite una lettura diretta col Samsung Health Data SDK.",
      "Quando più fonti riportano lo stesso dato, FitMesh applica regole deterministiche fisse (non IA) per scegliere quale usare o colmare i buchi, senza sommare due volte lo stesso valore.",
      "FitMesh non legge i punteggi proprietari di Samsung (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score) né l'ECG: quelli restano solo nell'app Samsung Health.",
      "Il VO2 max non è oggi popolato da nessuna fonte reale in FitMesh, e l'apnea è un flag rilevato/non rilevato di Samsung Health Monitor, non un indice AHI clinico.",
    ],
    en: [
      "Samsung Health and FitMesh aren't alternatives: Samsung Health runs your Galaxy ecosystem, and FitMesh adds value when your data also comes from a ring, another app, or another operating system.",
      "FitMesh reads Samsung Health two ways: through Health Connect (Android's permissions layer) and, on Samsung devices running Android 10+, also through a direct read via the Samsung Health Data SDK.",
      "When more than one source reports the same value, FitMesh applies fixed, deterministic rules (not AI) to pick which one to use or fill gaps, without ever summing the same value twice.",
      "FitMesh does not read Samsung's proprietary scores (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score) or ECG readings: those stay inside the Samsung Health app only.",
      "VO2 max isn't currently populated by any real data source in FitMesh, and sleep apnea is a detected/not-detected flag from Samsung Health Monitor, not a clinical AHI index.",
    ],
    de: [
      "Samsung Health und FitMesh sind keine Alternativen zueinander: Samsung Health verwaltet Ihr Galaxy-Ökosystem, FitMesh schafft Mehrwert, sobald Ihre Daten zusätzlich von einem Ring, einer anderen App oder einem anderen Betriebssystem stammen.",
      "FitMesh liest Samsung Health auf zwei Wegen: über Health Connect (die Android-Berechtigungsebene) und, auf Samsung-Geräten mit Android 10+, zusätzlich über einen direkten Zugriff via Samsung Health Data SDK.",
      "Wenn mehrere Quellen denselben Wert melden, wendet FitMesh feste, deterministische Regeln an (keine KI), um zu entscheiden, welche Quelle verwendet wird oder Lücken füllt – ohne denselben Wert jemals doppelt zu addieren.",
      "FitMesh liest Samsungs proprietäre Scores nicht (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score) und auch kein EKG: Diese bleiben ausschließlich in der Samsung-Health-App.",
      "VO2max wird in FitMesh derzeit von keiner echten Quelle befüllt, und die Schlafapnoe ist ein Erkannt/Nicht-erkannt-Flag von Samsung Health Monitor, kein klinischer AHI-Index.",
    ],
    fr: [
      "Samsung Health et FitMesh ne sont pas des alternatives : Samsung Health gère votre écosystème Galaxy, FitMesh apporte une valeur ajoutée lorsque vos données proviennent aussi d'un anneau connecté, d'une autre application ou d'un autre système d'exploitation.",
      "FitMesh lit Samsung Health de deux manières : via Health Connect (la couche de permissions Android) et, sur les appareils Samsung sous Android 10 ou supérieur, également via une lecture directe avec le Samsung Health Data SDK.",
      "Lorsque plusieurs sources rapportent la même donnée, FitMesh applique des règles fixes et déterministes (pas d'IA) pour choisir laquelle utiliser ou combler les lacunes, sans jamais additionner deux fois la même valeur.",
      "FitMesh ne lit pas les scores propriétaires de Samsung (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score) ni l'ECG : ceux-ci restent uniquement dans l'application Samsung Health.",
      "Le VO2 max n'est actuellement alimenté par aucune source réelle dans FitMesh, et l'apnée du sommeil est un indicateur détecté/non détecté de Samsung Health Monitor, pas un indice AHI clinique.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se hai un Galaxy Watch, Samsung Health è già il posto giusto per configurarlo, vedere le misurazioni in tempo reale e gestire le notifiche. FitMesh non prova a sostituirlo: entra in gioco quando i tuoi dati di salute arrivano anche da altrove, per esempio un anello smart, un altro smartwatch, o quando passi da Android a iPhone e vuoi portarti dietro la cronologia.",
        en: "If you have a Galaxy Watch, Samsung Health is already the right place to set it up, see live readings, and manage notifications. FitMesh isn't trying to replace it: it comes in when your health data also comes from somewhere else — a smart ring, another smartwatch, or when you switch from Android to iPhone and want to keep your history.",
        de: "Wenn Sie eine Galaxy Watch besitzen, ist Samsung Health bereits der richtige Ort, um sie einzurichten, Live-Messwerte zu sehen und Benachrichtigungen zu verwalten. FitMesh versucht nicht, das zu ersetzen: Es kommt ins Spiel, sobald Ihre Gesundheitsdaten zusätzlich von woanders stammen – etwa einem Smart Ring, einer anderen Smartwatch, oder wenn Sie von Android zu iPhone wechseln und Ihren Verlauf mitnehmen möchten.",
        fr: "Si vous possédez une Galaxy Watch, Samsung Health reste l'endroit idéal pour la configurer, consulter vos mesures en direct et gérer les notifications. FitMesh ne cherche pas à le remplacer : il entre en jeu lorsque vos données de santé proviennent aussi d'ailleurs — un anneau connecté, une autre montre connectée, ou quand vous passez d'Android à iPhone et souhaitez conserver votre historique.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Samsung Health e FitMesh non fanno lo stesso lavoro",
        en: "Samsung Health and FitMesh don't do the same job",
        de: "Samsung Health und FitMesh erfüllen nicht dieselbe Aufgabe",
        fr: "Samsung Health et FitMesh n'ont pas le même rôle",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Samsung Health è l'app nativa del tuo ecosistema Galaxy: gestisce l'accoppiamento del Watch, le misurazioni avanzate (ECG, indice di stress, Samsung Health Monitor), il coaching Samsung e le impostazioni del dispositivo. Questo resta il suo lavoro, e FitMesh non lo tocca. FitMesh è una dashboard che riunisce i dati compatibili quando hai più di una fonte: un Galaxy Watch più un anello smart, per esempio, o un Galaxy Watch più un vecchio Fitbit prima di completare la migrazione. Per un confronto tecnico completo su come Samsung Health e Health Connect si passano i dati tra loro, la guida di riferimento è health-connect-vs-samsung-health; qui ci concentriamo su cosa cambia per te quando aggiungi FitMesh sopra a questo.",
        en: "Samsung Health is your Galaxy ecosystem's native app: it handles Watch pairing, advanced measurements (ECG, stress index, Samsung Health Monitor), Samsung's coaching, and device settings. That stays its job, and FitMesh doesn't touch it. FitMesh is a dashboard that brings together compatible data when you have more than one source: a Galaxy Watch plus a smart ring, for example, or a Galaxy Watch plus an old Fitbit while you're still migrating. For a full technical breakdown of how Samsung Health and Health Connect hand data to each other, the reference guide is health-connect-vs-samsung-health; here we focus on what changes for you once FitMesh sits on top of that.",
        de: "Samsung Health ist die native App Ihres Galaxy-Ökosystems: Sie verwaltet die Kopplung der Watch, erweiterte Messungen (EKG, Stressindex, Samsung Health Monitor), das Samsung-Coaching und die Geräteeinstellungen. Das bleibt ihre Aufgabe, und FitMesh rührt daran nichts. FitMesh ist ein Dashboard, das kompatible Daten zusammenführt, sobald Sie mehr als eine Quelle haben: zum Beispiel eine Galaxy Watch plus einen Smart Ring, oder eine Galaxy Watch plus einen alten Fitbit während der Migration. Für einen vollständigen technischen Vergleich, wie Samsung Health und Health Connect Daten austauschen, ist health-connect-vs-samsung-health die passende Referenz; hier konzentrieren wir uns darauf, was sich für Sie ändert, sobald FitMesh darauf aufsetzt.",
        fr: "Samsung Health est l'application native de votre écosystème Galaxy : elle gère l'appairage de la Watch, les mesures avancées (ECG, indice de stress, Samsung Health Monitor), le coaching Samsung et les réglages de l'appareil. Cela reste son rôle, et FitMesh n'y touche pas. FitMesh est un tableau de bord qui réunit les données compatibles lorsque vous avez plus d'une source : une Galaxy Watch plus un anneau connecté, par exemple, ou une Galaxy Watch plus un ancien Fitbit pendant votre migration. Pour une comparaison technique complète de la façon dont Samsung Health et Health Connect échangent leurs données, le guide de référence est health-connect-vs-samsung-health ; nous nous concentrons ici sur ce qui change pour vous une fois que FitMesh vient s'ajouter par-dessus.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Percorso diretto Samsung e percorso Health Connect",
        en: "The direct Samsung path and the Health Connect path",
        de: "Der direkte Samsung-Weg und der Health-Connect-Weg",
        fr: "Le chemin direct Samsung et le chemin Health Connect",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh legge i dati di Samsung Health in due modi distinti, che coesistono. Il primo è Health Connect: il layer di permessi Android condiviso da tutte le app compatibili, sempre disponibile su Android 8.0+. Il secondo è una lettura diretta tramite il Samsung Health Data SDK ufficiale, attiva solo su dispositivi Samsung con Android 10 o successivo, e solo dopo che tocchi esplicitamente \"Connetti Samsung Health\" nelle impostazioni di FitMesh: su telefoni non Samsung questa opzione resta nascosta. La lettura diretta è di sola lettura: FitMesh non scrive mai dati nel Samsung Health Data SDK. Nota importante: l'autorizzazione diretta Samsung dipende anche da una registrazione dell'app presso i servizi Samsung, un passaggio esterno al codice di FitMesh — se in rari casi la connessione diretta non si autorizza, il percorso Health Connect continua comunque a funzionare in parallelo. Fonte: [Samsung Developers — Health Data SDK](https://developer.samsung.com/health/data), consultata il 06/08/2026.",
        en: "FitMesh reads Samsung Health data two distinct ways, and both coexist. The first is Health Connect: the Android permissions layer shared by every compatible app, always available on Android 8.0+. The second is a direct read via the official Samsung Health Data SDK, active only on Samsung devices running Android 10 or later, and only after you explicitly tap \"Connect Samsung Health\" in FitMesh's settings — on non-Samsung phones this option stays hidden. The direct read is read-only: FitMesh never writes data into the Samsung Health Data SDK. One important note: direct Samsung authorization also depends on an app registration with Samsung's own services, a step outside FitMesh's code — if in rare cases the direct connection doesn't authorize, the Health Connect path keeps working in parallel. Source: [Samsung Developers — Health Data SDK](https://developer.samsung.com/health/data), consulted 2026-08-06.",
        de: "FitMesh liest Samsung-Health-Daten auf zwei unterschiedlichen, parallel bestehenden Wegen. Der erste ist Health Connect: die von allen kompatiblen Apps gemeinsam genutzte Android-Berechtigungsebene, immer verfügbar ab Android 8.0. Der zweite ist ein direkter Zugriff über das offizielle Samsung Health Data SDK, der nur auf Samsung-Geräten mit Android 10 oder höher aktiv ist, und erst nachdem Sie in den FitMesh-Einstellungen explizit auf \"Samsung Health verbinden\" tippen: Auf Nicht-Samsung-Telefonen bleibt diese Option verborgen. Der direkte Zugriff ist rein lesend: FitMesh schreibt niemals Daten in das Samsung Health Data SDK. Wichtiger Hinweis: Die direkte Samsung-Autorisierung hängt zusätzlich von einer App-Registrierung bei den Samsung-Diensten ab, einem Schritt außerhalb des FitMesh-Codes — falls sich die direkte Verbindung in seltenen Fällen nicht autorisieren lässt, funktioniert der Health-Connect-Weg trotzdem parallel weiter. Quelle: [Samsung Developers — Health Data SDK](https://developer.samsung.com/health/data), abgerufen am 06.08.2026.",
        fr: "FitMesh lit les données Samsung Health de deux manières distinctes, qui coexistent. La première est Health Connect : la couche de permissions Android partagée par toutes les applications compatibles, toujours disponible dès Android 8.0. La seconde est une lecture directe via le Samsung Health Data SDK officiel, active uniquement sur les appareils Samsung sous Android 10 ou supérieur, et seulement après avoir explicitement appuyé sur « Connecter Samsung Health » dans les réglages de FitMesh : sur les téléphones non-Samsung, cette option reste masquée. La lecture directe est en lecture seule : FitMesh n'écrit jamais de données dans le Samsung Health Data SDK. Remarque importante : l'autorisation directe Samsung dépend aussi d'un enregistrement de l'application auprès des services Samsung, une étape extérieure au code de FitMesh — si, dans de rares cas, la connexion directe ne s'autorise pas, le chemin Health Connect continue malgré tout de fonctionner en parallèle. Source : [Samsung Developers — Health Data SDK](https://developer.samsung.com/health/data), consultée le 06/08/2026.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa aggiunge FitMesh", en: "What FitMesh adds", de: "Was FitMesh hinzufügt", fr: "Ce que FitMesh ajoute" },
    },
    {
      type: "list",
      items: {
        it: [
          "Una dashboard unica quando i tuoi dati arrivano da più di una fonte (Galaxy Watch + anello smart, o più dispositivi nel tempo).",
          "Una regola fissa e deterministica per scegliere quale fonte vince quando due dispositivi riportano lo stesso dato, così non vedi né duplicati né conteggi gonfiati.",
          "La possibilità di scegliere tu stesso, per singola metrica, quale fonte deve avere la priorità (in Impostazioni), invece di subire una scelta automatica non modificabile.",
          "Continuità quando cambi telefono o sistema operativo: lo stesso account FitMesh vede i dati sia da Android sia da iPhone.",
          "Un export dei tuoi dati in JSON o CSV, quando vuoi portarteli altrove.",
        ],
        en: [
          "A single dashboard when your data comes from more than one source (Galaxy Watch + smart ring, or several devices over time).",
          "A fixed, deterministic rule for which source wins when two devices report the same value, so you don't see duplicates or inflated counts.",
          "The ability to choose, per metric, which source should take priority yourself (in Settings), instead of a fixed automatic choice you can't change.",
          "Continuity when you switch phones or operating systems: the same FitMesh account sees data from both Android and iPhone.",
          "A JSON or CSV export of your data whenever you want to take it elsewhere.",
        ],
        de: [
          "Ein einziges Dashboard, sobald Ihre Daten von mehr als einer Quelle stammen (Galaxy Watch + Smart Ring, oder im Laufe der Zeit mehrere Geräte).",
          "Eine feste, deterministische Regel dafür, welche Quelle gewinnt, wenn zwei Geräte denselben Wert melden – so sehen Sie weder Duplikate noch aufgeblähte Zahlen.",
          "Die Möglichkeit, selbst pro Metrik festzulegen (in den Einstellungen), welche Quelle Vorrang hat, statt eine feste automatische Wahl hinnehmen zu müssen, die Sie nicht ändern können.",
          "Kontinuität beim Wechsel des Telefons oder Betriebssystems: Derselbe FitMesh-Account sieht Daten sowohl von Android als auch von iPhone.",
          "Ein Export Ihrer Daten als JSON oder CSV, wann immer Sie sie anderswo verwenden möchten.",
        ],
        fr: [
          "Un tableau de bord unique lorsque vos données proviennent de plus d'une source (Galaxy Watch + anneau connecté, ou plusieurs appareils au fil du temps).",
          "Une règle fixe et déterministe pour décider quelle source l'emporte lorsque deux appareils rapportent la même donnée, afin de ne jamais voir de doublons ni de totaux gonflés.",
          "La possibilité de choisir vous-même, par indicateur, quelle source doit avoir la priorité (dans les Réglages), plutôt que de subir un choix automatique fixe que vous ne pouvez pas modifier.",
          "Une continuité lorsque vous changez de téléphone ou de système d'exploitation : le même compte FitMesh voit les données aussi bien depuis Android que depuis iPhone.",
          "Un export de vos données au format JSON ou CSV, dès que vous souhaitez les emporter ailleurs.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa Samsung Health fa meglio (e FitMesh non replica)",
        en: "What Samsung Health does better (and FitMesh doesn't replicate)",
        de: "Was Samsung Health besser kann (und FitMesh nicht nachbildet)",
        fr: "Ce que Samsung Health fait mieux (et que FitMesh ne réplique pas)",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "ECG ed elettrocardiogramma: Samsung Health Monitor è l'unico posto dove leggerlo, FitMesh non lo importa.",
          "Punteggi proprietari Samsung come Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score: calcolati e mostrati solo dentro l'app Samsung Health.",
          "Coaching e piani di allenamento guidati Samsung: restano nell'app Samsung Health.",
          "Configurazione e accoppiamento del Watch, aggiornamenti firmware: si fanno solo da Samsung Health/Galaxy Wearable.",
          "Misurazioni istantanee dal polso (una tantum, es. una singola misura di pressione o ECG avviata manualmente): il flusso in tempo reale resta nell'app Samsung.",
        ],
        en: [
          "ECG and electrocardiogram readings: Samsung Health Monitor is the only place to read them, FitMesh doesn't import them.",
          "Samsung's proprietary scores like Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score: computed and shown only inside the Samsung Health app.",
          "Samsung's coaching and guided training plans: stay inside the Samsung Health app.",
          "Watch pairing and setup, firmware updates: only done from Samsung Health/Galaxy Wearable.",
          "One-off instant wrist measurements (e.g. a single manually-triggered blood pressure or ECG reading): that live flow stays in the Samsung app.",
        ],
        de: [
          "EKG und Elektrokardiogramm: Samsung Health Monitor ist der einzige Ort, an dem Sie es ablesen können, FitMesh importiert es nicht.",
          "Samsungs proprietäre Scores wie Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score: werden ausschließlich in der Samsung-Health-App berechnet und angezeigt.",
          "Samsungs Coaching und geführte Trainingspläne: bleiben in der Samsung-Health-App.",
          "Einrichtung und Kopplung der Watch, Firmware-Updates: erfolgen ausschließlich über Samsung Health/Galaxy Wearable.",
          "Einmalige Sofortmessungen am Handgelenk (z. B. eine manuell gestartete Einzelmessung von Blutdruck oder EKG): Dieser Echtzeit-Ablauf bleibt in der Samsung-App.",
        ],
        fr: [
          "ECG et électrocardiogramme : Samsung Health Monitor est le seul endroit où le consulter, FitMesh ne l'importe pas.",
          "Les scores propriétaires de Samsung comme Energy Score, Daily Cardio Load, Fitness Index, AGEs Index, Heart Health Score : calculés et affichés uniquement dans l'application Samsung Health.",
          "Le coaching et les plans d'entraînement guidés Samsung : restent dans l'application Samsung Health.",
          "Configuration et appairage de la Watch, mises à jour du firmware : se font uniquement depuis Samsung Health/Galaxy Wearable.",
          "Les mesures instantanées ponctuelles au poignet (par ex. une seule mesure de tension ou d'ECG déclenchée manuellement) : ce flux en direct reste dans l'application Samsung.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Matrice feature completa", en: "Full feature matrix", de: "Vollständige Funktionsmatrix", fr: "Matrice complète des fonctionnalités" },
    },
    {
      type: "table",
      caption: {
        it: "Ogni riga è verificata sul codice della build pubblicata, non dedotta da documentazione promozionale.",
        en: "Every row is verified against the published build's code, not inferred from marketing material.",
        de: "Jede Zeile wurde anhand des Codes der veröffentlichten Build überprüft, nicht aus Marketingmaterial abgeleitet.",
        fr: "Chaque ligne est vérifiée par rapport au code de la version publiée, et non déduite de supports marketing.",
      },
      headers: {
        it: ["Funzione", "Samsung Health", "FitMesh", "Percorso FitMesh", "Limite"],
        en: ["Feature", "Samsung Health", "FitMesh", "FitMesh path", "Limit"],
        de: ["Funktion", "Samsung Health", "FitMesh", "FitMesh-Weg", "Einschränkung"],
        fr: ["Fonctionnalité", "Samsung Health", "FitMesh", "Chemin FitMesh", "Limite"],
      },
      rows: [
        {
          it: ["Energy Score", "Sì", "No", "—", "Non esposto dal Samsung Health Data SDK pubblico: FitMesh non può leggerlo."],
          en: ["Energy Score", "Yes", "No", "—", "Not exposed by the public Samsung Health Data SDK: FitMesh cannot read it."],
          de: ["Energy Score", "Ja", "Nein", "—", "Wird vom öffentlichen Samsung Health Data SDK nicht bereitgestellt: FitMesh kann es nicht lesen."],
          fr: ["Energy Score", "Oui", "Non", "—", "Non exposé par le Samsung Health Data SDK public : FitMesh ne peut pas le lire."],
        },
        {
          it: ["Coaching Samsung", "Sì", "No", "—", "Feature esclusiva dell'app Samsung Health."],
          en: ["Samsung coaching", "Yes", "No", "—", "Samsung Health app-exclusive feature."],
          de: ["Samsung-Coaching", "Ja", "Nein", "—", "Exklusive Funktion der Samsung-Health-App."],
          fr: ["Coaching Samsung", "Oui", "Non", "—", "Fonctionnalité exclusive de l'application Samsung Health."],
        },
        {
          it: ["Configurazione/firmware Watch", "Sì", "No", "—", "Va gestita da Samsung Health/Galaxy Wearable."],
          en: ["Watch setup/firmware", "Yes", "No", "—", "Managed from Samsung Health/Galaxy Wearable."],
          de: ["Watch-Einrichtung/Firmware", "Ja", "Nein", "—", "Wird über Samsung Health/Galaxy Wearable verwaltet."],
          fr: ["Configuration/firmware de la Watch", "Oui", "Non", "—", "Géré depuis Samsung Health/Galaxy Wearable."],
        },
        {
          it: ["ECG", "Sì", "No", "—", "Dato clinico non esposto dal SDK pubblico letto da FitMesh."],
          en: ["ECG", "Yes", "No", "—", "Clinical data not exposed by the public SDK FitMesh reads."],
          de: ["EKG", "Ja", "Nein", "—", "Klinischer Wert, der vom öffentlichen SDK, das FitMesh liest, nicht bereitgestellt wird."],
          fr: ["ECG", "Oui", "Non", "—", "Donnée clinique non exposée par le SDK public que FitMesh lit."],
        },
        {
          it: ["Sonno (fasi)", "Sì", "Sì", "Health Connect + SDK diretto (Samsung ha priorità se presente)", "—"],
          en: ["Sleep (stages)", "Yes", "Yes", "Health Connect + direct SDK (Samsung wins if present)", "—"],
          de: ["Schlaf (Phasen)", "Ja", "Ja", "Health Connect + direktes SDK (Samsung hat Vorrang, falls vorhanden)", "—"],
          fr: ["Sommeil (phases)", "Oui", "Oui", "Health Connect + SDK direct (Samsung est prioritaire si disponible)", "—"],
        },
        {
          it: ["Battito cardiaco", "Sì", "Sì", "Health Connect + SDK diretto (Samsung ha priorità se presente)", "—"],
          en: ["Heart rate", "Yes", "Yes", "Health Connect + direct SDK (Samsung wins if present)", "—"],
          de: ["Herzfrequenz", "Ja", "Ja", "Health Connect + direktes SDK (Samsung hat Vorrang, falls vorhanden)", "—"],
          fr: ["Fréquence cardiaque", "Oui", "Oui", "Health Connect + SDK direct (Samsung est prioritaire si disponible)", "—"],
        },
        {
          it: ["SpO2", "Sì", "Sì", "Health Connect + SDK diretto (prima fonte disponibile)", "—"],
          en: ["SpO2", "Yes", "Yes", "Health Connect + direct SDK (first available source)", "—"],
          de: ["SpO2", "Ja", "Ja", "Health Connect + direktes SDK (erste verfügbare Quelle)", "—"],
          fr: ["SpO2", "Oui", "Oui", "Health Connect + SDK direct (première source disponible)", "—"],
        },
        {
          it: ["Temperatura cutanea", "Sì", "Sì", "Health Connect + SDK diretto (prima fonte disponibile)", "Temperatura cutanea, non temperatura corporea clinica."],
          en: ["Skin temperature", "Yes", "Yes", "Health Connect + direct SDK (first available source)", "Skin temperature, not clinical core body temperature."],
          de: ["Hauttemperatur", "Ja", "Ja", "Health Connect + direktes SDK (erste verfügbare Quelle)", "Hauttemperatur, keine klinische Körperkerntemperatur."],
          fr: ["Température cutanée", "Oui", "Oui", "Health Connect + SDK direct (première source disponible)", "Température cutanée, pas une température corporelle clinique."],
        },
        {
          it: ["Pressione sanguigna", "Sì", "Sì", "Health Connect + SDK diretto (prima fonte disponibile)", "Richiede che Samsung Health l'abbia registrata da una misurazione manuale."],
          en: ["Blood pressure", "Yes", "Yes", "Health Connect + direct SDK (first available source)", "Requires Samsung Health to have logged it from a manual reading."],
          de: ["Blutdruck", "Ja", "Ja", "Health Connect + direktes SDK (erste verfügbare Quelle)", "Setzt voraus, dass Samsung Health ihn aus einer manuellen Messung erfasst hat."],
          fr: ["Tension artérielle", "Oui", "Oui", "Health Connect + SDK direct (première source disponible)", "Nécessite que Samsung Health l'ait enregistrée via une mesure manuelle."],
        },
        {
          it: ["Composizione corporea", "Sì", "Parziale", "Health Connect + SDK diretto", "Confermati peso, altezza, BMI; non confermata la lettura di massa grassa/muscolare oltre a questi."],
          en: ["Body composition", "Yes", "Partial", "Health Connect + direct SDK", "Confirmed: weight, height, BMI; fat/muscle mass beyond these isn't confirmed as read."],
          de: ["Körperzusammensetzung", "Ja", "Teilweise", "Health Connect + direktes SDK", "Bestätigt: Gewicht, Größe, BMI; die Erfassung von Fett-/Muskelmasse darüber hinaus ist nicht bestätigt."],
          fr: ["Composition corporelle", "Oui", "Partiel", "Health Connect + SDK direct", "Confirmés : poids, taille, IMC ; la lecture de la masse grasse/musculaire au-delà n'est pas confirmée."],
        },
        {
          it: ["Apnea notturna", "Sì (Samsung Health Monitor)", "Sì, come flag", "SDK diretto", "Flag rilevato/non rilevato/dato non disponibile. NON è un indice AHI clinico."],
          en: ["Sleep apnea", "Yes (Samsung Health Monitor)", "Yes, as a flag", "Direct SDK", "Detected/not-detected/unavailable flag. NOT a clinical AHI index."],
          de: ["Schlafapnoe", "Ja (Samsung Health Monitor)", "Ja, als Flag", "Direktes SDK", "Flag Erkannt/Nicht erkannt/Nicht verfügbar. KEIN klinischer AHI-Index."],
          fr: ["Apnée du sommeil", "Oui (Samsung Health Monitor)", "Oui, sous forme d'indicateur", "SDK direct", "Indicateur détecté/non détecté/non disponible. PAS un indice AHI clinique."],
        },
        {
          it: ["HRV", "Sì", "Sì", "Health Connect / anello, non confermato dal SDK diretto Samsung", "—"],
          en: ["HRV", "Yes", "Yes", "Health Connect / ring, not confirmed via the direct Samsung SDK", "—"],
          de: ["HRV", "Ja", "Ja", "Health Connect / Ring, über das direkte Samsung-SDK nicht bestätigt", "—"],
          fr: ["HRV", "Oui", "Oui", "Health Connect / anneau, non confirmé via le SDK direct Samsung", "—"],
        },
        {
          it: ["VO2 max", "Sì (nell'app Samsung)", "No", "—", "Il campo esiste nello schema FitMesh ma oggi non è popolato da nessuna fonte reale nella build pubblicata."],
          en: ["VO2 max", "Yes (in the Samsung app)", "No", "—", "The field exists in FitMesh's schema but today isn't populated by any real source in the published build."],
          de: ["VO2max", "Ja (in der Samsung-App)", "Nein", "—", "Das Feld existiert im FitMesh-Schema, wird aber aktuell von keiner echten Quelle in der veröffentlichten Build befüllt."],
          fr: ["VO2 max", "Oui (dans l'application Samsung)", "Non", "—", "Le champ existe dans le schéma de FitMesh, mais n'est actuellement alimenté par aucune source réelle dans la version publiée."],
        },
        {
          it: ["Più sorgenti insieme (anello + orologio)", "Solo Samsung", "Sì", "Motore di fusione dedicato, regole fisse (non IA)", "—"],
          en: ["Multiple sources together (ring + watch)", "Samsung only", "Yes", "Dedicated fusion engine, fixed rules (not AI)", "—"],
          de: ["Mehrere Quellen gleichzeitig (Ring + Uhr)", "Nur Samsung", "Ja", "Dedizierte Fusions-Engine, feste Regeln (keine KI)", "—"],
          fr: ["Plusieurs sources ensemble (anneau + montre)", "Samsung uniquement", "Oui", "Moteur de fusion dédié, règles fixes (pas d'IA)", "—"],
        },
        {
          it: ["Export dati", "Limitato all'app/Samsung Cloud", "JSON gratuito, CSV con filtro periodo (Pro)", "Esportazione diretta da Impostazioni", "—"],
          en: ["Data export", "Limited to the app/Samsung Cloud", "Free JSON, CSV with date-range filter (Pro)", "Direct export from Settings", "—"],
          de: ["Datenexport", "Beschränkt auf die App/Samsung Cloud", "Kostenloses JSON, CSV mit Zeitraumfilter (Pro)", "Direkter Export aus den Einstellungen", "—"],
          fr: ["Export des données", "Limité à l'application/Samsung Cloud", "JSON gratuit, CSV avec filtre de période (Pro)", "Export direct depuis les Réglages", "—"],
        },
        {
          it: ["Continuità multipiattaforma (Android+iOS)", "No (ecosistema Samsung)", "Sì", "Stesso account FitMesh", "—"],
          en: ["Cross-platform continuity (Android+iOS)", "No (Samsung ecosystem)", "Yes", "Same FitMesh account", "—"],
          de: ["Plattformübergreifende Kontinuität (Android+iOS)", "Nein (Samsung-Ökosystem)", "Ja", "Derselbe FitMesh-Account", "—"],
          fr: ["Continuité multiplateforme (Android+iOS)", "Non (écosystème Samsung)", "Oui", "Même compte FitMesh", "—"],
        },
      ],
    },
    {
      type: "cta",
      title: {
        it: "Vedi i tuoi dati compatibili in un unico posto",
        en: "See your compatible data in one place",
        de: "Sehen Sie Ihre kompatiblen Daten an einem Ort",
        fr: "Consultez vos données compatibles au même endroit",
      },
      body: {
        it: "Se hai un Galaxy Watch e anche un'altra fonte di dati (anello smart, un secondo dispositivo, o stai passando a iPhone), FitMesh li riunisce senza duplicati.",
        en: "If you have a Galaxy Watch plus another data source (a smart ring, a second device, or you're switching to iPhone), FitMesh brings them together without duplicates.",
        de: "Wenn Sie eine Galaxy Watch und zusätzlich eine weitere Datenquelle haben (Smart Ring, ein zweites Gerät, oder Sie wechseln zu iPhone), führt FitMesh diese ohne Duplikate zusammen.",
        fr: "Si vous possédez une Galaxy Watch et une autre source de données (anneau connecté, un second appareil, ou vous passez à iPhone), FitMesh les réunit sans doublons.",
      },
      ctaLabel: {
        it: "Scopri FitMesh Sync →",
        en: "Discover FitMesh Sync →",
        de: "FitMesh Sync entdecken →",
        fr: "Découvrir FitMesh Sync →",
      },
      ctaHref: { it: "/it/fitness-data-sync", en: "/en/fitness-data-sync", de: "/de/fitness-data-sync", fr: "/en/fitness-data-sync" },
      ctaId: "blog-samsung-together-fitness-data-sync-cta",
      ctaPlacement: "blog_body_mid",
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Esempio: Galaxy Watch più anello Colmi",
        en: "Example: Galaxy Watch plus a Colmi ring",
        de: "Beispiel: Galaxy Watch plus Colmi-Ring",
        fr: "Exemple : Galaxy Watch plus un anneau Colmi",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Un caso concreto: indossi un Galaxy Watch di giorno e un anello Colmi la notte (magari perché il Watch resta in carica). Samsung Health vede solo i dati del Watch. FitMesh legge entrambe le fonti: per il sonno, se sia il Watch sia l'anello hanno registrato dati per la stessa notte, la regola di fusione decide quale usare (non li somma); se solo l'anello ha registrato quella notte perché il Watch era in carica, FitMesh riempie il buco con il dato dell'anello invece di lasciarlo vuoto. Per i passi, che sono un dato cumulativo, FitMesh non somma i valori e non sceglie semplicemente il numero più alto: prende la fonte più coerente e con la copertura oraria migliore per quel giorno; se il disaccordo tra le fonti è troppo forte per decidere con sicurezza, quel giorno resta segnato come incerto.",
        en: "A concrete case: you wear a Galaxy Watch during the day and a Colmi ring at night (maybe because the Watch is charging). Samsung Health only sees the Watch's data. FitMesh reads both sources: for sleep, if both the Watch and the ring logged data for the same night, the fusion rule decides which one to use (it never adds them together); if only the ring logged that night because the Watch was charging, FitMesh fills the gap with the ring's data instead of leaving it blank. For steps, which are a cumulative value, FitMesh doesn't add the numbers together and doesn't simply pick the higher one: it takes the source that's most consistent and has the best hourly coverage for that day; if the sources disagree too much to decide reliably, that day is flagged as uncertain instead.",
        de: "Ein konkretes Beispiel: Sie tragen tagsüber eine Galaxy Watch und nachts einen Colmi-Ring (vielleicht weil die Watch gerade lädt). Samsung Health sieht nur die Daten der Watch. FitMesh liest beide Quellen: Beim Schlaf entscheidet die Fusionsregel, welche Quelle verwendet wird, falls sowohl Watch als auch Ring Daten für dieselbe Nacht erfasst haben (sie werden nicht addiert); hat nur der Ring in dieser Nacht Daten erfasst, weil die Watch geladen hat, füllt FitMesh die Lücke mit den Ringdaten, statt sie leer zu lassen. Bei Schritten, einem kumulativen Wert, addiert FitMesh die Zahlen nicht und wählt auch nicht einfach die höhere: Es nimmt die Quelle, die für diesen Tag am stimmigsten ist und die beste stündliche Abdeckung hat; widersprechen sich die Quellen zu stark, um zuverlässig zu entscheiden, wird dieser Tag stattdessen als unsicher markiert.",
        fr: "Un cas concret : vous portez une Galaxy Watch le jour et un anneau Colmi la nuit (peut-être parce que la Watch est en charge). Samsung Health ne voit que les données de la Watch. FitMesh lit les deux sources : pour le sommeil, si la Watch et l'anneau ont tous deux enregistré des données pour la même nuit, la règle de fusion décide laquelle utiliser (elle ne les additionne pas) ; si seul l'anneau a enregistré cette nuit-là parce que la Watch était en charge, FitMesh comble le vide avec les données de l'anneau plutôt que de le laisser vide. Pour les pas, qui sont une donnée cumulative, FitMesh n'additionne pas les valeurs et ne retient pas simplement la plus élevée : il prend la source la plus cohérente et dont la couverture horaire est la meilleure pour cette journée ; si les sources sont trop en désaccord pour trancher de façon fiable, cette journée est alors marquée comme incertaine.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come funziona la deduplicazione (in breve)",
        en: "How deduplication works (briefly)",
        de: "So funktioniert die Deduplizierung (kurz erklärt)",
        fr: "Comment fonctionne la déduplication (en bref)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh non usa intelligenza artificiale per decidere quale dato tenere: applica regole fisse, uguali per tutti. Per battito e sonno, se Samsung Health ha un dato per quella finestra temporale, di norma viene preferito. Per passi, distanza e calorie, Health Connect è la base e Samsung riempie solo i buchi in cui Health Connect non ha nulla. Per le altre metriche condivise (SpO2, temperatura cutanea, pressione, ecc.) vince semplicemente la prima fonte disponibile. Tu puoi comunque cambiare questa priorità per singola metrica dalle Impostazioni, se preferisci un'altra fonte come predefinita.",
        en: "FitMesh doesn't use AI to decide which data to keep: it applies fixed rules, the same for everyone. For heart rate and sleep, if Samsung Health has a value for that time window, it's normally preferred. For steps, distance, and calories, Health Connect is the baseline and Samsung only fills gaps where Health Connect has nothing. For the other shared metrics (SpO2, skin temperature, blood pressure, etc.) the first available source simply wins. You can still change this priority per metric from Settings if you'd rather have a different default source.",
        de: "FitMesh nutzt keine künstliche Intelligenz, um zu entscheiden, welche Daten behalten werden: Es wendet feste Regeln an, die für alle gleich sind. Bei Herzfrequenz und Schlaf wird der Samsung-Health-Wert für dieses Zeitfenster in der Regel bevorzugt, sofern vorhanden. Bei Schritten, Distanz und Kalorien bildet Health Connect die Grundlage, und Samsung füllt nur die Lücken, in denen Health Connect nichts liefert. Bei den übrigen gemeinsam genutzten Kennzahlen (SpO2, Hauttemperatur, Blutdruck usw.) gewinnt schlicht die erste verfügbare Quelle. Sie können diese Priorität dennoch pro Kennzahl in den Einstellungen ändern, falls Sie eine andere Quelle als Standard bevorzugen.",
        fr: "FitMesh n'utilise pas l'intelligence artificielle pour décider quelle donnée conserver : il applique des règles fixes, identiques pour tous. Pour la fréquence cardiaque et le sommeil, si Samsung Health dispose d'une donnée pour cette fenêtre temporelle, elle est généralement privilégiée. Pour les pas, la distance et les calories, Health Connect sert de base et Samsung ne comble que les lacunes où Health Connect n'a rien. Pour les autres indicateurs partagés (SpO2, température cutanée, tension, etc.), c'est simplement la première source disponible qui l'emporte. Vous pouvez néanmoins modifier cette priorité par indicateur depuis les Réglages, si vous préférez une autre source par défaut.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Privacy e cloud", en: "Privacy and cloud", de: "Datenschutz und Cloud", fr: "Confidentialité et cloud" },
    },
    {
      type: "paragraph",
      text: {
        it: "I dati che FitMesh legge (da Health Connect o dal Samsung Health Data SDK) vengono inviati al backend cloud di FitMesh (server in UE) per costruire la tua dashboard e mantenerla sincronizzata tra i tuoi dispositivi; non restano solo sul telefono. Samsung Health, separatamente, gestisce il proprio Samsung Cloud secondo le sue impostazioni: disattivare quello non ha effetto sul funzionamento di FitMesh, che dipende da Health Connect e, dove disponibile, dalla connessione diretta al Samsung Health Data SDK.",
        en: "The data FitMesh reads (from Health Connect or the Samsung Health Data SDK) is sent to FitMesh's cloud backend (EU-based servers) to build your dashboard and keep it in sync across your devices; it doesn't stay only on your phone. Samsung Health separately manages its own Samsung Cloud according to its own settings; turning that off has no effect on FitMesh, which depends on Health Connect and, where available, the direct Samsung Health Data SDK connection.",
        de: "Die Daten, die FitMesh liest (aus Health Connect oder dem Samsung Health Data SDK), werden an das Cloud-Backend von FitMesh (Server in der EU) gesendet, um Ihr Dashboard aufzubauen und geräteübergreifend synchron zu halten; sie bleiben nicht nur auf dem Telefon. Samsung Health verwaltet separat seine eigene Samsung Cloud gemäß seinen eigenen Einstellungen: Diese zu deaktivieren hat keine Auswirkung auf die Funktion von FitMesh, das von Health Connect und, sofern verfügbar, der direkten Verbindung zum Samsung Health Data SDK abhängt.",
        fr: "Les données que FitMesh lit (depuis Health Connect ou le Samsung Health Data SDK) sont envoyées au backend cloud de FitMesh (serveurs situés dans l'UE) pour construire votre tableau de bord et le maintenir synchronisé entre vos appareils ; elles ne restent pas uniquement sur le téléphone. Samsung Health gère séparément son propre Samsung Cloud selon ses propres réglages : le désactiver n'a aucun effet sur le fonctionnement de FitMesh, qui dépend de Health Connect et, lorsque disponible, de la connexion directe au Samsung Health Data SDK.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Chi non ha bisogno di FitMesh", en: "Who doesn't need FitMesh", de: "Wer FitMesh nicht braucht", fr: "Qui n'a pas besoin de FitMesh" },
    },
    {
      type: "paragraph",
      text: {
        it: "Se hai solo un Galaxy Watch, nessun altro dispositivo, e non hai bisogno di vedere i dati anche da web o da un altro telefono, Samsung Health da solo probabilmente ti basta: ha già tutto quello che serve per il tuo unico dispositivo, incluse funzioni che FitMesh non replica (ECG, coaching, punteggi proprietari). FitMesh aggiunge valore quando la situazione si complica: più dispositivi, cambio di telefono, o vuoi un export dei tuoi dati.",
        en: "If you only have a Galaxy Watch, no other device, and don't need to see your data from the web or another phone, Samsung Health alone is probably enough: it already has everything you need for your single device, including features FitMesh doesn't replicate (ECG, coaching, proprietary scores). FitMesh adds value once things get more complex: more than one device, switching phones, or wanting an export of your data.",
        de: "Wenn Sie nur eine Galaxy Watch besitzen, kein weiteres Gerät haben und Ihre Daten nicht zusätzlich im Web oder auf einem anderen Telefon sehen müssen, reicht Samsung Health allein wahrscheinlich aus: Es bietet bereits alles, was Sie für Ihr einziges Gerät brauchen, einschließlich Funktionen, die FitMesh nicht nachbildet (EKG, Coaching, proprietäre Scores). FitMesh schafft Mehrwert, sobald es komplizierter wird: mehrere Geräte, ein Telefonwechsel, oder Sie möchten einen Export Ihrer Daten.",
        fr: "Si vous n'avez qu'une Galaxy Watch, aucun autre appareil, et que vous n'avez pas besoin de consulter vos données depuis le web ou un autre téléphone, Samsung Health seul suffit probablement : il propose déjà tout ce dont vous avez besoin pour votre unique appareil, y compris des fonctionnalités que FitMesh ne réplique pas (ECG, coaching, scores propriétaires). FitMesh apporte une valeur ajoutée dès que la situation se complique : plusieurs appareils, changement de téléphone, ou si vous souhaitez un export de vos données.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Configurazione reale", en: "Real setup", de: "So richten Sie es wirklich ein", fr: "Configuration réelle" },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Installa FitMesh Sync e crea o accedi al tuo account.",
          "In Impostazioni → Fonti dati, autorizza Health Connect: è il percorso disponibile su qualsiasi Android 8.0+.",
          "Su un dispositivo Samsung con Android 10+, tocca anche \"Connetti Samsung Health\" per abilitare la lettura diretta via SDK: comparirà solo su questi dispositivi.",
          "Se hai più fonti (es. anche un anello smart), collegalo allo stesso modo: FitMesh applica automaticamente le regole di fusione.",
          "In Impostazioni → Priorità fonte, puoi cambiare quale dispositivo vince per singola metrica, se non vuoi la scelta automatica.",
        ],
        en: [
          "Install FitMesh Sync and create or sign in to your account.",
          "In Settings → Data Sources, authorize Health Connect: this path is available on any Android 8.0+.",
          "On a Samsung device running Android 10+, also tap \"Connect Samsung Health\" to enable the direct SDK read: this only appears on these devices.",
          "If you have more sources (e.g. also a smart ring), connect it the same way: FitMesh applies the fusion rules automatically.",
          "In Settings → Source Priority, you can change which device wins per metric if you don't want the automatic choice.",
        ],
        de: [
          "Installieren Sie FitMesh Sync und erstellen Sie ein Konto oder melden Sie sich an.",
          "Autorisieren Sie unter Einstellungen → Datenquellen Health Connect: Dieser Weg steht auf jedem Android 8.0+ zur Verfügung.",
          "Tippen Sie auf einem Samsung-Gerät mit Android 10+ zusätzlich auf \"Samsung Health verbinden\", um den direkten SDK-Zugriff zu aktivieren: Diese Option erscheint nur auf solchen Geräten.",
          "Wenn Sie weitere Quellen haben (z. B. zusätzlich einen Smart Ring), verbinden Sie diesen auf die gleiche Weise: FitMesh wendet die Fusionsregeln automatisch an.",
          "Unter Einstellungen → Quellenpriorität können Sie pro Kennzahl ändern, welches Gerät gewinnt, falls Sie die automatische Wahl nicht möchten.",
        ],
        fr: [
          "Installez FitMesh Sync et créez ou connectez-vous à votre compte.",
          "Dans Réglages → Sources de données, autorisez Health Connect : ce chemin est disponible sur tout appareil Android 8.0 ou supérieur.",
          "Sur un appareil Samsung sous Android 10 ou supérieur, appuyez aussi sur « Connecter Samsung Health » pour activer la lecture directe via le SDK : cette option n'apparaît que sur ces appareils.",
          "Si vous avez d'autres sources (par ex. aussi un anneau connecté), connectez-le de la même façon : FitMesh applique automatiquement les règles de fusion.",
          "Dans Réglages → Priorité des sources, vous pouvez changer quel appareil l'emporte par indicateur, si vous ne voulez pas du choix automatique.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Pronto a collegare i tuoi dispositivi?",
        en: "Ready to connect your devices?",
        de: "Bereit, Ihre Geräte zu verbinden?",
        fr: "Prêt à connecter vos appareils ?",
      },
      body: {
        it: "FitMesh Sync affianca Samsung Health quando i tuoi dati arrivano da più di una fonte.",
        en: "FitMesh Sync complements Samsung Health when your data comes from more than one source.",
        de: "FitMesh Sync ergänzt Samsung Health, sobald Ihre Daten von mehr als einer Quelle stammen.",
        fr: "FitMesh Sync complète Samsung Health lorsque vos données proviennent de plus d'une source.",
      },
      ctaLabel: {
        it: "Scopri FitMesh Sync →",
        en: "Discover FitMesh Sync →",
        de: "FitMesh Sync entdecken →",
        fr: "Découvrir FitMesh Sync →",
      },
      ctaHref: { it: "/it/fitness-data-sync", en: "/en/fitness-data-sync", de: "/de/fitness-data-sync", fr: "/en/fitness-data-sync" },
      ctaId: "blog-samsung-together-fitness-data-sync-cta-end",
      ctaPlacement: "blog_body_end",
    },
  ],
  faq: [
    {
      q: {
        it: "FitMesh sostituisce Samsung Health?",
        en: "Does FitMesh replace Samsung Health?",
        de: "Ersetzt FitMesh Samsung Health?",
        fr: "FitMesh remplace-t-il Samsung Health ?",
      },
      a: {
        it: "No. Samsung Health resta l'app per configurare il Watch, leggere l'ECG, il coaching e i punteggi proprietari Samsung. FitMesh aggiunge una dashboard quando i tuoi dati arrivano anche da altre fonti.",
        en: "No. Samsung Health stays the app for setting up the Watch, reading ECG, coaching, and Samsung's proprietary scores. FitMesh adds a dashboard when your data also comes from other sources.",
        de: "Nein. Samsung Health bleibt die App zum Einrichten der Watch, zum Ablesen des EKGs, für das Coaching und Samsungs proprietäre Scores. FitMesh fügt ein Dashboard hinzu, sobald Ihre Daten zusätzlich von anderen Quellen stammen.",
        fr: "Non. Samsung Health reste l'application pour configurer la Watch, consulter l'ECG, le coaching et les scores propriétaires de Samsung. FitMesh ajoute un tableau de bord lorsque vos données proviennent aussi d'autres sources.",
      },
    },
    {
      q: {
        it: "FitMesh legge tutti i dati di Samsung Health?",
        en: "Does FitMesh read all of Samsung Health's data?",
        de: "Liest FitMesh alle Daten von Samsung Health?",
        fr: "FitMesh lit-il toutes les données de Samsung Health ?",
      },
      a: {
        it: "No. Legge le metriche esposte dal Samsung Health Data SDK pubblico e da Health Connect (battito, sonno, SpO2, temperatura cutanea, pressione, peso/altezza/BMI, tra le altre). Non legge ECG, punteggi proprietari Samsung (Energy Score e simili) né il coaching.",
        en: "No. It reads the metrics exposed by the public Samsung Health Data SDK and Health Connect (heart rate, sleep, SpO2, skin temperature, blood pressure, weight/height/BMI, among others). It doesn't read ECG, Samsung's proprietary scores (Energy Score and similar), or coaching.",
        de: "Nein. Es liest die Kennzahlen, die vom öffentlichen Samsung Health Data SDK und von Health Connect bereitgestellt werden (u. a. Herzfrequenz, Schlaf, SpO2, Hauttemperatur, Blutdruck, Gewicht/Größe/BMI). Es liest kein EKG, keine proprietären Samsung-Scores (Energy Score und Ähnliches) und kein Coaching.",
        fr: "Non. Il lit les indicateurs exposés par le Samsung Health Data SDK public et par Health Connect (fréquence cardiaque, sommeil, SpO2, température cutanée, tension, poids/taille/IMC, entre autres). Il ne lit ni l'ECG, ni les scores propriétaires de Samsung (Energy Score et similaires), ni le coaching.",
      },
    },
    {
      q: {
        it: "FitMesh sincronizza i dati Samsung in tempo reale?",
        en: "Does FitMesh sync Samsung data in real time?",
        de: "Synchronisiert FitMesh Samsung-Daten in Echtzeit?",
        fr: "FitMesh synchronise-t-il les données Samsung en temps réel ?",
      },
      a: {
        it: "No, non è garantito in tempo reale. FitMesh legge i dati quando Samsung Health li ha già ricevuti dal tuo Watch (che a sua volta ha una sua tempistica di riconnessione). Per i dettagli su questo passaggio, vedi la guida su Health Connect che non si sincronizza.",
        en: "No, it isn't guaranteed to be real-time. FitMesh reads data once Samsung Health has already received it from your Watch (which itself follows its own reconnection timing). For details on this step, see the guide on Health Connect not syncing.",
        de: "Nein, Echtzeit ist nicht garantiert. FitMesh liest die Daten, sobald Samsung Health sie bereits von Ihrer Watch erhalten hat (die wiederum ihre eigene Wiederverbindungszeit hat). Details zu diesem Schritt finden Sie im Leitfaden zu Health Connect, das nicht synchronisiert.",
        fr: "Non, le temps réel n'est pas garanti. FitMesh lit les données une fois que Samsung Health les a déjà reçues de votre Watch (qui suit elle-même son propre calendrier de reconnexion). Pour plus de détails sur cette étape, consultez le guide sur Health Connect qui ne se synchronise pas.",
      },
    },
    {
      q: {
        it: "Se disinstallo/riavvio Samsung Health, FitMesh smette di funzionare?",
        en: "If I uninstall/reset Samsung Health, does FitMesh stop working?",
        de: "Funktioniert FitMesh nicht mehr, wenn ich Samsung Health deinstalliere/zurücksetze?",
        fr: "Si je désinstalle/réinitialise Samsung Health, FitMesh cesse-t-il de fonctionner ?",
      },
      a: {
        it: "Se disattivi completamente Samsung Health, il percorso di lettura diretta e i dati che passavano da lì via Health Connect si interrompono. Se invece hai altre fonti collegate (es. un anello), FitMesh continua a mostrarle: perdi solo i dati che venivano esclusivamente da Samsung Health.",
        en: "If you fully disable Samsung Health, the direct-read path and the data that flowed through it via Health Connect stop. If you have other sources connected (e.g. a ring), FitMesh keeps showing those: you only lose the data that came exclusively from Samsung Health.",
        de: "Wenn Sie Samsung Health vollständig deaktivieren, enden der direkte Lesezugriff und die Daten, die von dort über Health Connect kamen. Wenn Sie jedoch andere Quellen verbunden haben (z. B. einen Ring), zeigt FitMesh diese weiterhin an: Sie verlieren nur die Daten, die ausschließlich von Samsung Health stammten.",
        fr: "Si vous désactivez complètement Samsung Health, le chemin de lecture directe et les données qui transitaient par là via Health Connect s'arrêtent. Si en revanche vous avez d'autres sources connectées (par ex. un anneau), FitMesh continue de les afficher : vous ne perdez que les données qui provenaient exclusivement de Samsung Health.",
      },
    },
    {
      q: {
        it: "Cos'è la lettura diretta con il Samsung Health Data SDK, e in cosa è diversa da Health Connect?",
        en: "What is the direct read via the Samsung Health Data SDK, and how is it different from Health Connect?",
        de: "Was ist der direkte Zugriff über das Samsung Health Data SDK, und wie unterscheidet er sich von Health Connect?",
        fr: "Qu'est-ce que la lecture directe via le Samsung Health Data SDK, et en quoi diffère-t-elle de Health Connect ?",
      },
      a: {
        it: "Health Connect è il layer di permessi condiviso da tutte le app Android compatibili. Il Samsung Health Data SDK è un canale ufficiale Samsung separato, disponibile solo su dispositivi Samsung con Android 10+: FitMesh lo usa in sola lettura, in aggiunta a Health Connect, per ottenere alcuni dati (come il flag di apnea) prima o in modo più completo.",
        en: "Health Connect is the permissions layer shared by every compatible Android app. The Samsung Health Data SDK is a separate official Samsung channel, available only on Samsung devices with Android 10+: FitMesh uses it read-only, alongside Health Connect, to get some data (like the sleep apnea flag) sooner or more completely.",
        de: "Health Connect ist die von allen kompatiblen Android-Apps gemeinsam genutzte Berechtigungsebene. Das Samsung Health Data SDK ist ein separater, offizieller Samsung-Kanal, der nur auf Samsung-Geräten mit Android 10+ verfügbar ist: FitMesh nutzt ihn rein lesend, zusätzlich zu Health Connect, um manche Daten (wie das Apnoe-Flag) früher oder vollständiger zu erhalten.",
        fr: "Health Connect est la couche de permissions partagée par toutes les applications Android compatibles. Le Samsung Health Data SDK est un canal officiel Samsung distinct, disponible uniquement sur les appareils Samsung sous Android 10+ : FitMesh l'utilise en lecture seule, en complément de Health Connect, pour obtenir certaines données (comme l'indicateur d'apnée) plus tôt ou de façon plus complète.",
      },
    },
    {
      q: {
        it: "FitMesh legge il VO2 max da Samsung Health?",
        en: "Does FitMesh read VO2 max from Samsung Health?",
        de: "Liest FitMesh den VO2max-Wert von Samsung Health?",
        fr: "FitMesh lit-il le VO2 max depuis Samsung Health ?",
      },
      a: {
        it: "No, non oggi. Il campo VO2 max esiste nella struttura dati di FitMesh, ma nessuna fonte reale (né Samsung, né altre) lo popola attualmente nella build pubblicata: resta vuoto.",
        en: "No, not today. The VO2 max field exists in FitMesh's data structure, but no real source (Samsung or otherwise) currently populates it in the published build: it stays empty.",
        de: "Nein, aktuell nicht. Das Feld VO2max existiert in der Datenstruktur von FitMesh, wird aber derzeit von keiner echten Quelle (weder Samsung noch einer anderen) in der veröffentlichten Build befüllt: Es bleibt leer.",
        fr: "Non, pas actuellement. Le champ VO2 max existe dans la structure de données de FitMesh, mais aucune source réelle (ni Samsung, ni une autre) ne l'alimente actuellement dans la version publiée : il reste vide.",
      },
    },
    {
      q: {
        it: "Il flag apnea di FitMesh è un indice AHI?",
        en: "Is FitMesh's sleep apnea flag an AHI index?",
        de: "Ist FitMeshs Apnoe-Flag ein AHI-Index?",
        fr: "L'indicateur d'apnée de FitMesh est-il un indice AHI ?",
      },
      a: {
        it: "No. È il risultato di Samsung Health Monitor (rilevato / non rilevato / dato non disponibile), non un vero indice AHI clinico (Apnea-Hypopnea Index). FitMesh mostra questo dato con la stessa etichetta con cui arriva da Samsung, senza trasformarlo in un punteggio clinico.",
        en: "No. It's Samsung Health Monitor's own result (detected / not detected / unavailable), not a real clinical AHI (Apnea-Hypopnea Index) score. FitMesh shows this exactly as it arrives from Samsung, without turning it into a clinical score.",
        de: "Nein. Es ist das Ergebnis von Samsung Health Monitor (erkannt / nicht erkannt / nicht verfügbar), kein echter klinischer AHI-Index (Apnea-Hypopnea Index). FitMesh zeigt diesen Wert mit derselben Kennzeichnung an, mit der er von Samsung kommt, ohne ihn in einen klinischen Score umzuwandeln.",
        fr: "Non. C'est le résultat de Samsung Health Monitor (détecté / non détecté / non disponible), pas un véritable indice AHI clinique (Apnea-Hypopnea Index). FitMesh affiche cette donnée avec le même libellé que celui fourni par Samsung, sans la transformer en score clinique.",
      },
    },
    {
      q: {
        it: "Cosa succede se sia il Galaxy Watch sia un altro dispositivo registrano i passi dello stesso giorno?",
        en: "What happens if both the Galaxy Watch and another device log the same day's steps?",
        de: "Was passiert, wenn sowohl die Galaxy Watch als auch ein anderes Gerät die Schritte desselben Tages erfassen?",
        fr: "Que se passe-t-il si la Galaxy Watch et un autre appareil enregistrent les pas du même jour ?",
      },
      a: {
        it: "FitMesh non li somma, e non si limita a prendere il numero più alto. Sceglie la fonte più coerente e con la copertura oraria migliore per quella giornata intera, non quella con il numero più grande. Se le fonti sono in forte disaccordo e nessun criterio riesce a decidere con sicurezza, quel giorno resta segnato come incerto invece di far vincere un valore a caso. Restano comunque casi limite: FitMesh punta a evitare i doppi conteggi, ma non può escluderli sempre al cento per cento.",
        en: "FitMesh doesn't add them together, and it doesn't just take the higher number either. It picks the source that's most consistent and has the best hourly coverage for that whole day, not the one with the bigger figure. If the sources disagree sharply and no criterion can decide reliably, that day is flagged as uncertain instead of letting a random value win. Edge cases still remain: FitMesh aims to avoid double counting, but can't rule it out entirely in every case.",
        de: "FitMesh addiert sie nicht, und es nimmt auch nicht einfach den höheren Wert. Es wählt die Quelle, die für diesen ganzen Tag am stimmigsten ist und die beste stündliche Abdeckung hat, nicht die mit der größeren Zahl. Widersprechen sich die Quellen stark und kann kein Kriterium zuverlässig entscheiden, wird dieser Tag als unsicher markiert, statt einen zufälligen Wert gewinnen zu lassen. Randfälle bleiben trotzdem bestehen: FitMesh will Doppelzählungen vermeiden, kann sie aber nicht in jedem Fall vollständig ausschließen.",
        fr: "FitMesh ne les additionne pas, et ne se contente pas non plus de retenir le chiffre le plus élevé. Il choisit la source la plus cohérente et dont la couverture horaire est la meilleure pour cette journée entière, pas celle avec le plus grand nombre. Si les sources sont en fort désaccord et qu'aucun critère ne permet de trancher de façon fiable, cette journée est marquée comme incertaine plutôt que de laisser gagner une valeur au hasard. Des cas limites subsistent malgré tout : FitMesh cherche à éviter les doublons, mais ne peut pas totalement les exclure dans tous les cas.",
      },
    },
    {
      q: {
        it: "Posso scegliere io quale dispositivo ha la priorità per una metrica?",
        en: "Can I choose which device takes priority for a metric?",
        de: "Kann ich selbst festlegen, welches Gerät für eine Kennzahl Vorrang hat?",
        fr: "Puis-je choisir moi-même quel appareil est prioritaire pour un indicateur ?",
      },
      a: {
        it: "Sì, per passi, battito, HRV, frequenza cardiaca a riposo, stress, SpO2 e peso puoi impostare manualmente una fonte preferita dalle Impostazioni, invece di lasciare la scelta automatica.",
        en: "Yes, for steps, heart rate, HRV, resting heart rate, stress, SpO2, and weight you can manually set a preferred source from Settings, instead of leaving it to the automatic choice.",
        de: "Ja, für Schritte, Herzfrequenz, HRV, Ruheherzfrequenz, Stress, SpO2 und Gewicht können Sie in den Einstellungen manuell eine bevorzugte Quelle festlegen, statt die automatische Wahl zu übernehmen.",
        fr: "Oui, pour les pas, la fréquence cardiaque, le HRV, la fréquence cardiaque au repos, le stress, le SpO2 et le poids, vous pouvez définir manuellement une source préférée depuis les Réglages, plutôt que de laisser le choix automatique.",
      },
    },
  ],
  related: [
    "health-connect-vs-samsung-health",
    "come-funziona-health-connect",
    "galaxy-watch-ultra2-watch9-health-connect",
    "piu-smartwatch-insieme-dati-doppi",
    "come-funziona-fitmesh",
    "steps-total-vs-hourly-chart",
  ],
  sources: ["https://developer.samsung.com/health/data"],
  // La fonte è già citata inline nel corpo ("Fonte: [...]"/"Source: [...]"):
  // evita che il componente condiviso BlogSources la mostri una seconda volta
  // (verificato da check-p16-visible-sources.ts per URL-overlap).
  sourcesRenderedInline: true,
  brandsMentioned: ["Samsung", "Galaxy Watch", "Colmi"],
  ldType: "BlogPosting",
};
