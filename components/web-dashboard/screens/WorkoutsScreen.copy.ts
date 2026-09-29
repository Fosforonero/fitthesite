/**
 * Copy della schermata «Allenamenti». IT e EN; ogni altra lingua usa l'EN.
 *
 * Le parole sono quelle dell'app (v3.10.0+191: workoutSessionsLabel,
 * workoutsDuration, workoutDetailDuration/Distance/Calories, workoutTypeRunning,
 * workoutTypeWalking, workoutTypeBiking, workoutTypeStrength, workoutTypeSwimming,
 * hrAvgPrefix, hrStatMax, sourceSectionTitle, period7). Cio' che e' gia' in
 * lib/web-dashboard/copy.ts (motivi di assenza, note del parziale, legenda,
 * «Zero misurato», unita') NON si ripete qui: lo legge la schermata.
 *
 * Le tre frasi dell'elenco sono tre affermazioni diverse e non si scambiano:
 *  - ci sono sessioni;
 *  - MISURATO zero: «nessun allenamento registrato» (lo sappiamo);
 *  - ASSENTE: «non sappiamo se ci sono stati» (non lo sappiamo).
 *
 * Regole: niente em dash, niente promesse ne' date di disponibilita', niente
 * linguaggio promozionale. Testo PLACEHOLDER da approvare prima di ogni uso
 * pubblico: il prototipo non e' raggiungibile da un visitatore.
 */
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { WorkoutType } from '@/lib/web-dashboard/model';

export interface WeekCounts {
  /** Misurati, zero compresi. */
  measured: number;
  zero: number;
  partial: number;
  absent: number;
}

export interface WorkoutsCopy {
  summary: {
    aria: string;
    sessions: string;
    duration: string;
    calories: string;
    /** Somma di sole `present` sessioni su `total`: il totale non e' completo. */
    sumOf: (present: number, total: number) => string;
  };
  list: {
    title: string;
    types: Record<WorkoutType, string>;
    cols: {
      session: string;
      start: string;
      duration: string;
      distance: string;
      calories: string;
      hrAvg: string;
      hrMax: string;
      source: string;
    };
    /** Elenco chiuso: nessuna sessione e lo sappiamo. */
    measuredEmpty: { title: string; body: string };
    /** Elenco incompleto (dato `partial`): le sessioni mostrate sono vere, ma potrebbero mancarne. */
    partialTitle: string;
    partialBody: string;
    /** Elenco parziale e vuoto: nessuna sessione nella parte letta, non e' uno zero pieno. */
    partialEmpty: string;
    /** Elenco assente: non sappiamo se ce ne sono stati. */
    absent: {
      title: string;
      body: Record<AbsentReason, string>;
      connect: string;
    };
  };
  week: {
    title: string;
    subtitle: string;
    summary: (c: WeekCounts) => string;
    average: string;
    averageOver: (n: number) => string;
    averageNone: string;
    tableLabel: string;
    tableCaption: string;
    colDay: string;
    colMinutes: string;
    colState: string;
    notesTitle: string;
    daysAria: string;
  };
}

