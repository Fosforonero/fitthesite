"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useBetaSpots } from "@/lib/hooks/useBetaSpots";
import type { Locale } from "@/lib/i18n";

const STORAGE_KEY = "fitmesh_beta_banner_dismissed_at";
const DISMISS_TTL_MS = 3 * 24 * 60 * 60 * 1000;

type Copy = {
  text: (left: number, total: number) => string;
  cta: string;
  closeAria: string;
};

const COPY: Record<Locale, Copy> = {
  it: {
    text: (left, total) =>
      `Beta privata · ${left}/${total} posti founder rimasti — gratis a vita`,
    cta: "Entra",
    closeAria: "Chiudi banner",
  },
  en: {
    text: (left, total) =>
      `Private beta · ${left}/${total} founder spots left — free forever`,
    cta: "Join",
    closeAria: "Close banner",
  },
};

function isRecentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* silent */
  }
}

export default function BetaStickyBanner({ locale }: { locale: Locale }) {
  const spots = useBetaSpots();
  const [dismissed, setDismissed] = useState(true); // SSR-safe: hidden first render

  useEffect(() => {
    setDismissed(isRecentlyDismissed());
  }, []);

  if (dismissed || !spots.data || spots.data.isFull) return null;

  const copy = COPY[locale];

  return (
    <div
      role="region"
      aria-label={copy.text(spots.data.spotsLeft, spots.data.total)}
      className="relative z-[55] bg-gradient-to-r from-brand-aqua/20 via-accent/20 to-brand-aqua/20 border-b border-divider"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <Link
          href={`/${locale}/beta`}
          className="flex-1 truncate text-text-primary hover:text-accent transition flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
          <span className="truncate">
            {copy.text(spots.data.spotsLeft, spots.data.total)}
          </span>
          <span className="hidden sm:inline text-accent font-medium shrink-0">
            {copy.cta} →
          </span>
        </Link>
        <button
          type="button"
          aria-label={copy.closeAria}
          onClick={() => {
            markDismissed();
            setDismissed(true);
          }}
          className="shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-white/10 transition"
        >
          <span aria-hidden className="text-base leading-none">×</span>
        </button>
      </div>
    </div>
  );
}
