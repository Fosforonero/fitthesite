/**
 * La regola degli stati dei dati, provata sulle colonne del server:
 *  - un valore nullo in una riga esistente non e' mai 0;
 *  - una riga assente (o un giorno senza righe) non e' mai «zero misurato»;
 *  - lo zero e' un dato solo per i contatori giornalieri, non per la durata di una sessione;
 *  - il parziale nasce solo da cio' che il server sa.
 */
import { describe, expect, it } from 'vitest';

import { COLONNE_ALLENAMENTI, COLONNE_METRICHE } from '../dashboard/letture-titolare';
import {
  absentReasonForDay,
  columnMeasure,
  dedupeWorkoutRows,
  durationMeasure,
  localDayOf,
  workoutRowsOf,
  workoutsSessions,
  workoutsWeekFromRows,
  type DayContext,
  type WorkoutRowLike,
} from './from-rows';
import type { Workout } from './model';
import { value } from './measure';
import { WATCH } from './synthetic';

const CTX: DayContext = {
  today: '2026-09-24',
  todayFraction: 0.4,
  lastReceivedDay: '2026-09-24',
  timeZone: 'Europe/Rome',
};
const DAYS = ['2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'];
/** Un istante di quel giorno locale, a metà pomeriggio (CEST). */
const at = (day: string, hh = 15) => Date.parse(`${day}T${String(hh).padStart(2, '0')}:00:00+02:00`);
const row = (day: string, duration: unknown, hh = 15): WorkoutRowLike => ({ start_ms: at(day, hh), duration_min: duration });

describe('colonne lette: la stessa lista della whitelist del server', () => {
  it('i campi che il riquadro settimanale usa (giorno e durata) sono nella whitelist di workouts', () => {
    expect(COLONNE_ALLENAMENTI).toContain('start_ms');
    expect(COLONNE_ALLENAMENTI).toContain('duration_min');
  });

  it('workouts non ha un campo del giorno locale: il giorno si ricava da start_ms nel fuso di chi guarda', () => {
    expect(COLONNE_ALLENAMENTI.some((c) => /day/.test(c))).toBe(false);
    expect(COLONNE_METRICHE).toContain('local_day_key');
    // 23:30 di Roma del 23 e' ancora il 23, anche se in UTC e' le 21:30; 00:30 del 24 e' il 24
    expect(localDayOf(Date.parse('2026-09-23T23:30:00+02:00'), 'Europe/Rome')).toBe('2026-09-23');
    expect(localDayOf(Date.parse('2026-09-24T00:30:00+02:00'), 'Europe/Rome')).toBe('2026-09-24');
    expect(localDayOf(Date.parse('2026-09-23T23:30:00+02:00'), 'America/New_York')).toBe('2026-09-23');
    expect(localDayOf(Date.parse('2026-09-24T01:30:00+02:00'), 'America/New_York')).toBe('2026-09-23');
  });
});

/**
 * Quali colonne provano gli stati di ogni metrica mostrata, e quali NON sono nella whitelist di
 * lib/dashboard/letture-titolare.ts. Se la whitelist cambia (per esempio entra `hrv_rmssd`), questo
 * test diventa rosso: la tabella «metrica per stato» del resoconto va riletta prima di fidarsi degli stati.
 */
