import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { locales } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({
  limitByEmail: vi.fn(),
  limitByIp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("@/lib/rate-limit/limiter", () => ({
  limitForgotPasswordByEmail: (email: string) => mocks.limitByEmail(email),
  limitForgotPasswordByIp: (req: Request) => mocks.limitByIp(req),
}));

vi.mock("@/lib/supabase/recovery-client", () => ({
  createRecoveryClient: () => ({
    auth: { resetPasswordForEmail: mocks.resetPasswordForEmail },
  }),
}));

import { GET, POST } from "./route";

const ALLOW = { allowed: true, limit: 3, remaining: 2 };
const BLOCK = { allowed: false, limit: 3, remaining: 0 };
const EMAIL = "mario.rossi@example.com";
const IP = "203.0.113.7";

function post(body: unknown, extraHeaders: Record<string, string> = {}): Request {
  return new Request("https://www.fitmesh.fit/api/v1/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": IP, ...extraHeaders },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** Firma pubblica osservabile: cio' che un attaccante puo' misurare. */
async function publicShape(res: Response) {
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  return { status: res.status, contentType: headers["content-type"], body: await res.text(), headers };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limitByEmail.mockResolvedValue(ALLOW);
  mocks.limitByIp.mockResolvedValue(ALLOW);
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/v1/auth/forgot-password — percorso consentito", () => {
  it("chiama Supabase una sola volta, con redirectTo costruito server-side", async () => {
    const res = await POST(post({ email: EMAIL, locale: "it" }));

    expect(res.status).toBe(200);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledTimes(1);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(EMAIL, {
      redirectTo: "https://www.fitmesh.fit/it/auth/reset-password",
    });
  });

  it.each(locales)("locale '%s' produce il redirectTo corretto", async (locale) => {
    await POST(post({ email: EMAIL, locale }));
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(EMAIL, {
      redirectTo: `https://www.fitmesh.fit/${locale}/auth/reset-password`,
    });
  });
});

describe("POST — rate limit: Supabase non viene mai chiamato", () => {
  it("bucket email esaurito -> nessuna email inviata", async () => {
    mocks.limitByEmail.mockResolvedValue(BLOCK);
    const res = await POST(post({ email: EMAIL, locale: "it" }));

    expect(res.status).toBe(200);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("bucket IP esaurito -> nessuna email inviata", async () => {
    mocks.limitByIp.mockResolvedValue(BLOCK);
    const res = await POST(post({ email: EMAIL, locale: "it" }));

    expect(res.status).toBe(200);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  /**
   * Entrambi i limiter sono sempre invocati anche quando il primo blocca:
   * un corto circuito renderebbe il percorso strutturalmente diverso (una
   * query al DB invece di due) e quindi distinguibile dall'esterno.
   */
  it("valuta SEMPRE entrambi i bucket, anche se il primo blocca", async () => {
    mocks.limitByEmail.mockResolvedValue(BLOCK);
    await POST(post({ email: EMAIL, locale: "it" }));

    expect(mocks.limitByEmail).toHaveBeenCalledTimes(1);
    expect(mocks.limitByIp).toHaveBeenCalledTimes(1);
  });
});

describe("POST — la risposta pubblica non distingue MAI gli esiti", () => {
  it("esistente, inesistente e rate-limited sono indistinguibili", async () => {
    // "Esiste": Supabase risponde ok.
    const existing = await publicShape(await POST(post({ email: EMAIL, locale: "it" })));

    // "Non esiste": Supabase restituisce un errore. Deve restare invisibile.
    vi.clearAllMocks();
    mocks.limitByEmail.mockResolvedValue(ALLOW);
    mocks.limitByIp.mockResolvedValue(ALLOW);
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found", status: 400 },
    });
    const missing = await publicShape(await POST(post({ email: "nobody@example.com", locale: "it" })));

    // Rate limited.
    vi.clearAllMocks();
    mocks.limitByEmail.mockResolvedValue(BLOCK);
    mocks.limitByIp.mockResolvedValue(ALLOW);
    const limited = await publicShape(await POST(post({ email: EMAIL, locale: "it" })));

    expect(missing.status).toBe(existing.status);
    expect(limited.status).toBe(existing.status);
    expect(missing.body).toBe(existing.body);
    expect(limited.body).toBe(existing.body);
    expect(missing.contentType).toBe(existing.contentType);
    expect(limited.contentType).toBe(existing.contentType);
  });

  it("un'eccezione di Supabase resta invisibile", async () => {
    mocks.resetPasswordForEmail.mockRejectedValue(new Error("boom"));
    const res = await POST(post({ email: EMAIL, locale: "it" }));

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(JSON.stringify({ ok: true }));
  });

  it("env Supabase mancanti -> risposta neutra, non 500", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const res = await POST(post({ email: EMAIL, locale: "it" }));

    expect(res.status).toBe(200);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  /**
   * `buildRateLimitResponse()` non e' usata di proposito: il suo 429 con
   * Retry-After/X-RateLimit renderebbe il limite osservabile.
   */
  it("nessun header Retry-After o RateLimit in alcuno scenario", { timeout: 10_000 }, async () => {
    const scenarios = [
      async () => POST(post({ email: EMAIL, locale: "it" })),
      async () => {
        mocks.limitByEmail.mockResolvedValue(BLOCK);
        return POST(post({ email: EMAIL, locale: "it" }));
      },
      async () => {
        mocks.limitByIp.mockResolvedValue(BLOCK);
        return POST(post({ email: EMAIL, locale: "it" }));
      },
    ];

    for (const run of scenarios) {
      const { headers } = await publicShape(await run());
      for (const name of Object.keys(headers)) {
        expect(name).not.toMatch(/retry-after|ratelimit/i);
      }
    }
  });
});

describe("POST — locale non fidata, nessun open redirect", () => {
  it.each(["xx", "../evil", "https://evil.com", "", "it/../en"])(
    "locale '%s' ricade su 'en' e non entra nel redirectTo",
    async (locale) => {
      await POST(post({ email: EMAIL, locale }));

      const [, options] = mocks.resetPasswordForEmail.mock.calls[0] as [string, { redirectTo: string }];
      expect(options.redirectTo).toBe("https://www.fitmesh.fit/en/auth/reset-password");
    },
  );

  it(
    "il redirectTo punta sempre a www.fitmesh.fit e a una locale reale",
    { timeout: 20_000 }, // 17 iterazioni x >=350ms di pavimento minimo comune (vedi route.ts)
    async () => {
      for (const locale of [...locales, "xx", "//evil.com"]) {
        mocks.resetPasswordForEmail.mockClear();
        await POST(post({ email: EMAIL, locale }));
        const [, options] = mocks.resetPasswordForEmail.mock.calls[0] as [string, { redirectTo: string }];
        const url = new URL(options.redirectTo);
        expect(url.origin).toBe("https://www.fitmesh.fit");
        const segment = url.pathname.split("/")[1];
        expect(locales as readonly string[]).toContain(segment);
      }
    },
  );
});

describe("POST — richieste malformate: Supabase mai chiamato", () => {
  it("corpo non JSON -> 400", async () => {
    const res = await POST(post("{non-json"));
    expect(res.status).toBe(400);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("email mancante o invalida -> 400", async () => {
    for (const body of [{}, { email: "" }, { email: "nope" }, { email: 42 }]) {
      mocks.resetPasswordForEmail.mockClear();
      const res = await POST(post(body));
      expect(res.status).toBe(400);
      expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
    }
  });

  it("email oltre 254 caratteri -> 400", async () => {
    const long = `${"a".repeat(250)}@example.com`;
    const res = await POST(post({ email: long }));
    expect(res.status).toBe(400);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("Content-Type diverso da application/json -> 415", async () => {
    const res = await POST(post({ email: EMAIL }, { "content-type": "text/plain" }));
    expect(res.status).toBe(415);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("body oltre il tetto, dichiarato via content-length -> 413", async () => {
    const res = await POST(post({ email: EMAIL }, { "content-length": "99999" }));
    expect(res.status).toBe(413);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("body oltre il tetto SENZA content-length veritiero -> 413", async () => {
    // Content-Length assente: il tetto deve valere comunque sulla stringa
    // realmente letta, altrimenti si aggira mentendo sull'header.
    const huge = JSON.stringify({ email: EMAIL, padding: "x".repeat(5000) });
    const res = await POST(post(huge));
    expect(res.status).toBe(413);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("GET -> 405 con header Allow", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
  });
});

describe("POST — nessun dato personale nei log", () => {
  it("nessun console.* riceve email, IP o corpo, in nessuno scenario", async () => {
    const spies = {
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      info: vi.spyOn(console, "info").mockImplementation(() => {}),
    };

    const runs: Array<() => Promise<unknown>> = [
      () => POST(post({ email: EMAIL, locale: "it" })),
      () => {
        mocks.limitByEmail.mockResolvedValue(BLOCK);
        return POST(post({ email: EMAIL, locale: "it" }));
      },
      () => {
        mocks.resetPasswordForEmail.mockRejectedValue(new Error("boom"));
        return POST(post({ email: EMAIL, locale: "it" }));
      },
      () => {
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
        return POST(post({ email: EMAIL, locale: "it" }));
      },
      () => POST(post({ email: "nope" })),
    ];

    for (const run of runs) await run();

    const everythingLogged = Object.values(spies)
      .flatMap((spy) => spy.mock.calls.flat())
      .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
      .join(" | ");

    expect(everythingLogged).not.toContain(EMAIL);
    expect(everythingLogged).not.toContain("mario.rossi");
    expect(everythingLogged).not.toContain(IP);

    for (const spy of Object.values(spies)) spy.mockRestore();
  });
});

describe("POST — timing: il percorso bloccato non e' un fast-path", () => {
  /**
   * Verifica STRUTTURALE, non a cronometro: un'asserzione sui millisecondi
   * sarebbe intrinsecamente instabile in CI. Si misura solo che entrambi i
   * percorsi rispettino un pavimento minimo comune, con tolleranza ampia —
   * cio' che conta e' che il caso rate-limited non ritorni istantaneamente
   * mentre quello normale attende un round-trip.
   */
  it("consentito e bloccato impiegano entrambi almeno il minimo comune", async () => {
    const measure = async (setup: () => void) => {
      vi.clearAllMocks();
      mocks.limitByEmail.mockResolvedValue(ALLOW);
      mocks.limitByIp.mockResolvedValue(ALLOW);
      mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
      setup();
      const start = Date.now();
      await POST(post({ email: EMAIL, locale: "it" }));
      return Date.now() - start;
    };

    const allowedMs = await measure(() => {});
    const blockedMs = await measure(() => mocks.limitByEmail.mockResolvedValue(BLOCK));

    // Pavimento minimo dichiarato nel modulo (350ms) meno una tolleranza
    // generosa per la risoluzione del timer.
    expect(allowedMs).toBeGreaterThanOrEqual(300);
    expect(blockedMs).toBeGreaterThanOrEqual(300);
  });
});
