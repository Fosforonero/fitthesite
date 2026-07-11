/**
 * Guardrail: fallisce se /llms.txt, il JSON-LD platform-specific o il resto
 * del sito contengono claim incompatibili con lib/product-facts.ts (la fonte
 * unica dei fatti prodotto).
 *
 * /llms.txt è GENERATO da lib/product-facts.ts via lib/llms-txt.ts, quindi in
 * teoria non può divergere — la sezione 1 esiste per due motivi concreti:
 *  1. Blocca una regressione se in futuro qualcuno hardcoda di nuovo un
 *     valore dentro lib/llms-txt.ts invece di leggerlo da product-facts.
 *  2. Elenca esplicitamente, in un unico posto verificabile da CI, le frasi
 *     "morte" che NON devono mai ricomparire — la lista stessa è la
 *     documentazione vivente di cosa questo sprint ha corretto.
 *
 * Le sezioni 4-6 (aggiunte nello sprint P0.1 — Truth Reconciliation) coprono
 * il buco che la sezione 1 da sola lascia aperto: controllava solo il testo
 * GENERATO di /llms.txt, non le contraddizioni nel resto del sito (JSON-LD
 * per piattaforma, provider data, blog, landing). Sezione 4 fa uno snapshot
 * strutturale del JSON-LD MobileApplication per Android/iOS su tutte le 15
 * locale; sezione 5 verifica i fatti platform-specific letti direttamente da
 * lib/providers/data.ts; sezione 6 scansiona il testo sorgente del sito per
 * le frasi obsolete specifiche eliminate in questo sprint (iOS "in beta"/
 * TestFlight, minOS superato, claim "scriverà su Apple Salute" non
 * verificato).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx -y tsx tools/check-llms-consistency.ts
 */
import fs from "node:fs";
import path from "node:path";
import { generateLlmsTxt } from "../lib/llms-txt";
import {
  PLAY_STORE_URL,
  AVAILABILITY,
  FOUNDER_PROGRAM,
  PRICING_FACTS,
  appOffers,
} from "../lib/product-facts";
import { mobileApplicationJsonLdData } from "../components/seo/MobileApplicationJsonLd";
import { schemaLanguage } from "../lib/seo/schema-language";
import { locales } from "../lib/i18n";
import { PROVIDERS } from "../lib/providers/data";

const txt = generateLlmsTxt();

type Problem = string;
const problems: Problem[] = [];

