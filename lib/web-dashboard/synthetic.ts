/**
 * Dati SINTETICI per il prototipo della dashboard web. Nessun dato reale.
 *
 * Deterministici: stessa data e stesso scenario, stesso risultato (PRNG con
 * seme). Cosi' gli screenshot sono riproducibili e i test possono asserire.
 *
 * Scenari (vedi ScenarioKey):
 *  - ok       giornata completa, tutte le fonti in ordine
 *  - partial  il dato c'e' ma incompleto: la finestra ricevuta finisce alle 13:00
 *             (`incomplete_coverage`), allenamenti senza righe, buchi nei trend
 *  - zeros    zero MISURATO su una colonna della whitelist (0 passi, 0 metri di
 *             distanza) accanto a dato ASSENTE (notte senza dati, una sessione
 *             senza durata). Mai «zero allenamenti»: senza righe il giorno e'
 *             assente, non zero. Mai zero per i piani (nessuna fonte verificata) ne'
 *             per le ore (uno zero orario e' misurato solo col percorso samsungDiretto:
 *             vedi `hourlyStepsFromRow`). Nota: lo zero dei contatori giornalieri e' una
 *             regola del prototipo, non provata sulle righe reali (from-rows.ts, regola 2).
 *  - stale    ultimo dato ricevuto tre giorni fa: cio' che viene dopo e' assente
 *  - empty    nessun dato ricevuto
 *  - error    il caricamento fallisce
 *  - loading  scheletro
 *
 * Limiti dichiarati (cio' che il server NON puo' provare, vedi lib/dashboard/letture-titolare.ts):
 *  - un parziale nasce solo da una finestra corta (`window_start_ms`, `window_end_ms`) o da righe
 *    senza il campo: mai da un buco interno ne' dalla copertura di una serie intraday;
 *  - il server non distingue «la fonte non fornisce il tipo» da «nessun dato»: un giorno senza
 *    righe e' `no_samples`, mai `source_lacks_type`. `source_lacks_type` resta dimostrabile solo dove la
 *    RIGA lo dice (fasi del sonno con soli `asleep`, HRV di una sorgente iOS); gli usi rimasti qui
 *    (distanza di una sessione) servono solo a mostrare il componente;
 *  - la sorgente scelta per un tipo di dato e il genere del dispositivo NON esistono ne' nel modello ne' nei
 *    dati: il server non ha una colonna che li dica (la scelta la fa l'app a lettura). Restano solo il nome
 *    di una sorgente (vocabolario chiuso) e l'ultimo dato ricevuto;
 *  - il battito e' sintetico a finestre da 10 minuti; i dati reali sono mediane a 5 minuti (`heartSeriesFromRow`)
 *    e minimo e massimo sarebbero estremi di mediane: da rivedere prima di collegare dati reali;
 *  - il fuso per i minuti del giorno del battito non e' dimostrato dal server: l'ipotesi Europe/Rome di
 *    questo prototipo non e' una prova.
 */
import { TZ } from './format';
import {
  absentReasonForDay,
  workoutRowsOf,
  workoutsSessions,
  workoutsWeekFromRows,
  type DayContext,
} from './from-rows';
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
  ReceiptStatus,
  TrendMetric,
  TrendPoint,
  TrendSeries,
  Workout,
  WorkoutsDay,
  WorkoutsWeekDay,
} from './model';

/** «Ora» dell'anteprima: fissa, cosi' nulla dipende dall'orologio di chi guarda. */
export const SYNTHETIC_NOW = '2026-09-24T09:40:00+02:00';
export const SYNTHETIC_TODAY = '2026-09-24';
/** Giorno mostrato di default: ieri, una giornata completa. */
export const DEFAULT_DAY = '2026-09-23';
const LAST_RECEIVED_OK = '2026-09-24T09:28:00+02:00';
const LAST_RECEIVED_STALE = '2026-09-21T18:05:00+02:00';
const LAST_RECEIVED_STALE_DAY = '2026-09-21';

/** Le sorgenti sintetiche: nomi del vocabolario chiuso, mai un dispositivo (vedi model.ts, SOURCE_IDS). */
export const HEALTH_CONNECT: SourceRef = { id: 'health_connect' };
export const RING: SourceRef = { id: 'ring' };

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
/** Scenario partial: la finestra ricevuta finisce a quest'ora (13:00), poi non e' arrivato nulla. */
const PARTIAL_WINDOW_END_HOUR = 13;

