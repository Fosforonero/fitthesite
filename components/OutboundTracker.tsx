"use client";

import { useEffect } from "react";

import {
  CTA_CAMPAIGN,
  CTA_NO_STORE_DESTINATION,
  CTA_UNSPECIFIED,
  TARGET_TYPES,
  resolveStoreLink,
  resolveCommunityLink,
} from "@/lib/analytics/cta";

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
 * store_destination (nome store leggibile) e la campagna — nessuna nuova
 * route API, nessun dato sanitario, nessun identificatore personale, zero
 * polling: stesso listener client-side esistente, solo parametri aggiuntivi
 * sullo stesso evento. Un click store NON equivale a un'installazione:
 * resta un segnale di intento, non una conversione.
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
 * Sprint P0.10K — Fase 7 (allineamento del funnel post-Founder). L'audit
 * aveva rilevato che `cta_view`/`cta_click` NON portavano `campaign` mentre
 * `store_click` si': il funnel view -> click -> store non era segmentabile
 * su una dimensione unica. Da qui:
 *  - i tre eventi portano SEMPRE le stesse cinque dimensioni — `locale`,
 *    `placement`, `store_destination`, `campaign`, `path`;
 *  - `campaign` viene da un'unica costante condivisa (`CTA_CAMPAIGN` in
 *    lib/analytics/cta.ts), mai piu' da una stringa inline;
 *  - `placement` e' la dimensione unificata: i vecchi nomi divergenti
 *    (`cta_location` su store_click, `cta_placement` su cta_*) restano
 *    emessi come alias per non rompere le dimensioni GA4 gia' configurate,
 *    ma trasportano lo stesso valore;
 *  - idem per il path: `path` e' il nome unificato, `page_path` resta come
 *    alias storico;
 *  - `store_destination` vale `"none"` quando l'evento non risolve a un
 *    singolo store (ogni `cta_view`, e i `cta_click` su CTA interne come
 *    l'ancora `#download` di header e menu mobile): parametro sempre
 *    presente invece che assente a intermittenza.
 * Nessun nuovo meccanismo: resta l'unico layer dichiarativo esistente
 * (`data-cta-id` / `data-cta-placement` / `data-cta-location`), tutto
 * client-side, nessuna richiesta di rete e nessuna route resa dinamica.
 *
 * PRIVACY: la superficie dei dati NON viene ampliata. Gli eventi trasportano
 * solo locale, posizione della CTA nel sito, store di destinazione,
 * campagna e path della pagina. Nessun identificativo personale, nessun
 * dato sanitario, nessun valore inserito dall'utente.
 *
 * P1.4B-A: `hr_zones_mode_select`, evento per il cambio di modalità FC max
 * nel calcolatore Zone di Frequenza Cardiaca (`data-hr-zones-mode-select`
 * su ciascuna label radio in HeartRateZonesCalculator.tsx). Il parametro
 * `mode` è SOLO uno dei tre valori enum ("tanaka"/"age220"/"measured"):
 * mai età, FC a riposo, FC massima o qualunque altro valore inserito
 * dall'utente.
 *
 * P0.14A: `external_community_click`, click sul link d'uscita verso la
 * community ufficiale (oggi solo r/FitMesh, `resolveCommunityLink` in
 * lib/analytics/cta.ts — match sull'URL esatto, non un generico
 * `includes("reddit.com")`). Evento indipendente dal funnel store/cta:
 * porta solo `platform`/`placement`/`locale`/`path`, niente `campaign`
 * (non fa parte del funnel post-Founder).
 */
export default function OutboundTracker() {
  useEffect(() => {
    function currentLocale(): string {
      return window.location.pathname.split("/").filter(Boolean)[0] ?? "";
    }

    function gtagFn(): ((...args: unknown[]) => void) | undefined {
      return (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    }

    /**
     * Placement della CTA: antenato piu' vicino (l'elemento stesso incluso)
     * che dichiari `data-cta-placement` oppure `data-cta-location`. Regola
     * unica per tutti e tre gli eventi, cosi' `cta_view`, `cta_click` e
     * `store_click` sulla stessa CTA riportano lo stesso valore.
     */
    function placementOf(el: Element | null | undefined): string {
      const holder = el?.closest?.("[data-cta-placement],[data-cta-location]");
      if (!holder) return CTA_UNSPECIFIED;
      return (
        holder.getAttribute("data-cta-placement") ??
        holder.getAttribute("data-cta-location") ??
        CTA_UNSPECIFIED
      );
    }

    /**
     * P1.9 FASE 6 — `content_cluster`: antenato più vicino con
     * `data-cta-content-cluster` (dichiarato sul wrapper del modulo
     * editoriale, `fitmesh-editorial-cta` in BlogRenderer). Assente per ogni
     * CTA pre-esistente: nessuna modifica al payload di quelle CTA.
     */
    function contentClusterOf(el: Element | null | undefined): string {
      const holder = el?.closest?.("[data-cta-content-cluster]");
      return holder?.getAttribute("data-cta-content-cluster") ?? CTA_UNSPECIFIED;
    }

    /**
     * P1.9 FASE 6 — `target_type`: antenato più vicino con
     * `data-cta-target-type` ("store" fisso su StoreButtonsRow, oppure
     * "internal_landing" dichiarato a mano sul link secondario del modulo
     * editoriale). Assente per ogni CTA pre-esistente diversa da
     * StoreButtonsRow.
     */
    function targetTypeOf(el: Element | null | undefined): string {
      const holder = el?.closest?.("[data-cta-target-type]");
      return holder?.getAttribute("data-cta-target-type") ?? CTA_UNSPECIFIED;
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const store = resolveStoreLink(href);
      if (!store) return;
      const gtag = gtagFn();
      if (typeof gtag === "function") {
        const placement = placementOf(a);
        gtag("event", "store_click", {
          store_platform: store.platform,
          store_destination: store.destination,
          link_url: href,
          page_path: window.location.pathname,
          path: window.location.pathname,
          locale: currentLocale(),
          cta_location: placement,
          placement,
          campaign: CTA_CAMPAIGN,
          // P1.9 FASE 6: sempre "none"/"store" per le CTA pre-esistenti che
          // non dichiarano data-cta-content-cluster (nessun cambio di
          // significato), popolato per il modulo editoriale nuovo.
          content_cluster: contentClusterOf(a),
          target_type: TARGET_TYPES.store,
        });
      }
    }

    function onCtaClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const ctaEl = target?.closest?.("[data-cta-id]") as HTMLElement | null;
      if (!ctaEl) return;
      const gtag = gtagFn();
      if (typeof gtag === "function") {
        const placement = placementOf(ctaEl);
        const anchor = target?.closest?.("a");
        const store = anchor ? resolveStoreLink(anchor.getAttribute("href") ?? "") : null;
        gtag("event", "cta_click", {
          cta_id: ctaEl.getAttribute("data-cta-id"),
          cta_placement: placement,
          placement,
          store_destination: store?.destination ?? CTA_NO_STORE_DESTINATION,
          campaign: CTA_CAMPAIGN,
          page_path: window.location.pathname,
          path: window.location.pathname,
          locale: currentLocale(),
          content_cluster: contentClusterOf(ctaEl),
          target_type: store ? TARGET_TYPES.store : targetTypeOf(ctaEl),
        });
      }
    }

    /**
     * P0.14A — `external_community_click`: click su un link d'uscita verso
     * la community ufficiale (oggi solo r/FitMesh). Evento indipendente dal
     * funnel store/cta sopra: niente `campaign` (non è il funnel
     * post-Founder), solo `platform`/`placement`/`locale`/`path` per
     * istruzione esplicita — nessun dato personale.
     */
    function onCommunityClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const community = resolveCommunityLink(href);
      if (!community) return;
      const gtag = gtagFn();
      if (typeof gtag === "function") {
        gtag("event", "external_community_click", {
          platform: community.platform,
          placement: placementOf(a),
          path: window.location.pathname,
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
    document.addEventListener("click", onCommunityClick, true);
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
            const placement = placementOf(entry.target);
            gtag("event", "cta_view", {
              cta_id: entry.target.getAttribute("data-cta-id"),
              cta_placement: placement,
              placement,
              // Una visualizzazione non ha uno store di destinazione: il
              // parametro resta presente (funnel confrontabile) col valore
              // esplicito "none".
              store_destination: CTA_NO_STORE_DESTINATION,
              campaign: CTA_CAMPAIGN,
              page_path: window.location.pathname,
              path: window.location.pathname,
              locale: currentLocale(),
              content_cluster: contentClusterOf(entry.target),
              target_type: targetTypeOf(entry.target),
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
        // `data-cta-id` puo' comparire su un elemento GIA' nel DOM: e' il
        // caso della CTA del menu mobile, che dichiara l'attributo solo
        // quando il pannello e' aperto (da chiuso il pannello e' invisibile
        // ma resta nel layout, e l'IntersectionObserver — che ignora
        // opacity/visibility — emetterebbe una `cta_view` fantasma ad ogni
        // caricamento su mobile). Senza osservare anche le mutazioni di
        // attributo quella CTA non verrebbe mai agganciata.
        if (m.type === "attributes") {
          const el = m.target;
          if (el instanceof Element && el.matches("[data-cta-id]") && !viewed.has(el)) {
            io.observe(el);
          }
          continue;
        }
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.("[data-cta-id]")) io.observe(node);
          observeWithin(node);
        });
      }
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-cta-id"],
    });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("click", onCtaClick, true);
      document.removeEventListener("click", onCommunityClick, true);
      document.removeEventListener("click", onHrZonesModeSelect, true);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
