import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { absent, partial, value } from '@/lib/web-dashboard/measure';
import type { HeartPoint, ScenarioKey } from '@/lib/web-dashboard/model';

import { HeartLoading, HeartScreen } from './HeartScreen';
import { STAT_GRID } from './heart/layout';
import { analyzeSeries, hourRows, niceAxis, workoutOverlay } from './heart/series';
import { forbiddenCopyIn, measureStates, renderScreen, screenProps } from './test-utils';

const SCENARIOS: ScenarioKey[] = ['ok', 'partial', 'zeros', 'stale', 'empty'];

/** Coordinate x di tutti i segmenti disegnati (minuti del giorno, perche' il viewBox e' in unita' di dato). */
function segmentXs(container: HTMLElement): number[] {
  const xs: number[] = [];
  for (const p of container.querySelectorAll('path[data-slot-state="measured"]')) {
    const d = p.getAttribute('d') ?? '';
    for (const m of d.matchAll(/[ML]?(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)) xs.push(Number(m[1]));
  }
  return xs;
}

/**
 * Una serie con due buchi INTERNI (05:00-05:40 e 13:00-18:00), costruita nel test. Il componente sa
 * spezzare la linea a ogni buco; lo scenario `partial` non ne produce (il server non vede i buchi interni:
 * conosce solo la finestra ricevuta, e la serie intraday e' fuori whitelist).
 */
function renderWithHoles() {
  const props = screenProps('ok');
  const series = props.data.heart.series.map((p) => ((p.minute >= 300 && p.minute < 340) || (p.minute >= 780 && p.minute < 1080) ? { ...p, bpm: null } : p));
  props.data = { ...props.data, heart: { ...props.data.heart, series } };
  return { ...render(<HeartScreen {...props} />), props };
}

const tile = (container: HTMLElement, key: string) => container.querySelector(`[data-heart-tile="${key}"]`) as HTMLElement;

describe('HeartScreen: ogni scenario, in italiano e in inglese', () => {
  for (const lc of ['it', 'en']) {
    for (const sc of SCENARIOS) {
      it(`${sc} / ${lc}: si rende senza errori e senza copy vietata`, () => {
        const { container } = renderScreen(HeartScreen, sc, { lc });
        expect(container.querySelector('[data-screen="heart"]')).not.toBeNull();
        expect(forbiddenCopyIn(container)).toEqual([]);
        // la schermata non possiede l'h1 (lo possiede la cornice) e ha sezioni con h2
        expect(container.querySelector('h1')).toBeNull();
        expect(container.querySelectorAll('h2').length).toBeGreaterThanOrEqual(2);
      });
    }
  }

  it('una lingua senza copy propria usa l’inglese', () => {
    const { container } = renderScreen(HeartScreen, 'ok', { lc: 'de' });
    expect(container.textContent).toContain('Heart rate');
    expect(container.textContent).not.toContain('Frequenza cardiaca');
  });

  it('lo scheletro usa la stessa griglia della schermata e non scrive testo', () => {
    const { container } = render(<HeartLoading />);
    const real = renderScreen(HeartScreen, 'ok').container;
    expect(container.querySelector('.grid')?.className).toContain(STAT_GRID);
    expect(real.querySelector('.grid')?.className).toContain(STAT_GRID);
    expect(container.querySelectorAll('.grid > *')).toHaveLength(5);
    expect((container.textContent ?? '').trim()).toBe('');
  });
});

describe('HeartScreen: zero, parziale e assente sono tre cose diverse', () => {
  it('ok: cinque valori misurati, nessun buco nel grafico', () => {
    const { container } = renderScreen(HeartScreen, 'ok');
    expect(measureStates(container)).toEqual(['measured', 'measured', 'measured', 'measured', 'measured']);
    expect(container.querySelectorAll('[data-heart-chart] [data-slot-state="absent"]')).toHaveLength(0);
    expect(container.querySelectorAll('path[data-slot-state="measured"]')).toHaveLength(1);
  });

  it('parziale: min, max e media portano la copertura; l’HRV assente dice perche’ manca e non stampa cifre', () => {
    const { container, props } = renderScreen(HeartScreen, 'partial');
    expect(tile(container, 'resting').querySelector('[data-measure-state]')?.getAttribute('data-measure-state')).toBe('measured');
    for (const k of ['average', 'min', 'max']) {
      const el = tile(container, k).querySelector('[data-measure-state]') as HTMLElement;
      expect(el.getAttribute('data-measure-state')).toBe('partial');
      expect(el.textContent).toContain(props.copy.measure.partialLabel);
      expect(el.textContent).toMatch(/\d+\s?%/);
    }
    const hrv = tile(container, 'hrv').querySelector('[data-measure-state]') as HTMLElement;
    expect(hrv.getAttribute('data-measure-state')).toBe('absent');
    expect(hrv.textContent).toContain(props.copy.measure.absent.source_lacks_type);
    expect(hrv.textContent).not.toMatch(/\d/);
  });

  it('un HRV di zero misurato e’ un dato ("0" con l’etichetta), un HRV assente non e’ zero', () => {
    const base = screenProps('ok');
    const zero = render(<HeartScreen {...base} data={{ ...base.data, heart: { ...base.data.heart, hrvMs: value(0) } }} />);
    const zeroEl = tile(zero.container, 'hrv').querySelector('[data-measure-state]') as HTMLElement;
    expect(zeroEl.getAttribute('data-measure-state')).toBe('measured-zero');
    expect(zeroEl.textContent).toContain('0');
    expect(zeroEl.textContent).toContain(base.copy.measure.zeroMeasured);
    zero.unmount();

    const gone = render(<HeartScreen {...base} data={{ ...base.data, heart: { ...base.data.heart, hrvMs: absent('source_lacks_type') } }} />);
    const goneEl = tile(gone.container, 'hrv').querySelector('[data-measure-state]') as HTMLElement;
    expect(goneEl.getAttribute('data-measure-state')).toBe('absent');
    expect(goneEl.textContent).toContain(base.copy.measure.absent.source_lacks_type);
    expect(goneEl.textContent).not.toMatch(/\d/);
    expect(goneEl.textContent).not.toContain(base.copy.measure.zeroMeasured);
  });

  it('un valore parziale con zero come cifra resta parziale, non diventa zero misurato', () => {
    const base = screenProps('ok');
    const { container } = render(
      <HeartScreen {...base} data={{ ...base.data, heart: { ...base.data.heart, hrvMs: partial(0, 0.4, 'incomplete_coverage') } }} />,
    );
    expect(tile(container, 'hrv').querySelector('[data-measure-state]')?.getAttribute('data-measure-state')).toBe('partial');
  });

  it('scenario partial: la finestra finisce alle 13:00, un solo tratto assente in coda e un solo segmento, nessun buco interno', () => {
    const { container } = renderScreen(HeartScreen, 'partial');
    const bands = [...container.querySelectorAll('[data-heart-chart] [data-slot-state="absent"]')] as HTMLElement[];
    expect(bands.map((b) => [b.dataset.from, b.dataset.to])).toEqual([['13:00', '24:00']]);
    expect(container.querySelectorAll('path[data-slot-state="measured"]')).toHaveLength(1);
    for (const x of segmentXs(container)) expect(x).toBeLessThan(780);
  });

  it('con buchi interni: la linea si spezza a ogni buco, i buchi sono bande tratteggiate e nessuna coordinata cade dentro un buco', () => {
    const { container } = renderWithHoles();
    const bands = [...container.querySelectorAll('[data-heart-chart] [data-slot-state="absent"]')] as HTMLElement[];
    expect(bands.map((b) => [b.dataset.from, b.dataset.to])).toEqual([
      ['05:00', '05:40'],
      ['13:00', '18:00'],
    ]);
    // tre segmenti: prima, fra e dopo i due buchi
    expect(container.querySelectorAll('path[data-slot-state="measured"]')).toHaveLength(3);
    const xs = segmentXs(container);
    expect(xs.length).toBeGreaterThan(50);
    for (const x of xs) {
      expect(x >= 300 && x < 340).toBe(false);
      expect(x >= 780 && x < 1080).toBe(false);
    }
  });

  it('zeros: la notte senza campioni e’ un buco unico dalle 00:00, non una linea a 0 bpm', () => {
    const { container } = renderScreen(HeartScreen, 'zeros');
    const bands = container.querySelectorAll('[data-heart-chart] [data-slot-state="absent"]');
    expect(bands).toHaveLength(1);
    expect((bands[0] as HTMLElement).dataset.from).toBe('00:00');
    expect((bands[0] as HTMLElement).dataset.to).toBe('07:00');
    expect(Math.min(...segmentXs(container))).toBeGreaterThanOrEqual(420);
  });

  it('«Nessun campione» compare una volta sola nella legenda del grafico', () => {
    const { container, props } = renderScreen(HeartScreen, 'partial');
    const legendItems = [...container.querySelectorAll('ul[aria-label] > li')].filter((li) =>
      li.textContent?.includes(props.copy.measure.absent.no_samples),
    );
    expect(legendItems).toHaveLength(1);
  });

  it('la copertura dice quanti campioni ci sono davvero, senza contare i buchi come zeri', () => {
    const { container, props } = renderWithHoles();
    const known = props.data.heart.series.filter((p) => p.bpm !== null).length;
    const cov = container.querySelector('[data-heart-coverage]') as HTMLElement;
    expect(cov.textContent).toContain(`Campioni: ${known} su 144`);
    expect(cov.textContent).toContain('dalle 05:00 alle 05:40 e dalle 13:00 alle 18:00');
    expect(cov.querySelectorAll('[data-coverage-run="gap"]')).toHaveLength(2);
  });

  it('gli allenamenti misurati sono bande e stanno nella tabella con il titolo; non forniti dalla fonte: si dice perche’', () => {
    const ok = renderScreen(HeartScreen, 'ok');
    expect(ok.container.querySelectorAll('[data-heart-workout]').length).toBe(ok.props.data.workouts.sessions.kind === 'value' ? ok.props.data.workouts.sessions.value.length : -1);
    expect(ok.container.querySelector('[data-heart-table="workouts"]')?.textContent).toContain('Forza');
    ok.unmount();

    const partialRun = renderScreen(HeartScreen, 'partial');
    expect(partialRun.container.querySelectorAll('[data-heart-workout]')).toHaveLength(0);
    const note = partialRun.container.querySelector('[data-heart-workouts-note="absent"]') as HTMLElement;
    // il server non distingue «non fornito» da «nessun dato»: nessuna riga di allenamenti e' «nessun campione»
    expect(note.textContent).toContain(partialRun.props.copy.measure.absent.no_samples);
    expect(note.textContent).not.toContain(partialRun.props.copy.measure.absent.source_lacks_type);
    partialRun.unmount();

    // «zeros»: nessuna riga di allenamenti nel giorno. Non e' «nessun allenamento»: e' assente, con il motivo.
    const zeros = renderScreen(HeartScreen, 'zeros');
    expect(zeros.container.querySelector('[data-heart-workouts-note="none"]')).toBeNull();
    const zeroNote = zeros.container.querySelector('[data-heart-workouts-note="absent"]') as HTMLElement;
    expect(zeroNote.textContent).toContain(zeros.props.copy.measure.absent.no_samples);
  });

  it('una lista di allenamenti vuota costruita a mano non e «nessun allenamento»: e assente, e nel grafico non c e nessuna frase dello zero', () => {
    expect(workoutOverlay(value([]), '2026-09-23', null)).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(workoutOverlay(partial([], 0.5, 'window_open'), '2026-09-23', null)).toEqual({ kind: 'absent', reason: 'no_samples' });
    const props = screenProps('ok');
    const forged = { ...props.data, workouts: { sessions: value([]), week: props.data.workouts.week } };
    const { container } = render(<HeartScreen {...props} data={forged} />);
    expect(container.querySelector('[data-heart-workouts-note="absent"]')).not.toBeNull();
    expect(container.querySelector('[data-heart-workouts-note="none"]')).toBeNull();
    expect(container.textContent).not.toMatch(/Nessun allenamento registrato/);
  });

  it('la tabella per ora distingue ora misurata, ora parziale e ora senza campioni (senza cifre)', () => {
    const { container, props } = renderWithHoles();
    const rows = [...container.querySelectorAll('[data-heart-table="hours"] tbody tr')] as HTMLElement[];
    expect(rows).toHaveLength(24);
    const state = (h: number) => rows[h].getAttribute('data-slot-state');
    expect(state(2)).toBe('measured');
    expect(state(5)).toBe('partial'); // 05:00-05:40 senza campioni: restano due finestre su sei
    expect(state(14)).toBe('absent');
    const cell = rows[14].querySelector('td') as HTMLElement;
    expect(cell.textContent).toBe(props.copy.measure.absent.no_samples);
    expect(cell.textContent).not.toMatch(/\d/);
    expect(rows[5].textContent).toContain('2 di 6');
  });
});

describe('HeartScreen: nessun campione', () => {
  it('empty: scheda tratteggiata con il motivo, link ai dispositivi e nessun grafico', () => {
    const { container, props } = renderScreen(HeartScreen, 'empty');
    const card = container.querySelector('[data-heart-empty]') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.getAttribute('data-absent-reason')).toBe('no_data_received');
    expect(card.className).toContain('border-dashed');
    expect(card.textContent).toContain(props.copy.measure.absent.no_data_received);
    expect(card.querySelector('a')?.getAttribute('href')).toBe('/it/app/devices');
    expect(container.querySelector('[data-heart-chart]')).toBeNull();
    expect(container.querySelector('path[data-slot-state="measured"]')).toBeNull();
    // cinque valori, tutti assenti, nessuna cifra
    expect(measureStates(container)).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
    expect(container.querySelector('[data-screen="heart"]')?.textContent).not.toMatch(/\d/);
  });

  it('empty in inglese: il link usa la lingua dell’URL', () => {
    const { container } = renderScreen(HeartScreen, 'empty', { lc: 'en' });
    expect(container.querySelector('[data-heart-empty] a')?.getAttribute('href')).toBe('/en/app/devices');
  });

  it('stale: nessuna linea piatta, il motivo e’ "non ancora sincronizzato" e il link porta alle sorgenti dei dati', () => {
    const { container, props } = renderScreen(HeartScreen, 'stale');
    const card = container.querySelector('[data-heart-empty]') as HTMLElement;
    expect(card.getAttribute('data-absent-reason')).toBe('not_synced_yet');
    expect(card.textContent).toContain(props.copy.measure.absent.not_synced_yet);
    expect(card.querySelector('a')?.getAttribute('href')).toBe(props.href('sources'));
    expect(container.querySelector('path[data-slot-state="measured"]')).toBeNull();
  });

  it('una serie tutta nulla con valori presenti si spiega come "nessun campione", non come zero', () => {
    const base = screenProps('ok');
    const series = base.data.heart.series.map((p) => ({ ...p, bpm: null }));
    const { container } = render(<HeartScreen {...base} data={{ ...base.data, heart: { ...base.data.heart, series } }} />);
    expect(container.querySelector('[data-heart-empty]')?.getAttribute('data-absent-reason')).toBe('no_samples');
  });
});

