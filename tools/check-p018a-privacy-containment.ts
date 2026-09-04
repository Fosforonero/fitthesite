#!/usr/bin/env tsx
/**
 * P0.18A — guardrail permanente di non-regressione sui claim privacy rimossi.
 *
 * SCOPO E PERIMETRO (leggere prima di estendere)
 * ------------------------------------------------
 * Questo NON è un guardrail sitewide: copre SOLO le 9 superfici toccate dal
 * micro-sprint P0.18A (hotfix "privacy containment"), impedendo che i claim
 * rimossi lì rientrino per regressione. Il resto del sito (in particolare
 * ~20 blog post con "GDPR compliant"/"server UE"/tempistiche di cancellazione
 * non provate, già inventariati in P018-inventario-privacy-claims.md) resta
 * PENDING per un giro successivo — NON è coperto qui di proposito, e non va
 * aggiunto a questo file per "farlo verde": va corretto nel contenuto, poi
 * aggiunto alla lista FILES sotto.
 *
 * Le 7 categorie vietate (via GO "P0.18A PRIVACY CONTAINMENT"):
 *   1. GDPR usato come certificazione/bollino ("GDPR compliant", "100% GDPR",
 *      "GDPR certified" e equivalenti in altre lingue) — NON i riferimenti
 *      informativi reali a diritti/articoli GDPR.
 *   2. "Actually private" / promesse assolute di privacy incondizionata.
 *   3. "server UE"/"EU servers" come claim di esclusività non provata.
 *   4. "Data not collected" assoluto, quando esistono account/dati sanitari.
 *   5. Cancellazione garantita entro 24/48 ore, "one-click deletion",
 *      rimozione immediata di ogni copia.
 *   6. Prezzo numerico obsoleto (fuori scope qui: nessun prezzo hardcoded
 *      nelle superfici coperte da questo file — vedi P018-inventario).
 *   7. Programma Founder presentato come attualmente disponibile.
 *
 * Ogni check instrada la violazione su TRUE ERROR (bloccante, file
 * pubblicamente indicizzabile) solo per i file in questo elenco: sono TUTTI
 * pubblici e indicizzabili, quindi qui non serve il routing locale/SSOT usato
 * da altri guardrail di questo repo — ogni occorrenza è già in scope reale.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

type Category =
  | "gdpr_as_certification"
  | "actually_private"
  | "eu_servers_exclusive"
  | "data_not_collected_absolute"
  | "unproven_deletion_timing"
  | "founder_current_availability";

/**
 * Per file: quali categorie sono state EFFETTIVAMENTE corrette in P0.18A —
 * solo quelle vengono controllate qui. Un file può contenere claim di una
 * categoria mai toccata in questo sprint (es. "server UE" in press/page.tsx,
 * deliberatamente fuori scope): quel claim non è una regressione, perché non
 * è mai stato rimosso. Aggiungerlo a "categories" qui SOLO dopo averlo
 * effettivamente corretto nel file, non prima.
 *
 * `fromLine`: se impostato, scansiona solo da quella riga in poi (1-based) —
 * usato per famiglia/page.tsx, dove le righe 47-1370 sono un COPY object
 * dead-code (COMING_SOON=true, mai renderizzato) con GDPR/prezzi Founder
 * intenzionalmente NON toccati; il bullet vivo corretto vive dentro
 * ComingSoonState() a partire dalla riga 1375.
 */
const FILES: Array<{ path: string; categories: Category[]; fromLine?: number }> = [
  { path: "lib/content/homepage-copy.ts", categories: ["eu_servers_exclusive", "gdpr_as_certification", "unproven_deletion_timing"] },
  { path: "app/(frontend)/[locale]/(marketing)/page.tsx", categories: ["gdpr_as_certification"] }, // "EU servers" resta lecito nel commento esplicativo che lo cita come rimosso
  { path: "components/TrustBadges.tsx", categories: ["eu_servers_exclusive", "gdpr_as_certification"] },
  { path: "lib/content/about-copy.ts", categories: ["eu_servers_exclusive", "actually_private", "gdpr_as_certification", "unproven_deletion_timing"] },
  { path: "lib/content/self-host-copy.ts", categories: ["unproven_deletion_timing"] },
  { path: "lib/providers/data.ts", categories: ["eu_servers_exclusive"] },
  { path: "app/(frontend)/[locale]/(marketing)/press/page.tsx", categories: ["gdpr_as_certification"] }, // "server UE"/"EU servers" qui restano fuori scope di proposito
  { path: "app/(frontend)/[locale]/(marketing)/famiglia/page.tsx", categories: ["gdpr_as_certification"], fromLine: 1375 },
  { path: "app/(frontend)/[locale]/(marketing)/privacy/page.tsx", categories: ["gdpr_as_certification", "unproven_deletion_timing"] },
  { path: "app/(frontend)/[locale]/(marketing)/terms/page.tsx", categories: ["unproven_deletion_timing"] },
  { path: "lib/seo/entities.ts", categories: ["eu_servers_exclusive"] }, // trovato via QA live sul JSON-LD Person/author bio, non dal primo inventario
];

