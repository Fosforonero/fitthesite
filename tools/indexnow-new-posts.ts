/** Ping IndexNow per i 3 nuovi articoli (02/07), solo varianti indicizzabili. */
import { BLOG_POSTS } from "@/lib/blog/data";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { locales } from "@/lib/i18n";

const SITE = "https://www.fitmesh.fit";
const KEY = "aed642d85d1553233bd5fdec165b1d94";
const NEW = new Set([
  "fitmesh-gratis-prezzo-founder",
  "anello-colmi-r02-affidabile",
  "cambiare-smartwatch-senza-perdere-dati",
  "come-funziona-fitmesh",
  "dove-sono-i-tuoi-dati-server-ue",
  "mesh-famiglia-lancio",
  "fitmesh-vs-alternative-sync",
  "perche-diventare-founder-fitmesh",
  "colmi-r09-temperatura-sviluppo",
]);

async function main(): Promise<void> {
  const posts = BLOG_POSTS.filter((p) => NEW.has(p.slug));
  const urls: string[] = [];
  for (const p of posts) {
    for (const lc of locales) {
      if (!isBlogVariantIndexable(p, lc)) continue; // salta i nordici noindex
      urls.push(`${SITE}/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`);
    }
  }
  console.log(`${posts.length} post, ${urls.length} URL indicizzabili`);
  console.log(urls.slice(0, 4).join("\n"));
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
