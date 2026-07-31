/**
 * Sprint P0.10 — guardrail "founder:window-check".
 *
 * Il programma Founder ha UNA sola fonte di verità per il cutoff:
 * FOUNDER_END_AT in lib/founder/program-window.ts. Questo script fallisce
 * se:
 *
 *  1. il modulo non esiste o FOUNDER_END_AT non è esattamente il valore
 *     canonico atteso;
 *  2. quel timestamp (o uno simile ma diverso, sintomo di una scadenza
 *     copiata a mano) compare hardcodato NEL CODICE altrove in
 *     app/components/lib fuori dai file ammessi (i commenti sono esclusi:
 *     citare il cutoff in prosa non crea una seconda fonte di verità);
 *  3. la funzione SQL `private.grant_founder_launch_core` (nell'ultima
 *     migration che la ridefinisce) non contiene lo stesso timestamp —
 *     cioè se TS e SQL divergono;
 *  4. homepage o /beta hanno `force-dynamic` (entrambe devono restare
 *     statiche: nessuna decisione temporale lato server);
 *  5. homepage o /beta importano isFounderProgramOpen direttamente — la
 *     decisione deve restare client-only, dentro FounderClientGate;
 *  6. FounderClientGate.tsx non esiste, non è "use client", o contiene
 *     fetch/Supabase/client Postgres (la decisione non deve mai costare
 *     una richiesta di rete);
 *  7. FounderClientGate.tsx non programma il passaggio automatico allo
 *     stato chiuso (nessun riferimento a un timer schedulato verso
 *     FOUNDER_END_AT_MS) — un tab lasciato aperto a cavallo del cutoff
 *     deve chiudersi da solo, senza reload e senza polling (setInterval è
 *     bandito qui, un singolo setTimeout è l'unico pattern ammesso).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

const CANONICAL_TIMESTAMP = "2026-07-31T22:00:00Z";
const PROGRAM_WINDOW_REL = "lib/founder/program-window.ts";
const CLIENT_GATE_REL = "components/founder/FounderClientGate.tsx";
const HOME_PAGE_REL = "app/(frontend)/[locale]/(marketing)/page.tsx";
const BETA_PAGE_REL = "app/(frontend)/[locale]/(marketing)/beta/page.tsx";
const ALLOWED_TIMESTAMP_FILES = new Set([
  PROGRAM_WINDOW_REL,
  "lib/founder/program-window.test.ts",
]);

function read(rel: string): string | null {
  const full = path.join(repoRoot, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

/**
 * Rimuove commenti a blocco e a riga prima dei controlli su "usa X
 * direttamente"/"contiene il pattern Y": senza questo, un commento che
 * SPIEGA perché il codice NON fa una cosa (es. "nessuna query Supabase")
 * farebbe scattare il guardrail sulla propria stessa documentazione.
 */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

// ── 1: modulo canonico esiste e ha il valore giusto ─────────────────────
const programWindowContent = read(PROGRAM_WINDOW_REL);
if (programWindowContent === null) {
  errors.push(`Modulo mancante: ${PROGRAM_WINDOW_REL} deve esistere.`);
} else {
  const m = programWindowContent.match(/FOUNDER_END_AT\s*=\s*"([^"]+)"/);
  if (!m) {
    errors.push(`${PROGRAM_WINDOW_REL}: non trovo \`FOUNDER_END_AT = "..."\`.`);
  } else if (m[1] !== CANONICAL_TIMESTAMP) {
    errors.push(
      `${PROGRAM_WINDOW_REL}: FOUNDER_END_AT è "${m[1]}", atteso "${CANONICAL_TIMESTAMP}". Se il cambio è intenzionale, aggiorna anche CANONICAL_TIMESTAMP in questo guardrail.`,
    );
  }
}

// ── 2: nessun timestamp Founder hardcodato divergente altrove ──────────
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
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
}

const filesToScan: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), filesToScan);

const NEARBY_TIMESTAMP_RE = /202[68]-(?:07-3\d|08-0\d)T\d{2}:\d{2}:\d{2}Z/g;

for (const file of filesToScan) {
  const rel = path.relative(repoRoot, file);
  if (ALLOWED_TIMESTAMP_FILES.has(rel)) continue;

  // stripComments() come nei check 4-7: quello che questo check vieta e' un
  // timestamp DUPLICATO NEL CODICE (che diverge in silenzio se
  // program-window.ts cambia). Un commento che cita il cutoff per spiegare
  // perche' il file NON lo ricopia — vedi l'header di beta/page.tsx, che
  // dice testualmente "unica fonte di verita' in program-window.ts, il
  // valore NON va ricopiato qui" — e' documentazione corretta, non una
  // seconda fonte di verita': non compila, non renderizza, non puo'
  // divergere. Senza lo strip il guardrail sparava sulla propria
  // documentazione.
  const content = stripComments(fs.readFileSync(file, "utf8"));
  let m: RegExpExecArray | null;
  NEARBY_TIMESTAMP_RE.lastIndex = 0;
  while ((m = NEARBY_TIMESTAMP_RE.exec(content)) !== null) {
    const context = content.slice(Math.max(0, m.index - 60), m.index + m[0].length + 20).toLowerCase();
    if (!context.includes("founder")) continue;
    if (m[0] === CANONICAL_TIMESTAMP) {
      errors.push(
        `${rel}: timestamp Founder "${CANONICAL_TIMESTAMP}" duplicato qui invece di importare FOUNDER_END_AT da ${PROGRAM_WINDOW_REL} — se ${PROGRAM_WINDOW_REL} cambia, questo file diverge silenziosamente.`,
      );
    } else {
      errors.push(
        `${rel}: timestamp Founder "${m[0]}" DIVERGE dal canonico "${CANONICAL_TIMESTAMP}" in ${PROGRAM_WINDOW_REL}.`,
      );
    }
  }
}

