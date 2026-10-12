import type { ChartDataPoint, ChartSlotState } from './types';

const ALLOWED_STATES: readonly ChartSlotState[] = [
  'measured',
  'measured-zero',
  'partial',
  'absent',
  'error',
];

function isAllowedState(state: unknown): state is ChartSlotState {
  return typeof state === 'string' && (ALLOWED_STATES as readonly string[]).includes(state);
}

function isValidValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidCoverage(coverage: unknown): coverage is number {
  return typeof coverage === 'number' && Number.isFinite(coverage) && coverage >= 0 && coverage <= 1;
}

function buildPoint(
  source: ChartDataPoint,
  state: ChartSlotState,
  value: number | null,
  extras: { coverage?: number; partialNote?: string; keepAbsentReason: boolean },
): ChartDataPoint {
  const out: ChartDataPoint = { date: source.date, value, state };
  if (extras.coverage !== undefined) out.coverage = extras.coverage;
  if (extras.partialNote !== undefined) out.partialNote = extras.partialNote;
  if (extras.keepAbsentReason && typeof source.absentReason === 'string') {
    out.absentReason = source.absentReason;
  }
  if (typeof source.collectedAt === 'string') out.collectedAt = source.collectedAt;
  return out;
}

function toError(source: ChartDataPoint): ChartDataPoint {
  return buildPoint(source, 'error', null, { keepAbsentReason: true });
}

function normalizeOne(point: ChartDataPoint): ChartDataPoint {
  const state: unknown = point.state;
  if (!isAllowedState(state)) return toError(point);

  if (state === 'absent' || state === 'error') {
    return buildPoint(point, state, null, { keepAbsentReason: true });
  }

  const value: unknown = point.value;
  if (!isValidValue(value)) return toError(point);

  if (state === 'measured-zero') {
    if (value !== 0) return toError(point);
    return buildPoint(point, 'measured-zero', 0, { keepAbsentReason: false });
  }

  if (state === 'partial') {
    const coverage: unknown = point.coverage;
    if (coverage !== undefined && !isValidCoverage(coverage)) return toError(point);
    if (point.partialNote !== undefined && typeof point.partialNote !== 'string') return toError(point);
    return buildPoint(point, 'partial', value, {
      coverage: coverage as number | undefined,
      partialNote: point.partialNote,
      keepAbsentReason: false,
    });
  }

  // measured: a measured zero value becomes measured-zero
  if (value === 0) {
    return buildPoint(point, 'measured-zero', 0, { keepAbsentReason: false });
  }
  return buildPoint(point, 'measured', value, { keepAbsentReason: false });
}

export function normalizeChartPoints(points: readonly ChartDataPoint[]): ChartDataPoint[] {
  return points.map(normalizeOne);
}
