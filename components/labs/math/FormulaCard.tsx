import { BlockMath } from "@/components/labs/math/BlockMath";
import { InlineMath } from "@/components/labs/math/InlineMath";

export interface FormulaVariable {
  /** Notazione LaTeX del simbolo (es. "n", "RR_i"). Renderizzata con InlineMath. */
  symbolTex: string;
  meaning: string;
  unit?: string;
}

/**
 * Presentazione completa di una formula (P1.1 Fase 3): formula in blocco +
 * spiegazione naturale (testo visibile, non solo aria-label) + definizione
 * di ogni variabile con unità + esempio numerico. Riusabile da qualunque
 * tool Labs (HRV, Sleep Efficiency, futuri) — vedi requisito Fase 1.3
 * "non hardcodare il rendering esclusivamente sul tool HRV".
 */
export function FormulaCard({
  heading,
  tex,
  ariaLabel,
  explanation,
  variables,
  example,
}: {
  heading: string;
  tex: string;
  ariaLabel: string;
  /** Spiegazione in linguaggio naturale, sempre visibile (non solo un aria-label). */
  explanation: string;
  variables: FormulaVariable[];
  example: { label: string; lines: string[] };
}) {
  return (
    <div className="rounded-card border border-divider bg-bg-card/60 p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-text-primary">{heading}</h3>

      <BlockMath tex={tex} ariaLabel={ariaLabel} />

      <p className="text-sm leading-relaxed text-text-secondary">{explanation}</p>

      {variables.length > 0 && (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {variables.map((v, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <dt className="shrink-0 text-text-primary">
                <InlineMath tex={v.symbolTex} />
              </dt>
              <dd className="text-text-secondary">
                {v.meaning}
                {v.unit ? <span className="text-text-muted"> ({v.unit})</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {example.lines.length > 0 && (
        <div className="mt-4 rounded-[10px] border border-divider/70 bg-bg/40 p-3 font-mono text-xs leading-relaxed text-text-secondary">
          <p className="mb-1 font-sans text-[11px] uppercase tracking-wide text-text-muted">{example.label}</p>
          {example.lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