describe('metriche mostrate e colonne davvero lette dal server', () => {
  const METRICHE = new Set<string>(COLONNE_METRICHE);
  const ALLENAMENTI = new Set<string>(COLONNE_ALLENAMENTI);
  const fuori = (cols: string[], tabella: Set<string>) => cols.filter((c) => !tabella.has(c));

  it('passi, calorie attive, distanza, battito medio e a riposo, sonno totale: le colonne ci sono', () => {
    const base = ['local_day_key', 'window_start_ms', 'window_end_ms', 'received_at', 'source', 'source_device'];
    for (const cols of [['steps'], ['active_calories_kcal'], ['distance_meters'], ['heart_rate_bpm'], ['resting_heart_rate_bpm'], ['sleep_minutes']]) {
      expect(fuori([...base, ...cols], METRICHE), cols.join()).toEqual([]);
    }
  });

  it('allenamenti: ci sono giorno (da start_ms), durata, distanza, calorie e FC media; NON titolo, FC massima, fonte', () => {
    expect(fuori(['start_ms', 'end_ms', 'type', 'duration_min', 'distance_meters', 'calories_kcal', 'hr_avg'], ALLENAMENTI)).toEqual([]);
    expect(fuori(['title', 'hr_max', 'source', 'device_id', 'notes'], ALLENAMENTI)).toEqual(['title', 'hr_max', 'source', 'device_id', 'notes']);
  });

  it('HRV, piani, serie orarie, serie del battito e fasi del sonno NON sono nella whitelist: oggi nessuno stato diverso da «assente» e dimostrabile', () => {
    expect(fuori(['hrv_rmssd', 'hrv_sdnn'], METRICHE)).toEqual(['hrv_rmssd', 'hrv_sdnn']);
    expect(fuori(['floors_climbed'], METRICHE)).toEqual(['floors_climbed']);
    expect(fuori(['intraday_steps', 'intraday_hr'], METRICHE)).toEqual(['intraday_steps', 'intraday_hr']);
    expect(fuori(['sleep_stages', 'sleep_start_ms', 'sleep_end_ms'], METRICHE)).toEqual(['sleep_stages', 'sleep_start_ms', 'sleep_end_ms']);
    // non esistono nemmeno minimo e massimo del battito come colonne: nascono solo dalla serie
    expect(fuori(['heart_rate_min', 'heart_rate_max'], METRICHE)).toEqual(['heart_rate_min', 'heart_rate_max']);
  });

  it('il server non ha una cronologia delle ricezioni: la whitelist ha received_at, che e uno solo per riga, e nessuna tabella di sync', () => {
    expect(COLONNE_METRICHE).toContain('received_at');
    expect(COLONNE_METRICHE.filter((c) => c === 'received_at')).toHaveLength(1);
    expect([...COLONNE_METRICHE, ...COLONNE_ALLENAMENTI].some((c) => /sync_event|event_type|error_code/.test(c))).toBe(false);
  });
});

describe('columnMeasure: nullo non e zero, zero dipende dal tipo di colonna', () => {
  it('null, undefined, NaN, testo e negativi sono assenti, mai 0', () => {
    for (const raw of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, '12', '', -3, {}, []]) {
      for (const policy of ['counter', 'spot'] as const) {
        expect(columnMeasure(raw, policy), `${String(raw)}/${policy}`).toEqual({ kind: 'absent', reason: 'no_samples' });
      }
    }
  });

  it('contatore: 0 e uno zero misurato (0 passi, 0 metri)', () => {
    expect(columnMeasure(0, 'counter')).toEqual({ kind: 'value', value: 0 });
    expect(columnMeasure(4200, 'counter')).toEqual({ kind: 'value', value: 4200 });
  });

  it('valore puntuale (battito, sonno, HRV): 0 non e una misura possibile, e assente', () => {
    expect(columnMeasure(0, 'spot')).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(columnMeasure(52, 'spot')).toEqual({ kind: 'value', value: 52 });
  });
});

describe('giorno senza righe: sempre assente, mai zero', () => {
  it('il motivo viene da received_at e dall orologio, in quest ordine', () => {
    expect(absentReasonForDay('2026-09-25', CTX)).toBe('not_yet');
    expect(absentReasonForDay('2026-09-22', { ...CTX, lastReceivedDay: null })).toBe('no_data_received');
    expect(absentReasonForDay('2026-09-23', { ...CTX, lastReceivedDay: '2026-09-21' })).toBe('not_synced_yet');
    expect(absentReasonForDay('2026-09-21', { ...CTX, lastReceivedDay: '2026-09-21' })).toBe('no_samples');
  });

  it('il server non distingue «la fonte non fornisce il tipo» da «nessun dato»: source_lacks_type non esce mai da un giorno senza righe', () => {
    const seen = new Set<string>();
    for (const day of ['2026-09-10', '2026-09-20', '2026-09-21', '2026-09-22', '2026-09-24', '2026-09-25']) {
      for (const lastReceivedDay of [null, '2026-09-21', '2026-09-24']) seen.add(absentReasonForDay(day, { ...CTX, lastReceivedDay }));
    }
    expect([...seen].sort()).toEqual(['no_data_received', 'no_samples', 'not_synced_yet', 'not_yet']);
    expect(absentReasonForDay('2026-09-20', CTX)).toBe('no_samples');
  });

  it('nessuna riga in sette giorni: sette assenti, nessun numero, nessuno zero', () => {
    const week = workoutsWeekFromRows([], DAYS, CTX);
    expect(week).toHaveLength(7);
    for (const d of week) {
      expect(d.count).toEqual({ kind: 'absent', reason: expect.any(String) });
      expect(d.durationMin).toEqual({ kind: 'absent', reason: expect.any(String) });
    }
  });

  it('un giorno senza righe fra due giorni con righe resta assente (non vale 0 minuti)', () => {
    const week = workoutsWeekFromRows([row('2026-09-18', 40), row('2026-09-20', 30)], DAYS, CTX);
    expect(week[0].durationMin).toEqual({ kind: 'value', value: 40 });
    expect(week[1].count).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(week[1].durationMin).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(week[2].durationMin).toEqual({ kind: 'value', value: 30 });
  });

  it('senza righe non c e mai il conteggio 0: il conteggio e assente o e almeno 1', () => {
    const week = workoutsWeekFromRows([row('2026-09-19', 10, 8), row('2026-09-19', 20, 15)], DAYS, CTX);
    for (const d of week) {
      if (d.count.kind === 'absent') continue;
      expect(d.count.value).toBeGreaterThanOrEqual(1);
    }
    expect(week[1].count).toEqual({ kind: 'value', value: 2 });
    expect(week[1].durationMin).toEqual({ kind: 'value', value: 30 });
  });
});

