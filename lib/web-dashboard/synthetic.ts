/**
 * Dati SINTETICI per il prototipo della dashboard web. Nessun dato reale.
 *
 * Deterministici: stessa data e stesso scenario, stesso risultato (PRNG con
 * seme). Cosi' gli screenshot sono riproducibili e i test possono asserire.
 *
 * Scenari (vedi ScenarioKey):
 *  - ok       giornata completa, tutte le fonti in ordine
 *  - partial  il dato c'e' ma incompleto: orologio spento per alcune ore, fasi
 *             del sonno non fornite, allenamenti non autorizzati, buchi nei trend
 *  - zeros    zero MISURATO accanto a dato ASSENTE (0 piani, 0 minuti attivi,
 *             «nessun allenamento» contro «notte senza dati»)
 *  - stale    ultimo sync di tre giorni fa: cio' che viene dopo e' assente
 *  - empty    nessuna fonte collegata
 *  - error    il caricamento fallisce
 *  - loading  scheletro
 */
import { absent, partial, value, type Measure } from './measure';
import type {
  ActivityDay,
  DashboardData,
  DashboardResult,
  HeartDay,
  HeartPoint,
  ScenarioKey,
  SleepBlock,
  SleepDay,
  SleepStage,
  SourceRef,
  SourceRow,
  SyncLogEntry,
  SyncStatus,
  TrendMetric,
  TrendPoint,
  TrendSeries,
  Workout,
  WorkoutsDay,
} from './model';

/** «Ora» dell'anteprima: fissa, cosi' nulla dipende dall'orologio di chi guarda. */
export const SYNTHETIC_NOW = '2026-09-24T09:40:00+02:00';
export const SYNTHETIC_TODAY = '2026-09-24';
/** Giorno mostrato di default: ieri, una giornata completa. */
export const DEFAULT_DAY = '2026-09-23';
const LAST_SYNC_OK = '2026-09-24T09:28:00+02:00';
const LAST_SYNC_STALE = '2026-09-21T18:05:00+02:00';

export const WATCH: SourceRef = { id: 'galaxy-watch', label: 'Galaxy Watch', kind: 'watch', via: 'health_connect' };
export const PHONE: SourceRef = { id: 'phone', label: 'Telefono', kind: 'phone', via: 'health_connect' };

// ── utilita' ────────────────────────────────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isValidDay(date: string | undefined): date is string {
  return !!date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));
}

/** Il giorno e' navigabile solo fino a oggi (sintetico) e non oltre 89 giorni prima. */
export function clampDay(date: string | undefined): string {
  const d = isValidDay(date) ? date : DEFAULT_DAY;
  if (d > SYNTHETIC_TODAY) return SYNTHETIC_TODAY;
  const min = addDays(SYNTHETIC_TODAY, -89);
  return d < min ? min : d;
}

const between = (r: () => number, lo: number, hi: number) => lo + (hi - lo) * r();
const round = (n: number) => Math.round(n);

/** Peso orario dei passi (00-23): notte ferma, picchi mattina, pranzo, sera. */
const HOUR_WEIGHT = [0, 0, 0, 0, 0, 0.2, 1.2, 3.5, 5.5, 3.2, 2.4, 2.8, 4.6, 3.4, 2.2, 2.4, 3.0, 4.6, 5.4, 3.6, 2.2, 1.0, 0.3, 0];

