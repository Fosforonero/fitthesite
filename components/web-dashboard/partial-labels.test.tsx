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
import type { ChartDataPoint } from './charts/types';
import { toChartPoints } from '@/lib/web-dashboard/charts/measure-adapter';
import { sharedCopy } from '@/lib/web-dashboard/copy';
import { trendsCopy } from './screens/TrendsScreen.copy';

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

/**
 * Accordi singolare/plurale (C2-1, C2-2): asserzioni ESATTE sul testo reso dei tre grafici,
 * con n = 1 e n = 2, IT ed EN. 0 resta plurale (non coperto da un conteggio: la clausola sparisce).
 */
describe.each(['it', 'en'] as const)('accordi dei riepiloghi dei grafici, n = 1 e n = 2 %s', (lc) => {
  const isIt = lc === 'it';
  const pt = (state: 'measured' | 'measured-zero' | 'partial' | 'absent' | 'error', i: number): ChartDataPoint => {
    const date = dayOf(i);
    switch (state) {
      case 'measured': return { date, value: 100 + i, state };
      case 'measured-zero': return { date, value: 0, state };
      case 'partial': return { date, value: 50, state, coverage: 0.3, partialNote: 'x' };
      case 'absent': return { date, value: null, state, absentReason: 'x' };
      default: return { date, value: null, state: 'error', absentReason: 'x' };
    }
  };
  const build = (spec: Array<[ChartDataPoint['state'], number]>): ChartDataPoint[] => {
    const out: ChartDataPoint[] = [];
    for (const [st, n] of spec) for (let k = 0; k < n; k++) out.push(pt(st as never, out.length));
    return out;
  };
  const summaries = (pts: ChartDataPoint[], period: number) => {
    const { container } = render(
      <div>
        <DailyStepsChart id="s" title="t" points={pts} period={period} locale={lc} />
        <HeartRateTrendChart id="h" title="t" points={pts} period={period} locale={lc} />
        <SleepDurationChart id="z" title="t" points={pts} period={period} locale={lc} />
      </div>,
    );
    const g = (id: string) => container.querySelector(`#${id}-summary`)?.textContent ?? '';
    return { s: g('s'), h: g('h'), z: g('z') };
  };
  const day = (n: number) => (isIt ? (n === 1 ? '1 giorno' : `${n} giorni`) : n === 1 ? '1 day' : `${n} days`);
  const night = (n: number) => (isIt ? (n === 1 ? '1 notte' : `${n} notti`) : n === 1 ? '1 night' : `${n} nights`);
  const BAD = /\b1 (giorni|notti|days|nights)\b/;

  it.each([1, 2])('n = %i: zero misurato, parziali, senza dati, errore', (n) => {
    const { s, h, z } = summaries(build([['measured', 3], ['measured-zero', n], ['partial', n], ['absent', n], ['error', n]]), 7);
    const stepsHr = isIt
      ? [`${day(n)} con zero misurato. `, `${day(n)} con dati parziali. `, `${day(n)} senza dati. `, `${day(n)} con errore.`]
      : [`${day(n)} with measured zero. `, `${day(n)} with partial data. `, `${day(n)} with no data. `, `${day(n)} with error.`];
    const sleep = isIt
      ? [`${night(n)} con zero misurato. `, `${night(n)} con dati parziali. `, `${night(n)} senza dati. `, `${night(n)} con errore.`]
      : [`${night(n)} with measured zero. `, `${night(n)} with partial data. `, `${night(n)} with no data. `, `${night(n)} with error.`];
    for (const f of stepsHr) { expect(s, 's').toContain(f); expect(h, 'h').toContain(f); }
    for (const f of sleep) expect(z, 'z').toContain(f);
    for (const t of [s, h, z]) expect(t).not.toMatch(BAD);
  });

  it.each([1, 2])('n = %i: giorni/notti con dato registrato', (n) => {
    const { s, h, z } = summaries(build([['measured', n], ['absent', 1]]), 7);
    const M = n + 1;
    expect(s).toContain(isIt ? `${day(n)} con misurazione registrata su ${M}, ` : `${day(n)} with recorded readings out of ${M}, `);
    expect(h).toContain(isIt ? `${day(n)} con misurazione registrata su ${M}, ` : `${day(n)} with recorded readings out of ${M}, `);
    expect(z).toContain(isIt ? `${night(n)} con dato registrato su ${M}, ` : `${night(n)} with recorded data out of ${M}, `);
    for (const t of [s, h, z]) expect(t).not.toMatch(BAD);
  });

  it.each([1, 2])('n = %i: parziali inclusi (steps, cuore, sonno)', (n) => {
    const { s, h, z } = summaries(build([['measured', 3], ['partial', n]]), 7);
    const incl = (noun: string, incluso: string) => (isIt ? `, ${incluso} ${noun}` : `, including ${noun}`);
    const inclDay = incl(isIt ? (n === 1 ? '1 giorno parziale' : `${n} giorni parziali`) : n === 1 ? '1 partial day' : `${n} partial days`, n === 1 ? 'incluso' : 'inclusi');
    const inclNight = incl(isIt ? (n === 1 ? '1 notte parziale' : `${n} notti parziali`) : n === 1 ? '1 partial night' : `${n} partial nights`, n === 1 ? 'inclusa' : 'incluse');
    expect(s).toContain(inclDay + '. ');
    expect(h).toContain(inclDay + '. ');
    expect(z).toContain(inclNight + '. ');
  });

  it('periodo di 1: «per 1 giorno»/«for 1 day», «1 notte»/«1 night»', () => {
    const { s, h, z } = summaries(build([['measured', 1]]), 1);
    expect(s).toContain(isIt ? 'per 1 giorno. ' : 'for 1 day. ');
    expect(h).toContain(isIt ? 'per 1 giorno. ' : 'for 1 day. ');
    expect(z).toContain(isIt ? 'per 1 notte. ' : 'for 1 night. ');
    for (const t of [s, h, z]) expect(t).not.toMatch(BAD);
  });
});

