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
 * Uso ufficiale (Sprint P0.6B): `tsx` è una devDependency reale del progetto,
 * quindi il comando gira con `pnpm` puro, senza `pnpm dlx` né installazioni
 * temporanee:
 *   pnpm run seo:truth-check
 * In Docker (nessun runtime locale sull'host):
 *   docker run --rm -v "$PWD":/app -w /app node:22 sh -c "corepack enable && pnpm install --frozen-lockfile --silent && pnpm run seo:truth-check"
 * Nota storica: `npx -y tsx ...` e persino `pnpm dlx tsx ...` sono entrambi
 * inaffidabili in questo repo (un conflitto locale npm/pnpm su `npx` lo rompe
 * del tutto); da qui la scelta di renderlo uno script package.json vero.
 */
import fs from "node:fs";
import path from "node:path";
import { generateLlmsTxt } from "../lib/llms-txt";
import {
  SITE_URL,
  PLAY_STORE_URL,
  AVAILABILITY,
  FOUNDER_PROGRAM,
  PRICING_FACTS,
  appOffers,
  CAPABILITY_STATUS,
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
  "lib/content",
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

// ── 7. Sprint P0.2 — Fitness Data Sync Category: guardrail estesi ─────────
// Fase 2 dello sprint chiede controlli su: trial 14gg, founder 1000 senza
// recensione, prezzi Android/iOS distinti, e lo stato reale delle capacità
// prodotto (Strava/TrainingPeaks/write-back), che una ricerca puramente
// testuale audit ha rivelato essere invertito rispetto a quanto lo sprint
// stesso assumeva: Strava e TrainingPeaks sono LIVE oggi, non roadmap.

// 7a. Trial 14 giorni (bug reale trovato e corretto in questo sprint: la
// pagina roadmap dichiarava "7 giorni", in contraddizione con
// PRICING_FACTS.trialDays e ogni altra superficie del sito).
if (PRICING_FACTS.trialDays !== 14) {
  problems.push(`[product-facts] PRICING_FACTS.trialDays is ${PRICING_FACTS.trialDays}, expected 14.`);
}
const TRIAL_DEAD_PHRASES: { label: string; needle: string }[] = [
  { label: "stale 7-day trial (it)", needle: "Trial gratuito 7 giorni" },
  { label: "stale 7-day trial (en)", needle: "7-day free trial" },
  { label: "stale 7-day trial body (it)", needle: "Una settimana per provare tutto" },
  { label: "stale 7-day trial body (en)", needle: "One week to try everything" },
];

// 7b. Founder: 1000 posti, nessuna recensione richiesta come precondizione.
if (FOUNDER_PROGRAM.totalSeats !== 1000) {
  problems.push(`[product-facts] FOUNDER_PROGRAM.totalSeats is ${FOUNDER_PROGRAM.totalSeats}, expected 1000.`);
}
if (!/no review required/i.test(FOUNDER_PROGRAM.benefit)) {
  problems.push(`[product-facts] FOUNDER_PROGRAM.benefit does not state "no review required": "${FOUNDER_PROGRAM.benefit}"`);
}
// Needle mirato su una CLAIM affermativa ("devi lasciare una recensione"),
// non sulla domanda FAQ "Devo lasciare una recensione...? No." che è invece
// il pattern corretto già presente nel sito (perche-diventare-founder-
// fitmesh.ts) — un needle troppo largo su "recensione per diventare founder"
// matcherebbe anche la domanda, dando un falso positivo.
const FOUNDER_REVIEW_DEAD_PHRASES: { label: string; needle: string }[] = [
  { label: "review required for founder (en)", needle: "you must leave a review to become a founder" },
  { label: "review required for founder (en, alt)", needle: "required to leave a review to get founder" },
  { label: "review required for founder (it)", needle: "devi lasciare una recensione per diventare founder" },
  { label: "review required for founder (it, alt)", needle: "è necessario lasciare una recensione per diventare founder" },
];

// 7c. Prezzi Android/iOS: cifre esatte, non sole di riferimento generiche.
if (PRICING_FACTS.lifetimeAndroid.amount !== "3.99") {
  problems.push(`[product-facts] PRICING_FACTS.lifetimeAndroid.amount is "${PRICING_FACTS.lifetimeAndroid.amount}", expected "3.99".`);
}
if (PRICING_FACTS.lifetimeIos.amount !== "4.99") {
  problems.push(`[product-facts] PRICING_FACTS.lifetimeIos.amount is "${PRICING_FACTS.lifetimeIos.amount}", expected "4.99".`);
}
if (PRICING_FACTS.subSixMonths.amount !== "1.19") {
  problems.push(`[product-facts] PRICING_FACTS.subSixMonths.amount is "${PRICING_FACTS.subSixMonths.amount}", expected "1.19".`);
}

// 7d. Strava: READ è live oggi (OAuth read), non roadmap Q3 2026. Il WRITE
// (invio allenamenti a Strava) resta "in development" finché non supera la
// checklist di promozione (docs/seo/capability-promotion-checklist.md) —
// vedi sezione 8 sotto per il controllo dedicato che impedisce di descrivere
// Strava come "live" per la scrittura.
// Controllo strutturale (fonte di verità) + scansione testuale di regressione
// sulla frase specifica corretta in questo sprint.
const strava = PROVIDERS.find((p) => p.slug === "strava");
if (!strava) {
  problems.push('[providers] No provider with slug "strava" found in PROVIDERS.');
} else if (strava.status !== "live") {
  problems.push(`[providers] strava status is "${strava.status}", expected "live" — Strava has a real production OAuth client ID (build-with-secrets.sh) and a live READ integration in the Flutter app (strava_provider.dart). Write (sending workouts to Strava) is implemented but not yet reachable from any UI screen — describe it as "in development", never as live/read+write.`);
}

// 7e. TrainingPeaks: integrazione reale (export TCX via Personal Access
// Token), non "non previsto". Non esiste una entry PROVIDERS dedicata (è
// un destination-only export path, non un source provider), quindi qui è
// solo una scansione testuale di regressione sulle frasi corrette in questo
// sprint — non un controllo strutturale.
const CAPABILITY_DEAD_PHRASES: { label: string; needle: string }[] = [
  { label: "Strava on Q3 2026 roadmap (en)", needle: "Strava integration is planned for Q3 2026" },
  { label: "Strava non ancora attiva (it)", needle: "l'integrazione con Strava è prevista per il terzo quadrimestre" },
  { label: "TrainingPeaks not planned (en)", needle: "no planned TrainingPeaks integration" },
  { label: "TrainingPeaks non previsto (it)", needle: "non c'è un'integrazione TrainingPeaks pianificata" },
  { label: "unqualified read-only dashboard claim (en)", needle: "FitMesh is a read-only dashboard" },
];

for (const file of filesToScan) {
  const content = fs.readFileSync(file, "utf-8");
  const rel = path.relative(repoRoot, file);
  for (const { label, needle } of [...TRIAL_DEAD_PHRASES, ...FOUNDER_REVIEW_DEAD_PHRASES, ...CAPABILITY_DEAD_PHRASES]) {
    if (content.includes(needle)) {
      problems.push(`[stale-claim scan] ${rel} contains dead phrase [${label}]: "${needle}"`);
    }
  }
}

// "Strava" + "Q3 2026"/"roadmap" nello stesso punto di testo è il pattern
// invertito che questo sprint ha corretto ovunque: Strava è live, non
// roadmap. Scansione di prossimità (non frase fissa) per coprire varianti
// non elencate sopra letteralmente.
//
// Esclusioni necessarie (falsi positivi verificati durante questo stesso
// sprint):
//  - Oura resta correttamente roadmap ("Strava ... (Oura in arrivo)" o
//    "Strava. L'OAuth per Oura è ancora in arrivo"): se "Oura" appare tra
//    "Strava" e la parola-roadmap matchata, la frase riguarda Oura, non
//    Strava — non è un falso claim su Strava.
//  - Elenco generico di nomi provider in meta description ("Strava, Polar,
//    Oura, Withings. Stato live e roadmap aggiornata."): non è una claim
//    per-provider, quindi si richiede che non ci sia un punto fermo tra
//    "Strava" e la parola-roadmap (stessa frase, non due frasi diverse).
const STRAVA_ROADMAP_WINDOW = 60;
for (const file of filesToScan) {
  const content = fs.readFileSync(file, "utf-8");
  const rel = path.relative(repoRoot, file);
  const stravaRe = /Strava/g;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = stravaRe.exec(content)) !== null) {
    const windowText = content.slice(sMatch.index, Math.min(content.length, sMatch.index + STRAVA_ROADMAP_WINDOW));
    const roadmapMatch = windowText.match(/Q3 2026|roadmap|in arrivo|coming soon|não planejado|nicht geplant/i);
    if (!roadmapMatch) continue;
    const between = windowText.slice(0, roadmapMatch.index);
    if (/Oura/i.test(between)) continue; // la frase-roadmap riguarda Oura, non Strava
    if (/\./.test(between)) continue; // parola-roadmap in una frase successiva, non la stessa claim
    if (/OAuth,\s*/i.test(windowText)) continue; // "Strava... OAuth, attivo/live today" — pattern corretto
    problems.push(`[strava-roadmap scan] ${rel} has "Strava" near a roadmap/Q3-2026/coming-soon phrase within ${STRAVA_ROADMAP_WINDOW} chars — Strava is live today, this reads as the pre-sprint stale claim: "...${windowText.replace(/\s+/g, " ")}..."`);
  }
}

