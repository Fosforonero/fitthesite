import { describe, expect, it } from "vitest";
import {
  calculateHeartRateZones,
  validateHeartRateZonesInput,
  estimateMaxHrTanaka,
  ZONE_KEYS,
  ZONE_BANDS,
  SAMPLE_ESTIMATED_INPUT,
  SAMPLE_MEASURED_INPUT,
  type HeartRateZonesInput,
} from "./math";

/**
 * Valori attesi verificati anche con un oracle Python indipendente (vedi
 * scripts/oracle/heart_rate_zones_oracle.py e tools/run-labs-oracle-check.sh).
 * Non modificare questi valori attesi per far passare il codice: se un test
 * fallisce, il bug è nel codice.
 */

describe("estimateMaxHrTanaka", () => {
  it("età 40 -> 208 - 0.7*40 = 180", () => {
    expect(estimateMaxHrTanaka(40)).toBeCloseTo(180, 9);
  });
  it("età 20 -> 194", () => {
    expect(estimateMaxHrTanaka(20)).toBeCloseTo(194, 9);
  });
  it("età 0 -> 208 (limite matematico, l'input età è comunque bloccato sotto AGE_MIN a monte)", () => {
    expect(estimateMaxHrTanaka(0)).toBeCloseTo(208, 9);
  });
});

describe("calculateHeartRateZones: modalità stimata (età -> Tanaka)", () => {
  it("età 40, FC riposo 60 -> maxHr 180, HRR 120, zone coerenti", () => {
    const outcome = calculateHeartRateZones(SAMPLE_ESTIMATED_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.maxHr).toBeCloseTo(180, 6);
    expect(outcome.result.maxHrSource).toBe("estimated");
    expect(outcome.result.heartRateReserve).toBeCloseTo(120, 6);

    // % FC max: zona 2 (60-70%) = 108-126 bpm
    const pctZ2 = outcome.result.percentMaxHrZones.find((z) => z.key === "z2")!;
    expect(pctZ2.bpmLow).toBe(108);
    expect(pctZ2.bpmHigh).toBe(126);

    // HRR/Karvonen: zona 2 (60-70%) = 60 + 120*0.6=132 -> 60 + 120*0.7=144
    const hrrZ2 = outcome.result.heartRateReserveZones.find((z) => z.key === "z2")!;
    expect(hrrZ2.bpmLow).toBe(132);
    expect(hrrZ2.bpmHigh).toBe(144);

    // Le due zone 2 devono DIFFERIRE (è il punto pedagogico del tool).
    expect(pctZ2.bpmLow).not.toBe(hrrZ2.bpmLow);
    expect(outcome.result.warnings).toEqual([]);
  });

  it("tutte e 5 le zone sono monotonicamente crescenti su entrambi i metodi", () => {
    const outcome = calculateHeartRateZones(SAMPLE_ESTIMATED_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    for (const table of [outcome.result.percentMaxHrZones, outcome.result.heartRateReserveZones]) {
      for (let i = 0; i < table.length; i++) {
        expect(table[i].bpmLow).toBeLessThanOrEqual(table[i].bpmHigh);
        if (i > 0) expect(table[i].bpmLow).toBeGreaterThanOrEqual(table[i - 1].bpmHigh);
      }
    }
  });

  it("copre tutte e 5 le chiavi zona in ordine z1..z5", () => {
    const outcome = calculateHeartRateZones(SAMPLE_ESTIMATED_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.percentMaxHrZones.map((z) => z.key)).toEqual([...ZONE_KEYS]);
    expect(outcome.result.heartRateReserveZones.map((z) => z.key)).toEqual([...ZONE_KEYS]);
  });
});

describe("calculateHeartRateZones: modalità misurata (FC max reale)", () => {
  it("FC max 185, FC riposo 52 -> HRR 133", () => {
    const outcome = calculateHeartRateZones(SAMPLE_MEASURED_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.maxHr).toBe(185);
    expect(outcome.result.maxHrSource).toBe("measured");
    expect(outcome.result.heartRateReserve).toBeCloseTo(133, 6);
  });
});

describe("validateHeartRateZonesInput: errori bloccanti (fisiologicamente impossibile)", () => {
  it("FC riposo >= FC max (stimata, età molto avanzata così maxHr resta comunque dentro i range assoluti): RESTING_HR_NOT_BELOW_MAX", () => {
    // età 90 -> Tanaka maxHr = 208 - 0.7*90 = 145; riposo 148 è dentro il range
    // assoluto RESTING_HR_OUT_OF_RANGE (25-150) ma >= maxHr: isola il caso da
    // testare (impossibile fisiologico) da quello già coperto sopra (fuori range assoluto).
    const input: HeartRateZonesInput = { maxHrMode: "estimated", age: 90, restingHr: 148 };
    const errors = validateHeartRateZonesInput(input);
    expect(errors).toContainEqual({ code: "RESTING_HR_NOT_BELOW_MAX" });
  });

  it("FC riposo == FC max esatta (misurata): RESTING_HR_NOT_BELOW_MAX, non un caso limite valido", () => {
    const input: HeartRateZonesInput = { maxHrMode: "measured", measuredMaxHr: 140, restingHr: 140 };
    const errors = validateHeartRateZonesInput(input);
    expect(errors).toContainEqual({ code: "RESTING_HR_NOT_BELOW_MAX" });
  });

  it("età fuori range (>100): AGE_OUT_OF_RANGE", () => {
    const input: HeartRateZonesInput = { maxHrMode: "estimated", age: 150, restingHr: 60 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "AGE_OUT_OF_RANGE" });
  });

  it("età fuori range (<5): AGE_OUT_OF_RANGE", () => {
    const input: HeartRateZonesInput = { maxHrMode: "estimated", age: 2, restingHr: 60 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "AGE_OUT_OF_RANGE" });
  });

  it("età mancante in modalità stimata: MISSING_FIELD", () => {
    const input = { maxHrMode: "estimated", restingHr: 60 } as HeartRateZonesInput;
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "MISSING_FIELD", field: "age" });
  });

  it("FC max misurata fuori range assoluto (300): MAX_HR_OUT_OF_RANGE", () => {
    const input: HeartRateZonesInput = { maxHrMode: "measured", measuredMaxHr: 300, restingHr: 60 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "MAX_HR_OUT_OF_RANGE" });
  });

  it("FC max misurata mancante: MISSING_FIELD", () => {
    const input = { maxHrMode: "measured", restingHr: 60 } as HeartRateZonesInput;
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "MISSING_FIELD", field: "measuredMaxHr" });
  });

  it("FC riposo negativa: NEGATIVE_VALUE", () => {
    const input: HeartRateZonesInput = { maxHrMode: "estimated", age: 30, restingHr: -5 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "NEGATIVE_VALUE", field: "restingHr" });
  });

  it("FC riposo fuori range assoluto (200): RESTING_HR_OUT_OF_RANGE", () => {
    const input: HeartRateZonesInput = { maxHrMode: "estimated", age: 30, restingHr: 200 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "RESTING_HR_OUT_OF_RANGE" });
  });

  it("FC riposo mancante: MISSING_FIELD", () => {
    const input = { maxHrMode: "estimated", age: 30 } as HeartRateZonesInput;
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "MISSING_FIELD", field: "restingHr" });
  });

  it("calculateHeartRateZones su input invalido non calcola nulla (ok:false, nessun result)", () => {
    const outcome = calculateHeartRateZones({ maxHrMode: "estimated", age: 30, restingHr: 300 });
    expect(outcome.ok).toBe(false);
  });
});

