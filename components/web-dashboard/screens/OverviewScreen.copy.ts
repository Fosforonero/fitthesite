/**
 * Copy della Panoramica (prototipo). IT e EN; ogni altra lingua usa l'EN.
 *
 * Le parole vengono dall'app (v3.10.0+191): «Passi», «Sonno», «FC a riposo»,
 * «Calorie attive», «Allenamenti», «Svegli/Leggero/Profondo/REM», «Piani
 * saliti», «Minuti attivi», «Da dove vengono i tuoi dati», «Sorgente
 * vincitrice», «Ripartizione per fase non disponibile». Le frasi di servizio
 * (cosa manca e perche') sono neutre e descrivono, non promettono.
 *
 * Non si ripete qui nulla che stia gia' in lib/web-dashboard/copy.ts: motivi di
 * assenza, note di parzialita', legenda, nomi delle schermate, stato del sync.
 * Regole: niente em dash, niente promesse di disponibilita' o di date, niente
 * linguaggio promozionale. Tutto PLACEHOLDER da approvare prima di un uso reale.
 */
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { DataTypeKey, SleepStage, SourceKind, SourceTypeStatus, SyncStatus, Via } from '@/lib/web-dashboard/model';

/** Le misure che la card «Cosa manca» sa nominare. */
export type MissingMetric =
  | 'steps'
  | 'hourlySteps'
  | 'distance'
  | 'activeMinutes'
  | 'floors'
  | 'caloriesActive'
  | 'sleep'
  | 'sleepTotal'
  | 'sleepStages'
  | 'restingHr'
  | 'avgHr'
  | 'minHr'
  | 'maxHr'
  | 'hrv'
  | 'workouts';

export interface OverviewCopy {
  kpiTitle: string;
  /** Testo del link verso la schermata di dettaglio; il contesto lo aggiunge lo screen reader. */
  detail: string;
  tiles: { steps: string; sleep: string; restingHr: string; workouts: string; calories: string };
  goal: {
    percent: (pct: string, goal: string) => string;
    atLeast: (pct: string, goal: string) => string;
    reached: string;
    reachedPartial: string;
  };
  sleepTile: { bedtime: string; wakeup: string };
  hrTile: { avg: (v: string) => string; avgPartial: (v: string) => string };
  workoutsTile: {
    singular: string;
    plural: string;
    none: string;
    totalDuration: (v: string) => string;
    totalDurationPartial: (v: string) => string;
    durationUnknown: string;
  };
  hourly: {
    title: string;
    peak: (hour: string, steps: string) => string;
    summary: (o: { measured: number; zero: number; partial: number; absent: number; peak: string | null }) => string;
    range: (from: string, to: string, single: boolean) => string;
    hours: (n: number) => string;
    allAbsent: string;
    tableLabel: string;
    th: { hour: string; steps: string; state: string };
  };
  sleep: {
    title: string;
    bedtime: string;
    wakeup: string;
    total: string;
    noNight: string;
    stagesUnavailable: string;
    stageBarLabel: (parts: string) => string;
    stages: Record<SleepStage, string>;
    source: string;
  };
  week: {
    title: string;
    rows: { steps: string; sleep: string; restingHr: string };
    avg: (v: string) => string;
    measuredOf: (n: number, of: number) => string;
    range: (lo: string, hi: string) => string;
    noneComplete: string;
    partialDays: (n: number) => string;
    absentDays: (n: number, reason: string | null) => string;
    tableLabel: string;
    th: { day: string };
    trendsLink: string;
  };
  sources: {
    title: string;
    stepsFrom: string;
    stepsNone: string;
    oneSource: string;
    via: Record<Via, string>;
    kind: Record<SourceKind, string>;
    chosenFor: (n: number) => string;
    chosenNone: string;
    status: Record<Exclude<SourceTypeStatus['status'], 'ok'>, string>;
    types: Record<DataTypeKey, string>;
    syncProblem: Record<NonNullable<SyncStatus['problem']>, string>;
    empty: { title: string; body: string; cta: string };
  };
  missing: {
    title: string;
    intro: string;
    allPresent: string;
    zeroTitle: string;
    zeroBody: string;
    count: (n: number) => string;
    metrics: Record<MissingMetric, string>;
    hours: (label: string, n: number) => string;
    none: (label: string) => string;
  };
}

