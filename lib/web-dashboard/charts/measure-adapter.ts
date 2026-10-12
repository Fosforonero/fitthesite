import type { TrendPoint } from '../model';
import type { AbsentReason, PartialNote } from '../measure';
import type { ChartDataPoint } from '../../../components/web-dashboard/charts/types';

export interface ChartPointLabels {
  absent: Record<AbsentReason, string>;
  partial: Record<PartialNote, string>;
  invalid: string;
}

const has = (obj: object, key: unknown): boolean =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key);

const isNonNegFinite = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0;

const ABSENT_REASONS: readonly AbsentReason[] = ['no_data_received', 'not_synced_yet', 'source_lacks_type', 'no_samples', 'not_yet'];
const PARTIAL_NOTES: readonly PartialNote[] = ['incomplete_coverage', 'window_open'];

export function toChartPoints(
  points: readonly TrendPoint[],
  labels: ChartPointLabels,
): ChartDataPoint[] {
  return points.map((p): ChartDataPoint => {
    const date = p.date;
    const error = (): ChartDataPoint => ({
      date,
      value: null,
      state: 'error',
      absentReason: labels.invalid,
    });
    const m: unknown = p.m;
    if (typeof m !== 'object' || m === null) return error();
    const r = m as Record<string, unknown>;
    switch (r.kind) {
      case 'value': {
        const v = r.value;
        if (!isNonNegFinite(v)) return error();
        return v === 0
          ? { date, value: 0, state: 'measured-zero' }
          : { date, value: v, state: 'measured' };
      }
      case 'partial': {
        const v = r.value;
        const c = r.coverage;
        if (!isNonNegFinite(v)) return error();
        if (typeof c !== 'number' || !Number.isFinite(c) || c < 0 || c > 1) return error();
        if (!PARTIAL_NOTES.includes(r.note as PartialNote) || !has(labels.partial, r.note)) return error();
        return {
          date,
          value: v,
          state: 'partial',
          coverage: c,
          partialNote: labels.partial[r.note as PartialNote],
        };
      }
      case 'absent': {
        if (!ABSENT_REASONS.includes(r.reason as AbsentReason) || !has(labels.absent, r.reason)) return error();
        return {
          date,
          value: null,
          state: 'absent',
          absentReason: labels.absent[r.reason as AbsentReason],
        };
      }
      default:
        return error();
    }
  });
}
