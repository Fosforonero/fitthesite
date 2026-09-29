import type { SharedCopy } from '@/lib/web-dashboard/copy';

import { PatternDefs } from '../../chart-kit';
import { AbsentMark, CHART } from '../../primitives';
import type { SlotState } from './derive';

const R = 52;
const CIRC = 2 * Math.PI * R;
const STROKE = 12;

/**
 * Anello dell'obiettivo. Decorativo (la cifra e la frase stanno accanto, in
 * testo): dice a colpo d'occhio in quale dei quattro stati e' il dato.
 *  - misurato: arco pieno; verde se l'obiettivo e' raggiunto;
 *  - zero misurato: anello vuoto con una tacca a ore 12 (il dato c'e', vale zero);
 *  - parziale: arco a righe ambra;
 *  - assente: anello tratteggiato e vuoto, nessuna percentuale.
 */
export function GoalRing({
  state,
  fraction,
  pctLabel,
  copy,
}: {
  state: SlotState;
  /** steps / goal; ignorato per l'assente. Oltre 1 l'arco resta pieno. */
  fraction: number;
  pctLabel: string | null;
  copy: SharedCopy;
}) {
  const frac = Math.min(1, Math.max(0, fraction));
  const met = fraction >= 1 && state !== 'absent';
  const color = state === 'partial' ? 'url(#act-ring-partial)' : met ? CHART.goal : CHART.steps;
  // Un arco lungo zero con il cap tondo disegna un punto: la «tacca» dello zero misurato.
  const isDot = frac <= 0;
  const dash = isDot ? `0.01 ${CIRC}` : `${CIRC} ${CIRC}`;
  const offset = isDot ? 0 : CIRC * (1 - frac);

  return (
    <div className="relative h-28 w-28 shrink-0 min-[420px]:h-32 min-[420px]:w-32" aria-hidden="true" data-goal-ring={state}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" focusable="false">
        <PatternDefs prefix="act-ring" color={CHART.steps} />
        {state === 'absent' ? (
          <circle cx="64" cy="64" r={R} fill="none" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" strokeOpacity="0.8" className="stroke-text-muted" />
        ) : (
          <>
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth={STROKE} className="stroke-divider" />
            {state === 'partial' ? (
              // Sotto le righe, lo stesso arco in ambra tenue: su 12 px le sole righe si leggono poco.
              <circle cx="64" cy="64" r={R} fill="none" stroke={CHART.calories} strokeOpacity="0.28" strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset} />
            ) : null}
            <circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={offset}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {state === 'absent' || pctLabel === null ? (
          <span className="text-text-muted">
            <AbsentMark />
            <span className="sr-only">{copy.measure.noData}</span>
          </span>
        ) : (
          <span className="font-display text-2xl font-semibold tracking-tightest text-text-primary">{pctLabel}</span>
        )}
      </div>
    </div>
  );
}
