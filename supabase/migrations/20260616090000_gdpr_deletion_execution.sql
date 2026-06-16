-- GDPR art.17 — esecuzione automatica delle richieste di cancellazione.
-- Sostituisce il flusso Edge Function `execute-deletion` mai deployato
-- (vedi migration 20260513120007, cron 'process-deletions' rimasto disabilitato).
-- Approccio: funzione Postgres + pg_cron, niente dipendenze HTTP/secret.
-- Applicato in prod via Supabase MCP il 2026-06-16 (apply_migration).

-- Esegue le richieste scadute (grace 24h). Cancella public.profiles (cascade su
-- TUTTI i dati utente: fitness_metrics, workouts, devices, caregiver_links,
-- b2c_subscriptions, settings, consents, ruoli, ...) + auth.users (identità).
-- audit_logs/sync_events vanno a SET NULL (traccia anonima preservata).
-- Exception-safe per riga (es. gyms.owner ON DELETE RESTRICT non blocca il batch).
-- search_path vuoto = hardening (tutto schema-qualified).
create or replace function public.gdpr_process_deletions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  n integer := 0;
begin
  for uid in
    select pc.user_id
    from public.privacy_consents pc
    where pc.data_deletion_requested_at is not null
      and pc.data_deletion_completed_at is null
      and pc.data_deletion_requested_at < now() - interval '24 hours'
  loop
    begin
      delete from public.profiles where id = uid;
      delete from auth.users where id = uid;
      n := n + 1;
    exception when others then
      raise warning 'gdpr deletion skipped for %: %', uid, sqlerrm;
    end;
  end loop;
  return n;
end;
$$;

revoke all on function public.gdpr_process_deletions() from public, anon, authenticated;

-- Cron ogni 10 min (così la promessa "entro 24h" regge: richiesta + 24h grace,
-- poi prossimo tick entro minuti).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'process-deletions') then
    perform cron.unschedule('process-deletions');
  end if;
end $$;

select cron.schedule(
  'process-deletions',
  '*/10 * * * *',
  $$ select public.gdpr_process_deletions(); $$
);
