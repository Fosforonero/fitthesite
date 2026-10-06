import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtInt, fmtPercent } from '@/lib/web-dashboard/format';

import { ChartFrame, PatternDefs, StateLegend } from '../../chart-kit';
import { CHART } from '../../primitives';
import type { ActivityCopy } from '../ActivityScreen.copy';
import { absentRuns, countSlots, hh, maxOfPresent, niceTicks, peakSlot, type Slot } from './derive';
import { ChartNotes, SlotStepsCell, YAxis, pc, slotStateText, tableCls, type NoteItem } from './parts';

const PLOT_H = 176;
const TOP = 10;
const AXIS_H = 26;
const HEIGHT = TOP + PLOT_H + AXIS_H;
const BASE = TOP + PLOT_H;
const SLOT_W = 100 / 24;
/** Sotto questa lunghezza un tratto assente non ha spazio per il motivo scritto: il motivo sta nell'elenco sotto il grafico. */
const RUN_LABEL_MIN = 14;

/**
 * Passi ora per ora: 24 slot, sempre. Linguaggio dei tre stati di chart-kit:
 *  - misurato: barra piena;
 *  - zero misurato: una TACCA sulla linea di base (l'orologio c'era, non ha contato passi);
 *  - parziale: barra a righe ambra (l'ora e' in corso o incompleta);
 *  - assente: nessuna barra, un riquadro tratteggiato per tutto il tratto senza dato.
 * Le coordinate orizzontali sono percentuali (nessun viewBox): il grafico
 * occupa la larghezza che ha e le etichette restano leggibili a 390 px.
 */
