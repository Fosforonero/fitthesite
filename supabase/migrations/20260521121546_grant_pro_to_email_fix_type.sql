create or replace function public.grant_pro_to_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_rows int;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    return jsonb_build_object(
      'found', false,
      'user_id', null,
      'granted', false,
      'email', p_email
    );
  end if;

  insert into public.user_roles (user_id, role, note)
  values (v_user_id, 'pro', 'beta tester closed beta — accesso Pro gratuito a vita')
  on conflict (user_id, role) do nothing;

  get diagnostics v_rows = row_count;

  return jsonb_build_object(
    'found', true,
    'user_id', v_user_id,
    'granted', v_rows > 0,
    'email', p_email
  );
end;
$$;