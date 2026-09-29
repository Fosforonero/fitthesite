import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { absent, partial, value, type AbsentReason, type Measure } from '@/lib/web-dashboard/measure';
import type { ScenarioKey, Workout } from '@/lib/web-dashboard/model';
import { WATCH } from '@/lib/web-dashboard/synthetic';
import { WorkoutsLoading, WorkoutsScreen } from './WorkoutsScreen';
import { workoutsCopy } from './WorkoutsScreen.copy';
import { absentRuns, activeMinutesWeek, countDays, listState, meanOfMeasuredDays, summarize } from './workouts/derive';
import { forbiddenCopyIn, renderScreen, screenProps } from './test-utils';

afterEach(cleanup);

const SCENARIOS: ScenarioKey[] = ['ok', 'partial', 'zeros', 'stale', 'empty'];
const LOCALES = ['it', 'en'] as const;
const REASONS: AbsentReason[] = ['no_source', 'not_synced_yet', 'permission_missing', 'source_lacks_type', 'no_samples', 'not_yet', 'read_error'];

const all = (c: HTMLElement, sel: string) => [...c.querySelectorAll<HTMLElement>(sel)];
const one = (c: HTMLElement, sel: string) => {
  const el = c.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`Elemento non trovato: ${sel}`);
  return el;
};
const stateOf = (c: HTMLElement, scope: string) => one(c, `${scope} [data-measure-state]`).getAttribute('data-measure-state');
const hasDigit = (s: string | null) => /\d/.test(s ?? '');

const RUN_DAY = '2026-09-22'; // martedi': una corsa con distanza
const SUNDAY = '2026-09-20'; // nessun allenamento nel generatore, anche in `ok`

const mk = (over: Partial<Workout> = {}): Workout => ({
  id: 'w1',
  type: 'run',
  title: 'Corsa',
  startedAt: '2026-09-23T18:10:00+02:00',
  durationMin: value(40),
  distanceKm: value(7.4),
  caloriesKcal: value(320),
  hrAvg: value(140),
  hrMax: value(170),
  source: WATCH,
  ...over,
});

/** Schermata con un elenco di sessioni deciso dal test (il generatore non produce ogni combinazione). */
function renderWith(sessions: Measure<Workout[]>, opts: { lc?: string; day?: string } = {}) {
  const props = screenProps('ok', opts);
  const data = { ...props.data, workouts: { sessions } };
  const view = render(<WorkoutsScreen {...props} data={data} />);
  return { ...view, props: { ...props, data } };
}

describe('WorkoutsScreen: rende ogni scenario in it e en', () => {
  for (const sc of SCENARIOS) {
    for (const lc of LOCALES) {
      it(`${sc}/${lc}: senza errori, senza copy vietata, senza h1`, () => {
        const { container } = renderScreen(WorkoutsScreen, sc, { lc });
        expect(container.querySelector('[data-screen="workouts"]')).not.toBeNull();
        expect(forbiddenCopyIn(container)).toEqual([]);
        // niente riferimenti all'AI e niente em dash in nessun testo reso
        expect(container.textContent ?? '').not.toMatch(/\bAI\b|intelligen|—/i);
        // l'h1 e' della shell: qui solo h2
        expect(container.querySelectorAll('h1')).toHaveLength(0);
        expect(container.querySelectorAll('h2').length).toBeGreaterThanOrEqual(3);
        // una sola delle tre affermazioni sull'elenco alla volta
        const kinds = all(container, '[data-list-state]').map((n) => n.getAttribute('data-list-state'));
        expect(kinds).toHaveLength(1);
      });
    }
  }

  it('la stessa cosa per una giornata con allenamento e per una senza, in ok', () => {
    for (const day of [RUN_DAY, SUNDAY]) {
      const { container } = renderScreen(WorkoutsScreen, 'ok', { day });
      expect(forbiddenCopyIn(container)).toEqual([]);
      expect(container.querySelectorAll('h1')).toHaveLength(0);
      cleanup();
    }
  });

  it('un locale diverso da it/en usa la copy inglese e il proprio segmento di lingua nei link', () => {
    const { container } = renderScreen(WorkoutsScreen, 'empty', { lc: 'de' });
    expect(container.textContent).toContain('Connect a device');
    expect(one(container, 'a[href$="/app/devices"]').getAttribute('href')).toBe('/de/app/devices');
  });

  it('lo scheletro si rende e non contiene testo di dati', () => {
    const { container } = render(<WorkoutsLoading />);
    expect(container.querySelector('[data-screen="workouts-loading"]')).not.toBeNull();
    expect((container.textContent ?? '').trim()).toBe('');
  });
});

