import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = process.env.DASHBOARD_UX_OUT_DIR
  ? path.resolve(process.env.DASHBOARD_UX_OUT_DIR)
  : path.resolve(process.cwd(), '.screenshots/dashboard-ux');
fs.mkdirSync(outDir, { recursive: true });

const baseUrl = process.env.DASHBOARD_BASE_URL || 'http://localhost:3210';

const viewports = [
  { name: 'mobile-320', width: 320, height: 700, isMobile: true },
  { name: 'mobile-390', width: 390, height: 844, isMobile: true },
  { name: 'tablet-768', width: 768, height: 1024, isMobile: false },
  { name: 'desktop-1280', width: 1280, height: 800, isMobile: false },
];

const locales = ['it', 'en'];

async function run() {
  const browser = await chromium.launch();
  const results = [];

  console.log('== Inizio Misura G-05 Grafico Dashboard (Playwright Chromium) ==');

  for (const vp of viewports) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const lc of locales) {
      const url = `${baseUrl}/${lc}/dashboard-preview/trends?range=7&state=ok`;
      const res = await page.goto(url, { waitUntil: 'networkidle' });
      if (!res || res.status() >= 400) {
        throw new Error(`Impossibile caricare ${url}: stato ${res?.status()}`);
      }

      // Attesa rendering sezione grafici interattivi
      await page.waitForSelector('[data-interactive-charts-section]');
      const chart = page.locator('#trends-steps-chart');
      await chart.waitFor({ state: 'visible' });

      // Trova gli slot del primo grafico (DailyStepsChart)
      const slotButtons = chart.locator('button[data-slot-index]');
      const slotCount = await slotButtons.count();
      if (slotCount !== 7) {
        throw new Error(`Attesi 7 slot nel grafico, trovati ${slotCount} su ${url}`);
      }

      // 1. Misura posizione e visibilita rispetto all'header
      // Scrolliamo il grafico in vista
      const firstSlot = slotButtons.nth(0);
      await firstSlot.scrollIntoViewIfNeeded();

      const measurements = await page.evaluate(() => {
        const header = document.querySelector('header');
        const headerRect = header ? header.getBoundingClientRect() : null;
        const headerStyle = header ? window.getComputedStyle(header) : null;

        const banner = document.querySelector('[data-preview-banner]');
        const bannerRect = banner ? banner.getBoundingClientRect() : null;

        const previewBar = document.querySelector('[data-preview-bar]');
        const barRect = previewBar ? previewBar.getBoundingClientRect() : null;

        const slots = Array.from(document.querySelectorAll('#trends-steps-chart button[data-slot-index]'));
        const slotData = slots.map((s, idx) => {
          const r = s.getBoundingClientRect();
          return {
            index: idx,
            date: s.getAttribute('data-date'),
            rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
          };
        });

        // Misura sticky header o elementi fissi in cima
        let topBarBottom = 0;
        if (headerRect && headerStyle && (headerStyle.position === 'sticky' || headerStyle.position === 'fixed')) {
          topBarBottom = Math.max(topBarBottom, headerRect.bottom);
        }

        return {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          header: headerRect ? {
            top: headerRect.top,
            bottom: headerRect.bottom,
            height: headerRect.height,
            position: headerStyle?.position,
          } : null,
          banner: bannerRect ? { top: bannerRect.top, bottom: bannerRect.bottom } : null,
          bar: barRect ? { top: barRect.top, bottom: barRect.bottom } : null,
          topBarBottom,
          firstSlot: slotData[0],
          midSlot: slotData[3],
          lastSlot: slotData[6],
        };
      });

      // Calcola clearance rispetto al bordo inferiore dell'header / barre superiori
      const effectiveTopBoundary = measurements.topBarBottom > 0 ? measurements.topBarBottom : 0;
      const slotTop = measurements.firstSlot.rect.top;
      const clearance = slotTop - effectiveTopBoundary;

      console.log(`[${lc} | ${vp.name}] Primo slot top: ${slotTop.toFixed(1)}px, Top bar bottom: ${effectiveTopBoundary.toFixed(1)}px, Clearance: ${clearance.toFixed(1)}px, Slot dim: ${measurements.firstSlot.rect.width.toFixed(1)}x${measurements.firstSlot.rect.height.toFixed(1)}px`);

      if (slotTop < effectiveTopBoundary) {
        throw new Error(`[${lc} | ${vp.name}] Slot coperto dall'header! slotTop=${slotTop} < headerBottom=${effectiveTopBoundary}`);
      }

      results.push({
        locale: lc,
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        headerPosition: measurements.header?.position ?? 'none',
        slotWidth: Math.round(measurements.firstSlot.rect.width),
        slotHeight: Math.round(measurements.firstSlot.rect.height),
        slotTop: Math.round(slotTop),
        effectiveTopBoundary: Math.round(effectiveTopBoundary),
        clearance: Math.round(clearance),
      });

      // 2. Navigazione da tastiera: Tab e Shift+Tab
      // Clicchiamo su un elemento precedente (es. selettore range) per stabilire il punto di partenza
      const rangeBtn = page.locator('nav[data-trends-range] a[data-range="7"]');
      if (await rangeBtn.count() > 0) {
        await rangeBtn.focus();
      }

      // Tab fino al primo slot
      let slotFocused = false;
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        const activeSlotIdx = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.getAttribute('data-slot-index');
        });
        if (activeSlotIdx === '0') {
          slotFocused = true;
          break;
        }
      }

      if (!slotFocused) {
        // Fallback: focus diretto per verificare la catena interna
        await firstSlot.focus();
      }

      // Verifica che il primo slot abbia il focus
      const isFirstFocused = await page.evaluate(() => {
        return document.activeElement?.getAttribute('data-slot-index') === '0';
      });
      if (!isFirstFocused) {
        throw new Error(`[${lc} | ${vp.name}] Primo slot non focalizzato correttamente.`);
      }

      // Tab al secondo slot
      await page.keyboard.press('Tab');
      const isSecondFocused = await page.evaluate(() => {
        return document.activeElement?.getAttribute('data-slot-index') === '1';
      });
      if (!isSecondFocused) {
        throw new Error(`[${lc} | ${vp.name}] Tab non e avanzato al secondo slot (data-slot-index="1").`);
      }

      // Shift+Tab indietro al primo slot
      await page.keyboard.press('Shift+Tab');
      const isBackToFirst = await page.evaluate(() => {
        return document.activeElement?.getAttribute('data-slot-index') === '0';
      });
      if (!isBackToFirst) {
        throw new Error(`[${lc} | ${vp.name}] Shift+Tab non e tornato al primo slot (data-slot-index="0").`);
      }

      // 3. Verifica Gestore Enter e Spazio (singola attivazione, toggle, escape)
      // Spostiamoci sullo slot centrale (indice 3)
      const testSlot = slotButtons.nth(3);
      await testSlot.focus();

      const expectedDate = await testSlot.getAttribute('data-date');

      // Test A: Pressione Enter -> apre tooltip con singola attivazione
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      const tooltipAfterEnter = await page.evaluate(() => {
        const tip = document.querySelector('#trends-steps-chart-tooltip');
        if (!tip) return null;
        return {
          visible: window.getComputedStyle(tip).display !== 'none',
          date: tip.getAttribute('data-date'),
          text: tip.textContent?.trim(),
        };
      });

      if (!tooltipAfterEnter || !tooltipAfterEnter.visible || tooltipAfterEnter.date !== expectedDate) {
        throw new Error(`[${lc} | ${vp.name}] Pressione Enter non ha aperto correttamente il tooltip per ${expectedDate}`);
      }

      // Salva screenshot con tooltip aperto via Enter
      if (lc === 'it') {
        const enterShotPath = path.join(outDir, `g05-chart-enter-${vp.name}.png`);
        await page.screenshot({ path: enterShotPath, fullPage: false });
        console.log(`Saved screenshot: ${path.basename(enterShotPath)}`);
      }

      // Test B: Seconda pressione Enter -> chiude / disattiva il tooltip fissato
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      const tooltipAfterSecondEnter = await page.evaluate(() => {
        const tip = document.querySelector('#trends-steps-chart-tooltip');
        if (!tip) return null;
        return {
          visible: window.getComputedStyle(tip).display !== 'none',
          isPinned: tip.getAttribute('data-pinned') === 'true',
        };
      });

      // Quando non fissato e senza hover, il tooltip scompare o torna a riepilogo
      const isClosedAfterSecondEnter = !tooltipAfterSecondEnter || !tooltipAfterSecondEnter.isPinned;
      if (!isClosedAfterSecondEnter) {
        throw new Error(`[${lc} | ${vp.name}] Seconda pressione Enter non ha chiuso o disattivato il fissaggio del tooltip`);
      }

      // Test C: Pressione Spazio -> apre tooltip con singola attivazione
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);

      const tooltipAfterSpace = await page.evaluate(() => {
        const tip = document.querySelector('#trends-steps-chart-tooltip');
        if (!tip) return null;
        return {
          visible: window.getComputedStyle(tip).display !== 'none',
          date: tip.getAttribute('data-date'),
        };
      });

      if (!tooltipAfterSpace || !tooltipAfterSpace.visible || tooltipAfterSpace.date !== expectedDate) {
        throw new Error(`[${lc} | ${vp.name}] Pressione Spazio non ha aperto il tooltip per ${expectedDate}`);
      }

      // Test D: Pressione Escape -> chiude il tooltip
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      const tooltipAfterEscape = await page.evaluate(() => {
        const tip = document.querySelector('#trends-steps-chart-tooltip');
        if (!tip) return null;
        return {
          date: tip.getAttribute('data-date'),
          isPinned: tip.getAttribute('data-pinned') === 'true',
        };
      });

      // Con Escape la selezione viene azzerata (setSelection(null)), quindi data-date non deve piu esserci o tip resettato
      const isDismissedOnEscape = !tooltipAfterEscape || !tooltipAfterEscape.date;
      if (!isDismissedOnEscape) {
        throw new Error(`[${lc} | ${vp.name}] Pressione Escape non ha chiuso il tooltip (ancora presente date=${tooltipAfterEscape?.date})`);
      }

      // Salva screenshot dopo Escape
      if (lc === 'it' && vp.name === 'mobile-390') {
        const escapeShotPath = path.join(outDir, `g05-chart-escape-${vp.name}.png`);
        await page.screenshot({ path: escapeShotPath, fullPage: false });
        console.log(`Saved screenshot: ${path.basename(escapeShotPath)}`);
      }
    }

    await context.close();
  }

  await browser.close();

  console.log('\n== Risultati Misure G-05 Grafico ==');
  console.table(results);

  // Scrive il report JSON delle misure per tracciabilita
  const reportPath = path.join(outDir, 'g05-chart-measurements.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Report salvato in: ${reportPath}`);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
