/**
 * Guardrail: fallisce se /llms.txt contiene claim incompatibili con
 * lib/product-facts.ts (la fonte unica dei fatti prodotto).
 *
 * /llms.txt è GENERATO da lib/product-facts.ts via lib/llms-txt.ts, quindi in
 * teoria non può divergere — questo script esiste per due motivi concreti:
 *  1. Blocca una regressione se in futuro qualcuno hardcoda di nuovo un
 *     valore dentro lib/llms-txt.ts invece di leggerlo da product-facts.
 *  2. Elenca esplicitamente, in un unico posto verificabile da CI, le frasi
 *     "morte" che NON devono mai ricomparire (Android-only, iOS 2027, closed
 *     beta/100 founder, free tier, prezzi non attuali) — la lista stessa è
 *     la documentazione vivente di cosa questo sprint ha corretto.
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx -y tsx tools/check-llms-consistency.ts
 */
import { generateLlmsTxt } from "../lib/llms-txt";
import {
  PLAY_STORE_URL,
  AVAILABILITY,
  FOUNDER_PROGRAM,
  PRICING_FACTS,
} from "../lib/product-facts";

const txt = generateLlmsTxt();

type Problem = string;
const problems: Problem[] = [];

// ── 1. Frasi obsolete che NON devono mai ricomparire ───────────────────────
const BANNED: { label: string; re: RegExp }[] = [
  { label: "Android-only claim", re: /Android[- ]only/i },
  { label: "iOS planned 2027", re: /iOS\s*\(?\s*planned\s*2027/i },
  { label: "closed beta claim", re: /closed beta/i },
  { label: "100 founder seats (stale program size)", re: /100\s+founder/i },
  { label: "stale free-tier claim", re: /Free tier/i },
];
for (const { label, re } of BANNED) {
  if (re.test(txt)) problems.push(`Contains banned legacy claim [${label}]: matched ${re}`);
}

// ── 2. Fatti correnti che DEVONO comparire (cross-check contro product-facts) ──
const REQUIRED: { label: string; value: string }[] = [
  { label: "Play Store URL", value: PLAY_STORE_URL },
  { label: "App Store URL", value: AVAILABILITY.ios.storeUrl },
  { label: "founder total seats", value: String(FOUNDER_PROGRAM.totalSeats) },
  { label: "Android lifetime price", value: PRICING_FACTS.lifetimeAndroid.amount },
  { label: "iOS lifetime price", value: PRICING_FACTS.lifetimeIos.amount },
  { label: "6-month sub price", value: PRICING_FACTS.subSixMonths.amount },
];
for (const { label, value } of REQUIRED) {
  if (!txt.includes(value)) problems.push(`Missing expected current fact [${label}]: "${value}" not found in generated text`);
}

// ── 3. "App gratis, Pro è IAP" deve essere esplicito (non solo un prezzo nudo) ──
if (!/free to download/i.test(txt)) {
  problems.push("Missing explicit 'free to download' framing for the app itself (Offer correctness).");
}

if (problems.length > 0) {
  console.error(`❌ llms.txt consistency: ${problems.length} problema/i.\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`✅ llms.txt consistency OK: ${txt.length} caratteri generati, nessuna claim obsoleta, tutti i fatti correnti presenti.`);
