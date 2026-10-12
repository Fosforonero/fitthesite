import { describe, expect, it } from 'vitest';
import { normalizeChartPoints } from './normalize-points';
import type { ChartDataPoint } from './types';

const point = (fields: Partial<ChartDataPoint>): ChartDataPoint => ({ date: '2026-09-01', state: 'measured', value: 60, ...fields });
describe('chart input normalization', () => {
  it.each([NaN, Infinity, -Infinity, -1, null, undefined])('rejects invalid measured value %s', (value) => {
    expect(normalizeChartPoints([point({ value } as Partial<ChartDataPoint>)])[0]).toMatchObject({ value: null, state: 'error' });
  });
  it.each([NaN, Infinity, -0.1, 1.1])('rejects invalid partial coverage %s without clamping', (coverage) => {
    expect(normalizeChartPoints([point({ state: 'partial', coverage })])[0]).toMatchObject({ value: null, state: 'error' });
  });
  it('preserves partial zero and optional coverage, without upgrading it to a full measurement', () => {
    expect(normalizeChartPoints([point({ state: 'partial', value: 0, coverage: 0.25 })])[0]).toEqual(point({ state: 'partial', value: 0, coverage: 0.25 }));
    expect(normalizeChartPoints([point({ state: 'partial' })])[0].state).toBe('partial');
  });
  it('clears stale metadata and values from missing states, rejects inconsistent measured zero', () => {
    const p = point({ state: 'absent', value: 10, coverage: 0.5, partialNote: 'stale', absentReason: 'known' });
    expect(normalizeChartPoints([p])[0]).toEqual({ date: p.date, state: 'absent', value: null, absentReason: 'known' });
    expect(normalizeChartPoints([point({ state: 'measured-zero', value: 5 })])[0].state).toBe('error');
    expect(normalizeChartPoints([point({ value: 0 })])[0].state).toBe('measured-zero');
    expect(normalizeChartPoints([point({ state: 'unexpected' as never })])[0].state).toBe('error');
  });
  it('is idempotent and does not mutate frozen input', () => {
    const input = Object.freeze([Object.freeze(point({ value: 0, partialNote: 'stale' }))]);
    const once = normalizeChartPoints(input);
    expect(normalizeChartPoints(once)).toEqual(once);
    expect(input[0].state).toBe('measured');
    expect(input[0].partialNote).toBe('stale');
    expect(once[0]).not.toBe(input[0]);
  });
  it.each([42, {}, null])('rejects non-text partial notes %s rather than propagating objects', (partialNote) => {
    expect(normalizeChartPoints([point({ state: 'partial', partialNote } as never)])[0].state).toBe('error');
  });
});
