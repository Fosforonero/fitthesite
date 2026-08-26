/**
 * Ping IndexNow per gli URL editoriali REALMENTE modificati da P1.8C
 * (PR #58, merge SHA 7ae6379), solo varianti indicizzabili.
 *
 * Scope deliberatamente ristretto (istruzione esplicita di Matteo,
 * 26/08/2026): SOLO contenuto editoriale con testo realmente cambiato.
 * Esclude google-health-google-fit (solo cambio cover, testo/H1/metadata
 * invariati per mandato — non e' una modifica editoriale).
 */
import { BLOG_POSTS } from "@/lib/blog/data";
import { PROVIDERS } from "@/lib/providers/data";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { isProviderVariantIndexable } from "@/lib/providers/indexability";
import { locales } from "@/lib/i18n";
import { pingIndexNow } from "@/lib/seo/indexnow";

const SITE = "https://www.fitmesh.fit";
const BLOG_SLUGS = new Set(["dati-pixel-watch-dashboard", "google-fit-api-dismissione-2026"]);
const PROVIDER_SLUGS = new Set(["pixel-watch", "wear-os"]);

async function main(): Promise<void> {
  const urls: string[] = [];

  for (const p of BLOG_POSTS.filter((x) => BLOG_SLUGS.has(x.slug))) {
    for (const lc of locales) {
      if (!isBlogVariantIndexable(p, lc)) continue;
      urls.push(`${SITE}/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`);
    }
  }

  for (const p of PROVIDERS.filter((x) => PROVIDER_SLUGS.has(x.slug))) {
    for (const lc of locales) {
      if (!isProviderVariantIndexable(p, lc)) continue;
      urls.push(`${SITE}/${lc}/sync/${p.slug}`);
    }
  }

  console.log(`${urls.length} URL indicizzabili da inviare a IndexNow:`);
  console.log(urls.join("\n"));

  const result = await pingIndexNow(urls);
  console.log(`IndexNow: ${result.ok ? "OK" : "FALLITO"} (status ${result.status ?? "n/d"}${result.error ? `, ${result.error}` : ""})`);
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
