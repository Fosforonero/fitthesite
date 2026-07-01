/**
 * Ranka i post blog nordici incompleti per urgenza: pillar prima, poi quelli
 * piu' vicini al completamento (meno lingue mancanti). Solo lettura.
 *   npx -y tsx tools/nordic-priority.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { BLOG_POSTS } from "@/lib/blog/data";
import {
  applyNordicOverlay,
  isPostTranslated,
  NORDIC_LANGS,
  type NordicOverlay,
} from "@/lib/blog/nordic-overlay";

const OVERLAY = "lib/blog/nordic-overlay.json";
const ov: NordicOverlay = existsSync(OVERLAY)
  ? (JSON.parse(readFileSync(OVERLAY, "utf8")) as NordicOverlay)
  : {};

interface Row {
  slug: string;
  pillar: boolean;
  title: string;
  kw: string;
  missing: string[];
}
const rows: Row[] = [];
for (const post of BLOG_POSTS) {
  applyNordicOverlay(post, ov);
  const missing = NORDIC_LANGS.filter((l) => !isPostTranslated(post, l));
  if (missing.length === 0) continue;
  rows.push({
    slug: post.slug,
    pillar: Boolean((post as { pillar?: boolean }).pillar),
    title: post.hero?.title?.en ?? post.slug,
    kw: post.primaryKeyword?.en ?? "",
    missing,
  });
}
rows.sort(
  (a, b) => Number(b.pillar) - Number(a.pillar) || a.missing.length - b.missing.length,
);
rows.forEach((r, i) => {
  console.log(
    `${String(i + 1).padStart(2)}. ${r.pillar ? "PILLAR" : "      "} [${r.missing.join(",")}] ${r.slug}\n      ${r.title}  ${r.kw ? "(kw: " + r.kw + ")" : ""}`,
  );
});
console.log(`\nIncompleti: ${rows.length} (pillar: ${rows.filter((r) => r.pillar).length})`);
