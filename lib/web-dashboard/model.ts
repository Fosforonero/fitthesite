/**
 * Modello dati della dashboard web (PROTOTIPO, dati sintetici).
 *
 * Ogni valore che puo' mancare e' una `Measure` (lib/web-dashboard/measure.ts):
 * zero misurato, dato parziale e dato assente sono tre stati distinti, e nessun
 * componente deve tradurre `absent` in 0. Le serie con buchi usano `null` per
 * il buco (mai 0).
 *
 * Nulla qui e' collegato a metriche reali: i dati arrivano solo da
 * lib/web-dashboard/synthetic.ts.
 */
import type { Measure } from './measure';

export type Via = 'health_connect' | 'healthkit' | 'ble';
export type SourceKind = 'watch' | 'phone' | 'ring';

export interface SourceRef {
  id: string;
  /** Nome mostrato, come lo chiama l'app (es. «Galaxy Watch»). */
  label: string;
  kind: SourceKind;
  via: Via;
}

/**
 * Ultimo dato ricevuto dal server. Il server conosce solo QUANDO e' arrivato un
 * dato (`received_at`), non come e' andato il singolo sync sul telefono: nessun
 * esito, nessun motivo, nessuna durata (decisione 26 del 29/09).
 */
export interface ReceiptStatus {
  /** ISO 8601, `null` se non e' mai arrivato nessun dato. */
  lastReceivedAt: string | null;
  /** Riferimento dell'anteprima: minuti dall'ultimo dato ricevuto a «ora sintetica». */
  ageMinutes: number | null;
}

export type DataTypeKey =
  | 'steps'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'sleep'
  | 'sleep_stages'
  | 'workouts'
  | 'calories'
  | 'distance'
  | 'hrv';

/**
 * Stato di un tipo di dato per una fonte, come lo puo' sapere il server: ha
 * ricevuto dati, non ne ha ricevuti, la fonte non fornisce il tipo. Permessi e
 * letture fallite restano sul dispositivo: il server non li possiede, quindi non
 * esistono ne' qui ne' nella copy.
 */
export interface SourceTypeStatus {
  type: DataTypeKey;
  status: 'ok' | 'no_data' | 'not_provided';
  /** Questa fonte e' quella vincente per il tipo (FitMesh ne sceglie una, non somma). */
  winning: boolean;
}

export interface SourceRow {
  ref: SourceRef;
  /** Ultimo dato ricevuto da questa fonte; `null` se non e' mai arrivato nulla. */
  lastReceivedAt: string | null;
  types: SourceTypeStatus[];
}

// Nessuna cronologia delle ricezioni: `fitness_metrics.received_at` e' sovrascritto a ogni
// invio (upsert su utente, dispositivo, sorgente e giorno) e `sync_events` e' vuota e non
// e' letta dalla dashboard. Il server sa solo QUANDO e' arrivato l'ULTIMO dato, per sorgente.

// ── Passi e attivita' ───────────────────────────────────────────────────────
export interface ActivityDay {
  steps: Measure<number>;
  goalSteps: number;
  distanceKm: Measure<number>;
  floors: Measure<number>;
  caloriesActive: Measure<number>;
  /** 24 slot orari (00-23): misurato (anche 0), parziale o assente, mai «vuoto = 0». */
  hourlySteps: Measure<number>[];
  /** Fonte vincente per i passi del giorno (FitMesh non somma piu' fonti). */
  stepsSource: SourceRef | null;
}

// ── Sonno ───────────────────────────────────────────────────────────────────
export type SleepStage = 'awake' | 'rem' | 'light' | 'deep';

export interface SleepBlock {
  stage: SleepStage;
  /** Minuti dall'inizio della notte. */
  fromMin: number;
  toMin: number;
}

export interface SleepNight {
  /** ISO 8601. */
  bedtime: string;
  wakeup: string;
  totalMinutes: Measure<number>;
  /** Assente se la fonte non fornisce le fasi: il totale puo' esserci lo stesso. */
  stages: Measure<SleepBlock[]>;
  stageMinutes: Measure<Record<SleepStage, number>>;
  source: SourceRef;
}

