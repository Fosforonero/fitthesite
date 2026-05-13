-- ─────────────────────────────────────────────────────────
-- Migration 013 — Sprint 0 critical fixes (post final review)
-- Vedi review report 2026-05-13. Fix:
--  1. FK NOT NULL + ON DELETE SET NULL contraddittori (3 colonne)
--  2. challenge_leaderboard_v rotta con security_invoker → SECURITY DEFINER fn
--  3. Probing vulnerability su active_gym_id/has_premium_access(uuid arg)
--  4. Robustezza: rotate_invite_code alphabet, grant_b2c_trial race,
--     accept_email_invite NULL check, errcode mancante.
-- ─────────────────────────────────────────────────────────

-- ─── 1. Drop NOT NULL su FK con ON DELETE SET NULL ────────
-- Permette la cancellazione del profilo riferito senza rompere CASCADE.
alter table public.challenges
  alter column created_by drop not null;
alter table public.gym_email_invites
  alter column invited_by drop not null;
alter table public.disqualifications
  alter column disqualified_by drop not null;

comment on column public.challenges.created_by is
  'NULL = creatore cancellato. Audit conserva la row.';
comment on column public.gym_email_invites.invited_by is
  'NULL = inviter cancellato. Audit conserva la row.';
comment on column public.disqualifications.disqualified_by is
  'NULL = trainer cancellato. Audit conserva la row.';

-- ─── 2. Sostituisce challenge_leaderboard_v con funzione SECURITY DEFINER ─
-- La view con security_invoker=on era rotta: profiles RLS blocca i JOIN
-- cross-user, ogni partecipante appariva come "Account eliminato".
-- Sostituiamo con funzione che:
--   - verifica che il caller sia partecipante / owner / admin della challenge
--   - bypassa la RLS profiles via SECURITY DEFINER
--   - applica lo stesso masking (Ex-membro / Account eliminato)
drop view if exists public.challenge_leaderboard_v;

create or replace function public.challenge_leaderboard(p_challenge_id uuid)
returns table (
  user_id uuid,
  display_name text,
  score numeric,
  rank int,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
stable
as $$
declare
  v_caller uuid;
  v_authorized boolean;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Authorization: partecipante della challenge OR owner della gym OR admin
  select exists(
    select 1 from public.challenge_participants
    where challenge_id = p_challenge_id and challenge_participants.user_id = v_caller
  ) or exists(
    select 1 from public.challenges c
    where c.id = p_challenge_id
      and c.gym_id is not null
      and public.is_gym_owner(c.gym_id)
  ) or public.is_admin()
  into v_authorized;

  if not v_authorized then
    raise exception 'Not authorized to view this leaderboard' using errcode = '42501';
  end if;

  return query
  select
    cs.user_id,
    case
      when p.id is null then 'Account eliminato'
      when m.left_at is not null then 'Ex-membro'
      else coalesce(p.display_name, 'Anonimo')
    end::text as display_name,
    cs.score,
    cs.rank,
    cs.updated_at
  from public.challenge_scores cs
  left join public.profiles p on p.id = cs.user_id
  left join public.gym_memberships m
    on m.user_id = cs.user_id
    and m.gym_id = (select gym_id from public.challenges where id = p_challenge_id)
  where cs.challenge_id = p_challenge_id
  order by cs.rank nulls last, cs.score desc;
end;
$$;

grant execute on function public.challenge_leaderboard(uuid) to authenticated;

comment on function public.challenge_leaderboard is
  'Leaderboard privacy-safe. Maschera ex-member/account eliminati. SECURITY DEFINER.';

-- ─── 3. Fix probing su active_gym_id e has_premium_access ──
-- Aggiungono guard: se check_user_id != auth.uid() (e caller non admin),
-- ritornano NULL/false invece di rivelare info cross-user.

create or replace function public.active_gym_id(check_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
stable
as $$
begin
  if check_user_id <> auth.uid() and not public.is_admin() then
    return null;
  end if;

  return (
    select gym_id from public.gym_memberships
     where user_id = check_user_id and left_at is null
     limit 1
  );
end;
$$;

create or replace function public.has_premium_access(check_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
stable
as $$
declare
  result boolean;
begin
  if check_user_id <> auth.uid() and not public.is_admin() then
    return false;
  end if;

  select exists(
    select 1 from public.gym_memberships m
    join public.gyms g on g.id = m.gym_id
    where m.user_id = check_user_id
      and m.left_at is null
      and g.status in ('trial','active')
  ) into result;

  if result then
    return true;
  end if;

  if to_regclass('public.b2c_subscriptions') is not null then
    execute $b$
      select exists(
        select 1 from public.b2c_subscriptions
        where user_id = $1 and active_until > now()
          and state in ('active','grace')
      )
    $b$ into result using check_user_id;
  end if;

  return coalesce(result, false);
end;
$$;

-- ─── 4. Important fixes ────────────────────────────────────

-- 4a. rotate_invite_code: amplia alphabet da [0-9A-F] (md5) a [0-9A-Z] (36 char)
create or replace function public.rotate_invite_code(p_gym_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_new_code text;
  v_attempts int := 0;
  v_alphabet text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i int;
begin
  if not public.is_gym_owner(p_gym_id) then
    raise exception 'Only gym owner can rotate code' using errcode = '42501';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_new_code := '';
    for i in 1..6 loop
      v_new_code := v_new_code ||
        substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;

    begin
      update public.gyms set invite_code = v_new_code, updated_at = now()
      where id = p_gym_id;
      exit;
    exception when unique_violation then
      if v_attempts > 10 then
        raise exception 'Could not generate unique code after 10 attempts'
          using errcode = 'P0001';
      end if;
    end;
  end loop;

  return v_new_code;
end;
$$;

-- 4b. grant_b2c_trial: race-safe via ON CONFLICT
create or replace function public.grant_b2c_trial()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_inserted_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Race-safe: insert con ON CONFLICT, ritorna FALSE se la row esisteva gia'.
  with ins as (
    insert into public.b2c_subscriptions (
      user_id, billing_source, external_product_id, external_subscription_id,
      active_until, auto_renewing, state
    ) values (
      v_user_id, 'trial', 'fitmesh_b2c_trial_7d',
      'trial-' || v_user_id::text,
      now() + interval '7 days', false, 'active'
    )
    on conflict (user_id) do nothing
    returning 1
  )
  select count(*) into v_inserted_count from ins;

  return v_inserted_count = 1;
end;
$$;

-- 4c. accept_email_invite: guard esplicito su profilo mancante
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

  if v_user_email is null then
    raise exception 'Profile missing for current user' using errcode = 'P0002';
  end if;

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

-- ─── 5. Doc note: gyms.owner_user_id ON DELETE RESTRICT ───
-- Comportamento intenzionale: un owner non puo' cancellare account finche'
-- ha gym associate. Workflow GDPR-compliance da implementare in Sprint 1:
--   1. UI gym dashboard: tasto "Trasferisci proprieta'" oppure "Chiudi palestra"
--   2. Funzione transfer_gym_ownership(gym_id, new_owner_user_id) — Sprint 1
--   3. Funzione close_gym(gym_id) — set status='suspended' + revoke memberships
-- Documentato qui per memoria; nessun cambiamento schema in Sprint 0.

comment on column public.gyms.owner_user_id is
  'ON DELETE RESTRICT: owner non puo cancellare account con gym attive. Vedi flow handoff Sprint 1.';
