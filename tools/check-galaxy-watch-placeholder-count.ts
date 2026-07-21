/**
 * Guardrail P1.3N-B — conteggio automatico dei placeholder "[TBD" nel post
 * Galaxy Watch, confrontato con il valore dichiarato nella replacement map.
 *
 * Perche' esiste: la replacement map e' un documento Markdown scritto a
 * mano; se il post cambia (nuove righe, nuove sezioni) il conteggio scritto
 * a mano nella map diventa stale senza che nessuno se ne accorga. Questo
 * script rende l'allineamento verificabile invece che affidato alla
 * memoria di chi scrive.
 *
 * Metodo di raggruppamento per categoria: state machine top-down basata su
 * marcatori di intestazione univoci gia' presenti nel post (testo esatto
 * degli heading). E' un'euristica, non un parser AST: se il testo di un
 * heading cambia, il marcatore va aggiornato qui sotto. Documentato
 * deliberatamente cosi' per restare leggibile senza una dipendenza da un
 * parser TypeScript completo.
 *
 * Split IT/EN: per ogni riga, si taglia la stringa al primo `en:` trovato;
 * le occorrenze "[TBD" prima del taglio sono attribuite a IT, quelle dopo
 * a EN. Euristica ragionevole per lo stile "un rigo per oggetto" di questo
 * file, non un parser esatto — sufficiente per un controllo di regressione
 * numerica, non per un audit legale del contenuto.
 *
 * Uso: npx tsx tools/check-galaxy-watch-placeholder-count.ts
 * Uscita 0 + stampa il conteggio se allineato al valore dichiarato nella
 * replacement map; uscita 1 se divergono o se il marcatore dichiarato manca.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const POST_FILE = path.join(repoRoot, "lib/blog/posts/galaxy-watch-ultra-2-health-connect.ts");
const MAP_FILE = path.join(repoRoot, "docs/seo/galaxy-watch/event-day-replacement-map.md");

const CATEGORY_MARKERS: Array<{ label: string; startsAt: string }> = [
  { label: "metadata (slug/date/keyword/readMinutes)", startsAt: "__START__" },
  { label: "hero (title/subtitle)", startsAt: `hero: {` },
  { label: "tldr", startsAt: `tldr: {` },
  { label: "paragrafo \"cosa ha annunciato\"", startsAt: `"Cosa ha annunciato realmente Samsung"` },
  { label: "tabella specifiche ufficiali", startsAt: `"Specifiche ufficiali"` },
  { label: "funzioni salute (paragrafo modello-specifico)", startsAt: `"Funzioni salute:` },
  { label: "matrice verificata", startsAt: `"La matrice verificata` },
  { label: "prosa post-matrice (letture FitMesh/dato grezzo)", startsAt: `"Cosa può leggere FitMesh oggi"` },
  { label: "compatibilità Android", startsAt: `"Compatibilità e requisiti Android"` },
  { label: "limiti da verificare", startsAt: `"Limiti e funzioni da verificare` },
  { label: "faq", startsAt: `faq: [` },
  { label: "coda (fonti/cronologia, non dovrebbe avere TBD)", startsAt: `"Fonti e cronologia degli aggiornamenti"` },
];

if (!fs.existsSync(POST_FILE)) {
  console.error(`❌ File non trovato: ${POST_FILE}`);
  process.exit(1);
}
if (!fs.existsSync(MAP_FILE)) {
  console.error(`❌ Replacement map non trovata: ${MAP_FILE}`);
  process.exit(1);
}

const postContent = fs.readFileSync(POST_FILE, "utf8");
const lines = postContent.split("\n");

let currentCategory = CATEGORY_MARKERS[0].label;
const perCategory: Record<string, { it: number; en: number; total: number }> = {};
for (const m of CATEGORY_MARKERS) perCategory[m.label] = { it: 0, en: 0, total: 0 };

let grandTotal = 0;
let grandIt = 0;
let grandEn = 0;

lines.forEach((line) => {
  for (const m of CATEGORY_MARKERS) {
    if (m.startsAt !== "__START__" && line.includes(m.startsAt)) {
      currentCategory = m.label;
      break;
    }
  }
  const occurrences = (line.match(/\[TBD/g) ?? []).length;
  if (occurrences === 0) return;

  const enIdx = line.indexOf("en:");
  let itCount: number;
  let enCount: number;
  if (enIdx === -1) {
    // Riga senza struttura it/en (es. commento narrativo): tutto in IT per default.
    itCount = occurrences;
    enCount = 0;
  } else {
    const before = line.slice(0, enIdx);
    const after = line.slice(enIdx);
    itCount = (before.match(/\[TBD/g) ?? []).length;
    enCount = (after.match(/\[TBD/g) ?? []).length;
  }

  perCategory[currentCategory].it += itCount;
  perCategory[currentCategory].en += enCount;
  perCategory[currentCategory].total += occurrences;
  grandTotal += occurrences;
  grandIt += itCount;
  grandEn += enCount;
});

// ── Legge il valore dichiarato nella replacement map ──────────────────────
const mapContent = fs.readFileSync(MAP_FILE, "utf8");
const declaredMatch = mapContent.match(/PLACEHOLDER_COUNT_DECLARED:\s*(\d+)/);

console.log(`\n📊 Conteggio placeholder "[TBD" — ${path.relative(repoRoot, POST_FILE)}\n`);
console.log(`   Totale: ${grandTotal}  (IT: ${grandIt}, EN: ${grandEn})\n`);
console.log(`   Per categoria/fatto:`);
for (const m of CATEGORY_MARKERS) {
  const c = perCategory[m.label];
  if (c.total > 0) {
    console.log(`     - ${m.label}: ${c.total} (IT: ${c.it}, EN: ${c.en})`);
  }
}
console.log("");

if (!declaredMatch) {
  console.error(
    `❌ Marcatore "PLACEHOLDER_COUNT_DECLARED: <n>" non trovato in ${path.relative(repoRoot, MAP_FILE)}.\n` +
      `   Aggiungerlo esplicitamente alla replacement map per abilitare il confronto automatico.`,
  );
  process.exit(1);
}

const declared = Number(declaredMatch[1]);
if (declared !== grandTotal) {
  console.error(
    `❌ DIVERGENZA: la replacement map dichiara ${declared} placeholder, il post ne contiene realmente ${grandTotal}.\n` +
      `   Aggiornare PLACEHOLDER_COUNT_DECLARED nella replacement map a ${grandTotal} (dopo aver verificato la tabella per categoria sopra).`,
  );
  process.exit(1);
}

console.log(`✅ Allineato: replacement map dichiara ${declared}, il post ne contiene ${grandTotal}.`);
