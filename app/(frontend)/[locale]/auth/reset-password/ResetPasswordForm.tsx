'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createRecoveryClient } from '@/lib/supabase/recovery-client';
import { classifyRecoveryError } from '@/lib/recovery/classify-error';
import type { Locale } from '@/lib/i18n';

export interface ResetPasswordTranslations {
  emailLabel: string;
  emailPlaceholder: string;
  otpLabel: string;
  otpPlaceholder: string;
  otpHint: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmLabel: string;
  submit: string;
  saving: string;
  success: string;
  errorMissingFields: string;
  errorTooShort: string;
  errorMismatch: string;
  errorExpiredOrUsed: string;
  errorRateLimited: string;
  errorNetwork: string;
  errorGeneric: string;
  backToLogin: string;
}

function messageFor(t: ResetPasswordTranslations, kind: ReturnType<typeof classifyRecoveryError>): string {
  switch (kind) {
    case 'expired_or_used':
      return t.errorExpiredOrUsed;
    case 'rate_limited':
      return t.errorRateLimited;
    case 'network':
      return t.errorNetwork;
    default:
      return t.errorGeneric;
  }
}

export function ResetPasswordForm({
  locale,
  translations,
}: {
  locale: Locale;
  translations: ResetPasswordTranslations;
}) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail || !trimmedOtp) {
      setError(translations.errorMissingFields);
      return;
    }
    if (password.length < 8) {
      setError(translations.errorTooShort);
      return;
    }
    if (password !== confirm) {
      setError(translations.errorMismatch);
      return;
    }

    setSubmitting(true);

    try {
      // Client isolato, istanza nuova per questo submit: mai il singleton
      // cookie-backed del sito, nessuna sessione ambient puo' influenzare
      // questo flusso (vedi lib/supabase/recovery-client.ts).
      const recovery = createRecoveryClient();

      const { error: verifyErr } = await recovery.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedOtp,
        type: 'recovery',
      });

      if (verifyErr) {
        setError(messageFor(translations, classifyRecoveryError(verifyErr)));
        return;
      }

      const { error: updateErr } = await recovery.auth.updateUser({ password });

      if (updateErr) {
        setError(messageFor(translations, classifyRecoveryError(updateErr)));
        return;
      }

      // Igiene: anche se persistSession:false non scrive nulla su disco,
      // questo chiude esplicitamente lo stato in-memory del client appena
      // usato invece di lasciarlo alla garbage collection.
      await recovery.auth.signOut({ scope: 'local' });

      setDone(true);
    } catch (rawError) {
      // fetch() a livello di rete (DNS, offline, CORS) lancia invece di
      // restituire { error }: senza questo catch la UI resterebbe bloccata
      // su "submitting" per sempre, senza alcun messaggio.
      setError(messageFor(translations, classifyRecoveryError(rawError)));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-divider bg-bg-card p-6 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-brand-green/15 flex items-center justify-center">
          <span className="text-brand-green text-2xl">✓</span>
        </div>
        <p className="text-text-primary leading-relaxed">{translations.success}</p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-flex items-center px-5 py-2.5 rounded-pill btn-cta text-sm font-medium"
        >
          {translations.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      {error && (
        <div className="rounded-card border border-error/40 bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-text-secondary mb-1.5" htmlFor="email">
          {translations.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={translations.emailPlaceholder}
          className="w-full rounded-pill border border-divider bg-bg-card px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-aqua disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1.5" htmlFor="otp">
          {translations.otpLabel}
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          disabled={submitting}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder={translations.otpPlaceholder}
          className="w-full rounded-pill border border-divider bg-bg-card px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-aqua disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-text-muted">{translations.otpHint}</p>
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1.5" htmlFor="password">
          {translations.passwordLabel}
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          disabled={submitting}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={translations.passwordPlaceholder}
          className="w-full rounded-pill border border-divider bg-bg-card px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-aqua disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1.5" htmlFor="confirm">
          {translations.confirmLabel}
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          disabled={submitting}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-pill border border-divider bg-bg-card px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-aqua disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-pill btn-cta py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? translations.saving : translations.submit}
      </button>
    </form>
  );
}