describe('le tre situazioni dell elenco non si scambiano', () => {
  it('ok: ci sono sessioni, con i campi per riga', () => {
    const { container } = renderScreen(WorkoutsScreen, 'ok', { day: RUN_DAY });
    expect(one(container, '[data-list-state]').getAttribute('data-list-state')).toBe('sessions');
    const row = one(container, '[data-session]');
    expect(row.getAttribute('data-type')).toBe('run');
    expect(stateOf(row, '[data-cell="distance"]')).toBe('measured');
    expect(row.textContent).toContain('km');
    expect(stateOf(container, '[data-metric="sessions"]')).toBe('measured');
  });

  it('(b) zeros: lista vuota MISURATA, frase positiva e nessun «non sappiamo»', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'zeros');
    expect(props.data.workouts.sessions).toEqual({ kind: 'value', value: [] });
    const box = one(container, '[data-list-state]');
    expect(box.getAttribute('data-list-state')).toBe('measured-empty');
    expect(box.textContent).toContain('Nessun allenamento registrato per questo giorno');
    expect(container.textContent).not.toMatch(/Non sappiamo/);
    expect(container.querySelector('[data-session]')).toBeNull();
    // il riepilogo dice zero: e' un DATO
    for (const key of ['sessions', 'duration', 'calories']) {
      expect(stateOf(container, `[data-metric="${key}"]`)).toBe('measured-zero');
      const text = one(container, `[data-metric="${key}"]`).textContent ?? '';
      expect(text).toContain('0');
      expect(text).toContain(props.copy.measure.zeroMeasured);
    }
  });

  it('(b) la stessa frase in inglese', () => {
    const { container } = renderScreen(WorkoutsScreen, 'zeros', { lc: 'en' });
    expect(container.textContent).toContain('No workouts recorded for this day');
    expect(container.textContent).not.toMatch(/We do not know/);
  });

  it('(b) lista vuota misurata anche in ok (una domenica senza allenamento)', () => {
    const { container } = renderScreen(WorkoutsScreen, 'ok', { day: SUNDAY });
    expect(one(container, '[data-list-state]').getAttribute('data-list-state')).toBe('measured-empty');
  });

  it('(c) partial: lista ASSENTE (permesso), niente frase dello zero e riepilogo senza cifre', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'partial');
    const box = one(container, '[data-list-state]');
    expect(box.getAttribute('data-list-state')).toBe('absent');
    expect(box.getAttribute('data-reason')).toBe('permission_missing');
    expect(box.textContent).toContain('Non sappiamo se ci sono stati allenamenti');
    expect(box.textContent).toContain(props.copy.measure.absent.permission_missing);
    // una frase semplice: il permesso si concede nell'app FitMesh
    expect(box.textContent).toContain('dall’app FitMesh');
    expect(container.textContent).not.toMatch(/Nessun allenamento registrato/);
    expect(container.querySelector('[data-session]')).toBeNull();
    for (const key of ['sessions', 'duration', 'calories']) {
      const tile = one(container, `[data-metric="${key}"] [data-measure-state]`);
      expect(tile.getAttribute('data-measure-state')).toBe('absent');
      expect(hasDigit(tile.textContent)).toBe(false);
      expect(tile.textContent).toContain(props.copy.measure.absent.permission_missing);
    }
  });

  it('(c) ogni motivo di assenza: «non sappiamo», mai la frase dello zero, mai una cifra nel riepilogo', () => {
    for (const reason of REASONS) {
      for (const lc of LOCALES) {
        const { container, props } = renderWith(absent(reason), { lc });
        const box = one(container, '[data-list-state]');
        expect(box.getAttribute('data-list-state')).toBe('absent');
        expect(box.getAttribute('data-reason')).toBe(reason);
        expect(box.textContent).toContain(lc === 'it' ? 'Non sappiamo se ci sono stati allenamenti' : 'We do not know whether there were any workouts');
        expect(box.textContent).toContain(props.copy.measure.absent[reason]);
        expect(container.textContent).not.toMatch(/Nessun allenamento registrato|No workouts recorded/);
        for (const el of all(container, '[data-metric] [data-measure-state]')) {
          expect(el.getAttribute('data-measure-state')).toBe('absent');
          expect(hasDigit(el.textContent)).toBe(false);
        }
        expect(forbiddenCopyIn(container)).toEqual([]);
        cleanup();
      }
    }
  });

  it('(c) il collegamento al dispositivo c e solo per «nessuna fonte»; il tentativo solo per la lettura fallita', () => {
    for (const reason of REASONS) {
      const { container } = renderWith(absent(reason));
      const devices = container.querySelector('a[href="/it/app/devices"]');
      expect(devices !== null).toBe(reason === 'no_source');
      const retry = all(container, '[data-list-state="absent"] a').filter((a) => a.getAttribute('href') !== '/it/app/devices');
      expect(retry.length > 0).toBe(reason === 'read_error');
      cleanup();
    }
  });

  it('empty e stale: assente con il proprio motivo', () => {
    const empty = renderScreen(WorkoutsScreen, 'empty');
    expect(one(empty.container, '[data-list-state]').getAttribute('data-reason')).toBe('no_source');
    expect(one(empty.container, 'a[href="/it/app/devices"]').textContent).toContain('Collega un dispositivo');
    cleanup();
    const stale = renderScreen(WorkoutsScreen, 'stale');
    expect(one(stale.container, '[data-list-state]').getAttribute('data-reason')).toBe('not_synced_yet');
  });
});

