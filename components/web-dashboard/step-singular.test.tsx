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
