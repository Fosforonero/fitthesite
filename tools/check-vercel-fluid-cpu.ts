/**
 * P0.9 — guardrail permanente anti-regressione Fluid CPU.
 *
 * Otto controlli espliciti, ciascuno per identita' (file/percorso/pattern
 * preciso), non per conteggio aggregato — un conteggio puo' restare
 * invariato mentre un problema vecchio sparisce e uno nuovo compare nello
 * stesso momento (stesso principio gia' applicato in
 * tools/check-bing-metadata-sitewide.ts per i duplicati).
 *
 * Alcuni controlli leggono solo il sorgente (statici, non richiedono
 * build/server); altri richiedono `.next/prerender-manifest.json` da un
 * `pnpm build` gia' eseguito (richiamare questo script DOPO il build in
 * CI/FASE 6, non prima).
 */
import fs from "node:fs";
import path from "node:path";
import { config as middlewareConfig } from "../middleware";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

/**
 * Rimuove commenti /* *\/ e // prima di ogni ricerca testuale sotto — senza
 * questo, i commenti che DOCUMENTANO una rimozione (es. "non chiama piu'
 * /api/v1/posts/stats") farebbero scattare falsi positivi identici al
 * problema che il controllo cerca di prevenire. Non un parser AST completo,
 * ma sufficiente per codice reale (non gestisce stringhe contenenti "//"
 * o "/*" letterali, assenti nei file controllati qui).
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function read(relPath: string): string | null {
  const p = path.join(repoRoot, relPath);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf-8");
}

function walk(dir: string, out: string[] = []): string[] {
  const abs = path.join(repoRoot, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

// ── 1. Root/marketing layout non deve importare headers/cookies/connection ──
// Lista di identita' esplicita (non "ogni layout.tsx nel repo"): sono
// esattamente le isole di root layout create/toccate dal P0.9 pattern
// "multiple root layouts". /[locale]/app|admin|auth NON sono in questa
// lista: possono legittimamente essere dinamiche.
const MARKETING_LAYOUT_FILES = [
  "app/(frontend)/[locale]/layout.tsx",
  "app/(frontend)/[locale]/(marketing)/layout.tsx",
  "app/(frontend)/delete-account/layout.tsx",
  "app/(frontend)/mockups/layout.tsx",
  "app/(frontend)/oauth/layout.tsx",
  "app/(frontend)/(root)/layout.tsx",
];
const DYNAMIC_API_IMPORT_RE = /import\s*\{[^}]*\b(headers|cookies|connection)\b[^}]*\}\s*from\s*["']next\/headers["']/;

for (const file of MARKETING_LAYOUT_FILES) {
  const src = read(file);
  if (src === null) {
    errors.push(`[layout-mancante] ${file} non esiste piu' — aggiorna MARKETING_LAYOUT_FILES in questo guardrail se il file e' stato spostato/rinominato di proposito`);
    continue;
  }
  const m = src.match(DYNAMIC_API_IMPORT_RE);
  if (m) {
    errors.push(`[dynamic-api-in-layout] ${file} importa '${m[1]}' da next/headers — questa e' la causa esatta del bug P0.9 (vedi docs/ops/vercel-fluid-cpu-audit-2026-07-24.md): rende dinamico l'intero albero sotto questo layout`);
  }
}

// ── 2. Nessun force-dynamic nell'albero marketing pubblico ──────────────────
const MARKETING_PUBLIC_DIRS = [
  "app/(frontend)/[locale]/(marketing)",
  "app/(frontend)/delete-account",
  "app/(frontend)/mockups",
  "app/(frontend)/(root)",
];
for (const dir of MARKETING_PUBLIC_DIRS) {
  for (const file of walk(dir)) {
    const src = read(file) ?? "";
    if (/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(src)) {
      errors.push(`[force-dynamic-in-marketing] ${file} dichiara force-dynamic in un percorso marketing pubblico — se davvero necessario, documentarlo esplicitamente e aggiornare questo guardrail con la ragione, non aggiungerlo silenziosamente`);
    }
  }
}

// ── 3. x-fitmesh-locale non deve ricomparire come USO FUNZIONALE ───────────
// Cerca solo `.set(`/`.get(` con questo esatto nome header — non un bare
// substring match, che darebbe falso positivo sui commenti che spiegano
// la rimozione (vedi questo stesso file, il file di RootHtmlShell, ecc).
const LOCALE_HEADER_USAGE_RE = /\.(?:set|get)\(\s*['"]x-fitmesh-locale['"]/;
const SEARCH_DIRS_FOR_LOCALE_HEADER = ["middleware.ts", "app", "components", "lib"];
for (const target of SEARCH_DIRS_FOR_LOCALE_HEADER) {
  const abs = path.join(repoRoot, target);
  if (!fs.existsSync(abs)) continue;
  const files = fs.statSync(abs).isDirectory() ? walk(target) : [target];
  for (const file of files) {
    const src = stripComments(read(file) ?? "");
    if (LOCALE_HEADER_USAGE_RE.test(src)) {
      errors.push(`[x-fitmesh-locale-reintrodotto] ${file} legge/scrive di nuovo l'header 'x-fitmesh-locale' — rimosso in P0.9 perche' richiedeva headers() nel root layout per essere letto`);
    }
  }
}

// ── 4. Middleware: le 15 locale reali non devono tornare a essere matchate
//      indiscriminatamente dal pattern "deep link senza locale" ───────────
// Import diretto di `config` da middleware.ts (stessa tecnica di
// middleware.matcher.test.ts) invece di re-implementare un parser regex
// fragile sul sorgente testuale — un secondo scraper del genere e' esso
// stesso una fonte di falsi positivi/negativi indipendente dal codice reale.
const LOCALES_FOR_CHECK = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"];
{
  const deepLinkPattern = middlewareConfig.matcher.find((m) => m.startsWith("/((?!"));
  if (!deepLinkPattern) {
    errors.push("[middleware-deep-link-pattern-non-trovato] nessun entry del matcher inizia con '/((?!' — struttura del matcher cambiata, aggiornare questo guardrail");
  } else {
    const re = new RegExp(`^${deepLinkPattern}$`);
    for (const locale of LOCALES_FOR_CHECK) {
      if (re.test(`/${locale}`) || re.test(`/${locale}/blog/qualche-post`)) {
        errors.push(`[middleware-copre-locale-${locale}] il pattern "deep link senza locale" del middleware matcha ancora /${locale} — le route marketing localizzate su www NON devono piu' attraversare il middleware`);
      }
    }
    // Deve pero' continuare a coprire i casi deterministici P0.8 (nb/nn).
    if (!re.test("/nb") || !re.test("/nn/blog/qualche-post")) {
      errors.push("[middleware-non-copre-piu-nb-nn] il pattern \"deep link senza locale\" non matcha piu' /nb o /nn — regressione sulla canonicalizzazione P0.8");
    }
  }
}

// ── 5. ArticleMeta non deve richiamare posts/stats ──────────────────────────
const articleMetaSrc = stripComments(read("components/blog/ArticleMeta.tsx") ?? "");
if (articleMetaSrc.includes("/api/v1/posts/stats")) {
  errors.push("[article-meta-chiama-posts-stats] components/blog/ArticleMeta.tsx contiene ancora una chiamata a /api/v1/posts/stats — rimossa in P0.9 (vedi FASE 3)");
}

// ── 6. posts/stats non deve tornare a importare Payload/Supabase/dati blog ──
// Limitato alle righe `import ...` (dopo strip commenti): il testo dei
// commenti PUO' legittimamente nominare "Supabase"/"Payload" per spiegare
// cosa e' stato rimosso, senza che questo sia un falso positivo.
const postsStatsImportLines = stripComments(read("app/api/v1/posts/stats/route.ts") ?? "")
  .split("\n")
  .filter((l) => /^\s*import\b/.test(l))
  .join("\n");
const FORBIDDEN_IMPORT_TOKENS = ["supabase", "payload", "BLOG_POSTS", "BLOG_SLUGS", "lib/blog"];
for (const token of FORBIDDEN_IMPORT_TOKENS) {
  if (postsStatsImportLines.toLowerCase().includes(token.toLowerCase())) {
    errors.push(`[posts-stats-import-pesante] app/api/v1/posts/stats/route.ts contiene di nuovo il riferimento "${token}" — deve restare un tombstone deterministico senza import Payload/Supabase/dati blog`);
  }
}

// ── 7 e 8: richiedono .next/prerender-manifest.json (dopo build) ───────────
const PRERENDER_MANIFEST_PATH = path.join(repoRoot, ".next/prerender-manifest.json");
if (!fs.existsSync(PRERENDER_MANIFEST_PATH)) {
  errors.push("[prerender-manifest-assente] .next/prerender-manifest.json non esiste — esegui 'pnpm build' prima di questo guardrail (i controlli 7 e 8 richiedono l'artefatto di build reale, non deducibile dal solo sorgente)");
} else {
  const manifest = JSON.parse(fs.readFileSync(PRERENDER_MANIFEST_PATH, "utf-8")) as {
    routes: Record<string, unknown>;
    dynamicRoutes?: Record<string, unknown>;
  };
  const staticRoutes = new Set(Object.keys(manifest.routes));

  // 7. Campione di pagine pubbliche che DEVONO essere prerenderizzate.
  const REQUIRED_PRERENDERED_SAMPLE = [
    "/it",
    "/en",
    "/it/blog/fitbit-data-not-syncing-android",
    "/en/blog/health-connect-vs-samsung-health",
    "/it/labs",
    "/en/labs",
    "/it/labs/calcolatore-hrv-rmssd",
    "/it/labs/calcolatore-efficienza-sonno",
    "/it/about",
    "/it/integrations",
    "/it/sync/galaxy-watch",
  ];
  for (const p of REQUIRED_PRERENDERED_SAMPLE) {
    if (!staticRoutes.has(p)) {
      errors.push(`[pagina-pubblica-non-prerenderizzata] ${p} manca da .next/prerender-manifest.json 'routes' dopo il build — dovrebbe essere contenuto statico/CDN`);
    }
  }

  // 8. Nessuna route privata deve comparire come prerenderizzata/cacheable.
  const PRIVATE_PREFIXES_RE = new RegExp(`^/(?:${LOCALES_FOR_CHECK.join("|")})/(?:app|admin)(?:/|$)`);
  const staticallyLeakedPrivateRoutes = [...staticRoutes].filter((r) => PRIVATE_PREFIXES_RE.test(r));
  if (staticallyLeakedPrivateRoutes.length > 0) {
    errors.push(`[route-privata-diventata-statica] le seguenti route /[locale]/app|admin risultano prerenderizzate/cacheable, il che esporrebbe dati per-utente a tutti i visitatori: ${staticallyLeakedPrivateRoutes.join(", ")}`);
  }
}

// ── Esito ────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`❌ Vercel Fluid CPU guardrail: ${errors.length} problema/i`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  "✅ Vercel Fluid CPU guardrail: nessun root/marketing layout usa Dynamic API, nessun force-dynamic marketing, x-fitmesh-locale assente, middleware non copre le 15 locale, ArticleMeta non chiama posts/stats, posts/stats resta un tombstone leggero, campione pagine pubbliche prerenderizzato, nessuna route privata diventata statica.",
);
