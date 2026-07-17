"use client";

import { useState } from "react";

/**
 * "Come citare questo strumento": copia SOLO il testo di citazione
 * (nome/titolo/canonical/versione/data), mai dati sanitari o risultati del
 * calcolatore. Il click è un gesto esplicito dell'utente: nessuna copia
 * automatica, nessun evento inviato altrove (il clipboard è un'API locale
 * del browser, non fa richieste di rete).
 */
export function LabsCitationBlock({
  heading,
  citationText,
  copyLabel,
  copiedLabel,
}: {
  heading: string;
  citationText: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(citationText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API non disponibile (permessi/contesto non sicuro): nessun
      // fallback di rete, semplicemente non facciamo nulla.
    }
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
      <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
        {heading}
      </h2>
      <div className="mt-4 rounded-card border border-divider bg-bg-card/40 p-5">
        <pre className="whitespace-pre-wrap text-xs text-text-secondary font-mono leading-relaxed">
          {citationText}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 inline-flex items-center gap-2 rounded-pill border border-divider px-4 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-aqua/40 hover:text-brand-aqua transition"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </section>
  );
}

export interface FormulaRow {
  label: string;
  formula: string;
}

export function LabsFormulaTable({
  heading,
  rows,
}: {
  heading: string;
  rows: FormulaRow[];
}) {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
      <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
        {heading}
      </h2>
      <div className="mt-4 overflow-x-auto rounded-card border border-divider">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i > 0 ? "border-t border-divider" : ""}>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{r.label}</td>
                <td className="px-4 py-3 font-mono text-text-primary">{r.formula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
