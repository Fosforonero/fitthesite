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

  it("include la sezione Social autonoma con Reddit e Instagram", () => {
    // Presenza delle costanti e icone
    expect(src).toContain("REDDIT_URL");
    expect(src).toContain("INSTAGRAM_URL");
    expect(src).toContain("RedditIcon");
    expect(src).toContain("InstagramIcon");
    expect(src).toContain("REDDIT_COMMUNITY_LIVE");

    // Reddit è condizionato a REDDIT_COMMUNITY_LIVE
    expect(src).toMatch(/REDDIT_COMMUNITY_LIVE\s*&&\s*\(\s*<li>[\s\S]*?href=\{REDDIT_URL\}/);

    // Instagram è presente con target blank e rel noopener noreferrer
    expect(src).toMatch(/href=\{INSTAGRAM_URL\}[\s\S]*?target="_blank"[\s\S]*?rel="noopener noreferrer"/);

    // Reddit rimosso dalla sezione Prodotto (non compare dopo dict.footer.product)
    const productSection = src.split("dict.footer.product")[1]?.split("dict.footer.legal")[0] ?? "";
    expect(productSection).not.toContain("REDDIT_URL");
    expect(productSection).not.toContain("RedditIcon");
  });
});
