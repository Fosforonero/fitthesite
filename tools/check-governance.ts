/**
 * governance:check - il cancello di Governance lato consumer.
 *
 * Fa tre cose, e nessuna di queste richiede rete:
 *
 *  1. Verifica che lo snapshot in `.fitmesh/governance/` sia esattamente quello
 *     pubblicato: ogni file confrontato con il suo SHA-256 nel manifest, piu' la
 *     versione e l'addendum giusto per questo consumer.
 *  2. Verifica che i quattro adattatori esistano, che il blocco gestito non sia
 *     divergente e che le tre regole inline ci siano ancora, testualmente.
 *  3. Cerca em dash NUOVI nel copy user-facing configurato.
 *
 * Sul punto 3, la parte che conta e' cosa NON fa. Non fa un grep globale del
 * repository: il 16/09/2026 il repository conteneva 5597 em dash in 629 file, e
 * un grep globale avrebbe preteso una riscrittura di massa che non e' lo scopo
 * di questo sprint. Guarda solo i file dichiarati in
 * `tools/governance-copy-scope.json`, salta i commenti, legge i VALORI dei JSON
 * e non le chiavi, e confronta con una baseline delle occorrenze preesistenti.
 * Passa il verde a cio' che c'era gia'. Blocca cio' che si aggiunge oggi.
 *
 * Uso:
 *   npx tsx tools/check-governance.ts
 *   npx tsx tools/check-governance.ts --update-baseline   (dopo una bonifica)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/** Normalmente la radice del repository. `GOVERNANCE_ROOT` la sposta, e serve a
 *  una cosa sola: permettere a `tools/governance-selftest.sh` di rompere di
 *  proposito una copia in $TMPDIR invece dell'albero di lavoro. Un guardrail
 *  che per provarsi deve mutare il checkout, prima o poi lo lascia mutato. */
const repoRoot = process.env.GOVERNANCE_ROOT
  ? path.resolve(process.env.GOVERNANCE_ROOT)
  : path.resolve(__dirname, "..");
const SNAPSHOT = ".fitmesh/governance";
const BLOCK_START = "<!-- FITMESH-GOVERNANCE:START -->";
const BLOCK_END = "<!-- FITMESH-GOVERNANCE:END -->";
const EM_DASH = "—";

const SCOPE_FILE = "tools/governance-copy-scope.json";
const BASELINE_FILE = "tools/governance-emdash-baseline.json";

const updateBaseline = process.argv.includes("--update-baseline");

const errors: string[] = [];
const notes: string[] = [];
const fail = (m: string) => errors.push(m);

const sha256 = (buf: Buffer | string) =>
  crypto.createHash("sha256").update(buf).digest("hex");

const readIfExists = (rel: string) => {
  const full = path.join(repoRoot, rel);
  return fs.existsSync(full) ? fs.readFileSync(full) : null;
};

// ---------------------------------------------------------------------------
// 1. Lo snapshot e' quello pubblicato
// ---------------------------------------------------------------------------
type Manifest = {
  manifestVersion: number;
  governanceVersion: string;
  sourceRepository: string;
  sourceCommit: string;
  exportedAt: string;
  consumer: "app" | "site";
  files: { path: string; sha256: string; bytes: number }[];
  adapters: { runtime: string; path: string; template: string; blockSha256: string }[];
  inlineRules: string[];
};

let manifest: Manifest | null = null;

const manifestRaw = readIfExists(`${SNAPSHOT}/manifest.json`);
if (!manifestRaw) {
  fail(
    `[snapshot] manca ${SNAPSHOT}/manifest.json. Lo snapshot di Governance non c'e' o e' incompleto: ` +
      `rilancia export-governance.sh dal repository fitmesh-governance.`,
  );
} else {
  try {
    manifest = JSON.parse(manifestRaw.toString("utf8")) as Manifest;
  } catch (e) {
    fail(`[snapshot] manifest.json non e' JSON valido: ${(e as Error).message}`);
  }
}

