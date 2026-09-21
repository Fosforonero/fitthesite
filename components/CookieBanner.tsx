"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale, defaultLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";
import { CONSENT_REOPEN_EVENT, CONSENT_STORAGE_KEY, readConsent, writeConsent } from "@/lib/analytics/consent";

export default function CookieBanner({ dict }: { dict: Dictionary }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname() || "/";

  // Derive locale from URL prefix for the "Details" link
  const localeFromPath: Locale =
    (locales as readonly string[]).find((l) => pathname.startsWith(`/${l}`)) as Locale | undefined ??
    defaultLocale;

  // Il banner non accende ne' spegne analytics: salva la scelta, e
  // AnalyticsConsent (montato nel root layout) la applica.
  useEffect(() => {
    if (!readConsent()) setVisible(true);
    const reopen = () => setVisible(true);
    // Una scelta fatta (o cancellata) in un'altra scheda vale anche qui.
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) setVisible(!readConsent());
    };
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONSENT_REOPEN_EVENT, reopen);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const acceptAll = () => {
    writeConsent(true);
    setVisible(false);
  };

  const rejectOptional = () => {
    writeConsent(false);
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
