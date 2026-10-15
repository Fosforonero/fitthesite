/**
 * La completezza della lettura, provata sulla CATENA REALE: reader di produzione -> vero client
 * supabase-js -> vero postgrest-js -> doppio fedele di PostgREST (con max_rows configurabile).
 *
 * Il difetto: con PGRST_DB_MAX_ROWS < RIGHE_PER_PAGINA PostgREST tronca in silenzio (200,
 * Content-Range `0-19/*`); il reader vedeva 20 < 500 e dichiarava `completo: true`. Qui il contratto e':
 * `completo: true` SOLO se il conteggio dichiarato dal server e' valido, coerente fra le pagine e uguale
 * alle righe lette; tutto il resto e' `completo: false` con un motivo, mai un ripiego sul vecchio
 * comportamento.
 *
 * Il conteggio non prova uno snapshot transazionale: vedi la nota sulla concorrenza nel commento di
 * testa di letture-titolare.ts.
 */
import { describe, expect, it } from 'vitest';

import {
  COLONNE_ALLENAMENTI,
  COLONNE_METRICHE,
  COLONNE_SERIE_DEL_GIORNO,
  MASSIMO_PAGINE,
  RIGHE_PER_PAGINA,
  leggiAllenamentiDelTitolare,
  leggiMetricheDelTitolare,
  leggiSerieDelGiorno,
  type ClientLetture,
  type FiltroLetture,
} from './letture-titolare';
import {
  clienteSuDoppio,
  creaDoppioPostgrest,
  type NomeTabella,
  type OpzioniDoppio,
  type RigaTabella,
} from './postgrest-fedele.fixture';
import { leggiVerdettoDashboard, type AccessoConcesso, type ClientVerdetto } from './verdetto';

const IO = 'dd000000-0000-4000-8000-000000000002';
const ALTRO = 'dd000000-0000-4000-8000-000000000004';
const GIORNO = '2026-09-23';
const INTERVALLO = { daGiorno: '2026-09-01', aGiorno: '2026-09-30' };
const SENTINELLA_GLICEMIA = 978613.5;
const SENTINELLA_NOME = 'iPhone di Mario Rossi';

async function accesso(): Promise<AccessoConcesso> {
  const rpc: ClientVerdetto = {
    rpc: () => ({
      abortSignal: () =>
        Promise.resolve({ data: { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null }, error: null }),
    }),
  };
  const v = await leggiVerdettoDashboard(rpc, IO);
  if (v.esito !== 'concesso') throw new Error('fixture rotta: verdetto non concesso');
  return v;
}

const giornoN = (i: number) => `2026-09-${String((i % 28) + 1).padStart(2, '0')}`;

function metrica(uid: string, i: number, giorno = giornoN(i)): RigaTabella {
  return {
    id: i, user_id: uid, local_day_key: giorno, window_start_ms: 1, window_end_ms: 2, source: 'health_connect',
    steps: 1000 + i, distance_meters: 1, active_calories_kcal: 1, calories_kcal: 1, sleep_minutes: 1,
    heart_rate_bpm: 60, resting_heart_rate_bpm: 50, hrv_rmssd: 40, received_at: 't',
    // sentinelle negative: non devono comparire in whitelist, risposta o log
    blood_glucose_mgdl: SENTINELLA_GLICEMIA, source_device: SENTINELLA_NOME, hr_source_name: SENTINELLA_NOME,
  };
}
function serie(uid: string, i: number): RigaTabella {
  return {
    id: i, user_id: uid, local_day_key: GIORNO, source: `s${i}`, steps: 10 + i, intraday_steps: [], intraday_hr: [],
    sleep_stages: [], blood_glucose_mgdl: SENTINELLA_GLICEMIA, source_device: SENTINELLA_NOME,
  };
}
function allenamento(uid: string, i: number): RigaTabella {
  return {
    id: i, user_id: uid, start_ms: 1000 + i, end_ms: 2000 + i, type: 'run', duration_min: 1, distance_meters: 1,
    calories_kcal: 1, hr_avg: 100, title: SENTINELLA_NOME, notes: SENTINELLA_NOME,
  };
}

