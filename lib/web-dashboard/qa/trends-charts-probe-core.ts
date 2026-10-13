/**
 * Funzioni pure della sonda browser dei grafici montati in Trend (SOLO preview locale).
 *
 * Nessun import di Playwright, di Next o di dati: argomenti, matrice e giudizio sulle
 * misure prese nel browser. La sonda vera e' verify-trends-charts-mounted.ts.
 * Nessuna rotta reale importa questo file: vive nel namespace privato della preview.
 */
import path from 'node:path';

export type ProbeLocale = 'it' | 'en';
export type ProbePeriod = 7 | 30;
export type ProbeWidth = 1440 | 390 | 320;

export interface ProbeCombo {
  locale: ProbeLocale;
  period: ProbePeriod;
  width: ProbeWidth;
}

export const LOCALES: readonly ProbeLocale[] = ['it', 'en'];
export const PERIODS: readonly ProbePeriod[] = [7, 30];
export const WIDTHS: readonly ProbeWidth[] = [1440, 390, 320];

/** Lato minimo di un target interattivo (WCAG 2.5.5 / mandato F-2). */
export const MIN_TARGET_PX = 44;
/** Colonna dell'asse Y (w-12) piu' 44 px per giorno: la larghezza minima del canvas. */
export const Y_AXIS_PX = 48;
/** Tolleranza sub-pixel del layout. Una mutazione a 40 px resta ben sotto. */
export const EPS = 0.05;

export const DEFAULT_PORT = 3191;
export const DEFAULT_OUT =
  '/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/.claude/stato-lavoro/ripartenza-sito-13ott/14-microgate/03-montaggio-sonda/probe-out';

export function matrix(): ProbeCombo[] {
  const out: ProbeCombo[] = [];
  for (const locale of LOCALES) for (const period of PERIODS) for (const width of WIDTHS) out.push({ locale, period, width });
  return out;
}

export const comboName = (c: ProbeCombo): string => `${c.locale}-${c.period}-${c.width}`;

/** URL della schermata Trend nella preview. range=30 e' il default, ma lo si scrive comunque. */
export const trendsPath = (c: Pick<ProbeCombo, 'locale' | 'period'>): string =>
  `/${c.locale}/dashboard-preview/trends?range=${c.period}`;

export const demoLabel = (locale: ProbeLocale): string => (locale === 'it' ? 'Dati dimostrativi' : 'Demo data');

export const minCanvasWidth = (period: number): number => Y_AXIS_PX + period * MIN_TARGET_PX;

/** true se `child` e' `parent` o sta sotto `parent` (percorsi assoluti risolti). */
export function isInside(parent: string, child: string): boolean {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

export interface ProbeArgs {
  out: string;
  port: number;
  name: string;
}

/** --out <dir> --port <n> --name <base>. Rifiuta argomenti sconosciuti e un --out dentro il repository. */
export function parseArgs(argv: readonly string[], repoRoot: string): ProbeArgs {
  const args: ProbeArgs = { out: DEFAULT_OUT, port: DEFAULT_PORT, name: 'report' };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key !== '--out' && key !== '--port' && key !== '--name') throw new Error(`Argomento sconosciuto: ${key}`);
    if (val === undefined || val.startsWith('--')) throw new Error(`Valore mancante per ${key}`);
    i++;
    if (key === '--out') args.out = path.resolve(val);
    else if (key === '--port') {
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1024 || n > 65535) throw new Error(`Porta non valida: ${val}`);
      args.port = n;
    } else {
      if (!/^[A-Za-z0-9._-]+$/.test(val)) throw new Error(`Nome non valido: ${val}`);
      args.name = val;
    }
  }
  if (isInside(repoRoot, args.out)) throw new Error(`--out non puo' stare dentro il repository: ${args.out}`);
  return args;
}

/** Misure di UN grafico prese nel browser (getBoundingClientRect / getComputedStyle). */
export interface ChartMeasure {
  metric: string;
  demoChip: boolean;
  targets: Array<{ width: number; height: number }>;
  canvasWidth: number;
  scroll: {
    clientWidth: number;
    scrollWidth: number;
    overflowX: string;
    /** scrollLeft dopo aver chiesto di scorrere fino in fondo: > 0 se lo scroll e' reale. */
    scrolledTo: number;
  };
}

