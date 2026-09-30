import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { absent, partial, value, type AbsentReason, type Measure } from '@/lib/web-dashboard/measure';
import type { ScenarioKey, Workout, WorkoutsDay, WorkoutsWeekDay } from '@/lib/web-dashboard/model';
import { FORBIDDEN_SYNC_NAMES } from '@/lib/web-dashboard/regression-patterns';
import { WorkoutsLoading, WorkoutsScreen } from './WorkoutsScreen';
import { workoutsCopy } from './WorkoutsScreen.copy';
import { absentRuns, countDays, listState, summarize, totalOfMeasuredDays, workoutsWeek } from './workouts/derive';
import { forbiddenCopyIn, renderScreen, screenProps } from './test-utils';

afterEach(cleanup);

const SCENARIOS: ScenarioKey[] = ['ok', 'partial', 'zeros', 'stale', 'empty'];
const LOCALES = ['it', 'en'] as const;
const REASONS: AbsentReason[] = ['no_data_received', 'not_synced_yet', 'source_lacks_type', 'no_samples', 'not_yet'];

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
  startedAt: '2026-09-23T18:10:00+02:00',
  durationMin: value(40),
  distanceKm: value(7.4),
  caloriesKcal: value(320),
  hrAvg: value(140),
  ...over,
});

