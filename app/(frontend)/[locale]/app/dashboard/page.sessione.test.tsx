/**
 * Logout e cambio account sulla pagina REALE /[locale]/app/dashboard: nessun dato sanitario del primo
 * account deve ricomparire nella risposta di chi viene dopo.
 *
 * Stesso impianto di page.cancello.test.tsx (client Supabase finto con spie su getUser, rpc e from), ma
 * con DUE account e un solo «database» condiviso: le righe di A e di B stanno nella stessa tabella, e il
 * filtro sul proprietario e' l'unica cosa che le separa. Ogni account ha valori SENTINELLA sintetici e
 * unici (passi, giorni di misura, fonte, distanza, HRV, email, uid, conteggio dei giorni): dopo ogni
 * richiesta si cerca ciascuna sentinella dell'altro account in tutto cio' che la pagina produce.
 *
 * Cosa si guarda, per ogni richiesta:
 *   - l'HTML reso (renderToStaticMarkup), attributi compresi;
 *   - l'albero React restituito dalla pagina, espanso e serializzato con TUTTE le props. E' cio' da cui
 *     Next costruisce il payload RSC di navigazione (`?_rsc=`): la pagina non ha componenti client, quindi
 *     il payload e' la serializzazione di questo albero. Il flusso RSC vero non si produce qui (serve il
 *     runtime `react-server` di Next): e' dichiarato nel resoconto. `__NEXT_DATA__` non esiste nell'App
 *     Router;
 *   - per un redirect, il messaggio e l'oggetto dell'errore lanciato (la destinazione).
 *
 * Tre famiglie:
 *   1. LOGOUT: A, poi la stessa pagina senza sessione, poi di nuovo A. Il modulo non conserva niente fra
 *      una richiesta e l'altra (nessuna memoria a livello di modulo, nessun cache() di React).
 *   2. CAMBIO ACCOUNT: A poi B (concesso, negato, verifica non disponibile), e A e B INTERCALATI, con
 *      risposte finte che arrivano in ordine incrociato.
 *   3. il ritorno con la cache del browser sta in intestazioni-cache.test.ts (intestazioni HTTP) e in
 *      components/BackForwardGuard.test.tsx (tasto indietro, bfcache).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { isValidElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';

import DashboardWebPage from './page';

// ── Due account sintetici, con sentinelle che non compaiono in nessun altro punto ──────────────────

type Account = {
  nome: 'A' | 'B';
  uid: string;
  email: string;
  passi: number;
  giorni: string[];
  fonte: string;
  distanza: number;
  hrv: number;
};

const A: Account = {
  nome: 'A',
  uid: 'a5e55100-0000-4000-8000-00000000a001',
  email: 'sentinella-alfa-7q2@example.invalid',
  passi: 48213,
  giorni: ['2026-09-11', '2026-09-13', '2026-09-17'],
  fonte: 'fonte-alfa-qx7',
  distanza: 31415.9,
  hrv: 43.219,
};

const B: Account = {
  nome: 'B',
  uid: 'b5e55100-0000-4000-8000-00000000b002',
  email: 'sentinella-beta-4k9@example.invalid',
  passi: 61877,
  giorni: ['2026-09-12', '2026-09-14', '2026-09-16', '2026-09-18', '2026-09-20'],
  fonte: 'fonte-beta-kw4',
  distanza: 27182.8,
  hrv: 71.338,
};

/** Il testo del conteggio: 3 giorni per A, 5 per B. Anche questo e' un dato dell'account. */
const conteggio = (x: Account) => `Giorni con dati negli ultimi 30 giorni: ${x.giorni.length}.`;

/** Tutto cio' che di un account non deve mai finire nella risposta di un altro. */
function sentinelle(x: Account): string[] {
  return [
    String(x.passi),
    x.email,
    x.uid,
    x.fonte,
    String(x.distanza),
    String(x.hrv),
    ...x.giorni,
    conteggio(x),
  ];
}

type Riga = Record<string, unknown>;

function righeDi(x: Account): Riga[] {
  return x.giorni.map((giorno, i) => ({
    id: `${x.nome}-${i}`,
    user_id: x.uid,
    local_day_key: giorno,
    source: x.fonte,
    steps: x.passi,
    distance_meters: x.distanza,
    hrv_rmssd: x.hrv,
  }));
}

/** UN solo database, con le righe di entrambi: e' il filtro sul proprietario a separarle. */
const DATABASE: Riga[] = [...righeDi(A), ...righeDi(B)];

// ── Il client finto ─────────────────────────────────────────────────────────────────────────────────

