import { describe, expect, it } from "vitest";

import {
  calculateHrvMetrics,
  parseRrInput,
  isShortSample,
  isPhysiologicallyImplausible,
  findImplausibleIndices,
  SAMPLE_RR_INTERVALS_MS,
  SHORT_SAMPLE_INTERVAL_THRESHOLD,
  PLAUSIBLE_RR_MIN_MS,
  PLAUSIBLE_RR_MAX_MS,
} from "./rmssd-math";

/**
 * Tutti i valori attesi in questo file sono stati calcolati con
 * un'implementazione Python indipendente (non copiata da rmssd-math.ts,
 * scritta da zero solo per la verifica), eseguita durante lo sviluppo:
 *
 *   def rmssd_sdnn(rr):
 *       n = len(rr); mean = sum(rr) / n; hr = 60000 / mean
 *       diffs2 = [(rr[i+1]-rr[i])**2 for i in range(n-1)]
 *       rmssd = math.sqrt(sum(diffs2) / (n - 1))
 *       var = sum((x-mean)**2 for x in rr) / (n - 1)
 *       sd = math.sqrt(var); lnr = math.log(rmssd) if rmssd > 0 else None
 *
 * Vedi anche il commento "verificato con implementazione Python indipendente"
 * nella consegna dello sprint. Non modificare questi valori attesi per far
 * passare il codice: se un test fallisce, il bug è nel codice, non nel test.
 */

describe("calculateHrvMetrics: serie costante", () => {
  it("RMSSD = 0, ln(RMSSD) = null, stddev = 0", () => {
    const m = calculateHrvMetrics([800, 800, 800, 800]);
    expect(m).not.toBeNull();
    expect(m!.validIntervalCount).toBe(4);
    expect(m!.totalDurationMs).toBe(3200);
    expect(m!.meanRrMs).toBeCloseTo(800, 6);
    expect(m!.derivedHeartRateBpm).toBeCloseTo(75, 6);
    expect(m!.rmssdMs).toBeCloseTo(0, 9);
    expect(m!.lnRmssd).toBeNull();
    expect(m!.stdDevMs).toBeCloseTo(0, 9);
    expect(m!.stdDevDenominator).toBe("n-1");
  });
});

describe("calculateHrvMetrics: serie nota verificata indipendentemente (Python)", () => {
  it("[800, 810, 790, 805] ms", () => {
    const m = calculateHrvMetrics([800, 810, 790, 805]);
    expect(m).not.toBeNull();
    expect(m!.validIntervalCount).toBe(4);
    expect(m!.totalDurationMs).toBe(3205);
    expect(m!.meanRrMs).toBeCloseTo(801.25, 6);
    expect(m!.derivedHeartRateBpm).toBeCloseTo(74.882995, 5);
    expect(m!.rmssdMs).toBeCloseTo(15.545632, 5);
    expect(m!.lnRmssd).toBeCloseTo(2.74378, 4);
    expect(m!.stdDevMs).toBeCloseTo(8.539126, 5);
  });
});

describe("calculateHrvMetrics: due soli intervalli (minimo consentito)", () => {
  it("[800, 850] ms", () => {
    const m = calculateHrvMetrics([800, 850]);
    expect(m).not.toBeNull();
    expect(m!.validIntervalCount).toBe(2);
    expect(m!.meanRrMs).toBeCloseTo(825, 6);
    expect(m!.derivedHeartRateBpm).toBeCloseTo(72.727273, 5);
    expect(m!.rmssdMs).toBeCloseTo(50, 6);
    expect(m!.lnRmssd).toBeCloseTo(3.912023, 5);
    expect(m!.stdDevMs).toBeCloseTo(35.355339, 5);
  });

  it("un solo intervallo valido ritorna null (serve almeno una differenza successiva)", () => {
    expect(calculateHrvMetrics([800])).toBeNull();
  });

  it("zero intervalli ritorna null", () => {
    expect(calculateHrvMetrics([])).toBeNull();
  });
});

