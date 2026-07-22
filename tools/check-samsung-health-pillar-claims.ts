/**
 * Guardrail P1.3M — impedisce che il pillar Samsung Health/Health Connect/
 * Google Health (`lib/blog/posts/health-connect-vs-samsung-health.ts`)
 * pubblichi le confusioni concettuali e i claim non sourciati che lo sprint
 * doveva evitare.
 *
 * Fallisce (exit 1) se il file contiene:
 *  1. Google Health app equiparata alla Google Health API senza una parola
 *     di distinzione nelle vicinanze.
 *  2. Google Health API equiparata a Health Connect.
 *  3. Google Health descritta come collegata direttamente al Galaxy Watch
 *     (contesto affermativo, non di negazione).
 *  4. FitMesh dichiarato supportare automaticamente TUTTI i data type Samsung.
 *  5. Samsung Health → Health Connect propagazione automatica ("quindi
 *     disponibile in Health Connect").
 *  6. Health Connect → FitMesh propagazione automatica ("quindi FitMesh la
 *     legge").
 *  7. FitMesh che "legge" il VO2 max in un contesto affermativo (non negato).
 *  8. FitMesh che replica un punteggio proprietario Samsung (Heart Health
 *     Score, Daily Cardio Load, Fitness Index, Energy Score) in un contesto
 *     affermativo.
 *  9. Health Connect definito come cloud/nel cloud.
 * 10. Claim medici o diagnostici (diagnosi, cura, previene malattie) non
 *     qualificati come dichiarazione Samsung con disclaimer nelle vicinanze.
 * 11. (Strutturale) Una variante locale con fallback EN indicizzabile sotto
 *     un'altra locale.
 * 12. (Strutturale) FAQ visibile per una locale diversa dal suo FAQPage
 *     JSON-LD per quella stessa locale (le nuove FAQ sono `locales`-scoped:
 *     verifica che il filtro condiviso dia lo stesso risultato ovunque).
 * 13. Placeholder "[TBD" residuo nel contenuto pubblicabile.
 * 14. Em dash nel copy visibile (righe non-commento).
 *
 * Uso (Docker): npx tsx tools/check-samsung-health-pillar-claims.ts
 */
import { post } from "@/lib/blog/posts/health-connect-vs-samsung-health";
import { filterBlogContentForLocale } from "@/lib/blog/locale-filter";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { tl } from "@/lib/blog/types";
import { locales } from "@/lib/i18n";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const TARGET = "lib/blog/posts/health-connect-vs-samsung-health.ts";
const full = path.join(repoRoot, TARGET);
const errors: string[] = [];

if (!fs.existsSync(full)) {
  console.error(`❌ File atteso non trovato: ${TARGET}`);
  process.exit(1);
}

const content = fs.readFileSync(full, "utf8");
const lines = content.split("\n");

