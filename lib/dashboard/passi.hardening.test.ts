/**
 * Hardening della qualificazione dei passi dopo la revisione indipendente (B3c-0, commit 2):
 * n1 TOCTOU della finestra, n2 tetto int4, m1 chiave con prefisso di un giorno della finestra.
 * Tutte le date e i valori sono FITTIZI.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { finestraSetteGiorni, type FinestraGiorni } from './finestra';
import { qualificaPassi } from './passi';

const GIORNI = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'];
let FINESTRA: FinestraGiorni;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse('2026-10-15T12:00:00.000Z'));
  FINESTRA = finestraSetteGiorni();
});
afterEach(() => vi.useRealTimers());

const r = (giorno: unknown, steps: unknown, source: unknown = 'health_connect') => ({ local_day_key: giorno, steps, source });

describe('n1: la finestra si legge UNA volta sola', () => {
  it('un getter che cambia valore dopo la prima lettura non altera ne rompe il risultato', () => {
    let letture = 0;
    const traditrice = {
      get primo() { return letture > 0 ? 'x' : GIORNI[0]; },
      get ultimo() { return letture > 0 ? 'x' : GIORNI[6]; },
      get giorni() {
        letture += 1;
        return letture === 1 ? [...GIORNI] : ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      },
    };
    const out = qualificaPassi([r(GIORNI[2], 500)] as never, traditrice as never);
    expect(out.map((g) => g.giorno)).toEqual(GIORNI);
    expect(out[2]).toEqual({ giorno: GIORNI[2], stato: 'ricevuto', passi: 500 });
    expect(letture).toBe(1);
  });
  it('mutare l\'array originale dopo la chiamata non cambia il risultato gia\' restituito', () => {
    const arr = [...GIORNI];
    const f = { primo: GIORNI[0], ultimo: GIORNI[6], giorni: arr };
    const out = qualificaPassi([], f as never);
    arr[0] = 'zzz';
    expect(out[0].giorno).toBe(GIORNI[0]);
  });
});

describe('n2: tetto di plausibilita\' (colonna int4)', () => {
  it('2147483647 e\' ricevuto', () => {
    expect(qualificaPassi([r(GIORNI[0], 2147483647)] as never, FINESTRA)[0]).toEqual({
      giorno: GIORNI[0], stato: 'ricevuto', passi: 2147483647,
    });
  });
  it.each([2147483648, 2 ** 40, Number.MAX_SAFE_INTEGER])('%s e\' non disponibile, non ricevuto', (v) => {
    const g = qualificaPassi([r(GIORNI[0], v)] as never, FINESTRA)[0];
    expect(g).toEqual({ giorno: GIORNI[0], stato: 'non_disponibile' });
    expect(g).not.toHaveProperty('passi');
  });
});

describe('m1: una chiave non esatta che inizia con la data di un giorno della finestra', () => {
  it.each([
    ['ora', '2026-10-09T00:00:00Z'], ['spazio finale', '2026-10-09 '], ['suffisso', '2026-10-09x'], ['ora con spazio', '2026-10-09 10:00'],
  ])('%s: il giorno e\' non disponibile, non nessun dato, non ambiguo, nessun valore', (_n, chiave) => {
    const out = qualificaPassi([r(chiave, 4321)] as never, FINESTRA);
    expect(out[1]).toEqual({ giorno: GIORNI[1], stato: 'non_disponibile' });
    expect(JSON.stringify(out)).not.toContain('4321');
    expect(out.filter((_, i) => i !== 1).map((g) => g.stato)).toEqual(Array(6).fill('nessun_dato'));
  });
  it('con una riga esatta valida nello stesso giorno, il giorno resta non disponibile (nessun valore scelto)', () => {
    const out = qualificaPassi([r(GIORNI[1], 100), r('2026-10-09 ', 200)] as never, FINESTRA);
    expect(out[1]).toEqual({ giorno: GIORNI[1], stato: 'non_disponibile' });
  });
  it('una chiave che non assomiglia a nessun giorno della finestra resta ignorata', () => {
    const out = qualificaPassi(
      // B3e N1: prima c'era anche r(' 2026-10-09', 3) fra le ignorate; ora, tolti gli spazi, coincide con
      // un giorno della finestra e rende quel giorno non disponibile (test sotto). Dichiarato nel commit.
      [r('2026-10-01T00:00:00Z', 1), r('2026-10-15 ', 2), r('20261009', 4), r('ieri', 5), r('', 6)] as never,
      FINESTRA,
    );
    expect(out.map((g) => g.stato)).toEqual(Array(7).fill('nessun_dato'));
  });
});

describe('N1 (B3e): una chiave non esatta che, normalizzata, coincide con un giorno della finestra', () => {
  it.each([
    ['mese e giorno senza zero', '2026-10-9', 1],
    ['mese 1 senza zero: gennaio, fuori finestra', '2026-1-09', null],
    ['spazio iniziale', ' 2026-10-09', 1],
    ['spazi attorno e senza zero', ' 2026-10-9 ', 1],
    ['tabulazione finale', '2026-10-09\t', 1],
    ['giorno 8 senza zero', '2026-10-8', 0],
    ['ultimo giorno senza zero e spazio', '2026-10-14 ', 6],
  ])('%s (%j): quel giorno e\' non disponibile, mai ricevuto, mai nessun dato, nessun valore', (_n, chiave, indice) => {
    const out = qualificaPassi([r(chiave, 4321)] as never, FINESTRA);
    if (indice === null) {
      // normalizzata e' 2026-01-09: non e' un giorno della finestra, resta ignorata
      expect(out.map((g) => g.stato)).toEqual(Array(7).fill('nessun_dato'));
      return;
    }
    expect(out[indice]).toEqual({ giorno: GIORNI[indice], stato: 'non_disponibile' });
    expect(JSON.stringify(out)).not.toContain('4321');
    expect(out.filter((_, i) => i !== indice).map((g) => g.stato)).toEqual(Array(6).fill('nessun_dato'));
  });
  it('con una riga esatta buona nello stesso giorno, il giorno resta non disponibile (la riga buona non vince)', () => {
    const out = qualificaPassi([r(GIORNI[1], 100), r('2026-10-9', 200)] as never, FINESTRA);
    expect(out[1]).toEqual({ giorno: GIORNI[1], stato: 'non_disponibile' });
    expect(JSON.stringify(out)).not.toMatch(/100|200/);
  });
  it('anche con piu righe esatte (ambiguo) la chiave non standard prevale: non disponibile', () => {
    const out = qualificaPassi([r(GIORNI[2], 1), r(GIORNI[2], 2, 'ring'), r('2026-10-10 ', 3)] as never, FINESTRA);
    expect(out[2]).toEqual({ giorno: GIORNI[2], stato: 'non_disponibile' });
  });
  it('fuori finestra e chiavi che non assomigliano a un giorno restano ignorate', () => {
    const out = qualificaPassi(
      [r('2026-10-7', 1), r('2026-10-15', 2), r(' 2026-10-15 ', 3), r('2026/10/09', 4), r('20261009', 5), r('2026-10-009', 6), r('2026-010-09', 7), r('9-10-2026', 8), r('', 9), r('   ', 10)] as never,
      FINESTRA,
    );
    expect(out.map((g) => g.stato)).toEqual(Array(7).fill('nessun_dato'));
  });
  it('input non modificato e risultato congelato', () => {
    const righe = [r('2026-10-9', 5)];
    const copia = JSON.stringify(righe);
    const out = qualificaPassi(righe as never, FINESTRA);
    expect(JSON.stringify(righe)).toBe(copia);
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out[1])).toBe(true);
  });
});
