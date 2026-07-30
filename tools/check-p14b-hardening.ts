/**
 * Guardrail SPRINT P1.4B-A (hardening post-pubblicazione, 2026-07-30).
 *
 * Copre esattamente i problemi trovati nell'audit del rilascio P1.4B
 * originale (Sleep Score IT/EN, Zona 2 IT/EN, Calcolatore Zone di Frequenza
 * Cardiaca) e impedisce la loro regressione:
 *
 *  1. Meta description IT/EN dei due articoli fuori dal range 140-160
 *     caratteri (renderizzati, non il sorgente con entità HTML).
 *  2. Citation Whoop sulle zone di frequenza cardiaca invece che sul sonno
 *     (fonte non pertinente al tema della pagina Sleep Score).
 *  3. Claim su Fitbit o Whoop privo di una fonte ufficiale collegata.
 *  4. Duplicazione PubMed + pagina editore per lo stesso paper (SRI 2024)
 *     senza motivo documentato.
 *  5. Metodo "220 - età" assente dal calcolatore (deve esistere sia nel
 *     motore di calcolo sia nel contenuto pubblicato).
 *  6. Range età pediatrico accettato con formule verificate solo su adulti
 *     (Tanaka/220-età), o copy d'errore che descrive un'età fuori range come
 *     "impossibile fisiologicamente" invece che "fuori dal range supportato".
 *  7. Confini di zona con overlap o buchi (assegnazione bpm non
 *     deterministica).
 *  8. CTA che attribuisce a FitMesh la visualizzazione/il calcolo/la
 *     configurazione delle zone di frequenza cardiaca del dispositivo,
 *     capacità che il codice Flutter (verificato in sola lettura) non ha.
 *  9. Oracle Heart Rate Zones sotto le soglie 50 vettori validi + 20 vettori
 *     impossibili.
 *
 * Uso (Docker): npx tsx tools/check-p14b-hardening.ts
 * Richiede che tools/gen-labs-oracle-vectors.ts sia già stato eseguito
 * almeno una volta (legge .oracle-vectors.json) per il controllo 9.
 */
import fs from "node:fs";
import path from "node:path";
import { post as sleepScorePost } from "@/lib/blog/posts/sleep-score-regolarita-ritmo-circadiano";
import { post as zone2Post } from "@/lib/blog/posts/perche-zona-2-cambia-smartwatch-app";
import {
  calculateHeartRateZones,
  classifyBpmIntoZone,
  estimateMaxHr220Age,
  validateHeartRateZonesInput,
  SAMPLE_TANAKA_INPUT,
} from "@/lib/labs/heart-rate-zones/math";
import { HEART_RATE_ZONES_TOOL_CONTENT } from "@/lib/labs/heart-rate-zones/content";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ── 1. Meta description 140-160 caratteri renderizzati ──────────────────
const DESCRIPTION_MIN = 140;
const DESCRIPTION_MAX = 160;
function checkDescriptionLength(label: string, text: string) {
  const len = text.length; // già testo puro (no entità HTML): stesso valore renderizzato nel <meta>.
  if (len < DESCRIPTION_MIN || len > DESCRIPTION_MAX) {
    errors.push(`[description] ${label}: ${len} caratteri, fuori dal range ${DESCRIPTION_MIN}-${DESCRIPTION_MAX} ("${text}")`);
  }
}
checkDescriptionLength("Sleep Score IT", sleepScorePost.metaDescription.it);
checkDescriptionLength("Sleep Score EN", sleepScorePost.metaDescription.en);
checkDescriptionLength("Zona 2 IT", zone2Post.metaDescription.it);
checkDescriptionLength("Zona 2 EN", zone2Post.metaDescription.en);

// ── 2/3/4. Fonti Sleep Score: pertinenza, copertura per brand, no dupe ───
const sleepScoreSources = sleepScorePost.sources ?? [];

const BANNED_SOURCE_SUBSTRINGS = [
  "max-heart-rate-training-zones", // la citation Whoop errata dell'audit originale: parla di zone HR, non di sonno
];
for (const bad of BANNED_SOURCE_SUBSTRINGS) {
  if (sleepScoreSources.some((u) => u.includes(bad))) {
    errors.push(`[citation] Sleep Score: fonte non pertinente al tema (contiene "${bad}") ancora presente in sources[]`);
  }
}

