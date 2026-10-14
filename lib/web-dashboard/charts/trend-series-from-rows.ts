import type { AbsentReason, Measure, PartialNote } from '../measure';
import type { TrendMetric, TrendSeries } from '../model';

export type QualifiedDay = Record<TrendMetric, Measure<number>>;
export type SeriesFailureCode = 'invalid_days' | 'invalid_row' | 'incomplete_read' | 'invalid_measure' | 'resolver_failed';
export type SeriesAssembly = { ok: true; series: TrendSeries[] } | { ok: false; code: SeriesFailureCode };
const METRICS: readonly TrendMetric[] = ['steps', 'sleepMinutes', 'restingHr'];
const REASONS: readonly AbsentReason[] = ['no_data_received', 'not_synced_yet', 'source_lacks_type', 'no_samples', 'not_yet'];
const NOTES: readonly PartialNote[] = ['incomplete_coverage', 'window_open'];
const fail = (code: SeriesFailureCode): SeriesAssembly => ({ ok: false, code });
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const number = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

// UTC validates calendar labels only, not which sensor/account day a row belongs to.
function calendarStamp(day: unknown): number | null {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const stamp = Date.parse(day + 'T00:00:00Z');
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === day ? stamp : null;
}

function projectMeasure(v: unknown): Measure<number> | null {
  if (!record(v)) return null;
  if (v.kind === 'absent' && REASONS.includes(v.reason as AbsentReason)) return { kind: 'absent', reason: v.reason as AbsentReason };
  if (!number(v.value)) return null;
  if (v.kind === 'value') return { kind: 'value', value: v.value };
  if (v.kind === 'partial' && number(v.coverage) && v.coverage <= 1 && NOTES.includes(v.note as PartialNote)) {
    return { kind: 'partial', value: v.value, coverage: v.coverage, note: v.note as PartialNote };
  }
  return null;
}

/** No default policy: callers qualify missing/zero, source selection and coverage. */
export function assembleTrendSeries<R extends { readonly local_day_key: unknown }>(input: {
  days: readonly string[];
  rows: readonly R[];
  complete: boolean;
  resolveDay: (day: string, candidates: readonly R[]) => QualifiedDay;
}): SeriesAssembly {
  if (input.complete !== true) return fail('incomplete_read');
  if (!Array.isArray(input.days) || (input.days.length !== 7 && input.days.length !== 30)) return fail('invalid_days');
  const days = [...input.days];
  const stamps = days.map(calendarStamp);
  if (stamps.some((stamp, i) => stamp === null || (i > 0 && stamp !== stamps[i - 1]! + 86400000))) return fail('invalid_days');
  if (!Array.isArray(input.rows)) return fail('invalid_row');
  const groups = new Map<string, R[]>(days.map(day => [day, []]));
  // Copy each candidate group, not row contents: the resolver is explicitly trusted.
  for (const row of input.rows as readonly R[]) {
    if (!record(row) || calendarStamp(row.local_day_key) === null) return fail('invalid_row');
    groups.get(row.local_day_key as string)?.push(row);
  }
  if (typeof input.resolveDay !== 'function') return fail('resolver_failed');
  const series: TrendSeries[] = METRICS.map(metric => ({ metric, days: [] }));
  for (const day of days) {
    let qualified: unknown;
    try { qualified = input.resolveDay(day, Object.freeze([...groups.get(day)!])); }
    catch { return fail('resolver_failed'); }
    if (!record(qualified)) return fail('invalid_measure');
    for (const [i, metric] of METRICS.entries()) {
      const m = projectMeasure(qualified[metric]);
      if (!m) return fail('invalid_measure');
      series[i].days.push({ date: day, m });
    }
  }
  return { ok: true, series };
}
