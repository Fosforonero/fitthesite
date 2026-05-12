"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const STORAGE_KEY = "fitmesh_cookie_consent";

type Consent = {
  analytics: boolean;
  ts: number;
};

function updateGtagConsent(granted: boolean) {
  try {
    window.gtag?.("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
    });
  } catch {
    /* silent */
  }
}

function persist(consent: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    /* silent */
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Consent = JSON.parse(stored);
        // Replay consent into gtag in case the layout script loaded before us
        updateGtagConsent(!!parsed.analytics);
        return;
      }
    } catch {
      /* fall through to show banner */
    }
    setVisible(true);
  }, []);

  const acceptAll = () => {
    const consent: Consent = { analytics: true, ts: Date.now() };
    persist(consent);
    updateGtagConsent(true);
    setVisible(false);
  };

  const rejectOptional = () => {
    const consent: Consent = { analytics: false, ts: Date.now() };
    persist(consent);
    updateGtagConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferenze cookie"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="rounded-card border border-divider bg-bg-card/95 backdrop-blur-md shadow-card-hi p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-text-primary">
            Cookie e privacy
          </h2>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            Usiamo cookie tecnici essenziali (indispensabili per il sito) e, con il tuo
            consenso, <strong className="text-text-primary">Google Analytics</strong> per
            capire come migliorare il prodotto. Nessun cookie pubblicitario o di profilazione.
            {" "}
            <Link href="/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
              Dettagli
            </Link>
            .
          </p>

          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-3 sm:justify-end">
            <button
              type="button"
              onClick={rejectOptional}
              className="px-5 py-2.5 rounded-pill border border-divider text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition"
            >
              Rifiuta opzionali
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="px-6 py-2.5 rounded-pill btn-cta text-sm"
            >
              Accetta tutto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
