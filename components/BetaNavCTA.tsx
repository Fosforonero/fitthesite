"use client";

import Link from "next/link";

import { useBetaSpots } from "@/lib/hooks/useBetaSpots";
import type { Locale } from "@/lib/i18n";

const COPY: Record<Locale, { label: string; full: string; aria: (left: number) => string }> = {
  it: {
    label: "Beta",
    full: "Waitlist",
    aria: (left) => `Beta privata — ${left} posti rimasti`,
  },
  en: {
    label: "Beta",
    full: "Waitlist",
    aria: (left) => `Private beta — ${left} spots left`,
  },
};

export default function BetaNavCTA({ locale }: { locale: Locale }) {
  const spots = useBetaSpots();
  const copy = COPY[locale];

  // Mentre carica: link plain con solo "Beta" (no badge). Niente flash.
  const label = spots.data?.isFull ? copy.full : copy.label;
  const badge = spots.data && !spots.data.isFull ? spots.data.spotsLeft : null;

  return (
    <Link
      href={`/${locale}/beta`}
      aria-label={spots.data ? copy.aria(spots.data.spotsLeft) : copy.label}
      className="ml-1 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-pill btn-cta text-sm font-medium"
    >
      <span>{label}</span>
      {badge !== null && (
        <span
          aria-hidden
          className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-black/30 text-[11px] font-mono tabular-nums"
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
