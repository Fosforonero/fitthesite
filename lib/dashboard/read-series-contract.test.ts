import { describe, expect, it, vi } from 'vitest';
import {
  COLONNE_METRICHE, leggiMetricheDelTitolare,
  type ClientLetture, type FiltroLetture, type RigaMetrica,
} from './letture-titolare';
import { leggiVerdettoDashboard, type AccessoConcesso } from './verdetto';
import { assembleTrendSeries, type QualifiedDay } from '../web-dashboard/charts/trend-series-from-rows';
import { toChartPoints, type ChartPointLabels } from '../web-dashboard/charts/measure-adapter';

// Synthetic contract integration, not a database/RLS or live source test.
const OWNER = 'dd000000-0000-4000-8000-000000000002';
const OTHER = 'dd000000-0000-4000-8000-000000000004';
const daysFrom = (count = 7) => Array.from({ length: count }, (_, i) =>
  new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10));
const labels: ChartPointLabels = {
  absent: { no_data_received: 'missing', not_synced_yet: 'pending', source_lacks_type: 'unsupported', no_samples: 'no samples', not_yet: 'future' },
  partial: { incomplete_coverage: 'incomplete', window_open: 'open' },
  invalid: 'invalid',
};
const empty = (): QualifiedDay => ({
  steps: { kind: 'absent', reason: 'no_data_received' },
  sleepMinutes: { kind: 'absent', reason: 'source_lacks_type' },
  restingHr: { kind: 'absent', reason: 'no_samples' },
});
const row = (day: string, steps = 0, owner = OWNER): Record<string, unknown> => ({
  user_id: owner, local_day_key: day, steps, source: 'synthetic-fixture',
  device_id: 'fixture-device', notes: 'fixture-private-field',
});

async function grant(): Promise<AccessoConcesso> {
  // Obtain the private brand through the real verdict parser, not a type cast.
  const result = await leggiVerdettoDashboard({
    rpc: () => ({ abortSignal: async () => ({
      data: { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null },
      error: null,
    }) }),
  }, OWNER);
  if (result.esito !== 'concesso') throw new Error('synthetic grant failed');
  return result;
}

function database(rows: Record<string, unknown>[], options: { ignoreOwner?: boolean; error?: boolean } = {}) {
  const calls: { table: string; columns: string; owner?: string; ranges: number[][] } = {
    table: '', columns: '', ranges: [],
  };
  const client: ClientLetture = {
    from(table) {
      calls.table = table;
      return { select(columns) {
        calls.columns = columns;
        let candidates = [...rows];
        const query: FiltroLetture = {
          eq(column, value) {
            if (column === 'user_id') calls.owner = value;
            if (!(options.ignoreOwner && column === 'user_id')) {
              candidates = candidates.filter(r => r[column] === value);
            }
            return query;
          },
          gte(column, value) { candidates = candidates.filter(r => String(r[column]) >= String(value)); return query; },
          lte(column, value) { candidates = candidates.filter(r => String(r[column]) <= String(value)); return query; },
          lt(column, value) { candidates = candidates.filter(r => String(r[column]) < String(value)); return query; },
          order() { return query; }, // Fixtures are already ordered; no server sorting is certified.
          async range(from, to) {
            calls.ranges.push([from, to]);
            // Deliberately return unsolicited columns to test the reader projection.
            return options.error
              ? { data: null, error: { code: 'SYNTHETIC', message: 'fixture-private-field' } }
              : { data: candidates.slice(from, to + 1), error: null };
          },
        };
        return query;
      } };
    },
  };
  return { client, calls };
}

async function readAndAssemble(
  client: ClientLetture, days: string[], resolveDay: (day: string, rows: readonly RigaMetrica[]) => QualifiedDay,
  maxPages?: number,
) {
  const reading = await leggiMetricheDelTitolare(client, await grant(), {
    daGiorno: days[0], aGiorno: days[days.length - 1],
  }, maxPages);
  return { reading, assembly: assembleTrendSeries({
    days, rows: reading.righe, complete: reading.completo, resolveDay,
  }) };
}

