/**
 * Difetti del kit che fanno mentire il grafico sul percorso reale (B3b-2). Dati INLINE.
 *
 * a) il percorso reale passa isDemo=false: nessun testo dimostrativo ne' obiettivo «di esempio»;
 * b) nessuna media / «misurazione registrata» calcolata da righe non dimostrate complete;
 * c) il testo del valore dipende dallo stato (errore != assente != ambiguo != non determinabile != segnaposto);
 * d) una chiave senza etichetta non viene mai stampata (fail-closed);
 * e) la legenda elenca solo gli stati presenti;
 * f) tastiera, fuoco, tooltip e tabella restano coerenti per i nuovi stati.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DailyStepsChart } from './DailyStepsChart';
import type { ChartDataPoint, ChartSlotState } from './types';

afterEach(cleanup);

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

function monta(stati: ChartSlotState[], extra: Record<string, unknown> = {}, locale = 'it') {
  const { container } = render(
    <DailyStepsChart id="t" title="Passi" points={serie(stati)} period={7} locale={locale} isDemo={false} {...extra} />,
  );
  const bottoni = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-slot-index]'));
  const righe = Array.from(container.querySelectorAll<HTMLTableRowElement>('tr[data-slot-state]'));
  return { container, bottoni, righe };
}

describe('a) isDemo: il markup reale non contiene testi dimostrativi', () => {
  it.each(['it', 'en'])('isDemo=false (%s): nessun «Dati dimostrativi», «Demo data» ne\' obiettivo di esempio', (lc) => {
    const { container } = monta(['received', 'ambiguous', 'absent'], { goalSteps: 8000 }, lc);
    const testo = container.textContent ?? '';
    for (const vietato of ['Dati dimostrativi', 'Demo data', 'Obiettivo di esempio', 'Example goal', 'dimostrativ', 'demo']) {
      expect(testo.toLowerCase(), vietato).not.toContain(vietato.toLowerCase());
    }
    // L'obiettivo resta mostrato, con una dicitura che non lo dichiara «di esempio».
    expect(testo).toMatch(lc === 'it' ? /8\.?000 passi/ : /8,000 steps/);
  });

  it('decisione documentata: il default del kit resta isDemo=true (l\'anteprima lo usa), il flag esplicito lo spegne', () => {
    const { container } = render(
      <DailyStepsChart id="d" title="Passi" points={serie(['measured'])} period={7} locale="it" goalSteps={8000} />,
    );
    expect(container.textContent).toContain('Dati dimostrativi');
    expect(container.textContent).toContain('Obiettivo di esempio');
  });
});

/** Radice del repository (questo file sta in components/charts). */
const RADICE = path.resolve(__dirname, '../..');
const IMPORTA_GRAFICO = /from\s+['"][^'"]*\/(DailyStepsChart|InteractiveChart)['"]/;

/** True se il sorgente importa il grafico condiviso ma non passa mai isDemo={false}. */
function dimenticaIsDemoFalse(sorgente: string): boolean {
  return IMPORTA_GRAFICO.test(sorgente) && !/isDemo=\{false\}/.test(sorgente);
}

function sorgentiProduzione(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(path.join(RADICE, dir))) {
    if (nome === 'node_modules' || nome.startsWith('.')) continue;
    const rel = `${dir}/${nome}`;
    if (statSync(path.join(RADICE, rel)).isDirectory()) sorgentiProduzione(rel, out);
    else if (/\.tsx$/.test(nome) && !/\.test\.tsx$/.test(nome)) out.push(rel);
  }
  return out;
}

describe('a) guardia sul punto d\'ingresso del percorso reale', () => {
  it('il rilevatore distingue chi passa isDemo={false} da chi lo dimentica', () => {
    const importa = "import { DailyStepsChart } from '@/components/charts/DailyStepsChart';\n";
    expect(dimenticaIsDemoFalse(`${importa}<DailyStepsChart points={p} />`)).toBe(true);
    expect(dimenticaIsDemoFalse(`${importa}<DailyStepsChart points={p} isDemo={false} />`)).toBe(false);
    expect(dimenticaIsDemoFalse('export const x = 1;')).toBe(false);
  });

  it('nessun file di produzione fuori dal kit e dall\'anteprima monta il grafico senza isDemo={false}', () => {
    const cartelle = ['app', 'components', 'lib'];
    const file = cartelle.flatMap((d) => sorgentiProduzione(d));
    const candidati = file.filter(
      (f) => !f.startsWith('components/charts/') && !f.startsWith('components/web-dashboard/'),
    );
    const colpevoli = candidati.filter((f) => dimenticaIsDemoFalse(readFileSync(path.join(RADICE, f), 'utf8')));
    expect(colpevoli).toEqual([]);
  });
});