function buildActivity(date: string, sc: ScenarioKey): ActivityDay {
  const r = rng(`activity:${date}`);
  const target = round(between(r, 6200, 11800));
  const isToday = date === SYNTHETIC_TODAY;
  const nowHour = 9; // «ora» sintetica 09:40

  const totalWeight = HOUR_WEIGHT.reduce((s, w) => s + w, 0);
  const hours: Measure<number>[] = HOUR_WEIGHT.map((w, h) => {
    if (isToday && h > nowHour) return absent('not_yet');
    if (isToday && h === nowHour) return partial(round((w / totalWeight) * target * 0.6), 0.67, 'window_open');
    return value(round((w / totalWeight) * target * between(r, 0.85, 1.15)));
  });

  let steps: Measure<number> = value(hours.reduce((s, m) => s + (m.kind === 'absent' ? 0 : m.value), 0));
  let distanceKm: Measure<number> = value(Number((((steps as { value: number }).value) * 0.00074).toFixed(1)));
  // I piani (`floors_climbed`) NON hanno una fonte verificata (somma senza dedup di origine, unita' diverse
  // fra Health Connect e HealthKit): fuori whitelist, e quindi fuori dal modello e dalla dashboard.
  let caloriesActive: Measure<number> = value(round(between(r, 260, 620)));

  if (isToday) {
    const sofar = (steps as { value: number }).value;
    steps = partial(sofar, 10 / 24, 'window_open');
    distanceKm = partial(Number((sofar * 0.00074).toFixed(1)), 10 / 24, 'window_open');
    caloriesActive = partial(round(between(r, 90, 220)), 10 / 24, 'window_open');
  }

  if (sc === 'partial') {
    // La finestra ricevuta finisce alle 13:00 (finestra CORTA: e' cio' che il server vede in
    // `window_start_ms`/`window_end_ms`). Le ore dopo la fine della finestra non sono arrivate:
    // assenti, non zero passi.
    for (let h = PARTIAL_WINDOW_END_HOUR; h < 24; h++) hours[h] = absent('no_samples');
    const seen = hours.reduce((s, m) => s + (m.kind === 'absent' ? 0 : m.value), 0);
    const cover = PARTIAL_WINDOW_END_HOUR / 24;
    steps = partial(seen, cover, 'incomplete_coverage');
    distanceKm = partial(Number((seen * 0.00074).toFixed(1)), cover, 'incomplete_coverage');
    caloriesActive = partial(round(between(r, 120, 260)), cover, 'incomplete_coverage');
  }

  if (sc === 'zeros') {
    // Lo zero misurato sta su colonne della whitelist (`steps`, `distance_meters`): una riga esiste
    // e dice 0. Le ore vengono da `intraday_steps` (fuori whitelist): nessuna ora e' uno zero
    // misurato.
    for (let h = 0; h < 24; h++) hours[h] = absent('no_samples');
    steps = value(0);
    distanceKm = value(0);
    caloriesActive = value(round(between(r, 90, 140)));
  }

  if (sc === 'stale' || sc === 'empty') {
    const reason = sc === 'empty' ? 'no_data_received' : 'not_synced_yet';
    for (let h = 0; h < 24; h++) hours[h] = absent(reason);
    steps = absent(reason);
    distanceKm = absent(reason);
    caloriesActive = absent(reason);
  }

  return {
    steps,
    goalSteps: 10000,
    distanceKm,
    caloriesActive,
    hourlySteps: hours,
  };
}

