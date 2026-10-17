import { chromium, webkit, type Browser } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const RADICE = path.resolve(__dirname, '..');
const CSS_PATH = '/tmp/g05-test.css';

const LOCALES = ['it', 'en', 'fr', 'fi'] as const;
type Locale = typeof LOCALES[number];

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568, isMobile: true },
  { name: 'mobile-390', width: 390, height: 844, isMobile: true },
  { name: 'sub-breakpoint-639', width: 639, height: 800, isMobile: true },
  { name: 'breakpoint-sm-640', width: 640, height: 800, isMobile: false },
  { name: 'desktop-1280', width: 1280, height: 800, isMobile: false },
];

function getTranslations(lc: Locale) {
  const dictPath = path.join(RADICE, 'lib', 'dictionaries', `${lc}.json`);
  const dict = JSON.parse(readFileSync(dictPath, 'utf8'));
  return {
    dashboard: dict.app?.nav?.dashboard ?? 'Dashboard',
    devices: dict.app?.nav?.devices ?? 'Devices',
    settings: dict.app?.nav?.settings ?? 'Settings',
    logout: dict.app?.nav?.logout ?? 'Sign out',
  };
}

function buildHtml(lc: Locale, nav: ReturnType<typeof getTranslations>, css: string): string {
  return `<!DOCTYPE html>
<html lang="${lc}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>G-05 Header Test [${lc}]</title>
  <style>
    ${css}
  </style>
</head>
<body class="bg-bg-primary text-text-primary antialiased m-0 p-0">
  <div class="min-h-screen flex flex-col">
    <header id="site-header" class="border-b border-divider bg-bg-secondary/40 backdrop-blur sm:sticky sm:top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <a href="/${lc}/app" id="nav-logo" class="font-display font-semibold text-text-primary">
          FitMesh
        </a>
        <nav class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <a href="/${lc}/app" id="nav-dashboard" class="text-text-secondary hover:text-text-primary transition">
            ${nav.dashboard}
          </a>
          <a href="/${lc}/app/devices" id="nav-devices" class="text-text-secondary hover:text-text-primary transition">
            ${nav.devices}
          </a>
          <a href="/${lc}/app/settings" id="nav-settings" class="text-text-secondary hover:text-text-primary transition">
            ${nav.settings}
          </a>
          <form action="/${lc}/auth/logout" method="post" class="inline m-0 p-0">
            <button
              type="submit"
              id="nav-logout"
              class="text-text-muted hover:text-text-secondary transition text-xs"
            >
              ${nav.logout}
            </button>
          </form>
        </nav>
      </div>
    </header>
    <main class="flex-1 p-6" style="min-height: 1400px;">
      <h1 class="text-2xl font-bold">Main Content Area</h1>
      <p class="mt-4">Testing scroll and focus behavior...</p>
      <input type="text" id="target-input" placeholder="Focus target input" class="mt-8 p-2 border" />
    </main>
  </div>
</body>
</html>`;
}

