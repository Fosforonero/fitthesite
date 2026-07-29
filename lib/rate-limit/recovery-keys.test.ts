import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ rpc: mocks.rpc }),
}));

import {
  limitForgotPasswordByEmail,
  limitForgotPasswordByIp,
  normalizeRecoveryEmail,
} from "./limiter";

const EMAIL = "mario.rossi@example.com";
const IP_REQUEST = new Request("https://www.fitmesh.fit/api/v1/auth/forgot-password", {
  headers: { "x-forwarded-for": "203.0.113.7" },
});

function capturedKey(): string {
  return mocks.rpc.mock.calls[0]?.[1]?.p_key as string;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 2 }], error: null });
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("normalizeRecoveryEmail", () => {
  it("applica trim e lowercase", () => {
    expect(normalizeRecoveryEmail("  Mario@Rossi.IT  ")).toBe("mario@rossi.it");
  });

  it("NON rimuove il plus-address", () => {
    // Deliberato: mario+tag@x.it e mario@x.it sono account potenzialmente
    // diversi per Supabase Auth. Fonderli permetterebbe a un utente di
    // esaurire il bucket di un altro.
    expect(normalizeRecoveryEmail("mario+fitmesh@rossi.it")).toBe("mario+fitmesh@rossi.it");
  });
});

describe("limitForgotPasswordByEmail — chiave opaca", () => {
  it("non contiene l'email in chiaro", async () => {
    await limitForgotPasswordByEmail(EMAIL);
    const key = capturedKey();
    expect(key).not.toContain(EMAIL);
    expect(key).not.toContain("mario.rossi");
    expect(key).not.toContain("example.com");
  });

  it("usa il namespace recovery:email:", async () => {
    await limitForgotPasswordByEmail(EMAIL);
    expect(capturedKey().startsWith("recovery:email:")).toBe(true);
  });

  it("e' deterministica: stessa email normalizzata -> stessa chiave", async () => {
    await limitForgotPasswordByEmail(" Mario.Rossi@EXAMPLE.com ");
    const first = capturedKey();
    mocks.rpc.mockClear();
    await limitForgotPasswordByEmail("mario.rossi@example.com");
    const second = capturedKey();
    expect(first).toBe(second);
  });

  it("plus-address produce una chiave DIVERSA (nessuno stripping)", async () => {
    await limitForgotPasswordByEmail("mario@example.com");
    const base = capturedKey();
    mocks.rpc.mockClear();
    await limitForgotPasswordByEmail("mario+other@example.com");
    const plus = capturedKey();
    expect(plus).not.toBe(base);
  });

  it("usa il limite documentato: 3 ogni 900 secondi", async () => {
    await limitForgotPasswordByEmail(EMAIL);
    const [, args] = mocks.rpc.mock.calls[0] as [string, { p_max: number; p_window_seconds: number }];
    expect(args.p_max).toBe(3);
    expect(args.p_window_seconds).toBe(900);
  });
});

describe("limitForgotPasswordByIp — chiave opaca", () => {
  it("non contiene l'IP in chiaro", async () => {
    await limitForgotPasswordByIp(IP_REQUEST);
    expect(capturedKey()).not.toContain("203.0.113.7");
  });

  it("usa il namespace recovery:ip:, distinto da recovery:email:", async () => {
    await limitForgotPasswordByIp(IP_REQUEST);
    const ipKey = capturedKey();
    mocks.rpc.mockClear();
    await limitForgotPasswordByEmail(EMAIL);
    const emailKey = capturedKey();

    expect(ipKey.startsWith("recovery:ip:")).toBe(true);
    expect(emailKey.startsWith("recovery:email:")).toBe(true);
    expect(ipKey).not.toBe(emailKey);
  });

  it("usa il limite documentato: 20 ogni 900 secondi", async () => {
    await limitForgotPasswordByIp(IP_REQUEST);
    const [, args] = mocks.rpc.mock.calls[0] as [string, { p_max: number; p_window_seconds: number }];
    expect(args.p_max).toBe(20);
    expect(args.p_window_seconds).toBe(900);
  });
});

describe("fail-open — policy pre-esistente del modulo, non modificata qui", () => {
  it("un errore RPC permette la richiesta", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    const result = await limitForgotPasswordByEmail(EMAIL);
    expect(result.allowed).toBe(true);
  });

  it("un'eccezione di rete permette la richiesta", async () => {
    mocks.rpc.mockRejectedValue(new Error("network"));
    const result = await limitForgotPasswordByIp(IP_REQUEST);
    expect(result.allowed).toBe(true);
  });

  it("env Supabase mancanti permettono la richiesta", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const result = await limitForgotPasswordByEmail(EMAIL);
    expect(result.allowed).toBe(true);
  });
});
