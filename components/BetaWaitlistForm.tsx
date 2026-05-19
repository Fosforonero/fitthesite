"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Locale } from "@/lib/i18n";

type Status = "idle" | "submitting" | "success" | "error";

const COPY: Record<Locale, {
  emailLabel: string;
  emailPh: string;
  emailInvalid: string;
  emailRequired: string;
  referralLabel: string;
  referralSelect: string;
  referralInstagram: string;
  referralLinkedin: string;
  referralFriend: string;
  referralSearch: string;
  referralPress: string;
  referralOther: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successText: string;
  errorAlready: string;
  errorGeneric: string;
  errorBot: string;
  errorRate: string;
}> = {
  it: {
    emailLabel: "La tua email",
    emailPh: "tu@esempio.it",
    emailInvalid: "Inserisci un'email valida",
    emailRequired: "L'email è obbligatoria",
    referralLabel: "Come ci hai trovato? (opzionale)",
    referralSelect: "Seleziona…",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Amico / passaparola",
    referralSearch: "Ricerca Google",
    referralPress: "Articolo / blog",
    referralOther: "Altro",
    submit: "Avvisami al prossimo round",
    submitting: "Invio…",
    successTitle: "Sei in lista d'attesa",
    successText: "Ti scriviamo quando apriamo nuovi posti founder. Niente marketing, solo l'annuncio.",
    errorAlready: "Sei già in lista d'attesa con questa email.",
    errorGeneric: "Qualcosa è andato storto. Riprova fra poco.",
    errorBot: "Verifica anti-bot fallita. Ricarica la pagina.",
    errorRate: "Troppe richieste. Riprova fra qualche minuto.",
  },
  en: {
    emailLabel: "Your email",
    emailPh: "you@example.com",
    emailInvalid: "Enter a valid email",
    emailRequired: "Email is required",
    referralLabel: "How did you find us? (optional)",
    referralSelect: "Select…",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Friend / word of mouth",
    referralSearch: "Google search",
    referralPress: "Article / blog",
    referralOther: "Other",
    submit: "Notify me at the next round",
    submitting: "Submitting…",
    successTitle: "You're on the waitlist",
    successText: "We'll email you when we open new founder spots. No marketing, just the announcement.",
    errorAlready: "You're already on the waitlist with this email.",
    errorGeneric: "Something went wrong. Try again shortly.",
    errorBot: "Bot check failed. Reload the page.",
    errorRate: "Too many requests. Try again in a few minutes.",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BetaWaitlistForm({ locale }: { locale: Locale }) {
  const c = COPY[locale];

  const [email, setEmail] = useState("");
  const [referral, setReferral] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const formLoadedAt = useRef(Date.now());

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    formLoadedAt.current = Date.now();
  }, []);

  const emailError = useMemo(() => {
    if (!email) return touched ? c.emailRequired : "";
    if (!EMAIL_RE.test(email)) return c.emailInvalid;
    return "";
  }, [email, touched, c.emailInvalid, c.emailRequired]);

  const canSubmit = !emailError && email.length > 0 && status !== "submitting";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setStatus("submitting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/beta/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          referral: referral || null,
          _hp: hp,
          _form_loaded_at: formLoadedAt.current,
        }),
      });

      if (res.ok) {
        setStatus("success");
        return;
      }

      const json: { error?: string } = await res.json().catch(() => ({}));
      const code = json.error ?? "generic";
      let msg = c.errorGeneric;
      if (code === "already_on_waitlist") msg = c.errorAlready;
      else if (code === "bot_detected") msg = c.errorBot;
      else if (code === "too_many_requests") msg = c.errorRate;
      setErrorMsg(msg);
      setStatus("error");
    } catch {
      setErrorMsg(c.errorGeneric);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {c.successTitle}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {c.successText}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Honeypot field — hidden from humans */}
      <input
        type="text"
        name="_hp"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none -left-[9999px]"
      />

      <div>
        <label htmlFor="waitlist-email" className="block text-sm font-medium text-text-primary mb-1.5">
          {c.emailLabel}
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={c.emailPh}
          className="w-full px-4 py-3 rounded-xl border border-divider bg-bg-secondary/40 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "waitlist-email-err" : undefined}
        />
        {emailError && (
          <p id="waitlist-email-err" className="mt-1.5 text-xs text-error">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="waitlist-referral" className="block text-sm font-medium text-text-primary mb-1.5">
          {c.referralLabel}
        </label>
        <select
          id="waitlist-referral"
          value={referral}
          onChange={(e) => setReferral(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-divider bg-bg-secondary/40 text-text-primary focus:outline-none focus:border-accent transition"
        >
          <option value="">{c.referralSelect}</option>
          <option value="instagram">{c.referralInstagram}</option>
          <option value="linkedin">{c.referralLinkedin}</option>
          <option value="friend">{c.referralFriend}</option>
          <option value="search">{c.referralSearch}</option>
          <option value="press">{c.referralPress}</option>
          <option value="other">{c.referralOther}</option>
        </select>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-pill btn-cta text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {status === "submitting" ? c.submitting : c.submit}
      </button>
    </form>
  );
}