// ── sonno ───────────────────────────────────────────────────────────────────
function buildSleep(date: string, sc: ScenarioKey): SleepDay {
  if (sc === 'empty') return { night: absent('no_data_received') };
  if (sc === 'stale') return { night: absent('not_synced_yet') };
  if (sc === 'zeros') return { night: absent('no_samples') }; // nessun campione di sonno per la notte

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
    // la finestra ricevuta finisce alle 13:00: dopo, nessun campione (nessun buco interno)
    for (const p of points) if (p.minute >= PARTIAL_WINDOW_END_HOUR * 60) p.bpm = null;
  }
  if (sc === 'zeros') {
    for (const p of points) if (p.minute < 420) p.bpm = null; // nessun campione fino alle 07:00
  }
  if (sc === 'stale' || sc === 'empty') {
    for (const p of points) p.bpm = null;
  }
  const known = points.filter((p) => p.bpm !== null).map((p) => p.bpm as number);
  const hasAny = known.length > 0;
  const reason = sc === 'empty' ? 'no_data_received' : 'not_synced_yet';

  if (!hasAny) {
    return {
      resting: absent(reason), average: absent(reason),
      hrvMs: absent(reason), series: points,
    };
  }
  // Il parziale nasce dalla finestra corta (scenario partial), non dalla copertura dei punti della serie intraday.
  const cover = PARTIAL_WINDOW_END_HOUR / 24;
  const mk = (n: number): Measure<number> => (sc === 'partial' ? partial(n, cover, 'incomplete_coverage') : value(n));
  return {
    resting: value(resting),
    average: mk(round(known.reduce((s, n) => s + n, 0) / known.length)),
    hrvMs: sc === 'partial' ? absent('source_lacks_type') : value(round(between(r, 34, 68))),
    series: points,
  };
}

// ── allenamenti ─────────────────────────────────────────────────────────────
/** «Ora» dell'anteprima come frazione del giorno: la finestra di oggi e' aperta. */
const TODAY_FRACTION = (9 * 60 + 40) / 1440;

/**
 * Cio' che il server sa per dire perche' un giorno senza righe manca: il giorno
 * dell'ultimo `received_at` e l'ora. Non sa dire se la fonte «non fornisce il tipo»:
 * un giorno senza righe prima dell'ultimo dato e' sempre `no_samples`.
 */
function dayContext(sc: ScenarioKey): DayContext {
  return {
    today: SYNTHETIC_TODAY,
    todayFraction: TODAY_FRACTION,
    lastReceivedDay: sc === 'empty' ? null : sc === 'stale' ? LAST_RECEIVED_STALE_DAY : SYNTHETIC_TODAY,
    timeZone: TZ,
  };
}

/**
 * Le righe di `workouts` di un giorno. Un giorno senza allenamenti ha ZERO righe:
 * non esiste una riga «nessun allenamento». Gli scenari che mostrano il caso
 * difficile (una sessione da 0 minuti, una sessione senza durata) lo fanno con
 * righe vere, come le scriverebbe il server.
 */
function plannedWorkouts(day: string, sc: ScenarioKey, anchor: string): Workout[] {
  if (sc === 'empty' || sc === 'partial') return []; // nessuna riga di allenamenti
  if (sc === 'stale' && day > LAST_RECEIVED_STALE_DAY) return [];
  if (sc === 'zeros' && day === anchor) return [];

  const r = rng(`workouts:${day}`);
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
  const plan: Array<{ type: Workout['type']; hour: number; dur: number; km: number | null }> = [];
  if (dow === 1 || dow === 4) plan.push({ type: 'run', hour: 18, dur: 42, km: 7.4 });
  if (dow === 3) plan.push({ type: 'strength', hour: 19, dur: 55, km: null });
  if (dow === 5) plan.push({ type: 'cycle', hour: 17, dur: 63, km: 21.8 });
  if (dow === 6) plan.push({ type: 'walk', hour: 10, dur: 71, km: 5.9 });
  if (dow === 2) plan.push({ type: 'run', hour: 18, dur: 31, km: 5.1 });
  const sessions: Workout[] = plan.map((w, i) => ({
    id: `${day}-${i}`,
    type: w.type,
    startedAt: `${day}T${String(w.hour).padStart(2, '0')}:${String(round(between(r, 0, 40))).padStart(2, '0')}:00+02:00`,
    durationMin: value(w.dur),
    distanceKm: w.km === null ? absent('source_lacks_type') : value(w.km),
    caloriesKcal: value(round(w.dur * between(r, 7, 10))),
    hrAvg: value(round(between(r, 128, 152))),
  }));

  if (sc === 'zeros') {
    if (day === addDays(anchor, -1)) {
      // una riga di allenamento esiste ma non porta la durata (assente, oppure 0, che non e' provato
      // dalla fonte): «durata non ricevuta», mai uno zero misurato. Il giorno ha il numero, non la durata.
      return [
        {
          id: `${day}-stop`,
          type: 'strength',
          startedAt: `${day}T19:05:00+02:00`,
          durationMin: absent('no_samples'),
          distanceKm: absent('source_lacks_type'),
          caloriesKcal: value(0),
          hrAvg: absent('no_samples'),
        },
      ];
    }
    if (day === addDays(anchor, -2)) {
      // due sessioni, una senza durata: la somma e' PARZIALE, la sessione senza durata non vale 0
      return [
        {
          id: `${day}-a`,
          type: 'run',
          startedAt: `${day}T07:30:00+02:00`,
          durationMin: value(38),
          distanceKm: value(6.2),
          caloriesKcal: value(310),
          hrAvg: value(141),
        },
        {
          id: `${day}-b`,
          type: 'walk',
          startedAt: `${day}T18:40:00+02:00`,
          durationMin: absent('no_samples'),
          distanceKm: absent('no_samples'),
          caloriesKcal: absent('no_samples'),
          hrAvg: absent('no_samples'),
        },
      ];
    }
  }
  // oggi un allenamento che comincia dopo «adesso» non e' ancora avvenuto
  return day === SYNTHETIC_TODAY ? sessions.filter((w) => Date.parse(w.startedAt) <= Date.parse(SYNTHETIC_NOW)) : sessions;
}