// ── attivita' ───────────────────────────────────────────────────────────────
function buildActivity(date: string, sc: ScenarioKey): ActivityDay {
  const r = rng(`activity:${date}`);
  const target = round(between(r, 6200, 11800));
  const isToday = date === SYNTHETIC_TODAY;
  const nowHour = 9; // «ora» sintetica 09:40

  const totalWeight = HOUR_WEIGHT.reduce((s, w) => s + w, 0);
  const hours: Measure<number>[] = HOUR_WEIGHT.map((w, h) => {
    if (isToday && h > nowHour) return absent('not_yet');
    if (isToday && h === nowHour) return partial(round((w / totalWeight) * target * 0.6), 0.67, 'window_open');
    // 0 misurato: l'orologio e' al polso e non ha contato passi
    return value(round((w / totalWeight) * target * between(r, 0.85, 1.15)));
  });

  let steps: Measure<number> = value(hours.reduce((s, m) => s + (m.kind === 'absent' ? 0 : m.value), 0));
  let distanceKm: Measure<number> = value(Number((((steps as { value: number }).value) * 0.00074).toFixed(1)));
  let activeMinutes: Measure<number> = value(round(between(r, 24, 78)));
  let floors: Measure<number> = value(round(between(r, 3, 14)));
  let caloriesActive: Measure<number> = value(round(between(r, 260, 620)));

  if (isToday) {
    const sofar = (steps as { value: number }).value;
    steps = partial(sofar, 10 / 24, 'window_open');
    distanceKm = partial(Number((sofar * 0.00074).toFixed(1)), 10 / 24, 'window_open');
    activeMinutes = partial(round(between(r, 8, 26)), 10 / 24, 'window_open');
    floors = partial(round(between(r, 1, 5)), 10 / 24, 'window_open');
    caloriesActive = partial(round(between(r, 90, 220)), 10 / 24, 'window_open');
  }

  if (sc === 'partial') {
    // orologio spento dalle 13 alle 18: nessun campione, non zero passi
    for (let h = 13; h <= 17; h++) hours[h] = absent('no_samples');
    const seen = hours.reduce((s, m) => s + (m.kind === 'absent' ? 0 : m.kind === 'partial' ? m.value : m.value), 0);
    steps = partial(seen, 19 / 24, 'device_off');
    distanceKm = partial(Number((seen * 0.00074).toFixed(1)), 19 / 24, 'device_off');
    activeMinutes = partial(round(between(r, 18, 46)), 19 / 24, 'device_off');
    floors = absent('source_lacks_type');
    caloriesActive = partial(round(between(r, 200, 420)), 19 / 24, 'device_off');
  }

  if (sc === 'zeros') {
    // giornata sedentaria ma con l'orologio al polso: zeri veri, e una fascia senza campioni
    for (let h = 0; h < 24; h++) hours[h] = value(HOUR_WEIGHT[h] > 3 ? round(HOUR_WEIGHT[h] * 90) : 0);
    hours[15] = absent('no_samples');
    hours[16] = absent('no_samples');
    steps = value(hours.reduce((s, m) => s + (m.kind === 'absent' ? 0 : m.value), 0));
    distanceKm = value(Number((((steps as { value: number }).value) * 0.00074).toFixed(1)));
    activeMinutes = value(0);
    floors = value(0);
    caloriesActive = value(round(between(r, 90, 140)));
  }

  if (sc === 'stale' || sc === 'empty') {
    const reason = sc === 'empty' ? 'no_source' : 'not_synced_yet';
    for (let h = 0; h < 24; h++) hours[h] = absent(reason);
    steps = absent(reason);
    distanceKm = absent(reason);
    activeMinutes = absent(reason);
    floors = absent(reason);
    caloriesActive = absent(reason);
  }

  return {
    steps,
    goalSteps: 10000,
    distanceKm,
    activeMinutes,
    floors,
    caloriesActive,
    hourlySteps: hours,
    stepsSource: sc === 'empty' ? null : WATCH,
  };
}

