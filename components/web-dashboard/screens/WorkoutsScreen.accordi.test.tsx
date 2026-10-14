import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { absent, partial, value } from '@/lib/web-dashboard/measure';

import { WorkoutsScreen } from './WorkoutsScreen';
import { screenProps } from './test-utils';

afterEach(cleanup);

/** Settimana con `measured` giorni a durata completa e `partials` parziali: gli altri assenti. Testo RESO. */
function renderWeek(lc: 'it' | 'en', measured: number, partials: number) {
  const props = screenProps('ok', { lc });
  const week = props.data.workouts.week.map((d, i) => {
    if (i < measured) return { ...d, count: value(1), durationMin: value(30) };
    if (i < measured + partials) return { ...d, count: value(1), durationMin: partial(20, 0.5, 'incomplete_coverage') };
    return { ...d, count: absent('no_samples'), durationMin: absent('no_samples') };
  });
  props.data = { ...props.data, workouts: { ...props.data.workouts, week } };
  return render(<WorkoutsScreen {...props} />).container.innerHTML;
}

describe('WorkoutsScreen: accordo del riepilogo settimanale', () => {
  it('IT: 1 giorno con durata completa, 2 giorni', () => {
    const one = renderWeek('it', 1, 0);
    expect(one).toContain('1 giorno con durata completa');
    expect(one).not.toContain('1 giorni con durata completa');
    expect(renderWeek('it', 2, 0)).toContain('2 giorni con durata completa');
  });
  it('IT: 1 parziale, 2 parziali', () => {
    const one = renderWeek('it', 0, 1);
    expect(one).toContain(', 1 parziale,');
    expect(one).not.toContain('1 parziali');
    expect(renderWeek('it', 0, 2)).toContain(', 2 parziali,');
  });
  it('EN: 1 day with complete duration, 2 days', () => {
    const one = renderWeek('en', 1, 0);
    expect(one).toContain('1 day with complete duration');
    expect(one).not.toContain('1 days with complete duration');
    expect(renderWeek('en', 2, 0)).toContain('2 days with complete duration');
  });
  it('EN: 1 partial, 2 partial', () => {
    expect(renderWeek('en', 0, 1)).toContain(', 1 partial,');
    expect(renderWeek('en', 0, 2)).toContain(', 2 partial,');
  });
});