type Lettore = {
  nome: string;
  tabella: NomeTabella;
  colonne: readonly string[];
  ordine: string;
  riga: (uid: string, i: number) => RigaTabella;
  leggi: (c: ClientLetture, a: AccessoConcesso, massimoPagine?: number) => ReturnType<typeof leggiMetricheDelTitolare>;
};

const LETTORI: Lettore[] = [
  {
    nome: 'leggiMetricheDelTitolare', tabella: 'fitness_metrics', colonne: COLONNE_METRICHE,
    ordine: 'local_day_key.asc,id.asc', riga: metrica,
    leggi: (c, a, m) => leggiMetricheDelTitolare(c, a, INTERVALLO, m),
  },
  {
    nome: 'leggiSerieDelGiorno', tabella: 'fitness_metrics', colonne: COLONNE_SERIE_DEL_GIORNO,
    ordine: 'id.asc', riga: serie,
    leggi: (c, a, m) => leggiSerieDelGiorno(c, a, GIORNO, m) as never,
  },
  {
    nome: 'leggiAllenamentiDelTitolare', tabella: 'workouts', colonne: COLONNE_ALLENAMENTI,
    ordine: 'start_ms.asc,id.asc', riga: allenamento,
    leggi: (c, a, m) => leggiAllenamentiDelTitolare(c, a, { daMs: 0, aMs: 1_000_000 }, m) as never,
  },
];

const metriche = LETTORI[0];

function scenario(l: Lettore, righe: number, opzioni: Partial<OpzioniDoppio> = {}) {
  const proprie = Array.from({ length: righe }, (_, i) => l.riga(IO, i + 1));
  const doppio = creaDoppioPostgrest({ tabelle: { [l.tabella]: proprie }, ...opzioni });
  return { doppio, client: clienteSuDoppio(doppio) as unknown as ClientLetture };
}
const offsets = (d: ReturnType<typeof creaDoppioPostgrest>, t: NomeTabella) =>
  d.richiesteSu(t).map((r) => r.offset);

describe.each(LETTORI)('$nome: max_rows e conteggio sulla catena reale', (l) => {
  it('R1 max_rows 20 e 56 righe: pagine a offset 0,20,40, 56 righe, completo', async () => {
    const { doppio, client } = scenario(l, 56, { maxRows: 20 });
    const lettura = await l.leggi(client, await accesso());
    expect(offsets(doppio, l.tabella)).toEqual([0, 20, 40]);
    expect(lettura.righe).toHaveLength(56);
    expect(lettura.completo).toBe(true);
  });

  it('R6 conteggio non verificabile dal server (Content-Range con * oppure assente): mai completo', async () => {
    for (const [modo, motivo] of [['asterisco', 'conteggio_non_valido'], ['assente', 'conteggio_assente']] as const) {
      const { client } = scenario(l, 56, { maxRows: 1000, conteggio: modo });
      const lettura = (await l.leggi(client, await accesso())) as { completo: boolean; motivo?: string };
      expect(lettura.completo, modo).toBe(false);
      expect(lettura.motivo, modo).toBe(motivo);
    }
  });

  it('R11 errore 500 a offset 20 con max_rows 20: errore_server col solo codice, nessuna riga', async () => {
    const { doppio, client } = scenario(l, 56, {
      maxRows: 20, iniezioni: { erroreAOffset: { offset: 20, status: 500, code: 'XX000' } },
    });
    const errore = await l.leggi(client, await accesso()).catch((e) => e);
    expect(errore).toMatchObject({ codice: 'errore_server' });
    expect(String(errore.message)).toBe('lettura non riuscita (XX000)');
    expect(String(errore.message)).not.toContain('diagnostica');
    expect(offsets(doppio, l.tabella)).toEqual([0, 20]);
  });

  it('R12 riga altrui a offset 20 con filtro ignorato: riga_altrui, le pagine precedenti non si usano', async () => {
    const { doppio, client } = scenario(l, 40, {
      maxRows: 20, iniezioni: { rigaAltruiAOffset: { offset: 20, riga: l.riga(ALTRO, 9999) } },
    });
    const errore = await l.leggi(client, await accesso()).catch((e) => e);
    expect(errore).toMatchObject({ codice: 'riga_altrui' });
    expect(offsets(doppio, l.tabella)).toEqual([0, 20]);
  });

  it('R13 ogni richiesta: filtro proprietario, select = whitelist senza *, ordine, count=exact, offset = righe lette', async () => {
    const { doppio, client } = scenario(l, 56, { maxRows: 20 });
    await l.leggi(client, await accesso());
    const richieste = doppio.richiesteSu(l.tabella);
    expect(richieste).toHaveLength(3);
    richieste.forEach((r, p) => {
      expect(r.params).toContainEqual(['user_id', `eq.${IO}`]);
      expect(r.select).toBe(l.colonne.join(','));
      expect(r.select).not.toContain('*');
      expect(r.order).toBe(l.ordine);
      expect(r.prefer).toMatch(/count=exact/);
      expect(r.offset).toBe(p * 20);
      expect(r.limit).toBe(RIGHE_PER_PAGINA);
    });
  });

  it('R15 tabella vuota: una sola richiesta, nessuna riga, completo', async () => {
    const { doppio, client } = scenario(l, 0);
    const lettura = await l.leggi(client, await accesso());
    expect(doppio.richiesteSu(l.tabella)).toHaveLength(1);
    expect(lettura).toEqual({ righe: [], completo: true });
  });

  it('R16 sentinelle negative: assenti da righe, select e log delle richieste', async () => {
    const { doppio, client } = scenario(l, 56, { maxRows: 20 });
    const lettura = await l.leggi(client, await accesso());
    const visto = JSON.stringify({ righe: lettura.righe, log: doppio.richieste });
    for (const sentinella of [String(SENTINELLA_GLICEMIA), SENTINELLA_NOME, 'blood_glucose', 'source_device', 'hr_source_name']) {
      expect(visto, sentinella).not.toContain(sentinella);
    }
    // l'uid sta (voluto) nel filtro eq.<uid> della richiesta, ma mai nelle righe restituite
    expect(JSON.stringify(lettura.righe)).not.toContain(IO);
  });
});

