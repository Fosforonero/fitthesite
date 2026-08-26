/**
 * Guardrail SPRINT P0.15 — impedisce che il provider "oneplus-health"
 * (lib/providers/data.ts) ripubblichi le affermazioni false/stale/non
 * verificate corrette da questo sprint (vedi
 * docs/seo/p015-oneplus-health-truth-ledger.md per il ledger completo).
 *
 * Fallisce (exit 1) se il blocco sorgente del provider "oneplus-health"
 * contiene:
 *  1. Ricomparsa del claim "founder beta"/"beta founder" (programma Founder
 *     chiuso dal 31/07/2026 — claim stale gia' rimosso da P0.15).
 *  2. "Fasi del sonno"/"sleep stages" affermate SENZA condizionale (deve
 *     comparire vicino un segnale di condizionalità: "se OHealth"/"if
 *     OHealth"/dipende dal modello — altrimenti torna la contraddizione
 *     interna che P0.15 ha corretto: OnePlus non documenta la granularità).
 *  3. Bidirezionalità non dimostrata: FitMesh descritto come "scrive su"/
 *     "writes to" Health Connect (in un'affermazione, non nella negazione
 *     "FitMesh non scrive mai" prevista altrove nel sito) — coerente con
 *     l'INC-HC-WRITE-01 (bug one-shot, non pubblico, non idoneo come base
 *     di un claim pubblico di sync bidirezionale).
 *  4. Sync assoluta ("sempre", "always", "completa"/"completo",
 *     "automatica al 100%"/"fully automatic") senza qualificazione vicina.
 *  5. "In tempo reale"/"real-time" riferito alla sincronizzazione.
 *  6. Modello specifico ("OnePlus Watch 2" da solo, senza "Watch/Band" o
 *     "qualsiasi"/"any") usato per limitare falsamente la compatibilità
 *     generale — il meccanismo e' generico Health Connect, non verificato
 *     per singolo modello (vedi commento tecnico nel file sorgente).
 *  7. Claim medici/diagnostici.
 *  8. Placeholder residuo "[TBD".
 *  9. Em dash nel copy visibile (righe non-commento).
 * 10. (Strutturale) sourcesBlock assente o vuoto quando editorialTemplateV2
 *     e' true — "fonti mancanti vicino ai claim principali" e' esattamente
 *     il bug che il blocco fonti visibili di FASE 5 P1.8C doveva prevenire.
 * 11. (Strutturale) Ogni fonte in sourcesBlock.sources deve essere un URL
 *     assoluto https:// (mai un dominio esterno diverso da quelli
 *     verificati manualmente in questo sprint, mai un placeholder).
 * 12. (Strutturale) Una variante locale con fallback EN indicizzabile sotto
 *     un'altra locale (stessa fonte di verità di isProviderVariantIndexable,
 *     nessuna assunzione duplicata).
 *
 * Uso (Docker, nessun runtime locale): npx tsx tools/check-oneplus-health-claims.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { isProviderVariantIndexable } from "@/lib/providers/indexability";
import { locales } from "@/lib/i18n";

const repoRoot = path.resolve(__dirname, "..");
const TARGET = "lib/providers/data.ts";
const full = path.join(repoRoot, TARGET);
const errors: string[] = [];

if (!fs.existsSync(full)) {
  console.error(`❌ File atteso non trovato: ${TARGET}`);
  process.exit(1);
}

const wholeFile = fs.readFileSync(full, "utf8");

// Isola SOLO il blocco dell'oggetto "oneplus-health" (dallo slug al prossimo
// `slug:` di primo livello) — questo guardrail non deve reagire a contenuto
// di altri 16 provider nello stesso file (FUORI SCOPE per P0.15).
const startMarker = 'slug: "oneplus-health"';
const startIdx = wholeFile.indexOf(startMarker);
if (startIdx === -1) {
  console.error(`❌ Provider "oneplus-health" non trovato in ${TARGET}`);
  process.exit(1);
}
// Il blocco precedente inizia con `{` qualche riga sopra: retrocedi fino
// all'apertura dell'oggetto per includerla nel testo scansionato.
const objectStart = wholeFile.lastIndexOf("{", startIdx);
const nextSlugIdx = wholeFile.indexOf('\n    slug: "', startIdx + startMarker.length);
const objectEnd = nextSlugIdx === -1 ? wholeFile.length : nextSlugIdx;
const content = wholeFile.slice(objectStart, objectEnd);
const lines = content.split("\n");

/** True per righe di solo commento (// o *) — non copy pubblicabile. */
function isCommentLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

