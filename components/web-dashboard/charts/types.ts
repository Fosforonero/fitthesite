/**
 * Contratto dei dati per i componenti grafici della dashboard web.
 *
 * Principi architetturali (SPRINT DASHBOARD-CHARTS-01):
 *  1. Dati dimostrativi: le fixture sono puramente sintetiche e deterministiche.
 *  2. Distinzione degli stati:
 *     - measured: valore valido presente (> 0);
 *     - measured-zero: valore zero misurato dalla sorgente (es. 0 passi effettivi);
 *     - partial: dato presente ma incompleto (copertura parziale con nota esplicita);
 *     - absent: nessun dato ricevuto per l'intervallo (buco temporale);
 *     - error: errore di lettura o dato non disponibile.
 *  3. Nessuna interpolazione arbitraria: gli intervalli senza dati NON vengono
 *     collegati da linee continue.
 *  4. Accessibilita': tooltip navigabili da tastiera e touch, tabelle dati alternative,
 *     e nessuna informazione affidata al solo colore.
 */

export type ChartSlotState = 'measured' | 'measured-zero' | 'partial' | 'absent' | 'error';

export type ChartPeriod = 7 | 30;

export interface ChartDataPoint {
  /** Data di riferimento ISO YYYY-MM-DD. */
  date: string;
  /** Valore numerico misurato, oppure null se assente/errore. */
  value: number | null;
  /** Stato del dato per il punto temporale. */
  state: ChartSlotState;
  /** Percentuale di copertura (0..1) per dati parziali. */
  coverage?: number;
  /** Spiegazione testuale del dato parziale (es. 'Finestra incompleta'). */
  partialNote?: string;
  /** Causa dell'assenza (es. 'Nessun campione', 'Non ancora sincronizzato'). */
  absentReason?: string;
  /** Timestamp opzionale di raccolta ISO 8601. */
  collectedAt?: string;
}

export interface ChartSeriesMetadata {
  metric: 'steps' | 'heart_rate' | 'sleep_duration';
  title: string;
  unit: string;
  /** Fuso orario della serie (es. Europe/Rome). */
  timezone: string;
  /** Flag esplicito per dati dimostrativi sintetici. */
  isDemo: boolean;
  /** Obiettivo giornaliero raccomandato o impostato dall'utente (opzionale). */
  goal?: number;
}

export interface BaseChartProps {
  id: string;
  title: string;
  subtitle?: string;
  points: ChartDataPoint[];
  period: ChartPeriod;
  locale: string;
  className?: string;
  /** Etichetta personalizzata per la tabella dati alternativa. */
  tableLabel?: string;
  /** Flag esplicito per indicare fixture dimostrativa (default: true). */
  isDemo?: boolean;
}

export interface DailyStepsChartProps extends BaseChartProps {
  /** Obiettivo giornaliero passi (opzionale). */
  goalSteps?: number;
}

export interface HeartRateChartProps extends BaseChartProps {
  /** Valore medio o a riposo di riferimento in bpm (opzionale). */
  referenceHr?: number;
}

export interface SleepDurationChartProps extends BaseChartProps {
  /** Obiettivo sonno in minuti (opzionale). */
  goalMinutes?: number;
}

export interface PeriodSelectorProps {
  currentPeriod: ChartPeriod;
  onSelectPeriod?: (period: ChartPeriod) => void;
  locale: string;
  className?: string;
  /** Opzionale: URL generator per navigazione link in SSR / Next.js. */
  hrefForPeriod?: (period: ChartPeriod) => string;
}