// ── 1. Frasi obsolete che NON devono mai ricomparire in /llms.txt ─────────
const BANNED: { label: string; re: RegExp }[] = [
  { label: "iOS planned 2027", re: /iOS\s*\(?\s*planned\s*2027/i },
  { label: "closed beta claim", re: /closed beta/i },
  { label: "100 founder seats (stale program size)", re: /100\s+founder/i },
  { label: "stale free-tier claim", re: /Free tier/i },
];
for (const { label, re } of BANNED) {
  if (re.test(txt)) problems.push(`[llms.txt] Contains banned legacy claim [${label}]: matched ${re}`);
}

// "Android-only" è bannato SOLO come claim di prodotto (il vecchio "FitMesh è
// Android-only" pre-lancio iOS) — non come claim tecnico vero ("Health
// Connect è Android-only", corretto: quell'API non esiste su iOS). Controllo
// contestuale: guarda i ~40 caratteri prima del match, se citano "Health
// Connect" o "API" è la frase tecnica corretta, non il claim di prodotto morto.
const androidOnlyRe = /Android[- ]only/gi;
let m: RegExpExecArray | null;
while ((m = androidOnlyRe.exec(txt)) !== null) {
  const before = txt.slice(Math.max(0, m.index - 40), m.index);
  if (!/Health Connect|API/i.test(before)) {
    problems.push(`[llms.txt] Contains banned legacy claim [Android-only product claim]: "...${before}${m[0]}" is not scoped to Health Connect/API.`);
  }
}

// ── 2. Fatti correnti che DEVONO comparire in /llms.txt (cross-check contro product-facts) ──
const REQUIRED: { label: string; value: string }[] = [
  { label: "Play Store URL", value: PLAY_STORE_URL },
  { label: "App Store URL", value: AVAILABILITY.ios.storeUrl },
  { label: "founder total seats", value: String(FOUNDER_PROGRAM.totalSeats) },
  { label: "Android lifetime price", value: PRICING_FACTS.lifetimeAndroid.amount },
  { label: "iOS lifetime price", value: PRICING_FACTS.lifetimeIos.amount },
  { label: "6-month sub price", value: PRICING_FACTS.subSixMonths.amount },
  { label: "iOS minimum OS version", value: AVAILABILITY.ios.minOsVersion },
  { label: "Android minimum OS version", value: AVAILABILITY.android.minOsVersion },
];
for (const { label, value } of REQUIRED) {
  if (!txt.includes(value)) problems.push(`[llms.txt] Missing expected current fact [${label}]: "${value}" not found in generated text`);
}

// ── 3. "App gratis, Pro è IAP" deve essere esplicito (non solo un prezzo nudo) ──
if (!/free to download/i.test(txt)) {
  problems.push("[llms.txt] Missing explicit 'free to download' framing for the app itself (Offer correctness).");
}

// Sprint "Commercial Truth Reconciliation": i prezzi in llms.txt sono una
// cifra EUR di riferimento applicata a ogni storefront senza conversione
// verificata (vedi appOffers() sotto) — il testo deve dirlo esplicitamente,
// non presentare €3,99/€4,99/€1,19 come fatto valido ovunque.
if (!/not a verified 1:1 conversion/i.test(txt)) {
  problems.push("[llms.txt] Missing the EUR-reference-price hedge ('not a verified 1:1 conversion') — prices must not be presented as a verified fact for every storefront/currency.");
}

// ── 3b. appOffers() deve pubblicare SOLO il download gratuito (price: 0) ──
// Lo sblocco Pro non ha una fonte verificata per storefront/valuta (vedi
// lib/product-facts.ts): pubblicarlo in JSON-LD sarebbe una claim di prezzo
// non verificata trattata come fatto da Google/assistenti AI.
for (const platform of ["android", "ios"] as const) {
  const offers = appOffers(platform);
  if (offers.length !== 1 || offers[0]?.category !== "free" || offers[0]?.price !== "0") {
    problems.push(`[product-facts] appOffers("${platform}") returned ${JSON.stringify(offers)} — expected exactly one free (price: 0) offer, no paid IAP Offer.`);
  }
}

// ── 4. Snapshot JSON-LD MobileApplication per Android/iOS, tutte le 15 locale ──
// Ogni piattaforma deve citare SOLO le proprie fonti dati. iOS non deve mai
// citare Health Connect/Wear OS/Galaxy Watch (Android-only, API diversa).
// Android non deve mai citare "Apple" (Apple Health/HealthKit/Apple Salute/
// Apple Zdrowie/Apple Sağlık/... — il brand name resta "Apple" non tradotto
// in tutte le locale di questo repo, quindi un controllo su "Apple" copre
// tutte le 15 lingue senza dover elencare ogni variante localizzata).
const ANDROID_FORBIDDEN = /\bApple\b/i;
const IOS_FORBIDDEN = /Health Connect|Wear OS|Galaxy Watch/i;

for (const locale of locales) {
  const { android, ios } = mobileApplicationJsonLdData(locale);

  const androidText = `${android.description} ${android.featureList.join(" ")}`;
  if (ANDROID_FORBIDDEN.test(androidText)) {
    problems.push(`[JSON-LD ${locale}] Android MobileApplication node mentions "Apple" — cross-platform contamination: "${androidText.match(ANDROID_FORBIDDEN)?.[0]}"`);
  }

  const iosText = `${ios.description} ${ios.featureList.join(" ")}`;
  const iosMatch = iosText.match(IOS_FORBIDDEN);
  if (iosMatch) {
    problems.push(`[JSON-LD ${locale}] iOS MobileApplication node cites "${iosMatch[0]}" as a native source — iOS never reads Health Connect (Android-only API).`);
  }

  if (android.operatingSystem !== `${AVAILABILITY.android.minOsVersion} and up`) {
    problems.push(`[JSON-LD ${locale}] Android operatingSystem "${android.operatingSystem}" does not match AVAILABILITY.android.minOsVersion ("${AVAILABILITY.android.minOsVersion} and up").`);
  }
  if (ios.operatingSystem !== `${AVAILABILITY.ios.minOsVersion} and up`) {
    problems.push(`[JSON-LD ${locale}] iOS operatingSystem "${ios.operatingSystem}" does not match AVAILABILITY.ios.minOsVersion ("${AVAILABILITY.ios.minOsVersion} and up").`);
  }

  if (android.inLanguage !== schemaLanguage(locale) || ios.inLanguage !== schemaLanguage(locale)) {
    problems.push(`[JSON-LD ${locale}] inLanguage mismatch against schemaLanguage(locale) — Android="${android.inLanguage}" iOS="${ios.inLanguage}" expected="${schemaLanguage(locale)}".`);
  }
}

// Regressione mirata: il bug che ha originato schemaLanguage() era il
// fallback silenzioso su "en-US" per le 4 locale nordiche (sv/da/no/fi) non
// coperte dalle vecchie catene di ternari manuali sparse nel sito.
for (const nordic of ["sv", "da", "no", "fi"] as const) {
  if (schemaLanguage(nordic) === "en-US") {
    problems.push(`[schemaLanguage] Nordic locale "${nordic}" resolves to "en-US" — the exact regression this sprint fixed.`);
  }
}

// ── 5. Fatti platform-specific letti direttamente da lib/providers/data.ts ──
const appleHealth = PROVIDERS.find((p) => p.slug === "apple-health");
if (!appleHealth) {
  problems.push("[providers] No provider with slug \"apple-health\" found in PROVIDERS.");
} else {
  if (appleHealth.status !== "live") {
    problems.push(`[providers] apple-health status is "${appleHealth.status}", expected "live" — verified live on the App Store (2026-07-10, app id 6779751708).`);
  }
  if (!appleHealth.platforms || appleHealth.platforms.join(",") !== "ios") {
    problems.push(`[providers] apple-health platforms is ${JSON.stringify(appleHealth.platforms)}, expected exactly ["ios"].`);
  }
  if (appleHealth.syncMechanism !== "healthkit") {
    problems.push(`[providers] apple-health syncMechanism is "${appleHealth.syncMechanism}", expected "healthkit".`);
  }
  const appleHealthProse = Object.values(appleHealth.tagline).join(" ") + " " + Object.values(appleHealth.longDesc).join(" ");
  if (/TestFlight/i.test(appleHealthProse)) {
    problems.push("[providers] apple-health tagline/longDesc still mentions TestFlight — the app is live on the App Store, not in TestFlight beta.");
  }
  if (/\bbeta\b/i.test(appleHealthProse)) {
    problems.push("[providers] apple-health tagline/longDesc still describes the app as \"beta\" — status is live.");
  }
}

const colmiRing = PROVIDERS.find((p) => p.slug === "colmi-ring");
if (!colmiRing) {
  problems.push("[providers] No provider with slug \"colmi-ring\" found in PROVIDERS.");
} else {
  const platforms = (colmiRing.platforms ?? []).slice().sort().join(",");
  if (platforms !== "android,ios") {
    problems.push(`[providers] colmi-ring platforms is ${JSON.stringify(colmiRing.platforms)}, expected ["android","ios"] (direct-BLE, works on both).`);
  }
  if (colmiRing.syncMechanism !== "direct-ble") {
    problems.push(`[providers] colmi-ring syncMechanism is "${colmiRing.syncMechanism}", expected "direct-ble".`);
  }
}

if (AVAILABILITY.ios.minOsVersion !== "iOS 14.0") {
  problems.push(`[product-facts] AVAILABILITY.ios.minOsVersion is "${AVAILABILITY.ios.minOsVersion}", expected "iOS 14.0" (verified live App Store listing, 2026-07-10).`);
}
if (!AVAILABILITY.ios.live) {
  problems.push("[product-facts] AVAILABILITY.ios.live is false — iOS app is live on the App Store today.");
}

// ── 6. Scansione mirata: frasi morte specifiche eliminate in questo sprint ──
// Non un linter generico — un elenco letterale delle frasi "iOS in beta/
// TestFlight/coming soon" e "scriverà su Apple Salute" (claim non
// verificato) effettivamente trovate e corrette in blog/landing/provider
// content durante lo sprint P0.1. Se ricompaiono, è una regressione.
const SCAN_DIRS = [
  "lib/blog/posts",
  "lib/landing",
  "lib/providers",
  "app/(frontend)/[locale]/(marketing)",
];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);

