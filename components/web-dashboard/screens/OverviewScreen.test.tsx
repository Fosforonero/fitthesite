import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { absent, partial, value, type Measure } from '@/lib/web-dashboard/measure';
import type { ScenarioKey } from '@/lib/web-dashboard/model';
import { SYNTHETIC_TODAY } from '@/lib/web-dashboard/synthetic';

import { OverviewLoading, OverviewScreen } from './OverviewScreen';
import { collectMissing, lineSegments, unmeasuredRuns, weekSeries, weekStats } from './overview/derive';
import { forbiddenCopyIn, renderScreen, screenProps } from './test-utils';

afterEach(cleanup);

const SCENARIOS: ScenarioKey[] = ['ok', 'partial', 'zeros', 'stale', 'empty'];
const LOCALES = ['it', 'en'] as const;
const hasDigit = (s: string | null | undefined) => /\d/.test(s ?? '');

const q = (root: ParentNode, sel: string) => root.querySelector(sel) as HTMLElement | null;
const qa = (root: ParentNode, sel: string) => [...root.querySelectorAll(sel)] as HTMLElement[];

describe('OverviewScreen: contratto di base', () => {
  for (const lc of LOCALES) {
    for (const scenario of SCENARIOS) {
      it(`si rende senza errori (${scenario}, ${lc}), copy pulita e struttura semantica`, () => {
        const { container } = renderScreen(OverviewScreen, scenario, { lc });
        expect(q(container, '[data-screen="overview"]')).not.toBeNull();
        expect(forbiddenCopyIn(container)).toEqual([]);
        // l'h1 e' della shell; qui solo h2 (sezioni) e h3 (righe dei 7 giorni)
        expect(container.querySelector('h1')).toBeNull();
        expect(qa(container, 'h2').length).toBeGreaterThanOrEqual(5);
        // cinque schede KPI, tutte link alla propria schermata
        expect(qa(container, '[data-kpi]')).toHaveLength(5);
        for (const tile of qa(container, '[data-kpi]')) expect(q(tile, 'a[href]')).not.toBeNull();
        // grafici: SVG con role="img" e un'etichetta che li riassume
        for (const img of qa(container, 'svg[role="img"], div[role="img"]')) {
          expect((img.getAttribute('aria-label') ?? '').length).toBeGreaterThan(8);
        }
        // nessuna menzione di AI o tono promozionale
        expect(container.textContent ?? '').not.toMatch(/\bAI\b|intelligenza artificiale|artificial intelligence/i);
      });
    }
  }

  it('le schede KPI portano alla schermata di dettaglio giusta, mantenendo lo stato dell’anteprima', () => {
    const { container, props } = renderScreen(OverviewScreen, 'zeros');
    const link = (k: string) => q(container, `[data-kpi="${k}"] a`)?.getAttribute('href');
    expect(link('steps')).toBe(props.href('activity'));
    expect(link('sleep')).toBe(props.href('sleep'));
    expect(link('resting-hr')).toBe(props.href('heart'));
    expect(link('workouts')).toBe(props.href('workouts'));
    expect(link('calories')).toBe(props.href('activity'));
    expect(link('steps')).toContain('state=zeros');
  });

  it('non contiene componenti client né promesse: solo server component', () => {
    const dir = __dirname;
    const files = [
      join(dir, 'OverviewScreen.tsx'),
      join(dir, 'OverviewScreen.copy.ts'),
      ...readdirSync(join(dir, 'overview')).map((f) => join(dir, 'overview', f)),
    ];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/['"]use client['"]/);
      expect(src, f).not.toMatch(/\buse(State|Effect|Reducer|Ref)\b/);
      expect(src, f).not.toContain('\u2014');
    }
  });
});

