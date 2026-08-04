/**
 * Sprint P0.11-A — guardrail dedicato per /self-host e per i claim di
 * data-location corretti nell'audit privacy sitewide (P0.11 FASE 3).
 *
 * Due categorie di controllo:
 *  1. STATICI (sempre eseguibili, nessun server richiesto): grep su un set
 *     fisso di file per pattern vietati (segreti, prezzi, "coming soon",
 *     claim assoluti "tutto resta sul dispositivo" / "nessuna comunicazione
 *     esterna").
 *  2. LIVE (richiedono BASE_URL, un `next start` reale): /self-host bare
 *     risponde SEMPRE 200 diretto (nessun redirect, criterio letterale
 *     sulla stringa compilata nell'app), IT/EN sono 200 diretti, le altre
 *     13 locale collassano su EN in un solo hop, ogni superficie self-host
 *     e' noindex,follow, e nessuna compare in sitemap.xml.
 *
 * Addendum (chiusura criteri pre-merge PR#39, 2026-08-03): il criterio
 * originale era "200 su /self-host", non "redirect che poi funziona" — la
 * versione precedente di questo guardrail testava un 307 verso /it o /en e
 * lo considerava equivalente. Non lo e': vedi commit che introduce questo
 * blocco per la correzione completa (bare page indipendente, vedi
 * app/(frontend)/self-host/, + rimozione da sitemap perche' la feature non
 * e' disponibile al pubblico).
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
  "app/(frontend)/self-host/page.tsx",
  "app/(frontend)/self-host/layout.tsx",
  "components/SelfHostStatusView.tsx",
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

// self-host-copy.ts e le pagine self-host sono file NUOVI di questo sprint:
// il prezzo self-host non deve comparire nemmeno come URL/riferimento a listino.
const SELF_HOST_ONLY_FILES = new Set([
  "lib/content/self-host-copy.ts",
  "app/(frontend)/[locale]/(marketing)/self-host/page.tsx",
  "app/(frontend)/self-host/page.tsx",
  "app/(frontend)/self-host/layout.tsx",
  "components/SelfHostStatusView.tsx",
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

  // 3. Bare /self-host (nessun prefisso locale): SEMPRE 200 diretto, MAI un
  //    redirect — criterio letterale sulla stringa compilata nell'app
  //    (addendum pre-merge PR#39: un 307 "che poi funziona" non soddisfa il
  //    requisito). Indipendente da Accept-Language: la negoziazione lingua
  //    e' interna (toggle client-side), non un redirect di path.
  const bareCases: { headers: Record<string, string>; label: string }[] = [
    { headers: { "accept-language": "it-IT" }, label: "Accept-Language it-IT" },
    { headers: { "accept-language": "en-US" }, label: "Accept-Language en-US" },
    { headers: { "accept-language": "de-DE" }, label: "Accept-Language de-DE (lingua non supportata da self-host)" },
    { headers: {}, label: "nessun header" },
  ];
  for (const { headers, label } of bareCases) {
    const res = await fetchNoRedirect("/self-host", headers);
    if (res.status !== 200) {
      errors.push(`/self-host (${label}): status ${res.status} (atteso 200 diretto, zero redirect — criterio letterale sulla stringa app)`);
    }
  }
  // Stesso criterio anche via HEAD (l'app potrebbe fare solo un HEAD/GET, ma
  // il requisito e' "risponde 200", non "risponde 200 solo su GET").
  {
    const res = await fetch(`${BASE_URL}/self-host`, { method: "HEAD", redirect: "manual" });
    if (res.status !== 200) errors.push(`/self-host (HEAD): status ${res.status} (atteso 200)`);
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

  // 4b. noindex,follow su TUTTE le superfici self-host (bare + it + en) —
  // addendum pre-merge: la feature non e' disponibile al pubblico.
  for (const path of ["/self-host", "/it/self-host", "/en/self-host"]) {
    const res = await fetch(`${BASE_URL}${path}`);
    const html = await res.text();
    const robotsMeta = html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/i);
    const content = robotsMeta?.[1]?.toLowerCase() ?? "";
    if (!content.includes("noindex")) errors.push(`${path}: meta robots non contiene "noindex" (trovato: "${content || "assente"}")`);
    if (!content.includes("follow") || content.includes("nofollow")) errors.push(`${path}: meta robots non contiene "follow" o contiene "nofollow" (trovato: "${content || "assente"}")`);
  }

  // 5. sitemap.xml: NESSUNA URL self-host — la feature non e' disponibile al
  //    pubblico (addendum pre-merge). Prima di questo addendum il criterio
  //    era l'opposto (le 2 URL indicizzabili presenti); invertito qui.
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();
  const selfHostUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => new URL(u).pathname.endsWith("/self-host"));
  if (selfHostUrls.length > 0) {
    errors.push(`sitemap.xml: contiene ${selfHostUrls.length} URL /self-host (attese ZERO — la feature non e' disponibile al pubblico): ${selfHostUrls.join(", ")}`);
  }
}

async function main() {
  runStaticChecks();

  if (!BASE_URL) {
    if (errors.length > 0) {
      console.error(`❌ Self-host/privacy-truth guardrail (solo statico, BASE_URL non impostata): ${errors.length} problema/i`);
      for (const e of errors) console.error(`  - ${e}`);
      process.exit(1);
    }
    console.log(`✅ Self-host/privacy-truth guardrail: controlli statici OK (${STATIC_FILES.length} file). BASE_URL non impostata: controlli live (200 diretto/redirect/hreflang/noindex/sitemap) SALTATI, non dichiarati verdi.`);
    return;
  }

  await runLiveChecks();

  if (errors.length > 0) {
    console.error(`❌ Self-host/privacy-truth guardrail: ${errors.length} problema/i`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✅ Self-host/privacy-truth guardrail: statico (${STATIC_FILES.length} file) + live (bare /self-host SEMPRE 200 diretto GET+HEAD, IT/EN 200 diretti, 13 locale -> 307 EN, hreflang, noindex+follow su tutte le superfici, sitemap SENZA alcuna URL self-host) tutti verdi contro ${BASE_URL}.`);
}

main().catch((err) => {
  console.error("❌ Self-host/privacy-truth guardrail: errore inatteso", err);
  process.exit(1);
});
