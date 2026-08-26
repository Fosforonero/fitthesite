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
import { locales, type Locale } from "@/lib/i18n";
import { walkPost, applyNordicOverlay, type NordicOverlay } from "@/lib/blog/nordic-overlay";
import type { BlogPost } from "@/lib/blog/types";
import { localizedBlogSlug, canonicalFromBlogUrl } from "@/lib/blog/slug-i18n";
import { BLOG_POSTS } from "@/lib/blog/data";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";
import { SITE_URL } from "@/lib/product-facts";

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

/**
 * Sprint P0.11-D1: varianti (post, locale) consolidate away da un redirect
 * permanente verso un altro post — cannibalizzazione risolta accorpando due
 * post sullo stesso topic (vedi `elderlyConsolidationRedirects` in
 * next.config.mjs). La variante non è MAI raggiungibile come pagina 200 (il
 * redirect statico di next.config.mjs intercetta la request prima del
 * routing app-level, che quindi non la vede mai), quindi non deve MAI
 * risultare indicizzabile: niente sitemap, niente hreflang, niente feed.
 *
 * Deve vivere QUI (unica fonte di verità) e non come caso speciale duplicato
 * in sitemap.ts/blogLanguages()/feed.xml: il 04/08 sitemap.ts escludeva la
 * variante ma blogLanguages() (hreflang) no, generando hreflang verso un URL
 * 308 dalle altre varianti locale dello stesso post — regressione P0.11-D1.
 */
const CONSOLIDATED_AWAY_VARIANTS = new Set<string>([
  "smartwatch-per-anziani-guida:en",
]);

/** True se la pagina `(post, locale)` è indicizzabile (NON esce `noindex`). */
export function isBlogVariantIndexable(post: BlogPost, lc: Locale): boolean {
  if (CONSOLIDATED_AWAY_VARIANTS.has(`${post.slug}:${lc}`)) return false;
  // it/en sono campi `required` nel tipo Localized: sempre presenti, mai fallback.
  if (lc === "it" || lc === "en") return true;
  return isPostLocaleComplete(post, lc);
}

/**
 * Sprint P0.14: estratta da `blog/[slug]/page.tsx` (era una funzione locale
 * non esportata) per diventare l'UNICA fonte di verità condivisa fra
 * hreflang (uso originale) e il selettore lingua dell'header
 * (`@header/blog/[slug]/page.tsx`) — stesso identico calcolo, non una
 * seconda mappa locale→slug mantenuta a mano in due posti.
 *
 * URL assoluti (SITE_URL) perché l'uso originale è hreflang; il chiamante
 * del selettore lingua li userà come href relativi al sito, comunque validi
 * per un tag <a>.
 */
export function blogLanguages(post: BlogPost): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const l of locales) {
    // Salta le varianti nordiche non tradotte (sono `noindex`): l'hreflang non
    // deve puntare a pagine escluse dall'indice. Stessa fonte di verità di
    // robots e sitemap.
    if (!isBlogVariantIndexable(post, l)) continue;
    langs[l] = `${SITE_URL}/${l}/blog/${localizedBlogSlug(post.slug, l)}`;
  }
  langs["x-default"] = `${SITE_URL}/it/blog/${post.slug}`;
  return langs;
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
  // P1.4B: Sleep Score + Zona 2, pubblicazione solo it/en, stesso meccanismo.
  "sleep-score-regolarita-ritmo-circadiano",
  "perche-zona-2-cambia-smartwatch-app",
]);

/**
 * Sprint P0.13: URL da usare per un link INTERNO (related, prev/next, grid)
 * verso `post` nella locale corrente `lc` — unica fonte di verità per ogni
 * componente che linka un post da un altro contesto (non la pagina del post
 * stesso, che ha già `blogLanguages()`/`robots` sopra).
 *
 * Regola (stessa per tutte le famiglie di contenuto in P0.13): 1) variante
 * `lc` indicizzabile → link diretto; 2) altrimenti variante EN indicizzabile
 * → fallback su EN (mai un redirect nel mezzo); 3) altrimenti `null` — il
 * chiamante DEVE nascondere il link, mai puntare a una pagina `noindex`.
 */
export function blogLinkHref(post: BlogPost, lc: Locale): string | null {
  if (isBlogVariantIndexable(post, lc)) {
    return `/${lc}/blog/${localizedBlogSlug(post.slug, lc)}`;
  }
  if (lc !== "en" && isBlogVariantIndexable(post, "en")) {
    return `/en/blog/${localizedBlogSlug(post.slug, "en")}`;
  }
  return null;
}

/**
 * MICRO-GATE P0.13A: variante SINCRONA di `blogLinkHref`, per contesti che
 * non possono `await` (link in-content dentro il corpo markdown dei post,
 * renderizzati da `BlogRenderer`/`renderMarkdownInline`, funzioni sincrone
 * chiamate decine di volte per pagina). Un crawl esaustivo post-merge P0.13
 * ha trovato centinaia di anchor in-content verso varianti noindex — questi
 * link facevano uno swap cieco dello slug (`localizedBlogSlug`) senza mai
 * controllare l'indicizzabilità, perché l'unica via async (`getBlogPosts()`,
 * merge con CMS) non è chiamabile da una funzione sincrona senza riscrivere
 * l'intero albero di rendering come async.
 *
 * Copre SOLO `BLOG_POSTS` (i 51 post autorevoli in lib/blog/data.ts, oggi
 * TUTTI i post pubblici) + overlay nordico applicato su una COPIA (mai gli
 * oggetti condivisi di BLOG_POSTS, per non toccare lo stato mutato altrove
 * da `payload-source.ts`). Se lo slug esiste SOLO nel CMS (nessuno slug oggi,
 * ma teoricamente possibile in futuro), ritorna `undefined`: il chiamante
 * DEVE trattarlo come "sconosciuto qui" e ricadere sul comportamento
 * precedente (swap slug cieco), MAI come "nascondi" — non possiamo dichiarare
 * noindex un post che non riusciamo a verificare qui.
 */
let syncPostsBySlugCache: Record<string, BlogPost> | null = null;
function syncPostsBySlug(): Record<string, BlogPost> {
  if (!syncPostsBySlugCache) {
    syncPostsBySlugCache = {};
    for (const p of BLOG_POSTS) {
      const clone = structuredClone(p);
      applyNordicOverlay(clone, nordicOverlayJson as NordicOverlay);
      syncPostsBySlugCache[clone.slug] = clone;
    }
  }
  return syncPostsBySlugCache;
}

export function blogLinkHrefSync(slug: string, lc: Locale): string | null | undefined {
  const bySlug = syncPostsBySlug();
  const post =
    bySlug[slug] ??
    // MICRO-GATE P0.13A: alcuni post scrivono in-content lo slug GIÀ
    // localizzato per la lingua corrente (es. "/pl/blog/wiele-..."), non
    // lo slug canonico IT — il lookup diretto sopra fallisce sempre in
    // quel caso. canonicalFromBlogUrl fa il reverse-lookup (stessa tabella
    // BLOG_SLUGS usata da localizedBlogSlug) prima di arrendersi.
    (() => {
      const canonical = canonicalFromBlogUrl(slug, lc);
      return canonical ? bySlug[canonical] : undefined;
    })();
  if (!post) return undefined;
  return blogLinkHref(post, lc);
}
