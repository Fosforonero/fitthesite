/**
 * Confini della sede condivisa dei grafici (components/charts).
 *
 * La sede condivisa contiene SOLO codice neutro: mattoni visivi, tipi, normalizzazione dei punti e il
 * motore del grafico. Non conosce l'anteprima (fixture, dati sintetici, schermate, parametri, accesso,
 * flag, testi e modello del prototipo), non conosce il lato server (verdetto, letture, next/headers,
 * server-only) e non porta con se' il fuso dell'anteprima. Cosi' la pagina reale puo' montare il grafico
 * senza importare l'anteprima, e l'anteprima non ha un secondo motore.
 *
 * La prova e' una lista chiusa, non un'esenzione: ogni import di ogni file della cartella deve essere
 * `react` o un file della cartella stessa; in piu' la CHIUSURA TRANSITIVA degli import (anche di tipo)
 * non puo' uscire dalla cartella. Analisi sul testo: un import con nome costruito a runtime non si vede.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const RADICE = path.resolve(__dirname, '../..');
const SEDE = 'components/charts';

/** Nome della cartella dell'anteprima, scritto a pezzi: questo file non deve contenere un import testuale dell'anteprima. */
const WD = 'web' + '-dashboard';

const leggi = (rel: string) => readFileSync(path.join(RADICE, rel), 'utf8');
const senzaCommenti = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function sorgentiSede(): string[] {
  const out: string[] = [];
  const visita = (dir: string) => {
    for (const nome of readdirSync(path.join(RADICE, dir))) {
      const rel = `${dir}/${nome}`;
      if (statSync(path.join(RADICE, rel)).isDirectory()) visita(rel);
      else if (/\.(ts|tsx)$/.test(nome) && !/\.test\.tsx?$/.test(nome)) out.push(rel);
    }
  };
  visita(SEDE);
  return out.sort();
}

