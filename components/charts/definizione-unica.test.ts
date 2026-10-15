/**
 * Un solo motore dei grafici: i vecchi percorsi sono ri-esportazioni, ogni simbolo ha UNA definizione.
 *
 * Dopo l'estrazione nella sede condivisa (components/charts) i vecchi file di components/web-dashboard
 * restano per non toccare gli import esistenti e i loro test. Questa prova impedisce due derive:
 *  1. uno shim che torna a contenere logica (un secondo motore che diverge in silenzio);
 *  2. un simbolo del grafico definito in due posti del repository.
 * Analisi sul testo; i test non contano come definizioni.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const RADICE = path.resolve(__dirname, '../..');
/** Nome della cartella dell'anteprima, scritto a pezzi: questo file non deve contenere un import testuale dell'anteprima. */
const WD = 'web' + '-dashboard';
const leggi = (rel: string) => readFileSync(path.join(RADICE, rel), 'utf8');
const senzaCommenti = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** I vecchi percorsi: devono contenere SOLO ri-esportazioni nominate verso la sede condivisa. */
const SHIM = [
  'components/web-dashboard/Icon.tsx',
  'components/web-dashboard/chart-kit.tsx',
  'components/web-dashboard/charts/types.ts',
  'components/web-dashboard/charts/normalize-points.ts',
  'components/web-dashboard/charts/InteractiveChart.tsx',
  'components/web-dashboard/charts/DailyStepsChart.tsx',
] as const;

/** Una ri-esportazione nominata, di valore o di tipo, verso la sede condivisa. Nient'altro. */
const RIESPORTAZIONE = /^export (?:type )?\{[^}]+\} from '@\/components\/charts\/[\w-]+';$/;

/** Istruzioni di un sorgente senza commenti, una per voce (separate da `;`). */
function istruzioni(src: string): string[] {
  return senzaCommenti(src)
    .split(';')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((s) => `${s};`);
}

/** Definizioni ESPORTATE di un sorgente: funzioni, costanti, classi, interfacce, tipi (non le ri-esportazioni). */
function definizioniEsportate(src: string): string[] {
  const c = senzaCommenti(src);
  const nomi: string[] = [];
  for (const m of c.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm)) nomi.push(m[1]);
  return nomi;
}

function sorgenti(): string[] {
  const out: string[] = [];
  const visita = (dir: string) => {
    for (const nome of readdirSync(path.join(RADICE, dir))) {
      if (nome === 'node_modules' || nome.startsWith('.')) continue;
      const rel = `${dir}/${nome}`;
      if (statSync(path.join(RADICE, rel)).isDirectory()) visita(rel);
      else if (/\.(ts|tsx)$/.test(nome) && !/\.test\.tsx?$/.test(nome)) out.push(rel);
    }
  };
  for (const d of ['app', 'components', 'lib']) visita(d);
  return out;
}

describe('i vecchi percorsi dei grafici sono solo ri-esportazioni', () => {
  it('il rilevatore distingue una ri-esportazione da logica (controprova)', () => {
    expect(RIESPORTAZIONE.test(`export { Icon } from '@/components/charts/Icon';`)).toBe(true);
    expect(RIESPORTAZIONE.test(`export type { IconName } from '@/components/charts/Icon';`)).toBe(true);
    expect(RIESPORTAZIONE.test(`export * from '@/components/charts/types';`)).toBe(false);
    expect(RIESPORTAZIONE.test(`export function Icon() { return null; }`)).toBe(false);
    expect(RIESPORTAZIONE.test(`export { Icon } from './Icon';`)).toBe(false);
    expect(RIESPORTAZIONE.test(`export { Icon } from '@/components/${WD}/Icon';`)).toBe(false);
    expect(definizioniEsportate(`export function Foo() {}\nexport const BAR = 1;\nexport type T = string;\nexport { X } from './x';`)).toEqual(['Foo', 'BAR', 'T']);
  });

  it.each(SHIM)('%s contiene solo export {..} from @/components/charts/..', (rel) => {
    const st = istruzioni(leggi(rel));
    expect(st.length, rel).toBeGreaterThan(0);
    for (const s of st) expect(s, `${rel}: ${s}`).toMatch(RIESPORTAZIONE);
    expect(definizioniEsportate(leggi(rel)), rel).toEqual([]);
  });

  it('primitives.tsx del prototipo non definisce piu CHART, Card, Chip, SectionLabel: li ri-esporta', () => {
    const src = leggi('components/web-dashboard/primitives.tsx');
    expect(src).toMatch(/export \{ CHART, Card, Chip, SectionLabel \} from '@\/components\/charts\/primitives';/);
    const def = definizioniEsportate(src);
    for (const n of ['CHART', 'Card', 'Chip', 'SectionLabel']) expect(def, n).not.toContain(n);
  });
});

describe('ogni simbolo del grafico e definito una volta sola nel repository', () => {
  const tutti = sorgenti();
  const sede = tutti.filter((f) => f.startsWith('components/charts/'));

  it('la sede condivisa esporta i simboli attesi (controprova)', () => {
    const esportati = sede.flatMap((f) => definizioniEsportate(leggi(f)));
    for (const n of ['InteractiveChart', 'DailyStepsChart', 'normalizeChartPoints', 'PatternDefs', 'Icon', 'CHART', 'Card', 'Chip', 'SectionLabel', 'ChartFrame', 'StateLegend']) {
      expect(esportati, n).toContain(n);
    }
  });

  it('nessun simbolo esportato dalla sede e definito e ESPORTATO anche altrove', () => {
    const attesi = new Map<string, string>();
    for (const f of sede) for (const n of definizioniEsportate(leggi(f))) attesi.set(n, f);
    const doppi: string[] = [];
    for (const f of tutti) {
      if (f.startsWith('components/charts/')) continue;
      for (const n of definizioniEsportate(leggi(f))) {
        const dove = attesi.get(n);
        if (dove) doppi.push(`${n}: definito in ${dove} e in ${f}`);
      }
    }
    expect(doppi).toEqual([]);
  });
});
