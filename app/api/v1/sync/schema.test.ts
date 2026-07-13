import { describe, expect, it } from "vitest";

import { buildFitnessMetricsRow, payloadSchema } from "./schema";

const BASE_PAYLOAD = {
  windowStartMillis: 1_720_000_000_000,
  windowEndMillis: 1_720_003_600_000,
  collectedAtMillis: 1_720_003_600_000,
};

describe("payloadSchema — hrvRmssd / hrvSdnn contract", () => {
  it("accetta hrvRmssd e hrvSdnn insieme, come campi distinti", () => {
    const parsed = payloadSchema.parse({
      ...BASE_PAYLOAD,
      hrvRmssd: 45.7,
      hrvSdnn: 62.3,
    });
    expect(parsed.hrvRmssd).toBe(45.7);
    expect(parsed.hrvSdnn).toBe(62.3);
    expect(parsed.hrvRmssd).not.toBe(parsed.hrvSdnn);
  });

  it("payload legacy senza hrvSdnn resta valido (client Android pre-187B)", () => {
    const parsed = payloadSchema.parse({
      ...BASE_PAYLOAD,
      hrvRmssd: 50,
    });
    expect(parsed.hrvRmssd).toBe(50);
    expect(parsed.hrvSdnn).toBeUndefined();
  });

  it("payload solo-SDNN (iOS/HealthKit) non forza ne' deriva hrvRmssd", () => {
    const parsed = payloadSchema.parse({
      ...BASE_PAYLOAD,
      hrvSdnn: 58.1,
    });
    expect(parsed.hrvSdnn).toBe(58.1);
    expect(parsed.hrvRmssd).toBeUndefined();
  });

  it("payload senza alcun campo HRV resta valido (wearable senza sensore)", () => {
    const parsed = payloadSchema.parse({ ...BASE_PAYLOAD });
    expect(parsed.hrvRmssd).toBeUndefined();
    expect(parsed.hrvSdnn).toBeUndefined();
  });
});

describe("buildFitnessMetricsRow — hrv_rmssd / hrv_sdnn restano colonne separate", () => {
  const ctx = { userId: "user-1", deviceId: "device-1" };

  it("arrotonda entrambi i valori in colonne indipendenti quando presenti", () => {
    const p = payloadSchema.parse({
      ...BASE_PAYLOAD,
      hrvRmssd: 45.7,
      hrvSdnn: 62.3,
    });
    const row = buildFitnessMetricsRow(p, ctx);
    expect(row.hrv_rmssd).toBe(46);
    expect(row.hrv_sdnn).toBe(62);
    expect(row.hrv_rmssd).not.toBe(row.hrv_sdnn);
  });

  it("hrv_sdnn resta null quando il client non lo manda (legacy)", () => {
    const p = payloadSchema.parse({ ...BASE_PAYLOAD, hrvRmssd: 45 });
    const row = buildFitnessMetricsRow(p, ctx);
    expect(row.hrv_rmssd).toBe(45);
    expect(row.hrv_sdnn).toBeNull();
  });

  it("hrv_rmssd resta null quando la fonte e' solo SDNN (iOS)", () => {
    const p = payloadSchema.parse({ ...BASE_PAYLOAD, hrvSdnn: 62 });
    const row = buildFitnessMetricsRow(p, ctx);
    expect(row.hrv_rmssd).toBeNull();
    expect(row.hrv_sdnn).toBe(62);
  });

  it("mai deriva un valore dall'altro: entrambi assenti restano entrambi null", () => {
    const p = payloadSchema.parse({ ...BASE_PAYLOAD });
    const row = buildFitnessMetricsRow(p, ctx);
    expect(row.hrv_rmssd).toBeNull();
    expect(row.hrv_sdnn).toBeNull();
  });
});

describe("buildFitnessMetricsRow — normalizzazione legacy sorgenti iOS", () => {
  const ctx = { userId: "user-1", deviceId: "device-1" };

  it("payload iOS legacy (source=healthkit, solo hrvRmssd) -> salvato come SOLO hrv_sdnn", () => {
    const p = payloadSchema.parse({
      ...BASE_PAYLOAD,
      source: "healthkit",
      hrvRmssd: 45,
    });
    const row = buildFitnessMetricsRow(p, ctx);
    expect(row.hrv_sdnn).toBe(45);
    expect(row.hrv_rmssd).toBeNull();
  });

  it("payload iOS legacy (source=apple_health, solo hrvRmssd) -> stesso comportamento", () => {
    const p = payloadSchema.parse({
      ...BASE_PAYLOAD,
      source: "apple_health",
      hrvRmssd: 58,
    });
    const row = buildFitnessMetricsRow(p, ctx);
    expect(row.hrv_sdnn).toBe(58);
    expect(row.hrv_rmssd).toBeNull();
  });

  it("payload iOS 187+ (source=healthkit, hrvSdnn esplicito) -> hrv_sdnn preferito su un hrvRmssd legacy eventualmente presente", () => {
    const p = payloadSchema.parse({
      ...BASE_PAYLOAD,
      source: "healthkit",
      hrvSdnn: 62,
    });
    const row = buildFitnessMetricsRow(p, ctx);
    expect(row.hrv_sdnn).toBe(62);
    expect(row.hrv_rmssd).toBeNull();
  });

  it("sorgente Android legacy (source=health_connect) NON viene normalizzata: hrvRmssd resta RMSSD genuino", () => {
    const p = payloadSchema.parse({
      ...BASE_PAYLOAD,
      source: "health_connect",
      hrvRmssd: 50,
    });
    const row = buildFitnessMetricsRow(p, ctx);
    expect(row.hrv_rmssd).toBe(50);
    expect(row.hrv_sdnn).toBeNull();
  });

  it("REGRESSIONE: un payload iOS con ENTRAMBI i campi non puo' mai lasciare la riga dual-valued — hrv_sdnn vince, hrv_rmssd resta sempre null", () => {
    const healthkit = buildFitnessMetricsRow(
      payloadSchema.parse({
        ...BASE_PAYLOAD,
        source: "healthkit",
        hrvRmssd: 45,
        hrvSdnn: 62,
      }),
      ctx,
    );
    expect(healthkit.hrv_sdnn).toBe(62);
    expect(healthkit.hrv_rmssd).toBeNull();

    const appleHealth = buildFitnessMetricsRow(
      payloadSchema.parse({
        ...BASE_PAYLOAD,
        source: "apple_health",
        hrvRmssd: 45,
        hrvSdnn: 62,
      }),
      ctx,
    );
    expect(appleHealth.hrv_sdnn).toBe(62);
    expect(appleHealth.hrv_rmssd).toBeNull();
  });
});
