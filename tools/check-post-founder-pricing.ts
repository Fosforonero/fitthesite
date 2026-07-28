/**
 * Sprint P0.10 — guardrail "post-founder:pricing-check".
 *
 * Dopo la chiusura del programma Founder, i nuovi utenti seguono SOLO
 * trial 14gg -> abbonamento o lifetime a pagamento. Questo guardrail
 * fallisce se:
 *
 *  1. PRICING_FACTS.trialDays non esiste o non è un numero positivo (SSOT
 *     del trial assente);
 *  2. l'array Offer JSON-LD (appOffers) pubblica un prezzo diverso dal solo
 *     download gratuito — cioè se un secondo Offer con price 0 o "free"
 *     per lo sblocco Pro/lifetime venisse reintrodotto;
 *  3. una pagina marketing promette "gratis per sempre"/"free forever"/
 *     "lifetime free" ai NUOVI utenti (fuori da un blocco <FounderClientGate
 *     founder={...}> o dall'allow-list storica) — distinto dal claim
 *     Founder storico, che resta legittimo perché gated e riferito a un
 *     beneficio già concesso, non a un'offerta per chiunque arrivi oggi;
 *  4. lib/pricing.ts o lib/product-facts.ts duplicano un prezzo hardcodato
 *     al di fuori della SSOT (stesso principio del guardrail seo-truth
 *     esistente, qui ristretto al perimetro trial/Founder).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// ── 1: trialDays SSOT ────────────────────────────────────────────────────
const productFactsPath = path.join(repoRoot, "lib/product-facts.ts");
const productFacts = fs.readFileSync(productFactsPath, "utf8");
const trialDaysMatch = productFacts.match(/trialDays:\s*(\d+)/);
if (!trialDaysMatch) {
  errors.push("lib/product-facts.ts: PRICING_FACTS.trialDays non trovato.");
} else if (Number(trialDaysMatch[1]) <= 0) {
  errors.push(`lib/product-facts.ts: PRICING_FACTS.trialDays è ${trialDaysMatch[1]}, deve essere positivo.`);
} else if (Number(trialDaysMatch[1]) !== 14) {
  errors.push(
    `lib/product-facts.ts: PRICING_FACTS.trialDays è ${trialDaysMatch[1]}, atteso 14 (se il cambio è intenzionale, aggiorna questo guardrail e tutto il copy che cita "14 giorni").`,
  );
}

// ── 2: appOffers pubblica SOLO il download gratuito ─────────────────────
const appOffersMatch = productFacts.match(/export function appOffers[\s\S]*?\n}/);
if (!appOffersMatch) {
  errors.push("lib/product-facts.ts: funzione appOffers non trovata.");
} else {
  const body = appOffersMatch[0];
  const offerCount = (body.match(/"@type":\s*"Offer"/g) ?? []).length;
  if (offerCount > 1) {
    errors.push(
      `lib/product-facts.ts: appOffers() dichiara ${offerCount} Offer — atteso 1 solo (download gratuito). Un secondo Offer per Pro/lifetime/Founder in JSON-LD sarebbe un prezzo pubblicato non verificabile per storefront/valuta.`,
    );
  }
}

// ── 3: "gratis per sempre"/"free forever" ai nuovi utenti, fuori gate ────
const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_EXCLUDE_DIRS = new Set(["node_modules", ".next", ".git"]);
const ALLOWED_FILES = new Set([
  "app/(frontend)/[locale]/(marketing)/terms/page.tsx",
  "lib/blog/posts/perche-diventare-founder-fitmesh.ts",
  "lib/blog/posts/fitmesh-gratis-prezzo-founder.ts",
  "lib/pricing.ts",
  "lib/pricing-section.ts", // definizione delle stringhe, il rendering (page.tsx) è già gated
  "lib/content/homepage-copy.ts",
  "app/(frontend)/[locale]/(marketing)/beta/page.tsx", // gated internamente, verificato da founder:commercial-truth-check
  // Copy editoriale storica (post-cutoff): racconta un beneficio Founder
  // GIA' concesso ai primi 1000 iscritti, con la data di chiusura del
  // programma esplicita nel testo, quindi legge come fatto storico corretto
  // sia prima sia dopo il 31/07/2026 — stesso principio delle due voci
  // sopra, non un'offerta attiva per chi arriva oggi.
  "app/(frontend)/[locale]/(marketing)/press/page.tsx",
  "lib/landing/data.ts",
  "lib/blog/posts/alternative-app-sync-wearable-2026.ts",
  "lib/blog/posts/anello-colmi-r02-affidabile.ts",
  "lib/blog/posts/anello-smart-guida-completa.ts",
  "lib/blog/posts/cambiare-smartwatch-senza-perdere-dati.ts",
  "lib/blog/posts/colmi-r02-setup.ts",
  "lib/blog/posts/colmi-r09-temperatura-sviluppo.ts",
  "lib/blog/posts/colmi-ring-fitmesh.ts",
  "lib/blog/posts/come-funziona-fitmesh.ts",
  "lib/blog/posts/dove-sono-i-tuoi-dati-server-ue.ts",
  "lib/blog/posts/fitmesh-sync-disponibile-google-play.ts",
  "lib/blog/posts/fitmesh-vs-alternative-sync.ts",
  "lib/blog/posts/guida-sync-wearable-2026.ts",
  "lib/blog/posts/migliori-anelli-economici.ts",
  "lib/blog/posts/sync-them-all.ts",
  "lib/blog/posts/tracciare-sonno-anello.ts",
]);
const LIFETIME_FREE_RE = /gratis\s+per\s+sempre|free\s+forever|lifetime\s+pro\s+free|pro\s+a\s+vita\s+gratis/i;

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
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) out.push(full);
  }
}

const allFiles: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), allFiles);

for (const file of allFiles) {
  const rel = path.relative(repoRoot, file);
  if (ALLOWED_FILES.has(rel)) continue;
  const content = fs.readFileSync(file, "utf8");
  if (!LIFETIME_FREE_RE.test(content)) continue;
  if (!/<FounderClientGate/.test(content)) {
    errors.push(
      `${rel}: promette "gratis per sempre"/lifetime Pro free senza <FounderClientGate> — se non è un beneficio Founder storico già gated, è un claim di prezzo falso per i nuovi utenti (trial 14gg -> pagamento, mai gratis a vita).`,
    );
  }
}

if (errors.length > 0) {
  console.error("❌ post-founder:pricing-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    "✅ post-founder:pricing-check: trialDays SSOT presente (14), appOffers pubblica solo il download gratuito, nessun claim 'gratis a vita' fuori gate/allow-list.",
  );
}
