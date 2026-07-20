/**
 * Guardrail P1.1 Fase 3 — il LaTeX renderizzato da InlineMath/BlockMath deve
 * provenire ESCLUSIVAMENTE da costanti interne del codice sorgente, mai da
 * input utente: sia InlineMath che BlockMath fanno `dangerouslySetInnerHTML`
 * sull'output di KaTeX (lib/labs/katex/render.ts), quindi una `tex` che
 * incorporasse testo controllato dall'utente sarebbe un vettore XSS diretto
 * (KaTeX stesso non fa sanitizzazione HTML del suo output).
 *
 * Analisi statica pragmatica, non un vero taint tracker: cerca ogni uso di
 * `tex={...}`/`tex: ...` passato a InlineMath/BlockMath/FormulaCard (o al
 * parametro `tex` di renderMath) e fallisce se il valore è un'espressione
 * che referenzia identificatori tipicamente associati a input non fidato
 * (query/search/param/input/value/formData/request/req/event/props destrutturati
 * da props generiche) invece di essere una stringa letterale o il nome di
 * una costante locale.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_EXCLUDE_DIRS = new Set(["node_modules", ".next", ".git"]);

function walk(dir: string, out: string[]) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SCAN_EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
}

const filesToScan: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), filesToScan);

// I moduli che DEFINISCONO i componenti/la funzione non contano come "uso".
const DEFINITION_FILES = new Set([
  "components/labs/math/InlineMath.tsx",
  "components/labs/math/BlockMath.tsx",
  "components/labs/math/FormulaCard.tsx",
  "lib/labs/katex/render.ts",
]);

// tex={<espressione>} oppure tex: <espressione> (dentro un oggetto passato a FormulaCard/renderMath).
const TEX_PROP_RE = /\btex(?:Tex)?[:=]\s*\{?\s*([^,}\n]+)/g;

const SUSPICIOUS_IDENTIFIER_RE =
  /\b(searchParams|query|param|params\.|req\.|request\.|formData|event\.target|e\.target|input\b|userInput|value\b|window\.location)/i;

for (const file of filesToScan) {
  const rel = path.relative(repoRoot, file);
  if (DEFINITION_FILES.has(rel)) continue;
  const content = fs.readFileSync(file, "utf8");
  if (!/InlineMath|BlockMath|FormulaCard|renderMath/.test(content)) continue;

  let m: RegExpExecArray | null;
  TEX_PROP_RE.lastIndex = 0;
  while ((m = TEX_PROP_RE.exec(content)) !== null) {
    const expr = m[1].trim();
    // Stringa letterale (anche template literal SENZA interpolazione ${...}) o
    // identificatore semplice (nome di costante) sono ok.
    const isStringLiteral = /^["'`][^$]*["'`]$/.test(expr) || /^["'].*["']$/.test(expr);
    const isSimpleIdentifier = /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(expr);
    if (isStringLiteral) continue;
    if (isSimpleIdentifier && !SUSPICIOUS_IDENTIFIER_RE.test(expr)) continue;
    if (SUSPICIOUS_IDENTIFIER_RE.test(expr)) {
      errors.push(
        `${rel}: valore "tex" sospetto (${expr.slice(0, 60)}) — sembra derivare da input utente/richiesta, non da una costante del codice sorgente.`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ KaTeX no-user-input guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✅ KaTeX no-user-input guardrail: ${filesToScan.length} file scansionati, ogni uso di tex/InlineMath/BlockMath/FormulaCard risulta una costante del codice sorgente, nessun input utente rilevato.`,
);
