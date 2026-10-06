/**
 * Funzioni pure della schermata Sonno: orari locali, geometria dell'ipnogramma,
 * classificazione delle notti. Nessun JSX qui, cosi' i test possono chiamarle.
 */
import { TZ } from '@/lib/web-dashboard/format';
import type { Measure } from '@/lib/web-dashboard/measure';
import type { SleepBlock, SleepStage } from '@/lib/web-dashboard/model';

import { CHART } from '../../primitives';

/** Ordine delle corsie dell'ipnogramma, dall'alto: come lo leggono tutte le app di sonno. */
export const STAGES: readonly SleepStage[] = ['awake', 'rem', 'light', 'deep'];

export const STAGE_COLOR: Record<SleepStage, string> = {
  awake: CHART.sleepAwake,
  rem: CHART.sleepRem,
  light: CHART.sleepLight,
  deep: CHART.sleepDeep,
};

// ── orari ───────────────────────────────────────────────────────────────────
// Formattazione propria (h23, fuso fisso): `hour12:false` di alcune lingue
// scrive «24:05» dopo mezzanotte, e una notte attraversa sempre la mezzanotte.
const PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export interface LocalParts {
  /** YYYY-MM-DD nel fuso dell'anteprima. */
  date: string;
  h: number;
  m: number;
}

export function localParts(iso: string): LocalParts {
  const o: Record<string, string> = {};
  for (const p of PARTS.formatToParts(new Date(iso))) o[p.type] = p.value;
  return { date: `${o.year}-${o.month}-${o.day}`, h: Number(o.hour) % 24, m: Number(o.minute) };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function hhmm(iso: string): string {
  const p = localParts(iso);
  return `${pad2(p.h)}:${pad2(p.m)}`;
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

/** Minuti fra due istanti ISO. */
export function minutesBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60_000);
}

/** «7 h 12» oppure «45 min»: compatto per le etichette sotto le barre (l'unita' e' nella tabella). */
export function fmtHM(min: number): string {
  const t = Math.round(min);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return h === 0 ? `${m} min` : `${h} h ${pad2(m)}`;
}

// ── ipnogramma ──────────────────────────────────────────────────────────────
export interface Gap {
  from: number;
  to: number;
}

export interface HypnogramLayout {
  /** Minuti coperti dall'asse: la durata della notte, mai meno dell'ultimo blocco. */
  span: number;
  /** Blocchi ordinati e contenuti in [0, span]. */
  blocks: SleepBlock[];
  /** Intervalli della notte per cui la fonte non da' nessuna fase: NON sono «sveglio». */
  gaps: Gap[];
  /** Minuti per fase, ricavati dai blocchi disegnati (coerenti con la figura). */
  minutesByStage: Record<SleepStage, number>;
}

export function layoutHypnogram(rawBlocks: readonly SleepBlock[], totalMinutes: number | null, bedtime: string, wakeup: string): HypnogramLayout {
  const blocks = rawBlocks
    .map((b) => ({ ...b, fromMin: Math.max(0, b.fromMin), toMin: Math.max(0, b.toMin) }))
    .filter((b) => b.toMin > b.fromMin)
    .sort((a, b) => a.fromMin - b.fromMin);
  const lastEnd = blocks.reduce((mx, b) => Math.max(mx, b.toMin), 0);
  const known = totalMinutes ?? minutesBetween(bedtime, wakeup);
  const span = Math.max(1, known, lastEnd);

  const gaps: Gap[] = [];
  let cursor = 0;
  for (const b of blocks) {
    if (b.fromMin - cursor >= 1) gaps.push({ from: cursor, to: b.fromMin });
    cursor = Math.max(cursor, b.toMin);
  }
  if (span - cursor >= 1) gaps.push({ from: cursor, to: span });

  const minutesByStage: Record<SleepStage, number> = { awake: 0, rem: 0, light: 0, deep: 0 };
  for (const b of blocks) minutesByStage[b.stage] += b.toMin - b.fromMin;
  return { span, blocks, gaps, minutesByStage };
}

export interface HourTick {
  /** Minuti dall'inizio della notte. */
  at: number;
  hour: number;
  labelled: boolean;
}

/** Tacche a ogni ora piena; l'etichetta solo sulle ore pari (o ogni ora se la notte e' corta). */
export function hourTicks(bedtimeIso: string, span: number): HourTick[] {
  const bed = localParts(bedtimeIso);
  const first = bed.m === 0 ? 0 : 60 - bed.m;
  const firstHour = (bed.h + (bed.m === 0 ? 0 : 1)) % 24;
  const every = span <= 300 ? 1 : 2;
  const ticks: HourTick[] = [];
  for (let i = 0, t = first; t <= span; i += 1, t += 60) {
    const hour = (firstHour + i) % 24;
    ticks.push({ at: t, hour, labelled: hour % every === 0 && t / span > 0.03 && t / span < 0.97 });
  }
  return ticks;
}

// ── notti (ultimi 7 giorni) ─────────────────────────────────────────────────
export type NightSlotState = 'measured' | 'measured-zero' | 'partial' | 'absent';

export function nightSlotState(m: Measure<number>): NightSlotState {
  if (m.kind === 'absent') return 'absent';
  if (m.kind === 'partial') return 'partial';
  return m.value === 0 ? 'measured-zero' : 'measured';
}

/** Asse verticale: multipli di 3 ore, mai sotto le 9 ore, cosi' il riferimento a 7 h sta sempre dentro. */
export function nightsAxisTop(maxMinutes: number): number {
  return Math.max(540, Math.ceil(maxMinutes / 180) * 180);
}

export const REFERENCE_MINUTES = 420;