// ── 8. Sprint P0.2 Fase 3 — granularità live/roadmap/read/write/export ────
// Il sito non deve mai usare "bidirectional sync" come claim generale su
// FitMesh (ogni integrazione ha una direzione propria, vedi la matrice
// /fitness-data-sync) — e le destinazioni write-only sotto non devono mai
// essere descritte come "live" finché non superano la checklist di
// promozione (docs/seo/capability-promotion-checklist.md). Al 2026-07-12
// tutte e tre sono "quick win" implementati in app (commit
// "feat(destinations): wire up TrainingPeaks/RideWithGPS send, Strava write
// re-auth, Drive export") ma NON verificati end-to-end su device fisico:
// funzione raggiungibile dalla UI non equivale a "live" per questo sito.
const BIDIRECTIONAL_WINDOW = 120;
const UNVERIFIED_DESTINATIONS = ["TrainingPeaks", "RideWithGPS", "Google Drive"];
for (const file of filesToScan) {
  const content = fs.readFileSync(file, "utf-8");
  const rel = path.relative(repoRoot, file);

  const biRe = /bidirectional sync|sync bidirezionale/gi;
  let biMatch: RegExpExecArray | null;
  while ((biMatch = biRe.exec(content)) !== null) {
    const before = content.slice(Math.max(0, biMatch.index - BIDIRECTIONAL_WINDOW), biMatch.index);
    if (/FitMesh/i.test(before)) {
      problems.push(`[bidirectional-sync scan] ${rel} uses "${biMatch[0]}" as a general claim near "FitMesh" — describe direction per integration (see /fitness-data-sync compatibility matrix), never as a blanket "bidirectional sync" claim.`);
    }
  }

  // Hedge multilingua (Fase 7 dello sprint ha tradotto la matrice
  // /fitness-data-sync a mano in it/en/es/de — "in sviluppo"/"in Entwicklung"/
  // "en desarrollo" sono hedge validi tanto quanto l'inglese "in development",
  // stesso pattern già usato dallo scanner Strava-roadmap qui sopra).
  const DEST_HEDGE_RE = /development|roadmap|not yet|coming|sviluppo|Entwicklung|desarrollo|noch nicht|aún no|ancora|todavía/i;
  for (const dest of UNVERIFIED_DESTINATIONS) {
    const destRe = new RegExp(dest.replace(/\s+/g, "\\s+"), "g");
    let destMatch: RegExpExecArray | null;
    while ((destMatch = destRe.exec(content)) !== null) {
      const windowText = content.slice(destMatch.index, Math.min(content.length, destMatch.index + 80));
      if (/\blive\b|\bnow available\b|\balready works\b/i.test(windowText) && !DEST_HEDGE_RE.test(windowText)) {
        problems.push(`[unverified-destination-live scan] ${rel} describes "${dest}" as live/available near "${windowText.replace(/\s+/g, " ").slice(0, 100)}..." — this destination is wired in app code but not verified end-to-end on a physical device (see docs/seo/capability-promotion-checklist.md), must read as in-development, not live.`);
      }
    }
  }
}

