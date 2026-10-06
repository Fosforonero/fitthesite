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

/**
 * Nessuna API legge i dati della dashboard.
 *
 * Oggi l'unica superficie che serve dati della dashboard e' la pagina /[locale]/app/dashboard, che passa da
 * flag, sessione, verdetto aggiornato e letture col filtro sul proprietario. Un route handler sotto app/api
 * che leggesse fitness_metrics o workouts, o importasse lib/dashboard, sarebbe una seconda porta da
 * controllare. SE IN FUTURO NE ESISTERA' UNA (serie orarie, allenamenti del giorno, dossier) DOVRA' AVERE
 * LO STESSO CONTROLLO su ogni chiamata: flag, sessione, verdetto Pro aggiornato, filtro proprietario, errore
 * di verifica = «riprova». In quel caso non si allarga questa prova in silenzio: si scrive il nome del file in
 * ECCEZIONI con la sua prova, e si dice perche' nel commit.
 *
 * Le scritture non contano: la route di sync e quella di migrazione INSERISCONO nelle tabelle (upsert_*,
 * `.insert`), non le leggono. Limite dichiarato: un nome di tabella costruito a runtime non si vede con
 * un'analisi sul testo.
 */
const ECCEZIONI: string[] = [];

const senzaCommenti = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** Cio' che rende un sorgente una lettura dei dati della dashboard. Elenco vuoto = pulito. */
function usiDellaDashboard(sorgente: string): string[] {
  const c = senzaCommenti(sorgente);
  const trovati: string[] = [];
  if (
    /from\s+['"](?:@\/|(?:\.{1,2}\/)+)(?:[\w.-]+\/)*lib\/dashboard(?:\/|['"])/.test(c) ||
    /import\(\s*['"][^'"]*lib\/dashboard/.test(c) ||
    /require\(\s*['"][^'"]*lib\/dashboard/.test(c)
  ) {
    trovati.push('importa lib/dashboard');
  }
  if (/get_web_dashboard_access/.test(c)) trovati.push('chiama il verdetto della dashboard');
  if (/leggiVerdettoDashboard|leggiMetricheDelTitolare|leggiSerieDelGiorno|leggiAllenamentiDelTitolare|dashboardWebAttiva/.test(c)) {
    trovati.push('usa le letture o l interruttore della dashboard');
  }
  for (const m of c.matchAll(/\.from\(\s*['"`](fitness_metrics|workouts)['"`]\s*\)/g)) {
    const resto = c.slice((m.index ?? 0) + m[0].length);
    const dopo = /^\s*\.(\w+)/.exec(resto)?.[1];
    // la catena finisce al primo punto e virgola: una .select(...) dentro la catena restituisce le righe
    const catena = resto.split(';')[0];
    const scrittura = !!dopo && ['insert', 'upsert', 'update', 'delete'].includes(dopo);
    // una scrittura (insert, upsert, update, delete) non e' una lettura, a meno che la catena non chieda le righe
    if (!scrittura || /\.select\(/.test(catena)) trovati.push(`legge ${m[1]}`);
  }
  return trovati;
}

/** I nomi delle rpc chiamate da un sorgente; `<dinamica>` se il nome non e' una stringa scritta li'. */
function rpcChiamate(sorgente: string): string[] {
  const c = senzaCommenti(sorgente);
  const nomi: string[] = [];
  for (const m of c.matchAll(/\.rpc\(\s*(?:['"`]([A-Za-z0-9_]+)['"`]|([^'"`\s]))/g)) nomi.push(m[1] ?? '<dinamica>');
  return nomi;
}

describe('dashboard web: nessuna API sotto app/api legge i dati della dashboard', () => {
  it('il rilevatore riconosce cio che deve (controprova: un controllo che non trova mai nulla non prova nulla)', () => {
    expect(usiDellaDashboard(`import { x } from '@/lib/dashboard/letture-titolare';`)).toContain('importa lib/dashboard');
    expect(usiDellaDashboard(`import { x } from '../../../../lib/dashboard/verdetto';`)).toContain('importa lib/dashboard');
    expect(usiDellaDashboard(`const m = await import('@/lib/dashboard/interruttore');`)).toContain('importa lib/dashboard');
    expect(usiDellaDashboard(`await supabase.rpc('get_web_dashboard_access')`)).toContain('chiama il verdetto della dashboard');
    expect(usiDellaDashboard(`const v = await leggiVerdettoDashboard(c, id);`)).toContain('usa le letture o l interruttore della dashboard');
    expect(usiDellaDashboard(`await sb.from('fitness_metrics').select('steps')`)).toEqual(['legge fitness_metrics']);
    expect(usiDellaDashboard(`await sb.from("workouts")\n  .select("*")`)).toEqual(['legge workouts']);
    expect(usiDellaDashboard('const { data } = await sb.from(`workouts`);')).toEqual(['legge workouts']);
    // le scritture e i commenti non contano
    expect(usiDellaDashboard(`await admin.from("fitness_metrics").insert(rows);`)).toEqual([]);
    expect(usiDellaDashboard(`await sb.from('workouts').upsert(r)`)).toEqual([]);
    expect(usiDellaDashboard(`// legge fitness_metrics con .from('fitness_metrics').select('x') e lib/dashboard\n/* get_web_dashboard_access */ const a = 1;`)).toEqual([]);
    expect(usiDellaDashboard(`import { Y } from '@/lib/dashboards-altro/x';`)).toEqual([]);
  });

  it('nessun file sotto app/api', () => {
    const file = fileSotto('app/api');
    expect(file.length).toBeGreaterThan(20);
    expect(file.some((f) => f.endsWith(path.join('sync', 'route.ts')))).toBe(true);
    const colpevoli = file
      .filter((rel) => !ECCEZIONI.includes(rel))
      .map((rel) => ({ rel, usi: usiDellaDashboard(leggi(rel)) }))
      .filter((x) => x.usi.length > 0);
    expect(colpevoli).toEqual([]);
  });

  it('le eccezioni dichiarate esistono ancora: una voce vecchia non deve restare a coprire un file nuovo', () => {
    for (const rel of ECCEZIONI) expect(() => leggi(rel)).not.toThrow();
  });
});

/**
 * Il perimetro del rilevatore, allargato (revisione del 30/09): non solo app/api, ma ogni route.ts sotto
 * app/ (anche app/(payload)/api, auth/callback, auth/logout, feed.xml), ogni file con 'use server', e
 * anche i sorgenti .js/.mjs. Una scrittura seguita da .select restituisce le righe: conta come lettura.
 */
function sorgentiApi(): string[] {
  const tutti: string[] = [];
  const visita = (dir: string) => {
    for (const nome of readdirSync(path.join(RADICE, dir))) {
      if (nome === 'node_modules' || nome.startsWith('.')) continue;
      const rel = path.join(dir, nome);
      if (statSync(path.join(RADICE, rel)).isDirectory()) visita(rel);
      else if (/\.(ts|tsx|js|mjs|cjs)$/.test(nome) && !/\.test\.(ts|tsx|js|mjs)$/.test(nome)) tutti.push(rel.split(path.sep).join('/'));
    }
  };
  for (const d of ['app', 'lib', 'components']) visita(d);
  return tutti.filter(
    (rel) =>
      rel.startsWith('app/api/') ||
      (rel.startsWith('app/') && /(^|\/)route\.(ts|tsx|js|mjs|cjs)$/.test(rel)) ||
      /['"]use server['"]/.test(senzaCommenti(leggi(rel))),
  );
}

/**
 * Le rpc che le API chiamano oggi, scritte a mano. Una rpc nuova sotto le API (che potrebbe leggere
 * fitness_metrics o workouts senza che un'analisi sul testo lo veda) fa cadere il test: si aggiunge qui
 * solo dopo aver letto che cosa fa, e si dice perche' nel commit.
 */
const RPC_CONSENTITE_SOTTO_LE_API = [
  'concedi_ponte_ios',
  'rate_limit_cleanup',
  'record_first_sync_transition',
  'registra_tentativo_acquisto',
  'upsert_fitness_metrics_v189',
  'upsert_workouts_v189',
  'user_has_active_entitlement',
];

describe('dashboard web: il rilevatore delle API copre tutto il perimetro', () => {
  it('controprova dei casi nuovi: require, scrittura con .select, rpc', () => {
    expect(usiDellaDashboard(`const d = require('../../lib/dashboard/letture-titolare');`)).toContain('importa lib/dashboard');
    expect(usiDellaDashboard(`const { data } = await sb.from('workouts').upsert(r).select('hr_avg');`)).toEqual(['legge workouts']);
    expect(usiDellaDashboard(`await sb.from('fitness_metrics')\n  .update({ a: 1 })\n  .eq('id', 1)\n  .select();`)).toEqual(['legge fitness_metrics']);
    expect(usiDellaDashboard(`await sb.from('fitness_metrics').delete().eq('id', 1);\nconst x = y.select('a');`)).toEqual([]);
    expect(rpcChiamate(`await sb.rpc(\n  "leggi_metriche_di",\n  { p: 1 })`)).toEqual(['leggi_metriche_di']);
    expect(rpcChiamate('await sb.rpc(nome)')).toEqual(['<dinamica>']);
  });

  it('il perimetro vede le route fuori da app/api e i file use server', () => {
    const file = sorgentiApi();
    for (const atteso of [
      'app/(payload)/api/[...slug]/route.ts',
      'app/(frontend)/[locale]/auth/callback/route.ts',
      'app/(frontend)/[locale]/auth/logout/route.ts',
      'app/(frontend)/[locale]/(marketing)/blog/feed.xml/route.ts',
      'app/api/v1/sync/route.ts',
      'app/(payload)/layout.tsx',
    ]) {
      expect(file, atteso).toContain(atteso);
    }
  });

  it('nessun file del perimetro legge i dati della dashboard', () => {
    const colpevoli = sorgentiApi()
      .filter((rel) => !ECCEZIONI.includes(rel))
      .map((rel) => ({ rel, usi: usiDellaDashboard(leggi(rel)) }))
      .filter((x) => x.usi.length > 0);
    expect(colpevoli).toEqual([]);
  });

  it('le rpc chiamate dal perimetro sono solo quelle della lista chiusa', () => {
    const chiamate = [...new Set(sorgentiApi().flatMap((rel) => rpcChiamate(leggi(rel))))].sort();
    expect(chiamate).toEqual([...RPC_CONSENTITE_SOTTO_LE_API].sort());
  });
});

/**
 * La protezione dalla cache e' data da DUE cose insieme: page.test.tsx (che fa cadere la prova se si
 * tolgono `senzaCache: true` o `export const dynamic`) e questa prova statica. Le 32 prove del cancello
 * (page.cancello.test.tsx) non la coprono: un React cache() o la Data Cache di Next non si osservano con
 * renderToStaticMarkup in jsdom, perche' fuori da RSC cache() non fa niente. Per questo qui si vieta sul
 * sorgente ogni memoria fra richieste: cache(), unstable_cache, 'use cache', e una Map o una variabile
 * di modulo che potrebbe tenere un verdetto o delle righe da una richiesta all'altra.
 */
describe('dashboard web: nessuna memoria fra richieste, prova statica', () => {
  const PERIMETRO = [
    'app/(frontend)/[locale]/app/dashboard/page.tsx',
    ...fileSotto('lib/dashboard').map((f) => f.split(path.sep).join('/')),
  ];

  function memorie(sorgente: string): string[] {
    const c = senzaCommenti(sorgente);
    const trovate: string[] = [];
    if (/(^|[^\w.])cache\s*\(/.test(c) || /import\s*\{[^}]*\bcache\b[^}]*\}\s*from\s*['"]react['"]/.test(c)) trovate.push('cache() di React');
    if (/unstable_cache/.test(c)) trovate.push('unstable_cache');
    if (/['"]use cache['"]/.test(c)) trovate.push("'use cache'");
    if (/^(export\s+)?(let|var)\s/m.test(c)) trovate.push('variabile di modulo');
    if (/^(export\s+)?const\s+\w+\s*(:[^=]+)?=\s*new\s+(Map|Set|WeakMap)\b/m.test(c)) trovate.push('Map o Set di modulo');
    return trovate;
  }

  it('controprova: il rilevatore vede cio che deve', () => {
    expect(memorie(`import { cache } from 'react';\nexport const leggi = cache(async () => 1);`)).toContain('cache() di React');
    expect(memorie(`const v = unstable_cache(f, ['k']);`)).toContain('unstable_cache');
    expect(memorie(`'use cache';\nexport async function f() {}`)).toContain("'use cache'");
    expect(memorie(`let ultimoVerdetto = null;`)).toContain('variabile di modulo');
    expect(memorie(`const perUid = new Map<string, unknown>();`)).toContain('Map o Set di modulo');
    // e non scatta su cio che e' normale
    expect(memorie(`// cache() vietata\nexport function f() { let x = 1; return x; }\nconst c = { senzaCache: true };`)).toEqual([]);
  });

  it('page.tsx e lib/dashboard non tengono memoria fra richieste', () => {
    expect(PERIMETRO).toContain('lib/dashboard/verdetto.ts');
    expect(PERIMETRO).toContain('lib/dashboard/letture-titolare.ts');
    const colpevoli = PERIMETRO.map((rel) => ({ rel, m: memorie(leggi(rel)) })).filter((x) => x.m.length > 0);
    expect(colpevoli).toEqual([]);
  });
});