export interface SleepDay {
  /** `absent` se non c'e' una notte per il giorno: NON e' «0 ore dormite». */
  night: Measure<SleepNight>;
}

// ── Cuore ───────────────────────────────────────────────────────────────────
export interface HeartPoint {
  /** Minuto del giorno (0-1439), campionamento a 10 minuti. */
  minute: number;
  /** `null` = nessun campione in quella finestra (buco, non 0 bpm). */
  bpm: number | null;
}

export interface HeartDay {
  resting: Measure<number>;
  average: Measure<number>;
  min: Measure<number>;
  max: Measure<number>;
  hrvMs: Measure<number>;
  series: HeartPoint[];
  source: SourceRef | null;
}

// ── Allenamenti ─────────────────────────────────────────────────────────────
export type WorkoutType = 'run' | 'walk' | 'cycle' | 'strength' | 'swim' | 'other';

export interface Workout {
  id: string;
  type: WorkoutType;
  title: string;
  /** ISO 8601. */
  startedAt: string;
  durationMin: Measure<number>;
  distanceKm: Measure<number>;
  caloriesKcal: Measure<number>;
  hrAvg: Measure<number>;
  hrMax: Measure<number>;
  source: SourceRef;
}

/**
 * Un giorno del riquadro settimanale, derivato SOLO dalle righe di `workouts`
 * (`start_ms`, `duration_min`), vedi lib/web-dashboard/from-rows.ts.
 */
export interface WorkoutsWeekDay {
  /** YYYY-MM-DD, giorno locale. */
  date: string;
  /** Numero di allenamenti ricevuti. Mai 0: senza righe il giorno e' assente. */
  count: Measure<number>;
  /** Durata totale. Zero solo se una riga esistente dice `duration_min = 0`. */
  durationMin: Measure<number>;
}

export interface WorkoutsDay {
  /**
   * Il server non ha un campo che provi «ho letto e non c'erano allenamenti»: una
   * lista vuota NON e' uno zero misurato, e' `absent` («nessun dato ricevuto»).
   * `value` contiene sempre almeno una sessione (costruttore: `workoutsSessions`).
   */
  sessions: Measure<Workout[]>;
  /** Gli ultimi 7 giorni che finiscono nel giorno mostrato, dal piu' vecchio. */
  week: WorkoutsWeekDay[];
}

// ── Trend ───────────────────────────────────────────────────────────────────
export type TrendMetric = 'steps' | 'sleepMinutes' | 'restingHr';

export interface TrendPoint {
  /** YYYY-MM-DD. */
  date: string;
  m: Measure<number>;
}

export interface TrendSeries {
  metric: TrendMetric;
  /** Piu' recente per ultimo, 90 giorni. */
  days: TrendPoint[];
}

// ── Insieme ─────────────────────────────────────────────────────────────────
export interface DashboardData {
  /** Giorno mostrato (YYYY-MM-DD). */
  date: string;
  receipt: ReceiptStatus;
  sources: SourceRow[];
  activity: ActivityDay;
  sleep: SleepDay;
  heart: HeartDay;
  workouts: WorkoutsDay;
  trends: TrendSeries[];
}

export type ScenarioKey = 'ok' | 'partial' | 'zeros' | 'stale' | 'empty' | 'error' | 'loading';

export const SCENARIO_KEYS: readonly ScenarioKey[] = ['ok', 'partial', 'zeros', 'stale', 'empty', 'error', 'loading'];

/** Cio' che la pagina riceve dallo strato dati (sintetico). */
export type DashboardResult =
  | { status: 'loading' }
  | { status: 'error'; code: 'fetch_failed' | 'timeout' }
  | { status: 'ready'; data: DashboardData };

export const SCREENS = ['overview', 'activity', 'sleep', 'heart', 'workouts', 'trends', 'sources'] as const;
export type ScreenKey = (typeof SCREENS)[number];
