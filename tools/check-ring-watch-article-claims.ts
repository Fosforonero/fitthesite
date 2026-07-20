/**
 * Guardrail Sprint P1.2 Fase 11 — impedisce il ritorno dei claim falsi
 * rimossi da lib/blog/posts/anello-vs-smartwatch.ts nel refresh 2026-07-20.
 *
 * Fallisce (exit 1) se il file contiene di nuovo:
 *  1. "iOS coming soon" / "l'app iOS arriva a breve" o equivalenti — falso,
 *     iOS e' live incluse le storefront UE (lib/product-facts.ts).
 *  2. "FitMesh beta" / "prova FitMesh in beta" fuori da un contesto storico
 *     esplicito — il prodotto e' pubblico, non closed beta
 *     (PRODUCT_STATUS.isClosedBeta: false).
 *  3. Eliminazione GARANTITA/assoluta dei duplicati ("elimina i doppi
 *     conteggi", "mai due volte" senza condizionale) — FitMesh applica
 *     priorita'/deduplicazione ma alcuni conflitti restano possibili.
 *  4. Un numero di autonomia (giorni di batteria) non accompagnato da un
 *     riferimento esplicito al modello o da un termine di variabilita'
 *     ("dipende dal modello", "varia", "generalmente").
 *  5. Un prezzo Colmi hardcoded (simbolo valuta + cifra) senza una nota di
 *     fonte/data nelle vicinanze.
 *  6. "il ring/anello e' piu' accurato" senza riferimento a una fonte/studio
 *     nelle vicinanze.
 *  7. Un link IT (`/it/blog/...`) dentro un blocco di testo `en`, o un link
 *     EN (`/en/blog/...`) dentro un blocco di testo `it` (cross-link locale
 *     sbagliato).
 *  8. Le domande FAQ visibili (`faq[].q.it`/`.en`) non combaciano 1:1 con
 *     quelle attese dalla Fase 7 dello sprint (stesso array usato per il
 *     JSON-LD FAQPage: se il contenuto visibile diverge da qui, diverge
 *     anche dal JSON-LD, perche' sono la STESSA fonte — questo guardrail
 *     verifica che nessuno abbia aggiunto un secondo array/override FAQ nel
 *     file, che romperebbe quella garanzia strutturale).
 *
 * Uso (Docker): npx tsx tools/check-ring-watch-article-claims.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const TARGET = "lib/blog/posts/anello-vs-smartwatch.ts";
const full = path.join(repoRoot, TARGET);
const errors: string[] = [];

if (!fs.existsSync(full)) {
  console.error(`❌ File atteso non trovato: ${TARGET}`);
  process.exit(1);
}

const content = fs.readFileSync(full, "utf8");
const lines = content.split("\n");

// ── 1. iOS "in arrivo" ────────────────────────────────────────────────────
// Proximity-based (non semplice co-occorrenza sulla riga): le righe di
// questo file sono paragrafi interi su una riga sola, quindi "ios" e
// "arriva" possono comparire legittimamente lontani nella stessa frase
// (es. "...iOS legge da HealthKit; tutto quello che arriva tramite...").
const IOS_COMING_SOON_PATTERNS = [
  /ios\s+(app\s+)?(arriva|coming)\s*(a breve|very soon|soon|presto)/i,
  /l'app\s+ios\s+arriva/i,
  /ios\s+app\s+coming\s+(very\s+)?soon/i,
];
lines.forEach((line, i) => {
  for (const re of IOS_COMING_SOON_PATTERNS) {
    if (re.test(line)) {
      errors.push(`[ios-coming-soon] riga ${i + 1}: "${line.trim().slice(0, 120)}"`);
      break;
    }
  }
});

// ── 2. "beta" fuori contesto storico ──────────────────────────────────────
lines.forEach((line, i) => {
  if (/prova fitmesh in beta|try fitmesh.{0,15}beta|fitmesh sync in beta/i.test(line)) {
    errors.push(`[beta-claim] riga ${i + 1}: "${line.trim().slice(0, 120)}"`);
  }
});

// ── 3. Eliminazione assoluta duplicati ────────────────────────────────────
const ABSOLUTE_DEDUP = [
  /elimina(no)?\s+(i\s+)?doppi\s+conteggi/i,
  /eliminating double-counting/i,
  /mai\s+(due volte|contat[oa]\s+due volte)/i,
  /never\s+counted\s+twice/i,
];
lines.forEach((line, i) => {
  for (const re of ABSOLUTE_DEDUP) {
    if (re.test(line)) {
      errors.push(`[dedup-assoluto] riga ${i + 1}: "${line.trim().slice(0, 120)}"`);
    }
  }
});

// ── 4. Autonomia senza modello/variabilita' ───────────────────────────────
// Pattern "N-N giorni"/"N-N days" seguito da un termine di variabilita' entro
// ~80 caratteri; se manca, e' un'autonomia presentata come universale.
const BATTERY_NUMBER = /\d+\s*[-–]\s*\d+\s*(giorni|days)/gi;
let m: RegExpExecArray | null;
while ((m = BATTERY_NUMBER.exec(content)) !== null) {
  const windowAround = content.slice(Math.max(0, m.index - 20), m.index + 100);
  if (!/dipende dal modello|depends on the model|varia|varies|generalmente|generally|tipici|typical/i.test(windowAround)) {
    const lineNo = content.slice(0, m.index).split("\n").length;
    errors.push(`[autonomia-universale] riga ${lineNo}: "${m[0]}" senza riferimento a variabilita'/modello nelle vicinanze.`);
  }
}

// ── 5. Prezzo Colmi hardcoded senza fonte ─────────────────────────────────
const PRICE_PATTERN = /[€$]\s*\d+([.,]\d+)?(\s*[-–]\s*[€$]?\s*\d+([.,]\d+)?)?/g;
while ((m = PRICE_PATTERN.exec(content)) !== null) {
  const windowAround = content.slice(Math.max(0, m.index - 80), m.index + 80);
  if (!/fonte|source|consultat[ao]|consulted/i.test(windowAround)) {
    const lineNo = content.slice(0, m.index).split("\n").length;
    errors.push(`[prezzo-non-sourciato] riga ${lineNo}: "${m[0]}" senza fonte/data nelle vicinanze.`);
  }
}

// ── 6. "ring piu' accurato" senza fonte ───────────────────────────────────
lines.forEach((line, i) => {
  if (/(ring|anello).{0,30}(piu'|più|more)\s+accurat[oe]|more accurate/i.test(line)) {
    const context = lines.slice(Math.max(0, i - 3), i + 3).join(" ");
    if (!/fonte|source|studio|study|non affermiamo|not claiming/i.test(context)) {
      errors.push(`[accuratezza-non-sourciata] riga ${i + 1}: "${line.trim().slice(0, 120)}"`);
    }
  }
});

// ── 7. Cross-link locale sbagliato ────────────────────────────────────────
// Individua i blocchi `it: "..."` e `en: "..."` (anche multilinea semplice,
// dato che le stringhe di questo file sono su una riga) e verifica che non
// contengano un link dell'altra lingua.
lines.forEach((line, i) => {
  const itMatch = /^\s*it:\s*"/.test(line);
  const enMatch = /^\s*en:\s*"/.test(line);
  if (itMatch && /\/en\/(blog|fitness-data-sync|labs)\//.test(line)) {
    errors.push(`[cross-link] riga ${i + 1}: stringa "it" contiene un link "/en/...": "${line.trim().slice(0, 140)}"`);
  }
  if (enMatch && /\/it\/(blog|fitness-data-sync|labs)\//.test(line)) {
    errors.push(`[cross-link] riga ${i + 1}: stringa "en" contiene un link "/it/...": "${line.trim().slice(0, 140)}"`);
  }
});

// ── 8. Un solo array FAQ (garanzia strutturale visibile === JSON-LD) ──────
const faqArrayMatches = content.match(/faq:\s*\[/g) ?? [];
if (faqArrayMatches.length > 1) {
  errors.push(`[faq-duplicato] trovati ${faqArrayMatches.length} array "faq:" nel file — deve essercene UNO solo (stessa fonte per visibile e JSON-LD).`);
}

if (errors.length > 0) {
  console.error(`❌ Ring vs watch article claims guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✅ Ring vs watch article claims guardrail OK: nessun claim bandito trovato in ${TARGET}.`);
