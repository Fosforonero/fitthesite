"use client";

import Link from "next/link";

import { useBetaSpots } from "@/lib/hooks/useBetaSpots";
import type { Locale } from "@/lib/i18n";

const COPY: Record<Locale, {
  ctaWithSpots: (left: number) => string;
  ctaFallback: string;
  ctaFull: string;
  subWithSpots: (left: number, total: number) => string;
  subFull: string;
  subFallback: string;
}> = {
  it: {
    ctaWithSpots: (left) => `Diventa founder · ${left} posti rimasti`,
    ctaFallback: "Diventa founder",
    ctaFull: "Iscriviti alla waitlist",
    subWithSpots: (left, total) =>
      `${total - left}/${total} founder già a bordo · gratis a vita`,
    subFull: "Beta privata al completo — apriremo il prossimo round presto",
    subFallback: "100 founder gratis a vita",
  },
  en: {
    ctaWithSpots: (left) => `Become a founder · ${left} spots left`,
    ctaFallback: "Become a founder",
    ctaFull: "Join the waitlist",
    subWithSpots: (left, total) =>
      `${total - left}/${total} founders on board · free forever`,
    subFull: "Private beta full — next round opening soon",
    subFallback: "100 founders, free forever",
  },
};

export default function HeroBetaCTA({ locale }: { locale: Locale }) {
  const spots = useBetaSpots();
  const c = COPY[locale];

  let cta: string;
  let sub: string;
  if (spots.data?.isFull) {
    cta = c.ctaFull;
    sub = c.subFull;
  } else if (spots.data) {
    cta = c.ctaWithSpots(spots.data.spotsLeft);
    sub = c.subWithSpots(spots.data.spotsLeft, spots.data.total);
  } else {
    cta = c.ctaFallback;
    sub = c.subFallback;
  }

  return (
    <div className="flex flex-col gap-2">
      <Link
        href={`/${locale}/beta`}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-pill btn-cta text-base sm:text-lg font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-shadow"
      >
        <span>{cta}</span>
        <span aria-hidden>→</span>
      </Link>
      <p className="text-xs text-text-muted flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        <span>{sub}</span>
      </p>
    </div>
  );
}
