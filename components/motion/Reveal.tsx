import type { CSSProperties, ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Tag/elemento da renderizzare (default div). */
  as?: ElementType;
  className?: string;
  /** Ritardo in ms (stagger manuale). */
  delay?: number;
  /** Above-the-fold / LCP-safe: si rivela subito, senza opacity:0 iniziale. */
  instant?: boolean;
  style?: CSSProperties;
  id?: string;
};

/**
 * Wrapper server-friendly per il reveal allo scroll. Emette solo l'attributo
 * `data-reveal` (+ eventuale `--reveal-delay`); l'animazione è gestita da
 * RevealObserver + globals.css. Niente "use client" → usabile in qualsiasi
 * server component senza creare un client boundary.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className,
  delay,
  instant,
  style,
  id,
}: RevealProps) {
  const mergedStyle =
    delay != null
      ? ({ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties)
      : style;

  return (
    <Tag
      id={id}
      data-reveal={instant ? "instant" : ""}
      className={className}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}
