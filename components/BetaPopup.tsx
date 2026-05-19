"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useBetaSpots } from "@/lib/hooks/useBetaSpots";
import type { Locale } from "@/lib/i18n";

const STORAGE_KEY = "fitmesh_beta_popup_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TIME_TRIGGER_MS = 5000;
const SCROLL_TRIGGER_PCT = 40;

type Copy = {
  kicker: string;
  title: (left: number) => string;
  titleFew: (left: number) => string;
  body: string;
  cta: string;
  dismiss: string;
  closeAria: string;
};

const COPY: Record<Locale, Copy> = {
  it: {
    kicker: "Beta privata",
    title: (left) => `Solo ${left} posti gratis a vita`,
    titleFew: (left) => `Solo ${left} posti rimasti — corri`,
    body: "100 founder ricevono l'app prima del lancio pubblico e tutte le feature gratis per sempre. Niente abbonamento, mai.",
    cta: "Voglio essere founder",
    dismiss: "Non ora",
    closeAria: "Chiudi",
  },
  en: {
    kicker: "Private beta",
    title: (left) => `Only ${left} free-forever spots left`,
    titleFew: (left) => `Only ${left} spots left — hurry`,
    body: "100 founders get the app before public launch and every feature free forever. No subscription, ever.",
    cta: "Become a founder",
    dismiss: "Not now",
    closeAria: "Close",
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

  // Arming: decide se abilitare i trigger. Skippa se già dismessa <7gg
  // o se la beta è full (in quel caso il popup non serve, c'è waitlist).
  useEffect(() => {
    if (isRecentlyDismissed()) return;
    setArmed(true);
  }, []);

  // Trigger: timer + scroll. Mostra il popup al primo che scatta.
  useEffect(() => {
    if (!armed || visible) return;
    if (spots.data?.isFull) return;

    const timeoutId = window.setTimeout(() => setVisible(true), TIME_TRIGGER_MS);

    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total <= 0) return;
      const pct = (scrolled / total) * 100;
      if (pct >= SCROLL_TRIGGER_PCT) {
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

  // Auto-hide se diventa full mentre il popup è già aperto
  useEffect(() => {
    if (visible && spots.data?.isFull) setVisible(false);
  }, [visible, spots.data?.isFull]);

  // Body scroll lock quando modal aperta
  useEffect(() => {
    if (!visible) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [visible]);

  if (!visible || !spots.data || spots.data.isFull) return null;

  const left = spots.data.spotsLeft;
  const copy = COPY[locale];
  const title = left <= 20 ? copy.titleFew(left) : copy.title(left);

  const dismiss = () => {
    markDismissed();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.kicker}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={copy.closeAria}
        onClick={dismiss}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-divider bg-bg-card shadow-2xl p-6 sm:p-8">
        <button
          type="button"
          aria-label={copy.closeAria}
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-white/5 transition"
        >
          <span aria-hidden className="text-lg leading-none">×</span>
        </button>

        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {copy.kicker}
        </p>

        <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary leading-tight">
          {title}
        </h2>

        {/* Counter progress */}
        <div className="mt-5">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-mono text-accent text-lg font-semibold">
              {spots.data.taken}
            </span>
            <span className="text-text-muted">/</span>
            <span className="font-mono text-text-secondary">
              {spots.data.total}
            </span>
            <span className="text-text-muted ml-1">
              {locale === "it" ? "posti occupati" : "spots taken"}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-aqua to-accent transition-all"
              style={{
                width: `${(spots.data.taken / spots.data.total) * 100}%`,
              }}
            />
          </div>
        </div>

        <p className="mt-5 text-text-secondary leading-relaxed text-sm">
          {copy.body}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={`/${locale}/beta`}
            onClick={() => markDismissed()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-pill btn-cta text-sm font-medium"
          >
            {copy.cta}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="text-text-muted hover:text-text-secondary transition text-xs"
          >
            {copy.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
