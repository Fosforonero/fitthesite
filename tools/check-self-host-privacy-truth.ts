/**
 * Sprint P0.11-A — guardrail dedicato per /self-host e per i claim di
 * data-location corretti nell'audit privacy sitewide (P0.11 FASE 3).
 *
 * Due categorie di controllo:
 *  1. STATICI (sempre eseguibili, nessun server richiesto): grep su un set
 *     fisso di file per pattern vietati (segreti, prezzi, "coming soon",
 *     claim assoluti "tutto resta sul dispositivo" / "nessuna comunicazione
 *     esterna").
 *  2. LIVE (richiedono BASE_URL, un `next start` reale): /self-host non
 *     torna mai 404, IT/EN sono 200 diretti, le altre 13 locale collassano
 *     su EN in un solo hop (bare + locale-prefissato), hreflang coerente,
 *     sitemap contiene solo le 2 URL indicizzabili.
 *
 * Se BASE_URL non e' impostata, esegue solo i controlli statici (utile in
 * CI/pre-commit senza un server in piedi) e lo dichiara esplicitamente,
 * cosi' un "verde" parziale non si spaccia per una verifica completa.
 */
import { readFileSync } from "node:fs";
import { locales } from "@/lib/i18n";

const BASE_URL = process.env.BASE_URL;
const errors: string[] = [];

// ── FASE statica ───────────────────────────────────────────────────────
// File toccati da questo sprint (guida self-host + claim privacy corretti)
// dove i pattern vietati non devono MAI comparire.
const STATIC_FILES = [
  "lib/content/self-host-copy.ts",
  "app/(frontend)/[locale]/(marketing)/self-host/page.tsx",
  "lib/content/about-copy.ts",
  "lib/content/homepage-copy.ts",
  "app/(frontend)/[locale]/(marketing)/privacy/page.tsx",
  "app/(frontend)/[locale]/(marketing)/terms/page.tsx",
  "lib/content/faqs.ts",
  "lib/providers/data.ts",
  "lib/landing/data.ts",
  "lib/blog/posts/esportare-dati-xiaomi-amazfit.ts",
  "lib/dictionaries/it.json",
  "lib/dictionaries/en.json",
];

// Secret/service-role: MAI in copy pubblico, a prescindere dal contesto.
const SECRET_PATTERNS: RegExp[] = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /sb_secret_/i,
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/, // prefisso JWT header base64 comune a chiavi Supabase reali
];

// "Coming soon" / roadmap language — vietato esplicitamente dal mandato per
// la pagina di stato self-host (non e' "in arrivo", e' oggi cosi').
const COMING_SOON_PATTERNS: RegExp[] = [
  /coming soon/i,
  /in arrivo\b/i,
  /prossimamente/i,
  /presto disponibile/i,
  /molto presto/i,
  /stay tuned/i,
];

// Prezzo — la pagina di stato self-host non deve mai menzionare un prezzo.
const PRICE_PATTERNS: RegExp[] = [/€\s?\d/, /\$\s?\d/, /\bUSD\b/, /\bEUR\b/];

// Claim assoluti vietati sitewide (stessa lista dell'audit FASE 3).
const ABSOLUTE_CLAIM_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /tutto resta sul dispositivo/i, label: '"tutto resta sul dispositivo"' },
  { re: /(everything|all your data) stays on (the|your) device/i, label: '"everything/all data stays on device"' },
  { re: /nessuna comunicazione esterna/i, label: '"nessuna comunicazione esterna"' },
  { re: /no external communication/i, label: '"no external communication"' },
  { re: /nulla raggiunge i nostri server/i, label: '"nulla raggiunge i nostri server"' },
  { re: /nothing reaches our servers/i, label: '"nothing reaches our servers"' },
];

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

// self-host-copy.ts e page.tsx sono file NUOVI di questo sprint: il prezzo
// self-host non deve comparire nemmeno come URL/riferimento a listino.
const SELF_HOST_ONLY_FILES = new Set([
  "lib/content/self-host-copy.ts",
  "app/(frontend)/[locale]/(marketing)/self-host/page.tsx",
]);

function runStaticChecks() {
  for (const relPath of STATIC_FILES) {
    let content: string;
    try {
      content = readFileSync(relPath, "utf-8");
    } catch {
      errors.push(`file non trovato: ${relPath}`);
      continue;
    }
    const stripped = stripComments(content);

    for (const re of SECRET_PATTERNS) {
      if (re.test(stripped)) errors.push(`${relPath}: possibile secret/service-role esposto (pattern ${re})`);
    }
    for (const re of ABSOLUTE_CLAIM_PATTERNS.map((p) => p.re)) {
      const label = ABSOLUTE_CLAIM_PATTERNS.find((p) => p.re === re)!.label;
      if (re.test(stripped)) errors.push(`${relPath}: claim assoluto vietato ${label}`);
    }
    if (SELF_HOST_ONLY_FILES.has(relPath)) {
      for (const re of COMING_SOON_PATTERNS) {
        if (re.test(stripped)) errors.push(`${relPath}: linguaggio "coming soon"/roadmap vietato sulla pagina di stato self-host (pattern ${re})`);
      }
      for (const re of PRICE_PATTERNS) {
        if (re.test(stripped)) errors.push(`${relPath}: prezzo menzionato sulla pagina di stato self-host (pattern ${re})`);
      }
    }
  }
}

// ── FASE live (richiede BASE_URL) ────────────────────────────────────────
async function fetchNoRedirect(pathname: string, headers: Record<string, string> = {}) {
  return fetch(`${BASE_URL}${pathname}`, { headers, redirect: "manual" });
}

