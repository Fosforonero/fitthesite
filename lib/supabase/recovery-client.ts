/**
 * Client Supabase ISOLATO per il flusso di password recovery.
 *
 * Deliberatamente NON e' il singleton cookie-backed di `./client.ts`: quello
 * persiste la sessione ordinaria del sito ed e' condiviso fra tutte le
 * pagine/tab. Questo client invece:
 * - persistSession:false + autoRefreshToken:false → nessuna sessione
 *   sopravvive al reload o e' condivisa con altre tab/pagine.
 * - detectSessionInUrl:false → non tenta MAI di leggere hash/query per una
 *   sessione (il flusso OTP esplicito non dipende da link auto-verificanti).
 * - Nuova istanza per ogni chiamata (nessuna cache module-level, a differenza
 *   di `./client.ts`): non esiste stato ambient che possa far leaked/mescolare
 *   una recovery su un account con la sessione ordinaria di un altro account
 *   nello stesso browser.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

export function createRecoveryClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
