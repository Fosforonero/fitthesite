/**
 * Sonda browser dei grafici MONTATI nella schermata Trend della preview locale.
 *
 * Adattata da lib/web-dashboard/qa/verify-charts-ready.ts del prototipo (charts-ready-01):
 * li' i grafici vivevano in una sezione di prova; qui si misurano dove la schermata Trend li monta
 * (TrendChartsPanel, idPrefix "trends", dati sintetici marcati demo).
 *
 * Uso: npx tsx lib/web-dashboard/qa/verify-trends-charts-mounted.ts [--out <dir>] [--port 3191] [--name report]
 *  - avvia `npx next dev -H 127.0.0.1 -p <port>` con WEB_DASHBOARD_PROTOTYPE=1 (unico modo di aprire la preview);
 *  - rifiuta una porta gia' occupata (non misura il server di qualcun altro);
 *  - matrice it/en x 7/30 x 1440/390/320; per ogni combinazione layout F-2 e sequenza F-1;
 *  - scrive SOLO fuori dal repository (--out); exit code 1 se un controllo fallisce;
 *  - termina sempre il server (gruppo di processi), anche su errore o interruzione.
 * Nessun endpoint nuovo, nessun dato reale: ogni richiesta fuori dall'origine locale e' bloccata e conta come errore.
 */
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { chromium, type Locator, type Page } from 'playwright';

import {
  comboName,
  demoLabel,
  layoutFailures,
  matrix,
  parseArgs,
  tooltipFailures,
  trendsPath,
  type ChartMeasure,
  type ProbeCombo,
  type TooltipSequence,
} from './trends-charts-probe-core';

const REPO = path.resolve(__dirname, '../../..');
const READY_TIMEOUT_MS = 240_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function portFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

function startServer(port: number, logFile: string): ChildProcess {
  const env: NodeJS.ProcessEnv = { ...process.env, WEB_DASHBOARD_PROTOTYPE: '1', NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' };
  delete env.VERCEL_ENV;
  const log = fs.openSync(logFile, 'a');
  const child = spawn('npx', ['next', 'dev', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: REPO,
    env,
    detached: true, // gruppo di processi proprio: kill(-pid) prende anche i figli di next
    stdio: ['ignore', log, log],
  });
  fs.writeFileSync(path.join(path.dirname(logFile), 'dev-server.pid'), `${child.pid}\n`);
  return child;
}

async function stopServer(child: ChildProcess | null): Promise<void> {
  if (!child || child.pid === undefined || child.exitCode !== null) return;
  const pid = child.pid;
  try { process.kill(-pid, 'SIGTERM'); } catch { /* gia' uscito */ }
  for (let i = 0; i < 50 && child.exitCode === null && child.signalCode === null; i++) await sleep(100);
  try { process.kill(-pid, 'SIGKILL'); } catch { /* gia' uscito */ }
}

async function waitReady(base: string, child: ChildProcess): Promise<void> {
  const url = `${base}${trendsPath({ locale: 'it', period: 7 })}`;
  const t0 = Date.now();
  while (Date.now() - t0 < READY_TIMEOUT_MS) {
    if (child.exitCode !== null) throw new Error(`next dev uscito con codice ${child.exitCode}`);
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (r.status === 200) return;
    } catch { /* non ancora in ascolto */ }
    await sleep(1000);
  }
  throw new Error(`next dev non pronto entro ${READY_TIMEOUT_MS} ms`);
}

const tooltipDate = (chart: Locator) => chart.locator('[data-active-tooltip]').getAttribute('data-date');

async function measureChart(chart: Locator, metric: string, locale: ProbeCombo['locale']): Promise<ChartMeasure> {
  const demoChip = (await chart.getByText(demoLabel(locale), { exact: true }).count()) > 0;
  const targets = await chart.locator('button[data-slot-index]').evaluateAll((els) =>
    els.map((el) => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height }; }));
  const scroll = await chart.locator('[data-chart-scroll]').evaluate((el) => {
    const canvas = el.firstElementChild as HTMLElement | null;
    const before = el.scrollLeft;
    el.scrollLeft = el.scrollWidth;
    const scrolledTo = el.scrollLeft;
    el.scrollLeft = before;
    return {
      canvasWidth: canvas ? canvas.getBoundingClientRect().width : 0,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      overflowX: getComputedStyle(el).overflowX,
      scrolledTo,
    };
  });
  const { canvasWidth, ...rest } = scroll;
  return { metric, demoChip, targets, canvasWidth, scroll: rest };
}

/** F-1 con eventi veri di Chromium: focus+click su A, focus+click su B, hover su A, click su B, Escape. */
async function tooltipSequence(page: Page, chart: Locator, period: number): Promise<TooltipSequence> {
  const buttons = chart.locator('button[data-slot-index]');
  const a = buttons.nth(1);
  const b = buttons.nth(period === 30 ? 20 : 4); // a 30 giorni B sta fuori dalla prima schermata: click con scroll vero
  const dateA = (await a.getAttribute('data-date')) ?? '';
  const dateB = (await b.getAttribute('data-date')) ?? '';
  await a.focus(); await a.click();
  const afterClickA = await tooltipDate(chart);
  await b.focus(); await b.click();
  const afterClickB = await tooltipDate(chart);
  await a.hover();
  const afterHoverAWhilePinnedB = await tooltipDate(chart);
  await b.click();
  const afterSecondClickB = await tooltipDate(chart);
  await a.focus(); await a.click();
  const afterRepinA = await tooltipDate(chart);
  await page.keyboard.press('Escape');
  const afterEscape = await tooltipDate(chart);
  return { dateA, dateB, afterClickA, afterClickB, afterHoverAWhilePinnedB, afterSecondClickB, afterRepinA, afterEscape };
}

