import { BLOG_POSTS } from "@/lib/blog/data";
import { walkPost } from "@/lib/blog/nordic-overlay";
import { locales, UNTRANSLATED_CONTENT_LOCALES } from "@/lib/i18n";

const NON_GATED = locales.filter(l => l !== "it" && l !== "en" && !UNTRANSLATED_CONTENT_LOCALES.has(l));
let totalDupes = 0;
const byLocale: Record<string, number> = {};
for (const post of BLOG_POSTS) {
  const entries = walkPost(post);
  for (const lc of NON_GATED) {
    let complete = true;
    for (const e of entries) {
      const v = (e.node as Record<string, unknown>)[lc];
      if (v == null) { complete = false; break; }
      if (e.kind === "list") {
        const src = (e.node.en ?? e.node.it) as unknown[];
        if (!Array.isArray(v) || v.length !== src.length) { complete = false; break; }
      }
    }
    if (!complete) {
      totalDupes++;
      byLocale[lc] = (byLocale[lc] ?? 0) + 1;
    }
  }
}
console.log("Post totali:", BLOG_POSTS.length, "| Locali non-gated (non it/en/nordiche):", NON_GATED.join(","));
console.log("TOTALE pagine potenzialmente duplicate (fallback EN auto-canonicalizzato):", totalDupes);
console.log("Per lingua:", byLocale);
