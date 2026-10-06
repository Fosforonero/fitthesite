import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { locales, type Locale } from '@/lib/i18n';
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

// la clausola «se una categoria non e' disponibile» (controllo POSITIVO: la lista nera sopra si aggira con sinonimi)
const CLAUSOLA_NON_DISPONIBILE: Record<string, RegExp> = {
  it: /non è disponibile/, en: /not available/, es: /no está disponible/, de: /nicht verfügbar/, pt: /não estiver disponível/,
  fr: /n'est pas disponible/, pl: /niedostępna/, tr: /kullanılamıyorsa/, nl: /niet beschikbaar/, ja: /利用できない/,
  ko: /사용할 수 없는/, sv: /inte är tillgänglig/, da: /ikke er tilgængelig/, no: /ikke er tilgjengelig/, fi: /ei ole saatavilla/,
};

describe('copy della pagina di esportazione: 15 lingue servite, nessun ripiego', () => {
  it('il corpo dice che se una categoria non e\' disponibile il file lo indica (clausola presente in ogni lingua)', () => {
    for (const lc of locales) expect(EXPORT_COPY[lc].body, `${lc}.body`).toMatch(CLAUSOLA_NON_DISPONIBILE[lc]);
  });

  it('la pagina sospesa non da\' una causa ne\' rassicurazioni: in un\'emergenza la causa e\' sconosciuta (nessuna «manutenzione», nessun «dati non interessati»)', () => {
    const CAUSA_O_RASSICURAZIONE = /manutenzion|maintenance|Wartung|mantenimiento|mantenimento|manutenção|conserwac|bakım|onderhoud|メンテナンス|점검|underhåll|vedligehold|vedlikehold|huolto|non sono interessat|not affected|no se ven afectad|nicht betroffen|não são afetad|ne sont pas concern|nie ma to wpływu|etkilen|worden hier niet|影響|영향|påverkas inte|ikke berørt|påvirkes ikke|ei vaikuta/i;
    for (const lc of locales) {
      expect(EXPORT_COPY[lc].unavailableTitle, `${lc}.unavailableTitle`).not.toMatch(CAUSA_O_RASSICURAZIONE);
      expect(EXPORT_COPY[lc].unavailableBody, `${lc}.unavailableBody`).not.toMatch(CAUSA_O_RASSICURAZIONE);
    }
  });

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

  const piatto = (t: (typeof EXPORT_COPY)[Locale]): Record<string, string> => ({
    ...Object.fromEntries(Object.entries(t).filter(([, v]) => typeof v === 'string') as [string, string][]),
    ...Object.fromEntries(Object.entries(t.categories).map(([k, v]) => [`categories.${k}`, v])),
  });
  // unica coincidenza legittima con l'inglese: «Error» in spagnolo (la parola e' la stessa)
  const COINCIDENZE_LEGITTIME_CON_EN = new Set(['es.errorTitle']);

  it('nessuna lingua e\' un ripiego: NESSUNA stringa (testi e categorie) coincide con l\'italiano, e nessuna con l\'inglese salvo «Error» in spagnolo', () => {
    const it_ = piatto(EXPORT_COPY.it);
    const en = piatto(EXPORT_COPY.en);
    for (const lc of locales) {
      if (lc === 'it') continue;
      const t = piatto(EXPORT_COPY[lc]);
      for (const k of Object.keys(it_)) {
        expect(t[k], `${lc}.${k} identica all'italiano`).not.toBe(it_[k]);
        if (lc !== 'en' && !COINCIDENZE_LEGITTIME_CON_EN.has(`${lc}.${k}`)) {
          expect(t[k], `${lc}.${k} identica all'inglese (ripiego?)`).not.toBe(en[k]);
        }
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

  it('la mappa tabella -> categoria e\' esattamente questa (uno scambio mostrerebbe all\'utente una categoria sbagliata)', () => {
    expect(EXPORT_CATEGORY_OF_TABLE).toEqual({
      profiles: 'profile',
      privacy_consents: 'consents',
      user_settings: 'settings',
      devices: 'devices',
      fitness_metrics: 'metrics',
      workouts: 'workouts',
      caregiver_links: 'careLinks',
      group_members: 'groups',
      b2c_subscriptions: 'subscriptions',
      challenge_participants: 'challenges',
      challenge_scores: 'challenges',
      user_roles: 'roles',
    });
  });

  it('categoriesOfTables per OGNI coppia di tabelle: stesso risultato in entrambi gli ordini, nell\'ordine fisso delle categorie', () => {
    for (const a of EXPORT_TABLES) {
      for (const b of EXPORT_TABLES) {
        const attese = EXPORT_CATEGORIES.filter((c) => c === EXPORT_CATEGORY_OF_TABLE[a] || c === EXPORT_CATEGORY_OF_TABLE[b]);
        expect(categoriesOfTables([a, b]), `${a}+${b}`).toEqual(attese);
        expect(categoriesOfTables([b, a]), `${b}+${a}`).toEqual(attese);
      }
    }
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
