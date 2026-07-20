/**
 * FitMesh Labs - rendering LaTeX server-side via KaTeX (P1.1 Fase 3).
 *
 * Nessuno script esterno, nessuna CDN: `katex` è una dipendenza npm normale,
 * il suo CSS è importato una sola volta in labs/layout.tsx (self-hosted,
 * bundlato da Next come qualunque altro asset - vedi quel file). Il rendering
 * avviene qui, in un modulo SENZA "use client": chiamato solo da Server
 * Component, produce stringa HTML+MathML già pronta, zero hydration, zero
 * JS lato client per mostrare una formula.
 *
 * `output: "htmlAndMathml"` (mai solo "html"): il ramo MathML è quello letto
 * dagli screen reader e da molti motori di ricerca/LLM, il ramo HTML è
 * quello visivamente renderizzato - servono entrambi.
 *
 * SICUREZZA: questa funzione fa `dangerouslySetInnerHTML` a valle (vedi
 * InlineMath/BlockMath). Va chiamata SOLO con stringhe LaTeX costanti,
 * definite nel codice sorgente (content file, mai un valore che arriva da
 * input utente, query string, form, o qualunque richiesta) - vedi guardrail
 * check-katex-no-user-input.ts.
 *
 * P1.1B Fase 5: `throwOnError: true` (era `false`). Le formule sono costanti
 * editoriali, non input utente: una formula LaTeX malformata è un ERRORE DI
 * BUILD/TEST da far fallire rumorosamente (`tools/check-labs-formulas-render.ts`,
 * eseguito anche come parte della build), mai un `<span class="katex-error">`
 * silenzioso che finirebbe comunque in produzione con un rendering rotto.
 */
import katex from "katex";

export interface RenderedMath {
  html: string;
  /** Solo per uso interno/debug - il markup ritornato da `html` include già il MathML. */
  displayMode: boolean;
}

export function renderMath(tex: string, displayMode: boolean): RenderedMath {
  const html = katex.renderToString(tex, {
    displayMode,
    output: "htmlAndMathml",
    throwOnError: true,
    strict: "warn",
  });
  return { html, displayMode };
}
