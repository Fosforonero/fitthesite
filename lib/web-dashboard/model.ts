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

/**
 * Le sorgenti che il server sa NOMINARE: un vocabolario chiuso ricavato dalla colonna `source`
 * (vedi `sourceIdOf` in lib/web-dashboard/from-rows.ts). Tutto cio' che non e' nella tabella,
 * compreso un nome di persona scritto in `source`, e' `other`.
 *
 * Il server NON sa quale sorgente «vince» per un tipo di dato (la scelta la fa l'app a lettura,
 * con prove di provenienza e copertura che il web non ha) e NON sa se una sorgente e' un orologio
 * o un telefono: `health_connect` e `healthkit` sono archivi di piattaforma, che contengono
 * qualunque dispositivo. L'unico genere dimostrabile e' l'anello, perche' `colmi_ble` lo scrive solo
 * il percorso Bluetooth dell'anello. Per questo qui non esiste ne' la sorgente scelta per un tipo di
 * dato ne' un «genere del dispositivo» (decisione del 29/09/2026).
 */
export const SOURCE_IDS = ['health_connect', 'healthkit', 'ring', 'strava', 'oura', 'suunto', 'other'] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

export interface SourceRef {
  id: SourceId;
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

/**
 * Una sorgente: SOLO l'etichetta del vocabolario chiuso (dall'id) e l'ultimo dato ricevuto.
 * Nessun elenco dei tipi di dato per sorgente, nessuna sorgente scelta per un tipo di dato.
 */
export interface SourceRow {
  ref: SourceRef;
  /** Ultimo dato ricevuto da questa sorgente; `null` se non e' mai arrivato nulla. */
  lastReceivedAt: string | null;
}

// Nessuna cronologia delle ricezioni: `fitness_metrics.received_at` e' sovrascritto a ogni
// invio (upsert su utente, dispositivo, sorgente e giorno) e `sync_events` e' vuota e non
// e' letta dalla dashboard. Il server sa solo QUANDO e' arrivato l'ULTIMO dato, per sorgente.

// ── Passi e attivita' ───────────────────────────────────────────────────────
export interface ActivityDay {
  steps: Measure<number>;
  goalSteps: number;
  distanceKm: Measure<number>;
  caloriesActive: Measure<number>;
  /**
   * 24 slot orari (00-23), derivati da `intraday_steps` con `hourlyStepsFromRow`: misurato, parziale o
   * assente. Lo zero misurato esiste solo dove la riga lo prova; mai «vuoto = 0».
   */
  hourlySteps: Measure<number>[];
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
}

export interface SleepDay {
  /** `absent` se non c'e' una notte per il giorno: NON e' «0 ore dormite». */
  night: Measure<SleepNight>;
}

// ── Cuore ───────────────────────────────────────────────────────────────────
export interface HeartPoint {
  /**
   * Minuto del giorno (0-1439). Il prototipo sintetico usa finestre da 10 minuti; i dati reali arrivano come
   * MEDIANE a 5 minuti (`heartSeriesFromRow`), quindi minimo e massimo di questa serie non sono estremi veri.
   */
  minute: number;
  /** `null` = nessun campione in quella finestra (buco, non 0 bpm). */
  bpm: number | null;
}

export interface HeartDay {
  resting: Measure<number>;
  average: Measure<number>;
  hrvMs: Measure<number>;
  series: HeartPoint[];
}

// ── Allenamenti ─────────────────────────────────────────────────────────────
export type WorkoutType = 'run' | 'walk' | 'cycle' | 'strength' | 'swim' | 'other';

export interface Workout {
  id: string;
  type: WorkoutType;
  /** ISO 8601. */
  startedAt: string;
  durationMin: Measure<number>;
  distanceKm: Measure<number>;
  caloriesKcal: Measure<number>;
  hrAvg: Measure<number>;
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