describe('leggiMetricheDelTitolare: contratto del conteggio (algoritmo)', () => {
  it('R2 max_rows 20 e 1204 righe: limite_pagine, 800 righe, mai completo', async () => {
    const { doppio, client } = scenario(metriche, 1204, { maxRows: 20 });
    const lettura = (await metriche.leggi(client, await accesso())) as { completo: boolean; motivo?: string; righe: unknown[] };
    expect(lettura.completo).toBe(false);
    expect(lettura.motivo).toBe('limite_pagine');
    expect(lettura.righe).toHaveLength(MASSIMO_PAGINE * 20);
    expect(doppio.richiesteSu('fitness_metrics')).toHaveLength(MASSIMO_PAGINE);
  });

  it('R3 max_rows 500 e 1000 righe: due richieste, nessuna a offset 1000', async () => {
    const { doppio, client } = scenario(metriche, 1000, { maxRows: 500 });
    const lettura = await metriche.leggi(client, await accesso());
    expect(offsets(doppio, 'fitness_metrics')).toEqual([0, 500]);
    expect(lettura.righe).toHaveLength(1000);
    expect(lettura.completo).toBe(true);
  });

  it('R4 max_rows 1000 e 1204 righe: 500/500/204, limit=500 in ogni URL, completo', async () => {
    const { doppio, client } = scenario(metriche, 1204, { maxRows: 1000 });
    const lettura = await metriche.leggi(client, await accesso());
    expect(offsets(doppio, 'fitness_metrics')).toEqual([0, 500, 1000]);
    expect(doppio.richiesteSu('fitness_metrics').map((r) => r.limit)).toEqual([500, 500, 500]);
    expect(lettura.righe).toHaveLength(1204);
    expect(lettura.completo).toBe(true);
  });

  it('R5 totale = massimoPagine*500 (2 pagine, 1000 righe): completo', async () => {
    const { client } = scenario(metriche, 1000, { maxRows: 1000 });
    const lettura = await metriche.leggi(client, await accesso(), 2);
    expect(lettura.righe).toHaveLength(1000);
    expect(lettura.completo).toBe(true);
  });

  it('R14 limite pagine 3 con tabella grande: limite_pagine', async () => {
    const { doppio, client } = scenario(metriche, 5000, { maxRows: 1000 });
    const lettura = (await metriche.leggi(client, await accesso(), 3)) as { completo: boolean; motivo?: string };
    expect(lettura).toMatchObject({ completo: false, motivo: 'limite_pagine' });
    expect(doppio.richiesteSu('fitness_metrics')).toHaveLength(3);
  });

  it('R8 il conteggio cambia fra pagine (56 poi 57; 56 poi 40): conteggio_incoerente, nessuna richiesta dopo', async () => {
    for (const secondo of ['57', '40']) {
      const { doppio, client } = scenario(metriche, 56, {
        maxRows: 20, conteggio: (n) => (n === 0 ? '56' : secondo),
      });
      const lettura = (await metriche.leggi(client, await accesso())) as { completo: boolean; motivo?: string };
      expect(lettura, secondo).toMatchObject({ completo: false, motivo: 'conteggio_incoerente' });
      expect(offsets(doppio, 'fitness_metrics'), secondo).toEqual([0, 20]);
    }
  });

  it('R9 righe lette piu del conteggio dichiarato (cancellazione concorrente): incompleto', async () => {
    const { client } = scenario(metriche, 56, { maxRows: 1000, conteggio: () => '10' });
    const lettura = (await metriche.leggi(client, await accesso())) as { completo: boolean; motivo?: string };
    expect(lettura).toMatchObject({ completo: false, motivo: 'conteggio_incoerente' });
  });

  it('R10 pagina vuota a offset 20 con conteggio 56: nessun_progresso, richieste limitate', async () => {
    const { doppio, client } = scenario(metriche, 56, { maxRows: 20, iniezioni: { vuotoAOffset: 20 } });
    const lettura = (await metriche.leggi(client, await accesso())) as { completo: boolean; motivo?: string; righe: unknown[] };
    expect(lettura).toMatchObject({ completo: false, motivo: 'nessun_progresso' });
    expect(lettura.righe).toHaveLength(20);
    expect(offsets(doppio, 'fitness_metrics')).toEqual([0, 20]);
  });

  it('una scrittura concorrente che cambia il numero di righe fra due richieste viene riconosciuta', async () => {
    const { client, doppio } = scenario(metriche, 56, {
      maxRows: 20,
      iniezioni: {
        primaDiRichiesta: (n, tabelle) => {
          if (n === 1) tabelle.fitness_metrics!.push(metrica(IO, 5000));
        },
      },
    });
    const lettura = (await metriche.leggi(client, await accesso())) as { completo: boolean; motivo?: string };
    expect(lettura).toMatchObject({ completo: false, motivo: 'conteggio_incoerente' });
    expect(doppio.richiesteSu('fitness_metrics').length).toBeLessThanOrEqual(2);
  });
});

