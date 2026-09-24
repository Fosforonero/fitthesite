'use client';

import { useState } from 'react';

import {
  EXPORT_TABLE_ORDER,
  EXPORT_TABLES,
  getExportColumns,
  scopeToOwner,
} from '@/lib/privacy/export-scope';
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

const PAGE_SIZE = 1000;

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

      const exportUserId = user.id;

      const bundle: Record<string, unknown> = {
        generated_at: new Date().toISOString(),
        account: { id: exportUserId, email: user.email },
        format: 'FitMesh Sync data export (GDPR art. 20) v1',
        data: {},
      };
      const data = bundle.data as Record<string, unknown>;

      for (const table of EXPORT_TABLES) {
        // Verifica cambio di sessione durante l'export: se l'utente scade o cambia
        // mid-flight, interrompi immediatamente (nessun dato esportato sotto sessione mista).
        const {
          data: { user: currentUser },
          error: sessionErr,
        } = await supabase.auth.getUser();
        if (sessionErr || !currentUser?.id || currentUser.id !== exportUserId) {
          setErr(t.errorTitle);
          setPhase('error');
          return;
        }

        const columns = getExportColumns(table);
        const orderCol = EXPORT_TABLE_ORDER[table];
        let from = 0;
        let hasMore = true;
        const tableRows: unknown[] = [];

        // Paginazione deterministica con blocco da 1.000 righe per superare
        // il limite max-rows di PostgREST e garantire l'anti-troncamento.
        while (hasMore) {
          // Se la paginazione richiede più chiamate, riverifica la sessione
          if (from > 0) {
            const {
              data: { user: loopUser },
              error: loopSessionErr,
            } = await supabase.auth.getUser();
            if (loopSessionErr || !loopUser?.id || loopUser.id !== exportUserId) {
              setErr(t.errorTitle);
              setPhase('error');
              return;
            }
          }

          const to = from + PAGE_SIZE - 1;
          const query = scopeToOwner(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase.from(table) as any).select(columns, { count: 'exact' }),
            table,
            exportUserId,
          )
            .order(orderCol, { ascending: true })
            .range(from, to);

          const { data: pageRows, count, error } = await query;

          // FAIL-CLOSED: qualsiasi errore o valore non-array interrompe l'export immediatamente.
          // Nessun file parziale viene generato o scaricato, nessun timestamp di completamento viene
          // scritto, e nessun dettaglio tecnico del database viene esposto.
          if (error || !Array.isArray(pageRows)) {
            setErr(t.errorTitle);
            setPhase('error');
            return;
          }

          tableRows.push(...pageRows);

          if (typeof count === 'number') {
            if (tableRows.length >= count) {
              hasMore = false;
            } else if (pageRows.length === 0) {
              // Troncamento inatteso: il conteggio totale dichiarato è maggiore delle righe restituite
              setErr(t.errorTitle);
              setPhase('error');
              return;
            }
          } else {
            if (pageRows.length < PAGE_SIZE) {
              hasMore = false;
            }
          }

          from += PAGE_SIZE;
        }

        data[table] = tableRows;
      }

      // Verifica di completezza prima del timbro e del download: tutte le 12
      // tabelle devono essere state estratte con successo.
      if (Object.keys(data).length !== EXPORT_TABLES.length) {
        setErr(t.errorTitle);
        setPhase('error');
        return;
      }

      // Scrittura timbro di richiesta e completamento con verifica di errore
      const now = new Date().toISOString();
      const { error: consentErr } = await supabase
        .from('privacy_consents')
        .upsert(
          {
            user_id: exportUserId,
            data_export_requested_at: now,
            data_export_completed_at: now,
          } as never,
          { onConflict: 'user_id' },
        );
      if (consentErr) {
        // Fallimento scrittura consensi: interrompi senza scaricare il file
        setErr(t.errorTitle);
        setPhase('error');
        return;
      }

      // Scrittura audit log con verifica di errore
      const { error: auditErr } = await supabase
        .from('audit_logs')
        .insert({
          user_id: exportUserId,
          action: 'data_exported',
          detail: { method: 'web_ui' },
        } as never);
      if (auditErr) {
        // Fallimento scrittura log di audit: interrompi senza scaricare il file
        setErr(t.errorTitle);
        setPhase('error');
        return;
      }

      // Download del file JSON completo solo dopo che tutte le scritture sono riuscite.
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
