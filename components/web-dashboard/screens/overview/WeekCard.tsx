import { fmtDayShort, fmtInt, fmtMinutes, fmtPercent, fmtWeekdayShort } from '@/lib/web-dashboard/format';
import { presentNumber } from '@/lib/web-dashboard/measure';
import type { TrendPoint } from '@/lib/web-dashboard/model';

import { PatternDefs, StateLegend, scale } from '../../chart-kit';
import { CHART, Card, SectionLabel } from '../../primitives';

import { MEASURE_STATE, lineSegments, slotState, weekSeries, weekStats, type SlotState, type WeekMetric, type WeekStats } from './derive';
import { AbsentPanel, DetailLink, type OverviewCtx } from './parts';

// Geometria (unita' del viewBox): una colonna per giorno, la larghezza scala con la card.
const W = 280;
const H = 56;
const TOP = 6;
const BASE = 50;

interface RowSpec {
  key: 'steps' | 'sleep' | 'restingHr';
  metric: WeekMetric;
  label: string;
  color: string;
  shape: 'bars' | 'line';
  fmt: (n: number) => string;
  /** Solo per i passi: la linea dell'obiettivo. */
  goal?: number;
}

/**
 * Tre righe da 7 giorni (passi, sonno, FC a riposo), stesso linguaggio dei tre
 * stati dei grafici del kit:
 *  - misurato: barra piena (o punto sulla linea);
 *  - zero misurato: tacca sulla linea di base, MAI unita alla linea;
 *  - parziale: barra/punto a righe ambra;
 *  - assente: riquadro tratteggiato al posto della barra. La linea della FC si
 *    ferma davanti al buco e riparte dopo: non collega mai due giorni separati.
 * Il giorno mostrato e' l'ultimo e ha l'etichetta in evidenza.
 */
export function WeekCard({ ctx }: { ctx: OverviewCtx }) {
  const { data, ui, copy, oc, href } = ctx;

  const specs: RowSpec[] = [
    {
      key: 'steps',
      metric: 'steps',
      label: oc.week.rows.steps,
      color: CHART.steps,
      shape: 'bars',
      fmt: (v) => `${fmtInt(v, ui)} ${copy.units.steps}`,
      goal: data.activity.goalSteps,
    },
    { key: 'sleep', metric: 'sleepMinutes', label: oc.week.rows.sleep, color: CHART.sleep, shape: 'bars', fmt: (v) => fmtMinutes(v, ui) },
    { key: 'restingHr', metric: 'restingHr', label: oc.week.rows.restingHr, color: CHART.resting, shape: 'line', fmt: (v) => `${fmtInt(v, ui)} ${copy.units.bpm}` },
  ];
  const series = specs.map((s) => ({ spec: s, points: weekSeries(data, s.metric) }));

  // stati usati in almeno una riga: la legenda nomina solo cio' che si vede
  const used = new Set<SlotState>();
  series.forEach(({ points }) => points.forEach((p) => used.add(slotState(p.m))));
  const legendShow: Array<'measured' | 'zero' | 'partial' | 'absent' | 'goal'> = [];
  if (used.has('value')) legendShow.push('measured');
  if (used.has('zero')) legendShow.push('zero');
  if (used.has('partial')) legendShow.push('partial');
  if (used.has('absent')) legendShow.push('absent');
  const stepsPoints = series[0].points;
  if (stepsPoints.some((p) => p.m.kind !== 'absent')) legendShow.push('goal');

  return (
    <Card aria-labelledby="ov-week-title">
      <div className="flex items-start justify-between gap-4">
        <SectionLabel id="ov-week-title">{oc.week.title}</SectionLabel>
        <DetailLink href={href('trends', { range: 7 })} label={oc.week.trendsLink} context={oc.week.title} />
      </div>

      <div className="mt-4 divide-y divide-divider">
        {series.map(({ spec, points }) => (
          <WeekRow key={spec.key} spec={spec} points={points} ctx={ctx} />
        ))}
      </div>

      <div className="mt-4">
        <StateLegend copy={copy} color={CHART.steps} show={legendShow.length ? legendShow : ['absent']} />
      </div>

      <details className="group mt-1">
        <summary className="cursor-pointer rounded py-3.5 text-xs text-text-muted hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-aqua">
          {oc.week.tableLabel}
        </summary>
        <div className="mt-2 overflow-x-auto">
          <WeekTable series={series} ctx={ctx} />
        </div>
      </details>
    </Card>
  );
}

