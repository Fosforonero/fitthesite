'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Locale } from '@/lib/i18n';

interface Translations {
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmLabel: string;
  submit: string;
  saving: string;
  success: string;
  errorTooShort: string;
  errorMismatch: string;
  errorMissingToken: string;
  errorGeneric: string;
  backToLogin: string;
}

export function ResetPasswordForm({
  locale,
  translations,
}: {
  locale: Locale;
  translations: Translations;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const search = typeof window !== 'undefined' ? window.location.search : '';

    async function init() {
      // Supabase recovery email link arriva con #access_token=...&type=recovery
      // (legacy implicit flow) OPPURE ?code=... (PKCE flow nuovo).
      // Proviamo entrambi in ordine.
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const queryParams = new URLSearchParams(search);
      const code = queryParams.get('code');

      if (accessToken && refreshToken) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setErr) {
          setError(translations.errorMissingToken);
          return;
        }
        setSessionReady(true);
        return;
      }

      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          setError(translations.errorMissingToken);
          return;
        }
        setSessionReady(true);
        return;
      }

      // Nessun token nei params: l'utente ha aperto la pagina manualmente.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSessionReady(true);
      } else {
        setError(translations.errorMissingToken);
      }
    }

    void init();
  }, [translations.errorMissingToken]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(translations.errorTooShort);
      return;
    }
    if (password !== confirm) {
      setError(translations.errorMismatch);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateErr) {
      setError(translations.errorGeneric);
      return;
    }
    setDone(true);
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
        <label className="block text-sm text-text-secondary mb-1.5" htmlFor="password">
          {translations.passwordLabel}
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          disabled={!sessionReady || submitting}
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
          disabled={!sessionReady || submitting}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-pill border border-divider bg-bg-card px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-aqua disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={!sessionReady || submitting}
        className="w-full rounded-pill btn-cta py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? translations.saving : translations.submit}
      </button>
    </form>
  );
}