const IT: WorkoutsCopy = {
  summary: {
    aria: 'Riepilogo del giorno',
    sessions: 'Sessioni',
    duration: 'Durata totale',
    calories: 'Calorie',
    sumOf: (present, total) => `Somma delle sessioni con dato: ${present} su ${total}.`,
  },
  list: {
    title: 'Sessioni del giorno',
    types: {
      run: 'Corsa',
      walk: 'Camminata',
      cycle: 'Ciclismo',
      strength: 'Forza',
      swim: 'Nuoto',
      other: 'Altro',
    },
    cols: {
      session: 'Sessione',
      start: 'Inizio',
      duration: 'Durata',
      distance: 'Distanza',
      calories: 'Calorie',
      hrAvg: 'FC media',
      hrMax: 'FC max',
      source: 'Fonte',
    },
    measuredEmpty: {
      title: 'Nessun allenamento registrato per questo giorno',
      body: 'La lettura è riuscita e non ha trovato sessioni. È un dato: zero allenamenti.',
    },
    partialTitle: 'Elenco parziale',
    partialBody: 'Le sessioni qui sotto sono reali, ma l’elenco copre solo una parte del giorno: potrebbe mancarne qualcuna.',
    partialEmpty: 'Nella parte letta del giorno non risultano sessioni. Non possiamo dire lo stesso del resto.',
    absent: {
      title: 'Non sappiamo se ci sono stati allenamenti',
      body: {
        no_source: 'Nessuna fonte è collegata, quindi non c’è nulla da leggere.',
        not_synced_yet: 'Il sync non ha ancora consegnato questo giorno. Quello che manca non è zero.',
        permission_missing: 'Il permesso di lettura degli allenamenti si concede dall’app FitMesh.',
        source_lacks_type: 'La fonte collegata non fornisce gli allenamenti.',
        no_samples: 'La fonte non ha consegnato sessioni per questo giorno: non possiamo dire se ce ne sono state.',
        not_yet: 'Il giorno non è ancora trascorso.',
        read_error: 'La lettura non è riuscita. Non significa che non ci siano stati allenamenti.',
      },
      connect: 'Collega un dispositivo',
    },
  },
  week: {
    title: 'Minuti attivi, ultimi 7 giorni',
    subtitle: 'Contesto della settimana. Non indica in quali giorni ci sono stati allenamenti.',
    summary: (c) =>
      `Minuti attivi degli ultimi 7 giorni: ${c.measured} giorni misurati${c.zero > 0 ? `, di cui ${c.zero} con zero misurato` : ''}, ${c.partial} parziali, ${c.absent} senza dato.`,
    average: 'Media dei giorni misurati',
    averageOver: (n) => (n === 1 ? 'su 1 giorno' : `su ${n} giorni`),
    averageNone: 'Nessun giorno misurato',
    tableLabel: 'Tabella dei dati',
    tableCaption: 'Minuti attivi al giorno, ultimi 7 giorni',
    colDay: 'Giorno',
    colMinutes: 'Minuti attivi',
    colState: 'Stato',
    notesTitle: 'Giorni senza dato o parziali',
    daysAria: 'Giorni della settimana',
  },
};

const EN: WorkoutsCopy = {
  summary: {
    aria: 'Summary of the day',
    sessions: 'Sessions',
    duration: 'Total duration',
    calories: 'Calories',
    sumOf: (present, total) => `Sum of the sessions with data: ${present} of ${total}.`,
  },
  list: {
    title: 'Sessions of the day',
    types: {
      run: 'Running',
      walk: 'Walking',
      cycle: 'Biking',
      strength: 'Strength training',
      swim: 'Swimming',
      other: 'Other',
    },
    cols: {
      session: 'Session',
      start: 'Start',
      duration: 'Duration',
      distance: 'Distance',
      calories: 'Calories',
      hrAvg: 'Avg HR',
      hrMax: 'Max HR',
      source: 'Source',
    },
    measuredEmpty: {
      title: 'No workouts recorded for this day',
      body: 'The read succeeded and found no sessions. That is data: zero workouts.',
    },
    partialTitle: 'Partial list',
    partialBody: 'The sessions below are real, but the list covers only part of the day: some may be missing.',
    partialEmpty: 'No sessions were found in the part of the day that was read. We cannot say the same for the rest.',
    absent: {
      title: 'We do not know whether there were any workouts',
      body: {
        no_source: 'No source is connected, so there is nothing to read.',
        not_synced_yet: 'The sync has not delivered this day yet. What is missing is not zero.',
        permission_missing: 'Permission to read workouts is granted in the FitMesh app.',
        source_lacks_type: 'The connected source does not provide workouts.',
        no_samples: 'The source delivered no sessions for this day: we cannot say whether there were any.',
        not_yet: 'This day has not elapsed yet.',
        read_error: 'The read failed. That does not mean there were no workouts.',
      },
      connect: 'Connect a device',
    },
  },
  week: {
    title: 'Active minutes, last 7 days',
    subtitle: 'Context for the week. It does not show which days had workouts.',
    summary: (c) =>
      `Active minutes over the last 7 days: ${c.measured} measured days${c.zero > 0 ? `, ${c.zero} of them a measured zero` : ''}, ${c.partial} partial, ${c.absent} with no data.`,
    average: 'Average of measured days',
    averageOver: (n) => (n === 1 ? 'over 1 day' : `over ${n} days`),
    averageNone: 'No measured day',
    tableLabel: 'Data table',
    tableCaption: 'Active minutes per day, last 7 days',
    colDay: 'Day',
    colMinutes: 'Active minutes',
    colState: 'State',
    notesTitle: 'Days with no data or partial',
    daysAria: 'Days of the week',
  },
};

export function workoutsCopy(l: UiLocale): WorkoutsCopy {
  return l === 'it' ? IT : EN;
}