type Violation = { file: string; line: number; pattern: string; excerpt: string };

// ── Pattern vietati (case-insensitive), con negazione contestuale minima ────

function windowAround(text: string, index: number, radius = 60): string {
  return text.slice(Math.max(0, index - radius), Math.min(text.length, index + radius));
}

/** Categoria 1: GDPR come bollino isolato — "GDPR compliant"/"GDPR-compliant"/
 * "100% GDPR"/"GDPR certified" e le varianti tradotte già rimosse da questo
 * sprint. NON blocca riferimenti a articoli/diritti (es. "art. 6 GDPR",
 * "diritto alla cancellazione (GDPR)"). */
const GDPR_CERT_SUFFIX_RE =
  /\b(GDPR|RGPD|DSGVO|RODO|AVG|KVKK)[\s-]?(compliant|compliance|conform[ei]?|-konform|kompatibel|uyumlu|yhteensopiv\w*|準拠|준수)/gi;
const GDPR_CERT_PREFIX_RE =
  /\b(\d{1,3}\s?%\s*|conform[ei]?\s+(al|a|alla|au|zu|to|con)?\s*|compliant\s+with\s*|compliance\s+(con|with|avec)?\s*|full\s+)(GDPR|RGPD|DSGVO|RODO|AVG|KVKK)\b/gi;
const GDPR_INFORMATIVE_HINT = /art\.?\s?\d|artikel|article|articolo|diritt[oi]|right[s]?|derecho/i;

function checkGdprCertification(text: string): Array<{ index: number; match: string }> {
  const hits: Array<{ index: number; match: string }> = [];
  for (const re of [GDPR_CERT_SUFFIX_RE, GDPR_CERT_PREFIX_RE]) {
    for (const m of text.matchAll(re)) {
      const idx = m.index ?? 0;
      const ctx = windowAround(text, idx, 40);
      if (GDPR_INFORMATIVE_HINT.test(ctx)) continue; // riferimento normativo reale, non bollino
      hits.push({ index: idx, match: m[0] });
    }
  }
  return hits;
}

/** Categoria 2: promesse assolute "actually/davvero/realmente privato" senza
 * qualificazione (label neutra "Privacy e controllo dei dati" è ammessa e non
 * matcha questo pattern). */
const ACTUALLY_PRIVATE_RE =
  /\b(actually|davvero|realmente|wirklich|vraiment)\s+privat[ae]?\b|privacy:\s*(no compromise|nessun compromesso)/gi;

/** Categoria 3: "server UE"/"EU servers" come claim di esclusività — solo
 * quando non è già una lista di provider/regioni con eccezioni esplicite. Le
 * 9 superfici coperte qui sono già state ripulite: qualunque occorrenza
 * residua è una regressione. */
const EU_SERVERS_RE =
  /\b(server[i]?\s+(in\s+)?UE\b|EU\s+servers?\b|servidor(es)?\s+(en|na)\s+la?\s?UE\b|EU-Server\b|serveurs?\s+UE\b|serwery\s+w\s+UE\b|AB\s+sunucular[ıi]\b|EU-servers?\b|EU-cloud\b|EU\s+cloud\b|cloud\s+FitMesh\s+EU\b|FitMesh\s+EU\s+cloud\b)/gi;

/** Categoria 4: "non raccogliamo dati"/"data not collected" assoluto. */
const DATA_NOT_COLLECTED_RE =
  /\bdata\s+not\s+collected\b|\bnon\s+raccogliamo\s+(alcun\s+)?dat[oi]\s+(personal[ei]?)?\b|\bwe\s+don'?t\s+collect\s+any\s+data\b/gi;

