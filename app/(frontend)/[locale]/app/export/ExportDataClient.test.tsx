import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EXPORT_OWNER_SCOPE,
  EXPORT_TABLE_ORDER,
  EXPORT_TABLES,
  EXPORT_CATEGORIES,
  getExportColumns,
  getTableRowKey,
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
let rpcCalls: string[] = [];

let currentUserOverride: { id: string; email?: string } | null = {
  id: ME,
  email: 'synth-admin@example.invalid',
};
let getUserCallCount = 0;
let changeUserOnCallIndex: number | null = null;
let newUserIdOnChange: string | null = null;
// l'utente e' un altro SOLO a questa chiamata di getUser (poi torna quello di prima): nessun controllo
// successivo puo' rimediare, quindi ogni controllo di sessione e' discriminato da solo
let blipAtCall: number | null = null;
let blipWhen: (() => boolean) | null = null;

let tableErrorOverride: Record<string, { message: string; code?: string }> = {};
// errore SOLO dalla pagina che parte da questo indice in poi (pagine precedenti riuscite)
let tableErrorFromRange: Record<string, number> = {};
// risposta senza errore ma con dati che non sono un array
let tableNonArray: Record<string, boolean> = {};
let tableDataOverride: Record<string, Row[]> = {};
let tableTotalCountOverride: Record<string, number | null> = {};
let consentUpsertError: { message: string } | null = null;
let auditInsertError: { message: string } | null = null;

