"use client";

import { useEffect } from "react";

/**
 * Traccia i click verso gli store (Google Play / App Store) come evento GA4
 * `store_click` (param `store_platform`). Listener delegato a livello documento:
 * copre i badge, le CTA dentro gli articoli e i banner, senza toccare i singoli
 * link. Rispetta il consent mode (l'evento parte solo se gtag e' attivo).
 *
 * In GA4: marca `store_click` come "evento chiave" per misurare sito -> store.
 *
 * Sprint P0.10 (funnel post-Founder): aggiunge locale, cta_location (da
 * `data-cta-location` sull'antenato piu' vicino, vedi StoreButtonsRow),
 * store_destination (nome store leggibile) e campaign="post_founder" —
 * nessuna nuova route API, nessun dato sanitario, nessun identificatore
 * personale, zero polling: stesso listener client-side esistente, solo
 * parametri aggiuntivi sullo stesso evento. Un click store NON equivale a
 * un'installazione: resta un segnale di intento, non una conversione.
 */
export default function OutboundTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      let store: "play" | "appstore" | null = null;
      let storeDestination: string | null = null;
      if (href.includes("play.google.com")) {
        store = "play";
        storeDestination = "Google Play";
      } else if (href.includes("apps.apple.com")) {
        store = "appstore";
        storeDestination = "App Store";
      }
      if (!store) return;
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtag === "function") {
        const ctaLocationEl = a.closest("[data-cta-location]");
        const locale = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
        gtag("event", "store_click", {
          store_platform: store,
          store_destination: storeDestination,
          link_url: href,
          page_path: window.location.pathname,
          locale,
          cta_location: ctaLocationEl?.getAttribute("data-cta-location") ?? "unspecified",
          campaign: "post_founder",
        });
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
