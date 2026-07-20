import { describe, expect, it } from "vitest";
import {
  calculateSleepEfficiency,
  validateSleepEfficiencyInput,
  validateRawDurationField,
  validateRawTimeOfDayField,
  rawDurationToMinutes,
  rawTimeOfDayToMinutes,
  formatMinutesAsHm,
  SAMPLE_ADVANCED_INPUT,
  SAMPLE_SIMPLE_INPUT,
  type SleepEfficiencyInput,
} from "./math";

/**
 * Valori attesi verificati anche con un oracle Python indipendente (vedi
 * scripts/oracle/sleep_efficiency_oracle.py e il confronto automatizzato in
 * tools/run-labs-oracle-check.sh). Non modificare questi valori attesi per
 * far passare il codice: se un test fallisce, il bug è nel codice.
 *
 * P1.1B Fase 3: valori fisiologicamente/matematicamente impossibili (tempo
 * dormito che supera il tempo a letto, tempo di sonno derivato negativo)
 * sono ERRORI BLOCCANTI, non warning - a differenza della prima versione di
 * questo modulo, spostata deliberatamente a un comportamento più severo.
 */

describe("calculateSleepEfficiency: modalità semplice", () => {
  it("8h a letto, 7h dormite -> 87.5%", () => {
    const outcome = calculateSleepEfficiency({ mode: "simple", timeInBedMinutes: 480, totalSleepTimeMinutes: 420 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.sleepEfficiencyPercent).toBeCloseTo(87.5, 6);
    expect(outcome.result.totalTimeAwakeMinutes).toBe(60);
    expect(outcome.result.warnings).toEqual([]);
  });

  it("100% quando dormito == a letto (limite esatto, non deve mai attivare EFFICIENCY_OUT_OF_RANGE)", () => {
    const outcome = calculateSleepEfficiency({ mode: "simple", timeInBedMinutes: 420, totalSleepTimeMinutes: 420 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.sleepEfficiencyPercent).toBeCloseTo(100, 9);
    expect(outcome.result.warnings).toEqual([]);
  });

  it("0% quando dormito == 0 (limite esatto, non deve mai attivare EFFICIENCY_OUT_OF_RANGE)", () => {
    const outcome = calculateSleepEfficiency({ mode: "simple", timeInBedMinutes: 420, totalSleepTimeMinutes: 0 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.sleepEfficiencyPercent).toBeCloseTo(0, 9);
  });

  it("dormito > a letto: fisiologicamente impossibile, ERRORE BLOCCANTE (P1.1B), nessun risultato calcolato", () => {
    const outcome = calculateSleepEfficiency({ mode: "simple", timeInBedMinutes: 400, totalSleepTimeMinutes: 420 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors).toContainEqual({ code: "SLEEP_EXCEEDS_TIME_IN_BED" });
  });

  it("tempo a letto molto corto (<60min) genera warning SHORT_TIME_IN_BED (insolito ma possibile, non bloccante)", () => {
    const outcome = calculateSleepEfficiency({ mode: "simple", timeInBedMinutes: 45, totalSleepTimeMinutes: 40 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toContainEqual({ code: "SHORT_TIME_IN_BED" });
  });

  it("tempo a letto molto lungo (>16h) genera warning UNUSUALLY_LONG_TIME_IN_BED (insolito ma possibile, non bloccante)", () => {
    const outcome = calculateSleepEfficiency({ mode: "simple", timeInBedMinutes: 1000, totalSleepTimeMinutes: 900 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toContainEqual({ code: "UNUSUALLY_LONG_TIME_IN_BED" });
  });

  it("tempo a letto zero: errore di validazione bloccante, non un'eccezione/NaN silenzioso", () => {
    const outcome = calculateSleepEfficiency({ mode: "simple", timeInBedMinutes: 0, totalSleepTimeMinutes: 0 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors).toContainEqual({ code: "TIME_IN_BED_ZERO", field: "timeInBedMinutes" });
  });

  it("valore negativo: errore di validazione bloccante", () => {
    const outcome = calculateSleepEfficiency({ mode: "simple", timeInBedMinutes: -10, totalSleepTimeMinutes: 100 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors).toContainEqual({ code: "NEGATIVE_VALUE", field: "timeInBedMinutes" });
  });

  it("campo mancante (NaN/undefined): errore di validazione bloccante, mai un NaN silenzioso nel risultato", () => {
    const outcome = calculateSleepEfficiency({
      mode: "simple",
      timeInBedMinutes: 480,
      totalSleepTimeMinutes: undefined as unknown as number,
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors).toContainEqual({ code: "MISSING_FIELD", field: "totalSleepTimeMinutes" });
  });
});

describe("calculateSleepEfficiency: modalità avanzata", () => {
  it("nessun attraversamento mezzanotte (letto 14:00, sveglia 15:30, stesso pomeriggio) - TIB 90min", () => {
    const input: SleepEfficiencyInput = {
      mode: "advanced",
      bedMinutes: 14 * 60,
      outOfBedMinutes: 15 * 60 + 30,
      sleepOnsetLatencyMinutes: 10,
      wakeAfterSleepOnsetMinutes: 0,
      finalWakeMinutes: 0,
    };
    const outcome = calculateSleepEfficiency(input);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.crossedMidnight).toBe(false);
    expect(outcome.result.timeInBedMinutes).toBe(90);
    expect(outcome.result.totalSleepTimeMinutes).toBe(80);
    expect(outcome.result.sleepEfficiencyPercent).toBeCloseTo((80 / 90) * 100, 6);
  });

  it("attraversamento mezzanotte (23:30 -> 07:15): TIB = 465min, gestito come +24h", () => {
    const outcome = calculateSleepEfficiency(SAMPLE_ADVANCED_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.crossedMidnight).toBe(true);
    // 23:30 -> 07:15+24h = 31:15 => TIB = 31:15 - 23:30 = 7h45 = 465min
    expect(outcome.result.timeInBedMinutes).toBe(465);
    // TST = 465 - (15+20+5) = 425
    expect(outcome.result.totalSleepTimeMinutes).toBe(425);
    expect(outcome.result.sleepEfficiencyPercent).toBeCloseTo((425 / 465) * 100, 6);
    expect(outcome.result.warnings).toEqual([]);
  });

  it("orari identici (bed === outOfBed): ambiguo, errore di validazione bloccante, mai un TIB=0 o TIB=1440 indovinato", () => {
    const outcome = calculateSleepEfficiency({
      mode: "advanced",
      bedMinutes: 600,
      outOfBedMinutes: 600,
      sleepOnsetLatencyMinutes: 0,
      wakeAfterSleepOnsetMinutes: 0,
      finalWakeMinutes: 0,
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors).toContainEqual({ code: "TIME_IN_BED_ZERO", field: "bedMinutes" });
  });

  it("latenza+WASO+risveglio finale > TIB: tempo di sonno derivato negativo, fisicamente impossibile, ERRORE BLOCCANTE (P1.1B)", () => {
    const outcome = calculateSleepEfficiency({
      mode: "advanced",
      bedMinutes: 60,
      outOfBedMinutes: 120, // TIB = 60min
      sleepOnsetLatencyMinutes: 40,
      wakeAfterSleepOnsetMinutes: 30,
      finalWakeMinutes: 0, // awake = 70 > TIB 60
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors).toContainEqual({ code: "NEGATIVE_DERIVED_SLEEP_TIME" });
  });

  it("latenza+WASO+risveglio finale == TIB esatto: TST derivato 0, ammesso (limite, non oltre)", () => {
    const outcome = calculateSleepEfficiency({
      mode: "advanced",
      bedMinutes: 60,
      outOfBedMinutes: 120, // TIB = 60min
      sleepOnsetLatencyMinutes: 60,
      wakeAfterSleepOnsetMinutes: 0,
      finalWakeMinutes: 0,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.totalSleepTimeMinutes).toBe(0);
    expect(outcome.result.sleepEfficiencyPercent).toBeCloseTo(0, 9);
  });

  it("orario fuori range (>=1440 o negativo): errore di validazione bloccante", () => {
    const outcome = calculateSleepEfficiency({
      mode: "advanced",
      bedMinutes: 1440,
      outOfBedMinutes: 400,
      sleepOnsetLatencyMinutes: 0,
      wakeAfterSleepOnsetMinutes: 0,
      finalWakeMinutes: 0,
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors).toContainEqual({ code: "TIME_OUT_OF_RANGE", field: "bedMinutes" });
  });

  it("latenza negativa: errore di validazione bloccante", () => {
    const outcome = calculateSleepEfficiency({
      mode: "advanced",
      bedMinutes: 60,
      outOfBedMinutes: 400,
      sleepOnsetLatencyMinutes: -5,
      wakeAfterSleepOnsetMinutes: 0,
      finalWakeMinutes: 0,
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors).toContainEqual({ code: "NEGATIVE_VALUE", field: "sleepOnsetLatencyMinutes" });
  });

  it("più errori di validazione vengono riportati tutti insieme, non solo il primo", () => {
    const errors = validateSleepEfficiencyInput({
      mode: "advanced",
      bedMinutes: -1,
      outOfBedMinutes: 2000,
      sleepOnsetLatencyMinutes: -5,
      wakeAfterSleepOnsetMinutes: 0,
      finalWakeMinutes: 0,
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("validateRawDurationField (P1.1B Fase 3 - campi H/M grezzi della UI)", () => {
  it("minuti dentro 0-59: nessun errore", () => {
    expect(validateRawDurationField("timeInBed", 8, 30)).toEqual([]);
  });

  it("minuti fuori 0-59 (es. 95): errore bloccante MINUTES_OUT_OF_RANGE, non un valore indovinato", () => {
    const errors = validateRawDurationField("timeInBed", 8, 95);
    expect(errors).toContainEqual({ code: "MINUTES_OUT_OF_RANGE", field: "timeInBedMinutes" });
  });

  it("minuti negativi: MINUTES_OUT_OF_RANGE", () => {
    const errors = validateRawDurationField("timeInBed", 8, -5);
    expect(errors).toContainEqual({ code: "MINUTES_OUT_OF_RANGE", field: "timeInBedMinutes" });
  });

  it("ore negative: NEGATIVE_VALUE", () => {
    const errors = validateRawDurationField("timeInBed", -1, 0);
    expect(errors).toContainEqual({ code: "NEGATIVE_VALUE", field: "timeInBedHours" });
  });

  it("entrambi assenti: MISSING_FIELD", () => {
    expect(validateRawDurationField("timeInBed", undefined, undefined)).toEqual([
      { code: "MISSING_FIELD", field: "timeInBed" },
    ]);
  });

  it("solo ore presente, minuti assenti: valido (i minuti mancanti valgono 0)", () => {
    expect(validateRawDurationField("timeInBed", 8, undefined)).toEqual([]);
  });

  it("rawDurationToMinutes converte correttamente", () => {
    expect(rawDurationToMinutes(8, 30)).toBe(510);
    expect(rawDurationToMinutes(8, undefined)).toBe(480);
  });
});

describe("validateRawTimeOfDayField (P1.1B Fase 3 - orari grezzi della UI)", () => {
  it("24h: ora 0-23 valida", () => {
    expect(validateRawTimeOfDayField("bedtime", 23, 30, true)).toEqual([]);
    expect(validateRawTimeOfDayField("bedtime", 0, 0, true)).toEqual([]);
  });

  it("24h: ora 24 o superiore fuori range", () => {
    const errors = validateRawTimeOfDayField("bedtime", 24, 0, true);
    expect(errors).toContainEqual({ code: "TIME_OUT_OF_RANGE", field: "bedtimeHour" });
  });

  it("12h: ora 0 fuori range (12h usa 1-12, non 0-11)", () => {
    const errors = validateRawTimeOfDayField("bedtime", 0, 0, false);
    expect(errors).toContainEqual({ code: "TIME_OUT_OF_RANGE", field: "bedtimeHour" });
  });

  it("12h: ora 13 fuori range", () => {
    const errors = validateRawTimeOfDayField("bedtime", 13, 0, false);
    expect(errors).toContainEqual({ code: "TIME_OUT_OF_RANGE", field: "bedtimeHour" });
  });

  it("12h: ora 12 valida (mezzogiorno/mezzanotte in notazione 12h)", () => {
    expect(validateRawTimeOfDayField("bedtime", 12, 0, false)).toEqual([]);
  });

  it("minuti fuori 0-59: MINUTES_OUT_OF_RANGE", () => {
    const errors = validateRawTimeOfDayField("bedtime", 10, 60, true);
    expect(errors).toContainEqual({ code: "MINUTES_OUT_OF_RANGE", field: "bedtimeMinutes" });
  });

  it("ora assente: MISSING_FIELD", () => {
    expect(validateRawTimeOfDayField("bedtime", undefined, 0, true)).toEqual([
      { code: "MISSING_FIELD", field: "bedtime" },
    ]);
  });

  it("rawTimeOfDayToMinutes: 24h diretto", () => {
    expect(rawTimeOfDayToMinutes(23, 30, "PM", true)).toBe(23 * 60 + 30);
  });

  it("rawTimeOfDayToMinutes: 12h PM converte correttamente (11:30 PM -> 23:30)", () => {
    expect(rawTimeOfDayToMinutes(11, 30, "PM", false)).toBe(23 * 60 + 30);
  });

  it("rawTimeOfDayToMinutes: 12h AM converte correttamente (12:00 AM -> 00:00)", () => {
    expect(rawTimeOfDayToMinutes(12, 0, "AM", false)).toBe(0);
  });
});

describe("formatMinutesAsHm", () => {
  it("converte minuti positivi in ore+minuti", () => {
    expect(formatMinutesAsHm(465)).toEqual({ hours: 7, minutes: 45 });
  });
  it("converte 0 correttamente", () => {
    expect(formatMinutesAsHm(0)).toEqual({ hours: 0, minutes: 0 });
  });
  it("converte minuti negativi preservando il segno su hours (per mostrare TST derivato negativo senza nasconderlo)", () => {
    expect(formatMinutesAsHm(-70)).toEqual({ hours: -1, minutes: 10 });
  });
});

describe("sample data usati anche come dati precaricabili nella UI", () => {
  it("SAMPLE_SIMPLE_INPUT produce un risultato valido senza warning", () => {
    const outcome = calculateSleepEfficiency(SAMPLE_SIMPLE_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toEqual([]);
  });

  it("SAMPLE_ADVANCED_INPUT produce un risultato valido senza warning", () => {
    const outcome = calculateSleepEfficiency(SAMPLE_ADVANCED_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toEqual([]);
  });
});
