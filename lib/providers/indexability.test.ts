import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/lib/i18n";
import type { Provider } from "@/lib/providers/data";
import { PROVIDERS } from "@/lib/providers/data";
import {
  isProviderLocaleComplete,
  isProviderVariantIndexable,
  providerLanguages,
} from "@/lib/providers/indexability";

/**
 * FASE 9 P1.8C — negative test #6 del brief ("hreflang verso variante
 * noindex") in forma di test permanente, non script bash usa-e-getta.
 *
 * Il primo tentativo (iniezione testuale su `providerLanguages` via
 * tools/verify-p18c-negative-tests.sh) non ha prodotto un FAIL reale:
 * `providerLanguages` filtra SEMPRE tramite `isProviderVariantIndexable`
 * per costruzione, quindi un'iniezione testuale a valle non rompe nulla
 * di osservabile — e non esisteva NESSUN test automatico su
 * `lib/providers/indexability.ts` (a differenza del suo gemello
 * `lib/blog/indexability.test.ts`), solo `check-seo-redirect-integrity.ts`
 * che verifica i redirect, non l'hreflang. Gap reale, colmato qui.
 */

describe("providerLanguages non emette mai hreflang verso una variante non indicizzabile", () => {
  it("per ogni provider reale, ogni locale in providerLanguages() è isProviderVariantIndexable()", () => {
    for (const p of PROVIDERS) {
      const langs = providerLanguages(p);
      for (const lc of Object.keys(langs)) {
        if (lc === "x-default") continue;
        expect(
          isProviderVariantIndexable(p, lc as Locale),
          `${p.slug}/${lc}: providerLanguages() lo include ma isProviderVariantIndexable() dice noindex — hreflang verso variante noindex.`,
        ).toBe(true);
      }
    }
  });

  it("negative test reale: un provider con una FAQ incompleta per 'de' viene escluso da providerLanguages", () => {
    // Fixture sintetica minima, non un provider vero: isola la logica da
    // qualunque contenuto reale possa cambiare in futuro.
    const fakeProvider = {
      slug: "__negtest__",
      name: "Test",
      vendor: "Test",
      category: "wearable",
      status: "live",
      brandColor: "#000000",
      initial: "T",
      tagline: { it: "tagline it", en: "tagline en", de: "tagline de" },
      longDesc: { it: "desc it", en: "desc en", de: "desc de" },
      techNote: { it: "note it", en: "note en" },
      dataTypes: [],
      faqs: [
        {
          q: { it: "domanda it", en: "question en", de: "question en" }, // de identico a en: fallback mascherato
          a: { it: "risposta it", en: "answer en", de: "answer en" },
        },
      ],
      seoKeywords: { it: ["x"], en: ["x"] },
    } as unknown as Provider;

    expect(isProviderLocaleComplete(fakeProvider, "de")).toBe(false);
    expect(isProviderVariantIndexable(fakeProvider, "de")).toBe(false);

    const langs = providerLanguages(fakeProvider);
    expect(langs.de).toBeUndefined();
    // it/en restano sempre presenti (lingue sorgente, mai verificate per completezza).
    expect(langs.it).toBeDefined();
    expect(langs.en).toBeDefined();
  });

  /**
   * SPRINT P0.14, addendum punto 7 — gate permanente su un debito
   * documentato e NON toccato da questo branch: la FAQ PL di "apple-health"
   * contiene un token di template corrotto rimasto nella stringa tradotta
   * ("}};", vedi `lib/providers/data.ts`, FAQ Apple Watch). Oggi PL non è
   * indicizzabile per QUEST'ALTRA ragione (altri campi PL incompleti sullo
   * stesso provider) — un caso, non ancora questo — quindi il gate reale è
   * DUE controlli indipendenti: (a) il token corrotto è ancora lì (se sparisce
   * senza che nessuno lo segnali qui, il test fallisce e lo fa notare); (b) PL
   * resta comunque non indicizzabile finché quel token non è sostituito con
   * testo reale — anche se in futuro tutti gli ALTRI campi PL diventassero
   * completi. Se (a) diventa falso perché il token è stato corretto, questo
   * test va aggiornato per verificare solo (b) (o rimosso se il debito è
   * chiuso altrove con un proprio test).
   */
  it("apple-health/pl: il token di template corrotto nella FAQ resta un blocco esplicito all'indicizzazione (debito documentato, fuori scope)", () => {
    const provider = PROVIDERS.find((p) => p.slug === "apple-health");
    expect(provider, "provider apple-health non trovato nel catalogo").toBeDefined();
    if (!provider) return;

    const corruptedFaq = provider.faqs.find((f) => typeof f.a.pl === "string" && f.a.pl.includes("}};"));
    expect(
      corruptedFaq,
      "il token di template corrotto ('}};') non è più presente: il debito potrebbe essere stato risolto — aggiornare/rimuovere questo test, non lasciarlo verde per il motivo sbagliato.",
    ).toBeDefined();

    expect(
      isProviderVariantIndexable(provider, "pl"),
      "apple-health/pl è diventato indicizzabile: verificare che il token corrotto sia stato sostituito con testo reale prima di lasciar passare questa variante.",
    ).toBe(false);
  });

  it("i due provider pilota FASE 5 P1.8C (pixel-watch, wear-os) sono indicizzabili in tutte le 11 locale attese", () => {
    const EXPECTED_INDEXABLE: Locale[] = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"];
    for (const slug of ["pixel-watch", "wear-os"]) {
      const p = PROVIDERS.find((x) => x.slug === slug);
      expect(p, `provider ${slug} non trovato`).toBeDefined();
      if (!p) continue;
      for (const lc of locales) {
        const expected = EXPECTED_INDEXABLE.includes(lc);
        expect(
          isProviderVariantIndexable(p, lc),
          `${slug}/${lc}: atteso indicizzabile=${expected}`,
        ).toBe(expected);
      }
    }
  });
});
