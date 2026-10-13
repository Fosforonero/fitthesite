import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OUT,
  DEFAULT_PORT,
  comboName,
  isInside,
  layoutFailures,
  matrix,
  minCanvasWidth,
  parseArgs,
  tooltipFailures,
  trendsPath,
  type ChartMeasure,
  type PageMeasure,
  type ProbeCombo,
  type TooltipSequence,
} from './trends-charts-probe-core';

const REPO = path.resolve(__dirname, '../../..');

describe('argomenti della sonda', () => {
  it('default: porta 3191 e uscita fuori dal repository', () => {
    const a = parseArgs([], REPO);
    expect(a).toEqual({ out: DEFAULT_OUT, port: DEFAULT_PORT, name: 'report' });
    expect(isInside(REPO, a.out)).toBe(false);
  });

  it('rifiuta un --out dentro il repository, argomenti sconosciuti e porte non valide', () => {
    expect(() => parseArgs(['--out', path.join(REPO, 'docs/qa')], REPO)).toThrow(/dentro il repository/);
    expect(() => parseArgs(['--out', REPO], REPO)).toThrow(/dentro il repository/);
    expect(() => parseArgs(['--base', 'http://x'], REPO)).toThrow(/sconosciuto/);
    expect(() => parseArgs(['--port'], REPO)).toThrow(/mancante/);
    expect(() => parseArgs(['--port', '80'], REPO)).toThrow(/Porta/);
    expect(() => parseArgs(['--name', '../x'], REPO)).toThrow(/Nome/);
    expect(parseArgs(['--port', '3200', '--name', 'm1', '--out', '/tmp/x'], REPO)).toEqual({ out: '/tmp/x', port: 3200, name: 'm1' });
  });

  it('isInside non scambia un fratello col prefisso uguale per un figlio', () => {
    expect(isInside('/a/b', '/a/b/c')).toBe(true);
    expect(isInside('/a/b', '/a/bc')).toBe(false);
    expect(isInside('/a/b', '/a')).toBe(false);
  });
});

describe('matrice', () => {
  it('12 combinazioni it/en x 7/30 x 1440/390/320, nomi e URL della preview', () => {
    const m = matrix();
    expect(m).toHaveLength(12);
    expect(new Set(m.map(comboName)).size).toBe(12);
    expect(trendsPath({ locale: 'en', period: 30 })).toBe('/en/dashboard-preview/trends?range=30');
    expect(minCanvasWidth(7)).toBe(356);
    expect(minCanvasWidth(30)).toBe(1368);
  });
});

const chart = (over: Partial<ChartMeasure> = {}, period = 30): ChartMeasure => ({
  metric: 'steps',
  demoChip: true,
  targets: Array.from({ length: period }, () => ({ width: 44, height: 196 })),
  canvasWidth: minCanvasWidth(period),
  scroll: { clientWidth: 246, scrollWidth: minCanvasWidth(period), overflowX: 'auto', scrolledTo: 1122 },
  ...over,
});
const page = (charts: ChartMeasure[], over: Partial<PageMeasure> = {}): PageMeasure => ({
  status: 200, sections: 1, docScrollWidth: 320, innerWidth: 320, bodyScrollWidth: 320, charts, ...over,
});
const c30: ProbeCombo = { locale: 'it', period: 30, width: 320 };

describe('giudizio sul layout (controprova: ogni regola deve poter fallire)', () => {
  it('verde con le misure del candidato', () => {
    expect(layoutFailures(c30, page([chart(), chart({ metric: 'restingHr' }), chart({ metric: 'sleepMinutes' })]))).toEqual([]);
  });

  it('ogni difetto ha il suo nome', () => {
    const three = (c: ChartMeasure) => [c, { ...c, metric: 'restingHr' }, { ...c, metric: 'sleepMinutes' }];
    const one = (m: PageMeasure) => layoutFailures(c30, m).join(' ');
    expect(one(page(three(chart()), { docScrollWidth: 330 }))).toMatch(/overflow-pagina/);
    expect(one(page(three(chart()), { sections: 0 }))).toMatch(/pannello:0/);
    expect(one(page(three(chart({ demoChip: false }))))).toMatch(/demo-assente/);
    expect(one(page(three(chart({ targets: Array.from({ length: 30 }, () => ({ width: 40, height: 196 })) }))))).toMatch(/target-sotto-44/);
    expect(one(page(three(chart({ canvasWidth: 246 }))))).toMatch(/larghezza-minima/);
    expect(one(page(three(chart({ scroll: { clientWidth: 246, scrollWidth: 246, overflowX: 'visible', scrolledTo: 0 } })))))
      .toMatch(/overflow-x:visible.*scroll-assente.*scroll-non-scorre.*30-giorni-senza-scroll-confinato/);
    expect(one(page([chart()]))).toMatch(/grafici:1/);
  });
});

describe('giudizio sulla sequenza F-1', () => {
  const ok: TooltipSequence = {
    dateA: '2026-08-26', dateB: '2026-09-14', afterClickA: '2026-08-26', afterClickB: '2026-09-14',
    afterHoverAWhilePinnedB: '2026-09-14', afterSecondClickB: null, afterRepinA: '2026-08-26',
    dateC: '2026-08-27', afterTabOther: '2026-08-26', afterEnterOther: '2026-08-27',
    dateD: '2026-08-28', afterTabOther2: '2026-08-27', afterSpaceOther: '2026-08-28', afterEscape: null,
  };
  it('verde sulla sequenza attesa', () => expect(tooltipFailures(ok)).toEqual([]));
  it('la vecchia logica (click su B chiude) e un Escape inerte sono rossi', () => {
    expect(tooltipFailures({ ...ok, afterClickB: null })).toEqual(['f1:click-B-non-sposta:null']);
    expect(tooltipFailures({ ...ok, afterEscape: '2026-08-26' })).toEqual(['f1:escape-non-chiude:2026-08-26']);
    expect(tooltipFailures({ ...ok, afterSecondClickB: '2026-09-14' })).toEqual(['f1:stesso-punto-non-chiude:2026-09-14']);
  });
  it('Tab su un altro giorno con tooltip fissato: se lo sposta, o se Invio/Spazio non fissano, e\' rosso', () => {
    expect(tooltipFailures({ ...ok, afterTabOther: '2026-08-27' })).toEqual(['f1:tab-sposta-il-fissato:2026-08-27']);
    expect(tooltipFailures({ ...ok, afterEnterOther: '2026-08-26' })).toEqual(['f1:invio-non-fissa:2026-08-26']);
    expect(tooltipFailures({ ...ok, afterTabOther2: '2026-08-28' })).toEqual(['f1:tab-sposta-il-fissato-2:2026-08-28']);
    expect(tooltipFailures({ ...ok, afterSpaceOther: null })).toEqual(['f1:spazio-non-fissa:null']);
    expect(tooltipFailures({ ...ok, dateC: '' })).toContain('f1:tab-giorno-C-non-valido:');
  });
});
