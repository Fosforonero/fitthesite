/**
 * One-shot: submit the currently-indexable Nordic blog post URLs to IndexNow.
 * Uses the SAME isPostTranslated logic that gates noindex in production, so we
 * never ping a URL that is still noindex (no/fi incomplete posts are skipped).
 *
 *   docker run --rm -v "$PWD":/work -w /work/fitthesite-f1 node:22 \
 *     npx -y tsx tools/indexnow-nordic-oneshot.ts [--dry]
 */
import { BLOG_POSTS } from "@/lib/blog/data";
import {
  applyNordicOverlay,
  isPostTranslated,
  NORDIC_LANGS,
  type NordicOverlay,
} from "@/lib/blog/nordic-overlay";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import overlay from "@/lib/blog/nordic-overlay.json";

const SITE = "https://www.fitmesh.fit";
const KEY = "aed642d85d1553233bd5fdec165b1d94";

const urls: string[] = [];
for (const post of BLOG_POSTS) {
  applyNordicOverlay(post, overlay as unknown as NordicOverlay);
  for (const lang of NORDIC_LANGS) {
    if (isPostTranslated(post, lang)) {
      urls.push(`${SITE}/${lang}/blog/${localizedBlogSlug(post.slug, lang as never)}`);
    }
  }
}

const perLang: Record<string, number> = {};
for (const u of urls) {
  const l = u.split("/")[3];
  perLang[l] = (perLang[l] ?? 0) + 1;
}
console.log(`Indexable Nordic blog URLs: ${urls.length}  ${JSON.stringify(perLang)}`);
console.log("sample:\n" + urls.slice(0, 4).join("\n"));

async function main(): Promise<void> {
  if (process.argv.includes("--dry")) {
    console.log("DRY RUN — not submitting.");
    return;
  }
  const body = {
    host: new URL(SITE).hostname,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList: urls,
  };
  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  console.log(`IndexNow HTTP ${res.status} ${res.statusText}`);
  const txt = await res.text().catch(() => "");
  if (txt) console.log("resp:", txt.slice(0, 300));
}

main();
