/**
 * Guardrail P1.9-10 — meccanismo passi: nessuna bugia/framing obsoleto nei
 * contenuti pubblici.
 *
 * STORIA (per non ripetere gli stessi errori): durante il ramo 190 il
 * meccanismo di arbitraggio dei passi (fusione fra fonti multiple, grafico
 * orario, linea tratteggiata del grafico) e' cambiato piu' volte — vedi i
 * commit "un giorno vale una volta sola, e con il suo totale piu' alto —
 * piu' la soglia 80% al posto del minimo" e "tre linee sul grafico passi:
 * media verde, massimo giallo, minimo rosso — e la baseline smette di
 * dipendere dalla scheda" seguito da "la linea tratteggiata e' la media
 * personale, non l'obiettivo". Ogni cambiamento reale nel codice ha
 * lasciato indietro frasi pubblicate che descrivevano il comportamento
 * VECCHIO. Questo guardrail e' STATICO e TESTUALE: non reimplementa
 * l'algoritmo reale (vive nel repo Flutter, un repo diverso) — impedisce
 * che formulazioni gia' false/obsolete una volta tornino a comparire nei
 * contenuti pubblicati, seguendo lo stesso approccio "static analysis via
 * git ls-files + readFileSync" di check-p016-structured-data.ts e
 * check-p17-health-connect-truth.ts.
 *
 * Scope (contenuti pubblici): lib/blog/posts/*.ts, lib/content/*.ts,
 * app/(frontend)/**\/*.tsx — esclusi file di test (*.test.ts(x), *.spec.ts(x),
 * __tests__/) e qualunque cosa fuori da git ls-files (node_modules/.next/
 * .claude/worktrees non sono comunque tracciati).
 *
 * Fallisce (exit 1) se un file di contenuto pubblico contiene, sui PASSI
 * (non su altre metriche — es. la frequenza cardiaca PUO' legittimamente
 * essere per-ora, il vincolo qui riguarda solo i passi cumulativi
 * giornalieri):
 *
 *  1. Il framing "il valore/numero/dato/totale piu' alto vince" (o una sua
 *     parafrasi ovvia: "prende/sceglie/usa il valore piu' alto", "quella
 *     col totale piu' alto", "wins the highest value", "with the highest
 *     total") applicato ai passi.
 *  2. Deduplicazione dei passi cumulativi giornalieri descritta come
 *     applicata PER ORA / PER INTERVALLO ("per quell'ora", "per quell'
 *     intervallo", "for that hour/interval") — il giorno e' l'unita' di
 *     arbitraggio, non l'ora. Richiede un verbo/framing di arbitraggio
 *     nelle vicinanze (altrimenti "il grafico indica il dispositivo che ha
 *     misurato ogni ora" — una frase descrittiva sul DISPLAY orario, non
 *     un claim sul meccanismo di dedup — non deve scattare).
 *  3. "mai contato due volte" / "never counted twice" (o l'equivalente
 *     "non/nunca ... due volte/twice/dos veces") come affermazione
 *     ASSOLUTA, senza una qualificazione entro ~150 caratteri ("quasi
 *     sempre", "nella maggior parte dei casi", "edge case", "almost
 *     always", "in most cases", ...).
 *  4. La linea tratteggiata del grafico passi descritta come "obiettivo"/
 *     "goal" (senza negazione vicina: "non e' un obiettivo" resta corretto).
 *  5. Il grafico orario passi descritto come sempre disponibile/mostrato
 *     ("sempre disponibile/visibile/mostrato", "always available/shown")
 *     senza menzionare da vicino che puo' essere nascosto.
 *  6. Una soglia "80%" citata vicino a "grafico" + passi/steps — rimossa
 *     dal codice (vedi commit 56ec3d77), non deve tornare nei contenuti.
 *  7. Una "linea del massimo"/"linea del minimo" ("maximum/minimum line")
 *     sul grafico passi — rimosse dal codice, resta solo la media.
 *  8. Una descrizione di somma indiscriminata di tutte le fonti per i passi
 *     ("somma tutte le fonti", "adds up all sources") non negata — FitMesh
 *     non somma mai i passi fra fonti sovrapposte.
 *
 * Ogni check e' un grep di stringa/regex con una finestra di contesto
 * attorno al match (stesso pattern di check-p17: window slicing, non
 * un parser). Non e' un test dell'algoritmo passi reale — quello vive nel
 * repo Flutter — e' un test del CONTENUTO PUBBLICATO.
 *
 * Uso (Docker, nessun runtime locale — vedi CLAUDE.md globale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-steps-chart-truth.ts
 *
 * Auto-verifica del guardrail (solo negative test, ignora lo stato attuale
 * dei contenuti reali — utile perche' i negative test mutano/ripristinano
 * file reali e nel flusso normale i check reali bloccano PRIMA di arrivarci
 * se il repo ha gia' violazioni in sospeso):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-steps-chart-truth.ts --self-test
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const errors: string[] = [];

function trackedFiles(patterns: string): string[] {
  return execSync(`git ls-files ${patterns}`, { cwd: process.cwd(), encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((f) => !/\.(test|spec)\.tsx?$/.test(f))
    .filter((f) => !/(^|\/)__tests__(\/|$)/.test(f))
    .filter((f) => !/(^|\/)(\.claude|worktrees|node_modules|\.next)(\/|$)/.test(f));
}

const CONTENT_FILES: string[] = [
  ...trackedFiles("'lib/blog/posts/*.ts'"),
  ...trackedFiles("'lib/content/*.ts'"),
  ...trackedFiles("'app/(frontend)/**/*.tsx'"),
];

