import { describe, expect, it } from "vitest";
import { BLOG_POSTS as RAW_BLOG_POSTS } from "./data";
import { isBlogVariantIndexable, blogLanguages, REDIRECT_INCOMPLETE_LOCALE_SLUGS } from "./indexability";
import { applyNordicOverlay, type NordicOverlay } from "./nordic-overlay";
import nordicOverlayJson from "./nordic-overlay.json";
import { localizedBlogSlug } from "./slug-i18n";
import { locales } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";

/**
 * SPRINT P0.14 — guardrail esaustivo (addendum, FASE D punto A): per TUTTI i
 * post e TUTTE le locale, `blogLanguages()` — la SSOT unica condivisa da
 * hreflang (`generateMetadata`) e dal selettore lingua (`LanguageSwitcher`,
 * che la legge dal DOM via `<link rel="alternate">`) — deve combaciare
 * esattamente con `isBlogVariantIndexable()` e con lo slug localizzato reale.
 *
 * NON l'import statico `BLOG_POSTS` grezzo: `blog/[slug]/page.tsx` chiama
 * `getBlogPosts()` (`payload-source.ts`), che PRIMA di restituire i post
 * applica `applyNordicOverlay()` — una mutazione in-memoria dei campi
 * sv/da/no/fi (vedi `nordic-overlay.ts`) che rende indicizzabile una lingua
 * nordica per un post specifico quando l'overlay per quel post è completo.
 * Un test scritto contro `BLOG_POSTS` grezzo sarebbe internamente coerente
 * ma verificherebbe uno stato che nessuna pagina reale serve mai.
 *
 * `getBlogPosts()` non è chiamabile qui (richiede `@payload-config`, non
 * risolvibile nell'ambiente Vitest minimale di questo repo — vedi
 * `vitest.config.ts`). Si ricostruisce quindi lo stesso identico catalogo
 * overlay-applicato con lo stesso pattern già usato da `syncPostsBySlug()`
 * qui in `indexability.ts` (clone + `applyNordicOverlay`, mai gli oggetti
 * condivisi di `BLOG_POSTS`): stessa funzione di overlay, stesso file JSON,
 * nessuna logica di completezza duplicata — solo l'I/O verso Payload/CMS
 * (irrilevante qui: 0 post oggi esistono SOLO nel CMS) resta fuori.
 */
const BLOG_POSTS = RAW_BLOG_POSTS.map((p) => {
  const clone = structuredClone(p);
  applyNordicOverlay(clone, nordicOverlayJson as NordicOverlay);
  return clone;
});

describe("blogLanguages() — SSOT esaustiva selettore lingua / hreflang (SPRINT P0.14)", () => {
  it(`copre tutti i post del catalogo runtime (trovati: ${BLOG_POSTS.length})`, () => {
    expect(BLOG_POSTS.length).toBeGreaterThan(0);
  });

  it("il catalogo runtime include almeno un post con overlay nordico attivo su almeno una lingua (altrimenti il confronto con BLOG_POSTS grezzo non direbbe nulla)", () => {
    const NORDIC = new Set(["sv", "da", "no", "fi"]);
    const withNordic = BLOG_POSTS.filter((p) => locales.some((l) => NORDIC.has(l) && isBlogVariantIndexable(p, l)));
    expect(withNordic.length).toBeGreaterThan(0);
  });

  for (const post of BLOG_POSTS) {
    it(`${post.slug}: ogni entry di blogLanguages() combacia con isBlogVariantIndexable() e lo slug localizzato, per tutte le ${locales.length} locale`, () => {
      const langs = blogLanguages(post);

      for (const l of locales) {
        const shouldBeIndexable = isBlogVariantIndexable(post, l);
        if (shouldBeIndexable) {
          expect(langs[l], `${post.slug}/${l}: indicizzabile ma assente da blogLanguages() (il selettore la nasconderebbe a torto)`).toBeDefined();
          expect(langs[l], `${post.slug}/${l}: href non e' lo slug localizzato reale`).toBe(
            `${SITE_URL}/${l}/blog/${localizedBlogSlug(post.slug, l)}`,
          );
        } else {
          expect(langs[l], `${post.slug}/${l}: NON indicizzabile ma presente in blogLanguages() (il selettore offrirebbe noindex/404/redirect)`).toBeUndefined();
        }
      }

      // x-default: sempre lo slug IT canonico, mai localizzato — nessuna
      // sorpresa se in futuro `localizedBlogSlug` cambia per IT.
      expect(langs["x-default"]).toBe(`${SITE_URL}/it/blog/${post.slug}`);

      // Le locale nel registro redirect (incomplete -> 307 verso EN) non sono
      // MAI indicizzabili per costruzione: se lo diventassero silenziosamente
      // il selettore inizierebbe a offrirle come destinazione diretta pur
      // essendo tuttora un redirect lato pagina — combinazione da vietare qui.
      if (REDIRECT_INCOMPLETE_LOCALE_SLUGS.has(post.slug)) {
        for (const l of locales) {
          if (l === "it" || l === "en") continue;
          if (!isBlogVariantIndexable(post, l)) {
            expect(langs[l], `${post.slug}/${l}: nel registro redirect ma isBlogVariantIndexable=false eppure presente in blogLanguages()`).toBeUndefined();
          }
        }
      }
    });
  }

  // MICRO-GATE P0.18A-B (04/09/2026): unica eccezione nota e documentata
  // all'invariante "it/en sempre indicizzabili" — l'intero post e' stato
  // ritirato TEMPORANEAMENTE (redirect 307 verso la Privacy Policy
  // localizzata, tutte le 15 locale) perche' titolo/H1/slug/ogni sezione
  // assertivano "server nell'Unione Europea" senza mai ammettere possibili
  // trasferimenti extra-UE — vedi WITHDRAWN_PENDING_APP_MATRIX_VARIANTS in
  // indexability.ts e withdrawnEuServerArticleRedirects in next.config.mjs.
  // Non aggiungere qui altri slug senza lo stesso redirect gemello.
  const WITHDRAWN_SLUGS_ALWAYS_INDEXABLE_EXCEPTION = new Set<string>([
    "dove-sono-i-tuoi-dati-server-ue",
  ]);

  it("almeno una locale (it) e' sempre indicizzabile per ogni post: il selettore non e' mai vuoto sul post stesso", () => {
    for (const post of BLOG_POSTS) {
      if (WITHDRAWN_SLUGS_ALWAYS_INDEXABLE_EXCEPTION.has(post.slug)) continue;
      expect(isBlogVariantIndexable(post, "it"), `${post.slug}: IT dovrebbe essere sempre indicizzabile`).toBe(true);
    }
  });

  it("dove-sono-i-tuoi-dati-server-ue e' ritirato in TUTTE le locale (nessuna eccezione it/en)", () => {
    const post = BLOG_POSTS.find((p) => p.slug === "dove-sono-i-tuoi-dati-server-ue");
    expect(post, "il post deve ancora esistere nel registro (contenuto conservato, solo non servito)").toBeDefined();
    if (!post) return;
    for (const lc of locales) {
      expect(isBlogVariantIndexable(post, lc), `${post.slug}/${lc}: deve essere noindex (redirect 307 attivo)`).toBe(false);
    }
    expect(Object.keys(blogLanguages(post)).length, "blogLanguages() deve essere vuoto salvo x-default").toBeLessThanOrEqual(1);
  });
});
