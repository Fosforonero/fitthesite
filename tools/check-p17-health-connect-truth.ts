/**
 * Guardrail P0 hotfix — `lib/blog/posts/health-connect-not-syncing.ts`.
 *
 * Scritto per l'ADDENDUM PRIORITÀ P0 truth-fix (2026-08-05). Blocca la
 * regressione delle bugie/imprecisioni corrette in questo hotfix, non solo
 * lo stato presente. Legge il file come testo grezzo (stesso approccio di
 * `check-galaxy-watch-article-claims.ts`) cosi' non dipende da altri branch
 * (questo hotfix e' isolato da origin/main, senza dipendenze da PR aperte).
 *
 * Fallisce (exit 1) se il file contiene:
 *  1. Il recupero storico descritto come automatico SENZA negazione vicina
 *     ("automatico"/"automatically" non preceduto da NON/not/nicht/pas/no
 *     nella stessa frase) — la verita' verificata (fonte S1) e' che NON lo
 *     e' senza il permesso di lettura storica esteso.
 *  2. "Samsung Health" abbinato a "tempo reale"/"real-time"/"Echtzeit"/
 *     "temps réel"/"tiempo real" nello stesso paragrafo — il testo corretto
 *     non ha mai bisogno di questa formulazione (fonte S2: la scrittura
 *     Samsung Health→Health Connect e' di norma rapida ma senza SLA
 *     garantita, non va mai descritta come "real-time").
 *  3. "Fitbit" citato come app corrente senza "Google Health" nelle vicinanze
 *     (±2 righe) — dal 19/05/2026 l'app e' Google Health (fonte S3).
 *  4. Una frase assoluta bandita esplicitamente dall'addendum: "causa numero
 *     uno"/"number one cause", "cinque minuti"/"five minutes" come tempo di
 *     fix garantito, "di gran lunga"/"by far" abbinato a "causa", "risolve
 *     la maggioranza dei casi"/"resolves the majority of cases".
 *  5. Un'istruzione azionabile che dice all'utente di concedere/abilitare il
 *     permesso di lettura storica DENTRO FitMesh — l'AndroidManifest reale
 *     (letto in sola lettura) non lo dichiara: sarebbe azionabile-ma-falso.
 *  6. Una percentuale numerica (\d+%) non presente in nessuna fonte S1-S4 —
 *     il file oggi non ne usa nessuna: qualunque comparsa e' un numero non
 *     documentato per definizione di questo guardrail.
 *  7. Un URL in `sources` non presente come stringa letterale da nessuna
 *     parte nel corpo del file (fonte citata ma non visibile al lettore).
 *  8. Un artefatto di corruzione testuale noto (KVKK al posto di "Health
 *     Connect", `__FENCE`, o la sequenza `},'` tipica delle corruzioni gia'
 *     trovate in TR/PL).
 *  9. (MICRO-ADDENDUM 2026-08-06) "Samsung Health" + "collo di bottiglia"/
 *     "bottleneck"/"cuello de botella"/"Flaschenhals"/"knelpunt" presentato
 *     come causa UNICA della latenza — Samsung documenta 3 trigger diversi
 *     (riconnessione, apertura app, pull-to-refresh: fonti S5/S6), quindi la
 *     riga deve citare almeno 2 di questi 3 concetti (radice "riconnett"
 *     o equivalente per lingua; apertura dell'app; pull-to-refresh) per
 *     non tornare a una formulazione a causa singola.
 * 10. (MICRO-ADDENDUM 2026-08-06) Stesso controllo del punto 9, applicato al
 *     testo sv/da di `lib/blog/nordic-overlay.json` per questo post — sv/da
 *     sono locale LIVE (`isPostTranslated===true`) tramite l'overlay, non
 *     tramite questo file: un residuo di formulazione a causa singola li'
 *     sarebbe invisibile a questo guardrail se limitato al solo file .ts
 *     (bug reale trovato durante la verifica pre-merge: flaskhalsen/
 *     flaskehalsen SV/DA avevano ancora la vecchia formulazione mentre la
 *     .ts era gia' corretta).
 * 11. (ULTIMO CHECK 2026-08-06) "30 giorni"/"30 days"/equivalenti SENZA un
 *     ancoraggio esplicito alla PRIMA concessione del permesso, nella stessa
 *     riga del file .ts — Health Connect senza READ_HEALTH_DATA_HISTORY non
 *     applica una finestra mobile "ultimi 30 giorni da oggi", ma impedisce
 *     la lettura di dati anteriori ai 30 giorni precedenti la prima
 *     concessione del permesso (bug reale trovato dall'ULTIMO CHECK pre-GO:
 *     TL;DR e "In sintesi" lo dicevano senza ancoraggio, mentre la FAQ era
 *     gia' corretta fin dall'hotfix iniziale).
 * 12. Stesso controllo del punto 11, applicato a `lib/blog/nordic-overlay.json`
 *     per sv/da (stesso motivo del punto 10: locale live tramite overlay,
 *     invisibile a un controllo limitato al solo file .ts).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p17-health-connect-truth.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const TARGET = "lib/blog/posts/health-connect-not-syncing.ts";
const full = path.join(repoRoot, TARGET);
const errors: string[] = [];

if (!fs.existsSync(full)) {
  console.error(`❌ File atteso non trovato: ${TARGET}`);
  process.exit(1);
}

const content = fs.readFileSync(full, "utf8");
const lines = content.split("\n");

// ── 1. Backfill "automatico" senza negazione vicina ──────────────────────
// Scoperto SOLO nel contesto storico/backfill (non deve bannare "retry
// automatico" della resilienza di FitMesh, che e' un claim diverso e vero).
const AUTOMATIC_WORD = /(automatico|automatically|automatisch|automatique|automático|automatisk)/i;
const NEGATION_WORD = /\b(non|not|isn't|doesn't|nicht|pas|no|niet|não|nie)\b/i;
const HISTORY_CONTEXT_WORD = /(storic|recover|recuper|backfill|cronologia|history|30 giorni|30 days|30 dias|30 días|30 Tage)/i;
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed.startsWith("//")) continue; // commento editoriale, non testo pubblicato
  const line = lines[i];
  if (!HISTORY_CONTEXT_WORD.test(line)) continue; // fuori contesto backfill, non pertinente
  let m: RegExpExecArray | null;
  const re = new RegExp(AUTOMATIC_WORD.source, "gi");
  while ((m = re.exec(line))) {
    const windowStart = Math.max(0, m.index - 40);
    const window = line.slice(windowStart, m.index + m[0].length + 5);
    if (!NEGATION_WORD.test(window)) {
      errors.push(
        `[backfill-automatico-senza-negazione] riga ${i + 1}: "${window.trim()}" — "automatico" senza negazione nella finestra circostante (contesto storico/backfill).`,
      );
    }
  }
}

// ── 2. Samsung Health + "real-time" nello stesso paragrafo ───────────────
const REALTIME_WORD = /(tempo reale|real-time|realtime|Echtzeit|temps réel|tiempo real)/i;
for (let i = 0; i < lines.length; i++) {
  if (/Samsung Health/i.test(lines[i]) && REALTIME_WORD.test(lines[i])) {
    errors.push(`[samsung-health-realtime-assoluto] riga ${i + 1}: "Samsung Health" e un termine "real-time" nella stessa riga.`);
  }
}

// ── 3. "Fitbit" senza "Google Health" nelle vicinanze ─────────────────────
for (let i = 0; i < lines.length; i++) {
  if (!/Fitbit/.test(lines[i])) continue;
  if (lines[i].trim().startsWith("//")) continue; // commento editoriale, non testo pubblicato
  if (/brandsMentioned/.test(lines[i])) continue; // elenco struttrale, non testo per l'utente
  const windowLines = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
  if (!/Google Health/.test(windowLines)) {
    errors.push(`[fitbit-senza-google-health] riga ${i + 1}: "Fitbit" citato senza "Google Health" nelle 2 righe circostanti.`);
  }
}

// ── 4. Frasi assolute bandite esplicitamente ──────────────────────────────
const BANNED_ABSOLUTES: Array<{ re: RegExp; label: string }> = [
  { re: /causa numero uno/i, label: "causa-numero-uno" },
  { re: /number one cause/i, label: "number-one-cause" },
  { re: /cinque minuti/i, label: "cinque-minuti" },
  { re: /\bfive minutes\b/i, label: "five-minutes" },
  { re: /di gran lunga,?\s*(è|e')\s*l'ottimizzazione/i, label: "di-gran-lunga-causa" },
  { re: /by far the most common cause/i, label: "by-far-most-common-cause" },
  { re: /risolve la maggioranza dei casi/i, label: "risolve-maggioranza-casi" },
  { re: /resolves the majority of cases/i, label: "resolves-majority-cases" },
];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith("//")) continue; // commento editoriale che documenta lo storico del fix
  for (const { re, label } of BANNED_ABSOLUTES) {
    if (re.test(lines[i])) {
      errors.push(`[assoluto-bandito:${label}] riga ${i + 1}: "${lines[i].trim().slice(0, 120)}"`);
    }
  }
}

// ── 5. Istruzione azionabile "concedi il permesso di lettura storica" ────
const GRANT_VERB = /\b(concedi|grant|abilita|enable|activa|aktiviere|attiva)\b/i;
const HISTORY_PERMISSION = /(permesso di lettura storica|history-read permission|READ_HEALTH_DATA_HISTORY|lettura storica)/i;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (GRANT_VERB.test(line) && HISTORY_PERMISSION.test(line)) {
    // Non e' un'istruzione azionabile se la riga descrive il limite in
    // negativo ("without/senza the extended grant...") o chiarisce
    // esplicitamente che FitMesh non lo richiede — solo allora e' un fatto
    // spiegato, non uno step da eseguire dentro l'app.
    const isFactualNegative = /\bwithout\b|\bsenza\b|\bohne\b|\bsans\b|\bsin\b/i.test(line);
    const isClarified = /non richiede|doesn't request|does not request|non lo richiede|não solicita|ne demande pas|no solicita|fordert.*nicht an/i.test(line);
    if (!isFactualNegative && !isClarified) {
      errors.push(`[permesso-storico-azionabile-falso] riga ${i + 1}: istruzione a concedere il permesso di lettura storica senza chiarire che FitMesh non lo richiede.`);
    }
  }
}

// ── 6. Percentuali numeriche non documentate ──────────────────────────────
// Esclude i commenti editoriali (es. note CTR/GSC su <title>/meta, che sono
// percentuali reali di Search Console, non claim rivolti al lettore).
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith("//")) continue;
  if (/\d+\s?%/.test(lines[i])) {
    errors.push(`[percentuale-non-documentata] riga ${i + 1}: contiene una percentuale numerica non prevista da nessuna fonte S1-S4.`);
  }
}

// ── 7. URL in `sources` non presenti come stringa letterale nel corpo ────
const sourcesMatch = content.match(/sources:\s*\[([\s\S]*?)\]/);
if (sourcesMatch) {
  const urls = Array.from(sourcesMatch[1].matchAll(/"(https?:\/\/[^"]+)"/g)).map((m) => m[1]);
  if (urls.length === 0) {
    errors.push(`[sources-vuoto] l'array "sources" esiste ma non contiene URL.`);
  }
  for (const url of urls) {
    const occurrences = content.split(url).length - 1;
    // 1 sola occorrenza = solo nell'array sources, mai citata nel corpo visibile.
    if (occurrences < 2) {
      errors.push(`[fonte-non-visibile] "${url}" e' in "sources" ma non compare come citazione nel corpo del testo.`);
    }
  }
} else {
  errors.push(`[sources-assente] il post non ha un array "sources": richiesto dalla FASE 2 dell'addendum (fonti visibili + JSON-LD).`);
}

// ── 8. Artefatti di corruzione testuale noti ──────────────────────────────
// Verifica riga-per-riga (non whole-file): l'esclusione del commento header
// che DOCUMENTA lo storico del bug non deve mascherare una NUOVA occorrenza
// altrove nel file (bug reale in una prima versione di questo check: un
// `!/sostituzioni errate/.test(content)` sull'intero file era sempre falso,
// perché quella frase compare comunque nel commento header — trovato dal
// negative test di questo stesso guardrail).
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed.startsWith("//")) continue; // commento editoriale che documenta lo storico
  if (/KVKK/.test(lines[i])) {
    errors.push(`[corruzione-kvkk] riga ${i + 1}: trovato "KVKK" al posto di "Health Connect".`);
  }
  if (/__FENCE/.test(lines[i])) {
    errors.push(`[corruzione-fence] riga ${i + 1}: artefatto template "__FENCE" non risolto.`);
  }
  if (/\},'/.test(lines[i])) {
    errors.push(`[corruzione-brace-quote] riga ${i + 1}: sequenza "}," ',' tipica delle corruzioni gia' viste in TR/PL.`);
  }
}

// ── 9/10. Samsung Health + "collo di bottiglia" come causa UNICA ─────────
// MICRO-ADDENDUM 2026-08-06: la latenza watch->telefono e' UNA possibile
// causa fra piu' trigger documentati da Samsung (S5/S6), non l'unica causa
// dimostrata. Richiede che il testo citi almeno 2 dei 3 trigger noti.
// Estratta in funzione riusabile: si applica sia al file .ts (riga per
// riga) sia alle stringhe sv/da di nordic-overlay.json (per-stringa) —
// sv/da sono locale live tramite l'overlay, un residuo li' sarebbe
// invisibile se il controllo restasse limitato al solo file .ts.
const BOTTLENECK_WORD = /(collo di bottiglia|bottleneck|cuello de botella|Flaschenhals|knelpunt|flaskhals|flaskehals)/i;
const RECONNECT_WORD = /(riconnett|reconnect|reconecta|verbindet|opnieuw verbind|återanslut|genopret.{0,3}forbind)/i;
const OPEN_APP_WORD = /(apr[ai].{0,3}(l'app|app)|open.{0,3}the app|open.{0,3}samsung health app|abre.{0,3}la app|öffnest|app te openen|opens? samsung health|öppnar.{0,3}(app|samsung health)|åbner.{0,3}(app|samsung health)|åbne.{0,3}(app|samsung health))/i;
const PULL_REFRESH_WORD = /pull-to-refresh/i;

function countSamsungTriggers(text) {
  return [RECONNECT_WORD, OPEN_APP_WORD, PULL_REFRESH_WORD].filter((re) => re.test(text)).length;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (!/Samsung Health/i.test(line) || !BOTTLENECK_WORD.test(line)) continue;
  const triggerCount = countSamsungTriggers(line);
  if (triggerCount < 2) {
    errors.push(`[samsung-causa-unica] riga ${i + 1}: "collo di bottiglia"/"bottleneck" con Samsung Health ma solo ${triggerCount}/3 trigger documentati citati (riconnessione/apertura app/pull-to-refresh) — rischio di tornare a una causa unica non dimostrata.`);
  }
}

// ── 11. "30 giorni"/equivalenti senza ancoraggio alla PRIMA concessione ──
// ULTIMO CHECK 2026-08-06: senza READ_HEALTH_DATA_HISTORY, Health Connect
// non applica una finestra mobile "ultimi 30 giorni da oggi" — impedisce la
// lettura di dati anteriori ai 30 giorni precedenti la PRIMA concessione del
// permesso. Bug reale trovato: TL;DR e "In sintesi" lo dicevano senza
// ancoraggio (leggibile come finestra mobile), mentre la FAQ era gia'
// corretta fin dall'hotfix iniziale.
const HISTORY_WINDOW_WORD = /(30 giorni|30 days|30 días|30 Tage|30 dagen|30 dagar|30 dage)/i;
const HISTORY_ANCHOR_WORD = /(prima concessione|da quando ha ricevuto l'accesso|first permission grant|granted access|primera concesión|se le concedió el acceso|ersten? Berechtigungserteilung|Zeitpunkt der Berechtigungserteilung|eerste toestemming|moment van toegang|första behörigheten|åtkomst beviljades|første tilladelse|adgangen blev givet)/i;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("//")) continue;
  if (!HISTORY_WINDOW_WORD.test(line)) continue;
  if (!HISTORY_ANCHOR_WORD.test(line)) {
    errors.push(`[finestra-storica-non-ancorata] riga ${i + 1}: menziona "30 giorni/days" senza ancorarli esplicitamente alla prima concessione del permesso (rischio di lettura come finestra mobile da oggi).`);
  }
}

// ── 10/12 (overlay). Estrae {lang -> [testo, indice-o-null]} da un valore
// overlay che puo' essere una stringa singola o un array di stringhe (es.
// "tldr"/"body.N.items" sono array per lingua) — check 10 in una prima
// versione iterava solo stringhe dirette e saltava silenziosamente i campi
// array (bug reale: e' esattamente li' che viveva il residuo "30 giorni"
// senza ancoraggio trovato dall'ULTIMO CHECK pre-GO).
function* overlayTextEntries(byLang) {
  for (const [lang, value] of Object.entries(byLang)) {
    if (typeof value === "string") {
      yield [lang, value, null];
    } else if (Array.isArray(value)) {
      // `yield` funziona solo nel corpo diretto del generatore, non dentro
      // una callback annidata come .forEach(): bug reale trovato al primo
      // avvio di questa funzione (esbuild: "yield is a reserved word").
      for (let idx = 0; idx < value.length; idx++) {
        if (typeof value[idx] === "string") yield [lang, value[idx], idx];
      }
    }
  }
}

const overlayPath = path.join(repoRoot, "lib/blog/nordic-overlay.json");
let overlayPostForChecks = null;
if (fs.existsSync(overlayPath)) {
  const overlay = JSON.parse(fs.readFileSync(overlayPath, "utf8"));
  overlayPostForChecks = overlay["health-connect-not-syncing"];
}
if (overlayPostForChecks) {
  for (const [fieldPath, byLang] of Object.entries(overlayPostForChecks)) {
    if (typeof byLang !== "object" || byLang === null) continue;
    for (const [lang, text, idx] of overlayTextEntries(byLang)) {
      const loc = idx === null ? `"${fieldPath}"."${lang}"` : `"${fieldPath}"."${lang}"[${idx}]`;
      // check 10
      if (/Samsung Health/i.test(text) && BOTTLENECK_WORD.test(text)) {
        const triggerCount = countSamsungTriggers(text);
        if (triggerCount < 2) {
          errors.push(`[samsung-causa-unica-overlay] nordic-overlay.json ${loc}: solo ${triggerCount}/3 trigger citati — rischio formulazione a causa singola nel testo live sv/da.`);
        }
      }
      // check 12
      if (HISTORY_WINDOW_WORD.test(text) && !HISTORY_ANCHOR_WORD.test(text)) {
        errors.push(`[finestra-storica-non-ancorata-overlay] nordic-overlay.json ${loc}: menziona "30 giorni/dagar/dage" senza ancorarli alla prima concessione del permesso.`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ P0 hotfix guardrail (health-connect-not-syncing truth-fix): ${errors.length} problemi.\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  "✅ P0 hotfix guardrail (health-connect-not-syncing truth-fix): nessuna regressione su backfill/real-time/Fitbit-obsoleto/permesso-storico-azionabile/assoluti-banditi/percentuali-non-documentate/fonti-non-visibili/corruzioni-testuali.",
);
