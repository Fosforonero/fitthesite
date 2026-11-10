import { describe, expect, it } from "vitest";

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