// ── Sprint P06 Truth Sync — file extra non coperti da SCAN_DIRS ────────────
// filesToScan (sezione 6) copre già lib/blog/posts, lib/landing,
// lib/providers (data.ts + models.ts), lib/content e la roadmap sotto
// app/(frontend)/[locale]/(marketing) — ma NON lib/product-facts.ts e
// lib/llms-txt.ts (file singoli, non dentro una delle SCAN_DIRS) né
// lib/blog/nordic-overlay.json (dentro lib/blog/, non lib/blog/posts/, ed è
// .json non .ts/.tsx quindi fuori da SCAN_EXTENSIONS). Le sezioni 9-12 sotto
// devono scandire anche questi tre file esplicitamente, quindi si estende
// filesToScan con un elenco ad-hoc invece di allargare SCAN_DIRS/SCAN_EXTENSIONS
// (che restano quelli usati dalle sezioni 6-8 sopra).
const EXTRA_SCAN_FILES = [
  path.join(repoRoot, "lib/product-facts.ts"),
  path.join(repoRoot, "lib/llms-txt.ts"),
  path.join(repoRoot, "lib/blog/nordic-overlay.json"),
].filter((f) => fs.existsSync(f));
const filesToScanWithExtras = [...filesToScan, ...EXTRA_SCAN_FILES];

// ── 9. VO2 max ban (legge dalla capability truth layer) ────────────────────
// Lo stato reale vive in lib/product-facts.ts (CAPABILITY_STATUS.vo2max), non
// hardcodato qui: se un giorno Build 189/190 verifica che health espone
// VO2_MAX E health_repository.dart lo legge davvero, si aggiorna lo stato a
// "live_verified" in product-facts.ts e questo guardrail si sblocca da solo,
// senza toccare lo script. Oggi lo stato è "unsupported" (vedi il commento
// nella truth layer per l'evidenza).
//
// NON deve bloccare menzioni educative/generiche di VO2 max che non
// affermano una capacità di FitMesh — es. lib/blog/posts/vo2-max-wearable-
// comparison-2026.ts spiega cos'è il VO2 max e come lo stimano Garmin/Polar/
// Apple Watch, e dichiara esplicitamente "FitMesh does not read or display
// this value today" / "Il VO2 Max non viene letto da FitMesh oggi" —
// negazioni corrette, non claim, sia in forma attiva ("FitMesh legge/reads")
// sia passiva ("letto da FitMesh"/"read by FitMesh").
//
// Bug corretto in questo sprint: il controllo precedente cercava un verbo di
// capacità ("FitMesh legge"/"FitMesh reads") in TUTTA una finestra di 150
// caratteri attorno al termine VO2 max, quindi un vero claim su un'altra
// capacità (es. "FitMesh legge i tuoi allenamenti Polar da Health Connect")
// veniva scambiato per un claim sul VO2 max solo perché una frase onesta
// successiva ("Il VO2 Max non viene letto da FitMesh oggi") cadeva nella
// stessa finestra. Fix: il match di capacità deve stare nella STESSA frase
// del termine VO2 max (nessun punto/esclamativo/interrogativo tra i due),
// stesso principio già usato dallo scanner Strava-roadmap più sotto in
// questo file ("se c'è un punto fermo tra i due, sono frasi diverse").
const VO2_RE = /VO2\s*max|VO₂\s*max|VO2max/gi;
const VO2_PROXIMITY_WINDOW = 150;
const VO2_CAPABILITY_ACTIVE_RE = /\bFitMesh\b([^.?!]{0,40}?)\b(reads|legge|shows|mostra|displays|visualizza|imports|importa|tracks|sincronizza|syncs)\b/gi;
const VO2_CAPABILITY_PASSIVE_RE = /\b(letto|letta|mostrato|mostrata|visualizzato|visualizzata|sincronizzato|sincronizzata|importato|importata|read|shown|displayed|imported|synced)\b([^.?!]{0,40}?)\bFitMesh\b/gi;
const VO2_NEGATION_RE = /\bnon\b|\bnot\b|\bnever\b|\bmai\b|n't\b|\bdoesn't\b|\bdoes not\b/i;

