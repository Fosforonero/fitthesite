/**
 * FitMesh Labs: motore di calcolo Zone di Frequenza Cardiaca.
 *
 * Puro TypeScript, zero dipendenze da DOM/rete/storage: input -> output,
 * nessun side effect. Stesso vincolo di rmssd-math.ts e sleep-efficiency/math.ts:
 * mai importare next/react/rete/storage da questo file.
 *
 * Calcola DUE metodi di zona in parallelo, deliberatamente con le STESSE 5
 * bande percentuali (50-60/60-70/70-80/80-90/90-100), applicate a due
 * riferimenti diversi:
 *  - % FC max (da una delle tre fonti di FC max sotto): zona = maxHr * pct.
 *  - % Riserva di FC / metodo Karvonen (Karvonen, Kentala, Mustala 1957):
 *    zona = restingHr + (maxHr - restingHr) * pct.
 *
 * Le bande percentuali sono IDENTICHE fra i due metodi apposta: la differenza
 * nei bpm risultanti nasce SOLO dal riferimento (0->max vs riposo->max), che è
 * esattamente il motivo per cui due dispositivi con metodo diverso mostrano
 * bpm diversi per la "stessa" zona nominale (vedi content.ts per fonti).
 *
 * FC massima da TRE fonti possibili (P1.4B-A, Fase 3): formula di Tanaka
 * 2001, formula classica "220 - età", o un valore misurato direttamente.
 * Tanaka e 220-età condividono lo stesso input (età) e lo stesso range
 * assoluto validato: NON sono due rami di validazione diversi, solo due
 * formule diverse applicate alla stessa età (vedi resolveMaxHr).
 *
 * Validazione a due livelli, stesso principio di sleep-efficiency/math.ts:
 * input fisiologicamente impossibile (FC riposo >= FC max, FC fuori range
 * assoluto) è un errore bloccante; valori insoliti ma possibili (FC riposo
 * molto alta, FC max molto bassa per l'età) restano un avviso non bloccante.
 * L'età fuori dall'intervallo 18-100 NON è invece un caso "impossibile
 * fisiologicamente" (un bambino di 5 anni esiste): è solo fuori dal range di
 * popolazione (adulti) su cui le formule di stima sono verificate - la
 * differenza conta per il messaggio d'errore in content.ts (P1.4B-A, Fase 4).
 */

export const ZONE_KEYS = ["z1", "z2", "z3", "z4", "z5"] as const;
export type ZoneKey = (typeof ZONE_KEYS)[number];

/** Bande percentuali condivise da entrambi i metodi (vedi commento sopra). */
export const ZONE_BANDS: Record<ZoneKey, { pctLow: number; pctHigh: number }> = {
  z1: { pctLow: 50, pctHigh: 60 },
  z2: { pctLow: 60, pctHigh: 70 },
  z3: { pctLow: 70, pctHigh: 80 },
  z4: { pctLow: 80, pctHigh: 90 },
  z5: { pctLow: 90, pctHigh: 100 },
};

// ── Formula Tanaka (stima FC max da età) ────────────────────────────────
/** Tanaka H, Monahan KD, Seals DR. J Am Coll Cardiol. 2001;37(1):153-156. PMID 11153730. */
export function estimateMaxHrTanaka(age: number): number {
  return 208 - 0.7 * age;
}

// ── Formula classica "220 - età" ─────────────────────────────────────────
/**
 * Stima di FC max più diffusa nell'uso pratico/consumer, ma la sua origine
 * non è tracciabile con certezza a un singolo studio validato (a differenza
 * di Tanaka 2001, che fu pubblicato esplicitamente per sostituirla con una
 * stima più accurata su una popolazione più ampia). Va presentata come stima
 * semplice e molto diffusa, MAI come equazione precisa o universalmente
 * validata (P1.4B-A, Fase 3) - vedi content.ts per il confronto numerico con
 * Tanaka.
 */
export function estimateMaxHr220Age(age: number): number {
  return 220 - age;
}

// ── Input ────────────────────────────────────────────────────────────────

export type MaxHrMode = "tanaka" | "age220" | "measured";

export interface HeartRateZonesInput {
  /**
   * "tanaka" / "age220": FC max stimata da età con una delle due formule.
   * "measured": FC max inserita direttamente (test/misurazione reale) - non
   * usa e non valida l'età, perché l'età non entra nel calcolo.
   */
  maxHrMode: MaxHrMode;
  age?: number;
  measuredMaxHr?: number;
  restingHr: number;
}

