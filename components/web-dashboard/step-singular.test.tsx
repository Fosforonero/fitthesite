/**
 * CD2: «1 passo» / «1 step» al singolare, ovunque il numero arrivi dalla stessa unita'.
 * Si legge il testo RESO (contenuto, aria-label, title, <title>) con una serie di soli «1»
 * (n = 1) e di soli «2» (n = 2, resta plurale). I numeri non cambiano: cambia solo la parola.
 * Dati solo sintetici.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Measure } from '@/lib/web-dashboard/measure';
import type { TrendSeries } from '@/lib/web-dashboard/model';
import { TrendChartsPanel } from './charts/TrendChartsPanel';
import { sharedCopy } from '@/lib/web-dashboard/copy';
import { trendsCopy } from './screens/TrendsScreen.copy';
import { ActivityScreen } from './screens/ActivityScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { TrendsScreen } from './screens/TrendsScreen';
import { screenProps } from './screens/test-utils';

afterEach(cleanup);

const val = (value: number): Measure<number> => ({ kind: 'value', value });

function allText(container: HTMLElement): string {
  const parts: string[] = [container.textContent ?? ''];
  container.querySelectorAll('*').forEach((n) => {
    for (const a of ['aria-label', 'title']) {
      const v = n.getAttribute(a);
      if (v) parts.push(v);
    }
  });
  return parts.join('\n');
}

/** Testo con uno spazio al posto di ogni tag: le celle di tabella non si incollano al numero precedente. */
function spaced(container: HTMLElement): string {
  return container.innerHTML.replace(/<[^>]+>/g, ' ');
}

function build(lc: 'it' | 'en', n: number) {
  const base = screenProps('ok', { lc });
  const trends: TrendSeries[] = base.data.trends.map((s) =>
    s.metric === 'steps' ? { ...s, days: s.days.map((d) => ({ ...d, m: val(n) })) } : s,
  );
  const activity = {
    ...base.data.activity,
    steps: val(n),
    hourlySteps: base.data.activity.hourlySteps.map(() => val(n)),
  };
  return { ...base, data: { ...base.data, trends, activity } };
}

const SINGULAR = (lc: 'it' | 'en') => (lc === 'it' ? /(?<![\d.,])1\s*passi(?![a-z])/ : /(?<![\d.,])1\s*steps(?![a-z])/);
const ONE = (lc: 'it' | 'en') => (lc === 'it' ? /(?<![\d.,])1\s*passo(?![a-z])/ : /(?<![\d.,])1\s*step(?![a-z])/);
const TWO = (lc: 'it' | 'en') => (lc === 'it' ? /(?<![\d.,])2\s*passi(?![a-z])/ : /(?<![\d.,])2\s*steps(?![a-z])/);

const SCREENS = [
  ['Trends', TrendsScreen],
  ['Overview', OverviewScreen],
  ['Activity', ActivityScreen],
] as const;

describe.each(['it', 'en'] as const)('passo/step singolare %s', (lc) => {
  for (const [name, Screen] of SCREENS) {
    it(`${name}: con n = 1 mai «1 ${lc === 'it' ? 'passi' : 'steps'}»`, () => {
      const { container } = render(<Screen {...build(lc, 1)} />);
      const t = allText(container);
      expect(t).not.toMatch(SINGULAR(lc));
      expect(t).toMatch(ONE(lc));
    });
    it(`${name}: con n = 2 resta il plurale`, () => {
      const { container } = render(<Screen {...build(lc, 2)} />);
      const t = allText(container);
      expect(t).toMatch(TWO(lc));
      expect(t).not.toMatch(lc === 'it' ? /(?<![\d.,])2\s*passo(?![a-z])/ : /(?<![\d.,])2\s*step(?![a-z])/);
    });
  }

  it('Trends: frase del grafico e riepilogo della scheda con n = 1', () => {
    const { container } = render(<TrendsScreen {...build(lc, 1)} />);
    const t = allText(container);
    expect(t).toMatch(lc === 'it' ? /media di 1 passo al giorno/ : /average of 1 step per day/);
    expect(t).toMatch(lc === 'it' ? /Media 1 passo, minimo 1 passo, massimo 1 passo/ : /Average 1 step, minimum 1 step, maximum 1 step/);
  });

  it('Trends: frase del grafico con n = 2 resta plurale', () => {
    const { container } = render(<TrendsScreen {...build(lc, 2)} />);
    const t = allText(container);
    expect(t).toMatch(lc === 'it' ? /media di 2 passi al giorno/ : /average of 2 steps per day/);
    expect(t).toMatch(lc === 'it' ? /Media 2 passi, minimo 2 passi, massimo 2 passi/ : /Average 2 steps, minimum 2 steps, maximum 2 steps/);
  });
});

describe.each(['it', 'en'] as const)('tabella accessibile con pochi giorni (TrendChartsPanel) %s', (lc) => {
  const renderPanel = (n: number) => {
    const absent: Measure<number> = { kind: 'absent', reason: 'no_data_received' };
    const ms = [val(n), val(n), absent, absent, absent, absent, absent];
    const days = ms.map((m, i) => ({ date: `2026-09-${String(17 + i).padStart(2, '0')}`, m }));
    const series: TrendSeries[] = [{ metric: 'steps', days } as TrendSeries];
    return render(
      <TrendChartsPanel idPrefix="p" series={series} period={7} locale={lc} isDemo={true} copy={sharedCopy(lc)} text={trendsCopy(lc)} />,
    );
  };
  it('n = 1: singolare nella tabella', () => {
    const t = spaced(renderPanel(1).container);
    expect(t).not.toMatch(SINGULAR(lc));
    expect(t).toMatch(ONE(lc));
  });
  it('n = 2: plurale nella tabella', () => {
    expect(spaced(renderPanel(2).container)).toMatch(TWO(lc));
  });
});
