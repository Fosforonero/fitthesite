"use client";

import { useEffect, useState } from "react";

type Locale = "it" | "en" | "es" | "de" | "pt" | "fr";

const COPY: Record<Locale, { taken: string; left: (n: number) => string }> = {
  it: { taken: "posti founder occupati", left: (n) => `restano ${n} posti` },
  en: { taken: "founder spots taken", left: (n) => `${n} spots left` },
  es: { taken: "plazas founder ocupadas", left: (n) => `quedan ${n} plazas` },
  de: { taken: "Founder-Plätze belegt", left: (n) => `noch ${n} Plätze frei` },
  pt: { taken: "vagas founder ocupadas", left: (n) => `restam ${n} vagas` },
  fr: { taken: "places founder prises", left: (n) => `${n} places restantes` },
};

/**
 * Badge social proof: mostra i posti founder occupati in tempo reale
 * (GET /api/v1/beta/spots). Crea urgenza/scarsità sul funnel founder.
 */
export default function FounderCounter({ locale }: { locale: Locale }) {
  const [spots, setSpots] = useState<{ taken: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/v1/beta/spots")
      .then((r) => r.json())
      .then((d) => setSpots(d))
      .catch(() => {});
  }, []);

  if (!spots || !spots.total) return null;
  const t = COPY[locale];
  const pct = Math.min(100, Math.round((spots.taken / spots.total) * 100));
  const left = Math.max(0, spots.total - spots.taken);

  return (
    <div className="mt-6 inline-flex flex-col gap-2 rounded-card border border-brand-aqua/30 bg-brand-aqua/[0.06] px-4 py-3">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold text-text-primary tabular-nums">
          {spots.taken}
          <span className="text-text-muted">/{spots.total}</span>
        </span>
        <span className="text-sm text-text-secondary">{t.taken}</span>
      </div>
      <div className="h-1.5 w-full min-w-[200px] overflow-hidden rounded-pill bg-bg-elevated">
        <div
          className="h-full rounded-pill bg-gradient-to-r from-brand-aqua to-brand-green"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-brand-aqua font-medium">{t.left(left)}</span>
    </div>
  );
}
