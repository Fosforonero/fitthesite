/**
 * lib/content/ultra-guide-block.ts: blocco «guida ultratleta» in fondo a
 * «Come funziona» nella home (U-STRUCT-01, S02).
 *
 * Modulo PURO: nessun accesso a rete, catalogo o file. La pagina passa il
 * catalogo (`postsBySlug`), la lingua e le due funzioni di indicizzazione, e
 * riceve `null` oppure i campi gia' pronti da rendere.
 *
 * Il blocco esiste SOLO se:
 *   1. il post e' presente nel catalogo (il post reale arriva dalla lane
 *      guida: finche' non e' integrato il risultato e' sempre `null`);
 *   2. la variante nella LINGUA DELLA PAGINA e' indicizzabile (nessun rinvio
 *      alla variante inglese di una pagina localizzata: se la lingua non ha
 *      il post completo il blocco non si rende).
 *
 * Testo: titolo e sottotitolo vengono dal post (hero.title, hero.subtitle),
 * etichetta e «Leggi» dalle chiavi esistenti HOMEPAGE_COPY.guideLabel e
 * readLabel. Nessuna stringa nuova, quindi nessuna traduzione da fare qui.
 */
import type { Locale } from "@/lib/i18n";
import { tl, type BlogPost } from "@/lib/blog/types";
import { HOMEPAGE_COPY } from "@/lib/content/homepage-copy";

/**
 * Chiave interna proposta dalla lane guida (ADDENDUM-PM-USO-REALE-ULTRATLETA).
 * DA CONFERMARE all'integrazione con lo slug effettivo registrato in
 * lib/blog/slugs.ts: se cambia, si cambia solo questa costante.
 */
export const ULTRA_GUIDE_SLUG = "fitmesh-ultratleta-apple-watch-garmin-polar";

export type UltraGuideBlock = {
  href: string;
  kicker: string;
  title: string;
  text: string;
  readLabel: string;
};

export function ultraGuideBlock(args: {
  postsBySlug: Record<string, BlogPost | undefined>;
  lc: Locale;
  isBlogVariantIndexable: (post: BlogPost, lc: Locale) => boolean;
  blogLinkHref: (post: BlogPost, lc: Locale) => string | null;
  slug?: string;
}): UltraGuideBlock | null {
  const { postsBySlug, lc, isBlogVariantIndexable, blogLinkHref } = args;
  const post = postsBySlug[args.slug ?? ULTRA_GUIDE_SLUG];
  if (!post) return null;
  if (!isBlogVariantIndexable(post, lc)) return null;
  const href = blogLinkHref(post, lc);
  if (!href) return null;
  return {
    href,
    kicker: tl(HOMEPAGE_COPY.guideLabel, lc),
    title: tl(post.hero.title, lc),
    text: tl(post.hero.subtitle, lc),
    readLabel: tl(HOMEPAGE_COPY.readLabel, lc),
  };
}
