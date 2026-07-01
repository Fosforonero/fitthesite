"use client";

import { useEffect } from "react";

/**
 * Traccia i click verso gli store (Google Play / App Store) come evento GA4
 * `store_click` (param `store_platform`). Listener delegato a livello documento:
 * copre i badge, le CTA dentro gli articoli e i banner, senza toccare i singoli
 * link. Rispetta il consent mode (l'evento parte solo se gtag e' attivo).
 *
 * In GA4: marca `store_click` come "evento chiave" per misurare sito -> store.
 */
export default function OutboundTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      let store: "play" | "appstore" | null = null;
      if (href.includes("play.google.com")) store = "play";
      else if (href.includes("apps.apple.com")) store = "appstore";
      if (!store) return;
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtag === "function") {
        gtag("event", "store_click", {
          store_platform: store,
          link_url: href,
          page_path: window.location.pathname,
        });
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
