/**
 * Micro-gate grafici, compito C1: le etichette dei parziali dicono la verita'.
 *
 *  - il totale del periodo non mostra una percentuale aggregata (la quota di giorni
 *    pieni NON e' una copertura temporale): «Dati incompleti» + numero di giorni completi;
 *  - i riepiloghi dei grafici dichiarano quando media/min/max includono giorni parziali;
 *  - i NUMERI non cambiano: i calcoli sono quelli di prima, ricalcolati qui a mano.
 *
 * Dati solo sintetici. Serie di 7 giorni: 8000, 10000, 6000, 5000 misurati;
 * 3000 parziale (copertura 0,3, incomplete_coverage); 1 assente; 12000.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Measure } from '@/lib/web-dashboard/measure';
import type { TrendPoint, TrendSeries } from '@/lib/web-dashboard/model';
import { DailyStepsChart } from './charts/DailyStepsChart';
import { HeartRateTrendChart } from './charts/HeartRateTrendChart';
import { SleepDurationChart } from './charts/SleepDurationChart';
import { TrendsScreen } from './screens/TrendsScreen';
import { WorkoutsScreen } from './screens/WorkoutsScreen';
import type { Workout } from '@/lib/web-dashboard/model';
import { screenProps } from './screens/test-utils';
import { toChartPoints } from '@/lib/web-dashboard/charts/measure-adapter';
import { sharedCopy } from '@/lib/web-dashboard/copy';

afterEach(cleanup);

const val = (value: number): Measure<number> => ({ kind: 'value', value });
const part = (value: number, coverage: number): Measure<number> => ({ kind: 'partial', value, coverage, note: 'incomplete_coverage' });
const abs: Measure<number> = { kind: 'absent', reason: 'no_data_received' };

const MIXED: Measure<number>[] = [val(8000), val(10000), val(6000), val(5000), part(3000, 0.3), abs, val(12000)];
const FULL: Measure<number>[] = [val(8000), val(10000), val(6000), val(5000), val(3000), val(9000), val(12000)];

const dayOf = (i: number) => `2026-09-${String(17 + i).padStart(2, '0')}`; // ultimo = 2026-09-23 (giorno di default)
const toDays = (ms: Measure<number>[]): TrendPoint[] => ms.map((m, i) => ({ date: dayOf(i), m }));

function renderTrends(lc: 'it' | 'en', ms: Measure<number>[]) {
  const base = screenProps('ok', { lc });
  const trends: TrendSeries[] = base.data.trends.map((s) => (s.metric === 'steps' ? { ...s, days: toDays(ms) } : s));
  const props = { ...base, data: { ...base.data, trends }, params: { ...base.params, range: 7 as const } };
  return render(<TrendsScreen {...props} />);
}

const LABELS = {
  it: { incomplete: 'Dati incompleti', completeDays: '5 su 7', including: /inclus[aoie]/, avg: '7.333', sum: '44.000', min: '3.000' },
  en: { incomplete: 'Incomplete data', completeDays: '5 of 7', including: /including/, avg: '7,333', sum: '44,000', min: '3,000' },
} as const;

describe.each(['it', 'en'] as const)('parziali, etichette %s', (lc) => {
  const L = LABELS[lc];

  it('(a) il totale non ha percentuale: «Dati incompleti» e giorni completi', () => {
    const { container } = renderTrends(lc, MIXED);
    const total = container.querySelector('[data-trend-card="steps"] [data-stat="total"]') as HTMLElement;
    expect(total).toBeTruthy();
    expect(total.textContent).not.toContain('%');
    expect(total.textContent).toContain(L.incomplete);
    expect(total.textContent).toContain(L.completeDays);
    expect(total.querySelector('[data-measure-state="partial"]')).toBeTruthy();
  });

  it('(b) i numeri restano quelli di prima (ricalcolati da un\'altra strada)', () => {
    const withData = [8000, 10000, 6000, 5000, 3000, 12000];
    const sum = withData.reduce((a, b) => a + b, 0);
    expect(sum).toBe(44000);
    expect(Math.round(sum / withData.length)).toBe(7333);
    const { container } = renderTrends(lc, MIXED);
    const card = container.querySelector('[data-trend-card="steps"]') as HTMLElement;
    expect((card.querySelector('[data-stat="avg"]') as HTMLElement).textContent).toContain(L.avg);
    expect((card.querySelector('[data-stat="total"]') as HTMLElement).textContent).toContain(L.sum);
    expect((card.querySelector('[data-stat="min"]') as HTMLElement).textContent).toContain(L.min);
    expect((card.querySelector('[data-stat="max"]') as HTMLElement).textContent).toContain(lc === 'it' ? '12.000' : '12,000');
  });

  it('(c) il riepilogo del grafico Trend dichiara i parziali inclusi', () => {
    const { container } = renderTrends(lc, MIXED);
    const s = container.querySelector('#trend-steps-summary') as HTMLElement;
    expect(s.textContent).toMatch(L.including);
    const basis = container.querySelector('[data-trend-card="steps"] [data-stat="avg"]') as HTMLElement;
    expect(basis.textContent).toMatch(L.including);
    // accordo al singolare: «incluso 1 giorno parziale», mai «inclusi 1 …»
    if (lc === 'it') {
      expect(s.textContent).toContain(', incluso 1 giorno parziale');
      expect(basis.textContent).toContain('incluso 1 giorno parziale');
      expect(s.textContent).not.toMatch(/inclusi 1 /);
      expect(basis.textContent).not.toMatch(/inclusi 1 /);
    }
  });

  it('(d) senza parziali nessuna dichiarazione e nessun chip sul totale', () => {
    const { container } = renderTrends(lc, FULL);
    const s = container.querySelector('#trend-steps-summary') as HTMLElement;
    expect(s.textContent).not.toMatch(L.including);
    const total = container.querySelector('[data-trend-card="steps"] [data-stat="total"]') as HTMLElement;
    expect(total.textContent).not.toContain(L.incomplete);
    expect(total.querySelector('[data-measure-state="measured"]')).toBeTruthy();
  });

  it('(c) i tre grafici dichiarano i parziali inclusi nel riepilogo, con singolare', () => {
    const copy = sharedCopy(lc);
    const labels = { absent: copy.measure.absent, partial: copy.measure.partial, invalid: copy.states.errorTitle };
    const pts = toChartPoints(toDays(MIXED), labels);
    const { container } = render(
      <div>
        <DailyStepsChart id="s" title="t" points={pts} period={7} locale={lc} />
        <HeartRateTrendChart id="h" title="t" points={pts} period={7} locale={lc} />
        <SleepDurationChart id="z" title="t" points={pts} period={7} locale={lc} />
      </div>,
    );
    for (const id of ['s', 'h', 'z']) {
      const t = container.querySelector(`#${id}-summary`)?.textContent ?? '';
      expect(t, id).toMatch(L.including);
      expect(t, id).toMatch(lc === 'it' ? /1 (giorno|notte) parzial[ei]/ : /1 partial (day|night)/);
    }
    // i numeri del riepilogo non cambiano. Il formato del grafico e' quello di sempre
    // (it-IT non raggruppa le cifre a quattro numeri: «7333»), non e' oggetto di questo gate.
    const steps = container.querySelector('#s-summary')?.textContent ?? '';
    const avg = new Intl.NumberFormat(lc === 'it' ? 'it-IT' : 'en-US', { maximumFractionDigits: 0 }).format(44000 / 6);
    expect(steps).toContain(lc === 'it' ? `media di ${avg} passi al giorno, incluso 1 giorno parziale` : `average of ${avg} steps per day, including 1 partial day`);
  });

  it('(d) i tre grafici senza parziali non dichiarano nulla', () => {
    const copy = sharedCopy(lc);
    const labels = { absent: copy.measure.absent, partial: copy.measure.partial, invalid: copy.states.errorTitle };
    const pts = toChartPoints(toDays(FULL), labels);
    const { container } = render(
      <div>
        <DailyStepsChart id="s" title="t" points={pts} period={7} locale={lc} />
        <HeartRateTrendChart id="h" title="t" points={pts} period={7} locale={lc} />
        <SleepDurationChart id="z" title="t" points={pts} period={7} locale={lc} />
      </div>,
    );
    for (const id of ['s', 'h', 'z']) {
      expect(container.querySelector(`#${id}-summary`)?.textContent ?? '', id).not.toMatch(L.including);
    }
  });
});

describe.each(['it', 'en'] as const)('riepilogo allenamenti, totale per quota di sessioni %s', (lc) => {
  const mk = (over: Partial<Workout>): Workout => ({
    id: 'w1', type: 'run', startedAt: '2026-09-23T18:10:00+02:00',
    durationMin: val(40), distanceKm: val(7.4), caloriesKcal: val(300), hrAvg: val(140), ...over,
  });
  const render1 = (sessions: Measure<Workout[]>) => {
    const props = screenProps('ok', { lc });
    const data = { ...props.data, workouts: { sessions, week: props.data.workouts.week } };
    return render(<WorkoutsScreen {...props} data={data} />);
  };

  it('calorie su 1 sessione di 2: «Dati incompleti», nessuna percentuale; cifra invariata', () => {
    const { container } = render1({
      kind: 'value',
      value: [mk({ id: 'a' }), mk({ id: 'b', startedAt: '2026-09-23T19:10:00+02:00', caloriesKcal: abs })],
    });
    const kcal = container.querySelector('[data-metric="calories"]') as HTMLElement;
    expect(kcal.querySelector('[data-measure-state="partial"]')).toBeTruthy();
    expect(kcal.textContent).toContain('300');
    expect(kcal.textContent).not.toContain('%');
    expect(kcal.textContent).toContain(lc === 'it' ? 'Dati incompleti' : 'Incomplete data');
  });

  it('una sessione con campo PARZIALE (non assente): «Dati incompleti» e il conteggio delle sessioni complete', () => {
    const { container } = render1({
      kind: 'value',
      value: [
        mk({ id: 'a' }),
        mk({ id: 'b', startedAt: '2026-09-23T19:10:00+02:00', caloriesKcal: { kind: 'partial', value: 120, coverage: 0.5, note: 'incomplete_coverage' } }),
      ],
    });
    const kcal = container.querySelector('[data-metric="calories"]') as HTMLElement;
    expect(kcal.textContent).toContain(lc === 'it' ? 'Dati incompleti' : 'Incomplete data');
    expect(kcal.textContent).toContain(lc === 'it' ? '1 su 2 sessioni complete' : '1 of 2 sessions complete');
    expect(kcal.textContent).not.toContain('%');
    expect(kcal.textContent).toContain('420');
  });

  it('campo assente in una sessione: il conteggio compare una sola volta, senza ripetere', () => {
    const { container } = render1({
      kind: 'value',
      value: [mk({ id: 'a' }), mk({ id: 'b', startedAt: '2026-09-23T19:10:00+02:00', caloriesKcal: abs })],
    });
    const kcal = container.querySelector('[data-metric="calories"]') as HTMLElement;
    expect(kcal.textContent).not.toMatch(lc === 'it' ? /sessioni complete/ : /sessions complete/);
  });

  it('elenco parziale con sessioni piene: la copertura reale dell\'elenco resta con la percentuale', () => {
    const { container } = render1({ kind: 'partial', value: [mk({ id: 'a' })], coverage: 0.6, note: 'incomplete_coverage' });
    const dur = container.querySelector('[data-metric="duration"]') as HTMLElement;
    expect(dur.textContent).toContain('60%');
  });
});
