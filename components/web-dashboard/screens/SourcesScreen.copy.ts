/**
 * Copy della schermata Sorgenti e sync (PROTOTIPO, dati sintetici). IT e EN;
 * ogni altra lingua usa l'EN. I nomi dei tipi di dato, delle sorgenti e dei
 * gesti nell'app sono quelli dell'app al tag v3.10.0+191 (dataTypeSteps,
 * dataTypeHeartRate, dataTypeRestingHeartRate, dataTypeHrv, dataTypeWorkout,
 * syncNow, syncCenterGrantPerms, settingsSourcePriorities, syncActivity,
 * syncLogEmpty / syncLogEmptyHint, syncFreshnessNever). Dove l'app non ha una
 * stringa la frase e' neutra.
 *
 * Cio' che esiste gia' in lib/web-dashboard/copy.ts NON si ripete qui: stato del
 * sync (sync.ok/partial/error/never), «Ultimo sync», «Nessun dato», i motivi di
 * assenza («Permesso non concesso», «Non fornito dalla fonte», «Lettura non
 * riuscita»), «Dati non aggiornati». Qui c'e' solo cio' che e' specifico di
 * questa schermata.
 *
 * Regole: niente em dash, niente promesse di disponibilita' o di date, niente
 * linguaggio promozionale, niente AI. Il web non puo' avviare un sync: nessuna
 * frase qui promette il contrario. Testo PLACEHOLDER da approvare (SITE-WRITING).
 */
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { DataTypeKey, SourceKind, SyncStatus, Via } from '@/lib/web-dashboard/model';

/** Le frasi-gesto che la schermata sa comporre; quali usare lo decide il componente dallo stato. */
export type ActionKey = 'open_sync' | 'grant_permissions' | 'check_source' | 'check_connection' | 'check_types' | 'connect_device';

export interface SourcesCopy {
  status: {
    title: string;
    whatHappened: string;
    outcome: string;
    /** Frasi per l'ultimo sync: `ok` senza problema, `never` con o senza sorgenti. */
    okBody: string;
    neverWithSources: string;
    neverNoSources: string;
    /** Il codice motivo, tradotto in parole semplici. */
    problem: Record<NonNullable<SyncStatus['problem']>, string>;
    /** Stato di errore o parziale ma senza codice motivo. */
    problemGeneric: { error: string; partial: string };
    actionsTitle: string;
    actions: Record<ActionKey, string>;
    /** Sotto l'eta' quando l'ultimo sync e' vecchio: cio' che manca non e' zero. */
    staleNote: string;
    /** Il web non puo' avviare un sync: e' scritto, non nascosto. */
    webNote: string;
    seeTypes: string;
  };
  sources: {
    title: string;
    intro: string;
    kind: Record<SourceKind, string>;
    via: Record<Via, string>;
    typesTitle: string;
    /** «{label}» = nome della sorgente. */
    typesAria: string;
    types: Record<DataTypeKey, string>;
    statusOk: string;
    winning: string;
    /** «{label}» = la sorgente che vince per quel tipo. */
    wonBy: string;
    /** «{n}» tipi vinti su «{total}». */
    wins: string;
    winsNone: string;
    typesNone: string;
    empty: {
      title: string;
      body: string;
      stepsTitle: string;
      steps: string[];
      link: string;
    };
  };
  history: {
    title: string;
    subtitle: string;
    listAria: string;
    cols: { when: string; result: string; duration: string; types: string };
    readTypes: (n: number) => string;
    failedTypes: (n: number) => string;
    seconds: (n: string) => string;
    durationNone: string;
    emptyTitle: string;
    emptyBody: string;
    /** «{when}» = data e ora dell'ultimo sync noto. */
    gap: string;
  };
}

