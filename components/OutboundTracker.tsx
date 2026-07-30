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
 * store_destination (nome store leggibile) e campaign="post_founder" -
 * nessuna nuova route API, nessun dato sanitario, nessun identificatore
 * personale, zero polling: stesso listener client-side esistente, solo
 * parametri aggiuntivi sullo stesso evento. Un click store NON equivale a
 * un'installazione: resta un segnale di intento, non una conversione.
 *
 * P1.4B: due nuovi eventi generici, indipendenti da `store_click` (che resta
 * SOLO per link reali verso play.google.com/apps.apple.com) - `cta_click`
 * per qualunque elemento con `data-cta-id` (CTA blog, CTA Labs, ecc.) e
 * `cta_view` quando quell'elemento entra per la prima volta nel viewport
 * (IntersectionObserver, una sola volta per elemento). Un `MutationObserver`
 * sul body copre le CTA renderizzate dopo il mount iniziale (navigazione
 * client-side Next.js: questo componente è montato una sola volta nel root
 * layout, il suo useEffect non rigira ad ogni cambio pagina). Nessun dato
 * fisiologico/personale in nessuno dei due eventi: solo id/posizione CTA,
 * path pagina, locale.
 *
 * P1.4B-A: `hr_zones_mode_select`, evento per il cambio di modalità FC max
 * nel calcolatore Zone di Frequenza Cardiaca (`data-hr-zones-mode-select`
 * su ciascuna label radio in HeartRateZonesCalculator.tsx). Il parametro
 * `mode` è SOLO uno dei tre valori enum ("tanaka"/"age220"/"measured"):
 * mai età, FC a riposo, FC massima o qualunque altro valore inserito
 * dall'utente.
 */
export default function OutboundTracker() {
  useEffect(() => {
    function currentLocale(): string {
      return window.location.pathname.split("/").filter(Boolean)[0] ?? "";
    }

    function gtagFn(): ((...args: unknown[]) => void) | undefined {
      return (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    }

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
      const gtag = gtagFn();
      if (typeof gtag === "function") {
        const ctaLocationEl = a.closest("[data-cta-location]");
        gtag("event", "store_click", {
          store_platform: store,
          store_destination: storeDestination,
          link_url: href,
          page_path: window.location.pathname,
          locale: currentLocale(),
          cta_location: ctaLocationEl?.getAttribute("data-cta-location") ?? "unspecified",
          campaign: "post_founder",
        });
      }
    }

    function onCtaClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const ctaEl = target?.closest?.("[data-cta-id]") as HTMLElement | null;
      if (!ctaEl) return;
      const gtag = gtagFn();
      if (typeof gtag === "function") {
        gtag("event", "cta_click", {
          cta_id: ctaEl.getAttribute("data-cta-id"),
          cta_placement: ctaEl.getAttribute("data-cta-placement") ?? "unspecified",
          page_path: window.location.pathname,
          locale: currentLocale(),
        });
      }
    }

    function onHrZonesModeSelect(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const modeEl = target?.closest?.("[data-hr-zones-mode-select]") as HTMLElement | null;
      if (!modeEl) return;
      const gtag = gtagFn();
      if (typeof gtag === "function") {
        gtag("event", "hr_zones_mode_select", {
          mode: modeEl.getAttribute("data-hr-zones-mode-select"),
          page_path: window.location.pathname,
          locale: currentLocale(),
        });
      }
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("click", onCtaClick, true);
    document.addEventListener("click", onHrZonesModeSelect, true);

    // cta_view: una sola emissione per elemento, quando entra nel viewport.
    const viewed = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || viewed.has(entry.target)) continue;
          viewed.add(entry.target);
          io.unobserve(entry.target);
          const gtag = gtagFn();
          if (typeof gtag === "function") {
            gtag("event", "cta_view", {
              cta_id: entry.target.getAttribute("data-cta-id"),
              cta_placement: entry.target.getAttribute("data-cta-placement") ?? "unspecified",
              page_path: window.location.pathname,
              locale: currentLocale(),
            });
          }
        }
      },
      { threshold: 0.5 },
    );

    function observeWithin(root: ParentNode) {
      root.querySelectorAll?.("[data-cta-id]").forEach((el) => {
        if (!viewed.has(el)) io.observe(el);
      });
    }
    observeWithin(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.("[data-cta-id]")) io.observe(node);
          observeWithin(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("click", onCtaClick, true);
      document.removeEventListener("click", onHrZonesModeSelect, true);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