// ── sonno ───────────────────────────────────────────────────────────────────
function buildSleep(date: string, sc: ScenarioKey): SleepDay {
  if (sc === 'empty') return { night: absent('no_source') };
  if (sc === 'stale') return { night: absent('not_synced_yet') };
  if (sc === 'zeros') return { night: absent('no_samples') }; // orologio non indossato di notte

  const r = rng(`sleep:${date}`);
  const total = round(between(r, 372, 486));
  const bed = new Date(`${date}T00:00:00+02:00`);
  bed.setMinutes(bed.getMinutes() - round(between(r, 55, 130))); // 21:50 - 23:05 del giorno prima
  const wake = new Date(bed.getTime() + total * 60_000);

  const pattern: Array<[SleepStage, number]> = [
    ['light', 0.1], ['deep', 0.16], ['light', 0.1], ['rem', 0.08], ['awake', 0.01],
    ['light', 0.1], ['deep', 0.1], ['light', 0.08], ['rem', 0.1], ['awake', 0.01],
    ['light', 0.08], ['rem', 0.06], ['awake', 0.02],
  ];
  const sum = pattern.reduce((s, [, w]) => s + w, 0);
  let cursor = 0;
  const blocks: SleepBlock[] = pattern.map(([stage, w]) => {
    const len = Math.max(3, round((w / sum) * total));
    const b: SleepBlock = { stage, fromMin: cursor, toMin: Math.min(total, cursor + len) };
    cursor = b.toMin;
    return b;
  });
  blocks[blocks.length - 1].toMin = total;
  const minutes: Record<SleepStage, number> = { awake: 0, rem: 0, light: 0, deep: 0 };
  for (const b of blocks) minutes[b.stage] += b.toMin - b.fromMin;

  const noStages = sc === 'partial';
  return {
    night: value({
      bedtime: bed.toISOString(),
      wakeup: wake.toISOString(),
      totalMinutes: value(total),
      stages: noStages ? absent('source_lacks_type') : value(blocks),
      stageMinutes: noStages ? absent('source_lacks_type') : value(minutes),
      source: WATCH,
    }),
  };
}

// ── cuore ───────────────────────────────────────────────────────────────────
function buildHeart(date: string, sc: ScenarioKey): HeartDay {
  const r = rng(`heart:${date}`);
  const resting = round(between(r, 52, 60));
  const points: HeartPoint[] = [];
  for (let minute = 0; minute < 1440; minute += 10) {
    const h = minute / 60;
    const night = h < 6.5 ? -6 : 0;
    const daytime = h > 7 && h < 22 ? 12 + 6 * Math.sin(((h - 7) / 15) * Math.PI * 2) : 0;
    const bump = h > 17.3 && h < 18.1 ? 62 : 0; // allenamento serale
    points.push({ minute, bpm: round(resting + night + daytime + bump + between(r, -3, 3)) });
  }

  if (sc === 'partial') {
    // buchi: 13:00-18:00 orologio spento, e una finestra breve senza campioni
    for (const p of points) if ((p.minute >= 780 && p.minute < 1080) || (p.minute >= 300 && p.minute < 340)) p.bpm = null;
  }
  if (sc === 'zeros') {
    for (const p of points) if (p.minute < 420) p.bpm = null; // notte non indossato
  }
  if (sc === 'stale' || sc === 'empty') {
    for (const p of points) p.bpm = null;
  }
  const known = points.filter((p) => p.bpm !== null).map((p) => p.bpm as number);
  const hasAny = known.length > 0;
  const reason = sc === 'empty' ? 'no_source' : 'not_synced_yet';

  if (!hasAny) {
    return {
      resting: absent(reason), average: absent(reason), min: absent(reason), max: absent(reason),
      hrvMs: absent(reason), series: points, source: null,
    };
  }
  const covered = known.length / points.length;
  const mk = (n: number): Measure<number> => (covered < 1 ? partial(n, covered, 'device_off') : value(n));
  return {
    resting: value(resting),
    average: mk(round(known.reduce((s, n) => s + n, 0) / known.length)),
    min: mk(Math.min(...known)),
    max: mk(Math.max(...known)),
    hrvMs: sc === 'partial' ? absent('source_lacks_type') : value(round(between(r, 34, 68))),
    series: points,
    source: WATCH,
  };
}