type Rpc = { data: unknown; error: { code?: string } | null } | 'solleva';
type Chiamata = { tabella: string; select: string; eq: string[]; restituite: Riga[] };

const concesso = { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null };
const negato = (motivo: string) => ({ contractVersion: 1, granted: false, titles: [], denialReason: motivo });

const attendi = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Il client di UNA richiesta: la sessione e' `account` (null = dopo il logout). `ritardi` rallenta
 * ciascuno dei tre passaggi asincroni, per incrociare due richieste in volo.
 */
function clientDi(
  account: Account | null,
  opzioni: { rpc?: Rpc; ritardi?: { getUser: number; rpc: number; lettura: number } } = {},
) {
  const registro = { getUser: 0, rpc: [] as string[], from: [] as Chiamata[] };
  const ritardi = opzioni.ritardi ?? { getUser: 0, rpc: 0, lettura: 0 };
  const rpc = opzioni.rpc ?? { data: concesso, error: null };
  const client = {
    auth: {
      getUser: async () => {
        registro.getUser++;
        await attendi(ritardi.getUser);
        return { data: { user: account ? { id: account.uid, email: account.email } : null } };
      },
    },
    rpc: (nome: string) => ({
      abortSignal: async () => {
        registro.rpc.push(nome);
        await attendi(ritardi.rpc);
        if (rpc === 'solleva') throw new TypeError('fetch failed');
        return rpc;
      },
    }),
    from: (tabella: string) => {
      const chiamata: Chiamata = { tabella, select: '', eq: [], restituite: [] };
      registro.from.push(chiamata);
      let righe = [...DATABASE];
      const f = {
        select: (colonne: string) => {
          chiamata.select = colonne;
          return f;
        },
        eq: (c: string, v: string) => {
          chiamata.eq.push(`${c}=${v}`);
          righe = righe.filter((r) => r[c] === v);
          return f;
        },
        gte: () => f,
        lte: () => f,
        lt: () => f,
        order: () => f,
        range: async () => {
          await attendi(ritardi.lettura);
          chiamata.restituite = righe;
          return { data: righe, error: null };
        },
      };
      return f;
    },
  };
  return { account, client, registro };
}

type Finto = ReturnType<typeof clientDi>;

// ── Cosa esce da una richiesta ──────────────────────────────────────────────────────────────────────

/**
 * L'albero restituito dalla pagina, espanso fino agli elementi host e serializzato con tutte le props
 * (attributi compresi). I componenti della pagina sono funzioni sincrone senza hook: si chiamano.
 */
function espandi(nodo: unknown): unknown {
  if (Array.isArray(nodo)) return nodo.map(espandi);
  if (isValidElement(nodo)) {
    const { type, props } = nodo as ReactElement<Record<string, unknown>>;
    if (typeof type === 'function') return espandi((type as (p: unknown) => unknown)(props));
    const { children, ...attributi } = props;
    return { tipo: typeof type === 'string' ? type : String(type), attributi, figli: espandi(children) };
  }
  return nodo;
}

type Uscita = { esito: 'pagina'; html: string; albero: string; tutto: string } | { esito: 'errore'; messaggio: string; tutto: string };

/** Una richiesta: il client la serve `createClient`, come fa Next con i cookie della richiesta. */
async function richiesta(finto: Finto, locale = 'it'): Promise<Uscita> {
  vi.mocked(createClient).mockResolvedValueOnce(finto.client as never);
  return esegui(DashboardWebPage({ params: Promise.resolve({ locale }) }));
}

async function esegui(pagina: ReturnType<typeof DashboardWebPage>): Promise<Uscita> {
  try {
    const albero = await pagina;
    const html = renderToStaticMarkup(albero);
    const serializzato = JSON.stringify(espandi(albero));
    return { esito: 'pagina', html, albero: serializzato, tutto: `${html}\n${serializzato}` };
  } catch (e) {
    const messaggio = e instanceof Error ? e.message : String(e);
    return { esito: 'errore', messaggio, tutto: `${messaggio}\n${JSON.stringify(e)}\n${String((e as Error)?.stack ?? '')}` };
  }
}

/** Nessuna sentinella di `altro` nell'uscita, ovunque. */
function senzaTracceDi(uscita: Uscita, altro: Account) {
  for (const s of sentinelle(altro)) {
    expect(uscita.tutto, `sentinella di ${altro.nome} trovata: ${s}`).not.toContain(s);
  }
}

