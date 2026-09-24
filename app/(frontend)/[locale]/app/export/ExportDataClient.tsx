'use client';

import { useState } from 'react';

import { EXPORT_TABLES, getExportColumns, scopeToOwner } from '@/lib/privacy/export-scope';
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
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user?.id) {
        setErr(t.errorTitle);
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

      for (const table of EXPORT_TABLES) {
        // La RLS dice cosa l'utente PUO' leggere, non cosa e' suo: admin, membri di
        // gruppo e co-partecipanti a una sfida leggono anche righe altrui. Ogni
        // query e' filtrata sul proprietario e su una whitelist esplicita di colonne
        // (lib/privacy/export-scope.ts), senza mai usare select('*').
        const columns = getExportColumns(table);
        const { data: rows, error } = await scopeToOwner(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from(table) as any).select(columns),
          table,
          user.id,
        );

        // FAIL-CLOSED: se una sola tabella fallisce o non restituisce un array,
        // l'intero export viene interrotto immediatamente. Nessun file parziale
        // viene generato o scaricato, nessun timestamp di completamento viene
        // scritto, e nessun dettaglio tecnico del database viene esposto.
        if (error || !Array.isArray(rows)) {
          setErr(t.errorTitle);
          setPhase('error');
          return;
        }

        data[table] = rows;
      }

      // Verifica di completezza prima del timbro e del download: tutte le 12
      // tabelle devono essere state estratte con successo.
      if (Object.keys(data).length !== EXPORT_TABLES.length) {
        setErr(t.errorTitle);
        setPhase('error');
        return;
      }

      // Marca export richiesto + completato + audit solo dopo esito positivo completo.
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

      // Download del file JSON completo.
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
    } catch (_e) {
      // In caso di eccezione inattesa, non esporre mai stack trace o dettagli
      // tecnici dell'infrastruttura/database.
      setErr(t.errorTitle);
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
          {err ?? t.errorTitle}
        </p>
      )}
    </section>
  );
}
