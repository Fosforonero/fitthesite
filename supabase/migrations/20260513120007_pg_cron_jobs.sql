-- ─────────────────────────────────────────────────────────
-- Migration 007 — pg_cron scheduled jobs (retention, cleanup)
-- ⚠️ Da eseguire DOPO aver abilitato l'extension pg_cron in Supabase Dashboard
-- (Project → Database → Extensions → pg_cron → Enable).
-- ─────────────────────────────────────────────────────────

create extension if not exists pg_cron;

-- ─── 1. Cleanup pairing codes scaduti (ogni 10 min) ────────
select cron.schedule(
  'cleanup-expired-pairing-codes',
  '*/10 * * * *',
  $$
    delete from public.device_pairing_codes
    where (claimed_at is not null and created_at < now() - interval '1 hour')
       or (claimed_at is null and expires_at < now() - interval '1 hour');
  $$
);

-- ─── 2. Retention sync_events: 90 giorni rolling ───────────
select cron.schedule(
  'retention-sync-events',
  '0 3 * * *',  -- ogni notte alle 3 AM
  $$
    delete from public.sync_events
    where created_at < now() - interval '90 days';
  $$
);

-- ─── 3. Retention fitness_metrics: 24 mesi rolling ─────────
-- NOTA: questo è il default; l'utente può chiedere retention più breve
-- in Settings (Phase 7). Per ora applichiamo solo il default.
select cron.schedule(
  'retention-fitness-metrics',
  '0 4 * * 0',  -- ogni domenica alle 4 AM
  $$
    delete from public.fitness_metrics
    where collected_at_ms < extract(epoch from (now() - interval '24 months')) * 1000;
  $$
);

select cron.schedule(
  'retention-workouts',
  '15 4 * * 0',  -- ogni domenica alle 4:15 AM
  $$
    delete from public.workouts
    where start_ms < extract(epoch from (now() - interval '24 months')) * 1000;
  $$
);

-- ─── 4. Process deletion requests (T+24h grace) ────────────
-- Vedi docs/architecture/10-data-deletion-flow.md
-- Triggera Edge Function execute-deletion per ogni richiesta scaduta.
-- ⚠️ Richiede `pg_net` extension + secret DELETION_CRON_SECRET configurato
-- come Postgres setting `app.deletion_cron_secret`.
-- TEMPORARY DISABLED finché l'Edge Function non è deployata. Riattivare con:
--   select cron.schedule('process-deletions', '*/10 * * * *', '...');

-- ─── 5. Keepalive query (anti free-tier auto-pause) ────────
-- Supabase free tier mette in pausa il DB dopo 7 giorni inattivi.
-- Una query SELECT leggera ogni 6 ore previene il sleep.
select cron.schedule(
  'keepalive-free-tier',
  '0 */6 * * *',
  $$ select 1; $$
);

comment on extension pg_cron is
  'Scheduled jobs for retention, cleanup, deletion processing. Vedi migration 007.';
