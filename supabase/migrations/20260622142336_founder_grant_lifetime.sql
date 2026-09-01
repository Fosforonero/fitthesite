-- Aggiorna il trigger founder: da Pro 1 anno → Pro lifetime (expires_at = null)
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