const IT: SourcesCopy = {
  status: {
    title: 'Stato del sync',
    whatHappened: 'Cosa è successo',
    outcome: 'Esito',
    okBody: 'L’ultimo sync si è concluso senza problemi: i dati sono stati letti e inviati.',
    neverWithSources: 'Le sorgenti sono collegate ma non è ancora avvenuto nessun sync.',
    neverNoSources: 'Non è ancora avvenuto nessun sync perché non c’è una sorgente collegata.',
    problem: {
      permission_revoked: 'I permessi per leggere i dati salute non sono più concessi, quindi alcuni dati non sono stati letti.',
      source_unreachable: 'La sorgente non ha risposto all’ultimo tentativo. I dati successivi a quel momento non sono ancora arrivati.',
      upload_failed: 'I dati sono stati letti sul dispositivo ma non sono arrivati al server.',
      partial_types: 'L’ultimo sync ha letto solo una parte dei tipi di dato. Nelle sorgenti sotto vedi quali.',
    },
    problemGeneric: {
      error: 'L’ultimo sync non è riuscito.',
      partial: 'L’ultimo sync ha letto solo una parte dei dati.',
    },
    actionsTitle: 'Cosa puoi fare',
    actions: {
      open_sync: 'Apri l’app FitMesh e tocca «Sincronizza ora».',
      grant_permissions: 'Nell’app tocca «Concedi permessi» e consenti la lettura dei dati salute.',
      check_source: 'Controlla che l’orologio o l’anello sia collegato e aggiornato nella sua app.',
      check_connection: 'Controlla la connessione del telefono, poi sincronizza di nuovo dall’app.',
      check_types: 'Se un tipo risulta «Permesso non concesso», concedi il permesso dall’app.',
      connect_device: 'Collega un dispositivo dall’app FitMesh: più sotto trovi come.',
    },
    staleNote: 'Dopo questo sync non è arrivato nessun dato. I giorni successivi sono senza dato, non a zero.',
    webNote: 'Il sync si avvia dall’app FitMesh, non da questa pagina.',
    seeTypes: 'Vedi i tipi di dato',
  },
  sources: {
    title: 'Sorgenti dati',
    intro: 'FitMesh usa una sola sorgente per ogni tipo di dato, la fonte vincente, e non somma le sorgenti tra loro.',
    kind: { watch: 'Orologio', phone: 'Telefono', ring: 'Anello' },
    via: { health_connect: 'Health Connect', healthkit: 'Apple Salute', ble: 'Bluetooth' },
    typesTitle: 'Tipi di dato',
    typesAria: 'Tipi di dato di {label}',
    types: {
      steps: 'Passi',
      heart_rate: 'Frequenza cardiaca',
      resting_heart_rate: 'FC a riposo',
      sleep: 'Sonno (totale)',
      sleep_stages: 'Fasi del sonno',
      workouts: 'Allenamenti',
      calories: 'Calorie',
      distance: 'Distanza',
      hrv: 'HRV (variabilità FC)',
    },
    statusOk: 'Letto',
    winning: 'Fonte vincente',
    wonBy: 'Vince {label}',
    wins: 'Fonte vincente per {n} di {total} tipi',
    winsNone: 'Non è la fonte vincente per nessun tipo',
    typesNone: 'Per questa sorgente non risulta nessun tipo di dato.',
    empty: {
      title: 'Nessuna sorgente collegata',
      body: 'Qui compariranno l’orologio, il telefono o l’anello collegati a questo account, con i tipi di dato che ciascuno fornisce.',
      stepsTitle: 'Come collegare un dispositivo',
      steps: [
        'Apri la pagina dei dispositivi e genera un codice di abbinamento.',
        'Inserisci il codice nell’app FitMesh.',
        'Nell’app tocca «Sincronizza ora».',
      ],
      link: 'Vai ai dispositivi',
    },
  },
  history: {
    title: 'Attività sync',
    subtitle: 'Gli ultimi sync, dal più recente.',
    listAria: 'Ultimi sync',
    cols: { when: 'Quando', result: 'Esito', duration: 'Durata', types: 'Tipi di dato' },
    readTypes: (n) => (n === 1 ? '1 tipo letto' : `${n} tipi letti`),
    failedTypes: (n) => (n === 1 ? '1 non riuscito' : `${n} non riusciti`),
    seconds: (n) => `${n} s`,
    durationNone: 'Non registrata',
    emptyTitle: 'Ancora nessuna cronologia',
    emptyBody: 'I sync compariranno qui dopo il primo.',
    gap: 'Dopo il {when} non risulta nessun sync. I dati successivi non sono ancora arrivati.',
  },
};