describe("calculateHeartRateZones: avvisi non bloccanti (insoliti ma possibili)", () => {
  it("FC riposo alta (>100) genera UNUSUALLY_HIGH_RESTING_HR", () => {
    const outcome = calculateHeartRateZones({ maxHrMode: "estimated", age: 30, restingHr: 105 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toContainEqual({ code: "UNUSUALLY_HIGH_RESTING_HR" });
  });

  it("FC riposo bassa (<40) genera UNUSUALLY_LOW_RESTING_HR", () => {
    const outcome = calculateHeartRateZones({ maxHrMode: "estimated", age: 30, restingHr: 35 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toContainEqual({ code: "UNUSUALLY_LOW_RESTING_HR" });
  });

  it("riserva di FC molto stretta (<40bpm) genera NARROW_HEART_RATE_RESERVE", () => {
    const outcome = calculateHeartRateZones({ maxHrMode: "measured", measuredMaxHr: 150, restingHr: 115 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toContainEqual({ code: "NARROW_HEART_RATE_RESERVE" });
  });

  it("caso normale (età 40, riposo 60): nessun avviso", () => {
    const outcome = calculateHeartRateZones(SAMPLE_ESTIMATED_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toEqual([]);
  });
});

describe("ZONE_BANDS: coerenza strutturale", () => {
  it("5 bande, ciascuna pctLow < pctHigh, contigue da 50 a 100", () => {
    expect(ZONE_KEYS.length).toBe(5);
    let prevHigh = 50;
    for (const key of ZONE_KEYS) {
      const band = ZONE_BANDS[key];
      expect(band.pctLow).toBeLessThan(band.pctHigh);
      expect(band.pctLow).toBe(prevHigh);
      prevHigh = band.pctHigh;
    }
    expect(prevHigh).toBe(100);
  });
});
