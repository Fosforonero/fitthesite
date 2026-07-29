'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { RECOVERY_EMAIL_HANDOFF_KEY } from '@/lib/recovery/handoff';
import type { Locale } from '@/lib/i18n';
import type { ForgotPasswordTranslations } from './translations';

export function ForgotPasswordForm({
  locale,
  translations: t,
}: {
  locale: Locale;
  translations: ForgotPasswordTranslations;
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guardia REALE contro il doppio invio. Uno `useState` non basta: due
  // click nativi (o due 'Invio' da tastiera) dispacciati nello stesso turno
  // sincrono invocano l'handler due volte PRIMA che React committi il primo
  // aggiornamento di stato — entrambe le chiamate leggerebbero ancora
  // `submitting === false` dalla stessa closure. Un ref e' una lettura/
  // scrittura sincrona immediata, indipendente dal ciclo di render, quindi
  // chiude la finestra di corsa che lo stato da solo lascia aperta
  // (dimostrato da tools/check-password-recovery-e2e.ts, scenario 7).
  const submittingRef = useRef(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    // TUTTO cio' che segue e' dentro try/finally, non solo la fetch: se il
    // ref venisse resettato solo nel finally del blocco di rete, un return
    // anticipato per validazione fallita lo lascerebbe bloccato a `true`
    // per sempre, disabilitando il form in modo permanente.
    try {
      setError(null);
      const trimmed = email.trim();

      // Validazione minima lato client: serve solo a evitare una richiesta
      // palesemente inutile. Non e' un controllo di esistenza dell'account
      // e non deve diventarlo.
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setError(t.errorInvalidEmail);
        return;
      }

      setSubmitting(true);

      try {
        // Passa dalla NOSTRA route, non da Supabase direttamente: il rate
        // limit (per email e per IP) deve stare server-side, altrimenti non
        // protegge da nulla — vedi app/api/v1/auth/forgot-password/route.ts.
        await fetch('/api/v1/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, locale }),
        });

        // Deliberatamente NESSUNA ispezione della risposta per decidere
        // cosa mostrare: la route risponde sempre allo stesso modo
        // (indirizzo esistente, inesistente o limite superato). Guardarla
        // qui, o mostrare un messaggio diverso, ricreerebbe nel client
        // l'oracolo di esistenza account che il server ha appena eliminato.
        rememberEmailForResetStep(trimmed);
        setSent(true);
      } catch {
        // fetch() lancia solo per problemi di trasporto (offline, DNS): qui
        // non sappiamo nulla dell'account, quindi non riveliamo nulla.
        setError(t.errorNetwork);
      } finally {
        setSubmitting(false);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  if (sent) {
    return (
      <div className="rounded-card border border-divider bg-bg-card p-6 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-brand-green/15 flex items-center justify-center">
          <span className="text-brand-green text-2xl">✓</span>
        </div>
        <p className="text-text-primary font-medium">{t.neutralTitle}</p>
        <p className="mt-2 text-text-secondary leading-relaxed text-sm">{t.neutralBody}</p>
        <p className="mt-4 text-text-muted leading-relaxed text-sm">{t.codeExplainer}</p>
        <Link
          href={`/${locale}/auth/reset-password`}
          className="mt-6 inline-flex items-center px-5 py-2.5 rounded-pill btn-cta text-sm font-medium"
        >
          {t.goToReset}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4" noValidate>
      {error && (
        <div className="rounded-card border border-error/40 bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      <p className="text-sm text-text-muted leading-relaxed">{t.codeExplainer}</p>

      <div>
        <label className="block text-sm text-text-secondary mb-1.5" htmlFor="email">
          {t.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          className="w-full rounded-pill border border-divider bg-bg-card px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-aqua disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="w-full rounded-pill btn-cta py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t.sending : t.submit}
      </button>

      <p className="text-center">
        <Link href={`/${locale}`} className="text-sm text-text-secondary hover:text-text-primary transition">
          {t.backToLogin}
        </Link>
      </p>
    </form>
  );
}

/**
 * Passaggio dell'email allo step successivo SENZA metterla nell'URL: un
 * indirizzo in query string finisce in cronologia, bookmark, log del server
 * e header `Referer` verso qualunque terza parte caricata dalla pagina
 * successiva. `sessionStorage` resta nel tab e muore con esso.
 *
 * Best-effort per definizione: in navigazione privata, con storage pieno o
 * con i cookie di terze parti bloccati puo' lanciare. In quel caso non
 * succede nulla di grave — la pagina di reset chiedera' l'email a mano.
 */
function rememberEmailForResetStep(email: string): void {
  try {
    window.sessionStorage.setItem(RECOVERY_EMAIL_HANDOFF_KEY, email);
  } catch {
    // Volutamente silenzioso: non e' un errore che l'utente possa risolvere.
  }
}
