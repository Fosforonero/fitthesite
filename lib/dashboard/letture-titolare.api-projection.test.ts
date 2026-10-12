import { describe, expect, it } from 'vitest';
import {
  COLONNE_ALLENAMENTI, COLONNE_METRICHE, COLONNE_SERIE_DEL_GIORNO,
  leggiAllenamentiDelTitolare, leggiMetricheDelTitolare, leggiSerieDelGiorno,
  type ClientLetture, type FiltroLetture,
} from './letture-titolare';
import { leggiVerdettoDashboard, type AccessoConcesso, type ClientVerdetto } from './verdetto';

const UID = '00000000-0000-4000-8000-000000000001';
const ALTRO = '00000000-0000-4000-8000-000000000002';

async function accesso(): Promise<AccessoConcesso> {
  const rpc: ClientVerdetto = {
    rpc: () => ({ abortSignal: () => Promise.resolve({
      data: { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null }, error: null,
    }) }),
  };
  const esito = await leggiVerdettoDashboard(rpc, UID);
  if (esito.esito !== 'concesso') throw new Error('accesso non concesso');
  return esito;
}

// Ignora deliberatamente select: difesa al confine, non comportamento PostgREST provato.
function fakeClient(righe: Record<string, unknown>[]): ClientLetture {
  const filtro: FiltroLetture = {
    eq: () => filtro, gte: () => filtro, lte: () => filtro, lt: () => filtro, order: () => filtro,
    range: async () => ({ data: righe, error: null }),
  };
  return { from: () => ({ select: () => filtro }) };
}

const scenari = [
  { nome: 'metriche', cols: COLONNE_METRICHE, leggi: (c: ClientLetture, a: AccessoConcesso) => leggiMetricheDelTitolare(c, a, { daGiorno: '2026-10-01', aGiorno: '2026-10-02' }) },
  { nome: 'serie', cols: COLONNE_SERIE_DEL_GIORNO, leggi: (c: ClientLetture, a: AccessoConcesso) => leggiSerieDelGiorno(c, a, '2026-10-01') },
  { nome: 'allenamenti', cols: COLONNE_ALLENAMENTI, leggi: (c: ClientLetture, a: AccessoConcesso) => leggiAllenamentiDelTitolare(c, a, { daMs: 0, aMs: 10 }) },
];

describe('letture titolare: proiezione e proprietario', () => {
  it.each(scenari)('$nome: restituisce solo le colonne dichiarate', async ({ cols, leggi }) => {
    const base = Object.fromEntries(cols.map(k => [k, 1]));
    const riga = { ...base, user_id: UID, notes: 'SYNTHETIC_MARKER', source_device: 'SYNTHETIC_DEVICE', unexpected_marker: 'not-approved' };
    const lettura = await leggi(fakeClient([riga]), await accesso());
    expect(lettura.righe).toHaveLength(1);
    expect(Object.keys(lettura.righe[0]).sort()).toEqual(cols.filter(k => k !== 'user_id').sort());
    expect(JSON.stringify(lettura.righe)).not.toMatch(/SYNTHETIC_MARKER|SYNTHETIC_DEVICE|not-approved/);
  });

  it.each(scenari)('$nome: rifiuta una riga di un altro proprietario', async ({ cols, leggi }) => {
    const base = Object.fromEntries(cols.map(k => [k, 1]));
    const righe = [{ ...base, user_id: UID }, { ...base, user_id: ALTRO }];
    await expect(leggi(fakeClient(righe), await accesso())).rejects.toMatchObject({ codice: 'riga_altrui' });
  });

  it.each(scenari)('$nome: preserva zero, null e array senza mutare o copiare proprieta ereditate', async ({ cols, leggi }) => {
    const pubbliche = cols.filter(k => k !== 'user_id');
    const ultima = pubbliche[pubbliche.length - 1];
    const dati = Object.fromEntries(pubbliche.slice(0, -1).map(k => [k, 1]));
    const array = Object.freeze([0, null]);
    const riga: Record<string, unknown> = Object.assign(Object.create({ [ultima]: 'inherited-marker' }), dati, {
      user_id: UID, [pubbliche[0]]: 0, [pubbliche[1]]: null, [pubbliche[2]]: array,
    });
    Object.freeze(riga);
    const prima = Object.entries(riga);
    const lettura = await leggi(fakeClient([riga]), await accesso());
    const risultato = lettura.righe[0] as Record<string, unknown>;
    expect(risultato[pubbliche[0]]).toBe(0);
    expect(risultato[pubbliche[1]]).toBeNull();
    expect(risultato[pubbliche[2]]).toBe(array);
    expect(Object.hasOwn(risultato, ultima)).toBe(false);
    expect(Object.hasOwn(risultato, 'user_id')).toBe(false);
    expect(Object.entries(riga)).toEqual(prima);
    expect(lettura.completo).toBe(true);
  });
});