/** Schermata con un elenco di sessioni deciso dal test (il generatore non produce ogni combinazione). */
function renderWith(sessions: Measure<Workout[]>, opts: { lc?: string; day?: string } = {}) {
  const props = screenProps('ok', opts);
  const data = { ...props.data, workouts: { sessions, week: props.data.workouts.week } };
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
        expect(container.querySelectorAll('h2').length).toBeGreaterThanOrEqual(2);
        // una sola delle due affermazioni sull'elenco alla volta
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

describe('le due situazioni dell elenco non si scambiano: mai «nessun allenamento» misurato', () => {
  it('ok: ci sono sessioni, con i campi per riga', () => {
    const { container } = renderScreen(WorkoutsScreen, 'ok', { day: RUN_DAY });
    expect(one(container, '[data-list-state]').getAttribute('data-list-state')).toBe('sessions');
    const row = one(container, '[data-session]');
    expect(row.getAttribute('data-type')).toBe('run');
    expect(stateOf(row, '[data-cell="distance"]')).toBe('measured');
    expect(row.textContent).toContain('km');
    expect(stateOf(container, '[data-metric="sessions"]')).toBe('measured');
  });

  it('zeros: nessuna riga nel giorno NON e «nessun allenamento»: e assente (nessun campione), senza cifre e senza la frase dello zero', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'zeros');
    expect(props.data.workouts.sessions).toEqual({ kind: 'absent', reason: 'no_samples' });
    const box = one(container, '[data-list-state]');
    expect(box.getAttribute('data-list-state')).toBe('absent');
    expect(box.getAttribute('data-reason')).toBe('no_samples');
    expect(box.textContent).toContain('Non sappiamo se ci sono stati allenamenti');
    expect(container.textContent).not.toMatch(/Nessun allenamento registrato|zero allenamenti/i);
    expect(container.querySelector('[data-session]')).toBeNull();
    for (const key of ['sessions', 'duration', 'calories']) {
      const el = one(container, `[data-metric="${key}"] [data-measure-state]`);
      expect(el.getAttribute('data-measure-state')).toBe('absent');
      expect(hasDigit(el.textContent)).toBe(false);
      expect(one(container, `[data-metric="${key}"]`).textContent).not.toContain(props.copy.measure.zeroMeasured);
    }
  });

  it('la stessa cosa in inglese', () => {
    const { container } = renderScreen(WorkoutsScreen, 'zeros', { lc: 'en' });
    expect(container.textContent).toContain('We do not know whether there were any workouts');
    expect(container.textContent).not.toMatch(/No workouts recorded|zero workouts/i);
  });

  it('una domenica senza allenamento, anche in ok, e assente e non uno zero', () => {
    const { container } = renderScreen(WorkoutsScreen, 'ok', { day: SUNDAY });
    const box = one(container, '[data-list-state]');
    expect(box.getAttribute('data-list-state')).toBe('absent');
    expect(box.getAttribute('data-reason')).toBe('no_samples');
    expect(container.querySelector('[data-list-state="measured-empty"]')).toBeNull();
  });

  it('una lista vuota costruita a mano (value([]) o partial([])) non diventa mai uno zero: e assente', () => {
    for (const forged of [value([] as Workout[]), partial([] as Workout[], 0.5, 'incomplete_coverage')]) {
      const { container, props } = renderWith(forged);
      const box = one(container, '[data-list-state]');
      expect(box.getAttribute('data-list-state')).toBe('absent');
      expect(box.getAttribute('data-reason')).toBe('no_samples');
      expect(container.textContent).not.toMatch(/Nessun allenamento registrato/);
      for (const key of ['sessions', 'duration', 'calories']) {
        const el = one(container, `[data-metric="${key}"] [data-measure-state]`);
        expect(el.getAttribute('data-measure-state')).toBe('absent');
        expect(hasDigit(el.textContent)).toBe(false);
      }
      expect(props.copy.measure.zeroMeasured).toBeTruthy();
      cleanup();
    }
  });

  it('partial: lista ASSENTE per «nessun campione» (il server non sa se la fonte non fornisce gli allenamenti), niente frase dello zero e riepilogo senza cifre', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'partial');
    const box = one(container, '[data-list-state]');
    expect(box.getAttribute('data-list-state')).toBe('absent');
    expect(box.getAttribute('data-reason')).toBe('no_samples');
    expect(box.textContent).toContain('Non sappiamo se ci sono stati allenamenti');
    expect(box.textContent).toContain(props.copy.measure.absent.no_samples);
    expect(box.textContent).not.toContain(props.copy.measure.absent.source_lacks_type);
    expect(box.textContent).not.toContain('non fornisce gli allenamenti');
    expect(container.textContent).not.toMatch(/Nessun allenamento registrato/);
    expect(container.querySelector('[data-session]')).toBeNull();
    for (const key of ['sessions', 'duration', 'calories']) {
      const tile = one(container, `[data-metric="${key}"] [data-measure-state]`);
      expect(tile.getAttribute('data-measure-state')).toBe('absent');
      expect(hasDigit(tile.textContent)).toBe(false);
      expect(tile.textContent).toContain(props.copy.measure.absent.no_samples);
    }
  });

  it('ogni motivo di assenza: «non sappiamo», mai la frase dello zero, mai una cifra nel riepilogo', () => {
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

  it('il collegamento al dispositivo c e solo per «nessuna fonte»; nessun altro link (il server non sa di letture fallite: niente «Riprova»)', () => {
    for (const reason of REASONS) {
      const { container } = renderWith(absent(reason));
      const devices = container.querySelector('a[href="/it/app/devices"]');
      expect(devices !== null).toBe(reason === 'no_data_received');
      const retry = all(container, '[data-list-state="absent"] a').filter((a) => a.getAttribute('href') !== '/it/app/devices');
      expect(retry, reason).toHaveLength(0);
      cleanup();
    }
  });

  it('empty e stale: assente con il proprio motivo', () => {
    const empty = renderScreen(WorkoutsScreen, 'empty');
    expect(one(empty.container, '[data-list-state]').getAttribute('data-reason')).toBe('no_data_received');
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
    for (const cell of ['duration', 'calories', 'hrAvg']) expect(stateOf(row, `[data-cell="${cell}"]`)).toBe('measured');
  });

  it('un campo misurato a zero, uno parziale e uno assente nella stessa sessione restano tre cose diverse', () => {
    const { container, props } = renderWith(
      value([mk({ hrAvg: value(0), distanceKm: partial(3.2, 0.5, 'incomplete_coverage'), caloriesKcal: absent('no_samples') })]),
    );
    const row = one(container, '[data-session]');
    // zero misurato: «0» e «Zero misurato»
    expect(stateOf(row, '[data-cell="hrAvg"]')).toBe('measured-zero');
    expect(one(row, '[data-cell="hrAvg"]').textContent).toContain('0');
    expect(one(row, '[data-cell="hrAvg"]').textContent).toContain(props.copy.measure.zeroMeasured);
    // parziale: cifra + copertura + motivo
    expect(stateOf(row, '[data-cell="distance"]')).toBe('partial');
    const distance = one(row, '[data-cell="distance"]').textContent ?? '';
    expect(distance).toContain('3,2');
    expect(distance).toContain('50%');
    expect(distance).toContain(props.copy.measure.partial.incomplete_coverage);
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
    const { container, props } = renderWith(partial([mk()], 0.6, 'incomplete_coverage'));
    const box = one(container, '[data-list-state="partial"]');
    expect(box.textContent).toContain('60%');
    expect(box.textContent).toContain(props.copy.measure.partial.incomplete_coverage);
    expect(container.querySelector('[data-list-state="sessions"]')).not.toBeNull();
    for (const key of ['sessions', 'duration', 'calories']) expect(stateOf(container, `[data-metric="${key}"]`)).toBe('partial');
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
          expect(cell.textContent).toMatch(/Nessun dato|No data|Durata non ricevuta|Duration not received/);
        }
        cleanup();
      }
    }
  });
});

