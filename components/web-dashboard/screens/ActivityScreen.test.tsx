import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CHART } from '../primitives';
import { ActivityLoading, ActivityScreen } from './ActivityScreen';
import { activityCopy } from './ActivityScreen.copy';
import { absentRuns, countSlots, lastSevenDays, niceTicks, toHourSlots } from './activity/derive';
import { absent, partial, value } from '@/lib/web-dashboard/measure';
import type { ScenarioKey } from '@/lib/web-dashboard/model';
import { forbiddenCopyIn, measureStates, renderScreen } from './test-utils';

afterEach(cleanup);

const SCENARIOS: ScenarioKey[] = ['ok', 'partial', 'zeros', 'stale', 'empty'];
const LOCALES = ['it', 'en'] as const;

const all = (c: HTMLElement, sel: string) => [...c.querySelectorAll<HTMLElement>(sel)];
const one = (c: HTMLElement, sel: string) => {
  const el = c.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`Elemento non trovato: ${sel}`);
  return el;
};
const stateOf = (c: HTMLElement, scope: string) => one(c, `${scope} [data-measure-state]`).getAttribute('data-measure-state');
const hasDigit = (s: string | null) => /\d/.test(s ?? '');

describe('ActivityScreen: rende ogni scenario in it e en', () => {
  for (const sc of SCENARIOS) {
    for (const lc of LOCALES) {
      it(`${sc}/${lc}: senza errori, senza copy vietata, senza h1`, () => {
        const { container } = renderScreen(ActivityScreen, sc, { lc });
        expect(container.querySelector('[data-screen="activity"]')).not.toBeNull();
        expect(forbiddenCopyIn(container)).toEqual([]);
        // niente riferimenti all'AI e niente em dash in nessun testo reso
        expect(container.textContent ?? '').not.toMatch(/\bAI\b|intelligen|\u2014/i);
        // l'h1 e' della shell: qui solo h2
        expect(container.querySelectorAll('h1')).toHaveLength(0);
        expect(container.querySelectorAll('h2').length).toBeGreaterThanOrEqual(5);
      });
    }
  }

  it('un locale diverso da it/en usa la copy inglese e il proprio segmento di lingua nei link', () => {
    const { container } = renderScreen(ActivityScreen, 'empty', { lc: 'de' });
    expect(container.textContent).toContain('Connect a device');
    expect(one(container, 'a[href$="/app/devices"]').getAttribute('href')).toBe('/de/app/devices');
  });
});

