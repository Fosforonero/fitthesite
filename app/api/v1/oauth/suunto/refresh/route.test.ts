/**
 * Test della route refresh Suunto con fetch simulato (nessuna rete).
 * Il rate limit e' in memoria e per IP: ogni test usa un IP proprio.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const SECRET = "SEGRETO-CLIENT-xyz987";
const CLIENT_ID = "ID-CLIENT-abc123";
const SUB_KEY = "CHIAVE-SUB-qqq555";
const CODE = "CODICE-UTENTE-secret-777";

let ipCounter = 0;
function req(body: unknown, ip?: string): Request {
  ipCounter++;
  return new Request("https://www.fitmesh.fit/api/v1/oauth/suunto/refresh", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip ?? `10.2.0.${ipCounter}`,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function jwt(exp: number): string {
  const p = Buffer.from(JSON.stringify({ exp })).toString("base64");
  return `h.${p}.s`;
}

let warn: ReturnType<typeof vi.spyOn>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.SUUNTO_CLIENT_ID = CLIENT_ID;
  process.env.SUUNTO_CLIENT_SECRET = SECRET;
  process.env.SUUNTO_SUBSCRIPTION_KEY = SUB_KEY;
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.SUUNTO_CLIENT_ID;
  delete process.env.SUUNTO_CLIENT_SECRET;
  delete process.env.SUUNTO_SUBSCRIPTION_KEY;
});

function logs(): string[] {
  return warn.mock.calls.map((c: unknown[]) => String(c[0]));
}

describe("suunto refresh", () => {
  it("200: forma della risposta invariata e nessun log", async () => {
    const access = jwt(1900000000);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: access, refresh_token: "r1", token_type: "Bearer" }),
        { status: 200 },
      ),
    );
    const res = await POST(req({ refresh_token: CODE }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      access_token: access,
      refresh_token: "r1",
      expires_at: 1900000000,
      expires_at_ms: 1900000000000,
      token_type: "Bearer",
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("400 invalid_body e log", async () => {
    const res = await POST(req("non json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_body");
    const l = logs().map((s) => JSON.parse(s));
    expect(l).toEqual([
      { evt: "suunto_oauth_error", route: "refresh", code: "invalid_body" },
    ]);
  });

  it("400 missing_fields e log", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_fields");
    expect(logs().map((s) => JSON.parse(s))).toEqual([
      { evt: "suunto_oauth_error", route: "refresh", code: "missing_fields" },
    ]);
  });

  it("429 dopo 10 richieste dallo stesso IP, con log", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const ip = "10.8.8.8";
    for (let i = 0; i < 10; i++) await POST(req({}, ip));
    warn.mockClear();
    const res = await POST(req({ refresh_token: CODE }, ip));
    expect(res.status).toBe(429);
    expect(logs().map((s) => JSON.parse(s))).toEqual([
      { evt: "suunto_oauth_error", route: "refresh", code: "rate_limit_exceeded" },
    ]);
  });

  it("502 con Suunto 400 invalid_grant: log con invalid_grant, senza segreti", async () => {
    const body = JSON.stringify({
      error: "invalid_grant",
      error_description: `code ${CODE} scaduto`,
      access_token: "TOK-LEAK",
    });
    fetchMock.mockResolvedValue(new Response(body, { status: 400 }));
    const res = await POST(req({ refresh_token: CODE }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("suunto_api_error");
    const l = logs();
    expect(l).toHaveLength(1);
    expect(JSON.parse(l[0])).toEqual({
      evt: "suunto_oauth_error",
      route: "refresh",
      code: "suunto_api_error",
      suuntoStatus: 400,
      error: "invalid_grant",
    });
    for (const s of [CODE, "TOK-LEAK", SECRET, CLIENT_ID, SUB_KEY, "scaduto"]) {
      expect(l[0]).not.toContain(s);
    }
  });

  it("502 con corpo Suunto non conforme: error = unparsed", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad gateway " + CODE + "</html>", { status: 502 }),
    );
    await POST(req({ refresh_token: CODE }));
    const e = JSON.parse(logs()[0]);
    expect(e.suuntoStatus).toBe(502);
    expect(e.error).toBe("unparsed");
    expect(logs()[0]).not.toContain(CODE);
  });

  it("502 con campo error ostile (non /^[a-z_]{1,40}$/): unparsed", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: `Code ${CODE}` }), { status: 400 }),
    );
    await POST(req({ refresh_token: CODE }));
    const e = JSON.parse(logs()[0]);
    expect(e.error).toBe("unparsed");
    expect(logs()[0]).not.toContain(CODE);
  });

  it.each([
    ["SUUNTO_CLIENT_ID"],
    ["SUUNTO_CLIENT_SECRET"],
  ])("500 server_misconfigured se manca %s, con log", async (name) => {
    delete process.env[name];
    const res = await POST(req({ refresh_token: CODE }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("server_misconfigured");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logs().map((s) => JSON.parse(s))).toEqual([
      { evt: "suunto_oauth_error", route: "refresh", code: "server_misconfigured" },
    ]);
  });

  it("nessun errore se manca solo SUUNTO_SUBSCRIPTION_KEY", async () => {
    delete process.env.SUUNTO_SUBSCRIPTION_KEY;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ access_token: jwt(1900000000) }), { status: 200 }),
    );
    const res = await POST(req({ refresh_token: CODE }));
    expect(res.status).toBe(200);
    expect(warn).not.toHaveBeenCalled();
  });
});
