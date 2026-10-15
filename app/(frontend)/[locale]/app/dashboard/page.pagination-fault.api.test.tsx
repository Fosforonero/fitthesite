import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testiPer } from '@/lib/dashboard/testi';
import {
  renderFixture,
  OWNER,
  OTHER,
  RAW_SENTINEL,
  SERVER_DIAGNOSTIC,
} from './pagination.fixture';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('FITMESH_WEB_DASHBOARD', '1');
  vi.useFakeTimers();
  vi.setSystemTime('2026-10-15T12:00:00Z');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

function expectNoLeaks(html: string) {
  expect(html).not.toContain(OWNER);
  expect(html).not.toContain(OTHER);
  expect(html).not.toContain(String(RAW_SENTINEL));
  expect(html).not.toContain(SERVER_DIAGNOSTIC);
}

describe.each(['it', 'en'] as const)('dashboard pagination faults (%s)', (locale) => {
  const t = testiPer(locale)!;

  it.each(['later-error', 'later-foreign'] as const)(
    'second page %s -> unavailable, not denied',
    async (scenario) => {
      const { html, range, eq } = await renderFixture(locale, scenario);
      expect(html).toContain('data-esito="non_disponibile"');
      expect(html).not.toContain('data-esito="negato"');
      expect(html).not.toContain(t.giorniConDati(1));
      expect(html).not.toContain(t.concessoPer(''));
      expect(html).not.toContain(t.conteggioParziale);
      expect(range.mock.calls).toEqual([
        [0, 499],
        [500, 999],
      ]);
      expect(eq).toHaveBeenCalledWith('user_id', OWNER);
      expectNoLeaks(html);
    },
  );

  it('page limit -> partial count, no failure markers', async () => {
    const { html, range, eq } = await renderFixture(locale, 'limit');
    expect(range).toHaveBeenCalledTimes(40);
    expect(range.mock.calls[0]).toEqual([0, 499]);
    expect(range.mock.calls[range.mock.calls.length - 1]).toEqual([19500, 19999]);
    expect(html).toContain(t.giorniConDati(1));
    expect(html).toContain(t.conteggioParziale);
    expect(html).not.toContain('data-esito="non_disponibile"');
    expect(html).not.toContain('data-esito="negato"');
    expect(eq).toHaveBeenCalledWith('user_id', OWNER);
    expectNoLeaks(html);
  });
});