/** Ogni specificatore importato o ri-esportato, di valore o di tipo, statico o dinamico. */
function specificatori(sorgente: string): string[] {
  const c = senzaCommenti(sorgente);
  const trovati: string[] = [];
  for (const m of c.matchAll(/(?:^|[;\n])\s*(?:import|export)\s+(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/g)) trovati.push(m[1]);
  for (const m of c.matchAll(/(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)/g)) trovati.push(m[1]);
  return trovati;
}

/**
 * Risolve uno specificatore locale (alias @/ o relativo) in un percorso del repository; null se e' un
 * pacchetto. Se il file non esiste lo si restituisce lo stesso, cosi' un import fuori sede resta visibile.
 */
function risolvi(da: string, spec: string, esiste: (rel: string) => boolean): string | null {
  const base = spec.startsWith('@/')
    ? spec.slice(2)
    : spec.startsWith('.')
      ? path.posix.normalize(path.posix.join(path.posix.dirname(da), spec))
      : null;
  if (base === null) return null;
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(esiste) ?? base;
}

/** Percorsi raggiungibili dai file dati, seguendo ogni import locale (anche di tipo). */
function chiusura(partenza: string, leggiFile: (rel: string) => string | null): Set<string> {
  const visti = new Set<string>();
  const coda = [partenza];
  while (coda.length > 0) {
    const corrente = coda.pop()!;
    const src = leggiFile(corrente);
    if (src === null) continue;
    for (const spec of specificatori(src)) {
      const dest = risolvi(corrente, spec, (rel) => leggiFile(rel) !== null);
      if (dest && !visti.has(dest)) {
        visti.add(dest);
        coda.push(dest);
      }
    }
  }
  return visti;
}

const SEDE_O_REACT = /^(?:react|react\/[\w-]+)$|^@\/components\/charts\/[\w./-]+$|^\.\/[\w.-]+$/;

/** Cio' che non deve mai comparire fra gli import della sede condivisa (per i messaggi e per la controprova). */
const VIETATI: ReadonlyArray<{ nome: string; re: RegExp }> = [
  { nome: 'lib/web-dashboard (anteprima)', re: /(^|\/)lib\/web-dashboard(\/|$)/ },
  { nome: 'components/web-dashboard (anteprima)', re: /(^|\/)components\/web-dashboard(\/|$)/ },
  { nome: 'lib/dashboard (lato server)', re: /(^|\/)lib\/dashboard(\/|$)/ },
  { nome: 'app/', re: /^(@\/)?app\// },
  { nome: 'next/headers', re: /^next\/headers$/ },
  { nome: 'server-only', re: /^server-only$/ },
  { nome: 'fixtures', re: /(^|\/)fixtures?(\/|$|\.)/ },
  { nome: 'synthetic', re: /(^|\/)synthetic(\/|$|\.)/ },
  { nome: 'screens', re: /(^|\/)screens(\/|$)/ },
  { nome: 'params', re: /(^|\/)params(\/|$|\.)/ },
  { nome: 'access', re: /(^|\/)access(\/|$|\.)/ },
  { nome: 'flag', re: /(^|\/)flag(\/|$|\.)/ },
  { nome: 'model', re: /(^|\/)model(\/|$|\.)/ },
  { nome: 'dashboard-preview', re: /dashboard-preview/ },
];

const violazioni = (rel: string, sorgente: string): string[] => {
  const out: string[] = [];
  for (const spec of specificatori(sorgente)) {
    for (const v of VIETATI) if (v.re.test(spec)) out.push(`${rel}: import '${spec}' [${v.nome}]`);
    if (!SEDE_O_REACT.test(spec) && !VIETATI.some((v) => v.re.test(spec))) out.push(`${rel}: import '${spec}' [fuori dalla lista chiusa]`);
  }
  const c = senzaCommenti(sorgente);
  if (/Europe\/Rome/.test(c)) out.push(`${rel}: contiene Europe/Rome`);
  if (/dashboard-preview/.test(c)) out.push(`${rel}: nomina dashboard-preview`);
  if (/\.\.\/\.\./.test(c)) out.push(`${rel}: percorso relativo che esce dalla sede`);
  return out;
};

describe('sede condivisa dei grafici: il rilevatore riconosce cio che deve (controprova)', () => {
  it('vede import vietati, import fuori lista, Europe/Rome e import di tipo o dinamici', () => {
    const caso = (src: string) => violazioni('x.ts', src);
    expect(caso(`import { a } from '@/lib/${WD}/format';`).join()).toMatch(/lib\/web-dashboard/);
    expect(caso(`import type { A } from '@/components/${WD}/primitives';`).join()).toMatch(/components\/web-dashboard/);
    expect(caso(`import { v } from '@/lib/dashboard/verdetto';`).join()).toMatch(/lib\/dashboard/);
    expect(caso(`import { h } from 'next/headers';`).join()).toMatch(/next\/headers/);
    expect(caso(`import 'server-only';`).join()).toMatch(/server-only/);
    expect(caso(`import { f } from '../../lib/${WD}/fixtures/charts-fixtures';`).join()).toMatch(/fixtures/);
    expect(caso(`export { s } from '../screens/X';`).join()).toMatch(/screens/);
    expect(caso(`const m = await import('@/lib/${WD}/params');`).join()).toMatch(/params/);
    expect(caso(`import _ from 'lodash';`).join()).toMatch(/fuori dalla lista chiusa/);
    expect(caso(`const TZ = 'Europe/Rome';`).join()).toMatch(/Europe\/Rome/);
    expect(caso(`const u = '/it/dashboard-preview/steps';`).join()).toMatch(/dashboard-preview/);
    // e non scatta su cio che e' ammesso: react, i file della sede, i commenti
    expect(caso(`import { useState } from 'react';\nimport { CHART } from './primitives';\nimport type { T } from '@/components/charts/types';`)).toEqual([]);
    expect(caso(`// import { a } from '@/lib/${WD}/format'; Europe/Rome\n/* dashboard-preview */`)).toEqual([]);
  });
});

describe('sede condivisa dei grafici: nessuna dipendenza da anteprima, server o fixture', () => {
  const file = sorgentiSede();

  it('la cartella contiene almeno i sette file neutri attesi (controprova: una scansione vuota non prova nulla)', () => {
    expect(file.length).toBeGreaterThanOrEqual(7);
    for (const atteso of ['Icon.tsx', 'chart-kit.tsx', 'primitives.tsx', 'types.ts', 'normalize-points.ts', 'InteractiveChart.tsx', 'DailyStepsChart.tsx']) {
      expect(file, atteso).toContain(`${SEDE}/${atteso}`);
    }
  });

  it('ogni import e solo react o un file della sede; nessun Europe/Rome, nessun dashboard-preview', () => {
    const tutte = file.flatMap((rel) => violazioni(rel, leggi(rel)));
    expect(tutte).toEqual([]);
  });

  it('la chiusura transitiva degli import non esce dalla sede', () => {
    const leggiFile = (rel: string) => {
      try {
        return leggi(rel);
      } catch {
        return null;
      }
    };
    const fuori = file.flatMap((rel) => [...chiusura(rel, leggiFile)].filter((d) => !d.startsWith(`${SEDE}/`)).map((d) => `${rel} -> ${d}`));
    expect(fuori).toEqual([]);
  });

  it('il seguitore di catene vede un import indiretto verso l anteprima (controprova)', () => {
    const grafo: Record<string, string> = {
      'components/charts/A.tsx': "import { x } from './B';",
      'components/charts/B.tsx': `import { f } from '@/lib/${WD}/format';`,
      [`lib/${WD}/format.ts`]: 'export const f = 1;',
    };
    const g = (rel: string) => grafo[rel] ?? null;
    expect([...chiusura('components/charts/A.tsx', g)].sort()).toEqual(['components/charts/B.tsx', `lib/${WD}/format.ts`]);
  });
});