if (CAPABILITY_STATUS.vo2max?.status !== "live_verified") {
  for (const file of filesToScanWithExtras) {
    const content = fs.readFileSync(file, "utf-8");
    const rel = path.relative(repoRoot, file);

    let vo2Match: RegExpExecArray | null;
    VO2_RE.lastIndex = 0;
    while ((vo2Match = VO2_RE.exec(content)) !== null) {
      const windowStart = Math.max(0, vo2Match.index - VO2_PROXIMITY_WINDOW);
      const windowEnd = Math.min(content.length, vo2Match.index + vo2Match[0].length + VO2_PROXIMITY_WINDOW);
      const window = content.slice(windowStart, windowEnd);
      const vo2StartInWindow = vo2Match.index - windowStart;
      const vo2EndInWindow = vo2StartInWindow + vo2Match[0].length;

      // Testo tra il match di capacità e il termine VO2 max (in entrambe le
      // direzioni) — usato sia per il controllo "stessa frase" sia per
      // cercare una negazione OVUNQUE in quel tratto, non solo subito prima
      // del verbo. Bug corretto in questo sprint: una frase come "FitMesh
      // legge esclusivamente quello che arriva in Health Connect, quindi
      // non riceve Body Battery, stress o VO2 max" ha un verbo di capacità
      // reale ("FitMesh legge", su Health Connect in generale) seguito più
      // avanti — nella STESSA frase — da una negazione ("non riceve") che
      // nega specificamente il VO2 max. Un controllo solo sul testo subito
      // prima del verbo non la vede; un controllo sull'intero tratto sì.
      const betweenText = (matchIndex: number, matchLength: number) =>
        matchIndex + matchLength <= vo2StartInWindow
          ? window.slice(matchIndex + matchLength, vo2StartInWindow)
          : window.slice(vo2EndInWindow, matchIndex);

      const sameSentence = (matchIndex: number, matchLength: number) =>
        !/[.!?]/.test(betweenText(matchIndex, matchLength));

      let found = false;

      let capMatch: RegExpExecArray | null;
      VO2_CAPABILITY_ACTIVE_RE.lastIndex = 0;
      while (!found && (capMatch = VO2_CAPABILITY_ACTIVE_RE.exec(window)) !== null) {
        if (VO2_NEGATION_RE.test(capMatch[1])) continue; // "FitMesh non legge/does not read" — negazione corretta
        if (!sameSentence(capMatch.index, capMatch[0].length)) continue; // capacità menzionata in un'altra frase
        if (VO2_NEGATION_RE.test(betweenText(capMatch.index, capMatch[0].length))) continue; // negazione più avanti nella stessa frase ("...quindi non riceve...VO2 max")
        problems.push(`[vo2max scan] ${rel} has "${vo2Match[0]}" near "FitMesh${capMatch[1]}${capMatch[2]}" (capability status: ${CAPABILITY_STATUS.vo2max?.status}) — ${CAPABILITY_STATUS.vo2max?.note} Context: "...${window.replace(/\s+/g, " ")}..."`);
        found = true;
      }

      let passiveMatch: RegExpExecArray | null;
      VO2_CAPABILITY_PASSIVE_RE.lastIndex = 0;
      while (!found && (passiveMatch = VO2_CAPABILITY_PASSIVE_RE.exec(window)) !== null) {
        // La negazione precede il verbo passivo ("non viene letto"/"is not
        // read"), non sta tra il verbo e "FitMesh" — a differenza della forma
        // attiva, qui va controllato il testo PRIMA del match, non il gruppo
        // catturato dopo il verbo.
        const precedingText = window.slice(Math.max(0, passiveMatch.index - 20), passiveMatch.index);
        if (VO2_NEGATION_RE.test(precedingText)) continue; // "non viene letto da FitMesh/not read by FitMesh" — negazione corretta
        if (!sameSentence(passiveMatch.index, passiveMatch[0].length)) continue;
        if (VO2_NEGATION_RE.test(betweenText(passiveMatch.index, passiveMatch[0].length))) continue;
        problems.push(`[vo2max scan] ${rel} has "${vo2Match[0]}" near "${passiveMatch[1]}${passiveMatch[2]}FitMesh" (capability status: ${CAPABILITY_STATUS.vo2max?.status}) — ${CAPABILITY_STATUS.vo2max?.note} Context: "...${window.replace(/\s+/g, " ")}..."`);
        found = true;
      }
    }
  }
}

