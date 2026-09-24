import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EXPORT_OWNER_SCOPE, EXPORT_TABLES } from '@/lib/privacy/export-scope';

/**
 * L'export web deve consegnare SOLO le righe dell'utente, anche quando la RLS
 * ne lascia leggere altre (admin, membri di gruppo, co-partecipanti).
 *
 * Il finto database qui sotto si comporta come la RLS del caso peggiore: senza
 * filtri restituisce TUTTE le righe, proprie e altrui, per ogni tabella. Solo un
 * filtro sul proprietario nella query le esclude. E' il modo di rendere il test
 * capace di fallire: se `scopeToOwner` venisse tolto dal componente, il file
 * scaricato conterrebbe le righe altrui e il test diventerebbe rosso.
 */

const ME = '10000000-0000-4000-8000-000000000006';
const OTHER = '10000000-0000-4000-8000-000000000007';
const OTHER_2 = '10000000-0000-4000-8000-000000000008';
// la controparte di una relazione di cura MIA: il suo id resta nel file, e' un dato della relazione
const COUNTERPARTY = '10000000-0000-4000-8000-000000000099';

type Row = Record<string, unknown>;

function fixtureFor(table: string): Row[] {
  const scope = EXPORT_OWNER_SCOPE[table as keyof typeof EXPORT_OWNER_SCOPE];
  if ('column' in scope) {
    return [{ [scope.column]: ME, marker: 'MIA' }, { [scope.column]: OTHER, marker: 'ALTRUI' }];
  }
  // caregiver_links: una relazione in cui sono il caregiver, una in cui sono il soggetto
  // (solo `or` copre entrambe: `eq(caregiver_id)` perderebbe la seconda), una di altri.
  return [
    { caregiver_id: ME, subject_id: COUNTERPARTY, marker: 'MIA' },
    { caregiver_id: COUNTERPARTY, subject_id: ME, marker: 'MIA' },
    { caregiver_id: OTHER, subject_id: OTHER_2, marker: 'ALTRUI' },
  ];
}

type Recorder = { table: string; filters: string[] };
let recorded: Recorder[] = [];
let blobParts: string[] = [];
let writes: Array<{ table: string; op: 'upsert' | 'insert'; payload: Row }> = [];
let downloads: string[] = [];

function makeSupabase() {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: ME, email: 'synth-admin@example.invalid' } } }),
    },
    from(table: string) {
      const rec: Recorder = { table, filters: [] };
      recorded.push(rec);
      const filters: Array<(r: Row) => boolean> = [];
      const builder = {
        select: () => builder,
        eq: (col: string, val: string) => {
          rec.filters.push(`eq:${col}=${val}`);
          filters.push((r) => r[col] === val);
          return builder;
        },
        or: (expr: string) => {
          rec.filters.push(`or:${expr}`);
          const parts = expr.split(',').map((p) => p.split('.eq.'));
          filters.push((r) => parts.some(([c, v]) => r[c] === v));
          return builder;
        },
        upsert: async (payload: Row) => {
          writes.push({ table, op: 'upsert', payload });
          return { error: null };
        },
        insert: async (payload: Row) => {
          writes.push({ table, op: 'insert', payload });
          return { error: null };
        },
        then: (resolve: (v: { data: Row[]; error: null }) => unknown) =>
          resolve({ data: fixtureFor(table).filter((r) => filters.every((f) => f(r))), error: null }),
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
  errorTitle: 'Errore',
};

beforeEach(() => {
  recorded = [];
  blobParts = [];
  writes = [];
  downloads = [];
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
  // jsdom non implementa la navigazione: il click sul link di download resta muto.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
});

afterEach(() => {
  // vitest qui non ha `globals: true`: senza cleanup esplicito il DOM del test
  // precedente resta e `waitFor` potrebbe soddisfarsi con il suo «Fatto».
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

describe('ExportDataClient: il file contiene solo le righe dell\'utente', () => {
  it('interroga tutte le tabelle previste, ognuna con un filtro sul proprietario', async () => {
    await runExport();
    const perTabella = recorded.filter((r) => (EXPORT_TABLES as readonly string[]).includes(r.table));
    // le tabelle di export, una volta ciascuna (privacy_consents compare anche nel timbro finale)
    for (const table of EXPORT_TABLES) {
      const lettura = perTabella.find((r) => r.table === table);
      expect(lettura, `nessuna lettura di ${table}`).toBeDefined();
      expect(lettura!.filters.length, `${table} letta senza filtro sul proprietario`).toBeGreaterThan(0);
      expect(lettura!.filters.join(' ')).toContain(ME);
    }
  });

  it('non scrive nel file nessuna riga altrui, su nessuna tabella', async () => {
    const bundle = await runExport();
    for (const table of EXPORT_TABLES) {
      const rows = bundle.data[table];
      expect(Array.isArray(rows), `${table} non e' un array`).toBe(true);
      // caregiver_links: due relazioni mie (caregiver e soggetto); le altre tabelle: una riga
      expect(rows.length, `${table}: righe proprie attese`).toBe(table === 'caregiver_links' ? 2 : 1);
      for (const r of rows) {
        expect(r.marker, `${table}: riga altrui nel file`).toBe('MIA');
      }
    }
    expect(JSON.stringify(bundle)).not.toContain(OTHER);
  });

  it('il flusso resta quello di prima: timbro «completato», audit, download del JSON', async () => {
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