describe('zero, parziale e assente dentro una sessione', () => {
  it('ok, mercoledi: la distanza assente non stampa cifre e dice perche; il resto e misurato', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'ok');
    const row = one(container, '[data-session]');
    expect(row.getAttribute('data-type')).toBe('strength');
    const distance = one(row, '[data-cell="distance"] [data-measure-state]');
    expect(distance.getAttribute('data-measure-state')).toBe('absent');
    expect(hasDigit(distance.textContent)).toBe(false);
    expect(distance.textContent).not.toMatch(/km/);
    expect(distance.textContent).toContain(props.copy.measure.absent.source_lacks_type);
    for (const cell of ['duration', 'calories', 'hrAvg', 'hrMax']) expect(stateOf(row, `[data-cell="${cell}"]`)).toBe('measured');
  });

  it('un campo misurato a zero, uno parziale e uno assente nella stessa sessione restano tre cose diverse', () => {
    const { container, props } = renderWith(
      value([mk({ hrMax: value(0), distanceKm: partial(3.2, 0.5, 'device_off'), caloriesKcal: absent('no_samples') })]),
    );
    const row = one(container, '[data-session]');
    // zero misurato: «0» e «Zero misurato»
    expect(stateOf(row, '[data-cell="hrMax"]')).toBe('measured-zero');
    expect(one(row, '[data-cell="hrMax"]').textContent).toContain('0');
    expect(one(row, '[data-cell="hrMax"]').textContent).toContain(props.copy.measure.zeroMeasured);
    // parziale: cifra + copertura + motivo
    expect(stateOf(row, '[data-cell="distance"]')).toBe('partial');
    const distance = one(row, '[data-cell="distance"]').textContent ?? '';
    expect(distance).toContain('3,2');
    expect(distance).toContain('50%');
    expect(distance).toContain(props.copy.measure.partial.device_off);
    // assente: nessuna cifra
    expect(stateOf(row, '[data-cell="calories"]')).toBe('absent');
    expect(hasDigit(one(row, '[data-cell="calories"]').textContent)).toBe(false);
    expect(one(row, '[data-cell="calories"]').textContent).toContain(props.copy.measure.absent.no_samples);
  });

  it('il riepilogo non somma gli assenti: totale parziale e «somma su 1 di 2»', () => {
    const { container } = renderWith(
      value([
        mk({ id: 'a', durationMin: value(40), caloriesKcal: value(300) }),
        mk({ id: 'b', startedAt: '2026-09-23T19:10:00+02:00', durationMin: value(30), caloriesKcal: absent('no_samples') }),
      ]),
    );
    expect(stateOf(container, '[data-metric="sessions"]')).toBe('measured');
    // 40 + 30 = 70 minuti: totale pieno
    expect(stateOf(container, '[data-metric="duration"]')).toBe('measured');
    expect(one(container, '[data-metric="duration"]').textContent).toContain('1 h 10');
    // 300 + (assente) NON e' 300 kcal pieni: e' parziale e dice su quante sessioni
    const kcal = one(container, '[data-metric="calories"]');
    expect(stateOf(container, '[data-metric="calories"]')).toBe('partial');
    expect(kcal.textContent).toContain('300');
    expect(kcal.textContent).toContain('Somma delle sessioni con dato: 1 su 2.');
  });

  it('tutte le calorie assenti: il riepilogo e assente, non 0 kcal', () => {
    const { container } = renderWith(value([mk({ caloriesKcal: absent('source_lacks_type') })]));
    const tile = one(container, '[data-metric="calories"] [data-measure-state]');
    expect(tile.getAttribute('data-measure-state')).toBe('absent');
    expect(hasDigit(tile.textContent)).toBe(false);
  });

  it('elenco PARZIALE: si dice, e nessun totale e pieno', () => {
    const { container, props } = renderWith(partial([mk()], 0.6, 'sync_incomplete'));
    const box = one(container, '[data-list-state="partial"]');
    expect(box.textContent).toContain('60%');
    expect(box.textContent).toContain(props.copy.measure.partial.sync_incomplete);
    expect(container.querySelector('[data-list-state="sessions"]')).not.toBeNull();
    for (const key of ['sessions', 'duration', 'calories']) expect(stateOf(container, `[data-metric="${key}"]`)).toBe('partial');
  });

  it('elenco parziale e VUOTO: non e la frase dello zero', () => {
    const { container } = renderWith(partial([], 0.5, 'device_off'));
    expect(container.querySelector('[data-list-state="partial-empty"]')).not.toBeNull();
    expect(container.querySelector('[data-list-state="measured-empty"]')).toBeNull();
    expect(container.textContent).not.toMatch(/Nessun allenamento registrato/);
    expect(stateOf(container, '[data-metric="sessions"]')).toBe('partial');
  });

  it('le sessioni escono in ordine di orario, non nell ordine di arrivo', () => {
    const { container } = renderWith(
      value([mk({ id: 'late', startedAt: '2026-09-23T19:30:00+02:00' }), mk({ id: 'early', startedAt: '2026-09-23T07:10:00+02:00' })]),
    );
    expect(all(container, '[data-session]').map((n) => n.getAttribute('data-session'))).toEqual(['early', 'late']);
  });

  it('nessun valore assente contiene una cifra, in nessuno scenario e in nessuna lingua', () => {
    for (const sc of SCENARIOS) {
      for (const lc of LOCALES) {
        const { container } = renderScreen(WorkoutsScreen, sc, { lc });
        for (const el of all(container, '[data-measure-state="absent"]')) expect(hasDigit(el.textContent)).toBe(false);
        for (const cell of all(container, 'tr[data-slot-state="absent"] [data-cell="minutes"]')) {
          expect(hasDigit(cell.textContent)).toBe(false);
          expect(cell.textContent).toMatch(/Nessun dato|No data/);
        }
        cleanup();
      }
    }
  });
});