interface ComboResult {
  combo: string;
  locale: string;
  period: number;
  width: number;
  status: 'pass' | 'fail';
  failures: string[];
  measure: unknown;
  tooltip: TooltipSequence[];
  external: string[];
  errors: string[];
}

async function runCombo(browser: Awaited<ReturnType<typeof chromium.launch>>, base: string, c: ProbeCombo, out: string): Promise<ComboResult> {
  const context = await browser.newContext({ viewport: { width: c.width, height: 900 } });
  const page = await context.newPage();
  const origin = new URL(base).origin;
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (e) => { if (e.type() === 'error') errors.push(`console: ${e.text()}`); });
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.origin === origin) return route.continue();
    external.push(u.origin + u.pathname);
    return route.abort();
  });
  const failures: string[] = [];
  const tooltip: TooltipSequence[] = [];
  let measure: unknown = null;
  try {
    const res = await page.goto(`${origin}${trendsPath(c)}`, { waitUntil: 'networkidle' });
    const section = page.locator('[data-interactive-charts-section]');
    await section.first().waitFor({ timeout: 30_000 }).catch(() => undefined);
    const charts: ChartMeasure[] = [];
    for (const metric of ['steps', 'restingHr', 'sleepMinutes']) {
      const chart = page.locator(`[data-chart-panel-metric="${metric}"]`);
      if ((await chart.count()) !== 1) continue;
      charts.push(await measureChart(chart, metric, c.locale));
    }
    const doc = await page.evaluate(() => ({
      docScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    const pm = { status: res?.status() ?? null, sections: await section.count(), ...doc, charts };
    measure = pm;
    failures.push(...layoutFailures(c, pm));
    for (const metric of ['steps', 'restingHr']) {
      const chart = page.locator(`[data-chart-panel-metric="${metric}"]`);
      if ((await chart.count()) !== 1) { failures.push(`f1:${metric}:grafico-assente`); continue; }
      const seq = await tooltipSequence(page, chart, c.period);
      tooltip.push(seq);
      failures.push(...tooltipFailures(seq).map((x) => `${metric}:${x}`));
    }
    // Dopo la sequenza (scroll e click veri) la pagina non deve aver preso overflow.
    const after = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (after > 0) failures.push(`overflow-pagina-dopo-interazione:+${after}`);
    if (c.width !== 390) await section.first().screenshot({ path: path.join(out, `${comboName(c)}.png`) }).catch(() => undefined);
  } catch (e) {
    failures.push(`eccezione: ${(e as Error).message.split('\n')[0]}`);
  } finally {
    await context.close();
  }
  if (external.length > 0) failures.push(`richieste-esterne:${external.length}`);
  if (errors.length > 0) failures.push(`errori-browser:${errors.length}`);
  return {
    combo: comboName(c), locale: c.locale, period: c.period, width: c.width,
    status: failures.length === 0 ? 'pass' : 'fail', failures, measure, tooltip, external, errors,
  };
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2), REPO);
  fs.mkdirSync(args.out, { recursive: true });
  if (!(await portFree(args.port))) throw new Error(`Porta ${args.port} gia' occupata: non misuro un server che non ho avviato`);
  const base = `http://127.0.0.1:${args.port}`;
  const head = (() => { try { return execFileSync('git', ['--no-optional-locks', 'rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim(); } catch { return ''; } })();
  const dirty = (() => { try { return execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: REPO, encoding: 'utf8' }).trim(); } catch { return '?'; } })();
  let server: ChildProcess | null = null;
  const stop = () => { void stopServer(server).finally(() => process.exit(130)); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  const results: ComboResult[] = [];
  const startedAt = new Date().toISOString();
  try {
    server = startServer(args.port, path.join(args.out, 'dev-server.log'));
    console.log(`next dev pid=${server.pid} porta=${args.port}`);
    await waitReady(base, server);
    console.log('next dev pronto');
    const browser = await chromium.launch({ headless: true });
    try {
      for (const c of matrix()) {
        const r = await runCombo(browser, base, c, args.out);
        results.push(r);
        fs.writeFileSync(path.join(args.out, `${args.name}.${r.combo}.json`), JSON.stringify(r, null, 2));
        console.log(`${r.combo}: ${r.status.toUpperCase()}${r.failures.length ? ` ${r.failures.join(' | ')}` : ''}`);
      }
    } finally {
      await browser.close();
    }
  } finally {
    await stopServer(server);
    console.log(`next dev terminato (pid=${server?.pid ?? '-'})`);
  }
  const failed = results.filter((r) => r.status !== 'pass');
  const summary = {
    probe: 'verify-trends-charts-mounted',
    repo: REPO,
    head,
    dirty,
    base,
    startedAt,
    finishedAt: new Date().toISOString(),
    combos: results.length,
    passed: results.length - failed.length,
    failed: failed.map((r) => ({ combo: r.combo, failures: r.failures })),
    verdict: results.length === 12 && failed.length === 0 ? 'VERDE' : 'ROSSO',
    results,
  };
  fs.writeFileSync(path.join(args.out, `${args.name}.json`), JSON.stringify(summary, null, 2));
  console.log(`VERDETTO ${summary.verdict}: ${summary.passed}/${results.length}`);
  return summary.verdict === 'VERDE' ? 0 : 1;
}

main().then((code) => { process.exitCode = code; }, (e) => { console.error(e); process.exitCode = 1; });