// ── 10. Garmin OAuth / FitMesh Pro ban ─────────────────────────────────────
// FitMesh non ha oggi alcuna integrazione OAuth Garmin diretta e live: la
// partnership è stata richiesta ma non ha mai ricevuto risposta, e non esiste
// alcun codice OAuth Garmin funzionante nel repo app (nessun client_id reale,
// nessun provider Garmin raggiungibile dalla UI). Questo NON significa che
// Garmin sia del tutto assente dal sito: il bridge generico Health Connect
// (Android) e Apple Salute (iPhone) — entrambi scritti da Garmin Connect, non
// da FitMesh — restano un percorso legittimo per i dati di base, descritto
// onestamente in lib/blog/posts/garmin-body-battery-health-connect.ts
// (riscritto in Sprint P0.6A, non più disabilitato). Questo guardrail
// impedisce che un claim di OAuth Garmin DIRETTO in FitMesh (via "FitMesh
// Pro" o altrimenti) ricompaia altrove, inclusi i JSON di traduzione.
//
// Prima di riabilitare un claim "FitMesh Pro" + Garmin OAuth diretto:
// verificare che esista un vero client OAuth Garmin (build-with-secrets.sh o
// equivalente) E che l'app Flutter abbia un provider Garmin funzionante e
// raggiungibile dalla UI, non solo un mockup in roadmap.
const GARMIN_PRO_WINDOW = 200;
const FITMESH_PRO_RE = /FitMesh Pro/g;
const GARMIN_PRO_CONTEXT_RE = /\bOAuth\b|Body Battery|\bstress\b/i;
// Sprint P0.6A: il post è stato riscritto (non più disabilitato) per dire
// esplicitamente "non esiste alcuna integrazione OAuth Garmin in FitMesh, né
// in FitMesh Pro" — una negazione onesta che DEVE poter menzionare "FitMesh
// Pro" + "Garmin" + "OAuth" nella stessa finestra senza far scattare il
// guardrail. A differenza della sezione 9 (VO2 max), qui la negazione può
// stare PRIMA o DOPO "FitMesh Pro" nella frase a seconda della lingua (es.
// turco/giapponese/coreano mettono il verbo negato a fine frase) — quindi il
// controllo cerca la negazione in tutta la finestra, non solo subito prima
// del match, con un elenco di frasi-negazione per lingua invece di un
// singolo pattern posizionale.
const GARMIN_PRO_NEGATION_RE =
  /\bnon esiste\b|\bnessun[ao]?\b|\bné\b|\bno existe\b|\bni en\b|\bkeine\b|\bnicht\b|\bnem no\b|\baucune\b|\bni dans\b|\bnie istnieje\b|\bani w\b|\bbulunmamaktadır\b|\bniet\b|\bdoes not exist\b|\bdoesn't exist\b|\bthere is no\b|\bnone in\b|存在しません|존재하지 않습니다/i;

for (const file of filesToScanWithExtras) {
  const content = fs.readFileSync(file, "utf-8");
  const rel = path.relative(repoRoot, file);

  let proMatch: RegExpExecArray | null;
  FITMESH_PRO_RE.lastIndex = 0;
  while ((proMatch = FITMESH_PRO_RE.exec(content)) !== null) {
    const windowStart = Math.max(0, proMatch.index - GARMIN_PRO_WINDOW);
    const windowEnd = Math.min(content.length, proMatch.index + proMatch[0].length + GARMIN_PRO_WINDOW);
    const window = content.slice(windowStart, windowEnd);
    if (!/Garmin/i.test(window) || !GARMIN_PRO_CONTEXT_RE.test(window)) continue;
    if (GARMIN_PRO_NEGATION_RE.test(window)) continue; // negazione onesta ("nessuna integrazione OAuth Garmin, né in FitMesh Pro")
    problems.push(`[garmin-oauth-pro scan] ${rel} has "FitMesh Pro" near "Garmin" + OAuth/Body Battery/stress — FitMesh has no live direct Garmin OAuth integration today: the partnership request was never answered and no working Garmin OAuth code (real client_id, reachable UI) exists anywhere in the app repo. This is the exact false-claim pattern already fixed in lib/blog/posts/garmin-body-battery-health-connect.ts (rewritten in Sprint P0.6A to describe the real Health Connect/Apple Health bridge instead) — do not let it resurface. Context: "...${window.replace(/\s+/g, " ")}..."`);
  }
}

