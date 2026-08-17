"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Parallax misurato pilotato dallo scroll. L'elemento trasla in `y` mentre
 * attraversa il viewport. Solo `transform` → nessun layout shift (CWV-safe).
 *
 * `distance` è lo spostamento totale in px (default 48, entro il range
 * 40-60 indicato in BRAND.md). Sotto `prefers-reduced-motion` resta statico.
 *
 * Richiede MotionProvider (LazyMotion) come antenato.
 */
export default function Parallax({
  children,
  distance = 48,
  className,
  style,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <m.div
      ref={ref}
      className={className}
      style={reduce ? style : { ...style, y }}
    >
      {children}
    </m.div>
  );
}