describe('zero misurato e assente sono resi in modo diverso', () => {
  it('zeros: 0 piani e 0 minuti attivi sono DATI («0» + «Zero misurato»)', () => {
    const { container, props } = renderScreen(ActivityScreen, 'zeros');
    for (const key of ['floors', 'activeMinutes']) {
      expect(stateOf(container, `[data-metric="${key}"]`)).toBe('measured-zero');
      const text = one(container, `[data-metric="${key}"]`).textContent ?? '';
      expect(text).toContain('0');
      expect(text).toContain(props.copy.measure.zeroMeasured);
    }
    // i passi del giorno sono misurati e non zero
    expect(stateOf(container, '[data-hero="steps"]')).toBe('measured');
  });

  it('partial: i piani assenti non stampano nessuna cifra e dicono perche', () => {
    const { container, props } = renderScreen(ActivityScreen, 'partial');
    const floors = one(container, '[data-metric="floors"] [data-measure-state]');
    expect(floors.getAttribute('data-measure-state')).toBe('absent');
    expect(hasDigit(floors.textContent)).toBe(false);
    expect(floors.textContent).toContain(props.copy.measure.absent.source_lacks_type);
  });

  it('nessun valore assente contiene una cifra, in nessuno scenario e in nessuna lingua', () => {
    for (const sc of SCENARIOS) {
      for (const lc of LOCALES) {
        const { container } = renderScreen(ActivityScreen, sc, { lc });
        for (const el of all(container, '[data-measure-state="absent"]')) expect(hasDigit(el.textContent)).toBe(false);
        // tabelle: la cella dei passi di uno slot assente non ha cifre e dice «Nessun dato»
        for (const cell of all(container, 'tr[data-slot-state="absent"] [data-cell="steps"]')) {
          expect(hasDigit(cell.textContent)).toBe(false);
          expect(cell.textContent).toMatch(/Nessun dato|No data/);
        }
        cleanup();
      }
    }
  });

  it('zeros: nel grafico orario la tacca dello zero e il riquadro dell assente sono elementi diversi', () => {
    const { container, props } = renderScreen(ActivityScreen, 'zeros');
    const hourly = one(container, '[data-chart="hourly-steps"]');
    const slots = props.data.activity.hourlySteps;
    const zeroHours = slots.filter((m) => m.kind === 'value' && m.value === 0).length;
    expect(zeroHours).toBeGreaterThan(0);

    const zeroSlots = all(hourly, 'g[data-chart-slot="measured-zero"]');
    expect(zeroSlots).toHaveLength(zeroHours);
    for (const g of zeroSlots) {
      const rect = one(g, 'rect');
      expect(rect.getAttribute('height')).toBe('3'); // tacca sulla base, non una barra
      expect(rect.getAttribute('fill')).toBe(CHART.steps);
    }

    // le ore 15 e 16 sono senza campioni: UN riquadro tratteggiato, nessuna barra a zero
    const runs = all(hourly, '[data-chart-slot="absent"]');
    expect(runs).toHaveLength(1);
    expect(runs[0].getAttribute('data-hour-from')).toBe('15');
    expect(runs[0].getAttribute('data-hour-to')).toBe('16');
    const box = one(runs[0], 'rect');
    expect(box.getAttribute('stroke-dasharray')).toBeTruthy();
    expect(box.getAttribute('fill')).toContain('absent');
    expect(hourly.querySelector('g[data-hour="15"], g[data-hour="16"]')).toBeNull();

    // e nessuna linea che unisce due punti attraverso il buco
    expect(hourly.querySelectorAll('polyline, path')).toHaveLength(0);
  });

  it('zeros: la tabella oraria conta le ore per stato come i dati', () => {
    const { container, props } = renderScreen(ActivityScreen, 'zeros');
    const hourly = props.data.activity.hourlySteps;
    const rows = (s: string) => all(container, `table[data-table="hourly-steps"] tr[data-slot-state="${s}"]`).length;
    expect(rows('measured') + rows('measured-zero') + rows('partial') + rows('absent')).toBe(24);
    expect(rows('measured-zero')).toBe(hourly.filter((m) => m.kind === 'value' && m.value === 0).length);
    expect(rows('absent')).toBe(2);
    const absentRow = one(container, 'table[data-table="hourly-steps"] tr[data-slot-state="absent"]');
    expect(one(absentRow, '[data-cell="state"]').textContent).toBe(props.copy.measure.absent.no_samples);
  });

  it('il sommario per gli screen reader dice quante ore sono misurate, a zero e mancanti', () => {
    const { container, props } = renderScreen(ActivityScreen, 'zeros');
    const counts = countSlots(toHourSlots(props.data.activity.hourlySteps));
    const label = one(container, '[data-card="hourly-steps"] [role="img"]').getAttribute('aria-label') ?? '';
    expect(label).toContain(`${counts.measured} ore misurate`);
    expect(label).toContain(`${counts.zero} con zero passi`);
    expect(label).toContain(`${counts.absent} ore senza dato`);
    // stessa frase in inglese
    const en = renderScreen(ActivityScreen, 'zeros', { lc: 'en' });
    const labelEn = one(en.container, '[data-card="hourly-steps"] [role="img"]').getAttribute('aria-label') ?? '';
    expect(labelEn).toContain(`${counts.measured} hours measured`);
    expect(labelEn).toContain(`${counts.zero} at zero steps`);
    expect(labelEn).toContain(`${counts.absent} hours with no data`);
  });
});

