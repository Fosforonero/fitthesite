/**
 * Sprint P0.10C — test del meccanismo REALE di fail-open (non solo del
 * pass-through lato route, coperto invece in app/api/v1/sync/route.test.ts).
 * Mocka @supabase/ssr (non @supabase/supabase-js: il limiter usa createServerClient
 * per restare eseguibile da Edge/Middleware anche se oggi e' chiamato dalla
 * Function stessa).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ rpc: mocks.rpc }),
}));

const { limitSync, limitSignup, limitInvitePreview, buildRateLimitResponse } =
  await import("./limiter");

function makeReq(headers: Record<string, string> = {}) {
  return new Request("https://fitmesh.fit/api/v1/sync", { headers });
}

describe("lib/rate-limit/limiter — limitSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xcdyhkuyxukaifhhtadr.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("allowed=true quando la RPC risponde sotto il limite", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 59 }], error: null });
    const result = await limitSync(makeReq());
    expect(result).toEqual({ allowed: true, limit: 60, remaining: 59 });
  });

  it("allowed=false quando la RPC segnala il limite superato (60/min invariato)", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ allowed: false, remaining: 0 }], error: null });
    const result = await limitSync(makeReq());
    expect(result).toEqual({ allowed: false, limit: 60, remaining: 0 });
  });

  it("fail-open: eccezione di rete dalla RPC -> allowed=true (mai bloccare prod per un nostro outage)", async () => {
    mocks.rpc.mockRejectedValue(new Error("network down"));
    const result = await limitSync(makeReq());
    expect(result.allowed).toBe(true);
  });

  it("fail-open: la RPC risponde con un errore Postgres -> allowed=true", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const result = await limitSync(makeReq());
    expect(result.allowed).toBe(true);
  });

  it("fail-open: env var Supabase mancanti -> allowed=true, RPC mai chiamata", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const result = await limitSync(makeReq());
    expect(result.allowed).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("keying per user_id dal JWT bearer NON verificato (rate limit non e' un security boundary)", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 59 }], error: null });
    const sub = "11111111-1111-1111-1111-111111111111";
    const fakeJwt = `header.${Buffer.from(JSON.stringify({ sub })).toString("base64")}.sig`;
    await limitSync(makeReq({ authorization: `Bearer ${fakeJwt}` }));
    expect(mocks.rpc).toHaveBeenCalledWith("rate_limit_check", {
      p_key: `sync:user:${sub}`,
      p_max: 60,
      p_window_seconds: 60,
    });
  });

  it("nessun bearer valido -> fallback keying per IP (x-forwarded-for, primo hop)", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 59 }], error: null });
    await limitSync(makeReq({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }));
    expect(mocks.rpc).toHaveBeenCalledWith("rate_limit_check", {
      p_key: "sync:ip:203.0.113.5",
      p_max: 60,
      p_window_seconds: 60,
    });
  });
});

describe("lib/rate-limit/limiter — limitSignup/limitInvitePreview invariati", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xcdyhkuyxukaifhhtadr.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("limitSignup: 10/min per IP, non toccato da P0.10C", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 9 }], error: null });
    await limitSignup(makeReq({ "x-forwarded-for": "203.0.113.9" }));
    expect(mocks.rpc).toHaveBeenCalledWith("rate_limit_check", {
      p_key: "signup:ip:203.0.113.9",
      p_max: 10,
      p_window_seconds: 60,
    });
  });

  it("limitInvitePreview: 20/min per IP, non toccato da P0.10C", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 19 }], error: null });
    await limitInvitePreview(makeReq({ "x-forwarded-for": "203.0.113.9" }));
    expect(mocks.rpc).toHaveBeenCalledWith("rate_limit_check", {
      p_key: "invite:ip:203.0.113.9",
      p_max: 20,
      p_window_seconds: 60,
    });
  });
});

describe("lib/rate-limit/limiter — buildRateLimitResponse", () => {
  it("429 con header RateLimit-* e retry-after invariati", async () => {
    const res = buildRateLimitResponse({ allowed: false, limit: 60, remaining: 0 });
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
    expect(res.headers.get("x-ratelimit-limit")).toBe("60");
    expect(res.headers.get("x-ratelimit-remaining")).toBe("0");
    const body = await res.json();
    expect(body).toMatchObject({ error: "rate_limited", retryAfter: 60 });
  });
});
