import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EXPORT_OWNER_SCOPE,
  EXPORT_TABLE_ORDER,
  EXPORT_TABLES,
  getExportColumns,
} from '@/lib/privacy/export-scope';

/**
 * L'export web deve consegnare SOLO le righe dell'utente, anche quando la RLS
 * ne lascia leggere altre (admin, membri di gruppo, co-partecipanti).
 */

const ME = '10000000-0000-4000-8000-000000000006';
const OTHER = '10000000-0000-4000-8000-000000000007';
const OTHER_2 = '10000000-0000-4000-8000-000000000008';
const COUNTERPARTY = '10000000-0000-4000-8000-000000000099';

type Row = Record<string, unknown>;

function fixtureFor(table: string): Row[] {
  const scope = EXPORT_OWNER_SCOPE[table as keyof typeof EXPORT_OWNER_SCOPE];
  if ('column' in scope) {
    return [{ [scope.column]: ME, marker: 'MIA' }, { [scope.column]: OTHER, marker: 'ALTRUI' }];
  }
  return [
    { caregiver_id: ME, subject_id: COUNTERPARTY, marker: 'MIA' },
    { caregiver_id: COUNTERPARTY, subject_id: ME, marker: 'MIA' },
    { caregiver_id: OTHER, subject_id: OTHER_2, marker: 'ALTRUI' },
  ];
}

type Recorder = {
  table: string;
  columns?: string;
  countOpt?: string;
  filters: string[];
  order?: { column: string; ascending: boolean };
  ranges: Array<{ from: number; to: number }>;
};

let recorded: Recorder[] = [];
let blobParts: string[] = [];
let writes: Array<{ table: string; op: 'upsert' | 'insert'; payload: Row }> = [];
let downloads: string[] = [];

let currentUserOverride: { id: string; email?: string } | null = {
  id: ME,
  email: 'synth-admin@example.invalid',
};
let getUserCallCount = 0;
let changeUserOnCallIndex: number | null = null;
let newUserIdOnChange: string | null = null;

let tableErrorOverride: Record<string, { message: string }> = {};
let tableDataOverride: Record<string, Row[]> = {};
let tableTotalCountOverride: Record<string, number> = {};
let consentUpsertError: { message: string } | null = null;
let auditInsertError: { message: string } | null = null;

function makeSupabase() {
  return {
    auth: {
      getUser: async () => {
        getUserCallCount++;
        if (changeUserOnCallIndex !== null && getUserCallCount >= changeUserOnCallIndex) {
          if (!newUserIdOnChange) {
            return { data: { user: null }, error: { message: 'Session expired' } };
          }
          return {
            data: { user: { id: newUserIdOnChange, email: 'changed@example.invalid' } },
            error: null,
          };
        }
        return {
          data: { user: currentUserOverride },
          error: currentUserOverride ? null : { message: 'No user' },
        };
      },
    },
    from(table: string) {
      let rec = recorded.find((r) => r.table === table);
      if (!rec) {
        rec = { table, filters: [], ranges: [] };
        recorded.push(rec);
      }
      const filters: Array<(r: Row) => boolean> = [];
      let currentRange: { from: number; to: number } | null = null;

      const builder = {
        select: (cols?: string, opts?: { count?: string }) => {
          rec!.columns = cols;
          rec!.countOpt = opts?.count;
          return builder;
        },
        eq: (col: string, val: string) => {
          rec!.filters.push(`eq:${col}=${val}`);
          filters.push((r) => r[col] === val);
          return builder;
        },
        or: (expr: string) => {
          rec!.filters.push(`or:${expr}`);
          const parts = expr.split(',').map((p) => p.split('.eq.'));
          filters.push((r) => parts.some(([c, v]) => r[c] === v));
          return builder;
        },
        order: (col: string, options: { ascending: boolean }) => {
          rec!.order = { column: col, ascending: options.ascending };
          return builder;
        },
        range: (from: number, to: number) => {
          rec!.ranges.push({ from, to });
          currentRange = { from, to };
          return builder;
        },
        upsert: async (payload: Row) => {
          writes.push({ table, op: 'upsert', payload });
          if (table === 'privacy_consents' && consentUpsertError) {
            return { error: consentUpsertError };
          }
          return { error: null };
        },
        insert: async (payload: Row) => {
          writes.push({ table, op: 'insert', payload });
          if (table === 'audit_logs' && auditInsertError) {
            return { error: auditInsertError };
          }
          return { error: null };
        },
        then: (resolve: (v: { data: unknown; count: number | null; error: unknown }) => unknown) => {
          if (tableErrorOverride[table]) {
            return resolve({ data: null, count: null, error: tableErrorOverride[table] });
          }
          const allRows =
            table in tableDataOverride
              ? tableDataOverride[table]
              : fixtureFor(table).filter((r) => filters.every((f) => f(r)));

          const totalCount =
            table in tableTotalCountOverride ? tableTotalCountOverride[table] : allRows.length;

          let sliced = allRows;
          if (currentRange) {
            sliced = allRows.slice(currentRange.from, currentRange.to + 1);
          }

          return resolve({
            data: sliced,
            count: totalCount,
            error: null,
          });
        },
      };
      return builder;
    },
  };
}