describe('riquadro «Durata degli allenamenti, ultimi 7 giorni»: derivato dalle sole righe di workouts', () => {
  const card = (c: HTMLElement) => one(c, '[data-card="week-workout-duration"]');
  const slot = (c: HTMLElement, date: string) => one(card(c), `svg [data-chart-slot][data-date="${date}"]`);
  const row = (c: HTMLElement, date: string) => one(card(c), `[data-table="week-workout-duration"] tr[data-date="${date}"]`);

  it('ok: sette giorni, un riquadro tratteggiato per la domenica senza righe, barre per gli altri, conteggio per giorno', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'ok');
    const days = all(card(container), '[data-week-days] li');
    expect(days).toHaveLength(7);
    expect(days.map((li) => li.getAttribute('data-day'))).toEqual(props.data.workouts.week.map((w) => w.date));
    // domenica 20/09: nessuna riga, quindi ASSENTE (mai una barra a zero)
    expect(days[3].getAttribute('data-day')).toBe('2026-09-20');
    expect(days[3].getAttribute('data-slot-state')).toBe('absent');
    const gap = one(card(container), 'svg [data-chart-slot="absent"]');
    expect(gap.getAttribute('data-day-from')).toBe('2026-09-20');
    expect(gap.getAttribute('data-reason')).toBe('no_samples');
    expect(card(container).querySelector('svg [data-chart-slot][data-date="2026-09-20"]')).toBeNull();
    // il mercoledi' 23/09 e' misurato: una sessione da 55 minuti
    expect(slot(container, '2026-09-23').getAttribute('data-chart-slot')).toBe('measured');
    expect(row(container, '2026-09-23').textContent).toContain('1 allenamento');
    expect(row(container, '2026-09-23').textContent).toContain('55 min');
    // il conteggio esiste solo dove ci sono righe
    expect(row(container, '2026-09-20').textContent).toContain(props.copy.measure.noData);
    expect(hasDigit(one(row(container, '2026-09-20'), '[data-cell="count"]').textContent)).toBe(false);
    expect(hasDigit(one(row(container, '2026-09-20'), '[data-cell="minutes"]').textContent)).toBe(false);
  });

  it('la scheda si chiama «Durata degli allenamenti» e non usa nessun nome vietato (attivita\' oraria, esiti di sync), in italiano e in inglese', () => {
    for (const lc of LOCALES) {
      const { container } = renderScreen(WorkoutsScreen, 'ok', { lc });
      const title = one(card(container), '#wk-week-title').textContent;
      expect(title).toBe(lc === 'it' ? 'Durata degli allenamenti, ultimi 7 giorni' : 'Workout duration, last 7 days');
      const text = card(container).textContent ?? '';
      expect(FORBIDDEN_SYNC_NAMES.filter(({ re }) => re.test(text)).map(({ name }) => name)).toEqual([]);
      cleanup();
    }
  });

  it('zeros: misurato, parziale, «durata non ricevuta» e «nessun campione» in un solo riquadro, ciascuno con il proprio segno e la propria frase; nessuno zero di durata', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'zeros');
    const wk = props.data.workouts.week;
    // 22/09: una riga di allenamento senza durata (o con 0, che non e provato dalla fonte): il conteggio c'e',
    // la durata e ASSENTE per «durata non ricevuta», mai una tacca a zero e mai unita ai giorni senza righe
    expect(card(container).querySelector('[data-chart-slot="measured-zero"]')).toBeNull();
    expect(card(container).textContent).not.toContain(props.copy.measure.zeroMeasured);
    expect(row(container, '2026-09-22').getAttribute('data-slot-state')).toBe('absent');
    expect(row(container, '2026-09-22').textContent).toContain('1 allenamento');
    expect(row(container, '2026-09-22').textContent).toContain(workoutsCopy('it').week.durationNotReceived);
    expect(one(row(container, '2026-09-22'), '[data-cell="minutes"]').textContent).toContain(workoutsCopy('it').week.durationNotReceived);
    const runs = all(card(container), 'svg [data-chart-slot="absent"]');
    expect(runs.map((r) => [r.getAttribute('data-day-from'), r.getAttribute('data-day-to'), r.getAttribute('data-duration-not-received')])).toEqual([
      ['2026-09-20', '2026-09-20', 'false'],
      ['2026-09-22', '2026-09-22', 'true'],
      ['2026-09-23', '2026-09-23', 'false'],
    ]);
    expect(one(card(container), '[data-week-notes]').textContent).toContain(workoutsCopy('it').week.durationNotReceived);
    // 21/09: due sessioni, una senza durata: PARZIALE, e la sessione senza durata non vale 0
    expect(slot(container, '2026-09-21').getAttribute('data-chart-slot')).toBe('partial');
    expect(row(container, '2026-09-21').textContent).toContain('2 allenamenti');
    expect(row(container, '2026-09-21').textContent).toContain('38 min');
    expect(row(container, '2026-09-21').textContent).toContain('50%');
    // 23/09 (giorno mostrato): nessuna riga, ASSENTE con il motivo
    expect(row(container, '2026-09-23').getAttribute('data-slot-state')).toBe('absent');
    expect(row(container, '2026-09-23').textContent).toContain(props.copy.measure.absent.no_samples);
    // e un giorno misurato normale
    expect(slot(container, '2026-09-19').getAttribute('data-chart-slot')).toBe('measured');
    // la legenda nomina solo gli stati che ci sono: misurato, parziale, assente (nessuno zero)
    expect(countDays(workoutsWeek({ ...props.data.workouts, week: wk }, props.data.date))).toMatchObject({ zero: 0, partial: 1 });
    const legend = card(container).textContent ?? '';
    for (const label of [props.copy.legend.measured, props.copy.legend.partial, props.copy.legend.absent]) expect(legend).toContain(label);
  });

  it('partial: nessuna riga di allenamenti, sette assenti con lo stesso motivo («nessun campione») in UN riquadro, nessuna cifra', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'partial');
    const runs = all(card(container), 'svg [data-chart-slot="absent"]');
    expect(runs).toHaveLength(1);
    expect(runs[0].getAttribute('data-reason')).toBe('no_samples');
    expect(runs[0].getAttribute('data-duration-not-received')).toBe('false');
    expect(runs[0].getAttribute('data-day-from')).toBe('2026-09-17');
    expect(runs[0].getAttribute('data-day-to')).toBe('2026-09-23');
    expect(card(container).querySelector('[data-bar]')).toBeNull();
    expect(one(card(container), '[data-week-total]').textContent).toContain(workoutsCopy('it').week.totalNone);
    expect(card(container).textContent).toContain(props.copy.measure.absent.no_samples);
    expect(card(container).textContent).not.toContain(props.copy.measure.absent.source_lacks_type);
    for (const cell of all(card(container), '[data-cell="count"], [data-cell="minutes"]')) expect(hasDigit(cell.textContent)).toBe(false);
  });

  it('stale: prima dell ultimo dato ricevuto ci sono le righe, dopo il riquadro dice «non ancora sincronizzato» (non zero)', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'stale');
    const gap = one(card(container), 'svg [data-chart-slot="absent"][data-reason="not_synced_yet"]');
    expect(gap.getAttribute('data-day-from')).toBe('2026-09-22');
    expect(gap.getAttribute('data-day-to')).toBe('2026-09-23');
    expect(slot(container, '2026-09-21').getAttribute('data-chart-slot')).toBe('measured');
    expect(row(container, '2026-09-23').textContent).toContain(props.copy.measure.absent.not_synced_yet);
  });

  it('empty: nessuna fonte, sette assenti, nessuna cifra', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'empty');
    const runs = all(card(container), 'svg [data-chart-slot="absent"]');
    expect(runs).toHaveLength(1);
    expect(runs[0].getAttribute('data-reason')).toBe('no_data_received');
    expect(card(container).textContent).toContain(props.copy.measure.absent.no_data_received);
    expect(all(card(container), '[data-week-days] [data-day-count]').map((n) => hasDigit(n.textContent))).toEqual(Array(7).fill(false));
  });

  it('i giorni sono link a quel giorno, tranne quello mostrato', () => {
    const { container, props } = renderScreen(WorkoutsScreen, 'ok');
    const links = all(card(container), '[data-week-days] a');
    expect(links).toHaveLength(6);
    expect(links[0].getAttribute('href')).toBe(props.href('workouts', { day: '2026-09-17' }));
    expect(one(card(container), '[data-week-days] [aria-current="date"]').closest('li')?.getAttribute('data-day')).toBe('2026-09-23');
  });

  it('il totale conta solo i giorni con durata completa: gli assenti non sono zeri e i parziali non lo abbassano', () => {
    const wd = (date: string, count: WorkoutsWeekDay['count'], durationMin: WorkoutsWeekDay['durationMin']): WorkoutsWeekDay => ({ date, count, durationMin });
    const day: WorkoutsDay = {
      sessions: absent('no_samples'),
      week: [
        wd('2026-09-17', value(1), value(40)),
        wd('2026-09-18', value(1), value(0)),
        wd('2026-09-19', value(2), partial(30, 0.5, 'incomplete_coverage')),
        wd('2026-09-20', absent('no_samples'), absent('no_samples')),
        wd('2026-09-21', absent('no_samples'), absent('no_samples')),
        wd('2026-09-22', value(1), absent('no_samples')),
        wd('2026-09-23', absent('no_samples'), absent('no_samples')),
      ],
    };
    const days = workoutsWeek(day, '2026-09-23');
    expect(totalOfMeasuredDays(days)).toEqual({ total: 40, n: 2 });
    expect(countDays(days)).toEqual({ measured: 2, zero: 1, partial: 1, absent: 4 });
    // il giorno con una riga ma senza durata: conteggio 1, durata assente (non 0)
    expect(days[5]).toMatchObject({ state: 'absent', value: null, count: 1, reason: 'no_samples' });
    // i giorni senza righe non hanno un conteggio
    expect(days[3]).toMatchObject({ state: 'absent', value: null, count: null });
    expect(days[5].durationNotReceived).toBe(true);
    expect(days[3].durationNotReceived).toBe(false);
    // giorni senza righe consecutivi con lo stesso motivo sono UN tratto, non barre a zero; il giorno con righe ma senza
    // durata resta un tratto a parte («durata non ricevuta»), anche se il motivo e lo stesso dei vicini
    expect(absentRuns(days)).toEqual([
      { from: 3, to: 4, reason: 'no_samples', durationNotReceived: false },
      { from: 5, to: 5, reason: 'no_samples', durationNotReceived: true },
      { from: 6, to: 6, reason: 'no_samples', durationNotReceived: false },
    ]);
    expect(totalOfMeasuredDays(workoutsWeek({ ...day, week: day.week.map((w) => ({ ...w, durationMin: absent('no_samples') })) }, '2026-09-23'))).toBeNull();
  });
});

