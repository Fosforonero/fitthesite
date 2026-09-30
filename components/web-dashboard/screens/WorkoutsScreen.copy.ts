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
 * Le frasi dell'elenco sono due affermazioni diverse e non si scambiano:
 *  - ci sono sessioni;
 *  - ASSENTE: «non sappiamo se ci sono stati» (non lo sappiamo).
 * Non esiste «nessun allenamento registrato» come dato misurato: il server non
 * ha un campo che provi di aver letto e di non aver trovato nulla, quindi un
 * giorno senza righe e' sempre assente.
 *
 * Il riquadro settimanale si chiama «Durata degli allenamenti»: e' la somma di
 * `duration_min` delle righe di `workouts`, non una misura di attivita' del
 * giorno. Il server non ha una sorgente per una misura di attivita' oraria.
 *
 * Regole: niente em dash, niente promesse ne' date di disponibilita', niente
 * linguaggio promozionale. Testo PLACEHOLDER da approvare prima di ogni uso
 * pubblico: il prototipo non e' raggiungibile da un visitatore.
 */
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { WorkoutType } from '@/lib/web-dashboard/model';

export interface WeekCounts {
  /** Giorni con durata completa, zero compresi. */
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
    };
    /** Elenco incompleto (dato `partial`): le sessioni mostrate sono vere, ma potrebbero mancarne. */
    partialTitle: string;
    partialBody: string;
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
    total: string;
    totalOver: (n: number) => string;
    totalNone: string;
    /** «{n}» allenamenti ricevuti in quel giorno. */
    countOf: (n: number) => string;
    tableLabel: string;
    tableCaption: string;
    colDay: string;
    colCount: string;
    colDuration: string;
    colState: string;
    notesTitle: string;
    daysAria: string;
    /** Il giorno ha allenamenti ricevuti ma nessuno con la durata: non e' «nessun campione». */
    durationNotReceived: string;
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
    },
    partialTitle: 'Elenco parziale',
    partialBody: 'Le sessioni qui sotto sono arrivate, ma l’elenco copre solo una parte del giorno: potrebbe mancarne qualcuna.',
    absent: {
      title: 'Non sappiamo se ci sono stati allenamenti',
      body: {
        no_data_received: 'Non è arrivato nessun dato per questo account, quindi non c’è nulla da leggere.',
        not_synced_yet: 'Il sync non ha ancora consegnato questo giorno. Quello che manca non è zero.',
        source_lacks_type: 'La fonte collegata non fornisce gli allenamenti.',
        no_samples: 'La fonte non ha consegnato sessioni per questo giorno: non possiamo dire se ce ne sono state.',
        not_yet: 'Il giorno non è ancora trascorso.',
      },
      connect: 'Collega un dispositivo',
    },
  },
  week: {
    title: 'Durata degli allenamenti, ultimi 7 giorni',
    subtitle:
      'Durata totale e numero di allenamenti per giorno, calcolati solo sugli allenamenti ricevuti. Un giorno senza allenamenti ricevuti non è uno zero: non sappiamo se ce ne sono stati.',
    summary: (c) =>
      `Durata degli allenamenti negli ultimi 7 giorni: ${c.measured} giorni con durata completa${c.zero > 0 ? `, di cui ${c.zero} con zero misurato` : ''}, ${c.partial} parziali, ${c.absent} senza dato.`,
    total: 'Totale dei giorni con durata completa',
    totalOver: (n) => (n === 1 ? 'su 1 giorno' : `su ${n} giorni`),
    totalNone: 'Nessun giorno con durata completa',
    countOf: (n) => (n === 1 ? '1 allenamento' : `${n} allenamenti`),
    tableLabel: 'Tabella dei dati',
    tableCaption: 'Numero e durata degli allenamenti ricevuti per giorno, ultimi 7 giorni',
    colDay: 'Giorno',
    colCount: 'Allenamenti',
    colDuration: 'Durata',
    colState: 'Stato',
    notesTitle: 'Giorni senza dato o parziali',
    daysAria: 'Giorni della settimana',
    durationNotReceived: 'Durata non ricevuta',
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
    },
    partialTitle: 'Partial list',
    partialBody: 'The sessions below have arrived, but the list covers only part of the day: some may be missing.',
    absent: {
      title: 'We do not know whether there were any workouts',
      body: {
        no_data_received: 'No data has arrived for this account, so there is nothing to read.',
        not_synced_yet: 'The sync has not delivered this day yet. What is missing is not zero.',
        source_lacks_type: 'The connected source does not provide workouts.',
        no_samples: 'The source delivered no sessions for this day: we cannot say whether there were any.',
        not_yet: 'This day has not elapsed yet.',
      },
      connect: 'Connect a device',
    },
  },
  week: {
    title: 'Workout duration, last 7 days',
    subtitle:
      'Total duration and number of workouts per day, calculated only on the workouts received. A day with no workouts received is not a zero: we do not know whether there were any.',
    summary: (c) =>
      `Workout duration over the last 7 days: ${c.measured} days with complete duration${c.zero > 0 ? `, ${c.zero} of them a measured zero` : ''}, ${c.partial} partial, ${c.absent} with no data.`,
    total: 'Total of the days with complete duration',
    totalOver: (n) => (n === 1 ? 'over 1 day' : `over ${n} days`),
    totalNone: 'No day with complete duration',
    countOf: (n) => (n === 1 ? '1 workout' : `${n} workouts`),
    tableLabel: 'Data table',
    tableCaption: 'Number and duration of workouts received per day, last 7 days',
    colDay: 'Day',
    colCount: 'Workouts',
    colDuration: 'Duration',
    colState: 'State',
    notesTitle: 'Days with no data or partial',
    daysAria: 'Days of the week',
    durationNotReceived: 'Duration not received',
  },
};

export function workoutsCopy(l: UiLocale): WorkoutsCopy {
  return l === 'it' ? IT : EN;
}
