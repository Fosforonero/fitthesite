/**
 * Estrae i segmenti EN dei post indicati in un JSON (per la traduzione Claude).
 *   npx -y tsx tools/nordic-extract.ts --slugs a,b [--out .wave2-src.json]
 * Output: { slug: { title, locs: {path: en}, lists: {path: [en]} } }
 */
import { writeFileSync } from "node:fs";
import { BLOG_POSTS } from "@/lib/blog/data";
import { walkPost } from "@/lib/blog/nordic-overlay";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const slugs = (flag("--slugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const out = flag("--out") ?? ".wave2-src.json";
if (slugs.length === 0) {
  console.error("--slugs a,b richiesto");
  process.exit(1);
}

const data: Record<string, { title: string; locs: Record<string, string>; lists: Record<string, string[]> }> = {};
for (const slug of slugs) {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) {
    console.error("slug non trovato:", slug);
    process.exit(1);
  }
  const locs: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  for (const e of walkPost(post)) {
    if (e.kind === "loc") {
      const s = e.node.en ?? e.node.it;
      if (s && s.trim()) locs[e.path] = s;
    } else {
      const arr = e.node.en ?? e.node.it;
      if (Array.isArray(arr) && arr.length) lists[e.path] = arr;
    }
  }
  data[slug] = { title: post.hero?.title?.en ?? slug, locs, lists };
}

writeFileSync(out, JSON.stringify(data, null, 2));
const fields = Object.values(data).reduce(
  (n, d) => n + Object.keys(d.locs).length + Object.keys(d.lists).length,
  0,
);
console.log(`Scritto ${out}: ${Object.keys(data).length} articoli, ${fields} campi.`);
