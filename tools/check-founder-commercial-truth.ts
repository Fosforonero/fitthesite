/**
 * Sprint P0.10 — guardrail "founder:commercial-truth-check".
 *
 * Nessuna superficie commerciale (homepage, nav desktop, menu mobile,
 * footer, /beta) deve mostrare la promo Founder INCONDIZIONATA dopo il
 * cutoff. L'architettura di questo sprint non CANCELLA il copy Founder (i
 * Founder esistenti e l'archivio storico ne hanno bisogno) — lo GATE
 * dietro components/founder/FounderClientGate, che nell'HTML statico
 * iniziale mostra sempre la variante evergreen e sostituisce con la
 * variante founder solo dopo l'hydration, solo se il programma e' ancora
 * aperto secondo l'orologio del browser.
 *
 * Questo guardrail verifica quindi la PRESENZA della gate nelle superfici
 * note, non l'assenza letterale della parola "founder" (che romperebbe
 * l'archivio storico legittimo). La prova comportamentale reale (promo
 * assente dall'HTML esattamente al cutoff) e' nel gate Playwright di FASE
 * 10, non qui.
 *
 * Fallisce se:
 *  1. una delle superfici note non importa/usa FounderClientGate;
 *  2. una qualunque locale di lib/pricing.ts (founderPromo/founderSeats)
 *     compare in un file marketing NON presente nell'allow-list storica/
 *     legale E che non importa FounderClientGate;
 *  3. compaiono le frasi di urgenza artificiale bandite (bandiera rossa
 *     indipendente dal gating: non dovrebbero esistere in nessuna forma).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

function read(rel: string): string | null {
  const full = path.join(repoRoot, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

// ── 1: le superfici note devono importare E usare FounderClientGate ─────
const GATED_SURFACES = [
  "app/(frontend)/[locale]/(marketing)/page.tsx",
  "app/(frontend)/[locale]/(marketing)/beta/page.tsx",
  "components/Header.tsx",
  "components/Footer.tsx",
  "components/MobileMenu.tsx",
];

for (const rel of GATED_SURFACES) {
  const content = read(rel);
  if (content === null) {
    errors.push(`Superficie mancante: ${rel}`);
    continue;
  }
  const importsGate = /from\s+["']@\/components\/founder\/FounderClientGate["']/.test(content);
  const usesGate = /<FounderClientGate/.test(content);
  if (!importsGate || !usesGate) {
    errors.push(
      `${rel}: non importa/usa <FounderClientGate> — se contiene copy Founder attivo (promo, CTA, badge), oggi verrebbe mostrato incondizionatamente anche dopo il cutoff.`,
    );
  }
}

// ── 2: founderPromo/founderSeats solo in file che gateano o nell'allow-list ─
const ALLOWED_UNGATED_FILES = new Set([
  // Copy storica/legale: spiega un beneficio GIA' concesso, non un'offerta
  // attiva — corretto che resti visibile senza gating temporale.
  "app/(frontend)/[locale]/(marketing)/terms/page.tsx",
  "lib/blog/posts/perche-diventare-founder-fitmesh.ts",
  "lib/blog/posts/fitmesh-gratis-prezzo-founder.ts",
  // Definizione delle stringhe/costanti, non un punto di rendering: il
  // rendering effettivo passa sempre da un file che IMPORTA questi moduli
  // e che e' gia' coperto da GATED_SURFACES o da questo stesso controllo.
  "lib/pricing.ts",
  "lib/content/homepage-copy.ts",
]);

const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_EXCLUDE_DIRS = new Set(["node_modules", ".next", ".git"]);
const PROMO_NEEDLE_RE = /founderPromo|founderSeats/;

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
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) out.push(full);
  }
}

const allFiles: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), allFiles);

for (const file of allFiles) {
  const rel = path.relative(repoRoot, file);
  if (ALLOWED_UNGATED_FILES.has(rel)) continue;
  const content = fs.readFileSync(file, "utf8");
  if (!PROMO_NEEDLE_RE.test(content)) continue;
  if (!/<FounderClientGate/.test(content)) {
    errors.push(
      `${rel}: usa founderPromo/founderSeats senza <FounderClientGate> e non e' nell'allow-list storica/legale — rischia di mostrare la promo Founder incondizionatamente dopo il cutoff.`,
    );
  }
}

// ── 3: frasi di urgenza artificiale bandite indipendentemente dal gating ──
// (una negazione entro i 20 caratteri precedenti il match — "non è offerta a
// tempo", "not a hurry" — capovolge il senso della frase: è esattamente il
// disclaimer CORRETTO contro l'urgenza artificiale, non l'urgenza stessa.)
const URGENCY_PHRASES = [
  /affrettati/i,
  /ultim[ei]\s+(ore|giorni)\s+per\s+diventare\s+founder/i,
  /solo\s+per\s+poco/i,
  /offerta\s+a\s+tempo/i,
  /hurry\s+up/i,
  /last\s+chance\s+to\s+become\s+a?\s*founder/i,
];
const NEGATION_RE = /\b(non\s+[eè]'?|not\s+a|non\s+si\s+tratta\s+di)[\s"'\\]*$/i;

for (const file of allFiles) {
  const rel = path.relative(repoRoot, file);
  const content = fs.readFileSync(file, "utf8");
  for (const re of URGENCY_PHRASES) {
    const m = content.match(re);
    if (!m || m.index === undefined) continue;
    const before = content.slice(Math.max(0, m.index - 20), m.index);
    if (NEGATION_RE.test(before)) continue;
    errors.push(`${rel}: contiene un pattern di urgenza artificiale bandito (${re}) — vietato indipendentemente dal gating temporale.`);
  }
}

if (errors.length > 0) {
  console.error("❌ founder:commercial-truth-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    "✅ founder:commercial-truth-check: homepage/nav/footer/beta gateano tutti FounderClientGate, nessun founderPromo/founderSeats fuori gate o allow-list, zero urgenza artificiale.",
  );
}