describe('R7 conteggi non validi da un client diretto: mai completo = true', () => {
  function fakeConConteggio(conteggio: unknown, righe = 3): ClientLetture {
    const dati = Array.from({ length: righe }, (_, i) => ({ ...metrica(IO, i + 1) }));
    const filtro: FiltroLetture = {
      eq: () => filtro, gte: () => filtro, lte: () => filtro, lt: () => filtro, order: () => filtro,
      range: async () => ({ data: dati, error: null, count: conteggio as number | null | undefined }),
    };
    return { from: () => ({ select: () => filtro }) };
  }

  it.each([
    ['NaN', Number.NaN, 'conteggio_non_valido'],
    ['-1', -1, 'conteggio_non_valido'],
    ['1.5', 1.5, 'conteggio_non_valido'],
    ['Infinity', Number.POSITIVE_INFINITY, 'conteggio_non_valido'],
    ['stringa "3"', '3', 'conteggio_non_valido'],
    ['undefined', undefined, 'conteggio_assente'],
    ['null', null, 'conteggio_assente'],
  ])('conteggio %s', async (_nome, conteggio, motivo) => {
    const lettura = (await metriche.leggi(fakeConConteggio(conteggio), await accesso())) as {
      completo: boolean; motivo?: string;
    };
    expect(lettura.completo).toBe(false);
    expect(lettura.motivo).toBe(motivo);
  });

  it('controprova: il conteggio valido e uguale alle righe lette da completo', async () => {
    const lettura = await metriche.leggi(fakeConConteggio(3), await accesso());
    expect(lettura.completo).toBe(true);
  });
});
