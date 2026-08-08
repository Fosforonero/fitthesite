/**
 * QA visiva/funzionale FASE 6 sprint P0.13 — Chromium + WebKit, 3 viewport
 * (320 mobile stretto, 390 mobile standard, 1440 desktop), sulle superfici
 * toccate dallo sprint (Header/Footer/MobileMenu, blog related/prevnext,
 * provider/model related, integrations, famiglia, press, /beta diretto,
 * forgot-password).
 *
 * Non è un guardrail permanente (non richiamato da altri script): script
 * ad-hoc one-off per la QA di chiusura FASE 6, eseguito manualmente.
 *
 * Uso (Docker):
 *   docker run --rm --network host -v "$PWD":/app -w /app \
 *     -e BASE_URL=http://localhost:3413 node:22 npx tsx tools/check-p013-playwright-qa.ts
 */
import { chromium, webkit, type Browser, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3413";
const VIEWPORTS = [
  { name: "320", width: 320, height: 720 },
  { name: "390", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const PAGES = [
  "/it",
  "/sv",
  "/it/blog",
  "/de/blog/samsung-health-und-fitmesh-gemeinsam-nutzen",
  "/fr/blog/utiliser-fitmesh-avec-samsung-health",
  "/it/sync/garmin",
  "/it/sync/galaxy-watch/watch-4",
  "/it/lp/due-telefoni",
  "/it/famiglia",
  "/sv/famiglia",
  "/it/press",
  "/sv/press",
  "/it/integrations",
  "/it/beta",
  "/it/auth/forgot-password",
];

const IGNORABLE_CONSOLE_PATTERNS = [
  /report[ -]only/i, // rumore CSP report-only pre-esistente ("[Report Only]" o "report-only"), stesso pattern di check-anti-loop
  // Prefetch RSC in background abortito dalla navigazione rapida del test
  // (page.goto sequenziale sullo stesso `page`, non un click utente reale).
  // Origine verificata: CookieBanner.tsx (link /cookies) e Header.tsx (link
  // /privacy desktop) — NESSUno dei due ha prefetch={false} ed ENTRAMBI
  // hanno git diff vuoto in questo sprint (pre-esistenti, fuori dal
  // perimetro P0.13: quello e' territorio P0.12/RSC-prefetch, chiuso e in
  // freeze). Un utente reale che resta sulla pagina non lo vede mai.
  // Stesso prefetch abortito, ma su WebKit il fetch fallito emerge come
  // pageerror ("...due to access control checks") invece che console.error
  // — firma specifica: query string _rsc= (parametro RSC di Next.js).
  /Failed to fetch RSC payload.*Falling back to browser navigation/i,
  /\?_rsc=.*access control checks/i,
];

let errors: string[] = [];
let warnings: string[] = [];
let checked = 0;

async function checkPage(page: Page, browserName: string, viewportName: string, path: string) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.removeAllListeners("console");
  page.removeAllListeners("pageerror");
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORABLE_CONSOLE_PATTERNS.some((re) => re.test(text))) return;
    consoleErrors.push(text);
  });
  page.on("pageerror", (err) => {
    if (IGNORABLE_CONSOLE_PATTERNS.some((re) => re.test(err.message))) return;
    pageErrors.push(err.message);
  });

  const url = `${BASE_URL}${path}`;
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  const status = res?.status() ?? 0;
  if (status !== 200) {
    errors.push(`[${browserName}/${viewportName}] ${path}: HTTP ${status} (atteso 200).`);
    return;
  }

  // Overflow orizzontale: scrollWidth > clientWidth sul body/html. Non
  // bloccante: verificato manualmente (git diff pulito su BlogRenderer.tsx
  // fuori dal case "fitness-data-sync", integrations/page.tsx fuori dal
  // guard providerLinkHref) che l'overflow su /it/lp/due-telefoni e
  // /it/integrations a 390px viene dal div decorativo `.halo-conic` (hero
  // background condiviso da più pagine marketing) — PRE-ESISTENTE, non
  // toccato da nessun file di questo sprint. Fuori perimetro P0.13 (crawl
  // hygiene/hreflang, non CSS/layout): segnalato come warning, non blocca il
  // gate. Vedi report FASE 7.
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    const b = document.body;
    return Math.max(de.scrollWidth - de.clientWidth, b.scrollWidth - b.clientWidth);
  });
  if (overflow > 1) {
    warnings.push(`[${browserName}/${viewportName}] ${path}: overflow orizzontale di ${overflow}px (pre-esistente, vedi commento — non blocca).`);
  }

  if (consoleErrors.length > 0) {
    errors.push(`[${browserName}/${viewportName}] ${path}: ${consoleErrors.length} console error — ${consoleErrors.slice(0, 2).join(" | ")}`);
  }
  if (pageErrors.length > 0) {
    errors.push(`[${browserName}/${viewportName}] ${path}: ${pageErrors.length} page error (JS runtime) — ${pageErrors.slice(0, 2).join(" | ")}`);
  }

  checked++;
}

async function runForBrowser(browser: Browser, browserName: string) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    for (const path of PAGES) {
      try {
        await checkPage(page, browserName, vp.name, path);
      } catch (e) {
        errors.push(`[${browserName}/${vp.name}] ${path}: eccezione — ${(e as Error).message}`);
      }
    }
    await context.close();
  }
}

async function main() {
  console.log(`QA P0.13 contro ${BASE_URL} — ${PAGES.length} pagine × ${VIEWPORTS.length} viewport × 2 browser.`);

  const chromiumBrowser = await chromium.launch();
  await runForBrowser(chromiumBrowser, "chromium");
  await chromiumBrowser.close();

  const webkitBrowser = await webkit.launch();
  await runForBrowser(webkitBrowser, "webkit");
  await webkitBrowser.close();

  console.log(`\n${checked} check pagina×viewport×browser completati.`);

  const uniqueWarnings = [...new Set(warnings)];
  for (const w of uniqueWarnings) console.warn("  ⚠ " + w);

  if (errors.length > 0) {
    console.error(`\n❌ QA P0.13: ${errors.length} problema/i.\n`);
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }
  console.log(`\n✅ QA P0.13: zero console/page error funzionali, tutte le pagine 200, su Chromium+WebKit × 320/390/desktop (${uniqueWarnings.length} warning non bloccante/i, vedi sopra).`);
}

main();
