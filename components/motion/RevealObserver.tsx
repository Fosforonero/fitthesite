"use client";

import { useEffect } from "react";

/**
 * Engine unico per i reveal allo scroll. Un solo IntersectionObserver per
 * tutta la pagina: osserva ogni `[data-reveal]` e aggiunge `.is-visible`
 * quando entra in vista. Le sezioni restano server component (nessun client
 * boundary per sezione) — vedi globals.css per lo stato iniziale/gating.
 *
 * NB: la classe `html.reveal-ready` (che attiva il gating dell'opacità) è
 * aggiunta da uno script INLINE nel layout PRIMA del paint, non qui: farlo
 * in useEffect (post-paint) causerebbe un flash visibile→nascosto.
 *
 * Reduced-motion / no-IntersectionObserver → rivela tutto subito (il CSS
 * con `prefers-reduced-motion` tiene comunque il contenuto visibile).
 */
export default function RevealObserver() {
  useEffect(() => {
    // Auto-stagger: assegna --reveal-delay ai figli [data-reveal] dei
    // contenitori [data-reveal-stagger] (se non già impostato a mano).
    document
      .querySelectorAll<HTMLElement>("[data-reveal-stagger]")
      .forEach((group) => {
        const step = Number(group.getAttribute("data-reveal-stagger")) || 80;
        group
          .querySelectorAll<HTMLElement>(":scope [data-reveal]")
          .forEach((el, i) => {
            if (!el.style.getPropertyValue("--reveal-delay")) {
              el.style.setProperty("--reveal-delay", `${i * step}ms`);
            }
          });
      });

    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (els.length === 0) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
