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

    // I link social usano target minimi di almeno 44x44px senza margini verticali negativi
    const socialBlock = src.split("Sezione Social autonoma")[1]?.split("dict.footer.product")[0] ?? "";
    expect(socialBlock).not.toMatch(/-my-\d+/);
    expect(socialBlock).toContain("min-h-[44px]");
    expect(socialBlock).toContain("min-w-[44px]");

    // Reddit rimosso dalla sezione Prodotto (non compare dopo dict.footer.product)
    const productSection = src.split("dict.footer.product")[1]?.split("dict.footer.legal")[0] ?? "";
    expect(productSection).not.toContain("REDDIT_URL");
    expect(productSection).not.toContain("RedditIcon");
  });
  it("Facebook e LinkedIn: costanti centralizzate, attributi, icone decorative, nessun tracking", () => {
    expect(src).toContain("FACEBOOK_URL");
    expect(src).toContain("LINKEDIN_URL");
    expect(src).toContain("FacebookIcon");
    expect(src).toContain("LinkedInIcon");
    const facts = readFileSync(join(__dirname, "..", "lib", "product-facts.ts"), "utf8");
    expect(facts).toMatch(/FACEBOOK_URL\s*=\s*"https:\/\/www\.facebook\.com\/fitmeshsync\/"/);
    expect(facts).toMatch(/LINKEDIN_URL\s*=\s*"https:\/\/www\.linkedin\.com\/company\/fitmesh\/"/);
    expect(facts).not.toMatch(/linkedin\.com\/company\/fitmesh\/home/);
    for (const c of ["FACEBOOK_URL", "LINKEDIN_URL"]) {
      expect(src).toMatch(new RegExp(`href=\\{${c}\\}[\\s\\S]*?target="_blank"[\\s\\S]*?rel="noopener noreferrer"`));
    }
    const socialBlock = src.split("Sezione Social autonoma")[1]?.split("dict.footer.product")[0] ?? "";
    expect(socialBlock).not.toMatch(/-m[ytb]-\d/);
    expect(socialBlock.match(/data-cta-placement/g)?.length).toBe(1);
    expect(socialBlock).toMatch(/<span>Facebook<\/span>/);
    expect(socialBlock).toMatch(/<span>LinkedIn<\/span>/);
    expect(socialBlock).toMatch(/REDDIT_COMMUNITY_LIVE\s*&&\s*\(/);
    // ordine: Reddit, Instagram, Facebook, LinkedIn
    const order = ["REDDIT_URL}", "INSTAGRAM_URL}", "FACEBOOK_URL}", "LINKEDIN_URL}"].map((t) => socialBlock.indexOf("href={" + t));
    expect(order.every((n) => n > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // icone locali decorative
    for (const f of ["FacebookIcon", "LinkedInIcon"]) {
      const icon = readFileSync(join(__dirname, f + ".tsx"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(icon).toContain('aria-hidden="true"');
      expect(icon).toContain('focusable="false"');
      expect(icon).not.toMatch(/<title|<image|xlink:href|https?:\/\//);
    }
  });
});
