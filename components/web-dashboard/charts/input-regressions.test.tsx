import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HeartRateTrendChart } from './HeartRateTrendChart';
import { DailyStepsChart } from './DailyStepsChart';
import { SleepDurationChart } from './SleepDurationChart';
import type { ChartDataPoint } from './types';

afterEach(cleanup);
const point = (date: string, value: number): ChartDataPoint => ({ date, value, state: 'measured' });
const props = { id: 'input-chart', title: 'Synthetic chart', period: 7 as const, locale: 'en', isDemo: true };

describe('defensive chart inputs and series changes', () => {
  it.each([NaN, Infinity, -Infinity, -1])('treats invalid numeric input %s as an error and a line gap', (bad) => {
    const { container } = render(<HeartRateTrendChart {...props} points={[
      point('2026-09-01', 60), point('2026-09-02', bad), point('2026-09-03', 70),
    ]} />);
    expect(container.querySelector('button[data-date="2026-09-02"]')?.getAttribute('data-slot-state')).toBe('error');
    expect(container.querySelectorAll('[data-line-point]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-line-path]')).toHaveLength(0);
    expect(container.querySelector('#input-chart-summary')?.textContent).not.toMatch(/NaN|Infinity/);
    for (const el of container.querySelectorAll('svg [x],svg [y],svg [cx],svg [cy],svg [height],svg [d]')) {
      for (const attribute of ['x', 'y', 'cx', 'cy', 'height', 'd']) expect(el.getAttribute(attribute) ?? '').not.toMatch(/NaN|Infinity/);
    }
  });
  it.each([['steps', DailyStepsChart], ['heart', HeartRateTrendChart], ['sleep', SleepDurationChart]] as const)('does not count stale missing values as measured zeros (%s)', (_name, Component) => {
    const { container } = render(<Component {...props} points={[
      { date: '2026-09-01', state: 'absent', value: 0 },
      { date: '2026-09-02', state: 'error', value: 0 }, point('2026-09-03', 60),
    ]} />);
    expect(container.querySelector('#input-chart-summary')?.textContent).not.toContain('with measured zero');
  });
  it('does not collapse distinct sleep durations above eleven hours', () => {
    const { container } = render(<SleepDurationChart {...props} points={[
      point('2026-09-01', 600), point('2026-09-02', 720), point('2026-09-03', 840),
    ]} />);
    const short = Number(container.querySelector('[data-bar][data-date="2026-09-02"]')?.getAttribute('height'));
    const long = Number(container.querySelector('[data-bar][data-date="2026-09-03"]')?.getAttribute('height'));
    expect(long).toBeGreaterThan(short);
  });
  it('does not retarget a pinned tooltip to another day after the series changes', () => {
    const { container, rerender } = render(<HeartRateTrendChart {...props} points={[point('2026-09-01', 60)]} />);
    fireEvent.click(container.querySelector('button[data-date]')!);
    expect(container.querySelector('[data-active-tooltip]')?.getAttribute('data-date')).toBe('2026-09-01');
    rerender(<HeartRateTrendChart {...props} points={[point('2026-10-01', 70)]} />);
    expect(container.querySelector('[data-active-tooltip]')?.getAttribute('data-date')).toBeNull();
    fireEvent.mouseEnter(container.querySelector('button[data-date]')!);
    expect(container.querySelector('[data-active-tooltip]')?.getAttribute('data-date')).toBe('2026-10-01');
  });
  it('does not join across a partial day while still showing its point', () => {
    const points: ChartDataPoint[] = [point('2026-09-01', 60), { ...point('2026-09-02', 70), state: 'partial', coverage: 0.5 }, point('2026-09-03', 80)];
    const { container } = render(<HeartRateTrendChart {...props} points={points} />);
    expect(container.querySelectorAll('[data-line-point]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-line-path]')).toHaveLength(0);
  });
  it('keeps the partial pattern and state on a zero-valued partial bar', () => {
    const { container } = render(<DailyStepsChart {...props} points={[{ ...point('2026-09-01', 0), state: 'partial', coverage: 0.25 }]} />);
    const bar = container.querySelector('[data-bar]');
    expect(bar?.getAttribute('data-slot-state')).toBe('partial');
    expect(bar?.getAttribute('fill')).toContain('partial');
    expect(container.querySelector('#input-chart-summary')?.textContent).not.toContain('with measured zero');
  });
});
