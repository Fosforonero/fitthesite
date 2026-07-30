import { describe, expect, it } from "vitest";
import {
  calculateHeartRateZones,
  validateHeartRateZonesInput,
  classifyBpmIntoZone,
  estimateMaxHrTanaka,
  estimateMaxHr220Age,
  ZONE_KEYS,
  ZONE_BANDS,
  SAMPLE_TANAKA_INPUT,
  SAMPLE_AGE220_INPUT,
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

describe("estimateMaxHr220Age", () => {
  it("età 40 -> 220 - 40 = 180 (identico a Tanaka a questa età esatta)", () => {
    expect(estimateMaxHr220Age(40)).toBeCloseTo(180, 9);
    expect(estimateMaxHr220Age(40)).toBeCloseTo(estimateMaxHrTanaka(40), 9);
  });
  it("età 60 -> 160, diverge da Tanaka (166): -6 bpm", () => {
    expect(estimateMaxHr220Age(60)).toBeCloseTo(160, 9);
    expect(estimateMaxHrTanaka(60)).toBeCloseTo(166, 9);
  });
  it("età 20 -> 200, diverge da Tanaka (194): +6 bpm (sopra i 40 anni il segno si inverte)", () => {
    expect(estimateMaxHr220Age(20)).toBeCloseTo(200, 9);
    expect(estimateMaxHrTanaka(20)).toBeCloseTo(194, 9);
  });
});

describe("calculateHeartRateZones: modalità Tanaka (età -> Tanaka)", () => {
  it("età 40, FC riposo 60 -> maxHr 180, HRR 120, zone coerenti", () => {
    const outcome = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.maxHr).toBeCloseTo(180, 6);
    expect(outcome.result.maxHrSource).toBe("tanaka");
    expect(outcome.result.heartRateReserve).toBeCloseTo(120, 6);

    // % FC max: zona 2 (60-70%) = [108, 126) bpm
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
    const outcome = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
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
    const outcome = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.percentMaxHrZones.map((z) => z.key)).toEqual([...ZONE_KEYS]);
    expect(outcome.result.heartRateReserveZones.map((z) => z.key)).toEqual([...ZONE_KEYS]);
  });
});

