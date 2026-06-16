'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

type T = {
  heading: string;
  body: string;
  cta: string;
  working: string;
  doneTitle: string;
  doneBody: string;
  errorTitle: string;
};

// Tabelle di proprietà dell'utente: la RLS restituisce solo le sue righe,
// quindi un select('*') è già scoped. Quelle che non esistono/non leggibili
// vengono semplicemente saltate (incluse come errore non bloccante).
const TABLES = [
  'profiles',
  'privacy_consents',
  'user_settings',
  'devices',
  'fitness_metrics',
  'workouts',
  'caregiver_links',
  'group_members',
  'b2c_subscriptions',
  'challenge_participants',
  'challenge_scores',
  'user_roles',
] as const;

type Phase = 'idle' | 'working' | 'done' | 'error';

export function ExportDataClient({ locale, t }: { locale: string; t: T }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setErr(null);
    setPhase('working');
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr('Not authenticated');
        setPhase('error');
        return;
      }

      const bundle: Record<string, unknown> = {
        generated_at: new Date().toISOString(),
        account: { id: user.id, email: user.email },
        format: 'FitMesh Sync data export (GDPR art. 20) v1',
        data: {},
      };
      const data = bundle.data as Record<string, unknown>;

      for (const table of TABLES) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rows, error } = await (supabase.from(table) as any).select('*');
        data[table] = error ? { error: error.message } : rows;
      }

      // Marca export richiesto + completato + audit (best-effort).
      const now = new Date().toISOString();
      await supabase
        .from('privacy_consents')
        .upsert(
          { user_id: user.id, data_export_requested_at: now, data_export_completed_at: now } as never,
          { onConflict: 'user_id' },
        );
      await supabase
        .from('audit_logs')
        .insert({ user_id: user.id, action: 'data_exported', detail: { method: 'web_ui' } } as never);

      // Download del file JSON.
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitmesh-data-export-${now.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setPhase('done');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  };

  return (
    <section className="rounded-card border border-divider bg-bg-secondary p-6">
      <h2 className="font-display text-lg font-semibold text-text-primary">{t.heading}</h2>
      <p className="mt-2 text-sm text-text-secondary">{t.body}</p>

      {phase === 'done' ? (
        <div className="mt-4 rounded-card border border-success/40 bg-success/5 p-4">
          <p className="font-semibold text-text-primary text-sm">✓ {t.doneTitle}</p>
          <p className="mt-1 text-xs text-text-secondary">{t.doneBody}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={run}
          disabled={phase === 'working'}
          className="mt-4 px-5 py-2.5 rounded-pill bg-success text-bg-dark text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition"
        >
          {phase === 'working' ? t.working : t.cta}
        </button>
      )}

      {phase === 'error' && (
        <p role="alert" className="mt-3 text-sm text-error">
          {t.errorTitle}: {err}
        </p>
      )}
    </section>
  );
}
