/**
 * Derivazioni pure per la schermata «Allenamenti»: nessun JSX, cosi' le regole
 * su zero / parziale / assente stanno in un posto solo e si provano senza
 * rendere niente.
 *
 * Regola di fondo: un valore assente non diventa mai 0 e non entra in nessuna
 * somma o media. Ogni funzione restituisce lo stato, non solo il numero.
 */
import {
  absent,
  partial,
  presentNumber,
  sumMeasures,
  value,
  type AbsentReason,
  type Measure,
  type PartialNote,
} from '@/lib/web-dashboard/measure';
import type { DashboardData, Workout } from '@/lib/web-dashboard/model';
import { addDays } from '@/lib/web-dashboard/synthetic';

import type { WeekCounts } from '../WorkoutsScreen.copy';

// ── elenco delle sessioni ───────────────────────────────────────────────────
/**
 * Le tre affermazioni possibili sull'elenco, e non si scambiano mai:
 *  - `sessions`: ci sono sessioni (l'elenco puo' essere parziale);
 *  - `measured-empty`: la lettura e' riuscita e non c'e' nessuna sessione;
 *  - `absent`: non sappiamo se ce ne sono state.
 */
export type ListState =
  | { kind: 'sessions'; sessions: Workout[]; partial: null | { coverage: number; note: PartialNote } }
  | { kind: 'measured-empty' }
  | { kind: 'absent'; reason: AbsentReason };

const startMs = (w: Workout) => {
  const t = Date.parse(w.startedAt);
  return Number.isNaN(t) ? 0 : t;
};

/** In ordine di orario: la giornata si legge dall'alto verso il basso. */
export function sortByStart(list: readonly Workout[]): Workout[] {
  return [...list].sort((a, b) => startMs(a) - startMs(b));
}

export function listState(sessions: Measure<Workout[]>): ListState {
  if (sessions.kind === 'absent') return { kind: 'absent', reason: sessions.reason };
  if (sessions.kind === 'partial') {
    return { kind: 'sessions', sessions: sortByStart(sessions.value), partial: { coverage: sessions.coverage, note: sessions.note } };
  }
  // Lista vuota MISURATA: e' uno zero, non un buco.
  if (sessions.value.length === 0) return { kind: 'measured-empty' };
  return { kind: 'sessions', sessions: sortByStart(sessions.value), partial: null };
}

// ── riepilogo ───────────────────────────────────────────────────────────────
export interface Coverage {
  /** Sessioni che hanno il campo (misurato o parziale). */
  present: number;
  total: number;
}

export interface Summary {
  count: Measure<number>;
  duration: Measure<number>;
  calories: Measure<number>;
  /** Solo se alcune sessioni non hanno il campo: serve a dire «somma di 2 su 3». */
  durationCover: Coverage | null;
  caloriesCover: Coverage | null;
}

/** Se l'elenco e' parziale, nessun totale puo' essere pieno: eredita la copertura dell'elenco. */
function inheritListCoverage(m: Measure<number>, list: { coverage: number; note: PartialNote } | null): Measure<number> {
  if (!list || m.kind === 'absent') return m;
  if (m.kind === 'partial') return partial(m.value, Math.min(m.coverage, list.coverage), list.note);
  return partial(m.value, list.coverage, list.note);
}

function coverOf(items: readonly Measure<number>[]): Coverage | null {
  const present = items.filter((m) => m.kind !== 'absent').length;
  return present < items.length ? { present, total: items.length } : null;
}

export function summarize(sessions: Measure<Workout[]>): Summary {
  const st = listState(sessions);
  if (st.kind === 'absent') {
    const a = () => absent<number>(st.reason);
    return { count: a(), duration: a(), calories: a(), durationCover: null, caloriesCover: null };
  }
  if (st.kind === 'measured-empty') {
    // Zero sessioni misurate: zero sessioni, zero minuti e zero kcal sono tutti dati.
    return { count: value(0), duration: value(0), calories: value(0), durationCover: null, caloriesCover: null };
  }
  const list = st.sessions;
  const durations = list.map((w) => w.durationMin);
  const kcals = list.map((w) => w.caloriesKcal);
  // Elenco parziale ma vuoto: nessuna sessione nella parte letta, ma non e' uno zero pieno.
  const count = st.partial ? partial(list.length, st.partial.coverage, st.partial.note) : value(list.length);
  if (list.length === 0) {
    return { count, duration: inheritListCoverage(value(0), st.partial), calories: inheritListCoverage(value(0), st.partial), durationCover: null, caloriesCover: null };
  }
  return {
    count,
    duration: inheritListCoverage(sumMeasures(durations), st.partial),
    calories: inheritListCoverage(sumMeasures(kcals), st.partial),
    durationCover: coverOf(durations),
    caloriesCover: coverOf(kcals),
  };
}