describe('minuti attivi degli ultimi 7 giorni: zero, parziale e assente', () => {
  it('zeros: la tacca dello zero e il riquadro dell assente sono elementi diversi', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'zeros');
    const chart = one(container, '[data-chart="week-active-minutes"]');
    const days = activeMinutesWeek(props.data);
    const counts = countDays(days);
    expect(counts.zero).toBeGreaterThan(0);
    expect(counts.absent).toBeGreaterThan(0);

    const ticks = all(chart, '[data-bar="tick"]');
    expect(ticks).toHaveLength(counts.zero);
    for (const tick of ticks) {
      expect(tick.getAttribute('height')).toBe('3');
      // la tacca vale zero ed e' un dato: sopra c'e' la cifra «0»
      expect(tick.closest('[data-slot-state]')?.getAttribute('data-slot-state')).toBe('measured-zero');
      expect(tick.closest('g')?.querySelector('text')?.textContent).toBe('0');
    }

    const boxes = all(chart, 'g[data-slot-state="absent"]');
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      // assente: nessuna barra, nessuna cifra, contorno tratteggiato
      expect(box.querySelector('[data-bar]')).toBeNull();
      expect(box.querySelector('rect')?.getAttribute('stroke-dasharray')).toBeTruthy();
      expect(box.querySelector('text')?.textContent ?? '').not.toMatch(/\d/);
    }
    // nessuna linea che scavalca un buco
    expect(chart.querySelector('polyline, path[d^="M"][data-line]')).toBeNull();
  });

  it('ogni giorno ha in elenco lo stesso stato della sua misura', () => {
    for (const sc of SCENARIOS) {
      const { container, props } = renderScreen(WorkoutsScreen, sc);
      const days = activeMinutesWeek(props.data);
      const items = all(container, '[data-week-days] li[data-day]');
      expect(items).toHaveLength(7);
      days.forEach((d, i) => {
        expect(items[i].getAttribute('data-day')).toBe(d.date);
        expect(items[i].getAttribute('data-slot-state')).toBe(d.state);
      });
      cleanup();
    }
  });

  it('il giorno assente non diventa 0 nella tabella e dice il motivo', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'zeros');
    const rows = all(container, 'table[data-table="week-active-minutes"] tr[data-slot-state="absent"]');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(one(row, '[data-cell="minutes"]').textContent).toContain(props.copy.measure.noData);
      expect(hasDigit(one(row, '[data-cell="minutes"]').textContent)).toBe(false);
      expect(one(row, '[data-cell="state"]').textContent).toContain(props.copy.measure.absent.no_samples);
    }
    const zero = one(container, 'table[data-table="week-active-minutes"] tr[data-slot-state="measured-zero"]');
    expect(one(zero, '[data-cell="minutes"]').textContent).toContain('0');
    expect(one(zero, '[data-cell="state"]').textContent).toContain(props.copy.measure.zeroMeasured);
  });

  it('empty: sette giorni assenti con lo stesso motivo sono UN riquadro, con il motivo scritto', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'empty');
    const boxes = all(container, '[data-chart="week-active-minutes"] g[data-slot-state="absent"]');
    expect(boxes).toHaveLength(1);
    expect(boxes[0].getAttribute('data-reason')).toBe('no_source');
    expect(boxes[0].textContent).toContain(props.copy.measure.absent.no_source);
    expect(container.querySelector('[data-chart="week-active-minutes"] [data-bar]')).toBeNull();
    expect(one(container, '[data-week-average]').textContent).toContain('Nessun giorno misurato');
  });

  it('stale: gli ultimi giorni sono assenti «non ancora sincronizzato», gli altri sono misurati', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'stale');
    const days = activeMinutesWeek(props.data);
    expect(days.filter((d) => d.state === 'absent').map((d) => d.date)).toEqual(['2026-09-22', '2026-09-23']);
    const note = one(container, '[data-week-notes]');
    expect(note.textContent).toContain(props.copy.measure.absent.not_synced_yet);
    expect(all(container, '[data-chart="week-active-minutes"] [data-bar="fill"]')).toHaveLength(5);
  });

  it('i giorni sono link che tengono lo stato dell anteprima; il giorno mostrato no', () => {
    const { container } = renderScreen(WorkoutsScreen, 'zeros');
    const links = all(container, '[data-week-days] a');
    expect(links).toHaveLength(6);
    for (const a of links) {
      const href = a.getAttribute('href') ?? '';
      expect(href).toContain('/it/dashboard-preview/workouts');
      expect(href).toContain('state=zeros');
      expect(href).toMatch(/day=2026-09-1[7-9]|day=2026-09-2[0-2]/);
    }
    expect(one(container, '[data-week-days] [aria-current="date"]').textContent).toContain('23');
  });

  it('il grafico ha il riassunto per gli screen reader e la tabella alternativa dentro details', () => {
    const { container } = renderScreen(WorkoutsScreen, 'zeros');
    const img = one(container, '[data-chart="week-active-minutes"] [role="img"]');
    expect(img.getAttribute('aria-label')).toMatch(/giorni misurati/);
    expect(img.getAttribute('aria-label')).toMatch(/zero misurato/);
    expect(one(container, 'details table[data-table="week-active-minutes"]')).toBeTruthy();
    // niente elementi focalizzabili dentro l'immagine del grafico
    expect(img.querySelector('a, button, input')).toBeNull();
  });

  it('la media e dei soli giorni MISURATI (zero compresi), non diluita dagli assenti', () => {
    const { props } = renderScreen(WorkoutsScreen, 'zeros');
    const days = activeMinutesWeek(props.data);
    const measured = days.filter((d) => d.state === 'measured' || d.state === 'measured-zero');
    const expected = measured.reduce((s, d) => s + (d.value ?? 0), 0) / measured.length;
    expect(meanOfMeasuredDays(days)).toEqual({ mean: expected, n: measured.length });
    expect(measured.length).toBeLessThan(7);
  });
});

