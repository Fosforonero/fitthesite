import { readFileSync } from 'node:fs';
import path from 'node:path';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { locales } from '@/lib/i18n';

import { EXPORT_COPY } from './copy';

// Il componente dell'export e' sostituito da un segnaposto che conta i montaggi: se la pagina e'
// «sospesa» non deve essere montato (quindi non parte nessuna lettura), se e' attiva si'.
const ctx = vi.hoisted(() => ({ montaggi: 0, creazioniClient: 0 }));
vi.mock('./ExportDataClient', () => ({
  ExportDataClient: () => {
    ctx.montaggi += 1;
    return <button type="button">EXPORT-CLIENT</button>;
  },
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => {
    ctx.creazioniClient += 1;
    throw new Error('il client Supabase non deve essere creato dalla pagina sospesa');
  },
}));

import ExportPage from './page';

async function pagina(locale: string) {
  const ui = await ExportPage({ params: Promise.resolve({ locale }) });
  render(ui);
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  ctx.montaggi = 0;
  ctx.creazioniClient = 0;
});

describe('pagina dell\'export con l\'interruttore d\'emergenza', () => {
  it.each([...locales])('%s: sospesa, mostra il messaggio nella lingua e NON monta il componente', async (lc) => {
    vi.stubEnv('FITMESH_EXPORT_UNAVAILABLE', '1');
    await pagina(lc);
    expect(screen.getByRole('status')).toHaveTextContent(EXPORT_COPY[lc].unavailableTitle);
    expect(screen.getByRole('status')).toHaveTextContent(EXPORT_COPY[lc].unavailableBody);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(ctx.montaggi).toBe(0);
    expect(ctx.creazioniClient).toBe(0);
  });

  it.each([undefined, '', '0', 'false'])('con la variabile %j l\'export resta disponibile (componente montato, nessun messaggio)', async (v) => {
    if (v !== undefined) vi.stubEnv('FITMESH_EXPORT_UNAVAILABLE', v);
    await pagina('it');
    expect(screen.getByRole('button', { name: 'EXPORT-CLIENT' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(ctx.montaggi).toBe(1);
  });

  it('la pagina sospesa non dice «errore» e non espone testi tecnici', async () => {
    vi.stubEnv('FITMESH_EXPORT_UNAVAILABLE', 'true');
    await pagina('en');
    expect(document.body.textContent ?? '').not.toMatch(/error|exception|stack|supabase|42P17|policy/i);
  });

  it('la pagina sospesa ha il titolo e il link «indietro» alle impostazioni nella lingua giusta', async () => {
    vi.stubEnv('FITMESH_EXPORT_UNAVAILABLE', '1');
    await pagina('de');
    expect(screen.getByRole('heading', { name: EXPORT_COPY.de.heading })).toBeInTheDocument();
    const indietro = screen.getByRole('link', { name: EXPORT_COPY.de.back });
    expect(indietro).toHaveAttribute('href', '/de/app/settings');
  });

  it('un codice di lingua non servito usa l\'italiano DICHIARATO, anche con la pagina sospesa', async () => {
    vi.stubEnv('FITMESH_EXPORT_UNAVAILABLE', '1');
    await pagina('xx');
    expect(screen.getByRole('status')).toHaveTextContent(EXPORT_COPY.it.unavailableTitle);
  });

  it('la pagina resta dinamica: la variabile si legge a ogni richiesta, non una volta sola al build', () => {
    const src = readFileSync(path.join(__dirname, 'page.tsx'), 'utf8');
    expect(src).toMatch(/export const dynamic = ['"]force-dynamic['"]/);
  });

  it('LEVA 2: con la costante FORZATO_DA_CODICE a true la pagina e\' sospesa anche senza variabile (modulo sostituito nel test)', async () => {
    vi.resetModules();
    vi.doMock('@/lib/privacy/export-switch', () => ({
      FORZATO_DA_CODICE: true,
      isExportTemporarilyUnavailable: (env: Record<string, string | undefined> = {}, forzato = true) =>
        forzato || env.FITMESH_EXPORT_UNAVAILABLE === '1',
    }));
    try {
      const { default: PaginaForzata } = await import('./page');
      render(await PaginaForzata({ params: Promise.resolve({ locale: 'it' }) }));
      expect(screen.getByRole('status')).toHaveTextContent(EXPORT_COPY.it.unavailableTitle);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(ctx.montaggi).toBe(0);
    } finally {
      vi.doUnmock('@/lib/privacy/export-switch');
      vi.resetModules();
    }
  });
});