describe('dato parziale: sempre con copertura e motivo', () => {
  it('partial: i passi sono parziali, con copertura, motivo e anello ambra', () => {
    const { container, props } = renderScreen(ActivityScreen, 'partial');
    const hero = one(container, '[data-hero="steps"]');
    expect(stateOf(container, '[data-hero="steps"]')).toBe('partial');
    expect(hero.textContent).toContain(props.copy.measure.partialLabel);
    expect(hero.textContent).toContain('79%');
    expect(hero.textContent).toContain(props.copy.measure.partial.device_off);
    expect(hero.getAttribute('data-goal-state')).toBe('partial');
    expect(one(hero, '[data-goal-ring]').getAttribute('data-goal-ring')).toBe('partial');
    expect(one(hero, '[data-goal-caption]').textContent).toContain('calcolato sui passi registrati');
  });

  it('partial: le ore senza campioni (13-17) sono un solo riquadro con il motivo scritto sotto', () => {
    const { container, props } = renderScreen(ActivityScreen, 'partial');
    const runs = all(container, '[data-chart="hourly-steps"] [data-chart-slot="absent"]');
    expect(runs).toHaveLength(1);
    expect(runs[0].getAttribute('data-hour-from')).toBe('13');
    expect(runs[0].getAttribute('data-hour-to')).toBe('17');
    const note = one(container, '[data-card="hourly-steps"] [data-chart-notes] [data-note="absent"]');
    expect(note.textContent).toContain('13:00-17:59');
    expect(note.textContent).toContain(props.copy.measure.absent.no_samples);
  });

  it('oggi: l ora in corso e parziale (righe ambra) e le ore future sono assenti "non ancora trascorso"', () => {
    const { container, props } = renderScreen(ActivityScreen, 'ok', { day: '2026-09-24' });
    const partialRows = all(container, 'table[data-table="hourly-steps"] tr[data-slot-state="partial"]');
    expect(partialRows).toHaveLength(1);
    expect(partialRows[0].getAttribute('data-hour')).toBe('9');
    expect(partialRows[0].textContent).toContain(props.copy.measure.partial.window_open);
    const g = one(container, '[data-chart="hourly-steps"] g[data-chart-slot="partial"]');
    expect(one(g, 'rect').getAttribute('fill')).toContain('partial');

    const run = one(container, '[data-chart="hourly-steps"] [data-chart-slot="absent"]');
    expect(run.getAttribute('data-hour-from')).toBe('10');
    expect(run.getAttribute('data-hour-to')).toBe('23');
    expect(run.getAttribute('data-reason')).toBe('not_yet');
    expect(stateOf(container, '[data-hero="steps"]')).toBe('partial');
  });
});