export interface PageMeasure {
  status: number | null;
  sections: number;
  docScrollWidth: number;
  innerWidth: number;
  bodyScrollWidth: number;
  charts: ChartMeasure[];
}

/**
 * Giudizio sul layout F-2. Restituisce l'elenco dei controlli falliti (vuoto = verde).
 * Ogni controllo ha un nome stabile, cosi' il referto delle mutazioni dice QUALE regola le ha uccise.
 */
export function layoutFailures(c: ProbeCombo, m: PageMeasure): string[] {
  const f: string[] = [];
  if (m.status !== 200) f.push(`status:${m.status}`);
  if (m.sections !== 1) f.push(`pannello:${m.sections}`);
  if (m.docScrollWidth > m.innerWidth) f.push(`overflow-pagina:${m.docScrollWidth}>${m.innerWidth}`);
  if (m.bodyScrollWidth > m.innerWidth) f.push(`overflow-body:${m.bodyScrollWidth}>${m.innerWidth}`);
  if (m.charts.length !== 3) f.push(`grafici:${m.charts.length}`);
  const minCanvas = minCanvasWidth(c.period);
  for (const ch of m.charts) {
    const p = `${ch.metric}:`;
    if (!ch.demoChip) f.push(`${p}demo-assente`);
    if (ch.targets.length !== c.period) f.push(`${p}target-conteggio:${ch.targets.length}`);
    const small = ch.targets.filter((t) => t.width < MIN_TARGET_PX - EPS || t.height < MIN_TARGET_PX - EPS);
    if (small.length > 0) {
      const w = Math.min(...ch.targets.map((t) => t.width));
      const h = Math.min(...ch.targets.map((t) => t.height));
      f.push(`${p}target-sotto-44:${small.length}(min ${w.toFixed(2)}x${h.toFixed(2)})`);
    }
    if (ch.canvasWidth < minCanvas - EPS) f.push(`${p}larghezza-minima:${ch.canvasWidth.toFixed(2)}<${minCanvas}`);
    const needsScroll = minCanvas > ch.scroll.clientWidth + EPS;
    const scrollable = ch.scroll.overflowX === 'auto' || ch.scroll.overflowX === 'scroll';
    if (!scrollable) f.push(`${p}overflow-x:${ch.scroll.overflowX}`);
    if (needsScroll) {
      if (!(ch.scroll.scrollWidth > ch.scroll.clientWidth)) f.push(`${p}scroll-assente:${ch.scroll.scrollWidth}<=${ch.scroll.clientWidth}`);
      if (!(ch.scroll.scrolledTo > 0)) f.push(`${p}scroll-non-scorre:${ch.scroll.scrolledTo}`);
    }
  }
  // A 30 giorni il canvas minimo (1368 px) supera ogni viewport della matrice: lo scroll DEVE esserci.
  if (c.period === 30 && m.charts.length > 0 && m.charts.some((ch) => !(ch.scroll.scrollWidth > ch.scroll.clientWidth))) {
    f.push('30-giorni-senza-scroll-confinato');
  }
  return f;
}

/** Esito della sequenza F-1 nel browser: data del tooltip dopo ogni passo (null = chiuso). */
export interface TooltipSequence {
  dateA: string;
  dateB: string;
  afterClickA: string | null;
  afterClickB: string | null;
  afterHoverAWhilePinnedB: string | null;
  afterSecondClickB: string | null;
  afterRepinA: string | null;
  afterEscape: string | null;
}

export function tooltipFailures(s: TooltipSequence): string[] {
  const f: string[] = [];
  if (s.dateA === s.dateB) f.push('f1:giorni-uguali');
  if (s.afterClickA !== s.dateA) f.push(`f1:click-A:${s.afterClickA}`);
  if (s.afterClickB !== s.dateB) f.push(`f1:click-B-non-sposta:${s.afterClickB}`);
  if (s.afterHoverAWhilePinnedB !== s.dateB) f.push(`f1:hover-sposta-il-fissato:${s.afterHoverAWhilePinnedB}`);
  if (s.afterSecondClickB !== null) f.push(`f1:stesso-punto-non-chiude:${s.afterSecondClickB}`);
  if (s.afterRepinA !== s.dateA) f.push(`f1:rifissa-A:${s.afterRepinA}`);
  if (s.afterEscape !== null) f.push(`f1:escape-non-chiude:${s.afterEscape}`);
  return f;
}
