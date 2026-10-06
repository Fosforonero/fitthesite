import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDayShort, fmtInt, fmtMinutes, fmtPercent, fmtWeekdayShort, type UiLocale } from '@/lib/web-dashboard/format';
import { partial, value, type Measure } from '@/lib/web-dashboard/measure';
import type { ScreenKey, TrendMetric, TrendPoint } from '@/lib/web-dashboard/model';
import type { PreviewParams } from '@/lib/web-dashboard/params';

import { ChartFrame, StateLegend } from '../../chart-kit';
import { Icon } from '../../Icon';
import { AbsentMark, CHART, Card, Chip, MeasureValue, SectionLabel } from '../../primitives';
import type { TrendsCopy } from '../TrendsScreen.copy';
import { TrendChart } from './TrendChart';
import {
  MIN_DAYS,
  STEP_CANDIDATES,
  barAxis,
  lineAxis,
  statsOf,
  toSlots,
  type Run,
  type SeriesStats,
  type Slot,
} from './derive';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

export interface MetricConfig {
  metric: TrendMetric;
  /** La schermata di dettaglio del giorno: il titolo della scheda porta li'. */
  screen: ScreenKey;
  kind: 'bars' | 'line';
  color: string;
}

/**
 * Tre colori distinti dentro la palette di BRAND.md (sez. 10). L'ambra e'
 * riservata al «parziale», quindi le calorie non sono candidate.
 */
export const METRICS: readonly MetricConfig[] = [
  { metric: 'steps', screen: 'activity', kind: 'bars', color: CHART.steps },
  { metric: 'sleepMinutes', screen: 'sleep', kind: 'bars', color: CHART.sleep },
  { metric: 'restingHr', screen: 'heart', kind: 'line', color: CHART.heart },
];

export interface Prepared {
  cfg: MetricConfig;
  days: TrendPoint[];
  slots: Slot[];
  stats: SeriesStats;
}

export function prepare(cfg: MetricConfig, days: TrendPoint[]): Prepared {
  const slots = toSlots(days);
  return { cfg, days, slots, stats: statsOf(days, slots) };
}

interface Fmt {
  /** Il numero, con l'unita' se serve: «8.124 passi», «7 h 12 min», «57 bpm». */
  text: (n: number) => string;
  /** Etichetta d'asse. */
  axis: (n: number) => string;
  /** Per MeasureValue: unita' separata oppure formattatore completo. */
  unit?: string;
  format: (n: number) => string;
}

function formatterFor(metric: TrendMetric, lc: string, ui: UiLocale, copy: SharedCopy): Fmt {
  if (metric === 'sleepMinutes') {
    const f = (n: number) => fmtMinutes(n, ui);
    return { text: f, format: f, axis: (n) => `${fmtInt(n / 60, lc)} h` };
  }
  const unit = metric === 'steps' ? copy.units.steps : metric === 'restingHr' ? copy.units.bpm : copy.units.min;
  // In italiano fmtInt non raggruppa i numeri a quattro cifre («8261» accanto a «12.960»): qui si raggruppa sempre.
  const f = (n: number) => new Intl.NumberFormat(lc, { maximumFractionDigits: 0, useGrouping: 'always' }).format(Math.round(n));
  return { text: (n) => `${f(n)} ${unit}`, format: f, axis: f, unit };
}

/** «Nessun campione (2), Non ancora sincronizzato (1)»: cio' che manca e perche', per numero di giorni. */
function reasonList(stats: SeriesStats, copy: SharedCopy, ui: UiLocale): string {
  return new Intl.ListFormat(ui, { style: 'long', type: 'conjunction' }).format(
    stats.absentReasons.map((r) => `${copy.measure.absent[r.reason]} (${r.count})`),
  );
}

function noteList(stats: SeriesStats, copy: SharedCopy, ui: UiLocale): string {
  return new Intl.ListFormat(ui, { style: 'long', type: 'conjunction' }).format(
    stats.partialNotes.map((r) => `${copy.measure.partial[r.note]} (${r.count})`),
  );
}

function dayLabel(date: string, ui: UiLocale): string {
  return `${fmtWeekdayShort(date, ui)} ${fmtDayShort(date, ui)}`;
}

/** Stato di un giorno a parole: la stessa frase nella tabella e nel tooltip. */
function stateText(s: Slot, copy: SharedCopy, lc: string): string {
  if (s.state === 'absent' && s.reason) return copy.measure.absent[s.reason];
  if (s.state === 'partial' && s.note) return `${copy.measure.partialLabel} ${fmtPercent(s.coverage ?? 0, lc)}, ${copy.measure.partial[s.note]}`;
  if (s.state === 'measured-zero') return copy.measure.zeroMeasured;
  return copy.legend.measured;
}