describe("calculateHeartRateZones: modalità 220-età", () => {
  it("età 40, FC riposo 60 -> stesso risultato della modalità Tanaka a questa età (incrocio esatto)", () => {
    const tanaka = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
    const age220 = calculateHeartRateZones(SAMPLE_AGE220_INPUT);
    expect(tanaka.ok).toBe(true);
    expect(age220.ok).toBe(true);
    if (!tanaka.ok || !age220.ok) return;
    expect(age220.result.maxHr).toBe(tanaka.result.maxHr);
    expect(age220.result.maxHrSource).toBe("age220");
    expect(age220.result.percentMaxHrZones).toEqual(tanaka.result.percentMaxHrZones);
  });

  it("età 60, FC riposo 55 -> maxHr 160 (diverge di 6 bpm da Tanaka=166 alla stessa età)", () => {
    const outcome = calculateHeartRateZones({ maxHrMode: "age220", age: 60, restingHr: 55 });
    const tanakaSameAge = calculateHeartRateZones({ maxHrMode: "tanaka", age: 60, restingHr: 55 });
    expect(outcome.ok).toBe(true);
    expect(tanakaSameAge.ok).toBe(true);
    if (!outcome.ok || !tanakaSameAge.ok) return;
    expect(outcome.result.maxHr).toBe(160);
    expect(tanakaSameAge.result.maxHr).toBe(166);
  });

  it("modalità 220-età valida lo stesso range età della modalità Tanaka (18-100)", () => {
    expect(validateHeartRateZonesInput({ maxHrMode: "age220", age: 17, restingHr: 60 })).toContainEqual({
      code: "AGE_OUT_OF_RANGE",
    });
    expect(validateHeartRateZonesInput({ maxHrMode: "age220", age: 18, restingHr: 60 })).toEqual([]);
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
    const input: HeartRateZonesInput = { maxHrMode: "tanaka", age: 90, restingHr: 148 };
    const errors = validateHeartRateZonesInput(input);
    expect(errors).toContainEqual({ code: "RESTING_HR_NOT_BELOW_MAX" });
  });

  it("FC riposo == FC max esatta (misurata): RESTING_HR_NOT_BELOW_MAX, non un caso limite valido", () => {
    const input: HeartRateZonesInput = { maxHrMode: "measured", measuredMaxHr: 140, restingHr: 140 };
    const errors = validateHeartRateZonesInput(input);
    expect(errors).toContainEqual({ code: "RESTING_HR_NOT_BELOW_MAX" });
  });

  it("età fuori range (>100): AGE_OUT_OF_RANGE", () => {
    const input: HeartRateZonesInput = { maxHrMode: "tanaka", age: 150, restingHr: 60 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "AGE_OUT_OF_RANGE" });
  });

  it("età pediatrica (<18, non 'impossibile fisiologicamente' ma fuori dal range adulto supportato): AGE_OUT_OF_RANGE", () => {
    const input: HeartRateZonesInput = { maxHrMode: "tanaka", age: 10, restingHr: 60 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "AGE_OUT_OF_RANGE" });
  });

  it("confine età esatto: 17 bloccato, 18 accettato (adulti, P1.4B-A Fase 4)", () => {
    expect(validateHeartRateZonesInput({ maxHrMode: "tanaka", age: 17, restingHr: 60 })).toContainEqual({
      code: "AGE_OUT_OF_RANGE",
    });
    expect(validateHeartRateZonesInput({ maxHrMode: "tanaka", age: 18, restingHr: 60 })).toEqual([]);
  });

  it("modalità misurata non richiede né valida l'età (non usata nel calcolo)", () => {
    const input: HeartRateZonesInput = { maxHrMode: "measured", measuredMaxHr: 180, restingHr: 60, age: 3 };
    // age=3 sarebbe fuori range se validato, ma la modalità "measured" non lo usa: nessun errore.
    expect(validateHeartRateZonesInput(input)).toEqual([]);
  });

  it("età mancante in modalità stimata: MISSING_FIELD", () => {
    const input = { maxHrMode: "tanaka", restingHr: 60 } as HeartRateZonesInput;
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
    const input: HeartRateZonesInput = { maxHrMode: "tanaka", age: 30, restingHr: -5 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "NEGATIVE_VALUE", field: "restingHr" });
  });

  it("FC riposo fuori range assoluto (200): RESTING_HR_OUT_OF_RANGE", () => {
    const input: HeartRateZonesInput = { maxHrMode: "tanaka", age: 30, restingHr: 200 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "RESTING_HR_OUT_OF_RANGE" });
  });

  it("FC riposo mancante: MISSING_FIELD", () => {
    const input = { maxHrMode: "tanaka", age: 30 } as HeartRateZonesInput;
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "MISSING_FIELD", field: "restingHr" });
  });

  it("calculateHeartRateZones su input invalido non calcola nulla (ok:false, nessun result)", () => {
    const outcome = calculateHeartRateZones({ maxHrMode: "tanaka", age: 30, restingHr: 300 });
    expect(outcome.ok).toBe(false);
  });

  // NaN/Infinity: testati qui in TypeScript diretto, non tramite l'oracle
  // JSON-based (P1.4B-A Fase 7) - JSON.stringify(NaN) e JSON.stringify(Infinity)
  // diventano entrambi `null`, quindi non sono rappresentabili nel file
  // .oracle-vectors.json senza perdere l'informazione che li distingue.
  it("età NaN è trattata come mancante (isMissingOrNaN): MISSING_FIELD, non NOT_A_NUMBER", () => {
    const input = { maxHrMode: "tanaka", age: NaN, restingHr: 60 } as HeartRateZonesInput;
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "MISSING_FIELD", field: "age" });
  });

  it("età Infinity: NOT_A_NUMBER (distinta da NaN, non catturata da isMissingOrNaN)", () => {
    const input: HeartRateZonesInput = { maxHrMode: "tanaka", age: Infinity, restingHr: 60 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "NOT_A_NUMBER", field: "age" });
  });

  it("FC massima misurata Infinity: NOT_A_NUMBER", () => {
    const input: HeartRateZonesInput = { maxHrMode: "measured", measuredMaxHr: Infinity, restingHr: 60 };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "NOT_A_NUMBER", field: "measuredMaxHr" });
  });

  it("FC a riposo -Infinity: NOT_A_NUMBER (non NEGATIVE_VALUE - il controllo di finitezza viene prima)", () => {
    const input: HeartRateZonesInput = { maxHrMode: "tanaka", age: 30, restingHr: -Infinity };
    expect(validateHeartRateZonesInput(input)).toContainEqual({ code: "NOT_A_NUMBER", field: "restingHr" });
  });
});

