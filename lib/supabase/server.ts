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

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
