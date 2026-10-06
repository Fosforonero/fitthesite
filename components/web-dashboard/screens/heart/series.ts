/**
 * Lettura della serie cardiaca del giorno: solo logica pura, nessun JSX.
 *
 * La serie arriva come 144 finestre da 10 minuti (`bpm: null` = nessun campione).
 * Qui si decide, in un punto solo, cosa e' un campione, cosa e' un buco e cosa
 * e' un'ora non ancora trascorsa: il grafico, la barra di copertura e la tabella
 * leggono tutti da `analyzeSeries`, cosi' non possono raccontare tre storie
 * diverse.
 *
 * Regola centrale: un buco NON e' 0 bpm e NON viene attraversato da una linea.
 * Ogni campione mancante spezza il tracciato in segmenti separati.
 */
import { TZ } from '@/lib/web-dashboard/format';
import { numberOrNull, type AbsentReason, type Measure, type PartialNote } from '@/lib/web-dashboard/measure';
import type { HeartPoint, Workout, WorkoutType } from '@/lib/web-dashboard/model';
import { SYNTHETIC_NOW, SYNTHETIC_TODAY } from '@/lib/web-dashboard/synthetic';

export const BUCKET_MIN = 10;
export const BUCKETS = 144;
export const SLOTS_PER_HOUR = 6;
export const DAY_MIN = 1440;

/** value = c'e' un campione; gap = la finestra e' trascorsa ma nessun campione; future = non e' ancora arrivata. */
export type SlotState = 'value' | 'gap' | 'future';

export interface Slot {
  index: number;
  /** Minuto di inizio della finestra (0-1430). */
  startMin: number;
  state: SlotState;
  bpm: number | null;
}

export interface Run {
  state: SlotState;
  fromMin: number;
  /** Fine esclusiva, in minuti. */
  toMin: number;
}

export interface SegmentPoint {
  /** Centro della finestra: il campione descrive i 10 minuti, non il loro primo istante. */
  minute: number;
  bpm: number;
}

export interface SeriesAnalysis {
  slots: Slot[];
  /** Finestre che avrebbero dovuto avere un campione: 144, o solo quelle trascorse se il giorno e' in corso. */
  expected: number;
  samples: number;
  coveredMin: number;
  /** 0-1 su `expected` (0 se non c'e' nulla di atteso). */
  coverage: number;
  runs: Run[];
  gaps: Run[];
  /** Minuto da cui il giorno non e' ancora trascorso, `null` per un giorno concluso. */
  futureFromMin: number | null;
  segments: SegmentPoint[][];
  min: number | null;
  max: number | null;
}

// ── orario ──────────────────────────────────────────────────────────────────

function partsInTz(iso: string) {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minute: Number(p.hour) * 60 + Number(p.minute) };
}

/** Giorno (YYYY-MM-DD) e minuto del giorno di un istante ISO, nel fuso dell'anteprima. */
export const localDate = (iso: string) => partsInTz(iso).date;
export const minuteOfDay = (iso: string) => partsInTz(iso).minute;

