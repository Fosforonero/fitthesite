/**
 * Sprint P0.10J — guardrail "founder:metadata-invariant-check".
 *
 * CONTESTO: l'addendum P0.10I (sweep 15 lingue, 30/07/2026) ha trovato 3
 * superfici ad alto rischio e 1 a rischio medio che affermavano il
 * beneficio Founder come "attivato/concesso automaticamente alla
 * registrazione", SENZA data di cutoff né requisito di prima sync — falso
 * rispetto alla regola reale (`private.grant_founder_launch_core`, che
 * richiede una prima sincronizzazione verificata entro 14 giorni dalla
 * registrazione, non un grant automatico alla sola iscrizione — vedi anche
 * il commento storico in lib/founder/historical-note.ts, che aveva già
 * corretto la stessa frase altrove in Sprint P0.10G). Nessuna di queste 4
 * superfici è mai stata gated da FounderClientGate/BetaFounderGate perché
 * generateMetadata(), il JSON-LD, il press kit e i Termini sono contenuto
 * generato al build, senza variante client-side:
 *
 *   1. beta/page.tsx — generateMetadata() (title/description/OG/Twitter)
 *   2. beta/page.tsx — JSON-LD WebPage (name/description)
 *   3. press/page.tsx — storyAngles (15 locale)
 *   4. terms/page.tsx — clausola "Founder Pro" (6 locale)
 *
 * Sprint P0.10J ha sostituito tutte e 4 con testo statico ma TEMPORALMENTE
 * INVARIANTE (vero sia prima sia dopo il cutoff, mai un branch runtime,
 * mai Date.now()): le prime due riusano `founderEligibilityStatement()`/
 * `betaMetaTitle()`, la terza riusa `founderHistoricalClause()`, la quarta
 * è stata riscritta a mano per includere esplicitamente cutoff + 14gg.
 *
 * Questo guardrail verifica che la correzione resti in piedi.
 *
 * CONTROLLO 1 — beta/page.tsx usa `betaMetaTitle(lc)`/
 * `founderEligibilityStatement(lc)` in almeno 2 punti ciascuno
 * (generateMetadata + JSON-LD WebPage), non stringhe letterali per-locale.
 *
 * CONTROLLO 2 — nessuna delle frasi "attivato/concesso automaticamente
 * alla registrazione" (equivalenti nelle lingue coperte) può ricomparire
 * in beta/page.tsx, press/page.tsx o terms/page.tsx.
 *
 * CONTROLLO 3 — press kit: `founderHistoricalClause(` deve comparire
 * almeno 30 volte (15 nel paragrafo "company overview" già esistente da
 * P0.10G + 15 nuove nei storyAngles, una per locale) — un calo indica che
 * uno storyAngle è tornato a una frase letterale.
 *
 * CONTROLLO 4 — terms/page.tsx: ciascuna delle 6 clausole "Founder Pro ("
 * deve contenere, nella stessa finestra di testo, sia un riferimento alla
 * data di cutoff (2026 + "31") sia un riferimento ai 14 giorni.
 *
 * CONTROLLO 5 — nessuna delle 4 superfici può dichiarare staticamente che
 * il programma "è aperto" o "è concluso"/"has ended" (pattern ampio, SOLO
 * su queste superfici — non un controllo sito-wide, quello esiste già in
 * tools/check-founder-static-invariant.ts per blog/landing/llms.txt).
 *
 * CONTROLLO 6 — lib/llms-txt.ts: la sezione Founder mantiene sia il cutoff
 * ISO sia il riferimento ai 14 giorni (non regredita dalla correzione
 * P0.10G/P0.10I).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

const BETA_PAGE = "app/(frontend)/[locale]/(marketing)/beta/page.tsx";
const PRESS_PAGE = "app/(frontend)/[locale]/(marketing)/press/page.tsx";
const TERMS_PAGE = "app/(frontend)/[locale]/(marketing)/terms/page.tsx";
const LLMS_TXT = "lib/llms-txt.ts";

function read(rel: string): string {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

function count(src: string, needle: string): number {
  return (src.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
}

// ── CONTROLLO 1 ───────────────────────────────────────────────────────────
const betaSrc = read(BETA_PAGE);
// CONTROLLO 2/5 riguardano SOLO la parte di beta/page.tsx senza gate
// runtime (generateMetadata + il JSON-LD prima di <BetaFounderGate>): oltre
// quel punto, FounderOpenBody/BETA_CLOSED_COPY sono legittimamente
// runtime-gated e possono descrivere lo stato reale (es. "il tuo Pro a vita
// si attiva automaticamente" come perk mostrato SOLO a programma aperto, o
// "The Founder program has ended" nell'archivio SOLO a programma chiuso) —
// scansionarle produrrebbe falsi positivi su contenuto già corretto.
const gateIndex = betaSrc.indexOf("<BetaFounderGate");
if (gateIndex === -1) {
  errors.push(`${BETA_PAGE}: non trovo <BetaFounderGate — il file potrebbe essere stato ristrutturato, controllare manualmente lo scoping di questo guardrail.`);
}
const betaUngatedSrc = gateIndex === -1 ? betaSrc : betaSrc.slice(0, gateIndex);
// Conteggio ristretto alla sola parte SENZA gate: `founderEligibilityStatement(lc)`
// compare anche una terza volta, legittimamente, dentro FounderPendingBody
// (contenuto gated, P0.10H) — contare su tutto il file maschererebbe la
// perdita di UNA delle due occorrenze ungated dietro quella terza sempre
// presente (verificato con un test negativo: sostituire la sola
// description del JSON-LD con una stringa letterale faceva scendere il
// conteggio whole-file da 3 a 2, che restava comunque >= 2 e non falliva).
const betaMetaTitleCount = count(betaUngatedSrc, "betaMetaTitle(lc)");
const eligibilityCountBeta = count(betaUngatedSrc, "founderEligibilityStatement(lc)");
if (betaMetaTitleCount < 2) {
  errors.push(
    `${BETA_PAGE}: betaMetaTitle(lc) atteso in almeno 2 punti SENZA gate (generateMetadata + JSON-LD WebPage), trovato ${betaMetaTitleCount} volta/e — rischio che title torni a un ternario letterale per-locale.`,
  );
}
if (eligibilityCountBeta < 2) {
  errors.push(
    `${BETA_PAGE}: founderEligibilityStatement(lc) atteso in almeno 2 punti SENZA gate (generateMetadata + JSON-LD WebPage), trovato ${eligibilityCountBeta} volta/e — rischio che description torni a un claim letterale non datato.`,
  );
}

// ── CONTROLLO 2 ───────────────────────────────────────────────────────────
const BANNED_AUTOMATIC_PHRASES = [
  "attivato automaticamente",
  "concesso automaticamente alla registrazione",
  "activated automatically",
  "granted automatically on signup",
  "activado automáticamente",
  "concedido automáticamente al registrarse",
  "automatisch aktiviert",
  "automatisch bei der Registrierung gewährt",
  "ativado automaticamente",
  "concedido automaticamente no registo",
  "concedido automaticamente",
  "activé automatiquement",
  "accordé automatiquement lors de l'inscription",
];
for (const [file, src] of [
  [BETA_PAGE, betaUngatedSrc] as const,
  [PRESS_PAGE, read(PRESS_PAGE)] as const,
  [TERMS_PAGE, read(TERMS_PAGE)] as const,
]) {
  for (const phrase of BANNED_AUTOMATIC_PHRASES) {
    if (src.toLowerCase().includes(phrase.toLowerCase())) {
      errors.push(
        `${file}: contiene di nuovo la frase bandita "${phrase}" — claim Founder "automatico alla registrazione", falso rispetto alla regola reale (richiede prima sincronizzazione verificata entro 14 giorni).`,
      );
    }
  }
}

// ── CONTROLLO 3 ───────────────────────────────────────────────────────────
const pressSrc = read(PRESS_PAGE);
const clauseCount = count(pressSrc, "founderHistoricalClause(");
if (clauseCount < 30) {
  errors.push(
    `${PRESS_PAGE}: founderHistoricalClause( atteso almeno 30 volte (15 company-overview + 15 storyAngles), trovato ${clauseCount} — uno storyAngle Founder potrebbe essere tornato a una frase letterale non datata.`,
  );
}

// ── CONTROLLO 4 ───────────────────────────────────────────────────────────
const termsSrc = read(TERMS_PAGE);
const founderClauseStarts: number[] = [];
{
  const re = /Founder Pro \(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(termsSrc)) !== null) founderClauseStarts.push(m.index);
}
if (founderClauseStarts.length < 6) {
  errors.push(`${TERMS_PAGE}: attese almeno 6 clausole "Founder Pro (" (it/en/es/de/pt/fr), trovate ${founderClauseStarts.length}.`);
}
for (const start of founderClauseStarts) {
  const window = termsSrc.slice(start, start + 700);
  const hasCutoffDate = /2026/.test(window) && /31/.test(window);
  const hasFourteenDays = /14\s*(giorni|days|días|dias|jours|Tagen)/i.test(window);
  if (!hasCutoffDate || !hasFourteenDays) {
    errors.push(
      `${TERMS_PAGE}: la clausola Founder Pro a offset ${start} non contiene sia la data di cutoff (31/07/2026) sia il riferimento ai 14 giorni nella stessa finestra di testo — rischio di disallineamento con la regola reale.`,
    );
  }
}

// ── CONTROLLO 5 ───────────────────────────────────────────────────────────
// Basato su prossimità, non su una sequenza rigida "programma è aperto":
// un test negativo ha dimostrato che una parola intermedia (es. "Il
// programma Founder è aperto") bucava un regex che pretendeva "programma"
// seguito IMMEDIATAMENTE da "è"/"e". Qui si cerca prima il verbo di stato
// ("è aperto", "is open", "ist offen", "est ouvert", "está abierto/aberto",
// "è concluso", "has ended", "ist beendet", "est terminé", "ha finalizado",
// "foi encerrado"), poi si verifica che "Founder"/"programma"/"program(me)"
// compaia entro gli 100 caratteri precedenti — qualunque distanza di parole.
// NOTA: niente `\b` intorno a "è"/accenti — in JS senza flag `u` con
// Unicode property escapes, `\b` classifica lettere accentate come "non
// word", quindi un confine PRIMA di "è" non scatta mai (spazio=non-word,
// è=non-word: nessuna transizione). Un test negativo l'ha dimostrato dal
// vivo: "programma Founder è aperto" non veniva intercettato. Qui si usa
// `(?:^|\s)` esplicito prima delle forme accentate invece di `\b`.
const STATE_CLAIM_RE = /(?:^|\s)(è|e)\s+(ancora\s+)?aperto\b|\bis\s+(currently\s+)?open\b|\bist\s+(noch\s+)?offen\b|\best\s+(encore\s+)?ouvert\b|(?:^|\s)está\s+abiert[oa]\b|(?:^|\s)está\s+abert[oa]\b|(?:^|\s)(è|e)\s+concluso\b|\bhas\s+ended\b|\bist\s+beendet\b|\best\s+termin[ée](?:\s|$|[.,:;])|(?:^|\s)ha\s+finalizado\b|(?:^|\s)foi\s+encerrad[oa]\b/gi;
const FOUNDER_CONTEXT_RE = /founder|programma|program|programme|programm/i;

function findUngatedStateClaim(text: string): string | null {
  const re = new RegExp(STATE_CLAIM_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const windowStart = Math.max(0, m.index - 100);
    const before = text.slice(windowStart, m.index);
    if (FOUNDER_CONTEXT_RE.test(before)) {
      return text.slice(windowStart, m.index + m[0].length + 20).replace(/\s+/g, " ").trim();
    }
  }
  return null;
}

for (const [file, src] of [
  [BETA_PAGE, betaUngatedSrc] as const,
  [PRESS_PAGE, read(PRESS_PAGE)] as const,
  [TERMS_PAGE, read(TERMS_PAGE)] as const,
]) {
  const found = findUngatedStateClaim(src);
  if (found) {
    errors.push(`${file}: contiene una dichiarazione statica di stato aperto/concluso del programma Founder ("...${found}...") — questa superficie non ha un gate runtime, non può mai affermarlo staticamente.`);
  }
}

// ── CONTROLLO 6 ───────────────────────────────────────────────────────────
const llmsSrc = read(LLMS_TXT);
if (!/2026-07-31T22:00:00Z/.test(llmsSrc)) {
  errors.push(`${LLMS_TXT}: manca il cutoff ISO 2026-07-31T22:00:00Z nella sezione Founder.`);
}
if (!/14\s*days/i.test(llmsSrc)) {
  errors.push(`${LLMS_TXT}: manca il riferimento ai 14 giorni nella sezione Founder.`);
}

if (errors.length > 0) {
  console.error("❌ founder:metadata-invariant-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    `✅ founder:metadata-invariant-check: beta/page.tsx usa betaMetaTitle()/founderEligibilityStatement() (${betaMetaTitleCount}/${eligibilityCountBeta} occorrenze), press kit usa founderHistoricalClause() ${clauseCount} volte, Termini (${founderClauseStarts.length} clausole) contengono cutoff+14gg, nessuna frase "automatico alla registrazione" o dichiarazione statica aperto/concluso su beta/press/terms, llms.txt invariato.`,
  );
}
