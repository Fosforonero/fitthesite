-- ─────────────────────────────────────────────────────────
-- Migration 008 — Gym Core: tiers + gyms + memberships +
--   subscriptions + email_invites + helper functions
-- Source: docs/superpowers/specs/2026-05-13-gym-social-design.md
-- ─────────────────────────────────────────────────────────

-- ─── gym_tiers: catalogo tier palestra ────────────────────
create table public.gym_tiers (
  id text primary key,
  display_name text not null,
  features jsonb not null,
  stripe_price_id text,
  monthly_price_cents int,
  created_at timestamptz not null default now()
);

comment on table public.gym_tiers is
  'Catalogo tier palestra. Seed iniziale: base/advanced/premium/custom.';

-- Seed iniziale dei 4 tier (prezzi rivedibili)
insert into public.gym_tiers (id, display_name, features, monthly_price_cents) values
  ('base', 'Base', jsonb_build_object(
    'max_concurrent_challenges', 1,
    'inter_gym', false,
    'one_v_one', false,
    'analytics', false,
    'branded', false,
    'white_label', false,
    'api_access', false,
    'priority_support', false
  ), 2900),
  ('advanced', 'Advanced', jsonb_build_object(
    'max_concurrent_challenges', 3,
    'inter_gym', true,
    'one_v_one', true,
    'analytics', true,
    'branded', false,
    'white_label', false,
    'api_access', false,
    'priority_support', false
  ), 5900),
  ('premium', 'Premium', jsonb_build_object(
    'max_concurrent_challenges', -1,
    'inter_gym', true,
    'one_v_one', true,
    'analytics', true,
    'branded', true,
    'white_label', false,
    'api_access', true,
    'priority_support', true
  ), 12900),
  ('custom', 'Custom', jsonb_build_object(
    'max_concurrent_challenges', -1,
    'inter_gym', true,
    'one_v_one', true,
    'analytics', true,
    'branded', true,
    'white_label', true,
    'api_access', true,
    'priority_support', true,
    'dedicated_support', true
  ), null);

