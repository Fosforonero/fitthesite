/**
 * Fonte di verità UNICA per "questa variante (post, locale) è indicizzabile?".
 *
 * Un post del blog esce `noindex` per QUALSIASI locale (non solo le nordiche)
 * finché non è completamente tradotto per quel campo per campo: altrimenti
 * mostrerebbe il contenuto EN di fallback sotto un URL con un locale diverso,
 * self-canonicalizzato come se fosse originale. Google lo rileva come
 * "Duplicate without user-selected canonical" (contenuto identico a
 * /en/blog/... sotto un URL diverso, ciascuno con canonical su se stesso).
 *
 * Prima (fino al 03/07) il gate copriva SOLO le nordiche via
 * `UNTRANSLATED_CONTENT_LOCALES`: un post nuovo tradotto solo in it/en/es/de
 * risultava "indicizzabile" anche in pl/tr/nl/ja/ko, che in realtà mostravano
 * fallback EN → 136 pagine duplicate rilevate (diagnostica 04/07). Ora il
 * check è generico: per OGNI locale diverso da it/en (sempre required, quindi
 * sempre completi) verifica che OGNI campo traducibile abbia quella lingua.
 *
 * Usato da `blog/[slug]/page.tsx` (robots + hreflang), `sitemap.ts` e
 * `feed.xml`: un solo helper, i tre non possono più divergere.
 *
 * P1.3M: `walkPost(post, lc)` è locale-aware — una sezione/FAQ con `locales`
 * che esclude `lc` (vedi `lib/blog/locale-filter.ts`) non genera entry per
 * `lc` e quindi non la rende incompleta. Una locale ESCLUSA da un blocco
 * nuovo non deve MAI risultare incompleta solo perché quel blocco non la
 * riguarda; una locale INCLUSA ma priva della traduzione richiesta continua
 * a risultare incompleta come prima (nessuna eccezione sulla traduzione).
 */
import type { Locale } from "@/lib/i18n";
import { walkPost } from "@/lib/blog/nordic-overlay";
import type { BlogPost } from "@/lib/blog/types";

/** True se OGNI campo traducibile applicabile a `lc` ha un valore per `lc` (nessun fallback en/it). */
export function isPostLocaleComplete(post: BlogPost, lc: Locale): boolean {
  const entries = walkPost(post, lc);
  if (entries.length === 0) return false;
  for (const e of entries) {
    const node = e.node as Record<string, unknown>;
    const val = node[lc];
    if (val == null) return false;
    if (e.kind === "list") {
      const src = (node.en ?? node.it) as unknown[];
      if (!Array.isArray(val) || val.length !== src.length) return false;
    }
  }
  return true;
}

/** True se la pagina `(post, locale)` è indicizzabile (NON esce `noindex`). */
export function isBlogVariantIndexable(post: BlogPost, lc: Locale): boolean {
  // it/en sono campi `required` nel tipo Localized: sempre presenti, mai fallback.
  if (lc === "it" || lc === "en") return true;
  return isPostLocaleComplete(post, lc);
}

/**
 * Sprint P1.2A: slug dei post per cui una variante locale incompleta
 * (fallback EN, `isBlogVariantIndexable` false) va in redirect 307 verso
 * `/en/blog/...` invece del `noindex,follow` generico sopra.
 *
 * Perché un'eccezione e non il default per tutti i post non completi:
 * `noindex` lascia comunque la pagina raggiungibile con `<html lang>`
 * impostato dal layout sulla lingua della route (es. "es") mentre il
 * contenuto renderizzato è inglese di fallback — incoerenza che il
 * redirect evita del tutto (la pagina in quella lingua non viene mai
 * renderizzata). Applicarlo subito a TUTTI i post con varianti
 * incomplete sarebbe un cambio di comportamento sitewide non richiesto
 * e non verificato per gli altri post: qui è opt-in, un post alla volta.
 */
export const REDIRECT_INCOMPLETE_LOCALE_SLUGS = new Set<string>([
  "anello-vs-smartwatch",
  // P1.3N-C: pubblicazione iniziale solo it/en, stesso meccanismo.
  "galaxy-watch-ultra2-watch9-health-connect",
]);
