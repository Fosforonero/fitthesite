/**
 * Sprint P0.10 — guardrail "founder:commercial-truth-check".
 *
 * Sprint P0.10K (2026-07-31) — RISCRITTO: chiusura commerciale del sito
 * ANTICIPATA rispetto al cutoff tecnico backend (FOUNDER_END_AT,
 * 2026-07-31T22:00:00Z). Fino a P0.10J l'architettura non cancellava il
 * copy Founder sulle 5 superfici commerciali interattive (homepage, nav
 * desktop, menu mobile, footer, /beta) — lo GATE-ava dietro
 * FounderClientGate/BetaFounderGate, mostrando sempre l'evergreen
 * nell'HTML statico iniziale e la variante founder solo dopo l'hydration,
 * solo a programma ancora aperto. Da oggi il sito smette di proporre nuove
 * adesioni ORE PRIMA del cutoff reale: un gate che decide in base
 * all'orologio del browser mostrerebbe ancora il form/CTA per le prossime
 * ore, l'opposto di quanto richiesto. Le 5 superfici sono state riportate a
 * un rendering STATICO permanente (nessun gate, nessuna decisione
 * temporale ne' server ne' client) che mostra SEMPRE e SOLO il contenuto
 * evergreen.
 *
 * Questo guardrail verifica quindi l'INVARIANTE NUOVO: nessuna di quelle
 * superfici puo' contenere una promo/CTA Founder di acquisizione, GATATA O
 * NO — non piu' "deve avere un gate", ma "non deve avere alcuna promo".
 *
 * Fallisce se:
 *  1. una delle superfici note importa/usa di nuovo FounderClientGate o
 *     BetaFounderGate (segnale che qualcuno sta ri-abilitando l'adesione
 *     Founder su una superficie pubblica);
 *  2. una qualunque di quelle superfici chiama founderPromo(...)/
 *     founderSeats(...) (le stringhe di prezzo/posti Founder di
 *     lib/pricing.ts, pensate per contesti storici/legali, non per CTA
 *     attive);
 *  3. una qualunque di quelle superfici contiene una frase-CTA azionabile
 *     nota ("Diventa founder"/"Become a founder" e equivalenti — l'elenco
 *     esatto delle stringhe rimosse in questo sprint, vedi
 *     BANNED_CTA_PHRASES); lo stesso elenco viene passato anche su TUTTO
 *     app/components/lib (check 3b), per ora in sola segnalazione — vedi
 *     ENFORCE_SITEWIDE_CTA_SCAN;
 *  4. /beta contiene un <form> (l'iscrizione live e' stata rimossa;
 *     ridondante con check-founder-cutoff-render.ts, ultima linea di
 *     difesa qui);
 *  5. compaiono le frasi di urgenza artificiale bandite (bandiera rossa
 *     indipendente dal gating: non dovrebbero esistere in nessuna forma,
 *     ne' qui ne' altrove nel sito);
 *  6. claim editoriali statiche "Founder + 1000 + 2026" fuori da helper
 *     invarianti (founderHistoricalClause/founderHistoricalKeyFact),
 *     sito-wide (non piu' un'eccezione per le 5 superfici: da oggi sono
 *     statiche come tutto il resto, quindi soggette alla stessa regola).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

function read(rel: string): string | null {
  const full = path.join(repoRoot, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

// ── 1: le ex-superfici gate-ate non devono piu' importare/usare un gate ──
const KNOWN_SURFACES = [
  "app/(frontend)/[locale]/(marketing)/page.tsx",
  "app/(frontend)/[locale]/(marketing)/beta/page.tsx",
  "components/Header.tsx",
  "components/Footer.tsx",
  "components/MobileMenu.tsx",
];
const GATE_USAGE_RE = /<(FounderClientGate|BetaFounderGate)\b/;

for (const rel of KNOWN_SURFACES) {
  const content = read(rel);
  if (content === null) {
    errors.push(`Superficie mancante: ${rel}`);
    continue;
  }
  if (GATE_USAGE_RE.test(content)) {
    errors.push(
      `${rel}: usa di nuovo <FounderClientGate>/<BetaFounderGate> — Sprint P0.10K ha reso questa superficie statica e permanente (chiusura commerciale del sito), un gate qui rischia di ri-esporre l'adesione Founder in base all'orologio del browser prima del vero cutoff backend.`,
    );
  }
}

// ── 2: founderPromo/founderSeats vietati sulle superfici note ───────────
const PROMO_NEEDLE_RE = /founderPromo|founderSeats/;
for (const rel of KNOWN_SURFACES) {
  const content = read(rel);
  if (content === null) continue;
  if (PROMO_NEEDLE_RE.test(content)) {
    errors.push(`${rel}: chiama founderPromo/founderSeats — queste superfici sono ora permanenti/statiche e non devono piu' presentare prezzo o posti Founder come offerta attiva.`);
  }
}

// ── 3: frasi-CTA azionabili note, rimosse in questo sprint ──────────────
const BANNED_CTA_PHRASES = [
  /diventa\s+founder/i,
  /become\s+a\s+founder/i,
  /devenir\s+founder/i,
  /hazte\s+founder/i,
  /founder\s+werden/i,
  /torne-se\s+founder/i,
  /voglio\s+essere\s+founder/i,
  /i\s+want\s+to\s+be\s+a\s+founder/i,
];
for (const rel of KNOWN_SURFACES) {
  const content = read(rel);
  if (content === null) continue;
  for (const re of BANNED_CTA_PHRASES) {
    if (re.test(content)) {
      errors.push(`${rel}: contiene di nuovo una CTA di acquisizione Founder azionabile (${re}) — rimossa in Sprint P0.10K, non deve ricomparire su una superficie statica permanente.`);
    }
  }
}

// ── 4: /beta non deve avere un <form> ────────────────────────────────────
const betaContent = read("app/(frontend)/[locale]/(marketing)/beta/page.tsx");
if (betaContent !== null && /<form[\s>]/i.test(betaContent)) {
  errors.push(`app/(frontend)/[locale]/(marketing)/beta/page.tsx: contiene un <form> — /beta e' un archivio informativo, zero iscrizione.`);
}

// ── inventario file sito-wide (usato dai check 3b, 5 e 6) ───────────────
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
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) out.push(full);
  }
}

const allFiles: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), allFiles);

// ── 3b: stesse CTA di acquisizione, ma FUORI dalle 5 superfici note ─────
// Il check 3 sopra guarda solo KNOWN_SURFACES: una CTA "Diventa founder"
// dentro un articolo del blog, una landing programmatica o un componente
// riusato non verrebbe vista, pur essendo esattamente la superficie di
// acquisizione pubblica che questo sprint deve azzerare. Qui l'elenco gira
// su tutto app/components/lib.
//
// STORIA — al primo giro l'estensione aveva trovato occorrenze in lib/blog/
// e lib/landing/, file di cui quell'agente NON era proprietario (li stavano
// lavorando altri agenti in parallelo: correggerli li' avrebbe distrutto il
// loro lavoro). Silenziarli con un'allow-list sarebbe stato il male
// peggiore — l'allow-list sopravvive alla bonifica e il buco resta aperto
// per sempre. Quindi l'estensione e' stata scritta gia' completa, girava ad
// ogni run e STAMPAVA le violazioni, ma non faceva fallire il gate finche'
// la costante restava false.
//
// Sprint P0.10K — FASE 9 (2026-07-31): la bonifica di blog e landing e'
// COMPLETA. Verificato eseguendo questo stesso guardrail PRIMA di toccare la
// costante: il check 3b non stampava piu' alcuna violazione (zero occorrenze
// su tutto app/components/lib). La costante passa quindi a `true` e la
// scansione sito-wide diventa BLOCCANTE: da adesso una CTA "Diventa founder"
// dentro un articolo, una landing programmatica o un componente riusato fa
// fallire il gate esattamente come sulle 5 superfici note.
//
// Copertura residua: questo check 3b resta limitato ai file .ts/.tsx e a una
// lista chiusa di frasi IT/EN/ES/DE/PT/FR. La scansione strutturale completa
// — .json di overlay inclusi (lib/blog/nordic-overlay.json,
// lib/landing/es-overlay.json, che SOVRASCRIVONO il testo dei .ts), 15
// locale, link/ctaLabel/ctaHref come ancora invece della sola parola — vive
// in tools/check-founder-acquisition-surfaces.ts
// (npm run founder:acquisition-surfaces-check).
const ENFORCE_SITEWIDE_CTA_SCAN = true;
const sitewideCtaFindings: string[] = [];

for (const file of allFiles) {
  const rel = path.relative(repoRoot, file);
  // gia' coperte, in modo bloccante, dal check 3
  if (KNOWN_SURFACES.includes(rel)) continue;
  const content = fs.readFileSync(file, "utf8");
  for (const re of BANNED_CTA_PHRASES) {
    const m = content.match(re);
    if (!m || m.index === undefined) continue;
    const line = content.slice(0, m.index).split("\n").length;
    sitewideCtaFindings.push(
      `${rel}:${line}: CTA di acquisizione Founder azionabile (${re}) fuori dalle 5 superfici note — il sito e' post-Founder, nessuna superficie pubblica deve invitare ad aderire.`,
    );
  }
}
if (ENFORCE_SITEWIDE_CTA_SCAN) errors.push(...sitewideCtaFindings);

// ── 5: frasi di urgenza artificiale bandite, sito-wide ──────────────────
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

// ── 6: claim editoriali statiche "Founder + 1000 + 2026" fuori da helper ─
// Sprint P0.10G: contenuto editoriale (press kit, blog, landing
// programmatiche) e ora (P0.10K) ANCHE le ex-superfici gate-ate, tutte
// statiche/build-time — una frase tipo "i primi 1000 founder (...2026)" e'
// vera solo se ancorata a una regola invariante, non a un ternario
// aperto/chiuso o a una CTA di acquisizione.
const HELPER_DEFINITION_FILES = new Set(["lib/founder/historical-note.ts"]);

// Sprint P0.10G: debito noto e accettato — vedi commento storico nel
// guardrail originale. Non ri-verificato in questo giro (fuori scope
// P0.10K, che riguarda solo le superfici di acquisizione pubbliche).
//
// Sprint P0.10K — REGRESSIONE CORRETTA: le prime due voci qui sotto erano
// esentate su main da ALLOWED_UNGATED_FILES (l'allow-list "storica/legale"
// del vecchio check 2, che questo sprint ha sostituito con il divieto
// secco di founderPromo/founderSeats sulle 5 superfici). Sciogliendo
// quell'allow-list si erano persi anche i due skip legittimi di QUESTO
// check, che quindi falliva su prosa storica/legale corretta. Non sono
// CTA di acquisizione e non hanno un ramo aperto/chiuso:
//  - terms/page.tsx: clausola contrattuale sul beneficio Founder GIA'
//    concesso, con cutoff + regola dei 14 giorni espliciti nel testo
//    (invariante, e verificata a parte da founder:metadata-invariant-check
//    CONTROLLO 4, che e' piu' severo di questo);
//  - fitmesh-gratis-prezzo-founder.ts: articolo storico sul prezzo, gia'
//    riscritto e datato esplicitamente, nessuna adesione proposta.
const KNOWN_UNGATED_DATE_CLAIM_DEBT = new Set([
  "app/(frontend)/[locale]/(marketing)/terms/page.tsx",
  "lib/blog/posts/fitmesh-gratis-prezzo-founder.ts",
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

const FOUNDER_SEATS_WINDOW = 200;
const FOUNDER_WORD_RE = /\bfounders?\b/gi;
const SEATS_NEARBY_RE = /\b1[.,]?000\b/;
const YEAR_NEARBY_RE = /\b2026\b/;
const HELPER_CALL_RE = /founderHistorical(Clause|KeyFact)\s*\(/g;

for (const file of allFiles) {
  const rel = path.relative(repoRoot, file);
  if (HELPER_DEFINITION_FILES.has(rel)) continue;
  if (KNOWN_UNGATED_DATE_CLAIM_DEBT.has(rel)) continue;
  const content = fs.readFileSync(file, "utf8");

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
    `${rel}: ${uncovered.length} occorrenza/e di "founder" + "1000/1.000" + "2026" ravvicinate (claim hardcoded sullo stato del programma Founder) NON risolte da founderHistoricalClause()/founderHistoricalKeyFact() — righe ${lineList}. Se e' debito gia' noto e accettato, aggiungi il file a KNOWN_UNGATED_DATE_CLAIM_DEBT.`,
  );
}

if (!ENFORCE_SITEWIDE_CTA_SCAN && sitewideCtaFindings.length > 0) {
  console.error(
    `⚠️  founder:commercial-truth-check — ${sitewideCtaFindings.length} CTA di acquisizione Founder fuori dalle 5 superfici note (check 3b, NON bloccante finche' ENFORCE_SITEWIDE_CTA_SCAN=false):\n`,
  );
  for (const w of sitewideCtaFindings) console.error(`  ! ${w}`);
  console.error("");
}

if (errors.length > 0) {
  console.error("❌ founder:commercial-truth-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    "✅ founder:commercial-truth-check: homepage/nav/footer/beta sono statiche e permanenti (zero gate, zero CTA/promo Founder azionabile, zero form), zero urgenza artificiale, claim editoriali founder+1000+2026 tracciate (helper/debito noto).",
  );
}