describe('b) nessuna media ne\' «misurazione registrata» da righe non dimostrate complete', () => {
  it.each([
    ['it', /media|misurazione|registrat/i],
    ['en', /average|recorded|reading/i],
  ])('isDemo=false (%s): il riepilogo generato non calcola medie neppure con righe misurate', (lc, vietato) => {
    const { container } = monta(['measured', 'measured', 'partial', 'received', 'absent'], {}, lc);
    const t = container.querySelector('#t-summary')!.textContent!;
    expect(t).not.toMatch(vietato);
    expect(t).not.toMatch(/\d[\d.,]*\s*(passi|steps)\s+(al giorno|per day)/);
    expect(t.length).toBeGreaterThan(10);
  });

  it('il riepilogo non dimostrativo conta i giorni per stato con le etichette del chiamante', () => {
    const { container } = monta(['received', 'received', 'ambiguous'], {
      stateLabels: { received: 'Valore ricevuto', ambiguous: 'Piu\' righe' },
    });
    const t = container.querySelector('#t-summary')!.textContent!;
    expect(t).toContain('Valore ricevuto: 2');
    expect(t).toContain('Piu\' righe: 1');
  });

  it('con isDemo=true la media resta invariata (anteprima)', () => {
    const { container } = render(
      <DailyStepsChart id="t" title="Passi" points={serie(['measured', 'measured'])} period={7} locale="it" isDemo />,
    );
    expect(container.querySelector('#t-summary')!.textContent).toMatch(/media di 4\.?000 passi/);
  });

  it('summaryText del chiamante resta sovrascrivibile', () => {
    const { container } = monta(['measured'], { summaryText: 'Frase del percorso reale.' });
    expect(container.querySelector('#t-summary')!.textContent).toBe('Frase del percorso reale.');
  });
});

describe('c) il testo del valore dipende dallo stato', () => {
  it('errore, assente, ambiguo, non determinabile e segnaposto hanno cinque testi diversi ovunque', () => {
    const stati: ChartSlotState[] = ['absent', 'error', 'ambiguous', 'undetermined', 'placeholder'];
    const { container, bottoni, righe } = monta(stati);
    const aria = bottoni.map((b) => b.getAttribute('aria-label')!);
    expect(new Set(aria).size).toBe(5);
    const valoriTabella = righe.map((r) => r.querySelectorAll('td')[1].textContent!);
    expect(new Set(valoriTabella).size).toBe(5);
    const tip = container.querySelector('#t-tooltip')!;
    const nelTooltip = bottoni.map((b) => {
      fireEvent.click(b);
      return tip.textContent!;
    });
    expect(new Set(nelTooltip).size).toBe(5);
    // «Nessun dato» e' solo dell'assenza.
    expect(valoriTabella[0]).toBe('Nessun dato');
    for (const i of [1, 2, 3, 4]) {
      expect(valoriTabella[i], stati[i]).not.toBe('Nessun dato');
      expect(aria[i], stati[i]).not.toContain('Nessun dato');
      expect(nelTooltip[i], stati[i]).not.toContain('Nessun dato');
    }
  });

  it('in inglese vale lo stesso: errore non dice «No data»', () => {
    const { righe } = monta(['absent', 'error'], {}, 'en');
    expect(righe[0].querySelectorAll('td')[1].textContent).toBe('No data');
    expect(righe[1].querySelectorAll('td')[1].textContent).not.toBe('No data');
  });

  it('valueLabels/stateLabels del chiamante determinano il testo di ciascun nullo', () => {
    const { righe, bottoni } = monta(['error', 'ambiguous'], {
      stateLabels: { error: 'Non disponibile' },
      valueLabels: { error: 'n.d.', ambiguous: 'piu\' valori' },
    });
    expect(righe[0].querySelectorAll('td')[1].textContent).toBe('n.d.');
    expect(righe[0].querySelectorAll('td')[2].textContent).toBe('Non disponibile');
    expect(righe[1].querySelectorAll('td')[1].textContent).toBe('piu\' valori');
    expect(bottoni[0].getAttribute('aria-label')).toContain('Non disponibile');
  });
});

