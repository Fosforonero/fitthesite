/**
 * Residui di revisione B3c-0 (F2, F3, F4 di REV-B3b). Dati INLINE, nessuna fixture del prototipo.
 */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DailyStepsChart } from './DailyStepsChart';
import type { ChartDataPoint } from './types';

afterEach(cleanup);

const P = (i: number, value: number | null, state: ChartDataPoint['state']): ChartDataPoint => ({
  date: `2026-10-${String(i + 1).padStart(2, '0')}`,
  value,
  state,
});

function monta(points: ChartDataPoint[], extra: { isDemo: boolean } & Record<string, unknown>, locale = 'it') {
  const { container } = render(
    <DailyStepsChart id="t" title="Passi" points={points} period={30} locale={locale} {...extra} />,
  );
  const bottoni = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-slot-index]'));
  return { container, bottoni };
}

describe('F3: etichetta accessibile di uno stato senza valore con valueLabels', () => {
  it('non accoda l\'unita\' dopo il testo nullo (come il tooltip)', () => {
    const { bottoni, container } = monta(
      [P(0, null, 'ambiguous'), P(1, null, 'error'), P(2, 4000, 'received')],
      { isDemo: false, valueLabels: { ambiguous: 'piu\' valori', error: 'n.d.' } },
    );
    const a = bottoni[0].getAttribute('aria-label')!;
    const e = bottoni[1].getAttribute('aria-label')!;
    for (const l of [a, e]) expect(l).not.toMatch(/passi/);
    expect(a).toContain('piu\' valori');
    expect(a).toContain('Ambiguo');
    expect(e).toContain('n.d.');
    expect(e).toContain('Errore');
    // il tooltip non cambia: nessuna unita' accanto al testo nullo
    fireEvent.click(bottoni[0]);
    expect(container.querySelector('#t-tooltip')!.textContent).not.toMatch(/\(passi\)/);
    // un valore reale conserva l'unita'
    expect(bottoni[2].getAttribute('aria-label')).toMatch(/passi/);
  });
});

describe('F2: l\'anteprima (isDemo=true) tiene `received` fuori dalla media', () => {
  it('media di 4.000 con measured 4000 + received 9000', () => {
    const { container } = monta([P(0, 4000, 'measured'), P(1, 9000, 'received')], { isDemo: true });
    const t = container.querySelector('#t-summary')!.textContent!;
    expect(t).toMatch(/media di 4\.?000 passi/);
    expect(t).toMatch(/1 giorno con misurazione registrata su 2/);
  });
  it('frasi dimostrative dei nuovi stati (IT)', () => {
    const { container } = monta(
      [P(0, 4000, 'measured'), P(1, 3100, 'received'), P(2, null, 'ambiguous'), P(3, null, 'undetermined'), P(4, null, 'placeholder')],
      { isDemo: true },
    );
    const t = container.querySelector('#t-summary')!.textContent!;
    expect(t).toContain('1 giorno con valore ricevuto');
    expect(t).toContain('1 giorno con piu\' righe, valore non scelto');
    expect(t).toContain('1 giorno con zero non determinabile');
    expect(t).toContain('1 giorno con segnaposto');
  });
  it('frasi dimostrative dei nuovi stati (EN)', () => {
    const { container } = monta(
      [P(0, 4000, 'measured'), P(1, 3100, 'received'), P(2, null, 'ambiguous'), P(3, null, 'undetermined'), P(4, null, 'placeholder')],
      { isDemo: true },
      'en',
    );
    const t = container.querySelector('#t-summary')!.textContent!;
    expect(t).toContain('1 day with received value');
    expect(t).toContain('1 day with several rows, no value chosen');
    expect(t).toContain('1 day with undetermined zero');
    expect(t).toContain('1 day with placeholder');
  });
});

describe('F4: legenda e barra di `received` coerenti, senza apparire una misura provata', () => {
  it('il campione di legenda di received non ha bordo che la barra non ha', () => {
    const { container } = monta([P(0, 4000, 'measured'), P(1, 3100, 'received')], { isDemo: false });
    const sw = (s: string) => container.querySelector(`[data-legend-state="${s}"] > span`)!.className;
    expect(sw('received')).toBe(sw('measured'));
    const barra = container.querySelector('rect[data-bar][data-slot-state="received"]')!;
    expect(barra.getAttribute('stroke')).toBeNull();
  });
  it('il distintivo di received non usa il verde di una misura valida', () => {
    const { container, bottoni } = monta([P(0, 4000, 'measured'), P(1, 3100, 'received')], { isDemo: false });
    const badge = () => container.querySelector('#t-tooltip span[class*="rounded text-[11px]"]')!.className;
    fireEvent.click(bottoni[0]);
    expect(badge()).toContain('text-success');
    fireEvent.click(bottoni[1]);
    expect(badge()).not.toContain('success');
  });
});
