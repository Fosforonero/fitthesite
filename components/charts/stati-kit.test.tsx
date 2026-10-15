/**
 * Stati nuovi del kit condiviso: ricevuto, ambiguo, non determinabile, segnaposto.
 * Dati INLINE: nessuna fixture del prototipo. Ogni coppia che il percorso reale deve
 * tenere distinta e' provata nel markup, nell'etichetta accessibile, nel tooltip e nella tabella.
 */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DailyStepsChart } from './DailyStepsChart';
import { InteractiveChart } from './InteractiveChart';
import { normalizeChartPoints } from './normalize-points';
import type { ChartDataPoint, ChartSlotState } from './types';

afterEach(cleanup);

const TUTTI: ChartSlotState[] = [
  'measured', 'measured-zero', 'partial', 'absent', 'error',
  'received', 'ambiguous', 'undetermined', 'placeholder',
];

function punto(i: number, state: ChartSlotState): ChartDataPoint {
  const date = `2026-10-${String(i + 1).padStart(2, '0')}`;
  switch (state) {
    case 'measured': return { date, value: 4000, state };
    case 'measured-zero': return { date, value: 0, state };
    case 'partial': return { date, value: 2500, state, coverage: 0.5 };
    case 'received': return { date, value: 3100, state };
    default: return { date, value: null, state };
  }
}
const serie = (stati: ChartSlotState[]) => stati.map((s, i) => punto(i, s));

function monta(stati: ChartSlotState[], extra: Record<string, unknown> = {}) {
  const { container } = render(
    <DailyStepsChart id="t" title="Passi" points={serie(stati)} period={30} locale="it" isDemo={false} {...extra} />,
  );
  const bottoni = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-slot-index]'));
  const righe = Array.from(container.querySelectorAll<HTMLTableRowElement>('tr[data-slot-state]'));
  return { container, bottoni, righe };
}

describe('i nove stati restano distinti nel markup, nell\'etichetta accessibile e nella tabella', () => {
  it('ogni stato ha il proprio data-slot-state, la propria etichetta e la propria riga', () => {
    const { bottoni, righe } = monta(TUTTI);
    expect(bottoni.map((b) => b.dataset.slotState)).toEqual(TUTTI);
    expect(righe.map((r) => r.dataset.slotState)).toEqual(TUTTI);
    const celleStato = righe.map((r) => r.querySelectorAll('td')[2].textContent);
    expect(new Set(celleStato).size).toBe(TUTTI.length);
    const etichette = bottoni.map((b) => b.getAttribute('aria-label'));
    expect(new Set(etichette).size).toBe(TUTTI.length);
  });

  it('zero misurato != non determinabile != segnaposto', () => {
    const { bottoni, righe } = monta(['measured-zero', 'undetermined', 'placeholder']);
    const [z, u, s] = bottoni.map((b) => b.getAttribute('aria-label')!);
    expect(z).toContain('Zero misurato');
    expect(z).toMatch(/: 0 /);
    for (const l of [u, s]) expect(l).not.toMatch(/: 0 /);
    expect(u).not.toContain('Zero misurato');
    expect(s).not.toContain('Zero misurato');
    expect(righe[1].querySelectorAll('td')[1].textContent).not.toBe('0');
    expect(righe[2].querySelectorAll('td')[1].textContent).not.toBe('0');
    expect(righe[1].textContent).not.toBe(righe[2].textContent);
  });

  it('parziale != errore e assente != ambiguo; ambiguo non dice mai "nessun dato"', () => {
    const { bottoni, righe } = monta(['partial', 'error', 'absent', 'ambiguous']);
    const l = bottoni.map((b) => b.getAttribute('aria-label')!);
    expect(l[0]).toContain('Parziale');
    expect(l[1]).not.toContain('Parziale');
    expect(l[2]).toContain('Nessun dato');
    expect(l[3]).not.toContain('Nessun dato');
    expect(l[3]).toContain('Ambiguo');
    expect(righe[3].textContent).not.toContain('Nessun dato');
    expect(righe[2].dataset.slotState).not.toBe(righe[3].dataset.slotState);
  });

  it('ricevuto != misurato: nessuna copertura, etichetta propria, barra piena', () => {
    const { container, bottoni, righe } = monta(['measured', 'received']);
    expect(bottoni[1].getAttribute('aria-label')).toContain('Ricevuto');
    expect(bottoni[1].getAttribute('aria-label')).not.toContain('Misurato');
    expect(righe[1].querySelectorAll('td')[3].textContent).toBe('');
    const barra = container.querySelector('rect[data-bar][data-slot-state="received"]')!;
    expect(barra).not.toBeNull();
    expect(barra.getAttribute('fill')).not.toMatch(/partial/);
    expect(barra.getAttribute('fill')).toBe(container.querySelector('rect[data-bar][data-slot-state="measured"]')!.getAttribute('fill'));
  });
});

