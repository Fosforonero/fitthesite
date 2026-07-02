/**
 * Estrae i campi SENZA spagnolo delle landing (en source) in un JSON, per la
 * traduzione Claude. Output: { slug: { title, locs: {path:en}, lists: {path:[en]} } }
 *   npx -y tsx tools/landing-es-extract.ts [--slugs a,b] [--out .landing-es-src.json]
 */
import { writeFileSync } from "node:fs";
import { LANDING_PAGES } from "@/lib/landing/data";
import { landingEsMissing } from "@/lib/landing/es-overlay";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const only = (flag("--slugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const out = flag("--out") ?? ".landing-es-src.json";

const data: Record<string, { title: string; locs: Record<string, string>; lists: Record<string, string[]> }> = {};
for (const lp of LANDING_PAGES) {
  if (only.length && !only.includes(lp.slug)) continue;
  const locs: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  for (const e of landingEsMissing(lp)) {
    if (e.kind === "loc") {
      const s = e.node.en ?? e.node.it;
      if (s && s.trim()) locs[e.path] = s;
    } else {
      const arr = e.node.en ?? e.node.it;
      if (Array.isArray(arr) && arr.length) lists[e.path] = arr;
    }
  }
  if (Object.keys(locs).length || Object.keys(lists).length) {
    data[lp.slug] = { title: lp.hero.title.en ?? lp.slug, locs, lists };
  }
}

writeFileSync(out, JSON.stringify(data, null, 2));
const fields = Object.values(data).reduce((n, d) => n + Object.keys(d.locs).length + Object.keys(d.lists).length, 0);
console.log(`Scritto ${out}: ${Object.keys(data).length} LP, ${fields} campi senza es.`);
for (const [slug, d] of Object.entries(data)) {
  console.log(`  ${slug}: ${Object.keys(d.locs).length} loc + ${Object.keys(d.lists).length} liste`);
}
