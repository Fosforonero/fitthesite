import { describe, expect, it, vi } from 'vitest';
import type { Measure } from '../measure';
import { toChartPoints, type ChartPointLabels } from './measure-adapter';
import { assembleTrendSeries, type QualifiedDay } from './trend-series-from-rows';

type Row = { readonly local_day_key: unknown; readonly source?: string; readonly raw?: number };
const daysFrom = (first = '2026-10-01', count = 7) => Array.from({ length: count }, (_, i) =>
  new Date(Date.parse(first + 'T00:00:00Z') + i * 86400000).toISOString().slice(0, 10));
const empty = (): QualifiedDay => ({
  steps: { kind: 'absent', reason: 'no_data_received' },
  sleepMinutes: { kind: 'absent', reason: 'source_lacks_type' },
  restingHr: { kind: 'absent', reason: 'no_samples' },
});
const resolved = (steps: Measure<number>): QualifiedDay => ({ ...empty(), steps });
const input = (override: Partial<Parameters<typeof assembleTrendSeries<Row>>[0]> = {}) => ({
  days: daysFrom(), rows: [] as readonly Row[], complete: true, resolveDay: () => empty(), ...override,
});

describe('qualified trend series: calendar and explicit caller policy', () => {
  it.each([7, 30])('creates exactly three ordered series with %i points without inventing zero', count => {
    const days = daysFrom('2026-10-24', count);
    const resolveDay = vi.fn(() => empty());
    const result = assembleTrendSeries(input({ days, resolveDay }));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected qualified output');
    expect(result.series.map(s => s.metric)).toEqual(['steps', 'sleepMinutes', 'restingHr']);
    for (const s of result.series) expect(s.days.map(p => p.date)).toEqual(days);
    expect(resolveDay.mock.calls).toHaveLength(count);
    expect(result.series[0].days.every(p => p.m.kind === 'absent')).toBe(true);
  });

  it('accepts leap day and month/year boundaries as calendar labels', () => {
    for (const first of ['2024-02-27', '2026-12-29']) {
      expect(assembleTrendSeries(input({ days: daysFrom(first) })).ok).toBe(true);
    }
  });

  it.each([
    [], daysFrom('2026-10-01', 6), daysFrom('2026-10-01', 8),
    [...daysFrom()].reverse(), [...daysFrom().slice(0, 6), '2026-10-06'],
    [...daysFrom().slice(0, 6), '2026-10-09'],
    ['2025-02-29', ...daysFrom().slice(1)], ['2026-13-01', ...daysFrom().slice(1)],
    ['2026-10-01T00:00:00Z', ...daysFrom().slice(1)],
    [null, ...daysFrom().slice(1)], '2026-10-01',
  ])('rejects invalid calendar windows %# rather than repairing them', days => {
    expect(assembleTrendSeries(input({ days: days as unknown as string[] })))
      .toEqual({ ok: false, code: 'invalid_days' });
  });

  it.each([false, undefined, 'true', 1])('fails closed on an incomplete/unqualified read %#', complete => {
    const policy = vi.fn(() => empty());
    expect(assembleTrendSeries(input({ complete: complete as boolean, resolveDay: policy })))
      .toEqual({ ok: false, code: 'incomplete_read' });
    expect(policy).not.toHaveBeenCalled();
  });

  it('groups duplicates in original order and leaves selection to the caller', () => {
    const a = Object.freeze({ local_day_key: '2026-10-03', source: 'second', raw: 3 });
    const b = Object.freeze({ local_day_key: '2026-10-03', source: 'first', raw: 8 });
    const outside = Object.freeze({ local_day_key: '2026-09-30', source: 'outside', raw: 99 });
    const rows = Object.freeze([a, outside, b]);
    const seen: (readonly Row[])[] = [];
    const policy = vi.fn((day: string, candidates: readonly Row[]) => {
      seen.push(candidates);
      return day === '2026-10-03' ? resolved({ kind: 'value', value: candidates[0].raw! }) : empty();
    });
    const result = assembleTrendSeries(input({ rows, days: Object.freeze(daysFrom()), resolveDay: policy }));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected qualified output');
    expect(seen[2]).toEqual([a, b]);
    expect(result.series[0].days[2].m).toEqual({ kind: 'value', value: 3 });
    expect(rows).toEqual([a, outside, b]);
    expect(policy.mock.calls.every(([, group]) => !group.includes(outside))).toBe(true);
  });

  it.each([null, { local_day_key: '2026-02-30' }, { local_day_key: 20261001 }, {}])(
    'rejects invalid rows even outside the requested window %#', row => {
      expect(assembleTrendSeries(input({ rows: [row] as unknown as Row[] })))
        .toEqual({ ok: false, code: 'invalid_row' });
    },
  );

  it('requires a policy and hides its exception message', () => {
    expect(assembleTrendSeries(input({ resolveDay: undefined as unknown as () => QualifiedDay })))
      .toEqual({ ok: false, code: 'resolver_failed' });
    expect(assembleTrendSeries(input({ resolveDay: () => { throw new Error('synthetic diagnostic'); } })))
      .toEqual({ ok: false, code: 'resolver_failed' });
  });
});

