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
 *
 * Addendum P0.11-C (2026-08-04, correzioni pre-merge PR#39):
 *  - Fase 2: freschezza date legali Privacy/Termini (vedi
 *    runLegalDateFreshnessChecks piu' sotto — data visibile e dateModified
 *    devono coincidere, e un contenuto cambiato senza bump data fallisce).
 *  - Fase 3: rimossa la falsa promessa che export/cancellazione funzionino
 *    "indipendentemente da dove e' configurato il backend" — vero solo sul
 *    backend gestito FitMesh, non su un backend Supabase alternativo.
 *  - Fase 4: sweep sitewide di claim assoluti "no trackers"/"no opaque
 *    clouds" (root/marketing metadata, homepage/about, press kit, llms.txt,
 *    product-facts, provider copy, blog), sostituiti con formulazioni
 *    precise (SDK pubblicitario/di profilazione, vendita dati, Crashlytics
 *    per diagnostica crash, FCM per notifiche push, backend cloud FitMesh
 *    di default). STATIC_FILES e ABSOLUTE_CLAIM_PATTERNS estesi di
 *    conseguenza per impedire la reintroduzione silenziosa.
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
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
  // Addendum P0.11-C (Fase 4): "tagline" aveva "no opaque clouds" in tutte
  // e 15 le lingue (trovato dal guardrail stesso — vedi report), non solo
  // it/en. Le altre 13 mancavano dalla lista originale P0.11-A.
  "lib/dictionaries/es.json",
  "lib/dictionaries/de.json",
  "lib/dictionaries/pt.json",
  "lib/dictionaries/fr.json",
  "lib/dictionaries/pl.json",
  "lib/dictionaries/tr.json",
  "lib/dictionaries/nl.json",
  "lib/dictionaries/ja.json",
  "lib/dictionaries/ko.json",
  "lib/dictionaries/sv.json",
  "lib/dictionaries/da.json",
  "lib/dictionaries/no.json",
  "lib/dictionaries/fi.json",
  // Addendum P0.11-C (Fase 4) — sweep "no trackers"/"no opaque clouds"
  // assoluti sitewide, sostituiti con formulazioni precise (nessun SDK
  // pubblicitario/di profilazione, nessuna vendita dati, Crashlytics/FCM
  // dichiarati). File toccati da quel sweep, monitorati contro regressione.
  "app/(frontend)/[locale]/layout.tsx",
  "app/(frontend)/[locale]/(marketing)/layout.tsx",
  "app/(frontend)/[locale]/(marketing)/press/page.tsx",
  "lib/llms-txt.ts",
  "lib/product-facts.ts",
  "lib/blog/posts/gdpr-dati-fitness-smartwatch.ts",
  "lib/blog/posts/scegliere-smartwatch-dati-2026.ts",
  "lib/blog/posts/health-connect-vs-samsung-health.ts",
  "lib/blog/posts/vedere-dati-wearable-browser-pc.ts",
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
  // Addendum P0.11-C (Fase 4): promessa falsa di cancellazione self-host
  // universale (corretta in lib/content/self-host-copy.ts — vedi dataParagraph).
  { re: /funziona indipendentemente da dove è configurato il backend/i, label: '"funziona indipendentemente da dove è configurato il backend" (falso: export/cancellazione presuppongono lo schema del backend gestito FitMesh)' },
  { re: /works regardless of where the backend is configured/i, label: '"works regardless of where the backend is configured" (stesso motivo)' },
  // Addendum P0.11-C (Fase 4): sweep "no trackers"/"no opaque clouds" —
  // claim assoluto, contraddetto da Firebase Crashlytics/FCM bundle e dal
  // backend cloud FitMesh di default. La versione corretta e' SEMPRE scoped
  // ("no AD trackers" / "no data SALE") — se questi pattern matchano di
  // nuovo un testo senza quel qualificatore, e' una regressione.
  { re: /\bno opaque clouds?\b/i, label: '"no opaque cloud(s)" (assoluto, contraddice il backend gestito FitMesh — vedi sweep Fase 4)' },
  { re: /\bcloud opac[hoi]\b/i, label: '"cloud opaco/opachi" (assoluto italiano, stesso motivo)' },
  // NB: usa un lookahead esplicito su spazio/punteggiatura/fine-stringa
  // invece di \b finale — \b in JS e' ASCII-only e tratta "ó"/"ę"/ecc. come
  // non-word, quindi "trackerów" (polacco) matcherebbe falsamente "tracker"
  // come parola completa con un semplice \b.
  { re: /\b(no|niente|zero)\s+trackers?(?=[\s,.!?;:)"'\]]|$)(?!\s*(pubblicitari|advertising|ads?\b))/i, label: '"no/niente/zero tracker(s)" senza qualificatore pubblicitario (assoluto — Crashlytics+FCM sono bundle nell\'app)' },
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

// ── FASE statica — freschezza date legali (P0.11-C, Fase 2) ─────────────
// Privacy e Termini mostrano una data visibile (LAST_UPDATED_*) e un
// dateModified nel WebPage JSON-LD (LegalJsonLd): devono coincidere
// semanticamente, e una revisione sostanziale del contenuto senza bump
// della data deve far fallire il gate — e' successo una volta (16/22
// giugno rimasti fermi mentre l'audit privacy FASE 3 cambiava il testo
// sotto), non deve poter succedere di nuovo silenziosamente.
const LEGAL_DATE_FILES = [
  { path: "app/(frontend)/[locale]/(marketing)/privacy/page.tsx", label: "Privacy Policy" },
  { path: "app/(frontend)/[locale]/(marketing)/terms/page.tsx", label: "Termini di Servizio" },
];

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parseEnglishDate(text: string): string | null {
  const m = text.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!m) return null;
  const mi = MONTHS_EN.findIndex((mo) => mo.toLowerCase() === m[1].toLowerCase());
  if (mi === -1) return null;
  return `${m[3]}-${String(mi + 1).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`;
}

function stripDateDeclarations(content: string): string {
  return content
    .replace(/const LAST_UPDATED_\w+ = "[^"]*";/g, "")
    .replace(/dateModified="[^"]*"/g, 'dateModified=""');
}

function runLegalDateFreshnessChecks() {
  for (const { path, label } of LEGAL_DATE_FILES) {
    let content: string;
    try {
      content = readFileSync(path, "utf-8");
    } catch {
      errors.push(`${path}: file non trovato (freschezza date legali)`);
      continue;
    }

    const enMatch = content.match(/LAST_UPDATED_EN = "([^"]*)";/);
    const dateModifiedMatch = content.match(/dateModified="(\d{4}-\d{2}-\d{2})"/);
    if (!enMatch || !dateModifiedMatch) {
      errors.push(`${path}: impossibile leggere LAST_UPDATED_EN o dateModified (formato inatteso — questo controllo va aggiornato insieme al file)`);
      continue;
    }
    const visibleIso = parseEnglishDate(enMatch[1]);
    if (!visibleIso) {
      errors.push(`${path}: LAST_UPDATED_EN "${enMatch[1]}" non parsabile come data`);
      continue;
    }
    if (visibleIso !== dateModifiedMatch[1]) {
      errors.push(`${label} (${path}): data visibile (${visibleIso}, da "${enMatch[1]}") e dateModified (${dateModifiedMatch[1]}) non coincidono`);
    }

    // Staleness reale: contenuto cambiato rispetto a origin/main senza bump data.
    let baseContent: string;
    try {
      baseContent = execSync(`git show origin/main:"${path}"`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    } catch {
      console.log(`   (nota: controllo staleness-vs-origin/main SALTATO per ${path} — origin/main non raggiungibile in questo ambiente, non dichiarato verde)`);
      continue;
    }
    const strippedCurrent = stripDateDeclarations(content);
    const strippedBase = stripDateDeclarations(baseContent);
    if (strippedCurrent !== strippedBase) {
      const baseDateModified = baseContent.match(/dateModified="(\d{4}-\d{2}-\d{2})"/)?.[1];
      if (baseDateModified === dateModifiedMatch[1]) {
        errors.push(`${label} (${path}): contenuto legale modificato rispetto a origin/main ma dateModified invariato (${dateModifiedMatch[1]}) — bump la data visibile e il dateModified`);
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
  runLegalDateFreshnessChecks();

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
