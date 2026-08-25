-- Preambolo per il Postgres 17 usa-e-getta.
-- Ricrea SOLO cio' che una istanza Supabase fornisce gia' e che nessuna
-- migration del repository crea: i ruoli di piattaforma e gli schemi di
-- sistema. Non fa parte della catena delle migration e non va mai applicato
-- a un database Supabase.
--
-- I flag rolbypassrls riproducono quelli misurati in produzione il
-- 25/08/2026: postgres e service_role li hanno, anon e authenticated no.
-- Non e' un dettaglio: e' cio' che rende is_admin() non ricorsiva e che
-- rende equivalenti le due forme della policy su founder_grants.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login noinherit password 'usaegetta';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    create role supabase_admin nologin noinherit bypassrls;
  end if;
end $$;

grant anon, authenticated, service_role to authenticator;

-- postgres qui e' gia' superuser, che implica il bypass RLS del proprietario.

create schema if not exists auth;
create schema if not exists extensions;
create schema if not exists graphql_public;

-- auth.users: solo le colonne che le migration di questo repository leggono.
create table if not exists auth.users (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  instance_id uuid,
  aud text,
  role text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  confirmation_token text,
  recovery_token text,
  email_change_token_new text,
  email_change text
);

create table if not exists auth.identities (
  id uuid primary key,
  provider_id text,
  user_id uuid references auth.users(id) on delete cascade,
  identity_data jsonb,
  provider text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')
$$;

create or replace function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- pg_cron e pg_net non esistono nell'immagine postgres:17 standard.
-- Vengono simulati con lo stesso contratto di superficie che le migration
-- usano: cron.schedule / cron.unschedule / cron.job, net.http_post.
-- Serve a far ATTRAVERSARE la catena, non a eseguire davvero i job: il
-- confronto strutturale col live sui job cron va fatto sulla tabella cron.job
-- di questo container, che registra quello che le migration hanno chiesto.
-- ---------------------------------------------------------------------------
create schema if not exists cron;
create table if not exists cron.job (
  jobid bigserial primary key,
  schedule text not null,
  command text not null,
  nodename text default 'localhost',
  nodeport integer default 5432,
  database text default current_database(),
  username text default current_user,
  active boolean default true,
  jobname text unique
);

create or replace function cron.schedule(job_name text, schedule text, command text)
returns bigint language plpgsql as $$
declare v_id bigint;
begin
  delete from cron.job where jobname = job_name;
  insert into cron.job (schedule, command, jobname) values (schedule, command, job_name)
  returning jobid into v_id;
  return v_id;
end $$;

create or replace function cron.schedule(schedule text, command text)
returns bigint language plpgsql as $$
declare v_id bigint;
begin
  insert into cron.job (schedule, command, jobname)
  values (schedule, command, 'anonimo_' || nextval('cron.job_jobid_seq')::text)
  returning jobid into v_id;
  return v_id;
end $$;

create or replace function cron.unschedule(job_name text)
returns boolean language plpgsql as $$
begin
  delete from cron.job where jobname = job_name;
  return true;
end $$;

create or replace function cron.unschedule(job_id bigint)
returns boolean language plpgsql as $$
begin
  delete from cron.job where jobid = job_id;
  return true;
end $$;

create schema if not exists net;
create table if not exists net.chiamate (id bigserial primary key, url text, chiamata_il timestamptz default now());
create or replace function net.http_post(url text, body jsonb default '{}'::jsonb,
       params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb,
       timeout_milliseconds integer default 5000)
returns bigint language plpgsql as $$
declare v_id bigint;
begin
  insert into net.chiamate (url) values (url) returning id into v_id;
  return v_id;
end $$;

-- Le due estensioni simulate: i control file vengono installati nel container
-- da esegui-reset.sh prima di questo preambolo. Qui si limitano a registrarsi,
-- perche' gli oggetti cron.* e net.* li ha gia' creati il preambolo sopra.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- Privilegi di default sullo schema public.
-- Un progetto Supabase li ha configurati: ogni funzione creata in public
-- riceve EXECUTE per anon, authenticated e service_role senza che nessuna
-- migration lo chieda. Un postgres:17 nudo no. Senza questa riga il confronto
-- delle concessioni col live e' privo di senso, perche' misura una differenza
-- di piattaforma invece che una differenza della catena.
-- ---------------------------------------------------------------------------
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
