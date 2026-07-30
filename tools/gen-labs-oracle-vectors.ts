/**
 * P1.1 Fase 7 - genera i vettori di test per l'oracle Python indipendente.
 *
 * Calcola i risultati con l'implementazione TypeScript REALE (le stesse
 * funzioni usate dall'app: calculateHrvMetrics, calculateSleepEfficiency),
 * poi scrive {input, tsResult} in un file JSON che scripts/oracle/compare.py
 * legge, ricalcola con l'oracle Python indipendente, e confronta.
 *
 * Include sia casi noti a mano sia casi pseudo-casuali ma DETERMINISTICI
 * (seed fisso, mai Math.random()): la stessa esecuzione produce sempre lo
 * stesso set di vettori, così il confronto è riproducibile.
 */
import fs from "node:fs";
import path from "node:path";
import { calculateHrvMetrics } from "../lib/labs/hrv/rmssd-math";
import { calculateSleepEfficiency, type SleepEfficiencyInput } from "../lib/labs/sleep-efficiency/math";
import { calculateHeartRateZones, type HeartRateZonesInput } from "../lib/labs/heart-rate-zones/math";

const repoRoot = path.resolve(__dirname, "..");
const OUT_PATH = path.join(repoRoot, ".oracle-vectors.json");

/** mulberry32: PRNG deterministico, seed fisso - mai Math.random(). */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260717);
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// ── Vettori HRV ──────────────────────────────────────────────────────
const hrvVectors: Array<{ label: string; intervalsMs: number[] }> = [
  { label: "known-10", intervalsMs: [812, 828, 795, 840, 803, 822, 788, 831, 806, 819] },
  { label: "constant", intervalsMs: [800, 800, 800, 800, 800] },
  { label: "two-values", intervalsMs: [750, 900] },
  { label: "alternating", intervalsMs: [700, 900, 700, 900, 700, 900] },
];
for (let v = 0; v < 20; v++) {
  const n = randInt(2, 60);
  const intervalsMs = Array.from({ length: n }, () => randInt(400, 1600));
  hrvVectors.push({ label: `random-${v}`, intervalsMs });
}

const hrvResults = hrvVectors.map(({ label, intervalsMs }) => {
  const m = calculateHrvMetrics(intervalsMs);
  return { label, input: { intervalsMs }, tsResult: m };
});

// ── Vettori Sleep Efficiency ─────────────────────────────────────────
const simpleVectors: SleepEfficiencyInput[] = [
  { mode: "simple", timeInBedMinutes: 480, totalSleepTimeMinutes: 420 },
  { mode: "simple", timeInBedMinutes: 420, totalSleepTimeMinutes: 420 },
  { mode: "simple", timeInBedMinutes: 600, totalSleepTimeMinutes: 550 },
];
for (let v = 0; v < 15; v++) {
  const timeInBedMinutes = randInt(60, 700);
  const totalSleepTimeMinutes = randInt(0, 700);
  simpleVectors.push({ mode: "simple", timeInBedMinutes, totalSleepTimeMinutes });
}

const advancedVectors: SleepEfficiencyInput[] = [
  {
    mode: "advanced",
    bedMinutes: 23 * 60 + 30,
    outOfBedMinutes: 7 * 60 + 15,
    sleepOnsetLatencyMinutes: 15,
    wakeAfterSleepOnsetMinutes: 20,
    finalWakeMinutes: 5,
  },
  {
    mode: "advanced",
    bedMinutes: 14 * 60,
    outOfBedMinutes: 15 * 60 + 30,
    sleepOnsetLatencyMinutes: 10,
    wakeAfterSleepOnsetMinutes: 0,
    finalWakeMinutes: 0,
  },
];
for (let v = 0; v < 15; v++) {
  const bedMinutes = randInt(0, 1439);
  let outOfBedMinutes = randInt(0, 1439);
  // Evita orari identici (input ambiguo, rifiutato a monte dalla
  // validazione - non è un caso interessante per l'oracle di calcolo).
  if (outOfBedMinutes === bedMinutes) outOfBedMinutes = (outOfBedMinutes + 1) % 1440;
  advancedVectors.push({
    mode: "advanced",
    bedMinutes,
    outOfBedMinutes,
    sleepOnsetLatencyMinutes: randInt(0, 60),
    wakeAfterSleepOnsetMinutes: randInt(0, 60),
    finalWakeMinutes: randInt(0, 30),
  });
}

const sleepEfficiencyResults = [...simpleVectors, ...advancedVectors].map((input, i) => {
  const outcome = calculateSleepEfficiency(input);
  return {
    label: `${input.mode}-${i}`,
    input,
    // Solo esiti validi hanno senso per l'oracle di calcolo: la validazione
    // (blocking errors) è già coperta da math.test.ts, non da questo confronto.
    tsResult: outcome.ok ? outcome.result : null,
  };
});
const sleepEfficiencyValid = sleepEfficiencyResults.filter((r) => r.tsResult !== null);

