/**
 * Guardrail corruzione traduzioni — impedisce il ripetersi del bug sistemico
 * della pipeline (loctron, waterfall DeepL + fallback Ollama) che il 04/07 ha
 * leakato testo cinese/cirillico e token di template rotti ("__RODO__",
 * "[[KVKK]]", "<<FM_HTML_0>>") in decine di stringhe PL/TR/IT su 10 post del
 * blog e lib/landing/data.ts (fix in d6097d4, vedi anche tools/loctron).
 *
 * Scansiona (regex riga per riga, niente AST — non serve per questo controllo):
 *   - lib/blog/posts/
 *   - lib/landing/data.ts
 *   - lib/content/
 *   - app/(frontend)/[locale]/(marketing)/
 *
 * Per ogni file cerca letterali stringa assegnati a una chiave di locale nota
 * (it,en,es,de,pt,fr,pl,tr,nl,ja,ko,sv,da,no,fi), sia in forma scalare
 * (`xx: "..."` / `xx: '...'` / `` xx: `...` ``) sia in array (`xx: ["...", ...]`,
 * anche multi-riga — è così che comparivano le LocalizedList in lib/blog/types.ts),
 * e segnala:
 *
 *  1. [cjk-leak]       ideogrammi CJK (U+4E00-U+9FFF) in una chiave che non è
 *     ja/ko (l'unico locale japanese/koreano legittimi per quei caratteri).
 *  2. [cyrillic-leak]  caratteri cirillici (U+0400-U+04FF) in QUALSIASI chiave:
 *     il russo non è nemmeno un locale supportato qui, quindi il cirillico non
 *     deve comparire mai, in nessuna lingua.
 *  3. [template-leak]  segnaposto di template rimasti non sostituiti nel testo
 *     visibile: "__XXX__", "[[XXX]]", "<<XXX>>".
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx -y tsx tools/check-translation-corruption.ts
 *
 * Da eseguire prima di ogni deploy che tocca traduzioni generate/rigenerate
 * dalla pipeline. Nessuna dipendenza dal progetto (solo fs/path Node): scansiona
 * il testo sorgente dei file, non serve compilare né importare @/lib.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const LOCALES = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"] as const;
const CJK_OK_LOCALES = new Set<string>(["ja", "ko"]);

const CJK_RE = /[\u4E00-\u9FFF]/;
const CYRILLIC_RE = /[\u0400-\u04FF]/;
const LEAK_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "template-leak:underscore", re: /__[A-Z]+__/ },
  { label: "template-leak:bracket", re: /\[\[[A-Z]+\]\]/ },
  { label: "template-leak:angle", re: /<<[A-Z_0-9]+>>/ },
];

const TARGETS = [
  "lib/blog/posts",
  "lib/landing/data.ts",
  "lib/content",
  "app/(frontend)/[locale]/(marketing)",
];

type Hit = { locale: string; value: string; line: number };
type Problem = { line: number; label: string; locale: string; snippet: string };

function collectFiles(target: string): string[] {
  const abs = join(ROOT, target);
  let st;
  try {
    st = statSync(abs);
  } catch {
    return [];
  }
  if (st.isFile()) return [abs];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        out.push(p);
      }
    }
  };
  walk(abs);
  return out;
}

/**
 * Legge un letterale stringa a partire da line[start] (che DEVE essere una
 * quote), gestendo l'escape "\". In questo codebase i valori di locale non
 * usano mai un newline letterale dentro una stringa (le andate a capo sono
 * sempre "\n" dentro una riga fisica sola), quindi una stringa che non si
 * chiude sulla riga è trattata come non parsabile (ritorna null) invece di
 * inseguirla su più righe — evita falsi positivi più che falsi negativi.
 */
