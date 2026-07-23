/**
 * Guardrail hotfix P0.4A — iOS EU go-live + locale routing.
 *
 * Due parti indipendenti:
 *  1. Scan statico del codice sorgente: fallisce se sopravvivono claim
 *     "iOS in arrivo"/"EU rollout in corso"/"DSA trader status pending" o
 *     se il gating geografico (fm_geo, IOS_ENABLED, EU27, ecc.) è tornato.
 *  2. Test HTTP contro un server reale (`next start`, BASE_URL, default
 *     http://localhost:3000): negoziazione lingua (cookie > Accept-Language
 *     con q-values > geo IP > 'en'), redirect 307 non permanente, CTA App
 *     Store sempre live in SSR, Smart App Banner incondizionato, nessun
 *     Set-Cookie fm_geo, nessuna route già localizzata cambiata per motivi
 *     geografici.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const errors: string[] = [];

// ── Parte 1: scan statico ───────────────────────────────────────────────────

const SCAN_DIRS = ["app", "components", "lib"];
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
    } else if (/\.(ts|tsx|json)$/.test(entry.name)) {
      out.push(full);
    }
  }
}

const filesToScan: string[] = [];
for (const dir of SCAN_DIRS) walk(path.join(repoRoot, dir), filesToScan);

// Fallback/dead-flag identifiers: se tornano, il gating geografico è stato
// reintrodotto per errore (es. un merge/rebase che riporta codice vecchio).
const DEAD_IDENTIFIERS = [
  "IOS_ENABLED",
  "isIosAvailable",
  "countryFromCookie",
  "GEO_COOKIE",
  "fm_geo",
  "NEXT_PUBLIC_IOS_ENABLED",
];

// Frasi commerciali stale (multi-lingua): "iOS in arrivo"/"coming soon"/
// "EU rollout in progress"/DSA-trader-status-pending. Wildcard sui pattern
// più comuni piuttosto che un elenco esaustivo di ogni possibile frase —
// completato dal grep manuale eseguito in questo stesso sprint.
const STALE_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "iOS coming soon (en)", re: /iOS (?:is )?coming soon/i },
  { label: "iOS in arrivo (it)", re: /iOS[^.]{0,20}in arrivo/i },
  { label: "EU rollout in progress (en)", re: /EU rollout (?:is )?in progress/i },
  { label: "rollout UE in corso (it)", re: /rollout (?:nell'|nei )?[^.]{0,15}UE[^.]{0,20}(?:è |e )?in corso/i },
  { label: "DSA trader-status pending", re: /DSA[^.]{0,60}trader[- ]status/i },
  { label: "verifica DSA (it)", re: /verifica DSA/i },
  { label: "outside the EU (availability gating, en)", re: /outside the (?:EU|European Union)\b/ },
  { label: "fuori dall'UE / fuori dall'Unione Europea (it)", re: /fuori dall'(?:UE|Unione Europea)\b/ },
  { label: "TestFlight as current status", re: /\bTestFlight\b/ },
  { label: "join iOS beta (en)", re: /join the iOS beta/i },
  { label: "únete a la beta de iOS (es)", re: /únete a la beta de iOS/i },
  // P1.3T-Q-A (2026-07-23): "fitmesh ios beta" (o varianti di casing/lingua)
  // sopravviveva come secondary keyword pubblica su fitmesh-arriva-su-iphone
  // (emessa in <meta name="keywords"> e BlogPosting.keywords) molto dopo che
  // l'app era già live sull'App Store. Pattern ampio e multi-lingua: intercetta
  // "ios beta"/"beta ios" ovunque compaiano vicini, incluse le forme
  // transliterate giapponese/coreano usate come loanword.
  { label: "ios beta / beta ios (keyword, multi-lingua)", re: /\bios[\s-]*beta\b|\bbeta[\s-]*ios\b/i },
  { label: "iOS beta transliterato (ja/ko loanword)", re: /ios\s*(?:ベータ|베타)|(?:ベータ|베타)\s*ios/i },
  { label: "iOS non ancora pubblicata (it)", re: /iOS[^.]{0,20}non\s*(?:è|ancora)\s*(?:ancora\s*)?(?:disponibil|pubblicat)/i },
];

// File con match legittimi verificati manualmente (2026-07-13), non legati al
// gating iOS/App Store — esclusi per nome file specifico invece di rendere le
// regex più permissive (che rischierebbe di nascondere una vera regressione):
//   - privacy/page.tsx: sezione GDPR "international data transfers", non iOS.
//   - lib/billing/app-store.ts: commento tecnico su verifyReceipt Apple
//     (TestFlight è un ambiente sandbox legittimo, non uno stato "iOS non
//     ancora pubblicata").
//   - guida-sync-wearable-2026.ts: sede legale dei produttori wearable
//     (Samsung/Google/Fitbit/Garmin/Xiaomi/Huawei), non disponibilità iOS.
//   - anello-vs-smartwatch.ts: commento di sorgente che AFFERMA L'ASSENZA di
//     un claim iOS-beta ("Nessun claim iOS-beta"), non il claim stesso —
//     verificato manualmente (2026-07-23, P1.3T-Q-A).
const KNOWN_SAFE_FILES = new Set([
  path.join("app", "(frontend)", "[locale]", "(marketing)", "privacy", "page.tsx"),
  path.join("lib", "billing", "app-store.ts"),
  path.join("lib", "blog", "posts", "guida-sync-wearable-2026.ts"),
  path.join("lib", "blog", "posts", "anello-vs-smartwatch.ts"),
]);

for (const file of filesToScan) {
  const rel = path.relative(repoRoot, file);
  // Questo file stesso contiene le stringhe-pattern come dati di guardrail: escluso.
  if (rel === path.join("tools", "check-ios-eu-truth.ts")) continue;
  if (KNOWN_SAFE_FILES.has(rel)) continue;
  const content = fs.readFileSync(file, "utf-8");

  for (const identifier of DEAD_IDENTIFIERS) {
    if (content.includes(identifier)) {
      errors.push(`[dead-flag scan] ${rel} still references "${identifier}" — iOS EU geo-gating must not be reintroduced`);
    }
  }

  for (const { label, re } of STALE_PATTERNS) {
    if (re.test(content)) {
      errors.push(`[stale-claim scan] ${rel} matches [${label}]`);
    }
  }
}

// ── Parte 2: test HTTP contro server reale ──────────────────────────────────

interface RedirectCase {
  label: string;
  path: string;
  headers?: Record<string, string>;
  expectedLocation: string;
  expectedStatus?: number;
}

const REDIRECT_CASES: RedirectCase[] = [
  { label: "/ + Accept-Language: de-DE -> /de", path: "/", headers: { "accept-language": "de-DE" }, expectedLocation: "/de" },
  { label: "/ + Accept-Language: it-IT -> /it", path: "/", headers: { "accept-language": "it-IT" }, expectedLocation: "/it" },
  { label: "/ + Accept-Language: fr-FR -> /fr", path: "/", headers: { "accept-language": "fr-FR" }, expectedLocation: "/fr" },
  {
    label: "/ + cookie fm_locale=en + Accept-Language de-DE -> /en (cookie wins)",
    path: "/",
    headers: { "accept-language": "de-DE", cookie: "fm_locale=en" },
    expectedLocation: "/en",
  },
  {
    label: "/ + no locale signal + x-vercel-ip-country: DE -> /de",
    path: "/",
    headers: { "x-vercel-ip-country": "DE" },
    expectedLocation: "/de",
  },
  { label: "/ + no signals at all -> /en (neutral fallback)", path: "/", expectedLocation: "/en" },
  {
    label: "q-value priority: en q=0.5, de q=0.9, it q=0.2 -> /de",
    path: "/",
    headers: { "accept-language": "en-US;q=0.5,de-DE;q=0.9,it;q=0.2" },
    expectedLocation: "/de",
  },
];

// Route già localizzate: NON devono mai cambiare per motivi geografici.
const STABLE_LOCALE_CASES: { label: string; path: string; headers: Record<string, string> }[] = [
  { label: "/de + country IT -> 200 (resta /de)", path: "/de", headers: { "x-vercel-ip-country": "IT" } },
  { label: "/it + country DE -> 200 (resta /it)", path: "/it", headers: { "x-vercel-ip-country": "DE" } },
];

async function fetchNoRedirect(pathname: string, headers: Record<string, string> = {}) {
  return fetch(`${BASE_URL}${pathname}`, { headers, redirect: "manual" });
}

async function runHttpChecks() {
  for (const testCase of REDIRECT_CASES) {
    let res: Response;
    try {
      res = await fetchNoRedirect(testCase.path, testCase.headers ?? {});
    } catch (err) {
      errors.push(`${testCase.label}: fetch fallita — ${(err as Error).message}`);
      continue;
    }
    if (res.status !== (testCase.expectedStatus ?? 307)) {
      errors.push(`${testCase.label}: status ${res.status} (atteso ${testCase.expectedStatus ?? 307})`);
      continue;
    }
    const location = res.headers.get("location");
    const locationPath = location ? new URL(location, BASE_URL).pathname : null;
    if (locationPath !== testCase.expectedLocation) {
      errors.push(`${testCase.label}: Location = "${locationPath}" (atteso "${testCase.expectedLocation}")`);
    }
    const cacheControl = res.headers.get("cache-control") ?? "";
    if (!cacheControl.includes("no-store")) {
      errors.push(`${testCase.label}: Cache-Control = "${cacheControl}" (deve includere no-store)`);
    }
    const vary = res.headers.get("vary") ?? "";
    if (!vary.includes("Accept-Language") || !vary.includes("Cookie")) {
      errors.push(`${testCase.label}: Vary = "${vary}" (deve includere Accept-Language e Cookie)`);
    }
    const setCookie = res.headers.get("set-cookie") ?? "";
    if (setCookie.includes("fm_geo")) {
      errors.push(`${testCase.label}: risposta imposta ancora il cookie fm_geo`);
    }
  }

  for (const testCase of STABLE_LOCALE_CASES) {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${testCase.path}`, { headers: testCase.headers });
    } catch (err) {
      errors.push(`${testCase.label}: fetch fallita — ${(err as Error).message}`);
      continue;
    }
    if (res.status !== 200) {
      errors.push(`${testCase.label}: status ${res.status} (atteso 200 — una route esplicita non deve mai essere redirectata per geo)`);
    }
  }

  // CTA App Store: deve essere live in SSR, mai aria-disabled, href reale.
  let homeHtml: string;
  try {
    const res = await fetch(`${BASE_URL}/en`);
    homeHtml = await res.text();
  } catch (err) {
    errors.push(`CTA App Store check: fetch di /en fallita — ${(err as Error).message}`);
    homeHtml = "";
  }
  if (homeHtml) {
    if (/aria-disabled="true"[^>]*App Store|App Store[^<]*aria-disabled="true"/i.test(homeHtml)) {
      errors.push("CTA App Store: trovato aria-disabled=\"true\" vicino al bottone App Store");
    }
    if (!/href="https:\/\/apps\.apple\.com\/app\/fitmesh-sync\/id\d+"/.test(homeHtml)) {
      errors.push("CTA App Store: nessun href assoluto verso apps.apple.com trovato in /en SSR HTML");
    }
    if (!/name="apple-itunes-app" content="app-id=\d+"/.test(homeHtml)) {
      errors.push("Smart App Banner: meta apple-itunes-app assente su /en");
    }
  }
}

async function main() {
  await runHttpChecks();

  if (errors.length > 0) {
    console.error(`❌ iOS EU truth guardrail: ${errors.length} problema/i`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(
    `✅ iOS EU truth guardrail: 0 claim stale trovati in ${filesToScan.length} file scansionati; ${REDIRECT_CASES.length} casi di negoziazione lingua + ${STABLE_LOCALE_CASES.length} route stabili verificati contro ${BASE_URL}; CTA App Store live in SSR; Smart App Banner presente; nessun fm_geo.`,
  );
}

main().catch((err) => {
  console.error("❌ iOS EU truth guardrail: errore inatteso", err);
  process.exit(1);
});
