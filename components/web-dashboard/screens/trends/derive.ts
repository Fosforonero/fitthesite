/**
 * Derivazioni pure della schermata Trend: nessun JSX, cosi' i test possono
 * confrontare il DOM con numeri calcolati da un'altra strada.
 *
 * Regola di fondo: un giorno assente NON e' un giorno a zero. Resta fuori da
 * medie, minimi e massimi, e si conta a parte. Un giorno parziale e' un valore
 * reale ma incompleto: entra nei conteggi, e dove pesa (min, max, media, totale)
 * la schermata lo dichiara.
 */
import {
  meanOfPresent,
  presentNumber,
  sumMeasures,
  type AbsentReason,
  type Measure,
  type PartialNote,
} from '@/lib/web-dashboard/measure';
import type { TrendPoint, TrendSeries } from '@/lib/web-dashboard/model';

/** Sotto questa soglia una linea o una serie di barre suggerisce un andamento che non c'e'. */
export const MIN_DAYS = 3;

export type SlotState = 'measured' | 'measured-zero' | 'partial' | 'absent';

export interface Slot {
  index: number;
  /** YYYY-MM-DD. */
  date: string;
  state: SlotState;
  /** `null` SOLO per l'assente: mai 0 al posto di «manca». */
  value: number | null;
  coverage: number | null;
  note: PartialNote | null;
  reason: AbsentReason | null;
}

/** Gli ultimi `range` giorni della serie (il piu' recente e' il giorno scelto). */
export function windowOf(series: TrendSeries | undefined, range: number): TrendPoint[] {
  return series ? series.days.slice(-range) : [];
}

export function toSlots(days: readonly TrendPoint[]): Slot[] {
  return days.map((d, index): Slot => {
    const p = presentNumber(d.m);
    if (p.state === 'absent') {
      return { index, date: d.date, state: 'absent', value: null, coverage: null, note: null, reason: p.reason };
    }
    if (p.state === 'partial') {
      return { index, date: d.date, state: 'partial', value: p.value, coverage: p.coverage, note: p.note, reason: null };
    }
    return { index, date: d.date, state: p.state, value: p.value, coverage: null, note: null, reason: null };
  });
}

export interface Extreme {
  value: number;
  date: string;
  state: Exclude<SlotState, 'absent'>;
  coverage: number | null;
  note: PartialNote | null;
}

export interface SeriesStats {
  /** Giorni della finestra (M). */
  total: number;
  /** Giorni con un dato, anche parziale (N). */
  withData: number;
  /** Giorni pieni (`value`, zero compreso): la base della copertura del totale. */
  complete: number;
  zeros: number;
  partials: number;
  absents: number;
  /** Media dei soli giorni con dato (`meanOfPresent`): `null` se non ce ne sono. */
  mean: number | null;
  min: Extreme | null;
  max: Extreme | null;
  /** Somma con la semantica di `sumMeasures`: parziale se manca anche un solo giorno. */
  sum: Measure<number>;
  absentReasons: Array<{ reason: AbsentReason; count: number }>;
  partialNotes: Array<{ note: PartialNote; count: number }>;
  /** Il motivo piu' frequente fra i giorni assenti (a parita', il piu' recente). */
  dominantReason: AbsentReason;
}

