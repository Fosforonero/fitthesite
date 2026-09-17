"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  applyConsent,
  disableAnalytics,
  loadAnalytics,
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
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
