import { describe, expect, it } from 'vitest';
import type { TrendPoint } from '../model';
import type { AbsentReason } from '../measure';
import { toChartPoints, type ChartPointLabels } from './measure-adapter';

const labels: ChartPointLabels = {
  absent: { no_data_received: 'A', not_synced_yet: 'B', source_lacks_type: 'C', no_samples: 'D', not_yet: 'E' },
  partial: { incomplete_coverage: 'P', window_open: 'W' }, invalid: 'Invalid',
};
const row = (m: unknown, date = '2026-09-01'): TrendPoint => ({ date, m: m as TrendPoint['m'] });
describe('L1 Measure to chart contract', () => {
  it.each([0, 60])('preserves measured value %s including measured zero', (value) => {
    expect(toChartPoints([row({ kind: 'value', value })], labels)).toEqual([{ date: '2026-09-01', value, state: value === 0 ? 'measured-zero' : 'measured' }]);
  });
  it.each([0, 60])('preserves partial value %s with exact coverage and known note', (value) => {
    expect(toChartPoints([row({ kind: 'partial', value, coverage: 0.25, note: 'window_open' })], labels)[0]).toEqual({ date: '2026-09-01', value, state: 'partial', coverage: 0.25, partialNote: 'W' });
  });
  it.each(Object.keys(labels.absent) as AbsentReason[])('preserves absent reason %s without a numeric value', (reason) => {
    expect(toChartPoints([row({ kind: 'absent', reason })], labels)[0]).toEqual({ date: '2026-09-01', value: null, state: 'absent', absentReason: labels.absent[reason] });
  });
  it.each([NaN, Infinity, -Infinity, -1, null])('rejects invalid number %s', (value) => {
    expect(toChartPoints([row({ kind: 'value', value })], labels)[0]).toMatchObject({ state: 'error', value: null, absentReason: 'Invalid' });
  });
  it.each([NaN, Infinity, -0.1, 1.1])('rejects invalid coverage %s without clamping', (coverage) => {
    expect(toChartPoints([row({ kind: 'partial', value: 60, coverage, note: 'window_open' })], labels)[0].state).toBe('error');
  });
  it.each(['toString', 'constructor', 'unknown'])('does not resolve unknown or prototype labels %s', (name) => {
    const extended = { ...labels, absent: { ...labels.absent, [name]: 'bad' }, partial: { ...labels.partial, [name]: 'bad' } };
    expect(toChartPoints([row({ kind: 'absent', reason: name }), row({ kind: 'partial', value: 60, coverage: 0.5, note: name })], extended).map((p) => p.state)).toEqual(['error', 'error']);
  });
  it('preserves order and date, excludes arbitrary fields, and does not mutate inputs', () => {
    const frozen = Object.freeze([Object.freeze({ ...row({ kind: 'value', value: 3 }, '2026-09-03'), raw: 'not copied' }), Object.freeze(row({ kind: 'absent', reason: 'no_samples' }, '2026-09-01'))]);
    const result = toChartPoints(frozen, Object.freeze(labels));
    expect(result.map((p) => p.date)).toEqual(['2026-09-03', '2026-09-01']);
    expect(result[0]).not.toHaveProperty('raw');
    expect(toChartPoints([row({ kind: 'unknown' }), row(null)], labels).every((p) => p.state === 'error')).toBe(true);
  });
});