export function HourlyCard({ slots, lc, copy, t }: { slots: Slot[]; lc: string; copy: SharedCopy; t: ActivityCopy }) {
  const counts = countSlots(slots);
  const max = maxOfPresent(slots);
  const { top, ticks } = niceTicks(max);
  const hasScale = top > 0;
  const y = (v: number) => BASE - (hasScale ? (v / top) * PLOT_H : 0);
  const runs = absentRuns(slots);
  const peak = peakSlot(slots);
  const unit = copy.units.steps;

  // Asse Y: con almeno un dato, i tick tondi; con soli zeri, il solo «0»; senza alcun dato, niente cifre.
  const anyPresent = slots.some((s) => s.value !== null);
  const yTicks = hasScale ? ticks : anyPresent ? [0] : [];

  const notes: NoteItem[] = [
    ...runs.map((r) => ({
      key: `a${r.from}`,
      order: r.from,
      kind: 'absent' as const,
      label: r.from === r.to ? `${hh(r.from)}:00` : `${hh(r.from)}:00-${hh(r.to)}:59`,
      text: copy.measure.absent[r.reason],
    })),
    ...slots
      .filter((s) => s.state === 'partial')
      .map((s) => ({
        key: `p${s.index}`,
        order: s.index,
        kind: 'partial' as const,
        label: `${hh(s.index)}:00`,
        text: `${copy.measure.partialLabel} ${fmtPercent(s.coverage ?? 0, lc)}${s.note ? `. ${copy.measure.partial[s.note]}` : ''}`,
      })),
  ];

  const summary = t.hourly.summary(counts, peak ? { hour: `${hh(peak.index)}:00`, steps: fmtInt(peak.value ?? 0, lc) } : null);
  const legendShow: Array<'measured' | 'zero' | 'partial' | 'absent'> = [];
  if (counts.measured - counts.zero > 0) legendShow.push('measured');
  if (counts.zero > 0) legendShow.push('zero');
  if (counts.partial > 0) legendShow.push('partial');
  if (counts.absent > 0) legendShow.push('absent');

  return (
    <div data-card="hourly-steps">
      <ChartFrame
        id="act-hourly"
        title={t.hourly.title}
        subtitle={t.hourly.subtitle(counts)}
        summary={summary}
        legend={
          <>
            <StateLegend copy={copy} color={CHART.steps} show={legendShow} />
            <ChartNotes title={t.hourly.notesTitle} items={notes} />
          </>
        }
        tableLabel={t.hourly.tableLabel}
        table={
          <div className={tableCls.wrap}>
            <table className={tableCls.table} data-table="hourly-steps">
              <caption className="sr-only">{t.hourly.tableCaption}</caption>
              <thead>
                <tr>
                  <th scope="col" className={tableCls.th}>{t.hourly.colHour}</th>
                  <th scope="col" className={tableCls.th}>{t.hourly.colSteps}</th>
                  <th scope="col" className={tableCls.th}>{t.hourly.colState}</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.index} data-slot-state={s.state} data-hour={s.index}>
                    <th scope="row" className={`${tableCls.td} text-left font-medium tabular-nums text-text-primary`}>{`${hh(s.index)}:00`}</th>
                    <SlotStepsCell s={s} copy={copy} format={(n) => fmtInt(n, lc)} />
                    <td data-cell="state" className={`${tableCls.td} text-text-secondary`}>{slotStateText(s, copy, lc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      >
        <p className="mb-2 text-xs text-text-muted">{t.hourly.yAxis}</p>
        <div className="flex" data-chart="hourly-steps">
          <YAxis height={HEIGHT} ticks={yTicks} y={y} format={(n) => fmtInt(n, lc)} />
          <div className="min-w-0 flex-1">
            <svg width="100%" height={HEIGHT} focusable="false" className="block w-full overflow-visible">
              <PatternDefs prefix="act-hourly" color={CHART.steps} />

              {/* Linee guida: una per tick, la base un po' piu' marcata. */}
              {yTicks
                .filter((v) => v > 0)
                .map((v) => (
                  <line key={v} x1="0" x2="100%" y1={y(v)} y2={y(v)} strokeWidth="1" className="stroke-divider" />
                ))}
              <line x1="0" x2="100%" y1={BASE} y2={BASE} strokeWidth="1" strokeOpacity="0.5" className="stroke-text-muted" />

              {/* Un riquadro tratteggiato per ogni tratto senza dato: mai barre a zero, mai una linea che lo scavalca. */}
              {runs.map((r) => {
                const len = r.to - r.from + 1;
                return (
                  <g key={`run${r.from}`} data-chart-slot="absent" data-hour-from={r.from} data-hour-to={r.to} data-reason={r.reason}>
                    <title>{`${hh(r.from)}:00-${hh(r.to)}:59 ${copy.measure.absent[r.reason]}`}</title>
                    <rect
                      x={pc(r.from * SLOT_W + SLOT_W * 0.06)}
                      width={pc(len * SLOT_W - SLOT_W * 0.12)}
                      y={TOP}
                      height={PLOT_H}
                      rx="8"
                      fill="url(#act-hourly-absent)"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                      strokeOpacity="0.7"
                      className="stroke-text-muted"
                    />
                    {len >= RUN_LABEL_MIN ? (
                      <text x={pc((r.from + len / 2) * SLOT_W)} y={TOP + PLOT_H / 2 + 4} textAnchor="middle" fontSize="12" className="fill-text-secondary">
                        {copy.measure.absent[r.reason]}
                      </text>
                    ) : null}
                  </g>
                );
              })}

              {slots.map((s) => {
                if (s.state === 'absent' || s.value === null) return null;
                const x = pc(s.index * SLOT_W + SLOT_W * 0.16);
                const width = pc(SLOT_W * 0.68);
                const label = `${hh(s.index)}:00 ${fmtInt(s.value, lc)} ${unit}`;
                if (s.value === 0) {
                  // Tacca sulla linea di base: il dato c'e', vale zero. Piu' bassa e sottile di qualunque barra misurata.
                  return (
                    <g key={s.index} data-chart-slot={s.state} data-hour={s.index}>
                      <title>{`${label}, ${s.state === 'partial' ? copy.measure.partialLabel : copy.measure.zeroMeasured}`}</title>
                      <rect
                        x={x}
                        width={width}
                        y={BASE - 3}
                        height="3"
                        rx="1.5"
                        fill={s.state === 'partial' ? `url(#act-hourly-partial)` : CHART.steps}
                        stroke={s.state === 'partial' ? CHART.calories : undefined}
                        strokeWidth={s.state === 'partial' ? 1 : undefined}
                      />
                    </g>
                  );
                }
                // Una barra con dato non e' mai sotto i 6 px: resta distinguibile dalla tacca dello zero.
                const h = Math.max(6, BASE - y(s.value));
                return (
                  <g key={s.index} data-chart-slot={s.state} data-hour={s.index}>
                    <title>{s.state === 'partial' ? `${label}, ${copy.measure.partialLabel} ${fmtPercent(s.coverage ?? 0, lc)}` : label}</title>
                    <rect
                      x={x}
                      width={width}
                      y={BASE - h}
                      height={h}
                      rx="3"
                      fill={s.state === 'partial' ? `url(#act-hourly-partial)` : CHART.steps}
                      stroke={s.state === 'partial' ? CHART.calories : undefined}
                      strokeWidth={s.state === 'partial' ? 1.25 : undefined}
                    />
                  </g>
                );
              })}

              {/* Asse X: ogni tre ore. */}
              {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                <text key={h} x={pc((h + 0.5) * SLOT_W)} y={BASE + 18} textAnchor="middle" fontSize="11" className="fill-text-muted tabular-nums">
                  {hh(h)}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </ChartFrame>
    </div>
  );
}
