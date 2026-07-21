/**
 * FitMesh Labs: motore di calcolo Efficienza del Sonno.
 *
 * Puro TypeScript, zero dipendenze da DOM/rete/storage: input -> output,
 * nessun side effect. Stesso vincolo di lib/labs/hrv/rmssd-math.ts: mai
 * importare next/react/rete/storage da questo file.
 *
 * Definizione operativa adottata (fonte primaria): AASM Manual for the
 * Scoring of Sleep and Associated Events + letteratura di actigrafia clinica
 * - Sleep Efficiency (%) = Total Sleep Time / Time in Bed × 100. Se altre
 * fonti usano definizioni leggermente diverse (es. alcuni wearable
 * consumer includono/escludono la latenza in modo diverso), questo modulo
 * dichiara esplicitamente la propria: TST = TIB − latenza di addormentamento
 * − tempo sveglio durante la notte (WASO) − tempo sveglio dopo il risveglio
 * finale (prima di alzarsi). Vedi content.ts per la citazione completa.
 *
 * P1.1B Fase 3: niente correzione silenziosa e niente clamp. Un input
 * fisiologicamente/matematicamente impossibile (tempo dormito che supera il
 * tempo a letto, tempo di sonno derivato negativo, minuti fuori 0-59, orari
 * fuori range) è un ERRORE BLOCCANTE: nessun risultato, nessun grafico,
 * nessuna copia/CSV. Solo valori insoliti ma possibili (tempo a letto molto
 * corto/lungo) restano un warning non bloccante - stessa filosofia di
 * rmssd-math.ts con gli outlier, ma con la soglia di "impossibile" spostata
 * da warning a errore rispetto alla prima versione di questo modulo.
 */

export const MINUTES_PER_DAY = 1440;

// ── Modalità semplice ──────────────────────────────────────────────────

export interface SimpleModeInput {
  mode: "simple";
  timeInBedMinutes: number;
  totalSleepTimeMinutes: number;
}

// ── Modalità avanzata ───────────────────────────────────────────────────

/**
 * `bedMinutes`/`outOfBedMinutes`: minuti dalla mezzanotte (0-1439), non
 * date reali - la UI converte un orario 12h/24h in questo formato interno
 * prima di chiamare il motore. Nessuna data di calendario è mai usata, quindi
 * non ci sono implicazioni di cambio ora legale (DST): l'attraversamento
 * della mezzanotte è gestito come aritmetica di durata (+24h se l'uscita dal
 * letto è "prima" dell'ora di andare a letto), non come sottrazione fra
 * timestamp di calendario.
 */
export interface AdvancedModeInput {
  mode: "advanced";
  bedMinutes: number;
  outOfBedMinutes: number;
  sleepOnsetLatencyMinutes: number;
  wakeAfterSleepOnsetMinutes: number;
  finalWakeMinutes: number;
}

export type SleepEfficiencyInput = SimpleModeInput | AdvancedModeInput;

// ── Validazione ───────────────────────────────────────────────────────

export type SleepEfficiencyValidationError =
  | { code: "MISSING_FIELD"; field: string }
  | { code: "NOT_A_NUMBER"; field: string }
  | { code: "NEGATIVE_VALUE"; field: string }
  | { code: "TIME_OUT_OF_RANGE"; field: string }
  | { code: "MINUTES_OUT_OF_RANGE"; field: string }
  | { code: "TIME_IN_BED_ZERO"; field: "bedMinutes" | "timeInBedMinutes" }
  | { code: "SLEEP_EXCEEDS_TIME_IN_BED" }
  | { code: "NEGATIVE_DERIVED_SLEEP_TIME" }
  | { code: "EFFICIENCY_OUT_OF_RANGE" };

function isMissingOrNaN(v: unknown): v is undefined {
  return v === undefined || v === null || (typeof v === "number" && Number.isNaN(v));
}

function validateNonNegative(field: string, value: number, errors: SleepEfficiencyValidationError[]) {
  if (isMissingOrNaN(value)) {
    errors.push({ code: "MISSING_FIELD", field });
    return;
  }
  if (!Number.isFinite(value)) {
    errors.push({ code: "NOT_A_NUMBER", field });
    return;
  }
  if (value < 0) {
    errors.push({ code: "NEGATIVE_VALUE", field });
  }
}

