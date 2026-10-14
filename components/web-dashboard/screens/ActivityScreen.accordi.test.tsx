import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { absent, value } from '@/lib/web-dashboard/measure';

import { ActivityScreen } from './ActivityScreen';
import { screenProps } from './test-utils';

afterEach(cleanup);

/** Testo RESO della schermata Attivita' con i passi del giorno o le ore decise dal test. */
function renderSteps(lc: 'it' | 'en', missing: number) {
  const props = screenProps('ok', { lc });
  const goal = props.data.activity.goalSteps;
  props.data = { ...props.data, activity: { ...props.data.activity, steps: value(goal - missing) } };
  return render(<ActivityScreen {...props} />).container.innerHTML;
}

function renderPeak(lc: 'it' | 'en', steps: number) {
  const props = screenProps('ok', { lc });
  const hours = props.data.activity.hourlySteps.map((_, h) => (h === 10 ? value(steps) : absent('no_samples')));
  props.data = { ...props.data, activity: { ...props.data.activity, hourlySteps: hours } };
  return render(<ActivityScreen {...props} />).container.innerHTML;
}

describe('ActivityScreen: accordo dei passi', () => {
  it('IT: «Manca 1 passo», «Mancano 2 passi»', () => {
    const one = renderSteps('it', 1);
    expect(one).toContain('Manca 1 passo');
    expect(one).not.toContain('Mancano 1 passi');
    expect(renderSteps('it', 2)).toContain('Mancano 2 passi');
  });
  it('EN: «1 step to go», «2 steps to go»', () => {
    expect(renderSteps('en', 1)).toContain('1 step to go');
    expect(renderSteps('en', 1)).not.toContain('1 steps to go');
    expect(renderSteps('en', 2)).toContain('2 steps to go');
  });
  it('IT: ora piu attiva con 1 passo, con 2 passi', () => {
    expect(renderPeak('it', 1)).toContain('10:00, 1 passo.');
    expect(renderPeak('it', 2)).toContain('10:00, 2 passi.');
  });
  it('EN: most active hour with 1 step, with 2 steps', () => {
    expect(renderPeak('en', 1)).toContain('10:00, 1 step.');
    expect(renderPeak('en', 2)).toContain('10:00, 2 steps.');
  });
});