describe('dato assente: empty e stale', () => {
  it('empty: eroe, schede e grafici sono tutti assenti, con il motivo e senza cifre', () => {
    const { container, props } = renderScreen(ActivityScreen, 'empty');
    const states = measureStates(container);
    // eroe + 4 schede; la media dei 7 giorni non c'e' (nessun giorno misurato)
    expect(states).toHaveLength(5);
    expect(new Set(states)).toEqual(new Set(['absent']));
    for (const el of all(container, '[data-measure-state="absent"]')) {
      expect(el.textContent).toContain(props.copy.measure.absent.no_source);
    }
    expect(one(container, '[data-hero="steps"]').getAttribute('data-goal-state')).toBe('absent');

    const hourly = one(container, '[data-chart="hourly-steps"]');
    expect(all(hourly, '[data-chart-slot]:not([data-chart-slot="absent"])')).toHaveLength(0);
    const run = one(hourly, '[data-chart-slot="absent"]');
    expect(run.getAttribute('data-hour-from')).toBe('0');
    expect(run.getAttribute('data-hour-to')).toBe('23');
    // niente cifre sull'asse Y di un grafico senza dati
    expect(all(hourly, 'svg')[0].querySelectorAll('text')).toHaveLength(0);

    const week = one(container, '[data-chart="week-steps"]');
    expect(all(week, '[data-chart-slot]:not([data-chart-slot="absent"])')).toHaveLength(0);
    expect(one(container, '[data-week-average]').textContent).toContain(activityCopy('it').week.averageNone);
  });

  it('empty: spiega la mancanza della fonte e rimanda alla rotta reale per l abbinamento', () => {
    const { container } = renderScreen(ActivityScreen, 'empty');
    expect(container.querySelector('[data-source-empty]')).not.toBeNull();
    expect(container.querySelector('[data-source-name]')).toBeNull();
    const link = one(container, 'a[href="/it/app/devices"]');
    expect(link.className).toContain('min-h-[44px]');
    expect(link.textContent).toContain('Collega un dispositivo');
  });

  it('stale: i passi sono assenti "non ancora sincronizzato", ma la fonte c e e si nomina', () => {
    const { container, props } = renderScreen(ActivityScreen, 'stale');
    const hero = one(container, '[data-hero="steps"] [data-measure-state]');
    expect(hero.getAttribute('data-measure-state')).toBe('absent');
    expect(hero.textContent).toContain(props.copy.measure.absent.not_synced_yet);
    expect(one(container, '[data-source-name]').textContent).toBe('Galaxy Watch');
    expect(one(container, '[data-source-absent]').textContent).toContain(props.copy.measure.absent.not_synced_yet);
    // due giorni recenti senza dato: un solo riquadro sui 7 giorni, gli altri restano barre
    const run = one(container, '[data-chart="week-steps"] [data-chart-slot="absent"]');
    expect(run.getAttribute('data-day-from')).toBe('2026-09-22');
    expect(run.getAttribute('data-day-to')).toBe('2026-09-23');
    expect(all(container, '[data-chart="week-steps"] g[data-chart-slot="measured"]')).toHaveLength(5);
  });
});

describe('fonte dei passi', () => {
  it('ok: nomina la fonte scelta, dice che non somma e mostra la fonte non usata', () => {
    const { container } = renderScreen(ActivityScreen, 'ok');
    expect(one(container, '[data-source-name]').textContent).toBe('Galaxy Watch');
    const card = one(container, '[data-card="steps-source"]');
    expect(card.textContent).toContain('Non somma più sorgenti insieme');
    expect(one(card, '[data-not-added]').textContent).toContain('Telefono');
    expect(one(card, 'a').getAttribute('href')).toBe('/it/dashboard-preview/sources');
  });

  it('en: la regola e scritta in inglese, in parole semplici', () => {
    const { container } = renderScreen(ActivityScreen, 'ok', { lc: 'en' });
    expect(one(container, '[data-card="steps-source"]').textContent).toContain('It does not add sources together');
  });
});

