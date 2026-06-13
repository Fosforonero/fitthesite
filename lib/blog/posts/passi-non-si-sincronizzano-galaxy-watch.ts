import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "passi-non-si-sincronizzano-galaxy-watch",
  category: "guides",
  publishedAt: "2026-05-22",
  updatedAt: "2026-05-22",
  readMinutes: 8,
  tldr: {
    it: [
      "La catena di sync ha cinque passaggi: Watch→Bluetooth→Samsung Health→Health Connect→app terza. Il problema si trova quasi sempre al secondo o quarto.",
      "Causa numero uno: l'ottimizzazione batteria Android sospende Samsung Health in background. Disabilitala per Samsung Health e Galaxy Wearable.",
      "Su One UI controlla anche 'Avvio app' e abilita manualmente avvio automatico e in background.",
      "I dati storici non si sincronizzano retroattivamente su Health Connect: il passato resta in Samsung Health.",
      "Se tutto fallisce, 'Cancella cache' (non i dati) di Samsung Health e riavvia.",
    ],
    en: [
      "The sync chain has five steps: Watch→Bluetooth→Samsung Health→Health Connect→third-party app. The break is almost always at the second or fourth.",
      "Cause number one: Android battery optimization suspends Samsung Health in background. Disable it for Samsung Health and Galaxy Wearable.",
      "On One UI, also check 'App launch' and manually enable auto-launch and background launch.",
      "Historical data does not sync retroactively to Health Connect: the past stays in Samsung Health.",
      "If everything fails, 'Clear cache' (not data) on Samsung Health and restart.",
    ],
  },
  primaryKeyword: {
    it: "passi non si sincronizzano galaxy watch",
    en: "steps not syncing galaxy watch",
  },
  secondaryKeywords: {
    it: [
      "samsung health non sincronizza passi",
      "galaxy watch passi non contati",
      "galaxy watch dati non sincronizzati",
      "samsung health passi errati",
      "galaxy watch troubleshooting",
    ],
    en: [
      "samsung health not syncing steps",
      "galaxy watch steps not counted",
      "galaxy watch data not syncing",
      "samsung health steps wrong",
      "galaxy watch troubleshooting",
    ],
  },
  metaDescription: {
    it: "Passi Galaxy Watch non sincronizzati su Samsung Health? Guida passo-passo per risolvere: permessi, Health Connect, Bluetooth, ottimizzazione batteria, e i casi estremi. Con soluzione per ogni scenario.",
    en: "Galaxy Watch steps not syncing to Samsung Health? Step-by-step guide to fix it: permissions, Health Connect, Bluetooth, battery optimization, and edge cases. With a solution for each scenario.",
  },
  hero: {
    kicker: { it: "Risoluzione problemi", en: "Troubleshooting" },
    title: {
      it: "Galaxy Watch: passi non sincronizzati, come risolvere",
      en: "Galaxy Watch steps not syncing: how to fix it (2026 guide)",
    },
    subtitle: {
      it: "Il Galaxy Watch conta i passi sul polso, ma Samsung Health o un'altra app non li vede? Il problema ha cause precise, non è magia. Questa guida ti porta dalla diagnosi alla soluzione in ordine di probabilità, senza perdere tempo con le soluzioni sbagliate.",
      en: "Your Galaxy Watch counts steps on the wrist, but Samsung Health or another app doesn't see them? The problem has precise causes, it's not magic. This guide takes you from diagnosis to solution in order of probability, without wasting time on wrong fixes.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "I passi del Galaxy Watch non arrivano su Samsung Health per una manciata di cause precise e diagnosticabili: batteria ottimizzata che uccide l'app in background, permessi Health Connect mancanti, o firmware obsoleto. Identificare il punto esatto di rottura nella catena Watch→Bluetooth→Samsung Health→Health Connect risolve il problema nel 90% dei casi senza dover reinstallare nulla. Ecco la diagnostica nell'ordine giusto.",
        en: "Galaxy Watch steps not reaching Samsung Health have a handful of precise, diagnosable causes: battery optimization killing the app in background, missing Health Connect permissions, or outdated firmware. Pinpointing the exact break in the Watch→Bluetooth→Samsung Health→Health Connect chain fixes the problem in 90% of cases without reinstalling anything. Here's the diagnostic in the right order.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Prima di tutto: capire dove si rompe la catena",
        en: "First of all: understand where the chain breaks",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il percorso dei passi dal Watch al telefono passa per più passaggi. Ognuno può essere il punto di rottura:",
        en: "The path of steps from Watch to phone goes through multiple steps. Each can be the breaking point:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Il Watch conta i passi via accelerometro.",
          "I dati del Watch vengono trasmessi via Bluetooth a Samsung Health sul telefono.",
          "Samsung Health elabora e archivia i dati.",
          "(Opzionale) Samsung Health scrive i passi su Health Connect.",
          "(Opzionale) Un'app terza legge i passi da Health Connect.",
        ],
        en: [
          "The Watch counts steps via accelerometer.",
          "Watch data is transmitted via Bluetooth to Samsung Health on the phone.",
          "Samsung Health processes and stores the data.",
          "(Optional) Samsung Health writes steps to Health Connect.",
          "(Optional) A third-party app reads steps from Health Connect.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La prima domanda da farti è: **i passi ci sono sul Watch ma non su Samsung Health, o mancano anche in Health Connect?** Questo distingue un problema di sync Watch→telefono da un problema di permissions tra app.",
        en: "The first question to ask yourself is: **are the steps on the Watch but not on Samsung Health, or are they missing from Health Connect too?** This distinguishes a Watch→phone sync problem from an app permissions problem.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Causa 1: Bluetooth disconnesso o connessione instabile",
        en: "Cause 1: Bluetooth disconnected or unstable connection",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La sincronizzazione dei passi avviene via Bluetooth tra Watch e telefono. Se la connessione è assente o intermittente, i dati non arrivano in tempo reale, ma di solito si sincronizzano appena la connessione si ristabilisce. Se i passi mancano del tutto anche dopo che il Watch è stato vicino al telefono per ore, il Bluetooth non è quasi mai la causa principale.",
        en: "Step synchronization happens via Bluetooth between Watch and phone. If the connection is absent or intermittent, data doesn't arrive in real-time, but usually syncs as soon as the connection is re-established. If steps are completely missing even after the Watch has been near the phone for hours, Bluetooth is almost never the main cause.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Verifica che il Watch sia accoppiato e connesso: nell'app Galaxy Wearable, lo stato deve essere 'Connesso'.",
          "Se la connessione è instabile, prova a dimenticare il device Bluetooth e rieffettuare il pairing.",
          "Riavvia sia il Watch che il telefono: risolve la maggior parte dei problemi di connessione temporanei.",
        ],
        en: [
          "Verify the Watch is paired and connected: in the Galaxy Wearable app, status should be 'Connected'.",
          "If connection is unstable, try forgetting the Bluetooth device and re-pairing.",
          "Restart both Watch and phone: fixes most temporary connection problems.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Causa 2: Samsung Health in background viene uccisa dal sistema",
        en: "Cause 2: Samsung Health in background is killed by the system",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo è il problema più frequente su Android 12+ e su Galaxy phone con aggressiva ottimizzazione della batteria. Il sistema Android 'sospende' o termina Samsung Health quando è in background per risparmiare batteria, impedendole di ricevere i dati dal Watch. Risultato: il Watch ha i dati, ma Samsung Health non li ha mai ricevuti.",
        en: "This is the most frequent problem on Android 12+ and Galaxy phones with aggressive battery optimization. The Android system 'suspends' or kills Samsung Health when in background to save battery, preventing it from receiving data from the Watch. Result: the Watch has the data, but Samsung Health never received it.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Vai su Impostazioni → App → Samsung Health.",
          "Tocca 'Batteria'.",
          "Seleziona 'Non ottimizzare' (o 'Illimitato' su alcune versioni One UI).",
          "Ripeti lo stesso per l'app 'Galaxy Wearable'.",
          "Riavvia il telefono e lascia che il Watch si sincronizzi per almeno 10 minuti con lo schermo del telefono acceso.",
        ],
        en: [
          "Go to Settings → Apps → Samsung Health.",
          "Tap 'Battery'.",
          "Select 'Don't optimize' (or 'Unrestricted' on some One UI versions).",
          "Repeat the same for the 'Galaxy Wearable' app.",
          "Restart the phone and let the Watch sync for at least 10 minutes with the phone screen on.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "One UI: controlla anche 'Avvio app'", en: "One UI: also check 'App launch'" },
      body: {
        it: "Su Galaxy phone con One UI, c'è un'impostazione aggiuntiva: Impostazioni → Gestione generale → Avvio app (o 'App launch'). Cerca Samsung Health e Galaxy Wearable: devono avere l'avvio automatico abilitato. Se sono su 'Gestito automaticamente', passa a gestione manuale e abilita tutte le opzioni (Avvio automatico, Avvio in secondo piano, Avvio diretto).",
        en: "On Galaxy phones with One UI, there's an additional setting: Settings → General management → App launch. Look for Samsung Health and Galaxy Wearable: they must have automatic launch enabled. If they're on 'Managed automatically', switch to manual management and enable all options (Auto launch, Background launch, Direct launch).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Causa 3: Health Connect non riceve i passi da Samsung Health",
        en: "Cause 3: Health Connect doesn't receive steps from Samsung Health",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se i passi sono corretti in Samsung Health ma non in Health Connect (o nelle app che leggono da HC), il problema è nei permessi tra Samsung Health e Health Connect. Questo è un problema separato dal sync Watch→Samsung Health.",
        en: "If steps are correct in Samsung Health but missing from Health Connect (or apps reading from HC), the problem is in permissions between Samsung Health and Health Connect. This is a separate problem from the Watch→Samsung Health sync.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri Samsung Health → Impostazioni (icona ingranaggio in alto a destra) → Gestione dati → Health Connect.",
          "Verifica che la sincronizzazione con Health Connect sia abilitata.",
          "Nella lista dei tipi di dato, controlla che 'Passi' (e gli altri dati che vuoi) sia spuntato.",
          "Se non c'è nessuna voce Health Connect in Samsung Health, aggiorna Samsung Health dal Play Store: la funzione è stata aggiunta intorno alla versione 6.20.",
          "Apri Health Connect → Autorizzazioni app → Samsung Health: verifica che abbia il permesso di scrittura per 'Passi'.",
        ],
        en: [
          "Open Samsung Health → Settings (gear icon top right) → Data management → Health Connect.",
          "Verify that sync with Health Connect is enabled.",
          "In the data types list, check that 'Steps' (and other data you want) is checked.",
          "If there's no Health Connect entry in Samsung Health, update Samsung Health from the Play Store: the feature was added around version 6.20.",
          "Open Health Connect → App permissions → Samsung Health: verify it has write permission for 'Steps'.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Causa 4: app terza non ha i permessi in Health Connect",
        en: "Cause 4: third-party app doesn't have permissions in Health Connect",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se il problema riguarda un'app terza (non Samsung Health) che non vede i passi, la causa quasi sempre è una sola: l'app non ha il permesso di lettura su Health Connect. Ogni app deve ricevere il permesso esplicitamente.",
        en: "If the problem concerns a third-party app (not Samsung Health) that doesn't see steps, the cause is almost always one thing: the app doesn't have read permission on Health Connect. Each app must receive permission explicitly.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri Health Connect → Autorizzazioni app.",
          "Trova l'app in questione nell'elenco.",
          "Espandi e verifica che 'Passi' abbia il permesso di lettura attivo.",
          "Se l'app non compare in Health Connect, significa che non ha ancora chiesto l'autorizzazione: apri l'app stessa e cerca nelle impostazioni una voce 'Connetti Health Connect' o simile.",
        ],
        en: [
          "Open Health Connect → App permissions.",
          "Find the app in question in the list.",
          "Expand and verify that 'Steps' has read permission enabled.",
          "If the app doesn't appear in Health Connect, it means it hasn't yet requested authorization: open the app itself and look in settings for an entry like 'Connect Health Connect' or similar.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Causa 5: i dati storici non vengono retroattivamente sincronizzati",
        en: "Cause 5: historical data isn't retroactively synced",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se hai appena configurato Health Connect o hai appena dato i permessi a un'app, potresti notare che i dati degli ultimi giorni o settimane non compaiono. Questo è atteso: né Health Connect né la maggior parte delle app terze sincronizzano retroattivamente i dati precedenti all'autorizzazione. Possono leggere solo ciò che è stato scritto su Health Connect dopo che il permesso è stato concesso.",
        en: "If you've just set up Health Connect or just granted permissions to an app, you might notice that data from the past days or weeks doesn't appear. This is expected: neither Health Connect nor most third-party apps retroactively sync data that predates the authorization. They can only read what was written to Health Connect after permission was granted.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Nota importante sui dati storici", en: "Important note on historical data" },
      body: {
        it: "Samsung Health mantiene il suo database storico indipendente. I dati degli anni precedenti sono lì, ma non 'rifluiscono' su Health Connect automaticamente. Se hai 2 anni di dati Galaxy Watch, continua a usare Samsung Health come archivio storico principale. Health Connect è il canale per il futuro, non per il passato.",
        en: "Samsung Health maintains its own independent historical database. Data from previous years is there, but doesn't automatically 'flow back' to Health Connect. If you have 2 years of Galaxy Watch data, keep using Samsung Health as your primary historical archive. Health Connect is the channel for the future, not the past.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Causa 6: versione firmware o app obsoleta",
        en: "Cause 6: outdated firmware or app version",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Samsung ha risolto diversi bug di sincronizzazione nei firmware del Galaxy Watch e nelle versioni più recenti di Samsung Health e Galaxy Wearable. Se stai usando versioni datate, alcuni problemi di sync possono essere già stati risolti in un aggiornamento.",
        en: "Samsung has fixed several sync bugs in Galaxy Watch firmware and newer versions of Samsung Health and Galaxy Wearable. If you're using outdated versions, some sync problems may have already been fixed in an update.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Aggiorna Samsung Health dal Play Store.",
          "Aggiorna Galaxy Wearable dal Play Store.",
          "Controlla gli aggiornamenti firmware del Watch: nell'app Galaxy Wearable → il nome del Watch → Aggiornamento software Watch.",
          "Aggiorna Health Connect dal Play Store (su Android 12-13) o verifica che sia aggiornata via Impostazioni (su Android 14+).",
        ],
        en: [
          "Update Samsung Health from the Play Store.",
          "Update Galaxy Wearable from the Play Store.",
          "Check Watch firmware updates: in Galaxy Wearable app → Watch name → Watch software update.",
          "Update Health Connect from the Play Store (on Android 12-13) or verify it's updated via Settings (on Android 14+).",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Soluzione di emergenza: clear cache di Samsung Health",
        en: "Emergency fix: clear Samsung Health cache",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se nessuna delle soluzioni sopra funziona, la cache corrotta di Samsung Health può causare comportamenti anomali. Attenzione: cancellare la cache non elimina i dati storici (quelli sono nel database), ma resetta le configurazioni temporanee.",
        en: "If none of the above solutions work, a corrupt Samsung Health cache can cause abnormal behavior. Note: clearing the cache doesn't delete historical data (that's in the database), but resets temporary configurations.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Vai su Impostazioni → App → Samsung Health → Archiviazione.",
          "Tocca 'Cancella cache' (NON 'Cancella dati': quello eliminerebbe i dati locali).",
          "Riapri Samsung Health e lasciala riconfigurare.",
          "Attendi 10-15 minuti con il Watch collegato: i dati recenti dovrebbero arrivare.",
        ],
        en: [
          "Go to Settings → Apps → Samsung Health → Storage.",
          "Tap 'Clear cache' (NOT 'Clear data': that would delete local data).",
          "Reopen Samsung Health and let it reconfigure.",
          "Wait 10-15 minutes with Watch connected: recent data should arrive.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "La vera causa nel 90% dei casi", en: "The real cause in 90% of cases" },
      body: {
        it: "L'ottimizzazione batteria è il colpevole principale dei problemi di sync Galaxy Watch. Android sospende Samsung Health in background per risparmiare energia e il Watch non riesce a consegnare i dati. Prima di qualsiasi altra cosa, disabilita l'ottimizzazione batteria per Samsung Health e Galaxy Wearable. È una sola impostazione e risolve più del 70% dei casi segnalati.",
        en: "Battery optimization is the main culprit behind Galaxy Watch sync problems. Android suspends Samsung Health in the background to save power and the Watch can't deliver data. Before anything else, disable battery optimization for Samsung Health and Galaxy Wearable. It's a single setting and fixes over 70% of reported cases.",
      },
    },
    { type: "heading", level: 2, text: { it: "In sintesi", en: "In summary" } },
    {
      type: "list",
      items: {
        it: [
          "La catena di sync ha cinque passaggi: Watch→Bluetooth→Samsung Health→Health Connect→app terza. Il problema si trova di solito al secondo o al quarto passaggio.",
          "L'ottimizzazione batteria Android è la causa principale: disabilitala per Samsung Health e Galaxy Wearable in Impostazioni→App→Batteria.",
          "Su One UI, controlla anche 'Avvio app' e abilita manualmente avvio automatico e in background per entrambe le app.",
          "I dati storici non si sincronizzano retroattivamente su Health Connect: il passato resta in Samsung Health, il futuro passa per HC.",
          "Se tutto fallisce, 'Cancella cache' (non dati) di Samsung Health e riavvia: risolve la maggior parte dei casi residui.",
        ],
        en: [
          "The sync chain has five steps: Watch→Bluetooth→Samsung Health→Health Connect→third-party app. The problem usually lives at the second or fourth step.",
          "Android battery optimization is the main cause: disable it for Samsung Health and Galaxy Wearable in Settings→Apps→Battery.",
          "On One UI, also check 'App launch' and manually enable auto-launch and background launch for both apps.",
          "Historical data doesn't sync retroactively to Health Connect: the past stays in Samsung Health, the future goes through HC.",
          "If everything fails, 'Clear cache' (not data) on Samsung Health and restart: fixes most remaining cases.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Tutto funziona ma vuoi una dashboard migliore per i dati Galaxy Watch?",
        en: "Everything works but you want a better dashboard for Galaxy Watch data?",
      },
      body: {
        it: "Una volta che la sincronizzazione è in ordine, FitMesh Sync può leggere i tuoi dati Galaxy Watch via Health Connect e mostrarli su una dashboard web, utile se vuoi analizzare trend su schermo grande, esportarli, o confrontarli con altri dispositivi. Se hai anche altri wearable, li puoi aggregare nello stesso posto.",
        en: "Once synchronization is working, FitMesh Sync can read your Galaxy Watch data via Health Connect and display it on a web dashboard, useful if you want to analyze trends on a large screen, export them, or compare with other devices. If you also have other wearables, you can aggregate them in the same place.",
      },
      ctaLabel: {
        it: "Vedi Galaxy Watch su FitMesh →",
        en: "See Galaxy Watch on FitMesh →",
      },
      ctaHref: {
        it: "/it/sync/galaxy-watch",
        en: "/en/sync/galaxy-watch",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "I passi sul Galaxy Watch sono corretti ma Samsung Health mostra un numero diverso: perché?",
        en: "Steps on Galaxy Watch are correct but Samsung Health shows a different number: why?",
      },
      a: {
        it: "Le cause più probabili sono due. Prima: Samsung Health è stata sospesa in background dal sistema operativo e ha perso dati di sync in quella finestra. Soluzione: disabilita l'ottimizzazione batteria per Samsung Health e Galaxy Wearable (Impostazioni → App → batteria → Non ottimizzare). Seconda: c'è una discrepanza di timezone tra Watch e telefono. Verifica che entrambi usino la stessa timezone e che il Watch sia impostato su orario automatico.",
        en: "The most likely causes are two. First: Samsung Health was suspended in the background by the operating system and lost sync data in that window. Solution: disable battery optimization for Samsung Health and Galaxy Wearable (Settings → Apps → battery → Don't optimize). Second: there's a timezone mismatch between Watch and phone. Verify both use the same timezone and the Watch is set to automatic time.",
      },
    },
    {
      q: {
        it: "Samsung Health non sincronizza passi su Health Connect anche dopo aver attivato il permesso: cosa faccio?",
        en: "Samsung Health isn't syncing steps to Health Connect even after enabling permission: what do I do?",
      },
      a: {
        it: "Prova questa sequenza: 1) In Samsung Health → Impostazioni → Gestione dati → Health Connect, disabilita e riabilita la sincronizzazione. 2) Revoca tutti i permessi di Samsung Health in Health Connect, poi rientri in Samsung Health → Impostazioni → Health Connect e segui di nuovo il flusso di autorizzazione. 3) Aggiorna Samsung Health all'ultima versione disponibile sul Play Store. Se il problema persiste, la versione di Samsung Health potrebbe avere un bug: controlla i forum ufficiali Samsung per soluzioni specifiche alla versione.",
        en: "Try this sequence: 1) In Samsung Health → Settings → Data management → Health Connect, disable and re-enable sync. 2) Revoke all Samsung Health permissions in Health Connect, then go back to Samsung Health → Settings → Health Connect and follow the authorization flow again. 3) Update Samsung Health to the latest available version on the Play Store. If the problem persists, your Samsung Health version might have a bug: check official Samsung forums for version-specific solutions.",
      },
    },
    {
      q: {
        it: "Dopo aver resettato il Galaxy Watch i passi non si sincronizzano più: come ripristino?",
        en: "After resetting the Galaxy Watch steps no longer sync: how do I restore?",
      },
      a: {
        it: "Un reset del Watch richiede di ripetere l'intera procedura di pairing. Apri Galaxy Wearable, aggiungi il Watch, e poi ri-autorizza Samsung Health → Health Connect. Dopo il reset il Watch è come nuovo: non ha memoria della precedente connessione. Lascia che Samsung Health e Galaxy Wearable si riconfigurino completamente (può richiedere 15-30 minuti) prima di concludere che c'è un problema.",
        en: "A Watch reset requires repeating the entire pairing procedure. Open Galaxy Wearable, add the Watch, then re-authorize Samsung Health → Health Connect. After reset the Watch is like new: it has no memory of the previous connection. Let Samsung Health and Galaxy Wearable fully reconfigure (may take 15-30 minutes) before concluding there's a problem.",
      },
    },
    {
      q: {
        it: "I dati dei giorni precedenti non compaiono in Health Connect: posso recuperarli?",
        en: "Data from previous days doesn't appear in Health Connect: can I recover it?",
      },
      a: {
        it: "In generale no, non automaticamente. Health Connect non sincronizza retroattivamente i dati precedenti all'autorizzazione. I dati storici restano nel database di Samsung Health. Alcune app permettono di importare manualmente un export da Samsung Health (formato CSV o JSON), ma dipende dall'app specifica. Se i dati storici ti servono, Samsung Health resta il posto dove vivono.",
        en: "Generally no, not automatically. Health Connect doesn't retroactively sync data that predates authorization. Historical data remains in Samsung Health's database. Some apps allow manually importing a Samsung Health export (CSV or JSON format), but it depends on the specific app. If you need historical data, Samsung Health remains where it lives.",
      },
    },
    {
      q: {
        it: "Galaxy Watch conta due volte i passi: una volta nel Watch e una volta nel telefono. Come si risolve?",
        en: "Galaxy Watch counts steps twice: once in the Watch and once in the phone. How to fix it?",
      },
      a: {
        it: "Questo succede quando Samsung Health rileva sia il sensore del Watch che il sensore del telefono (accelerometro) come fonti di passi. La soluzione è specificare il Galaxy Watch come fonte prioritaria: in Samsung Health → Impostazioni → Dispositivi connessi (o 'Connetti dispositivo') → Galaxy Watch, verifica che sia impostato come fonte principale per i passi. In alternativa, disabilita il rilevamento passi direttamente dal telefono: Samsung Health → Impostazioni → Permessi → Attività fisica, e assicurati che i passi vengano letti solo dal Watch.",
        en: "This happens when Samsung Health detects both the Watch sensor and the phone sensor (accelerometer) as step sources. The solution is to set the Galaxy Watch as the priority source: in Samsung Health → Settings → Connected devices → Galaxy Watch, verify it's set as the primary source for steps. Alternatively, disable direct phone step detection: Samsung Health → Settings → Permissions → Physical activity, and ensure steps are only read from the Watch.",
      },
    },
  ],
  related: [
    "health-connect-vs-samsung-health",
    "come-funziona-health-connect",
    "guida-sync-wearable-2026",
  ],
  brandsMentioned: ["Samsung", "Google"],
  ldType: "BlogPosting",
};