/** Categoria 5: cancellazione garantita entro N ore, one-click deletion. */
const DELETION_TIMING_RE =
  /\b(cancellazione|eliminazione|delete|deletion|suppression|löschung|eliminación|exclusão)\b(?:\s+\S+){0,3}?\s+(in|entro|within|dans les|en un plazo de|em até|innerhalb von)\s*\d{1,3}\s*(ore|hours?|horas?|heures?|stunden)\b|\bone-?click\s+delet(ion|e)\b|\bun\s+click.*tutto\s+è\s+cancellat[oi]\b/gi;

/** Categoria 7: Founder presentato come disponibile ORA (CTA/countdown), non
 * una menzione storica. Cerca verbi al presente/futuro immediato accanto a
 * "Founder" SENZA marcatori di chiusura nelle vicinanze. */
const FOUNDER_LIVE_RE = /\bfounder\b/gi;
const FOUNDER_CLOSED_HINT =
  /chius[oa]|closed|31\s*(luglio|july)|program.*(end|ended|termin)|storic[oa]|historical|cutoff|posti\s+(esauriti|usati)/i;

function checkFounderLive(text: string): Array<{ index: number; match: string }> {
  const hits: Array<{ index: number; match: string }> = [];
  for (const m of text.matchAll(FOUNDER_LIVE_RE)) {
    const idx = m.index ?? 0;
    const ctx = windowAround(text, idx, 150);
    if (FOUNDER_CLOSED_HINT.test(ctx)) continue;
    // Solo se accanto compare un verbo/CTA di azione corrente (join/attiva/unisciti/become)
    if (!/\b(join|unisciti|diventa|become|attiva|sign up|iscriviti|claim your|get founder)\b/i.test(ctx)) continue;
    hits.push({ index: idx, match: m[0] });
  }
  return hits;
}

function scanFile(entry: { path: string; categories: Category[]; fromLine?: number }): Violation[] {
  const abs = join(ROOT, entry.path);
  const fullText = readFileSync(abs, "utf-8");
  const offset = entry.fromLine ? fullText.split("\n").slice(0, entry.fromLine - 1).join("\n").length + 1 : 0;
  const text = entry.fromLine ? fullText.slice(offset) : fullText;
  const violations: Violation[] = [];
  const active = new Set(entry.categories);

  function push(indexInSlice: number, pattern: string) {
    const absoluteIndex = offset + indexInSlice;
    const lineNo = fullText.slice(0, absoluteIndex).split("\n").length;
    violations.push({ file: entry.path, line: lineNo, pattern, excerpt: windowAround(text, indexInSlice, 50).replace(/\s+/g, " ") });
  }

  if (active.has("gdpr_as_certification")) for (const h of checkGdprCertification(text)) push(h.index, `gdpr_as_certification: "${h.match}"`);
  if (active.has("actually_private")) for (const m of text.matchAll(ACTUALLY_PRIVATE_RE)) push(m.index ?? 0, `actually_private: "${m[0]}"`);
  if (active.has("eu_servers_exclusive")) for (const m of text.matchAll(EU_SERVERS_RE)) push(m.index ?? 0, `eu_servers_exclusive: "${m[0]}"`);
  if (active.has("data_not_collected_absolute")) for (const m of text.matchAll(DATA_NOT_COLLECTED_RE)) push(m.index ?? 0, `data_not_collected_absolute: "${m[0]}"`);
  if (active.has("unproven_deletion_timing")) for (const m of text.matchAll(DELETION_TIMING_RE)) push(m.index ?? 0, `unproven_deletion_timing: "${m[0]}"`);
  if (active.has("founder_current_availability")) for (const h of checkFounderLive(text)) push(h.index, `founder_current_availability: "${h.match}"`);

  return violations;
}

// ── Self-test (--self-test) ─────────────────────────────────────────────────

type SelfTestCase = { name: string; text: string; expectViolation: boolean };