// ── 11. Background-sync claim assoluto ban ─────────────────────────────────
// Non esiste, e non può onestamente esistere, un sync in background
// GARANTITO: su Android, WorkManager è realmente configurato di default e
// l'app richiede davvero l'esenzione dall'ottimizzazione batteria
// all'utente (onboarding + dashboard, verificato sul codice Flutter reale in
// Sprint P0.6A — l'affermazione precedente che l'esenzione non fosse mai
// richiesta era obsoleta) — ma anche con l'esenzione concessa resta un
// "best-effort": Doze mode e i battery manager dei singoli produttori
// Android possono comunque ritardare o saltare le esecuzioni. iOS non ha
// nessun HKObserverQuery/enableBackgroundDelivery reale (solo polling in
// foreground), e la catena BLE dell'anello ha zero background su entrambe le
// piattaforme. Il claim da bloccare è quindi "background sync garantito/
// sempre attivo", non "background best-effort su Android quando l'esenzione
// è concessa" (quest'ultimo è vero e pubblicabile). Vedi
// AppFitmesh/docs/sprints/sprint-004-universal-sync-reliability.md per il
// contesto originale (sui punti diversi da questo, il documento resta
// valido: nessun sync realmente universale, iOS/anello invariati).
//
// Il controllo cerca un claim assoluto (sempre/always/non devi aprire
// l'app/you don't need to open the app/in tempo reale/real-time/near
// real-time/seamlessly/senza che tu debba fare niente) vicino a una
// co-occorrenza di "background" + "sync"/"sincronizza", a meno che (a) la
// stessa finestra di testo contenga già un qualificatore onesto (depends
// on/dipende da/quando apri l'app/when you open the app — gli stessi usati
// altrove in questo file per claim analoghe), oppure (b) subito prima del
// claim assoluto compaia una negazione ("non"/"not" — stesso principio della
// sezione free-plan sopra: "FitMesh non è real-time istantaneo, ma è
// automatico" è una negazione onesta, non una promessa assoluta).
//
// Nota (rivisto manualmente in Sprint P0.6A, come previsto dal commento
// originale sopra): il controllo su "sempre"/"always" dava un falso positivo
// verificato su contenuti diagnostici/troubleshooting che descrivono DOVE si
// verifica un problema di sync ("il problema si trova quasi sempre al
// secondo o quarto passaggio" / "the break is almost always at the second or
// fourth") piuttosto che promettere affidabilità. "Quasi sempre"/"almost
// always" è già un hedge onesto (non è "sempre" assoluto) — se il match è
// immediatamente preceduto da "quasi"/"almost" non è la claim assoluta che
// questo controllo vuole bloccare.
const BG_SYNC_PROXIMITY_WINDOW = 160;
const BG_SYNC_NEGATION_WINDOW = 40;
// "\bsync\b" (con \b finale) NON matcherebbe "syncs"/"syncing"/"synced" —
// stesso tipo di bug \b già documentato altrove in questo file (vedi
// commento su "non c'è" sopra): il confine di parola richiede una
// transizione tra \w e non-\w, ma tra "sync" e la "s" di "syncs" non c'è
// alcuna transizione (entrambi sono \w). Niente \b finale, quindi.
const BG_SYNC_CONTEXT_RE = /\bsync|\bsincronizza/i;
const BG_SYNC_HONEST_QUALIFIER_RE = /depends on|dipende da|quando apri l'app|when you open the app/i;
const BG_SYNC_NEGATION_RE = /\bnon\b|\bnot\b/i;
const BG_ABSOLUTE_CLAIMS: { label: string; re: RegExp }[] = [
  { label: "sempre/always", re: /\bsempre\b|\balways\b/gi },
  { label: "non devi aprire l'app / you don't need to open the app", re: /non devi aprire (?:l'app|alcuna app)|you (?:don't|do not) need to open (?:the|any) app/gi },
  { label: "real-time / in tempo reale / near real-time", re: /real[- ]?time|tempo reale/gi },
  { label: "seamlessly", re: /seamlessly/gi },
  { label: "senza che tu debba fare niente", re: /senza che tu debba fare niente/gi },
  // "guaranteed"/"garantito" applicato al sync in background è esattamente
  // la distinzione che questo controllo deve far rispettare: il background
  // work su Android è reale ma best-effort, MAI garantito (Doze/battery
  // manager possono ancora interferire anche con l'esenzione concessa).
  { label: "guaranteed/garantito background sync", re: /guaranteed|garantit[oa]/gi },
];

