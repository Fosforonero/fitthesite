"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  applyConsent,
  disableAnalytics,
  loadAnalytics,
  resetReloadState,
  type ConsentRecord,
} from "@/lib/analytics/consent";

// useLayoutEffect non gira sul server: evita l'avviso in SSR senza cambiare
// l'ordine sul client, dove la sospensione sulle route escluse deve arrivare
// il prima possibile dopo il cambio di percorso.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Unico punto che accende o spegne GA4. Senza una scelta salvata non fa
 * nulla: nessuno script, nessun `gtag`, nessuna richiesta.
 */
export default function AnalyticsConsent() {
  const pathname = usePathname() || "/";

  useIsomorphicLayoutEffect(() => {
    applyConsent(pathname);
  }, [pathname]);

  useEffect(() => {
    const onChange = (event: Event) => {
      const record = (event as CustomEvent<ConsentRecord>).detail;
      if (record?.analytics) loadAnalytics();
      else disableAnalytics();
    };
    // Una scelta fatta in un'altra scheda dello stesso sito vale anche qui.
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) applyConsent(window.location.pathname);
    };
    // Una pagina ripristinata dalla cache avanti/indietro torna com'era: le
    // scelte fatte nel frattempo altrove non hanno prodotto eventi `storage`
    // per lei. Si rilegge il consenso (revoca, rifiuto, scelta cancellata). Una
    // ricarica avviata prima del congelamento e scavalcata dall'uscita dalla
    // pagina non e' arrivata: si riparte da capo, altrimenti resterebbe un
    // documento sotto la CSP temporanea e col tag ancora definito.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      resetReloadState();
      applyConsent(window.location.pathname);
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