const DEAD_PHRASES: { label: string; needle: string }[] = [
  { label: "TestFlight beta", needle: "TestFlight" },
  { label: "iOS app coming + will write to Apple Health (it)", needle: "l'app iOS è in arrivo e scriverà su Apple Salute" },
  { label: "iOS app coming + will write to Apple Health (en)", needle: "the iOS app is coming and will write to Apple Health" },
  { label: "iOS app coming, in App Store review (it)", needle: "l'app iOS è in arrivo (in revisione" },
  { label: "iOS app coming, in App Store review (en)", needle: "the iOS app is coming (in App Store review)" },
  { label: "iOS is coming (bare)", needle: "iOS is coming" },
  { label: "l'iOS è in arrivo (bare)", needle: "l'iOS è in arrivo" },
  { label: "App Store when iOS app is available (it)", needle: "App Store quando l'app iOS sarà disponibile" },
  { label: "App Store when iOS app is available (en)", needle: "once the iOS app is available" },
  { label: "join the beta for early access", needle: "join the beta for early access" },
  { label: "not available on the App Store at this time", needle: "not available on the App Store at this time" },
  { label: "iOS version is in active development", needle: "iOS version is in active development" },
  { label: "in active beta on TestFlight", needle: "in active beta on TestFlight" },
  { label: "stale iOS minOS 15.0", needle: "iOS 15.0" },
  { label: "stale iOS minOS 16", needle: "iOS 16+" },
  // Sprint "Commercial Truth Reconciliation": paid-after-trial model claims.
  { label: "first 100 founders (it)", needle: "primi 100 founder" },
  { label: "first 100 founders (en)", needle: "first 100 founders" },
  { label: "core free without limits (it)", needle: "gratuite senza limiti" },
  { label: "core free without limits (it, alt)", needle: "gratis senza limiti" },
  { label: "core free without limits (en)", needle: "free with no limits" },
  { label: "native SwiftUI (en)", needle: "native SwiftUI" },
  { label: "native SwiftUI (it)", needle: "nativa SwiftUI" },
  { label: "hardcoded Android operatingSystem for a provider node", needle: 'operatingSystem: "ANDROID",' },
];