export function hhmm(minute: number): string {
  const m = Math.max(0, Math.min(DAY_MIN, Math.round(minute)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * Minuto «adesso» se il giorno mostrato e' quello in corso, altrimenti `null`.
 * Le ore successive non sono buchi: non sono ancora arrivate, e la differenza si vede.
 */
export function nowMinuteFor(date: string): number | null {
  return date === SYNTHETIC_TODAY ? minuteOfDay(SYNTHETIC_NOW) : null;
}

// ── serie ───────────────────────────────────────────────────────────────────

export function analyzeSeries(series: readonly HeartPoint[], nowMinute: number | null): SeriesAnalysis {
  // 144 caselle fisse: una serie con punti mancanti, doppi o fuori ordine non sposta nulla.
  const raw: Array<number | null> = Array.from({ length: BUCKETS }, () => null);
  for (const p of series) {
    const i = Math.floor(p.minute / BUCKET_MIN);
    if (i < 0 || i >= BUCKETS) continue;
    if (raw[i] === null && p.bpm !== null && Number.isFinite(p.bpm)) raw[i] = p.bpm;
  }

  const elapsed = nowMinute === null ? BUCKETS : Math.min(BUCKETS, Math.max(0, Math.ceil(nowMinute / BUCKET_MIN)));
  const slots: Slot[] = raw.map((bpm, index) => {
    const startMin = index * BUCKET_MIN;
    // Un campione «nel futuro» non puo' esistere: si scarta invece di disegnarlo.
    if (index >= elapsed) return { index, startMin, state: 'future', bpm: null };
    return bpm === null ? { index, startMin, state: 'gap', bpm: null } : { index, startMin, state: 'value', bpm };
  });

  const runs: Run[] = [];
  for (const s of slots) {
    const last = runs[runs.length - 1];
    if (last && last.state === s.state) last.toMin = s.startMin + BUCKET_MIN;
    else runs.push({ state: s.state, fromMin: s.startMin, toMin: s.startMin + BUCKET_MIN });
  }

  const segments: SegmentPoint[][] = [];
  let current: SegmentPoint[] | null = null;
  for (const s of slots) {
    if (s.state === 'value') {
      if (!current) {
        current = [];
        segments.push(current);
      }
      current.push({ minute: s.startMin + BUCKET_MIN / 2, bpm: s.bpm as number });
    } else {
      current = null; // ogni buco (e ogni ora futura) chiude il segmento
    }
  }

  const known = slots.filter((s) => s.state === 'value').map((s) => s.bpm as number);
  const samples = known.length;
  return {
    slots,
    expected: elapsed,
    samples,
    coveredMin: samples * BUCKET_MIN,
    coverage: elapsed > 0 ? samples / elapsed : 0,
    runs,
    gaps: runs.filter((r) => r.state === 'gap'),
    futureFromMin: elapsed < BUCKETS ? elapsed * BUCKET_MIN : null,
    segments,
    min: samples ? Math.min(...known) : null,
    max: samples ? Math.max(...known) : null,
  };
}

// ── asse verticale ──────────────────────────────────────────────────────────

export interface Axis {
  lo: number;
  hi: number;
  span: number;
  ticks: number[];
}

/**
 * Asse dei bpm da un minimo a un massimo sensati: mai forzato a zero (una
 * frequenza a riposo di 55 schiacciata in fondo a un asse 0-140 non si legge),
 * con un margine e tacche a passo regolare.
 */
export function niceAxis(values: readonly number[]): Axis {
  const finite = values.filter((v) => Number.isFinite(v));
  const min = finite.length ? Math.min(...finite) : 50;
  const max = finite.length ? Math.max(...finite) : 100;
  let lo = min - 4;
  let hi = max + 4;
  if (hi - lo < 40) {
    const mid = (hi + lo) / 2;
    lo = mid - 20;
    hi = mid + 20;
  }
  const raw = hi - lo;
  const step = raw <= 50 ? 10 : raw <= 110 ? 20 : 40;
  lo = Math.max(0, Math.floor(lo / step) * step);
  hi = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += step) ticks.push(t);
  return { lo, hi, span: hi - lo, ticks };
}

// ── tabella per ora ─────────────────────────────────────────────────────────

export interface HourRow {
  hour: number;
  state: 'measured' | 'partial' | 'absent';
  /** Solo per `absent`: nessun campione oppure ora non ancora trascorsa. */
  reason: 'no_samples' | 'not_yet' | null;
  samples: number;
  expected: number;
  min: number | null;
  avg: number | null;
  max: number | null;
}

export function hourRows(slots: readonly Slot[]): HourRow[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const inHour = slots.slice(hour * SLOTS_PER_HOUR, (hour + 1) * SLOTS_PER_HOUR);
    const expected = inHour.filter((s) => s.state !== 'future').length;
    const values = inHour.filter((s) => s.state === 'value').map((s) => s.bpm as number);
    if (expected === 0) {
      return { hour, state: 'absent', reason: 'not_yet', samples: 0, expected: 0, min: null, avg: null, max: null };
    }
    if (values.length === 0) {
      return { hour, state: 'absent', reason: 'no_samples', samples: 0, expected, min: null, avg: null, max: null };
    }
    return {
      hour,
      state: values.length < expected ? 'partial' : 'measured',
      reason: null,
      samples: values.length,
      expected,
      min: Math.min(...values),
      avg: values.reduce((s, n) => s + n, 0) / values.length,
      max: Math.max(...values),
    };
  });
}

// ── allenamenti sul grafico ─────────────────────────────────────────────────

export interface WorkoutWindow {
  id: string;
  /** Il tipo (colonna `type`), mai il titolo libero: non e' in whitelist. */
  type: WorkoutType;
  startMin: number;
  /** `null` se la durata non c'e': senza durata non si disegna una finestra inventata. */
  endMin: number | null;
  duration: Measure<number>;
}

export type WorkoutOverlay =
  | { kind: 'absent'; reason: AbsentReason }
  | { kind: 'list'; windows: WorkoutWindow[]; partial: PartialNote | null };

export function workoutOverlay(sessions: Measure<Workout[]>, date: string, nowMinute: number | null): WorkoutOverlay {
  if (sessions.kind === 'absent') return { kind: 'absent', reason: sessions.reason };
  // Nessuna riga non e' «nessun allenamento»: senza righe il server non prova nulla.
  if (sessions.value.length === 0) return { kind: 'absent', reason: 'no_samples' };
  const windows: WorkoutWindow[] = [];
  for (const w of sessions.value) {
    // un allenamento di un altro giorno non sta su questo asse
    if (localDate(w.startedAt) !== date) continue;
    const startMin = minuteOfDay(w.startedAt);
    // oggi, un allenamento che comincia dopo «adesso» non e' ancora avvenuto: non sta sull'asse
    if (nowMinute !== null && startMin >= nowMinute) continue;
    const dur = numberOrNull(w.durationMin);
    windows.push({
      id: w.id,
      type: w.type,
      startMin,
      endMin: dur === null ? null : Math.min(nowMinute ?? DAY_MIN, startMin + dur),
      duration: w.durationMin,
    });
  }
  windows.sort((a, b) => a.startMin - b.startMin);
  return { kind: 'list', windows, partial: sessions.kind === 'partial' ? sessions.note : null };
}