for (const file of filesToScanWithExtras) {
  const content = fs.readFileSync(file, "utf-8");
  const rel = path.relative(repoRoot, file);

  for (const { label, re } of BG_ABSOLUTE_CLAIMS) {
    re.lastIndex = 0;
    let claimMatch: RegExpExecArray | null;
    while ((claimMatch = re.exec(content)) !== null) {
      const ctxStart = Math.max(0, claimMatch.index - BG_SYNC_PROXIMITY_WINDOW);
      const ctxEnd = Math.min(content.length, claimMatch.index + claimMatch[0].length + BG_SYNC_PROXIMITY_WINDOW);
      const ctx = content.slice(ctxStart, ctxEnd);
      if (!/background/i.test(ctx)) continue;
      if (!BG_SYNC_CONTEXT_RE.test(ctx)) continue;
      if (BG_SYNC_HONEST_QUALIFIER_RE.test(ctx)) continue; // qualificatore onesto già presente, claim non assoluta

      const negStart = Math.max(0, claimMatch.index - BG_SYNC_NEGATION_WINDOW);
      const negWindow = content.slice(negStart, claimMatch.index);
      if (BG_SYNC_NEGATION_RE.test(negWindow)) continue; // negazione onesta immediatamente prima del match
      if (/\b(quasi|almost)\s*$/i.test(negWindow)) continue; // "quasi sempre"/"almost always" è già un hedge, non una claim assoluta

      problems.push(`[background-sync-absolute scan] ${rel} has "${claimMatch[0]}" (${label}) near a "background"+"sync" co-occurrence with no honest qualifier nearby (depends on/dipende da/quando apri l'app/when you open the app) and no negation immediately before it — no universal always-on background sync exists or can honestly exist: Android OEM battery killers (no battery exemption granted), iOS has no real HKObserverQuery/enableBackgroundDelivery (foreground polling only), the BLE ring chain has zero background path. See AppFitmesh/docs/sprints/sprint-004-universal-sync-reliability.md. Context: "...${ctx.replace(/\s+/g, " ")}..."`);
    }
  }
}

// ── 12. Founder iOS-waitlist ban ────────────────────────────────────────────
// iOS è live sull'App Store dal 2026-07-10 (confermato su tutte le storefront
// UE il 2026-07-13 tramite l'API pubblica di lookup Apple). Qualunque copy
// che tratti iOS come "in arrivo"/"da avvisare al lancio" — form o CTA di
// raccolta email in stile "iscriviti alla waitlist per iOS" — è obsoleta:
// oggi non esiste alcun form di waitlist iOS nel sito (verificato durante
// questo sprint), quindi questo controllo è puramente un guardrail di
// regressione per il futuro, non la correzione di un problema già trovato.
// Prima di riabilitare un claim simile, verificare che iOS sia davvero
// tornato non disponibile su App Store (non il caso oggi).
const IOS_WAITLIST_WINDOW = 150;
const IOS_RE = /\biOS\b/g;
const WAITLIST_TERMS_RE = /\bwaitlist\b|lista d'attesa|\bavvisami\b|notify me|lancio iOS|iOS launch/i;
// "Founder" is a pricing promotion, not a beta waitlist" (e o l'equivalente
// italiano) è il disclaimer CORRETTO che questo stesso sprint ha scritto —
// nega esplicitamente l'esistenza di una waitlist, non ne promette una. Bug
// trovato in P0.6A: il match di "iOS" su una riga vicina ma non correlata
// (es. "Health Connect on Android and ... on iOS") faceva scattare il
// controllo anche quando la frase-waitlist trovata era questa negazione.
const WAITLIST_NEGATION_RE = /not a (?:beta )?waitlist|non è una (?:beta )?lista d'attesa|not invite-only/i;

for (const file of filesToScanWithExtras) {
  const content = fs.readFileSync(file, "utf-8");
  const rel = path.relative(repoRoot, file);

  let iosMatch: RegExpExecArray | null;
  IOS_RE.lastIndex = 0;
  while ((iosMatch = IOS_RE.exec(content)) !== null) {
    // "scarica su Android o iOS"/"download on Android or iOS" è un claim di
    // disponibilità congiunta (entrambe le piattaforme sono già live), non un
    // claim "aspetta iOS" — se "iOS" è preceduto a breve distanza da
    // "Android" + connettore, non è la frase-waitlist che questo controllo
    // vuole bloccare, anche se compare vicino a una waitlist di UN'ALTRA
    // feature (es. Mesh Famiglia, ancora in sviluppo indipendentemente dalla
    // disponibilità store). Stesso principio già usato per "Android ...
    // worldwide" più sopra in questo file.
    const beforeIos = content.slice(Math.max(0, iosMatch.index - 20), iosMatch.index);
    if (/Android\s+(?:or|and|e|o|und|y|et|i|ve)\s*$/i.test(beforeIos)) continue;

    const windowStart = Math.max(0, iosMatch.index - IOS_WAITLIST_WINDOW);
    const windowEnd = Math.min(content.length, iosMatch.index + iosMatch[0].length + IOS_WAITLIST_WINDOW);
    const window = content.slice(windowStart, windowEnd);
    const waitlistMatch = window.match(WAITLIST_TERMS_RE);
    if (!waitlistMatch) continue;
    const waitlistCtxStart = Math.max(0, (waitlistMatch.index ?? 0) - 40);
    const waitlistCtxEnd = Math.min(window.length, (waitlistMatch.index ?? 0) + waitlistMatch[0].length + 40);
    if (WAITLIST_NEGATION_RE.test(window.slice(waitlistCtxStart, waitlistCtxEnd))) continue; // negazione corretta ("non è una waitlist")
    problems.push(`[ios-waitlist scan] ${rel} has "iOS" near a waitlist/notify-me phrase (waitlist/lista d'attesa/avvisami/notify me/lancio iOS/iOS launch) — iOS has been live on the App Store since 2026-07-10 (confirmed on every EU storefront 2026-07-13 via the public Apple lookup API), it is not "coming soon" and does not need a waitlist signup. Context: "...${window.replace(/\s+/g, " ")}..."`);
  }
}

