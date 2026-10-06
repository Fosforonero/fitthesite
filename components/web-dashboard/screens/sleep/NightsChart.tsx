import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtDayLong, fmtDayShort, fmtMinutes, fmtPercent, fmtWeekdayShort, type UiLocale } from '@/lib/web-dashboard/format';
import { presentNumber, type Measure } from '@/lib/web-dashboard/measure';
import type { ScreenKey, TrendPoint } from '@/lib/web-dashboard/model';
import type { PreviewParams } from '@/lib/web-dashboard/params';

import { ChartFrame, PatternDefs, StateLegend } from '../../chart-kit';
import { AbsentMark, CHART } from '../../primitives';
import { fill, type SleepCopy } from '../SleepScreen.copy';
import { REFERENCE_MINUTES, fmtHM, nightSlotState, nightsAxisTop, type NightSlotState } from './helpers';

/**
 * Ultime 7 notti (data.trends, metrica sleepMinutes), piu' recente a destra.
 *
 * Quattro stati nella stessa colonna, riconoscibili senza leggere i numeri:
 *  - misurato: barra piena;
 *  - zero misurato: tacca sulla linea di base (la fonte ha misurato zero sonno);
 *  - parziale: barra a righe ambra, alta quanto il valore, mai un totale pieno;
 *  - assente: colonna intera tratteggiata e senza cifra. Nessuna barra a zero e
 *    nessuna linea che unisce due notti attraverso il buco.
 *
 * Come nell'ipnogramma l'SVG contiene solo forme (preserveAspectRatio="none",
 * altezza fissa 176 px); assi, giorni e valori sono HTML. Ogni giorno e' un link
 * alla stessa schermata su quel giorno, alto almeno 44 px.
 */
const VB_W = 700;
const COL_W = VB_W / 7;
const PLOT_H = 176;
const BAR_W = 40;

const STATE_LABEL_KEY: Record<NightSlotState, 'measured' | 'zero' | 'partial' | 'absent'> = {
  measured: 'measured',
  'measured-zero': 'zero',
  partial: 'partial',
  absent: 'absent',
};

/** Le 7 notti che finiscono nei 7 giorni fino al selezionato compreso. */
export function lastSevenNights(days: TrendPoint[], date: string): TrendPoint[] {
  const i = days.findIndex((d) => d.date === date);
  const end = i === -1 ? days.length : i + 1;
  return days.slice(Math.max(0, end - 7), end);
}

