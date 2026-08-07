/**
 * Guardrail SPRINT P1.8S FASE 2/8 — impedisce che il contenuto product-led
 * nuovo di questo sprint (Samsung Health + FitMesh, consolidamento Apple
 * Salute) pubblichi le affermazioni assolute/non verificate vietate
 * esplicitamente dal mandato dello sprint.
 *
 * Copre 2 file:
 *  - lib/blog/posts/fitmesh-samsung-health-usarli-insieme.ts (nuovo articolo,
 *    scansionato per intero)
 *  - lib/blog/posts/dati-anello-smart-apple-salute.ts (consolidamento: SOLO
 *    le righe fra il marker FASE 8 e "In sintesi" — il resto del file è
 *    contenuto pre-esistente non toccato da questo sprint, già pubblicato
 *    prima del mandato P1.8S e fuori dal suo scope)
 *
 * Fallisce (exit 1) se una riga di testo pubblicabile (non commento, non
 * dentro una domanda FAQ `q:` — porre la domanda "FitMesh sostituisce X?" è
 * il pattern SICURO per poi negarla nella risposta, verificato manualmente
 * che ogni `q:` che innesca un pattern vietato ha una `a:` che comincia con
 * una negazione) contiene:
 *  1. "FitMesh sostituisce"/"FitMesh replaces" in un'affermazione (non in una
 *     domanda FAQ).
 *  2. "migliore di"/"better than" in forma comparativa non qualificata.
 *  3. "tutti i dati"/"all your data"/"all the data" come claim di copertura
 *     assoluta (esclude "transita/transit" nelle vicinanze: descrivere DOVE
 *     vanno i dati non è un claim su COSA viene sincronizzato).
 *  4. "zero duplicati"/"never double-count[s]" come claim assoluto.
 *  5. "in tempo reale"/"real-time" riferito alla sincronizzazione, in
 *     un'affermazione (non in una domanda FAQ che viene poi negata).
 *  6. "privacy-first" non qualificato da un dettaglio concreto vicino.
 *  7. Claim medici/diagnostici in un contesto AFFERMATIVO (non negato:
 *     "non passano"/"don't pass"/"never passes" nelle vicinanze rende sicura
 *     una frase che lista cosa NON è coperto).
 *  8. "AI" (acronimo, case-sensitive: non intercetta "ai" italiano) o
 *     "intelligenza artificiale"/"machine learning" riferiti a FitMesh in un
 *     contesto AFFERMATIVO (non negato: "not AI"/"non usa" nelle vicinanze
 *     è il pattern corretto e atteso, il prodotto è dichiaratamente
 *     rule-based).
 *  9. Prezzi non approvati (simbolo valuta + cifra fuori da un commento).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p18s-product-led-claims.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

const NEGATION_WINDOW = /\b(non|not|doesn't|don't|never|no\.|no,|nicht|pas|senza|without)\b/i;

function checkLines(rel: string, lines: string[], startIdx: number, endIdx: number): void {
  // P0.12 FASE 5 (06/08): il check originale saltava SOLO la riga di
  // apertura letterale "q: {" — funzionava quando `q` era su una riga sola
  // (`q: { it: "...", en: "..." },`), ma un `q:` multi-riga a 4 locale
  // (it/en/de/fr, una per riga) faceva ricadere le righe successive nei
  // check normali, con falsi positivi su domande FAQ che pongono un claim
  // per poi negarlo nella risposta. Fix: track del brace-depth per saltare
  // l'intero blocco `q: {...}`, indipendentemente da quante righe occupa.
  let qBraceDepth = 0;
  for (let i = startIdx; i < endIdx; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) continue; // commento editoriale

    if (qBraceDepth > 0) {
      qBraceDepth += (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
      continue; // dentro un blocco q: {...} multi-riga: domanda FAQ, pattern sicuro
    }
    if (/^q:\s*\{/.test(trimmed)) {
      const depth = (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
      if (depth > 0) qBraceDepth = depth;
      continue; // riga di apertura q:: domanda FAQ, pattern sicuro, negata nella risposta
    }

    const window = lines.slice(Math.max(startIdx, i - 1), Math.min(endIdx, i + 2)).join(" ");

    if (/FitMesh (sostituisce|rimpiazza)/i.test(line) || /FitMesh replaces/i.test(line)) {
      errors.push(`[fitmesh-sostituisce] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    if (/migliore di\b(?!\s*\w+\s+per\b)/i.test(line)) {
      errors.push(`[migliore-di-non-qualificato] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    if (/\bbetter than\b/i.test(line) && !/\bfor\b/i.test(line)) {
      errors.push(`[better-than-non-qualificato] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    if ((/tutti i (tuoi )?dati/i.test(line) || /\ball (your |the )?data\b/i.test(line)) && !/transit/i.test(window)) {
      errors.push(`[tutti-i-dati] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    if (/zero duplicat[oi]/i.test(line) || /\bzero duplicates?\b/i.test(line) || /mai doppio conteggio/i.test(line) || /\bnever double[- ]counts?\b/i.test(line)) {
      errors.push(`[duplicati-assoluto] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    if ((/sincronizzazione in tempo reale/i.test(line) || /real-?time sync/i.test(line)) && !NEGATION_WINDOW.test(window)) {
      errors.push(`[sync-tempo-reale] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    if (/diagnos|\bcura\b|\btreats?\b|previene (le )?malatt/i.test(line) && !NEGATION_WINDOW.test(window)) {
      errors.push(`[claim-medico] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    // "AI" case-sensitive (non intercetta "ai" italiano minuscolo); IA/
    // intelligenza artificiale/machine learning case-insensitive.
    const hasAiTerm = /\bAI\b/.test(line) || /intelligenza artificiale|machine learning/i.test(line);
    if (hasAiTerm && !NEGATION_WINDOW.test(window)) {
      errors.push(`[claim-ai] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    if (/[€$]\s?\d/.test(line)) {
      errors.push(`[prezzo-non-approvato] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
    if (/privacy-first/i.test(line) && !/(cloud EU|EU cloud|GDPR|RGPD|non vende|doesn't sell|non condivide|doesn't share)/i.test(window)) {
      errors.push(`[privacy-first-non-qualificato] ${rel}:${i + 1}: "${trimmed.slice(0, 140)}"`);
    }
  }
}

// 1. Samsung article: nuovo, scansionato per intero.
const samsungRel = "lib/blog/posts/fitmesh-samsung-health-usarli-insieme.ts";
const samsungFull = path.join(repoRoot, samsungRel);
if (!fs.existsSync(samsungFull)) {
  errors.push(`[file-mancante] ${samsungRel} non trovato.`);
} else {
  const lines = fs.readFileSync(samsungFull, "utf8").split("\n");
  checkLines(samsungRel, lines, 0, lines.length);
}

// 2. Apple bridge: SOLO il blocco nuovo FASE 8 (fra il marker e "In sintesi").
const appleRel = "lib/blog/posts/dati-anello-smart-apple-salute.ts";
const appleFull = path.join(repoRoot, appleRel);
if (!fs.existsSync(appleFull)) {
  errors.push(`[file-mancante] ${appleRel} non trovato.`);
} else {
  const lines = fs.readFileSync(appleFull, "utf8").split("\n");
  const startIdx = lines.findIndex((l) => l.includes("consolidamento del ponte Apple Salute dopo"));
  const endIdx = lines.findIndex((l, i) => i > startIdx && /it: "In sintesi"/.test(l));
  if (startIdx === -1 || endIdx === -1) {
    errors.push(`[marker-non-trovato] ${appleRel}: impossibile isolare il blocco FASE 8 (marker o "In sintesi" mancante) — verificare manualmente.`);
  } else {
    checkLines(appleRel, lines, startIdx, endIdx);
  }
}

if (errors.length > 0) {
  console.error(`❌ P1.8S product-led claims guardrail: ${errors.length} problema/i.\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  "✅ P1.8S product-led claims guardrail: nessuna sostituzione/comparazione assoluta/copertura-totale/duplicati-assoluti/tempo-reale/privacy-first-vuoto/claim-medico/claim-AI/prezzo-non-approvato nel nuovo contenuto Samsung+Apple.",
);