// ── 13. llms.txt internal link check ────────────────────────────────────────
// /llms.txt è rivolto ai crawler AI: un link marcato come pagina reale che in
// realtà fa 404 è peggio di nessun link (un assistente AI cita l'URL rotto
// come fonte). Questo controllo estrae OGNI URL interno (SITE_URL + path) dal
// testo generato da generateLlmsTxt() (già disponibile in `txt`, sezione 1) e
// verifica che esista davvero una route App Router sotto
// app/(frontend)/[locale]/ — o, per i pochi path non localizzati come
// /delete-account, sotto app/(frontend)/ direttamente.
//
// La verifica cammina il filesystem delle route invece di elencare gli slug
// validi a mano: attraversa i route group tra parentesi ("(marketing)"), che
// non consumano un segmento URL, e le cartelle dinamiche "[slug]"/
// "[...slug]", che ne consumano uno (o tutti i rimanenti, se catch-all) — lo
// stesso meccanismo di risoluzione di Next.js App Router, non un elenco
// statico da tenere sincronizzato a mano ogni volta che una pagina si sposta.
const LLMS_APP_ROOT = path.join(repoRoot, "app", "(frontend)");
const LLMS_LOCALE_APP_ROOT = path.join(LLMS_APP_ROOT, "[locale]");
const LLMS_PAGE_FILES = ["page.tsx", "page.ts", "page.jsx", "page.js"];
const LLMS_ROUTE_FILES = ["route.ts", "route.tsx", "route.js"];

function llmsHasLeafRoute(dir: string): boolean {
  return [...LLMS_PAGE_FILES, ...LLMS_ROUTE_FILES].some((f) => fs.existsSync(path.join(dir, f)));
}

function llmsIsRouteGroup(name: string): boolean {
  return name.startsWith("(") && name.endsWith(")");
}

function llmsIsDynamicSegment(name: string): boolean {
  return name.startsWith("[") && name.endsWith("]");
}

function llmsIsCatchAllSegment(name: string): boolean {
  return name.startsWith("[...") || name.startsWith("[[...");
}

/**
 * Risolve `segments` (path già spezzato su "/", senza segmenti vuoti) a
 * partire da `dir`, attraversando route group e cartelle dinamiche come
 * farebbe Next.js App Router. Ritorna true se esiste una page/route reale a
 * cui l'URL corrisponde.
 */
function llmsRouteExists(dir: string, segments: string[]): boolean {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  const subdirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (segments.length === 0) {
    if (llmsHasLeafRoute(dir)) return true;
    // La pagina foglia può stare dentro un route group senza consumare altri
    // segmenti URL (es. /it → (marketing)/page.tsx).
    return subdirs.some(
      (name) => llmsIsRouteGroup(name) && llmsRouteExists(path.join(dir, name), segments),
    );
  }

  const [first, ...rest] = segments;
  for (const name of subdirs) {
    if (llmsIsRouteGroup(name)) {
      if (llmsRouteExists(path.join(dir, name), segments)) return true;
      continue;
    }
    if (name === first) {
      if (llmsRouteExists(path.join(dir, name), rest)) return true;
      continue;
    }
    if (llmsIsDynamicSegment(name)) {
      const nextSegments = llmsIsCatchAllSegment(name) ? [] : rest;
      if (llmsRouteExists(path.join(dir, name), nextSegments)) return true;
    }
  }
  return false;
}

const SITE_URL_ESCAPED = SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LLMS_INTERNAL_URL_RE = new RegExp(`${SITE_URL_ESCAPED}([\\/\\w.-]*)`, "g");

const llmsInternalUrlPaths = new Set<string>();
let llmsUrlMatch: RegExpExecArray | null;
LLMS_INTERNAL_URL_RE.lastIndex = 0;
while ((llmsUrlMatch = LLMS_INTERNAL_URL_RE.exec(txt)) !== null) {
  llmsInternalUrlPaths.add(llmsUrlMatch[1] ?? "");
}

for (const rawPath of llmsInternalUrlPaths) {
  // Query string/hash non sono mai emessi da generateLlmsTxt() oggi, ma il
  // controllo li strippa comunque per non dipendere da quella garanzia.
  const pathWithoutQueryHash = rawPath.split("?")[0].split("#")[0];
  const segments = pathWithoutQueryHash.split("/").filter(Boolean);

  if (segments.length === 0) continue; // link nudo a SITE_URL senza path, non un caso reale oggi

  const [maybeLocale, ...restSegments] = segments;
  const isLocalized = (locales as readonly string[]).includes(maybeLocale);
  const baseDir = isLocalized ? LLMS_LOCALE_APP_ROOT : LLMS_APP_ROOT;
  const routeSegments = isLocalized ? restSegments : segments;

  if (!llmsRouteExists(baseDir, routeSegments)) {
    problems.push(`[llms-txt-link scan] generateLlmsTxt() links to "${SITE_URL}${rawPath}" but no matching page/route exists under ${path.relative(repoRoot, baseDir)}/ for segments [${routeSegments.join("/")}] — fix the slug in lib/llms-txt.ts, or remove the link entirely if no equivalent page exists.`);
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
