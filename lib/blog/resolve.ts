/**
 * Risolve lo slug d'URL (localizzato) → post, unica implementazione condivisa
 * fra la pagina articolo (`blog/[slug]/page.tsx`) e la generazione
 * dell'immagine OG (`blog/[slug]/opengraph-image.tsx`). Prima ognuno aveva la
 * propria logica: la pagina usava questo resolver (CMS + fallback TS via
 * `getBlogPostBySlug`, che applica anche l'overlay nordico), l'OG image
 * leggeva invece `BLOG_POSTS_BY_SLUG` (solo i post TS, sempre con lo slug
 * canonico IT) — quindi ogni post CMS-only e ogni URL non-IT risolveva a
 * "post non trovato" e l'immagine OG cadeva sul fallback vuoto.
 *
 * Se l'URL usa il vecchio slug IT su un locale non-IT (link/indice storici),
 * ritorna `redirectTo` con lo slug localizzato corretto (308 permanente,
 * SEO-safe) — usato solo dalla pagina articolo, l'OG image lo ignora e usa
 * comunque il post risolto.
 */
import type { Locale } from "@/lib/i18n";
import { canonicalFromBlogUrl, localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { getBlogPostBySlug } from "@/lib/blog/payload-source";
import type { BlogPost } from "@/lib/blog/types";

export async function resolveBlogPost(
  urlSlug: string,
  lc: Locale,
): Promise<{ post: BlogPost | null; redirectTo: string | null }> {
  const canonical = canonicalFromBlogUrl(urlSlug, lc);
  if (canonical) {
    const post = await getBlogPostBySlug(canonical);
    if (post) return { post, redirectTo: null };
  }
  const post = await getBlogPostBySlug(urlSlug);
  if (!post) return { post: null, redirectTo: null };
  const correct = localizedBlogSlug(urlSlug, lc);
  return {
    post,
    redirectTo: correct !== urlSlug ? `/${lc}/blog/${correct}` : null,
  };
}
