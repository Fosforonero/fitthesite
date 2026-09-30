import { describe, expect, it } from 'vitest';

import type { Measure } from './measure';
import { SCENARIO_KEYS, type DashboardData } from './model';
import { DEFAULT_DAY, SYNTHETIC_TODAY, addDays, buildDashboardData, buildDashboardResult, clampDay } from './synthetic';

const ready = (sc: Parameters<typeof buildDashboardData>[0], d = DEFAULT_DAY): DashboardData => buildDashboardData(sc, d);
const measures = (m: Measure<number>[]) => ({
  values: m.filter((x) => x.kind === 'value').length,
  zeros: m.filter((x) => x.kind === 'value' && x.value === 0).length,
  partials: m.filter((x) => x.kind === 'partial').length,
  absents: m.filter((x) => x.kind === 'absent').length,
});

describe('dati sintetici', () => {
  it('sono deterministici', () => {
    for (const sc of SCENARIO_KEYS) {
      expect(JSON.stringify(buildDashboardResult(sc, DEFAULT_DAY)), sc).toBe(JSON.stringify(buildDashboardResult(sc, DEFAULT_DAY)));
    }
    expect(JSON.stringify(ready('ok'))).not.toBe(JSON.stringify(ready('ok', addDays(DEFAULT_DAY, -1))));
  });

  it('loading ed error non portano dati', () => {
    expect(buildDashboardResult('loading', DEFAULT_DAY)).toEqual({ status: 'loading' });
    expect(buildDashboardResult('error', DEFAULT_DAY)).toMatchObject({ status: 'error' });
  });

  it('ok: 24 slot orari, notte a zero MISURATO, nessun assente, trend completo di 90 giorni', () => {
    const d = ready('ok');
    expect(d.activity.hourlySteps).toHaveLength(24);
    const c = measures(d.activity.hourlySteps);
    expect(c.absents).toBe(0);
    expect(c.zeros).toBeGreaterThan(0);
    expect(d.activity.steps.kind).toBe('value');
    for (const t of d.trends) {
      expect(t.days).toHaveLength(90);
      expect(t.days.every((p) => p.m.kind === 'value')).toBe(true);
    }
    expect(d.receipt.lastReceivedAt).not.toBeNull();
  });

  it('partial: la finestra ricevuta finisce alle 13:00, le ore dopo sono ASSENTI (non zero), il totale e\' parziale e nessun buco e interno', () => {
    const d = ready('partial');
    const hours = d.activity.hourlySteps;
    for (let h = 13; h < 24; h++) expect(hours[h], `ora ${h}`).toEqual({ kind: 'absent', reason: 'no_samples' });
    // nessun buco interno: prima delle 13 ogni ora e misurata, senza assenti in mezzo
    for (let h = 0; h < 13; h++) expect(hours[h].kind, `ora ${h}`).toBe('value');
    expect(d.activity.steps).toMatchObject({ kind: 'partial', note: 'incomplete_coverage', coverage: 13 / 24 });
    expect(d.activity.distanceKm).toMatchObject({ kind: 'partial', note: 'incomplete_coverage', coverage: 13 / 24 });
    expect(d.activity.caloriesActive).toMatchObject({ kind: 'partial', note: 'incomplete_coverage', coverage: 13 / 24 });
    // il battito: stessa finestra corta, la copertura viene dalla finestra e non dai punti della serie intraday
    expect(d.heart.average).toMatchObject({ kind: 'partial', note: 'incomplete_coverage', coverage: 13 / 24 });
    const lastKnown = Math.max(...d.heart.series.filter((p) => p.bpm !== null).map((p) => p.minute));
    const firstHole = Math.min(...d.heart.series.filter((p) => p.bpm === null).map((p) => p.minute));
    expect(firstHole).toBeGreaterThan(lastKnown);
    // i piani sono fuori whitelist: il modello non ha nemmeno il campo
    expect('floors' in d.activity).toBe(false);
    expect(d.sleep.night.kind).toBe('value');
    if (d.sleep.night.kind === 'value') {
      expect(d.sleep.night.value.totalMinutes.kind).toBe('value');
      expect(d.sleep.night.value.stages).toEqual({ kind: 'absent', reason: 'source_lacks_type' });
    }
    // il server non distingue «non fornito dalla fonte» da «nessun dato»: gli allenamenti senza righe sono no_samples
    expect(d.workouts.sessions).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(d.heart.series.some((p) => p.bpm === null)).toBe(true);
    expect(d.heart.series.every((p) => p.bpm !== 0)).toBe(true);
    const c = measures(d.trends.find((t) => t.metric === 'steps')!.days.map((p) => p.m));
    expect(c.absents).toBeGreaterThan(0);
    expect(c.zeros).toBeGreaterThan(0);
    expect(c.partials).toBeGreaterThan(0);
  });

  it('zeros: zero misurato su colonne della whitelist (passi, distanza) accanto a notte assente e a allenamenti assenti, mai «zero allenamenti»', () => {
    const d = ready('zeros');
    expect(d.activity.steps).toEqual({ kind: 'value', value: 0 });
    expect(d.activity.distanceKm).toEqual({ kind: 'value', value: 0 });
    // le ore da intraday_steps non provano uno zero: mai uno zero misurato
    expect(d.activity.hourlySteps.every((h) => h.kind === 'absent')).toBe(true);
    // nessuna riga di allenamenti nel giorno: assente, NON value([])
    expect(d.workouts.sessions).toEqual({ kind: 'absent', reason: 'no_samples' });
    // il riquadro settimanale: il parziale (una riga senza durata), la durata non ricevuta (righe ma nessuna durata) e gli assenti
    const states = d.workouts.week.map((w) => w.durationMin.kind);
    expect(states).toContain('partial');
    expect(states).toContain('absent');
    expect(states).toContain('value');
    // nessuna durata a zero misurato: duration_min = 0 non e provato dalla fonte
    expect(d.workouts.week.some((w) => w.durationMin.kind === 'value' && w.durationMin.value === 0)).toBe(false);
    // il giorno con una riga senza durata ha il conteggio ma non la durata
    const noDuration = d.workouts.week.find((w) => w.count.kind === 'value' && w.durationMin.kind === 'absent');
    expect(noDuration).toBeDefined();
    expect(d.sleep.night).toEqual({ kind: 'absent', reason: 'no_samples' });
  });

  it('stale: dopo l\'ultimo dato ricevuto tutto e\' assente per «non ancora sincronizzato»', () => {
    const d = ready('stale');
    expect(d.receipt.ageMinutes).toBeGreaterThan(24 * 60);
    expect(d.activity.steps).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    expect(d.sleep.night).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    const steps = d.trends.find((t) => t.metric === 'steps')!.days;
    expect(steps[steps.length - 1].m).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    expect(steps.some((p) => p.m.kind === 'value')).toBe(true);
  });

  it('empty: nessuna fonte, nessun dato ricevuto, nessun valore ovunque', () => {
    const d = ready('empty');
    expect(d.sources).toEqual([]);
    expect(d.receipt).toEqual({ lastReceivedAt: null, ageMinutes: null });
    expect(d.workouts.week.every((w) => w.count.kind === 'absent' && w.durationMin.kind === 'absent')).toBe(true);
    expect(d.workouts.week.map((w) => (w.durationMin as { reason: string }).reason)).toEqual(Array(7).fill('no_data_received'));
    const all: Measure<unknown>[] = [
      d.activity.steps, d.activity.distanceKm, d.activity.caloriesActive,
      ...d.activity.hourlySteps, d.sleep.night, d.workouts.sessions, d.heart.resting, d.heart.average,
      ...d.trends.flatMap((t) => t.days.map((p) => p.m)),
    ];
    expect(all.every((m) => m.kind === 'absent')).toBe(true);
    expect(d.heart.series.every((p) => p.bpm === null)).toBe(true);
  });

  it('oggi: le ore future sono «non ancora», il totale e\' una finestra aperta', () => {
    const d = ready('ok', SYNTHETIC_TODAY);
    expect(d.activity.hourlySteps[15]).toEqual({ kind: 'absent', reason: 'not_yet' });
    expect(d.activity.steps).toMatchObject({ kind: 'partial', note: 'window_open' });
  });

  it('clampDay: non oltre oggi, non oltre 89 giorni indietro, mai una data invalida', () => {
    expect(clampDay(undefined)).toBe(DEFAULT_DAY);
    expect(clampDay('boh')).toBe(DEFAULT_DAY);
    expect(clampDay('2030-01-01')).toBe(SYNTHETIC_TODAY);
    expect(clampDay('2020-01-01')).toBe(addDays(SYNTHETIC_TODAY, -89));
  });

  it('nessuno scenario, nessun giorno: una lista di allenamenti vuota non e mai uno zero (value([]) non esiste)', () => {
    for (const sc of SCENARIO_KEYS) {
      for (let i = 0; i < 30; i++) {
        const r = buildDashboardResult(sc, addDays(SYNTHETIC_TODAY, -i));
        if (r.status !== 'ready') continue;
        const s = r.data.workouts.sessions;
        if (s.kind !== 'absent') expect(s.value.length, `${sc} -${i}`).toBeGreaterThan(0);
      }
    }
  });

  it('il riquadro settimanale: sette giorni che finiscono nel giorno mostrato, conteggio mai 0, zero solo con una riga', () => {
    for (const sc of SCENARIO_KEYS) {
      for (let i = 0; i < 30; i++) {
        const day = addDays(SYNTHETIC_TODAY, -i);
        const r = buildDashboardResult(sc, day);
        if (r.status !== 'ready') continue;
        const week = r.data.workouts.week;
        expect(week.map((w) => w.date), `${sc} ${day}`).toEqual(Array.from({ length: 7 }, (_, k) => addDays(day, k - 6)));
        for (const w of week) {
          // il conteggio esiste solo con almeno una riga
          if (w.count.kind !== 'absent') expect(w.count.value, `${sc} ${w.date}`).toBeGreaterThanOrEqual(1);
          // una durata a zero misurato ha sempre almeno una riga dietro
          if (w.durationMin.kind === 'value' && w.durationMin.value === 0) expect(w.count.kind, `${sc} ${w.date}`).not.toBe('absent');
          // conteggio e durata sono assenti insieme quando non ci sono righe
          if (w.count.kind === 'absent') expect(w.durationMin.kind, `${sc} ${w.date}`).toBe('absent');
        }
        // il giorno mostrato e' l'ultimo della settimana e concorda con l'elenco delle sessioni
        const last = week[6];
        const s = r.data.workouts.sessions;
        expect(last.date).toBe(day);
        expect(s.kind === 'absent').toBe(last.count.kind === 'absent');
        if (s.kind !== 'absent' && last.count.kind !== 'absent' && day !== SYNTHETIC_TODAY) expect(last.count).toEqual({ kind: 'value', value: s.value.length });
      }
    }
  });

  it('stale: dopo il giorno dell ultimo dato ricevuto gli allenamenti sono assenti per «non ancora sincronizzato», prima ci sono le righe', () => {
    const d = ready('stale');
    const byDate = Object.fromEntries(d.workouts.week.map((w) => [w.date, w.durationMin]));
    expect(byDate['2026-09-22']).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    expect(byDate['2026-09-23']).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    expect(byDate['2026-09-21'].kind).toBe('value');
    expect(d.workouts.sessions).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
  });

  it('partial: nessuna riga di allenamenti, e il riquadro settimanale dice «nessun campione» (mai «non fornito dalla fonte»)', () => {
    const d = ready('partial');
    expect(d.workouts.week.map((w) => w.durationMin)).toEqual(Array(7).fill({ kind: 'absent', reason: 'no_samples' }));
  });

  it('nessuno scenario dimostra un «non fornito dalla fonte» per gli allenamenti: il server non lo distingue da «nessun dato»', () => {
    for (const sc of SCENARIO_KEYS) {
      const r = buildDashboardResult(sc, DEFAULT_DAY);
      if (r.status !== 'ready') continue;
      const w = r.data.workouts;
      if (w.sessions.kind === 'absent') expect(w.sessions.reason, sc).not.toBe('source_lacks_type');
      for (const day of w.week) for (const m of [day.count, day.durationMin]) if (m.kind === 'absent') expect(m.reason, `${sc} ${day.date}`).not.toBe('source_lacks_type');
    }
  });

  it('oggi: gli allenamenti che cominciano dopo «adesso» non esistono ancora e la giornata di oggi e aperta', () => {
    const d = ready('ok', SYNTHETIC_TODAY);
    // giovedi': la corsa e prevista alle 18, dopo le 09:40
    expect(d.workouts.sessions).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(d.workouts.week[6].date).toBe(SYNTHETIC_TODAY);
    expect(d.workouts.week[6].durationMin.kind).toBe('absent');
  });

  it('i parziali dei trend riguardano solo i passi: sonno e FC a riposo non hanno una finestra che possa dirlo', () => {
    // il server ha una finestra (window_start_ms, window_end_ms) per i contatori giornalieri, non per un valore puntuale
    for (const sc of SCENARIO_KEYS) {
      const r = buildDashboardResult(sc, DEFAULT_DAY);
      if (r.status !== 'ready') continue;
      for (const t of r.data.trends.filter((x) => x.metric !== 'steps')) {
        expect(t.days.some((p) => p.m.kind === 'partial'), `${sc}/${t.metric}`).toBe(false);
      }
    }
  });

  it('nessun numero e\' NaN, infinito o negativo', () => {
    const bad: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (typeof v === 'number' && (!Number.isFinite(v) || v < 0)) bad.push(`${path}=${v}`);
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    for (const sc of SCENARIO_KEYS) {
      const r = buildDashboardResult(sc, DEFAULT_DAY);
      if (r.status === 'ready') walk(r.data, sc);
    }
    expect(bad).toEqual([]);
  });
});
