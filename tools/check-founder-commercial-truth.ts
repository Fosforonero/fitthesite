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

// ── 4: claim editoriali statiche "Founder + 2026" fuori da gate/helper ────
// Sprint P0.10E addendum: contenuto editoriale (press kit, blog, landing
// programmatiche) non passa da FounderClientGate (non ha una variante
// client-side, e' prosa fissa generata al build) — una frase tipo "i primi
// 1000 founder (programma chiuso dal 31 luglio 2026)" e' vera solo in META'
// del tempo (prima O dopo il cutoff, mai in entrambe), se hardcoded.
//
// Sprint P0.10G — AGGIORNAMENTO: il debito e' stato CHIUSO con una
// correzione di contenuto dedicata (audit + riscrittura invariante, non
// traduzione automatica). I file sotto NON hanno piu' una claim
// aperto/chiuso legata alla data — la parentetica e' stata riscritta da
// "programma chiuso dal 31 luglio 2026" (falso META' del tempo) a "entro il
// 31 luglio 2026" (vero SEMPRE: descrive il limite della regola, non lo
// stato del momento). Restano in questa lista non perche' sia debito
// residuo, ma perche' la correzione e' stata fatta come sostituzione
// testuale mirata della sola parentetica, non richiamando sintatticamente
// founderHistoricalClause()/founderHistoricalKeyFact() — quindi questo
// check (che cerca una CHIAMATA all'helper, non la correttezza semantica
// del testo) non li riconoscerebbe come "coperti" senza questa esclusione
// esplicita. Verificato in P0.10G (founder:static-invariant-check +
// ispezione diretta dell'HTML buildato) che nessuno di questi file contiene
// piu' il pattern falso.
// Sprint P0.10G: lib/founder/historical-note.ts e' la DEFINIZIONE di
// founderHistoricalClause()/founderHistoricalKeyFact()/
// founderEligibilityStatement() — contiene per costruzione le stringhe
// letterali "founder"+"1000"+"2026" (sono il VALORE DI RITORNO della
// funzione, ora invariante: nessun ramo aperto/chiuso, solo la regola di
// idoneita'), non una chiamata alla funzione stessa. Un helper non deve
// "chiamare se stesso" per essere considerato coperto — escluso qui,
// altrimenti il check fallirebbe sempre non appena la data compare come
// stringa letterale invece che come parametro ${endDate} dinamico (era
// cosi' nella versione precedente, pre-P0.10G, per questo il file passava
// senza bisogno di questa esclusione esplicita).
const HELPER_DEFINITION_FILES = new Set(["lib/founder/historical-note.ts"]);

