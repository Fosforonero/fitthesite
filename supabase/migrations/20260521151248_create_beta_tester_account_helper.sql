-- Helper per pre-creare account beta tester closed beta.
-- Crea auth.users + auth.identities + grant role='pro' in user_roles.
-- Email_confirmed_at = now() così l'utente fa subito login.
-- Idempotente: se l'email esiste già, fa solo il grant role.
-- Solo service_role può chiamarla.
create or replace function public.create_beta_tester_account(
  p_email text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_existing uuid;
  v_normalized_email text;
begin
  v_normalized_email := lower(trim(p_email));

  -- Idempotente: se esiste già, fai solo il grant role
  select id into v_existing from auth.users
  where lower(email) = v_normalized_email limit 1;

  if v_existing is not null then
    insert into public.user_roles (user_id, role, note)
    values (v_existing, 'pro', 'beta tester closed beta — pre-grant')
    on conflict (user_id, role) do nothing;
    return jsonb_build_object(
      'email', v_normalized_email,
      'created', false,
      'user_id', v_existing,
      'role_granted', true,
      'reason', 'already_exists'
    );
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id, 'authenticated', 'authenticated',
    v_normalized_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '', '', '', ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_normalized_email,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_normalized_email,
      'email_verified', true
    ),
    'email',
    now(), now(), now()
  );

  insert into public.user_roles (user_id, role, note)
  values (v_user_id, 'pro', 'beta tester closed beta — pre-grant')
  on conflict (user_id, role) do nothing;

  return jsonb_build_object(
    'email', v_normalized_email,
    'created', true,
    'user_id', v_user_id,
    'role_granted', true
  );
end;
$$;

revoke all on function public.create_beta_tester_account(text, text) from public, anon, authenticated;
grant execute on function public.create_beta_tester_account(text, text) to service_role;

comment on function public.create_beta_tester_account(text, text) is
  'Pre-crea account beta tester con email confermata + role pro. '
  'Password temporanea da cambiare al primo login. Solo service_role.';