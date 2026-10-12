import { afterEach, expect, it, vi } from 'vitest';
import { leggiVerdettoDashboard, type ClientVerdetto } from './verdetto';

const uid = '00000000-0000-4000-8000-000000000001';
const granted = { data: { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null }, error: null };
const timeout = { esito: 'non_disponibile', guasto: 'tempo_scaduto' };
type Response = Awaited<ReturnType<ReturnType<ClientVerdetto['rpc']>['abortSignal']>>;
afterEach(() => vi.useRealTimers());

it('finishes at the deadline when the adapter never settles or observes abort', async () => {
  vi.useFakeTimers();
  let signal: AbortSignal | undefined;
  const client: ClientVerdetto = { rpc: () => ({ abortSignal: s => { signal = s; return new Promise<Response>(() => {}); } }) };
  const settled = vi.fn();
  void leggiVerdettoDashboard(client, uid, 10).then(settled);
  await vi.advanceTimersByTimeAsync(9);
  expect(settled).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(signal?.aborted).toBe(true);
  expect(settled).toHaveBeenCalledExactlyOnceWith(timeout);
  expect(vi.getTimerCount()).toBe(0);
});

it.each(['resolve', 'reject'] as const)('settles before a late adapter %s and never grants afterwards', async (late) => {
  vi.useFakeTimers();
  let resolve!: (value: Response) => void;
  let reject!: (error: Error) => void;
  const pending = new Promise<Response>((yes, no) => { resolve = yes; reject = no; });
  const client: ClientVerdetto = { rpc: () => ({ abortSignal: () => pending }) };
  const settled = vi.fn();
  void leggiVerdettoDashboard(client, uid, 10).then(settled);
  await vi.advanceTimersByTimeAsync(10);
  expect(settled).toHaveBeenCalledExactlyOnceWith(timeout);
  if (late === 'resolve') resolve(granted); else reject(new Error('late synthetic failure'));
  await vi.advanceTimersByTimeAsync(0);
  expect(settled).toHaveBeenCalledExactlyOnceWith(timeout);
  expect(vi.getTimerCount()).toBe(0);
});

it('clears its timer on a successful early response without aborting it later', async () => {
  vi.useFakeTimers();
  let signal: AbortSignal | undefined;
  const client: ClientVerdetto = { rpc: () => ({ abortSignal: s => { signal = s; return Promise.resolve(granted); } }) };
  expect((await leggiVerdettoDashboard(client, uid, 10)).esito).toBe('concesso');
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(100);
  expect(signal?.aborted).toBe(false);
});

it.each(['rpc', 'abortSignal'] as const)('clears its timer on synchronous %s failure', async (place) => {
  vi.useFakeTimers();
  const client: ClientVerdetto = { rpc: () => {
    if (place === 'rpc') throw new Error('synthetic rpc failure');
    return { abortSignal: () => { throw new Error('synthetic adapter failure'); } };
  } };
  expect(await leggiVerdettoDashboard(client, uid, 10)).toEqual({ esito: 'non_disponibile', guasto: 'errore_rete' });
  expect(vi.getTimerCount()).toBe(0);
});

it('does not call RPC or allocate a timer for an invalid uid', async () => {
  vi.useFakeTimers();
  const rpc = vi.fn();
  expect(await leggiVerdettoDashboard({ rpc }, 'invalid', 10)).toEqual({ esito: 'non_disponibile', guasto: 'utente_assente' });
  expect(rpc).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
