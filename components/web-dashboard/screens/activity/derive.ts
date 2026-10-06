/**
 * Derivazioni pure per la schermata «Passi e attivita'»: nessun JSX, cosi' le
 * regole su zero / parziale / assente stanno in un posto solo e si provano
 * senza rendere niente.
 *
 * Regola di fondo: un valore assente non diventa mai 0 e non entra in nessuna
 * somma o media. Ogni funzione qui restituisce lo stato, non solo il numero.
 */
import { absent, presentNumber, type AbsentReason, type Measure, type PartialNote } from '@/lib/web-dashboard/measure';
import type { DashboardData } from '@/lib/web-dashboard/model';
import { addDays } from '@/lib/web-dashboard/synthetic';

export type SlotState = 'measured' | 'measured-zero' | 'partial' | 'absent';

/** Uno slot (un'ora o un giorno) letto attraverso `presentNumber`: un solo punto decide lo stato. */
export interface Slot {
  index: number;
  state: SlotState;
  /** `null` solo per l'assente: mai 0 al posto di «manca». */
  value: number | null;
  coverage: number | null;
  note: PartialNote | null;
  reason: AbsentReason | null;
}

export function toSlot(m: Measure<number>, index: number): Slot {
  const p = presentNumber(m);
  if (p.state === 'absent') return { index, state: 'absent', value: null, coverage: null, note: null, reason: p.reason };
  if (p.state === 'partial') return { index, state: 'partial', value: p.value, coverage: p.coverage, note: p.note, reason: null };
  return { index, state: p.state, value: p.value, coverage: null, note: null, reason: null };
}

/**
 * Sempre 24 slot. Se il dato ne consegna meno, quelli che mancano sono assenti
 * («nessun campione»), non zero: un buco nella lista non e' un'ora ferma.
 */
export function toHourSlots(hourly: readonly Measure<number>[]): Slot[] {
  return Array.from({ length: 24 }, (_, h) => toSlot(hourly[h] ?? absent('no_samples'), h));
}

export interface SlotCounts {
  /** Misurati, zero compresi. */
  measured: number;
  zero: number;
  partial: number;
  absent: number;
}

export function countSlots(slots: readonly Slot[]): SlotCounts {
  return {
    measured: slots.filter((s) => s.state === 'measured' || s.state === 'measured-zero').length,
    zero: slots.filter((s) => s.state === 'measured-zero').length,
    partial: slots.filter((s) => s.state === 'partial').length,
    absent: slots.filter((s) => s.state === 'absent').length,
  };
}

/** Il valore piu' alto fra gli slot che hanno un dato (misurato o parziale). 0 se non ce n'e'. */
export function maxOfPresent(slots: readonly Slot[]): number {
  return slots.reduce((m, s) => (s.value !== null && s.value > m ? s.value : m), 0);
}

export function peakSlot(slots: readonly Slot[]): Slot | null {
  let best: Slot | null = null;
  for (const s of slots) if (s.value !== null && s.value > 0 && (best === null || s.value > (best.value ?? 0))) best = s;
  return best;
}

export interface AbsentRun {
  from: number;
  to: number;
  reason: AbsentReason;
}

/**
 * Tratti consecutivi di slot assenti con lo stesso motivo: si disegnano come UN
 * riquadro tratteggiato, non come una serie di barre a zero e non come una
 * linea che scavalca il buco.
 */
export function absentRuns(slots: readonly Slot[]): AbsentRun[] {
  const runs: AbsentRun[] = [];
  for (const s of slots) {
    if (s.state !== 'absent' || s.reason === null) continue;
    const last = runs[runs.length - 1];
    if (last && last.reason === s.reason && last.to === s.index - 1) last.to = s.index;
    else runs.push({ from: s.index, to: s.index, reason: s.reason });
  }
  return runs;
}

/**
 * Asse Y con pochi tick «tondi». Il tetto e' il primo multiplo del passo che
 * contiene il massimo, non il doppio: niceMax di chart-kit salta da 3,3 a 5 e
 * lascia meta' grafico vuoto. Passi interi (i passi non hanno decimali).
 */
export function niceTicks(max: number, maxIntervals = 4): { top: number; ticks: number[] } {
  if (!(max > 0)) return { top: 0, ticks: [0] };
  for (let pow = 1; pow <= 1e9; pow *= 10) {
    for (const mult of [1, 2, 2.5, 5]) {
      const step = mult * pow;
      if (!Number.isInteger(step)) continue;
      const intervals = Math.ceil(max / step);
      if (intervals <= maxIntervals) {
        return { top: intervals * step, ticks: Array.from({ length: intervals + 1 }, (_, i) => i * step) };
      }
    }
  }
  return { top: max, ticks: [0, max] };
}

// ── ultimi sette giorni ─────────────────────────────────────────────────────
export interface WeekDay {
  date: string;
  m: Measure<number>;
  slot: Slot;
  selected: boolean;
}

/**
 * I sette giorni che finiscono nel giorno mostrato. Per il giorno mostrato vale
 * il dato del dettaglio (lo stesso numero dell'eroe): due cifre diverse per lo
 * stesso giorno nella stessa schermata sarebbero un errore, non un dato. I
 * giorni che la serie non consegna sono assenti, non zero.
 */
export function lastSevenDays(data: DashboardData): WeekDay[] {
  const series = data.trends.find((t) => t.metric === 'steps');
  const byDate = new Map((series?.days ?? []).map((d) => [d.date, d.m] as const));
  return Array.from({ length: 7 }, (_, k) => {
    const back = 6 - k;
    const date = addDays(data.date, -back);
    const selected = back === 0;
    const m = selected ? data.activity.steps : (byDate.get(date) ?? absent('no_samples'));
    return { date, m, slot: toSlot(m, k), selected };
  });
}

/** Media dei soli giorni MISURATI (zero compreso: uno zero vero pesa). Parziali e assenti restano fuori. */
export function meanOfMeasuredDays(days: readonly WeekDay[]): { mean: number; n: number } | null {
  const vals = days.filter((d) => d.m.kind === 'value').map((d) => (d.m as { value: number }).value);
  if (vals.length === 0) return null;
  return { mean: vals.reduce((s, v) => s + v, 0) / vals.length, n: vals.length };
}

/** Giorni in cui i passi gia' registrati raggiungono l'obiettivo (un parziale sopra soglia lo raggiunge davvero). */
export function goalDays(days: readonly WeekDay[], goal: number): number {
  return days.filter((d) => d.slot.value !== null && d.slot.value >= goal).length;
}

export const hh = (h: number) => String(h).padStart(2, '0');