/** Le letture fatte da questo client sono SOLO del suo titolare: filtro e righe restituite. */
function soloLeRigheDi(finto: Finto, titolare: Account) {
  expect(finto.registro.from.length).toBeGreaterThan(0);
  for (const c of finto.registro.from) {
    expect(c.eq.filter((e) => e.startsWith('user_id='))).toEqual([`user_id=${titolare.uid}`]);
    expect(c.restituite.length).toBeGreaterThan(0);
    for (const r of c.restituite) expect(r.user_id).toBe(titolare.uid);
  }
}

function paginaConcessa(uscita: Uscita, x: Account) {
  expect(uscita.esito).toBe('pagina');
  if (uscita.esito !== 'pagina') return;
  expect(uscita.html).toContain(`Accesso confermato per ${x.email}.`);
  expect(uscita.html).toContain(conteggio(x));
}

beforeEach(() => {
  vi.stubEnv('FITMESH_WEB_DASHBOARD', '1');
  vi.mocked(createClient).mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

// ── Controprove: le sentinelle si vedono davvero, quando ci sono ────────────────────────────────────

describe('sessione, controprova: il rilevatore trova le sentinelle', () => {
  it('le sentinelle dei due account sono distinte fra loro', () => {
    const a = sentinelle(A);
    const b = sentinelle(B);
    for (const s of a) for (const t of b) expect(s.includes(t) || t.includes(s), `${s} / ${t}`).toBe(false);
  });

  it('una pagina concessa ad A contiene la sua email e il suo conteggio, e il rilevatore le vede', async () => {
    const uscita = await richiesta(clientDi(A));
    paginaConcessa(uscita, A);
    expect(() => senzaTracceDi(uscita, A)).toThrow();
  });

  it('l albero serializzato porta gli attributi: il rilevatore guarda anche li', async () => {
    const uscita = await richiesta(clientDi(A, { rpc: 'solleva' }));
    expect(uscita.esito).toBe('pagina');
    if (uscita.esito === 'pagina') expect(uscita.albero).toContain('"href":"/it/app/dashboard"');
  });
});

// ── 1. LOGOUT ───────────────────────────────────────────────────────────────────────────────────────

describe('sessione 1: logout, la pagina senza sessione non porta niente della richiesta prima', () => {
  it('A concesso, poi logout, poi di nuovo A: dopo il logout login, nessuna sentinella, nessun verdetto, nessuna lettura', async () => {
    const primaA = clientDi(A);
    const uno = await richiesta(primaA);
    paginaConcessa(uno, A);
    const chiamatePrimaA = JSON.stringify(primaA.registro);

    const dopoIlLogout = clientDi(null);
    const due = await richiesta(dopoIlLogout);
    expect(due.esito).toBe('errore');
    if (due.esito === 'errore') expect(due.messaggio).toBe('NEXT_REDIRECT /it/auth/login?next=/it/app/dashboard');
    senzaTracceDi(due, A);
    expect(dopoIlLogout.registro.getUser).toBe(1);
    expect(dopoIlLogout.registro.rpc).toEqual([]);
    expect(dopoIlLogout.registro.from).toEqual([]);

    const ancoraA = clientDi(A);
    const tre = await richiesta(ancoraA);
    paginaConcessa(tre, A);
    // il verdetto e le letture sono di QUESTA richiesta, non ripresi dalla prima
    expect(ancoraA.registro.rpc).toEqual(['get_web_dashboard_access']);
    soloLeRigheDi(ancoraA, A);

    // il client della prima richiesta non e' piu' stato toccato: la pagina non lo ha trattenuto
    expect(JSON.stringify(primaA.registro)).toBe(chiamatePrimaA);
    expect(createClient).toHaveBeenCalledTimes(3);
  });

  it.each<[string, Rpc]>([
    ['A negato', { data: negato('subscription_inactive'), error: null }],
    ['A con verifica non disponibile', 'solleva'],
  ])('%s, poi logout: login, nessuna sentinella di A (neanche la sua email)', async (_nome, rpc) => {
    const uno = await richiesta(clientDi(A, { rpc }));
    expect(uno.tutto).toMatch(/data-esito="(negato|non_disponibile)"/);
    const dopo = clientDi(null);
    const due = await richiesta(dopo);
    expect(due.esito).toBe('errore');
    senzaTracceDi(due, A);
    expect(dopo.registro.rpc).toEqual([]);
    expect(dopo.registro.from).toEqual([]);
  });

  it('dopo il logout in inglese: stesso esito, destinazione nella sua lingua, nessuna sentinella', async () => {
    await richiesta(clientDi(A), 'en');
    const dopo = clientDi(null);
    const due = await richiesta(dopo, 'en');
    expect(due.esito === 'errore' && due.messaggio).toBe('NEXT_REDIRECT /en/auth/login?next=/en/app/dashboard');
    senzaTracceDi(due, A);
    expect(dopo.registro.from).toEqual([]);
  });

  it('dieci richieste di A e poi il logout: la memoria non si accumula, l ultima non vede niente', async () => {
    for (let i = 0; i < 10; i++) paginaConcessa(await richiesta(clientDi(A)), A);
    const dopo = clientDi(null);
    const fine = await richiesta(dopo);
    expect(fine.esito).toBe('errore');
    senzaTracceDi(fine, A);
    expect(dopo.registro.rpc).toEqual([]);
  });
});

// ── Nessuno stato a livello di modulo: prova sul sorgente ──────────────────────────────────────────

const RADICE = path.resolve(__dirname, '../../../../..');
const MODULI_DELLA_RICHIESTA = [
  'app/(frontend)/[locale]/app/dashboard/page.tsx',
  'lib/dashboard/verdetto.ts',
  'lib/dashboard/letture-titolare.ts',
  'lib/dashboard/testi.ts',
  'lib/dashboard/interruttore.ts',
];

/** Il codice senza commenti e senza stringhe: i commenti possono nominare cio' che il codice non fa. */
function codice(sorgente: string): string {
  return sorgente
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, "''");
}

/**
 * Cio' che puo' trattenere un dato fra due richieste nello stesso processo: una variabile mutabile a
 * livello di modulo, una collezione creata a livello di modulo, `cache()` di React (memoria per
 * richiesta dentro il runtime RSC, fuori da li' fa cose diverse: qui non si puo' provare a runtime, e
 * quindi non deve esserci), `globalThis`.
 */
function statoDiModulo(sorgente: string): string[] {
  const c = codice(sorgente);
  const trovati: string[] = [];
  for (const m of c.matchAll(/^(?:export\s+)?(?:let|var)\s+\w+/gm)) trovati.push(m[0]);
  for (const m of c.matchAll(/^(?:export\s+)?const\s+\w+\s*(?::[^=]+)?=\s*new\s+(?:Map|WeakMap|Set|WeakSet|WeakRef)\b/gm)) trovati.push(m[0]);
  for (const m of c.matchAll(/import\s*\{[^}]*\bcache\b[^}]*\}\s*from\s*''/g)) trovati.push(m[0]);
  for (const m of c.matchAll(/\b(?:React\.cache|cache)\s*\(/g)) trovati.push(m[0]);
  for (const m of c.matchAll(/\bglobalThis\b|\bglobal\./g)) trovati.push(m[0]);
  return trovati;
}

