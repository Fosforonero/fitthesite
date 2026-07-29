/**
 * Sprint P0.10F — guardrail "founder:migration-identity-check".
 *
 * Le 4 migration Founder (GO APPLY P0.10, 2026-07-29) sono state applicate
 * in produzione e poi rinominate con `git mv` per riflettere i timestamp
 * REALMENTE registrati da Supabase — vedi
 * docs/architecture/p010-post-apply-migration-mapping.md, che è la fonte
 * di verità per il mapping. Questo script fallisce se:
 *
 *  1. uno dei 4 file attesi manca in supabase/migrations/ con quel nome
 *     esatto (rinominato di nuovo, o cancellato);
 *  2. il contenuto di uno dei 4 file è cambiato dopo l'apply (SHA-256
 *     diverso da quello registrato) — questi file sono GIÀ live in
 *     produzione: modificarli ora significherebbe far divergere il repo
 *     da ciò che gira realmente, senza alcuna nuova migration a
 *     tracciare quel cambiamento;
 *  3. esiste ancora un file con uno dei 4 timestamp LOGICI originali
 *     (pre-rinomina) — sintomo di una rinomina parziale o di un file
 *     duplicato.
 *
 * Non verifica la history remota (richiede accesso Supabase live, fuori
 * scope per un guardrail eseguito in CI/locale senza credenziali) — la
 * riconciliazione con `supabase_migrations.schema_migrations` è stata
 * fatta una tantum con accesso reale ed è documentata nel mapping sopra.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const repoRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(repoRoot, "supabase", "migrations");
const errors: string[] = [];

interface MappedMigration {
  logicalTimestamp: string;
  appliedTimestamp: string;
  name: string;
  sha256: string;
}

// Fonte di verità: docs/architecture/p010-post-apply-migration-mapping.md.
// Aggiornare QUI e in quel documento insieme se mai cambiasse.
const MAPPING: MappedMigration[] = [
  {
    logicalTimestamp: "20260728090000",
    appliedTimestamp: "20260729161059",
    name: "founder_launch_cutoff_and_window",
    sha256: "3e79bc3d110fd2ca2d50d3c4d3383c8b5f4297e895129e6fabd84094f5885813",
  },
  {
    logicalTimestamp: "20260728100000",
    appliedTimestamp: "20260729161132",
    name: "harden_legacy_b2c_trial_acl",
    sha256: "9a9c0a954702b273996d583c58d3797027b7209f43325ba24d1bcdacb0767522",
  },
  {
    logicalTimestamp: "20260728110000",
    appliedTimestamp: "20260729161245",
    name: "entitlement_status_contract",
    sha256: "af78448c477f95eedbd2a028dc5ad0310fdfb6fee449db2fcf645e8a0532948e",
  },
  {
    logicalTimestamp: "20260729120000",
    appliedTimestamp: "20260729161341",
    name: "founder_reserve_cutoff_gate",
    sha256: "2a13364a721463acc4efe664bcaa4b3bc42f194da592f8615aaff6246cd4b559",
  },
];

function sha256File(fullPath: string): string {
  return createHash("sha256").update(fs.readFileSync(fullPath)).digest("hex");
}

for (const m of MAPPING) {
  const expectedFilename = `${m.appliedTimestamp}_${m.name}.sql`;
  const expectedPath = path.join(migrationsDir, expectedFilename);

  if (!fs.existsSync(expectedPath)) {
    errors.push(
      `Manca ${expectedFilename} in supabase/migrations/ — atteso al timestamp realmente registrato da Supabase (era ${m.logicalTimestamp} prima della rinomina Sprint P0.10F). Vedi docs/architecture/p010-post-apply-migration-mapping.md.`,
    );
    continue;
  }

  const actualSha256 = sha256File(expectedPath);
  if (actualSha256 !== m.sha256) {
    errors.push(
      `${expectedFilename}: SHA-256 non corrisponde a quello registrato post-apply (atteso ${m.sha256}, trovato ${actualSha256}). Questo file è GIÀ applicato in produzione — non va modificato senza una nuova migration dedicata.`,
    );
  }

  // Un file col vecchio timestamp logico non deve esistere più da nessuna
  // parte (rinomina parziale, o un duplicato lasciato per errore).
  const staleCandidates = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.startsWith(m.logicalTimestamp));
  if (staleCandidates.length > 0) {
    errors.push(
      `Trovato/i file con il vecchio timestamp logico ${m.logicalTimestamp} ancora presente/i: ${staleCandidates.join(", ")} — la rinomina Sprint P0.10F dovrebbe averli sostituiti con ${expectedFilename}.`,
    );
  }
}

if (errors.length > 0) {
  console.error("❌ founder:migration-identity-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    "✅ founder:migration-identity-check: le 4 migration Founder applicate (Sprint P0.10) esistono ai timestamp realmente registrati da Supabase, SHA-256 invariati dal rename, nessun file col vecchio timestamp logico residuo.",
  );
}