describe('derive: regole pure', () => {
  it('listState distingue vuoto misurato, assente e con sessioni', () => {
    expect(listState(value([])).kind).toBe('measured-empty');
    expect(listState(absent('read_error'))).toEqual({ kind: 'absent', reason: 'read_error' });
    expect(listState(value([mk()])).kind).toBe('sessions');
    const p = listState(partial([mk()], 0.4, 'device_off'));
    expect(p.kind === 'sessions' && p.partial).toEqual({ coverage: 0.4, note: 'device_off' });
  });

  it('summarize: assente non e mai 0, vuoto misurato e 0', () => {
    for (const reason of REASONS) {
      const s = summarize(absent(reason));
      for (const m of [s.count, s.duration, s.calories]) expect(m).toEqual({ kind: 'absent', reason });
    }
    const z = summarize(value([]));
    for (const m of [z.count, z.duration, z.calories]) expect(m).toEqual({ kind: 'value', value: 0 });
  });

  it('absentRuns unisce solo i giorni consecutivi con lo stesso motivo', () => {
    const base = { date: '', selected: false, value: null, coverage: null, note: null } as const;
    const st = (index: number, reason: AbsentReason | null) =>
      reason ? { ...base, index, state: 'absent' as const, reason } : { ...base, index, state: 'measured' as const, value: 5, reason: null };
    const runs = absentRuns([st(0, 'no_samples'), st(1, 'no_samples'), st(2, null), st(3, 'no_samples'), st(4, 'not_synced_yet'), st(5, 'not_synced_yet'), st(6, null)]);
    expect(runs).toEqual([
      { from: 0, to: 1, reason: 'no_samples' },
      { from: 3, to: 3, reason: 'no_samples' },
      { from: 4, to: 5, reason: 'not_synced_yet' },
    ]);
  });

  it('la copy non ha em dash ne parole di disponibilita in nessuna lingua', () => {
    for (const l of LOCALES) {
      const t = workoutsCopy(l);
      const text = JSON.stringify(t, (_k, v) => (typeof v === 'function' ? v(1, 2) : v));
      expect(text).not.toMatch(/—|coming soon|prossimamente|a breve|in arrivo|\bAI\b/i);
      expect(t.week.summary({ measured: 1, zero: 1, partial: 0, absent: 0 })).not.toMatch(/—/);
    }
  });
});
