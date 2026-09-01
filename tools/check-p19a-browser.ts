/**
 * Verifica browser reale SPRINT P1.9 PR A — modulo editoriale FitMesh +
 * icona Reddit. Chromium+WebKit, 320/390/desktop.
 *
 * Uso: BASE_URL=http://localhost:3919 npx tsx tools/check-p19a-browser.ts
 */
import { chromium, webkit, type Browser } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3919";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "390px", width: 390, height: 844 },
  { name: "320px", width: 320, height: 700 },
];
const ARTICLE_PATHS = [
  "/en/blog/health-connect-not-syncing",
  "/en/blog/sync-garmin-samsung-health-guide",
  "/en/blog/google-health-replaces-google-fit",
  "/en/blog/fitmesh-sync-vs-alternatives",
  "/en/blog/multiple-smartwatches-duplicate-data",
];

let errors: string[] = [];
let checks = 0;

const knownNoise = /Failed to fetch RSC payload|Fetch API cannot load.*_rsc=|access control checks|Content Security Policy|report-only|googletagmanager\.com\/gtag/i;

async function checkModuleRendering(browserName: string, browser: Browser) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error" && !knownNoise.test(m.text())) consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => { if (!knownNoise.test(String(e))) consoleErrors.push(String(e)); });

    for (const articlePath of ARTICLE_PATHS) {
      const label = `[${browserName}/${vp.name}${articlePath}]`;
      await page.goto(`${BASE_URL}${articlePath}`, { waitUntil: "networkidle" });
      checks++;

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (overflow) errors.push(`${label} overflow orizzontale`);

      const module = page.locator('aside[data-cta-content-cluster]').first();
      if ((await module.count()) === 0) {
        errors.push(`${label} nessun modulo fitmesh-editorial-cta trovato`);
        continue;
      }
      const hasStoreButtons = await module.locator('[data-cta-target-type="store"]').count();
      if (hasStoreButtons === 0) errors.push(`${label} modulo senza StoreButtonsRow (target_type=store)`);

      const benefitItems = await module.locator("ul li").count();
      if (benefitItems > 3) errors.push(`${label} ${benefitItems} benefici visibili, massimo 3 attesi`);
    }
    if (consoleErrors.length > 0) errors.push(`[${browserName}/${vp.name}] ${consoleErrors.length} errori console: ${consoleErrors.slice(0, 3).join(" | ")}`);
    await context.close();
  }
}

async function checkRedditIcon(browserName: string, browser: Browser) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    for (const p of ["/en", "/en/support"]) {
      const label = `[${browserName}/${vp.name}${p}]`;
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "networkidle" });
      checks++;

      const links = page.locator('a[href="https://www.reddit.com/r/FitMesh/"]');
      const count = await links.count();
      if (count === 0) {
        errors.push(`${label} nessun link Reddit trovato`);
        continue;
      }
      const link = links.first();
      const svg = link.locator("svg");
      if ((await svg.count()) === 0) {
        errors.push(`${label} link Reddit senza icona SVG`);
      } else {
        const ariaHidden = await svg.first().getAttribute("aria-hidden");
        if (ariaHidden !== "true") errors.push(`${label} icona Reddit non aria-hidden`);
      }
      const text = (await link.first().textContent())?.trim() ?? "";
      if (text.length === 0) errors.push(`${label} link Reddit senza testo visibile (icon-only)`);
      const accessibleName = await link.first().evaluate((el) => el.getAttribute("aria-label") ?? el.textContent?.trim());
      if (!accessibleName) errors.push(`${label} link Reddit senza nome accessibile`);

      // Touch target: l'area cliccabile combinata (icona+testo+padding) deve
      // avere un'altezza ragionevole per il tocco (>=24px, WCAG 2.5.8 AA soglia minima).
      const box = await link.first().boundingBox();
      if (!box || box.height < 24) {
        errors.push(`${label} touch target link Reddit troppo piccolo: ${box?.height ?? "n/a"}px (minimo 24px)`);
      }

      // Focus visibile da tastiera.
      await link.first().focus();
      const outlineVisible = await link.first().evaluate((el) => {
        const cs = getComputedStyle(el);
        return cs.outlineStyle !== "none" && cs.outlineWidth !== "0px";
      });
      if (!outlineVisible) errors.push(`${label} nessun outline di focus visibile sul link Reddit`);
    }
    await context.close();
  }
}

