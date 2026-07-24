import { describe, expect, it } from "vitest";

import { classifyRecoveryError } from "./classify-error";

describe("classifyRecoveryError", () => {
  it("classifies a rate-limit status as rate_limited", () => {
    expect(classifyRecoveryError({ status: 429, message: "too many requests" })).toBe(
      "rate_limited",
    );
  });

  it("classifies an explicit rate_limit code as rate_limited", () => {
    expect(classifyRecoveryError({ code: "over_email_send_rate_limit" })).toBe("rate_limited");
  });

  it("classifies otp_expired code as expired_or_used", () => {
    expect(classifyRecoveryError({ code: "otp_expired" })).toBe("expired_or_used");
  });

  it("classifies a generic expired/invalid-token message as expired_or_used", () => {
    expect(classifyRecoveryError({ message: "Token has expired or is invalid" })).toBe(
      "expired_or_used",
    );
  });

  it("classifies a TypeError (fetch failure) as network", () => {
    expect(classifyRecoveryError(new TypeError("Failed to fetch"))).toBe("network");
  });

  it("classifies a message mentioning network as network", () => {
    expect(classifyRecoveryError({ message: "network request failed" })).toBe("network");
  });

  it("falls back to generic for anything unrecognized", () => {
    expect(classifyRecoveryError({ message: "something else entirely" })).toBe("generic");
    expect(classifyRecoveryError(null)).toBe("generic");
    expect(classifyRecoveryError(undefined)).toBe("generic");
  });

  it("never echoes the raw error message back (no PII/token leak surface)", () => {
    const secretish = { message: "token abc123 for user@example.com is invalid" };
    const kind = classifyRecoveryError(secretish);
    // Il valore di ritorno e' sempre uno dei 4 kind noti, mai il messaggio grezzo.
    expect(["expired_or_used", "rate_limited", "network", "generic"]).toContain(kind);
    expect(kind).not.toContain("@");
    expect(kind).not.toContain("abc123");
  });
});