// ── helper di finestra/contesto (stesso pattern di check-p016/check-p17) ──
function windowAround(content: string, idx: number, matchLen: number, radius: number): string {
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + matchLen + radius);
  return content.slice(start, end);
}
function trimSnippet(s: string, max = 220): string {
  return s.replace(/\s+/g, " ").trim().slice(0, max);
}
function lineAt(content: string, idx: number): string {
  const lineStart = content.lastIndexOf("\n", idx) + 1;
  let lineEnd = content.indexOf("\n", idx);
  if (lineEnd === -1) lineEnd = content.length;
  return content.slice(lineStart, lineEnd);
}
function isCommentLine(content: string, idx: number): boolean {
  return lineAt(content, idx).trim().startsWith("//"); // commento editoriale (es. questo stesso header), non testo pubblicato
}
// "steps" da solo e' un falso positivo comune in "next steps"/"following
// steps" (procedura, non il dato passi) — escluso prima del test.
function hasStepsContext(window: string): boolean {
  const cleaned = window.replace(/\b(next|following|these|initial|remaining)\s+steps\b/gi, "");
  return /\bpassi\b|\bpasso\b|\bsteps?\b/i.test(cleaned);
}
const HR_WORDS_RE = /frequenza cardiaca|battito|heart rate|\bbpm\b|Herzfrequenz|fréquence cardiaque|frecuencia cardíaca/i;

