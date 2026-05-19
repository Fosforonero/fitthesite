"use client";

import BetaSignupForm from "./BetaSignupForm";
import BetaWaitlistForm from "./BetaWaitlistForm";
import { useBetaSpots } from "@/lib/hooks/useBetaSpots";
import type { Locale } from "@/lib/i18n";

type Copy = {
  fullBadge: string;
  fullTitle: string;
  fullBody: string;
};

const COPY: Record<Locale, Copy> = {
  it: {
    fullBadge: "Round 1 al completo",
    fullTitle: "Grazie, i primi 100 founder sono stati raggiunti.",
    fullBody:
      "Apriremo nuovi posti man mano che il programma evolve. Lascia la tua email qui sotto e sei tra i primi a essere avvisato — niente marketing, solo l'annuncio.",
  },
  en: {
    fullBadge: "Round 1 full",
    fullTitle: "Thanks — the first 100 founders have been claimed.",
    fullBody:
      "We'll open new spots as the program evolves. Drop your email below and you'll be first in line — no marketing, just the announcement.",
  },
};

/**
 * Client switcher tra BetaSignupForm (posti disponibili) e BetaWaitlistForm
 * (round full). Usato in /beta page server component come island isolato.
 *
 * Durante il loading iniziale (no spots data) mostriamo signup form come
 * default — è il caso più frequente e non blocca l'UI.
 */
export default function BetaFormSwitcher({ locale }: { locale: Locale }) {
  const spots = useBetaSpots();
  const isFull = spots.data?.isFull ?? false;

  if (!isFull) return <BetaSignupForm locale={locale} />;

  const c = COPY[locale];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-pill border border-accent/40 bg-accent/10 text-xs font-medium uppercase tracking-wider text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          {c.fullBadge}
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          {c.fullTitle}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {c.fullBody}
        </p>
      </div>
      <BetaWaitlistForm locale={locale} />
    </div>
  );
}