describe('owner reader -> qualified series -> chart adapter (synthetic only)', () => {
  it.each([7, 30])('preserves %i empty days as absent, never measured zero', async count => {
    const days = daysFrom(count);
    const resolver = vi.fn((_day: string, candidates: readonly RigaMetrica[]) => {
      expect(candidates).toEqual([]);
      return empty();
    });
    const { reading, assembly } = await readAndAssemble(database([]).client, days, resolver);
    expect(reading).toEqual({ righe: [], completo: true });
    expect(assembly.ok).toBe(true);
    if (!assembly.ok) throw new Error('expected assembly');
    expect(resolver).toHaveBeenCalledTimes(count);
    for (const series of assembly.series) {
      expect(toChartPoints(series.days, labels).map(p => [p.date, p.state, p.value]))
        .toEqual(days.map(day => [day, 'absent', null]));
    }
  });

  it('passes incomplete pagination to the assembler and never invokes qualification', async () => {
    const fixture = database(Array.from({ length: 500 }, () => row('2026-10-01', 100)));
    const resolver = vi.fn(() => empty());
    const { reading, assembly } = await readAndAssemble(fixture.client, daysFrom(), resolver, 1);
    expect(reading.completo).toBe(false);
    expect(reading.righe).toHaveLength(500);
    expect(fixture.calls.ranges).toEqual([[0, 499]]);
    expect(assembly).toEqual({ ok: false, code: 'incomplete_read' });
    expect(resolver).not.toHaveBeenCalled();
  });

  it('reads the terminal page and leaves same-day source selection to the explicit fixture policy', async () => {
    const rows = [...Array.from({ length: 500 }, () => row('2026-10-01', 1)), row('2026-10-02', 25)];
    const fixture = database(rows);
    const groups: number[] = [];
    const { reading, assembly } = await readAndAssemble(fixture.client, daysFrom(), (_day, candidates) => {
      groups.push(candidates.length);
      // Test-only selection, NOT a production source/aggregation policy.
      return candidates.length ? { ...empty(), steps: { kind: 'value', value: Number(candidates[0].steps) } } : empty();
    }, 2);
    expect(reading.completo).toBe(true);
    expect(fixture.calls.ranges).toEqual([[0, 499], [500, 999]]);
    expect(groups).toEqual([500, 1, 0, 0, 0, 0, 0]);
    expect(assembly.ok).toBe(true);
    if (!assembly.ok) throw new Error('expected assembly');
    expect(toChartPoints(assembly.series[0].days, labels).slice(0, 2).map(p => p.value)).toEqual([1, 25]);
  });

  it('filters ownership and strips private columns before the qualifier and chart output', async () => {
    const fixture = database([row('2026-10-01', 12), row('2026-10-01', 900, OTHER)]);
    const seen: (readonly RigaMetrica[])[] = [];
    const resolver = vi.fn((_day: string, candidates: readonly RigaMetrica[]) => {
      seen.push(candidates);
      return candidates.length ? { ...empty(), steps: { kind: 'value' as const, value: Number(candidates[0].steps) } } : empty();
    });
    const { reading, assembly } = await readAndAssemble(fixture.client, daysFrom(), resolver);
    expect(fixture.calls.table).toBe('fitness_metrics');
    expect(fixture.calls.columns).toBe(COLONNE_METRICHE.join(','));
    expect(fixture.calls.owner).toBe(OWNER);
    expect(reading.righe).toEqual([{ local_day_key: '2026-10-01', steps: 12, source: 'synthetic-fixture' }]);
    expect(seen[0]).toEqual(reading.righe);
    expect(assembly.ok).toBe(true);
    if (!assembly.ok) throw new Error('expected assembly');
    const charts = assembly.series.map(series => toChartPoints(series.days, labels));
    for (const forbidden of [OWNER, OTHER, 'fixture-device', 'fixture-private-field', 'user_id', 'device_id', 'notes']) {
      expect(JSON.stringify({ reading, seen, charts })).not.toContain(forbidden);
    }
  });

  it('rejects a foreign row from a permissive backend before the qualifier runs', async () => {
    const resolver = vi.fn(() => empty());
    const client = database([row('2026-10-01'), row('2026-10-01', 900, OTHER)], { ignoreOwner: true }).client;
    await expect(readAndAssemble(client, daysFrom(), resolver)).rejects.toMatchObject({ codice: 'riga_altrui' });
    expect(resolver).not.toHaveBeenCalled();
  });

  it('preserves explicitly qualified zero and partial zero, without inferring coverage from rows', async () => {
    const { assembly } = await readAndAssemble(database([row('2026-10-01'), row('2026-10-02')]).client,
      daysFrom(), (day, candidates) => {
        if (!candidates.length) return empty();
        return { ...empty(), steps: day === '2026-10-01'
          ? { kind: 'value', value: 0 }
          : { kind: 'partial', value: 0, coverage: 0.3, note: 'incomplete_coverage' } };
      });
    expect(assembly.ok).toBe(true);
    if (!assembly.ok) throw new Error('expected assembly');
    expect(toChartPoints(assembly.series[0].days, labels).slice(0, 3)).toEqual([
      { date: '2026-10-01', value: 0, state: 'measured-zero' },
      { date: '2026-10-02', value: 0, state: 'partial', coverage: 0.3, partialNote: 'incomplete' },
      { date: '2026-10-03', value: null, state: 'absent', absentReason: 'missing' },
    ]);
  });

  it('propagates a server error without calling qualification or exposing its message', async () => {
    const resolver = vi.fn(() => empty());
    await expect(readAndAssemble(database([], { error: true }).client, daysFrom(), resolver))
      .rejects.toMatchObject({ codice: 'errore_server', message: 'lettura non riuscita (SYNTHETIC)' });
    expect(resolver).not.toHaveBeenCalled();
  });
});