// ── Check 1 — "il valore/totale piu' alto vince" applicato ai passi ──────
const ALTO_HIGHEST_RE = /pi[uù]['’]?\s*alt[oi]|highest/gi;
const WIN_VERB_NEAR_RE = /\b(vince|vincono|prende|preso|sceglie|scelto|usa|usato|wins?|picks?|chooses?|takes?)\b/i;
const WITH_HIGHEST_RE = /\b(col|con il|with the)\s+(valore|numero|dato|totale|value|number|total)\s+pi[uù]['’]?\s*alt[oi]|with\s+the\s+highest\s+(value|number|total)/gi;

function checkStepsHighestValueWinsFraming() {
  for (const file of CONTENT_FILES) {
    const content = readFileSync(file, "utf8");
    let m: RegExpExecArray | null;

    // 1a. Costruzione esplicita "quella col/con il X piu' alto" / "with the highest X".
    const withRe = new RegExp(WITH_HIGHEST_RE.source, "gi");
    while ((m = withRe.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const win = windowAround(content, m.index, m[0].length, 250);
      if (!hasStepsContext(win)) continue;
      errors.push(
        `${file}: framing "valore/totale piu' alto vince" sui passi ("${m[0].trim()}") — contesto: "...${trimSnippet(win)}..."`,
      );
    }

    // 1b. Verbo di "vittoria" (vince/prende/sceglie/usa/wins/picks/...) che
    // GOVERNA "piu' alto"/"highest" — per costruzione il verbo di un framing
    // "X vince/prende il valore piu' alto" precede sempre "piu' alto", mai
    // il contrario: si guarda SOLO nei 60 caratteri PRIMA del match (mai
    // dopo), altrimenti un secondo verbo in una clausola successiva e
    // semanticamente slegata (es. "...non prende il numero piu' alto:
    // SCEGLIE la fonte piu' coerente" - "sceglie" qui descrive cosa fa
    // davvero FitMesh, non e' un secondo framing di vittoria) farebbe
    // scattare un falso positivo. Fra i verbi trovati nella finestra PRIMA
    // del match si prende quello piu' vicino ad "alto"/"highest" (ultimo
    // nell'ordine di lettura) e si controlla la negazione solo su quello.
    // NEGAZIONE: "non/not/doesn't/does not/never/mai" entro 20 caratteri
    // prima del verbo = frase CORRETTA che spiega cosa FitMesh NON fa, non
    // deve scattare. Senza questi due controlli il guardrail avrebbe
    // rifiutato esattamente la formulazione corretta usata nelle correzioni
    // P1.9-10 (bug trovato e fissato in questa stessa sessione).
    const NEGATION_BEFORE_VERB_RE = /\b(non|not|doesn'?t|does\s+not|never|mai)\b/i;
    const altoRe = new RegExp(ALTO_HIGHEST_RE.source, "gi");
    while ((m = altoRe.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const preWin = content.slice(Math.max(0, m.index - 60), m.index);
      const verbRe = new RegExp(WIN_VERB_NEAR_RE.source, "gi");
      let vm: RegExpExecArray | null;
      let lastVerbIdx = -1;
      while ((vm = verbRe.exec(preWin))) lastVerbIdx = vm.index; // l'ultimo trovato e' il piu' vicino ad "alto"
      if (lastVerbIdx === -1) continue; // nessun verbo di vittoria PRIMA di "alto" — descrittivo, non framing
      const preVerb = preWin.slice(Math.max(0, lastVerbIdx - 20), lastVerbIdx);
      if (NEGATION_BEFORE_VERB_RE.test(preVerb)) continue; // "non prende/sceglie/usa...piu' alto" = corretto
      const nearWin = windowAround(content, m.index, m[0].length, 60);
      if (HR_WORDS_RE.test(nearWin) && !hasStepsContext(nearWin)) continue; // frequenza cardiaca puo' legittimamente avere un "vince"/"piu' alto" suo
      const bigWin = windowAround(content, m.index, m[0].length, 250);
      if (!hasStepsContext(bigWin)) continue;
      errors.push(
        `${file}: framing "vince/prende/usa il valore piu' alto" sui passi (vicino a "${m[0]}") — contesto: "...${trimSnippet(bigWin)}..."`,
      );
    }
  }
}

// ── Check 2 — dedup PER ORA/PER INTERVALLO applicata ai passi cumulativi ──
// NOTA falsi positivi: "per ora" da solo e' l'idioma italiano "per ora" =
// "for now" (frequentissimo, nulla a che fare con le ore) — MAI usato come
// marcatore da solo. Si richiede "quell'ora"/"quella ora"/"ogni ora"/
// "quell'intervallo"/"per intervallo" (markers specifici), un verbo/parola
// di arbitraggio nelle vicinanze, e contesto passi — cosi' "il grafico
// indica il dispositivo che ha misurato ogni ora" (descrizione del DISPLAY,
// non del meccanismo di dedup) non scatta: non contiene nessuna parola di
// arbitraggio (vince/prende/sceglie/usa/dedup/doppioni/non la somma).
const HOUR_INTERVAL_MARKER_RE =
  /quell['’]?\s*or[ae]|quella\s+or[ae]|ogni\s+or[ae]|for\s+that\s+hour|each\s+hour|quell['’]?\s*intervall\w*|quello\s+intervall\w*|for\s+that\s+interval|per\s+intervallo/gi;
const ARBITRATION_GATE_RE = /vince|prende|preso|sceglie|scelto|\busa\b|usato|non la somma|not the sum|dedup|doppion|highest|pi[uù]['’]?\s*alt[oi]/i;

function checkNoHourlyDedupFramingForSteps() {
  for (const file of CONTENT_FILES) {
    const content = readFileSync(file, "utf8");
    const re = new RegExp(HOUR_INTERVAL_MARKER_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const win = windowAround(content, m.index, m[0].length, 150);
      if (!ARBITRATION_GATE_RE.test(win)) continue; // solo un riferimento temporale, non un claim di arbitraggio
      if (HR_WORDS_RE.test(win) && !hasStepsContext(win)) continue; // per-ora legittimo sulla frequenza cardiaca
      if (!hasStepsContext(win)) continue;
      errors.push(
        `${file}: deduplicazione per-ora/per-intervallo applicata ai passi cumulativi ("${m[0].trim()}") — i passi giornalieri si arbitrano per GIORNO, non per ora (la frequenza cardiaca puo' esserlo, i passi no). Contesto: "...${trimSnippet(win)}..."`,
      );
    }
  }
}

// ── Check 3 — "mai contato due volte" come assoluto senza qualificazione ─
const NEVER_TWICE_RE =
  /mai\s+contat\w*\s+due\s+volte|non\s+(vengono\s+|viene\s+)?contat\w*\s+due\s+volte|never\s+counted\s+twice|not\s+counted\s+twice|nunca\s+(se\s+)?cuenta[n]?\s+dos\s+veces|nunca\s+contad[oa]\s+dos\s+veces/gi;
const ABSOLUTE_QUALIFIER_RE =
  /quasi sempre|nella maggior parte dei casi|nella maggioranza dei casi|nei casi limite|caso limite|edge case|almost always|in most cases|in some edge cases|in rare cases|casi rari|salvo (rari|alcuni) casi|except in (rare|edge) cases/i;

function checkNeverCountedTwiceUnqualified() {
  for (const file of CONTENT_FILES) {
    const content = readFileSync(file, "utf8");
    const re = new RegExp(NEVER_TWICE_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const win = windowAround(content, m.index, m[0].length, 150);
      if (ABSOLUTE_QUALIFIER_RE.test(win)) continue;
      errors.push(
        `${file}: "${m[0].trim()}" — claim assoluto ("mai"/"never"/"non") senza qualificazione vicina (es. "quasi sempre", "nella maggior parte dei casi", "edge case") entro ~150 caratteri. Contesto: "...${trimSnippet(win)}..."`,
      );
    }
  }
}

// ── Check 4 — linea tratteggiata del grafico passi descritta come obiettivo
const DASHED_LINE_RE = /tratteggiat\w*|dashed\s+line/gi;
const GOAL_WORD_RE = /\bobiettivo\b|\bgoal\b/i;
const GOAL_NEGATION_RE = /\b(non|not|isn't|is not)\b|non\s*[eè]/i;

function checkDashedLineNotGoal() {
  for (const file of CONTENT_FILES) {
    const content = readFileSync(file, "utf8");
    const re = new RegExp(DASHED_LINE_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const win = windowAround(content, m.index, m[0].length, 150);
      if (!hasStepsContext(win)) continue;
      const goalMatch = GOAL_WORD_RE.exec(win);
      if (!goalMatch) continue;
      const negWin = win.slice(Math.max(0, goalMatch.index - 30), goalMatch.index + goalMatch[0].length + 15);
      if (GOAL_NEGATION_RE.test(negWin)) continue; // "non e' un obiettivo" = corretto (e' la media personale)
      errors.push(
        `${file}: la linea tratteggiata del grafico passi e' descritta come "obiettivo"/"goal" invece che media personale. Contesto: "...${trimSnippet(win)}..."`,
      );
    }
  }
}

// ── Check 5 — grafico orario passi descritto come sempre disponibile ─────
const HOURLY_STEPS_CHART_RE = /grafico\s+(dei\s+passi\s+)?orari\w*|grafico\s+orario\s+(dei\s+)?passi|hourly\s+(steps?\s+)?chart/gi;
const ALWAYS_SHOWN_RE = /sempre\s+(disponibile|visibile|mostrat[oa])|always\s+(available|visible|shown)/i;
const HIDE_MENTION_RE = /nascond\w*|nascost\w*|hidden|\bhide\b|pu[oò].?\s*non\s*(essere|comparire|apparire)|may\s+not\s+(appear|be\s+shown)|potrebbe\s+non/i;

function checkHourlyChartAlwaysAvailable() {
  for (const file of CONTENT_FILES) {
    const content = readFileSync(file, "utf8");
    const re = new RegExp(HOURLY_STEPS_CHART_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const win200 = windowAround(content, m.index, m[0].length, 200);
      if (!ALWAYS_SHOWN_RE.test(win200)) continue;
      const win350 = windowAround(content, m.index, m[0].length, 350);
      if (HIDE_MENTION_RE.test(win350)) continue; // gia' documenta che puo' non comparire
      errors.push(
        `${file}: grafico orario passi descritto come sempre disponibile/mostrato senza menzionare che puo' essere nascosto. Contesto: "...${trimSnippet(win200)}..."`,
      );
    }
  }
}

// ── Check 6 — soglia "80%" vicino al grafico passi (rimossa dal codice) ──
const EIGHTY_PERCENT_RE = /80\s?%/g;

function checkNoEightyPercentThresholdOnStepsChart() {
  for (const file of CONTENT_FILES) {
    const content = readFileSync(file, "utf8");
    const re = new RegExp(EIGHTY_PERCENT_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const win = windowAround(content, m.index, m[0].length, 200);
      if (!/grafico|chart/i.test(win)) continue; // "80%" non legato a nessun grafico (es. accuratezza sonno) — fuori scope
      if (!hasStepsContext(win)) continue;
      errors.push(
        `${file}: soglia "80%" citata vicino a "grafico"/"chart" + passi/steps — rimossa dal codice (commit 56ec3d77), non deve tornare nei contenuti. Contesto: "...${trimSnippet(win)}..."`,
      );
    }
  }
}

// ── Check 7 — "linea del massimo"/"linea del minimo" sul grafico passi ───
const MAX_MIN_LINE_RE = /linea\s+del\s+massimo|linea\s+del\s+minimo|maximum\s+line|minimum\s+line|\bmax\s+line\b|\bmin\s+line\b/gi;

function checkNoMaxMinLineOnStepsChart() {
  for (const file of CONTENT_FILES) {
    const content = readFileSync(file, "utf8");
    const re = new RegExp(MAX_MIN_LINE_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const win = windowAround(content, m.index, m[0].length, 200);
      if (!hasStepsContext(win)) continue;
      errors.push(
        `${file}: "${m[0]}" (linea del massimo/minimo) sul grafico passi — rimosse dal codice, resta solo la media personale. Contesto: "...${trimSnippet(win)}..."`,
      );
    }
  }
}

// ── Check 8 — somma indiscriminata di tutte le fonti per i passi ─────────
const SUM_ALL_SOURCES_RE = /somma\s+tutte\s+le\s+fonti|somma\s+di\s+tutte\s+le\s+fonti|adds?\s+up\s+all\s+sources|sums?\s+all\s+sources|summing\s+all\s+sources/gi;
const SUM_NEGATION_RE = /\b(non|not|never|mai|doesn'?t|does\s+not)\b/i;

function checkNoSumAllSourcesForSteps() {
  for (const file of CONTENT_FILES) {
    const content = readFileSync(file, "utf8");
    const re = new RegExp(SUM_ALL_SOURCES_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (isCommentLine(content, m.index)) continue;
      const preWin = content.slice(Math.max(0, m.index - 30), m.index);
      if (SUM_NEGATION_RE.test(preWin)) continue; // "FitMesh NON somma tutte le fonti" = corretto (e' la verita')
      const win = windowAround(content, m.index, m[0].length, 200);
      if (!hasStepsContext(win)) continue;
      errors.push(
        `${file}: "${m[0]}" — implica somma indiscriminata di tutte le fonti per i passi, FitMesh non lo fa mai (sceglie una sorgente, non somma). Contesto: "...${trimSnippet(win)}..."`,
      );
    }
  }
}

function runAllChecks() {
  checkStepsHighestValueWinsFraming();
  checkNoHourlyDedupFramingForSteps();
  checkNeverCountedTwiceUnqualified();
  checkDashedLineNotGoal();
  checkHourlyChartAlwaysAvailable();
  checkNoEightyPercentThresholdOnStepsChart();
  checkNoMaxMinLineOnStepsChart();
  checkNoSumAllSourcesForSteps();
}

// ── Negative test reali, restore byte-identico ────────────────────────────
// Mutano temporaneamente un file REALE gia' tracciato (stesso approccio di
// check-p016-structured-data.ts), verificano che il check corrispondente
// rilevi la mutazione, poi ripristinano il contenuto ORIGINALE byte per
// byte e verificano il ripristino con un secondo readFileSync (equivalente
// a un "git diff" vuoto sul file, dato che scriviamo esattamente i byte
// letti in partenza).
async function runNegativeTests() {
  const { writeFileSync: wf, readFileSync: rf } = await import("node:fs");

  // Negativo pattern 1 — "vince il valore piu' alto" iniettato in un
  // paragrafo sui passi deve essere rilevato dal check 1b (verbo di
  // vittoria + "piu' alto" entro 60 caratteri, contesto passi in finestra).
  const fileA = "lib/content/fitness-data-sync-copy.ts";
  const originalA = rf(fileA, "utf8");
  const anchorA =
    "sceglie la fonte più completa o accurata e riempie i buchi dalle altre, invece di contare due volte.";
  const injectedA = anchorA + " In caso di sovrapposizione sui passi, vince il valore più alto.";
  const mutatedA = originalA.replace(anchorA, injectedA);
  if (mutatedA === originalA) throw new Error("negative test 1: la sostituzione non ha trovato nulla da mutare — ancora cambiata?");
  wf(fileA, mutatedA);
  errors.length = 0;
  checkStepsHighestValueWinsFraming();
  const caught1 = errors.some((e) => e.includes(fileA));
  wf(fileA, originalA);
  const restored1 = rf(fileA, "utf8") === originalA;
  if (!caught1) throw new Error("negative test 1 FALLITO: \"vince il valore piu' alto\" iniettato sui passi ma non rilevato");
  if (!restored1) throw new Error("negative test 1: restore non byte-identico!");
  errors.length = 0;
  console.log(
    "  ok     negative test 1 (pattern 1, \"vince il valore piu' alto\" sui passi, " + fileA + "): rilevato, ripristinato byte-identico",
  );

  // Controllo anti falso-positivo (trovato DAVVERO durante P1.9-10, non
  // ipotetico): una frase CORRETTA che nega esplicitamente "il valore piu'
  // alto" ("non prende semplicemente il numero piu' alto: sceglie la fonte
  // piu' coerente") NON deve far scattare il check 1b. Prima del fix alla
  // negazione, questa esatta formulazione (usata nelle 4 correzioni P1.9-10)
  // veniva erroneamente segnalata come violazione.
  const fileA2 = "lib/content/fitness-data-sync-copy.ts";
  const originalA2 = rf(fileA2, "utf8");
  const anchorA2 =
    "sceglie la fonte più completa o accurata e riempie i buchi dalle altre, invece di contare due volte.";
  const injectedA2 =
    anchorA2 + " Per i passi non prende semplicemente il numero più alto: sceglie la fonte più coerente.";
  const mutatedA2 = originalA2.replace(anchorA2, injectedA2);
  if (mutatedA2 === originalA2) throw new Error("controllo anti falso-positivo: la sostituzione non ha trovato nulla da mutare — ancora cambiata?");
  wf(fileA2, mutatedA2);
  errors.length = 0;
  checkStepsHighestValueWinsFraming();
  const falsePositive = errors.some((e) => e.includes(fileA2));
  wf(fileA2, originalA2);
  const restoredA2 = rf(fileA2, "utf8") === originalA2;
  if (falsePositive) throw new Error("controllo anti falso-positivo FALLITO: una frase corretta e negata (\"non prende...il numero piu' alto: sceglie...\") e' stata segnalata come violazione");
  if (!restoredA2) throw new Error("controllo anti falso-positivo: restore non byte-identico!");
  errors.length = 0;
  console.log(
    "  ok     controllo anti falso-positivo (frase negata corretta \"non prende...piu' alto: sceglie...\", " + fileA2 + "): NON segnalata, ripristinato byte-identico",
  );

  // Negativo pattern 2 — dedup "per quell'ora" applicata ai passi.
  const fileB = "lib/blog/posts/piu-smartwatch-insieme-dati-doppi.ts";
  const originalB = rf(fileB, "utf8");
  const anchorB = "I passi possono essere deduplicati nel totale di Attività tramite Aggregate API e priorità.";
  const injectedB = anchorB + " Per quell'ora vince il dato più alto.";
  const mutatedB = originalB.replace(anchorB, injectedB);
  if (mutatedB === originalB) throw new Error("negative test 2: la sostituzione non ha trovato nulla da mutare — ancora cambiata?");
  wf(fileB, mutatedB);
  errors.length = 0;
  checkNoHourlyDedupFramingForSteps();
  const caught2 = errors.some((e) => e.includes(fileB));
  wf(fileB, originalB);
  const restored2 = rf(fileB, "utf8") === originalB;
  if (!caught2) throw new Error("negative test 2 FALLITO: framing dedup \"per quell'ora\" sui passi iniettato ma non rilevato");
  if (!restored2) throw new Error("negative test 2: restore non byte-identico!");
  errors.length = 0;
  console.log(
    "  ok     negative test 2 (pattern 2, dedup per-ora applicata ai passi, " + fileB + "): rilevato, ripristinato byte-identico",
  );

  // Negativo pattern 3 — "mai contato due volte" senza qualificazione vicina.
  const fileC = "lib/content/about-copy.ts";
  const originalC = rf(fileC, "utf8");
  const anchorC = "in un'unica dashboard. Compliance GDPR";
  const injectedC = "in un'unica dashboard. Il passo non viene mai contato due volte. Compliance GDPR";
  const mutatedC = originalC.replace(anchorC, injectedC);
  if (mutatedC === originalC) throw new Error("negative test 3: la sostituzione non ha trovato nulla da mutare — ancora cambiata?");
  wf(fileC, mutatedC);
  errors.length = 0;
  checkNeverCountedTwiceUnqualified();
  const caught3 = errors.some((e) => e.includes(fileC));
  wf(fileC, originalC);
  const restored3 = rf(fileC, "utf8") === originalC;
  if (!caught3) throw new Error("negative test 3 FALLITO: \"mai contato due volte\" senza qualificazione iniettato ma non rilevato");
  if (!restored3) throw new Error("negative test 3: restore non byte-identico!");
  errors.length = 0;
  console.log(
    "  ok     negative test 3 (pattern 3, \"mai contato due volte\" senza qualificazione, " + fileC + "): rilevato, ripristinato byte-identico",
  );
}

async function main() {
  if (process.argv.includes("--self-test")) {
    // Modalita' di auto-verifica: esegue SOLO i negative test (mutate ->
    // detect -> restore byte-identico), indipendentemente dallo stato
    // attuale dei contenuti reali. Serve perche' nel flusso normale i
    // negative test girano solo se i check reali sono gia' verdi (stesso
    // ordine di check-p016-structured-data.ts) — durante un run parallelo
    // con altri agenti il repo puo' avere violazioni reali in sospeso che
    // altrimenti bloccherebbero l'esecuzione PRIMA dei negative test.
    await runNegativeTests();
    console.log("✅ Self-test guardrail passi: tutti i negative test hanno rilevato la mutazione e ripristinato byte-identico.");
    return;
  }

  runAllChecks();

  if (errors.length > 0) {
    console.error(`❌ Guardrail meccanismo passi: ${errors.length} problema/i`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  await runNegativeTests();

  console.log(
    "✅ Guardrail meccanismo passi: nessun framing 'valore/totale piu' alto vince' sui passi, nessuna dedup per-ora/per-intervallo " +
      "sui passi cumulativi, nessun 'mai contato due volte' senza qualificazione, nessuna linea tratteggiata spacciata per obiettivo, " +
      "nessun grafico orario passi descritto come sempre disponibile, nessuna soglia 80% sul grafico passi, nessuna linea del " +
      "massimo/minimo, nessuna somma indiscriminata di tutte le fonti per i passi.",
  );
}

main().catch((err) => {
  console.error("❌ Guardrail meccanismo passi: errore inatteso", err);
  process.exit(1);
});
