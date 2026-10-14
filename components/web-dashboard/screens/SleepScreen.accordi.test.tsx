import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { absent, partial, value } from '@/lib/web-dashboard/measure';
import type { DashboardData } from '@/lib/web-dashboard/model';

import { SleepScreen } from './SleepScreen';
import { screenProps } from './test-utils';

afterEach(cleanup);

/**
 * Accordi singolare/plurale residui (SITE-SOCIAL-RELEASE-01, lotto CD): il test legge il testo RESO,
 * non il sorgente. Le 7 notti sono tutte assenti salvo quelle scelte dal test.
 */
function renderNights(lc: 'it' | 'en', complete: number, partials: number) {
  const props = screenProps('ok', { lc });
  const data: DashboardData = JSON.parse(JSON.stringify(props.data));
  data.sleep.night = absent('no_samples');
  const days = data.trends.find((t) => t.metric === 'sleepMinutes')!.days;
  const i = days.findIndex((d) => d.date === data.date);
  for (let k = 0; k < 7; k++) days[i - k].m = absent('no_samples');
  for (let k = 1; k <= complete; k++) days[i - k].m = value(400 + k);
  for (let k = 1; k <= partials; k++) days[i - complete - k].m = partial(200, 0.5, 'incomplete_coverage');
  const { container } = render(<SleepScreen {...props} data={data} />);
  return container.innerHTML;
}

describe('SleepScreen: accordo del conteggio delle notti', () => {
  it('IT: 1 notte completa, 2 notti complete', () => {
    expect(renderNights('it', 1, 0)).toContain('1 notte completa su 7');
    expect(renderNights('it', 2, 0)).toContain('2 notti complete su 7');
    expect(renderNights('it', 0, 0)).not.toContain('notti complete su');
  });
  it('EN: 1 complete night, 2 complete nights', () => {
    expect(renderNights('en', 1, 0)).toContain('1 complete night of 7');
    expect(renderNights('en', 2, 0)).toContain('2 complete nights of 7');
  });
  it('IT: 1 parziale, 2 parziali (riepilogo del grafico)', () => {
    const one = renderNights('it', 0, 1);
    expect(one).toContain('1 parziale');
    expect(one).not.toContain('1 parziali');
    expect(renderNights('it', 0, 2)).toContain('2 parziali');
  });
  it('EN: 1 partial, 2 partial', () => {
    expect(renderNights('en', 0, 1)).toContain('1 partial,');
    expect(renderNights('en', 0, 2)).toContain('2 partial,');
  });
});