describe('sessione 1-bis: i moduli della richiesta non hanno stato a livello di modulo', () => {
  it('controprova: il rilevatore riconosce le forme che cerca', () => {
    expect(statoDiModulo('let ultimo: string | null = null;')).toHaveLength(1);
    expect(statoDiModulo('export var x = 1;')).toHaveLength(1);
    expect(statoDiModulo('const memo = new Map<string, number>();')).toHaveLength(1);
    expect(statoDiModulo("import { cache } from 'react';\nconst leggi = cache(async () => 1);")).toHaveLength(2);
    expect(statoDiModulo('globalThis.x = 1;')).toHaveLength(1);
    // dentro una funzione, indentato, non e' stato di modulo
    expect(statoDiModulo('function f() {\n  let i = 0;\n  return i;\n}')).toEqual([]);
    // un commento che nomina cio' che il codice non fa non conta
    expect(statoDiModulo('// let x = 1\n/* const m = new Map() */')).toEqual([]);
  });

  it.each(MODULI_DELLA_RICHIESTA)('%s', (rel) => {
    expect(statoDiModulo(readFileSync(path.join(RADICE, rel), 'utf8'))).toEqual([]);
  });
});

// ── 2. CAMBIO ACCOUNT ───────────────────────────────────────────────────────────────────────────────