const IT: OverviewCopy = {
  kpiTitle: 'Il giorno in sintesi',
  detail: 'Dettaglio',
  tiles: { steps: 'Passi', sleep: 'Sonno', restingHr: 'FC a riposo', workouts: 'Allenamenti', calories: 'Calorie attive' },
  goal: {
    percent: (pct, goal) => `${pct} dell’obiettivo di ${goal} passi`,
    atLeast: (pct, goal) => `Almeno ${pct} dell’obiettivo di ${goal} passi`,
    reached: 'Obiettivo raggiunto',
    reachedPartial: 'Obiettivo già raggiunto, il totale è parziale',
  },
  sleepTile: { bedtime: 'A letto', wakeup: 'Sveglia' },
  hrTile: { avg: (v) => `Media della giornata ${v} bpm`, avgPartial: (v) => `Media ${v} bpm, parziale` },
  workoutsTile: {
    singular: 'allenamento',
    plural: 'allenamenti',
    none: 'Nessun allenamento registrato',
    totalDuration: (v) => `Durata totale ${v}`,
    totalDurationPartial: (v) => `Durata totale almeno ${v}, parziale`,
    durationUnknown: 'Durata: nessun dato',
  },
  hourly: {
    title: 'Passi ora per ora',
    peak: (hour, steps) => `Ora di punta ${hour}, ${steps} passi`,
    summary: ({ measured, zero, partial, absent, peak }) => {
      const parts = [`${measured} ore con passi`];
      if (zero) parts.push(`${zero} a zero misurato`);
      if (partial) parts.push(`${partial} parziali`);
      if (absent) parts.push(`${absent} senza dato`);
      return `Passi ora per ora: ${parts.join(', ')}.${peak ? ` Ora di punta ${peak}.` : ''}`;
    },
    range: (from, to, single) => (single ? `Alle ${from}` : `Dalle ${from} alle ${to}`),
    hours: (n) => (n === 1 ? '1 ora' : `${n} ore`),
    allAbsent: 'Nessun campione in nessuna ora',
    tableLabel: 'Tabella ora per ora',
    th: { hour: 'Ora', steps: 'Passi', state: 'Stato' },
  },
  sleep: {
    title: 'Sonno',
    bedtime: 'A letto',
    wakeup: 'Sveglia',
    total: 'Durata totale',
    noNight: 'Nessun dato sulla notte',
    stagesUnavailable: 'Ripartizione per fase non disponibile',
    stageBarLabel: (parts) => `Fasi del sonno: ${parts}`,
    stages: { awake: 'Svegli', light: 'Leggero', deep: 'Profondo', rem: 'REM' },
    source: 'Sorgente',
  },
  week: {
    title: 'Ultimi 7 giorni',
    rows: { steps: 'Passi', sleep: 'Sonno', restingHr: 'FC a riposo' },
    avg: (v) => `Media ${v}`,
    measuredOf: (n, of) => `${n} di ${of} giorni misurati`,
    range: (lo, hi) => `da ${lo} a ${hi} bpm`,
    noneComplete: 'Nessun giorno con dato completo',
    partialDays: (n) => (n === 1 ? '1 giorno parziale' : `${n} giorni parziali`),
    absentDays: (n, reason) => `${n === 1 ? '1 giorno' : `${n} giorni`} senza dato${reason ? `: ${reason}` : ', motivi diversi (vedi la tabella)'}`,
    tableLabel: 'Tabella dei 7 giorni',
    th: { day: 'Giorno' },
    trendsLink: 'Trend',
  },
  sources: {
    title: 'Da dove vengono i tuoi dati',
    stepsFrom: 'Sorgente vincitrice per i passi',
    stepsNone: 'Nessuna sorgente per i passi di questo giorno',
    oneSource: 'Per i passi conta una sola sorgente: le sorgenti non si sommano.',
    via: { health_connect: 'Health Connect', healthkit: 'Apple Salute', ble: 'Bluetooth' },
    kind: { watch: 'Orologio', phone: 'Telefono', ring: 'Anello' },
    chosenFor: (n) => (n === 1 ? 'Scelta per 1 tipo di dato' : `Scelta per ${n} tipi di dato`),
    chosenNone: 'Non scelta per nessun tipo di dato',
    status: {
      no_data: 'Nessun dato',
      permission_missing: 'Permesso non concesso',
      not_provided: 'Non fornito',
      error: 'Lettura non riuscita',
    },
    types: {
      steps: 'Passi',
      heart_rate: 'Frequenza cardiaca',
      resting_heart_rate: 'FC a riposo',
      sleep: 'Sonno',
      sleep_stages: 'Fasi del sonno',
      workouts: 'Allenamenti',
      calories: 'Calorie attive',
      distance: 'Distanza',
      hrv: 'HRV',
    },
    syncProblem: {
      permission_revoked: 'Il permesso di lettura è stato revocato',
      source_unreachable: 'La sorgente non risponde',
      upload_failed: 'Il caricamento non è riuscito',
      partial_types: 'Alcuni tipi di dato non sono stati letti',
    },
    empty: {
      title: 'Nessuna sorgente collegata',
      body: 'Qui compaiono le sorgenti che hanno consegnato dati, e quale di loro conta per i passi. Il collegamento si fa dalla pagina dei dispositivi.',
      cta: 'Collega un dispositivo',
    },
  },
  missing: {
    title: 'Cosa manca in questo giorno',
    intro: 'Un dato che manca non è uno zero: significa che nessuno lo ha misurato.',
    allPresent: 'Non manca niente: ogni dato di questa pagina è completo per il giorno scelto.',
    zeroTitle: 'Zero misurato',
    zeroBody: 'Non manca: la sorgente ha misurato e il valore è zero.',
    count: (n) => (n === 1 ? '1 voce' : `${n} voci`),
    metrics: {
      steps: 'Passi',
      hourlySteps: 'Passi ora per ora',
      distance: 'Distanza',
      activeMinutes: 'Minuti attivi',
      floors: 'Piani saliti',
      caloriesActive: 'Calorie attive',
      sleep: 'Sonno',
      sleepTotal: 'Durata del sonno',
      sleepStages: 'Fasi del sonno',
      restingHr: 'FC a riposo',
      avgHr: 'FC media',
      minHr: 'FC minima',
      maxHr: 'FC massima',
      hrv: 'HRV',
      workouts: 'Allenamenti',
    },
    hours: (label, n) => `${label}, ${n === 1 ? '1 ora' : `${n} ore`}`,
    none: (label) => `${label}: nessuno`,
  },
};

