import { describe, expect, it } from 'vitest';

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
