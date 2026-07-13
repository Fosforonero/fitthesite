import type { BlogPost } from "../types";

/**
 * Guida operativa ai duplicati in Health Connect.
 *
 * Nota editoriale: mantiene lo slug storico già indicizzato, ma dal 12/07/2026
 * corregge il vecchio assunto "Health Connect non deduplica". Le API Aggregate
 * deduplicano i totali Attività e Sonno in base alle priorità scelte dall'utente;
 * record grezzi, sessioni e altri tipi richiedono invece una diagnosi distinta.
 */
export const post: BlogPost = {
  slug: "piu-smartwatch-insieme-dati-doppi",
  category: "guides",
  publishedAt: "2026-06-10",
  updatedAt: "2026-07-13",
  pillar: true,
  readMinutes: 13,
  primaryKeyword: {
    it: "Health Connect passi e allenamenti duplicati", en: "Health Connect duplicate steps and workouts",
  },
  secondaryKeywords: {
    it: [
      "Health Connect conta i passi due volte",
      "eliminare dati duplicati Health Connect",
      "allenamenti duplicati Health Connect",
      "priorità sorgenti Health Connect",
      "più smartwatch dati doppi",
      "Samsung Health passi duplicati",
    ], en: ["Health Connect counting steps twice", "remove duplicate Health Connect data", "Health Connect duplicate workouts", "Health Connect data source priority", "multiple wearables duplicate data", "Samsung Health duplicate steps"],
  },
  metaDescription: {
    it: "Passi o allenamenti duplicati in Health Connect? Trova l'app che riscrive i dati, imposta la priorità e rimuovi i record errati senza perdere lo storico.", en: "Duplicate steps or workouts in Health Connect? Find the app writing twice, set source priority, and remove bad records without losing your history.",
  },
  hero: {
    kicker: {
      it: "Guida Health Connect · verificata il 13 luglio 2026", en: "Health Connect guide · verified July 13, 2026",
    },
    title: {
      it: "Health Connect: passi e allenamenti duplicati, 7 fix", en: "Health Connect Duplicate Steps and Workouts: 7 Fixes",
    },
    subtitle: {
      it: "La soluzione breve: identifica quali app scrivono lo stesso dato, assegna la priorità corretta per Attività e Sonno, interrompi eventuali loop di sincronizzazione e solo dopo elimina le copie errate. Passi e allenamenti non vengono gestiti allo stesso modo: questa guida mostra esattamente dove intervenire.", en: "The quick solution: identify which apps write the same data, assign the correct priority for Activities and Sleep, break any synchronization loops, and only then delete the incorrect copies. Steps and workouts are not handled in the same way: this guide shows exactly where to intervene.",
    },
  },
  tldr: {
    it: [
      "Health Connect deduplica i **totali aggregati di Attività e Sonno** usando l'ordine scelto in “Sorgenti dati e priorità”; i record delle diverse app possono comunque restare visibili separatamente.",
      "Gli **allenamenti duplicati** richiedono un controllo distinto: spesso la stessa sessione entra da un collegamento diretto e poi torna attraverso Health Connect.",
      "Prima di cancellare, apri “Accesso recente” e le singole voci per identificare l'app che scrive ogni copia. Se non fermi la sorgente, il dato può ricomparire.",
      "Rimuovere un'app dai totali non revoca il permesso di scrittura; per fermarla devi modificare i permessi del singolo tipo di dato.",
      "FitMesh legge il totale passi aggregato e riconcilia le sorgenti nella dashboard. Il write-back verso Health Connect è opzionale e disattivato di default: può aggiungere record FitMesh, ma non modifica né cancella quelli scritti da altre app.",
    ], en: ["Health Connect deduplicates **Activity and Sleep aggregate totals** using the order under Data sources and priority; records from different apps can still remain visible separately.", "Duplicate **workouts** need a separate check: the same session often arrives through a direct connection and then returns through Health Connect.", "Before deleting anything, open Recent access and inspect individual entries to identify which app wrote each copy. If you do not stop the writer, the data can return.", "Removing an app from aggregate totals does not revoke its write permission. To stop new records, change that app's permission for the affected data type.", "FitMesh reads Health Connect's aggregate step total and reconciles sources in its dashboard. Health Connect write-back is optional and off by default: it can add FitMesh-owned records, but it does not edit or delete records written by other apps."],
  },
  body: [
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Risposta diretta", en: "Direct answer",
      },
      body: {
        it: "Per correggere dati duplicati in Health Connect, vai in **Health Connect → Gestisci dati → Sorgenti dati e priorità**, metti in cima la sorgente più affidabile per Attività o Sonno e rimuovi dai totali le sorgenti ridondanti. Se vedi due allenamenti separati, controlla invece quali app li hanno scritti, disattiva uno dei percorsi di importazione e poi elimina la copia errata.", en: "To correct duplicate data in Health Connect, go to **Health Connect → Manage Data → Data Sources and Priorities**, set the most reliable source for Activity or Sleep at the top, and remove redundant sources from the totals. If you see two separate workouts, instead check which apps wrote them, disable one import path, and then delete the incorrect copy.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Prima distinzione: record duplicati e totale duplicato non sono la stessa cosa", en: "First distinction: duplicate records do not always mean a duplicate total",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect conserva la provenienza di ogni record: app sorgente, dispositivo, intervallo temporale e metodo di registrazione. Per questo due app possono avere entrambe una voce “Passi” nello stesso intervallo senza che il totale mostrato debba necessariamente raddoppiare. Secondo la [documentazione Android sugli aggregati](https://developer.android.com/health-and-fitness/health-connect/aggregate-data), l'Aggregate API deduplica i tipi di **Attività e Sonno** in base alle priorità decise dall'utente. Le voci originali restano però attribuite alle rispettive sorgenti.", en: "Health Connect preserves each record's origin: the source app, device, time interval, and recording method. Two apps can therefore each show a Steps entry for the same interval without necessarily doubling the displayed total. According to the [Android aggregate-data documentation](https://developer.android.com/health-and-fitness/health-connect/aggregate-data), the Aggregate API deduplicates **Activity and Sleep** data according to the user's source priorities. The original entries remain attributed to their respective sources.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questa distinzione evita il consiglio sbagliato più comune: cancellare tutto appena compaiono due record. Prima devi capire se è duplicato soltanto l'elenco delle sorgenti, il totale visualizzato oppure una sessione di allenamento completa. Le tre situazioni hanno soluzioni diverse.", en: "This distinction prevents the most common bad advice: deleting everything as soon as two records appear. First determine whether you are seeing multiple source entries, an inflated total, or a complete workout duplicated as a second session. Each problem has a different fix.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Diagnosi rapida: osserva il sintomo prima di modificare permessi o dati.", en: "Quick diagnosis: identify the symptom before changing permissions or deleting data.",
      },
      headers: {
        it: ["Sintomo", "Causa più probabile", "Prima azione"], en: ["Symptom", "Most likely cause", "First action"],
      },
      rows: [
        {
          it: [
            "Due voci Passi, ma totale plausibile",
            "Record di più sorgenti; l'aggregazione sta già applicando la priorità",
            "Controlla la priorità, senza cancellare alla cieca",
          ], en: ["Two Steps entries, but a plausible total", "Records from multiple sources; aggregation is already applying priority", "Check priority instead of deleting blindly"],
        },
        {
          it: [
            "Totale passi quasi doppio",
            "App che legge e riscrive, sorgente esclusa male o app finale che somma record grezzi",
            "Identifica chi scrive e interrompi il percorso ridondante",
          ], en: ["Step total is almost doubled", "An app reads and writes the data back, a source is misconfigured, or the final app sums raw records", "Identify the writer and break the redundant path"],
        },
        {
          it: [
            "Lo stesso allenamento compare due volte",
            "Integrazione diretta più importazione via Health Connect",
            "Mantieni un solo percorso verso l'app di destinazione",
          ], en: ["The same workout appears twice", "A direct integration plus an import through Health Connect", "Keep one inbound path to the destination app"],
        },
        {
          it: [
            "Il duplicato ritorna dopo la cancellazione",
            "La sorgente conserva una copia e la pubblica di nuovo",
            "Revoca prima la scrittura, poi elimina il dato",
          ], en: ["The duplicate returns after deletion", "The source retains a copy and writes it again", "Revoke write access first, then delete the bad record"],
        },
        {
          it: [
            "Health Connect è corretto, un'altra app mostra il doppio",
            "L'app legge record grezzi o combina anche una seconda integrazione",
            "Correggi le sorgenti nell'app che mostra il totale",
          ], en: ["Health Connect is correct, but another app shows double", "That app reads raw records or combines a second integration", "Fix the sources inside the app displaying the total"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Procedura in 7 passaggi per rimuovere i duplicati senza perdere dati", en: "Seven-step procedure to remove duplicates without losing data",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "1. Apri Health Connect dal percorso corretto", en: "1. Open Health Connect from the correct path",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Su Android 14 e versioni successive apri **Impostazioni → Sicurezza e privacy → Controlli privacy → Health Connect**. Su Android 13 e precedenti Health Connect è un'app separata installabile da Google Play e raggiungibile anche da **Impostazioni → App → Health Connect → Apri**. I nomi possono cambiare leggermente in base al produttore, ma le sezioni utili sono “Autorizzazioni app”, “Dati e accesso”, “Accesso recente” e “Gestisci dati”.", en: "On Android 14 and later, open **Settings → Security & privacy → Privacy controls → Health Connect**. On Android 13 and earlier, Health Connect is a separate app available from Google Play and can also be opened through **Settings → Apps → Health Connect → Open**. Labels can vary slightly by manufacturer, but the relevant sections are App permissions, Data and access, Recent access, and Manage data.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "2. Scopri quale app ha scritto ogni copia", en: "2. Find which app wrote each copy",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Apri **Accesso recente → Mostra tutto** per vedere quali app hanno letto o scritto nelle ultime 24 ore. Poi vai in **Dati e accesso**, scegli la categoria, il tipo di dato e “Mostra tutte le voci”. Health Connect indica la sorgente di ciascuna registrazione. La [guida ufficiale per trovare i dati](https://support.google.com/android/answer/12201872?hl=it) conferma che puoi esaminare le singole voci e le app autorizzate prima di intervenire.", en: "Open **Recent access → See all recent access** to see which apps read or wrote data during the last 24 hours. Then open **Data and access**, choose the category and data type, and select See all entries. Health Connect identifies the source of each record. Google's [official guide to finding Health Connect data](https://support.google.com/android/answer/12201872?hl=en) confirms that you can inspect individual entries and app permissions before changing anything.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Annota il percorso, non soltanto il nome del wearable", en: "Map the data path, not just the wearable",
      },
      body: {
        it: "Un orologio raramente scrive direttamente in Health Connect: di solito lo fa la sua app companion. Cerca quindi nomi di app e pacchetti, non soltanto “Garmin”, “Galaxy Watch” o “Pixel Watch”.", en: "A watch rarely writes directly in Health Connect: it usually does so through its companion app. Therefore, look for app names and packages, not just “Garmin”, “Galaxy Watch” or “Pixel Watch”.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "3. Ordina le sorgenti per Attività e Sonno", en: "3. Set source priority for Activity and Sleep",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Apri **Gestisci dati → Sorgenti dati e priorità**, scegli Attività oppure Sonno e trascina in alto l'app che deve vincere quando gli intervalli si sovrappongono. Google spiega che, in presenza di valori incoerenti, il totale usa la sorgente più alta nell'elenco. Puoi anche rimuovere una sorgente dai totali senza cancellarne i record: consulta [Gestire i dati di Health Connect](https://support.google.com/android/answer/12990553?hl=it).", en: "Open **Manage data → Data sources and priority**, choose Activity or Sleep, and drag the preferred app to the top. Google states that when values from different apps conflict, the app higher in the list receives priority. You can also exclude a source from aggregate totals without deleting its stored records; see [Manage your Health Connect data](https://support.google.com/android/answer/12990553?hl=en).",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: {
        it: "La priorità non copre ogni dato", en: "Source priority does not cover every data type",
      },
      body: {
        it: "La deduplicazione ufficiale tramite priorità riguarda i totali aggregati di **Attività e Sonno**. Non assumere che pressione, nutrizione, battito, temperatura o una sessione di allenamento vengano risolti nello stesso modo: per quei dati conta anche come l'app che li legge interpreta i record.", en: "Official priority-based deduplication applies to **Activity and Sleep aggregate totals**. Do not assume that blood pressure, nutrition, heart rate, temperature, or workout sessions are reconciled in the same way. For those records, the result also depends on how the reading app interprets multiple sources.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "Controlla anche i passi registrati dal telefono",
        en: "Check steps recorded by the phone itself",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Da giugno 2026, sui dispositivi compatibili con Android 14 o versioni successive, Health Connect può registrare direttamente i passi tramite il sensore del telefono. Il dispositivo compare come sorgente separata e, per impostazione predefinita, ha la priorità più bassa. Se non vuoi includerlo, apri **Health Connect → Dispositivi → nome del telefono → Passi** e disattiva la registrazione, oppure escludi il telefono dai totali di Attività. Google documenta sia l'[attribuzione dei passi del telefono](https://developer.android.com/health-and-fitness/health-connect/read-data) sia i [controlli disponibili per l'utente](https://support.google.com/android/answer/16786157?hl=it).",
        en: "Since June 2026, compatible devices running Android 14 or later can have Health Connect record steps directly from the phone's step sensor. The phone appears as a separate source and has the lowest priority by default. To exclude it, open **Health Connect → Devices → phone name → Steps** and turn off step tracking, or remove the phone from Activity totals. Google documents both [phone-step attribution](https://developer.android.com/health-and-fitness/health-connect/read-data) and the [controls available to users](https://support.google.com/android/answer/16786157?hl=en).",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "4. Revoca soltanto il permesso di scrittura ridondante", en: "4. Revoke only the redundant write permission",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se un'app non deve più pubblicare passi o allenamenti, apri **Autorizzazioni app → nome dell'app** e disattiva la scrittura per quel tipo di dato. Non revocare automaticamente ogni permesso: un'app può dover leggere i passi ma non riscriverli. La [guida alle app connesse](https://support.google.com/android/answer/12201230?hl=it) distingue la rimozione dell'accesso dalla cancellazione dei dati già salvati.", en: "If an app should no longer publish steps or workouts, open **App permissions → app name** and turn off write access for that data type. Do not revoke every permission automatically: an app may need to read steps without writing them back. Google's [connected-app permissions guide](https://support.google.com/android/answer/12201230?hl=en) distinguishes revoking access from deleting data that is already stored.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Rimuovere un'app da “Sorgenti dati e priorità” significa soltanto escluderla dal totale della categoria. L'app può continuare a scrivere. Disattivare il permesso di scrittura impedisce invece nuovi record, ma non elimina quelli già presenti. Sono tre operazioni diverse: **priorità**, **permesso** e **cancellazione**.", en: "Removing an app from \"Data Sources and Priorities\" merely excludes it from the total of the category. The app can still write. Disabling the write permission, on the other hand, prevents new records but does not delete existing ones. These are three distinct operations: **priority**, **permission**, and **deletion**.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "5. Interrompi i loop tra integrazione diretta e Health Connect", en: "5. Break the loops between direct integration and Health Connect",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il caso tipico degli allenamenti duplicati è un circuito: il servizio A invia direttamente una sessione al servizio B; la stessa sessione arriva anche in Health Connect e B la importa una seconda volta. Un altro loop nasce quando un'app legge un dato da Health Connect e lo pubblica di nuovo come se fosse proprio. La regola pratica è semplice: per ogni destinazione e tipo di dato mantieni **un solo percorso in ingresso**.", en: "The typical duplicate-workout problem is a sync loop: service A sends a session directly to service B, while the same session also reaches Health Connect and B imports it again. Another loop occurs when an app reads a record from Health Connect and writes it back as though it were new. The practical rule is simple: keep **one inbound path** for each destination and data type.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Esempi concettuali: i menu reali dipendono dalle app installate.", en: "Conceptual examples: the actual menus depend on the installed apps.",
      },
      headers: {
        it: ["Percorso", "Rischio", "Configurazione consigliata"], en: ["Path", "Risk", "Recommended Configuration"],
      },
      rows: [
        {
          it: [
            "Wearable → app companion → Health Connect",
            "Basso, se esiste un solo writer",
            "Lascia attivo il writer ufficiale",
          ], en: ["Wearable → app companion → Health Connect", "Low, if there is a single writer", "Keep the official writer active"],
        },
        {
          it: [
            "Servizio A → servizio B e A → Health Connect → B",
            "Stesso allenamento importato due volte",
            "Disattiva uno dei due ingressi in B",
          ], en: ["Service A → service B and A → Health Connect → B", "The same workout is imported twice", "Disable one of B's two inbound paths"],
        },
        {
          it: [
            "App ponte legge Health Connect e riscrive in Health Connect",
            "Loop e record con nuova origine",
            "Non usare Health Connect come sorgente e destinazione dello stesso flusso",
          ], en: ["A bridge reads Health Connect and writes the data back to Health Connect", "A loop creates a record with a new origin", "Do not use Health Connect as both source and destination for the same flow"],
        },
        {
          it: [
            "Due wearable scrivono passi nello stesso periodo",
            "Record sovrapposti",
            "Imposta la priorità Attività; non serve necessariamente cancellare una sorgente",
          ], en: ["Two wearables record steps during the same period", "Overlapping records", "Set Activity priority; deleting a source is not always necessary"],
        },
      ],
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "6. Elimina le copie errate soltanto dopo aver fermato la sorgente", en: "6. Remove the erroneous copies only after stopping the source",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect permette di eliminare una singola voce, un tipo di dato, una categoria, un intervallo temporale oppure tutti i dati scritti da una specifica app. Il percorso più prudente è **Dati e accesso → categoria → tipo → Mostra tutte le voci**, quindi eliminare soltanto la copia riconosciuta. Per una bonifica più ampia puoi usare **Autorizzazioni app → app → Elimina dati dell'app** e scegliere il periodo.", en: "Health Connect lets you delete one entry, an entire data type, a category, a time range, or all data written by a specific app. The safest path is **Data and access → category → data type → See all entries**, then delete only the confirmed bad copy. For a broader cleanup, use **App permissions → app → Delete app data** and choose the affected period.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La [procedura ufficiale di cancellazione](https://support.google.com/android/answer/12201232?hl=it) avverte che l'app o il dispositivo sorgente può conservare una propria copia. Eliminare da Health Connect non elimina automaticamente il dato dal cloud del produttore. Se il writer rimane attivo, quella copia può essere sincronizzata di nuovo.", en: "Google's [official deletion instructions](https://support.google.com/android/answer/12201232?hl=en) warn that the source app or device may retain its own copy. Deleting a record from Health Connect does not automatically remove it from the manufacturer's cloud. If the writer remains active, that copy can sync back.",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: {
        it: "Non usare “Elimina tutti i dati” come prima prova", en: "Do not start with Delete all data",
      },
      body: {
        it: "È una misura distruttiva e spesso inutile: se il loop è ancora attivo, i duplicati tornano. Prima salva eventuali dati importanti, identifica la sorgente e limita la cancellazione al record, tipo, app o intervallo coinvolto.", en: "It's a destructive and often useless measure: if the loop is still active, duplicates will return. Save any important data first, identify the source, and limit deletion to the involved record, type, app, or time frame.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: {
        it: "7. Forza una nuova sincronizzazione e verifica il totale finale", en: "7. Force a new synchronization and verify the final total",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Apri prima l'app sorgente, attendi che completi la sincronizzazione del wearable, poi riapri l'app che legge Health Connect. Controlla nuovamente Accesso recente e le singole voci. Per Attività e Sonno il totale aggregato si aggiorna quando cambi sorgenti o priorità; per gli allenamenti verifica che sia rimasta una sola sessione e che il duplicato non venga ricreato.", en: "Open the source app first, wait for it to complete the wearable synchronization, then reopen the reading app. Check Recent Access and individual entries again. For Activity and Sleep, the aggregated total updates when you change sources or priorities; for workouts, ensure there is only one session and that duplicates are not recreated.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Dati mancanti invece che duplicati?",
        en: "Missing data rather than duplicates?",
      },
      body: {
        it: "Se il record corretto non arriva proprio, il problema è diverso: segui la guida [Health Connect non si sincronizza: 7 soluzioni](/it/blog/health-connect-not-syncing) per controllare permessi, batteria e sincronizzazione in background.",
        en: "If the correct record never arrives, you are dealing with a different problem. Follow [Health Connect not syncing: 7 fixes](/en/blog/health-connect-not-syncing) to check permissions, battery restrictions, and background sync.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché i passi possono essere corretti mentre gli allenamenti restano duplicati", en: "Why steps can be correct while workouts remain duplicated",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "I passi sono un valore cumulativo che può essere letto tramite l'Aggregate API. Health Connect applica la priorità delle sorgenti ai totali di Attività. Un allenamento è invece una sessione con inizio, fine, tipo, eventuale percorso e record collegati. Due app diverse possono creare due sessioni distinte che descrivono la stessa corsa, ma con identificatori e origini differenti.", en: "Steps are cumulative data that can be read through the Aggregate API, where Health Connect applies source priority to Activity totals. A workout is instead a session with a start time, end time, exercise type, optional route, and related records. Two apps can create separate sessions describing the same run, each with a different identifier and origin.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per gli sviluppatori, Android raccomanda un `clientRecordId` stabile: se la stessa app ritenta l'invio dello stesso record, Health Connect può ignorare il duplicato o aggiornare la versione esistente. Questo evita duplicati da retry della stessa integrazione, ma non dimostra automaticamente che due app differenti stiano descrivendo la stessa attività. La distinzione è documentata nella guida Android sulle [esperienze di allenamento con Health Connect](https://developer.android.com/health-and-fitness/health-connect/experiences/workouts).", en: "For developers, Android recommends a stable `clientRecordId`. If the same app retries the same record, Health Connect can ignore the duplicate or update the existing version. This prevents retry duplicates from one integration, but it does not prove that records from two different apps describe the same activity. Android documents the distinction in its guide to [workout experiences with Health Connect](https://developer.android.com/health-and-fitness/health-connect/experiences/workouts).",
      },
    },
    {
      type: "comparison",
      aTitle: {
        it: "Duplicato dello stesso writer", en: "Duplicate from the same writer",
      },
      aItems: {
        it: [
          "La stessa app ritenta un upload",
          "Un `clientRecordId` stabile può rendere l'operazione idempotente",
          "La correzione principale spetta allo sviluppatore dell'app",
        ], en: ["The same app retries an upload", "A stable `clientRecordId` can make the operation idempotent", "The app developer is responsible for the primary fix"],
      },
      bTitle: {
        it: "Duplicato tra writer diversi", en: "Duplicate from different writers",
      },
      bItems: {
        it: [
          "Due app importano la stessa attività attraverso percorsi differenti",
          "Origini e identificatori non coincidono",
          "L'utente deve eliminare il percorso ridondante o l'app finale deve riconciliare le sessioni",
        ], en: ["Two apps import the same activity through different paths", "Origins and identifiers do not match", "The user must remove the redundant path, or the destination app must reconcile the sessions"],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come FitMesh gestisce sorgenti sovrapposte", en: "How FitMesh handles overlapping sources",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Sul percorso Android, FitMesh legge i passi con l'aggregazione nativa di Health Connect e beneficia quindi delle priorità Attività impostate dall'utente. Per gli altri dati applica controlli nel proprio livello di lettura e nella dashboard: rimozione dei record identici, selezione della sorgente per le metriche cumulative, riconciliazione delle sessioni di sonno sovrapposte e rimozione dei workout cross-source con stesso inizio, fine e tipo.", en: "On Android, FitMesh reads steps through Health Connect's native aggregation, so the result benefits from the user's Activity source priority. For other data, it applies controls in its reading and dashboard layers: removing identical records, selecting a source for cumulative metrics, reconciling overlapping sleep sessions, and removing cross-source workouts with the same start time, end time, and exercise type.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo significa che FitMesh può mostrare una vista coerente anche quando nel database restano record attribuiti a più app. Non significa però che “ripulisca” Health Connect per tutte le altre applicazioni. Se un'altra app continua a mostrare un duplicato, devi correggere la priorità, il permesso o il percorso di sincronizzazione alla fonte.", en: "FitMesh can therefore show a coherent view even when Health Connect still contains records attributed to multiple apps. It does not, however, clean the Health Connect database for every other application. If another app still displays a duplicate, correct the source priority, write permission, or sync path at its origin.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Write-back FitMesh: opzionale, non universale",
        en: "FitMesh write-back: optional, not universal",
      },
      body: {
        it: "Il write-back Android verso Health Connect è **disattivato di default**. Quando l'utente lo abilita, l'implementazione attuale esegue un export al momento dell'attivazione, evita di scrivere una metrica nella finestra in cui trova già dati di un'altra sorgente ed esclude i record creati da FitMesh dalle letture successive. Può eliminare e sostituire soltanto i propri record nella stessa finestra; non modifica né cancella i dati scritti da altre app.",
        en: "Android write-back to Health Connect is **off by default**. When the user enables it, the current implementation runs one export at activation, skips a metric when it finds data from another source in the same time window, and excludes FitMesh-owned records from later imports. It can delete and replace only its own records in that window; it does not edit or delete data written by other apps.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/02-sync-center.png",
      alt: {
        it: "Sync Center di FitMesh con la sorgente indicata per passi, battito, sonno, calorie, distanza e SpO2",
        en: "FitMesh Sync Center showing the source for steps, heart rate, sleep, calories, distance, and SpO2",
      },
      caption: {
        it: "Il Sync Center mostra la provenienza del valore usato nella dashboard; l'eventuale write-back è un controllo separato e opt-in.",
        en: "The Sync Center shows the source used by the dashboard; optional write-back is a separate, opt-in control.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "table",
      caption: {
        it: "Comportamento verificato sul codice FitMesh il 13 luglio 2026; può evolvere con gli aggiornamenti.", en: "Behavior verified against the FitMesh codebase on July 13, 2026; it may change in future releases.",
      },
      headers: {
        it: ["Dato", "Primo livello", "Controllo FitMesh"], en: ["Data", "First layer", "FitMesh control"],
      },
      rows: [
        {
          it: [
            "Passi",
            "Totale aggregato Health Connect",
            "Controllo contro record cumulativi e scala della timeline intraday",
          ], en: ["Steps", "Health Connect aggregate total", "Cross-check against cumulative records and scale the intraday timeline to the final total"],
        },
        {
          it: [
            "Sonno",
            "Record e aggregati disponibili",
            "Raggruppamento delle sessioni sovrapposte e scelta della sorgente preferita",
          ], en: ["Sleep", "Available records and aggregates", "Group overlapping sessions and select the preferred source"],
        },
        {
          it: [
            "Allenamenti",
            "Sessioni con origine e intervallo",
            "Rimozione delle sessioni con stesso inizio, fine e tipo; metriche sovrapposte prese da una sola sorgente",
          ], en: ["Workouts", "Session origin and time interval", "Remove sessions with the same start, end, and type; take overlapping metrics from one source"],
        },
        {
          it: [
            "Battito e altre metriche puntuali",
            "Record delle sorgenti autorizzate",
            "Priorità o selezione della sorgente in base alla metrica",
          ], en: ["Heart rate and other point-in-time metrics", "Records from authorized sources", "Priority or source selection for each metric"],
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Limite dichiarato", en: "Declared limit",
      },
      body: {
        it: "Nessun sistema può sapere con certezza che due record di app differenti rappresentano lo stesso evento in ogni situazione. La deduplicazione è affidabile quando esistono priorità, intervalli e metadati coerenti; nei casi ambigui la sorgente scelta dall'utente resta il segnale più importante.", en: "No system can determine in every situation that records from two different apps represent the same real-world event. Deduplication is reliable when source priority, time intervals, and metadata are consistent; in ambiguous cases, the source selected by the user remains the strongest signal.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi capire quali integrazioni leggono, scrivono o sono ancora in sviluppo?",
        en: "Want to see which integrations read, write, or remain in development?",
      },
      body: {
        it: "La matrice FitMesh separa direzione, stato reale e piattaforma per ogni integrazione, con una data di verifica esplicita.",
        en: "The FitMesh compatibility matrix separates direction, real-world status, and platform for every integration, with an explicit verification date.",
      },
      ctaLabel: {
        it: "Vedi la matrice di compatibilità",
        en: "See the compatibility matrix",
      },
      ctaHref: {
        it: "/it/fitness-data-sync",
        en: "/en/fitness-data-sync",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Checklist preventiva per usare più wearable", en: "Checklist for preventing duplicates with multiple wearables",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Scegli una sorgente principale per **Attività** e una per **Sonno**.",
          "Lascia che una sola app companion scriva ciascun tipo di dato quando non serve una seconda copia.",
          "Evita che un'app ponte usi Health Connect contemporaneamente come sorgente e destinazione dello stesso dato.",
          "Quando colleghi direttamente due servizi, disattiva l'importazione equivalente via Health Connect nell'app di destinazione.",
          "Controlla Accesso recente dopo ogni nuova integrazione.",
          "Prima di cambiare permessi, annota la configurazione e conserva eventuali export importanti.",
          "Dopo la modifica verifica sia le singole voci sia il totale mostrato dall'app che utilizzi davvero.",
        ], en: ["Choose a primary source for **Activity** and one for **Sleep**.", "Let a single companion app write each type of data when a secondary copy is not needed.", "Avoid having an app bridge use Health Connect as both the source and destination for the same data simultaneously.", "When you directly connect two services, disable the equivalent import through Health Connect in the target app.", "Check Recent Access after every new integration.", "Before changing permissions, note the configuration and save any important exports.", "After making the change, verify both the individual items and the total displayed by the app you are actually using."],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Fonti e stato della verifica", en: "Sources and verification status",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Ultima verifica: **13 luglio 2026**. Fonti primarie: [aggregazione e priorità in Health Connect](https://developer.android.com/health-and-fitness/health-connect/aggregate-data), [gestione delle sorgenti e della priorità](https://support.google.com/android/answer/12990553?hl=it), [ispezione dei dati e dell'accesso recente](https://support.google.com/android/answer/12201872?hl=it), [permessi delle app connesse](https://support.google.com/android/answer/12201230?hl=it), [cancellazione dei dati](https://support.google.com/android/answer/12201232?hl=it) e [record delle sessioni di allenamento](https://developer.android.com/health-and-fitness/health-connect/experiences/workouts). Le affermazioni su FitMesh sono state verificate sul repository dell'app, non dedotte da materiali promozionali.", en: "Last verified: **July 13, 2026**. Primary sources: [Health Connect aggregation and priority](https://developer.android.com/health-and-fitness/health-connect/aggregate-data), [data-source management](https://support.google.com/android/answer/12990553?hl=en), [data and Recent access inspection](https://support.google.com/android/answer/12201872?hl=en), [connected-app permissions](https://support.google.com/android/answer/12201230?hl=en), [data deletion](https://support.google.com/android/answer/12201232?hl=en), and [workout-session records](https://developer.android.com/health-and-fitness/health-connect/experiences/workouts). Statements about FitMesh were verified against the app repository rather than inferred from marketing material.",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Health Connect elimina automaticamente i dati duplicati?", en: "Does Health Connect automatically remove duplicate data?",
      },
      a: {
        it: "Health Connect deduplica i totali aggregati dei tipi Attività e Sonno usando le priorità delle sorgenti scelte dall'utente. I record originali di più app possono restare visibili separatamente. Per allenamenti e altri tipi di dati non bisogna presumere lo stesso comportamento: può servire interrompere il percorso ridondante o usare un'app che riconcilia le sorgenti.", en: "Health Connect deduplicates Activity and Sleep aggregate totals according to the user's source priorities. Original records from several apps can remain visible separately. Do not assume the same behavior for workouts or every other data type: you may need to break a redundant sync path or use an app that reconciles multiple sources.",
      },
    },
    {
      q: {
        it: "Perché vedo due allenamenti ma il totale dei passi è corretto?", en: "Why do I see two workouts but the total steps are correct?",
      },
      a: {
        it: "I passi possono essere deduplicati nel totale di Attività tramite Aggregate API e priorità. Gli allenamenti sono sessioni separate: la stessa attività può arrivare da un collegamento diretto e da Health Connect con origini differenti, producendo due sessioni anche quando i passi aggregati restano corretti.", en: "Steps can be deduplicated in the Activity total through the Aggregate API and source priority. Workouts are separate sessions: the same activity can arrive through a direct connection and through Health Connect with different origins, producing two sessions even when the aggregate step total is correct.",
      },
    },
    {
      q: {
        it: "Rimuovere un'app dalle sorgenti prioritarie le impedisce di scrivere?", en: "Does removing an app from source priority stop it from writing?",
      },
      a: {
        it: "No. Rimuovere una sorgente dai totali di Attività o Sonno evita che contribuisca a quel totale, ma l'app può continuare a scrivere. Per fermare nuovi record devi revocare il permesso di scrittura del tipo di dato nelle Autorizzazioni app.", en: "No. Removing a source from the Activity or Sleep totals prevents it from contributing to those totals, but the app can still write. To stop new records, you must revoke the write permission for that data type in App Permissions.",
      },
    },
    {
      q: {
        it: "Posso cancellare soltanto un allenamento o una voce sbagliata?", en: "Can I delete only one workout or incorrect entry?",
      },
      a: {
        it: "Sì, per i dati fitness Health Connect consente di aprire un tipo di dato, vedere tutte le voci ed eliminare una singola registrazione. Puoi anche eliminare per intervallo, tipo, categoria o app. Ferma prima l'app che ha scritto il duplicato, altrimenti potrebbe pubblicarlo di nuovo.", en: "Yes, for fitness data Health Connect allows you to open a data type, view all entries, and delete a single record. You can also delete by interval, type, category, or app. Stop the app that wrote the duplicate first; otherwise, it might publish it again.",
      },
    },
    {
      q: {
        it: "Perché i dati duplicati tornano dopo che li ho eliminati?", en: "Why does duplicate data return after I delete it?",
      },
      a: {
        it: "La cancellazione rimuove il record dal database locale Health Connect, ma l'app o il servizio sorgente può conservarne una copia. Se il permesso di scrittura o il collegamento rimane attivo, la sincronizzazione successiva può ricreare il record.", en: "Deletion removes the record from the local Health Connect database, but the source app or service may retain a copy. If write permission or the connection remains active, the next sync can recreate that record.",
      },
    },
    {
      q: {
        it: "FitMesh cancella i duplicati dentro Health Connect?", en: "Does FitMesh remove duplicates within Health Connect?",
      },
      a: {
        it: "Non cancella né modifica i record scritti da altre app. FitMesh mostra una vista riconciliata nella dashboard; se abiliti il write-back Android, può aggiungere e sostituire soltanto record propri con controlli anti-loop. Per correggere duplicati creati da altre sorgenti devi gestire priorità, permessi e cancellazione nelle impostazioni Health Connect.", en: "It does not delete or edit records written by other apps. FitMesh shows a reconciled dashboard; if you enable Android write-back, it can add and replace only FitMesh-owned records with anti-loop controls. To correct duplicates created by other sources, manage priority, permissions, and deletion in Health Connect settings.",
      },
    },
    {
      q: {
        it: "Posso usare due smartwatch senza contare i passi due volte?", en: "Can I use two smartwatches without counting steps twice?",
      },
      a: {
        it: "Sì. In Health Connect imposta la sorgente più affidabile in cima alla priorità Attività e verifica che non esista un loop di riscrittura. Le app che leggono il totale aggregato dovrebbero rispettare quella priorità; le app che leggono record grezzi devono applicare una propria logica di riconciliazione.", en: "Yes. In Health Connect, set the most reliable source at the top of the Activity priority and verify that there is no rewrite loop. Apps reading the total aggregate should honor that priority; apps reading raw records must apply their own reconciliation logic.",
      },
    },
  ],
  related: [
    "health-connect-not-syncing",
    "come-funziona-health-connect",
    "novita-fonte-del-dato",
    "sync-them-all",
  ],
  sources: [
    "https://developer.android.com/health-and-fitness/health-connect/aggregate-data",
    "https://developer.android.com/health-and-fitness/health-connect/read-data",
    "https://developer.android.com/health-and-fitness/health-connect/experiences/workouts",
    "https://support.google.com/android/answer/12990553?hl=en",
    "https://support.google.com/android/answer/12201872?hl=en",
    "https://support.google.com/android/answer/12201230?hl=en",
    "https://support.google.com/android/answer/12201232?hl=en",
    "https://support.google.com/android/answer/16786157?hl=en",
  ],
  brandsMentioned: ["Google", "Android", "Health Connect"],
  ldType: "BlogPosting",
};
