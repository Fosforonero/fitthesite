/**
 * Verifica browser reale SPRINT P1.9 PR B — refresh Galaxy Ring/Oura Ring +
 * sblocco JA/PL su health-connect-not-syncing. Chromium+WebKit, 320/390/desktop.
 *
 * Uso: BASE_URL=http://localhost:3925 npx tsx tools/check-p19b-browser.ts
 */
import { chromium, webkit, type Browser } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3925";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "390px", width: 390, height: 844 },
  { name: "320px", width: 320, height: 700 },
];
const RING_PATHS = [
  "/en/blog/galaxy-ring-android-health-connect",
  "/en/blog/oura-ring-health-connect-android",
];

const knownNoise = /Failed to fetch RSC payload|Fetch API cannot load.*_rsc=|access control checks|Content Security Policy|report-only|googletagmanager\.com\/gtag/i;
let errors: string[] = [];
let checks = 0;

async function checkRingPages(browserName: string, browser: Browser) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error" && !knownNoise.test(m.text())) consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => { if (!knownNoise.test(String(e))) consoleErrors.push(String(e)); });

    for (const p of RING_PATHS) {
      const label = `[${browserName}/${vp.name}${p}]`;
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "networkidle" });
      checks++;

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (overflow) errors.push(`${label} overflow orizzontale`);

      const module = page.locator('aside[data-cta-content-cluster="smart_ring_health_connect"]');
      if ((await module.count()) === 0) errors.push(`${label} nessun modulo fitmesh-editorial-cta trovato`);
      else if ((await module.locator('[data-cta-target-type="store"]').count()) === 0) {
        errors.push(`${label} modulo senza StoreButtonsRow`);
      }

      // FAQ visibile === FAQPage JSON-LD
      const faqCheck = await page.evaluate(() => {
        const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .map((s) => { try { return JSON.parse(s.textContent || "{}"); } catch { return null; } })
          .find((j) => j && j["@type"] === "FAQPage");
        if (!ld) return { ok: false, reason: "FAQPage JSON-LD assente" };
        const visibleTexts = [...document.querySelectorAll("details")].map((d) => d.textContent?.replace(/\s+/g, " ").trim() ?? "");
        for (const entity of ld.mainEntity ?? []) {
          const q = entity.name as string;
          const a = entity.acceptedAnswer?.text as string;
          if (!visibleTexts.some((t) => t.includes(q) && t.includes(a.slice(0, 40)))) {
            return { ok: false, reason: `FAQ "${q.slice(0, 40)}" non trovata visibile con lo stesso testo` };
          }
        }
        return { ok: true };
      });
      if (!faqCheck.ok) errors.push(`${label} ${faqCheck.reason}`);

      // Fonti inline visibili (sezione condivisa BlogSources.tsx, heading
      // "Sources"/"Fonti"/...) + JSON-LD ImageObject sulla cover (spesso
      // annidato dentro BlogPosting.image, non un top-level @type separato
      // — cercato come substring nel testo grezzo di tutti gli script
      // ld+json, non solo sulle radici).
      const sourcesAndImage = await page.evaluate(() => {
        const text = document.body.textContent ?? "";
        const hasSourcesHeading = /\bSources\b|\bFonti\b|\bFuentes\b|\bQuellen\b|\bBronnen\b/.test(text);
        const ldTexts = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent ?? "");
        const hasImageLd = ldTexts.some((t) => t.includes('"ImageObject"'));
        return { hasSourcesHeading, hasImageLd };
      });
      if (!sourcesAndImage.hasSourcesHeading) errors.push(`${label} heading "Sources"/"Fonti" assente`);
      if (!sourcesAndImage.hasImageLd) errors.push(`${label} nessun JSON-LD ImageObject trovato (nemmeno annidato)`);
    }
    if (consoleErrors.length > 0) errors.push(`[${browserName}/${vp.name}] ${consoleErrors.length} errori console: ${consoleErrors.slice(0, 3).join(" | ")}`);
    await context.close();
  }
}

// health-connect-not-syncing: PL/JA appena sbloccate (indexable), KO come
// variante di controllo noindex (non deve MAI diventare indicizzabile).
async function checkHealthConnectLocales(browser: Browser) {
  const cases: Array<{ locale: string; path: string; expectIndexable: boolean }> = [
    { locale: "pl", path: "/pl/blog/health-connect-nie-synchronizuje", expectIndexable: true },
    { locale: "ja", path: "/ja/blog/health-connect-douki-mondai-kaiketsu", expectIndexable: true },
    { locale: "ko", path: "/ko/blog/health-connect-dongkihwa-munje-haegyeol", expectIndexable: false },
  ];
  for (const c of cases) {
    checks++;
    const context = await browser.newContext();
    const page = await context.newPage();
    const res = await page.goto(`${BASE_URL}${c.path}`, { waitUntil: "networkidle" });
    const label = `[hc-locale/${c.locale}]`;
    if (!res || res.status() !== 200) errors.push(`${label} HTTP ${res?.status()} invece di 200`);

    const robots = await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null);
    const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null);

    if (c.expectIndexable) {
      if (robots && /noindex/i.test(robots)) errors.push(`${label} atteso index,follow (assenza tag) ma trovato robots="${robots}"`);
      if (!canonical || !canonical.includes(`/${c.locale}/`)) errors.push(`${label} canonical non self-referencing: "${canonical}"`);
      const bodyText = await page.evaluate(() => document.body.textContent ?? "");
      if (bodyText.trim().length < 500) errors.push(`${label} corpo pagina sospettosamente corto (${bodyText.trim().length} char)`);
    } else {
      if (!robots || !/noindex/i.test(robots)) errors.push(`${label} atteso noindex ma trovato robots="${robots}" — sblocco accidentale!`);
    }
    await context.close();
  }
}

(async () => {
  const cr = await chromium.launch();
  const wk = await webkit.launch();
  try {
    await checkRingPages("chromium", cr);
    await checkRingPages("webkit", wk);
    await checkHealthConnectLocales(cr);
  } finally {
    await cr.close();
    await wk.close();
  }

  if (errors.length > 0) {
    console.error(`❌ P1.9 PR B browser check: ${errors.length} problema/i su ${checks} combinazioni\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✅ P1.9 PR B browser check OK: ${checks} combinazioni — moduli ring store-aware, zero overflow, FAQ=JSON-LD, fonti+ImageObject presenti, PL/JA indicizzabili con canonical self, KO correttamente ancora noindex.`);
})();
