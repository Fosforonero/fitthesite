import type { BlogPost } from "../types";

/**
 * Cornerstone: multi-wearable setup e deduplicazione dati.
 * Caso narrativo: Galaxy Watch quotidiano + anello smart (Oura/Galaxy Ring) +
 * GPS watch da corsa (Garmin) + watch outdoor/vela (Suunto).
 * Target: utenti avanzati con 2+ wearable che vedono dati sporchi.
 */
export const post: BlogPost = {
  slug: "piu-smartwatch-insieme-dati-doppi",
  category: "guides",
  publishedAt: "2026-06-10",
  updatedAt: "2026-06-14",
  pillar: true,
  readMinutes: 16,
  tldr: {
    it: [
      "Health Connect non deduplica: è un database neutro per sorgente e ogni app scrive in modo indipendente. La logica di dedup deve stare nell'app che aggrega.",
      "I tre problemi tipici: passi duplicati da record cumulativi sovrapposti, sessioni di sonno duplicate, frequenza cardiaca media inquinata da contesti diversi.",
      "La strategia corretta combina tre tecniche: winner-takes-all per finestra temporale (HR), slot-merge a 15 minuti (passi), clustering con priorità sorgente (sonno).",
      "Due cose richiedono configurazione manuale: quale dispositivo indossi di notte e disabilitare Google Fit come sorgente di scrittura se ancora attivo.",
      "FitMesh Sync applica questa deduplicazione in automatico e separa sempre HR a riposo da HR di allenamento.",
    ],
    en: [
      "Health Connect does not deduplicate: it is a source-neutral database and each app writes independently. Dedup logic must live in the aggregating app.",
      "Three typical problems: duplicate steps from overlapping cumulative records, duplicate sleep sessions, average heart rate contaminated by different contexts.",
      "The correct strategy combines three techniques: winner-takes-all by time window (HR), 15-minute slot-merge (steps), clustering with source priority (sleep).",
      "Two things require manual configuration: which device you wear at night and disabling Google Fit as a write source if still active.",
      "FitMesh Sync applies this deduplication automatically and always separates resting HR from workout HR.",
    ],
  },
  primaryKeyword: {
    it: "più smartwatch insieme dati doppi deduplicazione",
    en: "multiple smartwatches duplicate data deduplication",
  },
  secondaryKeywords: {
    it: [
      "dashboard multi-sorgente wearable",
      "passi contati due volte smartwatch",
      "sonno doppio anello smart",
      "frequenza cardiaca sorgenti miste",
      "Garmin Suunto Galaxy Watch insieme",
      "deduplicare dati salute health connect",
    ],
    en: [
      "multi-source wearable dashboard",
      "steps counted twice smartwatch",
      "duplicate sleep data smart ring",
      "heart rate mixed sources",
      "Garmin Suunto Galaxy Watch together",
      "deduplicate health data health connect",
    ],
  },
  metaDescription: {
    it: "Usi più wearable insieme (smartwatch, anello smart, GPS watch)? Ecco perché i dati si duplicano, come funziona la deduplicazione e cosa devi configurare tu rispetto a quello che fa FitMesh Sync in automatico.",
    en: "Using multiple wearables together (smartwatch, smart ring, GPS watch)? Here's why data duplicates, how deduplication works, and what you need to configure vs. what FitMesh Sync handles automatically.",
  },
  hero: {
    kicker: { it: "Guida pilastro", en: "Pillar guide" },
    title: {
      it: "Più smartwatch insieme senza dati doppi: guida alla deduplicazione multi-wearable",
      en: "Multiple smartwatches, no duplicate data: the multi-wearable deduplication guide",
    },
    subtitle: {
      it: "Ogni wearable pensa di essere l'unica fonte di verità, e ha ragione dal suo punto di vista. Il problema nasce quando cinque fonti di verità scrivono tutte in Health Connect e nessuna sa dell'esistenza delle altre.",
      en: "Every wearable thinks it's the only source of truth, and it's right from its own perspective. The problem starts when five sources of truth all write to Health Connect and none of them knows the others exist.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se indossi più di un wearable, i tuoi passi sono quasi certamente gonfiati. Non per un bug: è il comportamento atteso di un ecosistema progettato per dispositivi singoli, usato da qualcuno che ha capito che strumenti diversi fanno cose diverse meglio. Un Galaxy Watch per il quotidiano, un anello smart per il sonno, un Garmin per le corse lunghe, un Suunto per le uscite in barca o in montagna: ogni dispositivo eccelle nel suo contesto. La dashboard, però, deve sapere che le 8.000 passi del mattino non vanno sommate alle 8.000 passi che Garmin ha registrato durante la corsa pomeridiana che passava per gli stessi marciapiedi.",
        en: "If you wear more than one wearable, your step count is almost certainly inflated. Not because of a bug: it's the expected behavior of an ecosystem designed for single devices, used by someone who has figured out that different tools do different things better. A Galaxy Watch for everyday use, a smart ring for sleep, a Garmin for long runs, a Suunto for sailing or mountain outings: each device excels in its context. But the dashboard needs to know that the 8,000 morning steps shouldn't be added to the 8,000 steps Garmin recorded during the afternoon run that went through the same streets.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "TL;DR: quello che conta davvero",
        en: "TL;DR: what actually matters",
      },
      body: {
        it: "I dati si duplicano perché Health Connect non ha un meccanismo nativo di deduplicazione tra app: ogni sorgente scrive il suo record indipendentemente. La soluzione non è disabilitare dispositivi, ma assegnare a ogni tipo di dato una sorgente vincente (winner-takes-all per ora del giorno, merge field-level per metriche giornaliere, clustering temporale per il sonno). FitMesh Sync fa questo in automatico per la maggior parte dei casi; per alcuni scenari avanzati serve una configurazione manuale descritta in questa guida.",
        en: "Data duplicates because Health Connect has no native cross-app deduplication mechanism: each source writes its own record independently. The solution isn't disabling devices, but assigning a winning source to each data type (winner-takes-all by time of day, field-level merge for daily metrics, temporal clustering for sleep). FitMesh Sync handles this automatically for most cases; some advanced scenarios require manual configuration described in this guide.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché i dati si duplicano: la radice tecnica del problema",
        en: "Why data duplicates: the technical root cause",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect è un database locale su Android. Ogni app con i permessi giusti può scriverci record di qualsiasi tipo: passi, frequenza cardiaca, sessioni di sonno, allenamenti. Health Connect non sa se due record sono la stessa cosa misurata due volte: non ha un campo \"sorgente primaria\" e non de-duplica in automatico. Questa è una scelta di design deliberata, non un limite tecnico: il sistema è neutro rispetto alle sorgenti per non favorire nessun produttore.",
        en: "Health Connect is a local database on Android. Any app with the right permissions can write records of any type: steps, heart rate, sleep sessions, workouts. Health Connect doesn't know if two records represent the same thing measured twice: it has no 'primary source' field and doesn't auto-deduplicate. This is a deliberate design choice, not a technical limitation: the system is source-neutral to avoid favoring any manufacturer.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il problema concreto: quando indossi Galaxy Watch e Garmin durante una corsa di 10 km, entrambi scrivono in Health Connect. Galaxy Watch scrive i suoi 9.847 passi, Garmin scrive i suoi 10.124 passi (numeri che divergono perché le calibrazioni del sensore sono diverse). Un'app che legge Health Connect senza logica di deduplicazione li somma: risultato, 19.971 passi per una corsa da 10 km. È il doppio. E per la frequenza cardiaca è peggio: le medie vengono contaminate da misure prese in contesti fisici diversi.",
        en: "The concrete problem: when you wear both a Galaxy Watch and Garmin during a 10 km run, both write to Health Connect. Galaxy Watch writes its 9,847 steps, Garmin writes its 10,124 steps (numbers diverge because sensor calibrations differ). An app that reads Health Connect without deduplication logic sums them up: result, 19,971 steps for a 10 km run. That's double. And for heart rate it's worse: averages get contaminated by measurements taken in different physical contexts.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "Tre pattern di duplicazione che incontro più spesso",
        en: "Three duplication patterns I encounter most often",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Record cumulativi sommati**: per i passi, alcune app scrivono record cumulativi (\"passi totali del giorno fino a ora\") invece che record intraday. Se sia Galaxy Watch che Garmin Connect usano record cumulativi, il totale a fine giornata è la somma di due totali, non un totale deduplificato.",
          "**Sessioni di sonno sovrapposte**: Galaxy Ring o Oura scrivono una sessione di sonno 22:30-06:45. Galaxy Watch scrive 22:35-06:40 (stessa notte, finestre leggermente diverse). Un aggregatore che non clustera temporalmente le sessioni mostra due notti di sonno, raddoppiando le ore totali e inquinando le medie di sleep score.",
          "**Frequenza cardiaca media giornaliera da sorgenti miste**: la fascia cardiaca Polar H10 che usi durante il workout scrive 147 bpm come media dell'allenamento. Il Galaxy Watch ha scritto 72 bpm come media a riposo del pomeriggio. Senza taggare le finestre temporali, la media giornaliera diventa un numero privo di senso fisico.",
        ],
        en: [
          "**Summed cumulative records**: for steps, some apps write cumulative records ('total steps so far today') instead of intraday records. If both Galaxy Watch and Garmin Connect use cumulative records, the end-of-day total is the sum of two totals, not a deduplicated total.",
          "**Overlapping sleep sessions**: Galaxy Ring or Oura writes a sleep session 22:30-06:45. Galaxy Watch writes 22:35-06:40 (same night, slightly different windows). An aggregator that doesn't temporally cluster sessions shows two nights of sleep, doubling total hours and skewing sleep score averages.",
          "**Daily average heart rate from mixed sources**: your Polar H10 chest strap writes 147 bpm as the workout average. The Galaxy Watch wrote 72 bpm as the afternoon resting average. Without tagging time windows, the daily average becomes a physically meaningless number.",
        ],
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: {
        it: "Gotcha: Samsung Health scrive due volte",
        en: "Gotcha: Samsung Health writes twice",
      },
      body: {
        it: "Samsung Health su Galaxy Watch scrive in Health Connect, ma su alcuni telefoni Samsung scrive anche su Google Fit (ancora attivo in background su dispositivi pre-2024). Se Google Fit a sua volta ha un'integrazione attiva con Health Connect, lo stesso record di passi finisce in Health Connect due volte con source_app diverso. Risultato: anche senza Garmin, i tuoi passi sono il doppio. Soluzione: vai in Samsung Health > Impostazioni > Connessioni app e verifica che Google Fit NON abbia permesso di scrittura attivo.",
        en: "Samsung Health on Galaxy Watch writes to Health Connect, but on some Samsung phones it also writes to Google Fit (still running in background on pre-2024 devices). If Google Fit in turn has an active Health Connect integration, the same step record ends up in Health Connect twice with different source_app. Result: even without Garmin, your steps are doubled. Fix: go to Samsung Health > Settings > Connected apps and verify Google Fit does NOT have active write permission.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il setup che sto descrivendo: quattro wearable, quattro ruoli",
        en: "The setup I'm describing: four wearables, four roles",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per essere concreti, lavoro su questo caso d'uso specifico: smartwatch quotidiano (Galaxy Watch 7) che traccia tutto in background, anello smart (Galaxy Ring o Oura Ring) ottimizzato per il monitoraggio del sonno con sensori di qualità superiore rispetto agli smartwatch, GPS watch da corsa (Garmin Forerunner) per le uscite di running con GPS preciso e analisi avanzata del VO2max, watch outdoor/vela (Suunto Race o Suunto Ocean) per uscite su barche e trekking dove serve log GPS e altimetro barometrico. Quattro dispositivi, quattro contesti d'uso, quattro app che scrivono in Health Connect.",
        en: "To be concrete, I'm working with this specific setup: everyday smartwatch (Galaxy Watch 7) tracking everything in background, smart ring (Galaxy Ring or Oura Ring) optimized for sleep monitoring with superior sensors compared to smartwatches, running GPS watch (Garmin Forerunner) for running sessions with precise GPS and advanced VO2max analysis, outdoor/sailing watch (Suunto Race or Suunto Ocean) for boat outings and trekking where GPS logging and barometric altimeter matter. Four devices, four use cases, four apps writing to Health Connect.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Quale wearable vince su quale metrica (winner-takes-all per contesto)",
        en: "Which wearable wins on which metric (winner-takes-all by context)",
      },
      headers: {
        it: ["Metrica", "Sorgente preferita", "Motivo", "Sorgenti da ignorare"],
        en: ["Metric", "Preferred source", "Reason", "Sources to ignore"],
      },
      rows: [
        {
          it: [
            "Sonno (durata, fasi, score)",
            "Anello smart (Oura / Galaxy Ring)",
            "Sensori PPG più vicini al polso/dito, meno interferenza da movimenti notturni",
            "Galaxy Watch, Garmin (stessa notte)",
          ],
          en: [
            "Sleep (duration, stages, score)",
            "Smart ring (Oura / Galaxy Ring)",
            "PPG sensors closer to finger, less interference from nighttime movements",
            "Galaxy Watch, Garmin (same night)",
          ],
        },
        {
          it: [
            "Passi giornalieri (non-workout)",
            "Galaxy Watch (quando indossato)",
            "Sempre al polso, copre la giornata completa",
            "Garmin, Suunto (non indossati tutto il giorno)",
          ],
          en: [
            "Daily steps (non-workout)",
            "Galaxy Watch (when worn)",
            "Always on wrist, covers the full day",
            "Garmin, Suunto (not worn all day)",
          ],
        },
        {
          it: [
            "Passi e distanza durante la corsa",
            "Garmin Forerunner",
            "GPS preciso, calibrazione passo specifica per running",
            "Galaxy Watch (meno preciso su lunghe distanze)",
          ],
          en: [
            "Steps and distance during run",
            "Garmin Forerunner",
            "Precise GPS, running-specific cadence calibration",
            "Galaxy Watch (less precise on long distances)",
          ],
        },
        {
          it: [
            "Frequenza cardiaca durante workout",
            "Sorgente specifica del workout (Garmin per corsa, Suunto per outdoor)",
            "Sensori ottici/fisici del dispositivo progettato per quel contesto",
            "Galaxy Watch (in background durante lo stesso orario)",
          ],
          en: [
            "Heart rate during workout",
            "Workout-specific source (Garmin for runs, Suunto for outdoor)",
            "Optical/physical sensors of the device designed for that context",
            "Galaxy Watch (running in background during same time window)",
          ],
        },
        {
          it: [
            "HRV (variabilità frequenza cardiaca)",
            "Anello smart (misurazione notturna)",
            "Misura a riposo profondo, il contesto più affidabile per l'HRV",
            "Galaxy Watch (misurazione diurna meno standardizzata)",
          ],
          en: [
            "HRV (heart rate variability)",
            "Smart ring (nighttime measurement)",
            "Measured at deep rest, the most reliable context for HRV",
            "Galaxy Watch (less standardized daytime measurement)",
          ],
        },
        {
          it: [
            "Log GPS e altimetria (outdoor/vela)",
            "Suunto",
            "Altimetro barometrico, GPS marino, log tracce lunga durata",
            "Galaxy Watch, Garmin (contesto non outdoor-specifico)",
          ],
          en: [
            "GPS log and altimetry (outdoor/sailing)",
            "Suunto",
            "Barometric altimeter, marine GPS, long-duration track logging",
            "Galaxy Watch, Garmin (not outdoor-specific context)",
          ],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come funziona la deduplicazione: tre strategie concrete",
        en: "How deduplication works: three concrete strategies",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "1. Winner-takes-all per sorgente e finestra temporale",
        en: "1. Winner-takes-all by source and time window",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per la frequenza cardiaca intraday e per i dati di workout, il metodo più affidabile è definire una priorità di sorgente per ogni finestra temporale. Se Garmin ha scritto dati di frecuenza cardiaca tra le 17:30 e le 18:45 (durata della corsa), qualsiasi dashboard seria usa quei dati e ignora i dati scritti da Galaxy Watch nella stessa finestra. Galaxy Watch torna \"vincente\" dalle 18:46 in poi, quando Garmin non sta più scrivendo record attivi.",
        en: "For intraday heart rate and workout data, the most reliable method is defining a source priority for each time window. If Garmin wrote heart rate data between 17:30 and 18:45 (run duration), any serious dashboard uses that data and ignores data written by Galaxy Watch in the same window. Galaxy Watch becomes 'winning' again from 18:46 onward, when Garmin is no longer writing active records.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "In pratica questo si implementa leggendo i record di tipo ExerciseSession da Health Connect: ogni sessione di allenamento ha un startTime e endTime. La logica di dedup usa queste finestre per decidere quale sorgente ha priorità per le metriche dentro quella finestra temporale.",
        en: "In practice this is implemented by reading ExerciseSession records from Health Connect: every workout session has a startTime and endTime. The dedup logic uses these windows to decide which source takes priority for metrics within that time window.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "2. Merge field-level per le metriche giornaliere aggregate",
        en: "2. Field-level merge for aggregated daily metrics",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per i passi totali giornalieri, la strategia winner-takes-all non è la soluzione giusta: Galaxy Watch raccoglie passi dalle 07:00 alle 17:29, Garmin raccoglie passi dalle 17:30 alle 18:45. La somma è corretta, non è una duplicazione. Il problema è se entrambi hanno registrato passi nella stessa finestra temporale.",
        en: "For total daily steps, winner-takes-all isn't the right solution: Galaxy Watch collects steps from 07:00 to 17:29, Garmin collects steps from 17:30 to 18:45. Adding them is correct, not duplication. The problem is when both have recorded steps in the same time window.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il merge field-level funziona così: dividi la giornata in slot di 15 minuti. Per ogni slot, tieni solo il record con il conteggio più alto tra tutte le sorgenti (conservativo, assume che il valore più alto sia il più accurato). Somma i massimi per slot: ottieni un totale giornaliero deduplificato. Questo approccio funziona perché due dispositivi che registrano gli stessi passi producono valori simili (il valore più alto è una stima della verità), mentre due dispositivi in contesti diversi producono valori additivi.",
        en: "Field-level merge works like this: divide the day into 15-minute slots. For each slot, keep only the highest-count record across all sources (conservative, assumes the highest value is the most accurate). Sum the per-slot maximums: you get a deduplicated daily total. This approach works because two devices recording the same steps produce similar values (the highest is an estimate of the truth), while two devices in different contexts produce additive values.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "3. Clustering temporale per le sessioni di sonno",
        en: "3. Temporal clustering for sleep sessions",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per il sonno, il problema è diverso: le sessioni di Oura Ring e Galaxy Watch per la stessa notte si sovrappongono quasi completamente, ma nessuna delle due è sbagliata. Semplicemente misurano la stessa cosa con sensori diversi. La strategia è il clustering: se due sessioni di sonno si sovrappongono per più dell'80% della durata, vengono considerate la stessa notte. A quel punto si applica la priorità di sorgente: l'anello smart vince perché il sensore ottico al dito è statisticamente più preciso per le fasi del sonno rispetto al sensore al polso.",
        en: "For sleep, the problem is different: Oura Ring and Galaxy Watch sessions for the same night overlap almost completely, but neither is wrong. They simply measure the same thing with different sensors. The strategy is clustering: if two sleep sessions overlap by more than 80% of their duration, they're treated as the same night. Source priority is then applied: the smart ring wins because optical sensors at the finger are statistically more precise for sleep stages than wrist sensors.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "La mia posizione netta sulla deduplicazione",
        en: "My clear stance on deduplication",
      },
      body: {
        it: "La deduplicazione non è una funzione opzionale di una dashboard multi-wearable: è il prerequisito. Una dashboard che mostra passi doppi o ore di sonno doppie non è utile, è peggio che nessuna dashboard perché crea falsa confidenza in dati sbagliati. Se stai valutando un'app di aggregazione e non trovi documentazione esplicita su come gestisce i duplicati, assumilo come segnale che il problema non è stato risolto.",
        en: "Deduplication is not an optional feature of a multi-wearable dashboard: it's the prerequisite. A dashboard showing doubled steps or doubled sleep hours isn't useful, it's worse than no dashboard because it creates false confidence in wrong data. If you're evaluating an aggregation app and can't find explicit documentation on how it handles duplicates, treat that as a signal the problem hasn't been solved.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa devi configurare tu: le tre impostazioni critiche",
        en: "What you need to configure: the three critical settings",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Non tutto può essere automatizzato. Ci sono tre configurazioni che richiedono input dell'utente perché dipendono da abitudini personali che nessun algoritmo può inferire.",
        en: "Not everything can be automated. There are three configurations that require user input because they depend on personal habits that no algorithm can infer.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Definire quale dispositivo è la tua sorgente principale per il sonno.** Se hai sia Galaxy Watch che anello smart, devi dirlo esplicitamente. FitMesh Sync te lo chiede durante l'onboarding (\"Quale dispositivo indossi di notte?\"). Se non lo specifichi, usa Galaxy Watch come fallback perché è il più comune, ma questa è una scelta arbitraria.",
          "**Disabilitare Google Fit come sorgente di scrittura se ancora attivo.** Vai in Health Connect > Gestione permessi > Google Fit e verifica che abbia solo permesso di lettura, non di scrittura. Google Fit deprecato che scrive ancora in Health Connect è la causa numero uno di passi triplicati nei setup multi-wearable.",
          "**Specificare i periodi di attività per i device specifici.** Se Garmin lo indossi solo durante le corse (mai a riposo), il sistema può ignorare i suoi dati di frequenza cardiaca fuori dalle finestre di allenamento. Senza questa informazione, la frequenza cardiaca a riposo misurata da Garmin durante un'attività lenta può inquinare la media di riposo.",
        ],
        en: [
          "**Define which device is your primary sleep source.** If you have both a Galaxy Watch and a smart ring, you need to say so explicitly. FitMesh Sync asks during onboarding ('Which device do you wear at night?'). If you don't specify, it defaults to Galaxy Watch as the most common fallback, but that's an arbitrary choice.",
          "**Disable Google Fit as a write source if still active.** Go to Health Connect > Permission management > Google Fit and verify it has read-only permission, not write. Deprecated Google Fit still writing to Health Connect is the number one cause of tripled steps in multi-wearable setups.",
          "**Specify active periods for specific devices.** If you only wear Garmin during runs (never at rest), the system can ignore its heart rate data outside workout windows. Without this information, resting heart rate measured by Garmin during a slow activity can contaminate the resting average.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il caso Suunto: dati che non passano per Health Connect",
        en: "The Suunto case: data that doesn't go through Health Connect",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Suunto è l'eccezione in questo scenario. A differenza di Garmin (che scrive in Health Connect nativamente da Garmin Connect Android), l'app Suunto su Android non ha un'integrazione nativa con Health Connect per tutti i tipi di dati. Le tracce GPS e i dati di allenamento da Suunto sono accessibili via API Suunto Sport Engine, non via Health Connect.",
        en: "Suunto is the exception in this scenario. Unlike Garmin (which writes to Health Connect natively from Garmin Connect Android), the Suunto app on Android doesn't have native Health Connect integration for all data types. GPS tracks and workout data from Suunto are accessible via the Suunto Sport Engine API, not via Health Connect.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo significa che per integrare Suunto in una dashboard multi-sorgente serve un connettore separato che legge dall'API Suunto Sport Engine con autenticazione OAuth. FitMesh Sync supporta questa integrazione separatamente: vai nelle impostazioni, sezione Dispositivi, e aggiungi Suunto come sorgente OAuth. Una volta connessa, i dati Suunto vengono uniti al flusso Health Connect con la stessa logica di deduplicazione.",
        en: "This means that integrating Suunto into a multi-source dashboard requires a separate connector that reads from the Suunto Sport Engine API with OAuth authentication. FitMesh Sync supports this integration separately: go to settings, Devices section, and add Suunto as an OAuth source. Once connected, Suunto data is merged into the Health Connect stream with the same deduplication logic.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Frequenza cardiaca media \"inquinata\": un esempio reale",
        en: "Contaminated average heart rate: a real example",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo è il problema che noto meno ovvio ma più dannoso per chi usa i dati per monitorare la salute nel tempo. Scenario: esegui una corsa di 45 minuti con fascia Polar H10 collegata a Garmin (dati affidabili per l'allenamento, media 148 bpm). Nel frattempo Galaxy Watch registra la tua frequenza cardiaca ogni 10 minuti in background, vedendo valori compresi tra 145 e 155 bpm (è corretto, sei in corsa). Dopo la corsa, stai seduto per due ore con frequenza cardiaca a 62-68 bpm. Galaxy Watch registra ancora.",
        en: "This is the problem I find least obvious but most damaging for people using data to monitor health over time. Scenario: you run for 45 minutes with a Polar H10 chest strap connected to Garmin (reliable workout data, average 148 bpm). Meanwhile Galaxy Watch records your heart rate every 10 minutes in background, seeing values between 145 and 155 bpm (correct, you're running). After the run, you sit for two hours with heart rate at 62-68 bpm. Galaxy Watch is still recording.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Una dashboard che calcola la \"frequenza cardiaca media giornaliera\" senza distinguere le sorgenti prende tutti questi dati, li somma e divide. Il risultato è un numero che non rappresenta né la frequenza a riposo né quella durante l'allenamento: è la media di cose che non andrebbero mediate insieme. Per questo motivo FitMesh Sync espone separatamente frequenza cardiaca a riposo (calcolata escludendo le finestre di allenamento) e frequenza cardiaca di allenamento (calcolata per tipo di attività), invece di mostrare un'unica media giornaliera.",
        en: "A dashboard that calculates 'daily average heart rate' without distinguishing sources takes all this data, sums it and divides. The result is a number that represents neither resting heart rate nor workout heart rate: it's the average of things that shouldn't be averaged together. That's why FitMesh Sync exposes resting heart rate (calculated excluding workout windows) and workout heart rate (calculated per activity type) separately, instead of showing a single daily average.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa fa FitMesh Sync in automatico",
        en: "What FitMesh Sync handles automatically",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Rilevamento automatico delle sessioni di allenamento**: legge gli ExerciseSession record da Health Connect e costruisce il grafico delle finestre attive per ogni sorgente.",
          "**Slot-merge dei passi a 15 minuti**: prende il massimo per slot su tutte le sorgenti, elimina la sovrapposizione senza perdere i dati additivi (Galaxy Watch mattina + Garmin corsa pomeridiana).",
          "**Clustering delle sessioni di sonno**: raggruppa sessioni sovrapposte oltre l'80% e applica la priorità anello > smartwatch per le fasi del sonno.",
          "**Separazione HR a riposo vs allenamento**: le finestre di allenamento vengono escluse dal calcolo della frequenza cardiaca a riposo.",
          "**Deduplicazione record Samsung duplicati**: filtra i record con lo stesso timestamp e source_package ripetuto (il bug Samsung noto di scrittura doppia).",
        ],
        en: [
          "**Automatic workout session detection**: reads ExerciseSession records from Health Connect and builds the active window map for each source.",
          "**15-minute slot-merge for steps**: takes the maximum per slot across all sources, eliminating overlap without losing additive data (Galaxy Watch morning + Garmin afternoon run).",
          "**Sleep session clustering**: groups sessions overlapping by more than 80% and applies ring > smartwatch priority for sleep stages.",
          "**Resting vs workout HR separation**: workout windows are excluded from resting heart rate calculation.",
          "**Samsung duplicate record deduplication**: filters records with the same timestamp and repeated source_package (the known Samsung double-write bug).",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Limiti onesti: cosa non si può automatizzare ancora",
        en: "Honest limits: what can't be automated yet",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Non voglio sopravvalutare quello che una dashboard può fare da sola. Ci sono scenari che al momento richiedono ancora intervento manuale o che producono risultati approssimativi:",
        en: "I don't want to oversell what a dashboard can do on its own. There are scenarios that still require manual intervention or that produce approximate results:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Allenamenti di nuoto con Suunto e Galaxy Watch sovrapposti**: Galaxy Watch riconosce il nuoto come ExerciseSession (tipo SWIMMING), Suunto registra il suo log via API Sport Engine. Se i timestamp si sovrappongono parzialmente (es. cambio corsia tra una vasca e l'altra), la fusione è conservativa ma non perfetta.",
          "**VO2max da sorgenti diverse**: Garmin calcola il suo VO2max con un algoritmo proprietario (FirstBeat), Galaxy Watch usa un altro metodo. Le stime non sono comparabili: FitMesh Sync al momento mostra le due metriche separatamente, non le fonde.",
          "**HRV da fascia pettorale durante il giorno vs anello la notte**: se usi una fascia Polar H10 per HRV mattutino e l'anello per HRV notturno, i valori sono corretti nei loro contesti ma non confrontabili direttamente. Questo è un limite non del software ma della biometria: HRV varia in base all'ora e alla postura.",
        ],
        en: [
          "**Swimming workouts with overlapping Suunto and Galaxy Watch**: Galaxy Watch recognizes swimming as an ExerciseSession (type SWIMMING), Suunto logs via Sport Engine API. If timestamps partially overlap (e.g., lane changes between laps), the merge is conservative but not perfect.",
          "**VO2max from different sources**: Garmin calculates its VO2max with a proprietary algorithm (FirstBeat), Galaxy Watch uses a different method. The estimates aren't comparable: FitMesh Sync currently shows the two metrics separately, not merged.",
          "**HRV from chest strap during the day vs ring at night**: if you use a Polar H10 for morning HRV and the ring for nocturnal HRV, the values are correct in their contexts but not directly comparable. This is a limit of biometrics, not software: HRV varies by time of day and body position.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi vedere i tuoi dati multi-wearable senza duplicati?",
        en: "Want to see your multi-wearable data without duplicates?",
      },
      body: {
        it: "FitMesh Sync legge da Health Connect, Garmin e Suunto, applica la deduplicazione automatica descritta in questa guida, e mostra passi, sonno e frequenza cardiaca separati per contesto. Dati su server EU, GDPR compliant.",
        en: "FitMesh Sync reads from Health Connect, Garmin, and Suunto, applies the automatic deduplication described in this guide, and shows steps, sleep and heart rate separated by context. Data on EU servers, GDPR compliant.",
      },
      ctaLabel: {
        it: "Prova FitMesh Sync →",
        en: "Try FitMesh Sync →",
      },
      ctaHref: {
        it: "/it/download",
        en: "/en/download",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "In sintesi",
        en: "In summary",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Health Connect non deduplica: è un database neutro per sorgente, e ogni app scrive indipendentemente. La logica di deduplicazione deve stare nell'app che aggrega.",
          "I tre problemi principali nei setup multi-wearable sono: passi duplicati da record cumulativi sovrapposti, sessioni di sonno duplicate da dispositivi che misurano la stessa notte, frequenza cardiaca media inquinata da misure in contesti fisici diversi.",
          "La strategia corretta è composta da tre tecniche complementari: winner-takes-all per finestra temporale (HR intraday), slot-merge a 15 minuti (passi), clustering temporale con priorità sorgente (sonno).",
          "Due cose richiedono configurazione manuale: quale dispositivo usi di notte, e disabilitare Google Fit da sorgente di scrittura se è ancora attivo.",
          "Suunto non passa per Health Connect: serve un connettore OAuth separato. I dati vengono poi unificati nella stessa logica di dedup.",
          "La frequenza cardiaca media giornaliera senza distinzione di contesto è un numero senza senso fisico: separa sempre HR a riposo da HR durante l'allenamento.",
        ],
        en: [
          "Health Connect doesn't deduplicate: it's a source-neutral database, and every app writes independently. Deduplication logic must live in the aggregating app.",
          "The three main problems in multi-wearable setups are: duplicate steps from overlapping cumulative records, duplicate sleep sessions from devices measuring the same night, contaminated average heart rate from measurements in different physical contexts.",
          "The correct strategy combines three complementary techniques: winner-takes-all by time window (intraday HR), 15-minute slot-merge (steps), temporal clustering with source priority (sleep).",
          "Two things require manual configuration: which device you wear at night, and disabling Google Fit as a write source if still active.",
          "Suunto doesn't go through Health Connect: a separate OAuth connector is needed. Data is then unified in the same dedup logic.",
          "Daily average heart rate without context distinction is a physically meaningless number: always separate resting HR from workout HR.",
        ],
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Posso usare Galaxy Watch e Garmin insieme senza dati doppi?",
        en: "Can I use Galaxy Watch and Garmin together without double data?",
      },
      a: {
        it: "Sì, ma richiede un aggregatore che gestisca la deduplicazione. Galaxy Watch e Garmin scrivono entrambi in Health Connect, quindi se apri Health Connect vedrai record di entrambi per le stesse metriche. Un'app come FitMesh Sync usa la logica winner-takes-all per le finestre di allenamento (Garmin vince durante la corsa) e il slot-merge a 15 minuti per i passi giornalieri (nessuna sorgente viene persa, ma i doppioni vengono eliminati).",
        en: "Yes, but it requires an aggregator that handles deduplication. Galaxy Watch and Garmin both write to Health Connect, so if you open Health Connect you'll see records from both for the same metrics. An app like FitMesh Sync uses winner-takes-all logic for workout windows (Garmin wins during the run) and 15-minute slot-merge for daily steps (no source is lost, but duplicates are eliminated).",
      },
    },
    {
      q: {
        it: "L'anello Oura si sincronizza con Health Connect?",
        en: "Does the Oura Ring sync with Health Connect?",
      },
      a: {
        it: "Sì, dal 2024 Oura Ring scrive i dati di sonno, frequenza cardiaca e attività in Health Connect su Android. I dati di sonno di Oura sono particolarmente dettagliati (fasi REM, light, deep con timestamping granulare) e vengono scritti come SleepSession record. Se hai anche Galaxy Watch attivo di notte, vedrai due SleepSession per la stessa notte: un aggregatore che non clustera produrrà ore di sonno doppie.",
        en: "Yes, since 2024 Oura Ring writes sleep, heart rate, and activity data to Health Connect on Android. Oura's sleep data is particularly detailed (REM, light, deep stages with granular timestamping) and is written as SleepSession records. If you also have Galaxy Watch active at night, you'll see two SleepSession records for the same night: an aggregator that doesn't cluster will produce doubled sleep hours.",
      },
    },
    {
      q: {
        it: "Come si deduplicano i passi quando ho più wearable che camminano con me?",
        en: "How are steps deduplicated when multiple wearables are walking with me?",
      },
      a: {
        it: "Il metodo più robusto è il slot-merge a finestra temporale. La giornata viene divisa in intervalli (tipicamente 5-15 minuti). Per ogni intervallo, si prende il valore massimo tra tutte le sorgenti. Questo funziona perché due dispositivi che misurano la stessa camminata producono valori simili (il massimo è una stima della verità), mentre due dispositivi in momenti diversi producono valori additivi corretti. Il risultato è un totale giornaliero che non somma le stesse camminate due volte, ma include correttamente la camminata mattutina col Galaxy Watch e la corsa pomeridiana con Garmin.",
        en: "The most robust method is time-window slot-merge. The day is divided into intervals (typically 5-15 minutes). For each interval, the maximum value across all sources is taken. This works because two devices measuring the same walk produce similar values (the maximum is an estimate of the truth), while two devices at different times produce correctly additive values. The result is a daily total that doesn't double-count the same walks, but correctly includes the morning walk with Galaxy Watch and the afternoon run with Garmin.",
      },
    },
    {
      q: {
        it: "Suunto scrive in Health Connect?",
        en: "Does Suunto write to Health Connect?",
      },
      a: {
        it: "Non completamente. A differenza di Garmin che ha un'integrazione Health Connect nativa dalla sua app Android, Suunto espone i dati principalmente tramite Suunto Sport Engine API con autenticazione OAuth. Questo significa che per integrare Suunto in una dashboard multi-sorgente serve un connettore separato che legge dall'API Suunto. FitMesh Sync include questo connettore: una volta aggiunto Suunto come sorgente OAuth, i dati vengono uniti al flusso principale con la stessa logica di deduplicazione.",
        en: "Not completely. Unlike Garmin which has native Health Connect integration from its Android app, Suunto exposes data primarily through the Suunto Sport Engine API with OAuth authentication. This means integrating Suunto into a multi-source dashboard requires a separate connector reading from the Suunto API. FitMesh Sync includes this connector: once Suunto is added as an OAuth source, data is merged into the main stream with the same deduplication logic.",
      },
    },
    {
      q: {
        it: "Perché la mia frequenza cardiaca media sembra troppo alta o troppo bassa con più wearable?",
        en: "Why does my average heart rate seem too high or too low with multiple wearables?",
      },
      a: {
        it: "Quasi certamente è un problema di contesto mescolato. Se la tua dashboard calcola la frequenza cardiaca media giornaliera sommando tutti i record di tutte le sorgenti, finisce per mediare la frequenza a riposo con quella durante l'allenamento. La soluzione è separare i contesti: frequenza cardiaca a riposo (calcolata solo sulle ore fuori dalle finestre di allenamento), frequenza cardiaca media di allenamento (calcolata solo durante le sessioni di esercizio, per tipo di attività). Una media unica giornaliera multi-sorgente non ha senso fisico.",
        en: "It's almost certainly a mixed-context problem. If your dashboard calculates daily average heart rate by summing all records from all sources, it ends up averaging resting heart rate with workout heart rate. The fix is to separate contexts: resting heart rate (calculated only on hours outside workout windows), average workout heart rate (calculated only during exercise sessions, per activity type). A single daily multi-source average has no physical meaning.",
      },
    },
    {
      q: {
        it: "Galaxy Ring e Galaxy Watch duplicano i dati di sonno?",
        en: "Do Galaxy Ring and Galaxy Watch duplicate sleep data?",
      },
      a: {
        it: "Sì, se li indossi entrambi di notte. Sia Galaxy Ring che Galaxy Watch scrivono in Health Connect sessioni di sonno per la stessa notte. Samsung Health cerca di gestire questo internamente (Galaxy Ring ha priorità se rilevato come sorgente attiva di notte), ma il comportamento non è garantito su tutti i dispositivi e versioni di One UI. Se usi un aggregatore di terze parti come FitMesh Sync, la logica di clustering sonno risolve il problema indipendentemente da Samsung Health.",
        en: "Yes, if you wear both at night. Both Galaxy Ring and Galaxy Watch write sleep sessions to Health Connect for the same night. Samsung Health tries to handle this internally (Galaxy Ring takes priority if detected as the active nighttime source), but the behavior isn't guaranteed across all devices and One UI versions. If you use a third-party aggregator like FitMesh Sync, the sleep clustering logic solves the problem independently of Samsung Health.",
      },
    },
  ],
  related: [
    "novita-fonte-del-dato",
    "best-health-data-sync-app-android",
    "come-funziona-health-connect",
    "hrv-cose-significato-valori",
    "guida-sync-wearable-2026",
  ],
  brandsMentioned: [
    "Samsung",
    "Garmin",
    "Suunto",
    "Oura",
    "Polar",
    "Google",
    "Apple",
  ],
  ldType: "BlogPosting",
};