const SELF_TESTS: SelfTestCase[] = [
  // 1. gdpr_as_certification — deve scattare
  { name: "GDPR compliant bollino", text: "Fully GDPR compliant. Trust us.", expectViolation: true },
  { name: "100% GDPR variante IT", text: "Conforme al GDPR al 100%, promesso.", expectViolation: true },
  // negativo: riferimento normativo reale
  { name: "GDPR art. 17 riferimento reale — non deve scattare", text: "Hai diritto alla cancellazione ex art. 17 GDPR.", expectViolation: false },
  // 2. actually_private
  { name: "Actually private assoluto", text: "Privacy: no compromise. Actually private, always.", expectViolation: true },
  { name: "Label neutra ammessa — non deve scattare", text: "Privacy e controllo dei dati / Privacy and data control", expectViolation: false },
  // 3. eu_servers_exclusive
  { name: "EU servers claim esclusivo", text: "Your data lives on EU servers, always.", expectViolation: true },
  { name: "server UE variante IT", text: "I tuoi dati restano su server in UE.", expectViolation: true },
  // 4. data_not_collected_absolute
  { name: "Data not collected assoluto", text: "Data not collected. We are invisible.", expectViolation: true },
  { name: "non raccogliamo dati personali", text: "Non raccogliamo dati personali, mai.", expectViolation: true },
  // 5. unproven_deletion_timing
  { name: "cancellazione entro 24 ore", text: "La cancellazione avviene entro 24 ore.", expectViolation: true },
  { name: "deletion within 48 hours", text: "Deletion within 48 hours, guaranteed.", expectViolation: true },
  { name: "one-click deletion", text: "Enjoy one-click deletion of your account.", expectViolation: true },
  // negativo: rimando alla pagina reale, nessun numero assoluto
  {
    name: "rimando a /delete-account senza numero — non deve scattare",
    text: "La cancellazione segue le procedure descritte nella pagina di cancellazione account (fitmesh.fit/delete-account).",
    expectViolation: false,
  },
  // 7. founder_current_availability
  { name: "Founder CTA live", text: "Join the Founder program today and become a Founder now!", expectViolation: true },
  {
    name: "Founder menzione storica — non deve scattare",
    text: "Il programma Founder si è chiuso il 31 luglio 2026 (storico, posti esauriti).",
    expectViolation: false,
  },
  // controllo positivo aggiuntivo: negazione corretta di 'non condividiamo... per pubblicità' non è nel perimetro di questo guardrail (nessun pattern la intercetta) — non serve un caso qui.
];

function runSelfTest(): boolean {
  let ok = true;
  for (const t of SELF_TESTS) {
    const hits = [
      ...checkGdprCertification(t.text).map((h) => `gdpr:${h.match}`),
      ...[...t.text.matchAll(ACTUALLY_PRIVATE_RE)].map((m) => `actually_private:${m[0]}`),
      ...[...t.text.matchAll(EU_SERVERS_RE)].map((m) => `eu_servers:${m[0]}`),
      ...[...t.text.matchAll(DATA_NOT_COLLECTED_RE)].map((m) => `data_not_collected:${m[0]}`),
      ...[...t.text.matchAll(DELETION_TIMING_RE)].map((m) => `deletion_timing:${m[0]}`),
      ...checkFounderLive(t.text).map((h) => `founder_live:${h.match}`),
    ];
    const got = hits.length > 0;
    if (got !== t.expectViolation) {
      ok = false;
      console.error(`  ❌ [self-test] "${t.name}": atteso violation=${t.expectViolation}, ottenuto=${got} (hits: ${hits.join(", ") || "nessuno"})`);
    } else {
      console.log(`  ✓ [self-test] "${t.name}"`);
    }
  }
  return ok;
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const selfTestMode = process.argv.includes("--self-test");

  if (selfTestMode) {
    const ok = runSelfTest();
    if (!ok) {
      console.error("\n❌ P0.18A containment guardrail: self-test FALLITO.");
      process.exit(1);
    }
    console.log(`\n✅ P0.18A containment guardrail: self-test OK (${SELF_TESTS.length} casi).`);
    return;
  }

  const allViolations: Violation[] = [];
  for (const f of FILES) {
    allViolations.push(...scanFile(f));
  }

  if (allViolations.length > 0) {
    console.error(`❌ P0.18A containment guardrail: ${allViolations.length} regressione/i sui claim rimossi:`);
    for (const v of allViolations) {
      console.error(`  - ${v.file}:${v.line} — ${v.pattern}\n      …${v.excerpt}…`);
    }
    process.exit(1);
  }

  const totalCategoryChecks = FILES.reduce((n, f) => n + f.categories.length, 0);
  console.log(
    `✅ P0.18A containment guardrail: zero regressioni — ${FILES.length} file, ${totalCategoryChecks} coppie file/categoria controllate (solo le categorie effettivamente corrette in ciascun file, vedi mappa FILES).`
  );
  console.log(
    "   Perimetro NON sitewide: blog post e altri file fuori da FILES restano PENDING, vedi header di questo file."
  );
}

main();
