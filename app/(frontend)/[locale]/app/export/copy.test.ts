import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { locales } from '@/lib/i18n';
import {
  categoriesOfTables,
  EXPORT_CATEGORIES,
  EXPORT_CATEGORY_OF_TABLE,
  EXPORT_TABLES,
} from '@/lib/privacy/export-scope';

import { EXPORT_COPY } from './copy';

/**
 * D-5: la pagina dice la verita' quando il file e' incompleto, in TUTTE le lingue servite, senza ripiego.
 * Prima la pagina aveva testi per 8 lingue e le altre 7 (nl ja ko sv da no fi) cadevano in silenzio sull'italiano.
 */

const CHIAVI_TESTO = [
  'back', 'heading', 'body', 'cta', 'working', 'doneTitle', 'doneBody', 'errorTitle',
  'incompleteTitle', 'incompleteBody', 'incompleteHint', 'unavailableTitle', 'unavailableBody',
] as const;

// «copia completa» e equivalenti: il testo della pagina non deve promettere un file completo
const PROMESSA_DI_COMPLETEZZA: Record<string, RegExp> = {
  it: /copia completa/i, en: /full copy|complete copy/i, es: /copia completa/i, de: /vollständige kopie/i,
  pt: /cópia completa/i, fr: /copie complète/i, pl: /pełną kopię/i, tr: /tam bir kopyasını/i,
  nl: /volledige kopie/i, ja: /完全なコピー/, ko: /전체 사본|완전한 사본/, sv: /fullständig kopia/i,
  da: /komplet kopi/i, no: /komplett kopi/i, fi: /täydellinen kopio|täydellisen kopion/i,
};

describe('copy della pagina di esportazione: 15 lingue servite, nessun ripiego', () => {
  it('ha esattamente le lingue servite dal sito, ognuna con tutte le chiavi non vuote', () => {
    expect(Object.keys(EXPORT_COPY).sort()).toEqual([...locales].sort());
    for (const lc of locales) {
      const t = EXPORT_COPY[lc];
      for (const k of CHIAVI_TESTO) {
        expect(typeof t[k], `${lc}.${k}`).toBe('string');
        expect(t[k].trim().length, `${lc}.${k} vuota`).toBeGreaterThan(0);
      }
      expect(Object.keys(t.categories).sort(), `${lc} categorie`).toEqual([...EXPORT_CATEGORIES].sort());
      for (const c of EXPORT_CATEGORIES) expect(t.categories[c].trim().length, `${lc}.categories.${c}`).toBeGreaterThan(0);
    }
  });

  it('nessuna lingua e\' un ripiego sull\'italiano: titolo, pulsante, corpo ed errore differiscono da quelli italiani', () => {
    for (const lc of locales) {
      if (lc === 'it') continue;
      for (const k of ['heading', 'cta', 'body', 'errorTitle', 'incompleteTitle', 'unavailableTitle'] as const) {
        expect(EXPORT_COPY[lc][k], `${lc}.${k} identico all'italiano`).not.toBe(EXPORT_COPY.it[k]);
      }
    }
  });

  it('nessun em dash (regola di governance sui testi utente)', () => {
    expect(JSON.stringify(EXPORT_COPY)).not.toContain('—');
  });

  it('il corpo NON promette una «copia completa»; la frase che introduce l\'elenco finisce con i due punti', () => {
    for (const lc of locales) {
      expect(EXPORT_COPY[lc].body, `${lc}.body`).not.toMatch(PROMESSA_DI_COMPLETEZZA[lc]);
      expect(EXPORT_COPY[lc].incompleteBody.trim(), `${lc}.incompleteBody`).toMatch(/[:：]$/);
      // la pagina e il suo avviso non devono contenere nomi tecnici
      const valori = Object.values(EXPORT_COPY[lc]).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v)));
      expect(valori.join(' | '), lc).not.toMatch(/challenge_|fitness_metrics|user_roles|42P17/i);
    }
  });

  it('le categorie di una lingua sono distinte fra loro (nessuna etichetta usata per due categorie)', () => {
    for (const lc of locales) {
      const etichette = EXPORT_CATEGORIES.map((c) => EXPORT_COPY[lc].categories[c].toLowerCase());
      expect(new Set(etichette).size, `${lc}: etichette duplicate`).toBe(EXPORT_CATEGORIES.length);
    }
  });
});

describe('categorie mostrate all\'utente', () => {
  it('ogni tabella dell\'export ha una categoria e ogni categoria e\' usata', () => {
    for (const t of EXPORT_TABLES) expect(EXPORT_CATEGORIES, t).toContain(EXPORT_CATEGORY_OF_TABLE[t]);
    expect(new Set(EXPORT_TABLES.map((t) => EXPORT_CATEGORY_OF_TABLE[t]))).toEqual(new Set(EXPORT_CATEGORIES));
  });

  it('categoriesOfTables: senza doppioni, nell\'ordine fisso delle categorie', () => {
    expect(categoriesOfTables(['challenge_scores', 'challenge_participants'])).toEqual(['challenges']);
    expect(categoriesOfTables(['user_roles', 'devices', 'fitness_metrics', 'challenge_scores'])).toEqual([
      'devices',
      'metrics',
      'challenges',
      'roles',
    ]);
    expect(categoriesOfTables([])).toEqual([]);
  });
});

describe('page.tsx: nessun ripiego non dichiarato', () => {
  const src = readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('usa EXPORT_COPY[lc] e non definisce una mappa parziale propria', () => {
    expect(src).toMatch(/EXPORT_COPY\[lc\]/);
    expect(src).not.toMatch(/const L\s*=/);
    expect(src).not.toMatch(/lc in L/);
    expect(src).not.toMatch(/keyof typeof L/);
  });
});
