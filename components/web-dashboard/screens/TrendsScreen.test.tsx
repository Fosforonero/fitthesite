import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { ScreenProps } from '../screen-types';
import { TrendsScreen } from './TrendsScreen';
import { forbiddenCopyIn, screenProps } from './test-utils';

afterEach(cleanup);

const withRange = (lc: string, range: 7 | 30 | 90): ScreenProps => {
  const p = screenProps('ok', { lc });
  return { ...p, params: { ...p.params, range } };
};
const panel = (c: HTMLElement) => c.querySelector('[data-interactive-charts-section]');

describe('TrendsScreen: pannello grafici nella sola preview locale', () => {
  for (const lc of ['it', 'en'] as const) {
    for (const range of [7, 30] as const) {
      it(`${lc}/${range}: pannello presente, tre grafici, marcatura demo`, () => {
        const { container } = render(<TrendsScreen {...withRange(lc, range)} />);
        expect(panel(container)).not.toBeNull();
        expect(container.querySelectorAll('[data-chart-panel-metric], [data-chart-insufficient]')).toHaveLength(3);
        const demo = lc === 'it' ? 'Dati dimostrativi' : 'Demo data';
        expect(container.textContent).toContain(demo);
        // il periodo scelto e' quello mostrato, non un altro
        expect(container.querySelector(`[data-range="${range}"][aria-current="true"]`)).not.toBeNull();
        expect(container.querySelectorAll('tr[data-date]').length).toBeGreaterThanOrEqual(range);
        expect(forbiddenCopyIn(container)).toEqual([]);
      });
    }
  }

  for (const lc of ['it', 'en'] as const) {
    it(`${lc}/90: pannello assente, schermata invariata, nessun 90 -> 7`, () => {
      const props = withRange(lc, 90);
      const { container } = render(<TrendsScreen {...props} />);
      expect(panel(container)).toBeNull();
      expect(container.querySelector('[data-chart-panel-metric]')).toBeNull();
      expect(container.querySelector('[data-range="90"][aria-current="true"]')).not.toBeNull();
      expect(container.querySelector('[data-screen="trends"]')).not.toBeNull();
      expect(container.querySelectorAll('[data-trend-card], article, section').length).toBeGreaterThan(0);
    });
  }

  for (const range of [7, 30, 90] as const) {
    it(`locale non supportato (de) / ${range}: pannello assente, nessun throw`, () => {
      const props = withRange('de', range);
      expect(() => render(<TrendsScreen {...props} />)).not.toThrow();
      expect(panel(document.body)).toBeNull();
      expect(document.querySelector('[data-screen="trends"]')).not.toBeNull();
    });
  }
});
