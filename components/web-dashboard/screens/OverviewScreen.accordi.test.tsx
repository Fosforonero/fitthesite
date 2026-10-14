import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { absent, partial, value } from '@/lib/web-dashboard/measure';

import { overviewCopy } from './OverviewScreen.copy';
import { OverviewScreen } from './OverviewScreen';
import { screenProps } from './test-utils';

afterEach(cleanup);

/** Ore 10.. con passi misurati, poi parziali: tutte le altre assenti. Testo RESO. */
function renderHours(lc: 'it' | 'en', measured: number, partials: number, steps = 500) {
  const props = screenProps('ok', { lc });
  const hours = props.data.activity.hourlySteps.map((_, h) => {
    if (h >= 10 && h < 10 + measured) return value(steps);
    if (h >= 10 + measured && h < 10 + measured + partials) return partial(100, 0.5, 'incomplete_coverage');
    return absent('no_samples');
  });
  props.data = { ...props.data, activity: { ...props.data.activity, hourlySteps: hours } };
  return render(<OverviewScreen {...props} />).container.innerHTML;
}

describe('OverviewScreen: accordo delle ore e dei passi', () => {
  it('IT: 1 ora con passi, 2 ore con passi', () => {
    const one = renderHours('it', 1, 0);
    expect(one).toContain('1 ora con passi');
    expect(one).not.toContain('1 ore con passi');
    expect(renderHours('it', 2, 0)).toContain('2 ore con passi');
  });
  it('EN: 1 hour with steps, 2 hours with steps', () => {
    expect(renderHours('en', 1, 0)).toContain('1 hour with steps');
    expect(renderHours('en', 1, 0)).not.toContain('1 hours with steps');
    expect(renderHours('en', 2, 0)).toContain('2 hours with steps');
  });
  it('IT: 1 parziale, 2 parziali', () => {
    const one = renderHours('it', 1, 1);
    expect(one).toContain('1 parziale,');
    expect(one).not.toContain('1 parziali');
    expect(renderHours('it', 1, 2)).toContain('2 parziali');
  });
  it('EN: 1 partial, 2 partial', () => {
    expect(renderHours('en', 1, 1)).toContain('1 partial');
    expect(renderHours('en', 1, 2)).toContain('2 partial');
  });
  it('IT: ora di punta con 1 passo, con 2 passi (titolo e riepilogo)', () => {
    const one = renderHours('it', 1, 0, 1);
    expect(one).toContain('Ora di punta 10:00, 1 passo');
    expect(one).not.toMatch(/(?<![\d.])1 passi/);
    expect(renderHours('it', 1, 0, 2)).toContain('Ora di punta 10:00, 2 passi');
  });
  it('EN: peak hour with 1 step, with 2 steps', () => {
    const one = renderHours('en', 1, 0, 1);
    expect(one).toContain('Peak hour 10:00, 1 step');
    expect(one).not.toMatch(/(?<![\d,])1 steps/);
    expect(renderHours('en', 1, 0, 2)).toContain('Peak hour 10:00, 2 steps');
  });
});

describe('OverviewScreen.copy: giorni misurati', () => {
  it('«n di of» regge il singolare quando il totale e 1', () => {
    expect(overviewCopy('it').week.measuredOf(1, 7)).toBe('1 di 7 giorni misurati');
    expect(overviewCopy('it').week.measuredOf(1, 1)).toBe('1 di 1 giorno misurato');
    expect(overviewCopy('en').week.measuredOf(1, 7)).toBe('1 of 7 days measured');
    expect(overviewCopy('en').week.measuredOf(1, 1)).toBe('1 of 1 day measured');
    expect(overviewCopy('en').week.measuredOf(2, 2)).toBe('2 of 2 days measured');
  });
});
