/**
 * Copy propria della schermata Cuore. IT e EN; ogni altra lingua usa l'EN.
 *
 * I nomi seguono le stringhe dell'app (v3.10.0+191): «riposo», «media», «min»,
 * «max», «bpm», «Frequenza cardiaca», «HRV (variabilita' FC)», e la riga
 * «Solo informativo · Non diagnostico · Non sostituisce il parere medico».
 * Cio' che e' gia' in lib/web-dashboard/copy.ts (motivi di assenza, legenda,
 * «Sorgenti dei dati») NON e' ripetuto qui.
 *
 * Regole: niente em dash, niente promesse di disponibilita' o di date, nessuna
 * interpretazione medica. Testi PLACEHOLDER da approvare prima di ogni uso pubblico.
 */
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { UiLocale } from '@/lib/web-dashboard/format';

export interface TileCopy {
  label: string;
  hint: string;
}

export interface HeartCopy {
  statsTitle: string;
  tiles: { resting: TileCopy; average: TileCopy; min: TileCopy; max: TileCopy; hrv: TileCopy };

  chartTitle: string;
  chartSubtitle: string;
  source: (label: string) => string;
  axisUnit: string;
  restingLine: (bpm: string) => string;
  legend: { resting: string; workout: string };
  legendLabel: string;
  rangeSentence: (min: string, max: string) => string;

  coverageLabel: string;
  samplesSentence: (samples: string, expected: string, covered: string, of: string) => string;
  gapsSentence: (list: string) => string;
  noGapsSentence: string;
  futureSentence: (time: string) => string;
  /** «dalle 13:00 alle 18:00» */
  timeRange: (from: string, to: string) => string;

  workoutsHidden: string;
  workoutsPartial: string;

  tableLabel: string;
  hourCaption: string;
  cols: { hour: string; min: string; avg: string; max: string; samples: string };
  samplesOf: (n: number, total: number) => string;
  workoutCaption: string;
  workoutCols: { title: string; from: string; to: string };

  emptyTitle: string;
  emptyBody: Record<AbsentReason, string>;
  linkDevices: string;

  disclaimer: string;
}

const IT: HeartCopy = {
  statsTitle: 'Valori del giorno',
  tiles: {
    resting: { label: 'Riposo', hint: 'FC a riposo' },
    average: { label: 'Media', hint: 'Media dei campioni del giorno' },
    min: { label: 'Min', hint: 'Campione più basso' },
    max: { label: 'Max', hint: 'Campione più alto' },
    hrv: { label: 'HRV', hint: 'Variabilità della frequenza cardiaca' },
  },

  chartTitle: 'Frequenza cardiaca',
  chartSubtitle: 'Battiti al minuto, in finestre da 10 minuti sulle 24 ore.',
  source: (label) => `Fonte: ${label}`,
  axisUnit: 'bpm',
  restingLine: (bpm) => `Riposo ${bpm}`,
  legend: { resting: 'Riposo', workout: 'Allenamento' },
  legendLabel: 'Legenda del grafico',
  rangeSentence: (min, max) => `Da ${min} a ${max} bpm.`,

  coverageLabel: 'Copertura',
  samplesSentence: (samples, expected, covered, of) => `Campioni: ${samples} su ${expected}. Coperte ${covered} su ${of}.`,
  gapsSentence: (list) => `Nessun campione ${list}.`,
  noGapsSentence: 'Nessun intervallo senza campioni.',
  futureSentence: (time) => `Le ore dopo le ${time} non sono ancora trascorse.`,
  timeRange: (from, to) => `dalle ${from} alle ${to}`,

  workoutsHidden: 'Allenamenti non mostrati sul grafico.',
  workoutsPartial: 'L’elenco degli allenamenti è incompleto.',

  tableLabel: 'Tabella dei dati',
  hourCaption: 'Frequenza cardiaca per ora, in bpm',
  cols: { hour: 'Ora', min: 'Min', avg: 'Media', max: 'Max', samples: 'Campioni' },
  samplesOf: (n, total) => `${n} di ${total}`,
  workoutCaption: 'Allenamenti del giorno',
  workoutCols: { title: 'Allenamento', from: 'Inizio', to: 'Fine' },

  emptyTitle: 'Nessun campione per questo giorno',
  emptyBody: {
    no_data_received: 'Non è arrivato nessun dato per questo account, quindi non c’è una frequenza cardiaca da mostrare.',
    not_synced_yet: 'Il sync non ha ancora portato campioni per questo giorno. Non significa che la frequenza fosse zero.',
    source_lacks_type: 'La sorgente collegata non fornisce la frequenza cardiaca.',
    no_samples: 'La sorgente non ha consegnato campioni in questo giorno. Non significa che la frequenza fosse zero.',
    not_yet: 'La giornata non è ancora iniziata, quindi non ci sono campioni.',
  },
  linkDevices: 'Collega un dispositivo',

  disclaimer: 'Solo informativo · Non diagnostico · Non sostituisce il parere medico',
};

const EN: HeartCopy = {
  statsTitle: 'Values for the day',
  tiles: {
    resting: { label: 'Resting', hint: 'Resting heart rate' },
    average: { label: 'Average', hint: 'Average of the day’s samples' },
    min: { label: 'Min', hint: 'Lowest sample' },
    max: { label: 'Max', hint: 'Highest sample' },
    hrv: { label: 'HRV', hint: 'Heart rate variability' },
  },

  chartTitle: 'Heart rate',
  chartSubtitle: 'Beats per minute, in 10 minute windows across 24 hours.',
  source: (label) => `Source: ${label}`,
  axisUnit: 'bpm',
  restingLine: (bpm) => `Resting ${bpm}`,
  legend: { resting: 'Resting', workout: 'Workout' },
  legendLabel: 'Chart legend',
  rangeSentence: (min, max) => `From ${min} to ${max} bpm.`,

  coverageLabel: 'Coverage',
  samplesSentence: (samples, expected, covered, of) => `Samples: ${samples} of ${expected}. ${covered} covered out of ${of}.`,
  gapsSentence: (list) => `No samples ${list}.`,
  noGapsSentence: 'No interval without samples.',
  futureSentence: (time) => `Hours after ${time} have not elapsed yet.`,
  timeRange: (from, to) => `from ${from} to ${to}`,

  workoutsHidden: 'Workouts are not shown on the chart.',
  workoutsPartial: 'The workout list is incomplete.',

  tableLabel: 'Data table',
  hourCaption: 'Heart rate by hour, in bpm',
  cols: { hour: 'Hour', min: 'Min', avg: 'Average', max: 'Max', samples: 'Samples' },
  samplesOf: (n, total) => `${n} of ${total}`,
  workoutCaption: 'Workouts of the day',
  workoutCols: { title: 'Workout', from: 'Start', to: 'End' },

  emptyTitle: 'No samples for this day',
  emptyBody: {
    no_data_received: 'No data has arrived for this account, so there is no heart rate to show.',
    not_synced_yet: 'The sync has not brought samples for this day yet. That does not mean the heart rate was zero.',
    source_lacks_type: 'The connected source does not provide heart rate.',
    no_samples: 'The source delivered no samples on this day. That does not mean the heart rate was zero.',
    not_yet: 'The day has not started yet, so there are no samples.',
  },
  linkDevices: 'Connect a device',

  disclaimer: 'Informational only · Not diagnostic · Not a substitute for medical advice',
};

export function heartCopy(l: UiLocale): HeartCopy {
  return l === 'it' ? IT : EN;
}