function tally<K extends string>(items: Array<{ key: K; index: number }>): Array<{ key: K; count: number; last: number }> {
  const map = new Map<K, { key: K; count: number; last: number }>();
  for (const it of items) {
    const cur = map.get(it.key);
    if (cur) {
      cur.count += 1;
      cur.last = Math.max(cur.last, it.index);
    } else {
      map.set(it.key, { key: it.key, count: 1, last: it.index });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.last - a.last);
}

export function statsOf(days: readonly TrendPoint[], slots: readonly Slot[]): SeriesStats {
  const present = slots.filter((s) => s.state !== 'absent');
  const measures = days.map((d) => d.m);

  let min: Extreme | null = null;
  let max: Extreme | null = null;
  for (const s of present) {
    const e: Extreme = { value: s.value as number, date: s.date, state: s.state as Extreme['state'], coverage: s.coverage, note: s.note };
    // a parita' vince il giorno piu' recente: e' quello che l'utente ricorda
    if (min === null || e.value <= min.value) min = e;
    if (max === null || e.value >= max.value) max = e;
  }

  const absentReasons = tally(slots.flatMap((s) => (s.reason ? [{ key: s.reason, index: s.index }] : [])));
  const partialNotes = tally(slots.flatMap((s) => (s.note ? [{ key: s.note, index: s.index }] : [])));

  return {
    total: slots.length,
    withData: present.length,
    complete: slots.filter((s) => s.state === 'measured' || s.state === 'measured-zero').length,
    zeros: slots.filter((s) => s.state === 'measured-zero').length,
    partials: slots.filter((s) => s.state === 'partial').length,
    absents: slots.length - present.length,
    mean: meanOfPresent(measures),
    min,
    max,
    sum: sumMeasures(measures),
    absentReasons: absentReasons.map((r) => ({ reason: r.key, count: r.count })),
    partialNotes: partialNotes.map((r) => ({ note: r.key, count: r.count })),
    dominantReason: absentReasons[0]?.key ?? 'no_samples',
  };
}

export interface Run {
  from: number;
  to: number;
  reason: AbsentReason;
}

/** Tratti consecutivi di giorni assenti con lo stesso motivo: un solo riquadro tratteggiato per tratto. */
export function absentRuns(slots: readonly Slot[]): Run[] {
  const runs: Run[] = [];
  for (const s of slots) {
    if (s.state !== 'absent' || !s.reason) continue;
    const last = runs[runs.length - 1];
    if (last && last.to === s.index - 1 && last.reason === s.reason) last.to = s.index;
    else runs.push({ from: s.index, to: s.index, reason: s.reason });
  }
  return runs;
}

export interface Segment {
  from: number;
  to: number;
  points: Slot[];
}

/**
 * Tratti della linea: giorni MISURATI consecutivi. Un buco spezza la linea; un
 * giorno parziale la spezza anch'esso (il suo valore copre solo una parte del
 * giorno: unirlo ai vicini disegnerebbe un calo che non e' avvenuto).
 */
export function lineSegments(slots: readonly Slot[]): Segment[] {
  const out: Segment[] = [];
  let cur: Slot[] = [];
  const flush = () => {
    if (cur.length > 0) out.push({ from: cur[0].index, to: cur[cur.length - 1].index, points: cur });
    cur = [];
  };
  for (const s of slots) {
    if (s.state === 'measured' || s.state === 'measured-zero') cur.push(s);
    else flush();
  }
  flush();
  return out;
}

// ── assi ────────────────────────────────────────────────────────────────────
export interface Axis {
  lo: number;
  hi: number;
  ticks: number[];
}

/** Il primo passo dell'elenco con al piu' `maxTicks` intervalli; oltre l'elenco, multipli dell'ultimo. */
export function pickStep(span: number, steps: readonly number[], maxTicks = 5): number {
  for (const s of steps) if (span / s <= maxTicks) return s;
  const last = steps[steps.length - 1];
  return last * Math.ceil(span / (last * maxTicks));
}

/** Asse delle barre: parte SEMPRE da zero, altrimenti l'altezza mentirebbe. */
export function barAxis(max: number, steps: readonly number[]): Axis {
  const step = pickStep(Math.max(max, 0), steps);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let v = step; v <= top + 1e-9; v += step) ticks.push(v);
  return { lo: 0, hi: top, ticks };
}

const LINE_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

/** Asse della linea: si adatta ai dati (non parte da zero) e la schermata lo dice. */
export function lineAxis(min: number, max: number): Axis {
  const span = max - min;
  const pad = Math.max(1, span * 0.1);
  const step = pickStep(span + 2 * pad, LINE_STEPS);
  const lo = Math.floor((min - pad) / step) * step;
  const hi = Math.ceil((max + pad) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
  return { lo, hi, ticks };
}

export const STEP_CANDIDATES: Record<'steps' | 'sleepMinutes' | 'activeMinutes', readonly number[]> = {
  steps: [1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000],
  sleepMinutes: [60, 120, 180, 240, 360, 480, 720],
  activeMinutes: [5, 10, 20, 25, 50, 100, 200],
};

/** Indici delle etichette dell'asse x: tutti a 7 giorni, altrimenti gli estremi e qualche tacca intermedia. */
export function labelIndexes(n: number): number[] {
  if (n <= 7) return Array.from({ length: n }, (_, i) => i);
  const k = n >= 60 ? 5 : 4;
  const set = new Set<number>();
  for (let i = 0; i < k; i++) set.add(Math.round((i * (n - 1)) / (k - 1)));
  return [...set];
}

/** Riferimento a una sola cifra decimale per etichette d'asse in ore: 120 -> 2, 90 -> 1,5 (gestito da chi formatta). */
export const minutesToHours = (min: number) => min / 60;
