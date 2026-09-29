import { fmtInt } from '@/lib/web-dashboard/format';

import { CHART } from '../../primitives';
import type { HeartCopy } from '../HeartScreen.copy';
import { DAY_MIN, hhmm, type Axis, type SegmentPoint, type SeriesAnalysis, type WorkoutWindow } from './series';

/**
 * Grafico del giorno: 24 ore di frequenza cardiaca.
 *
 * Perche' SVG + strati HTML e non un solo SVG con `viewBox` fisso: un viewBox
 * fisso scala anche il testo, e su un telefono le etichette diventavano di 5 px.
 * Qui la LINEA e' un SVG stirato sul riquadro (viewBox in unita' di dato: x =
 * minuti, y = bpm, `vector-effect: non-scaling-stroke` tiene lo spessore in
 * pixel), mentre etichette, bande tratteggiate e assi stanno in HTML a
 * percentuale: restano nitide e leggibili a qualunque larghezza, senza
 * duplicare il grafico per ogni breakpoint.
 *
 * Linguaggio dei tre stati (chart-kit.tsx):
 *  - misurato: tratto pieno nel colore della serie, spezzato a ogni buco;
 *  - assente: banda tratteggiata a tutta altezza + striscia tratteggiata
 *    sull'asse x (`data-slot-state="absent"`), mai una linea ne' un punto a 0;
 *  - ore non ancora trascorse (solo oggi): zona neutra, diversa da un buco.
 * Non esiste il caso «parziale» in una serie da 10 minuti: la finestra ha un
 * campione oppure no. La copertura parziale sta nella barra e nei valori.
 */

// Stesso tratteggio del PatternDefs di chart-kit (righe a 45 gradi, passo 6),
// scritto come gradiente CSS perche' un pattern SVG verrebbe stirato con il grafico.
export const HATCH =
  'repeating-linear-gradient(135deg, rgba(127,138,163,0.45) 0, rgba(127,138,163,0.45) 1px, transparent 1px, transparent 6px)';

const f = (n: number) => Number(n.toFixed(2));
const xPct = (minute: number) => `${(minute / DAY_MIN) * 100}%`;

function linePath(seg: SegmentPoint[], hi: number): string {
  const pts = seg.map((p) => `${f(p.minute)} ${f(hi - p.bpm)}`);
  // un campione isolato: segmento di lunghezza zero, il cap tondo lo disegna come punto
  return pts.length === 1 ? `M${pts[0]} L${pts[0]}` : `M${pts.join(' L')}`;
}

function areaPath(seg: SegmentPoint[], hi: number, span: number): string {
  const first = seg[0];
  const last = seg[seg.length - 1];
  const pts = seg.map((p) => `${f(p.minute)} ${f(hi - p.bpm)}`).join(' L');
  return `M${f(first.minute)} ${span} L${pts} L${f(last.minute)} ${span} Z`;
}

