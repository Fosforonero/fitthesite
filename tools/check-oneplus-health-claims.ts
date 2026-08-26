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
 * 13. (Strutturale, P0.15-A) La pill "sleep" del provider risolto a runtime
 *     NON deve coincidere con la label incondizionata condivisa da
 *     STD_DATA_TYPES ("Sonno con fasi"/"Sleep with stages") — impedisce un
 *     ritorno indiretto alla label bandita se in futuro qualcuno rimuove
 *     l'override `.map()` e torna a `STD_DATA_TYPES(...)` nudo (quella
 *     stringa non e' testo dentro il blocco oneplus-health, vive nella
 *     funzione condivisa altrove nel file: un controllo per-riga come i
 *     punti 1-9 non la vedrebbe mai, serve leggere il valore risolto).
 * 14. (Strutturale, MICRO-GATE P0.15-B — RETTIFICATA) La pill "spo2" deve
 *     restare `supported: true`: il Watch 2 ha un pulsossimetro reale
 *     (pagina /global/oneplus-watch-2/specs, sourcesBlock fonte 1;
 *     corroborato da recensioni indipendenti). Il valore P0.15-A precedente
 *     (`false`) era una conclusione errata basata su una fonte incompleta
 *     (/us/, la cui sezione Sensors omette il pulsossimetro) — vedi
 *     docs/seo/p015-oneplus-health-truth-ledger.md, sezione RETTIFICA.
 * 15. (Strutturale, P0.15-B) Ogni pill con `supported: true` (tranne
 *     "vo2max", gestita a parte dal punto 16) deve portare
 *     `status: "conditional"` — nessuna fonte ufficiale conferma il passo
 *     "C" (OHealth scrive su Health Connect) per NESSUNA metrica OnePlus,
 *     solo un annuncio generico e non qualificato dell'integrazione. Un
 *     valore `true` senza `status: "conditional"` ripeterebbe l'errore
 *     originale: il dispositivo misura non implica che OHealth esporti.
 * 16. (Strutturale, P0.15-B) La pill "vo2max" deve restare
 *     `supported: false`, SENZA condizionale: qui il passo "D" fallisce in
 *     modo assoluto (il plugin Flutter "health" 13.1.4 non espone
 *     `HealthDataType.VO2_MAX`, verificato in health_repository.dart — un
 *     limite del motore di lettura, non un fatto su OnePlus).
 * 17. (P0.15-B) Negazione assoluta del sensore SpO2/pulsossimetro del
 *     dispositivo ("OnePlus Watch 2 non ha un pulsossimetro" e varianti) —
 *     il claim retrattato da questo micro-gate: il sensore esiste
 *     (pagina /global/specs, recensioni indipendenti).
 * 18. (P0.15-B) "OnePlus non documenta le fasi del sonno" in senso
 *     ASSOLUTO (senza nominare l'esportazione/Health Connect/OHealth
 *     scrive vicino al claim) — falso: OnePlus documenta le fasi come
 *     funzione di prodotto (specs page). Cio' che non documenta e' SE/COME
 *     OHealth le esporta su Health Connect: quel claim piu' preciso resta
 *     permesso.
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
  /\bse\b|\bif\b|\bsi\b|\bwenn\b|\bsofern\b|\bjeśli\b|\bjesli\b|\byazarsa\b|\bals\b|\bwanneer\b|\bquando\b|\bwhen\b|\bcuando\b|\bquand\b|\bgdy\b|\bdipend|\bdepend|\bhängt\b|\bdépend|\bbağlı|\bhangt\b|\bzależy\b|\bdoku?ment|documenta|documente|documenteert|belge|dokumentiert|文書化|문서화|とき|場合|때|하면|によって異なる|異なります|다릅니다|따라 다름|non ha codice|has no.{0,20}code|specific.{0,20}code|nessun.{0,20}codice|non esiste una verifica|there'?s no per-model|no per-model|non garantisc|doesn'?t guarantee/i;
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (line.includes("?")) return; // domanda FAQ, non un'affermazione
  if (!SLEEP_STAGE_TERMS.test(line)) return;
  if (!CONDITIONAL_NEARBY.test(line)) {
    errors.push(`[sleep-stages-non-condizionato] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 17. (P0.15-B) Negazione assoluta del sensore SpO2/pulsossimetro ──────
// Il claim retrattato: il Watch 2 HA un pulsossimetro reale (pagina
// /global/specs, sourcesBlock fonte 1). Copre IT/EN più le varianti piu'
// probabili nelle altre lingue di questo sprint.
const DEVICE_SPO2_NEGATION =
  /non ha (?:un |alcun )?(?:pulsossimetro|sensore (?:di )?(?:spo2|spo₂|ossigeno))|nessun (?:sensore )?(?:pulsossimetro|spo2|spo₂)|does(?:n'?t| not) have (?:a |any )?(?:pulse oximeter|spo2 sensor|spo₂ sensor|blood oxygen sensor)|(?:has |with )?no pulse oximeter|lacks? (?:a |an )?pulse oximeter|kein(?:en)? pulsoximeter|sans pulsoxym[eè]tre|sem oxímetro|pulsossimetro assente/i;
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (DEVICE_SPO2_NEGATION.test(line)) {
    errors.push(`[spo2-negazione-dispositivo] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
  }
});