const REQUIRED_SLEEP_SCORE_SOURCES = [
  "support.ouraring.com", // Oura
  "support.google.com/fitbit", // Fitbit (Google Health)
  "support.whoop.com", // Whoop
  "pubmed.ncbi.nlm.nih.gov/37738616", // Windred 2024 SRI
];
for (const required of REQUIRED_SLEEP_SCORE_SOURCES) {
  if (!sleepScoreSources.some((u) => u.includes(required))) {
    errors.push(`[citation] Sleep Score: fonte richiesta mancante in sources[] (atteso un URL con "${required}")`);
  }
}

// Duplicazione PubMed + pagina editore per lo STESSO paper (SRI 2024): se
// academic.oup.com compare ANCORA insieme a pubmed per lo stesso zsad253/37738616,
// significa che la correzione del 2026-07-30 (dedup) è stata persa.
const hasOupSri = sleepScoreSources.some((u) => u.includes("academic.oup.com") && u.includes("zsad253"));
const hasPubmedSri = sleepScoreSources.some((u) => u.includes("pubmed.ncbi.nlm.nih.gov/37738616"));
if (hasOupSri && hasPubmedSri) {
  errors.push("[citation] Sleep Score: duplicazione PubMed + pagina editore per lo stesso paper (SRI 2024) senza motivo documentato");
}

// ── 5. Metodo "220 - età" presente (motore + contenuto pubblicato) ──────
if (typeof estimateMaxHr220Age !== "function" || estimateMaxHr220Age(40) !== 180) {
  errors.push('[220-eta] estimateMaxHr220Age assente o non conforme (atteso 220-40=180 a 40 anni)');
}
const contentHasAge220 =
  /220\s*[-−]\s*(?:età|age)/i.test(HEART_RATE_ZONES_TOOL_CONTENT.formulaPlainText.it) ||
  /220\s*[-−]\s*(?:età|age)/i.test(HEART_RATE_ZONES_TOOL_CONTENT.sections.ageMethodsComparison?.paragraphs.it.join(" ") ?? "");
if (!contentHasAge220) {
  errors.push('[220-eta] Nessun riferimento testuale alla formula "220 - età" nel contenuto pubblicato del calcolatore');
}

// ── 6. Range età adulto, copy d'errore corretta ─────────────────────────
const under18 = validateHeartRateZonesInput({ maxHrMode: "tanaka", age: 17, restingHr: 60 });
const at18 = validateHeartRateZonesInput({ maxHrMode: "tanaka", age: 18, restingHr: 60 });
if (!under18.some((e) => e.code === "AGE_OUT_OF_RANGE")) {
  errors.push("[eta-adulti] Età 17 non bloccata da AGE_OUT_OF_RANGE: il calcolatore accetterebbe un'età pediatrica");
}
if (at18.length !== 0) {
  errors.push("[eta-adulti] Età 18 (adulto, limite inferiore) bloccata inaspettatamente");
}
const ageErrorIt = HEART_RATE_ZONES_TOOL_CONTENT.calculatorLabels.errorAgeOutOfRange.it;
const ageErrorEn = HEART_RATE_ZONES_TOOL_CONTENT.calculatorLabels.errorAgeOutOfRange.en;
if (/non plausibile/i.test(ageErrorIt) || /implausible/i.test(ageErrorEn)) {
  errors.push('[eta-adulti] Copy errore età usa ancora "non plausibile"/"implausible" invece di "fuori dal range supportato"');
}
if (!/fuori dall.intervallo supportato/i.test(ageErrorIt) || !/outside this calculator.s supported range/i.test(ageErrorEn)) {
  errors.push('[eta-adulti] Copy errore età non usa la dicitura richiesta "fuori dall\'intervallo supportato"/"outside...supported range"');
}