describe("calculateHeartRateZones: avvisi non bloccanti (insoliti ma possibili)", () => {
  it("FC riposo alta (>100) genera UNUSUALLY_HIGH_RESTING_HR", () => {
    const outcome = calculateHeartRateZones({ maxHrMode: "tanaka", age: 30, restingHr: 105 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.warnings).toContainEqual({ code: "UNUSUALLY_HIGH_RESTING_HR" });
  });

  it("FC riposo bassa (<40) genera UNUSUALLY_LOW_RESTING_HR", () => {
    const outcome = calculateHeartRateZones({ maxHrMode: "tanaka", age: 30, restingHr: 35 });
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
    const outcome = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
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

describe("classifyBpmIntoZone: assegnazione deterministica, senza overlap né buchi (P1.4B-A Fase 5)", () => {
  it("ogni bpm intero da 0 a 250 ha ESATTAMENTE una zona (o nessuna, fuori range) - mai due", () => {
    const outcome = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    for (const table of [outcome.result.percentMaxHrZones, outcome.result.heartRateReserveZones]) {
      for (let bpm = 0; bpm <= 250; bpm++) {
        const matches = table.filter((z, i) => {
          const isLast = i === table.length - 1;
          const belowUpper = isLast ? bpm <= z.bpmHigh : bpm < z.bpmHigh;
          return bpm >= z.bpmLow && belowUpper;
        });
        expect(matches.length).toBeLessThanOrEqual(1);
      }
    }
  });

  it("il confine esatto fra Zona 2 e Zona 3 (metodo % FC max, esempio interi) va alla Zona 3, non a entrambe", () => {
    const outcome = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const z2 = outcome.result.percentMaxHrZones.find((z) => z.key === "z2")!;
    const z3 = outcome.result.percentMaxHrZones.find((z) => z.key === "z3")!;
    expect(z2.bpmHigh).toBe(z3.bpmLow); // stesso numero (126): confine condiviso, non un buco/overlap numerico
    expect(classifyBpmIntoZone(z2.bpmHigh, outcome.result.percentMaxHrZones)).toBe("z3");
    expect(classifyBpmIntoZone(z2.bpmHigh - 1, outcome.result.percentMaxHrZones)).toBe("z2");
  });

  it("z5 include il proprio limite superiore (unica eccezione: FC massima esatta è ancora Zona 5)", () => {
    const outcome = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const z5 = outcome.result.percentMaxHrZones.find((z) => z.key === "z5")!;
    expect(classifyBpmIntoZone(z5.bpmHigh, outcome.result.percentMaxHrZones)).toBe("z5");
  });

  it("bpm sotto la Zona 1 o sopra la Zona 5 non è classificato (null)", () => {
    const outcome = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const zones = outcome.result.percentMaxHrZones;
    expect(classifyBpmIntoZone(zones[0].bpmLow - 1, zones)).toBeNull();
    expect(classifyBpmIntoZone(zones[zones.length - 1].bpmHigh + 1, zones)).toBeNull();
  });
});
