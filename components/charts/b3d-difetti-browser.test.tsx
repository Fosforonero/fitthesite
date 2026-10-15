/**
 * B3d: difetti del kit condiviso provati dal browser a 320/390 px (B4b-2, D1 D3 D4 D5 D6).
 * Dati INLINE, nessuna fixture del prototipo. Un test per difetto.
 */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DailyStepsChart } from './DailyStepsChart';
import { planXAxisLabels } from './InteractiveChart';
import type { ChartDataPoint, ChartSlotState } from './types';

afterEach(cleanup);

/** Larghezza reale dell'area del grafico a 320 e a 390 px: il contenitore ha min-width 48 + 7*44 e scorre. */
const PLOT_320_390 = 7 * 44;

function conLarghezza(width: number) {
  const proto = HTMLElement.prototype;
  const orig = Object.getOwnPropertyDescriptor(proto, 'clientWidth');
  Object.defineProperty(proto, 'clientWidth', { configurable: true, get: () => width });
  return () => {
    if (orig) Object.defineProperty(proto, 'clientWidth', orig);
    else delete (proto as unknown as Record<string, unknown>).clientWidth;
  };
}

const giorno = (i: number) => `2026-10-${String(i + 8).padStart(2, '0')}`;
const P = (i: number, value: number | null, state: ChartSlotState): ChartDataPoint => ({ date: giorno(i), value, state });
const sette = (): ChartDataPoint[] => [0, 1, 2, 3, 4, 5, 6].map((i) => P(i, 8000 + i, 'received'));

function monta(points: ChartDataPoint[], extra: Record<string, unknown> = {}, locale = 'it') {
  const { container } = render(
    <DailyStepsChart id="t" title="Passi" points={points} period={7} locale={locale} isDemo={false} {...extra} />,
  );
  const bottoni = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-slot-index]'));
  const righe = Array.from(container.querySelectorAll<HTMLTableRowElement>('tr[data-slot-state]'));
  return { container, bottoni, righe };
}

interface Scatola { testo: string; da: number; a: number }

/** Scatole orizzontali (px) delle etichette dell'asse X, lette dal markup con una stima di 7 px a carattere. */
function scatole(container: HTMLElement, W: number): Scatola[] {
  const spans = Array.from(container.querySelectorAll<HTMLElement>('div.mt-2.h-7 > span'));
  return spans.map((s) => {
    const testo = s.textContent!;
    const w = testo.length * 7;
    const left = s.style.left;
    const right = s.style.right;
    if (right === '0%') return { testo, da: W - w, a: W };
    if (left === '0%') return { testo, da: 0, a: w };
    const c = (parseFloat(left) / 100) * W;
    return { testo, da: c - w / 2, a: c + w / 2 };
  });
}

function senzaSovrapposizioni(box: Scatola[]) {
  const ord = [...box].sort((x, y) => x.da - y.da);
  for (let i = 1; i < ord.length; i++) {
    expect(ord[i].da, `${ord[i - 1].testo} / ${ord[i].testo}`).toBeGreaterThanOrEqual(ord[i - 1].a);
  }
}