const KNOWN_UNGATED_DATE_CLAIM_DEBT = new Set([
  "lib/blog/posts/come-funziona-fitmesh.ts",
  "lib/blog/posts/migliori-anelli-economici.ts",
  "lib/blog/posts/tracciare-sonno-anello.ts",
  "lib/blog/posts/anello-smart-guida-completa.ts",
  "lib/blog/posts/fitmesh-sync-disponibile-google-play.ts",
  "lib/blog/posts/colmi-ring-fitmesh.ts",
  "lib/blog/posts/sync-them-all.ts",
  "lib/blog/posts/cambiare-smartwatch-senza-perdere-dati.ts",
  "lib/blog/posts/colmi-r02-setup.ts",
  "lib/blog/posts/dove-sono-i-tuoi-dati-server-ue.ts",
  "lib/blog/posts/fitmesh-vs-alternative-sync.ts",
  "lib/blog/posts/colmi-r09-temperatura-sviluppo.ts",
  "lib/blog/posts/anello-colmi-r02-affidabile.ts",
  "lib/blog/posts/alternative-app-sync-wearable-2026.ts",
  "lib/blog/posts/guida-sync-wearable-2026.ts",
  "lib/blog/posts/perche-diventare-founder-fitmesh.ts",
]);
// Finestra a caratteri fissi (non "fino al prossimo punto"): un delimitatore
// a punteggiatura si rompe su codice strutturato (array/oggetti TS senza
// periodi fra un valore e l'altro), facendo "sanguinare" il match fra due
// stringhe vicine ma semanticamente non correlate (falso positivo osservato
// su OrganizationJsonLd.tsx/lib/blog/covers.ts/lib/product-facts.ts: parola
// "founder" nel senso di fondatore-persona vicino a un "2026" scollegato).
// Richiedere ANCHE "1000"/"1.000"/"1,000" (i posti Founder) e' il segnale
// specifico della claim del PROGRAMMA, non del sostantivo "founder" da solo
// (che compare anche per Matteo Pizzi "founder" dell'azienda, schema.org
// Organization.founder, ecc. — tutti legittimi, fuori scope di questo check).
const FOUNDER_SEATS_WINDOW = 200;
const FOUNDER_WORD_RE = /\bfounders?\b/gi;
const SEATS_NEARBY_RE = /\b1[.,]?000\b/;
const YEAR_NEARBY_RE = /\b2026\b/;
const HELPER_CALL_RE = /founderHistorical(Clause|KeyFact)\s*\(/g;

for (const file of allFiles) {
  const rel = path.relative(repoRoot, file);
  if (GATED_SURFACES.includes(rel)) continue;
  if (HELPER_DEFINITION_FILES.has(rel)) continue;
  if (KNOWN_UNGATED_DATE_CLAIM_DEBT.has(rel)) continue;
  // fitmesh-gratis-prezzo-founder.ts e' gia' nell'allow-list storica/legale
  // del check #2 sopra (ALLOWED_UNGATED_FILES): stessa copy gia' rivista,
  // corretta e datata esplicitamente ("chiuso dal 31 luglio 2026"), non un
  // nuovo debito.
  if (ALLOWED_UNGATED_FILES.has(rel)) continue;
  const content = fs.readFileSync(file, "utf8");

  // PER-OCCORRENZA, non per-file: un singolo import dell'helper in cima NON
  // deve assolvere l'intero file. Il caso reale che ha motivato questa
  // scelta: press/page.tsx ha 15 blocchi locale, ne erano stati convertiti 2
  // (it/en) e un check "il file importa l'helper? allora e' a posto" passava
  // in verde lasciando 13 locale con la claim hardcoded sbagliata. Qui
  // ciascuna occorrenza deve essere risolta per conto suo: si considera
  // coperta solo se l'helper e' invocato DENTRO la stessa finestra di testo.
  let hit: RegExpExecArray | null;
  FOUNDER_WORD_RE.lastIndex = 0;
  const uncovered: number[] = [];
  while ((hit = FOUNDER_WORD_RE.exec(content)) !== null) {
    const windowStart = Math.max(0, hit.index - FOUNDER_SEATS_WINDOW);
    const windowEnd = Math.min(content.length, hit.index + hit[0].length + FOUNDER_SEATS_WINDOW);
    const window = content.slice(windowStart, windowEnd);
    if (!SEATS_NEARBY_RE.test(window) || !YEAR_NEARBY_RE.test(window)) continue;
    if (HELPER_CALL_RE.test(window)) {
      HELPER_CALL_RE.lastIndex = 0;
      continue;
    }
    HELPER_CALL_RE.lastIndex = 0;
    uncovered.push(content.slice(0, hit.index).split("\n").length);
  }
  if (uncovered.length === 0) continue;
  const lineList = uncovered.slice(0, 8).join(", ") + (uncovered.length > 8 ? `, ... (+${uncovered.length - 8})` : "");
  errors.push(
    `${rel}: ${uncovered.length} occorrenza/e di "founder" + "1000/1.000" + "2026" ravvicinate (claim hardcoded sullo stato del programma Founder) NON risolte da founderHistoricalClause()/founderHistoricalKeyFact() — righe ${lineList}. Una claim del genere e' vera solo per meta' del calendario. Nota: l'import in cima al file NON basta, ogni occorrenza va convertita. Se e' debito gia' noto e accettato, aggiungi il file a KNOWN_UNGATED_DATE_CLAIM_DEBT.`,
  );
}

if (errors.length > 0) {
  console.error("❌ founder:commercial-truth-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    "✅ founder:commercial-truth-check: homepage/nav/footer/beta gateano tutti FounderClientGate, nessun founderPromo/founderSeats fuori gate o allow-list, zero urgenza artificiale, claim editoriali founder+2026 tracciate (gate/helper/TODO-list nota).",
  );
}
