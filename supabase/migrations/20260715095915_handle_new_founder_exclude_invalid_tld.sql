-- Backfillata nel repository il 2026-07-19 (Founder P0 review, punto 3):
-- contenuto verbatim recuperato da supabase_migrations.schema_migrations.
create or replace function public.handle_new_founder()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  founder_cap constant int := 1000;
  taken int;
begin
  -- P0 fix (2026-07-14): il dominio .invalid e' riservato per test/documentazione
  -- (RFC 2606), garantito non essere mai un indirizzo reale raggiungibile.
  -- Trovato: 3 account QA sintetici di Build 189 hanno ricevuto founder-launch
  -- pro automaticamente, consumando posti reali dal cap dei 1000, prima di
  -- questo fix. Nessun utente organico puo' avere un'email .invalid, quindi
  -- questa guardia non tocca in alcun modo i segnali reali.
  if new.email ilike '%.invalid' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('founder-launch-grant'));

  select count(*) into taken
  from public.user_roles
  where note = 'founder-launch';

  if taken < founder_cap then
    insert into public.user_roles (user_id, role, expires_at, note)
    values (new.id, 'pro', null, 'founder-launch')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$function$;
