'use client';

import { useState, useTransition } from 'react';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/client';

const emailSchema = z.string().email();

type Phase = 'idle' | 'sending' | 'sent' | 'error';

type Props = {
  locale: string;
  nextPath?: string;
  translations: {
    emailLabel: string;
    emailPlaceholder: string;
    submitLabel: string;
    sendingLabel: string;
    successTitle: string;
    successBody: string;
    tryAgain: string;
  };
  initialError: string | null;
};

export function LoginForm({ locale, nextPath, translations, initialError }: Props) {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>(initialError ? 'error' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setPhase('error');
      setErrorMessage('Email non valida');
      return;
    }

    startTransition(async () => {
      setPhase('sending');
      const supabase = createClient();
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/${locale}/auth/callback${
        nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''
      }`;

      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setPhase('error');
        setErrorMessage(error.message);
        return;
      }
      setPhase('sent');
    });
  };

  if (phase === 'sent') {
    return (
      <div className="rounded-card border border-divider bg-bg-card p-6 text-center">
        <div className="text-4xl mb-3">📧</div>
        <h2 className="font-display text-xl font-semibold text-text-primary">
          {translations.successTitle}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">{translations.successBody}</p>
        <button
          type="button"
          onClick={() => setPhase('idle')}
          className="mt-5 text-sm text-brand-aqua hover:underline"
        >
          {translations.tryAgain}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
          {translations.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={translations.emailPlaceholder}
          className="w-full px-4 py-3 rounded-pill border border-divider bg-bg-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-aqua transition"
          disabled={isPending}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-error">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-5 py-3 rounded-pill bg-brand-gradient text-bg-dark font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? translations.sendingLabel : translations.submitLabel}
      </button>
    </form>
  );
}
