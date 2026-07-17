/**
 * Guardrail Hotfix P0.6C — il contatore pubblico "posti Founder occupati"
 * non deve mai ricomparire, e /api/v1/beta/spots deve restare una
 * tombstone statica (404 deterministico, zero DB, zero conteggio).
 *
 * Storia:
 *  - Rimosso (2026-07-17) perche' il conteggio (fermo a 705) non era
 *    riconciliato con i grant realmente assegnati in produzione: vedi
 *    `CAPABILITY_STATUS.founderAutoGrant.note` in lib/product-facts.ts.
 *  - La rimozione completa della route causava pero' un 500 (non un 404)
 *    nell'ambiente Docker bare, perche' il path scoperto ricadeva sul
 *    catch-all di PayloadCMS (app/(payload)/api/[...slug]/route.ts), che
 *    prova a inizializzare Payload/Postgres per QUALSIASI path non
 *    riconosciuto. La route e' stata reintrodotta come tombstone statica
 *    che intercetta il path prima del catch-all e risponde 404 senza mai
 *    toccare Supabase o Payload.
 *
 * Finche' CAPABILITY_STATUS.founderAutoGrant.status non passa a
 * `live_verified`, questo guardrail fallisce se:
 *
 *  1. `components/FounderCounter.tsx` o `components/FounderBanner.tsx`
 *     esistono di nuovo nel repo;
 *  2. `app/api/v1/beta/spots/route.ts` non esiste (la tombstone e'
 *     obbligatoria, non piu' bandita);
 *  3. quella route importa Supabase o Payload, esegue una query, o
 *     contiene un campo/identificatore di conteggio (taken/total/count/
 *     select/from);
 *  4. quella route non risponde in modo deterministico con status 404;
 *  5. una qualunque delle frasi bandite (contatore/counter "in tempo
 *     reale"/"real time" per i posti Founder) ricompare in app/components/lib.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ── 1: componenti che non devono esistere ───────────────────────────────
const BANNED_PATHS = [
  "components/FounderCounter.tsx",
  "components/FounderBanner.tsx",
];

for (const rel of BANNED_PATHS) {
  const full = path.join(repoRoot, rel);
  if (fs.existsSync(full)) {
    errors.push(`Percorso bandito reintrodotto: ${rel}`);
  }
}

// ── 2, 3, 4: la tombstone /api/v1/beta/spots ────────────────────────────
const TOMBSTONE_REL = "app/api/v1/beta/spots/route.ts";
const tombstoneFull = path.join(repoRoot, TOMBSTONE_REL);

if (!fs.existsSync(tombstoneFull)) {
  errors.push(
    `Tombstone mancante: ${TOMBSTONE_REL} deve esistere (404 statico deterministico, senza DB).`,
  );
} else {
  const content = fs.readFileSync(tombstoneFull, "utf8");
  // I controlli sotto devono colpire solo CODICE reintrodotto, non il
  // commento esplicativo del file (che nomina apposta taken/total/Supabase/
  // Payload per spiegare cosa NON va reintrodotto): togliamo i commenti
  // /* ... */ e // prima di testare i pattern banditi.
  const codeOnly = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  const FORBIDDEN_IMPORTS: { label: string; re: RegExp }[] = [
    { label: "import/accesso Supabase", re: /@supabase|supabase-js|createAdminClient|createClient\s*\(/i },
    { label: "import/accesso Payload", re: /@payloadcms|from ["']payload["']|getPayload/i },
  ];
  for (const { label, re } of FORBIDDEN_IMPORTS) {
    if (re.test(codeOnly)) {
      errors.push(`${TOMBSTONE_REL}: logica di accesso al database reintrodotta (${label}).`);
    }
  }

  const FORBIDDEN_COUNT_PATTERNS: { label: string; re: RegExp }[] = [
    { label: "campo taken", re: /\btaken\b/i },
    { label: "campo total", re: /\btotal\b/i },
    { label: "conteggio SQL/Supabase", re: /\.select\s*\(|\.from\s*\(|count\s*\(|SELECT\s+/i },
  ];
  for (const { label, re } of FORBIDDEN_COUNT_PATTERNS) {
    if (re.test(codeOnly)) {
      errors.push(`${TOMBSTONE_REL}: logica di conteggio reintrodotta (${label}).`);
    }
  }

  if (!/status:\s*404/.test(content)) {
    errors.push(`${TOMBSTONE_REL}: deve rispondere con status 404 in modo deterministico.`);
  }
}

// ── 5: frasi bandite nel codice sorgente ────────────────────────────────────
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
  // Il file tombstone stesso cita legittimamente "500"/"404"/"contatore" nel
  // commento di storia per spiegare perche' esiste: escluderlo dalla scansione
  // delle frasi bandite (le sezioni 2-4 sopra lo verificano già a fondo).
  if (path.resolve(file) === path.resolve(tombstoneFull)) continue;

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
  `✅ Founder counter guardrail: nessun file bandito reintrodotto, tombstone ${TOMBSTONE_REL} pulita e 404-only, ${filesToScan.length} file scansionati in app/components/lib, zero claim di contatore live.`,
);