function summaryLine(spec: RowSpec, stats: WeekStats, ctx: OverviewCtx): string {
  const { oc, copy, ui } = ctx;
  if (stats.mean === null) return stats.absent === stats.total ? copy.measure.noData : oc.week.noneComplete;
  const parts = [oc.week.avg(spec.fmt(stats.mean))];
  if (stats.measured < stats.total) parts.push(oc.week.measuredOf(stats.measured, stats.total));
  if (spec.key === 'restingHr' && stats.lo !== null && stats.hi !== null && stats.lo !== stats.hi) {
    parts.push(oc.week.range(fmtInt(stats.lo, ui), fmtInt(stats.hi, ui)));
  }
  return parts.join(' · ');
}

function WeekRow({ spec, points, ctx }: { spec: RowSpec; points: TrendPoint[]; ctx: OverviewCtx }) {
  const { ui, copy, oc } = ctx;
  const stats = weekStats(points);
  const n = points.length;
  const allAbsent = n > 0 && stats.absent === n;
  const slot = n > 0 ? W / n : W;
  const barW = Math.min(24, slot * 0.6);
  const prefix = `ov-week-${spec.key}`;

  // Assi. Barre: da zero al massimo (o all'obiettivo). Linea: dal minimo al massimo dei giorni con dato.
  const drawable = points.flatMap((p) => (p.m.kind !== 'absent' && p.m.value !== 0 ? [p.m.value] : []));
  let y: (v: number) => number;
  if (spec.shape === 'bars') {
    const max = Math.max(1, ...points.flatMap((p) => (p.m.kind === 'absent' ? [] : [p.m.value])), spec.goal ?? 0);
    y = scale([0, max], [BASE, TOP]);
  } else {
    const lo = drawable.length ? Math.min(...drawable) : 0;
    const hi = drawable.length ? Math.max(...drawable) : 1;
    const pad = Math.max(2, (hi - lo) * 0.25);
    y = scale([lo - pad, hi + pad], [BASE - 4, TOP + 4]);
  }
  const cx = (i: number) => i * slot + slot / 2;

  const segments = spec.shape === 'line' ? lineSegments(points) : [];

  const absentNote =
    stats.absent > 0 && !allAbsent
      ? oc.week.absentDays(stats.absent, stats.absentReasons.length === 1 ? copy.measure.absent[stats.absentReasons[0]] : null)
      : null;
  const partialNote = stats.partial > 0 ? oc.week.partialDays(stats.partial) : null;

  const label = `${spec.label}: ${summaryLine(spec, stats, ctx)}`;

  return (
    <div data-week-row={spec.key} className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold text-text-primary">{spec.label}</h3>
        <p className="text-xs text-text-secondary">{summaryLine(spec, stats, ctx)}</p>
      </div>

      <div className="mt-3">
        {allAbsent ? (
          <AbsentPanel
            compact
            title={copy.measure.noData}
            reason={stats.absentReasons.length === 1 ? copy.measure.absent[stats.absentReasons[0]] : oc.week.absentDays(stats.absent, null)}
          />
        ) : (
          <>
            <svg role="img" aria-label={label} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" focusable="false">
              <PatternDefs prefix={prefix} color={spec.color} />
              <g className="text-text-muted">
                {points.map((p, i) =>
                  p.m.kind === 'absent' ? (
                    <rect
                      key={`lane-${p.date}`}
                      x={i * slot + 4}
                      y={TOP}
                      width={slot - 8}
                      height={BASE - TOP}
                      rx="3"
                      fill={`url(#${prefix}-absent)`}
                      stroke="currentColor"
                      strokeOpacity="0.7"
                      strokeWidth="1.25"
                      strokeDasharray="3 2.5"
                    />
                  ) : null,
                )}
              </g>
              <line x1="0" x2={W} y1={BASE + 1.5} y2={BASE + 1.5} className="stroke-divider" strokeWidth="1" />
              {spec.goal && spec.shape === 'bars' ? (
                <line data-goal-line="" x1="0" x2={W} y1={y(spec.goal)} y2={y(spec.goal)} stroke={CHART.goal} strokeWidth="1.5" strokeDasharray="4 3" />
              ) : null}
              {segments.map((seg) =>
                seg.length > 1 ? (
                  <path
                    key={`seg-${seg[0]}`}
                    data-line-segment=""
                    d={seg.map((i, k) => `${k === 0 ? 'M' : 'L'}${cx(i).toFixed(1)} ${y((points[i].m as { value: number }).value).toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke={spec.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null,
              )}
              {points.map((p, i) => {
                const st = slotState(p.m);
                const v = p.m.kind === 'absent' ? 0 : p.m.value;
                const title = cellText(p, spec, ctx);
                return (
                  <g key={p.date} data-slot-state={st} data-date={p.date}>
                    <title>{`${fmtDayShort(p.date, ui)}: ${title}`}</title>
                    {st === 'zero' ? (
                      <line data-tick="" x1={cx(i) - barW / 2 + 2} x2={cx(i) + barW / 2 - 2} y1={BASE - 1.5} y2={BASE - 1.5} stroke={spec.color} strokeWidth="3" strokeLinecap="round" />
                    ) : null}
                    {spec.shape === 'bars' && (st === 'value' || st === 'partial') ? (
                      <rect
                        data-bar=""
                        x={cx(i) - barW / 2}
                        y={y(v)}
                        width={barW}
                        height={Math.max(4, BASE - y(v))}
                        rx="3"
                        fill={st === 'partial' ? `url(#${prefix}-partial)` : spec.color}
                        stroke={st === 'partial' ? CHART.calories : undefined}
                        strokeWidth={st === 'partial' ? 1 : undefined}
                      />
                    ) : null}
                    {spec.shape === 'line' && (st === 'value' || st === 'partial') ? (
                      <circle
                        data-point=""
                        cx={cx(i)}
                        cy={y(v)}
                        r={st === 'partial' ? 5 : 3.5}
                        fill={st === 'partial' ? `url(#${prefix}-partial)` : spec.color}
                        stroke={st === 'partial' ? CHART.calories : undefined}
                        strokeWidth={st === 'partial' ? 1 : undefined}
                      />
                    ) : null}
                    {st === 'absent' ? <rect x={i * slot} y={TOP} width={slot} height={BASE - TOP} fill="transparent" /> : null}
                  </g>
                );
              })}
            </svg>
            <div aria-hidden="true" className="mt-1 grid text-center text-[11px] text-text-muted" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {points.map((p, i) => (
                <span key={p.date} className={i === n - 1 ? 'font-semibold text-text-primary' : ''}>
                  {fmtWeekdayShort(p.date, ui)}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {absentNote || partialNote ? (
        <p className="mt-2 text-xs text-text-muted">{[absentNote, partialNote].filter(Boolean).join(' · ')}</p>
      ) : null}
    </div>
  );
}

/** Il valore di un giorno come testo: mai «0» per un assente. */
function cellText(p: TrendPoint, spec: RowSpec, ctx: OverviewCtx): string {
  const { copy, ui } = ctx;
  const m = presentNumber(p.m);
  if (m.state === 'absent') return `${copy.measure.noData}, ${copy.measure.absent[m.reason]}`;
  if (m.state === 'partial') return `${spec.fmt(m.value)}, ${copy.measure.partialLabel} ${fmtPercent(m.coverage, ui)}`;
  if (m.state === 'measured-zero') return `${spec.fmt(0)}, ${copy.measure.zeroMeasured}`;
  return spec.fmt(m.value);
}

function WeekTable({ series, ctx }: { series: Array<{ spec: RowSpec; points: TrendPoint[] }>; ctx: OverviewCtx }) {
  const { ui, copy, oc } = ctx;
  const dates = series[0]?.points.map((p) => p.date) ?? [];
  return (
    <table className="w-full text-xs">
      <caption className="sr-only">{oc.week.tableLabel}</caption>
      <thead>
        <tr className="text-left text-text-muted">
          <th scope="col" className="py-1 pr-3 font-medium">{oc.week.th.day}</th>
          {series.map(({ spec }) => (
            <th key={spec.key} scope="col" className="py-1 pr-3 font-medium">{spec.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dates.map((date) => (
          <tr key={date} className="border-t border-divider align-top">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-text-secondary">{fmtDayShort(date, ui)}</th>
            {series.map(({ spec, points }) => {
              const p = points.find((q) => q.date === date);
              if (!p) return <td key={spec.key} className="py-1.5 pr-3 text-text-muted">{copy.measure.noData}</td>;
              const m = presentNumber(p.m);
              return (
                <td key={spec.key} data-measure-state={MEASURE_STATE[slotState(p.m)]} className={`py-1.5 pr-3 ${m.state === 'absent' ? 'text-text-muted' : 'text-text-primary'}`}>
                  {m.state === 'absent' ? (
                    <>
                      {copy.measure.noData}
                      <span className="block text-[11px]">{copy.measure.absent[m.reason]}</span>
                    </>
                  ) : (
                    <>
                      {spec.fmt(m.value)}
                      {m.state === 'measured-zero' ? <span className="block text-[11px] text-text-muted">{copy.measure.zeroMeasured}</span> : null}
                      {m.state === 'partial' ? (
                        <span className="block text-[11px] text-text-muted">
                          {copy.measure.partialLabel} {fmtPercent(m.coverage, ui)}
                        </span>
                      ) : null}
                    </>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