/**
 * Legge il vero `window.dataLayer` (l'array su cui il gtag reale del sito
 * fa push, definito dallo Script beforeInteractive di RootHtmlShell) invece
 * di sovrascrivere `window.gtag` — un override in addInitScript verrebbe
 * comunque rimpiazzato dallo Script beforeInteractive della pagina, che
 * gira dopo e ridefinisce `window.gtag` da zero (bug del test, non del
 * prodotto: prima versione di questo script falliva sempre per questo).
 */
async function readDataLayer(page: import("playwright").Page): Promise<unknown[][]> {
  return page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []));
}

async function checkConsentAndDedup(browser: Browser) {
  checks++;
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/en/blog/health-connect-not-syncing`, { waitUntil: "networkidle" });

  // Consenso negato di default: nessuna entry "consent update" con analytics_storage granted.
  const dataLayerDefault = await readDataLayer(page);
  const consentGrantedCalls = dataLayerDefault.filter(
    (c) => c[0] === "consent" && c[1] === "update" && (c[2] as Record<string, unknown> | undefined)?.analytics_storage === "granted",
  );
  if (consentGrantedCalls.length > 0) {
    errors.push(`[consent-default] consent granted presente in dataLayer senza interazione utente (localStorage vuoto)`);
  }
  const consentDefaultCalls = dataLayerDefault.filter((c) => c[0] === "consent" && c[1] === "default");
  if (consentDefaultCalls.length === 0) {
    errors.push(`[consent-default-missing] nessuna entry "consent default" trovata in dataLayer`);
  }

  // Scroll per far entrare la CTA nel viewport, poi verifica zero doppio cta_view
  // sullo stesso cta_id anche dopo un secondo scroll/re-intersect.
  await page.locator('[data-cta-id]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(200);
  await page.locator('[data-cta-id]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const dataLayerAfterScroll = await readDataLayer(page);
  const ctaViewCalls = dataLayerAfterScroll.filter((c) => c[1] === "cta_view");
  const seenIds = new Set<string>();
  let duplicated = false;
  for (const call of ctaViewCalls) {
    const id = (call[2] as Record<string, unknown> | undefined)?.cta_id as string;
    if (seenIds.has(id)) duplicated = true;
    seenIds.add(id);
  }
  if (ctaViewCalls.length === 0) errors.push(`[no-cta-view] nessun evento cta_view rilevato dopo lo scroll nel viewport`);
  if (duplicated) errors.push(`[double-cta-view] cta_view duplicato per lo stesso cta_id dopo mount/scroll ripetuto`);
  await context.close();

  // Consenso CONCESSO: localStorage pre-popolato come farebbe CookieBanner
  // dopo un click "Accetta" — lo Script beforeInteractive deve leggerlo e
  // chiamare consent update "granted" già al primo caricamento.
  checks++;
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.addInitScript(() => {
    localStorage.setItem("fitmesh_cookie_consent", JSON.stringify({ analytics: true, ts: Date.now() }));
  });
  await page2.goto(`${BASE_URL}/en/blog/health-connect-not-syncing`, { waitUntil: "networkidle" });
  const dataLayerGranted = await readDataLayer(page2);
  const grantedCalls = dataLayerGranted.filter(
    (c) => c[0] === "consent" && c[1] === "update" && (c[2] as Record<string, unknown> | undefined)?.analytics_storage === "granted",
  );
  if (grantedCalls.length === 0) {
    errors.push(`[consent-granted] con localStorage["fitmesh_cookie_consent"]={analytics:true} nessuna entry consent update granted trovata in dataLayer all'avvio`);
  }
  await context2.close();
}

(async () => {
  const cr = await chromium.launch();
  const wk = await webkit.launch();
  try {
    await checkModuleRendering("chromium", cr);
    await checkModuleRendering("webkit", wk);
    await checkRedditIcon("chromium", cr);
    await checkRedditIcon("webkit", wk);
    await checkConsentAndDedup(cr);
  } finally {
    await cr.close();
    await wk.close();
  }

  if (errors.length > 0) {
    console.error(`❌ P1.9 PR A browser check: ${errors.length} problema/i su ${checks} combinazioni\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✅ P1.9 PR A browser check OK: ${checks} combinazioni — modulo editoriale (store-aware, ≤3 benefici, zero overflow), icona Reddit (testo visibile, aria-hidden, touch target, focus), consenso default negato, zero doppio cta_view.`);
})();