describe('absentRuns: «durata non ricevuta» non si unisce a «nessuna riga»', () => {
  const wd = (date: string, count: WorkoutsWeekDay['count'], durationMin: WorkoutsWeekDay['durationMin']): WorkoutsWeekDay => ({ date, count, durationMin });
  const dates = ['2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23'];

  it('due giorni adiacenti con lo stesso motivo restano due tratti se uno ha righe (count diverso da null) e l altro no', () => {
    const week = dates.map((date, i) =>
      i === 2 ? wd(date, value(1), absent('no_samples')) : i === 3 ? wd(date, absent('no_samples'), absent('no_samples')) : wd(date, value(1), value(30)),
    );
    const runs = absentRuns(workoutsWeek({ sessions: absent('no_samples'), week }, '2026-09-23'));
    expect(runs).toEqual([
      { from: 2, to: 2, reason: 'no_samples', durationNotReceived: true },
      { from: 3, to: 3, reason: 'no_samples', durationNotReceived: false },
    ]);
  });

  it('due giorni adiacenti con righe ma senza durata si uniscono fra loro, con la nota «durata non ricevuta»', () => {
    const week = dates.map((date, i) => (i === 4 || i === 5 ? wd(date, value(1), absent('no_samples')) : wd(date, value(1), value(30))));
    expect(absentRuns(workoutsWeek({ sessions: absent('no_samples'), week }, '2026-09-23'))).toEqual([
      { from: 4, to: 5, reason: 'no_samples', durationNotReceived: true },
    ]);
  });

  it('la scheda scrive «Durata non ricevuta» (it/en) per quel giorno e «Nessun campione» per i giorni senza righe', () => {
    for (const lc of ['it', 'en', 'de'] as const) {
      const props = screenProps('ok', { lc });
      const week = props.data.workouts.week.map((w, i) =>
        i === 4 ? { ...w, count: value(1), durationMin: absent<number>('no_samples') } : i === 5 ? { ...w, count: absent<number>('no_samples'), durationMin: absent<number>('no_samples') } : w,
      );
      const data = { ...props.data, workouts: { ...props.data.workouts, week } };
      const { container } = render(<WorkoutsScreen {...props} data={data} />);
      const notes = one(container, '[data-week-notes]').textContent ?? '';
      const text = workoutsCopy(lc === 'it' ? 'it' : 'en').week.durationNotReceived;
      expect(notes).toContain(text);
      expect(notes).toContain(props.copy.measure.absent.no_samples);
      expect(text).toBe(lc === 'it' ? 'Durata non ricevuta' : 'Duration not received');
      cleanup();
    }
  });
});

