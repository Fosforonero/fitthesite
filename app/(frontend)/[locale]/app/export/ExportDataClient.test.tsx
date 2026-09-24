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
  orders: Array<{ column: string; ascending: boolean }>;
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
let tableTotalCountOverride: Record<string, number | null> = {};
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
        rec = { table, filters: [], orders: [], ranges: [] };
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
          rec!.orders.push({ column: col, ascending: options.ascending });
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
      expect(rec!.orders).toEqual(
        EXPORT_TABLE_ORDER[table].map((col) => ({ column: col, ascending: true })),
      );
      expect(rec!.ranges.length).toBeGreaterThan(0);
    }
  });

  it('non scrive nel file nessuna riga altrui, su nessuna tabella e applica Opzione B per caregiver', async () => {
    const bundle = await runExport();
    for (const table of EXPORT_TABLES) {
      const rows = bundle.data[table] as Row[];
      expect(Array.isArray(rows), `${table} non e' un array`).toBe(true);
      expect(rows.length, `${table}: righe proprie attese`).toBe(table === 'caregiver_links' ? 2 : 1);
      if (table !== 'caregiver_links') {
        for (const r of rows) {
          expect(r.marker, `${table}: riga altrui nel file`).toBe('MIA');
        }
      }
    }
    // Opzione B per caregiver_links: gli identificativi di terzi e della controparte non appaiono nel bundle
    expect(JSON.stringify(bundle)).not.toContain(COUNTERPARTY);
    expect(JSON.stringify(bundle)).not.toContain(OTHER);
    expect(bundle.data.caregiver_links).toEqual([
      {
        relationship_role: 'caregiver',
        permissions: null,
        granted_at: null,
        expires_at: null,
        revoked_at: null,
      },
      {
        relationship_role: 'subject',
        permissions: null,
        granted_at: null,
        expires_at: null,
        revoked_at: null,
      },
    ]);
  });

  it('il flusso completo scrive audit PRIMA del timbro completato e avvia il download del JSON', async () => {
    await runExport();
    const auditIndex = writes.findIndex((w) => w.table === 'audit_logs' && w.op === 'insert');
    const timbroIndex = writes.findIndex((w) => w.table === 'privacy_consents' && w.op === 'upsert');

    expect(auditIndex).toBeGreaterThanOrEqual(0);
    expect(timbroIndex).toBeGreaterThan(auditIndex);

    const timbro = writes[timbroIndex];
    expect(timbro?.payload).toMatchObject({ user_id: ME });
    expect(timbro?.payload).toHaveProperty('data_export_requested_at');
    expect(timbro?.payload).toHaveProperty('data_export_completed_at');

    const audit = writes[auditIndex];
    expect(audit?.payload).toMatchObject({ user_id: ME, action: 'data_exported' });

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toMatch(/^fitmesh-data-export-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe('ExportDataClient: paginazione deterministica con oltre 1.000 righe proprie', () => {
  it('estrae oltre 1.000 righe su tabella con PK singola aventi timestamp identici, senza duplicati ne\' ID mancanti', async () => {
    const TOTAL_METRICS = 1250;
    const syntheticMetrics: Row[] = Array.from({ length: TOTAL_METRICS }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      user_id: ME,
      window_start_ms: 1000000,
      window_end_ms: 2000000,
      collected_at_ms: 3000000,
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
    expect(rec!.orders).toEqual([
      { column: 'id', ascending: true },
      { column: 'id', ascending: true },
    ]);

    const metricsExported = bundle.data.fitness_metrics as Row[];
    expect(metricsExported.length).toBe(TOTAL_METRICS);
    const ids = new Set(metricsExported.map((m) => m.id));
    expect(ids.size).toBe(TOTAL_METRICS);
    expect(metricsExported[0].id).toBe('00000000-0000-4000-8000-000000000000');
    expect(metricsExported[TOTAL_METRICS - 1].id).toBe(
      `00000000-0000-4000-8000-${String(TOTAL_METRICS - 1).padStart(12, '0')}`,
    );
  });

  it('estrae oltre 1.000 righe su tabella con PK composta (group_members) aventi timestamp identici, senza duplicati ne\' ID mancanti', async () => {
    const TOTAL_MEMBERSHIPS = 1200;
    const SAME_TIMESTAMP = '2026-05-01T12:00:00.000Z';
    const syntheticGroupMembers: Row[] = Array.from({ length: TOTAL_MEMBERSHIPS }, (_, i) => ({
      group_id: `grp-00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      user_id: ME,
      role: 'member',
      joined_at: SAME_TIMESTAMP,
      marker: 'MIA',
    }));

    tableDataOverride = {
      group_members: syntheticGroupMembers,
    };
    tableTotalCountOverride = {
      group_members: TOTAL_MEMBERSHIPS,
    };

    const bundle = await runExport();

    const rec = recorded.find((r) => r.table === 'group_members');
    expect(rec).toBeDefined();
    expect(rec!.ranges).toEqual([
      { from: 0, to: 999 },
      { from: 1000, to: 1999 },
    ]);
    expect(rec!.orders).toEqual([
      { column: 'group_id', ascending: true },
      { column: 'user_id', ascending: true },
      { column: 'group_id', ascending: true },
      { column: 'user_id', ascending: true },
    ]);

    const membersExported = bundle.data.group_members as Row[];
    expect(membersExported.length).toBe(TOTAL_MEMBERSHIPS);
    const groupIds = new Set(membersExported.map((m) => m.group_id));
    expect(groupIds.size).toBe(TOTAL_MEMBERSHIPS);
    for (let i = 0; i < TOTAL_MEMBERSHIPS; i++) {
      const expectedId = `grp-00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
      expect(groupIds.has(expectedId), `ID mancante: ${expectedId}`).toBe(true);
    }
  });

  it('fail-closed immediato con count nullo da Supabase / PostgREST', async () => {
    tableTotalCountOverride = {
      fitness_metrics: null,
    };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);

    expect(downloads).toHaveLength(0);
    expect(blobParts).toHaveLength(0);

    const timbro = writes.find(
      (w) => w.table === 'privacy_consents' && 'data_export_completed_at' in w.payload,
    );
    expect(timbro).toBeUndefined();
    const audit = writes.find((w) => w.table === 'audit_logs');
    expect(audit).toBeUndefined();
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

  it('fail-closed immediato se una riga duplicata si presenta durante la paginazione', async () => {
    const dupId = '00000000-0000-4000-8000-000000000000';
    const rowsPage1: Row[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      user_id: ME,
      marker: 'MIA',
    }));
    const rowsPage2: Row[] = [
      { id: dupId, user_id: ME, marker: 'MIA' }, // Duplicato!
      ...Array.from({ length: 99 }, (_, i) => ({
        id: `00000000-0000-4000-8000-${String(1000 + i).padStart(12, '0')}`,
        user_id: ME,
        marker: 'MIA',
      })),
    ];

    tableDataOverride = {
      fitness_metrics: [...rowsPage1, ...rowsPage2],
    };
    tableTotalCountOverride = {
      fitness_metrics: 1100,
    };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(downloads).toHaveLength(0);
    expect(writes.find((w) => w.table === 'privacy_consents')).toBeUndefined();
  });

  it('richiede corrispondenza esatta fra conteggio e righe uniche: abortisce se mismatch', async () => {
    const rows: Row[] = Array.from({ length: 1004 }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      user_id: ME,
      marker: 'MIA',
    }));

    tableDataOverride = {
      fitness_metrics: rows,
    };
    tableTotalCountOverride = {
      fitness_metrics: 1005,
    };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(downloads).toHaveLength(0);
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

  it('riverifica la sessione prima della consegna: se l\'utente scade prima del download, consegna bloccata', async () => {
    // Session check pre-delivery e' la 15esima chiamata a getUser
    changeUserOnCallIndex = 15;
    newUserIdOnChange = null;

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

  it('risoluzione sequenza audit/completed_at: se la scrittura audit fallisce, data_export_completed_at NON viene mai scritto', async () => {
    auditInsertError = { message: 'Audit insert failure' };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    // Nessun download se l'audit ha fallito
    expect(downloads).toHaveLength(0);

    // Nessun falso "completato" in privacy_consents!
    const timbro = writes.find(
      (w) => w.table === 'privacy_consents' && 'data_export_completed_at' in w.payload,
    );
    expect(timbro, 'data_export_completed_at non deve mai essere scritto se audit fallisce').toBeUndefined();
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
