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