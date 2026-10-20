import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Output directory is configurable via DASHBOARD_UX_OUT_DIR, defaulting to .screenshots/dashboard-ux/after
const outDir = process.env.DASHBOARD_UX_OUT_DIR
  ? path.resolve(process.env.DASHBOARD_UX_OUT_DIR)
  : path.resolve(process.cwd(), '.screenshots/dashboard-ux/after');
fs.mkdirSync(outDir, { recursive: true });

const baseUrl = process.env.DASHBOARD_BASE_URL || 'http://localhost:3009';

const viewports = [
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 700 },
];

const locales = ['it', 'en'];
const states = ['ok', 'partial', 'empty'];

async function run() {
  const browser = await chromium.launch();
  const summaryMeasurements = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const lc of locales) {
      for (const st of states) {
        const url = `${baseUrl}/${lc}/dashboard-preview/overview?state=${st}`;
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        if (!response || response.status() >= 400) {
          throw new Error(`Failed to load ${url}: status ${response?.status()}`);
        }

        // Save viewport screenshot
        const fileName = `preview-${lc}-${st}-${vp.name}.png`;
        const filePath = path.join(outDir, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved ${fileName}`);

        // Rigorous check for details / summary control on the overview page
        const detailsCount = await page.locator('details').count();
        if (detailsCount === 0) {
          throw new Error(`Regression: no <details> element found on ${url}`);
        }

        // For mobile-390 and state ok, test all details/summary controls for hit-area and keyboard navigation
        if (vp.name === 'mobile-390' && st === 'ok') {
          for (let i = 0; i < detailsCount; i++) {
            const details = page.locator('details').nth(i);
            const summary = details.locator('summary');
            if (await summary.count() === 0) {
              throw new Error(`Regression: <details> at index ${i} has no <summary> on ${url}`);
            }

            // Scroll into view if needed
            await summary.scrollIntoViewIfNeeded();

            const box = await summary.boundingBox();
            if (!box) {
              throw new Error(`Regression: could not get bounding box for summary at index ${i} on ${url}`);
            }

            // Requirement: at least 44x44 CSS px effective hit area
            if (box.width < 44 || box.height < 44) {
              throw new Error(
                `Regression: summary at index ${i} has insufficient dimensions ${box.width.toFixed(1)}x${box.height.toFixed(1)} (must be >= 44x44) on ${url}`
              );
            }

            summaryMeasurements.push({
              locale: lc,
              viewport: vp.name,
              index: i,
              width: Math.round(box.width),
              height: Math.round(box.height),
            });

            // Focus summary and verify focus visible state
            await summary.focus();
            if (i === 0) {
              await page.screenshot({
                path: path.join(outDir, `table-summary-focused-${lc}-${vp.name}.png`),
                fullPage: false,
              });
            }

            // Test 1: Keyboard Enter toggle open
            await page.keyboard.press('Enter');
            const isOpenAfterEnter = await details.evaluate((el) => el.hasAttribute('open'));
            if (!isOpenAfterEnter) {
              throw new Error(`Regression: pressing Enter failed to open <details> at index ${i} on ${url}`);
            }

            if (i === 0) {
              await page.screenshot({
                path: path.join(outDir, `table-opened-${lc}-${vp.name}.png`),
                fullPage: false,
              });
            }

            // Test 2: Keyboard Enter toggle close
            await page.keyboard.press('Enter');
            const isClosedAfterEnter = await details.evaluate((el) => !el.hasAttribute('open'));
            if (!isClosedAfterEnter) {
              throw new Error(`Regression: pressing Enter failed to close <details> at index ${i} on ${url}`);
            }

            // Test 3: Keyboard Space toggle open
            await page.keyboard.press('Space');
            const isOpenAfterSpace = await details.evaluate((el) => el.hasAttribute('open'));
            if (!isOpenAfterSpace) {
              throw new Error(`Regression: pressing Space failed to open <details> at index ${i} on ${url}`);
            }

            // Test 4: Keyboard Space toggle close
            await page.keyboard.press('Space');
            const isClosedAfterSpace = await details.evaluate((el) => !el.hasAttribute('open'));
            if (!isClosedAfterSpace) {
              throw new Error(`Regression: pressing Space failed to close <details> at index ${i} on ${url}`);
            }
          }
        }
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('All a11y summary assertions passed.');
  console.log('Measurements:', JSON.stringify(summaryMeasurements, null, 2));
}

run().catch((err) => {
  console.error('PROBE FAILED:', err.message);
  process.exit(1);
});
