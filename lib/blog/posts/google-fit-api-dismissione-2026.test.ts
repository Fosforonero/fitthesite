import { describe, expect, it } from "vitest";

import { BLOG_POSTS } from "../data";
import { isBlogVariantIndexable } from "../indexability";
import { locales, type Locale } from "@/lib/i18n";
import type { BlogSection } from "../types";
import { post } from "./google-fit-api-dismissione-2026";

/**
 * CONVERSION-01, pilota: la CTA di fondo sezione dell'articolo sulla dismissione delle API REST di Google Fit.
 * Verifica il modulo editoriale (solo Google Play, 3 benefici al massimo, testo breve, nessuna promessa non sostenuta) in TUTTE
 * le lingue indicizzabili dell'articolo, e che i campi protetti (SEO, slug, date, indicizzabilita') non siano toccati.
 */

type EditorialCta = Extract<BlogSection, { type: "fitmesh-editorial-cta" }>;

const INDICIZZABILI = locales.filter((lc) => isBlogVariantIndexable(post, lc));
const cta = (): EditorialCta => {
  const blocchi = post.body.filter((s): s is EditorialCta => s.type === "fitmesh-editorial-cta");
  expect(blocchi).toHaveLength(1);
  return blocchi[0];
};
const testi = (lc: Locale): string[] => {
  const c = cta();
  return [c.title[lc] ?? "", c.body[lc] ?? "", ...((c.benefits[lc] as readonly string[] | undefined) ?? [])];
};

describe("google-fit-api-dismissione-2026: CTA editoriale del pilota", () => {
  it("un solo modulo editoriale, nessuna CTA generica residua, solo Google Play", () => {
    expect(post.body.filter((s) => s.type === "cta")).toHaveLength(0);
    const c = cta();
    expect(c.platforms).toEqual(["android"]);
    expect(c.placement).toBe("after_solution");
    expect(c.contentCluster).toBe("google_health_vs_fit");
  });

  it("e' dopo il primo heading e prima della sezione su iPhone (posizione della CTA precedente)", () => {
    const iCta = post.body.findIndex((s) => s.type === "fitmesh-editorial-cta");
    const primoHeading = post.body.findIndex((s) => s.type === "heading");
    expect(iCta).toBeGreaterThan(primoHeading);
    expect(iCta).toBe(21);
  });

  it("tutte le lingue indicizzabili dell'articolo hanno titolo, corpo e tre benefici: nessun fallback inglese silenzioso", () => {
    expect(INDICIZZABILI.length).toBeGreaterThanOrEqual(11);
    const c = cta();
    for (const lc of INDICIZZABILI) {
      expect(c.title[lc], `title ${lc}`).toBeTruthy();
      expect(c.body[lc], `body ${lc}`).toBeTruthy();
      const b = c.benefits[lc] as readonly string[] | undefined;
      expect(b, `benefits ${lc}`).toBeDefined();
      expect(b!.length, `benefits ${lc}`).toBe(3);
      for (const t of b!) expect(t.trim().length, `benefit vuoto ${lc}`).toBeGreaterThan(0);
    }
  });

  it("testo breve: corpo sotto i 400 caratteri e un solo capoverso, benefici sotto i 130 caratteri", () => {
    const c = cta();
    for (const lc of INDICIZZABILI) {
      const body = c.body[lc] as string;
      expect(body.length, `body ${lc}`).toBeLessThanOrEqual(400);
      expect(body.includes("\n"), `capoversi ${lc}`).toBe(false);
      for (const b of c.benefits[lc] as readonly string[]) expect(b.length, `benefit ${lc}`).toBeLessThanOrEqual(130);
    }
  });

  it("nessuna promessa non sostenuta, in nessuna lingua: niente numeri oltre «14», prezzi, valute, URL, pannello web o dashboard", () => {
    for (const lc of INDICIZZABILI) {
      for (const t of testi(lc)) {
        const senza14 = t.replace(/14/g, "");
        expect(/\d/.test(senza14), `cifre in ${lc}: ${t}`).toBe(false);
        expect(/[€$£¥]|https?:|www\./i.test(t), `valuta o URL in ${lc}: ${t}`).toBe(false);
        expect(/pannello web|web panel|web dashboard|dashboard web|panel web|webpanel|web-dashboard/i.test(t), `pannello web in ${lc}: ${t}`).toBe(false);
      }
    }
  });

  it("IT/EN: non presenta Health Connect come sostituto universale ne' FitMesh come migratore dello storico o archivio completo", () => {
    const vietate = /sostituto universale|sostituisce (tutte )?le api|importa (lo )?storico|migra (lo )?storico|storico di google fit|archivio completo|universal replacement|replaces (all )?(the )?rest apis|imports? (your )?(google fit )?history|migrates? (your )?history|complete archive|full archive/i;
    for (const lc of ["it", "en"] as const) {
      for (const t of testi(lc)) expect(vietate.test(t), `${lc}: ${t}`).toBe(false);
    }
  });

  it("IT/EN: dice requisiti e prova di 14 giorni con successivo acquisto o abbonamento su Google Play", () => {
    const it = testi("it").join(" ");
    const en = testi("en").join(" ");
    expect(it).toMatch(/Android con Health Connect e il permesso di lettura/);
    expect(it).toMatch(/14 giorni/);
    expect(it).toMatch(/acquisto o abbonamento su Google Play/);
    expect(en).toMatch(/Android with Health Connect and read permission/);
    expect(en).toMatch(/14-day free trial/);
    expect(en).toMatch(/purchase or subscription on Google Play/);
  });

  it("ogni lingua indicizzabile cita Health Connect, FitMesh Sync, Google Play e il numero 14 (nessuna traduzione svuotata)", () => {
    for (const lc of INDICIZZABILI) {
      const tutto = testi(lc).join(" ");
      expect(tutto, lc).toMatch(/Health Connect/);
      expect(tutto, lc).toMatch(/FitMesh Sync/);
      expect(tutto, lc).toMatch(/Google Play/);
      expect(tutto, lc).toMatch(/14/);
    }
  });

  it("nessun em dash nel modulo (regola di governance del copy)", () => {
    const c = cta();
    expect(JSON.stringify(c)).not.toContain("—");
  });

  it("campi protetti dell'articolo invariati: slug, categoria, date, tempo di lettura, SEO e indicizzabilita'", () => {
    expect(post.slug).toBe("google-fit-api-dismissione-2026");
    expect(post.category).toBe("guides");
    expect(post.publishedAt).toBe("2026-06-16");
    expect(post.updatedAt).toBe("2026-08-25");
    expect(post.readMinutes).toBe(8);
    expect(post.seoTitle?.en).toBe("Google Fit API Deprecation 2026: Health Connect");
    expect(post.metaDescription.it).toBeTruthy();
    expect(BLOG_POSTS.some((p) => p.slug === post.slug)).toBe(true);
    for (const lc of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
      expect(isBlogVariantIndexable(post, lc), `indicizzabile ${lc}`).toBe(true);
    }
  });
});
