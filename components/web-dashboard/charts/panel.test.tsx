import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TrendChartsPanel, type TrendChartsPanelProps } from './TrendChartsPanel';
import type { Measure } from '@/lib/web-dashboard/measure';
import { sharedCopy } from '@/lib/web-dashboard/copy';
import { trendsCopy } from '../screens/TrendsScreen.copy';

const copy = sharedCopy('en');
const text = trendsCopy('en');
const date = (i: number) => `2024-01-${String(i + 1).padStart(2, '0')}`;
const days = (ms: Measure<number>[]) => ms.map((m, i) => ({ date: date(i), m }));
const val = (value: number): Measure<number> => ({ kind: 'value', value });
const base: TrendChartsPanelProps = { idPrefix: 'panel', series: [], locale: 'en', period: 7, isDemo: true, copy, text };
const ui = (over: Partial<TrendChartsPanelProps> = {}) => <TrendChartsPanel {...base} {...over} />;

afterEach(cleanup);

describe('TrendChartsPanel', () => {
  it('preserves measured-zero, partial and absent states', () => {
    const part: Measure<number> = { kind: 'partial', value: 3000, coverage: 0.5, note: 'incomplete_coverage' };
    const abs: Measure<number> = { kind: 'absent', reason: 'no_data_received' };
    const series = [
      { metric: 'steps' as const, days: days([val(0), val(5000), part, val(6000)]) },
      { metric: 'restingHr' as const, days: days([val(60), abs, val(62), val(61)]) },
      { metric: 'sleepMinutes' as const, days: days([val(400), val(420), val(430), val(410)]) },
    ];
    const { container } = render(ui({ series }));
    expect(container.querySelectorAll('[data-chart-panel-metric]')).toHaveLength(3);
    const zero = container.querySelector(`tr[data-date="${date(0)}"][data-slot-state="measured-zero"]`) as HTMLElement;
    expect(within(zero).getByText(copy.measure.zeroMeasured)).toBeTruthy();
    const partial = container.querySelector('tr[data-slot-state="partial"]') as HTMLElement;
    expect(partial.textContent).toContain(copy.measure.partial.incomplete_coverage);
    const absent = container.querySelector('tr[data-slot-state="absent"]') as HTMLElement;
    expect(absent.textContent).toContain(copy.measure.absent.no_data_received);
    expect(absent.textContent).not.toMatch(/\b0\b/);
  });

  it('shows insufficient cards without SVG charts and no demo fixture', () => {
    const series = [{ metric: 'steps' as const, days: days([val(1), val(2)]) }];
    const { container } = render(ui({ series }));
    expect(container.querySelectorAll('[data-chart-insufficient]')).toHaveLength(3);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelectorAll('[data-chart-panel-metric]')).toHaveLength(0);
    const { container: empty } = render(ui({ series: [] }));
    expect(empty.querySelectorAll('[data-chart-insufficient]')).toHaveLength(3);
    expect(empty.querySelector('svg')).toBeNull();
  });

  it('keeps supplied order and shows last 7 or all 30 days', () => {
    const all = Array.from({ length: 30 }, (_, i) => ({ date: date(i), m: val(1000 + i) }));
    const series = (['steps', 'restingHr', 'sleepMinutes'] as const).map((metric) => ({ metric, days: all }));
    const { container, rerender } = render(ui({ series, period: 7 }));
    const dates = () => Array.from(container.querySelectorAll('tr[data-date]')).map((r) => r.getAttribute('data-date'));
    const first = dates().slice(0, 7);
    expect(first).toEqual(all.slice(-7).map((d) => d.date));
    rerender(ui({ series, period: 30 }));
    expect(dates().slice(0, 30)).toEqual(all.map((d) => d.date));
  });

  it('throws on unsupported locale or period', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(ui({ series: [], locale: 'fr' as never }))).toThrow();
    expect(() => render(ui({ series: [], period: 90 as never }))).toThrow();
    spy.mockRestore();
    expect(screen.queryByRole('region')).toBeNull();
  });
});
