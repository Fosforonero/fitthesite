-- GDPR art.17: esegue le richieste di cancellazione scadute (grace 24h).
-- Cancella profiles (cascade su tutti i dati utente) + auth.users (identità).
-- Idempotente, exception-safe per riga (es. gyms RESTRICT). search_path vuoto (hardening).
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