describe('derive: regole pure', () => {
  it('listState: assente, con sessioni, e la lista vuota e assente (mai «vuoto misurato»)', () => {
    expect(listState(value([])).kind).toBe('absent');
    expect(listState(value([]))).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(listState(partial([], 0.5, 'window_open'))).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(listState(absent('no_samples'))).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(listState(value([mk()])).kind).toBe('sessions');
    const p = listState(partial([mk()], 0.4, 'incomplete_coverage'));
    expect(p.kind === 'sessions' && p.partial).toEqual({ coverage: 0.4, note: 'incomplete_coverage' });
  });

  it('summarize: assente non e mai 0, e una lista vuota non e 0 sessioni, 0 minuti, 0 kcal', () => {
    for (const reason of REASONS) {
      const s = summarize(absent(reason));
      for (const m of [s.count, s.duration, s.calories]) expect(m).toEqual({ kind: 'absent', reason });
    }
    const z = summarize(value([]));
    for (const m of [z.count, z.duration, z.calories]) expect(m).toEqual({ kind: 'absent', reason: 'no_samples' });
  });

  it('la copy non ha em dash ne parole di disponibilita in nessuna lingua', () => {
    for (const l of LOCALES) {
      const t = workoutsCopy(l);
      const text = JSON.stringify(t, (_k, v) => (typeof v === 'function' ? v(1, 2) : v));
      expect(text).not.toMatch(/—|coming soon|prossimamente|a breve|in arrivo|\bAI\b/i);
    }
  });
});

