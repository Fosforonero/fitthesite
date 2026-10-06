import { describe, expect, it } from 'vitest';

import { SYNTHETIC_VIEWERS } from './access';
import { DEFAULT_PARAMS, isScreen, parsePreviewParams, previewHref } from './params';

describe('parametri dell\'anteprima', () => {
  it('senza parametri: i default', () => {
    expect(parsePreviewParams({})).toEqual(DEFAULT_PARAMS);
  });

  it('valori invalidi tornano al default, mai un errore', () => {
    const p = parsePreviewParams({ state: 'boh', as: 'admin', day: 'ieri', range: '13', chrome: 'x' });
    expect(p).toEqual(DEFAULT_PARAMS);
  });

  it('valori validi passano', () => {
    const p = parsePreviewParams({ state: 'partial', as: 'trial', day: '2026-09-20', range: '90', chrome: '0' });
    expect(p).toMatchObject({ state: 'partial', as: 'trial', day: '2026-09-20', range: 90, chrome: false });
  });

  it('«as» accetta solo le chiavi PROPRIE dei visitatori sintetici, non quelle ereditate da Object.prototype', () => {
    // `as in SYNTHETIC_VIEWERS` accettava `toString`, `constructor`, ...: il visitatore diventava una FUNZIONE.
    const ereditate = [
      'toString',
      'constructor',
      '__proto__',
      'hasOwnProperty',
      'valueOf',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      '__defineGetter__',
      '__lookupGetter__',
    ];
    for (const k of ereditate) {
      expect(parsePreviewParams({ as: k }).as, k).toBe(DEFAULT_PARAMS.as);
    }
  });

  it('«as» come elenco: conta solo il primo valore, con la stessa regola', () => {
    expect(parsePreviewParams({ as: ['toString', 'trial'] }).as).toBe(DEFAULT_PARAMS.as);
    expect(parsePreviewParams({ as: ['trial', 'toString'] }).as).toBe('trial');
  });

  it('ogni visitatore sintetico dichiarato passa, con la grafia esatta', () => {
    for (const k of Object.keys(SYNTHETIC_VIEWERS)) {
      expect(parsePreviewParams({ as: k }).as, k).toBe(k);
    }
    // la grafia non esatta non passa (nessuna normalizzazione)
    expect(parsePreviewParams({ as: 'Trial' }).as).toBe(DEFAULT_PARAMS.as);
    expect(parsePreviewParams({ as: ' trial' }).as).toBe(DEFAULT_PARAMS.as);
  });

  it('il visitatore risultante e\' sempre una chiave propria dell\'elenco, anche per input ostili', () => {
    for (const k of ['toString', '__proto__', 'constructor', '', 'x'.repeat(2000), 'trial\u0000']) {
      const p = parsePreviewParams({ as: k });
      expect(Object.hasOwn(SYNTHETIC_VIEWERS, p.as), k).toBe(true);
    }
  });

  it('il giorno e\' limitato a oggi (sintetico)', () => {
    expect(parsePreviewParams({ day: '2030-01-01' }).day).toBe('2026-09-24');
  });

  it('previewHref omette i default e ricostruisce lo stato', () => {
    expect(previewHref('it', 'overview', DEFAULT_PARAMS)).toBe('/it/dashboard-preview/overview');
    expect(previewHref('en', 'sleep', DEFAULT_PARAMS, { state: 'empty', chrome: false })).toBe(
      '/en/dashboard-preview/sleep?state=empty&chrome=0',
    );
  });

  it('isScreen riconosce solo le sette schermate', () => {
    expect(isScreen('overview')).toBe(true);
    expect(isScreen('login')).toBe(false);
    expect(isScreen('..')).toBe(false);
  });
});
