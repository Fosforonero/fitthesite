/**
 * Fonte di verità UNICA per "questa variante (post, locale) è indicizzabile?".
 *
 * Un post del blog esce `noindex` solo per i locali nordici (sv/da/no/fi)
 * finché non è completamente tradotto: altrimenti mostrerebbe il contenuto EN
 * di fallback sotto un URL nordico. Prima questa logica era duplicata a mano in
 * `blog/[slug]/page.tsx` (robots + hreflang), in `sitemap.ts` e in `feed.xml`, e
 * i tre divergevano: sitemap/feed/hreflang sottomettevano le varianti nordiche
 * non tradotte come indicizzabili mentre la pagina emetteva `noindex` (warning
 * "Submitted URL marked noindex" in Search Console). Un solo helper qui è la
 * fonte di verità: tutti e tre lo importano, quindi non possono più divergere.
 */
import { UNTRANSLATED_CONTENT_LOCALES, type Locale } from "@/lib/i18n";
import { isPostTranslated, type NordicLang } from "@/lib/blog/nordic-overlay";
import type { BlogPost } from "@/lib/blog/types";

/** True se la pagina `(post, locale)` è indicizzabile (NON esce `noindex`). */
export function isBlogVariantIndexable(post: BlogPost, lc: Locale): boolean {
  if (!UNTRANSLATED_CONTENT_LOCALES.has(lc)) return true;
  // Qui `lc` è per forza un locale nordico (l'insieme = NORDIC_LANGS).
  return isPostTranslated(post, lc as NordicLang);
}