describe('D1: etichette dell\'asse X leggibili a 320 e 390 px', () => {
  let ripristina = () => {};
  beforeEach(() => { ripristina = conLarghezza(PLOT_320_390); });
  afterEach(() => ripristina());

  it.each(['it', 'en'])('7 giorni (%s): tutte le etichette presenti e nessuna sovrapposta', (lc) => {
    const { container } = monta(sette(), {}, lc);
    const box = scatole(container, PLOT_320_390);
    expect(box.length).toBe(7);
    senzaSovrapposizioni(box);
    // formato corto: niente nome del mese nell'asse (la data piena resta nel tooltip e nella tabella)
    for (const b of box) expect(b.testo).not.toMatch(/ott|oct/i);
  });

  it('la data piena resta nel tooltip e nella tabella', () => {
    const { container, bottoni, righe } = monta(sette(), {}, 'it');
    fireEvent.click(bottoni[0]);
    expect(container.querySelector('#t-tooltip')!.textContent).toContain('gio 8 ott');
    expect(bottoni[0].getAttribute('aria-label')).toContain('gio 8 ott');
    expect(righe[0].querySelectorAll('td')[0].textContent).toBe('2026-10-08');
  });

  it('quando lo spazio non basta le etichette si diradano, senza sovrapposizioni, e la prima e l\'ultima restano', () => {
    ripristina();
    ripristina = conLarghezza(150);
    const { container } = monta(sette(), {}, 'en');
    const box = scatole(container, 150);
    expect(box.length).toBeGreaterThanOrEqual(2);
    expect(box.length).toBeLessThan(7);
    senzaSovrapposizioni(box);
    expect(container.querySelectorAll('div.mt-2.h-7 > span')[0].textContent).toBe(box[0].testo);
  });

  it('planXAxisLabels e\' deterministico: nessuna coppia di scatole si sovrappone a nessuna larghezza', () => {
    const testi = ['Thu 8', 'Fri 9', 'Sat 10', 'Sun 11', 'Mon 12', 'Tue 13', 'Wed 14'];
    for (const W of [70, 100, 150, 220, 308, 400, 800]) {
      const piano = planXAxisLabels(testi, W);
      expect(piano.length).toBeGreaterThanOrEqual(1);
      const ord = [...piano].sort((a, b) => a.da - b.da);
      for (let i = 1; i < ord.length; i++) expect(ord[i].da).toBeGreaterThanOrEqual(ord[i - 1].a);
    }
    // a 308 px (320/390) le sette etichette ci stanno tutte
    expect(planXAxisLabels(testi, PLOT_320_390).length).toBe(7);
  });
});

describe('D3: errore e assente distinguibili nel grafico, nella legenda e nel testo', () => {
  const serie = [P(0, null, 'absent'), P(1, null, 'error'), P(2, 4000, 'received')];

  it('il grafico ha un glifo per l\'errore e nessuno per l\'assente', () => {
    const { container } = monta(serie);
    expect(container.querySelector('[data-null-glyph="error"]')).not.toBeNull();
    expect(container.querySelector('[data-null-glyph="absent"]')).toBeNull();
    expect(container.querySelector('[data-null-glyph="error"]')!.textContent).toBe('!');
  });

  it('la legenda ha due campioni diversi e due testi diversi', () => {
    const { container } = monta(serie);
    const sw = (s: string) => container.querySelector(`[data-legend-state="${s}"]`)!;
    expect(sw('absent').innerHTML).not.toBe(sw('error').innerHTML.replace('error', 'absent'));
    expect(sw('error').textContent).toContain('!');
    expect(sw('absent').textContent).not.toContain('!');
    expect(sw('absent').textContent).not.toBe(sw('error').textContent);
  });

  it('testo accessibile, tooltip e tabella diversi', () => {
    const { container, bottoni, righe } = monta(serie);
    expect(bottoni[0].getAttribute('aria-label')).not.toBe(bottoni[1].getAttribute('aria-label'));
    const tip = container.querySelector('#t-tooltip')!;
    fireEvent.click(bottoni[0]);
    const a = tip.textContent;
    fireEvent.click(bottoni[1]);
    expect(tip.textContent).not.toBe(a);
    expect(righe[0].textContent).not.toBe(righe[1].textContent);
  });
});