function walk(dir: string, out: string[]) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // directory non presente in questo checkout — non un errore del guardrail
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
}

const repoRoot = path.resolve(__dirname, "..");
const filesToScan: string[] = [];
for (const dir of SCAN_DIRS) {
  walk(path.join(repoRoot, dir), filesToScan);
}

// "worldwide" + un riferimento al rollout UE vicino nello stesso punto di
// testo è il pattern "Commercial Truth Reconciliation" ha eliminato: iOS non
// è "live worldwide", è disponibile negli storefront supportati fuori UE,
// con rollout UE in corso (nessuna data). Controllo di prossimità (non
// frase fissa, il testo varia) su IT/EN, le due locale con copy proprio
// (le altre 13 ereditano da queste o hanno traduzioni derivate — un
// controllo di prossimità affidabile su tutte le 15 lingue richiederebbe
// un elenco di equivalenti "worldwide"/"27 paesi"/"rollout" per lingua,
// complessità non giustificata qui: il fix è stato applicato ovunque da
// un workflow dedicato, questo è un guardrail di regressione mirato).
//
// "Android is already live worldwide; the iOS app is ... outside the EU" è
// il pattern CORRETTO ora usato ovunque: "worldwide" descrive Android, "27
// paesi UE...rollout" descrive iOS, nella STESSA frase. Per non far scattare
// un falso positivo su questa frase corretta, si esclude un match di
// "worldwide" preceduto a breve distanza da "Android" (segno che descrive
// Android, non iOS).
const WORLDWIDE_PROXIMITY_WINDOW = 200;
const ANDROID_BEFORE_WINDOW = 30;
const WORLDWIDE_RE = /\bworldwide\b|\bnel mondo\b|\bin tutto il mondo\b/gi;
const EU_ROLLOUT_RE = /\b27\b/;

