-- Schema minimo per testare public.get_entitlement_status() (migration
-- 20260728110000, REALE, non riscritta) e l'hardening di grant_b2c_trial
-- (migration 20260728100000, REALE) su supabase/postgres reale
-- (auth.users/auth.uid() veri). Non un replay completo delle 45 migration
-- del repo (known-issues.md, gia' documentato, blocca un replay letterale
-- da zero) — solo le tabelle/funzioni REALMENTE lette da queste due
-- migration, copiate 1:1 dalle migration originali (20260513120001,
-- 20260514120004, 20260514120006).
set role postgres;

-- Da 20260513120001_init_profiles_roles.sql (colonne reali, senza gli
-- helper has_role/is_admin non necessari qui).
-- expires_at aggiunta da 20260610120001_user_roles_expiry.sql (NULL =
-- permanente, valorizzata = valida fino a quella data). Inclusa qui perche'
-- get_entitlement_status DEVE filtrarla: senza, un reward a tempo scaduto
-- (ring-reward 6 mesi, reward Play 1 anno) verrebbe letto come permanente.
create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'admin', 'caregiver', 'support', 'dev', 'pro')),
  granted_at timestamptz not null default now(),
  granted_by uuid,
  note text,
  expires_at timestamptz,
  primary key (user_id, role)
);

-- Da 20260514120004_init_b2c_subs.sql — colonne reali, incluso
-- is_b2c_lifetime() copiata verbatim (stessa definizione, stesso commento).
create table public.b2c_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  billing_source text not null
    check (billing_source in ('google_play','apple_iap','stripe','trial')),
  external_product_id text not null,
  external_subscription_id text not null,
  external_order_id text,
  active_until timestamptz not null,
  auto_renewing boolean not null default true,
  state text not null default 'active'
    check (state in ('active','grace','on_hold','paused','expired','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_source, external_subscription_id)
);

-- NOTA harness: il parametro reale in produzione si chiama `row` (visto
-- verbatim in 20260514120004_init_b2c_subs.sql). Su questa immagine
-- Postgres (15.8.1.085) `row` come nome di parametro da' un syntax error
-- (parola riservata) — rinominato `p_row` SOLO in questo stub di test,
-- comportamento e firma di chiamata posizionale identici (il nome del
-- parametro non fa parte della regprocedure). Da segnalare: se questo
-- stesso `create or replace` venisse mai rieseguito in produzione con
-- questa esatta sintassi, andrebbe verificato che il Postgres reale di
-- Supabase lo accetti (non testato qui, la funzione live non viene
-- toccata da nessuna migration di questo sprint).
create or replace function public.is_b2c_lifetime(p_row public.b2c_subscriptions)
returns boolean
language sql
immutable
as $$
  select p_row.active_until > '9000-01-01'::timestamptz;
$$;

-- Da 20260514120006_sprint0_fixes.sql, versione "race-safe via ON CONFLICT"
-- realmente live — necessaria qui SOLO perche' la migration di hardening
-- (20260728100000) fa `revoke execute on function public.grant_b2c_trial()`
-- e fallirebbe se la funzione non esistesse.
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

grant execute on function public.grant_b2c_trial() to authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.user_roles, public.b2c_subscriptions to authenticated, service_role;

create schema if not exists test;

-- Helper di test, stesso pattern gia' verificato in
-- supabase/tests/founder_p010a/01-test-helpers.sql: solo auth.users
-- (nessun public.profiles qui, get_entitlement_status non lo legge).
create or replace function test.mkuser(p_email text, p_created_at timestamptz default now())
returns uuid
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, created_at) values (v_id, p_email, p_created_at);
  return v_id;
end;
$$;

-- Helper di test: esegue get_entitlement_status() impersonando l'utente
-- indicato. auth.uid() reale su questa immagine legge
-- current_setting('request.jwt.claim.sub', true) (GUC dot-path, non JSON
-- request.jwt.claims) — verificato via pg_get_functiondef('auth.uid()')
-- prima di scrivere questo helper.
create or replace function test.call_as(p_user_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_result jsonb;
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
  v_result := public.get_entitlement_status();
  reset role;
  return v_result;
end;
$$;
