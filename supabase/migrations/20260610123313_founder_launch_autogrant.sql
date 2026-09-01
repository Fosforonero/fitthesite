-- Auto-grant founder: i primi 1000 nuovi account ricevono Pro LIFETIME (expires_at = null).
-- Trigger su public.profiles (non auth.users) così la FK user_roles→profiles
-- è già soddisfatta quando scatta, indipendentemente dall'ordine dei trigger.
--
-- Monitoraggio: select count(*) from user_roles where note = 'founder-launch';
-- Per cambiare il cap: alter la costante in questa funzione e re-deploy.
-- Per CHIUDERE la promo prima del cap: drop trigger on_profile_created_founder
--   on public.profiles;  (i grant già dati restano validi fino a scadenza)

create or replace function public.handle_new_founder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  founder_cap constant int := 1000;
  taken int;
begin
  -- Lock advisory: evita overshoot del cap su signup concorrenti.
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
$$;

drop trigger if exists on_profile_created_founder on public.profiles;
create trigger on_profile_created_founder
  after insert on public.profiles
  for each row execute function public.handle_new_founder();
