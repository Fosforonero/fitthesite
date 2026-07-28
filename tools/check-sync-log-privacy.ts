/**
 * Sprint P0.10B FASE 2 — guardrail "sync:log-privacy-check".
 *
 * POST /api/v1/sync gestisce dati sanitari; i suoi log (best-effort, su
 * fallimento delle RPC Founder/workout) non devono MAI contenere un
 * identificatore che permetta di risalire a un utente o a un device
 * specifico, né un frammento di payload. Verifica STATICA (analisi
 * testuale, non esecuzione): estrae ogni chiamata `console.(log|error|warn|
 * info)(...)` nel file e la confronta con una lista di identificatori
 * vietati. Non un linter generico — mirato a QUESTA route, dove è già
 * successo (Sprint P0.10A) che `deviceId` finisse nei log nonostante il
 * profiler adiacente fosse già PII-free.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const TARGET_FILE = "app/api/v1/sync/route.ts";
const errors: string[] = [];

/**
 * Rimuove commenti a blocco e a riga prima dell'estrazione delle chiamate:
 * senza questo, un commento che SPIEGA perché un campo non va loggato (es.
 * "nessun deviceId qui") farebbe scattare il guardrail sulla propria
 * documentazione invece che sul codice reale.
 */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/**
 * Estrae il testo completo (bilanciato su parentesi/graffe/quadre, a
 * cavallo di stringhe) di ogni chiamata `console.<method>(...)` a partire
 * dall'indice della parentesi aperta subito dopo il nome del metodo.
 */
function extractConsoleCalls(code: string): string[] {
  const calls: string[] = [];
  const callStart = /console\.(log|error|warn|info)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = callStart.exec(code)) !== null) {
    const openParenIndex = m.index + m[0].length - 1;
    let depth = 0;
    let i = openParenIndex;
    let inString: '"' | "'" | "`" | null = null;
    for (; i < code.length; i++) {
      const ch = code[i];
      if (inString) {
        if (ch === "\\") {
          i++; // salta il carattere escaped, non chiude/apre la stringa
        } else if (ch === inString) {
          inString = null;
        }
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        continue;
      }
      if (ch === "(" || ch === "{" || ch === "[") depth++;
      else if (ch === ")" || ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) break;
      }
    }
    calls.push(code.slice(openParenIndex, i + 1));
  }
  return calls;
}

const FORBIDDEN_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "deviceId", re: /\bdeviceId\b/ },
  { label: "userId", re: /\buserId\b/ },
  { label: "fingerprint", re: /\bfingerprint\b/i },
  { label: "email", re: /\bemail\b/i },
  { label: "token", re: /\btoken\b/i },
  { label: "payload/body grezzo", re: /\b(payload|body)\b/i },
  { label: "id del device (device.id / device\\.id)", re: /device\s*\.\s*id\b/ },
];

const fullPath = path.join(repoRoot, TARGET_FILE);
if (!fs.existsSync(fullPath)) {
  errors.push(`File mancante: ${TARGET_FILE}.`);
} else {
  const raw = fs.readFileSync(fullPath, "utf8");
  const codeOnly = stripComments(raw);
  const calls = extractConsoleCalls(codeOnly);

  if (calls.length === 0) {
    errors.push(`${TARGET_FILE}: nessuna chiamata console.* trovata — guardrail non verificabile, controllare che il file non sia stato svuotato per errore.`);
  }

  for (const call of calls) {
    for (const { label, re } of FORBIDDEN_PATTERNS) {
      if (re.test(call)) {
        errors.push(
          `${TARGET_FILE}: una console.* logga "${label}" — trovato in: ${call.replace(/\s+/g, " ").slice(0, 160)}`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("❌ sync:log-privacy-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    "✅ sync:log-privacy-check: nessun log di /api/v1/sync contiene deviceId/userId/fingerprint/email/token/payload/body.",
  );
}
