/**
 * Un doppio fedele di PostgREST, SOLO per le prove (mai importato dal codice di produzione:
 * lo vieta lib/dashboard/cache-e-confini.test.ts).
 *
 * Serve come `global.fetch` di un VERO `createClient` di @supabase/supabase-js: cosi' le prove della
 * completezza passano dal vero postgrest-js (URL con offset/limit, header Prefer, parsing di
 * Content-Range, NaN quando il totale e' `*`), non da un finto del query builder che restituirebbe
 * quello che il test vuole.
 *
 * Che cosa riproduce (PROVATO sul banco PostgREST v14.15 con lo spike del 15/10/2026, valori dorati nel
 * test del doppio): filtri eq/gte/lte/lt/gt, order multiplo, offset/limit, cappatura a `max_rows`,
 * conteggio SOLO se Prefer contiene count=exact, Content-Range `a-b/totale`, `a-b/*` senza conteggio e
 * `* /*` a pagina vuota, 206 se il conteggio e' richiesto e le righe restituite sono meno del totale.
 *
 * Che cosa DEDUCE senza averlo provato qui (DEDOTTO, da confermare con sonde-curl.sh sul banco):
 * offset oltre il totale con conteggio = 416 PGRST103; tabella vuota con conteggio = `* /0`.
 * La lettura che si vuole provare non chiede mai un offset >= totale dichiarato, quindi un 416 non e'
 * il caso su cui poggia la correttezza.
 *
 * Non riproduce: transazioni, snapshot, RLS (le righe si leggono per filtro, non per policy), tipi SQL.
 * L'iniezione `ignoraFiltroProprietario` simula una lettura che lascia passare righe altrui.
 */
import { createClient } from '@supabase/supabase-js';

export type RigaTabella = Record<string, unknown>;
export type NomeTabella = 'fitness_metrics' | 'workouts';

export type RichiestaRegistrata = {
  indice: number;
  metodo: string;
  url: string;
  tabella: string | null;
  rpc: string | null;
  /** Tutti i parametri di query, nell'ordine, anche ripetuti (gte e lte sullo stesso campo). */
  params: [string, string][];
  /** Header Prefer cosi' come e' stato inviato, o null. */
  prefer: string | null;
  offset: number | null;
  limit: number | null;
  select: string | null;
  order: string | null;
};

export type Verdetto = {
  /** Corpo JSON della rpc. Predefinito: concesso con titolo `founder`. */
  data?: unknown;
  /** Se presente la rpc risponde con questo errore HTTP. */
  errore?: { status: number; code: string };
};

export type OpzioniDoppio = {
  tabelle: Partial<Record<NomeTabella, RigaTabella[]>>;
  /** PGRST_DB_MAX_ROWS. Predefinito 1000. `Infinity` = nessun tetto. */
  maxRows?: number;
  /** Simula una lettura che ignora il filtro `user_id=eq.`: arrivano anche righe altrui. */
  ignoraFiltroProprietario?: boolean;
  /**
   * Il denominatore del Content-Range (dopo la barra) quando il conteggio e' richiesto:
   *   'reale'      il totale (comportamento di PostgREST)
   *   'asterisco'  `*` (il server non ha contato: postgrest-js restituisce NaN)
   *   'assente'    nessun header Content-Range (postgrest-js restituisce null)
   *   'malformato' un testo non numerico (NaN)
   *   funzione     (indice della richiesta alla tabella, totale reale) -> testo del denominatore
   */
  conteggio?: 'reale' | 'asterisco' | 'assente' | 'malformato' | ((indice: number, totale: number) => string);
  verdetto?: Verdetto;
  iniezioni?: {
    /** La richiesta con questo offset risponde con un errore del server (corpo con diagnostica). */
    erroreAOffset?: { offset: number; status?: number; code?: string };
    /** La risposta alla richiesta con questo offset porta in piu' questa riga. */
    rigaAltruiAOffset?: { offset: number; riga: RigaTabella };
    /** La richiesta con questo offset risponde con una pagina vuota (200, conteggio dichiarato intatto). */
    vuotoAOffset?: number;
    /** Chiamata PRIMA di servire la richiesta `indice` (alla tabella): muta le righe fra due richieste. */
    primaDiRichiesta?: (indice: number, tabelle: Partial<Record<NomeTabella, RigaTabella[]>>) => void;
  };
};

