-- Helper SECURITY DEFINER per assegnare role='pro' a un utente da email.
-- Usato per beta tester closed beta (accesso Pro gratuito a vita).
-- Idempotente: ON CONFLICT DO NOTHING.
-- Restituisce JSON: {found: bool, user_id: uuid|null, granted: bool}

create or replace function public.grant_pro_to_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_granted boolean;
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

  get diagnostics v_granted = row_count;

  return jsonb_build_object(
    'found', true,
    'user_id', v_user_id,
    'granted', v_granted > 0,
    'email', p_email
  );
end;
$$;

revoke all on function public.grant_pro_to_email(text) from public, anon, authenticated;
grant execute on function public.grant_pro_to_email(text) to service_role;

comment on function public.grant_pro_to_email(text) is
  'Assegna role=pro a un utente identificato per email (lookup case-insensitive in auth.users). '
  'Idempotente. Solo service_role può chiamarla. '
  'Usato per gift Pro a vita ai beta tester closed beta.';