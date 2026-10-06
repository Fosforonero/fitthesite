/**
 * La regola degli stati dei dati, provata sulle colonne del server:
 *  - un valore nullo in una riga esistente non e' mai 0;
 *  - una riga assente (o un giorno senza righe) non e' mai «zero misurato»;
 *  - lo zero e' un dato solo per i contatori giornalieri, non per la durata di una sessione;
 *  - il parziale nasce solo da cio' che il server sa.
 */
import { describe, expect, it } from 'vitest';

import { COLONNE_ALLENAMENTI, COLONNE_METRICHE, COLONNE_SERIE_DEL_GIORNO } from '../dashboard/letture-titolare';
import {
  absentReasonForDay,
  columnMeasure,
  dedupeWorkoutRows,
  durationMeasure,
  hasAnyHour,
  heartSeriesFromRow,
  hourlyStepsFromRow,
  hrvRmssdFromRow,
  localDayOf,
  sleepNightFromRow,
  sourceIdOf,
  sourcesFromRows,
  stepsReconciliationTolerance,
  workoutRowsOf,
  workoutsSessions,
  workoutsWeekFromRows,
  type DayContext,
  type WorkoutRowLike,
} from './from-rows';
import type { Workout } from './model';
import { value } from './measure';

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
    const base = ['local_day_key', 'window_start_ms', 'window_end_ms', 'received_at', 'source'];
    for (const cols of [['steps'], ['active_calories_kcal'], ['distance_meters'], ['heart_rate_bpm'], ['resting_heart_rate_bpm'], ['sleep_minutes']]) {
      expect(fuori([...base, ...cols], METRICHE), cols.join()).toEqual([]);
    }
  });

  it('allenamenti: ci sono giorno (da start_ms), durata, distanza, calorie e FC media; NON titolo, FC massima, fonte', () => {
    expect(fuori(['start_ms', 'end_ms', 'type', 'duration_min', 'distance_meters', 'calories_kcal', 'hr_avg'], ALLENAMENTI)).toEqual([]);
    expect(fuori(['title', 'hr_max', 'source', 'device_id', 'notes'], ALLENAMENTI)).toEqual(['title', 'hr_max', 'source', 'device_id', 'notes']);
  });

  it('estensione del 29/09: hrv_rmssd e le tre serie (una alla volta) ci sono; hrv_sdnn, piani, sleep_start/end e ogni nome di dispositivo NO', () => {
    const SERIE = new Set<string>(COLONNE_SERIE_DEL_GIORNO);
    expect(fuori(['hrv_rmssd'], METRICHE)).toEqual([]);
    expect(fuori(['intraday_steps', 'intraday_hr', 'sleep_stages'], SERIE)).toEqual([]);
    // le serie NON stanno nella lettura a intervallo: si leggono un giorno per volta
    expect(fuori(['intraday_steps', 'intraday_hr', 'sleep_stages'], METRICHE)).toEqual(['intraday_steps', 'intraday_hr', 'sleep_stages']);
    for (const lista of [METRICHE, SERIE]) {
      expect(fuori(['hrv_sdnn', 'floors_climbed', 'sleep_start_ms', 'sleep_end_ms', 'source_device', 'source_package', 'hr_source_name'], lista)).toEqual([
        'hrv_sdnn', 'floors_climbed', 'sleep_start_ms', 'sleep_end_ms', 'source_device', 'source_package', 'hr_source_name',
      ]);
    }
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

  it('fuso non valido o vuoto: nessun crash, nessun allenamento finisce in un giorno, ogni giorno e assente', () => {
    for (const timeZone of ['Non/Esiste', '']) {
      expect(localDayOf(at('2026-09-20'), timeZone), timeZone).toBeNull();
      const week = workoutsWeekFromRows([row('2026-09-20', 40)], DAYS, { ...CTX, timeZone });
      expect(week, timeZone).toHaveLength(7);
      for (const d of week) expect(d.count.kind, `${timeZone} ${d.date}`).toBe('absent');
    }
  });

  it('todayFraction non finito (NaN): la copertura di oggi e 0, mai NaN', () => {
    const week = workoutsWeekFromRows([row('2026-09-24', 40, 8)], DAYS, { ...CTX, todayFraction: Number.NaN });
    expect(week[6].count).toEqual({ kind: 'partial', value: 1, coverage: 0, note: 'window_open' });
    expect(week[6].durationMin).toEqual({ kind: 'partial', value: 40, coverage: 0, note: 'window_open' });
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

  it('«Run» e «run » sono la stessa sessione: come lower(trim(type)) di app e server per gli spazi', () => {
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
    startedAt: '2026-09-18T18:00:00+02:00',
    durationMin: value(30),
    distanceKm: value(5),
    caloriesKcal: value(250),
    hrAvg: value(140),
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

// ─────────────────────────────────────────────────────────────────────────────
// Estensione del 29/09/2026: serie e HRV. Ogni funzione parte da «assente»: una colonna in whitelist
// non rende disponibile un grafico. Le fixture hanno la forma REALE scritta dall'app 191 e le sue rotture.
// ─────────────────────────────────────────────────────────────────────────────

const ABSENT = { kind: 'absent', reason: 'no_samples' } as const;
const isAllAbsent = (hours: readonly { kind: string }[]) => hours.length === 24 && hours.every((m) => m.kind === 'absent');

type Bucket = Record<string, unknown>;

/** Le 24 voci di un giorno Health Connect: passi solo dalle 08 alle 19, e `covered` solo dove c'e' un record. */
function hcSeries(over: { steps?: (h: number) => number; covered?: (h: number) => boolean; extra?: Bucket } = {}): Bucket[] {
  const steps = over.steps ?? ((h) => (h >= 8 && h < 20 ? 500 : 0));
  const covered = over.covered ?? ((h) => steps(h) > 0);
  const total = Array.from({ length: 24 }, (_, h) => steps(h)).reduce((a, b) => a + b, 0);
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    steps: steps(hour),
    srcPkg: 'com.sec.android.app.shealth',
    srcSame: true,
    srcCumul: false,
    covered: covered(hour),
    srcTotal: total,
    srcCovH: Array.from({ length: 24 }, (_, h) => h).filter(covered).length,
    ...over.extra,
  }));
}

describe('passi orari (intraday_steps): la colonna esiste, il grafico no, finche la forma non prova la misura', () => {
  it('una riga sana: le ore con record sono misurate, le altre ASSENTI (mai zero passi)', () => {
    const hours = hourlyStepsFromRow({ steps: 6000, intraday_steps: hcSeries() });
    expect(hours).toHaveLength(24);
    for (let h = 0; h < 24; h++) {
      if (h >= 8 && h < 20) expect(hours[h], `ora ${h}`).toEqual({ kind: 'value', value: 500 });
      else expect(hours[h], `ora ${h}`).toEqual(ABSENT);
    }
    expect(hours.some((m) => m.kind === 'value' && m.value === 0)).toBe(false);
  });

  it.each<[string, unknown]>([
    ['colonna nulla', null],
    ['colonna mancante', undefined],
    ['JSON non valido (stringa troncata)', '[{"hour":0,"steps":'],
    ['JSON valido ma scritto come testo', JSON.stringify(hcSeries())],
    ['un oggetto invece di un array', { hour: 3, steps: 100 }],
    ['array vuoto', []],
    ['meno di 24 punti', hcSeries().slice(0, 23)],
    ['piu di 24 punti', [...hcSeries(), { hour: 3, steps: 5 }]],
    ['un\'ora ripetuta al posto di un\'altra', hcSeries().map((b, i) => (i === 5 ? { ...b, hour: 4 } : b))],
    ['indice orario 24 (fuori intervallo)', hcSeries().map((b, i) => (i === 23 ? { ...b, hour: 24 } : b))],
    ['indice orario negativo', hcSeries().map((b, i) => (i === 0 ? { ...b, hour: -1 } : b))],
    ['indice orario frazionario', hcSeries().map((b, i) => (i === 2 ? { ...b, hour: 2.5 } : b))],
    ['indice orario scritto come testo', hcSeries().map((b, i) => (i === 2 ? { ...b, hour: '2' } : b))],
    ['passi come testo', hcSeries().map((b, i) => (i === 9 ? { ...b, steps: '500' } : b))],
    ['passi negativi', hcSeries().map((b, i) => (i === 9 ? { ...b, steps: -500 } : b))],
    ['passi frazionari (unita sbagliata, migliaia)', hcSeries().map((b, i) => (i === 9 ? { ...b, steps: 0.5 } : b))],
    ['passi non finiti', hcSeries().map((b, i) => (i === 9 ? { ...b, steps: Number.POSITIVE_INFINITY } : b))],
    ['covered non booleano', hcSeries().map((b, i) => (i === 9 ? { ...b, covered: 'si' } : b))],
    ['una voce che non e un oggetto', hcSeries().map((b, i) => (i === 9 ? 500 : b))],
    ['fette da 15 minuti dell\'anello (forma non verificata)', Array.from({ length: 24 }, (_, i) => ({ startMinute: i * 15, steps: 40, durationMinutes: 15, complete: true }))],
    ['24 ore tutte a zero (righe senza dettaglio)', hcSeries({ steps: () => 0, covered: () => false })],
  ])('assente: %s', (_nome, intraday_steps) => {
    expect(isAllAbsent(hourlyStepsFromRow({ steps: 6000, intraday_steps }))).toBe(true);
  });

  it('un\'altra origine rispetto al totale della riga (srcSame false): il web non sa di chi sia, assente', () => {
    expect(isAllAbsent(hourlyStepsFromRow({ steps: 6000, intraday_steps: hcSeries({ extra: { srcSame: false } }) }))).toBe(true);
  });

  it('la fonte contraddice se stessa: la somma delle ore fuori tolleranza dal totale della STESSA riga, assente', () => {
    expect(isAllAbsent(hourlyStepsFromRow({ steps: 9000, intraday_steps: hcSeries() }))).toBe(true);
    // il totale della riga non e leggibile o non e positivo: non c'e niente con cui riconciliare
    for (const steps of [null, undefined, 0, -5, '6000', Number.NaN]) {
      expect(isAllAbsent(hourlyStepsFromRow({ steps, intraday_steps: hcSeries() })), String(steps)).toBe(true);
    }
  });

  it('la riconciliazione somma solo le ore coperte, come l\'app: un\'ora covered false con passi non conta nel totale', () => {
    // ora 8 coperta con 500, ora 9 NON coperta con 500, totale della riga 1000: per l'app la serie fa 500, contraddice il totale
    const series = hcSeries({ steps: (h) => (h === 8 || h === 9 ? 500 : 0), covered: (h) => h === 8 });
    expect(isAllAbsent(hourlyStepsFromRow({ steps: 1000, intraday_steps: series }))).toBe(true);
    // con il totale che torna sulle sole ore coperte la serie c'e, e l'ora non coperta resta assente
    const ok = hourlyStepsFromRow({ steps: 500, intraday_steps: series });
    expect(ok[8]).toEqual({ kind: 'value', value: 500 });
    expect(ok[9]).toEqual(ABSENT);
  });

  it('tolleranza dell\'app: 1% arrotondato per eccesso, fra 1 e 100', () => {
    expect(stepsReconciliationTolerance(50)).toBe(1);
    expect(stepsReconciliationTolerance(6000)).toBe(60);
    expect(stepsReconciliationTolerance(500_000)).toBe(100);
    // le ore sommano 6000. Totale dichiarato 6050: scarto 50, tolleranza 61, disponibile. 6070: scarto 70 > 61, assente.
    expect(hasAnyHour(hourlyStepsFromRow({ steps: 6050, intraday_steps: hcSeries() }))).toBe(true);
    expect(hasAnyHour(hourlyStepsFromRow({ steps: 6070, intraday_steps: hcSeries() }))).toBe(false);
  });

  it('riga storica senza provenienza (nessun src*): l\'app la mostra, il web e piu severo e chiede la riconciliazione col totale', () => {
    const legacy = (steps: number) => Array.from({ length: 24 }, (_, hour) => ({ hour, steps: hour >= 8 && hour < 20 ? steps : 0 }));
    const ok = hourlyStepsFromRow({ steps: 6000, intraday_steps: legacy(500) });
    expect(ok[10]).toEqual({ kind: 'value', value: 500 });
    // senza il flag `covered` un'ora a 0 non e uno zero misurato: assente
    expect(ok[3]).toEqual(ABSENT);
    expect(isAllAbsent(hourlyStepsFromRow({ steps: 9999, intraday_steps: legacy(500) }))).toBe(true);
  });

  it('cumulativo dichiarato (srcCumul): ore PARZIALI con la copertura dichiarata, senza chiedere che la somma torni', () => {
    const series = hcSeries({ extra: { srcCumul: true } });
    const hours = hourlyStepsFromRow({ steps: 9000, intraday_steps: series });
    expect(hours[10]).toEqual({ kind: 'partial', value: 500, coverage: 12 / 24, note: 'incomplete_coverage' });
    expect(hours[3]).toEqual(ABSENT);
  });

  it('cumulativo con metadati che si contraddicono, o senza nessuna dichiarazione di copertura: il web non sa, assente', () => {
    expect(isAllAbsent(hourlyStepsFromRow({ steps: 9000, intraday_steps: hcSeries({ extra: { srcCumul: true, srcCovH: 20 } }) }))).toBe(true);
    const noFlags = hcSeries({ extra: { srcCumul: true } }).map(({ covered: _c, ...b }) => b);
    expect(isAllAbsent(hourlyStepsFromRow({ steps: 9000, intraday_steps: noFlags }))).toBe(true);
    // nessuna ora coperta dichiarata: 0 ore non sono «giorno fermo», sono «non so»
    expect(isAllAbsent(hourlyStepsFromRow({ steps: 9000, intraday_steps: hcSeries({ steps: () => 1, covered: () => false, extra: { srcCumul: true } }) }))).toBe(true);
  });

  it('zero misurato SOLO col percorso samsungDiretto, ora coperta, senza cumulativo', () => {
    const direct = (over: Bucket, covered = true) =>
      hcSeries({ steps: (h) => (h >= 8 && h < 20 ? 500 : 0), covered: (h) => (h >= 6 && h < 20 ? covered : false), extra: { srcPath: 'samsungDiretto', ...over } });
    const hours = hourlyStepsFromRow({ steps: 6000, intraday_steps: direct({}) });
    expect(hours[7]).toEqual({ kind: 'value', value: 0 }); // ora ferma ma coperta: misurata
    expect(hours[3]).toEqual(ABSENT); // ora non coperta: assente
    expect(hours[10]).toEqual({ kind: 'value', value: 500 });
    // stessa forma, altro percorso: lo zero orario e «non so»
    expect(hourlyStepsFromRow({ steps: 6000, intraday_steps: direct({ srcPath: 'healthConnect' }) })[7]).toEqual(ABSENT);
    expect(hourlyStepsFromRow({ steps: 6000, intraday_steps: direct({ srcPath: undefined }) })[7]).toEqual(ABSENT);
    // e con un cumulativo dichiarato nemmeno il percorso diretto prova lo zero
    expect(hourlyStepsFromRow({ steps: 6000, intraday_steps: direct({ srcCumul: true, srcCovH: 14 }) })[7]).toEqual(ABSENT);
  });

  it('DIVERGENZA dichiarata (funzione non ancora collegata): nella riga di oggi l\'ora in corso esce misurata e le ore future hanno «no_samples», non «not_yet»', () => {
    // oggi alle 11:30: passi dalle 08 alle 11, ora 11 ancora in corso. La funzione non conosce l'orologio.
    const series = hcSeries({ steps: (h) => (h >= 8 && h <= 11 ? 500 : 0) });
    const hours = hourlyStepsFromRow({ steps: 2000, intraday_steps: series });
    expect(hours[11]).toEqual({ kind: 'value', value: 500 });
    expect(hours[15]).toEqual(ABSENT);
    // prima di collegarla alle schermate serve il contesto del giorno: ora corrente parziale (window_open), ore future not_yet
  });

  it('DIVERGENZA dichiarata: nel giorno di 25 ore l\'ora 2 porta i passi di due ore reali (l\'app somma le due fette)', () => {
    const series = hcSeries({ steps: (h) => (h === 2 ? 1000 : h >= 8 && h < 20 ? 500 : 0) });
    const hours = hourlyStepsFromRow({ steps: 7000, intraday_steps: series });
    expect(hours[2]).toEqual({ kind: 'value', value: 1000 });
    expect(hours).toHaveLength(24);
  });

  it('una serie sana non e un giorno di zero: nessuna ora a zero esce da una riga che non lo prova', () => {
    for (const path of [undefined, 'healthConnect', 'samsungDiretto']) {
      const series = hcSeries({ covered: () => true, extra: { srcPath: path } });
      const hours = hourlyStepsFromRow({ steps: 6000, intraday_steps: series });
      const zeros = hours.filter((m) => m.kind === 'value' && m.value === 0).length;
      expect(zeros, String(path)).toBe(path === 'samsungDiretto' ? 12 : 0);
    }
  });
});

describe('battito (intraday_hr): senza un fuso dimostrato la serie non esiste', () => {
  const ROMA = 'Europe/Rome';
  const DAY = '2026-09-23';
  /** Le 08:00 di Roma (CEST) sono le 06:00 UTC. */
  const at = (hhmmUtc: string, day = DAY) => Date.parse(`${day}T${hhmmUtc}:00Z`);
  const healthy = () => [
    { ts: at('06:00'), bpm: 61 },
    { ts: at('06:05'), bpm: 64 },
    { ts: at('06:15'), bpm: 72 },
  ];

  it('con un fuso dato: i bucket vanno al minuto locale giusto, in ordine, e nient altro', () => {
    const r = heartSeriesFromRow({ local_day_key: DAY, intraday_hr: [...healthy()].reverse() }, ROMA);
    expect(r).toEqual({
      kind: 'value',
      value: [{ minute: 480, bpm: 61 }, { minute: 485, bpm: 64 }, { minute: 495, bpm: 72 }],
    });
    // niente minimo, massimo, media: sarebbero estremi di mediane, non estremi veri
    if (r.kind === 'value') for (const b of r.value) expect(Object.keys(b).sort()).toEqual(['bpm', 'minute']);
  });

  it('SENZA fuso dimostrato (null, vuoto, non valido) la stessa riga sana e assente', () => {
    for (const tz of [null, '', 'Non/EsisteAffatto']) {
      expect(heartSeriesFromRow({ local_day_key: DAY, intraday_hr: healthy() }, tz), String(tz)).toEqual(ABSENT);
    }
  });

  it('un fuso sbagliato sposta i bucket fuori dal giorno e la serie sparisce, non mostra ore false', () => {
    // le 00:30 di Roma del 23 sono le 22:30 UTC del 22: in UTC cadono sul giorno prima
    const notte = [{ ts: at('22:30', '2026-09-22'), bpm: 55 }, { ts: at('22:35', '2026-09-22'), bpm: 54 }];
    expect(heartSeriesFromRow({ local_day_key: DAY, intraday_hr: notte }, ROMA)).toMatchObject({ kind: 'value' });
    expect(heartSeriesFromRow({ local_day_key: DAY, intraday_hr: notte }, 'UTC')).toEqual(ABSENT);
  });

  it('il minuto e il tempo trascorso dalla mezzanotte locale: giorno con cambio d\'ora legale', () => {
    // 25/10/2026: a Roma la mezzanotte e ancora CEST (22:00 UTC del 24), la mezzanotte dopo e CET (23:00 UTC del 25)
    const r = heartSeriesFromRow(
      { local_day_key: '2026-10-25', intraday_hr: [{ ts: at('22:00', '2026-10-24'), bpm: 50 }, { ts: at('22:55', '2026-10-25'), bpm: 60 }, { ts: at('23:00', '2026-10-25'), bpm: 70 }] },
      ROMA,
    );
    // l'ultimo bucket e le 23:55 dell'orologio, ma dalla mezzanotte sono passate 24 ore e 55 minuti
    expect(r).toEqual({ kind: 'value', value: [{ minute: 0, bpm: 50 }, { minute: 25 * 60 - 5, bpm: 60 }] });
  });

  /** `n` bucket consecutivi da 5 minuti a partire da `fromUtc`. */
  const run = (fromUtc: number, n: number) => Array.from({ length: n }, (_, i) => ({ ts: fromUtc + i * 300_000, bpm: 60 + (i % 30) }));
  const minutesOf = (r: ReturnType<typeof heartSeriesFromRow>) => (r.kind === 'value' ? r.value.map((b) => b.minute) : []);
  const strictlyIncreasing = (xs: readonly number[]) => xs.every((x, i) => i === 0 || x > xs[i - 1]);

  it('giorno di 24 ore pieno: 288 bucket, e le voci del giorno dopo si scartano senza far sparire la serie', () => {
    const day = run(at('22:00', '2026-09-22'), 288);
    const r = heartSeriesFromRow({ local_day_key: DAY, intraday_hr: [...day, { ts: at('22:00', '2026-09-23'), bpm: 70 }] }, ROMA);
    expect(minutesOf(r)).toHaveLength(288);
    expect(minutesOf(r)[287]).toBe(24 * 60 - 5);
    expect(strictlyIncreasing(minutesOf(r))).toBe(true);
  });

  it('giorno di 25 ore (25/10/2026 a Roma) con l\'orologio tutto il giorno: 300 bucket, la serie c\'e', () => {
    const r = heartSeriesFromRow({ local_day_key: '2026-10-25', intraday_hr: run(at('22:00', '2026-10-24'), 300) }, ROMA);
    expect(minutesOf(r)).toHaveLength(300);
    expect(minutesOf(r)[299]).toBe(25 * 60 - 5);
    expect(strictlyIncreasing(minutesOf(r))).toBe(true);
  });

  it('ora ripetuta del 25/10: le 02:00 legali e le 02:00 solari sono due posizioni diverse, il grafico non torna indietro', () => {
    const r = heartSeriesFromRow({ local_day_key: '2026-10-25', intraday_hr: [{ ts: at('00:00', '2026-10-25'), bpm: 60 }, { ts: at('01:00', '2026-10-25'), bpm: 90 }] }, ROMA);
    expect(r).toEqual({ kind: 'value', value: [{ minute: 120, bpm: 60 }, { minute: 180, bpm: 90 }] });
  });

  it('giorno di 23 ore (29/03/2026 a Roma): 276 bucket, e il primo istante del giorno dopo resta fuori', () => {
    const day = run(at('23:00', '2026-03-28'), 276);
    const r = heartSeriesFromRow({ local_day_key: '2026-03-29', intraday_hr: [...day, { ts: at('22:00', '2026-03-29'), bpm: 70 }] }, ROMA);
    expect(minutesOf(r)).toHaveLength(276);
    expect(minutesOf(r)[275]).toBe(23 * 60 - 5);
    expect(strictlyIncreasing(minutesOf(r))).toBe(true);
  });

  it.each<[string, unknown]>([
    ['colonna nulla', null],
    ['colonna mancante', undefined],
    ['JSON non valido', '[{"ts":'],
    ['un oggetto invece di un array', { ts: 1, bpm: 60 }],
    ['array vuoto', []],
    ['istanti in SECONDI al posto dei millisecondi', healthy().map((b) => ({ ...b, ts: b.ts / 1000 })).map((b) => ({ ...b, ts: Math.floor(b.ts / 300) * 300 }))],
    ['istanti non allineati ai 5 minuti', healthy().map((b) => ({ ...b, ts: b.ts + 1000 }))],
    ['istanti relativi (offset in ms dalla mezzanotte, non epoch)', [{ ts: 8 * 3_600_000, bpm: 61 }, { ts: 8 * 3_600_000 + 300_000, bpm: 64 }]],
    ['istanti come testo', healthy().map((b) => ({ ...b, ts: String(b.ts) }))],
    ['bpm sotto il minimo (24)', [{ ts: at('06:00'), bpm: 24 }]],
    ['bpm sopra il massimo (241)', [{ ts: at('06:00'), bpm: 241 }]],
    ['bpm zero', [{ ts: at('06:00'), bpm: 0 }]],
    ['bpm frazionario', [{ ts: at('06:00'), bpm: 60.5 }]],
    ['bpm come testo', [{ ts: at('06:00'), bpm: '60' }]],
    ['bpm nullo', [{ ts: at('06:00'), bpm: null }]],
    ['voci che non sono oggetti', [60, 'x', null]],
    ['due voci con lo stesso istante (forma rotta)', [{ ts: at('06:00'), bpm: 60 }, { ts: at('06:00'), bpm: 90 }]],
    ['tutti i bucket fuori dal giorno', [{ ts: at('06:00', '2026-09-25'), bpm: 60 }]],
  ])('assente: %s', (_nome, intraday_hr) => {
    expect(heartSeriesFromRow({ local_day_key: DAY, intraday_hr }, ROMA)).toEqual(ABSENT);
  });

  it('un giorno illeggibile o mancante: assente', () => {
    for (const local_day_key of [null, undefined, '', '23/09/2026', '2026-9-23', 20260923]) {
      expect(heartSeriesFromRow({ local_day_key, intraday_hr: healthy() }, ROMA), String(local_day_key)).toEqual(ABSENT);
    }
  });

  it('una voce rotta fra voci sane e un BUCO, non un valore: le altre restano', () => {
    const r = heartSeriesFromRow({ local_day_key: DAY, intraday_hr: [...healthy(), { ts: at('06:20'), bpm: 999 }, { ts: 'x', bpm: 60 }] }, ROMA);
    expect(r).toMatchObject({ kind: 'value' });
    if (r.kind === 'value') expect(r.value.map((b) => b.minute)).toEqual([480, 485, 495]);
  });

  it('non esiste mai «parziale» ne uno zero: il battito o c\'e o e un buco', () => {
    const r = heartSeriesFromRow({ local_day_key: DAY, intraday_hr: healthy() }, ROMA);
    expect(r.kind).toBe('value');
    if (r.kind === 'value') expect(r.value.every((b) => b.bpm >= 25)).toBe(true);
  });
});

describe('sonno (sleep_stages): la notte si prova dagli stadi, non dalla colonna', () => {
  /** Minuti da mezzanotte UTC del 22/09: 22:50 e (22,50), le 06:30 del giorno dopo e (30,30). */
  const N = (h: number, m = 0) => Date.parse('2026-09-22T00:00:00Z') + (h * 60 + m) * 60_000;
  const seg = (stage: unknown, from: unknown, to: unknown, sessionIdx: unknown = 0): Record<string, unknown> => ({ stage, startMs: from, endMs: to, sessionIdx });
  const night = () => [
    seg('awake', N(22, 50), N(23)),
    seg('light', N(23), N(25)),
    seg('deep', N(25), N(26)),
    seg('rem', N(26), N(27)),
    seg('light', N(27), N(30, 30)),
  ];

  it('una notte sana: minuti come l\'app (unione), notte e risveglio dagli stadi, ipnogramma e ripartizione', () => {
    const r = sleepNightFromRow({ sleep_stages: night() });
    expect(r.kind).toBe('value');
    if (r.kind !== 'value') return;
    expect(r.value.totalMinutes).toEqual({ kind: 'value', value: 450 });
    expect(r.value.bedtime).toBe(new Date(N(22, 50)).toISOString());
    expect(r.value.wakeup).toBe(new Date(N(30, 30)).toISOString());
    expect(r.value.stages).toMatchObject({ kind: 'value' });
    if (r.value.stages.kind === 'value') {
      expect(r.value.stages.value[0]).toEqual({ stage: 'awake', fromMin: 0, toMin: 10 });
      expect(r.value.stages.value).toHaveLength(5);
    }
    expect(r.value.stageMinutes).toEqual({ kind: 'value', value: { awake: 10, rem: 60, light: 330, deep: 60 } });
  });

  it('il contenitore `asleep` non conta due volte le proprie fasi: 450 minuti, non 900', () => {
    const r = sleepNightFromRow({ sleep_stages: [seg('asleep', N(23), N(30, 30)), ...night().slice(1)] });
    expect(r.kind === 'value' && r.value.totalMinutes).toEqual({ kind: 'value', value: 450 });
  });

  it('solo `asleep`: il totale c\'e, ma nessun ipnogramma e nessuna ripartizione inventati', () => {
    const r = sleepNightFromRow({ sleep_stages: [seg('asleep', N(23), N(30, 30))] });
    expect(r.kind === 'value' && r.value.totalMinutes).toEqual({ kind: 'value', value: 450 });
    expect(r.kind === 'value' && r.value.stages).toEqual({ kind: 'absent', reason: 'source_lacks_type' });
    expect(r.kind === 'value' && r.value.stageMinutes).toEqual({ kind: 'absent', reason: 'source_lacks_type' });
  });

  it('una veglia dentro la notte si toglie dal sonno; i segmenti identici duplicati contano una volta', () => {
    const base = [seg('light', N(23), N(31)), seg('awake', N(26), N(26, 30))];
    const r = sleepNightFromRow({ sleep_stages: base });
    expect(r.kind === 'value' && r.value.totalMinutes).toEqual({ kind: 'value', value: 450 });
    const doppie = sleepNightFromRow({ sleep_stages: [...night(), ...night()] });
    expect(doppie).toEqual(sleepNightFromRow({ sleep_stages: night() }));
  });

  it('un pisolino accanto alla notte non cambia ne il totale ne la finestra, qualunque indice abbia', () => {
    const conPisolino = sleepNightFromRow({ sleep_stages: [...night(), seg('light', N(36), N(37), 1)] });
    expect(conPisolino).toEqual(sleepNightFromRow({ sleep_stages: night() }));
    // lo stesso pisolino con l'indice 0 e la notte con l'indice 1: la notte resta la notte
    const invertiti = sleepNightFromRow({ sleep_stages: [...night().map((s) => ({ ...s, sessionIdx: 1 })), seg('light', N(36), N(37), 0)] });
    expect(invertiti).toEqual(sleepNightFromRow({ sleep_stages: night() }));
  });

  it('la notte e la sessione con piu minuti dormiti, come l\'app: un pisolino alle 19:00 con indice 0 non e la notte', () => {
    // il server rinumera le sessioni in ordine cronologico: il pisolino serale prende lo 0
    const r = sleepNightFromRow({
      sleep_stages: [seg('light', N(19), N(19, 40), 0), seg('light', N(23, 30), N(31), 1)],
    });
    expect(r.kind).toBe('value');
    if (r.kind !== 'value') return;
    expect(r.value.totalMinutes).toEqual({ kind: 'value', value: 450 });
    expect(r.value.bedtime).toBe(new Date(N(23, 30)).toISOString());
    expect(r.value.wakeup).toBe(new Date(N(31)).toISOString());
  });

  it('una sessione sola, anche con indice 1, e la sessione principale (l\'app non guarda l\'indice)', () => {
    const r = sleepNightFromRow({ sleep_stages: [seg('light', N(36), N(37), 1)] });
    expect(r.kind === 'value' && r.value.totalMinutes).toEqual({ kind: 'value', value: 60 });
  });

  it('a parita di minuti vince l\'indice piu basso (scelta deterministica)', () => {
    const r = sleepNightFromRow({ sleep_stages: [seg('light', N(14), N(15), 2), seg('light', N(10), N(11), 1)] });
    expect(r.kind === 'value' && r.value.bedtime).toBe(new Date(N(10)).toISOString());
  });

  it('sessionIdx mancante o nullo vale 0, come app e server: la notte c\'e', () => {
    const attesa = sleepNightFromRow({ sleep_stages: night() });
    expect(sleepNightFromRow({ sleep_stages: night().map(({ sessionIdx: _s, ...s }) => s) })).toEqual(attesa);
    expect(sleepNightFromRow({ sleep_stages: night().map((s) => ({ ...s, sessionIdx: null })) })).toEqual(attesa);
  });

  it('ripartizione riportata al totale col resto piu grande (come reconcileSleepStagesToTotal): una veglia dentro un segmento leggero', () => {
    // leggero 23-03 con veglia 02:00-02:30 dentro, profondo 03-04, REM 04-06: totale 390, corsie grezze 420
    const r = sleepNightFromRow({
      sleep_stages: [seg('light', N(23), N(27)), seg('awake', N(26), N(26, 30)), seg('deep', N(27), N(28)), seg('rem', N(28), N(30))],
    });
    expect(r.kind).toBe('value');
    if (r.kind !== 'value') return;
    expect(r.value.totalMinutes).toEqual({ kind: 'value', value: 390 });
    expect(r.value.stageMinutes).toEqual({ kind: 'value', value: { awake: 30, rem: 111, light: 223, deep: 56 } });
    if (r.value.stageMinutes.kind === 'value') {
      const { rem, light, deep } = r.value.stageMinutes.value;
      expect(rem + light + deep).toBe(390);
    }
  });

  it('cio che non si capisce non diventa mai sonno: stadi sconosciuti, non testuali, `in_bed`', () => {
    for (const stage of ['nap', 'unknown', '', 'in_bed', 'inbed', 42, null, { a: 1 }]) {
      expect(sleepNightFromRow({ sleep_stages: [seg(stage, N(23), N(30))] }), String(stage)).toEqual(ABSENT);
    }
    // uno sconosciuto accanto a uno noto non allunga la notte
    const r = sleepNightFromRow({ sleep_stages: [seg('light', N(23), N(24)), seg('mystery', N(20), N(35))] });
    expect(r.kind === 'value' && r.value.totalMinutes).toEqual({ kind: 'value', value: 60 });
    expect(r.kind === 'value' && r.value.bedtime).toBe(new Date(N(23)).toISOString());
  });

  it.each<[string, unknown]>([
    ['colonna nulla', null],
    ['colonna mancante', undefined],
    ['JSON non valido', '[{"stage":'],
    ['JSON valido scritto come testo', JSON.stringify(night())],
    ['un oggetto invece di un array', night()[0]],
    ['array vuoto', []],
    ['istanti in SECONDI al posto dei millisecondi', night().map((s) => ({ ...s, startMs: (s.startMs as number) / 1000, endMs: (s.endMs as number) / 1000 }))],
    ['istanti come testo', night().map((s) => ({ ...s, startMs: String(s.startMs) }))],
    ['istanti relativi (offset in ms dall inizio della notte, non epoch): una notte da 8 ore con un inizio nel 1970', [seg('light', 0, 8 * 3_600_000)]],
    ['fine prima dell\'inizio', night().map((s) => ({ ...s, endMs: (s.startMs as number) - 1 }))],
    ['fine uguale all\'inizio', night().map((s) => ({ ...s, endMs: s.startMs }))],
    ['sessionIdx come testo', night().map((s) => ({ ...s, sessionIdx: '0' }))],
    ['sessionIdx frazionario', night().map((s) => ({ ...s, sessionIdx: 0.5 }))],
    ['una notte di piu di 24 ore', [seg('light', N(0), N(25))]],
    ['solo veglia: 0 minuti dormiti', [seg('awake', N(23), N(30))]],
    ['veglia che copre tutto il sonno', [seg('light', N(23), N(24)), seg('awake', N(22), N(25))]],
  ])('assente: %s', (_nome, sleep_stages) => {
    expect(sleepNightFromRow({ sleep_stages })).toEqual(ABSENT);
  });

  it('un segmento rotto fra segmenti sani si scarta, gli altri restano', () => {
    const r = sleepNightFromRow({ sleep_stages: [...night(), 'x', { stage: 'rem' }, seg('rem', 'a', 'b')] });
    expect(r).toEqual(sleepNightFromRow({ sleep_stages: night() }));
  });

  it('ripartizione: se REM + leggero + profondo non tornano col totale entro il 15%, i minuti per fase NON si mostrano', () => {
    const r = sleepNightFromRow({ sleep_stages: [seg('asleep', N(23), N(31)), seg('light', N(23), N(23, 30))] });
    expect(r.kind === 'value' && r.value.totalMinutes).toEqual({ kind: 'value', value: 480 });
    expect(r.kind === 'value' && r.value.stageMinutes).toEqual({ kind: 'absent', reason: 'no_samples' });
  });

  it('non esiste «parziale»: nessun marcatore di completezza nella riga', () => {
    const r = sleepNightFromRow({ sleep_stages: night() });
    expect(r.kind).toBe('value');
    if (r.kind === 'value') for (const m of [r.value.totalMinutes, r.value.stages, r.value.stageMinutes]) expect(m.kind).not.toBe('partial');
  });
});

describe('HRV (hrv_rmssd): solo dove il valore e davvero un RMSSD', () => {
  it('sorgenti non iOS: misurato se > 0', () => {
    for (const source of ['health_connect', 'oura_oauth', 'suunto_oauth', 'colmi_ble']) {
      expect(hrvRmssdFromRow({ source, hrv_rmssd: 48 }), source).toEqual({ kind: 'value', value: 48 });
    }
  });

  it('iPhone: il valore storico dentro hrv_rmssd e un SDNN, quindi assente anche se c e', () => {
    for (const source of ['healthkit', 'apple_health']) {
      expect(hrvRmssdFromRow({ source, hrv_rmssd: 48 }), source).toEqual({ kind: 'absent', reason: 'source_lacks_type' });
    }
  });

  it('sorgente ignota, mancante, non testuale o con un nome di persona: assente', () => {
    for (const source of [null, undefined, '', 'Health_Connect', 'garmin_oauth', 'Mario Rossi', 42, {}]) {
      expect(hrvRmssdFromRow({ source, hrv_rmssd: 48 }), String(source)).toEqual({ kind: 'absent', reason: 'source_lacks_type' });
    }
  });

  it('nullo, zero, negativo, testo o non finito: assente, mai zero', () => {
    for (const hrv_rmssd of [null, undefined, 0, -3, '48', Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(hrvRmssdFromRow({ source: 'health_connect', hrv_rmssd }), String(hrv_rmssd)).toEqual({ kind: 'absent', reason: 'no_samples' });
    }
  });
});

describe('fonti: vocabolario chiuso e solo l\'ultimo dato ricevuto', () => {
  it('ogni valore scritto dall\'app ha il suo id; apple_health e healthkit sono lo stesso archivio', () => {
    expect(sourceIdOf('health_connect')).toBe('health_connect');
    expect(sourceIdOf('healthkit')).toBe('healthkit');
    expect(sourceIdOf('apple_health')).toBe('healthkit');
    expect(sourceIdOf('colmi_ble')).toBe('ring');
    expect(sourceIdOf('strava_oauth')).toBe('strava');
    expect(sourceIdOf('oura_oauth')).toBe('oura');
    expect(sourceIdOf('suunto_oauth')).toBe('suunto');
  });

  it('tutto il resto e «other»: un nome di persona, prototipi di oggetto, testo non testuale, maiuscole', () => {
    for (const raw of ['Mario Rossi', 'iPhone di Mario', 'constructor', '__proto__', 'toString', 'hasOwnProperty', 'HEALTH_CONNECT', ' health_connect', '', null, undefined, 42, {}, ['health_connect']]) {
      expect(sourceIdOf(raw), String(raw)).toBe('other');
    }
  });

  it('una riga con un nome proprio nel campo di fonte non porta quel nome da nessuna parte', () => {
    const rows = [
      { source: 'Mario Rossi', received_at: '2026-09-24T07:28:00.000Z' },
      { source: 'health_connect', received_at: '2026-09-24T06:00:00.000Z' },
      { source: 'Anna Verdi', received_at: '2026-09-24T08:00:00.000Z' },
    ];
    const out = sourcesFromRows(rows);
    expect(out).toEqual([
      { ref: { id: 'health_connect' }, lastReceivedAt: '2026-09-24T06:00:00.000Z' },
      { ref: { id: 'other' }, lastReceivedAt: '2026-09-24T08:00:00.000Z' },
    ]);
    const json = JSON.stringify(out);
    expect(json).not.toMatch(/Mario|Rossi|Anna|Verdi/);
  });

  it('l\'ultimo dato e il piu recente per sorgente, l\'ordine e quello del vocabolario, e le righe illeggibili non creano sorgenti', () => {
    const out = sourcesFromRows([
      { source: 'colmi_ble', received_at: '2026-09-20T10:00:00Z' },
      { source: 'apple_health', received_at: '2026-09-21T10:00:00Z' },
      { source: 'healthkit', received_at: '2026-09-22T10:00:00Z' },
      { source: 'healthkit', received_at: '2026-09-19T10:00:00Z' },
      { source: 'strava_oauth', received_at: 'ieri' },
      { source: 'oura_oauth', received_at: null },
      { source: 'suunto_oauth' },
    ]);
    expect(out.map((r) => r.ref.id)).toEqual(['healthkit', 'ring']);
    expect(out[0].lastReceivedAt).toBe('2026-09-22T10:00:00.000Z');
    expect(sourcesFromRows([])).toEqual([]);
  });

  it('una sorgente porta solo id e ultimo dato, senza genere e senza sorgente scelta', () => {
    const [row] = sourcesFromRows([{ source: 'colmi_ble', received_at: '2026-09-20T10:00:00Z' }]);
    expect(Object.keys(row).sort()).toEqual(['lastReceivedAt', 'ref']);
    expect(Object.keys(row.ref)).toEqual(['id']);
  });
});

describe('allenamenti: riconciliati con l\'app, la stessa attivita non si conta due volte', () => {
  const S = at('2026-09-18');
  const run = (over: Partial<WorkoutRowLike> = {}): WorkoutRowLike => ({ start_ms: S, end_ms: S + 40 * 60_000, type: 'RUNNING', duration_min: 40, ...over });

  it('stessi start ed end, durata diversa: vale la PIU ALTA, in qualunque ordine, e il totale non si somma', () => {
    for (const rows of [[run({ duration_min: 40 }), run({ duration_min: 55 })], [run({ duration_min: 55 }), run({ duration_min: 40 })]]) {
      expect(dedupeWorkoutRows(rows)).toHaveLength(1);
      expect(dedupeWorkoutRows(rows)[0].duration_min).toBe(55);
      const [d] = workoutsWeekFromRows(rows, ['2026-09-18'], CTX);
      expect(d.count).toEqual({ kind: 'value', value: 1 });
      expect(d.durationMin).toEqual({ kind: 'value', value: 55 });
    }
    expect(dedupeWorkoutRows([run({ duration_min: 30 }), run({ duration_min: 55 }), run({ duration_min: 40 })])[0].duration_min).toBe(55);
  });

  it('una durata zero o nulla non batte una durata vera fra righe uguali', () => {
    expect(dedupeWorkoutRows([run({ duration_min: 0 }), run({ duration_min: 40 })])[0].duration_min).toBe(40);
    expect(dedupeWorkoutRows([run({ duration_min: 40 }), run({ duration_min: null })])[0].duration_min).toBe(40);
  });

  it('il tipo si confronta come l\'app (trim di Dart): maiuscole, spazi, tabulazioni e a capo non creano sessioni. Il server toglie solo gli spazi', () => {
    const tipi = ['RUNNING', 'running', ' running ', '\trunning\n', 'Running'];
    expect(dedupeWorkoutRows(tipi.map((type) => run({ type })))).toHaveLength(1);
    expect(dedupeWorkoutRows([run({ type: 'running' }), run({ type: 'run ning' })])).toHaveLength(2);
  });

  it('reinvio ripetuto: N righe identiche sono una sessione', () => {
    expect(dedupeWorkoutRows(Array.from({ length: 6 }, () => run()))).toHaveLength(1);
  });

  it('DIVERGENZA nota dall\'app: due righe che differiscono di secondi restano due per il web (l\'app le fonde al minuto)', () => {
    const drift = [run(), run({ start_ms: S + 5000, end_ms: S + 40 * 60_000 + 5000 })];
    expect(dedupeWorkoutRows(drift)).toHaveLength(2);
    expect(appMergeCount(drift.map(asAppSession))).toBe(1);
  });

  it('coincidono con l\'app: reinvio, maiuscole, spazi, due dispositivi con gli stessi orari (l\'app non ha device_id)', () => {
    const casi: WorkoutRowLike[][] = [
      [run(), run()],
      [run({ type: 'RUNNING' }), run({ type: ' running ' })],
      [run({ duration_min: 40 }), run({ duration_min: 55 })],
      [run(), run({ type: 'walking' })],
    ];
    for (const rows of casi) expect(dedupeWorkoutRows(rows).length).toBe(appMergeCount(rows.map(asAppSession)));
  });

  it('DIVERGENZA nota: `type` nullo. L\'app usa `name`, il web ha `\'\'`, quindi vede due sessioni dove l\'app ne vede una', () => {
    const rows = [run({ type: null }), run({ type: 'running' })];
    expect(dedupeWorkoutRows(rows)).toHaveLength(2);
    expect(appMergeCount([{ startMs: S, endMs: S + 40 * 60_000, name: 'running' }, { startMs: S, endMs: S + 40 * 60_000, type: 'running' }])).toBe(1);
  });

  it('una sessione presente in exercise_sessions ma non in workouts (upsert best effort fallito) per il web e ASSENTE, mai zero', () => {
    const [d] = workoutsWeekFromRows([], ['2026-09-18'], CTX);
    expect(d.count).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(d.durationMin).toEqual({ kind: 'absent', reason: 'no_samples' });
  });

  it('calorie di una sessione Health Connect: la colonna e NULL (l\'app scrive activeCaloriesKcal), quindi assente, mai 0', () => {
    expect(columnMeasure(null, 'counter')).toEqual(ABSENT);
    expect(COLONNE_ALLENAMENTI).toContain('calories_kcal');
  });

  it('il web non legge exercise_sessions: la stessa attivita non ha due sorgenti da contare', () => {
    for (const lista of [COLONNE_METRICHE, COLONNE_SERIE_DEL_GIORNO] as readonly (readonly string[])[]) expect(lista).not.toContain('exercise_sessions');
  });
});

interface AppSession {
  startMs: number;
  endMs: number;
  type?: unknown;
  name?: unknown;
}

/** Una riga di `workouts` vista come la sessione che l'app avrebbe in `exercise_sessions`. */
function asAppSession(r: WorkoutRowLike): AppSession {
  return { startMs: r.start_ms as number, endMs: r.end_ms as number, type: r.type };
}

/**
 * La chiave con cui l'app considera uguali due sessioni (`mergeExerciseSessions`, row_collapse.dart):
 * `floor(start / 60000) | floor(end / 60000) | lower(trim(type ?? name ?? ''))`. E' riscritta qui dal codice
 * dell'app, NON importata: serve solo a mostrare dove web e app coincidono e dove no.
 */
function appMergeCount(sessions: readonly AppSession[]): number {
  return new Set(
    sessions.map((s) => `${Math.floor(s.startMs / 60000)}|${Math.floor(s.endMs / 60000)}|${String(s.type ?? s.name ?? '').trim().toLowerCase()}`),
  ).size;
}