if (manifest) {
  if (manifest.consumer !== "site") {
    fail(
      `[snapshot] questo repository e' il consumer "site" ma il manifest dichiara "${manifest.consumer}". ` +
        `E' stato esportato lo snapshot sbagliato.`,
    );
  }

  const versionRaw = readIfExists(`${SNAPSHOT}/VERSION`);
  if (!versionRaw) {
    fail(`[snapshot] manca ${SNAPSHOT}/VERSION.`);
  } else {
    const onDisk = versionRaw.toString("utf8").trim();
    if (onDisk !== manifest.governanceVersion) {
      fail(
        `[snapshot] VERSION dice "${onDisk}" ma il manifest dice "${manifest.governanceVersion}": ` +
          `lo snapshot e' incoerente con se stesso.`,
      );
    }
  }

  if (!/^[0-9a-f]{40}$/.test(manifest.sourceCommit)) {
    fail(`[snapshot] sourceCommit non e' uno sha completo: "${manifest.sourceCommit}".`);
  }

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    fail(`[snapshot] il manifest non elenca nessun file.`);
  }

  for (const entry of manifest.files ?? []) {
    const buf = readIfExists(`${SNAPSHOT}/${entry.path}`);
    if (!buf) {
      fail(`[snapshot] ${SNAPSHOT}/${entry.path} e' nel manifest ma non esiste su disco.`);
      continue;
    }
    const got = sha256(buf);
    if (got !== entry.sha256) {
      fail(
        `[snapshot] ${SNAPSHOT}/${entry.path} e' stato modificato a mano dopo l'esportazione.\n` +
          `           atteso  ${entry.sha256}\n` +
          `           trovato ${got} (${buf.length} byte, il manifest diceva ${entry.bytes})\n` +
          `           I file distribuiti non si modificano qui: si cambia la regola nel repository ` +
          `Governance, si alza VERSION e si riesporta.`,
      );
    }
  }

  // L'addendum giusto, e solo quello.
  const hasSite = fs.existsSync(path.join(repoRoot, SNAPSHOT, "standards/SITE-WRITING.md"));
  const hasApp = fs.existsSync(path.join(repoRoot, SNAPSHOT, "standards/APP-WRITING.md"));
  if (!hasSite) fail(`[snapshot] manca standards/SITE-WRITING.md, che e' l'addendum di questo consumer.`);
  if (hasApp) fail(`[snapshot] presente standards/APP-WRITING.md: e' l'addendum dell'app, non va distribuito qui.`);

  // ------------------------------------------------------------------------
  // 2. I quattro adattatori
  // ------------------------------------------------------------------------
  if (!Array.isArray(manifest.adapters) || manifest.adapters.length !== 4) {
    fail(
      `[adattatori] il manifest ne descrive ${manifest.adapters?.length ?? 0}: devono essere quattro, ` +
        `uno per runtime (Codex, Claude Code, Gemini CLI, Gemini Antigravity).`,
    );
  }

  for (const ad of manifest.adapters ?? []) {
    const buf = readIfExists(ad.path);
    if (!buf) {
      fail(`[adattatori] manca l'adattatore per ${ad.runtime}: ${ad.path}`);
      continue;
    }
    const lines = buf.toString("utf8").split("\n");
    const s = lines.findIndex((l) => l === BLOCK_START);
    const e = lines.findIndex((l) => l === BLOCK_END);
    if (s === -1 || e === -1 || e <= s) {
      fail(`[adattatori] ${ad.path} non contiene un blocco gestito FITMESH-GOVERNANCE ben formato.`);
      continue;
    }
    const body = lines.slice(s + 1, e).join("\n") + "\n";
    const got = sha256(body);

    for (const rule of manifest.inlineRules ?? []) {
      if (!body.includes(rule)) {
        fail(`[adattatori] ${ad.path}: manca la regola inline "${rule}"`);
      }
    }
    if (!body.includes(`${SNAPSHOT}/standards/`)) {
      fail(
        `[adattatori] ${ad.path}: il blocco non ordina piu' di leggere gli standard prima di scrivere copy.`,
      );
    }
    if (got !== ad.blockSha256) {
      fail(
        `[adattatori] ${ad.path}: il blocco gestito e' divergente.\n` +
          `           atteso  ${ad.blockSha256}\n` +
          `           trovato ${got}\n` +
          `           Il blocco si cambia nel repository Governance e si riesporta. ` +
          `Tutto cio' che sta FUORI dai marcatori e' tuo e non viene toccato.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Em dash nuovi nel copy user-facing
// ---------------------------------------------------------------------------
type Scope = {
  include: { dir: string; extensions: string[] }[];
  excludeDirs: string[];
  excludeFileSuffixes: string[];
  excludePathContains: string[];
  allowMarker: string;
};

type Finding = { file: string; where: string; text: string; hash: string };

const scopeRaw = readIfExists(SCOPE_FILE);
let scope: Scope | null = null;
if (!scopeRaw) {
  fail(`[em-dash] manca ${SCOPE_FILE}: senza un perimetro dichiarato questo controllo non sa cosa guardare.`);
} else {
  scope = JSON.parse(scopeRaw.toString("utf8")) as Scope;
}

/** Un em dash isolato e' il segnaposto "dato non disponibile" delle tabelle: e'
 *  l'eccezione gia' in vigore nel codice, e resta lecita. */
const stripAllowed = (s: string) =>
  s
    .replace(/(["'`])—\1/g, "$1$1")
    .replace(/>\s*—\s*</g, "><");

