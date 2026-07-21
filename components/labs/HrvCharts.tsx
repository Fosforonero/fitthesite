/**
 * Grafici del calcolatore HRV (P1.1 Fase 4): SVG puro, zero dipendenze da
 * librerie grafiche esterne (nessun bundle aggiuntivo, coerente con Fase 11
 * "nessuna libreria grafica pesante senza misurazione"). Nessuno stato,
 * nessun effect: funzioni pure di props, renderizzabili anche server-side
 * se mai richiamate fuori da un client component.
 *
 * Accessibilità (Fase 6.4): ogni grafico ha un `aria-label` riassuntivo SUL
 * contenitore SVG (`role="img"`) e un `<details>` con una tabella dati
 * equivalente sempre disponibile — mai il solo colore a veicolare il
 * significato (i punti implausibili hanno anche un indicatore di forma/
 * bordo diverso, non solo un colore diverso).
 */
import { isPhysiologicallyImplausible } from "@/lib/labs/hrv/rmssd-math";

const CHART_HEIGHT = 96;
const CHART_PADDING = 8;

function scale(values: number[], height: number, padding: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return (v: number) => height - padding - ((v - min) / range) * (height - padding * 2);
}

export function RrIntervalChart({
  intervalsMs,
  heading,
  tableToggleLabel,
  indexHeader,
  valueHeader,
  implausibleLabel,
}: {
  intervalsMs: number[];
  heading: string;
  tableToggleLabel: string;
  indexHeader: string;
  valueHeader: string;
  implausibleLabel: string;
}) {
  if (intervalsMs.length < 2) return null;
  const y = scale(intervalsMs, CHART_HEIGHT, CHART_PADDING);
  const barWidth = 100 / intervalsMs.length;
  const min = Math.min(...intervalsMs);
  const max = Math.max(...intervalsMs);

  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-wide text-text-muted mb-1.5">{heading}</p>
      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-24"
        role="img"
        aria-label={`${heading}: ${intervalsMs.length} valori, min ${Math.round(min)}ms, max ${Math.round(max)}ms`}
      >
        {intervalsMs.map((v, i) => {
          const implausible = isPhysiologicallyImplausible(v);
          const barHeight = CHART_HEIGHT - CHART_PADDING - y(v);
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.15}
              y={y(v)}
              width={barWidth * 0.7}
              height={Math.max(1, barHeight)}
              className={implausible ? "fill-warning" : "fill-brand-aqua"}
              stroke={implausible ? "currentColor" : "none"}
              strokeWidth={implausible ? 0.6 : 0}
              strokeDasharray={implausible ? "1,1" : undefined}
            />
          );
        })}
      </svg>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary">
          {tableToggleLabel}
        </summary>
        <div className="mt-2 max-h-40 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted">
                <th className="text-left font-normal">{indexHeader}</th>
                <th className="text-left font-normal">{valueHeader}</th>
              </tr>
            </thead>
            <tbody>
              {intervalsMs.map((v, i) => (
                <tr key={i} className={isPhysiologicallyImplausible(v) ? "text-warning" : "text-text-secondary"}>
                  <td>{i + 1}</td>
                  <td>
                    {Math.round(v)} ms{isPhysiologicallyImplausible(v) ? ` (${implausibleLabel})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function SuccessiveDiffChart({
  intervalsMs,
  heading,
  tableToggleLabel,
  indexHeader,
  valueHeader,
}: {
  intervalsMs: number[];
  heading: string;
  tableToggleLabel: string;
  indexHeader: string;
  valueHeader: string;
}) {
  if (intervalsMs.length < 2) return null;
  const diffs = intervalsMs.slice(1).map((v, i) => v - intervalsMs[i]);
  const maxAbs = Math.max(1, ...diffs.map((d) => Math.abs(d)));
  const zeroY = CHART_HEIGHT / 2;
  const barWidth = 100 / diffs.length;

  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-wide text-text-muted mb-1.5">{heading}</p>
      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-24"
        role="img"
        aria-label={`${heading}: ${diffs.length} differenze successive, massimo scarto ${Math.round(maxAbs)}ms`}
      >
        <line x1={0} y1={zeroY} x2={100} y2={zeroY} className="stroke-divider" strokeWidth={0.5} />
        {diffs.map((d, i) => {
          const h = (Math.abs(d) / maxAbs) * (CHART_HEIGHT / 2 - CHART_PADDING);
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.15}
              y={d >= 0 ? zeroY - h : zeroY}
              width={barWidth * 0.7}
              height={Math.max(1, h)}
              className={d >= 0 ? "fill-brand-aqua" : "fill-brand-blue"}
            />
          );
        })}
      </svg>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary">
          {tableToggleLabel}
        </summary>
        <div className="mt-2 max-h-40 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted">
                <th className="text-left font-normal">{indexHeader}</th>
                <th className="text-left font-normal">{valueHeader}</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((d, i) => (
                <tr key={i} className="text-text-secondary">
                  <td>
                    {i + 1}→{i + 2}
                  </td>
                  <td>
                    {d >= 0 ? "+" : ""}
                    {Math.round(d)} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