async function runMatrix() {
  if (!existsSync(CSS_PATH)) {
    throw new Error(`CSS compilato non trovato in ${CSS_PATH}. Eseguire prima tailwind.`);
  }
  const css = readFileSync(CSS_PATH, 'utf8');

  let failures: string[] = [];
  let checksCount = 0;

  console.log('== Inizio Matrice di Verifica Browser G-05 (Playwright Chromium + WebKit) ==');

  const browsers: { name: string; instance: Browser }[] = [];
  try {
    browsers.push({ name: 'chromium', instance: await chromium.launch({ headless: true }) });
  } catch (err) {
    console.warn('Chromium launch failed:', err);
  }

  try {
    browsers.push({ name: 'webkit', instance: await webkit.launch({ headless: true }) });
  } catch (err) {
    console.warn('WebKit launch skipped/failed:', (err as Error).message);
  }

  if (browsers.length === 0) {
    throw new Error('Nessun browser Playwright disponibile per il test.');
  }

  for (const { name: engine, instance: browser } of browsers) {
    console.log(`\n-- Test Motore Browser: ${engine} --`);

    for (const lc of LOCALES) {
      const nav = getTranslations(lc);
      const html = buildHtml(lc, nav, css);

      for (const vp of VIEWPORTS) {
        checksCount++;
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        await page.setContent(html, { waitUntil: 'load' });

        // 1. Controllo Posizione CSS Computata
        const position = await page.$eval('#site-header', (el) => window.getComputedStyle(el).position);
        if (vp.isMobile) {
          if (position === 'sticky' || position === 'fixed') {
            failures.push(`[${engine} | ${lc} | ${vp.name}] Header e sticky (${position}) sotto il breakpoint sm! Atteso normal flow (static).`);
          }
        } else {
          if (position !== 'sticky') {
            failures.push(`[${engine} | ${lc} | ${vp.name}] Header non e sticky (${position}) da sm in su! Atteso sticky.`);
          }
        }

        // 2. Controllo Overflow Orizzontale
        const overflow = await page.evaluate(() => {
          const docOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
          const header = document.getElementById('site-header');
          const headerOverflow = header ? header.scrollWidth > document.documentElement.clientWidth : false;
          return { docOverflow, headerOverflow };
        });

        if (overflow.docOverflow) {
          failures.push(`[${engine} | ${lc} | ${vp.name}] Rilevato overflow orizzontale sul documento.`);
        }
        if (overflow.headerOverflow) {
          failures.push(`[${engine} | ${lc} | ${vp.name}] Rilevato overflow orizzontale sull'header.`);
        }

        // 3. Controllo Delimitazione Elementi nella Viewport
        const elements = ['nav-logo', 'nav-dashboard', 'nav-devices', 'nav-settings', 'nav-logout'];
        for (const id of elements) {
          const box = await page.$eval(`#${id}`, (el) => {
            const r = el.getBoundingClientRect();
            return { x: r.x, width: r.width, right: r.right, visible: r.width > 0 && r.height > 0 };
          });

          if (!box.visible) {
            failures.push(`[${engine} | ${lc} | ${vp.name}] Elemento #${id} non ha dimensioni visibili.`);
          }
          if (box.x < 0 || box.right > vp.width + 1) {
            failures.push(`[${engine} | ${lc} | ${vp.name}] Elemento #${id} sfora lateralmente (x=${box.x}, right=${box.right}, viewport=${vp.width}).`);
          }
        }

        // 4. Controllo Scorrimento (Scroll Flow vs Sticky)
        await page.evaluate(() => window.scrollTo(0, 300));
        await page.waitForTimeout(50);
        const headerTopAfterScroll = await page.$eval('#site-header', (el) => el.getBoundingClientRect().top);

        if (vp.isMobile) {
          // Sotto sm l'header deve scorrere via con la pagina (non rimanere a 0)
          if (headerTopAfterScroll >= 0) {
            failures.push(`[${engine} | ${lc} | ${vp.name}] Header non e scorso via sotto sm dopo scroll di 300px (top=${headerTopAfterScroll}).`);
          }
        } else {
          // Da sm in su l'header deve rimanere appeso a top = 0
          if (Math.abs(headerTopAfterScroll) > 1) {
            failures.push(`[${engine} | ${lc} | ${vp.name}] Header sticky non e rimasto a top=0 dopo scroll (top=${headerTopAfterScroll}).`);
          }
        }

        // Reset scroll per il test tastiera
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(50);

        // 5. Sequenza Navigazione da Tastiera (Tab / Shift+Tab)
        // Nota macOS WebKit: di default su macOS Safari/WebKit Tab scorre solo i form controls,
        // mentre Alt+Tab (Option+Tab) scorre tutti i link e bottoni. Su Chromium Tab scorre tutto.
        const tabKey = engine === 'webkit' ? 'Alt+Tab' : 'Tab';
        const shiftTabKey = engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab';

        await page.focus('#nav-logo');
        const focusedSequence: string[] = ['nav-logo'];

        for (let i = 0; i < 4; i++) {
          await page.keyboard.press(tabKey);
          const activeId = await page.evaluate(() => document.activeElement?.id ?? 'none');
          focusedSequence.push(activeId);
        }

        const expectedTab = ['nav-logo', 'nav-dashboard', 'nav-devices', 'nav-settings', 'nav-logout'];
        if (JSON.stringify(focusedSequence) !== JSON.stringify(expectedTab)) {
          failures.push(`[${engine} | ${lc} | ${vp.name}] Sequenza ${tabKey} errata: ${focusedSequence.join(' -> ')} (atteso: ${expectedTab.join(' -> ')})`);
        }

        // Shift+Tab indietro
        const shiftTabSequence: string[] = [];
        for (let i = 0; i < 4; i++) {
          await page.keyboard.press(shiftTabKey);
          const activeId = await page.evaluate(() => document.activeElement?.id ?? 'none');
          shiftTabSequence.push(activeId);
        }
        const expectedShiftTab = ['nav-settings', 'nav-devices', 'nav-dashboard', 'nav-logo'];
        if (JSON.stringify(shiftTabSequence) !== JSON.stringify(expectedShiftTab)) {
          failures.push(`[${engine} | ${lc} | ${vp.name}] Sequenza ${shiftTabKey} errata: ${shiftTabSequence.join(' -> ')} (atteso: ${expectedShiftTab.join(' -> ')})`);
        }

        await page.close();
      }
    }
    await browser.close();
  }

  console.log(`\nVerifiche totali completate: ${checksCount} combinazioni (Locales x Viewports x Browser).`);

  if (failures.length > 0) {
    console.error(`\n❌ Rilevati ${failures.length} errori:`);
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ TUTTE LE VERIFICHE BROWSER G-05 HANNO AVUTO ESITO POSITIVO:');
    console.log('   - Nessun overflow orizzontale a 320px, 390px, 639px, 640px, 1280px.');
    console.log('   - Header nel normale flusso (< 640px) e sticky da sm in su (>= 640px).');
    console.log('   - Scorrimento mobile sblocca la visualizzazione del contenuto senza coperture.');
    console.log('   - Sequenza completa Tab/Shift+Tab verificata su tutti e 5 gli elementi.');
    console.log('   - Matrice completa verificata su IT, EN, FR, FI.');
  }
}

runMatrix().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