function DetailLink({ cfg, copy, t, href }: { cfg: MetricConfig; copy: SharedCopy; t: TrendsCopy; href: (s: ScreenKey, o?: Partial<PreviewParams>) => string }) {
  return (
    <a
      href={href(cfg.screen)}
      aria-label={`${t.openDetail}: ${copy.nav[cfg.screen]}`}
      data-trend-detail={cfg.screen}
      className={`-mr-2 -mt-2 inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-pill px-3 text-sm font-medium text-text-secondary hover:bg-white/5 hover:text-text-primary ${focusRing}`}
    >
      {copy.nav[cfg.screen]}
      <Icon name="chevronRight" size={16} />
    </a>
  );
}

function MeanSwatch() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="shrink-0 text-text-secondary">
      <path d="M1 7h16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}

function StatCell({ label, statId, children }: { label: string; statId: string; children: ReactNode }) {
  return (
    <div data-stat={statId} className="flex items-start justify-between gap-3 sm:block">
      <dt className="pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted sm:pt-0">{label}</dt>
      <dd className="text-right sm:mt-2 sm:text-left">{children}</dd>
    </div>
  );
}

function DataTable({ p, fmt, copy, t, lc, ui }: { p: Prepared; fmt: Fmt; copy: SharedCopy; t: TrendsCopy; lc: string; ui: UiLocale }) {
  const head = 'sticky top-0 bg-bg-card py-2 pr-4 text-left font-medium';
  return (
    <div className="max-h-72 overflow-y-auto">
      <table data-table={p.cfg.metric} className="w-full min-w-[20rem] text-left text-xs text-text-secondary">
        <caption className="sr-only">{t.table.caption}</caption>
        <thead>
          <tr className="border-b border-divider text-text-muted">
            <th scope="col" className={head}>{t.table.day}</th>
            <th scope="col" className={head}>{t.table.value}</th>
            <th scope="col" className={head}>{t.table.state}</th>
          </tr>
        </thead>
        <tbody>
          {[...p.slots].reverse().map((s) => (
            <tr key={s.date} data-slot-state={s.state} data-date={s.date} className="border-b border-divider/60">
              <th scope="row" className="whitespace-nowrap py-1.5 pr-4 text-left font-medium text-text-primary">{dayLabel(s.date, ui)}</th>
              <td data-cell="value" className="whitespace-nowrap py-1.5 pr-4 tabular-nums">
                {s.value === null ? (
                  <span className="inline-flex items-center text-text-muted">
                    <AbsentMark />
                    <span className="sr-only">{copy.measure.noData}</span>
                  </span>
                ) : (
                  fmt.text(s.value)
                )}
              </td>
              <td data-cell="state" className="py-1.5">{stateText(s, copy, lc)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Scheda con grafico: almeno MIN_DAYS giorni con dato. */
function ChartCard({
  p,
  lc,
  ui,
  copy,
  t,
  href,
}: {
  p: Prepared;
  lc: string;
  ui: UiLocale;
  copy: SharedCopy;
  t: TrendsCopy;
  href: (s: ScreenKey, o?: Partial<PreviewParams>) => string;
}) {
  const { cfg, slots, stats } = p;
  const m = t.metrics[cfg.metric];
  const fmt = formatterFor(cfg.metric, lc, ui, copy);
  const n = slots.length;
  const min = stats.min as NonNullable<SeriesStats['min']>;
  const max = stats.max as NonNullable<SeriesStats['max']>;
  const axis = cfg.kind === 'bars' ? barAxis(max.value, STEP_CANDIDATES[cfg.metric as 'steps' | 'sleepMinutes']) : lineAxis(min.value, max.value);
  const id = `trend-${cfg.metric}`;

  const describe = (s: Slot) => `${dayLabel(s.date, ui)}: ${s.value === null ? copy.measure.noData : fmt.text(s.value)}, ${stateText(s, copy, lc)}`;
  const describeRun = (r: Run) => {
    const a = p.slots[r.from].date;
    const b = p.slots[r.to].date;
    return `${r.from === r.to ? dayLabel(a, ui) : `${fmtDayShort(a, ui)} - ${fmtDayShort(b, ui)}`}: ${copy.measure.noData}, ${copy.measure.absent[r.reason]}`;
  };

  const headline = t.coverage.headline(stats.withData, stats.total);
  const absentText = stats.absents > 0 ? t.coverage.absent(stats.absents, reasonList(stats, copy, ui)) : null;
  const partialText = stats.partials > 0 ? t.coverage.partial(stats.partials, noteList(stats, copy, ui)) : null;
  const zeroText = stats.zeros > 0 ? t.coverage.zero(stats.zeros) : null;

  const summary = [
    `${m.perDay}. ${t.lastDays(n)}.`,
    `${headline}.`,
    t.summary.stats(fmt.text(stats.mean as number), fmt.text(min.value), fmt.text(max.value)),
    absentText,
    partialText,
    zeroText,
  ]
    .filter(Boolean)
    .join(' ');

  const legendShow: Array<'measured' | 'zero' | 'partial' | 'absent'> = [];
  if (stats.complete - stats.zeros > 0) legendShow.push('measured');
  if (stats.zeros > 0) legendShow.push('zero');
  if (stats.partials > 0) legendShow.push('partial');
  if (stats.absents > 0) legendShow.push('absent');

  // Un minimo o un massimo che e' un giorno parziale non e' un vero estremo: lo si dice.
  const extremeMeasure = (e: NonNullable<SeriesStats['min']>): Measure<number> =>
    e.state === 'partial' && e.note ? partial(e.value, e.coverage ?? 0, e.note) : value(e.value);

  return (
    <div data-trend-card={cfg.metric} data-trend-state="chart">
      <ChartFrame
        id={id}
        title={m.title}
        subtitle={`${m.perDay} · ${t.lastDays(n)}`}
        summary={summary}
        aside={<DetailLink cfg={cfg} copy={copy} t={t} href={href} />}
        tableLabel={t.table.label}
        table={<DataTable p={p} fmt={fmt} copy={copy} t={t} lc={lc} ui={ui} />}
        legend={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <StateLegend copy={copy} color={cfg.color} show={legendShow} />
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary">
                <li className="inline-flex items-center gap-1.5">
                  <MeanSwatch />
                  {t.meanLegend}
                </li>
              </ul>
            </div>
            {m.axisNote ? <p className="text-xs text-text-muted">{m.axisNote}</p> : null}
            {cfg.kind === 'line' && stats.partials > 0 ? <p className="text-xs text-text-muted">{t.coverage.partialNotJoined}</p> : null}

            <div data-trend-coverage className="rounded border border-divider bg-bg-elevated/60 p-4">
              <p data-coverage-headline className="font-display text-base font-semibold text-text-primary">{headline}</p>
              <div className="mt-1 space-y-1 text-sm text-text-secondary">
                {absentText ? <p data-coverage-note="absent">{absentText}</p> : null}
                {partialText ? <p data-coverage-note="partial">{partialText}</p> : null}
                {zeroText ? <p data-coverage-note="zero">{zeroText}</p> : null}
              </div>

              <dl className="mt-4 grid gap-3 border-t border-divider pt-4 sm:grid-cols-3">
                <StatCell label={t.coverage.avg} statId="avg">
                  <MeasureValue m={value(stats.mean as number)} unit={fmt.unit} locale={lc} copy={copy} size="md" format={fmt.format} />
                  <p className="mt-1 text-xs text-text-muted sm:max-w-[16ch]">{t.coverage.avgBasis(stats.withData, stats.partials)}</p>
                </StatCell>
                <StatCell label={t.coverage.min} statId="min">
                  <MeasureValue m={extremeMeasure(min)} unit={fmt.unit} locale={lc} copy={copy} size="md" format={fmt.format} />
                  <p className="mt-1 text-xs text-text-muted">{fmtDayShort(min.date, ui)}</p>
                </StatCell>
                <StatCell label={t.coverage.max} statId="max">
                  <MeasureValue m={extremeMeasure(max)} unit={fmt.unit} locale={lc} copy={copy} size="md" format={fmt.format} />
                  <p className="mt-1 text-xs text-text-muted">{fmtDayShort(max.date, ui)}</p>
                </StatCell>
              </dl>

              {cfg.metric === 'steps' ? (
                <div data-stat="total" className="mt-4 border-t border-divider pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{t.coverage.total}</p>
                  <div className="mt-2">
                    <MeasureValue m={stats.sum} unit={copy.units.steps} locale={lc} copy={copy} format={fmt.format} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {stats.sum.kind === 'partial' ? t.coverage.totalPartialBasis(stats.withData, stats.complete, stats.total) : t.coverage.totalAllDays(stats.total)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        }
      >
        <TrendChart
          id={id}
          kind={cfg.kind}
          slots={slots}
          axis={axis}
          color={cfg.color}
          mean={stats.mean}
          yLabel={fmt.axis}
          describe={describe}
          describeRun={describeRun}
          ui={ui}
        />
      </ChartFrame>
    </div>
  );
}

/** Amber a righe per la cella parziale della striscia: lo stesso tratteggio del grafico, in scala piccola. */
const STRIP_PARTIAL = `repeating-linear-gradient(135deg, ${CHART.calories} 0, ${CHART.calories} 2px, transparent 2px, transparent 5px)`;

function StripCell({ s, color }: { s: Slot; color: string }) {
  const base = 'min-w-0 flex-1 rounded-[2px]';
  if (s.state === 'absent') {
    return <span data-slot-state="absent" data-date={s.date} className={`${base} border border-dashed border-text-muted/70`} />;
  }
  if (s.state === 'measured-zero') {
    return <span data-slot-state="measured-zero" data-date={s.date} className={`${base} h-[3px] self-end`} style={{ background: color }} />;
  }
  if (s.state === 'partial') {
    return <span data-slot-state="partial" data-date={s.date} className={`${base} border`} style={{ borderColor: CHART.calories, backgroundImage: STRIP_PARTIAL }} />;
  }
  return <span data-slot-state="measured" data-date={s.date} className={base} style={{ background: color }} />;
}

/**
 * Scheda al posto del grafico quando i giorni con dato sono meno di MIN_DAYS.
 * Non disegna una linea o delle barre che suggerirebbero un andamento: mostra
 * la stessa struttura di giorni (tratteggiata dove manca il dato), dice quanti
 * giorni ci sono e perche' gli altri mancano, e riporta i pochi valori reali.
 */
function InsufficientCard({
  p,
  lc,
  ui,
  copy,
  t,
  href,
}: {
  p: Prepared;
  lc: string;
  ui: UiLocale;
  copy: SharedCopy;
  t: TrendsCopy;
  href: (s: ScreenKey, o?: Partial<PreviewParams>) => string;
}) {
  const { cfg, slots, stats } = p;
  const m = t.metrics[cfg.metric];
  const fmt = formatterFor(cfg.metric, lc, ui, copy);
  const reason = stats.dominantReason;
  const present = slots.filter((s) => s.state !== 'absent');
  const legendShow: Array<'measured' | 'zero' | 'partial' | 'absent'> = [];
  if (stats.complete - stats.zeros > 0) legendShow.push('measured');
  if (stats.zeros > 0) legendShow.push('zero');
  if (stats.partials > 0) legendShow.push('partial');
  if (stats.absents > 0) legendShow.push('absent');
  const titleId = `trend-${cfg.metric}-title`;

  return (
    <div data-trend-card={cfg.metric} data-trend-state="insufficient">
      <Card aria-labelledby={titleId}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <SectionLabel id={titleId}>{m.title}</SectionLabel>
            <p className="mt-1 text-sm text-text-secondary">{`${m.perDay} · ${t.lastDays(stats.total)}`}</p>
          </div>
          <DetailLink cfg={cfg} copy={copy} t={t} href={href} />
        </div>

        <div data-trend-insufficient data-absent-reason={reason} className="mt-4 rounded border border-dashed border-text-muted/50 p-5">
          <AbsentMark className="text-text-muted" />
          <p className="mt-3 font-display text-base font-semibold text-text-primary">{t.insufficient.title}</p>
          <div className="mt-2">
            <Chip tone="neutral">{copy.measure.absent[reason]}</Chip>
          </div>
          <p className="mt-3 text-sm text-text-secondary">{t.insufficient.need(MIN_DAYS, stats.withData, stats.total)}</p>
          <p className="mt-1 text-sm text-text-secondary">{t.insufficient.body[reason]}</p>

          <div aria-hidden="true" data-trend-strip className="mt-4 flex h-6 gap-px">
            {slots.map((s) => (
              <StripCell key={s.date} s={s} color={cfg.color} />
            ))}
          </div>
          {legendShow.length > 0 ? (
            <div className="mt-3">
              <StateLegend copy={copy} color={cfg.color} show={legendShow} />
            </div>
          ) : null}

          {present.length > 0 ? (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{t.insufficient.present}</p>
              <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                {present.map((s) => (
                  <li key={s.date} data-slot-state={s.state} data-date={s.date}>
                    <span className="font-medium text-text-primary">{fmtDayShort(s.date, ui)}</span>
                    {`: ${fmt.text(s.value as number)}`}
                    {s.state === 'measured' ? '' : `, ${stateText(s, copy, lc)}`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export function TrendCard(props: {
  p: Prepared;
  lc: string;
  ui: UiLocale;
  copy: SharedCopy;
  t: TrendsCopy;
  href: (s: ScreenKey, o?: Partial<PreviewParams>) => string;
}) {
  return props.p.stats.withData < MIN_DAYS ? <InsufficientCard {...props} /> : <ChartCard {...props} />;
}