describe('D4: nessuna unita\' dopo il testo nullo di un assente', () => {
  it.each([
    ['it', 'passi'],
    ['en', 'steps'],
  ])('tooltip e aria-label (%s)', (lc, unita) => {
    const { container, bottoni } = monta([P(0, null, 'absent'), P(1, 5000, 'received')], {}, lc);
    fireEvent.click(bottoni[0]);
    expect(container.querySelector('#t-tooltip')!.textContent).not.toContain(`(${unita})`);
    expect(bottoni[0].getAttribute('aria-label')).not.toContain(unita);
    // un valore reale la conserva
    expect(bottoni[1].getAttribute('aria-label')).toContain(unita);
  });

  it('anche con i testi del chiamante (percorso reale)', () => {
    const { container, bottoni } = monta([P(0, null, 'absent')], {
      stateLabels: { absent: 'Nessun dato ricevuto' },
      valueLabels: { absent: 'Nessun dato' },
    });
    fireEvent.click(bottoni[0]);
    expect(container.querySelector('#t-tooltip')!.textContent).not.toContain('(passi)');
    expect(bottoni[0].getAttribute('aria-label')).not.toContain('passi');
    expect(bottoni[0].getAttribute('aria-label')).toContain('Nessun dato');
  });
});

describe('D5: zero non determinabile, mai la cifra 0 per un null', () => {
  it.each([
    ['it', 'Zero non determinabile'],
    ['en', 'Zero not determinable'],
  ])('tooltip, aria-label e tabella con i testi del percorso reale (%s)', async (lc, testo) => {
    const { TESTI_PASSI } = await import('../../lib/dashboard/testi');
    const t = TESTI_PASSI[lc as 'it' | 'en'];
    const { container, bottoni, righe } = monta([P(0, null, 'undetermined')], {
      stateLabels: t.etichette,
      valueLabels: t.valori,
    }, lc);
    fireEvent.click(bottoni[0]);
    expect(container.querySelector('#t-tooltip')!.textContent).toContain(testo);
    expect(container.querySelector('#t-tooltip')!.textContent).not.toMatch(/\b0\b/);
    expect(bottoni[0].getAttribute('aria-label')).toContain(testo);
    expect(bottoni[0].getAttribute('aria-label')).not.toMatch(/\b0\b/);
    expect(righe[0].querySelectorAll('td')[1].textContent).toBe(testo);
  });

  it('senza testi del chiamante il kit dice comunque «Zero non determinabile»', () => {
    const { righe } = monta([P(0, null, 'undetermined')]);
    expect(righe[0].querySelectorAll('td')[1].textContent).toBe('Zero non determinabile');
    const en = monta([P(0, null, 'undetermined')], {}, 'en');
    expect(en.righe[0].querySelectorAll('td')[1].textContent).toBe('Zero not determinable');
  });
});

describe('D6: il testo di stato non e\' ripetuto nel tooltip', () => {
  it.each(['ambiguous', 'placeholder', 'error', 'undetermined'] as ChartSlotState[])('%s', async (stato) => {
    const { TESTI_PASSI } = await import('../../lib/dashboard/testi');
    const t = TESTI_PASSI.it;
    const { container, bottoni } = monta([P(0, null, stato)], { stateLabels: t.etichette, valueLabels: t.valori });
    fireEvent.click(bottoni[0]);
    const testo = container.querySelector('#t-tooltip')!.textContent!;
    const etichetta = t.etichette[stato as keyof typeof t.etichette];
    expect(testo.split(etichetta).length - 1, testo).toBe(1);
    const aria = bottoni[0].getAttribute('aria-label')!;
    expect(aria.split(etichetta).length - 1, aria).toBe(1);
  });

  it('un testo di valore diverso dallo stato resta in entrambi (assente)', async () => {
    const { TESTI_PASSI } = await import('../../lib/dashboard/testi');
    const t = TESTI_PASSI.it;
    const { container, bottoni } = monta([P(0, null, 'absent')], { stateLabels: t.etichette, valueLabels: t.valori });
    fireEvent.click(bottoni[0]);
    const tip = container.querySelector('#t-tooltip')!.textContent!;
    expect(tip).toContain('Nessun dato');
    expect(tip).toContain('Nessun dato ricevuto');
  });
});