vi.mock('@/lib/supabase/client', () => ({ createClient: () => makeSupabase() }));

import { ExportDataClient } from './ExportDataClient';

const T = {
  heading: 'Export',
  body: 'body',
  cta: 'Scarica',
  working: 'Attendere',
  doneTitle: 'Fatto',
  doneBody: 'ok',
  errorTitle: 'Errore durante export',
};

beforeEach(() => {
  recorded = [];
  blobParts = [];
  writes = [];
  downloads = [];
  currentUserOverride = { id: ME, email: 'synth-admin@example.invalid' };
  getUserCallCount = 0;
  changeUserOnCallIndex = null;
  newUserIdOnChange = null;
  tableErrorOverride = {};
  tableDataOverride = {};
  tableTotalCountOverride = {};
  consentUpsertError = null;
  auditInsertError = null;
  vi.stubGlobal(
    'Blob',
    class {
      constructor(parts: string[]) {
        blobParts.push(...parts);
      }
    },
  );
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function runExport() {
  render(<ExportDataClient locale="it" t={T} />);
  fireEvent.click(screen.getByRole('button', { name: T.cta }));
  await waitFor(() => expect(screen.getByText(/Fatto/)).toBeInTheDocument());
  return JSON.parse(blobParts.join('')) as { data: Record<string, Row[]> };
}

describe('ExportDataClient: ambito e proprietario', () => {
  it('interroga tutte le tabelle previste con filtro e ordinamento deterministico', async () => {
    await runExport();
    for (const table of EXPORT_TABLES) {
      const rec = recorded.find((r) => r.table === table);
      expect(rec, `nessuna lettura di ${table}`).toBeDefined();
      expect(rec!.filters.length, `${table} letta senza filtro`).toBeGreaterThan(0);
      expect(rec!.filters.join(' ')).toContain(ME);
      expect(rec!.columns).toBe(getExportColumns(table));
      expect(rec!.columns).not.toContain('*');
      expect(rec!.order?.column).toBe(EXPORT_TABLE_ORDER[table]);
      expect(rec!.order?.ascending).toBe(true);
      expect(rec!.ranges.length).toBeGreaterThan(0);
    }
  });

  it('non scrive nel file nessuna riga altrui, su nessuna tabella', async () => {
    const bundle = await runExport();
    for (const table of EXPORT_TABLES) {
      const rows = bundle.data[table];
      expect(Array.isArray(rows), `${table} non e' un array`).toBe(true);
      expect(rows.length, `${table}: righe proprie attese`).toBe(table === 'caregiver_links' ? 2 : 1);
      for (const r of rows) {
        expect(r.marker, `${table}: riga altrui nel file`).toBe('MIA');
      }
    }
    expect(JSON.stringify(bundle)).not.toContain(OTHER);
  });

  it('il flusso completo scrive timbro, audit e avvia il download del JSON', async () => {
    await runExport();
    const timbro = writes.find((w) => w.table === 'privacy_consents' && w.op === 'upsert');
    expect(timbro?.payload).toMatchObject({ user_id: ME });
    expect(timbro?.payload).toHaveProperty('data_export_requested_at');
    expect(timbro?.payload).toHaveProperty('data_export_completed_at');
    const audit = writes.find((w) => w.table === 'audit_logs' && w.op === 'insert');
    expect(audit?.payload).toMatchObject({ user_id: ME, action: 'data_exported' });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toMatch(/^fitmesh-data-export-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe('ExportDataClient: paginazione deterministica con oltre 1.000 righe proprie', () => {
  it('estrae oltre 1.000 righe proprie senza troncamenti paginando con blocchi deterministici', async () => {
    const TOTAL_METRICS = 1250;
    const syntheticMetrics: Row[] = Array.from({ length: TOTAL_METRICS }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      user_id: ME,
      steps: 100 + i,
      marker: 'MIA',
    }));

    tableDataOverride = {
      fitness_metrics: syntheticMetrics,
    };
    tableTotalCountOverride = {
      fitness_metrics: TOTAL_METRICS,
    };

    const bundle = await runExport();

    const rec = recorded.find((r) => r.table === 'fitness_metrics');
    expect(rec).toBeDefined();
    // Due blocchi di paginazione: 0..999 e 1000..1999
    expect(rec!.ranges).toEqual([
      { from: 0, to: 999 },
      { from: 1000, to: 1999 },
    ]);
    expect(rec!.order?.column).toBe('id');
    expect(rec!.order?.ascending).toBe(true);

    const metricsExported = bundle.data.fitness_metrics;
    expect(metricsExported.length).toBe(TOTAL_METRICS);
    expect(metricsExported[0].steps).toBe(100);
    expect(metricsExported[TOTAL_METRICS - 1].steps).toBe(100 + TOTAL_METRICS - 1);
  });

  it('anti-troncamento: se il server restituisce meno righe del totale dichiarato, fail-closed immediato', async () => {
    // Dichiara 1.500 righe ma al blocco 2 restituisce vuoto (troncamento)
    tableDataOverride = {
      fitness_metrics: Array.from({ length: 1000 }, (_, i) => ({
        id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        user_id: ME,
        steps: i,
        marker: 'MIA',
      })),
    };
    tableTotalCountOverride = {
      fitness_metrics: 1500, // Dichiara 1500 ma ne ha fornite solo 1000!
    };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);

    // Nessun download parziale o troncato!
    expect(downloads).toHaveLength(0);
    expect(blobParts).toHaveLength(0);

    // Nessun timbro di completamento
    const timbro = writes.find(
      (w) => w.table === 'privacy_consents' && 'data_export_completed_at' in w.payload,
    );
    expect(timbro).toBeUndefined();
  });
});

describe('ExportDataClient: verifiche di sessione e scritture di audit', () => {
  it('interrompe immediatamente se la sessione cambia mid-flight durante le query', async () => {
    // Simula cambio utente al 3° controllo di sessione (durante il loop delle tabelle)
    changeUserOnCallIndex = 3;
    newUserIdOnChange = OTHER;

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);

    // Nessun download parziale, nessun timbro
    expect(downloads).toHaveLength(0);
    const timbro = writes.find(
      (w) => w.table === 'privacy_consents' && 'data_export_completed_at' in w.payload,
    );
    expect(timbro).toBeUndefined();
  });

  it('interrompe immediatamente se la sessione scade mid-flight', async () => {
    changeUserOnCallIndex = 4;
    newUserIdOnChange = null; // Sessione nulla (scaduta)

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(downloads).toHaveLength(0);
  });

  it('fail-closed se la scrittura del timbro di completamento (privacy_consents) fallisce', async () => {
    consentUpsertError = { message: 'DB connection failure during consent update' };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    // Nessun download se il timbro non e' andato a buon fine
    expect(downloads).toHaveLength(0);
  });

  it('fail-closed se la scrittura del log di audit fallisce', async () => {
    auditInsertError = { message: 'Audit insert failure' };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    // Nessun download se l'audit ha fallito
    expect(downloads).toHaveLength(0);
  });
});

describe('ExportDataClient: gestione discriminante errori DB', () => {
  it('fail-closed su errore query: nessun download, nessun timbro completato, nessun leak tecnico', async () => {
    const RAW_LEAK = '42P01: relation fitness_metrics does not exist (internal leak)';
    tableErrorOverride = {
      fitness_metrics: { message: RAW_LEAK },
    };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(screen.queryByText(new RegExp(RAW_LEAK, 'i'))).not.toBeInTheDocument();
    expect(downloads).toHaveLength(0);
    expect(blobParts).toHaveLength(0);

    const timbro = writes.find(
      (w) => w.table === 'privacy_consents' && 'data_export_completed_at' in w.payload,
    );
    expect(timbro).toBeUndefined();
  });

  it('fail-closed se i dati restituiti non sono un array: abortisce immediatamente', async () => {
    tableErrorOverride = {
      // @ts-expect-error test for unexpected non-array error handling
      workouts: { corrupted: true },
    };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(downloads).toHaveLength(0);
  });

  it('fallisce immediatamente se l\'utente non e\' autenticato senza interrogare tabelle', async () => {
    currentUserOverride = null;

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(recorded).toHaveLength(0);
    expect(downloads).toHaveLength(0);
  });
});
