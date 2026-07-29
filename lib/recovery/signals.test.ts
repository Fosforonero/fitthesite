import { describe, expect, it } from "vitest";

import { classifyRecoveryArrival, hasRecoverySignal, stripRecoveryParams } from "./signals";

describe("hasRecoverySignal — query string", () => {
  it.each([
    "?token=abc123",
    "?token_hash=abc123",
    "?code=abc123",
    "?error_code=otp_expired",
    "?error_description=Email%20link%20is%20invalid",
    "?type=recovery",
  ])("rileva il segnale in '%s'", (search) => {
    expect(hasRecoverySignal(search)).toBe(true);
  });

  it("rileva anche senza il punto interrogativo iniziale", () => {
    expect(hasRecoverySignal("token=abc123")).toBe(true);
  });
});

describe("hasRecoverySignal — fragment", () => {
  it.each([
    "#token=abc123",
    "#token_hash=abc123",
    "#code=abc123",
    "#error_code=otp_expired",
    "#error_description=Email%20link%20is%20invalid&error=access_denied",
    "#type=recovery",
  ])("rileva il segnale nel fragment '%s'", (hash) => {
    expect(hasRecoverySignal("", hash)).toBe(true);
  });
});

describe("hasRecoverySignal — falsi positivi da evitare", () => {
  it("type con valore non-recovery non conta", () => {
    expect(hasRecoverySignal("?type=ring")).toBe(false);
  });

  it("stringa vuota", () => {
    expect(hasRecoverySignal("")).toBe(false);
  });

  it("parametri non correlati (utm_source)", () => {
    expect(hasRecoverySignal("?utm_source=newsletter&utm_medium=email")).toBe(false);
  });
});

describe("classifyRecoveryArrival", () => {
  it("stale_link quando c'e' un segnale", () => {
    expect(classifyRecoveryArrival("?error_code=otp_expired")).toBe("stale_link");
  });

  it("none quando non c'e' nulla", () => {
    expect(classifyRecoveryArrival("?utm_source=x")).toBe("none");
  });
});

describe("stripRecoveryParams", () => {
  it("rimuove tutti i parametri di recovery", () => {
    const result = stripRecoveryParams(
      "/it/auth/reset-password",
      "?token=abc&token_hash=def&code=ghi&error_code=otp_expired&error_description=x&type=recovery",
    );
    expect(result).toBe("/it/auth/reset-password");
  });

  it("preserva parametri NON di recovery", () => {
    const result = stripRecoveryParams("/it/auth/reset-password", "?token=abc&utm_source=newsletter");
    expect(result).toBe("/it/auth/reset-password?utm_source=newsletter");
  });

  it("non lascia mai un '?' finale quando non resta nulla", () => {
    const result = stripRecoveryParams("/it/auth/reset-password", "?error_code=otp_expired");
    expect(result.endsWith("?")).toBe(false);
    expect(result).toBe("/it/auth/reset-password");
  });

  it("e' un no-op se non c'e' query string", () => {
    expect(stripRecoveryParams("/it/auth/reset-password", "")).toBe("/it/auth/reset-password");
  });
});
