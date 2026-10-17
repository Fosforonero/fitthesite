import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/matteo/.gemini/antigravity/brain/3aa8075f-6e1d-43ec-86fa-9f82b590e998/dashboard-ux/after';
fs.mkdirSync(outDir, { recursive: true });

const baseUrl = 'http://localhost:3009';

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
        await page.goto(url, { waitUntil: 'networkidle' });

        // Save viewport screenshot
        const fileName = `preview-${lc}-${st}-${vp.name}.png`;
        const filePath = path.join(outDir, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved ${fileName}`);

        // If mobile-390 and state is ok, test table toggle
        if (vp.name === 'mobile-390' && st === 'ok') {
          const summary = page.locator('details summary').first();
          if (await summary.count() > 0) {
            const box = await summary.boundingBox();
            summaryMeasurements.push({
              locale: lc,
              viewport: vp.name,
              width: box ? box.width : 0,
              height: box ? box.height : 0,
            });

            // Focus summary and take screenshot of focus state
            await summary.focus();
            await page.screenshot({
              path: path.join(outDir, `table-summary-focused-${lc}-${vp.name}.png`),
              fullPage: false,
            });

            // Click summary to toggle open
            await summary.click();
            await page.waitForTimeout(200);
            await page.screenshot({
              path: path.join(outDir, `table-opened-${lc}-${vp.name}.png`),
              fullPage: false,
            });
          }
        }
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('Measurements:', JSON.stringify(summaryMeasurements, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
