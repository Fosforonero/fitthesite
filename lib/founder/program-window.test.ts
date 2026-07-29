import { describe, expect, it } from "vitest";

import { FOUNDER_END_AT, FOUNDER_END_AT_MS, formatFounderEndDate, isFounderProgramOpen } from "./program-window";

describe("FOUNDER_END_AT", () => {
  it("è 2026-07-31T22:00:00Z, cioè 2026-08-01T00:00:00+02:00 (CEST)", () => {
    expect(FOUNDER_END_AT).toBe("2026-07-31T22:00:00Z");
    const asCest = new Date(FOUNDER_END_AT_MS).toLocaleString("en-US", { timeZone: "Europe/Rome" });
    expect(asCest).toBe("8/1/2026, 12:00:00 AM");
  });
});

// Orologio sempre iniettato come parametro esplicito, mai vi.setSystemTime:
// non tocchiamo l'ora di sistema del processo di test.
describe("isFounderProgramOpen: confine esatto al millisecondo", () => {
  it("cutoff - 1ms: aperto", () => {
    expect(isFounderProgramOpen(new Date(FOUNDER_END_AT_MS - 1))).toBe(true);
  });

  it("cutoff esatto: chiuso (< strict, non <=)", () => {
    expect(isFounderProgramOpen(new Date(FOUNDER_END_AT_MS))).toBe(false);
  });

  it("cutoff + 1ms: chiuso", () => {
    expect(isFounderProgramOpen(new Date(FOUNDER_END_AT_MS + 1))).toBe(false);
  });

  it("un secondo prima: aperto", () => {
    expect(isFounderProgramOpen(new Date(FOUNDER_END_AT_MS - 1000))).toBe(true);
  });

  it("un secondo dopo: chiuso", () => {
    expect(isFounderProgramOpen(new Date(FOUNDER_END_AT_MS + 1000))).toBe(false);
  });

  it("un giorno prima: aperto", () => {
    expect(isFounderProgramOpen(new Date(FOUNDER_END_AT_MS - 24 * 3600 * 1000))).toBe(true);
  });

  it("un giorno dopo: chiuso", () => {
    expect(isFounderProgramOpen(new Date(FOUNDER_END_AT_MS + 24 * 3600 * 1000))).toBe(false);
  });

  it("default now(): non lancia e ritorna un boolean (non fissiamo un valore, il test non deve diventare falso col tempo reale)", () => {
    expect(typeof isFounderProgramOpen()).toBe("boolean");
  });
});

describe("formatFounderEndDate", () => {
  it("it: 31 luglio 2026", () => {
    expect(formatFounderEndDate("it")).toBe("31 luglio 2026");
  });
  it("en: July 31, 2026", () => {
    expect(formatFounderEndDate("en")).toBe("July 31, 2026");
  });
  it("locale sconosciuta usa il fallback en-US", () => {
    expect(formatFounderEndDate("xx")).toBe("July 31, 2026");
  });
});
