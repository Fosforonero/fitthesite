/**
 * Il cancello REALE della pagina /[locale]/app/dashboard, con una sessione AUTENTICATA.
 *
 * Il flag da solo non basta e il 307 al login non prova niente sul resto: da fuori, senza sessione, il
 * middleware risponde 307 PRIMA che la pagina decida, quindi la prova HTTP non vede mai il 404 della
 * funzione spenta ne' il verdetto. Qui il client Supabase e' finto (come in page.test.tsx) ma ha SPIE:
 * si conta ogni chiamata a `auth.getUser`, `rpc` e `from`, e si guarda cosa finisce nell'HTML.
 *
 * Cosa si prova, in ordine di gravita':
 *   1. flag spento, anche con sessione valida e verdetto concesso: 404, e NESSUNA chiamata (ne' sessione,
 *      ne' verdetto, ne' lettura);
 *   2. flag acceso senza sessione: login, e nessun verdetto e nessuna lettura;
 *   3. verdetto NEGATO (prova gratuita, titolo scaduto, nessun titolo): nessun dato nell'HTML e nessuna
 *      lettura di fitness_metrics o workouts;
 *   4. verdetto NON DISPONIBILE o errore nella verifica: «riprova», mai paywall, nessun dato, nessuna lettura;
 *   5. verdetto CONCESSO: le letture avvengono SOLO con filtro sul proprietario, colonne della whitelist,
 *      e una riga di un altro utente ferma la lettura invece di arrivare in pagina;
 *   6. il verdetto si chiede AD OGNI richiesta: due richieste con verdetti diversi, prevale il secondo.
 *
 * Per il controllo statico (nessuna API legge le tabelle della dashboard) vedi
 * lib/dashboard/cache-e-confini.test.ts.
 *
 * Queste prove NON proteggono da sole «nessuna cache»: togliere `senzaCache: true` o `export const dynamic`
 * fa cadere solo page.test.tsx. La protezione dalla cache e' data da page.test.tsx piu' la prova statica
 * «nessuna memoria fra richieste» in lib/dashboard/cache-e-confini.test.ts (cache(), unstable_cache,
 * 'use cache', variabili e Map di modulo), perche' un React cache() non si osserva in jsdom.
 */
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

import { COLONNE_METRICHE } from '@/lib/dashboard/letture-titolare';
import { createClient } from '@/lib/supabase/server';

import DashboardWebPage from './page';

const UID = 'dd000000-0000-4000-8000-000000000002';
const ALTRO = 'dd000000-0000-4000-8000-000000000004';
const EMAIL = 'sintetico@example.invalid';
/** Valori che non devono MAI comparire in una pagina negata o non disponibile. */
const PASSI_DEL_TITOLARE = 918273;
const PASSI_DI_ALTRI = 364758;

type Rpc = { data: unknown; error: { code?: string } | null } | 'solleva';
type Riga = Record<string, unknown>;

const concesso = { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null };
const negato = (motivo: string) => ({ contractVersion: 1, granted: false, titles: [], denialReason: motivo });

const DATI: Riga[] = [
  { id: 1, user_id: UID, local_day_key: '2026-09-20', steps: PASSI_DEL_TITOLARE },
  { id: 2, user_id: UID, local_day_key: '2026-09-21', steps: PASSI_DEL_TITOLARE },
  { id: 3, user_id: ALTRO, local_day_key: '2026-09-22', steps: PASSI_DI_ALTRI },
];

type Chiamata = { tabella: string; select: string; eq: string[] };

/**
 * Un finto client Supabase con spie. `rpc` puo' essere una sequenza (una risposta per richiesta).
 * `ignoraFiltro` simula una lettura che la RLS lascia passare anche per righe altrui.
 */
