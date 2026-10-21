import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "@/lib/blog/data";
import { localizeInternalHref } from "@/components/blog/BlogRenderer";
import type { Locale } from "@/lib/i18n";

/**
 * SITO-LINKING-01: i collegamenti contestuali dagli articoli ai percorsi utili
 * (problema, istruzione, guida). Deterministico: legge solo i sorgenti, nessuna rete.
 */

type Hit = { at: string; anchor: string; href: string };

function collect(node: unknown, lc: "it" | "en", at: string, out: Hit[]): void {
  if (node == null) return;
  if (typeof node === "string") {
    for (const m of node.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) out.push({ at, anchor: m[1], href: m[2] });
    return;
  }
  if (Array.isArray(node)) { node.forEach((n, i) => collect(n, lc, `${at}[${i}]`, out)); return; }
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    if ("it" in o || "en" in o) { collect(o[lc], lc, at, out); return; }
    for (const [k, v] of Object.entries(o)) collect(v, lc, at ? `${at}.${k}` : k, out);
  }
}

function linksOf(slug: string, lc: "it" | "en"): Hit[] {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  expect(post, slug).toBeDefined();
  const out: Hit[] = [];
  collect(post!.body, lc, "body", out);
  collect(post!.faq, lc, "faq", out);
  return out.filter((h) => h.href.startsWith("/"));
}

const EXPECTED: Array<{ from: string; to: string; where: RegExp }> = [
  { from: "health-connect-not-syncing", to: "piu-smartwatch-insieme-dati-doppi", where: /^body\[\d+\]\.items\[3\]/ },
  { from: "health-connect-not-syncing", to: "passi-non-si-sincronizzano-galaxy-watch", where: /^body\[\d+\]\.items\[0\]/ },
  { from: "health-connect-not-syncing", to: "garmin-samsung-health-sync-guide", where: /^body\[\d+\]\.items\[1\]/ },
  { from: "garmin-samsung-health-sync-guide", to: "health-connect-not-syncing", where: /^body\[\d+\]\.items\[0\]/ },
  { from: "garmin-samsung-health-sync-guide", to: "piu-smartwatch-insieme-dati-doppi", where: /^body\[\d+\]\.items\[2\]/ },
  { from: "garmin-samsung-health-sync-guide", to: "esportare-dati-garmin", where: /^faq\[1\]/ },
  { from: "google-health-google-fit", to: "health-connect-not-syncing", where: /^body\[\d+\]\.text/ },
  { from: "google-health-google-fit", to: "garmin-samsung-health-sync-guide", where: /^faq\[6\]/ },
];

describe("SITO-LINKING-01: collegamenti contestuali nelle guide operative (IT/EN)", () => {
  for (const lc of ["it", "en"] as const) {
    for (const e of EXPECTED) {
      it(`${lc}: ${e.from} -> ${e.to} nel punto dell'istruzione`, () => {
        const hit = linksOf(e.from, lc).find((h) => h.href === `/${lc}/blog/${e.to}` && e.where.test(h.at));
        expect(hit, `${e.from} (${lc}) non collega ${e.to}`).toBeDefined();
      });
    }
  }

  it("ogni destinazione si risolve nella lingua del lettore (nessun link a una traduzione inesistente)", () => {
    for (const lc of ["it", "en"] as const) {
      for (const e of EXPECTED) {
        const resolved = localizeInternalHref(`/${lc}/blog/${e.to}`, lc as Locale);
        expect(resolved, `${e.to}/${lc}`).toBeTruthy();
        expect(resolved!.startsWith(`/${lc}/blog/`), `${e.to}/${lc}: ${resolved}`).toBe(true);
      }
    }
  });

  it("le ancore sono descrittive: nessun «clicca qui», nessuna ancora di una sola parola, nessun URL come testo", () => {
    const bad = /^(clicca qui|qui|click here|here|read more|leggi|leggi di piu'|more)$/i;
    for (const lc of ["it", "en"] as const) {
      for (const e of EXPECTED) {
        for (const h of linksOf(e.from, lc).filter((x) => x.href === `/${lc}/blog/${e.to}`)) {
          expect(bad.test(h.anchor.trim()), `${e.from}/${lc}: «${h.anchor}»`).toBe(false);
          expect(h.anchor.trim().split(/\s+/).length, `${e.from}/${lc}: «${h.anchor}»`).toBeGreaterThanOrEqual(3);
          expect(/^https?:|^\//.test(h.anchor), h.anchor).toBe(false);
        }
      }
    }
  });

  it("un solo collegamento per destinazione per ciascun punto del testo (nessuna ripetizione di ancore)", () => {
    for (const lc of ["it", "en"] as const) {
      for (const slug of new Set(EXPECTED.map((e) => e.from))) {
        const seen = new Map<string, number>();
        for (const h of linksOf(slug, lc)) seen.set(`${h.at}|${h.href}`, (seen.get(`${h.at}|${h.href}`) ?? 0) + 1);
        for (const [k, n] of seen) expect(n, `${slug}/${lc}: ${k}`).toBe(1);
      }
    }
  });
});