// ── Vettori Sleep Efficiency deliberatamente IMPOSSIBILI (P1.1B Fase 3) ──
// A differenza dei vettori sopra, qui l'oracle non confronta un valore
// calcolato (non esiste, l'input è bloccato): confronta il CODICE d'errore
// che TypeScript riporta con una classificazione Python scritta in modo
// indipendente (scripts/oracle/sleep_efficiency_oracle.py,
// classify_expected_error) - prova che le due implementazioni concordano su
// COSA sia impossibile, non solo su come calcolare ciò che è possibile.
const impossibleVectors: SleepEfficiencyInput[] = [
  // Semplice: dormito > a letto.
  { mode: "simple", timeInBedMinutes: 400, totalSleepTimeMinutes: 420 },
  { mode: "simple", timeInBedMinutes: 60, totalSleepTimeMinutes: 61 },
  { mode: "simple", timeInBedMinutes: 300, totalSleepTimeMinutes: 301 },
  // Avanzata: latenza+WASO+veglia finale > TIB (TST derivato negativo).
  {
    mode: "advanced",
    bedMinutes: 60,
    outOfBedMinutes: 120, // TIB = 60
    sleepOnsetLatencyMinutes: 40,
    wakeAfterSleepOnsetMinutes: 30,
    finalWakeMinutes: 0, // awake = 70 > 60
  },
  {
    mode: "advanced",
    bedMinutes: 23 * 60,
    outOfBedMinutes: 23 * 60 + 30, // TIB = 30 (nessun attraversamento mezzanotte)
    sleepOnsetLatencyMinutes: 20,
    wakeAfterSleepOnsetMinutes: 20,
    finalWakeMinutes: 0, // awake = 40 > 30
  },
];
for (let v = 0; v < 10; v++) {
  const timeInBedMinutes = randInt(60, 500);
  // Forza dormito > a letto di un margine casuale ma sempre positivo.
  const totalSleepTimeMinutes = timeInBedMinutes + randInt(1, 200);
  impossibleVectors.push({ mode: "simple", timeInBedMinutes, totalSleepTimeMinutes });
}
const sleepEfficiencyErrors = impossibleVectors.map((input, i) => {
  const outcome = calculateSleepEfficiency(input);
  if (outcome.ok) {
    throw new Error(
      `Vettore impossibile #${i} (${JSON.stringify(input)}) è stato calcolato come valido: la generazione dei vettori oracle presume che sia bloccato.`,
    );
  }
  const code = outcome.errors[0]?.code;
  return { label: `${input.mode}-impossible-${i}`, input, expectedErrorCode: code };
});

// ── Vettori Heart Rate Zones ─────────────────────────────────────────
const heartRateZonesVectors: HeartRateZonesInput[] = [
  { maxHrMode: "estimated", age: 40, restingHr: 60 },
  { maxHrMode: "measured", measuredMaxHr: 185, restingHr: 52 },
  { maxHrMode: "estimated", age: 20, restingHr: 70 },
  { maxHrMode: "estimated", age: 65, restingHr: 55 },
];
for (let v = 0; v < 15; v++) {
  const age = randInt(10, 85);
  const maxHr = 208 - 0.7 * age;
  const restingHr = randInt(30, Math.min(140, Math.floor(maxHr) - 5));
  heartRateZonesVectors.push({ maxHrMode: "estimated", age, restingHr });
}
for (let v = 0; v < 10; v++) {
  const measuredMaxHr = randInt(110, 225);
  const restingHr = randInt(25, measuredMaxHr - 5);
  heartRateZonesVectors.push({ maxHrMode: "measured", measuredMaxHr, restingHr });
}

const heartRateZonesResults = heartRateZonesVectors.map((input, i) => {
  const outcome = calculateHeartRateZones(input);
  return {
    label: `${input.maxHrMode}-${i}`,
    input,
    tsResult: outcome.ok ? outcome.result : null,
  };
});
const heartRateZonesValid = heartRateZonesResults.filter((r) => r.tsResult !== null);

// ── Vettori Heart Rate Zones deliberatamente IMPOSSIBILI (FC riposo >= FC max) ──
const impossibleHeartRateZonesVectors: HeartRateZonesInput[] = [
  { maxHrMode: "estimated", age: 90, restingHr: 148 },
  { maxHrMode: "measured", measuredMaxHr: 140, restingHr: 140 },
  { maxHrMode: "measured", measuredMaxHr: 120, restingHr: 130 },
];
for (let v = 0; v < 10; v++) {
  const measuredMaxHr = randInt(100, 150);
  const restingHr = measuredMaxHr + randInt(0, 5);
  if (restingHr > 150) continue; // resta dentro il range assoluto RESTING_HR_OUT_OF_RANGE, isola solo il caso "impossibile"
  impossibleHeartRateZonesVectors.push({ maxHrMode: "measured", measuredMaxHr, restingHr });
}
const heartRateZonesErrors = impossibleHeartRateZonesVectors.map((input, i) => {
  const outcome = calculateHeartRateZones(input);
  if (outcome.ok) {
    throw new Error(
      `Vettore HR zones impossibile #${i} (${JSON.stringify(input)}) è stato calcolato come valido: la generazione dei vettori oracle presume che sia bloccato.`,
    );
  }
  const code = outcome.errors.find((e) => e.code === "RESTING_HR_NOT_BELOW_MAX")?.code ?? outcome.errors[0]?.code;
  return { label: `hrzones-impossible-${i}`, input, expectedErrorCode: code };
});

fs.writeFileSync(
  OUT_PATH,
  JSON.stringify(
    {
      hrv: hrvResults,
      sleepEfficiency: sleepEfficiencyValid,
      sleepEfficiencyErrors,
      heartRateZones: heartRateZonesValid,
      heartRateZonesErrors,
    },
    null,
    2,
  ),
);

console.log(
  `✅ Vettori oracle scritti in ${path.relative(repoRoot, OUT_PATH)}: ${hrvResults.length} HRV, ${sleepEfficiencyValid.length} Sleep Efficiency (validi), ${sleepEfficiencyErrors.length} Sleep Efficiency (errori attesi), ${heartRateZonesValid.length} Heart Rate Zones (validi), ${heartRateZonesErrors.length} Heart Rate Zones (errori attesi).`,
);
