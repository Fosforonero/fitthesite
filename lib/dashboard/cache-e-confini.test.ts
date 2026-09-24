/**
 * Il verdetto e le letture della dashboard web non passano mai da una cache,
 * non usano la chiave di servizio e non arrivano al browser.
 *
 * Una cache condivisa servirebbe i dati di un utente a un altro (la chiave
 * della Data Cache di Next non contiene i cookie) e terrebbe vivo un verdetto
 * dopo una scadenza o un rimborso. La chiave di servizio salta la RLS: una
 * lettura chiavata su un uuid e' la via piu' corta per servire a un utente i
 * dati di un altro. Queste sono prove sul sorgente; la risposta HTTP reale
 * (Cache-Control, pagina dinamica) si controlla con `next build` e
 * `next start`, e il referto sta nella PR.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const RADICE = path.resolve(__dirname, '../..');
const DASHBOARD = [
  'lib/dashboard/verdetto.ts',
  'lib/dashboard/letture-titolare.ts',
  'lib/dashboard/testi.ts',
  'lib/dashboard/interruttore.ts',
  'app/(frontend)/[locale]/app/dashboard/page.tsx',
];

const leggi = (rel: string) => readFileSync(path.join(RADICE, rel), 'utf8');
/** Il codice senza i commenti: i commenti possono nominare cio' che il codice non fa. */
const codice = (rel: string) =>
  leggi(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

function fileSotto(dir: string): string[] {
  const assoluta = path.join(RADICE, dir);
  const out: string[] = [];
  for (const nome of readdirSync(assoluta)) {
    if (nome === 'node_modules' || nome.startsWith('.')) continue;
    const p = path.join(assoluta, nome);
    if (statSync(p).isDirectory()) out.push(...fileSotto(path.join(dir, nome)));
    else if (/\.(ts|tsx)$/.test(nome) && !/\.test\.tsx?$/.test(nome)) out.push(path.join(dir, nome));
  }
  return out;
}

describe('dashboard web: nessuna cache', () => {
  it.each(DASHBOARD)('%s non usa API di cache', (rel) => {
    const c = codice(rel);
    expect(c).not.toMatch(/unstable_cache/);
    expect(c).not.toMatch(/['"]use cache['"]/);
    expect(c).not.toMatch(/force-cache/);
    expect(c).not.toMatch(/generateStaticParams/);
    expect(c).not.toMatch(/revalidate\s*[:=]\s*[1-9]/);
    expect(c).not.toMatch(/localStorage|sessionStorage|indexedDB/);
  });

  it('la pagina usa il client senza cache', () => {
    expect(codice('app/(frontend)/[locale]/app/dashboard/page.tsx')).toMatch(/createClient\(\{\s*senzaCache:\s*true\s*\}\)/);
  });
});

describe('dashboard web: niente chiave di servizio, niente select(*)', () => {
  it.each(DASHBOARD)('%s', (rel) => {
    const c = codice(rel);
    expect(c).not.toMatch(/createAdminClient|SERVICE_ROLE|service_role|supabase\/admin/);
    expect(c).not.toMatch(/select\(\s*['"]\*['"]\s*\)/);
  });
});

describe('dashboard web: solo lato server', () => {
  it('nessun componente client importa il verdetto o le letture', () => {
    const colpevoli = ['app', 'components', 'lib']
      .flatMap(fileSotto)
      .filter((rel) => /^\s*['"]use client['"]/m.test(leggi(rel)))
      .filter((rel) => /lib\/dashboard\/|from ['"]\.\/(verdetto|letture-titolare)['"]/.test(leggi(rel)));
    expect(colpevoli).toEqual([]);
  });
});