describe("calculateHrvMetrics: dataset numeroso (32 intervalli, verificato Python)", () => {
  it("SAMPLE_RR_INTERVALS_MS", () => {
    const m = calculateHrvMetrics([...SAMPLE_RR_INTERVALS_MS]);
    expect(m).not.toBeNull();
    expect(m!.validIntervalCount).toBe(32);
    expect(m!.totalDurationMs).toBe(25992);
    expect(m!.meanRrMs).toBeCloseTo(812.25, 4);
    expect(m!.derivedHeartRateBpm).toBeCloseTo(73.868883, 4);
    expect(m!.rmssdMs).toBeCloseTo(24.715151, 4);
    expect(m!.lnRmssd).toBeCloseTo(3.207416, 4);
    expect(m!.stdDevMs).toBeCloseTo(13.222659, 4);
  });
});

describe("parseRrInput: separatori", () => {
  it("spazio", () => {
    expect(parseRrInput("800 810 790 805", "ms").validIntervalsMs).toEqual([
      800, 810, 790, 805,
    ]);
  });
  it("newline", () => {
    expect(
      parseRrInput("800\n810\n790\n805", "ms").validIntervalsMs,
    ).toEqual([800, 810, 790, 805]);
  });
  it("virgola come separatore (nessun punto decimale nel testo, lista pulita)", () => {
    expect(
      parseRrInput("800,810,790,805", "ms").validIntervalsMs,
    ).toEqual([800, 810, 790, 805]);
  });
  it("punto e virgola", () => {
    expect(
      parseRrInput("800;810;790;805", "ms").validIntervalsMs,
    ).toEqual([800, 810, 790, 805]);
  });
  it("separatori misti (spazio + newline + virgola + punto e virgola)", () => {
    expect(
      parseRrInput("800, 810\n790; 805", "ms").validIntervalsMs,
    ).toEqual([800, 810, 790, 805]);
  });
});

describe("parseRrInput: unità", () => {
  it("secondi con punto decimale -> convertiti in ms", () => {
    const r = parseRrInput("0.800 0.810 0.790 0.805", "s");
    expect(r.validIntervalsMs).toEqual([800, 810, 790, 805]);
  });
  it("millisecondi interi", () => {
    const r = parseRrInput("800 810 790 805", "ms");
    expect(r.validIntervalsMs).toEqual([800, 810, 790, 805]);
  });
});

describe("parseRrInput, qualità dati: rifiuto esplicito, nessuna correzione automatica", () => {
  it("input vuoto -> nessun intervallo valido", () => {
    const r = parseRrInput("", "ms");
    expect(r.validIntervalsMs).toEqual([]);
    expect(r.totalTokensFound).toBe(0);
  });

  it("valori negativi rifiutati (non convertiti in positivi)", () => {
    const r = parseRrInput("800,-810,790", "ms");
    expect(r.validIntervalsMs).toEqual([800, 790]);
    expect(r.rejectedTokens).toContainEqual({ raw: "-810", reason: "negative" });
  });

  it("zero rifiutato", () => {
    const r = parseRrInput("800,0,790", "ms");
    expect(r.validIntervalsMs).toEqual([800, 790]);
    expect(r.rejectedTokens).toContainEqual({ raw: "0", reason: "zero" });
  });

  it("testo/NaN rifiutato", () => {
    const r = parseRrInput("800,abc,790", "ms");
    expect(r.validIntervalsMs).toEqual([800, 790]);
    expect(r.rejectedTokens).toContainEqual({ raw: "abc", reason: "non-numeric" });
  });

  it("un intervallo sospetto (fuori range fisiologico plausibile) NON viene rimosso automaticamente", () => {
    // 5000ms (12 bpm) è fisiologicamente estremo ma non zero/negativo/non-numerico:
    // lo spec vieta la rimozione automatica di intervalli sospetti.
    const r = parseRrInput("800,5000,790", "ms");
    expect(r.validIntervalsMs).toEqual([800, 5000, 790]);
    expect(r.rejectedTokens).toEqual([]);
  });
});

