'use client';

import { useState, useTransition } from 'react';

import { createClient } from '@/lib/supabase/client';

type Translations = {
  heading: string;
  description: string;
  deleteCta: string;
  confirmTitle: string;
  confirmBody: string;
  confirmInputLabel: string;
  confirmKeyword: string;
  confirmSubmit: string;
  cancelLabel: string;
  scheduledTitle: string;
  scheduledBody: string;
};

type Phase = 'idle' | 'confirming' | 'submitting' | 'scheduled' | 'error';

export function DeleteAccountSection({
  locale,
  translations: t,
}: {
  locale: string;
  translations: Translations;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const requestDeletion = () => {
    setError(null);
    startTransition(async () => {
      setPhase('submitting');
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPhase('error');
        setError('Not authenticated');
        return;
      }

      // Upsert privacy_consents con data_deletion_requested_at = now().
      // Cast `as never` per workaround typing complesso del SDK SSR — i tipi
      // reali arriveranno con `npm run supabase:gen-types` da DB live.
      const upsertPayload = {
        user_id: user.id,
        data_deletion_requested_at: new Date().toISOString(),
      };
      const { error: upsertErr } = await supabase
        .from('privacy_consents')
        .upsert(upsertPayload as never, { onConflict: 'user_id' });

      if (upsertErr) {
        setPhase('error');
        setError(upsertErr.message);
        return;
      }

      // Audit log
      const auditPayload = {
        user_id: user.id,
        action: 'deletion_requested',
        detail: { method: 'web_ui', grace_hours: 24 },
      };
      await supabase.from('audit_logs').insert(auditPayload as never);

      // Auto-logout
      await supabase.auth.signOut();
      setPhase('scheduled');

      // Redirect dopo 5 sec a home (no rush, l'utente legge il messaggio)
      setTimeout(() => {
        window.location.href = `/${locale}`;
      }, 5000);
    });
  };

  if (phase === 'scheduled') {
    return (
      <section className="rounded-card border border-success/40 bg-success/5 p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          ✓ {t.scheduledTitle}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">{t.scheduledBody}</p>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-error/40 bg-error/5 p-6">
      <h2 className="font-display text-lg font-semibold text-error">
        ⚠ {t.heading}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">{t.description}</p>

      {phase === 'idle' && (
        <button
          type="button"
          onClick={() => setPhase('confirming')}
          className="mt-4 px-5 py-2.5 rounded-pill border border-error/60 text-error text-sm font-medium hover:bg-error/10 transition"
        >
          {t.deleteCta}
        </button>
      )}

      {phase === 'confirming' && (
        <div className="mt-5 space-y-4">
          <div className="rounded-card border border-divider bg-bg-secondary p-4">
            <p className="font-semibold text-text-primary text-sm">{t.confirmTitle}</p>
            <p className="mt-2 text-xs text-text-secondary whitespace-pre-line">
              {t.confirmBody}
            </p>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">
              {t.confirmInputLabel}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-pill border border-divider bg-bg-secondary text-text-primary focus:outline-none focus:border-error/60 transition text-sm font-mono"
              autoFocus
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPhase('idle');
                setConfirmText('');
                setError(null);
              }}
              className="px-5 py-2.5 rounded-pill border border-divider text-text-primary text-sm hover:bg-white/5"
              disabled={isPending}
            >
              {t.cancelLabel}
            </button>
            <button
              type="button"
              onClick={requestDeletion}
              disabled={confirmText !== t.confirmKeyword || isPending}
              className="px-5 py-2.5 rounded-pill bg-error text-bg-dark text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {t.confirmSubmit}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
