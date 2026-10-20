import http from 'http';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Flag per controllo negativo (secondo Enter omesso per verificare che la sonda rilevi il mancato defissaggio)
const isNegativeControl = process.argv.includes('--control-negative') || process.argv.includes('--mutant');

const outDir = process.env.DASHBOARD_UX_OUT_DIR
  ? path.resolve(process.env.DASHBOARD_UX_OUT_DIR)
  : path.resolve(process.cwd(), '.screenshots/dashboard-ux');
fs.mkdirSync(outDir, { recursive: true });

const UID = 'dd000000-0000-4000-8000-000000000002';
const EMAIL = 'sintetico@example.invalid';

// 7 date concluse fino a ieri
const now = new Date();
const days = [];
for (let i = 7; i >= 1; i--) {
  const d = new Date(now.getTime() - i * 86400000);
  days.push(d.toISOString().slice(0, 10));
}

const metricsRows = days.map((dayKey, idx) => ({
  user_id: UID,
  local_day_key: dayKey,
  steps: 6000 + idx * 500,
  source: 'garmin',
  received_at: new Date().toISOString(),
  distance_meters: 5000,
  active_calories_kcal: 300,
  calories_kcal: 2000,
  sleep_minutes: 480,
  heart_rate_bpm: 65,
  resting_heart_rate_bpm: 60,
  hrv_rmssd: 45,
}));

// Mock HTTP Supabase su porta 9999 (banco isolato)
function startMockSupabase(port = 9999) {
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://127.0.0.1:${port}`);
    const pathname = parsedUrl.pathname;

    if (pathname === '/auth/v1/user') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: UID,
        email: EMAIL,
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }));
      return;
    }

    if (pathname === '/rest/v1/user_roles') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }

    if (pathname === '/rest/v1/rpc/get_web_dashboard_access') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        contractVersion: 1,
        granted: true,
        titles: ['founder'],
      }));
      return;
    }

    if (pathname === '/rest/v1/fitness_metrics') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Range': `0-${metricsRows.length - 1}/${metricsRows.length}`,
      });
      res.end(JSON.stringify(metricsRows));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve(server);
    });
  });
}

const LOCALES = ['it', 'en'];

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 700, expectSticky: false },
  { name: 'mobile-390', width: 390, height: 844, expectSticky: false },
  { name: 'sub-breakpoint-639', width: 639, height: 800, expectSticky: false },
  { name: 'breakpoint-sm-640', width: 640, height: 800, expectSticky: true },
  { name: 'desktop-1280', width: 1280, height: 800, expectSticky: true },
];