-- ─── gyms: palestre clienti ───────────────────────────────
create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  tier_id text not null references public.gym_tiers(id) default 'base',
  status text not null default 'trial'
    check (status in ('trial','active','lapsed','suspended')),
  trial_ends_at timestamptz,
  stripe_customer_id text unique,
  city text,
  country text default 'IT',
  logo_url text,
  brand_color text check (brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gyms_owner_idx on public.gyms (owner_user_id);
create index gyms_status_idx on public.gyms (status);

create trigger trg_gyms_updated_at
  before update on public.gyms
  for each row execute function public.set_updated_at();

comment on table public.gyms is
  'Palestre clienti SaaS. owner_user_id punta al profilo del titolare.';

-- ─── gym_memberships: storia + active membership ──────────
create table public.gym_memberships (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  role text not null default 'member'
    check (role in ('member','trainer','owner'))
);

-- Vincolo: 1 sola membership attiva (left_at IS NULL) per user.
-- IMMUTABLE: predicato basato su colonna fissa `left_at`, non su `now()`.
create unique index gym_memberships_one_active_idx
  on public.gym_memberships (user_id)
  where left_at is null;

create index gym_memberships_gym_active_idx
  on public.gym_memberships (gym_id) where left_at is null;
create index gym_memberships_user_history_idx
  on public.gym_memberships (user_id, joined_at desc);

comment on table public.gym_memberships is
  'Membership storiche. left_at NULL = membership attiva (al massimo 1 per user).';

-- ─── gym_subscriptions: collegamento a Stripe ─────────────
create table public.gym_subscriptions (
  gym_id uuid primary key references public.gyms(id) on delete cascade,
  stripe_subscription_id text not null unique,
  tier_id text not null references public.gym_tiers(id),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gym_subscriptions_tier_idx on public.gym_subscriptions (tier_id);

create trigger trg_gym_subscriptions_updated_at
  before update on public.gym_subscriptions
  for each row execute function public.set_updated_at();

comment on table public.gym_subscriptions is
  'Mapping gym -> Stripe subscription. tier_id qui authoritative per il billing.';

-- ─── gym_email_invites: attivazione membri via email ──────
create table public.gym_email_invites (
  id bigserial primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  email text not null check (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  invited_by uuid not null references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_user_id uuid references public.profiles(id) on delete set null
);

create unique index gym_email_invites_gym_email_open_idx
  on public.gym_email_invites (gym_id, lower(email))
  where accepted_at is null;
create index gym_email_invites_email_open_idx
  on public.gym_email_invites (lower(email))
  where accepted_at is null;

comment on table public.gym_email_invites is
  'Invitazioni email aperte = accepted_at NULL. Unique per (gym, email) finché aperto.';

-- ─── Helper: is_gym_owner(gym_id) ─────────────────────────
create or replace function public.is_gym_owner(check_gym_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists(
    select 1 from public.gyms
    where id = check_gym_id and owner_user_id = auth.uid()
  );
$$;
grant execute on function public.is_gym_owner(uuid) to authenticated;

-- ─── Helper: active_gym_id(user_id) ───────────────────────
create or replace function public.active_gym_id(check_user_id uuid)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select gym_id from public.gym_memberships
   where user_id = check_user_id and left_at is null
   limit 1;
$$;
grant execute on function public.active_gym_id(uuid) to authenticated;

-- ─── Helper: has_premium_access(user_id) ──────────────────
-- TRUE se: (a) membership attiva in palestra con status active/trial,
--         (b) OR b2c_subscription attiva (rispetta sentinel lifetime).
-- NB: la tabella b2c_subscriptions viene creata in migration 011; questa
-- funzione contiene reference dinamica via EXECUTE per evitare dipendenza
-- d'ordine. Refactor in funzione SQL una volta che 011 è applicata.
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
  -- Via gym membership
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

  -- Via b2c subscription (skip se tabella non esiste ancora — migration 011)
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
grant execute on function public.has_premium_access(uuid) to authenticated;

-- ─── RLS gyms ─────────────────────────────────────────────
alter table public.gyms enable row level security;

create policy "owner manages gym"
  on public.gyms for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "member selects own gym"
  on public.gyms for select to authenticated
  using (id = public.active_gym_id(auth.uid()));

create policy "admin selects all gyms"
  on public.gyms for select to authenticated
  using (public.is_admin());

-- ─── RLS gym_tiers (read-only public) ─────────────────────
alter table public.gym_tiers enable row level security;

create policy "anyone reads tiers"
  on public.gym_tiers for select to authenticated
  using (true);

create policy "admin manages tiers"
  on public.gym_tiers for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── RLS gym_memberships ──────────────────────────────────
alter table public.gym_memberships enable row level security;

create policy "self selects membership"
  on public.gym_memberships for select to authenticated
  using (user_id = auth.uid());

create policy "gym owner selects members"
  on public.gym_memberships for select to authenticated
  using (public.is_gym_owner(gym_id));

create policy "admin selects all memberships"
  on public.gym_memberships for select to authenticated
  using (public.is_admin());

-- INSERT: solo via SECURITY DEFINER function redeem_invite_code/accept_email_invite.
-- UPDATE: solo per "leave" — self set left_at = now()
create policy "self leaves own membership"
  on public.gym_memberships for update to authenticated
  using (user_id = auth.uid() and left_at is null)
  with check (user_id = auth.uid() and left_at is not null);

-- Gym owner può rimuovere un membro (set left_at)
create policy "gym owner removes member"
  on public.gym_memberships for update to authenticated
  using (public.is_gym_owner(gym_id) and left_at is null)
  with check (public.is_gym_owner(gym_id) and left_at is not null);

-- ─── RLS gym_subscriptions ────────────────────────────────
alter table public.gym_subscriptions enable row level security;

create policy "owner reads own subscription"
  on public.gym_subscriptions for select to authenticated
  using (public.is_gym_owner(gym_id));

create policy "admin reads all subscriptions"
  on public.gym_subscriptions for select to authenticated
  using (public.is_admin());
-- INSERT/UPDATE/DELETE solo via service_role (webhook Stripe).

-- ─── RLS gym_email_invites ────────────────────────────────
alter table public.gym_email_invites enable row level security;

create policy "owner manages invites"
  on public.gym_email_invites for all to authenticated
  using (public.is_gym_owner(gym_id))
  with check (public.is_gym_owner(gym_id));

-- L'invitato (post-signup) vede inviti rivolti alla sua email
create policy "invitee sees own invites"
  on public.gym_email_invites for select to authenticated
  using (
    lower(email) = (select lower(p.email) from public.profiles p where p.id = auth.uid())
  );
