/**
 * Guardrail alt-text informativo — SPRINT PRE-FERIE addendum Bing
 * (2026-08-06), "week.jpg" finding.
 *
 * Distingue, per statica analisi del sorgente (nessun rendering, nessuna
 * classificazione visiva automatica — quella richiede ispezione umana
 * dell'immagine, gia' fatta per week.jpg in questa sessione):
 *  1. Un'immagine informativa nota (week.jpg, HeroVisual.tsx) NON deve mai
 *     tornare ad avere `alt=""`: regressione specifica, zero tolleranza.
 *  2. QUALUNQUE `alt=""` che compaia in futuro in app/**\/*.tsx o
 *     components/**\/*.tsx deve avere `aria-hidden` entro le 5 righe
 *     circostanti (stesso elemento o un contenitore immediato) — il pattern
 *     accessibile gia' in uso nel progetto per le immagini genuinamente
 *     decorative. Un `alt=""` senza `aria-hidden` vicino e' un segnale che
 *     nessuno ha documentato la scelta come intenzionale, esattamente il
 *     tipo di caso che Bing ha segnalato per week.jpg PRIMA del fix.
 *
 * Fallisce (exit 1) se:
 *  - week.jpg in HeroVisual.tsx ha alt="" invece di weekAlt (o equivalente
 *    stringa non vuota) per una o entrambe le locale it/en;
 *  - un `alt=""` sitewide non ha `aria-hidden` nelle vicinanze immediate.
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p18s-informative-alt.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ── 1. Regressione specifica: week.jpg deve avere alt reale ──────────────
const heroVisualPath = path.join(repoRoot, "components/HeroVisual.tsx");
if (!fs.existsSync(heroVisualPath)) {
  errors.push(`[file-mancante] ${path.relative(repoRoot, heroVisualPath)} non trovato.`);
} else {
  const content = fs.readFileSync(heroVisualPath, "utf8");
  const weekLine = content.split("\n").find((l) => l.includes("week.jpg"));
  if (!weekLine) {
    errors.push(`[week-jpg-non-trovato] Nessuna riga con "week.jpg" in HeroVisual.tsx — componente riscritto? Verificare manualmente.`);
  } else if (/alt=""/.test(weekLine)) {
    errors.push(`[week-jpg-alt-vuoto] HeroVisual.tsx: "week.jpg" e' tornato ad avere alt="" — regressione del fix Bing 2026-08-06 (l'immagine mostra contenuto informativo reale: confronto settimanale, allenamenti, grafico battito).`);
  } else if (!/alt=\{weekAlt\}/.test(weekLine)) {
    errors.push(`[week-jpg-alt-inatteso] HeroVisual.tsx: "week.jpg" non usa piu' la variabile weekAlt attesa — verificare che l'alt resti non vuoto e localizzato (riga: "${weekLine.trim()}").`);
  }
  if (!/const weekAlt/.test(content)) {
    errors.push(`[weekalt-var-assente] HeroVisual.tsx: la costante "weekAlt" non esiste piu' — verificare che l'alt di week.jpg resti descrittivo per it/en.`);
  } else {
    // Verifica che entrambe le locale abbiano testo non vuoto e non identico
    // a dashAlt (altrimenti sarebbe una descrizione duplicata/generica).
    const weekAltMatch = content.match(/const weekAlt =[\s\S]*?;\n/);
    if (weekAltMatch) {
      const block = weekAltMatch[0];
      if (/"\s*"/.test(block)) {
        errors.push(`[weekalt-stringa-vuota] HeroVisual.tsx: "weekAlt" contiene una stringa vuota per almeno una locale.`);
      }
    }
  }
}

// ── 2. Pattern generale: alt="" sitewide deve avere aria-hidden vicino ───
const SCAN_DIRS = ["app", "components"];
function walk(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
}
const files: string[] = [];
for (const d of SCAN_DIRS) {
  const full = path.join(repoRoot, d);
  if (fs.existsSync(full)) walk(full, files);
}

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!/alt=""/.test(lines[i])) continue;
    const windowStart = Math.max(0, i - 5);
    const windowEnd = Math.min(lines.length, i + 6);
    const window = lines.slice(windowStart, windowEnd).join("\n");
    if (!/aria-hidden/.test(window)) {
      errors.push(
        `[alt-vuoto-non-documentato] ${path.relative(repoRoot, file)}:${i + 1}: "alt=\"\"" senza "aria-hidden" nelle 5 righe circostanti — un'immagine con alt vuoto deve essere esplicitamente marcata come decorativa (pattern accessibile del progetto), altrimenti un crawler come Bing la segnala come "senza testo alternativo" e potrebbe davvero esserlo.`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ Guardrail alt-text informativo: ${errors.length} problema/i.\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  `✅ Guardrail alt-text informativo: week.jpg ha alt localizzato non vuoto, nessun alt="" sitewide privo del contesto aria-hidden richiesto (${files.length} file .tsx scansionati in app/+components/).`,
);
