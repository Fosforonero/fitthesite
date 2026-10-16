/**
 * Contratto dei dati per i componenti grafici della dashboard web.
 *
 * Principi architetturali (SPRINT DASHBOARD-CHARTS-01):
 *  1. Dati dimostrativi: i punti dimostrativi sono puramente sintetici e deterministici.
 *  2. Distinzione degli stati:
 *     - measured: valore valido presente (> 0);
 *     - measured-zero: valore zero misurato dalla sorgente (es. 0 passi effettivi);
 *     - partial: dato presente ma incompleto (copertura parziale con nota esplicita);
 *     - absent: nessun dato ricevuto per l'intervallo (buco temporale);
 *     - error: errore di lettura o dato non disponibile;
 *     - received: valore ricevuto (> 0) senza evidenza di giornata completa e senza copertura;
 *     - ambiguous: piu' righe per lo stesso giorno, nessun valore scelto (value null);
 *     - undetermined: zero grezzo senza evidenza del suo significato (value null, mai 0);
 *     - placeholder: segnaposto della sorgente (value null).
 *  3. Nessuna interpolazione arbitraria: gli intervalli senza dati NON vengono
 *     collegati da linee continue.
 *  4. Accessibilita': tooltip navigabili da tastiera e touch, tabelle dati alternative,
 *     e nessuna informazione affidata al solo colore.
 */

export type ChartSlotState =
  | 'measured'
  | 'measured-zero'
  | 'partial'
  | 'absent'
  | 'error'
  | 'received'
  | 'ambiguous'
  | 'undetermined'
  | 'placeholder';

/** Stati che non portano mai un valore: value e' sempre null, mai 0. */
export type ChartNullSlotState = 'absent' | 'error' | 'ambiguous' | 'undetermined' | 'placeholder';

/** Testi sostitutivi passati dal chiamante: il kit non li duplica, li usa al posto dei propri. */
export type ChartStateTexts = Partial<Record<ChartSlotState, string>>;

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
  /** Nome del fuso orario a cui si riferiscono le date della serie (identificatore IANA). */
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
  /**
   * Scelta ESPLICITA al confine fra dati reali (false) e dimostrativi/fixture (true). Obbligatoria: nessun default,
   * nessuna scelta implicita in nessuna direzione. Un valore non booleano e' rifiutato a runtime dal kit.
   */
  isDemo: boolean;
  /** Etichette di stato del chiamante (sostituiscono quelle del kit, per stato). */
  stateLabels?: ChartStateTexts;
  /** Testo mostrato al posto del valore per gli stati senza valore (per stato). */
  valueLabels?: ChartStateTexts;
}

export interface DailyStepsChartProps extends BaseChartProps {
  /** Obiettivo giornaliero passi (opzionale). */
  goalSteps?: number;
  /** Riepilogo accessibile del chiamante: se presente sostituisce quello generato. */
  summaryText?: string;
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
