/**
 * Guardrail Sprint P1.0 — FitMesh Labs non deve mai dichiarare diagnosi,
 * valori normativi universali o upload inesistenti.
 *
 * Scope DELIBERATAMENTE ristretto a `lib/labs/` e alle route
 * `app/(frontend)/[locale]/(marketing)/labs/`: questo guardrail non tocca
 * contenuto preesistente altrove sul sito (es. l'articolo blog
 * hrv-cose-significato-valori.ts contiene un range HRV per fascia d'età,
 * scritto in uno sprint precedente con un proprio disclaimer — fuori scope
 * qui, segnalato separatamente nella consegna di questo sprint come
 * decisione rimandata, non silenziosamente ignorato né corretto d'ufficio).
 *
 * Tre categorie di ban, ciascuna con verifica di negazione dove serve
 * (una frase che NEGA esplicitamente il pattern — es. "mai inviato al
 * server" — non deve essere segnalata):
 *
 *  1. Diagnosi/classificazione di un risultato calcolato ("buono/cattivo",
 *     "significa che...", "indica un problema", "sei a rischio").
 *  2. Valori normativi universali (tabelle/range per età o sesso).
 *  3. Claim di upload/invio/salvataggio remoto dei dati inseriti — Labs
 *     calcola SOLO nel browser, per principio non negoziabile dello sprint.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

const SCAN_ROOTS = [
  path.join(repoRoot, "lib", "labs"),
  path.join(repoRoot, "app", "(frontend)", "[locale]", "(marketing)", "labs"),
];
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
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
}

const filesToScan: string[] = [];
for (const root of SCAN_ROOTS) walk(root, filesToScan);

const NEGATION_WINDOW = 40;

/** True se una parola di negazione (IT/EN) precede il match entro `window` caratteri. */
function isNegated(content: string, matchIndex: number): boolean {
  const before = content.slice(Math.max(0, matchIndex - NEGATION_WINDOW), matchIndex);
  return /\b(mai|non|nessun[oa]?|senza|never|no|not|nothing|none)\b/i.test(before);
}

/**
 * True se il match è dentro una FRASE INTERROGATIVA (es. una domanda FAQ
 * come "Questo strumento mi dice se la mia HRV è buona o cattiva?"): la
 * domanda pone il claim vietato solo per negarlo nella risposta, che vive in
 * un campo/stringa separato (`a:` vs `q:`) — la finestra di negazione sopra
 * non lo vede. Un "?" prima del prossimo terminatore di frase (. ! " o fine
 * riga) indica una domanda, non un'asserzione.
 */
function isQuestion(content: string, matchEnd: number): boolean {
  const after = content.slice(matchEnd, matchEnd + 60);
  const terminatorIdx = after.search(/[.!\n]/);
  const questionIdx = after.indexOf("?");
  if (questionIdx === -1) return false;
  return terminatorIdx === -1 || questionIdx < terminatorIdx;
}

// ── 1. Diagnosi/classificazione ─────────────────────────────────────────
const DIAGNOSIS_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "IT — diagnosi/diagnostico", re: /\bdiagnos[ei]|diagnostic[oa]\b/gi },
  { label: "EN — diagnosis/diagnostic", re: /\bdiagnos(?:is|e|tic)\b/gi },
  {
    label: "IT — classificazione buono/cattivo del risultato",
    re: /\b(?:HRV|RMSSD|risultato|valore)\b[^.!?]{0,60}\b(buon[oa]|cattiv[oa]|ottim[oa]|scars[oa]|eccellente)\b/gi,
  },
  {
    label: "EN — good/bad/poor/excellent classification of result",
    re: /\b(?:HRV|RMSSD|result|value)\b[^.!?]{0,60}\b(good|bad|poor|excellent)\b/gi,
  },
  { label: "IT — interpretazione di stato di salute/rischio", re: /\b(?:indica|significa che sei|sei a rischio|stato di salute)\b[^.!?]{0,60}\b(problema|rischio|malatt|patologi)/gi },
  { label: "EN — health-status/risk interpretation", re: /\b(?:indicates|means you are|you are at risk|health status)\b[^.!?]{0,60}\b(problem|risk|disease|condition)/gi },
];