/** Accordi della schermata Trend (C2-1): funzioni di copy con asserzioni esatte, poi il testo reso. */
describe('accordi della schermata Trend, n = 1 e n = 2', () => {
  const it_ = trendsCopy('it');
  const en = trendsCopy('en');
  const BAD = /\b1 (giorni|notti|days|nights)\b|Sui 1 |Over the 1 days/;

  it('IT: base della media e stat con conteggio di parziali', () => {
    expect(it_.coverage.avgBasis(1, 0)).toBe('Su 1 giorno con dato.');
    expect(it_.coverage.avgBasis(2, 0)).toBe('Sui 2 giorni con dato.');
    expect(it_.coverage.avgBasis(1, 1)).toBe('Su 1 giorno con dato, incluso 1 giorno parziale: può risultare più bassa.');
    expect(it_.coverage.avgBasis(2, 2)).toBe('Sui 2 giorni con dato, inclusi 2 giorni parziali: può risultare più bassa.');
    expect(it_.coverage.avgBasis(0, 0)).toBe('Sui 0 giorni con dato.');
    expect(it_.summary.stats('1', '2', '3', 1)).toBe('Media 1, minimo 2, massimo 3, incluso 1 giorno parziale.');
    expect(it_.summary.stats('1', '2', '3', 2)).toBe('Media 1, minimo 2, massimo 3, inclusi 2 giorni parziali.');
  });

  it('EN: base della media e stat con conteggio di parziali', () => {
    expect(en.coverage.avgBasis(1, 0)).toBe('Over the 1 day with data.');
    expect(en.coverage.avgBasis(2, 0)).toBe('Over the 2 days with data.');
    expect(en.coverage.avgBasis(1, 1)).toBe('Over the 1 day with data, including 1 partial day: it may read lower.');
    expect(en.coverage.avgBasis(2, 2)).toBe('Over the 2 days with data, including 2 partial days: it may read lower.');
    expect(en.coverage.avgBasis(0, 0)).toBe('Over the 0 days with data.');
    expect(en.summary.stats('1', '2', '3', 1)).toBe('Average 1, minimum 2, maximum 3, including 1 partial day.');
    expect(en.summary.stats('1', '2', '3', 2)).toBe('Average 1, minimum 2, maximum 3, including 2 partial days.');
  });

  it('IT/EN: copertura, assenti, parziali, zero, somma, intestazione', () => {
    expect(it_.coverage.headline(1, 7)).toBe('1 giorno su 7 con dato');
    expect(it_.coverage.headline(2, 7)).toBe('2 giorni su 7 con dato');
    expect(en.coverage.headline(1, 7)).toBe('1 of 7 days with data');
    expect(en.coverage.headline(1, 1)).toBe('1 of 1 day with data');
    expect(it_.coverage.absent(1, 'x')).toBe('1 giorno senza dato: x. Non contano come zero.');
    expect(it_.coverage.absent(2, 'x')).toBe('2 giorni senza dato: x. Non contano come zero.');
    expect(en.coverage.absent(1, 'x')).toBe('1 day with no data: x. They do not count as zero.');
    expect(en.coverage.absent(2, 'x')).toBe('2 days with no data: x. They do not count as zero.');
    expect(it_.coverage.partial(1, 'x')).toBe('1 giorno parziale: x. Il valore copre solo una parte del giorno.');
    expect(it_.coverage.partial(2, 'x')).toBe('2 giorni parziali: x. Il valore copre solo una parte del giorno.');
    expect(en.coverage.partial(1, 'x')).toBe('1 partial day: x. The value covers only part of the day.');
    expect(en.coverage.partial(2, 'x')).toBe('2 partial days: x. The value covers only part of the day.');
    expect(it_.coverage.zero(1)).toBe('1 giorno a zero misurato.');
    expect(it_.coverage.zero(2)).toBe('2 giorni a zero misurato.');
    expect(en.coverage.zero(1)).toBe('1 day at measured zero.');
    expect(en.coverage.zero(2)).toBe('2 days at measured zero.');
    expect(it_.coverage.totalAllDays(1)).toBe('Somma di 1 giorno.');
    expect(it_.coverage.totalAllDays(2)).toBe('Somma di tutti i 2 giorni.');
    expect(en.coverage.totalAllDays(1)).toBe('Sum of the 1 day.');
    expect(en.coverage.totalAllDays(2)).toBe('Sum of all 2 days.');
    expect(it_.coverage.totalPartialBasis(1)).toBe('Somma di 1 giorno con dato. I giorni senza dato non sono contati come zero.');
    expect(it_.coverage.totalPartialBasis(2)).toBe('Somma dei 2 giorni con dato. I giorni senza dato non sono contati come zero.');
    expect(en.coverage.totalPartialBasis(1)).toBe('Sum of the 1 day with data. Days with no data are not counted as zero.');
    expect(en.coverage.totalPartialBasis(2)).toBe('Sum of the 2 days with data. Days with no data are not counted as zero.');
    expect(it_.lastDays(1)).toBe('Ultimo giorno');
    expect(it_.lastDays(7)).toBe('Ultimi 7 giorni');
    expect(en.lastDays(1)).toBe('Last day');
    expect(en.lastDays(7)).toBe('Last 7 days');
  });

  it('IT/EN: dati insufficienti e riepilogo', () => {
    expect(it_.insufficient.need(2, 1, 7)).toBe('Servono almeno 2 giorni con dato per mostrare un andamento. In questi 7 giorni ce n’è uno.');
    expect(it_.insufficient.need(1, 0, 1)).toBe('Serve almeno 1 giorno con dato per mostrare un andamento. In questo giorno non ce n’è nessuno.');
    expect(en.insufficient.need(2, 1, 7)).toBe('At least 2 days with data are needed to show a trend. In these 7 days there is one.');
    expect(en.insufficient.need(1, 0, 1)).toBe('At least 1 day with data is needed to show a trend. In this 1 day there are none.');
    expect(it_.summary.insufficient('T', 1, 7)).toBe('T: dati insufficienti, 1 giorno con dato su 7.');
    expect(it_.summary.insufficient('T', 2, 7)).toBe('T: dati insufficienti, 2 giorni con dato su 7.');
    expect(en.summary.insufficient('T', 1, 7)).toBe('T: not enough data, 1 day with data out of 7.');
    expect(en.summary.insufficient('T', 2, 7)).toBe('T: not enough data, 2 days with data out of 7.');
  });

  it.each(['it', 'en'] as const)('testo reso %s: un solo giorno con dato, nessun «1 giorni»', (lc) => {
    const { container } = renderTrends(lc, [abs, abs, abs, abs, abs, abs, val(8000)]);
    const card = container.querySelector('[data-trend-card="steps"]') as HTMLElement;
    expect(card.textContent).not.toMatch(BAD);
    expect(container.textContent).not.toMatch(BAD);
  });

  it.each(['it', 'en'] as const)('testo reso %s: quattro giorni con dato, uno parziale', (lc) => {
    const { container } = renderTrends(lc, [abs, abs, abs, val(8000), val(9000), val(7000), part(3000, 0.3)]);
    const avg = (container.querySelector('[data-trend-card="steps"] [data-stat="avg"]') as HTMLElement).textContent ?? '';
    expect(avg).toContain(lc === 'it' ? 'Sui 4 giorni con dato, incluso 1 giorno parziale' : 'Over the 4 days with data, including 1 partial day');
    expect(container.textContent).not.toMatch(BAD);
  });
});
