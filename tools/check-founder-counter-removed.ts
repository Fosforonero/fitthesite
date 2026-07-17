/**
 * Guardrail Hotfix P0.6C — il contatore pubblico "posti Founder occupati"
 * non deve mai ricomparire.
 *
 * Rimosso (2026-07-17) perche' il conteggio (fermo a 705) non era
 * riconciliato con i grant realmente assegnati in produzione: vedi
 * `CAPABILITY_STATUS.founderAutoGrant.note` in lib/product-facts.ts. Finche'
 * quello status non passa a `live_verified`, nessuna forma di
 * contatore/badge/banner pubblico che mostri un numero di posti Founder
 * occupati o rimasti va reintrodotta. Questo guardrail fallisce se:
 *
 *  1. `components/FounderCounter.tsx` o `components/FounderBanner.tsx`
 *     esistono di nuovo nel repo;
 *  2. `app/api/v1/beta/spots` esiste di nuovo come route;
 *  3. una qualunque delle frasi bandite (contatore/counter "in tempo
 *     reale"/"real time" per i posti Founder) ricompare in app/components/lib.
 *
 * Non blocca `founderPromo`/`founderCta` (il testo statico "primi 1000
 * account ricevono il Pro a vita", verificato dal guardrail seo:truth-check
 * separato) ne' le sezioni Termini/entitlement/trigger Supabase, fuori scope
 * di questo hotfix.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ── 1 & 2: file/route che non devono esistere ───────────────────────────────
const BANNED_PATHS = [
  "components/FounderCounter.tsx",
  "components/FounderBanner.tsx",
  "app/api/v1/beta/spots",
];

for (const rel of BANNED_PATHS) {
  const full = path.join(repoRoot, rel);
  if (fs.existsSync(full)) {
    errors.push(`Percorso bandito reintrodotto: ${rel}`);
  }
}

// ── 3: frasi bandite nel codice sorgente ────────────────────────────────────
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
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|json)$/.test(entry.name)) {
      out.push(full);
    }
  }
}

const filesToScan: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), filesToScan);

const BANNED_PHRASES: { label: string; re: RegExp }[] = [
  { label: "EN — counter shows remaining seats in real time", re: /counter\s+shows\s+remaining\s+seats\s+in\s+real\s*time/gi },
  { label: "IT — contatore mostra i posti rimasti in tempo reale", re: /contatore\s+mostra\s+i\s+posti\s+rimasti\s+in\s+tempo\s+reale/gi },
  { label: "EN — live remaining-seat count", re: /live\s+remaining-seat\s+count/gi },
  { label: "generic — founder counter/banner live in real time (IT)", re: /(?:contatore|banner)\b[^.!?]{0,40}\bfounder\b[^.!?]{0,40}\b(?:live|in tempo reale)\b/gi },
  { label: "generic — founder counter/banner live in real time (EN)", re: /\bfounder\b[^.!?]{0,40}\b(?:counter|banner)\b[^.!?]{0,40}\b(?:live|real.?time)\b/gi },
];

for (const file of filesToScan) {
  const content = fs.readFileSync(file, "utf8");
  const rel = path.relative(repoRoot, file);

  for (const { label, re } of BANNED_PHRASES) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const context = content.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, " ");
      errors.push(`${rel}: [${label}] "...${context}..."`);
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ Founder counter guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✅ Founder counter guardrail: nessun file bandito reintrodotto, ${filesToScan.length} file scansionati in app/components/lib, zero claim di contatore live.`,
);