// ── 2. Valori normativi universali (età/sesso) ──────────────────────────
const UNIVERSAL_NORM_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "IT — range età con unità ms/anni", re: /\b\d{1,3}\s?[-–]\s?\d{1,3}\s?anni\b[^.!?]{0,40}\bms\b/gi },
  { label: "EN — age range with ms unit", re: /\b\d{1,3}\s?[-–]\s?\d{1,3}\s?years?\b[^.!?]{0,40}\bms\b/gi },
  { label: "IT — HRV normale per età/sesso", re: /\bHRV\s+normale\s+per\s+(?:la\s+tua\s+età|sesso|uomini|donne)/gi },
  { label: "EN — normal HRV for age/sex", re: /\bnormal\s+HRV\s+for\s+(?:your\s+age|sex|men|women)/gi },
];

// ── 3. Upload/invio/salvataggio remoto inesistente ──────────────────────
const FAKE_UPLOAD_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "IT — inviato/caricato al server", re: /\b(?:invi(?:a|ato|amo)|caric(?:a|ato|hiamo))\b[^.!?]{0,30}\b(?:al |sul )?server\b/gi },
  { label: "EN — sent/uploaded to server", re: /\b(?:sen[dt]|upload(?:ed|s)?)\b[^.!?]{0,30}\b(?:to (?:the |our )?)?server\b/gi },
  { label: "IT — salvato/memorizzato sul cloud", re: /\b(?:salvat[oi]|memorizzat[oi])\b[^.!?]{0,30}\bcloud\b/gi },
  { label: "EN — saved/stored to the cloud", re: /\b(?:saved|stored)\b[^.!?]{0,30}\bcloud\b/gi },
];

const ALL_CATEGORIES: { name: string; patterns: { label: string; re: RegExp }[] }[] = [
  { name: "diagnosi/classificazione", patterns: DIAGNOSIS_PATTERNS },
  { name: "valori normativi universali", patterns: UNIVERSAL_NORM_PATTERNS },
  { name: "upload/invio remoto inesistente", patterns: FAKE_UPLOAD_PATTERNS },
];

for (const file of filesToScan) {
  const content = fs.readFileSync(file, "utf8");
  const rel = path.relative(repoRoot, file);

  for (const category of ALL_CATEGORIES) {
    for (const { label, re } of category.patterns) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) {
        if (!isNegated(content, m.index) && !isQuestion(content, m.index + m[0].length)) {
          const context = content.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, " ");
          errors.push(
            `${rel}: [${category.name}] ${label} — "...${context}..."`,
          );
        }
      }
    }
  }

  // ── 4. Em dash vietato (Sprint P1.0A, Fase 8) ───────────────────────────
  // Il simbolo matematico meno (U+2212, "−") resta consentito ovunque
  // (formule RMSSD/SDNN): questo controllo cerca solo l'em dash (U+2014,
  // "—"), incondizionato, senza guard di negazione/domanda perché la sua
  // sola presenza e' la violazione, indipendentemente dal contesto.
  const EM_DASH_RE = /—/g;
  let dashMatch: RegExpExecArray | null;
  while ((dashMatch = EM_DASH_RE.exec(content)) !== null) {
    const context = content
      .slice(Math.max(0, dashMatch.index - 30), dashMatch.index + 30)
      .replace(/\s+/g, " ");
    errors.push(`${rel}: [formattazione] em dash vietato in questo scope — "...${context}..."`);
  }
}

if (errors.length > 0) {
  console.error(`❌ Labs truth guardrail: ${errors.length} problema/i in ${filesToScan.length} file scansionati\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✅ Labs truth guardrail: ${filesToScan.length} file scansionati in lib/labs e app/.../labs, zero diagnosi/classificazioni, zero valori normativi universali, zero claim di upload/invio remoto inesistente.`,
);
