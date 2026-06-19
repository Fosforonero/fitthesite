"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

const INTEGRATIONS_LABEL: Partial<Record<Locale, string>> = {
  it: "Integrazioni",
};

export default function MobileMenu({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  // Close on route change (popstate) and ESC
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", close);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const integrationsLabel = INTEGRATIONS_LABEL[locale] ?? "Integrations";

  return (
    <>
      {/* Hamburger button — hidden on md+ */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] rounded-lg hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Chiudi menu" : "Apri menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        <span
          className={`block w-5 h-0.5 bg-text-primary rounded-full transition-all duration-200 origin-center ${
            open ? "rotate-45 translate-y-[6.5px]" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-text-primary rounded-full transition-all duration-200 ${
            open ? "opacity-0 scale-x-0" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-text-primary rounded-full transition-all duration-200 origin-center ${
            open ? "-rotate-45 -translate-y-[6.5px]" : ""
          }`}
        />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Dropdown panel */}
      <div
        id="mobile-nav"
        className={`fixed inset-x-0 top-16 z-50 md:hidden bg-bg border-b border-white/[0.06] transition-all duration-200 ${
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-0.5">
          <Link
            href={`/${locale}/integrations`}
            className="px-3 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            {integrationsLabel}
          </Link>
          <Link
            href={`/${locale}/roadmap`}
            className="px-3 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            Roadmap
          </Link>
          <Link
            href={`/${locale}/blog`}
            className="px-3 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            Blog
          </Link>
          <Link
            href={`/${locale}/beta`}
            className="px-3 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            Beta
          </Link>
          <Link
            href={`/${locale}/support`}
            className="px-3 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            {dict.nav.support}
          </Link>
          <Link
            href={`/${locale}/privacy`}
            className="px-3 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            {dict.nav.privacy}
          </Link>
          <div className="h-px bg-white/[0.06] my-1" />
          <Link
            href={`/${locale}/beta`}
            className="mx-1 mb-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl btn-cta text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            Founder →
          </Link>
        </nav>
      </div>
    </>
  );
}
