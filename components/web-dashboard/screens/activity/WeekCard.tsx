import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDayShort, fmtDec, fmtInt, fmtPercent, fmtWeekdayShort } from '@/lib/web-dashboard/format';
import { value } from '@/lib/web-dashboard/measure';

import { PatternDefs, StateLegend } from '../../chart-kit';
import { CHART, Card, MeasureValue, SectionLabel } from '../../primitives';
import type { ActivityCopy } from '../ActivityScreen.copy';
import { absentRuns, countSlots, goalDays, maxOfPresent, meanOfMeasuredDays, niceTicks, type WeekDay } from './derive';
import { ChartNotes, SlotStepsCell, YAxis, pc, slotStateText, tableCls, type NoteItem } from './parts';

const PLOT_H = 140;
const TOP = 22;
const HEIGHT = TOP + PLOT_H + 4;
const BASE = TOP + PLOT_H;
const COL = 100 / 7;
/** Un tratto assente scrive il motivo dentro il riquadro solo se e' largo abbastanza. */
const RUN_LABEL_MIN = 6;

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

/** Etichetta corta sopra la barra: 8,4k. La cifra intera sta nella tabella e nel testo per gli screen reader. */
function shortSteps(n: number, lc: string): string {
  return n < 1000 ? fmtInt(n, lc) : `${fmtDec(n / 1000, lc, 1)}k`;
}

/**
 * Gli ultimi sette giorni di passi contro l'obiettivo. Stesso linguaggio dei
 * tre stati del grafico orario. Ogni giorno e' un link (44 px) fuori
 * dall'immagine del grafico, cosi' la navigazione resta raggiungibile da tastiera
 * e dagli screen reader.
 */
