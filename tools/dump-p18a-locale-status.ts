/**
 * Sprint P1.8A — dump reale (non basato su commenti) dello stato
 * indicizzabile per locale dei due post target, via isBlogVariantIndexable,
 * con overlay nordico applicato su una copia (stessa pipeline reale di
 * lib/blog/indexability.ts:syncPostsBySlug — vedi commento li' per il
 * perche' della copia, mai l'oggetto condiviso di BLOG_POSTS).
 * Usa: docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/dump-p18a-locale-status.ts
 */
import { BLOG_POSTS } from "@/lib/blog/data";
import { isBlogVariantIndexable, isPostLocaleComplete } from "@/lib/blog/indexability";
import { applyNordicOverlay } from "@/lib/blog/nordic-overlay";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";
import { locales } from "@/lib/i18n";

const SLUGS = ["health-connect-not-syncing", "garmin-samsung-health-sync-guide"];

for (const slug of SLUGS) {
  const base = BLOG_POSTS.find((p) => p.slug === slug);
  if (!base) {
    console.log(`${slug}: NOT FOUND in BLOG_POSTS`);
    continue;
  }
  const post = structuredClone(base);
  applyNordicOverlay(post, nordicOverlayJson as any);
  console.log(`\n=== ${slug} ===`);
  for (const lc of locales) {
    const indexable = isBlogVariantIndexable(post, lc);
    const complete = isPostLocaleComplete(post, lc);
    console.log(`  ${lc}: ${indexable ? "INDEXABLE" : "noindex"} (complete=${complete})`);
  }
}
