import { fmtInt, fmtPercent } from '@/lib/web-dashboard/format';
import type { Measure } from '@/lib/web-dashboard/measure';

import { ChartFrame, PatternDefs, StateLegend } from '../../chart-kit';
import { AbsentMark, CHART, Chip } from '../../primitives';

import { MEASURE_STATE, countSlots, peakSlot, slotState, unmeasuredRuns } from './derive';
import { AbsentPanel, DetailLink, type OverviewCtx } from './parts';

// Geometria in unita' del viewBox (24 slot da 12): la figura scala con la card.
const SLOT = 12;
const BAR_X = 2;
const BAR_W = 8;
const H = 64;
const TOP = 4;
const BASE = 58;
const AXIS_HOURS = [0, 6, 12, 18];

const hh = (h: number) => String(h).padStart(2, '0');

/**
 * Striscia oraria compatta: 24 slot, tutti e quattro gli stati del chart-kit.
 *  - misurato: barra piena; l'altezza dice quanti passi;
 *  - zero misurato: tacca sulla linea di base (l'orologio c'era e non ha contato passi);
 *  - parziale: barra a righe ambra;
 *  - assente: riquadro tratteggiato, mai una barra bassa. Le ore assenti
 *    consecutive con lo stesso motivo sono UN riquadro solo, con il motivo scritto sotto.
 */
