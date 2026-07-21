/**
 * Guardrail Sprint P1.3 Fase 12 — "em dash nello scope Labs": lo em-dash
 * ("—") e' bandito dal copy del progetto (regola pre-esistente, vedi
 * cleanup em-dash del sito). Scansiona solo le righe di CONTENUTO
 * (esclude commenti `//`/`*`/`/*`, dove uno em-dash e' innocuo perche' mai
 * mostrato all'utente) dei file che definiscono il testo visibile del
 * cluster Labs: contenuto dei due calcolatori, teaser homepage, indice
 * Labs, e i due nuovi articoli del cluster sonno/HRV/recovery.
 *
 * Uso (Docker): npx tsx tools/check-labs-no-em-dash.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

const TARGETS = [
  "lib/labs/hrv/content.ts",
  "lib/labs/sleep-efficiency/content.ts",
  "lib/labs/index-content.ts",
  "lib/content/labs-teaser-copy.ts",
  "lib/blog/posts/efficienza-del-sonno-formula-calcolo.ts",
  "lib/blog/posts/metriche-recupero-hrv-sonno-frequenza-cardiaca.ts",
  "components/labs/HrvCharts.tsx",
  "components/labs/HrvRmssdCalculator.tsx",
  "components/labs/SleepEfficiencyCalculator.tsx",
  "components/labs/pages/HrvToolPageBody.tsx",
  "components/labs/pages/SleepEfficiencyToolPageBody.tsx",
  "components/labs/LabsFaq.tsx",
  "components/labs/LabsSources.tsx",
  "components/labs/LabsCitationBlock.tsx",
  "components/labs/LabsChrome.tsx",
];

const errors: string[] = [];

for (const rel of TARGETS) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) {
    errors.push(`[file-mancante] "${rel}" atteso ma non trovato.`);
    continue;
  }
  const lines = fs.readFileSync(full, "utf8").split("\n");
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const isComment = trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
    if (!isComment && line.includes("—")) {
      errors.push(`[em-dash] ${rel}:${i + 1}: "${line.trim().slice(0, 140)}"`);
    }
  });
}

if (errors.length > 0) {
  console.error(`❌ Labs no-em-dash guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✅ Labs no-em-dash guardrail OK: ${TARGETS.length} file scansionati (righe di contenuto, commenti esclusi), zero em-dash trovati.`);
