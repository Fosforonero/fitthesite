/**
 * Derivazioni pure della Panoramica: nessun JSX, nessun testo.
 *
 * Tutte rispettano la stessa regola: una misura assente NON diventa mai 0, non
 * entra nelle medie e non viene unita ai vicini. Vivono qui (e non nei
 * componenti) perche' i test possono verificarle senza passare dal DOM.
 */
import { partial, type AbsentReason, type Measure, type PartialNote } from '@/lib/web-dashboard/measure';
import type { DashboardData, TrendMetric, TrendPoint } from '@/lib/web-dashboard/model';

import type { MissingMetric } from '../OverviewScreen.copy';

export type SlotState = 'value' | 'zero' | 'partial' | 'absent';

/** Lo stato di uno slot di un grafico. Un parziale resta parziale anche se vale 0. */
export function slotState(m: Measure<number>): SlotState {
  if (m.kind === 'absent') return 'absent';
  if (m.kind === 'partial') return 'partial';
  return m.value === 0 ? 'zero' : 'value';
}

/** Gli stati come li chiama MeasureValue (data-measure-state): un solo vocabolario per DOM e test. */
export const MEASURE_STATE: Record<SlotState, 'measured' | 'measured-zero' | 'partial' | 'absent'> = {
  value: 'measured',
  zero: 'measured-zero',
  partial: 'partial',
  absent: 'absent',
};

export interface SlotRun {
  from: number;
  to: number;
  state: 'absent' | 'partial';
  reason?: AbsentReason;
  note?: PartialNote;
}

/**
 * Tratti consecutivi NON pienamente misurati, con lo stesso stato e lo stesso
 * motivo. Serve a dire «dalle 13 alle 17: nessun campione» invece di cinque
 * righe identiche.
 */
export function unmeasuredRuns(slots: readonly Measure<number>[]): SlotRun[] {
  const runs: SlotRun[] = [];
  slots.forEach((m, i) => {
    if (m.kind === 'value') return;
    const state = m.kind;
    const reason = m.kind === 'absent' ? m.reason : undefined;
    const note = m.kind === 'partial' ? m.note : undefined;
    const last = runs[runs.length - 1];
    if (last && last.to === i - 1 && last.state === state && last.reason === reason && last.note === note) {
      last.to = i;
    } else {
      runs.push({ from: i, to: i, state, reason, note });
    }
  });
  return runs;
}

export function countSlots(slots: readonly Measure<number>[]) {
  const c = { value: 0, zero: 0, partial: 0, absent: 0 };
  for (const m of slots) c[slotState(m)] += 1;
  return c;
}

/** L'ora con piu' passi fra quelle misurate o parziali (le assenti non competono). */
export function peakSlot(slots: readonly Measure<number>[]): { hour: number; steps: number } | null {
  let best: { hour: number; steps: number } | null = null;
  slots.forEach((m, hour) => {
    if (m.kind === 'absent' || m.value <= 0) return;
    if (!best || m.value > best.steps) best = { hour, steps: m.value };
  });
  return best;
}

// ── ultimi 7 giorni ─────────────────────────────────────────────────────────
export type WeekMetric = Extract<TrendMetric, 'steps' | 'sleepMinutes' | 'restingHr'>;

/**
 * Gli ultimi `n` giorni di una serie, l'ultimo e' il giorno mostrato.
 *
 * Il punto del giorno mostrato viene SOSTITUITO con la misura del giorno stesso
 * (quella della tessera KPI): una serie e una tessera che dicono due numeri per
 * lo stesso giorno sono un errore di lettura, non di dato. Nei dati reali le due
 * cose coincidono; nel generatore sintetico sono estratte a parte.
 */
export function weekSeries(data: DashboardData, metric: WeekMetric, n = 7): TrendPoint[] {
  const series = data.trends.find((t) => t.metric === metric);
  const days = (series?.days ?? []).filter((d) => d.date <= data.date).slice(-n);
  const own = dayMeasure(data, metric);
  return days.map((d) => (d.date === data.date ? { ...d, m: own } : d));
}

function dayMeasure(data: DashboardData, metric: WeekMetric): Measure<number> {
  if (metric === 'steps') return data.activity.steps;
  if (metric === 'restingHr') return data.heart.resting;
  return sleepTotal(data);
}

/**
 * Durata del sonno come misura sola. Notte assente = assente (con il suo
 * motivo, mai «0 ore»); notte parziale = totale parziale, non un totale pieno.
 */
export function sleepTotal(data: DashboardData): Measure<number> {
  const night = data.sleep.night;
  if (night.kind === 'absent') return night;
  const total = night.value.totalMinutes;
  if (night.kind === 'partial' && total.kind === 'value') return partial(total.value, night.coverage, night.note);
  return total;
}

export interface WeekStats {
  total: number;
  measured: number;
  partial: number;
  absent: number;
  zero: number;
  /** Media dei soli giorni MISURATI (zero incluso: e' un dato). I parziali non entrano: sono minimi. */
  mean: number | null;
  /** Estremi dei giorni misurati diversi da zero. */
  lo: number | null;
  hi: number | null;
  absentReasons: AbsentReason[];
}