function readStringLiteral(line: string, start: number): { value: string; next: number } | null {
  const quote = line[start];
  let i = start + 1;
  let value = "";
  while (i < line.length) {
    const ch = line[i];
    if (ch === "\\") {
      value += ch + (line[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (ch === quote) return { value, next: i + 1 };
    value += ch;
    i++;
  }
  return null;
}

/** Consuma letterali stringa da line[start...] finché non trova un "]" fuori da una stringa (chiusura array) o la fine riga. */
function scanArrayBody(line: string, start: number, locale: string, hits: Hit[], lineNo: number): { closed: boolean; next: number } {
  let i = start;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const lit = readStringLiteral(line, i);
      if (!lit) return { closed: false, next: line.length };
      hits.push({ locale, value: lit.value, line: lineNo });
      i = lit.next;
    } else if (ch === "]") {
      return { closed: true, next: i + 1 };
    } else {
      i++;
    }
  }
  return { closed: false, next: i };
}

const LOCALE_KEY_RE = new RegExp(`\\b(${LOCALES.join("|")}):\\s*(["'\`]|\\[)`, "g");

function extractHits(content: string): Hit[] {
  const lines = content.split("\n");
  const hits: Hit[] = [];
  let arrayLocale: string | null = null; // locale il cui array è aperto e continua su righe successive

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNo = idx + 1;

    if (arrayLocale) {
      const { closed } = scanArrayBody(line, 0, arrayLocale, hits, lineNo);
      if (closed) arrayLocale = null;
      continue;
    }

    LOCALE_KEY_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LOCALE_KEY_RE.exec(line))) {
      const locale = m[1];
      const marker = m[2];
      const markerIdx = m.index + m[0].length - 1;

      if (marker === "[") {
        const { closed, next } = scanArrayBody(line, markerIdx + 1, locale, hits, lineNo);
        if (!closed) {
          arrayLocale = locale; // continua sulle righe successive
          break;
        }
        LOCALE_KEY_RE.lastIndex = next;
      } else {
        const lit = readStringLiteral(line, markerIdx);
        if (lit) {
          hits.push({ locale, value: lit.value, line: lineNo });
          LOCALE_KEY_RE.lastIndex = lit.next;
        }
      }
    }
  }

  return hits;
}

function snippetAround(value: string, re: RegExp, radius = 40): string {
  const m = re.exec(value);
  if (!m) {
    return value.length > 80 ? `${value.slice(0, 80)}…` : value;
  }
  const start = Math.max(0, m.index - radius);
  const end = Math.min(value.length, m.index + m[0].length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < value.length ? "…" : "";
  return `${prefix}${value.slice(start, end)}${suffix}`;
}

const problemsByFile = new Map<string, Problem[]>();
let filesScanned = 0;
let stringsChecked = 0;

function pushProblem(file: string, p: Problem) {
  const list = problemsByFile.get(file) ?? [];
  list.push(p);
  problemsByFile.set(file, list);
}

for (const target of TARGETS) {
  const files = collectFiles(target);
  for (const file of files) {
    filesScanned++;
    const rel = relative(ROOT, file);
    const content = readFileSync(file, "utf8");
    const hits = extractHits(content);

    for (const hit of hits) {
      stringsChecked++;
      const { locale, value, line } = hit;

      if (!CJK_OK_LOCALES.has(locale) && CJK_RE.test(value)) {
        pushProblem(rel, { line, label: "cjk-leak", locale, snippet: snippetAround(value, CJK_RE) });
      }
      if (CYRILLIC_RE.test(value)) {
        pushProblem(rel, { line, label: "cyrillic-leak", locale, snippet: snippetAround(value, CYRILLIC_RE) });
      }
      for (const { label, re } of LEAK_PATTERNS) {
        if (re.test(value)) {
          pushProblem(rel, { line, label, locale, snippet: snippetAround(value, re) });
        }
      }
    }
  }
}

const totalProblems = [...problemsByFile.values()].reduce((n, list) => n + list.length, 0);

if (totalProblems > 0) {
  console.error(`❌ Translation corruption: ${totalProblems} problemi in ${problemsByFile.size} file.\n`);
  for (const [file, list] of [...problemsByFile.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.error(file);
    for (const p of list.sort((a, b) => a.line - b.line)) {
      console.error(`  L${p.line} [${p.label}] ${p.locale}: "${p.snippet}"`);
    }
    console.error("");
  }
  console.error(`Totale: ${filesScanned} file scansionati, ${stringsChecked} stringhe locale controllate.`);
  process.exit(1);
}

console.log(
  `✅ Translation corruption OK: ${filesScanned} file scansionati, ${stringsChecked} stringhe locale controllate, nessun leak CJK/cirillico/template.`,
);
