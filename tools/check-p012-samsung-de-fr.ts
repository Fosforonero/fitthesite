/**
 * Verifica una tantum SPRINT P0.12 FASE 5 — conferma che le nuove
 * traduzioni DE/FR di fitmesh-samsung-health-usarli-insieme siano
 * realmente indicizzabili (isBlogVariantIndexable) e che i metaDescription
 * restino in lunghezza ragionevole. Non e' un guardrail permanente (nessun
 * futuro post dipende da questo file) — usato una volta per QA pre-PR.
 *
 * Uso (Docker):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p012-samsung-de-fr.ts
 */
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { post } from "@/lib/blog/posts/fitmesh-samsung-health-usarli-insieme";

const locales: Array<"de" | "fr" | "it" | "en"> = ["it", "en", "de", "fr"];
let ok = true;

for (const lc of locales) {
  const indexable = isBlogVariantIndexable(post, lc);
  console.log(`${lc}: isBlogVariantIndexable = ${indexable}`);
  if (!indexable) ok = false;
}

console.log("\n--- metaDescription lengths ---");
for (const lc of ["it", "en", "de", "fr"] as const) {
  const len = post.metaDescription[lc]?.length ?? 0;
  console.log(`${lc}: ${len} chars`);
}

console.log("\n--- seoTitle lengths ---");
for (const lc of ["it", "en", "de", "fr"] as const) {
  const len = post.seoTitle?.[lc]?.length ?? 0;
  console.log(`${lc}: ${len} chars`);
}

console.log("\n--- secondaryKeywords / tldr length parity ---");
for (const lc of ["it", "en", "de", "fr"] as const) {
  console.log(`${lc}: secondaryKeywords=${post.secondaryKeywords[lc]?.length}, tldr=${post.tldr?.[lc]?.length}`);
}

if (!ok) {
  console.error("\n❌ Una o più varianti non sono indicizzabili.");
  process.exit(1);
}
console.log("\n✅ it/en/de/fr tutte indicizzabili.");