function supabaseFinto(opzioni: {
  /** `false` = nessuna sessione; un oggetto = un utente diverso da quello di default. */
  utente?: boolean | { id: string; email: string };
  rpc: Rpc | Rpc[];
  righe?: Riga[];
  ignoraFiltro?: boolean;
  erroreLettura?: boolean;
}) {
  const registro = { getUser: 0, rpc: 0, from: [] as Chiamata[] };
  const risposte = Array.isArray(opzioni.rpc) ? opzioni.rpc : [opzioni.rpc];
  const client = {
    auth: {
      getUser: async () => {
        registro.getUser++;
        const utente = typeof opzioni.utente === 'object' ? opzioni.utente : { id: UID, email: EMAIL };
        return { data: { user: opzioni.utente === false ? null : utente } };
      },
    },
    rpc: () => ({
      abortSignal: () => {
        const r = risposte[Math.min(registro.rpc, risposte.length - 1)];
        registro.rpc++;
        return r === 'solleva' ? Promise.reject(new TypeError('fetch failed')) : Promise.resolve(r);
      },
    }),
    from: (tabella: string) => {
      const chiamata: Chiamata = { tabella, select: '', eq: [] };
      registro.from.push(chiamata);
      let righe = [...(opzioni.righe ?? DATI)];
      const f = {
        select: (colonne: string) => {
          chiamata.select = colonne;
          return f;
        },
        eq: (c: string, v: string) => {
          chiamata.eq.push(`${c}=${v}`);
          if (!(opzioni.ignoraFiltro && c === 'user_id')) righe = righe.filter((r) => r[c] === v);
          return f;
        },
        gte: () => f,
        lte: () => f,
        lt: () => f,
        order: () => f,
        range: () =>
          Promise.resolve(opzioni.erroreLettura ? { data: null, error: { code: 'XX000' } } : { data: righe, error: null }),
      };
      return f;
    },
  };
  return { client, registro };
}

type Finto = ReturnType<typeof supabaseFinto>;

async function rendi(locale: string, finto: Finto) {
  vi.mocked(createClient).mockResolvedValue(finto.client as never);
  return renderToStaticMarkup(await DashboardWebPage({ params: Promise.resolve({ locale }) }));
}

/**
 * La pagina non ha toccato niente: ne' sessione, ne' verdetto, ne' tabelle.
 *
 * Nel cancello 1 questa funzione e' vera PER COSTRUZIONE: le spie contano solo se la pagina ottiene il
 * client, e con il flag spento createClient non viene mai chiamato. La prova che conta, li', e'
 * `expect(createClient).not.toHaveBeenCalled()`; questa resta come seconda rete se un giorno la pagina
 * creasse il client prima di guardare il flag.
 */
function nessunaChiamata(finto: Finto) {
  expect(finto.registro.getUser).toBe(0);
  expect(finto.registro.rpc).toBe(0);
  expect(finto.registro.from).toEqual([]);
}

/** La pagina ha chiesto il verdetto ma non ha letto nessuna tabella (nessuna, non solo fitness_metrics e workouts). */
function nessunaLettura(finto: Finto) {
  expect(finto.registro.from).toEqual([]);
}

beforeEach(() => {
  vi.stubEnv('FITMESH_WEB_DASHBOARD', '1');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(createClient).mockReset();
});

