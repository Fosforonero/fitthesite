'use client';

import { useState } from 'react';

import {
  EXPORT_TABLE_ORDER,
  EXPORT_TABLES,
  getExportColumns,
  getTableRowKey,
  RawCaregiverLink,
  sanitizeCaregiverLink,
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
        const orderCols = EXPORT_TABLE_ORDER[table];
        let from = 0;
        let hasMore = true;
        const tableRows: Record<string, unknown>[] = [];
        const seenKeys = new Set<string>();
        let expectedCount: number | null = null;

        // Paginazione deterministica con ordine totale e blocco da 1.000 righe per superare
        // il limite max-rows di PostgREST e garantire l'anti-troncamento e l'assenza di duplicati.
        while (hasMore) {
          // Se la paginazione richiede piu' chiamate, riverifica la sessione
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
          let query = scopeToOwner(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase.from(table) as any).select(columns, { count: 'exact' }),
            table,
            exportUserId,
          );

          // Applicazione ordine totale su tutte le colonne della chiave
          for (const col of orderCols) {
            query = query.order(col, { ascending: true });
          }

          query = query.range(from, to);

          const { data: pageRows, count, error } = await query;

          // FAIL-CLOSED: qualsiasi errore o valore non-array interrompe l'export immediatamente.
          // Nessun file parziale viene generato o scaricato, nessun timestamp di completamento viene
          // scritto, e nessun dettaglio tecnico del database viene esposto.
          if (error || !Array.isArray(pageRows)) {
            setErr(t.errorTitle);
            setPhase('error');
            return;
          }

          // FAIL-CLOSED: count nullo o non numerico interrompe immediatamente.
          if (typeof count !== 'number') {
            setErr(t.errorTitle);
            setPhase('error');
            return;
          }

          if (expectedCount === null) {
            expectedCount = count;
          } else if (expectedCount !== count) {
            // Incoerenza di conteggio tra pagine successive (mutazione concorrente)
            setErr(t.errorTitle);
            setPhase('error');
            return;
          }

          for (const row of pageRows) {
            const rowObj = row as Record<string, unknown>;
            const rowKey = getTableRowKey(table, rowObj);
            if (seenKeys.has(rowKey)) {
              // Duplicato rilevato durante la paginazione: ordine non deterministico!
              setErr(t.errorTitle);
              setPhase('error');
              return;
            }
            seenKeys.add(rowKey);
            tableRows.push(rowObj);
          }

          if (tableRows.length >= expectedCount) {
            hasMore = false;
          } else if (pageRows.length === 0) {
            // Troncamento inatteso: il conteggio totale dichiarato e' maggiore delle righe restituite
            setErr(t.errorTitle);
            setPhase('error');
            return;
          }

          from += PAGE_SIZE;
        }

        // FAIL-CLOSED: Corrispondenza esatta fra conteggio e righe uniche
        if (
          expectedCount === null ||
          tableRows.length !== expectedCount ||
          seenKeys.size !== expectedCount
        ) {
          setErr(t.errorTitle);
          setPhase('error');
          return;
        }

        // Trattamento caregiver_links: Opzione B (GDPR art. 20 c. 4).
        // Gli identificativi della controparte vengono rimossi prima di popolare il bundle.
        if (table === 'caregiver_links') {
          data[table] = (tableRows as unknown as RawCaregiverLink[]).map((r) =>
            sanitizeCaregiverLink(r, exportUserId),
          );
        } else {
          data[table] = tableRows;
        }
      }

      // Verifica di completezza prima del timbro e del download: tutte le 12
      // tabelle devono essere state estratte con successo.
      if (Object.keys(data).length !== EXPORT_TABLES.length) {
        setErr(t.errorTitle);
        setPhase('error');
        return;
      }

      // Pre-scrittura session check: sessione ancora integra prima delle mutazioni
      const {
        data: { user: preWriteUser },
        error: preWriteSessionErr,
      } = await supabase.auth.getUser();
      if (preWriteSessionErr || !preWriteUser?.id || preWriteUser.id !== exportUserId) {
        setErr(t.errorTitle);
        setPhase('error');
        return;
      }

      // Scrittura audit log PRIMA del timbro completato:
      // Se l'audit fallisce, data_export_completed_at NON viene mai scritto
      // nel database, evitando di lasciare un falso completato.
      const now = new Date().toISOString();
      const { error: auditErr } = await supabase
        .from('audit_logs')
        .insert({
          user_id: exportUserId,
          action: 'data_exported',
          detail: { method: 'web_ui' },
        } as never);
      if (auditErr) {
        // Fallimento scrittura log di audit: interrompi senza timbro completato ne' download
        setErr(t.errorTitle);
        setPhase('error');
        return;
      }

      // Scrittura timbro di richiesta e completamento SOLO DOPO che l'audit ha avuto successo.
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

      // Riverifica della sessione PRIMA della consegna del file (download)
      const {
        data: { user: deliveryUser },
        error: deliverySessionErr,
      } = await supabase.auth.getUser();
      if (deliverySessionErr || !deliveryUser?.id || deliveryUser.id !== exportUserId) {
        setErr(t.errorTitle);
        setPhase('error');
        return;
      }

      // Download del file JSON completo solo dopo che tutte le verifiche e scritture sono riuscite.
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
