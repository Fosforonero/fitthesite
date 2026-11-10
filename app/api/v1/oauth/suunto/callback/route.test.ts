import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const base = "https://www.fitmesh.fit/api/v1/oauth/suunto/callback";

describe("suunto callback", () => {
  it("inoltra code e state al deep link", async () => {
    const res = await GET(new Request(`${base}?code=abc%20d&state=st1`));
    expect(res.status).toBe(302);
    const loc = res.headers.get("location")!;
    expect(loc.startsWith("fitmeshsync://suunto?")).toBe(true);
    const q = new URL(loc.replace("fitmeshsync://suunto?", "http://x/?")).searchParams;
    expect(q.get("code")).toBe("abc d");
    expect(q.get("state")).toBe("st1");
  });

  it("inoltra error e state", async () => {
    const res = await GET(new Request(`${base}?error=access_denied&state=st2`));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "fitmeshsync://suunto?error=access_denied&state=st2",
    );
  });

  it("400 senza code", async () => {
    const res = await GET(new Request(`${base}?state=st3`));
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Missing code parameter");
  });
});

function codeDelDeepLink(loc: string): string | null {
  return new URL(loc.replace("fitmeshsync://suunto?", "http://x/?")).searchParams.get("code");
}

describe("suunto callback: il code non si altera", () => {
  afterEach(() => vi.restoreAllMocks());

  it("un + letterale resta un + (non diventa uno spazio)", async () => {
    const res = await GET(new Request(`${base}?code=ab+cd&state=s`));
    expect(codeDelDeepLink(res.headers.get("location")!)).toBe("ab+cd");
    expect(res.headers.get("location")).toContain("code=ab%2Bcd");
  });

  it("%2B resta un +", async () => {
    const res = await GET(new Request(`${base}?code=ab%2Bcd&state=s`));
    expect(codeDelDeepLink(res.headers.get("location")!)).toBe("ab+cd");
  });

  it("%20 resta uno spazio (come prima)", async () => {
    const res = await GET(new Request(`${base}?code=abc%20d&state=s`));
    expect(codeDelDeepLink(res.headers.get("location")!)).toBe("abc d");
  });

  it("una sequenza percentuale malformata non lancia e inoltra il valore", async () => {
    const res = await GET(new Request(`${base}?code=ab%zzcd&state=s`));
    expect(res.status).toBe(302);
    expect(codeDelDeepLink(res.headers.get("location")!)).toBe("ab%zzcd");
  });

  it("usa il primo parametro code e ignora i successivi", async () => {
    const res = await GET(new Request(`${base}?code=uno&code=due&state=s`));
    expect(codeDelDeepLink(res.headers.get("location")!)).toBe("uno");
  });

  it("registra solo la FORMA del code, mai il valore", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await GET(new Request(`${base}?code=SEGRETO+x%2Fy&state=s`));
    const righe = log.mock.calls.map((c) => String(c[0]));
    const riga = righe.find((r) => r.includes('"suunto_oauth_code"'))!;
    expect(riga).toBeDefined();
    const e = JSON.parse(riga);
    expect(e).toMatchObject({ evt: "suunto_oauth_code", route: "callback", len: 11, plus: true, space: false, pct: false, legacyDiffers: true });
    expect(righe.join("\n")).not.toContain("SEGRETO");
    expect(righe.join("\n")).not.toContain("x/y");
  });

  it("legacyDiffers e' falso per un code alfanumerico", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await GET(new Request(`${base}?code=Abc123&state=s`));
    const e = JSON.parse(log.mock.calls.map((c) => String(c[0])).find((r) => r.includes('"suunto_oauth_code"'))!);
    expect(e).toMatchObject({ len: 6, plus: false, space: false, pct: false, legacyDiffers: false });
  });
});
