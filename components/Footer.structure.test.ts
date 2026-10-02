import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "Footer.tsx"), "utf8");

describe("Footer (S02 U-FOOT-01/02)", () => {
  it("non rende piu' la pillola di stato di servizio", () => {
    expect(src).not.toMatch(/All systems operational|Tutti i sistemi operativi/);
  });

  it("il link Mesh Famiglia compare solo se isFeatureAvailable(\"familyMesh\")", () => {
    expect(src).toMatch(/isFeatureAvailable\("familyMesh"\) && \(\s*<li><Link href=\{famigliaLinkHref\(locale\)\}/);
    // nessun altro punto del footer collega /famiglia senza la condizione
    expect(src.match(/famigliaLinkHref\(locale\)/g)?.length).toBe(1);
  });
});
