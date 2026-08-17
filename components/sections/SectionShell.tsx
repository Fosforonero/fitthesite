import type { ElementType, ReactNode } from "react";

/**
 * Intestazione di sezione riutilizzabile: kicker (label brand-aqua) + titolo
 * display + sottotitolo, con il ritmo/spacing editoriale del redesign.
 * Unifica il blocco "kicker + h2" ripetuto ~10 volte su home/provider/lp/blog.
 *
 * NON introduce testo: riceve kicker/title/subtitle già localizzati come props
 * → nessun impatto su i18n/dizionari. Il reveal allo scroll è gestito da
 * RevealObserver via `data-reveal` (presente di default).
 */
export default function SectionShell({
  kicker,
  title,
  subtitle,
  align = "left",
  titleSize = "display-lg",
  headingLevel = 2,
  id,
  className,
  headClassName,
  children,
  reveal = true,
}: {
  kicker?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  titleSize?: "display-lg" | "display" | "display-xl";
  headingLevel?: 1 | 2 | 3;
  id?: string;
  className?: string;
  headClassName?: string;
  children?: ReactNode;
  reveal?: boolean;
}) {
  const H = `h${headingLevel}` as ElementType;
  const titleCls =
    titleSize === "display-xl"
      ? "text-display-xl"
      : titleSize === "display"
        ? "text-display"
        : "text-display-lg";

  const hasHead = Boolean(kicker || title || subtitle);

  return (
    <section
      id={id}
      data-reveal={reveal ? "" : undefined}
      className={`max-w-6xl mx-auto px-4 sm:px-6 ${className ?? ""}`}
    >
      {hasHead && (
        <div
          className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""} ${headClassName ?? ""}`}
        >
          {kicker && (
            <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
              {kicker}
            </p>
          )}
          {title && (
            <H
              className={`mt-4 font-display ${titleCls} font-semibold tracking-tightest text-text-primary text-balance`}
            >
              {title}
            </H>
          )}
          {subtitle && (
            <p className="mt-4 text-text-secondary leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
