import { renderMath } from "@/lib/labs/katex/render";

/**
 * Formula inline dentro un paragrafo (es. "dove `n` è il numero di
 * intervalli"). Server Component puro: nessuna direttiva "use client",
 * zero JS spedito al browser per questo elemento. `tex` deve essere una
 * costante del codice sorgente, mai testo utente (vedi render.ts).
 *
 * Niente `role="img"`/`aria-label` qui di proposito: l'output KaTeX
 * `htmlAndMathml` include già un ramo `<math>` MathML (letto dagli screen
 * reader) accanto al ramo visivo `aria-hidden`. Un `role="img"` sul
 * contenitore renderebbe quel ramo MathML opaco alla AT, vanificando il
 * requisito "MathML accessibile" — vedi anche BlockMath.
 */
export function InlineMath({ tex }: { tex: string }) {
  const { html } = renderMath(tex, false);
  return <span className="katex-inline align-baseline" dangerouslySetInnerHTML={{ __html: html }} />;
}
