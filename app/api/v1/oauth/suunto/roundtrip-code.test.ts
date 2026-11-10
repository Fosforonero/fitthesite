/**
 * Giro completo del code: callback -> deep link -> lettura dell'app ->
 * POST exchange -> corpo form inviato a Suunto. Il code che arriva a Suunto
 * deve essere quello che Suunto ha emesso, decodificato UNA volta sola.
 * La lettura dell'app imita Uri.queryParameters di Dart (come URLSearchParams:
 * '+' -> spazio, %XX decodificato una volta).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./callback/route";
import { POST } from "./exchange/route";

const base = "https://www.fitmesh.fit/api/v1/oauth/suunto/callback";
let ip = 0;

beforeEach(() => {
  process.env.SUUNTO_CLIENT_ID = "ID-test";
  process.env.SUUNTO_CLIENT_SECRET = "SEGRETO-test";
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.SUUNTO_CLIENT_ID;
  delete process.env.SUUNTO_CLIENT_SECRET;
});

async function finoASuunto(queryGrezza: string): Promise<{ codeInviato: string; stato: string | null }> {
  const res = await GET(new Request(`${base}?code=${queryGrezza}&state=st`));
  const loc = res.headers.get("location")!;
  const q = new URL(loc.replace("fitmeshsync://suunto?", "http://x/?")).searchParams;
  const codeDellApp = q.get("code")!;
  let corpo = "";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_u: string, init: RequestInit) => {
      corpo = String(init.body);
      return new Response(JSON.stringify({ access_token: "h.e30.s", refresh_token: "r" }), { status: 200 });
    }),
  );
  ip++;
  await POST(
    new Request("https://www.fitmesh.fit/api/v1/oauth/suunto/exchange", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.9.0.${ip}` },
      body: JSON.stringify({ code: codeDellApp }),
    }),
  );
  const params = new URLSearchParams(corpo);
  return { codeInviato: params.get("code")!, stato: params.get("grant_type") };
}

describe("giro callback -> app -> exchange -> Suunto", () => {
  const casi: Array<[string, string]> = [
    ["a+b", "a+b"],
    ["a%2Bb", "a+b"],
    ["a%20b", "a b"],
    ["a%252Bb", "a%2Bb"],
    ["Zx9Qk2-_.~", "Zx9Qk2-_.~"],
  ];
  for (const [grezzo, atteso] of casi) {
    it(`?code=${grezzo}: a Suunto arriva "${atteso}"`, async () => {
      const r = await finoASuunto(grezzo);
      expect(r.codeInviato).toBe(atteso);
      expect(r.stato).toBe("authorization_code");
    });
  }
});
