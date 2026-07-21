/**
 * Guardrail Sprint P1.3N — impedisce che l'articolo Galaxy Watch Unpacked
 * (`lib/blog/posts/galaxy-watch-ultra-2-health-connect.ts`) pubblichi
 * specifiche non confermate, claim medici sostenibili solo se sourciati,
 * o un body EN di fallback indicizzabile sotto un'altra locale.
 *
 * NOTA: prima dell'evento (2026-07-22) il file contiene deliberatamente
 * placeholder "[TBD]" per nome prodotto/hardware/prezzo — questo NON è un
 * problema, è lo stato atteso. Il guardrail blocca solo claim scritti come
 * FATTO senza qualificazione, non i placeholder stessi, TRANNE con la
 * variabile d'ambiente `GW_EVENT_DAY=1` (vedi check 14): quel modo va
 * usato SOLO il giorno della pubblicazione reale, dopo aver risolto ogni
 * riga di `docs/seo/galaxy-watch/event-day-replacement-map.md`.
 *
 * Fallisce (exit 1) se il file contiene:
 *  1. Una specifica hardware bandita (batteria mAh, autonomia "3-4 giorni",
 *     nit display, spessore mm, IP69K, 10 ATM, GB storage, 5G, prezzo €)
 *     scritta come FATTO (fuori da un blocco "[TBD]"/tabella con "[TBD]"),
 *     senza un riferimento a fonte nelle vicinanze.
 *  2. Snapdragon Wear Elite attribuito al Watch senza "Samsung conferma"/
 *     "Samsung confirms" nelle vicinanze.
 *  3. "rileva/detects" + "infezione.../infection..." (claim diagnostico vietato).
 *  4. "non richiede smartphone o cloud" / "works without... phone... cloud"
 *     (claim di elaborazione 100% locale non sostenibile).
 *  5. "certificazione clinica"/"clinically certified" senza un paese o
 *     ente regolatore nominato nelle vicinanze.
 *  6. FitMesh descritto come capace di leggere un punteggio proprietario
 *     Samsung (Energy Score, Daily Cardio Load, Fitness Index, AGEs Index,
 *     Heart Health Score) o VO2 max, in un contesto affermativo (non di
 *     negazione — "FitMesh non legge X" è corretto, va escluso da questo
 *     check tramite il confine "non legge/non read/doesn't read" a monte).
 *  7. Uno schema JSON-LD vietato (Product/Review/Offer/AggregateRating)
 *     scritto letteralmente nel file (structural, non dovrebbe mai
 *     comparire: ldType è fissato a "BlogPosting" a livello di tipo).
 *  8. Un secondo array "faq:" (garanzia strutturale visibile === JSON-LD).
 *  9. (Strutturale) Il post non risulta in REDIRECT_INCOMPLETE_LOCALE_SLUGS,
 *     o una locale diversa da it/en risulta indicizzabile.
 *  10. FitMesh descritto come capace di leggere la temperatura cutanea
 *      reale (SkinTemperatureRecord) in un contesto affermativo — stesso
 *      pattern del check 6, dedicato perché "temperatura cutanea" non
 *      rientra in PROPRIETARY_TERMS.
 *  11. Una funzione Samsung Health marcata come automaticamente disponibile
 *      in Health Connect solo perché visibile nell'app ("quindi disponibile
 *      in Health Connect"/"therefore available in Health Connect" e varianti).
 *  12. Un tipo di dato Health Connect marcato come automaticamente letto da
 *      FitMesh solo perché il tipo esiste ("quindi FitMesh la legge"/
 *      "so FitMesh reads it" e varianti).
 *  13. (Strutturale) Una sezione `body` di tipo "image" che referenzia un
 *      file diverso dalla cover originale registrata (nessuna immagine non
 *      registrata/esterna ammessa).
 *  14. (Solo con `GW_EVENT_DAY=1`) Qualsiasi occorrenza residua di "[TBD"
 *      nel contenuto pubblicabile — gate da usare il giorno della
 *      pubblicazione reale, non prima.
 *  15. (Strutturale, subprocess) `check-galaxy-watch-placeholder-count.ts`
 *      fallisce se la replacement map e il conteggio reale divergono.
 *  16. L'articolo NON menziona affatto "Samsung Health Data SDK" (percorso
 *      diretto omesso, mostrerebbe solo Health Connect).
 *  17. Samsung Health Data SDK ed Health Connect equiparati esplicitamente
 *      ("X è Y", "X cioè Y") in una direzione o nell'altra.
 *  18. Disponibilità nel Samsung SDK propagata automaticamente a "FitMesh
 *      legge/supporta" ("quindi FitMesh legge"/"so FitMesh reads").
 *  19. Google Health API descritta come sostituta/successore di Health
 *      Connect.
 *  20. Google Health API descritta come percorso automatico per i dati
 *      Galaxy Watch (in un contesto affermativo, non di negazione).
 *  21. Google Health app e Google Health API nominate sulla stessa riga
 *      senza una parola che le distingua esplicitamente come prodotti
 *      separati.
 *  22. FitMesh dichiarato integrato con TUTTI i data type/dati Samsung.
 *
 * Uso (Docker): npx tsx tools/check-galaxy-watch-article-claims.ts
 * Uso event-day: GW_EVENT_DAY=1 npx tsx tools/check-galaxy-watch-article-claims.ts
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { locales } from "@/lib/i18n";
import { post as galaxyWatchPost } from "@/lib/blog/posts/galaxy-watch-ultra-2-health-connect";
import { isBlogVariantIndexable, REDIRECT_INCOMPLETE_LOCALE_SLUGS } from "@/lib/blog/indexability";

const repoRoot = path.resolve(__dirname, "..");
const TARGET = "lib/blog/posts/galaxy-watch-ultra-2-health-connect.ts";
const full = path.join(repoRoot, TARGET);
const errors: string[] = [];

// ── 9. Nessun body EN di fallback indicizzabile sotto una locale diversa ──
for (const lc of locales) {
  if (lc === "it" || lc === "en") continue;
  if (isBlogVariantIndexable(galaxyWatchPost, lc)) {
    errors.push(`[locale-fallback-indicizzabile] "${lc}" risulta indicizzabile.`);
  }
}
if (!REDIRECT_INCOMPLETE_LOCALE_SLUGS.has(galaxyWatchPost.slug)) {
  errors.push(`[redirect-non-registrato] "${galaxyWatchPost.slug}" non e' in REDIRECT_INCOMPLETE_LOCALE_SLUGS.`);
}

if (!fs.existsSync(full)) {
  console.error(`❌ File atteso non trovato: ${TARGET}`);
  process.exit(1);
}

const content = fs.readFileSync(full, "utf8");
const lines = content.split("\n");

// ── 1. Specifiche hardware bandite senza fonte nelle vicinanze ───────────
// Un valore dentro "[TBD]" e' atteso e non bandito; qui cerchiamo cifre
// SPECIFICHE scritte come se fossero gia' fatto accertato.
const BANNED_HW_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\b\d{3,4}\s*mAh\b/i, label: "batteria in mAh" },
  { re: /\b3[-–]4\s*(giorni|days)\b/i, label: "autonomia 3-4 giorni" },
  { re: /\b5[.,]?000\s*nit/i, label: "display 5000 nit" },
  { re: /\b10[.,]6\s*mm\b/i, label: "spessore 10.6mm" },
  { re: /\bIP69K\b/i, label: "IP69K" },
  { re: /\b10\s*ATM\b/i, label: "10 ATM" },
  { re: /\b64\s*GB\b/i, label: "64GB storage" },
  { re: /\b5G\b/, label: "5G" },
  { re: /€\s*749|\b749\s*€/i, label: "prezzo 749€" },
];
lines.forEach((line, i) => {
  if (/\[TBD/.test(line)) return; // riga placeholder, non e' un claim di fatto
  for (const { re, label } of BANNED_HW_PATTERNS) {
    if (re.test(line)) {
      errors.push(`[specifica-non-confermata:${label}] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
    }
  }
});

// ── 2. Snapdragon Wear Elite senza conferma Samsung esplicita ────────────
lines.forEach((line, i) => {
  if (/\[TBD/.test(line)) return;
  if (/snapdragon\s+wear\s+elite/i.test(line) && !/samsung\s+(conferma|confirms?)/i.test(line)) {
    errors.push(`[snapdragon-non-confermato] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 3. Claim diagnostico "rileva infezioni" ───────────────────────────────
lines.forEach((line, i) => {
  if (/(rileva|detects?).{0,30}infezion/i.test(line) || /infection.{0,30}detect/i.test(line)) {
    errors.push(`[claim-diagnostico-infezioni] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 4. "Non richiede smartphone o cloud" / elaborazione 100% locale ──────
lines.forEach((line, i) => {
  if (/non richiede (uno smartphone|un telefono).{0,20}(o|ne).{0,10}cloud/i.test(line)
    || /works? without.{0,20}(phone|smartphone).{0,20}(or|nor).{0,10}cloud/i.test(line)) {
    errors.push(`[claim-100-locale] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 5. "Certificazione clinica" senza paese/ente ──────────────────────────
lines.forEach((line, i) => {
  if (/(certificazione clinica|clinically certified)/i.test(line)) {
    const context = lines.slice(Math.max(0, i - 2), i + 2).join(" ");
    if (!/FDA|CE\b|paese|country|region|ente|regulator/i.test(context)) {
      errors.push(`[certificazione-non-contestualizzata] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
    }
  }
});

// ── 6. FitMesh che "legge" un punteggio proprietario o VO2max (affermativo) ─
const PROPRIETARY_TERMS = /energy score|daily cardio load|fitness index|ages index|heart health score|vo2\s*max/i;
lines.forEach((line, i) => {
  if (!PROPRIETARY_TERMS.test(line)) return;
  if (/\[TBD/.test(line)) return;
  const isNegated = /non\s+(legge|replica|puo['’]?\s+leggere)|doesn['’]?t\s+read|does\s+not\s+read|cannot\s+read|escluso|excluded|nessuna?\s+equivalente|no\s+direct\s+equivalent|nessun'?\s+equivalente/i.test(line);
  const claimsFitmeshReads = /fitmesh\s+(legge|puo['’]\s+leggere|importa|replica)|fitmesh\s+(reads?|imports?|replicates?)/i.test(line);
  if (claimsFitmeshReads && !isNegated) {
    errors.push(`[fitmesh-punteggio-proprietario] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 7. Schema JSON-LD vietato scritto nel file ────────────────────────────
if (/"@type"\s*:\s*"(Product|Review|AggregateRating|Offer)"/.test(content) || /ldType:\s*"(Product|Review|Offer)"/.test(content)) {
  errors.push(`[jsonld-vietato] Il file contiene un riferimento a Product/Review/Offer/AggregateRating.`);
}

// ── 8. Un solo array FAQ ──────────────────────────────────────────────────
const faqArrayMatches = content.match(/faq:\s*\[/g) ?? [];
if (faqArrayMatches.length > 1) {
  errors.push(`[faq-duplicato] trovati ${faqArrayMatches.length} array "faq:" — deve essercene UNO solo.`);
}

// ── em dash nel copy visibile (righe non-commento) ────────────────────────
lines.forEach((line, i) => {
  const trimmed = line.trim();
  const isComment = trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
  if (!isComment && line.includes("—")) {
    errors.push(`[em-dash] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 10. FitMesh che "legge" la temperatura cutanea reale (affermativo) ───
const SKIN_TEMP_TERMS = /temperatura cutanea|skin temperature/i;
lines.forEach((line, i) => {
  if (!SKIN_TEMP_TERMS.test(line)) return;
  if (/\[TBD/.test(line)) return;
  // Claim legittimo (verificato nel codice, Fase 4 P1.3N-B): FitMesh legge
  // temperatura cutanea SOLO via il canale diretto Samsung Health SDK
  // (samsungSkinTemperatureC, gap-fill), MAI via Health Connect/
  // SkinTemperatureRecord. Qualificare con "canale diretto"/"Samsung SDK"/
  // "gap-fill" rende il claim corretto, non va bloccato.
  const isQualifiedOrNegated = /non\s+legge|doesn['’]?t\s+read|does\s+not\s+read|cannot\s+read|escluso|excluded|BodyTemperatureRecord.{0,20}(invece|diverso|instead|different)|canale diretto|direct.{0,10}channel|samsung.{0,10}sdk|gap-fill/i.test(line);
  const claimsFitmeshReadsViaHC = /(fitmesh\s+(legge|puo['’]\s+leggere|importa)|fitmesh\s+(reads?|imports?)).{0,60}health connect|health connect.{0,60}(fitmesh\s+(legge|reads?))/i.test(line);
  if (claimsFitmeshReadsViaHC && !isQualifiedOrNegated) {
    errors.push(`[fitmesh-temperatura-cutanea-via-hc] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 11. Samsung Health → Health Connect: propagazione automatica vietata ──
const SH_TO_HC_AUTOPROP = /(quindi|di conseguenza|therefore|which means it['’]?s?)\s+(disponibile in health connect|available in health connect|scritt[oa] in health connect|written to health connect)/i;
lines.forEach((line, i) => {
  if (SH_TO_HC_AUTOPROP.test(line)) {
    errors.push(`[autoprop-samsunghealth-healthconnect] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 12. Health Connect → FitMesh: propagazione automatica vietata ────────
const HC_TO_FITMESH_AUTOPROP = /(quindi|di conseguenza|so|which means)\s+fitmesh\s+(la\s+legge|lo\s+legge|reads?\s+it)/i;
lines.forEach((line, i) => {
  if (HC_TO_FITMESH_AUTOPROP.test(line)) {
    errors.push(`[autoprop-healthconnect-fitmesh] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 13. Solo la cover originale registrata è ammessa come immagine body ──
const ALLOWED_IMAGE_SRCS = new Set(["/blog/covers/galaxy-watch-unpacked.webp"]);
for (const item of galaxyWatchPost.body) {
  if (item.type === "image" && !ALLOWED_IMAGE_SRCS.has(item.src)) {
    errors.push(`[immagine-non-registrata] src non in allowlist: "${item.src}"`);
  }
}

// ── 14. Event-day: zero placeholder residui (opt-in, GW_EVENT_DAY=1) ─────
if (process.env.GW_EVENT_DAY === "1") {
  lines.forEach((line, i) => {
    if (/\[TBD/.test(line)) {
      errors.push(`[event-day-placeholder-residuo] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
    }
  });
}

// ── 15. Replacement map e conteggio reale placeholder devono coincidere ──
try {
  execFileSync("npx", ["tsx", "tools/check-galaxy-watch-placeholder-count.ts"], {
    cwd: repoRoot,
    stdio: "pipe",
  });
} catch {
  errors.push(`[placeholder-count-divergente] tools/check-galaxy-watch-placeholder-count.ts ha fallito: la replacement map e il conteggio reale nel post non coincidono. Eseguire quello script per il dettaglio.`);
}

// ── 16. L'articolo deve descrivere esplicitamente il percorso diretto ────
const HAS_DIRECT_PATH_MENTION = /samsung health data sdk/i.test(content);
if (!HAS_DIRECT_PATH_MENTION) {
  errors.push(`[percorso-diretto-omesso] Il file non menziona "Samsung Health Data SDK": l'articolo non può descrivere solo Health Connect.`);
}

// ── 17. Samsung Health Data SDK confuso con Health Connect ───────────────
lines.forEach((line, i) => {
  if (/samsung health (data )?sdk\s*(è|is|=|cioè)\s*(lo stesso di\s*)?health connect/i.test(line)
    || /health connect\s*(è|is|=|cioè)\s*(lo stesso di\s*)?samsung health (data )?sdk/i.test(line)) {
    errors.push(`[sdk-confuso-con-hc] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 18. Disponibilità Samsung SDK trasformata in supporto FitMesh automatico ─
const SDK_TO_FITMESH_AUTOPROP = /(quindi|di conseguenza|so|which means)\s+fitmesh\s+(la\s+|lo\s+)?(legge|supporta|reads?|supports?)/i;
lines.forEach((line, i) => {
  if (/samsung (health data )?sdk/i.test(line) && SDK_TO_FITMESH_AUTOPROP.test(line)) {
    errors.push(`[autoprop-sdk-fitmesh] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 19. Google Health API descritta come sostituta di Health Connect ────
lines.forEach((line, i) => {
  const isNegated = /non\s+sostituisce|doesn['’]?t\s+replace|does\s+not\s+replace/i.test(line);
  if (isNegated) return;
  if (/google health api.{0,40}(sostituisce|sostituto|successore|replaces?|substitut\w*)\s+.{0,10}health connect/i.test(line)
    || /health connect.{0,40}(sostituit[ao]|superat[ao]|replaced by)\s+.{0,10}google health api/i.test(line)) {
    errors.push(`[google-health-api-sostituta-hc] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

// ── 20. Google Health API descritta come percorso automatico Galaxy Watch ─
lines.forEach((line, i) => {
  if (/google health api/i.test(line) && /galaxy watch/i.test(line) && /automatic|automatica|automaticamente/i.test(line)) {
    const isNegated = /non\s+(riceve|dichiara|automatica)|doesn['’]?t\s+(automatically\s+)?receive|no\s+automatic/i.test(line);
    if (!isNegated) {
      errors.push(`[google-health-api-percorso-automatico] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
    }
  }
});

// ── 21. Google Health app e Google Health API trattate come lo stesso prodotto ─
lines.forEach((line, i) => {
  if (/google health app/i.test(line) && /google health api/i.test(line)) {
    const distinguishes = /distint[ao]|separat[ao]|non\s+(è|sono)\s+la\s+stessa|distinct|different\s+product|separate\s+product/i.test(line);
    if (!distinguishes) {
      errors.push(`[google-health-app-api-confusi] riga ${i + 1}: "${line.trim().slice(0, 140)}" (menzionati insieme senza una parola di distinzione nelle vicinanze)`);
    }
  }
});

// ── 22. FitMesh dichiarato integrato con TUTTI i data type Samsung ───────
const FITMESH_ALL_SAMSUNG_TYPES = /fitmesh\s+(legge|integra|supporta|importa|reads?|integrates?|supports?|imports?)\s+(tutti i (tipi di )?data type|tutti i dati|all\s+(the\s+)?data types?).{0,40}samsung/i;
lines.forEach((line, i) => {
  if (FITMESH_ALL_SAMSUNG_TYPES.test(line)) {
    errors.push(`[fitmesh-tutti-i-data-type] riga ${i + 1}: "${line.trim().slice(0, 140)}"`);
  }
});

if (errors.length > 0) {
  console.error(`❌ Galaxy Watch article claims guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✅ Galaxy Watch article claims guardrail OK: nessun claim bandito trovato in ${TARGET}.`);
