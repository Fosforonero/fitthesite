import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

type Row = Record<string, unknown>;

function fixtureFor(table: string): Row[] {
  const mine = (extra: Row = {}): Row => ownerRow(table, ME, extra);
  const theirs = (extra: Row = {}): Row => ownerRow(table, OTHER, extra);
  return [mine({ marker: 'MIA' }), theirs({ marker: 'ALTRUI' })];
}

function ownerRow(table: string, uid: string, extra: Row): Row {
  const scope = EXPORT_OWNER_SCOPE[table as keyof typeof EXPORT_OWNER_SCOPE];
  if ('column' in scope) return { [scope.column]: uid, ...extra };
  // caregiver_links: io sono il caregiver di me stesso solo per costruzione
  // della fixture; la controparte e' sempre un altro utente.
  return uid === ME
    ? { caregiver_id: ME, subject_id: '10000000-0000-4000-8000-000000000099', ...extra }
    : { caregiver_id: OTHER, subject_id: '10000000-0000-4000-8000-000000000098', ...extra };
}

type Recorder = { table: string; filters: string[] };
let recorded: Recorder[] = [];
let blobParts: string[] = [];

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
        upsert: async () => ({ error: null }),
        insert: async () => ({ error: null }),
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
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
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
      expect(rows.length, `${table}: attese le righe proprie`).toBeGreaterThan(0);
      for (const r of rows) {
        expect(r.marker, `${table}: riga altrui nel file`).toBe('MIA');
      }
    }
    expect(JSON.stringify(bundle)).not.toContain(OTHER);
  });
});
