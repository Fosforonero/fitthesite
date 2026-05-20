-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: schedule pg_cron job 'sync-trigger-fcm-fanout' (Sprint M Task 3)
--
-- Sostituisce il `crons` block di vercel.json (rifiutato sul piano Hobby).
-- Ogni 15 min chiama l'endpoint /api/cron/sync-trigger che fa fan-out di
-- silent FCM push ai device attivi (vedi app/api/cron/sync-trigger/route.ts).
--
-- Dipendenze:
--   - extension pg_cron (gia' attiva da migration 007)
--   - extension pg_net (installata da questa migration)
--   - supabase_vault secret 'cron_secret' che contiene il valore CRON_SECRET
--     attualmente configurato su Vercel env vars (Production + Preview).
--
-- vault.decrypted_secrets e' una view auto-decrypt; pg_cron job gira come
-- postgres role che ha read access alla view.
--
-- L'endpoint accetta GET (non POST) quindi usiamo net.http_get.
-- Idempotente: unschedule prima di schedule, safe da rilanciare.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-trigger-fcm-fanout') THEN
    PERFORM cron.unschedule('sync-trigger-fcm-fanout');
  END IF;
END $$;

SELECT cron.schedule(
  'sync-trigger-fcm-fanout',
  '*/15 * * * *',
  $cmd$
    SELECT net.http_get(
      url := 'https://www.fitmesh.fit/api/cron/sync-trigger',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
      ),
      timeout_milliseconds := 30000
    );
  $cmd$
);
