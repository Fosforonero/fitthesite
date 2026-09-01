create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  update public.devices    set revoked_by = null where revoked_by = uid;
  update public.user_roles set granted_by = null where granted_by = uid;

  delete from public.groups where owner_id      = uid;
  delete from public.gyms   where owner_user_id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;