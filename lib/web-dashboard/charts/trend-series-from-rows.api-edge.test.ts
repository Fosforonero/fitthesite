import { describe, expect, it, vi } from 'vitest';
import { assembleTrendSeries, type QualifiedDay } from './trend-series-from-rows';

type Row = { local_day_key: unknown; tag?: string };
const week = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'];
const ok = (value: number) => ({ kind: 'value', value }) as const;
const qd = (): QualifiedDay => ({ steps: ok(1), sleepMinutes: ok(2), restingHr: ok(3) });
const run = (rows: unknown, resolveDay: (d: string, c: readonly Row[]) => QualifiedDay = qd, days: string[] = week) =>
  assembleTrendSeries<Row>({ days, rows: rows as Row[], complete: true, resolveDay });

describe('assembleTrendSeries api edge', () => {
  it('projects measures to fresh objects with only allowed fields', () => {
    const extra = { kind: 'value', value: 5, secret: 'x' };
    const gone = { kind: 'absent', reason: 'no_samples', secret: 'y' };
    const src = { steps: extra, sleepMinutes: gone, restingHr: ok(3) } as unknown as QualifiedDay;
    const r = run([], () => src);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.series[0].days[0].m).toEqual({ kind: 'value', value: 5 });
    expect(r.series[0].days[0].m).not.toBe(extra);
    expect(r.series[1].days[0].m).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(r.series[1].days[0].m).not.toBe(gone);
  });

  it('round-trips every absent reason for all three metrics', () => {
    for (const reason of ['no_data_received', 'not_synced_yet', 'source_lacks_type', 'no_samples', 'not_yet'] as const) {
      const a = { kind: 'absent', reason } as const;
      const r = run([], () => ({ steps: a, sleepMinutes: a, restingHr: a }));
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      for (const s of r.series) expect(s.days.every(d => d.m.kind === 'absent' && d.m.reason === reason)).toBe(true);
    }
  });

  it('passes frozen candidate arrays; reversing them fails as resolver_failed', () => {
    const rows: Row[] = [{ local_day_key: week[0], tag: 'a' }, { local_day_key: week[0], tag: 'b' }];
    const r = run(rows, (_d, c) => { (c as Row[]).reverse(); return qd(); });
    expect(r).toEqual({ ok: false, code: 'resolver_failed' });
    expect(rows.map(x => x.tag)).toEqual(['a', 'b']);
  });

  it('rejects non-array rows as invalid_row', () => {
    for (const bad of [null, { length: 0 }, 'rows']) expect(run(bad)).toEqual({ ok: false, code: 'invalid_row' });
  });

  it('rejects a malformed row key anywhere before calling the resolver', () => {
    const resolver = vi.fn(qd);
    const rows: Row[] = [{ local_day_key: week[0] }, { local_day_key: '2024-13-40' }];
    expect(run(rows, resolver)).toEqual({ ok: false, code: 'invalid_row' });
    expect(resolver).not.toHaveBeenCalled();
  });

  it('validates calendar round-trip: 2000-02-29 accepted, 1900-02-29 rejected', () => {
    const leap = ['2000-02-29', '2000-03-01', '2000-03-02', '2000-03-03', '2000-03-04', '2000-03-05', '2000-03-06'];
    expect(run([], qd, leap).ok).toBe(true);
    const bad = ['1900-02-29', '1900-03-02', '1900-03-03', '1900-03-04', '1900-03-05', '1900-03-06', '1900-03-07'];
    expect(run([], qd, bad)).toEqual({ ok: false, code: 'invalid_days' });
  });
});
