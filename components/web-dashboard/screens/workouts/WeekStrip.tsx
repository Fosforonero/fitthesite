import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDayShort, fmtInt, fmtPercent, fmtWeekdayShort } from '@/lib/web-dashboard/format';
import { value as measured } from '@/lib/web-dashboard/measure';

import { PatternDefs, StateLegend, niceMax } from '../../chart-kit';
import { AbsentMark, CHART, Card, MeasureValue, SectionLabel } from '../../primitives';
import type { WorkoutsCopy } from '../WorkoutsScreen.copy';
import { absentRuns, countDays, maxOfPresent, meanOfMeasuredDays, type WeekDay } from './derive';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

const PLOT_H = 112;
const TOP = 22;
const BASE = TOP + PLOT_H;
const HEIGHT = BASE + 4;
const COL = 100 / 7;
/** Un tratto assente scrive il motivo dentro il riquadro solo se e' largo abbastanza per leggerlo. */
const RUN_LABEL_MIN = 5;
/** Serie del grafico: come il riquadro «Minuti attivi» della schermata Passi e attivita'. */
const COLOR = CHART.resting;

const pc = (n: number) => `${Number(n.toFixed(3))}%`;

function stateText(d: WeekDay, copy: SharedCopy, lc: string): string {
  if (d.state === 'absent') return `${copy.measure.noData}: ${copy.measure.absent[d.reason ?? 'no_samples']}`;
  if (d.state === 'measured-zero') return copy.measure.zeroMeasured;
  if (d.state === 'partial') return `${copy.measure.partialLabel} ${fmtPercent(d.coverage ?? 0, lc)}${d.note ? `: ${copy.measure.partial[d.note]}` : ''}`;
  return copy.legend.measured;
}

/**
 * Contesto della settimana: i minuti attivi degli ultimi 7 giorni. NON dice in
 * quali giorni ci sono stati allenamenti (il modello non lo sa): e' l'unico
 * contesto che i dati permettono, e la copy lo dichiara.
 *
 * Stesso linguaggio dei tre stati di chart-kit.tsx:
 *  - misurato: barra piena;
 *  - zero misurato: tacca sulla base con la cifra «0» (il dato c'e', vale zero);
 *  - parziale: righe ambra;
 *  - assente: riquadro tratteggiato, senza barra e senza cifra, unito ai vicini
 *    con lo stesso motivo. Nessuna linea scavalca un buco.
 * I giorni sono link (44 px) FUORI dall'immagine del grafico: dentro un
 * role="img" gli elementi sono presentazionali e non devono essere focalizzabili.
 */
