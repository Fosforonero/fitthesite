import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtMinutes, type UiLocale } from '@/lib/web-dashboard/format';
import type { AbsentReason } from '@/lib/web-dashboard/measure';

import { PatternDefs } from '../../chart-kit';
import { AbsentMark } from '../../primitives';
import { fill, type SleepCopy } from '../SleepScreen.copy';
import { STAGES, STAGE_COLOR, addMinutes, hhmm, hourTicks, type HypnogramLayout } from './helpers';

/**
 * Ipnogramma: quattro corsie (Svegli, REM, Leggero, Profondo) e un blocco per
 * ogni fase, posizionato per minuti sull'orario reale della notte.
 *
 * Geometria: l'SVG usa `preserveAspectRatio="none"` con viewBox 1000 x 160, cosi'
 * la larghezza segue il contenitore e l'altezza resta 160 px (1 unita' = 1 px in
 * verticale). Per questo dentro l'SVG ci sono SOLO forme (rettangoli e linee a
 * spessore costante): le etichette sono HTML e restano nitide a ogni larghezza.
 * L'intera figura e' dentro il role="img" di ChartFrame; la tabella dei dati e'
 * l'alternativa per chi non la vede.
 */
const VB_W = 1000;
const LANE_H = 40;
const BAR_H = 22;
const PLOT_H = LANE_H * STAGES.length;
const MIN_BLOCK_W = 4;

const LANE_Y = (i: number) => i * LANE_H;
const BAR_Y = (i: number) => i * LANE_H + (LANE_H - BAR_H) / 2;

