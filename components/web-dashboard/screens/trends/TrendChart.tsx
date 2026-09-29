import { fmtDayShort, fmtWeekdayShort, type UiLocale } from '@/lib/web-dashboard/format';

import { PatternDefs } from '../../chart-kit';
import { CHART } from '../../primitives';
import { absentRuns, labelIndexes, lineSegments, type Axis, type Run, type Slot } from './derive';

/**
 * Grafico di una serie di giorni: barre (passi, sonno, minuti attivi) oppure
 * linea a tratti (battito a riposo).
 *
 * Perche' un SVG con coordinate in PERCENTUALE e altezza in pixel: cosi' non c'e'
 * un viewBox da stirare (niente angoli ellittici, niente tratteggio deformato,
 * tacche di spessore vero) e il grafico riempie il riquadro a qualunque
 * larghezza. Le etichette degli assi sono HTML: restano nitide e leggibili.
 *
 * Linguaggio dei tre stati (chart-kit.tsx), uguale nelle barre e nella linea:
 *  - misurato: riempimento pieno (barra) o punto sulla linea;
 *  - zero misurato: una TACCA sulla linea di base (mai una barra alta zero);
 *  - parziale: righe ambra (barra) o cerchio ambra NON unito alla linea;
 *  - assente: riquadro tratteggiato a tutta altezza, un solo riquadro per tratto
 *    di giorni consecutivi. Nessuna barra, nessun punto, nessun segmento che
 *    attraversi il buco.
 * Con 90 giorni una colonna e' larga pochi pixel: niente etichette per barra,
 * solo gli estremi e qualche tacca; il valore di ogni giorno sta nella tabella.
 */
export const CHART_H = 184;
const TOP = 8;
const PLOT = 168;
const BASE = TOP + PLOT;

const pc = (n: number) => `${Number(n.toFixed(3))}%`;