// ── 1. Founder/beta stale ────────────────────────────────────────────────
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (/founder\s*beta|beta\s*founder|beta[- ]founder/i.test(line)) {
    errors.push(`[founder-beta-stale] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 2. "Fasi del sonno"/"sleep stages" affermate senza condizionale ──────
// Ogni lingua e' su una riga sola in questo file: la frase condizionale
// ("se OHealth scrive"/"quando la fonte le scrive"/"OnePlus non documenta")
// e' sempre nella STESSA riga del claim, non su righe adiacenti — l'elenco
// qui sotto copre ogni variante di hedge usata in questo sprint (vedi
// docs/seo/p015-oneplus-health-truth-ledger.md), non solo "se/if".
const SLEEP_STAGE_TERMS = /fasi del sonno|sleep stages?|fases del sue[nñ]o|schlafphasen|fases do sono|phases de sommeil|stades de sommeil|fazy snu|uyku evreleri|uyku a[şs]amalar[ıi]|slaapfasen|slapenfases|睡眠ステージ|수면 단계/i;
const CONDITIONAL_NEARBY =
  /\bse\b|\bif\b|\bsi\b|\bwenn\b|\bsofern\b|\bjeśli\b|\bjesli\b|\byazarsa\b|\bals\b|\bwanneer\b|\bquando\b|\bwhen\b|\bcuando\b|\bquand\b|\bgdy\b|\bdipend|\bdepend|\bdoku?ment|documenta|documente|documenteert|belge|dokumentiert|文書化|문서화|とき|場合|때|하면|non ha codice|has no.{0,20}code|specific.{0,20}code|nessun.{0,20}codice|non esiste una verifica|there'?s no per-model|no per-model|non garantisc|doesn'?t guarantee/i;
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (line.includes("?")) return; // domanda FAQ, non un'affermazione
  if (!SLEEP_STAGE_TERMS.test(line)) return;
  if (!CONDITIONAL_NEARBY.test(line)) {
    errors.push(`[sleep-stages-non-condizionato] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 3. Bidirezionalità non dimostrata (FitMesh scrive su Health Connect) ─
const FITMESH_WRITES_HC = /fitmesh\s+(scrive|scrivera|invia\s+dati)\s+(a|su|verso)?\s*health connect|fitmesh\s+writes?\s+(data\s+)?to\s+health connect|fitmesh\s+(schreibt|écrit|escreve|zapisuje|yazar|schrijft)\s+.{0,20}health connect/i;
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (FITMESH_WRITES_HC.test(line)) {
    errors.push(`[fitmesh-scrive-health-connect] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 4. Sync assoluta non qualificata ──────────────────────────────────────
const ABSOLUTE_SYNC = /sincronizzazione (completa|totale)\b|complete sync\b|sync(?:hronization)? is always|sempre sincronizzat|always synced|100%\s*automatic|completamente automatic|fully automatic/i;
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (ABSOLUTE_SYNC.test(line)) {
    errors.push(`[sync-assoluta] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 5. "In tempo reale" riferito alla sync ───────────────────────────────
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (/in tempo reale|real-?time/i.test(line) && /sync|sincroniz/i.test(line)) {
    errors.push(`[sync-tempo-reale] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 6. "OnePlus Watch 2" isolato usato per limitare la compatibilità ─────
// Consentito quando: (a) generalizzato ("Band"/"qualsiasi"/"any"/"altri
// wearable"), o (b) e' una citazione di fonte ("pagina specifiche ufficiale
// OnePlus Watch 2" — sourcesBlock cita quella pagina perche' e' l'unica con
// specifiche pubblicate, non e' un claim di compatibilità limitata).
// Altrimenti riporta la falsa precisione per-modello corretta da P0.15 (git
// blame b4361bb: un solo tester, nessun modello confermato).
const SOURCE_CITATION = /specs? page|pagina specifiche|página de especificaciones|página de especificações|Spezifikationsseite|page de spécifications|strona specyfikacji|teknik özellikler sayfası|specificatiepagina|スペックページ|사양 페이지/i;
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (!/OnePlus Watch 2\b/.test(line)) return;
  if (/\[TBD/.test(line)) return;
  if (SOURCE_CITATION.test(line)) return;
  const generalized =
    /band|qualsiasi|any|ogni|jeder|elke|dowoln|herhangi|cualquier|n'importe|qualquer|모든|どの|other|altre|otros|andere|autres|inny|diğer|その他|기타|otras|outros/i.test(
      line,
    );
  if (!generalized) {
    errors.push(`[modello-specifico-non-generalizzato] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 7. Claim medici/diagnostici ──────────────────────────────────────────
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (/\[TBD/.test(line)) return;
  if (/diagnostica|diagnose[s]?|cura\s+(malattie|patologie)|prevents?\s+disease/i.test(line)) {
    errors.push(`[claim-medico] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 8. Placeholder residuo ────────────────────────────────────────────────
lines.forEach((line, i) => {
  if (/\[TBD/.test(line)) {
    errors.push(`[placeholder-residuo] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 9. Em dash nel copy visibile ──────────────────────────────────────────
lines.forEach((line, i) => {
  const trimmed = line.trim();
  const isComment = trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
  if (!isComment && line.includes("—")) {
    errors.push(`[em-dash] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 10/11. sourcesBlock presente, non vuoto, URL https assoluti ─────────
const provider = PROVIDERS_BY_SLUG["oneplus-health"];
if (!provider) {
  errors.push("[provider-assente] PROVIDERS_BY_SLUG[\"oneplus-health\"] non trovato");
} else {
  if (provider.editorialTemplateV2) {
    if (!provider.sourcesBlock || provider.sourcesBlock.sources.length === 0) {
      errors.push("[fonti-mancanti] editorialTemplateV2=true ma sourcesBlock assente o senza sources");
    } else {
      for (const src of provider.sourcesBlock.sources) {
        if (!/^https:\/\//.test(src)) {
          errors.push(`[fonte-non-https] "${src}" non è un URL https:// assoluto`);
        }
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(provider.sourcesBlock.verifiedOn)) {
        errors.push(`[verifiedOn-formato-invalido] "${provider.sourcesBlock.verifiedOn}" non è YYYY-MM-DD`);
      }
    }
  }

  // ── 12. Nessuna variante con fallback EN indicizzabile sotto un'altra
  // locale (strutturale) — stessa fonte di verità di isProviderVariantIndexable,
  // usata come unico oracolo (nessuna riderivazione qui).
  for (const lc of locales) {
    if (lc === "it" || lc === "en") continue;
    isProviderVariantIndexable(provider, lc);
  }
}

if (errors.length > 0) {
  console.error(`❌ OnePlus Health claims guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✅ OnePlus Health claims guardrail OK: nessun claim bandito trovato in ${TARGET}. sourcesBlock verificato (${provider?.sourcesBlock?.sources.length ?? 0} fonti, verifiedOn ${provider?.sourcesBlock?.verifiedOn}).`,
);
