/**
 * P0.8 — guardrail HTTP di regressione per il routing norvegese nb/nn -> no.
 *
 * Bug originale: '/nb/...' e '/nn/...' non erano riconosciute come locale
 * (solo 'no' esiste in lib/i18n.ts), quindi needsLocalePrefix() in
 * middleware.ts le trattava come deep link SENZA prefisso e ci prependeva
 * davanti la lingua negoziata: '/it/nb/blog/...'. Vedi middleware.ts e
 * lib/locale-negotiation.ts per il fix.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const errors: string[] = [];

async function fetchNoRedirect(pathname: string, headers: Record<string, string> = {}) {
  return fetch(`${BASE_URL}${pathname}`, { headers, redirect: "manual" });
}

interface RedirectCase {
  label: string;
  path: string;
  headers?: Record<string, string>;
  expectedStatus: number;
  expectedLocation: string;
}

const REDIRECT_CASES: RedirectCase[] = [
  // Accept-Language negoziato su un path SENZA alcun prefisso locale (root).
  { label: "nb-NO Accept-Language su / -> /no", path: "/", headers: { "accept-language": "nb-NO" }, expectedStatus: 307, expectedLocation: "/no" },
  { label: "nn-NO Accept-Language su / -> /no", path: "/", headers: { "accept-language": "nn-NO" }, expectedStatus: 307, expectedLocation: "/no" },
  { label: "no-NO Accept-Language su / -> /no", path: "/", headers: { "accept-language": "no-NO" }, expectedStatus: 307, expectedLocation: "/no" },
  // Canonicalizzazione esplicita del prefisso /nb, /nn -> /no (308, deterministico).
  { label: "/nb -> /no", path: "/nb", expectedStatus: 308, expectedLocation: "/no" },
  { label: "/nb/blog/fitmesh-arriva-su-iphone -> /no/blog/fitmesh-arriva-su-iphone", path: "/nb/blog/fitmesh-arriva-su-iphone", expectedStatus: 308, expectedLocation: "/no/blog/fitmesh-arriva-su-iphone" },
  { label: "/nn/blog/fitmesh-arriva-su-iphone -> /no/blog/fitmesh-arriva-su-iphone", path: "/nn/blog/fitmesh-arriva-su-iphone", expectedStatus: 308, expectedLocation: "/no/blog/fitmesh-arriva-su-iphone" },
  // Query string preservata.
  { label: "/nb/blog?utm_source=x -> /no/blog?utm_source=x", path: "/nb/blog?utm_source=x", expectedStatus: 308, expectedLocation: "/no/blog?utm_source=x" },
  // Un prefisso 'nb'/'nn' che è in realtà parte di un altro segmento non deve confondersi
  // (nessun path reale del genere nel sito oggi, ma verifica che il match sia sul segmento intero).
];

async function runRedirectChecks() {
  for (const testCase of REDIRECT_CASES) {
    let res: Response;
    try {
      res = await fetchNoRedirect(testCase.path, testCase.headers ?? {});
    } catch (err) {
      errors.push(`${testCase.label}: fetch fallita — ${(err as Error).message}`);
      continue;
    }
    if (res.status !== testCase.expectedStatus) {
      errors.push(`${testCase.label}: status ${res.status} (atteso ${testCase.expectedStatus})`);
      continue;
    }
    const location = res.headers.get("location");
    if (!location) {
      errors.push(`${testCase.label}: nessun header Location`);
      continue;
    }
    const locationUrl = new URL(location, BASE_URL);
    const actual = locationUrl.pathname + locationUrl.search;
    if (actual !== testCase.expectedLocation) {
      errors.push(`${testCase.label}: Location = "${actual}" (atteso "${testCase.expectedLocation}")`);
    }
    if (/^\/it\/nb\b|^\/[a-z]{2}\/nb\b|^\/[a-z]{2}\/nn\b/.test(actual)) {
      errors.push(`${testCase.label}: Location "${actual}" contiene il bug originale (doppio prefisso locale davanti a nb/nn)`);
    }
  }
}

// Nessun secondo hop: seguendo il redirect di /nb/X si atterra su /no/X con 200 diretto.
async function runSingleHopChecks() {
  const singleHopCases = [
    { label: "/nb -> /no (single hop, poi 200)", path: "/nb", finalPath: "/no" },
    { label: "/nn/blog -> /no/blog (single hop, poi 200)", path: "/nn/blog", finalPath: "/no/blog" },
  ];
  for (const { label, path, finalPath } of singleHopCases) {
    const first = await fetchNoRedirect(path);
    if (first.status < 300 || first.status >= 400) {
      errors.push(`${label}: prima risposta non è un redirect (status ${first.status})`);
      continue;
    }
    const location = first.headers.get("location");
    const actualFirstHop = location ? new URL(location, BASE_URL).pathname : null;
    if (actualFirstHop !== finalPath) {
      errors.push(`${label}: primo hop porta a "${actualFirstHop}" invece di "${finalPath}"`);
      continue;
    }
    const second = await fetchNoRedirect(finalPath);
    if (second.status !== 200) {
      errors.push(`${label}: "${finalPath}" (destinazione del redirect) non risponde 200 diretto (status ${second.status}) — possibile loop o rottura`);
    }
  }
}

// Gli URL /no/... espliciti devono restare stabili: mai redirectati per motivi geografici o di negoziazione.
async function runStableNoChecks() {
  const stableCases = [
    { label: "/no resta 200 con Accept-Language it-IT", path: "/no", headers: { "accept-language": "it-IT" } },
    { label: "/no/blog resta 200 con country IT", path: "/no/blog", headers: { "x-vercel-ip-country": "IT" } },
  ];
  for (const { label, path, headers } of stableCases) {
    const res = await fetchNoRedirect(path, headers);
    if (res.status !== 200) {
      errors.push(`${label}: status ${res.status} (atteso 200 — una route /no/... esplicita non deve mai essere redirectata)`);
    }
  }
}

async function main() {
  await runRedirectChecks();
  await runSingleHopChecks();
  await runStableNoChecks();

  if (errors.length > 0) {
    console.error(`❌ Locale routing guardrail (nb/nn/no): ${errors.length} problema/i`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(
    `✅ Locale routing guardrail: ${REDIRECT_CASES.length} casi di redirect + 2 single-hop + 2 stabilità /no verificati contro ${BASE_URL}. Nessun /it/nb, nessun loop.`,
  );
}

main().catch((err) => {
  console.error("❌ Locale routing guardrail: errore inatteso", err);
  process.exit(1);
});