export function HeartChart({
  lc,
  analysis,
  axis,
  resting,
  windows,
  t,
  absentLabel,
  notYetLabel,
}: {
  lc: string;
  analysis: SeriesAnalysis;
  axis: Axis;
  resting: number | null;
  windows: WorkoutWindow[];
  t: HeartCopy;
  absentLabel: string;
  notYetLabel: string;
}) {
  const { lo, hi, span } = axis;
  const yPct = (bpm: number) => `${((bpm - lo) / span) * 100}%`;
  const drawn = windows.filter((w) => w.endMin !== null && w.endMin > w.startMin);
  const xTicks = Array.from({ length: 9 }, (_, i) => i * 3); // 00, 03, ... 24

  return (
    <div data-heart-chart className="relative h-64 select-none sm:h-72 lg:h-80">
      <span className="absolute left-0 top-0 text-[11px] font-medium text-text-muted">{t.axisUnit}</span>

      {/* etichette dell'asse y */}
      <div className="absolute bottom-7 left-0 top-6 w-9" aria-hidden="true">
        {axis.ticks.map((tick) => (
          <span key={tick} className="absolute right-0 translate-y-1/2 text-[11px] tabular-nums text-text-muted" style={{ bottom: yPct(tick) }}>
            {fmtInt(tick, lc)}
          </span>
        ))}
      </div>

      {/* riquadro del tracciato: qui dentro x = minuto del giorno, y = bpm */}
      <div className="absolute bottom-7 left-10 right-3 top-6">
        {analysis.futureFromMin !== null ? (
          <div
            data-heart-future
            title={notYetLabel}
            className="absolute inset-y-0 right-0 border-l border-dashed border-text-muted/50 bg-white/[0.03]"
            style={{ left: xPct(analysis.futureFromMin) }}
          />
        ) : null}

        {drawn.map((w) => (
          <div
            key={w.id}
            data-heart-workout={w.id}
            title={`${w.title}: ${t.timeRange(hhmm(w.startMin), hhmm(w.endMin as number))}`}
            className="absolute inset-y-0 border-t-2 border-info/70 bg-info/10"
            style={{ left: xPct(w.startMin), width: `max(3px, ${xPct((w.endMin as number) - w.startMin)})` }}
          />
        ))}

        {analysis.gaps.map((g) => (
          <div
            key={g.fromMin}
            data-slot-state="absent"
            data-absent-reason="no_samples"
            data-from={hhmm(g.fromMin)}
            data-to={hhmm(g.toMin)}
            title={`${absentLabel}: ${t.timeRange(hhmm(g.fromMin), hhmm(g.toMin))}`}
            className="absolute inset-y-0 border-x border-dashed border-text-muted/50"
            style={{ left: xPct(g.fromMin), width: `max(3px, ${xPct(g.toMin - g.fromMin)})`, backgroundImage: HATCH }}
          >
            {/* la stessa banda, ripresa sull'asse x: si vede anche a colpo d'occhio dal basso */}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 border-b-2 border-dashed border-text-muted" />
          </div>
        ))}

        <svg
          viewBox={`0 0 ${DAY_MIN} ${span}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="heart-day-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={CHART.heart} stopOpacity="0.26" />
              <stop offset="1" stopColor={CHART.heart} stopOpacity="0" />
            </linearGradient>
          </defs>

          {axis.ticks.map((tick) => (
            <line
              key={tick}
              x1={0}
              x2={DAY_MIN}
              y1={hi - tick}
              y2={hi - tick}
              className={tick === lo ? 'stroke-text-muted/40' : 'stroke-divider'}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {[360, 720, 1080].map((m) => (
            <line key={m} x1={m} x2={m} y1={0} y2={span} className="stroke-divider" strokeOpacity={0.55} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}

          {resting !== null ? (
            <line data-heart-resting x1={0} x2={DAY_MIN} y1={hi - resting} y2={hi - resting} stroke={CHART.resting} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
          ) : null}

          {analysis.segments.map((seg, i) =>
            seg.length > 1 ? <path key={`a${i}`} d={areaPath(seg, hi, span)} fill="url(#heart-day-fade)" /> : null,
          )}
          {analysis.segments.map((seg, i) => (
            <path
              key={`l${i}`}
              data-slot-state="measured"
              data-points={seg.length}
              d={linePath(seg, hi)}
              fill="none"
              stroke={CHART.heart}
              strokeWidth={seg.length === 1 ? 5 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {resting !== null ? (
          <span
            className="absolute left-1.5 bg-bg-card/80 px-1 text-[11px] font-medium tabular-nums"
            style={{ bottom: `calc(${yPct(resting)} + 3px)`, color: CHART.resting }}
          >
            {t.restingLine(fmtInt(resting, lc))}
          </span>
        ) : null}
      </div>

      {/* etichette dell'asse x: ogni 3 ore, ogni 6 sul telefono */}
      <div className="absolute bottom-0 left-10 right-3 h-6" aria-hidden="true">
        {xTicks.map((h) => (
          <span
            key={h}
            className={`absolute top-1 -translate-x-1/2 text-[11px] tabular-nums text-text-muted ${h % 6 === 0 ? '' : 'hidden sm:block'}`}
            style={{ left: xPct(h * 60) }}
          >
            {hhmm(h * 60)}
          </span>
        ))}
      </div>
    </div>
  );
}
