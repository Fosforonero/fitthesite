import { expect, it, vi } from 'vitest';
import { leggiVerdettoDashboard, type ClientVerdetto } from './verdetto';

const uid = '00000000-0000-4000-8000-000000000001';
const ok = { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null };

it('concesso prima della scadenza', async () => {
  const client: ClientVerdetto = {
    rpc: () => ({ abortSignal: () => Promise.resolve({ data: ok, error: null }) }),
  };
  const r = await leggiVerdettoDashboard(client, uid, 10);
  expect(r.esito).toBe('concesso');
});

// Adapter sintetico: non dimostra il comportamento del client Supabase reale.
it('scadenza: tempo_scaduto anche se la risposta arriva tardi dopo abort', async () => {
  vi.useFakeTimers();
  try {
    const client: ClientVerdetto = {
      rpc: () => ({
        abortSignal: (signal: AbortSignal) =>
          new Promise((resolve) => {
            signal.addEventListener('abort', () => resolve({ data: ok, error: null }), { once: true });
          }),
      }),
    };
    const p = leggiVerdettoDashboard(client, uid, 10);
    await vi.advanceTimersByTimeAsync(11);
    expect(await p).toEqual({ esito: 'non_disponibile', guasto: 'tempo_scaduto' });
  } finally {
    vi.useRealTimers();
  }
});
