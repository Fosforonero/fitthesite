"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useBetaSpots } from "@/lib/hooks/useBetaSpots";
import type { Locale } from "@/lib/i18n";

const STORAGE_KEY = "fitmesh_beta_banner_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Copy = {
  prefix: string;
  middle: (left: number, total: number) => string;
  perk: string;
  cta: string;
  closeAria: string;
};

const COPY: Record<Locale, Copy> = {
  it: {
    prefix: "Beta privata",
    middle: (left, total) => `${left}/${total} posti rimasti`,
    perk: "gratis a vita",
    cta: "Entra",
    closeAria: "Chiudi banner Beta",
  },
  en: {
    prefix: "Private beta",
    middle: (left, total) => `${left}/${total} spots left`,
    perk: "free forever",
    cta: "Join",
    closeAria: "Close Beta banner",
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
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isRecentlyDismissed());
  }, []);

  if (dismissed || !spots.data || spots.data.isFull) return null;

  const copy = COPY[locale];
  const { spotsLeft, total } = spots.data;
  const urgent = spotsLeft <= 20;

  return (
    <div
      role="region"
      aria-label={`${copy.prefix} — ${copy.middle(spotsLeft, total)}`}
      className="relative z-[55] bg-gradient-to-r from-brand-aqua/15 via-accent/15 to-brand-aqua/15 border-b border-divider/60"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <Link
          href={`/${locale}/beta`}
          className="flex-1 min-w-0 inline-flex items-center gap-2.5 text-text-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition"
        >
          <span
            aria-hidden
            className={`shrink-0 w-1.5 h-1.5 rounded-full ${urgent ? "bg-accent animate-pulse" : "bg-brand-aqua"}`}
          />
          <span className="truncate">
            <span className="text-text-secondary">{copy.prefix}</span>
            <span aria-hidden className="mx-1.5 text-text-muted/60">·</span>
            <span className={`font-medium ${urgent ? "text-accent" : "text-text-primary"}`}>
              {copy.middle(spotsLeft, total)}
            </span>
            <span aria-hidden className="mx-1.5 text-text-muted/60">·</span>
            <span className="text-text-secondary">{copy.perk}</span>
          </span>
          <span className="hidden sm:inline shrink-0 text-accent font-medium">
            {copy.cta} <span aria-hidden>→</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label={copy.closeAria}
          onClick={() => {
            markDismissed();
            setDismissed(true);
          }}
          className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition"
        >
          <span aria-hidden className="text-base leading-none">×</span>
        </button>
      </div>
    </div>
  );
}
