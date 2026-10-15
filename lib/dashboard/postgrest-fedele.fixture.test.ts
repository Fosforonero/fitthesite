/**
 * Il doppio fedele di PostgREST contro i valori DORATI misurati sul banco (spike del 15/10/2026,
 * PostgREST v14.15, tabella con 56 righe del titolare A): se il doppio si discosta, le prove della
 * completezza che si appoggiano a lui non provano piu' niente.
 *
 * Valori dorati (esito-sonde-curl-maxrows20.txt / maxrows1000.txt dello spike):
 *   max_rows 20,   offset=0&limit=500 + count=exact  -> 206, 0-19/56, 20 righe
 *   max_rows 20,   offset=0&limit=500 SENZA count    -> 200, 0-19/*,  20 righe
 *   max_rows 20,   offset 500 SENZA count            -> 200, * /*,    0 righe
 *   max_rows 1000, offset=0&limit=500 + count=exact  -> 200, 0-55/56, 56 righe
 *   max_rows 1000, offset=0&limit=500 SENZA count    -> 200, 0-55/*,  56 righe
 * DEDOTTI (non coperti da una sonda al momento della scrittura): offset oltre il totale con count = 416;
 * tabella vuota con count = * /0.
 */
import { describe, expect, it } from 'vitest';

import { creaDoppioPostgrest } from './postgrest-fedele.fixture';

const A = 'a1000000-0000-4000-8000-000000000001';
const B = 'b1000000-0000-4000-8000-000000000002';

function tabella() {
  const righe = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1, user_id: A, local_day_key: `2026-09-${String((i % 28) + 1).padStart(2, '0')}`, steps: 100 + i,
  }));
  return { fitness_metrics: [...righe, { id: 900, user_id: B, local_day_key: '2026-09-01', steps: 7 }] };
}

async function chiedi(
  maxRows: number,
  query: string,
  conteggio: boolean,
  tabelle: ReturnType<typeof tabella> | { fitness_metrics: never[] } = tabella(),
) {
  const doppio = creaDoppioPostgrest({ tabelle, maxRows });
  const r = await doppio.fetch(`http://banco.invalid/rest/v1/fitness_metrics?${query}`, {
    headers: conteggio ? { Prefer: 'count=exact' } : {},
  });
  return { status: r.status, range: r.headers.get('content-range'), corpo: (await r.json()) as unknown[], doppio };
}

const Q = `select=id,user_id&user_id=eq.${A}&order=local_day_key.asc,id.asc&offset=0&limit=500`;

describe('doppio PostgREST: valori dorati dello spike', () => {
  it('max_rows 20 + count=exact: 206, 0-19/56, 20 righe', async () => {
    const r = await chiedi(20, Q, true);
    expect([r.status, r.range, r.corpo.length]).toEqual([206, '0-19/56', 20]);
  });
  it('max_rows 20 senza count: 200, 0-19/*, 20 righe (il troncamento e silenzioso)', async () => {
    const r = await chiedi(20, Q, false);
    expect([r.status, r.range, r.corpo.length]).toEqual([200, '0-19/*', 20]);
  });
  it('max_rows 20, offset 500 senza count: 200, */*, nessuna riga', async () => {
    const r = await chiedi(20, Q.replace('offset=0', 'offset=500'), false);
    expect([r.status, r.range, r.corpo.length]).toEqual([200, '*/*', 0]);
  });
  it('max_rows 1000 + count=exact: 200, 0-55/56, 56 righe', async () => {
    const r = await chiedi(1000, Q, true);
    expect([r.status, r.range, r.corpo.length]).toEqual([200, '0-55/56', 56]);
  });
  it('max_rows 1000 senza count: 200, 0-55/*, 56 righe', async () => {
    const r = await chiedi(1000, Q, false);
    expect([r.status, r.range, r.corpo.length]).toEqual([200, '0-55/*', 56]);
  });
  it('senza filtro proprietario passano anche le righe altrui (lo spike: 57 righe, due proprietari)', async () => {
    const r = await chiedi(1000, 'select=id,user_id&order=id.asc', false);
    expect(r.corpo).toHaveLength(57);
    expect(new Set((r.corpo as { user_id: string }[]).map((x) => x.user_id))).toEqual(new Set([A, B]));
  });
  it('conteggio di una pagina intermedia: 20-39/56 con 206', async () => {
    const r = await chiedi(20, Q.replace('offset=0', 'offset=20'), true);
    expect([r.status, r.range, r.corpo.length]).toEqual([206, '20-39/56', 20]);
  });
  it('proietta solo le colonne richieste (la sentinella di una colonna non chiesta non esce)', async () => {
    const r = await chiedi(1000, 'select=id&user_id=eq.' + A, false);
    expect(Object.keys(r.corpo[0] as object)).toEqual(['id']);
  });
});

describe('doppio PostgREST: casi DEDOTTI e iniezioni', () => {
  it('DEDOTTO: offset oltre il totale con conteggio = 416', async () => {
    const r = await chiedi(20, Q.replace('offset=0', 'offset=56'), true);
    expect([r.status, r.range]).toEqual([416, '*/56']);
  });
  it('DEDOTTO: tabella vuota con conteggio = 200 e */0', async () => {
    const r = await chiedi(1000, Q, true, { fitness_metrics: [] });
    expect([r.status, r.range, r.corpo.length]).toEqual([200, '*/0', 0]);
  });
  it('conteggio asterisco, assente e malformato', async () => {
    for (const [modo, atteso] of [['asterisco', '0-19/*'], ['assente', null], ['malformato', '0-19/non-un-numero']] as const) {
      const d = creaDoppioPostgrest({ tabelle: tabella(), maxRows: 20, conteggio: modo });
      const r = await d.fetch(`http://banco.invalid/rest/v1/fitness_metrics?${Q}`, { headers: { Prefer: 'count=exact' } });
      expect(r.headers.get('content-range'), modo).toBe(atteso);
    }
  });
  it('registra le richieste e un operatore sconosciuto fallisce, non passa in silenzio', async () => {
    const d = creaDoppioPostgrest({ tabelle: tabella() });
    const r = await d.fetch('http://banco.invalid/rest/v1/fitness_metrics?steps=like.1*', {});
    expect(r.status).toBe(400);
    expect(d.richieste).toHaveLength(1);
    expect(d.richiesteSu('fitness_metrics')).toHaveLength(1);
  });
});
