/**
 * Copy della schermata «Passi e attivita'». IT e EN; ogni altra lingua usa l'EN.
 *
 * Le parole sono quelle dell'app (v3.10.0+191: statLabelSteps, vitalsFloors,
 * vitalsActiveCalories, period7, stepsHourlyLegendPerHour,
 * intradayGoalReached, sourceSectionTitle). Cio' che e' gia' in
 * lib/web-dashboard/copy.ts (motivi di assenza, note del parziale, legenda,
 * «Zero misurato», «Ultimo dato ricevuto») NON si ripete qui: lo legge la schermata.
 *
 * Regole: niente em dash, niente promesse ne' date di disponibilita', niente
 * linguaggio promozionale. Testo PLACEHOLDER da approvare prima di ogni uso
 * pubblico: il prototipo non e' raggiungibile da un visitatore.
 */
import type { PartialNote } from '@/lib/web-dashboard/measure';
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { SourceKind, Via } from '@/lib/web-dashboard/model';

export interface HourCounts {
  measured: number;
  zero: number;
  partial: number;
  absent: number;
}

export interface WeekCounts {
  measured: number;
  zero: number;
  partial: number;
  absent: number;
  goalDays: number;
}

export interface ActivityCopy {
  hero: {
    title: string;
    goalOf: (pct: string, goal: string) => string;
    goalPartial: Record<PartialNote, (pct: string, goal: string) => string>;
    goalMet: string;
    remaining: (n: string) => string;
    goalAbsent: (goal: string) => string;
  };
  tiles: {
    aria: string;
    distance: string;
    floors: string;
    caloriesActive: string;
  };
  hourly: {
    title: string;
    subtitle: (c: HourCounts) => string;
    summary: (c: HourCounts, peak: { hour: string; steps: string } | null) => string;
    yAxis: string;
    tableLabel: string;
    tableCaption: string;
    colHour: string;
    colSteps: string;
    colState: string;
    notesTitle: string;
  };
  week: {
    title: string;
    subtitle: (goal: string) => string;
    summary: (c: WeekCounts, goal: string) => string;
    average: string;
    averageOver: (n: number) => string;
    averageNone: string;
    tableLabel: string;
    tableCaption: string;
    colDay: string;
    colSteps: string;
    colState: string;
    notesTitle: string;
  };
  source: {
    title: string;
    rule: string;
    via: Record<Via, string>;
    kind: Record<SourceKind, string>;
    notAdded: (names: string) => string;
    noSourceBody: string;
    connect: string;
  };
}

const num = (n: number, one: string, many: string) => (n === 1 ? `${n} ${one}` : `${n} ${many}`);

const IT: ActivityCopy = {
  hero: {
    title: 'Passi',
    goalOf: (pct, goal) => `${pct} dell’obiettivo di ${goal} passi`,
    goalPartial: {
      window_open: (pct, goal) => `${pct} dell’obiettivo di ${goal} passi, con la giornata ancora in corso`,
      incomplete_coverage: (pct, goal) => `${pct} dell’obiettivo di ${goal} passi, calcolato sui passi ricevuti`,
    },
    goalMet: 'Obiettivo passi raggiunto',
    remaining: (n) => `Mancano ${n} passi`,
    goalAbsent: (goal) => `Obiettivo: ${goal} passi. Senza il dato dei passi non si calcola il progresso.`,
  },
  tiles: {
    aria: 'Altre misure del giorno',
    distance: 'Distanza',
    floors: 'Piani saliti',
    caloriesActive: 'Calorie attive',
  },
  hourly: {
    title: 'Passi ora per ora',
    subtitle: (c) => {
      const parts: string[] = [];
      if (c.measured > 0) parts.push(`${num(c.measured, 'ora misurata', 'ore misurate')}${c.zero > 0 ? `, ${c.zero} a zero passi` : ''}`);
      if (c.partial > 0) parts.push(num(c.partial, 'parziale', 'parziali'));
      if (c.absent > 0) parts.push(num(c.absent, 'ora senza dato', 'ore senza dato'));
      return parts.length > 0 ? parts.join('; ') : 'Nessuna ora misurata';
    },
    summary: (c, peak) => {
      const parts: string[] = [];
      parts.push(c.measured > 0 ? `${num(c.measured, 'ora misurata', 'ore misurate')}${c.zero > 0 ? `, di cui ${c.zero} con zero passi` : ''}` : 'nessuna ora misurata');
      if (c.partial > 0) parts.push(num(c.partial, 'ora parziale', 'ore parziali'));
      if (c.absent > 0) parts.push(num(c.absent, 'ora senza dato', 'ore senza dato'));
      return `Passi ora per ora: ${parts.join('; ')}.${peak ? ` Ora più attiva: le ${peak.hour}, ${peak.steps} passi.` : ''}`;
    },
    yAxis: 'Passi nell’ora',
    tableLabel: 'Tabella dei dati orari',
    tableCaption: 'Passi per ciascuna ora del giorno, con lo stato di ogni misura',
    colHour: 'Ora',
    colSteps: 'Passi',
    colState: 'Stato',
    notesTitle: 'Ore senza misura completa',
  },
  week: {
    title: 'Ultimi 7 giorni',
    subtitle: (goal) => `Passi al giorno rispetto all’obiettivo di ${goal}.`,
    summary: (c, goal) => {
      const parts: string[] = [];
      parts.push(c.measured > 0 ? `${num(c.measured, 'giorno misurato', 'giorni misurati')}${c.zero > 0 ? `, di cui ${c.zero} con zero passi` : ''}` : 'nessun giorno misurato');
      if (c.partial > 0) parts.push(num(c.partial, 'giorno parziale', 'giorni parziali'));
      if (c.absent > 0) parts.push(num(c.absent, 'giorno senza dato', 'giorni senza dato'));
      const goalPart = c.measured + c.partial > 0 ? ` Obiettivo di ${goal} passi raggiunto ${c.goalDays === 0 ? 'in nessun giorno' : `in ${num(c.goalDays, 'giorno', 'giorni')}`}.` : '';
      return `Ultimi 7 giorni: ${parts.join('; ')}.${goalPart}`;
    },
    average: 'Media',
    averageOver: (n) => `su ${num(n, 'giorno misurato', 'giorni misurati')}`,
    averageNone: 'Media non disponibile',
    tableLabel: 'Tabella dei sette giorni',
    tableCaption: 'Passi degli ultimi sette giorni, con lo stato di ogni misura',
    colDay: 'Giorno',
    colSteps: 'Passi',
    colState: 'Stato',
    notesTitle: 'Giorni senza misura completa',
  },
  source: {
    title: 'Sorgente dei passi',
    rule: 'FitMesh sceglie una sola sorgente per i passi del giorno. Non somma più sorgenti insieme.',
    via: { health_connect: 'Health Connect', healthkit: 'Apple Salute', ble: 'Bluetooth' },
    kind: { watch: 'Orologio', phone: 'Telefono', ring: 'Anello' },
    notAdded: (names) => `${names}: ha passi per lo stesso giorno, ma non vengono aggiunti al totale.`,
    noSourceBody: 'Senza un dispositivo collegato non c’è una sorgente da indicare per i passi.',
    connect: 'Collega un dispositivo',
  },
};

