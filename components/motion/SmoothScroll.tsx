"use client";

import { useEffect } from "react";

/**
 * Smooth scroll "pesante" stile agency (Lenis). È il device che più di tutti
 * cambia il FEEL percepito della pagina: lo scroll diventa fluido/inerziale e
 * fa sentire coese parallax e reveal.
 *
 * - Disattivato sotto `prefers-reduced-motion` (accessibilità).
 * - Lazy import della libreria → fuori dal critical path / bundle iniziale.
 * - Aggiunge la classe `lenis` su <html> (vedi globals.css per le regole).
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let destroy = () => {};

    import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.05,
        // expo-out, coerente col resto del motion (BRAND.md §11)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });

      const loop = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      destroy = () => lenis.destroy();
    });

    return () => {
      cancelAnimationFrame(raf);
      destroy();
    };
  }, []);

  return null;
}