async function run() {
  console.log('== Avvio Sonda G-05 Consolidata su Route Reale /app/dashboard ==');
  console.log('Motore browser eseguito: Chromium (Playwright).');
  console.log('Motori non eseguiti: WebKit, Firefox (non inclusi in questa esecuzione mirata).');

  if (isNegativeControl) {
    console.log('[MODALITA CONTROLLO NEGATIVO ATTIVA: secondo Enter omesso per verificare sensibilita sonda]');
  }

  const mockPort = 9999;
  const mockServer = await startMockSupabase(mockPort);
  console.log(`[Banco] Mock Supabase attivo su porta ${mockPort}`);

  const nextPort = process.env.PORT || '3210';
  let nextProc = null;
  let isNextRunning = false;

  try {
    const testPing = await fetch(`http://localhost:${nextPort}/it`);
    if (testPing.status === 200 || testPing.status === 404) {
      isNextRunning = true;
      console.log(`[Banco] Next.js gia attivo su porta ${nextPort}`);
    }
  } catch {}

  if (!isNextRunning) {
    console.log(`[Banco] Avvio Next.js dev su porta ${nextPort}...`);
    const nextEnv = {
      ...process.env,
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${mockPort}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
      FITMESH_WEB_DASHBOARD: '1',
      PORT: nextPort,
    };
    nextProc = spawn('npx', ['next', 'dev', '-p', nextPort], {
      env: nextEnv,
      cwd: process.cwd(),
      stdio: 'ignore',
    });

    for (let i = 0; i < 30; i++) {
      try {
        const ping = await fetch(`http://localhost:${nextPort}/it`);
        if (ping.status === 200 || ping.status === 404) {
          isNextRunning = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!isNextRunning) {
      mockServer.close();
      if (nextProc) nextProc.kill();
      throw new Error(`Timeout avvio Next.js su porta ${nextPort}`);
    }
  }

  // Token di sessione per @supabase/ssr
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: UID,
    email: EMAIL,
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: 'authenticated',
  })).toString('base64url');
  const jwt = `${header}.${payload}.mock_sig`;

  const sessionObj = {
    access_token: jwt,
    refresh_token: 'mock-refresh',
    user: {
      id: UID,
      email: EMAIL,
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  const cookieVal = `base64-${Buffer.from(JSON.stringify(sessionObj)).toString('base64')}`;

  const browser = await chromium.launch();
  const allResults = [];
  const failures = [];

  for (const lc of LOCALES) {
    console.log(`\n========================================`);
    console.log(`=== Locale: ${lc.toUpperCase()} ===`);
    console.log(`========================================`);

    for (const vp of VIEWPORTS) {
      console.log(`\n--- [${lc}] Viewport: ${vp.name} (${vp.width}x${vp.height}, atteso sticky: ${vp.expectSticky}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });

      await context.addCookies([
        {
          name: 'sb-127-auth-token',
          value: cookieVal,
          domain: 'localhost',
          path: '/',
        },
      ]);

      const page = await context.newPage();
      const url = `http://localhost:${nextPort}/${lc}/app/dashboard`;
      const res = await page.goto(url, { waitUntil: 'networkidle' });

      if (!res || res.status() >= 400 || page.url().includes('/auth/login')) {
        failures.push(`[${lc} | ${vp.name}] Caricamento fallito o redirect a login su ${url}`);
        await context.close();
        continue;
      }

      // 1. Controllo Posizione CSS Computata dell'Header
      const headerInfo = await page.evaluate(() => {
        const h = document.querySelector('header');
        if (!h) return null;
        const s = window.getComputedStyle(h);
        const r = h.getBoundingClientRect();
        return {
          position: s.position,
          top: r.top,
          bottom: r.bottom,
          height: r.height,
        };
      });

      if (!headerInfo) {
        failures.push(`[${lc} | ${vp.name}] Elemento <header> non trovato nella pagina.`);
        await context.close();
        continue;
      }

      const isActuallySticky = headerInfo.position === 'sticky';
      if (vp.expectSticky && !isActuallySticky) {
        failures.push(`[${lc} | ${vp.name}] Header doveva essere sticky (>= 640px), invece e': ${headerInfo.position}`);
      }
      if (!vp.expectSticky && isActuallySticky) {
        failures.push(`[${lc} | ${vp.name}] Header doveva essere nel normale flusso (< 640px), invece e': ${headerInfo.position}`);
      }

      // 2. Controllo Presenza Grafico e Dimensioni Hit Area
      const chartLocator = page.locator('#passi-giornalieri');
      if (await chartLocator.count() === 0) {
        failures.push(`[${lc} | ${vp.name}] Grafico #passi-giornalieri non presente nel DOM.`);
        await context.close();
        continue;
      }

      const slotButtons = page.locator('#passi-giornalieri button[data-slot-index]');
      const slotCount = await slotButtons.count();
      if (slotCount !== 7) {
        failures.push(`[${lc} | ${vp.name}] Attesi 7 slot nel grafico, trovati ${slotCount}.`);
        await context.close();
        continue;
      }

      // Asserzione bloccante sulle dimensioni hit-area di ciascun slot
      const slotDimensions = [];
      for (let i = 0; i < slotCount; i++) {
        const slot = slotButtons.nth(i);
        const box = await slot.boundingBox();
        if (!box) {
          failures.push(`[${lc} | ${vp.name}] Impossibile misurare bounding box per slot ${i}`);
          continue;
        }
        slotDimensions.push({ index: i, width: box.width, height: box.height });
        if (box.width < 44 || box.height < 44) {
          failures.push(`[${lc} | ${vp.name}] Slot ${i} ha hit area insufficiente: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px (atteso >= 44x44px).`);
        }
      }

      // 3. Navigazione Naturale Tab verso il Grafico (ingresso da cima pagina)
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.focus('body');

      let forwardTabSlot0 = null;
      for (let step = 1; step <= 15; step++) {
        await page.keyboard.press('Tab');
        const state = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const r = el.getBoundingClientRect();
          const header = document.querySelector('header');
          const hr = header ? header.getBoundingClientRect() : { top: 0, bottom: 0, height: 0 };
          const headerStyle = header ? window.getComputedStyle(header) : null;
          const isSticky = headerStyle?.position === 'sticky';
          const isOccludedByHeader = isSticky && r.top < hr.bottom && r.bottom > hr.top;
          const clearanceFromHeader = isSticky ? r.top - hr.bottom : r.top;
          const isInViewport = r.bottom > 0 && r.top < window.innerHeight;

          return {
            tagName: el.tagName,
            slotIndex: el.getAttribute('data-slot-index'),
            rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) },
            headerRect: { top: Math.round(hr.top), bottom: Math.round(hr.bottom), height: Math.round(hr.height), isSticky },
            scrollY: Math.round(window.scrollY),
            isOccludedByHeader,
            clearanceFromHeader: Math.round(clearanceFromHeader),
            isInViewport,
          };
        });

        if (state && state.slotIndex === '0') {
          forwardTabSlot0 = state;
          break;
        }
      }

      if (!forwardTabSlot0) {
        failures.push(`[${lc} | ${vp.name}] Tab naturale non ha raggiunto lo slot 0 del grafico!`);
      } else {
        if (!forwardTabSlot0.isInViewport) {
          failures.push(`[${lc} | ${vp.name}] Slot 0 dopo Tab di ingresso non e' nell'intersezione con la viewport.`);
        }
        if (forwardTabSlot0.isOccludedByHeader) {
          failures.push(`[${lc} | ${vp.name}] Slot 0 dopo Tab di ingresso e' occluso dall'header sticky! (slotTop=${forwardTabSlot0.rect.top}, headerBottom=${forwardTabSlot0.headerRect.bottom})`);
        }
      }

      // 4. Verifica Comportamentale Fissaggio, Defissaggio ed Escape su Slot 0/1
      const slot0 = slotButtons.nth(0);
      const slot1 = slotButtons.nth(1);
      const date0 = await slot0.getAttribute('data-date');
      const date1 = await slot1.getAttribute('data-date');

      // Focus iniziale su slot 0 mostra date0
      const tipDateInit = await page.evaluate(() => document.querySelector('#passi-giornalieri-tooltip')?.getAttribute('data-date'));
      if (tipDateInit !== date0) {
        failures.push(`[${lc} | ${vp.name}] Focus iniziale su slot 0 non ha mostrato date0 nel tooltip (trovato: ${tipDateInit})`);
      }

      // Enter su slot 0: fissa (pinned)
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Tab su slot 1: con fissaggio, il tooltip conserva date0
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const tipDateWhilePinned = await page.evaluate(() => document.querySelector('#passi-giornalieri-tooltip')?.getAttribute('data-date'));
      const isPinnedObservably = tipDateWhilePinned === date0;
      if (!isPinnedObservably) {
        failures.push(`[${lc} | ${vp.name}] Fissaggio non mantenuto: spostando il fuoco su slot 1 il tooltip ha perso date0 (trovato: ${tipDateWhilePinned})`);
      }

      // Shift+Tab a slot 0
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(100);

      // Secondo Enter su slot 0: defissa (unpin)
      if (isNegativeControl) {
        console.log(`[CONTROLLO NEGATIVO] Simulo omissione secondo Enter su ${lc}-${vp.name}`);
      } else {
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(100);

      // Tab su slot 1: ora defissato, il tooltip deve seguire e mostrare date1
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const tipDateAfterUnpin = await page.evaluate(() => document.querySelector('#passi-giornalieri-tooltip')?.getAttribute('data-date'));
      const isUnpinnedObservably = tipDateAfterUnpin === date1;
      if (!isUnpinnedObservably) {
        failures.push(`[${lc} | ${vp.name}] Defissaggio guasto: dopo il secondo Enter il tooltip non segue il fuoco su slot 1 (mostra: ${tipDateAfterUnpin})`);
      }

      // Escape: chiude la selezione
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      const tipHasDateAfterEscape = await page.evaluate(() => document.querySelector('#passi-giornalieri-tooltip')?.hasAttribute('data-date') ?? false);
      const isDismissedOnEscape = !tipHasDateAfterEscape;
      if (!isDismissedOnEscape) {
        failures.push(`[${lc} | ${vp.name}] Escape non ha chiuso il tooltip.`);
      }

      // 5. Avanzamento Oltre il Grafico fino al Contenuto Successivo e Scorrimento Pagina
      // Avanziamo con Tab fino a oltre lo slot 6 (il summary della tabella accessibile)
      let summaryFocused = false;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const activeTag = await page.evaluate(() => document.activeElement?.tagName);
        if (activeTag === 'SUMMARY') {
          summaryFocused = true;
          break;
        }
      }

      if (!summaryFocused) {
        failures.push(`[${lc} | ${vp.name}] Tab non ha raggiunto l'elemento <summary> dopo il grafico.`);
      }

      // Simuliamo scorrimento della pagina verso il basso sul contenuto successivo
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(100);

      // 6. Percorso a Ritroso con Shift+Tab dal Contenuto Successivo al Grafico (Requisito 1)
      // Primo Shift+Tab: arretra da <summary> allo slot 6 del grafico
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(100);

      const backwardShiftTabSlot6 = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const header = document.querySelector('header');
        const hr = header ? header.getBoundingClientRect() : { top: 0, bottom: 0, height: 0 };
        const headerStyle = header ? window.getComputedStyle(header) : null;
        const isSticky = headerStyle?.position === 'sticky';
        const isOccludedByHeader = isSticky && r.top < hr.bottom && r.bottom > hr.top;
        const clearanceFromHeader = isSticky ? r.top - hr.bottom : r.top;
        const isInViewport = r.bottom > 0 && r.top < window.innerHeight;

        return {
          slotIndex: el.getAttribute('data-slot-index'),
          rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) },
          headerRect: { bottom: Math.round(hr.bottom), height: Math.round(hr.height), isSticky },
          clearanceFromHeader: Math.round(clearanceFromHeader),
          isOccludedByHeader,
          isInViewport,
          scrollY: Math.round(window.scrollY),
        };
      });

      if (!backwardShiftTabSlot6 || backwardShiftTabSlot6.slotIndex !== '6') {
        failures.push(`[${lc} | ${vp.name}] Shift+Tab a ritroso non e' atterrato su slot 6 (trovato: ${backwardShiftTabSlot6?.slotIndex}).`);
      } else {
        if (!backwardShiftTabSlot6.isInViewport) {
          failures.push(`[${lc} | ${vp.name}] Slot 6 a ritroso non e' nell'intersezione con la viewport.`);
        }
        if (backwardShiftTabSlot6.isOccludedByHeader) {
          failures.push(`[${lc} | ${vp.name}] Slot 6 a ritroso e' occluso dall'header sticky! (slotTop=${backwardShiftTabSlot6.rect.top}, headerBottom=${backwardShiftTabSlot6.headerRect.bottom})`);
        }
      }

      // Arretriamo attraverso tutti gli slot fino allo slot 0 (Shift+Tab x 6)
      for (let i = 5; i >= 0; i--) {
        await page.keyboard.press('Shift+Tab');
      }
      await page.waitForTimeout(100);

      // Misura NUOVA e distinta di slot 0 DOPO Shift+Tab a ritroso (Requisito 1: non riutilizzare la misura iniziale!)
      const backwardShiftTabSlot0 = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const header = document.querySelector('header');
        const hr = header ? header.getBoundingClientRect() : { top: 0, bottom: 0, height: 0 };
        const headerStyle = header ? window.getComputedStyle(header) : null;
        const isSticky = headerStyle?.position === 'sticky';
        const isOccludedByHeader = isSticky && r.top < hr.bottom && r.bottom > hr.top;
        const clearanceFromHeader = isSticky ? r.top - hr.bottom : r.top;
        const isInViewport = r.bottom > 0 && r.top < window.innerHeight;

        return {
          slotIndex: el.getAttribute('data-slot-index'),
          rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) },
          headerRect: { bottom: Math.round(hr.bottom), height: Math.round(hr.height), isSticky },
          clearanceFromHeader: Math.round(clearanceFromHeader),
          isOccludedByHeader,
          isInViewport,
          scrollY: Math.round(window.scrollY),
        };
      });

      if (!backwardShiftTabSlot0 || backwardShiftTabSlot0.slotIndex !== '0') {
        failures.push(`[${lc} | ${vp.name}] Shift+Tab a ritroso finale non e' tornato a slot 0 (trovato: ${backwardShiftTabSlot0?.slotIndex}).`);
      } else {
        if (!backwardShiftTabSlot0.isInViewport) {
          failures.push(`[${lc} | ${vp.name}] Slot 0 dopo Shift+Tab a ritroso non e' nell'intersezione con la viewport.`);
        }
        if (backwardShiftTabSlot0.isOccludedByHeader) {
          failures.push(`[${lc} | ${vp.name}] Slot 0 dopo Shift+Tab a ritroso e' occluso dall'header sticky! (slotTop=${backwardShiftTabSlot0.rect.top}, headerBottom=${backwardShiftTabSlot0.headerRect.bottom})`);
        }
      }

      // Screenshot evidenza consolidata
      const shotPath = path.join(outDir, `real-dashboard-g05-${lc}-${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      allResults.push({
        locale: lc,
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        headerPosition: headerInfo.position,
        headerSticky: isActuallySticky,
        slot0Width: Math.round(slotDimensions[0].width),
        slot0Height: Math.round(slotDimensions[0].height),
        // Misura 1: Ingresso con Tab
        forwardTabSlot0Top: forwardTabSlot0?.rect.top ?? null,
        forwardTabSlot0Clearance: forwardTabSlot0?.clearanceFromHeader ?? null,
        forwardTabSlot0Occluded: forwardTabSlot0?.isOccludedByHeader ?? false,
        // Misura 2: Shift+Tab a ritroso da contenuto successivo su Slot 6
        backwardSlot6Top: backwardShiftTabSlot6?.rect.top ?? null,
        backwardSlot6Clearance: backwardShiftTabSlot6?.clearanceFromHeader ?? null,
        backwardSlot6Occluded: backwardShiftTabSlot6?.isOccludedByHeader ?? false,
        // Misura 3: Shift+Tab a ritroso completo su Slot 0 (misura distinta)
        backwardSlot0Top: backwardShiftTabSlot0?.rect.top ?? null,
        backwardSlot0Clearance: backwardShiftTabSlot0?.clearanceFromHeader ?? null,
        backwardSlot0Occluded: backwardShiftTabSlot0?.isOccludedByHeader ?? false,
        // Comportamento osservabile
        pinnedMaintained: isPinnedObservably,
        unpinSuccess: isUnpinnedObservably,
        escapeDismiss: isDismissedOnEscape,
      });

      await context.close();
    }
  }

  await browser.close();
  mockServer.close();
  if (nextProc) nextProc.kill();

  console.log('\n== Tabella Misure Consolidate G-05 (/app/dashboard IT ed EN) ==');
  console.table(allResults);

  const reportPath = path.join(outDir, 'g05-real-route-consolidated.json');
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2), 'utf8');
  console.log(`Report consolidato salvato in: ${reportPath}`);

  if (failures.length > 0) {
    console.error(`\n❌ Sonda G-05 terminata con ${failures.length} FALLIMENTI:`);
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  } else {
    console.log(`\n✅ Sonda G-05 COMPLETATA CON SUCCESSO su tutti i 10 casi (5 Viewport x 2 Lingue).`);
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal error sonda G-05:', err);
  process.exit(1);
});
