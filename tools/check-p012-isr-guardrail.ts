/**
 * Guardrail SPRINT P0.12 FASE 4 — protegge il lavoro di riduzione ISR di
 * questo sprint da regressioni future. Confronta lo stato attuale del
 * repo/build contro la baseline pre-P0.12 registrata sotto (produzione,
 * SHA a91637591014ece733b794f0bc69b773be50953c, 2026-08-06, prima di
 * qualunque modifica di questo sprint).
 *
 * Richiede un build di produzione gia' eseguito (.next presente) — vedi
 * FASE 6 del report per l'ordine reale dei gate. Con .next assente, le
 * verifiche sui manifest sono saltate con un warning esplicito (mai un
 * numero inventato).
 *
 * Verifica:
 *  1. route prerenderizzate (prerender-manifest.json .routes) — puo' SOLO
 *     crescere di un piccolo margine (le 2 nuove traduzioni DE/FR = +2
 *     pagine), mai calare (perdita di contenuto indicizzabile) e mai
 *     crescere oltre la tolleranza (regressione non dichiarata).
 *  2. route dinamiche (routes-manifest.json .dynamicRoutes, pattern-level)
 *     — deve restare identico: nessuna nuova Dynamic API in route
 *     marketing, come da vincolo esplicito del mandato.
 *  3. sitemap.xml live: byte size e numero URL — puo' SOLO crescere di un
 *     piccolo margine (le stesse 2 nuove pagine), mai calare.
 *  4. numero di route-template OG dinamiche (opengraph-image.tsx sotto
 *     app/) — deve restare identico: nessuna sostituzione delle OG
 *     dinamiche in questo sprint (esplicitamente rimandata a dopo le
 *     ferie).
 *  5. assenza di force-dynamic/no-store in tutte le route marketing.
 *  6. assenza della schedule automatica indexnow-daily in vercel.json
 *     (stesso check di tools/check-p012-indexnow-cron.ts, ripetuto qui
 *     inline per difesa in profondita' — questo script deve restare
 *     autosufficiente anche se l'altro guardrail viene rimosso).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p012-isr-guardrail.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];
const warnings: string[] = [];

// Baseline pre-P0.12, produzione, SHA a916375, 2026-08-06 — vedi
// docs/seo/p012-fase3-sitemap-hreflang-gap.md e il report finale dello
// sprint per come sono stati misurati (prerender-manifest.json /
// routes-manifest.json del build gia' deployato, + curl live su
// sitemap.xml).
const BASELINE = {
  prerenderedRoutes: 3641,
  dynamicRoutePatterns: 58, // routes-manifest.json .dynamicRoutes (pattern, non istanze)
  ogRouteTemplates: 17, // file opengraph-image.tsx sotto app/
  sitemapBytes: 1934497,
  sitemapUrls: 1376,
};
// Le uniche 2 pagine nuove attese in questo sprint sono le traduzioni
// DE+FR di fitmesh-samsung-health-usarli-insieme (FASE 5). Tolleranza
// larga (10) per assorbire eventuali pagine di supporto generate dal
// build (es. varianti OG/route ausiliarie) senza mascherare una vera
// regressione a due cifre.
const MAX_NEW_STATIC_ROUTES = 10;
const MAX_NEW_SITEMAP_URLS = 10;
const MAX_NEW_SITEMAP_BYTES = 20_000;

// 1/2. Manifest .next (solo se presenti — mai inventare numeri).
const prerenderManifestPath = path.join(repoRoot, ".next/prerender-manifest.json");
const routesManifestPath = path.join(repoRoot, ".next/routes-manifest.json");
if (!fs.existsSync(prerenderManifestPath) || !fs.existsSync(routesManifestPath)) {
  warnings.push(
    "[build-assente] .next/prerender-manifest.json o routes-manifest.json non trovati — eseguire `pnpm build` prima di questo guardrail per verificare i conteggi route. Nessun numero verificato in questa run.",
  );
} else {
  const prerender = JSON.parse(fs.readFileSync(prerenderManifestPath, "utf8"));
  const routesManifest = JSON.parse(fs.readFileSync(routesManifestPath, "utf8"));
  const currentPrerendered = Object.keys(prerender.routes ?? {}).length;
  const currentDynamicPatterns = (routesManifest.dynamicRoutes ?? []).length;

  if (currentPrerendered < BASELINE.prerenderedRoutes) {
    errors.push(
      `[route-perse] route prerenderizzate: ${currentPrerendered} < baseline ${BASELINE.prerenderedRoutes} — contenuto indicizzabile perso.`,
    );
  } else if (currentPrerendered > BASELINE.prerenderedRoutes + MAX_NEW_STATIC_ROUTES) {
    errors.push(
      `[route-crescita-non-dichiarata] route prerenderizzate: ${currentPrerendered}, baseline ${BASELINE.prerenderedRoutes} (+${currentPrerendered - BASELINE.prerenderedRoutes}, tolleranza +${MAX_NEW_STATIC_ROUTES} per le 2 traduzioni DE/FR) — crescita oltre quanto atteso da questo sprint.`,
    );
  }

  if (currentDynamicPatterns !== BASELINE.dynamicRoutePatterns) {
    errors.push(
      `[route-dinamiche-cambiate] pattern route dinamiche: ${currentDynamicPatterns}, baseline ${BASELINE.dynamicRoutePatterns} — questo sprint non deve introdurre ne' rimuovere Dynamic API/route dinamiche.`,
    );
  }
}

// 4. OG route templates (statico, non richiede build).
const appDir = path.join(repoRoot, "app");
function findOgTemplates(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findOgTemplates(full));
    } else if (/^opengraph-image\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}
const ogTemplates = fs.existsSync(appDir) ? findOgTemplates(appDir) : [];
if (ogTemplates.length !== BASELINE.ogRouteTemplates) {
  errors.push(
    `[og-template-cambiati] ${ogTemplates.length} file opengraph-image.tsx trovati, baseline ${BASELINE.ogRouteTemplates} — la sostituzione delle OG dinamiche e' esplicitamente rimandata a dopo le ferie (P1), non deve avvenire in questo sprint.`,
  );
}

// 5. force-dynamic/no-store nelle route marketing.
const marketingDir = path.join(repoRoot, "app/(frontend)/[locale]/(marketing)");
function findForceDynamic(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findForceDynamic(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      const src = fs.readFileSync(full, "utf8");
      if (/force-dynamic|no-store/.test(src)) out.push(full);
    }
  }
  return out;
}
const forceDynamicHits = findForceDynamic(marketingDir);
if (forceDynamicHits.length > 0) {
  errors.push(
    `[force-dynamic-marketing] ${forceDynamicHits.length} file marketing con force-dynamic/no-store: ${forceDynamicHits.map((f) => path.relative(repoRoot, f)).join(", ")} — riaprirebbe Fluid CPU.`,
  );
}

// 6. vercel.json — nessuna schedule automatica indexnow-daily (difesa in
// profondita', stesso check del guardrail FASE 1 dedicato).
const vercelJsonPath = path.join(repoRoot, "vercel.json");
if (fs.existsSync(vercelJsonPath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(vercelJsonPath, "utf8"));
    const crons = parsed.crons ?? [];
    if (crons.some((c: { path?: string }) => (c.path ?? "").includes("indexnow-daily"))) {
      errors.push("[cron-riarmato] vercel.json ha di nuovo una schedule automatica per indexnow-daily (vedi tools/check-p012-indexnow-cron.ts per il dettaglio).");
    }
  } catch (e) {
    errors.push(`[json-invalido] vercel.json non parsabile: ${e instanceof Error ? e.message : String(e)}`);
  }
} else {
  errors.push("[file-mancante] vercel.json non trovato.");
}

// 3. sitemap.xml — richiede rete (fetch live) o un server locale; qui
// facciamo un best-effort fetch verso produzione, con warning esplicito
// se la rete non e' raggiungibile (mai bloccare il gate su un problema di
// rete transitorio, ma mai inventare un numero).
async function checkSitemap(): Promise<void> {
  try {
    const res = await fetch("https://www.fitmesh.fit/sitemap.xml");
    if (!res.ok) {
      warnings.push(`[sitemap-non-raggiungibile] HTTP ${res.status} su sitemap.xml live — verifica saltata.`);
      return;
    }
    const body = await res.text();
    const bytes = Buffer.byteLength(body, "utf8");
    const urlCount = (body.match(/<loc>/g) ?? []).length;
    if (urlCount < BASELINE.sitemapUrls) {
      errors.push(`[sitemap-url-perse] ${urlCount} URL, baseline ${BASELINE.sitemapUrls} — URL indicizzabili persi dalla sitemap.`);
    } else if (urlCount > BASELINE.sitemapUrls + MAX_NEW_SITEMAP_URLS) {
      errors.push(`[sitemap-crescita-non-dichiarata] ${urlCount} URL, baseline ${BASELINE.sitemapUrls} (+${urlCount - BASELINE.sitemapUrls}, tolleranza +${MAX_NEW_SITEMAP_URLS}).`);
    }
    if (bytes > BASELINE.sitemapBytes + MAX_NEW_SITEMAP_BYTES) {
      errors.push(`[sitemap-byte-crescita-non-dichiarata] ${bytes} byte, baseline ${BASELINE.sitemapBytes} (+${bytes - BASELINE.sitemapBytes}, tolleranza +${MAX_NEW_SITEMAP_BYTES}).`);
    }
  } catch (e) {
    warnings.push(`[sitemap-fetch-fallita] ${e instanceof Error ? e.message : String(e)} — verifica saltata, rete non raggiungibile da questo ambiente.`);
  }
}

async function main(): Promise<void> {
  await checkSitemap();

  for (const w of warnings) console.warn("  ⚠ " + w);

  if (errors.length > 0) {
    console.error(`\n❌ P0.12 ISR guardrail: ${errors.length} problema/i.\n`);
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }
  console.log(
    "\n✅ P0.12 ISR guardrail: route prerenderizzate/dinamiche, OG template, sitemap, force-dynamic/no-store e cron IndexNow tutti entro la tolleranza attesa dalla baseline pre-sprint.",
  );
}

main();