export function WeekCard({
  days,
  goal,
  lc,
  copy,
  t,
  href,
}: {
  days: WeekDay[];
  goal: number;
  lc: string;
  copy: SharedCopy;
  t: ActivityCopy;
  href: (date: string) => string;
}) {
  const slots = days.map((d) => d.slot);
  const counts = countSlots(slots);
  const mean = meanOfMeasuredDays(days);
  const hasGoal = goal > 0;
  const goalHit = hasGoal ? goalDays(days, goal) : 0;
  const { top, ticks } = niceTicks(Math.max(maxOfPresent(slots), hasGoal ? goal : 0));
  const hasScale = top > 0;
  const y = (v: number) => BASE - (hasScale ? (v / top) * PLOT_H : 0);
  const runs = absentRuns(slots);
  const goalText = fmtInt(goal, lc);
  const summary = t.week.summary({ ...counts, goalDays: goalHit }, goalText);

  const dayLabel = (d: WeekDay) => `${fmtWeekdayShort(d.date, lc)} ${fmtDayShort(d.date, lc)}`;
  const notes: NoteItem[] = [
    ...runs.map((r) => ({
      key: `a${r.from}`,
      order: r.from,
      kind: 'absent' as const,
      label: r.from === r.to ? dayLabel(days[r.from]) : `${fmtDayShort(days[r.from].date, lc)} - ${fmtDayShort(days[r.to].date, lc)}`,
      text: copy.measure.absent[r.reason],
    })),
    ...days
      .filter((d) => d.slot.state === 'partial')
      .map((d) => ({
        key: `p${d.date}`,
        order: d.slot.index,
        kind: 'partial' as const,
        label: dayLabel(d),
        text: `${copy.measure.partialLabel} ${fmtPercent(d.slot.coverage ?? 0, lc)}${d.slot.note ? `. ${copy.measure.partial[d.slot.note]}` : ''}`,
      })),
  ];

  const legendShow: Array<'measured' | 'zero' | 'partial' | 'absent' | 'goal'> = [];
  if (counts.measured - counts.zero > 0) legendShow.push('measured');
  if (counts.zero > 0) legendShow.push('zero');
  if (counts.partial > 0) legendShow.push('partial');
  if (counts.absent > 0) legendShow.push('absent');
  if (hasGoal) legendShow.push('goal');

  const yTicks = hasScale ? ticks : slots.some((s) => s.value !== null) ? [0] : [];

  return (
    <Card aria-labelledby="act-week-title" data-card="week-steps">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <SectionLabel id="act-week-title">{t.week.title}</SectionLabel>
          {hasGoal ? <p className="mt-1 text-sm text-text-secondary">{t.week.subtitle(goalText)}</p> : null}
        </div>
        <div data-week-average className="min-w-[8rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{t.week.average}</p>
          {mean ? (
            <>
              <MeasureValue m={value(Math.round(mean.mean))} unit={copy.units.steps} locale={lc} copy={copy} size="md" />
              <p className="mt-0.5 text-xs text-text-muted">{t.week.averageOver(mean.n)}</p>
            </>
          ) : (
            <p className="mt-1 text-xs text-text-muted">{t.week.averageNone}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex" data-chart="week-steps">
        <YAxis height={HEIGHT} ticks={yTicks} y={y} format={(n) => fmtInt(n, lc)} />
        <div className="min-w-0 flex-1">
          <svg width="100%" height={HEIGHT} role="img" aria-label={summary} focusable="false" className="block w-full overflow-visible">
            <PatternDefs prefix="act-week" color={CHART.steps} />

            {/* Il giorno mostrato ha uno sfondo appena piu' chiaro: e' quello del riepilogo in alto. */}
            {days.map((d, i) =>
              d.selected ? <rect key="sel" x={pc(i * COL + COL * 0.04)} width={pc(COL * 0.92)} y="0" height={HEIGHT} rx="10" className="fill-white/5" /> : null,
            )}

            {yTicks
              .filter((v) => v > 0)
              .map((v) => (
                <line key={v} x1="0" x2="100%" y1={y(v)} y2={y(v)} strokeWidth="1" className="stroke-divider" />
              ))}
            <line x1="0" x2="100%" y1={BASE} y2={BASE} strokeWidth="1" strokeOpacity="0.5" className="stroke-text-muted" />

            {/* Obiettivo giornaliero: tratteggio verde. */}
            {hasGoal && hasScale ? (
              <line data-goal-line x1="0" x2="100%" y1={y(goal)} y2={y(goal)} stroke={CHART.goal} strokeWidth="1.5" strokeDasharray="5 4" />
            ) : null}

            {runs.map((r) => {
              const len = r.to - r.from + 1;
              return (
                <g key={`run${r.from}`} data-chart-slot="absent" data-day-from={days[r.from].date} data-day-to={days[r.to].date} data-reason={r.reason}>
                  <title>{`${dayLabel(days[r.from])}${len > 1 ? ` - ${dayLabel(days[r.to])}` : ''}: ${copy.measure.absent[r.reason]}`}</title>
                  <rect
                    x={pc(r.from * COL + COL * 0.1)}
                    width={pc(len * COL - COL * 0.2)}
                    y={TOP}
                    height={PLOT_H}
                    rx="8"
                    fill="url(#act-week-absent)"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    strokeOpacity="0.7"
                    className="stroke-text-muted"
                  />
                  {len >= RUN_LABEL_MIN ? (
                    <text x={pc((r.from + len / 2) * COL)} y={TOP + PLOT_H / 2 + 4} textAnchor="middle" fontSize="12" className="fill-text-secondary">
                      {copy.measure.absent[r.reason]}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {days.map((d, i) => {
              const s = d.slot;
              if (s.state === 'absent' || s.value === null) return null;
              const x = pc(i * COL + COL * 0.24);
              const width = pc(COL * 0.52);
              const isTick = s.value === 0;
              const h = isTick ? 3 : Math.max(6, BASE - y(s.value));
              const fill = s.state === 'partial' ? 'url(#act-week-partial)' : CHART.steps;
              return (
                <g key={d.date} data-chart-slot={s.state} data-date={d.date} data-selected={d.selected ? 'true' : undefined} opacity={d.selected ? 1 : 0.72}>
                  <title>{`${dayLabel(d)}: ${fmtInt(s.value, lc)} ${copy.units.steps}${s.state === 'partial' ? `, ${copy.measure.partialLabel} ${fmtPercent(s.coverage ?? 0, lc)}` : isTick ? `, ${copy.measure.zeroMeasured}` : ''}`}</title>
                  <rect
                    x={x}
                    width={width}
                    y={BASE - h}
                    height={h}
                    rx={isTick ? 1.5 : 4}
                    fill={fill}
                    stroke={s.state === 'partial' ? CHART.calories : undefined}
                    strokeWidth={s.state === 'partial' ? 1.25 : undefined}
                  />
                  <text
                    x={pc((i + 0.5) * COL)}
                    y={BASE - h - 6}
                    textAnchor="middle"
                    fontSize="11"
                    className={`tabular-nums ${d.selected ? 'fill-text-primary' : 'fill-text-secondary'}`}
                  >
                    {shortSteps(s.value, lc)}
                  </text>
                </g>
              );
            })}
          </svg>

          <ol className="mt-1 grid grid-cols-7" data-week-days>
            {days.map((d) => {
              const s = d.slot;
              const spoken =
                s.state === 'absent'
                  ? copy.measure.noData
                  : s.state === 'measured-zero'
                    ? `${copy.measure.zeroMeasured}`
                    : `${fmtInt(s.value ?? 0, lc)} ${copy.units.steps}${s.state === 'partial' ? `, ${copy.measure.partialLabel}` : ''}`;
              const inner = (
                <>
                  <span className="text-[11px] uppercase tracking-wide text-text-muted">{fmtWeekdayShort(d.date, lc)}</span>
                  <span className={`text-sm tabular-nums ${d.selected ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>{Number(d.date.slice(8, 10))}</span>
                  <span className="sr-only">{`, ${spoken}`}</span>
                </>
              );
              const cls = 'flex min-h-[44px] flex-col items-center justify-center rounded-[10px]';
              return (
                <li key={d.date} data-day={d.date} data-slot-state={s.state}>
                  {d.selected ? (
                    <span aria-current="date" className={cls}>{inner}</span>
                  ) : (
                    <a href={href(d.date)} className={`${cls} hover:bg-white/5 ${focusRing}`}>{inner}</a>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="mt-3">
        <StateLegend copy={copy} color={CHART.steps} show={legendShow} />
        <ChartNotes title={t.week.notesTitle} items={notes} />
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer rounded text-xs text-text-muted hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-aqua">
          {t.week.tableLabel}
        </summary>
        <div className="mt-2">
          <div className={tableCls.wrap}>
            <table className={tableCls.table} data-table="week-steps">
              <caption className="sr-only">{t.week.tableCaption}</caption>
              <thead>
                <tr>
                  <th scope="col" className={tableCls.th}>{t.week.colDay}</th>
                  <th scope="col" className={tableCls.th}>{t.week.colSteps}</th>
                  <th scope="col" className={tableCls.th}>{t.week.colState}</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date} data-slot-state={d.slot.state} data-date={d.date} aria-current={d.selected ? 'date' : undefined}>
                    <th scope="row" className={`${tableCls.td} text-left font-medium text-text-primary`}>{dayLabel(d)}</th>
                    <SlotStepsCell s={d.slot} copy={copy} format={(n) => fmtInt(n, lc)} />
                    <td data-cell="state" className={`${tableCls.td} text-text-secondary`}>{slotStateText(d.slot, copy, lc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </Card>
  );
}