describe('riquadro settimanale: i quattro stati, dalle sole righe di workouts', () => {
  it('misurato: la somma delle durate delle righe del giorno', () => {
    const [d] = workoutsWeekFromRows([row('2026-09-18', 42), row('2026-09-18', 18, 19)], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 2 });
    expect(d.durationMin).toEqual({ kind: 'value', value: 60 });
  });

  it('duration_min = 0 NON e uno zero misurato: non e provato dalla fonte, la durata e assente («durata non ricevuta») e il conteggio resta 1', () => {
    const [d] = workoutsWeekFromRows([row('2026-09-18', 0)], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 1 });
    expect(d.durationMin).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(durationMeasure(0)).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(durationMeasure(1)).toEqual({ kind: 'value', value: 1 });
    expect(durationMeasure(null)).toEqual({ kind: 'absent', reason: 'no_samples' });
  });

  it('una riga con 0 e una con 40 minuti: lo 0 non e un valore, la somma e parziale e non conta 0 come minuti misurati', () => {
    const [d] = workoutsWeekFromRows([row('2026-09-18', 0), row('2026-09-18', 40, 19)], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 2 });
    expect(d.durationMin).toEqual({ kind: 'partial', value: 40, coverage: 0.5, note: 'incomplete_coverage' });
  });

  it('una durata NULLA non diventa 0: con una sola riga la durata e assente, il conteggio resta 1', () => {
    const [d] = workoutsWeekFromRows([row('2026-09-18', null)], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 1 });
    expect(d.durationMin).toEqual({ kind: 'absent', reason: 'no_samples' });
  });

  it('parziale: una riga con durata e una senza, la somma copre la meta e non e un totale', () => {
    const [d] = workoutsWeekFromRows([row('2026-09-18', 40), row('2026-09-18', null, 19)], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 2 });
    expect(d.durationMin).toEqual({ kind: 'partial', value: 40, coverage: 0.5, note: 'incomplete_coverage' });
  });

  it('parziale: oggi la giornata e aperta, anche se ogni riga ha la durata', () => {
    const [d] = workoutsWeekFromRows([row('2026-09-24', 30, 7)], ['2026-09-24'], CTX);
    expect(d.count).toEqual({ kind: 'partial', value: 1, coverage: 0.4, note: 'window_open' });
    expect(d.durationMin).toEqual({ kind: 'partial', value: 30, coverage: 0.4, note: 'window_open' });
  });

  it('oggi senza righe non e «0 finora»: e assente', () => {
    const [d] = workoutsWeekFromRows([], ['2026-09-24'], CTX);
    expect(d.count.kind).toBe('absent');
    expect(d.durationMin.kind).toBe('absent');
  });

  it('assente: il motivo distingue «dopo l ultimo dato ricevuto» da «nessun campione»', () => {
    const ctx: DayContext = { ...CTX, lastReceivedDay: '2026-09-21' };
    const week = workoutsWeekFromRows([row('2026-09-19', 25)], DAYS, ctx);
    expect(week[0].durationMin).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(week[5].durationMin).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    expect(week[6].durationMin).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
  });

  it('righe illeggibili (start_ms nullo o testo) non finiscono in nessun giorno', () => {
    const week = workoutsWeekFromRows(
      [{ start_ms: null, duration_min: 10 }, { start_ms: '2026-09-18', duration_min: 10 }, row('2026-09-18', 5)],
      ['2026-09-18'],
      CTX,
    );
    expect(week[0].count).toEqual({ kind: 'value', value: 1 });
    expect(week[0].durationMin).toEqual({ kind: 'value', value: 5 });
  });

  it('il giorno e quello LOCALE di start_ms: un allenamento alle 23:50 non passa al giorno dopo', () => {
    const late = { start_ms: Date.parse('2026-09-18T23:50:00+02:00'), duration_min: 20 };
    const week = workoutsWeekFromRows([late], ['2026-09-18', '2026-09-19'], CTX);
    expect(week[0].durationMin).toEqual({ kind: 'value', value: 20 });
    expect(week[1].durationMin.kind).toBe('absent');
  });
});

