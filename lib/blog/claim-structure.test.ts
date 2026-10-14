import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { COVERED_POSTS, collectClaimCells } from "@/lib/blog/claims/claim-cells";
import { CLAIM_REGISTRY } from "@/lib/blog/claims/claim-registry";
import { GA_CTA_LABELS, GA_CTA_PATH, GA_NEGATION, GA_NEG_PATH, nz } from "@/lib/blog/claims/text-guards-v3";
import expectedIds from "@/lib/blog/claims/claim-registry.expected-ids.json";

// ---------------------------------------------------------------------------------------------
// CONTROLLI STRUTTURALI MIRATI (SD): non guardano parole, guardano la FORMA del contenuto: la voce di Garmin che
// dichiara lo stato onesto, le CTA, i link/etichette di integrazione nei blocchi che non devono averli, la
// presenza dei claim attesi nel registro. Affiancano il registro; non lo sostituiscono.
// ---------------------------------------------------------------------------------------------
const GARMIN = COVERED_POSTS.garmin;
const sha = (v: unknown): string => createHash("sha256").update(JSON.stringify(v)).digest("hex");

describe("STRUTTURA: body.15.items[2] di Garmin", () => {
  const cells = collectClaimCells(GARMIN).filter((c) => GA_NEG_PATH.test(c.path));

  it("13 voci (11 lingue TS + sv/da overlay), una per lingua", () => {
    expect(cells.length).toBe(13);
    expect(new Set(cells.map((c) => c.lang)).size).toBe(13);
  });

  it("ogni voce termina con la clausola di negazione della sua lingua, seguita solo dal punto", () => {
    for (const c of cells) {
      const neg = GA_NEGATION[c.lang];
      expect(neg, `clausola ${c.lang}`).toBeDefined();
      const t = nz(c.text).trim();
      expect(t, `${c.path} termina con la negazione`).toMatch(new RegExp(neg.source + "[.。]$"));
      expect(t, `${c.path} Health Connect`).toMatch(/Health[ -]Connect/);
    }
  });
});

describe("STRUTTURA: CTA uguali a main", () => {
  // Impronte dei blocchi `cta` calcolate sul post di main c011056b (stesso baseline del test sulle URL CTR protette).
  const MAIN_CTA: Record<string, Array<[number, string]>> = {
    "esportare-dati-garmin": [[25, "7cf860aa64aab212e46d3ede138884dd511d2643e0233244ce816a9c53baace7"]],
    "fitbit-data-not-syncing-android": [[11, "9932a9a83155fadd682ed225b1b25e08e5332207f93e7a7759a7345e74745ff2"]],
    "google-health-google-fit": [],
  };
  it.each(Object.entries(MAIN_CTA))("%s: i blocchi CTA (titolo, testo, etichetta, href) sono quelli di main", (slug, pins) => {
    const body = (BLOG_POSTS_BY_SLUG as Record<string, any>)[slug].body as Array<{ type: string }>;
    const found = body.map((b, i) => [i, b] as const).filter(([, b]) => b.type === "cta");
    expect(found.map(([i]) => i), `${slug}: posizione dei blocchi CTA`).toEqual(pins.map(([i]) => i));
    for (const [i, pin] of pins) expect(sha(body[i]), `${slug} body[${i}]`).toBe(pin);
  });

  it("le 13 etichette CTA Garmin (11 TS + sv/da overlay) sono uguali al testo esatto ammesso", () => {
    const cta = collectClaimCells(GARMIN).filter((c) => GA_CTA_PATH.test(c.path));
    expect(cta.length).toBe(13);
    for (const c of cta) expect(nz(c.text), c.path).toBe(nz(GA_CTA_LABELS[c.lang]));
  });
});

describe("STRUTTURA: nessun link o etichetta di integrazione in hero, FAQ e TLDR", () => {
  const BLOCKS = /^(?:ts|overlay):(?:hero|faq|tldr)\b/;
  const INTEGRATION_WORD = /integra|integr|統合|통합|entegr|\/integrations?\b|\/sync\//i;
  const LINK = /\[([^\]]*)\]\(([^)]*)\)|<a\s[^>]*href="([^"]*)"[^>]*>([^<]*)|https?:\/\/\S+|\/[a-z]{2}\/(?:integrations?|sync|lp)\b\S*/giu;
  it.each(Object.entries(COVERED_POSTS))("%s: nessun link con target o etichetta di integrazione, nessuna etichetta a freccia di integrazione", (_post, slug) => {
    const bad: string[] = [];
    for (const c of collectClaimCells(slug)) {
      if (!BLOCKS.test(c.path)) continue;
      const t = nz(c.text);
      for (const m of t.matchAll(LINK)) if (INTEGRATION_WORD.test(m[0])) bad.push(`${c.path}: link «${m[0].slice(0, 70)}»`);
      if (/→\s*$/.test(t.trim()) && INTEGRATION_WORD.test(t)) bad.push(`${c.path}: etichetta a freccia «${t.slice(0, 70)}»`);
    }
    expect(bad, "link/etichetta di integrazione fuori dai blocchi consentiti (corpo e CTA in riga rossa)").toEqual([]);
  });
});

describe("STRUTTURA: nessuna cancellazione silenziosa di claim registrati", () => {
  const ids = new Set(CLAIM_REGISTRY.map((e) => e.id));
  const rimozioni = new Map((expectedIds.rimozioni as Array<{ id: string; motivo: string }>).map((r) => [r.id, r.motivo]));
  it.each(Object.entries(expectedIds.ids as Record<string, string[]>))("%s: ogni id atteso e' nel registro o ha una rimozione motivata", (post, list) => {
    expect(list.length, `${post}: elenco atteso`).toBeGreaterThan(100);
    const silently = list.filter((id) => !ids.has(id) && !((rimozioni.get(id) ?? "").trim().length > 10));
    expect(silently, `${post}: claim spariti dal registro senza motivo (aggiungi la rimozione con il motivo, o ripristina la voce)`).toEqual([]);
  });
  it("il numero di claim registrati per post non scende sotto quello atteso", () => {
    for (const [post, list] of Object.entries(expectedIds.ids as Record<string, string[]>)) {
      const now = CLAIM_REGISTRY.filter((e) => e.post === post).length;
      const motivate = list.filter((id) => rimozioni.has(id)).length;
      expect(now, post).toBeGreaterThanOrEqual(list.length - motivate);
    }
  });
});
