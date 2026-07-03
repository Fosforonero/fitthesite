/**
 * Verifica che i post indicati abbiano es+de su OGNI campo traducibile
 * (le chiavi Localized sono opzionali → tsc non le controlla; qui sì).
 * Uso: npx -y tsx tools/check-esde-coverage.ts [slug1 slug2 ...]
 */
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { walkPost } from "@/lib/blog/nordic-overlay";

const DEFAULT = [
  "fitmesh-gratis-prezzo-founder",
  "anello-colmi-r02-affidabile",
  "cambiare-smartwatch-senza-perdere-dati",
];
const SLUGS = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
const LANGS = ["es", "de"] as const;

let problems = 0;
for (const slug of SLUGS) {
  const post = BLOG_POSTS_BY_SLUG[slug];
  if (!post) {
    console.error(`❌ post assente: ${slug}`);
    problems++;
    continue;
  }
  const entries = walkPost(post);
  let missing = 0;
  for (const e of entries) {
    const node = e.node as Record<string, unknown>;
    for (const lang of LANGS) {
      const v = node[lang];
      if (v == null) {
        missing++;
        if (missing <= 6) console.error(`  [${slug}] ${e.path} manca ${lang}`);
        continue;
      }
      if (e.kind === "list") {
        const en = node.en as unknown[];
        if (!Array.isArray(v) || v.length !== en.length) {
          missing++;
          if (missing <= 6)
            console.error(
              `  [${slug}] ${e.path} ${lang}: lista ${Array.isArray(v) ? v.length : "n/a"} != en ${en.length}`,
            );
        }
      }
    }
  }
  console.log(`${slug}: ${entries.length} campi, ${missing} problemi es/de`);
  problems += missing;
}

if (problems > 0) {
  console.error(`\n❌ TOTALE problemi es/de: ${problems}`);
  process.exit(1);
}
console.log("\n✅ es+de completi su tutti i campi dei post controllati.");