describe("parseRrInput: ambiguità virgola decimale (gestita esplicitamente, mai in silenzio)", () => {
  it("virgola-decimale ambigua senza punto altrove nel testo: esclusa, non indovinata", () => {
    const r = parseRrInput("800,5 810 790", "ms");
    expect(r.validIntervalsMs).toEqual([810, 790]);
    expect(r.ambiguousTokens).toHaveLength(1);
    expect(r.ambiguousTokens[0].raw).toBe("800,5");
    expect(r.ambiguousTokens[0].reason).toMatch(/ambiguo/i);
  });

  it("stesso pattern ma con un punto decimale già presente altrove -> virgola trattata come separatore, non ambigua", () => {
    const r = parseRrInput("800.0,5 810 790", "ms");
    // "800.0" è un token pulito, ",5" segue: qui il chunk "800.0,5" contiene
    // sia punto che virgola. hasDecimalPoint=true rende la virgola un
    // separatore -> split in "800.0" e "5".
    expect(r.ambiguousTokens).toEqual([]);
    expect(r.validIntervalsMs).toEqual([800, 5, 810, 790]);
  });

  it("lista pulita comma-separated a 3+ elementi non è mai ambigua", () => {
    const r = parseRrInput("800,810,790,805,812", "ms");
    expect(r.ambiguousTokens).toEqual([]);
    expect(r.validIntervalsMs).toEqual([800, 810, 790, 805, 812]);
  });

  it("il calcolo sul risultato ambiguo-escluso corrisponde alla verifica Python indipendente", () => {
    const r = parseRrInput("800,5 810 790", "ms");
    const m = calculateHrvMetrics(r.validIntervalsMs);
    expect(m).not.toBeNull();
    expect(m!.rmssdMs).toBeCloseTo(20, 6);
    expect(m!.meanRrMs).toBeCloseTo(800, 6);
    expect(m!.stdDevMs).toBeCloseTo(14.142136, 5);
  });
});

describe("arrotondamento: nessuna perdita di precisione nei valori intermedi", () => {
  it("valori non interi restano precisi fino alla presentazione (arrotondamento è responsabilità della UI)", () => {
    const m = calculateHrvMetrics([800, 810, 790, 805]);
    // Il motore ritorna float pieni; la UI arrotonda per la visualizzazione.
    expect(Number.isInteger(m!.rmssdMs)).toBe(false);
  });
});

describe("isShortSample", () => {
  it("sotto soglia -> true", () => {
    expect(isShortSample(SHORT_SAMPLE_INTERVAL_THRESHOLD - 1)).toBe(true);
  });
  it("alla soglia -> false", () => {
    expect(isShortSample(SHORT_SAMPLE_INTERVAL_THRESHOLD)).toBe(false);
  });
  it("sopra soglia -> false", () => {
    expect(isShortSample(SHORT_SAMPLE_INTERVAL_THRESHOLD + 10)).toBe(false);
  });
});

describe("isPhysiologicallyImplausible / findImplausibleIndices (P1.1 Fase 4)", () => {
  it("valori dentro il range plausibile -> false", () => {
    expect(isPhysiologicallyImplausible(800)).toBe(false);
    expect(isPhysiologicallyImplausible(PLAUSIBLE_RR_MIN_MS)).toBe(false);
    expect(isPhysiologicallyImplausible(PLAUSIBLE_RR_MAX_MS)).toBe(false);
  });
  it("sotto il minimo -> true", () => {
    expect(isPhysiologicallyImplausible(PLAUSIBLE_RR_MIN_MS - 1)).toBe(true);
  });
  it("sopra il massimo -> true", () => {
    expect(isPhysiologicallyImplausible(PLAUSIBLE_RR_MAX_MS + 1)).toBe(true);
  });
  it("findImplausibleIndices individua solo gli indici fuori range, preservando l'ordine, senza rimuovere nulla", () => {
    const intervals = [800, 100, 810, 5000, 790];
    expect(findImplausibleIndices(intervals)).toEqual([1, 3]);
    // L'array originale non viene mai mutato/filtrato da questa funzione.
    expect(intervals).toEqual([800, 100, 810, 5000, 790]);
  });
  it("nessun implausibile -> array vuoto", () => {
    expect(findImplausibleIndices([700, 800, 900])).toEqual([]);
  });
});