// ── allenamenti ─────────────────────────────────────────────────────────────
function buildWorkouts(date: string, sc: ScenarioKey): WorkoutsDay {
  if (sc === 'empty') return { sessions: absent('no_source') };
  if (sc === 'stale') return { sessions: absent('not_synced_yet') };
  if (sc === 'partial') return { sessions: absent('permission_missing') };
  if (sc === 'zeros') return { sessions: value([]) }; // misurato: nessun allenamento

  const r = rng(`workouts:${date}`);
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const plan: Array<{ type: Workout['type']; title: string; hour: number; dur: number; km: number | null }> = [];
  if (dow === 1 || dow === 4) plan.push({ type: 'run', title: 'Corsa', hour: 18, dur: 42, km: 7.4 });
  if (dow === 3) plan.push({ type: 'strength', title: 'Forza', hour: 19, dur: 55, km: null });
  if (dow === 5) plan.push({ type: 'cycle', title: 'Bicicletta', hour: 17, dur: 63, km: 21.8 });
  if (dow === 6) plan.push({ type: 'walk', title: 'Camminata', hour: 10, dur: 71, km: 5.9 });
  if (dow === 2) plan.push({ type: 'run', title: 'Corsa facile', hour: 18, dur: 31, km: 5.1 });
  const sessions: Workout[] = plan.map((w, i) => ({
    id: `${date}-${i}`,
    type: w.type,
    title: w.title,
    startedAt: `${date}T${String(w.hour).padStart(2, '0')}:${String(round(between(r, 0, 40))).padStart(2, '0')}:00+02:00`,
    durationMin: value(w.dur),
    distanceKm: w.km === null ? absent('source_lacks_type') : value(w.km),
    caloriesKcal: value(round(w.dur * between(r, 7, 10))),
    hrAvg: value(round(between(r, 128, 152))),
    hrMax: value(round(between(r, 164, 182))),
    source: WATCH,
  }));
  return { sessions: value(sessions) };
}

// ── trend ───────────────────────────────────────────────────────────────────
const TREND_BASE: Record<TrendMetric, { lo: number; hi: number }> = {
  steps: { lo: 3800, hi: 13200 },
  sleepMinutes: { lo: 330, hi: 520 },
  restingHr: { lo: 51, hi: 61 },
  activeMinutes: { lo: 12, hi: 88 },
};

function buildTrends(date: string, sc: ScenarioKey): TrendSeries[] {
  const metrics: TrendMetric[] = ['steps', 'sleepMinutes', 'restingHr', 'activeMinutes'];
  return metrics.map((metric) => {
    const days: TrendPoint[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = addDays(date, -i);
      const r = rng(`trend:${metric}:${d}`);
      const { lo, hi } = TREND_BASE[metric];
      let m: Measure<number> = value(round(between(r, lo, hi)));
      if (sc === 'partial') {
        const roll = r();
        if (roll < 0.12) m = absent('no_samples');
        else if (metric === 'activeMinutes' && roll < 0.2) m = value(0); // zero misurato
        else if (roll > 0.94) m = partial(round(between(r, lo, hi) * 0.55), 0.55, 'sync_incomplete');
      }
      if (sc === 'zeros') {
        const roll = r();
        if (metric === 'activeMinutes' && roll < 0.25) m = value(0);
        else if (roll > 0.85) m = absent('no_samples');
      }
      if (sc === 'stale') {
        if (d > '2026-09-21') m = absent('not_synced_yet');
      }
      if (sc === 'empty') m = absent('no_source');
      days.push({ date: d, m });
    }
    return { metric, days };
  });
}