function validateTimeOfDay(field: string, value: number, errors: SleepEfficiencyValidationError[]) {
  if (isMissingOrNaN(value)) {
    errors.push({ code: "MISSING_FIELD", field });
    return;
  }
  if (!Number.isFinite(value)) {
    errors.push({ code: "NOT_A_NUMBER", field });
    return;
  }
  if (value < 0 || value >= MINUTES_PER_DAY) {
    errors.push({ code: "TIME_OUT_OF_RANGE", field });
  }
}

export function validateSleepEfficiencyInput(input: SleepEfficiencyInput): SleepEfficiencyValidationError[] {
  const errors: SleepEfficiencyValidationError[] = [];

  if (input.mode === "simple") {
    validateNonNegative("timeInBedMinutes", input.timeInBedMinutes, errors);
    validateNonNegative("totalSleepTimeMinutes", input.totalSleepTimeMinutes, errors);
    if (errors.length === 0 && input.timeInBedMinutes === 0) {
      errors.push({ code: "TIME_IN_BED_ZERO", field: "timeInBedMinutes" });
    }
    // Impossibile fisiologicamente: bloccante, non un warning (P1.1B Fase 3).
    if (errors.length === 0 && input.totalSleepTimeMinutes > input.timeInBedMinutes) {
      errors.push({ code: "SLEEP_EXCEEDS_TIME_IN_BED" });
    }
    return errors;
  }

  validateTimeOfDay("bedMinutes", input.bedMinutes, errors);
  validateTimeOfDay("outOfBedMinutes", input.outOfBedMinutes, errors);
  validateNonNegative("sleepOnsetLatencyMinutes", input.sleepOnsetLatencyMinutes, errors);
  validateNonNegative("wakeAfterSleepOnsetMinutes", input.wakeAfterSleepOnsetMinutes, errors);
  validateNonNegative("finalWakeMinutes", input.finalWakeMinutes, errors);

  // Orari IDENTICI sono ambigui (0 minuti a letto, o 24h esatte?): non
  // indoviniamo, chiediamo un orario diverso - coerente con "non correggere
  // silenziosamente".
  if (errors.length === 0 && input.bedMinutes === input.outOfBedMinutes) {
    errors.push({ code: "TIME_IN_BED_ZERO", field: "bedMinutes" });
  }

  // Impossibile fisiologicamente: latenza + risvegli + veglia finale che
  // superano il tempo a letto produrrebbero un tempo di sonno derivato
  // negativo. Bloccante, non un warning (P1.1B Fase 3).
  if (errors.length === 0) {
    const crossedMidnight = input.outOfBedMinutes <= input.bedMinutes;
    const effectiveOutOfBed = crossedMidnight ? input.outOfBedMinutes + MINUTES_PER_DAY : input.outOfBedMinutes;
    const timeInBedMinutes = effectiveOutOfBed - input.bedMinutes;
    const totalTimeAwakeMinutes =
      input.sleepOnsetLatencyMinutes + input.wakeAfterSleepOnsetMinutes + input.finalWakeMinutes;
    if (totalTimeAwakeMinutes > timeInBedMinutes) {
      errors.push({ code: "NEGATIVE_DERIVED_SLEEP_TIME" });
    }
  }

  return errors;
}

// ── Warning (calcolato comunque, mai bloccante: solo valori insoliti ma
// possibili, mai valori fisiologicamente/matematicamente impossibili) ──────

export type SleepEfficiencyWarning = { code: "SHORT_TIME_IN_BED" } | { code: "UNUSUALLY_LONG_TIME_IN_BED" };

const SHORT_TIME_IN_BED_THRESHOLD_MIN = 60;
const LONG_TIME_IN_BED_THRESHOLD_MIN = 16 * 60;

// ── Risultato ────────────────────────────────────────────────────────

