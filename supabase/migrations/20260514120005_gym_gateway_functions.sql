-- ─────────────────────────────────────────────────────────
-- Migration 012 — Gateway functions (SECURITY DEFINER)
-- Tutti gli INSERT su gym_memberships e challenge_participants
-- passano da queste funzioni che validano ownership + auth.uid().
-- ─────────────────────────────────────────────────────────

-- ─── redeem_invite_code(code) ─────────────────────────────
-- Validates: code matches gym, user not already in active membership,
--            gym is in 'trial' or 'active' status.
create or replace function public.redeem_invite_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_gym_id uuid;
  v_gym_status text;
  v_user_id uuid;
  v_membership_id bigint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select id, status into v_gym_id, v_gym_status
  from public.gyms
  where invite_code = upper(p_code);

  if v_gym_id is null then
    raise exception 'Invalid invite code' using errcode = 'P0002';
  end if;

  if v_gym_status not in ('trial','active') then
    raise exception 'Gym is not accepting members (status: %)', v_gym_status
      using errcode = 'P0001';
  end if;

  if exists(
    select 1 from public.gym_memberships
    where user_id = v_user_id and left_at is null
  ) then
    raise exception 'Already member of another gym (leave first)'
      using errcode = 'P0001';
  end if;

  insert into public.gym_memberships (user_id, gym_id, role)
  values (v_user_id, v_gym_id, 'member')
  returning id into v_membership_id;

  return v_gym_id;
end;
$$;

grant execute on function public.redeem_invite_code(text) to authenticated;

comment on function public.redeem_invite_code is
  'Join palestra via codice 6-digit. Ritorna gym_id su successo.';

-- ─── accept_email_invite(invite_id) ───────────────────────
create or replace function public.accept_email_invite(p_invite_id bigint)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite record;
  v_user_id uuid;
  v_user_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select email into v_user_email from public.profiles where id = v_user_id;

  select * into v_invite from public.gym_email_invites
  where id = p_invite_id
    and lower(email) = lower(v_user_email)
    and accepted_at is null
    and expires_at > now();

  if v_invite.id is null then
    raise exception 'Invite not found or expired' using errcode = 'P0002';
  end if;

  if exists(
    select 1 from public.gym_memberships
    where user_id = v_user_id and left_at is null
  ) then
    raise exception 'Already member of another gym (leave first)'
      using errcode = 'P0001';
  end if;

  insert into public.gym_memberships (user_id, gym_id, role)
  values (v_user_id, v_invite.gym_id, 'member');

  update public.gym_email_invites
  set accepted_at = now(), accepted_user_id = v_user_id
  where id = p_invite_id;

  return v_invite.gym_id;
end;
$$;

grant execute on function public.accept_email_invite(bigint) to authenticated;

comment on function public.accept_email_invite is
  'Accetta invito email. Verifica match email + non scaduto.';