describe('la lista mostra solo colonne della whitelist degli allenamenti', () => {
  // Ogni cella della riga porta a una colonna di COLONNE_ALLENAMENTI. Una cella nuova senza
  // colonna in whitelist (per esempio la FC massima, fuori per scelta) fa cadere il test.
  const CELLA_A_COLONNA: Record<string, string> = {
    start: 'start_ms',
    duration: 'duration_min',
    distance: 'distance_meters',
    calories: 'calories_kcal',
    hrAvg: 'hr_avg',
  };

  it('ogni data-cell di ogni riga ha una colonna in whitelist, e non c e la FC massima', async () => {
    const { COLONNE_ALLENAMENTI } = await import('@/lib/dashboard/letture-titolare');
    const permesse = new Set<string>(COLONNE_ALLENAMENTI);
    for (const lc of LOCALES) {
      const { container } = renderWith(value([mk(), mk({ id: 'w2', type: 'walk' })]), { lc });
      const celle = new Set(all(container, '[data-session] [data-cell]').map((el) => el.getAttribute('data-cell') ?? ''));
      expect(celle.size).toBeGreaterThan(0);
      for (const cella of celle) {
        expect(CELLA_A_COLONNA[cella], `cella senza colonna: ${cella}`).toBeDefined();
        expect(permesse.has(CELLA_A_COLONNA[cella])).toBe(true);
      }
      // anche l'intestazione: tante voci quante celle, piu' il tipo di sessione
      expect(all(container, '[data-list-header] span')).toHaveLength(celle.size + 1);
      expect(container.textContent ?? '').not.toMatch(/FC max|Max HR/);
      cleanup();
    }
  });

  it('la copy non ha piu una voce per la FC massima', () => {
    for (const lc of LOCALES) expect(Object.keys(workoutsCopy(lc).list.cols)).not.toContain('hrMax');
  });

  it('l elenco parziale non dice che le sessioni sono reali (il prototipo e sintetico)', () => {
    for (const lc of LOCALES) expect(workoutsCopy(lc).list.partialTitle + workoutsCopy(lc).list.partialBody).not.toMatch(/\breal[ie]?\b/i);
  });
});
