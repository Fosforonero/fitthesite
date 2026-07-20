/**
 * Guardrail P1.1 Fase 0.4 — nessuna promessa assoluta di sync continuo.
 *
 * FitMesh legge i dati via Bluetooth/Health Connect quando apri l'app (o,
 * su Android, con un best-effort periodico se disattivi l'ottimizzazione
 * batteria — mai garantito, dipende dal produttore del telefono); su iOS
 * oggi non c'e' alcun sync in background. Il claim "sync continuo"/
 * "continuous sync" (e equivalenti nelle altre lingue) era presente in
 * lib/content/about-copy.ts (trialDesc, tutte le 15 lingue) come se fosse
 * una feature garantita — corretto in P1.1 Fase 0.4 rimuovendo la clausola.
 *
 * Questo guardrail e' CONTESTUALE, non un ban assoluto sulla frase
 * "background sync": quella frase compare legittimamente in decine di post
 * blog di troubleshooting (Health Connect, Fitbit, Oura, Polar, Zepp — cioe'
 * COMPORTAMENTO DI TERZE PARTI/Android, non una promessa FitMesh) e in
 * faqs.ts/privacy/page.tsx dove FitMesh descrive il proprio comportamento
 * gia' correttamente sfumato ("best-effort", "dipende da", "non c'e' su
 * iOS"). Il guardrail scansiona SOLO il copy di prima parte a alta visibilita'
 * (lib/content, pagine marketing statiche, pricing) e fallisce solo se un
 * pattern assoluto compare SENZA una sfumatura ("best-effort"/"dipende"/
 * "non garantit*"/"depends"/"not guaranteed"/ecc.) entro 120 caratteri.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// Solo copy di prima parte ad alta visibilita': non i post blog di
// troubleshooting (parlano di app/OS di terzi) ne' lib/providers (guide
// dispositivo-specifiche, gia' correttamente sfumate).
const SCAN_DIRS = ["lib/content", "lib/pricing.ts", "lib/pricing-section.ts", "lib/product-facts.ts", "lib/llms-txt.ts"];
const MARKETING_PAGES_DIR = "app/(frontend)/[locale]/(marketing)";
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
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
}

const filesToScan: string[] = [];
for (const target of SCAN_DIRS) {
  const full = path.join(repoRoot, target);
  if (!fs.existsSync(full)) continue;
  if (fs.statSync(full).isDirectory()) walk(full, filesToScan);
  else filesToScan.push(full);
}
walk(path.join(repoRoot, MARKETING_PAGES_DIR), filesToScan);

// Frase assoluta di sync continuo/garantito, per lingua. Cattura solo la
// frase (non "background sync" da sola, troppo generica).
const ABSOLUTE_SYNC_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "IT — sync/sincronizzazione continuo/a", re: /sincronizzazione continua|sync continuo/i },
  { label: "EN — continuous sync(hronization)", re: /continuous sync(?:hronization)?/i },
  { label: "ES — sincronización continua", re: /sincronizaci[oó]n continua/i },
  { label: "DE — kontinuierliche(n) Synchronisierung", re: /kontinuierliche[nr]? Synchronisierung/i },
  { label: "PT — sincronização contínua", re: /sincroniza[cç][aã]o cont[ií]nua/i },
  { label: "FR — synchronisation continue", re: /synchronisation continue/i },
  { label: "PL — ciągła synchronizacja", re: /ciągła synchronizacja/i },
  { label: "TR — kesintisiz senkronizasyon", re: /kesintisiz senkronizasyon/i },
  { label: "NL — continue synchronisatie", re: /continue synchronisatie/i },
  { label: "SV/DA/NO — kontinuerlig(t) synk(ronisering)", re: /kontinuerlig[t]? synk(?:ronisering)?/i },
  { label: "FI — jatkuva synkronointi", re: /jatkuva synkronointi/i },
  { label: "JA — 継続的な同期", re: /継続的な同期/ },
  { label: "KO — 실시간 동기화 / 지속적인 동기화", re: /실시간 동기화|지속적인 동기화/ },
];

// Se una di queste sfumature compare vicino al match, il claim e' legittimo
// (best-effort dichiarato, dipendenza da OS/batteria esplicitata, o
// esplicita negazione "non garantito"/"not guaranteed").
const HEDGE_MARKERS =
  /best-effort|dipende (?:da|dal)|depends on|non (?:è|e')? garantit|not guaranteed|non c'è.{0,10}background|no background sync|ottimizzazione batteria|battery optimization/i;

const CONTEXT_RADIUS = 120;

for (const file of filesToScan) {
  const rel = path.relative(repoRoot, file);
  const content = fs.readFileSync(file, "utf8");
  for (const { label, re } of ABSOLUTE_SYNC_PATTERNS) {
    const globalRe = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = globalRe.exec(content)) !== null) {
      const start = Math.max(0, m.index - CONTEXT_RADIUS);
      const end = Math.min(content.length, m.index + m[0].length + CONTEXT_RADIUS);
      const context = content.slice(start, end);
      if (HEDGE_MARKERS.test(context)) continue; // sfumato nel contesto, ok
      errors.push(
        `${rel}: claim assoluto di sync continuo/garantito rilevato (${label}) senza sfumatura ("best-effort"/"dipende da"/"non garantito") entro ${CONTEXT_RADIUS} caratteri — FitMesh non ha un sync in background garantito (best-effort su Android con ottimizzazione batteria disattivata, assente su iOS).`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ No-continuous-sync-claim guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✅ No-continuous-sync-claim guardrail: ${filesToScan.length} file di copy prima-parte scansionati, zero promesse assolute di sync continuo/garantito senza sfumatura.`,
);
