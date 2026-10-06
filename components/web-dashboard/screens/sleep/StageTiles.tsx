import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtMinutes, fmtPercent, type UiLocale } from '@/lib/web-dashboard/format';
import { absent, partial, presentNumber, value, type Measure } from '@/lib/web-dashboard/measure';
import type { SleepStage } from '@/lib/web-dashboard/model';

import { PatternDefs } from '../../chart-kit';
import { AbsentMark, MeasureValue, MetricTile, SectionLabel } from '../../primitives';
import { fill, type SleepCopy } from '../SleepScreen.copy';
import { STAGES, STAGE_COLOR } from './helpers';

/**
 * Le quattro fasi con i minuti e la quota della notte.
 *
 * Ogni fase e' una Measure a se': se `stageMinutes` e' un valore, una fase a 0
 * minuti e' uno ZERO MISURATO («0 min», tacca sulla barra, «Zero misurato»); se
 * `stageMinutes` e' assente, nessuna delle quattro ha un numero e lo dice UNA
 * volta sola in testa alla sezione (quattro motivi identici sarebbero rumore).
 */

/** Barra di quota (SVG, viewBox 100 x 8, si allunga con la scheda). */
function ShareBar({
  state,
  fraction,
  color,
  prefix,
}: {
  state: 'measured' | 'measured-zero' | 'partial' | 'absent';
  fraction: number;
  color: string;
  prefix: string;
}) {
  return (
    <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false" className="h-2 w-full" data-share-state={state}>
      <PatternDefs prefix={prefix} color={color} />
      {state === 'absent' ? (
        <rect x={0.5} y={0.5} width={99} height={7} rx={3.5} fill="none" stroke="#7F8AA3" strokeWidth={1.5} strokeDasharray="3 2.5" vectorEffect="non-scaling-stroke" />
      ) : (
        <>
          <rect x={0} y={0} width={100} height={8} rx={4} fill="currentColor" className="text-white/5" />
          {state === 'measured-zero' ? (
            // zero misurato: una tacca sulla linea di base, non una barra vuota
            <rect x={0} y={0} width={1.6} height={8} rx={0.8} fill={color} />
          ) : null}
          {state === 'measured' ? <rect x={0} y={0} width={Math.max(2, fraction * 100)} height={8} rx={4} fill={color} /> : null}
          {state === 'partial' ? (
            <rect
              x={0.5}
              y={0.5}
              width={Math.max(2, fraction * 100 - 1)}
              height={7}
              rx={3.5}
              fill={`url(#${prefix}-partial)`}
              stroke="#FFB547"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </>
      )}
    </svg>
  );
}

export function StageTiles({
  stageMinutes,
  c,
  copy,
  ui,
}: {
  stageMinutes: Measure<Record<SleepStage, number>>;
  c: SleepCopy;
  copy: SharedCopy;
  ui: UiLocale;
}) {
  const isAbsent = stageMinutes.kind === 'absent';
  const sum = isAbsent ? 0 : STAGES.reduce((s, k) => s + stageMinutes.value[k], 0);

  return (
    <section
      aria-labelledby="sleep-totals-title"
      data-slot="stage-totals"
      data-slot-state={isAbsent ? 'absent' : stageMinutes.kind === 'partial' ? 'partial' : 'measured'}
    >
      <SectionLabel id="sleep-totals-title">{c.totals.title}</SectionLabel>
      {stageMinutes.kind === 'absent' ? (
        <p className="mt-1 text-sm text-text-secondary">{copy.measure.absent[stageMinutes.reason]}</p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAGES.map((stage) => {
          // Una Measure per fase: stessa semantica del resto della dashboard.
          const m: Measure<number> =
            stageMinutes.kind === 'absent'
              ? absent(stageMinutes.reason)
              : stageMinutes.kind === 'partial'
                ? partial(stageMinutes.value[stage], stageMinutes.coverage, stageMinutes.note)
                : value(stageMinutes.value[stage]);
          const p = presentNumber(m);
          const fraction = p.state === 'absent' || sum <= 0 ? 0 : p.value / sum;
          const shareText =
            p.state === 'absent'
              ? null
              : fill(p.state === 'partial' ? c.totals.shareRecorded : c.totals.share, { pct: fmtPercent(fraction, ui) });

          return (
            <div key={stage} data-stage={stage}>
              <MetricTile
                label={c.stage[stage]}
                dot={STAGE_COLOR[stage]}
                footer={
                  <div className="space-y-2">
                    <ShareBar state={p.state} fraction={fraction} color={STAGE_COLOR[stage]} prefix={`sleep-share-${stage}`} />
                    <p className="min-h-[1rem]">{shareText}</p>
                  </div>
                }
              >
                {p.state === 'absent' ? (
                  <div data-measure-state="absent" className="flex h-7 items-center text-text-muted">
                    <AbsentMark />
                    <span className="sr-only">{copy.measure.noData}</span>
                  </div>
                ) : (
                  <MeasureValue m={m} locale={ui} copy={copy} size="md" format={(n) => fmtMinutes(n, ui)} />
                )}
              </MetricTile>
            </div>
          );
        })}
      </div>
    </section>
  );
}
