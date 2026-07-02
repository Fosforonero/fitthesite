/**
 * Inietta le traduzioni spagnole Claude nell'overlay landing (`es-overlay.json`).
 * Legge i file .landing-es-out-<slug>.json ({ slug, locs, lists }).
 *   npx -y tsx tools/landing-es-merge.ts
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import type { EsOverlay } from "@/lib/landing/es-overlay";

const OVERLAY = "lib/landing/es-overlay.json";
const files = readdirSync(".").filter((f) => /^\.landing-es-out-.*\.json$/.test(f));
const overlay: EsOverlay = existsSync(OVERLAY)
  ? (JSON.parse(readFileSync(OVERLAY, "utf8")) as EsOverlay)
  : {};

let loc = 0;
let list = 0;
for (const f of files) {
  const it = JSON.parse(readFileSync(f, "utf8")) as {
    slug: string;
    locs?: Record<string, string>;
    lists?: Record<string, string[]>;
  };
  if (!it?.slug) continue;
  const po = (overlay[it.slug] ??= {});
  for (const [p, v] of Object.entries(it.locs ?? {})) {
    po[p] = v;
    loc++;
  }
  for (const [p, v] of Object.entries(it.lists ?? {})) {
    po[p] = v;
    list++;
  }
}

writeFileSync(OVERLAY, JSON.stringify(overlay, null, 2) + "\n");
console.log(`Merge: ${files.length} file letti, ${loc} loc + ${list} liste iniettati in ${OVERLAY}.`);
