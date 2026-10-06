'use client';

import { useState } from 'react';

import {
  EXPORT_TABLE_ORDER,
  EXPORT_TABLES,
  getExportColumns,
  getTableRowKey,
  RawCaregiverLink,
  rowBelongsToOwner,
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
      // Tabelle lette con successo. Una tabella che la RLS o la rete non lasciano leggere NON ferma
      // l'export (come prima della #96): finisce nel file come non disponibile, senza righe e senza
      // il testo dell'errore. Se NESSUNA tabella e' leggibile non c'e' nessun file e nessun timbro.
      let tabelleLette = 0;

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
        let tabellaNonDisponibile = false;

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

          // Errore di lettura della tabella (policy RLS rotta, rete, colonna mancante): le righe di
          // questa tabella, anche quelle di pagine precedenti, NON entrano nel file; la tabella e'
          // marcata non disponibile e l'export prosegue con le altre. Non puo' far uscire righe altrui
          // (nessuna riga e' esportata) e non espone il testo dell'errore del database.
          if (error) {
            tabellaNonDisponibile = true;
            break;
          }

          // FAIL-CLOSED: una risposta senza errore che non e' un array e' una forma inattesa: l'export
          // si interrompe, senza file e senza timbro.
          if (!Array.isArray(pageRows)) {
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

          // CONTROLLO DELLE RIGHE RESTITUITE (difesa in profondita', dopo il filtro): se anche
          // UNA sola riga non e' dell'utente (filtro ignorato, policy RLS che ne lascia passare
          // altre, proiezione cambiata) l'export si ferma. Nessun file, nessun timbro, nessun audit,
          // e nessun dettaglio della riga altrui viene mostrato o registrato.
          for (const row of pageRows) {
            if (
              typeof row !== 'object' ||
              row === null ||
              !rowBelongsToOwner(table, row as Record<string, unknown>, exportUserId)
            ) {
              setErr(t.errorTitle);
              setPhase('error');
              return;
            }
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

        if (tabellaNonDisponibile) {
          data[table] = { error: 'unavailable' };
          continue;
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
        tabelleLette += 1;
      }

      // Nessuna tabella leggibile (sessione scaduta lato server, rete assente, RLS rotta ovunque):
      // un file fatto di soli «non disponibile» sarebbe un export vuoto presentato come completo.
      if (tabelleLette === 0) {
        setErr(t.errorTitle);
        setPhase('error');
        return;
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

      // Audit e timbro di completamento sono BEST-EFFORT, come prima della #96: la RLS di audit_logs
      // non ha una policy INSERT per l'utente («INSERT: solo via service_role», init_events_audit.sql),
      // quindi un esito negativo non deve togliere all'utente i propri dati (GDPR art. 15 e 20).
      // L'errore e' ignorato di proposito; l'ordine (audit, poi timbro) resta, e fra le scritture e il
      // download non c'e' nessun altro await.
      const now = new Date().toISOString();
      await supabase.from('audit_logs').insert({
        user_id: exportUserId,
        action: 'data_exported',
        detail: { method: 'web_ui' },
      } as never);
      await supabase.from('privacy_consents').upsert(
        {
          user_id: exportUserId,
          data_export_requested_at: now,
          data_export_completed_at: now,
        } as never,
        { onConflict: 'user_id' },
      );

      // Nessuna riverifica di sessione DOPO le scritture: un abort qui lascerebbe audit e timbro di
      // completamento senza il file. L'ultimo controllo e' quello PRIMA delle scritture; da qui al
      // download non c'e' altro await (il file e' gia' costruito sotto la sessione verificata).

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