const EN: SourcesCopy = {
  status: {
    title: 'Sync status',
    whatHappened: 'What happened',
    outcome: 'Outcome',
    okBody: 'The last sync finished without problems: the data was read and sent.',
    neverWithSources: 'Sources are connected but no sync has happened yet.',
    neverNoSources: 'No sync has happened yet because no source is connected.',
    problem: {
      permission_revoked: 'Permission to read health data is no longer granted, so some data was not read.',
      source_unreachable: 'The source did not respond on the last attempt. Data after that moment has not arrived yet.',
      upload_failed: 'The data was read on the device but did not reach the server.',
      partial_types: 'The last sync read only some of the data types. The sources below show which ones.',
    },
    problemGeneric: {
      error: 'The last sync did not succeed.',
      partial: 'The last sync read only part of the data.',
    },
    actionsTitle: 'What you can do',
    actions: {
      open_sync: 'Open the FitMesh app and tap “Sync now”.',
      grant_permissions: 'In the app tap “Grant permissions” and allow reading of health data.',
      check_source: 'Check that the watch or ring is connected and up to date in its own app.',
      check_connection: 'Check the phone’s connection, then sync again from the app.',
      check_types: 'If a type shows “Permission not granted”, grant the permission from the app.',
      connect_device: 'Connect a device from the FitMesh app: you will find how further down.',
    },
    staleNote: 'No data has arrived since this sync. The days after it have no data, they are not zero.',
    webNote: 'Sync starts from the FitMesh app, not from this page.',
    seeTypes: 'See the data types',
  },
  sources: {
    title: 'Data sources',
    intro: 'FitMesh uses one source for each data type, the winning source, and does not add sources together.',
    kind: { watch: 'Watch', phone: 'Phone', ring: 'Ring' },
    via: { health_connect: 'Health Connect', healthkit: 'Apple Health', ble: 'Bluetooth' },
    typesTitle: 'Data types',
    typesAria: 'Data types of {label}',
    types: {
      steps: 'Steps',
      heart_rate: 'Heart rate',
      resting_heart_rate: 'Resting HR',
      sleep: 'Sleep (total)',
      sleep_stages: 'Sleep stages',
      workouts: 'Workouts',
      calories: 'Calories',
      distance: 'Distance',
      hrv: 'HRV (heart rate variability)',
    },
    statusOk: 'Read',
    winning: 'Winning source',
    wonBy: 'Won by {label}',
    wins: 'Winning source for {n} of {total} types',
    winsNone: 'Not the winning source for any type',
    typesNone: 'No data type is listed for this source.',
    empty: {
      title: 'No source connected',
      body: 'The watch, phone or ring connected to this account will appear here, with the data types each one provides.',
      stepsTitle: 'How to connect a device',
      steps: [
        'Open the devices page and generate a pairing code.',
        'Enter the code in the FitMesh app.',
        'In the app tap “Sync now”.',
      ],
      link: 'Go to devices',
    },
  },
  history: {
    title: 'Sync activity',
    subtitle: 'The latest syncs, most recent first.',
    listAria: 'Latest syncs',
    cols: { when: 'When', result: 'Result', duration: 'Duration', types: 'Data types' },
    readTypes: (n) => (n === 1 ? '1 type read' : `${n} types read`),
    failedTypes: (n) => `${n} failed`,
    seconds: (n) => `${n} s`,
    durationNone: 'Not recorded',
    emptyTitle: 'No history yet',
    emptyBody: 'Syncs will appear here after the first one.',
    gap: 'No sync is recorded after {when}. Later data has not arrived yet.',
  },
};

export function sourcesCopy(l: UiLocale): SourcesCopy {
  return l === 'it' ? IT : EN;
}

/** Sostituisce i segnaposto {nome} di una frase. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}