// ── fonti e sync ────────────────────────────────────────────────────────────
function buildSources(sc: ScenarioKey): SourceRow[] {
  if (sc === 'empty') return [];
  const lastSyncAt = sc === 'stale' ? LAST_SYNC_STALE : LAST_SYNC_OK;
  const ok = (type: SourceRow['types'][number]['type'], winning = true): SourceRow['types'][number] => ({ type, status: 'ok', winning });
  const watchTypes: SourceRow['types'] = [
    ok('steps'), ok('heart_rate'), ok('resting_heart_rate'), ok('sleep'), ok('sleep_stages'),
    ok('workouts'), ok('calories'), ok('distance'), ok('hrv'),
  ];
  if (sc === 'partial') {
    const set = (t: string, status: SourceRow['types'][number]['status'], winning = false) => {
      const i = watchTypes.findIndex((x) => x.type === t);
      watchTypes[i] = { type: watchTypes[i].type, status, winning };
    };
    set('sleep_stages', 'not_provided');
    set('hrv', 'not_provided');
    set('workouts', 'permission_missing');
  }
  const phoneTypes: SourceRow['types'] = [
    ok('steps', false), ok('distance', false),
    { type: 'heart_rate', status: 'not_provided', winning: false },
    { type: 'sleep', status: 'not_provided', winning: false },
  ];
  return [
    { ref: WATCH, lastSyncAt, types: watchTypes },
    { ref: PHONE, lastSyncAt, types: phoneTypes },
  ];
}

function buildSync(sc: ScenarioKey): SyncStatus {
  if (sc === 'empty') return { state: 'never', lastSyncAt: null, ageMinutes: null, problem: null };
  if (sc === 'stale') return { state: 'error', lastSyncAt: LAST_SYNC_STALE, ageMinutes: 4295, problem: 'source_unreachable' };
  if (sc === 'partial') return { state: 'partial', lastSyncAt: LAST_SYNC_OK, ageMinutes: 12, problem: 'partial_types' };
  return { state: 'ok', lastSyncAt: LAST_SYNC_OK, ageMinutes: 12, problem: null };
}

function buildSyncLog(sc: ScenarioKey): SyncLogEntry[] {
  if (sc === 'empty') return [];
  const r = rng(`log:${sc}`);
  const times = [
    '2026-09-24T09:28:00+02:00', '2026-09-24T08:58:00+02:00', '2026-09-24T08:28:00+02:00', '2026-09-24T07:58:00+02:00',
    '2026-09-23T22:04:00+02:00', '2026-09-23T21:34:00+02:00', '2026-09-23T21:04:00+02:00', '2026-09-23T20:34:00+02:00',
  ];
  const stale = ['2026-09-21T18:05:00+02:00', '2026-09-21T17:35:00+02:00', '2026-09-21T17:05:00+02:00', '2026-09-21T16:35:00+02:00'];
  const list = (sc === 'stale' ? stale : times).map((at, i): SyncLogEntry => {
    const state: SyncLogEntry['state'] = sc === 'partial' && i < 3 ? 'partial' : i === 5 && sc !== 'stale' ? 'error' : 'ok';
    return {
      at,
      state,
      durationSeconds: state === 'error' ? null : round(between(r, 6, 22)),
      readTypes: state === 'partial' ? 6 : state === 'error' ? 0 : 9,
      failedTypes: state === 'partial' ? 3 : state === 'error' ? 9 : 0,
    };
  });
  return list;
}

// ── ingresso ────────────────────────────────────────────────────────────────
export function buildDashboardData(scenario: ScenarioKey, date: string): DashboardData {
  return {
    date,
    sync: buildSync(scenario),
    sources: buildSources(scenario),
    syncLog: buildSyncLog(scenario),
    activity: buildActivity(date, scenario),
    sleep: buildSleep(date, scenario),
    heart: buildHeart(date, scenario),
    workouts: buildWorkouts(date, scenario),
    trends: buildTrends(date, scenario),
  };
}

export function buildDashboardResult(scenario: ScenarioKey, date: string): DashboardResult {
  if (scenario === 'loading') return { status: 'loading' };
  if (scenario === 'error') return { status: 'error', code: 'fetch_failed' };
  return { status: 'ready', data: buildDashboardData(scenario, date) };
}