const EN: ActivityCopy = {
  hero: {
    title: 'Steps',
    goalOf: (pct, goal) => `${pct} of the ${goal} steps goal`,
    goalPartial: {
      window_open: (pct, goal) => `${pct} of the ${goal} steps goal, with the day still in progress`,
      incomplete_coverage: (pct, goal) => `${pct} of the ${goal} steps goal, calculated on the steps received`,
    },
    goalMet: 'Steps goal reached',
    remaining: (n) => `${n} steps to go`,
    goalAbsent: (goal) => `Goal: ${goal} steps. Progress cannot be worked out without step data.`,
  },
  tiles: {
    aria: 'Other measures for the day',
    distance: 'Distance',
    floors: 'Floors climbed',
    caloriesActive: 'Active calories',
  },
  hourly: {
    title: 'Steps by hour',
    subtitle: (c) => {
      const parts: string[] = [];
      if (c.measured > 0) parts.push(`${num(c.measured, 'hour measured', 'hours measured')}${c.zero > 0 ? `, ${c.zero} at zero steps` : ''}`);
      if (c.partial > 0) parts.push(num(c.partial, 'hour partial', 'hours partial'));
      if (c.absent > 0) parts.push(num(c.absent, 'hour with no data', 'hours with no data'));
      return parts.length > 0 ? parts.join('; ') : 'No hour measured';
    },
    summary: (c, peak) => {
      const parts: string[] = [];
      parts.push(c.measured > 0 ? `${num(c.measured, 'hour measured', 'hours measured')}${c.zero > 0 ? `, of which ${c.zero} at zero steps` : ''}` : 'no hour measured');
      if (c.partial > 0) parts.push(num(c.partial, 'partial hour', 'partial hours'));
      if (c.absent > 0) parts.push(num(c.absent, 'hour with no data', 'hours with no data'));
      return `Steps by hour: ${parts.join('; ')}.${peak ? ` Most active hour: ${peak.hour}, ${peak.steps} steps.` : ''}`;
    },
    yAxis: 'Steps in the hour',
    tableLabel: 'Hourly data table',
    tableCaption: 'Steps for each hour of the day, with the state of every measure',
    colHour: 'Hour',
    colSteps: 'Steps',
    colState: 'State',
    notesTitle: 'Hours without a complete measure',
  },
  week: {
    title: 'Last 7 days',
    subtitle: (goal) => `Steps per day against the goal of ${goal}.`,
    summary: (c, goal) => {
      const parts: string[] = [];
      parts.push(c.measured > 0 ? `${num(c.measured, 'day measured', 'days measured')}${c.zero > 0 ? `, of which ${c.zero} at zero steps` : ''}` : 'no day measured');
      if (c.partial > 0) parts.push(num(c.partial, 'partial day', 'partial days'));
      if (c.absent > 0) parts.push(num(c.absent, 'day with no data', 'days with no data'));
      const goalPart = c.measured + c.partial > 0 ? ` Goal of ${goal} steps reached ${c.goalDays === 0 ? 'on none of the days' : `on ${num(c.goalDays, 'day', 'days')}`}.` : '';
      return `Last 7 days: ${parts.join('; ')}.${goalPart}`;
    },
    average: 'Average',
    averageOver: (n) => `over ${num(n, 'measured day', 'measured days')}`,
    averageNone: 'Average not available',
    tableLabel: 'Seven-day table',
    tableCaption: 'Steps for the last seven days, with the state of every measure',
    colDay: 'Day',
    colSteps: 'Steps',
    colState: 'State',
    notesTitle: 'Days without a complete measure',
  },
  source: {
    title: 'Source of the steps',
    rule: 'FitMesh picks one source for the steps of the day. It does not add sources together.',
    via: { health_connect: 'Health Connect', healthkit: 'Apple Health', ble: 'Bluetooth' },
    kind: { watch: 'Watch', phone: 'Phone', ring: 'Ring' },
    notAdded: (names) => `${names}: has steps for the same day, but they are not added to the total.`,
    noSourceBody: 'Without a connected device there is no source to name for the steps.',
    connect: 'Connect a device',
  },
};

export function activityCopy(l: UiLocale): ActivityCopy {
  return l === 'it' ? IT : EN;
}
