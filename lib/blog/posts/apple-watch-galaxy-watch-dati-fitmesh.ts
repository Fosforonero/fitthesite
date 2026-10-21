/**
 * Confronto IT/EN: che cosa condividono Apple Watch e Galaxy Watch con il
 * telefono (Apple Salute, Health Connect) e che cosa puo' usare FitMesh Sync.
 * Solo fatti con fonte accanto alla frase; nessuna funzione del candidato di
 * sviluppo e' descritta come disponibile.
 *
 * Pubblicazione IT/EN con redirect 307 verso /en/ per le varianti locale non
 * tradotte (REDIRECT_INCOMPLETE_LOCALE_SLUGS in lib/blog/indexability.ts).
 */
import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "apple-watch-galaxy-watch-dati-fitmesh",
  category: "ecosystem",
  publishedAt: "2026-10-21",
  updatedAt: "2026-10-21",
  hero: {
    kicker: { it: "Ecosistema", en: "Ecosystem" },
    title: { it: "Apple Watch e Galaxy Watch: quali dati condividono e che cosa può usare FitMesh", en: "Apple Watch and Galaxy Watch: what data they share and what FitMesh can use" },
    subtitle: { it: "Un confronto pratico fra ciò che registra ciascun orologio, ciò che arriva ad Apple Salute o Health Connect e dove si inserisce FitMesh.", en: "A practical comparison of what each watch records, what reaches Apple Health or Health Connect, and where FitMesh fits." },
  },
  seoTitle: { it: "Apple Watch e Galaxy Watch: dati condivisi con FitMesh", en: "Apple Watch vs Galaxy Watch: data shared with FitMesh" },
  metaDescription: { it: "Quali dati registrano Apple Watch e Galaxy Watch, quali arrivano ad Apple Salute o Health Connect e cosa può leggere FitMesh. SDNN e RMSSD spiegati.", en: "Which data Apple Watch and Galaxy Watch record, which reach Apple Health or Health Connect, and what FitMesh can read. SDNN and RMSSD explained." },
  primaryKeyword: {
    it: "apple watch galaxy watch dati fitmesh",
    en: "apple watch galaxy watch fitmesh data",
  },
  secondaryKeywords: {
    it: [
      "apple watch samsung health connect",
      "differenza hrv sdnn rmssd apple watch galaxy",
      "dati orologio fitmesh",
      "energy score samsung health connect",
      "parametri vitali apple watch esportazione",
    ],
    en: [
      "apple watch galaxy watch health connect",
      "hrv sdnn vs rmssd apple watch galaxy",
      "smartwatch data fitmesh",
      "samsung energy score health connect",
      "apple watch vitals export healthkit",
    ],
  },
  readMinutes: 7,
  coverAlt: {
    it: "Illustrazione editoriale di uno smartwatch quadrato e uno circolare collegati da tracciati luminosi di dati fisiologici",
    en: "Editorial illustration of a square smartwatch and a circular smartwatch connected by glowing physiological data streams",
  },
  coverCaption: {
    it: "Illustrazione editoriale del confronto tra gli ecosistemi software Apple Watch e Galaxy Watch",
    en: "Editorial illustration of the software ecosystem comparison between Apple Watch and Galaxy Watch",
  },
  tldr: {
    it: ["Entrambi gli orologi registrano frequenza cardiaca, sonno, passi e allenamenti e li condividono con il telefono: Apple Salute su iPhone, Health Connect su Android.", "I punteggi mostrati sull'orologio (Parametri Vitali e Readiness di Apple, Energy Score di Samsung) restano nell'app del marchio: nella documentazione Apple e di Health Connect consultata non c'è un tipo di dato corrispondente.", "Apple Watch conserva l'HRV come SDNN e Health Connect la definisce come RMSSD. Sono calcoli diversi: i numeri non vanno confrontati.", "FitMesh Sync legge ciò che Apple Salute o Health Connect contengono, con il tuo permesso. Il selettore di compatibilità mostra, orologio per orologio e dato per dato, quali percorsi sono documentati e quali non verificati."],
    en: ["Both watches record heart rate, sleep, steps and workouts and share them with the phone: Apple Health on iPhone, Health Connect on Android.", "Scores shown on the watch (Apple's Vitals and Readiness, Samsung's Energy Score) stay in each brand's app: no matching data type appears in the Apple and Health Connect documentation consulted.", "Apple Watch stores heart rate variability as SDNN and Health Connect defines it as RMSSD. They are different calculations, so the numbers should not be compared.", "FitMesh Sync reads what Apple Health or Health Connect holds, with your permission. The compatibility selector shows, watch by watch and data type by data type, which routes are documented and which are not verified."],
  },
  body: [
    {
      type: "paragraph",
      text: { it: "Apple Watch e Galaxy Watch registrano entrambi frequenza cardiaca, sonno, passi e allenamenti, e li passano entrambi all'archivio salute del telefono: Apple Salute su iPhone, Health Connect su Android. Una parte di ciò che l'orologio mostra sul display non esce dalla sua app, come i punteggi di marca, e alcune misure dipendono dal modello e dal paese. FitMesh Sync legge ciò che Apple Salute o Health Connect contengono, con il tuo permesso.", en: "Apple Watch and Galaxy Watch both record heart rate, sleep, steps and workouts, and both pass them to the phone's health store: Apple Health on iPhone, Health Connect on Android. Part of what the watch shows on its screen never leaves its own app, such as brand scores, and some measurements depend on the model and the country. FitMesh Sync reads what Apple Health or Health Connect holds, with your permission." },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Che cosa condivide ciascun orologio con il telefono", en: "What each watch shares with the phone" },
    },
    {
      type: "paragraph",
      text: { it: "La tabella riassume ciò che documentano le fonti consultate. Descrive gli archivi di dati, non le schermate di FitMesh: l'ultima colonna rimanda al selettore di compatibilità, dove ogni combinazione ha uno stato e i suoi limiti.", en: "The table summarizes what the sources consulted document. It describes data stores, not FitMesh screens: the last column points to the compatibility selector, where each combination has a status and its limits." },
    },
    {
      type: "table",
      headers: { it: ["Dato", "Apple Watch", "Galaxy Watch", "Dove si può leggere", "FitMesh"], en: ["Data", "Apple Watch", "Galaxy Watch", "Where it can be read", "FitMesh"] },
      rows: [
      { it: ["Passi, frequenza cardiaca, sonno", "Registrati e conservati in Apple Salute.", "Registrati in Samsung Health; Samsung documenta la sincronizzazione di passi, frequenza cardiaca e sonno con Health Connect.", "Apple Salute (iPhone); Health Connect (Android)", "Percorso documentato nel selettore"], en: ["Steps, heart rate, sleep", "Recorded and stored in Apple Health.", "Recorded in Samsung Health; Samsung documents steps, heart rate and sleep as synchronized to Health Connect.", "Apple Health (iPhone); Health Connect (Android)", "Route documented in the selector"] },
      { it: ["Allenamenti", "Conservati in Apple Salute.", "Le sedute di esercizio arrivano in Health Connect con calorie, distanza e velocità dell'exercise tracker; i dati di attività giornaliera non si sincronizzano.", "Apple Salute; Health Connect", "Condizionato nel selettore: la precisione delle distanze è ancora in verifica"], en: ["Workouts", "Stored in Apple Health.", "Exercise sessions reach Health Connect with calories, distance and speed from the exercise tracker; all-day activity tracker data does not sync.", "Apple Health; Health Connect", "Conditional in the selector: distance accuracy is still being checked"] },
      { it: ["Variabilità cardiaca (HRV)", "Apple Salute conserva l'SDNN. Le modalità Recovery HRV e Overall HRV (Ultra 4) usano formule che Apple non ha pubblicato.", "Nell'elenco Samsung dei dati sincronizzati con Health Connect non c'è una voce HRV.", "Apple Salute: SDNN. Health Connect: tipo di record RMSSD.", "Non verificato nel selettore"], en: ["Heart rate variability (HRV)", "Apple Health holds SDNN. The Recovery HRV and Overall HRV modes (Ultra 4) use formulas Apple has not published.", "Samsung's list of data synced to Health Connect has no HRV entry.", "Apple Health: SDNN. Health Connect: RMSSD record type.", "Not verified in the selector"] },
      { it: ["Ossigeno nel sangue (SpO2)", "Serie 6 e successive e Ultra; misure su richiesta e in background se attive; la disponibilità varia da paese a paese.", "Samsung Health misura l'ossigeno nel sangue e lo elenca fra i dati che possono arrivare in Health Connect.", "Entrambi gli archivi definiscono un tipo per l'ossigeno nel sangue.", "Non verificato nel selettore"], en: ["Blood oxygen (SpO2)", "Series 6 and later and Ultra; readings on demand and in the background when enabled; availability varies by country.", "Samsung Health measures blood oxygen and lists it among the data that can reach Health Connect.", "Both stores define a blood oxygen type.", "Not verified in the selector"] },
      { it: ["Punteggi di marca", "Parametri Vitali (confronto notturno con il proprio intervallo abituale); Readiness da 0 a 10 su Series 12 e Ultra 4.", "Energy Score.", "Nessun tipo di dato corrispondente nella documentazione consultata. Samsung offre l'Energy Score in sola lettura con il suo Samsung Health Data SDK, un percorso diverso da Health Connect.", "Non letto (selettore)"], en: ["Brand scores", "Vitals (overnight comparison with your typical range); Readiness from 0 to 10 on Series 12 and Ultra 4.", "Energy Score.", "No matching data type in the documentation consulted. Samsung offers the Energy Score read-only through its Samsung Health Data SDK, a separate route from Health Connect.", "Not read (selector)"] },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Misure che dipendono dal modello e dal paese", en: "Measurements that depend on model and country" },
    },
    {
      type: "list",
      items: { it: ["**ECG.** Apple Watch Series 4 o successivo e Ultra, dove l'app ECG è disponibile ([Apple Support](https://support.apple.com/en-us/120278)); non su Apple Watch SE. Su Galaxy Watch serve l'app Samsung Health Monitor, uno smartphone Galaxy con Android 12 o successivo e un paese in cui l'app è stata rilasciata ([Samsung Support](https://www.samsung.com/us/support/answer/ANS10003433/)). Nell'elenco Samsung dei dati sincronizzati con Health Connect non compare nessuna registrazione ECG.", "**Pressione arteriosa (Galaxy Watch).** Secondo Samsung richiede una calibrazione iniziale e poi ogni 28 giorni con uno sfigmomanometro da braccio separato, uno smartphone Galaxy con Android 12 o successivo e un paese in cui la funzione è stata rilasciata ([Samsung Support](https://www.samsung.com/us/support/answer/ANS10003433/)). La tabella per sviluppatori di Samsung elenca la pressione fra i dati che possono arrivare in Health Connect e precisa che l'ambito dipende dalla versione di Samsung Health ([Samsung Developer](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect)).", "**Composizione corporea, BIA (Galaxy Watch).** Disponibile dalla serie Galaxy Watch4 in poi. Samsung documenta l'arrivo in Health Connect di grasso corporeo, peso e metabolismo basale ([Samsung Developer](https://developer.samsung.com/health/blog/en/health/blog/reading-body-composition-data-with-galaxy-watch-via-health-connect-api)); per gli altri valori le fonti consultate non dicono nulla.", "**Ossigeno nel sangue (Apple Watch).** Per impostazione predefinita è disponibile solo in alcuni paesi e regioni: controlla la pagina di disponibilità di Apple ([Apple Support](https://support.apple.com/en-us/120358))."], en: ["**ECG.** Apple Watch Series 4 or later and Ultra, where the ECG app is available ([Apple Support](https://support.apple.com/en-us/120278)); not on Apple Watch SE. On Galaxy Watch it needs the Samsung Health Monitor app, a Galaxy phone with Android 12 or later and a country where the app has been released ([Samsung Support](https://www.samsung.com/us/support/answer/ANS10003433/)). No ECG recording appears in Samsung's list of data synced to Health Connect.", "**Blood pressure (Galaxy Watch).** According to Samsung it requires an initial calibration and then one every 28 days with a separate upper-arm cuff, a Galaxy phone with Android 12 or later and a country where the feature has been released ([Samsung Support](https://www.samsung.com/us/support/answer/ANS10003433/)). Samsung's developer table lists blood pressure among the data that can reach Health Connect and says the scope depends on the Samsung Health version ([Samsung Developer](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect)).", "**Body composition, BIA (Galaxy Watch).** Available from the Galaxy Watch4 series onward. Samsung documents body fat, weight and basal metabolic rate reaching Health Connect ([Samsung Developer](https://developer.samsung.com/health/blog/en/health/blog/reading-body-composition-data-with-galaxy-watch-via-health-connect-api)); for other values the sources consulted say nothing.", "**Blood oxygen (Apple Watch).** By default it is available only in certain countries and regions: check Apple's availability page ([Apple Support](https://support.apple.com/en-us/120358))."] },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Perché l'HRV dei due orologi non è confrontabile", en: "Why HRV from the two watches is not comparable" },
    },
    {
      type: "paragraph",
      text: { it: "La variabilità cardiaca (HRV) è la variazione del tempo fra un battito e il successivo. Due calcoli molto usati la esprimono in millisecondi, e per questo i valori di orologi diversi sembrano intercambiabili: SDNN e RMSSD.", en: "Heart rate variability (HRV) is the variation in time between one heartbeat and the next. Two common calculations give it in milliseconds, which makes values from different watches look interchangeable: SDNN and RMSSD." },
    },
    {
      type: "list",
      items: { it: ["**SDNN** misura quanto si disperdono nel complesso gli intervalli fra i battiti. Apple Salute conserva le letture di Apple Watch come SDNN ([documentazione Apple HealthKit](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifierheartratevariabilitysdnn)).", "**RMSSD** misura le differenze fra intervalli consecutivi e riflette soprattutto le variazioni a breve termine legate a riposo e recupero. Health Connect definisce un tipo di record per questo valore ([Android Developers](https://developer.android.com/reference/kotlin/androidx/health/connect/client/records/HeartRateVariabilityRmssdRecord)), ma conserva solo ciò che un'app calcola e vi scrive.", "Nell'elenco Samsung dei dati sincronizzati da Samsung Health a Health Connect non c'è una voce HRV: un valore HRV mostrato in Samsung Health non va dato per scontato in Health Connect."], en: ["**SDNN** measures how widely the intervals between beats are spread overall. Apple Health stores Apple Watch readings as SDNN ([Apple HealthKit documentation](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifierheartratevariabilitysdnn)).", "**RMSSD** measures the differences between consecutive intervals and mostly reflects short-term changes linked to rest and recovery. Health Connect defines a record type for it ([Android Developers](https://developer.android.com/reference/kotlin/androidx/health/connect/client/records/HeartRateVariabilityRmssdRecord)), but it only stores what an app calculates and writes there.", "Samsung's list of data synced from Samsung Health to Health Connect has no HRV entry, so an HRV value shown in Samsung Health should not be assumed to appear in Health Connect."] },
    },
    {
      type: "paragraph",
      text: { it: "Nessun fattore fisso converte l'SDNN in RMSSD. Apple non ha pubblicato le formule di Recovery HRV e Overall HRV, quindi i nomi non dicono quale calcolo usino ([Apple Newsroom, 9 settembre 2026](https://www.apple.com/newsroom/2026/09/apple-unveils-apple-watch-ultra-4/)). Confronta l'HRV solo con letture dello stesso orologio e dello stesso metodo. Per capire che cosa significano i valori: [HRV, significato e valori](/it/blog/hrv-cose-significato-valori).", en: "No fixed factor converts SDNN into RMSSD. Apple has not published the formulas behind Recovery HRV and Overall HRV, so the names do not tell you which calculation they use ([Apple Newsroom, September 9, 2026](https://www.apple.com/newsroom/2026/09/apple-unveils-apple-watch-ultra-4/)). Compare HRV only with readings from the same watch and the same method. For what the values mean: [HRV values explained](/en/blog/what-is-hrv-meaning-values)." },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "I punteggi che restano nell'app del marchio", en: "Scores that stay in the brand's app" },
    },
    {
      type: "paragraph",
      text: { it: "Il punteggio Readiness di Apple va da 0 a 10 ed è disponibile su Apple Watch Series 12 e Ultra 4 ([Apple Support](https://support.apple.com/guide/watch/readiness-flx4gnzby346/watchos)). Parametri Vitali confronta le misure notturne con il tuo intervallo abituale ([Apple Support](https://support.apple.com/en-us/120142)). Samsung descrive l'Energy Score come la misura giornaliera della prontezza fisica e mentale, senza indicare un intervallo di valori, e ne offre l'accesso in sola lettura con il Samsung Health Data SDK ([Samsung Developer](https://developer.samsung.com/health/data/api-reference/-shd/com.samsung.android.sdk.health.data.request/-data-type/-energy-score-type/index.html)). Nella documentazione HealthKit e fra i tipi di dato di Health Connect consultati, nessuno di questi punteggi ha un tipo corrispondente: non risulta quindi un tipo di dato da cui un'altra app possa leggerli dall'archivio salute del telefono. FitMesh non li legge.", en: "Apple's Readiness score runs from 0 to 10 and is available on Apple Watch Series 12 and Ultra 4 ([Apple Support](https://support.apple.com/guide/watch/readiness-flx4gnzby346/watchos)). Vitals compares overnight measurements with your typical range ([Apple Support](https://support.apple.com/en-us/120142)). Samsung describes its Energy Score as the daily measurement of physical and mental readiness, without stating a value range, and offers read-only access through the Samsung Health Data SDK ([Samsung Developer](https://developer.samsung.com/health/data/api-reference/-shd/com.samsung.android.sdk.health.data.request/-data-type/-energy-score-type/index.html)). In the HealthKit documentation and the Health Connect data types consulted, none of these scores has a matching type, so we found no data type through which another app could read them from the phone's health store. FitMesh does not read them." },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Che cosa può usare FitMesh", en: "What FitMesh can use" },
    },
    {
      type: "paragraph",
      text: { it: "FitMesh Sync legge, con il tuo permesso, i dati che Apple Salute (iPhone) o Health Connect (Android) già contengono. Per Apple Watch e Galaxy Watch il selettore di compatibilità indica passi, frequenza cardiaca e sonno con le fasi come percorsi documentati, gli allenamenti come condizionati, HRV, ossigeno nel sangue e temperatura come non verificati. Dove il selettore dice non verificato, non aspettarti che FitMesh mostri quel valore. Il selettore è disponibile in italiano e in inglese.", en: "FitMesh Sync reads, with your permission, the data that Apple Health (iPhone) or Health Connect (Android) already holds. For Apple Watch and Galaxy Watch, the compatibility selector marks steps, heart rate and sleep with stages as documented routes, workouts as conditional, and HRV, blood oxygen and temperature as not verified. Where the selector says not verified, do not expect FitMesh to show that value. The selector is available in Italian and English." },
    },
    {
      type: "paragraph",
      text: { it: "Per i dettagli di ciascun percorso: [come funziona Health Connect](/it/blog/come-funziona-health-connect) su Android, [la nuova Apple Salute](/it/blog/nuova-apple-health-rende-inutili-altre-app) su iPhone, e [Health Connect su Galaxy Watch Ultra2 e Watch9](/it/blog/galaxy-watch-ultra2-watch9-health-connect).", en: "For the details of each route: [how Health Connect works](/en/blog/how-does-health-connect-work) on Android, [the new Apple Health](/en/blog/will-new-apple-health-replace-other-apps) on iPhone, and [Health Connect on Galaxy Watch Ultra2 and Watch9](/en/blog/galaxy-watch-ultra2-watch9-health-connect)." },
    },
    {
      type: "fitmesh-editorial-cta",
      contentCluster: "general",
      placement: "article_end",
      title: { it: "Controlla il tuo orologio prima di installare", en: "Check your watch before you install" },
      body: { it: "Il selettore di compatibilità indica, per ogni orologio e per ogni dato, il percorso che usa FitMesh e il suo stato. Se la tua combinazione è documentata, installa FitMesh Sync per il tuo telefono.", en: "The compatibility selector lists, for each watch and each data type, the route FitMesh uses and its status. If your combination is documented, install FitMesh Sync for your phone." },
      benefits: { it: ["Legge ciò che l'app dell'orologio scrive in Apple Salute o Health Connect, con il tuo permesso", "Ogni risultato riporta la fonte e i limiti", "Ogni risultato dice se il percorso è documentato, condizionato, non verificato o non supportato"], en: ["Reads what the watch app writes to Apple Health or Health Connect, with your permission", "Each result names its source and its limits", "Each result says whether the route is documented, conditional, not verified or unsupported"] },
      secondaryLabel: { it: "Apri il selettore di compatibilità", en: "Open the compatibility selector" },
      secondaryHref: { it: "/it/integrations#compatibility", en: "/en/integrations#compatibility" },
    },
  ],
  related: ["hrv-cose-significato-valori", "galaxy-watch-ultra2-watch9-health-connect", "nuova-apple-health-rende-inutili-altre-app", "come-funziona-health-connect"],
  sources: ["https://www.apple.com/newsroom/2026/09/apple-unveils-apple-watch-ultra-4/", "https://support.apple.com/guide/watch/readiness-flx4gnzby346/watchos", "https://support.apple.com/en-us/120142", "https://support.apple.com/en-us/120278", "https://support.apple.com/en-us/120358", "https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifierheartratevariabilitysdnn", "https://developer.android.com/reference/kotlin/androidx/health/connect/client/records/HeartRateVariabilityRmssdRecord", "https://developer.samsung.com/health/health-connect-faq.html", "https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect", "https://www.samsung.com/us/support/answer/ANS10003433/", "https://developer.samsung.com/health/blog/en/health/blog/reading-body-composition-data-with-galaxy-watch-via-health-connect-api", "https://developer.samsung.com/health/data/api-reference/-shd/com.samsung.android.sdk.health.data.request/-data-type/-energy-score-type/index.html"],
  brandsMentioned: ["Apple", "Samsung", "Google"],
  ldType: "BlogPosting",
};