describe('la stessa sessione inviata piu volte conta una volta sola', () => {
  const dup = (over: Partial<WorkoutRowLike> = {}): WorkoutRowLike => ({ ...row('2026-09-18', 40), end_ms: at('2026-09-18') + 40 * 60_000, type: 'run', ...over });

  it('tre righe identiche sono un allenamento e 40 minuti, non tre e 120', () => {
    const [d] = workoutsWeekFromRows([dup(), dup(), dup()], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 1 });
    expect(d.durationMin).toEqual({ kind: 'value', value: 40 });
  });

  it('un invio vecchio senza durata e uno nuovo con la durata: vale la durata, una sola sessione', () => {
    const [d] = workoutsWeekFromRows([dup({ duration_min: null }), dup({ duration_min: 40 })], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 1 });
    expect(d.durationMin).toEqual({ kind: 'value', value: 40 });
  });

  it('«Run» e «run » sono la stessa sessione: il server confronta lower(trim(type))', () => {
    const [d] = workoutsWeekFromRows([dup({ type: 'Run' }), dup({ type: 'run ' })], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 1 });
    expect(d.durationMin).toEqual({ kind: 'value', value: 40 });
    expect(dedupeWorkoutRows([dup({ type: ' RUN' }), dup({ type: 'run', duration_min: 55 })])).toHaveLength(1);
    // un tipo davvero diverso resta una sessione a parte
    expect(dedupeWorkoutRows([dup({ type: 'Run' }), dup({ type: 'Walk' })])).toHaveLength(2);
  });

  it('device_id non e nella whitelist: il conteggio web e «non fuso per dispositivo» (due dispositivi con gli stessi orari sono una sessione)', () => {
    expect(COLONNE_ALLENAMENTI).not.toContain('device_id');
    expect(dedupeWorkoutRows([dup(), dup()])).toHaveLength(1);
  });

  it('due sessioni diverse nello stesso giorno (orario o tipo diverso) restano due', () => {
    const [d] = workoutsWeekFromRows([dup(), dup({ start_ms: at('2026-09-18', 19), end_ms: at('2026-09-18', 19) + 1 }), dup({ type: 'walk' })], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'value', value: 3 });
  });
});

describe('workoutsSessions e workoutRowsOf', () => {
  const w = (over: Partial<Workout> = {}): Workout => ({
    id: 'x',
    type: 'run',
    title: 'Corsa',
    startedAt: '2026-09-18T18:00:00+02:00',
    durationMin: value(30),
    distanceKm: value(5),
    caloriesKcal: value(250),
    hrAvg: value(140),
    hrMax: value(165),
    source: WATCH,
    ...over,
  });

  it('una lista vuota e assente col motivo dato, mai value([])', () => {
    expect(workoutsSessions([], 'no_samples')).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(workoutsSessions([], 'not_synced_yet')).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    expect(workoutsSessions([w()], 'no_samples')).toMatchObject({ kind: 'value' });
  });

  it('le righe portano solo colonne di workouts (start_ms, end_ms, type, duration_min), e una durata assente e nulla, non 0', () => {
    const rows = workoutRowsOf([w(), w({ durationMin: { kind: 'absent', reason: 'no_samples' } }), w({ durationMin: value(0) })]);
    expect(rows.map((r) => Object.keys(r).sort())).toEqual(Array(3).fill(['duration_min', 'end_ms', 'start_ms', 'type']));
    expect(rows.map((r) => r.duration_min)).toEqual([30, null, 0]);
  });
});