// "piano gratuito"/"free plan" è bannato SOLO come claim POSITIVO su FitMesh
// (il vecchio "FitMesh ha un piano gratuito" pre-pivot paid-after-trial) —
// non come (a) negazione corretta ("non c'è un piano gratuito permanente",
// esattamente il messaggio voluto) o (b) descrizione di un prodotto
// concorrente in un articolo comparativo (dove "FitMesh" non è il soggetto
// vicino alla frase). Controllo contestuale: richiede "FitMesh" entro ~150
// caratteri PRIMA del match (altrimenti non è una claim sul nostro prodotto)
// e nessuna negazione entro gli 80 caratteri immediatamente precedenti.
const FREE_PLAN_RE = /piano gratuito|free plan/gi;
const FITMESH_PROXIMITY_WINDOW = 150;
const NEGATION_WINDOW = 80;
// "non c'è" NON usa \b finale: JS \w è ASCII-only, "è" non è un word char,
// quindi \b tra "è" e lo spazio successivo non trova mai un confine e il
// pattern non matcherebbe mai (bug scoperto durante questo stesso sprint).
const NEGATION_RE = /\bno\b|non c'è|\bnon ha\b|\bnon esiste\b|\bniente\b|\bnessun\b|\bnot have\b|\bdoesn't have\b|\bdoes not have\b|\bthere is no\b|\bthere's no\b/i;

for (const file of filesToScan) {
  const content = fs.readFileSync(file, "utf-8");
  const rel = path.relative(repoRoot, file);
  for (const { label, needle } of DEAD_PHRASES) {
    if (content.includes(needle)) {
      problems.push(`[stale-claim scan] ${rel} contains dead phrase [${label}]: "${needle}"`);
    }
  }

  let wwMatch: RegExpExecArray | null;
  WORLDWIDE_RE.lastIndex = 0;
  while ((wwMatch = WORLDWIDE_RE.exec(content)) !== null) {
    const beforeAndroid = content.slice(Math.max(0, wwMatch.index - ANDROID_BEFORE_WINDOW), wwMatch.index);
    if (/Android/i.test(beforeAndroid)) continue; // "Android ... worldwide" — descrive Android, corretto

    const windowStart = Math.max(0, wwMatch.index - WORLDWIDE_PROXIMITY_WINDOW);
    const windowEnd = Math.min(content.length, wwMatch.index + WORLDWIDE_PROXIMITY_WINDOW);
    const window = content.slice(windowStart, windowEnd);
    if (EU_ROLLOUT_RE.test(window) && /rollout|rolling out|in arrivo/i.test(window)) {
      problems.push(`[worldwide+EU-rollout scan] ${rel} has "${wwMatch[0]}" near a "27 ...rollout" mention — iOS is not "worldwide", it's available in supported storefronts outside the EU with EU rollout in progress (no ETA).`);
    }
  }

  let fpMatch: RegExpExecArray | null;
  FREE_PLAN_RE.lastIndex = 0;
  while ((fpMatch = FREE_PLAN_RE.exec(content)) !== null) {
    const before = content.slice(Math.max(0, fpMatch.index - FITMESH_PROXIMITY_WINDOW), fpMatch.index);
    if (!/FitMesh/i.test(before)) continue; // non è una claim sul nostro prodotto

    const negationWindow = content.slice(Math.max(0, fpMatch.index - NEGATION_WINDOW), fpMatch.index);
    if (NEGATION_RE.test(negationWindow)) continue; // negazione corretta ("non c'è un piano gratuito")

    problems.push(`[free-plan scan] ${rel} has "${fpMatch[0]}" near "FitMesh" with no negation nearby — FitMesh has no permanent free plan, only a 14-day trial then a hard paywall.`);
  }
}

if (problems.length > 0) {
  console.error(`❌ llms consistency: ${problems.length} problema/i.\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `✅ llms consistency OK: ${txt.length} caratteri /llms.txt generati, ${locales.length} locale JSON-LD verificate (Android+iOS), ${filesToScan.length} file scansionati per claim obsolete, nessun problema trovato.`,
);