// ── 3: il timestamp SQL (private.grant_founder_launch_core) combacia ───
const migrationsDir = path.join(repoRoot, "supabase/migrations");
let migrationFiles: string[] = [];
try {
  migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
} catch {
  errors.push(`Cartella mancante: supabase/migrations non trovata.`);
}

const grantFnMigrations = migrationFiles.filter((f) => {
  const content = fs.readFileSync(path.join(migrationsDir, f), "utf8");
  return /create\s+or\s+replace\s+function\s+private\.grant_founder_launch_core/i.test(content);
});

if (grantFnMigrations.length === 0) {
  errors.push(
    `Nessuna migration ridefinisce private.grant_founder_launch_core con un controllo di cutoff — il backend non è ancora agganciato a FOUNDER_END_AT.`,
  );
} else {
  const latest = grantFnMigrations[grantFnMigrations.length - 1];
  const content = fs.readFileSync(path.join(migrationsDir, latest), "utf8");
  // Cerchiamo il timestamp ISO canonico (o un timestamptz vicino) nella
  // DEFINIZIONE della funzione, per assicurarci che il cutoff SQL non sia
  // silenziosamente diverso da quello TypeScript.
  const sqlTimestampRe = /'(202[68]-(?:07-3\d|08-0\d)[T ]\d{2}:\d{2}:\d{2})(Z|\+00)?'(?:::timestamptz)?/g;
  const found: string[] = [];
  let sm: RegExpExecArray | null;
  while ((sm = sqlTimestampRe.exec(content)) !== null) found.push(sm[1].replace(" ", "T") + "Z");

  const matchesCanonical = found.some((f) => f === CANONICAL_TIMESTAMP);

  if (found.length === 0) {
    errors.push(
      `${latest}: private.grant_founder_launch_core non contiene alcun controllo di cutoff timestamptz — il backend accetterebbe Founder anche dopo il ${CANONICAL_TIMESTAMP}.`,
    );
  } else if (!matchesCanonical) {
    errors.push(
      `${latest}: il cutoff SQL trovato (${found.join(", ")}) NON combacia con FOUNDER_END_AT TypeScript ("${CANONICAL_TIMESTAMP}") — SQL e TS sono divergenti.`,
    );
  }
}

// ── 4 & 5: homepage e /beta restano statiche, decisione solo client-side ─
for (const rel of [HOME_PAGE_REL, BETA_PAGE_REL]) {
  const content = read(rel);
  if (content === null) {
    errors.push(`Pagina mancante: ${rel}`);
    continue;
  }
  const codeOnly = stripComments(content);
  if (/export const dynamic\s*=\s*["']force-dynamic["']/.test(codeOnly)) {
    errors.push(
      `${rel}: ha \`export const dynamic = "force-dynamic"\` — P0.10 richiede homepage E /beta completamente statiche, nessuna decisione temporale lato server (regressione Fluid CPU).`,
    );
  }
  if (/isFounderProgramOpen/.test(codeOnly)) {
    errors.push(
      `${rel}: importa/usa isFounderProgramOpen direttamente — la decisione deve restare client-only dentro ${CLIENT_GATE_REL}, mai lato server.`,
    );
  }
}

// ── 6 & 7: FounderClientGate è client-only, senza rete, con auto-transizione
const gateContentRaw = read(CLIENT_GATE_REL);
if (gateContentRaw === null) {
  errors.push(`Componente mancante: ${CLIENT_GATE_REL}`);
} else {
  const gateContent = stripComments(gateContentRaw);
  if (!/^["']use client["'];?/m.test(gateContentRaw)) {
    errors.push(`${CLIENT_GATE_REL}: manca la direttiva "use client" — deve essere un Client Component.`);
  }
  if (/\bfetch\s*\(|supabase|createClient|pg\.|Pool\(/i.test(gateContent)) {
    errors.push(
      `${CLIENT_GATE_REL}: contiene un pattern di rete/DB (fetch/Supabase/Postgres) — la decisione deve leggere solo l'orologio del browser, zero richieste.`,
    );
  }
  if (/setInterval\s*\(/.test(gateContent)) {
    errors.push(
      `${CLIENT_GATE_REL}: usa setInterval — bandito (polling). Usa un singolo setTimeout schedulato verso FOUNDER_END_AT_MS.`,
    );
  }
  if (!/setTimeout\s*\(/.test(gateContent) || !/FOUNDER_END_AT_MS/.test(gateContent)) {
    errors.push(
      `${CLIENT_GATE_REL}: non programma la transizione automatica allo stato chiuso (atteso un setTimeout schedulato su FOUNDER_END_AT_MS) — una tab lasciata aperta a cavallo del cutoff non passerebbe a evergreen da sola.`,
    );
  }
}

// ── esito ────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error("❌ founder:window-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    "✅ founder:window-check: FOUNDER_END_AT unico e coerente TS/SQL, homepage e /beta statiche, FounderClientGate client-only con auto-transizione, nessun timestamp divergente.",
  );
}