export type HeartRateZonesValidationError =
  | { code: "MISSING_FIELD"; field: string }
  | { code: "NOT_A_NUMBER"; field: string }
  | { code: "NEGATIVE_VALUE"; field: string }
  | { code: "AGE_OUT_OF_RANGE" }
  | { code: "MAX_HR_OUT_OF_RANGE" }
  | { code: "RESTING_HR_OUT_OF_RANGE" }
  | { code: "RESTING_HR_NOT_BELOW_MAX" };

export type HeartRateZonesWarning =
  | { code: "UNUSUALLY_HIGH_RESTING_HR" }
  | { code: "UNUSUALLY_LOW_RESTING_HR" }
  | { code: "NARROW_HEART_RATE_RESERVE" };

// Limiti assoluti per FC (max/riposo): fuori da questi, il dato non è
// fisiologicamente plausibile per una persona vivente a riposo/sotto sforzo
// (bloccante, non un avviso).
const MAX_HR_ABS_MIN = 100;
const MAX_HR_ABS_MAX = 230;
const RESTING_HR_ABS_MIN = 25;
const RESTING_HR_ABS_MAX = 150;

// Limite per l'ETÀ: NON è un limite di plausibilità fisiologica (un bambino
// di 10 anni esiste), è il range di popolazione ADULTA su cui le formule di
// stima (Tanaka 2001, "220-età") sono state sviluppate/validate - Tanaka et
// al. 2001 descrivono esplicitamente la propria meta-analisi come condotta
// su "healthy adults". AGE_MIN=18 è la soglia standard di età adulta [età
// pediatrica esclusa di proposito, P1.4B-A Fase 4]; AGE_MAX=100 resta un
// tetto di buon senso per uno strumento pratico, non un limite riportato
// dallo studio stesso.
const AGE_MIN = 18;
const AGE_MAX = 100;

// Soglie di avviso non bloccante: insolite ma possibili.
const RESTING_HR_HIGH_WARN = 100;
const RESTING_HR_LOW_WARN = 40;
const NARROW_RESERVE_WARN_BPM = 40;

function isMissingOrNaN(v: unknown): v is undefined {
  return v === undefined || v === null || (typeof v === "number" && Number.isNaN(v));
}

export function validateHeartRateZonesInput(
  input: HeartRateZonesInput,
): HeartRateZonesValidationError[] {
  const errors: HeartRateZonesValidationError[] = [];

  if (isMissingOrNaN(input.restingHr)) {
    errors.push({ code: "MISSING_FIELD", field: "restingHr" });
  } else if (!Number.isFinite(input.restingHr)) {
    errors.push({ code: "NOT_A_NUMBER", field: "restingHr" });
  } else if (input.restingHr < 0) {
    errors.push({ code: "NEGATIVE_VALUE", field: "restingHr" });
  } else if (input.restingHr < RESTING_HR_ABS_MIN || input.restingHr > RESTING_HR_ABS_MAX) {
    errors.push({ code: "RESTING_HR_OUT_OF_RANGE" });
  }

  let maxHr: number | undefined;
  if (input.maxHrMode === "tanaka" || input.maxHrMode === "age220") {
    if (isMissingOrNaN(input.age)) {
      errors.push({ code: "MISSING_FIELD", field: "age" });
    } else if (!Number.isFinite(input.age)) {
      errors.push({ code: "NOT_A_NUMBER", field: "age" });
    } else if (input.age < 0) {
      errors.push({ code: "NEGATIVE_VALUE", field: "age" });
    } else if (input.age < AGE_MIN || input.age > AGE_MAX) {
      errors.push({ code: "AGE_OUT_OF_RANGE" });
    } else {
      maxHr = input.maxHrMode === "tanaka" ? estimateMaxHrTanaka(input.age) : estimateMaxHr220Age(input.age);
    }
  } else {
    if (isMissingOrNaN(input.measuredMaxHr)) {
      errors.push({ code: "MISSING_FIELD", field: "measuredMaxHr" });
    } else if (!Number.isFinite(input.measuredMaxHr)) {
      errors.push({ code: "NOT_A_NUMBER", field: "measuredMaxHr" });
    } else if (input.measuredMaxHr < 0) {
      errors.push({ code: "NEGATIVE_VALUE", field: "measuredMaxHr" });
    } else if (input.measuredMaxHr < MAX_HR_ABS_MIN || input.measuredMaxHr > MAX_HR_ABS_MAX) {
      errors.push({ code: "MAX_HR_OUT_OF_RANGE" });
    } else {
      maxHr = input.measuredMaxHr;
    }
  }

  // Impossibile fisiologicamente: FC riposo >= FC max renderebbe la riserva
  // (HRR) zero o negativa. Bloccante, non un avviso - stesso principio di
  // SLEEP_EXCEEDS_TIME_IN_BED in sleep-efficiency/math.ts.
  if (errors.length === 0 && maxHr !== undefined && input.restingHr >= maxHr) {
    errors.push({ code: "RESTING_HR_NOT_BELOW_MAX" });
  }

  return errors;
}