function makeSupabase() {
  return {
    rpc: (name: string) => {
      rpcCalls.push(name);
      return Promise.resolve({ data: null, error: { message: "rpc non ammessa nell'export" } });
    },
    auth: {
      getUser: async () => {
        getUserCallCount++;
        if ((blipAtCall !== null && getUserCallCount === blipAtCall) || (blipWhen !== null && blipWhen())) {
          return { data: { user: { id: OTHER, email: 'blip@example.invalid' } }, error: null };
        }
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
          if (
            table in tableErrorFromRange &&
            currentRange !== null &&
            currentRange.from >= tableErrorFromRange[table]
          ) {
            return resolve({
              data: null,
              count: null,
              error: { message: 'canceling statement due to statement timeout', code: '57014' },
            });
          }
          if (tableNonArray[table]) {
            return resolve({ data: { corrupted: true }, count: 1, error: null });
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
  incompleteTitle: 'File incompleto',
  incompleteBody: 'Non inclusi:',
  incompleteHint: 'Riprova piu tardi',
  // etichette di prova riconoscibili: mai un nome di tabella
  categories: Object.fromEntries(EXPORT_CATEGORIES.map((c) => [c, `CAT-${c}`])) as Record<
    (typeof EXPORT_CATEGORIES)[number],
    string
  >,
};

beforeEach(() => {
  recorded = [];
  blobParts = [];
  writes = [];
  downloads = [];
  rpcCalls = [];
  currentUserOverride = { id: ME, email: 'synth-admin@example.invalid' };
  getUserCallCount = 0;
  changeUserOnCallIndex = null;
  newUserIdOnChange = null;
  blipAtCall = null;
  blipWhen = null;
  tableErrorOverride = {};
  tableErrorFromRange = {};
  tableNonArray = {};
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
  await waitFor(() => expect(screen.getByText(/Fatto|File incompleto/)).toBeInTheDocument());
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

  // INVARIANTE: se la sessione viene meno in QUALUNQUE punto, o l'export non consegna nulla e non lascia
  // nessuna traccia di «completato» (audit, timbro), oppure consegna il file. Mai un timbro senza file.
  // (Il controllo di consegna dopo le scritture lasciava audit e data_export_completed_at senza download.)
  it.each(Array.from({ length: 16 }, (_, i) => i + 1))(
    'la sessione scade alla chiamata %i di getUser: nessun timbro di completamento senza file',
    async (k) => {
      changeUserOnCallIndex = k;
      newUserIdOnChange = null;

      render(<ExportDataClient locale="it" t={T} />);
      fireEvent.click(screen.getByRole('button', { name: T.cta }));
      await waitFor(() => {
        const finito =
          screen.queryByRole('alert') !== null ||
          screen.queryByText(/Fatto/) !== null ||
          screen.queryByRole('status') !== null;
        expect(finito).toBe(true);
      });

      const timbro = writes.some((w) => w.table === 'privacy_consents' && 'data_export_completed_at' in w.payload);
      const audit = writes.some((w) => w.table === 'audit_logs');
      if (downloads.length === 0) {
        expect(timbro, `k=${k}: timbro scritto senza download`).toBe(false);
        expect(audit, `k=${k}: audit scritto senza download`).toBe(false);
      } else {
        expect(timbro, `k=${k}: download senza timbro`).toBe(true);
      }
    },
  );

  // Audit e timbro sono BEST-EFFORT (come prima della #96): la RLS di audit_logs ammette solo SELECT
  // («INSERT: solo via service_role»), quindi un esito negativo non deve togliere all'utente i propri dati.
  it('timbro di completamento (privacy_consents) respinto: il file viene consegnato lo stesso', async () => {
    consentUpsertError = { message: 'new row violates row-level security policy for table "privacy_consents"' };
    const bundle = await runExport();
    expect(downloads).toHaveLength(1);
    expect(bundle.data.profiles).toHaveLength(1);
  });

  it('INSERT su audit_logs respinto dalla RLS (nessuna policy INSERT): il file viene consegnato lo stesso', async () => {
    auditInsertError = { message: 'new row violates row-level security policy for table "audit_logs"' };
    const bundle = await runExport();
    expect(downloads).toHaveLength(1);
    expect(bundle.data.profiles).toHaveLength(1);
    // l'audit e' stato tentato (e respinto) PRIMA del timbro, che e' stato tentato lo stesso
    const auditIndex = writes.findIndex((w) => w.table === 'audit_logs' && w.op === 'insert');
    const timbroIndex = writes.findIndex((w) => w.table === 'privacy_consents' && w.op === 'upsert');
    expect(auditIndex).toBeGreaterThanOrEqual(0);
    expect(timbroIndex).toBeGreaterThan(auditIndex);
  });
});

describe('ExportDataClient: gestione discriminante errori DB', () => {
  const RLS_RICORSIONE = {
    message: 'infinite recursion detected in policy for relation "challenge_participants"',
    code: '42P17',
  };

  it('una tabella illeggibile (RLS rotta, 42P17) NON ferma l\'export: marcata non disponibile, senza testo tecnico, file consegnato', async () => {
    tableErrorOverride = {
      challenge_participants: RLS_RICORSIONE,
      challenge_scores: { ...RLS_RICORSIONE, message: RLS_RICORSIONE.message.replace('participants', 'scores') },
    };
    const bundle = await runExport();

    expect(downloads).toHaveLength(1);
    expect(bundle.data.challenge_participants).toEqual({ error: 'unavailable' });
    expect(bundle.data.challenge_scores).toEqual({ error: 'unavailable' });
    // il testo dell'errore del database non entra ne' nel file ne' nella pagina
    expect(blobParts.join('')).not.toMatch(/infinite recursion|42P17|policy/i);
    expect(document.body.textContent ?? '').not.toMatch(/infinite recursion|42P17/i);
    // le altre 10 tabelle sono presenti, solo con righe proprie
    for (const table of EXPORT_TABLES) {
      if (table === 'challenge_participants' || table === 'challenge_scores') continue;
      const rows = bundle.data[table] as Row[];
      expect(Array.isArray(rows), `${table} non e' un array`).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
    }
    // audit e timbro scritti: il file e' stato consegnato
    expect(writes.some((w) => w.table === 'privacy_consents' && 'data_export_completed_at' in w.payload)).toBe(true);
  });

  it('errore alla SECONDA pagina: nessuna riga parziale della tabella nel file, tabella marcata non disponibile', async () => {
    tableDataOverride = {
      fitness_metrics: Array.from({ length: 1250 }, (_, i) => ({
        id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        user_id: ME,
        marker: 'MIA',
      })),
    };
    tableTotalCountOverride = { fitness_metrics: 1250 };
    tableErrorFromRange = { fitness_metrics: 1000 };

    const bundle = await runExport();
    expect(bundle.data.fitness_metrics).toEqual({ error: 'unavailable' });
    expect(blobParts.join('')).not.toContain('00000000-0000-4000-8000-000000000000');
    expect(blobParts.join('')).not.toMatch(/statement timeout|57014/);
    expect(downloads).toHaveLength(1);
  });

  it('se NESSUNA tabella e\' leggibile: nessun file, nessun audit, nessun timbro (un export di soli «non disponibile» non e\' un export)', async () => {
    tableErrorOverride = Object.fromEntries(
      EXPORT_TABLES.map((t) => [t, { message: 'JWT expired', code: 'PGRST301' }]),
    );

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(screen.queryByText(/JWT expired/i)).not.toBeInTheDocument();
    expect(downloads).toHaveLength(0);
    expect(blobParts).toHaveLength(0);
    expect(writes).toHaveLength(0);
  });

  it('una risposta senza errore che non e\' un array resta FATALE: nessun download, nessuna scrittura', async () => {
    tableNonArray = { workouts: true };

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(downloads).toHaveLength(0);
    expect(writes).toHaveLength(0);
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

describe('ExportDataClient: controllo delle righe restituite (difesa in profondita\' dopo il filtro)', () => {
  // Righe con TUTTE le colonne di chiave valorizzate e distinte: senza questo un test passerebbe
  // per il motivo sbagliato (chiave duplicata '' -> fail-closed del rilevatore di duplicati) anche
  // senza il controllo sul proprietario.
  function conChiavi(table: (typeof EXPORT_TABLES)[number]): Row[] {
    return fixtureFor(table).map((r, i) => {
      const copia: Row = { ...r };
      for (const col of EXPORT_TABLE_ORDER[table]) {
        if (!(col in copia)) copia[col] = `chiave-${i}-${col}`;
      }
      return copia;
    });
  }

  async function runExportAttesoErrore() {
    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));
    await waitFor(() => expect(screen.getByText(T.errorTitle)).toBeInTheDocument());
  }

  it.each([...EXPORT_TABLES])(
    '%s: se il server restituisce la riga di un co-membro nonostante il filtro, l\'export si ferma e non consegna nulla',
    async (table) => {
      // Simula un filtro ignorato o una policy che lascia passare righe altrui: il server
      // restituisce, per questa tabella, anche la riga ALTRUI della fixture.
      tableDataOverride = { [table]: conChiavi(table) };
      await runExportAttesoErrore();
      expect(downloads, 'nessun download').toEqual([]);
      expect(blobParts, 'nessun file costruito').toEqual([]);
      expect(writes, 'nessun timbro di completamento ne\' audit').toEqual([]);
      expect(document.body.textContent ?? '', 'nessun id del co-membro a schermo').not.toContain(OTHER);
    },
  );

  it('la riga del co-membro compare solo nella SECONDA pagina (oltre le prime 1000 righe proprie): l\'export si ferma', async () => {
    const proprie = Array.from({ length: 1000 }, (_, i) => ({ id: `mia-${i}`, user_id: ME, marker: 'MIA' }));
    tableDataOverride = { fitness_metrics: [...proprie, { id: 'altrui-1000', user_id: OTHER, marker: 'ALTRUI' }] };
    await runExportAttesoErrore();
    expect(downloads).toEqual([]);
    expect(blobParts).toEqual([]);
    expect(writes).toEqual([]);
  });

  it('una riga senza colonna proprietario (proiezione cambiata o riga corrotta) ferma l\'export', async () => {
    tableDataOverride = { fitness_metrics: [{ marker: 'SENZA_PROPRIETARIO' }] };
    await runExportAttesoErrore();
    expect(downloads).toEqual([]);
    expect(blobParts).toEqual([]);
    expect(writes).toEqual([]);
  });

  it('il co-membro compare solo su una tabella in coda: l\'export si ferma lo stesso e non scrive righe parziali', async () => {
    tableDataOverride = { user_roles: fixtureFor('user_roles') };
    await runExportAttesoErrore();
    expect(blobParts.join('')).not.toContain('ALTRUI');
    expect(downloads).toEqual([]);
  });
});

describe('ExportDataClient: l\'export dei propri dati non dipende da Pro ne\' dal verdetto della dashboard', () => {
  it('un utente qualunque scarica il proprio export senza alcuna chiamata RPC (nessun verdetto, nessun entitlement)', async () => {
    const bundle = await runExport();
    expect(Object.keys(bundle.data)).toHaveLength(EXPORT_TABLES.length);
    expect(rpcCalls, 'l\'export non deve chiamare il verdetto Pro').toEqual([]);
  });

  it('i sorgenti dell\'export non importano il verdetto, i titoli o la dashboard web (decisioni 41 e 45)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = __dirname;
    const radice = path.join(dir, '../../../../..');
    const file = [
      path.join(dir, 'ExportDataClient.tsx'),
      path.join(dir, 'page.tsx'),
      path.join(radice, 'lib/privacy/export-scope.ts'),
      // i punti in cui un cancello Pro verrebbe aggiunto: il layout che avvolge /app/export e il middleware
      path.join(dir, '../layout.tsx'),
      path.join(radice, 'middleware.ts'),
    ];
    for (const f of file) {
      const src = fs.readFileSync(f, 'utf8');
      for (const vietato of [
        'lib/dashboard',
        'web-dashboard',
        'get_web_dashboard_access',
        'verdetto',
        'entitlement',
        'hasFullAccess',
      ]) {
        expect(src.includes(vietato), `${path.basename(f)} cita '${vietato}'`).toBe(false);
      }
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Secondo giro (06/10, r2): revisione avversaria del candidato. Ogni blocco nasce da un mutante che i test
// precedenti lasciavano vivo: controllo proprietario solo sull'ultima riga, controlli di sessione non
// discriminati (il mock cambiava utente «da qui in poi»), marcatore solo su una tabella paginabile,
// soglia «nessuna tabella leggibile» provata solo a 0 e 10, forma del bundle non fissata.
// ───────────────────────────────────────────────────────────────────────────────
// tabelle la cui chiave primaria E' la colonna proprietario: una sola riga propria possibile
const OWNER_KEYED = new Set<string>(['profiles', 'privacy_consents', 'user_settings', 'b2c_subscriptions']);

function ownRows(table: (typeof EXPORT_TABLES)[number], n: number, marker = 'MIA'): Row[] {
  const scope = EXPORT_OWNER_SCOPE[table];
  return Array.from({ length: n }, (_, i) => {
    const row: Row = { marker };
    if ('column' in scope) row[scope.column] = ME;
    else {
      row.caregiver_id = ME;
      row.subject_id = `cp-${i}`;
    }
    for (const col of EXPORT_TABLE_ORDER[table]) if (!(col in row)) row[col] = `${col}-${i}`;
    return row;
  });
}
function foreignRow(table: (typeof EXPORT_TABLES)[number]): Row {
  const scope = EXPORT_OWNER_SCOPE[table];
  const row: Row = { marker: 'ALTRUI' };
  if ('column' in scope) row[scope.column] = OTHER;
  else {
    row.caregiver_id = OTHER;
    row.subject_id = OTHER_2;
  }
  for (const col of EXPORT_TABLE_ORDER[table]) if (!(col in row)) row[col] = `${col}-altrui`;
  return row;
}

async function runExportAtteso(esito: 'errore' | 'ok') {
  render(<ExportDataClient locale="it" t={T} />);
  fireEvent.click(screen.getByRole('button', { name: T.cta }));
  if (esito === 'errore') await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  else await waitFor(() => expect(screen.getByText(/Fatto|File incompleto/)).toBeInTheDocument());
}

describe('posizione della riga altrui dentro la pagina', () => {
  const casi: Array<[string, string, number]> = [];
  for (const t of EXPORT_TABLES) {
    if (OWNER_KEYED.has(t)) {
      casi.push([t, 'prima', 0], [t, 'ultima', 1]);
    } else {
      casi.push([t, 'prima', 0], [t, 'seconda', 1], [t, 'terza', 2], [t, 'ultima', 3]);
    }
  }
  it.each(casi)('%s: riga altrui in posizione %s -> l\'export si ferma', async (table, _nome, indice) => {
    const t = table as (typeof EXPORT_TABLES)[number];
    const righe = ownRows(t, OWNER_KEYED.has(t) ? 1 : 3);
    righe.splice(indice, 0, foreignRow(t));
    // sanity: le chiavi sono tutte distinte, quindi non e' il rilevatore di duplicati a fermare l'export
    expect(new Set(righe.map((r) => getTableRowKey(t, r))).size).toBe(righe.length);
    tableDataOverride = { [t]: righe };
    await runExportAtteso('errore');
    expect(downloads).toEqual([]);
    expect(blobParts).toEqual([]);
    expect(writes).toEqual([]);
    expect(document.body.textContent ?? '').not.toContain(OTHER);
  });

  it('un solo intruso in mezzo a 1000 righe proprie (pagina piena) ferma l\'export', async () => {
    const righe = ownRows('fitness_metrics', 1000);
    righe.splice(537, 0, foreignRow('fitness_metrics'));
    tableDataOverride = { fitness_metrics: righe };
    await runExportAtteso('errore');
    expect(downloads).toEqual([]);
    expect(blobParts).toEqual([]);
  });
});

describe('ordine fra controllo proprietario e marcatore', () => {
  it('riga altrui nella pagina 1 + errore alla pagina 2: l\'export resta FATALE (non diventa «non disponibile»)', async () => {
    const righe = ownRows('fitness_metrics', 1250);
    righe.splice(10, 0, foreignRow('fitness_metrics')); // 1251 righe
    tableDataOverride = { fitness_metrics: righe };
    tableTotalCountOverride = { fitness_metrics: 1251 };
    tableErrorFromRange = { fitness_metrics: 1000 };
    await runExportAtteso('errore');
    expect(downloads).toEqual([]);
    expect(blobParts).toEqual([]);
    expect(writes).toEqual([]);
  });
});

describe('marcatore su OGNI tabella paginabile', () => {
  const paginabili = EXPORT_TABLES.filter((t) => !OWNER_KEYED.has(t));
  it.each([...paginabili])('%s: errore alla seconda pagina -> marcatore, nessuna riga parziale nel file', async (table) => {
    const t = table as (typeof EXPORT_TABLES)[number];
    tableDataOverride = { [t]: ownRows(t, 1250, 'PARZIALE') };
    tableTotalCountOverride = { [t]: 1250 };
    tableErrorFromRange = { [t]: 1000 };
    const bundle = await runExport();
    expect((bundle.data as Record<string, unknown>)[t]).toEqual({ error: 'unavailable' });
    const blob = blobParts.join('');
    expect(blob).not.toContain('PARZIALE');
    expect(blob).not.toContain('cp-');
    expect(blob).not.toMatch(/statement timeout|57014/);
  });
});

describe('sessione che cambia per UNA sola chiamata (nessun controllo successivo puo\' rimediare)', () => {
  // chiamate di getUser: 1 = iniziale; 2..13 = inizio di ognuna delle 12 tabelle; 14 = pre-scrittura
  it.each(Array.from({ length: 13 }, (_, i) => i + 2))(
    'a getUser #%i l\'utente e\' un altro: nessun file, nessuna scrittura',
    async (k) => {
      blipAtCall = k;
      await runExportAtteso('errore');
      expect(downloads).toEqual([]);
      expect(blobParts).toEqual([]);
      expect(writes).toEqual([]);
    },
  );

  it('la riverifica FRA le pagine esiste: l\'utente cambia proprio tra la pagina 1 e la pagina 2 di fitness_metrics', async () => {
    tableDataOverride = { fitness_metrics: ownRows('fitness_metrics', 1250) };
    tableTotalCountOverride = { fitness_metrics: 1250 };
    // vero solo mentre la pagina 1 e' stata servita e la 2 no: se il controllo fra le pagine non c'e', nessun getUser cade li'
    blipWhen = () => recorded.find((r) => r.table === 'fitness_metrics')?.ranges.length === 1;
    await runExportAtteso('errore');
    expect(downloads).toEqual([]);
    expect(blobParts).toEqual([]);
    expect(writes).toEqual([]);
  });

  it('dopo una tabella marcata «non disponibile» il controllo di sessione della tabella successiva c\'e\' ancora', async () => {
    tableErrorOverride = { devices: { message: 'boom', code: '42P17' } };
    blipAtCall = 6; // inizio di fitness_metrics, subito dopo devices (marcata)
    await runExportAtteso('errore');
    expect(downloads).toEqual([]);
    expect(blobParts).toEqual([]);
  });
});

describe('soglia «nessuna tabella leggibile» e forma del bundle', () => {
  it('una sola tabella leggibile (profiles): il file e\' consegnato, le altre 11 sono marcate', async () => {
    tableErrorOverride = Object.fromEntries(
      EXPORT_TABLES.filter((t) => t !== 'profiles').map((t) => [t, { message: 'x', code: '42P17' }]),
    );
    const bundle = await runExport();
    expect(downloads).toHaveLength(1);
    expect(bundle.data.profiles).toHaveLength(1);
    for (const t of EXPORT_TABLES.filter((x) => x !== 'profiles')) {
      expect((bundle.data as Record<string, unknown>)[t]).toEqual({ error: 'unavailable' });
    }
  });

  it('profiles e user_roles non disponibili: marcatori, nessuna riga altrui, le altre 10 tabelle intatte', async () => {
    tableErrorOverride = {
      profiles: { message: 'permission denied for table profiles', code: '42501' },
      user_roles: { message: 'infinite recursion detected in policy for relation "user_roles"', code: '42P17' },
    };
    const bundle = await runExport();
    expect(bundle.data.profiles).toEqual({ error: 'unavailable' });
    expect(bundle.data.user_roles).toEqual({ error: 'unavailable' });
    expect(blobParts.join('')).not.toMatch(/permission denied|infinite recursion|42501|42P17/);
    expect(blobParts.join('')).not.toContain(OTHER);
    expect(downloads).toHaveLength(1);
  });

  it('il bundle ha solo le chiavi previste e «account» e\' l\'utente della sessione', async () => {
    await runExport();
    const bundle = JSON.parse(blobParts.join(''));
    expect(Object.keys(bundle)).toEqual(['generated_at', 'account', 'format', 'data']);
    expect(bundle.account).toEqual({ id: ME, email: 'synth-admin@example.invalid' });
    expect(Object.keys(bundle.data)).toEqual([...EXPORT_TABLES]);
  });
});

describe('ExportDataClient: file costruito prima delle scritture, e file che dichiara di essere incompleto', () => {
  it('se la serializzazione del file fallisce (JSON troppo grande) non restano ne\' audit ne\' timbro', async () => {
    const reale = JSON.stringify;
    vi.spyOn(JSON, 'stringify').mockImplementation(((v: unknown, r?: unknown, sp?: unknown) => {
      if (sp === 2) throw new RangeError('Invalid string length');
      return reale(v as never, r as never, sp as never);
    }) as typeof JSON.stringify);

    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(T.errorTitle);
    expect(screen.queryByText(/Invalid string length/)).not.toBeInTheDocument();
    expect(downloads).toEqual([]);
    expect(writes).toEqual([]);
  });

  it('con tabelle non disponibili il file lo dichiara: incomplete e unavailable_tables (nessuna stringa nuova in UI)', async () => {
    tableErrorOverride = {
      challenge_participants: { message: 'infinite recursion detected in policy', code: '42P17' },
      challenge_scores: { message: 'infinite recursion detected in policy', code: '42P17' },
    };
    await runExport();
    const bundle = JSON.parse(blobParts.join(''));
    expect(bundle.incomplete).toBe(true);
    expect(bundle.unavailable_tables).toEqual(['challenge_participants', 'challenge_scores']);
    expect(Object.keys(bundle)).toEqual(['generated_at', 'account', 'format', 'data', 'incomplete', 'unavailable_tables']);
  });

  it('con tutte le tabelle leggibili il file NON ha ne\' incomplete ne\' unavailable_tables', async () => {
    await runExport();
    const bundle = JSON.parse(blobParts.join(''));
    expect('incomplete' in bundle).toBe(false);
    expect('unavailable_tables' in bundle).toBe(false);
  });
});

describe('ExportDataClient: D-5, la pagina dichiara che il file e\' incompleto', () => {
  const ERRORE_TECNICO = {
    message: 'infinite recursion detected in policy for relation "challenge_participants"',
    code: '42P17',
  };

  it('tabelle illeggibili: avviso chiaro con le CATEGORIE (una sola per le due tabelle delle sfide), senza errori tecnici e senza «Fatto»', async () => {
    tableErrorOverride = { challenge_participants: ERRORE_TECNICO, challenge_scores: ERRORE_TECNICO };
    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));
    const avviso = await screen.findByRole('status');

    expect(avviso).toHaveTextContent(T.incompleteTitle);
    expect(avviso).toHaveTextContent(T.incompleteBody);
    expect(avviso).toHaveTextContent(T.incompleteHint);
    expect(avviso).toHaveTextContent('CAT-challenges');
    expect((avviso.textContent ?? '').match(/CAT-challenges/g)).toHaveLength(1);
    // niente nomi di tabella, codici o testi del database, ne' il marcatore del file
    expect(document.body.textContent ?? '').not.toMatch(/challenge_|42P17|recursion|policy|unavailable|PGRST/i);
    // non e' presentato come riuscito
    expect(screen.queryByText(/Fatto/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // il file e' stato comunque scaricato e dichiara la stessa cosa
    expect(downloads).toHaveLength(1);
    expect(JSON.parse(blobParts.join('')).unavailable_tables).toEqual(['challenge_participants', 'challenge_scores']);
  });

  it('piu\' categorie non disponibili: tutte elencate, nell\'ordine fisso delle categorie, ognuna una volta', async () => {
    tableErrorOverride = {
      user_roles: { message: 'permission denied', code: '42501' },
      devices: { message: 'boom' },
      challenge_scores: ERRORE_TECNICO,
      fitness_metrics: { message: 'timeout', code: '57014' },
    };
    render(<ExportDataClient locale="en" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));
    const avviso = await screen.findByRole('status');
    const testo = avviso.textContent ?? '';
    const attese = ['CAT-devices', 'CAT-metrics', 'CAT-challenges', 'CAT-roles'];
    for (const e of attese) expect(testo).toContain(e);
    // ordine di EXPORT_CATEGORIES, non l'ordine in cui le tabelle sono fallite
    const pos = attese.map((e) => testo.indexOf(e));
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
    expect(testo).not.toMatch(/user_roles|fitness_metrics|permission denied|57014/);
    // l'elenco e' nella lingua dell'utente (Intl.ListFormat), non un separatore fisso
    expect(testo).toMatch(/CAT-devices, CAT-metrics, CAT-challenges,? and CAT-roles/);
  });

  it('l\'elenco segue la lingua della pagina: italiano «e», giapponese «、»', async () => {
    tableErrorOverride = { user_roles: { message: 'x' }, devices: { message: 'x' }, workouts: { message: 'x' } };
    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));
    expect((await screen.findByRole('status')).textContent).toMatch(/CAT-devices, CAT-workouts e CAT-roles/);
    cleanup();
    render(<ExportDataClient locale="ja" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));
    expect((await screen.findByRole('status')).textContent).toContain('CAT-devices、CAT-workouts、CAT-roles');
  });

  it('file completo: messaggio di successo, nessun avviso', async () => {
    await runExport();
    expect(screen.getByText(/Fatto/)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('una nuova esportazione (nuova schermata) dopo un file incompleto riparte pulita: nessun avviso residuo', async () => {
    tableErrorOverride = { challenge_scores: ERRORE_TECNICO };
    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));
    await screen.findByRole('status');
    cleanup();
    tableErrorOverride = {};
    blobParts = [];
    render(<ExportDataClient locale="it" t={T} />);
    fireEvent.click(screen.getByRole('button', { name: T.cta }));
    await waitFor(() => expect(screen.getByText(/Fatto/)).toBeInTheDocument());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