describe('d) fail-closed: una chiave senza etichetta non viene mai stampata', () => {
  it('etichette del chiamante vuote, undefined o non stringa ricadono sul testo neutro del kit', () => {
    const { container, bottoni, righe } = monta(['error', 'ambiguous', 'placeholder'], {
      stateLabels: { error: undefined, ambiguous: '', placeholder: 42 },
    });
    const testo = container.textContent!;
    expect(testo).not.toContain('undefined');
    expect(testo).not.toContain('42');
    expect(testo).not.toMatch(/\bnull\b/);
    for (const b of bottoni) expect(b.getAttribute('aria-label')).not.toMatch(/undefined|, $|: $/);
    for (const r of righe) expect(r.querySelectorAll('td')[2].textContent!.trim().length).toBeGreaterThan(0);
  });

  it('uno stato sconosciuto diventa errore e la sua chiave non compare nel testo', () => {
    const punti = [
      { date: '2026-10-01', value: 5, state: 'chiave-inventata' as unknown as ChartSlotState },
      punto(1, 'received'),
    ];
    const { container } = render(
      <DailyStepsChart id="t" title="Passi" points={punti} period={7} locale="it" isDemo={false} />,
    );
    expect(container.textContent).not.toContain('chiave-inventata');
    expect(container.querySelector('button[data-slot-index="0"]')!.getAttribute('aria-label')).not.toContain('inventata');
    expect(container.querySelector('button[data-slot-index="0"]')!.getAttribute('data-slot-state')).toBe('error');
  });
});

describe('e) la legenda elenca solo gli stati presenti', () => {
  const stati = (c: HTMLElement) =>
    Array.from(c.querySelectorAll('[data-legend-state]')).map((e) => e.getAttribute('data-legend-state'));

  it('serie di soli «ricevuto»: una sola voce', () => {
    const { container } = monta(['received', 'received']);
    expect(stati(container)).toEqual(['received']);
    const t = container.textContent!;
    for (const assente of ['Misurato', 'Zero misurato', 'Parziale', 'Dato assente']) expect(t).not.toContain(assente);
  });

  it('serie mista: esattamente gli stati presenti, nessuno in piu\'', () => {
    const { container } = monta(['measured', 'absent', 'error', 'ambiguous', 'received']);
    expect([...stati(container)].sort()).toEqual(['absent', 'ambiguous', 'error', 'measured', 'received']);
  });

  it('serie senza alcun dato disegnabile: la legenda non promette barre', () => {
    const { container } = monta(['undetermined', 'placeholder']);
    expect([...stati(container)].sort()).toEqual(['placeholder', 'undetermined']);
  });
});

describe('f) tastiera, fuoco, tooltip e tabella per i nuovi stati', () => {
  const nuovi: ChartSlotState[] = ['received', 'ambiguous', 'undetermined', 'placeholder', 'error', 'absent'];

  it('ogni slot e\' un bottone raggiungibile da tastiera, con etichetta non vuota e riga di tabella gemella', () => {
    const { bottoni, righe } = monta(nuovi);
    expect(bottoni.length).toBe(nuovi.length);
    expect(righe.length).toBe(nuovi.length);
    bottoni.forEach((b, i) => {
      expect(b.tabIndex).toBe(0);
      expect(b.getAttribute('aria-label')!.length).toBeGreaterThan(5);
      expect(b.dataset.date).toBe(righe[i].dataset.date);
      expect(b.dataset.slotState).toBe(righe[i].dataset.slotState);
    });
  });

  it('il fuoco apre il tooltip dello slot, Escape lo chiude, il tooltip concorda con la tabella', () => {
    const { container, bottoni, righe } = monta(nuovi, { stateLabels: { received: 'Ricevuto (riga unica)' } });
    const tip = container.querySelector('#t-tooltip')!;
    bottoni.forEach((b, i) => {
      fireEvent.focus(b);
      expect(tip.getAttribute('data-date')).toBe(b.dataset.date);
      const statoTabella = righe[i].querySelectorAll('td')[2].textContent!;
      expect(tip.textContent).toContain(statoTabella);
      expect(b.getAttribute('aria-describedby')).toBe('t-tooltip');
    });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(tip.getAttribute('data-date')).toBeNull();
  });

  it('il tooltip di uno stato nullo nuovo non mostra l\'unita\' di misura come se ci fosse un valore', () => {
    const { container, bottoni } = monta(['ambiguous']);
    fireEvent.click(bottoni[0]);
    expect(container.querySelector('#t-tooltip')!.textContent).not.toContain('(passi)');
  });
});
