/**
 * Inietta le traduzioni Claude nell'overlay e verifica la copertura.
 *   npx -y tsx tools/nordic-merge.ts --in .wave2-out.json
 * Input: array [{ slug, lang, locs: {path: str}, lists: {path: [str]} }]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { BLOG_POSTS } from "@/lib/blog/data";
import {
  applyNordicOverlay,
  isPostTranslated,
  walkPost,
  NORDIC_LANGS,
  type NordicOverlay,
  type NordicLang,
} from "@/lib/blog/nordic-overlay";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const OVERLAY = "lib/blog/nordic-overlay.json";
const inFile = flag("--in") ?? ".wave2-out.json";

interface Item {
  slug: string;
  lang: NordicLang;
  locs?: Record<string, string>;
  lists?: Record<string, string[]>;
}
// Sorgente input: --in <file> (array), oppure tutti i file .wave2-out-*.json
// (ognuno un singolo item scritto da un agente).
let items: Item[];
if (flag("--in")) {
  items = JSON.parse(readFileSync(inFile, "utf8")) as Item[];
} else {
  const files = readdirSync(".").filter((f) => /^\.wave2-out-.*\.json$/.test(f));
  items = [];
  for (const f of files) {
    const parsed = JSON.parse(readFileSync(f, "utf8"));
    if (Array.isArray(parsed)) items.push(...(parsed as Item[]));
    else items.push(parsed as Item);
  }
  console.log(`Letti ${files.length} file: ${files.join(", ")}`);
}
const overlay: NordicOverlay = existsSync(OVERLAY)
  ? (JSON.parse(readFileSync(OVERLAY, "utf8")) as NordicOverlay)
  : {};

for (const it of items) {
  if (!it || !it.slug || !it.lang) continue;
  const po = (overlay[it.slug] ??= {});
  for (const [path, val] of Object.entries(it.locs ?? {})) {
    (po[path] ??= {} as Record<string, unknown>)[it.lang] = val;
  }
  for (const [path, arr] of Object.entries(it.lists ?? {})) {
    (po[path] ??= {} as Record<string, unknown>)[it.lang] = arr;
  }
}

writeFileSync(OVERLAY, JSON.stringify(overlay, null, 2) + "\n");

// Verifica: per ogni slug toccato, dettaglio path mancanti per lingua attempted.
const slugs = [...new Set(items.map((i) => i.slug))];
const attemptedLangs = new Map<string, Set<string>>();
for (const it of items) {
  if (!attemptedLangs.has(it.slug)) attemptedLangs.set(it.slug, new Set());
  attemptedLangs.get(it.slug)!.add(it.lang);
}
for (const slug of slugs) {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) continue;
  const entries = walkPost(post);
  const po = overlay[slug] ?? {};
  for (const lang of [...(attemptedLangs.get(slug) ?? [])] as NordicLang[]) {
    const miss: string[] = [];
    for (const e of entries) {
      const cell = (po as Record<string, Record<string, unknown>>)[e.path];
      const v = cell ? cell[lang] : undefined;
      if (v == null) {
        miss.push(e.path);
        continue;
      }
      if (e.kind === "list") {
        const srcLen = (e.node.en ?? e.node.it).length;
        if (!Array.isArray(v) || v.length !== srcLen) miss.push(`${e.path}(len ${Array.isArray(v) ? v.length : "?"}/${srcLen})`);
      }
    }
    if (miss.length === 0) {
      console.log(`${slug} [${lang}]: COMPLETO ✓ (${entries.length} campi)`);
    } else {
      console.log(`${slug} [${lang}]: ${miss.length}/${entries.length} MANCANTI -> ${miss.join(", ")}`);
    }
  }
  applyNordicOverlay(post, overlay);
  const done = NORDIC_LANGS.filter((l) => isPostTranslated(post, l));
  console.log(`  => ${slug} indicizzabile in: [${done.join(",")}]`);
}
