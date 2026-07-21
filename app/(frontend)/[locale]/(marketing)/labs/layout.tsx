import "katex/dist/katex.min.css";

/**
 * P1.1 Fase 3/11: il CSS di KaTeX (font incluse) viene importato SOLO qui,
 * in un layout annidato sotto /labs - Next.js include il bundle CSS
 * risultante solo per le route sotto questo segmento, non nel resto del
 * sito. Self-hosted: nessuna richiesta a una CDN esterna, i font .woff2
 * vengono serviti dalla stessa origin del sito (Next li tratta come asset
 * statici a build time).
 *
 * Nessun override di colore: KaTeX eredita `currentColor` per il testo
 * (verificato: katex.css non fissa `color` sugli elementi principali), e
 * questo sito ha un unico tema scuro con testo chiaro - le formule sono
 * leggibili senza bisogno di regole dark-mode dedicate.
 */
export default function LabsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