// ── ultimi 7 giorni di minuti attivi ────────────────────────────────────────
export type SlotState = 'measured' | 'measured-zero' | 'partial' | 'absent';

export interface WeekDay {
  /** YYYY-MM-DD. */
  date: string;
  index: number;
  selected: boolean;
  state: SlotState;
  /** `null` solo per l'assente: mai 0 al posto di «manca». */
  value: number | null;
  coverage: number | null;
  note: PartialNote | null;
  reason: AbsentReason | null;
}

/**
 * I sette giorni che finiscono nel giorno mostrato. Un giorno che la serie non
 * contiene e' ASSENTE («nessun campione»), non zero.
 */
export function activeMinutesWeek(data: DashboardData): WeekDay[] {
  const series = data.trends.find((s) => s.metric === 'activeMinutes');
  const byDate = new Map((series?.days ?? []).map((p) => [p.date, p.m] as const));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(data.date, i - 6);
    const p = presentNumber(byDate.get(date) ?? absent('no_samples'));
    const base = { date, index: i, selected: date === data.date };
    if (p.state === 'absent') return { ...base, state: 'absent' as const, value: null, coverage: null, note: null, reason: p.reason };
    if (p.state === 'partial') return { ...base, state: 'partial' as const, value: p.value, coverage: p.coverage, note: p.note, reason: null };
    return { ...base, state: p.state, value: p.value, coverage: null, note: null, reason: null };
  });
}

export function countDays(days: readonly WeekDay[]): WeekCounts {
  return {
    measured: days.filter((d) => d.state === 'measured' || d.state === 'measured-zero').length,
    zero: days.filter((d) => d.state === 'measured-zero').length,
    partial: days.filter((d) => d.state === 'partial').length,
    absent: days.filter((d) => d.state === 'absent').length,
  };
}

/**
 * Media dei soli giorni MISURATI (zero compresi): gli assenti non diluiscono la
 * media e i parziali non la abbassano con un totale incompleto. `null` se non
 * c'e' nessun giorno misurato.
 */
export function meanOfMeasuredDays(days: readonly WeekDay[]): { mean: number; n: number } | null {
  const ok = days.filter((d) => (d.state === 'measured' || d.state === 'measured-zero') && d.value !== null);
  if (ok.length === 0) return null;
  return { mean: ok.reduce((s, d) => s + (d.value ?? 0), 0) / ok.length, n: ok.length };
}

export function maxOfPresent(days: readonly WeekDay[]): number {
  return days.reduce((m, d) => (d.value !== null && d.value > m ? d.value : m), 0);
}

export interface AbsentRun {
  from: number;
  to: number;
  reason: AbsentReason;
}

/**
 * Giorni assenti consecutivi con lo stesso motivo: si disegnano come UN
 * riquadro tratteggiato, non come sette barre a zero e non come una linea che
 * scavalca il buco.
 */
export function absentRuns(days: readonly WeekDay[]): AbsentRun[] {
  const runs: AbsentRun[] = [];
  for (const d of days) {
    if (d.state !== 'absent' || d.reason === null) continue;
    const last = runs[runs.length - 1];
    if (last && last.to === d.index - 1 && last.reason === d.reason) last.to = d.index;
    else runs.push({ from: d.index, to: d.index, reason: d.reason });
  }
  return runs;
}

// ── formato ─────────────────────────────────────────────────────────────────
/**
 * Durata senza l'unita' finale: «42», «1 h 03». L'unita' («min») la scrive
 * `MeasureValue` piccola accanto alla cifra, cosi' «1 h 42 min» non va a capo
 * dentro una scheda stretta.
 */
export function durationParts(minutes: number, locale: string): string {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return new Intl.NumberFormat(locale).format(m);
  return `${new Intl.NumberFormat(locale).format(h)} h ${String(m).padStart(2, '0')}`;
}
