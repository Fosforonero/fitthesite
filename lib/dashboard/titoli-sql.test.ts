import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TITOLI_DASHBOARD } from './verdetto';

const ROOT = path.join(__dirname, '../..');
const MIGRATION_FILE = path.join(
  ROOT,
  'supabase/migrations/20260924120000_web_dashboard_access_verdict.sql'
);

describe('confronto tra TITOLI_DASHBOARD e la migration del verdetto SQL', () => {
  it('la migration SQL del verdetto esiste', () => {
    expect(fs.existsSync(MIGRATION_FILE)).toBe(true);
  });

  it('TITOLI_DASHBOARD riflette esattamente i titoli che la migration SQL puo produrre', () => {
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');

    // Estrae tutti i pattern: v_titoli := array_append(v_titoli, '...')
    const regex = /v_titoli\s*:=\s*array_append\s*\(\s*v_titoli\s*,\s*'([^']+)'\s*\)/g;
    const matches = [...sql.matchAll(regex)];
    expect(matches.length).toBeGreaterThan(0);

    const titoliSql = matches.map((m) => m[1]);
    const titoliSqlUnivoci = [...new Set(titoliSql)].sort();
    const titoliTs = [...TITOLI_DASHBOARD].sort();

    expect(titoliTs).toEqual(titoliSqlUnivoci);
  });
});
