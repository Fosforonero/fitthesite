/**
 * Copy della schermata «Sorgenti dei dati» (PROTOTIPO, dati sintetici). IT e EN;
 * ogni altra lingua usa l'EN. I nomi dei tipi di dato, delle sorgenti e dei
 * gesti nell'app sono quelli dell'app al tag v3.10.0+191 (dataTypeSteps,
 * dataTypeHeartRate, dataTypeRestingHeartRate, dataTypeHrv, dataTypeWorkout,
 * syncNow, settingsSourcePriorities, syncFreshnessNever). Dove l'app non ha
 * una stringa la frase e' neutra.
 *
 * Cio' che esiste gia' in lib/web-dashboard/copy.ts NON si ripete qui:
 * «Ultimo dato ricevuto», «Nessun dato», i motivi di assenza («Non fornito
 * dalla fonte», «Nessun campione»), «Dati non aggiornati». Qui c'e' solo cio' che e' specifico di questa schermata. Il server
 * non possiede l'esito dei singoli sync: nessuna frase qui lo dichiara.
 *
 * Regole: niente em dash, niente promesse di disponibilita' o di date, niente
 * linguaggio promozionale, niente AI. Il web non puo' avviare un sync: nessuna
 * frase qui promette il contrario. Testo PLACEHOLDER da approvare (SITE-WRITING).
 */
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { DataTypeKey, SourceKind, Via } from '@/lib/web-dashboard/model';

/** Le frasi-gesto che la schermata sa comporre; quali usare lo decide il componente dallo stato. */
export type ActionKey = 'open_sync' | 'connect_device';

export interface SourcesCopy {
  status: {
    title: string;
    aboutTitle: string;
    /** Cosa dice e cosa non dice questa pagina: il server conosce quando e' arrivato un dato, non l'esito dei sync. */
    scope: string;
    never: string;
    actionsTitle: string;
    actions: Record<ActionKey, string>;
    /** Sotto l'eta' quando l'ultimo dato ricevuto e' vecchio: cio' che manca non e' zero. */
    staleNote: string;
    /** Il web non puo' avviare un sync: e' scritto, non nascosto. */
    webNote: string;
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
}

const IT: SourcesCopy = {
  status: {
    title: 'Ultimo dato ricevuto',
    aboutTitle: 'Cosa vedi qui',
    scope: 'FitMesh mostra quando è arrivato l’ultimo dato di ogni sorgente. Non conserva un elenco delle ricezioni passate e non conosce come è andato ogni singolo sync sul telefono.',
    never: 'Non è ancora arrivato nessun dato.',
    actionsTitle: 'Cosa puoi fare',
    actions: {
      open_sync: 'Apri l’app FitMesh e tocca «Sincronizza ora».',
      connect_device: 'Collega un dispositivo dall’app FitMesh: più sotto trovi come.',
    },
    staleNote: 'Dopo questo dato non è arrivato nient’altro. I giorni successivi sono senza dato, non a zero.',
    webNote: 'Il sync si avvia dall’app FitMesh, non da questa pagina.',
  },
  sources: {
    title: 'Sorgenti che hanno inviato dati',
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
      title: 'Nessun dato ricevuto dalle sorgenti',
      body: 'Qui compariranno le sorgenti che consegnano dati a questo account, con i tipi di dato che ciascuna fornisce.',
      stepsTitle: 'Come collegare un dispositivo',
      steps: [
        'Apri la pagina dei dispositivi e genera un codice di abbinamento.',
        'Inserisci il codice nell’app FitMesh.',
        'Nell’app tocca «Sincronizza ora».',
      ],
      link: 'Vai ai dispositivi',
    },
  },
};

const EN: SourcesCopy = {
  status: {
    title: 'Last data received',
    aboutTitle: 'What you see here',
    scope: 'FitMesh shows when the last data of each source arrived. It does not keep a list of past receipts and does not know how each single sync on the phone went.',
    never: 'No data has arrived yet.',
    actionsTitle: 'What you can do',
    actions: {
      open_sync: 'Open the FitMesh app and tap “Sync now”.',
      connect_device: 'Connect a device from the FitMesh app: you will find how further down.',
    },
    staleNote: 'Nothing else has arrived after this data. The days after it have no data, they are not zero.',
    webNote: 'Sync starts from the FitMesh app, not from this page.',
  },
  sources: {
    title: 'Sources that sent data',
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
      title: 'No data received from any source',
      body: 'The sources that deliver data to this account will appear here, with the data types each one provides.',
      stepsTitle: 'How to connect a device',
      steps: [
        'Open the devices page and generate a pairing code.',
        'Enter the code in the FitMesh app.',
        'In the app tap “Sync now”.',
      ],
      link: 'Go to devices',
    },
  },
};

export function sourcesCopy(l: UiLocale): SourcesCopy {
  return l === 'it' ? IT : EN;
}

/** Sostituisce i segnaposto {nome} di una frase. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}
