import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  EXPORT_OWNER_SCOPE,
  EXPORT_TABLE_COLUMNS,
  EXPORT_TABLE_ORDER,
  EXPORT_TABLES,
  getExportColumns,
  getTableRowKey,
  sanitizeCaregiverLink,
  scopeToOwner,
  type OwnerFilterable,
} from './export-scope';

const UID = '10000000-0000-4000-8000-000000000006';

class Recorder implements OwnerFilterable<Recorder> {
  calls: string[] = [];
  eq(column: string, value: string) {
    this.calls.push(`eq(${column},${value})`);
    return this;
  }
  or(filters: string) {
    this.calls.push(`or(${filters})`);
    return this;
  }
  order(column: string, options: { ascending: boolean }) {
    this.calls.push(`order(${column},${options.ascending})`);
    return this;
  }
  range(from: number, to: number) {
    this.calls.push(`range(${from},${to})`);
    return this;
  }
}

const recorder = () => new Recorder();

describe('export-scope: ambito delle righe esportate', () => {
  it('le tabelle esportate sono esattamente queste dodici (toglierne una restringe il file art. 20)', () => {
    // Elenco scritto a mano, indipendente dal modulo: gli altri controlli iterano
    // EXPORT_TABLES e non si accorgerebbero di una tabella tolta.
    expect([...EXPORT_TABLES]).toEqual([
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
    ]);
  });

  it('ogni tabella esportata ha un proprietario dichiarato, e viceversa', () => {
    expect(Object.keys(EXPORT_OWNER_SCOPE).sort()).toEqual([...EXPORT_TABLES].sort());
  });

  it('le colonne proprietario sono quelle dello schema (id per profiles, user_id altrove)', () => {
    const attese: Record<string, string | readonly [string, string]> = {
      profiles: 'id',
      privacy_consents: 'user_id',
      user_settings: 'user_id',
      devices: 'user_id',
      fitness_metrics: 'user_id',
      workouts: 'user_id',
      caregiver_links: ['caregiver_id', 'subject_id'],
      group_members: 'user_id',
      b2c_subscriptions: 'user_id',
      challenge_participants: 'user_id',
      challenge_scores: 'user_id',
      user_roles: 'user_id',
    };
    for (const table of EXPORT_TABLES) {
      const s = EXPORT_OWNER_SCOPE[table];
      const atteso = attese[table];
      if ('column' in s) expect(s.column, table).toBe(atteso);
      else expect([...s.anyOf], table).toEqual(atteso);
    }
  });

  it('ogni tabella esportata ha una whitelist esplicita di colonne senza wildcard', () => {
    expect(Object.keys(EXPORT_TABLE_COLUMNS).sort()).toEqual([...EXPORT_TABLES].sort());
    for (const table of EXPORT_TABLES) {
      const cols = EXPORT_TABLE_COLUMNS[table];
      expect(cols.length, `${table} ha zero colonne dichiarate`).toBeGreaterThan(0);
      for (const col of cols) {
        expect(col).not.toContain('*');
        expect(col).toMatch(/^[a-z0-9_]+$/);
      }
      expect(getExportColumns(table)).toBe(cols.join(','));
    }
  });

  it('esclusione rigorosa di segreti di infrastruttura, fingerprint hardware e audit interno', () => {
    // fcm_token e fingerprint hardware non sono dati personali portabili
    expect(EXPORT_TABLE_COLUMNS.devices).not.toContain('fcm_token');
    expect(EXPORT_TABLE_COLUMNS.devices).not.toContain('fcm_token_updated_at');
    expect(EXPORT_TABLE_COLUMNS.devices).not.toContain('device_fingerprint');

    // raw_payload (ricevute store grezze con purchase tokens) non deve essere esportato
    expect(EXPORT_TABLE_COLUMNS.b2c_subscriptions).not.toContain('raw_payload');

    // granted_by e note (audit interno e note aziendali) non devono essere esportati
    expect(EXPORT_TABLE_COLUMNS.user_roles).not.toContain('granted_by');
    expect(EXPORT_TABLE_COLUMNS.user_roles).not.toContain('note');
  });

  it('ogni tabella ha colonne di ordinamento totale deterministico incluse nella proiezione', () => {
    expect(Object.keys(EXPORT_TABLE_ORDER).sort()).toEqual([...EXPORT_TABLES].sort());
    for (const table of EXPORT_TABLES) {
      const orderCols = EXPORT_TABLE_ORDER[table];
      expect(orderCols.length, `${table} ha orderCols vuoto`).toBeGreaterThan(0);
      for (const col of orderCols) {
        expect(
          EXPORT_TABLE_COLUMNS[table],
          `${col} di ${table} deve essere inclusa nelle colonne proiettate`,
        ).toContain(col);
      }
    }
  });

  it('getTableRowKey calcola chiavi univoche composte da tutte le colonne di ordinamento totale', () => {
    expect(getTableRowKey('fitness_metrics', { id: 'fm-123', steps: 500 })).toBe('fm-123');
    expect(
      getTableRowKey('caregiver_links', {
        caregiver_id: 'cg-1',
        subject_id: 'sub-2',
        permissions: ['read'],
      }),
    ).toBe('cg-1:sub-2');
    expect(
      getTableRowKey('group_members', {
        group_id: 'grp-42',
        user_id: 'usr-99',
        role: 'member',
      }),
    ).toBe('grp-42:usr-99');
    expect(
      getTableRowKey('user_roles', {
        user_id: 'usr-99',
        role: 'pro',
      }),
    ).toBe('usr-99:pro');
  });

  it('sanitizeCaregiverLink (Opzione B): esclude gli UUID della controparte secondo GDPR Art. 20 c. 4', () => {
    const rawAsCaregiver = {
      caregiver_id: UID,
      subject_id: '20000000-0000-4000-8000-000000000099',
      permissions: ['read_metrics', 'receive_alerts'],
      granted_at: '2026-01-01T00:00:00Z',
      expires_at: '2027-01-01T00:00:00Z',
      revoked_at: null,
    };
    const sanitizedAsCaregiver = sanitizeCaregiverLink(rawAsCaregiver, UID);
    expect(sanitizedAsCaregiver).toEqual({
      relationship_role: 'caregiver',
      permissions: ['read_metrics', 'receive_alerts'],
      granted_at: '2026-01-01T00:00:00Z',
      expires_at: '2027-01-01T00:00:00Z',
      revoked_at: null,
    });
    // Nessun UUID di terzi nel risultato
    expect(JSON.stringify(sanitizedAsCaregiver)).not.toContain('20000000-0000-4000-8000-000000000099');
    expect(JSON.stringify(sanitizedAsCaregiver)).not.toContain(UID);

    const rawAsSubject = {
      caregiver_id: '30000000-0000-4000-8000-000000000077',
      subject_id: UID,
      permissions: ['read_metrics'],
      granted_at: '2026-02-01T00:00:00Z',
      expires_at: null,
      revoked_at: '2026-03-01T00:00:00Z',
    };
    const sanitizedAsSubject = sanitizeCaregiverLink(rawAsSubject, UID);
    expect(sanitizedAsSubject).toEqual({
      relationship_role: 'subject',
      permissions: ['read_metrics'],
      granted_at: '2026-02-01T00:00:00Z',
      expires_at: null,
      revoked_at: '2026-03-01T00:00:00Z',
    });
    // Nessun UUID di terzi nel risultato
    expect(JSON.stringify(sanitizedAsSubject)).not.toContain('30000000-0000-4000-8000-000000000077');
    expect(JSON.stringify(sanitizedAsSubject)).not.toContain(UID);
  });

  it('scoping caregiver vs dati sanitari: solo caregiver_links usa anyOf, fitness_metrics e workouts restano ancorati a user_id', () => {
    expect(EXPORT_OWNER_SCOPE.caregiver_links).toEqual({ anyOf: ['caregiver_id', 'subject_id'] });
    expect(EXPORT_OWNER_SCOPE.fitness_metrics).toEqual({ column: 'user_id' });
    expect(EXPORT_OWNER_SCOPE.workouts).toEqual({ column: 'user_id' });
  });

  it('una colonna sola: applica eq(colonna, utente)', () => {
    const q = recorder();
    scopeToOwner(q, 'fitness_metrics', UID);
    expect(q.calls).toEqual([`eq(user_id,${UID})`]);
  });

  it('profiles si filtra su id, non su user_id', () => {
    const q = recorder();
    scopeToOwner(q, 'profiles', UID);
    expect(q.calls).toEqual([`eq(id,${UID})`]);
  });

  it('caregiver_links: la relazione e\' dell\'utente se lo e\' una delle due parti', () => {
    const q = recorder();
    scopeToOwner(q, 'caregiver_links', UID);
    expect(q.calls).toEqual([`or(caregiver_id.eq.${UID},subject_id.eq.${UID})`]);
  });

  it('rifiuta un id che non e\' un UUID: niente filtro composto da input libero', () => {
    for (const cattivo of ['', 'abc', `${UID},subject_id.neq.x`, `${UID})`, "' or 1=1 --"]) {
      const q = recorder();
      expect(() => scopeToOwner(q, 'caregiver_links', cattivo), cattivo).toThrow();
      expect(q.calls).toEqual([]);
    }
  });

  it('il test SQL su PG17 usa lo stesso elenco tabella -> proprietario', () => {
    // supabase/tests/reset-pg17/16-test-export-web-ambito-righe.sql riscrive
    // l'elenco per conto suo (gira in un database, non importa TypeScript). Se i
    // due elenchi divergono, il test SQL misura un ambito che il client non usa.
    const sql = fs.readFileSync(
      path.join(__dirname, '../../supabase/tests/reset-pg17/16-test-export-web-ambito-righe.sql'),
      'utf8',
    );
    const nelSql = new Map<string, string>();
    for (const m of sql.matchAll(/^\s*array\['([a-z0-9_]+)','([a-z0-9_|]+)'\],?$/gm)) {
      nelSql.set(m[1], m[2]);
    }
    expect([...nelSql.keys()].sort()).toEqual([...EXPORT_TABLES].sort());
    for (const table of EXPORT_TABLES) {
      const s = EXPORT_OWNER_SCOPE[table];
      const atteso = 'column' in s ? s.column : s.anyOf.join('|');
      expect(nelSql.get(table), table).toBe(atteso);
    }
  });
});
