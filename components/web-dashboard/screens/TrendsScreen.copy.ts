/**
 * Copy della schermata Trend. IT e EN; ogni altra lingua usa l'EN.
 *
 * Le parole sono quelle dell'app (v3.10.0+191: navTrend, trendPeriod7/30/90,
 * statLabelSteps, statLabelSleep, vitalsRestingHr, goalActiveMinutes,
 * weekComparisonNoData «Dati insufficienti per il confronto», dashboardNoData).
 * Cio' che e' gia' in lib/web-dashboard/copy.ts (motivi di assenza, note del
 * parziale, legenda, «Zero misurato», unita') NON si ripete qui: lo legge la
 * schermata.
 *
 * Regole: niente em dash, niente promesse ne' date di disponibilita', niente
 * linguaggio promozionale, nessuna lettura medica. Testo PLACEHOLDER da
 * approvare prima di ogni uso pubblico: il prototipo non e' raggiungibile da
 * un visitatore.
 */
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { AbsentReason } from '@/lib/web-dashboard/measure';
import type { TrendMetric } from '@/lib/web-dashboard/model';

export interface MetricCopy {
  title: string;
  /** «Passi al giorno»: la grandezza, senza il periodo. */
  perDay: string;
  /** Solo per le linee: l'asse non parte da zero e va detto. */
  axisNote?: string;
}

export interface TrendsCopy {
  rangeLabel: string;
  ranges: Record<7 | 30 | 90, string>;
  /** «Dal 25 ago al 23 set. Il giorno scelto e' l'ultimo.» */
  period: (from: string, to: string) => string;
  lastDays: (n: number) => string;

  noSource: { title: string; body: string; link: string };
  metrics: Record<TrendMetric, MetricCopy>;
  openDetail: string;

  coverage: {
    headline: (n: number, m: number) => string;
    /** `reasons` e' gia' un elenco: «Nessun campione (2), Non ancora sincronizzato (1)». */
    absent: (n: number, reasons: string) => string;
    partial: (n: number, notes: string) => string;
    zero: (n: number) => string;
    partialNotJoined: string;
    avg: string;
    min: string;
    max: string;
    avgBasis: (n: number, partials: number) => string;
    extremePartial: string;
    total: string;
    totalAllDays: (m: number) => string;
    totalPartialBasis: (withData: number, complete: number, m: number) => string;
  };
  meanLegend: string;

  insufficient: {
    title: string;
    need: (min: number, n: number, m: number) => string;
    body: Record<AbsentReason, string>;
    present: string;
  };

  summary: {
    stats: (avg: string, min: string, max: string) => string;
    insufficient: (title: string, n: number, m: number) => string;
  };

  table: {
    label: string;
    caption: string;
    day: string;
    value: string;
    state: string;
  };
}

const days = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const IT: TrendsCopy = {
  rangeLabel: 'Periodo',
  ranges: { 7: '7 giorni', 30: '30 giorni', 90: '90 giorni' },
  period: (from, to) => `Dal ${from} al ${to}. Il giorno scelto è l’ultimo.`,
  lastDays: (n) => `Ultimi ${n} giorni`,

  noSource: {
    title: 'Servono giorni sincronizzati',
    body: 'I trend si costruiscono con i giorni che la fonte ha sincronizzato. Nessuna fonte è collegata, quindi qui non c’è nulla da mostrare.',
    link: 'Collega un dispositivo',
  },
  metrics: {
    steps: { title: 'Passi', perDay: 'Passi al giorno' },
    sleepMinutes: { title: 'Sonno', perDay: 'Ore di sonno per notte' },
    restingHr: { title: 'Battito a riposo', perDay: 'Battito a riposo al giorno', axisNote: 'L’asse non parte da zero.' },
    activeMinutes: { title: 'Minuti attivi', perDay: 'Minuti attivi al giorno' },
  },
  openDetail: 'Apri',

  coverage: {
    headline: (n, m) => `${days(n, 'giorno', 'giorni')} su ${m} con dato`,
    absent: (n, reasons) => `${days(n, 'giorno', 'giorni')} senza dato: ${reasons}. Non contano come zero.`,
    partial: (n, notes) => `${days(n, 'giorno parziale', 'giorni parziali')}: ${notes}. Il valore copre solo una parte del giorno.`,
    zero: (n) => `${days(n, 'giorno', 'giorni')} a zero misurato.`,
    partialNotJoined: 'La linea non unisce i giorni parziali.',
    avg: 'Media',
    min: 'Minimo',
    max: 'Massimo',
    avgBasis: (n, partials) =>
      partials > 0
        ? `Sui ${n} giorni con dato, inclusi ${days(partials, 'parziale', 'parziali')}: può risultare più bassa.`
        : `Sui ${n} giorni con dato.`,
    extremePartial: 'Giorno parziale',
    total: 'Totale del periodo',
    totalAllDays: (m) => `Somma di tutti i ${m} giorni.`,
    totalPartialBasis: (withData, complete, m) =>
      `Somma dei ${withData} giorni con dato. Giorni completi: ${complete} su ${m}. I giorni senza dato non sono contati come zero.`,
  },
  meanLegend: 'Media dei giorni con dato',

  insufficient: {
    title: 'Dati insufficienti',
    need: (min, n, m) =>
      `Servono almeno ${min} giorni con dato per mostrare un andamento. In questi ${m} giorni ${
        n === 0 ? 'non ce n’è nessuno' : n === 1 ? 'ce n’è uno' : `ce ne sono ${n}`
      }.`,
    body: {
      no_source: 'Nessuna fonte è collegata: non c’è nulla da tracciare.',
      not_synced_yet: 'La fonte è collegata ma il sync non ha consegnato questi giorni. Non sono giorni a zero.',
      permission_missing: 'La lettura di questo dato non è autorizzata. I giorni restano senza valore, non a zero.',
      source_lacks_type: 'La fonte non fornisce questo dato. I giorni restano senza valore, non a zero.',
      no_samples: 'La fonte non ha consegnato campioni in questi giorni. Non sono giorni a zero.',
      not_yet: 'Questi giorni non sono ancora trascorsi.',
      read_error: 'La lettura non è riuscita. Non significa che non ci siano dati.',
    },
    present: 'Giorni con dato',
  },

  summary: {
    stats: (avg, min, max) => `Media ${avg}, minimo ${min}, massimo ${max}.`,
    insufficient: (title, n, m) =>
      `${title}: dati insufficienti, ${n === 0 ? 'nessun giorno' : days(n, 'giorno', 'giorni')} con dato su ${m}.`,
  },

  table: {
    label: 'Tabella dei dati',
    caption: 'Un giorno per riga, dal più recente',
    day: 'Giorno',
    value: 'Valore',
    state: 'Stato',
  },
};

