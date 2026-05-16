/**
 * Supabase client per il BROWSER (Client Components, "use client").
 *
 * Usa `NEXT_PUBLIC_*` env vars perché vengono inlined nel bundle client.
 * NON usare mai questo file in Server Components / Route Handlers / Server Actions:
 * importa `./server` lì, che gestisce i cookie httpOnly.
 *
 * Singleton: il client viene creato una sola volta per page lifecycle.
 */
import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './database.types';

let cached: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (cached) return cached;
  cached = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cached;
}