describe('OverviewScreen: zero, parziale e assente sono tre cose diverse', () => {
  it('zeros: un assente non stampa mai una cifra, uno zero misurato la stampa con la sua etichetta', () => {
    const { container, props } = renderScreen(OverviewScreen, 'zeros');

    // sonno assente (orologio non indossato): niente cifre, il motivo c'e'
    const sleepTile = q(container, '[data-kpi="sleep"]')!;
    expect(q(sleepTile, '[data-measure-state="absent"]')).not.toBeNull();
    expect(hasDigit(sleepTile.textContent)).toBe(false);
    expect(sleepTile.textContent).toContain(props.copy.measure.absent.no_samples);

    // nessun allenamento MISURATO: e' "0" con «Zero misurato», non l'assenza
    const workoutsTile = q(container, '[data-kpi="workouts"]')!;
    const zero = q(workoutsTile, '[data-measure-state="measured-zero"]')!;
    expect(zero).not.toBeNull();
    expect(zero.textContent).toContain('0');
    expect(zero.textContent).toContain(props.copy.measure.zeroMeasured);
    expect(q(workoutsTile, '[data-measure-state="absent"]')).toBeNull();
    expect(workoutsTile.textContent).toContain('Nessun allenamento registrato');
  });

  it('zeros: nella striscia oraria lo zero e’ una tacca, l’assente e’ un riquadro e non ha barra', () => {
    const { container, props } = renderScreen(OverviewScreen, 'zeros');
    const slots = props.data.activity.hourlySteps;
    const zeroHours = slots.filter((m) => m.kind === 'value' && m.value === 0).length;
    const absentHours = slots.filter((m) => m.kind === 'absent').length;
    const barHours = slots.filter((m) => m.kind === 'value' && m.value > 0).length;
    expect(absentHours).toBe(2); // 15:00 e 16:00
    expect(zeroHours).toBeGreaterThan(5);

    const strip = q(container, '#ov-hourly-title')!.closest('section')!;
    expect(qa(strip, 'g[data-slot-state="zero"]')).toHaveLength(zeroHours);
    expect(qa(strip, 'g[data-slot-state="zero"] [data-tick]')).toHaveLength(zeroHours);
    expect(qa(strip, 'g[data-slot-state="zero"] [data-bar]')).toHaveLength(0);
    expect(qa(strip, 'g[data-slot-state="value"] [data-bar]')).toHaveLength(barHours);

    const absentSlots = qa(strip, 'g[data-slot-state="absent"]');
    expect(absentSlots.map((g) => g.getAttribute('data-hour'))).toEqual(['15', '16']);
    for (const g of absentSlots) {
      expect(q(g, '[data-bar], [data-tick]')).toBeNull();
      expect(g.textContent).toContain(props.copy.measure.absent.no_samples);
    }
    // il tratto assente e' spiegato sotto la striscia, con il motivo
    const run = q(strip, '[data-slot-run="absent"]')!;
    expect(run.textContent).toContain('15:00');
    expect(run.textContent).toContain('16:59');
    expect(run.textContent).toContain(props.copy.measure.absent.no_samples);
  });

  it('zeros: «cosa manca» separa l’assente (con motivo) dallo zero misurato (che non manca)', () => {
    const { container, props } = renderScreen(OverviewScreen, 'zeros');
    const card = q(container, '[data-overview-card="missing"]')!;
    const absentGroup = q(card, '[data-missing-group="absent:no_samples"]')!;
    const metrics = (g: HTMLElement) => qa(g, '[data-missing-metric]').map((n) => n.getAttribute('data-missing-metric'));
    expect(metrics(absentGroup)).toEqual(expect.arrayContaining(['sleep', 'hourlySteps']));
    expect(absentGroup.textContent).not.toContain(props.copy.measure.zeroMeasured);
    expect(absentGroup.textContent).toContain('2 ore');

    const zeroGroup = q(card, '[data-missing-group="zero"]')!;
    expect(zeroGroup.getAttribute('data-missing-kind')).toBe('zero');
    expect(metrics(zeroGroup)).toEqual(expect.arrayContaining(['activeMinutes', 'floors', 'workouts']));
    expect(zeroGroup.textContent).toContain(props.copy.measure.zeroMeasured);
    // nessun assente finisce nel gruppo dello zero e viceversa
    expect(metrics(zeroGroup)).not.toContain('sleep');
    expect(metrics(absentGroup)).not.toContain('floors');
    // il conteggio «voci» non include gli zeri
    const lacking = Number(card.getAttribute('data-missing-count'));
    expect(lacking).toBe(qa(card, '[data-missing-kind="absent"] [data-missing-metric], [data-missing-kind="partial"] [data-missing-metric]').length);
  });

  it('zeros: la card del sonno dice che la notte non c’e’, senza «0 ore»', () => {
    const { container, props } = renderScreen(OverviewScreen, 'zeros');
    const card = q(container, '[data-overview-card="sleep"]')!;
    expect(card.getAttribute('data-measure-state')).toBe('absent');
    expect(card.textContent).toContain('Nessun dato sulla notte');
    expect(card.textContent).toContain(props.copy.measure.absent.no_samples);
    expect(hasDigit(card.textContent)).toBe(false);
    expect(q(card, '[data-stage-bar]')).toBeNull();
  });

  it('partial: il totale parziale mostra copertura e motivo, e il progresso e’ un «almeno»', () => {
    const { container, props } = renderScreen(OverviewScreen, 'partial');
    const tile = q(container, '[data-kpi="steps"]')!;
    const m = q(tile, '[data-measure-state="partial"]')!;
    expect(m).not.toBeNull();
    expect(m.textContent).toContain(props.copy.measure.partialLabel);
    expect(m.textContent).toContain('79%');
    expect(m.textContent).toContain(props.copy.measure.partial.device_off);
    const goal = q(tile, '[data-goal-progress="partial"]')!;
    expect(goal.textContent).toMatch(/^(Almeno|Obiettivo già raggiunto)/);
  });

  it('partial: fasi assenti = niente barra, ma il totale c’e’ e il motivo e’ scritto', () => {
    const { container, props } = renderScreen(OverviewScreen, 'partial');
    const card = q(container, '[data-overview-card="sleep"]')!;
    expect(q(card, '[data-stage-bar]')).toBeNull();
    expect(card.textContent).toContain('Ripartizione per fase non disponibile');
    expect(card.textContent).toContain(props.copy.measure.absent.source_lacks_type);
    // il totale ricompare solo qui (con le fasi presenti non si ripete)
    expect(q(card, '[data-measure-state="measured"]')!.textContent).toMatch(/h .* min/);
  });

  it('partial: piani assenti e allenamenti non autorizzati non sono zeri', () => {
    const { container, props } = renderScreen(OverviewScreen, 'partial');
    const workouts = q(container, '[data-kpi="workouts"]')!;
    expect(q(workouts, '[data-measure-state="absent"]')).not.toBeNull();
    expect(hasDigit(workouts.textContent)).toBe(false);
    expect(workouts.textContent).toContain(props.copy.measure.absent.permission_missing);

    const card = q(container, '[data-overview-card="missing"]')!;
    const lacksType = q(card, '[data-missing-group="absent:source_lacks_type"]')!;
    const names = qa(lacksType, '[data-missing-metric]').map((n) => n.getAttribute('data-missing-metric'));
    expect(names).toEqual(expect.arrayContaining(['floors', 'sleepStages', 'hrv']));
    expect(q(card, '[data-missing-group="absent:permission_missing"]')).not.toBeNull();
    expect(q(card, '[data-missing-group="partial:device_off"]')).not.toBeNull();
    // le ore 13-17 senza campioni: un tratto solo, scritto per intero
    const run = q(container, '[data-slot-run="absent"]')!;
    expect(run.textContent).toContain('13:00');
    expect(run.textContent).toContain('17:59');
    expect(run.textContent).toContain('5 ore');
  });

  it('stale: passi assenti per «non ancora sincronizzato», sync in errore con motivo ed eta’', () => {
    const { container, props } = renderScreen(OverviewScreen, 'stale');
    const tile = q(container, '[data-kpi="steps"]')!;
    expect(q(tile, '[data-measure-state="absent"]')).not.toBeNull();
    expect(hasDigit(tile.textContent)).toBe(false);
    expect(q(tile, '[data-goal-progress]')).toBeNull();

    const sources = q(container, '[data-overview-card="sources"]')!;
    const sync = q(sources, '[data-sync-state="error"]')!;
    expect(sync.textContent).toContain(props.copy.sync.error);
    expect(sync.textContent).toContain(props.copy.sync.label);
    expect(sync.textContent).toContain('La sorgente non risponde');
    // senza passi non si proclama una sorgente vincitrice
    expect(q(sources, '[data-steps-source="none"]')).not.toBeNull();
    expect(sources.textContent).toContain(props.copy.measure.absent.not_synced_yet);
  });

  it('ok: niente manca, e lo dice con una frase positiva; le quattro fasi sono nella barra', () => {
    const { container, props } = renderScreen(OverviewScreen, 'ok');
    const card = q(container, '[data-overview-card="missing"]')!;
    expect(card.getAttribute('data-missing-count')).toBe('0');
    expect(q(card, '[data-missing-empty]')!.textContent).toContain('Non manca niente');
    expect(q(card, '[data-missing-group]')).toBeNull();

    const sleep = q(container, '[data-overview-card="sleep"]')!;
    expect(q(sleep, '[data-stage-bar]')).not.toBeNull();
    expect(qa(sleep, '[data-stage-segment]').length).toBeGreaterThanOrEqual(3);
    for (const s of ['Svegli', 'Leggero', 'Profondo', 'REM']) expect(sleep.textContent).toContain(s);
    // con le fasi il totale non si ripete nella card: sta nella scheda KPI
    expect(q(sleep, '[data-measure-state="absent"]')).toBeNull();

    const steps = q(container, '[data-kpi="steps"]')!;
    expect(q(steps, '[data-goal-progress]')).not.toBeNull();
    expect(props.data.sources.length).toBeGreaterThan(0);
    expect(q(container, '[data-steps-source="galaxy-watch"]')!.textContent).toContain('Galaxy Watch');
  });

  it('oggi (giornata in corso): le ore future sono «non ancora trascorso», non zero passi', () => {
    const { container, props } = renderScreen(OverviewScreen, 'ok', { day: SYNTHETIC_TODAY });
    const future = props.data.activity.hourlySteps.filter((m) => m.kind === 'absent').length;
    expect(future).toBe(14);

    const card = q(container, '[data-overview-card="missing"]')!;
    const notYet = q(card, '[data-missing-group="absent:not_yet"]')!;
    expect(notYet.textContent).toContain(props.copy.measure.absent.not_yet);
    expect(notYet.textContent).toContain('14 ore');
    const open = q(card, '[data-missing-group="partial:window_open"]')!;
    expect(qa(open, '[data-missing-metric]').map((n) => n.getAttribute('data-missing-metric'))).toEqual(expect.arrayContaining(['steps', 'hourlySteps']));

    const strip = q(container, '#ov-hourly-title')!.closest('section')!;
    expect(qa(strip, 'g[data-slot-state="absent"] [data-bar], g[data-slot-state="absent"] [data-tick]')).toHaveLength(0);
    expect(qa(strip, 'g[data-slot-state="partial"]')).toHaveLength(1);
  });

  it('empty: spiegazione amichevole con il link reale ai dispositivi, prima di tutto il resto', () => {
    for (const lc of ['it', 'en', 'de']) {
      const { container, props } = renderScreen(OverviewScreen, 'empty', { lc });
      const sources = q(container, '[data-overview-card="sources"]')!;
      expect(sources.getAttribute('data-sources-count')).toBe('0');
      expect(q(sources, 'a[data-devices-link]')!.getAttribute('href')).toBe(`/${lc}/app/devices`);
      // sopra le schede KPI
      const kpi = q(container, '[data-kpi="steps"]')!;
      expect(sources.compareDocumentPosition(kpi) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // nessuna scheda mostra una cifra e nessuna disegna un avanzamento
      for (const tile of qa(container, '[data-kpi]')) {
        expect(q(tile, '[data-measure-state="absent"]'), tile.getAttribute('data-kpi') ?? '').not.toBeNull();
        expect(hasDigit(tile.textContent)).toBe(false);
        expect(tile.textContent).toContain(props.copy.measure.absent.no_source);
      }
      expect(q(container, '[data-goal-progress]')).toBeNull();
      cleanup();
    }
  });

  it('empty: i grafici senza nulla da disegnare sono un riquadro tratteggiato, non barre a zero', () => {
    const { container, props } = renderScreen(OverviewScreen, 'empty');
    const strip = q(container, '#ov-hourly-title')!.closest('section')!;
    const panel = q(strip, 'div[data-slot-state="absent"]')!;
    expect(panel.textContent).toContain('Nessun campione in nessuna ora');
    expect(panel.textContent).toContain(props.copy.measure.absent.no_source);
    expect(hasDigit(panel.textContent)).toBe(false);
    expect(qa(strip, '[data-bar], [data-tick]')).toHaveLength(0);

    for (const key of ['steps', 'sleep', 'restingHr']) {
      const row = q(container, `[data-week-row="${key}"]`)!;
      const p = q(row, 'div[data-slot-state="absent"]')!;
      expect(p).not.toBeNull();
      expect(hasDigit(p.textContent)).toBe(false);
      expect(qa(row, '[data-bar], [data-tick], [data-point], [data-line-segment]')).toHaveLength(0);
    }
  });

  it('en: copy in inglese (e le altre lingue usano l’inglese)', () => {
    for (const lc of ['en', 'pt']) {
      const { container } = renderScreen(OverviewScreen, 'partial', { lc });
      const text = container.textContent ?? '';
      for (const s of ['Steps', 'Sleep', 'Resting HR', 'Workouts', 'Active calories', 'What is missing on this day', 'Where your data comes from', 'Last 7 days']) {
        expect(text, `${lc}: ${s}`).toContain(s);
      }
      expect(text).not.toContain('Passi');
      cleanup();
    }
  });
});

describe('OverviewScreen: ultimi 7 giorni, buchi e zeri', () => {
  function withEditedTrends(scenario: ScenarioKey = 'ok') {
    const props = screenProps(scenario);
    const at = (metric: string, back: number) => {
      const series = props.data.trends.find((t) => t.metric === metric)!;
      return series.days[series.days.length - 1 - back];
    };
    // steps: zero misurato due giorni fa, assente tre giorni fa
    at('steps', 2).m = value(0);
    at('steps', 3).m = absent('no_samples');
    // FC a riposo: un buco in mezzo alla settimana e un parziale
    at('restingHr', 3).m = absent('no_samples');
    at('restingHr', 5).m = partial(57, 0.5, 'sync_incomplete');
    return props;
  }

  it('lo zero e’ una tacca, l’assente e’ un riquadro: nessuna barra per nessuno dei due', () => {
    const props = withEditedTrends();
    const { container } = render(<OverviewScreen {...props} />);
    const row = q(container, '[data-week-row="steps"]')!;
    const points = weekSeries(props.data, 'steps');
    const zeroDate = points[points.length - 3].date;
    const absentDate = points[points.length - 4].date;

    const zero = q(row, `g[data-date="${zeroDate}"]`)!;
    expect(zero.getAttribute('data-slot-state')).toBe('zero');
    expect(q(zero, '[data-tick]')).not.toBeNull();
    expect(q(zero, '[data-bar]')).toBeNull();

    const gap = q(row, `g[data-date="${absentDate}"]`)!;
    expect(gap.getAttribute('data-slot-state')).toBe('absent');
    expect(q(gap, '[data-bar], [data-tick], [data-point]')).toBeNull();
    expect(gap.textContent).toContain(props.copy.measure.absent.no_samples);

    // la nota sotto la riga spiega il buco
    expect(row.textContent).toContain('1 giorno senza dato: Nessun campione');
  });

  it('la linea della FC non attraversa un buco: si spezza e riparte', () => {
    const props = withEditedTrends();
    const { container } = render(<OverviewScreen {...props} />);
    const row = q(container, '[data-week-row="restingHr"]')!;
    const points = weekSeries(props.data, 'restingHr');
    // tre giorni, il buco, altri tre giorni: due segmenti, mai uno da sei punti
    expect(lineSegments(points).map((s) => s.length)).toEqual([3, 3]);
    // il secondo giorno e' un parziale: e' un punto a righe ambra, non un punto pieno
    expect(qa(row, 'path[data-line-segment]')).toHaveLength(2);
    expect(qa(row, 'g[data-slot-state="absent"] [data-point]')).toHaveLength(0);
    expect(qa(row, 'g[data-slot-state="partial"] [data-point]').length).toBeGreaterThanOrEqual(1);
  });

  it('la tabella dei 7 giorni distingue zero, parziale e assente per stato', () => {
    const props = withEditedTrends();
    const { container } = render(<OverviewScreen {...props} />);
    const table = q(container, '#ov-week-title')!.closest('section')!.querySelector('table')!;
    const states = qa(table, 'td[data-measure-state]').map((td) => td.getAttribute('data-measure-state'));
    expect(states).toEqual(expect.arrayContaining(['measured', 'measured-zero', 'partial', 'absent']));
    for (const td of qa(table, 'td[data-measure-state="absent"]')) {
      expect(td.textContent).toContain(props.copy.measure.noData);
      expect(td.textContent).toContain(props.copy.measure.absent.no_samples);
    }
    const zeroCell = q(table, 'td[data-measure-state="measured-zero"]')!;
    expect(zeroCell.textContent).toContain('0');
    expect(zeroCell.textContent).toContain(props.copy.measure.zeroMeasured);
  });

  it('il giorno mostrato e’ lo stesso nella scheda e nell’ultima colonna della serie', () => {
    const props = screenProps('partial');
    const points = weekSeries(props.data, 'steps');
    expect(points[points.length - 1].date).toBe(props.data.date);
    expect(points[points.length - 1].m).toEqual(props.data.activity.steps);
    expect(points).toHaveLength(7);
  });
});

describe('OverviewScreen: derivazioni pure', () => {
  it('unmeasuredRuns unisce ore consecutive con lo stesso motivo e non unisce motivi diversi', () => {
    const runs = unmeasuredRuns([value(3), absent('no_samples'), absent('no_samples'), absent('not_yet'), partial(2, 0.5, 'window_open'), value(0)]);
    expect(runs).toEqual([
      { from: 1, to: 2, state: 'absent', reason: 'no_samples', note: undefined },
      { from: 3, to: 3, state: 'absent', reason: 'not_yet', note: undefined },
      { from: 4, to: 4, state: 'partial', reason: undefined, note: 'window_open' },
    ]);
  });

  it('weekStats: la media non e’ diluita dagli assenti, ne’ gonfiata dai parziali; lo zero misurato conta', () => {
    const d = (m: Measure<number>, i: number) => ({ date: `2026-09-${10 + i}`, m });
    const stats = weekStats([d(value(0), 0), d(value(10), 1), d(absent('no_samples'), 2), d(partial(4, 0.4, 'sync_incomplete'), 3)]);
    expect(stats).toMatchObject({ total: 4, measured: 2, partial: 1, absent: 1, zero: 1, mean: 5, lo: 10, hi: 10 });
    expect(stats.absentReasons).toEqual(['no_samples']);
    expect(weekStats([d(absent('no_source'), 0)]).mean).toBeNull();
  });

  it('collectMissing: assenti, poi parziali, poi zeri; mai un assente fra gli zeri', () => {
    const props = screenProps('zeros');
    const kinds = collectMissing(props.data).map((g) => g.kind);
    expect(kinds).toEqual([...kinds].sort((a, b) => ['absent', 'partial', 'zero'].indexOf(a) - ['absent', 'partial', 'zero'].indexOf(b)));
    const zero = collectMissing(props.data).find((g) => g.kind === 'zero')!;
    expect(zero.items.map((i) => i.metric)).not.toContain('sleep');
  });

  it('collectMissing: una lista di allenamenti vuota e’ uno zero misurato, non un’assenza', () => {
    const g = collectMissing(screenProps('zeros').data).find((x) => x.kind === 'zero')!;
    expect(g.items.find((i) => i.metric === 'workouts')?.none).toBe(true);
  });
});

describe('OverviewLoading', () => {
  it('riproduce la griglia con blocchi nascosti agli screen reader e nessun testo', () => {
    const { container } = render(<OverviewLoading />);
    const blocks = qa(container, '[aria-hidden="true"]');
    expect(blocks.length).toBeGreaterThanOrEqual(10);
    expect(container.textContent).toBe('');
    expect(forbiddenCopyIn(container)).toEqual([]);
    // 5 schede KPI come nello schermo vero: tre sopra, due sotto
    expect(qa(container, '.h-\\[9\\.5rem\\]')).toHaveLength(3);
    expect(qa(container, '.h-\\[8\\.5rem\\]')).toHaveLength(2);
  });
});
