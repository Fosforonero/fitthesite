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
import type { Workout, WorkoutsDay } from '@/lib/web-dashboard/model';

import type { WeekCounts } from '../WorkoutsScreen.copy';

// ── elenco delle sessioni ───────────────────────────────────────────────────
/**
 * Le due affermazioni possibili sull'elenco, e non si scambiano mai:
 *  - `sessions`: ci sono sessioni (l'elenco puo' essere parziale);
 *  - `absent`: non sappiamo se ce ne sono state.
 *
 * NON esiste «nessun allenamento, misurato»: il server non ha un campo che provi
 * di aver letto e di non aver trovato nulla. Una lista vuota, da qualunque parte
 * arrivi, e' ASSENTE («nessun campione»), mai uno zero.
 */
export type ListState =
  | { kind: 'sessions'; sessions: Workout[]; partial: null | { coverage: number; note: PartialNote } }
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
  // Nessuna riga, nessuno zero: un elenco vuoto e' assente.
  if (sessions.value.length === 0) return { kind: 'absent', reason: 'no_samples' };
  if (sessions.kind === 'partial') {
    return { kind: 'sessions', sessions: sortByStart(sessions.value), partial: { coverage: sessions.coverage, note: sessions.note } };
  }
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
  const list = st.sessions;
  const durations = list.map((w) => w.durationMin);
  const kcals = list.map((w) => w.caloriesKcal);
  const count = st.partial ? partial(list.length, st.partial.coverage, st.partial.note) : value(list.length);
  return {
    count,
    duration: inheritListCoverage(sumMeasures(durations), st.partial),
    calories: inheritListCoverage(sumMeasures(kcals), st.partial),
    durationCover: coverOf(durations),
    caloriesCover: coverOf(kcals),
  };
}

// ── ultimi 7 giorni: durata e numero di allenamenti ─────────────────────────
export type SlotState = 'measured' | 'measured-zero' | 'partial' | 'absent';

export interface WeekDay {
  /** YYYY-MM-DD. */
  date: string;
  index: number;
  selected: boolean;
  /** Stato della DURATA: e' la serie disegnata. */
  state: SlotState;
  /** `null` solo per l'assente: mai 0 al posto di «manca». */
  value: number | null;
  coverage: number | null;
  note: PartialNote | null;
  reason: AbsentReason | null;
  /** Numero di allenamenti ricevuti: `null` se il giorno non ha righe. Mai 0. */
  count: number | null;
  /**
   * Il giorno HA righe (count diverso da null) ma nessuna porta una durata: la durata e'
   * assente per «durata non ricevuta», che non e' «nessuna riga» e non si unisce ai giorni senza righe.
   */
  durationNotReceived: boolean;
}

/**
 * I sette giorni che finiscono nel giorno mostrato, dal modello (che li ha
 * derivati dalle sole righe di `workouts`). Un giorno che il modello non
 * contiene e' ASSENTE («nessun campione»), non zero.
 */
export function workoutsWeek(day: WorkoutsDay, selected: string): WeekDay[] {
  return day.week.map((w, index) => {
    const p = presentNumber(w.durationMin);
    const c = presentNumber(w.count);
    const count = c.state === 'absent' ? null : c.value;
    const base = { date: w.date, index, selected: w.date === selected, count, durationNotReceived: p.state === 'absent' && count !== null };
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
 * Totale dei soli giorni con durata COMPLETA (zero compresi): gli assenti non
 * contano come zero e i parziali non abbassano il totale con una somma
 * incompleta. `null` se non c'e' nessun giorno completo.
 */
export function totalOfMeasuredDays(days: readonly WeekDay[]): { total: number; n: number } | null {
  const ok = days.filter((d) => (d.state === 'measured' || d.state === 'measured-zero') && d.value !== null);
  if (ok.length === 0) return null;
  return { total: ok.reduce((s, d) => s + (d.value ?? 0), 0), n: ok.length };
}

export function maxOfPresent(days: readonly WeekDay[]): number {
  return days.reduce((m, d) => (d.value !== null && d.value > m ? d.value : m), 0);
}

export interface AbsentRun {
  from: number;
  to: number;
  reason: AbsentReason;
  /** Giorni con righe ma senza durata: nota distinta («durata non ricevuta»), mai uniti ai giorni senza righe. */
  durationNotReceived: boolean;
}

/**
 * Giorni assenti consecutivi con lo stesso motivo: si disegnano come UN
 * riquadro tratteggiato, non come sette barre a zero. Un giorno che ha righe ma
 * nessuna durata non si unisce ai giorni senza righe, anche con lo stesso motivo.
 */
export function absentRuns(days: readonly WeekDay[]): AbsentRun[] {
  const runs: AbsentRun[] = [];
  for (const d of days) {
    if (d.state !== 'absent' || d.reason === null) continue;
    const last = runs[runs.length - 1];
    if (last && last.to === d.index - 1 && last.reason === d.reason && last.durationNotReceived === d.durationNotReceived) last.to = d.index;
    else runs.push({ from: d.index, to: d.index, reason: d.reason, durationNotReceived: d.durationNotReceived });
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