export function weekStats(points: readonly TrendPoint[]): WeekStats {
  const measured = points.filter((p) => p.m.kind === 'value');
  const values = measured.map((p) => (p.m as { value: number }).value);
  const nonZero = values.filter((v) => v !== 0);
  const absentReasons = [
    ...new Set(points.flatMap((p) => (p.m.kind === 'absent' ? [p.m.reason] : []))),
  ];
  return {
    total: points.length,
    measured: measured.length,
    partial: points.filter((p) => p.m.kind === 'partial').length,
    absent: points.filter((p) => p.m.kind === 'absent').length,
    zero: values.filter((v) => v === 0).length,
    mean: values.length ? values.reduce((s, v) => s + v, 0) / values.length : null,
    lo: nonZero.length ? Math.min(...nonZero) : null,
    hi: nonZero.length ? Math.max(...nonZero) : null,
    absentReasons,
  };
}

/**
 * Segmenti di linea: solo punti CONSECUTIVI con dato. Un buco spezza la linea,
 * e un punto isolato resta un punto. Ritorna gli indici degli slot.
 */
export function lineSegments(points: readonly TrendPoint[]): number[][] {
  const segments: number[][] = [];
  let current: number[] = [];
  points.forEach((p, i) => {
    // assente = buco; zero misurato = tacca a parte, non un punto della linea
    const drawable = p.m.kind !== 'absent' && p.m.value !== 0;
    if (drawable) {
      current.push(i);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length) segments.push(current);
  return segments;
}

// ── cosa manca ──────────────────────────────────────────────────────────────
export type MissingKind = 'absent' | 'partial' | 'zero';

export interface MissingItem {
  metric: MissingMetric;
  /** Quante ore (solo `hourlySteps`). */
  count?: number;
  /** Copertura 0..1 (solo parziali). */
  coverage?: number;
  /** Lo zero misurato di una lista vuota («nessun allenamento»). */
  none?: boolean;
}

export interface MissingGroup {
  id: string;
  kind: MissingKind;
  reason?: AbsentReason;
  note?: PartialNote;
  items: MissingItem[];
}

const KIND_ORDER: Record<MissingKind, number> = { absent: 0, partial: 1, zero: 2 };

/**
 * Ogni misura assente o parziale del giorno mostrato, raggruppata per motivo.
 * In fondo, a parte, gli zeri misurati: non mancano, ma e' li' che un lettore
 * non esperto capisce la differenza.
 *
 * Non entrano: gli zeri orari dei passi (di notte sono attesi e sarebbero
 * rumore), i buchi della serie del battito (non e' mostrata in questa pagina e
 * la media parziale li segnala gia'), i campi interni dei singoli allenamenti.
 */
export function collectMissing(data: DashboardData): MissingGroup[] {
  const groups = new Map<string, MissingGroup>();

  const put = (id: string, base: Omit<MissingGroup, 'id' | 'items'>, item: MissingItem) => {
    const g = groups.get(id) ?? { id, ...base, items: [] };
    g.items.push(item);
    groups.set(id, g);
  };

  const any = (metric: MissingMetric, m: Measure<unknown>, extra: Partial<MissingItem> = {}) => {
    if (m.kind === 'absent') {
      put(`absent:${m.reason}`, { kind: 'absent', reason: m.reason }, { metric, ...extra });
    } else if (m.kind === 'partial') {
      put(`partial:${m.note}`, { kind: 'partial', note: m.note }, { metric, coverage: m.coverage, ...extra });
    } else if (typeof m.value === 'number' && m.value === 0) {
      put('zero', { kind: 'zero' }, { metric });
    }
  };

  const a = data.activity;
  any('steps', a.steps);
  any('distance', a.distanceKm);
  any('activeMinutes', a.activeMinutes);
  any('floors', a.floors);
  any('caloriesActive', a.caloriesActive);

  // ore dei passi: un'unica voce per motivo, con il numero di ore
  const byReason = new Map<AbsentReason, number>();
  const byNote = new Map<PartialNote, number>();
  for (const h of a.hourlySteps) {
    if (h.kind === 'absent') byReason.set(h.reason, (byReason.get(h.reason) ?? 0) + 1);
    else if (h.kind === 'partial') byNote.set(h.note, (byNote.get(h.note) ?? 0) + 1);
  }
  byReason.forEach((count, reason) => put(`absent:${reason}`, { kind: 'absent', reason }, { metric: 'hourlySteps', count }));
  byNote.forEach((count, note) => put(`partial:${note}`, { kind: 'partial', note }, { metric: 'hourlySteps', count }));

  const night = data.sleep.night;
  if (night.kind === 'absent') {
    any('sleep', night);
  } else {
    if (night.kind === 'partial') any('sleep', night);
    any('sleepTotal', night.value.totalMinutes);
    // «fasi» sono due campi dello stesso fatto: una voce sola
    any('sleepStages', night.value.stages.kind !== 'value' ? night.value.stages : night.value.stageMinutes);
  }

  const h = data.heart;
  any('restingHr', h.resting);
  any('avgHr', h.average);
  any('minHr', h.min);
  any('maxHr', h.max);
  any('hrv', h.hrvMs);

  const sessions = data.workouts.sessions;
  if (sessions.kind === 'absent' || sessions.kind === 'partial') {
    any('workouts', sessions);
  } else if (sessions.value.length === 0) {
    put('zero', { kind: 'zero' }, { metric: 'workouts', none: true });
  }

  return [...groups.values()].sort((x, y) => KIND_ORDER[x.kind] - KIND_ORDER[y.kind]);
}