export interface ZoneRange {
  key: ZoneKey;
  pctLow: number;
  pctHigh: number;
  bpmLow: number;
  bpmHigh: number;
}

export interface HeartRateZonesResult {
  maxHr: number;
  maxHrSource: MaxHrMode;
  restingHr: number;
  heartRateReserve: number;
  /** Zone calcolate come % diretta della FC max (maxHr * pct). */
  percentMaxHrZones: ZoneRange[];
  /** Zone calcolate col metodo Karvonen: restingHr + (maxHr - restingHr) * pct. */
  heartRateReserveZones: ZoneRange[];
  warnings: HeartRateZonesWarning[];
}

export type HeartRateZonesCalcOutcome =
  | { ok: true; result: HeartRateZonesResult }
  | { ok: false; errors: HeartRateZonesValidationError[] };

function buildZones(reference: (pct: number) => number): ZoneRange[] {
  return ZONE_KEYS.map((key) => {
    const { pctLow, pctHigh } = ZONE_BANDS[key];
    return {
      key,
      pctLow,
      pctHigh,
      bpmLow: Math.round(reference(pctLow / 100)),
      bpmHigh: Math.round(reference(pctHigh / 100)),
    };
  });
}

/**
 * Assegna un bpm a UNA sola zona, in modo deterministico: limite inferiore
 * incluso, limite superiore ESCLUSO - tranne per l'ultima zona (z5), che
 * include anche il limite superiore. Stessa convenzione ovunque nel tool
 * (UI, CSV, clipboard, articolo Zona 2) - P1.4B-A Fase 5. `zones` deve essere
 * l'output di buildZones, quindi già ordinato e contiguo per costruzione.
 */
export function classifyBpmIntoZone(bpm: number, zones: ZoneRange[]): ZoneKey | null {
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const isLast = i === zones.length - 1;
    const belowUpperBound = isLast ? bpm <= z.bpmHigh : bpm < z.bpmHigh;
    if (bpm >= z.bpmLow && belowUpperBound) return z.key;
  }
  return null;
}

function resolveMaxHr(input: HeartRateZonesInput): number {
  if (input.maxHrMode === "tanaka") return estimateMaxHrTanaka(input.age as number);
  if (input.maxHrMode === "age220") return estimateMaxHr220Age(input.age as number);
  return input.measuredMaxHr as number;
}

export function calculateHeartRateZones(input: HeartRateZonesInput): HeartRateZonesCalcOutcome {
  const errors = validateHeartRateZonesInput(input);
  if (errors.length > 0) return { ok: false, errors };

  const maxHr = resolveMaxHr(input);
  const restingHr = input.restingHr;
  const heartRateReserve = maxHr - restingHr;

  const warnings: HeartRateZonesWarning[] = [];
  if (restingHr > RESTING_HR_HIGH_WARN) warnings.push({ code: "UNUSUALLY_HIGH_RESTING_HR" });
  if (restingHr < RESTING_HR_LOW_WARN) warnings.push({ code: "UNUSUALLY_LOW_RESTING_HR" });
  if (heartRateReserve < NARROW_RESERVE_WARN_BPM) warnings.push({ code: "NARROW_HEART_RATE_RESERVE" });

  return {
    ok: true,
    result: {
      maxHr: Math.round(maxHr * 10) / 10,
      maxHrSource: input.maxHrMode,
      restingHr,
      heartRateReserve: Math.round(heartRateReserve * 10) / 10,
      percentMaxHrZones: buildZones((pct) => maxHr * pct),
      heartRateReserveZones: buildZones((pct) => restingHr + heartRateReserve * pct),
      warnings,
    },
  };
}

/** Dati di esempio precaricabili (modalità Tanaka): usati anche come test vector. */
export const SAMPLE_TANAKA_INPUT: HeartRateZonesInput = {
  maxHrMode: "tanaka",
  age: 40,
  restingHr: 60,
};

/**
 * Dati di esempio precaricabili (modalità 220-età): stessa età/FC riposo di
 * SAMPLE_TANAKA_INPUT apposta - a 40 anni le due formule coincidono
 * esattamente (220-40=180=208-0,7*40), il punto di incrocio esatto fra le
 * due rette (vedi content.ts). Usato anche come test vector.
 */
export const SAMPLE_AGE220_INPUT: HeartRateZonesInput = {
  maxHrMode: "age220",
  age: 40,
  restingHr: 60,
};

/** Dati di esempio precaricabili (modalità misurata): usati anche come test vector. */
export const SAMPLE_MEASURED_INPUT: HeartRateZonesInput = {
  maxHrMode: "measured",
  measuredMaxHr: 185,
  restingHr: 52,
};