export interface SleepEfficiencyResult {
  timeInBedMinutes: number;
  totalSleepTimeMinutes: number;
  totalTimeAwakeMinutes: number;
  /** TST / TIB × 100. Sempre in [0, 100]: gli input che lo porterebbero fuori range sono bloccati in validazione, mai clampati qui. */
  sleepEfficiencyPercent: number;
  latencyMinutes: number | null;
  wasoMinutes: number | null;
  finalWakeMinutes: number | null;
  crossedMidnight: boolean;
  warnings: SleepEfficiencyWarning[];
}

export type SleepEfficiencyCalcOutcome =
  | { ok: true; result: SleepEfficiencyResult }
  | { ok: false; errors: SleepEfficiencyValidationError[] };

export function calculateSleepEfficiency(input: SleepEfficiencyInput): SleepEfficiencyCalcOutcome {
  const errors = validateSleepEfficiencyInput(input);
  if (errors.length > 0) return { ok: false, errors };

  const warnings: SleepEfficiencyWarning[] = [];

  if (input.mode === "simple") {
    const { timeInBedMinutes, totalSleepTimeMinutes } = input;
    const totalTimeAwakeMinutes = timeInBedMinutes - totalSleepTimeMinutes;
    const sleepEfficiencyPercent = (totalSleepTimeMinutes / timeInBedMinutes) * 100;

    if (timeInBedMinutes < SHORT_TIME_IN_BED_THRESHOLD_MIN) warnings.push({ code: "SHORT_TIME_IN_BED" });
    if (timeInBedMinutes > LONG_TIME_IN_BED_THRESHOLD_MIN) warnings.push({ code: "UNUSUALLY_LONG_TIME_IN_BED" });

    // Difesa in profondità: la validazione sopra garantisce già 0 <= TST <= TIB
    // (quindi 0 <= efficienza <= 100), ma non ci fidiamo silenziosamente di un
    // futuro refactor - se mai violato, è un errore bloccante, non un clamp.
    if (sleepEfficiencyPercent < 0 || sleepEfficiencyPercent > 100) {
      return { ok: false, errors: [{ code: "EFFICIENCY_OUT_OF_RANGE" }] };
    }

    return {
      ok: true,
      result: {
        timeInBedMinutes,
        totalSleepTimeMinutes,
        totalTimeAwakeMinutes,
        sleepEfficiencyPercent,
        latencyMinutes: null,
        wasoMinutes: null,
        finalWakeMinutes: null,
        crossedMidnight: false,
        warnings,
      },
    };
  }

  const { bedMinutes, outOfBedMinutes, sleepOnsetLatencyMinutes, wakeAfterSleepOnsetMinutes, finalWakeMinutes } =
    input;

  const crossedMidnight = outOfBedMinutes <= bedMinutes;
  const effectiveOutOfBed = crossedMidnight ? outOfBedMinutes + MINUTES_PER_DAY : outOfBedMinutes;
  const timeInBedMinutes = effectiveOutOfBed - bedMinutes;

  const totalTimeAwakeMinutes = sleepOnsetLatencyMinutes + wakeAfterSleepOnsetMinutes + finalWakeMinutes;
  const totalSleepTimeMinutes = timeInBedMinutes - totalTimeAwakeMinutes;
  const sleepEfficiencyPercent = (totalSleepTimeMinutes / timeInBedMinutes) * 100;

  if (timeInBedMinutes < SHORT_TIME_IN_BED_THRESHOLD_MIN) warnings.push({ code: "SHORT_TIME_IN_BED" });
  if (timeInBedMinutes > LONG_TIME_IN_BED_THRESHOLD_MIN) warnings.push({ code: "UNUSUALLY_LONG_TIME_IN_BED" });

  if (sleepEfficiencyPercent < 0 || sleepEfficiencyPercent > 100) {
    return { ok: false, errors: [{ code: "EFFICIENCY_OUT_OF_RANGE" }] };
  }

  return {
    ok: true,
    result: {
      timeInBedMinutes,
      totalSleepTimeMinutes,
      totalTimeAwakeMinutes,
      sleepEfficiencyPercent,
      latencyMinutes: sleepOnsetLatencyMinutes,
      wasoMinutes: wakeAfterSleepOnsetMinutes,
      finalWakeMinutes,
      crossedMidnight,
      warnings,
    },
  };
}