export function NightsChart({
  days,
  date,
  selected: selectedNight,
  c,
  copy,
  ui,
  href,
}: {
  days: TrendPoint[];
  date: string;
  /**
   * La notte del giorno selezionato, letta dalla stessa fonte dell'intestazione
   * (data.sleep.night). Sostituisce l'ultimo punto della serie: la scheda in alto e la
   * barra a destra non possono dare due durate diverse per la stessa notte.
   */
  selected: Measure<number>;
  c: SleepCopy;
  copy: SharedCopy;
  ui: UiLocale;
  href: (screen: ScreenKey, overrides?: Partial<PreviewParams>) => string;
}) {
  const nights = lastSevenNights(days, date).map((n) => (n.date === date ? { ...n, m: selectedNight } : n));
  const states = nights.map((n) => nightSlotState(n.m));
  const count = (s: NightSlotState) => states.filter((x) => x === s).length;
  const withNumber = nights.flatMap((n) => (n.m.kind === 'absent' ? [] : [n.m.value]));
  const top = nightsAxisTop(Math.max(0, ...withNumber));

  // Media: solo notti COMPLETE (kind 'value', zero compreso: e' un dato). Le assenti non
  // diluiscono la media e le parziali non la abbassano con un totale incompleto.
  const complete = nights.flatMap((n) => (n.m.kind === 'value' ? [n.m.value] : []));
  const average = complete.length > 0 ? complete.reduce((s, v) => s + v, 0) / complete.length : null;

  const y = (min: number) => PLOT_H - (min / top) * PLOT_H;
  const ticks = [0, 1, 2, 3].map((i) => (i * top) / 3).filter((v) => v > 0);

  const countText = [
    count('measured') + count('measured-zero') > 0 ? fill(c.nights.countMeasured, { n: count('measured') + count('measured-zero') }) : null,
    count('partial') > 0 ? fill(c.nights.countPartial, { n: count('partial') }) : null,
    count('absent') > 0 ? fill(c.nights.countAbsent, { n: count('absent') }) : null,
  ]
    .filter(Boolean)
    .join(', ');

  const stateShown = (['measured', 'measured-zero', 'partial', 'absent'] as const).filter((s) => count(s) > 0);
  const legendShow = stateShown.map((s) => STATE_LABEL_KEY[s]);

  const dayLabel = (d: string) => fmtDayLong(d, ui);

  const tableRows = nights.map((n, i) => {
    const p = presentNumber(n.m);
    return { n, p, state: states[i] };
  });

  const noNights = withNumber.length === 0;

  return (
    <div data-slot="nights" data-slot-state={noNights ? 'absent' : 'measured'}>
      <ChartFrame
        id="sleep-nights"
        title={c.nights.title}
        subtitle={fill(c.nights.subtitle, { day: fmtDayShort(date, ui) })}
        summary={fill(c.nights.summary, { counts: countText })}
        aside={
          <div className="shrink-0 text-right" data-slot="nights-average">
            <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-text-muted">{c.nights.average}</p>
            {average === null ? (
              <div data-measure-state="absent" className="mt-1 flex flex-col items-end text-text-muted">
                <AbsentMark />
                <span className="sr-only">{copy.measure.noData}</span>
                <span className="mt-1 text-xs">{c.nights.averageNone}</span>
              </div>
            ) : (
              <>
                <p data-measure-state="measured" className="mt-1 font-display text-xl font-semibold tracking-tightest text-text-primary">
                  {fmtMinutes(average, ui)}
                </p>
                <p className="text-xs text-text-muted">{fill(c.nights.averageBasis, { n: complete.length, total: nights.length })}</p>
              </>
            )}
          </div>
        }
        legend={
          noNights ? null : (
            <div className="space-y-2">
              <StateLegend copy={copy} color={CHART.sleep} show={legendShow} />
              <p className="inline-flex items-center gap-1.5 text-xs text-text-secondary" data-slot="reference-legend">
                <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="shrink-0 text-text-secondary">
                  <path d="M1 7h16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
                {c.nights.reference}
              </p>
            </div>
          )
        }
        tableLabel={c.nights.tableLabel}
        table={
          noNights ? undefined : (
            <table className="w-full min-w-[20rem] text-left text-xs text-text-secondary">
              <thead>
                <tr className="border-b border-divider text-text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">{c.nights.colNight}</th>
                  <th scope="col" className="py-2 pr-4 font-medium">{c.nights.colDuration}</th>
                  <th scope="col" className="py-2 font-medium">{c.nights.colState}</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(({ n, p, state }) => (
                  <tr key={n.date} data-night={n.date} data-slot-state={state} className="border-b border-divider/60">
                    <th scope="row" className="py-1.5 pr-4 font-medium text-text-primary">{dayLabel(n.date)}</th>
                    <td className="py-1.5 pr-4 tabular-nums">
                      {p.state === 'absent' ? copy.measure.noData : fmtMinutes(p.value, ui)}
                    </td>
                    <td className="py-1.5">
                      {p.state === 'absent'
                        ? copy.measure.absent[p.reason]
                        : p.state === 'partial'
                          ? `${copy.measure.partialLabel} ${fmtPercent(p.coverage, ui)}, ${copy.measure.partial[p.note]}`
                          : p.state === 'measured-zero'
                            ? copy.measure.zeroMeasured
                            : copy.legend.measured}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      >
        {noNights ? (
          <NightsEmpty nights={nights} c={c} copy={copy} />
        ) : (
          <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
            <div aria-hidden="true" className="relative" style={{ height: PLOT_H }}>
              {ticks.map((v) => (
                <span
                  key={v}
                  className="absolute right-0 text-[11px] tabular-nums text-text-muted"
                  style={{ bottom: `${(v / top) * 100}%`, transform: 'translateY(50%)' }}
                >
                  {v / 60} h
                </span>
              ))}
              <span
                className="absolute right-0 rounded bg-bg-card px-0.5 text-[11px] font-semibold tabular-nums text-text-secondary"
                style={{ bottom: `${(REFERENCE_MINUTES / top) * 100}%`, transform: 'translateY(50%)' }}
              >
                7 h
              </span>
            </div>

            <div className="relative" style={{ height: PLOT_H }}>
              <svg
                viewBox={`0 0 ${VB_W} ${PLOT_H}`}
                preserveAspectRatio="none"
                focusable="false"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full text-divider"
              >
                <PatternDefs prefix="sleep-nights" color={CHART.sleep} />
                {ticks.map((v) => (
                  <line key={v} x1={0} x2={VB_W} y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                ))}
                <line x1={0} x2={VB_W} y1={PLOT_H - 0.5} y2={PLOT_H - 0.5} stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />

                {nights.map((n, i) => {
                  const state = states[i];
                  const cx = i * COL_W + COL_W / 2;
                  const x0 = cx - BAR_W / 2;
                  const selected = i === nights.length - 1;
                  const common = { 'data-night': n.date, 'data-slot-state': state } as const;
                  if (state === 'absent') {
                    // colonna intera: il dato NON c'e', e il riquadro non suggerisce nessuna altezza
                    return (
                      <rect
                        key={n.date}
                        {...common}
                        x={cx - COL_W / 2 + 12}
                        y={1}
                        width={COL_W - 24}
                        height={PLOT_H - 2}
                        fill="url(#sleep-nights-absent)"
                        stroke="#7F8AA3"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  }
                  const p = presentNumber(n.m);
                  const value = p.state === 'absent' ? 0 : p.value;
                  if (state === 'measured-zero') {
                    // tacca sulla linea di base: la fonte ha misurato zero, il dato c'e'
                    return (
                      <line
                        key={n.date}
                        {...common}
                        x1={x0}
                        x2={x0 + BAR_W}
                        y1={PLOT_H - 2}
                        y2={PLOT_H - 2}
                        stroke={CHART.sleep}
                        strokeWidth={4}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  }
                  const h = (value / top) * PLOT_H;
                  return state === 'partial' ? (
                    <rect
                      key={n.date}
                      {...common}
                      x={x0}
                      y={PLOT_H - h}
                      width={BAR_W}
                      height={h}
                      rx={3}
                      fill="url(#sleep-nights-partial)"
                      stroke={CHART.calories}
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : (
                    <rect
                      key={n.date}
                      {...common}
                      x={x0}
                      y={PLOT_H - h}
                      width={BAR_W}
                      height={h}
                      rx={3}
                      fill={CHART.sleep}
                      fillOpacity={selected ? 1 : 0.6}
                    />
                  );
                })}

                {/* riferimento a 7 h: linea tratteggiata neutra, NON verde (il verde e' l'obiettivo) */}
                <line
                  data-reference="7h"
                  x1={0}
                  x2={VB_W}
                  y1={y(REFERENCE_MINUTES)}
                  y2={y(REFERENCE_MINUTES)}
                  stroke="currentColor"
                  className="text-text-secondary"
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            <span aria-hidden="true" />
            <ol className="mt-1 grid grid-cols-7">
              {nights.map((n, i) => {
                const state = states[i];
                const selected = i === nights.length - 1;
                const p = presentNumber(n.m);
                const text =
                  p.state === 'absent'
                    ? `${dayLabel(n.date)}: ${copy.measure.noData}, ${copy.measure.absent[p.reason]}`
                    : p.state === 'partial'
                      ? `${dayLabel(n.date)}: ${fmtMinutes(p.value, ui)}, ${copy.measure.partialLabel} ${fmtPercent(p.coverage, ui)}`
                      : `${dayLabel(n.date)}: ${fmtMinutes(p.value, ui)}`;
                return (
                  <li key={n.date} className="min-w-0">
                    <a
                      href={href('sleep', { day: n.date })}
                      aria-label={text}
                      aria-current={selected ? 'date' : undefined}
                      data-night-link={n.date}
                      className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-[14px] px-0.5 py-1.5 text-center hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua ${selected ? 'bg-white/5' : ''}`}
                    >
                      <span className={`text-[11px] leading-tight ${selected ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
                        {fmtWeekdayShort(n.date, ui)}
                      </span>
                      <span className={`text-[11px] leading-tight tabular-nums ${selected ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
                        {Number(n.date.slice(8))}
                      </span>
                      {p.state === 'absent' ? (
                        <span data-measure-state="absent" className="mt-0.5 text-text-muted">
                          <AbsentMark className="h-2 w-5" />
                        </span>
                      ) : (
                        <span
                          data-measure-state={state}
                          className={`mt-0.5 whitespace-nowrap text-[11px] font-medium tabular-nums sm:text-xs ${state === 'partial' ? 'text-warning' : 'text-text-primary'}`}
                        >
                          {fmtHM(p.value)}
                        </span>
                      )}
                      {selected ? <span className="sr-only">{c.nights.selected}</span> : null}
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </ChartFrame>
    </div>
  );
}

/** Nessuna delle 7 notti ha un dato: un solo riquadro tratteggiato con il motivo, non sette colonne vuote. */
function NightsEmpty({ nights, c, copy }: { nights: TrendPoint[]; c: SleepCopy; copy: SharedCopy }) {
  const last = nights[nights.length - 1]?.m;
  const reason = last && last.kind === 'absent' ? last.reason : 'no_samples';
  return (
    <div
      data-slot-state="absent"
      data-absent-reason={reason}
      className="grid min-h-[176px] place-items-center rounded-[14px] border border-dashed border-text-muted/60 p-4 text-center"
    >
      <div>
        <div data-measure-state="absent" className="flex items-center justify-center gap-3 text-text-muted">
          <AbsentMark />
          <span className="sr-only">{copy.measure.noData}</span>
          <span className="text-xs font-medium">{copy.measure.absent[reason]}</span>
        </div>
        <p className="mt-2 text-sm text-text-secondary">{c.nights.emptyTitle}</p>
      </div>
    </div>
  );
}
