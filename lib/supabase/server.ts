/**
 * Supabase client per SERVER (Server Components, Route Handlers, Server Actions).
 *
 * Usa cookie httpOnly (gestiti da Next.js `cookies()` API) per la sessione utente.
 * Le query passate da qui rispettano la RLS dell'utente loggato.
 *
 * NON usare lato browser: per quello c'è `./client.ts`.
 * NON usare per query "admin-only": per quello c'è `./admin.ts` (service_role).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from './database.types';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * @param opzioni.senzaCache ogni richiesta a Supabase parte con
 *   `cache: 'no-store'`. Per le letture di dati di un utente e per il verdetto
 *   della dashboard web: la Data Cache di Next non usa i cookie nella chiave,
 *   quindi una risposta conservata potrebbe finire a un altro utente, e un
 *   verdetto conservato sopravvivrebbe a una scadenza o a un rimborso.
 */
export async function createClient(opzioni: { senzaCache?: boolean } = {}) {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(opzioni.senzaCache
        ? {
            global: {
              fetch: (input: RequestInfo | URL, init?: RequestInit) =>
                fetch(input, { ...init, cache: 'no-store' }),
            },
          }
        : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` chiamato da un Server Component:
            // ignoriamo perché il middleware si occupa del refresh.
          }
        },
      },
    },
  );
}