describe('qualified trend series: lossless Measure projection', () => {
  it.each([0, 1])('preserves partial zero with coverage %i and strips extra fields', coverage => {
    const measure = { kind: 'partial' as const, value: 0, coverage, note: 'window_open' as const, internalId: 'fixture-only' };
    const qualified = resolved(measure);
    const result = assembleTrendSeries(input({ resolveDay: () => qualified }));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected qualified output');
    const m = result.series[0].days[0].m;
    expect(m).toEqual({ kind: 'partial', value: 0, coverage, note: 'window_open' });
    expect(m).not.toBe(measure);
    measure.value = 9;
    expect(m).toMatchObject({ value: 0 });
    expect(JSON.stringify(result)).not.toContain('fixture-only');
  });

  it('passes qualified zero, partial and absent faithfully to the existing chart adapter', () => {
    const measures: Measure<number>[] = [
      { kind: 'value', value: 0 },
      { kind: 'partial', value: 0, coverage: 0.25, note: 'incomplete_coverage' },
      { kind: 'absent', reason: 'no_samples' },
    ];
    const result = assembleTrendSeries(input({ resolveDay: day => resolved(measures[daysFrom().indexOf(day) % 3]) }));
    if (!result.ok) throw new Error('expected qualified output');
    const labels: ChartPointLabels = {
      absent: { no_data_received: 'missing', not_synced_yet: 'stale', source_lacks_type: 'unsupported', no_samples: 'empty', not_yet: 'future' },
      partial: { incomplete_coverage: 'incomplete', window_open: 'open' }, invalid: 'invalid',
    };
    expect(toChartPoints(result.series[0].days, labels).slice(0, 3).map(p => [p.state, p.value]))
      .toEqual([['measured-zero', 0], ['partial', 0], ['absent', null]]);
  });

  it.each([
    null, {}, { kind: 'other', value: 1 }, { kind: 'value', value: NaN },
    { kind: 'value', value: Infinity }, { kind: 'value', value: -1 }, { kind: 'value', value: '0' },
    { kind: 'partial', value: 1, coverage: -0.01, note: 'window_open' },
    { kind: 'partial', value: 1, coverage: 1.01, note: 'window_open' },
    { kind: 'partial', value: 1, coverage: NaN, note: 'window_open' },
    { kind: 'partial', value: 1, coverage: 0.5, note: 'toString' },
    { kind: 'absent', reason: 'toString' },
  ])('rejects malformed measures %# without silently coercing them', m => {
    for (const metric of ['steps', 'sleepMinutes', 'restingHr'] as const) {
      const qualified = { ...empty(), [metric]: m } as QualifiedDay;
      expect(assembleTrendSeries(input({ resolveDay: () => qualified })))
        .toEqual({ ok: false, code: 'invalid_measure' });
    }
  });

  it('rejects missing metrics and non-object policy results', () => {
    for (const qualified of [undefined, null, { steps: { kind: 'value', value: 1 } }]) {
      expect(assembleTrendSeries(input({ resolveDay: () => qualified as QualifiedDay })))
        .toEqual({ ok: false, code: 'invalid_measure' });
    }
  });
});