describe('cancello reale 1: flag spento, sessione autenticata e verdetto concesso, 404 e nessuna chiamata', () => {
  it.each<[string, string | undefined]>([
    ['variabile assente', undefined],
    ['stringa vuota', ''],
    ['0', '0'],
    ['true', 'true'],
    ['1 con lo spazio', '1 '],
  ])('flag spento (%s)', async (_nome, valore) => {
    vi.stubEnv('FITMESH_WEB_DASHBOARD', valore as string);
    for (const locale of ['it', 'en']) {
      const finto = supabaseFinto({ rpc: { data: concesso, error: null } });
      vi.mocked(createClient).mockResolvedValue(finto.client as never);
      await expect(DashboardWebPage({ params: Promise.resolve({ locale }) })).rejects.toThrow('NEXT_NOT_FOUND');
      nessunaChiamata(finto);
    }
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe('cancello reale 2: flag acceso senza sessione, login e nessuna lettura', () => {
  it('nessun utente: redirect al login con il ritorno alla dashboard, senza verdetto e senza dati', async () => {
    const finto = supabaseFinto({ utente: false, rpc: { data: concesso, error: null } });
    await expect(rendi('it', finto)).rejects.toThrow('NEXT_REDIRECT /it/auth/login?next=/it/app/dashboard');
    expect(finto.registro.getUser).toBe(1);
    expect(finto.registro.rpc).toBe(0);
    expect(finto.registro.from).toEqual([]);
  });

  it('nessun utente in inglese: stesso esito, stessa assenza di letture', async () => {
    const finto = supabaseFinto({ utente: false, rpc: { data: concesso, error: null } });
    await expect(rendi('en', finto)).rejects.toThrow('NEXT_REDIRECT /en/auth/login?next=/en/app/dashboard');
    expect(finto.registro.rpc).toBe(0);
    expect(finto.registro.from).toEqual([]);
  });

  it('42501 dal verdetto (la sessione non vale piu per il database): login, nessuna lettura', async () => {
    const finto = supabaseFinto({ rpc: { data: null, error: { code: '42501' } } });
    await expect(rendi('it', finto)).rejects.toThrow('NEXT_REDIRECT /it/auth/login');
    nessunaLettura(finto);
  });
});

describe('cancello reale 3: verdetto NEGATO, nessun dato e nessuna lettura', () => {
  it.each<[string, string]>([
    ['prova gratuita', 'trial_only'],
    ['titolo scaduto', 'subscription_inactive'],
    ['acquisto rimborsato', 'purchase_revoked'],
    ['pagamento in attesa', 'purchase_pending'],
    ['nessun titolo', 'no_entitlement'],
    ['motivo sconosciuto', 'qualcosa_di_nuovo'],
  ])('%s', async (_nome, motivo) => {
    const finto = supabaseFinto({ rpc: { data: negato(motivo), error: null } });
    const html = await rendi('it', finto);
    expect(html).toContain('data-esito="negato"');
    expect(html).not.toContain('data-esito="non_disponibile"');
    nessunaLettura(finto);
    // nel payload reso non c'e traccia dei dati: ne i passi del titolare ne quelli di altri, ne il conteggio dei giorni
    expect(html).not.toContain(String(PASSI_DEL_TITOLARE));
    expect(html).not.toContain(String(PASSI_DI_ALTRI));
    expect(html).not.toContain('Giorni con dati');
    expect(html).not.toContain('Accesso confermato');
    expect(finto.registro.rpc).toBe(1);
  });

  it('in inglese: stesso esito, stessa assenza di letture', async () => {
    const finto = supabaseFinto({ rpc: { data: negato('trial_only'), error: null } });
    const html = await rendi('en', finto);
    expect(html).toContain('data-esito="negato"');
    expect(html).not.toContain('Days with data');
    nessunaLettura(finto);
  });
});

describe('cancello reale 4: verdetto non disponibile o errore nella verifica, «riprova» e mai un paywall', () => {
  it.each<[string, Rpc]>([
    ['rete assente', 'solleva'],
    ['funzione non applicata (PGRST202)', { data: null, error: { code: 'PGRST202' } }],
    ['funzione non applicata (42883)', { data: null, error: { code: '42883' } }],
    ['errore del server', { data: null, error: { code: 'XX000' } }],
    ['risposta illeggibile', { data: { granted: 'forse' }, error: null }],
    ['risposta nulla', { data: null, error: null }],
    ['concesso senza titoli (si contraddice)', { data: { contractVersion: 1, granted: true, titles: [], denialReason: null }, error: null }],
    ['versione di contratto sconosciuta', { data: { contractVersion: 2, granted: true, titles: ['founder'], denialReason: null }, error: null }],
  ])('%s', async (_nome, rpc) => {
    const finto = supabaseFinto({ rpc });
    for (const [locale, testo, riprova] of [
      ['it', 'Non riusciamo a verificare il tuo accesso in questo momento.', 'Riprova'],
      ['en', 'We can’t check your access right now.', 'Try again'],
    ]) {
      const html = await rendi(locale, finto);
      expect(html).toContain('data-esito="non_disponibile"');
      expect(html).toContain(testo);
      expect(html).toContain(riprova);
      expect(html).toContain(`href="/${locale}/app/dashboard"`);
      // mai un paywall: un cliente pagante non vede «serve un abbonamento» perche' la rete e' caduta
      expect(html).not.toContain('data-esito="negato"');
      expect(html).not.toMatch(/richiede un abbonamento|requires an active subscription/);
      expect(html).not.toContain(String(PASSI_DEL_TITOLARE));
    }
    nessunaLettura(finto);
  });

  it('accesso concesso ma lettura dei dati non riuscita: «riprova», non un diniego, nessun dato parziale', async () => {
    const finto = supabaseFinto({ rpc: { data: concesso, error: null }, erroreLettura: true });
    const html = await rendi('it', finto);
    expect(html).toContain('data-esito="non_disponibile"');
    expect(html).not.toContain('data-esito="negato"');
    expect(html).not.toContain('Giorni con dati');
    expect(html).not.toMatch(/richiede un abbonamento/);
    expect(finto.registro.from.length).toBeGreaterThan(0);
  });
});

describe('cancello reale 5: verdetto CONCESSO, letture solo del titolare e solo colonne della whitelist', () => {
  it('ogni query ha il filtro sul proprietario con l uid della sessione, e le colonne sono quelle della whitelist', async () => {
    const finto = supabaseFinto({ rpc: { data: concesso, error: null } });
    const html = await rendi('it', finto);
    expect(html).toContain('Giorni con dati negli ultimi 30 giorni: 2.');
    expect(finto.registro.from.length).toBeGreaterThan(0);
    for (const chiamata of finto.registro.from) {
      expect(chiamata.tabella).toBe('fitness_metrics');
      // il filtro sul proprietario c'e, e ce n'e uno solo, con l'uid della SESSIONE
      const proprietario = chiamata.eq.filter((e) => e.startsWith('user_id='));
      expect(proprietario).toEqual([`user_id=${UID}`]);
      const colonne = chiamata.select.split(',');
      expect(colonne).toEqual([...COLONNE_METRICHE]);
      expect(colonne).not.toContain('*');
    }
  });

  it('mai righe di altri utenti nel risultato: il conteggio parte solo dalle righe del titolare', async () => {
    const finto = supabaseFinto({ rpc: { data: concesso, error: null } });
    const html = await rendi('it', finto);
    expect(html).toContain('Giorni con dati negli ultimi 30 giorni: 2.');
    expect(html).not.toContain(String(PASSI_DI_ALTRI));
  });

  it('se il database restituisce una riga di un altro proprietario (filtro ignorato) la lettura si ferma: «riprova», nessun conteggio', async () => {
    const finto = supabaseFinto({ rpc: { data: concesso, error: null }, ignoraFiltro: true });
    const html = await rendi('it', finto);
    expect(html).toContain('data-esito="non_disponibile"');
    expect(html).not.toContain('Giorni con dati');
    expect(html).not.toContain(String(PASSI_DI_ALTRI));
  });

  it('la pagina non legge serie, allenamenti ne tabelle diverse da fitness_metrics: un riepilogo dei giorni non ha bisogno di JSONB', async () => {
    const finto = supabaseFinto({ rpc: { data: concesso, error: null } });
    await rendi('it', finto);
    expect(finto.registro.from.every((c) => c.tabella === 'fitness_metrics')).toBe(true);
    for (const c of finto.registro.from) expect(c.select).not.toMatch(/intraday|sleep_stages|exercise_sessions/);
  });
});

describe('cancello reale 6: il verdetto si chiede ad ogni richiesta, nessuna cache', () => {
  it('concesso poi negato con la stessa sessione: il secondo prevale, e la seconda richiesta non legge niente', async () => {
    const finto = supabaseFinto({ rpc: [{ data: concesso, error: null }, { data: negato('subscription_inactive'), error: null }] });
    const prima = await rendi('it', finto);
    expect(prima).toContain('Giorni con dati negli ultimi 30 giorni: 2.');
    const lettureDopoLaPrima = finto.registro.from.length;
    expect(lettureDopoLaPrima).toBeGreaterThan(0);

    const seconda = await rendi('it', finto);
    expect(finto.registro.rpc).toBe(2);
    expect(seconda).toContain('data-esito="negato"');
    expect(seconda).not.toContain('Giorni con dati');
    expect(finto.registro.from.length).toBe(lettureDopoLaPrima);
  });

  it('negato poi concesso (rinnovo appena fatto): il secondo prevale, i dati compaiono', async () => {
    const finto = supabaseFinto({ rpc: [{ data: negato('subscription_inactive'), error: null }, { data: concesso, error: null }] });
    expect(await rendi('it', finto)).toContain('data-esito="negato"');
    expect(finto.registro.from).toEqual([]);
    const seconda = await rendi('it', finto);
    expect(finto.registro.rpc).toBe(2);
    expect(seconda).toContain('Giorni con dati negli ultimi 30 giorni: 2.');
  });

  it('concesso poi guasto nella verifica: il secondo e «riprova», non il dato della richiesta prima', async () => {
    const finto = supabaseFinto({ rpc: [{ data: concesso, error: null }, 'solleva'] });
    await rendi('it', finto);
    const letture = finto.registro.from.length;
    const seconda = await rendi('it', finto);
    expect(seconda).toContain('data-esito="non_disponibile"');
    expect(seconda).not.toContain('Giorni con dati');
    expect(finto.registro.from.length).toBe(letture);
  });

  it('un titolo concesso a un utente non si porta dietro a un altro client: ogni richiesta interroga il PROPRIO client', async () => {
    const a = supabaseFinto({ rpc: { data: concesso, error: null } });
    const b = supabaseFinto({ rpc: { data: negato('no_entitlement'), error: null } });
    await rendi('it', a);
    const html = await rendi('it', b);
    expect(a.registro.rpc).toBe(1);
    expect(b.registro.rpc).toBe(1);
    expect(html).toContain('data-esito="negato"');
    expect(b.registro.from).toEqual([]);
  });

  it('due utenti VERI (UID ed email diversi), A concesso e B negato: la pagina di B non porta niente di A', async () => {
    const B = { id: 'dd000000-0000-4000-8000-000000000005', email: 'sintetico-b@example.invalid' };
    const a = supabaseFinto({ rpc: { data: concesso, error: null } });
    const b = supabaseFinto({ utente: B, rpc: { data: negato('no_entitlement'), error: null } });
    const htmlA = await rendi('it', a);
    // controprova: la pagina di A porta davvero la sua email e il suo conteggio
    expect(htmlA).toContain(EMAIL);
    expect(htmlA).toContain('Giorni con dati negli ultimi 30 giorni: 2.');
    const htmlB = await rendi('it', b);
    expect(htmlB).toContain('data-esito="negato"');
    expect(htmlB).toContain(B.email);
    expect(htmlB).not.toContain(EMAIL);
    expect(htmlB).not.toContain('Giorni con dati');
    expect(b.registro.from).toEqual([]);
  });

  it('due utenti VERI, entrambi concessi: B vede il SUO conteggio, mai quello di A ne la sua email', async () => {
    const B = { id: 'dd000000-0000-4000-8000-000000000005', email: 'sintetico-b@example.invalid' };
    const righeB: Riga[] = [...DATI, { id: 9, user_id: B.id, local_day_key: '2026-09-23', steps: 1111 }];
    const a = supabaseFinto({ rpc: { data: concesso, error: null } });
    const b = supabaseFinto({ utente: B, rpc: { data: concesso, error: null }, righe: righeB });
    expect(await rendi('it', a)).toContain('Giorni con dati negli ultimi 30 giorni: 2.');
    const htmlB = await rendi('it', b);
    expect(htmlB).toContain(B.email);
    expect(htmlB).not.toContain(EMAIL);
    expect(htmlB).toContain('Giorni con dati negli ultimi 30 giorni: 1.');
    expect(htmlB).not.toContain('Giorni con dati negli ultimi 30 giorni: 2.');
    // e B ha filtrato sul SUO uid
    expect(b.registro.from.every((c) => c.eq.includes(`user_id=${B.id}`))).toBe(true);
  });
});