/** Formatta un totale di minuti come "Xh Ym" (IT/EN condividono il formato: solo l'unità cambia altrove nel copy). */
export function formatMinutesAsHm(totalMinutes: number): { hours: number; minutes: number } {
  const sign = totalMinutes < 0 ? -1 : 1;
  const abs = Math.abs(Math.round(totalMinutes));
  return { hours: sign * Math.floor(abs / 60), minutes: abs % 60 };
}

// ── Validazione dei campi grezzi della UI (H/M separati, prima della
// combinazione in SleepEfficiencyInput): parte del motore puro, non della
// UI, così l'oracle Python può cross-verificarla come tutto il resto
// (P1.1B Fase 3: "minuti dei campi durata fuori da 0-59" e "ore/minuti fuori
// dai limiti dichiarati" devono essere errori bloccanti, non sparire in un
// generico "nessun risultato"). ──────────────────────────────────────────

/** Un'ora+minuti "di durata" (es. 8h 30m di tempo a letto), non un orario del giorno. */
export function validateRawDurationField(
  field: string,
  hours: number | undefined,
  minutes: number | undefined,
): SleepEfficiencyValidationError[] {
  const errors: SleepEfficiencyValidationError[] = [];
  const h = hours ?? 0;
  const m = minutes ?? 0;
  if (isMissingOrNaN(hours) && isMissingOrNaN(minutes)) {
    errors.push({ code: "MISSING_FIELD", field });
    return errors;
  }
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    errors.push({ code: "NOT_A_NUMBER", field });
    return errors;
  }
  if (h < 0) errors.push({ code: "NEGATIVE_VALUE", field: `${field}Hours` });
  if (m < 0 || m > 59) errors.push({ code: "MINUTES_OUT_OF_RANGE", field: `${field}Minutes` });
  return errors;
}

export function rawDurationToMinutes(hours: number | undefined, minutes: number | undefined): number {
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** Un orario del giorno (es. 23:30), in formato 12h (1-12 + AM/PM) o 24h (0-23). */
export function validateRawTimeOfDayField(
  field: string,
  hour: number | undefined,
  minute: number | undefined,
  format24h: boolean,
): SleepEfficiencyValidationError[] {
  const errors: SleepEfficiencyValidationError[] = [];
  if (isMissingOrNaN(hour)) {
    errors.push({ code: "MISSING_FIELD", field });
    return errors;
  }
  const m = minute ?? 0;
  if (!Number.isFinite(hour) || !Number.isFinite(m)) {
    errors.push({ code: "NOT_A_NUMBER", field });
    return errors;
  }
  const minHour = format24h ? 0 : 1;
  const maxHour = format24h ? 23 : 12;
  if (hour < minHour || hour > maxHour) errors.push({ code: "TIME_OUT_OF_RANGE", field: `${field}Hour` });
  if (m < 0 || m > 59) errors.push({ code: "MINUTES_OUT_OF_RANGE", field: `${field}Minutes` });
  return errors;
}

export function rawTimeOfDayToMinutes(
  hour: number,
  minute: number,
  ampm: "AM" | "PM",
  format24h: boolean,
): number {
  let hour24 = hour;
  if (!format24h) {
    hour24 = hour % 12;
    if (ampm === "PM") hour24 += 12;
  }
  return hour24 * 60 + minute;
}

/** Dati di esempio precaricabili (modalità avanzata): usati anche come test vector. */
export const SAMPLE_ADVANCED_INPUT: AdvancedModeInput = {
  mode: "advanced",
  bedMinutes: 23 * 60 + 30, // 23:30
  outOfBedMinutes: 7 * 60 + 15, // 07:15 (giorno dopo)
  sleepOnsetLatencyMinutes: 15,
  wakeAfterSleepOnsetMinutes: 20,
  finalWakeMinutes: 5,
};

/** Dati di esempio precaricabili (modalità semplice): usati anche come test vector. */
export const SAMPLE_SIMPLE_INPUT: SimpleModeInput = {
  mode: "simple",
  timeInBedMinutes: 8 * 60,
  totalSleepTimeMinutes: 7 * 60 + 10,
};