async function runLiveChecks() {
  // 1. IT/EN diretti, 200, mai 404.
  for (const lc of ["it", "en"] as const) {
    const res = await fetchNoRedirect(`/${lc}/self-host`);
    if (res.status !== 200) errors.push(`/${lc}/self-host: status ${res.status} (atteso 200)`);
  }

  // 2. Le altre 13 locale collassano su /en/self-host in UN hop (307).
  for (const lc of locales) {
    if (lc === "it" || lc === "en") continue;
    const res = await fetchNoRedirect(`/${lc}/self-host`);
    if (res.status !== 307) {
      errors.push(`/${lc}/self-host: status ${res.status} (atteso 307 -> /en/self-host)`);
      continue;
    }
    const location = new URL(res.headers.get("location") ?? "", BASE_URL).pathname;
    if (location !== "/en/self-host") {
      errors.push(`/${lc}/self-host: redirect verso ${location} (atteso /en/self-host)`);
    }
  }

  // 3. Bare /self-host (nessun prefisso locale): un solo hop a IT o EN, mai 404, mai due hop.
  const bareCases: { headers: Record<string, string>; expected: "/it/self-host" | "/en/self-host"; label: string }[] = [
    { headers: { "accept-language": "it-IT" }, expected: "/it/self-host", label: "Accept-Language it-IT" },
    { headers: { "accept-language": "en-US" }, expected: "/en/self-host", label: "Accept-Language en-US" },
    { headers: { "accept-language": "de-DE" }, expected: "/en/self-host", label: "Accept-Language de-DE (lingua non supportata da self-host)" },
    { headers: {}, expected: "/en/self-host", label: "nessun header (fallback)" },
  ];
  for (const { headers, expected, label } of bareCases) {
    const res = await fetchNoRedirect("/self-host", headers);
    if (res.status !== 307) {
      errors.push(`/self-host (${label}): status ${res.status} (atteso 307, un solo hop)`);
      continue;
    }
    const location = new URL(res.headers.get("location") ?? "", BASE_URL).pathname;
    if (location !== expected) {
      errors.push(`/self-host (${label}): redirect verso ${location} (atteso ${expected})`);
      continue;
    }
    // Verifica che la destinazione sia REALMENTE 200 (secondo hop finale, non un'altra catena).
    const res2 = await fetchNoRedirect(location);
    if (res2.status !== 200) {
      errors.push(`/self-host (${label}) -> ${location}: la destinazione finale e' ${res2.status}, non 200 (redirect rotto)`);
    }
  }

  // 4. hreflang coerente su /it/self-host e /en/self-host: it, en, x-default -> en.
  for (const lc of ["it", "en"] as const) {
    const res = await fetch(`${BASE_URL}/${lc}/self-host`);
    const html = await res.text();
    const hasIt = /<link rel="alternate" hrefLang="it" href="[^"]*\/it\/self-host"/i.test(html);
    const hasEn = /<link rel="alternate" hrefLang="en" href="[^"]*\/en\/self-host"/i.test(html);
    const xDefault = /<link rel="alternate" hrefLang="x-default" href="[^"]*\/en\/self-host"/i.test(html);
    if (!hasIt) errors.push(`/${lc}/self-host: hreflang "it" mancante o non punta a /it/self-host`);
    if (!hasEn) errors.push(`/${lc}/self-host: hreflang "en" mancante o non punta a /en/self-host`);
    if (!xDefault) errors.push(`/${lc}/self-host: hreflang "x-default" mancante o non punta a /en/self-host`);
    const canonical = new RegExp(`<link rel="canonical" href="[^"]*/${lc}/self-host"`, "i");
    if (!canonical.test(html)) errors.push(`/${lc}/self-host: canonical non self-referenziante`);
  }

  // 5. sitemap.xml contiene esattamente le 2 URL self-host indicizzabili, nessuna delle altre 13.
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();
  const selfHostUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => new URL(u).pathname.endsWith("/self-host"));
  const selfHostPaths = new Set(selfHostUrls.map((u) => new URL(u).pathname));
  if (!selfHostPaths.has("/it/self-host")) errors.push("sitemap.xml: /it/self-host assente");
  if (!selfHostPaths.has("/en/self-host")) errors.push("sitemap.xml: /en/self-host assente");
  const unexpected = [...selfHostPaths].filter((p) => p !== "/it/self-host" && p !== "/en/self-host");
  if (unexpected.length > 0) errors.push(`sitemap.xml: URL /self-host inattese trovate: ${unexpected.join(", ")}`);
}

async function main() {
  runStaticChecks();

  if (!BASE_URL) {
    if (errors.length > 0) {
      console.error(`❌ Self-host/privacy-truth guardrail (solo statico, BASE_URL non impostata): ${errors.length} problema/i`);
      for (const e of errors) console.error(`  - ${e}`);
      process.exit(1);
    }
    console.log(`✅ Self-host/privacy-truth guardrail: controlli statici OK (${STATIC_FILES.length} file). BASE_URL non impostata: controlli live (404/redirect/hreflang/sitemap) SALTATI, non dichiarati verdi.`);
    return;
  }

  await runLiveChecks();

  if (errors.length > 0) {
    console.error(`❌ Self-host/privacy-truth guardrail: ${errors.length} problema/i`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✅ Self-host/privacy-truth guardrail: statico (${STATIC_FILES.length} file) + live (IT/EN 200, 13 locale -> 307 EN, 4 casi bare-path 1-hop, hreflang, sitemap) tutti verdi contro ${BASE_URL}.`);
}

main().catch((err) => {
  console.error("❌ Self-host/privacy-truth guardrail: errore inatteso", err);
  process.exit(1);
});