// ── 18. (P0.15-B) "OnePlus non documenta le fasi del sonno" ASSOLUTO ─────
// Falso: OnePlus documenta le fasi come funzione di prodotto (specs page).
// Il claim corretto e piu' preciso — "non documenta SE/COME OHealth le
// esporta su Health Connect" — resta permesso: fallisce solo quando la
// negazione compare SENZA alcun riferimento vicino all'esportazione/
// Health Connect/scrittura, cioe' quando suona come "la funzione non e'
// documentata" invece di "l'esportazione non e' documentata".
const DOC_NEGATION =
  /non documenta|doesn'?t document|does not document|nie dokumentuje|ne documente pas|dokumentiert.{0,20}nicht|não documenta|belgelemez|documenteert niet/i;
const EXPORT_QUALIFIER_NEARBY =
  /esport|export|health connect|scrive|writes?\b|dettagli|detail|granularit|schreibt|écrit|grava|yazar|schrijft|zapisuje|pisze/i;
lines.forEach((line, i) => {
  if (isCommentLine(line)) return;
  if (line.includes("?")) return;
  if (!SLEEP_STAGE_TERMS.test(line)) return;
  if (!DOC_NEGATION.test(line)) return;
  if (EXPORT_QUALIFIER_NEARBY.test(line)) return; // qualificato correttamente sull'esportazione
  errors.push(`[fasi-sonno-non-documentate-assoluto] riga ${i + 1}: "${line.trim().slice(0, 160)}"`);
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

  // ── 13. Pill "sleep" risolta a runtime: mai la label incondizionata
  // condivisa da STD_DATA_TYPES. Confronto sul VALORE risolto, non sul
  // testo sorgente — l'unico modo di intercettare una rimozione silenziosa
  // dell'override `.map()` (la stringa bandita non vive nel blocco
  // oneplus-health, vive nella funzione condivisa altrove nel file).
  const BANNED_SLEEP_LABEL: Record<string, string> = {
    it: "Sonno con fasi",
    en: "Sleep with stages",
  };
  const sleepType = provider.dataTypes.find((d) => d.key === "sleep");
  if (!sleepType) {
    errors.push('[sleep-pill-assente] nessun dataType con key "sleep" trovato per oneplus-health');
  } else {
    for (const [lc, banned] of Object.entries(BANNED_SLEEP_LABEL)) {
      const actual = (sleepType.label as Record<string, string | undefined>)[lc];
      if (actual === banned) {
        errors.push(
          `[sleep-pill-label-incondizionata] label.${lc} = "${actual}" — identica al default condiviso STD_DATA_TYPES, l'override P0.15-A e' stato rimosso o bypassato`,
        );
      }
    }
  }

  // ── 14. (RETTIFICATA P0.15-B) Pill "spo2" risolta a runtime: deve
  // restare supported:true — il Watch 2 ha un pulsossimetro reale (pagina
  // /global/specs, sourcesBlock fonte 1; corroborato da recensioni
  // indipendenti). Il valore P0.15-A (false) era una conclusione errata
  // basata sulla pagina /us/, la cui sezione Sensors omette il
  // pulsossimetro — vedi ledger, sezione RETTIFICA.
  const spo2Type = provider.dataTypes.find((d) => d.key === "spo2");
  if (spo2Type?.supported !== true) {
    errors.push(
      '[spo2-falsa-negazione] dataTypes "spo2".supported non e\' true: il Watch 2 ha un pulsossimetro reale, vedi ledger sezione RETTIFICA P0.15-B (non ripetere l\'errore basato sulla fonte /us/ incompleta)',
    );
  }

  // ── 15. (P0.15-B) Ogni pill supported:true (tranne "vo2max", vedi 16)
  // deve portare status:"conditional" — nessuna fonte ufficiale conferma
  // il passo "C" (OHealth scrive su Health Connect) per NESSUNA metrica
  // OnePlus. Un `true` senza "conditional" ripeterebbe l'errore originale:
  // dispositivo-misura non implica OHealth-esporta.
  for (const d of provider.dataTypes) {
    if (d.key === "vo2max") continue;
    if (d.supported === true && d.status !== "conditional") {
      errors.push(
        `[pill-supported-senza-condizionale] dataTypes."${d.key}".supported=true ma status non e' "conditional" — nessuna fonte ufficiale conferma il passo C (OHealth scrive su Health Connect) per questa metrica`,
      );
    }
  }

  // ── 16. (P0.15-B) La pill "vo2max" deve restare supported:false, SENZA
  // condizionale: qui il passo "D" fallisce in modo assoluto (il plugin
  // Flutter "health" 13.1.4 non espone HealthDataType.VO2_MAX, verificato
  // in health_repository.dart — limite del motore, non fatto su OnePlus).
  const vo2maxType = provider.dataTypes.find((d) => d.key === "vo2max");
  if (vo2maxType?.supported !== false) {
    errors.push(
      '[vo2max-supportato-senza-prova] dataTypes "vo2max".supported deve restare false: il plugin health 13.1.4 non espone VO2_MAX, indipendentemente dalla fonte',
    );
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
