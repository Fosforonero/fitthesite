/**
 * Guardrail P0.4D — falsa attribuzione normativa GDPR sulla cancellazione dati.
 *
 * Il GDPR (art. 17, diritto alla cancellazione) NON impone un numero fisso di
 * ore per l'esecuzione di una richiesta di cancellazione: richiede "senza
 * ingiustificato ritardo" (l'art. 12(3) fissa un mese per la RISPOSTA a una
 * richiesta dell'interessato, non per l'esecuzione della cancellazione). Il
 * claim "GDPR/DSGVO/RGPD/AVG/RODO richiede la cancellazione entro N ore" era
 * quindi un'attribuzione normativa falsa, trovata (2026-07-13) in 9 lingue di
 * `beta/page.tsx`, 11 lingue del post blog `sync-them-all.ts`, e in due file
 * `docs/`. Il "48 ore" (o 24, dove il codice lo conferma via
 * `gdpr_process_deletions`/cron) resta un obiettivo operativo interno
 * legittimo da comunicare: il problema era SOLO l'attribuzione al GDPR come
 * requisito legale, non il numero in se'.
 *
 * Questo guardrail NON blocca la citazione corretta e verificata dell'art. 12
 * GDPR (risposta entro 30 giorni a una richiesta dell'interessato) presente in
 * privacy/page.tsx — solo il pattern "cancellazione entro N ore, come
 * richiesto/prescritto dal GDPR/DSGVO/RGPD/AVG/RODO".
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

const SCAN_DIRS = ["app", "components", "lib", "docs"];
const SCAN_EXCLUDE_DIRS = new Set(["node_modules", ".next", ".git"]);

function walk(dir: string, out: string[]) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SCAN_EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|json|md)$/.test(entry.name)) {
      out.push(full);
    }
  }
}

const filesToScan: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), filesToScan);

// Ogni pattern lega esplicitamente "entro N ore/giorni" (o l'assenza di un
// numero quando la lingua lo esprime altrove nella stessa frase) all'acronimo
// normativo locale, per non catturare menzioni generiche di GDPR/DSGVO/RGPD
// (conformita', server EU, ecc.) che sono legittime e non vanno toccate.
// L'unita' oraria e' matchata sia nella forma abbreviata ("48h") sia estesa
// ("48 hours"/"48 ore"/...) perche' entrambe compaiono nel sito (es. beta/page.tsx
// usa "48h", il blog post e i docs usano "48 hours"/"48 ore" per esteso).
const FALSE_ATTRIBUTION_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "EN — as required/prescribed by GDPR", re: /\b\d{1,3}\s?h(?:ours?)?\b[^.]{0,40}\bas (?:required|prescribed) by GDPR/i },
  { label: "IT — come previsto/richiesto dal GDPR", re: /\b\d{1,3}\s?(?:h|ore)\b[^.]{0,40}come (?:previsto|richiesto) dal GDPR/i },
  { label: "ES — exige/exigido/conforme al GDPR", re: /\b\d{1,3}\s?h(?:oras)?\b[^.]{0,40}(?:exig(?:e|ido) (?:el |por el )?GDPR|conforme al GDPR)/i },
  { label: "DE — wie (es) die DSGVO vorschreibt/vorgeschrieben", re: /\b\d{1,3}\s?(?:h|Stunden)\b[^.]{0,40}DSGVO vor(?:schreibt|ge?schrieben)/i },
  { label: "PT — conforme exige/exigido (pelo) GDPR", re: /\b\d{1,3}\s?h(?:oras)?\b[^.]{0,40}exig(?:e|ido) (?:pelo |o )?GDPR/i },
  { label: "FR — comme l'exige/conformément au RGPD", re: /\b\d{1,3}\s?h(?:eures)?\b[^.]{0,40}(?:exige le RGPD|conformément au RGPD)/i },
  { label: "PL — zgodnie z wymaganiami RODO", re: /\b\d{1,3}\s?godzin\b[^.]{0,40}zgodnie z wymaganiami RODO/i },
  { label: "TR — GDPR'ın gerektirdiği şekilde", re: /GDPR['’]?ın gerektirdiği[^.]{0,40}\b\d{1,3}\s?saat\b/i },
  { label: "NL — zoals vereist door de AVG", re: /\b\d{1,3}\s?uur\b[^.]{0,40}zoals vereist door de AVG/i },
  { label: "JA — GDPRの要件通り / GDPRに基づき", re: /GDPR(?:の要件通り|に基づき)[^。]{0,20}\d{1,3}\s?時間/ },
  { label: "KO — GDPR에 따라 / GDPR의 요구에 따라", re: /GDPR(?:에 따라|의 요구에 따라)[^.]{0,20}\d{1,3}\s?시간/ },
];

for (const file of filesToScan) {
  const content = fs.readFileSync(file, "utf8");
  const rel = path.relative(repoRoot, file);
  for (const { label, re } of FALSE_ATTRIBUTION_PATTERNS) {
    if (re.test(content)) {
      errors.push(`${rel}: falsa attribuzione normativa rilevata — ${label}`);
    }
  }
}

// Guardia positiva: la citazione corretta (art. 12, 30 giorni per la
// RISPOSTA) deve sopravvivere — se sparisce del tutto da privacy/page.tsx
// qualcosa di piu' ampio e' stato toccato per errore.
const privacyPagePath = path.join(
  repoRoot,
  "app/(frontend)/[locale]/(marketing)/privacy/page.tsx",
);
if (fs.existsSync(privacyPagePath)) {
  const privacyContent = fs.readFileSync(privacyPagePath, "utf8");
  if (!/art\.?\s*12/i.test(privacyContent)) {
    errors.push(
      "app/(frontend)/[locale]/(marketing)/privacy/page.tsx: citazione GDPR art. 12 (30 giorni, risposta a richiesta interessato) non trovata — verificare che non sia stata rimossa per errore.",
    );
  }
}

if (errors.length > 0) {
  console.error(`❌ GDPR claim guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✅ GDPR claim guardrail: ${filesToScan.length} file scansionati in app/components/lib/docs, zero attribuzioni normative false (GDPR/DSGVO/RGPD/AVG/RODO "richiede N ore"), citazione corretta art. 12 (30 giorni) intatta in privacy/page.tsx.`,
);