function buildWorkouts(date: string, sc: ScenarioKey): WorkoutsDay {
  const ctx = dayContext(sc);
  const list = plannedWorkouts(date, sc, date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 6));
  const rows = days.flatMap((d) => workoutRowsOf(plannedWorkouts(d, sc, date)));
  const week: WorkoutsWeekDay[] = workoutsWeekFromRows(rows, days, ctx);
  return { sessions: workoutsSessions(list, absentReasonForDay(date, ctx)), week };
}

// ── trend ───────────────────────────────────────────────────────────────────
const TREND_BASE: Record<TrendMetric, { lo: number; hi: number }> = {
  steps: { lo: 3800, hi: 13200 },
  sleepMinutes: { lo: 330, hi: 520 },
  restingHr: { lo: 51, hi: 61 },
};

function buildTrends(date: string, sc: ScenarioKey): TrendSeries[] {
  const metrics: TrendMetric[] = ['steps', 'sleepMinutes', 'restingHr'];
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
        else if (metric === 'steps' && roll < 0.2) m = value(0); // zero misurato
        else if (metric === 'steps' && roll > 0.94) m = partial(round(between(r, lo, hi) * 0.55), 0.55, 'incomplete_coverage');
      }
      if (sc === 'zeros') {
        const roll = r();
        if (metric === 'steps' && roll < 0.25) m = value(0);
        else if (roll > 0.85) m = absent('no_samples');
      }
      if (sc === 'stale') {
        if (d > '2026-09-21') m = absent('not_synced_yet');
      }
      if (sc === 'empty') m = absent('no_data_received');
      days.push({ date: d, m });
    }
    return { metric, days };
  });
}

// ── fonti ────────────────────────────────────────────────────────────
// Solo l'id del vocabolario chiuso e l'ultimo dato ricevuto. Nessun elenco dei tipi per sorgente,
// nessuna sorgente scelta per un tipo, nessun genere di dispositivo: il server non li sa (vedi model.ts).
function buildSources(sc: ScenarioKey): SourceRow[] {
  if (sc === 'empty') return [];
  const lastReceivedAt = sc === 'stale' ? LAST_RECEIVED_STALE : LAST_RECEIVED_OK;
  return [
    { ref: HEALTH_CONNECT, lastReceivedAt },
    { ref: RING, lastReceivedAt },
  ];
}

function buildReceipt(sc: ScenarioKey): ReceiptStatus {
  if (sc === 'empty') return { lastReceivedAt: null, ageMinutes: null };
  if (sc === 'stale') return { lastReceivedAt: LAST_RECEIVED_STALE, ageMinutes: 4295 };
  return { lastReceivedAt: LAST_RECEIVED_OK, ageMinutes: 12 };
}

// ── ingresso ────────────────────────────────────────────────────────────────
export function buildDashboardData(scenario: ScenarioKey, date: string): DashboardData {
  return {
    date,
    receipt: buildReceipt(scenario),
    sources: buildSources(scenario),
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