export function HypnogramFigure({
  layout,
  bedtime,
  c,
  ui,
}: {
  layout: HypnogramLayout;
  bedtime: string;
  c: SleepCopy;
  ui: UiLocale;
}) {
  const { span, blocks, gaps } = layout;
  const x = (min: number) => (min / span) * VB_W;
  const ticks = hourTicks(bedtime, span);
  const laneIndex = (stage: (typeof STAGES)[number]) => STAGES.indexOf(stage);

  // Raccordi fra un blocco e il successivo: la linea a gradini classica degli ipnogrammi.
  const steps = blocks.slice(1).map((b, i) => {
    const prev = blocks[i];
    const cx = x(b.fromMin);
    return { cx, y1: BAR_Y(laneIndex(prev.stage)) + BAR_H / 2, y2: BAR_Y(laneIndex(b.stage)) + BAR_H / 2, key: `${b.fromMin}-${i}` };
  });

  return (
    <div data-slot="hypnogram" data-slot-state="measured">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3">
        <ul aria-hidden="true" className="grid h-[160px] grid-rows-4">
          {STAGES.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STAGE_COLOR[s] }} />
              {c.stage[s]}
            </li>
          ))}
        </ul>

        <div className="relative h-[160px]">
          <svg
            viewBox={`0 0 ${VB_W} ${PLOT_H}`}
            preserveAspectRatio="none"
            focusable="false"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full text-divider"
          >
            <PatternDefs prefix="sleep-hyp" color={STAGE_COLOR.deep} />
            {/* fasce alterne: aiutano a seguire la corsia con l'occhio */}
            {[0, 2].map((i) => (
              <rect key={i} x={0} y={LANE_Y(i)} width={VB_W} height={LANE_H} fill="currentColor" opacity={0.35} />
            ))}
            {ticks.map((t) => (
              <line
                key={t.at}
                x1={x(t.at)}
                x2={x(t.at)}
                y1={0}
                y2={PLOT_H}
                stroke="currentColor"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                opacity={t.labelled ? 1 : 0.5}
              />
            ))}
            {/* intervalli senza fasi: righe tratteggiate e contorno, mai «sveglio» */}
            {gaps.map((g) => (
              <rect
                key={`gap-${g.from}`}
                data-slot-state="absent"
                x={x(g.from)}
                y={1}
                width={Math.max(MIN_BLOCK_W, x(g.to) - x(g.from))}
                height={PLOT_H - 2}
                fill="url(#sleep-hyp-absent)"
                stroke="#7F8AA3"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
              >
                <title>{`${c.hypnogram.gapNote}: ${hhmm(addMinutes(bedtime, g.from))}-${hhmm(addMinutes(bedtime, g.to))}`}</title>
              </rect>
            ))}
            {steps.map((s) => (
              <line
                key={s.key}
                x1={s.cx}
                x2={s.cx}
                y1={s.y1}
                y2={s.y2}
                stroke="#7F8AA3"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                opacity={0.7}
              />
            ))}
            {blocks.map((b, i) => (
              <rect
                key={`${b.fromMin}-${i}`}
                data-stage={b.stage}
                data-slot-state="measured"
                x={x(b.fromMin)}
                y={BAR_Y(laneIndex(b.stage))}
                width={Math.max(MIN_BLOCK_W, x(b.toMin) - x(b.fromMin))}
                height={BAR_H}
                fill={STAGE_COLOR[b.stage]}
              >
                <title>{`${c.stage[b.stage]}: ${hhmm(addMinutes(bedtime, b.fromMin))}-${hhmm(addMinutes(bedtime, b.toMin))} (${fmtMinutes(b.toMin - b.fromMin, ui)})`}</title>
              </rect>
            ))}
          </svg>
        </div>

        <span aria-hidden="true" />
        <div aria-hidden="true" className="relative mt-1 h-5">
          {ticks
            .filter((t) => t.labelled)
            .map((t) => (
              <span
                key={t.at}
                className="absolute top-0 -translate-x-1/2 text-[11px] tabular-nums text-text-muted"
                style={{ left: `${(t.at / span) * 100}%` }}
              >
                {String(t.hour).padStart(2, '0')}:00
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Al posto dell'ipnogramma quando le fasi mancano: stesso ingombro (160 px) e un
 * riquadro tratteggiato. Non un grafico vuoto e non una notte «tutta sveglio»:
 * il dato non c'e', e il riquadro lo dice con il motivo.
 */
export function HypnogramPlaceholder({
  reason,
  c,
  copy,
}: {
  reason: AbsentReason;
  c: SleepCopy;
  copy: SharedCopy;
}) {
  return (
    <div
      data-slot="hypnogram"
      data-slot-state="absent"
      data-absent-reason={reason}
      className="relative grid min-h-[160px] place-items-center overflow-hidden rounded-[14px] border border-dashed border-text-muted/60 p-4"
    >
      <svg aria-hidden="true" focusable="false" className="absolute inset-0 h-full w-full">
        <PatternDefs prefix="sleep-hyp-none" color={STAGE_COLOR.deep} />
        <rect width="100%" height="100%" fill="url(#sleep-hyp-none-absent)" />
      </svg>
      <div className="relative max-w-[34rem] rounded-[14px] bg-bg-card px-4 py-3 text-center">
        <div data-measure-state="absent" className="flex items-center justify-center gap-3 text-text-muted">
          <AbsentMark />
          <span className="sr-only">{copy.measure.noData}</span>
          <span className="text-xs font-medium">{copy.measure.absent[reason]}</span>
        </div>
        <p className="mt-2 font-display text-base font-semibold text-text-primary">{c.hypnogram.unavailableTitle}</p>
        <p className="mt-1 text-sm text-text-secondary">{c.hypnogram.unavailableBody}</p>
      </div>
    </div>
  );
}

/** Tabella dei dati dell'ipnogramma: un blocco per riga, con orari reali. */
export function HypnogramTable({ layout, bedtime, c, ui }: { layout: HypnogramLayout; bedtime: string; c: SleepCopy; ui: UiLocale }): ReactNode {
  return (
    <table className="w-full min-w-[20rem] text-left text-xs text-text-secondary">
      <thead>
        <tr className="border-b border-divider text-text-muted">
          <th scope="col" className="py-2 pr-4 font-medium">{c.hypnogram.colStage}</th>
          <th scope="col" className="py-2 pr-4 font-medium">{c.hypnogram.colFrom}</th>
          <th scope="col" className="py-2 pr-4 font-medium">{c.hypnogram.colTo}</th>
          <th scope="col" className="py-2 font-medium">{c.hypnogram.colDuration}</th>
        </tr>
      </thead>
      <tbody>
        {layout.blocks.map((b, i) => (
          <tr key={`${b.fromMin}-${i}`} data-stage={b.stage} className="border-b border-divider/60">
            <th scope="row" className="py-1.5 pr-4 font-medium text-text-primary">{c.stage[b.stage]}</th>
            <td className="py-1.5 pr-4 tabular-nums">{hhmm(addMinutes(bedtime, b.fromMin))}</td>
            <td className="py-1.5 pr-4 tabular-nums">{hhmm(addMinutes(bedtime, b.toMin))}</td>
            <td className="py-1.5 tabular-nums">{fmtMinutes(b.toMin - b.fromMin, ui)}</td>
          </tr>
        ))}
        {layout.gaps.map((g) => (
          <tr key={`gap-${g.from}`} data-slot-state="absent" className="border-b border-divider/60 text-text-muted">
            <th scope="row" className="py-1.5 pr-4 font-medium">{c.hypnogram.gapNote}</th>
            <td className="py-1.5 pr-4 tabular-nums">{hhmm(addMinutes(bedtime, g.from))}</td>
            <td className="py-1.5 pr-4 tabular-nums">{hhmm(addMinutes(bedtime, g.to))}</td>
            <td className="py-1.5 tabular-nums">{fmtMinutes(g.to - g.from, ui)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Frase per lo screen reader: cosa mostra l'ipnogramma, con i minuti per fase. */
export function hypnogramSummary(layout: HypnogramLayout, bedtime: string, wakeup: string, c: SleepCopy, ui: UiLocale): string {
  const list = STAGES.map((s) => `${c.stage[s]} ${fmtMinutes(layout.minutesByStage[s], ui)}`).join(', ');
  return fill(c.hypnogram.summary, { bed: hhmm(bedtime), wake: hhmm(wakeup), list });
}
