"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Provider Framer Motion — caricato via LazyMotion in modalità `strict`.
 *
 * - `features` è importato in modo lazy (chunk separato `domAnimation`,
 *   ~15-20KB gzip) così NON entra nel critical path dell'hero/LCP.
 * - `strict` impone l'uso di `m.*` (mai `motion.*`) → evita di trascinare
 *   l'intero bundle Framer per sbaglio.
 *
 * Montato una sola volta nel marketing layout, avvolge tutte le isole
 * client (Parallax, page transition). I micro-effetti restano CSS.
 */
const loadFeatures = () => import("motion/react").then((mod) => mod.domAnimation);

export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
