/** Ping IndexNow per le landing in spagnolo (ricrawl dopo il completamento es). */
import { LANDING_PAGES } from "@/lib/landing/data";
import { localizedLandingSlug } from "@/lib/blog/slug-i18n";

const SITE = "https://www.fitmesh.fit";
const KEY = "aed642d85d1553233bd5fdec165b1d94";
const urls = LANDING_PAGES.map(
  (lp) => `${SITE}/es/lp/${localizedLandingSlug(lp.slug, "es" as never)}`,
);

async function main(): Promise<void> {
  console.log(`${urls.length} URL es/lp`);
  console.log(urls.slice(0, 3).join("\n"));
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
