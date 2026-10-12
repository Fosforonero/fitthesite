import { cleanup, render, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HeartRateTrendChart } from './HeartRateTrendChart';
import type { ChartDataPoint } from './types';

afterEach(cleanup);

const measured = (date: string, value: number): ChartDataPoint => ({ date, value, state: 'measured' });
const absent = (date: string): ChartDataPoint => ({ date, value: null, state: 'absent' });

describe('HeartRateTrendChart adversarial regressions', () => {
  it('draws two trend segments whose path data contains only numeric coordinates', () => {
    const points: ChartDataPoint[] = [
      measured('2024-01-01', 60),
      measured('2024-01-02', 70),
      absent('2024-01-03'),
      measured('2024-01-04', 80),
      measured('2024-01-05', 90),
    ];
    const { container } = render(
      <HeartRateTrendChart id="api-test-heart" title="Synthetic heart" points={points} period={7} locale="en" />,
    );
    const paths = Array.from(container.querySelectorAll('svg path[stroke]')).filter(
      (p) => !p.closest('defs'),
    );
    expect(paths).toHaveLength(2);
    for (const path of paths) {
      const d = path.getAttribute('d') ?? '';
      expect(d.length).toBeGreaterThan(0);
      expect(d).not.toContain('%');
      expect(d).not.toMatch(/NaN|Infinity/);
      const tokens = d.trim().split(/[\s,]+/).filter((t) => !/^[ML]$/.test(t));
      expect(tokens.length).toBeGreaterThan(0);
      for (const t of tokens) {
        expect(Number.isFinite(Number(t))).toBe(true);
      }
    }
  });

  it.each(['absent', 'error'] as const)('does not fabricate zero statistics for %s slots', (state) => {
      const points: ChartDataPoint[] = [
        { date: '2024-01-01', value: null, state },
        { date: '2024-01-02', value: null, state },
      ];
      const { container } = render(
        <HeartRateTrendChart id="api-test-heart" title="Synthetic heart" points={points} period={7} locale="en" />,
      );
      const summaryEl = container.querySelector('#api-test-heart-summary') ?? container.querySelector('figcaption');
      expect(summaryEl).not.toBeNull();
      const text = summaryEl?.textContent ?? '';
      expect(text).not.toContain('average value of 0 bpm');
      expect(text).not.toContain('min 0 bpm');
      expect(text).not.toContain('max 0 bpm');
      expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  it('resolves aria-describedby on focus to a node inside the chart showing the reading', () => {
    const points = [measured('2024-01-01', 60), measured('2024-01-02', 70)];
    const { container } = render(
      <HeartRateTrendChart id="api-test-heart" title="Synthetic heart" points={points} period={7} locale="en" />,
    );
    const button = container.querySelector('button[aria-label]') as HTMLButtonElement;
    expect(button).not.toBeNull();
    fireEvent.focus(button);
    const ref = button.getAttribute('aria-describedby');
    expect(ref).toBeTruthy();
    for (const token of (ref ?? '').split(/\s+/).filter(Boolean)) {
      const target = document.getElementById(token);
      expect(target).not.toBeNull();
      expect(container.contains(target)).toBe(true);
      expect(target?.textContent ?? '').toContain('60');
    }
  });
});
