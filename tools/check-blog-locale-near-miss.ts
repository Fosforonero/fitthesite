/**
 * Guardrail P1.3Q — rileva NUOVE combinazioni post/locale noindex per una
 * divergenza minima (1-2 campi mancanti), il pattern trovato durante P1.3M
 * su `health-connect-vs-samsung-health` (secondaryKeywords senza chiave
 * es/de per 2 mesi, non notato perche' nessun guardrail lo controllava).
 *
 * Confronta contro `docs/seo/blog-locale-near-miss-baseline.json`, una
 * baseline ESTERNA (non una whitelist nel codice): fallisce SOLO se compare
 * una combinazione post/locale non gia' in baseline (probabile svista
 * appena introdotta). NON fallisce se il numero diminuisce (correzioni
 * future sono benvenute, non serve aggiornare questo script per farle
 * passare) ne' se una combinazione in baseline sparisce (post corretto).
 *
 * Le 97 combinazioni preesistenti in baseline sono debito tecnico
 * documentato, tracciato come P1.3Q, esplicitamente FUORI SCOPE per lo
 * sprint che ha introdotto questo guardrail (P1.3M): non le corregge, le
 * rende solo visibili e monitorate nel tempo.
 *
 * Uso (Docker): npx tsx tools/check-blog-locale-near-miss.ts
 * Rigenerare la baseline dopo una correzione intenzionale:
 *   npx tsx tools/check-blog-locale-near-miss.ts --write-baseline
 */
import fs from "node:fs";
import path from "node:path";
import { BLOG_POSTS } from "@/lib/blog/data";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { walkPost } from "@/lib/blog/nordic-overlay";
import { locales } from "@/lib/i18n";

const repoRoot = path.resolve(__dirname, "..");
const BASELINE_FILE = path.join(repoRoot, "docs/seo/blog-locale-near-miss-baseline.json");
const NEAR_MISS_THRESHOLD = 2;

interface BaselineEntry {
  slug: string;
  locale: string;
  missingFields: string[];
}

function missingFieldPaths(post: (typeof BLOG_POSTS)[number], lc: (typeof locales)[number]): string[] {
  const entries = walkPost(post, lc);
  const missing: string[] = [];
  for (const e of entries) {
    const val = (e.node as Record<string, unknown>)[lc];
    if (val == null) {
      missing.push(e.path);
      continue;
    }
    if (e.kind === "list") {
      const src = (e.node.en ?? e.node.it) as unknown[];
      if (!Array.isArray(val) || val.length !== src.length) {
        missing.push(`${e.path} (length mismatch)`);
      }
    }
  }
  return missing;
}

function scan(): BaselineEntry[] {
  const nonRequired = locales.filter((lc) => lc !== "it" && lc !== "en");
  const out: BaselineEntry[] = [];
  for (const post of BLOG_POSTS) {
    for (const lc of nonRequired) {
      if (isBlogVariantIndexable(post, lc)) continue;
      const missing = missingFieldPaths(post, lc);
      if (missing.length > 0 && missing.length <= NEAR_MISS_THRESHOLD) {
        out.push({ slug: post.slug, locale: lc, missingFields: missing });
      }
    }
  }
  return out;
}

const current = scan();

if (process.argv.includes("--write-baseline")) {
  const baseline = {
    description:
      "P1.3Q — debito tecnico noto: post/locale gia' noindex per 1-2 campi mancanti (quasi sempre secondaryKeywords senza chiave es/de, root cause identica a health-connect-vs-samsung-health/P1.3M). Il guardrail fallisce solo se compaiono NUOVE combinazioni oltre questa lista; puo' diminuire liberamente quando vengono corrette.",
    scannedAt: new Date().toISOString().slice(0, 10),
    total: current.length,
    entries: current,
  };
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2) + "\n");
  console.log(`✅ Baseline rigenerata: ${current.length} combinazioni scritte in ${path.relative(repoRoot, BASELINE_FILE)}.`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_FILE)) {
  console.error(`❌ Baseline non trovata: ${path.relative(repoRoot, BASELINE_FILE)}. Generarla con --write-baseline.`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8")) as { entries: BaselineEntry[] };
const knownKeys = new Set(baseline.entries.map((e) => `${e.slug}/${e.locale}`));

const currentKeys = new Set(current.map((e) => `${e.slug}/${e.locale}`));
const newOnes = current.filter((e) => !knownKeys.has(`${e.slug}/${e.locale}`));
const fixedOnes = [...knownKeys].filter((k) => !currentKeys.has(k));

console.log(`📊 Near-miss (≤${NEAR_MISS_THRESHOLD} campi mancanti): ${current.length} attuali, ${baseline.entries.length} in baseline.`);
if (fixedOnes.length > 0) {
  console.log(`✅ ${fixedOnes.length} combinazioni della baseline sono state corrette (non più near-miss): ${fixedOnes.join(", ")}.`);
  console.log(`   Considera di rigenerare la baseline con --write-baseline per farla scendere ufficialmente.`);
}

if (newOnes.length > 0) {
  console.error(`❌ ${newOnes.length} NUOVA/E combinazione/i post/locale near-miss non in baseline:`);
  for (const e of newOnes) {
    console.error(`  - ${e.slug}/${e.locale}: ${e.missingFields.join(", ")}`);
  }
  console.error(`   Se è una svista, completare la traduzione. Se è intenzionale (nuovo post appena iniziato), verificare che non sia davvero solo 1-2 campi mancanti.`);
  process.exit(1);
}

console.log(`✅ Nessuna nuova combinazione post/locale near-miss oltre la baseline nota (P1.3Q, ${baseline.entries.length} voci documentate).`);
