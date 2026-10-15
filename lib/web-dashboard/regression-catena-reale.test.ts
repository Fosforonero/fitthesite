/**
 * Guardrail strutturali della catena reale (pagina -> reader -> qualificazione -> grafico).
 *
 * Perimetro: i sorgenti NON di prova (ne' *.test.* ne' *.fixture.*) di lib/dashboard e della cartella
 * della pagina reale, piu' i componenti client del kit dei grafici. Analisi sul testo, commenti
 * rimossi. Questo file RESTRINGE: non allenta nessun controllo esistente e non ha esenzioni.
 * Sta in lib/web-dashboard perche' puo' importare i pattern condivisi (regression-patterns).
 */
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FORBIDDEN_PAYWALL,
  FORBIDDEN_SYNC_NAMES,
  FORBIDDEN_VITALS,
  FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND,
} from './regression-patterns';

const RADICE = path.resolve(__dirname, '../..');
const PAGINA = 'app/(frontend)/[locale]/app/dashboard';

const senzaCommenti = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const leggi = (rel: string) => fs.readFileSync(path.join(RADICE, rel), 'utf8');

function sorgenti(dir: string): string[] {
  const out: string[] = [];
  for (const nome of fs.readdirSync(path.join(RADICE, dir))) {
    const rel = `${dir}/${nome}`;
    if (fs.statSync(path.join(RADICE, rel)).isDirectory()) out.push(...sorgenti(rel));
    else if (/\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome) && !/\.fixture\.tsx?$/.test(nome)) out.push(rel);
  }
  return out;
}

const PERIMETRO = [...sorgenti('lib/dashboard'), ...sorgenti(PAGINA)];

describe('catena reale: il perimetro scansionato esiste', () => {
  it('comprende i moduli della catena e la pagina', () => {
    for (const f of ['finestra.ts', 'passi.ts', 'testi.ts', 'letture-titolare.ts', 'verdetto.ts']) {
      expect(PERIMETRO, f).toContain(`lib/dashboard/${f}`);
    }
    expect(PERIMETRO).toContain(`${PAGINA}/page.tsx`);
    expect(PERIMETRO.some((f) => /\.(test|fixture)\./.test(f))).toBe(false);
  });
});

describe('catena reale: frasi e nomi vietati nei sorgenti non di prova', () => {
  const ELENCHI = [
    ...FORBIDDEN_SYNC_NAMES,
    ...FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND,
    ...FORBIDDEN_VITALS,
    ...FORBIDDEN_PAYWALL,
  ];
  const IERI = { name: 'ieri / until yesterday', re: /\bfino\s+a\s+ieri\b|\buntil\s+yesterday\b|\bthrough\s+yesterday\b|\bieri\b|\byesterday\b/i };

  function trovati(src: string): string[] {
    const out: string[] = [];
    senzaCommenti(src)
      .split('\n')
      .forEach((riga, i) => {
        // Unica esclusione, per costruzione e non per file: il messaggio interno di un errore lanciato
        // (`throw new Errore...(...)`) non e' un testo per l'utente; la pagina lo intercetta e mostra
        // solo i testi di testi.ts, scansionati qui senza eccezioni.
        if (/^\s*(if\s*\([^)]*\)\s*)?throw\s+new\s+Errore\w*\(/.test(riga)) return;
        for (const { name, re } of [...ELENCHI, IERI]) if (re.test(riga)) out.push(`${i + 1} [${name}] ${riga.trim().slice(0, 80)}`);
      });
    return out;
  }

  it('controprova: il rilevatore vede cio che deve', () => {
    expect(trovati("const a = 'Sync riuscito';").length).toBeGreaterThan(0);
    expect(trovati("const a = 'Dati fino a ieri';").length).toBeGreaterThan(0);
    expect(trovati("const a = 'Data until yesterday';").length).toBeGreaterThan(0);
    expect(trovati("// fino a ieri\nconst a = 'sette giorni';")).toEqual([]);
    // l'esclusione riguarda solo i messaggi di errore lanciati, non altre righe con la stessa frase
    expect(trovati("if (e) throw new ErroreLettura('x', `lettura non riuscita`);")).toEqual([]);
    expect(trovati("const t = 'Lettura non riuscita';").length).toBeGreaterThan(0);
  });

  it.each(PERIMETRO)('%s', (rel) => {
    expect(trovati(leggi(rel))).toEqual([]);
  });
});

