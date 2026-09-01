-- ─────────────────────────────────────────────────────────
-- Migration 011 — B2C subscriptions
-- Supporta acquisti via Google Play (e futuro Apple IAP):
--   1. Subscription product 'fitmesh_b2c_semi_annual' (0,99€/6mo)
--   2. One-time non-consumable 'fitmesh_b2c_lifetime' (3,99€)
--   3. Trial 7gg al primo install (billing_source='trial')
--   Lifetime: active_until = '9999-12-31', auto_renewing=false.
-- ─────────────────────────────────────────────────────────

create table public.b2c_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  -- 'trial' = 7gg gratis al primo install (one-time per user).
  billing_source text not null
    check (billing_source in ('google_play','apple_iap','stripe','trial')),
  external_product_id text not null,
  external_subscription_id text not null,
  external_order_id text,
  active_until timestamptz not null,
  auto_renewing boolean not null default true,
  state text not null default 'active'
    check (state in ('active','grace','on_hold','paused','expired','cancelled')),
  last_notification_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_source, external_subscription_id)
);

create index b2c_subscriptions_state_idx
  on public.b2c_subscriptions (state, active_until);

-- Helper boolean predicato lifetime: active_until oltre 100 anni dal now()
-- e' il sentinel "mai scade" (in pratica '9999-12-31').
-- IMMUTABLE per essere usabile in CREATE INDEX, ma usato anche in WHERE.
create or replace function public.is_b2c_lifetime(sub public.b2c_subscriptions)
returns boolean
language sql
immutable
as $$
  select sub.active_until > '9000-01-01'::timestamptz;
$$;

create trigger trg_b2c_subscriptions_updated_at
  before update on public.b2c_subscriptions
  for each row execute function public.set_updated_at();

comment on table public.b2c_subscriptions is
  'B2C consumer subs. Lifetime = active_until > 9000-01-01 (sentinel). Trial 7gg = billing_source=trial.';

comment on function public.is_b2c_lifetime is
  'TRUE se sub e lifetime (active_until oltre il 9000). Immutable.';

-- ─── RLS b2c_subscriptions ────────────────────────────────
alter table public.b2c_subscriptions enable row level security;

create policy "self reads own b2c sub"
  on public.b2c_subscriptions for select to authenticated
  using (user_id = auth.uid());

create policy "admin reads all b2c subs"
  on public.b2c_subscriptions for select to authenticated
  using (public.is_admin());
-- INSERT/UPDATE/DELETE: solo via service_role (backend Play verify endpoint).
-- ECCEZIONE: grant_b2c_trial() in migration 012 inserisce row trial come SECURITY DEFINER.
