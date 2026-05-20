"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale, defaultLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const STORAGE_KEY = "fitmesh_cookie_consent";

type Consent = { analytics: boolean; ts: number };

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

export default function CookieBanner({ dict }: { dict: Dictionary }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname() || "/";

  // Derive locale from URL prefix for the "Details" link
  const localeFromPath: Locale =
    (locales as readonly string[]).find((l) => pathname.startsWith(`/${l}`)) as Locale | undefined ??
    defaultLocale;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Consent = JSON.parse(stored);
        updateGtagConsent(!!parsed.analytics);
        return;
      }
    } catch {
      /* fall through */
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

  // Mobile: aggiungi padding-bottom al body finche' il banner e' visibile,
  // altrimenti la barra fixed copre le CTA in fondo (es. StoreButtonsRow
  // su homepage). Su sm+ il banner sta in un max-w-3xl e non c'e' overlap.
  useEffect(() => {
    if (!visible) return;
    if (typeof window === "undefined") return;
    const apply = () => {
      if (window.innerWidth < 640) {
        document.body.style.paddingBottom = "200px";
      } else {
        document.body.style.paddingBottom = "";
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      document.body.style.paddingBottom = "";
      window.removeEventListener("resize", apply);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={dict.cookie_banner.title}
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="rounded-card border border-divider bg-bg-card/95 backdrop-blur-md shadow-card-hi p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-text-primary">
            {dict.cookie_banner.title}
          </h2>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {dict.cookie_banner.description}{" "}
            <Link
              href={`/${localeFromPath}/cookies`}
              className="text-brand-aqua hover:text-brand-blue underline underline-offset-4"
            >
              {dict.cookie_banner.details_link}
            </Link>
            .
          </p>

          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-3 sm:justify-end">
            <button
              type="button"
              onClick={rejectOptional}
              className="px-5 py-2.5 rounded-pill border border-divider text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition"
            >
              {dict.cookie_banner.reject}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="px-6 py-2.5 rounded-pill btn-cta text-sm"
            >
              {dict.cookie_banner.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