export function HourlyStrip({ ctx }: { ctx: OverviewCtx }) {
  const { data, ui, copy, oc, href } = ctx;
  const slots = data.activity.hourlySteps;
  const n = slots.length;
  const W = n * SLOT;
  const runs = unmeasuredRuns(slots);
  const counts = countSlots(slots);
  const peak = peakSlot(slots);
  const max = Math.max(1, ...slots.map((m) => (m.kind === 'absent' ? 0 : m.value)));
  const plotH = BASE - TOP;

  const whole = runs.length === 1 && runs[0].state === 'absent' && runs[0].from === 0 && runs[0].to === n - 1 ? runs[0] : null;

  const tip = (m: Measure<number>, h: number) => {
    const t = `${hh(h)}:00`;
    if (m.kind === 'absent') return `${t}: ${copy.measure.noData}, ${copy.measure.absent[m.reason]}`;
    if (m.kind === 'partial') return `${t}: ${fmtInt(m.value, ui)} ${copy.units.steps}, ${copy.measure.partialLabel} ${fmtPercent(m.coverage, ui)}`;
    return m.value === 0 ? `${t}: 0 ${copy.units.steps}, ${copy.measure.zeroMeasured}` : `${t}: ${fmtInt(m.value, ui)} ${copy.units.steps}`;
  };

  const summary = oc.hourly.summary({
    measured: counts.value,
    zero: counts.zero,
    partial: counts.partial,
    absent: counts.absent,
    peak: peak ? `${hh(peak.hour)}:00, ${fmtInt(peak.steps, ui)} ${copy.units.steps}` : null,
  });

  // la legenda nomina solo cio' che e' disegnato: una voce senza esempio e' rumore
  const legendShow: Array<'measured' | 'zero' | 'partial' | 'absent'> = [];
  if (counts.value > 0) legendShow.push('measured');
  if (counts.zero > 0) legendShow.push('zero');
  if (counts.partial > 0) legendShow.push('partial');
  if (counts.absent > 0) legendShow.push('absent');

  const figure = whole ? (
    <AbsentPanel title={oc.hourly.allAbsent} reason={copy.measure.absent[whole.reason ?? 'no_samples']} className="min-h-[6rem]" />
  ) : (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" focusable="false">
        <PatternDefs prefix="ov-hourly" color={CHART.steps} />
        <g className="text-text-muted">
          {runs
            .filter((r) => r.state === 'absent')
            .map((r) => (
              <rect
                key={`run-${r.from}`}
                x={r.from * SLOT + 1.5}
                y={TOP}
                width={(r.to - r.from + 1) * SLOT - 3}
                height={plotH}
                rx="3"
                fill="url(#ov-hourly-absent)"
                stroke="currentColor"
                strokeOpacity="0.7"
                strokeWidth="1.25"
                strokeDasharray="3 2.5"
              />
            ))}
        </g>
        <line x1="0" x2={W} y1={BASE + 1.5} y2={BASE + 1.5} className="stroke-divider" strokeWidth="1" />
        {slots.map((m, h) => {
          const st = slotState(m);
          const x = h * SLOT;
          const barH = m.kind === 'absent' ? 0 : Math.max(5, (m.value / max) * plotH);
          return (
            <g key={h} data-slot-state={st} data-hour={h}>
              <title>{tip(m, h)}</title>
              {st === 'value' ? <rect data-bar="" x={x + BAR_X} y={BASE - barH} width={BAR_W} height={barH} rx="2" fill={CHART.steps} /> : null}
              {st === 'zero' ? (
                <line data-tick="" x1={x + BAR_X + 1.5} x2={x + BAR_X + BAR_W - 1.5} y1={BASE - 1.5} y2={BASE - 1.5} stroke={CHART.steps} strokeWidth="3" strokeLinecap="round" />
              ) : null}
              {st === 'partial' ? (
                <rect data-bar="" x={x + BAR_X} y={BASE - barH} width={BAR_W} height={barH} rx="2" fill="url(#ov-hourly-partial)" stroke={CHART.calories} strokeWidth="1" />
              ) : null}
              {/* area sensibile dello slot assente: il tratteggio e' disegnato una volta per tratto */}
              {st === 'absent' ? <rect x={x} y={TOP} width={SLOT} height={plotH} fill="transparent" /> : null}
            </g>
          );
        })}
      </svg>
      <div aria-hidden="true" className="relative mt-1 h-4 text-[11px] text-text-muted">
        {AXIS_HOURS.filter((h) => h < n).map((h) => (
          <span key={h} className="absolute top-0" style={{ left: `${(h / n) * 100}%` }}>
            {hh(h)}
          </span>
        ))}
      </div>
    </>
  );

  const runList = whole ? null : (
    <ul className="mt-3 space-y-1.5 text-xs text-text-secondary">
      {runs.map((r) => {
        const range = oc.hourly.range(`${hh(r.from)}:00`, `${hh(r.to)}:59`, r.from === r.to);
        const count = r.to - r.from + 1;
        return (
          <li key={`${r.state}-${r.from}`} data-slot-run={r.state} className="flex items-start gap-2">
            {r.state === 'absent' ? (
              <AbsentMark className="mt-1 shrink-0 text-text-muted" />
            ) : (
              <span className="shrink-0">
                <Chip tone="warning">{copy.measure.partialLabel}</Chip>
              </span>
            )}
            <span>
              <span className="text-text-primary">{range}</span>
              {`, ${oc.hourly.hours(count)}: `}
              {r.state === 'absent' && r.reason ? copy.measure.absent[r.reason] : r.note ? copy.measure.partial[r.note] : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const table = whole ? undefined : (
    <table className="w-full text-xs">
      <caption className="sr-only">{oc.hourly.tableLabel}</caption>
      <thead>
        <tr className="text-left text-text-muted">
          <th scope="col" className="py-1 pr-3 font-medium">{oc.hourly.th.hour}</th>
          <th scope="col" className="py-1 pr-3 font-medium">{oc.hourly.th.steps}</th>
          <th scope="col" className="py-1 font-medium">{oc.hourly.th.state}</th>
        </tr>
      </thead>
      <tbody>
        {slots.map((m, h) => {
          const st = slotState(m);
          return (
            <tr key={h} data-measure-state={MEASURE_STATE[st]} className="border-t border-divider">
              <td className="py-1 pr-3 text-text-secondary">{hh(h)}:00</td>
              <td className={`py-1 pr-3 ${st === 'absent' ? 'text-text-muted' : 'text-text-primary'}`}>
                {m.kind === 'absent' ? copy.measure.noData : fmtInt(m.value, ui)}
              </td>
              <td className="py-1 text-text-secondary">
                {m.kind === 'absent'
                  ? copy.measure.absent[m.reason]
                  : m.kind === 'partial'
                    ? `${copy.measure.partialLabel} ${fmtPercent(m.coverage, ui)}: ${copy.measure.partial[m.note]}`
                    : m.value === 0
                      ? copy.measure.zeroMeasured
                      : copy.legend.measured}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <ChartFrame
      id="ov-hourly"
      title={oc.hourly.title}
      subtitle={peak ? oc.hourly.peak(`${hh(peak.hour)}:00`, fmtInt(peak.steps, ui)) : undefined}
      summary={summary}
      aside={<DetailLink href={href('activity')} label={oc.detail} context={oc.hourly.title} />}
      legend={
        <>
          <StateLegend copy={copy} color={CHART.steps} show={legendShow.length ? legendShow : ['absent']} />
          {runList}
        </>
      }
      table={table}
      tableLabel={oc.hourly.tableLabel}
    >
      {figure}
    </ChartFrame>
  );
}
