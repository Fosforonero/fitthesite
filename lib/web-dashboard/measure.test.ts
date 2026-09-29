import { describe, expect, it } from 'vitest';

import { absent, meanOfPresent, numberOrNull, partial, presentNumber, sumMeasures, value } from './measure';

describe('zero misurato, parziale, assente', () => {
  it('lo zero misurato e\' un dato, non un assente', () => {
    const p = presentNumber(value(0));
    expect(p.state).toBe('measured-zero');
    expect(p).toMatchObject({ isZero: true, value: 0 });
    expect(numberOrNull(value(0))).toBe(0);
  });

  it('l\'assente non diventa mai 0', () => {
    const p = presentNumber(absent('no_samples'));
    expect(p).toEqual({ state: 'absent', reason: 'no_samples' });
    expect(numberOrNull(absent('read_error'))).toBeNull();
  });

  it('il parziale porta valore e copertura, e resta parziale anche a zero', () => {
    const p = presentNumber(partial(3200, 0.79, 'device_off'));
    expect(p).toMatchObject({ state: 'partial', value: 3200, coverage: 0.79, note: 'device_off' });
    expect(presentNumber(partial(0, 0.3, 'window_open'))).toMatchObject({ state: 'partial', isZero: true });
  });

  it('la copertura e\' limitata a 0..1', () => {
    expect(partial(1, 3, 'device_off')).toMatchObject({ coverage: 1 });
    expect(partial(1, -1, 'device_off')).toMatchObject({ coverage: 0 });
  });
});

describe('sumMeasures', () => {
  it('somma piena solo se tutti i giorni sono misurati', () => {
    expect(sumMeasures([value(10), value(0), value(5)])).toEqual(value(15));
  });

  it('un assente non vale zero: il totale diventa parziale con la copertura vera', () => {
    const s = sumMeasures([value(10), absent('no_samples'), value(5), value(5)]);
    expect(s).toMatchObject({ kind: 'partial', value: 20, coverage: 0.75 });
  });

  it('un parziale rende parziale il totale', () => {
    expect(sumMeasures([value(10), partial(4, 0.5, 'sync_incomplete')])).toMatchObject({ kind: 'partial', value: 14, coverage: 0.5 });
  });

  it('tutti assenti: assente, non 0', () => {
    expect(sumMeasures([absent('no_source'), absent('no_source')])).toEqual({ kind: 'absent', reason: 'no_source' });
    expect(sumMeasures([])).toMatchObject({ kind: 'absent' });
  });
});

describe('meanOfPresent', () => {
  it('non e\' diluita dagli assenti, ma conta gli zeri misurati', () => {
    expect(meanOfPresent([value(10), absent('no_samples'), value(0)])).toBe(5);
  });
  it('null se non c\'e\' niente', () => {
    expect(meanOfPresent([absent('no_source')])).toBeNull();
  });
});
