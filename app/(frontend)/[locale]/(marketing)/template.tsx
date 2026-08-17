"use client";

import { m } from "motion/react";
import { useEffect, type ReactNode } from "react";

/**
 * Page transition tra le route marketing. Fade+slide breve (≤300ms) per non
 * penalizzare l'INP percepito.
 *
 * IMPORTANTE (LCP): sul PRIMISSIMO load NON animiamo — l'opacity:0 iniziale
 * ritarderebbe l'LCP dell'hero. `hasMounted` è a livello di modulo, quindi
 * persiste tra i re-mount di questo template (uno per navigazione) nella
 * stessa sessione: solo le navigazioni client-side ottengono la transizione.
 *
 * Richiede MotionProvider (LazyMotion) come antenato — montato nel layout.
 */
let hasMounted = false;

export default function MarketingTemplate({ children }: { children: ReactNode }) {
  const animate = hasMounted;

  useEffect(() => {
    hasMounted = true;
  }, []);

  if (!animate) return <>{children}</>;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </m.div>
  );
}