describe('disegno: i valori nulli non diventano mai barre ne\' zero', () => {
  it('ambiguo, non determinabile e segnaposto: sfondo tratteggiato, nessuna barra', () => {
    const { container } = monta(['ambiguous', 'undetermined', 'placeholder']);
    expect(container.querySelectorAll('rect[data-bar]').length).toBe(0);
    for (const s of ['ambiguous', 'undetermined', 'placeholder']) {
      const r = container.querySelector(`svg rect[data-slot-state="${s}"]`)!;
      expect(r, s).not.toBeNull();
      expect(r.getAttribute('stroke-dasharray')).toBeTruthy();
    }
  });

  it('un valore passato con uno stato nullo viene scartato dalla normalizzazione', () => {
    const n = normalizeChartPoints([
      { date: '2026-10-01', value: 0, state: 'undetermined' },
      { date: '2026-10-02', value: 5, state: 'ambiguous' },
      { date: '2026-10-03', value: 7, state: 'placeholder' },
      { date: '2026-10-04', value: 0, state: 'received' },
      { date: '2026-10-05', value: null, state: 'received' },
      { date: '2026-10-06', value: 12, state: 'received' },
    ]);
    expect(n.map((p) => [p.state, p.value])).toEqual([
      ['undetermined', null], ['ambiguous', null], ['placeholder', null],
      ['error', null], ['error', null], ['received', 12],
    ]);
  });

  it('i quattro stati vecchi si normalizzano come prima', () => {
    const n = normalizeChartPoints([
      { date: '2026-10-01', value: 0, state: 'measured' },
      { date: '2026-10-02', value: 3, state: 'partial', coverage: 0.4 },
      { date: '2026-10-03', value: 9, state: 'absent' },
    ]);
    expect(n.map((p) => [p.state, p.value])).toEqual([['measured-zero', 0], ['partial', 3], ['absent', null]]);
  });
});

describe('tooltip', () => {
  it('mostra etichetta e testo del valore propri per ciascuno stato nuovo', () => {
    const { container, bottoni } = monta(['received', 'ambiguous', 'undetermined', 'placeholder']);
    const tip = container.querySelector('#t-tooltip')!;
    const attesi = ['Ricevuto', 'Ambiguo', 'Non determinabile', 'Segnaposto'];
    bottoni.forEach((b, i) => {
      fireEvent.click(b);
      expect(tip.textContent).toContain(attesi[i]);
      if (i > 0) {
        expect(tip.textContent).not.toContain('Nessun dato');
        expect(tip.textContent).not.toMatch(/:\s*0\b/);
      }
    });
  });
});

describe('etichette passate dal chiamante', () => {
  it('stateLabels e valueLabels sostituiscono i testi del kit senza duplicarlo', () => {
    const { container, bottoni, righe } = monta(['error', 'ambiguous'], {
      stateLabels: { error: 'Non disponibile', ambiguous: 'Piu\' righe' },
      valueLabels: { error: 'n.d.', ambiguous: 'piu\' valori' },
    });
    expect(bottoni[0].getAttribute('aria-label')).toContain('Non disponibile');
    expect(bottoni[0].getAttribute('aria-label')).toContain('n.d.');
    expect(bottoni[1].getAttribute('aria-label')).toContain('Piu\' righe');
    expect(righe[1].querySelectorAll('td')[1].textContent).toBe('piu\' valori');
    expect(container.textContent).not.toContain('Ambiguo');
  });
});

describe('modalita linea: la linea si spezza sui nulli dei nuovi stati', () => {
  const fmt = (v: number) => String(v);
  const linea = (stati: ChartSlotState[]) => {
    const { container } = render(
      <InteractiveChart
        id="l" title="L" unit="u" metricKind="line" color="#0af" points={serie(stati)} period={30}
        locale="it" isDemo={false} formatValue={fmt} summaryText="s"
      />,
    );
    return container;
  };
  it.each(['ambiguous', 'undetermined', 'placeholder'] as const)('si spezza su %s', (s) => {
    const c = linea(['received', 'received', s, 'measured', 'received']);
    expect(c.querySelectorAll('[data-line-path]').length).toBe(2);
    expect(c.querySelectorAll('[data-line-segment]').length).toBe(2);
  });
});

describe('riepilogo', () => {
  it('un giorno ricevuto non e\' contato come misurato ne\' entra nella media', () => {
    const { container } = monta(['measured', 'received', 'undetermined']);
    const t = container.querySelector('#t-summary')!.textContent!;
    // Percorso non dimostrativo (B3b-2): conteggi per stato, nessuna media.
    expect(t).toContain('Ricevuto: 1');
    expect(t).toContain('Non determinabile: 1');
    expect(t).toContain('Misurato: 1');
    expect(t).not.toMatch(/media/);
  });
  it('summaryText del chiamante ha la precedenza', () => {
    const { container } = monta(['received'], { summaryText: 'Testo del percorso reale.' });
    expect(container.querySelector('#t-summary')!.textContent).toBe('Testo del percorso reale.');
  });
});