describe('HeartScreen: giorno in corso e serie irregolari', () => {
  it('oggi: le ore successive a “adesso” non sono buchi, non hanno linea e la legenda le nomina', () => {
    const { container, props } = renderScreen(HeartScreen, 'ok', { day: '2026-09-24' });
    expect(container.querySelector('[data-heart-future]')).not.toBeNull();
    expect(Math.max(...segmentXs(container))).toBeLessThanOrEqual(580);
    expect(container.querySelectorAll('[data-heart-chart] [data-slot-state="absent"]')).toHaveLength(0);
    expect(container.querySelector('[data-heart-coverage]')?.textContent).toContain('58 su 58');
    expect(container.textContent).toContain(props.copy.measure.absent.not_yet);
    // il generatore mette un allenamento alle 18 anche oggi: alle 09:40 non e' ancora avvenuto
    expect(container.querySelectorAll('[data-heart-workout]')).toHaveLength(0);
  });

  it('un campione isolato si disegna come punto e spezza la linea da entrambi i lati', () => {
    const series: HeartPoint[] = Array.from({ length: 144 }, (_, i) => ({ minute: i * 10, bpm: null }));
    series[10].bpm = 60;
    series[11].bpm = 62;
    series[13].bpm = 90; // isolato: 12 e 14 sono nulli
    const a = analyzeSeries(series, null);
    expect(a.segments.map((s) => s.length)).toEqual([2, 1]);
    const base = screenProps('ok');
    const { container } = render(<HeartScreen {...base} data={{ ...base.data, heart: { ...base.data.heart, series } }} />);
    const paths = [...container.querySelectorAll('path[data-slot-state="measured"]')];
    expect(paths.map((p) => p.getAttribute('data-points'))).toEqual(['2', '1']);
  });

  it('un bpm di 0 e’ un campione (non un buco) e allarga l’asse invece di sparire', () => {
    const series: HeartPoint[] = Array.from({ length: 144 }, (_, i) => ({ minute: i * 10, bpm: 60 }));
    series[20].bpm = 0;
    const a = analyzeSeries(series, null);
    expect(a.gaps).toHaveLength(0);
    expect(a.samples).toBe(144);
    expect(a.min).toBe(0);
    expect(niceAxis([0, 60]).lo).toBe(0);
    expect(hourRows(a.slots)[3].min).toBe(0);
  });

  it('punti mancanti, doppi o fuori intervallo non spostano nulla', () => {
    const series: HeartPoint[] = [
      { minute: 0, bpm: 55 },
      { minute: 5, bpm: 99 }, // stessa finestra di 0: vince il primo campione
      { minute: 1500, bpm: 70 }, // fuori dal giorno
      { minute: 30, bpm: Number.NaN },
    ];
    const a = analyzeSeries(series, null);
    expect(a.samples).toBe(1);
    expect(a.slots[0].bpm).toBe(55);
    expect(a.slots).toHaveLength(144);
    expect(a.gaps).toHaveLength(1);
  });
});
