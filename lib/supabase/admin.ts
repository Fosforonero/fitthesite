/**
 * Supabase ADMIN client — bypassa la RLS via service_role key.
 *
 * ⚠️ ATTENZIONE: usare SOLO server-side, e SOLO dopo aver verificato che
 * l'utente è autorizzato (es. is_admin via RPC sul client `server.ts`).
 *
 * Mai importare in Client Components. Il bundle client non deve mai contenere
 * `SUPABASE_SERVICE_ROLE_KEY`.
 *
 * Pattern d'uso tipico (route handler):
 *
 *   import { createClient as createUser } from '@/lib/supabase/server';
 *   import { createAdminClient } from '@/lib/supabase/admin';
 *
 *   export async function POST(req: Request) {
 *     const user = await createUser();
 *     const { data: isAdmin } = await user.rpc('is_admin');
 *     if (!isAdmin) return new Response('Forbidden', { status: 403 });
 *
 *     const admin = createAdminClient();
 *     await admin.from('admin_events').insert({ ... });
 *     return new Response('OK');
 *   }
 */
import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

/**
 * Crea un client Supabase con service_role key.
 *
 * NON è un singleton perché vogliamo un nuovo client per ogni request
 * (no shared state tra utenti). Edge runtime e Node entrambi supportati.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL env vars',
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