describe('sessione 2: cambio account, A poi B', () => {
  it('B concesso: le sue sentinelle e nessuna di A; ogni query di B porta l uid di B e non legge righe di A', async () => {
    const a = clientDi(A);
    paginaConcessa(await richiesta(a), A);
    const b = clientDi(B);
    const uscitaB = await richiesta(b);
    paginaConcessa(uscitaB, B);
    senzaTracceDi(uscitaB, A);
    soloLeRigheDi(b, B);
    expect(b.registro.rpc).toEqual(['get_web_dashboard_access']);
  });

  it('B negato: pagina di diniego con la sessione di B, nessuna sentinella di A, nessuna lettura', async () => {
    paginaConcessa(await richiesta(clientDi(A)), A);
    const b = clientDi(B, { rpc: { data: negato('trial_only'), error: null } });
    const uscitaB = await richiesta(b);
    expect(uscitaB.tutto).toContain('data-esito="negato"');
    expect(uscitaB.tutto).toContain(B.email);
    senzaTracceDi(uscitaB, A);
    expect(b.registro.from).toEqual([]);
  });

  it.each<[string, Rpc]>([
    ['rete assente', 'solleva'],
    ['errore del server', { data: null, error: { code: 'XX000' } }],
    ['funzione non applicata', { data: null, error: { code: 'PGRST202' } }],
  ])('B con verifica non disponibile (%s): «riprova», nessuna sentinella di A, nessuna lettura', async (_nome, rpc) => {
    paginaConcessa(await richiesta(clientDi(A)), A);
    const b = clientDi(B, { rpc });
    const uscitaB = await richiesta(b);
    expect(uscitaB.tutto).toContain('data-esito="non_disponibile"');
    senzaTracceDi(uscitaB, A);
    expect(b.registro.from).toEqual([]);
  });

  it('B concesso, poi di nuovo A: nessuna sentinella di B in A (il cambio vale in entrambe le direzioni)', async () => {
    paginaConcessa(await richiesta(clientDi(B)), B);
    const a = clientDi(A);
    const uscitaA = await richiesta(a);
    paginaConcessa(uscitaA, A);
    senzaTracceDi(uscitaA, B);
    soloLeRigheDi(a, A);
  });
});

describe('sessione 2-bis: A e B in volo insieme, risposte in ordine incrociato', () => {
  /**
   * A risponde lento alla sessione e veloce al verdetto, B il contrario: la sessione di B arriva prima,
   * il verdetto di A arriva prima, la lettura di B finisce prima. Se la pagina tenesse qualcosa di una
   * richiesta in un posto condiviso, qui lo leggerebbe l'altra.
   */
  const lentoVeloce = { getUser: 25, rpc: 1, lettura: 25 };
  const veloceLento = { getUser: 1, rpc: 30, lettura: 1 };

  async function inVolo(fa: Finto, fb: Finto, primo: 'A' | 'B') {
    const ordine = primo === 'A' ? [fa, fb] : [fb, fa];
    for (const f of ordine) vi.mocked(createClient).mockResolvedValueOnce(f.client as never);
    const [u1, u2] = await Promise.all(ordine.map(() => esegui(DashboardWebPage({ params: Promise.resolve({ locale: 'it' }) }))));
    return primo === 'A' ? { a: u1, b: u2 } : { a: u2, b: u1 };
  }

  it.each<['A' | 'B']>([['A'], ['B']])('entrambi concessi, parte prima %s: ciascuno vede solo i propri dati', async (primo) => {
    const fa = clientDi(A, { ritardi: lentoVeloce });
    const fb = clientDi(B, { ritardi: veloceLento });
    const { a, b } = await inVolo(fa, fb, primo);
    paginaConcessa(a, A);
    paginaConcessa(b, B);
    senzaTracceDi(a, B);
    senzaTracceDi(b, A);
    soloLeRigheDi(fa, A);
    soloLeRigheDi(fb, B);
  });

  it.each<[string, Rpc]>([
    ['negato', { data: negato('no_entitlement'), error: null }],
    ['non disponibile', 'solleva'],
  ])('A concesso e B %s, in volo insieme: B non riceve niente di A', async (_nome, rpcB) => {
    const fa = clientDi(A, { ritardi: veloceLento });
    const fb = clientDi(B, { ritardi: lentoVeloce, rpc: rpcB });
    const { a, b } = await inVolo(fa, fb, 'A');
    paginaConcessa(a, A);
    senzaTracceDi(b, A);
    expect(b.tutto).toMatch(/data-esito="(negato|non_disponibile)"/);
    expect(fb.registro.from).toEqual([]);
  });

  it('A concesso e logout in volo insieme: la richiesta senza sessione non riceve niente di A', async () => {
    const fa = clientDi(A, { ritardi: lentoVeloce });
    const fuori = clientDi(null, { ritardi: veloceLento });
    const { a, b } = await inVolo(fa, fuori, 'A');
    paginaConcessa(a, A);
    expect(b.esito).toBe('errore');
    senzaTracceDi(b, A);
    expect(fuori.registro.rpc).toEqual([]);
    expect(fuori.registro.from).toEqual([]);
  });
});