export type DoppioPostgrest = {
  fetch: typeof fetch;
  richieste: RichiestaRegistrata[];
  /** Le righe vive: una prova puo' mutarle fra due richieste. */
  tabelle: Partial<Record<NomeTabella, RigaTabella[]>>;
  impostaMaxRows(n: number): void;
  richiesteSu(tabella: NomeTabella): RichiestaRegistrata[];
};

const RISERVATI: readonly string[] = ['select', 'order', 'offset', 'limit'];

function confronta(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : 1;
  return String(a) < String(b) ? -1 : 1;
}

function valoreConfronto(riga: unknown, testo: string): [unknown, unknown] {
  return typeof riga === 'number' ? [riga, Number(testo)] : [riga, testo];
}

function rispondi(corpo: unknown, status: number, header: Record<string, string> = {}): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...header },
  });
}

export function creaDoppioPostgrest(opzioni: OpzioniDoppio): DoppioPostgrest {
  const tabelle: Partial<Record<NomeTabella, RigaTabella[]>> = {};
  for (const [nome, righe] of Object.entries(opzioni.tabelle)) {
    tabelle[nome as NomeTabella] = [...(righe ?? [])];
  }
  const richieste: RichiestaRegistrata[] = [];
  const conteggioPerTabella: Record<string, number> = {};
  const stato = { maxRows: opzioni.maxRows ?? 1000 };
  const inie = opzioni.iniezioni ?? {};

  const doppioFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const richiesta = typeof Request !== 'undefined' && input instanceof Request ? input : null;
    const url = new URL(richiesta ? richiesta.url : String(input));
    const metodo = (init?.method ?? richiesta?.method ?? 'GET').toUpperCase();
    const intestazioni = new Headers(init?.headers ?? richiesta?.headers);
    const percorso = url.pathname.replace(/^\/rest\/v1\//, '');
    const eRpc = percorso.startsWith('rpc/');
    const nome = eRpc ? percorso.slice(4) : percorso;
    const params = [...url.searchParams.entries()];
    const prefer = intestazioni.get('prefer');
    const get = (k: string) => params.find(([n]) => n === k)?.[1] ?? null;
    const offsetTesto = get('offset');
    const limitTesto = get('limit');
    const registrata: RichiestaRegistrata = {
      indice: richieste.length,
      metodo,
      url: url.toString(),
      tabella: eRpc ? null : nome,
      rpc: eRpc ? nome : null,
      params,
      prefer,
      offset: offsetTesto === null ? null : Number(offsetTesto),
      limit: limitTesto === null ? null : Number(limitTesto),
      select: get('select'),
      order: get('order'),
    };
    richieste.push(registrata);

    if (eRpc) {
      if (nome !== 'get_web_dashboard_access') return rispondi({ code: 'PGRST202', message: 'rpc sconosciuta' }, 404);
      const v = opzioni.verdetto ?? {};
      if (v.errore) return rispondi({ code: v.errore.code, message: 'diagnostica sintetica privata' }, v.errore.status);
      return rispondi(
        v.data ?? { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null },
        200,
      );
    }

    if (nome !== 'fitness_metrics' && nome !== 'workouts') {
      return rispondi({ code: '42P01', message: 'tabella sconosciuta' }, 404);
    }
    const indiceTabella = (conteggioPerTabella[nome] = (conteggioPerTabella[nome] ?? -1) + 1);
    inie.primaDiRichiesta?.(indiceTabella, tabelle);

    const contaRichiesto = /count=(exact|planned|estimated)/.test(prefer ?? '');
    const offset = registrata.offset ?? 0;

    if (inie.erroreAOffset && inie.erroreAOffset.offset === offset) {
      const { status = 500, code = 'XX000' } = inie.erroreAOffset;
      return rispondi(
        { code, message: 'diagnostica sintetica privata del server', details: 'valori interni', hint: null },
        status,
      );
    }

    // Filtri.
    let righe = [...(tabelle[nome] ?? [])];
    for (const [campo, valore] of params) {
      if (RISERVATI.includes(campo)) continue;
      const punto = valore.indexOf('.');
      const op = valore.slice(0, punto);
      const operando = valore.slice(punto + 1);
      if (!['eq', 'gte', 'lte', 'lt', 'gt'].includes(op)) {
        return rispondi({ code: 'PGRST100', message: `operatore non supportato dal doppio: ${op}` }, 400);
      }
      if (opzioni.ignoraFiltroProprietario && campo === 'user_id') continue;
      righe = righe.filter((r) => {
        const [x, y] = valoreConfronto(r[campo], operando);
        const c = confronta(x, y);
        return op === 'eq' ? c === 0 : op === 'gte' ? c >= 0 : op === 'lte' ? c <= 0 : op === 'lt' ? c < 0 : c > 0;
      });
    }
    // Ordinamento.
    const ordini = (registrata.order ?? '')
      .split(',')
      .filter(Boolean)
      .map((o) => {
        const [campo, verso] = o.split('.');
        return { campo, discendente: verso === 'desc' };
      });
    righe.sort((x, y) => {
      for (const { campo, discendente } of ordini) {
        const c = confronta(x[campo], y[campo]);
        if (c !== 0) return discendente ? -c : c;
      }
      return 0;
    });

    const totale = righe.length;
    const tetto = Math.min(registrata.limit ?? Infinity, stato.maxRows);

    if (contaRichiesto && totale > 0 && offset >= totale) {
      return rispondi(
        {
          code: 'PGRST103',
          message: 'Requested range not satisfiable',
          details: `Il doppio deduce 416: offset ${offset} >= ${totale} righe`,
          hint: null,
        },
        416,
        { 'content-range': `*/${totale}` },
      );
    }

    let pagina = righe.slice(offset, Number.isFinite(tetto) ? offset + tetto : undefined);
    if (inie.vuotoAOffset === offset) pagina = [];

    const colonne = (registrata.select ?? '*').split(',').map((c) => c.trim());
    const proietta = (r: RigaTabella): RigaTabella =>
      colonne.includes('*') ? { ...r } : Object.fromEntries(colonne.map((c) => [c, c in r ? r[c] : null]));
    const corpo = pagina.map(proietta);
    if (inie.rigaAltruiAOffset && inie.rigaAltruiAOffset.offset === offset) {
      corpo.push(proietta(inie.rigaAltruiAOffset.riga));
    }

    // Content-Range.
    const header: Record<string, string> = {};
    let denominatore = '*';
    if (contaRichiesto) {
      const c = opzioni.conteggio ?? 'reale';
      denominatore =
        c === 'reale'
          ? String(totale)
          : c === 'asterisco'
            ? '*'
            : c === 'malformato'
              ? 'non-un-numero'
              : c === 'assente'
                ? ''
                : c(indiceTabella, totale);
    }
    const intervallo = pagina.length > 0 ? `${offset}-${offset + pagina.length - 1}` : '*';
    const senzaHeader = contaRichiesto && opzioni.conteggio === 'assente';
    if (!senzaHeader) header['content-range'] = `${intervallo}/${denominatore}`;
    const parziale = contaRichiesto && pagina.length < totale;
    return rispondi(corpo, parziale ? 206 : 200, header);
  };

  return {
    fetch: doppioFetch as typeof fetch,
    richieste,
    tabelle,
    impostaMaxRows(n: number) {
      stato.maxRows = n;
    },
    richiesteSu(tabella: NomeTabella) {
      return richieste.filter((r) => r.tabella === tabella);
    },
  };
}

const ISTANZE = { n: 0 };

/** Un VERO client supabase-js, con il doppio come unico trasporto. Nessuna rete. */
export function clienteSuDoppio(doppio: DoppioPostgrest) {
  // chiave di storage distinta: istanze della stessa chiave fanno rumore nei log delle prove
  ISTANZE.n += 1;
  return createClient('http://banco-sintetico.invalid', 'chiave-anon-sintetica', {
    auth: {
      persistSession: false, autoRefreshToken: false, detectSessionInUrl: false,
      storageKey: `sb-doppio-${ISTANZE.n}`,
    },
    global: { fetch: doppio.fetch },
  });
}

/**
 * Il client che la pagina si aspetta da `createClient` di lib/supabase/server: `auth.getUser`,
 * `rpc` e `from` sono quelli veri di supabase-js sopra il doppio; la sessione e' decisa dalla prova.
 */
export function clienteDiSessione(
  doppio: DoppioPostgrest,
  utente: { id: string; email?: string } | null,
) {
  const vero = clienteSuDoppio(doppio);
  return {
    auth: { getUser: async () => ({ data: { user: utente } }) },
    rpc: vero.rpc.bind(vero),
    from: vero.from.bind(vero),
  };
}
