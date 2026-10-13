import { describe, expect, it } from 'vitest';
import type { TrendPoint } from '../model';
import { toChartPoints, type ChartPointLabels } from './measure-adapter';

const labels: ChartPointLabels = {
  absent: { no_data_received: 'A', not_synced_yet: 'B', source_lacks_type: 'C', no_samples: 'D', not_yet: 'E' },
  partial: { incomplete_coverage: 'P', window_open: 'W' }, invalid: 'Invalid',
};
const row = (m: unknown, date = '2026-09-01'): TrendPoint => ({ date, m: m as TrendPoint['m'] });
const date = '2026-09-01';

describe('partial boundaries', () => {
  it.each([NaN, Infinity, -Infinity, -1, '60', null, undefined])('rejects partial value %s', (value) => {
    expect(toChartPoints([row({ kind: 'partial', value, coverage: 0.5, note: 'window_open' })], labels)[0])
      .toEqual({ date, value: null, state: 'error', absentReason: 'Invalid' });
  });
  it.each([0, 1])('accepts boundary coverage %s without clamping', (coverage) => {
    expect(toChartPoints([row({ kind: 'partial', value: 60, coverage, note: 'incomplete_coverage' })], labels)[0])
      .toEqual({ date, value: 60, state: 'partial', coverage, partialNote: 'P' });
  });
  it.each(['0.5', null, undefined])('rejects non-number coverage %s', (coverage) => {
    const p = toChartPoints([row({ kind: 'partial', value: 60, coverage, note: 'window_open' })], labels)[0];
    expect(p.state).toBe('error');
    expect(p.value).toBeNull();
  });
  it('keeps the two partial notes on distinct labels', () => {
    const [w, p] = toChartPoints([
      row({ kind: 'partial', value: 60, coverage: 0.5, note: 'window_open' }),
      row({ kind: 'partial', value: 60, coverage: 0.5, note: 'incomplete_coverage' }),
    ], labels);
    expect(w.partialNote).toBe('W');
    expect(p.partialNote).toBe('P');
  });
});
