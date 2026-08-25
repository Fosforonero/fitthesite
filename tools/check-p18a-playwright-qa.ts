/**
 * QA visiva/funzionale one-off — Sprint P1.8A (2026-08-25), FASE 7.
 * Chromium + WebKit, 3 viewport (320/390/1440), sulle pagine toccate da
 * questo sprint: le 4 URL target CTR (EN/DE × health-connect-not-syncing /
 * garmin-samsung-health-sync-guide) + le varianti PL/TR/KO dell'articolo
 * Garmin (appena tradotte/QA-ate in questo sprint, indicizzabili).
 *
 * Non e' un guardrail permanente. Script ad-hoc, eseguito manualmente.
 *
 * Uso (Docker):
 *   docker run --rm --network container:p18a-server -v "$PWD":/app -w /app \
 *     -e BASE_URL=http://localhost:3000 node:22 npx tsx tools/check-p18a-playwright-qa.ts
 */
import { chromium, webkit, type Browser, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const VIEWPORTS = [
  { name: "320", width: 320, height: 720 },
  { name: "390", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const PAGES = [
  "/en/blog/health-connect-not-syncing",
  "/de/blog/health-connect-synchronisiert-nicht",
  "/en/blog/sync-garmin-samsung-health-guide",
  "/de/blog/garmin-samsung-health-synchronisieren-anleitung",
  "/pl/blog/synchronizacja-garmin-samsung-health-poradnik",
  "/tr/blog/garmin-samsung-health-senkronizasyon-rehberi",
  "/ko/blog/garmin-samsung-health-dongkihwa-gaidu",
];

const IGNORABLE_CONSOLE_PATTERNS = [
  /report[ -]only/i,
  /Failed to fetch RSC payload.*Falling back to browser navigation/i,
  /\?_rsc=.*access control checks/i,
];

let errors: string[] = [];
let checked = 0;

async function checkPage(browser: Browser, browserName: string, path: string, viewport: (typeof VIEWPORTS)[number]) {
  const page: Page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!IGNORABLE_CONSOLE_PATTERNS.some((re) => re.test(text))) consoleErrors.push(text);
    }
  });
  page.on("pageerror", (err) => {
    const text = String(err);
    if (!IGNORABLE_CONSOLE_PATTERNS.some((re) => re.test(text))) consoleErrors.push(`[pageerror] ${text}`);
  });

  const url = `${BASE_URL}${path}`;
  let httpStatus = 0;
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    httpStatus = resp?.status() ?? 0;
  } catch (e) {
    errors.push(`[${browserName}/${viewport.name}] ${path}: navigazione fallita — ${e}`);
    await page.close();
    return;
  }
  checked++;

  if (httpStatus !== 200) {
    errors.push(`[${browserName}/${viewport.name}] ${path}: HTTP ${httpStatus} (atteso 200)`);
  }

  // Overflow orizzontale di pagina: scrollWidth del documento non deve
  // superare la larghezza del viewport (tolleranza 1px per arrotondamenti).
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    errors.push(
      `[${browserName}/${viewport.name}] ${path}: overflow orizzontale — scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`,
    );
  }

  if (consoleErrors.length > 0) {
    for (const e of consoleErrors) {
      errors.push(`[${browserName}/${viewport.name}] ${path}: console error — ${e.slice(0, 200)}`);
    }
  }

  await page.close();
}

async function main() {
  const browsers: Array<{ name: string; instance: Browser }> = [];
  browsers.push({ name: "chromium", instance: await chromium.launch() });
  browsers.push({ name: "webkit", instance: await webkit.launch() });

  for (const { name, instance } of browsers) {
    for (const path of PAGES) {
      for (const viewport of VIEWPORTS) {
        await checkPage(instance, name, path, viewport);
      }
    }
    await instance.close();
  }

  console.log(`\nControlli eseguiti: ${checked} (${PAGES.length} pagine × ${VIEWPORTS.length} viewport × 2 browser attesi = ${PAGES.length * VIEWPORTS.length * 2})`);
  if (errors.length > 0) {
    console.error(`❌ P1.8A Playwright QA: ${errors.length} problema/i.\n`);
    for (const e of errors) console.error("  " + e);
    process.exit(1);
  }
  console.log("✅ P1.8A Playwright QA: nessun errore console, nessun overflow orizzontale, tutte le pagine HTTP 200, Chromium + WebKit, 3 viewport.");
}

main();