describe('catena reale: nessuno stato di modulo in lib/dashboard', () => {
  function stati(src: string): string[] {
    const c = senzaCommenti(src);
    const out: string[] = [];
    if (/^(export\s+)?(let|var)\s/m.test(c)) out.push('let/var di modulo');
    if (/^(export\s+)?const\s+\w+\s*(:[^=]+)?=\s*new\s+(Map|Set|WeakMap|WeakSet)\b/m.test(c)) out.push('Map/Set di modulo');
    if (/^(export\s+)?const\s+\w+\s*(:[^=]+)?=\s*(new\s+)?(Map|Set|WeakMap|WeakSet)\s*[<(]/m.test(c)) out.push('Map/Set di modulo');
    if (/^(export\s+)?const\s+\w+\s*(:[^=]+)?=\s*(\[\]|\{\})\s*;?\s*$/m.test(c)) out.push('contenitore vuoto di modulo');
    return out;
  }

  it('controprova', () => {
    expect(stati('let x = 1;')).toContain('let/var di modulo');
    expect(stati('export var y;')).toContain('let/var di modulo');
    expect(stati('const m = new Map<string, number>();')).toContain('Map/Set di modulo');
    expect(stati('const s: Set<string> = new Set();')).toContain('Map/Set di modulo');
    expect(stati('const memo = {};')).toContain('contenitore vuoto di modulo');
    expect(stati('function f() {\n  let x = 1;\n  const m = new Map();\n  return x;\n}')).toEqual([]);
  });

  it.each(sorgenti('lib/dashboard'))('%s', (rel) => {
    expect(stati(leggi(rel))).toEqual([]);
  });
});

describe('catena reale: nessuna fixture, anteprima o schermata demo nella pagina e in lib/dashboard', () => {
  const VIETATI = /dashboard-preview|\.fixture['"]|TrendChartsPanel|components\/web-dashboard|lib\/web-dashboard|\/demo[\w./-]*['"]|\bdemo[-_]?data\b/i;
  function importi(src: string): string[] {
    return [...senzaCommenti(src).matchAll(/(?:from\s+|import\(\s*|require\(\s*)['"]([^'"]+)['"]/g)]
      .map((m) => m[1])
      .filter((s) => VIETATI.test(`${s}'`));
  }

  it('controprova', () => {
    expect(importi("import { P } from '@/app/(frontend)/[locale]/dashboard-preview/page';")).toHaveLength(1);
    expect(importi("import x from './a.fixture';")).toHaveLength(1);
    expect(importi("import { T } from '@/components/web-dashboard/TrendChartsPanel';")).toHaveLength(1);
    expect(importi("const m = await import('@/lib/web-dashboard/model');")).toHaveLength(1);
    expect(importi("import { c } from '@/components/charts/DailyStepsChart';\n// import a from './x.fixture';")).toEqual([]);
  });

  it.each(PERIMETRO)('%s', (rel) => {
    expect(importi(leggi(rel))).toEqual([]);
  });
});

describe('catena reale: nessun fuso locale, Intl o ?tz in lib/dashboard e nella pagina', () => {
  const VIETATI: ReadonlyArray<{ name: string; re: RegExp }> = [
    { name: 'Intl', re: /\bIntl\b/ },
    { name: 'toLocale*', re: /\.toLocale\w*\s*\(/ },
    { name: 'Europe/Rome', re: /Europe\/Rome/ },
    { name: '?tz', re: /[?&]tz\b|\btz\s*=|searchParams[^;\n]*['"]tz['"]/ },
    { name: 'timeZone', re: /\btimeZone\b|getTimezoneOffset/ },
    { name: 'getter in fuso locale', re: /\.(getDate|getDay|getFullYear|getHours|getMinutes|getMonth|getSeconds)\s*\(/ },
    { name: 'Date da stringa locale', re: /new\s+Date\(\s*['"`][^'"`]*['"`]\s*\)(?!.*\bZ\b)/ },
  ];
  const trovati = (src: string) => VIETATI.filter(({ re }) => re.test(senzaCommenti(src))).map((v) => v.name);

  it('controprova', () => {
    expect(trovati('new Intl.DateTimeFormat("it")')).toContain('Intl');
    expect(trovati('d.toLocaleDateString()')).toContain('toLocale*');
    expect(trovati("const z = 'Europe/Rome';")).toContain('Europe/Rome');
    expect(trovati('const tz = sp.get("tz"); // ?tz=')).toContain('?tz');
    expect(trovati('d.getHours()')).toContain('getter in fuso locale');
    expect(trovati('d.getUTCHours() + d.toISOString()')).toEqual([]);
  });

  it.each(PERIMETRO)('%s', (rel) => {
    expect(trovati(leggi(rel))).toEqual([]);
  });
});

describe('catena reale: i componenti client del kit non importano nulla del solo server', () => {
  const SERVER = /^(server-only|next\/headers|next\/cache|next\/server)$|lib\/supabase\/server|lib\/supabase\/admin|lib\/dashboard\/(?!testi['"]?$)|^\.\.?\/.*(verdetto|letture-titolare)$/;
  function importiDiValore(src: string): string[] {
    return [...senzaCommenti(src).matchAll(/(?:^|[;\n])\s*(?:import|export)\s+(?!type\b)(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(
      (m) => (m[1] ?? m[2])!,
    );
  }
  const clienti = [...sorgenti('components/charts'), ...sorgenti('components/web-dashboard')].filter((rel) =>
    /^\s*['"]use client['"]/m.test(leggi(rel)),
  );

  it('controprova', () => {
    expect(importiDiValore("import 'server-only';").filter((s) => SERVER.test(s))).toHaveLength(1);
    expect(importiDiValore("import { headers } from 'next/headers';").filter((s) => SERVER.test(s))).toHaveLength(1);
    expect(importiDiValore("import { c } from '@/lib/supabase/server';").filter((s) => SERVER.test(s))).toHaveLength(1);
    expect(importiDiValore("import { l } from '@/lib/dashboard/letture-titolare';").filter((s) => SERVER.test(s))).toHaveLength(1);
    expect(importiDiValore("import type { L } from '@/lib/dashboard/letture-titolare';").filter((s) => SERVER.test(s))).toEqual([]);
    expect(importiDiValore("import { useState } from 'react';").filter((s) => SERVER.test(s))).toEqual([]);
  });

  it('esistono componenti client da controllare', () => {
    expect(clienti.length).toBeGreaterThan(0);
  });

  it.each(clienti.length ? clienti : ['<nessuno>'])('%s', (rel) => {
    if (rel === '<nessuno>') return;
    expect(importiDiValore(leggi(rel)).filter((s) => SERVER.test(s))).toEqual([]);
  });
});
