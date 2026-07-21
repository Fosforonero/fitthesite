import { renderMath } from "@/lib/labs/katex/render";

/**
 * Formula in blocco, centrata, propria riga. Server Component puro (vedi
 * InlineMath per il ragionamento su hydration/accessibilità/CDN).
 *
 * Scroll orizzontale SOLO se la formula eccede la larghezza disponibile
 * (mobile stretto): il contenitore interno scrolla, la pagina non trabocca
 * mai orizzontalmente (`overflow-x-auto` locale, non su `<body>`).
 *
 * `role="group"` (non `role="img"`) sul contenitore esterno: aggiunge un
 * punto di riferimento nominato per la AT senza rendere opaco il ramo
 * MathML interno di KaTeX, che resta esplorabile.
 */
export function BlockMath({ tex, ariaLabel }: { tex: string; ariaLabel?: string }) {
  const { html } = renderMath(tex, true);
  return (
    <div
      className="katex-block my-4 overflow-x-auto py-1"
      role="group"
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