describe('ultimi 7 giorni', () => {
  it('ok: sette giorni, il giorno mostrato non e un link e gli altri sono link da 44 px al loro giorno', () => {
    const { container } = renderScreen(ActivityScreen, 'ok');
    const items = all(container, '[data-week-days] li');
    expect(items).toHaveLength(7);
    expect(items[6].querySelector('a')).toBeNull();
    expect(items[6].querySelector('[aria-current="date"]')).not.toBeNull();
    const links = all(container, '[data-week-days] a');
    expect(links).toHaveLength(6);
    for (const a of links) expect(a.className).toContain('min-h-[44px]');
    expect(links[0].getAttribute('href')).toBe('/it/dashboard-preview/activity?day=2026-09-17');
  });

  it('il giorno mostrato ha la stessa cifra nell eroe e nella barra', () => {
    const { container, props } = renderScreen(ActivityScreen, 'ok');
    const steps = props.data.activity.steps;
    const days = lastSevenDays(props.data);
    expect(days[6].m).toBe(steps);
    const selected = one(container, '[data-chart="week-steps"] g[data-selected="true"]');
    expect(selected.getAttribute('data-date')).toBe(props.data.date);
  });

  it('partial: giorni parziali e assenti restano distinti da quelli misurati', () => {
    const { container, props } = renderScreen(ActivityScreen, 'partial', { day: '2026-09-15' });
    const days = lastSevenDays(props.data);
    const counts = countSlots(days.map((d) => d.slot));
    const rows = (s: string) => all(container, `table[data-table="week-steps"] tr[data-slot-state="${s}"]`).length;
    expect(rows('absent')).toBe(counts.absent);
    expect(rows('partial')).toBe(counts.partial);
    expect(rows('measured') + rows('measured-zero')).toBe(counts.measured);
    const li = all(container, '[data-week-days] li').map((x) => x.getAttribute('data-slot-state'));
    expect(li).toEqual(days.map((d) => d.slot.state));
    // la media esclude parziali e assenti
    const measured = days.filter((d) => d.m.kind === 'value');
    if (measured.length > 0) expect(one(container, '[data-week-average]').textContent).toContain(String(measured.length));
  });

  it('la linea dell obiettivo c e quando c e un obiettivo e un dato', () => {
    expect(renderScreen(ActivityScreen, 'ok').container.querySelector('[data-goal-line]')).not.toBeNull();
  });
});

describe('accessibilita: grafici e tabelle', () => {
  it('ogni grafico ha un riassunto testuale e una tabella dentro <details>', () => {
    const { container } = renderScreen(ActivityScreen, 'ok');
    const imgs = all(container, '[role="img"][aria-label]');
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    for (const el of imgs) expect((el.getAttribute('aria-label') ?? '').length).toBeGreaterThan(30);
    expect(container.querySelectorAll('details table[data-table="hourly-steps"] tbody tr')).toHaveLength(24);
    expect(container.querySelectorAll('details table[data-table="week-steps"] tbody tr')).toHaveLength(7);
    for (const t of all(container, 'table')) {
      expect(t.querySelector('caption')).not.toBeNull();
      expect(t.querySelector('th[scope="col"]')).not.toBeNull();
    }
  });
});

describe('ActivityLoading', () => {
  it('rende solo blocchi nascosti agli screen reader, senza testo ne cifre', () => {
    const { container } = render(<ActivityLoading />);
    expect(container.textContent).toBe('');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(8);
  });
});

describe('derivazioni pure', () => {
  it('toHourSlots: sempre 24 slot; i mancanti sono assenti, non zero', () => {
    const slots = toHourSlots([value(0), partial(5, 0.5, 'window_open')]);
    expect(slots).toHaveLength(24);
    expect(slots[0].state).toBe('measured-zero');
    expect(slots[1].state).toBe('partial');
    expect(slots[2].state).toBe('absent');
    expect(slots[2].value).toBeNull();
  });

  it('absentRuns: unisce i tratti con lo stesso motivo e separa quelli con motivi diversi', () => {
    const slots = toHourSlots([
      absent('no_samples'), absent('no_samples'), value(0), absent('no_samples'), absent('not_yet'), absent('not_yet'),
    ]);
    const runs = absentRuns(slots).slice(0, 3);
    expect(runs).toEqual([
      { from: 0, to: 1, reason: 'no_samples' },
      { from: 3, to: 3, reason: 'no_samples' },
      { from: 4, to: 5, reason: 'not_yet' },
    ]);
  });

  it('niceTicks: tetto vicino al massimo, passi interi', () => {
    expect(niceTicks(13200)).toEqual({ top: 15000, ticks: [0, 5000, 10000, 15000] });
    expect(niceTicks(1198).top).toBe(1500);
    expect(niceTicks(0)).toEqual({ top: 0, ticks: [0] });
    expect(niceTicks(7).ticks.every(Number.isInteger)).toBe(true);
  });
});
