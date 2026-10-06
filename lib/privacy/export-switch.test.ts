import { afterEach, describe, expect, it, vi } from 'vitest';

import { FORZATO_DA_CODICE, isExportTemporarilyUnavailable } from './export-switch';

describe('interruttore d\'emergenza dell\'export: preparato, non attivo', () => {
  it('di default l\'export e\' DISPONIBILE (nessuna variabile, nessuna leva da codice)', () => {
    expect(isExportTemporarilyUnavailable({}, false)).toBe(false);
  });

  // Protezione contro un commit accidentale con la leva a true. Per USARE la leva si cambia la costante E si cambia
  // questa riga (vedi docs/export-web-emergenza.md): e' l'unico test che dipende dal valore della costante.
  it('la leva da codice e\' SPENTA nel commit (se questo test e\' rosso, l\'export e\' spento da codice)', () => {
    expect(FORZATO_DA_CODICE).toBe(false);
  });

  it('senza ambiente e senza parametro la funzione segue la costante (vale per false e per true)', () => {
    expect(isExportTemporarilyUnavailable({})).toBe(FORZATO_DA_CODICE);
  });

  it('leva 2: con `forzato` acceso l\'export e\' sospeso con qualunque ambiente (anche variabile assente o a 0)', () => {
    for (const env of [{}, { FITMESH_EXPORT_UNAVAILABLE: '0' }, { FITMESH_EXPORT_UNAVAILABLE: 'false' }, { FITMESH_EXPORT_UNAVAILABLE: '1' }]) {
      expect(isExportTemporarilyUnavailable(env, true)).toBe(true);
    }
  });

  it.each(['1', 'true', 'TRUE', 'yes', 'on', ' On ', ' 1 '])('il valore %j SPEGNE l\'export (anche con un refuso di maiuscole o spazi)', (v) => {
    expect(isExportTemporarilyUnavailable({ FITMESH_EXPORT_UNAVAILABLE: v }, false)).toBe(true);
  });

  it.each([undefined, '', ' ', '0', 'false', 'no', 'off', '2', 'si', 'sì', 'y', 'enabled', 'disabled', '"1"', '1.0'])('il valore %j lascia l\'export disponibile', (v) => {
    expect(isExportTemporarilyUnavailable({ FITMESH_EXPORT_UNAVAILABLE: v }, false)).toBe(false);
  });

  describe('legge process.env quando non gli si passa un ambiente', () => {
    afterEach(() => vi.unstubAllEnvs());
    it('acceso e spento', () => {
      vi.stubEnv('FITMESH_EXPORT_UNAVAILABLE', '1');
      expect(isExportTemporarilyUnavailable(undefined, false)).toBe(true);
      vi.stubEnv('FITMESH_EXPORT_UNAVAILABLE', '0');
      expect(isExportTemporarilyUnavailable(undefined, false)).toBe(false);
    });
  });
});
