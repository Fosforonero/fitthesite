/**
 * Sprint P0.10G — guardrail "founder:static-invariant-check".
 *
 * Fallisce se un contenuto statico/prerenderizzato torna a decidere lo
 * stato del programma Founder (aperto/chiuso) usando la data di build,
 * invece di usare la regola di idoneità invariante (vera sia prima sia
 * dopo il cutoff) — vedi lib/founder/historical-note.ts.
 *
 * CONTESTO — bug trovato in audit P0.10G, confermato già live nel build
 * corrente al momento della correzione (2026-07-29, programma ancora
 * aperto): lib/llms-txt.ts, lib/founder/historical-note.ts e ~17 file fra
 * blog/landing importavano `isFounderProgramOpen()` o hardcodavano una
 * frase "il programma si è chiuso il 31 luglio 2026" risolta al momento
 * del build — su una route `force-static` o una pagina SSG, quella
 * decisione resta congelata fino al prossimo deploy scollegato dal
 * cutoff reale, producendo affermazioni false per ore o giorni.
 *
 * CONTROLLO 1 — struttura: `isFounderProgramOpen` (la funzione che decide
 * aperto/chiuso leggendo l'orologio) può essere importata SOLO da un
 * insieme ristretto di file "use client" o di supporto (vedi ALLOWLIST).
 * Qualunque altro file che la importa la sta valutando o al momento del
 * build (Server Component, route handler, lib/ puro) o comunque fuori da
 * un componente client con auto-transizione — sempre un problema.
 * `FOUNDER_END_AT`/`FOUNDER_END_AT_MS`/`formatFounderEndDate` NON sono
 * banditi: sono solo la data (informazione invariante), non una
 * decisione — citarli per mostrare "entro il 31 luglio 2026" è corretto
 * ovunque.
 *
 * CONTROLLO 2 — regressione testuale: nessuno dei pattern specifici
 * corretti in questo sprint ("programma chiuso dal 31 luglio 2026" e le
 * sue traduzioni in tutte le locale coinvolte) deve ricomparire nei file
 * di contenuto statico noti (blog, landing, press, llms.txt).
 *
 * CONTROLLO 3 — FounderClientGate resta "use client" (l'unico posto dove
 * la decisione runtime è corretta).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ── CONTROLLO 1 — chi può importare isFounderProgramOpen ────────────────
const ALLOWLIST_IMPORT_IS_OPEN = new Set([
  "lib/founder/program-window.ts",
  "lib/founder/program-window.test.ts",
  "components/founder/FounderClientGate.tsx",
  // Sprint P0.10H — gate a 3 stati dedicato a /beta (pending/open/closed),
  // stesso pattern di auto-transizione client-only di FounderClientGate,
  // vedi header del file per il perche' serve un terzo stato.
  "components/founder/BetaFounderGate.tsx",
]);

const SCAN_DIRS = ["app", "components", "lib"];
const IMPORT_PATTERN = /isFounderProgramOpen/;

function walk(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
}

const allFiles: string[] = [];
for (const d of SCAN_DIRS) {
  const full = path.join(repoRoot, d);
  if (fs.existsSync(full)) walk(full, allFiles);
}

for (const full of allFiles) {
  const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
  if (rel === "tools/check-founder-static-invariant.ts") continue; // questo file cita il pattern nei commenti
  const content = fs.readFileSync(full, "utf8");
  if (!IMPORT_PATTERN.test(content)) continue;
  // Distingue un import reale da una menzione in un commento: cerca la
  // forma import { ... isFounderProgramOpen ... } from "...program-window"
  const hasRealImport = /import\s*\{[^}]*isFounderProgramOpen[^}]*\}\s*from\s*["'][^"']*program-window["']/.test(content);
  if (!hasRealImport) continue; // solo un commento che la nomina, non un import
  if (!ALLOWLIST_IMPORT_IS_OPEN.has(rel)) {
    errors.push(
      `${rel}: importa isFounderProgramOpen() fuori dalla allowlist (${Array.from(ALLOWLIST_IMPORT_IS_OPEN).join(", ")}). Se questo file è un componente client con auto-transizione legittimo, aggiungilo alla allowlist qui sopra; altrimenti la decisione aperto/chiuso rischia di essere risolta al momento del build, non della visita.`,
    );
  }
}

// ── CONTROLLO 2 — regressione testuale sui pattern corretti in P0.10G ──
const STALE_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "it: programma chiuso dal 31 luglio 2026", re: /programma chiuso dal 31 luglio 2026/ },
  { label: "en: program closed as of July 31, 2026", re: /program closed as of July 31, 2026/ },
  { label: "es: programa cerrado desde el 31 de julio de 2026", re: /programa cerrado desde el 31 de julio de 2026/ },
  { label: "de: Programm seit dem 31. Juli 2026 geschlossen", re: /Programm seit dem 31\. Juli 2026 geschlossen/ },
  { label: "pt: programa encerrado desde 31 de julho de 2026", re: /programa encerrado desde 31 de julho de 2026/ },
  { label: "fr: programme clos depuis le 31 juillet 2026", re: /programme clos depuis le 31 juillet 2026/ },
  { label: "pl: program zamknięty od 31 lipca 2026", re: /program zamkni[eę]ty od 31 lipca 2026/ },
  { label: "tr: program ... itibarıyla kapandı", re: /itibar[ıi]yla kapand[ıi]/ },
  { label: "nl: programma gesloten sinds 31 juli 2026", re: /programma gesloten sinds 31 juli 2026/ },
  { label: "ja: 2026年7月31日に終了したプログラム", re: /に終了したプログラム/ },
  { label: "ko: 2026년 7월 31일에 종료된 프로그램", re: /에 종료된 프로그램/ },
  // Bucket A2 originale: grant "automatico alla registrazione" senza il
  // requisito di prima sync entro 14 giorni (Sprint P0.10A) — cfr.
  // perche-diventare-founder-fitmesh.ts.
  { label: "it: grant automatico alla sola registrazione (manca la sync entro 14gg)", re: /(Pro a vita|il beneficio founder) è automatico alla registrazione/i },
];

const CONTENT_FILES_TO_CHECK = [
  "lib/llms-txt.ts",
  "lib/founder/historical-note.ts",
];

function collectDir(rel: string): string[] {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    .map((f) => path.join(rel, f));
}

const filesToCheck = [
  ...CONTENT_FILES_TO_CHECK,
  "app/(frontend)/[locale]/(marketing)/press/page.tsx",
  ...collectDir("lib/blog/posts"),
  "lib/landing/data.ts",
];

for (const rel of filesToCheck) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) continue;
  const content = fs.readFileSync(full, "utf8");
  for (const { label, re } of STALE_PATTERNS) {
    if (re.test(content)) {
      errors.push(`${rel}: contiene di nuovo il pattern non invariante "${label}" — usa founderHistoricalClause()/founderEligibilityStatement() (lib/founder/historical-note.ts) invece di una frase aperto/chiuso hardcoded.`);
    }
  }
}

// ── CONTROLLO 3 — i gate client-only restano "use client" ────────────────
// Sprint P0.10H: stesso controllo anche su BetaFounderGate.tsx, il secondo
// (e finora unico altro) gate client-only per Founder.
const CLIENT_GATE_FILES = [
  "components/founder/FounderClientGate.tsx",
  "components/founder/BetaFounderGate.tsx",
];
for (const rel of CLIENT_GATE_FILES) {
  const gatePath = path.join(repoRoot, rel);
  if (!fs.existsSync(gatePath)) {
    errors.push(`${rel} non trovato — un gate client-only per Founder è sparito.`);
    continue;
  }
  const gateContent = fs.readFileSync(gatePath, "utf8");
  if (!/^["']use client["'];?/m.test(gateContent)) {
    errors.push(`${rel}: manca "use client" — la decisione aperto/chiuso rischia di essere valutata lato server/al build.`);
  }
}

if (errors.length > 0) {
  console.error("❌ founder:static-invariant-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    `✅ founder:static-invariant-check: isFounderProgramOpen() importata solo dall'allowlist (${allFiles.length} file TS/TSX scansionati), nessun pattern aperto/chiuso hardcoded ricomparso in llms.txt/historical-note/press/blog/landing, FounderClientGate e BetaFounderGate restano "use client".`,
  );
}