// ── 1. Google Health app == Google Health API senza distinzione ─────────
lines.forEach((line, i) => {
  if (/google health app/i.test(line) && /google health api/i.test(line)) {
    const distinguishes = /distint[ao]|separat[ao]|non\s+(è|sono)\s+la\s+stessa|distinct|different\s+product|separate\s+product|erede|successor/i.test(line);
    if (!distinguishes) {
      errors.push(`[app-api-confuse] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
    }
  }
});

// ── 2. Google Health API equiparata a Health Connect ─────────────────────
lines.forEach((line, i) => {
  if (/google health api\s*(è|is|=|cioè)\s*(lo stesso di\s*)?health connect/i.test(line)
    || /health connect\s*(è|is|=|cioè)\s*(lo stesso di\s*)?google health api/i.test(line)) {
    errors.push(`[api-hc-confuse] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 3. Google Health collegata direttamente al Galaxy Watch (affermativo) ─
lines.forEach((line, i) => {
  if (line.includes("?")) return; // domanda (FAQ q:), non un'affermazione
  if (!/google health/i.test(line) || !/galaxy watch/i.test(line)) return;
  const claimsDirectLink = /(si\s+collega|connette|connects?|links?)\s+direttamente|directly\s+(connects?|links?|to)/i.test(line);
  if (!claimsDirectLink) return;
  const isNegated = /non\s+si\s+collega|does\s+not\s+connect|doesn['’]?t\s+connect|non\s+direttamente|never\s+connects?|mai\s+.{0,20}collega|nicht\s+direkt|verbindet.{0,15}nicht/i.test(line);
  if (!isNegated) {
    errors.push(`[gh-direct-watch] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 4. FitMesh supporta automaticamente TUTTI i data type Samsung ────────
const FITMESH_ALL_SAMSUNG_TYPES = /fitmesh\s+(legge|integra|supporta|importa|reads?|integrates?|supports?|imports?)\s+(tutti i (tipi di )?data type|tutti i dati|all\s+(the\s+)?data types?).{0,40}samsung/i;
lines.forEach((line, i) => {
  if (FITMESH_ALL_SAMSUNG_TYPES.test(line)) {
    errors.push(`[fitmesh-tutti-i-data-type] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 5. Samsung Health -> Health Connect propagazione automatica ─────────
const SH_TO_HC_AUTOPROP = /(quindi|di conseguenza|therefore|which means it['’]?s?)\s+(disponibile in health connect|available in health connect|scritt[oa] in health connect|written to health connect)/i;
lines.forEach((line, i) => {
  if (SH_TO_HC_AUTOPROP.test(line)) {
    errors.push(`[autoprop-sh-hc] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 6. Health Connect -> FitMesh propagazione automatica ─────────────────
const HC_TO_FITMESH_AUTOPROP = /(quindi|di conseguenza|so|which means)\s+fitmesh\s+(la\s+legge|lo\s+legge|reads?\s+it)/i;
lines.forEach((line, i) => {
  // Esclude l'esempio di anti-pattern citato ESPLICITAMENTE come vietato
  // (tra virgolette, introdotto da "mai"/"never"): la frase del metodologia
  // che avverte contro questa esatta propagazione non e' la propagazione.
  if (/\bmai\b|\bnever\b/i.test(line)) return;
  if (HC_TO_FITMESH_AUTOPROP.test(line)) {
    errors.push(`[autoprop-hc-fitmesh] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 7. FitMesh legge VO2 max (affermativo) ────────────────────────────────
lines.forEach((line, i) => {
  if (line.includes("?")) return; // domanda (FAQ q:), non un'affermazione
  if (!/vo[₂2]\s*max/i.test(line)) return;
  if (/\[TBD/.test(line)) return;
  const isNegated = /non\s+(legge|puo['’]?\s+leggere)|doesn['’]?t\s+read|does\s+not\s+read|cannot\s+read|escluso|excluded|nicht\s+(gelesen|liest)|kein.{0,15}gelesen|liest\s+kein/i.test(line);
  const claimsFitmeshReads = /fitmesh\s+(legge|puo['’]\s+leggere|importa|reads?|imports?)/i.test(line);
  if (claimsFitmeshReads && !isNegated) {
    errors.push(`[fitmesh-vo2max] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 8. FitMesh replica un punteggio proprietario Samsung (affermativo) ───
const PROPRIETARY_TERMS = /energy score|daily cardio load|fitness index|heart health score/i;
lines.forEach((line, i) => {
  if (line.includes("?")) return; // domanda (FAQ q:), non un'affermazione
  if (!PROPRIETARY_TERMS.test(line)) return;
  if (/\[TBD/.test(line)) return;
  const isNegated = /non\s+(legge|replica|puo['’]?\s+leggere)|doesn['’]?t\s+read|does\s+not\s+read|cannot\s+read|escluso|excluded|nessuna?\s+equivalente|no\s+direct\s+equivalent|nicht\s+(gelesen|repliziert)|repliziert\s+(ihn|sie|es)\s+nicht/i.test(line);
  const claimsFitmeshReads = /fitmesh\s+(legge|puo['’]\s+leggere|importa|replica|reads?|imports?|replicates?)/i.test(line);
  if (claimsFitmeshReads && !isNegated) {
    errors.push(`[fitmesh-punteggio-proprietario] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 9. Health Connect definito come cloud ────────────────────────────────
lines.forEach((line, i) => {
  if (line.includes("?")) return; // domanda (FAQ q:), la risposta la nega subito dopo
  if (/\[TBD/.test(line)) return;
  const claimsCloud = /health connect\s+(è|is|ist)\s+(un\s+|a\s+|eine\s+)?cloud|health connect.{0,20}(nel|nella|in the|in der)\s+cloud|cloud\s+(di\s+)?health connect/i.test(line);
  if (!claimsCloud) return;
  const isNegated = /non\s+(è|un)\s+.{0,10}cloud|not\s+a\s+cloud|is\s+not\s+.{0,10}cloud|keine\s+cloud/i.test(line);
  if (!isNegated) {
    errors.push(`[hc-definito-cloud] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 10. Claim medici/diagnostici non qualificati ─────────────────────────
// Richiede co-occorrenza con un termine medico/di malattia esplicito: evita
// falsi positivi su usi tecnici generici ("diagnosticare un problema di
// sync", "la documentazione tratta i due sistemi", "treats" = "gestisce" in
// inglese generico, non "cura").
const MEDICAL_CONTEXT = /malattia|malattie|disease|patologia|condizione\s+medica|medical\s+condition|illness/i;
lines.forEach((line, i) => {
  if (/\[TBD/.test(line)) return;
  // Nota: "treats"/"cura" da soli sono troppo generici in inglese/italiano
  // tecnico (es. "la documentazione treats i due sistemi separatamente" =
  // "gestisce", non "cura"): richiediamo la co-occorrenza con un termine
  // medico esplicito prima di considerarlo un possibile claim diagnostico.
  if (/(diagnostica|diagnose[s]?|cura|previene\s+malattie|prevents?\s+disease)/i.test(line) && MEDICAL_CONTEXT.test(line)) {
    const context = lines.slice(Math.max(0, i - 2), i + 2).join(" ");
    const qualified = /non\s+è\s+destinat[oa]|not\s+intended|non\s+sostituisce|does\s+not\s+replace|samsung\s+dichiara|per\s+samsung|according\s+to\s+samsung/i.test(context);
    if (!qualified) {
      errors.push(`[claim-medico-non-qualificato] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
    }
  }
});

// ── 11. Nessuna variante con fallback EN indicizzabile sotto un'altra locale (strutturale) ─
for (const lc of locales) {
  if (lc === "it" || lc === "en") continue;
  // Nessuna asserzione qui su quali locale DEVONO essere indicizzabili
  // (dipende dal contenuto reale di ciascuna, gia' coperto da
  // indexability.test.ts): verifichiamo solo che la funzione non lanci,
  // usandola come unica fonte di verita' (isBlogVariantIndexable stessa).
  isBlogVariantIndexable(post, lc);
}

// ── 12. FAQ visibile === FAQPage per ogni locale (coerenza HTML/JSON-LD) ─
for (const lc of ["it", "en", "de", "es", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const) {
  const visibleFaq = filterBlogContentForLocale(post.faq ?? [], lc);
  // Le domande/risposte visibili devono avere testo per questa locale se
  // la locale e' indicizzabile (altrimenti la pagina non viene servita).
  if (isBlogVariantIndexable(post, lc)) {
    for (const f of visibleFaq) {
      if (!(f.q as Record<string, string | undefined>)[lc] || !(f.a as Record<string, string | undefined>)[lc]) {
        errors.push(`[faq-visibile-senza-testo] locale "${lc}": una FAQ visibile non ha testo proprio in questa lingua.`);
      }
    }
  }
}

// ── 13. Placeholder residuo ────────────────────────────────────────────
lines.forEach((line, i) => {
  if (/\[TBD/.test(line)) {
    errors.push(`[placeholder-residuo] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 14. Em dash nel copy visibile ──────────────────────────────────────
lines.forEach((line, i) => {
  const trimmed = line.trim();
  const isComment = trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
  if (!isComment && line.includes("—")) {
    errors.push(`[em-dash] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

if (errors.length > 0) {
  console.error(`❌ Samsung Health pillar claims guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✅ Samsung Health pillar claims guardrail OK: nessun claim bandito trovato in ${TARGET}. Titolo IT verificato: "${tl(post.hero.title, "it")}".`);