const EN: OverviewCopy = {
  kpiTitle: 'The day at a glance',
  detail: 'Detail',
  tiles: { steps: 'Steps', sleep: 'Sleep', restingHr: 'Resting HR', workouts: 'Workouts', calories: 'Active calories' },
  goal: {
    percent: (pct, goal) => `${pct} of the ${goal} steps goal`,
    atLeast: (pct, goal) => `At least ${pct} of the ${goal} steps goal`,
    reached: 'Goal reached',
    reachedPartial: 'Goal already reached, the total is partial',
  },
  sleepTile: { bedtime: 'Bedtime', wakeup: 'Wake-up' },
  hrTile: { avg: (v) => `Day average ${v} bpm`, avgPartial: (v) => `Average ${v} bpm, partial` },
  workoutsTile: {
    singular: 'workout',
    plural: 'workouts',
    none: 'No workouts recorded',
    totalDuration: (v) => `Total duration ${v}`,
    totalDurationPartial: (v) => `Total duration at least ${v}, partial`,
    durationUnknown: 'Duration: no data',
  },
  hourly: {
    title: 'Steps by hour',
    peak: (hour, steps) => `Peak hour ${hour}, ${steps} steps`,
    summary: ({ measured, zero, partial, absent, peak }) => {
      const parts = [`${measured} hours with steps`];
      if (zero) parts.push(`${zero} at measured zero`);
      if (partial) parts.push(`${partial} partial`);
      if (absent) parts.push(`${absent} without data`);
      return `Steps by hour: ${parts.join(', ')}.${peak ? ` Peak hour ${peak}.` : ''}`;
    },
    range: (from, to, single) => (single ? `At ${from}` : `From ${from} to ${to}`),
    hours: (n) => (n === 1 ? '1 hour' : `${n} hours`),
    allAbsent: 'No samples in any hour',
    tableLabel: 'Hourly table',
    th: { hour: 'Hour', steps: 'Steps', state: 'Status' },
  },
  sleep: {
    title: 'Sleep',
    bedtime: 'Bedtime',
    wakeup: 'Wake-up',
    total: 'Total duration',
    noNight: 'No data for the night',
    stagesUnavailable: 'Stage breakdown unavailable',
    stageBarLabel: (parts) => `Sleep stages: ${parts}`,
    stages: { awake: 'Awake', light: 'Light', deep: 'Deep', rem: 'REM' },
    source: 'Source',
  },
  week: {
    title: 'Last 7 days',
    rows: { steps: 'Steps', sleep: 'Sleep', restingHr: 'Resting HR' },
    avg: (v) => `Average ${v}`,
    measuredOf: (n, of) => `${n} of ${of} days measured`,
    range: (lo, hi) => `${lo} to ${hi} bpm`,
    noneComplete: 'No day with complete data',
    partialDays: (n) => (n === 1 ? '1 partial day' : `${n} partial days`),
    absentDays: (n, reason) => `${n === 1 ? '1 day' : `${n} days`} without data${reason ? `: ${reason}` : ', different reasons (see the table)'}`,
    tableLabel: 'Table for the 7 days',
    th: { day: 'Day' },
    trendsLink: 'Trends',
  },
  sources: {
    title: 'Where your data comes from',
    stepsFrom: 'Winning source for steps',
    stepsNone: 'No source for the steps of this day',
    oneSource: 'Only one source counts for steps: sources are not added together.',
    via: { health_connect: 'Health Connect', healthkit: 'Apple Health', ble: 'Bluetooth' },
    kind: { watch: 'Watch', phone: 'Phone', ring: 'Ring' },
    chosenFor: (n) => (n === 1 ? 'Used for 1 data type' : `Used for ${n} data types`),
    chosenNone: 'Not used for any data type',
    status: {
      no_data: 'No data',
      permission_missing: 'Permission not granted',
      not_provided: 'Not provided',
      error: 'Read failed',
    },
    types: {
      steps: 'Steps',
      heart_rate: 'Heart rate',
      resting_heart_rate: 'Resting HR',
      sleep: 'Sleep',
      sleep_stages: 'Sleep stages',
      workouts: 'Workouts',
      calories: 'Active calories',
      distance: 'Distance',
      hrv: 'HRV',
    },
    syncProblem: {
      permission_revoked: 'The read permission was revoked',
      source_unreachable: 'The source does not respond',
      upload_failed: 'The upload did not complete',
      partial_types: 'Some data types were not read',
    },
    empty: {
      title: 'No source connected',
      body: 'This is where the sources that delivered data appear, and which one counts for steps. Connecting is done from the devices page.',
      cta: 'Connect a device',
    },
  },
  missing: {
    title: 'What is missing on this day',
    intro: 'Missing data is not a zero: it means nobody measured it.',
    allPresent: 'Nothing is missing: every value on this page is complete for the chosen day.',
    zeroTitle: 'Measured zero',
    zeroBody: 'Not missing: the source measured it and the value is zero.',
    count: (n) => (n === 1 ? '1 item' : `${n} items`),
    metrics: {
      steps: 'Steps',
      hourlySteps: 'Steps by hour',
      distance: 'Distance',
      activeMinutes: 'Active minutes',
      floors: 'Floors climbed',
      caloriesActive: 'Active calories',
      sleep: 'Sleep',
      sleepTotal: 'Sleep duration',
      sleepStages: 'Sleep stages',
      restingHr: 'Resting HR',
      avgHr: 'Average HR',
      minHr: 'Minimum HR',
      maxHr: 'Maximum HR',
      hrv: 'HRV',
      workouts: 'Workouts',
    },
    hours: (label, n) => `${label}, ${n === 1 ? '1 hour' : `${n} hours`}`,
    none: (label) => `${label}: none`,
  },
};

export function overviewCopy(l: UiLocale): OverviewCopy {
  return l === 'it' ? IT : EN;
}