-- ─── join_challenge(challenge_id, device_id) ──────────────
create or replace function public.join_challenge(
  p_challenge_id uuid,
  p_device_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_challenge record;
  v_user_gym_id uuid;
  v_device_owner uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select user_id into v_device_owner from public.devices where id = p_device_id;
  if v_device_owner is null then
    raise exception 'Device not found' using errcode = 'P0002';
  end if;
  if v_device_owner <> v_user_id then
    raise exception 'Device does not belong to caller' using errcode = '42501';
  end if;

  select * into v_challenge from public.challenges where id = p_challenge_id;
  if v_challenge.id is null then
    raise exception 'Challenge not found' using errcode = 'P0002';
  end if;

  if v_challenge.status not in ('draft','active') then
    raise exception 'Challenge not joinable (status: %)', v_challenge.status
      using errcode = 'P0001';
  end if;

  if v_challenge.period_end < now() then
    raise exception 'Challenge has ended' using errcode = 'P0001';
  end if;

  if v_challenge.gym_id is not null then
    v_user_gym_id := public.active_gym_id(v_user_id);
    if v_user_gym_id is null or v_user_gym_id <> v_challenge.gym_id then
      if v_challenge.participant_type = 'gym_vs_gym' and exists(
        select 1 from public.challenge_gym_scores cgs
        where cgs.challenge_id = p_challenge_id
          and cgs.gym_id = v_user_gym_id
      ) then
        null;
      else
        raise exception 'Not a member of this gym' using errcode = '42501';
      end if;
    end if;
  else
    if not public.has_premium_access(v_user_id) then
      raise exception 'Premium access required for public challenges'
        using errcode = '42501';
    end if;
  end if;

  insert into public.challenge_participants (challenge_id, user_id, device_id_used)
  values (p_challenge_id, v_user_id, p_device_id)
  on conflict (challenge_id, user_id) do nothing;

  insert into public.challenge_scores (challenge_id, user_id, score)
  values (p_challenge_id, v_user_id, 0)
  on conflict do nothing;
end;
$$;

grant execute on function public.join_challenge(uuid, uuid) to authenticated;

comment on function public.join_challenge is
  'Opt-in challenge con device picker. Verifica membership/premium.';

-- ─── leave_challenge(challenge_id) ────────────────────────
create or replace function public.leave_challenge(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  delete from public.challenge_participants
  where challenge_id = p_challenge_id and user_id = v_user_id;

  delete from public.challenge_scores
  where challenge_id = p_challenge_id and user_id = v_user_id;
end;
$$;

grant execute on function public.leave_challenge(uuid) to authenticated;

comment on function public.leave_challenge is
  'Abbandono challenge. Rimuove participation e score.';

-- ─── disqualify_participant(challenge_id, user_id, reason) ─
create or replace function public.disqualify_participant(
  p_challenge_id uuid,
  p_user_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller_id uuid;
  v_challenge_gym uuid;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if length(coalesce(p_reason,'')) < 5 then
    raise exception 'Reason must be at least 5 characters' using errcode = 'P0001';
  end if;

  select gym_id into v_challenge_gym from public.challenges where id = p_challenge_id;
  if v_challenge_gym is null then
    raise exception 'Challenge has no owning gym (cannot disqualify)'
      using errcode = 'P0001';
  end if;

  if not public.is_gym_owner(v_challenge_gym) then
    raise exception 'Only gym owner can disqualify' using errcode = '42501';
  end if;

  insert into public.disqualifications (challenge_id, user_id, disqualified_by, reason)
  values (p_challenge_id, p_user_id, v_caller_id, p_reason)
  on conflict (challenge_id, user_id) do update
    set disqualified_by = excluded.disqualified_by,
        reason = excluded.reason,
        created_at = now();

  update public.challenge_scores
  set score = 0, rank = null
  where challenge_id = p_challenge_id and user_id = p_user_id;
end;
$$;

grant execute on function public.disqualify_participant(uuid, uuid, text) to authenticated;

comment on function public.disqualify_participant is
  'Squalifica manuale. Solo gym owner della challenge.';

-- ─── rotate_invite_code(gym_id) ───────────────────────────
create or replace function public.rotate_invite_code(p_gym_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_new_code text;
  v_attempts int := 0;
begin
  if not public.is_gym_owner(p_gym_id) then
    raise exception 'Only gym owner can rotate code' using errcode = '42501';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_new_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));

    begin
      update public.gyms set invite_code = v_new_code, updated_at = now()
      where id = p_gym_id;
      exit;
    exception when unique_violation then
      if v_attempts > 10 then
        raise exception 'Could not generate unique code after 10 attempts';
      end if;
    end;
  end loop;

  return v_new_code;
end;
$$;

grant execute on function public.rotate_invite_code(uuid) to authenticated;

comment on function public.rotate_invite_code is
  'Genera nuovo invite_code 6-char. Solo owner.';

-- ─── grant_b2c_trial() — trial premium 7gg one-time ───────
-- Idempotente. Crea row b2c_subscriptions con billing_source='trial'
-- se il caller non ha mai consumato un trial ne ha sub attiva.
-- Ritorna TRUE se trial concesso ora, FALSE se gia esistente.
create or replace function public.grant_b2c_trial()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_existing record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select billing_source, state, active_until into v_existing
  from public.b2c_subscriptions
  where user_id = v_user_id;

  if v_existing is not null then
    return false;
  end if;

  insert into public.b2c_subscriptions (
    user_id,
    billing_source,
    external_product_id,
    external_subscription_id,
    active_until,
    auto_renewing,
    state
  ) values (
    v_user_id,
    'trial',
    'fitmesh_b2c_trial_7d',
    'trial-' || v_user_id::text,
    now() + interval '7 days',
    false,
    'active'
  );

  return true;
end;
$$;

grant execute on function public.grant_b2c_trial() to authenticated;

comment on function public.grant_b2c_trial is
  'Trial premium 7gg one-time. Idempotente: blocca un secondo trial sullo stesso user.';
