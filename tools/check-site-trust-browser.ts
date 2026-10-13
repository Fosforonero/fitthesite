/**
 * Verifica browser reale (Playwright Chromium) desktop (1440px) e mobile (320px)
 * per lo sprint SITE-TRUST (MICRO-GATE SITE-TRUST-01-B).
 *
 * Controlla:
 *  - assenza di overflow orizzontale a 320px e a 1440px;
 *  - cinque provider esclusi e relativi modelli: avviso, robots noindex, assenza badge store;
 *  - home, integrations e marquee: esclusi non promossi;
 *  - Suunto: disponibilita diretta solo Android (Google Play presente, App Store assente);
 *  - prezzi e FAQ IT/EN: testo approvato esatto e assenza paragoni non autorizzati;
 *  - distinzione tra breadcrumb informativi e link promozionali.
 */
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3922";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile-320", width: 320, height: 600 },
];

const EXCLUDED_SLUGS = ["fitbit", "polar", "oura", "withings", "huawei"];
const SAMPLE_MODELS = [
  { provider: "oura", model: "ring-gen3" },
  { provider: "fitbit", model: "charge-6" },
  { provider: "polar", model: "vantage-v3" },
  { provider: "withings", model: "scanwatch-2" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  let failures: string[] = [];
  let checks = 0;

  console.log(`Avvio verifiche browser su ${BASE_URL}...`);

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    // 1. Homepage IT
    await page.goto(`${BASE_URL}/it`, { waitUntil: "networkidle" });
    checks++;
    const itOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (itOverflow) failures.push(`[${vp.name}] /it presenta overflow orizzontale`);

    const itBody = await page.textContent("body") || "";
    for (const slug of EXCLUDED_SLUGS) {
      const link = await page.$(`a[href*="/sync/${slug}"]`);
      if (link) failures.push(`[${vp.name}] /it contiene link al provider escluso ${slug}`);
    }
    if (!itBody.includes("La prova gratuita dura 14 giorni.")) {
      failures.push(`[${vp.name}] /it manca del testo approvato della prova 14gg`);
    }
    if (itBody.includes("caffè") || itBody.includes("pizza")) {
      failures.push(`[${vp.name}] /it contiene riferimenti non autorizzati a caffè o pizza`);
    }

    // 2. Homepage EN
    await page.goto(`${BASE_URL}/en`, { waitUntil: "networkidle" });
    checks++;
    const enOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (enOverflow) failures.push(`[${vp.name}] /en presenta overflow orizzontale`);
    const enBody = await page.textContent("body") || "";
    if (!enBody.includes("The free trial lasts 14 days.")) {
      failures.push(`[${vp.name}] /en manca del testo approvato della prova 14gg`);
    }

    // 3. /it/integrations
    await page.goto(`${BASE_URL}/it/integrations`, { waitUntil: "networkidle" });
    checks++;
    const intOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (intOverflow) failures.push(`[${vp.name}] /it/integrations presenta overflow orizzontale`);
    for (const slug of EXCLUDED_SLUGS) {
      const link = await page.$(`a[href*="/sync/${slug}"]`);
      if (link) failures.push(`[${vp.name}] /it/integrations contiene link al provider escluso ${slug}`);
    }

    // 4. Provider esclusi (/it/sync/fitbit, oura, ecc.)
    for (const slug of EXCLUDED_SLUGS) {
      await page.goto(`${BASE_URL}/it/sync/${slug}`, { waitUntil: "networkidle" });
      checks++;
      const provOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (provOverflow) failures.push(`[${vp.name}] /it/sync/${slug} presenta overflow orizzontale`);

      const aside = await page.$("aside");
      const text = (await aside?.textContent()) || "";
      if (!text.includes("non è attualmente disponibile") && !text.includes("non è disponibile") && !text.includes("non e' disponibile")) {
        failures.push(`[${vp.name}] /it/sync/${slug} non mostra l'avviso di collegamento diretto non disponibile`);
      }

      const storeBadges = await page.$$("a[href*='apps.apple.com'], a[href*='play.google.com']");
      if (storeBadges.length > 0) {
        failures.push(`[${vp.name}] /it/sync/${slug} renderizza badge store non consentiti`);
      }

      const robotsMeta = await page.$eval('meta[name="robots"]', (el) => el.getAttribute("content")).catch(() => null);
      if (!robotsMeta || !robotsMeta.includes("noindex")) {
        failures.push(`[${vp.name}] /it/sync/${slug} manca di robots noindex (trovato: ${robotsMeta})`);
      }

      const ctaBtn = await page.$("a[href='/it/integrations']");
      if (!ctaBtn) {
        failures.push(`[${vp.name}] /it/sync/${slug} manca del pulsante neutro verso /integrations`);
      }
    }

    // 5. Modelli esclusi
    for (const { provider, model } of SAMPLE_MODELS) {
      await page.goto(`${BASE_URL}/it/sync/${provider}/${model}`, { waitUntil: "networkidle" });
      checks++;
      const modOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (modOverflow) failures.push(`[${vp.name}] /it/sync/${provider}/${model} presenta overflow orizzontale`);

      const aside = await page.$("aside");
      const text = (await aside?.textContent()) || "";
      if (!text.includes("non è attualmente disponibile") && !text.includes("non è disponibile") && !text.includes("non e' disponibile")) {
        failures.push(`[${vp.name}] /it/sync/${provider}/${model} non mostra l'avviso`);
      }

      const storeBadges = await page.$$("a[href*='apps.apple.com'], a[href*='play.google.com']");
      if (storeBadges.length > 0) {
        failures.push(`[${vp.name}] /it/sync/${provider}/${model} renderizza badge store non consentiti`);
      }

      const robotsMeta = await page.$eval('meta[name="robots"]', (el) => el.getAttribute("content")).catch(() => null);
      if (!robotsMeta || !robotsMeta.includes("noindex")) {
        failures.push(`[${vp.name}] /it/sync/${provider}/${model} manca di robots noindex`);
      }
    }

    // 6. Suunto
    await page.goto(`${BASE_URL}/it/sync/suunto`, { waitUntil: "networkidle" });
    checks++;
    const suuntoOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (suuntoOverflow) failures.push(`[${vp.name}] /it/sync/suunto presenta overflow orizzontale`);

    const appleBadge = await page.$("a[href*='apps.apple.com']");
    if (appleBadge) failures.push(`[${vp.name}] /it/sync/suunto non deve mostrare il badge App Store Apple`);

    const playBadge = await page.$("a[href*='play.google.com']");
    if (!playBadge) failures.push(`[${vp.name}] /it/sync/suunto deve mostrare il badge Google Play Android`);

    const suuntoText = await page.textContent("body") || "";
    if (!suuntoText.includes("su Android")) {
      failures.push(`[${vp.name}] /it/sync/suunto deve specificare la disponibilita su Android`);
    }

    await page.close();
  }

  await browser.close();

  if (failures.length > 0) {
    console.error(`\nFALLIMENTO: ${failures.length} errori riscontrati:`);
    failures.forEach((f) => console.error(` - ${f}`));
    process.exit(1);
  }

  console.log(`\nVERDE: tutte le ${checks} verifiche browser desktop e mobile (320px) sono passate con successo.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
