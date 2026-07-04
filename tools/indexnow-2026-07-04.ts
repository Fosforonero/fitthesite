/** Ping IndexNow per le pagine toccate il 04/07 (pillar rename + Colmi wording + fix canonical). */
import { BLOG_POSTS } from "@/lib/blog/data";
import { LANDING_PAGES } from "@/lib/landing/data";
import { localizedBlogSlug, localizedLandingSlug } from "@/lib/blog/slug-i18n";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { isLandingVariantIndexable } from "@/lib/landing/indexability";
import { locales } from "@/lib/i18n";

const SITE = "https://www.fitmesh.fit";
const KEY = "aed642d85d1553233bd5fdec165b1d94";
const POSTS = new Set([
  "colmi-ring-fitmesh",
  "guida-sync-wearable-2026",
  "scegliere-smartwatch-dati-2026",
  "piu-smartwatch-insieme-dati-doppi",
  "cambiare-smartwatch-senza-perdere-dati",
]);
const LPS = new Set(["anello-smart-sonno"]);

async function main(): Promise<void> {
  const urls: string[] = [];
  for (const p of BLOG_POSTS.filter((p) => POSTS.has(p.slug))) {
    for (const lc of locales) {
      if (!isBlogVariantIndexable(p, lc)) continue;
      urls.push(`${SITE}/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`);
    }
  }
  for (const lp of LANDING_PAGES.filter((lp) => LPS.has(lp.slug))) {
    for (const lc of locales) {
      if (!isLandingVariantIndexable(lp, lc)) continue;
      urls.push(`${SITE}/${lc}/lp/${localizedLandingSlug(lp.slug, lc)}`);
    }
  }
  console.log(`${urls.length} URL`);
  console.log(urls.slice(0, 5).join("\n"));
  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "www.fitmesh.fit",
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  console.log(`IndexNow HTTP ${res.status} ${res.statusText}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
