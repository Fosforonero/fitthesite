// Test-only synthetic client; never imported by the production page.
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import DashboardWebPage from './page';

export type PaginationScenario = 'later-error' | 'later-foreign' | 'limit';
export const OWNER = 'dd000000-0000-4000-8000-000000000002';
export const OTHER = 'dd000000-0000-4000-8000-000000000004';
export const RAW_SENTINEL = 978613;
export const SERVER_DIAGNOSTIC = 'synthetic-private-diagnostic';

export function paginationFixture(scenario: PaginationScenario) {
  const rows = Array.from({ length: 500 }, () => ({
    user_id: OWNER, local_day_key: '2026-10-14', steps: RAW_SENTINEL,
  }));
  const eq = vi.fn((_column: string, _value: string) => query);
  const range = vi.fn(async (from: number, _to: number) => {
    // Declared count (count: 'exact'): 1000 for the later-page faults (a second page is expected),
    // 25000 (> 40 pages x 500) for the limit scenario so the loop stops at the page limit, not by count.
    const count = scenario === 'limit' ? 25_000 : 1000;
    if (from === 0 || scenario === 'limit') return { data: rows, error: null, count };
    if (scenario === 'later-error') return {
      data: null, error: { code: 'SYNTHETIC', message: SERVER_DIAGNOSTIC },
    };
    return { data: [{ ...rows[0], user_id: OTHER }], error: null, count };
  });
  // Intentionally does not filter the foreign row: the real reader must reject it.
  // Rows already have a fixed valid day. No server filtering/sorting is certified.
  const query = {
    select: vi.fn((_columns: string) => query), eq,
    gte: vi.fn((_column: string, _value: string) => query),
    lte: vi.fn((_column: string, _value: string) => query),
    order: vi.fn((_column: string, _options: { ascending: boolean }) => query), range,
  };
  const from = vi.fn((_table: string) => query);
  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: OWNER } } })) },
    rpc: vi.fn((_name: string) => ({ abortSignal: async (_signal: AbortSignal) => ({
      data: { contractVersion: 1, granted: true, titles: ['founder'], denialReason: null },
      error: null,
    }) })),
    from,
  };
  return { client, eq, range, from };
}

export async function renderFixture(locale: 'it' | 'en', scenario: PaginationScenario) {
  const fixture = paginationFixture(scenario);
  // Only the test's Supabase client factory boundary is cast. Verdict and reader run unchanged.
  vi.mocked(createClient).mockResolvedValueOnce(fixture.client as never);
  const html = renderToStaticMarkup(await DashboardWebPage({ params: Promise.resolve({ locale }) }));
  return { html, ...fixture };
}
