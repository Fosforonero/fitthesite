import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "./data";
import { isBlogVariantIndexable, isPostLocaleComplete } from "./indexability";
import { filterBlogContentForLocale } from "./locale-filter";

/**
 * P1.3M — test di regressione FOCALIZZATO su `health-connect-vs-samsung-health`
 * (il pillar Samsung Health/Health Connect/Google Health), non una whitelist
 * sitewide. La scansione generale delle 97 combinazioni post/locale con la
 * stessa causa (root cause: `secondaryKeywords` senza chiave es/de, o di
 * lunghezza diversa altrove) e' debito tecnico separato, tracciato come
 * P1.3Q con baseline esterna in `docs/seo/blog-locale-near-miss-baseline.json`
 * + guardrail dedicato (`tools/check-blog-locale-near-miss.ts`), non qui:
 * niente whitelist opaca dentro il codice del test, come richiesto.
 */
describe("health-connect-vs-samsung-health: regressione locale P1.3M", () => {
  const post = BLOG_POSTS.find((p) => p.slug === "health-connect-vs-samsung-health");

  it("il post esiste", () => {
    expect(post).toBeDefined();
  });

  it("tutte le 11 traduzioni storiche restano indicizzabili (nessuna variante degradata)", () => {
    for (const lc of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
      expect(isBlogVariantIndexable(post!, lc), `locale ${lc} dovrebbe essere indicizzabile`).toBe(true);
    }
  });

  it("DE ed ES sono diventate indicizzabili dopo il fix secondaryKeywords (prima erano noindex)", () => {
    expect(isPostLocaleComplete(post!, "de")).toBe(true);
    expect(isPostLocaleComplete(post!, "es")).toBe(true);
  });

  it("nessuna locale restituisce corpo/FAQ inglese involontario: ogni sezione/FAQ visibile per una locale ha un valore per quella locale, non un fallback silenzioso su `en`/`it`", () => {
    for (const lc of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
      const visibleBody = filterBlogContentForLocale(post!.body, lc);
      for (const section of visibleBody) {
        const textNode = "text" in section ? section.text : "body" in section ? section.body : null;
        if (!textNode) continue;
        expect(
          (textNode as Record<string, string | undefined>)[lc],
          `${lc}: una sezione visibile non ha un proprio testo in questa locale (fallback silenzioso)`,
        ).toBeDefined();
      }
      const visibleFaq = filterBlogContentForLocale(post!.faq ?? [], lc);
      for (const f of visibleFaq) {
        expect((f.q as Record<string, string | undefined>)[lc]).toBeDefined();
        expect((f.a as Record<string, string | undefined>)[lc]).toBeDefined();
      }
    }
  });
});
