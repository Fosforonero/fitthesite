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
    expect(d.sync.state).toBe('ok');
  });

  it('partial: ore senza campioni sono ASSENTI, non zero; il totale e\' parziale; fasi e allenamenti mancano per motivi diversi', () => {
    const d = ready('partial');
    const hours = d.activity.hourlySteps;
    for (let h = 13; h <= 17; h++) expect(hours[h], `ora ${h}`).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(d.activity.steps.kind).toBe('partial');
    expect(d.sleep.night.kind).toBe('value');
    if (d.sleep.night.kind === 'value') {
      expect(d.sleep.night.value.totalMinutes.kind).toBe('value');
      expect(d.sleep.night.value.stages).toEqual({ kind: 'absent', reason: 'source_lacks_type' });
    }
    expect(d.workouts.sessions).toEqual({ kind: 'absent', reason: 'permission_missing' });
    expect(d.heart.series.some((p) => p.bpm === null)).toBe(true);
    expect(d.heart.series.every((p) => p.bpm !== 0)).toBe(true);
    const c = measures(d.trends.find((t) => t.metric === 'activeMinutes')!.days.map((p) => p.m));
    expect(c.absents).toBeGreaterThan(0);
    expect(c.zeros).toBeGreaterThan(0);
    expect(d.sync.state).toBe('partial');
  });

  it('zeros: zero misurato (piani, minuti attivi, nessun allenamento) accanto a notte assente', () => {
    const d = ready('zeros');
    expect(d.activity.floors).toEqual({ kind: 'value', value: 0 });
    expect(d.activity.activeMinutes).toEqual({ kind: 'value', value: 0 });
    expect(d.workouts.sessions).toEqual({ kind: 'value', value: [] });
    expect(d.sleep.night).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(d.activity.hourlySteps[15]).toEqual({ kind: 'absent', reason: 'no_samples' });
    expect(d.activity.hourlySteps[2]).toEqual({ kind: 'value', value: 0 });
  });

  it('stale: dopo l\'ultimo sync tutto e\' assente per «non ancora sincronizzato»', () => {
    const d = ready('stale');
    expect(d.sync.ageMinutes).toBeGreaterThan(24 * 60);
    expect(d.activity.steps).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    expect(d.sleep.night).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    const steps = d.trends.find((t) => t.metric === 'steps')!.days;
    expect(steps[steps.length - 1].m).toEqual({ kind: 'absent', reason: 'not_synced_yet' });
    expect(steps.some((p) => p.m.kind === 'value')).toBe(true);
  });

  it('empty: nessuna fonte, nessun sync, nessun valore ovunque', () => {
    const d = ready('empty');
    expect(d.sources).toEqual([]);
    expect(d.sync.state).toBe('never');
    expect(d.activity.stepsSource).toBeNull();
    const all: Measure<unknown>[] = [
      d.activity.steps, d.activity.distanceKm, d.activity.activeMinutes, d.activity.floors, d.activity.caloriesActive,
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
