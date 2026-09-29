import { describe, expect, it } from 'vitest';

import { isWebDashboardPrototypeEnabled } from './flag';

describe('isWebDashboardPrototypeEnabled', () => {
  it('spento senza la variabile', () => {
    expect(isWebDashboardPrototypeEnabled({})).toBe(false);
  });

  it('acceso solo con WEB_DASHBOARD_PROTOTYPE=1', () => {
    expect(isWebDashboardPrototypeEnabled({ WEB_DASHBOARD_PROTOTYPE: '1' })).toBe(true);
    for (const v of ['0', 'true', 'yes', '', ' 1']) {
      expect(isWebDashboardPrototypeEnabled({ WEB_DASHBOARD_PROTOTYPE: v }), `"${v}"`).toBe(false);
    }
  });

  it('mai in produzione Vercel, nemmeno con la variabile impostata', () => {
    expect(isWebDashboardPrototypeEnabled({ WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'production' })).toBe(false);
  });

  it('acceso in preview e sviluppo', () => {
    expect(isWebDashboardPrototypeEnabled({ WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'preview' })).toBe(true);
    expect(isWebDashboardPrototypeEnabled({ WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'development' })).toBe(true);
  });
});