const EN: TrendsCopy = {
  rangeLabel: 'Period',
  ranges: { 7: '7 days', 30: '30 days', 90: '90 days' },
  period: (from, to) => `From ${from} to ${to}. The chosen day is the last one.`,
  lastDays: (n) => `Last ${n} days`,

  noSource: {
    title: 'Trends need synced days',
    body: 'Trends are built from the days your source has synced. No source is connected, so there is nothing to show here.',
    link: 'Connect a device',
  },
  metrics: {
    steps: { title: 'Steps', perDay: 'Steps per day' },
    sleepMinutes: { title: 'Sleep', perDay: 'Hours of sleep per night' },
    restingHr: { title: 'Resting heart rate', perDay: 'Resting heart rate per day', axisNote: 'The axis does not start at zero.' },
    activeMinutes: { title: 'Active minutes', perDay: 'Active minutes per day' },
  },
  openDetail: 'Open',

  coverage: {
    headline: (n, m) => `${n} of ${m} days with data`,
    absent: (n, reasons) => `${days(n, 'day', 'days')} with no data: ${reasons}. They do not count as zero.`,
    partial: (n, notes) => `${days(n, 'partial day', 'partial days')}: ${notes}. The value covers only part of the day.`,
    zero: (n) => `${days(n, 'day', 'days')} at measured zero.`,
    partialNotJoined: 'The line does not join partial days.',
    avg: 'Average',
    min: 'Minimum',
    max: 'Maximum',
    avgBasis: (n, partials) =>
      partials > 0
        ? `Over the ${n} days with data, including ${partials} partial: it may read lower.`
        : `Over the ${n} days with data.`,
    extremePartial: 'Partial day',
    total: 'Total for the period',
    totalAllDays: (m) => `Sum of all ${m} days.`,
    totalPartialBasis: (withData, complete, m) =>
      `Sum of the ${withData} days with data. Complete days: ${complete} of ${m}. Days with no data are not counted as zero.`,
  },
  meanLegend: 'Average of days with data',

  insufficient: {
    title: 'Not enough data',
    need: (min, n, m) =>
      `At least ${min} days with data are needed to show a trend. In these ${m} days there ${
        n === 0 ? 'are none' : n === 1 ? 'is one' : `are ${n}`
      }.`,
    body: {
      no_source: 'No source is connected: there is nothing to track.',
      not_synced_yet: 'The source is connected but the sync has not delivered these days. They are not zero days.',
      permission_missing: 'Reading this data is not permitted. The days have no value, they are not zero.',
      source_lacks_type: 'The source does not provide this data. The days have no value, they are not zero.',
      no_samples: 'The source delivered no samples for these days. They are not zero days.',
      not_yet: 'These days have not elapsed yet.',
      read_error: 'The read failed. That does not mean there is no data.',
    },
    present: 'Days with data',
  },

  summary: {
    stats: (avg, min, max) => `Average ${avg}, minimum ${min}, maximum ${max}.`,
    insufficient: (title, n, m) =>
      `${title}: not enough data, ${n === 0 ? 'no days' : days(n, 'day', 'days')} with data out of ${m}.`,
  },

  table: {
    label: 'Data table',
    caption: 'One day per row, most recent first',
    day: 'Day',
    value: 'Value',
    state: 'State',
  },
};

export function trendsCopy(l: UiLocale): TrendsCopy {
  return l === 'it' ? IT : EN;
}
