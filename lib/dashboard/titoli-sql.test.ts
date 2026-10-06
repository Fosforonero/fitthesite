import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { TITOLI_DASHBOARD } from './verdetto';

/**
 * Parita' fra l'elenco dei titoli del sito (TITOLI_DASHBOARD) e quelli che la funzione SQL del verdetto
 * puo' produrre. Confronto sul TESTO della migration, non sul comportamento: un ramo morto o un titolo
 * prodotto da una forma diversa non e' visibile a un confronto di testo (per questo la guardia sulle
 * assegnazioni qui sotto) e la matrice per titolo e' compito dei test PG17 17/19.
 */
const DIR_MIGRATION = path.join(__dirname, '../../supabase/migrations');

/** Toglie i commenti SQL (-- fino a fine riga, e blocchi). Limite dichiarato: un `--` dentro una stringa taglia quella riga. */
const senzaCommenti = (sql: string) => sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, '');

/** La funzione VIVA e' quella dell'ULTIMA migration (per nome) che fa create [or replace] della funzione. */
function definizioneViva() {
  const defs = fs
    .readdirSync(DIR_MIGRATION)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => ({ file, codice: senzaCommenti(fs.readFileSync(path.join(DIR_MIGRATION, file), 'utf8')) }))
    .filter((m) => /create\s+(or\s+replace\s+)?function\s+private\.web_dashboard_verdict\s*\(/i.test(m.codice));
  expect(defs.length, 'nessuna migration definisce private.web_dashboard_verdict').toBeGreaterThan(0);
  return defs[defs.length - 1];
}

describe('TITOLI_DASHBOARD e la definizione viva del verdetto SQL', () => {
  it('stessi titoli, e nessun titolo prodotto in una forma che il confronto non legge', () => {
    const { file, codice } = definizioneViva();
    const strette = [...codice.matchAll(/v_titoli\s*:=\s*array_append\s*\(\s*v_titoli\s*,\s*'([^']+)'\s*\)/gi)];
    expect(strette.length, file).toBeGreaterThan(0);

    // Ogni assegnazione a v_titoli deve essere un array_append stretto: `||`, array_cat, `::text`, `pg_catalog.`,
    // `=` o un titolo vuoto sarebbero titoli invisibili al confronto. (La dichiarazione `text[] := '{}'` non conta.)
    const assegnazioni = codice.match(/\bv_titoli\s*:?=/gi) ?? [];
    expect(assegnazioni.length, `${file}: ogni assegnazione a v_titoli deve essere v_titoli := array_append(v_titoli, 'x')`).toBe(strette.length);

    // Il verdetto espone proprio v_titoli, senza altro mischiato.
    expect(codice, file).toMatch(/'titles'\s*,\s*to_jsonb\(v_titoli\)\s*,/);

    expect([...TITOLI_DASHBOARD].sort(), file).toEqual([...new Set(strette.map((m) => m[1]))].sort());
  });
});