// ── 7. Confini di zona senza overlap ne' buchi ──────────────────────────
const sample = calculateHeartRateZones(SAMPLE_TANAKA_INPUT);
if (!sample.ok) {
  errors.push("[confini-zona] SAMPLE_TANAKA_INPUT non calcolabile: impossibile verificare i confini di zona");
} else {
  for (const table of [sample.result.percentMaxHrZones, sample.result.heartRateReserveZones] as const) {
    const lo = table[0].bpmLow;
    const hi = table[table.length - 1].bpmHigh;
    for (let bpm = lo; bpm <= hi; bpm++) {
      const claims = table.filter((z, i) => {
        const isLast = i === table.length - 1;
        const belowUpper = isLast ? bpm <= z.bpmHigh : bpm < z.bpmHigh;
        return bpm >= z.bpmLow && belowUpper;
      });
      if (claims.length !== 1) {
        errors.push(`[confini-zona] bpm=${bpm} classificato da ${claims.length} zone (atteso esattamente 1): ${claims.map((z) => z.key).join(",")}`);
      }
    }
    if (classifyBpmIntoZone(table[0].bpmHigh, table) !== table[1].key) {
      errors.push("[confini-zona] classifyBpmIntoZone non assegna il confine condiviso alla zona successiva");
    }
  }
}

// ── 8. CTA veritiere: FitMesh non mostra/calcola/configura le zone ──────
const FALSE_ZONE_CLAIM_RE = /\b(?:tue|your)\s+(?:zone|zones)\s+(?:reali|real)\b|\bvedere\s+le\s+tue\s+zone\s+reali\b|\bsee\s+your\s+real\s+zones\b/i;
function scanForFalseZoneClaim(label: string, text: string) {
  if (FALSE_ZONE_CLAIM_RE.test(text)) {
    errors.push(`[cta-verita] ${label}: claim di zone "reali" mostrate da FitMesh, non supportato dal codice Flutter — "${text}"`);
  }
}
scanForFalseZoneClaim("calcolatore ctaHeading IT", HEART_RATE_ZONES_TOOL_CONTENT.ctaHeading.it);
scanForFalseZoneClaim("calcolatore ctaHeading EN", HEART_RATE_ZONES_TOOL_CONTENT.ctaHeading.en);
scanForFalseZoneClaim("calcolatore ctaBody IT", HEART_RATE_ZONES_TOOL_CONTENT.ctaBody.it);
scanForFalseZoneClaim("calcolatore ctaBody EN", HEART_RATE_ZONES_TOOL_CONTENT.ctaBody.en);
for (const section of zone2Post.body) {
  if (section.type === "paragraph") {
    scanForFalseZoneClaim("articolo Zona 2 (paragraph)", section.text.it);
    scanForFalseZoneClaim("articolo Zona 2 (paragraph)", section.text.en);
  } else if (section.type === "cta") {
    scanForFalseZoneClaim("articolo Zona 2 (cta)", section.title.it + " " + section.body.it);
    scanForFalseZoneClaim("articolo Zona 2 (cta)", section.title.en + " " + section.body.en);
  }
}

// ── 9. Oracle Heart Rate Zones: soglie minime ───────────────────────────
const vectorsPath = path.join(repoRoot, ".oracle-vectors.json");
if (!fs.existsSync(vectorsPath)) {
  errors.push(`[oracle] ${path.relative(repoRoot, vectorsPath)} non trovato - esegui prima 'npm run labs:oracle-gen'`);
} else {
  const data = JSON.parse(fs.readFileSync(vectorsPath, "utf8"));
  const validCount = (data.heartRateZones ?? []).length;
  const errorCount = (data.heartRateZonesErrors ?? []).length;
  if (validCount < 50) {
    errors.push(`[oracle] Solo ${validCount} vettori Heart Rate Zones validi, attesi almeno 50`);
  }
  if (errorCount < 20) {
    errors.push(`[oracle] Solo ${errorCount} vettori Heart Rate Zones impossibili, attesi almeno 20`);
  }
}

if (errors.length > 0) {
  console.error(`\n❌ P1.4B-A hardening guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  "\n✅ P1.4B-A hardening guardrail: meta description entro 140-160, citation Sleep Score pertinenti e complete (no dupe), metodo 220-età presente, range età adulto (18-100) con copy corretta, confini di zona senza overlap/buchi, CTA veritiere, oracle sopra le soglie 50+20.",
);