const isCommentLine = (line: string) => {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("<!--");
};

const walk = (dir: string, extensions: string[], out: string[], scope: Scope) => {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(repoRoot, full);
    if (entry.isDirectory()) {
      if (scope.excludeDirs.includes(entry.name)) continue;
      walk(full, extensions, out, scope);
      continue;
    }
    if (!extensions.some((ext) => entry.name.endsWith(ext))) continue;
    if (scope.excludeFileSuffixes.some((sfx) => entry.name.endsWith(sfx))) continue;
    if (scope.excludePathContains.some((frag) => rel.includes(frag))) continue;
    out.push(rel);
  }
};

/** Per i JSON guarda i VALORI stringa, mai le chiavi, e salta i metadata ARB
 *  (`@chiave`), che descrivono i placeholder e non sono testo mostrato. */
const jsonStringValues = (node: unknown, trail: string, out: { where: string; text: string }[]) => {
  if (typeof node === "string") {
    out.push({ where: trail || "(radice)", text: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => jsonStringValues(v, `${trail}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k.startsWith("@")) continue;
      jsonStringValues(v, trail ? `${trail}.${k}` : k, out);
    }
  }
};

const findings: Finding[] = [];
let scannedFiles = 0;

if (scope) {
  const files: string[] = [];
  for (const inc of scope.include) {
    walk(path.join(repoRoot, inc.dir), inc.extensions, files, scope);
  }
  files.sort();

  for (const rel of files) {
    scannedFiles++;
    const raw = fs.readFileSync(path.join(repoRoot, rel), "utf8");

    if (rel.endsWith(".json")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue; // un JSON rotto e' un problema di qualcun altro
      }
      const values: { where: string; text: string }[] = [];
      jsonStringValues(parsed, "", values);
      for (const v of values) {
        if (!stripAllowed(v.text).includes(EM_DASH)) continue;
        findings.push({
          file: rel,
          where: v.where,
          text: v.text.slice(0, 160),
          hash: sha256(`${v.where} ${v.text}`),
        });
      }
      continue;
    }

    const lines = raw.split("\n");
    lines.forEach((line, i) => {
      if (isCommentLine(line)) return;
      if (scope!.allowMarker && line.includes(scope!.allowMarker)) return;
      if (i > 0 && scope!.allowMarker && lines[i - 1].includes(scope!.allowMarker)) return;
      if (!stripAllowed(line).includes(EM_DASH)) return;
      const norm = line.trim();
      findings.push({ file: rel, where: `riga ${i + 1}`, text: norm.slice(0, 160), hash: sha256(norm) });
    });
  }
}

// --- baseline --------------------------------------------------------------
type Baseline = { note: string; generatedForVersion: string; files: Record<string, Record<string, number>> };

const currentCounts: Record<string, Record<string, number>> = {};
for (const f of findings) {
  currentCounts[f.file] ??= {};
  currentCounts[f.file][f.hash] = (currentCounts[f.file][f.hash] ?? 0) + 1;
}

if (updateBaseline) {
  const out: Baseline = {
    note:
      "Occorrenze di em dash preesistenti nel copy user-facing, congelate. Non e' un permesso: " +
      "e' la fotografia di cio' che c'era prima del cancello. Ogni occorrenza NUOVA fa rosso. " +
      "Rigenerare solo dopo una bonifica vera, mai per far passare una violazione.",
    generatedForVersion: manifest?.governanceVersion ?? "sconosciuta",
    files: currentCounts,
  };
  fs.writeFileSync(path.join(repoRoot, BASELINE_FILE), JSON.stringify(out, null, 2) + "\n", "utf8");
  const total = findings.length;
  console.log(
    `✅ baseline rigenerata: ${total} occorrenza/e preesistenti in ${Object.keys(currentCounts).length} file ` +
      `(${scannedFiles} file nel perimetro).`,
  );
  process.exit(0);
}

const baselineRaw = readIfExists(BASELINE_FILE);
let baseline: Baseline["files"] = {};
if (!baselineRaw) {
  fail(
    `[em-dash] manca ${BASELINE_FILE}. Generala una volta con ` +
      `\`npx tsx tools/check-governance.ts --update-baseline\` e committala.`,
  );
} else {
  baseline = (JSON.parse(baselineRaw.toString("utf8")) as Baseline).files ?? {};
}

let newViolations = 0;
if (baselineRaw) {
  for (const [file, hashes] of Object.entries(currentCounts)) {
    for (const [hash, count] of Object.entries(hashes)) {
      const allowed = baseline[file]?.[hash] ?? 0;
      if (count > allowed) {
        const extra = count - allowed;
        const sample = findings.find((f) => f.file === file && f.hash === hash)!;
        newViolations += extra;
        fail(
          `[em-dash] ${file} (${sample.where}): ${extra} em dash nuovo/i nel copy user-facing.\n` +
            `           "${sample.text}"\n` +
            `           Usa punto, virgola, due punti o parentesi. Se e' una citazione testuale, ` +
            `un titolo ufficiale o materiale di terzi, marcalo con \`${scope?.allowMarker}\`.`,
        );
      }
    }
  }

  const stalePreexisting = Object.entries(baseline).reduce(
    (n, [file, hashes]) =>
      n + Object.values(hashes).reduce((m, c) => m + c, 0) - Object.values(currentCounts[file] ?? {}).reduce((m, c) => m + c, 0),
    0,
  );
  if (stalePreexisting > 0) {
    notes.push(
      `${stalePreexisting} occorrenza/e in baseline non esistono piu': bonifica avvenuta. ` +
        `Puoi restringere la baseline con --update-baseline.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Referto
// ---------------------------------------------------------------------------
const preexisting = Object.values(baseline).reduce(
  (n, hashes) => n + Object.values(hashes).reduce((m, c) => m + c, 0),
  0,
);

if (errors.length > 0) {
  console.error(`\n❌ governance:check: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error(
    `\n  Perimetro em dash: ${scannedFiles} file, ${preexisting} occorrenza/e preesistenti tollerate, ` +
      `${newViolations} nuova/e rifiutata/e.`,
  );
  process.exit(1);
}

console.log(
  `✅ governance:check OK.\n` +
    `   Snapshot: versione ${manifest?.governanceVersion} da ${manifest?.sourceCommit.slice(0, 12)}, ` +
    `${manifest?.files.length} file verificati per SHA-256.\n` +
    `   Adattatori: 4/4 presenti, blocco gestito integro, 3 regole inline presenti in ciascuno.\n` +
    `   Em dash: ${scannedFiles} file nel perimetro, ${preexisting} occorrenza/e preesistenti in baseline, ` +
    `zero nuove.`,
);
for (const n of notes) console.log(`   nota: ${n}`);