export function WeekStrip({ days, lc, copy, t, href }: { days: WeekDay[]; lc: string; copy: SharedCopy; t: WorkoutsCopy; href: (date: string) => string }) {
  const counts = countDays(days);
  const mean = meanOfMeasuredDays(days);
  const top = niceMax(maxOfPresent(days));
  const y = (v: number) => BASE - (v / top) * PLOT_H;
  const runs = absentRuns(days);
  const summary = t.week.summary(counts);
  const dayLabel = (d: WeekDay) => `${fmtWeekdayShort(d.date, lc)} ${fmtDayShort(d.date, lc)}`;

  const legendShow: Array<'measured' | 'zero' | 'partial' | 'absent'> = [];
  if (counts.measured - counts.zero > 0) legendShow.push('measured');
  if (counts.zero > 0) legendShow.push('zero');
  if (counts.partial > 0) legendShow.push('partial');
  if (counts.absent > 0) legendShow.push('absent');

  // Dove e perche' manca qualcosa, in testo: accanto al riquadro tratteggiato, non da indovinare.
  const notes = [
    ...runs.map((r) => ({
      key: `a${r.from}`,
      order: r.from,
      kind: 'absent' as const,
      label: r.from === r.to ? dayLabel(days[r.from]) : `${fmtDayShort(days[r.from].date, lc)} - ${fmtDayShort(days[r.to].date, lc)}`,
      text: copy.measure.absent[r.reason],
    })),
    ...days
      .filter((d) => d.state === 'partial')
      .map((d) => ({
        key: `p${d.date}`,
        order: d.index,
        kind: 'partial' as const,
        label: dayLabel(d),
        text: `${copy.measure.partialLabel} ${fmtPercent(d.coverage ?? 0, lc)}${d.note ? `. ${copy.measure.partial[d.note]}` : ''}`,
      })),
  ].sort((a, b) => a.order - b.order);

  return (
    <Card aria-labelledby="wk-week-title" data-card="week-active-minutes">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-prose">
          <SectionLabel id="wk-week-title">{t.week.title}</SectionLabel>
          <p className="mt-1 text-sm text-text-secondary">{t.week.subtitle}</p>
        </div>
        <div data-week-average className="min-w-[8rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{t.week.average}</p>
          {mean ? (
            <>
              <MeasureValue m={measured(Math.round(mean.mean))} unit={copy.units.min} locale={lc} copy={copy} size="md" />
              <p className="mt-0.5 text-xs text-text-muted">{t.week.averageOver(mean.n)}</p>
            </>
          ) : (
            <p className="mt-1 text-xs text-text-muted">{t.week.averageNone}</p>
          )}
        </div>
      </div>

      <figure className="mt-4" role="group" aria-describedby="wk-week-summary" data-chart="week-active-minutes">
        <div role="img" aria-label={summary}>
          <svg width="100%" height={HEIGHT} focusable="false" className="block w-full overflow-visible">
            <PatternDefs prefix="wk-week" color={COLOR} />

            {/* Il giorno mostrato ha uno sfondo appena piu' chiaro. */}
            {days
              .filter((d) => d.selected)
              .map((d) => (
                <rect key="sel" x={pc(d.index * COL + COL * 0.04)} width={pc(COL * 0.92)} y="0" height={HEIGHT} rx="10" className="fill-white/5" />
              ))}

            <line x1="0" x2="100%" y1={BASE} y2={BASE} strokeWidth="1" strokeOpacity="0.5" className="stroke-text-muted" />

            {runs.map((r) => {
              const len = r.to - r.from + 1;
              return (
                <g key={`run${r.from}`} data-chart-slot="absent" data-slot-state="absent" data-day-from={days[r.from].date} data-day-to={days[r.to].date} data-reason={r.reason}>
                  <title>{`${dayLabel(days[r.from])}${len > 1 ? ` - ${dayLabel(days[r.to])}` : ''}: ${copy.measure.absent[r.reason]}`}</title>
                  <rect
                    x={pc(r.from * COL + COL * 0.1)}
                    width={pc(len * COL - COL * 0.2)}
                    y={TOP}
                    height={PLOT_H}
                    rx="8"
                    fill="url(#wk-week-absent)"
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

            {days.map((d) => {
              if (d.state === 'absent' || d.value === null) return null;
              const x = pc(d.index * COL + COL * 0.26);
              const width = pc(COL * 0.48);
              const isTick = d.state === 'measured-zero';
              const h = isTick ? 3 : Math.max(6, BASE - y(d.value));
              return (
                <g key={d.date} data-chart-slot={d.state} data-slot-state={d.state} data-date={d.date} opacity={d.selected ? 1 : 0.78}>
                  <title>{`${dayLabel(d)}: ${fmtInt(d.value, lc)} ${copy.units.min}${d.state === 'partial' ? `, ${copy.measure.partialLabel} ${fmtPercent(d.coverage ?? 0, lc)}` : isTick ? `, ${copy.measure.zeroMeasured}` : ''}`}</title>
                  <rect
                    data-bar={isTick ? 'tick' : d.state === 'partial' ? 'partial' : 'fill'}
                    x={x}
                    width={width}
                    y={BASE - h}
                    height={h}
                    rx={isTick ? 1.5 : 4}
                    fill={d.state === 'partial' ? 'url(#wk-week-partial)' : COLOR}
                    stroke={d.state === 'partial' ? CHART.calories : undefined}
                    strokeWidth={d.state === 'partial' ? 1.25 : undefined}
                  />
                  <text x={pc((d.index + 0.5) * COL)} y={BASE - h - 6} textAnchor="middle" fontSize="11" className={`tabular-nums ${d.selected ? 'fill-text-primary' : 'fill-text-secondary'}`}>
                    {fmtInt(d.value, lc)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <figcaption id="wk-week-summary" className="sr-only">
          {summary}
        </figcaption>
      </figure>

      <ol aria-label={t.week.daysAria} className="mt-1 grid grid-cols-7" data-week-days>
        {days.map((d) => {
          const spoken = d.state === 'absent' ? copy.measure.noData : d.state === 'measured-zero' ? copy.measure.zeroMeasured : `${fmtInt(d.value ?? 0, lc)} ${copy.units.min}${d.state === 'partial' ? `, ${copy.measure.partialLabel}` : ''}`;
          const inner = (
            <>
              <span className="text-[11px] uppercase tracking-wide text-text-muted">{fmtWeekdayShort(d.date, lc)}</span>
              <span className={`text-sm tabular-nums ${d.selected ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>{Number(d.date.slice(8, 10))}</span>
              <span className="sr-only">{`, ${spoken}`}</span>
            </>
          );
          const cls = 'flex min-h-[44px] flex-col items-center justify-center rounded';
          return (
            <li key={d.date} data-day={d.date} data-slot-state={d.state}>
              {d.selected ? (
                <span aria-current="date" className={cls}>
                  {inner}
                </span>
              ) : (
                <a href={href(d.date)} className={`${cls} hover:bg-white/5 ${focusRing}`}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 space-y-3">
        <StateLegend copy={copy} color={COLOR} show={legendShow} />
        {notes.length > 0 ? (
          <div data-week-notes>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{t.week.notesTitle}</p>
            <ul className="mt-2 space-y-1 text-xs text-text-secondary">
              {notes.map((n) => (
                <li key={n.key} data-note={n.kind} className="flex items-start gap-2">
                  <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="mt-0.5 shrink-0">
                    {n.kind === 'absent' ? (
                      <rect x="2.5" y="2.5" width="13" height="9" rx="3" fill="none" strokeWidth="1.5" strokeDasharray="3 2.5" className="stroke-text-muted" />
                    ) : (
                      <>
                        <rect x="2" y="2" width="14" height="10" rx="3" fill={CHART.calories} fillOpacity="0.14" />
                        <path d="M5 12L11 2M9 12l6-10" stroke={CHART.calories} strokeWidth="2" />
                      </>
                    )}
                  </svg>
                  <span>
                    <span className="font-medium text-text-primary">{n.label}</span>
                    {`: ${n.text}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <details className="mt-3 group">
        <summary className={`cursor-pointer rounded text-xs text-text-muted hover:text-text-secondary ${focusRing}`}>{t.week.tableLabel}</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-left text-xs" data-table="week-active-minutes">
            <caption className="sr-only">{t.week.tableCaption}</caption>
            <thead>
              <tr className="border-b border-divider text-text-muted">
                <th scope="col" className="py-2 pr-4 font-semibold">{t.week.colDay}</th>
                <th scope="col" className="py-2 pr-4 font-semibold">{t.week.colMinutes}</th>
                <th scope="col" className="py-2 font-semibold">{t.week.colState}</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date} data-slot-state={d.state} data-date={d.date} aria-current={d.selected ? 'date' : undefined} className="border-b border-divider/60 last:border-b-0">
                  <th scope="row" className="py-2 pr-4 font-medium text-text-primary">{dayLabel(d)}</th>
                  <td data-cell="minutes" className="py-2 pr-4 tabular-nums text-text-primary">
                    {d.state === 'absent' ? (
                      <span className="inline-flex items-center gap-2 text-text-muted">
                        <AbsentMark />
                        <span>{copy.measure.noData}</span>
                      </span>
                    ) : (
                      `${fmtInt(d.value ?? 0, lc)} ${copy.units.min}`
                    )}
                  </td>
                  <td data-cell="state" className="py-2 text-text-secondary">{stateText(d, copy, lc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  );
}