export function TrendChart({
  id,
  kind,
  slots,
  axis,
  color,
  mean,
  yLabel,
  describe,
  describeRun,
  ui,
}: {
  id: string;
  kind: 'bars' | 'line';
  slots: Slot[];
  axis: Axis;
  color: string;
  mean: number | null;
  yLabel: (n: number) => string;
  /** Testo del tooltip di un giorno: valore, e se e' parziale o zero lo dice. */
  describe: (s: Slot) => string;
  describeRun: (r: Run) => string;
  /** Lingua delle date (it/en): i numeri li formatta chi chiama, nelle etichette d'asse e nei tooltip. */
  ui: UiLocale;
}) {
  const n = slots.length;
  const slotW = 100 / n;
  const span = axis.hi - axis.lo || 1;
  const yOf = (v: number) => BASE - ((v - axis.lo) / span) * PLOT;
  const cx = (i: number) => pc((i + 0.5) * slotW);
  const runs = absentRuns(slots);
  const dense = n > 31;
  const ratio = n <= 7 ? 0.5 : dense ? 0.78 : 0.68;
  const barRx = dense ? 1 : 3;
  const labels = labelIndexes(n);
  const weekly = n <= 7;

  return (
    <div data-trend-chart={kind} data-days={n} className="flex">
      <div aria-hidden="true" className="relative w-10 shrink-0" style={{ height: CHART_H }}>
        {axis.ticks.map((v) => (
          <span key={v} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-text-muted" style={{ top: yOf(v) }}>
            {yLabel(v)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <svg width="100%" height={CHART_H} focusable="false" aria-hidden="true" className="block w-full overflow-visible">
          <PatternDefs prefix={id} color={color} />

          {axis.ticks
            .filter((v) => v > axis.lo)
            .map((v) => (
              <line key={v} x1="0" x2="100%" y1={yOf(v)} y2={yOf(v)} strokeWidth="1" className="stroke-divider" />
            ))}
          <line x1="0" x2="100%" y1={BASE} y2={BASE} strokeWidth="1" strokeOpacity="0.5" className="stroke-text-muted" />

          {/* Assente: un riquadro tratteggiato per tratto. Niente barra, niente cifra, niente linea. */}
          {runs.map((r) => {
            const len = r.to - r.from + 1;
            const gap = slotW * 0.08;
            return (
              <g
                key={`absent-${r.from}`}
                data-slot-state="absent"
                data-absent-reason={r.reason}
                data-day-from={slots[r.from].date}
                data-day-to={slots[r.to].date}
                data-day-count={len}
              >
                <title>{describeRun(r)}</title>
                <rect
                  x={pc(r.from * slotW + gap)}
                  width={pc(len * slotW - 2 * gap)}
                  y={TOP}
                  height={PLOT}
                  rx={dense ? 1.5 : 4}
                  fill={`url(#${id}-absent)`}
                  strokeWidth="1.25"
                  strokeDasharray="4 3"
                  strokeOpacity="0.8"
                  className="stroke-text-muted"
                />
              </g>
            );
          })}

          {kind === 'bars'
            ? slots.map((s) => {
                if (s.state === 'absent' || s.value === null) return null;
                const w = slotW * ratio;
                const x = s.index * slotW + (slotW - w) / 2;
                if (s.state === 'measured-zero') {
                  // il dato c'e' e vale zero: una tacca sulla base, un filo piu' larga della barra
                  const tw = Math.min(slotW * 0.92, w + slotW * 0.14);
                  return (
                    <g key={s.date} data-slot-state="measured-zero" data-date={s.date}>
                      <title>{describe(s)}</title>
                      <rect data-tick x={pc(s.index * slotW + (slotW - tw) / 2)} width={pc(tw)} y={BASE - 3} height={3} rx={1.5} fill={color} />
                    </g>
                  );
                }
                const h = Math.max(4, BASE - yOf(s.value));
                const partial = s.state === 'partial';
                return (
                  <g key={s.date} data-slot-state={s.state} data-date={s.date}>
                    <title>{describe(s)}</title>
                    <rect
                      data-bar
                      x={pc(x)}
                      width={pc(w)}
                      y={BASE - h}
                      height={h}
                      rx={barRx}
                      fill={partial ? `url(#${id}-partial)` : color}
                      stroke={partial ? CHART.calories : undefined}
                      strokeWidth={partial ? 1.25 : undefined}
                    />
                  </g>
                );
              })
            : null}

          {kind === 'line'
            ? (
              <>
                {lineSegments(slots).map((seg) => (
                  <g
                    key={`seg-${seg.from}`}
                    data-segment
                    data-from={slots[seg.from].date}
                    data-to={slots[seg.to].date}
                    data-points={seg.points.length}
                  >
                    {seg.points.map((p, k) => {
                      const prev = seg.points[k - 1];
                      // a 90 giorni un cerchio per punto e' rumore: restano il punto isolato e l'ultimo
                      const dot = !dense || seg.points.length === 1 || p.index === n - 1;
                      return (
                        <g key={p.date} data-slot-state={p.state} data-date={p.date}>
                          <title>{describe(p)}</title>
                          {prev ? (
                            <line
                              data-join
                              x1={cx(prev.index)}
                              y1={yOf(prev.value as number)}
                              x2={cx(p.index)}
                              y2={yOf(p.value as number)}
                              stroke={color}
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          ) : null}
                          {dot ? <circle cx={cx(p.index)} cy={yOf(p.value as number)} r={dense ? 3 : 3.5} fill={color} strokeWidth="1.5" className="stroke-bg-card" /> : null}
                        </g>
                      );
                    })}
                  </g>
                ))}
                {slots
                  .filter((s) => s.state === 'partial' && s.value !== null)
                  .map((s) => (
                    <g key={s.date} data-slot-state="partial" data-date={s.date}>
                      <title>{describe(s)}</title>
                      <circle cx={cx(s.index)} cy={yOf(s.value as number)} r="5" fill={`url(#${id}-partial)`} stroke={CHART.calories} strokeWidth="1.75" />
                    </g>
                  ))}
              </>
            )
            : null}

          {/* Media dei soli giorni con dato: tratteggio neutro, mai colorato come una serie. */}
          {mean !== null ? (
            <line data-mean x1="0" x2="100%" y1={yOf(mean)} y2={yOf(mean)} strokeWidth="1.5" strokeDasharray="6 4" className="stroke-text-secondary" />
          ) : null}
        </svg>

        <div aria-hidden="true" className="relative mt-1 h-9">
          {labels.map((i) => {
            const date = slots[i].date;
            const atStart = !weekly && i === 0;
            const atEnd = !weekly && i === n - 1;
            const style = atStart ? { left: 0 } : atEnd ? { right: 0 } : { left: cx(i), transform: 'translateX(-50%)' };
            return (
              <span
                key={date}
                data-x-label={date}
                className={`absolute top-0 whitespace-nowrap text-[11px] leading-4 tabular-nums ${atStart ? 'text-left' : atEnd ? 'text-right' : 'text-center'} ${
                  i === n - 1 ? 'font-semibold text-text-primary' : 'text-text-muted'
                }`}
                style={style}
              >
                {weekly ? (
                  <>
                    <span className="block uppercase">{fmtWeekdayShort(date, ui)}</span>
                    <span className="block text-xs">{Number(date.slice(8, 10))}</span>
                  </>
                ) : (
                  fmtDayShort(date, ui)
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
