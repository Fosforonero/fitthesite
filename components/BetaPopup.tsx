"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useBetaSpots } from "@/lib/hooks/useBetaSpots";
import type { Locale } from "@/lib/i18n";

/**
 * BetaPopup — slide-in toast notification-style (bottom-right desktop,
 * bottom-full mobile). Non blocca il contenuto, dismissibile con X,
 * animazione gentile rispettando prefers-reduced-motion.
 *
 * Trigger: 12s timer OR 55% scroll, whichever first.
 * Snooze: 14gg dopo dismiss (CTA click o X).
 * Auto-hide se spots === 0 (full state).
 */
const STORAGE_KEY = "fitmesh_beta_popup_dismissed_at";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const TIME_TRIGGER_MS = 12_000;
const SCROLL_TRIGGER_PCT = 55;

type Copy = {
  kicker: string;
  titleNormal: (left: number) => string;
  titleUrgent: (left: number) => string;
  body: string;
  cta: string;
  closeAria: string;
  liveAria: (left: number, total: number) => string;
};

const COPY: Record<Locale, Copy> = {
  it: {
    kicker: "Beta privata",
    titleNormal: (left) => `${left} posti founder gratis a vita`,
    titleUrgent: (left) => `Solo ${left} posti rimasti`,
    body: "Tutte le feature sbloccate. Niente abbonamento, mai.",
    cta: "Diventa founder",
    closeAria: "Chiudi notifica",
    liveAria: (left, total) =>
      `Beta privata: ${left} su ${total} posti gratis a vita rimasti`,
  },
  en: {
    kicker: "Private beta",
    titleNormal: (left) => `${left} free-forever founder spots`,
    titleUrgent: (left) => `Only ${left} spots left`,
    body: "All features unlocked. No subscription, ever.",
    cta: "Become a founder",
    closeAria: "Close notification",
    liveAria: (left, total) =>
      `Private beta: ${left} of ${total} free-forever spots left`,
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

export default function BetaPopup({ locale }: { locale: Locale }) {
  const spots = useBetaSpots();
  const [visible, setVisible] = useState(false);
  const [armed, setArmed] = useState(false);
  const dismissedThisSession = useRef(false);

  // Arm: skippa se gia' dismessa entro 14gg.
  useEffect(() => {
    if (isRecentlyDismissed()) return;
    setArmed(true);
  }, []);

  // Trigger: 12s timer OR 55% scroll.
  useEffect(() => {
    if (!armed || visible || dismissedThisSession.current) return;
    if (spots.data?.isFull) return;

    const timeoutId = window.setTimeout(() => {
      if (!dismissedThisSession.current) setVisible(true);
    }, TIME_TRIGGER_MS);

    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total <= 0) return;
      const pct = (scrolled / total) * 100;
      if (pct >= SCROLL_TRIGGER_PCT && !dismissedThisSession.current) {
        setVisible(true);
        window.removeEventListener("scroll", onScroll);
        window.clearTimeout(timeoutId);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [armed, visible, spots.data?.isFull]);

  // Auto-hide se diventa full mentre aperto
  useEffect(() => {
    if (visible && spots.data?.isFull) setVisible(false);
  }, [visible, spots.data?.isFull]);

  // ESC chiude
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !spots.data || spots.data.isFull) return null;

  const left = spots.data.spotsLeft;
  const total = spots.data.total;
  const taken = spots.data.taken;
  const copy = COPY[locale];
  const urgent = left <= 20;
  const title = urgent ? copy.titleUrgent(left) : copy.titleNormal(left);

  function dismiss() {
    markDismissed();
    dismissedThisSession.current = true;
    setVisible(false);
  }

  // CTA click: chiude PRIMA di navigare (no flash di popup ancora visibile)
  function onCtaClick() {
    markDismissed();
    dismissedThisSession.current = true;
    setVisible(false);
  }

  const pct = Math.min(100, Math.max(0, (taken / total) * 100));

  return (
    <div
      role="region"
      aria-label={copy.liveAria(left, total)}
      className="fitmesh-beta-popup fixed z-[70] bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-sm"
    >
      <style>{`
        @keyframes fm-popup-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .fitmesh-beta-popup {
          animation: fm-popup-in 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .fitmesh-beta-popup { animation: none; }
        }
      `}</style>

      <div
        className="relative rounded-2xl border border-divider/80 bg-bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Decorative ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl"
        />

        {/* Close button */}
        <button
          type="button"
          aria-label={copy.closeAria}
          onClick={dismiss}
          className="absolute top-2.5 right-2.5 w-7 h-7 inline-flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition"
        >
          <span aria-hidden className="text-base leading-none">×</span>
        </button>

        <div className="relative p-5 pr-12">
          {/* Kicker */}
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold flex items-center gap-2">
            <span aria-hidden className="w-1 h-1 rounded-full bg-brand-aqua animate-pulse" />
            {copy.kicker}
          </p>

          {/* Title */}
          <h2 className="mt-2.5 font-display text-lg font-semibold tracking-tight text-text-primary leading-snug">
            {title}
          </h2>

          {/* Progress bar */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] tabular-nums">
              <span className="text-text-muted">
                <span className="font-mono text-text-secondary">{taken}</span>
                <span className="text-text-muted/60">/{total}</span>
              </span>
              <span className={urgent ? "text-accent font-medium" : "text-text-muted"}>
                {left} {locale === "it" ? "rimasti" : "left"}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={taken}
              aria-label={copy.liveAria(left, total)}
              className="mt-1.5 h-1 rounded-full bg-bg-secondary/80 overflow-hidden"
            >
              <div
                className="h-full bg-gradient-to-r from-brand-aqua via-accent to-brand-green transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Body */}
          <p className="mt-3 text-xs text-text-secondary leading-relaxed">
            {copy.body}
          </p>

          {/* CTA */}
          <Link
            href={`/${locale}/beta`}
            onClick={onCtaClick}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-text-primary text-bg hover:bg-text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card text-sm font-semibold transition"
          >
            <span>{copy.cta}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
